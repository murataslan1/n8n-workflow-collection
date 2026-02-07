Automate VIRAL Youtube Titles & Thumbnails Creation (FLUX.1 + Apify)

https://n8nworkflows.xyz/workflows/automate-viral-youtube-titles---thumbnails-creation--flux-1---apify--4504


# Automate VIRAL Youtube Titles & Thumbnails Creation (FLUX.1 + Apify)

### 1. Workflow Overview

This workflow automates the creation of viral YouTube video titles and thumbnails based on a given content idea. It leverages AI language models and the Apify YouTube scraper to discover relevant video data, analyze top-performing content, and generate optimized titles and thumbnails. The workflow is designed for YouTube content creators seeking to enhance video engagement through data-driven, AI-assisted creativity.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception**: Accepts a raw content idea as input.
- **1.2 Keyword Generation & YouTube Scraping**: Uses AI to create search keywords from the input idea, then queries Apify’s YouTube scraper with these keywords.
- **1.3 Dataset Completion Polling**: Waits for the Apify scraping job to finish.
- **1.4 Data Retrieval & Performance Calculation**: Fetches the scraped video dataset, calculates an estimated Click-Through-Rate (CTR) metric, then filters for top-performing videos.
- **1.5 Title Pattern Analysis & Generation**: Analyzes top titles to extract effective patterns and generates new optimized titles.
- **1.6 Thumbnail Analysis & Generation**: Analyzes thumbnails of top videos, crafts a prompt for thumbnail generation, then generates a viral thumbnail image.
- **1.7 Output Preparation**: Combines generated titles and thumbnail into an HTML page for review.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
This block captures the initial content idea for which viral titles and thumbnails will be generated.

**Nodes Involved:**  
- When clicking ‘Test workflow’ (Manual Trigger)  
- Content Idea (Set Node)  
- Sticky Note3 (Instructional Note)

**Node Details:**  

- **When clicking ‘Test workflow’**  
  - Type: Manual Trigger  
  - Purpose: Entry point to manually start the workflow.  
  - Inputs: None  
  - Outputs: Triggers next node "Content Idea".  
  - Failure Modes: User must manually trigger; no automated input here.

- **Content Idea**  
  - Type: Set  
  - Purpose: Stores raw content idea JSON with key `query`.  
  - Configuration: Manually set the query text, e.g., `"create viral title and thumbnail in n8n"`.  
  - Inputs: Trigger from manual node.  
  - Outputs: JSON containing content idea for downstream usage.  
  - Failure Modes: If incorrectly formatted, downstream nodes expecting `query` will fail.

- **Sticky Note3**  
  - Purpose: Explains that users should enter content ideas in raw format here.  
  - Context: User guidance.

---

#### 1.2 Keyword Generation & YouTube Scraping

**Overview:**  
Generates three targeted keywords from the content idea using a large language model (LLM), then invokes Apify’s YouTube scraper API to retrieve relevant videos.

**Nodes Involved:**  
- Create Keywords (Langchain LLM Chain)  
- Structured Output Parser (Langchain Structured Parser)  
- Wait1 (Wait Node)  
- YTB Search Scrape (HTTP Request to Apify)  
- Sticky Note4, Sticky Note2

**Node Details:**  

- **Create Keywords**  
  - Type: Langchain Chain LLM  
  - Role: Takes the content idea and extracts exactly three keyword phrases (1–5 words each) optimized for YouTube search relevance and actionability.  
  - Configuration: Prompt instructs to output only three keywords without explanation.  
  - Variables: Uses `{{ $json.query }}` from Content Idea node.  
  - Inputs: JSON with content idea.  
  - Outputs: Structured JSON with keys `Keyword1`, `Keyword2`, `Keyword3`.  
  - Failures: LLM API errors, malformed content idea, parsing errors.  
  - Version: Uses Langchain v1.5 with an output parser.

- **Structured Output Parser**  
  - Type: Langchain Output Parser  
  - Role: Parses the LLM output into JSON schema with three keyword strings.  
  - Configuration: JSON schema example containing three keywords.  
  - Inputs/Outputs: Connects as output parser for Create Keywords node.

- **Wait1**  
  - Type: Wait  
  - Role: Provides delay before scraping request, can be used to throttle API calls or allow prior steps to settle.  
  - Inputs: From Create Keywords.  
  - Outputs: To YTB Search Scrape.

- **YTB Search Scrape**  
  - Type: HTTP Request  
  - Role: Calls Apify YouTube scraper API to perform video search for the three keywords.  
  - Configuration: POST request with JSON body specifying filters: videos from past year, length between 4-20 minutes, max 10 results per keyword, sorted by relevance.  
  - Headers: Content-Type application/json  
  - URL: `https://api.apify.com/v2/acts/streamers~youtube-scraper/runs?token=[YOUR_API_TOKEN]` (user must replace token).  
  - Inputs: Keywords from previous parser node.  
  - Outputs: Starts scraping job, response includes job status.  
  - Failures: API token invalid, network errors, rate limiting.

- **Sticky Notes 2 and 4**  
  - Provide setup instructions and explain the keyword creation and scraping process.

---

#### 1.3 Dataset Completion Polling

**Overview:**  
Polls Apify API repeatedly until the scraping job completes successfully.

**Nodes Involved:**  
- Check IF Finished (HTTP Request)  
- If (Conditional)  
- Wait2 (Wait Node)  
- Sticky Note5

**Node Details:**  

- **Check IF Finished**  
  - Type: HTTP Request  
  - Role: Queries Apify API for the status of the latest scraping job.  
  - URL: `https://api.apify.com/v2/acts/streamers~youtube-scraper/runs/last?token=[YOUR_API_TOKEN]`  
  - Inputs: Triggered after YTB Search Scrape.  
  - Outputs: JSON with `data.status` field indicating job status.

- **If**  
  - Type: Conditional  
  - Role: Checks if `data.status` equals `"SUCCEEDED"`.  
  - Inputs: Output of Check IF Finished.  
  - Outputs: If true, continues to retrieve dataset; if false, loops back to Wait2 node.

- **Wait2**  
  - Type: Wait  
  - Role: Delay between polling attempts to avoid excessive requests.

- **Sticky Note5**  
  - Explains this block’s purpose to wait for dataset completion in Apify.

- **Failure Modes:**  
  - API failures or job stuck indefinitely could cause infinite loops.  
  - Network errors or incorrect API token.

---

#### 1.4 Data Retrieval & Performance Calculation

**Overview:**  
Retrieves the dataset of scraped videos, calculates an estimated CTR-like metric (RPI - Relative Performance Index), and filters the top-performing videos.

**Nodes Involved:**  
- Get DataSet (HTTP Request)  
- Calculate CTR (Code)  
- Merge Data (Merge Node)  
- Keep Top Performing Videos (Filter Node)  
- Merge Data connections  

- Sticky Note6

**Node Details:**  

- **Get DataSet**  
  - Type: HTTP Request  
  - Role: Fetches the dataset items from the completed Apify scraping job.  
  - URL: `https://api.apify.com/v2/acts/streamers~youtube-scraper/runs/last/dataset/items?token=[YOUR_API_TOKEN]`  
  - Inputs: Triggered on successful scraping completion.  
  - Outputs: JSON array of video metadata.

- **Calculate CTR**  
  - Type: Code (JavaScript)  
  - Role: For each video, computes a pseudo-CTR metric based on views, subscribers, likes, comments, and video age.  
  - Logic:  
    - Defensive checks for missing or invalid data.  
    - Calculates days since video upload.  
    - Computes RPI = (views/subscribers) * ((likes + comments) / views / 10).  
    - Applies exponential decay based on video age.  
    - Returns ctrPercent as a percentage.  
  - Inputs: Each video item JSON.  
  - Outputs: Adds `ctrPercent` field for filtering.  
  - Edge Cases: Missing data, invalid dates, zero division.

- **Merge Data**  
  - Type: Merge  
  - Role: Combines original dataset items with calculated CTR results by position.  
  - Inputs: From Get DataSet and Calculate CTR nodes.

- **Keep Top Performing Videos**  
  - Type: Filter  
  - Role: Filters videos where `ctrPercent` > 0.1 (adjustable threshold).  
  - Inputs: Merged data with CTR.  
  - Outputs: High-performing videos for further analysis.  
  - Failures: If no videos pass filter, downstream nodes receive empty input.

- **Sticky Note6**  
  - Instructions about adjusting CTR calculation and filtering threshold.

---

#### 1.5 Title Pattern Analysis & Generation

**Overview:**  
Analyzes titles of top videos to identify effective patterns, then instructs an LLM to generate five new viral titles matching those patterns.

**Nodes Involved:**  
- Loop Over Items (Split in Batches)  
- Create List of Titles (Code)  
- Analyze Pattern & Create Prompt (Langchain Chain LLM)  
- Wait (Wait Node)  
- Create Titles (Langchain Chain LLM)  
- Structured Output Parser1 (Langchain Output Parser)  
- Merge  
- Sticky Note7

**Node Details:**  

- **Loop Over Items**  
  - Type: Split in Batches  
  - Role: Processes each filtered video item individually for analysis.  
  - Inputs: Filtered top videos.  
  - Outputs: Individual video items to "Create List of Analysis" and "Analyze Image".

- **Create List of Titles**  
  - Type: Code  
  - Role: Aggregates titles from filtered videos into an array.  
  - Outputs: JSON with `titles` array.

- **Analyze Pattern & Create Prompt**  
  - Type: Langchain Chain LLM  
  - Role: Analyzes the list of top video titles to identify recurring patterns, structures, and hooks that contribute to virality.  
  - Configuration: Detailed prompt instructing the LLM to summarize patterns and create a prompt for generating new titles.  
  - Inputs: Array of titles and original content idea.  
  - Outputs: Prompt text for title generation.

- **Wait**  
  - Type: Wait  
  - Role: Pause before sending prompt to create titles, ensures rate limits or logical separation.

- **Create Titles**  
  - Type: Langchain Chain LLM  
  - Role: Generates 5 new YouTube titles based on the prompt from the previous step.  
  - Outputs: JSON with keys `title1` to `title5`.  
  - Output parsed by Structured Output Parser1.

- **Structured Output Parser1**  
  - Type: Langchain Output Parser  
  - Role: Parses LLM output into structured JSON containing five titles.

- **Merge**  
  - Type: Merge  
  - Role: Combines titles with generated thumbnail data later.

- **Sticky Note7**  
  - Explains the title pattern analysis and generation process.

---

#### 1.6 Thumbnail Analysis & Generation

**Overview:**  
Analyzes thumbnails of top videos to extract key visual elements, generates a prompt for a thumbnail generation model, then creates a new thumbnail image.

**Nodes Involved:**  
- Analyze Image (Langchain OpenAI Image Analysis)  
- Create List of Analysis (Code)  
- Create Prompt (Langchain Chain LLM)  
- Wait4 (Wait Node)  
- Generate Image (HTTP Request to HuggingFace FLUX.1 model)  
- Convert to Base64 (Extract from File)  
- Sticky Note8

**Node Details:**  

- **Analyze Image**  
  - Type: Langchain OpenAI (Vision Instruct model)  
  - Role: Receives thumbnail URL and content idea; returns detailed text analysis of thumbnail’s visual composition and effectiveness.  
  - Inputs: Thumbnail URL from video metadata, content idea.  
  - Outputs: Text description of thumbnail visual features.  
  - Failures: Image URL inaccessible, API errors.

- **Create List of Analysis**  
  - Type: Code  
  - Role: Aggregates thumbnail analysis texts into an array.  
  - Outputs: JSON with `analysis` array.

- **Create Prompt**  
  - Type: Langchain Chain LLM  
  - Role: Summarizes common visual elements from thumbnail analyses and generates a concise image prompt (max 400 characters) to guide thumbnail generation.  
  - Inputs: Content idea and aggregated analyses.  
  - Outputs: Thumbnail generation prompt text.

- **Wait4**  
  - Type: Wait  
  - Role: Delay before calling image generation API.

- **Generate Image**  
  - Type: HTTP Request  
  - Role: Calls HuggingFace inference API (FLUX.1 model) to generate a 1280x720 PNG thumbnail image based on the prompt.  
  - Headers: Authorization Bearer token required.  
  - Inputs: JSON with prompt text, image dimensions, inference parameters.  
  - Outputs: PNG file binary data.

- **Convert to Base64**  
  - Type: Extract From File  
  - Role: Converts binary image to Base64 string for embedding in HTML.  
  - Outputs: JSON with Base64 image data.

- **Sticky Note8**  
  - Explains the thumbnail analysis and generation steps.

---

#### 1.7 Output Preparation

**Overview:**  
Combines generated titles and thumbnail image into a styled HTML page for display.

**Nodes Involved:**  
- Merge (from titles and thumbnail)  
- HTML (HTML Node)  
- Sticky Note9

**Node Details:**  

- **Merge**  
  - Type: Merge  
  - Role: Combines JSON of generated titles and Base64 thumbnail image.  
  - Inputs: From Create Titles and Convert to Base64.  
  - Outputs: Combined data for HTML rendering.

- **HTML**  
  - Type: HTML Node  
  - Role: Creates an HTML document embedding the Base64 thumbnail image and lists the five generated titles.  
  - Configuration: Uses template with placeholders for image and titles.  
  - Outputs: HTML content that can be previewed or sent elsewhere.

- **Sticky Note9**  
  - Describes that this block outputs the final HTML page with titles and thumbnail.

---

### 3. Summary Table

| Node Name                  | Node Type                          | Functional Role                              | Input Node(s)              | Output Node(s)                     | Sticky Note                                                                                 |
|----------------------------|----------------------------------|----------------------------------------------|----------------------------|----------------------------------|---------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’ | Manual Trigger                   | Manual start trigger                         | -                          | Content Idea                     |                                                                                             |
| Content Idea               | Set                              | Defines raw content idea input                | When clicking ‘Test workflow’ | Create Keywords                  | ## 1- Input Enter your content idea in the Edit Fields node in a "raw" format.              |
| Create Keywords            | Langchain Chain LLM               | Extracts 3 keywords from content idea        | Content Idea                | Structured Output Parser          | ## 2- Create DataSet LLM create 3 keywords request based on the idea and Apify scrape YTB Search |
| Structured Output Parser   | Langchain Output Parser           | Parses keywords JSON from LLM                 | Create Keywords             | Create Keywords                  |                                                                                             |
| Wait1                      | Wait                             | Delay before scraping request                 | Create Keywords             | YTB Search Scrape                | ## 2- Create DataSet LLM create 3 keywords request based on the idea and Apify scrape YTB Search |
| YTB Search Scrape          | HTTP Request                     | Calls Apify API to scrape YouTube videos     | Wait1                      | Check IF Finished                | ## 2- Create DataSet LLM create 3 keywords request based on the idea and Apify scrape YTB Search |
| Check IF Finished          | HTTP Request                     | Polls Apify job status                         | YTB Search Scrape           | If                            | ## 3 - Wait for DataSet Completion Wait until the dataset is completed in Apify               |
| If                         | If                               | Checks if Apify scraping succeeded            | Check IF Finished           | Get DataSet / Wait2             | ## 3 - Wait for DataSet Completion Wait until the dataset is completed in Apify               |
| Wait2                      | Wait                             | Wait between polling attempts                  | If                         | Check IF Finished              | ## 3 - Wait for DataSet Completion Wait until the dataset is completed in Apify               |
| Get DataSet                | HTTP Request                     | Retrieves scraped video dataset                | If                         | Calculate CTR                   | ## 4- Filter Performing Videos Retrieve Dataset from Apify, calculate approx CTR & filter    |
| Calculate CTR              | Code                             | Computes estimated CTR-like metric             | Get DataSet                 | Merge Data / Calculate CTR       | ## 4- Filter Performing Videos Retrieve Dataset from Apify, calculate approx CTR & filter    |
| Merge Data                 | Merge                            | Combines video data with CTR scores            | Get DataSet, Calculate CTR  | Keep Top Performing Videos       | ## 4- Filter Performing Videos Retrieve Dataset from Apify, calculate approx CTR & filter    |
| Keep Top Performing Videos | Filter                           | Filters videos by CTR threshold                 | Merge Data                  | Loop Over Items                 | ## 4- Filter Performing Videos Retrieve Dataset from Apify, calculate approx CTR & filter    |
| Loop Over Items            | Split in Batches                 | Processes each video item separately            | Keep Top Performing Videos  | Create List of Analysis, Analyze Image | ## 6- Generate Thumbnail LLM analyze thumbnails & create prompt                             |
| Create List of Analysis    | Code                             | Aggregates thumbnail analyses                   | Loop Over Items             | Create Prompt                  | ## 6- Generate Thumbnail LLM analyze thumbnails & create prompt                             |
| Analyze Image              | Langchain OpenAI (Image Analyze) | Analyzes visual elements of thumbnails         | Loop Over Items             | Wait3                         | ## 6- Generate Thumbnail LLM analyze thumbnails & create prompt                             |
| Wait3                      | Wait                             | Pause before prompt creation                     | Analyze Image               | Mistral Cloud Chat Model3       | ## 6- Generate Thumbnail LLM analyze thumbnails & create prompt                             |
| Create Prompt              | Langchain Chain LLM              | Summarizes thumbnail analyses & creates image prompt | Create List of Analysis     | Wait4                         | ## 6- Generate Thumbnail LLM analyze thumbnails & create prompt                             |
| Wait4                      | Wait                             | Pause before image generation                    | Create Prompt               | Generate Image                 | ## 6- Generate Thumbnail LLM analyze thumbnails & create prompt                             |
| Generate Image             | HTTP Request                    | Calls HuggingFace FLUX.1 model to generate image | Wait4                       | Convert to Base64              | ## 6- Generate Thumbnail LLM analyze thumbnails & create prompt                             |
| Convert to Base64          | Extract From File               | Converts binary image file to Base64 string      | Generate Image              | Merge                        | ## 7- Output Return titles and thumbnail in a HTML Page                                    |
| Create List of Titles      | Code                             | Aggregates titles from filtered videos          | Keep Top Performing Videos  | Analyze Pattern & Create Prompt  | ## 5- Generate Titles LLM analyze title patterns & create prompt for new titles            |
| Analyze Pattern & Create Prompt | Langchain Chain LLM          | Analyzes titles for patterns & creates generation prompt | Create List of Titles       | Wait                          | ## 5- Generate Titles LLM analyze title patterns & create prompt for new titles            |
| Wait                       | Wait                             | Pause before title generation                      | Analyze Pattern & Create Prompt | Create Titles               | ## 5- Generate Titles LLM analyze title patterns & create prompt for new titles            |
| Create Titles              | Langchain Chain LLM              | Generates 5 new video titles                      | Wait                       | Structured Output Parser1       | ## 5- Generate Titles LLM analyze title patterns & create prompt for new titles            |
| Structured Output Parser1  | Langchain Output Parser          | Parses generated titles JSON                       | Create Titles              | Merge                        | ## 5- Generate Titles LLM analyze title patterns & create prompt for new titles            |
| Merge                      | Merge                            | Combines titles and thumbnail Base64 image        | Structured Output Parser1, Convert to Base64 | HTML                      | ## 7- Output Return titles and thumbnail in a HTML Page                                    |
| HTML                       | HTML                            | Creates final HTML page with titles and thumbnail  | Merge                      | -                            | ## 7- Output Return titles and thumbnail in a HTML Page                                    |
| Sticky Note (multiple)     | Sticky Note                     | Various instructional and setup notes             | -                          | -                            | See notes section for details                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - Purpose: Start workflow manually.

2. **Create Set Node named “Content Idea”**  
   - Set JSON with key `query` and the raw content idea string (e.g., `"create viral title and thumbnail in n8n"`).  
   - Connect Manual Trigger → Content Idea.

3. **Add Langchain Chain LLM Node “Create Keywords”**  
   - Purpose: Generate 3 keywords from content idea.  
   - Prompt: Use the provided prompt instructing extraction of 3 keyword phrases relevant to YouTube.  
   - Input: `{{ $json.query }}` from Content Idea.  
   - Enable structured output parser with JSON schema for three keywords.  
   - Connect Content Idea → Create Keywords.

4. **Add Langchain Output Parser Node “Structured Output Parser”**  
   - Use JSON schema example with keys: Keyword1, Keyword2, Keyword3.  
   - Connect as output parser for Create Keywords.

5. **Add Wait Node “Wait1”**  
   - Default wait time (or minimal).  
   - Connect Create Keywords → Wait1.

6. **Add HTTP Request Node “YTB Search Scrape”**  
   - POST to Apify YouTube scraper API URL with your API token.  
   - JSON body includes filters: dateFilter=year, lengthFilter=between420, maxResults=10, searchQueries = [Keyword1, Keyword2, Keyword3], sortingOrder=relevance.  
   - Set Content-Type header: application/json.  
   - Connect Wait1 → YTB Search Scrape.

7. **Add HTTP Request Node “Check IF Finished”**  
   - GET latest Apify scraping job status endpoint.  
   - Connect YTB Search Scrape → Check IF Finished.

8. **Add If Node “If”**  
   - Condition: Check if `{{$json.data.status}} === "SUCCEEDED"`.  
   - Connect Check IF Finished → If.

9. **Add Wait Node “Wait2”**  
   - Default wait (e.g., 10 seconds or as desired).  
   - Connect If (False) → Wait2, and Wait2 → Check IF Finished (loop).

10. **Add HTTP Request Node “Get DataSet”**  
    - GET latest dataset items from Apify scraping job.  
    - Connect If (True) → Get DataSet.

11. **Add Code Node “Calculate CTR”**  
    - JavaScript code provided to compute pseudo-CTR metric for each video item.  
    - Connect Get DataSet → Calculate CTR.

12. **Add Merge Node “Merge Data”**  
    - Mode: Combine by position (default).  
    - Connect Get DataSet → Merge Data (Input 1).  
    - Connect Calculate CTR → Merge Data (Input 2).

13. **Add Filter Node “Keep Top Performing Videos”**  
    - Condition: `ctrPercent > 0.1` (adjustable threshold).  
    - Connect Merge Data → Keep Top Performing Videos.

14. **Add SplitInBatches Node “Loop Over Items”**  
    - No configured batch size or default.  
    - Connect Keep Top Performing Videos → Loop Over Items.

15. **Add Code Node “Create List of Titles”**  
    - Aggregates titles from filtered videos into an array.  
    - Connect Keep Top Performing Videos → Create List of Titles.

16. **Add Langchain Chain LLM Node “Analyze Pattern & Create Prompt”**  
    - Input: List of titles from previous step.  
    - Prompt: Analyze patterns in titles and create a prompt for new title generation as per detailed prompt.  
    - Connect Create List of Titles → Analyze Pattern & Create Prompt.

17. **Add Wait Node “Wait”**  
    - Short wait before title generation.  
    - Connect Analyze Pattern & Create Prompt → Wait.

18. **Add Langchain Chain LLM Node “Create Titles”**  
    - Use prompt from previous step to generate 5 new titles.  
    - Enable structured output parser (next step).  
    - Connect Wait → Create Titles.

19. **Add Langchain Output Parser Node “Structured Output Parser1”**  
    - JSON schema for 5 titles: title1 to title5.  
    - Connect Create Titles → Structured Output Parser1.

20. **Add Code Node “Create List of Analysis”**  
    - Aggregates thumbnail analysis texts (will be connected later).  
    - Connect Loop Over Items → Create List of Analysis.

21. **Add Langchain OpenAI Node “Analyze Image”**  
    - Model: meta-llama/llama-3.2-11b-vision-instruct (free).  
    - Input: Video thumbnail URL and content idea.  
    - Role: Analyze thumbnail visual elements.  
    - Connect Loop Over Items → Analyze Image.

22. **Add Wait Node “Wait3”**  
    - Wait before prompt creation.  
    - Connect Analyze Image → Wait3.

23. **Add Langchain Chain LLM Node “Create Prompt”**  
    - Input: Aggregated thumbnail analyses and content idea.  
    - Prompt: Summarize visual features and generate a concise image prompt (max 400 characters).  
    - Connect Create List of Analysis → Create Prompt.

24. **Add Wait Node “Wait4”**  
    - Pause before image generation.  
    - Connect Create Prompt → Wait4.

25. **Add HTTP Request Node “Generate Image”**  
    - POST to HuggingFace FLUX.1 model inference endpoint.  
    - Headers: Authorization Bearer with your HuggingFace token.  
    - JSON body: includes prompt text, size 1280x720, inference parameters.  
    - Connect Wait4 → Generate Image.

26. **Add Extract From File Node “Convert to Base64”**  
    - Converts PNG binary to Base64 string.  
    - Connect Generate Image → Convert to Base64.

27. **Add Merge Node “Merge”**  
    - Combines generated titles and Base64 image data.  
    - Connect Structured Output Parser1 → Merge (Input 1).  
    - Connect Convert to Base64 → Merge (Input 2).

28. **Add HTML Node “HTML”**  
    - Creates an HTML document embedding the Base64 thumbnail and listing the five titles formatted nicely.  
    - Connect Merge → HTML.

29. **Add Sticky Notes**  
    - Add sticky notes for user instructions and overview, using the provided content.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                          | Context or Link                                                                                     |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| **How this is Working ?** Steps overview and links to YouTube tutorial and support forms.                                                                                                                                           | https://youtu.be/Upuj9Pi94g0, https://tally.so/r/wayeqB, https://n8n.io/creators/nasser/           |
| **Setup Instructions** for input content idea, keyword count adjustment, API token replacements, and output customization.                                                                                                         | Apify API docs: https://docs.apify.com/api/v2/getting-started, OpenAI docs: https://platform.openai.com/docs/overview, OpenRouter: https://openrouter.ai/docs/quickstart, HuggingFace FLUX.1: https://huggingface.co/docs |
| This workflow uses multiple APIs (Apify, OpenAI/Mistral, HuggingFace FLUX.1) and requires user API tokens or OAuth2 credentials configured in n8n.                                                                                 | User must replace `[YOUR_API_TOKEN]` placeholders and configure credentials in n8n.                |
| CTR calculation uses a custom formula incorporating video age decay to approximate virality potential; users are encouraged to adjust thresholds and formula as needed.                                                             | Commentary in Calculate CTR node code.                                                            |
| The workflow’s modular design allows substitution of input triggers (e.g., form submissions), output storage (e.g., Airtable), or AI models with minimal adjustments.                                                                | Flexible architecture notes.                                                                      |
| Video tutorial and support links provide additional help for workflow customization and troubleshooting.                                                                                                                           | See Sticky Note content.                                                                           |

---

**Disclaimer:** The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This process strictly adheres to current content policies and contains no illegal, offensive, or protected material. All data handled is legal and public.