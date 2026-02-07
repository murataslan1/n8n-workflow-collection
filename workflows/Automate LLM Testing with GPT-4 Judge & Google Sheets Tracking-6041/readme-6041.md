Automate LLM Testing with GPT-4 Judge & Google Sheets Tracking

https://n8nworkflows.xyz/workflows/automate-llm-testing-with-gpt-4-judge---google-sheets-tracking-6041


# Automate LLM Testing with GPT-4 Judge & Google Sheets Tracking

### 1. Workflow Overview

This workflow automates the evaluation of Large Language Model (LLM) outputs using a GPT-4 based judge and tracks results in Google Sheets. It is designed for systematically testing LLM responses against reference answers, making it ideal for AI evaluation teams, product QA, or research groups assessing LLM performance in legal or domain-specific tasks.

The workflow is structured into the following logical blocks:

- **1.1 Input Reception & Test Case Fetching**  
  Initiates the process via manual trigger and retrieves test cases from a Google Sheet with input prompts and reference answers.

- **1.2 Sub-Workflow Execution: LLM Judging**  
  Sends individual test cases to an external webhook running a GPT-4 based judge that evaluates the LLM output versus the reference answer.

- **1.3 Parsing & Combining Results**  
  Parses the structured JSON output from the judge and merges it with original test data for comprehensive result records.

- **1.4 Result Storage**  
  Updates a Google Sheet with the combined data including the judge’s decision and reasoning for each test case.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Test Case Fetching

**Overview:**  
This block starts the workflow manually and fetches test cases from a Google Sheet named "Tests". Each test case has unique identifiers, input prompts, outputs from LLMs, and reference answers.

**Nodes Involved:**  
- Manual Trigger  
- Get Tests  
- Limit (disabled)

**Node Details:**

- **Manual Trigger**  
  - Type: Trigger node; starts the workflow on manual execution.  
  - Configuration: Default; no parameters needed.  
  - Input: None  
  - Output: Initiates flow to Get Tests  
  - Edge Cases: User must manually trigger; no auto-start.

- **Get Tests**  
  - Type: Google Sheets node; reads test case rows from the “Tests” sheet (gid=0).  
  - Configuration: Reads all rows from the specified Google Sheet URL; credentials use OAuth2.  
  - Input: Trigger from Manual Trigger  
  - Output: Outputs JSON array of test cases with columns: ID, Test No., AI Platform, Input, Output, Reference Answer.  
  - Edge Cases: Google Sheets API failures, OAuth errors, empty or malformed sheet data.

- **Limit** (disabled)  
  - Type: Limit node; restricts number of items processed.  
  - Configuration: maxItems=3 (disabled)  
  - Role: Could be used for testing with fewer cases.  
  - Input: From Get Tests  
  - Output: To Execute Subworkflow  
  - Edge Cases: Disabled, so no effect.

---

#### 2.2 Sub-Workflow Execution: LLM Judging

**Overview:**  
Each test case is sent individually to an external HTTP endpoint that uses GPT-4 to judge the correctness of the LLM output. This step batches requests but waits for each response before continuing.

**Nodes Involved:**  
- Execute Subworkflow (HTTP Request node)  
- Webhook (receives responses)  

**Node Details:**

- **Execute Subworkflow**  
  - Type: HTTP Request node  
  - Configuration:  
    - Method: POST  
    - URL: `https://webhook-processor-production-48f8.up.railway.app/webhook/llm-as-a-judge`  
    - Body: JSON, sends each test case item as-is  
    - Batching: Batch size 1, interval 500 ms (serial processing)  
    - On error: continues without stopping workflow  
  - Input: Test cases from Limit (or Get Tests if Limit disabled)  
  - Output: Forwards to Update Results after response  
  - Edge Cases: Request timeouts, unreachable webhook, response errors; continues on error.

- **Webhook**  
  - Type: Webhook node  
  - Configuration:  
    - HTTP Method: POST  
    - Path: `llm-as-a-judge`  
    - Responds with all entries, uses last node’s data for response  
  - Role: Receives asynchronous responses from the external judge service  
  - Input: HTTP POST requests from external judge  
  - Output: Sends data to “Keep Original Data” node  
  - Edge Cases: Webhook downtime, malformed incoming data.

---

#### 2.3 Parsing & Combining Results

**Overview:**  
This block extracts the HTTP webhook response body, applies a Langchain LLM chain to evaluate the judge’s output against a prompt, parses the structured JSON output, and combines it with original test data.

**Nodes Involved:**  
- Keep Original Data  
- Extract Data (Set node)  
- Basic LLM Chain (Langchain chainLlm node)  
- Structured Output Parser (Langchain outputParserStructured node)  
- Merge

**Node Details:**

- **Keep Original Data**  
  - Type: Set node  
  - Configuration: Stores the raw webhook response body in JSON format for downstream processing.  
  - Input: From Webhook  
  - Output: To Merge and Extract Data  
  - Edge Cases: If body missing or malformed, may cause downstream errors.

- **Extract Data**  
  - Type: Set node  
  - Configuration: Extracts the `body` property from the webhook JSON for use in LLM chain.  
  - Input: From Keep Original Data  
  - Output: To Basic LLM Chain  
  - Edge Cases: Missing or unexpected structure in `body` can cause errors.

- **Basic LLM Chain**  
  - Type: Langchain LLM Chain node  
  - Configuration:  
    - Uses OpenRouter Chat Model (GPT-4) as underlying LLM  
    - Prompt defines evaluation rules comparing test input, reference answer, and output  
    - Output format enforced as JSON with `decision` and `reasoning` keys  
  - Inputs: JSON with keys `task`, `answer_key`, and `output` extracted from Extract Data node  
  - Output: JSON evaluation result (Pass/Fail + reasoning)  
  - Edge Cases: GPT API errors, malformed prompt variables, rate limits.

- **Structured Output Parser**  
  - Type: Langchain Structured Output Parser node  
  - Configuration: Uses JSON schema example to parse LLM output into structured JSON for easy use  
  - Input: Output from Basic LLM Chain  
  - Output: Parsed JSON with `decision` and `reasoning` fields  
  - Edge Cases: Parser failures if LLM output deviates from expected JSON format.

- **Merge**  
  - Type: Merge node  
  - Configuration: Mode “combine by position” merges original data and parsed results side-by-side  
  - Inputs:  
    - From Basic LLM Chain (parsed output)  
    - From Keep Original Data (original webhook body)  
  - Output: Combined JSON object with full test case data plus judge’s decision and reasoning  
  - Edge Cases: Misaligned input arrays causing incorrect merges.

---

#### 2.4 Result Storage

**Overview:**  
The final combined results are appended or updated in a "Results" Google Sheet, capturing all test data along with the judge’s evaluation.

**Nodes Involved:**  
- Update Results

**Node Details:**

- **Update Results**  
  - Type: Google Sheets node  
  - Configuration:  
    - Operation: “appendOrUpdate” ensuring rows are updated or appended based on matching “ID” column  
    - Columns mapped: ID, Test No., AI Platform, Input, Output, Reference Answer, Decision (judge’s pass/fail), Reasoning  
    - Target Sheet: “Results” tab (gid=537199982) in the same Google Sheet document  
    - Credentials: OAuth2 Google Sheets  
  - Input: From Execute Subworkflow (HTTP Request node) — note: this is the actual trigger after judge response, ensuring data consistency  
  - Edge Cases: Google Sheets API rate limits, authentication issues, schema mismatches, row duplication.

---

### 3. Summary Table

| Node Name            | Node Type                          | Functional Role                                      | Input Node(s)                 | Output Node(s)               | Sticky Note                                                                                                         |
|----------------------|----------------------------------|-----------------------------------------------------|------------------------------|-----------------------------|---------------------------------------------------------------------------------------------------------------------|
| Manual Trigger       | Manual Trigger                   | Starts the workflow manually                         | -                            | Get Tests                   | ## 1. Fetch test cases\nWe start by grabbing our list of test cases stored in a Google Sheet ...                     |
| Get Tests            | Google Sheets                   | Fetches test cases from Google Sheets "Tests"       | Manual Trigger               | Limit                       | ## Data format\nOur Tests Sheet contains the following columns: ...                                                  |
| Limit                | Limit (disabled)                | Limits number of test cases to process (disabled)   | Get Tests                   | Execute Subworkflow          |                                                                                                                     |
| Execute Subworkflow   | HTTP Request                   | Sends test cases to external GPT-4 judging webhook  | Limit                       | Update Results              | ## 2. Execute Subworkflow\nThis node runs immediately (batching requests), but waits for the result ...              |
| Webhook              | Webhook                       | Receives judging results asynchronously              | External judge service       | Keep Original Data          |                                                                                                                     |
| Keep Original Data    | Set                           | Stores raw webhook response body for later use      | Webhook                     | Extract Data, Merge         |                                                                                                                     |
| Extract Data         | Set                           | Extracts body from webhook response                   | Keep Original Data           | Basic LLM Chain             |                                                                                                                     |
| Basic LLM Chain      | Langchain chainLlm            | Evaluates LLM output vs reference answer with GPT-4 | Extract Data                | Merge                      | ## 3. Judge LLM outputs\nOur prompt judges the LLM input/output and decides if the LLM passed the test ...          |
| OpenRouter Chat Model | Langchain lmChatOpenRouter    | Provides GPT-4 model for LLM Chain                    | Basic LLM Chain (ai_languageModel) | Basic LLM Chain         |                                                                                                                     |
| Structured Output Parser | Langchain outputParserStructured | Parses LLM output into structured JSON                | Basic LLM Chain (ai_outputParser) | Basic LLM Chain          |                                                                                                                     |
| Merge                | Merge                         | Combines original data with judge’s decision output  | Basic LLM Chain, Keep Original Data | Execute Subworkflow     |                                                                                                                     |
| Update Results       | Google Sheets                 | Updates "Results" sheet with combined test data      | Execute Subworkflow          | -                           | ## 4. Update results\nWe create a new row in our output sheet, containing our original data together ...             |
| Sticky Note4         | Sticky Note                   | Explains Execute Subworkflow node role                | -                            | -                           | ## 2. Execute Subworkflow\nThis node runs immediately (batching requests), but waits for the result before moving ...|
| Sticky Note8         | Sticky Note                   | Explains data format of Tests sheet                   | -                            | -                           | ## Data format\nOur Tests Sheet contains the following columns: ...                                                  |
| Sticky Note9         | Sticky Note                   | Explains initial test case fetching                   | -                            | -                           | ## 1. Fetch test cases\nWe start by grabbing our list of test cases stored in a Google Sheet ...                      |
| Sticky Note15        | Sticky Note                   | Explains Update Results node                           | -                            | -                           | ## 4. Update results\nWe create a new row in our output sheet, containing our original data together ...             |
| Sticky Note16        | Sticky Note                   | Explains judging logic and output parsing             | -                            | -                           | ## 3. Judge LLM outputs\nOur prompt judges the LLM input/output and decides if the LLM passed the test ...           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger node**  
   - Default settings; this starts the workflow manually.

2. **Add Google Sheets node ("Get Tests")**  
   - Operation: Read rows  
   - Document: Set URL to your Google Sheet containing test cases (e.g., https://docs.google.com/spreadsheets/d/1c73be3fHkKr0DVJYIt9qlNfJcfuUV6DTShp93fa55Ig/edit)  
   - Sheet: Use "Tests" tab (gid=0)  
   - Credentials: Configure OAuth2 Google Sheets account  
   - Connect Manual Trigger → Get Tests  

3. *(Optional)* Add Limit node to restrict tests during development (disabled in production)  
   - Set Max Items to desired number (e.g., 3)  
   - Connect Get Tests → Limit

4. **Add HTTP Request node ("Execute Subworkflow")**  
   - Method: POST  
   - URL: `https://webhook-processor-production-48f8.up.railway.app/webhook/llm-as-a-judge`  
   - Body Content Type: JSON  
   - Body: Pass entire item JSON (={{ $json }})  
   - Enable batching: Batch Size 1, Batch Interval 500 ms (to send requests one at a time)  
   - On Error: Continue  
   - Connect Limit (or Get Tests if Limit disabled) → Execute Subworkflow  

5. **Add Google Sheets node ("Update Results")**  
   - Operation: Append or Update  
   - Document: Same Google Sheet as above  
   - Sheet: "Results" tab (gid=537199982)  
   - Mapping Columns: Map all fields including ID, Test No., AI Platform, Input, Output, Reference Answer, Decision, Reasoning  
   - Matching Columns: ID (to update rows)  
   - Credentials: OAuth2 Google Sheets  
   - Connect Execute Subworkflow → Update Results  

6. **Add Webhook node ("Webhook")**  
   - HTTP Method: POST  
   - Path: llm-as-a-judge  
   - Response Data: All entries, response mode last node  
   - This node is configured to receive asynchronous responses from external judging service.

7. **Add Set node ("Keep Original Data")**  
   - Mode: Raw  
   - JSON Output: `={{ $json.body }}` (store webhook body)  
   - Connect Webhook → Keep Original Data  

8. **Add Set node ("Extract Data")**  
   - Mode: Raw  
   - JSON Output: `={{ $json.body }}`  
   - Connect Keep Original Data → Extract Data  

9. **Add Langchain LLM Chain node ("Basic LLM Chain")**  
   - Chain Type: LLM Chain  
   - Prompt: Define prompt to compare `task` (input), `answer_key` (reference), and `output` (LLM output) as per the detailed evaluation rules in the workflow description above.  
   - Input Variables: Map from Extract Data JSON fields  
   - Output: Expect JSON with `decision`, `reasoning`  
   - Connect Extract Data → Basic LLM Chain  

10. **Add Langchain OpenRouter Chat Model node ("OpenRouter Chat Model")**  
    - Model: openai/gpt-4.1  
    - Credentials: OpenRouter API (requires API key)  
    - Connect OpenRouter Chat Model → Basic LLM Chain (as AI language model)  

11. **Add Langchain Structured Output Parser node ("Structured Output Parser")**  
    - JSON Schema Example: Provide example schema matching expected JSON output (`decision` and `reasoning`)  
    - Connect Structured Output Parser → Basic LLM Chain (as output parser)  

12. **Add Merge node ("Merge")**  
    - Mode: Combine by position (side-by-side merge)  
    - Connect Basic LLM Chain → Merge (input 1)  
    - Connect Keep Original Data → Merge (input 2)  
    - Connect Merge → Execute Subworkflow (to continue updating Google Sheets)  

**Note:** The webhook node is part of the external judge communication and requires the webhook URL and path configured exactly as above.

---

### 5. General Notes & Resources

| Note Content                                                                                                         | Context or Link                                                                                   |
|----------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| The Tests sheet columns include: ID, Test No., AI Platform, Input, Output, Reference Answer.                          | Tests data format sticky note                                                                     |
| To start the workflow, manually click “Execute workflow” next to Manual Trigger node.                                | Initial workflow execution instructions sticky note                                               |
| The judge prompt strictly compares AI output to the reference answer, passing or failing based on factual correctness, completeness, and relevance. | Judging logic sticky note                                                                         |
| Uses OpenRouter GPT-4 model which allows flexible model selection and tuning.                                         | OpenRouter Chat Model node                                                                        |
| Results sheet is updated by appending or updating rows based on unique IDs, capturing all test data and judge decisions. | Results update sticky note                                                                        |
| Workflow respects n8n best practices for error handling, batching, and data parsing to ensure robustness.            | General workflow design considerations                                                           |
| Google Sheets credentials require OAuth2 setup with appropriate permissions to read/write specified sheets.          | Credential setup                                                                                  |
| External webhook URL must be reachable and stable to ensure judging service availability.                            | External dependency note                                                                          |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. The processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.