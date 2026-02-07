Automated AI Content Creation & Instagram Publishing from Google Sheets 

https://n8nworkflows.xyz/workflows/automated-ai-content-creation---instagram-publishing-from-google-sheets--3840


# Automated AI Content Creation & Instagram Publishing from Google Sheets 

---

## 1. Workflow Overview

This workflow automates the end-to-end process of creating and publishing AI-generated social media content on Instagram, using initial content ideas stored in a Google Sheet. It leverages Google Gemini for AI-powered concept, prompt, and caption generation, Replicate Flux for image creation, and the Facebook Graph API for Instagram publishing.

The workflow is logically divided into the following blocks:

- **1.1 Scheduled Trigger & Input Retrieval:** Automatically triggers on a schedule and fetches the next unprocessed content idea from Google Sheets.
- **1.2 Input Preparation:** Extracts and organizes key input variables (`Topic`, `Audience`, `Voice`, `Platform`) for AI processing.
- **1.3 AI Content Generation:** Uses Google Gemini to generate a content concept, two distinct image prompt options, and a tailored caption.
- **1.4 AI Image Generation:** Sends the first image prompt to Replicate Flux to generate the visual content.
- **1.5 Instagram Publishing:** Prepares data and uses the Facebook Graph API to upload and publish the image with caption on Instagram.
- **1.6 Post-Processing:** Updates the Google Sheet to mark the content idea as completed, preventing reprocessing.

---

## 2. Block-by-Block Analysis

### 1.1 Scheduled Trigger & Input Retrieval

**Overview:**  
This block initiates the workflow on a user-defined schedule and fetches the next pending content idea from the Google Sheet, filtering by a 'Status' column with value `0` (pending).

**Nodes Involved:**  
- Scheduled Start: Check for New Posts  
- 1. Get Next Post Idea from Sheet

**Node Details:**

- **Scheduled Start: Check for New Posts**  
  - Type: Schedule Trigger  
  - Role: Automatically triggers workflow runs based on a configured interval (e.g., hourly, daily).  
  - Configuration: Default interval set; user must configure desired frequency.  
  - Inputs: None (trigger node)  
  - Outputs: Triggers next node  
  - Edge Cases: Misconfiguration of schedule may cause missed or excessive runs.

- **1. Get Next Post Idea from Sheet**  
  - Type: Google Sheets (Read)  
  - Role: Reads the next row from the specified Google Sheet where `Status` = `0`. Returns only the first matching row.  
  - Configuration:  
    - Spreadsheet ID and Sheet Name set to user’s content plan sheet.  
    - Filter: `Status` column equals `0` (pending).  
    - Return first match only.  
    - Credentials: Google Sheets OAuth2.  
  - Inputs: Trigger from schedule node  
  - Outputs: JSON object with columns including `Topic`, `Audience`, `Voice`, `Platform`, `Status`.  
  - Edge Cases:  
    - No matching rows (no pending posts) results in empty output; downstream nodes should handle this gracefully.  
    - Google Sheets API errors or credential issues.  

---

### 1.2 Input Preparation

**Overview:**  
Extracts and renames key variables from the Google Sheet row to prepare inputs for AI generation nodes.

**Nodes Involved:**  
- 2. Prepare Input Variables (Topic, Audience, etc.)

**Node Details:**

- **2. Prepare Input Variables (Topic, Audience, etc.)**  
  - Type: Set  
  - Role: Maps raw Google Sheet data fields to standardized variable names for downstream use.  
  - Configuration: Assigns four string variables:  
    - `Topic` ← `$json.Topic`  
    - `TargetAudience` ← `$json.Audience`  
    - `BrandVoice` ← `$json.Voice`  
    - `Platform` ← `$json.Platform`  
  - Inputs: Output from Google Sheets node  
  - Outputs: JSON with prepared variables  
  - Edge Cases: Missing or empty fields in input data may cause incomplete AI prompts.

---

### 1.3 AI Content Generation

**Overview:**  
This block uses Google Gemini (via Langchain nodes) to generate:  
- A unique content concept tailored for the platform (fixed format: Single Image).  
- Two distinct, detailed image prompt options based on the concept.  
- A platform-specific caption aligned with the concept and image prompt.

**Nodes Involved:**  
- 3a. Generate Content Concept (Gemini)  
- (LLM Model for Concept)  
- (Parse Concept JSON)  
- 3b. Generate Image Prompt Options (Gemini)  
- (LLM Model for Prompts)  
- (Parse Prompts JSON)  
- 3c. Generate Post Caption (Gemini)  
- (LLM Model for Caption)  
- (Parse Caption JSON)

**Node Details:**

- **3a. Generate Content Concept (Gemini)**  
  - Type: Langchain Chain LLM  
  - Role: Generates exactly one creative content concept JSON object tailored for Instagram or LinkedIn, fixed to "Single Image" format.  
  - Configuration:  
    - Prompt instructs the AI to consider `Topic`, `TargetAudience`, `BrandVoice`, and `Platform`.  
    - Output must be a JSON object with key `ideas` containing one object with `concept` and `suggested_format`.  
  - Inputs: Prepared variables from node 2  
  - Outputs: JSON with content concept  
  - Edge Cases: AI may generate invalid JSON or off-topic concepts; output parser node mitigates this.

- **(LLM Model for Concept)**  
  - Type: Langchain Chat Model - Google Gemini  
  - Role: Executes the Gemini model call for concept generation.  
  - Configuration: Uses model `models/gemini-2.0-flash-001` with configured Google Vertex AI credentials.  
  - Inputs: From 3a node  
  - Outputs: Raw AI response  

- **(Parse Concept JSON)**  
  - Type: Langchain Output Parser - Structured  
  - Role: Parses the AI response to enforce JSON schema compliance and extract the concept object.  
  - Configuration: JSON schema expects one `ideas` array with one object containing `concept` and `suggested_format`.  
  - Inputs: Raw AI response  
  - Outputs: Parsed JSON concept  

- **3b. Generate Image Prompt Options (Gemini)**  
  - Type: Langchain Chain LLM  
  - Role: Expands the concept into two distinct, detailed image prompt options tailored for the platform.  
  - Configuration:  
    - Prompt instructs AI to analyze the concept, user inputs, and platform norms.  
    - Output must be a JSON object with `expanded_post_concept` and `prompt_options` (array of exactly two prompt objects).  
  - Inputs: Parsed concept JSON, plus variables from node 2  
  - Outputs: JSON with two prompt options and expanded concept description  
  - Edge Cases: AI may produce prompts that are too similar or insufficiently detailed; manual review recommended.

- **(LLM Model for Prompts)**  
  - Type: Langchain Chat Model - Google Gemini  
  - Role: Executes Gemini model call for prompt generation.  
  - Configuration: Same Gemini model as above.  
  - Inputs: From 3b node  
  - Outputs: Raw AI response  

- **(Parse Prompts JSON)**  
  - Type: Langchain Output Parser - Structured  
  - Role: Parses AI response to extract two prompt options and expanded concept.  
  - Configuration: JSON schema enforces two prompt options with descriptions and prompt strings.  
  - Inputs: Raw AI response  
  - Outputs: Parsed prompt options JSON  

- **3c. Generate Post Caption (Gemini)**  
  - Type: Langchain Chain LLM  
  - Role: Generates a concise, engaging caption tailored for the platform, based on the first image prompt and overall context.  
  - Configuration:  
    - Prompt instructs AI to write platform-specific captions with appropriate tone, length, and hashtags.  
    - Output must be a JSON object with a single `Caption` string.  
  - Inputs: First prompt from 3b, concept from 3a, and original input variables  
  - Outputs: JSON with caption text  
  - Edge Cases: Caption may lack relevance or hashtags; review recommended.

- **(LLM Model for Caption)**  
  - Type: Langchain Chat Model - Google Gemini  
  - Role: Executes Gemini model call for caption generation.  
  - Configuration: Uses model `models/gemini-2.0-flash`.  
  - Inputs: From 3c node  
  - Outputs: Raw AI response  

- **(Parse Caption JSON)**  
  - Type: Langchain Output Parser - Structured  
  - Role: Parses AI response to extract caption string.  
  - Inputs: Raw AI response  
  - Outputs: Parsed caption JSON  

---

### 1.4 AI Image Generation

**Overview:**  
Generates the visual image using the first detailed prompt option by calling the Replicate API with the Flux model.

**Nodes Involved:**  
- 4. Generate Image using Prompt 1 (Replicate Flux)

**Node Details:**

- **4. Generate Image using Prompt 1 (Replicate Flux)**  
  - Type: HTTP Request  
  - Role: Sends a POST request to Replicate API to generate an image based on the first prompt.  
  - Configuration:  
    - URL: `https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro-ultra/predictions`  
    - Method: POST  
    - Body: JSON with input parameters including prompt string, aspect ratio `1:1`, output format `jpg`, safety tolerance `6`.  
    - Headers: Includes `Prefer: wait` to wait for synchronous response.  
    - Authentication: HTTP Header Auth with Replicate API token.  
  - Inputs: First prompt string from 3b node output  
  - Outputs: JSON containing image URL under `output` key  
  - Edge Cases: API rate limits, timeouts, or invalid prompt errors; handle retries or error notifications.

---

### 1.5 Instagram Publishing

**Overview:**  
Prepares the image URL and caption, uploads the media to Instagram via Facebook Graph API, waits for processing, and publishes the post.

**Nodes Involved:**  
- 5. Prepare Data for Instagram API  
- 6a. Create Instagram Media Container  
- 6b. Wait for Container Processing  
- 6c. Publish Post to Instagram

**Node Details:**

- **5. Prepare Data for Instagram API**  
  - Type: Set  
  - Role: Organizes the image URL and caption into variables for Instagram API calls.  
  - Configuration:  
    - Sets `ImageURL` to the image URL from Replicate response.  
    - Sets `Caption` to the caption generated by Gemini.  
  - Inputs: Outputs from nodes 4 and 3c  
  - Outputs: JSON with `ImageURL` and `Caption`  

- **6a. Create Instagram Media Container**  
  - Type: Facebook Graph API  
  - Role: Creates a media container on Instagram by uploading the image URL and caption.  
  - Configuration:  
    - Edge: `media`  
    - Node: Instagram Business Account ID (user must replace placeholder)  
    - HTTP Method: POST  
    - Query Parameters: `caption` and `image_url` from node 5  
    - Graph API Version: v22.0  
    - Credentials: Facebook Graph API OAuth2 with required permissions  
  - Inputs: From node 5  
  - Outputs: JSON containing container `id`  

- **6b. Wait for Container Processing**  
  - Type: Wait  
  - Role: Pauses workflow to allow Instagram to process the uploaded media container.  
  - Configuration: Default wait time (adjustable by user if needed)  
  - Inputs: From node 6a  
  - Outputs: Passes container `id` forward  

- **6c. Publish Post to Instagram**  
  - Type: Facebook Graph API  
  - Role: Publishes the processed media container to Instagram feed.  
  - Configuration:  
    - Edge: `media_publish`  
    - Node: Instagram Business Account ID (same as 6a)  
    - HTTP Method: POST  
    - Query Parameter: `creation_id` set to container `id` from 6a  
    - Graph API Version: v22.0  
    - Credentials: Facebook Graph API OAuth2  
  - Inputs: From node 6b  
  - Outputs: JSON with published media `id`  
  - Edge Cases: API rate limits, permission errors, or processing delays; may require retries or error handling.

---

### 1.6 Post-Processing

**Overview:**  
Marks the processed content idea as completed in the Google Sheet by updating its `Status` to `1`.

**Nodes Involved:**  
- 7. Update Post Status in Sheet

**Node Details:**

- **7. Update Post Status in Sheet**  
  - Type: Google Sheets (Update)  
  - Role: Updates the row matching the processed `Topic` to set `Status` = `1` (completed).  
  - Configuration:  
    - Spreadsheet ID and Sheet Name same as node 1  
    - Matching Column: `Topic`  
    - Columns to update: `Status` = `1`  
    - Credentials: Google Sheets OAuth2  
  - Inputs: From node 6c (published post)  
  - Outputs: Confirmation of update  
  - Edge Cases: If multiple rows share the same `Topic`, all matching rows may be updated; ensure unique topics or adjust matching criteria.

---

## 3. Summary Table

| Node Name                             | Node Type                         | Functional Role                                | Input Node(s)                        | Output Node(s)                       | Sticky Note                                                                                                                        |
|-------------------------------------|----------------------------------|-----------------------------------------------|------------------------------------|------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| Scheduled Start: Check for New Posts| Schedule Trigger                 | Triggers workflow on schedule                  | None                               | 1. Get Next Post Idea from Sheet    | # 00. Scheduled Start & Input Preparation: Initiates workflow and fetches next pending post idea.                                  |
| 1. Get Next Post Idea from Sheet    | Google Sheets (Read)             | Reads next pending content idea from sheet    | Scheduled Start                    | 2. Prepare Input Variables          |                                                                                                                                   |
| 2. Prepare Input Variables (Topic, Audience, etc.) | Set                     | Prepares input variables for AI nodes          | 1. Get Next Post Idea from Sheet   | 3a. Generate Content Concept (Gemini) |                                                                                                                                   |
| 3a. Generate Content Concept (Gemini)| Langchain Chain LLM             | Generates one unique content concept (Single Image) | 2. Prepare Input Variables          | (LLM Model for Concept)             | # 01. Content Concept Generation: Uses Gemini to create one unique content concept tailored for platform.                          |
| (LLM Model for Concept)              | Langchain Chat Model - Gemini   | Executes Gemini model call for concept         | 3a. Generate Content Concept        | (Parse Concept JSON)                |                                                                                                                                   |
| (Parse Concept JSON)                 | Langchain Output Parser         | Parses concept JSON output                      | (LLM Model for Concept)             | 3b. Generate Image Prompt Options (Gemini) |                                                                                                                                   |
| 3b. Generate Image Prompt Options (Gemini) | Langchain Chain LLM         | Generates two distinct detailed image prompts | (Parse Concept JSON), 2. Prepare Input Variables | (LLM Model for Prompts)             | # 02. Image Prompt Elaboration & Options: Expands concept into two detailed image prompts optimized for platform.                 |
| (LLM Model for Prompts)              | Langchain Chat Model - Gemini   | Executes Gemini model call for prompts          | 3b. Generate Image Prompt Options   | (Parse Prompts JSON)                |                                                                                                                                   |
| (Parse Prompts JSON)                 | Langchain Output Parser         | Parses prompt options JSON output               | (LLM Model for Prompts)             | 3c. Generate Post Caption (Gemini) |                                                                                                                                   |
| 3c. Generate Post Caption (Gemini)  | Langchain Chain LLM             | Generates platform-specific caption             | (Parse Prompts JSON), 3a. Generate Content Concept, 1. Get Next Post Idea from Sheet | (LLM Model for Caption)             | # 03a. Caption Generation: Writes engaging caption tailored for platform with hashtags.                                           |
| (LLM Model for Caption)              | Langchain Chat Model - Gemini   | Executes Gemini model call for caption          | 3c. Generate Post Caption           | (Parse Caption JSON)                |                                                                                                                                   |
| (Parse Caption JSON)                 | Langchain Output Parser         | Parses caption JSON output                       | (LLM Model for Caption)             | 4. Generate Image using Prompt 1 (Replicate Flux) |                                                                                                                                   |
| 4. Generate Image using Prompt 1 (Replicate Flux) | HTTP Request               | Generates image from first prompt via Replicate API | (Parse Caption JSON)                | 5. Prepare Data for Instagram API  | # 03b. Image Generation: Uses first prompt to generate image with Replicate Flux model.                                            |
| 5. Prepare Data for Instagram API   | Set                            | Prepares image URL and caption for Instagram API | 4. Generate Image using Prompt 1   | 6a. Create Instagram Media Container |                                                                                                                                   |
| 6a. Create Instagram Media Container| Facebook Graph API             | Uploads image and caption to Instagram container | 5. Prepare Data for Instagram API  | 6b. Wait for Container Processing  | # 04. Instagram Publishing: Uploads media container to Instagram with caption.                                                    |
| 6b. Wait for Container Processing   | Wait                          | Waits for Instagram to process media container | 6a. Create Instagram Media Container | 6c. Publish Post to Instagram       |                                                                                                                                   |
| 6c. Publish Post to Instagram        | Facebook Graph API             | Publishes media container as Instagram post    | 6b. Wait for Container Processing  | 7. Update Post Status in Sheet      |                                                                                                                                   |
| 7. Update Post Status in Sheet       | Google Sheets (Update)         | Marks post idea as completed in Google Sheet   | 6c. Publish Post to Instagram       | None                              | # 05. Finalize: Update Sheet Status: Updates 'Status' to '1' to prevent reprocessing.                                               |
| Sticky Note                         | Sticky Note                   | Various explanatory notes covering blocks      | None                               | None                              | Multiple sticky notes provide detailed explanations for blocks 1 through 5 as described above.                                    |

---

## 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Configure interval (e.g., every hour, daily) for automatic runs.

2. **Create Google Sheets Node to Read Next Post Idea**  
   - Type: Google Sheets (Read)  
   - Set operation to read rows with filter: `Status` = `0` (pending).  
   - Limit to return first match only.  
   - Configure Spreadsheet ID and Sheet Name to your content plan sheet.  
   - Use Google Sheets OAuth2 credentials.

3. **Create Set Node to Prepare Input Variables**  
   - Type: Set  
   - Map fields from Google Sheets output:  
     - `Topic` ← `$json.Topic`  
     - `TargetAudience` ← `$json.Audience`  
     - `BrandVoice` ← `$json.Voice`  
     - `Platform` ← `$json.Platform`

4. **Create Langchain Chain LLM Node for Content Concept Generation**  
   - Type: Langchain Chain LLM  
   - Configure prompt to instruct AI to generate exactly one content concept JSON object with keys `concept` and `suggested_format` fixed to `"Single Image"`.  
   - Use input variables from Set node.  
   - Connect to Langchain Chat Model node.

5. **Create Langchain Chat Model Node for Concept**  
   - Type: Langchain Chat Model - Google Gemini  
   - Select model `models/gemini-2.0-flash-001`.  
   - Use Google Vertex AI credentials.

6. **Create Langchain Output Parser Node for Concept**  
   - Type: Langchain Output Parser - Structured  
   - Define JSON schema expecting one `ideas` array with one object containing `concept` and `suggested_format`.  
   - Connect output of Chat Model node to this parser.

7. **Create Langchain Chain LLM Node for Image Prompt Options**  
   - Type: Langchain Chain LLM  
   - Configure prompt to generate two distinct, detailed image prompt options JSON object with keys `expanded_post_concept` and `prompt_options` (array of two prompt objects).  
   - Inputs: Parsed concept JSON and prepared input variables.  
   - Connect to Langchain Chat Model node.

8. **Create Langchain Chat Model Node for Prompts**  
   - Type: Langchain Chat Model - Google Gemini  
   - Use same model and credentials as concept node.

9. **Create Langchain Output Parser Node for Prompts**  
   - Type: Langchain Output Parser - Structured  
   - Define JSON schema expecting `expanded_post_concept` string and `prompt_options` array with two objects each containing `option_description` and `prompts` array with one string.  
   - Connect output of Chat Model node to this parser.

10. **Create Langchain Chain LLM Node for Caption Generation**  
    - Type: Langchain Chain LLM  
    - Configure prompt to generate a platform-specific caption JSON object with key `Caption`.  
    - Inputs: First prompt from prompt options, concept, and original input variables.  
    - Connect to Langchain Chat Model node.

11. **Create Langchain Chat Model Node for Caption**  
    - Type: Langchain Chat Model - Google Gemini  
    - Use model `models/gemini-2.0-flash`.  
    - Use Google Vertex AI credentials.

12. **Create Langchain Output Parser Node for Caption**  
    - Type: Langchain Output Parser - Structured  
    - Define JSON schema expecting a single key `Caption` with string value.  
    - Connect output of Chat Model node to this parser.

13. **Create HTTP Request Node for Image Generation (Replicate Flux)**  
    - Type: HTTP Request  
    - Method: POST  
    - URL: `https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro-ultra/predictions`  
    - Body (JSON):  
      ```json
      {
        "input": {
          "raw": false,
          "prompt": "{{ first prompt string from prompt options }}",
          "aspect_ratio": "1:1",
          "output_format": "jpg",
          "safety_tolerance": 6
        }
      }
      ```  
    - Headers: Include `Prefer: wait`  
    - Authentication: HTTP Header Auth with Replicate API token.

14. **Create Set Node to Prepare Instagram API Data**  
    - Type: Set  
    - Assign:  
      - `ImageURL` ← image URL from Replicate response (`output`)  
      - `Caption` ← caption string from caption parser node

15. **Create Facebook Graph API Node to Create Instagram Media Container**  
    - Type: Facebook Graph API  
    - Edge: `media`  
    - Node: Your Instagram Business Account ID (replace placeholder)  
    - HTTP Method: POST  
    - Query Parameters:  
      - `caption` = `Caption` from previous node  
      - `image_url` = `ImageURL` from previous node  
    - Credentials: Facebook Graph API OAuth2 with required permissions.

16. **Create Wait Node for Container Processing**  
    - Type: Wait  
    - Default wait time (adjustable if needed).

17. **Create Facebook Graph API Node to Publish Instagram Post**  
    - Type: Facebook Graph API  
    - Edge: `media_publish`  
    - Node: Same Instagram Business Account ID  
    - HTTP Method: POST  
    - Query Parameter: `creation_id` = container `id` from media container creation node  
    - Credentials: Facebook Graph API OAuth2.

18. **Create Google Sheets Node to Update Post Status**  
    - Type: Google Sheets (Update)  
    - Spreadsheet ID and Sheet Name same as initial read node  
    - Matching Column: `Topic`  
    - Update `Status` column to `1` (completed)  
    - Credentials: Google Sheets OAuth2.

19. **Connect Nodes in Logical Order:**  
    - Schedule Trigger → Get Next Post Idea → Prepare Input Variables → Generate Content Concept → LLM Model for Concept → Parse Concept JSON → Generate Image Prompt Options → LLM Model for Prompts → Parse Prompts JSON → Generate Post Caption → LLM Model for Caption → Parse Caption JSON → Generate Image (Replicate) → Prepare Data for Instagram → Create Instagram Media Container → Wait → Publish Post → Update Post Status.

20. **Activate Workflow and Test:**  
    - Ensure all credentials are configured correctly.  
    - Replace Instagram Business Account ID placeholders with your actual ID.  
    - Populate Google Sheet with test data (`Status` = `0`).  
    - Run workflow manually or wait for scheduled trigger.

---

## 5. General Notes & Resources

| Note Content                                                                                                                                                                                                 | Context or Link                                                                                           |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| This workflow assumes a separate process populates the Google Sheet with initial content ideas including `Topic`, `Audience`, `Voice`, `Platform`, and `Status`.                                             | Workflow description                                                                                      |
| Instagram Business Account ID must be replaced in Facebook Graph API nodes (`6a` and `6c`) with your actual account ID for publishing to work.                                                                | Setup instructions                                                                                         |
| Facebook App must have permissions: `instagram_basic`, `instagram_content_publish`, `pages_read_engagement`, `pages_show_list`.                                                                               | Prerequisites                                                                                            |
| Google Gemini API credentials are configured via Google Vertex AI credentials in n8n.                                                                                                                         | Prerequisites                                                                                            |
| Replicate API uses the Flux model `black-forest-labs/flux-1.1-pro-ultra` by default; you may change the model in the HTTP Request node if desired.                                                             | Node 4 configuration                                                                                      |
| Wait node duration may need adjustment depending on Instagram processing times and media size.                                                                                                                 | Node 6b note                                                                                            |
| Sticky notes in the workflow provide detailed explanations for each major block, useful for understanding and troubleshooting.                                                                               | Workflow sticky notes                                                                                      |
| For more information on Facebook Graph API Instagram publishing, see: https://developers.facebook.com/docs/instagram-api/guides/content-publishing/                                                            | External resource                                                                                        |
| For Google Gemini API usage and Langchain integration, refer to Google Vertex AI and Langchain documentation.                                                                                                  | External resource                                                                                        |
| Replicate API documentation: https://replicate.com/docs/api-reference                                                                                                                                        | External resource                                                                                        |

---

This document provides a comprehensive reference for understanding, reproducing, and maintaining the "Automated AI Content Creation & Instagram Publishing from Google Sheets" workflow in n8n.