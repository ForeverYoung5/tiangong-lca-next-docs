# CLI Integration

The TianGong LCA CLI is for users who need to call platform data workflows from local scripts,
data pipelines, or automation jobs. The npm package is `@tiangong-lca/cli`, the executable is
`tiangong-lca`, and Node 24 is recommended.

## Install and Run

For one-off usage of the latest published CLI:

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

Use `doctor` first when setting up the CLI or troubleshooting environment and authentication
problems.

## Authentication Environment

Remote data commands require these environment variables:

```bash
TIANGONG_LCA_API_BASE_URL=
TIANGONG_LCA_API_KEY=
TIANGONG_LCA_SUPABASE_PUBLISHABLE_KEY=
TIANGONG_LCA_REGION=us-east-1
```

- `TIANGONG_LCA_API_BASE_URL` may point at the project root, `/functions/v1`, or `/rest/v1`.
- `TIANGONG_LCA_API_KEY` is the user API key generated from the TianGong LCA account profile page,
  not a Supabase project key.
- The CLI exchanges the user API key for a user session, then reuses the access token for Edge
  Functions and Supabase data access.

## Common Command Families

| Command family | When to use it | Main output |
| --- | --- | --- |
| `dataset validate` | Validate local TIDAS JSON/JSONL rows | validation report, valid rows, invalid rows |
| `dataset verify-remote` | Check whether local roots and references exist remotely | remote verification report, blockers |
| `dataset references refresh-remote` | Refresh references to reachable latest remote versions | refresh report and patched rows |
| `process identity-preflight` / `flow identity-preflight` | Check identity before creating a process or flow | `identity-decision.json`, candidate records |
| `process build-plan` / `flow build-plan` | Validate or materialize build plans | `build-plan-gate-report.json`, materialized TIDAS payloads |
| `process save-draft` | Validate process rows before saving drafts | save result and failure rows |
| `flow publish-version` | Run gates before publishing a flow version | `flow-publish-version-gate-report.json` |
| `process publish-build` | Run schema gates before process publish handoff | `process-publish-schema-gate.json` |
| `review process` / `review flow` | Run local review over processes or flows | review report |
| `publish run` | Execute a publish request and verification report | `publish-report.json`, `verification-report.json` |

Common examples:

```bash
tiangong-lca dataset validate --input ./rows.jsonl --type auto --out-dir ./dataset-validate --json
tiangong-lca process identity-preflight --input ./process-preflight.json --candidate-input ./processes.jsonl --out-dir ./process-preflight --json
tiangong-lca process build-plan validate --input ./process-build-plan.json --out-dir ./process-build-plan --json
tiangong-lca process build-plan materialize --input ./process-build-plan.json --out-dir ./process-build-plan --json
tiangong-lca dataset verify-remote --input ./rows.jsonl --out-dir ./remote-verify --json
```

## Recommended Order

1. Run `tiangong-lca doctor` to confirm Node, API base, and credentials.
2. Run `dataset validate` for imported or locally generated TIDAS rows.
3. Before creating a new process or flow, run `process identity-preflight` or `flow identity-preflight`.
4. Validate authoring plans with `process build-plan validate` or `flow build-plan validate`.
5. When you need canonical TIDAS payloads, run the matching `build-plan materialize` command.
6. Before saving or publishing, inspect the gate reports from `process save-draft`, `flow publish-version`,
   `process publish-build`, or `publish run`.

## Outputs and Troubleshooting

- `blocked` usually means the local data, references, or build plan must be fixed before publishing.
- `manual_review` means the identity or semantic decision is uncertain and needs human review.
- `--candidate-input` is repeatable and accepts JSON, JSONL, or a directory; the CLI records candidate
  source provenance.
- `--remote-candidates` uses remote hybrid search and requires working authentication environment variables.
- For `publish run`, relative `out_dir` values are resolved from the request file directory. Use an
  absolute path when the output location must be fixed.

If you want to import a TIDAS ZIP package directly over HTTP, use the
[TIDAS Package Import API](/en/docs/openapi/tidas-package-import).
