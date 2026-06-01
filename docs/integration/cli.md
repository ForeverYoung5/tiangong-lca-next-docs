# CLI 集成

TianGong LCA CLI 面向需要在本地脚本、数据流水线或自动化任务中调用平台数据能力的用户。
它的 npm 包名为 `@tiangong-lca/cli`，可执行命令为 `tiangong-lca`，推荐使用 Node 24。

## 安装与运行

如果只想临时运行最新版 CLI，可以使用：

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

`doctor` 会检查当前运行环境和认证配置，适合在第一次配置或排查连接问题时使用。

## 认证环境

调用远程平台数据时，需要在运行环境中配置：

```bash
TIANGONG_LCA_API_BASE_URL=
TIANGONG_LCA_API_KEY=
TIANGONG_LCA_SUPABASE_PUBLISHABLE_KEY=
TIANGONG_LCA_REGION=us-east-1
```

- `TIANGONG_LCA_API_BASE_URL` 可以是项目根地址、`/functions/v1` 或 `/rest/v1`。
- `TIANGONG_LCA_API_KEY` 是在 TianGong LCA 账号信息页生成的用户 API Key，不是 Supabase 项目密钥。
- CLI 会用用户 API Key 换取用户会话，并在 Edge Functions 与 Supabase 数据访问中复用访问令牌。

## 常用命令族

| 命令族 | 适用场景 | 主要输出 |
| --- | --- | --- |
| `dataset validate` | 校验本地 TIDAS JSON/JSONL 行 | 校验报告、有效行、无效行 |
| `dataset verify-remote` | 核对本地根对象和引用是否存在于远程版本 | 远程核验报告、阻塞项 |
| `dataset references refresh-remote` | 将可刷新的引用版本更新到远程最新版本 | 刷新报告和修补后的行 |
| `process identity-preflight` / `flow identity-preflight` | 创建过程或流前做身份预检 | `identity-decision.json`、候选记录 |
| `process build-plan` / `flow build-plan` | 校验或物化构建计划 | `build-plan-gate-report.json`、物化后的 TIDAS 载荷 |
| `process save-draft` | 保存过程草稿前执行本地结构校验 | 保存结果和失败行 |
| `flow publish-version` | 发布流版本前执行发布门禁 | `flow-publish-version-gate-report.json` |
| `process publish-build` | 发布过程构建产物前执行 schema 门禁 | `process-publish-schema-gate.json` |
| `review process` / `review flow` | 对过程或流进行本地审核 | 审核报告 |
| `publish run` | 执行发布请求并生成验证报告 | `publish-report.json`、`verification-report.json` |

常见调用示例：

```bash
tiangong-lca dataset validate --input ./rows.jsonl --type auto --out-dir ./dataset-validate --json
tiangong-lca process identity-preflight --input ./process-preflight.json --candidate-input ./processes.jsonl --out-dir ./process-preflight --json
tiangong-lca process build-plan validate --input ./process-build-plan.json --out-dir ./process-build-plan --json
tiangong-lca process build-plan materialize --input ./process-build-plan.json --out-dir ./process-build-plan --json
tiangong-lca dataset verify-remote --input ./rows.jsonl --out-dir ./remote-verify --json
```

## 建议工作顺序

1. 先运行 `tiangong-lca doctor`，确认 Node、API base 和密钥配置可用。
2. 对外部或本地生成的 TIDAS 行运行 `dataset validate`。
3. 在创建新过程或流前运行 `process identity-preflight` 或 `flow identity-preflight`。
4. 通过 `process build-plan validate` / `flow build-plan validate` 检查构建计划。
5. 需要生成规范 TIDAS 载荷时，再运行对应的 `build-plan materialize`。
6. 发布或保存前使用 `process save-draft`、`flow publish-version`、`process publish-build` 或 `publish run` 读取门禁报告。

## 输出与排障

- `blocked` 通常表示本地数据、引用或构建计划需要先修复，不应继续发布。
- `manual_review` 表示身份或语义判断不够确定，应由人工确认。
- `--candidate-input` 可以重复传入 JSON、JSONL 或目录，CLI 会记录候选来源。
- `--remote-candidates` 会通过远程混合搜索查找候选，需要认证环境变量可用。
- `publish run` 的相对 `out_dir` 会按请求文件所在目录解析；需要固定路径时请使用绝对路径。

如果您的目标是通过 HTTP 直接导入 TIDAS ZIP 数据包，请改用
[TIDAS 数据包导入 API](/docs/openapi/tidas-package-import)。
