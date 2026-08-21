# Command-Line Integration

Command-line workflows use two independent tools:

- [`tidas`](https://github.com/tiangong-lca/tidas-tools/releases/tag/v0.1.3) is the
  released native Rust executable for local TIDAS/eILCD conversion, external LCA
  import, package validation, database export, and deterministic release packaging.
- `tiangong-lca` is the npm-distributed TianGong LCA platform client for remote
  queries, draft writes, review, and other API workflows.

The commands are not aliases. Invoke `tidas` directly for local package work; do
not assume that `tiangong-lca` invokes it internally.

## Install `tidas` 0.1.3

Prebuilt archives are the preferred end-user channel and require no Rust,
Python, Java, or Node.js runtime. The installers download an immutable archive
and its `.sha256` file and verify it before installation.

### Linux and macOS

```bash
curl --proto '=https' --tlsv1.2 -fsSLO \
  https://github.com/tiangong-lca/tidas-tools/releases/download/v0.1.3/install.sh
sh install.sh --version 0.1.3 --prefix "$HOME/.local"
"$HOME/.local/bin/tidas" --version
```

Add `$HOME/.local/bin` to `PATH` if your shell does not already include it.

### Windows PowerShell

```powershell
Invoke-WebRequest `
  https://github.com/tiangong-lca/tidas-tools/releases/download/v0.1.3/install.ps1 `
  -OutFile install.ps1
.\install.ps1 -Version 0.1.3
& "$env:LOCALAPPDATA\Programs\tidas\bin\tidas.exe" --version
```

If prompted, add that `bin` directory to `PATH`.

### Prebuilt platforms

| Platform | Release archive |
| --- | --- |
| Linux x86_64 | `tidas-v0.1.3-x86_64-unknown-linux-gnu.tar.gz` |
| Linux ARM64 | `tidas-v0.1.3-aarch64-unknown-linux-gnu.tar.gz` |
| macOS Intel | `tidas-v0.1.3-x86_64-apple-darwin.tar.gz` |
| macOS Apple Silicon | `tidas-v0.1.3-aarch64-apple-darwin.tar.gz` |
| Windows x86_64 | `tidas-v0.1.3-x86_64-pc-windows-msvc.zip` |

Every archive in the
[v0.1.3 release](https://github.com/tiangong-lca/tidas-tools/releases/tag/v0.1.3)
has a SHA-256 sidecar and an SPDX SBOM. Windows ARM64 is outside the current
support matrix. The release also contains Homebrew formula and Winget manifest
files; their presence does not mean they have been submitted to an external tap
or the Winget Community repository.

### Install from crates.io

Developers with Rust 1.88+ and the platform libxml2/libxslt development
dependencies can install from source:

```bash
cargo install tidas --version 0.1.3 --locked
tidas --version
tidas version --format json
```

The crates.io package and installed executable are both named `tidas`.

## `tidas` package workflows

### Import an external format into TIDAS

`tidas import` supports EcoSpold 1/2, SimaPro CSV, openLCA JSON-LD, openLCA
process XLSX, and ILCD/eILCD inputs. It normally detects the format:

```bash
tidas import ./openlca-package.zip \
  --output ./imported \
  --target tidas \
  --format json

tidas validate ./imported/tidas \
  --input-format tidas-json \
  --issues ./imported/validation-issues.jsonl \
  --format json
```

Default outputs include `import-report.json`, `issues.jsonl`, `tidas/`, and
`process-bundles/<process_uuid>/`. Add `--write-mapping` to generate
`mapping.csv.gz` for field-level review, or `--no-process-bundles` when
per-process dependency packages are unnecessary. `.zolca` is unsupported;
export a supported exchange format from openLCA first.

### Convert between TIDAS and eILCD

```bash
tidas convert ./tidas-package \
  --output ./eilcd-package \
  --to ilcd \
  --format json

tidas convert ./eilcd-data \
  --output ./tidas-package \
  --to tidas \
  --format json
```

Converted data is under the output directory's `data/` subdirectory. Validate
the target representation before upload or downstream use:

```bash
tidas validate ./eilcd-package/data --input-format ilcd-xml --format json
tidas validate ./tidas-package/data --input-format tidas-json --format json
```

### Reports and exit codes

With `--format json`, stdout contains only the machine-readable report. Persist
complete issues with command-specific options such as `--issues`; use the
global `--report <PATH>` to write the operation report atomically.

| Exit | Meaning |
| ---: | --- |
| `0` | success |
| `2` | command completed with data issues |
| `64` | usage or option error |
| `69` | known capability is currently unavailable |
| `70` | internal error |
| `74` | required I/O failed |
| `130` | operation was cancelled |

Pipelines must inspect both the exit code and JSON fields such as `status`,
`exit_class`, `diagnostics`, `artifacts`, and `summary`; do not parse terminal
text alone.

## Install and run `tiangong-lca`

For remote platform queries, draft writes, and review workflows, run the latest
published package once:

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
tiangong-lca dataset maintenance plan --scope ./maintenance-scope.json --operation merge-support-aliases --out-dir ./dataset-maintenance --json
tiangong-lca dataset maintenance apply --plan ./dataset-maintenance/maintenance-plan.json --commit --approve-plan <sha256> --confirm <current-account-email> --json
tiangong-lca dataset maintenance verify --plan ./dataset-maintenance/maintenance-plan.json --out-dir ./dataset-maintenance/verify --json
tiangong-lca publish run --input ./publish-request.json --dry-run --json
```

- `identity-preflight` compares a target process or flow with candidate data and reports whether automation can reuse it, should route it to manual review, or should block new creation.
- `build-plan validate` checks whether a process or flow build plan includes identity decisions, evidence bindings, naming plans, `unit_of_analysis` decisions, and the required reference-flow or flow-property fields.
- `dataset evidence-search plan/run` plans field-level public evidence retrieval and records external search results; the CLI owns the query matrix, budget, result normalization, and evidence declaration artifacts, while human or agent workflows still own source judgement.
- `dataset maintenance plan/apply/verify` supports controlled data cleanup and private draft alias repair. `plan` freezes the exact current-user-visible rows, versions, hashes, and maintenance intent; `apply` writes only when `--commit`, `--approve-plan <sha256>`, and `--confirm <current-account-email>` are all present; and `verify` performs a fresh remote readback. `merge-support-aliases` is limited to fixed `time` and `length_time` batches under `target_mode: "owner_draft"`: every source/target unit group, flow property, flow, and process must belong to the current account and remain draft `state_code=0`; public, shared, foreign-owner, non-draft, or mixed-visibility rows stay protected.
- `publish run --dry-run` reports publish ruleset results before a real write or publish step.

These commands write machine-readable reports under `outputs/` or `reports/` in the selected `--out-dir`. For automation, read fields such as `status`, `blockers`, `issues`, `files`, and artifact paths instead of relying on terminal text.

## `tiangong-lca` validation and failure reports

`dataset validate`, `process save-draft`, `lifecyclemodel save-draft`, and related repair commands run local TIDAS schema validation before writing data. When fast validation fails, the current CLI uses SDK-backed deep validation to provide more specific issue paths and messages.

That means:

- data that passes validation still uses the fast path;
- invalid data should return more actionable field paths, issue codes, and messages;
- before any `--commit` write, schema-invalid rows are blocked and recorded in `failures.jsonl` or the validation report under the output directory.
- TIDAS schema `common:classification` / `common:category` paths may stop at their natural category depth; do not add empty lower-level classes just to fill the hierarchy. Over-deep paths, duplicate levels, or invalid values are still blocked.
- For batch draft writes, pass `--target-user-id` with `process save-draft --commit`. The CLI verifies the current auth session and any visible draft owner before writing, while readback verification still proves the final owner and payload.
- `dataset save-draft` still blocks Unit Group, Flow Property, and other reference-only foundational configuration from being written as account-local drafts by default. Use `--allow-account-local-support`, or set `TIANGONG_ALLOW_ACCOUNT_LOCAL_SUPPORT=1`, only for controlled migration or repair runs that intentionally need those support rows in My Data; interactive operators should prefer existing database rows.
- `dataset classification apply --type location` can create the missing parent object and target field when `target_path` explicitly points at a schema-derived location field. Ambiguous paths or non-location fields still block.
- `dataset evidence-search run` writes the search plan, normalized results, report, and, when evidence is insufficient or partial, an evidence declaration JSON under `outputs/`.

For `tiangong-lca` pipeline integrations, read JSON fields such as `status`,
`counts`, `issues`, `files`, and generated `outputs/**` artifacts instead of
relying only on terminal text. Use the independent `tidas` command described
above for local package import, conversion, or complete package validation.
