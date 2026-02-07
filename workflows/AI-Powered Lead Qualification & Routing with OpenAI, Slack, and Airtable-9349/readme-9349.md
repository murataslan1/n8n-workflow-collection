AI-Powered Lead Qualification & Routing with OpenAI, Slack, and Airtable

https://n8nworkflows.xyz/workflows/ai-powered-lead-qualification---routing-with-openai--slack--and-airtable-9349


# AI-Powered Lead Qualification & Routing with OpenAI, Slack, and Airtable

### 1. Workflow Overview

This workflow, titled **"Lead Qualification & Routing Engine"**, is designed to automate the intake, qualification, and routing of inbound sales leads using AI, Slack notifications, Airtable storage, and email responses. It targets marketing agencies, SaaS companies, and service businesses aiming to streamline lead management by eliminating manual lead review, scoring, assignment, and follow-up processes.

The workflow is logically divided into the following functional blocks:

- **1.1 Lead Intake:** Captures incoming leads via a webhook from multiple sources (website forms, APIs, landing pages).
- **1.2 Lead Enrichment:** Adds unique identifiers, timestamps, and source information to the lead data.
- **1.3 AI-Powered Lead Qualification:** Uses OpenAI's GPT model to analyze lead details and produce a structured qualification score and insights.
- **1.4 Routing Decision:** Routes leads based on the AI-generated qualification score into "hot" or "nurture" paths.
- **1.5 Data Storage & Notifications:** Saves leads into Airtable, sends Slack alerts for hot leads, and dispatches personalized email responses depending on lead quality.

---

### 2. Block-by-Block Analysis

#### 2.1 Lead Intake

- **Overview:** This block receives incoming lead data via HTTP POST requests through a webhook, immediately acknowledges receipt to the sender, and prepares the data for enrichment.
- **Nodes Involved:** `Lead Intake Webhook`, `Acknowledge Receipt`, `Enrich Lead Data`
  
##### Node Details:

- **Lead Intake Webhook**
  - Type: Webhook
  - Role: Entry point for lead data submission.
  - Configuration: Listens on path `lead-intake` for HTTP POST requests; responds asynchronously.
  - Inputs: External HTTP POST request.
  - Outputs: JSON lead data forwarded downstream.
  - Edge Cases: Invalid HTTP methods, malformed JSON payloads, or missing required lead fields may cause processing failures.
  
- **Acknowledge Receipt**
  - Type: Respond to Webhook
  - Role: Sends confirmation JSON response back to the webhook caller.
  - Configuration: Responds with JSON confirming success and echoes the `leadId` from payload.
  - Inputs: Lead data from webhook.
  - Outputs: Response sent to external caller; forwards data downstream.
  - Edge Cases: Expression failures if `leadId` is missing; response delays.
  
- **Enrich Lead Data**
  - Type: Set Node
  - Role: Generates and appends enriched metadata to lead data.
  - Configuration:
    - Creates `leadId` as a timestamp-based unique string combined with the email username.
    - Adds current ISO timestamp.
    - Sets `source` defaulting to "website" if unspecified.
  - Inputs: Raw lead JSON.
  - Outputs: Enriched lead JSON.
  - Edge Cases: Email field missing or improperly formatted may break leadId generation.

---

#### 2.2 AI-Powered Lead Qualification

- **Overview:** This block sends enriched lead details to OpenAI’s GPT model to analyze and assign a qualification score with detailed reasoning, then parses the structured response.
- **Nodes Involved:** `OpenAI Model`, `AI Lead Qualification`, `Parse AI Response`
  
##### Node Details:

- **OpenAI Model**
  - Type: Language Model (OpenAI GPT)
  - Role: Executes the AI prompt for lead analysis.
  - Configuration: Uses GPT-4o-mini model (compact GPT-4 variant) via stored OpenAI credential.
  - Inputs: Prompt template with lead data placeholders.
  - Outputs: Raw GPT chat completion response.
  - Edge Cases: API key invalid/expired; rate limits; network issues.
  
- **AI Lead Qualification**
  - Type: Langchain LLM Chain Node
  - Role: Formats input prompt with lead details, sends to OpenAI, expects structured output.
  - Configuration:
    - Prompt includes lead fields: name, email, company, message, budget, timeline.
    - Output is parsed with a custom schema.
  - Inputs: Enriched lead data.
  - Outputs: AI-generated structured qualification data.
  - Edge Cases: Missing lead data fields causing prompt generation failure; AI output format deviations.
  
- **Parse AI Response**
  - Type: Structured Output Parser
  - Role: Validates and parses the AI response into defined JSON schema including:
    - score (integer 0-100)
    - category ("hot", "warm", "cold")
    - reasoning (string)
    - recommended_action (string)
    - optional arrays: key_strengths and concerns
  - Inputs: Raw AI output.
  - Outputs: Parsed JSON with qualification details.
  - Edge Cases: Parsing errors if AI response does not conform to schema.

---

#### 2.3 Routing Decision

- **Overview:** This block evaluates the AI qualification score to decide if the lead is "hot" (score > 70) or needs nurturing, routing accordingly.
- **Nodes Involved:** `Route by Quality`
  
##### Node Details:

- **Route by Quality**
  - Type: If Node
  - Role: Conditional branching based on qualification score.
  - Configuration:
    - Condition checks if `score` > 70.
    - If true, routes to "hot leads" path.
    - Else, routes to nurture queue.
  - Inputs: AI qualification output.
  - Outputs: Two branches:
    - True branch → hot lead processing.
    - False branch → nurture lead processing.
  - Edge Cases: Missing or non-numeric score; borderline values exactly 70 not explicitly handled (uses strictly greater than).

---

#### 2.4 Data Storage & Notifications

- **Overview:** Saves leads in Airtable, sends Slack alerts for hot leads, and dispatches personalized emails. Separate nodes handle hot leads and nurture queue paths.
- **Nodes Involved:** 
  - Hot Leads Path: `Save to Airtable (Hot Leads)`, `Alert Team (Slack)`, `Send Confirmation Email (Hot)`
  - Nurture Path: `Save to Airtable (Nurture Queue)`, `Send Nurture Email`
  
##### Node Details:

- **Save to Airtable (Hot Leads)**
  - Type: Airtable Node
  - Role: Appends hot lead data to designated Airtable base/table.
  - Configuration: Uses Airtable base and table IDs (replace placeholders).
  - Inputs: Hot qualified lead data.
  - Outputs: Confirmation of append; forwards lead to Slack and email nodes.
  - Edge Cases: API authentication failure; base/table ID misconfiguration.
  
- **Alert Team (Slack)**
  - Type: Slack Node
  - Role: Sends a notification alert to Slack webhook/channel for sales team.
  - Configuration: Uses Slack Webhook ID configured in credentials.
  - Inputs: Hot lead data from Airtable node.
  - Outputs: Slack message sent.
  - Edge Cases: Slack webhook invalid; rate limits.
  
- **Send Confirmation Email (Hot)**
  - Type: Email Send
  - Role: Sends a personalized thank-you email to hot leads.
  - Configuration:
    - Subject: “Thank you for your inquiry - We'll be in touch soon!”
    - Recipient: Lead email from intake.
    - Sender: `leads@youragency.com`
  - Inputs: Hot lead data.
  - Outputs: Email dispatch confirmation.
  - Edge Cases: Email sending failure; invalid email address.
  
- **Save to Airtable (Nurture Queue)**
  - Type: Airtable Node
  - Role: Appends nurture queue leads to Airtable.
  - Configuration: Same base/table as hot leads (customize if needed).
  - Inputs: Leads failing hot lead threshold.
  - Outputs: Confirmation; forwards to nurture email.
  - Edge Cases: Same as hot leads Airtable node.
  
- **Send Nurture Email**
  - Type: Email Send
  - Role: Sends a generic nurture email to leads not qualified as hot.
  - Configuration:
    - Subject: “Thank you for contacting us”
    - Recipient: Lead email from intake.
    - Sender: `leads@youragency.com`
  - Inputs: Nurture lead data.
  - Outputs: Email dispatch confirmation.
  - Edge Cases: Same as confirmation email.

---

#### 2.5 Sticky Notes (Documentation Nodes)

- Several sticky notes document each major block and general workflow concepts:
  - `Note: Intake` — Explains lead capture sources.
  - `Note: AI Analysis1` — Describes AI qualification logic.
  - `Note: Smart Routing` — Details routing logic and thresholds.
  - `Note: Actions` — Covers data storage and notifications.
  - `Note: Intake1` — Extensive overview, setup instructions, use cases, and alternatives.

---

### 3. Summary Table

| Node Name                 | Node Type                  | Functional Role                | Input Node(s)               | Output Node(s)                                  | Sticky Note                                                                                                            |
|---------------------------|----------------------------|-------------------------------|-----------------------------|------------------------------------------------|------------------------------------------------------------------------------------------------------------------------|
| Lead Intake Webhook        | Webhook                    | Entry point for leads          | -                           | Acknowledge Receipt                             | Note: Intake1 (extensive overview and setup)                                                                           |
| Acknowledge Receipt        | Respond to Webhook          | Responds to sender            | Lead Intake Webhook          | Enrich Lead Data                               | Note: Intake1                                                                                                          |
| Enrich Lead Data           | Set                        | Add metadata to lead          | Acknowledge Receipt          | AI Lead Qualification                          | Note: Intake                                                                                                           |
| OpenAI Model               | Langchain LM Chat OpenAI   | AI model call                 | AI Lead Qualification        | AI Lead Qualification (LLM Chain)              | Note: AI Analysis1                                                                                                     |
| AI Lead Qualification      | Langchain Chain LLM        | Format + send prompt to AI    | Enrich Lead Data, OpenAI Model | Route by Quality                               | Note: AI Analysis1                                                                                                     |
| Parse AI Response          | Langchain Output Parser    | Parse AI response             | AI Lead Qualification        | AI Lead Qualification                          | Note: AI Analysis1                                                                                                     |
| Route by Quality           | If                         | Conditional routing           | AI Lead Qualification        | Save to Airtable (Hot Leads), Save to Airtable (Nurture Queue) | Note: Smart Routing                                                                                                    |
| Save to Airtable (Hot Leads) | Airtable                  | Store hot leads               | Route by Quality             | Alert Team (Slack), Send Confirmation Email (Hot) | Note: Actions                                                                                                         |
| Alert Team (Slack)         | Slack                      | Notify sales team             | Save to Airtable (Hot Leads) | -                                              | Note: Actions                                                                                                         |
| Send Confirmation Email (Hot) | Email Send               | Email hot leads               | Save to Airtable (Hot Leads) | -                                              | Note: Actions                                                                                                         |
| Save to Airtable (Nurture Queue) | Airtable              | Store nurture leads           | Route by Quality             | Send Nurture Email                             | Note: Actions                                                                                                         |
| Send Nurture Email         | Email Send                 | Email nurture leads           | Save to Airtable (Nurture Queue) | -                                              | Note: Actions                                                                                                         |
| Note: Intake               | Sticky Note                | Documentation                 | -                           | -                                              | Explains lead intake sources                                                                                          |
| Note: AI Analysis1         | Sticky Note                | Documentation                 | -                           | -                                              | Describes AI qualification logic                                                                                      |
| Note: Smart Routing        | Sticky Note                | Documentation                 | -                           | -                                              | Explains routing rules                                                                                                |
| Note: Actions              | Sticky Note                | Documentation                 | -                           | -                                              | Covers data storage and notifications                                                                                 |
| Note: Intake1              | Sticky Note                | Documentation                 | -                           | -                                              | Extensive overview, setup instructions, alternatives, use cases                                                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node:**
   - Name: `Lead Intake Webhook`
   - Type: Webhook
   - HTTP Method: POST
   - Path: `lead-intake`
   - Response Mode: `responseNode`
   - No authentication needed unless desired.

2. **Create Respond to Webhook Node:**
   - Name: `Acknowledge Receipt`
   - Type: Respond to Webhook
   - Connect input from `Lead Intake Webhook`
   - Response Type: JSON
   - Response Body Expression:
     ```json
     {
       "success": true,
       "message": "Lead received and processing",
       "leadId": {{$json["leadId"]}}
     }
     ```

3. **Create Set Node for Enrichment:**
   - Name: `Enrich Lead Data`
   - Connect input from `Acknowledge Receipt`
   - Add fields:
     - `leadId`: `{{$now.format('yyyyMMddHHmmss')}}-{{$json.email.split('@')[0]}}`
     - `timestamp`: `{{$now.toISO()}}`
     - `source`: `{{$json.source || 'website'}}`

4. **Create OpenAI Model Node:**
   - Name: `OpenAI Model`
   - Type: Langchain LM Chat OpenAI
   - Credentials: Configure with your OpenAI API key
   - Model: Select `gpt-4o-mini` or equivalent
   - No specific options needed

5. **Create Langchain Chain LLM Node:**
   - Name: `AI Lead Qualification`
   - Connect input from `Enrich Lead Data`
   - Set prompt text:
     ```
     Analyze this lead and provide a qualification score:

     Name: {{$json.name}}
     Email: {{$json.email}}
     Company: {{$json.company}}
     Message: {{$json.message}}
     Budget: {{$json.budget}}
     Timeline: {{$json.timeline}}
     ```
   - Set prompt type: `define`
   - Enable output parser

6. **Connect `OpenAI Model` to `AI Lead Qualification` as the language model**

7. **Create Langchain Output Parser Node:**
   - Name: `Parse AI Response`
   - Connect input from `AI Lead Qualification` (AI output parser input)
   - Define schema with:
     - `score`: integer (0-100)
     - `category`: enum ["hot", "warm", "cold"]
     - `reasoning`: string
     - `recommended_action`: string
     - Optional arrays: `key_strengths`, `concerns`

8. **Create If Node:**
   - Name: `Route by Quality`
   - Connect input from `AI Lead Qualification` main output
   - Condition: `$json.output.score > 70` (number comparison)
   - True branch: Hot leads
   - False branch: Nurture leads

9. **Create Airtable Node for Hot Leads:**
   - Name: `Save to Airtable (Hot Leads)`
   - Connect input from `Route by Quality` true branch
   - Configure Airtable credentials
   - Set base and table IDs (replace placeholders)
   - Operation: Append

10. **Create Slack Node:**
    - Name: `Alert Team (Slack)`
    - Connect input from `Save to Airtable (Hot Leads)`
    - Configure Slack Webhook credentials
    - Operation: Send message to notify sales of hot lead

11. **Create Email Send Node for Hot Leads:**
    - Name: `Send Confirmation Email (Hot)`
    - Connect input from `Save to Airtable (Hot Leads)`
    - Configure SMTP or email provider credentials
    - Subject: "Thank you for your inquiry - We'll be in touch soon!"
    - Recipient: `{{$node["Lead Intake Webhook"].json["email"]}}`
    - Sender: `leads@youragency.com`

12. **Create Airtable Node for Nurture Leads:**
    - Name: `Save to Airtable (Nurture Queue)`
    - Connect input from `Route by Quality` false branch
    - Configure same Airtable credentials and IDs as hot leads or different as preferred
    - Operation: Append

13. **Create Email Send Node for Nurture Leads:**
    - Name: `Send Nurture Email`
    - Connect input from `Save to Airtable (Nurture Queue)`
    - Configure SMTP or email provider credentials
    - Subject: "Thank you for contacting us"
    - Recipient: `{{$node["Lead Intake Webhook"].json["email"]}}`
    - Sender: `leads@youragency.com`

14. **Add Sticky Notes for Documentation:**
    - Add notes describing each major block and general workflow purpose.

15. **Test Workflow:**
    - Send test POST request to webhook with sample lead data.
    - Verify AI qualification, routing, Airtable entries, Slack notification, and emails.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                           | Context or Link                                                                                                           |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------|
| This workflow automates lead qualification and routing, reducing manual review time from 5+ minutes to approximately 20-30 seconds per lead.                                         | Overview from `Note: Intake1` sticky note                                                                                 |
| Required credentials: OpenAI API, Airtable, Slack webhook, Email SMTP or provider.                                                                                                      | Setup instructions in `Note: Intake1`                                                                                     |
| Replace placeholder Airtable Base ID and Table ID in Airtable nodes before deploying.                                                                                                   | Setup instructions                                                                                                        |
| The AI qualification prompt can be customized to fit specific business criteria and lead fields.                                                                                       | Customization recommendation                                                                                              |
| Routing threshold currently set to score > 70 for hot leads; can be adjusted in `Route by Quality` node.                                                                               | `Note: Smart Routing`                                                                                                     |
| Slack can be replaced with Microsoft Teams or other messaging services; email can be routed through different providers.                                                               | Alternative approaches mentioned in `Note: Intake1`                                                                       |
| Workflow is designed for scalability and quick integration with CRM systems via Airtable; CRM integration nodes can be added for extended functionality.                              | Future extension ideas                                                                                                    |
| For best results, test with sample data before enabling webhook publicly to avoid processing invalid leads.                                                                            | Recommended testing procedure                                                                                             |
| Link to Langchain Node documentation and OpenAI API: https://docs.n8n.io/integrations/builtin/nodes/n8n-nodes-langchain/                                                               | Helpful for advanced prompt engineering                                                                                   |

---

**Disclaimer:**  
The provided content is exclusively derived from an automated n8n workflow. It strictly complies with content policies and contains no illegal, offensive, or protected material. All processed data is lawful and publicly accessible.