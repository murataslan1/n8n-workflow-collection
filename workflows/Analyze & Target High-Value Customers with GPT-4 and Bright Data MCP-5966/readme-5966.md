Analyze & Target High-Value Customers with GPT-4 and Bright Data MCP

https://n8nworkflows.xyz/workflows/analyze---target-high-value-customers-with-gpt-4-and-bright-data-mcp-5966


# Analyze & Target High-Value Customers with GPT-4 and Bright Data MCP

### 1. Workflow Overview

This workflow automates the process of identifying high-value customers and targeting them with personalized promotional offers. It integrates AI-powered data scraping, data processing, customer segmentation, and email marketing to streamline marketing campaigns.

The workflow is logically divided into four main blocks:

- **1.1 Schedule & Input Setup**  
  Initiates the workflow on a regular monthly schedule and sets the URL of the admin dashboard containing customer data.

- **1.2 AI-Powered Data Scraping**  
  Uses an AI Agent combining OpenAI GPT-4 and Bright Data MCP to scrape customer profiles and their order histories from the specified URL, then parses and formats this data.

- **1.3 Data Formatting & Order Extraction**  
  Processes the scraped data to separate customer details and their individual orders into structured formats for evaluation.

- **1.4 Offer Decision & Email Campaign**  
  Evaluates each order against a spending threshold to determine if the customer is high-value, then sends a special offer email to qualifying customers while ignoring others.

---

### 2. Block-by-Block Analysis

---

#### 1.1 Schedule & Input Setup

- **Overview:**  
  This block triggers the workflow monthly at 9 AM and sets the URL of the customer admin dashboard from which data will be scraped.

- **Nodes Involved:**  
  - Run Offer Campaign Monthly (Schedule Trigger)  
  - Set customer history url (Set Node)

- **Node Details:**

  - **Run Offer Campaign Monthly**  
    - Type: Schedule Trigger  
    - Configuration: Triggers workflow every month at 9:00 AM  
    - Inputs: None (start node)  
    - Outputs: Connects to `Set customer history url`  
    - Edge Cases: If scheduling service is down or misconfigured, workflow won't trigger.

  - **Set customer history url**  
    - Type: Set Node  
    - Configuration: Sets a string variable `customer data url` with value `example.com` (placeholder for actual admin dashboard URL)  
    - Inputs: From `Run Offer Campaign Monthly`  
    - Outputs: Connects to `Scrape Customer Profiles & Orders (Agent)`  
    - Edge Cases: If URL is incorrect or inaccessible, downstream scraping will fail.

---

#### 1.2 AI-Powered Data Scraping

- **Overview:**  
  This block uses an AI Agent powered by OpenAI GPT-4 and Bright Data MCP to scrape customer profiles and order histories from the dashboard URL, then parses the output into a structured JSON format.

- **Nodes Involved:**  
  - Scrape Customer Profiles & Orders (Agent)  
  - AI Assistant (OpenAI Chat Model)  
  - Bright Data MCP Scraper  
  - Structured Output Parser  
  - Auto-fixing Output Parser

- **Node Details:**

  - **Scrape Customer Profiles & Orders (Agent)**  
    - Type: LangChain Agent Node  
    - Configuration: Uses AI to scrape and extract key information from the provided URL embedded in the input JSON (`{{ $json['customer data url'] }}`)  
    - Inputs: From `Set customer history url` (main), AI tool input from `Bright Data MCP Scraper`, AI language model from `AI Assistant`, AI output parser from `Auto-fixing Output Parser`  
    - Outputs: Customer data with orders as JSON array to `Format Customer Info` node  
    - Edge Cases: Scraping failure due to URL issues, incorrect prompt input, AI model timeout or API errors.

  - **AI Assistant**  
    - Type: OpenAI Chat Model (GPT-4o-mini)  
    - Configuration: GPT-4 variant used to assist agent in scraping and data extraction  
    - Inputs: Connected as AI language model for the Agent node  
    - Outputs: Provides AI-generated content to Agent  
    - Credentials: OpenAI API key required  
    - Edge Cases: API rate limiting, auth failure.

  - **Bright Data MCP Scraper**  
    - Type: Bright Data MCP Client Tool  
    - Configuration: Executes `scrape_as_markdown` tool to scrape content from the URL, parameters dynamically set from AI overrides  
    - Inputs: Used as AI tool inside the Agent node  
    - Outputs: Scraped raw data for AI processing  
    - Credentials: Bright Data MCP API credentials required  
    - Edge Cases: Network issues, proxy failures, quota limits.

  - **Structured Output Parser**  
    - Type: LangChain Structured Output Parser  
    - Configuration: Parses AI text output into a JSON array with customer names and order arrays, example schema provided for validation  
    - Inputs: From `OpenAI Chat Model` node  
    - Outputs: Parsed structured JSON to `Auto-fixing Output Parser`  
    - Edge Cases: Parsing errors if AI output deviates from schema.

  - **Auto-fixing Output Parser**  
    - Type: LangChain Output Parser Auto-fixing  
    - Configuration: Attempts to auto-correct and parse AI output if initial parsing fails  
    - Inputs: From `Structured Output Parser`  
    - Outputs: Final structured JSON to `Scrape Customer Profiles & Orders (Agent)`  
    - Edge Cases: Complex or malformed AI responses that cannot be auto-corrected.

---

#### 1.3 Data Formatting & Order Extraction

- **Overview:**  
  Processes the structured customer data to extract individual customer info and order details in separate, usable items.

- **Nodes Involved:**  
  - Format Customer Info (Code Node)  
  - Get Customer Order History (Code Node)

- **Node Details:**

  - **Format Customer Info**  
    - Type: Code Node (JavaScript)  
    - Configuration: Maps the 'output' array from the Agent to individual items, each representing one customer record (name, email, orders)  
    - Inputs: From `Scrape Customer Profiles & Orders (Agent)`  
    - Outputs: Array of customer JSON objects to `Get Customer Order History`  
    - Edge Cases: Empty or missing output array causes empty downstream processing.

  - **Get Customer Order History**  
    - Type: Code Node (JavaScript)  
    - Configuration: Iterates over customers and their orders, outputs one item per order with customer name, email, order amount, and date  
    - Inputs: From `Format Customer Info`  
    - Outputs: Individual order items to `Is Customer High-Value?` node  
    - Edge Cases: Missing orders array or malformed order data may cause errors or incomplete output.

---

#### 1.4 Offer Decision & Email Campaign

- **Overview:**  
  Evaluates each order’s amount to determine if the customer qualifies as high-value (threshold: $200). Sends promotional email to qualifying customers via Gmail; ignores others.

- **Nodes Involved:**  
  - Is Customer High-Value? (If Node)  
  - Send Special Offer Email (Gmail Node)  
  - Ignore Low-Value Customers (NoOp Node)

- **Node Details:**

  - **Is Customer High-Value?**  
    - Type: If Node  
    - Configuration: Checks if `amount` field in order JSON is greater than or equal to 200  
    - Inputs: From `Get Customer Order History`  
    - Outputs: True branch to `Send Special Offer Email`, False branch to `Ignore Low-Value Customers`  
    - Edge Cases: Missing or non-numeric `amount` will cause the condition to fail or error.

  - **Send Special Offer Email**  
    - Type: Gmail Node  
    - Configuration: Sends email to `customer_email` with subject "Offer for being our ideal customer" and message "write any offer" (placeholder text)  
    - Inputs: True branch from `Is Customer High-Value?`  
    - Credentials: Gmail OAuth2 required  
    - Edge Cases: Email sending failure due to auth issues, invalid email addresses, or Gmail API limits.

  - **Ignore Low-Value Customers**  
    - Type: NoOp Node  
    - Configuration: Does nothing, used to explicitly end flow for non-qualifying customers  
    - Inputs: False branch from `Is Customer High-Value?`  
    - Outputs: None  
    - Edge Cases: None

---

### 3. Summary Table

| Node Name                        | Node Type                          | Functional Role                          | Input Node(s)                       | Output Node(s)                       | Sticky Note                                                                                      |
|---------------------------------|----------------------------------|----------------------------------------|-----------------------------------|------------------------------------|------------------------------------------------------------------------------------------------|
| Run Offer Campaign Monthly       | Schedule Trigger                 | Starts the workflow monthly             | None                              | Set customer history url            | Section 1: Schedule & Input Setup - initiates workflow on schedule, sets admin dashboard URL    |
| Set customer history url         | Set Node                        | Sets customer data URL                   | Run Offer Campaign Monthly         | Scrape Customer Profiles & Orders (Agent) | Section 1: Schedule & Input Setup                                                              |
| Scrape Customer Profiles & Orders (Agent) | LangChain Agent Node           | Scrapes customer profiles and orders    | Set customer history url           | Format Customer Info                | Section 2: Scraping Customer Data with Agent - AI Agent scrapes and parses customer/order data  |
| AI Assistant                    | OpenAI Chat Model (GPT-4)        | Provides AI language model for Agent    | None (agent input)                 | Scrape Customer Profiles & Orders (Agent) | Section 2                                                                                      |
| Bright Data MCP Scraper         | Bright Data MCP Client Tool       | Proxy scraper tool for data              | None (agent input)                 | Scrape Customer Profiles & Orders (Agent) | Section 2                                                                                      |
| Structured Output Parser        | LangChain Structured Output Parser| Parses AI output into structured JSON   | OpenAI Chat Model                  | Auto-fixing Output Parser           | Section 2                                                                                      |
| Auto-fixing Output Parser       | LangChain Output Parser Autofixer | Auto-corrects parsing errors             | Structured Output Parser           | Scrape Customer Profiles & Orders (Agent) | Section 2                                                                                      |
| Format Customer Info            | Code Node (JavaScript)            | Maps agent output to customer items      | Scrape Customer Profiles & Orders (Agent) | Get Customer Order History          | Section 3: Data Formatting & Order Extraction - organizes customer info                         |
| Get Customer Order History      | Code Node (JavaScript)            | Extracts individual orders per customer  | Format Customer Info               | Is Customer High-Value?             | Section 3                                                                                      |
| Is Customer High-Value?         | If Node                          | Filters customers by order amount >= 200| Get Customer Order History         | Send Special Offer Email, Ignore Low-Value Customers | Section 4: Offer Decision & Action - filters high-value customers                               |
| Send Special Offer Email        | Gmail Node                      | Sends promotional email to qualifying customers | Is Customer High-Value? (true)    | None                              | Section 4                                                                                      |
| Ignore Low-Value Customers      | NoOp Node                       | Discards low-value customers             | Is Customer High-Value? (false)   | None                              | Section 4                                                                                      |
| Sticky Note                    | Sticky Note                     | Documentation and guidance               | None                             | None                              | Section 1                                                                                      |
| Sticky Note1                   | Sticky Note                     | Documentation and guidance               | None                             | None                              | Section 2                                                                                      |
| Sticky Note2                   | Sticky Note                     | Documentation and guidance               | None                             | None                              | Section 3                                                                                      |
| Sticky Note3                   | Sticky Note                     | Documentation and guidance               | None                             | None                              | Section 4                                                                                      |
| Sticky Note4                   | Sticky Note                     | Full workflow explanation and tips       | None                             | None                              | General workflow notes                                                                        |
| Sticky Note5                   | Sticky Note                     | Affiliate link for Bright Data           | None                             | None                              | Bright Data referral link                                                                     |
| Sticky Note9                   | Sticky Note                     | Contact & support info                    | None                             | None                              | Workflow assistance and contact information                                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger Node:**  
   - Name: `Run Offer Campaign Monthly`  
   - Type: Schedule Trigger  
   - Set trigger interval: Every 1 month at 9 AM.

2. **Add a Set Node:**  
   - Name: `Set customer history url`  
   - Type: Set  
   - Add a string field named `customer data url` with your actual admin dashboard URL (replace `example.com`).  
   - Connect `Run Offer Campaign Monthly` main output to this node.

3. **Add LangChain Agent Node:**  
   - Name: `Scrape Customer Profiles & Orders (Agent)`  
   - Type: LangChain Agent  
   - Parameters:  
     - Prompt: `scrape the customer history url below and extract the key information:\n{{ $json['customer data url'] }}`  
     - Output parser enabled  
   - Connect `Set customer history url` main output to this node.

4. **Add OpenAI Chat Model Node:**  
   - Name: `AI Assistant`  
   - Type: LangChain LM Chat OpenAI  
   - Model: `gpt-4o-mini` (GPT-4 variant)  
   - Credentials: Configure with your OpenAI API key.  
   - Connect as AI language model input to `Scrape Customer Profiles & Orders (Agent)`.

5. **Add Bright Data MCP Scraper Node:**  
   - Name: `Bright Data MCP Scraper`  
   - Type: MCP Client Tool  
   - Tool Name: `scrape_as_markdown`  
   - Credentials: Bright Data MCP API credentials required.  
   - Connect as AI tool input to `Scrape Customer Profiles & Orders (Agent)`.

6. **Add Structured Output Parser Node:**  
   - Name: `Structured Output Parser`  
   - Type: LangChain Structured Output Parser  
   - Provide JSON schema example for expected customer/order structure (as per example in workflow).  
   - Connect output from `AI Assistant` node to this parser.

7. **Add Auto-fixing Output Parser Node:**  
   - Name: `Auto-fixing Output Parser`  
   - Type: LangChain Output Parser Autofixing  
   - Connect output from `Structured Output Parser` to this node.  
   - Connect output to `Scrape Customer Profiles & Orders (Agent)` AI output parser input.

8. **Add Code Node for Customer Info Formatting:**  
   - Name: `Format Customer Info`  
   - Type: Code Node (JavaScript)  
   - Script: Extracts `output` array and maps each customer to a separate item.  
   - Connect main output of `Scrape Customer Profiles & Orders (Agent)` to this node.

9. **Add Code Node for Order Extraction:**  
   - Name: `Get Customer Order History`  
   - Type: Code Node (JavaScript)  
   - Script: Iterate over customers and their orders, output one item per order with customer_name, customer_email, amount, and date.  
   - Connect main output of `Format Customer Info` to this node.

10. **Add If Node for High-Value Check:**  
    - Name: `Is Customer High-Value?`  
    - Type: If Node  
    - Condition: Numeric check - `amount >= 200`  
    - Connect main output of `Get Customer Order History` to this node.

11. **Add Gmail Node to Send Offers:**  
    - Name: `Send Special Offer Email`  
    - Type: Gmail Node  
    - Parameters:  
      - Send To: `={{ $json.customer_email }}`  
      - Subject: `Offer for being our ideal customer`  
      - Message: Custom offer message (replace placeholder "write any offer")  
    - Credentials: Configure Gmail OAuth2 credentials.  
    - Connect True output of `Is Customer High-Value?` to this node.

12. **Add NoOp Node to Ignore Low-Value Customers:**  
    - Name: `Ignore Low-Value Customers`  
    - Type: NoOp Node  
    - Connect False output of `Is Customer High-Value?` to this node.

---

### 5. General Notes & Resources

| Note Content                                                                                          | Context or Link                                                |
|-----------------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| Workflow assistance and support contact: Yaron@nofluff.online                                       | Contact information                                           |
| YouTube channel with more tips: https://www.youtube.com/@YaronBeen/videos                            | Video tutorials and workflow tips                             |
| LinkedIn: https://www.linkedin.com/in/yaronbeen/                                                    | Professional networking and support                           |
| Bright Data affiliate link for proxy services: https://get.brightdata.com/1tndi4600b25              | Proxy scraping service affiliate link                         |
| This workflow automates customer targeting using AI and proxies for scalable marketing campaigns.   | Project overview                                               |

---

This documentation provides a complete technical and functional understanding of the workflow, enabling reproduction, modification, and error anticipation for advanced users and automation agents alike.