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

## 校验与失败报告

`dataset validate`、`process save-draft`、`lifecyclemodel save-draft` 以及相关修复命令会先进行本地 TIDAS schema 校验。当前 CLI 在快速校验失败后，会使用 SDK 的深度校验补充更具体的问题路径和消息。

这意味着：

- 校验通过的数据仍走快速路径；
- 校验失败的数据会尽量返回更可操作的字段路径、错误码和消息；
- `--commit` 写入前仍会拦截 schema-invalid 行，并把失败明细写入输出目录中的 `failures.jsonl` 或校验报告。

如果要把 CLI 结果接入流水线，请读取 JSON 输出中的 `status`、`counts`、`issues`、`files` 和各命令生成的 `outputs/**` 制品，而不是只依赖终端文本。
