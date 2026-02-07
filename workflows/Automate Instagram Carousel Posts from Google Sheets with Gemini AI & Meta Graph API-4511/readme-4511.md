Automate Instagram Carousel Posts from Google Sheets with Gemini AI & Meta Graph API

https://n8nworkflows.xyz/workflows/automate-instagram-carousel-posts-from-google-sheets-with-gemini-ai---meta-graph-api-4511


# Automate Instagram Carousel Posts from Google Sheets with Gemini AI & Meta Graph API

### 1. Workflow Overview

This workflow automates the process of creating Instagram carousel posts from product data stored in a Google Sheets spreadsheet. It leverages Google Gemini AI to generate Instagram post captions based on product details and uses the Meta Graph API to upload multiple images as a carousel post on Instagram. The workflow also updates the spreadsheet to mark products as uploaded, ensuring no duplicate posts.  

The workflow is logically grouped into the following blocks:  
- **1.1 Scheduling & Input Acquisition:** Periodic trigger and fetching unposted products from Google Sheets  
- **1.2 AI Caption Generation:** Using Google Gemini AI via LangChain agent to create Instagram-ready captions  
- **1.3 Image Upload & Carousel Assembly:** Conditionally uploading main and carousel images to Instagram via Meta Graph API  
- **1.4 Post Publishing & Status Update:** Creating the carousel container post on Instagram and marking the product as uploaded in Google Sheets  
- **1.5 Error Handling:** Nodes to detect upload failures (currently inactive)  

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduling & Input Acquisition

- **Overview:**  
Triggers the workflow every 2 hours and retrieves the next product entry from Google Sheets where `uploaded?` is marked "no". This ensures the workflow processes only new products.

- **Nodes Involved:**  
  - Schedule Trigger  
  - Is Uploaded? (Google Sheets Read)

- **Node Details:**

1. **Schedule Trigger**  
   - *Type:* Schedule Trigger  
   - *Configuration:* Fires every 2 hours  
   - *Input/Output:* No input; outputs trigger event  
   - *Edge Cases:* If workflow is paused or n8n instance down, scheduled runs may be missed  
   - *Version:* 1.2  

2. **Is Uploaded?**  
   - *Type:* Google Sheets (Read)  
   - *Configuration:* Reads first row with `uploaded?` = "no" from sheet "Products To Upload", document ID specified  
   - *Expressions:* Filters on `uploaded?` column with value "no"  
   - *Input/Output:* Input from trigger; outputs product JSON object  
   - *Edge Cases:* If no rows match, no output; will cause downstream nodes to have no data  
   - *Version:* 4.6  

---

#### 1.2 AI Caption Generation

- **Overview:**  
Generates an Instagram post caption using Google Gemini AI, formatted with emojis, hashtags, and instructions specific to Instagram posts. This caption is based on product title, description, and pricing details.

- **Nodes Involved:**  
  - AI Agent (LangChain Agent)  
  - Google Gemini Chat Model (AI Language Model)  
  - Edit Fields (Set)

- **Node Details:**

1. **Google Gemini Chat Model**  
   - *Type:* LangChain AI Language Model (Google Gemini)  
   - *Configuration:* Model "models/gemini-1.5-flash" used for chat completions  
   - *Input/Output:* Receives prompt from AI Agent; outputs AI-generated text  
   - *Edge Cases:* API timeouts, quota limits, or invalid credentials can cause failures  
   - *Version:* 1  

2. **AI Agent**  
   - *Type:* LangChain Agent  
   - *Configuration:*  
     - Prompt instructs creation of Instagram ad description with 4-5 hashtags, emojis, no URLs, prices in South African Rand, formatted with line breaks, no bold or asterisks.  
     - Inputs include product title, description, price, and sale price from Google Sheets data.  
   - *Input/Output:* Input from "Is Uploaded?" node product data; output is generated caption in `$json.output`  
   - *Edge Cases:* Expression referencing product fields must be valid; malformed data may cause prompt errors  
   - *Version:* 2  
   - *Sub-workflow:* Uses Google Gemini Chat Model as language model  

3. **Edit Fields**  
   - *Type:* Set Node  
   - *Configuration:*  
     - Sets `Caption` field to AI Agent output text  
     - Copies image URLs (`mainimage`, `carousel1`, `carousel2`, `carousel3`) from "Is Uploaded?" node output  
     - Sets a placeholder field `Node` with text "place node id here" (later overwritten)  
   - *Input/Output:* Input from AI Agent; output enriched JSON with caption and image URLs  
   - *Edge Cases:* Missing image URLs may affect downstream logic  
   - *Version:* 3.4  

---

#### 1.3 Image Upload & Carousel Assembly

- **Overview:**  
Uploads main and carousel images individually to Instagram via Facebook Graph API, checking for presence of each image. Then merges all uploaded media IDs and creates a carousel container post with the AI-generated caption.

- **Nodes Involved:**  
  - Has Main Image (If)  
  - Facebook Graph API (for main image)  
  - Has Image 1 (If)  
  - Facebook Graph API1 (for carousel1)  
  - Has Image 2 (If)  
  - Facebook Graph API2 (for carousel2)  
  - Has Image 3 (If)  
  - Facebook Graph API3 (for carousel3)  
  - Merge (merge multiple media upload results)  
  - Prepare Carousel Media IDs (Set)  
  - Merge Media + Metadata (Merge)  
  - Create Carousel Container (Facebook Graph API)

- **Node Details:**

1. **Has Main Image**  
   - *Type:* If Node  
   - *Configuration:* Checks if `mainimage` field is non-empty  
   - *Input/Output:* Input from Edit Fields; outputs only if true to upload main image  
   - *Edge Cases:* Empty or invalid URL will skip upload  
   - *Version:* 2.2  

2. **Facebook Graph API (Main Image Upload)**  
   - *Type:* Facebook Graph API  
   - *Configuration:*  
     - POST request to `/media` edge on Instagram node  
     - Parameters include `image_url` (main image), `is_carousel_item=true`  
     - Graph API version v22.0  
   - *Input/Output:* Input is image URL and Instagram Node ID; output includes uploaded media ID  
   - *Edge Cases:* API errors, invalid URLs, auth failures; set to continue on error to avoid stopping workflow  
   - *Version:* 1  

3. **Has Image 1, Facebook Graph API1** (Same pattern as above for `carousel1`)  
4. **Has Image 2, Facebook Graph API2** (Same pattern for `carousel2`)  
5. **Has Image 3, Facebook Graph API3** (Same pattern for `carousel3`)  

6. **Merge**  
   - *Type:* Merge Node  
   - *Configuration:* Merges up to 4 inputs (one from each image upload branch) into a single output array  
   - *Input/Output:* Inputs from 4 If nodes; output is list of media upload results  
   - *Edge Cases:* Missing inputs if images not present, handled by conditional branches  
   - *Version:* 3.1  

7. **Prepare Carousel Media IDs**  
   - *Type:* Set Node  
   - *Configuration:* Creates a JSON with a `children` field concatenating all uploaded media IDs into a comma-separated string  
   - *Input/Output:* Input from Merge; output JSON with `children` property for carousel container  
   - *Edge Cases:* No uploaded media IDs will produce empty `children` string, causing API errors downstream  
   - *Version:* 3.4  

8. **Merge Media + Metadata**  
   - *Type:* Merge Node  
   - *Configuration:* Combines media upload results with metadata (caption, node ID) by position  
   - *Input/Output:* Input from Edit Fields and Prepare Carousel Media IDs; outputs combined data for post creation  
   - *Version:* 3.1  

9. **Create Carousel Container**  
   - *Type:* Facebook Graph API  
   - *Configuration:*  
     - POST to `/media` edge with parameters:  
       - `caption` from AI Agent output  
       - `media_type` set to `CAROUSEL`  
       - `children` list of uploaded media IDs (comma-separated)  
     - Graph API v22.0  
   - *Input/Output:* Input combined media IDs and caption; output includes `creation_id` for publishing  
   - *Edge Cases:* API errors if children list empty or invalid, auth issues  
   - *Version:* 1  

---

#### 1.4 Post Publishing & Status Update

- **Overview:**  
Publishes the carousel post to Instagram using the creation ID and updates the Google Sheets row to mark the product as uploaded.

- **Nodes Involved:**  
  - Post to IG (Facebook Graph API)  
  - Mark Uploaded (Google Sheets Update)

- **Node Details:**

1. **Post to IG**  
   - *Type:* Facebook Graph API  
   - *Configuration:*  
     - POST to `/media_publish` edge with `creation_id` from previous node  
     - Graph API v22.0  
   - *Input/Output:* Input is `creation_id`; output is post publishing response  
   - *Edge Cases:* API errors, rate limits, invalid creation ID; failures will cause post not to appear  
   - *Version:* 1  

2. **Mark Uploaded**  
   - *Type:* Google Sheets (Update)  
   - *Configuration:*  
     - Updates the row matching `ID` with `uploaded?` set to "yes"  
     - Uses sheet "Products To Upload" and document ID same as read node  
   - *Input/Output:* Input from Post to IG node, confirms successful posting  
   - *Edge Cases:* Potential spreadsheet API errors or mismatched IDs could fail to update status, leading to duplicate posts  
   - *Version:* 4.6  

---

#### 1.5 Error Handling (Inactive)

- **Overview:**  
Contains If nodes that check if Facebook Graph API upload returns status code 400 (bad request), routing failures to the Merge node to prevent workflow failure. Currently inactive.

- **Nodes Involved:**  
  - If, If1, If2, If3 (all If nodes checking for statusCode 400)  

- **Node Details:**  
  - *Type:* If Node  
  - *Configuration:* Checks if `statusCode` equals 400 from Facebook API responses  
  - *Input/Output:* Connected to respective Facebook Graph API nodes for images  
  - *Edge Cases:* Intended to catch upload failures; currently disabled so errors may not be fully handled  

---

### 3. Summary Table

| Node Name               | Node Type                | Functional Role                               | Input Node(s)               | Output Node(s)                 | Sticky Note                                     |
|-------------------------|--------------------------|-----------------------------------------------|-----------------------------|-------------------------------|------------------------------------------------|
| Schedule Trigger        | Schedule Trigger          | Initiates workflow every 2 hours               | —                           | Is Uploaded?                   |                                                |
| Is Uploaded?             | Google Sheets            | Fetch next unposted product row                 | Schedule Trigger             | AI Agent                      |                                                |
| AI Agent                | LangChain Agent          | Generate Instagram caption using Gemini AI     | Is Uploaded?                 | Edit Fields                   |                                                |
| Google Gemini Chat Model | LangChain LM             | Provides AI language model for AI Agent        | AI Agent (ai_languageModel)  | AI Agent                      |                                                |
| Edit Fields             | Set                      | Prepare caption and copy image URLs             | AI Agent                    | Has Main Image, Has Image 1.. |                                                |
| Has Main Image          | If                       | Check if main image URL exists                   | Edit Fields                 | Facebook Graph API            |                                                |
| Facebook Graph API      | Facebook Graph API       | Upload main image to Instagram                   | Has Main Image              | If                           |                                                |
| If                      | If                       | Check for 400 error on main image upload        | Facebook Graph API          | Merge                        |                                                |
| Has Image 1             | If                       | Check if carousel1 image URL exists              | Edit Fields                 | Facebook Graph API1           |                                                |
| Facebook Graph API1     | Facebook Graph API       | Upload carousel1 image                            | Has Image 1                 | If1                          |                                                |
| If1                     | If                       | Check for 400 error on carousel1 upload         | Facebook Graph API1         | Merge                        |                                                |
| Has Image 2             | If                       | Check if carousel2 image URL exists              | Edit Fields                 | Facebook Graph API2           |                                                |
| Facebook Graph API2     | Facebook Graph API       | Upload carousel2 image                            | Has Image 2                 | If2                          |                                                |
| If2                     | If                       | Check for 400 error on carousel2 upload         | Facebook Graph API2         | Merge                        |                                                |
| Has Image 3             | If                       | Check if carousel3 image URL exists              | Edit Fields                 | Facebook Graph API3           |                                                |
| Facebook Graph API3     | Facebook Graph API       | Upload carousel3 image                            | Has Image 3                 | If3                          |                                                |
| If3                     | If                       | Check for 400 error on carousel3 upload         | Facebook Graph API3         | Merge                        |                                                |
| Merge                   | Merge                    | Combine media upload results                      | If, If1, If2, If3           | Prepare Carousel Media IDs    |                                                |
| Prepare Carousel Media IDs | Set                    | Create comma-separated list of uploaded media IDs | Merge                       | Merge Media + Metadata        |                                                |
| Merge Media + Metadata  | Merge                    | Combine media IDs with caption and metadata      | Edit Fields, Prepare Carousel Media IDs | Create Carousel Container |                                                |
| Create Carousel Container | Facebook Graph API     | Create Instagram carousel container post          | Merge Media + Metadata       | Post to IG                   |                                                |
| Post to IG              | Facebook Graph API       | Publish carousel post to Instagram                | Create Carousel Container    | Mark Uploaded                |                                                |
| Mark Uploaded           | Google Sheets            | Update sheet to mark product as uploaded          | Post to IG                  | —                            |                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node:**  
   - Set to trigger every 2 hours.

2. **Add a Google Sheets node ("Is Uploaded?"):**  
   - Operation: Read  
   - Document ID: your Google Sheets product data spreadsheet ID  
   - Sheet Name: "Products To Upload" (gid=0)  
   - Filter to select rows where `uploaded?` = "no"  
   - Return first matched entry only.

3. **Add a LangChain Google Gemini Chat Model node:**  
   - Model Name: `models/gemini-1.5-flash`

4. **Add a LangChain Agent node ("AI Agent"):**  
   - Use the Google Gemini Chat Model node as the language model  
   - Prompt: Provide detailed instructions to generate Instagram captions including hashtags, emojis, formatting, and pricing in South African Rand. Use product fields `title`, `description`, `price`, `sale_price` via expressions.  
   - Output: Text for Instagram caption.

5. **Add a Set node ("Edit Fields"):**  
   - Assign:  
     - `Caption` = AI Agent output text  
     - `mainimage`, `carousel1`, `carousel2`, `carousel3` = copied from the Google Sheets product data  
     - `Node` = placeholder string ("place node id here") to be replaced by Instagram Node ID.

6. **Add four If nodes to check for presence of images:**  
   - Conditions check if `mainimage`, `carousel1`, `carousel2`, `carousel3` fields are non-empty respectively.

7. **Add four Facebook Graph API nodes to upload images:**  
   - For each image URL, POST to `/media` edge of Instagram Node ID specified in `Node` field  
   - Query parameters include `image_url` and `is_carousel_item=true`  
   - Set "Continue On Fail" to true to prevent workflow termination on failure.

8. **Add four If nodes to detect status code 400 errors from Facebook uploads:**  
   - Condition: `statusCode` equals 400  
   - (Optional: currently inactive; can be enabled for error handling)

9. **Add a Merge node:**  
   - Number of inputs: 4  
   - Merge mode: Combine  
   - Connect all 400 error If nodes outputs to this Merge node.

10. **Add a Set node ("Prepare Carousel Media IDs"):**  
    - Create a JSON property `children` concatenating all uploaded media IDs from the Merge node, joined by commas.

11. **Add a Merge node ("Merge Media + Metadata"):**  
    - Combine: the output of "Prepare Carousel Media IDs" and the "Edit Fields" node by position.

12. **Add a Facebook Graph API node ("Create Carousel Container"):**  
    - POST to `/media` edge of Instagram Node ID  
    - Parameters:  
      - `caption` = from merged metadata  
      - `media_type` = "CAROUSEL"  
      - `children` = list of media IDs  
    - API version v22.0

13. **Add a Facebook Graph API node ("Post to IG"):**  
    - POST to `/media_publish` edge  
    - Parameter: `creation_id` from "Create Carousel Container" node output

14. **Add a Google Sheets node ("Mark Uploaded"):**  
    - Operation: Update  
    - Document ID and sheet same as "Is Uploaded?"  
    - Update row matching `ID` to set `uploaded?` = "yes"

15. **Connect all nodes as per the logical flow:**  
    - Schedule Trigger → Is Uploaded? → AI Agent → Edit Fields → conditional image checks and uploads → Merge uploaded media → Prepare Carousel Media IDs → Merge Media + Metadata → Create Carousel Container → Post to IG → Mark Uploaded

16. **Credentials:**  
    - Configure Google Sheets credentials with access to the target spreadsheet  
    - Configure Facebook Graph API credentials with Instagram Business Account permissions  
    - Configure LangChain credentials with access to Google Gemini AI model.

---

### 5. General Notes & Resources

| Note Content                                                                                                          | Context or Link                                                                                               |
|-----------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| The workflow uses Meta Graph API v22.0, ensure app permissions include Instagram Content Publishing and Media Uploads. | Meta for Developers: https://developers.facebook.com/docs/instagram-api/reference/media                        |
| Google Gemini AI model "gemini-1.5-flash" is used via LangChain integration in n8n for caption generation.            | Requires valid Google Cloud AI credentials and LangChain setup.                                              |
| The workflow assumes the Google Sheets document columns include: ID, title, description, price, sale_price, mainimage, carousel1-3, uploaded?. | Spreadsheet must be kept updated for consistent data ingestion.                                              |
| Instagram post captions are carefully formatted to avoid prohibited symbols and URLs per Instagram's content policies. | See Instagram Content Guidelines: https://help.instagram.com/519522125107875                                |
| Error handling nodes are present but inactive; enabling them can improve robustness in case of API failures.          | Consider enabling and expanding on error handling for production use.                                        |

---

**Disclaimer:** The provided text derives exclusively from an automated n8n workflow. It adheres strictly to current content policies and contains no illegal or protected material. All data processed is legal and public.