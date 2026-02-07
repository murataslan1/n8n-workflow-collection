Automate Email Responses with OpenAI and Telegram Approval for Gmail

https://n8nworkflows.xyz/workflows/automate-email-responses-with-openai-and-telegram-approval-for-gmail-6026


# Automate Email Responses with OpenAI and Telegram Approval for Gmail

### 1. Workflow Overview

This workflow automates email response generation and delivery for Gmail using AI and Telegram for approval. Its target use case is professionals or teams who want to efficiently manage incoming emails by automatically generating appropriate replies, yet retaining human oversight before sending. It smartly filters emails requiring responses, drafts replies with OpenAI, and then requests user approval via Telegram before sending the final email.

The workflow is logically divided into these blocks:

- **1.1 Input Reception:** Monitor Gmail inbox for new emails and filter relevant ones.
- **1.2 AI Decision-making:** Use AI to decide if an email needs a reply.
- **1.3 Email Reply Generation:** Generate a professional reply using AI.
- **1.4 Human Approval via Telegram:** Present AI-generated reply on Telegram for user approval.
- **1.5 Email Sending:** Send the approved reply via Gmail.
- **1.6 Exit Handling:** Nodes to gracefully exit the workflow when no reply is needed or approval is denied.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
This block listens for all new incoming Gmail emails and filters to process only those in the Inbox (excluding sent, drafts, etc.).

**Nodes Involved:**  
- Trigger: New Email  
- Check: Is Email in Inbox?  
- No Operation, do nothing  

**Node Details:**  

- **Trigger: New Email**  
  - Type: Gmail Trigger (polling)  
  - Configuration: Polls Gmail inbox every minute for new emails (simple=false to get full email data).  
  - Inputs: None (entry node)  
  - Outputs: Passes full email data to next node  
  - Edge cases: API rate limits, connectivity, OAuth token expiry  
  - Credentials: Gmail OAuth2 account configured  

- **Check: Is Email in Inbox?**  
  - Type: If node  
  - Configuration: Checks if the email's labelIds array contains "INBOX" to ensure processing only inbox emails.  
  - Inputs: Email data from trigger  
  - Outputs: Yes → AI decision block; No → No Operation node  
  - Edge cases: Emails without labelIds or malformed data  
  - Version: v2.2 (supports advanced conditions)  

- **No Operation, do nothing**  
  - Type: NoOp node  
  - Configuration: Does nothing, used to terminate paths for non-inbox emails  
  - Inputs: From check node (No output)  
  - Outputs: None  

---

#### 1.2 AI Decision-making

**Overview:**  
Determines whether an incoming email requires a reply using OpenAI. Only emails that ask questions, request actions, or seem urgent proceed.

**Nodes Involved:**  
- AI: Should We Reply?  
- Parse: Reply Decision JSON  
- Check: Response Required?  
- Exit: No Reply Needed  

**Node Details:**  

- **AI: Should We Reply?**  
  - Type: Langchain Agent (AI decision)  
  - Configuration:  
    - Input prompt includes email metadata (date, from, subject) and content.  
    - System message instructs the AI to respond only with JSON `{"response": "yes"}` or `{"response": "no"}` based on criteria: questions, requests, urgency, work/legal matters.  
    - Output parser enabled for JSON parsing.  
  - Inputs: Email data from Check: Is Email in Inbox?  
  - Outputs: JSON decision to parse node  
  - Credentials: OpenAI API  
  - Edge cases: AI output malformed JSON, API errors, network issues  

- **Parse: Reply Decision JSON**  
  - Type: Structured Output Parser  
  - Configuration: JSON schema expects `{ "response": "yes" | "no" }`  
  - Inputs: AI node output  
  - Outputs: Parsed JSON decision to next If node  
  - Edge cases: Parsing failures, empty or invalid AI output  

- **Check: Response Required?**  
  - Type: If node  
  - Configuration: Checks if parsed `response` equals `"yes"`  
  - Inputs: parsed JSON from parse node  
  - Outputs: Yes → Email reply generation; No → Exit node  
  - Edge cases: Missing or unexpected values  

- **Exit: No Reply Needed**  
  - Type: NoOp node  
  - Configuration: Ends workflow path when no reply is required  

---

#### 1.3 Email Reply Generation

**Overview:**  
Generates a professional AI-crafted email reply with subject and body in JSON format.

**Nodes Involved:**  
- AI: Generate Email Reply (Langchain Agent)  
- Structured Output Parser1  
- OpenAI Chat Model1  

**Node Details:**  

- **AI: Generate Email Reply**  
  - Type: Langchain Agent  
  - Configuration:  
    - Inputs include current date, original email metadata, and content from the trigger node.  
    - System message instructs the AI to produce a professional reply without greetings/sign-offs unless necessary.  
    - The output must be JSON with `email`, `subject`, and `body` fields; if no reply needed, subject and body are blank.  
    - Output parser enabled.  
  - Inputs: From Check: Response Required? (Yes path)  
  - Outputs: Parsed JSON to Telegram approval node  
  - Credentials: OpenAI API  
  - Edge cases: API failure, JSON formatting errors, empty or irrelevant reply  

- **Structured Output Parser1**  
  - Type: Structured Output Parser  
  - Configuration: JSON schema example with `email`, `subject`, `body` fields  
  - Inputs: AI: Generate Email Reply output  
  - Outputs: Parsed data to Telegram node  

- **OpenAI Chat Model1**  
  - Type: OpenAI Chat API node  
  - Configuration: Uses official OpenAI API endpoint  
  - Inputs: Used internally by Langchain agent nodes  
  - Credentials: OpenAI API  

---

#### 1.4 Human Approval via Telegram

**Overview:**  
Sends the original email and AI-generated reply to a Telegram chat, awaiting user approval (double confirmation) before sending.

**Nodes Involved:**  
- Telegram: Send + Approve  
- Check: Telegram Approved?  
- Exit: Telegram Not Approved  

**Node Details:**  

- **Telegram: Send + Approve**  
  - Type: Telegram node (sendAndWait operation)  
  - Configuration:  
    - Sends formatted message including original email details and AI reply.  
    - Chat ID is hardcoded (user's Telegram ID).  
    - Approval type is double confirmation (two-step approval).  
    - 5-minute timeout for response.  
  - Inputs: AI-generated reply data  
  - Outputs: Approval result JSON to If node  
  - Credentials: Telegram API token  
  - Edge cases: Telegram API errors, user timeout, no response  

- **Check: Telegram Approved?**  
  - Type: If node  
  - Configuration: Checks if `data.approved` equals `"true"` (string) from Telegram approval response.  
  - Inputs: Telegram node output  
  - Outputs: Yes → Send email node; No → Exit node  
  - Edge cases: Missing approval field, timeout results  

- **Exit: Telegram Not Approved**  
  - Type: NoOp node  
  - Configuration: Ends workflow if user rejects or times out  

---

#### 1.5 Email Sending

**Overview:**  
Sends the approved AI-generated reply via Gmail.

**Nodes Involved:**  
- Send a message  

**Node Details:**  

- **Send a message**  
  - Type: Gmail node (send email)  
  - Configuration:  
    - Sends email to the address specified in AI-generated reply JSON.  
    - Subject and body taken from AI output.  
    - Email type is plain text.  
  - Inputs: From Telegram approval (Yes path)  
  - Outputs: None (last node)  
  - Credentials: Gmail OAuth2  
  - Edge cases: Gmail API errors, invalid recipient, OAuth expiry  

---

#### 1.6 Exit Handling

**Overview:**  
Gracefully terminates workflow paths when no reply is needed or approval denied.

**Nodes Involved:**  
- Exit: No Reply Needed  
- Exit: Telegram Not Approved  

**Node Details:**  
Both are NoOp nodes used as termination points without side effects.

---

### 3. Summary Table

| Node Name                | Node Type                          | Functional Role                      | Input Node(s)                    | Output Node(s)                   | Sticky Note                                                                                                                     |
|--------------------------|----------------------------------|------------------------------------|---------------------------------|---------------------------------|--------------------------------------------------------------------------------------------------------------------------------|
| Trigger: New Email       | Gmail Trigger                    | Detect new incoming emails          | None                            | Check: Is Email in Inbox?        | ## 🤖 AI Email Reply Assistant\n\n## 🔄 What this workflow does\nThis automation monitors your Gmail inbox, intelligently decides which emails need replies, generates professional responses using AI, and sends them after your approval via Telegram. |
| Check: Is Email in Inbox?| If                              | Filter to process only inbox emails | Trigger: New Email              | AI: Should We Reply?, No Operation, do nothing |                                                                                                                                |
| No Operation, do nothing | NoOp                            | Skip processing non-inbox emails    | Check: Is Email in Inbox? (No)  | None                            |                                                                                                                                |
| AI: Should We Reply?      | Langchain Agent                 | Decide if email requires reply      | Check: Is Email in Inbox? (Yes) | Parse: Reply Decision JSON       |                                                                                                                                |
| Parse: Reply Decision JSON| Structured Output Parser        | Parse AI JSON decision              | AI: Should We Reply?             | Check: Response Required?        |                                                                                                                                |
| Check: Response Required? | If                             | Route based on AI reply decision    | Parse: Reply Decision JSON       | AI: Generate Email Reply, Exit: No Reply Needed |                                                                                                                                |
| Exit: No Reply Needed     | NoOp                           | Exit path when no reply needed      | Check: Response Required? (No)   | None                            |                                                                                                                                |
| AI: Generate Email Reply  | Langchain Agent                 | Generate professional email reply  | Check: Response Required? (Yes)  | Structured Output Parser1        |                                                                                                                                |
| Structured Output Parser1 | Structured Output Parser        | Parse AI-generated reply JSON      | AI: Generate Email Reply         | Telegram: Send + Approve         |                                                                                                                                |
| OpenAI Chat Model1        | OpenAI Chat API node            | Underlying AI model for reply gen  | Internal to Langchain agent      | Internal                       |                                                                                                                                |
| Telegram: Send + Approve  | Telegram                       | Send AI reply and original email for approval | Structured Output Parser1        | Check: Telegram Approved?        |                                                                                                                                |
| Check: Telegram Approved? | If                             | Check user approval status from Telegram | Telegram: Send + Approve          | Send a message, Exit: Telegram Not Approved |                                                                                                                                |
| Exit: Telegram Not Approved| NoOp                           | Exit path if user rejects or times out | Check: Telegram Approved? (No)   | None                            |                                                                                                                                |
| Send a message            | Gmail                          | Send approved reply via Gmail      | Check: Telegram Approved? (Yes)  | None                            |                                                                                                                                |
| AI: Should We Reply?      | Langchain Agent                 | AI decision for reply necessity    | Check: Is Email in Inbox? (Yes)  | Parse: Reply Decision JSON       |                                                                                                                                |
| Sticky Note               | Sticky Note                    | Documentation and workflow summary | None                            | None                            | ## 🤖 AI Email Reply Assistant\n\n## 🔄 What this workflow does\nThis automation monitors your Gmail inbox, intelligently decides which emails need replies, generates professional responses using AI, and sends them after your approval via Telegram. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Gmail Trigger node**  
   - Type: Gmail Trigger  
   - Credentials: Connect Gmail OAuth2 account  
   - Poll interval: Every minute  
   - Advanced: Set `simple` to false for full email details  

2. **Create If node "Check: Is Email in Inbox?"**  
   - Condition: Check if `labelIds` array contains `"INBOX"`  
   - Connect input from Gmail Trigger node  
   - Yes output continues; No output connects to NoOp  

3. **Create NoOp node "No Operation, do nothing"**  
   - Connect input from No output of Inbox check  

4. **Create Langchain Agent node "AI: Should We Reply?"**  
   - Connect Yes output from Inbox check  
   - Input Expression: Include current date, email headers (date, from, subject), and email text content  
   - System prompt: Instruct AI to respond only with JSON `{ "response": "yes" }` or `{ "response": "no" }` based on whether email needs reply (criteria: questions, requests, urgency, work/legal)  
   - Enable output parser for JSON  

5. **Create Structured Output Parser "Parse: Reply Decision JSON"**  
   - Connect input from AI: Should We Reply? node  
   - JSON schema example: `{ "response": "no" }`  

6. **Create If node "Check: Response Required?"**  
   - Connect input from parser node  
   - Condition: Check if `$json.output.response == "yes"`  
   - Yes output to email generation; No output to Exit No Reply Needed node  

7. **Create NoOp node "Exit: No Reply Needed"**  
   - Connect input from No output of response required check  

8. **Create Langchain Agent node "AI: Generate Email Reply"**  
   - Connect Yes output from response required check  
   - Input Expression: Provide current date, original email headers (date, from, subject), and content from Gmail Trigger node  
   - System prompt: Instruct AI to generate a professional email reply in JSON format with fields `email`, `subject`, and `body`, or blank if no reply needed  
   - Enable output parser for JSON  

9. **Create Structured Output Parser "Structured Output Parser1"**  
   - Connect input from Generate Email Reply node  
   - JSON schema example: `{ "email": "email address", "subject": "subject text", "body": "body text" }`  

10. **Create Telegram node "Telegram: Send + Approve"**  
    - Connect input from Structured Output Parser1  
    - Credentials: Connect Telegram API with bot token  
    - Operation: sendAndWait  
    - Chat ID: Your Telegram user ID (hardcoded)  
    - Message: Compose message including original email from, subject, content and AI-generated reply fields  
    - Approval options: Double approval required  
    - Timeout: 5 minutes  

11. **Create If node "Check: Telegram Approved?"**  
    - Connect input from Telegram node  
    - Condition: Check if `$json.data.approved == "true"` (string)  
    - Yes output to Gmail send message node; No output to Exit Telegram Not Approved node  

12. **Create NoOp node "Exit: Telegram Not Approved"**  
    - Connect input from No output of Telegram approval check  

13. **Create Gmail node "Send a message"**  
    - Connect input from Yes output of Telegram approval check  
    - Credentials: Gmail OAuth2 account  
    - Send To: Use expression to get `email` from AI-generated reply JSON  
    - Subject: Use expression to get `subject` from AI-generated reply JSON  
    - Message: Use expression to get `body` from AI-generated reply JSON  
    - Email Type: Text  

14. **Create the necessary OpenAI Chat API credentials**  
    - Create and assign OpenAI API credentials for Langchain agent nodes  

15. **Connect all nodes accordingly**  
    - Gmail Trigger → Check Inbox  
    - Inbox Yes → AI Should We Reply? → Parse → Check Response Required?  
    - Check Response Required Yes → AI Generate Reply → Structured Parser → Telegram Send + Approve → Check Telegram Approved?  
    - Telegram Approved Yes → Send Gmail  
    - Corresponding No outputs → appropriate NoOp exit nodes or no operation nodes as per above  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Context or Link                                                                                       |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| This automation monitors your Gmail inbox, intelligently decides which emails need replies, generates professional responses using AI, and sends them after your approval via Telegram. It supports mobile control and human-in-the-loop approval for full oversight.                                                                                                                                                                                                                                      | Workflow description sticky note inside the workflow                                               |
| Perfect for busy professionals, customer service teams, sales teams, or anyone requiring AI-assisted email management with human approval.                                                                                                                                                                                                                                                                                                                                                               | Workflow use case notes                                                                             |

---

**Disclaimer:** The provided text is exclusively from a workflow automated using n8n, a tool for integration and automation. This process respects all current content policies and contains no illegal, offensive, or protected elements. All processed data is legal and public.