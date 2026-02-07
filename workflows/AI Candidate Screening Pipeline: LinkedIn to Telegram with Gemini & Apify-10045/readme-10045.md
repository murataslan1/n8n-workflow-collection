AI Candidate Screening Pipeline: LinkedIn to Telegram with Gemini & Apify

https://n8nworkflows.xyz/workflows/ai-candidate-screening-pipeline--linkedin-to-telegram-with-gemini---apify-10045


# AI Candidate Screening Pipeline: LinkedIn to Telegram with Gemini & Apify

---

## 1. Workflow Overview

This workflow automates the first-round candidate screening process by integrating Telegram messaging, LinkedIn profile scraping, job description (JD) matching, and AI-powered candidate evaluation. It is designed for recruitment teams who want to quickly and efficiently filter candidates submitting LinkedIn profiles via Telegram.

The workflow consists of the following logical blocks:

- **1.1 Input Reception and Validation**  
  Receiving candidate messages on Telegram, extracting LinkedIn profile URLs, and validating input.

- **1.2 Anti-Spam and Confirmation Messaging**  
  Checking submission limits per candidate to avoid spam, then sending confirmation or error messages.

- **1.3 LinkedIn Profile Extraction via Apify**  
  Initiating and polling the Apify LinkedIn scraper actor to extract detailed candidate profile data.

- **1.4 Job Description Matching**  
  Matching candidates to the most relevant job description(s) using AI agents, leveraging Telegram message context and LinkedIn profile data.

- **1.5 Detailed JD Selection and Document Processing**  
  Further refining JD selection if multiple matches, downloading and extracting JD document content.

- **1.6 AI Candidate Screening and Scoring**  
  Analyzing candidate profile against selected JD with Google Gemini AI to produce structured screening reports.

- **1.7 Data Aggregation and Logging**  
  Collecting all results, generating unique submission IDs, and logging the candidate analysis into Google Sheets.

- **1.8 Notifications and Reporting**  
  Sending summary messages to internal Telegram talent groups about candidate screening progress and completion.

---

## 2. Block-by-Block Analysis

### 2.1 Input Reception and Validation

**Overview:**  
Receives candidate-submitted messages via Telegram, extracts LinkedIn profile URLs, and validates their format.

**Nodes Involved:**  
- Receive Telegram Msg to Recruiter Bot  
- Start Msg Sent + Valid LinkedIn Profile URL? (IF)  
- Grab Clean LinkedIn URL (Code)  
- Reply with Error/Try Again Msg (Telegram)

**Node Details:**

- **Receive Telegram Msg to Recruiter Bot**  
  - *Type*: Telegram Trigger  
  - *Role*: Entry point; listens to Telegram messages from candidates.  
  - *Config*: Listens to "message" updates; uses Telegram API credentials.  
  - *Outputs*: Raw Telegram message JSON.  
  - *Failures*: Bot token issues, webhook misconfiguration, Telegram downtime.  

- **Start Msg Sent + Valid LinkedIn Profile URL?**  
  - *Type*: IF node  
  - *Role*: Checks if received message is not "/start" and contains a LinkedIn profile URL substring ("linkedin.com/in/").  
  - *Config*: Conditions check message text content.  
  - *Outputs*: Two branches — valid LinkedIn URL or invalid input.  
  - *Failures*: False negatives if URL malformed, or candidate sends shortened URLs.  

- **Grab Clean LinkedIn URL**  
  - *Type*: Code  
  - *Role*: Extracts and sanitizes canonical LinkedIn profile URL from message text or Telegram entities.  
  - *Config*: Uses regex to find URLs pointing to LinkedIn profiles with /in/ slug.  
  - *Outputs*: JSON containing cleaned LinkedIn URL or flag indicating no valid URL found.  
  - *Failures*: Candidate sends non-standard URLs or incomplete profile URLs; may fail to extract.  

- **Reply with Error/Try Again Msg**  
  - *Type*: Telegram  
  - *Role*: Sends error message to candidate if LinkedIn profile URL is invalid or missing.  
  - *Config*: Custom message with instructions on correct URL format; uses Telegram API credentials.  
  - *Failures*: Telegram API errors, invalid chat ID.

---

### 2.2 Anti-Spam and Confirmation Messaging

**Overview:**  
Limits candidates to 3 LinkedIn profile submissions to prevent spam and sends confirmation messages upon valid submission.

**Nodes Involved:**  
- Get All Rows Matching Telegram Username (Google Sheets)  
- Count Rows Matching Telegram Username (Summarize)  
- Spam Check: Sent <4 LinkedIn Profiles? (IF)  
- Reply - Too Many LinkedIn URLs Sent Msg (Telegram)  
- Reply with Confirmation Msg (Telegram)  
- Send Msg to Internal Talent Group (Telegram)

**Node Details:**

- **Get All Rows Matching Telegram Username**  
  - *Type*: Google Sheets  
  - *Role*: Retrieves all previous submissions by the Telegram username from Google Sheets.  
  - *Config*: Filters rows by "Telegram Username" column using current user's username.  
  - *Failures*: Wrong sheet ID, missing permissions, API rate limits.  

- **Count Rows Matching Telegram Username**  
  - *Type*: Summarize  
  - *Role*: Counts the number of matching rows retrieved to determine submission count.  
  - *Config*: Summarizes "Telegram Username" field occurrences.  
  - *Failures*: Empty input, summarization errors.  

- **Spam Check: Sent <4 LinkedIn Profiles?**  
  - *Type*: IF  
  - *Role*: Allows candidates with 3 or fewer submissions; blocks those exceeding limit.  
  - *Config*: Checks count <= 3 condition.  
  - *Failures*: Incorrect counting logic may block valid users or allow spammers.  

- **Reply - Too Many LinkedIn URLs Sent Msg**  
  - *Type*: Telegram  
  - *Role*: Informs candidate that submission limit exceeded, provides contact info for exceptions.  
  - *Config*: Uses Telegram API credentials, addresses user by first name.  
  - *Failures*: Telegram API errors, invalid chat ID.  

- **Reply with Confirmation Msg**  
  - *Type*: Telegram  
  - *Role*: Sends acknowledgement to candidate confirming receipt of LinkedIn profile URL.  
  - *Config*: Personalized message with candidate’s first name, no attribution appended.  
  - *Failures*: Telegram API errors, invalid chat ID.  

- **Send Msg to Internal Talent Group**  
  - *Type*: Telegram  
  - *Role*: Notifies internal talent group Telegram chat about new candidate submission with message content.  
  - *Config*: HTML parse mode, uses internal group chat ID.  
  - *Failures*: Incorrect chat ID, Telegram API limits.

---

### 2.3 LinkedIn Profile Extraction via Apify

**Overview:**  
Initiates LinkedIn profile scraping via Apify API and polls until extraction completes.

**Nodes Involved:**  
- Extract LinkedIn Profile Information (HTTP Request)  
- Initialize Loop Counter to Poll for Completion (Set)  
- Check LinkedIn Profile Extraction Status (HTTP Request)  
- Restore Loop Counter (Code)  
- Checked 10x for LinkedIn Profile Data? (IF)  
- Wait for LinkedIn Profile (Wait)  
- Get Fully Extracted LinkedIn Profile Data (HTTP Request)  
- Set Key LinkedIn Profile Data (Set)  
- Reply with Error/Try Again Msg (Telegram)  

**Node Details:**

- **Extract LinkedIn Profile Information**  
  - *Type*: HTTP Request  
  - *Role*: Calls Apify actor to start LinkedIn profile scraping, sending cleaned profile URL.  
  - *Config*: POST to Apify run endpoint with token; body contains profile URL JSON array.  
  - *Failures*: Invalid Apify token, API downtime, malformed URL payload.  

- **Initialize Loop Counter to Poll for Completion**  
  - *Type*: Set  
  - *Role*: Initializes a loop counter (starting at 0) used to limit polling attempts.  
  - *Config*: Assigns variable `loopCount = 0`.  
  - *Failures*: None significant.  

- **Check LinkedIn Profile Extraction Status**  
  - *Type*: HTTP Request  
  - *Role*: Queries Apify actor run status to check if scraping is completed.  
  - *Config*: GET request with Apify token; uses dynamic actId from initial run.  
  - *Failures*: Token invalid, API errors, network timeouts.  

- **Restore Loop Counter**  
  - *Type*: Code  
  - *Role*: Maintains loopCount value across iterations, retrieving it from prior state or initialization.  
  - *Config*: JavaScript code to safely extract loopCount from previous nodes.  
  - *Failures*: Reference errors if nodes renamed or missing.  

- **Checked 10x for LinkedIn Profile Data?**  
  - *Type*: IF  
  - *Role*: Checks if polling attempts have reached limit (>=10), ends polling loop if so.  
  - *Config*: Numeric comparison on `loopCount`.  
  - *Failures*: Premature termination if loopCount mismanaged.  

- **Wait for LinkedIn Profile**  
  - *Type*: Wait  
  - *Role*: Delays next poll attempt by 15 seconds to avoid excessive API calls.  
  - *Config*: Wait time set to 15 seconds.  
  - *Failures*: Workflow pause delays; possible timeout if external API slow.  

- **Get Fully Extracted LinkedIn Profile Data**  
  - *Type*: HTTP Request  
  - *Role*: Retrieves detailed profile data from Apify dataset once scraping is complete.  
  - *Config*: GET request with Apify token; uses actId from run.  
  - *Failures*: Token invalid, API errors, empty or incomplete data.  

- **Set Key LinkedIn Profile Data**  
  - *Type*: Set  
  - *Role*: Stores extracted LinkedIn profile JSON and timestamp for downstream use.  
  - *Config*: Sets `linkedinProfileData` and `dateShared` fields.  
  - *Failures*: None significant; missing data if previous step failed.

- **Reply with Error/Try Again Msg** (also used here)  
  - *Role*: If LinkedIn profile extraction fails or invalid URL detected, informs candidate to re-submit correct URL.

---

### 2.4 Job Description Matching

**Overview:**  
Uses AI to match candidates to job descriptions by analyzing their Telegram message first, then their LinkedIn profile as fallback.

**Nodes Involved:**  
- JD Matching Agent (LangChain AI agent)  
- Structured Output Parser-1 (AI output parser)  
- JD Match w/Telegram Msg? (IF)  
- Download Selected JD (Google Drive)  
- Transform for Multiple JDs (Code)  
- Loop Over Items (Split In Batches)  
- Detailed JD Matching Agent (LangChain AI agent)  
- Structured Output Parser-2 (AI output parser)  
- Download Selected JD1 (Google Drive)  
- Extract from File1 (Extract from PDF)  
- Set JD Data (Set)  

**Node Details:**

- **JD Matching Agent**  
  - *Type*: LangChain AI Agent node  
  - *Role*: Analyzes candidate's Telegram message and LinkedIn profile to select most relevant JD(s).  
  - *Config*: Custom prompt prioritizing Telegram message role mention; fallback to LinkedIn profile analysis; expects JSON response with match type and JD file IDs.  
  - *Failures*: AI model misunderstanding, no relevant JD found, malformed output.  

- **Structured Output Parser-1**  
  - *Type*: LangChain Output Parser  
  - *Role*: Validates and parses AI JSON output for JD matching agent.  
  - *Config*: JSON schema enforces response format with match_type and jd_match data.  
  - *Failures*: Parsing errors if AI output malformed or incomplete.  

- **JD Match w/Telegram Msg?**  
  - *Type*: IF  
  - *Role*: Branches workflow if match type is "telegram_msg_match" (single JD) or "linkedin_profile_match" (multiple JDs).  
  - *Config*: Condition on AI output JSON field.  
  - *Failures*: Logic errors if AI output inconsistent.  

- **Download Selected JD**  
  - *Type*: Google Drive (OAuth2)  
  - *Role*: Downloads the single matched JD file as PDF for further processing.  
  - *Config*: Uses JD file ID from AI output; converts Google Docs to PDF if needed.  
  - *Failures*: Incorrect file ID, permission errors, API limits.  

- **Transform for Multiple JDs**  
  - *Type*: Code  
  - *Role*: Transforms AI output JSON array of multiple JDs into individual items for batch processing.  
  - *Config*: Returns array of objects with filename and file ID.  
  - *Failures*: Unexpected AI output structure.  

- **Loop Over Items**  
  - *Type*: Split In Batches  
  - *Role*: Iterates over multiple JD matches sequentially for detailed analysis.  
  - *Config*: Default batch size (usually 1).  
  - *Failures*: Large batch sizes may cause rate limits or slowdowns.  

- **Detailed JD Matching Agent**  
  - *Type*: LangChain AI Agent node  
  - *Role*: Analyzes candidate's LinkedIn profile against up to 3 preselected JDs to select single best fit.  
  - *Config*: Receives detailed JD texts and profile data; outputs selected JD filename in JSON format.  
  - *Failures*: AI model errors, incomplete JD text, empty input.  

- **Structured Output Parser-2**  
  - *Type*: LangChain Output Parser  
  - *Role*: Parses AI output from detailed JD matching agent.  
  - *Config*: JSON schema expects "selected_jd" with filename field.  
  - *Failures*: Parsing errors if AI output malformed.  

- **Download Selected JD1**  
  - *Type*: Google Drive (OAuth2)  
  - *Role*: Downloads final selected JD PDF file for extraction.  
  - *Config*: Uses file ID from detailed JD matching.  
  - *Failures*: Same as above.  

- **Extract from File1**  
  - *Type*: Extract from File (PDF)  
  - *Role*: Extracts text content from downloaded JD PDF for AI screening.  
  - *Config*: PDF extraction operation; no special options.  
  - *Failures*: Corrupt or scanned PDFs may not extract well.  

- **Set JD Data**  
  - *Type*: Set  
  - *Role*: Stores extracted JD filename, file ID, and text content for downstream AI analysis.  
  - *Config*: Assigns fields from loop item and extracted text.  
  - *Failures*: Missing text if extraction failed.

---

### 2.5 Detailed JD Match Name Resolution

**Overview:**  
Matches selected JD filename to full JD text from loop outputs to prepare for candidate scoring.

**Nodes Involved:**  
- Match Selected JD Name with Full Text (Code)  

**Node Details:**

- **Match Selected JD Name with Full Text**  
  - *Type*: Code  
  - *Role*: Finds full JD data by matching filename from detailed JD matching agent against looped JD items.  
  - *Config*: Searches loop output array for filename match; returns selected JD filename, file ID, and text. Throws error if not found.  
  - *Failures*: Missing JD data, filename mismatch, runtime exceptions.

---

### 2.6 AI Candidate Screening and Scoring

**Overview:**  
Performs AI-based candidate screening by comparing LinkedIn profile against selected JD and generating structured report.

**Nodes Involved:**  
- Recruiter Scoring Agent (LangChain AI Agent)  
- Structured Output Parser-3 (AI Output Parser)  

**Node Details:**

- **Recruiter Scoring Agent**  
  - *Type*: LangChain AI Agent  
  - *Role*: Generates detailed candidate screening report including strengths, weaknesses, risk/reward factors, overall fit score, and justification.  
  - *Config*: Prompt includes candidate LinkedIn profile and selected JD text; expects JSON structured output.  
  - *Failures*: AI output errors, too verbose or incomplete results.  

- **Structured Output Parser-3**  
  - *Type*: LangChain Output Parser  
  - *Role*: Parses AI screening report JSON output according to detailed schema.  
  - *Config*: Validates presence of all required fields and types.  
  - *Failures*: Parsing errors if AI output malformed.

---

### 2.7 Data Aggregation and Logging

**Overview:**  
Combines all processed data, generates unique submission IDs, and logs candidate analysis to Google Sheets.

**Nodes Involved:**  
- Merge (Combine)  
- Gather and Set Final Data (Set)  
- Add Candidate Analysis in GSheet (Google Sheets)  

**Node Details:**

- **Merge**  
  - *Type*: Merge (combine mode)  
  - *Role*: Combines outputs from LinkedIn profile data and AI screening results into a single data set for logging.  
  - *Config*: Combines by position (index).  
  - *Failures*: Data misalignment if inputs have inconsistent length.  

- **Gather and Set Final Data**  
  - *Type*: Set  
  - *Role*: Assigns all final data fields including submission ID, candidate details, analysis results, and timestamps.  
  - *Config*: Creates a unique submission ID based on last name and current UTC timestamp; sets all relevant fields for Google Sheets.  
  - *Failures*: Data field missing or incorrectly referenced.  

- **Add Candidate Analysis in GSheet**  
  - *Type*: Google Sheets (OAuth2)  
  - *Role*: Appends a new row with complete candidate screening data to a designated Google Sheet.  
  - *Config*: Uses defined sheet and columns schema matching expected column headers.  
  - *Failures*: Incorrect sheet ID/name, permission errors, rate limits.

---

### 2.8 Notifications and Reporting

**Overview:**  
Sends final summary messages to internal Telegram group chat about completed candidate screenings.

**Nodes Involved:**  
- Send Review Completed Msg to Talent Group (Telegram)  

**Node Details:**

- **Send Review Completed Msg to Talent Group**  
  - *Type*: Telegram  
  - *Role*: Posts formatted summary message to internal Telegram group with candidate's name, matched JD, fit score, and Google Sheet link.  
  - *Config*: HTML parse mode, uses internal group chat ID, includes submission ID and sheet URL.  
  - *Failures*: Incorrect chat ID, Telegram API errors.

---

### Additional Nodes (Miscellaneous/Supporting)

- **Extract from File**  
  - Extracts text from downloaded JD PDFs, used in initial JD download step.

- **Gemini 2.5 Pro Nodes** (3 nodes)  
  - AI Language Model nodes using Google Gemini for AI inference powering LangChain agents.

- **Sticky Notes**  
  - Various notes providing explanations, instructions, screenshots, and troubleshooting tips throughout workflow.

---

## 3. Summary Table

| Node Name                           | Node Type                        | Functional Role                                      | Input Node(s)                                | Output Node(s)                          | Sticky Note                                                                                             |
|-----------------------------------|---------------------------------|-----------------------------------------------------|----------------------------------------------|---------------------------------------|-------------------------------------------------------------------------------------------------------|
| Receive Telegram Msg to Recruiter Bot | Telegram Trigger                | Entry point: receives candidate Telegram messages   | -                                            | Start Msg Sent + Valid LinkedIn Profile URL? | Sticky Note3: ## Get LinkedIn Profile via Telegram                                                     |
| Start Msg Sent + Valid LinkedIn Profile URL? | IF                             | Validates LinkedIn URL presence and message type    | Receive Telegram Msg to Recruiter Bot         | Get All Rows Matching Telegram Username, Reply with Error/Try Again Msg | Sticky Note7: # First-Round Telegram + LinkedIn AI Recruiter Assistant overview                       |
| Get All Rows Matching Telegram Username | Google Sheets                  | Retrieves previous submissions by Telegram username | Start Msg Sent + Valid LinkedIn Profile URL? | Count Rows Matching Telegram Username |                                                                                                       |
| Count Rows Matching Telegram Username | Summarize                      | Counts number of previous submissions                | Get All Rows Matching Telegram Username       | Spam Check: Sent <4 LinkedIn Profiles? |                                                                                                       |
| Spam Check: Sent <4 LinkedIn Profiles? | IF                             | Enforces max 3 LinkedIn submissions per user         | Count Rows Matching Telegram Username         | Grab Clean LinkedIn URL, Reply - Too Many LinkedIn URLs Sent Msg |                                                                                                       |
| Reply - Too Many LinkedIn URLs Sent Msg | Telegram                       | Sends message to user when submission limit exceeded | Spam Check: Sent <4 LinkedIn Profiles? (false) | -                                     |                                                                                                       |
| Grab Clean LinkedIn URL             | Code                           | Extracts and sanitizes LinkedIn profile URL          | Spam Check: Sent <4 LinkedIn Profiles? (true) | Extract LinkedIn Profile Information   |                                                                                                       |
| Reply with Confirmation Msg         | Telegram                       | Confirms receipt of LinkedIn URL                      | Grab Clean LinkedIn URL                        | Send Msg to Internal Talent Group     |                                                                                                       |
| Send Msg to Internal Talent Group   | Telegram                       | Notifies internal talent team of new candidate       | Reply with Confirmation Msg                    | Extract LinkedIn Profile Information   |                                                                                                       |
| Extract LinkedIn Profile Information | HTTP Request                  | Starts Apify LinkedIn profile scraping job           | Send Msg to Internal Talent Group             | Initialize Loop Counter to Poll for Completion |                                                                                                       |
| Initialize Loop Counter to Poll for Completion | Set                          | Initializes polling counter for status checking      | Extract LinkedIn Profile Information           | Check LinkedIn Profile Extraction Status |                                                                                                       |
| Check LinkedIn Profile Extraction Status | HTTP Request                  | Polls Apify job status                                | Initialize Loop Counter to Poll for Completion, Wait for LinkedIn Profile | Restore Loop Counter                   |                                                                                                       |
| Restore Loop Counter                | Code                           | Maintains loop counter across polling iterations     | Check LinkedIn Profile Extraction Status       | LinkedIn Profile Ready?                 |                                                                                                       |
| LinkedIn Profile Ready?             | IF                             | Checks if Apify job completed or needs waiting       | Restore Loop Counter                            | Get Fully Extracted LinkedIn Profile Data, Wait for LinkedIn Profile |                                                                                                       |
| Wait for LinkedIn Profile           | Wait                          | Delays next polling attempt                           | LinkedIn Profile Ready? (not complete branch) | Increment Loop Counter                 |                                                                                                       |
| Increment Loop Counter              | Set                           | Increments polling attempt counter                    | Wait for LinkedIn Profile                       | Checked 10x for LinkedIn Profile Data? |                                                                                                       |
| Checked 10x for LinkedIn Profile Data? | IF                             | Ends polling after 10 attempts                        | Increment Loop Counter                          | Check LinkedIn Profile Extraction Status (if under 10), stops otherwise |                                                                                                       |
| Get Fully Extracted LinkedIn Profile Data | HTTP Request                  | Retrieves fully scraped LinkedIn profile data         | LinkedIn Profile Ready? (complete branch)      | Set Key LinkedIn Profile Data          |                                                                                                       |
| Set Key LinkedIn Profile Data        | Set                           | Stores LinkedIn profile JSON and timestamp           | Get Fully Extracted LinkedIn Profile Data      | JD Matching Agent, Merge                |                                                                                                       |
| JD Matching Agent                   | LangChain AI Agent             | Matches candidate to best JD(s) using Telegram msg and LinkedIn profile | Set Key LinkedIn Profile Data, Access JD Files | JD Match w/Telegram Msg?                | Sticky Note: ## Job Description (Vacany) Matching with Candidate's LinkedIn Profile                   |
| Structured Output Parser-1          | LangChain Output Parser        | Parses JD Matching Agent's JSON output                | JD Matching Agent                               | JD Match w/Telegram Msg?                |                                                                                                       |
| JD Match w/Telegram Msg?             | IF                             | Branches based on Telegram message or LinkedIn profile JD match type | Structured Output Parser-1                      | Download Selected JD, Transform for Multiple JDs |                                                                                                       |
| Download Selected JD                | Google Drive                   | Downloads single matched JD as PDF                    | JD Match w/Telegram Msg?                        | Extract from File                      |                                                                                                       |
| Extract from File                  | Extract from File              | Extracts text content from JD PDF                      | Download Selected JD                            | Set Selected JD Format                 |                                                                                                       |
| Set Selected JD Format              | Set                           | Stores selected JD details and text for scoring       | Extract from File                               | Recruiter Scoring Agent                |                                                                                                       |
| Transform for Multiple JDs          | Code                          | Converts multiple JD matches to array for looping     | JD Match w/Telegram Msg?                        | Loop Over Items                       |                                                                                                       |
| Loop Over Items                    | Split In Batches              | Processes each matched JD one by one                   | Transform for Multiple JDs                       | Detailed JD Matching Agent, Download Selected JD1 |                                                                                                       |
| Detailed JD Matching Agent          | LangChain AI Agent             | Selects single best JD from multiple candidates       | Loop Over Items                                 | Structured Output Parser-2              |                                                                                                       |
| Structured Output Parser-2          | LangChain Output Parser        | Parses detailed JD Matching Agent output               | Detailed JD Matching Agent                       | Match Selected JD Name with Full Text |                                                                                                       |
| Download Selected JD1              | Google Drive                   | Downloads final selected JD PDF                         | Loop Over Items                                 | Extract from File1                    |                                                                                                       |
| Extract from File1                | Extract from File              | Extracts text from final selected JD PDF               | Download Selected JD1                           | Set JD Data                          |                                                                                                       |
| Set JD Data                      | Set                           | Sets JD filename, file ID, and extracted text          | Extract from File1                              | Match Selected JD Name with Full Text |                                                                                                       |
| Match Selected JD Name with Full Text | Code                          | Matches selected JD filename to full JD text           | Structured Output Parser-2, Loop Over Items     | Recruiter Scoring Agent                |                                                                                                       |
| Recruiter Scoring Agent            | LangChain AI Agent             | AI screening report on candidate vs. JD                | Set Selected JD Format, Match Selected JD Name with Full Text | Structured Output Parser-3              |                                                                                                       |
| Structured Output Parser-3          | LangChain Output Parser        | Parses AI screening report JSON                          | Recruiter Scoring Agent                         | Merge                               |                                                                                                       |
| Merge                           | Merge (combine)               | Combines LinkedIn profile data and AI screening results | Set Key LinkedIn Profile Data, Structured Output Parser-3 | Gather and Set Final Data             |                                                                                                       |
| Gather and Set Final Data           | Set                           | Aggregates final candidate data and generates unique submission ID | Merge                                          | Add Candidate Analysis in GSheet      |                                                                                                       |
| Add Candidate Analysis in GSheet    | Google Sheets                 | Logs candidate screening results into Google Sheets    | Gather and Set Final Data                        | Send Review Completed Msg to Talent Group |                                                                                                       |
| Send Review Completed Msg to Talent Group | Telegram                   | Sends summary of completed candidate screening to internal Telegram group | Add Candidate Analysis in GSheet                | -                                   |                                                                                                       |

---

## 4. Reproducing the Workflow from Scratch

1. **Create Telegram Bot and Set Up Trigger**  
   - Create Telegram Bot via @BotFather, obtain API token.  
   - Create Telegram Trigger node ("Receive Telegram Msg to Recruiter Bot") with Telegram API credentials. Listen to "message" updates.

2. **Validate Telegram Messages for LinkedIn URLs**  
   - Add IF node ("Start Msg Sent + Valid LinkedIn Profile URL?") checking message text is not "/start" and contains "linkedin.com/in/".  
   - Connect Telegram trigger to this IF node.

3. **Retrieve Previous Submissions from Google Sheets**  
   - Add Google Sheets node ("Get All Rows Matching Telegram Username") filtered by Telegram username.  
   - Connect IF node's valid branch to this node.

4. **Count Number of Previous Submissions**  
   - Add Summarize node ("Count Rows Matching Telegram Username") counting "Telegram Username" field.  
   - Connect previous Google Sheets node to this.

5. **Spam Check IF Node**  
   - Add IF node ("Spam Check: Sent <4 LinkedIn Profiles?") to check if count ≤ 3.  
   - Connect summarization node to this IF.

6. **Too Many Links Reply Telegram Node**  
   - Add Telegram node ("Reply - Too Many LinkedIn URLs Sent Msg") with message explaining limit and contact info.  
   - Connect false branch of spam check IF node.

7. **Extract Clean LinkedIn URL Code Node**  
   - Add Code node ("Grab Clean LinkedIn URL") with JavaScript extracting valid LinkedIn profile URL from Telegram message entities or text.  
   - Connect true branch of spam check IF node.

8. **Reply Confirmation Telegram Node**  
   - Add Telegram node ("Reply with Confirmation Msg") confirming receipt of LinkedIn profile URL, personalized with candidate first name.  
   - Connect output of Code node.

9. **Notify Internal Talent Group Telegram Node**  
   - Add Telegram node ("Send Msg to Internal Talent Group") sending candidate message and username to internal chat group (use group chat ID).  
   - Connect confirmation message node.

10. **Start LinkedIn Profile Extraction via Apify**  
    - Add HTTP Request node ("Extract LinkedIn Profile Information") POST to Apify actor run URL with JSON body containing cleaned LinkedIn URL.  
    - Insert Apify API token in URL params.  
    - Connect from internal talent group notification node.

11. **Initialize Loop Counter Set Node**  
    - Add Set node ("Initialize Loop Counter to Poll for Completion") setting loopCount to 0.  
    - Connect from Apify request node.

12. **Polling Loop: Check Extraction Status**  
    - Add HTTP Request node ("Check LinkedIn Profile Extraction Status") GET to Apify run status endpoint using actor ID from initial run.  
    - Add Code node ("Restore Loop Counter") to maintain loopCount value.  
    - Add IF node ("LinkedIn Profile Ready?") checking status == "SUCCEEDED".  
    - Add Wait node ("Wait for LinkedIn Profile") with 15 seconds delay.  
    - Add Set node ("Increment Loop Counter") incrementing loopCount.  
    - Add IF node ("Checked 10x for LinkedIn Profile Data?") to stop after 10 tries.  
    - Connect nodes in a loop:  
      * Check Extraction Status → Restore Loop Counter → LinkedIn Profile Ready? (branch)  
      * If not ready → Wait → Increment Loop Counter → Checked 10x? → back to Check Extraction Status  
      * If ready → Get Fully Extracted LinkedIn Profile Data node.

13. **Get Fully Extracted Profile Data**  
    - Add HTTP Request node ("Get Fully Extracted LinkedIn Profile Data") GET to Apify dataset endpoint with actor ID.  
    - Connect ready branch from "LinkedIn Profile Ready?" IF node.

14. **Set Key LinkedIn Profile Data Node**  
    - Add Set node to save profile data JSON and timestamp (`linkedinProfileData` and `dateShared`).  
    - Connect from fully extracted profile data node.

15. **AI JD Matching - First Pass**  
    - Add LangChain Agent node ("JD Matching Agent") configured with Google Gemini 2.5 Pro model, prompt prioritizes Telegram message JD matching, fallback to LinkedIn profile.  
    - Add LangChain Output Parser node ("Structured Output Parser-1") with schema validating AI JSON output.  
    - Connect Set Key LinkedIn Profile Data node to LangChain agent input.

16. **IF Node for JD Match Type**  
    - Add IF node ("JD Match w/Telegram Msg?") branching on AI output field `match_type == "telegram_msg_match"`.  
    - Connect LangChain parser output to this IF.

17. **For Telegram Message Match (Single JD)**  
    - Add Google Drive node ("Download Selected JD") downloading JD PDF by file ID from AI output.  
    - Add Extract from File node to extract PDF text.  
    - Add Set node to store JD filename, file ID, and extracted text ("Set Selected JD Format").  
    - Connect IF node true branch to Google Drive node, chain nodes sequentially.

18. **For LinkedIn Profile Match (Multiple JDs)**  
    - Add Code node ("Transform for Multiple JDs") to convert AI output array to separate items.  
    - Add Split In Batches node ("Loop Over Items") to process each JD.  
    - For each batch item, add Google Drive node ("Download Selected JD1") to download JD PDF.  
    - Add Extract from File node ("Extract from File1") after Google Drive node to extract text.  
    - Add Set node ("Set JD Data") to assign filename, file ID, and extracted text.  
    - Connect nodes accordingly.

19. **Detailed JD Matching Agent**  
    - Add LangChain Agent node ("Detailed JD Matching Agent") with prompt to select single best JD from up to 3 extracted JDs, using Gemini 2.5 Pro.  
    - Add Output Parser node ("Structured Output Parser-2") validating JSON output with selected JD filename.  
    - Connect Loop Over Items to agent.

20. **Match Selected JD Name with Full Text**  
    - Add Code node ("Match Selected JD Name with Full Text") to find full JD text by matching filename from AI output against loop data.  
    - Connect Structured Output Parser-2 to this Code node.

21. **Recruiter Scoring Agent**  
    - Add LangChain Agent node ("Recruiter Scoring Agent") using Gemini 2.5 Pro, prompt analyzes candidate LinkedIn profile vs selected JD to generate strengths, weaknesses, risk/reward, fit score, and justification.  
    - Add Output Parser node ("Structured Output Parser-3") for structured screening report.  
    - Connect from "Set Selected JD Format" (telegram_msg_match branch) and "Match Selected JD Name with Full Text" (linkedin_profile_match branch) to this node.

22. **Data Aggregation and Logging**  
    - Add Merge node combining LinkedIn profile data and AI screening output.  
    - Add Set node ("Gather and Set Final Data") assigning all final fields and generating unique submission ID (based on candidate last name and UTC timestamp).  
    - Add Google Sheets node ("Add Candidate Analysis in GSheet") configured to append new row with all relevant columns.  
    - Connect Merge node to Set node, then to Google Sheets node.

23. **Send Summary to Internal Telegram Group**  
    - Add Telegram node ("Send Review Completed Msg to Talent Group") posting summary message with candidate name, matched JD, fit score, submission ID, and Google Sheet link.  
    - Connect Google Sheets node to this Telegram node.

24. **Add Sticky Notes**  
    - Add sticky notes throughout workflow explaining logic, troubleshooting, sample outputs, and instructions.

25. **Configure Credentials**  
    - Set up credentials in n8n:  
      * Telegram API (bot token)  
      * Google Drive OAuth2 (for JD file access)  
      * Google Sheets OAuth2 (for logging)  
      * Google Gemini API (PaLM API key)  
      * Apify API token (replace placeholders in HTTP Request nodes)

26. **Test Workflow**  
    - Send test LinkedIn profile URL via Telegram bot.  
    - Observe nodes execution, verify Google Sheet logging and Telegram notifications.

27. **Activate Workflow**  
    - Enable workflow to run automatically.

---

## 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Context or Link                                                                                                                               |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------|
| Workflow automates candidate screening from Telegram LinkedIn URLs using Apify and Google Gemini AI. It handles spam prevention, AI-based JD matching (priority on Telegram message role mention), detailed AI scoring, and logs to Google Sheets.                                                                                                                                                                                                                                                                                                | Workflow overview and purpose                                                                                                                |
| Google Gemini API free tier is generally sufficient; check [Google AI Pricing](https://ai.google.dev/pricing) and rate limits [here](https://ai.google.dev/gemini-api/docs/rate-limits).                                                                                                                                                                                                                                                                                                                                                     | AI model usage and rate limits                                                                                                               |
| Apify LinkedIn Profile Scraper actor free tier offers limited credits; see [Apify LinkedIn Scraper](https://apify.com/dev_fusion/linkedin-profile-scraper).                                                                                                                                                                                                                                                                                                                                                                                | LinkedIn scraping costs and limits                                                                                                          |
| Telegram bot setup instructions: create via [@BotFather](https://t.me/botfather), add to group, get group chat ID using [GetIDs bot](https://t.me/getidsbot).                                                                                                                                                                                                                                                                                                                                                                             | Telegram bot setup                                                                                                                           |
| Google Sheet columns required: Submission ID, Date, LinkedIn Profile URL, First Name, Last Name, Email (if known), Telegram Username, Strengths, Weaknesses, Risk Factor, Reward Factor, JD Match, Overall Fit, Justification.                                                                                                                                                                                                                                                                                                             | Google Sheets structure                                                                                                                      |
| Internal Telegram group chat ID must be configured in notification nodes; use negative numbers for groups (e.g., -4954246611).                                                                                                                                                                                                                                                                                                                                                                                                           | Telegram group chat ID                                                                                                                       |
| Troubleshooting tips include: checking tokens, URL formats, Apify extraction success and polling counts, Google Sheets access, Telegram chat IDs, AI prompt tuning for relevance, and handling Gemini API rate limits.                                                                                                                                                                                                                                                                                                                    | Sticky Note8 content                                                                                                                         |
| Sample outputs and Telegram conversation screenshots provided in sticky notes for reference.                                                                                                                                                                                                                                                                                                                                                                                                                                             | Sticky Note4 and Sticky Note13                                                                                                              |
| Customization ideas: adjust spam limits, polling attempts, AI prompt content, add multi-language support, integrate other messaging platforms, add interview scheduling, and human approval steps.                                                                                                                                                                                                                                                                                                                                       | Sticky Note7 content                                                                                                                         |

---

**Disclaimer:** The text provided is exclusively derived from an automated workflow built with n8n, adhering strictly to content policies. It contains no illegal, offensive, or protected content. All data processed is legal and publicly available.

---