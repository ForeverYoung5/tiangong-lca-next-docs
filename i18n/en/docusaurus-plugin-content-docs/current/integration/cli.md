# TianGong LCA CLI

The TianGong LCA CLI is a command-line tool for automation, batch operations, and local data governance. It is published as the npm package `@tiangong-lca/cli` and exposes the unified entrypoint `tiangong-lca` for search, read, validation, generation, review, and publish-preparation workflows.

## When to Use It

- Search or read flow, process, and lifecyclemodel data from scripts.
- Run identity preflight before generating new flows or processes so duplicate creation and low-confidence writes can be blocked early.
- Validate local TIDAS rows, rewrite references, complete required fields, or generate stable report artifacts.
- Chain process, flow, or lifecyclemodel build, review, and publish-preparation steps into a reproducible workflow.

## Run the CLI

Run the latest published version without installing it globally:

```bash
npm exec --yes --package=@tiangong-lca/cli@latest -- tiangong-lca --help
npm exec --yes --package=@tiangong-lca/cli@latest -- tiangong-lca doctor
npm exec --yes --package=@tiangong-lca/cli@latest -- tiangong-lca flow --help
```

Or install it globally:

```bash
npm install --global @tiangong-lca/cli
tiangong-lca --help
tiangong-lca doctor
```

The current runtime baseline is Node.js 24. If you run the CLI in automation, make sure the runner uses Node.js `24.x`.

## Environment Variables

Purely local commands usually do not need remote credentials. Configure these variables when a command accesses the TianGong LCA remote API, Edge Functions, or remote candidate search:

```bash
TIANGONG_LCA_API_BASE_URL=
TIANGONG_LCA_API_KEY=
TIANGONG_LCA_SUPABASE_PUBLISHABLE_KEY=
TIANGONG_LCA_REGION=us-east-1
```

`TIANGONG_LCA_API_KEY` is the TianGong LCA user API key generated from the account page, not a Supabase project key. The CLI exchanges it for a user session and then uses the resolved access token for remote service calls.

Optional local session controls:

```bash
TIANGONG_LCA_SESSION_FILE=
TIANGONG_LCA_DISABLE_SESSION_CACHE=false
TIANGONG_LCA_FORCE_REAUTH=false
```

## Common Commands

### Environment Diagnostics

```bash
tiangong-lca doctor
tiangong-lca doctor --json
```

`doctor` checks the environment visible to the CLI and prints the current configuration state with sensitive values masked.

### Search and Read

```bash
tiangong-lca search flow --input ./search-flow.request.json --json
tiangong-lca search process --input ./search-process.request.json --json
tiangong-lca search lifecyclemodel --input ./search-lifecyclemodel.request.json --json

tiangong-lca flow get --id <flow-id> --version <version> --json
tiangong-lca flow list --id <flow-id> --state-code 100 --limit 20 --json
tiangong-lca process get --id <process-id> --version <version> --json
tiangong-lca process list --state-code 100 --limit 20 --json
```

Search and remote read commands require the remote environment variables. Read commands filter the target dataset by command arguments and prefer structured JSON output so downstream scripts can keep processing the result.

### Preflight Before Generation

```bash
tiangong-lca process identity-preflight --input ./process-preflight.json --out-dir ./process-preflight --json
tiangong-lca flow identity-preflight --input ./flow-preflight.json --out-dir ./flow-preflight --json
```

Identity preflight compares a target object with local or remote candidate data and emits a reusable `IdentityDecision`, candidate evidence, and blocker/manual-review status. Use the command-specific `--remote-candidates`, `--remote-query`, and `--remote-limit` flags when remote candidates are needed.

### Build-Plan Gate

```bash
tiangong-lca process build-plan validate --input ./process-build-plan.json --out-dir ./process-build-plan --json
tiangong-lca process build-plan materialize --input ./process-build-plan.json --out-dir ./process-build-plan --json
tiangong-lca flow build-plan validate --input ./flow-build-plan.json --out-dir ./flow-build-plan --json
tiangong-lca flow build-plan materialize --input ./flow-build-plan.json --out-dir ./flow-build-plan --json
```

Build-plan gates validate the minimum authoring contract before generation or publish handoff, and when materialization is possible they write a standard `GateReport` plus deterministic TIDAS payloads.

### Data Validation and Reference Handling

```bash
tiangong-lca dataset validate --input ./rows.jsonl --type auto --out-dir ./dataset-validate --json
tiangong-lca dataset verify-remote --input ./rows.jsonl --out-dir ./dataset-remote-verify --json
tiangong-lca dataset references rewrite --input ./rows.jsonl --from flow:<old-id>@<old-version> --to flow:<new-id>@<new-version> --out-dir ./dataset-rewrite --json
tiangong-lca dataset bilingual extract --input ./rows/processes.jsonl --type process --out-dir ./translation --json
tiangong-lca dataset bilingual apply --input ./rows/processes.jsonl --translations ./translation/trans-reviewed.jsonl --out ./rows/processes.translated.jsonl --json
tiangong-lca dataset bilingual validate --input ./rows/processes.translated.jsonl --type process --out-dir ./translation-validate --json
```

These commands prioritize local reports, JSONL results, and evidence artifacts. Commands that can write remotely only access remote services when `--commit` is explicitly provided or when the command semantics require remote verification.

### Process, Flow, and Lifecyclemodel Workflows

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

Use these commands to split local build, review, validation, and publish-preparation work into repeatable steps. Publish-preparation commands typically generate bundles, requests, intents, or reports first; remote writes remain controlled by each command's `--dry-run` / `--commit` boundary.

## Outputs and Safety Boundaries

- Prefer `--json` for stable structured output in CI or agent workflows.
- Set `--out-dir` when you want reports, success/failure lists, and intermediate artifacts written to a predictable directory.
- Do not commit `TIANGONG_LCA_API_KEY`, session files, or generated credentials to a repository.
- Before running a command with `--commit`, use dry-run mode or local reports to confirm the input scope, target user, and data that will be written.

## Next Steps

- To connect MCP tooling, continue with [Local MCP](../MCP/lca_local.md) or [Remote MCP](../MCP/lca_remote.md).
- To work with TIDAS ZIP import and export flows, read [TIDAS ZIP Workflows](../user-guide/tidas-zip-workflows.md).
- To call the public import API, read [OpenAPI TIDAS Package Import](../openapi/tidas-package-import.md).
