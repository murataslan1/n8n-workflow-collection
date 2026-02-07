AI Sales Agent with Telegram Approvals & Google Sheets Sync

https://n8nworkflows.xyz/workflows/ai-sales-agent-with-telegram-approvals---google-sheets-sync-5074


# AI Sales Agent with Telegram Approvals & Google Sheets Sync

### 1. Workflow Overview

This n8n workflow implements an AI-powered sales agent for a food delivery business, integrated with Telegram for customer interaction and Google Sheets for order record-keeping. It is designed to handle customer orders via Telegram, process them with an AI assistant, manage order confirmations and payments through human approval, and synchronize order data to Google Sheets. The workflow includes conversational memory, payment verification with screenshot forwarding, admin approval, and status updates.

**Logical blocks:**

- **1.1 Input Reception:** Receives incoming Telegram messages from customers.
- **1.2 Payment Screenshot Verification:** Detects payment screenshots and handles forwarding.
- **1.3 Admin Approval Handling:** Sends payment info to admin and processes approval or decline.
- **1.4 AI Sales Agent Interaction:** Processes customer messages with AI to handle order flow.
- **1.5 Conversation Memory:** Maintains session context for ongoing chats.
- **1.6 Order Logging:** Appends confirmed order data to Google Sheets.
- **1.7 Telegram Response:** Sends AI-generated responses and status updates back to customers.
- **1.8 Setup & Documentation:** Includes sticky notes for setup instructions, workflow explanation, and customization guides.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

**Overview:**  
This block triggers the workflow upon receiving Telegram messages (orders, customer inquiries, payment screenshots).

**Nodes Involved:**  
- Telegram Trigger

**Node Details:**

- **Telegram Trigger**  
  - Type: Telegram Trigger (n8n-nodes-base.telegramTrigger)  
  - Role: Listens for new Telegram messages ("message" update)  
  - Configuration: No filters; captures all message updates  
  - Input: Incoming Telegram webhook updates  
  - Output: Passes message JSON to next node for processing  
  - Possible Failures: Telegram webhook misconfiguration, network issues  
  - Version: 1.1  

---

#### 2.2 Payment Screenshot Verification

**Overview:**  
Identifies if the incoming Telegram message contains a payment screenshot (photo without text). If yes, forwards it to admin for approval.

**Nodes Involved:**  
- Payment Screenshot Check  
- Forward Payment Screenshot

**Node Details:**

- **Payment Screenshot Check**  
  - Type: If node (n8n-nodes-base.if)  
  - Role: Conditionally routes messages based on presence of photos without accompanying text (indicating payment screenshot)  
  - Configuration:  
    - Checks if `message.photo[0]` exists (photo sent)  
    - Checks that `message.text` does NOT exist (no text message)  
  - Input: JSON from Telegram Trigger  
  - Output: Two branches:  
    - True branch: message contains photo only → to Forward Payment Screenshot  
    - False branch: passes message to AI Agent for normal processing  
  - Failures: Node expression errors if message structure is unexpected  

- **Forward Payment Screenshot**  
  - Type: Telegram node (n8n-nodes-base.telegram)  
  - Role: Forwards received payment screenshot photo and caption to admin Telegram chat  
  - Configuration:  
    - Sends photo using file_id from incoming message  
    - Caption forwarded from original message caption  
  - Input: True branch from Payment Screenshot Check  
  - Output: Sends photo to admin, then triggers Admin Approval Request node  
  - Failures: Telegram API errors (invalid file_id, authorization failures)  

---

#### 2.3 Admin Approval Handling

**Overview:**  
Sends a message to admin requesting payment approval, then classifies admin response as approved or declined, triggering corresponding actions.

**Nodes Involved:**  
- Admin Approval Request  
- Check Feedback  
- Payment Declined  
- AI Agent (approval path)

**Node Details:**

- **Admin Approval Request**  
  - Type: Telegram node (n8n-nodes-base.telegram)  
  - Role: Sends admin a message to approve or decline the payment, waits for free text response  
  - Configuration:  
    - Message text: "Payment received for order. Approve or decline?"  
    - Operation: sendAndWait (waits for admin response)  
  - Input: From Forward Payment Screenshot  
  - Output: Admin response forwarded to Check Feedback node  
  - Failures: Timeout waiting for response, Telegram API failures  

- **Check Feedback**  
  - Type: Text Classifier (Langchain textClassifier)  
  - Role: Classifies admin response text into categories "approved" or "declined"  
  - Configuration:  
    - Input text: admin reply (`$json.data.text`)  
    - Categories:  
      - approved: means order payment is approved  
      - declined: means order payment is rejected  
  - Input: Admin response text  
  - Output:  
    - If approved: continues to AI Agent for confirmation and logging  
    - If declined: triggers Payment Declined message to user  
  - Failures: Misclassification, unexpected admin inputs  

- **Payment Declined**  
  - Type: Telegram node  
  - Role: Sends rejection message to customer if payment verification fails  
  - Configuration:  
    - Text: "❌ Sorry, we couldn't verify your payment. Please send a clearer screenshot or try again."  
    - Chat ID: from original Telegram message  
  - Input: Declined category from Check Feedback  
  - Output: Ends flow for declined payments  
  - Failures: Telegram API errors  

---

#### 2.4 AI Sales Agent Interaction

**Overview:**  
Processes customer messages (non-payment screenshot) with AI assistant that manages the conversational order flow and replies accordingly.

**Nodes Involved:**  
- AI Agent  
- Telegram (response node)  
- Simple Memory  
- Google Gemini Chat Model (language model integration)

**Node Details:**

- **AI Agent**  
  - Type: Langchain Agent node (`@n8n/n8n-nodes-langchain.agent`)  
  - Role: Core AI processing node that interprets customer messages and manages order dialogue  
  - Configuration:  
    - Input text: concatenates `$json.message.text` and `$json.data.text` (to handle multiple input forms)  
    - System message: detailed assistant prompt describing business, menu, order flow, payment instructions, and approval handling  
    - Prompt includes placeholders for business info, menu, pricing, timezone, payment details, etc., to be customized  
  - Inputs:  
    - Receives Telegram messages (non-screenshot) and classified admin approval signals  
    - Uses Simple Memory node as memory source  
    - Uses Google Gemini Chat Model as language model backend  
  - Outputs: AI-generated text responses for Telegram node  
  - Failures: API key errors, rate limits, prompt misconfiguration, incomplete input data  

- **Simple Memory**  
  - Type: Langchain Memory Buffer Window  
  - Role: Maintains a sliding window of recent conversation history keyed by Telegram chat ID to maintain context  
  - Configuration:  
    - Session Key: Telegram chat ID from trigger message  
    - Context window length: 10 messages  
  - Inputs: Messages from Telegram Trigger  
  - Outputs: Provides conversation context to AI Agent  
  - Failures: Session key extraction errors, scaling issues with many conversations  

- **Google Gemini Chat Model**  
  - Type: Langchain Language Model (Google Gemini)  
  - Role: Provides the AI model for text generation used by AI Agent and Check Feedback  
  - Configuration:  
    - Model Name: "models/gemini-2.0-flash-exp"  
  - Inputs: Text prompts from AI Agent and Check Feedback nodes  
  - Outputs: Generated text or classification results  
  - Failures: API key or quota issues  

- **Telegram (response node)**  
  - Type: Telegram node (n8n-nodes-base.telegram)  
  - Role: Sends AI-generated responses back to customer chat  
  - Configuration:  
    - Text: AI Agent output text  
    - Chat ID: from Telegram Trigger message  
    - Append attribution off (clean message)  
  - Inputs: AI Agent output  
  - Outputs: Message sent to customer  
  - Failures: Telegram API errors, message formatting issues  

---

#### 2.5 Conversation Memory

**Overview:**  
Maintains per-customer conversation history to provide context for AI responses ensuring coherent dialogues.

**Nodes Involved:**  
- Simple Memory (described above)

---

#### 2.6 Order Logging

**Overview:**  
After payment approval, logs the full order details into a Google Sheet for record keeping and tracking.

**Nodes Involved:**  
- Google Sheets

**Node Details:**

- **Google Sheets**  
  - Type: Google Sheets Tool node (n8n-nodes-base.googleSheetsTool)  
  - Role: Appends new order rows to a Google Sheet with strict column formatting  
  - Configuration:  
    - Operation: Append  
    - Document ID: Placeholder `[YOUR_GOOGLE_SHEET_ID]` to be replaced by user  
    - Sheet Name: "gid=0" (default first sheet)  
    - Columns mapped strictly with expressions from AI Agent outputs or variables:  
      - Order id, Customer Name, Chat id, Phone number, Delivery Address, Order info, Total Price, Payment Status, Order Status, Timestamp (MM/DD/YYYY HH:mm format)  
    - Mapping Mode: Define Below (explicit column mapping)  
  - Input: Data from AI Agent after admin approval  
  - Output: Appends row, no further output  
  - Failures: Google API credential issues, rate limits, sheet ID or permissions errors  

---

#### 2.7 Telegram Responses & Status Updates

**Overview:**  
Handles sending various status messages to customers such as payment confirmation, rejection, or status queries.

**Nodes Involved:**  
- Telegram (response node)  
- Payment Declined (described above)  
- AI Agent also handles sending dynamic messages based on conversation content

---

#### 2.8 Setup & Documentation

**Overview:**  
Several sticky notes provide detailed setup instructions, customization tips, business placeholder explanations, and workflow summaries.

**Nodes Involved:**  
- Sticky Note  
- Sticky Note1  
- Sticky Note2  
- Sticky Note3  
- Sticky Note4

**Node Details:**

- Sticky Notes contain:  
  - Workflow title and purpose  
  - AI tools and memory explanation  
  - Payment verification flow description  
  - AI assistant brain overview  
  - Full quick setup guide including placeholder replacements, credential setup, menu customization, testing, and deployment  
  - Currency examples and Google Sheets structure  
  - Customer experience flow summary  
  - Security features and scalability notes  
  - Support notes and advanced customization ideas  

---

### 3. Summary Table

| Node Name                 | Node Type                             | Functional Role                       | Input Node(s)            | Output Node(s)           | Sticky Note                                           |
|---------------------------|-------------------------------------|------------------------------------|-------------------------|--------------------------|------------------------------------------------------|
| Telegram Trigger          | Telegram Trigger                    | Receives incoming Telegram messages | -                       | Payment Screenshot Check |                                                      |
| Payment Screenshot Check  | If                                 | Detects payment screenshots        | Telegram Trigger         | Forward Payment Screenshot, AI Agent |                                                      |
| Forward Payment Screenshot| Telegram                           | Forwards payment screenshot to admin| Payment Screenshot Check | Admin Approval Request   |                                                      |
| Admin Approval Request    | Telegram                           | Sends payment approval request to admin | Forward Payment Screenshot | Check Feedback           |                                                      |
| Check Feedback            | Langchain Text Classifier           | Classifies admin approval response | Admin Approval Request    | AI Agent (approved), Payment Declined (declined) |                                                      |
| Payment Declined          | Telegram                           | Notifies customer of payment rejection | Check Feedback (declined) | -                        |                                                      |
| AI Agent                 | Langchain Agent                    | AI conversational agent for order processing | Payment Screenshot Check (false), Check Feedback (approved), Simple Memory, Google Gemini Chat Model | Telegram (response), Google Sheets |                                                      |
| Simple Memory            | Langchain Memory Buffer Window      | Maintains conversation context     | Telegram Trigger          | AI Agent                 |                                                      |
| Google Gemini Chat Model | Langchain Language Model            | Provides AI language model          | AI Agent, Check Feedback  | AI Agent, Check Feedback  |                                                      |
| Google Sheets            | Google Sheets Tool                  | Logs approved orders to Google Sheets | AI Agent                 | -                        |                                                      |
| Telegram (response)      | Telegram                           | Sends AI response messages to customers | AI Agent                 | -                        |                                                      |
| Sticky Note              | Sticky Note                       | Workflow title                     | -                        | -                        | "# Food Delivery Chatbot Template | Ready to Customize" |
| Sticky Note1             | Sticky Note                       | AI Tools & Memory explanation      | -                        | -                        | "## AI Tools & Memory"                               |
| Sticky Note2             | Sticky Note                       | Payment Verification Flow details  | -                        | -                        | "## Payment Verification Flow"                       |
| Sticky Note3             | Sticky Note                       | AI Assistant Brain summary          | -                        | -                        | "## AI Assistant Brain"                              |
| Sticky Note4             | Sticky Note                       | Quick Setup Guide                   | -                        | -                        | "## 🚀 Quick Setup Guide\n\n### Prerequisites\n..." |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger**  
   - Node Type: Telegram Trigger  
   - Parameters: Listen for "message" updates (no filters)  
   - Credential: Add your Telegram Bot Token credentials  
   - Connect output to Payment Screenshot Check node  

2. **Add Payment Screenshot Check (If node)**  
   - Node Type: If  
   - Conditions:  
     - Check if `message.photo[0]` exists (string exists)  
     - Check that `message.text` does NOT exist (string does not exist)  
   - Connect True branch to Forward Payment Screenshot node  
   - Connect False branch to AI Agent node  

3. **Add Forward Payment Screenshot (Telegram node)**  
   - Node Type: Telegram  
   - Parameters:  
     - Operation: sendPhoto  
     - File: Set to incoming photo file_id (`{{$json.message.photo[0].file_id}}`)  
     - Caption: Use incoming message caption (`{{$json.message.caption}}`)  
     - Credential: Telegram Bot Token  
   - Connect output to Admin Approval Request  

4. **Add Admin Approval Request (Telegram node)**  
   - Node Type: Telegram  
   - Parameters:  
     - Text: "Payment received for order. Approve or decline?"  
     - Operation: sendAndWait (wait for admin text reply)  
     - Credential: Telegram Bot Token  
   - Connect output to Check Feedback  

5. **Add Check Feedback (Langchain Text Classifier node)**  
   - Node Type: Text Classifier  
   - Parameters:  
     - Input text: `{{$json.data.text}}` (admin response)  
     - Categories: "approved" and "declined" with descriptions  
   - Connect "approved" output to AI Agent node  
   - Connect "declined" output to Payment Declined node  

6. **Add Payment Declined (Telegram node)**  
   - Node Type: Telegram  
   - Parameters:  
     - Text: "❌ Sorry, we couldn't verify your payment. Please send a clearer screenshot or try again."  
     - Chat ID: From original Telegram message (`{{$json.message.chat.id}}`)  
     - Credential: Telegram Bot Token  
   - Ends flow for declined payments  

7. **Add AI Agent (Langchain Agent node)**  
   - Node Type: Langchain Agent  
   - Parameters:  
     - Text input: `{{$json.message.text}} {{$json.data.text}}`  
     - System Message: Customize with your business info, menu, order flow, payment instructions, and approval notes  
     - Prompt Type: Define  
     - Connect AI Memory input to Simple Memory node  
     - Connect AI Language Model input to Google Gemini Chat Model node  
   - Outputs text to Telegram response and order data to Google Sheets  

8. **Add Simple Memory (Langchain Memory Buffer Window node)**  
   - Node Type: Memory Buffer Window  
   - Parameters:  
     - Session Key: `{{$('Telegram Trigger').item.json.message.chat.id}}`  
     - Context Window Length: 10  
   - Connect output to AI Agent memory input  

9. **Add Google Gemini Chat Model (Langchain Language Model node)**  
   - Node Type: LM Chat Google Gemini  
   - Parameters:  
     - Model Name: "models/gemini-2.0-flash-exp"  
   - Connect outputs to AI Agent and Check Feedback nodes  

10. **Add Telegram Response Node**  
    - Node Type: Telegram  
    - Parameters:  
      - Text: `{{$json.output}}` (from AI Agent)  
      - Chat ID: `{{$('Telegram Trigger').item.json.message.chat.id}}`  
      - Append Attribution: false  
    - Connect input from AI Agent output  

11. **Add Google Sheets Node**  
    - Node Type: Google Sheets Tool  
    - Parameters:  
      - Operation: Append  
      - Document ID: Replace `[YOUR_GOOGLE_SHEET_ID]` with your sheet ID  
      - Sheet Name: "gid=0" or your target sheet  
      - Columns: Map order fields (Order id, Customer Name, Chat id, Phone number, Delivery Address, Order info, Total Price, Payment Status, Order Status, Timestamp) using AI Agent outputs or variables  
    - Connect input from AI Agent approved output  

12. **Add Sticky Notes for Documentation** (optional)  
    - Add Sticky Note nodes with content explaining setup, AI logic, payment flow, and customization guides for users  

13. **Credentials Setup:**  
    - Telegram Bot Token: For all Telegram nodes  
    - Google Sheets OAuth2: For Google Sheets node  
    - Google Gemini API Key: For Langchain Google Gemini model node  

14. **Final Connections:**  
    - Telegram Trigger → Payment Screenshot Check  
    - Payment Screenshot Check True → Forward Payment Screenshot → Admin Approval Request → Check Feedback  
    - Check Feedback Approved → AI Agent → Telegram Response & Google Sheets  
    - Check Feedback Declined → Payment Declined  
    - Payment Screenshot Check False → AI Agent → Telegram Response & Google Sheets  
    - Simple Memory and Google Gemini Chat Model connected as AI Agent inputs  

15. **Testing & Deployment:**  
    - Replace all placeholders in system prompts and Google Sheets ID  
    - Test conversation, order processing, payment screenshot flow, admin approval, and Google Sheets logging  
    - Activate workflow  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Context or Link                                                             |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------|
| This workflow is a template for a food delivery chatbot integrating AI with Telegram and Google Sheets. Customization requires replacing placeholders such as business name, assistant name, menu items, prices, currency, timezone, payment details, and Google Sheet ID.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Workflow Description                                                        |
| Google Sheets columns must strictly follow the specified order and timestamp format MM/DD/YYYY HH:mm (24-hour), matching the AI assistant's output to avoid logging errors.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Google Sheets Structure                                                    |
| Admin approval is handled via Telegram direct messages with sendAndWait operation, requiring the admin to reply with "approved" or "declined" (or similar text classified accordingly).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Admin Approval Handling                                                    |
| The AI assistant uses Google Gemini 2.0 model via Langchain integration for natural language processing and classification tasks.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | AI Language Model                                                          |
| Conversation context is maintained via Simple Memory node keyed by Telegram chat ID, with a sliding window of 10 messages to ensure coherent assistant replies.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Conversation Memory                                                        |
| Payment screenshot detection relies on presence of photo attachments without accompanying text, forwarding them to admin for manual review.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Payment Screenshot Verification                                            |
| Telegram messages sent to users disable attribution to keep responses clean and professional.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Telegram Message Formatting                                                |
| The workflow supports scalability with multiple concurrent users, unlimited order volumes, and is customizable for multi-location businesses, inventory management, promotions, and multi-language support with additional development.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Scalability & Advanced Customizations                                     |
| Setup requires valid credentials for Telegram Bot API, Google Sheets API with appropriate permissions, and Google Gemini API access with keys configured in n8n credentials.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Credential Setup & API Access                                              |
| For more details and customization tips, users should refer to the sticky notes embedded in the workflow, especially the Quick Setup Guide sticky note which includes a comprehensive step-by-step.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Embedded Sticky Notes in Workflow                                          |

---

**Disclaimer:** The provided text is generated from an automated n8n workflow export. It adheres strictly to content policies and does not contain illegal, offensive, or protected elements. All data handled are legal and public.