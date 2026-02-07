Automate Event Follow-Ups with GPT-4, LinkedIn & HubSpot Multi-Channel Outreach

https://n8nworkflows.xyz/workflows/automate-event-follow-ups-with-gpt-4--linkedin---hubspot-multi-channel-outreach-10282


# Automate Event Follow-Ups with GPT-4, LinkedIn & HubSpot Multi-Channel Outreach

### 1. Workflow Overview

This workflow, titled **"Smart Event Follow-Up & Networking Assistant"**, automates personalized follow-up communication after events by leveraging GPT-4 AI, LinkedIn data, and HubSpot CRM. It is designed to enhance networking efficacy by integrating multi-channel outreach (email, LinkedIn, Slack) based on attendee engagement and profile insights.

**Target Use Cases:**  
- Event organizers aiming to automate personalized follow-ups based on attendee interactions.  
- Sales or business development teams seeking to nurture leads with AI-generated messages tailored to attendee profiles and interaction levels.  
- Marketing teams wanting to track outreach performance and update CRM records seamlessly.

**Logical Blocks:**  
- **1.1 Input Reception & Data Collection:** Receives event data via webhook, collects attendees and interaction logs.  
- **1.2 Data Enrichment:** Enriches attendee data with LinkedIn profile information and merges datasets.  
- **1.3 AI Profile Analysis:** Applies GPT-4 to analyze enriched profiles and interactions, determining follow-up priority and generating insights.  
- **1.4 Priority Filtering & Message Generation:** Filters attendees by follow-up priority and generates personalized email and LinkedIn messages using AI.  
- **1.5 Multi-Channel Outreach:** Sends emails, LinkedIn messages, and Slack notifications accordingly.  
- **1.6 CRM Update & Data Logging:** Updates HubSpot CRM, saves follow-up data in a Postgres database, and generates analytics.  
- **1.7 Response Handling:** Sends final JSON response confirming workflow completion and analytics.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception & Data Collection

- **Overview:** Accepts incoming webhook POST calls containing event identifiers, then fetches attendee and interaction data from the event platform via API.  
- **Nodes Involved:**  
  - Webhook Trigger  
  - Get Attendees  
  - Get Interactions  
  - Enrich LinkedIn Data  
  - Sticky Note  

- **Node Details:**  
  - **Webhook Trigger**  
    - Type: Webhook (HTTP POST trigger)  
    - Config: Listens on path `networking-assistant`; responds immediately with node output.  
    - Inputs: External HTTP POST JSON containing eventId and eventName.  
    - Outputs: Passes event data downstream.  
    - Edge cases: Missing or malformed eventId leads to API failures downstream.  
  - **Get Attendees**  
    - Type: HTTP Request  
    - Config: Calls event platform API `https://api.eventplatform.com/events/{{ $json.body.eventId }}/attendees` with generic credentials.  
    - Inputs: Event ID from webhook.  
    - Outputs: List of attendees.  
    - Edge cases: API rate limits, authentication failure, empty attendee list.  
  - **Get Interactions**  
    - Type: HTTP Request  
    - Config: Calls `.../interactions` endpoint for the same eventId.  
    - Inputs: Event ID.  
    - Outputs: Interaction logs.  
    - Edge cases: Similar to Get Attendees.  
  - **Enrich LinkedIn Data**  
    - Type: HTTP Request  
    - Config: Calls LinkedIn API `https://api.linkedin.com/v2/people/{{ $json.linkedinId }}` to fetch profile details per attendee.  
    - Inputs: LinkedIn IDs from attendee data.  
    - Outputs: Profile enrichment data.  
    - Edge cases: LinkedIn API auth errors, missing LinkedIn IDs.  
  - **Sticky Note**  
    - Content: "Collects attendee data from your event platform"  
    - Related to Get Attendees, Get Interactions, Webhook Trigger nodes for contextual clarity.

---

#### 1.2 Data Enrichment

- **Overview:** Merges attendee, interaction, and LinkedIn profile data for each individual to create a comprehensive dataset for AI analysis.  
- **Nodes Involved:**  
  - Merge & Enrich Data  
  - Sticky Note1  

- **Node Details:**  
  - **Merge & Enrich Data**  
    - Type: Code node (JavaScript)  
    - Config: Combines data arrays from attendees, interactions, and LinkedIn profiles keyed by attendee ID or LinkedIn ID.  
    - Inputs: Outputs from Get Attendees, Get Interactions, and Enrich LinkedIn Data.  
    - Outputs: Unified enriched data per attendee with interaction scores and profile details.  
    - Edge cases: Missing keys, data mismatch, empty inputs causing merge failures.  
  - **Sticky Note1**  
    - Content: "Enriches with LinkedIn profiles & real-time interaction logs"  
    - Positioned alongside Merge & Enrich Data node.

---

#### 1.3 AI Profile Analysis

- **Overview:** Uses GPT-4 via LangChain nodes to analyze enriched profiles, conversations, and interactions to classify follow-up priority and generate actionable insights.  
- **Nodes Involved:**  
  - AI Analyze Profile  
  - AI Agent  
  - Sticky Note2  

- **Node Details:**  
  - **AI Analyze Profile**  
    - Type: LangChain LM Chat OpenAI node  
    - Config: Model set to GPT-4o (GPT-4 optimized), temperature 0.8 for creative insights.  
    - Inputs: Enriched attendee data from Merge & Enrich Data.  
    - Outputs: Classification of follow-up priority (e.g., high, medium), AI insights about attendee role and interests.  
    - Credentials: Requires OpenAI API key.  
    - Edge cases: API rate limits, unexpected input formats causing prompt failures.  
  - **AI Agent**  
    - Type: LangChain Agent node  
    - Config: Receives AI Analyze Profile output, manages workflow branching based on priority.  
    - Inputs: AI Analyze Profile outputs.  
    - Outputs: Routes data to priority filters.  
  - **Sticky Note2**  
    - Content: "Uses AI to analyze conversations, roles, and mutual interests"  
    - Covers AI Analyze Profile and AI Agent nodes.

---

#### 1.4 Priority Filtering & Message Generation

- **Overview:** Filters attendees by follow-up priority and generates tailored email and LinkedIn messages using AI models.  
- **Nodes Involved:**  
  - Filter High Priority  
  - Filter Medium Priority  
  - Generate Email  
  - Generate LinkedIn Msg  
  - AI Agent1  
  - AI Agent2  
  - Sticky Note3  

- **Node Details:**  
  - **Filter High Priority**  
    - Type: Filter node  
    - Config: Checks if `followUpPriority` equals "high" (case-insensitive).  
    - Inputs: AI Agent outputs.  
    - Outputs: High priority attendees routed to email generation.  
    - Edge cases: Missing priority field.  
  - **Filter Medium Priority**  
    - Type: Filter node  
    - Config: Same as above but for "medium" priority.  
    - Outputs: Medium priority routed to LinkedIn message generation.  
  - **Generate Email**  
    - Type: LangChain LM Chat OpenAI node  
    - Config: Uses OpenAI model to create personalized email content.  
    - Inputs: Attendee data from Filter High Priority.  
    - Outputs: Generated email text stored as `generatedEmail`.  
    - Credentials: OpenAI.  
  - **Generate LinkedIn Msg**  
    - Type: LangChain LM Chat OpenAI node  
    - Config: Similar to Generate Email, but for LinkedIn messages.  
    - Inputs: Attendee data from Filter Medium Priority.  
    - Outputs: Generated LinkedIn message as `generatedLinkedInMsg`.  
  - **AI Agent1**  
    - Type: LangChain Agent node  
    - Config: Sends generated emails.  
    - Inputs: Email generation output.  
    - Outputs: Connects to Send Email node.  
  - **AI Agent2**  
    - Type: LangChain Agent node  
    - Config: Sends LinkedIn messages and Slack notifications.  
    - Inputs: LinkedIn message generation output.  
    - Outputs: To Send LinkedIn and Slack Notification nodes.  
  - **Sticky Note3**  
    - Content: "Generates hyper-personalized follow-up emails and LinkedIn messages and sends messages through preferred channels (email, LinkedIn, Slack)"  
    - Covers Generate Email, Generate LinkedIn Msg, AI Agent1, AI Agent2 nodes.

---

#### 1.5 Multi-Channel Outreach

- **Overview:** Sends out the generated emails, LinkedIn messages, and Slack notifications to attendees.  
- **Nodes Involved:**  
  - Send email  
  - Send LinkedIn  
  - Slack Notification  
  - Sticky Note4 (partial)  

- **Node Details:**  
  - **Send email**  
    - Type: Email Send node  
    - Config: Sends email via configured SMTP credentials; subject includes event name dynamically.  
    - Inputs: Email text from Generate Email via AI Agent1.  
    - Outputs: Connects to Update CRM node.  
    - Credentials: SMTP with authorized email account.  
    - Edge cases: SMTP connection failure, invalid email addresses.  
  - **Send LinkedIn**  
    - Type: HTTP Request  
    - Config: Posts to LinkedIn API `https://api.linkedin.com/v2/messages` with recipient LinkedIn ID and message body.  
    - Inputs: Generated LinkedIn message text.  
    - Outputs: Connects to Update CRM node.  
    - Edge cases: LinkedIn API limits, message formatting errors.  
  - **Slack Notification**  
    - Type: HTTP Request  
    - Config: Posts to Slack API `chat.postMessage` targeting user channel with follow-up reminder text.  
    - Inputs: Slack user ID from attendee data.  
    - Outputs: Connects to Save to Database node.  
    - Edge cases: Slack API errors, invalid channel IDs.  
  - **Sticky Note4**  
    - Content: "Updates HubSpot CRM with follow-up status and next steps\nLogs all actions and tracks analytics for performance reporting"  
    - Covers Update CRM, Save to Database nodes mainly but applies conceptually here.

---

#### 1.6 CRM Update & Data Logging

- **Overview:** Updates HubSpot CRM records, logs follow-up details into a Postgres database, and generates analytics for reporting.  
- **Nodes Involved:**  
  - Update CRM  
  - Save to Database  
  - Generate Analytics  
  - Send Response  

- **Node Details:**  
  - **Update CRM**  
    - Type: HubSpot node  
    - Config: Updates contact records by email, adding follow-up status and notes.  
    - Inputs: Outputs from Send Email and Send LinkedIn nodes.  
    - Credentials: HubSpot OAuth2 API credentials.  
    - Edge cases: Email not found in CRM, API throttling.  
  - **Save to Database**  
    - Type: Postgres node  
    - Config: Inserts a record into `networking_followups` table with attendee ID, event ID, priority, interaction score, email sent flag, AI insights (JSON), and timestamp.  
    - Inputs: Update CRM outputs and Slack Notification outputs.  
    - Credentials: Postgres connection credentials.  
    - Edge cases: DB connection failure, constraint violations.  
  - **Generate Analytics**  
    - Type: Code node  
    - Config: Processes saved data and creates analytic summaries (likely aggregate stats).  
    - Inputs: Save to Database output.  
    - Outputs: Analytics data for response.  
  - **Send Response**  
    - Type: Respond to Webhook node  
    - Config: Returns JSON with success message and analytics.  
    - Inputs: Generate Analytics output.  

---

### 3. Summary Table

| Node Name          | Node Type                        | Functional Role                     | Input Node(s)             | Output Node(s)             | Sticky Note                                                                                     |
|--------------------|---------------------------------|-----------------------------------|---------------------------|----------------------------|------------------------------------------------------------------------------------------------|
| Webhook Trigger    | Webhook                         | Entry point, receives event data  | (external HTTP POST)       | Get Attendees, Get Interactions, Enrich LinkedIn Data | Collects attendee data from your event platform                                                 |
| Get Attendees      | HTTP Request                   | Fetch attendees from event API    | Webhook Trigger           | Merge & Enrich Data         | Collects attendee data from your event platform                                                 |
| Get Interactions   | HTTP Request                   | Fetch interaction logs from API   | Webhook Trigger           | Merge & Enrich Data         | Collects attendee data from your event platform                                                 |
| Enrich LinkedIn Data| HTTP Request                   | Fetch LinkedIn profile data       | Webhook Trigger           | Merge & Enrich Data         | Collects attendee data from your event platform                                                 |
| Merge & Enrich Data| Code                           | Combine all data into one dataset | Get Attendees, Get Interactions, Enrich LinkedIn Data | AI Analyze Profile, AI Agent | Enriches with LinkedIn profiles & real-time interaction logs                                    |
| AI Analyze Profile | LangChain LM Chat OpenAI       | Analyze profiles & classify priority | Merge & Enrich Data       | AI Agent                   | Uses AI to analyze conversations, roles, and mutual interests                                  |
| AI Agent           | LangChain Agent                | Route based on AI analysis        | AI Analyze Profile        | Filter High Priority, Filter Medium Priority | Uses AI to analyze conversations, roles, and mutual interests                                  |
| Filter High Priority| Filter                        | Select high priority attendees    | AI Agent                  | AI Agent1                  | Generates hyper-personalized follow-up emails and LinkedIn messages and sends messages through preferred channels (email, LinkedIn, Slack) |
| Filter Medium Priority| Filter                      | Select medium priority attendees  | AI Agent                  | AI Agent2                  | Generates hyper-personalized follow-up emails and LinkedIn messages and sends messages through preferred channels (email, LinkedIn, Slack) |
| Generate Email     | LangChain LM Chat OpenAI       | Create personalized email content | Filter High Priority      | AI Agent1                  | Generates hyper-personalized follow-up emails and LinkedIn messages and sends messages through preferred channels (email, LinkedIn, Slack) |
| Generate LinkedIn Msg| LangChain LM Chat OpenAI      | Create personalized LinkedIn message | Filter Medium Priority    | AI Agent2                  | Generates hyper-personalized follow-up emails and LinkedIn messages and sends messages through preferred channels (email, LinkedIn, Slack) |
| AI Agent1          | LangChain Agent                | Manage email sending workflow     | Generate Email            | Send email                 | Generates hyper-personalized follow-up emails and LinkedIn messages and sends messages through preferred channels (email, LinkedIn, Slack) |
| AI Agent2          | LangChain Agent                | Manage LinkedIn & Slack messaging | Generate LinkedIn Msg     | Send LinkedIn, Slack Notification | Generates hyper-personalized follow-up emails and LinkedIn messages and sends messages through preferred channels (email, LinkedIn, Slack) |
| Send email         | Email Send                    | Send email to attendee            | AI Agent1                 | Update CRM                 |                                                                                               |
| Send LinkedIn      | HTTP Request                   | Send LinkedIn message             | AI Agent2                 | Update CRM                 |                                                                                               |
| Slack Notification | HTTP Request                   | Notify via Slack                  | AI Agent2                 | Save to Database           |                                                                                               |
| Update CRM         | HubSpot                       | Update contact record in HubSpot  | Send email, Send LinkedIn | Save to Database           | Updates HubSpot CRM with follow-up status and next steps; Logs all actions and tracks analytics for performance reporting |
| Save to Database   | Postgres                      | Log follow-up details in DB       | Update CRM, Slack Notification | Generate Analytics       | Updates HubSpot CRM with follow-up status and next steps; Logs all actions and tracks analytics for performance reporting |
| Generate Analytics | Code                          | Aggregate and generate analytics  | Save to Database          | Send Response              |                                                                                               |
| Send Response      | Respond to Webhook            | Final response to webhook caller  | Generate Analytics        | (end)                     |                                                                                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Trigger**  
   - Node Type: Webhook  
   - HTTP Method: POST  
   - Path: `networking-assistant`  
   - Response Mode: `responseNode` (to respond with workflow output)  

2. **Add HTTP Request Nodes for Data Collection**  
   - **Get Attendees**:  
     - URL: `https://api.eventplatform.com/events/{{ $json.body.eventId }}/attendees`  
     - Authentication: Generic (configure credentials for event platform API)  
   - **Get Interactions**:  
     - URL: `https://api.eventplatform.com/events/{{ $json.body.eventId }}/interactions`  
     - Authentication: Same as above  
   - **Enrich LinkedIn Data**:  
     - URL: `https://api.linkedin.com/v2/people/{{ $json.linkedinId }}`  
     - Authentication: LinkedIn API credentials (generic credential type)  

3. **Create Code Node "Merge & Enrich Data"**  
   - Purpose: Merge attendee, interaction, and LinkedIn profile data keyed by IDs  
   - Inputs: Outputs from Get Attendees, Get Interactions, Enrich LinkedIn Data nodes  
   - Output: Unified enriched dataset per attendee  

4. **Add LangChain OpenAI Node "AI Analyze Profile"**  
   - Model: GPT-4o  
   - Temperature: 0.8  
   - Credentials: OpenAI API key configured  
   - Input: Enriched data from previous step  
   - Output: Follow-up priority and AI insights  

5. **Add LangChain Agent Node "AI Agent"**  
   - Input: AI Analyze Profile output  
   - Output: Branch to Filter High Priority and Filter Medium Priority nodes  

6. **Create Filter Nodes**  
   - **Filter High Priority**: Condition equals `followUpPriority` is "high"  
   - **Filter Medium Priority**: Condition equals `followUpPriority` is "medium"  

7. **Add Message Generation Nodes Using LangChain OpenAI**  
   - **Generate Email** (for high priority)  
     - Model: (default GPT-4 or GPT-4o)  
     - Input: Attendee data filtered as high priority  
     - Output: Generates email content  
   - **Generate LinkedIn Msg** (for medium priority)  
     - Same as above but tailored for LinkedIn message generation  

8. **Add LangChain Agent Nodes for Sending Messages**  
   - **AI Agent1**: Handles email sending workflow, input from Generate Email  
   - **AI Agent2**: Handles LinkedIn and Slack workflows, input from Generate LinkedIn Msg  

9. **Set up Outreach Nodes**  
   - **Send email**: SMTP email send node  
     - To: attendee’s email  
     - Subject: "Great connecting at {{eventName}}!" (dynamic)  
     - Credentials: SMTP account with authorized email  
   - **Send LinkedIn**: HTTP Request to LinkedIn messages API  
     - POST to `https://api.linkedin.com/v2/messages`  
     - Body: recipient LinkedIn ID, generated LinkedIn message  
     - Authentication: LinkedIn API credentials  
   - **Slack Notification**: HTTP Request to Slack API `chat.postMessage`  
     - Channel: attendee’s Slack user ID  
     - Text: "Follow up with {{name}} from event!"  
     - Authentication: Slack API credentials  

10. **Add HubSpot CRM Update Node**  
    - Type: HubSpot  
    - Update contact by email with follow-up status and notes  
    - Credentials: HubSpot OAuth2 API configured  

11. **Add Postgres Node "Save to Database"**  
    - Table: `networking_followups` in `public` schema  
    - Columns to map: attendee_id, event_id, priority, interaction_score, email_sent (true), AI insights (stringified JSON), created_at (current timestamp)  
    - Credentials: Postgres database access  

12. **Add Code Node "Generate Analytics"**  
    - Purpose: Aggregate data from database entries for reporting  
    - Input: Output from Save to Database node  

13. **Add Respond to Webhook Node "Send Response"**  
    - Respond with JSON containing success message and analytics data  

14. **Connect the nodes as per the logical flow:**  
    - Webhook Trigger → [Get Attendees, Get Interactions, Enrich LinkedIn Data] → Merge & Enrich Data → AI Analyze Profile → AI Agent → [Filter High Priority → Generate Email → AI Agent1 → Send email → Update CRM → Save to Database → Generate Analytics → Send Response]  
    - AI Agent → Filter Medium Priority → Generate LinkedIn Msg → AI Agent2 → [Send LinkedIn, Slack Notification] → Update CRM, Save to Database → …  
    - Slack Notification → Save to Database  
    - Save to Database → Generate Analytics → Send Response  

15. **Add Sticky Notes for Documentation** at the appropriate positions with the exact content from the original workflow for clarity and context.

---

### 5. General Notes & Resources

| Note Content                                                                                     | Context or Link                                                                                           |
|-------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| Collects attendee data from your event platform                                                  | Sticky Note near Webhook Trigger, Get Attendees, Get Interactions                                         |
| Enriches with LinkedIn profiles & real-time interaction logs                                   | Sticky Note near Merge & Enrich Data node                                                                |
| Uses AI to analyze conversations, roles, and mutual interests                                  | Sticky Note near AI Analyze Profile and AI Agent nodes                                                   |
| Generates hyper-personalized follow-up emails and LinkedIn messages and sends messages through preferred channels (email, LinkedIn, Slack) | Sticky Note covering Generate Email, Generate LinkedIn Msg, AI Agent1, AI Agent2                          |
| Updates HubSpot CRM with follow-up status and next steps\nLogs all actions and tracks analytics for performance reporting | Sticky Note near Update CRM and Save to Database nodes                                                   |

---

**Disclaimer:**  
The provided documentation is exclusively derived from an n8n automated workflow and complies fully with current content policies. It contains no illegal, offensive, or protected content. All processed data is legal and publicly accessible.