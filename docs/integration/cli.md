# TianGong LCA CLI

TianGong LCA CLI 用于在本地或自动化环境中调用天工 LCA 的搜索、数据校验、
建模预检、审核和发布流程。它适合需要批量处理 JSON/JSONL 数据、生成门禁报告，
或把数据生产流程接入脚本的用户。

## 安装与运行

可以直接通过 npm 临时运行已发布的 CLI：

```bash
npm exec --yes --package=@tiangong-lca/cli@latest -- tiangong-lca --help
npm exec --yes --package=@tiangong-lca/cli@latest -- tiangong-lca doctor
```

也可以全局安装：

```bash
npm install --global @tiangong-lca/cli
tiangong-lca --help
tiangong-lca doctor
```

`doctor` 用于检查本地运行环境与远程连接配置。第一次接入时，建议先运行
`tiangong-lca --help` 查看当前命令树，再运行目标命令的 `--help`。

## 远程命令环境变量

调用远程数据、搜索或发布能力前，需要配置 API 连接信息：

```bash
TIANGONG_LCA_API_BASE_URL=
TIANGONG_LCA_API_KEY=
TIANGONG_LCA_SUPABASE_PUBLISHABLE_KEY=
TIANGONG_LCA_REGION=us-east-1
```

`TIANGONG_LCA_API_KEY` 使用账号页中的天工用户 API Key。CLI 会用该 Key 换取用户会话，
并把访问令牌用于 Edge Functions 和 Supabase 数据访问。

如需控制会话缓存，可按需设置：

```bash
TIANGONG_LCA_SESSION_FILE=
TIANGONG_LCA_DISABLE_SESSION_CACHE=false
TIANGONG_LCA_FORCE_REAUTH=false
```

## 常用命令范围

CLI 当前覆盖以下公开命令族：

| 命令族 | 用途 | 常见场景 |
| --- | --- | --- |
| `search` | 搜索 flow、process、lifecyclemodel | 在自动化流程中查找候选数据 |
| `process` | 获取、列出、预检、构建、补全、保存与发布过程数据 | 批量生成或修复过程数据 |
| `flow` | 获取、列出、预检、构建、补救、发布与引用修复流数据 | 治理流数据和过程引用 |
| `dataset` | 校验、本地翻译、证据搜索、远程引用校验与重写 | 发布前检查数据包质量 |
| `lifecyclemodel` | 构建、校验、发布与图结构输出模型 | 自动化模型生产与审核 |
| `review` | 审核 process、flow、lifecyclemodel 行数据或运行目录 | 生成审核报告和阻塞项 |
| `publish` | 执行发布请求并输出发布报告 | 将已通过门禁的数据提交到远程 |

## 示例流程

### 搜索和读取数据

```bash
tiangong-lca search flow --input ./search-flow.request.json --json
tiangong-lca process get --id <process-id> --version <version> --json
tiangong-lca flow list --id <flow-id> --state-code 100 --limit 20 --json
```

### 发布前校验本地数据

```bash
tiangong-lca dataset validate \
  --input ./rows.jsonl \
  --type auto \
  --out-dir ./dataset-validate \
  --json

tiangong-lca dataset verify-remote \
  --input ./rows.jsonl \
  --out-dir ./dataset-remote-verify \
  --json
```

校验命令会把报告写入 `--out-dir`。如果有阻塞项，应先根据报告修复本地数据，
再进入保存或发布步骤。

### 过程与流的预检

```bash
tiangong-lca process identity-preflight \
  --input ./process-preflight.json \
  --out-dir ./process-preflight \
  --json

tiangong-lca flow build-plan validate \
  --input ./flow-build-plan.json \
  --out-dir ./flow-build-plan \
  --json
```

身份预检用于在生成新数据前识别可复用、可更新或需要人工判断的候选项。构建计划门禁会检查
必要字段、证据绑定和 TIDAS 结构，并输出标准报告。

### 证据检索记录

```bash
tiangong-lca dataset evidence-search plan \
  --query "中国2026年电力结构数据" \
  --out-dir ./evidence-search \
  --json

tiangong-lca dataset evidence-search run \
  --input ./evidence-search.request.json \
  --results ./search-results.json \
  --out-dir ./evidence-search \
  --json
```

该流程记录字段级证据检索计划、结果和声明。CLI 负责规范化输入与输出；
证据是否足以支持建模结论仍需要人工或代理工作流判断。

## 输出与安全建议

- 优先使用 `--json` 输出，便于自动化读取。
- 对会写入远程的命令，先用 `--dry-run` 或不带 `--commit` 的模式检查报告。
- 把 `--out-dir` 指向固定目录，保留门禁报告、失败清单和发布报告。
- 不要把 API Key 写入脚本仓库；使用本地环境变量或受控的密钥管理方式。

更多命令细节以 `tiangong-lca --help` 和各子命令的 `--help` 输出为准。
