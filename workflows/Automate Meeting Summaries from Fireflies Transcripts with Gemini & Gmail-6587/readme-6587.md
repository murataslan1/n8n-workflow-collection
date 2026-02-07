Automate Meeting Summaries from Fireflies Transcripts with Gemini & Gmail

https://n8nworkflows.xyz/workflows/automate-meeting-summaries-from-fireflies-transcripts-with-gemini---gmail-6587


# Automate Meeting Summaries from Fireflies Transcripts with Gemini & Gmail

### 1. Workflow Overview

This workflow automates the end-to-end process of obtaining meeting transcripts from Fireflies.ai, extracting relevant meeting information, generating summaries using AI (Google Gemini & OpenAI), and delivering meeting recaps via Gmail. It is designed to streamline meeting note management by automatically detecting meeting recap emails, extracting transcripts, processing and summarizing content, and sending or drafting comprehensive emails for clients or internal use.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception and Triggering:** Supports three triggers—manual, webhook, and Gmail email detection for automatic initiation.
- **1.2 Transcript Retrieval:** Fetches meeting transcripts from Fireflies.ai using the meeting ID.
- **1.3 Transcript Parsing & Data Extraction:** Extracts meeting links from emails, parses transcript data, and prepares it for AI summarization.
- **1.4 AI Summarization and Processing:** Uses Google Gemini and OpenAI models to generate expert summaries and structured meeting insights.
- **1.5 Email Preparation and Sending:** Converts AI output to HTML, formats emails, and sends or drafts messages via Gmail.
- **1.6 Utility and Aggregation:** Combines partial results and manages data flow to ensure coherent outputs.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Triggering

**Overview:**  
This block manages workflow initiation through three possible triggers: manual trigger for testing, webhook for external API calls, and Gmail trigger for incoming meeting recap emails.

**Nodes Involved:**  
- "When clicking ‘Execute workflow’" (Manual Trigger)  
- "Webhook" (Webhook Trigger)  
- "Gmail Trigger" (Email Trigger)  

**Node Details:**  

- **When clicking ‘Execute workflow’**  
  - Type: Manual Trigger  
  - Role: Allows manual workflow execution for testing or ad hoc runs.  
  - Configuration: No parameters; triggers workflow execution.  
  - Inputs: None  
  - Outputs: Connects to "Set MeetingId" node to set a static meeting ID for testing.  
  - Edge Cases: None specific; manual only.

- **Webhook**  
  - Type: Webhook  
  - Role: Receives POST requests with meeting data (meetingId) to trigger workflow.  
  - Configuration: HTTP POST method on path "880cfe0f-5c81-46cd-b717-be89dfa045cf"  
  - Inputs: External HTTP POST request carrying meetingId in JSON body.  
  - Outputs: Connects to "Get a transcript" node.  
  - Edge Cases: Invalid or missing meetingId in POST body may cause downstream failures.

- **Gmail Trigger**  
  - Type: Gmail Trigger  
  - Role: Automatically triggers workflow upon receiving emails with subject "Your meeting recap" from "fred@fireflies.ai".  
  - Configuration: Polls every hour at 1 minute past the hour; filters on subject and sender.  
  - Inputs: Incoming Gmail messages matching filter.  
  - Outputs: Connects to "Get a message" node to fetch full email details.  
  - Edge Cases: Gmail API quota, OAuth token expiration, or filter mismatches.

---

#### 2.2 Transcript Retrieval

**Overview:**  
Fetches the full transcript of a meeting from Fireflies.ai using the meetingId obtained from the trigger nodes.

**Nodes Involved:**  
- "Set MeetingId"  
- "Get a transcript"  

**Node Details:**  

- **Set MeetingId**  
  - Type: Set  
  - Role: Sets a static meetingId for manual testing runs.  
  - Configuration: Sets `body.meetingId` to a fixed string "01K18TW3MEX4XQ3TBG4RAD88HX".  
  - Inputs: From manual trigger.  
  - Outputs: Connects to "Get a transcript".  
  - Edge Cases: Hardcoded; must be updated for real meetings or replaced by dynamic triggers.

- **Get a transcript**  
  - Type: Fireflies.ai API node  
  - Role: Retrieves transcript JSON data for the given meetingId.  
  - Configuration: Uses expression `={{ $json.body.meetingId }}` to fetch meetingId dynamically; requires Fireflies API credentials.  
  - Inputs: MeetingId from webhook or Set MeetingId.  
  - Outputs: Connects to "Set sentences" and "Set summary" nodes for further processing.  
  - Edge Cases: API errors, invalid meetingId, connectivity issues.  
  - Requirements: Fireflies API key configured in credentials.

---

#### 2.3 Transcript Parsing & Data Extraction

**Overview:**  
Handles extraction of meeting links from Gmail messages, parses transcript sentences, re-formats data, and prepares the transcript text for AI summarization.

**Nodes Involved:**  
- "Gmail Trigger"  
- "Get a message"  
- "Set Meeting link"  
- "Information Extractor"  
- "Code1"  
- "Set sentences"  
- "Full transcript"  

**Node Details:**  

- **Get a message**  
  - Type: Gmail node (get operation)  
  - Role: Retrieves full email message based on Gmail Trigger’s message ID.  
  - Configuration: Uses dynamic messageId from trigger, retrieves full message (not simple).  
  - Inputs: Gmail trigger.  
  - Outputs: Connects to "Set Meeting link".  
  - Edge Cases: API quota, token expiration.

- **Set Meeting link**  
  - Type: Set  
  - Role: Assigns the extracted email text to a variable `text` for further processing.  
  - Configuration: Sets `text` from `$json.text` of the email content.  
  - Inputs: From "Get a message".  
  - Outputs: Connects to "Information Extractor".  
  - Edge Cases: Missing or malformed email body.

- **Information Extractor**  
  - Type: LangChain Information Extractor  
  - Role: Extracts the meeting link from the email text using a system prompt instructing to extract relevant info only.  
  - Configuration: System prompt: "You are an expert extraction algorithm... extract relevant information...". Extracts attribute: `meeting_notes` (meeting link).  
  - Inputs: Text from "Set Meeting link".  
  - Outputs: Connects to "Code1".  
  - Edge Cases: Extraction failure if meeting link format changes; missing attribute.

- **Code1**  
  - Type: Code (JavaScript)  
  - Role: Parses the extracted meeting link to isolate the meetingId.  
  - Configuration: Extracts substring between "::" and "?" in the meeting_notes URL to assign `body.meetingId`.  
  - Inputs: JSON output from "Information Extractor".  
  - Outputs: Passes processed `body.meetingId` to "Get a transcript".  
  - Edge Cases: Unexpected URL format causing substring extraction to fail or produce empty meetingId.

- **Set sentences**  
  - Type: Set  
  - Role: Assigns the `sentences` array from the transcript JSON to a variable for code processing.  
  - Configuration: Sets `sentences` from `$json.data.sentences`.  
  - Inputs: From "Get a transcript".  
  - Outputs: Connects to "Full transcript".  
  - Edge Cases: Missing or empty sentences array.

- **Full transcript**  
  - Type: Code (JavaScript)  
  - Role: Concatenates transcript sentences into a full transcript string with speaker labels.  
  - Configuration: Iterates over `sentences` array, using fallback fields for text, prepending speaker names. Returns combined transcript and total segment count.  
  - Inputs: From "Set sentences".  
  - Outputs: Connects to "Expert Meeting transcripts".  
  - Edge Cases: Missing speaker names or text fields; malformed sentence structure.

---

#### 2.4 AI Summarization and Processing

**Overview:**  
Uses Google Gemini (PaLM) and OpenAI GPT models to generate short summaries, expert interpretations, and write email content based on the transcript.

**Nodes Involved:**  
- "Set summary"  
- "Meeting summary expert"  
- "Expert Meeting transcripts"  
- "OpenAI Chat Model2"  
- "Information Extractor" (via AI Language Model channel)  
- "Email writer"  

**Node Details:**  

- **Set summary**  
  - Type: Set  
  - Role: Extracts various summary components (`short_summary`, `short_overview`, `overview`) from transcript data for AI input.  
  - Configuration: Sets these 3 fields from `$json.data.summary`.  
  - Inputs: From "Get a transcript".  
  - Outputs: Connects to "Meeting summary expert".  
  - Edge Cases: Missing or incomplete summary data.

- **Meeting summary expert**  
  - Type: LangChain Google Gemini  
  - Role: Aggregates and summarizes provided short summaries and overviews into expert-level text.  
  - Configuration: Uses model "models/gemini-2.5-pro" with system prompt emphasizing expert interpretation and aggregation.  
  - Inputs: From "Set summary".  
  - Outputs: Connects to "Recap to MD" and "Merge" nodes.  
  - Edge Cases: API quota, malformed inputs.

- **Expert Meeting transcripts**  
  - Type: LangChain Google Gemini  
  - Role: Produces a detailed expert summary from the full transcript text in Italian.  
  - Configuration: Uses model "models/gemini-2.5-pro" with system message instructing Italian summary.  
  - Inputs: From "Full transcript".  
  - Outputs: Connects to "Full to MD" and "Merge".  
  - Edge Cases: Large transcript input size, API limits.

- **OpenAI Chat Model2**  
  - Type: LangChain OpenAI Chat Model  
  - Role: Supports the "Information Extractor" for attribute extraction via AI.  
  - Configuration: Uses GPT-4.1-mini model.  
  - Inputs: Connected as AI language model for "Information Extractor".  
  - Outputs: Feeds back into "Information Extractor".  
  - Edge Cases: API key validity, rate limits.

- **Email writer**  
  - Type: LangChain Google Gemini  
  - Role: Combines summary texts into a single coherent email content describing the meeting discussion.  
  - Configuration: Uses "models/gemini-2.5-pro" with system prompt to create a complete client email from provided summaries.  
  - Inputs: From "Aggregate" node that combines short and expert summaries.  
  - Outputs: Connects to "To MD".  
  - Edge Cases: API call failures, malformed summaries.

---

#### 2.5 Email Preparation and Sending

**Overview:**  
Converts AI-generated markdown to HTML and sends or drafts emails via Gmail.

**Nodes Involved:**  
- "Recap to MD"  
- "To MD"  
- "Send a message1"  
- "Full to MD"  
- "Send Full meeting summary"  
- "Draft email to client"  

**Node Details:**  

- **Recap to MD**  
  - Type: Markdown node  
  - Role: Converts markdown summary from "Meeting summary expert" into HTML for email.  
  - Configuration: Mode set from markdown to HTML using the first part of content.  
  - Inputs: From "Meeting summary expert".  
  - Outputs: Connects to "Send a message1".  
  - Edge Cases: Markdown formatting errors.

- **To MD**  
  - Type: Markdown node  
  - Role: Converts markdown from "Email writer" into HTML for draft email.  
  - Configuration: Markdown to HTML conversion for full email content.  
  - Inputs: From "Email writer".  
  - Outputs: Connects to "Draft email to client".  
  - Edge Cases: Markdown syntax issues.

- **Send a message1**  
  - Type: Gmail send email node  
  - Role: Sends the short meeting recap email to a predefined address.  
  - Configuration: Sends to "YOUR_EMAIL" (placeholder), uses HTML content from "Recap to MD", subject "Short Meeting Recap".  
  - Inputs: From "Recap to MD".  
  - Outputs: None.  
  - Edge Cases: Gmail quota, OAuth issues, invalid recipient email.

- **Full to MD**  
  - Type: Markdown node  
  - Role: Converts detailed expert transcript summary markdown into HTML.  
  - Configuration: Markdown to HTML conversion of full expert transcript.  
  - Inputs: From "Expert Meeting transcripts".  
  - Outputs: Connects to "Send Full meeting summary".  
  - Edge Cases: Large markdown input size.

- **Send Full meeting summary**  
  - Type: Gmail send email node  
  - Role: Sends the full meeting summary email with dynamic subject including original email subject.  
  - Configuration: Sends to "YOUR_EMAIL" (placeholder), HTML content from "Full to MD", subject prefix "Full meeting summary: {{ original email subject }}".  
  - Inputs: From "Full to MD".  
  - Outputs: None.  
  - Edge Cases: Same as other Gmail nodes.

- **Draft email to client**  
  - Type: Gmail node (draft email)  
  - Role: Saves the composed email as a draft in Gmail for review before sending.  
  - Configuration: Draft resource, subject "Recap Meeting", message body from "To MD".  
  - Inputs: From "To MD".  
  - Outputs: None.  
  - Edge Cases: OAuth token issues, Gmail API quota.

---

#### 2.6 Utility and Aggregation

**Overview:**  
Manages merging and aggregation of partial results to unify data flow between AI nodes and further processing.

**Nodes Involved:**  
- "Merge"  
- "Aggregate"  

**Node Details:**  

- **Merge**  
  - Type: Merge  
  - Role: Combines outputs from "Expert Meeting transcripts" and "Meeting summary expert" nodes.  
  - Configuration: Default merging mode.  
  - Inputs: Two inputs - from both expert AI summary nodes.  
  - Outputs: Connects to "Aggregate".  
  - Edge Cases: Mismatched item counts or timing issues.

- **Aggregate**  
  - Type: Aggregate  
  - Role: Aggregates text fields from merged AI outputs into a single field for email writing.  
  - Configuration: Aggregates `content.parts[0].text` into field `text`.  
  - Inputs: From "Merge".  
  - Outputs: Connects to "Email writer".  
  - Edge Cases: Empty or missing fields.

---

### 3. Summary Table

| Node Name                 | Node Type                          | Functional Role                         | Input Node(s)                      | Output Node(s)                     | Sticky Note                                                                                                                       |
|---------------------------|----------------------------------|---------------------------------------|----------------------------------|----------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger                   | Manual workflow start                  | None                             | Set MeetingId                    | See preliminary steps for setup                                                                                                  |
| Webhook                   | Webhook                          | External HTTP POST trigger             | None                             | Get a transcript                 | See preliminary steps for setup                                                                                                  |
| Gmail Trigger             | Gmail Trigger                    | Email-based automatic trigger          | None                             | Get a message                   | See preliminary steps for setup                                                                                                  |
| Get a message             | Gmail (get)                     | Fetches full Gmail message             | Gmail Trigger                   | Set Meeting link                |                                                                                                                                |
| Set Meeting link          | Set                             | Assigns email text for extraction      | Get a message                   | Information Extractor           |                                                                                                                                |
| Information Extractor     | LangChain Information Extractor | Extracts meeting link from email text  | Set Meeting link                | Code1                         |                                                                                                                                |
| Code1                    | Code (JS)                      | Parses meeting link URL to extract ID | Information Extractor           | Get a transcript               |                                                                                                                                |
| Set MeetingId             | Set                             | Sets static meetingId for manual runs | When clicking ‘Execute workflow’ | Get a transcript               |                                                                                                                                |
| Get a transcript          | Fireflies API Node              | Retrieves meeting transcript           | Webhook, Set MeetingId, Code1   | Set sentences, Set summary      |                                                                                                                                |
| Set sentences             | Set                             | Extracts sentences array from transcript | Get a transcript               | Full transcript                |                                                                                                                                |
| Full transcript           | Code (JS)                      | Builds full transcript string           | Set sentences                  | Expert Meeting transcripts      |                                                                                                                                |
| Set summary               | Set                             | Extracts summary fields for AI input   | Get a transcript               | Meeting summary expert          |                                                                                                                                |
| Meeting summary expert    | LangChain Google Gemini         | AI summarizes and aggregates summaries | Set summary                   | Recap to MD, Merge              |                                                                                                                                |
| Expert Meeting transcripts | LangChain Google Gemini         | AI generates expert detailed summary   | Full transcript                | Full to MD, Merge               |                                                                                                                                |
| Merge                    | Merge                           | Combines summaries for email writing    | Meeting summary expert, Expert Meeting transcripts | Aggregate                    |                                                                                                                                |
| Aggregate                 | Aggregate                       | Aggregates text fields for email content | Merge                        | Email writer                   |                                                                                                                                |
| Email writer             | LangChain Google Gemini         | Generates email content from summaries  | Aggregate                     | To MD                         |                                                                                                                                |
| To MD                    | Markdown Converter              | Converts markdown email to HTML          | Email writer                  | Draft email to client          |                                                                                                                                |
| Draft email to client     | Gmail (draft)                  | Saves email draft in Gmail               | To MD                         | None                         |                                                                                                                                |
| Recap to MD              | Markdown Converter              | Converts recap summary markdown to HTML | Meeting summary expert         | Send a message1               |                                                                                                                                |
| Send a message1           | Gmail (send)                   | Sends short meeting recap email          | Recap to MD                   | None                         |                                                                                                                                |
| Full to MD                | Markdown Converter              | Converts full expert transcript markdown | Expert Meeting transcripts    | Send Full meeting summary     |                                                                                                                                |
| Send Full meeting summary | Gmail (send)                   | Sends full meeting summary email         | Full to MD                    | None                         |                                                                                                                                |
| Set Meeting link          | Set                             | See above duplication for clarity        | Get a message                | Information Extractor          |                                                                                                                                |
| OpenAI Chat Model2        | LangChain OpenAI Chat Model    | Provides AI support to Information Extractor | Connected as AI languageModel| Information Extractor          |                                                                                                                                |
| Sticky Note              | Sticky Note                    | Workflow overview and usage instructions | None                         | None                         | See notes below for Fireflies.ai signup and API setup                                                                           |
| Sticky Note1             | Sticky Note                    | Preliminary setup instructions           | None                         | None                         | See notes below for Fireflies.ai API key and Gmail address setup                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Name: "When clicking ‘Execute workflow’"  
   - Type: Manual Trigger (no parameters)

2. **Create Webhook Node**  
   - Name: "Webhook"  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: Unique path (e.g., "880cfe0f-5c81-46cd-b717-be89dfa045cf")  

3. **Create Gmail Trigger Node**  
   - Name: "Gmail Trigger"  
   - Type: Gmail Trigger  
   - Filter: Subject contains "Your meeting recap", sender "fred@fireflies.ai"  
   - Poll interval: Every hour, 1 minute past  
   - Credential: Set up Gmail OAuth2 with Gmail account

4. **Create "Get a message" Node**  
   - Type: Gmail (Get)  
   - Message ID: `={{ $json.id }}` from Gmail Trigger  
   - Credential: Same Gmail OAuth2

5. **Create "Set Meeting link" Node**  
   - Type: Set  
   - Assign variable `text` to `={{ $json.text }}` from "Get a message" output

6. **Create "Information Extractor" Node**  
   - Type: LangChain Information Extractor  
   - Input text: `={{ $json.text }}` from "Set Meeting link"  
   - System prompt: Expert extraction algorithm to extract `meeting_notes` attribute (meeting link)  
   - Credential: OpenAI or compatible API with GPT model for AI support (OpenAI Chat Model2 node)

7. **Create "OpenAI Chat Model2" Node**  
   - Type: LangChain OpenAI Chat Model  
   - Model: GPT-4.1-mini  
   - Connect as AI language model to "Information Extractor" node  
   - Credential: OpenAI API key

8. **Create "Code1" Node**  
   - Type: Code (JavaScript)  
   - JavaScript: Extract meetingId substring between "::" and "?" from `meeting_notes` URL  
   - Input: Output from "Information Extractor"  
   - Output: JSON with `body.meetingId` set to extracted string

9. **Create "Set MeetingId" Node** (for manual runs)  
   - Type: Set  
   - Set `body.meetingId` to a static meeting ID string (e.g., "01K18TW3MEX4XQ3TBG4RAD88HX")  

10. **Create "Get a transcript" Node**  
    - Type: Fireflies.ai API node  
    - Parameter: `transcriptId` set to `={{ $json.body.meetingId }}`  
    - Credential: Fireflies API key  
    - Input: From "Webhook", "Set MeetingId", or "Code1" nodes

11. **Create "Set sentences" Node**  
    - Type: Set  
    - Assign `sentences` from transcript JSON path `$json.data.sentences`  
    - Input: From "Get a transcript"

12. **Create "Full transcript" Node**  
    - Type: Code (JavaScript)  
    - Logic: Concatenate all sentences with speaker names and cleaned text fields into a single string  
    - Return `full_transcript` and `total_segments`  
    - Input: From "Set sentences"

13. **Create "Set summary" Node**  
    - Type: Set  
    - Assign `short_summary`, `short_overview`, and `overview` from `$json.data.summary` fields  
    - Input: From "Get a transcript"

14. **Create "Expert Meeting transcripts" Node**  
    - Type: LangChain Google Gemini  
    - Model: "models/gemini-2.5-pro"  
    - System message: Expert Italian meeting transcript summarizer  
    - Input: Full transcript from "Full transcript" node  
    - Credential: Google PaLM API key

15. **Create "Meeting summary expert" Node**  
    - Type: LangChain Google Gemini  
    - Model: "models/gemini-2.5-pro"  
    - System message: Expert summarization aggregator  
    - Input: From "Set summary" node  
    - Credential: Google PaLM API key

16. **Create "Merge" Node**  
    - Type: Merge  
    - Input 1: From "Expert Meeting transcripts"  
    - Input 2: From "Meeting summary expert"

17. **Create "Aggregate" Node**  
    - Type: Aggregate  
    - Aggregate field: `content.parts[0].text` into `text`  
    - Input: From "Merge"

18. **Create "Email writer" Node**  
    - Type: LangChain Google Gemini  
    - Model: "models/gemini-2.5-pro"  
    - System message: Compose full email text about meeting discussion combining provided summaries  
    - Input: From "Aggregate"  
    - Credential: Google PaLM API key

19. **Create "To MD" Node**  
    - Type: Markdown converter  
    - Mode: Markdown to HTML  
    - Input: From "Email writer"

20. **Create "Draft email to client" Node**  
    - Type: Gmail (draft email)  
    - Subject: "Recap Meeting"  
    - Message body: From "To MD"  
    - Credential: Gmail OAuth2

21. **Create "Recap to MD" Node**  
    - Type: Markdown converter  
    - Mode: Markdown to HTML  
    - Input: From "Meeting summary expert"

22. **Create "Send a message1" Node**  
    - Type: Gmail (send email)  
    - Send to: YOUR_EMAIL (replace with actual address)  
    - Subject: "Short Meeting Recap"  
    - Message body: From "Recap to MD"  
    - Credential: Gmail OAuth2

23. **Create "Full to MD" Node**  
    - Type: Markdown converter  
    - Mode: Markdown to HTML  
    - Input: From "Expert Meeting transcripts"

24. **Create "Send Full meeting summary" Node**  
    - Type: Gmail (send email)  
    - Send to: YOUR_EMAIL (replace with actual address)  
    - Subject: "Full meeting summary: {{ original email subject }}"  
    - Message body: From "Full to MD"  
    - Credential: Gmail OAuth2

25. **Connect nodes according to dependencies:**  
    - Manual trigger → Set MeetingId → Get a transcript  
    - Webhook → Get a transcript  
    - Gmail Trigger → Get a message → Set Meeting link → Information Extractor → Code1 → Get a transcript  
    - Get a transcript → Set sentences + Set summary  
    - Set sentences → Full transcript → Expert Meeting transcripts  
    - Set summary → Meeting summary expert  
    - Expert Meeting transcripts + Meeting summary expert → Merge → Aggregate → Email writer → To MD → Draft email to client  
    - Meeting summary expert → Recap to MD → Send a message1  
    - Expert Meeting transcripts → Full to MD → Send Full meeting summary  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                             | Context or Link                                                                                                            |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------|
| Fireflies Meeting Transcript & Summary Automation workflow automates retrieval, extraction, summarization, and email delivery using Fireflies.ai and Google Gemini.                                                                                                      | Workflow description and context                                                                                           |
| To use Fireflies.ai API, sign up free at https://app.fireflies.ai/login?referralCode=01K0V2Z1QHY76ZGY9450251C99 and obtain API key under Settings → Developer Settings → API Key.                                                                                          | Fireflies.ai API setup instructions                                                                                        |
| For webhook triggering, configure the n8n webhook URL in Fireflies.ai’s Developer Settings → Webhook.                                                                                                                                                                   | Fireflies webhook setup                                                                                                    |
| Replace all "YOUR_EMAIL" placeholders in Gmail nodes with actual recipient addresses.                                                                                                                                                                                    | Gmail node configuration note                                                                                              |
| Google Gemini (PaLM) API credentials must be configured in n8n to use the LangChain Google Gemini nodes.                                                                                                                                                                | Google Gemini integration                                                                                                  |
| The workflow relies on Gmail OAuth2 credentials correctly set up with required scopes for reading, sending, and drafting emails.                                                                                                                                          | Gmail API OAuth2 setup                                                                                                     |
| The workflow leverages AI-based extraction and summarization; errors may arise if input formats change or API limits are reached.                                                                                                                                        | General caution for AI-based nodes                                                                                         |

---

**Disclaimer:**  
The textual content provided originates exclusively from a workflow automated with n8n, an integration and automation tool. The processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.