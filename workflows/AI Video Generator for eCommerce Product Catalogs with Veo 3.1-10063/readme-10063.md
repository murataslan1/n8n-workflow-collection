AI Video Generator for eCommerce Product Catalogs with Veo 3.1

https://n8nworkflows.xyz/workflows/ai-video-generator-for-ecommerce-product-catalogs-with-veo-3-1-10063


# AI Video Generator for eCommerce Product Catalogs with Veo 3.1

### 1. Workflow Overview

This workflow, titled **AI Video Generator for eCommerce Product Catalogs with Veo 3.1**, automates the creation of dynamic product showcase videos from static product images extracted from eCommerce catalog pages. It targets online retailers and marketers who want to transform static product listings—especially fashion and apparel—into engaging, model-animated videos to enhance product pages and boost conversion rates.

The workflow consists of the following logical blocks:

- **1.1 Input Reception:** Receives a product catalog URL submitted via a web form.
- **1.2 Product Data Extraction:** Uses Firecrawl to scrape product titles and exact image URLs from the catalog page.
- **1.3 Product List Processing:** Splits and optionally limits the product list for batch processing.
- **1.4 Product Iteration and Image Handling:** Iterates over each product, fetches the product image, converts it into suitable formats, and uploads the source image to Google Drive.
- **1.5 Video Generation via Google Veo 3.1 API:** Constructs prompts and sends requests to the Google Gemini Veo 3.1 API to generate an 8-second video per product, polls for completion, downloads the finished video, and uploads it to Google Drive.
- **1.6 Loop Control and Completion:** Repeats the iteration for all products, ensuring continuous processing and storage of assets.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  Captures user input for the product catalog URL via a web form, triggering workflow execution.

- **Nodes Involved:**  
  - `form_trigger`

- **Node Details:**

  - `form_trigger`  
    - Type: Form Trigger (Webhook-based)  
    - Configuration:  
      - Presents a form titled "eCommerce Catelog Form" with one required field: "Url" (product collection URL).  
    - Input: HTTP form submission with URL field.  
    - Output: JSON containing the submitted URL.  
    - Edge Cases: Missing or malformed URL input will prevent scraping; form validation ensures URL is required.  
    - Version: 2.3

#### 2.2 Product Data Extraction

- **Overview:**  
  Scrapes the submitted catalog URL to extract an array of products, each with a title and exact product image URL.

- **Nodes Involved:**  
  - `scrape_catalog_collection`

- **Node Details:**

  - `scrape_catalog_collection`  
    - Type: Firecrawl Scraper Node  
    - Configuration:  
      - Uses the submitted URL from `form_trigger`.  
      - Operation: `scrape` with JSON output.  
      - Extraction schema extracts `products` array with each product’s `title` and precise `image_url` (taken exactly from HTML `<img>` tags' `src`, `srcset`, or `data-src` attributes, preserving full URL with domain and parameters).  
      - Timeout: 180 seconds.  
    - Input: URL string from `form_trigger`.  
    - Output: JSON object with `products` array.  
    - Credentials: Firecrawl API credentials required.  
    - Edge Cases: Network timeouts, invalid URL, or unexpected HTML structure may cause empty or malformed product lists.  
    - Version: 1

#### 2.3 Product List Processing

- **Overview:**  
  Splits the product array into individual products and optionally limits the number of products to process.

- **Nodes Involved:**  
  - `split_products`  
  - `limit_products`  
  - `iterate_products`

- **Node Details:**

  - `split_products`  
    - Type: Split Out Node  
    - Configuration: Splits JSON array at path `data.json.products` into individual items.  
    - Input: JSON products array from `scrape_catalog_collection`.  
    - Output: Individual product objects.  
    - Edge Cases: Empty input array results in no output.  
    - Version: 1

  - `limit_products`  
    - Type: Limit Node  
    - Configuration: Limits number of items passed downstream; default is unlimited unless configured.  
    - Input: Individual products from `split_products`.  
    - Output: Limited subset of products.  
    - Edge Cases: If limit set lower than available products, some products skipped intentionally.  
    - Version: 1

  - `iterate_products`  
    - Type: Split In Batches  
    - Configuration: Batch processing of products, processes each product individually.  
    - Input: Limited product list from `limit_products`.  
    - Output: Single product per execution cycle.  
    - Edge Cases: Batch size defaults to 1; can be adjusted for performance.  
    - Version: 3

#### 2.4 Product Iteration and Image Handling

- **Overview:**  
  For each product, downloads the product image, converts it to base64 and binary formats, and uploads the source image to Google Drive.

- **Nodes Involved:**  
  - `fetch_image`  
  - `convert_to_base64`  
  - `convert_to_binary`  
  - `upload_source_image`

- **Node Details:**

  - `fetch_image`  
    - Type: HTTP Request  
    - Configuration: Fetches the image from the exact `image_url` of the current product.  
    - Input: Product object from `iterate_products`.  
    - Output: Raw image data.  
    - Edge Cases: Image URL invalid, network errors, or large images causing timeouts.  
    - Version: 4.2

  - `convert_to_base64`  
    - Type: Extract From File  
    - Configuration: Converts binary image data to Base64 string property `data`.  
    - Input: Binary data from `fetch_image`.  
    - Output: JSON with Base64-encoded image string.  
    - Edge Cases: Corrupt image data causing conversion errors.  
    - Version: 1

  - `convert_to_binary`  
    - Type: Convert To File  
    - Configuration: Converts Base64 string back into binary format for upload.  
    - Input: Base64 data from `convert_to_base64`.  
    - Output: Binary file data.  
    - Version: 1.1

  - `upload_source_image`  
    - Type: Google Drive Node  
    - Configuration: Uploads the binary image file to a specified Google Drive folder with dynamic naming `Source Image #N` where N is run index + 1.  
    - Credentials: Google Drive OAuth2 required.  
    - Edge Cases: Drive API quota limits, permission errors, or invalid folder ID.  
    - Version: 3

#### 2.5 Video Generation via Google Veo 3.1 API

- **Overview:**  
  Prepares a detailed prompt, sends the image and prompt to Google Gemini Veo 3.1 API to generate an 8-second muted video showcasing the product. Then polls for completion, downloads, and uploads the video to Google Drive.

- **Nodes Involved:**  
  - `set_prompt`  
  - `generate_video`  
  - `wait`  
  - `fetch_status`  
  - `check_response`  
  - `download_video`  
  - `upload_output_video`

- **Node Details:**

  - `set_prompt`  
    - Type: Set Node  
    - Configuration: Sets a static prompt detailing video requirements, emphasizing model poses, no audio, 8-second duration, 9:16 aspect ratio, and adult person generation allowed.  
    - Input: After source image upload.  
    - Output: JSON with `prompt` string.  
    - Edge Cases: Prompt must be well-formed JSON string; expression errors if referencing nodes incorrectly.  
    - Version: 3.4

  - `generate_video`  
    - Type: HTTP Request  
    - Configuration:  
      - POST request to Google Gemini Veo 3.1 API endpoint `/predictLongRunning`.  
      - Sends JSON body including prompt text and Base64-encoded image for first and last frame.  
      - Parameters specify duration (8s), aspect ratio (9:16), and person generation policy.  
      - Authenticated with HTTP Header Auth credential (Google Gemini).  
    - Input: Prompt from `set_prompt`, Base64 image from `convert_to_base64`.  
    - Output: JSON response containing operation name for status polling.  
    - Edge Cases: API rate limits, authentication failures, malformed request bodies.  
    - Version: 4.2

  - `wait`  
    - Type: Wait Node  
    - Configuration: Waits 10 seconds before polling the operation status.  
    - Input: After `generate_video` or after `check_response` if video not ready.  
    - Output: Triggers `fetch_status`.  
    - Edge Cases: Fixed wait might be inefficient if video generation varies in time.  
    - Version: 1.1

  - `fetch_status`  
    - Type: HTTP Request  
    - Configuration: GET request to the operation status URL derived from previous response's `name` field.  
    - Authenticated with Google Gemini credentials.  
    - Input: Wait node triggers this.  
    - Output: Status JSON including video generation progress and results if done.  
    - Edge Cases: Transient network errors or delays in operation completion.  
    - Version: 4.2

  - `check_response`  
    - Type: IF Node  
    - Configuration: Checks if the `response` object and its nested `generateVideoResponse.generatedSamples` array exist, indicating video completion.  
    - Input: Status JSON from `fetch_status`.  
    - Output:  
      - True branch: Proceed to download video.  
      - False branch: Loop back to `wait` for further polling.  
    - Edge Cases: Missing or malformed response objects, infinite loops if video never completes.  
    - Version: 2.2

  - `download_video`  
    - Type: HTTP Request  
    - Configuration: Downloads the generated video from the first URI in `generatedSamples`.  
    - Authenticated with Google Gemini credentials.  
    - Input: True branch from `check_response`.  
    - Output: Binary video data.  
    - Edge Cases: Download failures, authorization errors, broken URIs.  
    - Version: 4.2

  - `upload_output_video`  
    - Type: Google Drive Node  
    - Configuration: Uploads the downloaded video binary to a specified Google Drive folder with dynamic naming `Output Video #N`.  
    - Credentials: Google Drive OAuth2.  
    - Edge Cases: API quota, permission issues, folder misconfiguration.  
    - Version: 3

#### 2.6 Loop Control and Completion

- **Overview:**  
  After uploading the output video, the workflow loops back to process the next product image until all products are handled.

- **Nodes Involved:**  
  - `upload_output_video` (output loop)  
  - `iterate_products` (batch continuation)

- **Node Details:**

  - The output of `upload_output_video` connects back to `iterate_products` to process the next product automatically until all batches are complete.

---

### 3. Summary Table

| Node Name              | Node Type                   | Functional Role                               | Input Node(s)               | Output Node(s)             | Sticky Note                                                                                                                             |
|------------------------|-----------------------------|-----------------------------------------------|-----------------------------|-----------------------------|-----------------------------------------------------------------------------------------------------------------------------------------|
| form_trigger           | Form Trigger                | Receives product catalog URL input via form   |                             | scrape_catalog_collection    |                                                                                                                                         |
| scrape_catalog_collection | Firecrawl Scraper Node     | Scrapes products and exact image URLs          | form_trigger                | split_products              |                                                                                                                                         |
| split_products         | Split Out                   | Splits product array into individual products  | scrape_catalog_collection   | limit_products              |                                                                                                                                         |
| limit_products         | Limit                       | Optionally limits number of products processed | split_products              | iterate_products            |                                                                                                                                         |
| iterate_products       | Split In Batches            | Processes products one by one                   | limit_products              | fetch_image (on output 1)   |                                                                                                                                         |
| fetch_image            | HTTP Request                | Downloads product image                         | iterate_products            | convert_to_base64           |                                                                                                                                         |
| convert_to_base64      | Extract From File           | Converts image binary to Base64 string          | fetch_image                 | convert_to_binary           |                                                                                                                                         |
| convert_to_binary      | Convert To File             | Converts Base64 back to binary for upload       | convert_to_base64           | upload_source_image         |                                                                                                                                         |
| upload_source_image    | Google Drive                | Uploads source image to Google Drive             | convert_to_binary           | set_prompt                 |                                                                                                                                         |
| set_prompt             | Set                         | Sets AI text prompt for video generation         | upload_source_image         | generate_video             |                                                                                                                                         |
| generate_video         | HTTP Request                | Sends prompt and image to Google Veo API         | set_prompt                  | wait                      |                                                                                                                                         |
| wait                   | Wait                        | Waits 10 seconds before polling generation status | generate_video, check_response | fetch_status              |                                                                                                                                         |
| fetch_status           | HTTP Request                | Polls the Google Veo API for job completion      | wait                       | check_response             |                                                                                                                                         |
| check_response         | If                          | Checks if video generation is complete          | fetch_status                | download_video (true), wait (false) |                                                                                                                                         |
| download_video         | HTTP Request                | Downloads the finished video                      | check_response             | upload_output_video        |                                                                                                                                         |
| upload_output_video    | Google Drive                | Uploads generated video to Google Drive          | download_video              | iterate_products           |                                                                                                                                         |
| Sticky Note            | Sticky Note                 | Summarizes workflow purpose and steps            |                             |                             | ## Veo 3.1 eCommerce Product Catalog Animator 1. Input a catalog page url for an online store 2. Firecrawl scrapes product images and extracts product images 3. Iterate over each image and make Gemini API call to Veo 3.1 to generate animated product video |
| Sticky Note1           | Sticky Note                 | Detailed project description, setup instructions |                             |                             | Transform static product images from any online store into engaging animated videos using Google's Veo 3.1 AI. Simply submit a catalog page URL and automatically generate professional product showcase videos where models pose and move to display clothing and fashion items from multiple angles - perfect for elevating product pages with dynamic content that increases conversion rates. [Full description and setup steps included] |

---

### 4. Reproducing the Workflow from Scratch

1. **Create `form_trigger` node:**  
   - Type: Form Trigger  
   - Form Title: "eCommerce Catelog Form"  
   - Add one required text field: "Url" with placeholder "Enter a product collection url"  
   - Save and note the webhook URL for form submission.

2. **Add `scrape_catalog_collection` node:**  
   - Type: Firecrawl Scraper  
   - Set URL parameter to `={{ $json.Url }}` (from form input)  
   - Operation: Scrape with JSON output  
   - Configure extraction schema to parse an array `products` with fields: `title` (string), `image_url` (string extracted exactly from `<img>` `src` or `srcset` attributes including full URLs)  
   - Set timeout to 180000 ms (3 minutes)  
   - Set Firecrawl API credentials.

3. **Add `split_products` node:**  
   - Type: Split Out (Split JSON array into items)  
   - Field to split out: `data.json.products`

4. **Add `limit_products` node:**  
   - Type: Limit (optional)  
   - Default limits all items unless configured to restrict quantity

5. **Add `iterate_products` node:**  
   - Type: Split In Batches  
   - Default batch size (default 1) to process products sequentially

6. **Add `fetch_image` node:**  
   - Type: HTTP Request  
   - Set URL to `={{ $json.image_url }}` from current product item

7. **Add `convert_to_base64` node:**  
   - Type: Extract From File  
   - Operation: Binary to Property (Base64 string)

8. **Add `convert_to_binary` node:**  
   - Type: Convert To File  
   - Operation: To Binary from property `data` (Base64 string)

9. **Add `upload_source_image` node:**  
   - Type: Google Drive Upload  
   - Filename: `Source Image #{{ $runIndex + 1 }}`  
   - Drive folder: Set to your Google Drive folder ID for source images  
   - Configure Google Drive OAuth2 credentials

10. **Add `set_prompt` node:**  
    - Type: Set  
    - Assign a string field `prompt` with the detailed video generation prompt text emphasizing:  
      - Model poses featuring the clothing, no audio, muted sound, 8-second video, 9:16 aspect ratio, person generation allowed.

11. **Add `generate_video` node:**  
    - Type: HTTP Request  
    - Method: POST  
    - URL: `https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-generate-preview:predictLongRunning`  
    - Body (JSON): Includes prompt from `set_prompt`, Base64-encoded image from `convert_to_base64` for both first and last frame, parameters for duration and aspect ratio.  
    - Authentication: HTTP Header Auth (Google Gemini credentials)

12. **Add `wait` node:**  
    - Type: Wait  
    - Wait time: 10 seconds

13. **Add `fetch_status` node:**  
    - Type: HTTP Request  
    - Method: GET  
    - URL: `https://generativelanguage.googleapis.com/v1beta/{{ $json.name }}` where `name` is operation name from `generate_video` response  
    - Authentication: HTTP Header Auth (Google Gemini credentials)

14. **Add `check_response` node:**  
    - Type: If  
    - Condition: Check if `response` and `response.generateVideoResponse.generatedSamples` exist (object and array existence)

15. **Add `download_video` node:**  
    - Type: HTTP Request  
    - URL: `={{ $json.response.generateVideoResponse.generatedSamples[0].video.uri }}`  
    - Authentication: HTTP Header Auth (Google Gemini credentials)

16. **Add `upload_output_video` node:**  
    - Type: Google Drive Upload  
    - Filename: `Output Video #{{ $runIndex + 1 }}`  
    - Drive folder: Set to your Google Drive output folder ID for videos  
    - Configure Google Drive OAuth2 credentials

17. **Connect nodes in the following sequence:**  
    - `form_trigger` → `scrape_catalog_collection` → `split_products` → `limit_products` → `iterate_products`  
    - `iterate_products` (output 1) → `fetch_image` → `convert_to_base64` → `convert_to_binary` → `upload_source_image` → `set_prompt` → `generate_video` → `wait` → `fetch_status` → `check_response`  
    - `check_response` true branch → `download_video` → `upload_output_video` → loops back to `iterate_products` for next batch  
    - `check_response` false branch → loops back to `wait` for polling

18. **Set workflow execution order to ensure correct async processing.**

19. **Test the workflow by submitting real catalog URLs from supported eCommerce platforms (Shopify, WooCommerce, etc.).**

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Context or Link                                                                                                  |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| Transform static product images from any online store into engaging animated videos using Google's Veo 3.1 AI. Simply submit a catalog page URL and automatically generate professional product showcase videos where models pose and move to display clothing and fashion items from multiple angles - perfect for elevating product pages with dynamic content that increases conversion rates. The workflow supports Shopify, WooCommerce, and most online stores. Video generation takes about 10 seconds per product with automatic polling and asset organization in Google Drive. | Full project description included as sticky note in the workflow.                                              |
| Requires Firecrawl API account for scraping, Google Cloud with Veo 3.1 API access (currently in preview), and Google Drive account with proper folder setup and OAuth2 credentials.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Setup prerequisites                                                                                             |
| Video generation prompt constraints: No audio or sound effects; muted final video; 8-second duration; aspect ratio 9:16; model poses featuring clothing.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Prompt designed to optimize product showcase videos                                                           |
| Firecrawl schema extraction is strict on preserving exact image URLs as they appear in the HTML to ensure the video generation receives original images without URL transformation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Important for data accuracy                                                                                      |
| Workflow uses batch iteration with `SplitInBatches` to manage processing load and asynchronous video generation polling to handle long-running requests reliably.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Workflow execution strategy                                                                                      |

---

**Disclaimer:** The provided text is generated exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All handled data is legal and publicly available.