Analyze Event Feedback with Sentiment Analysis, Google Sheets, Slack & Email

https://n8nworkflows.xyz/workflows/analyze-event-feedback-with-sentiment-analysis--google-sheets--slack---email-10218


# Analyze Event Feedback with Sentiment Analysis, Google Sheets, Slack & Email

### 1. Workflow Overview

This workflow, titled **"Real-Time Attendee Engagement & Feedback Analyzer"**, is designed to collect, analyze, and report event attendee feedback in real time. It targets event organizers and engagement teams aiming to understand audience sentiment, aggregate feedback metrics, and promptly respond to urgent issues during or after events.

The workflow is logically divided into three main blocks:

- **1.1 Data Collection:** Receives attendee feedback via a webhook and extracts key data fields.
- **1.2 Analysis Engine:** Performs sentiment analysis, calculates scores, checks urgency, aggregates all feedback, and computes overall insights.
- **1.3 Insights & Delivery:** Logs feedback to Google Sheets, sends urgent alerts via Slack, publishes summary updates on Slack, emails reports to organizers, and responds to the webhook submitter.

---

### 2. Block-by-Block Analysis

#### 1.1 Data Collection

- **Overview:**  
  Captures feedback submissions through an HTTP webhook endpoint and prepares the data for analysis by structuring incoming JSON input.

- **Nodes Involved:**  
  - Webhook Trigger  
  - Extract Feedback Data  
  - Sticky Note1 (documentation)

- **Node Details:**

  - **Webhook Trigger**  
    - Type: Webhook Trigger (HTTP POST listener)  
    - Purpose: Receives feedback submissions at path `/feedback-submission`.  
    - Configuration: POST method, response mode set to "responseNode" (responds later from a dedicated node).  
    - Inputs: External HTTP clients (e.g., feedback forms, polls).  
    - Outputs: Raw JSON feedback data to next node.  
    - Failure Modes: Network issues, invalid HTTP requests, missing payload.  
    - Version-specific: n8n v0.108+ supports responseNode mode.

  - **Extract Feedback Data**  
    - Type: Set node (data transformation)  
    - Purpose: Structures and extracts relevant feedback fields from the incoming JSON.  
    - Configuration: Mode set to "jsonData" to map incoming JSON directly.  
    - Inputs: Raw webhook data.  
    - Outputs: Structured JSON with fields like `feedback_text`, `rating`, `engagement_score`, `session_name`, `attendee_name`.  
    - Failure Modes: Missing expected fields, malformed JSON.  
    - Version-specific: n8n v0.147+ for enhanced JSON handling.

  - **Sticky Note1**  
    - Type: Sticky Note (documentation)  
    - Content: Describes Data Collection block's role and input methods.

#### 1.2 Analysis Engine

- **Overview:**  
  Analyzes the extracted feedback for sentiment, scores urgency based on ratings and sentiment, aggregates data, and computes overall insights.

- **Nodes Involved:**  
  - Analyze Sentiment  
  - Check Urgency  
  - Aggregate Feedback  
  - Calculate Insights  
  - Sticky Note2 (documentation)

- **Node Details:**

  - **Analyze Sentiment**  
    - Type: Set node (data enrichment)  
    - Purpose: Derives sentiment category, sentiment score, extracts keywords, and calculates an overall score.  
    - Configuration: Uses JavaScript expressions evaluating `feedback_text` for positive/negative keywords; computes sentiment as "positive", "negative", or "neutral". Extracts up to 5 keywords longer than 5 characters. Overall score is a weighted average of rating and engagement score.  
    - Inputs: Structured feedback JSON.  
    - Outputs: JSON enriched with `sentiment`, `sentiment_score`, `keywords`, `overall_score`.  
    - Failure Modes: Expression errors if `feedback_text` missing or not string; edge cases where keywords may not be meaningful; mixed sentiment in feedback may misclassify.  
    - Version-specific: Requires n8n supporting advanced expressions (v0.140+).

  - **Check Urgency**  
    - Type: If node (conditional branching)  
    - Purpose: Determines if feedback is urgent based on rating ≤ 2 or negative sentiment.  
    - Configuration: Logical OR condition combining numeric and string checks on `rating` and `sentiment` fields.  
    - Inputs: Sentiment-analyzed feedback.  
    - Outputs: Two branches: urgent (true) and non-urgent (false).  
    - Failure Modes: Missing `rating` or `sentiment` fields; type mismatch in conditions.  
    - Version-specific: Standard IF node behavior.

  - **Aggregate Feedback**  
    - Type: Aggregate node  
    - Purpose: Collects all feedback items in the current run for bulk analysis.  
    - Configuration: Aggregates all incoming item data into an array stored in `data`.  
    - Inputs: All feedback JSON from Analyze Sentiment node outputs (both urgent and non-urgent).  
    - Outputs: Single aggregated JSON with array of feedback objects.  
    - Failure Modes: Large datasets may cause memory issues; empty inputs yield empty arrays.  
    - Version-specific: Aggregate node v1 required.

  - **Calculate Insights**  
    - Type: Set node  
    - Purpose: Calculates summary metrics from aggregated feedback data, including totals, average rating, sentiment counts, and average overall score.  
    - Configuration: Uses JavaScript expressions to compute:  
      - `total_responses`: length of feedback array  
      - `avg_rating`: average of `rating` field  
      - `positive_feedback`, `negative_feedback`, `neutral_feedback`: counts by sentiment  
      - `avg_overall_score`: average of overall scores  
    - Inputs: Aggregated feedback data.  
    - Outputs: JSON summary metrics.  
    - Failure Modes: Division by zero if no data; missing fields in feedback items.  
    - Version-specific: Expression support v0.140+.

  - **Sticky Note2**  
    - Type: Sticky Note (documentation)  
    - Content: Describes Analysis Engine's role and logic.

#### 1.3 Insights & Delivery

- **Overview:**  
  Logs processed feedback to Google Sheets, sends urgent Slack alerts, publishes real-time summaries on Slack, emails report to organizers, and responds to the original webhook submission.

- **Nodes Involved:**  
  - Urgent Slack Alert  
  - Log to Google Sheets  
  - Webhook Response  
  - Summary to Slack  
  - Email Report to Organizers  
  - Sticky Note3 (documentation)

- **Node Details:**

  - **Urgent Slack Alert**  
    - Type: Slack node (message posting)  
    - Purpose: Sends urgent feedback alerts to Slack channel when feedback is flagged urgent.  
    - Configuration: Uses a webhook with templated text including session name, attendee info, rating, sentiment, and feedback text.  
    - Inputs: Urgent branch from Check Urgency node.  
    - Outputs: Passes data downstream to Log to Google Sheets.  
    - Credentials: Slack API OAuth configured.  
    - Failure Modes: Slack API quota limits, invalid webhook, network errors.  
    - Version-specific: Slack node v2.1.

  - **Log to Google Sheets**  
    - Type: Google Sheets node (append operation)  
    - Purpose: Appends each feedback record into a predefined Google Sheet for persistent storage and later analysis.  
    - Configuration: Maps all input fields automatically to Sheet1 of a specified Google Sheet document.  
    - Inputs: Feedback data from both urgent and non-urgent branches.  
    - Credentials: Google Service Account with Sheets API access.  
    - Failure Modes: Google Sheets API quota, invalid credentials, sheet not found.  
    - Version-specific: Google Sheets node v4.4.

  - **Webhook Response**  
    - Type: Respond to Webhook node  
    - Purpose: Sends JSON response back to the feedback submitter confirming receipt and analysis results.  
    - Configuration: Returns status, message, feedback ID, sentiment, overall score, and a thank you note.  
    - Inputs: After logging to Google Sheets.  
    - Outputs: HTTP response to client.  
    - Failure Modes: Network issues, missing data fields.  
    - Version-specific: Standard webhook response node.

  - **Summary to Slack**  
    - Type: Slack node (message posting)  
    - Purpose: Posts a real-time summary of feedback metrics to a Slack channel periodically or after aggregation.  
    - Configuration: Message includes total responses, average rating, overall score, sentiment breakdown with percentages, and note about dashboard updates.  
    - Inputs: Calculated insights from Calculate Insights node.  
    - Credentials: Slack API OAuth.  
    - Failure Modes: Same as Urgent Slack Alert.  
    - Version-specific: Slack node v2.1.

  - **Email Report to Organizers**  
    - Type: Email Send node  
    - Purpose: Sends a daily or periodic report email with summarized event feedback to organizer email addresses.  
    - Configuration: Subject line includes current date formatted as "Month dd, yyyy"; from and to addresses are fixed; body content inherited from inputs or templated externally.  
    - Credentials: SMTP credentials configured.  
    - Failure Modes: SMTP connectivity, authentication errors, spam filters.  
    - Version-specific: Email node v2.1.

  - **Sticky Note3**  
    - Type: Sticky Note (documentation)  
    - Content: Describes Insights & Delivery block and its outputs.

---

### 3. Summary Table

| Node Name               | Node Type                | Functional Role                         | Input Node(s)                | Output Node(s)                             | Sticky Note                                                                                                    |
|-------------------------|--------------------------|---------------------------------------|-----------------------------|--------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| Webhook Trigger         | Webhook                  | Receives feedback submissions         | External HTTP clients       | Extract Feedback Data                      | 📊 DATA COLLECTION: Collects feedback through webhooks, live polls, ratings, comments                          |
| Extract Feedback Data   | Set                      | Structures raw feedback data           | Webhook Trigger             | Analyze Sentiment                          | 📊 DATA COLLECTION                                                                                             |
| Analyze Sentiment       | Set                      | Analyzes sentiment, keywords, scores  | Extract Feedback Data       | Check Urgency, Aggregate Feedback          | 🔍 ANALYSIS ENGINE: Sentiment analysis, rating aggregation, keyword extraction, trend identification            |
| Check Urgency           | If                       | Determines urgency of feedback         | Analyze Sentiment           | Urgent Slack Alert & Log to Google Sheets (True branch), Log to Google Sheets (False branch) | 🔍 ANALYSIS ENGINE                                                                                             |
| Urgent Slack Alert      | Slack                    | Sends urgent feedback alert            | Check Urgency (true branch) | Log to Google Sheets                       | 📈 INSIGHTS & DELIVERY: Real-time dashboards, notifications, reports, recommendations                           |
| Log to Google Sheets    | Google Sheets            | Logs feedback records persistently     | Check Urgency, Urgent Slack Alert | Webhook Response                         | 📈 INSIGHTS & DELIVERY                                                                                          |
| Webhook Response        | Respond to Webhook       | Sends confirmation response            | Log to Google Sheets        | None                                       | 📈 INSIGHTS & DELIVERY                                                                                          |
| Aggregate Feedback      | Aggregate                | Aggregates all feedback data            | Analyze Sentiment           | Calculate Insights                         | 🔍 ANALYSIS ENGINE                                                                                             |
| Calculate Insights      | Set                      | Computes summary metrics                | Aggregate Feedback          | Summary to Slack, Email Report to Organizers | 📈 INSIGHTS & DELIVERY                                                                                          |
| Summary to Slack        | Slack                    | Posts summary feedback metrics          | Calculate Insights          | None                                       | 📈 INSIGHTS & DELIVERY                                                                                          |
| Email Report to Organizers | Email Send             | Sends email report to organizers        | Calculate Insights          | None                                       | 📈 INSIGHTS & DELIVERY                                                                                          |
| Sticky Note1            | Sticky Note              | Documentation: Data Collection block   | None                       | None                                       | See Data Collection notes                                                                                        |
| Sticky Note2            | Sticky Note              | Documentation: Analysis Engine block   | None                       | None                                       | See Analysis Engine notes                                                                                        |
| Sticky Note3            | Sticky Note              | Documentation: Insights & Delivery block | None                       | None                                       | See Insights & Delivery notes                                                                                    |

---

### 4. Reproducing the Workflow from Scratch

**Step 1: Create Webhook Trigger Node**  
- Name: `Webhook Trigger`  
- Type: Webhook Trigger  
- HTTP Method: POST  
- Path: `feedback-submission`  
- Response Mode: `responseNode` (respond later)  
- Purpose: Receive feedback submissions via HTTP POST.  

**Step 2: Create Set Node to Extract Feedback Data**  
- Name: `Extract Feedback Data`  
- Type: Set  
- Mode: `jsonData`  
- Purpose: Copy incoming JSON data fields for feedback processing.  
- Connect `Webhook Trigger` main output to this node’s input.

**Step 3: Create Set Node for Sentiment Analysis**  
- Name: `Analyze Sentiment`  
- Type: Set  
- Add fields with expressions:  
  - `sentiment` (string):  
    ```js
    {{ $json.feedback_text.toLowerCase().includes('great') || $json.feedback_text.toLowerCase().includes('excellent') || $json.feedback_text.toLowerCase().includes('amazing') ? 'positive' : ($json.feedback_text.toLowerCase().includes('bad') || $json.feedback_text.toLowerCase().includes('poor') || $json.feedback_text.toLowerCase().includes('terrible') ? 'negative' : 'neutral') }}
    ```  
  - `sentiment_score` (number):  
    ```js
    {{ $json.feedback_text.toLowerCase().includes('great') || $json.feedback_text.toLowerCase().includes('excellent') || $json.feedback_text.toLowerCase().includes('amazing') ? 1 : ($json.feedback_text.toLowerCase().includes('bad') || $json.feedback_text.toLowerCase().includes('poor') || $json.feedback_text.toLowerCase().includes('terrible') ? -1 : 0) }}
    ```  
  - `keywords` (string):  
    ```js
    {{ $json.feedback_text.toLowerCase().split(' ').filter(word => word.length > 5).slice(0, 5).join(', ') }}
    ```  
  - `overall_score` (number):  
    ```js
    {{ ($json.rating * 20 + $json.engagement_score * 10) / 2 }}
    ```  
- Connect `Extract Feedback Data` output to this node input.

**Step 4: Create If Node to Check Urgency**  
- Name: `Check Urgency`  
- Type: If  
- Condition: OR  
  - Numeric condition: `rating` ≤ 2  
  - String condition: `sentiment` equals `"negative"`  
- Connect `Analyze Sentiment` output to this node.

**Step 5: Create Slack Node for Urgent Alerts**  
- Name: `Urgent Slack Alert`  
- Type: Slack (send message)  
- Credentials: Configure Slack OAuth credentials beforehand.  
- Message:  
  ```
  🚨 **URGENT FEEDBACK ALERT**

  **Session:** {{ $json.session_name }}
  **Attendee:** {{ $json.attendee_name }}
  **Rating:** {{ $json.rating }}/5 ⭐
  **Sentiment:** {{ $json.sentiment }}

  **Feedback:**
  > {{ $json.feedback_text }}

  **Action Required:** Please review and respond immediately.
  ```  
- Connect `Check Urgency` true branch to this node.

**Step 6: Create Google Sheets Node to Log Feedback**  
- Name: `Log to Google Sheets`  
- Type: Google Sheets (append)  
- Credentials: Set up Google Service Account with Sheets API enabled.  
- Document ID: Enter your target Google Sheet ID.  
- Sheet Name: `Sheet1`  
- Mapping Mode: Auto map input fields.  
- Connect both `Check Urgency` false branch and `Urgent Slack Alert` output to this node as parallel inputs.

**Step 7: Create Respond to Webhook Node**  
- Name: `Webhook Response`  
- Type: Respond to Webhook  
- Response Type: JSON  
- Response Body:  
  ```json
  {
    "status": "success",
    "message": "Feedback received and analyzed",
    "feedback_id": "{{ $json.feedback_id }}",
    "sentiment": "{{ $json.sentiment }}",
    "overall_score": {{ $json.overall_score }},
    "thank_you": "Thank you for your valuable feedback!"
  }
  ```  
- Connect `Log to Google Sheets` output to this node.

**Step 8: Create Aggregate Node to Collect Feedback**  
- Name: `Aggregate Feedback`  
- Type: Aggregate  
- Aggregate Mode: Aggregate all item data into `data` array.  
- Connect `Analyze Sentiment` output to this node.

**Step 9: Create Set Node to Calculate Insights**  
- Name: `Calculate Insights`  
- Type: Set  
- Add fields with expressions based on aggregated data:  
  - `total_responses`: `{{ $json.data.length }}`  
  - `avg_rating`: `{{ $json.data.reduce((sum, item) => sum + item.rating, 0) / $json.data.length }}`  
  - `positive_feedback`: `{{ $json.data.filter(item => item.sentiment === 'positive').length }}`  
  - `negative_feedback`: `{{ $json.data.filter(item => item.sentiment === 'negative').length }}`  
  - `neutral_feedback`: `{{ $json.data.filter(item => item.sentiment === 'neutral').length }}`  
  - `avg_overall_score`: `{{ $json.data.reduce((sum, item) => sum + item.overall_score, 0) / $json.data.length }}`  
- Connect `Aggregate Feedback` output to this node.

**Step 10: Create Slack Node for Summary Posts**  
- Name: `Summary to Slack`  
- Type: Slack (send message)  
- Credentials: Slack OAuth  
- Message:  
  ```
  📊 **Real-Time Feedback Summary**

  **Total Responses:** {{ $json.total_responses }}
  **Average Rating:** {{ $json.avg_rating.toFixed(2) }}/5 ⭐
  **Overall Score:** {{ $json.avg_overall_score.toFixed(1) }}%

  **Sentiment Breakdown:**
  ✅ Positive: {{ $json.positive_feedback }} ({{ ($json.positive_feedback / $json.total_responses * 100).toFixed(1) }}%)
  ❌ Negative: {{ $json.negative_feedback }} ({{ ($json.negative_feedback / $json.total_responses * 100).toFixed(1) }}%)
  ➖ Neutral: {{ $json.neutral_feedback }} ({{ ($json.neutral_feedback / $json.total_responses * 100).toFixed(1) }}%)

  _Dashboard updated in real-time_
  ```  
- Connect `Calculate Insights` output to this node.

**Step 11: Create Email Node to Send Report to Organizers**  
- Name: `Email Report to Organizers`  
- Type: Email Send  
- SMTP Credentials: Configure SMTP credentials beforehand.  
- To Email: `organizers@company.com`  
- From Email: `events@company.com`  
- Subject: `Event Feedback Report - {{ $now.format('MMMM dd, yyyy') }}`  
- Connect `Calculate Insights` output to this node.

**Step 12: Add Sticky Notes for Documentation**  
- Add three Sticky Note nodes to describe the three logical blocks:  
  - Data Collection  
  - Analysis Engine  
  - Insights & Delivery  
- Position them logically near their respective nodes for clarity.

---

### 5. General Notes & Resources

| Note Content                                                                                                           | Context or Link                                                             |
|------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------|
| Workflow collects feedback via webhook, live polls, ratings, and attendee comments.                                     | Sticky Note1 content                                                        |
| Analysis includes sentiment classification, keyword extraction, rating aggregation, and trend identification.          | Sticky Note2 content                                                        |
| Outputs include real-time dashboards, organizer notifications, summary reports, and action recommendations.             | Sticky Note3 content                                                        |
| Slack messages use OAuth credentials; ensure proper permissions and channel access.                                     | Slack nodes credential setup                                                |
| Google Sheets integration requires service account with Sheets API enabled and correct document & sheet IDs.           | Google Sheets node credential and config                                   |
| Email node uses SMTP; ensure SMTP server details and credentials are correct for successful sending.                    | Email node credential setup                                                 |
| Expressions rely on presence and correct formatting of `feedback_text`, `rating`, and `engagement_score`. Validate inputs. | Node expression dependencies                                               |
| Potential failure points include API rate limits, network errors, and missing or malformed data in webhook payloads.   | General error considerations                                               |

---

**Disclaimer:**  
The text above derives exclusively from an automated workflow created with n8n, a tool for integration and automation. It strictly respects prevailing content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.