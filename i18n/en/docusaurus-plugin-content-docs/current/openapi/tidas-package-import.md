---
id: tidas-package-import
title: TIDAS Package Import API
slug: /docs/openapi/tidas-package-import
description: Import TIDAS ZIP packages through the TianGong LCA API with API key authentication.
---

This guide explains how to import a TIDAS ZIP package through the TianGong LCA
Edge Function API. The recommended API base is your deployed Edge Function URL
with `/functions/v1` appended.

## Typical Use Cases

- Bulk-import TIDAS ZIP packages from an external system
- Reuse the same async import flow as the product UI
- Consume structured validation failures, open-data filtering results, and user
  conflict details

## Authentication and Base URL

The recommended auth header is:

```http
Authorization: Bearer <USER_API_KEY>
```

- `USER_API_KEY` can be generated from the TianGong LCA account profile page
- Treat the API key as a secret with the same care as account credentials
- First-party browser sessions may still use `USER_JWT`, but external API
  integrations should prefer `USER_API_KEY`

Example base URL:

```text
https://<your-project-ref>.supabase.co/functions/v1
```

If you are using the current TianGong LCA cloud service, use:

```text
https://qgzvkongdjqiiamzbbts.supabase.co/functions/v1
```

## Flow Overview

The full import flow has four steps:

1. Call `POST /import_tidas_package` with `action=prepare_upload`
2. Upload the ZIP bytes to the returned signed upload target
3. Call `POST /import_tidas_package` with `action=enqueue`
4. Poll `GET /tidas_package_jobs/{job_id}` and inspect the import report

It is a good idea to send `X-Idempotency-Key` with `prepare_upload` and
`enqueue` so clients can retry safely.

## 1. Prepare Upload

Request:

```bash
curl -i --location --request POST "${BASE_URL}/import_tidas_package" \
  --header 'Content-Type: application/json' \
  --header "Authorization: Bearer ${USER_API_KEY}" \
  --header 'X-Idempotency-Key: tidas-import-prepare-001' \
  --data '{
    "action": "prepare_upload",
    "filename": "example-package.zip",
    "byte_size": 123456,
    "content_type": "application/zip"
  }'
```

Example response:

```json
{
  "ok": true,
  "action": "prepare_upload",
  "job_id": "4a56e7b2-8f18-4f0f-a6b4-cf40f343d8b8",
  "source_artifact_id": "9ad0da68-3933-4f7b-a3cb-a494b70ec0a2",
  "artifact_url": "https://example.supabase.co/storage/v1/object/sign/tidas/import/example-package.zip",
  "upload": {
    "bucket": "tidas",
    "object_path": "imports/example-package.zip",
    "path": "imports/example-package.zip",
    "token": "signed-upload-token",
    "signed_url": "https://example.supabase.co/storage/v1/upload/resumable",
    "expires_in_seconds": 300,
    "filename": "example-package.zip",
    "byte_size": 123456,
    "content_type": "application/zip"
  }
}
```

Important fields:

- `job_id`: used when polling the async job
- `source_artifact_id`: required in the later `enqueue` call
- `upload.signed_url`: the direct upload URL that CLI or generic HTTP clients
  can use
- `upload.bucket` + `upload.path` + `upload.token`: useful when your client is
  already integrated with the Supabase Storage SDK

## 2. Upload the ZIP File

If `upload.signed_url` is present, the recommended CLI-friendly approach is to
upload the ZIP directly:

```bash
curl -i --request PUT "${SIGNED_URL}" \
  --header 'Content-Type: application/zip' \
  --data-binary @./example-package.zip
```

Here `SIGNED_URL` is the `upload.signed_url` value returned by
`prepare_upload`.

If your client already uses the Supabase Storage SDK, you can alternatively use
`upload.bucket`, `upload.path`, and `upload.token` with
`uploadToSignedUrl(...)`:

```ts
const { error } = await supabase.storage
  .from(upload.bucket)
  .uploadToSignedUrl(upload.path, upload.token, file, {
    contentType: upload.content_type,
    upsert: true,
  });
```

## 3. Enqueue

After the upload succeeds, mark the source artifact ready and enqueue the async
import worker:

```bash
curl -i --location --request POST "${BASE_URL}/import_tidas_package" \
  --header 'Content-Type: application/json' \
  --header "Authorization: Bearer ${USER_API_KEY}" \
  --header 'X-Idempotency-Key: tidas-import-enqueue-001' \
  --data '{
    "action": "enqueue",
    "job_id": "4a56e7b2-8f18-4f0f-a6b4-cf40f343d8b8",
    "source_artifact_id": "9ad0da68-3933-4f7b-a3cb-a494b70ec0a2",
    "artifact_sha256": "<optional-sha256>",
    "artifact_byte_size": 123456,
    "filename": "example-package.zip",
    "content_type": "application/zip"
  }'
```

Example response:

```json
{
  "ok": true,
  "mode": "queued",
  "job_id": "4a56e7b2-8f18-4f0f-a6b4-cf40f343d8b8",
  "source_artifact_id": "9ad0da68-3933-4f7b-a3cb-a494b70ec0a2"
}
```

Possible `mode` values:

- `queued`: the job was enqueued
- `in_progress`: the same job is already running
- `completed`: the same job already finished earlier

## 4. Poll Job Status

Recommended polling request:

```bash
curl -i --location --request GET "${BASE_URL}/tidas_package_jobs/<job-id>" \
  --header "Authorization: Bearer ${USER_API_KEY}"
```

The API also supports `GET /tidas_package_jobs?job_id=<job-id>` and
`POST /tidas_package_jobs` with `job_id` in the request body.

Key response fields:

- `status`: `queued`, `running`, `completed`, `failed`, and related states
- `artifacts`: the list of job artifacts
- `artifacts_by_kind.import_report`: the import report artifact
- `artifacts_by_kind.import_report.signed_download_url`: a temporary URL for
  downloading the import report JSON

When `status=completed`, clients usually still need to download the
`import_report` artifact and interpret that payload as the final business
result.

## Import Report Semantics

Once the import job completes, the `import_report` payload usually falls into
one of these result classes:

- `IMPORTED`: import succeeded
- `USER_DATA_CONFLICT`: import was rejected because it conflicts with existing
  user-owned datasets
- `VALIDATION_FAILED`: import was blocked by package validation failures

That means:

- `tidas_package_jobs.status=completed` does not automatically mean data was
  imported
- The final business outcome should be determined from `import_report.ok` and
  `import_report.code`

Success example:

```json
{
  "ok": true,
  "code": "IMPORTED",
  "message": "TIDAS package imported successfully",
  "summary": {
    "total_entries": 42,
    "filtered_open_data_count": 3,
    "user_conflict_count": 0,
    "importable_count": 39,
    "imported_count": 39,
    "validation_issue_count": 0,
    "error_count": 0,
    "warning_count": 0
  },
  "filtered_open_data": [],
  "user_conflicts": [],
  "validation_issues": []
}
```

## Validation Failure Example

Validation runs asynchronously in the worker after `enqueue`. If validation
fails, the `import_report` contains a machine-readable issue list.

```json
{
  "ok": false,
  "code": "VALIDATION_FAILED",
  "message": "TIDAS package validation failed",
  "summary": {
    "total_entries": 7,
    "filtered_open_data_count": 0,
    "user_conflict_count": 0,
    "importable_count": 0,
    "imported_count": 0,
    "validation_issue_count": 2,
    "error_count": 1,
    "warning_count": 1
  },
  "filtered_open_data": [],
  "user_conflicts": [],
  "validation_issues": [
    {
      "issue_code": "schema_error",
      "severity": "error",
      "category": "sources",
      "file_path": "sources/a.json",
      "location": "<root>",
      "message": "Schema Error at <root>: missing required field",
      "context": {
        "validator": "required"
      }
    },
    {
      "issue_code": "localized_text_language_error",
      "severity": "warning",
      "category": "processes",
      "file_path": "processes/b.json",
      "location": "processDataSet/name/baseName/0",
      "message": "Localized text error at processDataSet/name/baseName/0: invalid lang",
      "context": {}
    }
  ]
}
```

Client recommendations:

- Localize by `issue_code` when possible
- Also display raw `message`, `file_path`, and `location` for debugging
- Use `summary.error_count`, `summary.warning_count`, and
  `summary.validation_issue_count` for top-level summaries

### Process Dataset Field Compatibility

The import worker validates `processes/*.json` against the current TIDAS schema.
When preparing process datasets, pay special attention to these fields:

- `processDataSet.modellingAndValidation.dataSourcesTreatmentAndRepresentativeness.annualSupplyOrProductionVolume`
  is now required and uses a field-specific multilingual text shape. Each
  `#text` value should start with a parseable number and keep a unit or context
  suffix, such as `"123.45 kg/year"` or `"1.2E3 kg/year"`.
- Do not send `annualSupplyOrProductionVolume` as an old plain numeric string,
  and do not omit the unit or context suffix.
- `processDataSet.exchanges.exchange[].location` should use a TIDAS / ILCD
  location category code when possible, such as `CN`, `CN-BJ`, `RER`, or `GLO`.
  Non-empty legacy strings are still accepted for external data compatibility.
- `exchange.location` is not multilingual text; do not send a `StringMultiLang`
  object or array. For product input exchanges, this field also acts as the
  explicit supply-region anchor used by downstream provider linking.

Packages with field shapes or values that do not match the current schema fail
with `schema_error`; the import report points to the process file and field
through `file_path`, `location`, and `message`.

### CAS Number Validation

The current TIDAS schema marks CAS numbers with the `cas-number` format. The import worker checks
the `64-17-5` style shape and then validates the final CAS check digit.

- TIDAS JSON CAS numbers with a bad check digit are returned as format issues.
- `CASNumber` values in eILCD/ILCD flow XML receive the same supplemental check-digit validation.
- If the report contains `issue_code: "cas_number_checksum_error"`, the value looks like a CAS
  number but its check digit does not match; fix the source CAS number before retrying.

## Implementation Notes

- Package validation is not completed synchronously in the browser; it runs in
  the async worker
- `prepare_upload` alone is not enough; upload, enqueue, and polling are all
  required
- API key auth and browser JWT share the same endpoint contract, but external
  integrations should prefer API keys
- Keep the Edge Function base URL aligned with the deployed environment that
  serves your product UI
