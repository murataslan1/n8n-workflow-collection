AI Virtual TryOn automated generation 🤖🧠 for WooCommerce clothing catalog 👔

https://n8nworkflows.xyz/workflows/ai-virtual-tryon-automated-generation------for-woocommerce-clothing-catalog----2892


# AI Virtual TryOn automated generation 🤖🧠 for WooCommerce clothing catalog 👔

### 1. Workflow Overview

This workflow automates the generation of realistic virtual try-on images for clothing products in a WooCommerce catalog by leveraging AI image processing. It eliminates the need for costly photoshoots by creating images of models wearing the clothing items digitally. The workflow integrates Google Sheets for data management, Google Drive for image storage, and WooCommerce for updating product listings.

The workflow is logically divided into the following blocks:

- **1.1 Triggering the Workflow**: Initiates the workflow either manually or on a schedule.
- **1.2 Data Retrieval**: Fetches new product data including model and product image URLs from Google Sheets.
- **1.3 Preparing AI Request**: Sets up the data payload for the AI image generation API.
- **1.4 AI Image Generation and Status Polling**: Sends the generation request, waits, and polls for completion.
- **1.5 Image Download and Storage**: Retrieves the generated image and uploads it to Google Drive.
- **1.6 Updating Records**: Updates Google Sheets with the new image URL and updates the WooCommerce product gallery.

---

### 2. Block-by-Block Analysis

#### 1.1 Triggering the Workflow

**Overview:**  
This block provides two entry points to start the workflow: manually via a trigger node or automatically on a schedule.

**Nodes Involved:**  
- When clicking ‘Test workflow’ (Manual Trigger)  
- Schedule Trigger

**Node Details:**  

- **When clicking ‘Test workflow’**  
  - Type: Manual Trigger  
  - Role: Allows manual initiation of the workflow for testing or on-demand runs.  
  - Configuration: No parameters; triggers workflow immediately when clicked.  
  - Inputs: None  
  - Outputs: Connects to "Get new product" node.  
  - Edge Cases: None significant; manual trigger depends on user action.

- **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Role: Automatically triggers the workflow at defined intervals (default every 5 minutes).  
  - Configuration: Default schedule, can be customized to desired frequency.  
  - Inputs: None  
  - Outputs: Connects to "Get new product" node.  
  - Edge Cases: If workflow execution time exceeds schedule interval, overlapping executions may occur.

---

#### 1.2 Data Retrieval

**Overview:**  
Retrieves new product entries from a Google Sheets document, which contains URLs for model images, clothing product images, WooCommerce product IDs, and a placeholder for the generated virtual try-on image URL.

**Nodes Involved:**  
- Get new product (Google Sheets)

**Node Details:**  

- **Get new product**  
  - Type: Google Sheets  
  - Role: Reads rows from a specified Google Sheets spreadsheet to fetch new product data.  
  - Configuration:  
    - Spreadsheet ID and Sheet name configured to target the product data sheet.  
    - Reads rows where the virtual try-on image URL is empty (filtering new products).  
  - Inputs: From trigger nodes ("When clicking ‘Test workflow’" or "Schedule Trigger")  
  - Outputs: Connects to "Set data" node.  
  - Edge Cases:  
    - Authentication errors if Google Sheets credentials expire.  
    - Empty or malformed rows could cause downstream errors.  
    - Rate limits on Google Sheets API.

---

#### 1.3 Preparing AI Request

**Overview:**  
Prepares the data payload by assigning the model image URL and product image URL to variables for the AI image generation request.

**Nodes Involved:**  
- Set data

**Node Details:**  

- **Set data**  
  - Type: Set  
  - Role: Maps and formats data fields from the Google Sheets output to the required input format for the AI API.  
  - Configuration:  
    - Sets variables such as `modelImageUrl` and `productImageUrl` from the retrieved sheet data.  
  - Inputs: From "Get new product"  
  - Outputs: Connects to "Create Image" node.  
  - Edge Cases:  
    - Missing or invalid URLs could cause API request failures.  
    - Expression errors if input data fields are missing.

---

#### 1.4 AI Image Generation and Status Polling

**Overview:**  
Sends a request to the AI API to generate the virtual try-on image, waits for processing, and polls the API to check if the image generation is complete.

**Nodes Involved:**  
- Create Image (HTTP Request)  
- Wait 60 sec. (Wait)  
- Get status (HTTP Request)  
- Completed? (If)

**Node Details:**  

- **Create Image**  
  - Type: HTTP Request  
  - Role: Sends a POST request to the AI image generation API with model and product image URLs.  
  - Configuration:  
    - Endpoint URL configured to the AI service.  
    - Request body includes `modelImageUrl` and `productImageUrl`.  
    - Authentication via API key or token as required.  
  - Inputs: From "Set data"  
  - Outputs: Connects to "Wait 60 sec."  
  - Edge Cases:  
    - API authentication errors.  
    - Network timeouts.  
    - Invalid response format.

- **Wait 60 sec.**  
  - Type: Wait  
  - Role: Pauses workflow execution for 60 seconds to allow image generation processing.  
  - Configuration: Fixed 60-second delay.  
  - Inputs: From "Create Image" and "Completed?" (for polling loop)  
  - Outputs: Connects to "Get status"  
  - Edge Cases:  
    - Long processing times may require longer waits or retries.

- **Get status**  
  - Type: HTTP Request  
  - Role: Polls the AI API to check if the image generation is complete.  
  - Configuration:  
    - GET request to status endpoint with job ID from "Create Image" response.  
  - Inputs: From "Wait 60 sec."  
  - Outputs: Connects to "Completed?"  
  - Edge Cases:  
    - API errors or timeouts.  
    - Job ID missing or expired.

- **Completed?**  
  - Type: If  
  - Role: Checks if the AI image generation job is complete.  
  - Configuration:  
    - Condition based on status field in "Get status" response.  
  - Inputs: From "Get status"  
  - Outputs:  
    - If yes: Connects to "Get Url image"  
    - If no: Connects back to "Wait 60 sec." (polling loop)  
  - Edge Cases:  
    - Infinite loop if job never completes; consider max retry count.

---

#### 1.5 Image Download and Storage

**Overview:**  
Retrieves the generated virtual try-on image URL, downloads the image file, and uploads it to a designated Google Drive folder for storage.

**Nodes Involved:**  
- Get Url image (HTTP Request)  
- Get File image (HTTP Request)  
- Upload Image (Google Drive)

**Node Details:**  

- **Get Url image**  
  - Type: HTTP Request  
  - Role: Retrieves the URL of the generated virtual try-on image from the AI API response.  
  - Configuration:  
    - GET request to the API endpoint providing the image URL.  
  - Inputs: From "Completed?" (on completion)  
  - Outputs: Connects to "Get File image"  
  - Edge Cases:  
    - Missing or invalid URL in response.

- **Get File image**  
  - Type: HTTP Request  
  - Role: Downloads the image file from the URL obtained.  
  - Configuration:  
    - GET request with binary response enabled to fetch the image file.  
  - Inputs: From "Get Url image"  
  - Outputs: Connects to "Upload Image"  
  - Edge Cases:  
    - Network errors or invalid URL.  
    - Large file size causing timeouts.

- **Upload Image**  
  - Type: Google Drive  
  - Role: Uploads the downloaded image file to a specified Google Drive folder.  
  - Configuration:  
    - Target folder ID specified.  
    - Upload mode set to create new file.  
  - Inputs: From "Get File image"  
  - Outputs: Connects to "Update result"  
  - Edge Cases:  
    - Google Drive API quota exceeded.  
    - Authentication errors.

---

#### 1.6 Updating Records

**Overview:**  
Updates the Google Sheets document with the URL of the stored virtual try-on image and updates the corresponding WooCommerce product by adding the image to its gallery.

**Nodes Involved:**  
- Update result (Google Sheets)  
- Update product (WooCommerce)

**Node Details:**  

- **Update result**  
  - Type: Google Sheets  
  - Role: Writes the Google Drive URL of the generated image back into the Google Sheets document in the appropriate row.  
  - Configuration:  
    - Spreadsheet ID and Sheet name same as "Get new product".  
    - Updates the column designated for virtual try-on image URL.  
  - Inputs: From "Upload Image"  
  - Outputs: Connects to "Update product"  
  - Edge Cases:  
    - Write conflicts if multiple workflows update simultaneously.  
    - Authentication or API quota issues.

- **Update product**  
  - Type: WooCommerce  
  - Role: Updates the WooCommerce product by adding the virtual try-on image URL to the product’s image gallery.  
  - Configuration:  
    - Uses WooCommerce API credentials.  
    - Product ID from Google Sheets data.  
    - Adds new image URL to product images array.  
  - Inputs: From "Update result"  
  - Outputs: None (end of workflow)  
  - Edge Cases:  
    - API authentication failure.  
    - Invalid product ID.  
    - Rate limits on WooCommerce API.

---

### 3. Summary Table

| Node Name               | Node Type           | Functional Role                              | Input Node(s)                 | Output Node(s)             | Sticky Note                                                                                  |
|-------------------------|---------------------|----------------------------------------------|------------------------------|----------------------------|----------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’ | Manual Trigger      | Manual start of workflow                      | None                         | Get new product            |                                                                                              |
| Schedule Trigger         | Schedule Trigger    | Scheduled automatic start                     | None                         | Get new product            |                                                                                              |
| Get new product          | Google Sheets       | Retrieve new product data                      | When clicking ‘Test workflow’, Schedule Trigger | Set data                  |                                                                                              |
| Set data                | Set                 | Prepare AI request data                        | Get new product              | Create Image               |                                                                                              |
| Create Image             | HTTP Request        | Send AI image generation request              | Set data                    | Wait 60 sec.               | When you register for the API service you will get 1$ for free. For continuous work add API credits to your account. |
| Wait 60 sec.             | Wait                | Wait before polling status                     | Create Image, Completed?     | Get status                 |                                                                                              |
| Get status               | HTTP Request        | Poll AI API for generation status              | Wait 60 sec.                | Completed?                 |                                                                                              |
| Completed?               | If                  | Check if AI image generation is complete      | Get status                  | Get Url image (Yes), Wait 60 sec. (No) |                                                                                              |
| Get Url image            | HTTP Request        | Retrieve generated image URL                    | Completed?                  | Get File image             |                                                                                              |
| Get File image           | HTTP Request        | Download generated image file                   | Get Url image               | Upload Image               |                                                                                              |
| Upload Image             | Google Drive        | Upload image to Google Drive                    | Get File image              | Update result              |                                                                                              |
| Update result            | Google Sheets       | Update sheet with image URL                      | Upload Image                | Update product             |                                                                                              |
| Update product           | WooCommerce         | Update WooCommerce product with new image       | Update result               | None                      |                                                                                              |
| Sticky Note              | Sticky Note         | Comment/Instruction                            | None                        | None                      |                                                                                              |
| Sticky Note1             | Sticky Note         | Comment/Instruction                            | None                        | None                      |                                                                                              |
| Sticky Note2             | Sticky Note         | Comment/Instruction                            | None                        | None                      |                                                                                              |
| Sticky Note3             | Sticky Note         | Comment/Instruction                            | None                        | None                      |                                                                                              |
| Sticky Note4             | Sticky Note         | Comment/Instruction                            | None                        | None                      |                                                                                              |
| Sticky Note5             | Sticky Note         | Comment/Instruction                            | None                        | None                      |                                                                                              |
| Sticky Note6             | Sticky Note         | Comment/Instruction                            | None                        | None                      |                                                                                              |
| Sticky Note7             | Sticky Note         | Comment/Instruction                            | None                        | None                      |                                                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Nodes**  
   - Add a **Manual Trigger** node named "When clicking ‘Test workflow’". No parameters needed.  
   - Add a **Schedule Trigger** node named "Schedule Trigger". Configure to run every 5 minutes or desired interval.

2. **Add Google Sheets Node to Retrieve New Products**  
   - Add a **Google Sheets** node named "Get new product".  
   - Configure credentials for Google Sheets access.  
   - Set operation to "Read Rows".  
   - Specify Spreadsheet ID and Sheet name containing product data.  
   - Add a filter to select rows where the virtual try-on image URL column is empty.

3. **Add Set Node to Prepare AI Request Data**  
   - Add a **Set** node named "Set data".  
   - Map fields from "Get new product" output: assign `modelImageUrl` and `productImageUrl` variables from respective columns.

4. **Add HTTP Request Node to Create AI Image**  
   - Add an **HTTP Request** node named "Create Image".  
   - Configure method as POST.  
   - Set URL to the AI image generation API endpoint.  
   - In the body, include `modelImageUrl` and `productImageUrl`.  
   - Add authentication credentials (API key/token).  
   - Connect "Set data" output to this node.

5. **Add Wait Node**  
   - Add a **Wait** node named "Wait 60 sec."  
   - Set wait time to 60 seconds.  
   - Connect "Create Image" output to this node.

6. **Add HTTP Request Node to Get Status**  
   - Add an **HTTP Request** node named "Get status".  
   - Configure method as GET.  
   - Use job ID from "Create Image" response to query status endpoint.  
   - Connect "Wait 60 sec." output to this node.

7. **Add If Node to Check Completion**  
   - Add an **If** node named "Completed?".  
   - Set condition to check if status response indicates completion.  
   - Connect "Get status" output to this node.  
   - On "true" branch, connect to "Get Url image".  
   - On "false" branch, connect back to "Wait 60 sec." (to continue polling).

8. **Add HTTP Request Node to Get Image URL**  
   - Add an **HTTP Request** node named "Get Url image".  
   - Configure method as GET to retrieve the generated image URL.  
   - Connect "Completed?" true branch to this node.

9. **Add HTTP Request Node to Download Image File**  
   - Add an **HTTP Request** node named "Get File image".  
   - Configure method as GET with binary response enabled to download the image.  
   - Connect "Get Url image" output to this node.

10. **Add Google Drive Node to Upload Image**  
    - Add a **Google Drive** node named "Upload Image".  
    - Configure credentials for Google Drive.  
    - Set operation to upload file to a specific folder (specify folder ID).  
    - Connect "Get File image" output to this node.

11. **Add Google Sheets Node to Update Result**  
    - Add a **Google Sheets** node named "Update result".  
    - Configure to update the same spreadsheet and sheet as "Get new product".  
    - Update the row corresponding to the product with the Google Drive URL of the uploaded image.  
    - Connect "Upload Image" output to this node.

12. **Add WooCommerce Node to Update Product**  
    - Add a **WooCommerce** node named "Update product".  
    - Configure WooCommerce API credentials.  
    - Set operation to update product images.  
    - Use product ID from Google Sheets data.  
    - Add the new virtual try-on image URL to the product's image gallery.  
    - Connect "Update result" output to this node.

13. **Connect Trigger Nodes to Start the Flow**  
    - Connect both "When clicking ‘Test workflow’" and "Schedule Trigger" nodes to "Get new product".

14. **Test the Workflow**  
    - Run manually or wait for scheduled trigger.  
    - Monitor for errors and validate images are generated, stored, and linked correctly.

---

### 5. General Notes & Resources

| Note Content                                                                                     | Context or Link                                                                                          |
|-------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| Example results spreadsheet showcasing generated images.                                        | https://docs.google.com/spreadsheets/d/11ebWJvwwXHgvQld9kxywKQUvIoBw6xMa0g0BuIqHDxE/edit?usp=sharing     |
| Visual example of virtual try-on images generated by the workflow.                              | https://public-files.gumroad.com/2a0020kw51p0f4ez8hm734x5s23u                                            |
| API service offers $1 free credit upon registration; additional credits required for continuous use. | Mentioned in "Create Image" node sticky note.                                                           |
| Workflow designed to reduce costs and time for eCommerce clothing catalog image generation.     | Workflow description and key features sections.                                                         |

---

This document provides a detailed and structured reference for understanding, reproducing, and maintaining the AI Virtual TryOn workflow for WooCommerce clothing catalogs. It covers all nodes, their roles, configurations, and potential failure points to ensure robust operation and easy modification.