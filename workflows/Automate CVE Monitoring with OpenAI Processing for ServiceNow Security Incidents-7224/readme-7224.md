Automate CVE Monitoring with OpenAI Processing for ServiceNow Security Incidents

https://n8nworkflows.xyz/workflows/automate-cve-monitoring-with-openai-processing-for-servicenow-security-incidents-7224


# Automate CVE Monitoring with OpenAI Processing for ServiceNow Security Incidents

### 1. Workflow Overview

This n8n workflow automates the monitoring of Common Vulnerabilities and Exposures (CVEs) by querying the National Vulnerability Database (NVD) API, processing the results with OpenAI to extract relevant CVE search parameters, and creating security incident records in ServiceNow based on the findings. Its target use case is security teams or automation engineers who want to continuously track CVE updates and automatically generate incident tickets for vulnerabilities detected.

The workflow is logically divided into the following blocks:

- **1.1 Scheduled Trigger**: Initiates the workflow daily at a specified hour.
- **1.2 Data Fetching from NVD API**: Makes an HTTP request to the NVD API endpoint to retrieve CVE data.
- **1.3 AI-Powered Information Extraction**: Uses OpenAI’s Chat Model combined with a LangChain information extractor node to parse and extract structured CVE search parameters from the raw API response.
- **1.4 Data Splitting and Formatting**: Splits the extracted JSON results into individual CVE entries and selects specific fields.
- **1.5 Incident Creation in ServiceNow**: For each extracted CVE entry, creates a corresponding incident in ServiceNow with detailed vulnerability information.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger

- **Overview**:  
  Triggers the entire workflow once daily at 7:00 AM to automate CVE monitoring.

- **Nodes Involved**:  
  - `Schedule Trigger`

- **Node Details**:  
  - Type: `Schedule Trigger` (n8n built-in node)  
  - Configuration: Scheduled to trigger at hour 7 daily (UTC assumed).  
  - Key parameters: `interval` set with `triggerAtHour: 7`.  
  - Inputs: None (start node)  
  - Outputs: Connects to the `Jina Fetch` HTTP Request node.  
  - Edge cases: Timezone mismatches can cause unexpected trigger times; node does not retry if workflow fails downstream.  
  - Version-specific requirements: Version 1.2 or higher recommended for interval scheduling options.

---

#### 2.2 Data Fetching from NVD API

- **Overview**:  
  Queries the NVD API endpoint to fetch the latest CVE entries with a limit of 10 results.

- **Nodes Involved**:  
  - `Jina Fetch`

- **Node Details**:  
  - Type: `HTTP Request`  
  - Configuration:  
    - Method: GET (default)  
    - URL: `https://r.jina.ai/https://services.nvd.nist.gov/rest/json/cves/2.0/?resultsPerPage=10`  
    - Option enabled to allow unauthorized certificates (likely due to proxy or endpoint SSL issues).  
  - Inputs: Receives trigger from `Schedule Trigger`.  
  - Outputs: Sends raw API response to `Information Extractor`.  
  - Edge cases:  
    - Network timeouts or SSL errors if endpoint is unreachable or certificate changes.  
    - Rate limiting by NVD API if called too frequently.  
  - Version: Supports HTTP Request node v4.1+ for the options used.  

---

#### 2.3 AI-Powered Information Extraction

- **Overview**:  
  Uses OpenAI’s Chat Model in conjunction with LangChain’s Information Extractor node to parse the raw text data into a structured JSON object with relevant CVE search parameters.

- **Nodes Involved**:  
  - `OpenAI Chat Model`  
  - `Information Extractor`

- **Node Details**:  

  - **OpenAI Chat Model**  
    - Type: `lmChatOpenAi` (LangChain n8n node)  
    - Configuration: Defaults, uses credentials for OpenAI API.  
    - Credentials: `n8n free OpenAI API credits` (OpenAI API key)  
    - Inputs: Receives raw text data (the NVD API response JSON).  
    - Outputs: Provides AI-processed text to `Information Extractor`.  
    - Edge cases: API quota exceeded, network issues, malformed inputs causing model to fail.  
    - Version: Requires LangChain nodes v1 or later.

  - **Information Extractor**  
    - Type: `informationExtractor` (LangChain node)  
    - Configuration:  
      - Input text expression: `{{$json.data}}` (extracts data property from JSON input).  
      - System prompt: Defines expected JSON structure with fields like `startIndex`, `resultsPerPage`, `pubStartDate`, `cvssV2Severity`, `cveId`, `Description`, etc.  
      - Schema Type: Manual, with example input schema embedding sample CVE data.  
    - Inputs: Receives AI chat model output.  
    - Outputs: A JSON object named `results` with filtered CVE parameters.  
    - Edge cases: If AI output is inconsistent or malformed, extraction may fail or produce incomplete data.  
    - Version: Requires LangChain node support for manual schema input and system prompt templates.

---

#### 2.4 Data Splitting and Formatting

- **Overview**:  
  Splits the extracted `results` array into individual items to process each CVE entry separately; selects specific fields to include in subsequent incident creation.

- **Nodes Involved**:  
  - `Split Out`

- **Node Details**:  
  - Type: `SplitOut` (n8n core node)  
  - Configuration:  
    - Split field: `output.results` (array of CVE entries)  
    - Fields to include: `pubStartDate`, `pubEndDate`, `cveId`, `cvssV2Severity`, `Description`  
    - Destination field name: `body`  
  - Inputs: Receives JSON results from `Information Extractor`.  
  - Outputs: Sends each split item to `Create an incident`.  
  - Edge cases: Empty or missing `results` array results in no outputs; malformed objects could cause errors.  
  - Version: Version 1 supports this splitting with field selection.

---

#### 2.5 Incident Creation in ServiceNow

- **Overview**:  
  For each CVE entry, creates a new incident record in ServiceNow with vulnerability details populated in description and short description fields.

- **Nodes Involved**:  
  - `Create an incident`

- **Node Details**:  
  - Type: `ServiceNow` node  
  - Configuration:  
    - Resource: `incident`  
    - Operation: `create`  
    - Authentication: Basic Auth using stored credentials (`ServiceNow Basic Auth account 2`)  
    - Additional fields: Description composed dynamically from fields in split CVE entry:  
      - First Published Date (`pubStartDate`)  
      - Last Published Date (`pubEndDate`)  
      - Severity (`cvssV2Severity`)  
      - CVE ID (`cveId`)  
      - Matching String (`cpeMatchString`)  
    - Short Description: Uses the CVE `description` field from split data.  
  - Inputs: Receives split CVE JSON objects from `Split Out`.  
  - Outputs: No further output nodes.  
  - Edge cases:  
    - Authentication failure with ServiceNow credentials.  
    - API rate limits or failure to create incidents.  
    - Missing or malformed CVE data fields causing incomplete incident records.  
  - Version: Compatible with ServiceNow node v1.

---

### 3. Summary Table

| Node Name           | Node Type                          | Functional Role                   | Input Node(s)         | Output Node(s)       | Sticky Note                                                                                                        |
|---------------------|----------------------------------|---------------------------------|-----------------------|----------------------|-------------------------------------------------------------------------------------------------------------------|
| Schedule Trigger     | Schedule Trigger                 | Initiates workflow daily        | None                  | Jina Fetch           |                                                                                                                   |
| Jina Fetch          | HTTP Request                    | Fetches CVE data from NVD API   | Schedule Trigger      | Information Extractor |                                                                                                                   |
| OpenAI Chat Model    | LangChain lmChatOpenAi          | Processes raw data with AI      | None (connected via ai_languageModel input from Information Extractor) | Information Extractor |                                                                                                                   |
| Information Extractor| LangChain informationExtractor  | Extracts structured CVE info    | Jina Fetch (via OpenAI Chat Model) | Split Out           |                                                                                                                   |
| Split Out            | SplitOut                       | Splits CVE results into items   | Information Extractor | Create an incident    |                                                                                                                   |
| Create an incident   | ServiceNow                     | Creates incidents in ServiceNow | Split Out             | None                 |                                                                                                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create `Schedule Trigger` node**  
   - Type: Schedule Trigger  
   - Configure to trigger daily at 07:00 (hour 7)  
   - No credentials required  
   - Connect this node’s output to next node.

2. **Create `Jina Fetch` node**  
   - Type: HTTP Request  
   - Method: GET (default)  
   - URL: `https://r.jina.ai/https://services.nvd.nist.gov/rest/json/cves/2.0/?resultsPerPage=10`  
   - Enable option "Allow Unauthorized Certs" (if behind proxy or SSL issues)  
   - Connect input from `Schedule Trigger`  
   - No credentials required.

3. **Create `OpenAI Chat Model` node**  
   - Type: LangChain lmChatOpenAi  
   - Leave options default  
   - Configure credentials using an OpenAI API key credential in n8n (e.g., `n8n free OpenAI API credits`)  
   - Connect this node as the AI language model input to `Information Extractor` (see step 4)

4. **Create `Information Extractor` node**  
   - Type: LangChain informationExtractor  
   - Input: Set expression to `{{$json.data}}` to extract raw text from HTTP response  
   - System prompt template: Use the detailed prompt defining the expected JSON output structure with keys like `startIndex`, `resultsPerPage`, `pubStartDate`, `cvssV2Severity`, `cveId`, `Description`, etc.  
   - Schema Type: Manual  
   - Input Schema: Provide example JSON schema including fields such as `results` array with sample CVE data  
   - Connect main input from `Jina Fetch` output  
   - Connect AI Language Model input from `OpenAI Chat Model` output.

5. **Create `Split Out` node**  
   - Type: Split Out  
   - Configure to split on field: `output.results` (the array of CVE entries)  
   - Include fields: `pubStartDate`, `pubEndDate`, `cveId`, `cvssV2Severity`, `Description`  
   - Destination field name: `body`  
   - Connect input from `Information Extractor` output.

6. **Create `Create an incident` node**  
   - Type: ServiceNow  
   - Resource: `incident`  
   - Operation: `create`  
   - Authentication: Basic Auth (configure credentials for your ServiceNow instance)  
   - Additional fields:  
     - Description: Compose multiline string using expressions to pull from `Split Out` node fields:  
       ```
       First Published on : {{$('Split Out').item.json.body.pubStartDate }}
       Last Published on : {{$('Split Out').item.json.body.pubEndDate }}
       Severity : {{$('Split Out').item.json.body.cvssV2Severity }}
       CVEID : {{$('Split Out').item.json.body.cveId }}
       Matching String: {{$('Split Out').item.json.body.cpeMatchString }}
       ```  
   - Short Description: Set expression to `{{$json.body.description}}` from split data  
   - Connect input from `Split Out` output.

7. **Activate the workflow**  
   - Save and activate to run daily at 7AM automatically.

---

### 5. General Notes & Resources

| Note Content                                                                                              | Context or Link                                                                                  |
|----------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| The workflow uses the National Vulnerability Database (NVD) REST API v2.0 for CVE data retrieval.         | https://nvd.nist.gov/developers/vulnerabilities                                                    |
| OpenAI API is used here to convert unstructured JSON text into structured CVE search parameters.         | Requires OpenAI API key with sufficient quota                                                    |
| ServiceNow node requires Basic Auth credentials for incident creation; ensure correct permissions.       | ServiceNow instance with API access enabled                                                     |
| The `informationExtractor` node uses LangChain integration, relying on a system prompt for extraction.   | See LangChain docs for prompt engineering best practices                                        |
| The HTTP Request node includes an unusual URL prefix (`https://r.jina.ai/`), likely a proxy or caching layer | Verify this with network team or adjust URL if direct access is available                        |

---

**Disclaimer:** The provided text is derived exclusively from an automated workflow created with n8n, an integration and automation tool. This process strictly complies with current content policies and contains no illegal, offensive, or protected content. All handled data is legal and public.