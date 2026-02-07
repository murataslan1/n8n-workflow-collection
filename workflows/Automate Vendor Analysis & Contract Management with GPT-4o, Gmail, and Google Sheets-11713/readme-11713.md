Automate Vendor Analysis & Contract Management with GPT-4o, Gmail, and Google Sheets

https://n8nworkflows.xyz/workflows/automate-vendor-analysis---contract-management-with-gpt-4o--gmail--and-google-sheets-11713


# Automate Vendor Analysis & Contract Management with GPT-4o, Gmail, and Google Sheets

### 1. Workflow Overview

This workflow automates vendor performance analysis and contract management using GPT-4o AI, Gmail, and Google Sheets. It is designed for procurement teams and business analysts to streamline vendor evaluation, contract renewal tracking, and negotiation outreach. The workflow collects vendor pricing, delivery reliability, and contract data; performs AI-powered analysis; and distributes actionable insights via email and spreadsheets.

Logical blocks:

- **1.1 Scheduling & Configuration**: Trigger and configuration setup nodes that start the workflow and provide essential parameters like API URLs and database IDs.
- **1.2 Data Collection**: Scraping vendor pricing, delivery reliability, and contract data from external sources.
- **1.3 Data Aggregation**: Combining scraped data into a unified dataset for AI analysis.
- **1.4 AI-Powered Vendor Analysis**: Using GPT-4o and auxiliary AI tools to analyze vendor pricing, identify overpriced vendors, generate negotiation emails, and prepare renewal tasks.
- **1.5 Conditional Actions & Notifications**: Checking for overpriced vendors and sending negotiation emails.
- **1.6 Contract & Task Updates**: Creating renewal tasks in Google Sheets, updating contract records in Airtable, and tracking potential savings.
- **1.7 Supporting Nodes & Notes**: Sticky notes providing documentation, instructions, and workflow rationale.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduling & Configuration

- **Overview**: This block initiates the workflow on a schedule and sets all configuration parameters needed downstream.
- **Nodes Involved**: Schedule Trigger, Workflow Configuration

**Node Details:**

- **Schedule Trigger**
  - Type: Schedule Trigger
  - Role: Starts workflow daily at 9 AM.
  - Configuration: Trigger set to hour 9 (9 AM) daily.
  - Input: None
  - Output: Triggers Workflow Configuration node.
  - Edge Cases: Possible failure if n8n instance time zone or scheduling misconfigured.

- **Workflow Configuration**
  - Type: Set
  - Role: Defines configuration variables such as URLs for vendor pricing, delivery reliability, Airtable base/table IDs, Google Sheets IDs, and price threshold.
  - Configuration: Multiple string and number parameters with placeholders that must be replaced with real values.
  - Key Expressions: Values are static placeholders; used by later nodes via expression referencing.
  - Input: Trigger from Schedule Trigger
  - Output: Splits to three scraping nodes.
  - Edge Cases: If placeholders are not replaced, HTTP requests and Airtable/Sheets operations will fail.

---

#### 1.2 Data Collection

- **Overview**: Fetches current vendor pricing, delivery reliability data, and contract information from APIs or pages.
- **Nodes Involved**: Scrape Vendor Pricing, Scrape Delivery Reliability, Get Contract Data

**Node Details:**

- **Scrape Vendor Pricing**
  - Type: HTTP Request
  - Role: Retrieves vendor pricing JSON data from configured URL.
  - Configuration: URL dynamically taken from Workflow Configuration node.
  - Input: Workflow Configuration
  - Output: To Merge Vendor Data
  - Edge Cases: HTTP errors, invalid JSON, timeouts, or missing data.

- **Scrape Delivery Reliability**
  - Type: HTTP Request
  - Role: Retrieves delivery reliability JSON data.
  - Configuration: URL from Workflow Configuration.
  - Input: Workflow Configuration
  - Output: To Merge Vendor Data (separate input index)
  - Edge Cases: Same as above.

- **Get Contract Data**
  - Type: Airtable
  - Role: Fetches contract records from Airtable base/table.
  - Configuration: Uses Airtable base ID and table name from Workflow Configuration.
  - Input: Workflow Configuration
  - Output: To Merge Vendor Data
  - Edge Cases: Airtable API auth failure, rate limits, incorrect base/table IDs.

---

#### 1.3 Data Aggregation

- **Overview**: Combines all collected data streams into one unified dataset for analysis.
- **Nodes Involved**: Merge Vendor Data

**Node Details:**

- **Merge Vendor Data**
  - Type: Merge
  - Role: Combines vendor pricing, delivery reliability, and contract data into a single dataset.
  - Configuration: Mode "combine" with option "combineAll" to merge all inputs.
  - Input: Three inputs from Scrape Vendor Pricing, Scrape Delivery Reliability, Get Contract Data
  - Output: To Vendor Analysis Agent
  - Edge Cases: Mismatch in data length or structure may cause incomplete merges.

---

#### 1.4 AI-Powered Vendor Analysis

- **Overview**: Uses GPT-4o and custom tools to analyze vendor data, calculate savings, generate emails, and prepare tasks.
- **Nodes Involved**: Vendor Analysis Agent, OpenAI Chat Model, HTTP Request Tool, Calculate Savings Tool, Structured Output Parser

**Node Details:**

- **Vendor Analysis Agent**
  - Type: Langchain Agent
  - Role: Central AI agent conducting comprehensive vendor analysis.
  - Configuration:
    - System message instructs to analyze pricing, compare alternatives, calculate savings, identify overpriced vendors (based on priceThreshold), evaluate delivery reliability, check renewal dates, generate negotiation emails, create renewal tasks, and update contract records.
    - Uses embedded AI tools: OpenAI Chat Model, HTTP Request Tool (for alternative pricing search), Calculate Savings Tool.
    - Returns structured data.
  - Input: Merged vendor data
  - Output: To Check for Overpriced Vendors and AI tool outputs (Gmail, Airtable, Sheets)
  - Edge Cases: AI API limits, malformed input, unexpected output format, parsing errors.

- **OpenAI Chat Model**
  - Type: Langchain LM Chat OpenAI
  - Role: GPT-4o model for language generation tasks.
  - Configuration: Model set to "gpt-4o", uses OpenAI credentials.
  - Input/Output: Used internally as AI tool by Vendor Analysis Agent.
  - Edge Cases: API key issues, rate limits, model availability.

- **HTTP Request Tool**
  - Type: HTTP Request Tool
  - Role: Searches online for alternative vendor pricing as directed by AI.
  - Configuration: URL dynamically provided by AI output.
  - Input/Output: Invoked by Vendor Analysis Agent.
  - Edge Cases: Invalid URLs, HTTP errors.

- **Calculate Savings Tool**
  - Type: Langchain Tool Code (JavaScript)
  - Role: Calculates potential savings comparing current and alternative prices.
  - Configuration: JavaScript code parsing input JSON, computing savings amount and percentage, and providing recommendation.
  - Input/Output: Invoked by Vendor Analysis Agent.
  - Edge Cases: Invalid price inputs, JSON parsing errors.

- **Structured Output Parser**
  - Type: Langchain Output Parser Structured
  - Role: Parses AI output into a strict schema with properties like vendorName, currentPrice, alternativePrice, priceDifference, isOverpriced, deliveryReliability, contractRenewalDate, negotiationEmail, and potentialSavings.
  - Configuration: Manual JSON schema defining expected output structure.
  - Input: AI output from Vendor Analysis Agent
  - Output: Parsed data for conditional logic and further processing.
  - Edge Cases: AI output not conforming to schema, parse failures.

---

#### 1.5 Conditional Actions & Notifications

- **Overview**: Checks for overpriced vendors and sends negotiation emails accordingly.
- **Nodes Involved**: Check for Overpriced Vendors, Send Negotiation Email

**Node Details:**

- **Check for Overpriced Vendors**
  - Type: If
  - Role: Evaluates if the vendor is marked as overpriced (boolean flag).
  - Configuration: Condition checks if `isOverpriced` is true from AI output.
  - Input: Vendor Analysis Agent output
  - Output: True branch to Send Negotiation Email; false branch effectively skips email.
  - Edge Cases: Missing or malformed boolean flag, logic errors.

- **Send Negotiation Email**
  - Type: Gmail
  - Role: Sends negotiation email to vendor contact.
  - Configuration: 
    - Recipient email from AI output field `vendorEmail`.
    - Email subject includes vendor name.
    - Email body from AI-generated negotiationEmail content.
    - Uses Gmail OAuth2 credentials.
  - Input: True branch from Check for Overpriced Vendors
  - Output: To Create Renewal Tasks node
  - Edge Cases: Gmail API auth failures, invalid email addresses, message formatting issues.

---

#### 1.6 Contract & Task Updates

- **Overview**: Creates contract renewal tasks in Google Sheets, updates Airtable contract entries, and logs savings.
- **Nodes Involved**: Create Renewal Tasks, Update Contract Database, Track Savings

**Node Details:**

- **Create Renewal Tasks**
  - Type: Google Sheets
  - Role: Appends or updates renewal task entries in Google Sheets.
  - Configuration:
    - Uses sheet named "Tasks".
    - Document ID from Workflow Configuration.
    - Columns mapped include Status, Vendor Name, Task Description, Contract Renewal Date.
  - Input: Output from Send Negotiation Email
  - Output: To Update Contract Database
  - Edge Cases: Google Sheets API permission errors, invalid document ID, row matching issues.

- **Update Contract Database**
  - Type: Airtable
  - Role: Updates contract records with pricing, overpriced status, and savings info.
  - Configuration:
    - Base and table IDs from Workflow Configuration.
    - Updates by matching record ID.
    - Fields updated: Pricing, Overpriced Status, Potential Savings.
  - Input: Output from Create Renewal Tasks
  - Output: To Track Savings
  - Edge Cases: Airtable API errors, missing record IDs, data type mismatch.

- **Track Savings**
  - Type: Google Sheets
  - Role: Logs savings data for tracking and reporting.
  - Configuration:
    - Uses sheet named "Savings".
    - Document ID from Workflow Configuration.
    - Columns include date (current date), status, vendorName, potentialSavings.
  - Input: Output from Update Contract Database
  - Output: None (end of chain)
  - Edge Cases: Similar to Create Renewal Tasks node.

---

#### 1.7 Supporting Nodes & Notes

- **Overview**: Sticky notes that provide documentation, setup instructions, use cases, and benefits.
- **Nodes Involved**: Multiple Sticky Note nodes scattered visually near logical blocks.

**Node Details:**

- Sticky Note (positioned at upper left)
  - Content includes workflow benefits, customization tips, use cases, prerequisites, setup steps, and detailed explanation of workflow operation.
- Purpose: Aid users to understand, customize, and maintain workflow.
- Edge Cases: None (documentation only).

---

### 3. Summary Table

| Node Name              | Node Type                    | Functional Role                          | Input Node(s)                     | Output Node(s)                    | Sticky Note                                                                                                                                                         |
|------------------------|------------------------------|----------------------------------------|----------------------------------|----------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Schedule Trigger       | Schedule Trigger             | Starts workflow daily                   | None                             | Workflow Configuration           | ## Setup Steps 1. Configure Schedule Trigger timing. 2. Add scraper credentials...                                                                                 |
| Workflow Configuration | Set                          | Defines all configuration parameters   | Schedule Trigger                 | Scrape Vendor Pricing, Scrape Delivery Reliability, Get Contract Data | ## Setup Steps 1. Configure Schedule Trigger timing. 2. Add scraper credentials...                                                                                 |
| Scrape Vendor Pricing  | HTTP Request                 | Fetch vendor pricing data               | Workflow Configuration           | Merge Vendor Data                | ## Data Collection: Trigger initiates automated scraping...                                                                                                       |
| Scrape Delivery Reliability | HTTP Request             | Fetch delivery reliability data        | Workflow Configuration           | Merge Vendor Data                | ## Data Collection: Trigger initiates automated scraping...                                                                                                       |
| Get Contract Data      | Airtable                     | Get contract records                    | Workflow Configuration           | Merge Vendor Data                | ## Data Collection: Trigger initiates automated scraping...                                                                                                       |
| Merge Vendor Data      | Merge                        | Combine all vendor-related data         | Scrape Vendor Pricing, Scrape Delivery Reliability, Get Contract Data | Vendor Analysis Agent            | ## Intelligent Analysis: Data flows to vendor analysis agent powered by AI.                                                                                       |
| Vendor Analysis Agent  | Langchain Agent              | AI-powered vendor analysis              | Merge Vendor Data                | Check for Overpriced Vendors, Gmail Tool, Airtable Tool, HTTP Request Tool, Calculate Savings Tool, Google Sheets Tool | ## Intelligent Analysis: Data flows to vendor analysis agent powered by AI.                                                                                       |
| OpenAI Chat Model      | Langchain LM Chat OpenAI     | Language model for AI tasks             | Invoked by Vendor Analysis Agent | Vendor Analysis Agent           | ## Intelligent Analysis: Data flows to vendor analysis agent powered by AI.                                                                                       |
| HTTP Request Tool      | HTTP Request Tool            | Search alternative vendor pricing online | Invoked by Vendor Analysis Agent | Vendor Analysis Agent           | ## Intelligent Analysis: Data flows to vendor analysis agent powered by AI.                                                                                       |
| Calculate Savings Tool | Langchain Tool Code          | Calculate savings from pricing data    | Invoked by Vendor Analysis Agent | Vendor Analysis Agent           | ## Intelligent Analysis: Data flows to vendor analysis agent powered by AI.                                                                                       |
| Structured Output Parser | Langchain Output Parser Structured | Parse AI output into structured data  | Vendor Analysis Agent            | Check for Overpriced Vendors     | ## Multi-Channel Distribution: Agent branches outputs to Gmail, Google Sheets, and data parser.                                                                   |
| Check for Overpriced Vendors | If                       | Check overpriced flag to conditionally send emails | Vendor Analysis Agent            | Send Negotiation Email           | ## Multi-Channel Distribution: Agent branches outputs to Gmail, Google Sheets, and data parser.                                                                   |
| Send Negotiation Email | Gmail                        | Send negotiation email to vendor       | Check for Overpriced Vendors     | Create Renewal Tasks             | ## Multi-Channel Distribution: Agent branches outputs to Gmail, Google Sheets, and data parser.                                                                   |
| Create Renewal Tasks   | Google Sheets                | Create/update renewal tasks in Sheets  | Send Negotiation Email           | Update Contract Database         | ## Multi-Channel Distribution: Agent branches outputs to Gmail, Google Sheets, and data parser.                                                                   |
| Update Contract Database | Airtable                   | Update contract records with analysis  | Create Renewal Tasks             | Track Savings                   | ## Multi-Channel Distribution: Agent branches outputs to Gmail, Google Sheets, and data parser.                                                                   |
| Track Savings          | Google Sheets                | Log potential savings                   | Update Contract Database         | None                           | ## Multi-Channel Distribution: Agent branches outputs to Gmail, Google Sheets, and data parser.                                                                   |
| Sticky Note (several)  | Sticky Note                  | Documentation and instructions         | None                            | None                           | Various notes covering benefits, customization, setup, use cases, and workflow overview (see detailed content in section 2.7).                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node**
   - Type: Schedule Trigger
   - Set to trigger daily at 9 AM
   - Connect output to next node

2. **Create a Set node named "Workflow Configuration"**
   - Define parameters:
     - vendorPricingUrl (string): Set to your vendor pricing API or webpage URL
     - deliveryReliabilityUrl (string): Set to delivery reliability API or webpage URL
     - priceThreshold (number): e.g., 10 (percentage to flag overpriced vendors)
     - contractDatabaseId (string): Airtable base ID for contracts
     - contractTableName (string): Airtable table name for contracts
     - tasksSheetId (string): Google Sheets ID for renewal tasks
     - savingsSheetId (string): Google Sheets ID for savings tracking
   - Connect input from Schedule Trigger

3. **Add three data collection nodes:**

   - **HTTP Request node "Scrape Vendor Pricing"**
     - URL: Expression referencing `vendorPricingUrl` from Workflow Configuration node
     - Response format: JSON
     - Connect input from Workflow Configuration

   - **HTTP Request node "Scrape Delivery Reliability"**
     - URL: Expression referencing `deliveryReliabilityUrl` from Workflow Configuration node
     - Response format: JSON
     - Connect input from Workflow Configuration

   - **Airtable node "Get Contract Data"**
     - Operation: Search
     - Base ID and table name from Workflow Configuration
     - Connect input from Workflow Configuration

4. **Create a Merge node "Merge Vendor Data"**
   - Mode: Combine
   - Combine by: combineAll
   - Connect inputs from the three data collection nodes

5. **Create the AI vendor analysis block:**

   - **Langchain Agent node "Vendor Analysis Agent"**
     - Input: merged vendor data from Merge Vendor Data node
     - System message instructing analysis tasks as described in overview
     - Attach AI tools:
       - OpenAI Chat Model node (model: gpt-4o, with OpenAI API credentials)
       - HTTP Request Tool node for searching alternative vendor pricing (configured with dynamic URL)
       - Calculate Savings Tool node with provided JS code to compute savings
     - Enable structured output parsing with the Structured Output Parser node (define schema as per workflow)
     - Connect output to Check for Overpriced Vendors node and AI tools (Gmail Tool, Airtable Tool, Google Sheets Tool)

6. **Create Structured Output Parser node**
   - Manual schema for structured AI output parsing
   - Connect input from Vendor Analysis Agent

7. **Create an If node "Check for Overpriced Vendors"**
   - Condition: Boolean true if `isOverpriced` is true in parsed AI output
   - Connect input from Vendor Analysis Agent output
   - True branch connects to Send Negotiation Email

8. **Create Gmail node "Send Negotiation Email"**
   - Configure Gmail OAuth2 credentials
   - Send to email address from AI output field `vendorEmail`
   - Subject: "Negotiation Request: {{vendorName}}"
   - Message body: AI-generated negotiation email content
   - Connect input from True branch of Check for Overpriced Vendors
   - Connect output to Create Renewal Tasks

9. **Create Google Sheets node "Create Renewal Tasks"**
   - Operation: Append or update
   - Sheet name: Tasks
   - Document ID from Workflow Configuration
   - Map columns: Status, Vendor Name, Task Description, Contract Renewal Date from AI output fields
   - Connect input from Send Negotiation Email
   - Connect output to Update Contract Database

10. **Create Airtable node "Update Contract Database"**
    - Operation: Update record
    - Base ID and table name from Workflow Configuration
    - Map record ID and fields Pricing, Overpriced Status, Potential Savings
    - Connect input from Create Renewal Tasks
    - Connect output to Track Savings

11. **Create Google Sheets node "Track Savings"**
    - Operation: Append or update
    - Sheet name: Savings
    - Document ID from Workflow Configuration
    - Map columns: date (current date), status, vendorName, potentialSavings from AI output
    - Connect input from Update Contract Database

12. **Create supporting Sticky Note nodes with documentation and instructions**
    - Add text notes for benefits, setup steps, prerequisites, customization, use cases, and workflow overview.
    - Position notes visually near relevant blocks.

13. **Configure all credentials:**
    - OpenAI API key for GPT-4o
    - Gmail OAuth2 credentials for sending emails
    - Google Sheets OAuth2 credentials for accessing sheets
    - Airtable API credentials

14. **Test the workflow end-to-end**
    - Replace placeholder URLs and IDs with actual values.
    - Trigger manually to ensure data flows correctly and AI produces expected outputs.
    - Monitor for errors and adjust configurations as needed.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                      | Context or Link                                                                                             |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| Eliminates manual data gathering (hours to minutes), ensures consistent vendor evaluation criteria.                                                             | Sticky Note near Schedule Trigger and Workflow Configuration                                               |
| Modify trigger schedule, add/remove scraper nodes for new vendors, adjust AI prompt for different analysis criteria.                                            | Sticky Note near workflow top center                                                                       |
| Automate weekly vendor performance reviews, generate compliance reports for procurement teams.                                                                  | Sticky Note near workflow top right                                                                        |
| Prerequisites include OpenAI/Claude API key, Gmail credentials, Google Sheets API access, and vendor data sources (web scrapers or APIs).                      | Sticky Note near workflow middle right                                                                     |
| Setup steps emphasize configuring schedule, scraper credentials, AI API keys, Gmail and Google Sheets authentications.                                          | Sticky Note near workflow middle left                                                                      |
| Workflow overview: schedules automated vendor pricing analysis, fetches delivery and contract data, performs AI analysis, distributes reports via Gmail and Sheets. | Sticky Note near workflow top left                                                                         |
| Data Collection block eliminates manual info gathering, ensuring current vendor data.                                                                            | Sticky Note near data collection nodes                                                                     |
| Intelligent Analysis block replaces manual review with AI-driven insights and pattern recognition.                                                              | Sticky Note near AI nodes                                                                                   |
| Multi-Channel Distribution: AI agent routes output to Gmail, Google Sheets, and structured data parsers for alerts, records, and reporting.                    | Sticky Note near output/action nodes                                                                       |

---

**Disclaimer:** The text above originates exclusively from an automated n8n workflow. It complies fully with content policies and contains no illegal, offensive, or protected elements. All processed data are legal and publicly available.