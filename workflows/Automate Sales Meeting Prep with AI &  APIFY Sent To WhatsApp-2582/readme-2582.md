Automate Sales Meeting Prep with AI &  APIFY Sent To WhatsApp

https://n8nworkflows.xyz/workflows/automate-sales-meeting-prep-with-ai----apify-sent-to-whatsapp-2582


# Automate Sales Meeting Prep with AI &  APIFY Sent To WhatsApp

### 1. Workflow Overview

This workflow automates the preparation for upcoming sales meetings by compiling contextual information about meeting attendees from email history and LinkedIn activity, then sending a concise meeting prep notification via WhatsApp. It targets busy professionals who want to stay informed and ready for meetings with minimal manual effort.

The workflow is logically divided into these blocks:

- **1.1 Scheduled Trigger & Meeting Discovery**  
  Periodically triggers the workflow to find upcoming meetings within the next hour using Google Calendar.

- **1.2 Attendee Extraction & Research Orchestration**  
  Extracts attendee details (email and LinkedIn URL) from the meeting invite using AI; splits attendee processing into subworkflows for email and LinkedIn data retrieval.

- **1.3 Subworkflows for Email & LinkedIn Data Retrieval**  
  For each attendee: (a) fetches last email correspondence using Gmail, and (b) scrapes LinkedIn profile and recent activities via Apify web scraper.

- **1.4 AI Summarization & Message Generation**  
  Summarizes email correspondence and LinkedIn data with AI models and composes a brief, personalized meeting preparation message.

- **1.5 Notification Delivery via WhatsApp**  
  Sends the generated message to the user's WhatsApp Business account for timely pre-meeting alerts.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger & Meeting Discovery

- **Overview:**  
  This block triggers the workflow every hour and queries Google Calendar for any upcoming meetings starting within the next hour.

- **Nodes Involved:**  
  - Schedule Trigger  
  - Check For Upcoming Meetings  
  - Extract Attendee Information  

- **Node Details:**  
  - **Schedule Trigger**  
    - Type: Scheduled Trigger  
    - Configured to fire every hour.  
    - Output triggers the calendar lookup.  
    - Edge cases: Timezone misalignment could result in missed meetings.

  - **Check For Upcoming Meetings**  
    - Type: Google Calendar node  
    - Queries calendar for events starting between now and one hour ahead (using dynamic expressions with UTC time).  
    - Limits results to 1 event per trigger to control workflow load.  
    - Requires Google Calendar OAuth2 credentials.  
    - Failures could be due to credential expiration or API limits.

  - **Extract Attendee Information**  
    - Type: Langchain Information Extractor  
    - Uses AI to parse meeting invite fields (start time, summary, description, organizer, attendees) and extract attendee email and LinkedIn URLs.  
    - Schema expects an array of attendees excluding organizer, with name, email, and LinkedIn URL fields.  
    - Key expression uses JavaScript to format input text with meeting details.  
    - Failures may occur if invite data is incomplete or AI extraction yields empty results.

---

#### 2.2 Attendee Extraction & Research Orchestration

- **Overview:**  
  Converts extracted attendees into a list, sets routing flags for email and LinkedIn data retrieval workflows, and triggers subworkflows to gather detailed attendee information.

- **Nodes Involved:**  
  - Attendees to List  
  - Set Route Email  
  - Set Route Linkedin  
  - Execute Workflow Trigger (subworkflow executor)  
  - Router  
  - Has Email Address? (If node)  
  - Has LinkedIn URL? (If node)  
  - Merge  

- **Node Details:**  
  - **Attendees to List**  
    - Type: SplitOut  
    - Splits the array of attendees into individual items for separate processing.  
    - Input: output.attendees from extractor.

  - **Set Route Email / Set Route Linkedin**  
    - Type: Set Nodes  
    - Adds a `route` property set to "email" or "linkedin" to the attendee JSON, controlling which subworkflow branch to execute.  
    - Output routes the flow accordingly.

  - **Execute Workflow Trigger**  
    - Type: Execute Workflow Trigger  
    - Invokes the main workflow as a subworkflow for each attendee, passing route parameter to decide between email or LinkedIn data retrieval.  
    - Configured with "waitForSubWorkflow" to synchronize results.  
    - Edge cases: Subworkflow failures or timeouts can disrupt data aggregation.

  - **Router**  
    - Type: Switch node  
    - Routes data flow based on the `route` property to either email or LinkedIn processing paths.

  - **Has Email Address?**  
    - Type: If node  
    - Checks if attendee has an email address to fetch correspondence.  
    - If false, triggers an error handling node to set default message.

  - **Has LinkedIn URL?**  
    - Type: If node  
    - Checks if attendee has a LinkedIn URL to scrape profile.  
    - If false, triggers error handling node with default message.

  - **Merge**  
    - Type: Merge node  
    - Combines email and LinkedIn data branches back into a single dataset per attendee for final aggregation.

---

#### 2.3 Subworkflows for Email & LinkedIn Data Retrieval

- **Overview:**  
  Separate subflows fetch the last email correspondence and scrape LinkedIn profile plus recent activity for each attendee.

- **Nodes Involved:**  
  - Get Last Correspondence (Gmail)  
  - Get Message Contents (Gmail)  
  - Simplify Emails (Set)  
  - Correspondance Recap Agent (OpenAI LLM)  
  - Return Email Success / Error (Set)  
  - Set LinkedIn Cookie (Set)  
  - APIFY Web Scraper (HTTP Request)  
  - Is Scrape Successful? (If)  
  - Extract Profile Metadata (HTML)  
  - Get Sections (HTML)  
  - Get About Section (Set)  
  - Get Activity Section (Set)  
  - Extract Activities (HTML)  
  - Get Activity Details (HTML)  
  - Activities To List / Array (SplitOut / Aggregate)  
  - LinkedIn Summarizer Agent (OpenAI LLM)  
  - Return LinkedIn Success / Error (Set)

- **Node Details:**  
  - **Get Last Correspondence**  
    - Gmail node, fetches last email from attendee by filtering sender address.  
    - Requires Gmail OAuth2 credentials.  
    - Limits to 1 email for efficiency.  
    - Potential failures: no email found, Gmail API quota, auth errors.

  - **Get Message Contents**  
    - Gmail node, fetches full email content by message ID.  
    - Input from previous node.  
    - Outputs full email JSON.

  - **Simplify Emails**  
    - Set node, extracts key email fields (date, subject, text, from, to) for summarization.

  - **Correspondance Recap Agent**  
    - OpenAI LLM Chain, summarizes email content to highlight key discussion points relevant for meeting prep.  
    - Uses a prompt defined to recap succinctly.  
    - Requires OpenAI API credentials.  
    - Edge cases: API rate limits, malformed text input.

  - **Return Email Success / Error**  
    - Set nodes that prepare output JSON with email summary or default error message if no correspondence found.

  - **Set LinkedIn Cookie**  
    - Set node, injects attendee LinkedIn URL and user’s LinkedIn session cookie string (manually added) for Apify scraper authentication.

  - **APIFY Web Scraper**  
    - HTTP Request node calling Apify's LinkedIn scraper API with linkedIn profile URL and cookies.  
    - Configured with advanced JSON body including pageFunction to extract page HTML content and delay.  
    - Requires Apify API credential with proxy enabled.  
    - Failures: invalid cookie, scraping limits, network issues.

  - **Is Scrape Successful?**  
    - If node, checks if scraper returned a valid body; else triggers error handler.

  - **Extract Profile Metadata**  
    - HTML node extracts profile metadata such as name, tagline, location, number of connections/followers, and page sections.  
    - Uses CSS selectors for LinkedIn page structure.

  - **Get Sections / Get About Section / Get Activity Section / Extract Activities / Get Activity Details**  
    - HTML nodes that parse sections of the LinkedIn profile and recent activity feed to isolate relevant content.

  - **Activities To List / Activities To Array**  
    - SplitOut and Aggregate nodes to convert multiple activity entries into structured arrays.

  - **LinkedIn Summarizer Agent**  
    - OpenAI LLM Chain, summarizes the extracted LinkedIn profile and recent activity feed to highlight key info and talking points.  
    - Prompt emphasizes noteworthy achievements and recent posts.  
    - Same credential requirements and failure modes as other LLM nodes.

  - **Return LinkedIn Success / Error**  
    - Set nodes that finalize LinkedIn summary output or provide default message if scraping failed or no activities found.

---

#### 2.4 AI Summarization & Message Generation

- **Overview:**  
  Aggregates attendee summaries, then uses AI to compose a compact, informative meeting prep message highlighting meeting details and insights about attendees.

- **Nodes Involved:**  
  - Aggregate Attendees  
  - Attendee Research Agent (OpenAI LLM)  
  - WhatsApp Business Cloud  

- **Node Details:**  
  - **Aggregate Attendees**  
    - Aggregate node collects all attendee data (email and LinkedIn summaries) into a single JSON object for final processing.

  - **Attendee Research Agent**  
    - OpenAI LLM Chain node that composes the full meeting prep notification.  
    - Uses a complex prompt incorporating meeting date, link, description, and attendee summaries.  
    - Outputs a casual, SMS-style message with bullet points summarizing correspondence and LinkedIn insights.  
    - Requires OpenAI API credentials.  
    - Edge cases: long inputs may cause token limits; consider truncation or pagination.

  - **WhatsApp Business Cloud**  
    - Sends the generated message to a configured recipient phone number using WhatsApp Business API.  
    - Requires WhatsApp API credentials and configured phoneNumberId.  
    - Failures: invalid phone number, authentication errors, API limits.

---

#### 2.5 Supporting & Miscellaneous Nodes

- **Sticky Notes** scattered throughout provide documentation, instructions, and warnings such as:

  - Usage recommendations (e.g., personal calendars preferred)  
  - LinkedIn scraping cookie warning and legal considerations  
  - Links to n8n docs for nodes used  
  - Encouragement to customize and extend the workflow

- **Execute Workflow Node** used for iteration and orchestration between main workflow and subworkflows.

---

### 3. Summary Table

| Node Name                  | Node Type                               | Functional Role                               | Input Node(s)                     | Output Node(s)                       | Sticky Note                                                                                             |
|----------------------------|---------------------------------------|-----------------------------------------------|----------------------------------|------------------------------------|-------------------------------------------------------------------------------------------------------|
| Schedule Trigger           | Scheduled Trigger                     | Periodically trigger workflow every hour     |                                  | Check For Upcoming Meetings        | ## 1. Periodically Search For Upcoming Meetings [Read about the Scheduled Trigger](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.scheduletrigger) |
| Check For Upcoming Meetings| Google Calendar                      | Fetch upcoming meetings within next hour     | Schedule Trigger                 | Extract Attendee Information       |                                                                                                       |
| Extract Attendee Information| Information Extractor (Langchain)   | Extract attendee emails and LinkedIn URLs    | Check For Upcoming Meetings      | Attendees to List                  | ## 2. Extract Attendee Details From Invite [Learn more about the Information Extractor node](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.information-extractor/) |
| Attendees to List          | SplitOut                             | Split attendees array for individual processing| Extract Attendee Information     | Set Route Email, Set Route Linkedin|                                                                                                       |
| Set Route Email            | Set                                 | Add route="email" for email subworkflow      | Attendees to List                | Execute Workflow Trigger           |                                                                                                       |
| Set Route Linkedin         | Set                                 | Add route="linkedin" for LinkedIn subworkflow| Attendees to List                | Execute Workflow Trigger           |                                                                                                       |
| Execute Workflow Trigger   | Execute Workflow Trigger             | Invoke subworkflow per attendee               | Set Route Email, Set Route Linkedin| Router                        | ## 3. Fetch Recent Correspondance & LinkedIn Activity [Learn more about the Execute Workflow node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.executeworkflow) |
| Router                    | Switch                              | Route to email or LinkedIn branch             | Execute Workflow Trigger         | Has Email Address?, Has LinkedIn URL? |                                                                                                       |
| Has Email Address?         | If                                  | Check if attendee has email                    | Router (email route)             | Get Last Correspondence / Return Email Error1 |                                                                                                       |
| Has LinkedIn URL?          | If                                  | Check if attendee has LinkedIn URL             | Router (linkedin route)          | Set LinkedIn Cookie / Return LinkedIn Error1 |                                                                                                       |
| Get Last Correspondence    | Gmail                               | Fetch last email from attendee                 | Has Email Address?               | Has Emails?                       | ## 3.2: Fetch Last Email Correspondance [Learn more about Gmail node](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail)            |
| Has Emails?                | If                                  | Check if any emails found                       | Get Last Correspondence          | Get Message Contents / Return Email Error |                                                                                                       |
| Get Message Contents       | Gmail                               | Retrieve full email content                     | Has Emails?                     | Simplify Emails                   |                                                                                                       |
| Simplify Emails            | Set                                 | Extract key email fields for summarization    | Get Message Contents             | Correspondance Recap Agent         |                                                                                                       |
| Correspondance Recap Agent | ChainLLM (OpenAI)                   | Summarize email content for meeting prep      | Simplify Emails                 | Return Email Success               | ## 3.3: Summarize Correspondance For Attendee [Read more about the Basic LLM node](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.chainllm) |
| Return Email Success       | Set                                 | Provide summarized email output                 | Correspondance Recap Agent       | Merge                            |                                                                                                       |
| Return Email Error / Return Email Error1 | Set                   | Output default message if no email found       | Has Emails? / Has Email Address? | Merge                            |                                                                                                       |
| Set LinkedIn Cookie        | Set                                 | Set LinkedIn URL and inject user cookie       | Has LinkedIn URL?                | APIFY Web Scraper                 | ## 3.4 Scraping LinkedIn With [Apify.com](https://www.apify.com?fpr=414q6) [Learn more about Apify.com for Web Scraping](https://www.apify.com?fpr=414q6) <br> **Add your LinkedIn Cookie to the node!** |
| APIFY Web Scraper          | HTTP Request                        | Scrape LinkedIn profile using Apify API        | Set LinkedIn Cookie              | Is Scrape Successful?             |                                                                                                       |
| Is Scrape Successful?      | If                                  | Check if scraper returned valid content        | APIFY Web Scraper               | Extract Profile Metadata / Return LinkedIn Error |                                                                                                       |
| Extract Profile Metadata   | HTML                                | Extract LinkedIn profile metadata and sections| Is Scrape Successful?            | Sections To List                  |                                                                                                       |
| Sections To List           | SplitOut                            | Split profile sections into list                | Extract Profile Metadata         | Get Sections                     |                                                                                                       |
| Get Sections               | HTML                                | Extract title and content from each section    | Sections To List                 | Get About Section, Get Activity Section |                                                                                                       |
| Get About Section          | Set                                 | Extract "About" section HTML                     | Get Sections                    | Extract About                    |                                                                                                       |
| Get Activity Section       | Set                                 | Extract "Activity" section HTML                   | Get Sections                    | Extract Activities               |                                                                                                       |
| Extract About              | HTML                                | Extract clean "About" HTML content               | Get About Section               | Merge1                          |                                                                                                       |
| Extract Activities         | HTML                                | Extract individual activity items                 | Get Activity Section            | Get Activity Details             |                                                                                                       |
| Get Activity Details       | HTML                                | Extract details from activity HTML nodes          | Extract Activities              | Activities To List               |                                                                                                       |
| Activities To List         | SplitOut                            | Split individual activity entries                 | Get Activity Details            | Activities To Array              |                                                                                                       |
| Activities To Array        | Aggregate                           | Aggregate all activities into array               | Activities To List              | Merge1                          |                                                                                                       |
| Merge1                    | Merge                              | Combine About and Activity data                   | Extract About, Activities To Array | LinkedIn Summarizer Agent       |                                                                                                       |
| LinkedIn Summarizer Agent  | ChainLLM (OpenAI)                   | Summarize LinkedIn profile and recent activity  | Merge1                         | Return LinkedIn Success          | ## 3.6 Summarize LinkedIn For Attendee [Read more about the Basic LLM node](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.chainllm) |
| Return LinkedIn Success    | Set                                 | Output summarized LinkedIn info                    | LinkedIn Summarizer Agent      | Merge                          |                                                                                                       |
| Return LinkedIn Error / Return LinkedIn Error1 | Set                   | Provide default message if scraping fails          | Is Scrape Successful? / Has LinkedIn URL? | Merge                    |                                                                                                       |
| Merge                     | Merge                              | Combine email and LinkedIn summaries               | Return Email Success/Error, Return LinkedIn Success/Error | Merge Attendee with Summaries |                                                                                                       |
| Merge Attendee with Summaries | Set                              | Combine original attendee data with research summaries| Merge                          | Aggregate Attendees             |                                                                                                       |
| Aggregate Attendees        | Aggregate                          | Aggregate all attendee data into one JSON          | Merge Attendee with Summaries   | Attendee Research Agent         |                                                                                                       |
| Attendee Research Agent    | ChainLLM (OpenAI)                   | Generate final meeting prep notification message  | Aggregate Attendees             | WhatsApp Business Cloud         | ## 4. Generate Pre-Meeting Notification [Read more about the Basic LLM node](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.chainllm) |
| WhatsApp Business Cloud    | WhatsApp                           | Send notification message via WhatsApp             | Attendee Research Agent         |                                | ## 5. Send Notification via WhatsApp [Learn more about the WhatsApp node](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.whatsapp)                          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Scheduled Trigger node**  
   - Set interval to every 1 hour.

2. **Add Google Calendar node ("Check For Upcoming Meetings")**  
   - Operation: getAll  
   - Limit: 1  
   - Options: singleEvents = true, orderBy = startTime  
   - Set timeMin = current UTC time, timeMax = current UTC + 1 hour using expressions.  
   - Attach Google Calendar OAuth2 credentials.

3. **Add Langchain Information Extractor node ("Extract Attendee Information")**  
   - Input text template including start date, meeting URL, summary, description, organizer, and attendees emails.  
   - Define manual JSON schema for attendees with name, email, linkedin_url fields.  
   - Connect from Google Calendar node.

4. **Add SplitOut node ("Attendees to List")**  
   - Field to split: output.attendees array.

5. **Add two Set nodes ("Set Route Email" and "Set Route Linkedin")**  
   - One sets `route` property to "email"  
   - The other sets `route` property to "linkedin".  
   - Connect both from "Attendees to List".

6. **Add Execute Workflow Trigger node ("Execute Workflow Trigger")**  
   - Mode: each  
   - Wait for subworkflow: true  
   - Workflow: select current workflow by ID (to enable subworkflow calls with route parameter).

7. **Add Switch node ("Router")**  
   - Route on `route` property: output keys "email" and "linkedin".

8. **Email branch:**  
   - Add If node ("Has Email Address?")  
     - Condition: Check existence of `$json.email`.  
   - True branch: Add Gmail node ("Get Last Correspondence")  
     - Operation: getAll, limit 1, filter sender = `$json.email`.  
     - Credentials: Gmail OAuth2.  
   - Add If node ("Has Emails?")  
     - Check if emails found.  
   - True branch: Add Gmail node ("Get Message Contents")  
     - Operation: get, messageId from previous email.  
   - Add Set node ("Simplify Emails")  
     - Extract date, subject, text, from, to from email JSON.  
   - Add OpenAI ChainLLM node ("Correspondance Recap Agent")  
     - Model: GPT-4o-2024-08-06  
     - Prompt to summarize email content for meeting prep.  
     - Credentials: OpenAI API.  
   - Add Set node ("Return Email Success") to output summarized email.  
   - False branches of conditions set default error message nodes ("Return Email Error", "Return Email Error1").

9. **LinkedIn branch:**  
   - Add If node ("Has LinkedIn URL?")  
     - Checks existence of `$json.linkedin_url`.  
   - True branch: Set node ("Set LinkedIn Cookie")  
     - Set linkedin_profile_url from `$json.linkedin_url` and add your LinkedIn `li_at` cookie string.  
   - Add HTTP Request node ("APIFY Web Scraper")  
     - POST to Apify LinkedIn scraper API  
     - Pass profile URL and cookie in JSON body with required parameters (headless, proxy, etc.)  
     - Credentials: Apify API.  
   - Add If node ("Is Scrape Successful?")  
     - Check if scraper returned body content.  
   - True branch: HTML node ("Extract Profile Metadata")  
     - Extract name, tagline, location, connections, followers, and page sections via CSS selectors.  
   - Add SplitOut node ("Sections To List")  
     - Split `sections` array from metadata.  
   - HTML node ("Get Sections")  
     - Extract title and content from each section.  
   - Set nodes ("Get About Section" and "Get Activity Section")  
     - Filter sections for "About" and "Activity" titles.  
   - HTML nodes ("Extract About" and "Extract Activities")  
     - Extract clean HTML content from these sections.  
   - HTML node ("Get Activity Details")  
     - Extract details like header, url, content, and reaction counts from activities.  
   - SplitOut + Aggregate nodes ("Activities To List" and "Activities To Array")  
     - Convert activity entries into array format.  
   - Merge node ("Merge1") to combine About and Activity data.  
   - OpenAI ChainLLM node ("LinkedIn Summarizer Agent")  
     - Summarize LinkedIn profile and activity feed.  
     - Credentials: OpenAI API.  
   - Set node ("Return LinkedIn Success") to output summary.  
   - False branches set default error message nodes ("Return LinkedIn Error", "Return LinkedIn Error1").

10. **Merge email and LinkedIn data**  
    - Merge node ("Merge") combines both branches by position.  
    - Set node ("Merge Attendee with Summaries") combines attendee original data with summaries.

11. **Aggregate all attendees**  
    - Aggregate node ("Aggregate Attendees") collects all processed attendees into one array.

12. **Generate meeting prep message**  
    - OpenAI ChainLLM node ("Attendee Research Agent")  
    - Prompt includes meeting details and attendee summaries to compose a casual SMS-style notification.  
    - Credentials: OpenAI API.

13. **Send WhatsApp notification**  
    - WhatsApp Business Cloud node  
    - Set recipient phone number and phoneNumberId.  
    - Use text body from AI generated message.  
    - Credentials: WhatsApp Business API.

14. **Add Sticky Notes** throughout to document usage instructions, limitations, and warnings.

---

### 5. General Notes & Resources

| Note Content                                                                                                                         | Context or Link                                                                                                                       |
|--------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| This workflow is best suited for personal rather than team calendars due to complexity and LinkedIn scraping method.                | Workflow description                                                                                                                 |
| LinkedIn scraping requires manually adding your LinkedIn `li_at` cookie to the workflow for Apify scraper to impersonate your account.| Sticky Note and Set LinkedIn Cookie node                                                                                             |
| Consider alternative LinkedIn scraping methods that do not impersonate your account for production to comply with LinkedIn T&Cs.     | Sticky Note with caution about LinkedIn T&Cs                                                                                         |
| Scheduled trigger fires hourly; adjust frequency based on meeting density to optimize performance and API usage.                     | Sticky Note on Scheduled Trigger                                                                                                     |
| OpenAI GPT-4o-2024-08-06 model is used for all AI summarization steps; ensure your OpenAI account supports this model.               | All ChainLLM nodes configuration                                                                                                     |
| Apify scraper is used with proxy enabled and limits set to avoid excessive crawling and respect LinkedIn's load.                    | APIFY Web Scraper node parameters and Sticky Note                                                                                     |
| WhatsApp Business API is used for notification delivery; other messaging platforms can be substituted if preferred.                 | WhatsApp Business Cloud node and Sticky Note                                                                                         |
| Join n8n Discord and community forums for help with customization or troubleshooting.                                                 | Sticky Note with help links: [Discord](https://discord.com/invite/XPKeKXeB7d), [Forum](https://community.n8n.io/)                    |

---

This documentation enables advanced users and AI agents to fully understand, reproduce, or adapt the workflow, including setup, data flow, error handling, and external integrations.