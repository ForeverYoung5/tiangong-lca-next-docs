# 天工 LCA CLI

天工 LCA CLI 是面向自动化、批量处理和本地数据治理场景的命令行工具。它通过公开 npm 包 `@tiangong-lca/cli` 提供统一入口 `tiangong-lca`，适合在终端、脚本或代理工作流中调用天工 LCA 的搜索、读取、校验、生成、审核和发布准备能力。

## 适用场景

- 需要在脚本中搜索或读取 flow、process、lifecyclemodel 数据。
- 需要在生成新 flow 或 process 前运行 identity preflight，避免重复创建或低置信度写入。
- 需要在本地校验 TIDAS rows、重写引用、补齐必填字段或生成稳定的报告工件。
- 需要把 process、flow 或 lifecyclemodel 的本地构建、审核和发布准备步骤串成可复现流程。

## 运行方式

一次性运行最新发布版本：

```bash
npm exec --yes --package=@tiangong-lca/cli@latest -- tiangong-lca --help
npm exec --yes --package=@tiangong-lca/cli@latest -- tiangong-lca doctor
npm exec --yes --package=@tiangong-lca/cli@latest -- tiangong-lca flow --help
```

也可以全局安装后使用：

```bash
npm install --global @tiangong-lca/cli
tiangong-lca --help
tiangong-lca doctor
```

CLI 当前运行基线是 Node.js 24。若在自动化环境中固定版本，请先确认运行机使用 Node.js `24.x`。

## 环境变量

纯本地命令通常不需要远程凭证。访问天工 LCA 远程 API、Edge Functions 或需要远程候选集的命令时，配置以下变量：

```bash
TIANGONG_LCA_API_BASE_URL=
TIANGONG_LCA_API_KEY=
TIANGONG_LCA_SUPABASE_PUBLISHABLE_KEY=
TIANGONG_LCA_REGION=us-east-1
```

`TIANGONG_LCA_API_KEY` 是账户页生成的天工 LCA 用户 API Key，不是 Supabase project key。CLI 会使用它换取用户 session，再用解析出的 access token 访问远程服务。

可选的本地 session 控制变量：

```bash
TIANGONG_LCA_SESSION_FILE=
TIANGONG_LCA_DISABLE_SESSION_CACHE=false
TIANGONG_LCA_FORCE_REAUTH=false
```

## 常用命令

### 环境诊断

```bash
tiangong-lca doctor
tiangong-lca doctor --json
```

`doctor` 会检查 CLI 能读取到的环境变量，并用脱敏值展示当前配置状态。

### 搜索与读取

```bash
tiangong-lca search flow --input ./search-flow.request.json --json
tiangong-lca search process --input ./search-process.request.json --json
tiangong-lca search lifecyclemodel --input ./search-lifecyclemodel.request.json --json

tiangong-lca flow get --id <flow-id> --version <version> --json
tiangong-lca flow list --id <flow-id> --state-code 100 --limit 20 --json
tiangong-lca process get --id <process-id> --version <version> --json
tiangong-lca process list --state-code 100 --limit 20 --json
```

搜索和远程读取需要远程环境变量。读取类命令会按命令参数过滤目标数据集，并优先输出结构化 JSON，便于后续脚本继续处理。

### 生成前预检

```bash
tiangong-lca process identity-preflight --input ./process-preflight.json --out-dir ./process-preflight --json
tiangong-lca flow identity-preflight --input ./flow-preflight.json --out-dir ./flow-preflight --json
```

identity preflight 会比较目标对象与本地或远程候选数据，输出可复用的 `IdentityDecision`、候选证据和 blocker/manual-review 状态。需要远程候选时，可使用对应命令的 `--remote-candidates`、`--remote-query` 和 `--remote-limit` 参数。

### Build-plan gate

```bash
tiangong-lca process build-plan validate --input ./process-build-plan.json --out-dir ./process-build-plan --json
tiangong-lca process build-plan materialize --input ./process-build-plan.json --out-dir ./process-build-plan --json
tiangong-lca flow build-plan validate --input ./flow-build-plan.json --out-dir ./flow-build-plan --json
tiangong-lca flow build-plan materialize --input ./flow-build-plan.json --out-dir ./flow-build-plan --json
```

build-plan gate 用于在生成或发布交接前校验最小 authoring contract，并在可物化时写出标准 `GateReport` 和 deterministic TIDAS payload。

### 数据校验与引用处理

```bash
tiangong-lca dataset validate --input ./rows.jsonl --type auto --out-dir ./dataset-validate --json
tiangong-lca dataset verify-remote --input ./rows.jsonl --out-dir ./dataset-remote-verify --json
tiangong-lca dataset references rewrite --input ./rows.jsonl --from flow:<old-id>@<old-version> --to flow:<new-id>@<new-version> --out-dir ./dataset-rewrite --json
tiangong-lca dataset bilingual extract --input ./rows/processes.jsonl --type process --out-dir ./translation --json
tiangong-lca dataset bilingual apply --input ./rows/processes.jsonl --translations ./translation/trans-reviewed.jsonl --out ./rows/processes.translated.jsonl --json
tiangong-lca dataset bilingual validate --input ./rows/processes.translated.jsonl --type process --out-dir ./translation-validate --json
```

这些命令优先写出本地报告、JSONL 结果和证据工件。涉及远程写入的命令只有在显式提供 `--commit` 或命令语义要求远程验证时才会访问远程服务。

### Process、flow 与 lifecyclemodel 工作流

```bash
tiangong-lca process auto-build --input ./examples/process-auto-build.request.json --out-dir ./process-run --json
tiangong-lca process resume-build --run-dir ./process-run --json
tiangong-lca process publish-build --run-dir ./process-run --json

tiangong-lca flow fetch-rows --refs-file ./flow-refs.json --out-dir ./flow-fetch --json
tiangong-lca review flow --rows-file ./flow-fetch/review-input-rows.jsonl --out-dir ./flow-review
tiangong-lca flow materialize-decisions --decision-file ./approved-decisions.json --flow-rows-file ./flow-fetch/review-input-rows.jsonl --out-dir ./flow-decisions

tiangong-lca lifecyclemodel auto-build --input ./examples/lifecyclemodel-auto-build.request.json --out-dir ./lifecyclemodel-run --json
tiangong-lca lifecyclemodel validate-build --run-dir ./lifecyclemodel-run --json
tiangong-lca lifecyclemodel publish-build --run-dir ./lifecyclemodel-run --json
```

这些命令用于把本地构建、审核、校验和发布准备拆成可重复运行的步骤。发布准备类命令通常先生成 bundle、request、intent 或 report，最终是否写入远程由对应命令的 `--dry-run` / `--commit` 边界决定。

## 输出与安全边界

- 优先使用 `--json` 获得稳定结构化输出，方便在 CI 或代理流程中解析。
- 设置 `--out-dir` 时，命令会把报告、成功/失败列表和中间工件写入该目录。
- 不要把 `TIANGONG_LCA_API_KEY`、session 文件或生成的凭证提交到仓库。
- 在执行带 `--commit` 的命令前，先用 dry-run 或本地报告确认输入范围、目标用户和将要写入的数据。

## 后续步骤

- 需要连接 MCP 工具时，继续阅读[本地 MCP](../MCP/lca_local.md)或[远程 MCP](../MCP/lca_remote.md)。
- 需要了解 TIDAS ZIP 导入导出流程时，阅读[TIDAS ZIP 工作流](../user-guide/tidas-zip-workflows.md)。
- 需要调用公开导入接口时，阅读[OpenAPI TIDAS 包导入](../openapi/tidas-package-import.md)。
