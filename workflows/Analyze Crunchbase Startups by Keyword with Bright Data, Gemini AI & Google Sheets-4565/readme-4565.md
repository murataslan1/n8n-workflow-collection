Analyze Crunchbase Startups by Keyword with Bright Data, Gemini AI & Google Sheets

https://n8nworkflows.xyz/workflows/analyze-crunchbase-startups-by-keyword-with-bright-data--gemini-ai---google-sheets-4565


# Analyze Crunchbase Startups by Keyword with Bright Data, Gemini AI & Google Sheets

### 1. Workflow Overview

This n8n workflow automates the process of analyzing Crunchbase startup data based on a user-provided keyword. It integrates with Bright Data’s API to discover startups related to the keyword, polls for data readiness, processes and cleans the retrieved JSON data, performs AI-powered comparative analysis using Google Gemini, and finally exports the results to Google Sheets.

Logical blocks include:

- **1.1 Input Reception:** Receiving user input keyword through a form trigger.
- **1.2 Data Retrieval:** Posting a request to Bright Data API to initiate data fetching, polling for completion, and retrieving the snapshot data.
- **1.3 Data Processing:** Parsing, cleaning, and sorting the JSON data of startups.
- **1.4 AI Analysis:** Performing comparative analysis on the startups data using Google Gemini AI models.
- **1.5 Result Consolidation and Export:** Combining company data with AI analysis and exporting to Google Sheets.
- **1.6 Utility:** Includes a sticky note reminder for JSON key customization.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** Captures the keyword input from the user via a web form to initiate the workflow.
- **Nodes Involved:**  
  - When User Completes Form

- **Node Details:**

  - **When User Completes Form**  
    - Type: Form Trigger  
    - Role: Entry point node capturing user input keyword.  
    - Configuration:  
      - Form titled "Search from Crunchbase by keyword" with a required field "Keyword" (example placeholder: "AI in healthcare").  
      - Ignores bots.  
      - Webhook ID assigned for external form submission.  
    - Inputs: External user submission via webhook  
    - Outputs: JSON including the user’s keyword under `$json["Keyword"]`  
    - Edge cases: Missing or empty keyword input will block workflow; ensure required field enforced on form.  
    - Version requirement: v2.2  

#### 2.2 Data Retrieval

- **Overview:** Posts a request to Bright Data to start data collection based on the keyword, polls for snapshot readiness, and retrieves the snapshot data once ready.
- **Nodes Involved:**  
  - HTTP Request- Post API call to Bright Data  
  - Wait - Polling Bright Data  
  - Snapshot Progress  
  - If - Checking status of Snapshot - if data is ready or not  
  - HTTP Request - Getting data from Bright Data

- **Node Details:**

  - **HTTP Request- Post API call to Bright Data**  
    - Type: HTTP Request (POST)  
    - Role: Initiate Bright Data dataset trigger to search for startups by keyword.  
    - Configuration:  
      - URL: `https://api.brightdata.com/datasets/v3/trigger`  
      - Method: POST  
      - Headers include Bearer authorization with API key (replace `YOUR_API_KEY`).  
      - Query parameters specify dataset ID (`gd_l1vijqt9jfj7olije`), type of request (`discover_new`), discovery method (`keyword`), and error inclusion.  
      - Body includes dynamic keyword from form input `={{ $json["Keyword"] }}`.  
    - Inputs: keyword from form  
    - Outputs: JSON with `snapshot_id` for polling  
    - Edge cases: Authorization errors, invalid keyword, API rate limits.  
    - Version: 4.2

  - **Wait - Polling Bright Data**  
    - Type: Wait  
    - Role: Pauses workflow for 15 seconds between polling attempts to avoid excessive API calls.  
    - Configuration: Wait 15 seconds, execute multiple times until data is ready.  
    - Inputs: Triggered after request submission or after poll failure.  
    - Outputs: Triggers Snapshot Progress node.  
    - Edge cases: Timeout if snapshot never becomes ready; consider adding max retry logic.  
    - Version: 1.1

  - **Snapshot Progress**  
    - Type: HTTP Request (GET)  
    - Role: Check snapshot status using Bright Data API to determine if data collection is complete.  
    - Configuration:  
      - URL dynamically constructed with snapshot_id from previous request.  
      - Authorization header with Bearer token.  
    - Inputs: snapshot_id from previous node  
    - Outputs: JSON with `status` field (e.g., "running", "completed")  
    - Edge cases: Network/API errors, invalid snapshot_id.  
    - Version: 4.2

  - **If - Checking status of Snapshot - if data is ready or not**  
    - Type: If  
    - Role: Conditional check on snapshot status to decide whether to continue waiting or fetch data.  
    - Configuration: Checks if `$json.status` equals "running"  
    - Inputs: Output of Snapshot Progress node  
    - Outputs:  
      - True branch: loops back to Wait node for further polling  
      - False branch: proceeds to get snapshot data  
    - Edge cases: Unhandled statuses, empty responses.  
    - Version: 2.2

  - **HTTP Request - Getting data from Bright Data**  
    - Type: HTTP Request (GET)  
    - Role: Fetch the actual snapshot data once ready.  
    - Configuration:  
      - URL dynamically includes snapshot_id  
      - Query parameter sets format to JSON  
      - Authorization header with Bearer token  
    - Inputs: snapshot_id from previous nodes  
    - Outputs: Raw JSON data of startups matching keyword  
    - Edge cases: Partial data, API errors, malformed JSON.  
    - Version: 4.2

#### 2.3 Data Processing

- **Overview:** Parses the raw JSON startup data, filters out invalid entries, sorts by founding date descending, and extracts/cleans relevant company fields into a simplified schema.
- **Nodes Involved:**  
  - Code - Parse and Clean JSON Data

- **Node Details:**

  - **Code - Parse and Clean JSON Data**  
    - Type: Code (Python)  
    - Role: Filter startups with valid founding date, sort by date descending, extract key fields, and prepare top 10 companies for AI analysis.  
    - Configuration:  
      - Python code uses datetime parsing to validate and sort entries.  
      - Extracted fields include name, founded date, about, employee count, type, IPO status, descriptions, visits, social links, website, address, funding totals, investors, founders, products, Crunchbase link, and placeholder for AI analysis.  
      - Returns array of cleaned company JSON objects.  
    - Inputs: Raw JSON from Bright Data snapshot  
    - Outputs: Cleaned and structured JSON array of startups  
    - Edge cases: Missing or malformed date fields, empty data sets, field key changes in source JSON.  
    - Version: 2  
    - Sticky note attached: Advises to customize JSON keys to desired fields.

#### 2.4 AI Analysis

- **Overview:** Uses Google Gemini AI to perform a comparative analysis of the startups data based on the user keyword.
- **Nodes Involved:**  
  - Google Gemini Chat Model  
  - Google Gemini - Comparative Analisys

- **Node Details:**

  - **Google Gemini Chat Model**  
    - Type: Google Gemini AI Chat Model node  
    - Role: Provides conversational AI model interface for further processing.  
    - Configuration: Uses model `models/gemini-2.0-flash`  
    - Inputs: Triggered by data from parsed companies  
    - Outputs: Chat model output to next chain node  
    - Edge cases: API limits, latency, auth errors.  
    - Version: 1

  - **Google Gemini - Comparative Analisys**  
    - Type: Chain LLM (Language Model Chain)  
    - Role: Runs prompt-based AI analysis on companies data.  
    - Configuration:  
      - Receives cleaned JSON data as text input.  
      - Prompt instructs AI to provide comparative analysis highlighting similarities, differences, perspectives, and outliers, referencing user keyword.  
      - Avoids starting response with "Okay".  
    - Inputs: JSON data from parsing node  
    - Outputs: AI generated text analysis  
    - Edge cases: Misinterpretation of prompt, incomplete data, API errors.  
    - Version: 1.6

#### 2.5 Result Consolidation and Export

- **Overview:** Merges cleaned company data with AI analysis text, then appends the combined results into a Google Sheets document.
- **Nodes Involved:**  
  - Merge  
  - Code - Combining JSON and AI outputs  
  - Google Sheets - Export Results

- **Node Details:**

  - **Merge**  
    - Type: Merge  
    - Role: Combines two input streams: cleaned companies and AI analysis results.  
    - Inputs:  
      - Input 0: cleaned company data  
      - Input 1: AI analysis output  
    - Outputs: Combined data stream to code node  
    - Version: 3.1

  - **Code - Combining JSON and AI outputs**  
    - Type: Code (Python)  
    - Role: Inserts AI analysis text into the first company's `ai_analysis` field, returns an array of companies with enriched data.  
    - Configuration:  
      - Checks presence of both inputs, raises error if missing.  
      - Modifies first company object with AI text.  
      - Returns full list for export.  
    - Inputs:  
      - Input 0: cleaned companies JSON  
      - Input 1: AI analysis text  
    - Outputs: array of enriched company JSON objects  
    - Edge cases: Missing inputs, empty arrays.  
    - Version: 2

  - **Google Sheets - Export Results**  
    - Type: Google Sheets  
    - Role: Appends the enriched companies data into a Google Sheets document.  
    - Configuration:  
      - Document ID and sheet name (gid=0) specified.  
      - Maps multiple company fields (name, founded, about, num_employees, type, ipo_status, full_description, social_media_links, website, funding_total, num_investors, lead_investors, founders, products_and_services, crunchbase_link) plus AI analysis text.  
      - Append operation mode with auto-mapping.  
    - Inputs: enriched company array  
    - Outputs: none (final export)  
    - Edge cases: Authentication errors, quota limits, spreadsheet access rights.  
    - Version: 4.3

#### 2.6 Utility

- **Overview:** Provides a sticky note reminder for users to customize JSON keys in the parsing code according to their needs.
- **Nodes Involved:**  
  - Sticky Note

- **Node Details:**

  - **Sticky Note**  
    - Type: Sticky Note  
    - Role: Documentation aid within the workflow editor  
    - Content: "Modify the JSON keys in the code to include only the fields you want. The current structure is a sample template"  
    - Positioned near parsing code node to highlight customization point.

---

### 3. Summary Table

| Node Name                              | Node Type                                | Functional Role                       | Input Node(s)                                      | Output Node(s)                                  | Sticky Note                                                                                  |
|--------------------------------------|-----------------------------------------|-------------------------------------|---------------------------------------------------|------------------------------------------------|----------------------------------------------------------------------------------------------|
| When User Completes Form              | Form Trigger                            | Receive user keyword input           | -                                                 | HTTP Request- Post API call to Bright Data      |                                                                                              |
| HTTP Request- Post API call to Bright Data | HTTP Request (POST)                    | Trigger Bright Data dataset          | When User Completes Form                          | Wait - Polling Bright Data                       |                                                                                              |
| Wait - Polling Bright Data            | Wait                                   | Pause and poll for snapshot readiness | HTTP Request- Post API call to Bright Data, If - Checking status of Snapshot | Snapshot Progress                               |                                                                                              |
| Snapshot Progress                     | HTTP Request (GET)                      | Check snapshot status                | Wait - Polling Bright Data                         | If - Checking status of Snapshot                 |                                                                                              |
| If - Checking status of Snapshot - if data is ready or not | If                                    | Branch workflow by snapshot status  | Snapshot Progress                                 | Wait - Polling Bright Data (if running), HTTP Request - Getting data from Bright Data (else) |                                                                                              |
| HTTP Request - Getting data from Bright Data | HTTP Request (GET)                      | Retrieve snapshot JSON data          | If - Checking status of Snapshot                   | Code - Parse and Clean JSON Data                 |                                                                                              |
| Code - Parse and Clean JSON Data     | Code (Python)                          | Parse, filter, sort, and clean data | HTTP Request - Getting data from Bright Data      | Google Gemini - Comparative Analisys, Merge      | Modify the JSON keys in the code to include only the fields you want. The current structure is a sample template |
| Google Gemini Chat Model              | Google Gemini AI Chat Model             | AI language model interface          | Google Gemini - Comparative Analisys               | Google Gemini - Comparative Analisys             |                                                                                              |
| Google Gemini - Comparative Analisys | Chain LLM                             | Perform AI comparative analysis      | Code - Parse and Clean JSON Data                   | Merge                                            |                                                                                              |
| Merge                               | Merge                                  | Merge cleaned data and AI analysis   | Code - Parse and Clean JSON Data, Google Gemini - Comparative Analisys | Code - Combining JSON and AI outputs             |                                                                                              |
| Code - Combining JSON and AI outputs | Code (Python)                          | Combine company data with AI text    | Merge                                             | Google Sheets - Export Results                    |                                                                                              |
| Google Sheets - Export Results        | Google Sheets                          | Export enriched data to Google Sheets | Code - Combining JSON and AI outputs                | -                                                |                                                                                              |
| Sticky Note                         | Sticky Note                           | Workflow annotation/reminder         | -                                                 | -                                                | Modify the JSON keys in the code to include only the fields you want. The current structure is a sample template |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Form Trigger Node**  
   - Type: Form Trigger (When User Completes Form)  
   - Configure form title: "Search from Crunchbase by keyword"  
   - Add a required text field named "Keyword", placeholder: e.g. "AI in healthcare"  
   - Enable "Ignore Bots"  
   - Save to generate webhook URL.

2. **Create HTTP Request Node to Post API Call to Bright Data**  
   - Type: HTTP Request (POST)  
   - URL: `https://api.brightdata.com/datasets/v3/trigger`  
   - Method: POST  
   - Headers: Add Authorization header with Bearer token (your Bright Data API key)  
   - Query parameters:  
     - dataset_id = `gd_l1vijqt9jfj7olije`  
     - type = `discover_new`  
     - discover_by = `keyword`  
     - include_errors = `true`  
   - Body parameters:  
     - keyword = expression referencing form input: `={{ $json["Keyword"] }}`  
   - Connect form trigger node output to this node input.

3. **Create Wait Node for Polling**  
   - Type: Wait  
   - Set to wait 15 seconds  
   - Connect output of HTTP Request post API call node to this wait node.

4. **Create HTTP Request Node for Snapshot Progress**  
   - Type: HTTP Request (GET)  
   - URL expression: `=https://api.brightdata.com/datasets/v3/progress/{{ $('HTTP Request- Post API call to Bright Data').item.json.snapshot_id }}`  
   - Headers: Authorization Bearer token same as above  
   - Connect wait node output to this node.

5. **Create If Node to Check Snapshot Status**  
   - Type: If  
   - Condition: Check if `$json.status` equals `"running"`  
   - Connect Snapshot Progress output to this If node.

6. **Loop Back on "Running" Status**  
   - Connect If node’s True branch back to Wait node to continue polling.

7. **Create HTTP Request Node to Get Snapshot Data**  
   - Type: HTTP Request (GET)  
   - URL expression: `=https://api.brightdata.com/datasets/v3/snapshot/{{ $json.snapshot_id }}`  
   - Query Parameter: `format=json`  
   - Headers: Authorization Bearer token  
   - Connect If node’s False branch (status not running) to this node.

8. **Create Code Node to Parse and Clean JSON Data**  
   - Type: Code (Python)  
   - Use provided Python script to:  
     - Validate and parse company founding dates  
     - Sort descending by date  
     - Extract and clean desired fields into simplified company JSON objects  
     - Limit to top 10 companies  
   - Connect output of snapshot data node to this code node.

9. **Create Google Gemini AI Chat Model Node**  
   - Type: Google Gemini Chat Model  
   - Model: `models/gemini-2.0-flash`  
   - Connect output of parsing code node to this AI node.

10. **Create Google Gemini Chain LLM Node for Comparative Analysis**  
    - Type: Chain LLM  
    - Input text: pass cleaned JSON data as string  
    - Prompt: instruct AI to perform comparative analysis on companies based on user keyword (pull keyword from form input).  
    - Connect output of Google Gemini Chat Model node as input to this node.

11. **Create Merge Node**  
    - Type: Merge  
    - Set to merge two inputs  
    - Connect cleaned data code node output as Input 0  
    - Connect AI analysis node output as Input 1

12. **Create Code Node to Combine JSON and AI outputs**  
    - Type: Code (Python)  
    - Logic: Insert AI analysis text into `ai_analysis` field of first company object, return full array  
    - Connect output of Merge node to this code node.

13. **Create Google Sheets Node to Export Results**  
    - Type: Google Sheets  
    - Operation: Append  
    - Document ID: your Google Sheet ID  
    - Sheet name: `gid=0` or your target sheet  
    - Map columns: name, founded, about, num_employees, type, ipo_status, full_description, social_media_links, website, funding_total, num_investors, lead_investors, founders, products_and_services, crunchbase_link, text (AI analysis)  
    - Connect output of combining code node to this node.

14. **Add Sticky Note near Parsing Code Node**  
    - Content: "Modify the JSON keys in the code to include only the fields you want. The current structure is a sample template"

15. **Set Credentials**  
    - For all HTTP Request nodes interacting with Bright Data, configure credentials with the Bright Data API key.  
    - For Google Gemini nodes, configure Google Cloud credentials with access to Gemini AI models.  
    - For Google Sheets node, configure Google Sheets OAuth2 credentials with access to target spreadsheet.

16. **Finalize Connections and Test**  
    - Ensure all nodes are connected as per the structure:  
      Form Trigger → Post API Call → Wait → Snapshot Progress → If (loop back or proceed) → Get Snapshot Data → Parsing Code → Google Gemini Chat → Gemini Chain LLM → Merge → Combining Code → Google Sheets Export  
    - Run tests with sample keywords to verify data flow, API responses, AI analysis, and sheet appending.

---

### 5. General Notes & Resources

| Note Content                                                                                     | Context or Link                                                   |
|-------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| Modify the JSON keys in the Python code node to customize which company fields to extract and output. The current keys serve as a sample template. | Sticky note in workflow near "Code - Parse and Clean JSON Data" node. |
| Bright Data API documentation: https://brightdata.com/docs/datasets/api/datasets-v3             | Reference for API endpoints and parameters.                      |
| Google Gemini AI model info: https://cloud.google.com/vertex-ai/docs/generative-ai                 | Details on Gemini model usage and configuration.                 |
| Google Sheets API and n8n integration docs: https://docs.n8n.io/integrations/builtin/google-sheets | For credential setup and advanced mapping options.               |

---

**Disclaimer:** The provided text is extracted exclusively from an n8n automated workflow. All processing complies fully with applicable content policies and contains no illegal, offensive, or protected elements. All data handled is legal and publicly accessible.