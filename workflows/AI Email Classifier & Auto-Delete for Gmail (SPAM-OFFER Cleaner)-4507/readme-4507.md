AI Email Classifier & Auto-Delete for Gmail (SPAM/OFFER Cleaner)

https://n8nworkflows.xyz/workflows/ai-email-classifier---auto-delete-for-gmail--spam-offer-cleaner--4507


# AI Email Classifier & Auto-Delete for Gmail (SPAM/OFFER Cleaner)

### 1. Workflow Overview

This workflow named **"Auto Spam/Marketing & Offer Delete"** is designed to automatically monitor a Gmail inbox and classify incoming emails into three categories: **SPAM**, **OFFER**, and **IMPORTAND** (important). The classification is performed using an AI language model (OpenAI GPT-4.1 nano variant) that analyzes email content to determine its value. Emails classified as **SPAM** or **OFFER** are automatically deleted from Gmail, keeping the inbox clean from unsolicited marketing and spam messages while preserving important emails.

The workflow is logically divided into the following functional blocks:

- **1.1 Input Reception:** Gmail Trigger node that polls for new emails hourly.
- **1.2 AI Classification:** An AI agent node using OpenAI GPT to classify the email content into SPAM, OFFER, or IMPORTAND.
- **1.3 Decision Making:** An If node that branches workflow execution based on classification results.
- **1.4 Email Deletion:** Gmail node that deletes emails classified as SPAM or OFFER.
- **1.5 Documentation:** A sticky note node providing detailed workflow documentation and warnings.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
This block continuously monitors the Gmail inbox for new incoming messages using an hourly polling trigger.

**Nodes Involved:**  
- Gmail Trigger

**Node Details:**  
- **Name:** Gmail Trigger  
- **Type:** n8n-nodes-base.gmailTrigger  
- **Technical Role:** Watches Gmail inbox for new emails to initiate the workflow.  
- **Configuration:**  
  - Polls every hour (`pollTimes` set to `everyHour`).  
  - No specific filters configured, so it triggers on any new email.  
- **Input:** None (trigger node).  
- **Output:** Emits new email data, including message ID and snippet, to downstream nodes.  
- **Credentials:** Uses OAuth2 credentials for Gmail (`Gmail TEST`).  
- **Version:** 1.2  
- **Edge Cases / Failure Types:**  
  - Authentication failure if OAuth token expires.  
  - Gmail API rate limits or connectivity issues.  
  - Polling delays if workflow is inactive or n8n instance is offline.  
- **Sub-workflow:** None

---

#### 1.2 AI Classification

**Overview:**  
This block performs semantic analysis and classification of the email content using an AI agent that relies on OpenAI GPT-4. It outputs a single classification label.

**Nodes Involved:**  
- Validator of Email  
- OpenAI Chat Model (as a language model used by the Validator)

**Node Details:**  

- **Validator of Email**  
  - **Type:** @n8n/n8n-nodes-langchain.agent  
  - **Technical Role:** AI agent node that sends the email snippet to an OpenAI language model for classification.  
  - **Configuration:**  
    - Input text: "Tu masz ostatnią wiadomość email: \n {{ $json.snippet }}" (Polish for "Here is the last email message")  
    - System Message prompt defines classification rules and examples clearly to the AI:  
      - Classifies emails into three labels: `SPAM`, `OFFER`, `IMPORTAND`.  
      - Emphasizes to respond with a single word only.  
      - Provides detailed examples and instructions to avoid false positives.  
    - Prompt type: define (custom prompt defining the AI behavior).  
  - **Input:** Receives email data from Gmail Trigger.  
  - **Output:** Outputs a JSON with a property `output` containing one of the three classification labels.  
  - **Credentials:** Uses OpenAI API credentials (`OpenAi TEST API`).  
  - **Version:** 1.9  
  - **Edge Cases / Failure Types:**  
    - AI service downtime or API quota exhaustion.  
    - Ambiguous classification if email content is unclear.  
    - Expression or template errors if `$json.snippet` is missing.  
    - Latency issues due to API call delays.  
  - **Sub-workflow:** None  

- **OpenAI Chat Model**  
  - **Type:** @n8n/n8n-nodes-langchain.lmChatOpenAi  
  - **Technical Role:** Language model node providing GPT-4.1-nano model to the AI agent.  
  - **Configuration:**  
    - Model: `gpt-4.1-nano` (a lightweight GPT-4 variant).  
    - No additional options set.  
  - **Input:** Receives prompt from Validator of Email node.  
  - **Output:** Returns classification response to Validator node.  
  - **Credentials:** OpenAI API credentials (`OpenAi TEST API`).  
  - **Version:** 1.2  
  - **Edge Cases / Failure Types:**  
    - API key invalid or rate limited.  
    - Model response errors or unexpected output format.  
  - **Sub-workflow:** None  

---

#### 1.3 Decision Making

**Overview:**  
This block evaluates the AI classification result and routes the workflow accordingly, deleting emails classified as SPAM or OFFER.

**Nodes Involved:**  
- If

**Node Details:**  
- **Name:** If  
- **Type:** n8n-nodes-base.if  
- **Technical Role:** Conditional branching node that checks if the classification output is `SPAM` or `OFFER`.  
- **Configuration:**  
  - Conditions: Logical OR on the field `{{$json.output}}` equals `SPAM` or `OFFER`.  
  - Case sensitive and strict type validation enabled.  
- **Input:** Receives classification result from Validator of Email.  
- **Output:**  
  - True branch: proceeds to deletion if classified as SPAM or OFFER.  
  - False branch: no further action; emails classified as IMPORTAND are left untouched.  
- **Version:** 2.2  
- **Edge Cases / Failure Types:**  
  - Unexpected or missing `output` property causing false negatives.  
  - Case sensitivity causing misclassification if AI outputs in lowercase or different casing.  
- **Sub-workflow:** None  

---

#### 1.4 Email Deletion

**Overview:**  
This block permanently deletes emails classified as SPAM or OFFER from the Gmail inbox.

**Nodes Involved:**  
- Delate Email (likely a typo, meant to be "Delete Email")

**Node Details:**  
- **Name:** Delate Email  
- **Type:** n8n-nodes-base.gmail  
- **Technical Role:** Performs the delete operation on the email identified by message ID.  
- **Configuration:**  
  - Operation: delete  
  - Message ID: dynamically set from Gmail Trigger node’s email ID (`{{$node["Gmail Trigger"].json.id}}`).  
- **Input:** Receives true branch from If node (emails classified as SPAM or OFFER).  
- **Output:** None (terminal node for deleted emails).  
- **Credentials:** Gmail OAuth2 credentials (`Gmail TEST`).  
- **Version:** 2.1  
- **Edge Cases / Failure Types:**  
  - Deletion failure due to invalid message ID or Gmail API errors.  
  - Race conditions if email is deleted manually before workflow runs.  
  - Permanent deletion without recovery (no Trash step).  
- **Sub-workflow:** None  

---

#### 1.5 Documentation and Warnings

**Overview:**  
This node provides detailed documentation and warnings about the workflow usage, components, and expected behavior.

**Nodes Involved:**  
- Sticky Note

**Node Details:**  
- **Name:** Sticky Note  
- **Type:** n8n-nodes-base.stickyNote  
- **Technical Role:** Contains textual documentation embedded in the workflow for user reference.  
- **Configuration:**  
  - Large note with a detailed description of workflow purpose, components, warnings, use cases, and operational notes.  
  - Content in English, explaining the classification logic, risks of permanent deletion, and recommendations.  
- **Input/Output:** None (informational only).  
- **Version:** 1  
- **Edge Cases:** None  
- **Sub-workflow:** None

---

### 3. Summary Table

| Node Name          | Node Type                         | Functional Role                             | Input Node(s)   | Output Node(s)  | Sticky Note                                                                                                    |
|--------------------|----------------------------------|---------------------------------------------|-----------------|-----------------|---------------------------------------------------------------------------------------------------------------|
| Gmail Trigger      | n8n-nodes-base.gmailTrigger       | Input Reception: polls Gmail for new emails| None            | Validator of Email | See note: monitors inbox hourly, triggers workflow on new emails                                              |
| Validator of Email | @n8n/n8n-nodes-langchain.agent   | AI Classification of email content          | Gmail Trigger   | If              | Uses OpenAI GPT-4.1-nano to classify emails as SPAM/OFFER/IMPORTAND                                           |
| OpenAI Chat Model  | @n8n/n8n-nodes-langchain.lmChatOpenAi | Provides GPT model for classification        | Validator of Email (AI model input) | Validator of Email (AI model output) | Utilizes GPT-4.1-nano model for semantic analysis                                                            |
| If                 | n8n-nodes-base.if                 | Decision making based on classification     | Validator of Email | Delate Email     | Filters for SPAM and OFFER classifications to trigger deletion                                               |
| Delate Email       | n8n-nodes-base.gmail             | Deletes emails classified as SPAM/OFFER     | If (true branch)| None            | Permanently deletes emails without confirmation                                                               |
| Sticky Note        | n8n-nodes-base.stickyNote        | Documentation and warnings                   | None            | None            | Contains detailed workflow explanation, warnings about permanent deletion and AI classification limitations    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Gmail Trigger node:**  
   - Node type: Gmail Trigger  
   - Credentials: Connect using Gmail OAuth2 credentials.  
   - Parameters: Set polling to "every hour" with no filters.  
   - Position: Start of workflow.

2. **Create OpenAI Chat Model node:**  
   - Node type: @n8n/n8n-nodes-langchain.lmChatOpenAi  
   - Credentials: Connect OpenAI API credentials.  
   - Parameters: Select model `gpt-4.1-nano`.  
   - This node will serve as the language model for the AI agent.

3. **Create Validator of Email node:**  
   - Node type: @n8n/n8n-nodes-langchain.agent  
   - Credentials: Use the same OpenAI API credentials.  
   - Parameters:  
     - Text input: `=Tu masz ostatnią wiadomość email: \n {{ $json.snippet }}`  
     - System message: Paste the detailed prompt defining the classification logic (as provided).  
     - Prompt type: define  
     - Assign the OpenAI Chat Model node as the language model (link the `ai_languageModel` input to the OpenAI Chat Model node).  
   - Connect input from Gmail Trigger node.

4. **Create If node:**  
   - Node type: If  
   - Parameters:  
     - Condition: check if `{{$json.output}}` equals `SPAM` or `OFFER` (logical OR).  
     - Case sensitive and strict type validation enabled.  
   - Connect input from Validator of Email node.

5. **Create Gmail Delete node:**  
   - Node type: Gmail  
   - Credentials: Use Gmail OAuth2 credentials.  
   - Parameters:  
     - Operation: delete  
     - Message ID: set expression to `{{$node["Gmail Trigger"].json.id}}`.  
   - Connect input from If node’s true branch.

6. **Create Sticky Note node (optional):**  
   - Node type: Sticky Note  
   - Parameters: Paste the detailed workflow description and warnings.  
   - Position it off to the side for documentation purposes.

7. **Connect nodes:**  
   - Gmail Trigger → Validator of Email  
   - Validator of Email → If  
   - If (true branch) → Gmail Delete  
   - OpenAI Chat Model → Validator of Email (ai_languageModel input)  

8. **Set workflow to active (optional):**  
   - Test on a non-critical Gmail account first.  
   - Activate workflow once tested and verified.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                         | Context or Link                                  |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------|
| Workflow automatically deletes emails classified as SPAM or OFFER without manual confirmation. Use with caution to avoid losing important emails.                                                                                                  | Warning in Sticky Note                           |
| AI classification prompt is in English but email snippet input text is partly in Polish ("Tu masz ostatnią wiadomość email"). Adapt language if necessary.                                                                                           | Prompt configuration in Validator of Email node |
| Recommended use case: freelancers, business owners, anyone needing to reduce marketing and spam noise while keeping important messages intact.                                                                                                      | Sticky Note                                      |
| Test thoroughly on a non-critical Gmail account before deploying to production to avoid accidental deletion.                                                                                                                                          | Sticky Note                                      |
| Workflow uses GPT-4.1-nano, a lightweight variant of GPT-4. API quota and latency may affect performance.                                                                                                                                              | OpenAI Chat Model node description               |
| No Trash or Undo step included; deletion is permanent within Gmail.                                                                                                                                                                                   | Gmail Delete node description                     |
| For advanced users: consider adding logging or backup before deletion to mitigate risks of false positives.                                                                                                                                           | General best practice                             |