Automate Gmail Email Triage with Eisenhower Matrix and GPT-4.1-mini

https://n8nworkflows.xyz/workflows/automate-gmail-email-triage-with-eisenhower-matrix-and-gpt-4-1-mini-7753


# Automate Gmail Email Triage with Eisenhower Matrix and GPT-4.1-mini

### 1. Workflow Overview

This workflow automates Gmail email triage by classifying incoming emails according to the Eisenhower Matrix productivity framework using AI (GPT-4.1-mini). Its main goal is to prioritize emails into four categories based on urgency and importance, then automatically label and optionally archive them to streamline inbox management.

Logical blocks:

- **1.1 Initial Setup & Instructions**: Sticky notes outlining setup steps, labeling instructions, and usage guidelines.
- **1.2 Input Reception**: Gmail Trigger and Manual Trigger nodes to receive new emails either in real-time or batch mode.
- **1.3 Email Filtering**: Filter node to ensure only valid emails with content are processed.
- **1.4 AI Classification**: Langchain Text Classifier node using a specialized prompt based on Eisenhower Matrix principles.
- **1.5 Labeling Emails**: Gmail nodes applying appropriate Gmail labels based on classification outcome.
- **1.6 Archiving**: For emails classified as “Not Urgent + Not Important,” this block removes inbox and category labels to archive them.
- **1.7 Batch Processing**: Manual trigger based batch fetching and processing of unread emails for testing or backlog clearing.

---

### 2. Block-by-Block Analysis

---

#### 1.1 Initial Setup & Instructions

**Overview:**  
This block consists of multiple sticky notes providing comprehensive guidance for setting up the workflow, Gmail label creation, credential configuration, classification rationale, labeling system, archiving behavior, and batch processing tips.

**Nodes Involved:**  
- Sticky Note (cd71d5f3-b50b-426d-840d-da6eea33a217)  
- Sticky Note1 (fb3982b8-2085-43a0-a281-661b520eb3ca)  
- Sticky Note2 (d3e65c11-555b-435d-b4f3-2aa83c2cabc6)  
- Sticky Note3 (1e5e4e33-579f-4cd1-8aff-f1cf46db7269)  
- Sticky Note4 (428158f8-3354-49a2-a558-dc95f529e330)  
- Sticky Note5 (53971ed2-e8f7-45a5-a708-b07d663daf4f)  
- Sticky Note6 (9ccd31b9-f706-443e-8074-ab86ee691ebc)  

**Node Details:**

- **Type:** Sticky Note (non-executable visual aid)  
- **Purpose:** Documentation, setup instructions, explanations of classification logic, labeling, archiving, and batch testing.  
- **Key Content Highlights:**  
  - Stepwise Gmail label creation and ID retrieval instructions  
  - OAuth2 credential setup for Gmail and OpenAI  
  - Eisenhower Matrix email classification logic and category examples  
  - Gmail labeling system with color-coded categories and handling notes  
  - Auto-archive feature explanation and benefits  
  - Batch processing usage and cost considerations  
- **Input/Output:** None (visual notes only)  
- **Edge Cases:** None (informational only)  
- **Version Requirements:** None

---

#### 1.2 Input Reception

**Overview:**  
Receives new email events either automatically from Gmail or manually in batch for testing or backlog processing.

**Nodes Involved:**  
- Gmail Trigger (5a5a84e6-bf32-4ef0-bc87-160d5fb5a610)  
- Manual Test Trigger (0ba5af91-5501-4146-b43e-d9ac4c681a66)  
- Batch Process Emails (b57271f1-5747-4547-96f1-1a4cc13fddde)

**Node Details:**

- **Gmail Trigger**  
  - Type: Gmail Trigger  
  - Configuration: Polls Gmail inbox every minute for new unread emails.  
  - Credentials: Gmail OAuth2 (named IAM).  
  - Input: Incoming new emails in inbox.  
  - Output: Passes each email item downstream for classification.  
  - Edge Cases: Gmail API rate limits, OAuth token expiration, network failures.

- **Manual Test Trigger**  
  - Type: Manual Trigger  
  - Configuration: Triggered manually to start batch processing.  
  - Input: None, user-initiated.  
  - Output: Triggers batch email fetching node.

- **Batch Process Emails**  
  - Type: Gmail Node (Get All)  
  - Configuration: Fetches up to 5 unread emails from inbox for batch processing.  
  - Credentials: Gmail OAuth2 (IAM).  
  - Input: Triggered by Manual Test Trigger.  
  - Output: Passes array of email data downstream.  
  - Edge Cases: API limits, large inbox size, unread email availability.

---

#### 1.3 Email Filtering

**Overview:**  
Filters out emails that do not have valid textual content to avoid processing empty or invalid messages.

**Nodes Involved:**  
- Filter Valid Emails (6737dc62-1849-4fdf-8ad7-03002c81312b)

**Node Details:**

- **Filter Valid Emails**  
  - Type: Filter Node  
  - Configuration: Checks if the email JSON contains a non-empty `text` field.  
  - Expression: `{{$json.text}}` exists and is not empty.  
  - Input: Email items from batch fetch or Gmail trigger.  
  - Output: Only emails with valid content proceed to AI classification.  
  - Edge Cases: Emails with attachments but no text, HTML-only emails without plain text might be filtered out erroneously.

---

#### 1.4 AI Classification

**Overview:**  
Classifies the email content into one of four Eisenhower Matrix categories using an AI text classifier configured with a detailed prompt.

**Nodes Involved:**  
- AI Email Classifier (6da49556-8b27-49bc-ac4a-7bd31dd371c7)  
- OpenAI GPT-4 (cc962116-3299-428f-9a88-06cfff08501b)

**Node Details:**

- **AI Email Classifier**  
  - Type: Langchain Text Classifier Node  
  - Configuration:  
    - System prompt instructs the AI to classify emails by urgency and importance without explanation.  
    - Categories defined with descriptions matching Eisenhower Matrix quadrants.  
    - Input text is bound to `{{$json.text}}` from email content.  
  - Input: Valid email text.  
  - Output: Classification label in JSON indicating one of the four categories.  
  - Edge Cases: Ambiguous emails, very short or very long emails, API call failures, rate limits.

- **OpenAI GPT-4**  
  - Type: Langchain Chat OpenAI Node  
  - Configuration: Model set to `gpt-4.1-mini`.  
  - Credentials: OpenAI API key configured.  
  - Used as underlying language model for the classifier node.  
  - Input/output: Connected as AI backend for classification.  
  - Edge Cases: API quota exhaustion, connectivity issues, model changes affecting output format.

---

#### 1.5 Labeling Emails

**Overview:**  
Applies Gmail labels corresponding to the AI classification category to organize the emails accordingly.

**Nodes Involved:**  
- Label: Urgent + Important (683a55c5-8738-4503-b721-42c5ba6fcbb2)  
- Label: Not Urgent + Important (034c4031-95dc-4593-89f1-9cf0903591d7)  
- Label: Urgent + Not Important (17983317-e9ca-4d3f-bf7c-b8cf07955972)  
- Label: Not Urgent + Not Important (90f85ac6-a960-443c-9b26-9da29fde9a59)

**Node Details:**

- **Gmail Label Nodes** (all similar configuration)  
  - Type: Gmail Node (Add Labels)  
  - Configuration:  
    - Each node adds a specific Gmail label ID to the email message based on classification.  
    - Label IDs must be replaced by user with actual Gmail label IDs.  
    - Input: Email message ID from classified email.  
    - Output: Passes email further downstream; "Not Urgent + Not Important" branch connects to Archiving.  
  - Credentials: Gmail OAuth2 (IAM).  
  - Edge Cases: Incorrect label IDs cause operation failure, Gmail API limits, OAuth token issues, message ID not found.

---

#### 1.6 Archiving

**Overview:**  
Automatically archives emails classified as "Not Urgent + Not Important" by removing them from the inbox and default Gmail categories, effectively reducing inbox clutter while retaining labels.

**Nodes Involved:**  
- Archive Email (2ce3c21f-59ed-45bc-9606-72f74f792dc0)

**Node Details:**

- **Archive Email**  
  - Type: Gmail Node (Remove Labels)  
  - Configuration:  
    - Removes labels: INBOX, CATEGORY_PERSONAL, CATEGORY_FORUMS, CATEGORY_PROMOTIONS, CATEGORY_SOCIAL, CATEGORY_UPDATES.  
    - Keeps custom classification label intact.  
    - Input: Email message ID from "Not Urgent + Not Important" label node.  
  - Credentials: Gmail OAuth2 (IAM).  
  - Edge Cases: Failure if labels to remove do not exist on message, Gmail API errors, OAuth expiration.

---

#### 1.7 Batch Processing

**Overview:**  
Allows manual batch processing of emails for initial setup testing, backlog processing, or accuracy verification.

**Nodes Involved:**  
- Manual Test Trigger (already covered)  
- Batch Process Emails (already covered)  
- Filter Valid Emails (already covered)  
- AI Email Classifier (already covered)  
- Label nodes (already covered)  
- Archive Email (already covered)

**Node Details:**  
This block reuses existing nodes but triggered manually for batch instead of real-time processing, supporting controlled testing and cost management.

---

### 3. Summary Table

| Node Name                  | Node Type                          | Functional Role                           | Input Node(s)           | Output Node(s)                                | Sticky Note                                                                                      |
|----------------------------|----------------------------------|-----------------------------------------|-------------------------|-----------------------------------------------|-------------------------------------------------------------------------------------------------|
| Sticky Note                | stickyNote                       | Initial setup instructions               | None                    | None                                          | # ⚙️ INITIAL SETUP GUIDE… see full instructions in node content                                 |
| Gmail Trigger              | gmailTrigger                     | Real-time new email input                 | None                    | AI Email Classifier                           | # 📥 AUTOMATIC EMAIL DETECTION… see polling details                                             |
| AI Email Classifier        | textClassifier (langchain)       | Classifies email by Eisenhower Matrix    | Gmail Trigger, Filter Valid Emails | Label nodes (Urgent + Important, etc.)        | # 🤖 AI CLASSIFICATION ENGINE… see classification criteria and examples                         |
| OpenAI GPT-4               | lmChatOpenAi (langchain)          | Underlying AI language model for classifier | AI Email Classifier      | AI Email Classifier                           |                                                                                                 |
| Label: Urgent + Important  | gmail                           | Adds "Urgent + Important" Gmail label    | AI Email Classifier       | None                                          | # 🏷️ GMAIL LABELING SYSTEM… see labeling instructions and color coding                          |
| Label: Not Urgent + Important | gmail                        | Adds "Not Urgent + Important" Gmail label | AI Email Classifier       | None                                          | # 🏷️ GMAIL LABELING SYSTEM… see labeling instructions and color coding                          |
| Label: Urgent + Not Important | gmail                         | Adds "Urgent + Not Important" Gmail label | AI Email Classifier       | None                                          | # 🏷️ GMAIL LABELING SYSTEM… see labeling instructions and color coding                          |
| Label: Not Urgent + Not Important | gmail                    | Adds "Not Urgent + Not Important" Gmail label | AI Email Classifier       | Archive Email                                 | # 🏷️ GMAIL LABELING SYSTEM… see labeling instructions and color coding                          |
| Archive Email             | gmail                           | Archives emails by removing inbox/category labels | Label: Not Urgent + Not Important | None                                          | # 🗄️ AUTO-ARCHIVE FEATURE… only Not Urgent + Not Important emails get archived                  |
| Manual Test Trigger       | manualTrigger                   | Starts batch email processing manually   | None                    | Batch Process Emails                          | # 🧪 MANUAL BATCH PROCESSING… when and how to use for backlog and testing                       |
| Batch Process Emails      | gmail                           | Fetches batch of unread emails            | Manual Test Trigger       | Filter Valid Emails                           |                                                                                                 |
| Filter Valid Emails       | filter                         | Filters out emails lacking valid text    | Batch Process Emails      | AI Email Classifier                           |                                                                                                 |
| Sticky Note1              | stickyNote                     | Email trigger polling explanation         | None                    | None                                          | # 📥 AUTOMATIC EMAIL DETECTION… see polling details                                             |
| Sticky Note2              | stickyNote                     | Workflow purpose and Eisenhower Matrix intro | None                    | None                                          | # 📧 EISENHOWER MATRIX EMAIL AUTOMATION… see overview                                          |
| Sticky Note3              | stickyNote                     | Detailed classification examples          | None                    | None                                          | # 🤖 AI CLASSIFICATION ENGINE… see classification criteria and examples                         |
| Sticky Note4              | stickyNote                     | Gmail labeling system explanation          | None                    | None                                          | # 🏷️ GMAIL LABELING SYSTEM… labeling and color coding details                                  |
| Sticky Note5              | stickyNote                     | Auto-archive feature explanation           | None                    | None                                          | # 🗄️ AUTO-ARCHIVE FEATURE… archiving benefits and label removals                               |
| Sticky Note6              | stickyNote                     | Manual batch processing instructions       | None                    | None                                          | # 🧪 MANUAL BATCH PROCESSING… usage and cost notes                                           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Gmail Labels** in your Gmail account:  
   - "Urgent + Important"  
   - "Not Urgent + Important"  
   - "Urgent + Not Important"  
   - "Not Urgent + Not Important"  
   Keep note of their Gmail Label IDs (via Gmail API or temporary node).

2. **Create Credentials in n8n:**  
   - Gmail OAuth2 credential with full mailbox access.  
   - OpenAI API key credential (get key from platform.openai.com).

3. **Add Sticky Notes** (optional but recommended) with setup and instructions for clarity.

4. **Create a Gmail Trigger Node:**  
   - Set to poll every minute or desired interval.  
   - Connect Gmail OAuth2 credential.  
   - Configure to watch inbox for new unread emails.

5. **Create a Manual Trigger Node:**  
   - For batch testing.

6. **Create a Gmail Node (Get All):**  
   - Operation: Get All  
   - Limit: 5 (or desired batch size)  
   - Filters: Label ID INBOX and unread status.  
   - Connect Manual Trigger output to this node.

7. **Create a Filter Node ("Filter Valid Emails"):**  
   - Condition: Check if `{{$json.text}}` exists and is not empty.  
   - Connect outputs of Gmail Trigger and Batch Process Emails to this filter.

8. **Create a Langchain Text Classifier Node:**  
   - Use the OpenAI GPT-4.1-mini model.  
   - System prompt instructing classification by Eisenhower Matrix principles with categories:  
     - Urgent + Important  
     - Not Urgent + Important  
     - Urgent + Not Important  
     - Not Urgent + Not Important  
   - Input text set as email body text (`{{$json.text}}`).  
   - Connect Filter Valid Emails output to this node.

9. **Create an OpenAI GPT-4 node:**  
   - Set model to `gpt-4.1-mini`.  
   - Connect as language model backend for Text Classifier.

10. **Create Four Gmail Nodes to Add Labels:**  
    - For each category, create a Gmail node with operation “Add Labels.”  
    - Use the respective Gmail label ID.  
    - Message ID from classified email (`{{$json.id}}`).  
    - Connect AI Email Classifier output branches accordingly:  
      - Urgent + Important → Label: Urgent + Important  
      - Not Urgent + Important → Label: Not Urgent + Important  
      - Urgent + Not Important → Label: Urgent + Not Important  
      - Not Urgent + Not Important → Label: Not Urgent + Not Important  

11. **Create a Gmail Node for Archiving:**  
    - Operation: Remove Labels  
    - Labels to remove: INBOX, CATEGORY_PERSONAL, CATEGORY_FORUMS, CATEGORY_PROMOTIONS, CATEGORY_SOCIAL, CATEGORY_UPDATES  
    - Connect output of "Label: Not Urgent + Not Important" node to this node.  
    - This archives the email while keeping the custom label.

12. **Connect all nodes according to flow:**  
    - Gmail Trigger → Filter Valid Emails → AI Email Classifier → Label nodes → Archive (only for Not Urgent + Not Important)  
    - Manual Trigger → Batch Process Emails → Filter Valid Emails → AI Email Classifier → Label nodes → Archive (Not Urgent + Not Important)

13. **Test the workflow:**  
    - Run manual batch to verify classification and labeling.  
    - Adjust label IDs and credentials if needed.  
    - Once verified, activate the Gmail Trigger for real-time processing.

---

### 5. General Notes & Resources

| Note Content                                                                                                         | Context or Link                                                   |
|----------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| This workflow uses the Eisenhower Matrix framework to classify emails automatically into four priority quadrants.    | Workflow purpose description                                     |
| Gmail label IDs are unique per user and must be obtained via Gmail API or temp node before workflow use.             | Setup instructions in Sticky Note                                |
| OpenAI GPT-4.1-mini is used for cost-effective classification balancing performance and usage cost.                  | AI model choice                                                   |
| Archiving removes inbox and Gmail category labels but keeps custom labels for searchability.                         | Auto-archive feature explanation                                 |
| Batch processing is recommended for initial testing and backlog processing with limited email counts to control costs.| Manual batch instructions in Sticky Note                         |
| Gmail OAuth2 credentials must have appropriate scopes to read, label, and modify emails.                             | Credential setup instructions                                    |
| Polling frequency can be adjusted based on email volume to optimize API usage and costs.                             | Polling advice in Sticky Note1                                   |

---

**Disclaimer:**  
The provided content is derived exclusively from an automated workflow created with n8n, adhering strictly to content policies and legal standards. All processed data is lawful and public.