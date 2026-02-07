Automate Video Creation with Luma AI Dream Machine and Airtable (Part 2)

https://n8nworkflows.xyz/workflows/automate-video-creation-with-luma-ai-dream-machine-and-airtable--part-2--3201


# Automate Video Creation with Luma AI Dream Machine and Airtable (Part 2)

### 1. Workflow Overview

This workflow automates the final step of video creation using Luma AI Dream Machine by capturing the webhook callback after video generation completes, processing the returned data, and updating an Airtable base with the video and thumbnail URLs. It is designed to integrate seamlessly with a preceding workflow (Part 1) that initiates video generation, thus completing an end-to-end automation pipeline for video creation and tracking.

The workflow is logically divided into three main blocks:

- **1.1 Webhook Reception:** Listens for the POST callback from Luma AI containing video generation results.
- **1.2 Data Extraction and Validation:** Extracts relevant video data from the webhook payload and validates the presence of a video URL.
- **1.3 Airtable Update:** Updates the corresponding Airtable record with the video URL, thumbnail URL, and marks the status as "Done" using the generation ID as the matching key.

---

### 2. Block-by-Block Analysis

#### 1.1 Webhook Reception

- **Overview:**  
  This block receives the webhook POST request from Luma AI once the video generation process is finished. It acts as the entry point to the workflow.

- **Nodes Involved:**  
  - Webhook

- **Node Details:**

  - **Webhook**  
    - Type: Webhook Trigger  
    - Role: Listens for incoming HTTP POST requests at the path `/luma-ai-response`.  
    - Configuration: HTTP Method set to POST; no additional options enabled.  
    - Key Expressions: None (raw webhook payload received).  
    - Input: External HTTP POST from Luma AI callback.  
    - Output: Passes the entire JSON payload downstream.  
    - Version: 2  
    - Edge Cases:  
      - Missing or malformed webhook payload.  
      - Incorrect webhook URL or HTTP method mismatch.  
      - Network or authentication issues on Luma AI side.  
    - Notes: Sticky Note reminds to ensure this webhook URL matches the one configured in Part 1 of the series.

#### 1.2 Data Extraction and Validation

- **Overview:**  
  Extracts video-related data fields from the webhook JSON and validates that a video URL exists before proceeding.

- **Nodes Involved:**  
  - Video JSON (Set)  
  - If

- **Node Details:**

  - **Video JSON**  
    - Type: Set  
    - Role: Extracts and assigns key fields from the webhook JSON into named variables for easier reference downstream.  
    - Configuration:  
      - Assigns `video_json` as the entire JSON payload string.  
      - Extracts `luma_video` from `body.assets.video` (video URL).  
      - Extracts `luma_thumb` from `body.assets.image` (thumbnail URL).  
      - Extracts `gen_id` from `id` (generation ID).  
      - Includes all other fields from the original JSON.  
    - Key Expressions:  
      - `={{ $json }}` for full JSON string.  
      - `={{ $json.body.assets.video }}`, `={{ $json.body.assets.image }}`, `={{ $json.id }}` for specific fields.  
    - Input: Webhook node output.  
    - Output: JSON enriched with extracted fields.  
    - Version: 3.4  
    - Edge Cases:  
      - Missing or null fields in the webhook JSON (e.g., no video URL).  
      - Unexpected JSON structure changes from Luma AI.  

  - **If**  
    - Type: If (Conditional)  
    - Role: Checks if the extracted video URL is not empty to decide whether to continue processing.  
    - Configuration:  
      - Condition: `video URL` from `Video JSON` node is not empty.  
      - Uses strict type validation and case sensitivity.  
    - Key Expressions:  
      - `={{ $('Video JSON').first().json.body.assets.video }}`  
    - Input: Output from Video JSON node.  
    - Output:  
      - True branch: proceeds to update Airtable.  
      - False branch: stops workflow (no video URL to process).  
    - Version: 2.2  
    - Edge Cases:  
      - Video URL missing or empty string causing false branch execution.  
      - Expression evaluation errors if JSON path changes.

#### 1.3 Airtable Update

- **Overview:**  
  Updates the Airtable record corresponding to the video generation ID with the video URL, thumbnail URL, and sets the status to "Done".

- **Nodes Involved:**  
  - Global SETTINGS (Set)  
  - ADD Video and Thumbnail URL (Airtable)  
  - Execution Data

- **Node Details:**

  - **Global SETTINGS**  
    - Type: Set  
    - Role: Defines global variables for Airtable base and table IDs used in the update operation.  
    - Configuration:  
      - `airtable_base` set to `"appvk87mtcwRve5p5"`  
      - `airtable_table_generated_videos` set to `"tblOzRFWgcsfttRWK"`  
      - `airtable_table_article_writer` set to `"tblVTpv8JG5lZRiF2"` (not used in this workflow)  
    - Input: True branch from If node.  
    - Output: JSON with these global settings.  
    - Version: 3.4  
    - Edge Cases:  
      - Incorrect base or table IDs causing Airtable update failures.  

  - **ADD Video and Thumbnail URL**  
    - Type: Airtable  
    - Role: Updates the Airtable record matching the generation ID with new video data and status.  
    - Configuration:  
      - Base and Table IDs taken from `Global SETTINGS` node variables.  
      - Operation: Update record.  
      - Matching Column: `Generation ID` (used to find the correct record).  
      - Fields updated:  
        - `Status` set to `"Done"`  
        - `Thumb URL` set to thumbnail URL from webhook data  
        - `Video URL` set to video URL from webhook data  
        - `Generation ID` included for matching  
      - Mapping mode: Define below (explicit field mapping).  
      - Credentials: Airtable Personal Access Token (named "AlexK Airtable Personal Access Token account").  
    - Key Expressions:  
      - `={{ $('If').first().json.body.assets.image }}` for thumbnail URL  
      - `={{ $('If').first().json.body.assets.video }}` for video URL  
      - `={{ $('If').first().json.body.id }}` for generation ID  
    - Input: Output from Global SETTINGS node.  
    - Output: Airtable update response.  
    - Version: 2.1  
    - Edge Cases:  
      - Authentication errors with Airtable API token.  
      - Record not found for given generation ID.  
      - API rate limits or network issues.  

  - **Execution Data**  
    - Type: Execution Data  
    - Role: Outputs the final execution data for inspection or logging.  
    - Configuration: Default (no parameters).  
    - Input: Output from Airtable update node.  
    - Output: Final workflow output.  
    - Version: 1  
    - Edge Cases: None.

---

### 3. Summary Table

| Node Name                 | Node Type          | Functional Role                          | Input Node(s)          | Output Node(s)                | Sticky Note                                                                                  |
|---------------------------|--------------------|----------------------------------------|-----------------------|------------------------------|----------------------------------------------------------------------------------------------|
| Webhook                   | Webhook Trigger    | Receives POST callback from Luma AI   | External HTTP POST    | Video JSON                   | ## Make sure this URL for the Webhook matches that in Part 1 of this series                  |
| Video JSON                | Set                | Extracts video and thumbnail URLs      | Webhook               | If                           |                                                                                              |
| If                        | If                 | Checks if video URL is present          | Video JSON            | Global SETTINGS (true branch) |                                                                                              |
| Sticky Note1              | Sticky Note        | Reminder to define SETTINGS             | None                  | None                         | ## Define your SETTINGS here                                                                 |
| Global SETTINGS           | Set                | Defines Airtable base and table IDs     | If (true branch)      | ADD Video and Thumbnail URL  |                                                                                              |
| ADD Video and Thumbnail URL | Airtable           | Updates Airtable record with video data | Global SETTINGS       | Execution Data               |                                                                                              |
| Execution Data            | Execution Data     | Outputs final execution data             | ADD Video and Thumbnail URL | None                     |                                                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Type: Webhook  
   - Name: `Webhook`  
   - HTTP Method: POST  
   - Path: `luma-ai-response`  
   - Purpose: Receive POST callback from Luma AI after video generation completes.

2. **Create Set Node to Extract Video Data**  
   - Type: Set  
   - Name: `Video JSON`  
   - Assignments:  
     - `video_json` = entire JSON payload (`={{ $json }}`)  
     - `luma_video` = video URL (`={{ $json.body.assets.video }}`)  
     - `luma_thumb` = thumbnail URL (`={{ $json.body.assets.image }}`)  
     - `gen_id` = generation ID (`={{ $json.id }}`)  
   - Include other fields from the webhook JSON.  
   - Connect output of `Webhook` to input of `Video JSON`.

3. **Create If Node to Validate Video URL**  
   - Type: If  
   - Name: `If`  
   - Condition: Check if `video URL` is not empty  
     - Expression: `={{ $('Video JSON').first().json.body.assets.video }}`  
     - Operator: Not Empty  
   - Connect output of `Video JSON` to input of `If`.

4. **Create Set Node for Global Settings**  
   - Type: Set  
   - Name: `Global SETTINGS`  
   - Assignments:  
     - `airtable_base` = `"appvk87mtcwRve5p5"` (your Airtable base ID)  
     - `airtable_table_generated_videos` = `"tblOzRFWgcsfttRWK"` (your Airtable table ID for videos)  
     - `airtable_table_article_writer` = `"tblVTpv8JG5lZRiF2"` (optional, not used here)  
   - Connect the **true** output of `If` node to input of `Global SETTINGS`.

5. **Create Airtable Node to Update Video Record**  
   - Type: Airtable  
   - Name: `ADD Video and Thumbnail URL`  
   - Credentials: Use your Airtable Personal Access Token credentials.  
   - Base: Use expression `={{ $json.airtable_base }}` from `Global SETTINGS`.  
   - Table: Use expression `={{ $json.airtable_table_generated_videos }}` from `Global SETTINGS`.  
   - Operation: Update  
   - Matching Column: `Generation ID`  
   - Fields to update:  
     - `Status` = `"Done"`  
     - `Thumb URL` = `={{ $('If').first().json.body.assets.image }}`  
     - `Video URL` = `={{ $('If').first().json.body.assets.video }}`  
     - `Generation ID` = `={{ $('If').first().json.body.id }}`  
   - Connect output of `Global SETTINGS` to input of this Airtable node.

6. **Create Execution Data Node**  
   - Type: Execution Data  
   - Name: `Execution Data`  
   - Connect output of Airtable node to input of this node.  
   - Purpose: To output the final data for logging or debugging.

7. **Add Sticky Notes (Optional)**  
   - Add a sticky note near the `Webhook` node:  
     - Content: "## Make sure this URL for the Webhook matches that in Part 1 of this series"  
   - Add a sticky note near the `Global SETTINGS` node:  
     - Content: "## Define your SETTINGS here"

---

### 5. General Notes & Resources

| Note Content                                                                                         | Context or Link                                                                                      |
|----------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Airtable Base Template simplifies setup with required fields: Generation ID, Status, Video URL, Thumbnail URL | https://airtable.com/invite/l?inviteId=invOr5AApOnDOtkhi&inviteToken=72a165d2df1c9a1c82a6144effc626f88ad501e9eaab10a1c2f279c3d7a6faff |
| Tutorial Video explaining the full automation process                                               | https://youtu.be/yFCZYGHM9d8                                                                        |
| Workflow is Part 2 of a series; Part 1 initiates video generation and must be configured to call this webhook | Ensure webhook URL matches Part 1 configuration                                                     |
| Future enhancements planned: post-processing, video trimming, multi-platform publishing            |                                                                                                    |

---

This document provides a complete, detailed reference for understanding, reproducing, and maintaining the "Automate Video Creation with Luma AI Dream Machine and Airtable (Part 2)" workflow. It covers all nodes, logic, and integration points to ensure robust operation and easy extensibility.