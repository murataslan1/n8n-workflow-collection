Automate GPT-4o Fine-Tuning with Google Sheets or Airtable Data

https://n8nworkflows.xyz/workflows/automate-gpt-4o-fine-tuning-with-google-sheets-or-airtable-data-4853


# Automate GPT-4o Fine-Tuning with Google Sheets or Airtable Data

### 1. Workflow Overview

This workflow automates the fine-tuning process of GPT-4o models using training data sourced from either Google Sheets or Airtable. It is designed for users who want to streamline the preparation, upload, and monitoring of fine-tuning jobs without manual intervention. The workflow periodically triggers, retrieves examples, converts them into the required JSONL format, uploads the fine-tuning dataset, initiates the fine-tuning job, and monitors its completion status. Upon success, it records the newly fine-tuned model details back into Google Sheets or Airtable.

**Logical Blocks:**

- **1.1 Trigger and Data Retrieval:** Automatically trigger the workflow on a schedule and fetch training examples from Google Sheets or Airtable.
- **1.2 Data Preparation:** Convert raw examples into the JSONL file format required for OpenAI fine-tuning.
- **1.3 Fine-Tuning Job Execution:** Upload the JSONL file, configure the GPT model for fine-tuning, and start the fine-tuning job.
- **1.4 Job Monitoring and Outcome Handling:** Wait for the fine-tuning process to complete, then check the job status and branch logic for success or failure.
- **1.5 Result Recording:** Save details of the fine-tuned model into Google Sheets or Airtable upon successful completion.
- **1.6 Error Handling:** Stop the workflow and log errors if the fine-tuning job fails.

---

### 2. Block-by-Block Analysis

#### 1.1 Trigger and Data Retrieval

- **Overview:**  
  This block initiates the workflow via a scheduled trigger and retrieves training data samples from Google Sheets or Airtable to be used for fine-tuning.

- **Nodes Involved:**  
  - Schedule Trigger  
  - Get Examples from Sheet (Google Sheets)  
  - Get Examples from Airtable (disabled)  

- **Node Details:**  

  - **Schedule Trigger**  
    - Type: Trigger  
    - Role: Initiates the workflow based on a predefined time schedule (example time: June 10th, 2025, 4:10:35 AM PDT)  
    - Configuration: Uses schedule trigger node configured with date, time, timezone, and recurrence details  
    - Inputs: None (trigger node)  
    - Outputs: Triggers “Get Examples from Sheet” and “Get Examples from Airtable” nodes  
    - Edge Cases: Misconfigured timezone or invalid schedule may delay or prevent triggering

  - **Get Examples from Sheet**  
    - Type: Google Sheets node  
    - Role: Reads training examples from a configured Google Sheets spreadsheet  
    - Configuration: Reads rows containing training data (prompts and completions)  
    - Inputs: Trigger from Schedule Trigger  
    - Outputs: Passes example data to “Create JSONL File”  
    - Edge Cases: Authentication errors, empty sheets, API rate limits, or data format inconsistencies

  - **Get Examples from Airtable** (Disabled)  
    - Type: Airtable node  
    - Role: Alternative source for examples from Airtable base and table (disabled by default)  
    - Configuration: Configured with Airtable API credentials and base/table IDs  
    - Inputs: Trigger from Schedule Trigger  
    - Outputs: Passes example data to “Create JSONL File”  
    - Edge Cases: Disabled, but if enabled, possible failures include API limits, auth errors, or empty datasets  

---

#### 1.2 Data Preparation

- **Overview:**  
  Converts the raw training examples retrieved from sheets or Airtable into the JSONL format required by OpenAI’s fine-tuning API.

- **Nodes Involved:**  
  - Create JSONL File  
  - Upload JSONL File  

- **Node Details:**  

  - **Create JSONL File**  
    - Type: Code node  
    - Role: Transforms input data rows into newline-delimited JSON objects following fine-tuning schema (usually objects with “prompt” and “completion” keys)  
    - Configuration: Custom JavaScript code that iterates over input items and formats them  
    - Inputs: Example data from “Get Examples from Sheet” or “Get Examples from Airtable”  
    - Outputs: JSONL file content passed to “Upload JSONL File”  
    - Edge Cases: Malformed data, missing fields, or encoding issues may cause invalid JSONL output  

  - **Upload JSONL File**  
    - Type: OpenAI node (LangChain OpenAI integration)  
    - Role: Uploads the JSONL training data file to OpenAI’s fine-tuning service  
    - Configuration: Uses OpenAI credentials, configured for file upload endpoint  
    - Inputs: JSONL content from “Create JSONL File”  
    - Outputs: OpenAI file ID used to start fine-tuning job in next block  
    - Edge Cases: API key issues, file size limits, network timeouts, invalid file format errors  

---

#### 1.3 Fine-Tuning Job Execution

- **Overview:**  
  Sets the GPT model parameters and starts the fine-tuning job using the uploaded JSONL file.

- **Nodes Involved:**  
  - Set GPT Model  
  - Begin Fine-tune Job  

- **Node Details:**  

  - **Set GPT Model**  
    - Type: Set node  
    - Role: Configures parameters for the fine-tuning job such as base model (e.g., “gpt-4o”), training file ID, hyperparameters  
    - Configuration: Sets data fields required by the fine-tuning API  
    - Inputs: File ID from “Upload JSONL File”  
    - Outputs: Prepared request body for starting fine-tune job  
    - Edge Cases: Incorrect model names or missing parameters may cause job start failure  

  - **Begin Fine-tune Job**  
    - Type: HTTP Request node  
    - Role: Calls OpenAI API endpoint to initiate fine-tuning with configured parameters  
    - Configuration: POST request to OpenAI fine-tune endpoint with model and training file data  
    - Inputs: Parameters from “Set GPT Model”  
    - Outputs: Job ID and initial status data  
    - Edge Cases: Authentication failure, API downtime, invalid request body, rate limiting  

---

#### 1.4 Job Monitoring and Outcome Handling

- **Overview:**  
  Waits for a defined delay, then checks the status of the fine-tuning job repeatedly until completion or failure, branching accordingly.

- **Nodes Involved:**  
  - Wait  
  - Check Fine-Tune Job  
  - If Succeeded  
  - If Failed  
  - Error: FAILED  

- **Node Details:**  

  - **Wait**  
    - Type: Wait node  
    - Role: Pauses workflow execution for a fixed interval before polling job status  
    - Configuration: Default or custom delay to allow job processing time  
    - Inputs: Response from “Begin Fine-tune Job”  
    - Outputs: Triggers “Check Fine-Tune Job”  
    - Edge Cases: Too short delay may cause premature polling, too long delays may slow workflow  

  - **Check Fine-Tune Job**  
    - Type: HTTP Request node  
    - Role: Queries OpenAI fine-tune job status endpoint using job ID  
    - Configuration: GET request with job ID parameter  
    - Inputs: From “Wait” node  
    - Outputs: Job status JSON passed to “If Succeeded”  
    - Edge Cases: Network errors, invalid job ID, API errors  

  - **If Succeeded**  
    - Type: If node  
    - Role: Checks if job status indicates success  
    - Configuration: Expression that tests job status field in response for “succeeded”  
    - Inputs: Job status from “Check Fine-Tune Job”  
    - Outputs:  
      - True branch: proceeds to save fine-tuned model info  
      - False branch: triggers “If Failed” node  
    - Edge Cases: Incorrect parsing, timing issues if job status not updated yet  

  - **If Failed**  
    - Type: If node  
    - Role: Detects failed job status to trigger error handling or wait for retry  
    - Configuration: Checks for “failed” status or error fields  
    - Inputs: From “If Succeeded” false branch  
    - Outputs:  
      - True branch: “Error: FAILED” node to stop workflow  
      - False branch: loops back to “Wait” node to poll again  
    - Edge Cases: Infinite loops if status stuck, failure to catch other error states  

  - **Error: FAILED**  
    - Type: Stop and Error node  
    - Role: Terminates the workflow with error status on job failure  
    - Configuration: Default error stop  
    - Inputs: From “If Failed” true branch  
    - Outputs: None (stops workflow)  
    - Edge Cases: None  

---

#### 1.5 Result Recording

- **Overview:**  
  After successful fine-tuning, records the new fine-tuned model information into Google Sheets or Airtable for tracking.

- **Nodes Involved:**  
  - Add Fine-Tuned Model to Airtable (disabled)  
  - Add Fine-Tuned Model to Sheet (Google Sheets)  

- **Node Details:**  

  - **Add Fine-Tuned Model to Airtable** (Disabled)  
    - Type: Airtable node  
    - Role: Inserts or updates fine-tuned model metadata into Airtable base/table  
    - Configuration: Airtable API credentials and table setup  
    - Inputs: From “If Succeeded” true branch  
    - Outputs: None  
    - Edge Cases: Disabled. If enabled, watch for auth errors, write conflicts  

  - **Add Fine-Tuned Model to Sheet**  
    - Type: Google Sheets node  
    - Role: Appends or updates fine-tuned model info (model name, job ID, status, timestamps) in a Google Sheet  
    - Configuration: Google Sheets API credentials, target spreadsheet and worksheet  
    - Inputs: From “If Succeeded” true branch  
    - Outputs: None  
    - Edge Cases: Auth failures, sheet write errors, quota exceeded  

---

#### 1.6 Ancillary Nodes

- **Sticky Note Nodes**  
  - Used for documenting or annotating the workflow visually inside n8n editor. They contain no operational logic or parameters relevant to workflow execution.  
  - Present at several points in the workflow for organizational or explanatory purposes.  

---

### 3. Summary Table

| Node Name                      | Node Type            | Functional Role                         | Input Node(s)                 | Output Node(s)                      | Sticky Note                                                                                                                                      |
|-------------------------------|----------------------|---------------------------------------|------------------------------|-----------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------|
| Schedule Trigger               | Schedule Trigger     | Initiates workflow on schedule        | None                         | Get Examples from Sheet, Get Examples from Airtable |                                                                                                                                                  |
| Get Examples from Sheet        | Google Sheets        | Reads training data from Google Sheet | Schedule Trigger             | Create JSONL File                  |                                                                                                                                                  |
| Get Examples from Airtable     | Airtable (disabled)  | Reads training data from Airtable     | Schedule Trigger             | Create JSONL File                  |                                                                                                                                                  |
| Create JSONL File             | Code                 | Converts examples to JSONL format      | Get Examples from Sheet, Get Examples from Airtable | Upload JSONL File                  |                                                                                                                                                  |
| Upload JSONL File              | OpenAI (LangChain)   | Uploads JSONL file to OpenAI           | Create JSONL File            | Set GPT Model                     |                                                                                                                                                  |
| Set GPT Model                 | Set                  | Sets fine-tuning parameters            | Upload JSONL File            | Begin Fine-tune Job               |                                                                                                                                                  |
| Begin Fine-tune Job           | HTTP Request         | Starts OpenAI fine-tuning job          | Set GPT Model                | Wait                            |                                                                                                                                                  |
| Wait                         | Wait                 | Delays for job processing              | Begin Fine-tune Job, If Failed (false branch) | Check Fine-Tune Job              |                                                                                                                                                  |
| Check Fine-Tune Job           | HTTP Request         | Polls fine-tuning job status           | Wait                        | If Succeeded                    |                                                                                                                                                  |
| If Succeeded                 | If                   | Branches on job success status         | Check Fine-Tune Job          | Add Fine-Tuned Model to Airtable, Add Fine-Tuned Model to Sheet, If Failed |                                                                                                                                                  |
| If Failed                   | If                   | Branches on job failure status         | If Succeeded (false branch)  | Error: FAILED, Wait               |                                                                                                                                                  |
| Error: FAILED                | Stop and Error       | Stops workflow on failure               | If Failed (true branch)      | None                            |                                                                                                                                                  |
| Add Fine-Tuned Model to Airtable | Airtable (disabled) | Saves fine-tuned model data to Airtable | If Succeeded (true branch)   | None                            | Disabled by default                                                                                                                              |
| Add Fine-Tuned Model to Sheet | Google Sheets        | Saves fine-tuned model data to Google Sheet | If Succeeded (true branch)   | None                            |                                                                                                                                                  |
| Sticky Note                  | Sticky Note          | Visual annotation                      | None                         | None                            | Present at various workflow locations for documentation purposes                                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node:**  
   - Type: Schedule Trigger  
   - Configure to run at desired time (e.g., 4:10:35 AM PDT on June 10, 2025)  
   - No credentials needed  

2. **Create Data Retrieval Nodes:**  
   - **Google Sheets Node:**  
     - Type: Google Sheets  
     - Configure to read rows from the spreadsheet containing fine-tuning examples  
     - Authenticate with Google OAuth2 credentials  
   - **(Optional) Airtable Node:**  
     - Type: Airtable  
     - Configure with Airtable API key, base ID, and table name for fine-tuning examples  
     - Disabled by default  

3. **Connect Schedule Trigger Outputs:**  
   - Connect Schedule Trigger’s main output to both “Get Examples from Sheet” and “Get Examples from Airtable” nodes  

4. **Create Code Node to Generate JSONL:**  
   - Type: Code node  
   - Use JavaScript to map input data rows into JSONL format with “prompt” and “completion” fields per line  
   - Input comes from both data retrieval nodes (set up multiple inputs or merge)  
   - Output JSONL string ready for upload  

5. **Create OpenAI File Upload Node:**  
   - Type: OpenAI (LangChain OpenAI)  
   - Configure to upload a file to OpenAI’s file API endpoint  
   - Use OpenAI API credentials  
   - Input JSONL content from Code node  

6. **Create Set Node to Prepare Fine-Tuning Parameters:**  
   - Type: Set node  
   - Set parameters such as:  
     - model: base model name (e.g., “gpt-4o”)  
     - training_file: file ID from upload node  
     - any hyperparameters (learning rate, epochs) as needed  

7. **Create HTTP Request Node to Begin Fine-Tune Job:**  
   - Type: HTTP Request  
   - Method: POST  
   - Endpoint: OpenAI fine-tune creation API  
   - Body: JSON from Set node  
   - Auth: Use OpenAI credentials  
   - Output: job ID and status  

8. **Create Wait Node:**  
   - Type: Wait  
   - Configure delay (e.g., 1-5 minutes) before polling job status  

9. **Create HTTP Request Node to Check Fine-Tune Job Status:**  
   - Type: HTTP Request  
   - Method: GET  
   - Endpoint: OpenAI fine-tune job status API with job ID parameter  
   - Auth: OpenAI credentials  

10. **Create If Node to Detect Success:**  
    - Type: If  
    - Condition: Check if job status equals “succeeded”  

11. **Create If Node to Detect Failure:**  
    - Type: If  
    - Condition: Check if job status equals “failed” or error flag is set  

12. **Create Stop and Error Node:**  
    - Type: Stop and Error node  
    - Triggered when job fails  

13. **Create Result Recording Nodes:**  
    - **Google Sheets Node:**  
      - Append new row with fine-tuned model info (model name, job ID, status)  
      - Use Google OAuth2 credentials  
    - **(Optional) Airtable Node:**  
      - Insert record in Airtable base/table (disabled by default)  

14. **Connect Nodes Following Workflow Logic:**  
    - Connect “Begin Fine-tune Job” → “Wait” → “Check Fine-Tune Job” → “If Succeeded”  
    - From “If Succeeded” true branch → result recording nodes  
    - From false branch → “If Failed”  
    - “If Failed” true branch → “Error: FAILED”  
    - “If Failed” false branch → loop back to “Wait” for polling  

15. **Add Sticky Notes as Needed:**  
    - For documentation and organization inside n8n editor  

---

### 5. General Notes & Resources

| Note Content                                                                                                             | Context or Link                                  |
|--------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------|
| Workflow automates GPT-4o fine-tuning using data from Google Sheets or Airtable.                                          | Workflow purpose                                |
| Airtable nodes are disabled by default but can be enabled for Airtable-based workflows.                                   | Node configuration                              |
| Be aware of OpenAI API rate limits and file size restrictions when uploading JSONL files.                                | OpenAI API usage constraints                     |
| Schedule trigger timezone is set to America/Los_Angeles (UTC-07:00). Adjust if needed.                                    | Scheduling configuration                         |
| Use valid OAuth2 credentials for Google Sheets and API keys for Airtable.                                                | Credential requirements                          |
| Monitor workflow execution logs for error details in case of failures such as authentication errors or API timeouts.    | Troubleshooting                                  |
| Refer to OpenAI fine-tuning API documentation for up-to-date parameter options and limits: https://platform.openai.com/docs/guides/fine-tuning | Official OpenAI documentation                    |

---

**Disclaimer:** The provided text is derived exclusively from an automated workflow created with n8n, a no-code automation tool. The processing strictly respects content policies and contains no illegal, offensive, or protected elements. All handled data are legal and public.