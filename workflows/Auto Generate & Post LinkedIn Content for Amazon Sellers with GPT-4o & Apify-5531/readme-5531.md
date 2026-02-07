Auto Generate & Post LinkedIn Content for Amazon Sellers with GPT-4o & Apify

https://n8nworkflows.xyz/workflows/auto-generate---post-linkedin-content-for-amazon-sellers-with-gpt-4o---apify-5531


# Auto Generate & Post LinkedIn Content for Amazon Sellers with GPT-4o & Apify

### 1. Workflow Overview

This workflow automates the generation, curation, and posting of LinkedIn content targeted at Amazon sellers, leveraging GPT-4o (via LangChain nodes) and Apify LinkedIn scraping. It integrates AI-driven content ideation, image generation, influencer data scraping, post scheduling, and Airtable-based record management to streamline social media marketing efforts.

The workflow is logically divided into the following blocks:

- **1.1 Scheduled Trigger & Influencer Data Fetching:** Periodic initiation to fetch influencer usernames from Airtable and iterate over them.
- **1.2 LinkedIn Scraping & Post Detection:** Scrape LinkedIn posts for each influencer, wait for scraper completion, and detect new posts versus existing records.
- **1.3 AI Content Generation:** When new posts are detected, generate new content ideas and images using GPT-4o and OpenAI image generation.
- **1.4 Image Upload & Record Keeping:** Upload generated images to Google Drive and create corresponding Airtable records.
- **1.5 Approved Post Selection & Publishing:** Scheduled selection of approved posts, download images, publish posts to LinkedIn, and mark them as posted in Airtable.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger & Influencer Data Fetching

- **Overview:** Initiates the workflow on a schedule, fetches a list of influencer usernames from Airtable, and sets up iteration over these usernames.
- **Nodes Involved:**  
  - Schedule Trigger  
  - Fetch Influencer Usernames  
  - Loop Through Influencer List

- **Node Details:**

  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Role: Starts the workflow at defined intervals (e.g., daily or weekly).  
    - Configuration: Default schedule, no parameters shown (likely customizable).  
    - Inputs: None (trigger node).  
    - Outputs: Initiates fetching influencer usernames.  
    - Failures: Misconfiguration could cause missed runs.

  - **Fetch Influencer Usernames**  
    - Type: Airtable  
    - Role: Retrieves influencer usernames from a specified Airtable base and table.  
    - Configuration: Airtable credentials configured; filters/fields likely set to get relevant usernames.  
    - Inputs: Trigger from Schedule Trigger.  
    - Outputs: Passes data to batch splitter for iteration.  
    - Failures: Airtable auth errors, rate limits, or empty data sets.

  - **Loop Through Influencer List**  
    - Type: Split In Batches  
    - Role: Iterates through each influencer username individually for sequential processing.  
    - Configuration: Batch size likely 1 for individual processing.  
    - Inputs: Influencer list from Airtable node.  
    - Outputs: Two outputs - one for next iteration (empty array) and one for LinkedIn scraper trigger.  
    - Failures: Misconfigured batch size or data format issues.

---

#### 2.2 LinkedIn Scraping & Post Detection

- **Overview:** Scrapes LinkedIn posts for each influencer, waits for scraper completion, then compares scraped posts with Airtable records to detect new content.
- **Nodes Involved:**  
  - Run LinkedIn Scraper  
  - Wait for Scraper to Finish  
  - Fetch Scraper Output  
  - If Post Exists in Scraper Response  
  - Fetch Last Post in Airtable  
  - If New Post Found

- **Node Details:**

  - **Run LinkedIn Scraper**  
    - Type: HTTP Request  
    - Role: Starts the Apify LinkedIn scraper for the current influencer.  
    - Configuration: HTTP POST/GET with scraper API endpoint and influencer username in the payload.  
    - Inputs: From Loop Through Influencer List (batch output).  
    - Outputs: Passes job ID or similar to Wait node.  
    - Failures: Network errors, API auth, invalid username.

  - **Wait for Scraper to Finish**  
    - Type: Wait (Webhook)  
    - Role: Waits asynchronously for the scraper job completion signal. Uses webhook ID for notification.  
    - Inputs: Output from Run LinkedIn Scraper.  
    - Outputs: Triggers Fetch Scraper Output on completion.  
    - Failures: Webhook timeout or missed signals.

  - **Fetch Scraper Output**  
    - Type: HTTP Request  
    - Role: Retrieves the completed scraper results (LinkedIn posts data).  
    - Configuration: HTTP GET with job ID from previous nodes.  
    - Inputs: From Wait node.  
    - Outputs: Passes scraped post data to condition node.  
    - Failures: API errors, data format issues.

  - **If Post Exists in Scraper Response**  
    - Type: If  
    - Role: Checks if the scraper output contains any LinkedIn posts.  
    - Configuration: Expression to verify presence of posts in response data.  
    - Inputs: From Fetch Scraper Output.  
    - Outputs: True branch leads to Fetch Last Post in Airtable; False loops back to Wait node to retry.  
    - Failures: Expression errors if data format changes.

  - **Fetch Last Post in Airtable**  
    - Type: Airtable  
    - Role: Retrieves the last stored LinkedIn post for the current influencer from Airtable.  
    - Inputs: True branch from previous If node.  
    - Outputs: Passes data to next If node for comparison.  
    - Failures: Airtable auth, data missing.

  - **If New Post Found**  
    - Type: If  
    - Role: Compares the scraper’s latest post with the last Airtable record to detect new content.  
    - Inputs: From Fetch Last Post in Airtable.  
    - Outputs: True branch triggers AI content generation; False branch proceeds to loop next influencer.  
    - Failures: Logic errors if data structure mismatched.

---

#### 2.3 AI Content Generation

- **Overview:** For each new post found, generates fresh LinkedIn content ideas and images using GPT-4o and OpenAI image generation services.
- **Nodes Involved:**  
  - Idea Generator  
  - OpenAI Chat Model  
  - Structured Output Parser  
  - Generate Image

- **Node Details:**

  - **Idea Generator**  
    - Type: LangChain Agent  
    - Role: Coordinates AI agents, initiates content ideation based on input prompts.  
    - Configuration: Uses LangChain agent with relevant prompt templates.  
    - Inputs: Triggered from If New Post Found node.  
    - Outputs: Passes structured AI output to image generation.  
    - Failures: API quota, timeout, prompt errors.

  - **OpenAI Chat Model**  
    - Type: LangChain OpenAI Chat Model  
    - Role: Provides GPT-4o language model interaction for content generation.  
    - Configuration: Linked as AI language model node for Idea Generator.  
    - Inputs: From Idea Generator as language model backend.  
    - Outputs: Feeds raw AI output back to Idea Generator node.  
    - Failures: Auth errors, rate limits.

  - **Structured Output Parser**  
    - Type: LangChain Structured Output Parser  
    - Role: Parses AI output into structured JSON or defined output format for further processing.  
    - Inputs: AI raw output from Idea Generator.  
    - Outputs: Structured data passed back to Idea Generator.  
    - Failures: Parsing errors if AI output format is unexpected.

  - **Generate Image**  
    - Type: LangChain OpenAI (Image Generation)  
    - Role: Creates images based on AI-generated content prompts for posts.  
    - Inputs: From Idea Generator’s main output.  
    - Outputs: Passes images to Google Drive upload node.  
    - Failures: API errors, unsupported prompt formats.

---

#### 2.4 Image Upload & Record Keeping

- **Overview:** Uploads generated images to Google Drive and creates new records in Airtable linking the post content and media.
- **Nodes Involved:**  
  - Upload Image to Google Drive  
  - Create Airtable Record

- **Node Details:**

  - **Upload Image to Google Drive**  
    - Type: Google Drive  
    - Role: Uploads generated images to a designated Google Drive folder for storage and access.  
    - Configuration: Google Drive OAuth2 credentials configured; target folder specified.  
    - Inputs: From Generate Image node.  
    - Outputs: Passes file metadata to Airtable record creation.  
    - Failures: Auth issues, file size limits.

  - **Create Airtable Record**  
    - Type: Airtable  
    - Role: Inserts new post record with content, image link, and metadata into Airtable base.  
    - Inputs: From Upload Image node and/or Loop Through Influencer List for context.  
    - Outputs: Loops back to influencer iteration for next cycle.  
    - Failures: Airtable API errors.

---

#### 2.5 Approved Post Selection & Publishing

- **Overview:** Periodically finds approved LinkedIn posts from Airtable, downloads associated images, posts content to LinkedIn, and marks posts as published.
- **Nodes Involved:**  
  - Schedule (second schedule node)  
  - Find Approved LinkedIn Posts  
  - Pick One Approved Post  
  - Download Post Image from Drive  
  - Publish Post to LinkedIn  
  - Mark Post as Posted in Airtable

- **Node Details:**

  - **Schedule**  
    - Type: Schedule Trigger  
    - Role: Initiates post publishing workflow on a preset schedule.  
    - Inputs: None (trigger).  
    - Outputs: Triggers Airtable search for approved posts.

  - **Find Approved LinkedIn Posts**  
    - Type: Airtable  
    - Role: Queries Airtable for posts marked as approved but not yet posted.  
    - Outputs: List of candidate posts.

  - **Pick One Approved Post**  
    - Type: Limit  
    - Role: Limits the flow to a single post to publish per run.  
    - Configuration: Limit count set to 1.  
    - Outputs: Passes one post for image download.

  - **Download Post Image from Drive**  
    - Type: Google Drive  
    - Role: Downloads the image file associated with the post from Google Drive.  
    - Inputs: Selected post metadata.  
    - Outputs: Passes file to LinkedIn publishing node.

  - **Publish Post to LinkedIn**  
    - Type: LinkedIn  
    - Role: Publishes the post content and image to LinkedIn on behalf of the configured account.  
    - Inputs: Post text and image file.  
    - Outputs: On success, triggers marking the post as posted.

  - **Mark Post as Posted in Airtable**  
    - Type: Airtable  
    - Role: Updates the post record in Airtable to mark it as posted, preventing re-posting.  
    - Inputs: From LinkedIn publishing node.  
    - Outputs: Ends the publishing cycle.

---

### 3. Summary Table

| Node Name                    | Node Type                                   | Functional Role                                   | Input Node(s)                      | Output Node(s)                      | Sticky Note                          |
|------------------------------|---------------------------------------------|--------------------------------------------------|----------------------------------|-----------------------------------|------------------------------------|
| Schedule Trigger              | Schedule Trigger                            | Initiates influencer data fetching                | None                             | Fetch Influencer Usernames         |                                    |
| Fetch Influencer Usernames    | Airtable                                    | Retrieves influencer usernames                     | Schedule Trigger                 | Loop Through Influencer List       |                                    |
| Loop Through Influencer List  | Split In Batches                            | Iterates over influencer usernames                 | Fetch Influencer Usernames       | Run LinkedIn Scraper (output 2)    |                                    |
| Run LinkedIn Scraper          | HTTP Request                               | Starts LinkedIn scraping job                       | Loop Through Influencer List     | Wait for Scraper to Finish         |                                    |
| Wait for Scraper to Finish    | Wait (Webhook)                             | Waits for scraper job completion                   | Run LinkedIn Scraper             | Fetch Scraper Output               |                                    |
| Fetch Scraper Output          | HTTP Request                               | Retrieves LinkedIn posts scraped data              | Wait for Scraper to Finish       | If Post Exists in Scraper Response |                                    |
| If Post Exists in Scraper Response | If                                    | Checks if scraper returned posts                    | Fetch Scraper Output             | Fetch Last Post in Airtable (true) / Wait for Scraper to Finish (false) |                                    |
| Fetch Last Post in Airtable   | Airtable                                    | Gets last LinkedIn post record for influencer      | If Post Exists in Scraper Response | If New Post Found                 |                                    |
| If New Post Found             | If                                         | Determines if a new post was found                  | Fetch Last Post in Airtable      | Idea Generator (true) / Loop Through Influencer List (false) |                                    |
| Idea Generator               | LangChain Agent                            | Generates LinkedIn post ideas                       | If New Post Found               | Generate Image                    |                                    |
| OpenAI Chat Model             | LangChain OpenAI Chat                      | Provides GPT-4o language model                      | Idea Generator (ai_languageModel) | Idea Generator (ai_languageModel) |                                    |
| Structured Output Parser      | LangChain Structured Output Parser         | Parses AI output to structured data                 | Idea Generator (ai_outputParser) | Idea Generator (ai_outputParser)  |                                    |
| Generate Image               | LangChain OpenAI (Image Generation)       | Generates images from AI prompts                     | Idea Generator                  | Upload Image to Google Drive       |                                    |
| Upload Image to Google Drive  | Google Drive                               | Uploads images to Google Drive                       | Generate Image                  | Create Airtable Record             |                                    |
| Create Airtable Record        | Airtable                                    | Creates new post record with content and image      | Upload Image to Google Drive    | Loop Through Influencer List       |                                    |
| Schedule                     | Schedule Trigger                            | Starts post publishing flow                         | None                           | Find Approved LinkedIn Posts       |                                    |
| Find Approved LinkedIn Posts  | Airtable                                    | Queries approved, unposted LinkedIn posts           | Schedule                       | Pick One Approved Post             |                                    |
| Pick One Approved Post        | Limit                                       | Selects one post to publish                          | Find Approved LinkedIn Posts    | Download Post Image from Drive     |                                    |
| Download Post Image from Drive | Google Drive                               | Downloads post image                                 | Pick One Approved Post          | Publish Post to LinkedIn           |                                    |
| Publish Post to LinkedIn      | LinkedIn                                    | Posts content and image                              | Download Post Image from Drive  | Mark Post as Posted in Airtable    |                                    |
| Mark Post as Posted in Airtable | Airtable                                  | Marks post as published                              | Publish Post to LinkedIn        | None                             |                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node** (for fetching influencers)  
   - Node Type: Schedule Trigger  
   - Configure desired interval (e.g., daily at 8 AM).  
   - No inputs. Output connects to Fetch Influencer Usernames.

2. **Create Airtable Node "Fetch Influencer Usernames"**  
   - Node Type: Airtable  
   - Configure Airtable credentials.  
   - Select base and table containing influencer usernames.  
   - Retrieve relevant fields for usernames.  
   - Connect input from Schedule Trigger. Output to Loop Through Influencer List.

3. **Create Split In Batches Node "Loop Through Influencer List"**  
   - Node Type: Split In Batches  
   - Set batch size to 1 for single influencer processing.  
   - Connect input from Fetch Influencer Usernames.  
   - Two outputs:  
     - Output 1 (empty) back to itself for next batch iteration.  
     - Output 2 to Run LinkedIn Scraper.

4. **Create HTTP Request Node "Run LinkedIn Scraper"**  
   - Node Type: HTTP Request  
   - Configure with Apify LinkedIn scraper API URL.  
   - Set method to POST or GET as required.  
   - Pass influencer username from current batch item.  
   - Connect input from Loop Through Influencer List (output 2).  
   - Output to Wait for Scraper to Finish.

5. **Create Wait Node "Wait for Scraper to Finish"**  
   - Node Type: Wait (Webhook)  
   - Configure webhook with unique ID for scraper callback.  
   - Connect input from Run LinkedIn Scraper.  
   - Output to Fetch Scraper Output.

6. **Create HTTP Request Node "Fetch Scraper Output"**  
   - Node Type: HTTP Request  
   - Configure GET request to Apify API with job ID from scraper.  
   - Connect input from Wait for Scraper to Finish.  
   - Output to If Post Exists in Scraper Response.

7. **Create If Node "If Post Exists in Scraper Response"**  
   - Node Type: If  
   - Configure expression to check if posts exist in scraper data (e.g., `{{$json["posts"] && $json["posts"].length > 0}}`).  
   - True output to Fetch Last Post in Airtable.  
   - False output back to Wait for Scraper to Finish (to retry).

8. **Create Airtable Node "Fetch Last Post in Airtable"**  
   - Node Type: Airtable  
   - Configure to query last post record for current influencer.  
   - Connect input from If Post Exists in Scraper Response (true).  
   - Output to If New Post Found.

9. **Create If Node "If New Post Found"**  
   - Node Type: If  
   - Configure to compare scraper latest post with Airtable last post (e.g., by post ID or timestamp).  
   - True output to Idea Generator.  
   - False output to Loop Through Influencer List (output 1).

10. **Create LangChain Agent Node "Idea Generator"**  
    - Node Type: LangChain Agent  
    - Configure prompt to generate LinkedIn post ideas based on detected new post.  
    - Connect input from If New Post Found (true).  
    - Output to Generate Image.  
    - Link AI language model input to OpenAI Chat Model node.  
    - Link AI output parser to Structured Output Parser node.

11. **Create LangChain OpenAI Chat Model Node "OpenAI Chat Model"**  
    - Node Type: LangChain OpenAI Chat Model  
    - Configure with OpenAI credentials (GPT-4o).  
    - Connect as AI language model to Idea Generator.

12. **Create LangChain Structured Output Parser Node "Structured Output Parser"**  
    - Node Type: LangChain Structured Output Parser  
    - Configure to parse AI output into JSON structure (e.g., for post text, keywords).  
    - Connect as AI output parser to Idea Generator.

13. **Create LangChain OpenAI Node "Generate Image"**  
    - Node Type: LangChain OpenAI (Image generation)  
    - Configure with OpenAI image generation credentials.  
    - Connect input from Idea Generator.  
    - Output to Upload Image to Google Drive.

14. **Create Google Drive Node "Upload Image to Google Drive"**  
    - Node Type: Google Drive  
    - Configure Google Drive OAuth2 credentials.  
    - Specify target folder for uploads.  
    - Connect input from Generate Image.  
    - Output to Create Airtable Record.

15. **Create Airtable Node "Create Airtable Record"**  
    - Node Type: Airtable  
    - Configure to insert new record with post content, image URL, influencer metadata.  
    - Connect input from Upload Image to Google Drive.  
    - Output to Loop Through Influencer List (output 1) for next influencer.

16. **Create Second Schedule Trigger Node "Schedule"**  
    - Node Type: Schedule Trigger  
    - Configure for desired post publishing interval.  
    - Output to Find Approved LinkedIn Posts.

17. **Create Airtable Node "Find Approved LinkedIn Posts"**  
    - Node Type: Airtable  
    - Configure to query posts marked as "approved" and not yet posted.  
    - Connect input from Schedule.  
    - Output to Pick One Approved Post.

18. **Create Limit Node "Pick One Approved Post"**  
    - Node Type: Limit  
    - Configure limit to 1 post per run.  
    - Connect input from Find Approved LinkedIn Posts.  
    - Output to Download Post Image from Drive.

19. **Create Google Drive Node "Download Post Image from Drive"**  
    - Node Type: Google Drive  
    - Configure with Google Drive credentials.  
    - Download image file using metadata from selected post.  
    - Connect input from Pick One Approved Post.  
    - Output to Publish Post to LinkedIn.

20. **Create LinkedIn Node "Publish Post to LinkedIn"**  
    - Node Type: LinkedIn  
    - Configure LinkedIn OAuth2 credentials and target company or profile.  
    - Post image and text content.  
    - Connect input from Download Post Image from Drive.  
    - Output to Mark Post as Posted in Airtable.

21. **Create Airtable Node "Mark Post as Posted in Airtable"**  
    - Node Type: Airtable  
    - Update post record to mark as posted (e.g., set "posted" checkbox).  
    - Connect input from Publish Post to LinkedIn.  
    - No outputs; ends publishing flow.

---

### 5. General Notes & Resources

| Note Content                                                                                   | Context or Link                                                       |
|------------------------------------------------------------------------------------------------|----------------------------------------------------------------------|
| This workflow uses Apify LinkedIn scraping API, which requires a valid Apify account and scraper setup. | Apify LinkedIn Scraper documentation: https://apify.com/linkedin-scraper |
| The AI content generation leverages GPT-4o via LangChain nodes, requiring OpenAI API credentials. | OpenAI API: https://platform.openai.com/docs/api-reference/introduction |
| Google Drive nodes require OAuth2 credential setup with appropriate permissions for file upload/download. | Google Drive API guide: https://developers.google.com/drive/api/v3/about-sdk |
| Airtable integration requires API key and base/table configuration; limit API calls to avoid rate limiting. | Airtable API docs: https://airtable.com/api                           |
| LinkedIn posting requires OAuth2 credentials and correct permissions to post on behalf of the user or company. | LinkedIn API docs: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/ugc-post-api |
| The workflow includes multiple schedule triggers: one for content generation and another for post publishing. Correct scheduling is essential to avoid conflicts. | Ensure schedule nodes do not overlap undesirably.                     |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly complies with current content policies and includes no illegal, offensive, or protected elements. All handled data is legal and public.