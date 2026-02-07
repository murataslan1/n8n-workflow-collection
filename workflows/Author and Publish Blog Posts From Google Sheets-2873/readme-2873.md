Author and Publish Blog Posts From Google Sheets

https://n8nworkflows.xyz/workflows/author-and-publish-blog-posts-from-google-sheets-2873


# Author and Publish Blog Posts From Google Sheets

### 1. Workflow Overview

This workflow automates the process of authoring and publishing blog posts from ideas managed in a Google Spreadsheet to a WordPress blog. It is designed for users who want to plan, draft, finalize, and publish blog posts in stages, with manual control points between each stage. The workflow integrates Google Sheets for planning and configuration, OpenRouter-powered LLMs for content generation, and WordPress XML-RPC API for publishing.

**Target Use Cases:**  
- Bloggers and content creators managing editorial calendars in Google Sheets.  
- Teams wanting to automate blog post generation with AI assistance while retaining manual review.  
- Users needing configurable prompts and models per blog post stage.

**Logical Blocks:**  
- **1.1 Settings & Triggers:** Define configuration parameters and trigger the workflow manually or on schedule.  
- **1.2 Data Ingestion:** Fetch blog post schedule and configuration data from Google Sheets.  
- **1.3 Data Preparation & Prompt Assembly:** Prepare prompt text and model selection dynamically based on spreadsheet data.  
- **1.4 AI Content Generation:** Use LLM to generate or update blog post content for the current action stage.  
- **1.5 Post-Processing & Data Normalization:** Normalize and merge AI output with existing data.  
- **1.6 Conditional Branching:** Decide whether to take action (generate content) or publish based on spreadsheet flags.  
- **1.7 Publishing:** Prepare and send XML-RPC requests to WordPress to publish finalized posts.  
- **1.8 Logging & Saving:** Log workflow actions and save updated data back to Google Sheets.

---

### 2. Block-by-Block Analysis

#### 1.1 Settings & Triggers

**Overview:**  
This block initializes workflow parameters and triggers the workflow either manually or on an hourly schedule.

**Nodes Involved:**  
- ManualTrigger  
- ScheduleTrigger  
- Settings

**Node Details:**

- **ManualTrigger**  
  - Type: Manual trigger node  
  - Role: Allows manual start of the workflow  
  - Inputs: None  
  - Outputs: Connects to Settings node  
  - Edge Cases: None

- **ScheduleTrigger**  
  - Type: Schedule trigger node  
  - Role: Automatically triggers workflow every hour  
  - Configuration: Interval set to 1 hour  
  - Inputs: None  
  - Outputs: Connects to Settings node  
  - Edge Cases: Scheduling conflicts or missed triggers if n8n is down

- **Settings**  
  - Type: Set node  
  - Role: Defines key workflow parameters such as spreadsheet URL, WordPress URL, credentials, sheet names, and action keywords  
  - Configuration:  
    - urlSpreadsheet: URL of the Google Spreadsheet  
    - urlWordpress: WordPress blog URL (subdomain)  
    - wordpressUsername: WordPress username  
    - wordpressApplicationPassword: WordPress app password (4x4 alphanumeric)  
    - sheetSchedule, sheetConfig, sheetLog: Sheet names in the spreadsheet  
    - actionPublish: String "publish" to identify publish action  
  - Inputs: From ManualTrigger or ScheduleTrigger  
  - Outputs: To fetchConfig and Schedule nodes  
  - Edge Cases: Incorrect URLs or credentials will cause downstream failures

---

#### 1.2 Data Ingestion

**Overview:**  
Fetches configuration parameters and blog post schedule data from the Google Spreadsheet.

**Nodes Involved:**  
- fetchConfig  
- Config  
- Schedule

**Node Details:**

- **fetchConfig**  
  - Type: Google Sheets node  
  - Role: Reads the "Config" sheet from the spreadsheet to get prompt templates, model names, output formats, etc.  
  - Configuration: Uses sheet name from Settings (`sheetConfig`) and spreadsheet URL from Settings  
  - Credentials: Google Sheets OAuth2  
  - Inputs: From Settings  
  - Outputs: To Config node  
  - Edge Cases: Sheet missing or access denied

- **Config**  
  - Type: Code node  
  - Role: Converts fetched config rows into a key-value JSON object for easy access  
  - Code: Iterates over all rows from fetchConfig and maps Key → Value  
  - Inputs: From fetchConfig  
  - Outputs: Used downstream for prompt and model selection  
  - Edge Cases: Empty or malformed config data

- **Schedule**  
  - Type: Google Sheets node  
  - Role: Reads the "Schedule" sheet containing blog post topics, statuses, actions, and other metadata  
  - Configuration: Uses sheet name from Settings (`sheetSchedule`) and spreadsheet URL from Settings  
  - Credentials: Google Sheets OAuth2  
  - Inputs: From Settings  
  - Outputs: To PreparedData node  
  - Edge Cases: Missing or malformed schedule data

---

#### 1.3 Data Preparation & Prompt Assembly

**Overview:**  
Prepares the prompt text and selects the LLM model dynamically based on the current row's action and the configuration data. Also determines if an action should be taken.

**Nodes Involved:**  
- PreparedData

**Node Details:**

- **PreparedData**  
  - Type: Code node (run once per item)  
  - Role:  
    - Replaces placeholders in prompt templates with values from the current row and config  
    - Determines the prompt key and model key based on the row's Action  
    - Checks if the Action differs from the Status to decide if action is needed (`takeAction`)  
  - Key Expressions:  
    - Uses regex to replace `{{ ... }}` placeholders with values from row or config  
    - Constructs prompt and model keys dynamically (e.g., `prompt_plan`, `prompt_plan_model`)  
  - Inputs: From Schedule  
  - Outputs: JSON with keys: takeAction (boolean), action, model, prompt, outputFormat, row, config, settings  
  - Edge Cases: Missing placeholders, empty prompts, or missing model names

---

#### 1.4 AI Content Generation

**Overview:**  
If action is required and a prompt exists, this block sends the prompt to the configured LLM model to generate content.

**Nodes Involved:**  
- IfTakeAction  
- IfActionPublish  
- IfPromptExists  
- AgentLLM  
- Basic LLM Chain

**Node Details:**

- **IfTakeAction**  
  - Type: If node  
  - Role: Checks if `takeAction` is true (i.e., Action differs from Status)  
  - Inputs: From PreparedData  
  - Outputs:  
    - True: To IfActionPublish  
    - False: Ends or skips AI generation  
  - Edge Cases: Expression evaluation errors

- **IfActionPublish**  
  - Type: If node  
  - Role: Checks if the current Action is "publish" (from Settings)  
  - Inputs: From IfTakeAction  
  - Outputs:  
    - True: To IfScheduledNow (publishing branch)  
    - False: To IfPromptExists (authoring branch)  
  - Edge Cases: Case sensitivity or missing action string

- **IfPromptExists**  
  - Type: If node  
  - Role: Checks if the prompt string is not empty before calling LLM  
  - Inputs: From IfActionPublish (false branch)  
  - Outputs:  
    - True: To Basic LLM Chain  
    - False: Skips LLM call  
  - Edge Cases: Empty or null prompt

- **AgentLLM**  
  - Type: Langchain OpenAI Chat node  
  - Role: Sends prompt to OpenRouter/OpenAI LLM with the specified model  
  - Configuration: Model name dynamically set from input JSON (`model`)  
  - Credentials: OpenRouter API key  
  - Inputs: From Basic LLM Chain (as ai_languageModel)  
  - Outputs: LLM response JSON  
  - Edge Cases: API errors, rate limits, invalid model names

- **Basic LLM Chain**  
  - Type: Langchain chain node  
  - Role: Defines the prompt text to send to the LLM  
  - Configuration: Uses prompt from input JSON (`prompt`)  
  - Inputs: From IfPromptExists  
  - Outputs: To RecombinedDataRow  
  - Edge Cases: Empty prompt or chain errors

---

#### 1.5 Post-Processing & Data Normalization

**Overview:**  
Normalizes the LLM output, merges it with existing row data, updates status, and prepares data for saving.

**Nodes Involved:**  
- RecombinedDataRow

**Node Details:**

- **RecombinedDataRow**  
  - Type: Code node (run once per item)  
  - Role:  
    - Attempts to parse LLM output text as JSON, applying multiple fix-up strategies for malformed JSON  
    - Extracts full text or structured fields from LLM output  
    - Merges generated content with existing spreadsheet row fields, concatenating with separators if needed  
    - Updates the row's Status to the current Action  
    - Adds model info and row number for saving  
  - Inputs: From Basic LLM Chain  
  - Outputs: To LogStatus  
  - Edge Cases: Malformed LLM output, parsing failures, missing fields

---

#### 1.6 Conditional Branching & Saving

**Overview:**  
Logs the status, saves updated data back to the spreadsheet, and branches to publishing if required.

**Nodes Involved:**  
- LogStatus  
- SaveBackToSheet  
- IfActionPublish (revisited)  
- IfScheduledNow

**Node Details:**

- **LogStatus**  
  - Type: Google Sheets append node  
  - Role: Logs the current status and row number with timestamp to the "Log" sheet  
  - Inputs: From RecombinedDataRow  
  - Outputs: To SaveBackToSheet  
  - Edge Cases: Sheet access issues

- **SaveBackToSheet**  
  - Type: Google Sheets update node  
  - Role: Updates the "Schedule" sheet row with the new data (including updated Status and generated content)  
  - Configuration: Matches rows by `row_number`  
  - Inputs: From LogStatus  
  - Outputs: Ends or continues depending on workflow  
  - Edge Cases: Row matching failures, write permission issues

- **IfActionPublish** (second usage)  
  - Type: If node  
  - Role: Checks again if Action is "publish" to trigger publishing branch  
  - Inputs: From IfTakeAction (true branch)  
  - Outputs:  
    - True: To IfScheduledNow  
    - False: To IfPromptExists (handled earlier)  
  - Edge Cases: Same as above

- **IfScheduledNow**  
  - Type: If node  
  - Role: Checks if the current time is equal or past the Scheduled date/time for publishing  
  - Inputs: From IfActionPublish (true branch)  
  - Outputs:  
    - True: To PrepareXmlPost (proceed with publishing)  
    - False: Ends or waits  
  - Edge Cases: Date parsing errors, timezone issues

---

#### 1.7 Publishing

**Overview:**  
Prepares XML-RPC request to WordPress, sends the post, handles response, and updates status.

**Nodes Involved:**  
- PrepareXmlPost  
- CreatePost  
- HandleXMLRPCResponse  
- PostingSuccessful  
- SetToPublish  
- LogPublished

**Node Details:**

- **PrepareXmlPost**  
  - Type: Code node (run once per item)  
  - Role:  
    - Constructs XML-RPC payload for `wp.newPost` method  
    - Escapes XML special characters in title and content  
    - Uses WordPress username and application password from Settings  
    - Sets post status to published (1)  
  - Inputs: From IfScheduledNow  
  - Outputs: To CreatePost  
  - Edge Cases: XML escaping errors, missing fields

- **CreatePost**  
  - Type: HTTP Request node  
  - Role: Sends XML-RPC POST request to WordPress `xmlrpc.php` endpoint  
  - Configuration:  
    - URL constructed from WordPress URL in Settings  
    - Content-Type: text/xml  
    - Body: XML from PrepareXmlPost  
  - Inputs: From PrepareXmlPost  
  - Outputs: To HandleXMLRPCResponse  
  - Edge Cases: Network errors, authentication failures, XML-RPC faults

- **HandleXMLRPCResponse**  
  - Type: Code node (run once per item)  
  - Role:  
    - Parses XML response from WordPress  
    - Detects faults and extracts faultCode and faultString if present  
    - Extracts postId if successful  
  - Inputs: From CreatePost  
  - Outputs: To LogPublished  
  - Edge Cases: Malformed XML, unexpected response formats

- **PostingSuccessful**  
  - Type: If node  
  - Role: Checks if postId exists in response to confirm successful publishing  
  - Inputs: From HandleXMLRPCResponse  
  - Outputs:  
    - True: To SetToPublish  
    - False: Ends or logs error  
  - Edge Cases: Missing postId, false positives

- **SetToPublish**  
  - Type: Google Sheets update node  
  - Role: Updates the "Schedule" sheet row's Status to "publish" to reflect published state  
  - Inputs: From PostingSuccessful  
  - Outputs: Ends workflow  
  - Edge Cases: Sheet update failures

- **LogPublished**  
  - Type: Google Sheets append node  
  - Role: Logs publishing result (success or error) with timestamp to "Log" sheet  
  - Inputs: From HandleXMLRPCResponse  
  - Outputs: Ends workflow  
  - Edge Cases: Logging failures

---

#### 1.8 Sticky Notes (Documentation Nodes)

Sticky notes are used throughout the workflow to label logical blocks and provide context:

- Settings block  
- Author Blog-Post (LLM configuration)  
- Post-process Data (placeholder replacement and normalization)  
- Log to Sheet  
- Save Result To Sheet  
- Publish Blog-Post (XML-RPC usage)  
- Publishing Stage overview  
- Authoring Stage overview  
- Config & Data overview

---

### 3. Summary Table

| Node Name           | Node Type                          | Functional Role                          | Input Node(s)                  | Output Node(s)                  | Sticky Note                                                                                  |
|---------------------|----------------------------------|----------------------------------------|-------------------------------|--------------------------------|----------------------------------------------------------------------------------------------|
| ManualTrigger       | Manual Trigger                   | Manual workflow start                   | None                          | Settings                       |                                                                                              |
| ScheduleTrigger     | Schedule Trigger                 | Hourly scheduled workflow start        | None                          | Settings                       |                                                                                              |
| Settings            | Set                             | Define workflow parameters              | ManualTrigger, ScheduleTrigger| fetchConfig, Schedule          | ## Settings                                                                                  |
| fetchConfig         | Google Sheets                   | Fetch config sheet                      | Settings                      | Config                        | ## Config & Data                                                                             |
| Config              | Code                            | Convert config rows to key-value JSON  | fetchConfig                   | (used by PreparedData)         | ## Config & Data                                                                             |
| Schedule            | Google Sheets                   | Fetch blog post schedule data           | Settings                      | PreparedData                  | ## Config & Data                                                                             |
| PreparedData        | Code                            | Prepare prompt, model, and action flags | Schedule                      | IfTakeAction                  | ## Post-process Data {{ Placehoder }} replacement                                           |
| IfTakeAction        | If                              | Check if action needed                  | PreparedData                  | IfActionPublish               |                                                                                              |
| IfActionPublish     | If                              | Check if action is "publish"            | IfTakeAction                  | IfScheduledNow, IfPromptExists|                                                                                              |
| IfPromptExists      | If                              | Check if prompt exists                  | IfActionPublish               | Basic LLM Chain               |                                                                                              |
| Basic LLM Chain     | Langchain Chain                 | Define prompt for LLM                   | IfPromptExists                | AgentLLM                     | ## Author Blog-Post Using OpenRouter to make model fully configurable for each authoring stage|
| AgentLLM            | Langchain OpenAI Chat           | Send prompt to LLM                      | Basic LLM Chain               | RecombinedDataRow             | ## Author Blog-Post Using OpenRouter to make model fully configurable for each authoring stage|
| RecombinedDataRow   | Code                            | Normalize and merge LLM output          | AgentLLM                     | LogStatus                    | ## Post-process Data Normalize and re-merge output data structure.                          |
| LogStatus           | Google Sheets Append            | Log status info to Log sheet            | RecombinedDataRow             | SaveBackToSheet              | ## Log to Sheet                                                                             |
| SaveBackToSheet     | Google Sheets Update            | Save updated blog post data             | LogStatus                    | (end)                        | ## Save Result To Sheet                                                                     |
| IfScheduledNow      | If                              | Check if scheduled time reached for publish | IfActionPublish            | PrepareXmlPost               |                                                                                              |
| PrepareXmlPost      | Code                            | Prepare XML-RPC payload for WordPress  | IfScheduledNow               | CreatePost                   | ## Publish Blog-Post Use a generic XMLHttpRequest with subsequent response handling          |
| CreatePost          | HTTP Request                   | Send XML-RPC request to WordPress       | PrepareXmlPost               | HandleXMLRPCResponse         | ## Publish Blog-Post Use a generic XMLHttpRequest with subsequent response handling          |
| HandleXMLRPCResponse| Code                            | Parse XML-RPC response                   | CreatePost                   | LogPublished, PostingSuccessful| ## Post-process Data Extract post id or error message from response.                        |
| PostingSuccessful   | If                              | Check if post was published successfully | HandleXMLRPCResponse         | SetToPublish                 |                                                                                              |
| SetToPublish        | Google Sheets Update            | Update Status to "publish" in Schedule  | PostingSuccessful            | (end)                        | ## Save Status To Sheet                                                                     |
| LogPublished        | Google Sheets Append            | Log publishing result                    | HandleXMLRPCResponse         | (end)                        | ## Log to Sheet                                                                             |
| Sticky Note         | Sticky Note                    | Documentation                           | None                         | None                         | ## Settings                                                                                |
| Sticky Note1        | Sticky Note                    | Documentation                           | None                         | None                         | ## Author Blog-Post Using OpenRouter to make model fully configurable for each authoring stage|
| Sticky Note2        | Sticky Note                    | Documentation                           | None                         | None                         | ## Post-process Data {{ Placehoder }} replacement                                         |
| Sticky Note3        | Sticky Note                    | Documentation                           | None                         | None                         | ## Log to Sheet                                                                           |
| Sticky Note4        | Sticky Note                    | Documentation                           | None                         | None                         | ## Save Result To Sheet                                                                   |
| Sticky Note5        | Sticky Note                    | Documentation                           | None                         | None                         | ## Publish Blog-Post Use a generic XMLHttpRequest with subsequent response handling        |
| Sticky Note6        | Sticky Note                    | Documentation                           | None                         | None                         | ## Post-process Data Normalize and re-merge output data structure.                        |
| Sticky Note7        | Sticky Note                    | Documentation                           | None                         | None                         | ## Post-process Data Extract post id or error message from response.                      |
| Sticky Note8        | Sticky Note                    | Documentation                           | None                         | None                         | ## Log to Sheet                                                                           |
| Sticky Note9        | Sticky Note                    | Documentation                           | None                         | None                         | ## Save Status To Sheet                                                                   |
| Sticky Note10       | Sticky Note                    | Documentation                           | None                         | None                         | ## Authoring Stage                                                                        |
| Sticky Note11       | Sticky Note                    | Documentation                           | None                         | None                         | ## Publishing Stage                                                                      |
| Sticky Note12       | Sticky Note                    | Documentation                           | None                         | None                         | ## Config & Data                                                                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Nodes:**  
   - Add a **Manual Trigger** node named `ManualTrigger`.  
   - Add a **Schedule Trigger** node named `ScheduleTrigger` with interval set to every 1 hour.

2. **Create Settings Node:**  
   - Add a **Set** node named `Settings`.  
   - Define the following string parameters:  
     - `urlSpreadsheet`: Your Google Spreadsheet URL (e.g., `https://docs.google.com/spreadsheets/d/...`)  
     - `urlWordpress`: Your WordPress blog subdomain (e.g., `SUBDOMAIN.wordpress.com`)  
     - `wordpressUsername`: Your WordPress username  
     - `wordpressApplicationPassword`: Your WordPress application password (4x4 alphanumeric)  
     - `sheetSchedule`: `=Schedule` (name of schedule sheet)  
     - `sheetConfig`: `=Config` (name of config sheet)  
     - `sheetLog`: `=Log` (name of log sheet)  
     - `actionPublish`: `publish` (string to identify publish action)  
     - `actionUpdate`: empty string (reserved)  
   - Connect outputs of `ManualTrigger` and `ScheduleTrigger` to `Settings`.

3. **Fetch Config Data:**  
   - Add a **Google Sheets** node named `fetchConfig`.  
   - Configure to read from the spreadsheet URL and sheet name from `Settings` (`sheetConfig`).  
   - Use Google Sheets OAuth2 credentials.  
   - Connect `Settings` output to `fetchConfig`.

4. **Convert Config to JSON:**  
   - Add a **Code** node named `Config`.  
   - Use JavaScript to convert rows from `fetchConfig` into a key-value object mapping `Key` → `Value`.  
   - Connect `fetchConfig` output to `Config`.

5. **Fetch Schedule Data:**  
   - Add a **Google Sheets** node named `Schedule`.  
   - Configure to read from the spreadsheet URL and sheet name from `Settings` (`sheetSchedule`).  
   - Use Google Sheets OAuth2 credentials.  
   - Connect `Settings` output to `Schedule`.

6. **Prepare Data and Prompts:**  
   - Add a **Code** node named `PreparedData`.  
   - For each item, replace placeholders in prompt templates with values from the current row and config.  
   - Determine if action is needed (`takeAction`), the prompt text, model name, and output format.  
   - Connect `Schedule` output to `PreparedData`.

7. **Check if Action Needed:**  
   - Add an **If** node named `IfTakeAction`.  
   - Condition: `takeAction` is true.  
   - Connect `PreparedData` output to `IfTakeAction`.

8. **Check if Action is Publish:**  
   - Add an **If** node named `IfActionPublish`.  
   - Condition: `row.Action` equals `actionPublish` from `Settings`.  
   - Connect `IfTakeAction` true output to `IfActionPublish`.

9. **Check if Scheduled Time Reached:**  
   - Add an **If** node named `IfScheduledNow`.  
   - Condition: Current timestamp >= Scheduled timestamp from row.  
   - Connect `IfActionPublish` true output to `IfScheduledNow`.

10. **Prepare XML-RPC Post:**  
    - Add a **Code** node named `PrepareXmlPost`.  
    - Build XML payload for WordPress `wp.newPost` method using escaped title and final content.  
    - Use WordPress credentials from `Settings`.  
    - Connect `IfScheduledNow` true output to `PrepareXmlPost`.

11. **Send Post to WordPress:**  
    - Add an **HTTP Request** node named `CreatePost`.  
    - POST to `https://{urlWordpress}/xmlrpc.php` with XML body from `PrepareXmlPost`.  
    - Set header `Content-Type: text/xml`.  
    - Connect `PrepareXmlPost` output to `CreatePost`.

12. **Handle XML-RPC Response:**  
    - Add a **Code** node named `HandleXMLRPCResponse`.  
    - Parse XML response to extract postId or error info.  
    - Connect `CreatePost` output to `HandleXMLRPCResponse`.

13. **Check Posting Success:**  
    - Add an **If** node named `PostingSuccessful`.  
    - Condition: `postId` exists in response.  
    - Connect `HandleXMLRPCResponse` output to `PostingSuccessful`.

14. **Update Status to Published:**  
    - Add a **Google Sheets** update node named `SetToPublish`.  
    - Update the row's `Status` to `publish` in the schedule sheet.  
    - Match rows by `row_number`.  
    - Connect `PostingSuccessful` true output to `SetToPublish`.

15. **Log Publishing Result:**  
    - Add a **Google Sheets** append node named `LogPublished`.  
    - Append log entry with date, type (error/info), and message about publishing result.  
    - Connect `HandleXMLRPCResponse` output to `LogPublished`.

16. **Check if Prompt Exists:**  
    - Add an **If** node named `IfPromptExists`.  
    - Condition: Prompt string is not empty.  
    - Connect `IfActionPublish` false output to `IfPromptExists`.

17. **Define Prompt for LLM:**  
    - Add a **Langchain Chain** node named `Basic LLM Chain`.  
    - Use prompt text from `PreparedData`.  
    - Connect `IfPromptExists` true output to `Basic LLM Chain`.

18. **Send Prompt to LLM:**  
    - Add a **Langchain OpenAI Chat** node named `AgentLLM`.  
    - Use model name from `PreparedData`.  
    - Use OpenRouter credentials.  
    - Connect `Basic LLM Chain` output to `AgentLLM`.

19. **Normalize and Merge LLM Output:**  
    - Add a **Code** node named `RecombinedDataRow`.  
    - Parse and normalize LLM output, merge with existing row data, update status.  
    - Connect `AgentLLM` output to `RecombinedDataRow`.

20. **Log Status:**  
    - Add a **Google Sheets** append node named `LogStatus`.  
    - Append info log about updated status and row number.  
    - Connect `RecombinedDataRow` output to `LogStatus`.

21. **Save Updated Data:**  
    - Add a **Google Sheets** update node named `SaveBackToSheet`.  
    - Update the schedule sheet row with new data, matching by `row_number`.  
    - Connect `LogStatus` output to `SaveBackToSheet`.

22. **Connect Triggers to Settings:**  
    - Connect `ManualTrigger` and `ScheduleTrigger` outputs to `Settings`.

23. **Connect Settings to fetchConfig and Schedule:**  
    - Connect `Settings` output to `fetchConfig` and `Schedule`.

24. **Connect fetchConfig to Config:**  
    - Connect `fetchConfig` output to `Config`.

25. **Connect Config and Schedule to PreparedData:**  
    - Connect `Config` and `Schedule` outputs to `PreparedData`.

26. **Connect PreparedData to IfTakeAction:**  
    - Connect `PreparedData` output to `IfTakeAction`.

27. **Connect IfTakeAction to IfActionPublish:**  
    - Connect true output of `IfTakeAction` to `IfActionPublish`.

28. **Connect IfActionPublish to IfScheduledNow and IfPromptExists:**  
    - Connect true output to `IfScheduledNow` (publishing branch).  
    - Connect false output to `IfPromptExists` (authoring branch).

29. **Connect IfScheduledNow to PrepareXmlPost:**  
    - Connect true output to `PrepareXmlPost`.

30. **Connect PrepareXmlPost to CreatePost:**  
    - Connect output to `CreatePost`.

31. **Connect CreatePost to HandleXMLRPCResponse:**  
    - Connect output to `HandleXMLRPCResponse`.

32. **Connect HandleXMLRPCResponse to PostingSuccessful and LogPublished:**  
    - Connect output to both nodes.

33. **Connect PostingSuccessful to SetToPublish:**  
    - Connect true output to `SetToPublish`.

34. **Connect RecombinedDataRow to LogStatus:**  
    - Connect output to `LogStatus`.

35. **Connect LogStatus to SaveBackToSheet:**  
    - Connect output to `SaveBackToSheet`.

---

### 5. General Notes & Resources

| Note Content                                                                                                  | Context or Link                                                                                                  |
|---------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| Workflow uses OpenRouter API for LLM calls, allowing model selection per blog post stage.                      | OpenRouter: https://openrouter.ai/                                                                              |
| WordPress publishing uses XML-RPC API with manual XML payload construction due to issues with native WordPress node. | WordPress XML-RPC API documentation: https://codex.wordpress.org/XML-RPC_WordPress_API                          |
| Requires WordPress user with 2FA enabled and an application password (4x4 alphanumeric) for authentication.    | WordPress app passwords: https://wordpress.org/support/article/application-passwords/                            |
| Google Spreadsheet must have "Config" and "Schedule" sheets with specific columns as per template.            | Spreadsheet template: https://docs.google.com/spreadsheets/d/1Kg1-U6mJF4bahH1jCw8kT48MiKz1UMC5n-9q77BHM3Q/edit    |
| Workflow designed to hand back control to user between stages for review and manual action setting.            |                                                                                                                 |
| Sticky notes in workflow provide helpful documentation and logical grouping.                                   |                                                                                                                 |

---

This detailed reference document provides a comprehensive understanding of the workflow structure, logic, and configuration, enabling advanced users and AI agents to reproduce, modify, and troubleshoot the automation effectively.