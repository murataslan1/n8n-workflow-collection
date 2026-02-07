AI Prospect Researcher +ISCP only need Company Name and Domain

https://n8nworkflows.xyz/workflows/ai-prospect-researcher--iscp-only-need-company-name-and-domain-4882


# AI Prospect Researcher +ISCP only need Company Name and Domain

---

### 1. Workflow Overview

This workflow automates B2B company research based on a company name and domain input. It aggregates data from multiple sources including Hunter.io (email finder), Perplexity AI Search, LinkedIn company profiles, web scraping, and AI language models (OpenAI and LangChain) to generate an enriched company report with an ISCP score. The workflow outputs the research into a structured Google Docs report.

Logical blocks:

- **1.1 Input Reception:** Receives company name and domain via form submission.
- **1.2 Data Collection:** Queries Hunter.io, Perplexity Search, LinkedIn APIs, and scrapes company websites.
- **1.3 Data Processing:** Analyzes scraped web content using AI models.
- **1.4 Data Aggregation:** Merges results from different sources.
- **1.5 Report Generation:** Generates AI-based company report and scores it with ISCP model.
- **1.6 Output Preparation:** Creates and populates Google Docs documents with gathered and processed data.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
Receives and sets the initial input data (company name and domain) from a form submission, making it available for subsequent research steps.

- **Nodes Involved:**  
  - On form submission  
  - Set company name and domain

- **Node Details:**

  - **On form submission**  
    - Type: Form Trigger  
    - Role: Entry point triggered by external form submission with input data  
    - Configuration: Listens for incoming form data, expected to receive company name and domain  
    - Inputs: None (trigger node)  
    - Outputs: Passes form data to next node  
    - Edge cases: Trigger failure if webhook URL not set or form not submitted properly

  - **Set company name and domain**  
    - Type: Set node  
    - Role: Maps and prepares the company name and domain variables for downstream nodes  
    - Configuration: Sets variables explicitly for company name and domain extracted from form trigger  
    - Inputs: On form submission output  
    - Outputs: Feeds multiple research nodes and merges  
    - Edge cases: Missing or malformed input data might cause downstream API calls to fail

---

#### 1.2 Data Collection

- **Overview:**  
Performs external data retrieval from various APIs and services using the input data: Hunter.io for emails, Perplexity AI for general search, LinkedIn company data via POST and GET requests, and webpage scraping.

- **Nodes Involved:**  
  - Search profile (Airtop)  
  - Company LinkedIn Account POST  
  - Wait1 (wait node)  
  - Company LinkedIn Account GET  
  - Hunter  
  - Perplexity Search  
  - Scrape webpage

- **Node Details:**

  - **Search profile**  
    - Type: Airtop node  
    - Role: Searches for company profile data (likely LinkedIn or other databases)  
    - Configuration: Uses company domain/name parameters  
    - Inputs: Set company name and domain  
    - Outputs: Company LinkedIn Account POST  
    - Notes: Execution time depends on row count  
    - Edge cases: API timeouts, rate limiting

  - **Company LinkedIn Account POST**  
    - Type: HTTP Request  
    - Role: Initiates LinkedIn company profile data request (POST)  
    - Configuration: Configured with LinkedIn API URL and payload based on prior search  
    - Inputs: Search profile output  
    - Outputs: Wait1  
    - Edge cases: Authentication errors, request failures

  - **Wait1**  
    - Type: Wait node  
    - Role: Introduces delay between POST and GET requests to LinkedIn API  
    - Configuration: Default or configured wait time  
    - Inputs: Company LinkedIn Account POST output  
    - Outputs: Company LinkedIn Account GET  
    - Edge cases: Timeout too short might cause incomplete data retrieval

  - **Company LinkedIn Account GET**  
    - Type: HTTP Request  
    - Role: Retrieves company LinkedIn profile data (GET) after POST initiation  
    - Configuration: Uses LinkedIn API with appropriate headers and parameters  
    - Inputs: Wait1 output  
    - Outputs: Set Results Company  
    - Edge cases: Authentication errors, rate limits

  - **Hunter**  
    - Type: Hunter node  
    - Role: Retrieves email contact data for the company domain  
    - Configuration: Uses company domain from input  
    - Inputs: Set company name and domain  
    - Outputs: Aggregate node  
    - Edge cases: API quota limits, missing domain info

  - **Perplexity Search**  
    - Type: HTTP Request  
    - Role: Executes search query on Perplexity AI based on company data  
    - Configuration: Uses HTTP request to Perplexity API, with retry enabled (5s delay between tries)  
    - Inputs: Set company name and domain  
    - Outputs: Perplexity Results  
    - Edge cases: API downtime, request failures

  - **Scrape webpage**  
    - Type: Airtop node  
    - Role: Scrapes the company’s website to extract relevant information  
    - Configuration: Uses company domain, configured to parse web page content  
    - Inputs: Set company name and domain  
    - Outputs: Analyze scraped Page  
    - Edge cases: Website unreachable, dynamic content, parsing errors

---

#### 1.3 Data Processing

- **Overview:**  
Processes and analyzes raw data from web scraping using AI language models to extract structured insights.

- **Nodes Involved:**  
  - Analyze scraped Page  
  - OpenAI Chat Model (connected as AI model for Analyze scraped Page)

- **Node Details:**

  - **Analyze scraped Page**  
    - Type: LangChain chain LLM node  
    - Role: Processes scraped webpage text through a language model chain  
    - Configuration: Uses an LLM chain configured with specific prompts/tasks to analyze content  
    - Inputs: Scrape webpage output, OpenAI Chat Model as AI language model  
    - Outputs: Merges results  
    - Edge cases: Model API quota, prompt failures

  - **OpenAI Chat Model**  
    - Type: LangChain OpenAI chat model  
    - Role: Provides AI language model inference for Analyze scraped Page  
    - Configuration: OpenAI API key credentials, model parameters (temperature, max tokens etc.)  
    - Inputs: Analyze scraped Page (as model provider)  
    - Outputs: Analyze scraped Page (processed text)  
    - Edge cases: API rate limiting, auth errors

---

#### 1.4 Data Aggregation

- **Overview:**  
Combines data outputs from Hunter, Perplexity, LinkedIn, and web analysis into a unified dataset for reporting.

- **Nodes Involved:**  
  - Hunter Results (Set)  
  - Perplexity Results (Set)  
  - Set Results Company (Set)  
  - Merge

- **Node Details:**

  - **Hunter Results**  
    - Type: Set node  
    - Role: Formats Hunter API results for merging  
    - Inputs: Aggregate (which collects Hunter output)  
    - Outputs: Merge node (input 0)

  - **Perplexity Results**  
    - Type: Set node  
    - Role: Formats Perplexity API results for merging  
    - Inputs: Perplexity Search output  
    - Outputs: Merge node (input 1)

  - **Set Results Company**  
    - Type: Set node  
    - Role: Formats LinkedIn GET results for merging  
    - Inputs: Company LinkedIn Account GET output  
    - Outputs: Merge node (input 2)

  - **Merge**  
    - Type: Merge node  
    - Role: Combines all formatted results into a single data stream  
    - Inputs: Hunter Results, Perplexity Results, Set Results Company, Analyze scraped Page (input 3), Set company name and domain (input 4)  
    - Outputs: OpenAI Chat Model2 (for report generation)  
    - Edge cases: Data inconsistency, missing inputs

---

#### 1.5 Report Generation

- **Overview:**  
Uses AI language models to generate a comprehensive report, score it with ISCP, and prepare for document creation.

- **Nodes Involved:**  
  - OpenAI Chat Model2  
  - Generate report  
  - Get Offer (Google Docs)  
  - ISCP score  
  - Structured Output Parser  
  - OpenAI Chat Model3

- **Node Details:**

  - **OpenAI Chat Model2**  
    - Type: LangChain OpenAI chat model  
    - Role: Generates report text from aggregated data  
    - Inputs: Merge output  
    - Outputs: Generate report

  - **Generate report**  
    - Type: LangChain chain LLM node  
    - Role: Further refines and chains AI outputs for report generation  
    - Inputs: OpenAI Chat Model2 output  
    - Outputs: Get Offer

  - **Get Offer**  
    - Type: Google Docs node  
    - Role: Retrieves or prepares Google Docs template or document to place the report  
    - Inputs: Generate report  
    - Outputs: ISCP score

  - **ISCP score**  
    - Type: LangChain chain LLM node  
    - Role: Computes ISCP score on generated report content  
    - Inputs: Get Offer, Structured Output Parser output  
    - Outputs: Create doc

  - **Structured Output Parser**  
    - Type: LangChain output parser  
    - Role: Parses AI outputs into structured data for scoring  
    - Inputs: ISCP score AI output parser input  
    - Outputs: ISCP score node

  - **OpenAI Chat Model3**  
    - Type: LangChain OpenAI chat model  
    - Role: Provides AI processing for ISCP score node  
    - Inputs: Structured Output Parser  
    - Outputs: ISCP score

  - Edge cases: AI API quota, document permission issues, parsing errors

---

#### 1.6 Output Preparation

- **Overview:**  
Creates and updates Google Docs documents with the final report and scores.

- **Nodes Involved:**  
  - Create doc (Google Docs)  
  - Add report to doc (Google Docs)

- **Node Details:**

  - **Create doc**  
    - Type: Google Docs node  
    - Role: Creates a new Google Docs document to hold the report  
    - Inputs: ISCP score output  
    - Outputs: Add report to doc

  - **Add report to doc**  
    - Type: Google Docs node  
    - Role: Inserts the generated report text into the created document  
    - Inputs: Create doc output  
    - Outputs: None (end of workflow)  
    - Edge cases: Google Docs API quota limits, write permissions

---

### 3. Summary Table

| Node Name                     | Node Type                              | Functional Role                           | Input Node(s)                       | Output Node(s)                     | Sticky Note                                                     |
|-------------------------------|--------------------------------------|-----------------------------------------|-----------------------------------|----------------------------------|----------------------------------------------------------------|
| On form submission             | Form Trigger                         | Input reception from form                | None                              | Set company name and domain       |                                                                |
| Set company name and domain    | Set                                 | Prepare input variables                  | On form submission                | Search profile, Scrape webpage, Hunter, Perplexity Search, Merge |                                                                |
| Search profile                | Airtop                              | Search company profile                   | Set company name and domain       | Company LinkedIn Account POST     | This could take a few minutes depending on the number of rows   |
| Company LinkedIn Account POST  | HTTP Request                       | Initiate LinkedIn company data POST     | Search profile                   | Wait1                            |                                                                |
| Wait1                         | Wait                                | Delay between LinkedIn POST and GET     | Company LinkedIn Account POST     | Company LinkedIn Account GET      |                                                                |
| Company LinkedIn Account GET   | HTTP Request                       | Retrieve LinkedIn company data           | Wait1                            | Set Results Company              |                                                                |
| Set Results Company           | Set                                 | Format LinkedIn results                   | Company LinkedIn Account GET      | Merge                           |                                                                |
| Hunter                       | Hunter                              | Retrieve emails from Hunter.io           | Set company name and domain       | Aggregate                       |                                                                |
| Aggregate                    | Aggregate                          | Aggregate Hunter results                  | Hunter                          | Hunter Results                  |                                                                |
| Hunter Results               | Set                                 | Format Hunter results                     | Aggregate                       | Merge                          |                                                                |
| Perplexity Search            | HTTP Request                       | Query Perplexity AI search                | Set company name and domain       | Perplexity Results              |                                                                |
| Perplexity Results           | Set                                 | Format Perplexity results                 | Perplexity Search                | Merge                          |                                                                |
| Scrape webpage               | Airtop                              | Scrape company website                    | Set company name and domain       | Analyze scraped Page            |                                                                |
| Analyze scraped Page         | LangChain chain LLM                 | Analyze scraped content with AI           | Scrape webpage, OpenAI Chat Model | Merge                         |                                                                |
| OpenAI Chat Model            | LangChain OpenAI chat model         | AI model for Analyze scraped Page         | Analyze scraped Page             | Analyze scraped Page             |                                                                |
| Merge                       | Merge                              | Combine all data sources                   | Hunter Results, Perplexity Results, Set Results Company, Analyze scraped Page, Set company name and domain | OpenAI Chat Model2            |                                                                |
| OpenAI Chat Model2           | LangChain OpenAI chat model         | AI model for report generation             | Merge                          | Generate report                 |                                                                |
| Generate report              | LangChain chain LLM                 | Generate company report                     | OpenAI Chat Model2              | Get Offer                     |                                                                |
| Get Offer                   | Google Docs                        | Prepare Google Docs document                | Generate report                | ISCP score                    |                                                                |
| ISCP score                  | LangChain chain LLM                 | Compute ISCP score from report              | Get Offer, Structured Output Parser | Create doc                   |                                                                |
| Structured Output Parser     | LangChain output parser            | Parse AI output into structured format      | ISCP score                    | ISCP score                    |                                                                |
| OpenAI Chat Model3           | LangChain OpenAI chat model         | AI model for ISCP scoring                    | Structured Output Parser       | ISCP score                    |                                                                |
| Create doc                  | Google Docs                        | Create Google Docs document                   | ISCP score                    | Add report to doc              |                                                                |
| Add report to doc           | Google Docs                        | Add report content to Google Docs document   | Create doc                   | None                          |                                                                |
| When clicking ‘Execute workflow’ | Manual Trigger                   | (Disabled) manual workflow trigger           | None                         | Google Sheets                 |                                                                |
| Google Sheets               | Google Sheets                      | (Disabled) for spreadsheet input             | When clicking ‘Execute workflow’ | Loop Over Items               |                                                                |
| Loop Over Items             | Split in Batches                   | (Disabled) batch processing                   | Google Sheets                 | None                         |                                                                |
| Sticky Note                 | Sticky Note                       | Various notes/annotations                     | None                         | None                         |                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Node**  
   - Create a **Form Trigger** node named “On form submission”. This node will receive inputs: company name and domain. Obtain and set the webhook URL.

2. **Set Input Variables**  
   - Add a **Set** node named “Set company name and domain”. Map inputs from the form: company name and domain fields. This node outputs these variables for the research nodes.

3. **Search Company Profile**  
   - Add an **Airtop** node named “Search profile”. Configure it to search company profiles based on domain or name from the set node output.

4. **LinkedIn Company Data (POST)**  
   - Add an **HTTP Request** node named “Company LinkedIn Account POST”. Set to POST request with API URL for LinkedIn company data initiation, using data from “Search profile”.

5. **Wait**  
   - Add a **Wait** node named “Wait1” after the POST request to pause the workflow, allowing LinkedIn data to be ready.

6. **LinkedIn Company Data (GET)**  
   - Add an **HTTP Request** node named “Company LinkedIn Account GET”. Configure as GET request to retrieve LinkedIn company data. Connect after “Wait1”.

7. **Format LinkedIn Results**  
   - Add a **Set** node named “Set Results Company” to reformat LinkedIn GET response for merging.

8. **Hunter.io Email Search**  
   - Add a **Hunter** node named “Hunter”. Configure with Hunter.io credentials and set to search emails by the domain variable.

9. **Aggregate Hunter Results**  
   - Add an **Aggregate** node named “Aggregate” to collect Hunter results.

10. **Format Hunter Results**  
    - Add a **Set** node named “Hunter Results” to format aggregated Hunter data.

11. **Perplexity AI Search**  
    - Add an **HTTP Request** node named “Perplexity Search”. Set to call Perplexity AI API with query parameters based on company name/domain. Enable retries with 5-second intervals.

12. **Format Perplexity Results**  
    - Add a **Set** node named “Perplexity Results” to format Perplexity API response.

13. **Website Scraping**  
    - Add an **Airtop** node named “Scrape webpage”. Configure to scrape the company’s website using the domain input.

14. **Analyze Scraped Content**  
    - Add a **LangChain chain LLM** node named “Analyze scraped Page”. Configure with an appropriate LLM chain prompt to analyze webpage data.

15. **Attach AI Model to Scrape Analysis**  
    - Add a **LangChain OpenAI chat model** node named “OpenAI Chat Model”. Connect it as the AI model for “Analyze scraped Page”.

16. **Merge All Results**  
    - Add a **Merge** node named “Merge”. Connect inputs from “Hunter Results”, “Perplexity Results”, “Set Results Company”, “Analyze scraped Page”, and directly from “Set company name and domain”.

17. **Generate Report with AI**  
    - Add a **LangChain OpenAI chat model** node named “OpenAI Chat Model2” for report generation. Connect output of “Merge” as input.

18. **Chain Report Generation**  
    - Add a **LangChain chain LLM** node named “Generate report” connected to “OpenAI Chat Model2” output.

19. **Prepare Google Docs Offer Document**  
    - Add a **Google Docs** node named “Get Offer”. Configure to retrieve or create a Google Docs template/document.

20. **ISCP Scoring**  
    - Add a **LangChain chain LLM** node named “ISCP score”, connected to “Get Offer”.

21. **Parse AI Output for Scoring**  
    - Add a **LangChain output parser** node named “Structured Output Parser”. Connect its output to “ISCP score”.

22. **Attach AI Model for ISCP**  
    - Add a **LangChain OpenAI chat model** node named “OpenAI Chat Model3”. Connect as AI model for “ISCP score”.

23. **Create Final Google Docs Document**  
    - Add a **Google Docs** node named “Create doc”. Configure to create a new Google Document and connect output from “ISCP score”.

24. **Add Report Content to Document**  
    - Add a **Google Docs** node named “Add report to doc”. Configure to add the generated report text to the document created in the previous step.

25. **Connect all nodes as per described flow**  
    - Ensure all nodes are connected according to the dependencies outlined in section 2.

26. **Configure Credentials**  
    - Setup credentials for:  
      - Hunter.io API  
      - LinkedIn API (OAuth2 or API key as needed)  
      - OpenAI API (for LangChain nodes)  
      - Perplexity API (if applicable)  
      - Google OAuth2 for Google Docs nodes  
      - Airtop API credentials

27. **Deploy and Test**  
    - Deploy the workflow, test with sample company names and domains, verify each step’s output and error handling.

---

### 5. General Notes & Resources

| Note Content                                                                                  | Context or Link                                                                                                   |
|-----------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| "This could take a few minutes depending on the number of rows"                               | Note on "Search profile" node indicating that Airtop search duration depends on input size                        |
| Workflow leverages multiple AI models via LangChain integration with OpenAI Chat Models       | See https://docs.n8n.io/integrations/builtin/nodes/n8n-nodes-langchain/ for LangChain node details                |
| Google Docs nodes require OAuth2 credentials with appropriate scopes for document creation/editing | https://developers.google.com/docs/api/guides/authorizing                                                      |
| Hunter.io API quota and rate limiting may impact execution, ensure valid API key setup         | https://hunter.io/api                                                                                             |
| LinkedIn API usage requires proper authentication & permissions, watch for rate limits         | https://docs.microsoft.com/en-us/linkedin/                                                                      |

---

**Disclaimer:**  
The provided text is exclusively derived from an automated n8n workflow configuration. It strictly complies with content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.

---