Analyze Facebook Ads & Send Insights to Google Sheets with Gemini AI

https://n8nworkflows.xyz/workflows/analyze-facebook-ads---send-insights-to-google-sheets-with-gemini-ai-10427


# Analyze Facebook Ads & Send Insights to Google Sheets with Gemini AI

---

### 1. Workflow Overview

This workflow automates the analysis of Facebook Ads performance data using AI and updates insights into Google Sheets. It is designed primarily for e-commerce businesses, digital marketing agencies, and Facebook Ads media buyers who want to leverage AI to optimize ad spend and campaign effectiveness.

The workflow consists of the following logical blocks:

- **1.1 Secure Token Management:** Retrieves and refreshes the Facebook long-term access token to ensure uninterrupted API access.
- **1.2 Fetch Facebook Ad Data:** Retrieves the last 28 days of Facebook Ads performance data at the ad level.
- **1.3 Data Processing & Cleaning:** Parses raw Facebook API data, extracts and aggregates key e-commerce metrics, and filters for sales campaigns.
- **1.4 Benchmark Calculation:** Aggregates all ad data to compute overall account benchmarks (e.g., average ROAS, cost per purchase).
- **1.5 AI-Powered Ad Creative Analysis:** Sends each ad's performance data and the overall benchmark to a Large Language Model (Google Gemini) for categorization and recommendations.
- **1.6 Output to Google Sheets:** Updates Google Sheets with raw ad data and AI-generated insights (performance category, justification, recommendation).

---

### 2. Block-by-Block Analysis

#### 1.1 Secure Token Management

- **Overview:**  
  This block manages Facebook API authentication by retrieving a stored long-term access token from NocoDB, checking if it needs refresh, and if so, requesting a new token and updating the storage.

- **Nodes Involved:**  
  - When clicking ‘Test workflow’ (Manual Trigger)  
  - Getting Long-Term Token (NocoDB)  
  - Does it Need A Token Refresh? (Code)  
  - Does Token Needs Refreshing? (If)  
  - Getting Long-Lived Access Token1 (HTTP Request)  
  - Calculating End Date of Token1 (Code)  
  - Updating Token (NocoDB)  
  - Getting Long-Term Token1 (Set)  
  - Extracting Long Term Token (Set)  
  - Extracting Access Token (Set)

- **Node Details:**

  - **When clicking ‘Test workflow’**  
    - Type: Manual Trigger  
    - Role: Entry point to manually start the workflow.

  - **Getting Long-Term Token**  
    - Type: NocoDB (Database Query)  
    - Role: Retrieve stored Facebook long-term access token and expiry details from a remote database.  
    - Config: Reads from a specific NocoDB table with API token authentication.  
    - Output: JSON containing token and expiry.

  - **Does it Need A Token Refresh?**  
    - Type: Code  
    - Role: Checks if the token expires within 3 days or is already expired.  
    - Logic: Compares current time and token end date, outputs `needs_refresh` boolean and diagnostic info.  
    - Edge cases: Missing or malformed date fields; assumes proper date format from NocoDB.

  - **Does Token Needs Refreshing?**  
    - Type: If node (conditional branching)  
    - Role: Branches workflow based on token refresh necessity.

  - **Getting Long-Lived Access Token1**  
    - Type: HTTP Request (POST)  
    - Role: Requests new long-lived Facebook token from Facebook Graph API.  
    - Config: Uses OAuth parameters (`client_id`, `client_secret`, `fb_exchange_token` from previous token).  
    - Edge cases: HTTP errors, invalid credentials, rate limits.

  - **Calculating End Date of Token1**  
    - Type: Code  
    - Role: Calculates the expiry date of the new token from response data.

  - **Updating Token**  
    - Type: NocoDB (Update)  
    - Role: Stores the new token and expiry date back in NocoDB.

  - **Getting Long-Term Token1**  
    - Type: Set  
    - Role: Assigns the long-term token string to a variable for downstream use.

  - **Extracting Long Term Token**  
    - Type: Set  
    - Role: Extracts the long-term token from updated token response.

  - **Extracting Access Token**  
    - Type: Set  
    - Role: Prepares the token for use in API authentication headers.

- **Potential Failures:**  
  - Database connectivity or permission errors in NocoDB nodes.  
  - Token expiry date missing or malformed.  
  - HTTP request failures or invalid Facebook app credentials.  
  - Token refresh loops if logic misfires.

---

#### 1.2 Fetch Facebook Ad Data

- **Overview:**  
  Uses the Facebook Graph API to fetch ad-level insights for the last 28 days, including metrics like spend, impressions, clicks, and purchase-related actions.

- **Nodes Involved:**  
  - Getting Long-Term Token1 (Set)  
  - Extracting Access Token (Set)  
  - Getting Data For the Past 28 Days Segmented Per Campaign Adset and Ad (HTTP Request)  
  - Splitting Out In Table Format (Code)

- **Node Details:**

  - **Getting Data For the Past 28 Days Segmented Per Campaign Adset and Ad**  
    - Type: HTTP Request (GET)  
    - Role: Calls Facebook Graph API `/act_{adAccountId}/insights` endpoint for ads data.  
    - Config: Queries fields such as campaign name, ad name, ad ID, spend, impressions, clicks, actions, and dates; uses Bearer token auth with the long-term access token.  
    - Edge cases: API rate limits, invalid token, malformed response, pagination limits.

  - **Splitting Out In Table Format**  
    - Type: Code  
    - Role: Parses the Facebook response JSON, extracts ad-level metrics, and normalizes e-commerce KPIs (add to carts, checkouts initiated, purchases, purchase values) with preferred action type order.  
    - Logic: Handles possible missing or nested action data gracefully, converts strings to numbers, and ensures uniform output structure.  
    - Edge cases: Missing fields, unexpected data formats, empty data arrays.

---

#### 1.3 Data Processing & Cleaning

- **Overview:**  
  Filters to sales campaigns only and aggregates raw ad data by ad creative to calculate summary KPIs.

- **Nodes Involved:**  
  - Filtering Only For Sales Campaigns (Filter)  
  - Aggregate Metrics by Ad Creative (Code)

- **Node Details:**

  - **Filtering Only For Sales Campaigns**  
    - Type: Filter  
    - Role: Filters incoming ad data to only include campaigns where `objective` equals `OUTCOME_SALES`.  
    - Edge cases: Case sensitivity, missing `objective` fields.

  - **Aggregate Metrics by Ad Creative**  
    - Type: Code  
    - Role: Aggregates ad data by `ad_name`, summing spends, impressions, clicks, purchases, and purchase values; calculates derived metrics like CTR, CPC, CPM, cost per purchase, ROAS, conversion rate, average order value; formats numbers for readability.  
    - Notes: Stores `ad_id` from first encountered item per ad name to maintain identity.  
    - Edge cases: Division by zero, missing or zero values, inconsistent data.

---

#### 1.4 Benchmark Calculation

- **Overview:**  
  Computes overall account-wide benchmarks from the aggregated ad data for comparison in AI analysis.

- **Nodes Involved:**  
  - Calculate Account Benchmarks (Code)  
  - Stringify Benchmark Data (Code)

- **Node Details:**

  - **Calculate Account Benchmarks**  
    - Type: Code  
    - Role: Sums all ad data metrics, calculates account-level KPIs such as overall CTR, CPC, CPM, cost per purchase, ROAS, conversion rate, and average order value; determines date ranges.  
    - Edge cases: Empty input, zero totals, date parsing issues.

  - **Stringify Benchmark Data**  
    - Type: Code  
    - Role: Converts the single benchmark object into a JSON string to send to the AI node.  
    - Notes: Pretty-prints JSON for readability; can be adjusted for compactness.

---

#### 1.5 AI-Powered Ad Creative Analysis

- **Overview:**  
  Combines individual ad creative data and benchmark data, sends them to a Google Gemini AI model to analyze and categorize ad performance, then parses the structured AI output.

- **Nodes Involved:**  
  - Stringify Everything (Code)  
  - Combining Ad Data and Benchmarking Data (Merge)  
  - Combine Ad & Benchmark Data for LLM (Aggregate)  
  - Senior Facebook Ads Media Buyer (LangChain Chain LLM)  
  - Google Gemini Chat Model (LangChain LM Chat Google Gemini)  
  - Structured Output Parser (LangChain Output Parser Structured)  
  - Split Out (SplitOut)

- **Node Details:**

  - **Stringify Everything**  
    - Type: Code  
    - Role: Converts aggregated ad creative data array into a JSON string for AI input.

  - **Combining Ad Data and Benchmarking Data**  
    - Type: Merge  
    - Role: Merges stringified ad data and benchmark data into a single data structure.

  - **Combine Ad & Benchmark Data for LLM**  
    - Type: Aggregate  
    - Role: Aggregates merged data into a single item for the AI prompt.

  - **Senior Facebook Ads Media Buyer**  
    - Type: LangChain Chain LLM  
    - Role: Defines the AI prompt with detailed instructions to act as a senior media buyer; evaluates each ad creative against benchmarks; categorizes into performance buckets with justifications and recommendations.  
    - Input: JSON strings of ad data and benchmarks.  
    - Output: Structured JSON with ad insights.

  - **Google Gemini Chat Model**  
    - Type: LangChain LM Chat Google Gemini  
    - Role: Executes the AI prompt using Google Gemini 2.5 Pro Preview model.

  - **Structured Output Parser**  
    - Type: LangChain Output Parser Structured  
    - Role: Parses the AI response into structured JSON objects consistent with the expected schema.

  - **Split Out**  
    - Type: SplitOut  
    - Role: Splits the array of AI-analyzed ad insights into individual output items for further processing.

- **Potential Failures:**  
  - AI model latency or quota issues.  
  - Parsing errors if AI output deviates from schema.  
  - Data size limits in prompt.  
  - Merge or aggregation node misconfiguration.

---

#### 1.6 Output to Google Sheets

- **Overview:**  
  Updates Google Sheets with raw ad performance data and AI-generated insights, matching rows by ad ID.

- **Nodes Involved:**  
  - Sending Raw Data To A Google Sheet (Google Sheets Append/Update)  
  - Sorting Based on Spends (Sort)  
  - Updating Ad Insights Into Google Sheets (Google Sheets Update)

- **Node Details:**

  - **Sending Raw Data To A Google Sheet**  
    - Type: Google Sheets  
    - Role: Appends or updates raw ad performance data into a specified Google Sheet tab.  
    - Config: Requires Google Sheets OAuth2 credentials and spreadsheet Document ID.  
    - Edge cases: API limits, invalid spreadsheet ID, credential expiration.

  - **Sorting Based on Spends**  
    - Type: Sort  
    - Role: Sorts aggregated ad data descending by total spend before sending to Google Sheets and AI.

  - **Updating Ad Insights Into Google Sheets**  
    - Type: Google Sheets  
    - Role: Updates existing Google Sheet rows with AI insights (performance category, justification, recommendation) matched by `ad_id`.  
    - Config: Requires matching columns configuration and spreadsheet Document ID.  
    - Edge cases: Matching failures if ad IDs differ, API rate limits.

---

### 3. Summary Table

| Node Name                                         | Node Type                               | Functional Role                                    | Input Node(s)                                | Output Node(s)                                         | Sticky Note                                                                                                                         |
|--------------------------------------------------|---------------------------------------|---------------------------------------------------|---------------------------------------------|-------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’                     | Manual Trigger                        | Entry point to start workflow                      |                                             | Getting Long-Term Token                                |                                                                                                                                     |
| Getting Long-Term Token                           | NocoDB                               | Retrieve stored Facebook long-term token          | When clicking ‘Test workflow’                | Does it Need A Token Refresh?                          | ### Step 1: Securely Manage Your Facebook API Token - Configure NocoDB or replace with preferred credential management              |
| Does it Need A Token Refresh?                     | Code                                 | Check if token needs refresh                        | Getting Long-Term Token                      | Does Token Needs Refreshing?                           |                                                                                                                                     |
| Does Token Needs Refreshing?                      | If                                   | Conditional branch on token refresh necessity      | Does it Need A Token Refresh?                | Getting Long-Lived Access Token1, Getting Long-Term Token1 |                                                                                                                                     |
| Getting Long-Lived Access Token1                  | HTTP Request                        | Request new Facebook long-lived access token       | Does Token Needs Refreshing?                  | Calculating End Date of Token1                         |                                                                                                                                     |
| Calculating End Date of Token1                     | Code                                 | Calculate token expiry date from response          | Getting Long-Lived Access Token1             | Updating Token                                         |                                                                                                                                     |
| Updating Token                                    | NocoDB                               | Update token and expiry in database                 | Calculating End Date of Token1                | Getting Long-Term Token1                               |                                                                                                                                     |
| Getting Long-Term Token1                           | Set                                  | Assign long-term token for downstream use          | Updating Token                               | Extracting Access Token                               |                                                                                                                                     |
| Extracting Long Term Token                         | Set                                  | Extract token string                                | Getting Long-Term Token1                      | Extracting Access Token                               |                                                                                                                                     |
| Extracting Access Token                            | Set                                  | Prepare token for API authentication                | Extracting Long Term Token                    | Getting Data For the Past 28 Days Segmented Per Campaign Adset and Ad |                                                                                                                                     |
| Getting Data For the Past 28 Days Segmented Per Campaign Adset and Ad | HTTP Request                        | Fetch Facebook Ads insights for last 28 days       | Extracting Access Token                      | Splitting Out In Table Format                         | ### Step 2: Fetch Facebook Ad Data - Replace `act_XXXXXX` with your Facebook Ad Account ID                                          |
| Splitting Out In Table Format                      | Code                                 | Parse and normalize Facebook API response data     | Getting Data For the Past 28 Days...          | Filtering Only For Sales Campaigns                     | ### Step 3: Calculate Ad & Benchmark KPIs - Split for individual and overall account calculations                                    |
| Filtering Only For Sales Campaigns                 | Filter                               | Keep only sales campaign ads                         | Splitting Out In Table Format                 | Aggregate Metrics by Ad Creative, Calculate Account Benchmarks |                                                                                                                                     |
| Aggregate Metrics by Ad Creative                   | Code                                 | Aggregate ad data by creative, calculate KPIs      | Filtering Only For Sales Campaigns            | Sorting Based on Spends                               |                                                                                                                                     |
| Sorting Based on Spends                            | Sort                                 | Sort aggregated ad data descending by spend         | Aggregate Metrics by Ad Creative             | Sending Raw Data To A Google Sheet, Stringify Everything |                                                                                                                                     |
| Sending Raw Data To A Google Sheet                 | Google Sheets                        | Append/update raw ad data in Google Sheet           | Sorting Based on Spends                       | Stringify Everything                                  | ### Step 3a: Log Processed Data to Google Sheets - Configure Google Sheets credentials and document ID                             |
| Stringify Everything                               | Code                                 | Convert aggregated ad data array to JSON string     | Sending Raw Data To A Google Sheet            | Combining Ad Data and Benchmarking Data               | ### Step 4: Prepare Data for AI Analysis - Merge ad data and benchmarks into AI prompt                                              |
| Calculate Account Benchmarks                        | Code                                 | Calculate overall account-wide benchmark KPIs       | Filtering Only For Sales Campaigns            | Stringify Benchmark Data                              |                                                                                                                                     |
| Stringify Benchmark Data                           | Code                                 | Convert benchmark object to JSON string              | Calculate Account Benchmarks                   | Combining Ad Data and Benchmarking Data               |                                                                                                                                     |
| Combining Ad Data and Benchmarking Data            | Merge                                | Merge ad data string and benchmark string            | Stringify Everything, Stringify Benchmark Data | Combine Ad & Benchmark Data for LLM                    |                                                                                                                                     |
| Combine Ad & Benchmark Data for LLM                | Aggregate                           | Aggregate merged data into single item for AI prompt | Combining Ad Data and Benchmarking Data       | Senior Facebook Ads Media Buyer                        |                                                                                                                                     |
| Senior Facebook Ads Media Buyer                     | LangChain Chain LLM                 | AI prompt to analyze and categorize ads              | Combine Ad & Benchmark Data for LLM           | Split Out                                           | ### Step 5: AI-Powered Ad Creative Analysis - Configure Google Gemini credentials                                                   |
| Google Gemini Chat Model                           | LangChain LM Chat Google Gemini     | Executes AI prompt with Google Gemini model          | Senior Facebook Ads Media Buyer (ai_languageModel) | Structured Output Parser                              |                                                                                                                                     |
| Structured Output Parser                           | LangChain Output Parser Structured  | Parse AI JSON output into structured objects          | Google Gemini Chat Model (ai_outputParser)    | Split Out                                           |                                                                                                                                     |
| Split Out                                         | SplitOut                            | Split array of AI insights into individual outputs     | Structured Output Parser                       | Updating Ad Insights Into Google Sheets                |                                                                                                                                     |
| Updating Ad Insights Into Google Sheets             | Google Sheets                      | Update Google Sheet rows with AI insights by ad_id    | Split Out                                   |                                                       | ### Step 6: Update Google Sheets with AI Insights - Configure Google Sheet ID for updates                                           |
| Sticky Note1, Sticky Note2, Sticky Note3, Sticky Note4, Sticky Note5, Sticky Note6, Sticky Note7 | Sticky Note | Instructional notes covering setup and purpose of workflow steps | Various                                      |                                                       | See individual notes in node descriptions above for context and links                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger Node:**  
   - Name: `When clicking ‘Test workflow’`  
   - Purpose: Entry point to manually start the workflow.

2. **Set up NocoDB Nodes for Token Management:**  
   - Create a **NocoDB node** named `Getting Long-Term Token` configured to query your token table, authenticated with your NocoDB API token credentials.  
   - Add a **Code node** named `Does it Need A Token Refresh?` that checks if the token expires within 3 days, using the provided JS logic.  
   - Add an **If node** `Does Token Needs Refreshing?` to branch based on the boolean.  
   - On true branch, add an **HTTP Request node** `Getting Long-Lived Access Token1` to POST to Facebook Graph API to refresh the token. Configure with your Facebook app `client_id` and `client_secret`.  
   - Add a **Code node** `Calculating End Date of Token1` to compute token expiry from response.  
   - Add a **NocoDB node** `Updating Token` to update your token record.  
   - Add **Set nodes** `Getting Long-Term Token1`, `Extracting Long Term Token`, and `Extracting Access Token` to prepare token values for use.

3. **Fetch Facebook Ad Data:**  
   - Create an **HTTP Request node** `Getting Data For the Past 28 Days Segmented Per Campaign Adset and Ad`.  
   - Configure URL to `https://graph.facebook.com/v22.0/act_XXXXXX/insights` with your Facebook Ad Account ID replacing `XXXXXX`.  
   - Query parameters: level=ad, fields including campaign_name, ad_name, ad_id, spend, clicks, actions, date_start, date_stop, etc., date_preset=last_28d, limit=500.  
   - Set Authorization header to Bearer token with extracted access token.

4. **Parse and Normalize Data:**  
   - Add a **Code node** `Splitting Out In Table Format` with the provided JS code to extract and format ad metrics, including preferred action types for e-commerce KPIs.

5. **Filter for Sales Campaigns:**  
   - Add a **Filter node** `Filtering Only For Sales Campaigns` to keep only items where objective equals `OUTCOME_SALES`.

6. **Aggregate Metrics by Ad Creative:**  
   - Add a **Code node** `Aggregate Metrics by Ad Creative` to sum and calculate KPIs per ad creative, using the provided aggregation code.

7. **Calculate Account-Wide Benchmarks:**  
   - Add a **Code node** `Calculate Account Benchmarks` to compute overall KPIs for the account.  
   - Add a **Code node** `Stringify Benchmark Data` to convert benchmark data to JSON string.

8. **Sort Aggregated Data:**  
   - Add a **Sort node** `Sorting Based on Spends` to sort aggregated ads by descending spend.

9. **Send Raw Data to Google Sheets:**  
   - Add a **Google Sheets node** `Sending Raw Data To A Google Sheet` configured with your Google Sheets OAuth2 credentials and the target spreadsheet ID and sheet name.  
   - Set operation to append or update.

10. **Prepare AI Input:**  
    - Add a **Code node** `Stringify Everything` to convert aggregated ad data to JSON string.  
    - Add a **Merge node** `Combining Ad Data and Benchmarking Data` to merge ad data string and benchmark string.  
    - Add an **Aggregate node** `Combine Ad & Benchmark Data for LLM` to aggregate merged data into a single item.

11. **Configure AI Analysis:**  
    - Add a **LangChain Chain LLM node** `Senior Facebook Ads Media Buyer` with the detailed prompt defining the AI role, input format, and categorization rules.  
    - Add a **LangChain LM Chat Google Gemini node** `Google Gemini Chat Model`, linked as a child AI model node with your Google PaLM API credentials.  
    - Add a **Structured Output Parser node** `Structured Output Parser` with JSON schema example for validating AI output.  
    - Add a **SplitOut node** `Split Out` to split the array of AI insights into individual items.

12. **Update AI Insights to Google Sheets:**  
    - Add a **Google Sheets node** `Updating Ad Insights Into Google Sheets` configured to update rows by matching `ad_id`. Map columns for justification, recommendation, and performance category accordingly.

13. **Connect all nodes following the dependency order described**, ensuring credentials are configured for NocoDB, Google Sheets, and Google Gemini API.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                         | Context or Link                                                                                 |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| This workflow is designed to optimize e-commerce Facebook Ads performance using AI, providing actionable categorization and recommendations.                                                                                                                                                                                                                      | Project overview in Sticky Note at workflow start                                             |
| Replace the placeholder Facebook Ad Account ID `act_XXXXXX` in the Facebook API URL with your actual account ID to ensure data retrieval.                                                                                                                                                                                                                            | Sticky Note4                                                                                   |
| Replace the Google Sheets Document ID fields marked as `XXXX` or `XXXXXX` with the ID of your Google Sheet where raw data and insights should be stored.                                                                                                                                                                                                            | Sticky Note2 and Sticky Note3                                                                 |
| Google Gemini credentials must be configured properly in the `Google Gemini Chat Model` node for AI analysis to work.                                                                                                                                                                                                                                               | Sticky Note5                                                                                   |
| The token refresh logic depends on NocoDB for token storage. You may replace this with any secure credential store or database as preferred.                                                                                                                                                                                                                       | Sticky Note1                                                                                   |
| The AI prompt includes detailed spend thresholds and performance categorization rules to ensure consistent and actionable output. Ensure these rules align with your business context if modifying the prompt.                                                                                                                                                       | Prompt text in `Senior Facebook Ads Media Buyer` node                                        |
| Google Sheets nodes are configured to update rows by matching the unique `ad_id` field to prevent data duplication. Ensure your sheet has this column properly indexed.                                                                                                                                                                                             | Sticky Note3                                                                                   |
| For detailed Facebook Ads API fields and action types, refer to Facebook's official documentation: https://developers.facebook.com/docs/marketing-api/insights/                                                                                                                                                                                                     | External reference (not embedded in the workflow but recommended for troubleshooting)         |
| To avoid API rate limits, consider scheduling this workflow at appropriate intervals rather than running it excessively.                                                                                                                                                                                                                                           | General best practice note                                                                     |

---

**Disclaimer:**  
The text provided is solely derived from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects current content policies and contains no illegal, offensive, or protected material. All data handled is legal and public.

---