Asynchronous Bulk Web Scraping with Bright Data & Webhook Notifications

https://n8nworkflows.xyz/workflows/asynchronous-bulk-web-scraping-with-bright-data---webhook-notifications-3866


# Asynchronous Bulk Web Scraping with Bright Data & Webhook Notifications

### 1. Workflow Overview

This workflow automates asynchronous bulk web scraping using Bright Data’s Web Scraper API, targeting users who need to collect, structure, and process large-scale web data efficiently. It is ideal for data engineers, market researchers, analysts, and automation developers who require reliable, repeatable scraping jobs with snapshot-based data retrieval and webhook notifications.

The workflow is logically divided into the following blocks:

- **1.1 Input Initialization:** Setting dataset parameters and request URLs.
- **1.2 Trigger Scraping Job:** Sending a POST request to Bright Data API to start a snapshot job.
- **1.3 Polling Snapshot Status:** Periodically checking if the snapshot is ready.
- **1.4 Snapshot Download & Validation:** Downloading the snapshot data once ready and verifying for errors.
- **1.5 Data Aggregation & Persistence:** Aggregating JSON data and saving it to disk.
- **1.6 Webhook Notification:** Sending the final data or summary to an external webhook endpoint.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Initialization

- **Overview:**  
  This block sets the initial parameters required for the scraping job, including the Bright Data dataset ID and the request payload specifying the target URLs.

- **Nodes Involved:**  
  - Set Dataset Id, Request URL  
  - When clicking ‘Test workflow’

- **Node Details:**  
  - **When clicking ‘Test workflow’**  
    - Type: Manual Trigger  
    - Role: Entry point for manual execution/testing.  
    - Configuration: No parameters; triggers workflow manually.  
    - Inputs: None  
    - Outputs: Connects to "Set Dataset Id, Request URL"  
    - Edge cases: None specific; manual trigger may be idle if not activated.

  - **Set Dataset Id, Request URL**  
    - Type: Set  
    - Role: Defines static input variables for dataset ID and request JSON payload.  
    - Configuration:  
      - `dataset_id` set to `"gd_l7q7dkf244hwjntr0"` (example dataset ID)  
      - `request` set to a JSON string containing the target URL(s) for scraping (Amazon product page example).  
    - Inputs: From manual trigger  
    - Outputs: To "HTTP Request to the specified URL"  
    - Edge cases: Static values require manual update for different datasets or URLs.

---

#### 2.2 Trigger Scraping Job

- **Overview:**  
  Sends an authenticated HTTP POST request to Bright Data’s API to initiate a scraping snapshot job using the dataset ID and request payload.

- **Nodes Involved:**  
  - HTTP Request to the specified URL  
  - Set Snapshot Id

- **Node Details:**  
  - **HTTP Request to the specified URL**  
    - Type: HTTP Request  
    - Role: Starts the scraping job by calling Bright Data API endpoint `/datasets/v3/trigger`.  
    - Configuration:  
      - Method: POST  
      - URL: `https://api.brightdata.com/datasets/v3/trigger`  
      - Body: JSON, containing the request payload from previous node  
      - Query Parameters: `dataset_id`, `format=json`, `uncompressed_webhook=true`  
      - Authentication: Header Authentication with Bearer token (configured via credentials)  
      - Timeout and headers: Default except auth header  
    - Inputs: From "Set Dataset Id, Request URL"  
    - Outputs: To "Set Snapshot Id"  
    - Edge cases:  
      - Auth failures if token invalid or expired  
      - Network timeouts or API rate limits  
      - Invalid dataset ID or malformed request payload

  - **Set Snapshot Id**  
    - Type: Set  
    - Role: Extracts and stores the `snapshot_id` from the API response for subsequent polling.  
    - Configuration: Assigns `snapshot_id` from response JSON field `snapshot_id`.  
    - Inputs: From HTTP Request node  
    - Outputs: To "Check Snapshot Status"  
    - Edge cases: Missing or malformed `snapshot_id` in response could break downstream logic.

---

#### 2.3 Polling Snapshot Status

- **Overview:**  
  Implements a polling loop that repeatedly checks the snapshot’s readiness status by querying the Bright Data API until the snapshot is marked as "ready".

- **Nodes Involved:**  
  - Check Snapshot Status  
  - If  
  - Wait

- **Node Details:**  
  - **Check Snapshot Status**  
    - Type: HTTP Request  
    - Role: Queries snapshot progress endpoint to retrieve current snapshot status.  
    - Configuration:  
      - URL: `https://api.brightdata.com/datasets/v3/progress/{{ $json.snapshot_id }}` (dynamic snapshot_id)  
      - Method: GET (default)  
      - Authentication: Header Authentication (same as before)  
    - Inputs: From "Set Snapshot Id" and from "Wait" node (loop)  
    - Outputs: To "If" node  
    - Edge cases:  
      - Auth errors  
      - Snapshot ID invalid or expired  
      - Network issues

  - **If**  
    - Type: If Condition  
    - Role: Checks if snapshot status equals "ready".  
    - Configuration: Condition: `$json.status == "ready"`  
    - Inputs: From "Check Snapshot Status"  
    - Outputs:  
      - True branch: To "Check on the errors" (proceed to download)  
      - False branch: To "Wait" (continue polling)  
    - Edge cases: Status field missing or unexpected values.

  - **Wait**  
    - Type: Wait  
    - Role: Pauses workflow execution for 30 seconds before next polling attempt.  
    - Configuration: Wait time set to 30 seconds.  
    - Inputs: From "If" node (false branch)  
    - Outputs: To "Check Snapshot Status" (loop back)  
    - Edge cases: Long polling may cause workflow execution timeouts if n8n instance limits apply.

---

#### 2.4 Snapshot Download & Validation

- **Overview:**  
  Once the snapshot is ready, this block downloads the snapshot data, checks for errors, and proceeds only if no errors are found.

- **Nodes Involved:**  
  - Check on the errors  
  - Download Snapshot

- **Node Details:**  
  - **Check on the errors**  
    - Type: If Condition  
    - Role: Validates that the snapshot response contains zero errors before proceeding.  
    - Configuration: Checks if `$json.errors.toString() == "0"`  
    - Inputs: From "If" node (true branch)  
    - Outputs:  
      - True branch: To "Download Snapshot"  
      - False branch: To "Wait" (retry polling)  
    - Edge cases: Errors count field missing or non-zero errors indicating snapshot issues.

  - **Download Snapshot**  
    - Type: HTTP Request  
    - Role: Downloads the snapshot dataset in JSON format.  
    - Configuration:  
      - URL: `https://api.brightdata.com/datasets/v3/snapshot/{{ $json.snapshot_id }}`  
      - Query Parameter: `format=json`  
      - Authentication: Header Authentication  
      - Timeout: 10 seconds  
    - Inputs: From "Check on the errors" (true branch)  
    - Outputs: To "Aggregate JSON Response"  
    - Edge cases:  
      - Timeout if dataset is large  
      - Auth or network errors  
      - Snapshot data incomplete or corrupted

---

#### 2.5 Data Aggregation & Persistence

- **Overview:**  
  Aggregates all JSON items from the snapshot into a single dataset, converts it to binary data, and writes it to a local disk file for archival or further processing.

- **Nodes Involved:**  
  - Aggregate JSON Response  
  - Create a binary data  
  - Write the file to disk

- **Node Details:**  
  - **Aggregate JSON Response**  
    - Type: Aggregate  
    - Role: Combines all incoming JSON items into one aggregated JSON array.  
    - Configuration: Aggregate all item data into a single JSON array.  
    - Inputs: From "Download Snapshot"  
    - Outputs: To "Initiate a Webhook Notification" and "Create a binary data" (parallel)  
    - Edge cases: Large datasets may cause memory issues.

  - **Create a binary data**  
    - Type: Function  
    - Role: Converts aggregated JSON data into base64-encoded binary format for file writing.  
    - Configuration: Uses Node.js Buffer to encode JSON stringified data.  
    - Inputs: From "Aggregate JSON Response"  
    - Outputs: To "Write the file to disk"  
    - Edge cases: Encoding errors or large data size.

  - **Write the file to disk**  
    - Type: Read/Write File  
    - Role: Writes the binary data to a local file at `d:\bulk_data.json`.  
    - Configuration:  
      - Operation: Write  
      - File path: `d:\bulk_data.json` (Windows path)  
    - Inputs: From "Create a binary data"  
    - Outputs: None (end of persistence chain)  
    - Edge cases: File system permissions, disk space, path validity.

---

#### 2.6 Webhook Notification

- **Overview:**  
  Sends a notification containing the first item of the aggregated snapshot data to an external webhook endpoint for downstream processing or alerts.

- **Nodes Involved:**  
  - Initiate a Webhook Notification

- **Node Details:**  
  - **Initiate a Webhook Notification**  
    - Type: HTTP Request  
    - Role: Sends a POST request to a webhook URL with a JSON body containing the first data item from the snapshot.  
    - Configuration:  
      - URL: `https://webhook.site/daf9d591-a130-4010-b1d3-0c66f8fcf467` (example webhook)  
      - Method: POST (default)  
      - Body: JSON with parameter `response` set to first element of `$json.data` array  
      - Sends body in request  
    - Inputs: From "Aggregate JSON Response"  
    - Outputs: None (end of workflow)  
    - Edge cases: Webhook endpoint unavailability, network errors, payload size limits.

---

### 3. Summary Table

| Node Name                    | Node Type          | Functional Role                          | Input Node(s)                  | Output Node(s)                     | Sticky Note                                                                                       |
|------------------------------|--------------------|----------------------------------------|-------------------------------|----------------------------------|-------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’ | Manual Trigger     | Manual start of workflow                | None                          | Set Dataset Id, Request URL       |                                                                                                 |
| Set Dataset Id, Request URL   | Set                | Defines dataset ID and request payload | When clicking ‘Test workflow’ | HTTP Request to the specified URL |                                                                                                 |
| HTTP Request to the specified URL | HTTP Request      | Initiates scraping snapshot job        | Set Dataset Id, Request URL    | Set Snapshot Id                   |                                                                                                 |
| Set Snapshot Id              | Set                | Extracts snapshot ID from response      | HTTP Request to the specified URL | Check Snapshot Status           |                                                                                                 |
| Check Snapshot Status        | HTTP Request       | Polls snapshot readiness status         | Set Snapshot Id, Wait          | If                              |                                                                                                 |
| If                          | If Condition       | Checks if snapshot status is "ready"   | Check Snapshot Status          | Check on the errors (true), Wait (false) |                                                                                                 |
| Wait                        | Wait               | Waits 30 seconds before next poll       | If (false branch)              | Check Snapshot Status            |                                                                                                 |
| Check on the errors          | If Condition       | Validates snapshot has zero errors      | If (true branch)               | Download Snapshot (true), Wait (false) |                                                                                                 |
| Download Snapshot           | HTTP Request       | Downloads snapshot data                  | Check on the errors            | Aggregate JSON Response          |                                                                                                 |
| Aggregate JSON Response     | Aggregate          | Aggregates all JSON data items           | Download Snapshot              | Initiate a Webhook Notification, Create a binary data |                                                                                                 |
| Initiate a Webhook Notification | HTTP Request      | Sends notification to external webhook  | Aggregate JSON Response        | None                            |                                                                                                 |
| Create a binary data        | Function           | Converts JSON to base64 binary           | Aggregate JSON Response        | Write the file to disk           |                                                                                                 |
| Write the file to disk      | Read/Write File    | Saves binary data to local disk          | Create a binary data           | None                            |                                                                                                 |
| Sticky Note                 | Sticky Note        | Notes about Amazon scraping and setup   | None                          | None                            | ## Note\n\nDeals with the Amazon web scraping by utilizing Bright Data Web Scraper Product.\n\n**Please make sure to set the Bright Data \n -> Dataset Id, Request URL and update the Webhook Notification URL**\n\nRefer \n- https://brightdata.com/products/web-scraper/ai\n- https://brightdata.com/products/web-scraper |
| Sticky Note1                | Sticky Note        | Reminder about waiting for snapshot readiness | None                          | None                            | ## Wait until the Snapshot is ready                                                             |
| Sticky Note2                | Sticky Note        | Who benefits from scraper APIs           | None                          | None                            | ## Who can benefit?\nData analysts, scientists, engineers, and developers seeking efficient methods to collect and analyze web data for AI, ML, big data applications, and more will find Scraper APIs particularly beneficial. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - Purpose: Entry point to start the workflow manually.

2. **Create Set Node "Set Dataset Id, Request URL"**  
   - Assign two variables:  
     - `dataset_id` (string): e.g., `"gd_l7q7dkf244hwjntr0"`  
     - `request` (string): JSON string with URLs to scrape, e.g., `[{"url": "https://www.amazon.com/Quencher-FlowState-Stainless-Insulated-Smoothie/dp/B0CRMZHDG8"}]`  
   - Connect Manual Trigger → Set Dataset Id, Request URL.

3. **Create HTTP Request Node "HTTP Request to the specified URL"**  
   - Method: POST  
   - URL: `https://api.brightdata.com/datasets/v3/trigger`  
   - Authentication: Header Authentication (configure credentials with Bearer token from Bright Data Web Unlocker)  
   - Body: JSON, set to `{{$json.request}}` from previous node  
   - Query Parameters:  
     - `dataset_id` = `{{$json.dataset_id}}`  
     - `format` = `json`  
     - `uncompressed_webhook` = `true`  
   - Connect Set Dataset Id, Request URL → HTTP Request to the specified URL.

4. **Create Set Node "Set Snapshot Id"**  
   - Assign variable `snapshot_id` from response JSON field `snapshot_id`  
   - Connect HTTP Request to the specified URL → Set Snapshot Id.

5. **Create HTTP Request Node "Check Snapshot Status"**  
   - Method: GET  
   - URL: `https://api.brightdata.com/datasets/v3/progress/{{$json.snapshot_id}}`  
   - Authentication: Header Authentication (same credentials)  
   - Connect Set Snapshot Id → Check Snapshot Status.

6. **Create If Node "If"**  
   - Condition: `$json.status == "ready"` (string equals)  
   - Connect Check Snapshot Status → If.

7. **Create Wait Node "Wait"**  
   - Wait time: 30 seconds  
   - Connect If (false branch) → Wait.  
   - Connect Wait → Check Snapshot Status (loop back).

8. **Create If Node "Check on the errors"**  
   - Condition: `$json.errors.toString() == "0"`  
   - Connect If (true branch) → Check on the errors.

9. **Connect Check on the errors (true branch) → Download Snapshot**  
   - Connect Check on the errors (false branch) → Wait (retry polling).

10. **Create HTTP Request Node "Download Snapshot"**  
    - Method: GET  
    - URL: `https://api.brightdata.com/datasets/v3/snapshot/{{$json.snapshot_id}}`  
    - Query Parameter: `format=json`  
    - Authentication: Header Authentication  
    - Timeout: 10 seconds  
    - Connect Check on the errors (true) → Download Snapshot.

11. **Create Aggregate Node "Aggregate JSON Response"**  
    - Aggregate all item data into one JSON array.  
    - Connect Download Snapshot → Aggregate JSON Response.

12. **Create HTTP Request Node "Initiate a Webhook Notification"**  
    - Method: POST  
    - URL: Set to your webhook endpoint (e.g., `https://webhook.site/...`)  
    - Body Parameters: JSON with key `response` set to `{{$json.data[0]}}` (first item)  
    - Connect Aggregate JSON Response → Initiate a Webhook Notification.

13. **Create Function Node "Create a binary data"**  
    - Code:  
      ```javascript
      items[0].binary = {
        data: {
          data: Buffer.from(JSON.stringify(items[0].json, null, 2)).toString('base64')
        }
      };
      return items;
      ```  
    - Connect Aggregate JSON Response → Create a binary data.

14. **Create Read/Write File Node "Write the file to disk"**  
    - Operation: Write  
    - File Name: `d:\bulk_data.json` (adjust path as needed)  
    - Connect Create a binary data → Write the file to disk.

15. **Credential Setup**  
    - Create a Generic Auth Credential in n8n with Header Authentication type.  
    - Set header value as `Bearer XXXXXXXXXXXXXX` where `XXXXXXXXXXXXXX` is your Bright Data Web Unlocker token.  
    - Assign this credential to all HTTP Request nodes that require authentication.

16. **Optional: Add Sticky Notes**  
    - For documentation and reminders, add sticky notes near relevant nodes with setup instructions and usage tips.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                       | Context or Link                                                                                      |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Deals with the Amazon web scraping by utilizing Bright Data Web Scraper Product. Please make sure to set the Bright Data Dataset Id, Request URL, and update the Webhook Notification URL accordingly.                            | Bright Data Web Scraper product: https://brightdata.com/products/web-scraper/ai and https://brightdata.com/products/web-scraper |
| Wait until the Snapshot is ready before proceeding with data download and processing.                                                                                                                                             | Workflow polling strategy reminder                                                                 |
| Who can benefit? Data analysts, scientists, engineers, and developers seeking efficient methods to collect and analyze web data for AI, ML, big data applications, and more will find Scraper APIs particularly beneficial.       | Use case context                                                                                   |
| Setup instructions: Sign up at Bright Data, create Web Unlocker zone, configure Header Auth credentials in n8n with Bearer token, and update dataset/request parameters and webhook URLs as needed.                              | Setup instructions in workflow description                                                        |

---

This structured documentation provides a complete understanding of the workflow’s purpose, logic, node configurations, and reproduction steps, enabling both advanced users and AI agents to maintain, modify, or extend the workflow confidently.