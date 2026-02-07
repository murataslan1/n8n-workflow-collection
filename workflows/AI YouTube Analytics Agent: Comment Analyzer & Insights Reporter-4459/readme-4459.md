AI YouTube Analytics Agent: Comment Analyzer & Insights Reporter

https://n8nworkflows.xyz/workflows/ai-youtube-analytics-agent--comment-analyzer---insights-reporter-4459


# AI YouTube Analytics Agent: Comment Analyzer & Insights Reporter

---
### 1. Workflow Overview

This workflow automates the analysis of YouTube video comments and generates insightful email reports. It is designed for content creators or marketers who want to monitor audience sentiment, extract key themes, and obtain actionable feedback from YouTube comments systematically.

**Target Use Cases:**
- Automatically processing new or updated video IDs listed in a Google Sheet
- Fetching video metadata and top comments from YouTube
- Performing AI-powered sentiment and thematic analysis on comments
- Generating and sending formatted email reports summarizing insights
- Updating the processing status to avoid duplicate work

**Logical Blocks:**

- **1.1 Input Reception & Filtering:** Triggered by Google Sheets changes to select videos with status "Pending".
- **1.2 YouTube Data Collection:** Fetches video metadata and relevant comments.
- **1.3 Data Preparation:** Extracts and preprocesses comment data for AI analysis.
- **1.4 AI Sentiment & Insights Analysis:** Uses OpenAI GPT-4o to analyze comments and generate structured insights.
- **1.5 Email Report Generation:** Converts AI output into a professional HTML email.
- **1.6 Email Dispatch & Status Update:** Sends email via Gmail and updates Google Sheet status to "Mail Sent".

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Filtering

**Overview:**  
This block listens for changes in a Google Sheet, filtering rows to process only videos marked with the status "Pending".

**Nodes Involved:**  
- Pick Video Ids from Google sheet  
- If  
- Limit  

**Node Details:**

- **Pick Video Ids from Google sheet**  
  - Type: Google Sheets Trigger  
  - Role: Monitors a Google Sheet every minute for new or updated rows.  
  - Configuration: Poll interval set to every minute; target sheet identified by documentId and gid=0.  
  - Inputs: None (trigger node).  
  - Outputs: Emits updated spreadsheet rows.  
  - Edge Cases: Network issues or permission denials on the Google Sheet; malformed data in the sheet.  
  - Sticky Note: Describes required sheet structure with columns: ID, Video Title, YouTube Video ID, and Status.  

- **If**  
  - Type: Conditional Filter  
  - Role: Filters incoming rows to continue only if the "Status" field equals "Pending".  
  - Configuration: Case-sensitive strict string equality check on `$json.Status == "Pending"`.  
  - Inputs: Data from Google Sheets Trigger.  
  - Outputs: Routes matching items to next nodes, else stops processing.  
  - Edge Cases: Missing or misspelled "Status" field; unexpected case differences.  
  - Sticky Note: Emphasizes filtering pending videos only.  

- **Limit**  
  - Type: Limit Node  
  - Role: Restricts processing to one item at a time to avoid API overload and rate limits.  
  - Configuration: Default limit of 1 item per execution.  
  - Inputs: Filtered rows from If node.  
  - Outputs: Single item to next node.  
  - Edge Cases: Bottleneck if many pending rows; can be adjusted for concurrency.  
  - Sticky Note: Notes processing limit to avoid API overload.  

---

#### 2.2 YouTube Data Collection

**Overview:**  
This logical block retrieves video metadata and the top 100 comments ordered by relevance for the selected video ID.

**Nodes Involved:**  
- Set Video Details  
- Get Youtube Video Details  
- Get Youtube Video Comments  

**Node Details:**

- **Set Video Details**  
  - Type: Set Node  
  - Role: Assigns the video ID from the Google Sheet and sets a max comment limit (100).  
  - Configuration: Extracts `videoId` from `Youtube video id` field; sets `maxComments` to 100.  
  - Inputs: Limited single item from Limit node.  
  - Outputs: Enriched data with videoId and maxComments.  
  - Edge Cases: Invalid or missing video IDs.  
  - Sticky Note: Prepares videoId and comment limit.

- **Get Youtube Video Details**  
  - Type: YouTube node  
  - Role: Fetches metadata for the video such as title and channel info.  
  - Configuration: Uses `videoId` from previous node; operation "get" on resource "video".  
  - Inputs: From Set Video Details.  
  - Outputs: Video metadata JSON.  
  - Edge Cases: API quota exceeded; invalid video ID; video removed or private.  
  - Sticky Note: Fetches video metadata including title, channel.

- **Get Youtube Video Comments**  
  - Type: HTTP Request  
  - Role: Retrieves up to 100 top-level comments ordered by relevance.  
  - Configuration: Calls YouTube API endpoint `commentThreads` with query parameters part=snippet, videoId, maxResults=100, order=relevance; uses OAuth2 credentials for authentication.  
  - Inputs: From Get Youtube Video Details.  
  - Outputs: Raw comments JSON array.  
  - Edge Cases: API quota limits; private or disabled comments on video; network errors.  
  - Sticky Note: Notes API limits and comment fetch specifics.

---

#### 2.3 Data Preparation

**Overview:**  
Processes raw comment data to extract text, author, likes, replies; calculates basic statistics and sentiment counts; limits comments to 50 for AI analysis.

**Nodes Involved:**  
- Prepare Comments Data  

**Node Details:**

- **Prepare Comments Data**  
  - Type: Code Node (JavaScript)  
  - Role: Parses YouTube comments JSON, extracts key fields, computes stats (total comments, avg likes, replies), performs simple keyword-based sentiment counts, limits comment texts to 50 for AI.  
  - Configuration: JavaScript code using inputs from Get Youtube Video Comments and Get Youtube Video Details nodes; outputs structured JSON with processedComments, stats, and commentTexts string.  
  - Inputs: Raw comments JSON.  
  - Outputs: JSON with videoTitle, totalComments, avgLikes, totalReplies, topComments, commentTexts, sentimentCounts.  
  - Edge Cases: Unexpected API response structure; empty or missing comments; potential runtime errors in code.  
  - Sticky Note: Warns about data preparation scope and comment limit for token usage.

---

#### 2.4 AI Sentiment & Insights Analysis

**Overview:**  
Uses OpenAI GPT-4o model to analyze the prepared comment texts and generate a structured JSON output of sentiment breakdown, themes, questions, feedback, and actionable insights.

**Nodes Involved:**  
- AI Agent  
- OpenAI Chat Model  

**Node Details:**

- **AI Agent**  
  - Type: Langchain Agent (OpenAI GPT-4o)  
  - Role: Sends comments and metadata to GPT-4o with a custom prompt requesting detailed analysis and structured JSON response.  
  - Configuration:  
    - Text input dynamically built including video title, total comments, avg likes, and comment texts.  
    - System message instructs the model to provide sentiment percentages, main themes, questions, feedback, and insights in JSON keys with underscores.  
    - Max iterations set to 100 for processing.  
  - Inputs: Data from Prepare Comments Data node; AI language model response from OpenAI Chat Model node.  
  - Outputs: Structured AI analysis JSON.  
  - Edge Cases: API rate limits; incomplete or malformed AI output; prompt failure.  
  - Sticky Note: Describes AI analysis goals and output format; prompt is customizable.

- **OpenAI Chat Model**  
  - Type: Langchain OpenAI Chat Model  
  - Role: Provides GPT-4o-minimal model interface for AI Agent node.  
  - Configuration: Model set to "gpt-4o-mini", response format set to JSON object.  
  - Inputs: Text prompt from AI Agent node.  
  - Outputs: AI-generated JSON response.  
  - Edge Cases: API authentication or quota errors; network issues.

---

#### 2.5 Email Report Generation

**Overview:**  
Transforms AI analysis JSON into a professional HTML email containing statistics, insights, and formatted sections ready for sending.

**Nodes Involved:**  
- Prepare HTML for Email  

**Node Details:**

- **Prepare HTML for Email**  
  - Type: Code Node (JavaScript)  
  - Role: Parses AI output JSON, constructs HTML sections with styles including quick stats, common questions, feedback points, and actionable insights; embeds video title and timestamps; prepares email subject.  
  - Configuration: Runs once per item; accesses previous nodes for data; uses template literals for HTML.  
  - Inputs: AI Agent node output.  
  - Outputs: JSON with `emailHTML`, `subject`, and `videoTitle`.  
  - Edge Cases: Missing or malformed AI JSON keys; HTML injection risks if inputs are unescaped; date/time formatting issues.  
  - Sticky Note: Details content and style of the email report.

---

#### 2.6 Email Dispatch & Status Update

**Overview:**  
Sends the formatted email via Gmail and updates the Google Sheet status to "Mail Sent" to avoid reprocessing.

**Nodes Involved:**  
- Gmail Account Configuration  
- Update Status on Google Sheet  

**Node Details:**

- **Gmail Account Configuration**  
  - Type: Gmail Node  
  - Role: Sends the HTML email report to a specified recipient.  
  - Configuration: Recipient email address configured (placeholder SENDER_EMAIL_ADDRESS must be updated); subject and message body set dynamically from previous node.  
  - Inputs: Email content from Prepare HTML for Email.  
  - Outputs: Confirmation of email sent.  
  - Edge Cases: Invalid recipient email; Gmail API quota issues; authentication errors.  
  - Sticky Note: Reminds to update recipient email.

- **Update Status on Google Sheet**  
  - Type: Google Sheets  
  - Role: Updates the video row's "Status" column to "Mail Sent" to mark completion.  
  - Configuration: Matches row by unique "Id" from Google Sheet; updates "Status" field; uses same Google Sheet and sheet name as trigger node.  
  - Inputs: From Gmail node indicating email sent.  
  - Outputs: Confirmation of update.  
  - Edge Cases: Concurrent updates causing race conditions; sheet access or permission issues.  
  - Sticky Note: Explains update prevents duplicate processing.

---

### 3. Summary Table

| Node Name                   | Node Type                      | Functional Role                                   | Input Node(s)             | Output Node(s)                | Sticky Note                                                                                                 |
|-----------------------------|--------------------------------|-------------------------------------------------|---------------------------|------------------------------|-------------------------------------------------------------------------------------------------------------|
| Sticky Note12               | Sticky Note                    | Workflow support info                             | None                      | None                         | For any questions or support, contact Yaron@nofluff.online. Links: YouTube and LinkedIn                      |
| Workflow Overview           | Sticky Note                    | Describes workflow purpose and steps             | None                      | None                         | Summary of workflow purpose, schedule, and steps                                                           |
| Trigger Documentation       | Sticky Note                    | Explains Google Sheets trigger and sheet structure| None                      | None                         | Sheet columns and trigger notes; status must be "Pending"                                                  |
| YouTube API Section         | Sticky Note                    | Describes YouTube data collection details         | None                      | None                         | Notes API limits and comment fetch details                                                                 |
| AI Analysis Documentation   | Sticky Note                    | Describes AI analysis goals and output format     | None                      | None                         | GPT-4o analysis details; prompt customization advice                                                        |
| Email & Status Update       | Sticky Note                    | Explains email content and status update          | None                      | None                         | Email report contents and Google Sheet status update reminder                                              |
| Data Processing Note        | Sticky Note                    | Explains comment data preparation                  | None                      | None                         | Extracts comment texts, calculates stats, limits to 50 comments for AI                                     |
| Pick Video Ids from Google sheet | Google Sheets Trigger       | Triggers workflow on sheet changes                 | None                      | If                           | Triggers on new or updated video IDs; polls every minute                                                   |
| If                         | If                            | Filters rows to only process "Pending" videos      | Pick Video Ids from Google sheet | Limit                     | Filters rows where Status equals "Pending"                                                                 |
| Limit                      | Limit                         | Limits processing to 1 item at a time              | If                        | Set Video Details             | Limits to prevent API overload                                                                              |
| Set Video Details           | Set                           | Sets videoId and maxComments (100)                 | Limit                     | Get Youtube Video Details     | Prepares videoId and comment limit                                                                          |
| Get Youtube Video Details   | YouTube                       | Fetches video metadata                              | Set Video Details          | Get Youtube Video Comments    | Retrieves title, channel name, and other video details                                                     |
| Get Youtube Video Comments  | HTTP Request                  | Retrieves top 100 comments ordered by relevance    | Get Youtube Video Details  | Prepare Comments Data         | Uses YouTube API; OAuth2 authentication required                                                           |
| Prepare Comments Data       | Code                          | Processes comments, calculates stats, basic sentiment | Get Youtube Video Comments | AI Agent                    | Extracts comment texts, calculates stats, limits to 50 for AI                                             |
| OpenAI Chat Model           | Langchain OpenAI Chat Model   | Provides GPT-4o model interface                     | AI Agent                  | AI Agent                     | GPT-4o-mini model configuration                                                                             |
| AI Agent                   | Langchain Agent               | Sends comments to GPT-4o for detailed analysis     | Prepare Comments Data, OpenAI Chat Model | Prepare HTML for Email | Custom prompt for sentiment and thematic analysis; structured JSON output                                   |
| Prepare HTML for Email      | Code                          | Converts AI output to styled HTML email             | AI Agent                  | Gmail Account Configuration    | Generates professional email with stats and insights                                                       |
| Gmail Account Configuration | Gmail                         | Sends the analysis email                            | Prepare HTML for Email     | Update Status on Google Sheet | Update recipient email address                                                                              |
| Update Status on Google Sheet | Google Sheets                | Updates video status to "Mail Sent"                 | Gmail Account Configuration | None                        | Marks video as processed to prevent duplicate analysis                                                     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Sheets Trigger Node ("Pick Video Ids from Google sheet")**  
   - Type: Google Sheets Trigger  
   - Poll interval: every minute  
   - Document ID and Sheet: Use your Google Sheet containing columns: Id, Video Title, Youtube video id, Status  
   - Permissions: OAuth2 credentials with read access  

2. **Create If Node ("If")**  
   - Type: If  
   - Condition: `$json.Status` equals "Pending" (case sensitive)  
   - Connect input from Google Sheets Trigger (main output)  
   - Output main connected to Limit node  

3. **Create Limit Node ("Limit")**  
   - Type: Limit  
   - Limit to 1 item per execution  
   - Connect input from If node main output  
   - Connect output to Set Video Details node  

4. **Create Set Node ("Set Video Details")**  
   - Type: Set  
   - Assign fields:  
     - `videoId` = `{{$json["Youtube video id"]}}`  
     - `maxComments` = 100 (number)  
   - Connect input from Limit node  
   - Output connects to Get Youtube Video Details  

5. **Create YouTube Node ("Get Youtube Video Details")**  
   - Type: YouTube (native n8n node)  
   - Operation: Get video details  
   - Video ID: `{{$json.videoId}}`  
   - Connect input from Set Video Details  
   - Output connects to HTTP Request node for comments  

6. **Create HTTP Request Node ("Get Youtube Video Comments")**  
   - Type: HTTP Request  
   - Method: GET  
   - URL: `https://www.googleapis.com/youtube/v3/commentThreads`  
   - Query Parameters:  
     - `part=snippet`  
     - `videoId={{$json.videoId}}`  
     - `maxResults=100`  
     - `order=relevance`  
   - Authentication: YouTube OAuth2 credentials  
   - Connect input from Get Youtube Video Details  
   - Output connects to Code Node for comment preparation  

7. **Create Code Node ("Prepare Comments Data")**  
   - Type: Code (JavaScript)  
   - Paste the provided script that extracts comment text, calculates stats, performs basic sentiment analysis, limits comments to 50, and outputs structured JSON  
   - Connect input from Get Youtube Video Comments  
   - Output connects to AI Agent  

8. **Create Langchain OpenAI Chat Model Node ("OpenAI Chat Model")**  
   - Type: Langchain OpenAI Chat Model  
   - Model: gpt-4o-mini  
   - Response format: JSON object  
   - Requires OpenAI API credentials configured in n8n  

9. **Create Langchain Agent Node ("AI Agent")**  
   - Type: Langchain Agent  
   - Text input: Template with video title, total comments, avg likes, and comment texts from "Prepare Comments Data"  
   - System message: Instructs GPT-4o to analyze comments producing structured JSON keys: overall_sentiment_breakdown, main_themes, common_questions, key_feedback_points, actionable_insights  
   - Max iterations: 100  
   - Connect AI language model input to OpenAI Chat Model node  
   - Connect input from Prepare Comments Data  
   - Output connects to Code Node for email preparation  

10. **Create Code Node ("Prepare HTML for Email")**  
    - Type: Code (JavaScript)  
    - Paste provided script that formats the AI JSON output into an HTML email with statistics, questions, feedback, and insights  
    - Connect input from AI Agent node  
    - Output connects to Gmail node  

11. **Create Gmail Node ("Gmail Account Configuration")**  
    - Type: Gmail  
    - Recipient: Replace placeholder `SENDER_EMAIL_ADDRESS` with actual email address  
    - Subject: Use `{{$json.subject}}` from previous node  
    - Message: Use `{{$json.emailHTML}}` as HTML content  
    - Credentials: Gmail OAuth2 credentials with send mail permission  
    - Connect input from Prepare HTML for Email  
    - Output connects to Google Sheets node for status update  

12. **Create Google Sheets Node ("Update Status on Google Sheet")**  
    - Type: Google Sheets  
    - Operation: Update row  
    - Sheet: Same as trigger node  
    - Matching column: Id  
    - Values to update: Status = "Mail Sent"  
    - Connect input from Gmail Account Configuration  

13. **Add Sticky Notes**  
    - Add sticky notes with relevant documentation and instructions as per workflow overview and node comments to guide users.

---

### 5. General Notes & Resources

| Note Content                                                                                                      | Context or Link                                                                                         |
|------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| Workflow assistance contact: Yaron@nofluff.online                                                                | Support email for questions                                                                            |
| YouTube tips and tutorials by Yaron Been                                                                         | https://www.youtube.com/@YaronBeen/videos                                                             |
| LinkedIn profile for professional outreach                                                                       | https://www.linkedin.com/in/yaronbeen/                                                                |
| Reminder: Update recipient email address in Gmail node before deployment                                          | Workflow Email & Update Section                                                                        |
| Google Sheet must have columns: Id, Video Title, Youtube video id, Status                                        | Trigger Documentation sticky note                                                                      |
| AI Agent prompt is customizable for different analysis needs                                                     | AI Analysis Documentation sticky note                                                                  |
| API quota limits and YouTube comment retrieval restrictions                                                     | YouTube API Section sticky note                                                                         |
| Limit processing concurrency to avoid exceeding API and AI rate limits                                          | Data Processing Note and Limit node sticky notes                                                       |

---

**Disclaimer:** The provided text and analysis derive exclusively from a fully automated n8n workflow designed for lawful, public data processing. It respects all content policies and contains no illegal or offensive materials.