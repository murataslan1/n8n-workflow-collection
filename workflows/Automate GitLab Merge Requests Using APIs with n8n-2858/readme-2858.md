Automate GitLab Merge Requests Using APIs with n8n

https://n8nworkflows.xyz/workflows/automate-gitlab-merge-requests-using-apis-with-n8n-2858


# Automate GitLab Merge Requests Using APIs with n8n

### 1. Workflow Overview

This workflow automates the management of GitLab merge requests (MRs) using n8n, targeting developers, DevOps engineers, and automation enthusiasts who want to streamline their GitLab branching and merging process. It eliminates manual intervention by programmatically checking for existing merge requests, creating new ones if none exist, adding comments, waiting for approvals and pipeline completion, and finally merging the MR automatically via GitLab’s API.

The workflow is logically divided into the following blocks:

- **1.1 Trigger and Initial MR Check:** Starts the workflow on a schedule and checks if an open merge request already exists for a given source branch.
- **1.2 Merge Request Creation and Commenting:** If no MR exists, creates a new MR and adds custom notes/comments.
- **1.3 MR Closure Loop:** If an MR exists, loops over existing MRs and closes them if necessary.
- **1.4 Wait and Merge Execution:** Waits for a fixed time to allow approvals and pipeline completion, sets merge parameters, and triggers the merge API call.

---

### 2. Block-by-Block Analysis

#### 2.1 Trigger and Initial MR Check

- **Overview:**  
  This block initiates the workflow on a scheduled interval and queries GitLab to check if there are any open merge requests for the specified source branch.

- **Nodes Involved:**  
  - Schedule Trigger  
  - API to Check existing merge request  
  - Is Exists (IF node)

- **Node Details:**

  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Role: Starts the workflow periodically (default interval is every minute unless customized).  
    - Configuration: Uses default scheduling rule with no specific interval override.  
    - Inputs: None (trigger node)  
    - Outputs: Connects to "API to Check existing merge request"  
    - Edge Cases: Misconfiguration of schedule could cause unexpected trigger frequency.

  - **API to Check existing merge request**  
    - Type: HTTP Request  
    - Role: Calls GitLab API endpoint to fetch open merge requests filtered by source branch.  
    - Configuration:  
      - Method: GET  
      - URL: `https://gitlab.com/<projectid>/merge_requests`  
      - Query Parameters: `state=opened`, `source_branch={{sourceBranchName}}` (dynamic)  
      - Headers: `PRIVATE-TOKEN={{gitlabToken}}` (dynamic, secured token)  
      - Options: Does not allow unauthorized SSL certificates.  
    - Inputs: From Schedule Trigger or Loop Over Items  
    - Outputs: Connects to "Is Exists" node  
    - Edge Cases:  
      - API token invalid or expired → authentication errors  
      - Network issues or GitLab downtime → request failures  
      - Empty or malformed sourceBranchName variable → no results or errors

  - **Is Exists (IF node)**  
    - Type: IF  
    - Role: Checks if the API response contains any open merge requests.  
    - Configuration:  
      - Condition: Checks if the data returned by "API to Check existing merge request" is empty (boolean true if empty).  
      - If true (no existing MR), proceeds to create a new MR.  
      - If false (MR exists), proceeds to loop over existing MRs.  
    - Inputs: From "API to Check existing merge request"  
    - Outputs:  
      - True branch → "Create New Merge Request"  
      - False branch → "Loop Over Items"  
    - Edge Cases:  
      - Expression failure if API response structure changes  
      - False negatives if API returns unexpected data format

---

#### 2.2 Merge Request Creation and Commenting

- **Overview:**  
  This block creates a new merge request if none exists and adds custom notes/comments to it.

- **Nodes Involved:**  
  - Create New Merge Request  
  - Add Custom Notes To Merge Request  
  - 30 secs wait to approve merge request and pipeline to finish1

- **Node Details:**

  - **Create New Merge Request**  
    - Type: HTTP Request  
    - Role: Creates a new MR via GitLab API POST call.  
    - Configuration:  
      - Method: POST  
      - URL: `https://gitlab.com/<projectid>/merge_requests`  
      - Body (form-urlencoded): `source_branch={{sourceBranchName}}`, `target_branch={{targetBranchName}}`, `title={{mergeTitle}}`  
      - Headers: `PRIVATE-TOKEN={{gitlabToken}}`  
      - Options: No unauthorized certs allowed  
    - Inputs: From "Is Exists" (true branch)  
    - Outputs: Connects to "Add Custom Notes To Merge Request"  
    - Edge Cases:  
      - Invalid branch names or title → API rejects request  
      - Token issues → auth errors  
      - Rate limiting by GitLab API

  - **Add Custom Notes To Merge Request**  
    - Type: HTTP Request  
    - Role: Adds a comment/note to the newly created MR.  
    - Configuration:  
      - Method: POST  
      - URL: `https://gitlab.com/<projectid>/merge_requests/<merge_iid>/notes` (merge_iid dynamically from MR creation)  
      - Body (form-urlencoded): `body={{mergeComments}}`  
      - Headers: `PRIVATE-TOKEN={{gitlabToken}}`  
    - Inputs: From "Create New Merge Request"  
    - Outputs: Connects to "30 secs wait to approve merge request and pipeline to finish1"  
    - Edge Cases:  
      - Missing or invalid merge_iid → API error  
      - Empty or malformed mergeComments variable

  - **30 secs wait to approve merge request and pipeline to finish1**  
    - Type: Wait  
    - Role: Pauses workflow execution for 30 seconds to allow manual approvals or pipeline completion.  
    - Configuration: Wait time set to 30 seconds  
    - Inputs: From "Add Custom Notes To Merge Request"  
    - Outputs: Connects to "setValueForMerge"  
    - Edge Cases:  
      - Fixed wait time may be insufficient or excessive depending on pipeline duration  
      - Workflow timeout if wait node exceeds n8n limits

---

#### 2.3 MR Closure Loop

- **Overview:**  
  If existing open merge requests are found, this block loops over each MR and closes them by sending a state change request.

- **Nodes Involved:**  
  - Loop Over Items  
  - API to CLOSE existing Merge Request  
  - API to Check existing merge request (looped back)

- **Node Details:**

  - **Loop Over Items**  
    - Type: SplitInBatches  
    - Role: Iterates over each existing MR item to process them individually.  
    - Configuration: Default batch size (1 item per batch)  
    - Inputs: From "Is Exists" (false branch) or "API to CLOSE existing Merge Request" (loop back)  
    - Outputs: Two outputs:  
      - Main output 0: to "API to Check existing merge request" (to re-check after closure)  
      - Main output 1: to "API to CLOSE existing Merge Request"  
    - Edge Cases:  
      - Large number of MRs could cause long processing times  
      - Batch size not configured may affect performance

  - **API to CLOSE existing Merge Request**  
    - Type: HTTP Request  
    - Role: Sends a PUT request to GitLab API to close the MR by setting `state_event=close`.  
    - Configuration:  
      - Method: PUT  
      - URL: `https://gitlab.com/<projectid>/merge_requests/<merge_iid>` (merge_iid dynamic)  
      - Body (form-urlencoded): `state_event=close`  
      - Headers: `PRIVATE-TOKEN={{gitlabToken}}`  
    - Inputs: From "Loop Over Items"  
    - Outputs: Loops back to "Loop Over Items" to continue processing  
    - Edge Cases:  
      - Invalid merge_iid or permissions → API errors  
      - Race conditions if MR state changes during processing

---

#### 2.4 Wait and Merge Execution

- **Overview:**  
  After waiting for approvals and pipeline completion, this block sets merge parameters and triggers the merge API call to finalize the MR.

- **Nodes Involved:**  
  - setValueForMerge  
  - Merge When Pipeline Succeeds

- **Node Details:**

  - **setValueForMerge**  
    - Type: Set  
    - Role: Defines parameters controlling merge behavior such as whether to merge when pipeline succeeds and whether to remove the source branch.  
    - Configuration:  
      - Sets `merge_when_pipeline_succeeds` to false (boolean)  
      - Sets `should_remove_source_branch` to true (boolean)  
    - Inputs: From "30 secs wait to approve merge request and pipeline to finish1"  
    - Outputs: Connects to "Merge When Pipeline Succeeds"  
    - Edge Cases:  
      - Hardcoded values may not fit all use cases; requires manual adjustment

  - **Merge When Pipeline Succeeds**  
    - Type: HTTP Request  
    - Role: Sends a PUT request to GitLab API to merge the MR with specified options.  
    - Configuration:  
      - Method: PUT  
      - URL: `https://gitlab.com/<projectid>/merge_requests/<merge_iid>/merge` (merge_iid dynamic)  
      - Body (JSON):  
        ```json
        {
          "merge_when_pipeline_succeeds": {{ $('setValueForMerge').item.json.merge_when_pipeline_succeeds }},
          "should_remove_source_branch": {{ $('setValueForMerge').item.json.should_remove_source_branch }}
        }
        ```  
      - Headers: `PRIVATE-TOKEN={{gitlabToken}}`  
    - Inputs: From "setValueForMerge"  
    - Outputs: None (end of workflow)  
    - Edge Cases:  
      - Merge conflicts or pipeline failures prevent merge  
      - API errors due to permissions or invalid MR state  
      - Token expiration or network issues

---

### 3. Summary Table

| Node Name                                | Node Type           | Functional Role                          | Input Node(s)                          | Output Node(s)                                     | Sticky Note                                                                                   |
|-----------------------------------------|---------------------|----------------------------------------|--------------------------------------|---------------------------------------------------|-----------------------------------------------------------------------------------------------|
| Schedule Trigger                        | Schedule Trigger    | Starts workflow on schedule             | None                                 | API to Check existing merge request                |                                                                                               |
| API to Check existing merge request    | HTTP Request        | Fetches open MRs for source branch      | Schedule Trigger, Loop Over Items    | Is Exists                                          |                                                                                               |
| Is Exists                              | IF                  | Checks if any open MR exists             | API to Check existing merge request  | Create New Merge Request (true), Loop Over Items (false) |                                                                                               |
| Create New Merge Request               | HTTP Request        | Creates a new MR                         | Is Exists (true)                     | Add Custom Notes To Merge Request                   |                                                                                               |
| Add Custom Notes To Merge Request      | HTTP Request        | Adds comments to newly created MR       | Create New Merge Request             | 30 secs wait to approve merge request and pipeline to finish1 |                                                                                               |
| 30 secs wait to approve merge request and pipeline to finish1 | Wait                | Waits 30 seconds for approvals/pipeline | Add Custom Notes To Merge Request    | setValueForMerge                                   |                                                                                               |
| setValueForMerge                      | Set                 | Sets merge parameters                    | 30 secs wait to approve merge request and pipeline to finish1 | Merge When Pipeline Succeeds                        |                                                                                               |
| Merge When Pipeline Succeeds           | HTTP Request        | Merges MR via API                        | setValueForMerge                    | None                                              |                                                                                               |
| Loop Over Items                       | SplitInBatches      | Iterates over existing MRs               | Is Exists (false), API to CLOSE existing Merge Request | API to Check existing merge request, API to CLOSE existing Merge Request |                                                                                               |
| API to CLOSE existing Merge Request    | HTTP Request        | Closes existing MR                       | Loop Over Items                    | Loop Over Items                                    |                                                                                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node:**  
   - Type: Schedule Trigger  
   - Configure to run at desired intervals (default is every minute).  
   - No credentials needed.

2. **Add an HTTP Request node named "API to Check existing merge request":**  
   - Method: GET  
   - URL: `https://gitlab.com/<projectid>/merge_requests` (replace `<projectid>` with your GitLab project ID)  
   - Query Parameters:  
     - `state` = `opened`  
     - `source_branch` = Expression: `{{$json["sourceBranchName"]}}` (or set as workflow variable)  
   - Headers:  
     - `PRIVATE-TOKEN` = Expression: `{{$json["gitlabToken"]}}` (use credential or variable)  
   - Options: Disable "Allow Unauthorized Certs"  
   - Connect Schedule Trigger output to this node input.

3. **Add an IF node named "Is Exists":**  
   - Condition: Check if the output data from "API to Check existing merge request" is empty.  
   - Expression: `{{$node["API to Check existing merge request"].data.isEmpty()}}`  
   - True branch: Connect to "Create New Merge Request"  
   - False branch: Connect to "Loop Over Items"

4. **Add an HTTP Request node named "Create New Merge Request":**  
   - Method: POST  
   - URL: `https://gitlab.com/<projectid>/merge_requests`  
   - Body Type: Form-URL Encoded  
   - Body Parameters:  
     - `source_branch` = Expression: `{{$json["sourceBranchName"]}}`  
     - `target_branch` = Expression: `{{$json["targetBranchName"]}}`  
     - `title` = Expression: `{{$json["mergeTitle"]}}`  
   - Headers:  
     - `PRIVATE-TOKEN` = Expression: `{{$json["gitlabToken"]}}`  
   - Connect "Is Exists" true output to this node.

5. **Add an HTTP Request node named "Add Custom Notes To Merge Request":**  
   - Method: POST  
   - URL: `https://gitlab.com/<projectid>/merge_requests/{{merge_iid}}/notes`  
     - Use expression to dynamically insert `merge_iid` from previous node output.  
   - Body Type: Form-URL Encoded  
   - Body Parameters:  
     - `body` = Expression: `{{$json["mergeComments"]}}`  
   - Headers:  
     - `PRIVATE-TOKEN` = Expression: `{{$json["gitlabToken"]}}`  
   - Connect "Create New Merge Request" output to this node.

6. **Add a Wait node named "30 secs wait to approve merge request and pipeline to finish1":**  
   - Wait Time: 30 seconds  
   - Connect "Add Custom Notes To Merge Request" output to this node.

7. **Add a Set node named "setValueForMerge":**  
   - Add two boolean fields:  
     - `merge_when_pipeline_succeeds` = false  
     - `should_remove_source_branch` = true  
   - Connect "30 secs wait to approve merge request and pipeline to finish1" output to this node.

8. **Add an HTTP Request node named "Merge When Pipeline Succeeds":**  
   - Method: PUT  
   - URL: `https://gitlab.com/<projectid>/merge_requests/{{merge_iid}}/merge`  
   - Body Type: JSON  
   - Body Content:  
     ```json
     {
       "merge_when_pipeline_succeeds": {{$node["setValueForMerge"].json["merge_when_pipeline_succeeds"]}},
       "should_remove_source_branch": {{$node["setValueForMerge"].json["should_remove_source_branch"]}}
     }
     ```  
   - Headers:  
     - `PRIVATE-TOKEN` = Expression: `{{$json["gitlabToken"]}}`  
   - Connect "setValueForMerge" output to this node.

9. **Add a SplitInBatches node named "Loop Over Items":**  
   - Default batch size (1)  
   - Connect "Is Exists" false output to this node.

10. **Add an HTTP Request node named "API to CLOSE existing Merge Request":**  
    - Method: PUT  
    - URL: `https://gitlab.com/<projectid>/merge_requests/{{merge_iid}}`  
    - Body Type: Form-URL Encoded  
    - Body Parameters:  
      - `state_event` = `close`  
    - Headers:  
      - `PRIVATE-TOKEN` = Expression: `{{$json["gitlabToken"]}}`  
    - Connect "Loop Over Items" output to this node.

11. **Connect "API to CLOSE existing Merge Request" output back to "Loop Over Items" input** to continue processing all MRs.

12. **Connect "Loop Over Items" output to "API to Check existing merge request" input** to refresh the MR list after closures.

13. **Set up credentials:**  
    - Create GitLab API credentials or securely store `gitlabToken` as environment variable or n8n credential.  
    - Avoid hardcoding tokens in HTTP Request nodes; use expressions referencing credentials.

14. **Variables to define or pass into the workflow:**  
    - `sourceBranchName` (string)  
    - `targetBranchName` (string)  
    - `mergeTitle` (string)  
    - `mergeComments` (string)  
    - `gitlabToken` (string, secured)

---

### 5. General Notes & Resources

| Note Content                                                                                         | Context or Link                                                                                  |
|----------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Never hard code API tokens or secrets directly in HTTP Request nodes; use n8n credentials or env vars | Security best practice for API authentication                                                   |
| This workflow can be triggered alternatively by Webhook or GitLab Trigger nodes instead of Schedule | To adapt for event-driven automation instead of polling                                        |
| GitLab API documentation for merge requests: https://docs.gitlab.com/ee/api/merge_requests.html     | Reference for API endpoints and parameters                                                     |
| n8n documentation on HTTP Request node: https://docs.n8n.io/nodes/n8n-nodes-base.httpRequest/       | Useful for customizing API calls                                                                |
| Consider increasing wait time or adding conditional checks for pipeline status for production use  | To handle variable pipeline durations and avoid premature merges                                |
| The workflow assumes the GitLab project ID and merge_iid are correctly set and accessible           | Ensure correct project and MR identifiers to avoid API errors                                  |

---

This document provides a detailed, stepwise understanding and reproduction guide for the GitLab merge request automation workflow in n8n, enabling users to customize, debug, and extend it effectively.