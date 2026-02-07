Automate Lead Qualification with AI Voice Calls using GPT-3.5, Notion and Vapi

https://n8nworkflows.xyz/workflows/automate-lead-qualification-with-ai-voice-calls-using-gpt-3-5--notion-and-vapi-9803


# Automate Lead Qualification with AI Voice Calls using GPT-3.5, Notion and Vapi

### 1. Workflow Overview

This workflow automates lead qualification by integrating AI-driven voice calls with Notion and Vapi services. It targets businesses seeking to streamline inbound lead management by automatically analyzing new leads from a Notion database, researching their websites, generating personalized AI voice calls via Vapi, and updating lead records with call outcomes.

The workflow consists of two main logical blocks:

- **1.1 Lead Intake and AI Qualification (Part 1)**  
  Monitors Notion for new leads marked as "New," fetches and cleans their website content, uses AI (GPT-3.5) to analyze their business, updates Notion with this analysis, and places an AI voice call through Vapi with a personalized pitch.

- **1.2 Call Result Processing and Notion Update (Part 2)**  
  Handles webhooks from Vapi after calls complete, fetches detailed call results, decides if AI summarization is needed, generates a concise AI summary if applicable, and updates the Notion lead record with call status, summary, notes, and recording links.

Supporting nodes provide instructions, setup guidance, and testing notes.

---

### 2. Block-by-Block Analysis

#### 2.1 Lead Intake and AI Qualification (Part 1)

**Overview:**  
This block detects new leads in a Notion database, fetches their website content, processes it via AI to generate a concise business analysis, updates the lead record in Notion, and initiates an AI voice call through Vapi with a personalized introduction.

**Nodes Involved:**  
- Notion Trigger2  
- Get New Leads from Notion2  
- Is Test Lead?2 (If node)  
- Mock Website Content2 (Code node)  
- Fetch Real Website2 (HTTP Request)  
- Clean HTML Content2 (Code node)  
- GPT-3.5 (Cheap Model)5 (LangChain AI node)  
- Generate Business Analysis3 (LangChain AI agent)  
- Update Notion with Analysis2 (Notion node)  
- Make Real Vapi Call2 (HTTP Request)  
- Sticky Notes: BookSlot Webhook2, BookSlot Webhook, BookSlot Webhook1, Goal, Trigger Setup, Vapi Setup, Testing, OpenRouter

**Node Details:**

- **Notion Trigger2**  
  - Type: Notion Trigger  
  - Role: Watches a Notion database for new lead records every minute.  
  - Config: Polls the configured leads database.  
  - Inputs/Outputs: Triggers flow downstream when a new record with Status = "New" is added.  
  - Edge Cases: Polling delay, connectivity issues, or missing database fields.

- **Get New Leads from Notion2**  
  - Type: Notion (Get All)  
  - Role: Retrieves all leads from Notion with status "New" to process.  
  - Config: Uses manual filter for Status = "New".  
  - Inputs: Trigger from Notion Trigger2.  
  - Outputs: List of lead records.  
  - Edge Cases: Large datasets could cause delays.

- **Is Test Lead?2**  
  - Type: If  
  - Role: Checks if lead’s property_name contains "TEST" to use mock data.  
  - Config: Expression to check substring "TEST".  
  - Inputs: Leads from Notion.  
  - Outputs: Routes lead to mock or real website content fetch.  
  - Edge Cases: Case sensitivity, missing property_name.

- **Mock Website Content2**  
  - Type: Code  
  - Role: Supplies static sample business description for test leads.  
  - Config: Returns a predefined text describing a generic business.  
  - Inputs: From "Is Test Lead?2" if true.  
  - Outputs: JSON with mock website text.  
  - Edge Cases: None, controlled environment.

- **Fetch Real Website2**  
  - Type: HTTP Request  
  - Role: Fetches HTML content from the lead's website URL.  
  - Config: Uses lead’s property_website_url.  
  - Inputs: From "Is Test Lead?2" if false.  
  - Outputs: Raw HTML content.  
  - Edge Cases: Timeout, invalid URLs, HTTP errors, redirects.

- **Clean HTML Content2**  
  - Type: Code  
  - Role: Cleans fetched HTML by removing scripts, styles, comments, and tags to extract plain text, then truncates text to 2000 characters.  
  - Inputs: Raw HTML from Fetch Real Website2 or mock content.  
  - Outputs: Cleaned plain text for AI input with metadata on size and token savings.  
  - Edge Cases: Very large HTML, unusual tags, non-UTF8 characters.

- **GPT-3.5 (Cheap Model)5**  
  - Type: LangChain AI Chat  
  - Role: Uses OpenRouter GPT-3.5 to process cleaned website text.  
  - Config: Model `openai/gpt-3.5-turbo`, no special options.  
  - Inputs: Cleaned plain text.  
  - Outputs: AI-generated text.  
  - Edge Cases: API rate limits, auth errors, response latency.

- **Generate Business Analysis3**  
  - Type: LangChain AI Agent  
  - Role: Extracts a concise business analysis: what the business does, main service, interesting detail, formatted precisely.  
  - Config: System prompt to produce a specific structured response ignoring HTML.  
  - Inputs: Clean website text from previous node.  
  - Outputs: Formatted business analysis string.  
  - Edge Cases: Misinterpretation by AI, incomplete data.

- **Update Notion with Analysis2**  
  - Type: Notion (Update Page)  
  - Role: Updates lead’s Notion record with the AI-generated business analysis in the "Business Analysis" rich_text property.  
  - Config: Uses lead's page ID from Notion.  
  - Inputs: AI analysis.  
  - Outputs: Confirmation of update.  
  - Edge Cases: Permission errors, Notion API limits.

- **Make Real Vapi Call2**  
  - Type: HTTP Request  
  - Role: Initiates an AI voice call via Vapi API using lead’s phone number and AI analysis in the first message.  
  - Config: POST to `https://api.vapi.ai/call` with assistantId, customer info, phoneNumberId, and assistantOverrides including personalized first message.  
  - Inputs: Updated lead data and analysis.  
  - Outputs: Call initiation response.  
  - Edge Cases: API authorization failure, invalid phone numbers, network issues.

- **Sticky Notes**  
  - Provide detailed setup instructions for Notion, Vapi, OpenRouter API keys, testing procedures, and workflow overview.  
  - Include links to resources and creator's channel.

---

#### 2.2 Call Result Processing and Notion Update (Part 2)

**Overview:**  
This block processes incoming webhooks from Vapi after an AI voice call ends, fetches detailed call data, determines if AI summarization is needed, generates a concise summary, and updates the lead record in Notion with call results including status, summary, notes, and call recording.

**Nodes Involved:**  
- Webhook2  
- Fetch Call Results2  
- Extract Call Fields2  
- Need AI Summary?2 (If node)  
- Generate AI Summary2 (LangChain AI agent)  
- Use Existing Summary2 (Code node)  
- Format Final Summary2 (Code node)  
- Update Call Results in Notion2  
- GPT-3.5 (Cheap Model)4 (LangChain AI Chat)  
- Sticky Notes: Goal Part 2, Webhook Setup, Fetch Setup, Update Notion

**Node Details:**

- **Webhook2**  
  - Type: Webhook  
  - Role: Receives call completion event from Vapi.  
  - Config: Unique webhook path URL for Vapi to POST call results.  
  - Inputs: External webhook request.  
  - Outputs: Passes call ID to next node.  
  - Edge Cases: Incorrect webhook setup, security exposure.

- **Fetch Call Results2**  
  - Type: HTTP Request  
  - Role: Retrieves detailed call information from Vapi API using call ID from webhook.  
  - Config: GET request to `https://api.vapi.ai/calls/{{callId}}` with bearer token authorization.  
  - Inputs: Call ID from webhook.  
  - Outputs: Full call data including customer info, duration, ended reason, summary, notes, and recording URL.  
  - Edge Cases: API key invalid, call ID missing or expired.

- **Extract Call Fields2**  
  - Type: Code  
  - Role: Parses call data, checks if call was answered, and prepares input for AI summary or skips if no answer.  
  - Config: Extracts endedReason, customer name, recording URL. Flags skip_ai=true if call not answered.  
  - Inputs: Call data JSON.  
  - Outputs: Object with summary input text or skip flag.  
  - Edge Cases: Missing fields, unexpected data structure.

- **Need AI Summary?2**  
  - Type: If  
  - Role: Branches workflow based on whether AI summary is needed (skip_ai flag).  
  - Inputs: Output from Extract Call Fields2.  
  - Outputs: Routes to Generate AI Summary2 or Use Existing Summary2.  
  - Edge Cases: Logic errors.

- **Generate AI Summary2**  
  - Type: LangChain AI Agent  
  - Role: Summarizes call in two concise sentences: what happened and next action.  
  - Config: System message instructs summary format.  
  - Inputs: summary_input text from Extract Call Fields2.  
  - Outputs: AI-generated summary.  
  - Edge Cases: API limits, ambiguous input.

- **Use Existing Summary2**  
  - Type: Code  
  - Role: Passes through existing summary and notes when AI summary is skipped.  
  - Inputs: Original summary, notes, recording, reason.  
  - Outputs: Same data structure forwarded.  
  - Edge Cases: None.

- **Format Final Summary2**  
  - Type: Code  
  - Role: Normalizes call reason into Notion status categories (Meeting Scheduled, Not Interested, No answer, Follow Up) and formats final JSON object for Notion update, including summary and recording URL.  
  - Inputs: AI or existing summary, call recording URL, raw reason string.  
  - Outputs: JSON object with summary, notes, recording, and mapped reason.  
  - Edge Cases: Unexpected call reasons.

- **Update Call Results in Notion2**  
  - Type: Notion (Update Page)  
  - Role: Updates the lead's Notion page with call results: status, summary, notes, and recording link.  
  - Config: Uses Notion page ID carried from previous steps.  
  - Inputs: Formatted final summary JSON.  
  - Outputs: Confirmation of update.  
  - Edge Cases: API permission errors, rate limits.

- **GPT-3.5 (Cheap Model)4**  
  - Type: LangChain AI Chat  
  - Role: Provides AI language model backend for Generate AI Summary2 node.  
  - Config: Model `openai/gpt-3.5-turbo`.  
  - Edge Cases: Same as other AI nodes.

- **Sticky Notes**  
  - Provide instructions for webhook setup, call result fetching, Notion update mapping, and workflow goals.

---

### 3. Summary Table

| Node Name                   | Node Type                          | Functional Role                                    | Input Node(s)                 | Output Node(s)                 | Sticky Note                                                                                                                                                       |
|-----------------------------|----------------------------------|--------------------------------------------------|------------------------------|-------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Notion Trigger2             | Notion Trigger                   | Detect new leads with status "New"                | -                            | Get New Leads from Notion2     |                                                                                                                                                                 |
| Get New Leads from Notion2  | Notion (Get All)                 | Fetch all new leads from Notion                    | Notion Trigger2              | Is Test Lead?2                 |                                                                                                                                                                 |
| Is Test Lead?2              | If                              | Check if lead is a test lead to route data source | Get New Leads from Notion2    | Mock Website Content2, Fetch Real Website2 |                                                                                                                                                                 |
| Mock Website Content2       | Code                            | Provide mock business description for test leads | Is Test Lead?2               | Clean HTML Content2            |                                                                                                                                                                 |
| Fetch Real Website2         | HTTP Request                    | Fetch real website HTML content                    | Is Test Lead?2               | Clean HTML Content2            |                                                                                                                                                                 |
| Clean HTML Content2         | Code                            | Clean and truncate HTML to plain text              | Mock Website Content2, Fetch Real Website2 | GPT-3.5 (Cheap Model)5, Generate Business Analysis3 |                                                                                                                                                                 |
| GPT-3.5 (Cheap Model)5      | LangChain AI Chat               | AI backend for business analysis generation        | Clean HTML Content2          | Generate Business Analysis3    |                                                                                                                                                                 |
| Generate Business Analysis3 | LangChain AI Agent              | Generate structured business analysis from text   | GPT-3.5 (Cheap Model)5       | Update Notion with Analysis2   |                                                                                                                                                                 |
| Update Notion with Analysis2| Notion (Update Page)            | Update lead record with AI business analysis       | Generate Business Analysis3  | Make Real Vapi Call2           |                                                                                                                                                                 |
| Make Real Vapi Call2        | HTTP Request                   | Initiate AI voice call via Vapi                     | Update Notion with Analysis2 | -                             | VAPI CALL SETUP - CRITICAL: Replace YOUR_VAPI_API_KEY, YOUR_VAPI_ASSISTANT_ID, YOUR_VAPI_PHONE_NUMBER_ID, [Your Company] name, and set webhook URL in Vapi assistant |
| Webhook2                   | Webhook                        | Receive call completion events from Vapi           | External                    | Fetch Call Results2            | WEBHOOK SETUP: Activate workflow, copy webhook URL, add to Vapi assistant server URL                                                                           |
| Fetch Call Results2         | HTTP Request                   | Retrieve detailed call data from Vapi API           | Webhook2                    | Extract Call Fields2           | FETCH CALL RESULTS: Use your Vapi API key in Authorization header                                                                                              |
| Extract Call Fields2        | Code                          | Parse call data, check if call answered, prepare AI input | Fetch Call Results2          | Need AI Summary?2              |                                                                                                                                                                 |
| Need AI Summary?2           | If                            | Decide if AI summary is needed                      | Extract Call Fields2         | Generate AI Summary2, Use Existing Summary2 |                                                                                                                                                                 |
| Generate AI Summary2        | LangChain AI Agent            | Generate concise AI summary of call                 | Need AI Summary?2            | Format Final Summary2          | OPENROUTER SETUP: Get API key from openrouter.ai and add to GPT-3.5 nodes                                                                                       |
| Use Existing Summary2       | Code                          | Pass through existing summary if AI skipped         | Need AI Summary?2            | Format Final Summary2          |                                                                                                                                                                 |
| Format Final Summary2       | Code                          | Normalize call reasons, format final data for Notion | Generate AI Summary2, Use Existing Summary2 | Update Call Results in Notion2 |                                                                                                                                                                 |
| Update Call Results in Notion2| Notion (Update Page)          | Update lead record with call summary and status     | Format Final Summary2        | -                             | UPDATE NOTION: Map Status, Call Summary, Call Recording, Call Notes properties accordingly                                                                     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Notion Trigger Node**  
   - Type: Notion Trigger  
   - Set to poll your leads database every minute.  
   - Ensure OAuth connection to your Notion workspace.  
   - Database must have properties: Name (title), Phone (phone_number), Website URL (url), Status (select), Business Analysis (rich_text).

2. **Add Notion Get All Node ("Get New Leads from Notion2")**  
   - Type: Notion (Get All)  
   - Configure to fetch all pages where Status = "New".  
   - Connect input from Notion Trigger.

3. **Add If Node ("Is Test Lead?2")**  
   - Type: If  
   - Condition: Check if lead’s property_name contains string "TEST".  
   - Connect input from Get New Leads node.

4. **Add Code Node for Mock Data ("Mock Website Content2")**  
   - Returns static sample text for testing.  
   - Connect to true output of If node.

5. **Add HTTP Request Node to Fetch Real Website ("Fetch Real Website2")**  
   - GET request to lead’s website URL property.  
   - Connect to false output of If node.

6. **Add Code Node to Clean HTML Content ("Clean HTML Content2")**  
   - Remove scripts, styles, comments, tags; truncate to 2000 chars.  
   - Connect inputs from Mock Website Content2 and Fetch Real Website2.

7. **Add LangChain AI Chat Node ("GPT-3.5 (Cheap Model)5")**  
   - Use model: `openai/gpt-3.5-turbo` via OpenRouter API.  
   - Provide API key credentials from openrouter.ai.  
   - Connect input from Clean HTML Content2.

8. **Add LangChain AI Agent Node ("Generate Business Analysis3")**  
   - System prompt instructs extraction: business description, service, interesting detail.  
   - Connect input from GPT-3.5 (Cheap Model)5.

9. **Add Notion Update Page Node ("Update Notion with Analysis2")**  
   - Update lead page's "Business Analysis" rich_text property with AI output.  
   - Use pageId from the lead record.  
   - Connect input from Generate Business Analysis3.

10. **Add HTTP Request Node to Make Vapi Call ("Make Real Vapi Call2")**  
    - POST to `https://api.vapi.ai/call` with JSON body including your Vapi assistantId, phoneNumberId, and customer data.  
    - Replace placeholders with your Vapi credentials and company name.  
    - Connect input from Update Notion with Analysis2.  
    - Add Authorization header with Bearer token (your Vapi API key).

11. **Add Webhook Node ("Webhook2")**  
    - Create a new webhook with unique path.  
    - Save and activate workflow to get URL.  
    - Configure this webhook URL in your Vapi assistant dashboard as the Server URL for call events.

12. **Add HTTP Request Node to Fetch Call Results ("Fetch Call Results2")**  
    - GET request to `https://api.vapi.ai/calls/{{callId}}` where callId comes from webhook payload.  
    - Use same Authorization Bearer token as above.  
    - Connect input from Webhook2.

13. **Add Code Node to Extract Call Fields ("Extract Call Fields2")**  
    - Parse call data to detect if answered or not, prepare summary input or skip.  
    - Connect input from Fetch Call Results2.

14. **Add If Node ("Need AI Summary?2")**  
    - Condition: Check if skip_ai flag is true or false.  
    - Connect input from Extract Call Fields2.

15. **Add LangChain AI Agent Node ("Generate AI Summary2")**  
    - Summarize call outcome in two sentences (what happened and next action).  
    - Connect input from true output of Need AI Summary?2.  
    - Use GPT-3.5 model with system message prompt as specified.

16. **Add Code Node ("Use Existing Summary2")**  
    - Pass through existing summary if AI summary is skipped.  
    - Connect input from false output of Need AI Summary?2.

17. **Add Code Node to Format Final Summary ("Format Final Summary2")**  
    - Normalize call reasons to Notion status values and prepare final JSON.  
    - Connect inputs from Generate AI Summary2 and Use Existing Summary2.

18. **Add Notion Update Page Node ("Update Call Results in Notion2")**  
    - Update lead record with call summary, notes, recording link, and status.  
    - Use pageId from original lead record.  
    - Connect input from Format Final Summary2.

19. **Configure Credentials:**  
    - OpenRouter API key for GPT-3.5 nodes: Add in n8n credentials.  
    - Notion OAuth credentials: Ensure access to leads database with write permissions.  
    - Vapi API key: Securely stored and used in HTTP Request Authorization headers.

20. **Add Sticky Notes:**  
    - Include setup instructions, links, and testing guidance as per original workflow for ease of maintenance.

---

### 5. General Notes & Resources

| Note Content                                                                                                                           | Context or Link                                                                                                           |
|----------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| Creator: Summer Chang - YouTube Channel for AI Booking Agent Setup Guide                                                                | https://www.youtube.com/channel/UCAdp-nOSH-jcrwXkLlUMyXQ                                                                   |
| Notion template for leads with required properties: Name, Phone, Website URL, Status, Business Analysis                                  | https://summerchangco.notion.site/websiteinbound?v=28e2d5cd4ef481a78864000c6a5459a7&source=copy_link                        |
| OpenRouter API key signup and pricing details                                                                                          | https://openrouter.ai                                                                                                       |
| Vapi account setup, assistant creation, phone number provisioning, API key use, and webhook URL configuration                           | https://vapi.ai                                                                                                            |
| Testing instructions recommend creating a test lead with "TEST" in the name to use mock website content and avoid real calls            | Included in sticky notes                                                                                                    |
| Recommended lead status property values for Notion: New, Meeting Scheduled, Follow Up, Not Interested, No answer                         | Used in classification logic in Format Final Summary2 node                                                                  |
| Important: Activate the webhook workflow (Part 2) first before starting the call initiation workflow (Part 1) to ensure call results are processed | Sticky notes specify this setup order                                                                                       |

---

This documentation enables understanding, reproduction, and modification of the automated AI lead qualification workflow integrating Notion and Vapi services, with detailed attention to node configurations, data flows, and error considerations.