Analyze and Summarize Google Reviews with SerpAPI, GPT-4 and Google Sheets

https://n8nworkflows.xyz/workflows/analyze-and-summarize-google-reviews-with-serpapi--gpt-4-and-google-sheets-6066


# Analyze and Summarize Google Reviews with SerpAPI, GPT-4 and Google Sheets

### 1. Workflow Overview

This workflow automates the process of extracting, analyzing, and summarizing Google Maps reviews for a list of restaurants using SerpAPI, GPT-4, and Google Sheets. It is designed for users who want to gain insights from multiple restaurant reviews quickly, such as digital marketers, restaurant managers, or competitive analysts.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Retrieve a predefined list of restaurants from Google Sheets to serve as input.
- **1.2 Data Retrieval from SerpAPI:** Query SerpAPI to fetch Google Maps data including user reviews for each restaurant.
- **1.3 Data Cleaning and Filtering:** Parse and clean the raw SerpAPI response to extract relevant review data; filter out reviews missing textual content.
- **1.4 AI Sentiment Analysis and Keyword Extraction:** Use GPT-4 to analyze review sentiment and extract key themes.
- **1.5 Data Export:** Save analyzed reviews and failed/skipped reviews separately back into Google Sheets.
- **1.6 Manual Trigger and User Guidance:** Provide a manual trigger to start the workflow and sticky notes for user instructions and context.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception  
**Overview:** This block fetches a list of restaurants from a Google Sheets document, which serves as the input for subsequent review extraction and analysis.

**Nodes Involved:**  
- Pull Sample Restaurants

**Node Details:**

- **Pull Sample Restaurants**  
  - Type: Google Sheets  
  - Role: Reads a specific sheet ("gid=0") from a Google Sheets document containing restaurant names.  
  - Configuration: Uses OAuth2 credentials for Google Sheets access; reads from a document with ID `1mJRBu96urKkUAUMz1chcipgKlqw6UhKcSLzF0xp_D6w`.  
  - Inputs: Triggered by the manual trigger node.  
  - Outputs: Passes restaurant names downstream for API querying.  
  - Edge Cases: Errors if sheet or document access is revoked; no input data leads to empty downstream operations.

---

#### 1.2 Data Retrieval from SerpAPI  
**Overview:** Using restaurant names from the previous block, this block fetches Google Maps data including reviews via SerpAPI.

**Nodes Involved:**  
- Get Data

**Node Details:**

- **Get Data**  
  - Type: HTTP Request  
  - Role: Calls SerpAPI’s Google Maps search endpoint to retrieve restaurant data based on the restaurant name.  
  - Configuration: HTTP GET with query parameters including `engine=google_maps`, `type=search`, `q` set dynamically to the restaurant name from the input, and `api_key` (SerpAPI key) supplied via credentials or parameter.  
  - Inputs: Receives restaurant name from Google Sheets node.  
  - Outputs: Raw JSON response containing `place_results` with reviews.  
  - Edge Cases: API rate limits, invalid API key, no results found for restaurant, network timeouts.  
  - Notes: Requires a valid SerpAPI account and API key setup.

---

#### 1.3 Data Cleaning and Filtering  
**Overview:** This block processes the raw SerpAPI response, extracts relevant review fields, and filters out reviews without textual content.

**Nodes Involved:**  
- Cleans It Up  
- If review text is NOT empty

**Node Details:**

- **Cleans It Up**  
  - Type: Code (JavaScript)  
  - Role: Parses API response to extract up to 10 most relevant user reviews per restaurant, extracting fields: restaurant name, review text, star rating, and posting date.  
  - Configuration: Custom JavaScript code that checks for `place_results`, handles missing or malformed data safely, and creates simplified JSON objects for each review.  
  - Inputs: Raw JSON from SerpAPI node.  
  - Outputs: Array of cleaned review objects.  
  - Edge Cases: Missing `place_results`, no `most_relevant` reviews, missing review fields. Logs missing data and skips those entries gracefully.

- **If review text is NOT empty**  
  - Type: If (Conditional)  
  - Role: Filters reviews based on presence of review text (`reviewText` field must not be empty).  
  - Configuration: Checks if `reviewText` is not empty string; true branch continues to sentiment analysis, false branch goes to failed reviews export.  
  - Inputs: Cleaned reviews from previous node.  
  - Outputs:  
    - True: Reviews with text → Sentiment and keyword analysis.  
    - False: Reviews without text → Logged separately as failed/skipped.  
  - Edge Cases: Empty or whitespace-only review texts; expression evaluation errors.

---

#### 1.4 AI Sentiment Analysis and Keyword Extraction  
**Overview:** This block sends each valid review to GPT-4 (via LangChain OpenAI node) to analyze sentiment and extract keywords, receiving structured JSON output.

**Nodes Involved:**  
- Analyze Review Sentiment

**Node Details:**

- **Analyze Review Sentiment**  
  - Type: LangChain OpenAI Node  
  - Role: Uses GPT-4-Turbo model to analyze review sentiment (positive, neutral, negative) and extract 3–5 keywords/themes, returning structured JSON.  
  - Configuration:  
    - Model: `gpt-4-turbo`  
    - Prompt: Template instructing the AI to analyze the review text for sentiment and keywords, referencing the restaurant name, returning only JSON with keys `sentiment`, `keywords`, and `restaraunt` (note spelling).  
    - Credentials: OpenAI API credentials required.  
  - Inputs: Reviews with non-empty texts.  
  - Outputs: AI analysis results per review.  
  - Edge Cases: API rate limits, malformed input causing AI errors, API downtime, network issues, potential JSON parsing errors from AI output.

---

#### 1.5 Data Export  
**Overview:** This block exports both successfully analyzed reviews and those skipped due to missing review text back into separate Google Sheets tabs.

**Nodes Involved:**  
- Export Data  
- Failed Reviews (e.g. review text = empty)

**Node Details:**

- **Export Data**  
  - Type: Google Sheets  
  - Role: Appends analyzed review data including restaurant, review text, star rating, and AI analysis results to a designated sheet tab.  
  - Configuration:  
    - Document: Same Google Sheets document as input.  
    - Sheet: Tab with ID `1346480145` (named as "table").  
    - Columns: Mapped from previous nodes, including stars, AI analysis JSON content, restaurant name, and review text.  
    - Credentials: Google Sheets OAuth2.  
  - Inputs: AI analyzed reviews.  
  - Outputs: None; appends data to sheet.  
  - Edge Cases: Sheet permission errors, row append failure, network issues.

- **Failed Reviews (e.g. review text = empty)**  
  - Type: Google Sheets  
  - Role: Logs reviews that were skipped due to empty review text, with placeholders for keywords and sentiment indicating skipped status.  
  - Configuration:  
    - Document: Same Google Sheets document.  
    - Sheet: Tab with ID `1253412439` (named as "skipped reviews").  
    - Columns: Stars, restaurant, review text, keywords and sentiment marked as "Skipped (no reviewText)".  
    - Credentials: Google Sheets OAuth2.  
  - Inputs: Reviews filtered out by the If node.  
  - Outputs: Appends data to the “skipped reviews” sheet.  
  - Edge Cases: Same as Export Data node.

---

#### 1.6 Manual Trigger and User Guidance  
**Overview:** This block allows manual initiation of the workflow and provides comprehensive inline documentation via sticky notes to guide users.

**Nodes Involved:**  
- When clicking ‘Test workflow’  
- Sticky Note1  
- Sticky Note  
- Sticky Note2  
- Sticky Note3  
- Sticky Note4  
- Sticky Note5

**Node Details:**

- **When clicking ‘Test workflow’**  
  - Type: Manual Trigger  
  - Role: Starts the workflow manually on user command.  
  - Inputs: None.  
  - Outputs: Initiates pulling sample restaurants from Google Sheets.  
  - Edge Cases: User must manually trigger; no automation schedule.

- **Sticky Notes (1 to 5)**  
  - Type: Sticky Note  
  - Role: Provide detailed explanations, instructions, screenshots, and context for end users.  
  - Content Highlights:  
    - Sticky Note1: Overview of workflow purpose and usage instructions with link to SerpAPI n8n documentation.  
    - Sticky Note: Explains step 1 (Scraping Google Maps Business Listings).  
    - Sticky Note2: Explains step 2 (Data cleaning and identifying gaps).  
    - Sticky Note3: Explains step 3 (Analysis and export).  
    - Sticky Note4: Screenshot of input Google Sheets sample.  
    - Sticky Note5: Screenshot of output Google Sheets.  
  - Inputs/Outputs: None (informational only).  
  - Edge Cases: None.

---

### 3. Summary Table

| Node Name                          | Node Type                      | Functional Role                                | Input Node(s)                | Output Node(s)                  | Sticky Note                                                                                                       |
|-----------------------------------|--------------------------------|------------------------------------------------|------------------------------|-------------------------------|------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’      | Manual Trigger                 | Manual start of the workflow                    | None                         | Pull Sample Restaurants        | See Sticky Note1 for detailed workflow overview and usage instructions.                                          |
| Pull Sample Restaurants            | Google Sheets                  | Reads list of restaurants from Google Sheets   | When clicking ‘Test workflow’ | Get Data                      | See Sticky Note4 for sample input screenshot.                                                                    |
| Get Data                          | HTTP Request                  | Calls SerpAPI to get Google Maps data           | Pull Sample Restaurants       | Cleans It Up                  | See Sticky Note for step 1 explanation.                                                                           |
| Cleans It Up                     | Code                          | Parses & cleans SerpAPI response, extracts reviews | Get Data                     | If review text is NOT empty   | See Sticky Note2 for data cleaning and filtering explanation.                                                   |
| If review text is NOT empty        | If                           | Filters reviews by presence of review text      | Cleans It Up                 | Analyze Review Sentiment (true), Failed Reviews (false) | See Sticky Note2 for filtering logic.                                                                            |
| Analyze Review Sentiment           | LangChain OpenAI              | Uses GPT-4 to analyze sentiment & keywords      | If review text is NOT empty (true) | Export Data                | See Sticky Note3 for analysis step.                                                                               |
| Export Data                      | Google Sheets                  | Appends analyzed reviews to Google Sheets       | Analyze Review Sentiment      | None                         | See Sticky Note5 for example output screenshot.                                                                  |
| Failed Reviews (e.g. review text = empty) | Google Sheets           | Logs skipped reviews with missing text          | If review text is NOT empty (false) | None                         | See Sticky Note2 for handling failed/empty reviews.                                                              |
| Sticky Note1                      | Sticky Note                   | Workflow overview and user instructions          | None                         | None                         | Contains detailed instructions, requirements, and helpful link: https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.toolserpapi/ |
| Sticky Note                      | Sticky Note                   | Explains step 1: Scraping via SerpAPI            | None                         | None                         | Explains data retrieval from Google Maps listings.                                                               |
| Sticky Note2                     | Sticky Note                   | Explains step 2: Data cleaning and filtering     | None                         | None                         | Explains review text filtering and gap identification.                                                           |
| Sticky Note3                     | Sticky Note                   | Explains step 3: AI analysis and export          | None                         | None                         | Explains AI review analysis and data export.                                                                      |
| Sticky Note4                      | Sticky Note                   | Shows sample input Google Sheets screenshot      | None                         | None                         | Visual example of input restaurant list.                                                                          |
| Sticky Note5                      | Sticky Note                   | Shows example output Google Sheets screenshot    | None                         | None                         | Visual example of analyzed reviews exported.                                                                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - Name: "When clicking ‘Test workflow’"  
   - Purpose: To manually start the workflow.

2. **Create Google Sheets Node to Pull Restaurant List**  
   - Type: Google Sheets  
   - Name: "Pull Sample Restaurants"  
   - Credentials: Configure with Google Sheets OAuth2 credentials.  
   - Parameters:  
     - Document ID: `1mJRBu96urKkUAUMz1chcipgKlqw6UhKcSLzF0xp_D6w` (replace with your own).  
     - Sheet Name or GID: `gid=0` (first tab).  
   - Connect output of Manual Trigger node to this node.

3. **Create HTTP Request Node to Call SerpAPI**  
   - Type: HTTP Request  
   - Name: "Get Data"  
   - Parameters:  
     - URL: `https://serpapi.com/search.json`  
     - Query Parameters:  
       - engine: `google_maps`  
       - type: `search`  
       - q: Expression using restaurant name from previous node, e.g., `={{ $json['Restaraunt Name'] }}` (adjust field name as per your sheet).  
       - api_key: Your SerpAPI API key (pass securely).  
     - HTTP Method: GET  
   - Connect output of Google Sheets node ("Pull Sample Restaurants") to this node.

4. **Create Code Node to Clean and Extract Reviews**  
   - Type: Code (JavaScript)  
   - Name: "Cleans It Up"  
   - JavaScript Code (adapted):  
     ```javascript
     return $input.all().flatMap(item => {
       const placeResults = item.json.place_results;
       if (!placeResults) return [];
       const restaurant = placeResults.title || "Unknown";
       const reviews = placeResults.user_reviews?.most_relevant;
       if (!Array.isArray(reviews)) return [];
       return reviews.slice(0, 10).map(review => ({
         json: {
           restaurant,
           reviewText: review.description || "",
           stars: review.rating || null,
           postedAt: review.date || ""
         }
       }));
     });
     ```
   - Connect output of "Get Data" node to this node.

5. **Create If Node to Filter Reviews with Text**  
   - Type: If  
   - Name: "If review text is NOT empty"  
   - Condition: Check if `reviewText` is not empty string (use expression `{{ $json.reviewText }}` with `string operation: notEmpty`).  
   - Connect output of "Cleans It Up" to this node.

6. **Create LangChain OpenAI Node to Analyze Sentiment and Extract Keywords**  
   - Type: LangChain OpenAI  
   - Name: "Analyze Review Sentiment"  
   - Credentials: Configure OpenAI API credentials.  
   - Model: `gpt-4-turbo`  
   - Messages: Use prompt template (as below):  
     ```
     Analyze the following restaurant review for the restaurant "{{ $json.restaurant }}".

     1. What is the sentiment (positive, neutral, or negative)?
     2. Extract 3–5 keywords or themes from the review.

     Review: {{ $json.reviewText }}
     Include Restaraunt: {{ $json.restaurant }}

     Respond only in JSON format like:
     {
       "sentiment": "...",
       "keywords": ["...", "...", "..."],
       "restaraunt": "..."
     }
     ```
   - Connect **TRUE** output of If node to this node.

7. **Create Google Sheets Node to Export Analyzed Reviews**  
   - Type: Google Sheets  
   - Name: "Export Data"  
   - Credentials: Google Sheets OAuth2.  
   - Parameters:  
     - Document ID: Same as input sheet or your own.  
     - Sheet Name or GID: Use a dedicated tab for analyzed reviews, e.g., `1346480145`.  
     - Operation: Append  
     - Columns Mapping:  
       - Stars: `={{ $('Cleans It Up').item.json.stars }}`  
       - Analysis: `={{ $json.message.content }}` (AI output)  
       - Restaraunt: `={{ $('Cleans It Up').item.json.restaurant }}`  
       - Review Text: `={{ $('Cleans It Up').item.json.reviewText }}`  
   - Connect output of "Analyze Review Sentiment" node here.

8. **Create Google Sheets Node to Log Failed Reviews (Empty Text)**  
   - Type: Google Sheets  
   - Name: "Failed Reviews (e.g. review text = empty)"  
   - Credentials: Google Sheets OAuth2.  
   - Parameters:  
     - Document ID: Same as above.  
     - Sheet Name or GID: Separate tab for skipped reviews, e.g., `1253412439`.  
     - Operation: Append  
     - Columns Mapping:  
       - Stars: `={{ $json.stars }}`  
       - Keywords: Static string "Skipped (no reviewText)"  
       - Sentiment: Static string "Skipped (no reviewText)"  
       - Restaraunt: `={{ $json.restaurant }}`  
       - Review Text: `={{ $json.reviewText }}`  
   - Connect **FALSE** output of If node here.

9. **Connect the Nodes According to the Following Flow:**  
   - Manual Trigger → Pull Sample Restaurants → Get Data → Cleans It Up → If review text is NOT empty → (True) Analyze Review Sentiment → Export Data  
   - If review text is NOT empty → (False) Failed Reviews (e.g. review text = empty)

10. **Add Sticky Notes for Documentation (Optional but Recommended):**  
    - Add sticky notes to explain each major step as per the original workflow content, including instructions, screenshots, and links to relevant docs.

11. **Credential Setup:**  
    - SerpAPI API key must be securely stored and referenced in HTTP Request node.  
    - OpenAI API key must be configured for LangChain OpenAI node.  
    - Google Sheets OAuth2 credentials must be set up and authorized for read/write access to the target sheets.

12. **Testing:**  
    - Manually trigger the workflow.  
    - Verify data is pulled correctly from Google Sheets, reviews are fetched from SerpAPI, analyzed by OpenAI, and results are appended back to Google Sheets.  
    - Check the "skipped reviews" sheet tab for any reviews without text.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Context or Link                                                                                                   |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| This n8n template helps you analyze Google Maps reviews for a list of restaurants, summarize them with AI, and identify optimization opportunities—all in one automated workflow. It is designed for users managing multiple locations, helping local restaurants improve their presence, or conducting competitor analysis. Requirements include SerpAPI, OpenAI, and Google Sheets access. Detailed setup instructions and usage tips are included within workflow sticky notes. | See Sticky Note1 content within the workflow.                                                                   |
| SerpAPI n8n integration documentation provides helpful guidance for making HTTP requests and parsing results from SerpAPI endpoints.                                                                                                                                                                                                                                                                                                                                                                    | https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.toolserpapi/                 |
| Example screenshots of input and output Google Sheets provide visual confirmation of correct data structure and workflow operation.                                                                                                                                                                                                                                                                                                                                                                     | See Sticky Note4 (Input) and Sticky Note5 (Output)                                                              |
| Watch for API rate limits on SerpAPI and OpenAI services; monitor and handle errors gracefully in production deployments.                                                                                                                                                                                                                                                                                                                                                                               | General best practice.                                                                                           |
| The workflow assumes the Google Sheets document schema includes a restaurant name field named consistently to match the query parameter in SerpAPI calls. Adjust accordingly if your sheet structure differs.                                                                                                                                                                                                                                                                                          | Important for correct data flow.                                                                                  |

---

This document provides a comprehensive, node-level breakdown and replication guide for the "Analyze and Summarize Google Reviews with SerpAPI, GPT-4 and Google Sheets" workflow. It is designed to enable advanced users or automation agents to understand, reproduce, and adapt the workflow confidently.