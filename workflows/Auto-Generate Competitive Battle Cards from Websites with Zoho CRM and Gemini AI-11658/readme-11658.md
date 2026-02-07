Auto-Generate Competitive Battle Cards from Websites with Zoho CRM and Gemini AI

https://n8nworkflows.xyz/workflows/auto-generate-competitive-battle-cards-from-websites-with-zoho-crm-and-gemini-ai-11658


# Auto-Generate Competitive Battle Cards from Websites with Zoho CRM and Gemini AI

### 1. Workflow Overview

This workflow automates the creation of competitive battle cards within Zoho CRM by leveraging AI analysis of competitor websites. It is designed for sales and competitive intelligence teams to get structured, timely insights on newly created deals featuring competitor information.

The workflow operates on a scheduled trigger (every 5 minutes) and processes only deals newly created since the last run. It extracts competitor names and URLs from deal descriptions, scrapes competitor websites, and uses Google’s Gemini AI to analyze the HTML content. The AI output is parsed into structured battle cards summarizing pricing, features, pros, cons, and a battle summary. These insights are written back into the Zoho CRM deal description and a notification email is sent to the sales team.

The workflow logic is grouped into the following functional blocks:

- **1.1 Deal Fetching & Timestamp Generation:** Scheduled trigger, fetch all deals, generate timestamp for filtering new deals.
- **1.2 Filtering New Deals:** Combine data, filter deals created after last check, split into individual deal items.
- **1.3 Deal Eligibility Check:** Verify deals contain description with competitor info.
- **1.4 Competitor Info Extraction:** Extract competitor name and URL from deal description.
- **1.5 Website Scraping:** Fetch competitor website HTML content.
- **1.6 AI Battle Card Generation:** Use Gemini AI to analyze HTML and generate structured battle card.
- **1.7 Update Zoho & Notify Sales:** Update deal description with battle card info and send summary email notification.

---

### 2. Block-by-Block Analysis

#### 1.1 Deal Fetching & Timestamp Generation

- **Overview:**  
  Triggers every 5 minutes, fetches all deals from Zoho CRM, and generates a timestamp for filtering only new deals created since the last workflow run.

- **Nodes Involved:**  
  - Cron (every 5 min)  
  - Get Last Check (Code Node)  
  - Get many deals  
  - Merge

- **Node Details:**

  - **Cron (every 5 min)**  
    - Type: Trigger  
    - Configuration: Runs every 5 minutes  
    - Input/Output: No input, outputs trigger event  
    - Failure types: Workflow not triggered if n8n instance down

  - **Get Last Check (Code Node)**  
    - Type: Code  
    - Configuration: Computes timestamp 10 minutes prior to current time with timezone offset +05:30  
    - Key variables: `lastCheck` (ISO timestamp string)  
    - Input: Trigger  
    - Output: `{ lastCheck: string }`  
    - Edge cases: Timezone handling, daylight saving time considerations

  - **Get many deals**  
    - Type: Zoho CRM node, resource: deal, operation: getAll  
    - Configuration: Retrieves all deals sorted descending by Created_Time, returns all results  
    - Inputs: Trigger from Cron  
    - Outputs: Array of deals  
    - Failure types: API auth errors, rate limiting, network issues

  - **Merge**  
    - Type: Merge node  
    - Configuration: Combines input from Get Last Check and Get many deals by position  
    - Inputs: Two inputs (lastCheck and deals)  
    - Outputs: Single combined data array  
    - Edge cases: Missing lastCheck or deal data

---

#### 1.2 Filtering New Deals

- **Overview:**  
  Filters deals created strictly after the last recorded check timestamp and splits them into individual items for subsequent processing.

- **Nodes Involved:**  
  - Filter New Deals (Code Node)  
  - Split the deals

- **Node Details:**

  - **Filter New Deals**  
    - Type: Code  
    - Configuration: Filters deals by comparing `Created_Time` field against the lastCheck timestamp minus a 10-minute buffer  
    - Key expressions: Parses dates and filters deals newer than lastCheckUTC  
    - Inputs: Merged data (lastCheck + deals)  
    - Outputs: JSON with `newDeals` array  
    - Edge cases: Missing Created_Time field, invalid date formats, empty deals list

  - **Split the deals**  
    - Type: SplitOut  
    - Configuration: Splits `newDeals` array into individual items for processing  
    - Input: newDeals array  
    - Output: Individual deal items  
    - Edge cases: Empty input array

---

#### 1.3 Deal Eligibility Check

- **Overview:**  
  Ensures only deals with a non-empty Description field proceed for competitor extraction.

- **Nodes Involved:**  
  - IF Description Present

- **Node Details:**

  - **IF Description Present**  
    - Type: If  
    - Configuration: Checks if `newDeals.Description` is not empty  
    - Input: Single deals from Split the deals  
    - Output: Passes deals with non-empty Description, else stops  
    - Edge cases: Description field missing or empty string, case sensitivity handled strictly

---

#### 1.4 Competitor Info Extraction

- **Overview:**  
  Extracts competitor name and first URL found in the Description field for further processing.

- **Nodes Involved:**  
  - parse competitor info

- **Node Details:**

  - **parse competitor info**  
    - Type: Code  
    - Configuration: Uses regex to extract first URL and competitor name (assumed prefix in description)  
    - Key expressions:  
      - URL regex: `/https?:\/\/[^\s]+/`  
      - Name regex: `/^([\w\s\-&]+)/`  
    - Input: Deals with Description from IF node  
    - Output: Adds `competitorName` and `competitorUrl` to JSON  
    - Edge cases: No URL or name found, malformed Description text, regex failures

---

#### 1.5 Website Scraping

- **Overview:**  
  Fetches the HTML content of the competitor website URL extracted from the deal Description.

- **Nodes Involved:**  
  - HTTP Request

- **Node Details:**

  - **HTTP Request**  
    - Type: HTTP Request  
    - Configuration: GET request to `competitorUrl` with response format as text (HTML)  
    - Input: Output from parse competitor info  
    - Output: HTML content of competitor website  
    - Edge cases: Invalid or unreachable URL, HTTP errors (404, 500), timeouts, SSL issues

---

#### 1.6 AI Battle Card Generation

- **Overview:**  
  Uses Google Gemini AI to analyze the scraped HTML and generate a structured battle card describing competitor pricing, features, pros, cons, and a summary.

- **Nodes Involved:**  
  - Google Gemini Chat Model  
  - Structured Output Parser  
  - Basic LLM Chain

- **Node Details:**

  - **Google Gemini Chat Model**  
    - Type: AI Language Model (Google Gemini)  
    - Configuration: Default with configured Google Palm API credentials  
    - Input: HTML content from HTTP Request (passed via Basic LLM Chain)  
    - Output: Raw AI response (chat completion)  
    - Edge cases: API quota limits, authentication errors, model latency

  - **Structured Output Parser**  
    - Type: LangChain structured output parser  
    - Configuration: JSON schema example specifying competitor battle card fields (competitor, pricing_summary, key_features, pros, cons, battle_summary)  
    - Input: AI raw output  
    - Output: Parsed structured JSON data  
    - Edge cases: Parsing errors if AI output deviates from expected format

  - **Basic LLM Chain**  
    - Type: LangChain LLM chain node (combines prompt, model, and output parser)  
    - Configuration:  
      - Prompt explains task to analyze HTML and extract competitor insights  
      - Uses structured output parser  
      - Receives HTML content and competitorName as variables  
    - Input: HTML from HTTP Request, competitor info from parse competitor info  
    - Output: Structured battle card JSON  
    - Edge cases: Prompt failures, unexpected AI output, missing input data

---

#### 1.7 Update Zoho & Notify Sales

- **Overview:**  
  Updates the original Zoho deal’s Description with the generated battle card details and sends a notification email to the sales team summarizing the new competitive intelligence.

- **Nodes Involved:**  
  - Share Battle Card in description (Zoho CRM node)  
  - Notify Sales via Gmail

- **Node Details:**

  - **Share Battle Card in description**  
    - Type: Zoho CRM update node  
    - Configuration: Updates deal Description with formatted battle card data (pricing, features, pros, cons, summary) using expressions from LLM chain output  
    - Input: Structured battle card JSON from Basic LLM Chain  
    - Output: Updated deal record  
    - Credentials: Zoho OAuth2 API  
    - Edge cases: API rate limits, authentication failures, invalid deal ID

  - **Notify Sales via Gmail**  
    - Type: Gmail node (send email)  
    - Configuration: Sends notification email summarizing new battle card (competitor, pricing, features, summary)  
    - Email fields: Subject includes competitor name, body pulls from LLM chain output and deal name  
    - Credentials: Gmail OAuth2  
    - Input: Updated deal info from Share Battle Card node  
    - Edge cases: Email sending failures, invalid recipient address, auth errors

---

### 3. Summary Table

| Node Name                   | Node Type                           | Functional Role                      | Input Node(s)                  | Output Node(s)               | Sticky Note                                                                                                                        |
|-----------------------------|-----------------------------------|------------------------------------|-------------------------------|-----------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| Cron (every 5 min)           | Cron Trigger                      | Scheduled trigger every 5 minutes  | -                             | Get Last Check, Get many deals |                                                                                                                                    |
| Get Last Check (Code Node)   | Code Node                        | Generate timestamp for filtering   | Cron                          | Merge                       | Fetches timestamp 10 minutes back to identify new deals                                                                           |
| Get many deals               | Zoho CRM (getAll deals)           | Fetch all deals from Zoho CRM      | Cron                          | Merge                       | Fetches all deals and the last run timestamp, then combines them for filtering new records                                        |
| Merge                       | Merge Node                       | Combine lastCheck and deals data   | Get Last Check, Get many deals | Filter New Deals            |                                                                                                                                    |
| Filter New Deals             | Code Node                       | Filter deals created after last check | Merge                        | Split the deals             | Filters deals created after the previous run and splits them into individual items                                                |
| Split the deals             | SplitOut Node                   | Split newDeals array into items    | Filter New Deals              | IF Description Present      |                                                                                                                                    |
| IF Description Present       | If Node                        | Check deal has non-empty Description | Split the deals              | parse competitor info       | Only continues for deals that have description and contain potential competitor reference in that                                  |
| parse competitor info        | Code Node                      | Extract competitor name and URL   | IF Description Present        | HTTP Request                | Extracts competitor name and first URL from Description                                                                           |
| HTTP Request                | HTTP Request                   | Fetch competitor website HTML      | parse competitor info         | Basic LLM Chain             | Fetch competitor website for AI analysis                                                                                          |
| Google Gemini Chat Model     | AI Language Model (Google Gemini) | AI model for analyzing HTML       | Basic LLM Chain (ai_languageModel) | Basic LLM Chain (ai_outputParser) |                                                                                                                                    |
| Structured Output Parser     | Output Parser (LangChain)        | Parse AI output into structured JSON | Google Gemini Chat Model      | Basic LLM Chain             |                                                                                                                                    |
| Basic LLM Chain             | LLM Chain (LangChain)             | Generate structured battle card   | HTTP Request, Gemini AI output | Share Battle Card in description | Analyzes HTML and generates structured Battle Card (pricing/features/pros/cons/summary)                                            |
| Share Battle Card in description | Zoho CRM (update deal)            | Update Zoho deal description      | Basic LLM Chain              | Notify Sales via Gmail      | Generated Card sent back in desc and email: updates deal Description with generated intelligence                                  |
| Notify Sales via Gmail       | Gmail Node                      | Notify sales team via email       | Share Battle Card in description | -                          | Sends summary email containing competitor highlights and battle summary                                                           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Cron Node**  
   - Type: Cron  
   - Configure to trigger every 5 minutes.

2. **Create Code Node "Get Last Check"**  
   - Type: Code  
   - Paste JavaScript that computes timestamp 10 min before current time with +05:30 offset.  
   - Output: `{lastCheck: ISO timestamp}`  
   - Connect Cron node output to this node.

3. **Create Zoho CRM Node "Get many deals"**  
   - Resource: Deal  
   - Operation: Get All  
   - Options: Sort by Created_Time descending, return all.  
   - Connect Cron node output to this node.  
   - Configure Zoho OAuth2 credentials.

4. **Create Merge Node**  
   - Mode: Combine by position  
   - Connect outputs of "Get Last Check" and "Get many deals" nodes to inputs of Merge.

5. **Create Code Node "Filter New Deals"**  
   - Type: Code  
   - Paste JS to filter deals where Created_Time > lastCheck minus 10 minutes.  
   - Input: Merge node output.  
   - Output: `{ newDeals: [...] }`

6. **Create SplitOut Node "Split the deals"**  
   - Field to split out: `newDeals`  
   - Connect from "Filter New Deals".

7. **Create If Node "IF Description Present"**  
   - Condition: Check if `newDeals.Description` is not empty string.  
   - Connect from "Split the deals". Pass only deals with descriptions.

8. **Create Code Node "parse competitor info"**  
   - Type: Code  
   - Paste JS to extract competitor name and first URL from Description with regex.  
   - Connect from True output of IF node.

9. **Create HTTP Request Node**  
   - Method: GET  
   - URL: Use expression to get `competitorUrl` from previous node JSON.  
   - Response Format: Text (HTML)  
   - Connect from "parse competitor info".

10. **Create Google Gemini Chat Model Node**  
    - Configure Google Palm API credentials.  
    - Connect AI input from HTTP Request output.

11. **Create Structured Output Parser Node**  
    - Paste example JSON schema defining battle card structure.  
    - Connect AI output from Google Gemini Chat Model node.

12. **Create Basic LLM Chain Node**  
    - Prompt: Insert instructions to extract sales insights from HTML (competitor name, pricing, features, pros, cons, summary).  
    - Enable output parser, use Structured Output Parser node.  
    - Connect input from HTTP Request and AI output parser.  
    - Connect AI Language Model input from Google Gemini Chat Model.

13. **Create Zoho CRM Node "Share Battle Card in description"**  
    - Operation: Update Deal  
    - Deal ID: Use expression from `parse competitor info` node's deal ID.  
    - Update Description field with formatted battle card using expressions from Basic LLM Chain output (competitor, pricing_summary, key_features, pros, cons, battle_summary).  
    - Configure Zoho OAuth2 credentials.  
    - Connect from Basic LLM Chain node.

14. **Create Gmail Node "Notify Sales via Gmail"**  
    - Configure Gmail OAuth2 credentials.  
    - To: Sales team email addresses.  
    - Subject: Include competitor name from LLM output.  
    - Message: Summarize deal name, competitor, pricing, features, battle summary from LLM output.  
    - Connect from Zoho CRM update node.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                              | Context or Link                                                                                      |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| This workflow checks Zoho CRM every 5 minutes, fetches newly created deals, extracts competitor info, scrapes websites, uses Gemini AI for analysis, writes back battle cards, and notifies sales. | Sticky Note12                                                                                       |
| Add Zoho OAuth2, Gmail OAuth2, and Google Gemini/Palm API credentials before activating the workflow.                                                     | Sticky Note12                                                                                       |
| Ensure deals have competitor name and URL in Description; regex extraction assumes specific formatting.                                                  | Sticky Note12                                                                                       |
| Fetches all deals and last run timestamp, combines to identify new records only.                                                                           | Sticky Note13                                                                                       |
| Filters deals created after the previous run and splits them into individual items for processing.                                                       | Sticky Note14                                                                                       |
| Only continues for deals that have non-empty description.                                                                                                 | Sticky Note15                                                                                       |
| Extracts competitor name and URL from Description field using regex.                                                                                       | Sticky Note16                                                                                       |
| Fetch competitor website HTML for AI analysis.                                                                                                           | Sticky Note17                                                                                       |
| Uses AI to analyze HTML and generate structured battle card (pricing, features, pros, cons, summary).                                                     | Sticky Note18                                                                                       |
| Updates Zoho deal description with generated battle card and sends summary email to sales team.                                                          | Sticky Note19                                                                                       |

---

**Disclaimer:** The provided documentation is derived exclusively from an automated n8n workflow. It complies fully with content policies and contains no illegal, offensive, or protected material. All data processed is lawful and public.