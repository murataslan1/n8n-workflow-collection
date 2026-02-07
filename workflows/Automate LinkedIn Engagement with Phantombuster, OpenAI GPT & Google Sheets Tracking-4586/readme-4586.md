Automate LinkedIn Engagement with Phantombuster, OpenAI GPT & Google Sheets Tracking

https://n8nworkflows.xyz/workflows/automate-linkedin-engagement-with-phantombuster--openai-gpt---google-sheets-tracking-4586


# Automate LinkedIn Engagement with Phantombuster, OpenAI GPT & Google Sheets Tracking

---

### 1. Workflow Overview

This workflow automates LinkedIn post engagement by integrating Phantombuster’s LinkedIn scraping agents, OpenAI’s GPT language model for comment generation, and Google Sheets for logging interactions. It is designed to run daily at 9 AM and perform the following logical blocks:

- **1.1 Trigger and Data Collection:** Automatically initiate LinkedIn post scraping from specified profiles using Phantombuster agents and retrieve the scraped data.
  
- **1.2 AI-Based Content Analysis and Comment Generation:** Use an AI agent connected to OpenAI GPT to analyze post content and generate personalized, professional comments.

- **1.3 Post Engagement Automation:** Like the LinkedIn post and publish the AI-generated comment via Phantombuster agents to increase engagement and visibility.

- **1.4 Result Logging and Storage:** Append all relevant data — including post details and generated comments — to a Google Sheets document for tracking and auditing.

---

### 2. Block-by-Block Analysis

#### 2.1 Trigger and Data Collection

**Overview:**  
This block triggers daily execution and collects LinkedIn posts from specified profiles using Phantombuster’s scraping API.

**Nodes Involved:**  
- Daily Trigger - 9 AM  
- LinkedIn Posts Scraper  
- Fetch Scraper Results

**Node Details:**

- **Daily Trigger - 9 AM**  
  - **Type:** Schedule Trigger  
  - **Role:** Initiates workflow execution every day at 9:00 AM automatically.  
  - **Configuration:** Set to trigger daily at hour=9, no additional parameters.  
  - **Connections:** Output → LinkedIn Posts Scraper  
  - **Edge Cases:** Workflow will not run if n8n instance is down at trigger time or if scheduling is misconfigured.

- **LinkedIn Posts Scraper**  
  - **Type:** HTTP Request (POST)  
  - **Role:** Starts the Phantombuster LinkedIn Profile Posts Scraper agent.  
  - **Configuration:**  
    - URL: `https://api.phantombuster.com/api/v2/agent/launch`  
    - Method: POST  
    - JSON Body includes:  
      - `id`: Phantombuster agent ID (placeholder: `YOUR_AGENT_ID`)  
      - `arguments`: profileUrls (array with LinkedIn profile URL), numberOfPosts: 1  
    - Headers include Phantombuster API key (`X-Phantombuster-Key-1`).  
  - **Connections:** Output → Fetch Scraper Results  
  - **Edge Cases:** Invalid API key, incorrect agent ID, network issues, or profile URLs not accessible may cause failure.

- **Fetch Scraper Results**  
  - **Type:** HTTP Request (GET)  
  - **Role:** Retrieves the output data from the Phantombuster scraping agent.  
  - **Configuration:**  
    - URL: `https://api.phantombuster.com/api/v2/agent/fetch-output`  
    - Query parameter: `id` with Phantombuster agent ID  
    - Headers include Phantombuster API key.  
  - **Connections:** Output → Commenter Agent  
  - **Edge Cases:** Delayed availability of scrape results, API errors, empty or malformed data.

---

#### 2.2 AI-Based Content Analysis and Comment Generation

**Overview:**  
This block analyzes scraped LinkedIn post content and uses OpenAI GPT to generate personalized, relevant comments.

**Nodes Involved:**  
- Commenter Agent  
- Comment Generation Model

**Node Details:**

- **Commenter Agent**  
  - **Type:** Langchain AI Agent (n8n node)  
  - **Role:** Acts as a mediator, formatting LinkedIn post data and sending it to the AI model for comment generation.  
  - **Configuration:**  
    - Prompt instructs the agent to act as a professional LinkedIn marketer writing concise, thoughtful comments.  
    - Inputs: Extracted post details such as author name, profile, post URL, date, and content from previous node’s JSON.  
    - Output: Generated comment text (1–2 sentences), no extra formatting or filler text.  
  - **Connections:**  
    - AI language model input → Comment Generation Model  
    - Main output → Like LinkedIn Post, Post LinkedIn Comment  
  - **Edge Cases:** Expression evaluation errors, malformed input data, or AI API failures.

- **Comment Generation Model**  
  - **Type:** OpenAI Chat Completion (GPT Model)  
  - **Role:** Generates comments based on the prompt and input post data.  
  - **Configuration:**  
    - Model: `gpt-4o-mini` (GPT-4 variant, lightweight)  
    - Credentials: OpenAI API key configured in n8n credentials.  
  - **Connections:** Output → Commenter Agent (AI languageModel)  
  - **Edge Cases:** API rate limits, authentication errors, model downtime, unexpected output formats.

---

#### 2.3 Post Engagement Automation

**Overview:**  
This block interacts with LinkedIn posts by liking and posting comments using Phantombuster agents.

**Nodes Involved:**  
- Like LinkedIn Post  
- Post LinkedIn Comment

**Node Details:**

- **Like LinkedIn Post**  
  - **Type:** HTTP Request (POST)  
  - **Role:** Sends request to Phantombuster to like the specified LinkedIn post.  
  - **Configuration:**  
    - URL: `https://api.phantombuster.com/api/v2/agent/launch`  
    - JSON Body includes liker agent ID (`YOUR_LIKER_AGENT_ID`), and `postUrls` array with the post URL extracted from fetched data.  
    - Headers include Phantombuster API key.  
  - **Connections:** Output → Log Activity to Sheet  
  - **Edge Cases:** Invalid liker agent ID, API key problems, post URL format errors, rate limits.

- **Post LinkedIn Comment**  
  - **Type:** HTTP Request (POST)  
  - **Role:** Posts the AI-generated comment to the LinkedIn post via Phantombuster.  
  - **Configuration:**  
    - URL: `https://api.phantombuster.com/api/v2/agent/launch`  
    - JSON Body includes commenter agent ID (`YOUR_COMMENTER_AGENT_ID`), `postUrls` with post URL, and `comments` with AI-generated comment text.  
    - Headers include Phantombuster API key.  
  - **Connections:** Output → Log Activity to Sheet  
  - **Edge Cases:** Invalid commenter agent ID, empty or malformed comment, API failures, rate limits.

---

#### 2.4 Result Logging and Storage

**Overview:**  
Logs detailed information about each interaction into a Google Sheets document for tracking and analysis.

**Nodes Involved:**  
- Log Activity to Sheet

**Node Details:**

- **Log Activity to Sheet**  
  - **Type:** Google Sheets (Append)  
  - **Role:** Appends a new row with post details, generated comment, and timestamps into a Google Sheet.  
  - **Configuration:**  
    - Operation: Append  
    - Document ID: Spreadsheet ID (`15h8fYaIVsC7HZf5-KsPA8tx-459ulURB5UEMC62Khzk`)  
    - Sheet Name: `gid=0` (Sheet1)  
    - Columns mapped: AuthorName, AuthorProfile, PostUrl, Post text, Comment, Timestamp  
    - Data is pulled from previous nodes’ JSON outputs for each column.  
    - Credentials: Google Sheets OAuth2 account configured in n8n.  
  - **Connections:** None (workflow end node)  
  - **Edge Cases:** Authentication errors, Google Sheets API rate limits, permission issues, invalid spreadsheet ID.

---

### 3. Summary Table

| Node Name              | Node Type                       | Functional Role                       | Input Node(s)         | Output Node(s)           | Sticky Note                                                                                         |
|------------------------|--------------------------------|-------------------------------------|-----------------------|--------------------------|---------------------------------------------------------------------------------------------------|
| Daily Trigger - 9 AM    | Schedule Trigger                | Daily workflow initiation            | —                     | LinkedIn Posts Scraper    | Triggers workflow automatically every day at 9 AM                                                |
| LinkedIn Posts Scraper  | HTTP Request (POST)             | Start LinkedIn post scraping agent   | Daily Trigger - 9 AM   | Fetch Scraper Results     | Starts Phantombuster LinkedIn posts scraper                                                       |
| Fetch Scraper Results   | HTTP Request (GET)              | Retrieve scraped LinkedIn posts      | LinkedIn Posts Scraper | Commenter Agent          | Fetches results from Phantombuster scraper                                                        |
| Commenter Agent         | Langchain AI Agent              | Generate LinkedIn post comment       | Fetch Scraper Results  | Like LinkedIn Post, Post LinkedIn Comment | Mediates between post data and AI model for comment generation                           |
| Comment Generation Model| OpenAI Chat Completion (GPT)   | AI model for comment generation      | Commenter Agent (AI LM)| Commenter Agent (AI LM)  | Uses GPT-4 model to generate personalized comments                                               |
| Like LinkedIn Post      | HTTP Request (POST)             | Like LinkedIn post                   | Commenter Agent        | Log Activity to Sheet     | Sends request to like LinkedIn post via Phantombuster                                            |
| Post LinkedIn Comment   | HTTP Request (POST)             | Post AI-generated comment            | Commenter Agent        | Log Activity to Sheet     | Posts AI-generated comment to LinkedIn post via Phantombuster                                    |
| Log Activity to Sheet   | Google Sheets Append            | Log all activity in Google Sheet     | Like LinkedIn Post, Post LinkedIn Comment | —                      | Appends post, comment, and author info with timestamp to Google Sheets                           |
| Sticky Note             | Sticky Note                    | Documentation and explanation        | —                     | —                        | Section 1: Trigger and Data Collection                                                           |
| Sticky Note1            | Sticky Note                    | Documentation and explanation        | —                     | —                        | Section 2: AI-Based Content Analysis and Comment Generation                                      |
| Sticky Note2            | Sticky Note                    | Documentation and explanation        | —                     | —                        | Section 3: Post Engagement Automation                                                            |
| Sticky Note3            | Sticky Note                    | Documentation and explanation        | —                     | —                        | Section 4: Result Logging and Storage                                                            |
| Sticky Note4            | Sticky Note                    | Documentation and explanation        | —                     | —                        | Comprehensive workflow overview and instructions                                                |
| Sticky Note9            | Sticky Note                    | Contact and support info              | —                     | —                        | Workflow assistance and support contacts                                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Name: `Daily Trigger - 9 AM`  
   - Type: Schedule Trigger  
   - Set trigger to daily at 9:00 AM  
   - No credentials needed

2. **Create HTTP Request Node to Start LinkedIn Posts Scraper**  
   - Name: `LinkedIn Posts Scraper`  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://api.phantombuster.com/api/v2/agent/launch`  
   - Headers: `X-Phantombuster-Key-1` with your Phantombuster API key  
   - Body Type: JSON  
   - JSON Body:
     ```json
     {
       "id": "YOUR_AGENT_ID",
       "arguments": {
         "profileUrls": [
           "https://www.linkedin.com/in/USERNAME/"
         ],
         "numberOfPosts": 1
       },
       "save": false
     }
     ```  
   - Connect output from `Daily Trigger - 9 AM` to this node

3. **Create HTTP Request Node to Fetch Scraper Results**  
   - Name: `Fetch Scraper Results`  
   - Type: HTTP Request  
   - Method: GET  
   - URL: `https://api.phantombuster.com/api/v2/agent/fetch-output`  
   - Query Parameters: `id` = `YOUR_AGENT_ID`  
   - Headers: `X-Phantombuster-Key-1` with your Phantombuster API key  
   - Connect output from `LinkedIn Posts Scraper` to this node

4. **Create Langchain AI Agent Node**  
   - Name: `Commenter Agent`  
   - Type: Langchain AI Agent  
   - Configure prompt as:  
     ```
     You are a professional LinkedIn marketer. Your job is to write engaging, thoughtful, and relevant comments for posts to increase visibility and connection with the author.

     Here is the latest LinkedIn post:

     Author: {{ $json.authorName }}
     Profile: {{ $json.authorProfile }}
     Post URL: {{ $json.postUrl }}
     Date: {{ $json.date }}
     Content:
     """
     {{ $json.text }}
     """

     Write a concise and personalized comment (1–2 sentences max) that:
     - Adds value to the conversation
     - Feels human and not generic
     - Avoids spammy language
     - Uses a positive and professional tone

     Only return the comment text. Do not include quotation marks or any intro.
     ```  
   - Connect output from `Fetch Scraper Results` to this node

5. **Create OpenAI Chat Completion Node**  
   - Name: `Comment Generation Model`  
   - Type: OpenAI Chat Completion (GPT)  
   - Model: `gpt-4o-mini` or preferred GPT-4 model  
   - Set OpenAI credential with valid API key  
   - Connect AI language model input from `Commenter Agent` node to this node

6. **Connect `Comment Generation Model` output back to `Commenter Agent`**  
   - This completes the AI prompt-response loop

7. **Create HTTP Request Node to Like LinkedIn Post**  
   - Name: `Like LinkedIn Post`  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://api.phantombuster.com/api/v2/agent/launch`  
   - Headers: `X-Phantombuster-Key-1` with your Phantombuster API key  
   - JSON Body:
     ```json
     {
       "id": "YOUR_LIKER_AGENT_ID",
       "arguments": {
         "postUrls": [
           "{{ $('Fetch Scraper Results').item.json.postUrl }}"
         ]
       },
       "save": false
     }
     ```  
   - Connect main output from `Commenter Agent` to this node

8. **Create HTTP Request Node to Post LinkedIn Comment**  
   - Name: `Post LinkedIn Comment`  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://api.phantombuster.com/api/v2/agent/launch`  
   - Headers: `X-Phantombuster-Key-1` with your Phantombuster API key  
   - JSON Body:
     ```json
     {
       "id": "YOUR_COMMENTER_AGENT_ID",
       "arguments": {
         "postUrls": [
           "{{ $('Fetch Scraper Results').item.json.postUrl }}"
         ],
         "comments": [
           "{{ $json.output }}"
         ]
       },
       "save": false
     }
     ```  
   - Connect main output from `Commenter Agent` to this node

9. **Create Google Sheets Node to Log Activity**  
   - Name: `Log Activity to Sheet`  
   - Type: Google Sheets  
   - Operation: Append  
   - Document ID: Your Google Spreadsheet ID  
   - Sheet Name: The sheet’s GID or name (e.g., `gid=0`)  
   - Map columns as:  
     - AuthorName: `={{ $('Fetch Scraper Results').item.json.authorName }}`  
     - AuthorProfile: `={{ $('Fetch Scraper Results').item.json.authorProfile }}`  
     - PostUrl: `={{ $('Fetch Scraper Results').item.json.postUrl }}`  
     - Post text: `={{ $('Fetch Scraper Results').item.json.text }}`  
     - Comment: `={{ $('Commenter Agent').item.json.output }}`  
     - Timestamp: `={{ $('Fetch Scraper Results').item.json.timestamp }}`  
   - Set up Google Sheets OAuth2 credentials with access to the spreadsheet  
   - Connect outputs from `Like LinkedIn Post` and `Post LinkedIn Comment` to this node

10. **Validate and test workflow**  
    - Ensure API keys and agent IDs are correctly set  
    - Confirm that all expressions resolve without errors  
    - Test with a sample LinkedIn profile URL and verify comments are posted and logged

---

### 5. General Notes & Resources

| Note Content                                                                                                   | Context or Link                                                                                     |
|----------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| Workflow runs daily at 9 AM to ensure consistent LinkedIn engagement automation                               | Scheduling setup in `Daily Trigger - 9 AM` node                                                    |
| Phantombuster API keys and agent IDs must be correctly configured for scraping, liking, and commenting       | Phantombuster official docs: https://phantombuster.com/api                                        |
| OpenAI GPT API key is required; model version `gpt-4o-mini` used here but can be updated to latest available models | OpenAI docs: https://platform.openai.com/docs/models                                              |
| Google Sheets OAuth2 credentials must have write permissions to append data into the target spreadsheet       | Google Sheets API docs: https://developers.google.com/sheets/api                                  |
| Suggested future improvements: error handling, filtering posts, sentiment analysis, reporting via Slack or email | See Sticky Note4 content for enhancement ideas                                                   |
| Workflow support and contact: Yaron@nofluff.online                                                           | YouTube: https://www.youtube.com/@YaronBeen/videos, LinkedIn: https://www.linkedin.com/in/yaronbeen/ |

---

**Disclaimer:**  
The text provided is exclusively sourced from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with applicable content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.

---