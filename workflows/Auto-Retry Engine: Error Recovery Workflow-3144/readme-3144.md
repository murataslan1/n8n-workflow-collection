Auto-Retry Engine: Error Recovery Workflow

https://n8nworkflows.xyz/workflows/auto-retry-engine--error-recovery-workflow-3144


# Auto-Retry Engine: Error Recovery Workflow

### 1. Workflow Overview

The **Auto-Retry Engine: Error Recovery Workflow** is designed to automatically identify and retry failed executions in n8n workflows on an hourly basis. It eliminates manual error handling by periodically querying for failed executions, authenticating with the n8n API, and retrying those executions in controlled batches. This improves system reliability and operational efficiency by ensuring workflows recover from errors without human intervention.

The workflow is logically divided into the following blocks:

- **1.1 Scheduled Monitoring:** Periodically triggers the workflow every hour to initiate the retry process.
- **1.2 Preparation of Login Credentials:** Sets up necessary credentials and instance details for API authentication.
- **1.3 Authentication:** Logs into the n8n instance via API to obtain session cookies for subsequent requests.
- **1.4 Retrieval of Failed Executions:** Queries the n8n API to fetch all executions with an error status.
- **1.5 Filtering and Conditional Check:** Filters executions to exclude those already successfully retried and decides whether to proceed.
- **1.6 Batch Processing and Retry:** Splits the filtered executions into batches and retries each execution via the API.
- **1.7 Manual Trigger (Optional):** Allows manual testing of the workflow through a manual trigger node.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Monitoring

- **Overview:** This block triggers the workflow automatically every hour to check for failed executions.
- **Nodes Involved:**  
  - `Schedule Trigger`
- **Node Details:**

  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Configuration: Set to trigger every hour (interval field set to hours).  
    - Inputs: None (trigger node).  
    - Outputs: Connects to `login_details` node to start the workflow.  
    - Edge Cases: If n8n instance is down or scheduler is paused, the trigger won't fire.  
    - Version: 1.2  

#### 1.2 Preparation of Login Credentials

- **Overview:** Sets the n8n instance URL, username, password, and execution ID for use in API requests.
- **Nodes Involved:**  
  - `login_details`
- **Node Details:**

  - **login_details**  
    - Type: Set Node  
    - Configuration: Assigns static values for:  
      - `username`: "gaturanjenga@gmail.com"  
      - `password`: "Password123"  
      - `n8n_instance`: "https://ai.gatuservices.info/"  
      - `executionid`: Expression `={{ $json.id }}` (dynamic execution ID from input)  
    - Inputs: From `Schedule Trigger` or manual trigger.  
    - Outputs: Connects to `Log into n8n` node.  
    - Edge Cases: Hardcoded credentials may cause security risks; consider using n8n credentials instead.  
    - Version: 3.4  

#### 1.3 Authentication

- **Overview:** Logs into the n8n instance API to retrieve session cookies necessary for authenticated API calls.
- **Nodes Involved:**  
  - `Log into n8n`
- **Node Details:**

  - **Log into n8n**  
    - Type: HTTP Request  
    - Configuration:  
      - Method: POST  
      - URL: Dynamically constructed from `n8n_instance` with `/rest/login` appended.  
      - Body: JSON with `email` and `password` from `login_details`.  
      - Headers: Accept, Accept-Language, User-Agent set for API compatibility.  
      - Response: Full HTTP response including headers to extract cookies.  
      - Retry on Fail: Enabled for robustness.  
    - Inputs: From `login_details`.  
    - Outputs: Connects to `n8n` node.  
    - Edge Cases: Authentication failure (wrong credentials), network issues, API downtime.  
    - Version: 4.2  

#### 1.4 Retrieval of Failed Executions

- **Overview:** Queries the n8n API to fetch all workflow executions with status "error".
- **Nodes Involved:**  
  - `n8n`
- **Node Details:**

  - **n8n**  
    - Type: n8n Node (n8n API integration)  
    - Configuration:  
      - Resource: Execution  
      - Filters: Status = "error"  
      - Return All: True (fetch all matching executions)  
      - Options: `activeWorkflows` set to false (exclude active workflows)  
      - Credentials: Uses stored n8n API credentials (`Gatu a/c`)  
    - Inputs: From `Log into n8n`.  
    - Outputs: Connects to `If` node.  
    - Edge Cases: API rate limits, empty results, credential expiration.  
    - Version: 1  

#### 1.5 Filtering and Conditional Check

- **Overview:** Checks if the executions have a `retrySuccessId` to determine if they have already been retried successfully; branches workflow accordingly.
- **Nodes Involved:**  
  - `If`  
  - `No Operation, do nothing`
- **Node Details:**

  - **If**  
    - Type: If Node  
    - Configuration:  
      - Condition: Checks if `retrySuccessId` field is not empty (indicating successful retry).  
      - If True: Routes to `No Operation, do nothing`.  
      - If False: Routes to `Loop Over Items` for retrying.  
    - Inputs: From `n8n` node.  
    - Outputs: Two branches:  
      - True → `No Operation, do nothing`  
      - False → `Loop Over Items`  
    - Edge Cases: Missing or malformed `retrySuccessId` field, expression errors.  
    - Version: 2.2  

  - **No Operation, do nothing**  
    - Type: NoOp Node  
    - Configuration: No parameters; acts as a sink for executions that do not require retry.  
    - Inputs: From `If` node (true branch).  
    - Outputs: None.  
    - Edge Cases: None.  
    - Version: 1  

#### 1.6 Batch Processing and Retry

- **Overview:** Processes failed executions in batches of 5 and retries each execution via the n8n API.
- **Nodes Involved:**  
  - `Loop Over Items`  
  - `retry workflow automatically`  
  - `execution_id` (implied node from connections, likely a renamed or missing node in JSON but corresponds to retry HTTP request)
- **Node Details:**

  - **Loop Over Items**  
    - Type: SplitInBatches  
    - Configuration: Batch size set to 5 to limit concurrent retries and avoid API overload.  
    - Inputs: From `If` node (false branch).  
    - Outputs: Two outputs:  
      - Main output: Connects to `execution_id` node (retry request).  
      - Second output: Connects back to itself for next batch iteration.  
    - Edge Cases: Large number of failed executions may cause long processing times; batch size tuning recommended.  
    - Version: 3  

  - **retry workflow automatically** (mapped to `execution_id` in connections)  
    - Type: HTTP Request  
    - Configuration:  
      - Method: POST  
      - URL: Dynamically constructed using `n8n_instance` and execution ID to call `/rest/executions/{id}/retry`.  
      - Headers: Includes session cookie from `Log into n8n` node for authentication.  
      - Body: Includes parameter `loadWorkflow` set to true to reload workflow on retry.  
      - Retry on Fail: Enabled.  
      - On Error: Continues regular output to avoid stopping batch processing on single failure.  
    - Inputs: From `Loop Over Items`.  
    - Outputs: Connects back to `Loop Over Items` to continue batch processing.  
    - Edge Cases: Retry failures, invalid execution IDs, session expiration.  
    - Version: 4.2  

#### 1.7 Manual Trigger (Optional)

- **Overview:** Allows manual triggering of the workflow for testing purposes.
- **Nodes Involved:**  
  - `When clicking ‘Test workflow’`
- **Node Details:**

  - **When clicking ‘Test workflow’**  
    - Type: Manual Trigger  
    - Configuration: No parameters; triggers workflow on user action.  
    - Inputs: None.  
    - Outputs: Connects to `login_details` node to start the retry process manually.  
    - Edge Cases: None.  
    - Version: 1  

---

### 3. Summary Table

| Node Name               | Node Type               | Functional Role                          | Input Node(s)               | Output Node(s)              | Sticky Note                                                                                          |
|-------------------------|-------------------------|----------------------------------------|-----------------------------|-----------------------------|----------------------------------------------------------------------------------------------------|
| Schedule Trigger        | Schedule Trigger         | Triggers workflow hourly                | None                        | login_details               | - ## check for failed executions hourly.                                                          |
| login_details           | Set                     | Sets login credentials and instance info| Schedule Trigger, Manual Trigger | Log into n8n               | ## Set the login credential details in the set node, and login to n8n via api.                     |
| Log into n8n            | HTTP Request            | Authenticates with n8n API               | login_details               | n8n                        |                                                                                                    |
| n8n                     | n8n API Node             | Retrieves all failed executions          | Log into n8n                | If                         | ## Get all `Error` executions. - ### Filter out those that have been successfully retried          |
| If                      | If                       | Filters executions with retrySuccessId   | n8n                        | No Operation, do nothing; Loop Over Items |                                                                                                    |
| No Operation, do nothing| NoOp                     | Ends flow for executions already retried | If (true branch)            | None                       |                                                                                                    |
| Loop Over Items         | SplitInBatches           | Processes executions in batches          | If (false branch), retry workflow automatically | retry workflow automatically |                                                                                                    |
| retry workflow automatically | HTTP Request        | Retries each failed execution via API    | Loop Over Items             | Loop Over Items             | ## Retry the executions. - ### Feel free to add notifications error messages for failed one to email or slack |
| When clicking ‘Test workflow’ | Manual Trigger      | Manual start for testing                  | None                        | login_details               |                                                                                                    |
| Sticky Note             | Sticky Note              | Notes and instructions                    | None                        | None                       | - ## check for failed executions hourly. - ## filter out those that have successful reexecution ids. - ## log into n8n and get the session ids. - ## retry the executions. - h |
| Sticky Note1            | Sticky Note              | Notes on login credentials setup          | None                        | None                       | ## Set the login credential details in the set node, and login to n8n via api.                     |
| Sticky Note2            | Sticky Note              | Notes on filtering error executions       | None                        | None                       | ## Get all `Error` executions. - ### Filter out those that have been successfully retried          |
| Sticky Note3            | Sticky Note              | Notes on retrying executions and notifications | None                        | None                       | ## Retry the executions. - ### Feel free to add notifications error messages for failed one to email or slack |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Set interval to trigger every hour (field: hours).  
   - Connect output to the next node.

2. **Create a Set Node named `login_details`**  
   - Add fields:  
     - `username`: string, e.g., "gaturanjenga@gmail.com"  
     - `password`: string, e.g., "Password123"  
     - `n8n_instance`: string, e.g., "https://ai.gatuservices.info/"  
     - `executionid`: expression `{{$json["id"]}}` (dynamic, from input)  
   - Connect Schedule Trigger output to this node.

3. **Create an HTTP Request Node named `Log into n8n`**  
   - Method: POST  
   - URL: Use expression to append `/rest/login` to `n8n_instance` from `login_details`:  
     ```
     {{ 
       (() => {
         const instance = $json.n8n_instance;
         return instance.endsWith('/') ? instance + 'rest/login' : instance + '/rest/login';
       })()
     }}
     ```  
   - Body Parameters:  
     - `email`: `{{$json.username}}`  
     - `password`: `{{$json.password}}`  
   - Headers:  
     - Accept: "application/json, text/plain, */*"  
     - Accept-Language: "en-US,en;q=0.9"  
     - User-Agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"  
   - Response: Full response including headers (to extract cookies).  
   - Enable "Retry On Fail".  
   - Connect `login_details` output to this node.

4. **Create an n8n Node named `n8n`**  
   - Resource: Execution  
   - Operation: List executions  
   - Filters: Status = "error"  
   - Options: Active workflows = false  
   - Return All: true  
   - Credentials: Select your n8n API credentials (e.g., "Gatu a/c")  
   - Connect output of `Log into n8n` to this node.

5. **Create an If Node named `If`**  
   - Condition: Check if `retrySuccessId` field is not empty:  
     - Left Value: `{{$json.retrySuccessId}}`  
     - Operation: String "not empty"  
   - If true: Connect to `No Operation, do nothing` node.  
   - If false: Connect to `Loop Over Items` node.

6. **Create a NoOp Node named `No Operation, do nothing`**  
   - No configuration needed.  
   - Connect `If` true branch to this node.

7. **Create a SplitInBatches Node named `Loop Over Items`**  
   - Batch Size: 5  
   - Connect `If` false branch to this node.

8. **Create an HTTP Request Node named `retry workflow automatically`**  
   - Method: POST  
   - URL: Construct dynamically to call retry endpoint:  
     ```
     {{
       $('login_details').item.json.n8n_instance.endsWith('/') 
         ? $('login_details').item.json.n8n_instance + 'rest/executions/' + $json.id + '/retry' 
         : $('login_details').item.json.n8n_instance + '/rest/executions/' + $json.id + '/retry'
     }}
     ```  
   - Headers:  
     - Accept: "application/json, text/plain, */*"  
     - Accept-Language: "en-US,en;q=0.9"  
     - Cookie: `{{$node["Log into n8n"].json["headers"]["set-cookie"][0]}}` (session cookie)  
     - User-Agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"  
   - Body Parameters:  
     - `loadWorkflow`: true  
   - Enable "Retry On Fail".  
   - On Error: Continue regular output (do not stop workflow).  
   - Connect `Loop Over Items` output to this node.  
   - Connect output of this node back to `Loop Over Items` to continue processing batches.

9. **Create a Manual Trigger Node named `When clicking ‘Test workflow’`**  
   - No configuration needed.  
   - Connect output to `login_details` node to allow manual testing.

---

### 5. General Notes & Resources

| Note Content                                                                                         | Context or Link                                                                                   |
|----------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| This workflow is designed to run hourly but can be customized to run at different intervals.       | Modify the Schedule Trigger node interval accordingly.                                           |
| Consider securing credentials using n8n's credential management instead of hardcoding in Set node. | Enhances security and ease of maintenance.                                                      |
| Adding notifications (email, Slack) for retry failures can improve monitoring and alerting.        | Extend workflow by adding notification nodes after retry attempts.                              |
| Batch size in SplitInBatches node can be adjusted to optimize API load and processing time.        | Tune batch size based on system capacity and API rate limits.                                  |
| Workflow uses n8n API endpoints `/rest/login` and `/rest/executions/{id}/retry` for authentication and retry. | Ensure API access is enabled and credentials have appropriate permissions.                      |
| Sticky notes in the workflow provide concise instructions and reminders for setup and customization.| Refer to sticky notes for quick contextual help within the n8n editor interface.                |

---

This documentation provides a complete and detailed reference for understanding, reproducing, and customizing the Auto-Retry Engine: Error Recovery Workflow in n8n.