AI-Powered Meeting Minutes with GPT-4, Task Assignment & Multichannel Distribution

https://n8nworkflows.xyz/workflows/ai-powered-meeting-minutes-with-gpt-4--task-assignment---multichannel-distribution-9146


# AI-Powered Meeting Minutes with GPT-4, Task Assignment & Multichannel Distribution

### 1. Workflow Overview

This workflow automates the entire process of generating, distributing, and tracking meeting minutes and action items using AI and multiple integrations. It is designed for organizations that want to convert raw meeting transcripts into professional summaries, extract actionable tasks, distribute these documents and notifications across multiple channels, and track tasks within Google Tasks.

**Target Use Cases:**
- Automating meeting documentation from raw transcripts.
- Creating concise summaries with AI.
- Extracting and prioritizing action items.
- Distributing meeting minutes and tasks via email and Slack.
- Creating actionable tasks in Google Tasks for follow-up.
- Centralized, permanent storage of meeting minutes in Google Drive.

**Logical Blocks:**

- **1.1 Input Reception & Data Normalization:** Receive meeting data via webhook and extract essential metadata.
- **1.2 Transcript Cleaning & Validation:** Clean the raw transcript text and validate its quality.
- **1.3 AI Processing:** Generate meeting summary and extract action items using GPT-4.
- **1.4 Data Parsing and Enrichment:** Combine AI results, parse and enrich action items with metadata, sorting, and deadlines.
- **1.5 PDF Generation:** Convert enriched meeting data into a professionally styled PDF document.
- **1.6 Distribution:** Distribute the PDF and meeting summaries to all participants via bulk email; notify Slack channel.
- **1.7 Task Management Integration:** Split action items, create tasks in Google Tasks, group tasks by assignee, and send personalized emails.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception & Data Normalization

**Overview:**  
Receives raw meeting data through a webhook POST request and extracts standardized metadata fields for downstream processing.

**Nodes Involved:**  
- Receive Meeting Data  
- Extract Meeting Metadata

**Node Details:**

- **Receive Meeting Data**  
  - Type: Webhook  
  - Role: Entry point; listens for HTTP POST requests at `/webhook/meeting-minutes`.  
  - Configuration: Accepts JSON payload with meeting details (title, date, participants, duration, transcript). Responds after workflow completion.  
  - Inputs: External HTTP request  
  - Outputs: JSON data with raw meeting info  
  - Edge cases: Missing fields; defaults handled downstream  

- **Extract Meeting Metadata**  
  - Type: Set node  
  - Role: Normalizes and sets default values for key metadata fields:  
    - `meetingTitle` (default: "Untitled Meeting")  
    - `meetingDate` (default: current date)  
    - `participants` (default: empty array)  
    - `duration` (default: "Not specified")  
    - `rawTranscript` (default: empty string)  
  - Inputs: Output of webhook node  
  - Outputs: JSON with normalized fields  
  - Edge cases: Missing or malformed inputs; handled by default values  

---

#### 1.2 Transcript Cleaning & Validation

**Overview:**  
Cleans the raw transcript text to remove noise and validates transcript length before AI processing to avoid unnecessary calls.

**Nodes Involved:**  
- Clean Transcript  
- Validate Transcript Length

**Node Details:**

- **Clean Transcript**  
  - Type: Code node (JavaScript)  
  - Role: Cleans transcript by:  
    - Removing multiple spaces  
    - Stripping timestamps (e.g., [00:01:23])  
    - Removing generic speaker labels (e.g., "Speaker 1:")  
    - Trimming whitespace  
    - Counting words  
    - Estimating reading time (~200 wpm)  
  - Outputs: `cleanedTranscript`, `transcriptWordCount`, `estimatedReadingTime`, and timestamp of processing  
  - Inputs: Normalized meeting metadata  
  - Edge cases: Empty or very short transcripts; handled downstream  

- **Validate Transcript Length**  
  - Type: If node  
  - Role: Quality gate; checks if:  
    - Transcript is not empty  
    - Word count > 50  
  - If passes: proceeds to AI processing  
  - If fails: stops workflow; avoids AI costs  
  - Edge cases: Empty or too short transcripts halt execution  

---

#### 1.3 AI Processing

**Overview:**  
Uses GPT-4 via OpenAI API to generate a professional meeting summary and extract structured action items in parallel.

**Nodes Involved:**  
- Generate Meeting Summary  
- Extract Action Items  
- Combine AI Responses

**Node Details:**

- **Generate Meeting Summary**  
  - Type: OpenAI (GPT-4) node via Langchain integration  
  - Role: Produces a 200-300 word, 3-4 paragraph meeting summary in professional business language, third-person perspective.  
  - Configuration: Temperature 0.3, max tokens 1000, system prompt guides style and content.  
  - Inputs: Cleaned transcript and metadata  
  - Outputs: Summary text in OpenAI response format  
  - Edge cases: API errors, token limits, network issues  

- **Extract Action Items**  
  - Type: OpenAI (GPT-4) node via Langchain integration  
  - Role: Extracts actionable tasks as a JSON array with fields: task, assignee, deadline, priority, context.  
  - Configuration: Temperature 0.2, max tokens 1500, strict JSON-only response expected.  
  - Inputs: Cleaned transcript and metadata  
  - Outputs: JSON object with action_items array  
  - Edge cases: Parsing errors if invalid JSON returned, API failures  

- **Combine AI Responses**  
  - Type: Merge node (Append mode)  
  - Role: Combines summary and action items outputs into a 2-item array for parallel processing downstream  
  - Inputs: Outputs from the two OpenAI nodes  
  - Outputs: Array containing both AI responses  

---

#### 1.4 Data Parsing and Enrichment

**Overview:**  
Parses AI responses, enriches action items with metadata (IDs, deadline status), sorts by priority and deadline, and generates summary metadata.

**Nodes Involved:**  
- Parse and Enrich Data

**Node Details:**

- **Parse and Enrich Data**  
  - Type: Code node (JavaScript)  
  - Role:  
    - Extracts summary text and parses action items JSON from AI responses  
    - Enriches action items with:  
      - Unique IDs  
      - Days until deadline, deadline status (overdue, urgent, upcoming, future)  
      - Sorts items by priority (urgent→low) and deadline  
    - Generates metadata such as counts, assignee breakdown, overdue/urgent flags  
    - Maintains meeting metadata from earlier nodes  
  - Inputs: Combined AI responses  
  - Outputs: Enriched meeting data object including summary, action items array, and metadata  
  - Edge cases: JSON parse errors, missing fields, date parsing issues  

---

#### 1.5 PDF Generation

**Overview:**  
Generates a professionally styled PDF document summarizing the meeting and its action items with clear visual hierarchy and color-coded priorities.

**Nodes Involved:**  
- Generate PDF Document  
- Download PDF from URL  
- Save PDF to Drive  
- Add PDF Download Link

**Node Details:**

- **Generate PDF Document**  
  - Type: HTML/CSS to PDF node (htmlcsstopdf API)  
  - Role: Converts meeting data (summary, participants, action items) into a styled PDF document with:  
    - Gradient header, metadata grid, summary section  
    - Action items table with priority and deadline badges  
    - Summary statistics cards  
    - Footer with generation timestamp  
  - Inputs: Parsed and enriched meeting data (JSON)  
  - Outputs: Base64 encoded PDF data and download URL  
  - Edge cases: Styling errors, API errors, large documents  

- **Download PDF from URL**  
  - Type: HTTP Request node  
  - Role: Downloads the generated PDF as binary data (required for Google Drive upload)  
  - Inputs: PDF URL from previous node  
  - Outputs: Binary PDF file  
  - Edge cases: Download failures, timeouts  

- **Save PDF to Drive**  
  - Type: Google Drive node  
  - Role: Uploads the PDF binary to a specific Drive folder ("Minutes of Meeting") with filename pattern `Meeting_Minutes_[Title]_[Date].pdf`  
  - Inputs: Binary PDF file  
  - Outputs: Google Drive file metadata including `webViewLink`  
  - Edge cases: Permission errors, quota limits  

- **Add PDF Download Link**  
  - Type: Set node  
  - Role: Extracts and sets `pdfUrl` and filename from Google Drive upload response for subsequent use  
  - Inputs: Google Drive file metadata  
  - Outputs: Augmented meeting data including `pdfUrl`  

---

#### 1.6 Distribution

**Overview:**  
Sends bulk email to all participants with meeting summary, action items, and PDF download link; posts notification to a Slack channel.

**Nodes Involved:**  
- Email All Participants  
- Notify Slack Channel

**Node Details:**

- **Email All Participants**  
  - Type: Gmail node  
  - Role: Sends a single email to all participants (comma-separated) including:  
    - Meeting summary highlights  
    - Action items list with assignees, deadlines, priorities  
    - Download link to PDF  
    - Meeting stats  
  - Inputs: Parsed meeting data including `participants` array and `pdfUrl`  
  - Configuration: Uses Gmail OAuth2 credentials  
  - Edge cases: Email delivery failures, invalid addresses  

- **Notify Slack Channel**  
  - Type: Slack node  
  - Role: Posts message to a designated Slack channel with meeting title, date, participant count, action items summary, and PDF link  
  - Inputs: Augmented meeting data  
  - Configuration: Uses Slack OAuth2 credentials  
  - Edge cases: Slack API rate limits, auth errors  

---

#### 1.7 Task Management Integration

**Overview:**  
Splits action items into individual tasks, creates them in Google Tasks, groups tasks by assignee, and sends personalized emails to each assignee with their tasks.

**Nodes Involved:**  
- Split Tasks for Creation  
- Create Task in Google Tasks  
- Group Tasks by Assignee  
- Send Individual Task Emails

**Node Details:**

- **Split Tasks for Creation**  
  - Type: Code node (JavaScript)  
  - Role: Converts the array of action items into multiple items (one per task) for individual processing  
  - Inputs: Enriched meeting data  
  - Outputs: One output item per task  

- **Create Task in Google Tasks**  
  - Type: Google Tasks node  
  - Role: Creates a task in a specified Google Tasks list with fields:  
    - Title: task description  
    - Notes: context, meeting title/date, assignee, priority  
    - Due date: ISO 8601 format (no time zone issues)  
  - Inputs: Individual task items  
  - Configuration: Uses Google Tasks OAuth2 credentials, default task list  
  - Edge cases: API limits, invalid dates, auth errors  

- **Group Tasks by Assignee**  
  - Type: Code node (JavaScript)  
  - Role: Aggregates tasks by assignee to reduce email volume (one email per assignee, not per task)  
  - Inputs: Parsed meeting data with all action items and PDF URL  
  - Outputs: One item per unique assignee with an array of their tasks  

- **Send Individual Task Emails**  
  - Type: Gmail node  
  - Role: Sends personalized emails to each assignee at `[assignee]@yourcompany.com` (domain must be customized) with:  
    - Number of tasks assigned  
    - Task details with priority color coding and deadlines  
    - Download link to the full meeting minutes PDF  
  - Inputs: Grouped tasks by assignee  
  - Edge cases: Invalid email addresses, delivery errors, domain customization required  

---

### 3. Summary Table

| Node Name                | Node Type                 | Functional Role                          | Input Node(s)             | Output Node(s)                      | Sticky Note                                                                                              |
|--------------------------|---------------------------|----------------------------------------|---------------------------|-----------------------------------|----------------------------------------------------------------------------------------------------------|
| Receive Meeting Data      | Webhook                   | Receives meeting data via POST         | -                         | Extract Meeting Metadata            | ## WEBHOOK ENDPOINT - Receives POST with meeting data. Expected payload: title, date, participants[], duration, transcript. Returns 200 status. |
| Extract Meeting Metadata  | Set                       | Normalizes and sets meeting metadata   | Receive Meeting Data       | Clean Transcript                   | ## DATA NORMALIZATION - Extracts fields and sets defaults for title, date, participants, duration, raw transcript. |
| Clean Transcript         | Code                      | Cleans transcript text and counts words | Extract Meeting Metadata   | Validate Transcript Length         | ## TRANSCRIPT CLEANING - Removes spaces, timestamps, speaker labels; counts words; estimates reading time. |
| Validate Transcript Length | If                       | Quality gate: checks transcript length | Clean Transcript           | Generate Meeting Summary, Extract Action Items | ## QUALITY GATE - Validates transcript not empty and >50 words; stops workflow if fails.                   |
| Generate Meeting Summary  | OpenAI (GPT-4)            | Generates professional meeting summary | Validate Transcript Length| Combine AI Responses               | ## OPENAI SUMMARY (GPT-4) - Temp 0.3; max tokens 1000; generates 200-300 word summary in 3-4 paragraphs. |
| Extract Action Items      | OpenAI (GPT-4)            | Extracts structured action items JSON  | Validate Transcript Length| Combine AI Responses               | ## OPENAI ACTION EXTRACTION (GPT-4) - Temp 0.2; max tokens 1500; returns JSON array of action items.       |
| Combine AI Responses      | Merge (Append)            | Combines summary and action items into array | Generate Meeting Summary, Extract Action Items | Parse and Enrich Data              | ## COMBINE AI RESPONSES - Appends AI outputs for parallel processing.                                   |
| Parse and Enrich Data     | Code                      | Parses AI responses, enriches & sorts data | Combine AI Responses       | Generate PDF Document, Split Tasks for Creation | ## DATA STRUCTURING - Extracts summary, parses JSON, enriches actions with IDs, deadlines, sorts, generates metadata. |
| Generate PDF Document     | HTML CSS to PDF           | Creates styled PDF of meeting minutes  | Parse and Enrich Data      | Email All Participants, Download PDF from URL | ## PDF CONVERSION - Converts HTML+CSS to PDF with styling and badges. Uses htmlcsstopdf API.              |
| Download PDF from URL     | HTTP Request              | Downloads PDF binary from URL           | Generate PDF Document      | Save PDF to Drive                 | ## PDF URL FETCH - Downloads PDF file for Drive upload. Response format: binary file.                     |
| Save PDF to Drive         | Google Drive              | Uploads PDF to Drive folder             | Download PDF from URL      | Add PDF Download Link             | ## CLOUD STORAGE - Uploads PDF to Google Drive folder "Minutes of Meeting". Permanent storage.            |
| Add PDF Download Link     | Set                       | Extracts Drive webViewLink as pdfUrl   | Save PDF to Drive          | Notify Slack Channel, Group Tasks by Assignee | ## URL EXTRACTION - Extracts webViewLink for distribution; preserves meeting data.                        |
| Email All Participants    | Gmail                     | Sends bulk email with minutes & action items | Generate PDF Document      | -                               | ## BULK EMAIL NOTIFICATION - Sends to all participants with summary, action items, PDF link, stats.      |
| Notify Slack Channel      | Slack                     | Posts meeting summary and link to Slack channel | Add PDF Download Link      | -                               | ## TEAM CHANNEL UPDATE - Posts meeting info, participants, action items, PDF link to Slack channel.      |
| Group Tasks by Assignee   | Code                      | Groups action items by assignee name   | Add PDF Download Link      | Send Individual Task Emails       | ## ASSIGNEE GROUPING - Groups tasks by assignee; reduces email volume to one per person.                 |
| Send Individual Task Emails | Gmail                   | Sends personalized task emails per assignee | Group Tasks by Assignee    | -                               | ## PERSONALIZED TASK NOTIFICATIONS - Sends tasks count and details to each assignee’s email (custom domain). |
| Split Tasks for Creation  | Code                      | Splits all action items into individual tasks | Parse and Enrich Data      | Create Task in Google Tasks       | ## TASK ITEM SEPARATION - Creates one item per action item for task creation in Google Tasks.            |
| Create Task in Google Tasks | Google Tasks            | Creates tasks in Google Tasks           | Split Tasks for Creation   | -                               | ## TASK MANAGEMENT INTEGRATION - Creates tasks with title, notes, due date in Google Tasks default list. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node: "Receive Meeting Data"**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: `meeting-minutes`  
   - Response Mode: Last Node (send response after workflow completion)  
   - This node acts as the entry point to receive meeting data JSON.

2. **Create Set Node: "Extract Meeting Metadata"**  
   - Set variables using expressions from webhook JSON:  
     - `meetingTitle`: `{{$json.body.title || "Untitled Meeting"}}`  
     - `meetingDate`: `{{$json.body.date || $now.format('yyyy-MM-dd')}}`  
     - `participants`: `{{$json.body.participants || []}}`  
     - `duration`: `{{$json.duration || "Not specified"}}`  
     - `rawTranscript`: `{{$json.transcript || $json.body.transcript || ""}}`  
   - Connect output of webhook to this node.

3. **Create Code Node: "Clean Transcript"**  
   - JavaScript code to clean transcript text:  
     - Remove multiple spaces  
     - Strip timestamps `[00:00:00]` or `(00:00:00)`  
     - Remove speaker labels like "Speaker 1:"  
     - Trim whitespace  
     - Count words and estimate reading time at 200 words/min  
     - Add processing timestamp  
   - Connect from "Extract Meeting Metadata".

4. **Create If Node: "Validate Transcript Length"**  
   - Condition:  
     - `cleanedTranscript` is not empty  
     - `transcriptWordCount` > 50  
   - On "true" branch connect to AI nodes; on "false" branch stop workflow.

5. **Create OpenAI Node: "Generate Meeting Summary"**  
   - Model: GPT-4  
   - Temperature: 0.3  
   - Max Tokens: 1000  
   - System prompt: Executive assistant style, 3-4 paragraphs, third person, concise but comprehensive  
   - User prompt: Includes meeting metadata and cleaned transcript  
   - Use OpenAI API credentials.

6. **Create OpenAI Node: "Extract Action Items"**  
   - Model: GPT-4  
   - Temperature: 0.2  
   - Max Tokens: 1500  
   - System prompt: Extract tasks as JSON only with fields task, assignee, deadline, priority, context  
   - User prompt: Meeting metadata and cleaned transcript  
   - Use OpenAI API credentials.

7. **Create Merge Node: "Combine AI Responses"**  
   - Mode: Append  
   - Connect summary node to input 1, action items node to input 2.

8. **Create Code Node: "Parse and Enrich Data"**  
   - Parse AI responses: extract summary string and parse JSON action items  
   - Enrich action items: add unique IDs, calculate days until deadline, assign deadline status  
   - Sort by priority and deadline  
   - Generate metadata summaries (counts, assignee breakdowns)  
   - Use metadata from "Clean Transcript" node  
   - Connect from "Combine AI Responses".

9. **Create HTML CSS to PDF Node: "Generate PDF Document"**  
   - Input: enriched meeting data  
   - Use provided HTML template with CSS styling (header, tables, badges)  
   - Output format: Base64 PDF data  
   - Use htmlcsstopdf API credentials.

10. **Create HTTP Request Node: "Download PDF from URL"**  
    - URL: PDF URL from previous node's output  
    - Response Format: File (binary)  
    - Connect from "Generate PDF Document".

11. **Create Google Drive Node: "Save PDF to Drive"**  
    - Upload binary PDF file to "Minutes of Meeting" folder  
    - Filename: `Meeting_Minutes_[Title]_[Date].pdf` (replace spaces with underscores)  
    - Use Google Drive OAuth2 credentials.  
    - Connect from "Download PDF from URL".

12. **Create Set Node: "Add PDF Download Link"**  
    - Extract `webViewLink` and filename from Drive upload response  
    - Set variables `pdfUrl` and `pdfFileName`  
    - Connect from "Save PDF to Drive".

13. **Create Gmail Node: "Email All Participants"**  
    - To: All participants joined by commas  
    - Subject: "📋 Meeting Minutes - [Title] ([Date])"  
    - HTML message includes summary highlights, action items, PDF download link, meeting stats  
    - Use Gmail OAuth2 credentials  
    - Connect from "Generate PDF Document".

14. **Create Slack Node: "Notify Slack Channel"**  
    - Post message to configured channel with meeting title, date, participant count, action items summary, and PDF link  
    - Use Slack OAuth2 credentials  
    - Connect from "Add PDF Download Link".

15. **Create Code Node: "Group Tasks by Assignee"**  
    - Group action items by assignee name into separate output items  
    - Include pdfUrl and meeting metadata  
    - Connect from "Add PDF Download Link".

16. **Create Gmail Node: "Send Individual Task Emails"**  
    - To: `${assignee}@yourcompany.com` (customize domain)  
    - Subject: "⚡ [TaskCount] Action Item(s) from [MeetingTitle]"  
    - HTML message includes task details, priority color coding, deadline info, PDF link  
    - Use Gmail OAuth2 credentials  
    - Connect from "Group Tasks by Assignee".

17. **Create Code Node: "Split Tasks for Creation"**  
    - Split action items into one output item per task with relevant fields  
    - Connect from "Parse and Enrich Data".

18. **Create Google Tasks Node: "Create Task in Google Tasks"**  
    - Create task in selected Google Tasks list  
    - Title: task description  
    - Notes: context, meeting info, assignee, priority  
    - Due date: ISO 8601 with time component  
    - Use Google Tasks OAuth2 credentials  
    - Connect from "Split Tasks for Creation".

---

### 5. General Notes & Resources

| Note Content | Context or Link |
|--------------|-----------------|
| Workflow automates meeting documentation and task distribution using AI and integrates with Gmail, Slack, Google Drive, Google Tasks, and htmlcsstopdf API. | Workflow overview sticky note in node "Sticky Note18" |
| Setup requires credentials for OpenAI, Gmail OAuth2, Google Drive OAuth2, Google Tasks OAuth2, Slack OAuth2, and htmlcsstopdf API. | Setup instructions sticky note in node "Sticky Note19" |
| Workflow input format example for webhook POST: `{ "title": "Meeting Title", "date": "2025-09-29", "participants": ["person1@email.com", "person2@email.com"], "duration": "45 minutes", "transcript": "Full meeting transcript text here..." }` | Setup instructions sticky note |
| PDF styling includes gradient header, color-coded priority badges, organized action items table, and summary statistics cards. | PDF Conversion sticky note linked to node "Generate PDF Document" |
| Priority detection keywords include “ASAP”, “urgent”, “immediately”, “critical”, “by end of day”. | AI Action Extraction sticky note |
| Emails to individual assignees require customization of domain in "Send Individual Task Emails" Gmail node to match actual company email addresses. | Personalized task notifications sticky note |
| Consider adding error handling and retries via n8n Error Trigger nodes for production robustness. | Workflow overview sticky note |

---

**Disclaimer:** The provided text derives exclusively from an automated workflow created with n8n, respecting all current content policies and containing no illegal, offensive, or protected elements. All processed data is legal and public.