Automate Image Validation Tasks using AI Vision

https://n8nworkflows.xyz/workflows/automate-image-validation-tasks-using-ai-vision-2420


# Automate Image Validation Tasks using AI Vision

### 1. Workflow Overview

This workflow automates the task of validating portrait images to determine if they meet the UK government’s official passport photo criteria. It is designed to scale image validation, which is often difficult to automate with traditional code and impractical to do manually at scale.

**Target Use Cases:**  
- Verifying user-submitted photos against strict guidelines (e.g., passport photos, document scans).  
- Automating quality control for image uploads on websites or apps.  
- Adapting to other image validation scenarios such as product images, ID verification, or security footage analysis.

**Logical Blocks:**

- **1.1 Input Reception and Image Acquisition**  
  Import a predefined list of portrait image URLs, split the list into individual items, and download each image from Google Drive.

- **1.2 Image Preprocessing**  
  Resize each downloaded image to a maximum dimension (1024x1024 pixels) to balance resolution and processing speed for AI analysis.

- **1.3 AI Vision Validation**  
  Pass each resized image to a multimodal Large Language Model (LLM) using a prompt based on UK passport photo requirements and parse the structured JSON response indicating validity and detailed reasons.

- **1.4 Structured Output Parsing**  
  Apply a schema-driven output parser to convert the AI’s raw response into a structured JSON object with key properties for downstream use.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Image Acquisition

- **Overview:**  
  This block initializes the workflow by manually triggering it, sets the list of portrait URLs, splits the list into individual entries, and downloads each image from Google Drive.

- **Nodes Involved:**  
  - When clicking ‘Test workflow’ (Manual Trigger)  
  - Photo URLs (Set)  
  - Photos To List (SplitOut)  
  - Download Photos (Google Drive)

- **Node Details:**

  - **When clicking ‘Test workflow’**  
    - Type: Manual Trigger  
    - Role: Entry point of the workflow, starts execution on manual test trigger  
    - Config: Default, no parameters  
    - Input: None  
    - Output: Triggers next node (Photo URLs)  
    - Edge Cases: None typical; workflow won’t run without manual trigger

  - **Photo URLs**  
    - Type: Set  
    - Role: Defines an array of 5 portrait image objects, each with a name and Google Drive URL  
    - Config: Assigns `data` field as an array of objects containing `name` and `url` attributes  
    - Input: Trigger from manual node  
    - Output: Passes dataset to next node (Photos To List)  
    - Edge Cases: URLs must be valid and accessible; invalid URLs or permissions will cause failures downstream

  - **Photos To List**  
    - Type: SplitOut  
    - Role: Splits the array of portrait objects into individual items for sequential processing  
    - Config: Splits on the `data` field set by the previous node  
    - Input: Receives array of portraits  
    - Output: Produces one portrait object at a time to next node (Download Photos)  
    - Edge Cases: Empty array will cause no further processing; malformed data could cause failure

  - **Download Photos**  
    - Type: Google Drive  
    - Role: Downloads the image file from Google Drive using the URL from the current item  
    - Config: Uses `fileId` mode set to URL extraction from `{{$json.url}}`  
    - Credentials: Requires Google Drive OAuth2 account credentials  
    - Input: Receives single portrait data object  
    - Output: Downloads image binary data passed to next node (Resize For AI)  
    - Edge Cases: Authentication errors, file permissions, incorrect URLs, or network issues may cause download failure

---

#### 2.2 Image Preprocessing

- **Overview:**  
  Resizes each downloaded image to a maximum size of 1024x1024 pixels only if the image is larger, optimizing the balance between image quality and processing speed for AI.

- **Nodes Involved:**  
  - Resize For AI (Edit Image)

- **Node Details:**

  - **Resize For AI**  
    - Type: Edit Image  
    - Role: Resizes image dimensions to a max of 1024x1024 pixels if larger  
    - Config: Operation is "resize" with option “onlyIfLarger” enabled, width and height set to 1024  
    - Input: Receives downloaded image binary from Download Photos  
    - Output: Passes resized image binary to Passport Photo Validator  
    - Edge Cases: Very small images remain unchanged; corrupted images or unsupported formats may cause errors

---

#### 2.3 AI Vision Validation

- **Overview:**  
  Sends each resized image along with a detailed prompt containing UK passport photo rules to the multimodal LLM (Google Gemini) for evaluation. The LLM returns a structured assessment of photo validity.

- **Nodes Involved:**  
  - Passport Photo Validator (Chain LLM)  
  - Google Gemini Chat Model (Language Model)

- **Node Details:**

  - **Passport Photo Validator**  
    - Type: Chain LLM (LangChain)  
    - Role: Constructs a prompt combining instructions for the AI to verify passport photo validity and the image itself  
    - Config:  
      - Prompt text includes official UK government guidelines for passport photos  
      - Defines messages: a human message with detailed rules and an image binary input message  
      - The node references the Structured Output Parser to parse responses  
      - Output parser enabled for structured JSON output  
    - Input: Receives resized image binary from Resize For AI  
    - Output: Passes formatted prompt and image to Google Gemini Chat Model; outputs parsed validation results  
    - Edge Cases: LLM API errors, timeout, unexpected or malformed AI responses, prompt length limits, image format issues  
    - Version: Requires LangChain integration (version 1.4 used here)

  - **Google Gemini Chat Model**  
    - Type: Language Model (Google Gemini)  
    - Role: Processes the multimodal prompt including the image and textual instructions, returning the AI’s response  
    - Config: Model name set to "models/gemini-1.5-pro-latest"  
    - Credentials: Requires Google Palm API key for Gemini access  
    - Input: Receives prompt and image from Passport Photo Validator node  
    - Output: Provides LLM response to the structured output parser within Passport Photo Validator  
    - Edge Cases: API key invalid, quota exceeded, network errors, model unavailability

---

#### 2.4 Structured Output Parsing

- **Overview:**  
  Applies a JSON schema to parse the AI’s text response into a structured object with clear fields such as `is_valid` (boolean), `photo_description` (string), and `reasons` (array of strings).

- **Nodes Involved:**  
  - Structured Output Parser

- **Node Details:**

  - **Structured Output Parser**  
    - Type: LangChain Structured Output Parser  
    - Role: Converts free-text AI responses into a JSON object matching the specified schema  
    - Config:  
      - Schema defines three properties:  
        - `is_valid` (boolean): overall validity of photo  
        - `photo_description` (string): detailed description of the photo content and background  
        - `reasons` (array of strings): reasons justifying the validity decision  
    - Input: Receives raw text response from Google Gemini model via Passport Photo Validator  
    - Output: Sends parsed JSON object back to Passport Photo Validator node  
    - Edge Cases: Parsing errors if AI output deviates significantly from expected format, schema mismatches

---

### 3. Summary Table

| Node Name               | Node Type                                | Functional Role                                     | Input Node(s)                | Output Node(s)                 | Sticky Note                                                                                                         |
|-------------------------|-----------------------------------------|----------------------------------------------------|------------------------------|-------------------------------|---------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’ | Manual Trigger                         | Entry point, starts workflow manually              | None                         | Photo URLs                    | ## Try It Out!<br> This workflow takes a portrait and verifies if it makes for a valid passport photo. <br> OpenAI's vision model recommended. <br> Join the Discord or Forum for help. |
| Photo URLs              | Set                                     | Defines array of portrait image URLs                | When clicking ‘Test workflow’ | Photos To List                | ## 1. Import Photos To Validate<br> Using Google Drive to import 5 portraits. Can swap sources or use webhooks. <br> https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googledrive |
| Photos To List          | SplitOut                               | Splits array of portraits into individual items    | Photo URLs                   | Download Photos              | ## 1. Import Photos To Validate<br> See above.                                                                        |
| Download Photos         | Google Drive                           | Downloads each portrait image from Google Drive    | Photos To List               | Resize For AI                | ## 1. Import Photos To Validate<br> See above.                                                                        |
| Resize For AI           | Edit Image                            | Resizes images to max 1024x1024 if larger           | Download Photos              | Passport Photo Validator     | ## 2. Verify Passport Photo Validity Using AI Vision Model<br> Using AI to validate photos as per UK gov guidelines. <br> https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.chainllm |
| Passport Photo Validator | Chain LLM (LangChain)                  | Prompts AI with image and criteria, validates photo | Resize For AI                | (Uses Google Gemini Chat Model and Structured Output Parser internally) | ## 2. Verify Passport Photo Validity Using AI Vision Model<br> See above.                                             |
| Google Gemini Chat Model | Language Model (Google Gemini)          | Executes the multimodal LLM prompt                   | Passport Photo Validator (ai_languageModel) | Passport Photo Validator (ai_outputParser) | ## 2. Verify Passport Photo Validity Using AI Vision Model<br> See above.                                             |
| Structured Output Parser | LangChain Structured Output Parser    | Parses AI response into structured JSON             | Google Gemini Chat Model (ai_outputParser) | Passport Photo Validator (ai_outputParser) | ## 2. Verify Passport Photo Validity Using AI Vision Model<br> See above.                                             |
| Sticky Note             | Sticky Note                           | Documentation note                                  | None                         | None                         | ## 1. Import Photos To Validate<br> https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googledrive         |
| Sticky Note1            | Sticky Note                           | Documentation note                                  | None                         | None                         | ## 2. Verify Passport Photo Validity Using AI Vision Model<br> https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.chainllm |
| Sticky Note2            | Sticky Note                           | Documentation note                                  | None                         | None                         | ## Try It Out!<br> OpenAI's vision model recommended.<br> Join Discord or Forum for assistance.                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger node:**  
   - Name: `When clicking ‘Test workflow’`  
   - Purpose: To manually start the workflow.

2. **Create a Set node:**  
   - Name: `Photo URLs`  
   - Configure to assign a new field `data` as an array of objects, each with:  
     - `name` (string): e.g., "portrait_1"  
     - `url` (string): Google Drive shared URL of the image  
   - Paste the following data array (replace URLs as needed):  
     ```json
     [
       {"name": "portrait_1", "url": "https://drive.google.com/file/d/1zs963iFkO-3g2rKak8Hcy555h55D8gjF/view?usp=sharing"},
       {"name": "portrait_2", "url": "https://drive.google.com/file/d/19FyDcs68dZauQSEf6SEulJMag51SPsFy/view?usp=sharing"},
       {"name": "portrait_3", "url": "https://drive.google.com/file/d/1gbXjfNYE7Tvuw_riFmHMKoqPPu696VfW/view?usp=sharing"},
       {"name": "portrait_4", "url": "https://drive.google.com/file/d/1s19hYdxgfMkrnU25l6YIDq-myQr1tQMa/view?usp=sharing"},
       {"name": "portrait_5", "url": "https://drive.google.com/file/d/193FqIXJWAKj6O2SmOj3cLBfypHBkgdI5/view?usp=sharing"}
     ]
     ```

3. **Create a SplitOut node:**  
   - Name: `Photos To List`  
   - Configure to split on the `data` field from the `Photo URLs` node.

4. **Create a Google Drive node:**  
   - Name: `Download Photos`  
   - Operation: `Download`  
   - File ID: Use expression mode to extract file id from URL, e.g., `{{$json.url}}` as URL mode.  
   - Credentials: Set up Google Drive OAuth2 API credentials with access to the files.  
   - Connect input from `Photos To List`.

5. **Create an Edit Image node:**  
   - Name: `Resize For AI`  
   - Operation: `Resize`  
   - Width: 1024  
   - Height: 1024  
   - Resize Option: `onlyIfLarger` (resize only if the image exceeds these dimensions)  
   - Input: Connect from `Download Photos`.

6. **Create a Chain LLM node (LangChain):**  
   - Name: `Passport Photo Validator`  
   - Prompt Type: `define`  
   - Text: Summary prompt asking the LLM to assess image validity according to UK passport photo rules. Include full official guidelines text as user message.  
   - Messages:  
     - A HumanMessagePromptTemplate containing the detailed UK government passport photo rules.  
     - An imageBinary type message to pass the resized image.  
   - Enable Output Parser with a structured JSON schema:  
     ```json
     {
       "type": "object",
       "properties": {
         "is_valid": { "type": "boolean" },
         "photo_description": {
           "type": "string",
           "description": "describe the appearance of the person(s), object(s) if any and the background in the image. Mention any colours of each if possible."
         },
         "reasons": {
           "type": "array",
           "items": { "type": "string" }
         }
       }
     }
     ```
   - Input: Connect from `Resize For AI`.

7. **Create a Google Gemini Chat Model node:**  
   - Name: `Google Gemini Chat Model`  
   - Model Name: `models/gemini-1.5-pro-latest`  
   - Credentials: Configure Google Palm API key for Gemini access.  
   - Connect as the AI language model for `Passport Photo Validator`.

8. **Create a Structured Output Parser node:**  
   - Name: `Structured Output Parser`  
   - Schema Type: `manual`  
   - Input Schema: Use the same JSON schema as defined in the Chain LLM node.  
   - Connect as the AI output parser for `Passport Photo Validator`.

9. **Connect the nodes:**  
   - `When clicking ‘Test workflow’` → `Photo URLs` → `Photos To List` → `Download Photos` → `Resize For AI` → `Passport Photo Validator`  
   - `Passport Photo Validator` connects internally to `Google Gemini Chat Model` (ai_languageModel) and `Structured Output Parser` (ai_outputParser).

10. **Validate and test workflow:**  
    - Ensure Google Drive credentials have proper permissions.  
    - Ensure Google Gemini API key is valid and has quota.  
    - Test the workflow to confirm images are downloaded, resized, sent to the AI, and responses parsed correctly.

---

### 5. General Notes & Resources

| Note Content                                                                                           | Context or Link                                                |
|------------------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| This workflow uses official UK passport photo guidelines to validate images via AI vision models.    | https://www.gov.uk/photos-for-passports                        |
| Google Gemini API key and Google Drive OAuth2 credentials are required for full functionality.       | n8n integrations: Google Drive node and Google Gemini LLM node |
| The workflow is adaptable to other AI vision models such as OpenAI GPT-4o or Anthropic Claude Sonnet.| Customization section in description                            |
| For help and community support, join the n8n Discord or Forum.                                       | Discord: https://discord.com/invite/XPKeKXeB7d <br> Forum: https://community.n8n.io/ |

---

This document fully describes the workflow structure, node configurations, expected data flow, and requirements to reproduce or extend the workflow for automated AI-based image validation.