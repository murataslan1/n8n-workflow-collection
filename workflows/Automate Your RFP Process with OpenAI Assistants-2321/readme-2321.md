Automate Your RFP Process with OpenAI Assistants

https://n8nworkflows.xyz/workflows/automate-your-rfp-process-with-openai-assistants-2321


# Automate Your RFP Process with OpenAI Assistants

### 1. Workflow Overview

This workflow automates the early stages of responding to Request for Proposal (RFP) documents by leveraging AI technologies and document automation. It receives an RFP document via an API webhook, extracts the supplier-directed questions using Large Language Models (LLMs), and uses a pre-trained OpenAI Assistant seeded with company knowledge to answer each question. The answers are recorded into a newly created Google Docs response document, which is then shared with the sales team via email and Slack notifications.

Logical blocks:

- **1.1 Input Reception and Initial Processing**: Receiving the RFP document via webhook, extracting the PDF content, and setting metadata variables.
- **1.2 Response Document Creation**: Creating a Google Docs document to capture the answers and adding metadata.
- **1.3 Question Extraction via AI**: Using an LLM-powered chain to extract supplier questions from the RFP’s raw text.
- **1.4 AI-driven Q&A Generation**: Looping through each extracted question, sending it to an OpenAI Assistant configured with company documents to generate answers, and recording these Q&A pairs back into the response document.
- **1.5 Notification Delivery**: Sending email and Slack notifications to alert stakeholders about the completed RFP response.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception and Initial Processing

- **Overview:**  
  This block handles the initial input phase where the RFP document is submitted via a webhook. It extracts the PDF content and sets key metadata variables for later use.

- **Nodes Involved:**  
  - Wait for Request  
  - Get RFP Data  
  - Set Variables  
  - Sticky Note (API trigger instructions)  
  - Sticky Note (Postman reminder)  
  - Sticky Note (Example webhook request snippet)  
  - Sticky Note (Try it out overview)

- **Node Details:**  

  - **Wait for Request**  
    - Type: Webhook  
    - Role: Entry point API endpoint for receiving RFP submissions (HTTP POST).  
    - Configuration: Defined webhook path, expecting form-data containing `id`, `title`, `reply_to`, and uploaded `data` (PDF file).  
    - Input: External HTTP POST request  
    - Output: Raw webhook data passed to next node  
    - Edge cases: Unauthorized or malformed requests; security considerations require webhook protection in production.  
    - Notes: Sticky Note explains this is the API trigger and recommends securing the webhook.

  - **Get RFP Data**  
    - Type: Extract from File (PDF)  
    - Role: Extracts raw text content from the uploaded PDF file.  
    - Configuration: Operation set to `pdf` extraction.  
    - Input: File from webhook data  
    - Output: Extracted text content of the RFP document  
    - Edge cases: PDFs with complex formatting may produce inaccurate extraction; file corruption or unsupported file types cause failures.

  - **Set Variables**  
    - Type: Set  
    - Role: Defines key metadata variables like document title, filename for response document, and reply-to email.  
    - Configuration: Uses expressions to read webhook fields and generate a timestamped filename.  
    - Key expressions:  
      - `doc_title` from webhook's `title` field  
      - `doc_filename` combining `id`, `title`, current datetime, and suffix "RFP Response"  
      - `reply_to` from webhook's `reply_to` field  
    - Input: Extracted text and webhook data  
    - Output: JSON with metadata for downstream nodes  
    - Edge cases: Missing or malformed input fields may cause errors or incorrect filenames.

---

#### 1.2 Response Document Creation

- **Overview:**  
  This block creates a dedicated Google Docs document to capture the AI-generated answers and appends metadata to it.

- **Nodes Involved:**  
  - Create new RFP Response Document  
  - Add Metadata to Response Doc  
  - Sticky Note (Google Docs usage instructions)

- **Node Details:**  

  - **Create new RFP Response Document**  
    - Type: Google Docs (Create)  
    - Role: Creates a new Google Docs document with a generated title and places it in a specific Google Drive folder.  
    - Configuration:  
      - `title` set dynamically from `doc_filename` variable  
      - `folderId` hardcoded to a Google Drive folder ID (must be accessible by credentials)  
    - Credentials: Google Docs OAuth2 account  
    - Input: Metadata from Set Variables  
    - Output: Document ID and URL for later updates  
    - Edge cases: Credential issues, insufficient Drive permissions, or quota limits can cause failure.

  - **Add Metadata to Response Doc**  
    - Type: Google Docs (Update)  
    - Role: Inserts metadata such as title, generation date, requester email, and workflow execution link at the start of the document.  
    - Configuration: Uses template text with expressions including workflow and execution IDs for traceability.  
    - Input: Document ID from previous node  
    - Output: Updated document  
    - Edge cases: Document lock or permission issues, expression evaluation errors.

---

#### 1.3 Question Extraction via AI

- **Overview:**  
  Uses an OpenAI chat model and a LangChain LLM-powered chain node to parse the extracted RFP text and extract all questions addressed to the supplier, returning a list of questions for further processing.

- **Nodes Involved:**  
  - OpenAI Chat Model  
  - Extract Questions From RFP  
  - Item List Output Parser  
  - Sticky Note (Question & Answer Chain explanation)

- **Node Details:**  

  - **OpenAI Chat Model**  
    - Type: LangChain Chat Model (OpenAI)  
    - Role: Provides the underlying LLM for the question extraction chain.  
    - Credentials: OpenAI API key  
    - Input: Raw text from extracted PDF  
    - Output: LLM response passed to chain node  
    - Edge cases: API rate limits, request timeouts, invalid API key.

  - **Extract Questions From RFP**  
    - Type: LangChain Chain LLM  
    - Role: Custom prompt chain that instructs the model to extract all exact questions from the RFP text.  
    - Configuration: Prompt includes wrapped RFP text and explicit instructions to extract questions exactly as written.  
    - Output Parser: Activated to structure output as a list of items (questions).  
    - Input: Chat model output  
    - Output: Structured list of questions for batching  
    - Edge cases: LLM hallucination, missing questions, or incomplete extraction.

  - **Item List Output Parser**  
    - Type: LangChain Output Parser  
    - Role: Parses the chain output into a usable list of question items for iteration.  
    - Edge cases: Parsing errors if LLM output format deviates.

---

#### 1.4 AI-driven Q&A Generation

- **Overview:**  
  This block loops over each extracted question and uses an OpenAI Assistant pre-loaded with company knowledge to generate contextually accurate answers. Each question-answer pair is appended to the response Google Doc.

- **Nodes Involved:**  
  - For Each Question... (SplitInBatches)  
  - Answer Question with Context (OpenAI Assistant)  
  - Record Question & Answer in Response Doc (Google Docs Update)  
  - Sticky Notes (OpenAI Assistant setup, looping explanation)

- **Node Details:**  

  - **For Each Question...**  
    - Type: SplitInBatches  
    - Role: Iterates over each question sequentially (batch size 1) to handle individual processing.  
    - Input: Parsed question list  
    - Output: Single question per execution cycle into AI assistant node and notification branch  
    - Edge cases: Large number of questions may lead to long workflow execution time.

  - **Answer Question with Context**  
    - Type: LangChain OpenAI Assistant  
    - Role: Sends each question to a configured OpenAI Assistant that has been pre-loaded with company marketing, technical, and brand documents to ensure relevant answers.  
    - Configuration:  
      - Text parameter uses the current question text  
      - Resource set to `assistant` with a fixed assistantId referencing the pre-built assistant  
    - Credentials: OpenAI API key  
    - Input: Single question from split batch  
    - Output: Generated answer text  
    - Edge cases: Assistant misinterpretation, API errors, network issues.

  - **Record Question & Answer in Response Doc**  
    - Type: Google Docs (Update)  
    - Role: Inserts the question and corresponding answer text into the response document, appending sequentially using run index.  
    - Configuration: Uses expressions to format text as "1. [Question] \n [Answer] \n\n"  
    - Input: Response document ID and Q&A pair  
    - Edge cases: Document access conflicts, formatting errors.

---

#### 1.5 Notification Delivery

- **Overview:**  
  Upon completion, sends notifications to the requester and sales team via email and Slack with links to the completed RFP response document.

- **Nodes Involved:**  
  - Send Email Notification (Gmail)  
  - Send Chat Notification (Slack)  
  - Sticky Note (Notification instructions)

- **Node Details:**  

  - **Send Email Notification**  
    - Type: Gmail  
    - Role: Sends an email to the `reply_to` address indicating the RFP response document is ready.  
    - Configuration:  
      - Recipient email dynamically set from workflow variables  
      - Subject and message templated with RFP title  
    - Credentials: Gmail OAuth2  
    - Edge cases: Email delivery failures, invalid email addresses, Gmail API rate limits.

  - **Send Chat Notification**  
    - Type: Slack  
    - Role: Posts a notification message in a configured Slack channel to alert the sales team.  
    - Configuration:  
      - Channel name hardcoded as "RFP-channel"  
      - Message includes RFP document title  
    - Credentials: Slack API token  
    - Edge cases: Slack API permission or rate limits, wrong channel name.

---

### 3. Summary Table

| Node Name                         | Node Type                      | Functional Role                                  | Input Node(s)                 | Output Node(s)                         | Sticky Note                                                                                                     |
|----------------------------------|--------------------------------|-------------------------------------------------|------------------------------|--------------------------------------|----------------------------------------------------------------------------------------------------------------|
| Wait for Request                 | Webhook                       | Entry point; receives RFP submission via API    |                              | Get RFP Data                         | ## 1. API to Trigger Workflow \n [Read more about using Webhooks](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/) \n This workflow requires the user to submit the RFP document via an API request. It's a common pattern to use the webhook node for this purpose. Be sure to secure this webhook endpoint in production! |
| Get RFP Data                    | ExtractFromFile (PDF)          | Extracts raw text from uploaded RFP PDF          | Wait for Request             | Set Variables                       |                                                                                                                |
| Set Variables                  | Set                           | Sets metadata variables (doc title, filename, reply-to email) | Get RFP Data                 | Create new RFP Response Document    | 🚨**Required**\n* Use a tool such as Postman to send data to the webhook.                                    |
| Create new RFP Response Document | Google Docs (Create)           | Creates Google Docs document to capture answers | Set Variables                | Add Metadata to Response Doc        | ## 2. Create a new Doc to Capture Responses For RFP Questions\n[Read more about working with Google Docs](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googledocs/)\nFor each RFP we process, let's create its very own document to store the results. It will serve as a draft document for the RFP response. |
| Add Metadata to Response Doc    | Google Docs (Update)           | Inserts metadata info at top of response doc    | Create new RFP Response Document | Extract Questions From RFP           |                                                                                                                |
| OpenAI Chat Model              | LangChain Chat Model (OpenAI) | Supplies LLM for question extraction chain      |                              | Extract Questions From RFP           | ## 3. Identifying Questions using AI\n[Read more about Question & Answer Chain](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.chainretrievalqa/) \nUsing the power of LLMs, we're able to extract the RFP questionnaire regardless of original formatting or layout. This allows AutoRFP to handle a wide range of RFPs without requiring explicit extraction rules for edge cases.\nAdditionally, We'll use the Input List Output Parser to return a list of questions for further processing. |
| Extract Questions From RFP      | LangChain Chain LLM            | Extracts questions from RFP text using AI        | Add Metadata to Response Doc, OpenAI Chat Model | For Each Question...                 |                                                                                                                |
| Item List Output Parser        | LangChain Output Parser        | Parses extracted questions into list             | Extract Questions From RFP   | Extract Questions From RFP           |                                                                                                                |
| For Each Question...            | SplitInBatches                | Iterates over each question for answering        | Extract Questions From RFP   | Send Email Notification, Answer Question with Context | ## 4. Generating Question & Answer Pairs with AI\n[Read more about using OpenAI Assistants in n8n](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-langchain.openai/)\nBy preparing an OpenAI Assistant with marketing material and sales documents about our company and business, we are able to use AI to answer RFP questions with the accurate and relevant context. Potentially allowing sales teams to increase the number of RFPs they can reply to.\nThis portion of the workflow loops through and answers each question individually for better answers. We can record the Question and Answer pairings to the RFP response document we created earlier. |
| Answer Question with Context    | LangChain OpenAI Assistant     | Sends question to OpenAI Assistant for answer    | For Each Question...         | Record Question & Answer in Response Doc | 🚨**Required**\nYou'll need to create an OpenAI Assistant to use this workflow.\n* Sign up for [OpenAI Dashboard](https://platform.openai.com) if you haven't already.\n* Create an [OpenAI Assistant](https://platform.openai.com/playground/assistants)\n* Upload the [example company doc](https://drive.google.com/file/d/16WywCYcxBgYHXB3TY3wXUTyfyG2n_BA0/view?usp=sharing) to the assistant.\nThe assistant will use the company doc to answer the questions. |
| Record Question & Answer in Response Doc | Google Docs (Update)           | Appends Q&A pairs into Google Docs document      | Answer Question with Context | For Each Question...                 |                                                                                                                |
| Send Email Notification         | Gmail                         | Sends email notification to requester            | For Each Question...         | Send Chat Notification               | 🚨**Required**\n* Update the email address to send to in Gmail Node.\n* Update the channel and message for Slack. |
| Send Chat Notification          | Slack                         | Sends Slack message to notify sales team         | Send Email Notification      |                                      |                                                                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Webhook Node ("Wait for Request")**
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: Unique identifier (e.g., `35e874df-2904-494e-a9f5-5a3f20f517f8`)  
   - Expected Payload: form-data fields `id` (string), `title` (string), `reply_to` (email), and file upload `data` (PDF)  
   - Secure the webhook endpoint appropriately in production.

2. **Add "Get RFP Data" Node (ExtractFromFile)**
   - Type: ExtractFromFile  
   - Operation: PDF extraction  
   - Input: File from webhook’s `data` field  
   - Output: Extracted raw text of the RFP document.

3. **Add "Set Variables" Node**
   - Type: Set  
   - Mode: Raw JSON  
   - Define variables using expressions:  
     - `doc_title` = value from webhook `title` field  
     - `doc_filename` = combine webhook `id`, `title`, current timestamp (`yyyyMMddhhmmss`), and "RFP Response" suffix  
     - `reply_to` = value from webhook `reply_to` field

4. **Add "Create new RFP Response Document" Node (Google Docs)**
   - Type: Google Docs (Create)  
   - Title: Use expression `{{$json["doc_filename"]}}` from previous node  
   - FolderId: Specify Google Drive folder ID to save the document  
   - Credentials: Configure Google Docs OAuth2 credentials with necessary Drive permissions.

5. **Add "Add Metadata to Response Doc" Node (Google Docs Update)**
   - Type: Google Docs (Update)  
   - Operation: Insert text action at start of document  
   - Text Template:  
     ```
     Title: {{ $json.doc_title }}
     Date generated: {{ $now.format("yyyy-MM-dd @ hh:mm") }}
     Requested by: {{ $json.reply_to }}
     Execution Id: http://localhost:5678/workflow/{{ $workflow.id }}/executions/{{ $execution.id }}

     ---
     ```
   - Document URL: Use the document ID from "Create new RFP Response Document" node  
   - Credentials: Same Google Docs OAuth2 credentials

6. **Add "OpenAI Chat Model" Node (LangChain Chat Model)**
   - Type: LangChain Chat Model (OpenAI)  
   - Credentials: OpenAI API key  
   - No parameters needed; serves as LLM provider.

7. **Add "Extract Questions From RFP" Node (LangChain Chain LLM)**
   - Type: LangChain Chain LLM  
   - Prompt:  
     ```
     You have been given a RFP document as part of a tender process of a buyer. Please extract all questions intended for the supplier. You must ensure the questions extracted are exactly as they are written in the RFP document.

     <RFP>{{ $node["Get RFP Data"].item.json.text }}<RFP>
     ```  
   - Enable Output Parser: Yes  
   - Connect "OpenAI Chat Model" as LLM input.

8. **Add "Item List Output Parser" Node (LangChain Output Parser)**
   - Type: Output Parser (Item List)  
   - Connect output parser to "Extract Questions From RFP" node.

9. **Add "For Each Question..." Node (SplitInBatches)**
   - Type: SplitInBatches  
   - Batch Size: 1 (process one question at a time)  
   - Input: List of questions from "Item List Output Parser"

10. **Add "Answer Question with Context" Node (LangChain OpenAI Assistant)**
    - Type: OpenAI Assistant  
    - Text: Pass current question from batch (`{{ $json.response.text }}`)  
    - Resource: Assistant  
    - Assistant ID: Your previously created OpenAI Assistant ID (seeded with company knowledge)  
    - Credentials: OpenAI API key

11. **Add "Record Question & Answer in Response Doc" Node (Google Docs Update)**
    - Type: Google Docs (Update)  
    - Operation: Insert text action appending at end  
    - Text Template:  
      ```
      {{ $runIndex + 1 }}. {{ $json.content }}
      {{ $json.output }}

      ```  
    - Document URL: From "Create new RFP Response Document" node  
    - Credentials: Google Docs OAuth2

12. **Connect "Answer Question with Context" → "Record Question & Answer in Response Doc" → back to "For Each Question..."**  
    (Loop continues until all questions answered)

13. **Add "Send Email Notification" Node (Gmail)**
    - Type: Gmail  
    - Send To: `{{ $json.reply_to }}` from Set Variables  
    - Subject: `RFP Questionnaire "{{ $json.title }}" Completed!`  
    - Message: `Your RFP document "{{ $json.title }}" is now complete!`  
    - Credentials: Gmail OAuth2

14. **Add "Send Chat Notification" Node (Slack)**
    - Type: Slack  
    - Channel: "RFP-channel" (or your preferred channel)  
    - Message: `=RFP document "{{ $json.title }}" completed!`  
    - Credentials: Slack API token

15. **Connect "For Each Question..." Node to "Send Email Notification" (on batch completion), and "Send Email Notification" to "Send Chat Notification"**

16. **Deploy and test the workflow**  
    - Use Postman or curl to send a POST request to the webhook with required form fields and PDF file.  
    - Verify document creation, question extraction, answer generation, and notifications.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                          | Context or Link                                                                                                  |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| This workflow requires an OpenAI account and the creation of an OpenAI Assistant seeded with relevant company documents to provide context-aware answers.                                                                                                                                                                                                          | [OpenAI Dashboard](https://platform.openai.com), [OpenAI Assistants](https://platform.openai.com/playground/assistants) |
| The RFP response document is stored on Google Drive in a specific folder; ensure the OAuth2 credentials have appropriate permissions.                                                                                                                                                                                                                                | Google Docs OAuth2 API setup documentation                                                                       |
| The example RFP document and company knowledge document are available for testing and seeding the assistant.                                                                                                                                                                                                                                                        | [Example RFP Document](https://drive.google.com/file/d/1G42h4Vz2lBuiNCnOiXF_-EBP1MaIEVq5/view?usp=sharing) \n [Example Company Doc](https://drive.google.com/file/d/16WywCYcxBgYHXB3TY3wXUTyfyG2n_BA0/view?usp=sharing) |
| Notifications can be customized; update the Gmail recipient address and Slack channel to suit your organization.                                                                                                                                                                                                                                                    | n8n Gmail and Slack integration docs                                                                             |
| Secure your webhook endpoints especially in production environments to avoid unauthorized use.                                                                                                                                                                                                                                                                       | [n8n Webhook Security](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)               |
| This workflow demonstrates a typical use of AI in automating document-based business processes, highlighting modular design and best practices in API integrations and error handling considerations.                                                                                                                                                                 |                                                                                                                 |