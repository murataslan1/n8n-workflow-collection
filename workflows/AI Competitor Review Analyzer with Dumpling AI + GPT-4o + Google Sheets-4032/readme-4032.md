AI Competitor Review Analyzer with Dumpling AI + GPT-4o + Google Sheets

https://n8nworkflows.xyz/workflows/ai-competitor-review-analyzer-with-dumpling-ai---gpt-4o---google-sheets-4032


# AI Competitor Review Analyzer with Dumpling AI + GPT-4o + Google Sheets

---

# AI Competitor Review Analyzer with Dumpling AI + GPT-4o + Google Sheets

---

### 1. Workflow Overview

This workflow automates the process of collecting, analyzing, and summarizing Google reviews for competitor businesses listed in a Google Sheet. It is designed to serve marketers, SEO specialists, product teams, and competitive analysts who need fast, structured insights from public reviews without manual effort.

The workflow is logically divided into two main blocks:

**1.1 Business Input & Review Collection**  
- Triggered by new competitor entries in a Google Sheet  
- Fetches up to 20 recent Google reviews per business via Dumpling AI  
- Splits the review list into individual review items for processing  

**1.2 AI Processing & Output**  
- Aggregates individual review texts into a single prompt  
- Uses GPT-4o to analyze and generate grouped summaries of complaints and praises  
- Writes the AI-generated summary back to the Google Sheet aligned with each business  

This modular structure allows easy customization and scaling for more detailed analysis or different data sources.

---

### 2. Block-by-Block Analysis

#### 2.1 Business Input & Review Collection

**Overview:**  
This block listens for new competitor names added to a Google Sheet, then automatically fetches the latest Google reviews related to those competitors using Dumpling AI. The reviews are then broken down into individual items for further processing.

**Nodes Involved:**  
- Google Sheets Trigger – New Business Added  
- Fetch Google Reviews from Dumpling AI  
- Split Out Reviews List  

**Node Details:**  

- **Google Sheets Trigger – New Business Added**  
  - *Type:* Google Sheets Trigger  
  - *Role:* Watches for new rows added to a specific Google Sheet (sheet named "Sheet1") and triggers the workflow when a new business is entered.  
  - *Configuration:*  
    - Event: rowAdded  
    - Polling interval: Every minute  
    - DocumentID and SheetName linked to a specific Google Sheet for competitor input  
    - OAuth2 credentials for Google Sheets access  
  - *Inputs:* None (trigger node)  
  - *Outputs:* JSON containing the new row data with at least the "Business name" field  
  - *Failure Modes:* Authentication errors with Google Sheets, connectivity issues, or rate limits on polling  
  - *Version Specifics:* Requires n8n version supporting Google Sheets Trigger node (v1)  

- **Fetch Google Reviews from Dumpling AI**  
  - *Type:* HTTP Request  
  - *Role:* Sends a POST request to Dumpling AI’s API to scrape up to 20 newest Google reviews for the business named in the trigger.  
  - *Configuration:*  
    - URL: https://app.dumplingai.com/api/v1/get-google-reviews  
    - Method: POST  
    - JSON body: Includes dynamic keyword from the trigger’s "Business name", fixed parameters for number of reviews (20), sort order (newest), language (English), and location (United States)  
    - Authentication: HTTP header with agent key credential (Dumpling AI agent key)  
  - *Key Expressions:* `{{ $json['Business name'] }}` used dynamically in the request body  
  - *Inputs:* Business name from trigger  
  - *Outputs:* JSON response containing an array of review objects under `items`  
  - *Failure Modes:* API authentication errors, rate limiting, no reviews found, malformed response, network errors  
  - *Version Specifics:* Uses HTTP Request v4.2 node  

- **Split Out Reviews List**  
  - *Type:* SplitOut  
  - *Role:* Takes the array of reviews (`items`) from Dumpling AI response and emits each review as an individual item.  
  - *Configuration:* Field to split: `items`  
  - *Inputs:* JSON array of reviews  
  - *Outputs:* Individual review JSON objects, each representing one review  
  - *Failure Modes:* If `items` field is missing or empty, node will output no items, potentially halting downstream processing  
  - *Version Specifics:* SplitOut node v1  

---

#### 2.2 AI Processing & Output

**Overview:**  
This block aggregates individual reviews into a single text input, sends it to GPT-4o for sentiment and theme extraction, then saves the structured summary back to the Google Sheet.

**Nodes Involved:**  
- Aggregate Review Text  
- GPT-4o: Extract Insights from Reviews  
- Save Summary to Google Sheets  

**Node Details:**  

- **Aggregate Review Text**  
  - *Type:* Aggregate  
  - *Role:* Combines all split-out review texts into a single aggregated text array to form a comprehensive prompt for GPT-4o.  
  - *Configuration:* Aggregate field: `review_text`  
  - *Inputs:* Individual review objects from SplitOut node  
  - *Outputs:* Single JSON object with aggregated `review_text` array  
  - *Failure Modes:* If any review lacks `review_text` field or is null, aggregate may have empty entries; careful handling needed downstream  
  - *Version Specifics:* Aggregate node v1  

- **GPT-4o: Extract Insights from Reviews**  
  - *Type:* OpenAI (Langchain integration)  
  - *Role:* Sends the aggregated review texts to GPT-4o model to extract and group key complaints and praises.  
  - *Configuration:*  
    - Model: gpt-4o  
    - System prompt: "You are a review analysis assistant"  
    - User prompt: Detailed instructions to analyze tone, keywords, and patterns, not just summarize each review, but group common themes.  
    - Input: Injects aggregated reviews into prompt using expression `{{ $json.review_text }}`  
    - Credentials: OpenAI API key with GPT-4o access  
  - *Inputs:* Aggregated reviews text array  
  - *Outputs:* GPT completion with structured summary in specific format (top complaints and what people love)  
  - *Failure Modes:* API key invalid, model quota exhausted, network timeouts, malformed prompt causing unexpected outputs  
  - *Version Specifics:* n8n Langchain OpenAI node v1.8  

- **Save Summary to Google Sheets**  
  - *Type:* Google Sheets  
  - *Role:* Appends or updates the Google Sheet row with the AI-generated summary linked to the corresponding business.  
  - *Configuration:*  
    - Operation: appendOrUpdate  
    - Sheet name: Sheet1 (by gid=0)  
    - Document ID: same as trigger sheet  
    - Mapping:  
      - "Business name": mapped from Dumpling AI request keyword  
      - "Review  text": mapped from GPT response content (`message.content`)  
    - Matching column: "Business name" (to update the correct row)  
    - OAuth2 credentials for Google Sheets  
  - *Inputs:* GPT summary and business name  
  - *Outputs:* Updated/created Google Sheet row with summary  
  - *Failure Modes:* Authentication failure, sheet not found, concurrency update conflicts, data formatting issues  
  - *Version Specifics:* Google Sheets node v4.5  

---

### 3. Summary Table

| Node Name                         | Node Type                        | Functional Role                              | Input Node(s)                     | Output Node(s)                      | Sticky Note                                                                                      |
|----------------------------------|---------------------------------|----------------------------------------------|----------------------------------|-----------------------------------|------------------------------------------------------------------------------------------------|
| Google Sheets Trigger – New Business Added | Google Sheets Trigger            | Watches for new competitor business entries | None                             | Fetch Google Reviews from Dumpling AI | See "Business Input & Review Collection" description                                             |
| Fetch Google Reviews from Dumpling AI | HTTP Request                    | Scrapes 20 latest Google reviews via Dumpling AI | Google Sheets Trigger – New Business Added | Split Out Reviews List             | See "Business Input & Review Collection" description                                             |
| Split Out Reviews List             | SplitOut                        | Splits review array into individual review items | Fetch Google Reviews from Dumpling AI | Aggregate Review Text              | See "Business Input & Review Collection" description                                             |
| Aggregate Review Text             | Aggregate                      | Aggregates individual review texts for AI prompt | Split Out Reviews List            | GPT-4o: Extract Insights from Reviews | See "AI Analysis & Sheet Output" sticky note                                                     |
| GPT-4o: Extract Insights from Reviews | OpenAI Langchain Node           | Extracts grouped insights from reviews        | Aggregate Review Text             | Save Summary to Google Sheets      | See "AI Analysis & Sheet Output" sticky note                                                     |
| Save Summary to Google Sheets     | Google Sheets                  | Saves the AI-generated summary back to sheet | GPT-4o: Extract Insights from Reviews | None                              | See "AI Analysis & Sheet Output" sticky note                                                     |
| Sticky Note                      | Sticky Note                    | Describes AI Analysis & Sheet Output block    | None                             | None                              | "This section handles summarizing reviews and saving insights..."                               |
| Sticky Note1                     | Sticky Note                    | Describes Business Input & Review Collection  | None                             | None                              | "This section of the workflow starts the competitor analysis process..."                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Sheets Trigger Node**  
   - Add a Google Sheets Trigger node named "Google Sheets Trigger – New Business Added"  
   - Configure to trigger on "rowAdded" event on your competitor Google Sheet ("Sheet1") with OAuth2 credentials  
   - Set polling interval to every minute  

2. **Add HTTP Request Node for Dumpling AI**  
   - Add HTTP Request node named "Fetch Google Reviews from Dumpling AI"  
   - Set method to POST  
   - URL: `https://app.dumplingai.com/api/v1/get-google-reviews`  
   - Body type: JSON  
   - Body content (use expression):  
     ```json
     {
       "keyword": "{{ $json['Business name'] }}",
       "reviews": "20",
       "sortBy": "newest",
       "language": "en",
       "location": "United States"
     }
     ```  
   - Authentication: HTTP Header Auth with your Dumpling AI agent key credential  
   - Connect output of Google Sheets Trigger to this node  

3. **Add SplitOut Node**  
   - Add SplitOut node named "Split Out Reviews List"  
   - Set Field to Split Out: `items`  
   - Connect output of HTTP Request node to this node  

4. **Add Aggregate Node**  
   - Add Aggregate node named "Aggregate Review Text"  
   - Configure to aggregate field: `review_text`  
   - Connect output of SplitOut node to this node  

5. **Add OpenAI Langchain Node**  
   - Add OpenAI node named "GPT-4o: Extract Insights from Reviews"  
   - Select model: `gpt-4o`  
   - Set system message: "You are a review analysis assistant"  
   - Set user message with detailed prompt:  
     ```
     You are a review analysis assistant. Your task is to read a list of customer reviews about a business and extract two main insights:

     1. **Challenges or complaints** people are consistently mentioning  
     2. **Things customers love** or speak highly about

     Please analyze the tone, keywords, and patterns in the reviews. Do not just summarize each review. Instead, group similar feedback together and present the top recurring themes.

     Respond in this format:

     **Top Complaints or Challenges:**
     - [Summarize the most common issues customers have. Include examples if needed.]

     **What People Love About This Business:**
     - [Summarize the most common compliments or positive feedback. Include examples if needed.]

     Here are the reviews:
     {{ $json.review_text }}
     ```  
   - Connect output of Aggregate node to this node  
   - Use OpenAI API credentials configured with GPT-4o access  

6. **Add Google Sheets Node for Output**  
   - Add Google Sheets node named "Save Summary to Google Sheets"  
   - Operation: appendOrUpdate  
   - Sheet Name: "Sheet1" (or your competitor sheet)  
   - Document ID: same as trigger sheet  
   - Mapping:  
     - "Business name": `={{ $('Fetch Google Reviews from Dumpling AI').item.json.keyword }}`  
     - "Review  text": `={{ $json.message.content }}` (GPT response)  
   - Matching Column: "Business name"  
   - Use same OAuth2 credentials for Google Sheets as trigger  
   - Connect output of GPT-4o node to this node  

7. **Add Sticky Notes (Optional)**  
   - Add two Sticky Note nodes with content describing the two main blocks for documentation clarity  

8. **Save and Activate Workflow**  
   - Test by adding a business name row in the Google Sheet  
   - Ensure Dumpling AI and OpenAI credentials are valid and connected  
   - Monitor execution for errors and data flow  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                       | Context or Link                                                |
|----------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| Dumpling AI is a third-party service for scraping Google reviews; requires signup and agent key setup at https://www.dumplingai.com/              | Dumpling AI official site                                      |
| OpenAI GPT-4o is a powerful language model; ensure API key has GPT-4o access for best summaries                                                    | OpenAI API documentation                                       |
| Google Sheets OAuth2 credentials must be authorized for both trigger and output nodes to read/write competitor data                                | Google Cloud Platform, n8n Google Sheets OAuth2 setup          |
| Customizing the GPT prompt can tailor the summary style, e.g., adding emotional tone or specific feature extraction                               | Prompt engineering best practices                              |
| Consider API rate limits and error handling for production-grade deployments                                                                       | n8n error workflow features and retry logic                    |
| Replace Google Sheets with Airtable or other data sources for more advanced use cases                                                              | Airtable API and n8n Airtable nodes                            |
| Workflow is designed for English language reviews and US location; modify Dumpling AI parameters for other languages or locations                  | Dumpling AI API docs                                           |

---

**Disclaimer:** The text provided here is extracted exclusively from an automated n8n workflow. It adheres strictly to content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.

---