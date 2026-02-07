Automate Gmail Responses with GPT and Human-in-the-loop Verification

https://n8nworkflows.xyz/workflows/automate-gmail-responses-with-gpt-and-human-in-the-loop-verification-10344


# Automate Gmail Responses with GPT and Human-in-the-loop Verification

### 1. Workflow Overview

This workflow automates responses to incoming Gmail messages by leveraging AI to draft replies that are then subject to human approval before being sent. It is designed for businesses that want to streamline email handling while maintaining control over outgoing communications.

**Target use cases:**  
- Businesses managing high email volumes seeking automated first-draft replies.  
- Email communication workflows requiring human-in-the-loop verification to ensure quality and appropriateness.  

**Logical blocks:**  
- **1.1 Input Reception:** Detect new incoming emails from Gmail.  
- **1.2 Business Context Setup:** Define company information and response guidelines to guide AI.  
- **1.3 AI Analysis:** Determine if an incoming email needs a reply.  
- **1.4 Conditional Routing:** Branch logic based on whether a reply is needed.  
- **1.5 Draft Generation:** Use AI to create a contextually appropriate HTML email draft.  
- **1.6 Draft Cleanup:** Process AI-generated HTML to remove unwanted characters and standardize formatting.  
- **1.7 Human Approval:** Send draft to a designated user for approval via email with inline content.  
- **1.8 Final Send:** Upon approval, automatically send the reply through Gmail.  

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
Monitors Gmail inbox for new emails, triggering the workflow whenever a new message arrives.

**Nodes Involved:**  
- Gmail Trigger

**Node Details:**  
- **Gmail Trigger**  
  - Type: Trigger node for Gmail API.  
  - Configuration: Polls every minute; simple mode disabled to access extended email details.  
  - Credentials: OAuth2 for Gmail account.  
  - Input: None (triggered by new email).  
  - Output: Full email metadata, headers, and content.  
  - Edge cases: Gmail API quota limits; authentication token expiry; handling of multipart emails.  
  - Sticky note: "Connect Your Gmail Account" (reminds user to connect Gmail).  

---

#### 1.2 Business Context Setup

**Overview:**  
Sets static contextual information about the business entity to guide AI responses, including entity name, description, resource guides, and response style guidelines.

**Nodes Involved:**  
- Your Information (Set node)  
- Sticky Note (explaining user must customize this info)

**Node Details:**  
- **Your Information**  
  - Type: Set node to define fixed JSON properties.  
  - Configuration: Defines entity_name, entity_description, email_to_receive_approval, information_resource_guide containing FAQs and service details, response_guidelines with formatting and style rules for AI replies.  
  - Input: From Gmail Trigger node.  
  - Output: Enhanced JSON with business context for AI.  
  - Edge cases: Missing or incomplete info could mislead AI; ensure up-to-date and accurate data.  
  - Sticky note: "Your Information: Please edit business info" to ensure user updates this node.  

---

#### 1.3 AI Analysis (Needs Reply Decision)

**Overview:**  
Uses AI to determine whether the incoming email requires a response, filtering out auto-responses and out-of-office messages.

**Nodes Involved:**  
- Determines if Email Needs Response (Information Extractor node)  
- OpenAI Chat Model (Langchain Chat Model node)  
- Sticky Note (explaining LLM selection)

**Node Details:**  
- **Determines if Email Needs Response**  
  - Type: Information Extractor node (Langchain) querying AI to answer "yes" or "no" re: reply needed.  
  - Configuration: Passes email subject and HTML body plus business context from "Your Information."  
  - Input: Business context and Gmail Trigger output.  
  - Output: JSON with boolean "needs_reply" property.  
  - Edge cases: Ambiguous emails may confuse AI; ensure prompt clarity.  
- **OpenAI Chat Model**  
  - Type: OpenAI GPT-4.1-mini LLM node used as AI backend for extraction and generation.  
  - Credentials: OpenAI API key.  
  - Connected to "Determines if Email Needs Response" and "Drafts Email Response (HTML)."  
  - Sticky note: "Select Your LLM" reminds user to configure AI model and credentials.  

---

#### 1.4 Conditional Routing (Branch based on AI decision)

**Overview:**  
Routes workflow based on whether AI determined the email needs a reply.

**Nodes Involved:**  
- If Email Needs Response (If node)

**Node Details:**  
- **If Email Needs Response**  
  - Type: If node evaluating boolean condition `$json.output.needs_reply == true`.  
  - Input: Output from "Determines if Email Needs Response."  
  - Output: Two branches — Yes (needs reply) and No (no reply, ends workflow).  
  - Edge cases: Missing or malformed AI output could cause faulty routing.  

---

#### 1.5 Draft Generation (AI Response Drafting)

**Overview:**  
Generates a detailed, HTML-formatted draft reply based on the original email and business context.

**Nodes Involved:**  
- Drafts Email Response (HTML) (Information Extractor node)

**Node Details:**  
- **Drafts Email Response (HTML)**  
  - Type: Information Extractor node (Langchain) used to prompt AI for a reply.  
  - Configuration:  
    - Prompt includes business entity info, original email subject, sender name and email, full HTML email body, resource guide, and response guidelines.  
    - Instructs AI to produce a friendly, HTML-formatted email without signature or emojis.  
  - Input: Email and context data from previous nodes.  
  - Output: AI-generated JSON containing HTML response in `email_body`.  
  - Edge cases: AI hallucination, partial or incorrect HTML output, or inclusion of unwanted formatting artifacts.  
  - Sticky note: "Determines if Email Needs a Response & Drafts Response" explains this block.  

---

#### 1.6 Draft Cleanup

**Overview:**  
Processes AI-generated HTML draft to remove newline characters, escaped characters, extra spaces, backslashes, and HTML comments for clean final formatting.

**Nodes Involved:**  
- Clean Up Email Code (Code node)

**Node Details:**  
- **Clean Up Email Code**  
  - Type: JavaScript Code node.  
  - Configuration: Custom JS function that:  
    - Retrieves raw HTML draft from previous node.  
    - Performs regex-based replacements to normalize white space and remove unwanted characters and comments.  
  - Input: JSON with `email_body` from AI draft node.  
  - Output: JSON with field `cleaned` containing sanitized HTML string.  
  - Edge cases: Unexpected input types; malformed HTML could cause improper cleaning; ensure robust error handling.  
  - Sticky note: None specifically, but logically grouped with draft generation and approval.  

---

#### 1.7 Human Approval

**Overview:**  
Sends an email to a designated approver with the AI draft included for review, requiring explicit approval before sending.

**Nodes Involved:**  
- Ask User for Approval (Gmail node)  
- Approved? (If node)

**Node Details:**  
- **Ask User for Approval**  
  - Type: Gmail node configured to send and wait for reply (approval).  
  - Configuration:  
    - Sends to email specified in "Your Information" (hardcoded in node).  
    - Message body includes original sender info, initial message text, and the cleaned draft reply.  
    - Subject prepended with "Review & Approve Reply" and original email subject.  
    - Uses "sendAndWait" operation with double approval type.  
  - Credentials: Separate Gmail OAuth2 account for approval email.  
  - Input: Cleaned draft HTML from cleanup node and original email details.  
  - Output: Approval status JSON stored in `.data.approved`.  
  - Edge cases: Email delivery failures, delayed or missing approvals, authentication errors.  
  - Sticky note: "Please Update With Your Gmail Account" reminds user to configure credentials.  
- **Approved?**  
  - Type: If node evaluating if `.data.approved` is true.  
  - Input: Output from approval node.  
  - Output: Yes branch triggers final send; No branch stops workflow.  
  - Edge cases: Missing approval data or malformed response could block sending.  

---

#### 1.8 Final Send

**Overview:**  
Automatically sends the approved draft reply back to the original sender via Gmail.

**Nodes Involved:**  
- Send Reply (Gmail node)

**Node Details:**  
- **Send Reply**  
  - Type: Gmail node configured to reply to original email.  
  - Configuration:  
    - Message body is the cleaned HTML draft from cleanup node.  
    - Includes a full HTML email signature block with branding and compliance text.  
    - Uses original email's message ID to reply correctly.  
  - Credentials: Gmail OAuth2 account (same as input Gmail or configured separately).  
  - Input: Approved cleaned draft HTML and original email metadata.  
  - Edge cases: Gmail quota limits, message ID mismatches, email formatting issues, auth token expiry.  
  - Sticky note: "Please Update With Your Gmail Account" for credential setup.  

---

### 3. Summary Table

| Node Name                     | Node Type                           | Functional Role                              | Input Node(s)                 | Output Node(s)              | Sticky Note                                                                                  |
|-------------------------------|-----------------------------------|----------------------------------------------|------------------------------|-----------------------------|---------------------------------------------------------------------------------------------|
| Gmail Trigger                 | Gmail Trigger                     | Trigger workflow on new Gmail email          | None                         | Your Information            | Connect Your Gmail Account                                                                  |
| Your Information             | Set                              | Provide business context and response rules  | Gmail Trigger                | Determines if Email Needs Response | Your Information: Please edit business info                                                |
| Determines if Email Needs Response | Information Extractor (Langchain) | Decide if incoming email requires a reply    | Your Information             | If Email Needs Response      | Select Your LLM                                                                            |
| If Email Needs Response      | If                               | Branch logic based on AI decision             | Determines if Email Needs Response | Drafts Email Response (HTML) |                                                                                             |
| Drafts Email Response (HTML) | Information Extractor (Langchain) | Generate AI draft reply in HTML format        | If Email Needs Response (Yes) | Clean Up Email Code          | Determines if Email Needs a Response & Drafts Response                                     |
| Clean Up Email Code          | Code                             | Clean AI-generated HTML draft                  | Drafts Email Response (HTML) | Ask User for Approval        |                                                                                             |
| Ask User for Approval        | Gmail                            | Send draft for human approval via email       | Clean Up Email Code          | Approved?                   | Please Update With Your Gmail Account                                                      |
| Approved?                   | If                               | Evaluate if draft was approved for sending    | Ask User for Approval        | Send Reply                  |                                                                                             |
| Send Reply                   | Gmail                            | Send approved reply to original email sender  | Approved?                   | None                        | Please Update With Your Gmail Account                                                      |
| Sticky Note                 | Sticky Note                      | Instructional or informational notes           | None                         | None                        | See node-specific sticky note column                                                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Gmail Trigger node**  
   - Type: Gmail Trigger  
   - Set to poll every minute (mode: everyMinute)  
   - Disable simple mode to access full email data  
   - Connect Gmail OAuth2 credentials  
   - Position: start of workflow  

2. **Create Set node "Your Information"**  
   - Add fields:  
     - `entity_name` (string): Your business name  
     - `entity_description` (string): Brief business description  
     - `email_to_receive_approval` (string): Email to receive approval requests  
     - `information_resource_guide` (string): Detailed resource guide for AI context  
     - `response_guidelines` (string): Instructions for AI response style (HTML formatting, tone, no emojis/signature)  
   - Connect output of Gmail Trigger to this node  

3. **Create OpenAI Chat Model node**  
   - Type: Langchain Chat Model (OpenAI)  
   - Model: GPT-4.1-mini or preferred LLM  
   - Connect OpenAI API credentials  

4. **Create "Determines if Email Needs Response" node**  
   - Type: Information Extractor (Langchain)  
   - Prompt: Ask AI if email requires a reply, including business context and email content  
   - Connect input from "Your Information" and AI model via `ai_languageModel` connection  
   - Output JSON field: `needs_reply` (boolean)  

5. **Create "If Email Needs Response" node**  
   - Type: If  
   - Condition: Check if `$json.output.needs_reply` equals `true`  
   - Connect input from "Determines if Email Needs Response"  

6. **Create "Drafts Email Response (HTML)" node**  
   - Type: Information Extractor (Langchain)  
   - Prompt: Instruct AI to draft reply as your business entity, using original email HTML, sender info, resource guide, and response guidelines  
   - Connect input from "If Email Needs Response" (true branch) and AI model  

7. **Create "Clean Up Email Code" node**  
   - Type: Code (JavaScript)  
   - Paste the provided JS code to clean the AI-generated HTML string: remove newlines, escaped chars, multiple spaces, backslashes, non-breaking spaces, and HTML comments  
   - Input: JSON field `output.email_body` from "Drafts Email Response (HTML)"  

8. **Create "Ask User for Approval" node**  
   - Type: Gmail  
   - Operation: sendAndWait (wait for user reply)  
   - Send To: Use `email_to_receive_approval` from "Your Information" or hardcode approver email  
   - Subject: "Review & Approve Reply: {{ original email subject }}"  
   - Message: Include original sender info, initial message, and cleaned draft reply from previous node  
   - Connect input from "Clean Up Email Code"  
   - Credentials: Separate Gmail account OAuth2 for sending approval requests  

9. **Create "Approved?" node**  
   - Type: If  
   - Condition: Check if `.data.approved` is true from approval reply  
   - Connect input from "Ask User for Approval"  

10. **Create "Send Reply" node**  
    - Type: Gmail  
    - Operation: reply to original message ID  
    - Message body: cleaned HTML draft reply plus full HTML email signature block  
    - Connect input from "Approved?" (true branch)  
    - Credentials: Gmail OAuth2 (same or different account as trigger)  

11. **Connect nodes accordingly:**  
    - Gmail Trigger → Your Information → Determines if Email Needs Response → If Email Needs Response  
    - If Email Needs Response (true) → Drafts Email Response (HTML) → Clean Up Email Code → Ask User for Approval → Approved?  
    - Approved? (true) → Send Reply  

12. **Add sticky notes as reminders for user customization:**  
    - Connect Gmail accounts credentials  
    - Update business info & response guidelines  
    - Configure OpenAI credentials and choose preferred LLM  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                | Context or Link                                            |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------|
| The workflow includes detailed response guidelines to ensure AI-generated replies are friendly, HTML formatted, without emojis or signatures, and use lists for readability.                                                                                                  | See "response_guidelines" in "Your Information" node       |
| Approval emails use "sendAndWait" Gmail node operation with double approval to ensure human verification before sending.                                                                                                                                                    | Gmail node "Ask User for Approval"                          |
| Email signature includes GDPR, SOC 2, HIPAA compliance disclaimers and company branding images to maintain professionalism and legal compliance.                                                                                                                             | HTML signature in "Send Reply" node                         |
| Workflow requires careful configuration of OAuth2 credentials for Gmail accounts (both trigger and approval sending) and OpenAI API keys.                                                                                                                                   | Sticky notes remind user to update credentials              |
| Business context should be kept up to date to maintain AI relevance and accuracy in replies.                                                                                                                                                                                 | "Your Information" Set node details                         |
| For troubleshooting: check Gmail API quotas, token validity, and monitor AI response quality for edge cases like ambiguous emails or malformed HTML output.                                                                                                                  | General operational advice                                  |
| Template author: Nick Canfield, Tropic Flare — contact at nick@tropicflare.com for assistance.                                                                                                                                                                               | See Sticky Note2 content                                    |

---

**Disclaimer:**  
The text provided originates solely from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects applicable content policies and contains no illegal, offensive, or protected material. All data handled is legal and public.