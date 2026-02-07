Automate Employee Offboarding with GPT-4 Analysis & JotForm Exit Interviews

https://n8nworkflows.xyz/workflows/automate-employee-offboarding-with-gpt-4-analysis---jotform-exit-interviews-9697


# Automate Employee Offboarding with GPT-4 Analysis & JotForm Exit Interviews

### 1. Workflow Overview

This workflow automates the employee offboarding process by integrating exit interview data captured via JotForm with AI-powered analysis using GPT-4. The goal is to streamline organizational knowledge transfer, identify retention risks, flag critical HR issues, and trigger appropriate notifications to involved parties including the departing employee, manager, IT, and HR.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Captures employee offboarding and exit interview data submitted through a JotForm.
- **1.2 Data Parsing and Normalization:** Processes raw form data to unify field names and formats for downstream use.
- **1.3 AI Exit Interview Analysis:** Uses a GPT-4 based LangChain agent to analyze qualitative feedback and ratings, producing a structured JSON with retention insights, sentiment analysis, and risk factors.
- **1.4 AI Output Extraction and Merging:** Parses AI-generated JSON analysis, merges it with normalized offboarding data, and calculates additional metrics such as days until last working day and equipment lists.
- **1.5 Red Flags Detection and Handling:** Evaluates if the AI analysis indicates critical red flags and routes the workflow accordingly.
- **1.6 Multi-Recipient Notifications:** Sends tailored emails to the employee (offboarding checklist), manager (action items), IT department (access revocation), and HR (urgent red flag alerts).
- **1.7 Logging and Audit:** Appends or updates the offboarding record with AI insights in a Google Sheets document for audit and analytics purposes.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** Listens for new submissions on a specific JotForm used to collect offboarding and exit interview data.
- **Nodes Involved:** `Jotform Trigger`
- **Node Details:**
  - Type: JotForm Trigger
  - Configuration: Triggered by form ID `252852702090453`
  - Inputs: Form submission data
  - Outputs: Raw JSON data containing employee and exit interview fields
  - Edge Cases: Incorrect or incomplete form data; webhook issues; JotForm API downtime

#### 2.2 Data Parsing and Normalization

- **Overview:** Transforms raw form data into a consistent internal schema with normalized field names and default fallbacks.
- **Nodes Involved:** `Parse Offboarding Data`
- **Node Details:**
  - Type: Code Node (JavaScript)
  - Configuration: Extracts form data fields, applies fallback values, and formats dates
  - Expressions: Uses `$input.first().json` to access form data; constructs a unified JSON object
  - Inputs: Raw form data from `Jotform Trigger`
  - Outputs: Normalized offboarding JSON with fields like `employeeName`, `lastWorkingDay`, `hasLaptop`, etc.
  - Edge Cases: Missing or malformed fields; date parsing errors

#### 2.3 AI Exit Interview Analysis

- **Overview:** Sends structured exit interview details and ratings to a GPT-4 powered LangChain agent, which returns a comprehensive JSON analysis including retention risks, sentiment, management performance, and recommendations.
- **Nodes Involved:** `AI Exit Interview Analysis`
- **Node Details:**
  - Type: LangChain Agent Node (OpenAI GPT-4)
  - Configuration:
    - System prompt sets expert HR analyst role
    - Input text template with embedded offboarding data fields
    - Output is parsed JSON structure with detailed HR insights
  - Inputs: Normalized offboarding data from `Parse Offboarding Data`
  - Outputs: AI-generated JSON string with structured analysis
  - Version-specific: Requires LangChain integration and GPT-4 API credentials
  - Edge Cases: API rate limits, malformed AI JSON output, network errors

#### 2.4 AI Output Extraction and Merging

- **Overview:** Parses the AI JSON output safely, applies default fallback analysis if parsing fails, calculates days until last working day, compiles equipment lists, and merges all into a rich offboarding data object.
- **Nodes Involved:** `Extract AI Analysis`, `Merge Exit Analysis`
- **Node Details:**
  - `Extract AI Analysis`:
    - Type: Set Node
    - Assigns AI raw output string to `aiAnalysis` property
  - `Merge Exit Analysis`:
    - Type: Code Node
    - Parses `aiAnalysis` JSON, with try-catch fallback defaults
    - Calculates numeric fields like `daysUntilLastDay`
    - Constructs equipment inventory array based on yes/no flags
    - Merges AI insights fields into offboarding JSON for downstream use
  - Inputs: AI raw output from `AI Exit Interview Analysis`
  - Outputs: Enriched offboarding JSON with combined AI and original data
  - Edge Cases: JSON parse errors, missing fields, date calculation inaccuracies

#### 2.5 Red Flags Detection and Handling

- **Overview:** Checks if the AI analysis indicates any red flags requiring urgent HR/legal attention, routing workflow to alert or normal notification paths.
- **Nodes Involved:** `Has Red Flags?`
- **Node Details:**
  - Type: If Node
  - Condition: `$json.hasRedFlags === true`
  - Inputs: Merged offboarding data with AI insights
  - Outputs: Branches to either red flag alert emails or standard manager notifications
  - Edge Cases: Missing or malformed flag data

#### 2.6 Multi-Recipient Notifications

- **Overview:** Sends customized emails to various stakeholders with relevant offboarding information and action items.
- **Nodes Involved:** `Send Red Flag Alert`, `Send Manager Action Items`, `Send Employee Checklist`, `Send IT Offboarding`
- **Node Details:**

  - `Send Red Flag Alert`:
    - Type: Gmail Node
    - Sends urgent alert to HR Director
    - Includes employee details, flagged issues, AI summary, and critical actions
    - Triggered only if red flags exist
    - Credentials: Gmail OAuth2

  - `Send Manager Action Items`:
    - Type: Gmail Node
    - Sends manager personalized action list including AI insights, knowledge transfer risk, and retention recommendations
    - Includes urgency warning if last day is near
    - Credentials: Gmail OAuth2

  - `Send Employee Checklist`:
    - Type: Gmail Node
    - Sends departing employee a checklist for equipment return, knowledge transfer, and access deactivation
    - Uses employee’s email from JotForm submission
    - Credentials: Gmail OAuth2

  - `Send IT Offboarding`:
    - Type: Gmail Node
    - Sends IT department offboarding tasks including access revocation and equipment recovery
    - Includes urgency warning if last day is within one week
    - Credentials: Gmail OAuth2

- Edge Cases: Email delivery failures, invalid email addresses, credential expiration

#### 2.7 Logging and Audit

- **Overview:** Appends or updates the offboarding record in a Google Sheets spreadsheet, capturing all data and AI analysis for reporting and audit.
- **Nodes Involved:** `Log to Google Sheets`
- **Node Details:**
  - Type: Google Sheets Node
  - Operation: Append or Update with matching on unique `id` field
  - Sheet: Specified by document ID and sheet gid for Employee Onboarding
  - Inputs: Fully merged offboarding and AI data
  - Credentials: Google Sheets OAuth2
  - Edge Cases: API quota errors, permission issues, sheet schema mismatches

---

### 3. Summary Table

| Node Name               | Node Type                          | Functional Role                         | Input Node(s)           | Output Node(s)             | Sticky Note                                                                                             |
|-------------------------|----------------------------------|---------------------------------------|------------------------|----------------------------|-------------------------------------------------------------------------------------------------------|
| Jotform Trigger         | JotForm Trigger                  | Capture offboarding form submissions  | -                      | Parse Offboarding Data      | 📩 **TRIGGER** Captures resignation and exit interview data via Jotform Create your form for free on [Jotform using this link](https://www.jotform.com/?partner=mediajade) |
| Parse Offboarding Data  | Code Node                       | Normalize raw form data                | Jotform Trigger        | AI Exit Interview Analysis  | 🧾 **PARSE** Normalizes all offboarding data                                                          |
| AI Exit Interview Analysis | LangChain Agent Node (GPT-4)    | Analyze exit interview with AI         | Parse Offboarding Data  | Extract AI Analysis         | 🤖 **AI ANALYSIS** Analyzes exit interview for retention insights, red flags, and trends              |
| Extract AI Analysis      | Set Node                       | Extract AI JSON output                  | AI Exit Interview Analysis | Merge Exit Analysis         | 🔗 **EXTRACT** Extracts structured JSON from AI                                                        |
| Merge Exit Analysis      | Code Node                     | Merge AI insights with offboarding data | Extract AI Analysis     | Has Red Flags?              | 🧩 **MERGE** Combines AI insights with offboarding data and calculates metrics                        |
| Has Red Flags?           | If Node                        | Check for critical red flags           | Merge Exit Analysis     | Send Red Flag Alert, Send Manager Action Items | ⚠️ **RED FLAG CHECK** Routes serious issues to HR/Legal immediately                                   |
| Send Red Flag Alert      | Gmail Node                    | Send urgent alert to HR for red flags  | Has Red Flags? (true)  | Send Manager Action Items   | 📧 **NOTIFICATIONS** Sends automated emails to employee, manager, IT, HR                              |
| Send Manager Action Items | Gmail Node                    | Notify manager of action items          | Has Red Flags?, Send Red Flag Alert | Send Employee Checklist     | 📧 **NOTIFICATIONS** Sends automated emails to employee, manager, IT, HR                              |
| Send Employee Checklist  | Gmail Node                    | Send offboarding checklist to employee | Send Manager Action Items | Send IT Offboarding         | 📧 **NOTIFICATIONS** Sends automated emails to employee, manager, IT, HR                              |
| Send IT Offboarding      | Gmail Node                    | Notify IT of offboarding tasks          | Send Employee Checklist | Log to Google Sheets        | 📧 **NOTIFICATIONS** Sends automated emails to employee, manager, IT, HR                              |
| Log to Google Sheets     | Google Sheets Node            | Log offboarding data and AI insights   | Send IT Offboarding     | -                          | 📊 **LOGGING** Complete audit trail with AI insights for retention analytics                          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n.**

2. **Add a JotForm Trigger node:**
   - Set the node to listen for submissions on your offboarding exit interview form.
   - Configure webhook and credentials with your JotForm API key.
   - Use the form ID corresponding to your exit interview form.

3. **Add a Code Node named "Parse Offboarding Data":**
   - Connect input from `Jotform Trigger`.
   - Paste the provided JavaScript code to normalize and unify form fields.
   - Ensure all fallback defaults are included.
   - Output a single JSON object with standardized offboarding fields.

4. **Add a LangChain Agent Node named "AI Exit Interview Analysis":**
   - Connect input from `Parse Offboarding Data`.
   - Configure to use GPT-4 model (requires OpenAI API credentials).
   - Set system prompt defining expert HR analyst role.
   - Set prompt template to inject parsed offboarding data fields.
   - Enable output parsing to receive structured JSON from AI.

5. **Add a Set Node "Extract AI Analysis":**
   - Connect input from `AI Exit Interview Analysis`.
   - Assign AI raw output (string) to a new field `aiAnalysis`.

6. **Add a Code Node "Merge Exit Analysis":**
   - Connect input from `Extract AI Analysis`.
   - Paste the provided JavaScript to:
     - Safely parse AI output JSON, fallback to default if fails
     - Calculate days until last working day
     - Compile equipment list array
     - Merge AI insights into offboarding data
   - Output a rich JSON object with merged data.

7. **Add an If Node "Has Red Flags?":**
   - Connect input from `Merge Exit Analysis`.
   - Condition: Check if `hasRedFlags` is true.
   - Branch into true and false outputs.

8. **Add Gmail Node "Send Red Flag Alert":**
   - Connect true output from `Has Red Flags?`.
   - Configure recipient as HR Director email.
   - Use the detailed email template including flagged issues and AI summary.
   - Set Gmail OAuth2 credentials.

9. **Add Gmail Node "Send Manager Action Items":**
   - Connect false output from `Has Red Flags?` or from `Send Red Flag Alert` (to proceed with manager notification).
   - Configure recipient as employee’s manager email.
   - Include AI insights and action items in email body.
   - Set Gmail OAuth2 credentials.

10. **Add Gmail Node "Send Employee Checklist":**
    - Connect input from `Send Manager Action Items`.
    - Configure recipient as employee email.
    - Include checklist for equipment return, knowledge transfer, and final pay.
    - Set Gmail OAuth2 credentials.

11. **Add Gmail Node "Send IT Offboarding":**
    - Connect input from `Send Employee Checklist`.
    - Configure recipient as IT department email.
    - Include access revocation and equipment recovery tasks.
    - Set Gmail OAuth2 credentials.

12. **Add Google Sheets Node "Log to Google Sheets":**
    - Connect input from `Send IT Offboarding`.
    - Configure to append or update offboarding records in the specified Google Sheet.
    - Map all relevant fields from merged offboarding and AI data.
    - Set Google Sheets OAuth2 credentials.

13. **Add Sticky Notes as needed to document workflow structure and provide instructions.**

---

### 5. General Notes & Resources

| Note Content                                                                                                     | Context or Link                                                                                           |
|-----------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| 📩 **TRIGGER** Captures resignation and exit interview data via Jotform. Create your form for free on Jotform. | [Jotform Signup and Form Creation](https://www.jotform.com/?partner=mediajade)                           |
| Workflow uses GPT-4 via LangChain integration for advanced HR analytics. Requires OpenAI API key with GPT-4 access. | OpenAI API documentation at https://platform.openai.com/docs/models/gpt-4                               |
| Gmail OAuth2 credentials must be configured with appropriate scopes for sending emails on behalf of HR and IT. | Google API Console: https://console.cloud.google.com/apis/credentials                                   |
| Google Sheets node requires OAuth2 credentials with edit access to the target spreadsheet used for logging.    | Documentation: https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googlesheets/           |
| This workflow assumes the existence of a detailed exit interview form capturing multiple fields for analysis.  | Form design best practices: https://www.jotform.com/help/creating-effective-surveys/                     |

---

**Disclaimer:** The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.