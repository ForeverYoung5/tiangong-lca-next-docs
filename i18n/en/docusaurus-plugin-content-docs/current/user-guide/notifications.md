# Notification Centre and Data Notifications

The notification centre collects collaboration, review, and platform issue messages. Data authors
should pay special attention to **Data Notifications** because review assignment, approval, and
rejection feedback appear there.

## Open the notification centre

After signing in, select the **Notifications** icon in the top-right global toolbar. The current
notification centre has three tabs:

- **Team Notifications**: collaboration messages such as team invitations
- **Data Notifications**: data-review related messages
- **Issue Notifications**: platform issue or system messages

You can filter messages by the last 3 days, 7 days, 30 days, or all time. Opening a tab updates
the viewed timestamp for that notification type.

## Data notification list

Data notifications are shown in a table. Common columns include:

| Column | Meaning |
| --- | --- |
| Name | The dataset or model related to the notification |
| Team | The related team workspace |
| Status | Current review status |
| Modified At | The timestamp associated with the notification record |
| Actions | Open details or handle rejection feedback |

Typical status tags include:

- **Assigned**: the review task has been assigned
- **Approved**: the review was approved
- **Rejected**: the review was rejected and feedback should be checked
- **No information**: the notification has no recognized status

## View or fix data

Records that are not rejected provide a **View** action. Selecting it opens the related data in a
new browser tab:

- Process data opens `My Data / Processes` in view mode
- Model data opens `My Data / Models` in view mode

If the status is **Rejected**, **View** first opens a review comment modal. The modal shows the
review comment; if no comment is available, the platform says so. Select **Fix Data** when you are
ready to revise the record.

## Use with data review

After submitting data for review, monitor:

1. The status filters in [Data Review](/en/user-guide/data-review)
2. The **Data Notifications** tab in the notification centre
3. The rejection reason in the review comment modal

If a data notification is rejected but does not include a clear comment, return to the review
workspace or contact the review admin to confirm which fields need revision.
