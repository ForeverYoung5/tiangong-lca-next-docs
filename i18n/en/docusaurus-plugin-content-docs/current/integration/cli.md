# TianGong LCA CLI

The TianGong LCA CLI lets you run search, validation, modelling preflight, review,
and publish workflows from a local terminal or automation environment. It is useful when you need
to process JSON/JSONL data in batches, produce gate reports, or connect data production workflows
to scripts.

## Install and run

Run the published CLI without installing it globally:

```bash
npm exec --yes --package=@tiangong-lca/cli@latest -- tiangong-lca --help
npm exec --yes --package=@tiangong-lca/cli@latest -- tiangong-lca doctor
```

Or install it globally:

```bash
npm install --global @tiangong-lca/cli
tiangong-lca --help
tiangong-lca doctor
```

Use `doctor` to check the local runtime and remote connection configuration. On first setup,
start with `tiangong-lca --help`, then inspect the specific subcommand with `--help`.

## Environment variables for remote commands

Before calling remote data, search, or publish features, configure the API connection:

```bash
TIANGONG_LCA_API_BASE_URL=
TIANGONG_LCA_API_KEY=
TIANGONG_LCA_SUPABASE_PUBLISHABLE_KEY=
TIANGONG_LCA_REGION=us-east-1
```

`TIANGONG_LCA_API_KEY` is the TianGong user API key from the account page. The CLI exchanges that
key for a user session and then uses the access token for Edge Functions and Supabase data access.

Optional session controls:

```bash
TIANGONG_LCA_SESSION_FILE=
TIANGONG_LCA_DISABLE_SESSION_CACHE=false
TIANGONG_LCA_FORCE_REAUTH=false
```

## Common command areas

The CLI currently exposes these public command families:

| Command family | Purpose | Common use |
| --- | --- | --- |
| `search` | Search flow, process, or lifecyclemodel records | Find candidate data in automated workflows |
| `process` | Get, list, preflight, build, complete, save, and publish process data | Generate or repair process datasets in batches |
| `flow` | Get, list, preflight, build, remediate, publish, and repair flow references | Govern flow data and process references |
| `dataset` | Validate, translate, search evidence, verify remote references, and rewrite references | Check dataset quality before publish |
| `lifecyclemodel` | Build, validate, publish, and export model graphs | Automate model production and review |
| `review` | Review process, flow, lifecyclemodel rows, or run directories | Produce review reports and blockers |
| `publish` | Run publish requests and write publish reports | Submit gated data to remote services |

## Example workflows

### Search and read data

```bash
tiangong-lca search flow --input ./search-flow.request.json --json
tiangong-lca process get --id <process-id> --version <version> --json
tiangong-lca flow list --id <flow-id> --state-code 100 --limit 20 --json
```

### Validate local data before publish

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

Validation commands write their reports under `--out-dir`. Fix blockers from those reports before
moving on to save or publish steps.

### Process and flow preflight

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

Identity preflight helps identify reusable, updatable, or manually reviewed candidates before new
data is generated. Build-plan gates check required fields, evidence bindings, and TIDAS structure,
then emit standard reports.

### Record evidence search

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

This workflow records field-level evidence search plans, results, and declarations. The CLI
normalizes inputs and outputs; humans or agent workflows still decide whether the evidence supports
the modelling claim.

## Outputs and safety

- Prefer `--json` output when another tool will read the result.
- For commands that can write remotely, inspect reports with `--dry-run` or without `--commit` first.
- Point `--out-dir` to a stable directory so gate reports, failure lists, and publish reports are kept.
- Do not commit API keys to a repository; use local environment variables or managed secrets.

For command details, use `tiangong-lca --help` and each subcommand's `--help` output.
