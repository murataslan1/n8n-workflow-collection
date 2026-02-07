Analyze Amazon Purchase Trends with Bright Data, OpenAI and Google Sheets

https://n8nworkflows.xyz/workflows/analyze-amazon-purchase-trends-with-bright-data--openai-and-google-sheets-5961


# Analyze Amazon Purchase Trends with Bright Data, OpenAI and Google Sheets

### 1. Workflow Overview

This n8n workflow automates the analysis of Amazon product purchase trends by integrating data scraping, AI-driven evaluation, and Google Sheets updates. It is designed for users who want to monitor and score multiple Amazon products efficiently without manual research.

The workflow is divided into three main logical blocks:

- **1.1 Trigger & Input Retrieval:** Initiates the workflow manually and reads Amazon product URLs from a Google Sheet.
- **1.2 AI Processing & Data Scraping:** Uses Bright Data’s MCP Client to scrape Amazon product data via a proxy, processes this data with an AI agent leveraging OpenAI models, and parses the AI output into structured JSON.
- **1.3 Output & Update:** Updates the original Google Sheet with the enriched product insights including sales, stock, reviews, and AI-generated performance rating.

---

### 2. Block-by-Block Analysis

#### 1.1 Trigger & Input Retrieval

**Overview:**  
This block starts the workflow on manual execution and fetches a list of Amazon product URLs from a specified Google Sheet, preparing the input for further analysis.

**Nodes Involved:**  
- When clicking ‘Execute workflow’  
- Fetch Amazon URLs from Google Sheets

**Node Details:**

- **When clicking ‘Execute workflow’**  
  - Type: Manual Trigger  
  - Role: Initiates workflow execution on user command.  
  - Configuration: Default manual trigger, no parameters.  
  - Inputs: None  
  - Outputs: Triggers next node  
  - Edge Cases: No trigger event means workflow won’t run.  
  - Version: v1  
  - Sub-workflow: None  

- **Fetch Amazon URLs from Google Sheets**  
  - Type: Google Sheets Node  
  - Role: Reads product URLs from a Google Sheet document and sheet tab.  
  - Configuration:  
    - Document ID set to the Google Sheet with product URLs.  
    - Sheet name set to the first tab (`gid=0`).  
    - No filters or row limits, fetches all rows.  
  - Credentials: Google Sheets OAuth2  
  - Inputs: Manual Trigger output  
  - Outputs: JSON array of rows, each containing a URL and row number.  
  - Edge Cases:  
    - Authentication errors if credentials expire.  
    - Empty or malformed sheet rows.  
  - Version: 4.6  
  - Sub-workflow: None

---

#### 1.2 AI Processing & Data Scraping

**Overview:**  
This block orchestrates an AI agent that scrapes Amazon product data using Bright Data’s MCP Client proxy service, then processes and interprets the data with OpenAI models to generate structured insights and a performance rating.

**Nodes Involved:**  
- Amazon Product Analyzer (AI Agent)  
- OpenAI Chat Model  
- Tool: MCP Client (Bright Data)  
- Auto-fixing Output Parser  
- OpenAI Chat Model1  
- Structured Output Parser

**Node Details:**

- **Amazon Product Analyzer (AI Agent)**  
  - Type: Langchain AI Agent Node  
  - Role: Central orchestrator passing each product URL to the scraper tool and processing AI responses.  
  - Configuration:  
    - Prompt instructs extraction of units sold, price, stock, reviews, rating, sales rank, and performance rating out of 10 from the URL.  
    - Output parser enabled for structured results.  
  - Inputs: Product URLs from Google Sheets  
  - Outputs: Parsed product insights JSON  
  - Edge Cases:  
    - Failures in tool invocation or AI response parsing.  
    - Incorrect or unreachable URLs.  
  - Version: 2  

- **OpenAI Chat Model**  
  - Type: Langchain OpenAI Chat Model  
  - Role: Provides the AI language model (GPT-4o-mini) for interpreting and rating product data.  
  - Configuration: Uses GPT-4o-mini model with default options.  
  - Credentials: OpenAI API key  
  - Inputs: From AI Agent (as language model)  
  - Outputs: AI-generated textual responses  
  - Edge Cases:  
    - API rate limits, authentication failures.  
    - Latency or timeout errors.  
  - Version: 1.2  

- **Tool: MCP Client (Bright Data)**  
  - Type: Bright Data MCP Client Tool  
  - Role: Scrapes product data from Amazon using Bright Data’s proxy to avoid detection.  
  - Configuration: Tool parameters dynamically passed from AI agent overrides.  
  - Credentials: Bright Data MCP Client API  
  - Inputs: AI Agent tool invocation  
  - Outputs: Raw scraped product data  
  - Edge Cases:  
    - Proxy service downtime or quota exhaustion.  
    - Incorrect tool parameters leading to scrape failure.  
  - Version: 1  

- **Auto-fixing Output Parser**  
  - Type: Langchain Output Parser Autofixing  
  - Role: Automatically fixes and cleans AI response formatting issues to facilitate structured parsing.  
  - Configuration: Default autofixing options enabled.  
  - Inputs: AI responses from OpenAI Chat Model1  
  - Outputs: Fixed output for structured parsing  
  - Edge Cases:  
    - Complex malformed outputs that cannot be fixed automatically.  
  - Version: 1  

- **OpenAI Chat Model1**  
  - Type: Langchain OpenAI Chat Model  
  - Role: Secondary AI model instance used to assist output parsing improvements.  
  - Configuration: GPT-4o-mini model, default options.  
  - Credentials: OpenAI API key  
  - Inputs: None explicitly, used internally by output parser  
  - Outputs: Improved AI response format  
  - Edge Cases: Same as other OpenAI node  
  - Version: 1.2  

- **Structured Output Parser**  
  - Type: Langchain Structured Output Parser  
  - Role: Converts AI text output into JSON objects that align with the expected schema.  
  - Configuration: JSON schema example provided for product data fields such as product_name, units_sold_last_month, current_price, stock_status, review_count, rating, sales_rank, performance_rating.  
  - Inputs: Autofixed output from Auto-fixing Output Parser  
  - Outputs: JSON array of structured product insights  
  - Edge Cases:  
    - Output that deviates from schema can cause parsing failures.  
  - Version: 1.2

---

#### 1.3 Output & Update

**Overview:**  
This block updates the original Google Sheet with the enriched product data including sales, price, stock, reviews, rank, and AI-generated performance rating.

**Nodes Involved:**  
- Update Sheet with Product Insights

**Node Details:**

- **Update Sheet with Product Insights**  
  - Type: Google Sheets Node  
  - Role: Updates existing rows in the Google Sheet with new product insight fields.  
  - Configuration:  
    - Uses "Update" operation targeting the same sheet and document ID as in fetching.  
    - Matches rows by `row_number` to update corresponding entries.  
    - Writes columns: Ranking, Sales rank, Units sold, Current price, Stock availability, Review count & rating.  
  - Credentials: Google Sheets OAuth2  
  - Inputs: Structured product insights JSON from AI Agent  
  - Outputs: Confirmation of update operation  
  - Edge Cases:  
    - Row matching failures if row_number is missing or mismatched.  
    - Authentication or quota issues with Google Sheets API.  
  - Version: 4.6  

---

### 3. Summary Table

| Node Name                         | Node Type                             | Functional Role                          | Input Node(s)                    | Output Node(s)                   | Sticky Note                                                                                              |
|----------------------------------|-------------------------------------|----------------------------------------|---------------------------------|---------------------------------|---------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger                      | Starts the workflow manually           | None                            | Fetch Amazon URLs from Google Sheets | Section 1: Trigger & Read Product URLs: starts on manual execution, fetches URLs from Google Sheets.    |
| Fetch Amazon URLs from Google Sheets | Google Sheets                      | Reads product URLs from Google Sheet   | When clicking ‘Execute workflow’ | Amazon Product Analyzer (AI Agent) | Section 1: Reads product URLs from Google Sheets to automate input collection.                           |
| Amazon Product Analyzer (AI Agent) | Langchain AI Agent                 | Orchestrates scraping, AI evaluation   | Fetch Amazon URLs from Google Sheets | Update Sheet with Product Insights | Section 2: AI Agent calls Bright Data scraper and OpenAI for product analysis and structured parsing.   |
| OpenAI Chat Model                | Langchain OpenAI Chat Model          | Provides GPT-4o-mini model for AI       | Amazon Product Analyzer (AI Agent) | Amazon Product Analyzer (AI Agent) | Part of AI Agent’s language model for interpreting scraped data and rating it.                           |
| Tool: MCP Client (Bright Data)   | MCP Client Tool (Bright Data)         | Scrapes Amazon product data via proxy  | Amazon Product Analyzer (AI Agent) | Amazon Product Analyzer (AI Agent) | Uses Bright Data’s proxy to scrape data safely, bypassing Amazon detection.                             |
| Auto-fixing Output Parser         | Langchain Output Parser Autofixing    | Cleans AI output for structured parsing | OpenAI Chat Model1              | Amazon Product Analyzer (AI Agent) | Fixes AI response formatting issues for smooth JSON parsing.                                            |
| OpenAI Chat Model1                | Langchain OpenAI Chat Model          | Secondary AI model to assist parsing    | None                           | Auto-fixing Output Parser         | Supports output parser with GPT-4o-mini model to improve response structure.                            |
| Structured Output Parser          | Langchain Structured Output Parser    | Parses AI output into structured JSON | Auto-fixing Output Parser       | Auto-fixing Output Parser         | Converts AI text output into structured JSON according to product schema.                              |
| Update Sheet with Product Insights | Google Sheets                      | Updates original Google Sheet with data | Amazon Product Analyzer (AI Agent) | None                            | Section 3: Writes enriched product insights back to Google Sheet for live dashboard.                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger node:**  
   - Name: `When clicking ‘Execute workflow’`  
   - Purpose: To start the workflow manually.

2. **Add a Google Sheets node to fetch URLs:**  
   - Name: `Fetch Amazon URLs from Google Sheets`  
   - Operation: Read rows from a Google Sheet.  
   - Configure:  
     - Document ID: Use the ID of your sheet containing product URLs.  
     - Sheet Name: Set to the first sheet (gid=0).  
   - Credentials: Link your Google Sheets OAuth2 account.  
   - Connect output of Manual Trigger to this node.

3. **Add a Langchain AI Agent node:**  
   - Name: `Amazon Product Analyzer (AI Agent)`  
   - Type: Langchain AI Agent (version 2)  
   - Parameters:  
     - Prompt: Instruct extraction of units sold, price, stock, reviews, rating, sales rank, and to assign a performance rating out of 10 based on purchasing performance. Include the Amazon URL as input.  
     - Enable output parser.  
   - Connect input from `Fetch Amazon URLs from Google Sheets`.

4. **Configure the AI Agent’s internal components:**

   - **Add OpenAI Chat Model node:**  
     - Name: `OpenAI Chat Model`  
     - Model: `gpt-4o-mini`  
     - Credentials: OpenAI API key.  
     - Connect as AI language model in AI Agent.

   - **Add MCP Client (Bright Data) node:**  
     - Name: `Tool: MCP Client (Bright Data)`  
     - Tool Name: `web_data_amazon_product`  
     - Operation: `executeTool`  
     - Tool Parameters: Leave dynamic to be passed from AI agent.  
     - Credentials: Bright Data MCP Client API.  
     - Connect as AI tool in AI Agent.

   - **Add Auto-fixing Output Parser node:**  
     - Name: `Auto-fixing Output Parser`  
     - Default settings.  
     - Connect input from OpenAI Chat Model1.  
     - Connect output to AI Agent’s output parser.

   - **Add second OpenAI Chat Model node:**  
     - Name: `OpenAI Chat Model1`  
     - Model: `gpt-4o-mini`  
     - Credentials: OpenAI API key.  
     - Connect output to Auto-fixing Output Parser.

   - **Add Structured Output Parser node:**  
     - Name: `Structured Output Parser`  
     - Provide JSON schema example as given in the workflow for product data fields.  
     - Connect input from Auto-fixing Output Parser, output to OpenAI Chat Model1.

5. **Add a Google Sheets node to update insights:**  
   - Name: `Update Sheet with Product Insights`  
   - Operation: `Update` rows in Google Sheet.  
   - Document ID & Sheet Name: Same as fetch node.  
   - Configure mapping columns: Match rows by `row_number` and update fields: Ranking, Sales rank, Units sold, Current price, Stock availability, Review count & rating.  
   - Credentials: Google Sheets OAuth2.  
   - Connect input from AI Agent node.

6. **Connect the nodes in this order:**  
   `When clicking ‘Execute workflow’` → `Fetch Amazon URLs from Google Sheets` → `Amazon Product Analyzer (AI Agent)` → `Update Sheet with Product Insights`

7. **Test credentials:**  
   - OpenAI API key must have access to GPT-4o-mini or equivalent.  
   - Google Sheets OAuth2 must have read/write access to the target spreadsheet.  
   - Bright Data MCP Client credentials must be valid and have quota for scraping.

8. **Validate:**  
   - Run the workflow manually.  
   - Confirm product URLs are fetched.  
   - Watch AI Agent scrape and analyze product data.  
   - Ensure the Google Sheet updates with new columns populated accordingly.

---

### 5. General Notes & Resources

| Note Content                                                                                              | Context or Link                                                                                     |
|----------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| I’ll receive a tiny commission if you join Bright Data through this link—thanks for fueling more free content! https://get.brightdata.com/1tndi4600b25 | Bright Data affiliate link for proxy service.                                                     |
| Workflow assistance and support contact: Yaron@nofluff.online. YouTube: https://www.youtube.com/@YaronBeen/videos LinkedIn: https://www.linkedin.com/in/yaronbeen/ | Support and additional resources for this workflow.                                               |
| Workflow automates product research using AI, scraping, and Google Sheets to generate a live Amazon product intelligence dashboard. | Project description and workflow branding.                                                        |

---

**Disclaimer:** The provided text is exclusively derived from an automated workflow built with n8n, adhering strictly to content policies with no illegal or protected elements. All handled data is legal and public.