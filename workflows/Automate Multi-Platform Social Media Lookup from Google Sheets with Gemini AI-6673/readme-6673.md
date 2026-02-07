Automate Multi-Platform Social Media Lookup from Google Sheets with Gemini AI

https://n8nworkflows.xyz/workflows/automate-multi-platform-social-media-lookup-from-google-sheets-with-gemini-ai-6673


# Automate Multi-Platform Social Media Lookup from Google Sheets with Gemini AI

### 1. Workflow Overview

This workflow automates the discovery and recording of social media profile links for contacts listed in a Google Sheet. It targets users who maintain contact lists and wish to enrich them with verified social media URLs across multiple platforms, using AI-assisted research.

**Logical Blocks:**

- **1.1 Scheduled Trigger & Data Input**: Periodically initiates the workflow and retrieves contact data from a Google Sheet.
- **1.2 Data Filtering & Limiting**: Filters out already processed contacts and limits processing to one contact per run.
- **1.3 AI-Powered Social Media Lookup (Subworkflow Invocation)**: Sends contact data to a dedicated research subworkflow that uses AI to find social media profiles across 18+ platforms.
- **1.4 Response Structuring & Validation**: Applies a strict JSON schema to normalize and validate AI results.
- **1.5 Update Google Sheet**: Writes the validated social media profile URLs back to the original Google Sheet and marks the contact as analyzed.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger & Data Input

- **Overview:**  
  This block triggers the workflow on a recurring schedule and fetches all contacts from a designated Google Sheet.

- **Nodes Involved:**  
  - Schedule Trigger  
  - Get All Contacts

- **Node Details:**

  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Role: Initiates workflow execution automatically at set intervals (every minute).  
    - Configuration: Interval set to trigger every 1 minute.  
    - Inputs: None (trigger node).  
    - Outputs: Triggers "Get All Contacts".  
    - Edge Cases: If n8n is down or overloaded, scheduled triggers might miss runs.

  - **Get All Contacts**  
    - Type: Google Sheets Read  
    - Role: Retrieves all rows from the configured Google Sheet containing the contact list.  
    - Configuration: Reads from the spreadsheet with ID `1nZ8a7MCU-Ku99cRsBkyer-zUPUb-QcMBzovzU3E-IH4`, sheet with gid=0 (Sheet1). Uses OAuth2 credentials `sam@openpaws.ai Google Sheets`.  
    - Key Expressions: None.  
    - Inputs: Trigger from Schedule Trigger.  
    - Outputs: Sends contact rows to filter node.  
    - Edge Cases: Google API rate limits or auth expiration may cause failures. Retry enabled with 5 seconds delay.

#### 1.2 Data Filtering & Limiting

- **Overview:**  
  Filters contacts to include only those not processed yet (`Analysed?` = false), then limits processing to a single contact per workflow run.

- **Nodes Involved:**  
  - Filter Out Processed Contacts  
  - Limit to 1

- **Node Details:**

  - **Filter Out Processed Contacts**  
    - Type: Filter  
    - Role: Selects only contacts whose `Analysed?` field is false (unprocessed).  
    - Configuration: Condition checks if `Analysed?` equals false boolean. Case sensitive, loose type validation enabled.  
    - Inputs: From "Get All Contacts".  
    - Outputs: Passes filtered contacts to "Limit to 1".  
    - Edge Cases: If the `Analysed?` column contains unexpected values or is missing, the filter might misbehave.

  - **Limit to 1**  
    - Type: Limit  
    - Role: Restricts output to only one contact per execution to avoid heavy loads or API limits.  
    - Configuration: Default limit of 1.  
    - Inputs: From Filter.  
    - Outputs: Sends single contact data to subworkflow invocation.  
    - Edge Cases: If no unprocessed contacts remain, no data flows forward.

#### 1.3 AI-Powered Social Media Lookup (Subworkflow Invocation)

- **Overview:**  
  Calls a reusable subworkflow (General Research Agent) that performs AI-based multi-platform social media profile search.

- **Nodes Involved:**  
  - Find Social Media Links  
  - OpenRouter Chat Model (used inside subworkflow, linked here for context)

- **Node Details:**

  - **Find Social Media Links**  
    - Type: Execute Workflow (Subworkflow)  
    - Role: Delegates contact research task to an external reusable workflow designed for multi-platform social media lookup.  
    - Configuration: Calls workflow with ID `k053fXGjIF7dUIQZ`, passing the contact JSON as `chatInput`. `sessionId` is randomly generated for uniqueness.  
    - Inputs: Single contact JSON object.  
    - Outputs: Receives raw AI-generated social media profile data as a JSON string under `output`.  
    - Edge Cases: Subworkflow failures, timeouts, or invalid responses can interrupt processing.

  - **OpenRouter Chat Model** (Referenced in Block 1.4)  
    - Type: Language Model Chat (OpenRouter)  
    - Role: AI engine powering the social media profile search inside the subworkflow. Uses Google Gemini 2.5-flash model.  
    - Configuration: Uses OpenRouter credentials named "OpenRouter account".  
    - Edge Cases: API rate limits, auth errors, model downtime.

#### 1.4 Response Structuring & Validation

- **Overview:**  
  Extracts and validates the AI response according to a strict JSON schema ensuring all expected social media platform URLs are present and well-formed.

- **Nodes Involved:**  
  - Structure Response

- **Node Details:**

  - **Structure Response**  
    - Type: Information Extractor (Langchain)  
    - Role: Parses the raw AI output string and transforms it into a validated JSON object with predefined keys for 18+ social media platforms.  
    - Configuration: Uses a manual JSON schema enforcing presence of all platform keys with values either URLs or `null`.  
    - Key Expressions: Extracts from `$json.output`.  
    - Inputs: Raw AI output from "Find Social Media Links".  
    - Outputs: Clean, validated JSON object sent to Google Sheets update node.  
    - Edge Cases: Malformed AI responses, schema validation failures, missing fields. Prevents invalid data from updating the sheet.

#### 1.5 Update Google Sheet

- **Overview:**  
  Updates the original Google Sheet row with the structured social media profile URLs and marks the contact as processed.

- **Nodes Involved:**  
  - Update Contact

- **Node Details:**

  - **Update Contact**  
    - Type: Google Sheets Update  
    - Role: Writes back all social media profile URLs, including `null` where appropriate, into the corresponding columns of the contact's row. Marks `Analysed?` as true by virtue of processing.  
    - Configuration:  
      - Document ID and Sheet as in "Get All Contacts".  
      - Matches row to update using `row_number` from the "Limit to 1" node.  
      - Maps each social media platform key from structured JSON to corresponding sheet columns.  
      - Uses OAuth2 Google Sheets credentials `sam@openpaws.ai Google Sheets`.  
    - Inputs: Validated social media profile JSON and row number.  
    - Outputs: None (final step).  
    - Edge Cases: Google API failures, incorrect row numbers, concurrency issues if multiple workflows update simultaneously.

---

### 3. Summary Table

| Node Name                 | Node Type                         | Functional Role                          | Input Node(s)               | Output Node(s)              | Sticky Note                                                                 |
|---------------------------|----------------------------------|----------------------------------------|-----------------------------|-----------------------------|---------------------------------------------------------------------------|
| Schedule Trigger          | Schedule Trigger                  | Triggers workflow periodically         | None                        | Get All Contacts             |                                                                           |
| Get All Contacts          | Google Sheets                    | Reads all contacts from Google Sheet   | Schedule Trigger            | Filter Out Processed Contacts |                                                                           |
| Filter Out Processed Contacts | Filter                           | Filters unprocessed contacts only      | Get All Contacts            | Limit to 1                  |                                                                           |
| Limit to 1                | Limit                           | Limits processing to one contact        | Filter Out Processed Contacts | Find Social Media Links      |                                                                           |
| Find Social Media Links   | Execute Workflow (Subworkflow)   | Calls AI research subworkflow           | Limit to 1                  | Structure Response          | Calls reusable agent: https://n8n.io/workflows/5588-multi-tool-research-agent-for-animal-advocacy-with-openrouter-serper-and-open-paws-db/ |
| OpenRouter Chat Model     | Language Model Chat (OpenRouter) | AI model used inside subworkflow        | - (used internally in subworkflow) | Structure Response          |                                                                           |
| Structure Response        | Information Extractor (Langchain) | Parses and validates AI JSON response  | Find Social Media Links     | Update Contact              | Ensures valid JSON for all 18+ platforms                                  |
| Update Contact            | Google Sheets                    | Updates Google Sheet row with results  | Structure Response          | None                        | Writes social media data back and marks contact as analysed               |
| Sticky Note               | Sticky Note                     | Workflow overview explanation           | None                        | None                        | # 🧭 Workflow Overview - Explains workflow purpose and logic              |
| Sticky Note1              | Sticky Note                     | Google Sheet setup instructions         | None                        | None                        | # 📄 Google Sheet Setup Instructions - Template link and usage guide      |
| Sticky Note2              | Sticky Note                     | Subworkflow description                  | None                        | None                        | # 🧠 Subworkflow: Find Social Media Links - Details subworkflow function   |
| Sticky Note3              | Sticky Note                     | Response validation explanation          | None                        | None                        | # 🧱 Structure and Validate Response - Schema validation details          |
| Sticky Note4              | Sticky Note                     | Google Sheets update explanation         | None                        | None                        | # 📝 Google Sheets: Update Contact - Final step explanation               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Set interval to trigger every 1 minute (or your preferred frequency).

2. **Create Google Sheets Node to Read Contacts**  
   - Type: Google Sheets (Read operation)  
   - Connect from Schedule Trigger.  
   - Configure with Google Sheets OAuth2 credentials.  
   - Set Document ID to `1nZ8a7MCU-Ku99cRsBkyer-zUPUb-QcMBzovzU3E-IH4`.  
   - Set Sheet Name to `Sheet1` (gid=0).  
   - No filters; read all rows.

3. **Add Filter Node to Exclude Processed Contacts**  
   - Type: Filter  
   - Connect from "Get All Contacts".  
   - Condition: `Analysed?` field equals boolean `false`. Use loose type validation.

4. **Add Limit Node to Process One Contact Only**  
   - Type: Limit  
   - Connect from Filter.  
   - Set limit to 1.

5. **Add Execute Workflow Node to Call Subworkflow**  
   - Type: Execute Workflow  
   - Connect from Limit node.  
   - Select or create a reusable subworkflow that performs social media profile search (see note below).  
   - Pass into subworkflow input parameter `chatInput` the JSON stringified contact data.  
   - Generate a random `sessionId` string for each run (e.g., using expression `{{ (Math.random().toString(36).substring(2) + Date.now().toString(36)) }}`).

6. **Subworkflow Setup: General Research Agent**  
   - This subworkflow should use an AI chat model (OpenRouter node with Google Gemini 2.5-flash model).  
   - It should accept `chatInput` as input and produce a JSON string with social media profile URLs or nulls for 18+ platforms.  
   - Prioritize verified accounts and handle different contact types (companies, public figures, academics, etc.).  
   - You may reuse the referenced workflow with ID `k053fXGjIF7dUIQZ` from n8n community.

7. **Add Information Extractor Node to Parse AI Output**  
   - Type: Information Extractor (Langchain)  
   - Connect from subworkflow execution output.  
   - Configure with a manual JSON schema that includes all expected social media platforms as keys, each value either a URI string or null.  
   - Input expression: extract AI output string from previous node (e.g., `{{$json["output"]}}`).

8. **Add Google Sheets Node to Update Contact**  
   - Type: Google Sheets (Update operation)  
   - Connect from Information Extractor.  
   - Configure with the same Google Sheets OAuth2 credentials.  
   - Use the same Document ID and Sheet Name as in the read node.  
   - Map all social media platform fields from the structured JSON to the corresponding columns in the sheet.  
   - Use the `row_number` field from the limited contact to identify which row to update.  
   - Ensure `Analysed?` column is set to `true` (can be done implicitly by updating the row or explicitly adding `Analysed?` column with value `true`).

9. **Add Sticky Notes (Optional)**  
   - Add descriptive sticky notes to document the workflow blocks, Google Sheet template usage, subworkflow purpose, schema validation, and final update logic.

10. **Activate the Workflow**  
    - Test with a few contacts marked `Analysed? = false` in your Google Sheet.  
    - Observe periodic execution and updating of social media profiles in the sheet.

---

### 5. General Notes & Resources

| Note Content                                                                                                  | Context or Link                                                                                                            |
|---------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------|
| Template Google Sheet: Copy and use this for contact data input: https://docs.google.com/spreadsheets/d/1nZ8a7MCU-Ku99cRsBkyer-zUPUb-QcMBzovzU3E-IH4/edit?usp=sharing | Google Sheets template for contacts with preconfigured columns, including `Analysed?` flag.                                 |
| Reusable Research Agent Subworkflow: https://n8n.io/workflows/5588-multi-tool-research-agent-for-animal-advocacy-with-openrouter-serper-and-open-paws-db/ | External workflow used for AI-driven multi-platform social media profile search.                                            |
| Use Google Sheets OAuth2 credentials with sufficient permissions for reading and writing to the sheet.         | Credential setup requirement for Google Sheets nodes.                                                                       |
| AI model used: Google Gemini 2.5-flash via OpenRouter API with valid OpenRouter API credentials.               | Requires OpenRouter account with access to Gemini models.                                                                   |
| Ensure `Analysed?` column is maintained in Google Sheet to track processed contacts and avoid duplicates.      | Critical for correct filtering and process continuation.                                                                    |

---

This document fully describes the workflow's structure, logic, and configuration details. It supports reproduction, modification, and troubleshooting for advanced users and AI agents alike.

---

**Disclaimer:** The provided content originates exclusively from an automated workflow created with n8n, adhering strictly to current content policies and containing no illegal, offensive, or protected material. All data handled is legal and publicly accessible.