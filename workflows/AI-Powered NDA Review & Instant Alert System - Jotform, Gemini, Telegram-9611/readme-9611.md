AI-Powered NDA Review & Instant Alert System - Jotform, Gemini, Telegram

https://n8nworkflows.xyz/workflows/ai-powered-nda-review---instant-alert-system---jotform--gemini--telegram-9611


# AI-Powered NDA Review & Instant Alert System - Jotform, Gemini, Telegram

### 1. Workflow Overview

This workflow automates the review of Non-Disclosure Agreements (NDAs) or project contracts submitted via a JotForm form. It leverages AI models to analyze contract text for risk factors and hidden clauses, then instantly alerts the designated Telegram chat or channel with a concise summary.

**Target Use Cases:**

- Legal teams or contract managers needing automated initial contract risk assessments.
- Businesses requiring instant alerts on submitted contracts for timely review.
- Automation of contract intake and AI-powered analysis without manual download or reading.

**Logical Blocks:**

- **1.1 Input Reception:** Triggered by JotForm submission; retrieves submission metadata and attached contract document URL.
- **1.2 Document Acquisition:** Downloads the attached contract PDF file using HTTP requests.
- **1.3 Text Extraction:** Extracts the textual content from the downloaded PDF.
- **1.4 AI-Powered Contract Analysis:** Uses Google Gemini language model and an AI Agent node to analyze contract text, highlighting red flags and hidden clauses.
- **1.5 Notification Dispatch:** Sends the AI analysis report as a text message to a specified Telegram chat/channel.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  Listens for new submissions on a specific JotForm form and obtains initial submission details including the submission ID and answers.

- **Nodes Involved:**  
  - JotForm Trigger  
  - Grab Attachment Details

- **Node Details:**  

  1. **JotForm Trigger**  
     - Type: JotForm Trigger (Webhook-based)  
     - Configuration: Listens to form ID `252861492721056`. Triggers on every submission, returning full answers, not just answers only.  
     - Key Expressions: None specific; outputs submission data including submissionID.  
     - Input: Webhook trigger (automatic)  
     - Output: Form submission JSON with answers and metadata  
     - Edge cases: API rate limits; webhook misconfiguration; missing submission data  
     - Sticky Note: Explains trigger purpose and data received.

  2. **Grab Attachment Details**  
     - Type: HTTP Request  
     - Configuration: Uses JotForm Submission API endpoint to retrieve detailed submission info by submissionID dynamically from previous node. API key required in URL.  
     - Key Expressions: URL uses `{{ $json.submissionID }}` to fetch submission details.  
     - Input: Output from JotForm Trigger  
     - Output: JSON containing detailed submission data including attachment links  
     - Edge cases: Invalid submissionID; API key errors; network failures  
     - Sticky Note: Notes usage of custom JotForm API call to get document link.

#### 2.2 Document Acquisition

- **Overview:**  
  Downloads the contract document attached to the submission as a PDF file in binary format.

- **Nodes Involved:**  
  - Grab the attached Contract

- **Node Details:**  

  1. **Grab the attached Contract**  
     - Type: HTTP Request  
     - Configuration: Downloads the contract file from the URL found in the previous node's JSON path `content.answers['4'].answer[0]`. Response is configured to return as a file binary. Includes an APIKEY header for authentication.  
     - Key Expressions: URL dynamically extracted from previous node's JSON.  
     - Input: Output from Grab Attachment Details  
     - Output: Binary file data representing the PDF contract  
     - Edge cases: Invalid or expired link; authentication failure; file format issues  
     - Sticky Note: Highlights that this node downloads the document file as binary.

#### 2.3 Text Extraction

- **Overview:**  
  Extracts readable text from the downloaded PDF contract file for analysis.

- **Nodes Involved:**  
  - Extract Text from PDF File

- **Node Details:**  

  1. **Extract Text from PDF File**  
     - Type: Extract from File (PDF operation)  
     - Configuration: Default extraction operation for PDF files. No special options customized.  
     - Input: Binary PDF file from previous HTTP Request node  
     - Output: Text content extracted from PDF  
     - Edge cases: Corrupted PDF; scanned image PDFs without OCR; extraction failures  
     - Sticky Note: Explains extraction of text content from downloaded PDF.

#### 2.4 AI-Powered Contract Analysis

- **Overview:**  
  Analyzes extracted contract text for risk assessment using Google Gemini and an AI Agent node configured with a specific prompt template.

- **Nodes Involved:**  
  - Google Gemini Chat Model  
  - AI Agent

- **Node Details:**  

  1. **Google Gemini Chat Model**  
     - Type: LangChain Google Gemini Chat Model  
     - Configuration: Minimal options; acts as the underlying language model for the AI Agent.  
     - Credentials: Uses Google Palm API credentials.  
     - Input: Connected internally as the AI language model source for the AI Agent.  
     - Output: Language model responses to AI Agent.  
     - Edge cases: API quota exceeded; network errors; unexpected response format.

  2. **AI Agent**  
     - Type: LangChain Agent  
     - Configuration: Uses a detailed prompt instructing it to act as an expert contract analyst. The prompt requests a Telegram-compatible report under 1000 characters with sections on major red flags, hidden clauses, summary rating, and recommendation. The contract text is inserted dynamically from extracted PDF text.  
     - Input: Text extracted from PDF  
     - Output: Concise contract analysis report formatted for Telegram  
     - Edge cases: Prompt parsing errors; incomplete contract text; AI hallucinations or misinterpretations  
     - Sticky Note: Describes the AI Agent's role in analyzing contract and outputting risk flags.

#### 2.5 Notification Dispatch

- **Overview:**  
  Sends the AI-generated contract analysis as a text message to a designated Telegram chat or channel.

- **Nodes Involved:**  
  - Send a text message

- **Node Details:**  

  1. **Send a text message**  
     - Type: Telegram Node  
     - Configuration: Sends a plain text message using the AI Agent output. The chatId must be specified (e.g., a Telegram group or channel ID). Attribution appended is disabled for cleaner message.  
     - Credentials: Connected to Telegram API credentials for authentication.  
     - Input: Contract analysis output from AI Agent  
     - Output: Confirmation of message sent (not typically used further)  
     - Edge cases: Invalid chat ID; bot permissions; Telegram API downtime  
     - Sticky Note: Notes that this node sends the AI contract analysis to Telegram.

---

### 3. Summary Table

| Node Name                 | Node Type                          | Functional Role                          | Input Node(s)           | Output Node(s)          | Sticky Note                                                                                          |
|---------------------------|----------------------------------|----------------------------------------|-------------------------|-------------------------|----------------------------------------------------------------------------------------------------|
| JotForm Trigger           | JotForm Trigger                  | Trigger workflow on form submission    | (Webhook)               | Grab Attachment Details  | Triggers when user submitted our preferred jotform; outputs submission details                      |
| Grab Attachment Details   | HTTP Request                    | Retrieves full submission data from JotForm API | JotForm Trigger         | Grab the attached Contract | Uses HTTP node to make a custom JotForm API request to get form submitted document links            |
| Grab the attached Contract| HTTP Request                    | Downloads the attached contract PDF    | Grab Attachment Details  | Extract Text from PDF File| Downloads attached document as binary response                                                     |
| Extract Text from PDF File| Extract From File (PDF)          | Extracts text from downloaded PDF      | Grab the attached Contract| AI Agent                 | Extracts text content from the PDF                                                                |
| Google Gemini Chat Model  | LangChain Google Gemini Chat Model | Provides language model for AI Agent   | (Connected internally)   | AI Agent                 |                                                                                                    |
| AI Agent                 | LangChain Agent                  | Analyzes contract text and outputs report | Extract Text from PDF File | Send a text message      | AI analyses complete contract text and outputs red flags and hidden clauses                        |
| Send a text message       | Telegram Node                   | Sends contract analysis to Telegram chat | AI Agent                |                         | Sends a message containing AI contract analysis to preferred chat or channel                      |
| Sticky Note               | Sticky Note                     | Informational                          |                         |                         | Explains JotForm Trigger purpose                                                                 |
| Sticky Note1              | Sticky Note                     | Informational                          |                         |                         | Explains HTTP node usage for JotForm API call                                                     |
| Sticky Note2              | Sticky Note                     | Informational                          |                         |                         | Explains HTTP node downloading document as binary                                                 |
| Sticky Note3              | Sticky Note                     | Informational                          |                         |                         | Explains PDF text extraction node                                                                |
| Sticky Note4              | Sticky Note                     | Informational                          |                         |                         | Explains Telegram Send message node                                                              |
| Sticky Note5              | Sticky Note                     | Informational                          |                         |                         | Explains AI Agent node's contract analysis role                                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create JotForm Trigger Node**  
   - Type: JotForm Trigger  
   - Set form ID to `252861492721056` (your form’s ID)  
   - Use your JotForm API credentials  
   - Configure to trigger on every submission, retrieving full answers  

2. **Add HTTP Request Node for Submission Details**  
   - Name: Grab Attachment Details  
   - Type: HTTP Request  
   - Method: GET  
   - URL: `https://api.jotform.com/submission/{{ $json.submissionID }}?apiKey=YOUR_JOTFORM_API_KEY`  
   - Replace `YOUR_JOTFORM_API_KEY` with your actual API key  
   - Connect input from JotForm Trigger node output  

3. **Add HTTP Request Node to Download Contract**  
   - Name: Grab the attached Contract  
   - Type: HTTP Request  
   - Method: GET  
   - URL: Extract dynamically from previous node: `{{ $json.content.answers['4'].answer[0] }}`  
   - Set Response Format: File (Binary)  
   - Add header parameter: `APIKEY` with your JotForm API key  
   - Connect input from Grab Attachment Details node  

4. **Add Extract From File Node**  
   - Name: Extract Text from PDF File  
   - Type: Extract From File  
   - Operation: PDF  
   - Connect input from Grab the attached Contract node  

5. **Add Google Gemini Chat Model Node**  
   - Type: LangChain Google Gemini Chat Model  
   - Use Google Palm API credentials  
   - No special options needed  
   - Connect internally to AI Agent node (see next step)  

6. **Add AI Agent Node**  
   - Type: LangChain Agent  
   - Prompt Type: Define  
   - Text Prompt: Use the following template with dynamic content insertion:  
     ```
     You are an expert contract analyst. Review the project contract below and protect the client’s interests. Output must be under 1000 chars and Telegram-compatible (no markdown links or code blocks).

     Contract:{{ $json.text }}

     Analyze and respond in this exact format:
     CONTRACT ANALYSIS REPORT
     🚩 MAJOR RED FLAGS:• Quote risky lines and briefly say why they’re unfair (e.g., payment delays, one-sided termination).
     🔍 HIDDEN & UNFAIR CLAUSES:• Mention vague terms or auto-renewal traps. Explain how they harm the client and what to question the other party about.
     ✅ SUMMARY & RECOMMENDATION:• Give a short risk rating (Low / Medium / High) and 1-line advice (e.g., “Needs negotiation before signing”).
     Keep tone formal, concise, and Telegram-safe (no markdown tables, long code, or bullets over 5).
     ```  
   - Connect input from Extract Text from PDF File node  
   - Set AI language model to the Google Gemini Chat Model node  

7. **Add Telegram Node to Send Message**  
   - Name: Send a text message  
   - Type: Telegram  
   - Chat ID: Enter your Telegram chat or channel ID here  
   - Text: `{{ $json.output }}` (the AI Agent output)  
   - Disable "append attribution" option for a clean message  
   - Use Telegram API credentials with the bot authorized to send messages to the chat  
   - Connect input from AI Agent node output  

8. **Connect all nodes sequentially as per above descriptions**  
   - JotForm Trigger → Grab Attachment Details → Grab the attached Contract → Extract Text from PDF File → AI Agent (with Google Gemini Chat Model as LLM) → Send a text message  

9. **Credential Setup**  
   - JotForm API: Create and store API key credentials for JotForm Trigger and HTTP Request nodes  
   - Google Palm API: Setup credentials for Google Gemini Chat Model node  
   - Telegram API: Setup bot credentials authorized to send messages to your target chat/channel  

10. **Testing**  
    - Submit a test form with a contract attached  
    - Verify each step completes without error  
    - Confirm Telegram message with contract analysis is received  

---

### 5. General Notes & Resources

| Note Content                                                                                     | Context or Link                                           |
|-------------------------------------------------------------------------------------------------|-----------------------------------------------------------|
| Workflow uses custom JotForm API calls to access submission attachments beyond standard trigger. | JotForm API documentation: https://api.jotform.com/docs/ |
| The AI Agent prompt is carefully designed to produce Telegram-safe, concise contract summaries. | Prompt design best practices for chatbots and Telegram.  |
| Telegram bot must have permissions to post in the target chat/channel before use.                | Telegram Bot API: https://core.telegram.org/bots/api      |
| Google Gemini (PaLM) API usage requires Google Cloud credentials with language model access.     | Google PaLM API docs: https://developers.generativeai.google |

---

**Disclaimer:** The provided text is generated exclusively from an automation workflow built with n8n, respecting content policies and containing no illegal or protected material. All data handled is public and lawful.