Automate Customer Support with WhatsApp AI Assistant using Google Docs & Gemini

https://n8nworkflows.xyz/workflows/automate-customer-support-with-whatsapp-ai-assistant-using-google-docs---gemini-6387


# Automate Customer Support with WhatsApp AI Assistant using Google Docs & Gemini

### 1. Workflow Overview

This workflow automates customer support interactions via WhatsApp by leveraging AI language models (Google Gemini and LangChain AI Agent) and internal business knowledge stored in Google Docs. It is designed primarily for the Black Ball Sporting Club to provide instant, accurate AI-driven responses to WhatsApp messages without requiring complex WhatsApp Business API setups. The workflow integrates live WhatsApp messages, reads updated internal documents, generates contextual AI answers, and responds automatically while logging interactions and enforcing a 24-hour response window.

Logical blocks are:

- **1.1 Input Reception:** Receives WhatsApp messages via WhapAround webhook.
- **1.2 Knowledge Retrieval:** Fetches the latest internal business document from Google Docs.
- **1.3 Prompt Preparation:** Combines WhatsApp message and document content into a formatted prompt.
- **1.4 AI Processing:** Uses Google Gemini and LangChain AI Agent nodes to generate a response.
- **1.5 Post-Processing:** Cleans and formats the AI-generated answer.
- **1.6 Response Timing & Routing:** Checks if the query is within a 24-hour window before responding.
- **1.7 Output & Logging:** Sends final answers back to WhatsApp and logs data into Google Sheets.
- **1.8 Supporting Components:** Memory buffer for session context and sticky notes for documentation and instructions.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:** Receives incoming WhatsApp messages through the WhapAround service and triggers the workflow.
- **Nodes Involved:**  
  - WhapAround - Listeing (Webhook)
- **Node Details:**  
  - **WhapAround - Listeing**  
    - Type: Webhook  
    - Role: Listens for POST requests from WhapAround with WhatsApp message data.  
    - Configuration: Path set to `30720c7c-18f4-4815-be3b-03343d53ee45`, HTTP method POST, responseMode set to responseNode.  
    - Input: External webhook POST from WhatsApp messages via WhapAround.  
    - Output: Passes JSON message data downstream.  
    - Failure modes: Webhook misconfiguration, unavailable WhapAround service, invalid payloads.

#### 1.2 Knowledge Retrieval

- **Overview:** Fetches the latest internal knowledge document from Google Docs to provide context for AI responses.
- **Nodes Involved:**  
  - company's knowledge (Google Docs)
- **Node Details:**  
  - **company's knowledge**  
    - Type: Google Docs  
    - Role: Retrieves document content using document URL (Google Doc ID).  
    - Configuration: Operation `get` on document URL `1Uv1WYCcXNlp-jaeJ7-3MNxWYfPj-wcYnJv4_colXSvk`.  
    - Input: Trigger from webhook node.  
    - Output: Document content JSON passed downstream.  
    - Failure modes: Google OAuth credential errors, document access permission errors, network timeouts.

#### 1.3 Prompt Preparation

- **Overview:** Constructs the final prompt string combining the current date, Google Doc content, and the incoming WhatsApp message.
- **Nodes Involved:**  
  - Prepare Prompt (AI Transform)
- **Node Details:**  
  - **Prepare Prompt**  
    - Type: AI Transform (JavaScript code execution)  
    - Role: Extracts and formats data into prompt for AI agents.  
    - Configuration:  
      - Extracts Google Doc content (plain text from body.content).  
      - Retrieves WhatsApp message body from `messages[0].text.body`.  
      - Formats today's date as `Month Day, Year`.  
      - Constructs `finalPrompt` string with date, document text, and user question.  
    - Inputs: JSON from Google Docs and webhook nodes.  
    - Outputs: JSON containing `finalPrompt`.  
    - Failure modes: Parsing errors if document structure changes, missing WhatsApp message body.

#### 1.4 AI Processing

- **Overview:** Uses AI models to generate a support answer based on the prompt and conversation context.
- **Nodes Involved:**  
  - Simple Memory (LangChain Memory Buffer Window)  
  - AI Agent (LangChain Agent)  
  - Google Gemini Chat Model
- **Node Details:**  
  - **Simple Memory**  
    - Type: LangChain memoryBufferWindow  
    - Role: Maintains conversation context/session per user WhatsApp ID.  
    - Configuration: Uses `wa_id` from WhatsApp contacts as session key.  
    - Inputs: Incoming prompt and session context.  
    - Outputs: Memory-enhanced prompt to AI Agent.  
    - Failure modes: Session key missing or malformed, memory overflow.  
  - **AI Agent**  
    - Type: LangChain Agent  
    - Role: Processes `finalPrompt` to produce AI response.  
    - Configuration:  
      - System message instructs to behave as Black Ball Sporting Club support assistant.  
      - Explicit instructions to avoid mentioning documents or date unless explicitly asked.  
      - Max 5 retry attempts, version 1.7.  
      - Output parser enabled for structured data.  
    - Inputs: Prompt from Prepare Prompt and memory node, language model from Google Gemini.  
    - Outputs: AI-generated answer JSON.  
    - Failure modes: API rate limits, timeouts, parsing errors.  
  - **Google Gemini Chat Model**  
    - Type: LangChain Google Gemini LLM  
    - Role: Provides the underlying AI language model.  
    - Configuration: Model set to `models/gemini-2.5-flash-preview-04-17-thinking`.  
    - Inputs: Prompt from AI Agent.  
    - Outputs: AI response text.  
    - Failure modes: API quota exceeded, authentication failure.

#### 1.5 Post-Processing

- **Overview:** Cleans and formats the AI-generated text to remove formatting artifacts and unwanted preambles.
- **Nodes Involved:**  
  - cleanAnswer (Code node)
- **Node Details:**  
  - **cleanAnswer**  
    - Type: Code (JavaScript)  
    - Role: Removes markdown formatting, converts hyperlinks to plain text, collapses blank lines, and removes unwanted source references.  
    - Key code steps:  
      - Remove bold/italic/strike markers (`*`, `_`, `~`).  
      - Convert `[text](url)` to `text url`.  
      - Collapse 3+ newlines to 2.  
      - Strip phrases like "based on the document you provided".  
    - Input: AI Agent output JSON containing answer text.  
    - Output: Cleaned answer string in JSON.  
    - Failure modes: Unexpected text formats or empty outputs.

#### 1.6 Response Timing & Routing

- **Overview:** Ensures responses are only sent if the user’s message is within a 24-hour window to avoid stale replies.
- **Nodes Involved:**  
  - 24-hour window check (Code node)  
  - If (Conditional)
- **Node Details:**  
  - **24-hour window check**  
    - Type: Code (JavaScript)  
    - Role: Compares current time with WhatsApp message timestamp to verify if within last 24 hours.  
    - Input: Message timestamp from webhook node.  
    - Output: Boolean `withinWindow` flag, plus answer and userId passed downstream.  
    - Failure modes: Missing or malformed timestamp, timezone issues.  
  - **If**  
    - Type: Conditional  
    - Role: Routes flow based on `withinWindow` boolean.  
    - Configuration: Checks if `withinWindow === true`.  
    - True branch: Send cleaned answer to WhatsApp reply node.  
    - False branch: Send fallback or no-response template.  
    - Failure modes: Expression evaluation errors.

#### 1.7 Output & Logging

- **Overview:** Sends responses back via WhatsApp and logs chat data to Google Sheets.
- **Nodes Involved:**  
  - WhapAround - Respond Message (Respond to Webhook)  
  - WhapAround - Respond Template (Respond to Webhook)  
  - Google Sheets
- **Node Details:**  
  - **WhapAround - Respond Message**  
    - Type: Respond to Webhook  
    - Role: Sends the cleaned AI-generated message as a WhatsApp reply to the user.  
    - Input: Cleaned answer from `cleanAnswer` node.  
    - Output: HTTP response to WhapAround webhook.  
    - Failure modes: Response payload format errors, connection issues.  
  - **WhapAround - Respond Template**  
    - Type: Respond to Webhook  
    - Role: Sends a fallback or template response if outside 24-hour window.  
    - Input: From `If` node false branch.  
    - Failure modes: Same as above.  
  - **Google Sheets**  
    - Type: Google Sheets  
    - Role: Logs interaction data for analytics or records.  
    - Configuration: Credentials required but not specified here.  
    - Input: Triggered after AI Agent and Date & Time processing.  
    - Failure modes: Authentication errors, API limits.

#### 1.8 Supporting Components

- **Overview:** Additional nodes for timing and documentation.
- **Nodes Involved:**  
  - Date & Time (Date/Time node)  
  - Sticky Note
- **Node Details:**  
  - **Date & Time**  
    - Type: Date & Time node  
    - Role: Provides timestamp or date info, used in logging or AI agent workflow.  
    - Failure modes: None major.  
  - **Sticky Note**  
    - Type: Sticky Note  
    - Role: Contains detailed documentation, instructions, setup notes, and contact information.  
    - Content:  
      - Explains no WhatsApp Business API needed due to WhapAround.  
      - Setup instructions and professional service offers.  
      - Contact email and WhatsApp number provided.  
    - Failure modes: None.

---

### 3. Summary Table

| Node Name                 | Node Type                         | Functional Role                          | Input Node(s)               | Output Node(s)                   | Sticky Note                                                                                                                            |
|---------------------------|----------------------------------|----------------------------------------|-----------------------------|---------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| WhapAround - Listeing     | Webhook                          | Receives WhatsApp messages              |                             | company's knowledge             |                                                                                                                                        |
| company's knowledge       | Google Docs                      | Fetches internal business document      | WhapAround - Listeing       | Prepare Prompt                  |                                                                                                                                        |
| Prepare Prompt            | AI Transform (Code)              | Builds the AI prompt string              | company's knowledge         | AI Agent                       |                                                                                                                                        |
| Simple Memory             | LangChain Memory Buffer Window   | Maintains conversation session context  |                             | AI Agent                       |                                                                                                                                        |
| AI Agent                  | LangChain Agent                  | Generates AI response                     | Prepare Prompt, Simple Memory| Date & Time                    | System message excludes references to documents or date unless asked. Max 5 retries.                                                  |
| Google Gemini Chat Model  | LangChain Google Gemini LLM      | Provides underlying AI model              |                             | AI Agent                       |                                                                                                                                        |
| Date & Time               | Date & Time                     | Adds timestamp/logging info               | AI Agent                   | Google Sheets                  |                                                                                                                                        |
| Google Sheets             | Google Sheets                   | Logs conversation data                    | Date & Time                 | 24-hour window check           |                                                                                                                                        |
| 24-hour window check      | Code (JavaScript)               | Checks if message timestamp within 24h   | Google Sheets               | If                            |                                                                                                                                        |
| If                        | Conditional                    | Routes based on 24h window check          | 24-hour window check        | cleanAnswer (true), Respond Template (false) |                                                                                                                                        |
| cleanAnswer               | Code (JavaScript)               | Cleans AI-generated text                   | If (true branch)            | WhapAround - Respond Message   |                                                                                                                                        |
| WhapAround - Respond Message | Respond to Webhook             | Sends AI answer back to WhatsApp user     | cleanAnswer                 |                                 |                                                                                                                                        |
| WhapAround - Respond Template | Respond to Webhook             | Sends fallback message if outside 24h    | If (false branch)           |                                 |                                                                                                                                        |
| Sticky Note               | Sticky Note                     | Documentation and instructions            |                             |                                 | # WhatsApp AI Assistant <br> No Business Verification Required, instant activation, no complex WhatsApp API setup needed.<br>Contact: andrea@jamot.pro |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node:**  
   - Name: `WhapAround - Listeing`  
   - Type: Webhook  
   - Method: POST  
   - Path: `30720c7c-18f4-4815-be3b-03343d53ee45`  
   - Purpose: Receive incoming WhatsApp messages from WhapAround.

2. **Add Google Docs Node:**  
   - Name: `company's knowledge`  
   - Type: Google Docs  
   - Operation: `get`  
   - Document URL / ID: `1Uv1WYCcXNlp-jaeJ7-3MNxWYfPj-wcYnJv4_colXSvk` (replace with your own Google Doc ID)  
   - Credentials: Configure Google OAuth credentials with permissions to read the document.

3. **Create AI Transform Node:**  
   - Name: `Prepare Prompt`  
   - Type: AI Transform (Code)  
   - Code:  
     - Extract plain text from Google Docs content.  
     - Extract WhatsApp message body from webhook data.  
     - Format current date as "Month Day, Year".  
     - Construct `finalPrompt` string combining date, doc text, and user's question.  
   - Input: Connect from `company's knowledge` node and `WhapAround - Listeing` node.

4. **Configure LangChain Memory Buffer Node:**  
   - Name: `Simple Memory`  
   - Type: LangChain memoryBufferWindow  
   - Session key: `={{ $('when message received').item.json.contacts[0].wa_id }}` to track conversation by user WhatsApp ID.  
   - Connect after `Prepare Prompt` or as per LangChain integration.

5. **Add LangChain AI Agent:**  
   - Name: `AI Agent`  
   - Type: LangChain Agent  
   - Parameters:  
     - Text input: `={{ $json.finalPrompt }}`  
     - System message: Instruct assistant to avoid mentioning documents or dates unless asked.  
     - Max retries: 5  
     - Enable output parser.  
   - Connect inputs: from `Prepare Prompt` and `Simple Memory`.  
   - Connect outputs: to `Date & Time` node.

6. **Add Google Gemini Chat Model:**  
   - Name: `Google Gemini Chat Model`  
   - Type: LangChain Google Gemini LLM  
   - Model: `models/gemini-2.5-flash-preview-04-17-thinking`  
   - Connect as AI language model input to `AI Agent`.

7. **Add Date & Time Node:**  
   - Name: `Date & Time`  
   - Type: Date & Time node  
   - Connect: After `AI Agent` node.  
   - Purpose: Add timestamp for logging.

8. **Add Google Sheets Node:**  
   - Name: `Google Sheets`  
   - Type: Google Sheets  
   - Credentials: Configure with Google Sheets API access.  
   - Purpose: Log chat interaction data.  
   - Connect: After `Date & Time`.

9. **Add Code Node for 24-hour Check:**  
   - Name: `24-hour window check`  
   - Type: Code (JavaScript)  
   - Code:  
     - Extract WhatsApp message timestamp (seconds since epoch).  
     - Convert to milliseconds and compare with current time.  
     - Output boolean `withinWindow` if message is within last 24 hours.  
   - Connect: After `Google Sheets`.

10. **Add If Node:**  
    - Name: `If`  
    - Type: Conditional  
    - Condition: `={{ $json.withinWindow }} === true`  
    - True output: Connect to `cleanAnswer`.  
    - False output: Connect to `WhapAround - Respond Template`.

11. **Add Code Node to Clean AI Answer:**  
    - Name: `cleanAnswer`  
    - Type: Code (JavaScript)  
    - Code:  
      - Remove markdown markers `* _ ~`.  
      - Convert markdown links to plain text.  
      - Collapse multiple newlines.  
      - Strip phrases like "based on the document you provided".  
    - Input: AI Agent output.  
    - Output: Cleaned answer JSON.  
    - Connect: To `WhapAround - Respond Message`.

12. **Add Respond to Webhook Nodes:**  
    - Name: `WhapAround - Respond Message`  
      - Type: Respond to Webhook  
      - Input: From `cleanAnswer` node.  
      - Purpose: Send AI-generated answer back to WhatsApp user.  
    - Name: `WhapAround - Respond Template`  
      - Type: Respond to Webhook  
      - Input: From `If` node false branch.  
      - Purpose: Send fallback or template response for expired 24h window.

13. **Add Sticky Note:**  
    - Type: Sticky Note  
    - Content: Include workflow description, setup instructions, project contact info, and usage notes as per the original.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                         | Context or Link                                              |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------|
| No Business Verification Required. Instant activation with full WhatsApp Group support. Skip the complex WhatsApp Business Cloud API setup by using WhapAround as a middleware.                                                                                                                                                                                                                      | WhapAround: https://whaparound.pro/                          |
| Workflow reads a live Google Doc for knowledge base and processes incoming WhatsApp messages to generate AI responses automatically.                                                                                                                                                                                                                                                                 |                                                              |
| Professional setup services available including WhatsApp connection, Google OAuth setup, AI model configuration, branding, and escalation systems. Contact: andrea@jamot.pro | WhatsApp: +16508665016                                                                                      |  
| Optional PostgreSQL memory setup video guide: https://www.youtube.com/watch?v=JjBofKJnYIU                                                                                                                                                                                                                                                                                                            |                                                              |
| System message for AI Agent explicitly instructs not to mention documents or today's date unless asked, ensuring natural conversational tone.                                                                                                                                                                                                                                                     |                                                              |

---

**Disclaimer:**  
The text provided is exclusively derived from an automated n8n workflow. It strictly complies with content policies and contains no illegal, offensive, or protected elements. All processed data are legal and public.