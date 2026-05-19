---
title: CLI
description: Install and configure the TianGong LCA CLI for data lookup, local validation, reference rewriting, and draft saves.
---

The TianGong LCA CLI is for users who need to script data operations, validate TIDAS datasets in bulk, or write governance results back to the platform. It does not replace the web UI for everyday editing; it is best suited to local pipelines, data-governance scripts, and team automation.

The package is `@tiangong-lca/cli`, and the executable is `tiangong-lca`. Node.js 24.x is recommended.

## Install and run

For one-off commands, run the published package directly:

```bash
npm exec --yes --package=@tiangong-lca/cli@latest -- tiangong-lca --help
npm exec --yes --package=@tiangong-lca/cli@latest -- tiangong-lca doctor
```

For regular use, install it globally:

```bash
npm install --global @tiangong-lca/cli
tiangong-lca --help
tiangong-lca doctor
```

## Environment variables

Remote commands require:

```bash
TIANGONG_LCA_API_BASE_URL=
TIANGONG_LCA_API_KEY=
TIANGONG_LCA_SUPABASE_PUBLISHABLE_KEY=
TIANGONG_LCA_REGION=us-east-1
```

Notes:

- `TIANGONG_LCA_API_BASE_URL` accepts the project root, `/functions/v1`, or `/rest/v1`.
- `TIANGONG_LCA_API_KEY` is the user API key generated on the TianGong LCA [Account Management & API Key](/en/user-guide/account-profile) page. It is not a Supabase project key.
- The CLI exchanges the user API key for a user session, then reuses that session for Edge Functions and direct Supabase reads.
- Treat the API key as account credentials. Do not commit it to Git, logs, or shared documents.

Optional session controls:

```bash
TIANGONG_LCA_SESSION_FILE=
TIANGONG_LCA_DISABLE_SESSION_CACHE=false
TIANGONG_LCA_FORCE_REAUTH=false
```

## Health checks

Use `doctor` to confirm runtime, authentication, and remote connectivity:

```bash
tiangong-lca doctor
tiangong-lca doctor --json
```

When an authentication, base URL, or environment issue appears, run `doctor` before continuing with data commands.

## Search and read data

The CLI can search and read flow, process, and lifecyclemodel datasets. Request bodies are usually stored in JSON files:

```bash
tiangong-lca search flow --input ./search-flow.request.json --json
tiangong-lca search process --input ./search-process.request.json --json
tiangong-lca search lifecyclemodel --input ./search-lifecyclemodel.request.json --json
```

To read individual rows or lists:

```bash
tiangong-lca flow get --id <flow-id> --version <version> --json
tiangong-lca flow list --id <flow-id> --state-code 100 --limit 20 --json
tiangong-lca process get --id <process-id> --version <version> --json
tiangong-lca process list --id <process-id> --state-code 100 --limit 20 --json
```

`state-code 100` is commonly used for published or referenceable data versions. Empty search results may appear as `[]` or as `{"data":[]}`; scripts should handle both shapes.

## Validate local datasets

`dataset validate` validates local flow, process, and lifecyclemodel JSON/JSONL rows against the TIDAS SDK schemas:

```bash
tiangong-lca dataset validate \
  --input ./rows.jsonl \
  --type auto \
  --out-dir /abs/path/to/dataset-validate \
  --json
```

Common options:

| Option | Meaning |
| --- | --- |
| `--input` | Local JSON or JSONL file |
| `--type` | `auto`, `flow`, `process`, or `lifecyclemodel`; defaults to `auto` |
| `--out-dir` | Output directory for reports and valid/invalid rows |
| `--json` | Emit command output as JSON |

Typical artifacts include:

- `outputs/validation-report.json`
- `outputs/valid-rows.jsonl`
- `outputs/invalid-rows.jsonl`

Before bulk import, scripted repair, or review submission, run local validation to confirm required fields and references match the current SDK rules.

## Rewrite data references

`dataset references rewrite` replaces flow references in local process and lifecyclemodel rows. Without `--commit`, it only writes local artifacts and does not change remote data:

```bash
tiangong-lca dataset references rewrite \
  --input ./rows.jsonl \
  --from flow:<old-id>@<old-version> \
  --to flow:<new-id>@<new-version> \
  --out-dir /abs/path/to/dataset-rewrite \
  --json
```

After reviewing the local artifacts and configuring the remote environment variables, add `--commit` to write the patched rows back:

```bash
tiangong-lca dataset references rewrite \
  --input ./rows.jsonl \
  --from flow:<old-id>@<old-version> \
  --to flow:<new-id>@<new-version> \
  --out-dir /abs/path/to/dataset-rewrite \
  --commit \
  --json
```

On commit, the CLI uses the relevant save-draft path and validates canonical process or lifecyclemodel payloads locally before writing. Schema-invalid rows are not persisted and are recorded in failure reports.

## Save drafts and generate model graphs

When you already have canonical process or lifecyclemodel payloads locally, use the save-draft commands:

```bash
tiangong-lca process save-draft \
  --input ./patched-processes.jsonl \
  --out-dir /abs/path/to/process-save-draft \
  --dry-run \
  --json

tiangong-lca lifecyclemodel save-draft \
  --input ./lifecyclemodels.jsonl \
  --out-dir /abs/path/to/lifecyclemodel-save-draft \
  --dry-run \
  --json
```

Review the output before changing `--dry-run` to `--commit`. `process save-draft` writes through the process draft-maintenance path, while `lifecyclemodel save-draft` writes through the lifecyclemodel bundle save path.

For lifecyclemodels, you can also generate graph and connection-check artifacts:

```bash
tiangong-lca lifecyclemodel graph \
  --input ./lifecyclemodels.jsonl \
  --out-dir /abs/path/to/lifecyclemodel-graph \
  --format all \
  --json
```

Common outputs include `graphs/*.json`, `graphs/*.dot`, `graphs/*.svg`, and `outputs/graph-report.json`.

## Relationship to the web UI and API

- For one-off manual creation, copying, citing, and review submission, use the web UI flows in [Data Creation](/en/user-guide/create-my-data) and [Data Use](/en/user-guide/data-use).
- For manual TIDAS ZIP import, export, and Task Center operations, see [TIDAS ZIP Import, Export, and Task Center](/en/user-guide/tidas-zip-workflows).
- To import TIDAS ZIP packages through HTTP, see [TIDAS Package Import API](/en/docs/openapi/tidas-package-import).
- To validate local datasets in bulk, rewrite flow references, generate lifecyclemodel graphs, or save scripted governance results as drafts, use the CLI.
