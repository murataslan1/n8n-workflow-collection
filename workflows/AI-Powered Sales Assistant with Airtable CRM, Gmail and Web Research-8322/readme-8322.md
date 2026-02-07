AI-Powered Sales Assistant with Airtable CRM, Gmail and Web Research

https://n8nworkflows.xyz/workflows/ai-powered-sales-assistant-with-airtable-crm--gmail-and-web-research-8322


# AI-Powered Sales Assistant with Airtable CRM, Gmail and Web Research

---

### 1. Workflow Overview

This workflow is an AI-powered sales assistant designed to integrate Airtable CRM, Gmail, and web research tools to automate lead management and communication. It targets sales teams and customer relationship managers who want to process incoming leads, enrich lead data with online research, summarize information, and automate email interactions seamlessly.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception and Triggering:** Captures new data entries or emails via Airtable and Gmail triggers.
- **1.2 Lead Classification and Routing:** Uses switches and AI agents to determine the next steps based on the input type.
- **1.3 AI Processing and Data Enrichment:** Employs LangChain AI agents and OpenAI chat models for lead analysis, summary generation, and CRM data updates.
- **1.4 Web Research and Data Scraping:** Performs HTTP requests to find and scrape lead-related website and LinkedIn URLs.
- **1.5 Document Creation and Email Actions:** Generates Google Docs based on lead info and sends emails through Gmail nodes.
- **1.6 CRM Integration and Conditional Logic:** Updates Airtable CRM records and manages workflow branching with conditional nodes.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception and Triggering

- **Overview:**  
  This block listens for incoming data either from Airtable updates or Gmail emails to initiate the workflow.

- **Nodes Involved:**  
  - Airtable Trigger  
  - Gmail Trigger  

- **Node Details:**

  - **Airtable Trigger**  
    - Type: Airtable Trigger node  
    - Role: Monitors Airtable base/table for new or updated records to start the workflow.  
    - Configuration: Default trigger with no specified filters (implied to trigger on any change).  
    - Inputs: External event (Airtable record change).  
    - Outputs: Passes data to the Switch node for routing.  
    - Failure cases: Connectivity issues, Airtable API limits, authentication errors.

  - **Gmail Trigger**  
    - Type: Gmail Trigger node  
    - Role: Listens for new Gmail messages that start email-related processing.  
    - Configuration: Default inbox monitoring; OAuth2 credentials required.  
    - Inputs: New incoming email event.  
    - Outputs: Passes email data to Switch2 node for routing.  
    - Failure cases: Gmail API authentication errors, quota limits, network errors.

---

#### 1.2 Lead Classification and Routing

- **Overview:**  
  This block uses conditional switches and AI agents to route incoming data into appropriate processing streams.

- **Nodes Involved:**  
  - Switch  
  - Switch1  
  - Switch2  
  - If  

- **Node Details:**

  - **Switch**  
    - Type: Switch node  
    - Role: Routes Airtable-triggered data into different Google Docs nodes based on conditions (likely lead type or status).  
    - Configuration: Multiple outputs (6 branches) connected to various Google Docs nodes.  
    - Inputs: Data from Airtable Trigger.  
    - Outputs: To Google Docs nodes.  
    - Edge cases: Missing expected data fields causing routing failures.

  - **Switch1**  
    - Type: Switch node  
    - Role: Routes Gmail-triggered data after Gmail2 node, leading to Gmail1 node for email sending.  
    - Configuration: Single output to Gmail1.  
    - Inputs: Data from Gmail2.  
    - Outputs: Gmail1 node.  
    - Edge cases: Misclassification causing wrong routing.

  - **Switch2**  
    - Type: Switch node  
    - Role: Routes Gmail-triggered data either to "Add lead to CRM" AI agent or to an Airtable node depending on email content or metadata.  
    - Inputs: Gmail Trigger node.  
    - Outputs: Add lead to CRM or Airtable3.  
    - Edge cases: Incorrect condition evaluation.

  - **If**  
    - Type: If node  
    - Role: Branches flow based on conditions from Airtable3 node output (e.g., whether a lead is qualified).  
    - Inputs: Airtable3 output.  
    - Outputs: To AI Agent1 node.  
    - Edge cases: Condition evaluation errors, null input data.

---

#### 1.3 AI Processing and Data Enrichment

- **Overview:**  
  Utilizes multiple LangChain AI agents and OpenAI chat models to analyze lead data, generate summaries, parse structured outputs, and enrich CRM entries.

- **Nodes Involved:**  
  - AI Agent  
  - AI Agent1  
  - Add lead to CRM (agent)  
  - Lead summary Agent  
  - OpenAI Chat Model  
  - OpenAI Chat Model1  
  - OpenAI Chat Model2  
  - OpenAI Chat Model3  
  - Structured Output Parser  
  - Structured Output Parser1  

- **Node Details:**

  - **AI Agent / AI Agent1 / Add lead to CRM / Lead summary Agent**  
    - Type: LangChain AI Agent nodes  
    - Role: Execute AI-driven tasks such as lead qualification, lead addition, summarization, and decision-making.  
    - Configuration: Connected to respective OpenAI Chat Model nodes as language models; receive structured output from parsers.  
    - Inputs: Data from Google Docs, Airtable, Gmail, or parsers.  
    - Outputs: To Gmail nodes, Airtable updates, or further AI agents.  
    - Edge cases: API response delays, rate limits, parsing errors.

  - **OpenAI Chat Model / OpenAI Chat Model1 / OpenAI Chat Model2 / OpenAI Chat Model3**  
    - Type: OpenAI Chat Model nodes  
    - Role: Provide conversational AI capabilities for the agents.  
    - Configuration: Use OpenAI credentials; configured for chat completions.  
    - Inputs: Text prompts from agents or workflow nodes.  
    - Outputs: AI-generated text to agents.  
    - Edge cases: Token limits, API errors, authentication failures.

  - **Structured Output Parser / Structured Output Parser1**  
    - Type: LangChain Structured Output Parser nodes  
    - Role: Parse AI agent responses into structured JSON or data formats for further processing.  
    - Inputs: AI-generated text responses.  
    - Outputs: Parsed data to AI agents or workflow nodes.  
    - Edge cases: Parsing failures due to unexpected AI output formats.

---

#### 1.4 Web Research and Data Scraping

- **Overview:**  
  Gathers additional lead information by finding and scraping websites and LinkedIn URLs for each lead.

- **Nodes Involved:**  
  - Find website URL  
  - Scrape website URL  
  - Find Linkedin URL  
  - Markdown  

- **Node Details:**

  - **Find website URL**  
    - Type: HTTP Request node  
    - Role: Queries online resources to find a lead’s website URL based on provided data.  
    - Configuration: Likely uses search APIs or custom HTTP requests.  
    - Inputs: Lead data from AI agent or Airtable.  
    - Outputs: To Scrape website URL.  
    - Edge cases: HTTP errors, missing or incomplete results.

  - **Scrape website URL**  
    - Type: HTTP Request node  
    - Role: Scrapes the found website URL to extract lead-related information.  
    - Configuration: HTTP GET request; possibly with custom scraping logic or selectors.  
    - Inputs: Website URL from Find website URL.  
    - Outputs: To Markdown node.  
    - Edge cases: Website changes causing scraping failures, timeouts.

  - **Markdown**  
    - Type: Markdown node  
    - Role: Converts scraped raw data into markdown format for readability or further parsing.  
    - Inputs: Raw scraped data from Scrape website URL.  
    - Outputs: To Find Linkedin URL node.  
    - Edge cases: Conversion errors if input is malformed.

  - **Find Linkedin URL**  
    - Type: HTTP Request node  
    - Role: Searches for the lead’s LinkedIn profile URL to enrich the lead’s profile.  
    - Configuration: Uses online search or LinkedIn APIs.  
    - Inputs: Markdown data or lead identifiers.  
    - Outputs: To Lead summary Agent for further processing.  
    - Edge cases: API limits, privacy restrictions.

---

#### 1.5 Document Creation and Email Actions

- **Overview:**  
  Generates Google Docs documents related to leads and manages email sending through Gmail nodes.

- **Nodes Involved:**  
  - Google Docs (nodes 1 to 6)  
  - Gmail  
  - Gmail1  
  - Gmail2  

- **Node Details:**

  - **Google Docs, Google Docs1, Google Docs2, Google Docs3, Google Docs4, Google Docs5, Google Docs6**  
    - Type: Google Docs nodes (standard and Tool variant)  
    - Role: Create or update Google Docs documents with lead information or AI-generated content.  
    - Configuration: Connected to Switch node outputs; use Google OAuth2 credentials.  
    - Inputs: Data from Switch nodes or AI agents.  
    - Outputs: To AI Agent or AI Agent1 nodes for further processing.  
    - Edge cases: API quotas, permission errors.

  - **Gmail / Gmail1 / Gmail2**  
    - Type: Gmail nodes (standard and webhook-enabled)  
    - Role: Send emails to leads or internal team based on AI agent outputs or workflow logic.  
    - Configuration: Configured with Gmail OAuth2 credentials; some nodes have webhook IDs for asynchronous handling.  
    - Inputs: Email content and addresses from AI agents or Switch nodes.  
    - Outputs: Terminate or continue workflow as appropriate.  
    - Edge cases: Authentication failure, email sending limits, invalid email addresses.

---

#### 1.6 CRM Integration and Conditional Logic

- **Overview:**  
  Updates Airtable CRM with new or enriched lead data using Airtable nodes and manages conditional flow based on CRM data.

- **Nodes Involved:**  
  - Airtable  
  - Airtable1  
  - Airtable2  
  - Airtable3  

- **Node Details:**

  - **Airtable / Airtable1 / Airtable2 / Airtable3**  
    - Type: Airtable nodes (standard and Tool variant)  
    - Role: Read, write, or update lead records in Airtable CRM.  
    - Configuration: Airtable API key and base/table specified; used for CRM data management.  
    - Inputs: Lead data from AI agents or web scraping nodes.  
    - Outputs: To conditional nodes (If) or AI agents.  
    - Edge cases: API rate limits, record locking, data validation errors.

---

### 3. Summary Table

| Node Name           | Node Type                       | Functional Role                     | Input Node(s)           | Output Node(s)           | Sticky Note                          |
|---------------------|--------------------------------|-----------------------------------|------------------------|--------------------------|------------------------------------|
| Airtable Trigger    | Airtable Trigger                | Starts workflow on Airtable change| -                      | Switch                   |                                    |
| Gmail Trigger       | Gmail Trigger                  | Starts workflow on new Gmail      | -                      | Switch2                  |                                    |
| Switch              | Switch                        | Routes Airtable data to Google Docs| Airtable Trigger       | Google Docs, Docs1..Docs5|                                    |
| Google Docs         | Google Docs                   | Creates documents for leads       | Switch                  | AI Agent                 |                                    |
| Google Docs1        | Google Docs                   | Creates documents for leads       | Switch                  | AI Agent                 |                                    |
| Google Docs2        | Google Docs                   | Creates documents for leads       | Switch                  | AI Agent                 |                                    |
| Google Docs3        | Google Docs                   | Creates documents for leads       | Switch                  | AI Agent                 |                                    |
| Google Docs4        | Google Docs                   | Creates documents for leads       | Switch                  | AI Agent                 |                                    |
| Google Docs5        | Google Docs                   | Creates documents for leads       | Switch                  | AI Agent                 |                                    |
| AI Agent            | LangChain AI Agent            | Processes lead data and emails    | Google Docs, Gmail      | Gmail                    |                                    |
| Gmail               | Gmail                        | Sends emails                      | AI Agent                 | -                        |                                    |
| Switch2             | Switch                       | Routes Gmail-triggered data       | Gmail Trigger           | Add lead to CRM, Airtable3|                                   |
| Add lead to CRM     | LangChain AI Agent            | Adds leads to CRM                 | Switch2                 | Find website URL          |                                    |
| Find website URL    | HTTP Request                 | Finds lead website URLs           | Add lead to CRM         | Scrape website URL        |                                    |
| Scrape website URL  | HTTP Request                 | Scrapes lead website data         | Find website URL        | Markdown                  |                                    |
| Markdown            | Markdown                     | Converts scraped data to markdown | Scrape website URL      | Find Linkedin URL         |                                    |
| Find Linkedin URL   | HTTP Request                 | Finds LinkedIn URL for lead       | Markdown                | Lead summary Agent        |                                    |
| Lead summary Agent  | LangChain AI Agent            | Summarizes lead info              | Find Linkedin URL       | Airtable                  |                                    |
| Airtable            | Airtable                     | Updates CRM with lead summary     | Lead summary Agent      | -                        |                                    |
| Gmail2              | Gmail                        | Sends emails                      | AI Agent1                | Switch1                   |                                    |
| Switch1             | Switch                       | Routes after Gmail2 to Gmail1     | Gmail2                  | Gmail1                    |                                    |
| Gmail1              | Gmail                        | Email sending                     | Switch1                 | -                        |                                    |
| Airtable3           | Airtable                     | Reads/updates CRM data            | Switch2                 | If                        |                                    |
| If                  | If                           | Conditional branching             | Airtable3               | AI Agent1                 |                                    |
| AI Agent1           | LangChain AI Agent            | Processes conditional leads       | If                      | Gmail2                    |                                    |
| OpenAI Chat Models  | OpenAI Chat Model nodes       | Provide AI language capabilities  | Various AI Agents        | AI Agents                 |                                    |
| Structured Output Parsers | LangChain Structured Output Parser | Parses AI responses             | AI Agents                | Add lead to CRM, AI Agent1|                                    |
| Airtable1           | Airtable Tool                | CRM data operations               | -                       | AI Agent1                 |                                    |
| Airtable2           | Airtable Tool                | CRM data operations               | -                       | AI Agent1                 |                                    |
| Google Docs6        | Google Docs Tool             | Document generation               | -                       | AI Agent1                 |                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Airtable Trigger Node:**  
   - Type: Airtable Trigger  
   - Configure with Airtable API credentials.  
   - Set to trigger on record creation or update in the CRM base/table.

2. **Create Gmail Trigger Node:**  
   - Type: Gmail Trigger  
   - Configure Gmail OAuth2 credentials.  
   - Set to trigger on new incoming emails.

3. **Add Switch Node (Switch):**  
   - Connect Airtable Trigger output here.  
   - Configure multiple outputs to route leads based on field values (e.g., lead status/type).  
   - Outputs connect to Google Docs nodes.

4. **Create Google Docs Nodes (6 copies):**  
   - Configure each with Google OAuth2 credentials.  
   - Set to create or update documents with lead-related data.  
   - Connect each to the respective Switch output.

5. **Create AI Agent Node:**  
   - Type: LangChain AI Agent  
   - Connect all Google Docs outputs to this node.  
   - Configure to use OpenAI Chat Model as the language model.

6. **Create OpenAI Chat Model Node:**  
   - Configure OpenAI API key.  
   - Connect to AI Agent node as language model.

7. **Connect AI Agent output to Gmail Node:**  
   - Create Gmail node with OAuth2 credentials.  
   - Configure to send emails using AI-generated content.

8. **Add Switch2 Node:**  
   - Connect Gmail Trigger output here.  
   - Configure to route emails either to "Add lead to CRM" or Airtable3 node.

9. **Create Add lead to CRM AI Agent Node:**  
   - Configure with OpenAI Chat Model1 for adding leads.  
   - Connect to Find website URL node.

10. **Create Find website URL HTTP Request Node:**  
    - Configure to query search engine or API for website URL.  
    - Connect output to Scrape website URL node.

11. **Create Scrape website URL HTTP Request Node:**  
    - Configure GET request to scrape website content.  
    - Connect output to Markdown node.

12. **Create Markdown Node:**  
    - Converts scraped HTML/text to markdown format.  
    - Connect output to Find Linkedin URL node.

13. **Create Find Linkedin URL HTTP Request Node:**  
    - Configure to search for LinkedIn profile URL.  
    - Connect output to Lead summary Agent.

14. **Create Lead summary Agent Node:**  
    - LangChain AI Agent with OpenAI Chat Model2.  
    - Summarizes lead info and sends to Airtable node.

15. **Create Airtable Node:**  
    - Configure with Airtable credentials to update CRM with lead summary.

16. **Create Airtable3 Node:**  
    - Reads or updates CRM data based on Gmail routing.  
    - Connect output to If node.

17. **Create If Node:**  
    - Set condition to check lead qualification or status.  
    - True path connects to AI Agent1 node.

18. **Create AI Agent1 Node:**  
    - LangChain AI Agent with OpenAI Chat Model3.  
    - Processes conditional leads.  
    - Output connects to Gmail2 node.

19. **Create Gmail2 Node:**  
    - Sends email responses.  
    - Output connects to Switch1.

20. **Create Switch1 Node:**  
    - Routes to Gmail1 node for final email sending.

21. **Create Gmail1 Node:**  
    - Sends emails based on Switch1 routing.

22. **Create Structured Output Parser Nodes:**  
    - Used between AI Agents and Add lead to CRM or AI Agent1 nodes to parse AI responses.

23. **Set up all credentials:**  
    - OpenAI API key for chat models.  
    - Airtable API key and base/table details.  
    - Google OAuth2 for Docs nodes.  
    - Gmail OAuth2 for Gmail nodes.

---

### 5. General Notes & Resources

| Note Content                                                                                                                       | Context or Link                           |
|------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------|
| This workflow uses LangChain AI agents integrated with OpenAI chat models for flexible and intelligent lead processing.            | LangChain & OpenAI integration            |
| Gmail nodes include webhook IDs for asynchronous email sending, ensuring reliable communication handling.                           | Gmail node webhook configuration          |
| The workflow leverages multiple Google Docs nodes to generate documents dynamically based on lead data for documentation or reporting.| Google Docs API usage                      |
| HTTP Request nodes are used for web scraping and URL discovery, requiring proper handling of HTTP errors and API limits.            | HTTP Request node details                  |
| Airtable integration requires correct API key and base/table configuration to ensure CRM data consistency.                          | Airtable API documentation                 |

---

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

---