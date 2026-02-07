Automate Conference Travel Approvals with Deepseek AI, Gmail and Google Sheets

https://n8nworkflows.xyz/workflows/automate-conference-travel-approvals-with-deepseek-ai--gmail-and-google-sheets-10522


# Automate Conference Travel Approvals with Deepseek AI, Gmail and Google Sheets

### 1. Workflow Overview

This workflow automates the process of preparing and sending overseas conference travel approval requests to a CEO. It targets use cases such as academic staff requesting conference attendance funding, sales managers seeking client meeting approvals, and employees requesting training or certification approvals involving travel and expenses.

The workflow logically divides into these functional blocks:

- **1.1 Initialization & Configuration**: Manual trigger starts the process and sets key conference and travel parameters.

- **1.2 Data Collection**: Fetches live exchange rates, conference website details, and parses three flight quotations.

- **1.3 AI Processing & Expense Calculation**: Uses AI agents and calculation tools to analyze expenses, compare flights, and draft a professional approval email.

- **1.4 Budget Validation & Message Formatting**: Checks if total expenses are within budget and formats approval or warning messages accordingly.

- **1.5 Email Preparation & Delivery**: Merges message versions, generates a detailed PDF attachment, sends the approval request email to the CEO, and logs the request in a Google Sheets tracker.

---

### 2. Block-by-Block Analysis

#### 2.1 Initialization & Configuration

**Overview:**  
This block initiates the workflow manually and sets all required input parameters for the conference and travel request.

**Nodes Involved:**  
- Manual Trigger  
- Workflow Configuration

**Node Details:**

- **Manual Trigger**  
  - Type: Manual start node  
  - Role: Initiates the workflow execution manually  
  - Configuration: No parameters required  
  - Inputs: None  
  - Outputs: Triggers Workflow Configuration node  
  - Edge Cases: None (manual only)

- **Workflow Configuration**  
  - Type: Set node  
  - Role: Defines all static and input variables for the workflow, such as conference name, dates, host country, funding source, flight quotes, accommodation, visa, meal, transport costs, CEO email, user name and position, conference URL, budget limit, currency, and optional exchange rate API key.  
  - Configuration: Uses placeholders which must be replaced by the user with actual values before running.  
  - Inputs: Manual Trigger output  
  - Outputs: To Data Collection nodes  
  - Edge Cases: Missing or invalid parameters will cause downstream errors (e.g., invalid URL or missing currency code).

---

#### 2.2 Data Collection

**Overview:**  
Collects real-time currency exchange rates, retrieves conference details from the provided URL, and parses three flight quotations into structured data.

**Nodes Involved:**  
- Fetch Exchange Rates  
- Extract Currency Data  
- Get Conference Details  
- Parse Flight Quotes  
- Aggregate Flight Options

**Node Details:**

- **Fetch Exchange Rates**  
  - Type: HTTP Request  
  - Role: Retrieves latest exchange rates for the specified currency from exchangerate-api.com  
  - Configuration: URL dynamically built using currency code from Workflow Configuration node; sends Accept: application/json header  
  - Inputs: Workflow Configuration output  
  - Outputs: Extract Currency Data node  
  - Edge Cases: HTTP errors, invalid currency code, API rate limit or downtime

- **Extract Currency Data**  
  - Type: Set  
  - Role: Extracts exchange rate to USD, base currency, and last updated date from the API response  
  - Configuration: Assigns exchangeRate (USD rate), baseCurrency, lastUpdated date fields  
  - Inputs: Fetch Exchange Rates output  
  - Outputs: Calculate Total Expenses node  
  - Edge Cases: Missing or malformed API response

- **Get Conference Details**  
  - Type: HTTP Request  
  - Role: Fetches conference details page HTML or metadata from the conference URL  
  - Configuration: Uses conferenceUrl from Workflow Configuration; User-Agent header set to "n8n-workflow"  
  - Inputs: Workflow Configuration output  
  - Outputs: Calculate Total Expenses node  
  - Edge Cases: Invalid URL, network timeout, server errors

- **Parse Flight Quotes**  
  - Type: Code  
  - Role: Parses three flight quotation strings from configuration into structured JSON objects extracting airline, price, route, and duration  
  - Configuration: Contains JS code with regex parsing logic; returns three parsed quote objects as separate output items  
  - Inputs: Workflow Configuration output  
  - Outputs: Aggregate Flight Options node  
  - Edge Cases: Unparsable or placeholder quotes, empty strings, malformed input

- **Aggregate Flight Options**  
  - Type: Aggregate  
  - Role: Aggregates the three parsed flight quote items into one combined data object for downstream processing  
  - Configuration: Uses "aggregate all item data" mode  
  - Inputs: Parse Flight Quotes output  
  - Outputs: Calculate Total Expenses node  
  - Edge Cases: Empty input, aggregation failure

---

#### 2.3 AI Processing & Expense Calculation

**Overview:**  
This block orchestrates AI-powered analysis of expenses, flight comparisons, and generates a professional email draft for CEO approval.

**Nodes Involved:**  
- AI Email Composer Agent  
- OpenRouter Chat Model  
- Calculator Tool  
- Expense Analysis Tool  
- Flight Comparison Tool  
- Calculate Total Expenses

**Node Details:**

- **AI Email Composer Agent**  
  - Type: Langchain Agent  
  - Role: Uses GPT-4 powered AI to generate a comprehensive, professional conference approval email including all details and instructions for administrative procedures and post-conference deliverables  
  - Configuration: Prompt specialized for business email composition with input data fields; uses tools Calculator Tool, Expense Analysis Tool, Flight Comparison Tool  
  - Inputs: Workflow Configuration, OpenRouter Chat Model, Calculator Tool, Expense Analysis Tool, Flight Comparison Tool outputs  
  - Outputs: Calculate Total Expenses node  
  - Edge Cases: AI service timeout, prompt failure, incomplete data

- **OpenRouter Chat Model**  
  - Type: Langchain OpenRouter language model node  
  - Role: Provides GPT-4 compatible language model interface for the AI Email Composer Agent  
  - Configuration: Uses Deepseek R1T Chimera free model; requires valid OpenRouter API credentials  
  - Inputs: AI Email Composer Agent input  
  - Outputs: AI Email Composer Agent  
  - Edge Cases: Auth errors, rate limits, network issues

- **Calculator Tool**  
  - Type: Langchain Calculator Tool  
  - Role: Provides numeric calculation abilities to AI for expense computations  
  - Inputs: AI Email Composer Agent  
  - Outputs: AI Email Composer Agent  
  - Edge Cases: Calculation errors on invalid inputs

- **Expense Analysis Tool**  
  - Type: Langchain Code Tool  
  - Role: Analyzes expense breakdown, calculates totals, percentages, budget compliance, and generates recommendations  
  - Configuration: JavaScript code analyzing parsed expense categories against budget limit  
  - Inputs: AI Email Composer Agent  
  - Outputs: AI Email Composer Agent  
  - Edge Cases: Parsing errors, unexpected input format

- **Flight Comparison Tool**  
  - Type: Langchain Code Tool  
  - Role: Compares flight quotations by price and duration, recommends best option with savings and notes  
  - Configuration: JavaScript code extracting numeric values, durations, and formatting recommendations  
  - Inputs: AI Email Composer Agent  
  - Outputs: AI Email Composer Agent  
  - Edge Cases: Missing or malformed flight quotes

- **Calculate Total Expenses**  
  - Type: Code  
  - Role: Aggregates all costs including registration, flights, accommodation, visa, meals, transport; converts to USD using exchange rate; prepares detailed expense and currency conversion breakdown  
  - Inputs: Extract Currency Data, Get Conference Details, Aggregate Flight Options, AI Email Composer Agent outputs  
  - Outputs: Check Budget Approval node  
  - Edge Cases: Parsing errors, missing cost values, zero or invalid exchange rates

---

#### 2.4 Budget Validation & Message Formatting

**Overview:**  
Evaluates if the total expenses are within the budget limit and formats email message versions accordingly.

**Nodes Involved:**  
- Check Budget Approval  
- Format Approved Email  
- Format Budget Warning  
- Merge Email Versions

**Node Details:**

- **Check Budget Approval**  
  - Type: If node  
  - Role: Compares total calculated expenses with configured budget limit to determine approval status  
  - Inputs: Calculate Total Expenses output  
  - Outputs: Format Approved Email (if within budget), Format Budget Warning (if exceeds budget)  
  - Edge Cases: Missing totals, invalid budget limit values

- **Format Approved Email**  
  - Type: Set  
  - Role: Sets fields indicating approval status as "WITHIN BUDGET - APPROVED", normal email priority, and budget note confirming expenses are within limits  
  - Inputs: Check Budget Approval (true branch)  
  - Outputs: Merge Email Versions node  
  - Edge Cases: None

- **Format Budget Warning**  
  - Type: Set  
  - Role: Sets fields indicating warning status "EXCEEDS BUDGET - REQUIRES SPECIAL APPROVAL", high email priority, and warning note about exceeding budget  
  - Inputs: Check Budget Approval (false branch)  
  - Outputs: Merge Email Versions node  
  - Edge Cases: None

- **Merge Email Versions**  
  - Type: Merge  
  - Role: Combines approved or warning message versions into a single output stream for downstream processing  
  - Configuration: Combine mode by position  
  - Inputs: Format Approved Email and Format Budget Warning outputs  
  - Outputs: Generate PDF Attachment node  
  - Edge Cases: Mismatched input items could cause merge issues

---

#### 2.5 Email Preparation & Delivery

**Overview:**  
Prepares a detailed PDF attachment from all gathered data, sends the approval email to the CEO via Gmail, and logs the request in a Google Sheets expense tracker.

**Nodes Involved:**  
- Generate PDF Attachment  
- Send Email to CEO  
- Log to Expense Tracker

**Node Details:**

- **Generate PDF Attachment**  
  - Type: Code  
  - Role: Builds a comprehensive HTML document with conference info, expense breakdown, flight comparison, checklists, approval status, and signatures suitable for PDF generation and emailing  
  - Configuration: Uses template literals with all relevant fields from previous nodes; generates a sanitized PDF filename and current date  
  - Inputs: Merge Email Versions output  
  - Outputs: Send Email to CEO node  
  - Edge Cases: Missing input fields could cause incomplete document

- **Send Email to CEO**  
  - Type: Gmail node  
  - Role: Sends the composed email with subject and body (including PDF attachment reference) to the CEO's email address configured in Workflow Configuration  
  - Configuration: Uses Gmail OAuth2 credentials; recipient and subject dynamically set; email body from generated draft  
  - Inputs: Generate PDF Attachment output  
  - Outputs: Log to Expense Tracker node  
  - Edge Cases: Gmail auth errors, network issues, invalid recipient email

- **Log to Expense Tracker**  
  - Type: Google Sheets node  
  - Role: Appends a new row with the request details, including date, email sent status, host country, employee name, total expenses, approval status (“Pending”), and conference name to a configured Google Sheet  
  - Configuration: Requires Google Sheets OAuth2 credentials; document ID and sheet name must be set; columns mapped properly  
  - Inputs: Send Email to CEO output  
  - Edge Cases: Google Sheets API errors, permission issues, invalid doc ID

---

### 3. Summary Table

| Node Name               | Node Type                         | Functional Role                                     | Input Node(s)                       | Output Node(s)                        | Sticky Note                                                                                             |
|-------------------------|----------------------------------|----------------------------------------------------|-----------------------------------|-------------------------------------|-------------------------------------------------------------------------------------------------------|
| Manual Trigger          | Manual Trigger                   | Starts the workflow manually                        | None                              | Workflow Configuration              | Introduction: Automates conference approval requests to CEO, generating emails and expense breakdowns |
| Workflow Configuration  | Set                             | Sets all conference/travel input parameters         | Manual Trigger                   | Fetch Exchange Rates, Get Conference Details, Parse Flight Quotes, AI Email Composer Agent |                                                                                                       |
| Fetch Exchange Rates    | HTTP Request                    | Retrieves current currency exchange rates           | Workflow Configuration           | Extract Currency Data               |                                                                                                       |
| Extract Currency Data   | Set                             | Extracts exchange rate and base currency            | Fetch Exchange Rates             | Calculate Total Expenses            |                                                                                                       |
| Get Conference Details  | HTTP Request                    | Fetches conference website details                   | Workflow Configuration           | Calculate Total Expenses            |                                                                                                       |
| Parse Flight Quotes     | Code                            | Parses three flight quotes into structured data     | Workflow Configuration           | Aggregate Flight Options            |                                                                                                       |
| Aggregate Flight Options| Aggregate                      | Combines parsed flight quote data                    | Parse Flight Quotes              | Calculate Total Expenses            |                                                                                                       |
| AI Email Composer Agent | Langchain Agent                 | Generates professional approval email with AI       | Workflow Configuration, OpenRouter Chat Model, Calculator Tool, Expense Analysis Tool, Flight Comparison Tool | Calculate Total Expenses            |                                                                                                       |
| OpenRouter Chat Model   | Langchain Language Model       | Provides GPT-4 language model interface              | AI Email Composer Agent          | AI Email Composer Agent             |                                                                                                       |
| Calculator Tool         | Langchain Calculator Tool      | Numerical calculation utility for AI                 | AI Email Composer Agent          | AI Email Composer Agent             |                                                                                                       |
| Expense Analysis Tool   | Langchain Code Tool            | Analyzes expenses and budget compliance              | AI Email Composer Agent          | AI Email Composer Agent             |                                                                                                       |
| Flight Comparison Tool  | Langchain Code Tool            | Compares flight quotes and recommends best option   | AI Email Composer Agent          | AI Email Composer Agent             |                                                                                                       |
| Calculate Total Expenses| Code                            | Calculates total expenses, currency conversion       | Extract Currency Data, Get Conference Details, Aggregate Flight Options, AI Email Composer Agent | Check Budget Approval              |                                                                                                       |
| Check Budget Approval   | If                              | Checks if total expenses are within budget           | Calculate Total Expenses         | Format Approved Email, Format Budget Warning |                                                                                                       |
| Format Approved Email   | Set                             | Formats approval message if within budget            | Check Budget Approval (true)     | Merge Email Versions                |                                                                                                       |
| Format Budget Warning   | Set                             | Formats warning message if exceeds budget            | Check Budget Approval (false)    | Merge Email Versions                |                                                                                                       |
| Merge Email Versions    | Merge                           | Merges the approval/warning message versions         | Format Approved Email, Format Budget Warning | Generate PDF Attachment            |                                                                                                       |
| Generate PDF Attachment | Code                            | Creates PDF-ready HTML document summary               | Merge Email Versions             | Send Email to CEO                  |                                                                                                       |
| Send Email to CEO       | Gmail                           | Sends the email with approval request to CEO         | Generate PDF Attachment          | Log to Expense Tracker             |                                                                                                       |
| Log to Expense Tracker  | Google Sheets                   | Logs request details into Google Sheets tracker       | Send Email to CEO                | None                              |                                                                                                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger node**  
   - No configuration needed. This starts the workflow manually.

2. **Add Set node named "Workflow Configuration"**  
   - Define all input parameters as string fields with placeholder values:  
     *conferenceName, conferenceDuration, hostCountry, fundingSource, registrationFee, flightQuote1, flightQuote2, flightQuote3, accommodationCost, visaCost, mealsCost, transportCost, ceoEmail, yourName, yourPosition, conferenceUrl, budgetLimit, currency, exchangeRateApiKey (optional)*  
   - No other fields required.

3. **Add HTTP Request node "Fetch Exchange Rates"**  
   - URL: `https://api.exchangerate-api.com/v4/latest/{{ $json.currency }}`  
   - Headers: Accept: application/json  
   - Connect input from "Workflow Configuration"

4. **Add Set node "Extract Currency Data"**  
   - Extract from HTTP response:  
     - exchangeRate = `{{$json.rates.USD}}`  
     - baseCurrency = `{{$json.base}}`  
     - lastUpdated = `{{$json.date}}`  
   - Connect input from "Fetch Exchange Rates"

5. **Add HTTP Request node "Get Conference Details"**  
   - URL: `{{ $json.conferenceUrl }}` from Workflow Configuration  
   - Header: User-Agent = "n8n-workflow"  
   - Connect input from "Workflow Configuration"

6. **Add Code node "Parse Flight Quotes"**  
   - Paste the provided JavaScript code to parse flight quotes 1, 2, 3 into structured JSON objects  
   - Connect input from "Workflow Configuration"

7. **Add Aggregate node "Aggregate Flight Options"**  
   - Mode: aggregate all item data  
   - Connect input from "Parse Flight Quotes"

8. **Add Langchain OpenRouter Chat Model node "OpenRouter Chat Model"**  
   - Model: tngtech/deepseek-r1t-chimera:free  
   - Credentials: Configure OpenRouter API key  
   - This node will be used by AI Email Composer Agent

9. **Add Langchain Calculator Tool node "Calculator Tool"**  
   - No special parameters; used by AI Email Composer Agent

10. **Add Langchain Code Tool node "Expense Analysis Tool"**  
    - Paste the provided JS code analyzing expense breakdown and budget compliance  
    - Used by AI Email Composer Agent

11. **Add Langchain Code Tool node "Flight Comparison Tool"**  
    - Paste the provided JS code comparing flight quotes and recommending best option  
    - Used by AI Email Composer Agent

12. **Add Langchain Agent node "AI Email Composer Agent"**  
    - Configure prompt as per provided description to generate professional conference approval email including all details and instructions  
    - Reference tools: OpenRouter Chat Model, Calculator Tool, Expense Analysis Tool, Flight Comparison Tool  
    - Connect input from "Workflow Configuration", "OpenRouter Chat Model", "Calculator Tool", "Expense Analysis Tool", "Flight Comparison Tool"

13. **Add Code node "Calculate Total Expenses"**  
    - Paste provided JS code that sums costs, converts currencies, and builds detailed breakdowns  
    - Connect inputs from "Extract Currency Data", "Get Conference Details", "Aggregate Flight Options", "AI Email Composer Agent"

14. **Add If node "Check Budget Approval"**  
    - Condition: totalExpenses (from Calculate Total Expenses) <= budgetLimit (from Workflow Configuration)  
    - Connect input from "Calculate Total Expenses"

15. **Add Set node "Format Approved Email"**  
    - Set fields:  
      - approvalStatus = "WITHIN BUDGET - APPROVED"  
      - budgetNote = "Total expenses are within the approved budget limit"  
      - emailPriority = "normal"  
    - Connect input from If node (true branch)

16. **Add Set node "Format Budget Warning"**  
    - Set fields:  
      - approvalStatus = "EXCEEDS BUDGET - REQUIRES SPECIAL APPROVAL"  
      - budgetNote = "WARNING: Total expenses exceed the standard budget limit. Additional justification required."  
      - emailPriority = "high"  
    - Connect input from If node (false branch)

17. **Add Merge node "Merge Email Versions"**  
    - Mode: Combine by position  
    - Connect inputs from both Format Approved Email and Format Budget Warning

18. **Add Code node "Generate PDF Attachment"**  
    - Paste provided JS code generating a detailed HTML document for PDF with full expense breakdown, checklists, and approval status  
    - Connect input from "Merge Email Versions"

19. **Add Gmail node "Send Email to CEO"**  
    - Configure Gmail OAuth2 credentials  
    - Set recipient: `{{ $json.ceoEmail }}`  
    - Subject: `{{ $json.subject }} - {{ $json.approvalStatus }}`  
    - Message body: `{{ $json.emailDraft }}`  
    - Connect input from "Generate PDF Attachment"

20. **Add Google Sheets node "Log to Expense Tracker"**  
    - Configure Google Sheets OAuth2 credentials  
    - Document ID: Set your Google Sheets document ID  
    - Sheet Name: "Conference Requests"  
    - Operation: Append  
    - Columns mapped: Date, Email Sent ("Yes"), Host Country, Employee Name, Total Expenses, Approval Status ("Pending"), Conference Name  
    - Connect input from "Send Email to CEO"

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                            | Context or Link                                                                                                             |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------|
| Automates overseas conference approval requests to CEO. Generates emails with conference details, flight quotes, accommodation, expense breakdown, and admin procedures. Ensures consistency and saves time.                                           | Sticky Note near Manual Trigger                                                                                             |
| Prerequisites: n8n instance, Currency API, Conference API, OpenAI GPT-4 key, Gmail with OAuth, Google Sheets, PDF generator, Travel agent API. Use cases include academic, sales, training staff travel approvals.                                        | Sticky Note near Send Email to CEO                                                                                          |
| Workflow Steps: 1) Initialization; 2) Data Collection; 3) AI Processing; 4) Validation; 5) Formatting; 6) Delivery. Setup instructions cover APIs, OpenAI key, AI tools, Gmail, Sheets, budget threshold.                                                 | Sticky Note near middle top                                                                                                 |
| Benefits: Time efficient (reduces prep from 60+ to 5 minutes), AI-powered intelligent analysis, consistent and accurate outputs.                                                                                                                      | Sticky Note near Send Email to CEO                                                                                          |
| AI prompt carefully crafted for professional tone and detailed coverage of administrative procedures and post-conference deliverables to ensure compliance and completeness.                                                                        | AI Email Composer Agent node configuration                                                                                   |
| Currency exchange API used is https://exchangerate-api.com. Alternative APIs can be integrated by modifying HTTP Request node URL and extraction logic accordingly.                                                                                    | Fetch Exchange Rates node details                                                                                           |
| Google Sheets document must have columns matching those mapped in the "Log to Expense Tracker" node for successful logging.                                                                                                                           | Google Sheets node description                                                                                              |
| Gmail OAuth2 credentials require authorization with sending permissions. Confirm recipient emails are valid to avoid delivery failure.                                                                                                                | Send Email to CEO node details                                                                                              |
| Flight quotes parsing relies on expected formats; malformed or placeholder quotes may lead to incomplete data. Validate inputs before running workflow.                                                                                                | Parse Flight Quotes node details                                                                                            |
| PDF generation produces HTML suitable for conversion to PDF via external renderer or n8n PDF node if added. Adjust styling as needed for branding consistency.                                                                                        | Generate PDF Attachment node details                                                                                        |

---

**Disclaimer:**  
The text provided originates exclusively from an automated n8n workflow. It complies strictly with content policies and contains no illegal or offensive material. All manipulated data is legal and public.