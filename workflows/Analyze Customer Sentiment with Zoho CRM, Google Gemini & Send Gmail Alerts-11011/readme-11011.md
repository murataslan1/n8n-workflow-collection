Analyze Customer Sentiment with Zoho CRM, Google Gemini & Send Gmail Alerts

https://n8nworkflows.xyz/workflows/analyze-customer-sentiment-with-zoho-crm--google-gemini---send-gmail-alerts-11011


# Analyze Customer Sentiment with Zoho CRM, Google Gemini & Send Gmail Alerts

### 1. Workflow Overview

This workflow is designed to monitor Zoho CRM for newly created Notes related to customer interactions, analyze the sentiment of the note content using AI (Google Gemini or other Large Language Models), update the sentiment results back into Zoho CRM, and send internal email alerts if negative sentiment is detected. It enables real-time customer sentiment tracking tied directly to CRM records, turning Zoho CRM into an early-warning system for customer dissatisfaction.

The workflow is logically divided into the following blocks:

- **1.1 Trigger & Data Fetch:** Periodically triggers and fetches the most recent note from Zoho CRM.
- **1.2 Text Preparation:** Extracts and cleans relevant text content from the note for analysis.
- **1.3 Sentiment Analysis:** Uses AI language models to classify the sentiment of the note content and parse structured output.
- **1.4 Sentiment Update & Alerting:** Updates the sentiment results into Zoho CRM and sends Gmail alerts if negative sentiment is detected.

---

### 2. Block-by-Block Analysis

#### 1.1 Trigger & Data Fetch

**Overview:**  
This block periodically triggers the workflow and fetches the latest note from Zoho CRM to process customer interaction data in near real-time.

**Nodes Involved:**  
- Schedule Trigger  
- HTTP Request (Zoho CRM Notes API)

**Node Details:**

- **Schedule Trigger**  
  - Type: Trigger node that runs on a scheduled interval (every few minutes).  
  - Configuration: Runs every X minutes (default unspecified, configurable).  
  - Input/Output: No input; outputs trigger event to next node.  
  - Edge Cases: Missed triggers if n8n is down; too frequent calls may hit API rate limits.

- **HTTP Request (Zoho CRM Notes API)**  
  - Type: HTTP request node.  
  - Configuration: Uses Zoho OAuth2 credentials to call Zoho CRM API endpoint for Notes, fetching the most recent note by sorting on Modified_Time descending with a page size of 1.  
  - URL: `https://www.zohoapis.com/crm/v2/Notes?per_page=1&sort_by=Modified_Time&sort_order=desc`  
  - Authentication: Zoho OAuth2 required.  
  - Input: Trigger from Schedule Trigger node.  
  - Output: JSON response containing latest note data.  
  - Edge Cases: Authentication expiry; API rate limits; empty or malformed responses.

---

#### 1.2 Text Preparation

**Overview:**  
Extracts and sanitizes the relevant note text and metadata for sentiment analysis.

**Nodes Involved:**  
- Code in JavaScript

**Node Details:**

- **Code in JavaScript**  
  - Type: Function node executing JavaScript.  
  - Configuration: Extracts the first note from the HTTP response, safely accessing note content and related IDs. Returns an object containing:  
    - `text`: note content (or empty string if none)  
    - `note_id`: note unique ID  
    - `parent_id`: ID of the related CRM record (e.g., Contact, Lead)  
    - `module`: CRM module name of the parent record  
  - Input: JSON from HTTP Request node.  
  - Output: Cleaned and structured data for downstream AI processing.  
  - Edge Cases: Missing fields in API response; empty note content.

---

#### 1.3 Sentiment Analysis

**Overview:**  
Uses AI language models to classify the sentiment of the extracted note text as Positive, Neutral, or Negative, with a numeric sentiment score.

**Nodes Involved:**  
- Basic LLM Chain  
- Google Gemini Chat Model (configured as AI model)  
- Structured Output Parser

**Node Details:**

- **Google Gemini Chat Model**  
  - Type: AI language model node, configured for Google Gemini.  
  - Configuration: Uses Google Palm API credentials.  
  - Input: Receives text prompt for sentiment classification from Basic LLM Chain node.  
  - Output: AI-generated sentiment analysis response.  
  - Edge Cases: API quota limits; network issues; malformed prompt.

- **Basic LLM Chain**  
  - Type: LangChain LLM Chain node for prompt management and output parsing.  
  - Configuration:  
    - Prompt instructs to classify sentiment as Positive, Neutral, or Negative with numeric score.  
    - Output parser enabled for structured responses.  
  - Input: Text prepared from previous JavaScript node.  
  - Output: Parsed sentiment label and score.  
  - Edge Cases: Invalid AI response format; unexpected sentiment labels.

- **Structured Output Parser**  
  - Type: Output parser node to enforce JSON structure on AI output.  
  - Configuration: Expects JSON with keys `sentiment_label` and `sentiment_score`.  
  - Input: AI output from Google Gemini Chat Model.  
  - Output: Structured JSON for sentiment data.  
  - Edge Cases: Parsing failure if AI output deviates from expected JSON.

---

#### 1.4 Sentiment Update & Alerting

**Overview:**  
Updates the sentiment label and score back into the appropriate Zoho CRM record and sends an email alert via Gmail if the sentiment is negative.

**Nodes Involved:**  
- If  
- HTTP Request2 (Update CRM record)  
- Send a message (Gmail)  
- HTTP Request1 (Update CRM record after email)

**Node Details:**

- **If**  
  - Type: Conditional node.  
  - Configuration: Checks if the sentiment label equals "Negative".  
  - Input: Sentiment result from Basic LLM Chain.  
  - Output: Routes to alert email if true, otherwise just updates CRM.  
  - Edge Cases: Case sensitivity issues; unexpected sentiment labels.

- **Send a message (Gmail)**  
  - Type: Gmail Email node.  
  - Configuration: Sends alert email to configured recipients with details including record ID, note ID, sentiment label, score, and note text.  
  - Credentials: Gmail OAuth2 required.  
  - Input: Triggered only if negative sentiment detected.  
  - Edge Cases: Email sending failure; invalid email addresses.

- **HTTP Request2**  
  - Type: HTTP request node to Zoho CRM API.  
  - Configuration: Updates the parent CRM record (module and ID extracted earlier) with new sentiment label and score fields.  
  - Method: PUT  
  - Authentication: Zoho OAuth2  
  - Input: Receives sentiment data from AI output parser.  
  - Output: API response confirming update.  
  - Edge Cases: API failures; permission errors; invalid record IDs.

- **HTTP Request1**  
  - Type: HTTP request node to Zoho CRM API.  
  - Configuration: Similar to HTTP Request2, updates the CRM record after the alert email is sent (possibly redundant or for confirmation).  
  - Edge Cases: Same as above.

---

### 3. Summary Table

| Node Name           | Node Type                        | Functional Role                        | Input Node(s)          | Output Node(s)        | Sticky Note                                                                                     |
|---------------------|---------------------------------|-------------------------------------|-----------------------|-----------------------|------------------------------------------------------------------------------------------------|
| Schedule Trigger     | Schedule Trigger                | Periodic trigger to start workflow  | —                     | HTTP Request           | ## Trigger & Fetch<br>Monitors Zoho CRM for newly created Notes and pulls the content for processing. |
| HTTP Request        | HTTP Request                    | Fetch latest note from Zoho CRM     | Schedule Trigger       | Code in JavaScript     | ## Trigger & Fetch<br>Monitors Zoho CRM for newly created Notes and pulls the content for processing. |
| Code in JavaScript  | Function (JavaScript)           | Extract and prepare note text       | HTTP Request           | Basic LLM Chain        | ## Text Preparation<br>Cleans and formats the text before sending it to the sentiment model.    |
| Basic LLM Chain      | LangChain LLM Chain             | Sentiment classification prompt     | Code in JavaScript     | If                    | ## Sentiment Analysis<br>AI evaluates tone and returns Positive, Neutral, or Negative sentiment with optional confidence score. |
| Google Gemini Chat Model | AI Language Model (Google Gemini) | AI model for sentiment classification | Basic LLM Chain (ai_languageModel) | Basic LLM Chain (ai_languageModel) | ## Sentiment Analysis<br>AI evaluates tone and returns Positive, Neutral, or Negative sentiment with optional confidence score. |
| Structured Output Parser | LangChain Output Parser       | Parse structured sentiment output   | Google Gemini Chat Model | Basic LLM Chain (ai_outputParser) | ## Sentiment Analysis<br>AI evaluates tone and returns Positive, Neutral, or Negative sentiment with optional confidence score. |
| If                  | If Condition                   | Check if sentiment is Negative      | Basic LLM Chain        | Send a message / HTTP Request2 | ## Update sentiment in ZOHO CRM<br>Check for the sentiment's positive and negative approach, and updates sentiment Label and score in Zoho CRM. IF negative sentiment found, then gives alert in Gmail. |
| Send a message       | Gmail                          | Send alert email on negative sentiment | If (true branch)       | HTTP Request1          | ## Update sentiment in ZOHO CRM<br>Check for the sentiment's positive and negative approach, and updates sentiment Label and score in Zoho CRM. IF negative sentiment found, then gives alert in Gmail. |
| HTTP Request1        | HTTP Request                   | Update CRM record after email sent  | Send a message         | —                      | ## Update sentiment in ZOHO CRM<br>Check for the sentiment's positive and negative approach, and updates sentiment Label and score in Zoho CRM. IF negative sentiment found, then gives alert in Gmail. |
| HTTP Request2        | HTTP Request                   | Update CRM record with sentiment data | If (false branch)      | —                      | ## Update sentiment in ZOHO CRM<br>Check for the sentiment's positive and negative approach, and updates sentiment Label and score in Zoho CRM. IF negative sentiment found, then gives alert in Gmail. |
| Sticky Note          | Sticky Note                    | Documentation                       | —                     | —                      | ## Workflow Overview<br>How It Works, Setup Steps, and general workflow explanation.             |
| Sticky Note1         | Sticky Note                    | Documentation                       | —                     | —                      | ## Trigger & Fetch<br>Monitors Zoho CRM for newly created Notes and pulls the content for processing. |
| Sticky Note2         | Sticky Note                    | Documentation                       | —                     | —                      | ## Text Preparation<br>Cleans and formats the text before sending it to the sentiment model.    |
| Sticky Note3         | Sticky Note                    | Documentation                       | —                     | —                      | ## Sentiment Analysis<br>AI evaluates tone and returns Positive, Neutral, or Negative sentiment with optional confidence score. |
| Sticky Note4         | Sticky Note                    | Documentation                       | —                     | —                      | ## Update sentiment in ZOHO CRM<br>Check for the sentiment's positive and negative approach, and updates sentiment Label and score in Zoho CRM. IF negative sentiment found, then gives alert in Gmail. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Configure interval to run every X minutes (e.g., 5 minutes) to poll for new notes.

2. **Create HTTP Request Node to Fetch Latest Note**  
   - Type: HTTP Request  
   - URL: `https://www.zohoapis.com/crm/v2/Notes?per_page=1&sort_by=Modified_Time&sort_order=desc`  
   - Authentication: Use Zoho OAuth2 credentials with Notes/Activities module access.  
   - Method: GET  
   - Connect Schedule Trigger output to this node’s input.

3. **Add Code in JavaScript Node to Extract Note Content**  
   - Type: Function (JavaScript)  
   - Code snippet:  
     ```javascript
     const note = $json.data?.[0] || {};
     return {
       text: note.Note_Content || "",
       note_id: note.id,
       parent_id: note.Parent_Id?.id,
       module: note.$se_module
     };
     ```  
   - Connect HTTP Request output to this node.

4. **Add Google Gemini Chat Model Node**  
   - Type: AI Language Model (Google Gemini)  
   - Credentials: Configure Google Palm API credentials.  
   - No additional parameters needed for this node directly.

5. **Add Structured Output Parser Node**  
   - Type: LangChain Output Parser  
   - Configuration: Set JSON schema example:  
     ```json
     {
       "sentiment_label": "neutral",
       "sentiment_score": "1.00"
     }
     ```  
   - Connect Google Gemini Chat Model output to this node.

6. **Add Basic LLM Chain Node**  
   - Type: LangChain LLM Chain  
   - Configure prompt text:  
     ```
     Classify the sentiment of this text as: Positive, Neutral, or Negative. Sentiment score should be numeric based on analysis
     Return ONLY the label and score.
     Text: {{$json.text}}
     ```  
   - Enable output parser and select the Structured Output Parser node.  
   - Connect Code in JavaScript output to Basic LLM Chain input.  
   - Connect Google Gemini Chat Model to Basic LLM Chain as AI model.  
   - Connect Structured Output Parser to Basic LLM Chain as output parser.

7. **Add If Node for Negative Sentiment Check**  
   - Type: If  
   - Condition: Check if `{{$json.output.sentiment_label}}` equals "Negative" (case-sensitive).  
   - Connect Basic LLM Chain output to If node.

8. **Add HTTP Request2 Node to Update CRM Record**  
   - Type: HTTP Request  
   - URL: `https://www.zohoapis.com/crm/v2/{{ $('Code in JavaScript').item.json.module }}/{{ $('Code in JavaScript').item.json.parent_id }}`  
   - Method: PUT  
   - Body (JSON):  
     ```json
     {
       "data": [
         {
           "id": "{{ $('Code in JavaScript').item.json.parent_id }}",
           "Sentiment_Label": "{{ $json.output.sentiment_label }}",
           "Sentiment_Score": "{{ $json.output.sentiment_score }}"
         }
       ]
     }
     ```  
   - Authentication: Zoho OAuth2 credentials.  
   - Connect If node's "false" output to this node.

9. **Add Send a message (Gmail) Node**  
   - Type: Gmail  
   - Configure recipient email address(es).  
   - Subject: "🚨 Negative sentiment detected"  
   - Message:  
     ```
     Hi Team,
     🚨 Negative sentiment detected
     Record: {{ $('Code in JavaScript').item.json.parent_id }}
     Note ID: {{ $('Code in JavaScript').item.json.note_id }}
     Sentiment: {{ $('Basic LLM Chain').item.json.output.sentiment_label }}
     Score: {{ $('Basic LLM Chain').item.json.output.sentiment_score }}
     Text: {{ $('Code in JavaScript').item.json.text }}
     ```  
   - Credentials: Gmail OAuth2 credentials.  
   - Connect If node's "true" output to this node.

10. **Add HTTP Request1 Node to Update CRM After Email**  
    - Same configuration as HTTP Request2 node to update CRM record.  
    - Connect Send a message node output to this node.

11. **Connect Workflow Nodes as per above logical flow:**

    - Schedule Trigger → HTTP Request (fetch notes) → Code in JavaScript → Basic LLM Chain → If  
    - If (true) → Send a message → HTTP Request1  
    - If (false) → HTTP Request2

12. **Add Custom Fields in Zoho CRM**  
    - Add two custom fields in all relevant Modules:  
      - Sentiment_Label (Text)  
      - Sentiment_Score (Number or Text)  

13. **Credentials Setup**  
    - Zoho OAuth2: With access to CRM Notes and relevant modules.  
    - Google Palm API: For Google Gemini model access.  
    - Gmail OAuth2: For sending alerts.

14. **Activate and Test**  
    - Activate the workflow.  
    - Create a new note in Zoho CRM to trigger the workflow and verify sentiment analysis and alerting.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                    | Context or Link                                                                                  |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Workflow monitors Zoho CRM Notes in real time, analyzes sentiment using AI, updates CRM records, and sends alerts for negative sentiment. Set up OAuth2 credentials for Zoho, Google Gemini, and Gmail before activation.                                                                                                                                                           | Workflow Overview sticky note                                                                    |
| Add two custom fields to Zoho CRM modules to store Sentiment Label and Sentiment Score. Ensure API user has write permissions for these fields.                                                                                                                                                                                                                               | Setup instruction from Workflow Overview sticky note                                            |
| Email alerts notify internal teams promptly about negative customer sentiment to enable proactive response. Customize recipient email addresses in the Gmail node.                                                                                                                                                                                                           | Gmail node configuration note                                                                    |
| The AI prompt used can be adapted for other languages or sentiment classification schemes, but must output JSON with keys `sentiment_label` and `sentiment_score` for parsing.                                                                                                                                                                                                | Prompt configuration in Basic LLM Chain node                                                    |
| For best accuracy, ensure note content is properly sanitized and cleaned before AI analysis; adjust JavaScript code if Zoho CRM API response format changes.                                                                                                                                                                                                                   | JavaScript code node note                                                                        |
| Google Gemini requires Google Palm API credentials with quota. Monitor API usage to avoid rate limits or overage charges.                                                                                                                                                                                                                                                     | Google Gemini Chat Model node credentials note                                                   |
| Gmail node uses OAuth2; ensure token refresh capability is enabled to prevent email sending failures.                                                                                                                                                                                                                                                                           | Gmail credentials note                                                                           |
| The workflow uses Zoho CRM API v2 endpoints. Changes in Zoho API may require updates to HTTP Request nodes.                                                                                                                                                                                                                                                                     | Zoho API version considerations                                                                 |
| For debugging, enable execution logs and inspect intermediate node outputs in n8n to identify errors or unexpected data formats.                                                                                                                                                                                                                                              | General debugging recommendation                                                                |
| Workflow timezone is set to Asia/Kolkata; adjust as needed in workflow settings for your region.                                                                                                                                                                                                                                                                                 | Workflow settings note                                                                          |
| [Zoho CRM API Documentation](https://www.zoho.com/crm/developer/docs/api/v2/) for API details.  
[Google Palm API Documentation](https://developers.generativeai.google/) for AI model usage.  
[n8n Docs on OAuth2 Credentials](https://docs.n8n.io/credentials/oauth2/) for credential setup.                                                                                                                       | Useful external references                                                                      |

---

This completes the comprehensive reference document for the "Zoho CRM - Sentiment Analysis for Customer Interactions" workflow.