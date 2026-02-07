Advanced Market Trends & Competitor GPT-4o Intelligence Hub

https://n8nworkflows.xyz/workflows/advanced-market-trends---competitor-gpt-4o-intelligence-hub-11783


# Advanced Market Trends & Competitor GPT-4o Intelligence Hub

### 1. Workflow Overview

This workflow, titled **"Advanced Market Trends & Competitor GPT-4o Intelligence Hub"**, is designed to automate the collection, analysis, and dissemination of competitive intelligence from multiple digital sources. It targets business intelligence, market research, and competitive strategy teams aiming to monitor competitor activities comprehensively and in near real-time. The workflow enables continuous data scraping, AI-powered analysis, historical data comparison, metrics calculation, alerting, and archival.

The workflow is logically divided into the following functional blocks:

- **1.1 Daily Trigger & Configuration**: Initiates the workflow daily and sets key URLs and recipient parameters.
- **1.2 Data Acquisition (Scraping)**: Parallel scraping of competitor website, pricing, job openings, and press releases.
- **1.3 Historical Data Retrieval**: Fetches previously stored competitor intelligence for comparison.
- **1.4 Data Consolidation**: Aggregates all scraped and retrieved data into a unified dataset.
- **1.5 AI Analysis & Tools Integration**: Uses GPT-4o and custom AI tools for deep analysis, trends detection, and predictions.
- **1.6 Metrics Calculation & Enrichment**: Converts AI output into measurable indicators and stores results.
- **1.7 Change Detection & Routing**: Evaluates analysis confidence and routes for alerting if significant changes are detected.
- **1.8 Alerting & Notification**: Formats and sends critical alerts via WhatsApp to stakeholders.
- **1.9 Archival**: Stores analyzed data in Google Sheets for longitudinal tracking.

---

### 2. Block-by-Block Analysis

#### 2.1 Daily Trigger & Configuration

- **Overview:** This block triggers the workflow daily at 9 AM and sets up the competitor URLs and report recipient information.
- **Nodes Involved:**  
  - Daily Competitor Scan  
  - Workflow Configuration  

- **Node Details:**

  - **Daily Competitor Scan**  
    - Type: Schedule Trigger  
    - Configuration: Triggers once daily at 9:00 AM  
    - Inputs: None (start node)  
    - Outputs: Triggers "Workflow Configuration"  
    - Failure Cases: Time zone misconfiguration or scheduler disabled may cause missed executions  
    - Version: 1.3  

  - **Workflow Configuration**  
    - Type: Set  
    - Configuration: Contains placeholders for competitor URLs (main website, pricing, jobs, press releases) and communication endpoints (email, Slack channel)  
    - Inputs: From Daily Competitor Scan  
    - Outputs: Sends URLs to the scraping nodes and historical data retrieval  
    - Failure Cases: Missing or incorrect URL values prevent scraping; placeholders must be replaced before production  
    - Version: 3.4  

---

#### 2.2 Data Acquisition (Scraping)

- **Overview:** Concurrently scrapes competitor data from four distinct sources: main website, pricing page, job openings, and press releases.
- **Nodes Involved:**  
  - Scrape Competitor Website  
  - Scrape Pricing Page  
  - Scrape Job Openings  
  - Scrape Press Releases  

- **Node Details:**

  - **Scrape Competitor Website / Pricing Page / Job Openings / Press Releases**  
    - Type: HTTP Request  
    - Configuration: Each node fetches the URL provided by the Workflow Configuration node dynamically via expressions. Response format set to text to capture raw HTML or page content.  
    - Inputs: From Workflow Configuration node  
    - Outputs: To Combine All Data node  
    - Failure Cases: HTTP errors (404, 500), connection timeouts, changes in page structure, or URL misconfiguration  
    - Version: 4.3  

---

#### 2.3 Historical Data Retrieval

- **Overview:** Retrieves stored historical competitor intelligence from Google Sheets to enable comparison with current data.
- **Nodes Involved:**  
  - Retrieve Historical Data  

- **Node Details:**

  - **Retrieve Historical Data**  
    - Type: Google Sheets  
    - Configuration: Reads data from a specified sheet and document ID (to be configured)  
    - Inputs: From Workflow Configuration  
    - Outputs: To Calculate Trend Metrics node  
    - Failure Cases: Google Sheets API auth errors, missing or incorrect sheet/document IDs, rate limits  
    - Credentials: Google Sheets OAuth2  
    - Version: 4.7  

---

#### 2.4 Data Consolidation

- **Overview:** Aggregates all scraped content into a single structured dataset for downstream AI analysis.
- **Nodes Involved:**  
  - Combine All Data  

- **Node Details:**

  - **Combine All Data**  
    - Type: Aggregate  
    - Configuration: Aggregates all incoming items into one comprehensive data object  
    - Inputs: From all four scraping nodes (Competitor Website, Pricing, Jobs, Press Releases)  
    - Outputs: To Calculate Trend Metrics  
    - Failure Cases: Missing or incomplete data from any scraping node results in partial aggregation  
    - Version: 1  

---

#### 2.5 AI Analysis & Tools Integration

- **Overview:** Performs deep AI-driven competitive intelligence analysis using GPT-4o and auxiliary tools for historical data comparison and web research.
- **Nodes Involved:**  
  - Calculate Trend Metrics  
  - AI Intelligence Analyzer  
  - OpenAI Chat Model  
  - Intelligence Output Parser  
  - Historical Data Comparison Tool  
  - Web Research Tool  
  - Enrich with Metrics  

- **Node Details:**

  - **Calculate Trend Metrics**  
    - Type: Code  
    - Configuration: Custom code node to derive initial competitive indicators using current and historical data  
    - Inputs: From Combine All Data and Retrieve Historical Data  
    - Outputs: To AI Intelligence Analyzer  
    - Failure Cases: Code errors or missing input data  
    - Version: 2  

  - **AI Intelligence Analyzer**  
    - Type: LangChain Agent Node  
    - Configuration: Passes consolidated competitor data and historical metrics to GPT-4o with a detailed system prompt instructing the model to detect patterns, predict moves, and generate actionable insights. Integrates internal AI tools: Historical Data Comparison Tool and Web Research Tool for enhanced analysis.  
    - Inputs: From Calculate Trend Metrics  
    - Outputs: To Enrich with Metrics  
    - Failure Cases: API limits, malformed input JSON, unexpected AI output, or prompt misconfiguration  
    - Version: 3  

  - **OpenAI Chat Model**  
    - Type: LangChain OpenAI Chat Model  
    - Configuration: Uses GPT-4o model with temperature 0.3 for deterministic output  
    - Inputs: Connected internally to AI Intelligence Analyzer as language model  
    - Failure Cases: OpenAI API authentication or quota issues  
    - Credentials: OpenAI API key  
    - Version: 1.3  

  - **Intelligence Output Parser**  
    - Type: Structured Output Parser  
    - Configuration: Parses AI output into a structured JSON format with fields such as key findings, competitor moves, recommendations, risk assessment, opportunities, and confidence score  
    - Inputs: From AI Intelligence Analyzer (AI output parser input)  
    - Outputs: Back to AI Intelligence Analyzer (feedback loop)  
    - Failure Cases: Parsing errors if AI output does not conform to schema  
    - Version: 1.3  

  - **Historical Data Comparison Tool**  
    - Type: Custom Code Tool Node  
    - Configuration: JavaScript code to compare current competitor data with historical patterns and identify trends/changes  
    - Inputs: From AI Intelligence Analyzer (as an AI tool)  
    - Outputs: To AI Intelligence Analyzer  
    - Failure Cases: Code exceptions or invalid input format  
    - Version: 1.3  

  - **Web Research Tool**  
    - Type: HTTP Request Tool  
    - Configuration: Dynamically fetches URLs recommended by AI during analysis to enrich context  
    - Inputs: From AI Intelligence Analyzer (as an AI tool)  
    - Outputs: To AI Intelligence Analyzer  
    - Failure Cases: HTTP errors, invalid URLs, timeouts  
    - Version: 4.3  

  - **Enrich with Metrics**  
    - Type: Set  
    - Configuration: Augments AI analysis output with additional metrics or static metadata before storage and decisioning  
    - Inputs: From AI Intelligence Analyzer  
    - Outputs: To Store Historical Data and Check for Major Changes nodes  
    - Failure Cases: Misconfiguration or missing input data  
    - Version: 3.4  

---

#### 2.6 Metrics Calculation & Enrichment

- **Covered in 2.5** (Calculate Trend Metrics and Enrich with Metrics nodes are part of AI analysis block).

---

#### 2.7 Change Detection & Routing

- **Overview:** Checks if AI analysis confidence or detected changes warrant alerts. Routes workflow accordingly.
- **Nodes Involved:**  
  - Check for Major Changes  
  - Route by Confidence Score  

- **Node Details:**

  - **Check for Major Changes**  
    - Type: If  
    - Configuration: Evaluates conditions on AI output metrics (e.g., confidence score threshold or identified risk level) to decide if alerting is needed  
    - Inputs: From Enrich with Metrics  
    - Outputs: To Route by Confidence Score if true  
    - Failure Cases: Missing or invalid decision parameters  
    - Version: 2.3  

  - **Route by Confidence Score**  
    - Type: Switch  
    - Configuration: Routes data based on confidence score or other criteria (currently appears as a placeholder with empty conditions)  
    - Inputs: From Check for Major Changes  
    - Outputs: To Format WhatsApp Message or other branches (currently only to WhatsApp formatting)  
    - Failure Cases: Misconfigured routing rules  
    - Version: 3.4  

---

#### 2.8 Alerting & Notification

- **Overview:** Formats and sends critical intelligence alerts via WhatsApp to designated recipients.
- **Nodes Involved:**  
  - Format WhatsApp Message  
  - Send Critical Alert via WhatsApp  

- **Node Details:**

  - **Format WhatsApp Message**  
    - Type: Set  
    - Configuration: Prepares the alert message content from AI analysis results and routing output  
    - Inputs: From Route by Confidence Score  
    - Outputs: To Send Critical Alert via WhatsApp  
    - Failure Cases: Formatting errors or missing message content  
    - Version: 3.4  

  - **Send Critical Alert via WhatsApp**  
    - Type: WhatsApp  
    - Configuration: Sends the prepared message using WhatsApp Business API credentials  
    - Inputs: From Format WhatsApp Message  
    - Outputs: None (end node for alerting)  
    - Failure Cases: WhatsApp API authentication errors, message delivery failures, rate limits  
    - Credentials: WhatsApp Business API  
    - Version: 1.1  

---

#### 2.9 Archival

- **Overview:** Stores enriched AI analysis and metrics into Google Sheets for historical tracking and trend analysis.
- **Nodes Involved:**  
  - Store Historical Data  

- **Node Details:**

  - **Store Historical Data**  
    - Type: Google Sheets  
    - Configuration: Writes intelligence report data to a configured sheet/document  
    - Inputs: From Enrich with Metrics  
    - Outputs: To Check for Major Changes  
    - Failure Cases: Google Sheets API auth errors, sheet access permissions, incorrect doc/sheet IDs  
    - Credentials: Google Sheets OAuth2  
    - Version: 4.7  

---

### 3. Summary Table

| Node Name                  | Node Type                       | Functional Role                                    | Input Node(s)               | Output Node(s)                             | Sticky Note                                                                                      |
|----------------------------|--------------------------------|---------------------------------------------------|-----------------------------|-------------------------------------------|------------------------------------------------------------------------------------------------|
| Daily Competitor Scan       | Schedule Trigger                | Triggers workflow daily at 9 AM                    | None                        | Workflow Configuration                     | Setup Steps: Configure daily schedule trigger.                                                 |
| Workflow Configuration      | Set                            | Defines competitor URLs and recipients             | Daily Competitor Scan        | Scrape Competitor Website, Pricing Page, Job Openings, Press Releases, Retrieve Historical Data | Setup Steps: Define competitor URLs using workflow variables.                                  |
| Scrape Competitor Website   | HTTP Request                   | Fetches competitor main website content            | Workflow Configuration       | Combine All Data                           | Scrape Multiple Sources: Collects competitor data in parallel.                                 |
| Scrape Pricing Page         | HTTP Request                   | Fetches competitor pricing page content             | Workflow Configuration       | Combine All Data                           | Scrape Multiple Sources: Collects competitor data in parallel.                                 |
| Scrape Job Openings         | HTTP Request                   | Fetches competitor job listings                      | Workflow Configuration       | Combine All Data                           | Scrape Multiple Sources: Collects competitor data in parallel.                                 |
| Scrape Press Releases       | HTTP Request                   | Fetches competitor press releases/news              | Workflow Configuration       | Combine All Data                           | Scrape Multiple Sources: Collects competitor data in parallel.                                 |
| Retrieve Historical Data    | Google Sheets                  | Retrieves historical competitor data for comparison | Workflow Configuration       | Calculate Trend Metrics                    | Store Historical & Alert Stakeholders: Archives results for trend analysis.                     |
| Combine All Data            | Aggregate                     | Aggregates all scraped data into one dataset         | Scrape Competitor Website, Pricing Page, Job Openings, Press Releases | Calculate Trend Metrics                      | Consolidate Data: Merges inputs into unified dataset.                                          |
| Calculate Trend Metrics     | Code                          | Derives competitive indicators from current & historical data | Retrieve Historical Data, Combine All Data | AI Intelligence Analyzer                  | Calculate Metrics: Derives measurable signals from data.                                      |
| AI Intelligence Analyzer    | LangChain Agent               | Performs AI-driven competitor intelligence analysis | Calculate Trend Metrics      | Enrich with Metrics                        | AI Analysis: Converts data into meaningful intelligence.                                      |
| OpenAI Chat Model           | LangChain OpenAI Chat Model   | Provides GPT-4o language model for AI analysis      | AI Intelligence Analyzer (internal) | AI Intelligence Analyzer (internal)   | AI Analysis: Uses GPT-4o model for text generation.                                           |
| Intelligence Output Parser  | LangChain Structured Output Parser | Parses AI output into structured JSON format        | AI Intelligence Analyzer (AI output parser) | AI Intelligence Analyzer (feedback)      | AI Analysis: Ensures structured AI output.                                                    |
| Historical Data Comparison Tool | LangChain Tool (Code)       | Compares current data with historical patterns       | AI Intelligence Analyzer (tool) | AI Intelligence Analyzer                  | AI Analysis: Detects trends and changes using custom JS code.                                 |
| Web Research Tool           | HTTP Request Tool             | Fetches external web info for additional context    | AI Intelligence Analyzer (tool) | AI Intelligence Analyzer                  | AI Analysis: Enables enriched research during AI processing.                                 |
| Enrich with Metrics         | Set                           | Adds additional metrics to AI analysis output        | AI Intelligence Analyzer       | Store Historical Data, Check for Major Changes | AI Analysis: Enhances output with measurable indicators.                                    |
| Store Historical Data       | Google Sheets                 | Archives AI outputs and metrics in Google Sheets     | Enrich with Metrics           | Check for Major Changes                    | Store Historical & Alert Stakeholders: Enables evidence-based decision-making.                 |
| Check for Major Changes     | If                            | Determines if alert conditions are met               | Enrich with Metrics, Store Historical Data | Route by Confidence Score               | Store Historical & Alert Stakeholders: Alerts on significant findings.                         |
| Route by Confidence Score   | Switch                        | Routes workflow based on confidence score or conditions | Check for Major Changes        | Format WhatsApp Message                    | Store Historical & Alert Stakeholders: Routes critical alerts for notification.                |
| Format WhatsApp Message     | Set                           | Formats alert message for WhatsApp                    | Route by Confidence Score      | Send Critical Alert via WhatsApp           | Store Historical & Alert Stakeholders: Prepares alert content.                                |
| Send Critical Alert via WhatsApp | WhatsApp                  | Sends critical intelligence alerts                    | Format WhatsApp Message        | None                                      | Store Historical & Alert Stakeholders: Sends alerts via WhatsApp Business API.                |
| Sticky Note1               | Sticky Note                   | Prerequisites & Use Cases overview                     | None                        | None                                      | OpenAI/Claude API account, Google Sheets access, Gmail, WhatsApp Business API, web scraping enabled. Use cases include market share monitoring and competitor talent tracking. |
| Sticky Note2               | Sticky Note                   | Setup steps summary                                     | None                        | None                                      | Setup steps include scheduling, URL config, API keys, authentication, and testing scrapers.   |
| Sticky Note3               | Sticky Note                   | Workflow operational overview                           | None                        | None                                      | Describes automated scraping, AI analysis, storage, and alerting pipeline.                   |
| Sticky Note5               | Sticky Note                   | Customization & Benefits                                 | None                        | None                                      | Modify scrape targets, AI prompts, and alert frequency. Benefits include reduced manual research and faster decisions. |
| Sticky Note6               | Sticky Note                   | Historical Data Storage & Alerting                       | None                        | None                                      | Archiving results enables trend analysis and evidence-based decisions.                       |
| Sticky Note7               | Sticky Note                   | Metric Calculation block explanation                      | None                        | None                                      | Converts insights into measurable signals for objective evaluation.                         |
| Sticky Note8               | Sticky Note                   | AI Analysis block explanation                             | None                        | None                                      | Processes consolidated data with LLM to extract trends and insights.                        |
| Sticky Note9               | Sticky Note                   | Data Consolidation explanation                            | None                        | None                                      | Merges all collected inputs to enable consistent analysis.                                  |
| Sticky Note10              | Sticky Note                   | Scraping multiple sources explanation                      | None                        | None                                      | Ensures comprehensive and up-to-date competitor data collection.                            |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node** named `Daily Competitor Scan`:  
   - Set to trigger daily at 9:00 AM.

2. **Add a Set node** named `Workflow Configuration`:  
   - Configure string variables with placeholders for:  
     - `competitorWebsiteUrl`  
     - `pricingPageUrl`  
     - `jobsPageUrl`  
     - `pressReleaseUrl`  
     - `recipientEmail`  
     - `slackChannel`  
   - Connect it to `Daily Competitor Scan`.

3. **Create four HTTP Request nodes** named:  
   - `Scrape Competitor Website`  
   - `Scrape Pricing Page`  
   - `Scrape Job Openings`  
   - `Scrape Press Releases`  
   - Configure each to GET the respective URL using expressions like `={{ $('Workflow Configuration').first().json.competitorWebsiteUrl }}`.  
   - Set response format to `text`.  
   - Connect all four nodes to the output of `Workflow Configuration` in parallel.

4. **Add a Google Sheets node** named `Retrieve Historical Data`:  
   - Configure with correct `documentId` and `sheetName` to read historical competitor data.  
   - Connect it also to `Workflow Configuration`.

5. **Add an Aggregate node** named `Combine All Data`:  
   - Set to aggregate all incoming data into a single item.  
   - Connect it as output of all four scraping nodes.

6. **Create a Code node** named `Calculate Trend Metrics`:  
   - Connect inputs from `Combine All Data` and `Retrieve Historical Data`.  
   - Use JavaScript code to compute comparative metrics and indicators based on merged current and historical data.

7. **Add a LangChain Agent node** named `AI Intelligence Analyzer`:  
   - Configure with a system prompt instructing GPT-4o to analyze competitor data, detect patterns, predict moves, generate recommendations, assess risks, and identify opportunities.  
   - Enable output parser with a structured JSON schema.  
   - Connect input from `Calculate Trend Metrics`.

8. **Add a LangChain OpenAI Chat Model node** named `OpenAI Chat Model`:  
   - Set model to `gpt-4o` with temperature 0.3.  
   - Connect as language model to `AI Intelligence Analyzer`.  
   - Configure OpenAI API credentials.

9. **Add a LangChain Structured Output Parser node** named `Intelligence Output Parser`:  
   - Define the expected JSON schema for AI output parsing (key findings, moves, recommendations, risks, opportunities, confidence score).  
   - Connect parser to `AI Intelligence Analyzer`.

10. **Add two LangChain Tool nodes** used by the AI agent:  
    - `Historical Data Comparison Tool`: Implement JavaScript comparing current data with historical patterns and returning analysis.  
    - `Web Research Tool`: HTTP Request Tool node to fetch URLs dynamically suggested by AI during analysis.

11. **Add a Set node** named `Enrich with Metrics`:  
    - Integrate additional calculated metrics or metadata into AI output.  
    - Connect output from `AI Intelligence Analyzer`.

12. **Add a Google Sheets node** named `Store Historical Data`:  
    - Configure with document and sheet IDs for storing enriched intelligence reports.  
    - Connect input from `Enrich with Metrics`.

13. **Add an If node** named `Check for Major Changes`:  
    - Configure conditions to evaluate confidence score or risk level from enriched metrics to decide if alerting is needed.  
    - Connect input from `Enrich with Metrics` and `Store Historical Data`.

14. **Add a Switch node** named `Route by Confidence Score`:  
    - Implement routing based on confidence or alert criteria.  
    - Connect input from `Check for Major Changes`.

15. **Add a Set node** named `Format WhatsApp Message`:  
    - Format final alert message text based on AI analysis for WhatsApp distribution.  
    - Connect output from `Route by Confidence Score`.

16. **Add a WhatsApp node** named `Send Critical Alert via WhatsApp`:  
    - Configure with WhatsApp Business API credentials.  
    - Connect input from `Format WhatsApp Message`.

17. **Connect nodes logically following above instructions to ensure proper data flow and error handling.**

18. **Configure all credentials:**  
    - OpenAI API credentials for GPT-4o  
    - Google Sheets OAuth2 credentials  
    - WhatsApp Business API credentials

19. **Replace all placeholder URLs and recipient identifiers with actual production values.**

20. **Test each scraper node individually for connectivity and data retrieval.**

21. **Test the entire workflow end-to-end, verifying data aggregation, AI analysis output, Google Sheets storage, and alert delivery.**

---

### 5. General Notes & Resources

| Note Content                                                                                         | Context or Link                                                                                     |
|----------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| OpenAI/Claude API account, Google Sheets access, Gmail account, WhatsApp Business API required. Use cases: market share monitoring, pricing updates, talent tracking, trend reports. | Sticky Note1                                                                                       |
| Setup must include scheduling, competitor URLs setup, API keys configuration, authentication of Google Sheets, Gmail, WhatsApp APIs, and testing scrapers individually. | Sticky Note2                                                                                       |
| Workflow functions by automated daily scraping, AI-driven analysis with GPT-4o or Claude, storage in Google Sheets, and alerting via email or WhatsApp without manual intervention. | Sticky Note3                                                                                       |
| Customize scrape targets, AI prompt text, and alert frequency as needed. Benefits include real-time competitive visibility and substantial manual research time savings. | Sticky Note5                                                                                       |
| Archiving in Google Sheets enables trend analysis and evidence-based decision-making over time.    | Sticky Note6                                                                                       |
| Calculating metrics translates insights into measurable signals supporting objective evaluation.   | Sticky Note7                                                                                       |
| AI analysis converts unstructured data into meaningful intelligence at scale using large language models. | Sticky Note8                                                                                       |
| Data consolidation merges all inputs into a unified dataset, enabling consistent downstream analysis. | Sticky Note9                                                                                       |
| Scraping multiple sources in parallel ensures comprehensive and up-to-date competitor signals.    | Sticky Note10                                                                                      |

---

**Disclaimer:**  
The text provided is exclusively derived from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to applicable content policies and contains no illegal, offensive, or protected elements. All data handled is legal and publicly available.