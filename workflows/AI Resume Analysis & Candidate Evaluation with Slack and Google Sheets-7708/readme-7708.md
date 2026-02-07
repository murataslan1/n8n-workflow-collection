AI Resume Analysis & Candidate Evaluation with Slack and Google Sheets

https://n8nworkflows.xyz/workflows/ai-resume-analysis---candidate-evaluation-with-slack-and-google-sheets-7708


# AI Resume Analysis & Candidate Evaluation with Slack and Google Sheets

### 1. Workflow Overview

This workflow automates the evaluation of job candidates by integrating Slack, AI-based resume analysis, and Google Sheets for structured data storage. It enables HR teams and recruiters to trigger candidate evaluations by mentioning a Slack bot with an attached candidate resume PDF. The workflow parses the resume, identifies the applied job position, retrieves the corresponding job description, evaluates candidate-job fit using AI models, and posts the results back to Slack and a Google Sheet for tracking.

**Logical Blocks:**

- **1.1 Trigger and Input Validation:** Receives Slack messages mentioning the bot and checks for attached candidate resume files.
- **1.2 Candidate Resume Processing:** Downloads the attached resume PDF from Slack and extracts its text content.
- **1.3 Candidate Profile Analysis:** Uses an AI agent to parse the resume text and Slack message, extracting candidate details and identifying the applied position from a Google Sheets position mapping.
- **1.4 Job Description Retrieval:** Downloads and extracts the job description PDF linked to the identified position.
- **1.5 Candidate Evaluation:** An AI agent analyzes the candidate profile against the job description to produce a structured evaluation and summary.
- **1.6 Results Output and Logging:** Formats the evaluation data and sends it back to Slack, while also appending the results to a Google Sheet for record-keeping.

---

### 2. Block-by-Block Analysis

#### 2.1 Trigger and Input Validation

**Overview:**  
This block listens for Slack mentions of the HR bot, verifies that the incoming message contains a candidate resume file attachment, and handles cases where no file is attached.

**Nodes Involved:**  
- Webhook  
- Is user message?  
- If  
- No Operation, do nothing  
- Inform user that profile is missing

**Node Details:**

- **Webhook**  
  - Type: Webhook Trigger  
  - Role: Entry point triggered by Slack app_mention events (POST requests)  
  - Config: Path = `slack-gilfoyle`, HTTP method POST, response mode set to last node  
  - Input: Slack event payload containing message, user, and files  
  - Output: Passes event data downstream  
  - Edge cases: Webhook may receive non-message events or malformed payloads

- **Is user message?**  
  - Type: If (Conditional Node)  
  - Role: Checks if the incoming Slack event is a user message by verifying existence of `body.event.type`  
  - Condition: `$json.body.event.type` exists (string)  
  - Input: Webhook output  
  - Output: Routes to next If node if true; otherwise, no operation node  
  - Edge cases: Event type missing or unexpected event types

- **If**  
  - Type: If (Conditional Node)  
  - Role: Checks if a file is attached in the Slack message (`body.event.files[0].id` exists)  
  - Input: Output from Is user message?  
  - Output:  
    - True: Proceed to download candidate profile  
    - False: Inform user to upload file  
  - Edge cases: Missing or unsupported file types; multiple files attached

- **No Operation, do nothing**  
  - Type: No Operation  
  - Role: Terminates processing if event is not a user message  
  - Input: Is user message? false branch  
  - Output: None

- **Inform user that profile is missing**  
  - Type: Slack Node (Message)  
  - Role: Sends a friendly Slack message asking the user to upload the candidate profile file first  
  - Config: Sends message to the same channel as the original event, uses bot token authentication  
  - Input: If false branch  
  - Edge cases: Slack API rate limits, channel access permissions

---

#### 2.2 Candidate Resume Processing

**Overview:**  
Downloads the attached resume PDF from Slack and extracts its text content for analysis.

**Nodes Involved:**  
- Download Candidate Profile From Slack  
- Extract from File

**Node Details:**

- **Download Candidate Profile From Slack**  
  - Type: HTTP Request  
  - Role: Downloads the candidate resume file using Slack's private download URL  
  - Config: Authenticated with Slack OAuth2; URL from `body.event.files[0].url_private_download`  
  - Input: If node true branch  
  - Output: Binary PDF file data  
  - Edge cases: Slack token expiry, file access restrictions, download failures

- **Extract from File**  
  - Type: Extract from File  
  - Role: Converts PDF binary into plain text for further processing  
  - Config: Operation set to PDF extraction, input from binary property named `data`  
  - Input: Download Candidate Profile from Slack  
  - Output: Extracted text content JSON  
  - Edge cases: Poorly formatted PDFs, extraction failures

---

#### 2.3 Candidate Profile Analysis

**Overview:**  
Uses an AI agent to extract structured candidate information and determine the applied position by referencing a positions mapping in Google Sheets.

**Nodes Involved:**  
- Profile Analyzer Agent  
- gpt4-1 model  
- json parser  
- Query available positions

**Node Details:**

- **Profile Analyzer Agent**  
  - Type: Langchain Agent  
  - Role: Processes extracted resume text and Slack message to parse candidate data and identify applied position  
  - Config: System message instructs extraction of candidate details and applied job; uses Google Sheets tool to map position names to job descriptions  
  - Input: Extracted resume text, Slack message text  
  - Output: JSON object with candidate profile, standardized applied position, and Job Description URL  
  - Edge cases: Ambiguous job titles, missing data, Google Sheets read errors

- **gpt4-1 model**  
  - Type: Langchain LM Chat OpenAI  
  - Role: Provides AI language model capabilities (GPT-4.1-mini) for Profile Analyzer Agent  
  - Config: Uses OpenAI API credentials  
  - Input/Output: Connected internally by agent node  
  - Edge cases: OpenAI API rate limits, prompt errors

- **json parser**  
  - Type: Langchain Output Parser  
  - Role: Parses AI output into structured JSON according to defined schema (candidate profile format)  
  - Input: AI model output  
  - Output: Structured JSON  
  - Edge cases: Parsing failures if AI output format is inconsistent

- **Query available positions**  
  - Type: Google Sheets Tool  
  - Role: Provides access to the positions mapping sheet to support applied position standardization  
  - Config: Reads sheet with position titles and job description URLs  
  - Input: Invoked by Profile Analyzer Agent as a tool  
  - Edge cases: Sheet access errors, outdated mappings

---

#### 2.4 Job Description Retrieval

**Overview:**  
Downloads and extracts the job description PDF corresponding to the applied position from Google Drive.

**Nodes Involved:**  
- Download file (Google Drive)  
- Extract Job Description

**Node Details:**

- **Download file**  
  - Type: Google Drive  
  - Role: Downloads Job Description PDF using URL retrieved from position mapping  
  - Config: File ID extracted from `output.JobDescription` in Profile Analyzer Agent output  
  - Input: Profile Analyzer Agent output  
  - Output: Binary PDF file data  
  - Edge cases: Invalid or inaccessible file ID, permission issues

- **Extract Job Description**  
  - Type: Extract from File  
  - Role: Extracts plain text from the downloaded Job Description PDF  
  - Config: PDF extraction operation, input binary from Download file node  
  - Output: Extracted job description text  
  - Edge cases: Extraction failure due to PDF formatting

---

#### 2.5 Candidate Evaluation

**Overview:**  
Combines candidate profile and job description to generate a structured evaluation summary using an HR expert AI agent.

**Nodes Involved:**  
- HR Expert Agent  
- gpt-4-1 model 2  
- json parser 2

**Node Details:**

- **HR Expert Agent**  
  - Type: Langchain Chain LLM  
  - Role: Evaluates candidate fit based on profile and job description, returning a detailed structured summary  
  - Config: Prompt includes job title, JD text, and candidate profile JSON; output parsed into structured evaluation  
  - Input: Extract Job Description text and Profile Analyzer Agent output  
  - Output: JSON with fit score, recommendations, strengths, gaps, final notes  
  - Edge cases: AI model output inconsistencies, OpenAI API issues

- **gpt-4-1 model 2**  
  - Type: Langchain LM Chat OpenAI  
  - Role: GPT-4.1-mini model providing language capabilities for HR Expert Agent  
  - Config: OpenAI API key set  
  - Edge cases: API rate limits, latency

- **json parser 2**  
  - Type: Langchain Output Parser  
  - Role: Parses HR Expert Agent output into structured JSON format with evaluation metrics  
  - Edge cases: Parsing errors if AI output deviates from schema

---

#### 2.6 Results Output and Logging

**Overview:**  
Formats the evaluation results, sends a notification message in Slack, and logs the evaluation data into a Google Sheet for tracking.

**Nodes Involved:**  
- Map Columns  
- Update evaluation sheet  
- Get information about a user  
- Send result in the mentioned channel

**Node Details:**

- **Map Columns**  
  - Type: Code (JavaScript)  
  - Role: Maps evaluation output and candidate profile fields into a flat JSON object for Google Sheets and Slack message  
  - Key Expressions: Extracts overall fit score, recommendation, strengths (comma-separated), concerns/gaps, final notes, and candidate contact info  
  - Input: HR Expert Agent output  
  - Output: Formatted JSON for downstream usage  
  - Edge cases: Missing fields or empty arrays

- **Update evaluation sheet**  
  - Type: Google Sheets  
  - Role: Appends the evaluation result and candidate info to a predefined Google Sheet for record-keeping  
  - Config: Appends to "Sheet1" using auto-mapping of input data to columns such as fit score, recommendations, strengths, etc.  
  - Credentials: Google Sheets OAuth2  
  - Edge cases: Sheet access permissions, quota limits

- **Get information about a user**  
  - Type: Slack Node (User Info)  
  - Role: Retrieves Slack user information (e.g., user ID) for personalized message posting  
  - Input: Map Columns output to extract user ID from original Slack message  
  - Edge cases: Slack API errors, user not found

- **Send result in the mentioned channel**  
  - Type: Slack Node (Message)  
  - Role: Sends a formatted notification message to the Slack channel where the request originated, tagging the user and summarizing the evaluation  
  - Message content: Includes candidate name, position, fit score, recommendation, strengths, and a prompt for next steps  
  - Edge cases: Slack API rate limits, missing permissions to post in channel

---

### 3. Summary Table

| Node Name                       | Node Type                          | Functional Role                                  | Input Node(s)                      | Output Node(s)                       | Sticky Note                                                                                                           |
|--------------------------------|----------------------------------|-------------------------------------------------|----------------------------------|------------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| Webhook                        | Webhook Trigger                  | Entry point; receives Slack mention event       | -                                | Is user message?                   | ### 1. 🚀 Trigger on Slack Mention<br>Triggered when a Slack user mentions the bot with a message and attached PDF.    |
| Is user message?               | If                              | Checks if event is a Slack user message          | Webhook                         | If, No Operation                   | ### 2. 🧾 Validate Input<br>Checks if the message type exists to proceed further.                                      |
| If                            | If                              | Checks if candidate resume file is attached      | Is user message?                | Download Candidate Profile From Slack, Inform user that profile is missing | ### 2. 🧾 Validate Input<br>If no file attached, informs user to upload first.                                          |
| No Operation, do nothing       | No Operation                    | Terminates flow if event is not user message     | Is user message?                | -                                  |                                                                                                                       |
| Inform user that profile is missing | Slack Node (Message)          | Sends Slack message requesting resume upload     | If (false branch)               | -                                  |                                                                                                                       |
| Download Candidate Profile From Slack | HTTP Request                  | Downloads candidate resume PDF from Slack        | If (true branch)                | Extract from File                  | ### 3. 📥 Download and Extract Resume<br>Downloads attached resume PDF from Slack.                                    |
| Extract from File              | Extract from File                | Extracts plain text from resume PDF               | Download Candidate Profile From Slack | Profile Analyzer Agent            |                                                                                                                       |
| Profile Analyzer Agent         | Langchain Agent                 | Parses resume and identifies applied position    | Extract from File, json parser  | Download file                     | ### 4. 🧠 Analyze Profile (AI Agent)<br>Extracts candidate details and applied job position; queries Google Sheets.    |
| gpt4-1 model                  | Langchain LM Chat OpenAI         | Provides GPT-4.1-mini model for Profile Analyzer | Profile Analyzer Agent          | json parser                      |                                                                                                                       |
| json parser                   | Langchain Output Parser          | Parses AI output into structured candidate profile JSON | gpt4-1 model                 | Profile Analyzer Agent            |                                                                                                                       |
| Query available positions      | Google Sheets Tool               | Provides position-job description mapping        | Profile Analyzer Agent (tool)   | Profile Analyzer Agent            |                                                                                                                       |
| Download file                 | Google Drive                    | Downloads Job Description PDF                      | Profile Analyzer Agent          | Extract Job Description           | ### 5. 📄 Fetch and Extract Job Description<br>Downloads and extracts job description PDF.                            |
| Extract Job Description        | Extract from File                | Extracts plain text from Job Description PDF      | Download file                  | HR Expert Agent                  |                                                                                                                       |
| HR Expert Agent               | Langchain Chain LLM              | Evaluates candidate fit against job description  | Extract Job Description, Profile Analyzer Agent | Map Columns                  | ### 6. 👩‍💼 Evaluate Candidate (HR Expert Agent)<br>Provides fit analysis and insights.                               |
| gpt-4-1 model 2               | Langchain LM Chat OpenAI         | GPT-4.1-mini model for HR Expert Agent            | HR Expert Agent                | json parser 2                   |                                                                                                                       |
| json parser 2                 | Langchain Output Parser          | Parses HR Expert Agent output into structured evaluation | gpt-4-1 model 2              | HR Expert Agent                 |                                                                                                                       |
| Map Columns                   | Code (JavaScript)                | Formats evaluation and candidate info for output | HR Expert Agent                | Update evaluation sheet, Get information about a user | ### 8. 📊 Log to Google Sheet<br>Prepares data for logging and Slack message.                                        |
| Update evaluation sheet        | Google Sheets                   | Logs evaluation data into Google Sheet            | Map Columns                   | Get information about a user      |                                                                                                                       |
| Get information about a user   | Slack Node (User Info)           | Retrieves Slack user info for message tagging     | Update evaluation sheet        | Send result in the mentioned channel |                                                                                                                       |
| Send result in the mentioned channel | Slack Node (Message)          | Sends evaluation summary message to Slack channel | Get information about a user   | -                              | ### 7. 📤 Send Results via Slack<br>Posts summarized evaluation back in Slack thread.                                |
| No Operation, do nothing       | No Operation                    | Ends flow if event not user message                | Is user message? (false branch) | -                              |                                                                                                                       |
| Sticky Notes (7 total)         | Sticky Note                     | Documentation and explanation notes                | -                            | -                              | See sticky notes content in section 5 below.                                                                          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Webhook node:**
   - Type: Webhook  
   - Path: `slack-gilfoyle`  
   - HTTP Method: POST  
   - Response Mode: Last node  
   - This will receive Slack app_mention events.

2. **Add an If node "Is user message?":**
   - Condition: Check if `body.event.type` exists (string)  
   - Connect Webhook output to this node.

3. **Add an If node "If":**
   - Condition: Check if `body.event.files[0].id` exists (string)  
   - Connect "true" output of "Is user message?" node to this node.

4. **Add a Slack node "Inform user that profile is missing":**
   - Purpose: Send message asking user to upload resume if no file attached  
   - Message text: Friendly prompt to upload candidate profile file before sending message  
   - Channel: Use `body.event.channel` from webhook payload  
   - Credentials: Slack Bot Token (OAuth2)  
   - Connect "false" output of "If" node here.

5. **Add a No Operation node "No Operation, do nothing":**
   - Connect "false" output of "Is user message?" here.

6. **Add an HTTP Request node "Download Candidate Profile From Slack":**
   - Method: GET  
   - URL: Use `body.event.files[0].url_private_download`  
   - Authentication: Slack OAuth2  
   - Response Format: File (binary)  
   - Connect "true" output of "If" node here.

7. **Add an Extract from File node "Extract from File":**
   - Operation: PDF extraction  
   - Binary Property: `data` (from HTTP Request node)  
   - Connect output of HTTP Request node here.

8. **Add a Langchain Agent node "Profile Analyzer Agent":**
   - Purpose: Extract candidate profile and applied position from resume text and message  
   - Input: Text from Extract from File node + Slack message text  
   - Configure system prompt to parse candidate data and identify applied position using Google Sheets tool  
   - Connect output of Extract from File node here.

9. **Add a Google Sheets Tool node "Query available positions":**
   - Connect as a tool inside Profile Analyzer Agent for mapping position names to job descriptions  
   - Provide OAuth2 credentials for Google Sheets  
   - Sheet contains position titles and Job Description URLs

10. **Add a Langchain LM Chat OpenAI node "gpt4-1 model":**
    - Model: GPT-4.1-mini  
    - Credentials: OpenAI API key  
    - Connect as AI model inside Profile Analyzer Agent.

11. **Add a Langchain Output Parser node "json parser":**
    - Provide JSON schema for candidate profile extraction  
    - Connect AI model output to this node and its output back to Profile Analyzer Agent.

12. **Add a Google Drive node "Download file":**
    - Operation: Download  
    - File ID: Extract from Profile Analyzer Agent output (`output.JobDescription`)  
    - Credentials: Google Drive OAuth2  
    - Connect output of Profile Analyzer Agent here.

13. **Add an Extract from File node "Extract Job Description":**
    - Operation: PDF extraction  
    - Binary Property: from Google Drive node  
    - Connect output of Google Drive node here.

14. **Add a Langchain Chain LLM node "HR Expert Agent":**
    - Purpose: Evaluate candidate profile against job description  
    - Input: Job description text + candidate profile JSON  
    - Configure system prompt for structured evaluation with ratings and reasoning  
    - Connect output of Extract Job Description node here.

15. **Add a Langchain LM Chat OpenAI node "gpt-4-1 model 2":**
    - Model: GPT-4.1-mini  
    - Credentials: OpenAI API key  
    - Connect as AI model inside HR Expert Agent.

16. **Add a Langchain Output Parser node "json parser 2":**
    - Provide JSON schema for evaluation output (fit score, recommendations, etc.)  
    - Connect AI model output to this node and output back to HR Expert Agent.

17. **Add a Code node "Map Columns":**
    - JavaScript code to map evaluation and candidate profile fields into flat JSON  
    - Extract full name, email, phone, position, scores, recommendations, strengths, concerns, notes, and timestamp  
    - Connect output of HR Expert Agent here.

18. **Add a Google Sheets node "Update evaluation sheet":**
    - Operation: Append  
    - Sheet Name: "Sheet1"  
    - Document ID: Google Sheet URL for evaluation logs  
    - Auto-map columns from Code node output  
    - Credentials: Google Sheets OAuth2  
    - Connect output of Map Columns node here.

19. **Add a Slack node "Get information about a user":**
    - Resource: User  
    - User ID: Extract from original Slack event (`body.event.files[0].user`) or from webhook payload  
    - Credentials: Slack OAuth2  
    - Connect output of Update evaluation sheet node here.

20. **Add a Slack node "Send result in the mentioned channel":**
    - Text: Formatted message summarizing candidate evaluation, mentioning user, showing fit score, recommendation, strengths, and next steps prompt  
    - Channel: Use channel ID from original Slack event (`body.event.channel`)  
    - Credentials: Slack Bot Token  
    - Connect output of "Get information about a user" node here.

21. **Connect nodes according to the described flow, respecting the conditional branches and error handling.**

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Context or Link                                                                                         |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| This workflow connects a Slack chatbot with AI agents and Google Sheets to automate candidate resume evaluation. It extracts resume details, identifies the applied job from the message, fetches the correct job description, and provides a summarized evaluation via Slack and tracking sheet. Perfect for HR teams using Slack.                                                                                                                                            | Workflow overview sticky note and project description                                                 |
| Watch the video demonstration: [Building an AI-Powered Chatbot for Candidate Evaluation on Slack](https://www.youtube.com/watch?v=NAn5BSr15Ks) (Thumbnail image linked in sticky note)                                                                                                                                                                                                                                                                                                                                 | Video link embedded in workflow sticky note                                                           |
| Usage context: Designed for HR Teams, Recruiters, and Hiring Managers at software or tech companies using Slack, Google Sheets, and n8n who want to automate candidate evaluation based on uploaded profiles and applied job positions.                                                                                                                                                                                                                                                                               | Workflow overview sticky note                                                                          |
| Setup instructions include creating Slack bot with app_mention event and Bot Token, setting up Google Sheets with position mappings and evaluation logs, and configuring OpenAI credentials for GPT-4.                                                                                                                                                                                                                                                                                                                   | Provided in workflow overview sticky note                                                             |
| Customization tips: Replace Google Sheets with Airtable or Notion, change job description formats, output to email or Notion, customize AI agent prompts, add multilingual support, or change trigger to slash command or form.                                                                                                                                                                                                                                                  | Customization table in sticky note                                                                     |

---

**Disclaimer:** The provided content is exclusively extracted from an n8n workflow automation. It complies with all relevant content policies and contains no illegal, offensive, or protected elements. All processed data is legal and public.