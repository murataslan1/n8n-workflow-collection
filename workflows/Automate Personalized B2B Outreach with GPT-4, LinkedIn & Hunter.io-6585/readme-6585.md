Automate Personalized B2B Outreach with GPT-4, LinkedIn & Hunter.io

https://n8nworkflows.xyz/workflows/automate-personalized-b2b-outreach-with-gpt-4--linkedin---hunter-io-6585


# Automate Personalized B2B Outreach with GPT-4, LinkedIn & Hunter.io

### 1. Workflow Overview

This workflow automates an advanced B2B prospect outreach and nurturing campaign by integrating LinkedIn profile scraping, email discovery, AI-driven personalized email generation using GPT-4 (via LangChain OpenAI nodes), and outreach follow-up tracking. It targets sales and marketing teams aiming to efficiently identify, engage, and nurture prospects through personalized, AI-generated email sequences, while maintaining engagement tracking and team notifications.

The workflow is logically divided into the following blocks:

- **1.1 Prospect Data Acquisition**: Scraping LinkedIn profiles, extracting key data, finding emails, and storing prospect information.
- **1.2 AI-Powered Email Personalization**: Preparing prospect data, generating personalized opening lines, value propositions, optimized subject lines and CTAs, and assembling final emails.
- **1.3 Initial Email Outreach**: Sending personalized emails and updating outreach status.
- **1.4 Engagement Tracking and Follow-up Initiation**: Waiting for engagement, retrieving prospects for follow-up, and conditionally checking replies.
- **1.5 Follow-up Email Campaign**: Checking follow-up limits, generating follow-up emails, sending them, updating statuses, and looping for ongoing nurturing.
- **1.6 Notifications and Prospect Archiving**: Notifying sales team about replies and archiving prospects who exceed follow-up limits.

---

### 2. Block-by-Block Analysis

#### 2.1 Prospect Data Acquisition

**Overview:**  
This block collects raw prospect data by scraping LinkedIn profiles, extracting structured data, discovering prospect emails (disabled node), consolidating data, and storing it in Google Sheets for further processing.

**Nodes Involved:**  
- When clicking ‘Execute workflow’ (Manual Trigger)  
- LinkedIn Profile Scraper  
- Extract Key LinkedIn Data  
- Email Finder (disabled)  
- Consolidate Prospect Data  
- Initial Prospect Storage

**Node Details:**

- **When clicking ‘Execute workflow’**  
  - *Type*: Manual Trigger  
  - *Role*: Entry point to start the entire workflow manually.  
  - *Config*: No parameters; triggers workflow on user action.  
  - *Connections*: Outputs to LinkedIn Profile Scraper.  
  - *Edge cases*: None; manual trigger.

- **LinkedIn Profile Scraper**  
  - *Type*: Apify Scraper Node  
  - *Role*: Scrapes LinkedIn profiles for raw data.  
  - *Config*: Uses Apify actor configured for LinkedIn scraping (details abstracted).  
  - *Input*: Trigger from manual trigger.  
  - *Output*: Raw LinkedIn profile data to next node.  
  - *Edge cases*: Possible scraping errors due to LinkedIn rate limits, IP blocks, or changed page structure.

- **Extract Key LinkedIn Data**  
  - *Type*: Code (JavaScript)  
  - *Role*: Parses raw scraped data to extract structured prospect info (e.g., name, title, company).  
  - *Config*: Custom JS code processing input JSON to key fields.  
  - *Input*: Raw LinkedIn data.  
  - *Output*: Structured prospect data forwarded.  
  - *Edge cases*: Parsing errors if data format changes; missing fields.

- **Email Finder** (disabled)  
  - *Type*: Hunter.io node  
  - *Role*: Finds email addresses from prospect data.  
  - *Config*: Uses Hunter API credentials; currently disabled, possibly due to limits or alternative methods.  
  - *Input*: Structured prospect data.  
  - *Output*: Enriched prospect data including emails.  
  - *Edge cases*: API quota limits, no email found, invalid API key.

- **Consolidate Prospect Data**  
  - *Type*: Code (JavaScript)  
  - *Role*: Merges extracted data and email information into a single prospect record.  
  - *Config*: Custom code combining multiple inputs.  
  - *Input*: Output from Email Finder or previous node.  
  - *Output*: Final prospect object.  
  - *Edge cases*: Data conflicts, missing email if Email Finder disabled.

- **Initial Prospect Storage**  
  - *Type*: Google Sheets  
  - *Role*: Saves prospect data to a Google Sheet for record keeping and further processing.  
  - *Config*: Google Sheets credentials; target spreadsheet and sheet configured.  
  - *Input*: Consolidated prospect data.  
  - *Output*: On success, triggers retrieval of prospects for outreach.  
  - *Edge cases*: Google Sheets API rate limits, authorization errors.

---

#### 2.2 AI-Powered Email Personalization

**Overview:**  
Retrieves prospects from storage, prepares data, and leverages GPT-4 via LangChain OpenAI nodes to generate personalized email components: opening line, body (value proposition), subject line, and call-to-action (CTA), then assembles these into the final email content.

**Nodes Involved:**  
- Retrieve Prospects for Outreach  
- Prepare Data for AI Agents  
- Personalization Writer - Opening Line  
- Value Proposition Tailor - Body  
- Subject Line & CTA Optimizer  
- Assemble Final Email

**Node Details:**

- **Retrieve Prospects for Outreach**  
  - *Type*: Google Sheets  
  - *Role*: Fetches prospects ready for email outreach from the spreadsheet.  
  - *Config*: Points to the sheet containing stored prospects.  
  - *Input*: Triggered after initial storage or manually.  
  - *Output*: Prospect list to preparation code.  
  - *Edge cases*: Empty result, sheet access errors.

- **Prepare Data for AI Agents**  
  - *Type*: Code (JavaScript)  
  - *Role*: Formats prospect data into prompts suitable for AI generation (e.g., context, variables).  
  - *Input*: Prospect list.  
  - *Output*: Prepared prompt data for GPT nodes.  
  - *Edge cases*: Data formatting errors, missing fields.

- **Personalization Writer - Opening Line**  
  - *Type*: LangChain OpenAI node  
  - *Role*: Generates a personalized email opening line using GPT-4.  
  - *Config*: Uses OpenAI credentials; prompt includes prospect data.  
  - *Input*: Prepared prompt data.  
  - *Output*: Opening line text forwarded.  
  - *Edge cases*: API errors, rate limits, prompt failures.

- **Value Proposition Tailor - Body**  
  - *Type*: LangChain OpenAI node  
  - *Role*: Crafts personalized value proposition body text.  
  - *Input*: Output from opening line node.  
  - *Output*: Email body content.  
  - *Edge cases*: Same as above.

- **Subject Line & CTA Optimizer**  
  - *Type*: LangChain OpenAI node  
  - *Role*: Produces optimized subject line and call to action.  
  - *Input*: Email body content.  
  - *Output*: Subject and CTA text.  
  - *Edge cases*: Same as above.

- **Assemble Final Email**  
  - *Type*: Code (JavaScript)  
  - *Role*: Combines all generated parts into the final email structure.  
  - *Input*: Outputs of previous GPT nodes.  
  - *Output*: Final email text object to sending node.  
  - *Edge cases*: Concatenation errors, missing segments.

---

#### 2.3 Initial Email Outreach

**Overview:**  
Sends the personalized emails to prospects via Gmail and updates their outreach status in Google Sheets.

**Nodes Involved:**  
- Send Personalized Email  
- Update Email Sent Status

**Node Details:**

- **Send Personalized Email**  
  - *Type*: Gmail node  
  - *Role*: Sends the generated personalized emails using configured Gmail OAuth2 credentials.  
  - *Config*: OAuth2 credentials configured; email fields dynamically set from assembled content.  
  - *Input*: Final email data.  
  - *Output*: Success triggers status update.  
  - *Edge cases*: Gmail API errors, quota exceeded, invalid credentials.

- **Update Email Sent Status**  
  - *Type*: Google Sheets  
  - *Role*: Marks prospects as emailed in the tracking sheet.  
  - *Input*: Sent email confirmation.  
  - *Output*: Triggers engagement tracking wait node.  
  - *Edge cases*: Sheet write failures.

---

#### 2.4 Engagement Tracking and Follow-up Initiation

**Overview:**  
Waits for prospect engagement (open/reply), retrieves prospects for follow-up, and checks if a reply has been received to decide next steps.

**Nodes Involved:**  
- For Engagement Tracking (Wait)  
- Retrieve Prospect for Follow-up  
- Check for Reply  
- Check Follow-up Limit

**Node Details:**

- **For Engagement Tracking**  
  - *Type*: Wait  
  - *Role*: Pauses workflow awaiting engagement signals before follow-up.  
  - *Config*: Configured wait duration or webhook triggers.  
  - *Input*: After initial outreach status update.  
  - *Output*: Retrieves prospects for follow-up once wait ends.  
  - *Edge cases*: Timeout, webhook failures.

- **Retrieve Prospect for Follow-up**  
  - *Type*: Google Sheets  
  - *Role*: Fetches prospects eligible for follow-up emails.  
  - *Input*: Triggered after wait node.  
  - *Output*: Prospect data to reply check.  
  - *Edge cases*: Empty data, sheet errors.

- **Check for Reply**  
  - *Type*: If (conditional)  
  - *Role*: Determines if the prospect replied to the email.  
  - *Config*: Logic based on reply status field.  
  - *Outputs*:  
    - True: Proceeds to notify sales.  
    - False: Checks follow-up limit.  
  - *Edge cases*: Incorrect field format, missing data.

- **Check Follow-up Limit**  
  - *Type*: If (conditional)  
  - *Role*: Checks if the prospect has reached the max number of follow-ups.  
  - *Outputs*:  
    - Within limit: Generates follow-up email.  
    - Exceeded: Archives prospect.  
  - *Edge cases*: Limit config errors.

---

#### 2.5 Follow-up Email Campaign

**Overview:**  
Generates and sends follow-up emails, updates follow-up statuses, waits for next engagement or nurturing, and loops over items for batch processing.

**Nodes Involved:**  
- Follow-up Email Generator  
- Send Follow-up Email  
- Update Follow-up Status  
- For Next Follow-up or Nurture (Wait)  
- Loop Over Items

**Node Details:**

- **Follow-up Email Generator**  
  - *Type*: LangChain OpenAI node  
  - *Role*: Creates personalized follow-up email content.  
  - *Input*: Prospect data from limit check.  
  - *Output*: Follow-up email content.  
  - *Edge cases*: API errors, prompt failures.

- **Send Follow-up Email**  
  - *Type*: Gmail node  
  - *Role*: Sends the follow-up email via Gmail.  
  - *Input*: Generated follow-up content.  
  - *Output*: Triggers status update.  
  - *Edge cases*: Gmail API limits, auth errors.

- **Update Follow-up Status**  
  - *Type*: Google Sheets  
  - *Role*: Updates prospect record with follow-up email info.  
  - *Input*: Confirmation of sent email.  
  - *Output*: Triggers wait for next engagement.  
  - *Edge cases*: Sheet update failure.

- **For Next Follow-up or Nurture**  
  - *Type*: Wait  
  - *Role*: Waits before next follow-up or nurturing cycle.  
  - *Input*: After follow-up status update.  
  - *Output*: Triggers batch processing split.  
  - *Edge cases*: Wait time configuration.

- **Loop Over Items**  
  - *Type*: Split in Batches  
  - *Role*: Processes prospects in batches for scalability.  
  - *Input*: From wait node.  
  - *Output*: Feeds back into Retrieve Prospect for Follow-up.  
  - *Edge cases*: Batch size config, resource limits.

---

#### 2.6 Notifications and Prospect Archiving

**Overview:**  
Notifies the sales team on Slack when a prospect replies and archives prospects who have exceeded the follow-up limit.

**Nodes Involved:**  
- Notify Sales Team  
- Archive Prospect

**Node Details:**

- **Notify Sales Team**  
  - *Type*: Slack node  
  - *Role*: Sends notification with prospect reply details to sales channel.  
  - *Config*: Slack webhook or OAuth credentials set.  
  - *Input*: From Check for Reply node (True branch).  
  - *Output*: None further in workflow.  
  - *Edge cases*: Slack webhook failures, rate limits.

- **Archive Prospect**  
  - *Type*: Google Sheets  
  - *Role*: Moves or flags prospect as archived in the spreadsheet.  
  - *Input*: From Check Follow-up Limit node (exceeded branch).  
  - *Output*: None further.  
  - *Edge cases*: Sheet write errors.

---

### 3. Summary Table

| Node Name                      | Node Type                | Functional Role                         | Input Node(s)                   | Output Node(s)                      | Sticky Note                                    |
|-------------------------------|--------------------------|---------------------------------------|--------------------------------|-----------------------------------|-----------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger           | Manual workflow start                  | —                              | LinkedIn Profile Scraper           |                                               |
| LinkedIn Profile Scraper       | Apify Scraper             | Scrape LinkedIn profiles               | When clicking ‘Execute workflow’ | Extract Key LinkedIn Data          |                                               |
| Extract Key LinkedIn Data      | Code                     | Extract structured data from raw input| LinkedIn Profile Scraper        | Email Finder                      |                                               |
| Email Finder                  | Hunter.io                 | Find prospect emails (disabled)        | Extract Key LinkedIn Data       | Consolidate Prospect Data          |                                               |
| Consolidate Prospect Data      | Code                     | Merge data into complete prospect record| Email Finder                   | Initial Prospect Storage           |                                               |
| Initial Prospect Storage       | Google Sheets             | Store prospect data                    | Consolidate Prospect Data       | Retrieve Prospects for Outreach    |                                               |
| Retrieve Prospects for Outreach| Google Sheets             | Fetch prospects for outreach           | Initial Prospect Storage        | Prepare Data for AI Agents         |                                               |
| Prepare Data for AI Agents     | Code                     | Format data for AI prompt               | Retrieve Prospects for Outreach | Personalization Writer - Opening Line |                                               |
| Personalization Writer - Opening Line | LangChain OpenAI node | Generate email opening line            | Prepare Data for AI Agents      | Value Proposition Tailor - Body    |                                               |
| Value Proposition Tailor - Body| LangChain OpenAI node     | Generate email body                     | Personalization Writer - Opening Line | Subject Line & CTA Optimizer    |                                               |
| Subject Line & CTA Optimizer   | LangChain OpenAI node     | Generate subject line and CTA           | Value Proposition Tailor - Body | Assemble Final Email               |                                               |
| Assemble Final Email           | Code                     | Combine all parts into final email      | Subject Line & CTA Optimizer    | Send Personalized Email            |                                               |
| Send Personalized Email        | Gmail                    | Send personalized email                 | Assemble Final Email            | Update Email Sent Status           |                                               |
| Update Email Sent Status       | Google Sheets             | Mark email as sent                      | Send Personalized Email         | For Engagement Tracking            |                                               |
| For Engagement Tracking        | Wait                     | Wait for engagement before follow-up   | Update Email Sent Status        | Retrieve Prospect for Follow-up    |                                               |
| Retrieve Prospect for Follow-up| Google Sheets             | Fetch prospects for follow-up           | For Engagement Tracking         | Check for Reply                   |                                               |
| Check for Reply               | If                       | Check if prospect replied                | Retrieve Prospect for Follow-up | Check Follow-up Limit / Notify Sales Team |                                               |
| Check Follow-up Limit          | If                       | Check if follow-up limit reached         | Check for Reply (No)            | Follow-up Email Generator / Archive Prospect |                                               |
| Follow-up Email Generator      | LangChain OpenAI node     | Generate follow-up email content         | Check Follow-up Limit (Yes)     | Send Follow-up Email              |                                               |
| Send Follow-up Email           | Gmail                    | Send follow-up email                     | Follow-up Email Generator       | Update Follow-up Status           |                                               |
| Update Follow-up Status        | Google Sheets             | Update prospect follow-up status         | Send Follow-up Email            | For Next Follow-up or Nurture     |                                               |
| For Next Follow-up or Nurture  | Wait                     | Wait before next follow-up cycle          | Update Follow-up Status         | Loop Over Items                   |                                               |
| Loop Over Items                | Split In Batches          | Batch processing for scalability         | For Next Follow-up or Nurture   | Retrieve Prospect for Follow-up    |                                               |
| Notify Sales Team              | Slack                    | Notify sales team on reply               | Check for Reply (Yes)           | —                                 |                                               |
| Archive Prospect               | Google Sheets             | Archive prospects exceeding follow-up limit| Check Follow-up Limit (No)  | —                                 |                                               |
| Sticky Note                   | Sticky Note               | Various notes (no content)                | —                              | —                                 |                                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - Purpose: Entry point to start workflow manually.

2. **Create LinkedIn Profile Scraper Node**  
   - Type: Apify Scraper  
   - Configure Apify actor for LinkedIn profile scraping with API token.  
   - Connect Manual Trigger output to this node input.

3. **Create Code Node: Extract Key LinkedIn Data**  
   - Type: Code (JavaScript)  
   - Implement script to parse LinkedIn scraper output and extract fields like name, title, company, location.  
   - Connect LinkedIn Scraper output.

4. **Create Hunter.io Email Finder Node (optional)**  
   - Type: Hunter.io  
   - Configure with Hunter API credentials.  
   - Connect output from extract code node.  
   - Note: This node is disabled in original workflow; enable if desired.

5. **Create Code Node: Consolidate Prospect Data**  
   - Combine email and LinkedIn data into one object per prospect.  
   - Connect from Email Finder (or Extract Key LinkedIn Data if Email Finder disabled).

6. **Create Google Sheets Node: Initial Prospect Storage**  
   - Configure Google Sheets credentials.  
   - Select spreadsheet and sheet to store prospects.  
   - Map prospect fields accordingly.  
   - Connect from Consolidate Prospect Data.

7. **Create Google Sheets Node: Retrieve Prospects for Outreach**  
   - Configure to read stored prospects for outreach.  
   - Connect from Initial Prospect Storage.

8. **Create Code Node: Prepare Data for AI Agents**  
   - Format retrieved prospects into prompt templates for AI.  
   - Connect from Retrieve Prospects for Outreach.

9. **Create LangChain OpenAI Node: Personalization Writer - Opening Line**  
   - Configure with OpenAI GPT-4 credentials.  
   - Input prompt includes prospect data for opening line.  
   - Connect from Prepare Data for AI Agents.

10. **Create LangChain OpenAI Node: Value Proposition Tailor - Body**  
    - Configure similarly.  
    - Input: Output from opening line generation.  
    - Connect accordingly.

11. **Create LangChain OpenAI Node: Subject Line & CTA Optimizer**  
    - Configure GPT-4.  
    - Input: Value proposition output.  
    - Connect accordingly.

12. **Create Code Node: Assemble Final Email**  
    - Combine opening line, body, subject, and CTA into email object.  
    - Connect from Subject Line & CTA Optimizer.

13. **Create Gmail Node: Send Personalized Email**  
    - Configure Gmail OAuth2 credentials.  
    - Map email fields from assembled email data.  
    - Connect from Assemble Final Email.

14. **Create Google Sheets Node: Update Email Sent Status**  
    - Mark prospect as emailed.  
    - Connect from Send Personalized Email.

15. **Create Wait Node: For Engagement Tracking**  
    - Configure appropriate wait time or webhook for engagement.  
    - Connect from Update Email Sent Status.

16. **Create Google Sheets Node: Retrieve Prospect for Follow-up**  
    - Fetch prospects eligible for follow-up.  
    - Connect from Wait node.

17. **Create If Node: Check for Reply**  
    - Condition: Check reply status field.  
    - Connect from Retrieve Prospect for Follow-up.

18. **Create Slack Node: Notify Sales Team**  
    - Configure Slack webhook or OAuth credentials.  
    - Connect to True branch of Check for Reply.

19. **Create If Node: Check Follow-up Limit**  
    - Condition: Compare follow-up count to max limit.  
    - Connect to False branch of Check for Reply.

20. **Create LangChain OpenAI Node: Follow-up Email Generator**  
    - Generate follow-up email content.  
    - Connect from Check Follow-up Limit (within limit branch).

21. **Create Gmail Node: Send Follow-up Email**  
    - Configure Gmail.  
    - Connect from Follow-up Email Generator.

22. **Create Google Sheets Node: Update Follow-up Status**  
    - Mark follow-up sent.  
    - Connect from Send Follow-up Email.

23. **Create Wait Node: For Next Follow-up or Nurture**  
    - Configure wait time for next action.  
    - Connect from Update Follow-up Status.

24. **Create Split In Batches Node: Loop Over Items**  
    - Configure batch size.  
    - Connect from Wait node.

25. **Connect Loop Over Items output (second) back to Retrieve Prospect for Follow-up**  
    - Enables batch iterative processing.

26. **Create Google Sheets Node: Archive Prospect**  
    - Configure to mark/archive prospects exceeding follow-up limit.  
    - Connect from Check Follow-up Limit (exceeded branch).

---

### 5. General Notes & Resources

| Note Content                                                                                           | Context or Link                                                                                           |
|------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| The workflow leverages GPT-4 via LangChain OpenAI nodes for best-in-class natural language generation. | Ensure valid OpenAI API key with GPT-4 access is configured.                                              |
| Hunter.io email finder node is disabled, possibly due to API limits or alternative email sourcing.     | Enable only if you have sufficient Hunter.io quota and API key.                                           |
| Gmail nodes require OAuth2 credentials with appropriate scopes (sending emails and reading status).    | Configure Gmail OAuth2 in n8n credentials.                                                                |
| Slack notifications alert sales team of prospect replies, improving real-time responsiveness.          | Requires Slack app with webhook or OAuth token configured.                                                |
| Google Sheets is used extensively for persistent prospect data storage and state tracking.             | Use a dedicated spreadsheet with clear sheet names and column headers matching node mappings.             |
| Batch processing via Split In Batches node improves scalability and avoids API rate limiting.          | Tune batch size according to API quotas and n8n server capacity.                                          |
| Wait nodes implement delays to avoid spamming and respect prospect engagement windows.                  | Adjust wait times per campaign strategy.                                                                 |

---

**Disclaimer:** The provided text is exclusively derived from an n8n automated workflow. It adheres strictly to content policies and contains no illegal, offensive, or protected material. All data handled is legal and publicly accessible.