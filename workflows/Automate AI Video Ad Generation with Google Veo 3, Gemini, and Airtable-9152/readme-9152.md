Automate AI Video Ad Generation with Google Veo 3, Gemini, and Airtable

https://n8nworkflows.xyz/workflows/automate-ai-video-ad-generation-with-google-veo-3--gemini--and-airtable-9152


# Automate AI Video Ad Generation with Google Veo 3, Gemini, and Airtable

---

### 1. Workflow Overview

This workflow automates the generation of AI-powered video advertisements using user input prompts and image uploads, leveraging Google Gemini AI, Google Veo 3 video generation, and Airtable for data storage and management. It targets marketers or creative teams who want to streamline the creation of dynamic video ads based on creative ideas and visual assets.

The workflow is structured into the following logical blocks:

- **1.1 User Input Reception:** Collects the user’s creative prompt and image via form triggers.
- **1.2 Airtable Record Management:** Creates, updates, and retrieves records in Airtable to store prompts, images, status, and video data.
- **1.3 Image Processing and Upload:** Converts the uploaded image to a suitable format and uploads it to Airtable.
- **1.4 AI Image Analysis:** Uses Google Gemini AI to analyze the uploaded image and generate a structured creative brief.
- **1.5 Video Generation Preparation:** Parses the AI analysis output to build a request payload for Google Veo 3 video generation.
- **1.6 Video Generation and Retrieval:** Initiates video generation with Google Veo 3, waits for completion, and retrieves the finished video.
- **1.7 Finalization:** Converts the retrieved video content into a downloadable binary file and updates Airtable status to "Done".

---

### 2. Block-by-Block Analysis

#### 2.1 User Input Reception

- **Overview:** This block gathers the user’s idea prompt and image upload via web forms, triggering the workflow start.
- **Nodes Involved:**  
  - Prompt your Idea  
  - Upload Image

- **Node Details:**

  - **Prompt your Idea**  
    - *Type:* Form Trigger  
    - *Role:* Entry point for user text input (creative idea prompt).  
    - *Configuration:* Single required field labeled "Idea Prompt".  
    - *Input/Output:* Outputs JSON with prompt text.  
    - *Edge cases:* Missing or empty prompt will block progress due to required validation.  
    - *Sub-workflow:* None.

  - **Upload Image**  
    - *Type:* Form  
    - *Role:* Accepts user file upload (image).  
    - *Configuration:* Single file upload field labeled "Image".  
    - *Input/Output:* Outputs binary data of uploaded image.  
    - *Edge cases:* No file uploaded will cause failure downstream where binary data is required.  
    - *Sub-workflow:* None.

#### 2.2 Airtable Record Management

- **Overview:** Handles creation of a new Airtable record with the prompt, retrieves the record later, and updates status post-processing.
- **Nodes Involved:**  
  - Create a record  
  - Get a record  
  - Update record

- **Node Details:**

  - **Create a record**  
    - *Type:* Airtable node (create operation)  
    - *Role:* Creates a new row in Airtable with "Status" set to "Pending" and "Image Prompt" set to user’s idea prompt.  
    - *Configuration:* Uses user’s Airtable credentials, configured with base and table IDs for “Product Ads”.  
    - *Key expressions:* Sets Status="Pending", Image Prompt from `Idea Prompt`.  
    - *Input:* JSON from form trigger.  
    - *Output:* Airtable record JSON including record ID.  
    - *Edge cases:* Authentication failures, invalid base/table IDs, or missing credentials.  
    - *Sub-workflow:* None.

  - **Get a record**  
    - *Type:* Airtable node (get operation)  
    - *Role:* Fetches the newly created Airtable record by ID to retrieve latest data.  
    - *Configuration:* Uses same Airtable credentials and base/table as above.  
    - *Key expressions:* ID taken dynamically from output of "Create a record".  
    - *Input:* Airtable record ID from previous node.  
    - *Output:* Full Airtable record JSON.  
    - *Edge cases:* Record not found, permission errors.  
    - *Sub-workflow:* None.

  - **Update record**  
    - *Type:* Airtable node (update operation)  
    - *Role:* Updates the record’s "Status" field to "Done" after video generation is complete.  
    - *Configuration:* Matches record by "Id" field, sets Status="Done".  
    - *Key expressions:* Uses record ID from "Get a record".  
    - *Input:* Airtable record JSON and status update command.  
    - *Output:* Updated Airtable record confirmation.  
    - *Edge cases:* Write permission errors, record locking.  
    - *Sub-workflow:* None.

#### 2.3 Image Processing and Upload

- **Overview:** Converts the uploaded image binary file to a base64 JSON payload and uploads it to Airtable as an attachment.
- **Nodes Involved:**  
  - Converting Image file for Storing  
  - Uploading Image in Airtable

- **Node Details:**

  - **Converting Image file for Storing**  
    - *Type:* Code node (JavaScript)  
    - *Role:* Extracts binary image data, converts it to base64, and prepares JSON object for Airtable attachment upload.  
    - *Key expressions:* Dynamically finds first binary key, encodes data to base64, builds payload with contentType, file, filename.  
    - *Input:* Binary data from "Upload Image".  
    - *Output:* JSON with base64 file and metadata.  
    - *Edge cases:* No binary data found, unsupported file types.  
    - *Sub-workflow:* None.

  - **Uploading Image in Airtable**  
    - *Type:* HTTP Request node  
    - *Role:* Sends POST request to Airtable’s attachment upload endpoint to attach the image file to the previously created record.  
    - *Configuration:* URL constructed from Airtable base ID and record ID, with authentication header using Airtable personal access token.  
    - *Key expressions:* Uses record ID from "Create a record", and base64 file from previous node.  
    - *Input:* JSON payload from code node.  
    - *Output:* Airtable upload response.  
    - *Edge cases:* Invalid URL or credentials, network failures, Airtable API limits.  
    - *Sub-workflow:* None.

#### 2.4 AI Image Analysis

- **Overview:** Uses Google Gemini AI to analyze the uploaded image and the user’s prompt, generating a detailed creative brief to guide video generation.
- **Nodes Involved:**  
  - Analyze image

- **Node Details:**

  - **Analyze image**  
    - *Type:* Google Gemini AI node (LangChain integration)  
    - *Role:* Sends the image URL and user prompt to Google Gemini model for detailed textual analysis and creative brief generation.  
    - *Configuration:* Uses "models/gemini-2.5-flash" model, with a detailed prompt template instructing the AI to analyze image aspects and produce a structured video brief.  
    - *Key expressions:* Injects user prompt from Airtable field "Image Prompt" and the image URL from Airtable attachment.  
    - *Input:* Airtable record JSON with image URL and prompt.  
    - *Output:* Plain text AI analysis and video brief.  
    - *Edge cases:* API quota exceeded, malformed image URLs, credential errors.  
    - *Sub-workflow:* None.

#### 2.5 Video Generation Preparation

- **Overview:** Parses Gemini AI’s textual output to extract the video generation prompt and assembles the JSON request body for Google Veo 3 API.
- **Nodes Involved:**  
  - Parse Request

- **Node Details:**

  - **Parse Request**  
    - *Type:* Code (JavaScript) node  
    - *Role:* Extracts the first part of AI content text and builds the structured JSON request with video generation parameters (aspect ratio, duration, resolution, etc.) for Veo 3.  
    - *Key expressions:* Constructs JSON with fixed parameters and prompt text from AI analysis.  
    - *Input:* AI text output from "Analyze image".  
    - *Output:* JSON object under `veoRequestBody` key.  
    - *Edge cases:* Missing or malformed AI output text.  
    - *Sub-workflow:* None.

#### 2.6 Video Generation and Retrieval

- **Overview:** Sends the video generation request to Google Veo 3 long-running API, waits for processing, then fetches the generated video.
- **Nodes Involved:**  
  - Generate Video Veo 3  
  - Wait  
  - Get the Video

- **Node Details:**

  - **Generate Video Veo 3**  
    - *Type:* HTTP Request node  
    - *Role:* Calls Google AI Platform Veo 3 model endpoint with the prepared JSON to start video generation asynchronously.  
    - *Configuration:* Uses Google OAuth2 credentials, URL includes project and location placeholders.  
    - *Key expressions:* Sends JSON from "Parse Request".  
    - *Input:* JSON request body.  
    - *Output:* Operation name for tracking generation status.  
    - *Edge cases:* Authentication failures, API rate limits, invalid request format.  
    - *Sub-workflow:* None.

  - **Wait**  
    - *Type:* Wait node  
    - *Role:* Pauses workflow for 1 minute to allow video generation to complete.  
    - *Configuration:* Wait time set to 1 minute.  
    - *Edge cases:* Insufficient wait time may cause retrieval failures if video is not ready.  
    - *Sub-workflow:* None.

  - **Get the Video**  
    - *Type:* HTTP Request node  
    - *Role:* Fetches the generated video using the operation name received from the previous node.  
    - *Configuration:* Uses Google OAuth2 credentials, POST body includes operation name.  
    - *Input:* Operation name from "Generate Video Veo 3".  
    - *Output:* Video data in base64 encoded bytes.  
    - *Edge cases:* Operation not completed, expired operation name, API errors.  
    - *Sub-workflow:* None.

#### 2.7 Finalization

- **Overview:** Converts the retrieved video data into a binary file for download and updates Airtable record status to "Done".
- **Nodes Involved:**  
  - Downloadable Video  
  - Update record

- **Node Details:**

  - **Downloadable Video**  
    - *Type:* Convert to File node  
    - *Role:* Converts base64 encoded video bytes into binary data with downloadable file properties.  
    - *Configuration:* Source property points to `response.videos[0].bytesBase64Encoded`.  
    - *Input:* HTTP response from "Get the Video".  
    - *Output:* Binary file ready for download or further use.  
    - *Edge cases:* Missing or malformed video data.  
    - *Sub-workflow:* None.

  - **Update record** (see 2.2)  
    - *Role:* Marks the Airtable record as “Done” indicating processing completion.  
    - *Input:* Record ID and status update.  
    - *Output:* Updated Airtable record confirmation.

---

### 3. Summary Table

| Node Name                  | Node Type                 | Functional Role                         | Input Node(s)                 | Output Node(s)               | Sticky Note                                                                                                          |
|----------------------------|---------------------------|---------------------------------------|------------------------------|-----------------------------|----------------------------------------------------------------------------------------------------------------------|
| Prompt your Idea           | Form Trigger              | Collect creative prompt text          | —                            | Create a record              |                                                                                                                      |
| Upload Image               | Form                      | Collect user image upload              | Create a record               | Converting Image file for Storing |                                                                                                                      |
| Create a record            | Airtable (create)         | Create Airtable record with prompt and Pending status | Prompt your Idea             | Upload Image                 | * Update Airtable credentials, Base ID, Table ID in this and related Airtable nodes                                  |
| Converting Image file for Storing | Code                      | Convert uploaded image to base64 JSON | Upload Image                 | Uploading Image in Airtable  |                                                                                                                      |
| Uploading Image in Airtable | HTTP Request              | Upload image attachment to Airtable   | Converting Image file for Storing | Get a record                | * Airtable Base ID and record ID must be set properly in URL                                                        |
| Get a record               | Airtable (get)            | Retrieve updated record from Airtable | Uploading Image in Airtable  | Analyze image               | * Airtable credentials and IDs must be consistent                                                                    |
| Analyze image              | Google Gemini AI          | Analyze image and generate creative brief | Get a record               | Parse Request               | * Google Gemini API credentials required                                                                             |
| Parse Request              | Code                      | Build video generation request payload | Analyze image               | Generate Video Veo 3        | * Video parameters customizable here                                                                                 |
| Generate Video Veo 3       | HTTP Request              | Start Veo 3 video generation           | Parse Request               | Wait                        | * Google OAuth2 credentials and project info must be configured                                                      |
| Wait                      | Wait                      | Delay for video generation             | Generate Video Veo 3         | Update record               |                                                                                                                      |
| Update record              | Airtable (update)         | Mark record as Done                     | Wait                        | Get the Video               | * Airtable credentials and IDs consistent                                                                             |
| Get the Video              | HTTP Request              | Retrieve generated video                | Update record               | Downloadable Video          | * Google OAuth2 credentials required                                                                                 |
| Downloadable Video         | Convert to File           | Convert base64 video data to binary file | Get the Video              | —                           |                                                                                                                      |
| Sticky Note                | Sticky Note               | Airtable configuration instructions    | —                            | —                           | * See notes for Airtable setup details                                                                               |
| Sticky Note1               | Sticky Note               | Google AI and Veo API configuration    | —                            | —                           | * See notes for Google API setup and links                                                                           |
| Sticky Note2               | Sticky Note               | Video generation parameters customization | —                          | —                           | * Instructions on video parameter customization                                                                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Form Trigger Node "Prompt your Idea":**  
   - Type: Form Trigger  
   - Setup one required text field labeled "Idea Prompt".  
   - This node starts the workflow when a user submits a prompt.

2. **Create Form Node "Upload Image":**  
   - Type: Form  
   - Setup one file upload field labeled "Image".  
   - Connect "Prompt your Idea" main output to this node’s input.

3. **Create Airtable Node "Create a record":**  
   - Type: Airtable (Create)  
   - Credentials: Select your Airtable personal access token credential.  
   - Base: Set your Airtable Base ID.  
   - Table: Set your Airtable Table ID (e.g., "Product Ads").  
   - Fields: Set "Status" to "Pending", "Image Prompt" to `={{ $json["Idea Prompt"] }}`.  
   - Connect "Prompt your Idea" main output to this node.

4. **Create Code Node "Converting Image file for Storing":**  
   - Type: Code (JavaScript)  
   - Paste the provided JavaScript to find the binary image key, convert to base64, and build JSON payload.  
   - Connect "Upload Image" main output to this node.

5. **Create HTTP Request Node "Uploading Image in Airtable":**  
   - Type: HTTP Request (POST)  
   - URL: `https://content.airtable.com/v0/Your_Airtable_Base_ID/{{ $('Create a record').item.json.id }}/[Your_Column_Name]/uploadAttachment` (replace placeholders).  
   - Headers: Authorization Bearer with Airtable personal access token; Content-Type application/json.  
   - Body: JSON with contentType, file (base64), filename from previous node output.  
   - Connect "Converting Image file for Storing" main output to this node.

6. **Create Airtable Node "Get a record":**  
   - Type: Airtable (Get)  
   - Credentials: Same Airtable credentials.  
   - Base/Table: Same as above.  
   - Record ID: `={{ $json.id }}` from "Uploading Image in Airtable".  
   - Connect "Uploading Image in Airtable" main output to this node.

7. **Create Google Gemini AI Node "Analyze image":**  
   - Type: Google Gemini (LangChain)  
   - Credentials: Google Gemini API credentials.  
   - Model: Select "models/gemini-2.5-flash".  
   - Parameters: Insert the detailed prompt text, injecting user prompt and image URL dynamically from Airtable record.  
   - Connect "Get a record" main output to this node.

8. **Create Code Node "Parse Request":**  
   - Type: Code (JavaScript)  
   - Extract the AI response text and build the Veo 3 API request JSON with desired video parameters (aspect ratio, duration, resolution, etc.).  
   - Connect "Analyze image" main output to this node.

9. **Create HTTP Request Node "Generate Video Veo 3":**  
   - Type: HTTP Request (POST)  
   - URL: Google AI Platform Veo 3 endpoint with your project and location.  
   - Authentication: Google OAuth2 credentials.  
   - Headers: Authorization Bearer with Google token.  
   - Body: JSON from "Parse Request" output under `veoRequestBody`.  
   - Connect "Parse Request" main output to this node.

10. **Create Wait Node "Wait":**  
    - Type: Wait  
    - Set to 1 minute delay.  
    - Connect "Generate Video Veo 3" main output to this node.

11. **Create Airtable Node "Update record":**  
    - Type: Airtable (Update)  
    - Credentials: Airtable personal access token.  
    - Base/Table: Same as before.  
    - Mapping: Match record by ID from "Get a record", set "Status" = "Done".  
    - Connect "Wait" main output to this node.

12. **Create HTTP Request Node "Get the Video":**  
    - Type: HTTP Request (POST)  
    - URL: Google AI Platform fetch operation endpoint.  
    - Authentication: Google OAuth2.  
    - Body: Include operationName from "Generate Video Veo 3" node output.  
    - Connect "Update record" main output to this node.

13. **Create Convert to File Node "Downloadable Video":**  
    - Type: Convert to File  
    - Operation: toBinary  
    - Source Property: `response.videos[0].bytesBase64Encoded`  
    - Connect "Get the Video" main output to this node.

14. **Add Sticky Notes:**  
    - Add notes for Airtable credential setup, Google API configuration, and video parameters customization.

15. **Test the workflow end-to-end:**  
    - Submit form with prompt and image.  
    - Verify Airtable record creation and update.  
    - Confirm AI analysis output and video generation.  
    - Check downloadable video output.

---

### 5. General Notes & Resources

| Note Content                                                                                                             | Context or Link                                                                                               |
|--------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| Airtable credentials and IDs must be configured in all Airtable nodes (“Create a record”, “Get a record”, “Update record”, and image upload URL). | Sticky Note on Airtable Configuration                                                                        |
| Google Gemini API credentials are required for the image analysis node.                                                   | Sticky Note1 on Google AI Configuration                                                                      |
| Google OAuth2 credentials and project/location IDs must be correctly set in HTTP request nodes to Google Vertex AI APIs. | Sticky Note1 on Google AI Configuration; see [Google Cloud Vertex AI Studio](https://console.cloud.google.com/vertex-ai/studio/media/generate) |
| Video generation parameters such as aspect ratio, duration, and resolution can be customized in the "Parse Request" code node. | Sticky Note2 on Customization                                                                                 |

---

**Disclaimer:** The provided text derives exclusively from an automated n8n workflow configuration. This process strictly complies with content policies and contains no illegal, offensive, or protected elements. All data processed is legal and public.

---