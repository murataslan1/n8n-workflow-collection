Analyze Email Performance & Optimize Campaigns with GPT-4, SendGrid, and Airtable

https://n8nworkflows.xyz/workflows/analyze-email-performance---optimize-campaigns-with-gpt-4--sendgrid--and-airtable-9430


# Analyze Email Performance & Optimize Campaigns with GPT-4, SendGrid, and Airtable

### 1. Workflow Overview

This n8n workflow is designed to analyze weekly email campaign performance data retrieved from SendGrid, optimize future campaigns leveraging GPT-4 AI analysis, and store both raw data and AI-driven recommendations in Airtable. It targets marketing teams aiming to continuously improve email engagement metrics such as open rates and click-through rates through automated, data-driven insights and testing directives.

The workflow is logically divided into four functional blocks:

- **1.1 Input Reception & Data Retrieval:** Triggered manually or on schedule, it fetches SendGrid email statistics for the past week and retrieves the latest stored campaign data from Airtable.

- **1.2 Data Transformation & Combination:** Processes raw SendGrid data to calculate aggregate metrics, then merges these with the latest Airtable record to prepare for update.

- **1.3 AI-Powered Campaign Analysis:** Uses GPT-4 (via OpenAI API) to analyze recent campaign trends and recommend a single test variable with instructions for next week’s campaign.

- **1.4 Data Persistence & Future Planning:** Parses the AI response, calculates the next campaign week date, writes the new recommendations as a new Airtable record, and updates existing records with fresh performance data.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Data Retrieval

- **Overview:** This block initiates the workflow either by manual trigger or a scheduled trigger. It then pulls email performance data for the last 7 days from SendGrid and fetches the most recent campaign record from Airtable for comparison and merging.

- **Nodes Involved:**  
  - When clicking ‘Execute workflow’ (Manual Trigger)  
  - Schedule Trigger (Scheduled Trigger)  
  - Sendgrid Data Pull (HTTP Request)  
  - Search records (Airtable Search)  

- **Node Details:**

  - **When clicking ‘Execute workflow’**  
    - Type: Manual Trigger  
    - Role: Allows manual execution of the workflow for ad-hoc runs.  
    - Inputs: None  
    - Outputs: Sends trigger signal to "Sendgrid Data Pull".  
    - Failure Mode: N/A (manual node)  

  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Role: Automates workflow execution on a regular interval (default unspecified interval).  
    - Inputs: None  
    - Outputs: Triggers "Sendgrid Data Pull".  
    - Edge Cases: If schedule is misconfigured, workflow may not run.  

  - **Sendgrid Data Pull**  
    - Type: HTTP Request  
    - Role: Retrieves email statistics from SendGrid API for the past 7 days (dynamic dates calculated via expressions).  
    - Key Configurations:  
      - URL: `https://api.sendgrid.com/v3/stats`  
      - Query parameters: `start_date` (7 days ago), `end_date` (today) dynamically calculated  
      - Authentication: HTTP Header Auth with SendGrid API key  
      - Headers: `Content-Type: application/json`  
    - Inputs: Trigger node outputs  
    - Outputs: Raw JSON containing daily stats entries  
    - Failure Modes: API auth failure, rate limiting, network errors, malformed response  

  - **Search records**  
    - Type: Airtable Search  
    - Role: Retrieves the most recent record from Airtable "Email Campaign Performance" table sorted by `week_ending` descending, limit 1.  
    - Inputs: Output of Sendgrid Data Pull  
    - Outputs: Latest campaign record for merging  
    - Failure Modes: Airtable API errors, auth failure, empty table returns empty data  

---

#### 2.2 Data Transformation & Combination

- **Overview:** Aggregates daily SendGrid stats into weekly totals and rates, then merges this with the latest Airtable record to prepare an updated record.

- **Nodes Involved:**  
  - Data X-Form (Code)  
  - Pull Most Recent Week (Code)  
  - Merge (Merge)  
  - Update record (Airtable Update)  

- **Node Details:**

  - **Data X-Form**  
    - Type: Code (JavaScript)  
    - Role: Aggregates multiple daily data points into weekly totals and calculates open rate and CTR ratios.  
    - Key Logic:  
      - Sums `delivered`, `unique_opens`, `unique_clicks` over all days  
      - Calculates `open_rate = unique_opens / delivered` (0 if delivered=0)  
      - Calculates `ctr = unique_clicks / delivered` (0 if delivered=0)  
      - Returns a single JSON item with these metrics and current date as `week_ending`  
    - Inputs: Output of Sendgrid Data Pull  
    - Outputs: Aggregated weekly stats  
    - Edge Cases: No data or zero deliveries yield zero rates  

  - **Pull Most Recent Week**  
    - Type: Code (JavaScript)  
    - Role: Extracts just the `id` of the Airtable record retrieved by "Search records" for use in merging.  
    - Inputs: Output of Search records  
    - Outputs: JSON with record `id`  
    - Edge Cases: No records found results in undefined `id`  

  - **Merge**  
    - Type: Merge  
    - Role: Combines aggregated weekly stats and latest Airtable record id into one JSON object for update.  
    - Inputs:  
      - Input 1: Output of Data X-Form (weekly stats)  
      - Input 2: Output of Pull Most Recent Week (record id)  
    - Outputs: Merged JSON object with `id` and stats  
    - Edge Cases: Missing inputs cause incomplete merge  

  - **Update record**  
    - Type: Airtable Update  
    - Role: Updates the existing Airtable record with fresh weekly stats.  
    - Inputs: Output of Merge  
    - Key Configurations:  
      - Base: Airtable base “apptBBudqpCku19Sw”  
      - Table: “Email Campaign Performance”  
      - Matching on record ID  
      - Fields updated: `ctr`, `delivered`, `open_rate`, `week_ending`, `unique_opens`, `unique_clicks`, `performance_delta` set to 0 initially  
      - Typecasting enabled to ensure Airtable fields are correct types  
    - Outputs: Updated Airtable record  
    - Failure Modes: Airtable auth failure, invalid record ID, network issues  

---

#### 2.3 AI-Powered Campaign Analysis

- **Overview:** Retrieves several recent weeks of campaign data from Airtable, sends them to GPT-4 for analysis, and receives a data-driven recommendation to optimize the next email campaign.

- **Nodes Involved:**  
  - Search records1 (Airtable Search)  
  - Previous Week Analysis (OpenAI GPT-4)  
  - Parse Output (Code)  

- **Node Details:**

  - **Search records1**  
    - Type: Airtable Search  
    - Role: Retrieves last 4 records from Airtable “Email Campaign Performance” for historical context.  
    - Inputs: Output of Update record  
    - Outputs: Array of recent campaign performance records  
    - Edge Cases: Less than 4 records returns fewer entries, empty table returns none  

  - **Previous Week Analysis**  
    - Type: OpenAI (n8n-nodes-base.openAi)  
    - Role: Feeds campaign data to GPT-4 with a detailed prompt asking for a single test variable recommendation based on trends.  
    - Key Configurations:  
      - Model: chatgpt-4o-latest (GPT-4)  
      - Prompt includes:  
        - JSON stringified array of last 4 weeks’ data  
        - Instructions to analyze trends and output a JSON with fields like `decision`, `test_variable`, `test_hypothesis`, etc.  
    - Inputs: Output of Search records1  
    - Outputs: GPT-4 JSON response with campaign optimization instructions  
    - Failure Modes: API key/auth issues, rate limits, malformed prompt output  

  - **Parse Output**  
    - Type: Code (JavaScript)  
    - Role: Parses GPT-4 JSON response, calculates next week's date from latest Airtable record, and formats a new record for Airtable creation.  
    - Key Logic:  
      - Parses GPT response content as JSON  
      - Retrieves last `week_ending` from the search records data  
      - Adds 7 days to calculate next week’s date  
      - Sets initial performance metrics to zero  
    - Inputs: GPT-4 output and Search records1 data (via node reference)  
    - Outputs: JSON ready for new Airtable record creation  
    - Edge Cases: Malformed AI output, missing date fields  

---

#### 2.4 Data Persistence & Future Planning

- **Overview:** Saves the AI-generated campaign optimization instructions as a new Airtable record and confirms the update cycle by re-querying recent data.

- **Nodes Involved:**  
  - Create a record (Airtable Create)  

- **Node Details:**

  - **Create a record**  
    - Type: Airtable Create  
    - Role: Inserts new record for upcoming campaign week with AI recommendations and initialized metrics.  
    - Inputs: Output of Parse Output  
    - Key Configurations:  
      - Base and Table same as update node  
      - Fields include `decision`, `test_variable`, `test_hypothesis`, `confidence_level`, `test_directive`, `implementation_instruction`, and zeroed metrics  
    - Outputs: New Airtable record confirmation  
    - Failure Modes: Airtable auth failure, invalid field mapping, network issues  

---

### 3. Summary Table

| Node Name                 | Node Type            | Functional Role                        | Input Node(s)                   | Output Node(s)               | Sticky Note                                                                                              |
|---------------------------|----------------------|-------------------------------------|--------------------------------|-----------------------------|--------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger       | Manual execution trigger              | None                           | Sendgrid Data Pull           |                                                                                                        |
| Schedule Trigger          | Schedule Trigger      | Scheduled execution trigger           | None                           | Sendgrid Data Pull           |                                                                                                        |
| Sendgrid Data Pull        | HTTP Request         | Retrieve email stats from SendGrid   | When clicking ‘Execute workflow’, Schedule Trigger | Data X-Form, Search records |                                                                                                        |
| Data X-Form               | Code                 | Aggregate daily stats to weekly totals | Sendgrid Data Pull             | Merge                       |                                                                                                        |
| Search records            | Airtable Search      | Get most recent campaign record      | Sendgrid Data Pull             | Pull Most Recent Week        |                                                                                                        |
| Pull Most Recent Week     | Code                 | Extract record ID for merging         | Search records                 | Merge                       |                                                                                                        |
| Merge                    | Merge                | Combine aggregated stats and record ID | Data X-Form, Pull Most Recent Week | Update record               |                                                                                                        |
| Update record             | Airtable Update      | Update existing Airtable record       | Merge                         | Search records1              |                                                                                                        |
| Search records1           | Airtable Search      | Retrieve last 4 campaign records      | Update record                  | Previous Week Analysis       |                                                                                                        |
| Previous Week Analysis    | OpenAI GPT-4         | Analyze recent campaign data and recommend test | Search records1               | Parse Output                |                                                                                                        |
| Parse Output              | Code                 | Parse AI JSON, calculate next week date, prepare new record | Previous Week Analysis        | Create a record             |                                                                                                        |
| Create a record           | Airtable Create      | Insert new record with AI recommendations | Parse Output                  |                             |                                                                                                        |
| Sticky Note               | Sticky Note          | Section label: Update Previous Week's Data | None                         | None                        | ## Update Previous Week's Data                                                                          |
| Sticky Note1              | Sticky Note          | Section label: Previous week analysis | None                         | None                        | ## Previous week analysis                                                                                |
| Sticky Note2              | Sticky Note          | Section label: Testing instructions for coming week | None                         | None                        | ## Testing instructions for coming week                                                                 |
| Sticky Note3              | Sticky Note          | Contains detailed prompt injection for AI optimization | None                         | None                        | ## Prompt Injection: detailed instructions and required output format for GPT-4                         |
| Sticky Note4              | Sticky Note          | Workflow purpose and high-level overview | None                         | None                        | ## PURPOSE: Continuous automated email campaign improvement using SendGrid and Airtable                 |
| Sticky Note5              | Sticky Note          | Integration instructions summary      | None                         | None                        | ## INTEGRATION INSTRUCTIONS: how to incorporate the workflow into email generation processes           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Nodes:**  
   - Add a **Manual Trigger** node named “When clicking ‘Execute workflow’” for manual runs.  
   - Add a **Schedule Trigger** node named “Schedule Trigger” to automate runs (optional: configure interval).  

2. **Retrieve SendGrid Data:**  
   - Add an **HTTP Request** node named “Sendgrid Data Pull” with:  
     - Method: GET  
     - URL: `https://api.sendgrid.com/v3/stats`  
     - Query parameters:  
       - `start_date` = expression `{{$now.minus(7, 'days').format('yyyy-MM-dd')}}`  
       - `end_date` = expression `{{$now.format('yyyy-MM-dd')}}`  
     - Headers: set `Content-Type: application/json`  
     - Authentication: HTTP Header Auth using SendGrid API key credential  

3. **Retrieve Latest Campaign Record:**  
   - Add an **Airtable Search** node named “Search records” with:  
     - Base: select your Airtable base (e.g., “apptBBudqpCku19Sw”)  
     - Table: “Email Campaign Performance”  
     - Sort by “week_ending” descending  
     - Limit: 1 record  
     - Use Airtable personal access token credential  

4. **Process SendGrid Data to Weekly Stats:**  
   - Add a **Code** node named “Data X-Form” with JavaScript code that:  
     - Aggregates fields `delivered`, `unique_opens`, `unique_clicks` over all input items  
     - Calculates `open_rate` and `ctr` as ratios over delivered  
     - Sets `week_ending` to current ISO date string  
     - Returns a single JSON object with these metrics  

5. **Extract Record ID:**  
   - Add a **Code** node named “Pull Most Recent Week” that takes the output of “Search records” and returns just the record `id` as JSON.  

6. **Merge Weekly Stats with Record ID:**  
   - Add a **Merge** node named “Merge” using “Merge by Index” mode, combining outputs from “Data X-Form” and “Pull Most Recent Week”.  

7. **Update Airtable Record:**  
   - Add an **Airtable Update** node named “Update record” with:  
     - Base and Table as before  
     - Use “id” from merged data to match record  
     - Map fields: `ctr`, `delivered`, `open_rate`, `week_ending`, `unique_opens`, `unique_clicks`  
     - Set `performance_delta` to 0  
     - Enable typecast  
     - Use Airtable personal access token credential  

8. **Retrieve Last 4 Records for Analysis:**  
   - Add an **Airtable Search** node named “Search records1” with:  
     - Same Base and Table  
     - Limit: 4 records  
     - No sorting required but recommended to use descending on `week_ending`  
     - Use Airtable credential  

9. **GPT-4 Campaign Analysis:**  
   - Add an **OpenAI** node named “Previous Week Analysis”:  
     - Model: GPT-4 (chatgpt-4o-latest)  
     - Prompt: Include the JSON string of last 4 weeks data via expression interpolation  
     - Instructions: Ask for a single test variable recommendation with detailed explanation (use the prompt from Sticky Note3)  
     - Use OpenAI API credential  

10. **Parse AI Output and Prepare New Record:**  
    - Add a **Code** node named “Parse Output” that:  
      - Parses the JSON from GPT-4 response  
      - Extracts last `week_ending` from “Search records1” data  
      - Adds 7 days to last week date for next campaign week  
      - Sets initial performance metrics to zero  
      - Returns data JSON for Airtable insert  

11. **Create New Airtable Record:**  
    - Add an **Airtable Create** node named “Create a record” with:  
      - Base and Table as before  
      - Map fields for AI-generated recommendations (`decision`, `test_variable`, `test_hypothesis`, etc.) and zeroed metrics  
      - Use Airtable credential  

12. **Connect Nodes in Sequence:**  
    - Connect triggers (manual and schedule) → Sendgrid Data Pull  
    - Sendgrid Data Pull → Data X-Form and Search records (parallel)  
    - Search records → Pull Most Recent Week  
    - Data X-Form and Pull Most Recent Week → Merge  
    - Merge → Update record → Search records1 → Previous Week Analysis → Parse Output → Create a record  

13. **Add Sticky Notes (Optional):**  
    - Add descriptive sticky notes per workflow section for clarity, including prompt injection and integration instructions.  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Context or Link                                                                                                                                                                                                                                                                                          |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| This workflow automates continuous email campaign improvement by integrating SendGrid metrics, Airtable data storage, and GPT-4 AI for data-driven optimization recommendations. It requires setup of Airtable base with an appropriate schema and SendGrid API key for stats retrieval. OpenAI API credentials are needed for GPT-4 analysis.                                                                                                                                                                          | Workflow purpose and requirements                                                                                                                                                                                                                                                                      |
| The detailed GPT-4 prompt is embedded in a sticky note titled “Prompt Injection” and must be included verbatim to ensure correct AI output format and interpretability.                                                                                                                                                                                                                                                                                                                                     | Prompt Injection Sticky Note (Sticky Note3)                                                                                                                                                                                                                                                           |
| Integration instructions recommend adding “Get Record” and “Update Record” nodes before and after your email sending node in your main campaign workflow, linking this analysis workflow’s Airtable table to keep data synchronized. The code snippets and node naming conventions facilitate this integration.                                                                                                                                                                                                 | Integration instructions Sticky Note (Sticky Note5)                                                                                                                                                                                                                                                    |
| Airtable schema fields include metrics and AI recommendation fields such as `decision`, `test_variable`, `test_hypothesis`, `confidence_level`, `test_directive`, and `implementation_instruction` for structured campaign tracking.                                                                                                                                                                                                                                                                      | Airtable Base: “apptBBudqpCku19Sw”, Table: “Email Campaign Performance”                                                                                                                                                                                                                                 |
| The workflow uses Airtable Personal Access Token authentication and SendGrid HTTP Header authentication; ensure these credentials are configured in n8n securely.                                                                                                                                                                                                                                                                                                                                             | Credential notes                                                                                                                                                                                                                                                                                        |
| Ensure error handling for API limits, authentication failures, and empty data sets, especially on nodes interacting with external services (SendGrid, Airtable, OpenAI). Consider adding error triggers or fallback logic for robustness.                                                                                                                                                                                                                                                                      | General error handling advice                                                                                                                                                                                                                                                                           |

---

**Disclaimer:** The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected content. All data processed is legal and public.