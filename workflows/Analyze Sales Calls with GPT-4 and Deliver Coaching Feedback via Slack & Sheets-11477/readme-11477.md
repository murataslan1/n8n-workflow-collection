Analyze Sales Calls with GPT-4 and Deliver Coaching Feedback via Slack & Sheets

https://n8nworkflows.xyz/workflows/analyze-sales-calls-with-gpt-4-and-deliver-coaching-feedback-via-slack---sheets-11477


# Analyze Sales Calls with GPT-4 and Deliver Coaching Feedback via Slack & Sheets

### 1. Workflow Overview

This workflow, titled **Analyze Sales Calls with GPT-4 and Deliver Coaching Feedback via Slack & Sheets**, is designed to transform recorded sales meetings into actionable coaching feedback automatically. It targets sales teams and managers who want to leverage AI-driven insights to improve sales call performance through objective metrics and sentiment analysis.

The workflow logic is organized into the following main blocks:

- **1.1 Trigger & Fetch Data:** Detects when a new transcript is ready from the tldv service via webhook, fetches detailed meeting data and the transcript content.
- **1.2 AI Analysis Core:** Processes the transcript with GPT-4 to evaluate sales metrics and generates a detailed coaching analysis in JSON format. Independently, it prepares video-related data and performs emotion analysis (simulated here).
- **1.3 Merge & Generate Final Report:** Combines transcript analysis and emotion analysis results, then uses GPT-4 again to generate a comprehensive, structured feedback report in markdown format.
- **1.4 Format & Deliver:** Parses the final report to extract key metrics for Google Sheets, formats Slack message blocks, and delivers the feedback via Slack and archives data in a Google Sheet.

---

### 2. Block-by-Block Analysis

#### 1.1 Trigger & Fetch Data

**Overview:**  
This block initiates the workflow by listening for webhook events from tldv indicating a transcript is ready. It extracts the meeting ID and event info, fetches full transcript and meeting details, and parses them for further processing.

**Nodes Involved:**  
- Webhook - Trigger  
- Send Webhook Response  
- Extract Meeting ID  
- Fetch Transcript  
- Fetch Meeting Details  
- Parse Transcript  
- Parse Meeting Data  
- Merge Data Meeting  

**Node Details:**

- **Webhook - Trigger**  
  - Type: Webhook  
  - Role: Entry point, listens on POST path `tldv-feedback-v7159` for `TranscriptReady` event.  
  - Configuration: Responds immediately with JSON `{"status":"received","message":"Processing started"}`.  
  - Input: External webhook call from tldv.  
  - Output: JSON body forwarded to next nodes.  
  - Failures: Webhook unreachable, invalid payload, authorization issues.  

- **Send Webhook Response**  
  - Type: Respond to Webhook  
  - Role: Sends immediate acknowledgment to tldv after receiving the event.  
  - Configuration: JSON response body with status and message.  
  - Input: From Webhook node.  
  - Output: Ends webhook HTTP response cycle.  

- **Extract Meeting ID**  
  - Type: Set Node  
  - Role: Extracts `meetingId`, `webhookEvent`, and `executedAt` timestamp from webhook payload.  
  - Configuration: Uses expressions to map body fields into named variables for downstream use.  
  - Input: Webhook payload JSON.  
  - Output: JSON with extracted fields.  
  - Edge cases: Missing meetingId or malformed payload could cause failure downstream.  

- **Fetch Transcript**  
  - Type: HTTP Request  
  - Role: Retrieves full transcript data for the meeting from tldv API.  
  - Configuration: GET request to `https://pasta.tldv.io/v1alpha1/meetings/{{meetingId}}/transcript` with header `x-api-key`.  
  - Input: meetingId from previous node.  
  - Output: Transcript JSON data.  
  - Failures: API key invalid, meetingId invalid, network timeout.  

- **Fetch Meeting Details**  
  - Type: HTTP Request  
  - Role: Fetches detailed meeting metadata (name, organizer, invitees, duration).  
  - Configuration: GET request to `https://pasta.tldv.io/v1alpha1/meetings/{{meetingId}}` with API key header.  
  - Input: meetingId extracted earlier.  
  - Output: Meeting details JSON.  
  - Failures: As above, plus possible rate limits or data not found.  

- **Parse Transcript**  
  - Type: Set Node  
  - Role: Converts transcript array into a formatted full transcript string with speaker labels.  
  - Configuration: Maps transcript entries to `[speaker] text` format, joined by newlines.  
  - Input: Transcript JSON array.  
  - Output: `fullTranscript` string and raw transcript data.  
  - Edge cases: Empty transcript array, null fields.  

- **Parse Meeting Data**  
  - Type: Set Node  
  - Role: Extracts key meeting metadata fields into named variables for easier access.  
  - Configuration: Extracts `videoUrl`, `meetingName`, `organizer`, `invitees`, `duration`.  
  - Input: Meeting details JSON.  
  - Output: Structured meeting metadata object.  

- **Merge Data Meeting**  
  - Type: Merge Node  
  - Role: Combines parsed transcript and meeting data into single JSON object for unified downstream processing.  
  - Configuration: Combines by position (index).  
  - Input: From Parse Transcript and Parse Meeting Data nodes.  
  - Output: Merged meeting + transcript data.  

---

#### 1.2 AI Analysis Core

**Overview:**  
This block analyzes the transcript content with GPT-4, prepares video analysis metadata, and performs emotion analysis (simulated) on meeting video frames.

**Nodes Involved:**  
- Prepare Video Analysis  
- Analyze Emotions  
- Analyze Transcript GPT  
- Parse GPT Analysis  
- Merge All Analyses  

**Node Details:**

- **Prepare Video Analysis**  
  - Type: Code Node  
  - Role: Prepares metadata for video processing, including frame extraction interval.  
  - Configuration: Adds `videoDownloadUrl`, `frameExtractionNeeded` (true), and `frameInterval` (10 seconds) fields.  
  - Input: Merged meeting data.  
  - Output: Meeting data augmented with video analysis flags.  

- **Analyze Emotions**  
  - Type: Code Node  
  - Role: Simulates emotion timeline and average emotions from video frames (placeholder for GPT-4 Vision analysis).  
  - Configuration: Returns hardcoded example emotion data for joy, interest, concern, confusion, boredom.  
  - Input: Prepared video analysis data.  
  - Output: JSON with `emotionTimeline`, `averageEmotions`, and note about real implementation.  
  - Edge cases: Placeholder; real integration requires video frame extraction and OpenAI Vision API.  

- **Analyze Transcript GPT**  
  - Type: HTTP Request  
  - Role: Calls OpenAI GPT-4 API to analyze the full transcript, scoring multiple sales metrics and providing JSON feedback.  
  - Configuration: POST to OpenAI chat completion endpoint with model `gpt-4o`, temperature 0.3, system prompt sets coaching expert role, user prompt includes meeting info and transcript, requesting JSON output.  
  - Input: Merged meeting + transcript data.  
  - Output: GPT JSON analysis in text response.  
  - Failures: API key invalid, rate limit, malformed input, JSON parse errors.  

- **Parse GPT Analysis**  
  - Type: Set Node  
  - Role: Parses GPT response JSON string into an object and keeps meeting metadata for downstream merging.  
  - Configuration: JSON.parse of GPT content, assignment of meetingId, meetingName, duration.  
  - Input: GPT raw response.  
  - Output: Parsed structured analysis data.  
  - Edge cases: Invalid JSON in GPT response.  

- **Merge All Analyses**  
  - Type: Merge Node  
  - Role: Combines transcript analysis and emotion analysis into a single JSON object for final reporting.  
  - Configuration: Merge by position.  
  - Input: From Parse GPT Analysis and Analyze Emotions nodes.  
  - Output: Unified analysis result.  

---

#### 1.3 Merge & Generate Final Report

**Overview:**  
Integrates all analysis results to generate a comprehensive coaching feedback report in Markdown format using GPT-4.

**Nodes Involved:**  
- Generate Final Report  
- Extract Final Report  

**Node Details:**

- **Generate Final Report**  
  - Type: HTTP Request  
  - Role: Calls OpenAI GPT-4 to create a structured and readable feedback report integrating conversation and emotion analysis.  
  - Configuration: POST with `gpt-4o`, temperature 0.5, system prompt as sales coaching expert, user prompt includes meeting info, transcript analysis, emotion averages, instructions for report sections, output in Markdown.  
  - Input: Merged analysis data (transcript + emotion).  
  - Output: Markdown report string in GPT response.  
  - Failures: API errors, malformed input, rate limits.  

- **Extract Final Report**  
  - Type: Set Node  
  - Role: Extracts final report text from GPT response, timestamps generation time, and preserves meeting metadata.  
  - Configuration: Assigns `finalReport`, `reportGeneratedAt` (ISO timestamp), `meetingId`, `meetingName`.  
  - Input: GPT response from Generate Final Report.  
  - Output: Cleaned report JSON for next steps.  

---

#### 1.4 Format & Deliver

**Overview:**  
Parses the final report to extract key metrics, formats Slack message blocks, sends the summary to Slack channel, and appends detailed data into Google Sheets.

**Nodes Involved:**  
- Build Slack Blocks  
- Extract Sheets Data  
- Format Sheets Data  
- Filter Slack Response  
- Send Slack  
- Append to Google Sheets  

**Node Details:**

- **Build Slack Blocks**  
  - Type: Code Node  
  - Role: Converts Markdown report into Slack block kit format with headers, sections, dividers, and context footer for rich Slack messaging.  
  - Configuration: Removes Markdown code fences, parses section headers (`## 1. ...`), adds emojis, formats sub-sections and content lines, appends footer.  
  - Input: Final report markdown text.  
  - Output: JSON `slackBlocks` for Slack API.  
  - Edge cases: Unexpected Markdown formatting may cause incomplete blocks.  

- **Extract Sheets Data**  
  - Type: Code Node  
  - Role: Parses the Markdown report text to extract numerical scores and summarized text snippets for Google Sheets columns.  
  - Configuration: Splits report by lines, searches for key patterns (e.g. 総合評価スコア, 商談成功可能性), extracts top 3 improvement suggestions, good points, next steps.  
  - Input: Final report JSON.  
  - Output: JSON with extracted fields matching Google Sheet columns.  
  - Edge cases: Report format changes can break extraction logic.  

- **Format Sheets Data**  
  - Type: Set Node  
  - Role: Maps extracted report fields into column names matching the Google Sheet schema.  
  - Configuration: Assigns timestamp, meeting name/id, scores, emotion percentages, summaries, and full report.  
  - Input: Extracted Sheets data.  
  - Output: Data ready for Google Sheets append.  

- **Filter Slack Response**  
  - Type: Code Node  
  - Role: Prepares Slack message payload with channel ID, blocks, and fallback text.  
  - Configuration: Checks if `slackBlocks` is an array, creates channel payload with meeting name in text.  
  - Input: Slack blocks JSON.  
  - Output: Slack API message payload.  
  - Edge cases: If `slackBlocks` is missing or malformed, throws error.  

- **Send Slack**  
  - Type: Slack node  
  - Role: Sends the formatted Slack message to a predefined channel `C0A0FH3272Q`.  
  - Configuration: Uses OAuth2 Slack credentials, sends message as block type with fallback text.  
  - Input: Filtered Slack response payload.  
  - Output: Slack API response.  
  - Failures: Slack API authorization errors, channel not found, rate limits.  

- **Append to Google Sheets**  
  - Type: Google Sheets node  
  - Role: Appends extracted and formatted sales call data into a Google Sheet named `商談フィードバック`.  
  - Configuration: Maps columns automatically, uses OAuth2 credentials linked to document ID `1mrr_KweC9JThYdghm67ySyDjNZwG16sTlUvzLRnv4Zw`.  
  - Input: Formatted Sheets data.  
  - Output: Confirmation of append operation.  
  - Failures: Google Sheets API authorization errors, sheet missing, column mismatch.  

---

### 3. Summary Table

| Node Name              | Node Type              | Functional Role                          | Input Node(s)                   | Output Node(s)                | Sticky Note                                                                                                          |
|------------------------|------------------------|----------------------------------------|--------------------------------|------------------------------|----------------------------------------------------------------------------------------------------------------------|
| Webhook - Trigger      | Webhook                | Entry point webhook for transcript ready event | -                              | Send  Webhook Response        |                                                                                                                      |
| Send  Webhook Response | Respond to Webhook      | Acknowledges webhook receipt             | Webhook - Trigger              | Extract Meeting ID            |                                                                                                                      |
| Extract Meeting ID     | Set                    | Extracts meeting ID and event info       | Send  Webhook Response         | Fetch Transcript, Fetch Meeting Details |                                                                                                                      |
| Fetch Transcript       | HTTP Request           | Retrieves meeting transcript             | Extract Meeting ID             | Parse Transcript             |                                                                                                                      |
| Fetch Meeting Details  | HTTP Request           | Retrieves meeting metadata                | Extract Meeting ID             | Parse Meeting Data            |                                                                                                                      |
| Parse Transcript       | Set                    | Formats transcript array into string     | Fetch Transcript               | Merge Data Meeting            |                                                                                                                      |
| Parse Meeting Data     | Set                    | Extracts meeting metadata fields          | Fetch Meeting Details          | Merge Data Meeting            |                                                                                                                      |
| Merge Data Meeting     | Merge                  | Combines transcript and meeting data     | Parse Transcript, Parse Meeting Data | Prepare Video Analysis, Analyze Transcript GPT |                                                                                                                      |
| Prepare Video Analysis | Code                   | Prepares video analysis metadata          | Merge Data Meeting             | Analyze Emotions             |                                                                                                                      |
| Analyze Emotions       | Code                   | Simulates emotion analysis from video    | Prepare Video Analysis         | Merge All Analyses            |                                                                                                                      |
| Analyze Transcript GPT | HTTP Request           | Calls GPT-4 to analyze transcript content | Merge Data Meeting             | Parse GPT Analysis            |                                                                                                                      |
| Parse GPT Analysis     | Set                    | Parses GPT JSON analysis response          | Analyze Transcript GPT         | Merge All Analyses            |                                                                                                                      |
| Merge All Analyses     | Merge                  | Combines transcript and emotion analysis  | Parse GPT Analysis, Analyze Emotions | Generate Final Report         |                                                                                                                      |
| Generate Final Report  | HTTP Request           | Calls GPT-4 to generate final coaching report | Merge All Analyses             | Extract Final Report          |                                                                                                                      |
| Extract Final Report   | Set                    | Extracts final report text and metadata   | Generate Final Report          | Build Slack Blocks            |                                                                                                                      |
| Build Slack Blocks     | Code                   | Formats final report as Slack blocks      | Extract Final Report           | Extract Sheets Data           | ## 3. Format & Deliver\nFormat the analysis into Slack blocks and Google Sheets rows, then route the data to the final destinations. |
| Extract Sheets Data    | Code                   | Parses report for Google Sheets data      | Build Slack Blocks             | Format Sheets Data, Filter Slack Response |                                                                                                                      |
| Format Sheets Data     | Set                    | Maps extracted data to Google Sheets columns | Extract Sheets Data            | Append to Google Sheets       |                                                                                                                      |
| Filter Slack Response  | Code                   | Prepares Slack message payload             | Extract Sheets Data            | Send Slack                   |                                                                                                                      |
| Send Slack             | Slack                  | Delivers feedback message to Slack channel | Filter Slack Response          | -                            |                                                                                                                      |
| Append to Google Sheets| Google Sheets           | Archives sales feedback data in Google Sheets | Format Sheets Data             | -                            |                                                                                                                      |
| Main Description       | Sticky Note             | Overview and setup instructions           | -                              | -                            | # AI Sales Coach (tldv + GPT-4)\nThis workflow turns sales meetings into coaching opportunities by automatically analyzing **tldv** recordings to provide actionable feedback... |
| Sticky Note 1          | Sticky Note             | Describes Trigger & Fetch Data block     | -                              | -                            | ## 1. Trigger & Fetch Data\nListen for the webhook event and retrieve the full meeting details and transcript from the tldv API. |
| Sticky Note 2          | Sticky Note             | Describes AI Analysis Core block          | -                              | -                            | ## 2. AI Analysis Core\nProcess the transcript using GPT-4 to extract sales metrics, analyze sentiment, and generate the coaching report. |
| Sticky Note 3          | Sticky Note             | Describes Format & Deliver block          | -                              | -                            | ## 3. Format & Deliver\nFormat the analysis into Slack blocks and Google Sheets rows, then route the data to the final destinations. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Webhook Node**
   - Name: `Webhook - Trigger`
   - HTTP Method: POST
   - Path: `tldv-feedback-v7159`
   - Response Mode: `responseNode`
   - Purpose: Receive tldv `TranscriptReady` webhook.

2. **Add Respond to Webhook Node**
   - Name: `Send  Webhook Response`
   - Connect input from `Webhook - Trigger`
   - Configure to respond immediately with JSON: `{"status":"received","message":"Processing started"}`

3. **Add Set Node to Extract Meeting ID**
   - Name: `Extract Meeting ID`
   - Connect input from `Send  Webhook Response`
   - Assign variables:
     - `meetingId` = `{{$json.body.data.meetingId}}`
     - `webhookEvent` = `{{$json.body.event}}`
     - `executedAt` = `{{$json.body.executedAt}}`

4. **Add HTTP Request to Fetch Transcript**
   - Name: `Fetch Transcript`
   - Connect input from `Extract Meeting ID`
   - Method: GET
   - URL: `https://pasta.tldv.io/v1alpha1/meetings/{{$json.meetingId}}/transcript`
   - Headers: `x-api-key` with your tldv API key.

5. **Add HTTP Request to Fetch Meeting Details**
   - Name: `Fetch Meeting Details`
   - Connect input from `Extract Meeting ID`
   - Method: GET
   - URL: `https://pasta.tldv.io/v1alpha1/meetings/{{$json.meetingId}}`
   - Headers: same as above.

6. **Add Set Node to Parse Transcript**
   - Name: `Parse Transcript`
   - Connect input from `Fetch Transcript`
   - Assign variables:
     - `transcriptData` = `{{$json.data}}`
     - `fullTranscript` = `{{$json.data.map(item => \`[${item.speaker}] ${item.text}\`).join('\n')}}`

7. **Add Set Node to Parse Meeting Data**
   - Name: `Parse Meeting Data`
   - Connect input from `Fetch Meeting Details`
   - Assign variables:
     - `videoUrl` = `{{$json.url}}`
     - `meetingName` = `{{$json.name}}`
     - `organizer` = `{{$json.organizer}}`
     - `invitees` = `{{$json.invitees}}`
     - `duration` = `{{$json.duration}}`

8. **Add Merge Node to Combine Transcript and Meeting Data**
   - Name: `Merge Data Meeting`
   - Connect inputs from `Parse Transcript` (input 2) and `Parse Meeting Data` (input 1)
   - Merge Mode: Combine by Position

9. **Add Code Node to Prepare Video Analysis**
   - Name: `Prepare Video Analysis`
   - Connect input from `Merge Data Meeting`
   - JS code:
     ```js
     const items = $input.all();
     return items.map(item => ({
       json: {
         ...item.json,
         videoDownloadUrl: item.json.videoUrl,
         frameExtractionNeeded: true,
         frameInterval: 10,
       }
     }));
     ```

10. **Add Code Node to Analyze Emotions (Simulated)**
    - Name: `Analyze Emotions`
    - Connect input from `Prepare Video Analysis`
    - JS code: (as per original, returns sample emotion data and note)

11. **Add HTTP Request to Analyze Transcript with GPT-4**
    - Name: `Analyze Transcript GPT`
    - Connect input from `Merge Data Meeting`
    - POST to `https://api.openai.com/v1/chat/completions`
    - Authentication: OpenAI API credentials
    - Body:
      - model: `gpt-4o`
      - temperature: 0.3
      - messages: system prompt defining coaching expert, user prompt with meeting info and transcript, requesting JSON response.
    - Response format: JSON object

12. **Add Set Node to Parse GPT Analysis**
    - Name: `Parse GPT Analysis`
    - Connect input from `Analyze Transcript GPT`
    - Parse `JSON.parse($json.choices[0].message.content)`
    - Pass through meetingId, meetingName, duration from `Merge Data Meeting`

13. **Add Merge Node to Combine Analyses**
    - Name: `Merge All Analyses`
    - Connect inputs from `Parse GPT Analysis` and `Analyze Emotions`
    - Merge Mode: Combine by Position

14. **Add HTTP Request to Generate Final Report**
    - Name: `Generate Final Report`
    - Connect input from `Merge All Analyses`
    - POST to OpenAI Chat Completion endpoint with:
      - model: `gpt-4o`
      - temperature: 0.5
      - messages: system prompt for sales coaching expert, user prompt with integrated analysis and instructions for Markdown report.

15. **Add Set Node to Extract Final Report**
    - Name: `Extract Final Report`
    - Connect input from `Generate Final Report`
    - Assign:
      - `finalReport` = `$json.choices[0].message.content`
      - `reportGeneratedAt` = current timestamp ISO string
      - meetingId, meetingName from `Merge Data Meeting`

16. **Add Code Node to Build Slack Blocks**
    - Name: `Build Slack Blocks`
    - Connect input from `Extract Final Report`
    - JS code to parse Markdown report and create Slack block kit JSON with sections, headers, dividers, and footer.

17. **Add Code Node to Extract Sheets Data**
    - Name: `Extract Sheets Data`
    - Connect input from `Build Slack Blocks`
    - JS code to parse final report content for scores, emotion percentages, and summaries for Google Sheets columns.

18. **Add Set Node to Format Sheets Data**
    - Name: `Format Sheets Data`
    - Connect input from `Extract Sheets Data`
    - Map extracted fields to Japanese column names matching Google Sheet schema.

19. **Add Code Node to Filter Slack Response**
    - Name: `Filter Slack Response`
    - Connect input from `Extract Sheets Data`
    - Prepare Slack message payload with channel ID, blocks JSON, and fallback text.

20. **Add Slack Node to Send Message**
    - Name: `Send Slack`
    - Connect input from `Filter Slack Response`
    - Credentials: Slack OAuth2 with appropriate permissions
    - Channel: `C0A0FH3272Q`
    - Message type: Block

21. **Add Google Sheets Node to Append Data**
    - Name: `Append to Google Sheets`
    - Connect input from `Format Sheets Data`
    - Operation: Append
    - Sheet Name: `商談フィードバック`
    - Document ID: `1mrr_KweC9JThYdghm67ySyDjNZwG16sTlUvzLRnv4Zw`
    - Map columns as per the workflow assignment

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                  | Context or Link                                                    |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| This workflow uses tldv API to trigger on transcript completion events (`TranscriptReady`). Ensure the webhook URL is registered in tldv settings.                                                                                             | Workflow Trigger Setup                                            |
| OpenAI GPT-4 model is used twice: once for detailed transcript analysis (JSON output), then to generate a structured Markdown coaching report integrating emotion data.                                                                        | OpenAI API Integration                                            |
| Google Sheet `商談フィードバック` must exist with columns in Japanese as mapped in the workflow to correctly archive coaching feedback data.                                                                                                | Google Sheets Data Storage                                        |
| Slack channel ID `C0A0FH3272Q` is hardcoded; update as needed. Slack OAuth2 credentials must have permission to post messages with blocks.                                                                                                     | Slack Delivery Setup                                              |
| Emotion analysis is simulated via static data; real implementation requires video frame extraction and GPT-4 Vision or equivalent for facial expression analysis.                                                                             | Placeholder for Emotion Analysis                                  |
| The Slack formatting node parses Markdown sections by regex (`## 1.`, `## 2.` etc.) and attaches emojis for visual clarity. Ensure report structure is consistent to avoid formatting errors in Slack.                                         | Slack Message Formatting                                          |
| Extracted data for Sheets depends on parsing Markdown keys in Japanese (e.g., `総合評価スコア`, `商談成功可能性`). Modifying report format requires updating parsing code accordingly.                                                        | Report Parsing for Sheets                                         |
| For large meetings, API rate limits or timeouts might occur; consider implementing retries or chunking transcript texts if needed.                                                                                                            | Performance and Reliability Considerations                        |
| Sticky notes in the workflow provide high-level block descriptions and setup instructions, including credential configuration for tldv, OpenAI, Slack, and Google OAuth2.                                                                     | Documentation embedded in workflow sticky notes                   |
| Project inspired by AI-powered sales coaching concepts, leveraging transcript and emotion data for actionable feedback.                                                                                                                     | Conceptual Overview                                               |

---

**Disclaimer:** The provided text is exclusively derived from an automated workflow created with n8n, a tool for integration and automation. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and public.