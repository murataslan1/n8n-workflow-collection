Auto-Enrich New CRM Companies with ChatGPT Web Research via Tavily

https://n8nworkflows.xyz/workflows/auto-enrich-new-crm-companies-with-chatgpt-web-research-via-tavily-6093


# Auto-Enrich New CRM Companies with ChatGPT Web Research via Tavily

### 1. Workflow Overview

This workflow automates the enrichment of new company records created in the CentralStationCRM system by leveraging AI-driven web research. When a new company is added to the CRM, the workflow triggers an AI agent that performs a structured, in-depth web search using Tavily and ChatGPT (OpenAI’s GPT-4.1). The collected and synthesized information is then appended back to the corresponding company record as a formatted note within the CRM.

**Target Use Cases:**  
- Sales and marketing teams wanting automated enrichment of new company data to gain detailed insights.  
- Automated AI research agents consolidating web information for CRM records.  
- Integration of CentralStationCRM with AI web search and language models for enhanced data quality.

**Logical Blocks:**  
- **1.1 Input Reception:** Webhook triggered by new company creation in CentralStationCRM.  
- **1.2 AI Processing:** Orchestration of multiple AI components (OpenAI Chat Model, Tavily Websearch, AI Agent) to perform research.  
- **1.3 Output Update:** Posting AI-generated company notes back to CentralStationCRM via API.  
- **1.4 Setup Instructions:** Sticky notes providing configuration and operational guidance.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
This block listens for incoming POST requests triggered when a new company is created in CentralStationCRM. It captures the company data for use in downstream AI enrichment.

**Nodes Involved:**  
- Company created in CentralStationCRM (Webhook)

**Node Details:**  

- **Company created in CentralStationCRM**  
  - *Type:* Webhook  
  - *Technical Role:* Entry point for new company data from CentralStationCRM. Listens for POST requests on a specific webhook path.  
  - *Configuration:*  
    - HTTP Method: POST  
    - No authentication required (as per setup instructions).  
    - Webhook path: unique UUID-based path (e.g., `c8682af5-17b7-48f5-9be3-49ef787b40e5`).  
  - *Input Connections:* None (start node).  
  - *Output Connections:* Main output connected to the "Research AI Agent" node.  
  - *Potential Failures:*  
    - Missing or malformed webhook data.  
    - Webhook not triggered if improperly configured in CentralStationCRM.  
  - *Sticky Note Reference:* Sticky Note2 explains webhook setup and testing.

#### 1.2 AI Processing

**Overview:**  
This block orchestrates AI components to analyze the new company data. It uses OpenAI GPT-4.1 for generating prompts and responses, Tavily for web searches and URL extraction, and a Langchain AI Agent to integrate these inputs into a structured research output.

**Nodes Involved:**  
- OpenAI Chat Model  
- Research AI Agent  
- Tavily Websearch Search the Web  
- Tavily Websearch Extract URLs  
- a mind space prompt for the ai (ToolThink node)

**Node Details:**  

- **OpenAI Chat Model**  
  - *Type:* Langchain LM Chat OpenAI Node  
  - *Role:* Provides the GPT-4.1 language model for generating AI prompts or responses as part of the agent workflow.  
  - *Configuration:*  
    - Model: GPT-4.1 (list mode, cached).  
    - Credentials: OpenAI API key configured via n8n credentials.  
  - *Input:* Receives prompts from the AI Agent or other nodes.  
  - *Output:* Passes generated text to the Research AI Agent.  
  - *Failures:* API key limits, network errors, rate limiting, or invalid configurations.  
  - *Sticky Note Reference:* Sticky Note (6) details OpenAI API setup.

- **Research AI Agent**  
  - *Type:* Langchain AI Agent Node  
  - *Role:* Central AI orchestrator that uses input company data to perform deep German-language research on the company using a multi-step approach. It uses Tavily web search tools and integrates results into a Markdown summary.  
  - *Configuration:*  
    - Prompt includes detailed instructions to research the company name passed dynamically from webhook JSON (`{{ $json.body.record.name }}`).  
    - Structured Markdown output requested, including company name, website, headquarters, founding year, employee count, general description with sources, social media links, etc.  
  - *Inputs:*  
    - Main input from webhook node (company data).  
    - AI language model input connected to OpenAI Chat Model.  
    - AI tools input connected to Tavily Websearch nodes and the mind space prompt node.  
  - *Output:* Passes the generated Markdown research text to the next node for posting into CRM.  
  - *Failures:* AI prompt failures, missing or malformed inputs, timeout on AI model calls, or tools returning no useful data.  
  - *Version:* Uses Langchain agent v2 capabilities.  
  - *Sticky Note Reference:* Sticky Note (3) and (4) provide setup and explanation.

- **Tavily Websearch Search the Web**  
  - *Type:* Tavily Tool Node (Search)  
  - *Role:* Performs up to 15 advanced-depth web search queries based on the AI agent’s instructions or dynamic query input (`{{ $fromAI('Query', '', 'string') }}`).  
  - *Configuration:*  
    - Max results: 15  
    - Search depth: advanced  
    - Credentials: Tavily API key configured in n8n credentials.  
  - *Input:* Receives dynamic query strings from AI agent.  
  - *Output:* Provides search results to the AI agent and the next extraction node.  
  - *Failures:* API key issues, network errors, exceeding rate limits, or no search results.  

- **Tavily Websearch Extract URLs**  
  - *Type:* Tavily Tool Node (Extract URLs)  
  - *Role:* Extracts URLs from the AI-generated lists or responses (`{{ $fromAI('urls0_URLs', '', 'string') }}`) to feed back into the AI Agent for deeper analysis.  
  - *Configuration:*  
    - Accepts dynamically generated URLs from AI.  
    - Credentials: Tavily API key.  
  - *Input:* Receives URLs from AI agent output.  
  - *Output:* Sends extracted content back to the AI agent.  
  - *Failures:* API problems, empty or malformed URL lists.

- **a mind space prompt for the ai**  
  - *Type:* Langchain ToolThink Node  
  - *Role:* Provides auxiliary thinking or planning steps for the AI agent to organize searches or syntheses.  
  - *Configuration:* No specific parameters; likely used internally by AI agent.  
  - *Input and Output:* Connected as an AI tool to the Research AI Agent.  
  - *Failures:* Internal AI logic errors or timeout.

#### 1.3 Output Update

**Overview:**  
This block takes the AI-generated Markdown research report and adds it as a note to the corresponding company record in CentralStationCRM.

**Nodes Involved:**  
- Add a note to company in CentralStationCRM (HTTP Request)

**Node Details:**  

- **Add a note to company in CentralStationCRM**  
  - *Type:* HTTP Request  
  - *Role:* Posts the Markdown content generated by the AI agent into the CRM as a protocol note linked to the company.  
  - *Configuration:*  
    - Method: POST  
    - URL: `https://api.centralstationcrm.net/api/protocols.json`  
    - Body: JSON containing:  
      - company_ids (array with company ID from webhook data)  
      - type: `"ProtocolObjectNote"`  
      - badge: `"note"`  
      - content: AI Markdown output (`{{ $json.output.toJsonString() }}`)  
      - format: `"markdown"`  
    - Headers: Accept and Content-Type set to application/json.  
    - Authentication: Header Auth with CentralStationCRM API key credential.  
  - *Input:* Receives AI Markdown content from Research AI Agent node.  
  - *Output:* None (end of workflow).  
  - *Failures:* Authentication errors, invalid API key, malformed JSON, network errors, or API rate limits.  
  - *Sticky Note Reference:* Sticky Note1 contains credential setup instructions.

#### 1.4 Setup Instructions and Documentation

A set of sticky notes scattered throughout the workflow provide detailed step-by-step setup instructions, credential configurations, and operational guidelines for users and administrators.

**Sticky Notes and Content Summary:**  
- Sticky Note: Workflow purpose, overview, and branding.  
- Sticky Note1: Setup of CentralStationCRM protocol and credential selection.  
- Sticky Note2: Webhook trigger setup and test instructions.  
- Sticky Note3: Detailed CentralStationCRM webhook creation guide with screenshots.  
- Sticky Note4: Workflow summary and AI integration explanation.  
- Sticky Note5: How to get webhook URL from n8n interface.  
- Sticky Note6: CentralStationCRM API key creation instructions.  
- Sticky Note8: CentralStationCRM n8n credential creation with header authentication.  
- Sticky Note9: Overview of tools used (CentralStationCRM, ChatGPT, Tavily).  
- Sticky Note: OpenAI Node setup instructions with screenshots.

---

### 3. Summary Table

| Node Name                            | Node Type                            | Functional Role                               | Input Node(s)                 | Output Node(s)                              | Sticky Note                                                                                                        |
|------------------------------------|------------------------------------|-----------------------------------------------|------------------------------|---------------------------------------------|--------------------------------------------------------------------------------------------------------------------|
| Company created in CentralStationCRM | Webhook                            | Receives new company creation event             | None                         | Research AI Agent                           | Sticky Note2: Setup webhook trigger instructions. Sticky Note5: How to get webhook URL from n8n.                   |
| Research AI Agent                  | Langchain AI Agent                 | Orchestrates AI research and data enrichment   | Company created in CentralStationCRM, OpenAI Chat Model, Tavily nodes, ToolThink node | Add a note to company in CentralStationCRM               | Sticky Note3 & 4: AI research and workflow overview.                                                             |
| OpenAI Chat Model                 | Langchain LM Chat OpenAI Node     | Provides GPT-4.1 language model for AI agent   | Research AI Agent            | Research AI Agent                          | Sticky Note: OpenAI API key setup instructions.                                                                    |
| Tavily Websearch Search the Web   | Tavily Tool Node (Search)          | Performs advanced web search queries             | Research AI Agent (AI tool)   | Research AI Agent, Tavily Websearch Extract URLs |                                                                                                                    |
| Tavily Websearch Extract URLs     | Tavily Tool Node (Extract URLs)    | Extracts URLs from AI-generated content          | Tavily Websearch Search the Web | Research AI Agent                          |                                                                                                                    |
| a mind space prompt for the ai    | Langchain ToolThink Node           | Provides auxiliary AI thinking/planning          | Research AI Agent (AI tool)   | Research AI Agent                          |                                                                                                                    |
| Add a note to company in CentralStationCRM | HTTP Request                     | Posts AI-generated Markdown note back to CRM    | Research AI Agent            | None                                        | Sticky Note1: CentralStationCRM credential configuration.                                                          |
| Sticky Note2                      | Sticky Note                       | Setup webhook trigger instructions                | None                         | None                                        |                                                                                                                    |
| Sticky Note3                      | Sticky Note                       | CentralStationCRM webhook creation guide          | None                         | None                                        |                                                                                                                    |
| Sticky Note4                      | Sticky Note                       | Workflow overview and branding                     | None                         | None                                        |                                                                                                                    |
| Sticky Note5                      | Sticky Note                       | How to get webhook URL in n8n                      | None                         | None                                        |                                                                                                                    |
| Sticky Note6                      | Sticky Note                       | CentralStationCRM API key creation instructions   | None                         | None                                        |                                                                                                                    |
| Sticky Note8                      | Sticky Note                       | CentralStationCRM n8n credential setup             | None                         | None                                        |                                                                                                                    |
| Sticky Note9                      | Sticky Note                       | Tools used in workflow overview                     | None                         | None                                        |                                                                                                                    |
| Sticky Note                      | Sticky Note                       | OpenAI API credentials setup instructions          | None                         | None                                        |                                                                                                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Webhook Node:**  
   - Node Type: Webhook  
   - Name: "Company created in CentralStationCRM"  
   - HTTP Method: POST  
   - Path: Unique UUID or custom path (e.g., `c8682af5-17b7-48f5-9be3-49ef787b40e5`)  
   - Authentication: None  
   - Purpose: Receive new company creation events from CentralStationCRM.

2. **Configure CentralStationCRM API Credentials in n8n:**  
   - Credential Type: HTTP Header Auth  
   - Header Name: `X-apikey`  
   - Header Value: Your CentralStationCRM API key (created in CRM settings).  
   - Reference Sticky Notes: Sticky Note6 and Sticky Note8 for detailed steps.

3. **Create HTTP Request Node to Add Notes:**  
   - Node Type: HTTP Request  
   - Name: "Add a note to company in CentralStationCRM"  
   - HTTP Method: POST  
   - URL: `https://api.centralstationcrm.net/api/protocols.json`  
   - Authentication: Use the above CentralStationCRM Header Auth credential.  
   - Headers:  
     - `Accept: application/json`  
     - `Content-Type: application/json`  
   - Body Content (JSON):  
     ```json
     {
       "protocol": {
         "company_ids": [{{ $('Company created in CentralStationCRM').json.body.record.id }}],
         "type": "ProtocolObjectNote",
         "badge": "note",
         "content": {{ $json.output.toJsonString() }},
         "format": "markdown"
       }
     }
     ```
   - Purpose: Attach AI-generated Markdown research notes to the company record.

4. **Configure OpenAI Chat Model Node:**  
   - Node Type: Langchain LM Chat OpenAI  
   - Name: "OpenAI Chat Model"  
   - Model: GPT-4.1  
   - Credentials: Configure with your OpenAI API key.  
   - Purpose: Provide language model capabilities for AI agent.

5. **Configure Tavily API Credentials in n8n:**  
   - Credential Type: API Key for Tavily  
   - Use appropriate credentials for the Tavily API.  
   - Reference sticky notes for setup if available.

6. **Create Tavily Websearch Nodes:**  
   - "Tavily Websearch Search the Web" Node:  
     - Node Type: Tavily Tool Node  
     - Parameters:  
       - Query: Dynamic string from AI agent output (`{{ $fromAI('Query', '', 'string') }}`)  
       - Max Results: 15  
       - Search Depth: Advanced  
     - Credentials: Tavily API key  
   - "Tavily Websearch Extract URLs" Node:  
     - Node Type: Tavily Tool Node  
     - Parameters:  
       - URLs: Dynamic from AI output (`{{ $fromAI('urls0_URLs', '', 'string') }}`)  
     - Credentials: Tavily API key

7. **Create Langchain ToolThink Node:**  
   - Node Type: ToolThink  
   - Name: "a mind space prompt for the ai"  
   - Parameters: Default (empty)  
   - Purpose: Assist AI agent with planning/thinking during research.

8. **Create the Research AI Agent Node:**  
   - Node Type: Langchain Agent  
   - Name: "Research AI Agent"  
   - Parameters:  
     - Text prompt instructing deep German-language company research with detailed Markdown structure, dynamically referencing company name:  
       ```
       We are a small consulting firm specialised on sales and marketing consulting. 

       Do a deep research in German about the company "{{ $json.body.record.name }}". The research shall help sales people get a good overview about the company and allow to identify potential opportunities.

       Use the following structure:

       ```markdown
       - **Name:** Firmenname
       - **Webseite:** http://foobar.com
       - **Zentrale:** San Francisco ([1](http://foobar))
       - **Gründungsjahr:** 2018 ([1](http://...), [2](http://...))
       - **Anzahl der Mitarbeiter:** 123 ([1](...))

       Allgemeine Beschreibung der Firma, inklusive Quellen. ([1](http://source))

       ## Social media

       - **Linked In:** http://...
       - **Facebook:** http://...
       ```

       This structure is not complete, you can add more facts, social media sites or sections. You can use multiple searches, use more specific search queries if there are important facts missing. Add sources to every fact you mention.

       Respond only with the markdown itself, do not start with ```markdown.
       ```
   - Inputs:  
     - Main input from "Company created in CentralStationCRM" node.  
     - AI language model input connected to "OpenAI Chat Model".  
     - AI tools inputs connected to Tavily Websearch nodes and ToolThink node.  
   - Output: Passes Markdown research content to "Add a note to company in CentralStationCRM".

9. **Connect Nodes Accordingly:**  
   - Webhook → Research AI Agent (main)  
   - OpenAI Chat Model → Research AI Agent (ai_languageModel)  
   - Tavily Websearch Search the Web → Research AI Agent (ai_tool)  
   - Tavily Websearch Extract URLs → Research AI Agent (ai_tool)  
   - ToolThink → Research AI Agent (ai_tool)  
   - Research AI Agent → Add a note to company in CentralStationCRM (main)

10. **Activate the Workflow:**  
    - Test using webhook trigger with test company creation in CentralStationCRM.  
    - Switch webhook URL from "Test" to "Production" and update CRM webhook accordingly.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                    | Context or Link                                                                                                                  |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| Workflow uses CentralStationCRM, ChatGPT (OpenAI), and Tavily for automated company data enrichment.                                                                                                            | [CentralStationCRM](https://centralstationcrm.de), [CentralStationCRM API Docs](https://api.centralstationcrm.net/api-docs/index.html), [ChatGPT](https://openai.com), [Tavily](https://www.tavily.com/) |
| Setup instructions include creating API keys in CentralStationCRM and OpenAI, configuring header authentication in n8n, and creating webhook in CRM to notify n8n of new companies.                              | See Sticky Notes 1, 2, 3, 6, 8                                                                                                 |
| The AI agent prompt is designed for German-language research with structured markdown output, including multiple web searches and source citations for transparency.                                           | Located in "Research AI Agent" node parameters.                                                                                |
| For testing, use the webhook test URL and trigger a company creation event in CentralStationCRM; then switch to production URL when confirmed working.                                                           | Sticky Note2 and Sticky Note5                                                                                                |
| Images and screenshots in sticky notes provide visual guidance for setting up API keys, credentials, and webhooks.                                                                                              | Sticky Notes contain multiple URLs to images hosted on s3.42he.com domain.                                                     |

---

**Disclaimer:** The provided text is exclusively derived from an n8n automated workflow. The data handled complies with all applicable content policies and contains no illegal or protected elements. All manipulated data is legal and public.