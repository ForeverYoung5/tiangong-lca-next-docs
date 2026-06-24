# CLI 集成

`tiangong-lca` CLI 面向需要自动化数据检索、数据构建和审核前检查的高级用户与集成流程。它适合在本地或自动化环境中生成结构化产物，再把产物交给后续审核、发布或工作流编排。

## 使用前准备

1. 安装并构建 `tiangong-lca-cli`。
2. 运行 `tiangong-lca doctor --json` 检查运行环境。
3. 对需要访问远程 TianGong LCA 服务的命令，准备 `TIANGONG_LCA_API_BASE_URL`、`TIANGONG_LCA_API_KEY`、`TIANGONG_LCA_SUPABASE_PUBLISHABLE_KEY`，以及可选的 `TIANGONG_LCA_REGION`。
4. 对仅生成本地产物的命令，优先使用 `--out-dir` 指定输出目录，并保留生成的报告文件供审核。

## 常用命令组

### 搜索和读取

使用 `search` 和读取命令查询平台数据：

```bash
tiangong-lca search flow --input ./search-flow.request.json --json
tiangong-lca search process --input ./search-process.request.json --json
tiangong-lca search lifecyclemodel --input ./search-lifecyclemodel.request.json --json
tiangong-lca process get --id <process-id> --version <version> --json
```

搜索结果会受当前 API Key 和平台权限限制。空结果可能表现为 `[]` 或 `{"data":[]}`，集成流程应统一按空结果处理。

### 构建计划门禁

在生成或发布过程、流数据前，使用构建计划门禁检查输入是否满足最小作者契约：

```bash
tiangong-lca process build-plan validate --input ./process-build-plan.json --out-dir ./process-build-plan --json
tiangong-lca process build-plan materialize --input ./process-build-plan.json --out-dir ./process-build-plan --json
tiangong-lca flow build-plan validate --input ./flow-build-plan.json --out-dir ./flow-build-plan --json
tiangong-lca flow build-plan materialize --input ./flow-build-plan.json --out-dir ./flow-build-plan --json
```

门禁会输出 `build-plan-gate-report.json`。当输入满足要求且没有阻塞项时，`materialize` 可以写出确定性的 TIDAS 载荷，供后续保存草稿、审核或发布流程使用。

### 过程自动构建

`process auto-build` 会准备本地过程构建运行目录和阶段产物，不会隐式写入平台数据：

```bash
tiangong-lca process auto-build --input ./pff-request.json --out-dir /abs/path/to/process-run --json
```

典型输出包括规范化请求、来源策略、输入清单、构建计划、装配计划、运行清单、状态文件和报告。后续可结合 `resume-build`、`publish-build` 或审核命令继续处理。

### 数据证据检索

`dataset evidence-search` 用于为字段级公开证据检索生成计划，或记录已有检索结果：

```bash
tiangong-lca dataset evidence-search plan --query "中国2026年电力结构数据" --out-dir ./evidence-search --json
tiangong-lca dataset evidence-search run --input ./evidence-search.request.json --results ./search-results.json --out-dir ./evidence-search --json
```

计划阶段会生成查询矩阵。运行阶段会写出检索结果、报告，并在证据不足或只有部分时间覆盖时生成声明文件。默认不需要额外环境变量；如果通过 `--provider-url` 调用外部检索服务，请使用 `--provider-key` 显式传入认证信息。

## 产物管理建议

- 将每次运行的 `--out-dir` 保留为审核证据，不要只保留终端输出。
- 优先使用 `--json` 生成机器可读结果，便于自动化流程判断状态。
- 对会访问远程平台的命令，确认 API Key 对目标数据空间有权限。
- 对本地构建命令，先检查报告中的阻塞项，再进入发布或保存草稿步骤。
