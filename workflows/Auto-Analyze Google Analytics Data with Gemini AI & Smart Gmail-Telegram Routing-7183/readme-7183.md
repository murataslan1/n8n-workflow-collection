Auto-Analyze Google Analytics Data with Gemini AI & Smart Gmail/Telegram Routing

https://n8nworkflows.xyz/workflows/auto-analyze-google-analytics-data-with-gemini-ai---smart-gmail-telegram-routing-7183


# Auto-Analyze Google Analytics Data with Gemini AI & Smart Gmail/Telegram Routing

### 1. Workflow Overview

This workflow automates the weekly retrieval, AI-powered analysis, sentiment classification, and targeted notification of Google Analytics data. It is designed for teams needing concise, insightful reports delivered via Gmail and Telegram, enhancing data-driven decision-making by highlighting positive and negative trends automatically.

**Logical blocks:**

- **1.1 Schedule & Data Retrieval:** Weekly trigger to fetch Google Analytics metrics.
- **1.2 Data Aggregation:** Normalizes raw GA data into a consolidated JSON format.
- **1.3 AI Processing & Memory:** Uses Google Gemini AI and a LangChain AI Agent with memory to analyze data and generate concise insights.
- **1.4 Sentiment Analysis:** Classifies the AI-generated insights as positive or negative.
- **1.5 Notifications:** Routes the insights to stakeholders via Gmail and Telegram with formatted messages.

---

### 2. Block-by-Block Analysis

#### 1.1 Schedule & Data Retrieval

**Overview:**  
Triggers the workflow weekly and retrieves Google Analytics data for the past week.

**Nodes Involved:**  
- Schedule Trigger  
- Get a weekly report

**Node Details:**

- **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Role: Initiates the workflow every 7 days automatically.  
  - Config: Interval set to 7 days.  
  - Inputs: None (trigger).  
  - Outputs: Triggers “Get a weekly report.”  
  - Edge cases: Misconfiguration may cause missed triggers or overlapping executions.

- **Get a weekly report**  
  - Type: Google Analytics (GA4) node  
  - Role: Fetches GA4 metrics for the configured property.  
  - Config: Metrics requested include eventCount, userEngagementDuration, active7DayUsers, active28DayUsers, sessions; no specific dimensions configured. Property ID set to “483751327”. OAuth2 credentials for GA account used.  
  - Input: Trigger from Schedule Trigger node.  
  - Output: Sends raw GA data to “Aggregate” node.  
  - Edge cases: OAuth token expiry, API quota limits, empty data if site inactivity.

---

#### 1.2 Data Aggregation

**Overview:**  
Consolidates the GA data into a normalized JSON format for AI consumption.

**Nodes Involved:**  
- Aggregate

**Node Details:**

- **Aggregate**  
  - Type: Aggregate  
  - Role: Merges all GA data items into a single JSON object (aggregateAllItemData).  
  - Config: Default aggregate options, no grouping or transformation beyond aggregation.  
  - Input: Raw GA data from “Get a weekly report.”  
  - Output: Aggregated JSON data to “AI Agent.”  
  - Edge cases: Empty input data leading to empty output JSON.

---

#### 1.3 AI Processing & Memory

**Overview:**  
Analyzes the aggregated GA data using Google Gemini AI and a LangChain AI Agent incorporating session memory to provide concise, insightful weekly analytics summaries.

**Nodes Involved:**  
- AI Agent  
- Simple Memory  
- Google Gemini Chat Model

**Node Details:**

- **AI Agent**  
  - Type: LangChain Agent  
  - Role: Receives aggregated JSON data as text and generates a concise analytics summary in Telegram message format.  
  - Config:  
    - Input text expression: `={{ $json.data }}` (aggregated JSON).  
    - System message instructs the AI to act as an experienced data analyst, compare with memory, and produce max 1000 char summary with key info highlighted by backticks.  
    - Prompt type: "define" (custom prompt).  
  - Input: Aggregated JSON from “Aggregate”; AI language model set to “Google Gemini Chat Model”; AI memory set to “Simple Memory.”  
  - Output: JSON with summarized text, sent to “Insight Sentiment Analysis.”  
  - Edge cases: AI service downtime, malformed JSON input, exceeding token limits.

- **Simple Memory**  
  - Type: LangChain Memory Buffer Window  
  - Role: Stores weekly reports keyed by the aggregated JSON data for trend comparison.  
  - Config: Session key set to aggregated JSON data; session ID uses a custom key.  
  - Input: Memory linked to “AI Agent.”  
  - Output: Provides memory context to “AI Agent.”  
  - Edge cases: Memory overflow if not properly managed; potential mismatch in session keys.

- **Google Gemini Chat Model**  
  - Type: Google Gemini (PaLM) Language Model node  
  - Role: Provides the AI language model backend for the AI Agent and Sentiment Analysis nodes.  
  - Config: Uses credentials for Google Palm API account.  
  - Input: Connected as language model for “AI Agent” and “Insight Sentiment Analysis.”  
  - Output: Processes prompts for both nodes.  
  - Edge cases: API quota limits, authentication failure.

---

#### 1.4 Sentiment Analysis

**Overview:**  
Classifies the AI-generated insights as either Positive or Negative sentiment to aid targeted notifications.

**Nodes Involved:**  
- Insight Sentiment Analysis

**Node Details:**

- **Insight Sentiment Analysis**  
  - Type: LangChain Sentiment Analysis  
  - Role: Categorizes the AI summary output into “Positive” or “Negative.”  
  - Config: Categories explicitly set to “Positive, Negative.” Input text is the AI Agent's summarized output.  
  - Input: Output from “AI Agent.”  
  - Output: Routed to “Notify Stakeholders” and “Send a message to group.”  
  - Edge cases: Ambiguous sentiments; AI misclassification; input text missing or empty.

---

#### 1.5 Notifications

**Overview:**  
Sends the sentiment-classified insights to stakeholders via Gmail email and Telegram group message.

**Nodes Involved:**  
- Notify Stakeholders  
- Send a message to group

**Node Details:**

- **Notify Stakeholders**  
  - Type: Gmail node  
  - Role: Emails the weekly GA report summary to configured recipients.  
  - Config:  
    - Recipient email(s) must be set manually.  
    - Subject includes date range of the report.  
    - Message body uses AI Agent's output JSON.  
    - Uses OAuth2 credentials for Gmail account.  
  - Input: Positive or Negative sentiment output from “Insight Sentiment Analysis.”  
  - Output: None (end node).  
  - Edge cases: Gmail OAuth token expiry, invalid recipient email, sending limits.

- **Send a message to group**  
  - Type: Telegram node  
  - Role: Sends a formatted message to a Telegram chat group to alert on weekly analytics insights.  
  - Config:  
    - Message text includes date range and AI summary output formatted for Telegram.  
    - Chat ID must be set to the target Telegram group/channel.  
    - Uses Telegram API credentials.  
  - Input: Same as “Notify Stakeholders.”  
  - Output: None (end node).  
  - Edge cases: Invalid chat ID, Telegram API limits, message formatting errors.

---

### 3. Summary Table

| Node Name               | Node Type                      | Functional Role                          | Input Node(s)        | Output Node(s)                   | Sticky Note                                                                                  |
|-------------------------|--------------------------------|----------------------------------------|----------------------|---------------------------------|----------------------------------------------------------------------------------------------|
| Schedule Trigger        | Schedule Trigger               | Weekly workflow trigger                 | None                 | Get a weekly report             |                                                                                              |
| Get a weekly report     | Google Analytics (GA4)         | Fetch weekly Google Analytics data     | Schedule Trigger     | Aggregate                      |                                                                                              |
| Aggregate              | Aggregate                      | Normalize GA rows into single JSON     | Get a weekly report  | AI Agent                      | ## Aggregate\n\nNormalize GA rows into a single JSON                                         |
| AI Agent               | LangChain Agent                | Generate concise AI analytics summary  | Aggregate            | Insight Sentiment Analysis      | ## AI Agent\n\nConsume the aggregated JSON. Processing the JSON with custom prompt for insights |
| Simple Memory          | LangChain Memory Buffer Window | Stores weekly reports for trend memory | AI Agent (ai_memory) | AI Agent (ai_memory context)    | ## Simple Memory\n\nSave each week's report and key metrics. Use for trend detection.        |
| Google Gemini Chat Model| Google Gemini AI Model         | Backend AI language model               | AI Agent, Sentiment Analysis | AI Agent, Insight Sentiment Analysis |                                                                                              |
| Insight Sentiment Analysis | LangChain Sentiment Analysis | Classify AI summary sentiment           | AI Agent             | Notify Stakeholders, Send a message to group |                                                                                              |
| Notify Stakeholders     | Gmail                         | Email report to stakeholders            | Insight Sentiment Analysis | None                        | ## Notify Stakeholders\n\nSend a message with following range date of the weekly report      |
| Send a message to group | Telegram                      | Send report message to Telegram group  | Insight Sentiment Analysis | None                        | ## Send Message\n\nBuild concise alert message for ops/marketing channel                     |
| Sticky Note            | Sticky Note                   | Documentation notes                     | None                 | None                          | ## AI-Powered Google Analytics Insights + Sentiment Routing\nThis n8n automation runs weekly to fetch the latest Google Analytics data, generate AI-powered insights, and classify the sentiment of the report.\n\n💡 Goal: Deliver actionable analytics updates automatically, ensuring positive trends are celebrated and negative trends are addressed quickly. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create “Schedule Trigger” node**  
   - Type: Schedule Trigger  
   - Configure interval: Every 7 days  

2. **Create “Get a weekly report” node**  
   - Type: Google Analytics (GA4)  
   - Set Property ID to `483751327` (replace with your GA4 property ID)  
   - Metrics: eventCount, userEngagementDuration, active7DayUsers, active28DayUsers, sessions  
   - Dimensions: none (optional)  
   - Connect OAuth2 credentials for Google Analytics  
   - Connect output of “Schedule Trigger” to input of this node  

3. **Create “Aggregate” node**  
   - Type: Aggregate  
   - Aggregation method: Aggregate all items into one JSON  
   - Connect input from “Get a weekly report” node  

4. **Create “Google Gemini Chat Model” node**  
   - Type: Google Gemini (PaLM) AI Model  
   - Add credentials for Google Palm API  
   - No special parameters needed  
   - This node will be used as AI language model input for the AI Agent and Sentiment Analysis nodes  

5. **Create “Simple Memory” node**  
   - Type: LangChain Memory Buffer Window  
   - Session Key: Set to aggregated JSON input (`={{ $json.data }}`)  
   - Session ID Type: Custom Key  

6. **Create “AI Agent” node**  
   - Type: LangChain Agent  
   - Input text: `={{ $json.data }}` (aggregated JSON from Aggregate node)  
   - Use “Google Gemini Chat Model” as AI language model  
   - Use “Simple Memory” node for memory buffer  
   - System Message:  
     ```
     Acting as a experience data analyst who mainly working with the analytics data. Please analyze the those google analytics report with the past history. Give the insightful and important summary. Make it concise maximum 1000 chars. The important information must give `` so user can notice easily. The result must follow the telegram messenger format. Compare with your memory as well.

     Think step by step.
     ```  
   - Connect input from “Aggregate” node  
   - Connect AI language model input from “Google Gemini Chat Model”  
   - Connect AI memory input from “Simple Memory”  

7. **Create “Insight Sentiment Analysis” node**  
   - Type: LangChain Sentiment Analysis  
   - Input text: `={{ $json.output }}` (AI Agent output)  
   - Categories: `Positive, Negative`  
   - Use “Google Gemini Chat Model” as AI language model  
   - Connect input from “AI Agent” node  

8. **Create “Notify Stakeholders” node**  
   - Type: Gmail  
   - Configure OAuth2 credentials for Gmail account  
   - Send To: Add email addresses of stakeholders  
   - Subject: `=GA Weekly Report - Positive Trends - {{ $today.minus(7,'days').format('yyyy-MM-dd') }} - {{ $today.format('yyyy-MM-dd') }}`  
   - Message: `={{ $('AI Agent').item.json.output }}`  
   - Connect input from “Insight Sentiment Analysis” node  

9. **Create “Send a message to group” node**  
   - Type: Telegram  
   - Configure Telegram API credentials  
   - Chat ID: Set to target Telegram group/channel ID  
   - Text:  
     ```
     Weekly Analytics Report by Gemini 
     `{{ $today.minus(7,'days').format('yyyy-MM-dd') }}` to `{{ $today.format('yyyy-MM-dd') }}`

     {{ $json.output }}
     ```  
   - Connect input from “Insight Sentiment Analysis” node  

10. **Connect nodes according to the following order:**  
    - Schedule Trigger → Get a weekly report → Aggregate → AI Agent → Insight Sentiment Analysis → Notify Stakeholders  
                                                                                              → Send a message to group  
    - Google Gemini Chat Model connected as AI language model to AI Agent and Insight Sentiment Analysis  
    - Simple Memory connected as AI memory to AI Agent  

---

### 5. General Notes & Resources

| Note Content                                                                                                                 | Context or Link                                                                                 |
|------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| This n8n automation runs weekly to fetch the latest Google Analytics data, generate AI-powered insights, and classify sentiment. | Workflow description provided in Sticky Note node.                                            |
| Goal: Deliver actionable analytics updates automatically, ensuring positive trends are celebrated and negative trends addressed quickly. | Workflow purpose and business value summary.                                                  |
| AI Agent uses a custom prompt to generate concise, Telegram-formatted analytics summaries with important info highlighted using backticks. | Node “AI Agent” system message instructions.                                                  |
| Memory buffer stores weekly aggregated reports for trend comparison; can be replaced with other databases or memory implementations. | Node “Simple Memory” usage note.                                                              |
| Google Gemini (PaLM) API credentials must be set up and authorized for AI processing and sentiment classification.            | Credential management requirement.                                                            |
| Gmail OAuth2 and Telegram API credentials are mandatory for notification delivery.                                            | Credential management requirement for outbound messages.                                     |

---

**Disclaimer:** The provided text is exclusively derived from an automated workflow created with n8n, respecting current content policies, containing no illegal or offensive elements. All processed data is legal and public.