---
title: CLI 命令行工具
description: 安装和配置 TianGong LCA CLI，并使用命令行完成数据查询、本地校验、引用重写和草稿保存。
---

TianGong LCA CLI 面向需要脚本化处理数据、批量检查 TIDAS 数据集或把治理结果写回平台的用户。它不会替代网页端的日常编辑流程，适合在本地流水线、数据治理脚本或团队自动化任务中使用。

CLI 包名为 `@tiangong-lca/cli`，可执行命令为 `tiangong-lca`。推荐使用 Node.js 24.x 运行。

## 安装与运行

如果只想临时执行一次命令，可以直接使用 npm 的 one-off 方式：

```bash
npm exec --yes --package=@tiangong-lca/cli@latest -- tiangong-lca --help
npm exec --yes --package=@tiangong-lca/cli@latest -- tiangong-lca doctor
```

如果需要长期使用，可以全局安装：

```bash
npm install --global @tiangong-lca/cli
tiangong-lca --help
tiangong-lca doctor
```

## 环境变量

访问远程 TianGong LCA 服务的命令需要配置以下变量：

```bash
TIANGONG_LCA_API_BASE_URL=
TIANGONG_LCA_API_KEY=
TIANGONG_LCA_SUPABASE_PUBLISHABLE_KEY=
TIANGONG_LCA_REGION=us-east-1
```

说明：

- `TIANGONG_LCA_API_BASE_URL` 可以填写项目根地址、`/functions/v1` 或 `/rest/v1` 地址。
- `TIANGONG_LCA_API_KEY` 是在 TianGong LCA [账户管理与 API Key](/user-guide/account-profile) 页面生成的用户 API Key，不是 Supabase 项目密钥。
- CLI 会使用用户 API Key 换取用户会话，并复用该会话访问 Edge Functions 与直接 Supabase 查询接口。
- API Key 应按账号凭据管理，不要提交到 Git 仓库、日志或共享文档。

如需控制本地会话缓存，可按需设置：

```bash
TIANGONG_LCA_SESSION_FILE=
TIANGONG_LCA_DISABLE_SESSION_CACHE=false
TIANGONG_LCA_FORCE_REAUTH=false
```

## 常用检查命令

`doctor` 用于确认运行环境、认证配置和远程连接是否可用：

```bash
tiangong-lca doctor
tiangong-lca doctor --json
```

遇到认证、基础地址或环境变量问题时，优先运行 `doctor` 再继续执行数据命令。

## 查询与读取数据

CLI 支持搜索和读取 flow、process、lifecyclemodel 数据。请求体通常放在 JSON 文件中：

```bash
tiangong-lca search flow --input ./search-flow.request.json --json
tiangong-lca search process --input ./search-process.request.json --json
tiangong-lca search lifecyclemodel --input ./search-lifecyclemodel.request.json --json
```

读取单条或列表数据时，可使用：

```bash
tiangong-lca flow get --id <flow-id> --version <version> --json
tiangong-lca flow list --id <flow-id> --state-code 100 --limit 20 --json
tiangong-lca process get --id <process-id> --version <version> --json
tiangong-lca process list --id <process-id> --state-code 100 --limit 20 --json
```

`state-code 100` 通常用于读取已发布或可引用的数据版本。空搜索结果可能返回 `[]`，也可能返回 `{"data":[]}`，脚本中应同时兼容。

## 本地数据校验

`dataset validate` 可以对本地 JSON/JSONL 中的 flow、process、lifecyclemodel 行执行 TIDAS SDK schema 校验：

```bash
tiangong-lca dataset validate \
  --input ./rows.jsonl \
  --type auto \
  --out-dir /abs/path/to/dataset-validate \
  --json
```

常用参数：

| 参数 | 说明 |
| --- | --- |
| `--input` | 本地 JSON 或 JSONL 文件 |
| `--type` | `auto`、`flow`、`process` 或 `lifecyclemodel`，默认 `auto` |
| `--out-dir` | 输出校验报告与有效/无效数据行 |
| `--json` | 以 JSON 格式输出命令结果 |

典型输出包括：

- `outputs/validation-report.json`
- `outputs/valid-rows.jsonl`
- `outputs/invalid-rows.jsonl`

在批量导入、脚本修复或提交审核前，建议先运行本地校验，确认必填字段和引用结构符合当前 SDK 规则。

## 重写数据引用

`dataset references rewrite` 用于在本地 process 和 lifecyclemodel 行中批量替换 flow 引用。未添加 `--commit` 时只生成本地改写制品，不会写回远程服务：

```bash
tiangong-lca dataset references rewrite \
  --input ./rows.jsonl \
  --from flow:<old-id>@<old-version> \
  --to flow:<new-id>@<new-version> \
  --out-dir /abs/path/to/dataset-rewrite \
  --json
```

如果确认改写结果无误，并且已配置远程访问环境变量，可以增加 `--commit` 执行写回：

```bash
tiangong-lca dataset references rewrite \
  --input ./rows.jsonl \
  --from flow:<old-id>@<old-version> \
  --to flow:<new-id>@<new-version> \
  --out-dir /abs/path/to/dataset-rewrite \
  --commit \
  --json
```

写回时，CLI 会走对应的 save-draft 路径，并在写入前对 canonical process 或 lifecyclemodel payload 执行本地 schema 校验。校验失败的数据不会写入，会进入失败报告。

## 草稿保存与模型图

当本地已经生成 canonical process 或 lifecyclemodel payload 时，可以使用保存草稿命令：

```bash
tiangong-lca process save-draft \
  --input ./patched-processes.jsonl \
  --out-dir /abs/path/to/process-save-draft \
  --dry-run \
  --json

tiangong-lca lifecyclemodel save-draft \
  --input ./lifecyclemodels.jsonl \
  --out-dir /abs/path/to/lifecyclemodel-save-draft \
  --dry-run \
  --json
```

确认结果后再将 `--dry-run` 改为 `--commit`。`process save-draft` 会通过 process 草稿维护路径写入，`lifecyclemodel save-draft` 会通过 lifecyclemodel bundle 保存路径写入。

对于 lifecyclemodel，还可以生成图结构与连接检查制品：

```bash
tiangong-lca lifecyclemodel graph \
  --input ./lifecyclemodels.jsonl \
  --out-dir /abs/path/to/lifecyclemodel-graph \
  --format all \
  --json
```

常见输出包括 `graphs/*.json`、`graphs/*.dot`、`graphs/*.svg` 和 `outputs/graph-report.json`。

## 与网页端和 API 的关系

- 单次手工创建、复制、引用、提交审核，优先使用网页端的[数据新建](/user-guide/create-my-data)和[数据使用](/user-guide/data-use)流程。
- TIDAS ZIP 包的手工导入、导出和任务中心操作，参考 [TIDAS ZIP 导入、导出与任务中心](/user-guide/tidas-zip-workflows)。
- 需要通过 HTTP 接口导入 TIDAS ZIP 包时，参考 [TIDAS 数据包导入 API](/docs/openapi/tidas-package-import)。
- 需要在本地批量校验数据、批量重写 flow 引用、生成模型图或把脚本治理结果保存为草稿时，使用 CLI 更合适。
