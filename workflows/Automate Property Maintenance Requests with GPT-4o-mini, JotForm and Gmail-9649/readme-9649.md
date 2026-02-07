Automate Property Maintenance Requests with GPT-4o-mini, JotForm and Gmail

https://n8nworkflows.xyz/workflows/automate-property-maintenance-requests-with-gpt-4o-mini--jotform-and-gmail-9649


# Automate Property Maintenance Requests with GPT-4o-mini, JotForm and Gmail

### 1. Workflow Overview

This workflow automates the processing of property maintenance requests submitted via JotForm, leveraging advanced AI analysis (GPT-4o-mini) to categorize, prioritize, and route each request efficiently. It targets property managers who need to streamline tenant maintenance communications, assign the right contractors, and maintain logs for tracking and analytics.

**Logical blocks:**

- **1.1 Input Reception:** Captures maintenance request submissions from tenants via JotForm.
- **1.2 Data Parsing:** Normalizes and structures the raw form data into a standardized request object.
- **1.3 AI Maintenance Analysis:** Uses a LangChain AI agent powered by GPT-4o-mini to analyze the request, categorize the issue, assess urgency, recommend vendors, estimate costs, and provide detailed instructions.
- **1.4 AI Response Processing and Data Fusion:** Extracts AI output, merges it with request data, assigns contractors from a predefined database, and generates work order metadata.
- **1.5 Routing Decision:** Determines if the request is emergency priority and routes accordingly.
- **1.6 Contractor Notification:** Sends either an emergency or standard work order email to the assigned contractor.
- **1.7 Tenant Confirmation:** Sends a confirmation email to the tenant summarizing the request and AI insights.
- **1.8 Logging:** Records request and recurring issue details into Google Sheets for tracking and future analytics.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
Captures new maintenance requests submitted by tenants via a JotForm form webhook.

- **Nodes Involved:**  
  - JotForm Trigger

- **Node Details:**  
  - **JotForm Trigger:**  
    - Type: Trigger node specific to JotForm integration.  
    - Configuration: Listens for submissions to a specific form (ID: 252864531445460).  
    - Credentials: Authenticated with JotForm API account.  
    - Inputs: None (triggered by form submission).  
    - Outputs: Raw form submission data including tenant info, issue description, urgency, photos, and access instructions.  
    - Failure modes: API rate limits, webhook misconfiguration, form field changes causing missing data.  
    - Notes: Requires the JotForm form to have specific fields for tenant name, email, phone, unit number, property address, issue description, urgency, photo upload, access instructions, and preferred contact method.

#### 2.2 Data Parsing

- **Overview:**  
Normalizes and standardizes the incoming form data into a single JSON object with consistent field names and generates a unique request ID.

- **Nodes Involved:**  
  - Parse Request Data (Code node)

- **Node Details:**  
  - **Parse Request Data:**  
    - Type: Code node (JavaScript).  
    - Configuration: Extracts fields from multiple possible keys (to handle different form versions), assigns default values where necessary, and generates a timestamp and status.  
    - Key variables: `requestId`, `tenantName`, `tenantEmail`, `tenantPhone`, `unitNumber`, `propertyAddress`, `issueDescription`, `urgencyLevel`, `photoUrl`, `accessInstructions`, `preferredContactMethod`, `submittedAt`, `status`.  
    - Inputs: Raw form submission JSON from JotForm Trigger.  
    - Outputs: Standardized maintenance request object.  
    - Failure modes: Missing fields, unexpected data structures, code exceptions.  
    - Notes: Generates requestId from submissionID or timestamp fallback.

#### 2.3 AI Maintenance Analysis

- **Overview:**  
Uses AI to analyze and categorize the maintenance request, assess priority and complexity, recommend vendors, estimate costs, and generate communication templates and safety/legal flags.

- **Nodes Involved:**  
  - OpenAI Chat Model (GPT-4o-mini)  
  - AI Maintenance Analysis (LangChain agent node)

- **Node Details:**  
  - **OpenAI Chat Model:**  
    - Type: LangChain LM Chat node using GPT-4o-mini.  
    - Configuration: Model set to "gpt-4.1-mini", no extra options.  
    - Inputs: None directly, but connects as language model for the AI Maintenance Analysis node.  
    - Outputs: AI-generated text response.  
    - Requires valid OpenAI API credentials.  
    - Failure modes: API errors, rate limits, invalid model name, network issues.  

  - **AI Maintenance Analysis:**  
    - Type: LangChain agent node (advanced AI prompt).  
    - Configuration: Prompt instructs expert property maintenance analyst to analyze input fields and produce detailed JSON analysis including category, priority, complexity, vendor recommendations, costs, tenant communication, safety, recurring issues, contractor instructions, and legal compliance.  
    - Uses system message to define expert role.  
    - Input expressions embed standardized request data.  
    - Outputs parsed JSON analysis.  
    - Failure modes: AI response parsing errors, incomplete or malformed AI output.

#### 2.4 AI Response Processing and Data Fusion

- **Overview:**  
Extracts AI JSON response, merges it with the original request data, selects contractor contact details from a database, generates work order metadata, and calculates priority numeric scores.

- **Nodes Involved:**  
  - Extract AI Response (Set node)  
  - Merge AI Analysis (Code node)

- **Node Details:**  
  - **Extract AI Response:**  
    - Type: Set node.  
    - Configuration: Assigns AI agent output text to a new field `aiAnalysis`.  
    - Inputs: AI Maintenance Analysis output.  
    - Outputs: JSON with raw AI response string.  
    - Failure modes: None notable (simple assignment).  

  - **Merge AI Analysis:**  
    - Type: Code node (JavaScript).  
    - Configuration: Parses AI JSON; falls back to default values if parsing fails. Merges AI insights with request data. Selects contractor contacts from a predefined database by vendor type. Generates work order number and priority ranking.  
    - Input: JSON with `aiAnalysis` string and original request data.  
    - Output: Enriched JSON with AI fields, contractor info, priority numeric value, and summary.  
    - Failure modes: JSON parse errors, missing contractor type fallback, date/time conversion errors.  
    - Notes: Contractor database hardcoded in node; covers plumber, electrician, HVAC, handyman, locksmith, pest control, general contractor.

#### 2.5 Routing Decision

- **Overview:**  
Determines whether the maintenance request is an emergency and routes the workflow accordingly.

- **Nodes Involved:**  
  - Is Emergency? (If node)

- **Node Details:**  
  - **Is Emergency?:**  
    - Type: If node.  
    - Configuration: Checks if `finalPriority` from merged data equals "emergency".  
    - Inputs: Merged AI analysis data.  
    - Outputs: Two branches — True (emergency) and False (non-emergency).  
    - Failure modes: Missing or malformed priority field.

#### 2.6 Contractor Notification

- **Overview:**  
Sends an email to the assigned contractor with either an emergency or standard work order, including all relevant tenant, property, AI analysis, and safety information.

- **Nodes Involved:**  
  - Emergency Email to Contractor (Gmail node)  
  - Standard Email to Contractor (Gmail node)

- **Node Details:**  
  - **Emergency Email to Contractor:**  
    - Type: Gmail node.  
    - Configuration: Sends an urgent work order email with "EMERGENCY" priority, safety warnings, legal compliance alerts, direct phone contact, and immediate response request.  
    - Email fields dynamically populated using workflow expressions from merged data.  
    - Credentials: Gmail OAuth2 account configured.  
    - Failure modes: Gmail API errors, invalid email addresses, missing fields.  
    - Notes: Subject line includes "EMERGENCY WORK ORDER" and work order number.

  - **Standard Email to Contractor:**  
    - Type: Gmail node.  
    - Configuration: Sends a detailed standard work order email including AI insights, cost estimates, preventive recommendations, warranty and recurring issue alerts.  
    - Credentials: Gmail OAuth2 account.  
    - Failure modes: Same as emergency email.

#### 2.7 Tenant Confirmation

- **Overview:**  
Sends a professional acknowledgment email to the tenant confirming receipt, summarizing AI analysis, contractor assignment, and next steps.

- **Nodes Involved:**  
  - Send Tenant Confirmation (Gmail node)

- **Node Details:**  
  - **Send Tenant Confirmation:**  
    - Type: Gmail node.  
    - Configuration: Sends email to tenant email captured from JotForm trigger.  
    - Message includes request ID, priority, AI summary, assigned contractor, estimated resolution, temporary solutions, safety notices, habitability alerts, emergency contacts, photo acknowledgment, update schedule, and recurring issue notes if applicable.  
    - Credentials: Gmail OAuth2 account.  
    - Inputs: Outputs from either contractor email node (emergency or standard).  
    - Failure modes: Email delivery failures, missing tenant email, expression evaluation errors.

#### 2.8 Logging

- **Overview:**  
Logs maintenance request details and recurring issue data into Google Sheets for tracking, pattern analysis, reporting, and integration with analytics tools.

- **Nodes Involved:**  
  - Log to Google Sheets  
  - Track Recurring Issues (Google Sheets nodes)

- **Node Details:**  
  - **Log to Google Sheets:**  
    - Type: Google Sheets node.  
    - Operation: Append or update row in "Sheet1" of a specified Google Sheet document.  
    - Maps tenant and maintenance request fields to sheet columns including photo URL, tenant name, unit, issue description, urgency, and contact info.  
    - Matches existing rows by tenant email to update or insert.  
    - Credentials: Google Sheets OAuth2 account.  
    - Failure modes: API permission errors, sheet not found, data mapping errors.  

  - **Track Recurring Issues:**  
    - Type: Google Sheets node.  
    - Operation: Append or update row in "Recurring issue" sheet by matching unit number and issue category.  
    - Purpose: Track issue recurrence patterns for future preventive maintenance insights.  
    - Credentials: Google Sheets OAuth2 account.  
    - Failure modes: Same as above.

---

### 3. Summary Table

| Node Name                 | Node Type                         | Functional Role                  | Input Node(s)                 | Output Node(s)                | Sticky Note                                                                                              |
|---------------------------|----------------------------------|--------------------------------|------------------------------|------------------------------|--------------------------------------------------------------------------------------------------------|
| JotForm Trigger           | JotForm Trigger                  | Capture tenant maintenance form | None                         | Parse Request Data            | 📩 **TRIGGER: Maintenance Request** Captures tenant requests with required fields and form setup link. |
| Parse Request Data        | Code                            | Normalize and structure data    | JotForm Trigger              | AI Maintenance Analysis       | 🧾 **PARSE REQUEST DATA** Normalizes and standardizes request data, generates unique ID.               |
| OpenAI Chat Model         | LangChain LM Chat (OpenAI GPT)  | Provide AI language model       | None (used by AI Maintenance Analysis) | AI Maintenance Analysis       | 🤖 **AI MAINTENANCE ANALYSIS** AI categorizes, prioritizes, recommends, estimates cost, and advises.   |
| AI Maintenance Analysis   | LangChain Agent                 | Analyze maintenance request     | Parse Request Data           | Extract AI Response           | 🤖 **AI MAINTENANCE ANALYSIS** (continued)                                                              |
| Extract AI Response       | Set                            | Extract AI JSON response text   | AI Maintenance Analysis     | Merge AI Analysis             | 🔗 **EXTRACT AI RESPONSE** Extracts structured JSON from AI output.                                    |
| Merge AI Analysis         | Code                           | Merge AI and request data       | Extract AI Response          | Is Emergency?                 | 🧩 **MERGE AI ANALYSIS** Combines request and AI insights, assigns contractor, creates work order.     |
| Is Emergency?             | If                             | Check for emergency priority    | Merge AI Analysis            | Emergency Email to Contractor (true), Standard Email to Contractor (false) | ⚡ **EMERGENCY ROUTING** Routes emergency or standard emails accordingly.                             |
| Emergency Email to Contractor | Gmail                         | Send emergency email to contractor | Is Emergency? (true)          | Send Tenant Confirmation      | 📧 **CONTRACTOR DISPATCH** Emergency email with immediate attention and safety/legal notes.            |
| Standard Email to Contractor | Gmail                         | Send standard work order email  | Is Emergency? (false)         | Send Tenant Confirmation      | 📧 **CONTRACTOR DISPATCH** Standard email with AI insights, instructions, and preventive notes.       |
| Send Tenant Confirmation  | Gmail                          | Confirm receipt to tenant       | Emergency Email to Contractor, Standard Email to Contractor | Log to Google Sheets, Track Recurring Issues | ✉️ **TENANT CONFIRMATION** Professional acknowledgment with dynamic emergency and safety messaging.    |
| Log to Google Sheets      | Google Sheets                  | Log maintenance request data    | Send Tenant Confirmation     | None                         | 📊 **GOOGLE SHEETS LOGGING** Logs all requests with details for tracking and analytics.                 |
| Track Recurring Issues    | Google Sheets                  | Track recurring maintenance issues | Send Tenant Confirmation     | None                         | 📊 **GOOGLE SHEETS LOGGING** Tracks recurring issues for preventive maintenance insights.              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create JotForm Form:**  
   - Fields: Tenant Name (text), Tenant Email (email), Tenant Phone (phone), Unit Number (text), Property Address (address), Issue Description (long text), Urgency Level (dropdown: emergency, urgent, normal), Photo Upload (file), Access Instructions (textarea), Preferred Contact Method (dropdown/email/phone).  
   - Publish form and note form ID.

2. **Add JotForm Trigger node:**  
   - Type: JotForm Trigger  
   - Configure webhook on your n8n instance with form ID from step 1.  
   - Credentials: Connect your JotForm account.

3. **Add Code node "Parse Request Data":**  
   - Paste provided JavaScript to normalize incoming form data fields to consistent keys.  
   - Generate unique request ID if missing; add timestamp and status fields.

4. **Add OpenAI Chat Model node:**  
   - Type: LangChain LM Chat OpenAI node  
   - Select model "gpt-4.1-mini" (or equivalent GPT-4o-mini).  
   - Configure OpenAI API credentials.

5. **Add AI Maintenance Analysis node (LangChain agent):**  
   - Set prompt as per detailed instructions to analyze maintenance request and output JSON with categories, priority, vendor, cost, safety, legal, communication, etc.  
   - Connect OpenAI Chat Model node as language model input.  
   - Use expressions to inject parsed request data fields.  
   - Enable output parsing to JSON.

6. **Add Set node "Extract AI Response":**  
   - Assign AI agent output JSON string to a field `aiAnalysis`.

7. **Add Code node "Merge AI Analysis":**  
   - Paste provided JavaScript to parse AI response, handle parsing errors with defaults, merge with request data, select contractor from hardcoded database, generate work order number, assign priority numeric score, and create AI summary.  
   - Input: output from Extract AI Response node.

8. **Add If node "Is Emergency?":**  
   - Condition: Check if `finalPriority` equals "emergency".  
   - Outputs: True (emergency branch), False (standard branch).

9. **Add Gmail node "Emergency Email to Contractor":**  
   - Set recipient to contractor email from merged data.  
   - Compose emergency email using expressions to include work order, property, tenant, AI analysis, safety, legal, and access info.  
   - Subject includes "EMERGENCY WORK ORDER".  
   - Configure Gmail OAuth2 credentials.

10. **Add Gmail node "Standard Email to Contractor":**  
    - Set recipient to contractor email.  
    - Compose detailed standard work order email with AI insights, cost estimates, preventive notes, warranty, recurring alerts.  
    - Configure Gmail OAuth2 credentials.

11. **Connect Emergency Email and Standard Email outputs to next node.**

12. **Add Gmail node "Send Tenant Confirmation":**  
    - Send to tenant email from JotForm data.  
    - Compose confirmation email summarizing request ID, priority, AI summary, assigned contractor, estimated resolution, safety notices, emergency contact, and update schedule.  
    - Use dynamic content expressions for conditional warnings and temporary solutions.  
    - Configure Gmail OAuth2 credentials.

13. **Add Google Sheets node "Log to Google Sheets":**  
    - Operation: Append or update row in main request log sheet.  
    - Map columns such as tenant name, unit, email, phone, urgency, issue description, access instructions, preferred contact method, photo URL.  
    - Use tenant email as matching key.  
    - Configure Google Sheets OAuth2 credentials.

14. **Add Google Sheets node "Track Recurring Issues":**  
    - Operation: Append or update row in recurring issue sheet.  
    - Match rows by unit number and issue category.  
    - Map relevant fields for pattern tracking.  
    - Configure Google Sheets OAuth2 credentials.

15. **Connect Send Tenant Confirmation output to both Google Sheets nodes.**

16. **Link all nodes following the described connections:**  
    - JotForm Trigger → Parse Request Data → AI Maintenance Analysis → Extract AI Response → Merge AI Analysis → Is Emergency? → Emergency Email or Standard Email → Send Tenant Confirmation → Log to Google Sheets & Track Recurring Issues.

17. **Test workflow end-to-end:**  
    - Submit test maintenance requests via JotForm form.  
    - Verify AI analysis results, email dispatches, tenant confirmations, and spreadsheet logging.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                     | Context or Link                                           |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------|
| JotForm form creation and integration details available at [JotForm](https://www.jotform.com/?partner=mediajade).                                               | Trigger setup instructions                                |
| AI analysis uses GPT-4o-mini via LangChain agent for robust categorization and prioritization.                                                                  | AI model and prompt design                                |
| Contractor database is hardcoded in the workflow code node for easy customization to local service providers.                                                   | Contractor routing logic                                  |
| Google Sheets logging designed for analytics integration, compatible with Google Data Studio dashboards.                                                      | Analytics and reporting setup                             |
| Emergency emails highlight safety, legal compliance, and require immediate ETA response from contractors, improving tenant safety and compliance.               | Emergency management best practices                       |
| Tenant confirmation email dynamically adapts messages based on priority and safety flags, improving tenant trust and transparency.                             | Tenant communication strategy                             |

---

This documentation fully describes the workflow structure, nodes, logic, and configurations. It enables both technical users and AI agents to understand, reproduce, and maintain the workflow with confidence.