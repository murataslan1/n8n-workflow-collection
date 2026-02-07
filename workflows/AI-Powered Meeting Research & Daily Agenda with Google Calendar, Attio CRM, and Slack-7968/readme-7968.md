AI-Powered Meeting Research & Daily Agenda with Google Calendar, Attio CRM, and Slack

https://n8nworkflows.xyz/workflows/ai-powered-meeting-research---daily-agenda-with-google-calendar--attio-crm--and-slack-7968


# AI-Powered Meeting Research & Daily Agenda with Google Calendar, Attio CRM, and Slack

### 1. Workflow Overview

This workflow is designed to automate the research and preparation process for daily meetings by integrating Google Calendar, Attio CRM, Slack, and AI-powered tools. Every weekday morning, it fetches that day’s external meetings, researches attendees and their companies via multiple data sources (CRM, Gmail history, web search, Apollo.io), compiles a concise briefing for each meeting, and delivers this briefing in Slack.

**Target Use Cases:**  
- Sales professionals needing quick pre-meeting context  
- Executives with busy schedules requiring efficient preparation  
- Customer success teams managing client contacts  
- Anyone seeking enhanced meeting readiness through automation

**Logical Blocks:**  
- **1.1 Trigger & Calendar Fetch:** Scheduled daily trigger and retrieval of today’s meetings from Google Calendar.  
- **1.2 Filtering & Branching:** Filters to keep only meetings with external attendees; conditional branching for no meetings.  
- **1.3 AI-Powered Attendee Research:** Splits meetings individually and invokes an AI agent to gather multi-source research on attendees and companies.  
- **1.4 CRM Contact Management:** Extracts attendees, checks if they exist in Attio CRM, creates new records as needed, and attaches meeting notes.  
- **1.5 Brief Compilation & Delivery:** Aggregates research outputs, formats a concise daily meeting brief using AI, and sends it to Slack.

---

### 2. Block-by-Block Analysis

#### 1.1 Trigger & Calendar Fetch  
**Overview:** Initiates the workflow every weekday at 6 AM and retrieves all calendar events for the day from Google Calendar.  
**Nodes Involved:**  
- Schedule Trigger  
- Get many events  

**Node Details:**  
- **Schedule Trigger**  
  - Type: scheduleTrigger  
  - Configuration: Cron expression set to run 6 AM Monday to Friday  
  - Inputs: None (start node)  
  - Outputs: Triggers "Get many events"  
  - Edge Cases: Timezone misconfigurations, missed triggers if n8n instance down  
  
- **Get many events**  
  - Type: Google Calendar node  
  - Configuration: Fetch all events between today and tomorrow from specific Google Calendar (harry@onetwogrowth.com)  
  - Inputs: Trigger from Schedule node  
  - Outputs: All calendar events to filtering node  
  - Edge Cases: OAuth token expiry, API rate limits, empty calendars  

---

#### 1.2 Filtering & Branching  
**Overview:** Filters to keep only meetings with attendees (external meetings) and branches workflow depending on whether any such meetings exist.  
**Nodes Involved:**  
- Filter External Meetings  
- Has External Meetings?  
- No Meetings Message  

**Node Details:**  
- **Filter External Meetings**  
  - Type: Filter node  
  - Configuration: Condition to check if event has an "attendees" array  
  - Inputs: All calendar events  
  - Outputs: Passes only events with attendees  
  - Edge Cases: Events without attendees, malformed event data  
  
- **Has External Meetings?**  
  - Type: If node  
  - Configuration: Checks if filtered events contain any records (exists operator on event ID)  
  - Inputs: Filtered events  
  - Outputs: Yes → processes meetings, No → sends Slack message  
  - Edge Cases: Empty data sets  
  
- **No Meetings Message**  
  - Type: Slack node  
  - Configuration: Sends a friendly message "Good morning! No external meetings scheduled for today. Enjoy your focus time!" to a configured Slack channel via OAuth2  
  - Inputs: Branch from "Has External Meetings?" if no meetings  
  - Outputs: None (end branch)  
  - Edge Cases: Slack auth errors, channel not found  

---

#### 1.3 AI-Powered Attendee Research  
**Overview:** Processes each meeting individually, uses an AI agent to research attendees and companies by pulling data from Gmail, CRM, web search, and Apollo.io.  
**Nodes Involved:**  
- Split Events for Individual Processing  
- AI Agent - Meeting Research  
- OpenRouter Chat Model  
- Search Gmail History  
- Web Search Tool  
- Search Attio CRM  
- Search Apollo Company Data  
- Clean Meeting Research Content  

**Node Details:**  
- **Split Events for Individual Processing**  
  - Type: splitOut  
  - Configuration: Splits array of meetings by "id" to process individually  
  - Inputs: Filtered meetings with attendees  
  - Outputs: Single meeting per item to AI Agent  
  - Edge Cases: Empty list, split errors  
  
- **AI Agent - Meeting Research**  
  - Type: Langchain Agent (AI assistant)  
  - Configuration: Prompt instructs AI to research meeting details, attendees, companies, past interactions, goals, and provide a comprehensive report  
  - Inputs: Single meeting data  
  - Outputs: Research results as markdown or JSON  
  - Expressions: Uses meeting summary, start/end time, filters out user's own email from attendees  
  - Edge Cases: AI model timeouts, incomplete data, API limits  
  - Integration: Calls multiple AI tools and APIs via ai_tool connections  
  
- **OpenRouter Chat Model**  
  - Type: Langchain language model node (OpenRouter)  
  - Configuration: Used as AI language model backend for "AI Agent - Meeting Research"  
  - Inputs: Prompt from AI Agent  
  - Outputs: AI-generated content  
  - Edge Cases: API key limits, latency  
  
- **Search Gmail History**  
  - Type: Gmail Tool node  
  - Configuration: Queries Gmail for past email interactions filtered by AI parameters  
  - Inputs: From AI Agent's dynamic query  
  - Outputs: Email thread data for research  
  - Edge Cases: Gmail OAuth expiry, query syntax errors  
  
- **Web Search Tool**  
  - Type: HTTP Request Tool (Anthropic API)  
  - Configuration: Sends web search queries to obtain latest public info on people or companies (max 5 uses)  
  - Inputs: From AI Agent's web search question  
  - Outputs: Search results  
  - Edge Cases: API failures, rate limits  
  
- **Search Attio CRM**  
  - Type: HTTP Request Tool  
  - Configuration: POST query to Attio CRM API to find person by email address  
  - Inputs: Email addresses extracted by AI Agent  
  - Outputs: CRM contact data  
  - Edge Cases: Auth errors, no matches  
  
- **Search Apollo Company Data**  
  - Type: HTTP Request Tool  
  - Configuration: POST to Apollo.io API for company information based on AI parameters  
  - Inputs: Company names from AI Agent  
  - Outputs: Company data (industry, size, revenue)  
  - Edge Cases: API key limits, missing data  
  
- **Clean Meeting Research Content**  
  - Type: Code node  
  - Configuration: Cleans AI-generated markdown content by removing quotes, trimming, normalizing line breaks, and reducing multiple newlines  
  - Inputs: AI Agent outputs  
  - Outputs: Cleaned text for CRM notes and brief generation  
  - Edge Cases: Empty or malformed text  

---

#### 1.4 CRM Contact Management  
**Overview:** Extracts external attendees, verifies their existence in Attio CRM, creates new contact records if missing, and attaches meeting prep notes.  
**Nodes Involved:**  
- Extract External Attendees  
- Split Attendees for CRM Check  
- Find Person in Attio  
- Person Exists in CRM?  
- Create Person Record  
- Merge CRM Results  
- Create Note on Person  

**Node Details:**  
- **Extract External Attendees**  
  - Type: Set node  
  - Configuration: Assigns only attendees excluding the user's own email to a new field "attendees" for processing  
  - Inputs: Output from "Clean Meeting Research Content" (paired with meeting data)  
  - Outputs: List of external attendees per meeting  
  - Edge Cases: No external attendees, empty arrays  
  
- **Split Attendees for CRM Check**  
  - Type: splitOut  
  - Configuration: Splits attendees array to process each attendee individually  
  - Inputs: "attendees" array  
  - Outputs: Single attendee objects to CRM lookup  
  - Edge Cases: Empty lists  
  
- **Find Person in Attio**  
  - Type: HTTP Request  
  - Configuration: POST request to Attio API searching for person by email, limit 1 result  
  - Inputs: Single attendee email  
  - Outputs: CRM person record or empty  
  - Edge Cases: API errors, no record found  
  
- **Person Exists in CRM?**  
  - Type: If node  
  - Configuration: Checks if the returned CRM data contains a record ID  
  - Inputs: Response from "Find Person in Attio"  
  - Outputs: Yes → merge results; No → create new record  
  - Edge Cases: API response format changes  
  
- **Create Person Record**  
  - Type: HTTP Request  
  - Configuration: POST to Attio API to create a new person record with attendee’s email  
  - Inputs: Attendee email from split  
  - Outputs: Newly created person record data  
  - Edge Cases: Duplicate record creation, validation errors  
  
- **Merge CRM Results**  
  - Type: Merge node  
  - Configuration: Merges results from existing person check and new person creation paths  
  - Inputs: From "Person Exists in CRM?" yes branch and "Create Person Record"  
  - Outputs: Unified person record data for note creation  
  - Edge Cases: Merge conflicts  
  
- **Create Note on Person**  
  - Type: HTTP Request  
  - Configuration: POST to Attio API notes endpoint to create a markdown note titled "Meeting Prep" with cleaned meeting research content, linked to person record  
  - Inputs: Person record ID, cleaned content from research  
  - Outputs: Confirmation of note creation  
  - Edge Cases: API failures, content encoding issues  

---

#### 1.5 Brief Compilation & Delivery  
**Overview:** Aggregates all meeting research, formats a concise, scannable daily meeting brief using AI, and sends it as a Slack message.  
**Nodes Involved:**  
- Aggregate Research Results  
- Format Daily Meeting Brief  
- OpenRouter Chat Model1  
- Send Daily Brief to Slack  

**Node Details:**  
- **Aggregate Research Results**  
  - Type: Aggregate node  
  - Configuration: Aggregates all cleaned research outputs by the "output" field into an array for formatting  
  - Inputs: Multiple cleaned research results from meetings  
  - Outputs: Aggregated array of meeting research summaries  
  - Edge Cases: Empty arrays  
  
- **Format Daily Meeting Brief**  
  - Type: Langchain Chain LLM node  
  - Configuration: Uses a detailed prompt to format each meeting briefing in a strict template including time, attendees, purpose, key context, action, and watch points; enforces concise and actionable output  
  - Inputs: Aggregated research array  
  - Outputs: Formatted text brief  
  - Edge Cases: AI model failures, prompt misinterpretation  
  
- **OpenRouter Chat Model1**  
  - Type: Langchain language model node (OpenRouter)  
  - Configuration: AI language model backend for formatting chain  
  - Inputs: Prompt from "Format Daily Meeting Brief"  
  - Outputs: Final formatted text  
  - Edge Cases: API limits  
  
- **Send Daily Brief to Slack**  
  - Type: Slack node  
  - Configuration: Sends the formatted daily brief to the configured Slack channel via OAuth2  
  - Inputs: Formatted text from AI chain  
  - Outputs: None (workflow end)  
  - Edge Cases: Slack API errors, channel misconfiguration  

---

### 3. Summary Table

| Node Name                      | Node Type                                | Functional Role                     | Input Node(s)                  | Output Node(s)                           | Sticky Note                                                                                 |
|-------------------------------|-----------------------------------------|-----------------------------------|-------------------------------|-----------------------------------------|---------------------------------------------------------------------------------------------|
| Sticky Note                   | stickyNote                              | Overview and documentation         | None                          | None                                    | ## Research meeting attendees and prepare daily agenda in Slack                            |
| Schedule Trigger               | scheduleTrigger                        | Trigger daily at 6 AM weekdays    | None                          | Get many events                         | Runs Monday-Friday at 6 AM                                                                  |
| Sticky Note1                  | stickyNote                              | Step 1 description                | None                          | None                                    | ### Step 1: Calendar Integration                                                           |
| Get many events               | googleCalendar                         | Fetch today's Google Calendar events | Schedule Trigger             | Filter External Meetings                |                                                                                             |
| Filter External Meetings       | filter                                  | Keep only events with attendees  | Get many events               | Has External Meetings?                   |                                                                                             |
| Has External Meetings?         | if                                      | Branch if meetings exist          | Filter External Meetings      | Split Events for Individual Processing / No Meetings Message |                                                                                             |
| No Meetings Message            | slack                                   | Notify no meetings today          | Has External Meetings?        | None                                    |                                                                                             |
| Sticky Note2                  | stickyNote                              | Step 2 description                | None                          | None                                    | ### Step 2: AI Research                                                                    |
| Split Events for Individual Processing | splitOut                            | Split meetings for individual AI research | Has External Meetings?        | AI Agent - Meeting Research             |                                                                                             |
| AI Agent - Meeting Research    | langchain.agent                        | AI research on meeting and attendees | Split Events for Individual Processing | Clean Meeting Research Content           |                                                                                             |
| OpenRouter Chat Model          | langchain.lmChatOpenRouter              | AI language model backend         | AI Agent - Meeting Research   | AI Agent - Meeting Research             |                                                                                             |
| Search Gmail History           | gmailTool                              | Search Gmail history for attendees | AI Agent - Meeting Research   | AI Agent - Meeting Research             |                                                                                             |
| Web Search Tool               | httpRequestTool                        | Web search for recent info        | AI Agent - Meeting Research   | AI Agent - Meeting Research             |                                                                                             |
| Search Attio CRM              | httpRequestTool                        | Search CRM for contact info       | AI Agent - Meeting Research   | AI Agent - Meeting Research             |                                                                                             |
| Search Apollo Company Data     | httpRequestTool                        | Search company data via Apollo.io | AI Agent - Meeting Research   | AI Agent - Meeting Research             |                                                                                             |
| Clean Meeting Research Content | code                                   | Clean AI-generated research text  | AI Agent - Meeting Research   | Extract External Attendees / Aggregate Research Results |                                                                                             |
| Sticky Note3                  | stickyNote                              | Step 3 description                | None                          | None                                    | ### Step 3: CRM Integration                                                                |
| Extract External Attendees     | set                                    | Extract only external attendees   | Clean Meeting Research Content | Split Attendees for CRM Check            |                                                                                             |
| Split Attendees for CRM Check  | splitOut                              | Split attendees for CRM lookup    | Extract External Attendees    | Find Person in Attio                    |                                                                                             |
| Find Person in Attio           | httpRequest                           | Query Attio CRM for person by email | Split Attendees for CRM Check | Person Exists in CRM?                    |                                                                                             |
| Person Exists in CRM?          | if                                      | Check if person exists in CRM     | Find Person in Attio          | Merge CRM Results / Create Person Record |                                                                                             |
| Create Person Record           | httpRequest                           | Create new person record in CRM   | Person Exists in CRM?         | Merge CRM Results                       |                                                                                             |
| Merge CRM Results             | merge                                  | Merge existing/new CRM person data | Person Exists in CRM? / Create Person Record | Create Note on Person                   |                                                                                             |
| Create Note on Person          | httpRequest                           | Create meeting prep note on CRM contact | Merge CRM Results            | None                                    |                                                                                             |
| Sticky Note4                  | stickyNote                              | Step 4 description                | None                          | None                                    | ### Step 4: Brief Generation & Delivery                                                   |
| Aggregate Research Results     | aggregate                              | Aggregate research outputs        | Clean Meeting Research Content | Format Daily Meeting Brief               |                                                                                             |
| Format Daily Meeting Brief     | langchain.chainLlm                    | Format meeting briefs             | Aggregate Research Results    | Send Daily Brief to Slack                |                                                                                             |
| OpenRouter Chat Model1         | langchain.lmChatOpenRouter              | AI model for formatting           | Format Daily Meeting Brief    | Format Daily Meeting Brief               |                                                                                             |
| Send Daily Brief to Slack      | slack                                   | Send formatted meeting brief     | Format Daily Meeting Brief    | None                                    |                                                                                             |
| Get many events in Google Calendar | googleCalendarTool                    | (Unused / AI tool) Fetch events   | None                          | AI Agent - Meeting Research             |                                                                                             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node:**  
   - Type: scheduleTrigger  
   - Set Cron to `0 6 * * 1-5` (6 AM Monday-Friday)  
   - Connect output to "Get many events" node.

2. **Create Google Calendar Node ("Get many events"):**  
   - Type: googleCalendar  
   - Operation: getAll events  
   - Set `timeMin` to today, `timeMax` to tomorrow (to fetch today's meetings)  
   - Select Google Calendar account (OAuth2 credential required)  
   - Connect output to "Filter External Meetings".

3. **Create Filter Node ("Filter External Meetings"):**  
   - Condition: Check if `attendees` array exists on event  
   - Pass only events with attendees  
   - Connect output to "Has External Meetings?" node.

4. **Create If Node ("Has External Meetings?"):**  
   - Condition: Check if any events exist by verifying event ID exists  
   - On TRUE, connect to "Split Events for Individual Processing".  
   - On FALSE, connect to "No Meetings Message".

5. **Create Slack Node ("No Meetings Message"):**  
   - Text: "Good morning! No external meetings scheduled for today. Enjoy your focus time!"  
   - Select Slack OAuth2 credential and target channel  
   - This ends the no meetings branch.

6. **Create SplitOut Node ("Split Events for Individual Processing"):**  
   - Field to split: `id` (split each meeting event)  
   - Connect output to "AI Agent - Meeting Research".

7. **Create Langchain Agent Node ("AI Agent - Meeting Research"):**  
   - Set system message: Expert meeting preparation assistant with access to CRM, email, calendar, and company research tools  
   - Set prompt with meeting details and tasks: research attendees, company, past interactions, goals, key talking points  
   - Connect AI tool outputs to the following helper nodes:  
     - OpenRouter Chat Model (AI language model backend)  
     - Search Gmail History (Gmail OAuth2 credential)  
     - Web Search Tool (Anthropic API credential)  
     - Search Attio CRM (HTTP Bearer Auth for Attio)  
     - Search Apollo Company Data (HTTP Header Auth for Apollo)  
   - Connect main output to "Clean Meeting Research Content".

8. **Create OpenRouter Chat Model Node:**  
   - Use OpenRouter API key credential  
   - Connect to AI Agent node input and receive AI-generated text output.

9. **Create Gmail Tool Node ("Search Gmail History"):**  
   - Connect AI Agent dynamic query inputs  
   - Use Gmail OAuth2 credential  
   - Output to AI Agent node.

10. **Create HTTP Request Tool Nodes for Web Search, Attio CRM, and Apollo Company Data:**  
    - Configure each with respective API endpoints, method POST, appropriate authorization headers  
    - Connect AI Agent node inputs and outputs accordingly.

11. **Create Code Node ("Clean Meeting Research Content"):**  
    - JavaScript to clean markdown text (remove quotes, normalize line breaks, trim)  
    - Input: AI Agent output  
    - Output: Cleaned text  
    - Connect outputs to "Extract External Attendees" and "Aggregate Research Results".

12. **Create Set Node ("Extract External Attendees"):**  
    - Create an "attendees" array excluding the user's own email  
    - Input: Clean Meeting Research Content output  
    - Output: Connect to "Split Attendees for CRM Check".

13. **Create SplitOut Node ("Split Attendees for CRM Check"):**  
    - Split the "attendees" array to process each attendee individually  
    - Output: Connect to "Find Person in Attio".

14. **Create HTTP Request Node ("Find Person in Attio"):**  
    - POST to Attio API people query endpoint to find person by email  
    - Use Bearer Auth credential for Attio  
    - Output: Connect to "Person Exists in CRM?".

15. **Create If Node ("Person Exists in CRM?"):**  
    - Check if returned data contains a person record ID  
    - TRUE: Connect to "Merge CRM Results" (Input 1)  
    - FALSE: Connect to "Create Person Record".

16. **Create HTTP Request Node ("Create Person Record"):**  
    - POST to Attio API to create a new person record with attendee email  
    - Use Bearer Auth credential  
    - Output: Connect to "Merge CRM Results" (Input 2).

17. **Create Merge Node ("Merge CRM Results"):**  
    - Merge outputs from existing and newly created person records  
    - Output: Connect to "Create Note on Person".

18. **Create HTTP Request Node ("Create Note on Person"):**  
    - POST to Attio API notes endpoint to add a "Meeting Prep" note  
    - Use cleaned meeting research content as markdown note content  
    - Use Bearer Auth credential  
    - This ends CRM contact update per attendee.

19. **Create Aggregate Node ("Aggregate Research Results"):**  
    - Aggregate all cleaned meeting research content into a single array  
    - Input: Clean Meeting Research Content output  
    - Output: Connect to "Format Daily Meeting Brief".

20. **Create Langchain Chain LLM Node ("Format Daily Meeting Brief"):**  
    - Prompt: Format daily meetings brief with strict template focusing on actionable intelligence, concise, no intros/outros  
    - Input: Aggregated array of meeting research  
    - Output: Formatted text  
    - Connect to OpenRouter Chat Model1.

21. **Create OpenRouter Chat Model Node ("OpenRouter Chat Model1"):**  
    - Use OpenRouter API key  
    - Input: From "Format Daily Meeting Brief"  
    - Output: Connect to "Send Daily Brief to Slack".

22. **Create Slack Node ("Send Daily Brief to Slack"):**  
    - Send formatted meeting brief text to configured Slack channel with OAuth2  
    - This ends the workflow.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                | Context or Link                                                                                             |
|---------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| This workflow automates meeting preparation by researching attendees and companies, compiling a daily briefing, and delivering it in Slack. | Overview and usage instructions in initial sticky note within workflow.                                     |
| Requires multiple API credentials: Google Calendar OAuth2, Slack OAuth2, Attio API with Bearer token, Apollo.io API, Gmail OAuth2, Anthropic API, OpenRouter API. | Credential setup prerequisites for smooth operation.                                                       |
| Slack messages are sent to a predefined channel; adjust Slack node's channelId parameter to target your preferred destination.              | Customization note from sticky note content.                                                               |
| For advanced AI research, the workflow integrates multi-source data (web search, email history, CRM, company database) via Langchain agents. | Enables rich context generation for meeting preparation.                                                   |
| Apollo.io and Attio CRM integrations are optional and can be removed or replaced according to user needs.                                   | Customization flexibility mentioned in workflow description.                                              |
| The workflow runs only on weekdays to avoid unnecessary processing on weekends.                                                             | Schedule Trigger cron expression configured accordingly.                                                   |
| For more detailed configuration or troubleshooting, refer to n8n official documentation on nodes used: Google Calendar, Slack, HTTP Request, and Langchain integration. | General resource for node configuration and error handling.                                                |

---

**Disclaimer:** The text provided is solely derived from an automated workflow created with n8n, a workflow automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.