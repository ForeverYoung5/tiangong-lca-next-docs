# 命令行集成

命令行工作流涉及两个独立工具：

- [`tidas`](https://github.com/tiangong-lca/tidas-tools/releases/tag/v0.1.1) 是已发布的原生
  Rust 可执行程序，用于本地 TIDAS/eILCD 转换、外部 LCA 格式导入、包校验、数据库导出和确定性发布打包。
- `tiangong-lca` 是 npm 发布的 TianGong LCA 平台客户端，用于远程查询、草稿写入、审查和其他
  API 工作流。

这两个命令不是别名。需要处理本地数据包时直接调用 `tidas`；不要假定 `tiangong-lca` 会在内部
调用它。

## 安装 `tidas` 0.1.1

预编译归档是普通用户的首选安装渠道，不需要 Rust、Python、Java 或 Node.js。安装器会下载
固定版本归档和对应的 `.sha256` 文件，校验后再安装。

### Linux 和 macOS

```bash
curl --proto '=https' --tlsv1.2 -fsSLO \
  https://github.com/tiangong-lca/tidas-tools/releases/download/v0.1.1/install.sh
sh install.sh --version 0.1.1 --prefix "$HOME/.local"
"$HOME/.local/bin/tidas" --version
```

如果 `$HOME/.local/bin` 尚未在 `PATH` 中，请按所用 shell 的方式加入。

### Windows PowerShell

```powershell
Invoke-WebRequest `
  https://github.com/tiangong-lca/tidas-tools/releases/download/v0.1.1/install.ps1 `
  -OutFile install.ps1
.\install.ps1 -Version 0.1.1
& "$env:LOCALAPPDATA\Programs\tidas\bin\tidas.exe" --version
```

安装器完成后，如有提示，请把该 `bin` 目录加入 `PATH`。

### 预编译平台

| 平台 | 发布归档 |
| --- | --- |
| Linux x86_64 | `tidas-v0.1.1-x86_64-unknown-linux-gnu.tar.gz` |
| Linux ARM64 | `tidas-v0.1.1-aarch64-unknown-linux-gnu.tar.gz` |
| macOS Intel | `tidas-v0.1.1-x86_64-apple-darwin.tar.gz` |
| macOS Apple Silicon | `tidas-v0.1.1-aarch64-apple-darwin.tar.gz` |
| Windows x86_64 | `tidas-v0.1.1-x86_64-pc-windows-msvc.zip` |

每个归档在 [v0.1.1 Release](https://github.com/tiangong-lca/tidas-tools/releases/tag/v0.1.1)
中都有 SHA-256 sidecar 和 SPDX SBOM。Windows ARM64 不在当前支持矩阵内。Release 也提供
Homebrew formula 与 Winget manifest 文件，但这些文件的存在不表示它们已经发布到外部 tap
或 Winget Community 仓库。

### 从 crates.io 安装

已经安装 Rust 1.88+ 以及平台 libxml2/libxslt 开发依赖的开发者也可使用：

```bash
cargo install tidas --version 0.1.1 --locked
tidas --version
tidas version --format json
```

crates.io 包名和安装后的可执行程序名都是 `tidas`。

## `tidas` 包工作流

### 外部格式导入为 TIDAS

`tidas import` 支持 EcoSpold 1/2、SimaPro CSV、openLCA JSON-LD、openLCA process XLSX 和
ILCD/eILCD 输入；通常会自动检测格式：

```bash
tidas import ./openlca-package.zip \
  --output ./imported \
  --target tidas \
  --format json

tidas validate ./imported/tidas \
  --input-format tidas-json \
  --issues ./imported/validation-issues.jsonl \
  --format json
```

默认输出包括 `import-report.json`、`issues.jsonl`、`tidas/` 和
`process-bundles/<process_uuid>/`。需要逐字段审查文件时加 `--write-mapping`，会生成
`mapping.csv.gz`；不需要单过程依赖包时加 `--no-process-bundles`。`.zolca` 不受支持，请先
从 openLCA 导出为支持的交换格式。

### TIDAS 与 eILCD 相互转换

```bash
tidas convert ./tidas-package \
  --output ./eilcd-package \
  --to ilcd \
  --format json

tidas convert ./eilcd-data \
  --output ./tidas-package \
  --to tidas \
  --format json
```

转换后的数据位于输出目录的 `data/` 下。上传或交给下游前，使用与目标格式一致的校验：

```bash
tidas validate ./eilcd-package/data --input-format ilcd-xml --format json
tidas validate ./tidas-package/data --input-format tidas-json --format json
```

### 报告与退出码

`--format json` 时，标准输出只包含机器可读报告。完整问题列表应通过 `--issues` 等命令专用
参数写入文件；也可用全局 `--report <PATH>` 原子写出操作报告。

| 退出码 | 含义 |
| ---: | --- |
| `0` | 成功 |
| `2` | 命令完成，但发现数据问题 |
| `64` | 用法或参数错误 |
| `69` | 已知能力当前不可用 |
| `70` | 内部错误 |
| `74` | 必需的 I/O 失败 |
| `130` | 操作被取消 |

流水线必须同时检查退出码和 JSON 报告中的 `status`、`exit_class`、`diagnostics`、
`artifacts` 与 `summary`，不要只解析终端文本。

## 安装与运行 `tiangong-lca`

需要远程平台查询、草稿写入或审查工作流时，可一次性运行最新版：

```bash
npm exec --yes --package=@tiangong-lca/cli@latest -- tiangong-lca --help
npm exec --yes --package=@tiangong-lca/cli@latest -- tiangong-lca doctor
```

全局安装：

```bash
npm install --global @tiangong-lca/cli
tiangong-lca --help
tiangong-lca doctor
```

## 环境变量

远程命令需要 TianGong LCA API 地址和用户 API Key：

```bash
TIANGONG_LCA_API_BASE_URL=
TIANGONG_LCA_API_KEY=
TIANGONG_LCA_SUPABASE_PUBLISHABLE_KEY=
TIANGONG_LCA_REGION=us-east-1
```

- `TIANGONG_LCA_API_BASE_URL` 可填写项目根地址、`/functions/v1` 或 `/rest/v1` 地址。
- `TIANGONG_LCA_API_KEY` 是账号页面生成的 TianGong 用户 API Key，不是 Supabase 项目密钥。
- CLI 会使用 API Key 换取用户会话，并复用该会话访问 Edge Functions 与 Supabase 数据。

## 常用命令

```bash
tiangong-lca search flow --input ./search-flow.request.json --json
tiangong-lca search process --input ./search-process.request.json --json
tiangong-lca flow get --id <flow-id> --version <version> --json
tiangong-lca process list --state-code 100 --limit 20 --json
tiangong-lca dataset validate --input ./rows.jsonl --type auto --out-dir ./dataset-validate --json
tiangong-lca dataset evidence-search plan --query "中国2026年电力结构数据" --out-dir ./evidence-search --json
tiangong-lca dataset evidence-search run --input ./evidence-search.request.json --results ./search-results.json --out-dir ./evidence-search --json
tiangong-lca process save-draft --input ./patched-processes.jsonl --out-dir ./process-save-draft --dry-run --json
tiangong-lca lifecyclemodel validate-build --run-dir ./lifecyclemodel-run --json
```

需要查看完整参数时，优先使用内置帮助：

```bash
tiangong-lca flow --help
tiangong-lca process --help
tiangong-lca lifecyclemodel --help
tiangong-lca review --help
```

## 自动化质量门

面向数据生产流水线时，CLI 还提供了一组适合在写入、发布或人工交接前运行的质量门命令：

```bash
tiangong-lca process identity-preflight --input ./process-preflight.json --out-dir ./process-preflight --json
tiangong-lca flow identity-preflight --input ./flow-preflight.json --out-dir ./flow-preflight --json
tiangong-lca process build-plan validate --input ./process-build-plan.json --out-dir ./process-build-plan --json
tiangong-lca flow build-plan validate --input ./flow-build-plan.json --out-dir ./flow-build-plan --json
tiangong-lca publish run --input ./publish-request.json --dry-run --json
```

- `identity-preflight` 会把目标过程或流与候选数据对比，输出是否可自动复用、需要人工复核或应阻止新建的判定。
- `build-plan validate` 用于检查过程或流构建计划是否包含身份判定、证据绑定、名称计划、`unit_of_analysis` 决策和必要的参考流 / 流属性信息。
- `dataset evidence-search plan/run` 用于规划字段级公开证据检索并记录外部搜索结果；CLI 负责查询矩阵、预算、结果归一化和证据声明制品，来源判断仍需由人工或 agent 工作流完成。
- `publish run --dry-run` 会输出发布规则集的校验结果，适合在真正写入或发布前做流水线拦截。

这些命令会把机器可读报告写入 `--out-dir` 下的 `outputs/` 或 `reports/` 目录。接入自动化时，应优先读取报告中的
`status`、`blockers`、`issues`、`files` 和具体制品路径。

## `tiangong-lca` 校验与失败报告

`dataset validate`、`process save-draft`、`lifecyclemodel save-draft` 以及相关修复命令会先进行本地 TIDAS schema 校验。当前 CLI 在快速校验失败后，会使用 SDK 的深度校验补充更具体的问题路径和消息。

这意味着：

- 校验通过的数据仍走快速路径；
- 校验失败的数据会尽量返回更可操作的字段路径、错误码和消息；
- `--commit` 写入前仍会拦截 schema-invalid 行，并把失败明细写入输出目录中的 `failures.jsonl` 或校验报告。
- 批量写入草稿时，`process save-draft --commit` 建议同时传入 `--target-user-id`。CLI 会校验当前认证会话和可见草稿所有者，写入后仍以回读结果证明最终 owner 与 payload。
- `dataset classification apply --type location` 在 `target_path` 明确指向 schema 派生的 location 字段时，可以创建缺失的父对象和目标字段；模糊路径或非 location 字段仍会被阻止。
- `dataset evidence-search run` 会在 `outputs/` 中写出检索计划、归一化结果、报告，以及在证据不足或只有部分时写出证据声明 JSON。

如果要把 `tiangong-lca` 结果接入流水线，请读取 JSON 输出中的 `status`、`counts`、
`issues`、`files` 和各命令生成的 `outputs/**` 制品，而不是只依赖终端文本。需要本地数据包
导入、转换或完整包校验时，使用本页前述的独立 `tidas` 命令。
