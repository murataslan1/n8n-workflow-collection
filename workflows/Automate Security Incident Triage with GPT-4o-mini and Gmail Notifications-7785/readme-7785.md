Automate Security Incident Triage with GPT-4o-mini and Gmail Notifications

https://n8nworkflows.xyz/workflows/automate-security-incident-triage-with-gpt-4o-mini-and-gmail-notifications-7785


# Automate Security Incident Triage with GPT-4o-mini and Gmail Notifications

### 1. Workflow Overview

This workflow automates the triage of security incidents by integrating GPT-4o-mini for classification and remediation planning, then sending summarized notifications via Gmail. It targets Security Operations Center (SOC) teams who need rapid, structured analysis and prioritization of security findings delivered through automated email alerts.

The workflow consists of the following logical blocks:

- **1.1 Entry Point & Input Reception:** Receives incoming security incident data via a webhook.
- **1.2 Data Cleaning & Preparation:** Extracts and normalizes relevant fields from the raw incident payload.
- **1.3 Incident Classification:** Uses GPT-4o-mini to classify the incident type, severity, urgency, and provide a concise summary.
- **1.4 Remediation Planning:** Uses GPT-4o-mini to generate a 3-step remediation plan with ownership guidance and success criteria.
- **1.5 Notification Dispatch:** Sends a formatted email summarizing the incident and recommended actions to a predefined recipient.

---

### 2. Block-by-Block Analysis

#### 2.1 Entry Point & Input Reception

- **Overview:**  
  This block exposes a POST HTTP endpoint to receive incoming security findings in JSON format. The webhook triggers the workflow on every new incident report.

- **Nodes Involved:**  
  - Webhook

- **Node Details:**  
  - **Webhook**  
    - Type: HTTP Webhook Trigger  
    - Configuration:  
      - HTTP Method: POST  
      - Path: `/mini-triage`  
      - No authentication or additional options configured  
    - Expressions/Variables: None  
    - Input: External HTTP POST request containing security incident payload  
    - Output: JSON payload passed to the next node  
    - Edge Cases:  
      - Missing or malformed JSON payloads may cause downstream failures  
      - Unauthorized access if webhook URL is leaked (no auth configured)  
    - Version: 2.1  

- **Sticky Note:**  
  - Content:  
    ```
    📥 ENTRY 

    Send a POST to /mini-triage to get started!

    Example:

    curl -X POST "$YOUR_WEBHOOK_URL" \
      -H "Content-Type: application/json" \
      -d '{
        "detail": {
          "findings": [{
            "Title": "Multiple failed logins",
            "Description": "probable credential stuffing",
            "AwsAccountId": "111111111111",
            "Resources": [{ "Id": "user:alice@example.com", "Type": "AwsIamUser" }]
          }]
        }
      }'
    ```

#### 2.2 Data Cleaning & Preparation

- **Overview:**  
  Extracts and normalizes key incident information from the raw webhook payload into a simplified JSON object for the AI classification step.

- **Nodes Involved:**  
  - Clean_Finding

- **Node Details:**  
  - **Clean_Finding**  
    - Type: Set Node  
    - Configuration: Assigns the following fields from the webhook JSON:  
      - `Title` from `body.detail.findings[0].Title`  
      - `Description` from `body.detail.findings[0].Description`  
      - `account_id` from `body.detail.findings[0].AwsAccountId`  
      - `resource_id` from `body.detail.findings[0].Resources[0].Id`  
      - `resource_type` from `body.detail.findings[0].Resources[0].Type`  
      - `updated_at` from `detail.findings[0].UpdatedAt` or current timestamp if missing  
    - Expressions: Uses JavaScript expressions to safely access nested fields and fallback defaults  
    - Input: Raw webhook JSON  
    - Output: Cleaned JSON object with flat keys for AI input  
    - Edge Cases:  
      - Missing nested properties handled with optional chaining and defaults  
      - Assumes at least one finding and one resource present; no loop for multiple findings/resources  
    - Version: 3.4  

#### 2.3 Incident Classification

- **Overview:**  
  Uses GPT-4o-mini via Langchain node to classify the incident into predefined categories, severity levels, and urgency, returning structured JSON output with a short descriptive title and reasoning.

- **Nodes Involved:**  
  - Classify

- **Node Details:**  
  - **Classify**  
    - Type: Langchain OpenAI Node  
    - Configuration:  
      - Model: `gpt-4o-mini`  
      - Temperature: 0.2 (low randomness for deterministic output)  
      - System prompt instructs the AI to act as a SOC Classifier and output strict valid JSON with keys:  
        `incident_type`, `severity`, `urgency`, `short_title`, `why`  
      - Input prompt uses the cleaned finding data fields: title, description, resource_type, with explicit rules and examples for classification  
    - Credentials: OpenAI API (OAuth or API Key stored in n8n Credentials)  
    - Input: JSON from Clean_Finding node  
    - Output: JSON object with classification fields wrapped in message content  
    - Edge Cases:  
      - AI might fail to parse or return invalid JSON - handled by node’s jsonOutput flag  
      - Unclear incidents default to `other` type with low priority (P3)  
    - Version: 1.8  

#### 2.4 Remediation Planning

- **Overview:**  
  Generates a concise remediation plan with three atomic next steps, ownership hint, and success criteria, based on the classification output and original incident data.

- **Nodes Involved:**  
  - Plan

- **Node Details:**  
  - **Plan**  
    - Type: Langchain OpenAI Node  
    - Configuration:  
      - Model: `gpt-4o-mini`  
      - Temperature: 0.2  
      - System prompt instructs the AI to act as a Remediation Planner returning valid JSON with keys:  
        `next_actions` (array of 3 steps), `owner_hint`, `success_criteria`  
      - Input prompt includes the JSON output of the Classify node and the original webhook JSON for context  
    - Credentials: OpenAI API (same as Classify)  
    - Input: Output from Classify and Webhook nodes via expression  
    - Output: JSON with remediation planning content  
    - Edge Cases:  
      - AI might hallucinate or provide vague steps; prompt restricts to factual atomic steps only  
      - Parsing failure if AI output is malformed JSON  
    - Version: 1.8  

#### 2.5 Notification Dispatch

- **Overview:**  
  Sends an email notification containing the incident summary and remediation plan to a predefined recipient using Gmail OAuth2.

- **Nodes Involved:**  
  - Send a message

- **Node Details:**  
  - **Send a message**  
    - Type: Gmail Node (Send Email)  
    - Configuration:  
      - Recipient: `test5@gmail.com` (replaceable with actual SOC email)  
      - Subject: Combines `<short_title>` from Classify and `<resource_id>` and `<account_id>` from Clean_Finding for context  
      - Message Body: HTML formatted, includes:  
        - Short title and severity  
        - Incident type and resource info  
        - Account ID  
        - Urgency level  
        - Reasoning why  
        - Ordered list of next actions from Plan node  
        - Owner hint and success criteria  
      - Uses expressions to interpolate data from Classify, Clean_Finding, and Plan nodes  
    - Credentials: Gmail OAuth2 stored securely in n8n Credentials  
    - Input: Output of Plan node (which follows Classify and Clean_Finding)  
    - Output: Sends email, outputs success/failure status  
    - Edge Cases:  
      - Email sending failures due to auth issues, quota limits, or network problems  
      - Missing data fields could cause empty email sections  
    - Version: 2.1  

- **Sticky Note:**  
  - Content:  
    ```
    ✉️ EMAIL & SECURITY
  
    Subject = <short_title> - <resource_id> in <account_id>  
    Replace with your email/SMTP  
    Keep creds in n8n Credentials, not nodes
    ```

---

### 3. Summary Table

| Node Name     | Node Type                 | Functional Role                 | Input Node(s)       | Output Node(s)    | Sticky Note                                                  |
|---------------|---------------------------|--------------------------------|---------------------|-------------------|--------------------------------------------------------------|
| Webhook       | HTTP Webhook Trigger      | Entry point for incident input | -                   | Clean_Finding     | 📥 ENTRY: Send POST to /mini-triage with example payload     |
| Clean_Finding | Set Node                  | Extracts & normalizes input data| Webhook             | Classify          |                                                              |
| Classify      | Langchain OpenAI Node     | Classifies incident severity/type | Clean_Finding       | Plan              |                                                              |
| Plan          | Langchain OpenAI Node     | Generates remediation plan      | Classify, Webhook   | Send a message    |                                                              |
| Send a message| Gmail Node                | Sends notification email        | Plan                | -                 | ✉️ EMAIL & SECURITY: Subject format & cred storage advice    |
| Sticky Note   | Sticky Note               | Documentation note              | -                   | -                 | See above in respective nodes                                |
| Sticky Note1  | Sticky Note               | Documentation note              | -                   | -                 | See above in Send a message node                             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node:**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: `mini-triage`  
   - No authentication  
   - Purpose: Receive security incident JSON payload  

2. **Create Set Node "Clean_Finding":**  
   - Type: Set  
   - Assign fields:  
     - `Title` = `{{$json["body"]["detail"]["findings"][0]["Title"]}}`  
     - `Description` = `{{$json["body"]["detail"]["findings"][0]["Description"]}}`  
     - `account_id` = `{{$json["body"]["detail"]["findings"][0]["AwsAccountId"]}}`  
     - `resource_id` = `{{$json["body"]["detail"]["findings"][0]["Resources"][0]["Id"]}}`  
     - `resource_type` = `{{$json["body"]["detail"]["findings"][0]["Resources"][0]["Type"]}}`  
     - `updated_at` = `{{$json["detail"]?.["findings"]?.[0]?.["UpdatedAt"] || new Date().toISOString()}}`  
   - Connect Webhook main output to Clean_Finding input  

3. **Create Langchain OpenAI Node "Classify":**  
   - Model: `gpt-4o-mini`  
   - Temperature: 0.2  
   - Prompt: Configure system message instructing SOC classification with strict JSON output including keys:  
     `incident_type`, `severity`, `urgency`, `short_title`, `why`  
   - Input: Use data from Clean_Finding node  
   - Credential: OpenAI API credentials configured in n8n Credentials  
   - Connect Clean_Finding output to Classify input  

4. **Create Langchain OpenAI Node "Plan":**  
   - Model: `gpt-4o-mini`  
   - Temperature: 0.2  
   - Prompt: System message instructing Remediation Planner to provide JSON with keys:  
     `next_actions` (3 steps), `owner_hint`, `success_criteria`  
   - Input: Combine Classify node JSON output and original Webhook JSON for context  
   - Credential: Use same OpenAI API credentials  
   - Connect Classify output to Plan input  

5. **Create Gmail Node "Send a message":**  
   - Operation: Send Email  
   - Recipient: Replace with actual SOC team email (e.g., `test5@gmail.com`)  
   - Subject: Use expression:  
     `={{ $('Classify').item.json.message.content.short_title }}- {{ $('Clean_Finding').item.json.resource_id }} in {{ $('Clean_Finding').item.json.account_id }}`  
   - Message: HTML body including incident summary fields (short_title, severity, type, resource info, urgency, why) and remediation plan steps, owner hint, success criteria. Use expressions referencing Classify, Clean_Finding, and Plan nodes.  
   - Credential: Configure Gmail OAuth2 credentials in n8n Credentials (do not embed in node)  
   - Connect Plan output to Send a message input  

6. **Workflow Connections:**  
   - Webhook → Clean_Finding  
   - Clean_Finding → Classify  
   - Classify → Plan  
   - Plan → Send a message  

7. **Optional:** Add sticky notes near Webhook and Send a message nodes for user instructions and reminders about credentials and email formatting.

---

### 5. General Notes & Resources

| Note Content                                                                                                    | Context or Link                  |
|----------------------------------------------------------------------------------------------------------------|---------------------------------|
| The workflow requires valid OpenAI API credentials configured in n8n Credentials with access to `gpt-4o-mini`. | OpenAI API setup                |
| Gmail node uses OAuth2 credentials; ensure proper consent and token refresh configuration.                      | Gmail OAuth2 setup              |
| Incoming payload example provided for testing the webhook endpoint via curl.                                    | See sticky note on Webhook node |
| Email subject format includes incident short title, resource id, and account id for easy identification.        | Sticky note on Send a message node |
| Keep sensitive credentials out of node parameters; store securely in n8n Credentials.                           | Best security practice          |

---

**Disclaimer:** The provided text results exclusively from an automated workflow created with n8n, adhering strictly to content policies. No illegal, offensive, or protected elements are included. All handled data are legal and public.