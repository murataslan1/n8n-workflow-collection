Automate Time Tracking Enforcement & Cleanup for Awork Tasks

https://n8nworkflows.xyz/workflows/automate-time-tracking-enforcement---cleanup-for-awork-tasks-4805


# Automate Time Tracking Enforcement & Cleanup for Awork Tasks

### 1. Workflow Overview

This workflow automates the enforcement and cleanup of time tracking on tasks managed within the awork platform. It is designed to ensure that tasks marked as completed have appropriate time tracked, to enforce minimum tracked time thresholds, and to clean up tracked time entries to conform to billing intervals. Additionally, it manages the addition of start times to time entries when missing. The workflow operates by reacting to webhook events from awork related to task status changes and time tracking additions.

The workflow’s logic can be organized into the following main blocks:

- **1.1 Input Reception and Initial Extraction**  
  Reception of webhook POST calls from awork, extracting event data and task changes.

- **1.2 Task Status Change Handling**  
  Processing task status changes, checking if tasks are marked done, and enforcing time tracking rules including possible rollback of status and comment addition.

- **1.3 Time Tracking Addition Handling**  
  Processing new time tracking entries, checking if entries are system-generated or user-generated, and enforcing start times or minimum time tracking.

- **1.4 Time Tracking Enforcement and Cleanup**  
  Calculating missing tracked time to enforce minimum billing intervals or cleanup intervals and adding system-generated time entries if necessary.

- **1.5 Configuration and Utility**  
  Central configuration node and utility code nodes that handle tag checks and time calculations.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Initial Extraction

**Overview:**  
This block receives webhook calls from awork, extracts relevant event data including changes and event types, and prepares data for routing.

**Nodes Involved:**  
- Webhook call by Awork  
- Workflow config  
- Fetch task changes  
- Split out task changes

**Node Details:**

- **Webhook call by Awork**  
  - Type: Webhook  
  - Role: Entry point for POST events from awork webhook (configured path and method).  
  - Config: Receives JSON payload including task changes and event type.  
  - Connections: Outputs to “Workflow config”.  
  - Edge Cases: Webhook authentication errors, malformed payloads.

- **Workflow config**  
  - Type: Set  
  - Role: Defines workflow-wide configuration variables such as finished state labels, force time tracking flags, tag filters, comment texts, minimum time settings, cleanup intervals, system user IDs, and timezone.  
  - Config: Static assignment of multiple parameters for controlling workflow behavior.  
  - Connections: Outputs to “Fetch task changes”.  
  - Edge Cases: Misconfiguration could lead to incorrect enforcement or errors in logic.

- **Fetch task changes**  
  - Type: Set  
  - Role: Extracts the "changes" array and eventType string from the webhook payload for further processing.  
  - Config: Uses expressions to fetch changes and eventType from the webhook JSON body.  
  - Connections: Outputs to “Split out task changes”.  
  - Edge Cases: Missing or empty changes array.

- **Split out task changes**  
  - Type: SplitOut  
  - Role: Splits the changes array into individual items for separate processing in downstream nodes.  
  - Config: Splits on the "changes" field.  
  - Connections: Outputs to “Filter task status change”.  
  - Edge Cases: Empty changes array results in no downstream processing.

---

#### 2.2 Task Status Change Handling

**Overview:**  
Handles task status change events, filters for status changes, checks if tasks are marked as done, and enforces rules such as forced time tracking and rollback of task status if time tracking is missing or insufficient.

**Nodes Involved:**  
- Filter task status change  
- Switch  
- Check if task done  
- Check if force time tracking enabled  
- Check tag restriction  
- Process tags and check if found in configured tags  
- Check if tags listed in config node  
- Roll back task status from done to previous state  
- Check if comments are enabled  
- Add comment to tasks  

**Node Details:**

- **Filter task status change**  
  - Type: Filter  
  - Role: Filters changes where the property changed is “TaskStatusId”.  
  - Config: Condition equals “TaskStatusId”.  
  - Connections: Outputs to “Switch”.  
  - Edge Cases: Changes without status property are ignored.

- **Switch**  
  - Type: Switch  
  - Role: Routes workflow based on eventType: “task_status_changed” or “timetracking_added”.  
  - Config: Two outputs, one for each event type.  
  - Connections: “task_status_changed” to “Check if task done”, “timetracking_added” to time tracking flow.  
  - Edge Cases: Unexpected event types exit workflow.

- **Check if task done**  
  - Type: If  
  - Role: Checks if the task status name matches any configured finished state labels and if the status type is “done”.  
  - Config: Uses array contains and equals conditions on task status name and type.  
  - Connections: If true, proceeds to “Check if force time tracking enabled”. Otherwise, exits.  
  - Edge Cases: Misconfiguration of finishedStateLabels may cause false negatives.

- **Check if force time tracking enabled**  
  - Type: If  
  - Role: Checks if forceTimeTracking is enabled and if totalTrackedDuration is zero for the task.  
  - Config: Boolean check and numeric equals zero check.  
  - Connections: True branch to “Check tag restriction”, false branch exits workflow.  
  - Edge Cases: Tasks with zero time but forceTimeTracking disabled skip enforcement.

- **Check tag restriction**  
  - Type: If  
  - Role: Checks if force time tracking is limited to specific tags (limitForceTimeTrackingToTags array non-empty).  
  - Config: Array not empty condition.  
  - Connections: True branch to “Process tags and check if found in configured tags”, false branch to rollback.  
  - Edge Cases: Empty tag list disables tag filtering.

- **Process tags and check if found in configured tags**  
  - Type: Code  
  - Role: Iterates over task tags to check if any tag matches limitForceTimeTrackingToTags. Returns boolean tagFound.  
  - Config: JavaScript code node accessing workflow config and webhook data.  
  - Connections: Outputs tagFound to “Check if tags listed in config node”.  
  - Edge Cases: Tasks without tags return false.

- **Check if tags listed in config node**  
  - Type: If  
  - Role: Checks if tagFound is true.  
  - Config: Boolean is true condition.  
  - Connections: True branch to rollback status, false branch continues workflow (exits).  
  - Edge Cases: Incorrect tagFound flag causes wrong routing.

- **Roll back task status from done to previous state**  
  - Type: HTTP Request  
  - Role: Calls awork API to revert task status to previous state stored in filtered change old value.  
  - Config: POST to /tasks/changestatuses, with taskId and statusId JSON body.  
  - Connections: Outputs to “Check if comments are enabled”.  
  - Edge Cases: API failures, invalid previous status ID.

- **Check if comments are enabled**  
  - Type: If  
  - Role: Checks if addComments config flag is true.  
  - Config: Boolean true check.  
  - Connections: True branch to “Add comment to tasks”, false branch exits workflow.  
  - Edge Cases: Disabled comments skip notification.

- **Add comment to tasks**  
  - Type: HTTP Request  
  - Role: Adds a comment to the task notifying the user that time was not tracked and status was rolled back.  
  - Config: POST to /tasks/{id}/comments with commentTimeNotTracked text.  
  - Connections: Terminal node (workflow exit after).  
  - Edge Cases: API failures, rate limits.

---

#### 2.3 Time Tracking Addition Handling

**Overview:**  
Handles events related to new time tracking entries, avoiding loops by filtering system-generated entries, and then checking whether to add start times or enforce minimum tracked time and cleanup intervals.

**Nodes Involved:**  
- If1  
- Load system type of work  
- Load task details for time tracking item  
- If2  
- Add start time to time tracking entry  
- Check if min time tracking OR time tracking cleanup is enabled  

**Node Details:**

- **If1**  
  - Type: If  
  - Role: Checks if the added time tracking entry is not system-generated by comparing typeOfWork name and note field against configured systemWorkType and forceStartTimeText.  
  - Config: String not equals and string not contains conditions.  
  - Connections: True branch to “Load system type of work”, false branch exits workflow.  
  - Edge Cases: Mislabeling system entries causes infinite loop.

- **Load system type of work**  
  - Type: HTTP Request  
  - Role: Retrieves the system type of work entity from awork by name for use when adding system-generated time entries.  
  - Config: GET request with filter by name equal to systemWorkType config.  
  - Connections: Outputs to “Load task details for time tracking item”.  
  - Edge Cases: API failure, missing system work type.

- **Load task details for time tracking item**  
  - Type: HTTP Request  
  - Role: Loads task details for the task related to the time tracking entry to access tags and other properties.  
  - Config: GET request to /tasks/{taskId} using task ID from webhook payload.  
  - Connections: Outputs to “If2”.  
  - Edge Cases: API failure, invalid task ID.

- **If2**  
  - Type: If  
  - Role: Checks if forceStartTime config flag is true.  
  - Config: Boolean true check.  
  - Connections: True branch to “Add start time to time tracking entry”, false branch to “Check if min time tracking OR time tracking cleanup is enabled”.  
  - Edge Cases: Disabled flag skips start time enforcement.

- **Add start time to time tracking entry**  
  - Type: HTTP Request  
  - Role: Updates the time tracking entry to add a calculated start date/time based on duration and appends a note indicating system-generated start time.  
  - Config: PUT request to /timeentries/{id} with updated startDateUtc, startTimeUtc, note, and other fields.  
  - Connections: Outputs to “Check if min time tracking OR time tracking cleanup is enabled”.  
  - Edge Cases: API failure, concurrency conflicts.

- **Check if min time tracking OR time tracking cleanup is enabled**  
  - Type: If  
  - Role: Checks if either minimum time tracking (setMinTimeTracking > 0) or cleanupTimeTracking is enabled.  
  - Config: OR condition on numeric and boolean config values.  
  - Connections: True branch to “Check tag restriction1”, false branch exits workflow.  
  - Edge Cases: Misconfiguration disables enforcement.

---

#### 2.4 Time Tracking Enforcement and Cleanup

**Overview:**  
Calculates missing time required to meet minimum tracking or cleanup intervals, checks task tags for billing, and adds system-generated time entries to meet requirements.

**Nodes Involved:**  
- Check tag restriction1  
- Process tags and check if found in configured tags1  
- If  
- Check tracked time  
- Calculate time for added time tracking  
- Calculate time for added time tracking1  
- Add tracked time to match min time settings  
- Roll back task status from done to previous state4  

**Node Details:**

- **Check tag restriction1**  
  - Type: If  
  - Role: Checks if minTimeTrackingTags array is non-empty to enforce tag-based filtering on minimum time enforcement.  
  - Config: Array not empty condition.  
  - Connections: True branch to “Process tags and check if found in configured tags1”, false branch to “Check tracked time”.  
  - Edge Cases: Empty array skips tag filtering.

- **Process tags and check if found in configured tags1**  
  - Type: Code  
  - Role: Checks if the task tags include any tag from the minTimeTrackingTags list.  
  - Config: JavaScript iterating through task tags and config array.  
  - Connections: Outputs tagFound to “If”.  
  - Edge Cases: No tags on task returns false.

- **If**  
  - Type: If  
  - Role: Checks tagFound boolean; if false, workflow exits; if true, continues enforcement.  
  - Config: Boolean equals true.  
  - Connections: True branch continues, false branch exits workflow.  
  - Edge Cases: Incorrect flag causes premature exit.

- **Check tracked time**  
  - Type: If  
  - Role: Checks if tracked time from the webhook changes (Duration property new value) is less than the configured minimum time (setMinTimeTracking) converted to seconds.  
  - Config: Numeric less than operation.  
  - Connections: True branch to “Calculate time for added time tracking”, false branch to “Calculate time for added time tracking1”.  
  - Edge Cases: Missing Duration property or zero time.

- **Calculate time for added time tracking**  
  - Type: Code  
  - Role: Calculates missing time to meet minimum time tracking; checks task tags against billingTag array to set billable flag.  
  - Config: JavaScript reading tracked time and configuration, returning addTimeTracking flag, missingTrackedTime, and isBillable.  
  - Connections: Outputs to “Add tracked time to match min time settings”.  
  - Edge Cases: Tags missing, misconfigured billing tags.

- **Calculate time for added time tracking1**  
  - Type: Code  
  - Role: Calculates missing time to align tracked time to cleanupTimeTrackingInterval with tolerance, and checks billing tags similarly.  
  - Config: JavaScript calculating modulo and tolerance, returning addTimeTracking flag, missingTrackedTime, and isBillable.  
  - Connections: Outputs to “Roll back task status from done to previous state4”.  
  - Edge Cases: Incorrect interval or tolerance values.

- **Add tracked time to match min time settings**  
  - Type: HTTP Request  
  - Role: Adds a new time entry to the task with missingTrackedTime duration, billing flag, system work type, user ID, and timezone.  
  - Config: POST to /timeentries with JSON body containing calculated values and systemWorkText note.  
  - Connections: Terminal node (workflow exit).  
  - Edge Cases: API failure, overlapping time entries.

- **Roll back task status from done to previous state4**  
  - Type: HTTP Request  
  - Role: Adds a new time entry similarly for cleanup enforcement, or effectively rolls back the time tracking duration to meet intervals.  
  - Config: POST to /timeentries with calculated missingTrackedTime and systemWorkType.  
  - Connections: Terminal node.  
  - Edge Cases: API failure.

---

#### 2.5 Configuration and Utility

**Overview:**  
Contains nodes for configuration settings, tag processing utilities, and sticky notes for documentation.

**Nodes Involved:**  
- Workflow config  
- Process tags and check if found in configured tags  
- Process tags and check if found in configured tags1  
- Sticky Notes (multiple)

**Node Details:**

- **Workflow config**  
  - As described in 2.1, holds all configurable parameters for the workflow.

- **Process tags and check if found in configured tags**  
  - Type: Code  
  - Role: Checks if task tags intersect with limitForceTimeTrackingToTags.  
  - Edge Cases: No tags or empty tag list.

- **Process tags and check if found in configured tags1**  
  - Similar to above but for minTimeTrackingTags.

- **Sticky Notes**  
  - Multiple nodes distributed across the canvas provide detailed explanations, usage instructions, and contextual help.  
  - Includes a large explanatory note about workflow purpose, usage, and configuration.  
  - Does not affect execution.

---

### 3. Summary Table

| Node Name                                    | Node Type       | Functional Role                                 | Input Node(s)                        | Output Node(s)                               | Sticky Note                                                                                              |
|----------------------------------------------|-----------------|------------------------------------------------|------------------------------------|----------------------------------------------|---------------------------------------------------------------------------------------------------------|
| Webhook call by Awork                         | Webhook         | Entry point for webhook events from awork      | -                                  | Workflow config                              |                                                                                                         |
| Workflow config                              | Set             | Defines workflow-wide config variables          | Webhook call by Awork              | Fetch task changes                           | ### Workflow config * Configure basic settings                                                          |
| Fetch task changes                           | Set             | Extracts changes array and eventType             | Workflow config                   | Split out task changes                       | ### Extract status changes from webhook call payload                                                    |
| Split out task changes                       | SplitOut        | Splits changes array into individual items       | Fetch task changes                | Filter task status change                    |                                                                                                         |
| Filter task status change                    | Filter          | Filters changes for task status changes           | Split out task changes            | Switch                                       |                                                                                                         |
| Switch                                      | Switch          | Routes flow based on eventType                     | Filter task status change         | Check if task done, If1                       |                                                                                                         |
| Check if task done                          | If              | Checks if task status is done                       | Switch                          | Check if force time tracking enabled          | ### Check if task status is currently "done" * If yes, proceed * If no, exit workflow                    |
| Check if force time tracking enabled        | If              | Checks forceTimeTracking enabled and zero time    | Check if task done               | Check tag restriction (true), else exit      | ### Check if force time tracking is enabled and no time is tracked * If yes, roll back task status ...   |
| Check tag restriction                       | If              | Checks if time tracking enforcement is tag-limited | Check if force time tracking enabled | Process tags and check if found in configured tags, else rollback | ### Check if force time tracking is limited to specific tags * If yes, check task tags * If no, rollback task status |
| Process tags and check if found in configured tags | Code            | Checks if task tags include configured tags        | Check tag restriction            | Check if tags listed in config node          | ### Process task tags * If a task tag is listed in "Limit forced time tracking to tags", return true ... |
| Check if tags listed in config node          | If              | Checks tagFound boolean                            | Process tags and check if found in configured tags | Roll back task status from done to previous state (true), else exit |                                                                                                         |
| Roll back task status from done to previous state | HTTP Request    | Reverts task status to previous state              | Check if tags listed in config node | Check if comments are enabled                 | ### Roll back task status                                                                              |
| Check if comments are enabled                | If              | Checks if comments should be added                  | Roll back task status            | Add comment to tasks (true), else exit       | ### Check if comment should be added to task * Exit workflow if no comment should be added              |
| Add comment to tasks                         | HTTP Request    | Adds comment on task regarding rollback             | Check if comments are enabled    | -                                            | ### Add comment to task regarding roll back of task state * Add comment and exit workflow               |
| If1                                          | If              | Checks if time tracking entry is system-generated   | Switch                         | Load system type of work (true), else exit   | ### Check if added time tracking is not system generated to prevent endless loops                       |
| Load system type of work                     | HTTP Request    | Loads system work type from awork                    | If1                            | Load task details for time tracking item     | ### Load system type of work and related task data                                                     |
| Load task details for time tracking item    | HTTP Request    | Loads task details for tag and other info            | Load system type of work         | If2                                          |                                                                                                         |
| If2                                          | If              | Checks if forced start time is enabled               | Load task details for time tracking item | Add start time to time tracking entry (true), Check if min time tracking OR cleanup enabled (false) | ### Check if forced start time is enabled * If yes, update start time in tracked time * If no, continue |
| Add start time to time tracking entry       | HTTP Request    | Updates time entry with calculated start time         | If2                            | Check if min time tracking OR time tracking cleanup is enabled | ### Add start time to time tracking * Calculates start time based on duration in the past until now...   |
| Check if min time tracking OR time tracking cleanup is enabled | If              | Checks if min time tracking or cleanup is enabled     | Add start time to time tracking entry, If2 | Check tag restriction1 (true), else exit      | ### Check if min time tracking OR time tracking cleanup is enabled * If yes, check time tracked * If no, exit workflow |
| Check tag restriction1                      | If              | Checks if minTimeTrackingTags array is non-empty      | Check if min time tracking OR cleanup enabled | Process tags and check if found in configured tags1 (true), else Check tracked time |                                                                                                         |
| Process tags and check if found in configured tags1 | Code            | Checks if task tags include minTimeTrackingTags list  | Check tag restriction1          | If                                            | ### Process task tags * If a task tag is listed in "Limit min time tracking to tags", return true ...    |
| If                                           | If              | Checks tagFound boolean for minTimeTrackingTags        | Process tags and check if found in configured tags1 | Continue (true), exit (false)                   |                                                                                                         |
| Check tracked time                          | If              | Compares tracked time against minTimeTracking threshold | If, Check tag restriction1       | Calculate time for added time tracking (true), Calculate time for added time tracking1 (false) |                                                                                                         |
| Calculate time for added time tracking     | Code            | Calculates missing tracked time to meet minTimeTracking | Check tracked time              | Add tracked time to match min time settings   | ### Calculate missing tracked time and add system generated time tracking to task                       |
| Add tracked time to match min time settings | HTTP Request    | Adds system-generated time entry to meet min time      | Calculate time for added time tracking | -                                            |                                                                                                         |
| Calculate time for added time tracking1    | Code            | Calculates missing time to align with cleanup interval  | Check tracked time              | Roll back task status from done to previous state4 | ### Update tracked time to match time tracking intervals                                               |
| Roll back task status from done to previous state4 | HTTP Request    | Adds system-generated time entry for cleanup enforcement | Calculate time for added time tracking1 | -                                            |                                                                                                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node ("Webhook call by Awork")**  
   - Type: Webhook  
   - Set HTTP Method to POST  
   - Set Path to a unique identifier (e.g., "d6af5915-8ba8-46ec-a840-6fe9d0a66cc6")  
   - No authentication or configure as needed for webhook security.

2. **Create Set Node ("Workflow config")**  
   - Assign key configuration parameters:  
     - finishedStateLabels: ["Fertig","Total fertig"]  
     - forceTimeTracking: true  
     - limitForceTimeTrackingToTags: ["Orga"]  
     - addComments: true  
     - commentTimeNotTracked: "Time not tracked! Status rolled back!"  
     - setMinTimeTracking: 15  
     - minTimeTrackingTags: ["Abrechnen"]  
     - cleanupTimeTracking: true  
     - cleanupTimeTrackingInterval: 15  
     - cleanupTimeTrackingTolerance: 1  
     - billingTag: ["Abrechnen"]  
     - forceStartTime: true  
     - forceStartTimeText: "System generated start time"  
     - systemWorkType: "System time tracking"  
     - systemWorkText: "System generated time tracking"  
     - timeZone: "Europe/Berlin"  
     - systemTimeUserId: "" (set your UUID)  
   - Connect "Webhook call by Awork" output to this node.

3. **Create Set Node ("Fetch task changes")**  
   - Extract `changes` array and `eventType` string from webhook payload using expressions:  
     - changes: `={{ $('Webhook call by Awork').item.json.body.changes }}`  
     - eventType: `={{ $('Webhook call by Awork').item.json.body.eventType }}`  
   - Connect from "Workflow config".

4. **Create SplitOut Node ("Split out task changes")**  
   - Split on field "changes".  
   - Connect from "Fetch task changes".

5. **Create Filter Node ("Filter task status change")**  
   - Filter items where property equals "TaskStatusId".  
   - Connect from "Split out task changes".

6. **Create Switch Node ("Switch")**  
   - Create two outputs:  
     - "Task status changed workflow": eventType equals "task_status_changed"  
     - "Time tracking added workflow": eventType equals "timetracking_added"  
   - Connect from "Filter task status change".

7. **Task Status Changed Branch:**  
   - Create If Node ("Check if task done")  
     - Check if taskStatus.name is in finishedStateLabels AND taskStatus.type equals "done".  
     - Connect from "Switch" output "Task status changed workflow".

   - Create If Node ("Check if force time tracking enabled")  
     - Check forceTimeTracking is true AND totalTrackedDuration equals 0.  
     - Connect from "Check if task done".

   - Create If Node ("Check tag restriction")  
     - Check limitForceTimeTrackingToTags array is not empty.  
     - Connect from "Check if force time tracking enabled" true output.

   - Create Code Node ("Process tags and check if found in configured tags")  
     - Iterate over task tags, check if any tag is in limitForceTimeTrackingToTags array, output boolean tagFound.  
     - Connect from "Check tag restriction" true output.

   - Create If Node ("Check if tags listed in config node")  
     - Check if tagFound is true.  
     - Connect from "Process tags and check if found in configured tags".

   - Create HTTP Request Node ("Roll back task status from done to previous state")  
     - POST to https://api.awork.com/api/v1/tasks/changestatuses  
     - JSON body with taskId and previous statusId from old value.  
     - Connect from "Check if tags listed in config node" true output.

   - Create If Node ("Check if comments are enabled")  
     - Check addComments flag.  
     - Connect from rollback node.

   - Create HTTP Request Node ("Add comment to tasks")  
     - POST to https://api.awork.com/api/v1/tasks/{taskId}/comments  
     - JSON body with message from commentTimeNotTracked.  
     - Connect from "Check if comments are enabled" true output.

8. **Time Tracking Added Branch:**  
   - Create If Node ("If1")  
     - Check if typeOfWork.name not equals systemWorkType AND note does not contain forceStartTimeText.  
     - Connect from "Switch" output "Time tracking added workflow".

   - Create HTTP Request Node ("Load system type of work")  
     - GET https://api.awork.com/api/v1/typeofwork?filterby=name eq '{systemWorkType}'  
     - Connect from "If1" true output.

   - Create HTTP Request Node ("Load task details for time tracking item")  
     - GET https://api.awork.com/api/v1/tasks/{taskId}  
     - Connect from "Load system type of work".

   - Create If Node ("If2")  
     - Check forceStartTime flag.  
     - Connect from "Load task details for time tracking item".

   - Create HTTP Request Node ("Add start time to time tracking entry")  
     - PUT https://api.awork.com/api/v1/timeentries/{timeEntryId}  
     - Update note appending forceStartTimeText, startDateUtc, startTimeUtc calculated based on duration, timezone, typeOfWorkId, userId.  
     - Connect from "If2" true output.

   - Create If Node ("Check if min time tracking OR time tracking cleanup is enabled")  
     - Check setMinTimeTracking > 0 OR cleanupTimeTracking enabled.  
     - Connect from "Add start time to time tracking entry" and "If2" false output.

   - Create If Node ("Check tag restriction1")  
     - Check minTimeTrackingTags array is not empty.  
     - Connect from previous node true output.

   - Create Code Node ("Process tags and check if found in configured tags1")  
     - Check if task tags include any minTimeTrackingTags.  
     - Connect from "Check tag restriction1" true output.

   - Create If Node ("If")  
     - Check tagFound boolean.  
     - Connect from "Process tags and check if found in configured tags1".

   - Create If Node ("Check tracked time")  
     - Check if tracked time (Duration new value) is less than setMinTimeTracking in seconds.  
     - Connect from "If" true output or from "Check tag restriction1" false output.

   - Create Code Node ("Calculate time for added time tracking")  
     - Calculate missing time to meet minimum time and check billing tags.  
     - Connect from "Check tracked time" true output.

   - Create HTTP Request Node ("Add tracked time to match min time settings")  
     - POST new time entry with missingTrackedTime, isBillable, systemWorkType, systemWorkText, timezone, systemTimeUserId.  
     - Connect from "Calculate time for added time tracking".

   - Create Code Node ("Calculate time for added time tracking1")  
     - Calculate missing time for cleanup intervals with tolerance and billing tags.  
     - Connect from "Check tracked time" false output.

   - Create HTTP Request Node ("Roll back task status from done to previous state4")  
     - POST new time entry as in previous, using cleanup calculation.  
     - Connect from "Calculate time for added time tracking1".

9. **Set up Credentials**  
   - Create HTTP Header Auth credential for Awork API with Authorization header as Bearer token.  
   - Assign to all HTTP Request nodes calling awork endpoints.

10. **Add Sticky Notes**  
    - Add explanatory sticky notes at appropriate locations to document logic and configuration for maintainability.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Context or Link                                                                                             |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| Enhanced time tracking features for awork including forced time tracking, minimum billing intervals enforcement, time tracking cleanup, and start time addition. Does not rely on awork community package due to API call limitations. Configuration explained in detail within the workflow config node.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Main workflow purpose and usage instructions                                                                |
| Refer to awork webhook setup documentation for creating webhooks triggering on task status changes and time tracking additions: [https://support.awork.com/en/articles/5415462-webhooks](https://support.awork.com/en/articles/5415462-webhooks)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Awork webhook documentation                                                                                 |
| API client and key generation for awork described here: [https://support.awork.com/en/articles/5415664-client-applications-and-api-keys](https://support.awork.com/en/articles/5415664-client-applications-and-api-keys)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Awork API client setup                                                                                       |
| n8n credential creation for HTTP Header Auth explained at: [https://docs.n8n.io/credentials/add-edit-credentials/](https://docs.n8n.io/credentials/add-edit-credentials/)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | n8n credential setup                                                                                        |
| Time zone values must be valid IANA time zones, e.g., "Europe/Berlin". List of valid timezones can be found at: [https://www.php.net/manual/en/timezones.php](https://www.php.net/manual/en/timezones.php)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Time zone configuration                                                                                      |
| System user ID must be a valid UUID of a user in awork, retrievable from user details URL in awork admin interface.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | System user ID configuration                                                                                 |

---

**Disclaimer:**  
The text provided is exclusively from an automated workflow created with n8n, an integration and automation tool. This process strictly complies with content policies and contains no illegal, offensive, or protected elements. All data processed is legal and public.