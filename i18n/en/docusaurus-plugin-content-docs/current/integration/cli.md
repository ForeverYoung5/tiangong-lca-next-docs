# TianGong LCA CLI

Use the TianGong LCA CLI when you need repeatable scripts for search, data validation, process building, lifecycle model building, or batch review. The web UI is better for one-off interactive work; the CLI is better for local automation and pipelines.

## Install and run

Run the latest published package once:

```bash
npm exec --yes --package=@tiangong-lca/cli@latest -- tiangong-lca --help
npm exec --yes --package=@tiangong-lca/cli@latest -- tiangong-lca doctor
```

Install globally:

```bash
npm install --global @tiangong-lca/cli
tiangong-lca --help
tiangong-lca doctor
```

## Environment variables

Remote commands need the TianGong LCA API URL and a user API key:

```bash
TIANGONG_LCA_API_BASE_URL=
TIANGONG_LCA_API_KEY=
TIANGONG_LCA_SUPABASE_PUBLISHABLE_KEY=
TIANGONG_LCA_REGION=us-east-1
```

- `TIANGONG_LCA_API_BASE_URL` can point to the project root, `/functions/v1`, or `/rest/v1`.
- `TIANGONG_LCA_API_KEY` is the TianGong user API key from the account page, not a Supabase project key.
- The CLI exchanges the API key for a user session and reuses that session for Edge Functions and Supabase data access.

## Common commands

```bash
tiangong-lca search flow --input ./search-flow.request.json --json
tiangong-lca search process --input ./search-process.request.json --json
tiangong-lca flow get --id <flow-id> --version <version> --json
tiangong-lca process list --state-code 100 --limit 20 --json
tiangong-lca dataset validate --input ./rows.jsonl --type auto --out-dir ./dataset-validate --json
tiangong-lca dataset import-lca convert --input ./openlca-package.zip --output-dir ./import-lca --target both --json
tiangong-lca dataset evidence-search plan --query "China 2026 electricity mix data" --out-dir ./evidence-search --json
tiangong-lca dataset evidence-search run --input ./evidence-search.request.json --results ./search-results.json --out-dir ./evidence-search --json
tiangong-lca process save-draft --input ./patched-processes.jsonl --out-dir ./process-save-draft --dry-run --json
tiangong-lca lifecyclemodel validate-build --run-dir ./lifecyclemodel-run --json
```

Use built-in help for full options:

```bash
tiangong-lca flow --help
tiangong-lca process --help
tiangong-lca lifecyclemodel --help
tiangong-lca review --help
```

## Automation Gates

For data-production pipelines, the CLI also provides quality-gate commands that are useful before writing data, publishing data, or handing work to a reviewer:

```bash
tiangong-lca process identity-preflight --input ./process-preflight.json --out-dir ./process-preflight --json
tiangong-lca flow identity-preflight --input ./flow-preflight.json --out-dir ./flow-preflight --json
tiangong-lca process build-plan validate --input ./process-build-plan.json --out-dir ./process-build-plan --json
tiangong-lca flow build-plan validate --input ./flow-build-plan.json --out-dir ./flow-build-plan --json
tiangong-lca publish run --input ./publish-request.json --dry-run --json
```

- `identity-preflight` compares a target process or flow with candidate data and reports whether automation can reuse it, should route it to manual review, or should block new creation.
- `build-plan validate` checks whether a process or flow build plan includes identity decisions, evidence bindings, naming plans, `unit_of_analysis` decisions, and the required reference-flow or flow-property fields.
- `dataset evidence-search plan/run` plans field-level public evidence retrieval and records external search results; the CLI owns the query matrix, budget, result normalization, and evidence declaration artifacts, while human or agent workflows still own source judgement.
- `publish run --dry-run` reports publish ruleset results before a real write or publish step.

These commands write machine-readable reports under `outputs/` or `reports/` in the selected `--out-dir`. For automation, read fields such as `status`, `blockers`, `issues`, `files`, and artifact paths instead of relying on terminal text.

## Validation and failure reports

`dataset validate`, `process save-draft`, `lifecyclemodel save-draft`, and related repair commands run local TIDAS schema validation before writing data. When fast validation fails, the current CLI uses SDK-backed deep validation to provide more specific issue paths and messages.

That means:

- data that passes validation still uses the fast path;
- invalid data should return more actionable field paths, issue codes, and messages;
- before any `--commit` write, schema-invalid rows are blocked and recorded in `failures.jsonl` or the validation report under the output directory.
- For batch draft writes, pass `--target-user-id` with `process save-draft --commit`. The CLI verifies the current auth session and any visible draft owner before writing, while readback verification still proves the final owner and payload.
- `dataset import-lca convert` follows the tidas-tools default for process dependency bundles. Pass `--no-process-bundles` to disable them, or `--process-bundles-dir` to choose a custom directory. The report fills `mapping_csv`, `process_bundles_dir`, and `process_bundles_index` only when those files exist on disk; `mapping.csv.gz` appears only when the converter is explicitly configured to write it.
- `dataset classification apply --type location` can create the missing parent object and target field when `target_path` explicitly points at a schema-derived location field. Ambiguous paths or non-location fields still block.
- `dataset evidence-search run` writes the search plan, normalized results, report, and, when evidence is insufficient or partial, an evidence declaration JSON under `outputs/`.

For pipeline integrations, read JSON fields such as `status`, `counts`, `issues`, `files`, and generated `outputs/**` artifacts instead of relying only on terminal text.
