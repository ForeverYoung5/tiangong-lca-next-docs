---
sidebar_position: 5
---

# LCIA Calculation & Results

This page covers the two common LCIA usage patterns in TianGong LCA:

- Viewing LCIA results directly inside a **process** or **model**
- Moving to the dedicated [Process Analysis Workspace](./process-analysis) when you need
  comparison, grouping, or contribution-path analysis

## What LCIA means here

LCIA converts life cycle inventory results into impact-category results such as climate change,
acidification, or ozone depletion.

The platform currently supports both:

- **Process-level** LCIA results
- **Model-level** LCIA results

Both are useful for direct inspection. For cross-process comparison or path tracing, use the
separate analysis workspace.

## Before you run LCIA

Confirm the following first:

- The process or model has complete input/output modelling
- A reference flow or functional unit has been defined correctly
- You are reusing the platform's standard flow properties, unit groups, and elementary flows where
  possible
- The selected impact method actually contains matching characterisation factors
- Product input exchanges used by model or contribution-path solving have appropriate exchange
  locations. If left blank, the system uses the consumer process location as the default supply
  region
- Provider processes have numeric annual supply or production volume values where available, because
  those values affect how demand is split across multiple providers in the same region

Heavy use of custom units, custom flow properties, or non-standard elementary flows can lead to
missing results or incorrect magnitudes.

## Process-level LCIA

### Process-level entry point

Open a process in **My Data → Processes** and use the LCIA results area in the process editor or
viewer.

![LCIA results panel](./img/lcia-calculation.png)

### Process-level best use cases

- Quickly checking the impact profile of one process
- Spotting abnormal impact categories during authoring
- Performing a single-process sanity check

### Important limitation

Process-level LCIA mainly reflects the elementary-flow impacts associated with that process.

That means:

- It is useful for **one process at a time**
- It is not the same as a full product-system total
- It should not replace multi-process comparison or contribution-path analysis

## Model-level LCIA

### Model-level entry point

Open a model in **My Data → Models** and use the LCIA results area in the model result workspace.

### Model-level best use cases

- Reviewing full product-system impacts
- Comparing alternative model setups
- Checking whether a solved model behaves as expected

### Compared with process-level LCIA

| Scenario | Better entry point |
| --- | --- |
| Inspect one process | Process-level LCIA |
| Inspect the full system | Model-level LCIA |
| Compare multiple processes | [Process Analysis Workspace](./process-analysis) |
| Trace contribution paths | [Process Analysis Workspace](./process-analysis) |

## When to move to Process Analysis

If your task is any of the following, the LCIA result panel is no longer enough:

- **Impact comparison** across multiple processes
- **Grouped** analysis by location, classification, dataset type, or team
- **Contribution path** exploration from a root process
- Switching between **Current user data**, **Open data**, and **All data**

In those cases, go directly to [Process Analysis Workspace](./process-analysis).

## Troubleshooting

### Why are some impact categories missing?

Check:

- Whether flows are linked to the correct standard flow properties
- Whether unit conversions are valid
- Whether the selected impact method contains matching factors

### Why do the result magnitudes look wrong?

Common causes include:

- Incorrect unit conversion
- Custom unit groups or flow properties that do not align with platform defaults
- An incorrect reference flow or functional unit
- Unexpected upstream provider geography matching or annual supply / production volume weighting

If snapshot coverage diagnostics are available, check the provider match rate, supply-region source,
annual-volume fallback, and no-provider gaps. These indicators help separate data-modelling issues
from geography fallback or incomplete provider coverage.

### Why should I use Process Analysis instead?

If you have moved beyond reading one result and now need comparison, grouping, or tracing, continue
with [Process Analysis Workspace](./process-analysis).
