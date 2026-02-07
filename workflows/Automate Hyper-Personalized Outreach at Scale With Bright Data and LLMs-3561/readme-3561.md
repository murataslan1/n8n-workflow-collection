Automate Hyper-Personalized Outreach at Scale With Bright Data and LLMs

https://n8nworkflows.xyz/workflows/automate-hyper-personalized-outreach-at-scale-with-bright-data-and-llms-3561


# Automate Hyper-Personalized Outreach at Scale With Bright Data and LLMs

### 1. Workflow Overview

This workflow automates hyper-personalized outreach at scale by enriching LinkedIn profile data and generating AI-powered ice breakers. It is designed for SDRs, growth marketers, and founders who want to scale personalized outreach efficiently without manual research.

The workflow integrates Google Sheets, Bright Data’s Dataset API, and Anthropic Claude (LLM) to:

- Read LinkedIn URLs from a Google Sheet.
- Enrich profile data via Bright Data’s API.
- Poll for snapshot readiness.
- Update the Google Sheet with enriched profile details.
- Generate personalized ice breakers using Claude AI based on enriched data.
- Write the ice breakers back to the Google Sheet.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Triggering and reading input data from Google Sheets.
- **1.2 Input Preparation and Looping:** Formatting input and batching for API calls.
- **1.3 Bright Data Enrichment:** Sending LinkedIn URLs to Bright Data, polling for snapshot completion, and retrieving enriched data.
- **1.4 Google Sheets Update with Profile Data:** Writing enriched profile data back to the sheet.
- **1.5 Ice Breaker Generation:** Using Claude AI to generate personalized ice breakers.
- **1.6 Google Sheets Update with Ice Breaker:** Writing the generated ice breaker back to the sheet.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

**Overview:**  
This block triggers the workflow manually or on a schedule and reads rows from a Google Sheet containing LinkedIn URLs and row numbers.

**Nodes Involved:**  
- When clicking "Test workflow" (Manual Trigger)  
- Run Workflow on a certain Schedule (Schedule Trigger)  
- Get rows to enrich (Google Sheets)

**Node Details:**

- **When clicking "Test workflow"**  
  - Type: Manual Trigger  
  - Role: Entry point for manual execution.  
  - Configuration: Default manual trigger with no parameters.  
  - Inputs: None  
  - Outputs: Triggers next node to fetch rows.  
  - Edge cases: None specific; manual trigger requires user action.

- **Run Workflow on a certain Schedule**  
  - Type: Schedule Trigger  
  - Role: Entry point for automated scheduled runs.  
  - Configuration: Default interval (can be customized).  
  - Inputs: None  
  - Outputs: Triggers next node to fetch rows.  
  - Edge cases: Scheduling misconfiguration may cause missed runs.

- **Get rows to enrich**  
  - Type: Google Sheets  
  - Role: Reads rows from a specified Google Sheet tab.  
  - Configuration:  
    - Document ID and Sheet Name set to the user’s Google Sheet containing LinkedIn URLs and row numbers.  
    - Uses Google Sheets OAuth2 credentials.  
  - Inputs: Trigger node outputs.  
  - Outputs: JSON array of rows with at least `Linkedin_URL_Person` and `row_number`.  
  - Edge cases:  
    - Empty or missing rows cause no processing.  
    - OAuth token expiration or permission errors.  
  - Version-specific: Uses Google Sheets node version 4.3.

---

#### 2.2 Input Preparation and Looping

**Overview:**  
Formats each row for API consumption and splits the input into batches for sequential processing.

**Nodes Involved:**  
- Adjust_input_for_loop (Set)  
- Loop Over Items- All Prospects (SplitInBatches)

**Node Details:**

- **Adjust_input_for_loop**  
  - Type: Set  
  - Role: Extracts and formats the LinkedIn URL and row number into variables for downstream use.  
  - Configuration:  
    - Assigns `person_input` = `Linkedin_URL_Person` from input JSON.  
    - Assigns `row_number` = `row_number` from input JSON.  
  - Inputs: Output from "Get rows to enrich".  
  - Outputs: Single JSON object per row with formatted fields.  
  - Edge cases: Missing or malformed LinkedIn URLs may cause API errors downstream.

- **Loop Over Items- All Prospects**  
  - Type: SplitInBatches  
  - Role: Processes input rows one by one or in batches to avoid API rate limits and manage flow control.  
  - Configuration: Default batch size (usually 1).  
  - Inputs: Output from "Adjust_input_for_loop".  
  - Outputs: Each batch triggers the Bright Data API call.  
  - Edge cases: Large batch sizes may cause API throttling or timeouts.

---

#### 2.3 Bright Data Enrichment

**Overview:**  
Sends LinkedIn URLs to Bright Data’s Dataset API to trigger data enrichment, polls for snapshot readiness, and retrieves enriched profile data.

**Nodes Involved:**  
- HTTP_Request_Post_Request_BrightData (HTTP Request - POST)  
- Wait_For_API_Call_Results (Wait)  
- API_Call_Snapshot_Progress (HTTP Request - GET)  
- IF-Checking_Status_API_Call (If)  
- BrightData_Get_Linkedin (HTTP Request - GET)

**Node Details:**

- **HTTP_Request_Post_Request_BrightData**  
  - Type: HTTP Request (POST)  
  - Role: Sends LinkedIn URL to Bright Data Dataset API to trigger snapshot creation.  
  - Configuration:  
    - URL: `https://api.brightdata.com/datasets/v3/trigger`  
    - Method: POST  
    - Query Parameters: `dataset_id` set to user’s Bright Data dataset ID, `include_errors=true`  
    - Body: JSON array with `url` set to `person_input`  
    - Headers: Authorization with Bearer token for Bright Data API key  
  - Inputs: Each batch item from "Loop Over Items- All Prospects".  
  - Outputs: Snapshot ID for polling.  
  - Edge cases:  
    - API key invalid or expired causes auth errors.  
    - Invalid URL format causes API errors.  
    - Rate limits may cause 429 errors.

- **Wait_For_API_Call_Results**  
  - Type: Wait  
  - Role: Pauses workflow for 10 seconds between polling attempts to avoid rate limits.  
  - Configuration: Wait time set to 10 seconds.  
  - Inputs: After POST request triggers snapshot.  
  - Outputs: Triggers polling request.  
  - Edge cases: Excessive waiting may slow workflow; insufficient waiting may cause premature polling.

- **API_Call_Snapshot_Progress**  
  - Type: HTTP Request (GET)  
  - Role: Polls Bright Data API for snapshot progress status.  
  - Configuration:  
    - URL: `https://api.brightdata.com/datasets/v3/progress/{{ $json.snapshot_id }}`  
    - Headers: Authorization with Bright Data API key  
  - Inputs: After wait node.  
  - Outputs: JSON with snapshot status (`running`, `completed`, etc.).  
  - Edge cases: API errors, snapshot not found, or timeout.

- **IF-Checking_Status_API_Call**  
  - Type: If  
  - Role: Checks if snapshot status is still `running`.  
  - Configuration: Condition: `$json.status == "running"`  
  - Inputs: Snapshot progress JSON.  
  - Outputs:  
    - True branch: loops back to Wait node to poll again.  
    - False branch: proceeds to fetch snapshot data.  
  - Edge cases: Infinite loops prevented by n8n retry limits; snapshot failure states not explicitly handled.

- **BrightData_Get_Linkedin**  
  - Type: HTTP Request (GET)  
  - Role: Retrieves enriched LinkedIn profile data once snapshot is ready.  
  - Configuration:  
    - URL: `https://api.brightdata.com/datasets/v3/snapshot/{{ $json.snapshot_id }}`  
    - Query Parameter: `format=json`  
    - Headers: Authorization with Bright Data API key  
  - Inputs: After snapshot status is not running.  
  - Outputs: JSON with enriched profile fields: name, city, current company, about, recent posts, country code, etc.  
  - Edge cases: Snapshot data may be incomplete or missing fields; API errors.

---

#### 2.4 Google Sheets Update with Profile Data

**Overview:**  
Updates the original Google Sheet row with the enriched profile data from Bright Data.

**Nodes Involved:**  
- Google Sheets - Update Row with data From API

**Node Details:**

- **Google Sheets - Update Row with data From API**  
  - Type: Google Sheets  
  - Role: Updates the row identified by `row_number` with enriched profile data.  
  - Configuration:  
    - Document ID and Sheet Name same as input sheet.  
    - Operation: Update row by matching `row_number`.  
    - Columns updated: name, city, about, country_code, current_company.name, Linkedin_URL_Person, etc.  
    - Credentials: Google Sheets OAuth2.  
  - Inputs: Enriched profile JSON from BrightData_Get_Linkedin and row_number from loop context.  
  - Outputs: Passes data to ice breaker generation.  
  - Edge cases:  
    - Row number mismatch causes data to update wrong row or fail.  
    - Google Sheets API quota or permission errors.

---

#### 2.5 Ice Breaker Generation

**Overview:**  
Generates a personalized ice breaker message using Anthropic Claude AI based on enriched profile data, focusing on recent posts.

**Nodes Involved:**  
- Basic LLM Chain- Ice Breaker (LangChain LLM Chain)  
- Anthropic Chat Model (LangChain LLM)

**Node Details:**

- **Anthropic Chat Model**  
  - Type: LangChain LLM (Anthropic)  
  - Role: Provides access to Claude 3.5 Haiku model for text generation.  
  - Configuration:  
    - Model: `claude-3-5-haiku-20241022`  
    - Credentials: Anthropic API key configured in n8n.  
  - Inputs: Prompt text from LLM Chain node.  
  - Outputs: Generated ice breaker text.  
  - Edge cases: API key invalid, rate limits, or model unavailability.

- **Basic LLM Chain- Ice Breaker**  
  - Type: LangChain LLM Chain  
  - Role: Constructs prompt and sends it to Anthropic Chat Model.  
  - Configuration:  
    - Prompt template includes:  
      - Person’s name (`{{ $json.name }}`)  
      - City (`{{ $('BrightData_Get_Linkedin').item.json.city }}`)  
      - About section (`{{ $('BrightData_Get_Linkedin').item.json.about }}`)  
      - Recent post title (`{{ $('BrightData_Get_Linkedin').item.json.posts[0].title }}`)  
    - Instructions to write a respectful, personalized ice breaker max 4 lines focusing on recent posts.  
    - Retry on failure enabled.  
  - Inputs: Enriched profile data and context.  
  - Outputs: Ice breaker text.  
  - Edge cases: Missing profile fields may reduce prompt quality; expression errors if fields missing.

---

#### 2.6 Google Sheets Update with Ice Breaker

**Overview:**  
Writes the generated ice breaker text back to the original Google Sheet row.

**Nodes Involved:**  
- Google Sheets - Update Row with Ice Breaker

**Node Details:**

- **Google Sheets - Update Row with Ice Breaker**  
  - Type: Google Sheets  
  - Role: Updates the `Ice Breaker 1` column in the original row with generated text.  
  - Configuration:  
    - Document ID and Sheet Name same as input sheet.  
    - Operation: Update row by matching `row_number`.  
    - Columns updated: `Ice Breaker 1` with generated text.  
    - Credentials: Google Sheets OAuth2.  
  - Inputs: Ice breaker text from LLM Chain node and row_number from loop context.  
  - Outputs: Loops back to process next batch item.  
  - Edge cases: Row mismatch, API quota, or permission errors.

---

### 3. Summary Table

| Node Name                             | Node Type                      | Functional Role                          | Input Node(s)                      | Output Node(s)                         | Sticky Note                                                                                       |
|-------------------------------------|--------------------------------|----------------------------------------|----------------------------------|--------------------------------------|-------------------------------------------------------------------------------------------------|
| When clicking "Test workflow"        | Manual Trigger                 | Manual workflow start                   | None                             | Get rows to enrich                   | Run the workflow manually or activate it to run on schedule                                     |
| Run Workflow on a certain Schedule   | Schedule Trigger              | Scheduled workflow start                | None                             | Get rows to enrich                   | Run the workflow manually or activate it to run on schedule                                     |
| Get rows to enrich                   | Google Sheets                 | Reads LinkedIn URLs and row numbers    | When clicking "Test workflow", Run Workflow on a certain Schedule | Adjust_input_for_loop                | In this workflow, I use Google Sheets to store the results. Use the provided template link.     |
| Adjust_input_for_loop                | Set                          | Formats input for API calls             | Get rows to enrich               | Loop Over Items- All Prospects       |                                                                                                 |
| Loop Over Items- All Prospects      | SplitInBatches               | Processes input rows in batches         | Adjust_input_for_loop            | HTTP_Request_Post_Request_BrightData |                                                                                                 |
| HTTP_Request_Post_Request_BrightData| HTTP Request (POST)          | Triggers Bright Data snapshot creation | Loop Over Items- All Prospects   | Wait_For_API_Call_Results            |                                                                                                 |
| Wait_For_API_Call_Results           | Wait                         | Waits between polling attempts          | HTTP_Request_Post_Request_BrightData | API_Call_Snapshot_Progress          |                                                                                                 |
| API_Call_Snapshot_Progress          | HTTP Request (GET)           | Polls snapshot progress status          | Wait_For_API_Call_Results        | IF-Checking_Status_API_Call          |                                                                                                 |
| IF-Checking_Status_API_Call         | If                           | Checks if snapshot is still running     | API_Call_Snapshot_Progress       | Wait_For_API_Call_Results (if running), BrightData_Get_Linkedin (if done) |                                                                                                 |
| BrightData_Get_Linkedin             | HTTP Request (GET)           | Retrieves enriched LinkedIn profile data | IF-Checking_Status_API_Call      | Google Sheets - Update Row with data From API |                                                                                                 |
| Google Sheets - Update Row with data From API | Google Sheets           | Updates sheet with enriched profile data | BrightData_Get_Linkedin          | Basic LLM Chain- Ice Breaker         |                                                                                                 |
| Anthropic Chat Model                | LangChain LLM (Anthropic)    | Claude AI model for ice breaker generation | Basic LLM Chain- Ice Breaker     | Basic LLM Chain- Ice Breaker (ai_languageModel output) | ICE BREAKER                                                                                      |
| Basic LLM Chain- Ice Breaker        | LangChain LLM Chain          | Constructs prompt and generates ice breaker | Google Sheets - Update Row with data From API | Google Sheets - Update Row with Ice Breaker |                                                                                                 |
| Google Sheets - Update Row with Ice Breaker | Google Sheets           | Updates sheet with generated ice breaker | Basic LLM Chain- Ice Breaker     | Loop Over Items- All Prospects       |                                                                                                 |
| Sticky Note                        | Sticky Note                  | Workflow details and guidelines         | None                             | None                               | Contains detailed workflow guidelines and API key usage notes                                  |
| Sticky Note3                       | Sticky Note                  | Personal Data label                      | None                             | None                               | Personal Data                                                                                   |
| Sticky Note4                       | Sticky Note                  | Ice Breaker label                        | None                             | None                               | ICE BREAKER                                                                                    |
| Sticky Note5                       | Sticky Note                  | Manual or scheduled trigger instructions | None                             | None                               | Run the workflow manually or activate it to run on schedule                                   |
| Sticky Note7                       | Sticky Note                  | Google Sheets template instructions     | None                             | None                               | Link and instructions for Google Sheets template                                              |
| Sticky Note9                       | Sticky Note                  | Workflow assistance contact info        | None                             | None                               | Contact info and links for support and tutorials                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Nodes:**  
   - Add a **Manual Trigger** node named `When clicking "Test workflow"`. No parameters needed.  
   - Add a **Schedule Trigger** node named `Run Workflow on a certain Schedule`. Configure the interval as desired (e.g., daily).

2. **Add Google Sheets Node to Read Input:**  
   - Add a **Google Sheets** node named `Get rows to enrich`.  
   - Set operation to read rows from your Google Sheet containing `Linkedin_URL_Person` and `row_number`.  
   - Configure with your Google Sheets OAuth2 credentials.  
   - Select the correct document and sheet/tab.

3. **Prepare Input for Loop:**  
   - Add a **Set** node named `Adjust_input_for_loop`.  
   - Map `person_input` to `Linkedin_URL_Person` from the previous node.  
   - Map `row_number` to `row_number` from the previous node.

4. **Split Input into Batches:**  
   - Add a **SplitInBatches** node named `Loop Over Items- All Prospects`.  
   - Connect from `Adjust_input_for_loop`.  
   - Use default batch size (1) to process one LinkedIn URL at a time.

5. **Trigger Bright Data Snapshot:**  
   - Add an **HTTP Request** node named `HTTP_Request_Post_Request_BrightData`.  
   - Set method to POST.  
   - URL: `https://api.brightdata.com/datasets/v3/trigger`  
   - Query parameters:  
     - `dataset_id` = your Bright Data dataset ID  
     - `include_errors` = `true`  
   - Body (JSON): `[{"url": "{{ $json.person_input }}"}]`  
   - Headers: Authorization: `Bearer YOUR_BRIGHTDATA_API_KEY`  
   - Connect from `Loop Over Items- All Prospects`.

6. **Wait Between Polls:**  
   - Add a **Wait** node named `Wait_For_API_Call_Results`.  
   - Set wait time to 10 seconds.  
   - Connect from `HTTP_Request_Post_Request_BrightData`.

7. **Poll Snapshot Progress:**  
   - Add an **HTTP Request** node named `API_Call_Snapshot_Progress`.  
   - Method: GET  
   - URL: `https://api.brightdata.com/datasets/v3/progress/{{ $json.snapshot_id }}`  
   - Headers: Authorization: `Bearer YOUR_BRIGHTDATA_API_KEY`  
   - Connect from `Wait_For_API_Call_Results`.

8. **Check Snapshot Status:**  
   - Add an **If** node named `IF-Checking_Status_API_Call`.  
   - Condition: `$json.status == "running"`  
   - Connect from `API_Call_Snapshot_Progress`.  
   - True branch connects back to `Wait_For_API_Call_Results` (loop).  
   - False branch proceeds to next node.

9. **Retrieve Snapshot Data:**  
   - Add an **HTTP Request** node named `BrightData_Get_Linkedin`.  
   - Method: GET  
   - URL: `https://api.brightdata.com/datasets/v3/snapshot/{{ $json.snapshot_id }}`  
   - Query parameter: `format=json`  
   - Headers: Authorization: `Bearer YOUR_BRIGHTDATA_API_KEY`  
   - Connect from False branch of `IF-Checking_Status_API_Call`.

10. **Update Google Sheet with Profile Data:**  
    - Add a **Google Sheets** node named `Google Sheets - Update Row with data From API`.  
    - Operation: Update row by matching `row_number`.  
    - Map columns: name, city, about, country_code, current_company.name, Linkedin_URL_Person, etc.  
    - Connect from `BrightData_Get_Linkedin`.  
    - Use Google Sheets OAuth2 credentials.

11. **Add Anthropic Claude Chat Model:**  
    - Add a **LangChain LLM (Anthropic)** node named `Anthropic Chat Model`.  
    - Select model: `claude-3-5-haiku-20241022`.  
    - Configure Anthropic API credentials.

12. **Create LLM Chain for Ice Breaker:**  
    - Add a **LangChain LLM Chain** node named `Basic LLM Chain- Ice Breaker`.  
    - Prompt template:  
      ```
      Help me with writing a witty Ice breaker to try to persuade  {{ $json.name }} from {{ $('BrightData_Get_Linkedin').item.json.city }}. His About section in his Linkedin profile says: {{ $('BrightData_Get_Linkedin').item.json.about }}. 
      He also had a recent post about: {{ $('BrightData_Get_Linkedin').item.json.posts[0].title }}

      Make it 4 lines maximum. Focus more on his recent post, not the about. Just to make it feel personalized yet respectful and not creepy.

      WRITE THE ICE BREAKER straight away. Don't write "here's a draft" or any other text before your actual response.
      ```  
    - Connect the `Anthropic Chat Model` node as the language model for this chain.  
    - Connect from `Google Sheets - Update Row with data From API`.

13. **Update Google Sheet with Ice Breaker:**  
    - Add a **Google Sheets** node named `Google Sheets - Update Row with Ice Breaker`.  
    - Operation: Update row by matching `row_number`.  
    - Map column `Ice Breaker 1` to the output text from the LLM chain.  
    - Connect from `Basic LLM Chain- Ice Breaker`.

14. **Loop Back to Process Next Item:**  
    - Connect the output of `Google Sheets - Update Row with Ice Breaker` back to `Loop Over Items- All Prospects` to process the next batch.

15. **Credential Setup:**  
    - Google Sheets OAuth2 credentials for all Google Sheets nodes.  
    - Bright Data API key for all HTTP Request nodes interacting with Bright Data.  
    - Anthropic API key for LangChain Anthropic nodes.

---

### 5. General Notes & Resources

| Note Content                                                                                                   | Context or Link                                                                                   |
|---------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Workflow automates LinkedIn profile enrichment and ice breaker generation for personalized outreach at scale. | Workflow purpose summary.                                                                        |
| Google Sheets template for input and output available.                                                        | https://docs.google.com/spreadsheets/d/1_jbr5zBllTy_pGbogfGSvyv1_0a77I8tU-Ai7BjTAw4/edit?usp=sharing |
| Contact for support and feedback: Yaron@nofluff.online                                                        | Email contact.                                                                                   |
| Additional learning resources: YouTube channel and LinkedIn profile of workflow author.                        | YouTube: https://www.youtube.com/@YaronBeen/videos, LinkedIn: https://www.linkedin.com/in/yaronbeen/ |
| Bright Data snapshots may take time; workflow includes polling and retry logic to handle delays.               | Operational note.                                                                               |
| Ensure unique `row_number` per LinkedIn URL to avoid data mismatches in Google Sheets.                         | Data integrity note.                                                                             |
| Prompt engineering can be customized in the LLM Chain node to adjust tone and length of ice breakers.          | Customization tip.                                                                              |

---

This structured documentation provides a comprehensive understanding of the workflow, enabling reproduction, modification, and troubleshooting by advanced users and AI agents alike.