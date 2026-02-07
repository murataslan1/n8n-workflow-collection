AI-Powered Product Research & Price Comparison with Google Search and OpenAI

https://n8nworkflows.xyz/workflows/ai-powered-product-research---price-comparison-with-google-search-and-openai-6664


# AI-Powered Product Research & Price Comparison with Google Search and OpenAI

### 1. Workflow Overview

This workflow automates product research and price comparison by leveraging AI-generated search queries and Google Custom Search results. It is designed to help users quickly discover relevant products, analyze their features and pricing, and receive a synthesized report via email.

**Target Use Cases:**  
- E-commerce product research  
- Competitive pricing analysis  
- Automated market research for specific product types  
- Generating actionable product insights from web search data

**Logical Blocks:**  
- **1.1 Input Reception:** Accepts the product description as input for the research.  
- **1.2 AI Query Generation:** Uses OpenAI to generate optimized search queries based on the product description.  
- **1.3 Search Execution:** Performs Google Custom Search for each query to collect relevant product results.  
- **1.4 Data Aggregation:** Combines all search results into a single dataset for analysis.  
- **1.5 AI Summarization:** Uses OpenAI to analyze and summarize search results into a concise report.  
- **1.6 Report Delivery:** Sends the AI-generated report via email to a specified recipient.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block initiates the workflow manually or via automation and sets the product description for research.

- **Nodes Involved:**  
  - Manual Trigger  
  - Set Product Description

- **Node Details:**  

  **Manual Trigger**  
  - Type: Manual trigger node  
  - Role: Allows manual workflow execution for testing or can be replaced by webhook/Google Sheets for automation.  
  - Configuration: No parameters; manual start only.  
  - Inputs: None  
  - Outputs: Triggers the next node  
  - Edge Cases: None specific; user must trigger manually or integrate with an input source.  
  - Notes: Suggests possible automation inputs like webhook or sheet.

  **Set Product Description**  
  - Type: Set node  
  - Role: Defines the product description text used downstream.  
  - Configuration: Static text field “productDescription” set to a detailed natural language product description.  
  - Inputs: From Manual Trigger  
  - Outputs: Outputs JSON with `productDescription`  
  - Edge Cases: If used in automation, the source must provide valid and relevant text.  
  - Notes: Can be replaced with dynamic input from previous nodes.

#### 1.2 AI Query Generation

- **Overview:**  
  Generates concise and effective Google search queries from the product description using OpenAI GPT models.

- **Nodes Involved:**  
  - AI: Generate Search Queries

- **Node Details:**  

  **AI: Generate Search Queries**  
  - Type: OpenAI node  
  - Role: Converts product description into 3-5 optimized search queries via AI prompt engineering.  
  - Configuration:  
    - Model: `gpt-3.5-turbo` by default (can be changed to `gpt-4o`)  
    - Prompt: System role instructs to generate short queries; user role receives product description dynamically.  
  - Inputs: Receives `productDescription` from Set Product Description node  
  - Outputs: Single item with AI-generated queries as a newline-separated string in `choices[0].message.content`  
  - Edge Cases:  
    - API errors (key invalid, rate limits)  
    - Unexpected output format (missing queries or extra text)  
    - Prompt misinterpretation  
  - Requirements: Valid OpenAI API key configured in credentials.

#### 1.3 Search Execution

- **Overview:**  
  Splits AI-generated queries into individual search items and performs Google Custom Search on each, retrieving top search results.

- **Nodes Involved:**  
  - Split Queries  
  - Google Custom Search (CSE)

- **Node Details:**  

  **Split Queries**  
  - Type: Function node  
  - Role: Parses the multiline AI-generated queries into separate workflow items for parallel processing.  
  - Configuration: JavaScript function splits string by newlines, trims, and filters empty lines.  
  - Inputs: AI-generated query string  
  - Outputs: Multiple items, each with a single `query` field  
  - Edge Cases: Empty or malformed AI output leads to zero or invalid queries.

  **Google Custom Search (CSE)**  
  - Type: Google Custom Search node  
  - Role: Executes a web search for each query using Google’s API and Custom Search Engine (CSE).  
  - Configuration:  
    - Query: Dynamically set from each `query` item  
    - Number of results: 5 (configurable)  
    - Search Engine ID: User must input their CSE ID  
  - Inputs: Each query item from Split Queries  
  - Outputs: Search results with fields like `title`, `link`, `snippet`  
  - Edge Cases:  
    - API key or CSE ID invalid or missing  
    - Quota limits reached on Google API  
    - No results returned for certain queries  
  - Requirements: Valid Google API credential and CSE ID configured.

#### 1.4 Data Aggregation

- **Overview:**  
  Combines all search results from multiple queries into a single aggregated dataset for summarization.

- **Nodes Involved:**  
  - Combine Search Results

- **Node Details:**  

  **Combine Search Results**  
  - Type: Set node  
  - Role: Collects all items output by Google Custom Search into a single array.  
  - Configuration: Uses expression `={{ $('Google Custom Search (CSE)').all() }}` to gather all results.  
  - Inputs: Multiple items from Google Custom Search  
  - Outputs: Single item containing array of all search results  
  - Edge Cases: If no search results, output will be empty array.  
  - Notes: This aggregation is key for feeding comprehensive data to the AI summarizer.

#### 1.5 AI Summarization

- **Overview:**  
  Uses OpenAI to analyze combined search results and generate a concise product research report with key features and pricing info.

- **Nodes Involved:**  
  - AI: Summarize Products & Prices

- **Node Details:**  

  **AI: Summarize Products & Prices**  
  - Type: OpenAI node  
  - Role: Reads all combined search results and produces a structured summary report including product insights and buying options.  
  - Configuration:  
    - Model: `gpt-3.5-turbo`  
    - System prompt instructs to identify themes, features, retailers, and produce bullet points and top relevant links.  
    - User prompt dynamically injects combined search results mapped by title, snippet, and link.  
  - Inputs: Aggregated search results from Combine Search Results plus product description context.  
  - Outputs: AI-generated summary text.  
  - Edge Cases:  
    - API errors or rate limits  
    - Unexpected AI output format  
    - Large input data might exceed token limits (rare with 5 results per query)  
  - Requirements: Valid OpenAI API key configured.

#### 1.6 Report Delivery

- **Overview:**  
  Sends the AI-generated product research report by email to a specified recipient using Gmail API.

- **Nodes Involved:**  
  - Send Report Email

- **Node Details:**  

  **Send Report Email**  
  - Type: Gmail node  
  - Role: Sends the final AI summary report as an email.  
  - Configuration:  
    - From Email: Must match authenticated Gmail account  
    - To Email: User must replace placeholder with actual recipient email  
    - Subject: Includes product description for easy identification  
    - Text: Includes greeting, product description, AI summary, and footer note  
  - Inputs: AI summary text from previous node, product description  
  - Outputs: Email sent confirmation  
  - Edge Cases:  
    - Authentication failure with Gmail API  
    - Incorrect recipient email  
    - Email quota or sending limits  
  - Requirements: Gmail API credential configured with OAuth2 and proper permissions.

---

### 3. Summary Table

| Node Name                  | Node Type                | Functional Role                     | Input Node(s)            | Output Node(s)             | Sticky Note                                                                                       |
|----------------------------|--------------------------|-----------------------------------|--------------------------|----------------------------|-------------------------------------------------------------------------------------------------|
| Manual Trigger             | Manual Trigger           | Start workflow manually            | None                     | Set Product Description     | Start Workflow: Manual trigger for testing, can be replaced by webhook or Google Sheets         |
| Set Product Description    | Set                      | Define product description input  | Manual Trigger           | AI: Generate Search Queries | Define Product Description: Edit value or use dynamic input                                     |
| AI: Generate Search Queries| OpenAI                   | Generate search queries from description | Set Product Description | Split Queries              | AI node setup: OpenAI API key required, model gpt-3.5-turbo, prompt generates 3-5 queries       |
| Split Queries             | Function                 | Split multi-line queries into items | AI: Generate Search Queries | Google Custom Search (CSE) | Splits AI output into separate queries for parallel searching                                   |
| Google Custom Search (CSE)| Google Custom Search     | Perform web searches per query    | Split Queries            | Combine Search Results       | Critical: Configure Google API key and Search Engine ID, limits results to 5 per query          |
| Combine Search Results    | Set                      | Aggregate all search results      | Google Custom Search (CSE) | AI: Summarize Products & Prices | Uses expression to collect all search results into one array                                   |
| AI: Summarize Products & Prices | OpenAI              | Summarize product info & prices   | Combine Search Results   | Send Report Email            | Uses OpenAI to produce readable report with key findings and top links                          |
| Send Report Email          | Gmail                    | Email final report                | AI: Summarize Products & Prices | None                       | Setup Gmail credentials, update recipient and sender emails, sends AI report by email           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger node:**  
   - Type: Manual Trigger  
   - Purpose: To start the workflow manually for testing.

2. **Create Set node (Set Product Description):**  
   - Type: Set  
   - Add new field: `productDescription`  
   - Value: Enter detailed product description (e.g., "Lightweight, durable hiking backpack for multi-day trips (30-40L), good ventilation, comfortable for long hikes.")  
   - Connect output from Manual Trigger.

3. **Create OpenAI node (AI: Generate Search Queries):**  
   - Type: OpenAI  
   - Credentials: Configure OpenAI API key (must start with "sk-")  
   - Model: `gpt-3.5-turbo` (or `gpt-4o` if preferred)  
   - Messages:  
     - System: "You are a search query optimizer. Given a product description, generate 3-5 concise and effective Google search queries to find that product. Output each query on a new line. Do not add any conversational text or numbering."  
     - User: `Generate search queries for: {{ $json.productDescription }}`  
   - Connect output from Set Product Description.

4. **Create Function node (Split Queries):**  
   - Type: Function  
   - Code:  
     ```javascript
     const queriesString = items[0].json.choices[0].message.content;
     const queries = queriesString.split('\n').filter(q => q.trim() !== '');
     return queries.map(query => ({ json: { query: query.trim() } }));
     ```  
   - Connect output from AI: Generate Search Queries.

5. **Create Google Custom Search node (Google Custom Search (CSE)):**  
   - Type: Google Custom Search  
   - Credentials: Configure Google API credential with your API key from Google Cloud Console  
   - Search Engine ID: Enter your Custom Search Engine ID from `cse.google.com`  
   - Query: `={{ $json.query }}` (dynamically take each query)  
   - Number of results: 5  
   - Connect output from Split Queries.

6. **Create Set node (Combine Search Results):**  
   - Type: Set  
   - Mode: JSON  
   - Value: `={{ $('Google Custom Search (CSE)').all() }}` (collect all results)  
   - Connect output from Google Custom Search (CSE).

7. **Create OpenAI node (AI: Summarize Products & Prices):**  
   - Type: OpenAI  
   - Credentials: Use OpenAI API key configured earlier  
   - Model: `gpt-3.5-turbo`  
   - Messages:  
     - System: "You are a product research assistant. Analyze the provided search results (titles, snippets, links) for a product. Identify common themes, product types, key features, and suggest where the user might find the best prices (e.g., mention specific retailers or general price comparison sites if they appear in results). Structure your output as a concise report with bullet points for key findings and a list of top 3-5 relevant links."  
     - User:  
       ```
       Based on the following search results for '{{ $node["Set Product Description"].json.productDescription }}':

       {{ $json.map(item => `Title: ${item.title}\nSnippet: ${item.snippet}\nLink: ${item.link}`).join('\n---\n') }}
       ```  
   - Connect output from Combine Search Results.

8. **Create Gmail node (Send Report Email):**  
   - Type: Gmail  
   - Credentials: Configure Gmail API OAuth2 credentials  
   - From Email: Your authenticated Gmail address  
   - To Email: Replace `YOUR_RECIPIENT_EMAIL@example.com` with actual recipient email  
   - Subject: `AI Shopping Assistant: Product Research Report for "{{ $node["Set Product Description"].json.productDescription }}"`  
   - Text:  
     ```
     Hello!

     Here's your AI-powered product research report from n8n for:
     "{{ $node["Set Product Description"].json.productDescription }}"

     ---

     {{ $node["AI: Summarize Products & Prices"].json.choices[0].message.content }}

     ---

     *This report was generated automatically by n8n. Please use the provided links to explore products and prices further.*
     ```  
   - Connect output from AI: Summarize Products & Prices.

9. **Connect all nodes sequentially as per the workflow:**  
   Manual Trigger → Set Product Description → AI: Generate Search Queries → Split Queries → Google Custom Search (CSE) → Combine Search Results → AI: Summarize Products & Prices → Send Report Email.

10. **Test the workflow:**  
    - Click 'Execute Workflow' on Manual Trigger.  
    - Verify email receipt with the AI-generated product research report.

---

### 5. General Notes & Resources

| Note Content                                                                                                                | Context or Link                                                                                         |
|-----------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| Google Custom Search API requires both an API key from Google Cloud Console and a Custom Search Engine configured at cse.google.com. | Setup instructions for Google Custom Search API and CSE: https://developers.google.com/custom-search/v1/overview |
| OpenAI API keys start with "sk-" and must have sufficient quota for GPT-3.5-turbo or GPT-4o usage.                           | OpenAI API documentation: https://platform.openai.com/docs/api-reference/introduction                 |
| Gmail API OAuth2 credentials must be configured with proper scopes to allow sending emails via n8n Gmail node.              | Gmail API setup guide: https://developers.google.com/gmail/api/quickstart/js                            |
| For automation, the manual trigger can be replaced with a webhook or Google Sheets node to ingest dynamic product descriptions. | n8n Webhook and Google Sheets nodes documentation: https://docs.n8n.io/nodes/n8n-nodes-base.webhook/ and https://docs.n8n.io/nodes/n8n-nodes-base.googleSheets/ |
| The workflow respects Google and OpenAI API usage limits; monitor quotas to avoid disruptions.                              | Google and OpenAI quota management best practices.                                                    |

---

*Disclaimer: The provided text originates exclusively from an automated workflow created in n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All processed data is legal and public.*