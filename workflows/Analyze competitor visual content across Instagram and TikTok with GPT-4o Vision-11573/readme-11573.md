Analyze competitor visual content across Instagram and TikTok with GPT-4o Vision

https://n8nworkflows.xyz/workflows/analyze-competitor-visual-content-across-instagram-and-tiktok-with-gpt-4o-vision-11573


# Analyze competitor visual content across Instagram and TikTok with GPT-4o Vision

### 1. Workflow Overview

This workflow provides a cross-platform competitive visual intelligence analysis by scraping recent visual content from Instagram and TikTok accounts (user's own plus up to three competitors), analyzing images with AI (GPT-4o Vision), and generating a detailed competitive report. The report highlights visual attributes such as color palettes, composition styles, moods, and text design elements, then logs summarized insights into Google Sheets for tracking and further use.

The workflow can be logically grouped into the following blocks:

- **1.1 Input Reception and Configuration:** Captures user inputs via form and formats them for processing.
- **1.2 Platform Routing:** Directs the workflow to scrape content from selected platforms.
- **1.3 Content Scraping:** Uses Apify actors to fetch recent posts from Instagram and TikTok.
- **1.4 Image Filtering:** Filters scraped content to process images only.
- **1.5 AI Vision Analysis:** Sends each image to GPT-4o Vision for detailed visual attribute extraction.
- **1.6 Aggregation and Report Generation:** Aggregates all AI results and generates a comprehensive competitive analysis report.
- **1.7 Logging:** Logs the generated summary into Google Sheets for record-keeping.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Configuration

- **Overview:**  
  This block collects user input through a form, including the user’s account and competitor accounts, selected platforms, and the number of posts to analyze. Input data is then formatted and enriched with workflow configurations including the OpenAI API key.

- **Nodes Involved:**  
  - Form Trigger1  
  - Workflow Configuration1  
  - Sticky Note - Step 1  
  - Sticky Note - Step 2

- **Node Details:**  

  - **Form Trigger1**  
    - *Type:* Form Trigger  
    - *Role:* Entry point capturing user input via web form.  
    - *Configuration:*  
      - Fields: Own account/hashtag (required), up to three competitor accounts (optional), platform selection (Instagram, Pinterest, TikTok), number of posts to analyze (required).  
      - Form title and description specify the workflow purpose.  
      - Webhook enabled for external triggering.  
    - *Connections:* Outputs to Workflow Configuration1.  
    - *Edge Cases:* Missing required fields may prevent execution; ensure webhook ID is configured properly.

  - **Workflow Configuration1**  
    - *Type:* Set node  
    - *Role:* Formats and prepares input data for downstream nodes.  
    - *Configuration:*  
      - Converts competitor inputs into a JSON array, filters empty entries.  
      - Extracts platforms selected as an array.  
      - Sets postsCount and stores OpenAI API key (placeholder "YOUR_OPENAI_API_KEY" must be replaced).  
    - *Connections:* Outputs to Platform Router1.  
    - *Edge Cases:* Missing OpenAI API key will cause failures in AI nodes; input field filtering is crucial for stable execution.

  - **Sticky Notes (Step 1 & Step 2)**  
    - Provide high-level descriptions and instructions for input and configuration steps, including the critical reminder to add OpenAI API key.

#### 2.2 Platform Routing

- **Overview:**  
  Routes the workflow to scrape data from the platforms selected by the user. Supports parallel routing to Instagram and TikTok scrapers.

- **Nodes Involved:**  
  - Platform Router1  
  - Sticky Note - Step 3

- **Node Details:**  

  - **Platform Router1**  
    - *Type:* Switch node  
    - *Role:* Checks selected platforms array and routes execution accordingly.  
    - *Configuration:*  
      - Checks if 'Instagram' is in selected platforms, outputs to Instagram scraping.  
      - Checks if 'TikTok' is selected, outputs to TikTok scraping.  
      - Pinterest is mentioned in UI but no scraper implemented here.  
      - Supports multiple outputs for parallel scraping.  
    - *Connections:* Outputs to Scrape Instagram Posts and Scrape TikTok Posts nodes.  
    - *Edge Cases:* Unsupported platform (Pinterest) leads to no scraping; if no platforms selected, no scraping occurs.

  - **Sticky Note - Step 3**  
    - Explains routing logic and parallel execution support.

#### 2.3 Content Scraping

- **Overview:**  
  Uses Apify actors to fetch recent posts from Instagram and TikTok accounts specified. Each actor runs with appropriate inputs and memory settings.

- **Nodes Involved:**  
  - Scrape Instagram Posts  
  - Scrape TikTok Posts  
  - Sticky Note - Step 4

- **Node Details:**  

  - **Scrape Instagram Posts**  
    - *Type:* Apify actor node  
    - *Role:* Runs Instagram scraper actor with given Instagram URLs.  
    - *Configuration:*  
      - Memory: 2048 MB (adjustable).  
      - Input: Direct URLs constructed from own account and first two competitors, filtering out null/undefined entries.  
      - Results limited by user’s postsCount input (default 10).  
      - Auth: Uses Apify OAuth2 credentials.  
    - *Output:* Dataset of posts.  
    - *Connections:* Outputs to Filter Images Only1.  
    - *Edge Cases:* Missing or private accounts may yield empty datasets; network or API errors possible.

  - **Scrape TikTok Posts**  
    - *Type:* Apify actor node  
    - *Role:* Runs TikTok scraper actor with profile names.  
    - *Configuration:*  
      - Memory: 2048 MB.  
      - Inputs: Profiles array with own account and first two competitors, filtered.  
      - Posts per page limited by postsCount.  
      - Videos are not downloaded, only metadata/images fetched.  
      - Auth: Apify OAuth2.  
    - *Output:* Dataset of posts.  
    - *Connections:* Outputs to Filter Images Only1.  
    - *Edge Cases:* Similar to Instagram scraping; API rate limiting or private profiles can cause empty or partial data.

  - **Sticky Note - Step 4**  
    - Notes about Apify actor usage and memory tuning for large batches.

#### 2.4 Image Filtering

- **Overview:**  
  Filters scraped content to keep only image-type posts with valid image URLs for AI analysis.

- **Nodes Involved:**  
  - Filter Images Only1

- **Node Details:**  

  - **Filter Images Only1**  
    - *Type:* Filter node  
    - *Role:* Passes only items where type equals "Image" and image URL is present.  
    - *Configuration:*  
      - Conditions: $json.type == "Image" AND image URL field (displayUrl or imageUrl) is non-empty.  
    - *Connections:* Outputs to Analyze Images with GPT-4o Vision.  
    - *Edge Cases:* Posts without images or with missing URLs are discarded; ensure scraper outputs consistent typing.

#### 2.5 AI Vision Analysis

- **Overview:**  
  Each filtered image is sent individually to OpenAI’s GPT-4o Vision model for detailed visual attribute extraction.

- **Nodes Involved:**  
  - Analyze Images with GPT-4o Vision  
  - Sticky Note - Step 5

- **Node Details:**  

  - **Analyze Images with GPT-4o Vision**  
    - *Type:* Code node (JavaScript)  
    - *Role:* Calls OpenAI Chat Completion API with GPT-4o model, sending image URL and a prompt requesting JSON with color palette, composition style, mood/emotion, and text design elements.  
    - *Configuration:*  
      - Runs once per item (image).  
      - Extracts OpenAI API key from Workflow Configuration.  
      - Detects platform from item structure (Instagram or TikTok).  
      - Handles parsing of AI response to extract JSON safely with fallback for parse errors.  
    - *Outputs:* JSON with analyzed attributes and raw AI response.  
    - *Connections:* Outputs to Aggregate All Results.  
    - *Edge Cases:*  
      - Missing or invalid API key causes request failure.  
      - AI response may be malformed or incomplete, handled by fallback JSON structure.  
      - Network timeouts or API rate limiting possible.

  - **Sticky Note - Step 5**  
    - Summarizes analysis attributes extracted by AI.

#### 2.6 Aggregation and Report Generation

- **Overview:**  
  Aggregates all individual image analyses into one dataset and generates a comprehensive competitive analysis report using GPT-4.

- **Nodes Involved:**  
  - Aggregate All Results  
  - Generate Competitive Analysis Report  
  - Sticky Note - Step 6

- **Node Details:**  

  - **Aggregate All Results**  
    - *Type:* Aggregate node  
    - *Role:* Combines all incoming items (image analyses) into one aggregate object.  
    - *Configuration:* Aggregate all item data to field "analysisResults".  
    - *Connections:* Outputs to Generate Competitive Analysis Report.  
    - *Edge Cases:* If no images processed, aggregation results may be empty, potentially affecting report quality.

  - **Generate Competitive Analysis Report**  
    - *Type:* Code node (JavaScript)  
    - *Role:*  
      - Uses OpenAI GPT-4 to generate a detailed report based on aggregated visual data.  
      - Constructs a complex prompt including competitive comparison matrix, platform-specific patterns, cross-platform insights, and recommendations.  
      - Parses the AI response into structured sections for easier downstream use.  
    - *Configuration:*  
      - Uses OpenAI API key from Workflow Configuration.  
      - Calls OpenAI Chat Completion API with temperature 0.7 and max_tokens 2500.  
      - Includes error throw if API key missing.  
    - *Outputs:* JSON object with multiple report sections and metadata.  
    - *Connections:* Outputs to Log Results to Google Sheets.  
    - *Edge Cases:* Large data may cause token limit issues; API errors or malformed responses must be handled externally.

  - **Sticky Note - Step 6**  
    - Describes report aggregation, generation, and logging.

#### 2.7 Logging

- **Overview:**  
  Logs the final summarized report and metadata into a Google Sheet for historical tracking and further analysis.

- **Nodes Involved:**  
  - Log Results to Google Sheets

- **Node Details:**  

  - **Log Results to Google Sheets**  
    - *Type:* Google Sheets node  
    - *Role:* Appends or updates a row in a specified Google Sheet with timestamp, account info, platforms, posts analyzed, and a summary excerpt.  
    - *Configuration:*  
      - Maps multiple columns including timestamp, own account, competitors, platforms, number of posts analyzed, and the report summary (limited to first 500 characters).  
      - Uses OAuth2 credentials for Google Sheets access.  
      - Requires user to set the document ID and sheet name (gid=0).  
    - *Connections:* Terminal node.  
    - *Edge Cases:*  
      - Improper credential setup causes auth failures.  
      - Google Sheets API quota or sheet permission issues can cause errors.

---

### 3. Summary Table

| Node Name                         | Node Type               | Functional Role                                | Input Node(s)              | Output Node(s)               | Sticky Note                                                                                         |
|----------------------------------|-------------------------|-----------------------------------------------|----------------------------|-----------------------------|---------------------------------------------------------------------------------------------------|
| Form Trigger1                    | Form Trigger            | Captures user input via form                   | -                          | Workflow Configuration1      | Step 1: Form Input - Users enter accounts, select platforms, posts count                          |
| Workflow Configuration1          | Set                     | Formats and prepares input data                | Form Trigger1              | Platform Router1             | Step 2: Configuration - Extracts and formats input data; add OpenAI API key                      |
| Platform Router1                 | Switch                  | Routes workflow to selected platform scrapers | Workflow Configuration1    | Scrape Instagram Posts, Scrape TikTok Posts | Step 3: Platform Routing - Routes to scrapers based on platform selection                         |
| Scrape Instagram Posts           | Apify Actor              | Scrapes Instagram posts                        | Platform Router1           | Filter Images Only1          | Step 4: Content Scraping - Uses Apify actor; adjust memory if needed                              |
| Scrape TikTok Posts              | Apify Actor              | Scrapes TikTok posts                           | Platform Router1           | Filter Images Only1          | Step 4: Content Scraping - Uses Apify actor; adjust memory if needed                              |
| Filter Images Only1              | Filter                   | Filters scraped posts to images only          | Scrape Instagram Posts, Scrape TikTok Posts | Analyze Images with GPT-4o Vision |                                                                                                   |
| Analyze Images with GPT-4o Vision| Code                     | Sends images to GPT-4o Vision for analysis    | Filter Images Only1         | Aggregate All Results        | Step 5: AI Analysis - Extracts color, composition, mood, text elements                           |
| Aggregate All Results            | Aggregate                | Aggregates all analyzed image data             | Analyze Images with GPT-4o Vision | Generate Competitive Analysis Report | Step 6: Report & Logging - Aggregates results for report generation                               |
| Generate Competitive Analysis Report | Code                | Generates detailed competitive analysis report | Aggregate All Results       | Log Results to Google Sheets | Step 6: Report & Logging - AI-powered comprehensive report generation                            |
| Log Results to Google Sheets     | Google Sheets            | Logs report summary and metadata               | Generate Competitive Analysis Report | -                           | Step 6: Report & Logging - Saves summary to Google Sheets                                       |
| Sticky Note - Overview           | Sticky Note              | High-level workflow overview                    | -                          | -                           | Cross-Platform Competitive Visual Intelligence template and instructions                         |
| Sticky Note - Step 1             | Sticky Note              | Describes user input step                      | -                          | -                           | Step 1: Form Input - User enters accounts and selects platforms                                  |
| Sticky Note - Step 2             | Sticky Note              | Describes configuration step                   | -                          | -                           | Step 2: Configuration - Format inputs and add OpenAI API key                                    |
| Sticky Note - Step 3             | Sticky Note              | Explains platform routing logic                 | -                          | -                           | Step 3: Platform Routing - Routes to scrapers based on platforms                                |
| Sticky Note - Step 4             | Sticky Note              | Explains content scraping actors                | -                          | -                           | Step 4: Content Scraping - Apify actors for Instagram and TikTok                                |
| Sticky Note - Step 5             | Sticky Note              | Describes AI image analysis                      | -                          | -                           | Step 5: AI Analysis - Attributes extracted by GPT-4o Vision                                   |
| Sticky Note - Step 6             | Sticky Note              | Explains report generation and logging          | -                          | -                           | Step 6: Report & Logging - Aggregates and logs analysis results                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Form Trigger Node**  
   - Type: Form Trigger  
   - Configure form fields:  
     - "Your Account/Hashtag" (string, required)  
     - "Competitor 1 Account" (string)  
     - "Competitor 2 Account" (string)  
     - "Competitor 3 Account" (string)  
     - "Select Platforms" (checkbox with options: Instagram, Pinterest, TikTok; required)  
     - "Number of Posts to Analyze" (number, required, default placeholder 10)  
   - Set webhook ID for external triggering.

2. **Create Set Node "Workflow Configuration1"**  
   - Inputs: Output of Form Trigger.  
   - Assign variables:  
     - ownAccount = value of "Your Account/Hashtag" field  
     - competitors = JSON array string of non-empty competitor accounts  
     - platforms = array from "Select Platforms"  
     - postsCount = number of posts to analyze  
     - openaiApiKey = your actual OpenAI API key (replace placeholder)  
   - Pass all other fields through.

3. **Create Switch Node "Platform Router1"**  
   - Input: Workflow Configuration1.  
   - Add rules:  
     - If platforms array contains "Instagram", output 1.  
     - If platforms array contains "TikTok", output 2.  
   - Enable multiple outputs and ignore case.

4. **Create Apify Actor Node "Scrape Instagram Posts"**  
   - Input: Platform Router1 output for Instagram.  
   - Actor ID: Instagram scraper actor URL (provide or use known actor).  
   - Memory: 2048 MB (adjust if needed).  
   - Custom JSON body: construct directUrls array from ownAccount and first two competitors (filter null/undefined).  
   - resultsLimit: postsCount from configuration.  
   - Authentication: Apify OAuth2 credentials.

5. **Create Apify Actor Node "Scrape TikTok Posts"**  
   - Input: Platform Router1 output for TikTok.  
   - Actor ID: TikTok scraper actor ID.  
   - Memory: 2048 MB.  
   - Custom JSON body: profiles array including ownAccount and first two competitors (filter empty).  
   - resultsPerPage: postsCount from configuration.  
   - shouldDownloadVideos: false.  
   - Authentication: Apify OAuth2 credentials.

6. **Create Filter Node "Filter Images Only1"**  
   - Input: Both Instagram and TikTok scraping nodes.  
   - Condition:  
     - $json.type equals "Image"  
     - AND (displayUrl OR imageUrl) is not empty  
   - Output: To AI analysis code node.

7. **Create Code Node "Analyze Images with GPT-4o Vision"**  
   - Input: Filter Images Only1 output.  
   - Run once per item (image).  
   - JS code:  
     - Extract OpenAI API key from Workflow Configuration.  
     - Determine image URL from displayUrl or coverUrl.  
     - Detect platform from data structure.  
     - Send POST request to OpenAI Chat Completions API with GPT-4o model, including prompt for visual attributes.  
     - Parse AI response JSON safely with fallback.  
     - Return structured JSON with attributes and raw AI response.  
   - Output: To aggregation node.

8. **Create Aggregate Node "Aggregate All Results"**  
   - Input: Analyze Images node.  
   - Aggregate all incoming items into single array field "analysisResults".  
   - Output: To report generation node.

9. **Create Code Node "Generate Competitive Analysis Report"**  
   - Input: Aggregate All Results output.  
   - JS code:  
     - Extract OpenAI API key from Workflow Configuration.  
     - Prepare prompt including aggregated data serialized as JSON and detailed instructions for analysis sections.  
     - Call OpenAI GPT-4 Chat Completion API.  
     - Extract and segment report into multiple sections for clarity.  
     - Return structured JSON with fullReport and subsections.  
   - Output: To Google Sheets logging node.

10. **Create Google Sheets Node "Log Results to Google Sheets"**  
    - Input: Generate Competitive Analysis Report output.  
    - Configure:  
      - Document ID: your Google Sheet ID.  
      - Sheet name: default "gid=0" or your sheet tab.  
      - Append or update mode.  
      - Map columns: timestamp (current ISO datetime), own_account, competitors, platforms, posts_analyzed (count of analyzed images), summary (first 500 characters of report).  
    - Credentials: OAuth2 Google Sheets credentials with write permissions.

11. **Connect nodes** in the order described, ensuring all parallel outputs from Platform Router1 connect appropriately to scraper nodes, and scraper outputs converge into Filter Images Only1.

12. **Replace placeholder API keys and IDs**:  
    - OpenAI API key in Workflow Configuration node.  
    - Apify OAuth2 credentials in scraper nodes.  
    - Google Sheets document ID and OAuth2 credentials.  
    - Webhook ID in Form Trigger node.

13. **Test the workflow** with valid inputs to verify scraping, image analysis, report generation, and logging.

---

### 5. General Notes & Resources

| Note Content                                                                                                         | Context or Link                                                                                  |
|----------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| This workflow requires an Apify account with API access for scraping Instagram and TikTok content.                   | Apify platform: https://apify.com                                                              |
| OpenAI GPT-4o Vision model is used for image analysis; ensure your API key has access to GPT-4o.                      | OpenAI API documentation: https://platform.openai.com/docs/models/gpt-4o                        |
| Google Sheets is used for logging results; configure proper OAuth2 credentials and share the sheet with the account. | Google Sheets API: https://developers.google.com/sheets/api                                    |
| Pinterest platform is mentioned in the input form but is not implemented in the scraping or routing logic.           | Can be extended by adding Pinterest scraper and routing logic.                                  |
| AI analysis prompt can be customized in the "Analyze Images with GPT-4o Vision" node to extract additional attributes.| Adjust JSON prompt text in the code node accordingly.                                          |
| Memory settings in Apify actors may need tuning depending on the number of posts analyzed.                           | Increase memory in Apify node parameters if scraping large batches causes failures.             |
| The workflow aggregates all image analysis results before generating the report to ensure comprehensive insights.    | Aggregation step critical for proper AI report generation.                                      |

---

**Disclaimer:** The text provided is exclusively derived from an automated workflow created with n8n, a tool for integration and automation. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.