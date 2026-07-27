---
id: tidas-package-import
title: TIDAS 数据包导入 API
slug: /docs/openapi/tidas-package-import
description: 使用 API Key 调用 TianGong LCA 的 TIDAS 数据包导入流程。
---

本文档说明如何通过 TianGong LCA 的 Edge Function API 导入 TIDAS ZIP 数据包。
推荐将 API base 设置为对应部署环境的 Edge Function URL，并在其后追加 `/functions/v1`。

## 适用场景

- 从外部系统批量导入 TIDAS ZIP 数据包
- 在自有客户端中复用与产品前端一致的异步导入流程
- 获取导入校验失败、开放数据过滤、用户数据冲突等结构化结果

## 鉴权与基础地址

推荐的鉴权方式为：

```http
Authorization: Bearer <USER_API_KEY>
```

- `USER_API_KEY` 可在 TianGong LCA 平台的账号信息页面生成
- API Key 等同于账号凭证，应按密钥管理，不要写入公开前端或公开仓库
- TianGong LCA 的浏览器会话仍可使用 `USER_JWT`，但外部 API 集成建议使用
  `USER_API_KEY`

基础地址示例：

```text
https://<your-project-ref>.supabase.co/functions/v1
```

如果你使用的是 TianGong LCA 当前云上服务，可直接使用：

```text
https://qgzvkongdjqiiamzbbts.supabase.co/functions/v1
```

## 导入流程总览

完整流程分为 4 步：

1. 调用 `POST /import_tidas_package`，`action=prepare_upload`
2. 将 ZIP 字节上传到返回的签名上传目标
3. 再次调用 `POST /import_tidas_package`，`action=enqueue`
4. 轮询 `GET /tidas_package_jobs/{job_id}`，读取导入结果与报告制品

建议为 `prepare_upload` 和 `enqueue` 请求带上 `X-Idempotency-Key`，便于客户端重试。

## 上传前使用 `tidas` 做本地预检

自动化客户端可以在调用 API 前使用已发布的 Rust
[`tidas` 0.1.1 CLI](/integration/cli#安装-tidas-011) 检查待上传包。先把 ZIP 解压到临时目录，
再执行：

```bash
tidas validate ./unpacked-package \
  --input-format tidas-json \
  --issues ./validation-issues.jsonl \
  --format json
```

退出码 `0` 表示本地校验通过；退出码 `2` 表示校验完成但发现数据问题。流水线应同时检查退出码、
JSON 报告和 `validation-issues.jsonl`，只在本地校验通过后继续上传。

本地预检不会创建 TianGong LCA 导入任务，也不会替代服务端校验、冲突检查和最终
`import_report`。`tidas` 与平台 API 是两个独立执行边界。

## 1. Prepare Upload

请求：

```bash
curl -i --location --request POST "${BASE_URL}/import_tidas_package" \
  --header 'Content-Type: application/json' \
  --header "Authorization: Bearer ${USER_API_KEY}" \
  --header 'X-Idempotency-Key: tidas-import-prepare-001' \
  --data '{
    "action": "prepare_upload",
    "filename": "example-package.zip",
    "byte_size": 123456,
    "content_type": "application/zip"
  }'
```

响应示例：

```json
{
  "ok": true,
  "action": "prepare_upload",
  "job_id": "4a56e7b2-8f18-4f0f-a6b4-cf40f343d8b8",
  "source_artifact_id": "9ad0da68-3933-4f7b-a3cb-a494b70ec0a2",
  "artifact_url": "https://example.supabase.co/storage/v1/object/sign/tidas/import/example-package.zip",
  "upload": {
    "bucket": "tidas",
    "object_path": "imports/example-package.zip",
    "path": "imports/example-package.zip",
    "token": "signed-upload-token",
    "signed_url": "https://example.supabase.co/storage/v1/upload/resumable",
    "expires_in_seconds": 300,
    "filename": "example-package.zip",
    "byte_size": 123456,
    "content_type": "application/zip"
  }
}
```

返回值说明：

- `job_id`：后续轮询任务状态时使用
- `source_artifact_id`：后续 `enqueue` 时必须回传
- `upload.signed_url`：命令行或通用 HTTP 客户端可直接使用的上传地址
- `upload.bucket` + `upload.path` + `upload.token`：适合已接入 Supabase Storage
  SDK 的客户端

## 2. 上传 ZIP 数据

如果返回的 `upload.signed_url` 不为空，推荐直接上传 ZIP：

```bash
curl -i --request PUT "${SIGNED_URL}" \
  --header 'Content-Type: application/zip' \
  --data-binary @./example-package.zip
```

其中 `SIGNED_URL` 即 `prepare_upload` 响应中的 `upload.signed_url`。

如果你的客户端已经接入 Supabase Storage SDK，也可以使用
`upload.bucket`、`upload.path` 和 `upload.token` 调用 `uploadToSignedUrl(...)`：

```ts
const { error } = await supabase.storage
  .from(upload.bucket)
  .uploadToSignedUrl(upload.path, upload.token, file, {
    contentType: upload.content_type,
    upsert: true,
  });
```

## 3. Enqueue

上传完成后，将源制品标记为可消费并入队异步导入任务。

```bash
curl -i --location --request POST "${BASE_URL}/import_tidas_package" \
  --header 'Content-Type: application/json' \
  --header "Authorization: Bearer ${USER_API_KEY}" \
  --header 'X-Idempotency-Key: tidas-import-enqueue-001' \
  --data '{
    "action": "enqueue",
    "job_id": "4a56e7b2-8f18-4f0f-a6b4-cf40f343d8b8",
    "source_artifact_id": "9ad0da68-3933-4f7b-a3cb-a494b70ec0a2",
    "artifact_sha256": "<optional-sha256>",
    "artifact_byte_size": 123456,
    "filename": "example-package.zip",
    "content_type": "application/zip"
  }'
```

响应示例：

```json
{
  "ok": true,
  "mode": "queued",
  "job_id": "4a56e7b2-8f18-4f0f-a6b4-cf40f343d8b8",
  "source_artifact_id": "9ad0da68-3933-4f7b-a3cb-a494b70ec0a2"
}
```

`mode` 可能为：

- `queued`：任务已入队
- `in_progress`：同一任务已在执行
- `completed`：同一任务之前已完成，可直接进入查询阶段

## 4. 轮询任务状态

推荐轮询：

```bash
curl -i --location --request GET "${BASE_URL}/tidas_package_jobs/<job-id>" \
  --header "Authorization: Bearer ${USER_API_KEY}"
```

也支持 `GET /tidas_package_jobs?job_id=<job-id>`，以及 `POST /tidas_package_jobs`
并在 body 中传 `job_id`。

响应重点字段：

- `status`：`queued`、`running`、`completed`、`failed` 等
- `artifacts`：任务关联制品列表
- `artifacts_by_kind.import_report`：导入报告制品
- `artifacts_by_kind.import_report.signed_download_url`：导入报告 JSON 的临时下载地址
- `artifacts_by_kind.import_report.download_status`：报告制品下载状态，例如
  `available`、`not_ready`、`expired`、`deleted`、`object_missing`、
  `storage_path_invalid` 或 `signed_url_failed`
- `artifacts_by_kind.import_report.download_error_code` /
  `download_error_message`：当 `signed_download_url` 为空或不可用时，说明原因与建议操作

当 `status=completed` 时，通常需要继续下载 `import_report`，并以报告内容作为最终业务结果。
如果 `download_status` 不是 `available`，请根据 `download_error_code` 重新创建任务、等待制品就绪，
或排查对象存储路径 / 签名 URL 问题；不要只依赖 `status=completed` 判断报告已经可下载。

## 导入报告与结果语义

导入任务成功完成后，`import_report` 的业务结果通常分为以下几类：

- `IMPORTED`：导入成功
- `USER_DATA_CONFLICT`：与当前用户已有数据冲突，导入被拒绝
- `VALIDATION_FAILED`：数据包校验失败，导入被阻止

这意味着：

- `tidas_package_jobs.status=completed` 不一定代表“数据已入库”
- 是否真正导入成功，应以 `import_report.ok` 与 `import_report.code` 为准

成功示例：

```json
{
  "ok": true,
  "code": "IMPORTED",
  "message": "TIDAS package imported successfully",
  "summary": {
    "total_entries": 42,
    "filtered_open_data_count": 3,
    "user_conflict_count": 0,
    "importable_count": 39,
    "imported_count": 39,
    "validation_issue_count": 0,
    "error_count": 0,
    "warning_count": 0
  },
  "filtered_open_data": [],
  "user_conflicts": [],
  "validation_issues": []
}
```

## 校验失败响应示例

校验由异步 worker 在入队后执行，失败时会通过 `import_report` 返回结构化问题列表。

```json
{
  "ok": false,
  "code": "VALIDATION_FAILED",
  "message": "TIDAS package validation failed",
  "summary": {
    "total_entries": 7,
    "filtered_open_data_count": 0,
    "user_conflict_count": 0,
    "importable_count": 0,
    "imported_count": 0,
    "validation_issue_count": 2,
    "error_count": 1,
    "warning_count": 1
  },
  "filtered_open_data": [],
  "user_conflicts": [],
  "validation_issues": [
    {
      "issue_code": "schema_error",
      "severity": "error",
      "category": "sources",
      "file_path": "sources/a.json",
      "location": "<root>",
      "message": "Schema Error at <root>: missing required field",
      "context": {
        "validator": "required"
      }
    },
    {
      "issue_code": "localized_text_language_error",
      "severity": "warning",
      "category": "processes",
      "file_path": "processes/b.json",
      "location": "processDataSet/name/baseName/0",
      "message": "Localized text error at processDataSet/name/baseName/0: invalid lang",
      "context": {}
    }
  ]
}
```

建议客户端：

- 优先使用 `issue_code` 做本地化映射
- 同时展示 `message`、`file_path`、`location` 等原始字段，便于排查
- 使用 `summary.error_count`、`summary.warning_count`、`summary.validation_issue_count`
  做顶部汇总

### 流程数据集字段兼容性

导入流程会按照当前 TIDAS schema 校验 `processes/*.json`。准备流程数据集时，特别注意以下字段：

- `processDataSet.modellingAndValidation.dataSourcesTreatmentAndRepresentativeness.annualSupplyOrProductionVolume`
  现在是必填项，值应使用字段专用的多语言文本结构。每个 `#text` 需要以可解析的数字开头，并保留
  单位或上下文后缀，例如 `"123.45 kg/year"` 或 `"1.2E3 kg/year"`。
- 不要把 `annualSupplyOrProductionVolume` 写成只有数字的旧字符串，也不要省略单位 / 上下文后缀。
- `processDataSet.exchanges.exchange[].location` 推荐使用 TIDAS / ILCD location category code，例如
  `CN`、`CN-BJ`、`RER` 或 `GLO`。为兼容外部历史数据，系统仍接受非空普通字符串。
- `exchange.location` 不是多语言文本；不要提交 `StringMultiLang` 对象或数组。对于产品输入交换，
  该字段还会作为后续 provider linking 的显式 supply-region anchor。

如果字段形状或取值不符合当前 schema，导入报告会返回 `schema_error`，并在 `file_path`、
`location` 和 `message` 中指出对应的流程文件与字段位置。

### CAS 号校验

当前 TIDAS schema 会把 CAS 号标记为 `cas-number` 格式。导入 worker 会先检查形如
`64-17-5` 的结构，再校验最后一位 CAS 校验位。

- TIDAS JSON 中的 CAS 号如果校验位错误，会作为格式问题返回。
- eILCD/ILCD flow XML 中的 `CASNumber` 也会补充校验校验位。
- 当报告中的 `issue_code` 为 `cas_number_checksum_error` 时，说明字符串结构看起来像 CAS 号，
  但校验位不匹配，应回到来源数据修正 CAS 号。

## 常见注意事项

- 导入校验不会在浏览器本地同步完成，而是在异步 worker 中执行
- `prepare_upload` 成功后，仍需完成上传、`enqueue` 和轮询
- API Key 认证与浏览器 JWT 共用同一套接口，但外部 API 集成优先推荐 API Key
- 如需与产品前端对齐，请使用与当前部署环境一致的 Edge Function base URL
