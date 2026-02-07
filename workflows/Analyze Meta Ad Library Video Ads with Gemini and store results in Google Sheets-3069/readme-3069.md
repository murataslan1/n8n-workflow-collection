Analyze Meta Ad Library Video Ads with Gemini and store results in Google Sheets

https://n8nworkflows.xyz/workflows/analyze-meta-ad-library-video-ads-with-gemini-and-store-results-in-google-sheets-3069


# Analyze Meta Ad Library Video Ads with Gemini and store results in Google Sheets

### 1. Workflow Overview

This workflow automates the process of scraping video ads from Meta's Ad Library, analyzing their content using Google's Gemini AI, and storing the structured insights in Google Sheets. It is designed for marketers, analysts, and researchers who want to extract detailed information about video advertisements running on Facebook pages.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception and Initialization:** Triggering the workflow manually and setting initial parameters.
- **1.2 Scraping Meta Ad Library:** Retrieving video ads data from Meta's Ad Library via Apify.
- **1.3 Data Preparation and Filtering:** Calculating runtime, sorting, filtering for video ads, and limiting the number of videos to analyze.
- **1.4 Video Download and Format Adjustment:** Downloading video files and preparing them for AI analysis.
- **1.5 Video Upload and AI Analysis:** Uploading videos to Google Gemini, running content analysis, and parsing AI outputs.
- **1.6 Structuring and Storing Results:** Using an AI agent to structure the parsed data and saving it into Google Sheets.
- **1.7 Looping and Batch Processing:** Handling multiple videos in batches to manage workflow execution efficiently.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception and Initialization

- **Overview:** This block initiates the workflow manually and sets up initial parameters and prompts for the AI analysis.
- **Nodes Involved:**  
  - When clicking ‘Test workflow’  
  - Settings  
  - Clean Prompt

- **Node Details:**

  - **When clicking ‘Test workflow’**  
    - Type: Manual Trigger  
    - Role: Starts the workflow on user command.  
    - Configuration: Default manual trigger with no parameters.  
    - Inputs: None  
    - Outputs: Connects to Settings node.  
    - Edge Cases: None.

  - **Settings**  
    - Type: Set  
    - Role: Holds configuration variables such as AI prompts, API keys, or other parameters.  
    - Configuration: Stores static or dynamic values used downstream.  
    - Inputs: From manual trigger.  
    - Outputs: Connects to Clean Prompt node.  
    - Edge Cases: Missing or incorrect parameter values could cause downstream errors.

  - **Clean Prompt**  
    - Type: Code (JavaScript)  
    - Role: Processes or sanitizes prompt text before sending to scraping or AI nodes.  
    - Configuration: Custom code to clean or format prompt strings.  
    - Inputs: From Settings node.  
    - Outputs: Connects to Scrape Meta Ad Library with Apify node.  
    - Edge Cases: Code errors or unexpected input formats could cause failures.

---

#### 1.2 Scraping Meta Ad Library

- **Overview:** This block scrapes video ads from Meta's Ad Library using Apify's scraping service.
- **Nodes Involved:**  
  - Scrape Meta Ad Library with Apify  
  - Calculate Runtime in Days  
  - Sort by Reach or Days Running

- **Node Details:**

  - **Scrape Meta Ad Library with Apify**  
    - Type: HTTP Request  
    - Role: Calls Apify API to scrape ads data based on configured page ID and parameters.  
    - Configuration: HTTP method and URL set to Apify's Meta Ad Library scraper endpoint, with authentication and query parameters.  
    - Inputs: From Clean Prompt node.  
    - Outputs: Connects to Calculate Runtime in Days node.  
    - Edge Cases: API rate limits, authentication failures, network timeouts.

  - **Calculate Runtime in Days**  
    - Type: Set  
    - Role: Calculates how many days each ad has been running based on date fields.  
    - Configuration: Uses expressions to compute date differences.  
    - Inputs: From Scrape Meta Ad Library node.  
    - Outputs: Connects to Sort by Reach or Days Running node.  
    - Edge Cases: Missing or malformed date fields.

  - **Sort by Reach or Days Running**  
    - Type: Sort  
    - Role: Sorts ads by reach or days running to prioritize analysis.  
    - Configuration: Sort criteria set to reach or runtime days descending.  
    - Inputs: From Calculate Runtime in Days node.  
    - Outputs: Connects to Filter only Video Ads node.  
    - Edge Cases: Empty input data.

---

#### 1.3 Data Preparation and Filtering

- **Overview:** Filters the scraped ads to only include video ads and limits the number of videos to analyze.
- **Nodes Involved:**  
  - Filter only Video Ads  
  - Limit Videos to Analyze  
  - Pass relevant Fields

- **Node Details:**

  - **Filter only Video Ads**  
    - Type: Filter  
    - Role: Filters the dataset to retain only video ads based on media type or format fields.  
    - Configuration: Condition checks for video ad indicators.  
    - Inputs: From Sort by Reach or Days Running node.  
    - Outputs: Connects to Limit Videos to Analyze node.  
    - Edge Cases: Ads without media type info.

  - **Limit Videos to Analyze**  
    - Type: Limit  
    - Role: Restricts the number of video ads processed to a configured maximum.  
    - Configuration: Limit count set via parameters or defaults.  
    - Inputs: From Filter only Video Ads node.  
    - Outputs: Connects to Pass relevant Fields node.  
    - Edge Cases: Limit set too low or zero.

  - **Pass relevant Fields**  
    - Type: Set  
    - Role: Selects and formats only the necessary fields for downstream processing.  
    - Configuration: Sets key-value pairs for video URL, ad ID, metadata, etc.  
    - Inputs: From Limit Videos to Analyze node.  
    - Outputs: Connects to Loop Over Items node.  
    - Edge Cases: Missing expected fields.

---

#### 1.4 Video Download and Format Adjustment

- **Overview:** Downloads each video file and adjusts its file type to prepare for AI analysis.
- **Nodes Involved:**  
  - Loop Over Items  
  - Download File  
  - Change Filetype to Video

- **Node Details:**

  - **Loop Over Items**  
    - Type: SplitInBatches  
    - Role: Processes videos in batches to manage resource usage and API limits.  
    - Configuration: Batch size configured as needed.  
    - Inputs: From Pass relevant Fields node.  
    - Outputs: On first output, no connection; on second output, connects to Download File node.  
    - Edge Cases: Batch size too large causing timeouts.

  - **Download File**  
    - Type: HTTP Request  
    - Role: Downloads the video file from the URL provided in the ad data.  
    - Configuration: GET request with video URL, expects binary response.  
    - Inputs: From Loop Over Items node (second output).  
    - Outputs: Connects to Change Filetype to Video node.  
    - Edge Cases: Broken URLs, network errors, large file sizes.

  - **Change Filetype to Video**  
    - Type: Code (JavaScript)  
    - Role: Adjusts the downloaded file metadata to ensure it is recognized as a video file.  
    - Configuration: Custom code modifies file extension or MIME type.  
    - Inputs: From Download File node.  
    - Outputs: Connects to Upload Video to Gemini node.  
    - Edge Cases: File corruption or unsupported formats.

---

#### 1.5 Video Upload and AI Analysis

- **Overview:** Uploads the prepared video to Google Gemini AI, waits for processing, analyzes the video content, and parses the AI output.
- **Nodes Involved:**  
  - Upload Video to Gemini  
  - Pass Values for Gemini  
  - Wait for Upload Processing  
  - Analyze Video with Gemini  
  - Google Gemini Chat Model  
  - Structured Output Parser  
  - Structured Output Parsing Agent

- **Node Details:**

  - **Upload Video to Gemini**  
    - Type: HTTP Request  
    - Role: Uploads the video file to Gemini's API for analysis.  
    - Configuration: POST request with video binary data and authentication.  
    - Inputs: From Change Filetype to Video node.  
    - Outputs: Connects to Pass Values for Gemini node.  
    - Edge Cases: Upload failures, API limits.

  - **Pass Values for Gemini**  
    - Type: Set  
    - Role: Prepares and passes necessary parameters or IDs returned from upload for subsequent analysis calls.  
    - Configuration: Sets variables like upload ID or token.  
    - Inputs: From Upload Video to Gemini node.  
    - Outputs: Connects to Wait for Upload Processing node.  
    - Edge Cases: Missing upload confirmation.

  - **Wait for Upload Processing**  
    - Type: Wait  
    - Role: Pauses workflow to allow Gemini to process the uploaded video.  
    - Configuration: Wait time or webhook-based continuation.  
    - Inputs: From Pass Values for Gemini node.  
    - Outputs: Connects to Analyze Video with Gemini node.  
    - Edge Cases: Timeout if processing takes too long.

  - **Analyze Video with Gemini**  
    - Type: HTTP Request  
    - Role: Requests analysis results from Gemini API.  
    - Configuration: GET or POST request with upload ID, retrieves AI-generated insights.  
    - Inputs: From Wait for Upload Processing node.  
    - Outputs: Connects to Structured Output Parsing Agent node.  
    - Edge Cases: API errors, incomplete data.

  - **Google Gemini Chat Model**  
    - Type: Langchain Google Gemini Chat Model  
    - Role: Processes AI chat completions or prompts related to video analysis.  
    - Configuration: Uses Gemini credentials and configured prompts.  
    - Inputs: From Structured Output Parsing Agent node (ai_languageModel input).  
    - Outputs: Connects to Structured Output Parsing Agent node.  
    - Edge Cases: Authentication errors, rate limits.

  - **Structured Output Parser**  
    - Type: Langchain Structured Output Parser  
    - Role: Parses AI output into structured JSON or predefined schema.  
    - Configuration: Defines expected output format and validation.  
    - Inputs: From Structured Output Parsing Agent node (ai_outputParser input).  
    - Outputs: Connects to Structured Output Parsing Agent node.  
    - Edge Cases: Parsing failures due to unexpected AI output.

  - **Structured Output Parsing Agent**  
    - Type: Langchain Agent  
    - Role: Coordinates AI model and output parser to produce final structured data.  
    - Configuration: Combines chat model and output parser nodes.  
    - Inputs: From Analyze Video with Gemini node (main input), Google Gemini Chat Model (ai_languageModel), and Structured Output Parser (ai_outputParser).  
    - Outputs: Connects to Store Data node.  
    - Edge Cases: Agent execution failures, retry enabled.

---

#### 1.6 Structuring and Storing Results

- **Overview:** Stores the structured AI analysis results into a Google Sheet for further use.
- **Nodes Involved:**  
  - Store Data

- **Node Details:**

  - **Store Data**  
    - Type: Google Sheets  
    - Role: Appends or updates rows in a Google Sheet with the structured video ad analysis data.  
    - Configuration: Google Sheets credentials, spreadsheet ID, sheet name, and column mapping configured.  
    - Inputs: From Structured Output Parsing Agent node.  
    - Outputs: Connects back to Loop Over Items node to process next batch.  
    - Edge Cases: Authentication errors, quota limits, sheet access issues.

---

#### 1.7 Looping and Batch Processing

- **Overview:** Manages batch processing of multiple video ads to optimize workflow execution and resource usage.
- **Nodes Involved:**  
  - Loop Over Items

- **Node Details:**

  - **Loop Over Items**  
    - Type: SplitInBatches  
    - Role: Splits the list of videos into manageable batches for sequential processing.  
    - Configuration: Batch size set to control concurrency and API limits.  
    - Inputs: From Pass relevant Fields node and loops back from Store Data node.  
    - Outputs: First output is empty (used for loop control), second output feeds into Download File node.  
    - Edge Cases: Batch size misconfiguration causing delays or overload.

---

### 3. Summary Table

| Node Name                      | Node Type                             | Functional Role                              | Input Node(s)                      | Output Node(s)                     | Sticky Note                                                                                      |
|--------------------------------|-------------------------------------|----------------------------------------------|----------------------------------|----------------------------------|------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’   | Manual Trigger                      | Starts workflow manually                      | None                             | Settings                         |                                                                                                |
| Settings                       | Set                                 | Holds initial parameters and prompts         | When clicking ‘Test workflow’    | Clean Prompt                    |                                                                                                |
| Clean Prompt                   | Code                                | Cleans and formats prompts                     | Settings                        | Scrape Meta Ad Library with Apify |                                                                                                |
| Scrape Meta Ad Library with Apify | HTTP Request                      | Scrapes ads data from Meta via Apify          | Clean Prompt                   | Calculate Runtime in Days         |                                                                                                |
| Calculate Runtime in Days      | Set                                 | Calculates ad runtime in days                  | Scrape Meta Ad Library with Apify | Sort by Reach or Days Running    |                                                                                                |
| Sort by Reach or Days Running  | Sort                                | Sorts ads by reach or days running             | Calculate Runtime in Days       | Filter only Video Ads             |                                                                                                |
| Filter only Video Ads          | Filter                              | Filters dataset to only video ads              | Sort by Reach or Days Running   | Limit Videos to Analyze           |                                                                                                |
| Limit Videos to Analyze        | Limit                               | Limits number of videos to analyze             | Filter only Video Ads           | Pass relevant Fields             |                                                                                                |
| Pass relevant Fields           | Set                                 | Selects relevant fields for processing         | Limit Videos to Analyze         | Loop Over Items                  |                                                                                                |
| Loop Over Items               | SplitInBatches                      | Processes videos in batches                     | Pass relevant Fields, Store Data | Download File (second output)    |                                                                                                |
| Download File                 | HTTP Request                       | Downloads video files                           | Loop Over Items (second output) | Change Filetype to Video         |                                                                                                |
| Change Filetype to Video      | Code                               | Adjusts file metadata to video                  | Download File                  | Upload Video to Gemini           |                                                                                                |
| Upload Video to Gemini        | HTTP Request                      | Uploads video to Gemini AI                       | Change Filetype to Video        | Pass Values for Gemini           |                                                                                                |
| Pass Values for Gemini        | Set                                | Passes upload IDs and parameters for analysis  | Upload Video to Gemini          | Wait for Upload Processing       |                                                                                                |
| Wait for Upload Processing    | Wait                               | Waits for Gemini to process video               | Pass Values for Gemini          | Analyze Video with Gemini        |                                                                                                |
| Analyze Video with Gemini     | HTTP Request                      | Retrieves AI analysis results                    | Wait for Upload Processing      | Structured Output Parsing Agent  |                                                                                                |
| Google Gemini Chat Model      | Langchain Google Gemini Chat Model | Processes AI chat completions                    | Structured Output Parsing Agent (ai_languageModel) | Structured Output Parsing Agent |                                                                                                |
| Structured Output Parser      | Langchain Structured Output Parser | Parses AI output into structured format         | Structured Output Parsing Agent (ai_outputParser) | Structured Output Parsing Agent |                                                                                                |
| Structured Output Parsing Agent | Langchain Agent                  | Coordinates AI model and output parsing          | Analyze Video with Gemini, Google Gemini Chat Model, Structured Output Parser | Store Data                      | Retry enabled for robustness.                                                                  |
| Store Data                   | Google Sheets                      | Stores structured data into Google Sheets        | Structured Output Parsing Agent | Loop Over Items                 |                                                                                                |
| Sticky Note                  | Sticky Note                       | (Empty)                                         | None                           | None                           |                                                                                                |
| Sticky Note1                 | Sticky Note                       | (Empty)                                         | None                           | None                           |                                                                                                |
| Sticky Note2                 | Sticky Note                       | (Empty)                                         | None                           | None                           |                                                                                                |
| Sticky Note3                 | Sticky Note                       | (Empty)                                         | None                           | None                           |                                                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - Purpose: To start the workflow manually.

2. **Create Settings Node**  
   - Type: Set  
   - Configure parameters such as AI prompts, Meta page ID, max ads to scrape, Google Sheets spreadsheet ID, and any API keys.  
   - Connect Manual Trigger → Settings.

3. **Create Clean Prompt Node**  
   - Type: Code (JavaScript)  
   - Write code to sanitize and format the prompt or input parameters for scraping.  
   - Connect Settings → Clean Prompt.

4. **Create Scrape Meta Ad Library with Apify Node**  
   - Type: HTTP Request  
   - Configure to call Apify's Meta Ad Library scraper API with appropriate query parameters (e.g., page ID, ad type).  
   - Set authentication if required.  
   - Connect Clean Prompt → Scrape Meta Ad Library with Apify.

5. **Create Calculate Runtime in Days Node**  
   - Type: Set  
   - Use expressions to calculate the number of days each ad has been running based on start and end dates.  
   - Connect Scrape Meta Ad Library with Apify → Calculate Runtime in Days.

6. **Create Sort by Reach or Days Running Node**  
   - Type: Sort  
   - Configure to sort ads descending by reach or days running.  
   - Connect Calculate Runtime in Days → Sort by Reach or Days Running.

7. **Create Filter only Video Ads Node**  
   - Type: Filter  
   - Set condition to only pass ads where media type or format indicates video.  
   - Connect Sort by Reach or Days Running → Filter only Video Ads.

8. **Create Limit Videos to Analyze Node**  
   - Type: Limit  
   - Set maximum number of videos to process (configurable).  
   - Connect Filter only Video Ads → Limit Videos to Analyze.

9. **Create Pass relevant Fields Node**  
   - Type: Set  
   - Select and map fields needed for video processing (e.g., video URL, ad ID).  
   - Connect Limit Videos to Analyze → Pass relevant Fields.

10. **Create Loop Over Items Node**  
    - Type: SplitInBatches  
    - Set batch size (e.g., 1 or more depending on API limits).  
    - Connect Pass relevant Fields → Loop Over Items.

11. **Create Download File Node**  
    - Type: HTTP Request  
    - Configure GET request to download video file from URL.  
    - Set response to binary.  
    - Connect Loop Over Items (second output) → Download File.

12. **Create Change Filetype to Video Node**  
    - Type: Code (JavaScript)  
    - Write code to adjust file metadata to ensure it is recognized as a video file.  
    - Connect Download File → Change Filetype to Video.

13. **Create Upload Video to Gemini Node**  
    - Type: HTTP Request  
    - Configure POST request to Google Gemini API endpoint for video upload.  
    - Include authentication credentials (Google Gemini API key or OAuth2).  
    - Connect Change Filetype to Video → Upload Video to Gemini.

14. **Create Pass Values for Gemini Node**  
    - Type: Set  
    - Extract and set upload ID or token from upload response for further analysis.  
    - Connect Upload Video to Gemini → Pass Values for Gemini.

15. **Create Wait for Upload Processing Node**  
    - Type: Wait  
    - Configure wait time or webhook to pause until Gemini finishes processing.  
    - Connect Pass Values for Gemini → Wait for Upload Processing.

16. **Create Analyze Video with Gemini Node**  
    - Type: HTTP Request  
    - Configure request to Gemini API to retrieve analysis results using upload ID.  
    - Connect Wait for Upload Processing → Analyze Video with Gemini.

17. **Create Google Gemini Chat Model Node**  
    - Type: Langchain Google Gemini Chat Model  
    - Configure with Google Gemini credentials and AI prompt settings.  
    - Connect Structured Output Parsing Agent (ai_languageModel input).

18. **Create Structured Output Parser Node**  
    - Type: Langchain Structured Output Parser  
    - Define expected output schema for AI results.  
    - Connect Structured Output Parsing Agent (ai_outputParser input).

19. **Create Structured Output Parsing Agent Node**  
    - Type: Langchain Agent  
    - Connect Analyze Video with Gemini (main input), Google Gemini Chat Model (ai_languageModel), and Structured Output Parser (ai_outputParser).  
    - Enable retry on failure.  
    - Connect Analyze Video with Gemini → Structured Output Parsing Agent.

20. **Create Store Data Node**  
    - Type: Google Sheets  
    - Configure Google Sheets credentials, spreadsheet ID, sheet name, and column mappings for structured data.  
    - Connect Structured Output Parsing Agent → Store Data.

21. **Connect Store Data → Loop Over Items (first output)**  
    - To continue processing next batch of videos.

22. **Test the workflow**  
    - Ensure all credentials (Apify, Google Gemini, Google Sheets) are correctly configured.  
    - Run the workflow manually and monitor logs for errors.

---

This completes the detailed documentation and reproduction instructions for the "Analyze Meta Ad Library Video Ads with Gemini and store results in Google Sheets" workflow.