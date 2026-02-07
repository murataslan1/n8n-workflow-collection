Automate RSS to Instagram with AI-Generated Content and Cloudinary

https://n8nworkflows.xyz/workflows/automate-rss-to-instagram-with-ai-generated-content-and-cloudinary-11791


# Automate RSS to Instagram with AI-Generated Content and Cloudinary

### 1. Workflow Overview

This workflow automates the process of publishing AI-enhanced news content from RSS feeds to Instagram. It reads and aggregates RSS news articles, leverages AI to identify the best article and generate content and images, and then publishes the results on Instagram with media management and status checks. The logical flow includes:

- **1.1 Scheduling & RSS Input:** Periodic triggering and reading of RSS feeds.
- **1.2 Data Aggregation & Preprocessing:** Aggregating RSS items and grouping news.
- **1.3 AI Content Processing:** Using AI agents to select top articles, generate titles, and write news content.
- **1.4 Image Generation & Enhancement:** Creating images via AI and editing them with text overlays.
- **1.5 Media Upload & Instagram Publishing:** Uploading images to Cloudinary, setting Instagram post parameters, publishing, and managing media publishing status.
- **1.6 Control & Synchronization:** Handling asynchronous Instagram API responses with wait and loops.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduling & RSS Input  
**Overview:** This block triggers the workflow periodically and reads new RSS feed items.  
**Nodes Involved:**  
- Schedule Trigger  
- RSS Read  

**Node Details:**  
- **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Role: Initiates the workflow on a schedule (default interval, e.g., hourly or daily)  
  - Configuration: No custom parameters (default scheduling)  
  - Inputs: None (trigger node)  
  - Outputs: RSS Read  
  - Failures: Misconfiguration of schedule; no RSS feed URL provided  
- **RSS Read**  
  - Type: RSS Feed Read  
  - Role: Fetches latest entries from configured RSS feeds  
  - Configuration: Uses preset RSS feed URLs (not detailed here)  
  - Inputs: Schedule Trigger output  
  - Outputs: Aggregate  
  - Failures: Network errors, invalid RSS format, empty feed  

#### 2.2 Data Aggregation & Preprocessing  
**Overview:** Aggregates multiple RSS items and groups news articles into a single item for processing.  
**Nodes Involved:**  
- Aggregate  
- group the news into 1 item (Code)  

**Node Details:**  
- **Aggregate**  
  - Type: Aggregate  
  - Role: Combines RSS items into grouped sets (e.g., by date or category)  
  - Configuration: Default aggregation settings (unspecified)  
  - Inputs: RSS Read output  
  - Outputs: group the news into 1 item  
  - Failures: Empty input, aggregation logic errors  
- **group the news into 1 item**  
  - Type: Code (JavaScript)  
  - Role: Custom code to merge news items into one consolidated object  
  - Configuration: Script merges multiple articles into a single data structure  
  - Inputs: Aggregate output  
  - Outputs: Best Article finder (main output), Merge (secondary output)  
  - Failures: Code runtime errors, data format inconsistencies  

#### 2.3 AI Content Processing  
**Overview:** Uses AI to find the best article, generate a news title, and write news content.  
**Nodes Involved:**  
- Best Article finder (Langchain Agent)  
- Merge  
- Find the urls the ai outputted (Code)  
- All url's to 1 string (Code)  
- News-writer (Langchain Agent)  
- AI-NewsTitle (OpenAI Chat)  
- 4o-mini (OpenAI Chat)  
- 4.1 (OpenAI Chat)  

**Node Details:**  
- **Best Article finder**  
  - Type: Langchain Agent  
  - Role: Uses AI to identify the most relevant or engaging article from grouped news  
  - Configuration: AI agent with prompt templates (not shown)  
  - Inputs: group the news into 1 item output  
  - Outputs: Merge node  
  - Failures: AI API errors, prompt failures, rate limits  
- **Merge**  
  - Type: Merge  
  - Role: Combines data streams for downstream processing  
  - Inputs: Best Article finder and group the news into 1 item (secondary output)  
  - Outputs: Find the urls the ai outputted  
- **Find the urls the ai outputted**  
  - Type: Code (JavaScript)  
  - Role: Extracts URLs mentioned in AI-generated text  
  - Inputs: Merge output  
  - Outputs: All url's to 1 string  
- **All url's to 1 string**  
  - Type: Code (JavaScript)  
  - Role: Concatenates all extracted URLs into a single string for further use  
  - Inputs: Find the urls the ai outputted output  
  - Outputs: News-writer  
- **News-writer**  
  - Type: Langchain Agent  
  - Role: Generates detailed news content based on URLs and article data  
  - Inputs: All url's to 1 string output  
  - Outputs: AI-NewsTitle  
- **AI-NewsTitle**  
  - Type: OpenAI Chat  
  - Role: Creates a catchy news title for the Instagram post  
  - Inputs: News-writer output  
  - Outputs: Generate an image  
- **4o-mini**  
  - Type: OpenAI Chat  
  - Role: Auxiliary AI model to support Best Article finder (possibly summarization or condensing)  
  - Inputs: group the news into 1 item output (parallel to Best Article finder)  
  - Outputs: Best Article finder (AI model input)  
- **4.1**  
  - Type: OpenAI Chat  
  - Role: Additional AI processing, possibly used after News-writer in chain  
  - Inputs: News-writer output  
  - Outputs: Not directly connected to publishing, likely supplementary  

**Failures and Edge Cases:**  
- AI service unavailability or quota exceeded  
- Unexpected AI responses or empty outputs  
- Code nodes failing on malformed text or missing URLs  

#### 2.4 Image Generation & Enhancement  
**Overview:** Generates images for posts using AI and edits them by adding "Read More" text overlays.  
**Nodes Involved:**  
- Generate an image (OpenAI)  
- Add_textReadMore-toimage (Edit Image)  
- Upload an asset from file data (Cloudinary)  

**Node Details:**  
- **Generate an image**  
  - Type: OpenAI Image Generation  
  - Role: Creates an image based on AI-generated news title or content  
  - Inputs: AI-NewsTitle output  
  - Outputs: Add_textReadMore-toimage  
  - Failures: Image API rate limits, generation errors  
- **Add_textReadMore-toimage**  
  - Type: Edit Image  
  - Role: Adds "Read More" text overlay on the generated image to enhance engagement  
  - Inputs: Generate an image output  
  - Outputs: Upload an asset from file data  
  - Failures: Image processing errors, incompatible formats  
- **Upload an asset from file data**  
  - Type: Cloudinary Upload  
  - Role: Uploads the final image to Cloudinary for hosting and access via URL  
  - Inputs: Add_textReadMore-toimage output  
  - Outputs: Instagram params  
  - Failures: Cloudinary authentication or upload errors  

#### 2.5 Media Upload & Instagram Publishing  
**Overview:** Sets parameters for Instagram posts, publishes media, checks upload and publish statuses, and loops as needed.  
**Nodes Involved:**  
- Instagram params (Set)  
- Code in JavaScript (custom logic for managing post data)  
- Facebook Graph API (media upload and status check)  
- Instagram check status of media uploaded before (Facebook Graph API)  
- Wait  
- If media status is finished (If)  
- Instagram publish media (Facebook Graph API)  
- Instagram check status of media published before (Facebook Graph API)  
- Loop Over Items (Split in Batches)  

**Node Details:**  
- **Instagram params**  
  - Type: Set  
  - Role: Defines parameters required for Instagram Graph API post creation (e.g., caption, media_url, access token)  
  - Inputs: Upload an asset from file data output  
  - Outputs: Code in JavaScript  
- **Code in JavaScript**  
  - Type: Code (JavaScript)  
  - Role: Prepares or manipulates Instagram posting data payload  
  - Inputs: Instagram params output  
  - Outputs: Facebook Graph API  
- **Facebook Graph API** (several instances)  
  - Type: Facebook Graph API  
  - Role: Interacts with Instagram via Facebook API to upload media, check upload status, publish media, and check publish status  
  - Inputs and Outputs: Organized to handle asynchronous nature of Instagram posting  
  - Failures: OAuth token expiration, API rate limits, invalid media format  
- **Instagram check status of media uploaded before**  
  - Checks the processing status of uploaded media before publishing  
- **Wait**  
  - Pauses execution to allow Instagram to process media before next status check  
- **If media status is finished**  
  - Conditional node deciding whether to proceed to publish or loop/wait longer  
- **Instagram publish media**  
  - Final publishing call to Instagram  
- **Instagram check status of media published before**  
  - Post-publish status check, possibly for confirmation or logging  
- **Loop Over Items**  
  - Processes multiple media items in batches, enabling handling of multiple posts in one run  

**Failures and Edge Cases:**  
- OAuth token expiry or permission issues  
- Instagram API rate limits and timeouts  
- Media processing delays causing extended waits  
- Partial failures in batch processing  

#### 2.6 Control & Synchronization  
**Overview:** Manages asynchronous Instagram API responses and loops to ensure successful media upload and publish completion.  
**Nodes Involved:**  
- Wait  
- If media status is finished  
- Loop Over Items  

**Node Details:**  
- See details above in Media Upload & Instagram Publishing.  
- Ensures robust handling of Instagram's asynchronous media processing workflows.  

---

### 3. Summary Table

| Node Name                          | Node Type                              | Functional Role                                | Input Node(s)                      | Output Node(s)                                   | Sticky Note                       |
|-----------------------------------|--------------------------------------|------------------------------------------------|----------------------------------|-------------------------------------------------|----------------------------------|
| Schedule Trigger                  | Schedule Trigger                     | Initiates workflow on schedule                  | None                             | RSS Read                                        |                                  |
| RSS Read                         | RSS Feed Read                       | Fetches latest RSS articles                      | Schedule Trigger                 | Aggregate                                       |                                  |
| Aggregate                       | Aggregate                           | Groups RSS feed items                            | RSS Read                        | group the news into 1 item                       |                                  |
| group the news into 1 item       | Code (JavaScript)                   | Consolidates news items into one object          | Aggregate                      | Best Article finder, Merge                       |                                  |
| Best Article finder              | Langchain Agent                    | AI selects best article                          | group the news into 1 item      | Merge                                           |                                  |
| Merge                           | Merge                              | Combines AI and grouped data                     | Best Article finder, group the news into 1 item | Find the urls the ai outputted                 |                                  |
| Find the urls the ai outputted  | Code (JavaScript)                   | Extracts URLs from AI text                        | Merge                          | All url's to 1 string                           |                                  |
| All url's to 1 string           | Code (JavaScript)                   | Concatenates URLs into single string             | Find the urls the ai outputted  | News-writer                                     |                                  |
| News-writer                     | Langchain Agent                    | Generates detailed news content                   | All url's to 1 string           | AI-NewsTitle                                    |                                  |
| AI-NewsTitle                   | OpenAI Chat                        | Creates catchy news title                         | News-writer                    | Generate an image                               |                                  |
| Generate an image              | OpenAI Image Generation             | Generates image from news title                   | AI-NewsTitle                   | Add_textReadMore-toimage                        |                                  |
| Add_textReadMore-toimage       | Edit Image                        | Adds "Read More" overlay to image                 | Generate an image              | Upload an asset from file data                  |                                  |
| Upload an asset from file data | Cloudinary Upload                  | Uploads image to Cloudinary                        | Add_textReadMore-toimage       | Instagram params                                |                                  |
| Instagram params              | Set                               | Sets Instagram post parameters                    | Upload an asset from file data | Code in JavaScript                              |                                  |
| Code in JavaScript            | Code (JavaScript)                   | Prepares Instagram API payload                    | Instagram params               | Facebook Graph API                              |                                  |
| Facebook Graph API            | Facebook Graph API                 | Upload media/check status/publish on Instagram   | Code in JavaScript             | Instagram check status of media uploaded before |                                  |
| Instagram check status of media uploaded before | Facebook Graph API          | Checks if uploaded media is ready                 | Facebook Graph API             | Wait                                            |                                  |
| Wait                         | Wait                              | Waits before next status check                    | Instagram check status of media uploaded before | If media status is finished                    |                                  |
| If media status is finished    | If                                | Checks if media processing finished               | Wait                          | Instagram publish media, Loop Over Items        |                                  |
| Instagram publish media       | Facebook Graph API                 | Publishes media on Instagram                      | If media status is finished    | Instagram check status of media published before |                                  |
| Instagram check status of media published before | Facebook Graph API          | Checks published media status                      | Instagram publish media        | (None)                                          |                                  |
| Loop Over Items              | Split In Batches                  | Processes multiple media items in batches         | If media status is finished    | Instagram check status of media uploaded before |                                  |
| 4o-mini                      | OpenAI Chat                      | Auxiliary AI for article selection                 | group the news into 1 item      | Best Article finder                             |                                  |
| 4.1                          | OpenAI Chat                      | Additional AI processing                            | News-writer                    | News-writer (chain)                             |                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger Node:**  
   - Type: Schedule Trigger  
   - Configure it to run at your desired interval (e.g., hourly or daily).  

2. **Add an RSS Feed Read Node:**  
   - Connect Schedule Trigger → RSS Read  
   - Configure RSS URLs to fetch latest articles.  

3. **Add an Aggregate Node:**  
   - Connect RSS Read → Aggregate  
   - Use default grouping or customize as needed.  

4. **Add a Code Node ("group the news into 1 item"):**  
   - Connect Aggregate → Code node  
   - Write JavaScript to merge aggregated items into a single object.  
   - Configure two outputs: main and secondary.  

5. **Add Langchain Agent Node ("Best Article finder"):**  
   - Connect Code node main output → Best Article finder  
   - Provide AI prompt to identify the best article from the group.  

6. **Add a Merge Node:**  
   - Connect Best Article finder output → Merge (input 1)  
   - Connect Code node secondary output → Merge (input 2)  

7. **Add a Code Node ("Find the urls the ai outputted"):**  
   - Connect Merge → Code node  
   - Extract URLs from AI-generated content text.  

8. **Add a Code Node ("All url's to 1 string"):**  
   - Connect previous Code node → Code node  
   - Concatenate extracted URLs into one string.  

9. **Add Langchain Agent Node ("News-writer"):**  
   - Connect URL string Code node → News-writer  
   - Generate detailed news content based on URLs.  

10. **Add OpenAI Chat Node ("AI-NewsTitle"):**  
    - Connect News-writer → AI-NewsTitle  
    - Configure to generate a catchy title for Instagram post.  

11. **Add OpenAI Image Generation Node ("Generate an image"):**  
    - Connect AI-NewsTitle → Generate an image  
    - Use title as prompt for image generation.  

12. **Add Edit Image Node ("Add_textReadMore-toimage"):**  
    - Connect Generate an image → Edit Image  
    - Configure to overlay "Read More" text.  

13. **Add Cloudinary Upload Node ("Upload an asset from file data"):**  
    - Connect Edit Image → Cloudinary Upload  
    - Configure Cloudinary credentials and upload settings.  

14. **Add Set Node ("Instagram params"):**  
    - Connect Cloudinary Upload → Set  
    - Define Instagram post parameters (caption, media_url, etc.).  

15. **Add Code Node ("Code in JavaScript"):**  
    - Connect Instagram params → Code node  
    - Prepare payload for Instagram Graph API calls.  

16. **Add Facebook Graph API Node ("Facebook Graph API"):**  
    - Connect Code node → Facebook Graph API  
    - Configure with Instagram Graph API credentials for media upload.  

17. **Add Facebook Graph API Node ("Instagram check status of media uploaded before"):**  
    - Connect Facebook Graph API → Instagram check status node  
    - Poll media upload processing status.  

18. **Add Wait Node:**  
    - Connect Instagram check status node → Wait  
    - Pause to allow Instagram processing.  

19. **Add If Node ("If media status is finished"):**  
    - Connect Wait → If node  
    - Check if media upload is finished.  

20. **Add Facebook Graph API Node ("Instagram publish media"):**  
    - Connect If node (true) → Instagram publish media  
    - Publish media on Instagram.  

21. **Add Facebook Graph API Node ("Instagram check status of media published before"):**  
    - Connect Instagram publish media → Instagram check status of media published  
    - Verify publish status.  

22. **Add Split In Batches Node ("Loop Over Items"):**  
    - Connect If node (false) → Loop Over Items  
    - Configure batch size and looping logic for multiple posts.  

23. **Connect Loop Over Items → Instagram check status of media uploaded before:**  
    - Complete loop to manage multiple items asynchronously.  

24. **Add parallel AI support nodes:**  
    - Add OpenAI Chat "4o-mini" connected from Code node secondary output to Best Article finder input.  
    - Add OpenAI Chat "4.1" connected from News-writer (optional for extended AI processing).  

25. **Set up credentials:**  
    - OpenAI API credentials for all Langchain and OpenAI nodes.  
    - Cloudinary credentials for image uploads.  
    - Facebook Graph API OAuth2 credentials with Instagram permissions.  

---

### 5. General Notes & Resources

| Note Content                                                                                              | Context or Link                                   |
|-----------------------------------------------------------------------------------------------------------|--------------------------------------------------|
| Workflow automates AI-enhanced news publishing from RSS feeds to Instagram, leveraging Cloudinary for image hosting. | Workflow description and use case                 |
| Requires valid OpenAI API key and Facebook Graph API credentials with Instagram publishing permissions.   | Authentication details                            |
| Cloudinary account needed for media hosting and upload.                                                   | Image hosting solution                            |
| Instagram Graph API media upload is asynchronous; wait and status check nodes handle this complexity.     | API integration details                           |
| Batch processing supports multi-post workflows with controlled API calls to avoid rate limits.           | Performance and scaling considerations           |
| "Read More" text overlay added to images for better engagement on Instagram posts.                        | Visual content enhancement strategy               |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly complies with applicable content policies and contains no illegal, offensive, or protected elements. All data handled are legal and public.