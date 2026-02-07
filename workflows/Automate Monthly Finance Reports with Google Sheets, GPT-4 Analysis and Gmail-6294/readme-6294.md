Automate Monthly Finance Reports with Google Sheets, GPT-4 Analysis and Gmail

https://n8nworkflows.xyz/workflows/automate-monthly-finance-reports-with-google-sheets--gpt-4-analysis-and-gmail-6294


# Automate Monthly Finance Reports with Google Sheets, GPT-4 Analysis and Gmail

### 1. Workflow Overview

This workflow automates the generation and distribution of a monthly finance report enriched with AI-generated insights. It is designed to extract transaction data from a Google Sheet, filter it for the previous month, analyze the data using OpenAI's GPT-4 to produce financial insights, and email the compiled report via Gmail. The logical flow is composed of the following blocks:

- **1.1 Scheduled Trigger:** Initiates the workflow on a monthly basis.
- **1.2 Data Extraction:** Retrieves monthly finance transaction data from Google Sheets.
- **1.3 Data Filtering:** Filters the extracted data to isolate transactions from the previous month.
- **1.4 AI Financial Analysis:** Uses GPT-4 to analyze filtered transactions and generate insights.
- **1.5 Email Delivery:** Sends the compiled report and AI insights via Gmail.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger

- **Overview:**  
  Starts the workflow execution automatically on a monthly schedule.

- **Nodes Involved:**  
  - Schedule Trigger

- **Node Details:**  
  - **Type and Role:** Schedule Trigger node; initiates workflow runs based on a time schedule.  
  - **Configuration:** Configured with a monthly interval trigger (`interval: months`).  
  - **Key Expressions/Variables:** None.  
  - **Input/Output Connections:** No input; outputs to "1. Get Finance Transactions (Google Sheets)".  
  - **Version-specific Requirements:** Version 1.2 used, standard scheduling features.  
  - **Potential Failures:** Misconfiguration of schedule interval; workflow not triggering if disabled or scheduling conflicts.  
  - **Sub-workflow:** None.

#### 1.2 Data Extraction

- **Overview:**  
  Reads raw financial transaction data from a specific Google Sheet tab.

- **Nodes Involved:**  
  - 1. Get Finance Transactions (Google Sheets)

- **Node Details:**  
  - **Type and Role:** Google Sheets node; reads data from a specified sheet and range.  
  - **Configuration:**  
    - Sheet ID must be set to target the user's Google Sheet.  
    - Range set to `FinanceSummary!A:E`, targeting columns A to E in the "FinanceSummary" tab.  
    - Credentials use Google OAuth2 for authentication.  
  - **Key Expressions/Variables:** None; static range and sheet ID.  
  - **Input/Output Connections:** Input from Schedule Trigger; output to Filter Previous Month Transactions node.  
  - **Version-specific Requirements:** Version 2 ensures up-to-date API compatibility.  
  - **Potential Failures:**  
    - Invalid or missing Google Sheets credentials.  
    - Incorrect sheet ID or range leading to empty or failed reads.  
    - Google API rate limiting or network issues.  
  - **Sub-workflow:** None.

#### 1.3 Data Filtering

- **Overview:**  
  Filters the dataset to include only transactions from the previous calendar month.

- **Nodes Involved:**  
  - 2. Filter Previous Month Transactions (Function)

- **Node Details:**  
  - **Type and Role:** Function node; executes JavaScript to process and filter data.  
  - **Configuration:**  
    - The script extracts the current date, calculates the previous month range, and filters transactions based on the 'Date' field.  
    - Ensures the 'Date' field exists and is a valid date before filtering.  
  - **Key Expressions/Variables:**  
    - Variables: `now`, `lastMonthStart`, `lastMonthEnd` to define date boundaries.  
    - Filters array by comparing transaction dates.  
  - **Input/Output Connections:** Input from Google Sheets node; output to Generate AI Financial Insights node.  
  - **Version-specific Requirements:** Version 1; standard JavaScript supported.  
  - **Potential Failures:**  
    - Missing or malformed 'Date' values causing filter exclusion.  
    - Timezone discrepancies affecting date calculation.  
    - Empty input data leading to empty output.  
  - **Sub-workflow:** None.

#### 1.4 AI Financial Analysis

- **Overview:**  
  Sends filtered transaction data to OpenAI GPT-4 to compute total income, total expense, and generate three financial insights.

- **Nodes Involved:**  
  - 3. Generate AI Financial Insights (OpenAI)

- **Node Details:**  
  - **Type and Role:** OpenAI node; sends prompt with data to GPT-4 model for text generation.  
  - **Configuration:**  
    - Model set to "gpt-4".  
    - Prompt structured to request total income, total expense, and three bullet-point insights.  
    - Injects JSON-stringified transaction data into the prompt dynamically (`{{JSON.stringify($json, null, 2)}}`).  
    - Credentials: OpenAI API key.  
  - **Key Expressions/Variables:**  
    - Dynamic prompt includes all filtered transactions as JSON.  
  - **Input/Output Connections:** Input from Function node; output to Gmail node.  
  - **Version-specific Requirements:** Version 1; requires valid OpenAI API key with GPT-4 access.  
  - **Potential Failures:**  
    - API rate limits or quota exceeded.  
    - Prompt size exceeding token limits.  
    - Invalid or missing API credentials.  
    - Network errors.  
  - **Sub-workflow:** None.

#### 1.5 Email Delivery

- **Overview:**  
  Composes and sends an email containing the previous month's transaction data and the AI-generated financial insights.

- **Nodes Involved:**  
  - 4. Send Monthly Finance Report Email (Gmail)

- **Node Details:**  
  - **Type and Role:** Gmail node; sends email via Gmail SMTP with OAuth2 authentication.  
  - **Configuration:**  
    - Email subject fixed as "Monthly Finance Summary and AI Insights".  
    - Email body is implicitly constructed by combining data and AI insights from previous nodes (configuration to include these must be set in parameters or expressions, not explicitly visible in JSON).  
    - Credentials: Gmail OAuth2.  
  - **Key Expressions/Variables:**  
    - Likely uses input from OpenAI node to populate email content.  
  - **Input/Output Connections:** Input from OpenAI node; no output (end node).  
  - **Version-specific Requirements:** Version 1; requires properly configured Gmail OAuth2 credentials.  
  - **Potential Failures:**  
    - Authentication failure due to invalid OAuth tokens.  
    - Gmail API quota limits or restrictions.  
    - Email content formatting errors.  
    - Network issues.  
  - **Sub-workflow:** None.

---

### 3. Summary Table

| Node Name                            | Node Type                 | Functional Role                      | Input Node(s)                         | Output Node(s)                      | Sticky Note                                                                                                                      |
|------------------------------------|---------------------------|------------------------------------|-------------------------------------|-----------------------------------|---------------------------------------------------------------------------------------------------------------------------------|
| Schedule Trigger                   | Schedule Trigger           | Initiates workflow monthly         | None                                | 1. Get Finance Transactions (Google Sheets) |                                                                                                                                 |
| 1. Get Finance Transactions (Google Sheets) | Google Sheets             | Extracts finance transactions      | Schedule Trigger                    | 2. Filter Previous Month Transactions | Reads monthly finance transaction data from the specified Google Sheet.                                                         |
| 2. Filter Previous Month Transactions | Function                  | Filters data for previous month    | 1. Get Finance Transactions (Google Sheets) | 3. Generate AI Financial Insights | Filters the raw data to only include transactions from the previous full month.                                                 |
| 3. Generate AI Financial Insights   | OpenAI                    | Generates AI insights               | 2. Filter Previous Month Transactions | 4. Send Monthly Finance Report Email | Uses OpenAI (GPT-4) to generate a summary of income, expenses, and key financial insights.                                       |
| 4. Send Monthly Finance Report Email | Gmail                     | Sends compiled finance report email | 3. Generate AI Financial Insights   | None                              | Composes and sends the monthly finance report email, including transaction details and AI insights.                             |
| Sticky Note                       | Sticky Note                | Documentation note                  | None                                | None                              | ## Flow                                                                                                                         |
| Sticky Note1                      | Sticky Note                | Documentation note                  | None                                | None                              | # Workflow Documentation: Finance Monthly Report with AI Insight ... [see full content in 5. General Notes & Resources]          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger node:**  
   - Type: Schedule Trigger  
   - Configure to run monthly (set interval to "months").  
   - Position: First node in the workflow.

2. **Create Google Sheets node:**  
   - Name: "1. Get Finance Transactions (Google Sheets)"  
   - Type: Google Sheets  
   - Credentials: Connect and select your Google OAuth2 credentials.  
   - Configuration:  
     - Sheet ID: Enter your Google Sheet ID containing finance data.  
     - Range: Set as `FinanceSummary!A:E`.  
     - Operation: Read data (default).  
   - Connect output from Schedule Trigger node.

3. **Create Function node:**  
   - Name: "2. Filter Previous Month Transactions"  
   - Type: Function  
   - Code:  
   ```javascript
   // Filter transactions for the previous month
   const rows = items.map(item => item.json);

   const now = new Date();
   const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
   const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

   const filtered = rows.filter(row => {
     if (!row.Date) return false;
     const date = new Date(row.Date);
     return date >= lastMonthStart && date <= lastMonthEnd;
   });

   return filtered.map(row => ({ json: row }));
   ```
   - Connect output from Google Sheets node.

4. **Create OpenAI node:**  
   - Name: "3. Generate AI Financial Insights"  
   - Type: OpenAI  
   - Credentials: Connect your OpenAI API key with access to GPT-4.  
   - Configuration:  
     - Model: GPT-4  
     - Prompt:  
       ```
       You are a finance assistant. Analyze the following transaction data. Calculate the total income and total expense for the period. Then, provide 3 concise bullet-point financial insights based on the data. Structure your output clearly:

       Total Income: [Amount]
       Total Expense: [Amount]
       Key Insights:
       - [Insight 1]
       - [Insight 2]
       - [Insight 3]

       Transactions:
       {{JSON.stringify($json, null, 2)}}
       ```
   - Connect output from Function node.

5. **Create Gmail node:**  
   - Name: "4. Send Monthly Finance Report Email"  
   - Type: Gmail  
   - Credentials: Connect via Gmail OAuth2 credentials.  
   - Configuration:  
     - Subject: "Monthly Finance Summary and AI Insights"  
     - Body: Compose an email body that includes:  
       - The filtered transaction table (you may use HTML or plain text formatting).  
       - The AI-generated insights from the OpenAI node output.  
     - Set sender and recipient email addresses accordingly.  
   - Connect output from OpenAI node.

6. **Add Sticky Notes for Documentation (Optional):**  
   - Create Sticky Note nodes to document flow and instructions as needed.

7. **Activate Workflow:**  
   - Save and activate the workflow to run monthly.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Context or Link                                                                                                |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| # Workflow Documentation: Finance Monthly Report with AI Insight<br><br>## Problem<br><br>Many businesses struggle with manual, time-consuming financial reporting processes leading to delayed insights, errors, and underutilization of data.<br><br>## Solution<br><br>This workflow automates monthly financial reporting using Google Sheets, GPT-4 for AI insights, and Gmail for delivery.<br><br>## For Who<br><br>Ideal for SMBs, startup founders, finance managers, and e-commerce businesses.<br><br>## Scope<br><br>Input: Google Sheets with transaction data.<br>AI Model: OpenAI GPT-4.<br>Output: Email reports.<br>Frequency: Monthly.<br><br>## How to Set Up<br><br>1. Import JSON.<br>2. Configure Google Sheets node with sheet ID.<br>3. Set up OpenAI node with API key.<br>4. Configure Gmail node with OAuth2.<br>5. Set schedule.<br>6. Activate.<br><br>**Important:** Consistent data format, monitor token usage, consider error handling. | Full workflow documentation is embedded in Sticky Note1 node within the workflow.                            |
| This workflow leverages OpenAI GPT-4 model. Ensure your OpenAI API key has GPT-4 access and monitor usage to control costs.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | OpenAI API documentation: https://platform.openai.com/docs/models/gpt-4                                         |
| Google Sheets data must include columns: Date, Category, Description, Amount, Type in the "FinanceSummary" sheet tab or update the range accordingly.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Google Sheets setup instructions: https://support.google.com/docs/answer/3093380                                |
| Gmail node requires OAuth2 credentials with permission to send emails on your behalf. Validate authentication before running the workflow.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Gmail OAuth2 setup guide: https://developers.google.com/gmail/api/quickstart/js                                  |
| Consider adding error workflows or alert emails if any node fails (e.g., API errors, missing data) for production robustness.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | n8n error handling docs: https://docs.n8n.io/nodes/trigger-nodes/error-trigger/                                  |

---

**Disclaimer:**  
The provided content is exclusively derived from an automated workflow created using n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and publicly available.