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

## Can I interoperate with other software?

- **JSON export**: Download datasets as TIDAS JSON, then map fields for import into other tools.  
- **MCP integration**: Use the [TianGong MCP services](/en/MCP/lca_remote) to call datasets from external applications.  
- **Caveats**: Unit names and property definitions may differ between systems; plan for a mapping or conversion step.

For bespoke integration or enterprise requirements, contact the TianGong team for partnership options.

## How does TianGong LCA handle regional supply mixes without an explicit market process?

When a product input exchange does not point to one specific provider, TianGong LCA first determines
the supply region from the exchange Location. If the exchange has no Location, it uses the consumer
process location as the default supply region.

Within the selected supply region, if multiple provider processes can supply the same reference
flow, the system uses their annual supply or production volumes as relative weights for splitting
that input demand. This annual volume represents provider share. It does not change the consumer
process's total input demand.

When TianGong LCA builds a computable snapshot, coverage diagnostics record the provider matching
strategy, geography tier, supply-region source, annual-volume weight availability, and no-provider
gaps. If a regional supply mix looks unexpected, first check the exchange Location, consumer process
location, and provider annual supply or production volume.
