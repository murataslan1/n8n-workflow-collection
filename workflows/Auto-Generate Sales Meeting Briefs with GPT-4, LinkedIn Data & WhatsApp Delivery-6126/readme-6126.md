Auto-Generate Sales Meeting Briefs with GPT-4, LinkedIn Data & WhatsApp Delivery

https://n8nworkflows.xyz/workflows/auto-generate-sales-meeting-briefs-with-gpt-4--linkedin-data---whatsapp-delivery-6126


# Auto-Generate Sales Meeting Briefs with GPT-4, LinkedIn Data & WhatsApp Delivery

### 1. Workflow Overview

This workflow automates the generation and delivery of concise sales meeting briefs by leveraging calendar data, company enrichment, social media insights, and AI summarization. It targets sales professionals who want to prepare quickly and efficiently for upcoming meetings with relevant, up-to-date information about meeting attendees’ companies and their recent social media activity.

The workflow is logically divided into the following blocks:

- **1.1 Schedule and Initialization**: Automatically triggers daily and sets initial parameters.
- **1.2 Meeting and Attendee Extraction**: Fetches meetings from Google Calendar and extracts attendee email domains.
- **1.3 Company Enrichment**: Enriches attendee company information using email domains.
- **1.4 Social Media Data Retrieval**: Retrieves latest LinkedIn posts related to enriched companies.
- **1.5 AI Summarization and Formatting**: Summarizes social media data with GPT-4 and formats it for delivery.
- **1.6 Delivery**: Sends the generated briefs via WhatsApp and Gmail.

---

### 2. Block-by-Block Analysis

#### 2.1 Schedule and Initialization

**Overview:**  
This block triggers the workflow at 5 AM daily and initializes workflow variables including API keys and email lists.

**Nodes Involved:**  
- Schedule Trigger – 5 AM  
- Initialize Workflow

**Node Details:**

- **Schedule Trigger – 5 AM**  
  - Type: Schedule Trigger  
  - Configuration: Triggers exactly at 5:00 AM every day.  
  - Inputs: None (start node)  
  - Outputs: Connects to Initialize Workflow  
  - Edge Cases: Missed triggers if n8n instance is down or time synchronization issues.

- **Initialize Workflow**  
  - Type: Set  
  - Configuration: Initializes variables `linkedIn_API_Key` and `emails` as empty or preset values.  
  - Inputs: From Schedule Trigger  
  - Outputs: Connects to Fetch Today’s Meetings from Google Calendar  
  - Edge Cases: Missing or incorrect API keys or emails could cause downstream failures.

---

#### 2.2 Meeting and Attendee Extraction

**Overview:**  
Fetches meetings scheduled within a specific time window from Google Calendar and extracts attendee email domains and addresses for further processing.

**Nodes Involved:**  
- Fetch Today’s Meetings from Google Calendar  
- Extract Attendee Email Domains  
- Loop Through Attendees  
- Split Attendee Details

**Node Details:**

- **Fetch Today’s Meetings from Google Calendar**  
  - Type: Google Calendar  
  - Configuration: Retrieves up to 150 events between 5 days ago and 10 days in the future from a specific calendar email.  
  - Inputs: From Initialize Workflow  
  - Outputs: Connects to Extract Attendee Email Domains  
  - Edge Cases: OAuth token expiry, API rate limits, empty calendar results.

- **Extract Attendee Email Domains**  
  - Type: Set  
  - Configuration: Extracts attendee email domains by filtering out organizers and splitting emails to get domains. Also collects all attendee emails.  
  - Inputs: From Fetch Today’s Meetings  
  - Outputs: Connects to Loop Through Attendees  
  - Expressions:  
    - `domain_name = attendees.filter(a => !a.organizer).map(a => a.email.split('@').pop())`  
    - `attend_Emails = attendees.filter(a => !a.organizer).map(a => a.email)`  
  - Edge Cases: No attendees, malformed emails.

- **Loop Through Attendees**  
  - Type: SplitInBatches  
  - Configuration: Iterates over each attendee’s domain for processing.  
  - Inputs: From Extract Attendee Email Domains  
  - Outputs: Connects to Split Attendee Details and loops back to itself for batch processing.  
  - Edge Cases: Large batches may hit rate limits or processing timeouts.

- **Split Attendee Details**  
  - Type: SplitOut  
  - Configuration: Splits out each attendee’s domain, emails, and meeting start time for individual processing.  
  - Inputs: From Loop Through Attendees  
  - Outputs: Connects to Enrich attendee company  
  - Edge Cases: Missing or unexpected data structure.

---

#### 2.3 Company Enrichment

**Overview:**  
Enriches company data for each attendee domain using the Clearbit API, then waits to ensure enrichment completion.

**Nodes Involved:**  
- Enrich attendee company  
- Wait for Company Enrichment  
- Check Enrichment Status

**Node Details:**

- **Enrich attendee company**  
  - Type: Clearbit (Company enrichment)  
  - Configuration: Uses `domain_name` to fetch company data such as LinkedIn handle.  
  - Inputs: From Split Attendee Details  
  - Outputs: Connects to Wait for Company Enrichment  
  - Credentials: Clearbit API key required.  
  - Edge Cases: API limits, domain not found, network errors.

- **Wait for Company Enrichment**  
  - Type: Wait  
  - Configuration: Introduces a delay to allow Clearbit enrichment to complete.  
  - Inputs: From Enrich attendee company  
  - Outputs: Connects to Check Enrichment Status  
  - Edge Cases: Delay too short may cause incomplete data downstream.

- **Check Enrichment Status**  
  - Type: Switch  
  - Configuration: Checks if the Clearbit response contains a valid LinkedIn handle (`linkedin.handle !== null`).  
  - Inputs: From Wait for Company Enrichment  
  - Outputs: Only proceeds if valid LinkedIn handle exists, else halts or loops.  
  - Edge Cases: Missing or null LinkedIn handles.

---

#### 2.4 Social Media Data Retrieval

**Overview:**  
Fetches the latest LinkedIn posts from an external API using the enriched LinkedIn handle, then extracts key insights for summarization.

**Nodes Involved:**  
- Fetch Latest LinkedIn Posts  
- Extract Key Post Insights

**Node Details:**

- **Fetch Latest LinkedIn Posts**  
  - Type: HTTP Request  
  - Configuration: Calls RapidAPI endpoint with LinkedIn company URL and sorts posts by recent. Uses stored LinkedIn API key from initialization.  
  - Inputs: From Check Enrichment Status  
  - Outputs: Connects to Extract Key Post Insights  
  - Headers: Includes `X-RapidAPI-Key` and `X-RapidAPI-Host`  
  - Edge Cases: API rate limits, invalid LinkedIn handles, network failures.

- **Extract Key Post Insights**  
  - Type: Set  
  - Configuration: Selects the top 10 posts and extracts relevant fields: text, likes, comments, and post date. Also passes company name and meeting details.  
  - Inputs: From Fetch Latest LinkedIn Posts  
  - Outputs: Connects to Format Summary for Email and Summarize Social Activity with AI  
  - Edge Cases: Empty post data, malformed API responses.

---

#### 2.5 AI Summarization and Formatting

**Overview:**  
Uses GPT-4 to generate a concise, sales-focused summary of social media activity, then formats the summary into HTML for email and message delivery.

**Nodes Involved:**  
- Summarize Social Activity with AI  
- Format Summary for Email  
- Merge Summary with Context  
- Wait Before Sending  
- Generate HTML Email Template

**Node Details:**

- **Summarize Social Activity with AI**  
  - Type: Set  
  - Configuration: Prepares data such as attendee email, meeting start hour and minute for AI input.  
  - Inputs: From Extract Key Post Insights  
  - Outputs: Connects to Merge Summary with Context (second input)  
  - Edge Cases: Incorrect DateTime parsing, missing emails.

- **Format Summary for Email**  
  - Type: OpenAI (Chat)  
  - Configuration: Uses GPT-4 to generate a short, impersonal email-style summary based on provided JSON data of company posts.  
  - Inputs: From Extract Key Post Insights  
  - Outputs: Connects to Merge Summary with Context (first input)  
  - Credentials: OpenAI API key required.  
  - Edge Cases: API token expiration, prompt failures, rate limits.

- **Merge Summary with Context**  
  - Type: Merge  
  - Configuration: Combines AI-generated summary and contextual meeting information into one dataset.  
  - Inputs: From Format Summary for Email and Summarize Social Activity with AI  
  - Outputs: Connects to Wait Before Sending  
  - Edge Cases: Data misalignment on merge by position.

- **Wait Before Sending**  
  - Type: Wait  
  - Configuration: Waits 2 seconds before proceeding to sending nodes.  
  - Inputs: From Merge Summary with Context  
  - Outputs: Connects to Generate HTML Email Template  
  - Edge Cases: Delay too short or unnecessary.

- **Generate HTML Email Template**  
  - Type: HTML  
  - Configuration: Generates an HTML email using meeting time, attendee email, company name, and AI summary content. Uses inline CSS for styling.  
  - Inputs: From Wait Before Sending  
  - Outputs: Connects to Send via WhatsApp and Send via Gmail  
  - Edge Cases: Missing variables or malformed HTML.

---

#### 2.6 Delivery

**Overview:**  
Sends the generated briefing via WhatsApp for quick mobile access and Gmail for professional email follow-up.

**Nodes Involved:**  
- Send via WhatsApp  
- Send via Gmail

**Node Details:**

- **Send via WhatsApp**  
  - Type: WhatsApp  
  - Configuration: Sends the HTML message body to a specified recipient phone number.  
  - Inputs: From Generate HTML Email Template  
  - Credentials: WhatsApp API credentials required.  
  - Edge Cases: Invalid phone numbers, API throttling, message formatting issues.

- **Send via Gmail**  
  - Type: Gmail  
  - Configuration: Sends an email to the initialized list of emails with the HTML content and a subject indicating the company name.  
  - Inputs: From Generate HTML Email Template  
  - Credentials: Gmail OAuth2 credentials required.  
  - Edge Cases: Authentication expiration, recipient address issues, Gmail API limits.

---

### 3. Summary Table

| Node Name                      | Node Type            | Functional Role                              | Input Node(s)                       | Output Node(s)                               | Sticky Note                                                                                                                      |
|--------------------------------|----------------------|----------------------------------------------|-----------------------------------|----------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| Schedule Trigger – 5 AM         | Schedule Trigger     | Starts workflow daily at 5 AM                 | None                              | Initialize Workflow                           | Triggers the workflow automatically every morning at 5 AM.                                                                       |
| Initialize Workflow             | Set                  | Initializes API keys and email variables     | Schedule Trigger – 5 AM            | Fetch Today’s Meetings from Google Calendar  | Sets up default values or configurations needed for processing.                                                                  |
| Fetch Today’s Meetings from Google Calendar | Google Calendar      | Retrieves upcoming meetings from calendar    | Initialize Workflow                | Extract Attendee Email Domains                | Retrieves all meetings scheduled for the current day.                                                                            |
| Extract Attendee Email Domains  | Set                  | Extracts domains and emails from attendees   | Fetch Today’s Meetings             | Loop Through Attendees                        | Extracts email domains of meeting attendees for company identification.                                                          |
| Loop Through Attendees          | SplitInBatches       | Iterates over each attendee for processing   | Extract Attendee Email Domains    | Split Attendee Details, Loop Through Attendees | Iterates over each attendee to perform enrichment and analysis.                                                                   |
| Split Attendee Details          | SplitOut             | Splits attendee data for individual handling | Loop Through Attendees             | Enrich attendee company                      | Separates individual attendee data for precise processing.                                                                       |
| Enrich attendee company         | Clearbit             | Enriches company info from domain             | Split Attendee Details             | Wait for Company Enrichment                   | Looks up company details using attendee email domains.                                                                            |
| Wait for Company Enrichment     | Wait                 | Delays to ensure enrichment completion       | Enrich attendee company            | Check Enrichment Status                        | Adds a delay to ensure enrichment API finishes before next step.                                                                 |
| Check Enrichment Status         | Switch               | Validates presence of LinkedIn handle        | Wait for Company Enrichment        | Fetch Latest LinkedIn Posts                    | Ensures only valid/enriched companies proceed to the next steps.                                                                  |
| Fetch Latest LinkedIn Posts     | HTTP Request         | Gets latest LinkedIn posts for company       | Check Enrichment Status            | Extract Key Post Insights                      | Retrieves the most recent social media posts for the company.                                                                    |
| Extract Key Post Insights       | Set                  | Extracts relevant post details for summary   | Fetch Latest LinkedIn Posts        | Format Summary for Email, Summarize Social Activity with AI | Filters out non-relevant content and keeps business-useful data.                                                                  |
| Summarize Social Activity with AI | Set                  | Prepares data for AI summarization            | Extract Key Post Insights          | Merge Summary with Context                     | Uses AI to generate a short, sales-relevant summary of the posts.                                                                 |
| Format Summary for Email        | OpenAI Chat           | Generates AI summary from post data           | Extract Key Post Insights          | Merge Summary with Context                     | Prepares the summary data in a readable format.                                                                                   |
| Merge Summary with Context      | Merge                | Combines AI summary with meeting context     | Format Summary for Email, Summarize Social Activity with AI | Wait Before Sending                           | Wraps summary along with attendee, time, and company info.                                                                        |
| Wait Before Sending             | Wait                 | Delays before sending messages                 | Merge Summary with Context         | Generate HTML Email Template                   | Optional pause to manage API rate or ensure proper timing.                                                                        |
| Generate HTML Email Template    | HTML                 | Builds HTML email from summary and context   | Wait Before Sending                | Send via WhatsApp, Send via Gmail              | Builds a clean, short HTML email ready to send.                                                                                   |
| Send via WhatsApp               | WhatsApp             | Sends summary via WhatsApp                     | Generate HTML Email Template       | None                                          | Sends the summary to WhatsApp for quick access on the go.                                                                         |
| Send via Gmail                 | Gmail                | Sends summary via email                        | Generate HTML Email Template       | None                                          | Sends the summary to email as a professional follow-up.                                                                           |
| Sticky Note                    | Sticky Note           | Documentation and workflow purpose summary    | None                             | None                                          | ## Workflow Purpose (Step-by-Step) ... (full note content as above)                                                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node**  
   - Set trigger time: 5:00 AM daily.

2. **Add a Set node named “Initialize Workflow”**  
   - Define variables: `linkedIn_API_Key` (string, your API key), `emails` (array or string of recipient emails).

3. **Add a Google Calendar node named “Fetch Today’s Meetings from Google Calendar”**  
   - Operation: Get All Events  
   - Calendar ID: your Google Calendar email  
   - Time Range: from 5 days ago to 10 days ahead  
   - Limit: 150  
   - Connect output of Initialize Workflow to this node.  
   - Set up Google OAuth2 credentials.

4. **Add a Set node named “Extract Attendee Email Domains”**  
   - Use expressions to extract:  
     - `domain_name`: extract domains from attendees excluding organizers  
     - `attend_Emails`: extract attendee emails excluding organizers  
   - Connect output of Google Calendar node here.

5. **Add a SplitInBatches node named “Loop Through Attendees”**  
   - No special options needed.  
   - Connect output of previous node.

6. **Add a SplitOut node named “Split Attendee Details”**  
   - Field to split out: `domain_name`  
   - Include fields: `attend_Emails`, `start` (meeting start time)  
   - Connect output of Loop Through Attendees.

7. **Add a Clearbit node named “Enrich attendee company”**  
   - Operation: Company enrichment by domain  
   - Input: Use `domain_name` from Split Attendee Details  
   - Configure Clearbit API credentials.  
   - Connect output of Split Attendee Details.

8. **Add a Wait node named “Wait for Company Enrichment”**  
   - Default wait (or adjust as needed).  
   - Connect output of Clearbit node.

9. **Add a Switch node named “Check Enrichment Status”**  
   - Condition: Check if `linkedin.handle` is non-null in JSON response.  
   - Proceed only if true.  
   - Connect output of Wait node.

10. **Add an HTTP Request node named “Fetch Latest LinkedIn Posts”**  
    - URL: `https://fresh-linkedin-profile-data.p.rapidapi.com/get-company-posts`  
    - Query params:  
      - `linkedin_url`: `https://www.linkedin.com/{{ linkedin.handle }}`  
      - `sort_by`: `recent`  
    - Headers:  
      - `X-RapidAPI-Key`: use LinkedIn API key from Initialize Workflow  
      - `X-RapidAPI-Host`: `fresh-linkedin-profile-data.p.rapidapi.com`  
    - Connect output of Switch node.

11. **Add a Set node named “Extract Key Post Insights”**  
    - Extract top 10 posts with fields text, likes, comments, posted date.  
    - Pass company name and meeting details.  
    - Connect output of HTTP Request node.

12. **Add two parallel nodes:**  
    - **OpenAI Chat node named “Format Summary for Email”**  
      - Model: GPT-4  
      - Prompt: Request a short, impersonal email-style summary based on JSON data.  
      - Connect output of Extract Key Post Insights.  
      - Configure OpenAI API credentials.  
    - **Set node named “Summarize Social Activity with AI”**  
      - Prepare fields: attendee email, start hour and minute from meeting date.  
      - Connect output of Extract Key Post Insights.

13. **Add a Merge node named “Merge Summary with Context”**  
    - Mode: Combine by position  
    - Connect outputs of “Format Summary for Email” and “Summarize Social Activity with AI” to inputs 1 and 2 respectively.

14. **Add a Wait node named “Wait Before Sending”**  
    - Wait 2 seconds.  
    - Connect output of Merge node.

15. **Add an HTML node named “Generate HTML Email Template”**  
    - Use inline CSS and template variables for attendee email, meeting time, company name, and AI summary content.  
    - Connect output of Wait node.

16. **Add a WhatsApp node named “Send via WhatsApp”**  
    - Operation: Send message  
    - Message body: use generated HTML  
    - Recipient phone number: set accordingly  
    - Configure WhatsApp API credentials.  
    - Connect output of HTML node.

17. **Add a Gmail node named “Send via Gmail”**  
    - Recipient: use initialized emails  
    - Subject: "Latest social activity for: {{ company name }}"  
    - Message body: use generated HTML  
    - Configure Gmail OAuth2 credentials.  
    - Connect output of HTML node.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                | Context or Link                                                                                                        |
|---------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| The workflow purpose is detailed in the Sticky Note node, providing a clear step-by-step explanation of each logical block and function.    | Internal Sticky Note node in the workflow.                                                                             |
| LinkedIn data retrieval depends on a third-party RapidAPI endpoint requiring a valid API key; ensure subscription and key validity.          | https://rapidapi.com                                                                                                   |
| Clearbit enrichment requires a valid API key with sufficient quota to avoid rate limiting or enrichment failures.                           | https://clearbit.com                                                                                                   |
| OpenAI GPT-4 model credentials are required for summarization; monitor usage to keep within rate limits and cost controls.                  | https://openai.com                                                                                                     |
| WhatsApp node usage requires proper WhatsApp Business API setup and phone number provisioning.                                               | https://www.twilio.com/whatsapp or your WhatsApp API provider documentation                                            |
| Gmail node requires OAuth2 credentials with appropriate scopes for sending emails on behalf of the user.                                     | https://developers.google.com/identity/protocols/oauth2                                                                |

---

**Disclaimer:** The provided text is exclusively derived from an n8n automated workflow and respects all applicable content policies. No illegal, offensive, or protected elements are included. All data processed is legal and public.