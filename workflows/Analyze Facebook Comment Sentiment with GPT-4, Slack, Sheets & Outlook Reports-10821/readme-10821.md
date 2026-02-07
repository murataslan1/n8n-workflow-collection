Analyze Facebook Comment Sentiment with GPT-4, Slack, Sheets & Outlook Reports

https://n8nworkflows.xyz/workflows/analyze-facebook-comment-sentiment-with-gpt-4--slack--sheets---outlook-reports-10821


# Analyze Facebook Comment Sentiment with GPT-4, Slack, Sheets & Outlook Reports

### 1. Workflow Overview

This workflow is designed to monitor Facebook posts and their comments daily, analyze the audience sentiment using GPT-4 AI, and distribute the results through Slack alerts, Google Sheets logging, and daily Outlook email reports. It enables social media teams to quickly identify negative engagement and keep a historical record of sentiment trends to inform content strategy.

The workflow is logically divided into these blocks:

- **1.1 Trigger & Data Collection:** Scheduled daily trigger fetches recent Facebook posts with reactions and comments.
- **1.2 Data Formatting:** Normalizes raw Facebook Graph API data into a structured format suitable for AI processing.
- **1.3 AI Sentiment Analysis:** Uses GPT-4 via a LangChain agent to analyze sentiment of posts and comments, producing structured JSON output.
- **1.4 Routing Logic:** Routes processed sentiment data based on overall comment sentiment score to different paths for alerts, logging, or reporting.
- **1.5 Alerts & Reporting:** Sends Slack alerts for negative sentiment posts and logs all sentiment data into Google Sheets; composes and sends a daily HTML report via Outlook.
- **1.6 Error Handling:** Catches workflow errors and sends detailed Slack notifications for prompt debugging.

---

### 2. Block-by-Block Analysis

#### 2.1 Trigger & Data Collection

- **Overview:** This block triggers the workflow once daily and fetches recent Facebook posts along with their reactions and comments using the Facebook Graph API.
- **Nodes Involved:**  
  - Trigger - Daily Sentiment Analysis  
  - Fetch Recent Facebook Posts  
  - Data Collection Group (Sticky Note)
- **Node Details:**

  - **Trigger - Daily Sentiment Analysis**  
    - Type: Schedule Trigger  
    - Configuration: Triggers daily at 10:00 AM  
    - Inputs: None (start node)  
    - Outputs: Triggers next node to fetch posts  
    - Failures: Trigger misconfiguration or scheduling issues  
    - Notes: Modify trigger time as needed for business hours  

  - **Fetch Recent Facebook Posts**  
    - Type: Facebook Graph API  
    - Configuration:  
      - Edge: `posts`  
      - Fields fetched include post ID, message, story, creation time, permalink, full picture, attachments, shares, likes, comments, reactions, and page info  
      - API Version: v23.0  
    - Inputs: Trigger node  
    - Outputs: Raw posts data (complex nested JSON)  
    - Failures: Facebook API auth errors, rate limits, missing permissions  
    - Credentials: Facebook Graph API credentials required  

#### 2.2 Data Formatting

- **Overview:** Normalizes and restructures the complex Facebook API JSON into a consistent and enriched format, preparing data for AI sentiment analysis.
- **Nodes Involved:**  
  - Format Facebook Data (Code Node)  
  - Sticky Note: Data Formatting  
- **Node Details:**

  - **Format Facebook Data (Code Node)**  
    - Type: Code (JavaScript)  
    - Configuration: Parses input, maps posts and detailed comments into a flattened, enriched structure with metadata (e.g., comment counts, media details, engagement metrics)  
    - Inputs: Output from Fetch Recent Facebook Posts  
    - Outputs: Array of formatted post objects, each with nested comment data ready for AI analysis  
    - Failures: Parsing errors if Facebook data structure changes; empty or malformed input  
    - Notes: Robust handling of various Facebook JSON formats to prevent runtime errors  

#### 2.3 AI Sentiment Analysis

- **Overview:** Applies GPT-4 via LangChain Agent to analyze sentiment of each Facebook post and its comments. Outputs detailed sentiment scores, labels, and explanations in JSON.
- **Nodes Involved:**  
  - 💬 Agent - Sentiment & Tone Evaluator  
  - LLM - OpenAI GPT-4 Model  
  - Memory Buffer - Session Context  
  - Structured JSON Parser  
  - AI Analysis Group (Sticky Note)
- **Node Details:**

  - **💬 Agent - Sentiment & Tone Evaluator**  
    - Type: LangChain Agent  
    - Configuration:  
      - Prompt instructs AI to analyze the emotional tone of the post and each comment, outputting strict JSON with sentiment score (-1 to +1), label (Negative, Neutral, Positive), and explanation  
      - Aggregates comment sentiments into overall comment sentiment  
      - Output Parser enabled for JSON validation  
    - Inputs: Formatted Facebook data  
    - Outputs: Structured sentiment JSON for each post  
    - Failures: AI response errors, timeout, unexpected JSON format  
    - Credentials: Requires OpenAI GPT-4 credentials  
    - Sub-workflow: Uses LangChain agent node capabilities  

  - **LLM - OpenAI GPT-4 Model**  
    - Type: LangChain OpenAI Chat Model  
    - Configuration: Model set to GPT-4 with temperature 0.4 for balanced creativity  
    - Inputs: Routed internally by agent node  
    - Outputs: AI-generated sentiment analysis text  
    - Failures: API quota exceeded, auth failure  

  - **Memory Buffer - Session Context**  
    - Type: LangChain Memory Buffer Window  
    - Configuration: Session key "Candidate Screening" (likely reused component) to maintain context  
    - Inputs: Feeds context to LangChain agent  
    - Outputs: Memory context stream  
    - Notes: Helps maintain state if multiple interactions occur  

  - **Structured JSON Parser**  
    - Type: LangChain Output Parser Structured  
    - Configuration: Validates AI output strictly against JSON schema example (postId, postMessage, postSentiment, comments array, overallCommentSentiment)  
    - Inputs: AI raw output  
    - Outputs: Parsed JSON object  
    - Failures: Parsing errors if AI output is malformed  

#### 2.4 Routing Logic

- **Overview:** Routes the processed sentiment data depending on the overall comment sentiment score. Negative sentiment triggers alerts and logging; positive or neutral sentiment flows proceed to reporting.
- **Nodes Involved:**  
  - Route Based on Sentiment Score (Switch)  
  - Routing Logic Sticky Note
- **Node Details:**

  - **Route Based on Sentiment Score**  
    - Type: Switch Node  
    - Configuration:  
      - Condition 1: overallCommentSentiment.score < -0.4 → Negative sentiment path  
      - Condition 2: overallCommentSentiment.score > 0 → Positive/Neutral sentiment path  
      - Scores between -0.4 and 0 go to neutral path implicitly  
    - Inputs: Sentiment JSON from agent node  
    - Outputs:  
      - Output 1: Negative sentiment path → Slack alert + Google Sheets update  
      - Output 2: Positive/Neutral sentiment path → Email report formatting  
    - Failures: Expression evaluation errors if sentiment data missing  

#### 2.5 Alerts & Reporting

- **Overview:** Sends Slack alerts for posts with negative sentiment, logs all sentiment data into Google Sheets for tracking, and sends a formatted daily email report via Outlook summarizing sentiment trends.
- **Nodes Involved:**  
  - Slack Alert - Negative Sentiment  
  - Prepare Data for Google Sheets (Code Node)  
  - Update Google Sheet - Sentiment Log  
  - Format HTML Email Report (Code Node)  
  - Send Sentiment Report (Outlook)  
  - Alerts & Reporting Sticky Note
- **Node Details:**

  - **Slack Alert - Negative Sentiment**  
    - Type: Slack Node  
    - Configuration:  
      - Sends detailed alert message with post message, post sentiment, overall comment sentiment, and individual comment sentiments with emojis  
      - Target Slack channel via channel ID, authenticated with OAuth2 Slack credentials  
    - Inputs: Negative sentiment output from switch node  
    - Outputs: None (terminal for alert)  
    - Failures: Slack API auth errors, channel permission issues  

  - **Prepare Data for Google Sheets (Code Node)**  
    - Type: Code (JavaScript)  
    - Configuration: Flattens sentiment JSON into tabular rows suitable for Google Sheets, including counts of positive, negative, neutral comments, timestamps, and attention flags  
    - Inputs: Both positive/neutral and negative sentiment paths (note Slack alert and Google Sheets update run in parallel on negative path)  
    - Outputs: Rows formatted for sheet append/update  
    - Failures: JSON parsing errors, date formatting issues  

  - **Update Google Sheet - Sentiment Log**  
    - Type: Google Sheets Node  
    - Configuration:  
      - Operation: Append or update rows in sheet "Sheet1" by document ID  
      - Maps columns explicitly according to prepared rows  
      - Uses Google Sheets OAuth2 credentials  
    - Inputs: Prepared sheet rows  
    - Outputs: Append confirmation  
    - Failures: Google API auth errors, rate limits, sheet permission issues  

  - **Format HTML Email Report (Code Node)**  
    - Type: Code (JavaScript)  
    - Configuration:  
      - Generates an HTML email summarizing each post’s sentiment and comments with color-coded sentiment badges and emojis  
      - Includes post message, sentiment scores, explanations, and overall comment sentiment section  
      - Builds subject line dynamically based on sentiment and comment count  
    - Inputs: Positive/neutral sentiment output from routing node  
    - Outputs: JSON with email subject and HTML body for sending  
    - Failures: Data missing or malformed causing template errors  

  - **Send Sentiment Report (Outlook)**  
    - Type: Microsoft Outlook Node  
    - Configuration:  
      - Sends HTML email with high importance  
      - Uses subject and body from previous formatting node  
      - Uses Outlook OAuth2 credentials  
    - Inputs: Formatted email JSON  
    - Outputs: Email send confirmation  
    - Failures: Outlook API auth errors, quota, or network issues  

#### 2.6 Error Handling

- **Overview:** Captures any errors that occur during workflow execution and sends detailed error alerts to Slack for quick debugging.
- **Nodes Involved:**  
  - Error Handler Trigger  
  - Slack: Send Error Alert  
  - Error Handling Sticky Note
- **Node Details:**

  - **Error Handler Trigger**  
    - Type: Error Trigger  
    - Configuration: Default error trigger with no parameters  
    - Inputs: Internal to n8n error events  
    - Outputs: Triggers Slack error alert node on any workflow error  

  - **Slack: Send Error Alert**  
    - Type: Slack Node  
    - Configuration:  
      - Message includes node name, error message, and timestamp  
      - Posts to a designated Slack channel for errors  
      - Uses OAuth2 Slack credentials  
    - Inputs: Error payload from error trigger  
    - Outputs: None  
    - Failures: Slack API or permission errors  

---

### 3. Summary Table

| Node Name                      | Node Type                        | Functional Role                    | Input Node(s)                | Output Node(s)                         | Sticky Note                                                                                     |
|-------------------------------|---------------------------------|----------------------------------|-----------------------------|---------------------------------------|------------------------------------------------------------------------------------------------|
| Trigger - Daily Sentiment Analysis | Schedule Trigger                | Starts daily workflow at 10 AM   | None                        | Fetch Recent Facebook Posts           | Data Collection: Fetches recent Facebook posts, reactions, and comments on a daily schedule.   |
| Fetch Recent Facebook Posts    | Facebook Graph API               | Retrieves Facebook posts/comments| Trigger - Daily Sentiment Analysis | Format Facebook Data (Code Node)       | Data Collection: Fetches recent Facebook posts, reactions, and comments on a daily schedule.   |
| Format Facebook Data (Code Node) | Code Node                      | Normalizes Facebook API data     | Fetch Recent Facebook Posts | 💬 Agent - Sentiment & Tone Evaluator | Data Formatting: Normalizes Facebook API data into a consistent structure for AI analysis.     |
| 💬 Agent - Sentiment & Tone Evaluator | LangChain Agent              | Performs AI sentiment analysis   | Format Facebook Data (Code Node) | Route Based on Sentiment Score          | AI Sentiment Analysis: Evaluates sentiment for posts and comments using GPT and outputs JSON.  |
| LLM - OpenAI GPT-4 Model       | LangChain OpenAI Chat Model     | GPT-4 language model             | (Internal to Agent node)     | (Internal to Agent node)               | AI Sentiment Analysis: Evaluates sentiment for posts and comments using GPT and outputs JSON.  |
| Memory Buffer - Session Context| LangChain Memory Buffer         | Maintains session context        | (Internal to Agent node)     | (Internal to Agent node)               | AI Sentiment Analysis: Evaluates sentiment for posts and comments using GPT and outputs JSON.  |
| Structured JSON Parser         | LangChain Output Parser Structured | Validates/parses AI output JSON | LLM - OpenAI GPT-4 Model    | 💬 Agent - Sentiment & Tone Evaluator  | AI Sentiment Analysis: Evaluates sentiment for posts and comments using GPT and outputs JSON.  |
| Route Based on Sentiment Score | Switch Node                    | Routes flow based on sentiment score | 💬 Agent - Sentiment & Tone Evaluator | Slack Alert - Negative Sentiment, Prepare Data for Google Sheets, Format HTML Email Report | Routing Logic: Routes negative sentiment to alerts and logs; positive/neutral to reporting.     |
| Slack Alert - Negative Sentiment | Slack Node                    | Sends Slack alerts for negatives | Route Based on Sentiment Score (Negative path) | Prepare Data for Google Sheets       | Alerts & Logging: Sends Slack alerts for negative sentiment and updates Google Sheets.         |
| Prepare Data for Google Sheets | Code Node                      | Formats data for Google Sheets   | Route Based on Sentiment Score | Update Google Sheet - Sentiment Log    | Alerts & Logging: Sends Slack alerts for negative sentiment and updates Google Sheets.         |
| Update Google Sheet - Sentiment Log | Google Sheets Node          | Logs sentiment data in Sheets    | Prepare Data for Google Sheets | None                                 | Alerts & Logging: Sends Slack alerts for negative sentiment and updates Google Sheets.         |
| Format HTML Email Report (Code Node) | Code Node                  | Builds daily HTML email report   | Route Based on Sentiment Score (Positive/Neutral path) | Send Sentiment Report (Outlook)     | Alerts & Logging: Sends Slack alerts for negative sentiment and updates Google Sheets.         |
| Send Sentiment Report (Outlook) | Microsoft Outlook Node         | Sends daily sentiment report email | Format HTML Email Report (Code Node) | None                                 | Alerts & Logging: Sends Slack alerts for negative sentiment and updates Google Sheets.         |
| Error Handler Trigger          | Error Trigger                  | Captures workflow errors         | Internal error events        | Slack: Send Error Alert                | Error Handling: Captures workflow failures and sends details to Slack for debugging.           |
| Slack: Send Error Alert        | Slack Node                    | Sends Slack error notifications | Error Handler Trigger        | None                                 | Error Handling: Captures workflow failures and sends details to Slack for debugging.           |
| Main Overview                 | Sticky Note                   | Workflow overview                | None                        | None                                 | Facebook Sentiment Monitor overview and setup instructions.                                   |
| Data Collection Group          | Sticky Note                   | Data collection description     | None                        | None                                 | Describes the data collection block.                                                          |
| AI Analysis Group              | Sticky Note                   | AI sentiment analysis description| None                        | None                                 | Describes AI sentiment analysis block.                                                       |
| Routing Logic                 | Sticky Note                   | Routing logic description       | None                        | None                                 | Describes routing logic block.                                                                |
| Alerts & Reporting            | Sticky Note                   | Alerting and reporting summary  | None                        | None                                 | Describes alerts and logging block.                                                          |
| Error Handling               | Sticky Note                   | Error handling description      | None                        | None                                 | Describes error handling block.                                                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node:**  
   - Type: Schedule Trigger  
   - Configure to run daily at 10:00 AM (adjust according to your timezone)  

2. **Add a Facebook Graph API node:**  
   - Operation: Get posts from a Facebook page  
   - Set edge to `posts`  
   - Request fields: id, message, story, created_time, permalink_url, full_picture, attachments (media_type, media, url, description), shares, likes (limit 100, summary true with id and name), comments (limit 100, summary true with id, from, message, created_time, like_count, comment_count, reactions summary), reactions (limit 100, summary true with type, id, name), from (id, name, category)  
   - API Version: v23.0  
   - Connect Facebook credentials with required permissions (read posts, comments, reactions)  

3. **Create a Code Node to format Facebook data:**  
   - Paste the JavaScript provided in the original workflow to parse and normalize Facebook posts and comments into a flat structure  
   - Input: Output of Facebook Graph API node  

4. **Add a LangChain Agent node for sentiment analysis:**  
   - Use the LangChain sentiment analysis prompt as given, instructing GPT-4 to analyze post and comments sentiment, return strictly JSON with score, label, and explanation  
   - Connect the Code Node output as input  
   - Enable structured JSON output parsing  
   - Configure to use GPT-4 model with temperature 0.4  
   - Configure LangChain Memory Buffer node for session context if desired (session key can be "Candidate Screening" or similar)  
   - Connect the Memory Buffer and LLM nodes internally as per LangChain agent setup  
   - Attach Structured JSON Parser node to parse AI output  

5. **Add a Switch node to route based on overall comment sentiment score:**  
   - Condition 1: If score < -0.4 → Negative sentiment path  
   - Condition 2: Else if score > 0 → Positive/Neutral sentiment path  

6. **On Negative sentiment path:**  
   - Add Slack node to send alert:  
     - Configure Slack OAuth2 credentials  
     - Use template message including post message, post sentiment, overall comment sentiment, all comments with labels, scores, and explanations  
     - Set target channel by channel ID  
   - Add a Code Node to prepare data for Google Sheets:  
     - Use the JavaScript code to flatten the sentiment JSON for sheet rows  
   - Add Google Sheets node:  
     - Operation: Append or update rows in the target sheet "Sheet1"  
     - Configure Google Sheets OAuth2 credentials  
     - Specify document ID and sheet name  
   - Connect Slack alert and Google Sheets nodes to run in parallel from the switch node  

7. **On Positive/Neutral sentiment path:**  
   - Add a Code Node to format an HTML email report:  
     - Use provided JavaScript code to create a styled, emoji-rich HTML email summarizing post and comment sentiments  
     - Construct email subject dynamically  
   - Add Microsoft Outlook node to send email:  
     - Configure Outlook OAuth2 credentials  
     - Set subject and HTML body from previous node outputs  
     - Set email importance to High  

8. **Add Error Trigger node:**  
   - This node catches all workflow errors  

9. **Add Slack node to send error alerts:**  
   - Configure with Slack OAuth2 credentials  
   - Set message template to include error node name, message, and timestamp  
   - Connect Error Trigger node output to this Slack node  

10. **Add sticky notes for documentation:**  
    - Main Overview: Describe workflow purpose and setup steps  
    - Data Collection Group: Describe data retrieval  
    - Data Formatting: Describe normalization step  
    - AI Analysis Group: Describe AI sentiment evaluation  
    - Routing Logic: Describe routing based on sentiment  
    - Alerts & Reporting: Describe alerting and logging  
    - Error Handling: Describe error capture and notification  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                    | Context or Link                                                                                              |
|-------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| This workflow uses GPT-4 via LangChain agent node with a strict JSON output parser to ensure structured sentiment data.                         | AI Sentiment Analysis best practices                                                                        |
| Slack alerts and error notifications require OAuth2 credentials with proper scopes for posting messages in selected Slack channels.             | Slack OAuth2 setup documentation                                                                             |
| Facebook Graph API permissions must include read access to posts, comments, and reactions.                                                      | Facebook Developer docs: https://developers.facebook.com/docs/graph-api/                                     |
| Google Sheets OAuth2 integration requires spreadsheet editing permissions.                                                                      | Google Sheets API docs: https://developers.google.com/sheets/api                                              |
| Microsoft Outlook node requires OAuth2 credentials with mail send permissions.                                                                   | Microsoft Graph API docs: https://docs.microsoft.com/en-us/graph/api/resources/mail-api                       |
| Customize the sentiment thresholds in the Switch node to fit your business requirements for negative or positive engagement sensitivity.         | Adjust Switch node conditions accordingly                                                                    |
| The HTML email report uses inline CSS styles and emojis for compatibility with major email clients.                                              | Email HTML/CSS best practices                                                                                 |
| For testing, run the trigger manually and verify Facebook data retrieval, AI analysis output, Slack alerts, and email delivery in sequence.       | n8n manual execution and debug features                                                                       |
| This workflow was designed and documented by a senior technical analyst specializing in n8n workflows.                                           | Project credits                                                                                                |

---

This structured reference document fully describes the workflow, enabling reproduction, customization, and troubleshooting by advanced users or automation agents.