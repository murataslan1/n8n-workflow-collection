Automate AI Vulnerability Monitoring with GPT-4 and ServiceNow Incident Creation

https://n8nworkflows.xyz/workflows/automate-ai-vulnerability-monitoring-with-gpt-4-and-servicenow-incident-creation-7225


# Automate AI Vulnerability Monitoring with GPT-4 and ServiceNow Incident Creation

### 1. Workflow Overview

This workflow automates the monitoring of AI-related vulnerability news by fetching RSS feed entries, extracting and summarizing relevant information using AI, and creating incidents in ServiceNow accordingly. It is designed for cybersecurity teams or IT service management professionals who want to automate vulnerability detection and incident creation using AI-powered content extraction and summarization.

The workflow can be logically divided into these blocks:

- **1.1 Schedule Trigger & RSS Feed Retrieval:** Periodically triggers and fetches vulnerability-related news items from a configured RSS feed.
- **1.2 Content Retrieval & AI Processing:** Downloads the full article content from the RSS feed links, then uses AI to extract structured information.
- **1.3 Data Splitting & Incident Creation:** Splits the extracted information per article and creates ServiceNow incidents with the summarized details.

---

### 2. Block-by-Block Analysis

#### 2.1 Schedule Trigger & RSS Feed Retrieval

- **Overview:**  
  This block initiates the workflow execution at scheduled intervals and retrieves the latest entries from a vulnerability news RSS feed.

- **Nodes Involved:**  
  - Schedule Trigger  
  - RSS Read

- **Node Details:**

  - **Schedule Trigger**  
    - Type: `n8n-nodes-base.scheduleTrigger`  
    - Role: Initiates the workflow on a recurring schedule.  
    - Configuration: Default interval (unspecified here, likely every minute or hourly).  
    - Inputs: None (trigger node).  
    - Outputs: Connected to “RSS Read”.  
    - Edge Cases: Misconfiguration of schedule interval could lead to no or too frequent triggers.  

  - **RSS Read**  
    - Type: `n8n-nodes-base.rssFeedRead`  
    - Role: Fetches news items from a predefined RSS feed URL.  
    - Configuration: URL set to `https://rss.app/feeds/tbFqDT5HIb59.xml`. No additional options used.  
    - Inputs: From Schedule Trigger.  
    - Outputs: To “Read URL content”.  
    - Edge Cases: RSS feed downtime, format changes, or network issues could cause empty or failed reads.

#### 2.2 Content Retrieval & AI Processing

- **Overview:**  
  This block downloads the full content of each news article from the URLs provided in the RSS feed and uses an AI language model (OpenAI GPT-4) and a LangChain node to extract structured vulnerability information.

- **Nodes Involved:**  
  - Read URL content  
  - OpenAI Chat Model  
  - Information Extractor

- **Node Details:**

  - **Read URL content**  
    - Type: `n8n-nodes-base.jinaAi`  
    - Role: Retrieves the full text content of the article from its link.  
    - Configuration: URL dynamically set from `{{ $json.link }}` extracted from the RSS feed. Uses Jina AI API credentials.  
    - Inputs: From “RSS Read”.  
    - Outputs: To “Information Extractor”.  
    - Edge Cases: Invalid URLs, network timeouts, or Jina AI API errors.

  - **OpenAI Chat Model**  
    - Type: `@n8n/n8n-nodes-langchain.lmChatOpenAi`  
    - Role: Provides the AI language model (GPT-4) for processing textual data.  
    - Configuration: Model set to “gpt-4.1-mini” (a GPT-4 variant). Uses OpenAI API credentials.  
    - Inputs: Used as an AI language model by “Information Extractor” node (connected via ai_languageModel input).  
    - Outputs: None directly; feeds AI responses to “Information Extractor”.  
    - Edge Cases: API key quota exceeded, timeout, or rate limiting.

  - **Information Extractor**  
    - Type: `@n8n/n8n-nodes-langchain.informationExtractor`  
    - Role: Extracts structured JSON data about vulnerability reports from unstructured article content.  
    - Configuration:  
      - Input text template includes snippet, title, publication date, author, and content.  
      - System prompt instructs the AI to extract fields: title, link, pubDate, creator, content.  
      - Output is a JSON array named `results`.  
    - Inputs: Receives article content from “Read URL content” and AI model from “OpenAI Chat Model”.  
    - Outputs: To “Split Out”.  
    - Edge Cases: Missing fields in input data, AI extraction errors or inconsistent JSON output.

#### 2.3 Data Splitting & Incident Creation

- **Overview:**  
  This block splits the array of extracted results into individual items and creates ServiceNow incidents for each vulnerability report.

- **Nodes Involved:**  
  - Split Out  
  - Create an incident

- **Node Details:**

  - **Split Out**  
    - Type: `n8n-nodes-base.splitOut`  
    - Role: Separates the JSON array of extracted vulnerabilities into individual JSON objects to process them one by one.  
    - Configuration: Splitting on the field `output.results`. Output field named `response`.  
    - Inputs: From “Information Extractor”.  
    - Outputs: To “Create an incident”.  
    - Edge Cases: Empty or malformed `results` array could cause no output or errors.

  - **Create an incident**  
    - Type: `n8n-nodes-base.serviceNow`  
    - Role: Creates an incident in ServiceNow based on the extracted vulnerability data.  
    - Configuration:  
      - Resource: Incident  
      - Operation: Create  
      - Auth: Basic Authentication (configured with stored credentials)  
      - Short Description: Template `"Ai Vulnerability {{ $json.response.title }}"`  
      - Description: Includes snippet content, creator, and publication date from `response` fields.  
    - Inputs: From “Split Out”.  
    - Outputs: None (terminal node).  
    - Edge Cases: Authentication failure, API errors, missing fields causing incomplete incident data.

---

### 3. Summary Table

| Node Name           | Node Type                        | Functional Role                   | Input Node(s)      | Output Node(s)         | Sticky Note                      |
|---------------------|---------------------------------|---------------------------------|--------------------|------------------------|---------------------------------|
| Schedule Trigger     | scheduleTrigger                 | Initiates workflow on schedule  | None               | RSS Read               |                                 |
| RSS Read            | rssFeedRead                    | Fetches vulnerability news RSS  | Schedule Trigger   | Read URL content       |                                 |
| Read URL content     | jinaAi                        | Retrieves full article content  | RSS Read           | Information Extractor  |                                 |
| OpenAI Chat Model    | lmChatOpenAi                   | Provides GPT-4 AI model         | None (used by Information Extractor) | Information Extractor (ai_languageModel input) |                                 |
| Information Extractor| informationExtractor           | Extracts structured info from text | Read URL content, OpenAI Chat Model | Split Out            |                                 |
| Split Out            | splitOut                      | Splits array of extracted items | Information Extractor | Create an incident      |                                 |
| Create an incident   | serviceNow                    | Creates incident in ServiceNow  | Split Out           | None                   |                                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node:**  
   - Node type: `Schedule Trigger`  
   - Parameters: Set desired execution interval (e.g., every hour).  
   - No credentials needed.

2. **Create RSS Read Node:**  
   - Node type: `RSS Feed Read`  
   - Parameters:  
     - URL: `https://rss.app/feeds/tbFqDT5HIb59.xml`  
     - Leave other options default.  
   - Connect output of Schedule Trigger to input of RSS Read.

3. **Create Read URL Content Node:**  
   - Node type: `Jina AI`  
   - Parameters:  
     - URL: Set to expression `{{$json.link}}` to dynamically use links from RSS feed items.  
     - Leave options default.  
   - Credentials: Configure Jina AI API credentials (e.g., “Jina AI account 2”).  
   - Connect output of RSS Read to input of Read URL Content.

4. **Create OpenAI Chat Model Node:**  
   - Node type: `LangChain OpenAI Chat`  
   - Parameters:  
     - Model: `gpt-4.1-mini` (or appropriate GPT-4 variant).  
     - Leave options default.  
   - Credentials: Configure OpenAI API credentials (e.g., “n8n free OpenAI API credits”).  
   - No direct input connections; this node is linked via AI language model input to the next node.

5. **Create Information Extractor Node:**  
   - Node type: `LangChain Information Extractor`  
   - Parameters:  
     - Text template:  
       ```
       Snippet {{ $json.metadata.description }}
       Title {{ $json.title }}
       pubDate {{ $json.publishedTime }}
       Creator {{ $json.metadata.author }}
       content {{ $json.content }}
       ```  
     - System prompt:  
       ```
       You are an expert extraction algorithm.
       Only extract relevant information from the input text.
       Extract data as JSON objects with the following fields:

       title (string): The title of the news article or vulnerability report.
       link (string): The URL linking to the full article.
       pubDate (string, ISO 8601 format preferred): The publication date of the article.
       creator (string): The author or source of the article.
       content (string): A brief summary or snippet of the article content.

       If any field is missing or not found, omit that field in the output.
       Output a JSON array called results containing the extracted objects.
       ```  
     - Schema (manual): Define properties for Title, Description, PublishedTime, SiteName as strings.  
   - Connect output of Read URL Content to main input of Information Extractor.  
   - Connect OpenAI Chat Model node to AI language model input of Information Extractor.

6. **Create Split Out Node:**  
   - Node type: `Split Out`  
   - Parameters:  
     - Field to split out: `output.results`  
     - Destination field name: `response`  
   - Connect output of Information Extractor to input of Split Out.

7. **Create ServiceNow Incident Node:**  
   - Node type: `ServiceNow`  
   - Parameters:  
     - Resource: `incident`  
     - Operation: `create`  
     - Authentication: Basic Auth (ensure ServiceNow credentials are saved and selected).  
     - Short Description: Expression: `Ai Vulnerability {{ $json.response.title }}`  
     - Additional Fields -> Description:  
       ```
       Snippet {{ $json.response.content }}
       Creator {{ $json.response.creator }}
       PubDate {{ $json.response.pubDate }}
       ```  
   - Credentials: Configure ServiceNow Basic Auth credentials (e.g., “ServiceNow Basic Auth account 2”).  
   - Connect output of Split Out to input of Create an incident.

8. **Activate the workflow and test:**  
   - Verify RSS feed fetches items.  
   - Verify article content is retrieved.  
   - Check AI extraction outputs JSON arrays.  
   - Confirm incidents are created in ServiceNow with correct data.

---

### 5. General Notes & Resources

| Note Content                                                                                   | Context or Link                                                        |
|------------------------------------------------------------------------------------------------|------------------------------------------------------------------------|
| Workflow uses OpenAI GPT-4 via LangChain nodes for advanced NLP extraction.                     | Requires valid OpenAI API credentials with GPT-4 access.               |
| Jina AI node is used for URL content retrieval, which requires separate Jina AI account.       | Credentials management needed for Jina AI API.                         |
| ServiceNow incidents created using Basic Auth; ensure user has API permissions for incident creation. | ServiceNow API documentation for incident management.                  |
| RSS feed URL: `https://rss.app/feeds/tbFqDT5HIb59.xml` — monitor for any changes or downtime. | RSS feed source for vulnerability news articles.                      |
| The extraction prompt requests a JSON array named `results`; failure to parse this may cause errors. | Validate AI output JSON schema if extraction fails.                   |

---

**Disclaimer:**  
The provided text is sourced exclusively from an automated workflow created with n8n, an integration and automation tool. The process strictly respects existing content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.