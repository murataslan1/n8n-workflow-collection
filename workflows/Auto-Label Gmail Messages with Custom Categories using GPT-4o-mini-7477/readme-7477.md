Auto-Label Gmail Messages with Custom Categories using GPT-4o-mini

https://n8nworkflows.xyz/workflows/auto-label-gmail-messages-with-custom-categories-using-gpt-4o-mini-7477


# Auto-Label Gmail Messages with Custom Categories using GPT-4o-mini

### 1. Workflow Overview

This workflow automates the classification and labeling of incoming Gmail messages using AI-driven text classification powered by the GPT-4o-mini model. Its primary purpose is to categorize new emails into custom-defined categories related to job opportunities, application statuses, enquiries, or others, and apply corresponding Gmail labels automatically. This helps users efficiently organize their inbox based on semantic content rather than manual sorting.

The workflow logically divides into these blocks:

- **1.1 Scheduled Trigger and Email Retrieval:** Periodically triggers once daily (at 23:00), fetching recent Gmail messages for processing.
- **1.2 AI-Powered Email Classification:** Uses a Langchain-integrated GPT-4o-mini model to classify email content into predefined categories.
- **1.3 Gmail Label Application:** Depending on classification, applies the appropriate Gmail label to the respective email messages.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger and Email Retrieval

- **Overview:**  
  This block initiates the workflow on a daily schedule and fetches up to 10 new Gmail messages received after a specific datetime for classification.

- **Nodes Involved:**  
  - Daily Email Check (Cron)  
  - Fetch New Emails (Gmail)

- **Node Details:**

  - **Daily Email Check**  
    - Type: Cron Trigger  
    - Configuration: Triggers once per day at 23:00 hours (11 PM) local time.  
    - Inputs: None (trigger node)  
    - Outputs: Connects to "Fetch New Emails" node  
    - Edge Cases: Cron misconfiguration or time zone mismatch could cause unexpected execution timing.  
    - Version: v1

  - **Fetch New Emails**  
    - Type: Gmail Node (Get All Messages)  
    - Configuration:  
      - Operation: Get all emails  
      - Limit: 10 emails per execution (to avoid overload)  
      - Filter: Only fetch emails received after "2025-08-10T17:28:41" (hardcoded datetime filter)  
      - Simple mode disabled (fetches full message data)  
    - Credentials: OAuth2 authenticated Gmail account  
    - Inputs: Triggered by "Daily Email Check"  
    - Outputs: Passes raw email data to "Email Classifier" node  
    - Edge Cases:  
      - OAuth token expiration or revocation  
      - API rate limits or quota exceeded  
      - The static filter date may cause missed emails if not updated dynamically  
    - Version: 2

---

#### 1.2 AI-Powered Email Classification

- **Overview:**  
  This block processes the fetched email content by sending it to a GPT-4o-mini powered text classifier node to categorize the emails into one of four custom categories.

- **Nodes Involved:**  
  - Email Classifier (Langchain Text Classifier)  
  - OpenAI Chat Model (GPT-4o-mini)

- **Node Details:**

  - **OpenAI Chat Model**  
    - Type: Langchain OpenAI Chat Model  
    - Configuration:  
      - Model: GPT-4o-mini (lightweight GPT-4 variant)  
      - No additional options configured  
    - Credentials: OpenAI API key  
    - Inputs: Receives classification prompts from "Email Classifier" node as AI language model backend  
    - Outputs: Returns classification results to "Email Classifier"  
    - Edge Cases:  
      - API key invalid or quota exceeded  
      - Timeout or network issues  
      - Model response format errors  
    - Version: 1.2

  - **Email Classifier**  
    - Type: Langchain Text Classifier Node  
    - Configuration:  
      - System prompt instructs to classify input text into exactly one of four categories (Job Opportunity, Application Status, Others, Enquiries)  
      - Categories provided with descriptions to guide classification  
      - Input text is dynamically extracted from the email JSON property `text`  
      - Output format restricted to JSON only (no explanations)  
    - Inputs: Email data from "Fetch New Emails" node  
    - Outputs: Routes classification results to four label application nodes based on predicted category  
    - Edge Cases:  
      - Missing or malformed email text input  
      - Classification ambiguities or misclassifications  
      - AI model output parsing errors  
    - Version: 1.1

---

#### 1.3 Gmail Label Application

- **Overview:**  
  This block applies the corresponding Gmail label to each email message according to the classification result provided by the AI classifier.

- **Nodes Involved:**  
  - Job Opportunity (Gmail Add Label)  
  - Application Status (Gmail Add Label)  
  - Others (Gmail Add Label)  
  - Enquiries (Gmail Add Label)

- **Node Details:**

  For each label node:

  - Type: Gmail Node (Add Labels)  
  - Configuration:  
    - Operation: Add labels to message  
    - Label ID corresponds to a custom Gmail label representing the category  
    - Message ID dynamically assigned from the original Gmail message ID (`{{$json["id"]}}` from the Gmail trigger)  
  - Inputs: Each connected from the "Email Classifier" node's respective output for the category  
  - Outputs: Terminal nodes (no further connections)  
  - Credentials: OAuth2 authenticated Gmail account  
  - Edge Cases:  
    - Invalid or missing Gmail label IDs  
    - Message ID not found or deleted  
    - API call failures or permission errors  
  - Version: 2.1

---

### 3. Summary Table

| Node Name          | Node Type                      | Functional Role                      | Input Node(s)        | Output Node(s)                           | Sticky Note                                      |
|--------------------|--------------------------------|------------------------------------|----------------------|-----------------------------------------|-------------------------------------------------|
| Daily Email Check   | Cron Trigger                   | Scheduled daily trigger             | None                 | Fetch New Emails                        |                                                 |
| Fetch New Emails    | Gmail                         | Fetches new emails after set date  | Daily Email Check     | Email Classifier                       |                                                 |
| Email Classifier    | Langchain Text Classifier     | Classifies email content into category | Fetch New Emails      | Job Opportunity, Application Status, Others, Enquiries |                                                 |
| OpenAI Chat Model   | Langchain OpenAI Chat Model   | Provides GPT-4o-mini model for classification | Email Classifier (as AI backend) | Email Classifier                        |                                                 |
| Job Opportunity    | Gmail                         | Adds "Job Opportunity" label        | Email Classifier      | None                                    |                                                 |
| Application Status | Gmail                         | Adds "Application Status" label     | Email Classifier      | None                                    |                                                 |
| Others             | Gmail                         | Adds "Others" label                 | Email Classifier      | None                                    |                                                 |
| Enquiries          | Gmail                         | Adds "Enquiries" label              | Email Classifier      | None                                    |                                                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Cron Trigger Node ("Daily Email Check"):**  
   - Type: Cron Trigger  
   - Set to trigger once daily at 23:00 local time.  
   - No credentials required.

2. **Create Gmail Node ("Fetch New Emails"):**  
   - Type: Gmail (OAuth2 credential required for Gmail account)  
   - Operation: Get all emails  
   - Limit: 10  
   - Filters: Set "Received After" to a fixed datetime (e.g., "2025-08-10T17:28:41"). This filter should be updated according to your need to avoid reprocessing old emails.  
   - Connect output of "Daily Email Check" to input of "Fetch New Emails".

3. **Create Langchain OpenAI Chat Model Node ("OpenAI Chat Model"):**  
   - Type: Langchain OpenAI Chat Model  
   - Set model to "gpt-4o-mini".  
   - Provide OpenAI API credentials with a valid API key.  
   - No additional options needed.

4. **Create Langchain Text Classifier Node ("Email Classifier"):**  
   - Type: Langchain Text Classifier  
   - Configure system prompt to instruct classification into four categories:  
     - Job Opportunity  
     - Application Status  
     - Others  
     - Enquiries  
   - Provide descriptions for each category to improve accuracy.  
   - Set input text expression to extract the email body text: `={{ $json.text }}`  
   - Connect the "Fetch New Emails" node output to this node input.  
   - Configure this node to use the "OpenAI Chat Model" node as its AI language model backend (ai_languageModel connection).  
   - Set output format to JSON only (no explanations).

5. **Create Gmail Label Nodes (4 nodes):**  
   For each category, create a Gmail node configured as follows:  
   - Operation: Add Labels  
   - Label IDs: Use the Gmail label ID corresponding to the category (e.g., "Label_3116546262966183424" for Job Opportunity)  
   - Message ID: Expression to dynamically reference the email ID: `={{ $('Gmail Trigger').item.json.id }}` or adapted to your context.  
   - Credentials: Same Gmail OAuth2 credentials as in step 2.  
   - Connect each output of "Email Classifier" node for the respective category to the corresponding Gmail label node.

6. **Connect Nodes:**  
   - Connect "Daily Email Check" → "Fetch New Emails"  
   - Connect "Fetch New Emails" → "Email Classifier"  
   - Connect "OpenAI Chat Model" to "Email Classifier" as AI backend  
   - Connect "Email Classifier" outputs to "Job Opportunity", "Application Status", "Others", and "Enquiries" nodes respectively.

7. **Set Credentials:**  
   - Create or use existing Gmail OAuth2 credentials for all Gmail nodes.  
   - Set up OpenAI API credentials for the Langchain OpenAI Chat Model node.

8. **Validation and Testing:**  
   - Test the workflow with sample emails to verify classification accuracy and label application.  
   - Adjust the datetime filter in "Fetch New Emails" to ensure emails are processed only once.  
   - Monitor for API quota or authentication issues.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                | Context or Link                                                                 |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------|
| The workflow uses Langchain integration nodes for advanced AI classification via OpenAI's GPT-4o-mini model, enabling natural language email categorization. | n8n Docs on Langchain nodes: https://docs.n8n.io/integrations/builtin/nodes/n8n-nodes-langchain/ |
| Gmail label IDs are specific to the user's Gmail account and must be retrieved via Gmail API or from Gmail UI to ensure correct labeling.                   | Gmail API Documentation: https://developers.google.com/gmail/api/guides/labels  |
| The static filter date in "Fetch New Emails" should be dynamically managed in production to avoid reprocessing or missing emails.                           | Consider storing the last processed email timestamp externally or in n8n variables. |
| For OAuth2 Gmail credentials, ensure the token has Gmail modification scope to add labels.                                                                  | Google OAuth2 scopes: https://developers.google.com/identity/protocols/oauth2/scopes#gmail |
| The workflow is inactive by default (active=false); enable it after all credentials and labels are verified.                                                |                                                                                 |

---

**Disclaimer:** The provided workflow text is sourced exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly respects current content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and public.