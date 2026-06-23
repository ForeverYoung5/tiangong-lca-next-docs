# TianGong LCA CLI integration guide

The TianGong LCA CLI is useful when you need scripted search, batch review, draft-save checks, or
pre-publish validation. It does not replace the web UI. Use it when you want to plug data checks
into a local pipeline, inspect JSON or JSONL files, or catch payload problems before submitting
changes.

## Install and run

Run the published package once:

```bash
npm exec --yes --package=@tiangong-lca/cli@latest -- tiangong-lca --help
npm exec --yes --package=@tiangong-lca/cli@latest -- tiangong-lca doctor
```

Or install it globally:

```bash
npm install --global @tiangong-lca/cli
tiangong-lca --help
```

The package name is `@tiangong-lca/cli`, and the executable command is `tiangong-lca`.

## Connect to a remote environment

Set these variables before commands that read remote data or perform writes:

```bash
TIANGONG_LCA_API_BASE_URL=
TIANGONG_LCA_API_KEY=
TIANGONG_LCA_SUPABASE_PUBLISHABLE_KEY=
TIANGONG_LCA_REGION=us-east-1
```

`TIANGONG_LCA_API_KEY` should be the TianGong user API key from the account page, not a Supabase
project key. The CLI exchanges it for a user session, then reuses the access token for Edge
Functions and required Supabase calls.

## Common tasks

Read remote objects:

```bash
tiangong-lca flow get --id <flow-id> --version <version> --json
tiangong-lca process get --id <process-id> --version <version> --json
```

Validate local data rows:

```bash
tiangong-lca dataset validate --input ./rows.jsonl --type auto --out-dir ./dataset-validate --json
```

Run local checks before saving drafts:

```bash
tiangong-lca process save-draft --input ./patched-processes.jsonl --out-dir ./process-save-draft --dry-run --json
tiangong-lca lifecyclemodel save-draft --input ./lifecyclemodels.jsonl --out-dir ./lifecyclemodel-save-draft --dry-run --json
```

Rewrite flow references:

```bash
tiangong-lca dataset references rewrite \
  --input ./rows.jsonl \
  --from flow:<old-id>@<old-version> \
  --to flow:<new-id>@<new-version> \
  --out-dir ./dataset-rewrite \
  --json
```

## Read validation output

The CLI uses fast schema validation first. When validation fails, it reruns TIDAS SDK entity
validation to add more specific issue paths and messages. Successful payloads still use the fast
path; failed payloads should include details that are easier to act on.

When a validation command fails, start with the report files in the output directory and the
returned `issues`:

- `path` points to the field or nested location.
- `message` describes what needs to be fixed.
- `code` or `issue_code` can be used to classify failures in automation.

For write-oriented commands, run with `--dry-run` first. Use `--commit` or publish-style commands
only after local validation passes and the report no longer contains blocking issues.

## Get command help

```bash
tiangong-lca --help
tiangong-lca flow --help
tiangong-lca process --help
tiangong-lca lifecyclemodel --help
tiangong-lca publish --help
```
