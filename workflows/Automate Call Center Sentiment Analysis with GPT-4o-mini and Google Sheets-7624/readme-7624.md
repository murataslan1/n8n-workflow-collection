Automate Call Center Sentiment Analysis with GPT-4o-mini and Google Sheets

https://n8nworkflows.xyz/workflows/automate-call-center-sentiment-analysis-with-gpt-4o-mini-and-google-sheets-7624


# Automate Call Center Sentiment Analysis with GPT-4o-mini and Google Sheets

---
### 1. Workflow Overview

This workflow automates sentiment analysis of call center transcripts using GPT-4o-mini via OpenAI and Google Sheets as a data source and sink. It is designed for contact centers or customer service teams that wish to analyze conversation transcripts for sentiment, agent performance, and issue resolution metrics in an automated and scalable way.

**Use Cases:**  
- Automated sentiment extraction from customer-agent conversations  
- Structured evaluation of call center transcripts (friendliness, problem solving, sentiment changes)  
- Storing analyzed results back into Google Sheets for reporting and tracking  

**Logical Blocks:**

- **1.1 Scheduled Data Retrieval:** Trigger workflow daily at a set hour to fetch all unprocessed transcripts from Google Sheets.
- **1.2 Batch Processing of Transcripts:** Loop over each transcript record to process individually.
- **1.3 AI Analysis:** Send transcript text to GPT-4o-mini model configured for sentiment and metadata extraction.
- **1.4 Structured Output Parsing:** Parse GPT response into structured JSON fields.
- **1.5 Result Storage:** Update the Google Sheet row with analysis results and mark status as “Done”.

---

### 2. Block-by-Block Analysis

#### Block 1.1: Scheduled Data Retrieval

- **Overview:**  
This block triggers the workflow at 19:00 daily, then reads all transcripts from a specified Google Sheet where the status filter applies.

- **Nodes Involved:**  
  - Schedule Trigger  
  - Get All Transcript  

- **Node Details:**

  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Role: Initiates the workflow every day at 19:00 hours.  
    - Configuration: Trigger set at hour 19 (7 PM) daily.  
    - Input: None  
    - Output: Fires the workflow trigger  
    - Edge cases: Workflow may miss trigger if n8n instance down or time zone mismatch.

  - **Get All Transcript**  
    - Type: Google Sheets  
    - Role: Reads all rows from the configured Google Sheet where transcript status filter applies.  
    - Configuration: Reads from sheet “Sheet1” (gid=0) in document ID "1aWU28D_73nvkDMPfTkPkaV53kHgX7cg0W4NwLzGFEGU". Filters rows using column “Status” (likely to get only new or pending transcripts).  
    - Input: Trigger from Schedule Trigger node  
    - Output: List of transcript records for further processing  
    - Credentials: Google Sheets OAuth2  
    - Edge cases: Google API rate limits, permission errors, empty or malformed sheet data.

---

#### Block 1.2: Batch Processing of Transcripts

- **Overview:**  
This block splits the retrieved transcript list into individual items and prepares each for analysis.

- **Nodes Involved:**  
  - Loop Over Items  
  - Send only Transcript Field  

- **Node Details:**

  - **Loop Over Items**  
    - Type: Split In Batches  
    - Role: Iterates over each transcript row independently to enable processing one-by-one.  
    - Configuration: Default batching (likely batch size = 1).  
    - Input: Output from Get All Transcript  
    - Output: Single transcript JSON object passed downstream  
    - Edge cases: Large dataset may cause rate-limiting or slow processing.

  - **Send only Transcript Field**  
    - Type: Set  
    - Role: Extracts only the “Full Transcript” field from the current item to pass to analysis.  
    - Configuration: Assigns a new field called “Full Transcript” with value from input JSON field “Full Transcript”.  
    - Input: Single transcript item from Loop Over Items  
    - Output: JSON containing only transcript text  
    - Edge cases: Missing “Full Transcript” field or empty transcript text may cause AI model failure.

---

#### Block 1.3: AI Analysis

- **Overview:**  
This block sends the transcript text to an AI agent built on GPT-4o-mini to perform advanced sentiment analysis and extract structured fields.

- **Nodes Involved:**  
  - OpenAI Chat Model  
  - Analysis Transcript  
  - Structured Output  

- **Node Details:**

  - **OpenAI Chat Model**  
    - Type: LangChain OpenAI Chat Model  
    - Role: Provides the underlying GPT-4o-mini model connection for AI processing.  
    - Configuration: Model set to “gpt-4o-mini”, no extra options specified.  
    - Credentials: OpenAI API with key named “InfyOm”.  
    - Input: Receives message context from Analysis Transcript node.  
    - Output: AI-generated response to Analysis Transcript node.  
    - Edge cases: API key invalid, rate limits, network timeouts.

  - **Analysis Transcript**  
    - Type: LangChain Agent  
    - Role: Sends the “Full Transcript” text to AI with a system prompt to extract sentiment and metadata fields in JSON.  
    - Configuration:  
      - Text input: from “Full Transcript” field.  
      - System message instructs AI to return JSON with fields: Topic, Customer Name, Agent Name, Greeting Sentiment (1-5), Closing Sentiment (1-5), Problem Solving (1-5), Agent Friendliness (1-5), Customer Sentiment (Before → After), Issue Resolved (Yes/No/Partially).  
      - Uses structured output parser.  
    - Input: Transcript text from “Send only Transcript Field” node  
    - Output: AI response JSON passed to Structured Output node  
    - Edge cases: AI misinterpretation, incomplete JSON response, long transcript truncation.

  - **Structured Output**  
    - Type: LangChain Structured Output Parser  
    - Role: Parses AI response into well-defined JSON object with expected schema.  
    - Configuration: Example JSON schema provided for consistent output.  
    - Input: Raw AI text from Analysis Transcript node.  
    - Output: Parsed JSON with sentiment fields, ready for storage.  
    - Edge cases: Parsing errors if AI output format deviates, missing fields.

---

#### Block 1.4: Result Storage

- **Overview:**  
This final block updates the original Google Sheet row with sentiment results and changes status to “Done” to mark processing completion.

- **Nodes Involved:**  
  - Store Analysis Transcript  
  - Loop Over Items (to continue batch processing)

- **Node Details:**

  - **Store Analysis Transcript**  
    - Type: Google Sheets  
    - Role: Updates the source Google Sheet row with sentiment fields and computed average score.  
    - Configuration:  
      - Updates columns: Status = “Done”; Agent Name, Customer Name, Issue Resolved, and detailed sentiment scores from AI output.  
      - Calculates “Total Rating” as average of Greeting Sentiment, Closing Sentiment, Problem Solving, Agent Friendliness.  
      - Matches row by “Full Transcript” field to update correct row.  
      - Sheet and document same as initial retrieval.  
    - Input: Parsed JSON output from Structured Output node and original transcript from Loop Over Items node.  
    - Output: Confirmation of update, loops back to next item.  
    - Credentials: Google Sheets OAuth2  
    - Edge cases: Row matching fails, Google Sheets API errors, concurrent updates.

  - **Loop Over Items (output connection)**  
    - Connects back to process next transcript in batch until all done.

---

#### Block 1.5: Sticky Note (Documentation)

- **Overview:**  
Provides a reference link to the sample Google Sheet used in this workflow for testing and demonstration.

- **Nodes Involved:**  
  - Sticky Note  

- **Node Details:**

  - **Sticky Note**  
    - Type: Sticky Note  
    - Role: Documentation reference within the workflow editor.  
    - Content: Link to sample Google Sheet:  
      https://docs.google.com/spreadsheets/d/1aWU28D_73nvkDMPfTkPkaV53kHgX7cg0W4NwLzGFEGU/edit?gid=0#gid=0  
    - Position: Top-left for visibility.  
    - No input/output connections.

---

### 3. Summary Table

| Node Name               | Node Type                            | Functional Role                      | Input Node(s)             | Output Node(s)           | Sticky Note                                                                                   |
|-------------------------|------------------------------------|------------------------------------|---------------------------|--------------------------|----------------------------------------------------------------------------------------------|
| Schedule Trigger        | Schedule Trigger                   | Triggers workflow daily at 19:00   | –                         | Get All Transcript        |                                                                                              |
| Get All Transcript      | Google Sheets                     | Fetches transcripts from sheet     | Schedule Trigger           | Loop Over Items           |                                                                                              |
| Loop Over Items         | Split In Batches                  | Iterates over transcripts one-by-one| Get All Transcript         | Send only Transcript Field, Loop Over Items |                                                                                              |
| Send only Transcript Field | Set                            | Extracts transcript text field     | Loop Over Items (batch 1)  | Analysis Transcript       |                                                                                              |
| OpenAI Chat Model       | LangChain OpenAI Chat Model       | Provides GPT-4o-mini AI model      | Analysis Transcript (AI LM)| Analysis Transcript (AI LM)|                                                                                              |
| Analysis Transcript     | LangChain Agent                   | Sends transcript to AI for analysis| Send only Transcript Field | Store Analysis Transcript |                                                                                              |
| Structured Output       | LangChain Structured Output Parser| Parses AI JSON output               | Analysis Transcript        | Store Analysis Transcript |                                                                                              |
| Store Analysis Transcript| Google Sheets                    | Updates Google Sheet with results  | Structured Output, Loop Over Items | Loop Over Items         |                                                                                              |
| Sticky Note             | Sticky Note                      | Documentation link to sample sheet | –                         | –                        | [Sample Google Sheet](https://docs.google.com/spreadsheets/d/1aWU28D_73nvkDMPfTkPkaV53kHgX7cg0W4NwLzGFEGU/edit?gid=0#gid=0) |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node:**  
   - Type: Schedule Trigger  
   - Set rule to trigger daily at 19:00 (7 PM).  

2. **Add a Google Sheets node named “Get All Transcript”:**  
   - Operation: Read rows  
   - Document ID: `1aWU28D_73nvkDMPfTkPkaV53kHgX7cg0W4NwLzGFEGU`  
   - Sheet Name: `Sheet1` (gid=0)  
   - Filter rows by “Status” column to select unprocessed transcripts (e.g., Status != “Done”)  
   - Connect Schedule Trigger output to this node.  
   - Configure Google Sheets OAuth2 credentials.

3. **Add a Split In Batches node named “Loop Over Items”:**  
   - Default batch size (1)  
   - Connect output of “Get All Transcript” to input of this node.

4. **Add a Set node named “Send only Transcript Field”:**  
   - Add one field assignment:  
     - Name: Full Transcript  
     - Value: Expression `{{$json["Full Transcript"]}}`  
   - Connect “Loop Over Items” output to this node.

5. **Add an OpenAI Chat Model node:**  
   - Type: LangChain OpenAI Chat Model  
   - Model: `gpt-4o-mini`  
   - Credentials: Use your OpenAI API key (credential named e.g. “InfyOm”)  
   - No additional options required.

6. **Add a LangChain Agent node named “Analysis Transcript”:**  
   - Text input: Expression `{{$json["Full Transcript"]}}`  
   - System Message prompt:  
     ```
     You are an advanced AI assistant specialized in sentiment analysis for customer service conversations.

     Your task is to extract structured data from a customer service chat transcript. Return values for each field listed below.

     Respond in JSON format using structured output tool with the following fields:

     - Topic (Topic name for discussion like 'Medical Report','shipping delay')
     - Customer Name
     - Agent Name
     - Greeting Sentiment (1 to 5, where 5 is very polite/friendly/Greeting and 1 is rude)
     - Closing Sentiment (1 to 5, where 5 is very Closing polite/friendly and 1 is rude)
     - Problem Solving (1 to 5, where 5 is excellent and 1 is poor)
     - Agent Friendliness (1 to 5, where 5 is very polite/friendly and 1 is rude)
     - Customer Sentiment (Before → After, e.g. "Angry → Satisfied")
     - Issue Resolved (Yes / No / Partially)
     ```
   - Enable structured output parser.  
   - Connect “Send only Transcript Field” node output to this node.  
   - Connect “OpenAI Chat Model” node as AI model for this node.

7. **Add a LangChain Structured Output Parser node named “Structured Output”:**  
   - Provide JSON schema example as in the system message.  
   - Connect “Analysis Transcript” node’s AI output to this node.

8. **Add a Google Sheets node named “Store Analysis Transcript”:**  
   - Operation: Update row  
   - Document ID and Sheet Name: same as “Get All Transcript”  
   - Use “Full Transcript” as matching column to identify correct row.  
   - Set columns to update:  
     - Status: “Done”  
     - Agent Name, Customer Name, Issue Resolved, Greeting Sentiment, Closing Sentiment, Problem Solving, Agent Friendliness, Customer Sentiment, Conversations Topics from parsed AI output  
     - Total Rating: Calculate average of Greeting Sentiment, Closing Sentiment, Problem Solving, and Agent Friendliness using an expression like:  
       `{{(Number($json.output["Greeting Sentiment"]) + Number($json.output["Closing Sentiment"]) + Number($json.output["Problem Solving"]) + Number($json.output["Agent Friendliness"]))/4}}`  
     - Full Transcript: Original transcript text from Loop Over Items current item  
   - Connect “Structured Output” and “Loop Over Items” nodes as inputs to this node.  
   - Connect output back to “Loop Over Items” main input to continue batch.

9. **Add a Sticky Note for documentation:**  
   - Content:  
     ```
     ### Sample Google Sheet

     https://docs.google.com/spreadsheets/d/1aWU28D_73nvkDMPfTkPkaV53kHgX7cg0W4NwLzGFEGU/edit?gid=0#gid=0
     ```  
   - Place near start of workflow for reference.

---

### 5. General Notes & Resources

| Note Content                                                                                                 | Context or Link                                                                                          |
|--------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| Sample Google Sheet used in this workflow with transcripts and columns for analysis results.                 | https://docs.google.com/spreadsheets/d/1aWU28D_73nvkDMPfTkPkaV53kHgX7cg0W4NwLzGFEGU/edit?gid=0#gid=0     |
| AI system prompt carefully crafted to produce JSON output suitable for structured parsing and sheet updates. | Internal prompt in “Analysis Transcript” LangChain Agent node.                                           |
| Ensure Google Sheets OAuth2 credentials have write permissions for updating rows.                            | Critical for “Get All Transcript” and “Store Analysis Transcript” nodes.                                 |
| OpenAI GPT-4o-mini model requires valid API key and connectivity; watch for rate limits or quota exhaustion.| Credential named “InfyOm” in workflow.                                                                  |

---

**Disclaimer:** The text provided is extracted exclusively from an n8n automation workflow. It complies fully with content policies and handles only legal and public data.