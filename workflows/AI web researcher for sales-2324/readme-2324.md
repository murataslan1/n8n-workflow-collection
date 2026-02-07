AI web researcher for sales

https://n8nworkflows.xyz/workflows/ai-web-researcher-for-sales-2324


# AI web researcher for sales

### 1. Workflow Overview

This workflow, titled **AI Web Researcher for Sales**, is designed for sales representatives and lead generation managers to automate and enhance prospecting activities by gathering relevant company information from the web using AI. It transforms unstructured inputs (such as a company name or domain) into structured, valuable data points that help personalize outreach efforts.

The workflow is divided into the following logical blocks:

- **1.1 Input Reception and Triggering**: Handles manual or scheduled initiation and retrieves rows needing enrichment from a Google Sheet.
- **1.2 Input Preparation and Looping**: Structures the input data and processes each row individually to enable batch processing.
- **1.3 AI Research Module**: Uses an AI agent powered by OpenAI GPT-4 (via LangChain) combined with external tools (SerpAPI and a sub-workflow for website content extraction) to research detailed company information.
- **1.4 Output Parsing and Data Structuring**: Parses the AI-generated output into a predefined structured schema.
- **1.5 Data Merging and Google Sheets Update**: Combines the enriched data and updates the original Google Sheet row accordingly.

The workflow integrates advanced AI capabilities with web scraping and Google Sheets management to automate complex research tasks, enhancing efficiency and accuracy in sales prospecting.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Triggering

- **Overview:**  
  This block initiates workflow execution either manually or on a schedule and fetches rows from Google Sheets that require data enrichment (i.e., those with an unset or specific enrichment status).

- **Nodes Involved:**  
  - Schedule Trigger  
  - When clicking "Test workflow" (Manual Trigger)  
  - Get rows to enrich (Google Sheets)

- **Node Details:**

  - **Schedule Trigger**  
    - Type: scheduleTrigger  
    - Role: Triggers workflow every 2 hours automatically.  
    - Config: Interval set to every 2 hours.  
    - Inputs: None  
    - Outputs: Connects to "Get rows to enrich".  
    - Edge Cases: Misconfiguration may cause missed triggers; time zone considerations apply.

  - **When clicking "Test workflow"**  
    - Type: manualTrigger  
    - Role: Allows manual execution for testing or immediate runs.  
    - Inputs: None  
    - Outputs: Connects to "Get rows to enrich".  
    - Edge Cases: None significant.

  - **Get rows to enrich**  
    - Type: googleSheets  
    - Role: Retrieves all rows from a Google Sheet where enrichment is needed.  
    - Config: Uses OAuth2 credentials; filters rows based on "enrichment_status" column. Returns all matching rows.  
    - Inputs: Trigger nodes  
    - Outputs: Connects to "Input" node for further processing.  
    - Edge Cases: Google API quota limits, permission/auth errors, missing or malformed data in sheet.

---

#### 2.2 Input Preparation and Looping

- **Overview:**  
  Prepares each row for processing by extracting relevant input fields and loops over rows one by one to ensure manageable AI calls and data handling.

- **Nodes Involved:**  
  - Input (Set node)  
  - Loop Over Items (SplitInBatches)

- **Node Details:**

  - **Input**  
    - Type: set  
    - Role: Extracts and assigns key variables "company_input" (string) and "row_number" (number) from each row.  
    - Config: Uses expressions `={{ $json.input }}` and `={{ $json.row_number }}` to map data.  
    - Inputs: Output from "Get rows to enrich"  
    - Outputs: Connects to "Loop Over Items".  
    - Edge Cases: Missing or unexpected input data may cause failure in downstream nodes.

  - **Loop Over Items**  
    - Type: splitInBatches  
    - Role: Processes each row individually to avoid bulk processing issues and control execution flow.  
    - Config: Default batch size (processing one item at a time).  
    - Inputs: From "Input" node.  
    - Outputs: First output leads to AI processing; second output merges enriched data.  
    - Edge Cases: Large datasets could slow workflow; batch size should be tuned accordingly.

---

#### 2.3 AI Research Module

- **Overview:**  
  Core AI block that uses a LangChain AI agent with OpenAI GPT-4 to research company data by querying Google (via SerpAPI) and scraping website content (via a sub-workflow). The AI is prompted with specific instructions to extract defined data points.

- **Nodes Involved:**  
  - AI company researcher (LangChain Agent)  
  - SerpAPI - Search Google (LangChain tool)  
  - Get website content (LangChain toolWorkflow)  
  - OpenAI Chat Model (LangChain LM Chat OpenAI)

- **Node Details:**

  - **AI company researcher**  
    - Type: @n8n/n8n-nodes-langchain.agent  
    - Role: Central AI agent orchestrating research tasks.  
    - Config:  
      - Prompt explicitly instructs to find the company’s LinkedIn URL, domain, market (B2B/B2C), cheapest plan, enterprise plan presence, API offering, free trial availability, case study link, and integrations.  
      - Max iterations set to 10 to allow iterative reasoning.  
      - Uses output parser.  
    - Inputs: From "Loop Over Items" (each company input), outputs to "AI Researcher Output Data".  
    - Sub-workflows/tools: Calls "SerpAPI - Search Google" and "Get website content" as tools for data retrieval.  
    - Edge Cases: API limits, prompt misinterpretation, network failures, missing or ambiguous data online.

  - **SerpAPI - Search Google**  
    - Type: @n8n/n8n-nodes-langchain.toolSerpApi  
    - Role: Performs Google searches via SerpAPI to gather relevant search results.  
    - Config: Uses SerpAPI credentials; default parameters with no customizations specified.  
    - Inputs: Invoked as a tool by AI agent.  
    - Edge Cases: API quota exceeded, invalid API key, search results rate-limited.

  - **Get website content**  
    - Type: @n8n/n8n-nodes-langchain.toolWorkflow  
    - Role: Sub-workflow that visits a URL and extracts the main HTML content.  
    - Config:  
      - Sub-workflow includes HTTP Request node to fetch the website and an HTML extraction node to parse the body content excluding `<head>`.  
      - Input schema requires a URL string.  
      - Returns clean text content as "body".  
    - Inputs: Called as a tool by AI agent with URL parameter.  
    - Edge Cases: Website unreachable, HTTP errors, incorrect URL, content extraction failures.

  - **OpenAI Chat Model**  
    - Type: @n8n/n8n-nodes-langchain.lmChatOpenAi  
    - Role: Provides GPT-4 based language model capabilities to the AI agent.  
    - Config: Model set to "gpt-4o" with temperature 0.3 for balanced creativity and precision.  
    - Credentials: OpenAI API key required.  
    - Inputs: Connected to AI agent node.  
    - Edge Cases: API rate limits, service outages, prompt token length limits.

---

#### 2.4 Output Parsing and Data Structuring

- **Overview:**  
  Parses the AI agent’s raw output into a structured JSON object matching the predefined schema, ensuring consistency and downstream usability.

- **Nodes Involved:**  
  - Structured Output Parser  
  - AI Researcher Output Data (Set node)

- **Node Details:**

  - **Structured Output Parser**  
    - Type: @n8n/n8n-nodes-langchain.outputParserStructured  
    - Role: Converts AI output to structured JSON based on a manual JSON schema.  
    - Config: Schema defines properties such as domain, linkedinUrl, market, cheapest_plan (number), has_enterprise_plan (boolean), has_API (boolean), has_free_trial (boolean), integrations (array of strings), case_study_link.  
    - Inputs: Connected as output parser to AI company researcher.  
    - Outputs: Parsed JSON forwarded to "AI Researcher Output Data".  
    - Edge Cases: Parsing failures if AI output is malformed or deviates from expected format.

  - **AI Researcher Output Data**  
    - Type: set  
    - Role: Maps parsed output properties into named fields for easier access and merging.  
    - Config: Assigns all properties from parsed output (`$json.output`) to individual fields like domain, linkedinUrl, market, etc.  
    - Inputs: From Structured Output Parser.  
    - Outputs: Connected to "Merge data".  
    - Edge Cases: Missing fields or null values handled gracefully.

---

#### 2.5 Data Merging and Google Sheets Update

- **Overview:**  
  Combines original input data and enriched AI research data, then updates the corresponding row in Google Sheets with the new information and marks enrichment as done.

- **Nodes Involved:**  
  - Merge data (Merge node)  
  - Google Sheets - Update Row with data

- **Node Details:**

  - **Merge data**  
    - Type: merge  
    - Role: Combines the original input row and the AI-enriched data by position (index) to form a single data object for updating.  
    - Config: Combination mode set to "mergeByPosition".  
    - Inputs: Two inputs: one from "Loop Over Items" (original row), one from "AI Researcher Output Data".  
    - Outputs: Connected to Google Sheets update node.  
    - Edge Cases: Mismatched batch sizes or order could cause data misalignment.

  - **Google Sheets - Update Row with data**  
    - Type: googleSheets  
    - Role: Updates the original Google Sheets row with enriched fields and sets "enrichment_status" to "done".  
    - Config:  
      - Uses OAuth2 credentials.  
      - Updates columns: domain, market, linkedinUrl, integrations, cheapest_plan, has_free_trial, has_entreprise_plan, last_case_study_link, enrichment_status, row_number (used as matching key).  
      - Sheet and document IDs configured for the specific Google Sheet.  
    - Inputs: From "Merge data".  
    - Edge Cases: Google API errors, permission issues, concurrent edits causing conflicts.

---

### 3. Summary Table

| Node Name                      | Node Type                                   | Functional Role                                    | Input Node(s)                        | Output Node(s)                               | Sticky Note                                                                                                       |
|--------------------------------|---------------------------------------------|---------------------------------------------------|------------------------------------|---------------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| When clicking "Test workflow"   | manualTrigger                              | Manual workflow trigger                             | None                               | Get rows to enrich                           | Run the workflow manually or activate it to run it every 2 hours                                                  |
| Schedule Trigger               | scheduleTrigger                            | Scheduled workflow trigger every 2 hours            | None                               | Get rows to enrich                           | Run the workflow manually or activate it to run it every 2 hours                                                  |
| Get rows to enrich             | googleSheets                               | Retrieves rows requiring enrichment from Google Sheets | When clicking "Test workflow", Schedule Trigger | Input                                      | In this workflow, I use Google Sheets to store the results. Use my [template](https://docs.google.com/spreadsheets/d/1vR6s2nlTwu01v3GP7wvSRWS5W49FJIh20ZF7AUkmMDo/edit?usp=sharing) to get started faster |
| Input                         | set                                        | Prepares input data fields for processing          | Get rows to enrich                 | Loop Over Items                              |                                                                                                                   |
| Loop Over Items               | splitInBatches                             | Processes rows one by one                           | Input                             | AI company researcher, Merge data           | Process rows 1 by 1                                                                                                |
| AI company researcher         | @n8n/n8n-nodes-langchain.agent             | AI agent orchestrating research using OpenAI and tools | Loop Over Items                   | AI Researcher Output Data                     | Ask AI what are the information you are looking for about the company                                              |
| OpenAI Chat Model             | @n8n/n8n-nodes-langchain.lmChatOpenAi      | Provides GPT-4 language model for AI agent         | AI company researcher (ai_languageModel) | AI company researcher                       |                                                                                                                   |
| SerpAPI - Search Google       | @n8n/n8n-nodes-langchain.toolSerpApi       | Queries Google search via SerpAPI                   | AI company researcher (ai_tool)   | AI company researcher                       | Get your free API key here https://serpapi.com/                                                                   |
| Get website content           | @n8n/n8n-nodes-langchain.toolWorkflow       | Sub-workflow to fetch and extract website text     | AI company researcher (ai_tool)   | AI company researcher                       | This tool will return the text from the given URL                                                                 |
| Structured Output Parser      | @n8n/n8n-nodes-langchain.outputParserStructured | Parses AI output to structured JSON                  | AI company researcher (ai_outputParser) | AI Researcher Output Data                   | Precise here the format in which you need the data to be                                                            |
| AI Researcher Output Data     | set                                        | Maps parsed AI output to named fields               | Structured Output Parser          | Merge data                                  |                                                                                                                   |
| Merge data                   | merge                                      | Combines original input row and AI enriched data    | Loop Over Items, AI Researcher Output Data | Google Sheets - Update Row with data       |                                                                                                                   |
| Google Sheets - Update Row with data | googleSheets                               | Updates Google Sheets row with enriched data         | Merge data                       | Loop Over Items                              |                                                                                                                   |
| Sticky Note                  | stickyNote                                 | Documentation and instructions                       | None                            | None                                        | ## Read Me: Workflow capabilities, instructions, and video guide link                                              |
| Sticky Note1                 | stickyNote                                 | Documentation explaining row-by-row processing       | None                            | None                                        | Process rows 1 by 1                                                                                                |
| Sticky Note2                 | stickyNote                                 | Notes on structured output parser                     | None                            | None                                        | Precise here the format in which you need the data to be                                                            |
| Sticky Note3                 | stickyNote                                 | Notes on AI prompt content                             | None                            | None                                        | Ask AI what are the information you are looking for about the company                                              |
| Sticky Note4                 | stickyNote                                 | SerpAPI API key information                           | None                            | None                                        | Get your free API key here https://serpapi.com/                                                                   |
| Sticky Note5                 | stickyNote                                 | Instructions on running workflow manually or scheduled | None                            | None                                        | Run the workflow manually or activate it to run it every 2 hours                                                  |
| Sticky Note6                 | stickyNote                                 | Alternative Google search method using ScrapingBee    | None                            | None                                        | Instead of SERP API module, you can also use this custom module for ScrapingBee. Get your free API key here https://www.scrapingbee.com/ |
| Sticky Note7                 | stickyNote                                 | Google Sheets template instructions                    | None                            | None                                        | Use my Google Sheets template to get started faster: [link](https://docs.google.com/spreadsheets/d/1vR6s2nlTwu01v3GP7wvSRWS5W49FJIh20ZF7AUkmMDo/edit?usp=sharing) |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger node** named `When clicking "Test workflow"` with default settings for manual initiation.

2. **Create a Schedule Trigger node** named `Schedule Trigger` configured to run every 2 hours:
   - In the "Rule" section, set interval hours to 2.

3. **Create a Google Sheets node** named `Get rows to enrich`:
   - Operation: Read rows.
   - Document ID: Use your Google Sheets document ID.
   - Sheet Name: Use the sheet name or GID.
   - Add filter on column `enrichment_status` to select rows that need enrichment (e.g., empty or specific status).
   - Authenticate using your Google OAuth2 credentials.

4. Connect both triggers (`When clicking "Test workflow"` and `Schedule Trigger`) to `Get rows to enrich`.

5. **Create a Set node** named `Input`:
   - Add two fields:
     - `company_input` (string) with expression: `={{ $json.input }}`
     - `row_number` (number) with expression: `={{ $json.row_number }}`
   - Connect `Get rows to enrich` output to this node.

6. **Add a SplitInBatches node** named `Loop Over Items`:
   - Default batch size of 1 (process rows one at a time).
   - Connect `Input` node output to this node.

7. **Set up AI nodes:**

   - **Create an OpenAI Chat Model node** named `OpenAI Chat Model`:
     - Model: Select GPT-4 or equivalent.
     - Temperature: 0.3.
     - Authenticate with OpenAI API key.

   - **Create a LangChain Agent node** named `AI company researcher`:
     - Set prompt with instructions to research company info from `company_input`.
     - Assign the `OpenAI Chat Model` node as the language model.
     - Enable output parser.
     - Add tools:
       - **SerpAPI node** for Google Search (requires SerpAPI API key).
       - **Tool Workflow node** for “Get website content” sub-workflow.
     - Connect `Loop Over Items` (first output) to this node.

8. **Create a LangChain toolWorkflow node** named `Get website content`:
   - Import or build a sub-workflow with:
     - Trigger node (`Execute Workflow Trigger`).
     - HTTP Request node configured to fetch URL passed as input.
     - HTML node extracting `<html>` content while skipping `<head>`.
   - Input schema must accept a URL.
   - Description: "This tool will return the text from the given URL."
   - Link this tool to `AI company researcher`.

9. **Create a LangChain toolSerpApi node** named `SerpAPI - Search Google`:
   - Use SerpAPI credentials.
   - Default settings.
   - Link this tool to `AI company researcher`.

10. **Create a LangChain outputParserStructured node** named `Structured Output Parser`:
    - Define manual JSON schema specifying properties:
      - domain (string|null)
      - linkedinUrl (string|null)
      - market (string|null)
      - cheapest_plan (number|null)
      - has_enterprise_plan (boolean|null)
      - has_API (boolean|null)
      - has_free_trial (boolean|null)
      - integrations (array|null of strings)
      - case_study_link (string|null)
    - Connect it as output parser to `AI company researcher`.

11. **Create a Set node** named `AI Researcher Output Data`:
    - Map each field from the parsed output to named fields (e.g., `domain`, `linkedinUrl`, etc.).
    - Connect from `Structured Output Parser`.

12. **Create a Merge node** named `Merge data`:
    - Mode: Combine
    - Combination Mode: Merge By Position
    - Connect first input to second output of `Loop Over Items`.
    - Connect second input to `AI Researcher Output Data`.

13. **Create a Google Sheets node** named `Google Sheets - Update Row with data`:
    - Operation: Update row.
    - Document ID and Sheet Name to match the source sheet.
    - Map columns with enriched fields (`domain`, `market`, `linkedinUrl`, `integrations`, `cheapest_plan`, `has_free_trial`, `has_enterprise_plan`, `last_case_study_link`, and mark `enrichment_status` as “done”).
    - Use `row_number` as matching column.
    - Authenticate with Google Sheets OAuth2 credentials.
    - Connect output of `Merge data` to this node.

14. **Connect output of `Google Sheets - Update Row with data` back to `Loop Over Items`** to continue batch processing.

15. Optionally, add Sticky Notes at key points for documentation and instructions, replicating the content from the original workflow.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                              | Context or Link                                                                                                             |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------|
| This workflow allows you to do account research with the web using AI. It has 2 capabilities: Research Google using SerpAPI and Visit/Get website content using a sub-workflow. From unstructured input like a domain or company name, it returns key company data. | General workflow description and purpose.                                                                                   |
| Detailed instructions + video guide can be found here: [AI Web research with n8n](https://lempire.notion.site/AI-Web-research-with-n8n-a25aae3258d0423481a08bd102f16906)                                                                 | Link to documentation and video guide.                                                                                       |
| Get your free SerpAPI API key here: https://serpapi.com/                                                                                                                                                                                  | SerpAPI credential setup.                                                                                                    |
| Instead of SerpAPI, you can use ScrapingBee for Google search which is more cost-efficient. Get your free API key here: https://www.scrapingbee.com/                                                                                     | Alternative Google search API integration.                                                                                   |
| Use this Google Sheets template to get started faster: [Template](https://docs.google.com/spreadsheets/d/1vR6s2nlTwu01v3GP7wvSRWS5W49FJIh20ZF7AUkmMDo/edit?usp=sharing)                                                                 | Template sheet for input data and result storage.                                                                            |
| Run the workflow manually via the manual trigger or activate the schedule trigger to run every 2 hours.                                                                                                                                | Execution options.                                                                                                           |

---

This comprehensive documentation enables advanced users and automation agents to fully understand, reproduce, and modify the "AI Web Researcher for Sales" workflow with awareness of potential edge cases and integration points.