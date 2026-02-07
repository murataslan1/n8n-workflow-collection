Automate Microsoft Teams Meeting Analysis with GPT-4.1, Outlook & Mem.ai

https://n8nworkflows.xyz/workflows/automate-microsoft-teams-meeting-analysis-with-gpt-4-1--outlook---mem-ai-3757


# Automate Microsoft Teams Meeting Analysis with GPT-4.1, Outlook & Mem.ai

### 1. Workflow Overview

This n8n workflow automates the end-to-end process of analyzing Microsoft Teams meetings by leveraging Microsoft Graph API, AI-powered summarization via GPT-4.1, data storage in Postgres, and knowledge base indexing through Mem.ai. It further supports drafting personalized follow-up emails via Microsoft Outlook integration.

**Target Use Cases:**
- Automated retrieval and analysis of Teams meeting recordings, chats, and transcripts.
- Extraction of actionable insights: key points, decisions, action items, and questions.
- Dynamic creation and update of a knowledge base of meeting content.
- Drafting and optionally sending personalized follow-up emails to meeting participants.
- Visualization and interaction through a web app frontend for browsing meeting summaries.

**Logical Blocks:**

- **1.1 Trigger and Initialization**: Scheduling periodic triggers and form submission webhooks to initiate the data retrieval and analysis process.
- **1.2 Meetings Retrieval & Filtering**: Downloading call records, online meeting details, deduplication, and filtering to isolate relevant meetings and transcripts.
- **1.3 Transcript Retrieval & Preparation**: Fetching transcripts from OneDrive/SharePoint, splitting and setting transcription data with subjects.
- **1.4 AI Analysis & Summarization**: Employing OpenAI GPT-4.1 chat model (or LangChain agents) for summarizing meeting content and drafting follow-up emails.
- **1.5 Post-Processing & Storage**: Saving analyzed data into Postgres and sending notifications.
- **1.6 Web App & Response Handling**: Handling incoming HTTP/web form requests, retrieving meeting metadata from the database, and responding with HTML content.
- **1.7 Knowledge Base Indexing & Follow-Up**: Uploading meeting insights to Mem.ai and drafting/sending follow-up emails via Outlook.
- **1.8 Utility, Control & Error Handling**: Includes filtering nodes, switches, error continuation, and control nodes to manage flow logic and failures.

---

### 2. Block-by-Block Analysis

#### 1.1 Trigger and Initialization

- **Overview:**  
  This block initializes the workflow using time-based and form submission triggers to periodically poll for new meeting transcripts or handle on-demand user queries.

- **Nodes Involved:**  
  - Schedule Trigger  
  - On form submission  

- **Node Details:**  
  - **Schedule Trigger**  
    - n8n native node, triggers workflow every 5 minutes to poll new transcripts.  
    - No special parameters specified in the JSON (default interval).  
    - Output connected to "Merge1" node for merging with other data.  
    - Potential failure: connectivity issues or misconfigured schedule permissions.

  - **On form submission**  
    - n8n Form Trigger node to catch webhook form submissions.  
    - Webhook ID: `2c1a1fa3-ab2f-41d1-849b-aa96f8e98519`.  
    - Passes data for on-demand workflows, such as user-driven input.  
    - Outputs to Code2 for further data processing.  
    - Edge: missing or malformed form payloads can cause errors.

---

#### 1.2 Meetings Retrieval & Filtering

- **Overview:**  
  Retrieves meeting call records through Microsoft Graph API, filters and deduplicates meetings, retrieves detailed online meeting info, and filters for relevant join URLs.

- **Nodes Involved:**  
  - Set Time Range  
  - Get Call Records  
  - Code1  
  - Filter for Join Url1  
  - Get Online Meeting Details1  
  - Split Out Meetings1  
  - Remove Duplicates  
  - Sort1  
  - Check if Processed  

- **Node Details:**  
  - **Set Time Range**  
    - Sets the time range (e.g., last X minutes) for API queries.  
    - No explicit parameters shown, should be configured to specify polling window.  
    - Connected to Get Call Records to parameterize retrieval.

  - **Get Call Records**  
    - HTTP Request node invoking Microsoft Graph API to list Teams call/meeting records.  
    - Requires OAuth2 credentials configured with Microsoft Graph scopes.  
    - Output feeds into a custom JavaScript node (Code1).

  - **Code1**  
    - JavaScript node to parse/filter call records, possibly extracting meeting IDs or metadata.  
    - Outputs filtered meetings to "Filter for Join Url1."

  - **Filter for Join Url1**  
    - Filters to keep only meetings with valid join URLs (meeting links).  
    - Ensures downstream processing is on meetings that can be accessed.

  - **Get Online Meeting Details1**  
    - HTTP node to get detailed metadata per meeting using Graph API.  
    - Configured with OAuth2 Microsoft Graph credentials.  
    - Outputs split into individual meeting entities (Split Out Meetings1).

  - **Split Out Meetings1**  
    - Splits meeting list into individual items for per-record processing.

  - **Remove Duplicates**  
    - Removes duplicate meeting entries to prevent redundant processing.

  - **Sort1**  
    - Sorts meetings, likely by date or some priority, preparing for filtering.

  - **Check if Processed**  
    - Postgres node querying the database to check if the meeting's transcript was already processed.  
    - Outputs two branches: existing records and new items.

  - **Filter No Items**  
    - Filters new meetings that have no prior processing record.

Potential failures: API rate limiting, invalid OAuth tokens, database connection issues, missing join URLs.

---

#### 1.3 Transcript Retrieval & Preparation

- **Overview:**  
  Retrieves associated transcripts for meetings, splits out transcriptions, fetches transcript content, and prepares structured data for AI analysis.

- **Nodes Involved:**  
  - Get Items (Code)  
  - Keep Matches (Merge)  
  - Get Transcript Data (HTTP Request)  
  - Split Out Transcriptions  
  - Get Transcript / Get Transcript1 (HTTP Requests)  
  - Set Transcription & Subject / Set Transcription & Subject1 / Set Transcription & Subject2  
  - Merge  

- **Node Details:**  
  - **Get Items**  
    - Code node to filter or transform meeting items potentially after filtering.  
    - Outputs to Keep Matches node.

  - **Keep Matches**  
    - Merge node combining filtered meeting items with transcript data.

  - **Get Transcript Data**  
    - HTTP Request node retrieving transcript file metadata from OneDrive/SharePoint (Microsoft Graph Files API).  
    - Connected with "Split Out Transcriptions" to handle multiple transcripts per meeting.  
    - On error, proceeds without failure (`onError: continueErrorOutput`).

  - **Split Out Transcriptions**  
    - Splits transcript metadata to individual items.

  - **Get Transcript / Get Transcript1**  
    - Fetches actual transcript content (usually JSON or text) from URLs.

  - **Set Transcription & Subject** (and variants 1 & 2)  
    - Set nodes formatting and storing transcription text and subject (meeting title).  
    - Outputs feed into "Merge" node.

  - **Merge**  
    - Combines different data streams (transcriptions, subject, metadata) into a single item for processing.

Failures could include network timeouts retrieving transcript files, missing transcripts, inconsistent transcript formats.

---

#### 1.4 AI Analysis & Summarization

- **Overview:**  
  Applies OpenAI GPT-4 based chat models and LangChain agents to generate summary content, key points, and draft follow-up emails from transcripts.

- **Nodes Involved:**  
  - OpenAI Chat Model  
  - OpenAI Chat Model1  
  - AI Agent Create Summary  
  - AI Agent Draft Follow Up  

- **Node Details:**  
  - **OpenAI Chat Model & OpenAI Chat Model1**  
    - These nodes integrate GPT-4.1 models for chat completions.  
    - Configured with OpenAI API credentials.  
    - Serve as language model cores feeding LangChain agents.

  - **AI Agent Create Summary**  
    - LangChain agent node configured to analyze meeting transcript content and create detailed summaries, capturing decisions, actions, questions, themes.

  - **AI Agent Draft Follow Up**  
    - LangChain agent specialized in drafting personalized follow-up emails including meeting summary, decisions, and action items.  
    - Outputs structured JSON for email content.

Possible failure modes: API request limitations, model output inconsistencies, prompt engineering errors.

---

#### 1.5 Post-Processing & Storage

- **Overview:**  
  Stores the AI-processed meeting analysis results and metadata in Postgres and sends notification emails.

- **Nodes Involved:**  
  - Set JSON  
  - Save Data  
  - Email HTML  
  - Summary HTML  
  - End Analysis Notification  

- **Node Details:**  
  - **Set JSON**  
    - Prepares JSON structures from AI agent outputs for HTML rendering.

  - **Save Data**  
    - Postgres node inserting/updating meeting summary data into the Postgres database.

  - **Email HTML** and **Summary HTML**  
    - Convert JSON data into formatted HTML for emails and web display.

  - **End Analysis Notification**  
    - Microsoft Outlook node sending notification emails indicating analysis completion.  
    - Requires Outlook OAuth2 credentials.

Failures may occur due to database connection errors, malformed SQL queries, or email sending errors (SMTP or OAuth).

---

#### 1.6 Web App & Response Handling

- **Overview:**  
  Handles HTTP requests coming from the web app interface to retrieve meeting data and serve HTML content.

- **Nodes Involved:**  
  - Web Page (Webhook)  
  - Get Meeting Row1 (Postgres)  
  - Respond With WebApp HTML  
  - Respond to Webhook1  

- **Node Details:**  
  - **Web Page**  
    - Webhook node receiving GET/POST requests to query meeting details dynamically.  
    - Passing URL parameters or form data to the workflow.

  - **Get Meeting Row1**  
    - Postgres query node retrieving stored meeting data based on identifiers passed from the webhook.

  - **Respond With WebApp HTML** and **Respond to Webhook1**  
    - Respond nodes sending back formatted HTML to the client for display.

Failure points: malformed requests, DB query failures, network timeouts.

---

#### 1.7 Knowledge Base Indexing & Follow-Up

- **Overview:**  
  Uploads extracted and processed meeting content into Mem.ai knowledge base and drafts follow-up emails sent via Outlook.

- **Nodes Involved:**  
  - Switch  
  - Mem Note (HTTP Request)  
  - AI Agent Draft Follow Up  
  - Set Email JSON  
  - Send Follow Up  
  - Respond With Code 200  

- **Node Details:**  
  - **Switch**  
    - Conditional node directing output either to Mem Note or AI Agent Draft Follow Up depending on evaluation logic.

  - **Mem Note**  
    - HTTP Request uploading structured meeting data to Mem.ai via its API.

  - **AI Agent Draft Follow Up**  
    - As described prior, drafts emails.

  - **Set Email JSON**  
    - Formats the draft email data.

  - **Send Follow Up**  
    - Microsoft Outlook node to send follow-up emails.  
    - May operate under human-in-the-loop (manual send possible).  
    - Has a webhook ID to allow external triggers.

  - **Respond With Code 200**  
    - Confirms webhook reception and successful follow-up dispatch.

Edge cases: API failures on Mem.ai, email send errors, missing or incorrect email addresses.

---

#### 1.8 Utility, Control & Error Handling

- **Overview:**  
  Miscellaneous nodes providing logic control, batch processing, merging results, error continuation, and auxiliary data formatting.

- **Nodes Involved:**  
  - Merge  
  - Merge1  
  - Loop Over Items (SplitInBatches)  
  - Switch (Logic control)  
  - Filter No Items  
  - Filter for Join Url1  
  - Remove Duplicates  
  - Sort1  
  - If2  
  - Code2  
  - Markdown  
  - Sticky Notes (various)  

- **Node Details:**  
  - **Merge, Merge1**: Combine multiple input streams.  
  - **Loop Over Items**: Handles batching and iterative AI processing.  
  - **Switch**: Route between different processing paths.  
  - **Filter Nodes**: Enable conditional filtering of data items.  
  - **If2**: Conditional branching based on profile or meeting data.  
  - **Code Nodes**: Custom JavaScript for data transformation.  
  - **Markdown**: Format text into Markdown, facilitates rich text rendering.  
  - **Sticky Notes**: Comments and visual annotations for maintainers.

Failures or edge cases here include misconfigured logic leading to misrouting, infinite loops, or dropped data.

---

### 3. Summary Table

| Node Name                | Node Type                        | Functional Role                           | Input Node(s)                         | Output Node(s)                     | Sticky Note             |
|--------------------------|---------------------------------|-----------------------------------------|-------------------------------------|----------------------------------|-------------------------|
| Set Time Range           | Set                             | Defines time window for meeting queries | If2                                | Get Call Records                  | Set time range in minutes|
| Schedule Trigger         | Schedule Trigger                | Periodic trigger every 5 minutes         | -                                  | Merge1                           | Poll for new transcripts every 5 minutes |
| Check if Processed       | Postgres                       | Checks if meeting transcript processed   | Sort1                              | Filter No Items, Keep Matches    |                         |
| Get Items                | Code                           | Processes meeting items                   | Filter No Items                    | Keep Matches                    |                         |
| Filter No Items          | Filter                         | Filters meetings with no prior processing| Check if Processed                | Get Items                      |                         |
| Keep Matches             | Merge                          | Combines filtered meeting items & transcripts | Get Items                        | Get Transcript Data             |                         |
| OpenAI Chat Model        | LangChain GPT-4 chat model     | Underlying language model for summarization | AI Agent Create Summary          | AI Agent Create Summary (LM Input) |                         |
| Mem Note                 | HTTP Request                   | Uploads meeting data to Mem.ai            | Switch                            | Respond to Webhook1             |                         |
| Set JSON                 | Set                            | Prepares JSON data for HTML generation     | AI Agent Create Summary          | Email HTML, Summary HTML        |                         |
| Get Transcript Data      | HTTP Request                   | Retrieves transcript metadata and files    | Keep Matches                    | Split Out Transcriptions, Search OneDrive for Meeting |                         |
| Split Out Transcriptions | Split Out                      | Splits transcript metadata into items       | Get Transcript Data              | Get Transcript                 |                         |
| Get Transcript           | HTTP Request                   | Gets actual transcript content              | Split Out Transcriptions         | Set Transcription & Subject    |                         |
| Save Data                | Postgres                      | Stores meeting summaries and metadata        | Summary HTML                    | Loop Over Items                |                         |
| Email HTML               | HTML                          | Generates HTML email content from JSON       | Set JSON                       | End Analysis Notification     |                         |
| Summary HTML             | HTML                          | Generates HTML summary content                | Set JSON                       | Save Data                     |                         |
| Web Page                 | Webhook                       | Receives web app requests for meeting data    | -                              | Get Meeting Row1              |                         |
| Next Action              | Webhook                       | Receives webhooks for meeting next steps    | -                              | Get Meeting Row               |                         |
| Switch                   | Switch                        | Directs flow between Mem upload or Follow-up | Markdown                      | Mem Note, AI Agent Draft Follow Up |                         |
| Get Meeting Row          | Postgres                      | Retrieves meeting data from DB                 | Next Action                    | Markdown                     |                         |
| Get Meeting Row1         | Postgres                      | Retrieves meeting data for web response        | Web Page                      | Respond With WebApp HTML      |                         |
| Markdown                 | Markdown                      | Converts text data for processing or display   | Get Meeting Row                | Switch                      |                         |
| OpenAI Chat Model1       | LangChain GPT-4 chat model     | LM for drafting follow-up emails                | AI Agent Draft Follow Up       | AI Agent Draft Follow Up (LM Input) |                         |
| Set Email JSON           | Set                            | Prepares draft email data for sending            | AI Agent Draft Follow Up       | Send Follow Up               |                         |
| Filter for Join Url1     | Filter                         | Filters meetings only with join URLs             | Code1                        | Get Online Meeting Details1  |                         |
| Get Online Meeting Details1| HTTP Request                 | Retrieves detailed Microsoft Teams meeting data      | Filter for Join Url1           | Split Out Meetings1          |                         |
| Split Out Meetings1      | Split Out                     | Splits online meeting details into items          | Get Online Meeting Details1    | Remove Duplicates            |                         |
| List Transcripts2        | HTTP Request                  | Lists transcripts available for files               | Split Out3                   | Get Transcript1              |                         |
| Get Transcript1          | HTTP Request                  | Gets another transcript content                     | List Transcripts2             | Set Transcription & Subject1 |                         |
| Merge                    | Merge                        | Combines multiple data branches                       | Set Transcription & Subject variants | Loop Over Items            |                         |
| Loop Over Items          | SplitInBatches               | Iterates over batch items for AI processing           | Merge                        | AI Agent Create Summary       |                         |
| Get Call Records         | HTTP Request                 | Downloads Teams call/meeting records                 | Set Time Range               | Code1                      |                         |
| Code1                    | Code                          | Parses call records, filters meetings                | Get Call Records             | Filter for Join Url1          |                         |
| Sort1                    | Sort                          | Sorts meeting list                                   | Remove Duplicates           | Check if Processed            |                         |
| Remove Duplicates        | RemoveDuplicates             | Removes duplicate meetings                            | Split Out Meetings1          | Sort1                        |                         |
| Code2                    | Code                          | Processes form submission data                         | On form submission          | Merge1                       |                         |
| Merge1                   | Merge                        | Combines data streams after triggers                 | Schedule Trigger, Code2      | Get Microsoft 365 Profile     |                         |
| Get Microsoft 365 Profile| HTTP Request                 | Retrieves user profile info from Microsoft Graph      | Merge1                      | If2                          |                         |
| If2                      | If                            | Branches based on profile or data criteria             | Get Microsoft 365 Profile   | Set Transcription & Subject2, Set Time Range |                         |
| AI Agent Create Summary  | LangChain Agent              | Creates meeting content summaries using AI             | Loop Over Items (LM Input)   | Set JSON                     |                         |
| AI Agent Draft Follow Up | LangChain Agent              | Drafts personalized follow-up emails                     | Switch                      | Set Email JSON               |                         |
| Send Follow Up           | Microsoft Outlook            | Sends follow-up email                                    | Set Email JSON               | Respond With Code 200        |                         |
| Respond With Code 200    | Respond to Webhook           | Confirms follow-up email send success                    | Send Follow Up               |                              |                         |
| Respond With WebApp HTML | Respond to Webhook           | Responds to web app with meeting HTML content            | Get Meeting Row1             |                              |                         |
| Respond to Webhook1      | Respond to Webhook           | Sends HTTP response confirming Mem.ai upload success    | Mem Note                    |                              |                         |
| End Analysis Notification| Microsoft Outlook            | Sends notification email on analysis completion          | Email HTML                  |                              |                         |
| Set Transcription & Subject / 1 / 2 | Set             | Assigns transcript text and meeting subject               | Get Transcript / Get Transcript1 / If2 | Merge                  |                         |
| Split Out3               | Split Out                   | Splits array data (e.g. meeting recordings)              | Search OneDrive for Meeting | List Transcripts2            |                         |
| Search OneDrive for Meeting | HTTP Request               | Searches files in OneDrive related to meetings            | Get Transcript Data         | Split Out3                  |                         |
| Sticky Notes (1..9)      | Sticky Note                 | Visual annotations for explanation & guidance           | Various                     |                              | See nodes below           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a schedule trigger node "Schedule Trigger"**  
   - Set interval to every 5 minutes  
   - This triggers the workflow to poll new meeting data.

2. **Create a webhook node "On form submission"**  
   - Configure to receive form data via webhook (Webhook ID provided by n8n)  
   - Connect to "Code2" for input processing.

3. **Create JavaScript node "Code2"**  
   - Process form inputs to merge with schedule trigger data flow.  
   - Output to "Merge1".

4. **Create Merge node "Merge1"**  
   - Combine inputs from schedule trigger and form submissions.  
   - Output to "Get Microsoft 365 Profile".

5. **Create HTTP Request node "Get Microsoft 365 Profile"**  
   - Configure OAuth2 Microsoft Graph credentials.  
   - Retrieve user profile info for permissions/logic branching.

6. **Create If node "If2"**  
   - Branch workflow based on profile or condition.  
   - Outputs to "Set Transcription & Subject2" and "Set Time Range".

7. **Create Set node "Set Time Range"**  
   - Configure parameters for setting the time range to fetch call records from Microsoft Graph API.

8. **Create HTTP Request node "Get Call Records"**  
   - Calls Microsoft Graph API to fetch recent Teams call/meeting records with the defined time range.

9. **Create JavaScript node "Code1"**  
   - Parse and filter call records to extract meeting info and URLs.

10. **Create Filter node "Filter for Join Url1"**  
    - Configure to pass only meetings with valid join URLs.

11. **Create HTTP Request node "Get Online Meeting Details1"**  
    - Fetch detailed metadata for filtered meetings.

12. **Create Split Out node "Split Out Meetings1"**  
    - Split the meetings list into individual items.

13. **Create Remove Duplicates node**  
    - Remove duplicate meeting entries.

14. **Create Sort node "Sort1"**  
    - Sort meetings by date or priority.

15. **Create Postgres node "Check if Processed"**  
    - Query Postgres DB to check if meeting transcript data has been already processed.

16. **Create Filter node "Filter No Items"**  
    - Filter only new (unprocessed) meetings.

17. **Create Code node "Get Items"**  
    - Format or filter new meeting data before retrieving transcript metadata.

18. **Create Merge node "Keep Matches"**  
    - Combine filtered meetings with transcript metadata.

19. **Create HTTP Request node "Get Transcript Data"**  
    - Retrieve transcript file metadata from OneDrive or SharePoint using Microsoft Graph API.

20. **Create Split Out node "Split Out Transcriptions"**  
    - Split transcript metadata into individual transcript items.

21. **Create HTTP Request nodes "Get Transcript" and "Get Transcript1"**  
    - Fetch the actual transcript content.

22. **Create Set nodes "Set Transcription & Subject", "Set Transcription & Subject1", and "Set Transcription & Subject2"**  
    - Format transcript text and include meeting subject/title.

23. **Create Merge node "Merge"**  
    - Combine structured transcript data for batch AI analysis.

24. **Create SplitInBatches node "Loop Over Items"**  
    - Process transcripts in batches for calling AI models.

25. **Create LangChain agent node "AI Agent Create Summary"**  
    - Configure to use OpenAI GPT-4.1 API credentials.  
    - Set prompt for summarizing meeting content.

26. **Create Set node "Set JSON"**  
    - Prepare JSON output for HTML generation.

27. **Create HTML nodes "Email HTML" and "Summary HTML"**  
    - Configure to convert summary JSON to HTML for email and web display.

28. **Create Postgres node "Save Data"**  
    - Insert or update meeting summary data in Postgres DB.

29. **Create Microsoft Outlook node "End Analysis Notification"**  
    - Configure OAuth2 with Outlook credentials.  
    - Setup to send user notification email upon completion.

30. **Create Webhook node "Web Page"**  
    - Configure webhook to serve front-end web requests for meeting data.

31. **Create Postgres node "Get Meeting Row1"**  
    - Query meeting data based on web request parameters.

32. **Create Respond to Webhook node "Respond With WebApp HTML"**  
    - Format and reply with meeting HTML content.

33. **Create Switch node**  
    - Route data to either Mem.ai upload or email drafting.

34. **Create HTTP Request node "Mem Note"**  
    - Configure to send data to Mem.ai API for knowledge base indexing.

35. **Create LangChain agent node "AI Agent Draft Follow Up"**  
    - Configure GPT-4.1 to draft personalized follow-up emails.

36. **Create Set node "Set Email JSON"**  
    - Structure the draft email data for sending.

37. **Create Microsoft Outlook node "Send Follow Up"**  
    - Setup credentials and configure to send follow-up emails.

38. **Create Respond to Webhook node "Respond With Code 200"**  
    - Confirm successful follow-up email sent.

**Credentials Required:**  
- Microsoft Graph API OAuth2 (with required scopes for calls, chats, files, user profiles).  
- Microsoft Outlook OAuth2 for email sending.  
- OpenAI API key for GPT-4.1 access.  
- Postgres DB connection credentials (can be Supabase).

---

### 5. General Notes & Resources

| Note Content                                                                                                     | Context or Link                                                                                          |
|-----------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| ⚠️ Administrator consent is required for Microsoft 365 OAuth app with Graph and SharePoint scopes               | Azure App Registration with admin consent required                                                     |
| ⚙️ Setup guide included; knowledge in App registrations, OAuth2, client secrets, and API permissions is critical  | Prerequisite knowledge for deployment                                                                 |
| ⚠️ Knowledge of Postgres is necessary; SQL table setup required                                                  | Host your own Postgres or use Supabase                                                                |
| Workflow automates meeting retrieval, AI-powered analysis, knowledge base creation, and email follow-ups         | Core business use case                                                                                   |
| Uses GPT-4.1 OpenAI API and LangChain agents for AI processing                                                   | AI/LLM nodes used for summarization and email drafting                                                |
| Supports dynamic web app frontend integration                                                                   | Via webhook and HTML response nodes                                                                    |
| More details and setup instructions: [Template Setup Guide](https://github.com/n8n-io/n8n-nodes-microsoft#setup) | Link to official docs for Microsoft OAuth2 and Graph API integration                                   |
| Recommended to test Azure App permissions, OAuth tokens, and network connectivity carefully                        | Authentication errors are primary failure points                                                       |
| Human-in-the-loop email send can be integrated by providing manual send paths                                    | Outlook node also configurable for automatic sends                                                     |

---

This comprehensive document details the structure, nodes, logic, and setup instructions for the "Automate Microsoft Teams Meeting Analysis with GPT-4.1, Outlook & Mem.ai" n8n workflow template. It supports both advanced users and AI automation agents in understanding, recreating, and extending the workflow successfully.