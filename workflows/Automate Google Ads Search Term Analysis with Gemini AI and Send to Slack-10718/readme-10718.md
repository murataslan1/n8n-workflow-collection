Automate Google Ads Search Term Analysis with Gemini AI and Send to Slack

https://n8nworkflows.xyz/workflows/automate-google-ads-search-term-analysis-with-gemini-ai-and-send-to-slack-10718


# Automate Google Ads Search Term Analysis with Gemini AI and Send to Slack

### 1. Workflow Overview

This workflow automates the analysis of Google Ads search term data for brand campaigns using Google Gemini AI and sends actionable insights to Slack. It is designed for SEM (Search Engine Marketing) managers seeking to identify and manage non-brand keyword wastage and keywords worthy of review, streamlining campaign optimization.

The workflow is logically divided into these blocks:

- **1.1 Trigger and Data Fetching:** Initiates workflow manually and retrieves Google Ads campaigns and their search term data.
- **1.2 Data Cleaning and Aggregation:** Processes raw search term data, removing brand-related terms and aggregating metrics.
- **1.3 AI-Powered Search Term Analysis:** Uses Google Gemini AI to categorize search terms into wastage and review groups based on conversions.
- **1.4 Formatting and Reporting:** Transforms AI output into a Slack message with structured blocks and interactive approval buttons.
- **1.5 Notification Delivery:** Sends the formatted report to a specified Slack channel.

---

### 2. Block-by-Block Analysis

#### 2.1 Trigger and Data Fetching

**Overview:**  
Starts the workflow manually and fetches enabled Google Ads campaigns filtered by a specific brand campaign name. Then obtains detailed search term performance data for the past 14 days via Google Ads API.

**Nodes Involved:**  
- When clicking ‘Test workflow’  
- Getting Google Campaigns  
- Filtering Only for 'Enabled' Campaigns  
- Filtering For A Specific Search Google Campaign  
- Extracting Search Terms In The Past 14 Days  
- Split Out HTTP Request Into Individual Items  

**Node Details:**

- **When clicking ‘Test workflow’**  
  - *Type:* Manual Trigger  
  - *Role:* Starts the workflow on user command.  
  - *Config:* Default; no parameters.  
  - *Connections:* Outputs to "Getting Google Campaigns".  
  - *Failures:* None expected; manual start.

- **Getting Google Campaigns**  
  - *Type:* Google Ads node  
  - *Role:* Retrieves Google Ads campaigns from a specified Manager and Client Customer ID.  
  - *Config:*  
    - Manager Customer ID and Client Customer ID must be set by user.  
    - Date range last 7 days (default).  
  - *Connections:* Outputs to "Filtering Only for 'Enabled' Campaigns".  
  - *Failures:* Authentication errors, API quota limits, or invalid customer IDs.

- **Filtering Only for 'Enabled' Campaigns**  
  - *Type:* Filter node  
  - *Role:* Passes only campaigns with status "ENABLED".  
  - *Config:* Filter condition: `$json.status === "ENABLED"`.  
  - *Connections:* Outputs to "Filtering For A Specific Search Google Campaign".  
  - *Failures:* Expression errors if input data lacks status field.

- **Filtering For A Specific Search Google Campaign**  
  - *Type:* If node  
  - *Role:* Filters campaigns by name containing specified brand campaign name and the word "search".  
  - *Config:*  
    - Condition: campaign name contains user-entered brand campaign name AND "search" (case sensitive).  
  - *Connections:* True output to "Extracting Search Terms In The Past 14 Days". False output is unused.  
  - *Failures:* Expression errors if name field missing.

- **Extracting Search Terms In The Past 14 Days**  
  - *Type:* HTTP Request  
  - *Role:* Queries Google Ads API with a custom GAQL query for search term metrics in the last 14 days for the selected campaign.  
  - *Config:*  
    - URL includes user’s Google Ads Account ID.  
    - Headers require Developer Token and MCC Account ID.  
    - Authentication uses Google Ads OAuth2 credentials.  
    - POST method with GAQL query in body selecting search terms with clicks > 1, ordered by clicks, limited to 1000 records.  
  - *Connections:* Outputs raw API response to "Split Out HTTP Request Into Individual Items".  
  - *Failures:* API errors, authentication failures, quota limits, malformed queries.

- **Split Out HTTP Request Into Individual Items**  
  - *Type:* Split Out  
  - *Role:* Splits the array of results from the API call into individual items for further processing.  
  - *Config:* Field to split out: "results".  
  - *Connections:* Outputs each item to "Consolidating Search Terms Data (Removing Dates)".  
  - *Failures:* Empty or malformed results field.

---

#### 2.2 Data Cleaning and Aggregation

**Overview:**  
Cleans raw nested API data to a flat usable structure, removes brand-related and excluded terms, aggregates metrics by unique search term + campaign + ad group.

**Nodes Involved:**  
- Consolidating Search Terms Data (Removing Dates)  
- Removing Brand Terms + EXCLUDED Terms  
- Aggregating Performance Metrics  
- Aggregating Items To Prepare For LLM To Analyze  

**Node Details:**

- **Consolidating Search Terms Data (Removing Dates)**  
  - *Type:* Code node (JavaScript)  
  - *Role:* Parses nested API JSON to extract and normalize fields such as campaign name/ID, ad group name/ID, clicks, impressions, conversions, cost (converted from micros to USD), search term and status, and calculates CTR and CPC metrics.  
  - *Config:* Custom JS code loops over all incoming items, constructs cleaned objects.  
  - *Connections:* Outputs cleaned data to "Removing Brand Terms + EXCLUDED Terms".  
  - *Failures:* JS errors if input structure varies. Missing fields handled with defaults.

- **Removing Brand Terms + EXCLUDED Terms**  
  - *Type:* Filter node  
  - *Role:* Excludes search terms containing the user’s brand term and those with status "EXCLUDED".  
  - *Config:*  
    - Condition: searchTerm does not contain user brand term (case sensitive).  
    - Condition: status not equals "EXCLUDED".  
  - *Connections:* Outputs filtered data to "Aggregating Performance Metrics".  
  - *Failures:* Expression errors if fields missing.

- **Aggregating Performance Metrics**  
  - *Type:* Code node (JavaScript)  
  - *Role:* Aggregates metrics by unique composite key (searchTerm + campaignId + adGroupId), summing clicks, impressions, cost, conversions, etc.  
  - *Config:* Custom JS combining items into aggregated objects.  
  - *Connections:* Outputs aggregated items to "Aggregating Items To Prepare For LLM To Analyze".  
  - *Failures:* JS errors on malformed input.

- **Aggregating Items To Prepare For LLM To Analyze**  
  - *Type:* Aggregate node  
  - *Role:* Aggregates all incoming items into a single JSON array to prepare for AI input.  
  - *Config:* Aggregates all item data into one object.  
  - *Connections:* Outputs a single item with aggregated data to "Brand Info Node".  
  - *Failures:* Empty input results in empty array.

---

#### 2.3 AI-Powered Search Term Analysis

**Overview:**  
Prepares context and data for AI analysis, uses Google Gemini chat model to analyze search terms, then parses the AI response into a structured JSON report.

**Nodes Involved:**  
- Brand Info Node  
- Search Terms Checker  
- Google Gemini Chat Model1  
- Structured Output Parser  

**Node Details:**

- **Brand Info Node**  
  - *Type:* Set node  
  - *Role:* Adds user-defined brand info text and attaches the aggregated search term data array under `data` field for AI context.  
  - *Config:*  
    - Assigns `brand_info` string (user input) and `data` array (aggregated search terms).  
  - *Connections:* Outputs to "Search Terms Checker".  
  - *Failures:* Misconfiguration of brand_info reduces AI context quality.

- **Search Terms Checker**  
  - *Type:* LangChain Chain LLM  
  - *Role:* Sends the search terms and brand info to the AI prompt, instructing it to analyze and categorize non-brand keywords into wastage (0 conversions) and for review (>=1 conversions), and to output a strict JSON report.  
  - *Config:*  
    - Prompt includes detailed instructions, example output JSON schema, and current time in Asia/Singapore timezone.  
    - Uses `text` input from `$json.data`.  
  - *Connections:* Outputs AI response to "Transforming It It To Be Ready For Slack Block".  
  - *Failures:* AI model errors, prompt parsing errors, unexpected AI outputs.

- **Google Gemini Chat Model1**  
  - *Type:* LangChain Google Gemini chat model  
  - *Role:* Provides the underlying AI language model integration for the chain.  
  - *Config:* Connected to LLM node; uses Google Gemini API credentials.  
  - *Connections:* Linked to "Search Terms Checker" as the AI model.  
  - *Failures:* Authentication or API usage errors.

- **Structured Output Parser**  
  - *Type:* LangChain Structured Output Parser  
  - *Role:* Parses AI's textual output into a structured JSON object following the strict output schema.  
  - *Config:* JSON schema example provided for validation.  
  - *Connections:* Connected as output parser for "Search Terms Checker".  
  - *Failures:* Parsing failures if AI output deviates from schema.

---

#### 2.4 Formatting and Reporting

**Overview:**  
Transforms AI-generated JSON report into Slack Block Kit message format and prepares interactive buttons for user approval to exclude negative keywords.

**Nodes Involved:**  
- Transforming It It To Be Ready For Slack Block  

**Node Details:**

- **Transforming It It To Be Ready For Slack Block**  
  - *Type:* Code node (JavaScript)  
  - *Role:* Converts the AI report JSON into a Slack message composed of multiple blocks: header, summary, wastage totals, recommended negative keywords, keywords for review, and interactive buttons for approval or rejection.  
  - *Config:*  
    - Builds Slack blocks array with sections, dividers, markdown text.  
    - Supports conditional rendering of sections based on presence of recommendations or keywords for review.  
    - Encodes the recommendations as a JSON string in the "Yes, exclude them" button's value for downstream workflows.  
  - *Connections:* Outputs Slack blocks to "Send a message".  
  - *Failures:* JS errors if input JSON malformed. Slack API message size limits.

---

#### 2.5 Notification Delivery

**Overview:**  
Sends the generated Slack message with AI insights to a specified Slack channel.

**Nodes Involved:**  
- Send a message  

**Node Details:**

- **Send a message**  
  - *Type:* Slack node  
  - *Role:* Posts the formatted Slack blocks message to the designated Slack channel.  
  - *Config:*  
    - Channel ID must be set by user.  
    - Message type: block.  
    - Message content from `blocksUi` JSON property.  
  - *Connections:* Terminal node.  
  - *Failures:* Authentication errors, invalid channel ID, API rate limits.

---

### 3. Summary Table

| Node Name                                   | Node Type                            | Functional Role                                     | Input Node(s)                            | Output Node(s)                         | Sticky Note                                                                                                  |
|---------------------------------------------|------------------------------------|----------------------------------------------------|----------------------------------------|---------------------------------------|--------------------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’                | Manual Trigger                     | Start workflow manually                            |                                        | Getting Google Campaigns               |                                                                                                              |
| Getting Google Campaigns                      | Google Ads                        | Fetch all campaigns for user account               | When clicking ‘Test workflow’           | Filtering Only for 'Enabled' Campaigns | **👇 STEP 1: GOOGLE ADS SETUP** Configure your Google Ads connection here. Action: enter Manager & Client IDs |
| Filtering Only for 'Enabled' Campaigns       | Filter                           | Keep only enabled campaigns                         | Getting Google Campaigns                | Filtering For A Specific Search Google Campaign |                                                                                                              |
| Filtering For A Specific Search Google Campaign | If                              | Filter campaigns by specific brand campaign name   | Filtering Only for 'Enabled' Campaigns | Extracting Search Terms In The Past 14 Days |                                                                                                              |
| Extracting Search Terms In The Past 14 Days  | HTTP Request                    | Query Google Ads API for search terms data          | Filtering For A Specific Search Google Campaign | Split Out HTTP Request Into Individual Items | **⚠️ STEP 2: ADVANCED API CALL** Update URL, Developer Token, MCC ID, and credentials                         |
| Split Out HTTP Request Into Individual Items | Split Out                      | Split API response array into individual items      | Extracting Search Terms In The Past 14 Days | Consolidating Search Terms Data (Removing Dates) |                                                                                                              |
| Consolidating Search Terms Data (Removing Dates) | Code                             | Clean and normalize raw API data                     | Split Out HTTP Request Into Individual Items | Removing Brand Terms + EXCLUDED Terms |                                                                                                              |
| Removing Brand Terms + EXCLUDED Terms        | Filter                           | Remove brand-related and excluded search terms      | Consolidating Search Terms Data (Removing Dates) | Aggregating Performance Metrics       | **🎯 STEP 3: DEFINE YOUR BRAND** Enter brand name to exclude from analysis                                   |
| Aggregating Performance Metrics              | Code                             | Aggregate metrics by search term + campaign + ad group | Removing Brand Terms + EXCLUDED Terms | Aggregating Items To Prepare For LLM To Analyze |                                                                                                              |
| Aggregating Items To Prepare For LLM To Analyze | Aggregate                       | Combine all items into one array for AI input       | Aggregating Performance Metrics        | Brand Info Node                       |                                                                                                              |
| Brand Info Node                              | Set                              | Add brand info context and attach search term data | Aggregating Items To Prepare For LLM To Analyze | Search Terms Checker                  |                                                                                                              |
| Search Terms Checker                         | LangChain Chain LLM               | Send data and context to AI for search term analysis | Brand Info Node                       | Transforming It It To Be Ready For Slack Block |                                                                                                              |
| Google Gemini Chat Model1                    | LangChain Google Gemini Chat Model | AI language model interface                         | Connected to Search Terms Checker       | Search Terms Checker                  | **🚀 STEP 4: CONFIGURE OUTPUT** Connect Google Gemini credentials and Slack channel                         |
| Structured Output Parser                     | LangChain Structured Output Parser | Parse AI output into structured JSON                | Connected as output parser to Search Terms Checker | Search Terms Checker                  |                                                                                                              |
| Transforming It It To Be Ready For Slack Block | Code                            | Convert AI JSON report into Slack message blocks    | Search Terms Checker                    | Send a message                      |                                                                                                              |
| Send a message                              | Slack                            | Send Slack message with AI insights                  | Transforming It It To Be Ready For Slack Block |                                       |                                                                                                              |
| Sticky Note                                 | Sticky Note                      | Documentation and setup instructions                 |                                        |                                       | See content in section 5                                                                                        |
| Sticky Note1                                | Sticky Note                      | Google Ads setup instructions                         |                                        |                                       | **👇 STEP 1: GOOGLE ADS SETUP**                                                                                 |
| Sticky Note2                                | Sticky Note                      | API call configuration instructions                  |                                        |                                       | **⚠️ STEP 2: ADVANCED API CALL**                                                                                |
| Sticky Note3                                | Sticky Note                      | Brand exclusion and AI context instructions          |                                        |                                       | **🎯 STEP 3: DEFINE YOUR BRAND**                                                                                 |
| Sticky Note4                                | Sticky Note                      | AI and Slack configuration instructions              |                                        |                                       | **🚀 STEP 4: CONFIGURE OUTPUT**                                                                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - No special parameters.

2. **Create Google Ads Node "Getting Google Campaigns"**  
   - Use Google Ads credentials with OAuth2.  
   - Set "Manager Customer ID" to your manager account ID.  
   - Set "Client Customer ID" to your client account ID.  
   - Date range: LAST_7_DAYS.

3. **Create Filter Node "Filtering Only for 'Enabled' Campaigns"**  
   - Filter condition: `$json.status === "ENABLED"`.

4. **Create If Node "Filtering For A Specific Search Google Campaign"**  
   - Condition: campaign name contains your brand campaign name AND contains "search" (case sensitive).

5. **Create HTTP Request Node "Extracting Search Terms In The Past 14 Days"**  
   - Method: POST  
   - URL: `https://googleads.googleapis.com/v19/customers/(YOUR_GOOGLE_ADS_ACCOUNT_ID)/googleAds:search`  
   - Headers:  
     - developer-token: your developer token  
     - login-customer-id: your MCC account ID  
   - Authentication: Google Ads OAuth2 credentials  
   - Body: GAQL query selecting search term view fields filtered by campaign ID and last 14 days, clicks > 1.  
   - Output: raw JSON with `results` array.

6. **Create Split Out Node "Split Out HTTP Request Into Individual Items"**  
   - Field to split out: `results`.

7. **Create Code Node "Consolidating Search Terms Data (Removing Dates)"**  
   - JavaScript code to flatten nested API data, extract campaign, ad group, metrics, search term, status, date, and calculate CTR and CPC.

8. **Create Filter Node "Removing Brand Terms + EXCLUDED Terms"**  
   - Exclude search terms containing your brand term (case sensitive).  
   - Exclude search terms with status "EXCLUDED".

9. **Create Code Node "Aggregating Performance Metrics"**  
   - Aggregate metrics (clicks, impressions, cost, conversions) by unique key of searchTerm + campaignId + adGroupId.

10. **Create Aggregate Node "Aggregating Items To Prepare For LLM To Analyze"**  
    - Aggregate all items into a single JSON array.

11. **Create Set Node "Brand Info Node"**  
    - Assign two fields:  
      - `data`: set to aggregated search terms array from previous node.  
      - `brand_info`: set to a short string describing your brand (context for AI).

12. **Create LangChain Chain LLM Node "Search Terms Checker"**  
    - Prompt: Paste the detailed instructions and JSON output format specifying the identification and categorization of search terms for wastage and review.  
    - Input: `data` from "Brand Info Node".  
    - Attach output parser and language model nodes.

13. **Create LangChain Google Gemini Chat Model Node "Google Gemini Chat Model1"**  
    - Connect with your Google Gemini API credentials.

14. **Create LangChain Structured Output Parser Node "Structured Output Parser"**  
    - Provide strict JSON schema matching the expected AI response.

15. **Connect "Google Gemini Chat Model1" and "Structured Output Parser" to "Search Terms Checker"**  
    - Google Gemini as language model input.  
    - Output parser connected to parse AI output.

16. **Create Code Node "Transforming It It To Be Ready For Slack Block"**  
    - JavaScript code to convert AI JSON report into Slack Block Kit message with:  
      - Header, summary, total wastage, recommended negative keywords, keywords for review, and interactive buttons with JSON payload for downstream processing.

17. **Create Slack Node "Send a message"**  
    - Connect Slack credentials.  
    - Set channel ID to your desired Slack channel.  
    - Message Type: block.  
    - Message content: use `blocksUi` from previous node.

18. **Connect nodes in order according to dependencies above**.

19. **Create Sticky Notes** (optional) with setup instructions for user clarity.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                             | Context or Link                                                                                      |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| This workflow requires a Google Ads Developer Token for direct API calls.                                                                                                                                                                                               | Sticky Note, Advanced API Call instructions                                                       |
| The AI analysis uses Google Gemini via LangChain nodes; you must have appropriate API access configured.                                                                                                                                                                | Setup instructions in Sticky Note4                                                                |
| Slack message includes interactive buttons sending JSON payloads for downstream exclusion workflows (not included here).                                                                                                                                                 | In "Transforming It It To Be Ready For Slack Block" node comments                                 |
| Recommended to exclude brand-related search terms to reduce token usage and improve AI output quality.                                                                                                                                                                   | Sticky Note3                                                                                      |
| The workflow uses Asia/Singapore timezone for timestamping AI reports; adjust in prompt if needed.                                                                                                                                                                       | Found in prompt text in "Search Terms Checker" node                                              |
| For Google Ads API query, ensure your OAuth2 credentials have sufficient scopes and that developer token is approved for API access.                                                                                                                                     | Google Ads API documentation                                                                      |
| Slack API message size limits apply; large reports may need truncation or pagination handling.                                                                                                                                                                           | Slack API documentation                                                                           |

---

**Disclaimer:**  
The text provided is exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.