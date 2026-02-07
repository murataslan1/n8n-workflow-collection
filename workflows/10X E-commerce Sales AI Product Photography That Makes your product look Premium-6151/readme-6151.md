10X E-commerce Sales AI Product Photography That Makes your product look Premium

https://n8nworkflows.xyz/workflows/10x-e-commerce-sales-ai-product-photography-that-makes-your-product-look-premium-6151


# 10X E-commerce Sales AI Product Photography That Makes your product look Premium

---
### 1. Workflow Overview

This n8n workflow automates enhancing e-commerce product images by generating premium-quality, professional backgrounds using AI-powered services. The main target use case is online retailers or marketers who want to upgrade their product photography to look more polished and appealing without manual graphic design work.

The workflow consists of the following logical blocks:

- **1.1 Image Retrieval:** Fetch product images stored in a specified Google Drive folder, filtered by PNG format.
- **1.2 Image Download:** Download the actual binary image files from Google Drive for processing.
- **1.3 AI Prompt Generation (Optional):** Use a vision-capable AI model to analyze each product image and generate a customized prompt describing an ideal photographic background.
- **1.4 Background Generation:** Call the Pixelcut.ai API to create a new background based on either a default or AI-generated prompt, combining it with the product image.
- **1.5 Save Enhanced Images:** Upload the newly generated images back to a designated Google Drive folder.
- **1.6 Configuration & Guidance Notes:** Several sticky notes provide instructions on setup, API keys, file format constraints, background removal prerequisites, and best practices.

---

### 2. Block-by-Block Analysis

#### 2.1 Image Retrieval

- **Overview:**  
  This block fetches the list of product images from a specified Google Drive folder, filtering only PNG files.
  
- **Nodes Involved:**  
  - Get Images from Google Drive

- **Node Details:**

  - **Get Images from Google Drive**  
    - Type: Google Drive node (fileFolder resource)  
    - Role: Lists all files in a given Drive folder filtered by PNG extension.  
    - Configuration:  
      - Folder ID must be set to the user’s product images folder (`YOUR_GOOGLE_DRIVE_FOLDER_ID`).  
      - `returnAll` is true to fetch all matching files.  
      - Query string filters files with `.png` extension only.  
    - Inputs: None (starting point).  
    - Outputs: List of file metadata objects.  
    - Edge Cases:  
      - Folder ID misconfiguration leads to empty or error response.  
      - Files not matching `.png` are ignored.  
      - Permissions errors if OAuth2 credentials lack folder access.  

---

#### 2.2 Image Download

- **Overview:**  
  Downloads the binary content of each product image file fetched in the previous step for further processing.

- **Nodes Involved:**  
  - Download Binary Image Files2

- **Node Details:**

  - **Download Binary Image Files2**  
    - Type: Google Drive node (download operation)  
    - Role: Downloads the actual image content using the file ID from the previous node.  
    - Configuration:  
      - Takes file ID dynamically from previous node’s output (`={{ $json.id }}`).  
      - Downloads file content as binary under property `imageData`.  
    - Inputs: Output from Get Images from Google Drive.  
    - Outputs: Binary image data attached to each item.  
    - Edge Cases:  
      - File ID errors if previous step returns invalid IDs.  
      - Download failures due to permission or network issues.  

---

#### 2.3 AI Prompt Generation (Optional)

- **Overview:**  
  Optionally analyzes product images with a vision-capable AI to generate a professional background prompt describing style, lighting, and environment for commercial photography.

- **Nodes Involved:**  
  - AI Prompt Generator (Optional)  
  - OpenAI Chat Model (supporting AI model)

- **Node Details:**

  - **AI Prompt Generator (Optional)**  
    - Type: LangChain Agent node (AI language model with vision support)  
    - Role: Generates a descriptive prompt based on the product image analysis.  
    - Configuration:  
      - Instruction text prompts the AI to focus on style, lighting, environment for a commercial photo background.  
      - Marked as optional; workflow can run without it.  
    - Inputs: Receives AI model output from OpenAI Chat Model and binary image from Download Binary Image Files2 in parallel.  
    - Outputs: Text prompt for background generation.  
    - Edge Cases:  
      - Requires AI model with vision capabilities (e.g., GPT-4 Vision or Claude Vision).  
      - If AI service is unavailable or times out, fallback to manual prompt.  
      - Expression or API errors possible with complex prompt or large images.  
    - Sub-workflow: None.

  - **OpenAI Chat Model**  
    - Type: LangChain OpenAI Chat model node  
    - Role: Provides the AI language model backend for prompt generation.  
    - Configuration:  
      - Uses GPT-4.1-mini model variant.  
    - Inputs: None (starting node for AI prompts).  
    - Outputs: AI text response used by AI Prompt Generator.  
    - Edge Cases:  
      - API key or quota issues.  
      - Model-specific rate limits or latency.  

---

#### 2.4 Background Generation

- **Overview:**  
  Generates a new background image for the product image by sending the binary image and prompt to the Pixelcut.ai background generation API.

- **Nodes Involved:**  
  - Pixelcut Background Generator

- **Node Details:**

  - **Pixelcut Background Generator**  
    - Type: HTTP Request node  
    - Role: Calls Pixelcut.ai API to generate a professional background based on provided image and prompt.  
    - Configuration:  
      - POST request to `https://api.developer.pixelcut.ai/v1/generate-background`.  
      - Content-Type: multipart/form-data with binary image and prompt parameters.  
      - Default prompt: “Professional studio background with soft lighting, clean surfaces, and elegant atmosphere.”  
      - API key passed in `X-API-KEY` header (`YOUR_PIXELCUT_API_KEY` placeholder).  
      - Timeout set to 60 seconds.  
    - Inputs: Binary image from Download Binary Image Files2 and prompt from AI Prompt Generator (optional).  
    - Outputs: Enhanced image data in response.  
    - Edge Cases:  
      - API key invalid or missing leads to authorization errors.  
      - Timeout or network errors if API is slow or unreachable.  
      - Payload size limits with large images.  
      - Prompt text empty or invalid may produce poor results.  

---

#### 2.5 Save Enhanced Images

- **Overview:**  
  Saves the enhanced images with new backgrounds back to a specified Google Drive output folder.

- **Nodes Involved:**  
  - Save Enhanced Image

- **Node Details:**

  - **Save Enhanced Image**  
    - Type: Google Drive node (file creation)  
    - Role: Uploads the newly generated image to Google Drive, renaming it with prefix “enhanced-” plus original file name.  
    - Configuration:  
      - Target folder ID: `YOUR_OUTPUT_FOLDER_ID`.  
      - Drive ID: defaults to “My Drive”.  
      - Dynamic naming using original file name from “Get Images from Google Drive” node.  
    - Inputs: Output from Pixelcut Background Generator.  
    - Outputs: Confirmation metadata of the upload.  
    - Edge Cases:  
      - Folder ID misconfiguration leads to upload errors.  
      - Permission errors if OAuth2 credentials lack write access.  
      - Naming conflicts may overwrite files unless versioning handled externally.  

---

#### 2.6 Configuration & Guidance Notes

- **Overview:**  
  Sticky notes providing important instructions, warnings, and setup guidance for users.

- **Nodes Involved:**  
  - AI Agent Instructions  
  - Pixelcut Configuration Guide  
  - File Format Configuration  
  - Background Requirements  
  - Setup Checklist

- **Node Details:**

  - **AI Agent Instructions**  
    - Purpose: Explains optional AI prompt generation usage, recommended AI models, and alternatives.  
    - Key points: Vision-capable models recommended, manual prompt fallback.  
  - **Pixelcut Configuration Guide**  
    - Purpose: How to obtain API key, adjust prompts, and supported image formats.  
    - Notes on PNG, JPG, WEBP formats.  
  - **File Format Configuration**  
    - Purpose: Warns workflow currently processes PNG only; instructions to support other formats by adjusting filter and Pixelcut parameters.  
  - **Background Requirements**  
    - Purpose: Warns product images must have transparent/no background; suggests adding background removal before workflow if needed.  
  - **Setup Checklist**  
    - Purpose: Summarizes required credentials, folder IDs, permissions, security best practices, and testing steps.  

---

### 3. Summary Table

| Node Name                    | Node Type                       | Functional Role                  | Input Node(s)                | Output Node(s)                | Sticky Note                                                                                                              |
|------------------------------|--------------------------------|---------------------------------|------------------------------|------------------------------|--------------------------------------------------------------------------------------------------------------------------|
| Get Images from Google Drive  | Google Drive (fileFolder list) | Retrieve product image metadata  | None                         | Download Binary Image Files2  | Background Requirements, File Format Configuration, Setup Checklist                                                      |
| Download Binary Image Files2  | Google Drive (download)         | Download binary image data       | Get Images from Google Drive  | Pixelcut Background Generator, AI Prompt Generator (Optional) | Background Requirements, File Format Configuration, Setup Checklist                                                      |
| AI Prompt Generator (Optional)| LangChain Agent (AI prompt)    | Generate AI background prompt    | OpenAI Chat Model, Download Binary Image Files2 | Pixelcut Background Generator | AI Agent Instructions                                                                                                    |
| OpenAI Chat Model             | LangChain OpenAI Chat Model    | Provide AI language model        | None                         | AI Prompt Generator (Optional) | AI Agent Instructions                                                                                                    |
| Pixelcut Background Generator | HTTP Request                   | Generate enhanced background     | Download Binary Image Files2, AI Prompt Generator (Optional) | Save Enhanced Image           | Pixelcut Configuration Guide, Setup Checklist                                                                            |
| Save Enhanced Image           | Google Drive (file upload)      | Save enhanced images             | Pixelcut Background Generator| None                         | Setup Checklist                                                                                                          |
| AI Agent Instructions        | Sticky Note                    | Guidance on AI prompt usage      | None                         | None                         |                                                                                                                          |
| Pixelcut Configuration Guide | Sticky Note                    | Guidance on Pixelcut API setup   | None                         | None                         |                                                                                                                          |
| File Format Configuration    | Sticky Note                    | Format limitations and options   | None                         | None                         |                                                                                                                          |
| Background Requirements      | Sticky Note                    | Background removal prerequisites | None                         | None                         |                                                                                                                          |
| Setup Checklist              | Sticky Note                    | Setup and security checklist     | None                         | None                         |                                                                                                                          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Drive Node: "Get Images from Google Drive"**  
   - Type: Google Drive (fileFolder, list operation)  
   - Set Folder ID to your product images folder (replace `YOUR_GOOGLE_DRIVE_FOLDER_ID`).  
   - Set query string filter to `.png` to retrieve PNG files only.  
   - Enable `Return All` to true.

2. **Create Google Drive Node: "Download Binary Image Files2"**  
   - Type: Google Drive (download operation)  
   - Configure to download binary data of files using input file ID. Set file ID expression to `={{ $json.id }}` from previous node.  
   - Set binary property name to `imageData`.

3. **Create LangChain OpenAI Chat Model Node: "OpenAI Chat Model"**  
   - Select model: `gpt-4.1-mini` (or preferred GPT-4 vision capable model).  
   - No inputs required; this node will provide AI model responses.

4. **Create LangChain Agent Node: "AI Prompt Generator (Optional)"**  
   - Set prompt text:  
     "Analyze this product image and create a professional background prompt for commercial photography. Focus on style, lighting, and environment that would complement this product."  
   - Connect input from "OpenAI Chat Model" node’s AI language model output and from "Download Binary Image Files2" node’s binary data.  
   - Note: This node is optional; you may skip it and use a fixed prompt in the next step.

5. **Create HTTP Request Node: "Pixelcut Background Generator"**  
   - Method: POST  
   - URL: `https://api.developer.pixelcut.ai/v1/generate-background`  
   - Content-Type: multipart/form-data  
   - Body Parameters:  
     - `image` as binary data from "Download Binary Image Files2" (`imageData`).  
     - `prompt`: Use expression from "AI Prompt Generator (Optional)" output if available, else default to `"Professional studio background with soft lighting, clean surfaces, and elegant atmosphere"`.  
     - `format`: `"png"`.  
   - Headers: Add `X-API-KEY` with your Pixelcut API key (`YOUR_PIXELCUT_API_KEY`).  
   - Timeout: 60000 ms.

6. **Create Google Drive Node: "Save Enhanced Image"**  
   - Operation: Upload new file.  
   - Folder ID: Set to your output folder ID (`YOUR_OUTPUT_FOLDER_ID`).  
   - Name: Use expression `"enhanced-{{ $('Get Images from Google Drive').item.json.name }}"` to prepend "enhanced-" to the original file name.  
   - Drive ID: Default to "My Drive".  
   - Input binary data: From "Pixelcut Background Generator" response.

7. **Connect nodes in order:**  
   - "Get Images from Google Drive" → "Download Binary Image Files2" →  
   - Parallel branch from "Download Binary Image Files2" to "AI Prompt Generator (Optional)" (optional) and also directly to "Pixelcut Background Generator".  
   - "OpenAI Chat Model" → "AI Prompt Generator (Optional)".  
   - "AI Prompt Generator (Optional)" → "Pixelcut Background Generator".  
   - "Pixelcut Background Generator" → "Save Enhanced Image".

8. **Set up Credentials:**  
   - Google Drive OAuth2 credentials with access to both input and output folders.  
   - Pixelcut.ai API key in HTTP Request node header.  
   - OpenAI API key for LangChain OpenAI Chat Model node.

9. **Optional: Add Sticky Notes** to provide guidance about setup, file format constraints, background requirements, and AI prompt usage.

10. **Testing & Verification:**  
    - Test with a single PNG image to verify download, AI prompt generation, background creation, and upload.  
    - Check naming conventions and folder access permissions.  
    - Monitor API usage and error handling.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                 | Context or Link                                                                                      |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| This workflow expects images without backgrounds; use Pixelcut.ai or alternative services to remove backgrounds prior to running this workflow.                                                                                              | Background Requirements sticky note                                                                 |
| Pixelcut.ai API supports PNG, JPG, and WEBP formats; PNG recommended for quality and transparency. Adjust filter and format parameters accordingly.                                                                                            | Pixelcut Configuration Guide, File Format Configuration sticky notes                                |
| AI prompt generation is optional and requires vision-capable AI models like OpenAI GPT-4 Vision or Anthropic Claude Vision. You can disable this and use manual prompts for Pixelcut.                                                        | AI Agent Instructions sticky note                                                                   |
| Secure your API keys by using environment variables and avoid sharing publicly; rotate keys regularly and monitor usage to control costs.                                                                                                   | Setup Checklist sticky note                                                                         |
| For best results, test the workflow first with a few images to verify output quality, naming, and folder permissions before bulk processing.                                                                                                | Setup Checklist sticky note                                                                         |
| Pixelcut API documentation and registration: https://pixelcut.ai/developer                                                                                                                                                                  | Pixelcut Configuration Guide sticky note                                                           |

---

**Disclaimer:** The provided text is exclusively derived from an automated workflow created with n8n, adhering strictly to content policies without any illegal or protected elements. All processed data is legal and public.