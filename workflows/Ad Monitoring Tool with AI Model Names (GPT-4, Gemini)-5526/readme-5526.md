Ad Monitoring Tool with AI Model Names (GPT-4, Gemini)

https://n8nworkflows.xyz/workflows/ad-monitoring-tool-with-ai-model-names--gpt-4--gemini--5526


# Ad Monitoring Tool with AI Model Names (GPT-4, Gemini)

### 1. Workflow Overview

This workflow is designed as an **Ad Monitoring Tool** leveraging AI models (notably GPT-4 and Gemini) to analyze advertisements collected from an ad library. It automatically scrapes ads, filters them based on engagement (likes), and processes them according to their media type: video, image, or text. Each ad type undergoes tailored AI-driven analysis to produce summaries stored in Google Sheets for further review.

The workflow logic is grouped into the following blocks:

- **1.1 Input Reception:** Manual trigger initiates the workflow.
- **1.2 Data Acquisition and Filtering:** Scrapes ad data, filters by likes.
- **1.3 Ad Type Dispatch:** Switch node routes ads into video, image, or text processing branches.
- **1.4 Video Ad Processing:** Downloads, uploads to Google Drive, uploads to Gemini AI for video analysis, then generates video summaries.
- **1.5 Image Ad Processing:** Uses OpenAI (GPT-4) to analyze images and generate summaries.
- **1.6 Text Ad Processing:** Uses OpenAI (GPT-4) to analyze text ads and generate summaries.
- **1.7 Data Persistence and Loop Management:** Stores analyzed data in Google Sheets, manages batch processing and wait nodes to regulate flow and timing.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:** Starts the workflow manually to initiate ad scraping and processing.
- **Nodes Involved:**  
  - When clicking ‘Execute workflow’

- **Node Details:**  
  - **When clicking ‘Execute workflow’**  
    - Type: Manual Trigger  
    - Role: Entry point, awaiting user manual start  
    - Configuration: Default manual trigger with no parameters  
    - Input: None  
    - Output: Triggers the next node to start scraping  
    - Edge Cases: Workflow will not start without manual execution  

#### 1.2 Data Acquisition and Filtering

- **Overview:** Scrapes ads from an external ad library API and filters ads to those with engagement (likes).
- **Nodes Involved:**  
  - Run Ad Library Scraper  
  - Filter For Likes

- **Node Details:**  
  - **Run Ad Library Scraper**  
    - Type: HTTP Request  
    - Role: Retrieves raw ad data from an external API (Ad Library)  
    - Configuration: Configured with API endpoint and parameters (not detailed in JSON)  
    - Input: Trigger from manual start  
    - Output: Raw ad dataset  
    - Failures: API connection failure, rate limits, malformed responses  
  - **Filter For Likes**  
    - Type: Filter  
    - Role: Filters ads based on presence or threshold of likes to focus on engaged content  
    - Configuration: Filter condition set to check likes count or engagement metric  
    - Input: Raw ad data  
    - Output: Filtered ads forwarded to Switch node  
    - Failures: Filter logic errors, empty dataset if no ads meet criteria  

#### 1.3 Ad Type Dispatch

- **Overview:** Routes filtered ads into distinct processing streams based on ad type (video, image, text).
- **Nodes Involved:**  
  - Switch

- **Node Details:**  
  - **Switch**  
    - Type: Switch  
    - Role: Routes data to different branches depending on ad type attribute  
    - Configuration: Conditions defined for video ads, image ads, and text ads  
    - Input: Filtered ads from Filter For Likes  
    - Output: Separate outputs for video, image, and text ad batches  
    - Failures: Misclassification if ad type field missing or malformed  

#### 1.4 Video Ad Processing

- **Overview:** Manages the download, storage, and AI analysis of video ads using Gemini AI and OpenAI.
- **Nodes Involved:**  
  - Loop Over Video Ads  
  - Download Video  
  - Upload Video to Drive  
  - Begin Gemini Upload Session  
  - Redownload Video  
  - Upload Video to Gemini  
  - Wait3  
  - Analyze Video with Gemini  
  - Output Video Summary  
  - Add as Type = Video  
  - Wait2

- **Node Details:**  
  - **Loop Over Video Ads**  
    - Type: SplitInBatches  
    - Role: Processes video ads one batch at a time  
    - Configuration: Batch size defined (not shown)  
    - Input: Video ads from Switch  
    - Output: Individual video ad data to Download Video  
  - **Download Video**  
    - Type: HTTP Request  
    - Role: Downloads video file from ad URL  
    - Configuration: URL dynamically set via expressions  
    - Input: Video ad data  
    - Output: Binary video file to Upload Video to Drive  
    - Failures: Download failures, URL errors, timeouts  
  - **Upload Video to Drive**  
    - Type: Google Drive  
    - Role: Uploads downloaded video for storage and access  
    - Configuration: Google Drive credentials required, target folder set  
    - Input: Binary video file  
    - Output: File metadata to Begin Gemini Upload Session  
    - Failures: Credential expiration, quota limits  
  - **Begin Gemini Upload Session**  
    - Type: HTTP Request  
    - Role: Initializes upload session with Gemini AI for video analysis  
    - Configuration: API endpoint and auth (likely OAuth or API key)  
    - Input: File metadata from Drive upload  
    - Output: Session info to Redownload Video  
    - Failures: Auth errors, session creation failure  
  - **Redownload Video**  
    - Type: Google Drive  
    - Role: Fetches the video again (likely to get direct download link or updated file)  
    - Configuration: Uses file ID or metadata from previous step  
    - Input: Gemini session info  
    - Output: Binary video file to Upload Video to Gemini  
    - Failures: Permission errors, file not found  
  - **Upload Video to Gemini**  
    - Type: HTTP Request  
    - Role: Uploads video binary to Gemini AI for processing  
    - Configuration: API upload endpoint, headers, and auth  
    - Input: Video binary  
    - Output: Confirmation to Wait3  
    - Failures: Upload timeout, API errors  
  - **Wait3**  
    - Type: Wait  
    - Role: Pauses workflow to allow Gemini to process video  
    - Configuration: Time delay (seconds or minutes)  
    - Input: Upload confirmation  
    - Output: Triggers Analyze Video with Gemini  
  - **Analyze Video with Gemini**  
    - Type: HTTP Request  
    - Role: Retrieves analysis results from Gemini AI  
    - Configuration: API endpoint, retry on failure enabled with 15s wait between tries  
    - Input: After wait  
    - Output: Analysis data to Output Video Summary  
    - Failures: Network errors, data format issues  
  - **Output Video Summary**  
    - Type: OpenAI (Langchain)  
    - Role: Generates natural language summary based on Gemini analysis using GPT-4  
    - Configuration: Model selection GPT-4, prompt templates (not shown)  
    - Input: Gemini analysis data  
    - Output: Text summary to Add as Type = Video  
  - **Add as Type = Video**  
    - Type: Google Sheets  
    - Role: Appends video ad summary and metadata to spreadsheet  
    - Configuration: Target Google Sheet and worksheet selected  
    - Input: Summary text  
    - Output: Triggers Wait2 for batch control  
  - **Wait2**  
    - Type: Wait  
    - Role: Controls pacing of video ad batches  
    - Configuration: Delay duration set (not shown)  
    - Input: After Google Sheets append  
    - Output: Triggers next batch in Loop Over Video Ads  

#### 1.5 Image Ad Processing

- **Overview:** Processes image ads by generating AI-based image analysis and summaries.
- **Nodes Involved:**  
  - Loop Over Image Ads  
  - Analyze Image  
  - Output Image Summary  
  - Add as Type = Image  
  - Wait1

- **Node Details:**  
  - **Loop Over Image Ads**  
    - Type: SplitInBatches  
    - Role: Batches image ads for sequential processing  
    - Input: Filtered image ads from Switch  
    - Output: Individual image ad data to Analyze Image  
  - **Analyze Image**  
    - Type: OpenAI (Langchain)  
    - Role: Performs AI-powered image analysis using GPT-4  
    - Configuration: Model and prompt suited for image content  
    - Input: Image ad data  
    - Output: Analysis to Output Image Summary  
  - **Output Image Summary**  
    - Type: OpenAI (Langchain)  
    - Role: Converts analysis into human-readable summary  
    - Input: Analysis data  
    - Output: Summary text to Add as Type = Image  
  - **Add as Type = Image**  
    - Type: Google Sheets  
    - Role: Stores image ad summaries into Google Sheets  
    - Input: Summary text  
    - Output: Triggers Wait1  
  - **Wait1**  
    - Type: Wait  
    - Role: Controls timing between image ad batches  
    - Input: After Google Sheets append  
    - Output: Triggers next batch in Loop Over Image Ads  

#### 1.6 Text Ad Processing

- **Overview:** Processes text ads by analyzing content using GPT-4 and saving results.
- **Nodes Involved:**  
  - Loop Over Text Ads  
  - Output Text Summary  
  - Add as Type = Text  
  - Wait

- **Node Details:**  
  - **Loop Over Text Ads**  
    - Type: SplitInBatches  
    - Role: Batches text ads for sequential AI processing  
    - Input: Filtered text ads from Switch  
    - Output: Individual text ad data to Output Text Summary  
  - **Output Text Summary**  
    - Type: OpenAI (Langchain)  
    - Role: Generates text ad summaries using GPT-4  
    - Input: Text ad data  
    - Output: Summary text to Add as Type = Text  
  - **Add as Type = Text**  
    - Type: Google Sheets  
    - Role: Inserts text ad summaries into Google Sheets  
    - Input: Summary text  
    - Output: Triggers Wait  
  - **Wait**  
    - Type: Wait  
    - Role: Controls batch processing pace for text ads  
    - Input: After Google Sheets append  
    - Output: Triggers next batch in Loop Over Text Ads  

---

### 3. Summary Table

| Node Name                 | Node Type                   | Functional Role                          | Input Node(s)                  | Output Node(s)                  | Sticky Note                   |
|---------------------------|-----------------------------|----------------------------------------|-------------------------------|--------------------------------|-------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger             | Manual start of workflow                | None                          | Run Ad Library Scraper          |                               |
| Run Ad Library Scraper     | HTTP Request                | Scrape ads from external ad library    | When clicking ‘Execute workflow’ | Filter For Likes                |                               |
| Filter For Likes           | Filter                      | Filters ads by likes engagement         | Run Ad Library Scraper          | Switch                         |                               |
| Switch                    | Switch                      | Routes ads by type (video, image, text) | Filter For Likes               | Loop Over Video Ads, Loop Over Image Ads, Loop Over Text Ads |                               |
| Loop Over Video Ads        | SplitInBatches              | Batch processing for video ads          | Switch                        | Download Video                 |                               |
| Download Video             | HTTP Request                | Downloads video file                     | Loop Over Video Ads            | Upload Video to Drive          |                               |
| Upload Video to Drive      | Google Drive                | Uploads video to Google Drive            | Download Video                | Begin Gemini Upload Session    |                               |
| Begin Gemini Upload Session| HTTP Request                | Starts upload session with Gemini AI    | Upload Video to Drive         | Redownload Video              |                               |
| Redownload Video           | Google Drive                | Downloads video file again from Drive   | Begin Gemini Upload Session   | Upload Video to Gemini         |                               |
| Upload Video to Gemini     | HTTP Request                | Uploads video to Gemini AI               | Redownload Video              | Wait3                         |                               |
| Wait3                     | Wait                        | Waits for Gemini to process video       | Upload Video to Gemini        | Analyze Video with Gemini      |                               |
| Analyze Video with Gemini  | HTTP Request                | Retrieves Gemini AI analysis results    | Wait3                        | Output Video Summary           |                               |
| Output Video Summary       | OpenAI (Langchain)          | Generates video summary with GPT-4      | Analyze Video with Gemini     | Add as Type = Video            |                               |
| Add as Type = Video        | Google Sheets               | Saves video summary to Google Sheets    | Output Video Summary          | Wait2                         |                               |
| Wait2                     | Wait                        | Controls video batch processing timing  | Add as Type = Video           | Loop Over Video Ads            |                               |
| Loop Over Image Ads        | SplitInBatches              | Batch processing for image ads          | Switch                       | Analyze Image                 |                               |
| Analyze Image             | OpenAI (Langchain)          | AI analysis of images via GPT-4         | Loop Over Image Ads           | Output Image Summary           |                               |
| Output Image Summary       | OpenAI (Langchain)          | Generates image summary                  | Analyze Image                | Add as Type = Image            |                               |
| Add as Type = Image        | Google Sheets               | Saves image summary to Google Sheets    | Output Image Summary          | Wait1                         |                               |
| Wait1                     | Wait                        | Controls image batch processing timing  | Add as Type = Image           | Loop Over Image Ads            |                               |
| Loop Over Text Ads         | SplitInBatches              | Batch processing for text ads           | Switch                       | Output Text Summary           |                               |
| Output Text Summary        | OpenAI (Langchain)          | Generates text ad summary using GPT-4   | Loop Over Text Ads            | Add as Type = Text             |                               |
| Add as Type = Text         | Google Sheets               | Saves text summary to Google Sheets     | Output Text Summary           | Wait                          |                               |
| Wait                      | Wait                        | Controls text batch processing timing   | Add as Type = Text            | Loop Over Text Ads             |                               |
| Sticky Note               | Sticky Note                 | Visual notes (content empty)             |                               |                                |                               |
| Sticky Note1              | Sticky Note                 | Visual notes (content empty)             |                               |                                |                               |
| Sticky Note2              | Sticky Note                 | Visual notes (content empty)             |                               |                                |                               |
| Sticky Note3              | Sticky Note                 | Visual notes (content empty)             |                               |                                |                               |
| Sticky Note4              | Sticky Note                 | Visual notes (content empty)             |                               |                                |                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Name: When clicking ‘Execute workflow’  
   - Type: Manual Trigger  
   - No parameters needed  

2. **Create HTTP Request Node for Ad Scraper**  
   - Name: Run Ad Library Scraper  
   - Type: HTTP Request  
   - Configure with ad library API endpoint, authentication as required  
   - Connect output from manual trigger to this node  

3. **Create Filter Node for Likes**  
   - Name: Filter For Likes  
   - Type: Filter  
   - Set filter condition to check likes count > threshold or presence of likes  
   - Connect input from Run Ad Library Scraper node  

4. **Create Switch Node for Ad Type Routing**  
   - Name: Switch  
   - Type: Switch  
   - Create conditions to route ads based on a field indicating type: 'video', 'image', 'text'  
   - Connect input from Filter For Likes node  

5. **Video Ads Branch:**  
   5.1 Create SplitInBatches node:  
       - Name: Loop Over Video Ads  
       - Type: SplitInBatches  
       - Set batch size (e.g., 1 or as desired)  
       - Connect from Switch video output  
   5.2 Create HTTP Request node:  
       - Name: Download Video  
       - Configure to download video file using URL from current batch item  
       - Connect from Loop Over Video Ads  
   5.3 Create Google Drive node:  
       - Name: Upload Video to Drive  
       - Configure with Google Drive OAuth2 credentials, target folder for uploads  
       - Connect from Download Video  
   5.4 Create HTTP Request node:  
       - Name: Begin Gemini Upload Session  
       - Configure Gemini AI API endpoint and auth for starting upload  
       - Connect from Upload Video to Drive  
   5.5 Create Google Drive node:  
       - Name: Redownload Video  
       - Configure to retrieve video file from Drive using ID or path from Gemini session  
       - Connect from Begin Gemini Upload Session  
   5.6 Create HTTP Request node:  
       - Name: Upload Video to Gemini  
       - Configure Gemini AI API upload endpoint with auth headers  
       - Connect from Redownload Video  
   5.7 Create Wait node:  
       - Name: Wait3  
       - Configure waiting duration to allow Gemini processing (e.g., 1-2 minutes)  
       - Connect from Upload Video to Gemini  
   5.8 Create HTTP Request node:  
       - Name: Analyze Video with Gemini  
       - Configure to retrieve analysis results from Gemini API  
       - Enable retry on failure with 15s between attempts  
       - Connect from Wait3  
   5.9 Create OpenAI node:  
       - Name: Output Video Summary  
       - Select GPT-4 model  
       - Configure prompt to generate video summary from Gemini analysis  
       - Connect from Analyze Video with Gemini  
   5.10 Create Google Sheets node:  
       - Name: Add as Type = Video  
       - Configure target Google Sheet and worksheet  
       - Connect from Output Video Summary  
   5.11 Create Wait node:  
       - Name: Wait2  
       - Configure delay to control batch processing rate  
       - Connect from Add as Type = Video  
   5.12 Connect Wait2 output back to Loop Over Video Ads to continue batches  

6. **Image Ads Branch:**  
   6.1 Create SplitInBatches node:  
       - Name: Loop Over Image Ads  
       - Connect from Switch image output  
   6.2 Create OpenAI node:  
       - Name: Analyze Image  
       - Use GPT-4 with image analysis prompt  
       - Connect from Loop Over Image Ads  
   6.3 Create OpenAI node:  
       - Name: Output Image Summary  
       - Generate summary text from analysis  
       - Connect from Analyze Image  
   6.4 Create Google Sheets node:  
       - Name: Add as Type = Image  
       - Configure target sheet and worksheet  
       - Connect from Output Image Summary  
   6.5 Create Wait node:  
       - Name: Wait1  
       - Set delay to manage batch processing  
       - Connect from Add as Type = Image  
   6.6 Connect Wait1 output back to Loop Over Image Ads  

7. **Text Ads Branch:**  
   7.1 Create SplitInBatches node:  
       - Name: Loop Over Text Ads  
       - Connect from Switch text output  
   7.2 Create OpenAI node:  
       - Name: Output Text Summary  
       - Use GPT-4 with prompt tailored to text ads  
       - Connect from Loop Over Text Ads  
   7.3 Create Google Sheets node:  
       - Name: Add as Type = Text  
       - Configure target sheet  
       - Connect from Output Text Summary  
   7.4 Create Wait node:  
       - Name: Wait  
       - Set batch pacing delay  
       - Connect from Add as Type = Text  
   7.5 Connect Wait output back to Loop Over Text Ads  

8. **Final workflow connections:**  
   - Connect manual trigger → Run Ad Library Scraper → Filter For Likes → Switch  
   - Connect Switch outputs to respective batch loops  

9. **Credential Setup:**  
   - Google Drive OAuth2 (for video file uploads/downloads)  
   - Google Sheets OAuth2 (for storing summaries)  
   - OpenAI API key (for GPT-4 access)  
   - Gemini AI API credentials for video analysis  

---

### 5. General Notes & Resources

| Note Content                                                                                     | Context or Link                                                                                     |
|-------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| Workflow uses GPT-4 for text and image ad analysis, Gemini AI for detailed video analysis.      | Workflow description                                                                                |
| Gemini upload session includes wait and retries to handle asynchronous video processing delays. | Important for ensuring reliable video AI results                                                  |
| Google Drive serves as intermediate storage for video files before AI processing.                | Integration between n8n and Drive is critical for file handling                                   |
| The workflow includes batch splitting and wait nodes to avoid API rate limits and overloads.    | Best practice for processing large ad sets                                                        |
| No sticky note content was provided in this workflow export.                                     | Sticky notes present but empty in the workflow JSON                                               |

---

**Disclaimer:** The provided text is exclusively generated from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data processed is legal and public.