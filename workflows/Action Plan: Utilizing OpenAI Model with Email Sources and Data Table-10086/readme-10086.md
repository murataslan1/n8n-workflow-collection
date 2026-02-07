Action Plan: Utilizing OpenAI Model with Email Sources and Data Table

https://n8nworkflows.xyz/workflows/action-plan--utilizing-openai-model-with-email-sources-and-data-table-10086


# Action Plan: Utilizing OpenAI Model with Email Sources and Data Table

### 1. Workflow Overview

This workflow, titled **"Action Plan: Utilizing OpenAI Model with Email Sources and Data Table"**, is designed to automate the extraction and structuring of important data from incoming emails originating from multiple email platforms (Gmail, Outlook, IMAP). Its core purpose is to convert unstructured email content into a structured, easy-to-query format stored in a data table for downstream use such as reporting, searching, or further automation.

The workflow is logically divided into the following blocks:

- **1.1 Email Input Reception:** Listens for incoming emails from Gmail, Microsoft Outlook, and generic IMAP sources.
- **1.2 AI Parsing Agent:** Uses an AI agent (OpenAI GPT-4 model or Google Gemini) to analyze and parse the raw email data into structured JSON.
- **1.3 Structured Output Processing:** Applies a structured output parser to validate and normalize the AI output according to a predefined JSON schema.
- **1.4 Data Storage:** Inserts the structured data into a predefined n8n Data Table for persistent storage and querying.
- **1.5 Interactive Email Search Interface:** Enables querying the stored data via an AI-powered chat interface, allowing dynamic email searches based on filters.

---

### 2. Block-by-Block Analysis

#### 2.1 Email Input Reception

- **Overview:**  
  This block captures incoming emails from three different sources and triggers the workflow for each new email.

- **Nodes Involved:**  
  - Gmail Trigger  
  - Microsoft Outlook Trigger  
  - Email Trigger (IMAP)

- **Node Details:**

  - **Gmail Trigger**  
    - Type: Gmail Trigger  
    - Role: Watches Gmail inbox for new emails every minute.  
    - Configuration: Polling mode set to every minute, no filters applied.  
    - Credentials: Gmail OAuth2 account “n3w.it”.  
    - Input: None (event-driven).  
    - Output: Emits raw email data when new email arrives.  
    - Edge Cases: Authentication failures, Gmail API rate limiting, network timeouts.

  - **Microsoft Outlook Trigger**  
    - Type: Microsoft Outlook Trigger  
    - Role: Watches Outlook inbox for new emails every minute.  
    - Configuration: Polling mode every minute, no filters.  
    - Credentials: Microsoft Outlook OAuth2 account “dave85heat@hotmail.it”.  
    - Input: None (event-driven).  
    - Output: Emits raw email data on new message.  
    - Edge Cases: OAuth token expiry, API limits, connectivity issues.

  - **Email Trigger (IMAP)**  
    - Type: EmailReadIMAP node  
    - Role: Monitors a generic IMAP mailbox for new emails.  
    - Configuration: Default IMAP options, no filters.  
    - Credentials: IMAP account “info@n3witalia.com”.  
    - Input: None (event-driven).  
    - Output: Raw email data on arrival.  
    - Edge Cases: IMAP connection drops, invalid credentials, mailbox errors.

---

#### 2.2 AI Parsing Agent

- **Overview:**  
  This block receives raw email JSON from any email trigger and sends it to an AI agent designed to parse and extract important metadata and summaries from the email body.

- **Nodes Involved:**  
  - Parsing Agent  
  - OpenAI Chat Model (GPT-4)  
  - Google Gemini Chat Model (optional, for AI model variant)

- **Node Details:**

  - **Parsing Agent**  
    - Type: Langchain Agent  
    - Role: Central AI logic node that receives JSON input of emails and extracts structured data fields.  
    - Configuration:  
      - System message defines role and instructions to extract “from”, “to”, “subject”, and “summary” fields from the email body.  
      - Outputs a JSON array of parsed email objects with nulls if data is missing.  
      - Uses output parser to enforce JSON output only.  
    - Input Connections: From Gmail Trigger, Outlook Trigger, IMAP Trigger, and OpenAI Chat Model.  
    - Output: Parsed JSON data with extracted fields.  
    - Edge Cases: AI model response errors, malformed input JSON, rate limits, parsing failures.

  - **OpenAI Chat Model**  
    - Type: Langchain OpenAI Chat Model  
    - Role: Provides GPT-4.1-mini model inference for parsing tasks.  
    - Configuration: Model set to “gpt-4.1-mini”, no additional options.  
    - Credentials: OpenAI API account “Eure”.  
    - Input: Receives prompt from Parsing Agent.  
    - Output: AI-generated text to Parsing Agent.  
    - Edge Cases: API key invalid, rate limiting, network timeouts.

  - **Google Gemini Chat Model**  
    - Type: Langchain Google Gemini Chat Model  
    - Role: Optional alternative AI model for parsing or assistance.  
    - Configuration: Default options.  
    - Credentials: Google Palm API account.  
    - Input: Connected to Email Agent in the interactive search flow.  
    - Edge Cases: API quota, authentication errors.

---

#### 2.3 Structured Output Processing

- **Overview:**  
  This block validates and normalizes the AI response ensuring it conforms to a strict JSON schema with the four key fields.

- **Nodes Involved:**  
  - Structured Output Parser  
  - OpenAI Chat Model1

- **Node Details:**

  - **Structured Output Parser**  
    - Type: Langchain Output Parser Structured  
    - Role: Parses and auto-fixes AI output to match the schema: {from, to, subject, summarize} all as strings.  
    - Configuration:  
      - Schema defined manually with all fields as strings.  
      - Auto-fix enabled to correct minor formatting issues.  
    - Input: Output text from OpenAI Chat Model1.  
    - Output: Validated JSON object.  
    - Edge Cases: Parsing errors if AI output is not JSON or incomplete.

  - **OpenAI Chat Model1**  
    - Type: Langchain OpenAI Chat Model  
    - Role: Another instance of GPT-4.1-mini used to refine or confirm structured output before parsing.  
    - Credentials: Same OpenAI API account.  
    - Input: AI prompt related to output confirmation.  
    - Output: Text for parser.  
    - Edge Cases: Same as other OpenAI model nodes.

---

#### 2.4 Data Storage

- **Overview:**  
  Inserts the cleaned, structured data into a persistent data table for indexing and future querying.

- **Nodes Involved:**  
  - Insert row (Data Table node)

- **Node Details:**

  - **Insert row**  
    - Type: Data Table Node  
    - Role: Inserts a new record into an n8n data table named “Email output parser.”  
    - Configuration:  
      - Columns mapped: From, To, Subject, Summary from the parsed JSON.  
      - Mapping mode: Defined manually.  
    - Input: Structured JSON from Parsing Agent output.  
    - Output: Confirmation of data insertion.  
    - Edge Cases: Table access errors, data type mismatches, API limits.

---

#### 2.5 Interactive Email Search Interface

- **Overview:**  
  This block enables users to query the stored email data via an AI chat interface, applying dynamic filters and retrieving results from the data table.

- **Nodes Involved:**  
  - When chat message received (Langchain Chat Trigger)  
  - Email Agent (Langchain Agent)  
  - Emails (Data Table Tool)  
  - Google Gemini Chat Model (optional for AI processing)

- **Node Details:**

  - **When chat message received**  
    - Type: Langchain Chat Trigger  
    - Role: Webhook that listens for incoming chat messages from users.  
    - Configuration: Default, no filters.  
    - Input: External chat messages.  
    - Output: Triggers Email Agent node.  
    - Edge Cases: Webhook availability, message format issues.

  - **Email Agent**  
    - Type: Langchain Agent  
    - Role: Processes chat queries using a system prompt specifying to use the “Emails” tool for searches.  
    - Configuration: System message instructs to always use the “Emails” tool.  
    - Input: Chat message from trigger and AI model output.  
    - Output: Filtered search queries for data table.  
    - Edge Cases: AI misunderstanding query, tool integration failures.

  - **Emails**  
    - Type: Data Table Tool  
    - Role: Executes filtered searches on the “Email output parser” data table based on dynamic conditions from the AI agent.  
    - Configuration:  
      - Filters on From, To, Subject, Summary fields with case-insensitive partial matches.  
      - Return all results optionally.  
    - Input: Search conditions from Email Agent.  
    - Output: Matched email records.  
    - Edge Cases: Large data sets, filter parsing errors.

  - **Google Gemini Chat Model** (optional)  
    - Role: Alternative AI model for chat message processing.  
    - Credentials: Google Palm API.  
    - Edge Cases: Same as above.

---

### 3. Summary Table

| Node Name                 | Node Type                          | Functional Role                         | Input Node(s)                 | Output Node(s)                 | Sticky Note                                                                                                                                            |
|---------------------------|----------------------------------|---------------------------------------|------------------------------|-------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| Gmail Trigger             | Gmail Trigger                    | Watches Gmail inbox for new emails    | -                            | Parsing Agent                 | Covers email input from Gmail as part of multi-source email ingestion (see Sticky Note2)                                                               |
| Microsoft Outlook Trigger | Microsoft Outlook Trigger        | Watches Outlook inbox for new emails  | -                            | Parsing Agent                 | Covers email input from Outlook as part of multi-source email ingestion (see Sticky Note2)                                                             |
| Email Trigger (IMAP)      | EmailRead IMAP                   | Watches generic IMAP mailbox           | -                            | Parsing Agent                 | Covers email input from IMAP as part of multi-source email ingestion (see Sticky Note2)                                                                |
| Parsing Agent             | Langchain Agent                  | Parses raw emails into structured JSON| Gmail Trigger, Outlook Trigger, IMAP Trigger, OpenAI Chat Model | Insert row                    | Uses AI to extract From, To, Subject, Summary from emails (see Sticky Note)                                                                             |
| OpenAI Chat Model         | Langchain OpenAI Chat Model      | Provides GPT-4 AI model for parsing   | Parsing Agent (ai_languageModel) | Parsing Agent                | GPT-4.1-mini model used for email parsing                                                                                                             |
| OpenAI Chat Model1        | Langchain OpenAI Chat Model      | Refines AI output for structured parsing | -                            | Structured Output Parser      | GPT-4.1-mini instance for output confirmation                                                                                                        |
| Structured Output Parser  | Langchain Output Parser Structured| Validates AI JSON output structure    | OpenAI Chat Model1            | Parsing Agent                 | Ensures output matches schema: From, To, Subject, Summarize                                                                                           |
| Insert row                | Data Table Node                  | Inserts parsed data into Data Table   | Parsing Agent                 | -                             | Maps From, To, Subject, Summary fields (see Sticky Note1)                                                                                            |
| When chat message received| Langchain Chat Trigger           | Listens for interactive chat queries  | -                            | Email Agent                  | Entry point for AI-based email searches                                                                                                              |
| Email Agent               | Langchain Agent                  | Processes chat queries and accesses Emails Data Table | When chat message received, OpenAI Chat Model, Google Gemini Chat Model | Emails                       | Uses “Emails” tool for searching stored emails                                                                                                       |
| Emails                    | Data Table Tool                  | Executes filtered queries on Data Table | Email Agent                  | Email Agent                   | Supports dynamic search filters on From, To, Subject, Summary                                                                                        |
| Google Gemini Chat Model  | Langchain Google Gemini Chat Model| Alternate AI model for chat interaction | -                            | Email Agent                  | Optional AI model for chat (Google Gemini)                                                                                                          |
| Sticky Note               | Sticky Note                     | Workflow explanatory comment          | -                            | -                             | Describes overall workflow purpose and AI parsing approach                                                                                           |
| Sticky Note1              | Sticky Note                     | Instruction to create Data Table      | -                            | -                             | Specifies table fields: From, To, Subject, Summary                                                                                                  |
| Sticky Note2              | Sticky Note                     | Instruction to connect triggers       | -                            | -                             | Lists Gmail, Outlook, IMAP as email sources                                                                                                         |
| Sticky Note3              | Sticky Note                     | Instruction for structured data mapping| -                            | -                             | Advises on JSON structured data mapping                                                                                                             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Data Table:**  
   - Go to n8n Data Tables.  
   - Create a table named “Email output parser” with the columns: From (string), To (string), Subject (string), Summary (string).

2. **Set Up Email Triggers:**  
   - Add a **Gmail Trigger** node:  
     - Configure with Gmail OAuth2 credentials.  
     - Set to poll every minute without filters.  
   - Add a **Microsoft Outlook Trigger** node:  
     - Configure with Outlook OAuth2 credentials.  
     - Poll every minute, no filters.  
   - Add an **Email Trigger (IMAP)** node:  
     - Configure with IMAP credentials (host, port, auth).  
     - Default options, no filters.

3. **Add Langchain OpenAI Chat Model Node:**  
   - Type: `lmChatOpenAi`  
   - Model: Select “gpt-4.1-mini”.  
   - Provide OpenAI API credentials.

4. **Add Parsing Agent Node:**  
   - Type: Langchain Agent.  
   - Parameters:  
     - Input text: `={{JSON.stringify($json)}}` to pass the entire email JSON.  
     - System message: Specify parsing instructions to extract “from”, “to”, “subject”, and “summarize” fields from email body with strict JSON output.  
     - Enable output parser.  
   - Connect outputs of the three email trigger nodes and the OpenAI Chat Model node to this agent’s inputs as appropriate.

5. **Add Structured Output Parser Node:**  
   - Type: Langchain Output Parser Structured.  
   - Configure manual JSON schema with fields: from, to, subject, summarize (all strings).  
   - Enable auto-fix to handle minor AI output format errors.

6. **Add Second OpenAI Chat Model Node (OpenAI Chat Model1):**  
   - Same configuration as first OpenAI Chat Model (gpt-4.1-mini).  
   - Connect this node to produce output to Structured Output Parser for refining AI output.

7. **Add Data Table Insert Row Node:**  
   - Select the created data table “Email output parser”.  
   - Map columns:  
     - From → `={{ $json.output.from }}`  
     - To → `={{ $json.output.to }}`  
     - Subject → `={{ $json.output.subject }}`  
     - Summary → `={{ $json.output.summarize }}`

8. **Connect Parsing Agent output to Insert Row node to store data.**

9. **Set up Interactive Email Search:**  
   - Add **When chat message received** (Langchain Chat Trigger) node.  
   - Add **Email Agent** (Langchain Agent):  
     - System message instructs to always use “Emails” tool for searches.  
   - Add **Emails** Data Table Tool node:  
     - Operation: Get.  
     - Data table: “Email output parser”.  
     - Filters: Add conditions for From, To, Subject, Summary with “ilike” (case-insensitive partial match).  
     - Return all results: configurable boolean.  
   - Optionally add **Google Gemini Chat Model** node with Google Palm API credentials for AI chat enhancements.  
   - Connect nodes in this order:  
     When chat message received → Email Agent → Emails → Email Agent (for results).

10. **Verify and Activate Workflow:**  
    - Confirm all credentials are valid.  
    - Test triggers by sending test emails.  
    - Test chat interface for querying stored emails.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                             | Context or Link                                                                                                                                                                        |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| This workflow automates transforming unstructured emails from multiple sources into structured, summarized data stored in a database table for easy querying and integration.                                                                             | Sticky Note describing workflow purpose and AI approach.                                                                                                                             |
| Create an n8n data table with columns: From, To, Subject, Summary before running workflow to ensure proper data insertion.                                                                                                                                | Sticky Note1 instructions.                                                                                                                                                            |
| Connect triggers from Gmail, Outlook, and IMAP to central parsing for maximum email source coverage.                                                                                                                                                      | Sticky Note2 instructions.                                                                                                                                                            |
| Use JSON structured fields to maintain consistent data format and enable easy data table mapping.                                                                                                                                                         | Sticky Note3 instructions.                                                                                                                                                            |
| Workflow uses GPT-4.1-mini model from OpenAI for parsing and optionally Google Gemini (PaLM) model for chat interface.                                                                                                                                     | API credential notes.                                                                                                                                                                 |
| For detailed n8n Langchain node documentation and advanced configuration, visit: https://docs.n8n.io/                                                                                                               | Official n8n documentation.                                                                                                                                                           |

---

**Disclaimer:** The provided documentation is based exclusively on an automated n8n workflow. It complies with all content policies and processes only legal and public data.