Automate NPS Survey Collection & Response Handling with GoHighLevel, Gmail & Notion

https://n8nworkflows.xyz/workflows/automate-nps-survey-collection---response-handling-with-gohighlevel--gmail---notion-9227


# Automate NPS Survey Collection & Response Handling with GoHighLevel, Gmail & Notion

### 1. Workflow Overview

This workflow automates the collection and processing of NPS (Net Promoter Score) surveys by integrating GoHighLevel CRM, Gmail, and Notion. It targets businesses using GoHighLevel to manage deals and client relationships, aiming to seamlessly send NPS surveys upon deal completion, collect client feedback via email responses, and route feedback for appropriate follow-up. The workflow is structured in two main logical blocks:

**1.1 NPS Survey Dispatch Block**  
- Detects deals marked as "won" in GoHighLevel that have not yet received an NPS survey.  
- Filters and validates deals with valid client email addresses.  
- Sends personalized HTML email surveys with embedded mailto links for clients to respond easily.  
- Updates GoHighLevel custom fields to mark the survey as sent and avoid duplicates.

**1.2 NPS Response Processing Block**  
- Scheduled weekly to check Gmail for unread NPS response emails.  
- Parses each email to extract the NPS score, client details, deal ID, and written feedback.  
- Routes responses based on score category (Promoter, Passive, Detractor).  
- Logs positive feedback into Notion and sends thank-you emails with review requests.  
- For detractors, creates support tickets in Notion and alerts the support team via email for urgent follow-up.

---

### 2. Block-by-Block Analysis

#### 2.1 NPS Survey Dispatch Block

**Overview:**  
This block runs hourly to fetch all "won" opportunities from GoHighLevel CRM, filters out those already surveyed or lacking emails, sends a personalized NPS survey email, and updates the CRM to prevent duplicate sends.

**Nodes Involved:**  
- Trigger: Check Every Hour  
- Get Won Opportunities from GHL  
- Filter Unsurveyed Completed Deals (Code)  
- Check if Valid Deals Exist (If)  
- Send NPS Survey Email (Gmail)  
- Update GHL - Mark Survey Sent (HTTP Request)

**Node Details:**

- **Trigger: Check Every Hour**  
  - Type: Schedule Trigger  
  - Configured to run every hour, initiating the workflow regularly.  
  - Outputs no input nodes, triggers the "Get Won Opportunities from GHL" node.  
  - Potential failure: Misconfigured schedule or system downtime can delay survey sends.

- **Get Won Opportunities from GHL**  
  - Type: GoHighLevel node (API integration)  
  - Retrieves all deals with status = "won" from GoHighLevel.  
  - Uses OAuth2 credentials for authentication.  
  - Returns all deals without pagination limits.  
  - Outputs are passed to the next filtering node.  
  - Failure modes: OAuth token expiration, API rate limits, network errors.

- **Filter Unsurveyed Completed Deals (Code Node)**  
  - Type: JavaScript code node  
  - Filters the deals to keep only those with status "won" and where the custom field `nps_survey_sent` is false or missing.  
  - Validates that each deal has a client email; skips deals without emails.  
  - Constructs a simplified JSON object per deal containing essential contact and deal info.  
  - Outputs an array of valid deals or a message if none found.  
  - Failure modes: Expression or code errors, missing expected fields, data format changes in GoHighLevel API.

- **Check if Valid Deals Exist (If Node)**  
  - Type: If  
  - Checks the boolean property `hasDeals` from previous node output.  
  - If true, triggers sending survey; if false, ends workflow for this run.  
  - Failures: Expression evaluation errors if input data malformed.

- **Send NPS Survey Email (Gmail Node)**  
  - Type: Gmail (OAuth2 authenticated)  
  - Sends a personalized HTML email containing an NPS survey with rating scale 0-10.  
  - Email includes mailto links that pre-fill a reply email with deal ID, client info, and score selection to facilitate quick responses.  
  - Uses expressions to inject client name, company, deal value, and deal ID.  
  - Outputs to update the GoHighLevel record.  
  - Failure modes: Gmail OAuth token expiry, email delivery failure, malformed HTML or expressions.

- **Update GHL - Mark Survey Sent (HTTP Request Node)**  
  - Type: HTTP Request  
  - PUT request to GoHighLevel API to update the deal’s custom fields `nps_survey_sent` to true and `nps_sent_date` to current timestamp.  
  - Uses environment variable `GHL_API_TOKEN` for authorization header.  
  - Handles errors gracefully (continue on error).  
  - Failure modes: API authorization failure, rate limits, invalid deal ID, network issues.

---

#### 2.2 NPS Response Processing Block

**Overview:**  
Scheduled weekly, this block fetches unread NPS response emails from Gmail, parses the email content to extract NPS scores and feedback, categorizes responses, logs positive feedback or creates support tickets in Notion, and sends appropriate follow-up emails or alerts.

**Nodes Involved:**  
- Trigger: Check Responses Weekly  
- Fetch Unread NPS Responses (Gmail)  
- Parse NPS Score from Email (Code)  
- Route by Score (Promoter vs Detractor) (If)  
- Log Positive Feedback in Notion  
- Send Thank You & Review Request (Gmail)  
- Create Support Ticket in Notion  
- Alert Team - Low Score (Gmail)

**Node Details:**

- **Trigger: Check Responses Weekly**  
  - Type: Schedule Trigger  
  - Configured to run weekly on Mondays at 8am.  
  - Starts the response processing chain.  
  - Failures: Schedule misconfiguration, delayed runs.

- **Fetch Unread NPS Responses (Gmail Node)**  
  - Type: Gmail (OAuth2)  
  - Fetches unread email threads matching no filters other than unread status.  
  - Intended to catch all new NPS response emails since last check.  
  - Outputs raw email data to parsing node.  
  - Failure modes: OAuth token expiration, Gmail API rate limits, network errors.

- **Parse NPS Score from Email (Code Node)**  
  - Type: JavaScript code  
  - Parses email snippet text to extract:  
    - NPS score (integer 0-10)  
    - Deal ID  
    - Client name and email  
    - Feedback text  
    - Categorizes score as Promoter (9-10), Passive (7-8), or Detractor (0-6)  
  - Returns a normalized JSON object with extracted data for routing.  
  - Failure modes: Unexpected email format, regex failures, missing data fields.

- **Route by Score (Promoter vs Detractor) (If Node)**  
  - Type: If  
  - Routes based on NPS score > 7 (Promoter/Passive) or ≤ 7 (Detractor).  
  - Controls two downstream branches: positive feedback vs support ticket creation.  
  - Failures: Expression errors, missing or invalid score data.

- **Log Positive Feedback in Notion (Notion Node)**  
  - Type: Notion API node  
  - Creates a new page in a Notion database logging positive reviews (Promoters/Passives).  
  - Populates properties: client name, email, category, score, and email subject.  
  - Uses OAuth2 credentials for Notion API.  
  - Failure modes: Notion API rate limits, credential expiration, data validation errors.

- **Send Thank You & Review Request (Gmail Node)**  
  - Type: Gmail  
  - Sends personalized thank-you email with review request to clients with positive feedback.  
  - HTML formatted with client name and NPS score details.  
  - Failure modes: Email delivery failure, OAuth issues.

- **Create Support Ticket in Notion (Notion Node)**  
  - Type: Notion API node  
  - Creates a support ticket page in Notion for detractors.  
  - Includes client and deal info, NPS score, category, and email subject.  
  - Failure modes: Same as other Notion node.

- **Alert Team - Low Score (Gmail Node)**  
  - Type: Gmail  
  - Sends urgent alert email to support team address notifying them of low NPS score.  
  - Includes client details, feedback, and call to action for 24-hour follow-up.  
  - Uses environment variable `SUPPORT_TEAM_EMAIL` for recipient.  
  - Failure modes: Email delivery issues, invalid recipient.

---

### 3. Summary Table

| Node Name                     | Node Type             | Functional Role                                   | Input Node(s)                         | Output Node(s)                             | Sticky Note                                                                                              |
|-------------------------------|-----------------------|-------------------------------------------------|-------------------------------------|--------------------------------------------|--------------------------------------------------------------------------------------------------------|
| Sticky Note                   | Sticky Note           | Overview and general info                        | -                                   | -                                          | 📋 NPS Survey Automation Workflow - describes purpose, features, and setup requirements                |
| Sticky Note1                  | Sticky Note           | Info about fetching won opportunities           | -                                   | -                                          | 🔍 Fetch Won Opportunities - hourly fetch from GHL with custom fields info                             |
| Sticky Note2                  | Sticky Note           | Info about filtering and validating deals       | -                                   | -                                          | ✅ Filter & Validate Deals - filters deals with status won, unsurveyed, with valid email               |
| Sticky Note3                  | Sticky Note           | Info about sending NPS survey email              | -                                   | -                                          | 📧 Send NPS Survey - description of email content and personalization                                  |
| Sticky Note4                  | Sticky Note           | Info about collecting responses from Gmail      | -                                   | -                                          | 📥 Collect Responses - weekly Gmail check for unread NPS emails                                        |
| Sticky Note5                  | Sticky Note           | Info about routing responses by score            | -                                   | -                                          | 🎯 Route Based on Score - handling promoters vs detractors                                            |
| Trigger: Check Every Hour     | Schedule Trigger      | Initiates hourly check for won deals             | -                                   | Get Won Opportunities from GHL              |                                                                                                        |
| Get Won Opportunities from GHL| GoHighLevel           | Fetches won deals from CRM                        | Trigger: Check Every Hour            | Filter Unsurveyed Completed Deals           |                                                                                                        |
| Filter Unsurveyed Completed Deals | Code               | Filters deals that are won, unsurveyed, with email | Get Won Opportunities from GHL      | Check if Valid Deals Exist                   |                                                                                                        |
| Check if Valid Deals Exist    | If                    | Checks if any valid deals are present             | Filter Unsurveyed Completed Deals   | Send NPS Survey Email                        | ✅ Check for Valid Deals - conditional stop if no deals                                                |
| Send NPS Survey Email         | Gmail                 | Sends personalized NPS survey email               | Check if Valid Deals Exist           | Update GHL - Mark Survey Sent                | 📧 Send NPS Survey Email - email with rating scale and mailto links                                   |
| Update GHL - Mark Survey Sent | HTTP Request          | Updates GHL custom fields to mark survey sent     | Send NPS Survey Email                | -                                          | 📤 Update GHL - Mark Survey Sent - prevents duplicates                                                |
| Trigger: Check Responses Weekly| Schedule Trigger     | Initiates weekly check for new NPS email responses| -                                   | Fetch Unread NPS Responses                   |                                                                                                        |
| Fetch Unread NPS Responses    | Gmail                 | Fetches unread NPS response emails from Gmail    | Trigger: Check Responses Weekly     | Parse NPS Score from Email                    | 📬 Fetch Unread NPS Responses - weekly fetch of unread response emails                                |
| Parse NPS Score from Email    | Code                  | Extracts NPS score, client info, feedback from email | Fetch Unread NPS Responses          | Route by Score (Promoter vs Detractor)       | 🔎 Parse NPS Score from Email - extracts and categorizes responses                                    |
| Route by Score (Promoter vs Detractor) | If              | Routes responses based on score                    | Parse NPS Score from Email           | Log Positive Feedback in Notion, Create Support Ticket in Notion | 🎯 Route Based on Score - branches for positive and detractor responses                               |
| Log Positive Feedback in Notion| Notion               | Logs promoter/passive feedback in Notion          | Route by Score (Promoter vs Detractor) | Send Thank You & Review Request              | ⭐ Positive Feedback - log and thank positive clients                                                 |
| Send Thank You & Review Request| Gmail                | Sends thank you and review request email          | Log Positive Feedback in Notion     | -                                          |                                                                                                        |
| Create Support Ticket in Notion| Notion                | Creates support ticket for detractors              | Route by Score (Promoter vs Detractor) | Alert Team - Low Score                        | 🚨 Handle Low Scores - support ticket creation and alert                                             |
| Alert Team - Low Score        | Gmail                 | Sends urgent email alert to support team          | Create Support Ticket in Notion     | -                                          |                                                                                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger Node** called "Trigger: Check Every Hour"  
   - Set to trigger every hour (interval: 1 hour).

2. **Add a GoHighLevel Node** named "Get Won Opportunities from GHL"  
   - Resource: "opportunity"  
   - Operation: "getAll"  
   - Filter: status = "won"  
   - Credentials: Use OAuth2 credentials for GoHighLevel.

3. **Add a Code Node** named "Filter Unsurveyed Completed Deals"  
   - Paste the provided JavaScript code that:  
     - Filters deals with status "won"  
     - Checks custom field `nps_survey_sent` is false or missing  
     - Ensures client email exists  
     - Outputs simplified deal info for valid deals or a message if none.

4. **Add an If Node** named "Check if Valid Deals Exist"  
   - Condition: `$json.hasDeals` is true (boolean)  
   - True branch proceeds to send email; False branch ends workflow.

5. **Add a Gmail Node** named "Send NPS Survey Email"  
   - OAuth2 Credentials for Gmail required.  
   - Configure to send to `{{$json.clientEmail}}`  
   - Subject: "We'd love your feedback! 🌟"  
   - Message: Use the provided rich HTML template including:  
     - Client name, company, deal value, deal ID interpolated  
     - Rating scale 0-10 as mailto links pre-filling response emails.

6. **Connect "Send NPS Survey Email" to an HTTP Request Node** named "Update GHL - Mark Survey Sent"  
   - Method: PUT  
   - URL: `https://services.leadconnectorhq.com/opportunities/{{$json.dealId}}`  
   - Headers: Authorization with `Bearer {{$env.GHL_API_TOKEN}}`, Accept `application/json`, Version `2021-07-28`  
   - JSON Body: Set `nps_survey_sent` = true, `nps_sent_date` = current ISO timestamp  
   - Configure error handling to continue on error.

7. **For Response Processing, create a Schedule Trigger Node** named "Trigger: Check Responses Weekly"  
   - Set to trigger weekly on Monday at 8:00 AM.

8. **Add a Gmail Node** named "Fetch Unread NPS Responses"  
   - OAuth2 Gmail credentials  
   - Filter: readStatus = unread  
   - Resource: thread

9. **Add a Code Node** named "Parse NPS Score from Email"  
   - Paste the provided JavaScript code to parse NPS score, client name/email, deal ID, feedback, and classify category.

10. **Add an If Node** named "Route by Score (Promoter vs Detractor)"  
    - Condition: `$json.npsScore > 7` (number comparison)  
    - True branch for Promoters/Passives; False branch for Detractors.

11. **On True Branch, add a Notion Node** named "Log Positive Feedback in Notion"  
    - Resource: databasePage  
    - Database ID: Set to your Notion NPS feedback database  
    - Map properties: Client name, email, category, NPS score, email subject  
    - Notion OAuth2 credentials required.

12. **Connect "Log Positive Feedback in Notion" to a Gmail Node** named "Send Thank You & Review Request"  
    - OAuth2 Gmail credentials  
    - Send to client email with personalized thank-you HTML message including NPS score and review link.

13. **On False Branch, add a Notion Node** named "Create Support Ticket in Notion"  
    - Resource: databasePage  
    - Database ID: Same or different Notion database for support tickets  
    - Map properties with client info and feedback  
    - Notion OAuth2 credentials required.

14. **Connect "Create Support Ticket in Notion" to a Gmail Node** named "Alert Team - Low Score"  
    - Send to support team email address from environment variable `SUPPORT_TEAM_EMAIL`  
    - Email with urgent alert HTML template including client details and feedback.

15. **Connect all nodes as per logical flow:**  
    - Hourly trigger → GHL won deals → Filter → If valid → Send email → Update GHL  
    - Weekly trigger → Fetch unread responses → Parse email → Route by score → Log/send thank you or create ticket/alert

16. **Set Environment Variables:**  
    - `GHL_API_TOKEN`: API token for GoHighLevel requests  
    - `SENDER_EMAIL`: Email address used in mailto links and sending emails  
    - `SUPPORT_TEAM_EMAIL`: Support team email for alerts

17. **Validate all OAuth2 credentials** for GoHighLevel, Gmail, and Notion connections.

---

### 5. General Notes & Resources

| Note Content                                                                                                       | Context or Link                                                                                  |
|--------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| The workflow requires GoHighLevel custom fields: `nps_survey_sent` (boolean) and `nps_sent_date` (date) to function correctly. | Setup in GoHighLevel CRM custom fields                                                         |
| The NPS survey email uses mailto links to simplify response collection via email clients. This is a workaround to avoid complex form hosting. | Email survey design strategy                                                                    |
| Notion database IDs must be configured specifically for your workspace and NPS/support ticket databases.            | Adjust Notion database IDs in Notion nodes                                                     |
| Gmail OAuth2 authentication must allow sending and reading emails with appropriate scopes.                         | Gmail OAuth2 setup with scopes: Gmail Send, Gmail Read                                         |
| The workflow uses environment variables for API tokens and email addresses to keep sensitive data secure.          | Use n8n environment variables for sensitive info                                               |
| For detailed NPS best practices, consider segmenting Passive (7-8) responses separately for tailored follow-up.    | Business logic enhancement suggestion                                                         |

---

**Disclaimer:**  
The provided information is extracted exclusively from an automated n8n workflow. It complies strictly with all content policies and contains no illegal, offensive, or protected elements. All processed data is legal and public.