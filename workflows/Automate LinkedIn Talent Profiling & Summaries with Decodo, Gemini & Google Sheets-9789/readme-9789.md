Automate LinkedIn Talent Profiling & Summaries with Decodo, Gemini & Google Sheets

https://n8nworkflows.xyz/workflows/automate-linkedin-talent-profiling---summaries-with-decodo--gemini---google-sheets-9789


# Automate LinkedIn Talent Profiling & Summaries with Decodo, Gemini & Google Sheets

### 1. Workflow Overview

This workflow automates the extraction, parsing, enrichment, and summarization of LinkedIn talent profiles to generate structured and insightful candidate summaries. It is designed primarily for recruiters, HR technology platforms, and AI-powered hiring agents who require rapid and intelligent talent profiling from LinkedIn URLs.

**Logical Blocks:**

- **1.1 Input Reception:** Manual trigger and setting of LinkedIn profile URL and geographic context.
- **1.2 LinkedIn Profile Extraction via Decodo:** Web scraping the LinkedIn profile to retrieve raw profile data.
- **1.3 AI Processing for Structured Data and Summaries:** Using Google Gemini and LangChain models to parse raw data into structured JSON and generate a concise summary.
- **1.4 Data Post-Processing:** Cleaning and parsing JSON output from AI nodes.
- **1.5 Data Consolidation and Output:** Merging structured data and summary, then appending or updating the record in a Google Sheets document for storage and further use.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block initializes the workflow by manually triggering execution and setting the input fields required for scraping the LinkedIn profile, specifically the profile URL and geographical region.

- **Nodes Involved:**  
  - When clicking ‘Execute workflow’ (Manual Trigger)  
  - Set the Input Fields

- **Node Details:**  

  - **When clicking ‘Execute workflow’**  
    - Type: Manual Trigger  
    - Role: Starts the workflow on user command.  
    - Configuration: Default manual trigger with no parameters.  
    - Inputs: None  
    - Outputs: Triggers "Set the Input Fields" node.  
    - Edge cases: Workflow stays idle until manual execution; no external input errors possible.  

  - **Set the Input Fields**  
    - Type: Set Node  
    - Role: Defines and assigns the LinkedIn profile URL and geographic region as workflow variables.  
    - Configuration:  
      - `url` set to a hardcoded LinkedIn profile URL (https://www.linkedin.com/in/ranjan-dailata/)  
      - `geo` set to "India"  
    - Expressions: None, static assignment.  
    - Inputs: Triggered by manual trigger node.  
    - Outputs: Data passed to "Decodo" node.  
    - Edge cases: Hardcoded values limit flexibility; manual change needed for other profiles.  

#### 2.2 LinkedIn Profile Extraction via Decodo

- **Overview:**  
  Scrapes the LinkedIn profile page using Decodo’s API, extracting raw profile content based on the provided URL and geographic context.

- **Nodes Involved:**  
  - Decodo

- **Node Details:**  

  - **Decodo**  
    - Type: Decodo API Node (Third-party web scraping service)  
    - Role: Retrieves raw LinkedIn profile data by URL and geo parameters.  
    - Configuration:  
      - URL and geo passed dynamically from "Set the Input Fields" node (`={{ $json.url }}`, `={{ $json.geo }}`)  
      - Uses Decodo API credentials for authentication.  
      - `retryOnFail`: enabled to handle transient failures.  
    - Inputs: Receives LinkedIn URL and geographic info.  
    - Outputs: Raw scraped data with a nested structure (`data.results[0].content`).  
    - Edge cases:  
      - Possible API authentication errors, rate limits, or network timeouts.  
      - Scraping may fail if LinkedIn changes page structure or if the profile is private.  

#### 2.3 AI Processing for Structured Data and Summaries

- **Overview:**  
  Processes the raw LinkedIn content using AI models to extract structured resume data (in JSON Resume Schema) and generate a concise professional summary. Two parallel AI chains are invoked: one for structured data extraction and one for summarization.

- **Nodes Involved:**  
  - Google Gemini Chat Model for Structured Data  
  - Structured Data Extractor (LangChain LLM)  
  - Extract the JSON (Code Node)  
  - Google Gemini Chat Model for Summary  
  - Summarize Content (LangChain LLM)

- **Node Details:**

  - **Google Gemini Chat Model for Structured Data**  
    - Type: LangChain Google Gemini Chat Model  
    - Role: AI model to interpret LinkedIn raw content and prepare it for structured extraction.  
    - Configuration: Uses Gemini model "models/gemini-2.0-flash-exp"  
    - Input: Raw content from Decodo node.  
    - Output: To "Structured Data Extractor".  
    - Credentials: Google Gemini API credentials.  
    - Edge cases: API limits, latency, or malformed inputs affecting AI response quality.  

  - **Structured Data Extractor**  
    - Type: LangChain Chain LLM node  
    - Role: Parses the raw AI-processed content to format it as JSON Resume Schema.  
    - Configuration: Uses prompt "You are an expert resume parser" and parses `{{ $json.data.results[0].content }}`.  
    - Input: Output of Google Gemini Structured Data node.  
    - Output: Sends JSON string to "Extract the JSON".  
    - Edge cases: Parsing errors if AI output is malformed or incomplete.  

  - **Extract the JSON**  
    - Type: Code Node (JavaScript)  
    - Role: Cleans and parses JSON text from AI output, removing markdown wrappers (```json ... ```) and converting to JSON object.  
    - Configuration: Custom JS code to sanitize and parse.  
    - Input: Text output from "Structured Data Extractor".  
    - Output: Parsed JSON object forwarded to "Merge".  
    - Edge cases: JSON.parse errors on invalid JSON; requires strict format from AI output.  

  - **Google Gemini Chat Model for Summary**  
    - Type: LangChain Google Gemini Chat Model  
    - Role: AI model to generate professional summary from raw LinkedIn profile content.  
    - Configuration: Uses same Gemini model as structured data node.  
    - Input: Raw content from Decodo node.  
    - Output: Sent to "Summarize Content" node.  
    - Credentials: Google Gemini API credentials.  
    - Edge cases: Same as Structured Data Gemini node.  

  - **Summarize Content**  
    - Type: LangChain Chain LLM node  
    - Role: Processes AI summary with prompt "You are an expert summarizer" to produce concise candidate summary.  
    - Input: Output from Gemini Summary node.  
    - Output: Passes summary text to "Merge".  
    - Edge cases: AI may produce incomplete or generic summaries; no recommendations included by prompt design.  

#### 2.4 Data Consolidation and Output

- **Overview:**  
  Merges structured JSON data and textual summary into a unified record and stores or updates it in a Google Sheet for persistent storage and downstream use.

- **Nodes Involved:**  
  - Merge  
  - Append or update row in sheet

- **Node Details:**

  - **Merge**  
    - Type: Merge Node  
    - Role: Combines two inputs — structured JSON (from "Extract the JSON") and summary text (from "Summarize Content") — into a single data object.  
    - Configuration: Default merge (likely merge by index).  
    - Inputs: Two inputs from respective AI processing streams.  
    - Output: Combined data to Google Sheets node.  
    - Edge cases: Synchronization issues if inputs are delayed or missing; may cause partial data merges.  

  - **Append or update row in sheet**  
    - Type: Google Sheets Node  
    - Role: Appends or updates a row in the specified Google Sheet with the combined profile data.  
    - Configuration:  
      - Operation: Append or update based on matching "profile" column.  
      - Writes the entire profile JSON as a string into the "profile" column.  
      - Google Sheet document and sheet specified by ID and gid=0.  
    - Credentials: Google OAuth2 credentials configured.  
    - Inputs: Merged JSON and summary data.  
    - Edge cases: Google API authentication errors, quota limits, or invalid sheet ID issues.  
    - Note: Summary column is present but marked as removed/hidden in schema, so summary is not separately saved here.  

---

### 3. Summary Table

| Node Name                         | Node Type                            | Functional Role                                    | Input Node(s)                    | Output Node(s)                     | Sticky Note                                                                                                                        |
|----------------------------------|------------------------------------|---------------------------------------------------|---------------------------------|----------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger                     | Initiates the workflow manually                    | None                            | Set the Input Fields              |                                                                                                                                   |
| Set the Input Fields             | Set Node                          | Defines LinkedIn URL and geographic info           | When clicking ‘Execute workflow’ | Decodo                          |                                                                                                                                   |
| Decodo                          | Decodo API Node                   | Scrapes LinkedIn profile data                       | Set the Input Fields            | Structured Data Extractor, Summarize Content |                                                                                                                                   |
| Structured Data Extractor       | LangChain Chain LLM               | Parses content to JSON Resume Schema                | Google Gemini Chat Model for Structured Data | Extract the JSON                |                                                                                                                                   |
| Extract the JSON                | Code Node (JS)                   | Cleans and parses AI JSON string output             | Structured Data Extractor       | Merge                           |                                                                                                                                   |
| Summarize Content              | LangChain Chain LLM               | Summarizes raw LinkedIn content                      | Google Gemini Chat Model for Summary | Merge                           |                                                                                                                                   |
| Google Gemini Chat Model for Structured Data | LangChain Google Gemini Chat Model | AI enrichment for structured data extraction        | Decodo                         | Structured Data Extractor        | ![Logo](https://cdn.brandfetch.io/idIeG9_eXK/w/100/h/100/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1756483136894) Google Gemini AI for the Structured Data Extraction and Summarization purposes |
| Google Gemini Chat Model for Summary | LangChain Google Gemini Chat Model | AI enrichment for summary generation                 | Decodo                         | Summarize Content               |                                                                                                                                   |
| Merge                          | Merge Node                        | Combines structured JSON and summary into one record | Extract the JSON, Summarize Content | Append or update row in sheet |                                                                                                                                   |
| Append or update row in sheet  | Google Sheets Node                | Stores or updates profile data in Google Sheets     | Merge                          | None                           |                                                                                                                                   |
| Sticky Note                   | Sticky Note                       | Workflow purpose and use case explanation            | None                          | None                           | ## Purpose: Automatically extract, parse, and analyze LinkedIn profiles to generate structured talent summaries and insights. Ideal for recruiters and AI hiring agents. |
| Sticky Note1                  | Sticky Note                       | Branding and Google Gemini AI description             | None                          | None                           | ![Logo](https://cdn.brandfetch.io/idIeG9_eXK/w/100/h/100/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1756483136894) Google Gemini AI for the Structured Data Extraction and Summarization purposes |
| Sticky Note2                  | Sticky Note                       | Data Enrichment section header                        | None                          | None                           | ## Data Enrichment                                                                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger Node:**  
   - Name: `When clicking ‘Execute workflow’`  
   - Purpose: To manually start the workflow.

2. **Create a Set Node:**  
   - Name: `Set the Input Fields`  
   - Purpose: Define input parameters.  
   - Parameters:  
     - Add field `url` (string): set to `"https://www.linkedin.com/in/ranjan-dailata/"`  
     - Add field `geo` (string): set to `"India"`  
   - Connect input from Manual Trigger.

3. **Create Decodo Node:**  
   - Name: `Decodo`  
   - Purpose: Scrape LinkedIn profile by URL and geo.  
   - Configure with Decodo API credentials.  
   - Set parameters to:  
     - `url`: `={{ $json.url }}`  
     - `geo`: `={{ $json.geo }}`  
   - Connect input from `Set the Input Fields`.

4. **Create Google Gemini Chat Model Node for Structured Data:**  
   - Name: `Google Gemini Chat Model for Structured Data`  
   - Purpose: AI enrichment for structured data extraction.  
   - Use Google Gemini API credentials.  
   - Model: `models/gemini-2.0-flash-exp`  
   - Connect input from `Decodo`.

5. **Create LangChain Chain LLM Node for Structured Data Extraction:**  
   - Name: `Structured Data Extractor`  
   - Purpose: Parse AI content into JSON Resume Schema.  
   - Prompt: "You are an expert resume parser"  
   - Input text expression: `=Parse and Extract the following content  {{ $json.data.results[0].content }} in JSON Resume Schema`  
   - Connect AI language model input from `Google Gemini Chat Model for Structured Data`.  
   - Connect main input from `Decodo`.

6. **Create Code Node to Extract JSON:**  
   - Name: `Extract the JSON`  
   - Purpose: Clean and parse JSON text from AI output.  
   - JavaScript code to remove markdown wrappers and parse JSON (see node details).  
   - Connect input from `Structured Data Extractor`.

7. **Create Google Gemini Chat Model Node for Summary:**  
   - Name: `Google Gemini Chat Model for Summary`  
   - Purpose: AI enrichment for summary generation.  
   - Use same Google Gemini API credentials.  
   - Model: `models/gemini-2.0-flash-exp`  
   - Connect input from `Decodo`.

8. **Create LangChain Chain LLM Node for Summarization:**  
   - Name: `Summarize Content`  
   - Purpose: Produce concise summary from raw profile text.  
   - Prompt: "You are an expert summarizer"  
   - Input text expression: `=Analyze and Summarize the {{ $json.data.results[0].content }}. Do not output your own thoughts or suggestions or recommendations. Instead, just output the summary.`  
   - Connect AI language model input from `Google Gemini Chat Model for Summary`.

9. **Create Merge Node:**  
   - Name: `Merge`  
   - Purpose: Combine structured JSON data and summary text.  
   - Connect main input 1 from `Extract the JSON`.  
   - Connect main input 2 from `Summarize Content`.

10. **Create Google Sheets Node:**  
    - Name: `Append or update row in sheet`  
    - Purpose: Save combined profile to Google Sheets.  
    - Credentials: Google OAuth2 account with Sheets access.  
    - Configuration:  
      - Operation: Append or update row based on matching `profile` column.  
      - Sheet name: `"Sheet1"` (gid=0)  
      - Document ID: The Google Sheet ID (e.g., `1nopL6tWWBydiGqRz4HuyTjbp4D_1to75QNGzLszUV-g`)  
      - Columns: Map `profile` to `={{ $json.toJsonString() }}`  
    - Connect input from `Merge`.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                  | Context or Link                                                                                   |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Automatically extract, parse, and analyze LinkedIn profiles to generate structured talent summaries and insights. Ideal for recruiters and AI hiring agents. | Workflow Sticky Note — Purpose and Use Case Summary                                              |
| ![Logo](https://cdn.brandfetch.io/idIeG9_eXK/w/100/h/100/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1756483136894) Google Gemini AI for Structured Data Extraction and Summarization purposes | Sticky Note with Google Gemini branding                                                          |
| Data Enrichment                                                                                                                                               | Sticky Note header indicating the AI enrichment block                                           |

---

**Disclaimer:**  
The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This process strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All processed data are legal and publicly available.