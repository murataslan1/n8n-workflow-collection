Auto-Summarize Blog Posts to Social Media with Gemma and Postiz

https://n8nworkflows.xyz/workflows/auto-summarize-blog-posts-to-social-media-with-gemma-and-postiz-9316


# Auto-Summarize Blog Posts to Social Media with Gemma and Postiz

---

## 1. Workflow Overview

This workflow automates the process of summarizing the latest blog posts from an RSS feed and publishing concise, engaging social media posts with images using the Postiz platform. It targets content creators and marketers who want to streamline social media sharing of blog content without manual intervention.

The workflow is logically divided into these main blocks:

- **1.1 Input Reception and RSS Feed Parsing**  
  Receives scheduled triggers, fetches RSS feed URLs, and reads the latest blog post items.

- **1.2 Duplicate Detection and Filtering**  
  Computes hashes of post URLs to detect if the content was already posted, preventing duplicate social media posts.

- **1.3 Content Extraction and Image Processing**  
  Retrieves full blog post HTML content, extracts the main image URL, downloads and resizes the image, then uploads it to Postiz.

- **1.4 Summary Generation via Local Large Language Model (LLM)**  
  Calculates character limits, generates a concise summary with hashtags using a local Ollama LLM model, and processes the LLM output for posting.

- **1.5 Validation and Posting to Social Media via Postiz API**  
  Validates all required inputs and posts the summarized content with image to multiple social media platforms using the Postiz API.

- **1.6 State Persistence for Duplicate Tracking**  
  Reads and writes hashes to local files to track the last posted blog post and prevent reposting.

---

## 2. Block-by-Block Analysis

### 2.1 Input Reception and RSS Feed Parsing

**Overview:**  
Triggered every 10 minutes, this block sets the RSS feed URL, splits multiple URLs if present, and fetches the latest blog posts from the feed.

**Nodes Involved:**  
- Schedule: Check RSS Every 10 Minutes  
- Set RSS Feed URLs  
- Split RSS Feed URLs into Items  
- Fetch Latest RSS Feed Content

**Node Details:**

- **Schedule: Check RSS Every 10 Minutes**  
  - Type: Schedule Trigger  
  - Role: Initiates workflow every 10 minutes to check for new blog posts  
  - Config: Interval set to 10 minutes  
  - Input: None (trigger node)  
  - Output: Triggers "Set RSS Feed URLs" node  
  - Edge Cases: Missed triggers due to downtime or system overload

- **Set RSS Feed URLs**  
  - Type: Set  
  - Role: Defines the RSS feed URL(s) as workflow input  
  - Config: Sets a string field "Blog's Name" to the RSS feed URL (default example: "https://blogsname.blogspot.com/feeds/posts/default")  
  - Input: Trigger from schedule  
  - Output: Feeds into "Split RSS Feed URLs into Items"  
  - Edge Cases: Incorrect or unreachable RSS URL will cause downstream fetch failures

- **Split RSS Feed URLs into Items**  
  - Type: Split Out  
  - Role: Splits array of RSS feed URLs into individual items for processing  
  - Config: Splits on the field ["Blog's Name"]  
  - Input: From "Set RSS Feed URLs"  
  - Output: Feeds into "Fetch Latest RSS Feed Content"  
  - Edge Cases: Empty URL list results in no further processing

- **Fetch Latest RSS Feed Content**  
  - Type: RSS Feed Read  
  - Role: Fetches RSS feed data from specified URL(s)  
  - Config: URL is set dynamically from input JSON; no additional options  
  - Input: From "Split RSS Feed URLs into Items"  
  - Output: Feeds into "Loop Over RSS Items for Processing" and "Merge Processed Data Streams"  
  - Edge Cases: Network errors, invalid feed format, rate limiting by feed provider

---

### 2.2 Duplicate Detection and Filtering

**Overview:**  
This block calculates unique hashes for blog post URLs and compares them to the last posted hash stored locally, allowing the workflow to skip already posted content.

**Nodes Involved:**  
- Loop Over RSS Items for Processing  
- Select Latest RSS Item by Date  
- Calculate Link Hash for Duplication Check  
- Read Last Posted Hash from File  
- Compare Hashes for Duplicate Check  
- Conditional Check for New Post

**Node Details:**

- **Loop Over RSS Items for Processing**  
  - Type: Split In Batches  
  - Role: Processes RSS feed items in batches for performance and control  
  - Config: Default batching options, executes once per batch  
  - Input: From "Fetch Latest RSS Feed Content"  
  - Output: Connects to "Merge Processed Data Streams" and "Fetch Blog Post HTML Content"  
  - Edge Cases: Large feeds may impact performance

- **Select Latest RSS Item by Date**  
  - Type: Code  
  - Role: Filters the latest blog post item based on publication date  
  - Config: JavaScript code sorts items by pubDate descending and returns the first  
  - Input: From "Merge Processed Data Streams"  
  - Output: Feeds into "Calculate Link Hash for Duplication Check"  
  - Edge Cases: Empty input array returns empty output

- **Calculate Link Hash for Duplication Check**  
  - Type: Code  
  - Role: Generates a simple 32-bit integer hash (hex string) from the blog post URL for duplication tracking  
  - Config: JavaScript hash function applied to trimmed link string  
  - Input: From "Select Latest RSS Item by Date"  
  - Output: Feeds into "Read Last Posted Hash from File"  
  - Edge Cases: Missing or malformed link results in empty hash

- **Read Last Posted Hash from File**  
  - Type: Code  
  - Role: Reads the last posted hash from a local file (`/.n8n/rss_last_posted.txt`) for comparison  
  - Config: Uses Node.js fs module, handles errors gracefully  
  - Input: From "Calculate Link Hash for Duplication Check"  
  - Output: Feeds into "Compare Hashes for Duplicate Check"  
  - Edge Cases: File missing or read errors logged but do not break execution

- **Compare Hashes for Duplicate Check**  
  - Type: Code  
  - Role: Compares current post's link hash with last posted hash; sets a boolean flag `shouldProceed`  
  - Config: Logs comparison results, writes debug info to `/.n8n/debug_log.txt`  
  - Input: From "Read Last Posted Hash from File"  
  - Output: Feeds into "Conditional Check for New Post"  
  - Edge Cases: File write failures logged but do not break workflow

- **Conditional Check for New Post**  
  - Type: Code  
  - Role: Filters out items where `shouldProceed` is false to prevent reposting duplicates  
  - Config: Returns only items with new content; others filtered out by returning null  
  - Input: From "Compare Hashes for Duplicate Check"  
  - Output: Feeds into "Normalize RSS Fields (Content & Link)"  
  - Edge Cases: All duplicates result in empty output, causing workflow early exit

---

### 2.3 Content Extraction and Image Processing

**Overview:**  
Fetches full blog post HTML, extracts a main image URL, downloads and resizes the image for social media, then uploads it to Postiz.

**Nodes Involved:**  
- Normalize RSS Fields (Content & Link)  
- Calculate Summary Character Limit  
- Loop Over RSS Items for Processing (reused)  
- Fetch Blog Post HTML Content  
- Extract Image URL from Post HTML  
- Filter Latest Item for Image Processing  
- Download Post Image  
- Transform/Resize Image for Upload  
- Upload Image to Postiz

**Node Details:**

- **Normalize RSS Fields (Content & Link)**  
  - Type: Set  
  - Role: Ensures essential fields `contentSnippet` and `link` are available and standardized  
  - Config: Sets these fields explicitly from input JSON  
  - Input: From "Conditional Check for New Post"  
  - Output: Feeds into "Calculate Summary Character Limit"  
  - Edge Cases: Missing fields may lead to downstream incomplete data

- **Calculate Summary Character Limit**  
  - Type: Code  
  - Role: Calculates max character length for summary generation considering link length, hashtags, and buffer  
  - Config: Reserves 50 chars for hashtags, 20 chars for buffer, subtracts link length from 280-character limit  
  - Input: From "Normalize RSS Fields (Content & Link)"  
  - Output: Feeds into "Generate Summary and Hashtags with LLM"  
  - Edge Cases: Unexpectedly long links reduce summary size drastically

- **Loop Over RSS Items for Processing** (reused)  
  - See above for details. Here, it is used to fan out for HTML fetching.

- **Fetch Blog Post HTML Content**  
  - Type: HTTP Request  
  - Role: Fetches the full HTML body of the blog post from its URL  
  - Config: URL set dynamically, expects text response, stored in `.body` property  
  - Input: From "Loop Over RSS Items for Processing"  
  - Output: Feeds into "Extract Image URL from Post HTML"  
  - Edge Cases: HTTP errors, redirects, or content blocking can fail fetch

- **Extract Image URL from Post HTML**  
  - Type: Code  
  - Role: Parses the HTML to extract the first main image URL using regex targeting `<img>` tags with `src` attributes  
  - Config: Removes resizing parameters from image URLs (e.g., `=wXXX-hXXX`)  
  - Input: From "Fetch Blog Post HTML Content"  
  - Output: Feeds into "Filter Latest Item for Image Processing"  
  - Edge Cases: Missing images or unexpected HTML structure may yield null URL

- **Filter Latest Item for Image Processing**  
  - Type: Code  
  - Role: Filters items to only those with a valid image URL and selects the most recent by pubDate  
  - Config: Filters for non-null imageUrl, sorts by pubDate descending, slices top 1  
  - Input: From "Extract Image URL from Post HTML"  
  - Output: Feeds into "Download Post Image"  
  - Edge Cases: No valid images results in no output items

- **Download Post Image**  
  - Type: HTTP Request  
  - Role: Downloads the image file from extracted URL, expects file binary response  
  - Config: URL set dynamically from `imageUrl` field  
  - Input: From "Filter Latest Item for Image Processing"  
  - Output: Feeds into "Transform/Resize Image for Upload"  
  - Edge Cases: Broken image URLs or network errors cause failures

- **Transform/Resize Image for Upload**  
  - Type: Edit Image  
  - Role: Resizes image to 1080x1080 px, converts to JPEG, and sets a filename dynamically with execution ID  
  - Config: Resize operation with fixed dimensions, filename format: `blog-image-{execution.id}.jpeg`  
  - Input: From "Download Post Image"  
  - Output: Feeds into "Upload Image to Postiz"  
  - Edge Cases: Unsupported image formats or corrupt files may cause errors

- **Upload Image to Postiz**  
  - Type: Postiz Node (uploadFile operation)  
  - Role: Uploads the resized image to Postiz media library for later use in posts  
  - Config: Uses binary property from previous node's output  
  - Input: From "Transform/Resize Image for Upload"  
  - Output: Feeds back into "Loop Over RSS Items for Processing" for further processing  
  - Edge Cases: Authentication failures, file size limits, or Postiz API errors  
  - Notes: Postiz API credentials must be configured securely

---

### 2.4 Summary Generation via Local LLM

**Overview:**  
Generates a concise social media summary with hashtags from the blog post snippet using a local Ollama LLM model, then processes the output to extract text, hashtags, and link structured for posting.

**Nodes Involved:**  
- Generate Summary and Hashtags with LLM  
- Configure Local LLM Model (Ollama)  
- Process LLM Output for Postiz (Extract Text/Hashtags/Link)  
- Calculate Summary Character Limit (from 2.3 reused)

**Node Details:**

- **Configure Local LLM Model (Ollama)**  
  - Type: Langchain LM Ollama  
  - Role: Configures the LLM model instance to be used for text generation  
  - Config: Model set to `gemma3:12b`, no extra options  
  - Input: None (configured for LLM node)  
  - Output: Feeds as language model input to "Generate Summary and Hashtags with LLM"  
  - Edge Cases: Requires local Ollama API running and valid credentials  
  - Sticky Note: Advises selection of model and updating credentials per user's local setup

- **Generate Summary and Hashtags with LLM**  
  - Type: Langchain Chain LLM  
  - Role: Sends a prompt to the LLM to create a summary under a character limit with 3 hashtags, then appends the link  
  - Config: Prompt defines system instructions and user input with dynamic maxChars and contentSnippet  
  - Input: From "Calculate Summary Character Limit" and linked to Ollama model node  
  - Output: Feeds into "Process LLM Output for Postiz (Extract Text/Hashtags/Link)"  
  - Edge Cases: LLM timeout, model unavailability, or prompt failures

- **Process LLM Output for Postiz (Extract Text/Hashtags/Link)**  
  - Type: Code  
  - Role: Parses LLM generated text to separate summary text, hashtags, and link; applies fallback defaults if needed  
  - Config: Splits output by spaces, detects URL and hashtags, ensures exactly 3 hashtags, trims text to maxChars  
  - Input: From "Generate Summary and Hashtags with LLM"  
  - Output: Feeds into "Save Temporary Link Hash to File"  
  - Edge Cases: Unexpected LLM output format; warns and uses default hashtags

---

### 2.5 Validation and Posting to Social Media via Postiz API

**Overview:**  
Validates the generated text, link, and image upload data before posting the content to multiple social media platforms via Postiz REST API.

**Nodes Involved:**  
- Save Temporary Link Hash to File  
- Validate Inputs for Postiz API  
- Create and Post Content via Postiz API  
- Save Posted Hash to File  
- Postiz (Create Post) [Disabled]

**Node Details:**

- **Save Temporary Link Hash to File**  
  - Type: Code  
  - Role: Writes the link hash to a temporary file (`/.n8n/rss_temp_url.txt`) as intermediate state storage  
  - Config: Uses Node.js fs module, logs success/errors  
  - Input: From "Process LLM Output for Postiz (Extract Text/Hashtags/Link)"  
  - Output: Feeds into "Validate Inputs for Postiz API"  
  - Edge Cases: File write errors logged but graceful

- **Validate Inputs for Postiz API**  
  - Type: Code  
  - Role: Checks presence and validity of summary text, link, and uploaded image details before posting  
  - Config: Throws error if any input missing: text, link, image ID, or image path  
  - Input: From "Save Temporary Link Hash to File" and "Upload Image to Postiz" (via expression)  
  - Output: Feeds into "Create and Post Content via Postiz API"  
  - Edge Cases: Validation failure aborts workflow with error

- **Create and Post Content via Postiz API**  
  - Type: HTTP Request  
  - Role: Sends a POST request to Postiz API to create posts on multiple social media platforms with text, hashtags, link, and image  
  - Config: JSON body contains multiple integrations (Facebook, LinkedIn, Twitter 'x', Instagram) with dynamic content and image references; authentication via Postiz API credentials  
  - Input: From "Validate Inputs for Postiz API"  
  - Output: Feeds into "Save Posted Hash to File"  
  - Edge Cases: API failures, authentication errors, platform-specific payload issues  
  - Sticky Notes:  
    - Advises updating integration IDs for user's Postiz account and credential setup  
    - Highlights that Instagram posting via Postiz node is disabled due to known bugs, recommending direct HTTP requests instead

- **Save Posted Hash to File**  
  - Type: Code  
  - Role: Saves the final posted link hash to `/.n8n/rss_last_posted.txt` to mark the post as published and prevent reposts  
  - Config: Reads fallback from temp file if needed; error handling included  
  - Input: From "Create and Post Content via Postiz API"  
  - Output: End of workflow branch  
  - Edge Cases: File write errors logged but do not halt workflow

- **Postiz (Create Post)** [Disabled]  
  - Type: Postiz Node  
  - Role: Alternative node for posting directly to Postiz platform (disabled due to Instagram payload issues)  
  - Config: Includes multiple platform integrations and image references  
  - Notes: Disabled due to known GitHub issue with Instagram JSON payloads causing unreliable posting

---

## 3. Summary Table

| Node Name                             | Node Type                   | Functional Role                                      | Input Node(s)                           | Output Node(s)                         | Sticky Note                                                                                                                                                           |
|-------------------------------------|-----------------------------|-----------------------------------------------------|---------------------------------------|---------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Schedule: Check RSS Every 10 Minutes| Schedule Trigger            | Triggers workflow every 10 minutes                   | None                                  | Set RSS Feed URLs                     |                                                                                                                                                                     |
| Set RSS Feed URLs                   | Set                         | Defines RSS feed URL(s)                              | Schedule: Check RSS Every 10 Minutes  | Split RSS Feed URLs into Items        | Replace 'Blog's Name' and the URL with your own RSS feed details (e.g., your blog's RSS URL).                                                                        |
| Split RSS Feed URLs into Items       | Split Out                   | Splits RSS URLs into individual items                | Set RSS Feed URLs                    | Fetch Latest RSS Feed Content          | This node fetches the RSS feed. Ensure the URL matches your blog—update if needed for custom feeds.                                                                  |
| Fetch Latest RSS Feed Content        | RSS Feed Read               | Fetches blog posts from RSS feed                      | Split RSS Feed URLs into Items        | Loop Over RSS Items for Processing, Merge Processed Data Streams |                                                                                                                                                                     |
| Loop Over RSS Items for Processing   | Split In Batches            | Processes RSS items in batches                         | Fetch Latest RSS Feed Content          | Fetch Blog Post HTML Content, Merge Processed Data Streams, Upload Image to Postiz |                                                                                                                                                                     |
| Merge Processed Data Streams         | Merge                      | Combines data streams from batched processing        | Fetch Latest RSS Feed Content, Loop Over RSS Items for Processing | Select Latest RSS Item by Date          |                                                                                                                                                                     |
| Select Latest RSS Item by Date       | Code                        | Selects the latest blog post by publication date     | Merge Processed Data Streams          | Calculate Link Hash for Duplication Check |                                                                                                                                                                     |
| Calculate Link Hash for Duplication Check | Code                    | Generates hash of post URL for duplicate detection   | Select Latest RSS Item by Date         | Read Last Posted Hash from File        |                                                                                                                                                                     |
| Read Last Posted Hash from File      | Code                        | Reads last posted link hash from local file          | Calculate Link Hash for Duplication Check | Compare Hashes for Duplicate Check     |                                                                                                                                                                     |
| Compare Hashes for Duplicate Check   | Code                        | Compares current and last posted hashes               | Read Last Posted Hash from File       | Conditional Check for New Post          |                                                                                                                                                                     |
| Conditional Check for New Post       | Code                        | Filters out already posted items                       | Compare Hashes for Duplicate Check    | Normalize RSS Fields (Content & Link)  |                                                                                                                                                                     |
| Normalize RSS Fields (Content & Link)| Set                         | Standardizes RSS item fields                           | Conditional Check for New Post         | Calculate Summary Character Limit       |                                                                                                                                                                     |
| Calculate Summary Character Limit    | Code                        | Computes max characters allowed for summary           | Normalize RSS Fields (Content & Link) | Generate Summary and Hashtags with LLM  | Adjust maxChars calculation, hashtag reserve (default 50 chars), or buffers if using different platforms/limits (e.g., increase for longer hashtags).               |
| Configure Local LLM Model (Ollama)  | Langchain LM Ollama         | Configures local LLM model for summary generation     | None (LLM config for next node)       | Generate Summary and Hashtags with LLM | Select your preferred Ollama model (e.g., gemma3:12b or alternatives like LLaMA). Update credentials with your local Ollama API setup.                             |
| Generate Summary and Hashtags with LLM | Langchain Chain LLM       | Generates summary and hashtags from blog snippet      | Calculate Summary Character Limit, Configure Local LLM Model (Ollama) | Process LLM Output for Postiz (Extract Text/Hashtags/Link) | Customize the LLM prompt for your content niche (e.g., change tone, fallback summary, or hashtag style to fit your blog's theme).                                  |
| Process LLM Output for Postiz (Extract Text/Hashtags/Link) | Code           | Parses LLM text output into structured fields          | Generate Summary and Hashtags with LLM | Save Temporary Link Hash to File        |                                                                                                                                                                     |
| Save Temporary Link Hash to File     | Code                        | Writes link hash temporarily in a file                 | Process LLM Output for Postiz (Extract Text/Hashtags/Link) | Validate Inputs for Postiz API          |                                                                                                                                                                     |
| Validate Inputs for Postiz API       | Code                        | Validates necessary fields before posting              | Save Temporary Link Hash to File, Upload Image to Postiz | Create and Post Content via Postiz API | Update validation logic if your inputs vary (e.g., add checks for custom fields like text length, link format, or image presence).                                  |
| Create and Post Content via Postiz API | HTTP Request             | Posts content with image to multiple social platforms  | Validate Inputs for Postiz API        | Save Posted Hash to File                | This node posts to social platforms via Postiz API—crucial for the workflow! Update URL if your Postiz instance differs. Set API credentials securely.              |
| Save Posted Hash to File             | Code                        | Saves last posted link hash to local file              | Create and Post Content via Postiz API | End of workflow                        |                                                                                                                                                                     |
| Fetch Blog Post HTML Content         | HTTP Request                | Downloads blog post HTML content                        | Loop Over RSS Items for Processing     | Extract Image URL from Post HTML        |                                                                                                                                                                     |
| Extract Image URL from Post HTML     | Code                        | Extracts main image URL from HTML content               | Fetch Blog Post HTML Content           | Filter Latest Item for Image Processing |                                                                                                                                                                     |
| Filter Latest Item for Image Processing | Code                    | Filters items with valid image URLs and selects latest | Extract Image URL from Post HTML       | Download Post Image                     |                                                                                                                                                                     |
| Download Post Image                  | HTTP Request                | Downloads image file from extracted URL                 | Filter Latest Item for Image Processing | Transform/Resize Image for Upload       |                                                                                                                                                                     |
| Transform/Resize Image for Upload    | Edit Image                  | Resizes and converts image for social media             | Download Post Image                    | Upload Image to Postiz                   |                                                                                                                                                                     |
| Upload Image to Postiz               | Postiz (uploadFile)         | Uploads the processed image to Postiz                    | Transform/Resize Image for Upload      | Loop Over RSS Items for Processing       |                                                                                                                                                                     |
| Postiz (Create Post) [Disabled]      | Postiz                      | Alternative node for posting (disabled due to Instagram bug) | None                               | None                                  | Disabled due to Instagram JSON payload bug in Postiz-n8n integration (see https://github.com/gitroomhq/postiz-n8n/issues/7). Use HTTP Request node instead.          |
| Sticky Note                         | Sticky Note                 | Various notes covering nodes                             | None                                  | None                                  | See detailed sticky notes content in sections above.                                                                                                               |

---

## 4. Reproducing the Workflow from Scratch

Follow these steps to manually recreate the workflow in n8n:

1. **Create a Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Configuration: Set interval to every 10 minutes  
   - This will start the workflow periodically.

2. **Create a Set Node to Define RSS Feed URLs**  
   - Type: Set  
   - Add a string field named "Blog's Name"  
   - Set its value to your RSS feed URL (e.g., `https://yourblog.blogspot.com/feeds/posts/default`)  
   - Connect from Schedule Trigger.

3. **Create a Split Out Node to Split RSS URLs**  
   - Type: Split Out  
   - Set field to split on: `["Blog's Name"]`  
   - Connect from Set node.

4. **Create an RSS Feed Read Node**  
   - Type: RSS Feed Read  
   - Configure URL dynamically to read from input JSON field "Blog's Name"  
   - Connect from Split Out node.

5. **Create a Split In Batches Node**  
   - Type: Split In Batches  
   - Default settings, execute once per batch  
   - Connect from RSS Feed Read node.

6. **Create a Merge Node**  
   - Type: Merge  
   - Mode: Combine by position, include unpaired  
   - Connect one input from RSS Feed Read and one from Split In Batches node.

7. **Create a Code Node to Select Latest RSS Item**  
   - Type: Code  
   - JavaScript code: Sort items by `pubDate` descending and return the first item only  
   - Connect from Merge node.

8. **Create a Code Node to Calculate Link Hash**  
   - Type: Code  
   - JavaScript code: Implement a simple hash function on `link` field to generate a hex string hash  
   - Connect from Select Latest RSS Item node.

9. **Create a Code Node to Read Last Posted Hash from File**  
   - Type: Code  
   - Use Node.js `fs` module to read `/.n8n/rss_last_posted.txt` if exists  
   - Add field `lastPostedHash` to JSON  
   - Connect from Calculate Link Hash node.

10. **Create a Code Node to Compare Hashes**  
    - Type: Code  
    - Compare current `linkHash` with `lastPostedHash`  
    - Set `shouldProceed` boolean field  
    - Log comparison to `/.n8n/debug_log.txt`  
    - Connect from Read Last Posted Hash node.

11. **Create a Code Node for Conditional Filtering**  
    - Type: Code  
    - Return only items where `shouldProceed === true`  
    - Connect from Compare Hashes node.

12. **Create a Set Node to Normalize RSS Fields**  
    - Type: Set  
    - Assign `contentSnippet` and `link` fields explicitly from JSON input  
    - Connect from Conditional Check node.

13. **Create a Code Node to Calculate Summary Character Limit**  
    - Type: Code  
    - Calculate `maxChars = 280 - link.length - 20 - 50` (50 is hashtag reserve)  
    - Set `maxChars` and `link` fields on item JSON  
    - Connect from Normalize RSS Fields node.

14. **Create a Langchain LM Ollama Node**  
    - Type: Langchain LM Ollama  
    - Model: `gemma3:12b` or your chosen local Ollama model  
    - Connect as AI language model for next node (no direct input)

15. **Create a Langchain Chain LLM Node**  
    - Type: Langchain Chain LLM  
    - Prompt: System message instructing summary under `maxChars`, 3 hashtags, append link  
    - User message: Summarize `contentSnippet` with dynamic character limit  
    - Connect from Calculate Summary Character Limit node (input text) and from LM Ollama node (model)  
    - Connect output to next node.

16. **Create a Code Node to Process LLM Output**  
    - Type: Code  
    - Parse output text to extract summary text, exactly 3 hashtags, and link  
    - Use fallback hashtags if parsing fails  
    - Compute a hash of the link for tracking  
    - Connect from Generate Summary and Hashtags with LLM node.

17. **Create a Code Node to Save Temporary Link Hash**  
    - Type: Code  
    - Write `linkHash` to `/.n8n/rss_temp_url.txt`  
    - Connect from Process LLM Output node.

18. **Use the existing Split In Batches Node to fan out items for content fetching**  
    - Connect from Loop Over RSS Items for Processing node (reuse).

19. **Create an HTTP Request Node to Fetch Blog Post HTML**  
    - Type: HTTP Request  
    - URL set dynamically to `link` field  
    - Response format: Text, property output as `body`  
    - Connect from Loop Over RSS Items for Processing node.

20. **Create a Code Node to Extract Image URL**  
    - Type: Code  
    - Use regex to parse `body` for first `<img>` tag `src` attribute, clean URL parameters  
    - Set `imageUrl` field  
    - Connect from Fetch Blog Post HTML Content node.

21. **Create a Code Node to Filter Latest Item with Image URL**  
    - Type: Code  
    - Filter items with non-null `imageUrl` and select the latest by `pubDate`  
    - Connect from Extract Image URL node.

22. **Create an HTTP Request Node to Download Image**  
    - Type: HTTP Request  
    - URL set dynamically from `imageUrl`  
    - Response format: File binary  
    - Connect from Filter Latest Item for Image Processing node.

23. **Create an Edit Image Node to Resize Image**  
    - Type: Edit Image  
    - Resize to 1080x1080 pixels  
    - Format: JPEG  
    - Filename: `blog-image-{executionId}.jpeg`  
    - Connect from Download Post Image node.

24. **Create a Postiz Node to Upload Image**  
    - Type: Postiz (uploadFile operation)  
    - Binary Property: Set to previous node's binary data  
    - Configure Postiz API credentials securely  
    - Connect from Transform/Resize Image node.

25. **Create a Code Node to Validate Inputs for Posting**  
    - Type: Code  
    - Check presence of summary text, link, and uploaded image ID/path  
    - Throw error if any missing  
    - Connect from Save Temporary Link Hash to File node (for text) and Upload Image to Postiz node (for image info)

26. **Create an HTTP Request Node to Post Content to Postiz API**  
    - Type: HTTP Request  
    - Method: POST  
    - URL: Your Postiz API endpoint (e.g., `https://postiz.selfhosteddomain.net/api/public/v1/posts`)  
    - Body: JSON with multiple platform integrations, dynamic content fields for text, hashtags, link, and image IDs  
    - Authentication: Use Postiz API credentials (do not hardcode)  
    - Headers: Include `Content-Type: application/json`  
    - Connect from Validate Inputs node.

27. **Create a Code Node to Save Posted Hash**  
    - Type: Code  
    - Write last posted `linkHash` to `/.n8n/rss_last_posted.txt` for duplication tracking  
    - Connect from Create and Post Content via Postiz API node.

28. **Disable Postiz (Create Post) Node**  
    - Note: Due to known bugs posting to Instagram via Postiz node, this node is disabled. Use the HTTP Request node instead.

---

## 5. General Notes & Resources

| Note Content                                                                                                                                                                                               | Context or Link                                                                                  |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Replace 'Blog's Name' and the URL with your own RSS feed details (e.g., your blog's RSS URL).                                                                                                                | Sticky Note at workflow start                                                                   |
| This node fetches the RSS feed. Ensure the URL matches your blog—update if needed for custom feeds.                                                                                                          | Sticky Note near RSS Fetch node                                                                 |
| Customize the LLM prompt for your content niche (e.g., change tone, fallback summary, or hashtag style to fit your blog's theme).                                                                           | Sticky Note near LLM prompt node                                                                |
| Select your preferred Ollama model (e.g., gemma3:12b or alternatives like LLaMA). Update credentials with your local Ollama API setup.                                                                       | Sticky Note near Ollama model node                                                              |
| Adjust maxChars calculation, hashtag reserve (default 50 chars), or buffers if using different platforms/limits (e.g., increase for longer hashtags).                                                       | Sticky Note near character limit calculation node                                               |
| Update validation logic if your inputs vary (e.g., add checks for custom fields like text length, link format, or image presence).                                                                           | Sticky Note near Validation node                                                                |
| This node posts to social platforms via Postiz API—crucial for the workflow! Update URL if your Postiz instance differs (e.g., self-hosted endpoint). Set authentication: Add your Postiz API credentials.    | Sticky Note near Postiz HTTP Request node                                                      |
| The "Postiz (Create Post)" node is deactivated due to a compatibility bug with Instagram's JSON payload in the Postiz-n8n integration (see GitHub issue https://github.com/gitroomhq/postiz-n8n/issues/7).   | Sticky Note near disabled Postiz Create Post node                                               |

---

**Disclaimer:** The provided content is exclusively derived from an automated workflow built with n8n, adhering strictly to current content policies and containing no illegal, offensive, or protected elements. All handled data are legal and publicly available.

---