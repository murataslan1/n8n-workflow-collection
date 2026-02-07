Automate Loan Pre-Approvals with Jotform, GPT-4 Analysis & Gmail Notifications

https://n8nworkflows.xyz/workflows/automate-loan-pre-approvals-with-jotform--gpt-4-analysis---gmail-notifications-9841


# Automate Loan Pre-Approvals with Jotform, GPT-4 Analysis & Gmail Notifications

### 1. Workflow Overview

This workflow automates the loan pre-approval process from receiving application data via Jotform to delivering approval decisions and notifications through Gmail, augmented with AI financial analysis and simulated credit checks. It targets financial institutions or mortgage brokers seeking to streamline loan application assessments and communication, improving speed and accuracy.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Captures loan application submissions via Jotform.
- **1.2 Data Extraction:** Normalizes and prepares application data for processing.
- **1.3 AI Financial Analysis:** Uses an AI agent (GPT-4 based) to analyze the application and generate financial metrics and approval recommendations.
- **1.4 Credit Check Simulation:** Simulates a credit report based on application data and AI analysis.
- **1.5 Approval Decision Routing:** Determines approval status and routes to corresponding communication paths.
- **1.6 Pre-Approval Communication:** Sends approval letters and notifies underwriters.
- **1.7 Conditional/Denial Communication:** Sends conditional approval or denial letters based on decision outcome.
- **1.8 Application Tracking:** Logs application details and results to Google Sheets for tracking and auditing.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** Listens for new loan application submissions via Jotform webhook.
- **Nodes Involved:** `Jotform Trigger`
- **Node Details:**

  - **Jotform Trigger**
    - Type: Webhook trigger node for Jotform form submissions.
    - Configuration: Monitors Jotform form ID `252894100907054`.
    - Key variables: Receives all form fields, including personal and financial applicant info.
    - Input: External HTTP POST from Jotform on form submission.
    - Output: Emits JSON containing full application data.
    - Potential failures: Webhook misconfiguration, API authentication errors, form ID mismatch.

#### 2.2 Data Extraction

- **Overview:** Prepares and normalizes incoming application data for AI processing.
- **Nodes Involved:** `Extract Application Data`
- **Node Details:**

  - **Extract Application Data**
    - Type: Set node (used here mainly for data structuring).
    - Configuration: No explicit fields set; likely used to standardize or pass data forward.
    - Input: From Jotform Trigger node output.
    - Output: Structured application JSON.
    - Potential failures: If input data is missing expected fields or malformed.

#### 2.3 AI Financial Analysis

- **Overview:** Analyzes loan application data using a GPT-4 conversational AI agent to calculate financial ratios, risk scores, approval likelihood, and generate recommended loan terms.
- **Nodes Involved:** `OpenAI Chat Model`, `AI Financial Analysis`, `Parse AI Analysis`
- **Node Details:**

  - **OpenAI Chat Model**
    - Type: LangChain OpenAI Chat model node.
    - Configuration: Uses GPT-4 variant `gpt-4.1-mini`.
    - Credentials: OpenAI API credentials configured.
    - Input: Receives application data from Extract Application Data node.
    - Output: Feeds analysis prompt to AI Financial Analysis node.
    - Potential failures: API limits, invalid credentials, model unavailability.

  - **AI Financial Analysis**
    - Type: LangChain agent node configured as a conversational AI agent.
    - Configuration: System message sets role as mortgage underwriting AI.
    - Prompt: Dynamically constructed JSON with key financial data from application (income, debts, loan amount, property value, employment status).
    - Output: Returns JSON with debt-to-income ratio, loan-to-value ratio, approval likelihood, risk score, recommended status, monthly payment estimate, necessary documents, conditions, reasoning notes, and interest rate range.
    - Input: Data from Extract Application Data node and OpenAI Chat Model.
    - Output: AI-generated financial metrics.
    - Potential failures: AI agent timeout, malformed expressions, unexpected AI output format.

  - **Parse AI Analysis**
    - Type: Set node.
    - Configuration: Sets a single field `Analysis` to the AI agent output JSON.
    - Input: From AI Financial Analysis output.
    - Output: Passes parsed AI analysis to the next block.
    - Potential failures: If AI output is missing or malformed.

#### 2.4 Credit Check Simulation

- **Overview:** Generates a simulated credit report based on income, debt, and AI analysis outputs.
- **Nodes Involved:** `Simulate Credit Check`
- **Node Details:**

  - **Simulate Credit Check**
    - Type: Code node (JavaScript).
    - Configuration: Reads income, debts, and debt-to-income ratio; assigns credit score based on thresholds; synthesizes payment history, utilization, inquiries.
    - Input: Data from Extract Application Data and Parse AI Analysis nodes.
    - Output: JSON combining credit data and AI financial analysis.
    - Version-specific: Uses JavaScript ES6 syntax.
    - Potential failures: Reference errors if expected fields missing; logic errors in thresholds.
    - Notes: Placeholder for real credit API integration.

#### 2.5 Approval Decision Routing

- **Overview:** Evaluates AI recommendation, credit score, and financial ratios to determine approval status path.
- **Nodes Involved:** `Check Approval Status`
- **Node Details:**

  - **Check Approval Status**
    - Type: If node (conditional branching).
    - Configuration: Checks if `recommendedStatus` equals "pre-approved", credit score ≥ 680, and debt-to-income ratio ≤ 0.43.
    - Input: From Simulate Credit Check.
    - Output: Two branches:
      - True: Pre-Approved Path (to Send Pre-Approval Letter and Notify Underwriter).
      - False: Conditional/Denied Path (to Check If Conditional).
    - Potential failures: Expression evaluation issues if JSON fields missing or null.

#### 2.6 Pre-Approval Communication

- **Overview:** Sends pre-approval notification emails to applicant and underwriter.
- **Nodes Involved:** `Send Pre-Approval Letter`, `Notify Underwriter`
- **Node Details:**

  - **Send Pre-Approval Letter**
    - Type: Gmail node (send email).
    - Configuration: Sends styled HTML email congratulating applicant; includes loan details, required documents, next steps.
    - Input: From Check Approval Status (pre-approved true branch).
    - Credentials: Gmail OAuth2 configured.
    - Potential failures: Gmail API quota, invalid recipient email, authentication errors.

  - **Notify Underwriter**
    - Type: Gmail node.
    - Configuration: Sends email to underwriter with summarized loan application and risk details.
    - Input: Same as above.
    - Credentials: Gmail OAuth2.
    - Potential failures: Same as above.

#### 2.7 Conditional/Denial Communication

- **Overview:** Routes to conditional approval or denial letter sending based on AI's recommended status.
- **Nodes Involved:** `Check If Conditional`, `Send Conditional Letter`, `Send Denial Letter`
- **Node Details:**

  - **Check If Conditional**
    - Type: If node.
    - Configuration: Checks if `recommendedStatus` equals "conditional".
    - Input: From Check Approval Status false branch.
    - Output: 
      - True: Send Conditional Letter.
      - False: Send Denial Letter.
    - Potential failures: Missing or unexpected `recommendedStatus`.

  - **Send Conditional Letter**
    - Type: Gmail node.
    - Configuration: Sends styled HTML email listing conditions applicant must meet.
    - Input: From Check If Conditional true branch.
    - Credentials: Gmail OAuth2.
    - Potential failures: Email delivery issues, template rendering errors.

  - **Send Denial Letter**
    - Type: Gmail node.
    - Configuration: Styled email informing applicant of denial, reasons, and alternative suggestions.
    - Input: From Check If Conditional false branch.
    - Credentials: Gmail OAuth2.
    - Potential failures: Same as above.

#### 2.8 Application Tracking

- **Overview:** Logs all application and processing data to a Google Sheet for record-keeping and monitoring.
- **Nodes Involved:** `Log Application`
- **Node Details:**

  - **Log Application**
    - Type: Google Sheets node.
    - Configuration: Appends or updates row in sheet "Loan_Applications" in specified Google Sheets document.
    - Mapped fields: email, phone, DTI, LTV, risk score, timestamps, loan amount, credit score, approval status, monthly payment estimate, etc.
    - Credentials: Google Sheets OAuth2.
    - Potential failures: Sheet ID misconfiguration, API permission errors, quota limits.

---

### 3. Summary Table

| Node Name               | Node Type                   | Functional Role                  | Input Node(s)            | Output Node(s)                       | Sticky Note                                                                                         |
|-------------------------|-----------------------------|---------------------------------|--------------------------|------------------------------------|---------------------------------------------------------------------------------------------------|
| Jotform Trigger         | Jotform Trigger             | Receive loan application input  | -                        | Extract Application Data            | ## 📝 Form Fields Create your form for free on [Jotform using this link](https://www.jotform.com/?partner=mediajade) Applicant Info: Full Name, Email, Phone, SSN, DOB, Address; Financial Info: Monthly Income, Employment Status, Current Debts, Loan Amount Requested, Down Payment, Property Value |
| Extract Application Data| Set                         | Normalize / prepare input data  | Jotform Trigger          | AI Financial Analysis               |                                                                                                   |
| OpenAI Chat Model       | LangChain LM Chat OpenAI    | AI language model invocation    | -                        | AI Financial Analysis               |                                                                                                   |
| AI Financial Analysis   | LangChain Agent             | Generate financial analysis JSON| Extract Application Data | Parse AI Analysis                   | ## 🤖 AI Financial Analysis Calculates debt-to-income ratio, loan-to-value ratio, approval likelihood, risk score, recommended terms, required documents |
| Parse AI Analysis       | Set                         | Store AI analysis output        | AI Financial Analysis     | Simulate Credit Check               |                                                                                                   |
| Simulate Credit Check   | Code                        | Generate simulated credit report| Extract Application Data, Parse AI Analysis | Check Approval Status          | ## 💳 Credit Check Simulates credit pull: Credit Score, Payment History, Credit Utilization, Recent Inquiries; Note: Replace with real credit API integration |
| Check Approval Status   | If                          | Route based on approval criteria| Simulate Credit Check     | Send Pre-Approval Letter, Notify Underwriter, Check If Conditional | ## 🎯 Approval Decision Routes based on AI recommendation, credit score, DTI, LTV ratios; paths: Pre-Approved, Conditional, Denied |
| Send Pre-Approval Letter| Gmail                       | Send pre-approval email to applicant| Check Approval Status (true) | -                              | ## ✅ Pre-Approved Path Actions: send approval letter, route to underwriter, schedule closing, request final docs |
| Notify Underwriter      | Gmail                       | Notify underwriter of pre-approval | Check Approval Status (true) | -                              | ## ✅ Pre-Approved Path Actions: send approval letter, route to underwriter, schedule closing, request final docs |
| Check If Conditional    | If                          | Check if recommendation is conditional| Check Approval Status (false) | Send Conditional Letter, Send Denial Letter | ## ⚠️ Conditional/Denied Path Actions: send conditional approval, list requirements, or send denial letter, offer alternatives |
| Send Conditional Letter | Gmail                       | Send conditional approval email| Check If Conditional (true) | -                              |                                                                                                   |
| Send Denial Letter      | Gmail                       | Send denial email              | Check If Conditional (false) | -                              |                                                                                                   |
| Log Application         | Google Sheets               | Log application data and status| Simulate Credit Check     | -                                  | ## 📊 Application Tracking Logs to Google Sheets: all data, AI results, credit info, approval status, next steps, timestamps |
| Sticky Note             | Sticky Note                 | Documentation / notes          | -                        | -                                  | ## 🏦 Loan Application System Automates loan processing from application to approval with AI and automation features |
| Sticky Note1            | Sticky Note                 | Documentation / notes          | -                        | -                                  | ## 📝 Form Fields See above (Jotform link and form fields)                                         |
| Sticky Note2            | Sticky Note                 | Documentation / notes          | -                        | -                                  | ## 🤖 AI Financial Analysis See above                                                             |
| Sticky Note3            | Sticky Note                 | Documentation / notes          | -                        | -                                  | ## 💳 Credit Check See above                                                                       |
| Sticky Note4            | Sticky Note                 | Documentation / notes          | -                        | -                                  | ## 🎯 Approval Decision See above                                                                  |
| Sticky Note5            | Sticky Note                 | Documentation / notes          | -                        | -                                  | ## ✅ Pre-Approved Path See above                                                                  |
| Sticky Note6            | Sticky Note                 | Documentation / notes          | -                        | -                                  | ## ⚠️ Conditional/Denied Path See above                                                            |
| Sticky Note7            | Sticky Note                 | Documentation / notes          | -                        | -                                  | ## 📊 Application Tracking See above                                                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Jotform Trigger node:**
   - Type: Jotform Trigger
   - Parameters: Set Form ID to `252894100907054` (or your own form ID).
   - Credentials: Link to your Jotform API credentials.
   - Purpose: Trigger workflow on new loan application submission.

2. **Create a Set node named “Extract Application Data”:**
   - Type: Set
   - Leave fields empty or map relevant fields from Jotform output if needed for normalization.
   - Connect Jotform Trigger output to this node.

3. **Create an OpenAI Chat Model node:**
   - Type: LangChain LM Chat OpenAI
   - Model: Select GPT-4 variant `gpt-4.1-mini`.
   - Credentials: Add your OpenAI API credentials.
   - Connect the output of “Extract Application Data” to this node.
   - Note: This node feeds the AI agent for analysis.

4. **Create AI Financial Analysis node:**
   - Type: LangChain agent node.
   - Agent: Set to `conversationalAgent`.
   - System Message: “You are a mortgage underwriting AI. Analyze loan applications objectively based on standard lending criteria.”
   - Prompt: Use an expression to build JSON from input data (applicant name, income, debts, loan amount, down payment, property value, employment status).
   - Connect OpenAI Chat Model output to this node.

5. **Create a Set node named “Parse AI Analysis”:**
   - Type: Set
   - Set field "Analysis" to `={{ $json.output }}` (the AI analysis JSON).
   - Connect AI Financial Analysis output to this node.

6. **Create a Code node named “Simulate Credit Check”:**
   - Type: Code (JavaScript)
   - Code logic: 
     - Extract income, debts, and DTI ratio from previous nodes.
     - Calculate credit score based on thresholds.
     - Build creditData object merging credit info, AI analysis, and application data.
   - Connect “Extract Application Data” and “Parse AI Analysis” outputs to this node.

7. **Create an If node named “Check Approval Status”:**
   - Type: If
   - Conditions:
     - `recommendedStatus` equals `"pre-approved"`
     - `creditScore` ≥ 680
     - `debtToIncomeRatio` ≤ 0.43
   - Connect “Simulate Credit Check” output to this node.

8. **Create Gmail nodes for Pre-Approval Path:**
   - **Send Pre-Approval Letter**
     - Type: Gmail (send email)
     - Send to: `={{ $json.email }}`
     - Subject and HTML body: Use template with applicant name, loan details, required documents, next steps.
     - Credentials: Gmail OAuth2.
     - Connect “Check Approval Status” true output to this node.
   - **Notify Underwriter**
     - Type: Gmail
     - Send to: underwriter@company.com
     - Subject and body: Summarize application data.
     - Credentials: Gmail OAuth2.
     - Connect “Check Approval Status” true output to this node.

9. **Create an If node named “Check If Conditional”:**
   - Type: If
   - Condition: `recommendedStatus` equals `"conditional"`
   - Connect “Check Approval Status” false output to this node.

10. **Create Gmail nodes for Conditional/Denial Path:**
    - **Send Conditional Letter**
      - Type: Gmail
      - Send to: `={{ $json.email }}`
      - Subject and body: Inform conditional approval and list conditions.
      - Credentials: Gmail OAuth2.
      - Connect “Check If Conditional” true output to this node.
    - **Send Denial Letter**
      - Type: Gmail
      - Send to: `={{ $json.email }}`
      - Subject and body: Inform denial and suggest alternatives.
      - Credentials: Gmail OAuth2.
      - Connect “Check If Conditional” false output to this node.

11. **Create Google Sheets node named “Log Application”:**
    - Type: Google Sheets appendOrUpdate
    - Document ID: Your Google Sheet ID
    - Sheet Name: `Loan_Applications`
    - Map columns to fields: email, phone, DTI, LTV, risk score, loan amount, credit score, approval status, timestamps, monthly payment, etc.
    - Credentials: Google Sheets OAuth2.
    - Connect output of “Simulate Credit Check” node here to log all application and analysis data.

12. **Add Sticky Note nodes for documentation:**
    - Add notes summarizing each block’s purpose, form fields, AI analysis, credit check, approval logic, communication paths, and tracking.

---

### 5. General Notes & Resources

| Note Content                                                                                               | Context or Link                                                                                      |
|------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Create your loan application form for free on Jotform using this link: https://www.jotform.com/?partner=mediajade | Reference for loan application form design and integration                                         |
| Workflow ROI: Enables same-day loan approvals and reduces closing times by 50%                             | Business value statement                                                                            |
| Credit check node is a simulation placeholder; for production, replace with real credit bureau API         | Important for integration with external credit data sources                                        |
| Gmail nodes require OAuth2 credentials with appropriate sending permissions                                 | Ensure Gmail API quota and OAuth scopes are correctly configured                                   |
| AI agent prompt expects JSON output with specific fields; unexpected output may break parsing              | Validate AI responses and handle exceptions in production                                         |
| Google Sheets integration requires sheet with columns matching mapped fields for logging                   | Prepare Google Sheet structure before deployment                                                   |

---

**Disclaimer:** The provided text is extracted exclusively from an automated workflow created in n8n, adhering strictly to content policies and containing no illegal, offensive, or protected elements. All handled data is legal and public.