---
sidebar_position: 5
---

# Data Search

The TianGong LCA Platform provides powerful full-text search capabilities, supporting cross-field searches across all data modules. This feature gives TianGong LCA Platform significant advantages in data retrieval compared to other LCA platforms.

## Search Features

- **Full-text search**: Searches names, categories, flow properties, input/output flow names, and system-extracted text fields
- **Smart matching**: Supports fuzzy search, exact matching, and AI-powered recommendations; hybrid search keeps Chinese and English keywords or aliases in recall and falls back to text recall when semantic matches are insufficient
- **Scope and filters**: Results follow the current data source scope, such as TianGong public data, commercial data, my data, or team data, plus the active filters
- **ID reference lookup**: When the query is a complete UUID, relevant data lists show **Find data containing this ID** so you can locate records whose JSON references that ID
- **Real-time results**: Instant search results with multi-dimensional filtering and flexible sorting

## Search Examples

### Scenario 1: Process Data Search

1. Navigate to "Open Data" module
2. Select "Process" category
3. Enter "coal" in search box
4. System returns all matching results containing "coal" across fields including name, category, input/output flow names, etc.

Search results for "coal":

![Process data search](./img/search.png)

> The "crude steel production; Hotrolling; Production mix, in the factory" process dataset appears because it uses "coal" as an input flow.

![Search term in inputs/outputs](./img/input-with-coal.png)

## Important Notes

- Search results are subject to user permissions; "my data" and "team data" searches only return records the signed-in user can access
- Commercial data module only displays metadata search results
- Chinese terms, English terms, common abbreviations, and CAS numbers can use standardized aliases to improve recall stability
- After entering a complete UUID, click **Find data containing this ID** to search within the current data source, team scope, and status filters. Results show data type, name, version, and ID; if no reference exists, the platform reports that no data contains this ID
- Using standard classification systems improves search efficiency
