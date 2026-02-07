Automate WooCommerce Image Product Background Removal using API and Google Sheet

https://n8nworkflows.xyz/workflows/automate-woocommerce-image-product-background-removal-using-api-and-google-sheet-4488


# Automate WooCommerce Image Product Background Removal using API and Google Sheet

### 1. Workflow Overview

**Purpose:**  
This workflow automates the removal of backgrounds from WooCommerce product images using the BackgroundCut API. It processes product images listed in a Google Sheet, removes their backgrounds, uploads the processed images to an FTP server, updates the WooCommerce product with the new image URL, and marks the process as done in the Google Sheet.

**Target Use Cases:**  
- Bulk processing of WooCommerce product images to remove backgrounds automatically.  
- Synchronization of processed images between WooCommerce, an FTP server, and a Google Sheet tracking system.  
- Simplifying the management of product images for e-commerce stores using WooCommerce.

**Logical Blocks:**

- **1.1 Input Reception and Initialization**  
  Triggering the workflow manually and reading the input data (product IDs and image URLs) from a Google Sheet.

- **1.2 Image Background Removal via API**  
  Sending each product image URL to the BackgroundCut API for background removal.

- **1.3 File Naming and FTP Upload**  
  Extracting filenames from URLs, uploading processed images to an FTP server.

- **1.4 Updating WooCommerce Product**  
  Updating the WooCommerce product with the new processed image URL.

- **1.5 Updating Google Sheet Status**  
  Marking the processed images as done and storing the new image URL in the Google Sheet.

---

### 2. Block-by-Block Analysis

---

#### 1.1 Input Reception and Initialization

- **Overview:**  
  This block initiates the workflow manually and retrieves the list of products and their image URLs from a Google Sheet. It prepares data for batch processing.

- **Nodes Involved:**  
  - When clicking ‘Execute workflow’ (Manual Trigger)  
  - Ger Products (Google Sheets)  
  - Loop Over Items (Split in Batches)  
  - Set Product Fields (Set)

- **Node Details:**

  - **When clicking ‘Execute workflow’**  
    - Type: Manual Trigger  
    - Role: Entry point to manually start the workflow.  
    - Configuration: Default manual trigger, no parameters.  
    - Inputs: None  
    - Outputs: Triggers "Ger Products" node.  
    - Edge Cases: None (manual trigger).

  - **Ger Products**  
    - Type: Google Sheets  
    - Role: Reads product data from the Google Sheet containing product IDs and image URLs.  
    - Configuration:  
      - Document ID points to a shared Google Sheet.  
      - Sheet specified by gid=0 (first sheet).  
      - Filters rows where the column "DONE" is empty (to process only pending items).  
    - Expressions: Filters by "DONE" column value.  
    - Inputs: Trigger from manual start node.  
    - Outputs: Sends data to "Loop Over Items" node.  
    - Edge Cases:  
      - Google Sheets API errors due to authentication or quota limits.  
      - Empty data if all rows are marked done or sheet is empty.  
      - Filter misconfiguration could lead to incorrect data retrieval.

  - **Loop Over Items**  
    - Type: SplitInBatches  
    - Role: Processes the Google Sheet rows one by one or in manageable batches.  
    - Configuration: Default batch options.  
    - Inputs: Data from "Ger Products".  
    - Outputs: Loops batches to "Set Product Fields" node, also has a second output that is unused here.  
    - Edge Cases: Large data sets could cause performance delays or timeouts.

  - **Set Product Fields**  
    - Type: Set  
    - Role: Maps incoming sheet data to workflow variables for further processing. Sets `image_url` and `product_id` from sheet columns `IMAGE` and `ID`.  
    - Configuration:  
      - Assigns `image_url` = `{{$json.IMAGE}}`  
      - Assigns `product_id` = `{{$json.ID}}`  
      - Includes all other original fields.  
    - Inputs: From "Loop Over Items".  
    - Outputs: To "Remove from Image URL".  
    - Edge Cases: Missing or malformed IMAGE or ID fields could cause downstream failures.

---

#### 1.2 Image Background Removal via API

- **Overview:**  
  This block sends the product image URL to the BackgroundCut API to remove the background by calling the external API with proper authentication.

- **Nodes Involved:**  
  - Remove from Image URL (HTTP Request)

- **Node Details:**

  - **Remove from Image URL**  
    - Type: HTTP Request  
    - Role: Sends a POST request to BackgroundCut API endpoint to remove the background from the image URL.  
    - Configuration:  
      - Method: POST  
      - URL: `https://api.backgroundcut.co/v2/cut/`  
      - Content-Type: multipart/form-data  
      - Body Parameter: `image_file_url` set dynamically to `{{$json.image_url}}`  
      - Authentication: HTTP Header Authentication with an API key stored in credentials (Header name: Authorization).  
    - Inputs: From "Set Product Fields" node, which provides the image URL.  
    - Outputs: Returns processed image data including the URL of the background-removed image. Passes data to "Get Filename" node.  
    - Edge Cases:  
      - API authentication errors (invalid or missing API key).  
      - API rate limits or downtime.  
      - Invalid or unreachable image URLs.  
      - Timeout or malformed response handling.

---

#### 1.3 File Naming and FTP Upload

- **Overview:**  
  Extracts the filename from the returned image URL and uploads the processed image to a configured FTP server for hosting.

- **Nodes Involved:**  
  - Get Filename (Code)  
  - FTP (FTP Upload)  
  - New Image Url (Set)

- **Node Details:**

  - **Get Filename**  
    - Type: Code (JavaScript)  
    - Role: Parses the image URL to extract the filename for FTP upload.  
    - Configuration:  
      - Loops over all input items.  
      - Extracts filename by splitting URL on '/' and taking last segment.  
      - Adds a new field `fileName` to each item’s JSON.  
    - Inputs: From "Remove from Image URL".  
    - Outputs: To "FTP".  
    - Edge Cases:  
      - URLs without valid file names may cause empty or incorrect filenames.  
      - Unexpected URL structures.

  - **FTP**  
    - Type: FTP  
    - Role: Uploads the processed image file to the FTP server (e.g., BunnyCDN).  
    - Configuration:  
      - Upload path: `/test/{{ $json.fileName }}` dynamically using extracted filename.  
      - Operation: Upload file.  
      - FTP credentials configured externally.  
    - Inputs: From "Get Filename".  
    - Outputs: To "New Image Url".  
    - Edge Cases:  
      - FTP connection/authentication failures.  
      - File upload errors or permission issues.  
      - Non-existent target directories.

  - **New Image Url**  
    - Type: Set  
    - Role: Constructs the new image URL based on the FTP location and filename.  
    - Configuration:  
      - Sets `image_url` to `"https://YOUR_FTP_URL/{{ $json.fileName }}"` (replace YOUR_FTP_URL with actual FTP base URL).  
    - Inputs: From "FTP".  
    - Outputs: To "Update product".  
    - Edge Cases:  
      - Misconfigured URL base causing broken links.

---

#### 1.4 Updating WooCommerce Product

- **Overview:**  
  Updates the WooCommerce product with the new image URL pointing to the background-removed image hosted on the FTP server.

- **Nodes Involved:**  
  - Update product (WooCommerce)

- **Node Details:**

  - **Update product**  
    - Type: WooCommerce  
    - Role: Updates a product’s image URL in WooCommerce using WooCommerce API.  
    - Configuration:  
      - Resource: product  
      - Operation: update  
      - Product ID: dynamically set as `{{$('Set Product Fields').item.json.ID}}` (retrieved from earlier step).  
      - Image data: sets `src` to new image URL (`{{$json.image_url}}`), empty alt and name fields.  
      - WooCommerce API credentials configured externally.  
    - Inputs: From "New Image Url".  
    - Outputs: To "Update Sheet".  
    - Edge Cases:  
      - API authentication failures.  
      - Incorrect product IDs causing update failures.  
      - Network or API downtime.

---

#### 1.5 Updating Google Sheet Status

- **Overview:**  
  Marks the row in the Google Sheet as processed ("DONE" = "x") and writes the new image URL back to the sheet.

- **Nodes Involved:**  
  - Update Sheet (Google Sheets)

- **Node Details:**

  - **Update Sheet**  
    - Type: Google Sheets  
    - Role: Updates the Google Sheet row with new status and new image URL.  
    - Configuration:  
      - Document ID and sheet same as in "Ger Products".  
      - Updates columns:  
        - "DONE" to "x"  
        - "NEW IMAGE" to the new image URL from "New Image Url" node.  
        - Matches rows by "row_number" field from "Set Product Fields" node.  
      - Operation: update  
    - Inputs: From "Update product".  
    - Outputs: To "Loop Over Items" (second output) for next batch iteration.  
    - Edge Cases:  
      - Google Sheets API errors (auth, quota).  
      - Row matching failures causing incorrect updates.  
      - Concurrent updates from other sources.

---

### 3. Summary Table

| Node Name                  | Node Type            | Functional Role                           | Input Node(s)               | Output Node(s)            | Sticky Note                                                                                              |
|----------------------------|----------------------|-----------------------------------------|-----------------------------|---------------------------|--------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger       | Start workflow manually                  | None                        | Ger Products              |                                                                                                        |
| Ger Products               | Google Sheets        | Reads product IDs and images from Sheet | When clicking ‘Execute workflow’ | Loop Over Items          |                                                                                                        |
| Loop Over Items            | SplitInBatches       | Processes rows in batches                 | Ger Products                | Set Product Fields, (empty output unused) |                                                                                                        |
| Set Product Fields         | Set                  | Maps sheet data to workflow fields       | Loop Over Items             | Remove from Image URL      |                                                                                                        |
| Remove from Image URL      | HTTP Request         | Calls BackgroundCut API to remove background | Set Product Fields          | Get Filename              | - Set Header Auth in "Remove from Image URL" (Authorization header with API_KEY)                        |
| Get Filename               | Code (JavaScript)    | Extracts filename from image URL         | Remove from Image URL       | FTP                       |                                                                                                        |
| FTP                       | FTP                  | Uploads processed image to FTP server    | Get Filename                | New Image Url             |                                                                                                        |
| New Image Url              | Set                  | Builds new image URL from FTP location   | FTP                        | Update product            | - Replace YOUR_FTP_URL with actual FTP base URL                                                       |
| Update product             | WooCommerce          | Updates WooCommerce product image URL    | New Image Url               | Update Sheet              | - WooCommerce API credentials must be set                                                             |
| Update Sheet              | Google Sheets        | Marks image as done and sets new URL     | Update product              | Loop Over Items           |                                                                                                        |
| Sticky Note2               | Sticky Note          | Instructions for setup                    | None                        | None                      | - Clone [Google Sheet](https://docs.google.com/spreadsheets/d/1DxiZTvam_4oHHnZVBj_3K3pmWRld8T7l2v_DMuGsqss/edit?usp=sharing) - Get API_KEY from [BackgroundCut.co](https://backgroundcut.co) - Set Header Auth in "Remove from Image URL" - Get WooCommerce API - Set YOUR_FTP_URL in "New Image Url" |
| Sticky Note7               | Sticky Note          | Workflow description                      | None                        | None                      | [BackgroundCut API](https://backgroundcut.co) workflow automates background removal and updates WooCommerce & Google Sheet |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Name: `When clicking ‘Execute workflow’`  
   - Type: Manual Trigger  
   - No special configuration.

2. **Create Google Sheets Node to Read Products**  
   - Name: `Ger Products`  
   - Type: Google Sheets  
   - Configure:  
     - OAuth2 credentials for Google Sheets.  
     - Document ID: Use your Google Sheet ID (clone the provided template).  
     - Sheet Name: Use `gid=0` or the main sheet.  
     - Filter rows where column "DONE" is empty (only process unprocessed rows).  
   - Connect output of Manual Trigger to this node.

3. **Create SplitInBatches Node**  
   - Name: `Loop Over Items`  
   - Type: SplitInBatches  
   - Default batch size (or adjust as needed for performance).  
   - Connect output of `Ger Products` to this node.

4. **Create Set Node to Map Product Fields**  
   - Name: `Set Product Fields`  
   - Type: Set  
   - Assign variables:  
     - `image_url` = `{{$json.IMAGE}}`  
     - `product_id` = `{{$json.ID}}`  
   - Include all other input fields.  
   - Connect first output of `Loop Over Items` to this node.

5. **Create HTTP Request Node for BackgroundCut API**  
   - Name: `Remove from Image URL`  
   - Type: HTTP Request  
   - Configure:  
     - Method: POST  
     - URL: `https://api.backgroundcut.co/v2/cut/`  
     - Content-Type: `multipart/form-data`  
     - Body Parameter: `image_file_url` = `{{$json.image_url}}`  
     - Authentication: HTTP Header Authentication  
       - Header Name: `Authorization`  
       - Header Value: Your BackgroundCut API key  
   - Connect output of `Set Product Fields` to this node.

6. **Create Code Node to Extract Filename**  
   - Name: `Get Filename`  
   - Type: Code  
   - Code (JavaScript):  
     ```javascript
     for (const item of $input.all()) {
       const url = item.json.image_url;
       const fileName = url.split('/').pop();
       item.json.fileName = fileName;
     }
     return $input.all();
     ```  
   - Connect output of `Remove from Image URL` to this node.

7. **Create FTP Node to Upload Image**  
   - Name: `FTP`  
   - Type: FTP  
   - Configure:  
     - FTP Credentials: Your FTP server (e.g., BunnyCDN) credentials.  
     - Operation: Upload  
     - Path: `/test/{{ $json.fileName }}` (adjust path as needed).  
   - Connect output of `Get Filename` to this node.

8. **Create Set Node to Construct New Image URL**  
   - Name: `New Image Url`  
   - Type: Set  
   - Assign variable:  
     - `image_url` = `https://YOUR_FTP_URL/{{ $json.fileName }}` (replace `YOUR_FTP_URL` with your actual FTP CDN URL).  
   - Connect output of `FTP` to this node.

9. **Create WooCommerce Node to Update Product**  
   - Name: `Update product`  
   - Type: WooCommerce  
   - Configure:  
     - Credentials: Set WooCommerce API credentials with necessary permissions.  
     - Resource: product  
     - Operation: update  
     - Product ID: `{{$('Set Product Fields').item.json.ID}}`  
     - Images: set `src` to `{{$json.image_url}}` (new processed image URL).  
   - Connect output of `New Image Url` to this node.

10. **Create Google Sheets Node to Update Sheet**  
    - Name: `Update Sheet`  
    - Type: Google Sheets  
    - Configure:  
      - Same Document ID and sheet as `Ger Products`.  
      - Operation: update  
      - Matching column: `row_number` (from the original sheet row number, preserved from `Set Product Fields`).  
      - Set columns:  
        - `"DONE"` = `"x"`  
        - `"NEW IMAGE"` = `{{$('New Image Url').item.json.image_url}}`  
    - Connect output of `Update product` to this node.

11. **Connect Looping Back to Process Next Batch**  
    - Connect output of `Update Sheet` to the second output of `Loop Over Items` to continue batch processing until all rows are processed.

---

### 5. General Notes & Resources

| Note Content                                                                                                                         | Context or Link                                                                                                           |
|--------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| Clone the Google Sheet template before use to have columns `ID`, `IMAGE`, `DONE`, `NEW IMAGE`                                        | [Google Sheet Template](https://docs.google.com/spreadsheets/d/1DxiZTvam_4oHHnZVBj_3K3pmWRld8T7l2v_DMuGsqss/edit?usp=sharing) |
| Get API key from BackgroundCut.co and set it in HTTP Request node header "Authorization"                                              | [BackgroundCut.co](https://backgroundcut.co)                                                                              |
| Set WooCommerce API credentials with proper permissions for product update                                                           | WooCommerce REST API documentation                                                                                         |
| Replace placeholder `YOUR_FTP_URL` in the "New Image Url" node with your actual FTP server public URL (e.g., BunnyCDN base URL)      | FTP details depend on your hosting/CDN setup                                                                               |
| Workflow automates bulk background removal and product update ensuring consistent synchronization across WooCommerce and Google Sheet |                                                                                                                           |

---

**Disclaimer:** This documentation is based exclusively on an n8n workflow. It respects content policies and contains no illegal, offensive, or protected elements. All data handled are legal and public.