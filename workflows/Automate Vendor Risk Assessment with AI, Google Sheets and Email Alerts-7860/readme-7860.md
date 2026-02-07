Automate Vendor Risk Assessment with AI, Google Sheets and Email Alerts

https://n8nworkflows.xyz/workflows/automate-vendor-risk-assessment-with-ai--google-sheets-and-email-alerts-7860


# Automate Vendor Risk Assessment with AI, Google Sheets and Email Alerts

### 1. Workflow Overview

This workflow automates the Vendor Risk Assessment process by integrating AI-driven risk evaluation, certificate verification, structured scorecard formatting, logging to Google Sheets, and alerting via email. It targets organizations managing third-party vendors who require automated, consistent, and auditable risk tier assessments and notifications.

The workflow is logically divided into these blocks:

- **1.1 Input Reception:** Captures new vendor data via a webhook.
- **1.2 AI Processing:** Uses OpenAI (via LangChain integration) to estimate the vendor’s risk tier based on input data.
- **1.3 Certificate Validation:** Checks vendor certification expiry and type to influence risk evaluation.
- **1.4 Scorecard Formatting:** Structures the risk assessment results into a report-ready format.
- **1.5 Data Logging & Notification:** Logs the formatted scorecard into Google Sheets and sends an email alert to the Governance, Risk & Compliance (GRC) owner.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block receives incoming vendor data submissions via an HTTP webhook, serving as the workflow’s entry point.

- **Nodes Involved:**  
  - New Vendor Intake

- **Node Details:**  
  - **New Vendor Intake**  
    - Type: Webhook (n8n-nodes-base.webhook)  
    - Role: Entry trigger; listens for HTTP POST requests containing new vendor information.  
    - Configuration: Uses a webhook ID for URL generation; no specific filters or authentication mentioned.  
    - Inputs: Incoming HTTP request payload.  
    - Outputs: Passes vendor data to the AI Risk Tier Estimator node.  
    - Edge Cases:  
      - Missing or malformed HTTP requests may cause failures.  
      - No authentication on webhook could expose it to unauthorized calls unless protected externally.  
      - Timeout or connection errors if the webhook endpoint is not reachable.  

#### 2.2 AI Processing

- **Overview:**  
  This block processes vendor input data using an AI model to estimate the vendor’s risk tier.

- **Nodes Involved:**  
  - AI – Risk Tier Estimator

- **Node Details:**  
  - **AI – Risk Tier Estimator**  
    - Type: OpenAI node via LangChain integration (@n8n/n8n-nodes-langchain.openAi)  
    - Role: Calls OpenAI language model to analyze vendor data and output a risk tier estimation.  
    - Configuration: Parameters are not explicitly detailed, but typically include prompt templates, model selection, and API key credentials.  
    - Inputs: Vendor data from the webhook node.  
    - Outputs: AI-generated risk tier data passed to the certificate checker node.  
    - Edge Cases:  
      - API authentication errors (invalid or missing OpenAI credentials).  
      - API call rate limiting and timeouts.  
      - Unexpected AI output format causing downstream parsing issues.  
    - Version: 1.8  
    - Sub-workflow: None.

#### 2.3 Certificate Validation

- **Overview:**  
  Evaluates vendor certification expiry dates and types to adjust or verify the AI risk estimation.

- **Nodes Involved:**  
  - Cert Checker – Expiry & Type

- **Node Details:**  
  - **Cert Checker – Expiry & Type**  
    - Type: If Condition (n8n-nodes-base.if)  
    - Role: Applies conditional logic to check if vendor certificates are valid, expired, or of certain types.  
    - Configuration: Conditions are not explicitly detailed but typically involve date comparisons and string matching on certificate type fields.  
    - Inputs: AI risk estimation output.  
    - Outputs: Two output branches both connecting to the next node “Format – Vendor Scorecard” (likely representing true/false or multiple condition outcomes).  
    - Edge Cases:  
      - Missing or incorrectly formatted certificate data causing logical errors.  
      - Edge cases around certificate expiry dates (e.g., timezone differences).  
      - Logical branching must handle all possible conditions to avoid data loss.  
    - Version: 2.2

#### 2.4 Scorecard Formatting

- **Overview:**  
  Formats the combined AI and certificate validation results into a structured vendor risk scorecard.

- **Nodes Involved:**  
  - Format – Vendor Scorecard

- **Node Details:**  
  - **Format – Vendor Scorecard**  
    - Type: Set (n8n-nodes-base.set)  
    - Role: Organizes and sets output data fields for the vendor scorecard report.  
    - Configuration: Defines output variables such as risk tier, certificate status, vendor name, and other metadata.  
    - Inputs: Output from the certificate checker node (both branches converge here).  
    - Outputs: Sends the formatted data onward to Google Sheets logging and email alert nodes.  
    - Edge Cases:  
      - Missing key inputs may cause incomplete scorecards.  
      - Data type mismatches during set operations.  
    - Version: 3.4

#### 2.5 Data Logging & Notification

- **Overview:**  
  Logs the finalized vendor risk scorecard to Google Sheets and sends an alert email to the designated GRC owner.

- **Nodes Involved:**  
  - Log – Google Sheet  
  - Alert – GRC Owner Email

- **Node Details:**  
  - **Log – Google Sheet**  
    - Type: Google Sheets (n8n-nodes-base.googleSheets)  
    - Role: Appends or updates a Google Sheet with the vendor risk assessment details for audit and tracking.  
    - Configuration: Connected to a Google Sheets document and sheet, configured to write rows based on incoming data fields.  
    - Inputs: Formatted vendor scorecard.  
    - Outputs: None specified (end of branch).  
    - Edge Cases:  
      - Authentication/authorization errors with Google API.  
      - API rate limits or quota exceeded.  
      - Sheet structure changes causing mapping failures.  
    - Version: 4.6

  - **Alert – GRC Owner Email**  
    - Type: Gmail (n8n-nodes-base.gmail)  
    - Role: Sends an email notification containing the vendor risk scorecard to the GRC owner.  
    - Configuration: Uses Gmail OAuth2 credentials; email content dynamically built from scorecard data.  
    - Inputs: Formatted vendor scorecard.  
    - Outputs: None (end of branch).  
    - Edge Cases:  
      - OAuth token expiry or revocation.  
      - Email sending limits or blocking.  
      - Formatting errors in the email body.  
    - Version: 2.1

---

### 3. Summary Table

| Node Name                | Node Type                       | Functional Role                      | Input Node(s)          | Output Node(s)                      | Sticky Note                                                                                 |
|--------------------------|--------------------------------|------------------------------------|-----------------------|------------------------------------|---------------------------------------------------------------------------------------------|
| New Vendor Intake         | Webhook                        | Receives new vendor data via HTTP  | —                     | AI – Risk Tier Estimator            |                                                                                             |
| AI – Risk Tier Estimator  | OpenAI (LangChain)             | Estimates vendor risk tier via AI  | New Vendor Intake      | Cert Checker – Expiry & Type        |                                                                                             |
| Cert Checker – Expiry & Type | If Condition                  | Validates certificate expiry/type  | AI – Risk Tier Estimator| Format – Vendor Scorecard (both outputs) |                                                                                             |
| Format – Vendor Scorecard | Set                           | Formats risk scorecard report       | Cert Checker           | Log – Google Sheet, Alert – GRC Owner Email |                                                                                             |
| Log – Google Sheet        | Google Sheets                 | Logs data for audit and tracking   | Format – Vendor Scorecard | —                                  |                                                                                             |
| Alert – GRC Owner Email   | Gmail                         | Sends alert email to GRC owner     | Format – Vendor Scorecard | —                                  |                                                                                             |
| Sticky Note              | Sticky Note                   | (Empty content)                    | —                     | —                                  |                                                                                             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Webhook Node: New Vendor Intake**  
   - Type: Webhook  
   - Configuration: Set to listen on POST requests; save the generated webhook URL for external triggers.  
   - No authentication configured by default (consider security).  
   - Position: As the workflow entry point.

2. **Add AI Processing Node: AI – Risk Tier Estimator**  
   - Type: OpenAI (LangChain integration)  
   - Connect input from “New Vendor Intake”.  
   - Configure OpenAI credentials: API key with appropriate permissions.  
   - Set prompt or template to analyze vendor input and output risk tier estimation.  
   - Choose model version (e.g., GPT-4 or GPT-3.5).  
   - Position downstream of webhook.

3. **Add Conditional Node: Cert Checker – Expiry & Type**  
   - Type: If node  
   - Connect input from “AI – Risk Tier Estimator”.  
   - Configure conditions to check:  
     - Certificate expiry date is valid (e.g., expiry date > today).  
     - Certificate type matches accepted types (e.g., ISO 27001, SOC 2).  
   - Output branches: both connect to next node to ensure processing regardless of condition.

4. **Add Formatting Node: Format – Vendor Scorecard**  
   - Type: Set node  
   - Connect both outputs from the “Cert Checker” node here.  
   - Define output fields: vendor name, risk tier, certificate status, expiry dates, and any other metadata needed for reporting and logging.  
   - Position accordingly.

5. **Add Google Sheets Node: Log – Google Sheet**  
   - Type: Google Sheets node  
   - Connect input from “Format – Vendor Scorecard”.  
   - Configure Google OAuth2 credentials with access to the target spreadsheet.  
   - Set operation to append or update rows in a specific sheet representing vendor risk assessments.  
   - Map fields from scorecard data to sheet columns.

6. **Add Email Node: Alert – GRC Owner Email**  
   - Type: Gmail node  
   - Connect input from “Format – Vendor Scorecard”.  
   - Configure Gmail OAuth2 credentials for sending emails.  
   - Set email recipient to the GRC owner’s email address.  
   - Compose email subject and body dynamically using scorecard fields (e.g., vendor name and risk tier).  
   - Enable error handling for sending failures.

7. **Finalize and Test**  
   - Ensure all nodes are connected in the described sequence.  
   - Test with sample vendor data by triggering the webhook URL.  
   - Validate AI responses, conditional logic, scorecard formatting, Google Sheets logging, and email alerts.  
   - Adjust credentials and permissions as necessary.

---

### 5. General Notes & Resources

| Note Content                                                                                       | Context or Link                                         |
|--------------------------------------------------------------------------------------------------|--------------------------------------------------------|
| This workflow is part of the “Track Trust w Confidence” and “Auto Third-Party Risk” project tags. | Tags indicate organizational context and categorization. |
| Use OAuth2 credentials for Gmail and Google Sheets nodes to comply with Google API security.     | Credential setup in n8n must match Google OAuth flows. |
| Ensure the OpenAI API key has sufficient quota and permissions to prevent service interruptions.  | https://platform.openai.com/account/api-keys            |
| Consider securing the webhook endpoint with authentication or IP whitelisting in production.     | Webhook security best practices.                         |

---

**Disclaimer:**  
The text above is extracted and analyzed exclusively from an n8n automated workflow. It complies fully with content policies and contains no illegal, offensive, or protected elements. All processed data is legal and publicly accessible.