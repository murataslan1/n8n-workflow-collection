Automate Instagram Engagement & Sentiment Analysis with GPT-4 and Slack Reports

https://n8nworkflows.xyz/workflows/automate-instagram-engagement---sentiment-analysis-with-gpt-4-and-slack-reports-10824


# Automate Instagram Engagement & Sentiment Analysis with GPT-4 and Slack Reports

### 1. Workflow Overview

This workflow automates Instagram post engagement tracking and sentiment analysis using GPT-4, integrating the results with Slack, Outlook, and Google Sheets for reporting and alerting. It is designed for marketing and social media teams to receive daily insights on Instagram content performance, including sentiment evaluation of comments, engagement scoring, and actionable recommendations.

The workflow is logically divided into the following blocks:

- **1.1 Scheduled Data Fetch & Preparation:** Triggers daily, fetches recent Instagram posts via Facebook Graph API, and formats raw data into structured JSON for analysis.

- **1.2 AI Sentiment & Engagement Analysis:** Processes Instagram post data through an AI agent (GPT-4) to analyze post metrics and comment sentiments, producing a detailed JSON report.

- **1.3 Sentiment Decision & Routing:** Evaluates AI output sentiment labels to determine whether to send positive performance summaries or negative alerts to the team.

- **1.4 Notifications & Reporting:** Sends Slack messages and Outlook emails with performance summaries or alerts based on sentiment analysis.

- **1.5 Data Logging:** Flattens the AI analytics data and logs it into Google Sheets for historical tracking and trend analysis.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Data Fetch & Preparation

**Overview:**  
This block triggers the workflow daily at 10 AM, fetches recent Instagram posts using the Facebook Graph API, and converts raw response data into structured, analyzable JSON.

**Nodes Involved:**  
- Schedule Trigger  
- Fetch Recent Instagram Posts  
- Format Instagram Data  
- Sticky Note5 (documentation)

**Node Details:**  

- **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Role: Initiates workflow execution daily at 10:00 AM  
  - Configuration: Set to trigger once daily at hour 10  
  - Input: None (time-based trigger)  
  - Output: Triggers next node to fetch Instagram data  
  - Potential Failures: Time zone misconfiguration, scheduler disabled  

- **Fetch Recent Instagram Posts**  
  - Type: Facebook Graph API  
  - Role: Retrieves recent Instagram media posts and associated details (likes, comments, timestamps)  
  - Configuration: Uses Graph API v23.0, requests media edge with fields id, caption, media_type, media_url, permalink, timestamp, like_count, comments_count, and nested comments details  
  - Credentials: Facebook Graph API OAuth2 linked to Instagram Business account  
  - Input: Trigger from Schedule Trigger  
  - Output: Raw JSON data of Instagram posts  
  - Failure Types: API rate limits, expired tokens, permission errors  

- **Format Instagram Data**  
  - Type: Code (JavaScript) Node  
  - Role: Parses and reformats raw Instagram API data into normalized JSON including post metadata and comment details  
  - Key Logic: Iterates over posts, extracts fields like post_id, caption, media_type, counts, and details of comments with timestamps and likes  
  - Input: Raw JSON from Fetch Recent Instagram Posts  
  - Output: Array of formatted post JSON objects suitable for AI analysis  
  - Failures: Unexpected data format, missing fields  

- **Sticky Note5**  
  - Functional Role: Describes the data fetch and preparation logic for user reference  

---

#### 1.2 AI Sentiment & Engagement Analysis

**Overview:**  
Analyzes the structured Instagram post data using GPT-4 to generate engagement scores, comment sentiment classifications, performance labels, insights, and recommendations.

**Nodes Involved:**  
- AI Agent - Sentiment Analyzer  
- Window Buffer Memory  
- OpenAI Chat Model  
- Structured Output Parser  
- Sticky Note1 (AI Sentiment & Engagement Analysis description)

**Node Details:**  

- **AI Agent - Sentiment Analyzer**  
  - Type: LangChain AI Agent Node  
  - Role: Processes Instagram posts data, analyzes engagement and sentiment, and produces structured JSON output  
  - Configuration:  
    - Prompt includes post data serialized as JSON string  
    - System message frames AI as Instagram Performance Analyst  
    - Output format strictly JSON with detailed analytics including summary, per-post analysis, and overall insights  
  - Input: Formatted Instagram posts JSON  
  - Output: AI-generated JSON with sentiment and engagement analysis  
  - Version: LangChain Agent v2.1  
  - Failures: API errors, invalid JSON output, prompt failures  

- **Window Buffer Memory**  
  - Type: LangChain Memory Buffer (Windowed)  
  - Role: Maintains conversational context or session state keyed by "Post Engagement" for AI agent  
  - Configuration: Session key set to "Post Engagement"  
  - Input: None explicitly; linked to AI Agent  
  - Output: Provides memory context to AI Agent  
  - Failures: Memory overflow or corruption  

- **OpenAI Chat Model**  
  - Type: LangChain OpenAI Chat Model  
  - Role: Underlying LLM provider for the AI Agent using GPT-4o (OpenAI API)  
  - Configuration: Model set to GPT-4o with temperature 0.4 for controlled creativity  
  - Credentials: OpenAI API key (OpenAi account 2)  
  - Input: Prompt from AI Agent  
  - Output: Chat completion results  
  - Failures: API quota exceeded, network errors  

- **Structured Output Parser**  
  - Type: LangChain Structured Output Parser  
  - Role: Validates and parses AI output to enforce JSON schema compliance, ensuring structured data for downstream nodes  
  - Configuration: Uses example JSON schema defining summary, posts array, and overall insights  
  - Input: Raw AI output  
  - Output: Parsed and validated JSON structure  
  - Failures: Parsing errors if AI output is malformed or deviates from schema  

- **Sticky Note1**  
  - Functional Role: Describes the AI sentiment and engagement analysis purpose  

---

#### 1.3 Sentiment Decision & Routing

**Overview:**  
This block routes the workflow based on the sentiment label from AI output, deciding if the post is positively performing or requires negative alerting.

**Nodes Involved:**  
- Sentiment Decision Router  
- Sticky Note4 (Sentiment Decision Logic description)

**Node Details:**  

- **Sentiment Decision Router**  
  - Type: Switch Node  
  - Role: Routes flow based on sentiment label of the top post (from AI analysis output)  
  - Configuration: Two rules matching sentiment labels "Positive" and "Negative" exactly  
  - Input: Parsed AI output JSON  
  - Output:  
    - Positive branch leads to reporting nodes  
    - Negative branch leads to alert nodes  
  - Failures: Missing or unexpected sentiment labels, no posts in output  

- **Sticky Note4**  
  - Functional Role: Explains decision logic based on sentiment labels  

---

#### 1.4 Notifications & Reporting

**Overview:**  
Sends notifications and reports to Slack channels and Outlook email based on routed sentiment results, communicating post performance and recommendations.

**Nodes Involved:**  
- Slack: Post Positive Summary  
- Slack: Post Negative Alert  
- Outlook: Email Report  
- Sticky Note3 (Team Notifications description)

**Node Details:**  

- **Slack: Post Positive Summary**  
  - Type: Slack Node (Webhook)  
  - Role: Posts a message summarizing top post’s positive performance metrics to Slack channel  
  - Configuration:  
    - Message uses expressions to include post caption, ID, sentiment label, insights, comments, and recommendations  
    - Channel selected via ID from credentials  
  - Credentials: Slack OAuth2  
  - Input: Positive branch of Sentiment Decision Router  
  - Output: Confirmation of Slack message sent  
  - Failures: Slack API errors, webhook misconfiguration  

- **Slack: Post Negative Alert**  
  - Type: Slack Node (Webhook)  
  - Role: Posts an alert message for negatively performing posts to Slack channel for team attention  
  - Configuration: Similar message structure tailored for negative sentiment  
  - Credentials: Slack OAuth2  
  - Input: Negative branch of Sentiment Decision Router  
  - Output: Confirmation of Slack message sent  
  - Failures: Same as above  

- **Outlook: Email Report**  
  - Type: Microsoft Outlook Node  
  - Role: Sends email report summarizing top post performance, engagement metrics, insights, and recommendations  
  - Configuration:  
    - Subject and plain text body populated with expressions referencing AI output data  
    - Uses OAuth2 credentials for Outlook account  
  - Credentials: Microsoft Outlook OAuth2  
  - Input: Positive branch of Sentiment Decision Router  
  - Output: Email dispatch confirmation  
  - Failures: OAuth token expiration, email send errors  

- **Sticky Note3**  
  - Functional Role: Describes team notification purposes  

---

#### 1.5 Data Logging

**Overview:**  
Formats structured AI analysis data into a flattened schema and appends or updates records in Google Sheets for historical data tracking.

**Nodes Involved:**  
- Prepare Google Sheets Data  
- Log Analytics to Google Sheets  
- Sticky Note7 (Log Analytics to Google Sheets description)  
- Sticky Note2 (Credentials & Security note relevant here)

**Node Details:**  

- **Prepare Google Sheets Data**  
  - Type: Code (JavaScript) Node  
  - Role: Converts nested AI output JSON into flat rows appropriate for Google Sheets columns  
  - Logic: Iterates over posts array, extracts summary and per-post details, sentiment counts, and timestamps; flags alerts and top performers  
  - Input: AI analysis output JSON  
  - Output: Array of flat JSON objects representing rows for Google Sheets  
  - Failures: Missing data fields, date formatting issues  

- **Log Analytics to Google Sheets**  
  - Type: Google Sheets Node  
  - Role: Appends or updates rows in specified Google Sheets document and sheet  
  - Configuration:  
    - Operation: appendOrUpdate  
    - Document and Sheet names provided dynamically via credentials lookup  
  - Credentials: Google Sheets OAuth2 (automations@techdome.ai)  
  - Input: Flattened sheet rows from previous node  
  - Output: Confirmation of spreadsheet update  
  - Failures: OAuth token expiration, sheet access permissions  

- **Sticky Note7**  
  - Functional Role: Describes the purpose of logging analytics to Google Sheets  

- **Sticky Note2**  
  - Functional Role: Notes credential and security best practices for OAuth2 and API keys  

---

### 3. Summary Table

| Node Name                   | Node Type                               | Functional Role                                   | Input Node(s)                   | Output Node(s)                             | Sticky Note                                                       |
|-----------------------------|---------------------------------------|--------------------------------------------------|--------------------------------|--------------------------------------------|------------------------------------------------------------------|
| Schedule Trigger            | Schedule Trigger                      | Triggers workflow daily at 10 AM                  | None                           | Fetch Recent Instagram Posts                | ## ⏰ Data Fetch & Preparation                                    |
| Fetch Recent Instagram Posts| Facebook Graph API                    | Fetches recent Instagram posts with engagement   | Schedule Trigger               | Format Instagram Data                       | ## ⏰ Data Fetch & Preparation                                    |
| Format Instagram Data       | Code                                 | Formats raw Instagram data to structured JSON    | Fetch Recent Instagram Posts   | AI Agent - Sentiment Analyzer               | ## ⏰ Data Fetch & Preparation                                    |
| AI Agent - Sentiment Analyzer| LangChain AI Agent                   | Analyzes engagement & sentiment using GPT-4     | Format Instagram Data          | Sentiment Decision Router                   | ## 🧠 AI Sentiment & Engagement Analysis                         |
| Window Buffer Memory        | LangChain Memory Buffer               | Maintains session context for AI agent           | None (linked internally)       | AI Agent - Sentiment Analyzer               | ## 🧠 AI Sentiment & Engagement Analysis                         |
| OpenAI Chat Model           | LangChain OpenAI Chat Model           | Provides GPT-4 model for AI agent                 | AI Agent - Sentiment Analyzer  | AI Agent - Sentiment Analyzer (LM chain)   | ## 🧠 AI Sentiment & Engagement Analysis                         |
| Structured Output Parser    | LangChain Output Parser Structured    | Parses and validates AI output JSON                | AI Agent - Sentiment Analyzer  | Sentiment Decision Router                   | ## 🧠 AI Sentiment & Engagement Analysis                         |
| Sentiment Decision Router   | Switch                               | Routes flow by sentiment label ("Positive"/"Negative") | Structured Output Parser       | Outlook: Email Report, Prepare Google Sheets Data, Slack Positive Summary, Slack Negative Alert | ## ⚙️ Sentiment Decision Logic                                  |
| Slack: Post Positive Summary| Slack                                | Sends positive performance summary to Slack      | Sentiment Decision Router      | None                                       | ## 💬 Team Notifications                                        |
| Slack: Post Negative Alert  | Slack                                | Sends negative performance alert to Slack        | Sentiment Decision Router      | None                                       | ## 💬 Team Notifications                                        |
| Outlook: Email Report       | Microsoft Outlook                    | Sends email report with Instagram performance     | Sentiment Decision Router      | None                                       | ## 💬 Team Notifications                                        |
| Prepare Google Sheets Data  | Code                                 | Flattens AI analytics data for Google Sheets     | Sentiment Decision Router      | Log Analytics to Google Sheets              | ## 📊 Log Analytics to Google Sheets                            |
| Log Analytics to Google Sheets | Google Sheets                      | Appends or updates analytics data in Sheets      | Prepare Google Sheets Data     | None                                       | ## 📊 Log Analytics to Google Sheets                            |
| Sticky Note                 | Sticky Note                          | Describes overall workflow purpose                | None                         | None                                       | ## 🧩 Social Engagement Analyzer (covers entire workflow)      |
| Sticky Note1                | Sticky Note                          | Describes AI Sentiment & Engagement Analysis      | None                         | None                                       | ## 🧠 AI Sentiment & Engagement Analysis                        |
| Sticky Note2                | Sticky Note                          | Notes credentials and security best practices     | None                         | None                                       | ## 🔐 Credentials & Security                                  |
| Sticky Note3                | Sticky Note                          | Describes team notifications logic                 | None                         | None                                       | ## 💬 Team Notifications                                      |
| Sticky Note4                | Sticky Note                          | Explains sentiment decision routing logic         | None                         | None                                       | ## ⚙️ Sentiment Decision Logic                                |
| Sticky Note5                | Sticky Note                          | Describes data fetch and preparation               | None                         | None                                       | ## ⏰ Data Fetch & Preparation                                |
| Sticky Note7                | Sticky Note                          | Describes logging analytics to Google Sheets      | None                         | None                                       | ## 📊 Log Analytics to Google Sheets                          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Set interval to daily trigger at 10:00 AM local time  

2. **Add Facebook Graph API Node**  
   - Type: Facebook Graph API  
   - Set API version to v23.0  
   - Endpoint: `media` edge for Instagram Business account  
   - Request fields: `id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count,comments{username,text,timestamp,like_count}`  
   - Connect credentials linked to Instagram Business Facebook account (OAuth2)  
   - Connect output from Schedule Trigger  

3. **Add Code Node "Format Instagram Data"**  
   - Type: Code (JavaScript)  
   - Paste code to parse raw Instagram posts into normalized JSON with post and comment details (see node details section)  
   - Connect input from Facebook Graph API node  

4. **Add LangChain OpenAI Chat Model Node**  
   - Type: LangChain OpenAI Chat Model  
   - Model: GPT-4o (OpenAI)  
   - Temperature: 0.4  
   - Connect OpenAI API credentials (API key)  

5. **Add LangChain Memory Node "Window Buffer Memory"**  
   - Type: LangChain Memory Buffer Window  
   - Set sessionKey to `"Post Engagement"` (string)  
   - Connect to AI Agent node (next step) as memory input  

6. **Add LangChain AI Agent Node "AI Agent - Sentiment Analyzer"**  
   - Type: LangChain AI Agent (v2.1)  
   - System Message: Set as Instagram Performance Analyst with detailed instructions to analyze posts and comments, return JSON strictly  
   - Text Prompt: Insert Instagram posts data serialized as JSON string  
   - Set AI model input to the OpenAI Chat Model node  
   - Link memory buffer node for session management  
   - Connect input from Format Instagram Data node  

7. **Add LangChain Output Parser Node "Structured Output Parser"**  
   - Type: LangChain Structured Output Parser  
   - Provide example JSON schema matching expected AI JSON output structure (summary, posts array with fields, overallInsights)  
   - Connect input from AI Agent node output  

8. **Add Switch Node "Sentiment Decision Router"**  
   - Type: Switch  
   - Condition 1: If `$json.output.posts[0].commentSentiment.label` equals "Positive" (case sensitive)  
   - Condition 2: If `$json.output.posts[0].commentSentiment.label` equals "Negative" (case sensitive)  
   - Connect input from Structured Output Parser node  

9. **Add Slack Node "Slack: Post Positive Summary"**  
   - Type: Slack (Webhook)  
   - Configure Slack OAuth2 credentials  
   - Select target Slack channel by ID  
   - Message template includes post caption, ID, sentiment label, insights, positive comments, and recommendations (using expressions from AI output)  
   - Connect positive output branch from Sentiment Decision Router  

10. **Add Slack Node "Slack: Post Negative Alert"**  
    - Type: Slack (Webhook)  
    - Use same Slack OAuth2 credentials as above  
    - Configure alert message template including negative sentiment details and recommendations  
    - Connect negative output branch from Sentiment Decision Router  

11. **Add Outlook Node "Outlook: Email Report"**  
    - Type: Microsoft Outlook  
    - OAuth2 credentials for Outlook account  
    - Subject: "Top Post Performer" (or dynamic)  
    - Body: Plain text email with detailed post performance and sentiment analytics pulled from AI output  
    - Connect positive output branch from Sentiment Decision Router  

12. **Add Code Node "Prepare Google Sheets Data"**  
    - Type: Code (JavaScript)  
    - Paste code to flatten AI analysis JSON into rows suitable for Google Sheets (including summary, post metrics, sentiment counts, flags)  
    - Connect positive output branch from Sentiment Decision Router  

13. **Add Google Sheets Node "Log Analytics to Google Sheets"**  
    - Type: Google Sheets  
    - Operation: appendOrUpdate  
    - Connect Google Sheets OAuth2 credentials  
    - Configure document ID and sheet name (dynamic or fixed)  
    - Connect input from Prepare Google Sheets Data node  

14. **Add Sticky Notes for Documentation**  
    - Create sticky notes explaining each block’s purpose and workflow overview for maintenance and user guidance  

15. **Test workflow manually once** to validate API connections, data formats, AI responses, and notification deliveries.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                    | Context or Link                                         |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------|
| Use OAuth2 authentication for Slack, Google Sheets, and Outlook integrations; API keys suffice for OpenAI and Facebook Graph API only.                         | Credential & Security (Sticky Note2)                    |
| Workflow uses GPT-4o model via LangChain AI Agent for advanced sentiment and engagement analysis with strict JSON output parsing.                              | AI Sentiment & Engagement Analysis (Sticky Note1)      |
| Scheduled trigger set for daily execution at 10 AM; adjust as needed for your timezone and reporting requirements.                                              | Data Fetch & Preparation (Sticky Note5)                 |
| Slack messages differentiate positive summaries and negative alerts to streamline team awareness and action.                                                  | Team Notifications (Sticky Note3)                        |
| Google Sheets logging enables trend tracking and historical data analysis of Instagram post performance and audience sentiment.                               | Log Analytics to Google Sheets (Sticky Note7)           |
| The workflow requires a Facebook Business account linked to Instagram and appropriate permissions for media insights and comments access.                     | Facebook Graph API documentation                         |
| Avoid storing personal or sensitive emails in shared credentials or workflow templates to maintain security compliance.                                        | Credential & Security (Sticky Note2)                    |
| For modification, ensure any new sentiment labels are reflected in the Sentiment Decision Router switch conditions for correct routing.                       | Sentiment Decision Logic (Sticky Note4)                 |

---

**Disclaimer:**  
The provided documentation is based solely on an automated workflow created with n8n integration and automation software. The workflow respects all applicable content policies and contains no illegal or protected content. All data processed is legal and publicly accessible.