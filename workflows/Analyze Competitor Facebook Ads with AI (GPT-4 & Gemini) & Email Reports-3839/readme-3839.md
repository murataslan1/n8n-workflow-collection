Analyze Competitor Facebook Ads with AI (GPT-4 & Gemini) & Email Reports

https://n8nworkflows.xyz/workflows/analyze-competitor-facebook-ads-with-ai--gpt-4---gemini----email-reports-3839


# Analyze Competitor Facebook Ads with AI (GPT-4 & Gemini) & Email Reports

### 1. Workflow Overview

This workflow automates competitor creative analysis of Facebook ads by scraping ads from a specified Facebook Page, applying AI-driven analysis on images and videos, and sending a detailed report via email. It targets marketers, brand managers, and advertisers seeking automated, insightful competitor ad evaluations.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Captures user input (email and Facebook Page URL) through a web form trigger.
- **1.2 Data Collection & Preprocessing:** Scrapes Facebook ads using Apify, splits ads into image and video categories, deduplicates, and limits to top 5 ads per type.
- **1.3 AI Analysis:** Applies OpenAI Vision (GPT-4) to image ads and Google Gemini to video ads for creative insight extraction.
- **1.4 Aggregation & Report Generation:** Combines AI insights into a structured text report.
- **1.5 Email Delivery:** Sends the generated report with ad previews to the user’s email.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block triggers the workflow upon user submission of their email and a Facebook Page URL via a web form.

- **Nodes Involved:**  
  - On form submission

- **Node Details:**

  - **On form submission**  
    - Type: Form Trigger  
    - Role: Entry point capturing user inputs from a web form.  
    - Configuration: Listens for form submissions with fields expected for user email and Facebook Page URL.  
    - Inputs: External HTTP webhook trigger from form submission.  
    - Outputs: Passes form data downstream for scraping.  
    - Edge Cases: Missing or malformed input fields; webhook connectivity issues.

---

#### 1.2 Data Collection & Preprocessing

- **Overview:**  
  Scrapes Facebook ads from the submitted Page URL, separates image and video ads, removes duplicates, and limits the number of ads for analysis.

- **Nodes Involved:**  
  - Scrape ads  
  - Split Image Ads & Video Ads  
  - Image duplicate key  
  - Image Duplicate Key  
  - Image Remove Duplicates  
  - Video Remove Duplicates  
  - Image Limit 5  
  - Video Limit 5  
  - Select Image Fields  
  - Select Video Fields  
  - Merge Media Result

- **Node Details:**

  - **Scrape ads**  
    - Type: HTTP Request  
    - Role: Calls Apify or similar service to scrape latest Facebook ads from the target Page URL.  
    - Configuration: HTTP request configured to fetch ads data (images/videos).  
    - Inputs: Facebook Page URL from form submission.  
    - Outputs: Raw ads data for processing.  
    - Edge Cases: API rate limits, invalid page URL, network errors.

  - **Split Image Ads & Video Ads**  
    - Type: Switch  
    - Role: Routes ads into two streams based on media type (image or video).  
    - Configuration: Condition checks media type field in ads data.  
    - Inputs: Raw ads array.  
    - Outputs: Two branches—image ads and video ads.  
    - Edge Cases: Ads missing media type field, unexpected media formats.

  - **Image duplicate key** and **Image Duplicate Key**  
    - Type: Set  
    - Role: Prepare unique keys for deduplication of image and video ads respectively.  
    - Configuration: Sets a deduplication key based on ad properties (e.g., media URL or ID).  
    - Inputs: Ads data from split.  
    - Outputs: Ads with deduplication keys.  
    - Edge Cases: Missing fields for key generation.

  - **Image Remove Duplicates** and **Video Remove Duplicates**  
    - Type: Remove Duplicates  
    - Role: Removes duplicate ads based on the deduplication key.  
    - Configuration: Deduplication field set to the key created in previous nodes.  
    - Inputs: Ads with keys.  
    - Outputs: Unique ads only.  
    - Edge Cases: Incorrect key leading to false duplicates or missed duplicates.

  - **Image Limit 5** and **Video Limit 5**  
    - Type: Limit  
    - Role: Restricts the number of ads to top 5 for each media type.  
    - Configuration: Limit set to 5.  
    - Inputs: Deduplicated ads.  
    - Outputs: Top 5 ads per media type.  
    - Edge Cases: Less than 5 ads available.

  - **Select Image Fields** and **Select Video Fields**  
    - Type: Set  
    - Role: Selects and formats relevant fields from ads for downstream AI analysis.  
    - Configuration: Fields like media URL, ad text, metadata are selected.  
    - Inputs: Limited ads.  
    - Outputs: Cleaned and structured ad data.  
    - Edge Cases: Missing expected fields.

  - **Merge Media Result**  
    - Type: Merge  
    - Role: Combines processed image and video ads back into a single data stream for aggregation.  
    - Configuration: Merges two input streams (image and video ads).  
    - Inputs: Outputs from Select Image Fields and Select Video Fields.  
    - Outputs: Unified ads dataset.  
    - Edge Cases: Mismatched data structures.

---

#### 1.3 AI Analysis

- **Overview:**  
  Applies AI models to analyze the creative content of ads: OpenAI Vision (GPT-4) for images and Google Gemini for videos.

- **Nodes Involved:**  
  - Analyze Image  
  - OpenAI Chat Model  
  - Structured Output Parser  
  - Auto-fixing Output Parser  
  - AI Agent  
  - Download video  
  - Upload video Gemini  
  - Wait  
  - Analyze video Gemini  
  - Select Video Fields (post video analysis)  
  - Image Duplicate Key (for video branch)

- **Node Details:**

  - **Analyze Image**  
    - Type: OpenAI (Langchain)  
    - Role: Sends image ads to OpenAI Vision (GPT-4) for detailed creative analysis.  
    - Configuration: Uses OpenAI credentials, configured with prompts targeting branding, messaging, and visual elements.  
    - Inputs: Top 5 image ads.  
    - Outputs: AI-generated insights per image ad.  
    - Edge Cases: API quota limits, image format issues.

  - **OpenAI Chat Model**  
    - Type: Langchain OpenAI Chat  
    - Role: Processes combined ad insights into a conversational AI model for summarization and report generation.  
    - Configuration: GPT-4 chat model with prompt engineering.  
    - Inputs: Aggregated ad data.  
    - Outputs: Raw AI textual output.  
    - Edge Cases: Timeout, prompt failures.

  - **Structured Output Parser**  
    - Type: Langchain Output Parser  
    - Role: Parses AI output into structured JSON or defined schema.  
    - Configuration: Schema defined for expected fields (e.g., insights, scores).  
    - Inputs: Raw AI chat output.  
    - Outputs: Structured data.  
    - Edge Cases: Parsing errors, unexpected output format.

  - **Auto-fixing Output Parser**  
    - Type: Langchain Output Parser Autofixing  
    - Role: Attempts to auto-correct parsing errors from the structured parser.  
    - Configuration: Enabled auto-fixing.  
    - Inputs: Output from Structured Output Parser.  
    - Outputs: Corrected structured data.  
    - Edge Cases: Unfixable errors.

  - **AI Agent**  
    - Type: Langchain Agent  
    - Role: Orchestrates AI tasks, integrating parsed outputs and preparing final report content.  
    - Configuration: Uses previous parsers and models.  
    - Inputs: Parsed AI data.  
    - Outputs: Final report content.  
    - Edge Cases: Agent logic errors.

  - **Download video**  
    - Type: HTTP Request  
    - Role: Downloads video ads for upload to Gemini.  
    - Configuration: HTTP GET request to video URLs.  
    - Inputs: Top 5 video ads.  
    - Outputs: Video binary data.  
    - Edge Cases: Download failures, large file sizes.

  - **Upload video Gemini**  
    - Type: HTTP Request  
    - Role: Uploads downloaded videos to Google Gemini for analysis.  
    - Configuration: Authenticated request with Gemini API credentials.  
    - Inputs: Video binary data.  
    - Outputs: Upload confirmation or job ID.  
    - Edge Cases: Authentication failure, upload errors.

  - **Wait**  
    - Type: Wait  
    - Role: Pauses workflow to allow asynchronous Gemini video analysis to complete.  
    - Configuration: Fixed delay or webhook-based continuation.  
    - Inputs: Upload confirmation.  
    - Outputs: Triggers next step after wait.  
    - Edge Cases: Timeout too short or too long.

  - **Analyze video Gemini**  
    - Type: HTTP Request  
    - Role: Retrieves video analysis results from Gemini.  
    - Configuration: Authenticated GET request using job ID.  
    - Inputs: Trigger from Wait node.  
    - Outputs: Video analysis insights.  
    - Edge Cases: Delayed processing, API errors.

  - **Select Video Fields (post video analysis)**  
    - Type: Set  
    - Role: Formats Gemini video analysis output for merging.  
    - Configuration: Selects relevant fields like insights and metadata.  
    - Inputs: Gemini analysis results.  
    - Outputs: Structured video insights.  
    - Edge Cases: Missing fields.

  - **Image Duplicate Key (video branch)**  
    - Type: Set  
    - Role: Prepares keys for deduplication in video ads branch (likely misnamed, but used for video ads).  
    - Configuration: Sets unique keys for video ads.  
    - Inputs: Video ads.  
    - Outputs: Keys for deduplication.  
    - Edge Cases: Key collision.

---

#### 1.4 Aggregation & Report Generation

- **Overview:**  
  Aggregates all AI insights from image and video analyses into a single text string to form the creative analytics report.

- **Nodes Involved:**  
  - Aggregate  
  - Combine all Ads information into a single text string

- **Node Details:**

  - **Aggregate**  
    - Type: Aggregate  
    - Role: Collects all processed ad insights into a single dataset.  
    - Configuration: Aggregation method set to combine all items.  
    - Inputs: Merged media results with AI insights.  
    - Outputs: Aggregated data array.  
    - Edge Cases: Empty inputs.

  - **Combine all Ads information into a single text string**  
    - Type: Set  
    - Role: Concatenates aggregated insights into a formatted text report.  
    - Configuration: Uses expressions to build a visually engaging report string with ad previews and evaluations.  
    - Inputs: Aggregated data.  
    - Outputs: Final report text.  
    - Edge Cases: Formatting errors.

---

#### 1.5 Email Delivery

- **Overview:**  
  Sends the final creative analytics report via email to the user who submitted the form.

- **Nodes Involved:**  
  - AI Agent (final output)  
  - Email the top job recommendations

- **Node Details:**

  - **AI Agent (final output)**  
    - Role: Provides the final formatted report content to the email node.  
    - Inputs: Combined report string.  
    - Outputs: Email content.

  - **Email the top job recommendations**  
    - Type: Gmail  
    - Role: Sends the email report to the user’s email address.  
    - Configuration: Uses OAuth2 Gmail credentials; email includes ad previews and detailed analysis.  
    - Inputs: Recipient email from form submission, report content from AI Agent.  
    - Outputs: Email sent confirmation.  
    - Edge Cases: Email sending failures, invalid recipient email.

---

### 3. Summary Table

| Node Name                          | Node Type                          | Functional Role                            | Input Node(s)                   | Output Node(s)                      | Sticky Note                                                                                     |
|-----------------------------------|----------------------------------|--------------------------------------------|--------------------------------|-----------------------------------|------------------------------------------------------------------------------------------------|
| On form submission                | Form Trigger                     | Entry point for user input                  | -                              | Scrape ads                        |                                                                                                |
| Scrape ads                       | HTTP Request                    | Scrape Facebook ads from target Page       | On form submission             | Split Image Ads & Video Ads       |                                                                                                |
| Split Image Ads & Video Ads      | Switch                         | Separate ads into image and video streams  | Scrape ads                    | Image duplicate key, Image Duplicate Key |                                                                                                |
| Image duplicate key              | Set                            | Create deduplication key for image ads     | Split Image Ads & Video Ads    | Image Remove Duplicates           |                                                                                                |
| Image Duplicate Key              | Set                            | Create deduplication key for video ads     | Split Image Ads & Video Ads    | Video Remove Duplicates           |                                                                                                |
| Image Remove Duplicates          | Remove Duplicates              | Remove duplicate image ads                  | Image duplicate key            | Image Limit 5                    |                                                                                                |
| Video Remove Duplicates          | Remove Duplicates              | Remove duplicate video ads                  | Image Duplicate Key            | Video Limit 5                    |                                                                                                |
| Image Limit 5                   | Limit                          | Limit image ads to top 5                     | Image Remove Duplicates        | Analyze Image                   |                                                                                                |
| Video Limit 5                   | Limit                          | Limit video ads to top 5                     | Video Remove Duplicates        | Download video                  |                                                                                                |
| Analyze Image                   | OpenAI (Langchain)             | Analyze image ads with GPT-4 Vision         | Image Limit 5                 | Select Image Fields             |                                                                                                |
| Select Image Fields             | Set                            | Select relevant image ad fields             | Analyze Image                 | Merge Media Result              |                                                                                                |
| Download video                 | HTTP Request                    | Download video ads                           | Video Limit 5                 | Upload video Gemini            |                                                                                                |
| Upload video Gemini            | HTTP Request                    | Upload videos to Google Gemini               | Download video                | Wait                          |                                                                                                |
| Wait                          | Wait                           | Pause for Gemini video analysis completion  | Upload video Gemini           | Analyze video Gemini           |                                                                                                |
| Analyze video Gemini           | HTTP Request                    | Retrieve video analysis results from Gemini | Wait                         | Select Video Fields            |                                                                                                |
| Select Video Fields            | Set                            | Select relevant video ad fields              | Analyze video Gemini          | Merge Media Result             |                                                                                                |
| Merge Media Result             | Merge                          | Combine image and video ad data streams      | Select Image Fields, Select Video Fields | Aggregate                   |                                                                                                |
| Aggregate                     | Aggregate                      | Aggregate all ads insights                    | Merge Media Result            | Combine all Ads information into a single text string |                                                                                                |
| Combine all Ads information into a single text string | Set                            | Build final report string                      | Aggregate                    | AI Agent                      |                                                                                                |
| OpenAI Chat Model             | Langchain OpenAI Chat          | Summarize and generate report content        | AI Agent (input)              | Auto-fixing Output Parser      |                                                                                                |
| Structured Output Parser      | Langchain Output Parser        | Parse AI output into structured format        | OpenAI Chat Model             | Auto-fixing Output Parser      |                                                                                                |
| Auto-fixing Output Parser     | Langchain Output Parser Autofixing | Auto-correct parsing errors                   | Structured Output Parser      | AI Agent                      |                                                                                                |
| AI Agent                     | Langchain Agent                | Orchestrate AI tasks and prepare final report | Auto-fixing Output Parser     | Email the top job recommendations |                                                                                                |
| Email the top job recommendations | Gmail                         | Send final report email to user               | AI Agent                     | -                             |                                                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Form Trigger node**  
   - Type: Form Trigger  
   - Configure webhook to receive user email and Facebook Page URL inputs.

2. **Add HTTP Request node "Scrape ads"**  
   - Configure to call Apify or equivalent API to scrape Facebook ads from the submitted Page URL.  
   - Connect input from Form Trigger.

3. **Add Switch node "Split Image Ads & Video Ads"**  
   - Configure condition to check media type field in ads data.  
   - Connect input from "Scrape ads".

4. **Add two Set nodes for deduplication keys:**  
   - "Image duplicate key" for image ads branch: set unique key (e.g., image URL).  
   - "Image Duplicate Key" for video ads branch: set unique key (e.g., video URL or ID).  
   - Connect respective outputs from Switch node.

5. **Add Remove Duplicates nodes:**  
   - "Image Remove Duplicates" connected to "Image duplicate key".  
   - "Video Remove Duplicates" connected to "Image Duplicate Key".  
   - Configure deduplication field to the key set previously.

6. **Add Limit nodes to restrict ads to top 5:**  
   - "Image Limit 5" connected to "Image Remove Duplicates".  
   - "Video Limit 5" connected to "Video Remove Duplicates".  
   - Set limit to 5.

7. **Add OpenAI node "Analyze Image"**  
   - Configure with OpenAI Vision (GPT-4) credentials.  
   - Set prompt to analyze image ads creatively.  
   - Connect input from "Image Limit 5".

8. **Add Set node "Select Image Fields"**  
   - Select relevant fields from image analysis output for merging.  
   - Connect input from "Analyze Image".

9. **Add HTTP Request node "Download video"**  
   - Configure to download video ad files from URLs.  
   - Connect input from "Video Limit 5".

10. **Add HTTP Request node "Upload video Gemini"**  
    - Configure with Google Gemini API credentials.  
    - Upload downloaded video files.  
    - Connect input from "Download video".

11. **Add Wait node**  
    - Configure fixed delay or webhook wait to allow Gemini processing.  
    - Connect input from "Upload video Gemini".

12. **Add HTTP Request node "Analyze video Gemini"**  
    - Retrieve video analysis results using Gemini API.  
    - Connect input from "Wait".

13. **Add Set node "Select Video Fields"**  
    - Select relevant fields from Gemini video analysis output.  
    - Connect input from "Analyze video Gemini".

14. **Add Merge node "Merge Media Result"**  
    - Merge outputs from "Select Image Fields" and "Select Video Fields".  
    - Connect inputs accordingly.

15. **Add Aggregate node "Aggregate"**  
    - Aggregate merged ad insights into a single dataset.  
    - Connect input from "Merge Media Result".

16. **Add Set node "Combine all Ads information into a single text string"**  
    - Use expressions to concatenate and format aggregated insights into a report string.  
    - Connect input from "Aggregate".

17. **Add Langchain OpenAI Chat node "OpenAI Chat Model"**  
    - Configure with GPT-4 chat model and prompts for report generation.  
    - Connect input from "Combine all Ads information into a single text string".

18. **Add Langchain Output Parser "Structured Output Parser"**  
    - Configure schema for expected AI output.  
    - Connect input from "OpenAI Chat Model".

19. **Add Langchain Output Parser Autofixing node "Auto-fixing Output Parser"**  
    - Enable auto-fixing of parsing errors.  
    - Connect input from "Structured Output Parser".

20. **Add Langchain Agent node "AI Agent"**  
    - Configure to orchestrate AI outputs and prepare final email content.  
    - Connect input from "Auto-fixing Output Parser".

21. **Add Gmail node "Email the top job recommendations"**  
    - Configure with OAuth2 Gmail credentials.  
    - Set recipient email from form submission data.  
    - Use AI Agent output as email body.  
    - Connect input from "AI Agent".

22. **Set workflow execution order and test end-to-end.**

---

### 5. General Notes & Resources

| Note Content                                                                                                   | Context or Link                                                                                      |
|---------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| This workflow automates competitor Facebook ad analysis with AI and email reporting.                           | Workflow purpose summary.                                                                           |
| Customize AI prompts in OpenAI Vision and Gemini nodes to tailor analysis focus (branding, CTA, emotion).      | Customization instructions.                                                                         |
| Requires environment variables for API keys and OAuth2 credentials for OpenAI, Gemini, and Gmail nodes.        | Setup instructions.                                                                                  |
| Workflow uses Apify or similar service for Facebook ad scraping; ensure API access and rate limits are managed. | Data collection dependency.                                                                         |
| Video analysis uses asynchronous processing with wait node to handle Gemini API latency.                       | Integration detail.                                                                                  |
| Email node uses Gmail OAuth2; ensure correct scopes and consent for sending emails.                             | Credential configuration.                                                                           |
| Sticky notes in workflow provide contextual explanations for each logical block and node groupings.            | Workflow documentation aid.                                                                         |

---

This reference document fully describes the workflow structure, logic, and configuration, enabling advanced users and AI agents to understand, reproduce, and modify the Facebook Ads Competitor Creative Analysis & Automated Email Report workflow in n8n.