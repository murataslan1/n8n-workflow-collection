Auto-Generate Virtual AI Try-On Images for WooCommerce with Fal.ai Nano Banana

https://n8nworkflows.xyz/workflows/auto-generate-virtual-ai-try-on-images-for-woocommerce-with-fal-ai-nano-banana-8022


# Auto-Generate Virtual AI Try-On Images for WooCommerce with Fal.ai Nano Banana

### 1. Workflow Overview

This workflow automates the generation and management of virtual try-on images for WooCommerce clothing products using Fal.ai's Nano Banana AI service. It targets eCommerce stores seeking to create realistic images of models wearing apparel without costly photoshoots. The workflow processes a Google Sheets list of image URLs and product IDs, generates AI-processed images, uploads the results to Google Drive, updates the Google Sheet with the new image URLs, and finally updates the corresponding WooCommerce product images.

**Logical Blocks:**

- **1.1 Input Reception and Data Preparation**  
  Fetches product and model image URLs and product IDs from a Google Sheet and prepares data for AI processing.

- **1.2 AI Image Generation Request**  
  Sends images to Fal.ai Nano Banana API to generate the virtual try-on image and polls for completion status.

- **1.3 Result Retrieval and Processing**  
  Once AI processing is complete, retrieves the generated image URL, downloads the image, and uploads it to Google Drive.

- **1.4 Data Update and WooCommerce Integration**  
  Updates the Google Sheet with the new image URL and updates the WooCommerce product images accordingly.

- **1.5 Control Flow and Utility**  
  Includes looping over multiple items, waiting for processing, and conditional checks.

---

### 2. Block-by-Block Analysis

---

#### 2.1 Input Reception and Data Preparation

**Overview:**  
This block reads the input data from a Google Sheet containing columns for model images, product images, and WooCommerce product IDs. It splits the incoming data into individual items for processing and sets up variables for AI request.

**Nodes Involved:**  
- When clicking ‘Test workflow’ (Manual Trigger)  
- Google Sheets  
- Loop Over Items  
- Set data

##### Node Details:

- **When clicking ‘Test workflow’**  
  - *Type:* Manual Trigger  
  - *Role:* Entry point for manual workflow execution.  
  - *Config:* No parameters; triggers workflow on user action.  
  - *Inputs:* None  
  - *Outputs:* Triggers "Google Sheets" node.  
  - *Failures:* None expected.

- **Google Sheets**  
  - *Type:* Google Sheets node  
  - *Role:* Reads data rows from a specific spreadsheet and sheet (gid=0).  
  - *Config:* Uses OAuth2 credentials; filters for rows where "IMAGE RESULT" is empty (only unprocessed rows).  
  - *Inputs:* Trigger from manual node.  
  - *Outputs:* Array of rows with "IMAGE MODEL", "IMAGE PRODUCT", "PRODUCT ID".  
  - *Failures:* Authentication errors, API rate limits, invalid sheet ID or permissions.  
  - *Version:* 4.5

- **Loop Over Items**  
  - *Type:* SplitInBatches  
  - *Role:* Processes each row individually to avoid memory overload and enable stepwise handling.  
  - *Config:* Default batch size (likely 1), no options specified.  
  - *Inputs:* Output of Google Sheets node.  
  - *Outputs:* Individual item passed to "Set data".  
  - *Failures:* None typical, but batch errors could cause partial processing.

- **Set data**  
  - *Type:* Set  
  - *Role:* Prepares request payload variables for AI image generation.  
  - *Config:* Sets two string variables:  
    - "model" ← value from "IMAGE MODEL" column  
    - "shirt" ← value from "IMAGE PRODUCT" column  
  - *Inputs:* Individual item from Loop Over Items.  
  - *Outputs:* Prepared data passed to "Create Image".  
  - *Failures:* Expression errors if input fields are missing.

---

#### 2.2 AI Image Generation Request

**Overview:**  
This block sends a POST request to Fal.ai Nano Banana API with the model and product images to generate a virtual try-on image. It then waits and polls the status until the image generation is completed.

**Nodes Involved:**  
- Create Image  
- Wait 60 sec.  
- Get status  
- Completed? (If node)  
- Get Url image

##### Node Details:

- **Create Image**  
  - *Type:* HTTP Request (POST)  
  - *Role:* Initiates AI image generation by sending model and shirt image URLs with a prompt.  
  - *Config:*  
    - URL: https://queue.fal.run/fal-ai/nano-banana/edit  
    - Headers: Content-Type: application/json; Authorization: Key YOURAPIKEY (via HTTP Header Auth credential)  
    - Body: JSON with fields:  
      - prompt: "make a photo of the model wearing the submitted clothing item and creating the themed background"  
      - image_urls: array with "model" and "shirt" URLs from Set data node  
    - Authentication: HTTP Header Auth (Fal.run API key)  
  - *Inputs:* Prepared data from Set data node.  
  - *Outputs:* JSON response containing "request_id" used for polling status.  
  - *Failures:* Authentication errors, network timeouts, invalid URLs, API quota exceeded.  
  - *Version:* 4.2

- **Wait 60 sec.**  
  - *Type:* Wait  
  - *Role:* Delays workflow for 10 seconds (parameter shows 10; label says 60 sec, actual wait is 10 seconds) before polling status to avoid rate limits and allow processing.  
  - *Config:* Amount: 10 seconds  
  - *Inputs:* Output from Create Image or Get Status (looped)  
  - *Outputs:* Triggers Get status node.  
  - *Failures:* None typical.

- **Get status**  
  - *Type:* HTTP Request (GET)  
  - *Role:* Requests the current status of the AI image generation using the request_id from "Create Image".  
  - *Config:*  
    - URL template: https://queue.fal.run/fal-ai/nano-banana/requests/{{request_id}}/status  
    - Auth: HTTP Header Auth with Fal.run API key  
  - *Inputs:* From Wait 60 sec. node  
  - *Outputs:* JSON response including "status" field (e.g., "COMPLETED")  
  - *Failures:* Authentication errors, request timeouts, invalid request_id.

- **Completed?**  
  - *Type:* If  
  - *Role:* Checks if "status" equals "COMPLETED".  
  - *Config:* Condition: $json.status === "COMPLETED"  
  - *Inputs:* Output from Get status node  
  - *Outputs:*  
    - True branch → proceeds to Get Url image node  
    - False branch → loops back to Wait 60 sec. node to poll again  
  - *Failures:* Expression errors if "status" missing.

- **Get Url image**  
  - *Type:* HTTP Request (GET)  
  - *Role:* Fetches the result of the AI image generation using the request_id.  
  - *Config:*  
    - URL template: https://queue.fal.run/fal-ai/nano-banana/requests/{{request_id}}  
    - Auth: HTTP Header Auth (Fal.run API key)  
  - *Inputs:* True output of Completed? node  
  - *Outputs:* JSON containing image URLs generated by the AI.  
  - *Failures:* Authentication errors, request failures.

---

#### 2.3 Result Retrieval and Processing

**Overview:**  
This block downloads the generated image, uploads it to Google Drive for archival, and updates the Google Sheet with the new image URL.

**Nodes Involved:**  
- Get File image  
- Upload Image  
- Update result

##### Node Details:

- **Get File image**  
  - *Type:* HTTP Request (GET)  
  - *Role:* Downloads the generated virtual try-on image file from the URL received from Get Url image node.  
  - *Config:* URL taken dynamically from the first image URL in the "images" array of the JSON response.  
  - *Inputs:* Output from Get Url image node  
  - *Outputs:* Binary data of the image file for upload  
  - *Failures:* Network errors, invalid URL, download failures.

- **Upload Image**  
  - *Type:* Google Drive  
  - *Role:* Uploads the downloaded image to a specified Google Drive folder for storage.  
  - *Config:*  
    - File name: timestamp + original file name  
    - Drive: “My Drive”  
    - Folder ID: specific folder ("Fal.run")  
    - OAuth2 credentials for Google Drive  
  - *Inputs:* Binary image data from Get File image  
  - *Outputs:* Metadata including Drive file URL  
  - *Failures:* Authentication errors, quota exceeded, network errors.

- **Update result**  
  - *Type:* Google Sheets (Update)  
  - *Role:* Updates the original Google Sheet row with the URL of the generated image (from Get File image node JSON).  
  - *Config:*  
    - Uses row_number from Loop Over Items to target correct row  
    - Updates "IMAGE RESULT" column with new image URL  
    - OAuth2 credentials for Google Sheets  
  - *Inputs:* Output from Upload Image node (for file URL) and Loop Over Items node (row number)  
  - *Outputs:* Passes data to WooCommerce update node  
  - *Failures:* Authentication errors, row number mismatch, API limits.

---

#### 2.4 Data Update and WooCommerce Integration

**Overview:**  
This block updates the WooCommerce product image with the newly generated virtual try-on image, completing the content update cycle for the product catalog.

**Nodes Involved:**  
- WooCommerce

##### Node Details:

- **WooCommerce**  
  - *Type:* WooCommerce node  
  - *Role:* Updates the product by setting a new image URL for the product’s media gallery.  
  - *Config:*  
    - Resource: product  
    - Operation: update  
    - Product ID: fetched dynamically from Loop Over Items ("PRODUCT ID" column)  
    - Images: array with the new virtual try-on image URL from Get File image node  
    - Uses WooCommerce API credentials (OAuth2 or API key)  
  - *Inputs:* Output from Update result node  
  - *Outputs:* None (end of the workflow for the item)  
  - *Failures:* Authentication errors, invalid product ID, API limits.

---

#### 2.5 Control Flow and Utility

**Overview:**  
Manages workflow control such as looping over multiple items, waiting between API calls, and checking processing status.

**Nodes Involved:**  
- Loop Over Items  
- Wait 60 sec.  
- Completed? (If node)

Details covered above in respective blocks. Notable is the use of the split batch node to process rows one by one, and the loop between "Wait 60 sec." and "Get status" until completion.

---

### 3. Summary Table

| Node Name                 | Node Type            | Functional Role                         | Input Node(s)                 | Output Node(s)          | Sticky Note                                                                                                                  |
|---------------------------|----------------------|---------------------------------------|------------------------------|-------------------------|------------------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’ | Manual Trigger       | Workflow start trigger                 |                              | Google Sheets            |                                                                                                                              |
| Google Sheets             | Google Sheets         | Reads product/model data from sheet   | When clicking ‘Test workflow’| Loop Over Items          | See Sticky Note4 for Google Sheet setup instructions                                                                         |
| Loop Over Items           | SplitInBatches        | Processes each row individually       | Google Sheets                | Set data (main), (empty branch) |                                                                                                                              |
| Set data                  | Set                   | Prepares AI request payload variables | Loop Over Items              | Create Image             |                                                                                                                              |
| Create Image              | HTTP Request          | Sends AI image generation request     | Set data                     | Wait 60 sec.             | See Sticky Note6 for API key setup instructions                                                                              |
| Wait 60 sec.              | Wait                  | Delays workflow for polling           | Create Image, Get status     | Get status               |                                                                                                                              |
| Get status                | HTTP Request          | Polls AI processing status             | Wait 60 sec.                 | Completed?               |                                                                                                                              |
| Completed?                | If                    | Checks if AI image generation complete| Get status                   | Get Url image (true), Wait 60 sec. (false) |                                                                                                                              |
| Get Url image             | HTTP Request          | Retrieves image URLs from API          | Completed?                   | Get File image           |                                                                                                                              |
| Get File image            | HTTP Request          | Downloads generated image file         | Get Url image                | Upload Image             |                                                                                                                              |
| Upload Image              | Google Drive          | Uploads image to Google Drive          | Get File image               | Update result            |                                                                                                                              |
| Update result             | Google Sheets         | Updates sheet with image URL           | Upload Image                 | WooCommerce              |                                                                                                                              |
| WooCommerce               | WooCommerce           | Updates product image on WooCommerce   | Update result                | Loop Over Items (end)    | See Sticky Note7 for WooCommerce API setup                                                                                   |
| Sticky Note               | Sticky Note           | Visual reference: Model image          |                              |                         | Shows model example image                                                                                                    |
| Sticky Note1              | Sticky Note           | Visual reference: Product image        |                              |                         | Shows product example image                                                                                                  |
| Sticky Note2              | Sticky Note           | Visual reference: Result image         |                              |                         | Shows example AI-generated result image                                                                                      |
| Sticky Note3              | Sticky Note           | Workflow overview description          |                              |                         | Detailed workflow purpose and functionality description                                                                      |
| Sticky Note4              | Sticky Note           | Google Sheets setup instructions       |                              |                         | Instructions for Google Sheet columns and usage                                                                              |
| Sticky Note6              | Sticky Note           | Fal.ai API key setup instructions      |                              |                         | Instructions to create Fal.ai account and add API key in Create Image node headers                                             |
| Sticky Note7              | Sticky Note           | WooCommerce API setup instructions     |                              |                         | Reminder to configure WooCommerce API credentials                                                                            |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Node Type: Manual Trigger  
   - Purpose: To manually start the workflow.

2. **Add Google Sheets Node**  
   - Type: Google Sheets (Read)  
   - Configure:  
     - Document ID: [Use your Google Sheet ID]  
     - Sheet Name: gid=0 or appropriate sheet  
     - Use OAuth2 credentials for Google Sheets API  
     - Filter: Only rows where "IMAGE RESULT" column is empty to process unhandled rows.

3. **Add SplitInBatches Node ("Loop Over Items")**  
   - Purpose: To process each sheet row individually.

4. **Add Set Node ("Set data")**  
   - Set two string fields:  
     - `model` = value from "IMAGE MODEL" column  
     - `shirt` = value from "IMAGE PRODUCT" column

5. **Add HTTP Request Node ("Create Image")**  
   - Method: POST  
   - URL: https://queue.fal.run/fal-ai/nano-banana/edit  
   - Headers:  
     - Content-Type: application/json  
     - Authorization: Key YOURAPIKEY (using HTTP Header Auth credentials)  
   - Body (JSON):  
     ```json
     {
       "prompt": "make a photo of the model wearing the submitted clothing item and creating the themed background",
       "image_urls": ["{{ $json.model }}", "{{ $json.shirt }}"]
     }
     ```
   - Enable sending body as JSON.

6. **Add Wait Node ("Wait 60 sec.")**  
   - Set wait time to 10 seconds (or 60 seconds if preferred).

7. **Add HTTP Request Node ("Get status")**  
   - Method: GET  
   - URL: https://queue.fal.run/fal-ai/nano-banana/requests/{{ $json.request_id }}/status  
   - Authentication: HTTP Header Auth with Fal.ai API key.

8. **Add If Node ("Completed?")**  
   - Condition: Check if `$json.status` equals `"COMPLETED"`  
   - True branch: Proceed to get final image URL  
   - False branch: Loop back to Wait node to poll again.

9. **Add HTTP Request Node ("Get Url image")**  
   - Method: GET  
   - URL: https://queue.fal.run/fal-ai/nano-banana/requests/{{ $json.request_id }}  
   - Authentication: HTTP Header Auth.

10. **Add HTTP Request Node ("Get File image")**  
    - Method: GET  
    - URL: Use `{{ $json.images[0].url }}` from previous node.  
    - This node downloads the image file (binary).

11. **Add Google Drive Node ("Upload Image")**  
    - Upload mode: File upload  
    - File name: Use timestamp + original file name  
    - Folder: Set folder ID for storage  
    - Credentials: Google Drive OAuth2.

12. **Add Google Sheets Node ("Update result")**  
    - Operation: Update row  
    - Document ID and Sheet Name same as earlier  
    - Map `row_number` from Loop Over Items for row targeting  
    - Update "IMAGE RESULT" column with the uploaded image URL.

13. **Add WooCommerce Node ("WooCommerce")**  
    - Resource: Product  
    - Operation: Update  
    - Product ID: From Loop Over Items "PRODUCT ID" column  
    - Update product images with new URL from image upload step.  
    - Credentials: WooCommerce API setup.

14. **Connect nodes in this order:**  
    Manual Trigger → Google Sheets → Loop Over Items → Set data → Create Image → Wait 60 sec. → Get status → Completed?  
    - If true: Completed? → Get Url image → Get File image → Upload Image → Update result → WooCommerce  
    - If false: Completed? → Wait 60 sec. (loop)

15. **Credentials Setup:**  
    - Fal.ai API key as HTTP Header Auth with header name "Authorization" and value "Key YOURAPIKEY".  
    - Google Sheets OAuth2 credentials linked to your Google account with access to the Google Sheet.  
    - Google Drive OAuth2 credentials with write access to target folder.  
    - WooCommerce API credentials (Consumer Key and Secret or OAuth2) with permissions to update products.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                             | Context or Link                                                                                   |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Workflow creates virtual try-on images automating photo shoots for WooCommerce apparel eCommerce catalogs.                                                                                                                              | Sticky Note3 content                                                                              |
| Google Sheets template example: columns "IMAGE MODEL", "IMAGE PRODUCT", "PRODUCT ID", and "IMAGE RESULT" (left empty for updates).                                                                                                      | https://docs.google.com/spreadsheets/d/11ebWJvwwXHgvQld9kxywKQUvIoBw6xMa0g0BuIqHDxE/edit?usp=sharing |
| Fal.ai Nano Banana API requires an API key. Create an account at https://fal.ai and set the API key in HTTP Header Auth with "Authorization" header as "Key YOURAPIKEY".                                                                 | Sticky Note6 content                                                                              |
| WooCommerce API must be configured with appropriate credentials to allow product updates.                                                                                                                                               | Sticky Note7 content                                                                              |
| Visual references for model, product, and result images are included as sticky notes for workflow clarity.                                                                                                                              | Sticky Notes  (Model, Product, Result images URLs)                                               |

---

**Disclaimer:** The provided text is exclusively from an automated workflow created with n8n, respecting applicable content policies, and handles only legal, public data.