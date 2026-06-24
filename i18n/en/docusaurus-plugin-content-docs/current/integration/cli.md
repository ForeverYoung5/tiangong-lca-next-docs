# CLI Integration

The `tiangong-lca` CLI is for advanced users and integration workflows that need to automate data retrieval, local data-building artifacts, and pre-review checks. It is best used to generate structured artifacts locally or in automation, then hand those artifacts to review, publishing, or orchestration workflows.

## Before You Start

1. Install and build `tiangong-lca-cli`.
2. Run `tiangong-lca doctor --json` to inspect the runtime environment.
3. For commands that call the remote TianGong LCA service, configure `TIANGONG_LCA_API_BASE_URL`, `TIANGONG_LCA_API_KEY`, `TIANGONG_LCA_SUPABASE_PUBLISHABLE_KEY`, and optionally `TIANGONG_LCA_REGION`.
4. For local-only artifact commands, pass `--out-dir` and keep the generated reports for review evidence.

## Common Command Groups

### Search and Read

Use `search` and read commands to query platform data:

```bash
tiangong-lca search flow --input ./search-flow.request.json --json
tiangong-lca search process --input ./search-process.request.json --json
tiangong-lca search lifecyclemodel --input ./search-lifecyclemodel.request.json --json
tiangong-lca process get --id <process-id> --version <version> --json
```

Search results are limited by the current API key and platform permissions. Empty search results may appear as `[]` or `{"data":[]}`; integration workflows should treat both shapes as empty results.

### Build-Plan Gates

Before generating or publishing process and flow data, use build-plan gates to check the minimum authoring contract:

```bash
tiangong-lca process build-plan validate --input ./process-build-plan.json --out-dir ./process-build-plan --json
tiangong-lca process build-plan materialize --input ./process-build-plan.json --out-dir ./process-build-plan --json
tiangong-lca flow build-plan validate --input ./flow-build-plan.json --out-dir ./flow-build-plan --json
tiangong-lca flow build-plan materialize --input ./flow-build-plan.json --out-dir ./flow-build-plan --json
```

The gate writes `build-plan-gate-report.json`. When the input is valid and no blockers remain, `materialize` can write deterministic TIDAS payloads for later draft saving, review, or publishing.

### Process Auto Build

`process auto-build` prepares a local process build run directory and stage artifacts. It does not implicitly write platform data:

```bash
tiangong-lca process auto-build --input ./pff-request.json --out-dir /abs/path/to/process-run --json
```

Typical outputs include the normalized request, source policy, input manifest, build plan, assembly plan, run manifest, state file, and report. Continue with `resume-build`, `publish-build`, or review commands when the generated artifacts are ready.

### Dataset Evidence Search

Use `dataset evidence-search` to plan field-level public evidence retrieval or record existing search results:

```bash
tiangong-lca dataset evidence-search plan --query "中国2026年电力结构数据" --out-dir ./evidence-search --json
tiangong-lca dataset evidence-search run --input ./evidence-search.request.json --results ./search-results.json --out-dir ./evidence-search --json
```

The plan action writes a query matrix. The run action writes normalized results, a report, and a declaration file when evidence is insufficient or only partially time-covered. It requires no extra environment variables by default; when calling an external search provider with `--provider-url`, pass authentication explicitly with `--provider-key`.

## Artifact Handling Tips

- Keep each run's `--out-dir` as review evidence instead of relying only on terminal output.
- Prefer `--json` for machine-readable status in automation.
- For commands that call the remote platform, confirm the API key has access to the target data space.
- For local build commands, inspect report blockers before moving to publish or draft-saving steps.
