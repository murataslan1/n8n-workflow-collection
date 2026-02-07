Automate Meeting Notes Summaries with Gemini AI & Slack Notifications

https://n8nworkflows.xyz/workflows/automate-meeting-notes-summaries-with-gemini-ai---slack-notifications-8116


# Automate Meeting Notes Summaries with Gemini AI & Slack Notifications

### 1. Workflow Overview

This workflow automates the process of summarizing meeting notes and notifying a Slack channel with concise summaries and actionable items. It is designed for teams using a meeting note-taking application with an accessible API and leverages Google Gemini AI (PaLM) to generate summaries and extract action items from meeting data.

The workflow logically divides into these blocks:

- **1.1 Input Reception and Trigger**: Periodic scheduling of workflow execution.
- **1.2 Meeting Data Retrieval and Preparation**: Fetching meeting data via API, splitting into individual meetings, and formatting dates.
- **1.3 Data Filtering**: Filtering meetings that occurred within the past week.
- **1.4 AI Processing (Summarization & Extraction)**: Using AI agents and Google Gemini to summarize notes and extract structured action items.
- **1.5 Slack Notification Preparation**: Restructuring AI output into Slack Block Kit format.
- **1.6 Notification Dispatch**: Sending formatted notifications to a Slack channel.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception and Trigger

- **Overview:**  
  Starts the workflow on a scheduled interval to automate daily or periodic meeting notes processing.

- **Nodes Involved:**  
  - Schedule Trigger

- **Node Details:**

  - **Schedule Trigger**
    - Type: `Schedule Trigger` (n8n native)
    - Role: Initiates the workflow execution based on a fixed schedule.
    - Configuration: Runs on a default interval (exact timing not specified, default likely daily).
    - Inputs: None (trigger node)
    - Outputs: Connects to "Get meetings list"
    - Edge Cases: If scheduling fails or is disabled, workflow won't run.
    - Version: v1.2

#### 1.2 Meeting Data Retrieval and Preparation

- **Overview:**  
  Acquires meeting data from the meeting note-taking app API, splits the list into individual meetings, and prepares data fields such as meeting ID and formatted dates.

- **Nodes Involved:**  
  - Get meetings list  
  - Split meetings  
  - Add custom name for meeting id  
  - Format date

- **Node Details:**

  - **Get meetings list**
    - Type: `HTTP Request`
    - Role: Fetches the list of meetings from the note-taking API.
    - Configuration:  
      - URL: `https://api.meetgeek.ai/v1/meetings/`  
      - Authentication: Bearer token via HTTP Bearer Auth credential  
      - Executes once per run  
    - Inputs: From Schedule Trigger  
    - Outputs: JSON containing an array of meetings  
    - Edge Cases: API failures, auth errors, network issues  
    - Version: 4.2

  - **Split meetings**
    - Type: `Split Out`
    - Role: Splits meeting list array into individual meeting items for processing.
    - Configuration: Field to split out is `meetings` array from previous node output.
    - Inputs: From Get meetings list  
    - Outputs: Each meeting as a single item  
    - Edge Cases: Empty meeting list results in no subsequent processing  
    - Version: 1

  - **Add custom name for meeting id**
    - Type: `Set`
    - Role: Renames `meeting_id` field to `extract_meeting_id` for clarity and downstream use.
    - Configuration: Copies `meeting_id` to `extract_meeting_id`, excludes original `meeting_id` field.
    - Inputs: From Split meetings  
    - Outputs: Meeting item with renamed ID field  
    - Edge Cases: Missing `meeting_id` in input; expression failures  
    - Version: 3.4

  - **Format date**
    - Type: `DateTime`
    - Role: Formats meeting start timestamp into `yyyy-MM-dd` string.
    - Configuration:  
      - Input date: `$json.timestamp_start_utc`  
      - Output format: `yyyy-MM-dd`  
      - Includes input fields in output  
    - Inputs: From Add custom name for meeting id  
    - Outputs: Adds formatted date field  
    - Edge Cases: Invalid or missing timestamps  
    - Version: 2

#### 1.3 Data Filtering

- **Overview:**  
  Filters meetings to include only those that happened within the past 7 days, ensuring relevance for summary and notification.

- **Nodes Involved:**  
  - AI Transform

- **Node Details:**

  - **AI Transform**
    - Type: `AI Transform` (JavaScript code node)
    - Role: Filters input meetings by date, returning only those with `formattedDate` within the last week.
    - Configuration:  
      - Custom JS code filters `$input.all()` by comparing `formattedDate` to today and one week ago.
      - Instructions: "Filter the formatted Date in the past week upto today"
    - Inputs: From Format date  
    - Outputs: Filtered meetings for AI processing  
    - Edge Cases: Date parsing errors, empty input arrays  
    - Version: 1

#### 1.4 AI Processing (Summarization & Extraction)

- **Overview:**  
  For each filtered meeting, calls an external API to get meeting summaries, then uses Google Gemini AI via a LangChain agent to generate bullet-point summaries and extract action items.

- **Nodes Involved:**  
  - summary (HTTP Request Tool)  
  - Google Gemini Chat Model  
  - AI Agent

- **Node Details:**

  - **summary**
    - Type: `HTTP Request Tool`
    - Role: Fetches the meeting summary from the meeting note-taking API for a given meeting ID.
    - Configuration:  
      - URL template: `https://api.meetgeek.ai/v1/meetings/{{ $json.extract_meeting_id }}/summary/`  
      - Authentication: Bearer token (HTTP Bearer Auth)  
    - Inputs: From AI Transform (filtered meetings)  
    - Outputs: Meeting summary JSON  
    - Edge Cases: Missing or invalid meeting IDs, API failures, rate limiting  
    - Version: 4.2

  - **Google Gemini Chat Model**
    - Type: `Google Gemini (PaLM) Chat Model` via LangChain integration
    - Role: Provides AI language model capabilities to the LangChain AI Agent.
    - Configuration: Uses Google Palm API credentials  
    - Inputs: AI Agent (as `ai_languageModel` node)  
    - Outputs: AI Agent’s prompts processed  
    - Edge Cases: API quota exceeded, auth failure, network latency  
    - Version: 1

  - **AI Agent**
    - Type: `LangChain AI Agent`
    - Role: Coordinates the summarization and extraction tasks using the Gemini model and meeting summary API data.
    - Configuration:  
      - Text prompt instructs the agent to:  
        - Retrieve meeting summary via HTTP Request node  
        - Generate 3–5 bullet point summary  
        - Extract structured action items (task, owner, deadline)  
        - Handle missing notes gracefully  
      - Output format specified as JSON with `title`, `summary` (array), and `action_items` (array of objects)  
    - Inputs: From AI Transform (filtered meetings) and linked Gemini model  
    - Outputs: Structured summary and action item data  
    - Edge Cases: Empty or malformed input, AI model failures, API call failures within the agent  
    - Version: 2.2

#### 1.5 Slack Notification Preparation

- **Overview:**  
  Restructures the AI-generated summaries and action items into Slack Block Kit JSON format suitable for rich messaging.

- **Nodes Involved:**  
  - Restructure to slack block

- **Node Details:**

  - **Restructure to slack block**
    - Type: `Code` (JavaScript)
    - Role: Converts AI JSON output into Slack Block Kit format with headers, sections, bullet points, and dividers.
    - Configuration:  
      - Parses AI output JSON (cleaning code blocks if present)  
      - For each meeting: adds header with meeting title, summary bullets, action items (or fallback text if none), and a divider  
      - Returns Slack blocks array in `blocks` property  
    - Inputs: From AI Agent  
    - Outputs: Slack block structure ready for sending  
    - Edge Cases: JSON parsing errors, missing fields in AI output  
    - Version: 2

#### 1.6 Notification Dispatch

- **Overview:**  
  Sends the formatted meeting summaries and action items as a Slack message to a configured channel.

- **Nodes Involved:**  
  - Send a message

- **Node Details:**

  - **Send a message**
    - Type: `Slack` node
    - Role: Posts the meeting notes summary to a Slack channel using Slack Block Kit.
    - Configuration:  
      - Sends a block message to channel ID `C09CV2VC877` (named "meeting-notes")  
      - Message text defaulted to “test” (fallback)  
      - Uses OAuth2 authentication with Slack account credentials  
      - Sends message once per workflow run  
    - Inputs: From Restructure to slack block  
    - Outputs: None (final node)  
    - Edge Cases: Slack API errors, auth token expiration, channel access permissions  
    - Version: 2.3

---

### 3. Summary Table

| Node Name                 | Node Type                        | Functional Role                              | Input Node(s)              | Output Node(s)            | Sticky Note                                                                                 |
|---------------------------|---------------------------------|----------------------------------------------|----------------------------|---------------------------|---------------------------------------------------------------------------------------------|
| Schedule Trigger           | Schedule Trigger                | Initiates workflow on schedule                | —                          | Get meetings list         |                                                                                             |
| Get meetings list          | HTTP Request                   | Fetches meetings list from note taker API    | Schedule Trigger           | Split meetings            |                                                                                             |
| Split meetings            | Split Out                      | Splits meetings array to individual meetings | Get meetings list          | Add custom name for meeting id |                                                                                             |
| Add custom name for meeting id | Set                            | Renames `meeting_id` to `extract_meeting_id` | Split meetings            | Format date               |                                                                                             |
| Format date               | DateTime                       | Formats meeting start timestamp               | Add custom name for meeting id | AI Transform            | ## Format the date and restructure the data **Filter the meeting data for the past seven days.** |
| AI Transform              | AI Transform (JS code)         | Filters meetings within the last 7 days       | Format date                | AI Agent                  | ## Filter the formatted Date in the past week upto today                                    |
| summary                   | HTTP Request Tool              | Gets meeting summary from API                  | AI Transform               | AI Agent (via agent prompt) | ## Extract summary and action items from the meeting notes **Using Gemini AI model summarize the meeting notes and list down the action items**          |
| Google Gemini Chat Model  | Google Gemini Chat Model       | Provides AI language model for summarization  | AI Agent (ai_languageModel) | AI Agent                  |                                                                                             |
| AI Agent                  | LangChain AI Agent             | Summarizes and extracts action items          | AI Transform, summary      | Restructure to slack block |                                                                                             |
| Restructure to slack block | Code                          | Converts AI output to Slack Block Kit format  | AI Agent                   | Send a message            | ## Set slack notification **Restructure the output from the AI agent and formatted it to slack block** |
| Send a message            | Slack                         | Sends Slack message with meeting notes        | Restructure to slack block | —                         |                                                                                             |
| Sticky Note               | Sticky Note                   | Document note                                  | —                          | —                         | ## Get meeting data from the note taker                                                     |
| Sticky Note1              | Sticky Note                   | Document note                                  | —                          | —                         | ## Format the date and restructure the data **Filter the meeting data for the past seven days.** |
| Sticky Note2              | Sticky Note                   | Document note                                  | —                          | —                         | ## Extract summary and action items from the meeting notes **Using Gemini AI model summarize the meeting notes and list down the action items**          |
| Sticky Note3              | Sticky Note                   | Document note                                  | —                          | —                         | ## Set slack notification **Restructure the output from the AI agent and formatted it to slack block** |
| Sticky Note5              | Sticky Note                   | Document note                                  | —                          | —                         | ## 📌 Meeting Notes Summarizer & Slack Notifier  - ⏰ Reads meeting notes from your note-taking app using API calls  - 🤖 Summarizes key points and extracts action items with **Gemini AI**  - 🗂️ Restructures the output into **Slack Block Kit** format  - 🔔 Sends daily Slack notifications with clear summaries and actionable tasks  **Requirements**  - API key & configuration for your meeting note-taking application  - Gemini AI credentials  - Slack channel with OAuth credentials  **Setup Instructions**  1. Configure the **note taker API** in the **Get Meetings List** and **Summary** nodes.  2. Add your **Gemini AI credentials** to enable summarization.  3. Configure **Slack** to send notifications to the desired channel.  4. Activate the workflow — your team will start receiving automated meeting summaries and action items daily.  **Tip:** You can further customize this workflow by adjusting the trigger schedule, modifying Slack message formatting, or changing the API URL in the HTTP Request node. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**
   - Type: `Schedule Trigger`
   - Parameters: Use default interval or set a daily schedule.
   - Connect output to "Get meetings list".

2. **Create Get meetings list Node**
   - Type: `HTTP Request`
   - Parameters:  
     - URL: `https://api.meetgeek.ai/v1/meetings/`  
     - Authentication: Configure HTTP Bearer Auth credentials with your API token.  
     - Execute Once: Enabled  
   - Connect input from Schedule Trigger.
   - Connect output to "Split meetings".

3. **Create Split meetings Node**
   - Type: `Split Out`
   - Parameters:  
     - Field to split out: `meetings`  
   - Connect input from Get meetings list.
   - Connect output to "Add custom name for meeting id".

4. **Create Add custom name for meeting id Node**
   - Type: `Set`
   - Parameters:
     - Exclude field: `meeting_id`
     - Assign new field:  
       - Name: `extract_meeting_id`  
       - Value: Expression: `={{ $json.meeting_id }}`
     - Include other fields: true
   - Connect input from Split meetings.
   - Connect output to "Format date".

5. **Create Format date Node**
   - Type: `DateTime`
   - Parameters:
     - Operation: Format Date  
     - Date: Expression: `={{ $json.timestamp_start_utc }}`  
     - Format: `yyyy-MM-dd`  
     - Include input fields: true
   - Connect input from Add custom name for meeting id.
   - Connect output to "AI Transform".

6. **Create AI Transform Node**
   - Type: `AI Transform`
   - Parameters:  
     - JS Code:
       ```javascript
       const items = $input.all();
       const today = new Date();
       const oneWeekAgo = new Date();
       oneWeekAgo.setDate(today.getDate() - 7);

       const filteredItems = items.filter((item) => {
         const itemDate = new Date(item?.json?.formattedDate);
         return itemDate >= oneWeekAgo && itemDate <= today;
       });

       return filteredItems;
       ```
     - Instructions: "Filter the formatted Date in the past week upto today"
   - Connect input from Format date.
   - Connect output to "summary" and "AI Agent" (AI Agent input is downstream from summary).

7. **Create summary Node**
   - Type: `HTTP Request Tool`
   - Parameters:
     - URL: Expression: `=https://api.meetgeek.ai/v1/meetings/{{ $json.extract_meeting_id }}/summary/`
     - Authentication: HTTP Bearer Auth using the meeting note-taking API credentials.
   - Connect input from AI Transform.
   - Connect output to AI Agent (agent prompt input).

8. **Create Google Gemini Chat Model Node**
   - Type: `Google Gemini Chat Model` (via LangChain)
   - Credentials: Use configured Google Palm API credential.
   - Connect to AI Agent's `ai_languageModel` input.

9. **Create AI Agent Node**
   - Type: `LangChain AI Agent`
   - Parameters:
     - Prompt text includes:  
       - Instructions to call the summary API node  
       - Generate 3–5 bullet summaries  
       - Extract structured action items with task, owner, deadline  
       - Handle empty notes gracefully  
     - Output format: JSON with `title`, `summary` (array), `action_items` (array of objects)
   - Connect input from AI Transform and summary nodes.
   - Connect to Google Gemini Chat Model node.
   - Connect output to "Restructure to slack block".

10. **Create Restructure to slack block Node**
    - Type: `Code`
    - Parameters:
      - JavaScript code to parse AI output and convert to Slack Block Kit format.
      - The code processes each meeting’s JSON output, creates headers, summaries, action items, and dividers.
    - Connect input from AI Agent.
    - Connect output to "Send a message".

11. **Create Send a message Node**
    - Type: `Slack`
    - Parameters:
      - Channel ID: `C09CV2VC877` (replace with your Slack channel ID)
      - Message Type: Block  
      - Text: Can be defaulted (e.g., "Meeting notes summary")  
      - Blocks: Expression binding to `blocks` from previous node JSON output.  
      - Authentication: Slack OAuth2 credentials.
    - Connect input from Restructure to slack block.

12. **Credential Setup**
    - Configure HTTP Bearer Auth credential with API token for the meeting note-taking app.
    - Configure Google Palm API credential for Gemini AI.
    - Configure Slack OAuth2 credential with permissions to post messages in the target Slack channel.

13. **Final Steps**
    - Activate the workflow.
    - Adjust the schedule as needed.
    - Test to confirm Slack messages contain properly formatted meeting summaries and action items.

---

### 5. General Notes & Resources

| Note Content | Context or Link |
|--------------|-----------------|
| This workflow uses Google Gemini AI (PaLM) for natural language summarization and action item extraction, integrated via the LangChain agent node. | Workflow design context |
| Slack messages use Slack Block Kit format to present clear, structured summaries and action lists, enhancing readability. | Message formatting |
| API URLs and credentials must be configured with valid tokens for your meeting note-taking app and Slack workspace. | Setup instructions |
| Sticky note content within the workflow provides useful summaries for each block and overall usage tips. | Embedded in workflow nodes |
| For more on Slack Block Kit formatting, visit: https://api.slack.com/block-kit | Slack API documentation |

---

**Disclaimer:**  
The provided text originates exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly respects applicable content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.