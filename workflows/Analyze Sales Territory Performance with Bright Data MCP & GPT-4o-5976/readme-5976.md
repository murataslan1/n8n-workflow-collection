Analyze Sales Territory Performance with Bright Data MCP & GPT-4o

https://n8nworkflows.xyz/workflows/analyze-sales-territory-performance-with-bright-data-mcp---gpt-4o-5976


# Analyze Sales Territory Performance with Bright Data MCP & GPT-4o

---

### 1. Workflow Overview

This workflow automates the weekly analysis of sales territory performance by scraping live regional sales data, processing it into structured records, updating a Google Sheets tracking document, and sending notification emails to relevant stakeholders. It is designed for sales operations teams or small business owners who want reliable, up-to-date insights into their store territories without manual intervention.

The workflow is logically divided into three main functional blocks:

- **1.1 Trigger & Prepare**: Automatically initiates the workflow on a weekly schedule and prepares parameters for data scraping.
- **1.2 Smart Data Collection & Parsing**: Uses AI-powered scraping tools and language models to dynamically collect, fix, and structure sales data from target sources.
- **1.3 Process, Save & Notify**: Transforms the scraped data into individual records, appends them into a Google Sheet, and sends notification emails summarizing updates.

---

### 2. Block-by-Block Analysis

#### 1.1 Trigger & Prepare

**Overview:**  
This block starts the workflow automatically every week and sets up the request parameters such as target URL or regions for the scraping step. It enables simple configuration changes without modifying the core logic.

**Nodes Involved:**  
- Weekly Territory Check  
- Prepare Request Params

**Node Details:**

- **Weekly Territory Check**  
  - Type: Schedule Trigger  
  - Role: Initiates workflow execution weekly, specifically every Monday at 9 AM.  
  - Configuration: Interval set to trigger weekly on Monday at 9:00.  
  - I/O: No input; outputs trigger signal to "Prepare Request Params".  
  - Failures: Potential misconfiguration if schedule is changed improperly.  
  - Version: 1.2

- **Prepare Request Params**  
  - Type: Set  
  - Role: Defines key parameters for the scraping step, such as the target URL (currently set as "example.com").  
  - Configuration: Static assignment of `url` parameter; can be edited to target different sites or regions.  
  - I/O: Input from "Weekly Territory Check"; output to "Run Bright Data Scraper".  
  - Failures: If parameters are malformed or missing, scraping may fail.  
  - Version: 3.4

---

#### 1.2 Smart Data Collection & Parsing

**Overview:**  
This block performs advanced AI-driven web scraping and data parsing. It orchestrates an AI Agent that interacts with the Bright Data MCP tool and OpenAI language models to extract, clean, and validate sales data from live sources, ensuring output is well-structured JSON suitable for downstream processing.

**Nodes Involved:**  
- Run Bright Data Scraper  
- Bright Data MCP Tool  
- LLM Prompt Handler  
- Auto-fixing Output Parser  
- OpenAI Chat Model  
- Structured Output Parser1

**Node Details:**

- **Run Bright Data Scraper**  
  - Type: Langchain Agent (AI Agent)  
  - Role: Coordinates scraping and parsing tasks by leveraging AI tools and language models.  
  - Configuration: Uses prompt to extract specific fields (Store ID, Name, Address, Region) from the provided URL parameter.  
  - I/O: Input from "Prepare Request Params", outputs to "Split Stores to Items" and "Send Notification Email".  
  - Dependencies: Uses outputs from "Bright Data MCP Tool" and "LLM Prompt Handler".  
  - Failures: Network errors, invalid prompts, or changes in source site structure may cause scraping issues.  
  - Version: 2

- **Bright Data MCP Tool**  
  - Type: MCP Client Tool  
  - Role: Executes the actual web scraping task, providing live data extraction capabilities.  
  - Configuration: Uses the "scrape_as_markdown" tool operation with dynamic parameters.  
  - Credentials: Requires MCP Client API credentials for authentication.  
  - I/O: Output feeds into "Run Bright Data Scraper".  
  - Failures: Authentication errors, rate limits, or site blocking can cause failure.  
  - Version: 1

- **LLM Prompt Handler**  
  - Type: Langchain OpenAI Chat Model  
  - Role: Provides intelligent prompt handling to guide scraping, such as deciding which pages to crawl and how to parse content.  
  - Configuration: Uses GPT-4o-mini model with standard options.  
  - Credentials: OpenAI API key required.  
  - I/O: Output feeds into "Run Bright Data Scraper".  
  - Failures: API quota exceeded, prompt errors, or model unavailability.  
  - Version: 1.2

- **Auto-fixing Output Parser**  
  - Type: Langchain Output Parser (Autofixing)  
  - Role: Automatically detects and corrects formatting issues in scraped data to guarantee valid JSON output.  
  - I/O: Input from "OpenAI Chat Model", output feeds into "Run Bright Data Scraper".  
  - Failures: Complex data errors may not be fully auto-corrected.  
  - Version: 1

- **OpenAI Chat Model**  
  - Type: Langchain OpenAI Chat Model  
  - Role: Acts as a validation assistant or secondary AI model for data validation and cleanup.  
  - Configuration: Uses GPT-4o-mini model.  
  - Credentials: OpenAI API key required.  
  - I/O: Feeds into "Auto-fixing Output Parser".  
  - Failures: Similar to other OpenAI nodes.  
  - Version: 1.2

- **Structured Output Parser1**  
  - Type: Langchain Structured Output Parser  
  - Role: Parses the cleaned JSON into a predefined schema example ensuring consistent structure for downstream nodes.  
  - Configuration: Uses a JSON schema example with fields like store_id, store_name, address, region, estimated_sales, last_updated.  
  - I/O: Input from "Auto-fixing Output Parser".  
  - Failures: Schema mismatches or unexpected data formats.  
  - Version: 1.2

---

#### 1.3 Process, Save & Notify

**Overview:**  
This block processes the structured sales data into individual store records, appends them to a Google Sheets document for record-keeping, and sends an email notification summarizing the update to designated recipients.

**Nodes Involved:**  
- Split Stores to Items  
- Update Regional Data Sheet  
- Send Notification Email

**Node Details:**

- **Split Stores to Items**  
  - Type: Code (JavaScript)  
  - Role: Transforms one large JSON array of stores into individual n8n items (one per store) for granular processing.  
  - Code Logic: Iterates over `items[0].json.output` array and returns each store as a separate item.  
  - Input: From "Run Bright Data Scraper".  
  - Output: To "Update Regional Data Sheet".  
  - Failures: If input data is missing or malformed, the code may throw errors.  
  - Version: 2

- **Update Regional Data Sheet**  
  - Type: Google Sheets  
  - Role: Appends each store's data as a new row in a Google Sheet, maintaining an up-to-date sales territory record.  
  - Configuration:  
    - Operation: Append  
    - Document ID: Points to a specific Google Sheets document.  
    - Sheet Name: "Sheet1" (gid=0)  
    - Columns mapped: Region, Address, Store ID, Store name, Last updated, Estimated sales — all dynamically from JSON fields.  
  - Credentials: Requires Google Sheets OAuth2 credentials.  
  - Input: From "Split Stores to Items".  
  - Failures: Authentication issues, quota limits, or sheet access permissions.  
  - Version: 4.6

- **Send Notification Email**  
  - Type: Gmail (SMTP via OAuth2)  
  - Role: Sends a notification email to alert the team that the regional sales data has been updated.  
  - Configuration:  
    - Recipient: shahkar.genai@gmail.com  
    - Subject: "Regional Sales data has updated"  
    - Message: Text body informing the team to check updated Google Sheets.  
  - Credentials: Gmail OAuth2 credentials required.  
  - Input: From "Run Bright Data Scraper" (in parallel with "Split Stores to Items").  
  - Failures: Email quota, invalid recipient, or OAuth token expiration.  
  - Version: 2.1

---

### 3. Summary Table

| Node Name                | Node Type                     | Functional Role                          | Input Node(s)           | Output Node(s)                  | Sticky Note                                                                                   |
|--------------------------|-------------------------------|----------------------------------------|-------------------------|--------------------------------|-----------------------------------------------------------------------------------------------|
| Weekly Territory Check    | Schedule Trigger              | Weekly automated workflow trigger      | —                       | Prepare Request Params          | ✅ Section 1: Trigger & Prepare — Weekly trigger and input parameter setup                    |
| Prepare Request Params    | Set                          | Define scraping request parameters     | Weekly Territory Check   | Run Bright Data Scraper         | ✅ Section 1: Trigger & Prepare — Easy parameter adjustment                                 |
| Run Bright Data Scraper   | Langchain AI Agent           | Orchestrates AI scraping & parsing     | Prepare Request Params, Bright Data MCP Tool, LLM Prompt Handler | Split Stores to Items, Send Notification Email | ✅ Section 2: Smart Data Collection & Parsing — AI-driven scraping and data cleaning         |
| Bright Data MCP Tool      | MCP Client Tool              | Executes live data scraping             | — (used by Run Bright Data Scraper) | Run Bright Data Scraper         | ✅ Section 2: Smart Data Collection & Parsing — Handles live scraping with Bright Data MCP    |
| LLM Prompt Handler       | Langchain OpenAI Chat Model  | Provides prompt intelligence for scraping | — (used by Run Bright Data Scraper) | Run Bright Data Scraper         | ✅ Section 2: Smart Data Collection & Parsing — Assists AI agent with scraping logic          |
| Auto-fixing Output Parser | Langchain Output Parser      | Auto-corrects scraped data formatting  | OpenAI Chat Model        | Run Bright Data Scraper         | ✅ Section 2: Smart Data Collection & Parsing — Cleans and fixes scraped data                  |
| OpenAI Chat Model        | Langchain OpenAI Chat Model  | Validates and helps parse data         | —                       | Auto-fixing Output Parser       | ✅ Section 2: Smart Data Collection & Parsing — Secondary AI validation                        |
| Structured Output Parser1 | Langchain Structured Parser  | Parses final structured JSON data      | Auto-fixing Output Parser | Auto-fixing Output Parser       | ✅ Section 2: Smart Data Collection & Parsing — Ensures data matches expected schema          |
| Split Stores to Items     | Code (JavaScript)             | Splits bulk output into single store items | Run Bright Data Scraper | Update Regional Data Sheet      | ✅ Section 3: Process, Save & Notify — Splits data for individual processing                  |
| Update Regional Data Sheet | Google Sheets                | Appends store data to Google Sheets    | Split Stores to Items    | —                              | ✅ Section 3: Process, Save & Notify — Saves data for team visibility                         |
| Send Notification Email   | Gmail                        | Sends update notification email        | Run Bright Data Scraper  | —                              | ✅ Section 3: Process, Save & Notify — Notifies team of updated data                          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Name: `Weekly Territory Check`  
   - Set to trigger weekly every Monday at 9:00 AM  
   - No credentials needed

2. **Create Set Node for Parameters**  
   - Type: Set  
   - Name: `Prepare Request Params`  
   - Add field `url` (string) with default value `"example.com"`  
   - Connect output of `Weekly Territory Check` to this node

3. **Create MCP Client Tool Node**  
   - Type: MCP Client Tool (n8n-nodes-mcp.mcpClientTool)  
   - Name: `Bright Data MCP Tool`  
   - Configure tool: toolName = "scrape_as_markdown", operation = "executeTool"  
   - Set toolParameters as dynamic JSON (can be empty or customized)  
   - Attach valid MCP Client API credentials (MCP Client (STDIO) account)

4. **Create OpenAI Chat Model Node**  
   - Type: Langchain OpenAI Chat Model  
   - Name: `LLM Prompt Handler`  
   - Model: Select `gpt-4o-mini`  
   - Attach valid OpenAI API credentials

5. **Create Langchain AI Agent Node**  
   - Type: Langchain Agent (n8n-nodes-base.langchain.agent)  
   - Name: `Run Bright Data Scraper`  
   - Prompt:  
     ```
     From the following URL, extract fields the below fields.

     Store ID
     Name
     Address
     Region

     URL: {{ $json.url }}
     ```  
   - Connect inputs from `Prepare Request Params`, `Bright Data MCP Tool` (as ai_tool), and `LLM Prompt Handler` (as ai_languageModel)  
   - Connect output to `Split Stores to Items` and `Send Notification Email`

6. **Create Langchain OpenAI Chat Model Node**  
   - Type: Langchain OpenAI Chat Model  
   - Name: `OpenAI Chat Model` (secondary validation)  
   - Model: `gpt-4o-mini`  
   - Attach OpenAI credentials  
   - Connect output to `Auto-fixing Output Parser`

7. **Create Langchain Output Parser Node**  
   - Type: Output Parser Autofixing  
   - Name: `Auto-fixing Output Parser`  
   - Connect input from `OpenAI Chat Model`  
   - Connect output to `Run Bright Data Scraper`

8. **Create Langchain Structured Output Parser Node**  
   - Type: Output Parser Structured  
   - Name: `Structured Output Parser1`  
   - Provide JSON schema example with fields: store_id, store_name, address, region, estimated_sales, last_updated  
   - Connect input from `Auto-fixing Output Parser`

9. **Create Code Node**  
   - Type: Code (JavaScript)  
   - Name: `Split Stores to Items`  
   - Paste JavaScript code to iterate over `items[0].json.output` and output each store as a separate item  
   - Connect input from `Run Bright Data Scraper`  
   - Connect output to `Update Regional Data Sheet`

10. **Create Google Sheets Node**  
    - Type: Google Sheets  
    - Name: `Update Regional Data Sheet`  
    - Operation: Append rows  
    - Configure Document ID and Sheet name (gid=0, Sheet1)  
    - Map columns: Region, Address, Store ID, Store name, Last updated, Estimated sales from respective JSON fields  
    - Attach Google Sheets OAuth2 credentials  
    - Connect input from `Split Stores to Items`

11. **Create Gmail Node**  
    - Type: Gmail  
    - Name: `Send Notification Email`  
    - Recipient: `shahkar.genai@gmail.com`  
    - Subject: "Regional Sales data has updated"  
    - Message body: Inform team to check updated Google Sheets  
    - Attach Gmail OAuth2 credentials  
    - Connect input from `Run Bright Data Scraper`

12. **Verify connections and test end-to-end**  
    - Ensure nodes are connected as per above  
    - Validate credentials  
    - Test workflow with manual trigger or wait for scheduled run

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                     | Context or Link                                                                                  |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| I’ll receive a tiny commission if you join Bright Data through this link—thanks for fueling more free content! https://get.brightdata.com/1tndi4600b25                                                                                           | Affiliate link for Bright Data MCP tool                                                         |
| Workflow assistance contact: Yaron@nofluff.online. Explore more tips and tutorials at YouTube: https://www.youtube.com/@YaronBeen/videos and LinkedIn: https://www.linkedin.com/in/yaronbeen/                                                      | Support and additional learning resources                                                       |
| Purpose: Automates weekly scraping, parsing, saving, and notification for sales territory performance analysis — ideal for no-code, scalable sales operations monitoring.                                                                          | Workflow purpose summary                                                                        |
| Visual summary with icons and sections guides quick understanding of workflow structure and flow.                                                                                                                                               | Visualization guidance                                                                           |

---

**Disclaimer:**  
The text and information provided come exclusively from an automated workflow created in n8n, respecting all current content policies and using only legal, public data. No illegal or protected content is involved.

---