Automate Stale Deal Follow-Ups in Salesforce with GPT-5.1, Email, Slack & Tasks

https://n8nworkflows.xyz/workflows/automate-stale-deal-follow-ups-in-salesforce-with-gpt-5-1--email--slack---tasks-11157


# Automate Stale Deal Follow-Ups in Salesforce with GPT-5.1, Email, Slack & Tasks

### 1. Workflow Overview

This workflow automates follow-ups on stale Salesforce Opportunities — specifically those whose sales stage has not changed for a configured number of days. It runs daily at 8:00 AM to:

- Identify “stale” Opportunities based on a custom field tracking days since last stage change.
- Enrich each Opportunity with relevant Salesforce data: notes, primary contact, and owner information.
- Use an AI model (GPT-5.1) to generate personalized follow-up communications:
  - Email to the client
  - SMS template for the client
  - Slack message to the internal sales team
  - Salesforce Task creation for the Opportunity owner to drive next actions

The workflow is logically divided into these blocks:

- **1.1 Scheduling & Parameter Setup:** Triggers the flow daily and sets the threshold for stale days.
- **1.2 Salesforce Data Retrieval:** Queries Salesforce for stale Opportunities, then fetches full Opportunity records.
- **1.3 AI Processing & Enrichment:** Sends Opportunity data to GPT-5.1 with embedded SOQL query tool to retrieve notes, contacts, and owner info, then parses AI-generated JSON outputs.
- **1.4 Notifications & Task Creation:** Sends the generated email via SMTP, posts the Slack message, and creates a Salesforce Task for follow-up.

Sticky notes within the workflow provide setup instructions, architectural context, and usage guidance.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduling & Parameter Setup

- **Overview:**  
  This block triggers the workflow every day at 8:00 AM and sets the threshold for how many days an Opportunity stage must remain unchanged to be considered stale.

- **Nodes Involved:**  
  - Schedule Trigger  
  - Edit Fields  
  - Sticky Note – Schedule & Threshold

- **Node Details:**

  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Role: Initiates the workflow daily at 8:00 AM.  
    - Configuration: Interval set to trigger at hour 8 (8 AM).  
    - Input: None  
    - Output: Triggers the next node.  
    - Potential Failures: Scheduler misconfiguration, time zone issues.  
    - Version: 1.2

  - **Edit Fields**  
    - Type: Set node  
    - Role: Defines the parameter `stale_days` with a numeric value (14 by default), which determines the stale threshold.  
    - Configuration: Assigns `stale_days` = 14 (number).  
    - Input: Trigger from Schedule Trigger  
    - Output: Passes `stale_days` to the next node.  
    - Edge Cases: If this value is set incorrectly (e.g., zero or negative), the query results may be invalid.  
    - Version: 3.4

  - **Sticky Note – Schedule & Threshold**  
    - Provides guidance on adjusting the schedule and stale_days parameter to match business needs.

---

#### 2.2 Salesforce Data Retrieval

- **Overview:**  
  This block queries Salesforce to find Opportunities whose stage has not changed for the configured number of days and excludes closed deals. It then fetches full details for each matched Opportunity.

- **Nodes Involved:**  
  - Perform a query (Salesforce)  
  - Get an opportunity (Salesforce)  
  - Sticky Note – Opportunity Fetch

- **Node Details:**

  - **Perform a query**  
    - Type: Salesforce node (search resource)  
    - Role: Queries Opportunity records filtered by `Stage_Unchanged_Days__c` equal to `stale_days` and excluding closed stages.  
    - Configuration: SOQL query:  
      `Select id from opportunity where Stage_Unchanged_Days__c =  {{ $json.stale_days }} And StageName Not In ('Closed Won', 'Closed Lost')`  
    - Input: Receives `stale_days` from Edit Fields node.  
    - Output: List of Opportunity IDs matching the criteria.  
    - Credentials: Salesforce OAuth2  
    - Potential Failures: Salesforce API auth errors, SOQL syntax issues, rate limits.  
    - Version: 1

  - **Get an opportunity**  
    - Type: Salesforce node (get operation)  
    - Role: Retrieves full Opportunity records by ID from previous query.  
    - Configuration: Uses `opportunityId` = `{{ $json.Id }}` (from Perform a query output).  
    - Input: Opportunity IDs  
    - Output: Full Opportunity JSON objects for AI processing.  
    - Credentials: Salesforce OAuth2  
    - Edge Cases: Missing or deleted Opportunities, API limits.  
    - Version: 1

  - **Sticky Note – Opportunity Fetch**  
    - Explains the purpose of this block: identifying stale Opportunities and gathering rich context.

---

#### 2.3 AI Processing & Enrichment

- **Overview:**  
  This critical block sends the Opportunity data to GPT-5.1, which uses embedded SOQL query tool calls to enrich messages with notes, contact, and owner data from Salesforce. The AI composes follow-up messages and a Task JSON object. The output is parsed from JSON into structured fields.

- **Nodes Involved:**  
  - Message a model (OpenAI GPT-5.1)  
  - query_soql (HTTP Request Tool)  
  - Parse JSON (Code node)  
  - Sticky Note – AI Engine1

- **Node Details:**

  - **Message a model**  
    - Type: Langchain OpenAI node  
    - Role: Sends Opportunity JSON and instructions to GPT-5.1 to generate follow-up messages and a Task JSON.  
    - Configuration:  
      - ModelId: GPT-5.1  
      - System prompt: Detailed instructions describing the Opportunity data structure, embedded SOQL query tool usage, communication logic for email, SMS, Slack, and Task generation, including fallback/edge handling.  
      - Variables: Passes full Opportunity JSON from prior node.  
    - Input: Full Opportunity JSON  
    - Output: Raw AI-generated JSON text (string).  
    - Credentials: OpenAI API  
    - Edge Cases: AI response formatting errors, timeouts, API quota exhaustion.  
    - Version: 2

  - **query_soql**  
    - Type: HTTP Request Tool node  
    - Role: Supports dynamic SOQL queries initiated by the AI model instructions. It queries Salesforce Notes, Contacts, and Owners as requested by the AI.  
    - Configuration: REST API call to Salesforce `/query/` endpoint with dynamic SOQL from AI.  
    - Input: SOQL query string injected dynamically from AI prompt.  
    - Output: JSON records for AI to use internally.  
    - Credentials: Salesforce OAuth2  
    - Edge Cases: Invalid queries, no results, auth failures.  
    - Version: 4.3

  - **Parse JSON**  
    - Type: Code node (JavaScript)  
    - Role: Parses the AI’s raw JSON string output into structured JSON for downstream usage.  
    - Configuration: Parses `output[0].content[0].text` from AI response.  
    - Input: AI raw string output  
    - Output: Parsed JSON containing keys: `email`, `sms`, `slack`, `task`  
    - Edge Cases: Malformed JSON, unexpected AI outputs.  
    - Version: 2

  - **Sticky Note – AI Engine1**  
    - Describes this block as the central AI processing engine, integrating live CRM data with AI-generated follow-up content.

---

#### 2.4 Notifications & Task Creation

- **Overview:**  
  This block sends the generated email to the client, posts the Slack message to the internal sales channel, and creates a Salesforce Task for the Opportunity Owner to track the follow-up action.

- **Nodes Involved:**  
  - Send Email SMTP Customer  
  - Send Message To Internal Team (Slack)  
  - Create Task (Salesforce HTTP Request)  
  - Sticky Note – Actions Summary

- **Node Details:**

  - **Send Email SMTP Customer**  
    - Type: Email Send node  
    - Role: Sends personalized follow-up email to the client using SMTP.  
    - Configuration:  
      - To: `{{ $json.email.to }}` (from parsed AI output)  
      - Subject: `{{ $json.email.subject }}`  
      - Body: `{{ $json.email.body }}` (plain text)  
      - From: fixed sender email (e.g., `from@email.com`)  
    - Input: Parsed JSON from Parse JSON node  
    - Credentials: SMTP credential configured  
    - Edge Cases: SMTP failures, invalid email addresses, blocked spam filters.  
    - Version: 2.1

  - **Send Message To Internal Team**  
    - Type: Slack node  
    - Role: Posts a concise summary message about the stale Opportunity to an internal Slack channel.  
    - Configuration:  
      - Text: `{{ $('Parse JSON').item.json.slack.message }}`  
      - Channel: configured Slack channel ID  
    - Input: Parsed JSON from Parse JSON node  
    - Credentials: Slack API token  
    - Edge Cases: Slack API errors, incorrect channel ID, permission issues.  
    - Version: 2.3

  - **Create Task**  
    - Type: HTTP Request node  
    - Role: Creates a Salesforce Task record linked to the Opportunity Owner and Opportunity.  
    - Configuration:  
      - URL: Salesforce Task API endpoint  
      - Method: POST  
      - Body: JSON from `{{ $json.task.api_body }}` (from AI output)  
      - Authentication: Salesforce OAuth2  
    - Input: Parsed JSON from Parse JSON node  
    - Edge Cases: API failures, invalid OwnerId/WhatId, data validation issues.  
    - Version: 4.2

  - **Sticky Note – Actions Summary**  
    - Clarifies the purpose of each action node: emailing client, Slack notification, and Salesforce Task creation.

---

### 3. Summary Table

| Node Name                 | Node Type                  | Functional Role                                    | Input Node(s)          | Output Node(s)                         | Sticky Note                                                                                  |
|---------------------------|----------------------------|---------------------------------------------------|-----------------------|--------------------------------------|----------------------------------------------------------------------------------------------|
| Schedule Trigger           | Schedule Trigger            | Triggers workflow daily at 8:00 AM                 | None                  | Edit Fields                          | Sticky Note – Schedule & Threshold (Schedule & stale_days setup)                            |
| Edit Fields               | Set                        | Sets `stale_days` parameter (default 14 days)      | Schedule Trigger       | Perform a query                      | Sticky Note – Schedule & Threshold                                                          |
| Perform a query           | Salesforce (search)         | Queries stale Opportunities by `stale_days`        | Edit Fields            | Get an opportunity                  | Sticky Note – Opportunity Fetch                                                             |
| Get an opportunity        | Salesforce (get)            | Retrieves full Opportunity details                  | Perform a query        | Message a model                     | Sticky Note – Opportunity Fetch                                                             |
| Message a model           | Langchain OpenAI (GPT-5.1) | Generates follow-up messages & task JSON            | Get an opportunity     | Parse JSON                         | Sticky Note – AI Engine1 (AI-driven enrichment & message generation)                        |
| query_soql                | HTTP Request Tool           | Executes dynamic SOQL queries requested by AI       | AI Tool call from model| Message a model (AI tool input)    |                                                                                              |
| Parse JSON                | Code (JavaScript)           | Parses AI JSON output into structured format        | Message a model        | Send Email SMTP Customer, Create Task, Send Message To Internal Team |                                                                                              |
| Send Email SMTP Customer  | Email Send (SMTP)           | Sends personalized follow-up email to client        | Parse JSON             | None                               | Sticky Note – Actions Summary (Email action)                                               |
| Send Message To Internal Team | Slack                   | Posts internal Slack notification about stale deal  | Parse JSON             | None                               | Sticky Note – Actions Summary (Slack notification)                                         |
| Create Task               | HTTP Request                | Creates Salesforce Task for Opportunity Owner        | Parse JSON             | None                               | Sticky Note – Actions Summary (Task creation)                                              |
| Sticky Note               | Sticky Note                 | Overview of stale opportunity follow-up process     | None                  | None                               | Sticky Note: Describes full workflow purpose and logic                                    |
| Sticky Note1              | Sticky Note                 | Setup and testing instructions                       | None                  | None                               | Sticky Note: Setup & Testing Instructions                                                  |
| Sticky Note – Schedule & Threshold | Sticky Note          | Explains scheduling and threshold parameter         | None                  | None                               | Sticky Note – Schedule & Threshold                                                         |
| Sticky Note – Opportunity Fetch | Sticky Note             | Explains Salesforce data retrieval                   | None                  | None                               | Sticky Note – Opportunity Fetch                                                           |
| Sticky Note – AI Engine1  | Sticky Note                 | Describes AI processing and enrichment block        | None                  | None                               | Sticky Note – AI Engine1                                                                   |
| Sticky Note – Actions Summary | Sticky Note              | Summarizes actions: email, Slack, task creation     | None                  | None                               | Sticky Note – Actions Summary                                                             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Schedule Trigger node**  
   - Type: Schedule Trigger  
   - Set trigger to run daily at 8:00 AM (triggerAtHour: 8)

2. **Add a Set node (Edit Fields)**  
   - Type: Set  
   - Add a number field assignment: `stale_days` = 14 (or desired threshold)  
   - Connect Schedule Trigger → Edit Fields

3. **Add Salesforce node to perform SOQL query (Perform a query)**  
   - Type: Salesforce, resource: search  
   - Configure SOQL query:  
     ```
     Select id from opportunity where Stage_Unchanged_Days__c =  {{ $json.stale_days }} And StageName Not In ('Closed Won', 'Closed Lost')
     ```  
   - Use Salesforce OAuth2 credentials  
   - Connect Edit Fields → Perform a query

4. **Add Salesforce node to get full Opportunity (Get an opportunity)**  
   - Type: Salesforce, resource: opportunity, operation: get  
   - Set Opportunity ID: `={{ $json.Id }}` (mapped from previous query)  
   - Use same Salesforce OAuth2 credentials  
   - Connect Perform a query → Get an opportunity

5. **Add Langchain OpenAI node (Message a model)**  
   - Use model GPT-5.1  
   - Paste the detailed system prompt describing the assistant’s role, embedded SOQL query tool usage, and output JSON schema (as provided)  
   - Pass full Opportunity JSON as input  
   - Use OpenAI API credentials  
   - Connect Get an opportunity → Message a model

6. **Add HTTP Request Tool node to enable dynamic SOQL queries (query_soql)**  
   - Set URL to Salesforce query endpoint:  
     `https://[mydomain].salesforce.com/services/data/v64.0/query/`  
   - Configure to accept dynamic SOQL query string from AI input  
   - Authenticate with Salesforce OAuth2 credentials  
   - Configure as an AI tool node to respond to AI model’s embedded queries  
   - Connect as AI tool input to Message a model node

7. **Add Code node to parse AI JSON output (Parse JSON)**  
   - JavaScript code:  
     ```js
     return JSON.parse($input.first().json.output[0].content[0].text);
     ```  
   - Connect Message a model → Parse JSON

8. **Add Email Send node (Send Email SMTP Customer)**  
   - Use SMTP credentials  
   - Set parameters:  
     - To: `{{ $json.email.to }}`  
     - Subject: `{{ $json.email.subject }}`  
     - Text body: `{{ $json.email.body }}`  
     - From: fixed sender email  
   - Connect Parse JSON → Send Email SMTP Customer

9. **Add Slack node (Send Message To Internal Team)**  
   - Use Slack API credentials  
   - Set message text: `{{ $('Parse JSON').item.json.slack.message }}`  
   - Set the Slack channel by ID (e.g., sales channel)  
   - Connect Parse JSON → Send Message To Internal Team

10. **Add HTTP Request node to create Salesforce Task (Create Task)**  
    - URL: `https://[mydomain].salesforce.com/services/data/v60.0/sobjects/Task`  
    - Method: POST  
    - Body (JSON): `{{ $json.task.api_body }}`  
    - Authenticate with Salesforce OAuth2 credentials  
    - Connect Parse JSON → Create Task

11. **Add Sticky Notes for clarity (optional)**  
    - Add descriptive sticky notes for each logical block and instructions.

12. **Test the workflow**  
    - Disable Schedule Trigger and manually run on test Opportunities  
    - Review AI outputs, email delivery, Slack posting, and Task creation  
    - Adjust `stale_days` or SOQL queries as needed  
    - Enable Schedule Trigger for production use

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Context or Link                                                                                                           |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------|
| This workflow requires a custom Salesforce formula field `Stage_Unchanged_Days__c` on Opportunity, defined as: `IF(ISBLANK(LastStageChangeDate), TODAY() - DATEVALUE(CreatedDate), TODAY() - DATEVALUE(LastStageChangeDate))`. This field tracks how many days the current stage has remained unchanged and drives the stale criteria.                                                                                                                                                                                                         | Setup instructions from Sticky Note1                                                                                      |
| Adjust the `stale_days` parameter in the Set node to control when Opportunities are considered stale (e.g., 7 or 14 days). Modify the SOQL query in the Perform a query node to fit your sales pipeline rules or Opportunity statuses.                                                                                                                                                                                                                                                                | Sticky Note – Schedule & Threshold; Sticky Note – Opportunity Fetch                                                       |
| The AI model prompt includes embedded tooling to query Salesforce Notes, Contacts, and Owner data dynamically, providing personalized messaging and context-aware follow-ups. It outputs a strict JSON schema with sections for email, sms, slack, and Salesforce task creation. Handle AI JSON parsing errors gracefully if output formatting changes.                                                                                                                                               | Sticky Note – AI Engine1                                                                                                  |
| Salesforce, OpenAI, SMTP, and Slack credentials must be properly configured and linked in their respective nodes. Test thoroughly with manual runs before enabling scheduled automation to prevent spamming or incorrect messaging.                                                                                                                                                                                                                                                             | Sticky Note1                                                                                                              |
| The workflow uses the latest Salesforce REST API versions (v64.0 for queries, v60.0 for Task creation). Update endpoints if Salesforce upgrades APIs.                                                                                                                                                                                                                                                                                                                                           | API version usage from HTTP Request nodes                                                                                  |
| Slack channel ID must be set correctly in the Slack node `Send Message To Internal Team`. If your Slack workspace supports user mentions, format Slack messages accordingly to notify Opportunity owners.                                                                                                                                                                                                                                                                                          | Slack node configuration                                                                                                  |
| The email sender address (`from@email.com`) must be replaced with a valid SMTP account sender address. Email content is plain text to maximize compatibility.                                                                                                                                                                                                                                                                                                                                     | Email Send node configuration                                                                                             |

---

**Disclaimer:** The text provided is derived exclusively from an automated n8n workflow and complies fully with content policies. It contains no illegal, offensive, or protected content. All data processed are legal and public.