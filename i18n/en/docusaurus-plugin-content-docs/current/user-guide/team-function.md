---
sidebar_position: 7
title: Team Functions
---

Team workspaces centralise shared datasets, enforce permissions, and streamline collaboration. This page explains why teams matter, how to join or create one, and what each role can do.

## Why use teams?

- **Centralised management**: Owners can oversee members, datasets, and review progress in one place.  
- **Permission control**: Assign roles to ensure only authorised people can publish or remove assets.  
- **Efficient collaboration**: Shared “Team Data” keeps everyone aligned on the latest versions.

Open **My Team** in the sidebar to view your workspace. If you are not yet part of a team, you will be prompted to create or join one.

![My Team entry](img/my-team.png)

## Create or join a team

### Create a team

1. Click **Create Team**.  
2. Provide a name and description. **Publicize team information** is off by default; enable it only when others should be able to contact the team owner by email.  
3. Confirm to become the team owner.

![Create team flow](img/create-team.png)

### Join a team

1. Use **Join Team** to search for existing teams and view contact information.  
2. Reach out to the owner or administrator to request an invitation.  
3. Membership is invitation-only; self-enrolment is not supported.

![Join team search](img/join-team.png)

## Invitation workflow

1. **Send invitation**: Owners or admins search for a username and send an invite.  
   ![Send invitation](img/add-member.png) ![Invitation email detail](img/team-member-email.png)
2. **Receive notification**: Invited users see a badge in the notification center; accepting joins them to the team.  
   ![Invitation notification](img/team-invitation.png)
3. **Collaborate**: New members gain access to team datasets and can contribute through “My Data → Contribute to team”.  
   ![Team data view](img/team-member-data.png)

## Permission matrix & common actions {#permission-matrix-and-common-actions}

| Action | Owner | Admin | Member |
| --- | --- | --- | --- |
| Edit team profile | ✅ | | |
| Invite / Resend invitation | ✅ | ✅ | |
| Adjust roles | ✅ | | |
| Remove members | ✅ | ✅ | |
| View team data | ✅ | ✅ | ✅ |
| Contribute personal data to team | ✅ | ✅ | ✅ |

### Practical tips

- Promote trusted collaborators to admins to distribute onboarding tasks.  
- After editing in “My Data”, use **Contribute to team** to share updates with colleagues.  
- Need help finding the right button? Check the controls listed in [Key Functions Overview](/en/user-guide/key-functions-introduction#collaboration-actions).

## FAQ

- **Why do contributed processes sometimes miss flow units?**  
  Ensure the underlying flows (not just the processes) are also contributed or shared; otherwise unit definitions remain private.
- **Why didn’t my teammate receive an invitation?**  
  Ask them to verify the notification center. If nothing appears, confirm the account ID and resend the invite.
- **Why can’t I edit datasets directly in Team Data?**  
  Team Data is intentionally read-only to prevent conflicts. Copy the dataset to “My Data”, edit it there, and contribute the updated version back to the team.

If you want one place to compare team roles, review roles, system roles, and data spaces, continue
with [Permissions & Data Spaces](./permissions-and-data-scopes).
