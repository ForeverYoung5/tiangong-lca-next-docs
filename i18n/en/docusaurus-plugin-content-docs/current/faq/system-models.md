---
title: System Modelling
description: Answers about building models in TianGong LCA and how it compares with other LCA tools.
---

## How do I build a model in TianGong LCA?

1. Create or select the required unit processes in **My Data → Processes**, ensuring inputs and outputs are complete.  
2. Open **My Data → Models**, click `+`, and add the processes to the canvas.  
3. Connect inputs and outputs, set the reference process, and define the reference flow quantity.  
4. Save the model—see [Create My Data](/en/user-guide/create-my-data#create-model) for the full workflow.

## How does TianGong LCA differ from other LCA platforms?

| Aspect | TianGong LCA | Traditional desktop tools (SimaPro, GaBi, Umberto, openLCA, etc.) |
| --- | --- | --- |
| Data management | Cloud-native with team collaboration and review workflows | Primarily local projects; collaboration often manual |
| Model construction | Assemble processes from shared repositories; publish to teams | Typically import or maintain private databases |
| Data format | Uses the open TIDAS JSON schema for transparency and integration | Proprietary database formats |
| Version control | Built-in drafts, history, and status tracking | Depends on external file management |

## How are multiple matching provider processes allocated?

When one input flow can link to multiple provider processes, TianGong LCA first chooses a supply
region:

- The input exchange location code is preferred
- If the exchange has no usable location, the consumer process location is used as a fallback

Inside the selected geography tier, candidates are weighted by annual supply or production volume.
If that value is missing, cannot be parsed, or is not positive, the provider receives a default raw
weight of `1.0`. Filling standard location codes and annual volumes therefore makes model results
easier to explain.

## Can I interoperate with other software?

- **JSON export**: Download datasets as TIDAS JSON, then map fields for import into other tools.  
- **MCP integration**: Use the [TianGong MCP services](/en/MCP/lca_remote) to call datasets from external applications.  
- **Caveats**: Unit names and property definitions may differ between systems; plan for a mapping or conversion step.

For bespoke integration or enterprise requirements, contact the TianGong team for partnership options.
