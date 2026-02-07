Auto-Generate Instagram Carousels with GPT-Image-1 & AI Captions from Google Sheets

https://n8nworkflows.xyz/workflows/auto-generate-instagram-carousels-with-gpt-image-1---ai-captions-from-google-sheets-7750


# Auto-Generate Instagram Carousels with GPT-Image-1 & AI Captions from Google Sheets

### 1. Workflow Overview

This workflow automates the generation and publishing of Instagram carousel posts using AI-generated images and captions. It is designed to pull content ideas from Google Sheets, generate AI-based descriptions and images using OpenAI's GPT models (including the GPT-image-1 model), upload images to Cloudinary, and then post a carousel on Instagram via Facebook's Graph API.

Logical blocks:

- **1.1 Input Trigger and Data Retrieval:** Scheduled trigger initiates the workflow, fetching pending post data from Google Sheets.
- **1.2 AI Caption Generation:** Uses OpenAI models to generate Instagram post descriptions.
- **1.3 Carousel Image Generation:** Loops over items to generate AI images using OpenAI's image generation API.
- **1.4 Image Processing and Upload:** Converts images to files, uploads them to Cloudinary, and prepares media IDs for Instagram.
- **1.5 Instagram Carousel Posting:** Creates Instagram media carousel posts using uploaded images and captions.
- **1.6 Workflow Control and Data Update:** Manages workflow branching, updates Google Sheets with completed post status, and retrieves next pending items.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Trigger and Data Retrieval

- **Overview:** This block triggers the workflow on a schedule, retrieves pending posts from Google Sheets, and checks if there is work to do.
- **Nodes Involved:** `Schedule Trigger`, `Get Pending`, `If`, `Facebook Pages`, `ig-user-id`, `IG User ID`
- **Node Details:**

  - **Schedule Trigger**
    - Type: Trigger node
    - Role: Initiates workflow at scheduled intervals.
    - Config: Default scheduling parameters.
    - Input/Output: No input; outputs trigger event to `Get Pending`.
    - Edge cases: Trigger may fail if scheduler misconfigured.

  - **Get Pending**
    - Type: Google Sheets node
    - Role: Retrieves rows marked as pending for Instagram post creation.
    - Config: Reads from configured Google Sheet with pending post data.
    - Input: Triggered by Schedule Trigger.
    - Output: Data to `If` node.
    - Failures: Google Sheets API auth errors or missing sheet.

  - **If**
    - Type: Conditional node
    - Role: Checks if retrieved data contains pending items.
    - Config: Condition to proceed only if data exists.
    - Input: Data from `Get Pending`.
    - Output: If true, passes to `Generate Description for Instagram`.
    - Edge cases: Empty data causes exit, preventing further processing.

  - **Facebook Pages**
    - Type: HTTP Request
    - Role: Fetches Facebook Pages linked to account, required for Instagram posting.
    - Config: Uses Facebook Graph API with OAuth2 credentials.
    - Input: Triggered after `Get Pending` or via setup flow.
    - Outputs: To `ig-user-id`.
    - Failures: Auth token expiration or permission issues.

  - **ig-user-id**
    - Type: HTTP Request
    - Role: Retrieves Instagram User ID from Facebook Page ID.
    - Config: Facebook Graph API call to get Instagram business account ID.
    - Input: Facebook Page ID from `Facebook Pages`.
    - Output: To `IG User ID`.
    - Edge cases: Missing Instagram linkage results in failure.

  - **IG User ID**
    - Type: Set node
    - Role: Stores Instagram User ID for downstream use.
    - Config: Simple variable setting from previous node output.
    - Input: `ig-user-id`.
    - Output: Used in Instagram media creation nodes.

#### 2.2 AI Caption Generation

- **Overview:** Generates Instagram post captions/descriptions using OpenAI language models.
- **Nodes Involved:** `Generate Description for Instagram`, `OpenAI Chat Model`, `Basic LLM Chain`, `Item List Output Parser`
- **Node Details:**

  - **Generate Description for Instagram**
    - Type: OpenAI node (LangChain OpenAI)
    - Role: Produces caption text from input prompts.
    - Config: GPT-based language model configured with retry on fail and delay between tries.
    - Inputs: Conditional trigger from `If`.
    - Output: Feeds into `Basic LLM Chain`.
    - Failures: API rate limiting, prompt errors.

  - **OpenAI Chat Model**
    - Type: LangChain Chat Model node
    - Role: Serves as language model backend for chain processing.
    - Input: Used internally by `Basic LLM Chain`.
    - Output: Passes responses to `Basic LLM Chain`.
    - Edge cases: Model version compatibility needed.

  - **Basic LLM Chain**
    - Type: LangChain Chain node
    - Role: Processes OpenAI Chat model along with output parser.
    - Config: Uses `OpenAI Chat Model` and `Item List Output Parser` as components.
    - Input: From `Generate Description for Instagram`.
    - Output: To `Loop Over Items`.
    - Notes: Coordinates AI prompt handling and parsing.

  - **Item List Output Parser**
    - Type: LangChain Output Parser node
    - Role: Parses AI output into structured list for further processing.
    - Input: Linked internally to `Basic LLM Chain`.
    - Output: Provides structured data to chain.

#### 2.3 Carousel Image Generation

- **Overview:** Iterates over caption items to generate AI images for each carousel slide.
- **Nodes Involved:** `Loop Over Items`, `OpenAI - Generate Image`
- **Node Details:**

  - **Loop Over Items**
    - Type: SplitInBatches node
    - Role: Processes each item (caption/image prompt) individually.
    - Config: Splits incoming array into batches of one to sequentially process.
    - Input: From `Basic LLM Chain`.
    - Output: Splits to `OpenAI - Generate Image` and `IG images ID`.
    - Edge cases: Handling empty or malformed items.

  - **OpenAI - Generate Image**
    - Type: HTTP Request node
    - Role: Calls OpenAI's image generation API (likely DALL·E or GPT-image-1).
    - Config: Includes retry on failure, with max 2 tries.
    - Input: Image prompts from looped items.
    - Output: Raw image data to `Separate Image Outputs`.
    - Failures: API limits, invalid prompts, network issues.

#### 2.4 Image Processing and Upload

- **Overview:** Converts AI-generated images to files, uploads to Cloudinary, and prepares URLs for Instagram.
- **Nodes Involved:** `Separate Image Outputs`, `Convert to File`, `Cloudinary`, `URL`
- **Node Details:**

  - **Separate Image Outputs**
    - Type: SplitOut node
    - Role: Extracts individual images from API response array.
    - Input: From `OpenAI - Generate Image`.
    - Output: To `Convert to File`.
    - Edge cases: Empty responses or unexpected formats.

  - **Convert to File**
    - Type: ConvertToFile node
    - Role: Converts base64 or URL image data into file format usable by Cloudinary.
    - Input: From `Separate Image Outputs`.
    - Output: To `Cloudinary`.
    - Failures: Conversion errors if data corrupted.

  - **Cloudinary**
    - Type: HTTP Request node
    - Role: Uploads images to Cloudinary cloud storage.
    - Config: Uses Cloudinary credentials and API for image upload.
    - Input: File data from `Convert to File`.
    - Output: Returns uploaded image URL or ID to `URL`.
    - Failures: Upload limits, auth errors.

  - **URL**
    - Type: Set node
    - Role: Stores Cloudinary image URL for further processing.
    - Input: From `Cloudinary`.
    - Output: To `Wait`.

#### 2.5 Instagram Carousel Posting

- **Overview:** Collects uploaded image IDs, creates Instagram carousel media, and publishes the post with caption.
- **Nodes Involved:** `Wait`, `IG images ID`, `Images ID Array`, `IG Media Carousel`, `Wait1`, `IG post Media`, `Completed`, `Next Pending`
- **Node Details:**

  - **Wait**
    - Type: Wait node
    - Role: Throttles requests to comply with API rate limits.
    - Input: From `URL`.
    - Output: To `Loop Over Items`.
    - Edge cases: Long waits may stall workflow; short waits risk rate limit errors.

  - **IG images ID**
    - Type: HTTP Request node
    - Role: Possibly retrieves or confirms Instagram media IDs after upload.
    - Input: From `Loop Over Items`.
    - Output: To `Images ID Array`.
    - Failures: API errors, invalid IDs.

  - **Images ID Array**
    - Type: Code node
    - Role: Aggregates multiple Instagram media IDs into an array for carousel creation.
    - Input: From `IG images ID`.
    - Output: To `IG Media Carousel`.
    - Edge cases: Empty or malformed IDs break carousel creation.

  - **IG Media Carousel**
    - Type: HTTP Request node
    - Role: Creates Instagram carousel container with multiple media attachments.
    - Input: Array of media IDs.
    - Output: To `Wait1`.
    - Failures: API permission errors, invalid media.

  - **Wait1**
    - Type: Wait node
    - Role: Ensures Instagram has finalized media creation before publishing.
    - Input: From `IG Media Carousel`.
    - Output: To `IG post Media`.
    - Edge cases: Timing too short may cause post failures.

  - **IG post Media**
    - Type: HTTP Request node (with error continuation)
    - Role: Publishes the carousel post to Instagram with caption.
    - Input: From `Wait1`.
    - Output: To `Completed`.
    - Failures: Posting errors, permission issues; error allowed to continue.

  - **Completed**
    - Type: Google Sheets node
    - Role: Marks the post as completed in Google Sheets.
    - Input: From `IG post Media`.
    - Output: To `Next Pending`.
    - Failures: Google Sheets API failures may cause state inconsistency.

  - **Next Pending**
    - Type: Google Sheets node
    - Role: Retrieves next pending posts to process in subsequent runs.
    - Input: From `Completed`.
    - Output: Loop or end workflow.

---

### 3. Summary Table

| Node Name                 | Node Type                   | Functional Role                                  | Input Node(s)                   | Output Node(s)                 | Sticky Note                                      |
|---------------------------|-----------------------------|-------------------------------------------------|--------------------------------|-------------------------------|-------------------------------------------------|
| Schedule Trigger          | Schedule Trigger             | Initiates workflow on schedule                   | -                              | Get Pending                   |                                                 |
| Get Pending               | Google Sheets               | Retrieves pending posts data                      | Schedule Trigger               | If                            |                                                 |
| If                        | If                          | Checks if there are pending posts                 | Get Pending                   | Generate Description for Instagram |                                                 |
| Generate Description for Instagram | OpenAI (LangChain OpenAI) | Generates Instagram captions                      | If                            | Basic LLM Chain               |                                                 |
| OpenAI Chat Model         | LangChain Chat Model         | Backend language model for chain                   | -                             | Basic LLM Chain               |                                                 |
| Item List Output Parser   | LangChain Output Parser      | Parses AI output into list                         | -                             | Basic LLM Chain               |                                                 |
| Basic LLM Chain           | LangChain Chain             | Manages AI prompt/response chain                   | Generate Description for Instagram, OpenAI Chat Model, Item List Output Parser | Loop Over Items              |                                                 |
| Loop Over Items           | SplitInBatches              | Processes each item (image prompt) individually   | Basic LLM Chain               | IG images ID, OpenAI - Generate Image |                                                 |
| OpenAI - Generate Image   | HTTP Request                | Calls OpenAI image generation API                  | Loop Over Items               | Separate Image Outputs        |                                                 |
| Separate Image Outputs    | SplitOut                    | Extracts individual images from API response      | OpenAI - Generate Image       | Convert to File               |                                                 |
| Convert to File           | ConvertToFile               | Converts image data to file format                 | Separate Image Outputs        | Cloudinary                   |                                                 |
| Cloudinary                | HTTP Request                | Uploads images to Cloudinary                        | Convert to File               | URL                          |                                                 |
| URL                       | Set                         | Stores Cloudinary image URL                         | Cloudinary                   | Wait                         |                                                 |
| Wait                      | Wait                        | Throttles requests for API rate limiting           | URL                          | Loop Over Items               |                                                 |
| IG images ID              | HTTP Request                | Retrieves Instagram media IDs                        | Loop Over Items               | Images ID Array              |                                                 |
| Images ID Array           | Code                        | Aggregates media IDs for carousel creation          | IG images ID                 | IG Media Carousel            |                                                 |
| IG Media Carousel         | HTTP Request                | Creates Instagram carousel container                 | Images ID Array              | Wait1                        |                                                 |
| Wait1                     | Wait                        | Waits for Instagram media processing completion    | IG Media Carousel            | IG post Media                |                                                 |
| IG post Media             | HTTP Request                | Publishes Instagram carousel post                    | Wait1                        | Completed                   | On error: continue regular output                |
| Completed                 | Google Sheets               | Marks post as completed                              | IG post Media                | Next Pending                |                                                 |
| Next Pending              | Google Sheets               | Retrieves next pending posts                         | Completed                   | -                           |                                                 |
| Facebook Pages            | HTTP Request                | Retrieves Facebook Pages for Instagram linkage      | Get Pending or setup flow    | ig-user-id                  |                                                 |
| ig-user-id                | HTTP Request                | Retrieves Instagram User ID from Facebook Page      | Facebook Pages               | IG User ID                  |                                                 |
| IG User ID                | Set                         | Stores Instagram User ID                             | ig-user-id                   | -                           |                                                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger node**
   - Set desired schedule (e.g., daily or hourly) for starting workflow.

2. **Create Google Sheets node “Get Pending”**
   - Connect to your Google Sheets account.
   - Configure to read rows flagged as pending posts.

3. **Create If node**
   - Condition: Check if “Get Pending” output contains data.
   - True branch: connect to next node; false branch ends workflow.

4. **Create OpenAI "Generate Description for Instagram" node**
   - Configure OpenAI credentials.
   - Set prompt for generating Instagram captions based on input data.
   - Enable retry on failure with 5-second delay.

5. **Create LangChain nodes:**
   - **OpenAI Chat Model:** set with OpenAI credentials.
   - **Item List Output Parser:** configure to parse AI list outputs.
   - **Basic LLM Chain:** connect “OpenAI Chat Model” and “Item List Output Parser” as sub-nodes.
   - Connect output of “Generate Description for Instagram” to “Basic LLM Chain”.

6. **Create SplitInBatches node “Loop Over Items”**
   - Set batch size to 1 for sequential processing.
   - Connect from “Basic LLM Chain”.

7. **Create HTTP Request node “OpenAI - Generate Image”**
   - Configure to call OpenAI image generation endpoint.
   - Use the prompt from current batch item.
   - Enable retry on failure (max 2 tries).

8. **Create SplitOut node “Separate Image Outputs”**
   - Connect from “OpenAI - Generate Image”.
   - Set to split array of images returned.

9. **Create ConvertToFile node “Convert to File”**
   - Set to convert image data to file format.

10. **Create HTTP Request node “Cloudinary”**
    - Configure Cloudinary API credentials.
    - Set to upload file from “Convert to File”.

11. **Create Set node “URL”**
    - Store Cloudinary image URL from upload response.

12. **Create Wait node**
    - Add wait time to respect API limits before looping.

13. **Connect Wait node back to “Loop Over Items”**, creating loop for each image prompt.

14. **Create HTTP Request node “IG images ID”**
    - Retrieves Instagram media ID using Facebook Graph API.

15. **Create Code node “Images ID Array”**
    - Aggregate media IDs into array for carousel.

16. **Create HTTP Request node “IG Media Carousel”**
    - Create carousel container on Instagram with media IDs.

17. **Create Wait node “Wait1”**
    - Wait to ensure media is ready.

18. **Create HTTP Request node “IG post Media”**
    - Publish carousel post with caption.
    - Set to continue on error.

19. **Create Google Sheets node “Completed”**
    - Mark post as completed in sheet.

20. **Create Google Sheets node “Next Pending”**
    - Fetch next pending posts.

21. **Create HTTP Request nodes “Facebook Pages” and “ig-user-id”**
    - Configure Facebook Pages API and Instagram User ID retrieval.

22. **Create Set node “IG User ID”**
    - Store Instagram User ID for use in media posting nodes.

23. **Connect all nodes following the logical flow above**, ensuring triggers and error handling are in place.

24. **Configure all required credentials:**
    - Google Sheets OAuth2.
    - OpenAI API key.
    - Cloudinary API key.
    - Facebook OAuth2 with Instagram permissions.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                     | Context or Link                                                                                                   |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| This workflow requires proper setup of Facebook and Instagram Business accounts linked together with appropriate permissions for media publishing.              | Facebook Business and Instagram API documentation.                                                               |
| OpenAI GPT-image-1 or DALL·E API must be enabled and configured with sufficient quota to generate images.                                                      | https://platform.openai.com/docs/models/gpt-image-1                                                              |
| Rate limits for Facebook Graph API and OpenAI API require appropriate wait nodes to avoid request throttling errors.                                           | n8n documentation on rate limiting: https://docs.n8n.io/                                                           |
| Google Sheets used as content source and status tracking requires correct sheet structure and OAuth2 credential access.                                        | Ensure Google Sheets API is enabled and sheets have appropriate columns for pending/completed status.             |
| Images are uploaded to Cloudinary to provide stable URLs for Instagram media upload; Cloudinary account required with API key.                                  | https://cloudinary.com/documentation/api_reference                                                               |
| Error handling for Instagram publish node uses "continue on error" to prevent workflow stoppage, allowing batch processing of posts even with some failures.    |                                                                                                                  |

---

**Disclaimer:** The provided text is extracted exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All processed data is legal and public.