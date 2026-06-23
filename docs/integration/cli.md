# TianGong LCA CLI 集成指南

TianGong LCA CLI 适合需要脚本化检索、批量审阅、草稿保存或发布前校验的用户。它不会替代网页端工作流；当您需要把数据检查接入本地流水线、复核 JSON/JSONL 文件，或在提交前预先发现格式问题时，CLI 更合适。

## 安装与运行

一次性运行发布包：

```bash
npm exec --yes --package=@tiangong-lca/cli@latest -- tiangong-lca --help
npm exec --yes --package=@tiangong-lca/cli@latest -- tiangong-lca doctor
```

也可以全局安装：

```bash
npm install --global @tiangong-lca/cli
tiangong-lca --help
```

当前发布包名为 `@tiangong-lca/cli`，可执行命令为 `tiangong-lca`。

## 连接远程环境

需要访问远程数据或执行写入类命令时，先配置：

```bash
TIANGONG_LCA_API_BASE_URL=
TIANGONG_LCA_API_KEY=
TIANGONG_LCA_SUPABASE_PUBLISHABLE_KEY=
TIANGONG_LCA_REGION=us-east-1
```

`TIANGONG_LCA_API_KEY` 应来自账号页面的 TianGong 用户 API key，不是 Supabase 项目 key。CLI 会用它换取用户会话，并复用访问令牌调用 Edge Functions 与必要的 Supabase 接口。

## 常用任务

查看远程对象：

```bash
tiangong-lca flow get --id <flow-id> --version <version> --json
tiangong-lca process get --id <process-id> --version <version> --json
```

校验本地数据行：

```bash
tiangong-lca dataset validate --input ./rows.jsonl --type auto --out-dir ./dataset-validate --json
```

保存草稿前先做本地预检查：

```bash
tiangong-lca process save-draft --input ./patched-processes.jsonl --out-dir ./process-save-draft --dry-run --json
tiangong-lca lifecyclemodel save-draft --input ./lifecyclemodels.jsonl --out-dir ./lifecyclemodel-save-draft --dry-run --json
```

处理流引用重写：

```bash
tiangong-lca dataset references rewrite \
  --input ./rows.jsonl \
  --from flow:<old-id>@<old-version> \
  --to flow:<new-id>@<new-version> \
  --out-dir ./dataset-rewrite \
  --json
```

## 读取校验结果

CLI 会优先使用快速 schema 校验；当校验失败时，会再次使用 TIDAS SDK 的深度实体校验来补充更具体的问题路径和错误信息。成功路径保持快速返回，失败路径会尽量给出更适合修复 payload 的说明。

处理校验失败时，优先查看输出目录中的报告文件和命令返回的 `issues`：

- `path` 表示问题所在字段或嵌套位置。
- `message` 说明应修正的内容。
- `code` 或 `issue_code` 可用于在自动化流水线中分类处理。

写入类命令建议先使用 `--dry-run`。确认本地校验通过、报告中没有必须修复的问题后，再执行带 `--commit` 或发布含义的命令。

## 获取命令帮助

```bash
tiangong-lca --help
tiangong-lca flow --help
tiangong-lca process --help
tiangong-lca lifecyclemodel --help
tiangong-lca publish --help
```
