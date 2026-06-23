# TianGong LCA CLI

TianGong LCA CLI is for advanced users who need to inspect, generate, validate, and publish TIDAS
data from local scripts or automation pipelines. It is commonly used before a web import or review
submission, and in Foundry, CI, or scripted handoff workflows that need repeatable artifacts.

## When to use it

Use the CLI when you need to:

- Decide whether a process or flow should be reused, updated, versioned, created, blocked, or sent
  to manual review before generation.
- Validate process, flow, dataset-reference, and publish-run rules before handoff.
- Produce stable JSON reports for downstream automation or reviewers.
- Check or refresh references against remotely published data.

For everyday browsing, editing, or review work, use the web workflows in
[Create My Data](../user-guide/create-my-data) and [Data Review](../user-guide/data-review).

## Install and run

In a Node.js environment, run the package CLI directly:

```bash
npm exec tiangong-lca -- --help
```

For local pipelines, pin project dependencies, use a stable output directory, and keep the generated
`outputs/` reports as part of the delivery record.

## Identity preflight before generation

`process identity-preflight` and `flow identity-preflight` check for duplicate or reusable records
before you generate a new process or flow.

```bash
tiangong-lca process identity-preflight --input ./process-preflight.json --out-dir ./process-preflight --json
tiangong-lca flow identity-preflight --input ./flow-preflight.json --out-dir ./flow-preflight --json
```

Typical outputs include:

- `outputs/identity-decision.json`
- `outputs/identity-candidates.jsonl`
- `outputs/identity-candidate-sources.json`

The preflight decision can tell you to reuse, update, create a new version, block duplicate creation,
or perform manual review. By default it reads embedded and local candidates only. Add
`--remote-candidates`, `--remote-query`, and `--remote-limit` when the preflight should also query
the published platform catalog. Remote candidate search requires the platform API environment
variables.

## BuildPlan gate

Run `process build-plan` and `flow build-plan` after identity preflight and before producing the
final TIDAS payload.

```bash
tiangong-lca process build-plan validate --input ./process-build-plan.json --out-dir ./process-build-plan --json
tiangong-lca process build-plan materialize --input ./process-build-plan.json --out-dir ./process-build-plan --json
tiangong-lca flow build-plan validate --input ./flow-build-plan.json --out-dir ./flow-build-plan --json
tiangong-lca flow build-plan materialize --input ./flow-build-plan.json --out-dir ./flow-build-plan --json
```

`validate` checks the plan and evidence. `materialize` deterministically creates a canonical
`processDataSet` or `flowDataSet` when the plan does not already embed a payload, then validates it
with the TIDAS schema.

Review these artifacts first:

- `outputs/build-plan-gate-report.json`
- The materialized process or flow JSON
- Blockers, manual-review items, and ruleset versions

## Remote verification and reference refresh

After local row data is ready, use these commands to check published remote versions:

```bash
tiangong-lca dataset verify-remote --input ./rows.jsonl --out-dir ./dataset-remote-verify --json
tiangong-lca dataset references refresh-remote --input ./rows.jsonl --out ./rows.refreshed.jsonl --out-dir ./dataset-reference-refresh --json
```

`verify-remote` distinguishes existing remote rows, new candidate roots, and unresolved references.
`references refresh-remote` runs a pre-refresh verification, updates reachable references to the
latest remote versions, and then runs a post-refresh verification.

## Automation builds and publish reports

Automation workflows usually chain CLI commands into an auditable local run directory:

```bash
tiangong-lca process auto-build --input ./process-auto-build.request.json --out-dir ./process-run --json
tiangong-lca lifecyclemodel auto-build --input ./lifecyclemodel-auto-build.request.json --out-dir ./lifecyclemodel-run --json
tiangong-lca publish run --input ./publish.request.json --out-dir ./publish-run --json
```

Publish runs write both `verification-report.json` and `publish-report.json`. If the ruleset report
contains blockers, repair the data, evidence, or references before continuing.

## How to read reports

When triaging a CLI result, read in this order:

1. The command exit status and top-level `status`.
2. Blockers, failed entries, and deferred entries in `outputs/*report.json`.
3. Ruleset ID, ruleset version, and source version so you know which CLI version produced the
   report.
4. Candidate sources, remote query settings, and the materialized canonical payload.

CLI reports are automation handoff records. They do not replace the final web review workflow. Use
the platform review flow whenever team review, reviewer assignment, or collaboration notifications
are required.
