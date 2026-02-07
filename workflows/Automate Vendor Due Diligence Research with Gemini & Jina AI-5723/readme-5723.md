Automate Vendor Due Diligence Research with Gemini & Jina AI

https://n8nworkflows.xyz/workflows/automate-vendor-due-diligence-research-with-gemini---jina-ai-5723


# Automate Vendor Due Diligence Research with Gemini & Jina AI

### 1. Workflow Overview

This n8n workflow automates vendor due diligence research by integrating AI models Gemini (Google PaLM) and Jina AI to evaluate vendor risk systematically. It is designed to intake vendor information, conduct detailed research via AI-driven internet searches and summarization, classify vendor risk, and export comprehensive risk assessment results to Google Sheets with an interactive summary display.

The workflow is logically divided into these main blocks:

- **1.1 Input Reception:** Collects vendor details through a form trigger.
- **1.2 Prompt Construction:** Builds AI prompts tailored for vendor background research and risk classification.
- **1.3 AI Research Queries:** Uses Google Gemini to perform background research and answer detailed risk questions.
- **1.4 URL Extraction and Content Retrieval:** Extracts URLs from AI responses, fetches web content via Jina AI, and summarizes the content relevance.
- **1.5 Risk Assessment Calculation:** Aggregates research data, applies a LangChain information extractor to determine risk scores and rationales.
- **1.6 Results Formatting and Export:** Formats output data and appends results to a Google Sheet, followed by displaying a summary form to the user.

Each block contains nodes that progressively feed data into the next stages, with error handling and conditional branching to manage edge cases like missing URLs or irrelevant content.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:** Captures vendor details via a web form that triggers the workflow.
- **Nodes Involved:** `Intake form`
- **Node Details:**
  - Type: Form Trigger
  - Configuration: Fields include vendor company name, domain, service provided, and data types processed. Required fields ensure essential info is captured.
  - Input: Web form submission
  - Output: JSON object with vendor info
  - Edge Cases: Missing required fields prevented by form validation. Network issues may block form submission.

#### 1.2 Prompt Construction

- **Overview:** Constructs detailed AI prompts for research and risk classification based on intake data.
- **Nodes Involved:** `Build Research Prompts`
- **Node Details:**
  - Type: Set Node
  - Configuration: Assigns two major prompt strings:
    - `system_prompt`: A detailed instruction for AI research analyst role including vendor details and output format.
    - `risk_classifier`: Defines risk tier criteria and classification instructions for vendor classification.
  - Uses expressions to inject form data dynamically into prompt templates.
  - Output: JSON containing prompts and various risk and background question strings.
  - Edge Cases: Expression failures if input fields are missing or malformed.

#### 1.3 AI Research Queries

- **Overview:** Executes AI calls to Google Gemini for background research and risk question answering.
- **Nodes Involved:** `Research Company Background`, `Determine Vendor Classification`, `Answer risk questions`
- **Node Details:**
  - Type: HTTP Request (to Google Gemini API)
  - Configuration:
    - POST requests with structured JSON body including system instructions and content from prompts.
    - Uses `googlePalmApi` credentials for authentication.
    - `retryOnFail` enabled to handle transient API errors.
  - Input: Prompts and vendor info from `Build Research Prompts` or previous AI responses.
  - Output: AI-generated textual research or classification.
  - Edge Cases:
    - API rate limits, authentication errors.
    - Timeout or malformed response.
    - Unexpected AI outputs or empty results.
    - Retry mitigates transient failures.

#### 1.4 URL Extraction and Content Retrieval

- **Overview:** Parses AI responses to extract URLs, fetches web content from these URLs, and summarizes the content to filter relevant data.
- **Nodes Involved:**  
  - `Extract Reference URLs` (Code node)  
  - `Validate URL Extraction` (If node)  
  - `Handle No URLs Found` (Set node)  
  - `Fetch Web Content` (Jina AI node)  
  - `Summarize Web Content` (LangChain Agent)  
  - `Merge Content Data` (Aggregate)  
  - `Sanatize URL Data` (Code)
- **Node Details:**
  - `Extract Reference URLs`:
    - Type: Code (Python)
    - Role: Recursively extracts text from nested JSON AI response to find URLs via regex patterns.
    - Output: List of unique URLs or an empty indicator.
    - Edge Cases: Complex nested JSON, no URLs found, malformed text.
  - `Validate URL Extraction`:
    - Type: If Node
    - Role: Checks if URLs were successfully extracted.
    - Branches:
      - True: Proceed to fetch web content.
      - False: Use default "no urls" data.
  - `Handle No URLs Found`:
    - Type: Set Node
    - Role: Sets fallback data with "invalid data" summary.
  - `Fetch Web Content`:
    - Type: Jina AI Node
    - Role: Scrapes or retrieves page content from each URL.
    - Retry with 5-second intervals; error continuation enabled to not block workflow.
  - `Summarize Web Content`:
    - Type: LangChain Agent Node
    - Role: Analyzes fetched page to determine relevance; outputs structured JSON with URL, title, topic, and summary or "invalid data".
    - Uses batch processing with delay.
  - `Merge Content Data`:
    - Type: Aggregate
    - Role: Consolidates all summarized content into one dataset.
  - `Sanatize URL Data`:
    - Type: Code (Python)
    - Role: Filters out summaries labeled "invalid data" to retain only relevant content.
    - Output: Cleaned research data for risk scoring.

#### 1.5 Risk Assessment Calculation

- **Overview:** Combines all research inputs and applies AI to extract detailed risk scores, rationales, and overall classification.
- **Nodes Involved:** `Calculate Risk Score`, `Format Assessment Results`
- **Node Details:**
  - `Calculate Risk Score`:
    - Type: LangChain Information Extractor
    - Role: Parses input data (background, classification, risk questions, URL data) to produce a detailed risk assessment JSON object.
    - Output: JSON with categories: financial, cybersecurity, regulatory, SLA, BCP, AI, reputation plus overall risk, rationale, and recommendations.
    - Edge Cases: Schema mismatch, incomplete input data.
  - `Format Assessment Results`:
    - Type: Code (Python)
    - Role: Flattens nested JSON output into a single-level JSON with explicit keys for each risk category and overall results.
    - Output: Simplified JSON for export and display.

#### 1.6 Results Formatting and Export

- **Overview:** Exports the risk assessment results to Google Sheets and displays a summary form to the user.
- **Nodes Involved:** `Export to Google Sheet`, `Display Assessment Summary`
- **Node Details:**
  - `Export to Google Sheet`:
    - Type: Google Sheets Append
    - Role: Appends the formatted results into a designated Google Sheet document.
    - Requires OAuth2 credentials for Google Sheets access.
    - Edge Cases: Authentication failure, invalid document ID or sheet name, network errors.
  - `Display Assessment Summary`:
    - Type: Form Node (Completion)
    - Role: Shows a summary message with vendor name, business use case, classification, risk rationale, and recommendations.
    - Operates as a user-facing confirmation after workflow completion.

---

### 3. Summary Table

| Node Name                | Node Type                             | Functional Role                            | Input Node(s)          | Output Node(s)          | Sticky Note                                                                                              |
|--------------------------|-------------------------------------|--------------------------------------------|-----------------------|-------------------------|--------------------------------------------------------------------------------------------------------|
| Intake form              | Form Trigger                        | Vendor details input                       | —                     | Build Research Prompts   | ## | INPUT: Intake Form                                                                                     |
| Build Research Prompts    | Set                                | Constructs AI prompts                      | Intake form           | Research Company Background | ## | Step 1: Vendor Background & Classification                                                             |
| Research Company Background | HTTP Request (Google Gemini API)   | AI research: company background            | Build Research Prompts | Delay1: 1 second         | ## | Step 1: Vendor Background & Classification                                                             |
| Delay1: 1 second         | Wait                              | Wait to avoid API rate limits              | Research Company Background | Determine Vendor Classification |                                                                                                        |
| Determine Vendor Classification | HTTP Request (Google Gemini API)   | AI vendor risk classification              | Delay1: 1 second       | Delay2: 1 second          |                                                                                                        |
| Delay2: 1 second         | Wait                              | Wait to avoid API rate limits              | Determine Vendor Classification | Answer risk questions     |                                                                                                        |
| Answer risk questions     | HTTP Request (Google Gemini API)   | AI answers detailed risk questions          | Delay2: 1 second       | Extract Reference URLs    | ## | Step 2: Vendor Risk Research                                                                            |
| Extract Reference URLs    | Code (Python)                     | Extract URLs from AI response               | Answer risk questions  | Validate URL Extraction   |                                                                                                        |
| Validate URL Extraction   | If                                | Branch based on URL extraction success     | Extract Reference URLs | Fetch Web Content / Handle No URLs Found |                                                                                                        |
| Handle No URLs Found      | Set                                | Fallback data if no URLs found              | Validate URL Extraction (False branch) | Merge Content Data       |                                                                                                        |
| Fetch Web Content         | Jina AI Node                      | Fetch web pages from URLs                    | Validate URL Extraction (True branch) | Summarize Web Content     | ## | Step 3: Vendor Linls Review & Summary                                                                   |
| Summarize Web Content     | LangChain Agent                   | Summarize and validate fetched content     | Fetch Web Content      | Merge Content Data        |                                                                                                        |
| Merge Content Data        | Aggregate                        | Aggregate all summarized content            | Summarize Web Content, Handle No URLs Found | Sanatize URL Data         |                                                                                                        |
| Sanatize URL Data         | Code (Python)                    | Filter out irrelevant content               | Merge Content Data     | Calculate Risk Score      |                                                                                                        |
| Calculate Risk Score      | LangChain Information Extractor  | Perform multi-category risk assessment      | Sanatize URL Data      | Format Assessment Results | ## | Step 4: Vendor Risk Assessment                                                                          |
| Format Assessment Results | Code (Python)                    | Flatten and prepare final results for export| Calculate Risk Score   | Export to Google Sheet    |                                                                                                        |
| Export to Google Sheet    | Google Sheets Append             | Save risk assessment to Google Sheets       | Format Assessment Results | Display Assessment Summary | ## | Step 5 - Export Results                                                                                  |
| Display Assessment Summary| Form (Completion)                | Show summary message to user                 | Export to Google Sheet | —                        |                                                                                                        |
| Sticky Note               | Sticky Note                     | Visual workflow annotations                   | —                     | —                        | ## | Step 1: Vendor Background & Classification                                                             |
| Sticky Note1              | Sticky Note                     | Visual workflow annotations                   | —                     | —                        | ## | Step 2: Vendor Risk Research                                                                            |
| Sticky Note2              | Sticky Note                     | Visual workflow annotations                   | —                     | —                        | ## | INPUT: Intake Form                                                                                      |
| Sticky Note3              | Sticky Note                     | Visual workflow annotations                   | —                     | —                        | ## | Step 3: Vendor Linls Review & Summary  \n\n 🚀 Setup Requirements\n\nSee https://docs.google.com/spreadsheets/d/1PCpZ9wMPFvm4vubiPBqw021Lz8JiHUnr-EWl1cdIKYY/edit?usp=sharing |
| Sticky Note4              | Sticky Note                     | Visual workflow annotations                   | —                     | —                        | ## | Step 4: Vendor Risk Assessment                                                                          |
| Sticky Note5              | Sticky Note                     | Visual workflow annotations                   | —                     | —                        | ## | Step 5 - Export Results                                                                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Form Trigger Node named `Intake form`:**
   - Fields:  
     - "What is the vendor's company name?" (Required)  
     - "In which domain does the vendor operate?"  
     - "What service will the vendor provide for your organization?" (Required)  
     - "What type of data will the vendor process or store?" (Required)  
   - Description: "Please fill in the vendor details and the business use case as accurately as possible to determine the risk level."
   - Configure webhook ID (auto-assigned).

2. **Add Set Node named `Build Research Prompts`:**
   - Assign two string fields `system_prompt` and `risk_classifier` with detailed prompt texts.
   - Inject form data via expressions, e.g., `{{$json["What is the vendor's company name?"]}}`.
   - Also assign `background_q` and `all_q` fields with predefined question lists.

3. **Add HTTP Request Node `Research Company Background`:**
   - Method: POST
   - URL: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`
   - Body (JSON): Use `system_prompt` and `background_q` from previous node via expressions.
   - Authentication: Use Google Palm API credentials (OAuth2 or API key).
   - Enable retry on fail.

4. **Add Wait Node `Delay1: 1 second`:**
   - Wait for 1 second to avoid API rate limits.

5. **Add HTTP Request Node `Determine Vendor Classification`:**
   - Similar configuration to `Research Company Background` but use `risk_classifier` prompt and background research text.
   - Authentication and retry enabled.

6. **Add Wait Node `Delay2: 1 second`:**

7. **Add HTTP Request Node `Answer risk questions`:**
   - Similar POST request to Google Gemini API.
   - Body uses `system_prompt` and `all_q` from `Build Research Prompts`.
   - Authentication and retry enabled.

8. **Add Code Node `Extract Reference URLs`:**
   - Language: Python
   - Implement recursive function to extract text and regex to extract URLs from the AI response.
   - Output each URL as a separate item.

9. **Add If Node `Validate URL Extraction`:**
   - Condition: `{{$json.url && $json.url.length > 0}}` equals true
   - True branch: proceed to `Fetch Web Content`
   - False branch: proceed to `Handle No URLs Found`

10. **Add Set Node `Handle No URLs Found`:**
    - Set fields:  
      - `url`: "no urls"  
      - `extraction_success`: false  
      - `summary`: "invalid data"

11. **Add Jina AI Node `Fetch Web Content`:**
    - Parameter `url`: `={{$json.url}}`
    - Credentials: Jina AI API key
    - Retry on fail with 5-second wait
    - Error handling: continue on failure.

12. **Add LangChain Agent Node `Summarize Web Content`:**
    - Prompt: Analyze page content to determine relevance and summarize or return "invalid data".
    - Input fields: title, description, URL, content from `Fetch Web Content`.
    - Output parser enabled.
    - Batch size 1, delay 1 second.

13. **Add Aggregate Node `Merge Content Data`:**
    - Aggregate all summarized content items into one.

14. **Add Code Node `Sanatize URL Data`:**
    - Filter out items where summary equals "invalid data".

15. **Add LangChain Information Extractor Node `Calculate Risk Score`:**
    - Text input composed of gathered research data, classification, risk answers, and URLs.
    - Schema defined for detailed risk categories and overall risk.
    - Retry enabled.

16. **Add Code Node `Format Assessment Results`:**
    - Flatten nested JSON risk data into a single-level JSON object with distinct keys per category.

17. **Add Google Sheets Node `Export to Google Sheet`:**
    - Operation: Append
    - Document ID and Sheet Name: configure with your Google Sheets document.
    - Credentials: Google Sheets OAuth2 account.

18. **Add Form Node `Display Assessment Summary`:**
    - Operation: Completion
    - Completion message includes vendor name, business use case, classification, risk rationale, and recommendations using expressions.

19. **Connect nodes in order:**
    - `Intake form` → `Build Research Prompts` → `Research Company Background` → `Delay1: 1 second` → `Determine Vendor Classification` → `Delay2: 1 second` → `Answer risk questions` → `Extract Reference URLs` → `Validate URL Extraction` (True → `Fetch Web Content` → `Summarize Web Content`; False → `Handle No URLs Found`) → `Merge Content Data` → `Sanatize URL Data` → `Calculate Risk Score` → `Format Assessment Results` → `Export to Google Sheet` → `Display Assessment Summary`.

20. **Credential Setup:**
    - Configure Google Palm API credentials (Gemini).
    - Configure Jina AI API credentials.
    - Configure Google Sheets OAuth2 credentials.

21. **Optional:**
    - Adjust prompts in `Build Research Prompts` for custom vendor risk frameworks.
    - Use the Google Sheets template linked in sticky notes for output formatting.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                      | Context or Link                                                                                                    |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| The workflow requires API credentials for Google Gemini (PaLM) and Jina AI to operate effectively. Ensure these are configured before execution.                                                                                                                                                                                                                                  | —                                                                                                                 |
| Download the Google Sheets template for outputs here: https://docs.google.com/spreadsheets/d/1PCpZ9wMPFvm4vubiPBqw021Lz8JiHUnr-EWl1cdIKYY/edit?usp=sharing                                                                                                                                                                                                                         | Provided in Sticky Note3                                                                                            |
| Customize prompts in `Build Research Prompts` node to tailor risk assessment to your organization's vendor risk framework or specific business use cases.                                                                                                                                                                                                                          | —                                                                                                                 |
| The accuracy of the risk assessment depends heavily on the quality and completeness of the vendor intake form data.                                                                                                                                                                                                                                                               | Mentioned in Sticky Note3                                                                                          |
| The workflow implements retry logic on AI requests and error continuation on web content fetching to improve robustness against network or API issues.                                                                                                                                                                                                                             | —                                                                                                                 |
| This workflow respects data privacy and compliance by processing only publicly available and legally accessible information.                                                                                                                                                                                                                                                      | —                                                                                                                 |
| For more advanced customization or integration, consider extending the workflow with additional AI models or data enrichment services.                                                                                                                                                                                                                                           | —                                                                                                                 |

---

This documentation enables a deep understanding of the workflow architecture, node configurations, and execution flow. It also provides all necessary details for manual reconstruction or AI-driven automation of the vendor due diligence research process.