---
description: Explain the top-bar TIDAS ZIP workflows and how asynchronous jobs appear in the shared task center.
---

# TIDAS ZIP Import, Export, and Task Center

The product now includes a user-facing TIDAS ZIP package workflow. These entries live in the global
top bar rather than inside a single data page.

If you only need the API flow, use [TIDAS Package Import API](/en/docs/openapi/tidas-package-import).
This page focuses on the web UI workflow.

## Where to find the entries

The relevant top-bar controls are:

- **Import TIDAS ZIP Package**
- **Export TIDAS ZIP Package**
- **Task Center**

If you need the broader control map first, start with
[Key Functions Overview](./key-functions-introduction).

## Import TIDAS ZIP Package

### Typical use cases

- Import a prepared TIDAS package into the current environment
- Migrate processes, models, flows, and dependencies in bulk
- Exchange data with other TIDAS-compatible tooling

### Rules

- The UI accepts **one `.zip` file**
- Non-ZIP files are rejected immediately
- The system validates structure, references, and conflicts before import
- Process `annualSupplyOrProductionVolume` is validated as localized text, while the web form guides
  you to enter a number and appends the reference-flow unit context
- Process exchange `location` should use TIDAS / ILCD location codes such as `CN`, `CN-BJ`, `RER`,
  or `GLO`; legacy non-empty text remains accepted for external-data compatibility
- Flow `CASNumber` values must pass both format and check-digit validation; an invalid check digit
  blocks import as a validation issue

### Import steps

1. Click **Import TIDAS ZIP Package** in the top bar.
2. Drag or select a single `.zip` file.
3. Click **Import**.
4. Review the result returned by the modal.

![Import TIDAS ZIP modal](img/tidas-zip-import-modal.png)

In the screenshot, `1` marks the ZIP upload zone, `2` marks the API-import documentation link, and
`3` marks the button that submits the import.

### Possible outcomes

#### Successful import

The platform confirms that the package has been imported successfully.

#### Success with skipped open data

If the ZIP contains open datasets that should not be duplicated, the system reports that some open
datasets were skipped.

#### Validation blocked

If required fields, references, or package structure fail validation, the import is blocked and the
modal explains the issues.

#### Conflict rejection

If the package conflicts with objects already present in the environment, the import is rejected
until those conflicts are resolved.

### How to troubleshoot

The import modal can provide a downloadable JSON report. Treat that file as the primary
troubleshooting artifact. It helps answer:

- Which objects failed validation
- Which references could not be resolved
- Which objects conflict with existing records
- Which open datasets were skipped

For repeatable automation or deeper control over error handling, use
[TIDAS Package Import API](/en/docs/openapi/tidas-package-import).

## Export TIDAS ZIP Package

### Core behaviour

Export is asynchronous. The system first creates an export job, then you return to **Task Center**
to download the final ZIP file.

### Available scopes

The visible export scope depends on your role:

| Role scope | Available options |
| --- | --- |
| Standard user | Current user data |
| System admin / owner | Current user data, Open data, Current user data + open data |

### Export steps

1. Click **Export TIDAS ZIP Package** in the top bar.
2. Choose the export scope.
3. Click **Export**.
4. Open **Task Center** and wait for the job to finish.

![Export TIDAS ZIP modal](img/tidas-zip-export-modal.png)

In the screenshot, `1` marks the export-scope selector and `2` marks the button that submits the
export task. The exact scope options depend on your role.

### Do not wait inside the modal

After submission, the modal only confirms that the task was created. The actual downloadable file is
handled by the task center rather than the export dialog itself.

## Task Center

### What it shows

Task Center is the shared background-job panel in the top bar. It currently combines:

- **LCA** tasks
- **TIDAS Export** tasks

> The current web import flow does not create a task-center item. Import feedback stays inside the
> import modal.

### Common actions

Inside Task Center you can usually:

- **Clear finished**
- **Download**: available only for completed TIDAS export jobs
- **Details**: inspect IDs, timestamps, filenames, and other metadata
- **Remove**: remove a record from the local task list

### A common export failure

One common failure is an export package that exceeds the environment's large-file upload limit.

Try the following first:

- Export a smaller scope
- Split the export into multiple runs
- Ask a system administrator whether large-file uploads can be enabled

## When to use the UI vs the API

Use the web UI when:

- You are doing one-off manual import or export work
- You want to inspect validation results interactively
- The workflow is being handled by a regular platform user

Use the API when:

- You need automation
- You need repeated imports in scripts or pipelines
- You want external systems to process validation and error reports directly
