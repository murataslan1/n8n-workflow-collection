Automate Real-time SEO Keyword Research with DataForSEO and Google Sheets

https://n8nworkflows.xyz/workflows/automate-real-time-seo-keyword-research-with-dataforseo-and-google-sheets-7640


# Automate Real-time SEO Keyword Research with DataForSEO and Google Sheets

### 1. Workflow Overview

This n8n workflow automates real-time SEO keyword research by integrating DataForSEO API data with Google Sheets for seamless data collection, analysis, and tracking. It targets SEO professionals, content creators, affiliate marketers, and e-commerce teams who require up-to-date, actionable keyword insights without manual effort.

The workflow logically splits into these main blocks:

- **1.1 Initialization & Input Reception**: Accepts manual trigger input, sets the Google Sheet ID, and reads main keywords marked as "Ready" from the Google Sheet.

- **1.2 DataForSEO API Requests & Keyword Research**: Executes multiple parallel POST requests to DataForSEO API for:
  - Related Keywords
  - Keyword Suggestions
  - Autocomplete Suggestions
  - Content Ideas
  - SERP & People Also Ask (PAA) data

- **1.3 Data Parsing & Splitting**: Each API response is parsed and split into individual keyword or result records for granular processing.

- **1.4 Data Storage & Logging**: Appends parsed data into dedicated Google Sheet tabs (e.g., Related KW, KW Suggestion, Autocomplete Suggestion, Content Idea, SERP, PAA) as well as an "All Results" master log for consolidated tracking.

- **1.5 Filtering & Data Routing**: Filters SERP data to isolate organic results and PAA data for focused storage.

- **1.6 Workflow Documentation & User Guidance**: Sticky notes provide detailed instructions, setup guides, and context about how the workflow operates and how to use it.

---

### 2. Block-by-Block Analysis

---

#### 2.1 Initialization & Input Reception

**Overview:**  
This block triggers the workflow manually, sets the Google Sheets document ID, and fetches the main keywords marked as "Ready" for processing.

**Nodes Involved:**  
- When clicking ‘Test workflow’ (Manual Trigger)  
- Set Sheet ID (Set)  
- Get Main Keywords (Google Sheets)

**Node Details:**

- **When clicking ‘Test workflow’**  
  - Type: Manual Trigger  
  - Role: Start node activated via user interaction to initiate workflow execution.  
  - Configuration: No parameters needed.  
  - Input: None  
  - Output: Triggers "Set Sheet ID" node.  
  - Edge Cases: User must manually trigger; no auto-scheduling here.

- **Set Sheet ID**  
  - Type: Set  
  - Role: Defines the Google Sheet document ID used throughout the workflow.  
  - Configuration: Sets a single string variable `id_sheet` with the target Google Sheet ID (default: `1QiaKcy5MwLwmBqD4FrBTd_m3GCK1Jjll9IsNi7q96QA`).  
  - Input: Triggered by manual trigger node.  
  - Output: Passes the sheet ID to "Get Main Keywords".  
  - Edge Cases: Incorrect or missing Sheet ID causes all Google Sheets nodes to fail.

- **Get Main Keywords**  
  - Type: Google Sheets (Read)  
  - Role: Reads main keywords from the "Main Keyword" tab where Status equals "Ready".  
  - Configuration:  
    - Filter: `Status` column must be 'Ready'.  
    - Sheet: "Main Keyword" tab (gid=0).  
    - Returns the first match only.  
  - Input: Receives the sheet ID from "Set Sheet ID".  
  - Output: Emits matched main keyword records for parallel API querying.  
  - Credentials: Google Sheets OAuth2 (hoanglt).  
  - Edge Cases: No keywords with "Ready" status means no further execution downstream.

---

#### 2.2 DataForSEO API Requests & Keyword Research

**Overview:**  
For each main keyword, the workflow sends parallel POST requests to various DataForSEO API endpoints to retrieve related keywords, keyword suggestions, autocomplete suggestions, content ideas, and SERP data.

**Nodes Involved:**  
- Get Related KWs (HTTP Request)  
- Get KW Suggestions (HTTP Request)  
- Get Autocomplete Suggestions (HTTP Request)  
- Get Content Ideas (HTTP Request)  
- Get SERPs (HTTP Request)

**Node Details:**

- **Get Related KWs**  
  - Type: HTTP Request (POST)  
  - Role: Retrieves related keywords with detailed info and SERP data.  
  - Configuration:  
    - URL: `https://api.dataforseo.com/v3/dataforseo_labs/google/related_keywords/live`  
    - Auth: HTTP Basic Auth (DataForSEO credentials)  
    - Body: JSON containing keyword, location, language, limit, include SERP info, seed keyword, depth=2  
  - Input: Main keyword JSON from "Get Main Keywords".  
  - Output: Raw API response with related keywords.  
  - Edge Cases: API rate limits, auth failures, malformed JSON inputs.

- **Get KW Suggestions**  
  - Type: HTTP Request (POST)  
  - Role: Fetches keyword suggestions related to the main keyword.  
  - Configuration similar to Get Related KWs but with URL:  
    `https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_suggestions/live`  
  - Input/Output similar to "Get Related KWs".  
  - Edge Cases: Similar API-related errors.

- **Get Autocomplete Suggestions**  
  - Type: HTTP Request (POST)  
  - Role: Retrieves Google autocomplete suggestions for the keyword.  
  - URL: `https://api.dataforseo.com/v3/serp/google/autocomplete/live/advanced`  
  - Input: Main keyword JSON.  
  - Output: Autocomplete keyword suggestions.  
  - Edge Cases: API errors, empty autocomplete results.

- **Get Content Ideas**  
  - Type: HTTP Request (POST)  
  - Role: Retrieves content ideas and subtopics for the main keyword.  
  - URL: `https://api.dataforseo.com/v3/content_generation/generate_sub_topics/live`  
  - Input/Output as above.  
  - Edge Cases: API errors, empty content idea arrays.

- **Get SERPs**  
  - Type: HTTP Request (POST)  
  - Role: Retrieves organic SERPs and People Also Ask (PAA) data for the keyword.  
  - URL: `https://api.dataforseo.com/v3/serp/google/organic/live/advanced`  
  - Input: Main keyword JSON.  
  - Output: Mixed SERP and PAA results.  
  - Edge Cases: Partial data, API timeouts.

---

#### 2.3 Data Parsing & Splitting

**Overview:**  
Each API response that contains arrays of results is split into individual records for granular processing and appending to Google Sheets.

**Nodes Involved:**  
- Split Out Related KW  
- Split Out KW Suggestions  
- Split Out Autocomplete Suggestions  
- Split Out Content Ideas  
- Split Out SERPs and PAAs  
- Split Out PAA

**Node Details:**

- **Split Out Related KW**  
  - Type: Split Out  
  - Role: Splits the array of related keywords into individual items.  
  - Field to split: `tasks[0].result[0].items`  
  - Input: Response from "Get Related KWs".  
  - Output: Single related keyword items.  
  - Edge Cases: Empty arrays cause no further output.

- **Split Out KW Suggestions**  
  - Same as above but for keyword suggestions.

- **Split Out Autocomplete Suggestions**  
  - Splits autocomplete suggestions from API response.

- **Split Out Content Ideas**  
  - Splits content ideas from `tasks[0].result[0].sub_topics`.

- **Split Out SERPs and PAAs**  
  - Splits combined SERP and PAA results from `tasks[0].result[0].items`.

- **Split Out PAA**  
  - Splits PAA question arrays.

---

#### 2.4 Data Storage & Logging

**Overview:**  
This block appends each processed keyword research result into specific Google Sheets tabs and simultaneously logs all data into a consolidated "All Results" tab for overview.

**Nodes Involved:**  
- Add Related KWs  
- Save Related KWs to All Results  
- Add KW Suggestions  
- Save KW Suggestions to All Results  
- Add Autocomplete Suggestions  
- Save Autocomplete Suggestions to All Results  
- Add Content Ideas  
- Add Content Ideas to All Results  
- Add SERPs  
- Add PAAs  
- Add PAAs to All Results

**Node Details:**

- **Add Related KWs**  
  - Type: Google Sheets (Append)  
  - Role: Appends related keywords to "Related KW" tab.  
  - Mapping includes CPC, MSV, Type, Keyword, Competition, Main Keyword, KW Difficulty, Search Intent fields.  
  - Uses Google Sheets OAuth2 credentials.  
  - Input: Individual related keyword items.  
  - Output: Passes to "Save Related KWs to All Results".  
  - Edge Cases: Sheet access errors, data format mismatches.

- **Save Related KWs to All Results**  
  - Similar to "Add Related KWs" but appends to "All Results" master tab with additional field "Answer" empty.

- **Add KW Suggestions**  
  - Appends keyword suggestions to "KW Suggestion" tab with similar field mapping.

- **Save KW Suggestions to All Results**  
  - Appends keyword suggestions to "All Results" tab.

- **Add Autocomplete Suggestions**  
  - Appends autocomplete keywords to "Autocomplete Suggestion" tab; fields: Type, Autocomplete, Main Keyword.

- **Save Autocomplete Suggestions to All Results**  
  - Appends autocomplete data to "All Results" tab; some fields removed for simplification.

- **Add Content Ideas**  
  - Appends extracted subtopics as content ideas to "Content Idea" tab; fields: Type="Subtopics", Subtopics, Main Keyword.

- **Add Content Ideas to All Results**  
  - Appends content ideas to "All Results" tab with placeholder empty fields for CPC, MSV, etc.

- **Add SERPs**  
  - Appends filtered organic SERP entries to "SERP" tab; fields include URL, Type, Title, Domain, Description, Main Keyword.

- **Add PAAs**  
  - Appends filtered PAA questions to "PAA" tab; fields include FAQ (PAA question), Type, Main Keyword.

- **Add PAAs to All Results**  
  - Appends PAA questions to "All Results" tab.

---

#### 2.5 Filtering & Data Routing

**Overview:**  
Filters SERP data to only include organic results and separates PAA questions for focused downstream processing.

**Nodes Involved:**  
- Filter SERPs  
- Filter PAAs

**Node Details:**

- **Filter SERPs**  
  - Type: Filter  
  - Role: Passes only items where `type` equals 'organic' for SERP appending.  
  - Input: Split SERP and PAA data.  
  - Output: To "Add SERPs".  
  - Edge Cases: If no organic results, downstream nodes receive empty data.

- **Filter PAAs**  
  - Filters items where `type` equals 'people_also_ask'.  
  - Output: To "Split Out PAA" for further processing.

---

#### 2.6 Workflow Documentation & User Guidance

**Overview:**  
Sticky note nodes provide detailed instructions, workflow overview, setup guidance, and best practices for users.

**Nodes Involved:**  
- Sticky Note (Main overview and usage)  
- Sticky Note1 (Result types explanation)  
- Sticky Note2 (Setup instructions and customization)  
- Sticky Note3 (Input keyword setup)  
- Sticky Note4 (Phase 2 header)  
- Sticky Note5 to Sticky Note9 (Detailed descriptions for each research step)

**Node Details:**

- All sticky notes contain formatted markdown content explaining workflow purpose, setup, usage instructions, and detailed descriptions of each processing step.  
- Positioned logically near related workflow parts.  
- No inputs or outputs; purely for user reference.

---

### 3. Summary Table

| Node Name                      | Node Type                 | Functional Role                                  | Input Node(s)                | Output Node(s)                       | Sticky Note                                                                                          |
|--------------------------------|---------------------------|-------------------------------------------------|------------------------------|-------------------------------------|----------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’  | Manual Trigger            | Starts workflow manually                         | -                            | Set Sheet ID                        |                                                                                                |
| Set Sheet ID                  | Set                       | Sets Google Sheet ID variable                    | When clicking ‘Test workflow’ | Get Main Keywords                   | See Sticky Note3 for input keyword setup instructions                                            |
| Get Main Keywords             | Google Sheets             | Reads main keywords marked "Ready"               | Set Sheet ID                 | Get Related KWs, Get KW Suggestions, Get Autocomplete Suggestions, Get Content Ideas, Get SERPs |                                                                                                |
| Get Related KWs               | HTTP Request              | Requests related keywords from DataForSEO API   | Get Main Keywords            | Split Out Related KW                | See Sticky Note5 - details on related keyword retrieval                                            |
| Split Out Related KW          | Split Out                 | Splits related keywords array into single items | Get Related KWs              | Add Related KWs                    |                                                                                                |
| Add Related KWs               | Google Sheets             | Appends related keywords to "Related KW" tab    | Split Out Related KW         | Save Related KWs to All Results    |                                                                                                |
| Save Related KWs to All Results | Google Sheets             | Appends related keywords to "All Results" master tab | Add Related KWs              | -                                 |                                                                                                |
| Get KW Suggestions            | HTTP Request              | Requests keyword suggestions from DataForSEO    | Get Main Keywords            | Split Out KW Suggestions           | See Sticky Note6 - keyword suggestion details                                                    |
| Split Out KW Suggestions      | Split Out                 | Splits keyword suggestions array                 | Get KW Suggestions           | Add KW Suggestions                 |                                                                                                |
| Add KW Suggestions            | Google Sheets             | Appends keyword suggestions to "KW Suggestion" tab | Split Out KW Suggestions     | Save KW Suggestions to All Results |                                                                                                |
| Save KW Suggestions to All Results | Google Sheets             | Appends keyword suggestions to "All Results"    | Add KW Suggestions           | -                                 |                                                                                                |
| Get Autocomplete Suggestions  | HTTP Request              | Requests Google autocomplete suggestions         | Get Main Keywords            | Split Out Autocomplete Suggestions | See Sticky Note7 - autocomplete suggestion details                                               |
| Split Out Autocomplete Suggestions | Split Out                 | Splits autocomplete suggestions array            | Get Autocomplete Suggestions | Add Autocomplete Suggestions       |                                                                                                |
| Add Autocomplete Suggestions  | Google Sheets             | Appends autocomplete suggestions to "Autocomplete" tab | Split Out Autocomplete Suggestions | Save Autocomplete Suggestions to All Results |                                                                                                |
| Save Autocomplete Suggestions to All Results | Google Sheets             | Appends autocomplete suggestions to "All Results" | Add Autocomplete Suggestions | -                                 |                                                                                                |
| Get Content Ideas             | HTTP Request              | Requests content ideas and subtopics              | Get Main Keywords            | Split Out Content Ideas            | See Sticky Note8 - content ideas details                                                        |
| Split Out Content Ideas       | Split Out                 | Splits content ideas array                         | Get Content Ideas            | Add Content Ideas                 |                                                                                                |
| Add Content Ideas             | Google Sheets             | Appends content ideas to "Content Idea" tab      | Split Out Content Ideas      | Add Content Ideas to All Results   |                                                                                                |
| Add Content Ideas to All Results | Google Sheets             | Appends content ideas to "All Results" tab       | Add Content Ideas            | -                                 |                                                                                                |
| Get SERPs                    | HTTP Request              | Requests SERP and People Also Ask data            | Get Main Keywords            | Split Out SERPs and PAAs           | See Sticky Note9 - SERP and PAA data details                                                    |
| Split Out SERPs and PAAs      | Split Out                 | Splits SERP and PAA items                          | Get SERPs                   | Filter SERPs, Filter PAAs          |                                                                                                |
| Filter SERPs                 | Filter                    | Filters only organic SERP results                  | Split Out SERPs and PAAs      | Add SERPs                        |                                                                                                |
| Add SERPs                   | Google Sheets             | Appends organic SERP entries to "SERP" tab        | Filter SERPs                | -                                 |                                                                                                |
| Filter PAAs                 | Filter                    | Filters PAA (People Also Ask) questions             | Split Out SERPs and PAAs      | Split Out PAA                    |                                                                                                |
| Split Out PAA                | Split Out                 | Splits PAA questions into individual records       | Filter PAAs                 | Add PAAs                        |                                                                                                |
| Add PAAs                    | Google Sheets             | Appends PAA questions to "PAA" tab                  | Split Out PAA               | Add PAAs to All Results          |                                                                                                |
| Add PAAs to All Results      | Google Sheets             | Appends PAA questions to "All Results" tab          | Add PAAs                    | -                                 |                                                                                                |
| Sticky Note                  | Sticky Note               | Workflow description, usage, and instructions      | -                            | -                                 | Main overview and usage instructions                                                             |
| Sticky Note1                 | Sticky Note               | Explanation of Google Sheet tabs/data types        | -                            | -                                 | Result types explanation                                                                          |
| Sticky Note2                 | Sticky Note               | Setup and customization instructions                | -                            | -                                 | Setup guide and credential info                                                                  |
| Sticky Note3                 | Sticky Note               | Input keywords setup instructions                    | -                            | -                                 | How to input main keywords                                                                        |
| Sticky Note4                 | Sticky Note               | Phase 2 header - Automated Research & Data Collection | -                            | -                                 |                                                                                                |
| Sticky Note5                 | Sticky Note               | Details for "Get Related Keywords" step              | -                            | -                                 |                                                                                                |
| Sticky Note6                 | Sticky Note               | Details for "Get Keyword Suggestions" step           | -                            | -                                 |                                                                                                |
| Sticky Note7                 | Sticky Note               | Details for "Get Autocomplete Suggestions" step      | -                            | -                                 |                                                                                                |
| Sticky Note8                 | Sticky Note               | Details for "Get Content Ideas" step                   | -                            | -                                 |                                                                                                |
| Sticky Note9                 | Sticky Note               | Details for "Get SERPs & PAAs" step                    | -                            | -                                 |                                                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger node:**
   - Name: `When clicking ‘Test workflow’`
   - Purpose: Manual start of workflow.

2. **Add a Set node:**
   - Name: `Set Sheet ID`
   - Set a string field `id_sheet` with your Google Sheet ID (example: `1QiaKcy5MwLwmBqD4FrBTd_m3GCK1Jjll9IsNi7q96QA`).
   - Connect it to the Manual Trigger node.

3. **Add a Google Sheets node to read main keywords:**
   - Name: `Get Main Keywords`
   - Operation: Read rows
   - Sheet Name: `Main Keyword` (gid=0)
   - Document ID: Expression `{{$json["id_sheet"]}}` from Set Sheet ID node
   - Filter: Column `Status` equals `Ready`
   - Options: Return first match only
   - Credential: Google Sheets OAuth2 configured with access to your Google Sheet.
   - Connect from Set Sheet ID.

4. **Add HTTP Request nodes for DataForSEO API queries:**

   For each of the following nodes, configure:

   - Authentication: HTTP Basic Auth with your DataForSEO API credentials.
   - Method: POST
   - Send body as JSON
   - Use expressions to insert main keyword, location, language, limit, etc. from `Get Main Keywords` node outputs.

   a) `Get Related KWs`  
      URL: `https://api.dataforseo.com/v3/dataforseo_labs/google/related_keywords/live`  
      JSON body includes keyword, location, language, limit, depth=2, include_serp_info=true, include_seed_keyword=true.

   b) `Get KW Suggestions`  
      URL: `https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_suggestions/live`  
      JSON body includes keyword, location, language, limit, ignore_synonyms=true.

   c) `Get Autocomplete Suggestions`  
      URL: `https://api.dataforseo.com/v3/serp/google/autocomplete/live/advanced`  
      JSON body includes keyword, location, language, client="gws-wiz-serp".

   d) `Get Content Ideas`  
      URL: `https://api.dataforseo.com/v3/content_generation/generate_sub_topics/live`  
      JSON body includes topic (main keyword).

   e) `Get SERPs`  
      URL: `https://api.dataforseo.com/v3/serp/google/organic/live/advanced`  
      JSON body includes language, location, keyword, depth=20, people_also_ask_click_depth=1.

   Connect all these HTTP nodes from `Get Main Keywords` in parallel.

5. **Add Split Out nodes to parse arrays from each HTTP response:**

   - `Split Out Related KW` → splits `tasks[0].result[0].items` from `Get Related KWs`.
   - `Split Out KW Suggestions` → splits `tasks[0].result[0].items` from `Get KW Suggestions`.
   - `Split Out Autocomplete Suggestions` → splits `tasks[0].result[0].items` from `Get Autocomplete Suggestions`.
   - `Split Out Content Ideas` → splits `tasks[0].result[0].sub_topics` from `Get Content Ideas`.
   - `Split Out SERPs and PAAs` → splits `tasks[0].result[0].items` from `Get SERPs`.

   Connect each to their respective HTTP Request node outputs.

6. **Add a Filter node to separate SERPs and PAAs:**

   - `Filter SERPs`: Condition where `$json.type` equals `organic`.
   - `Filter PAAs`: Condition where `$json.type` equals `people_also_ask`.

   Connect from `Split Out SERPs and PAAs`.

7. **Add a Split Out node for PAA questions:**

   - `Split Out PAA`: splits `items` field from filtered PAA data.
   - Connect from `Filter PAAs`.

8. **Add Google Sheets Append nodes for each data type:**

   - For Related Keywords:  
     - `Add Related KWs`: Append to "Related KW" tab, map fields like CPC, MSV, Type="Related", Keyword, Competition, Main Keyword, KW Difficulty, Search Intent.  
     - `Save Related KWs to All Results`: Append to "All Results" tab, similar fields.

   - For Keyword Suggestions:  
     - `Add KW Suggestions`: Append to "KW Suggestion" tab, Type="Suggestion".  
     - `Save KW Suggestions to All Results`: Append to "All Results".

   - For Autocomplete Suggestions:  
     - `Add Autocomplete Suggestions`: Append to "Autocomplete Suggestion" tab, Type="Autocomplete", Autocomplete keyword field.  
     - `Save Autocomplete Suggestions to All Results`: Append to "All Results".

   - For Content Ideas:  
     - `Add Content Ideas`: Append to "Content Idea" tab, Type="Subtopics", Subtopics field.  
     - `Add Content Ideas to All Results`: Append to "All Results".

   - For SERPs:  
     - `Add SERPs`: Append to "SERP" tab, fields URL, Type, Title, Domain, Description, Main Keyword.

   - For PAAs:  
     - `Add PAAs`: Append to "PAA" tab, FAQ question, Type, Main Keyword.  
     - `Add PAAs to All Results`: Append to "All Results".

   Connect each append node to the respective split or filter nodes to receive individual records.

9. **Ensure all Google Sheets nodes use correct credentials:**

   - Google Sheets OAuth2 credentials with read/write access to your Google Sheet.
   - Correct sheet name and document ID parameterized from the `Set Sheet ID` node.

10. **Add Sticky Note nodes for user guidance:**

    - Optionally add sticky notes with setup instructions, result explanations, and usage tips.

---

### 5. General Notes & Resources

| Note Content                                                                                                                         | Context or Link                                                                                  |
|--------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| This workflow automates comprehensive SEO keyword research with real-time API data integration and Google Sheets output for analysis. | Main workflow purpose and overview.                                                            |
| Setup requires valid Google Sheets OAuth2 credentials and DataForSEO API Basic Auth credentials.                                      | Credentials management for API and Google Sheets access.                                       |
| Google Sheet tabs used: Main Keyword, Related KW, KW Suggestion, Autocomplete Suggestion, Content Idea, SERP, PAA, and All Results.   | Data organization and output structure.                                                        |
| Workflow runs manually by clicking "Test Workflow" in n8n or can be automated with scheduling triggers if desired.                   | Execution instructions.                                                                         |
| For customization: add additional research nodes, automate scheduling, or integrate notifications (Telegram, Slack, etc.)            | Enhancement possibilities.                                                                     |
| Provided detailed user instructions and setup guides included in sticky notes within the workflow.                                   | In-workflow user guidance.                                                                     |
| Support and community resources available at [Agent Circle](https://www.agentcircle.ai/) and related social platforms.               | Support and further help.                                                                       |

---

This structured reference document details the full logic, node configurations, and data flow of the "Live-time SEO Keyword Research Tool" n8n workflow, enabling users and AI agents to understand, reproduce, and adapt the automation effectively.