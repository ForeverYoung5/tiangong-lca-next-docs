# TianGong LCA CLI

TianGong LCA CLI 面向需要在本地或自动化流水线中检查、生成、验证和发布 TIDAS 数据的高级用户。
它通常用于网页端正式导入或提交前的预检，以及 Foundry、脚本和 CI 流水线中的可重复交付。

## 适用场景

优先在以下场景使用 CLI：

- 在生成过程或流之前，先判断是否应复用、更新、创建新版本，或进入人工复核。
- 在发布前验证过程、流、数据集引用和发布运行是否满足规则集要求。
- 在本地自动化流程中生成稳定的 JSON 报告，供后续步骤或审核人员读取。
- 对远端已发布数据做引用版本校验或刷新。

如果只是日常浏览、编辑或审核数据，优先使用网页端的
[数据新建](../user-guide/create-my-data) 和 [数据审核](../user-guide/data-review) 流程。

## 安装与运行方式

在支持 Node.js 的环境中，可以通过包执行 CLI：

```bash
npm exec tiangong-lca -- --help
```

面向本地流水线时，建议固定项目依赖和输出目录，并把每次运行产生的 `outputs/` 报告作为交付
记录保存。

## 生成前身份预检

`process identity-preflight` 和 `flow identity-preflight` 用于在生成新过程或新流之前做查重和身份
判断。

```bash
tiangong-lca process identity-preflight --input ./process-preflight.json --out-dir ./process-preflight --json
tiangong-lca flow identity-preflight --input ./flow-preflight.json --out-dir ./flow-preflight --json
```

常见输出包括：

- `outputs/identity-decision.json`
- `outputs/identity-candidates.jsonl`
- `outputs/identity-candidate-sources.json`

预检会给出复用、更新、创建新版本、阻断或人工复核等决策。默认只读取输入和本地候选；如果需要
查询正式库候选，可显式传入 `--remote-candidates`、`--remote-query` 和 `--remote-limit`。
启用远端候选时需要配置平台 API 相关环境变量。

## BuildPlan gate

`process build-plan` 和 `flow build-plan` 应在身份预检之后、生成正式 TIDAS payload 之前使用。

```bash
tiangong-lca process build-plan validate --input ./process-build-plan.json --out-dir ./process-build-plan --json
tiangong-lca process build-plan materialize --input ./process-build-plan.json --out-dir ./process-build-plan --json
tiangong-lca flow build-plan validate --input ./flow-build-plan.json --out-dir ./flow-build-plan --json
tiangong-lca flow build-plan materialize --input ./flow-build-plan.json --out-dir ./flow-build-plan --json
```

`validate` 只校验计划与证据；`materialize` 会在计划内没有 canonical payload 时，确定性生成
`processDataSet` 或 `flowDataSet`，并立即执行 TIDAS schema 校验。

重点查看：

- `outputs/build-plan-gate-report.json`
- materialized process 或 flow JSON
- 阻断项、人工复核项和规则集版本

## 远端数据校验与引用刷新

在本地行数据准备好之后，可用下面两个命令检查远端已发布版本：

```bash
tiangong-lca dataset verify-remote --input ./rows.jsonl --out-dir ./dataset-remote-verify --json
tiangong-lca dataset references refresh-remote --input ./rows.jsonl --out ./rows.refreshed.jsonl --out-dir ./dataset-reference-refresh --json
```

`verify-remote` 会区分已有远端记录、新候选根记录和无法解析的引用。`references refresh-remote`
会先做刷新前校验，再把可达引用更新到最新远端版本，最后再执行刷新后校验。

## 自动化构建与发布报告

自动化场景通常会把 CLI 命令串联成可审计的本地运行目录：

```bash
tiangong-lca process auto-build --input ./process-auto-build.request.json --out-dir ./process-run --json
tiangong-lca lifecyclemodel auto-build --input ./lifecyclemodel-auto-build.request.json --out-dir ./lifecyclemodel-run --json
tiangong-lca publish run --input ./publish.request.json --out-dir ./publish-run --json
```

发布运行会写出 `verification-report.json` 和 `publish-report.json`。如果规则集报告中存在 blocker，
请先修复数据、证据或引用关系，不要绕过报告继续提交。

## 阅读报告时先看什么

排查 CLI 运行结果时，建议按以下顺序阅读：

1. 运行命令的退出状态和顶层 `status`。
2. `outputs/*report.json` 中的 blocker、failed entries、deferred entries。
3. 规则集 ID、规则版本和 source version，确认报告来自当前 CLI 版本。
4. 候选来源、远端查询参数和被物化的 canonical payload。

CLI 报告是自动化交付记录，不替代网页端最终审核。需要团队审核、权限分配或通知协作时，仍应回到
平台中的数据审核流程。
