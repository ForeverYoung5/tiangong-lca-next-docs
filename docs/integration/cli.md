# TianGong LCA CLI

TianGong LCA CLI 适合需要脚本化查询、数据校验、流程构建、生命周期模型构建或批量审查的用户。网页端适合单次交互操作；CLI 适合可重复的本地或流水线任务。

## 安装与运行

一次性运行最新版：

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
tiangong-lca dataset import-lca convert --input ./openlca-package.zip --output-dir ./import-lca --target both --json
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

## 校验与失败报告

`dataset validate`、`process save-draft`、`lifecyclemodel save-draft` 以及相关修复命令会先进行本地 TIDAS schema 校验。当前 CLI 在快速校验失败后，会使用 SDK 的深度校验补充更具体的问题路径和消息。

这意味着：

- 校验通过的数据仍走快速路径；
- 校验失败的数据会尽量返回更可操作的字段路径、错误码和消息；
- `--commit` 写入前仍会拦截 schema-invalid 行，并把失败明细写入输出目录中的 `failures.jsonl` 或校验报告。
- 批量写入草稿时，`process save-draft --commit` 建议同时传入 `--target-user-id`。CLI 会校验当前认证会话和可见草稿所有者，写入后仍以回读结果证明最终 owner 与 payload。
- `dataset import-lca convert` 会按 tidas-tools 的默认行为写出过程依赖包；如需关闭请传 `--no-process-bundles`，如需自定义目录请传 `--process-bundles-dir`。报告中的 `mapping_csv`、`process_bundles_dir` 和 `process_bundles_index` 只在对应文件真实存在时填写，`mapping.csv.gz` 需要转换工具显式启用后才会出现。
- `dataset classification apply --type location` 在 `target_path` 明确指向 schema 派生的 location 字段时，可以创建缺失的父对象和目标字段；模糊路径或非 location 字段仍会被阻止。
- `dataset evidence-search run` 会在 `outputs/` 中写出检索计划、归一化结果、报告，以及在证据不足或只有部分时写出证据声明 JSON。

如果要把 CLI 结果接入流水线，请读取 JSON 输出中的 `status`、`counts`、`issues`、`files` 和各命令生成的 `outputs/**` 制品，而不是只依赖终端文本。
