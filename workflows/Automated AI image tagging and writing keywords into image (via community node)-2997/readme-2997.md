Automated AI image tagging and writing keywords into image (via community node)

https://n8nworkflows.xyz/workflows/automated-ai-image-tagging-and-writing-keywords-into-image--via-community-node--2997


# Automated AI image tagging and writing keywords into image (via community node)

### 1. Workflow Overview

This workflow automates the process of tagging images stored in a specific Google Drive folder by analyzing their content with AI and embedding descriptive keywords directly into the image metadata. It is designed for self-hosted n8n instances with the community node `n8n-nodes-exif-data` installed.

**Target Use Cases:**  
- Automatically enriching image files with AI-generated metadata keywords for improved searchability and organization.  
- Managing image metadata in Google Drive folders without manual intervention.  
- Integrating AI image content analysis into digital asset management workflows.

**Logical Blocks:**

- **1.1 Input Reception:** Detect new image files added to a designated Google Drive folder.  
- **1.2 Image Retrieval:** Download the newly added image file from Google Drive.  
- **1.3 AI Content Analysis:** Analyze the image content using an AI model to generate descriptive keywords.  
- **1.4 Data Preparation:** Merge the AI-generated metadata with the original image data.  
- **1.5 Metadata Writing:** Write the keywords into the image’s metadata fields (dc:subject and keywords) using the EXIF community node.  
- **1.6 Output Update:** Upload the updated image file back to Google Drive, replacing the original.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  Watches a specific Google Drive folder for newly added files, triggering the workflow when a new image is detected.

- **Nodes Involved:**  
  - Trigger: New file added to Google Drive Folder

- **Node Details:**  
  - **Trigger: New file added to Google Drive Folder**  
    - Type: Google Drive Trigger  
    - Role: Initiates workflow on new file creation event in a specified folder.  
    - Configuration:  
      - Event: `fileCreated`  
      - Polling interval: every minute  
      - Folder to watch: Folder ID `1WaIRWXcaeNViKmpW5IyQ3YGARWYdMg47` (named "EXIF")  
    - Credentials: Google Drive OAuth2  
    - Inputs: None (trigger node)  
    - Outputs: Passes file metadata including file ID and name  
    - Edge Cases:  
      - Folder permission errors  
      - Polling delays or missed events  
      - Non-image files triggering the workflow (no explicit filter)  
    - Version: 1

#### 1.2 Image Retrieval

- **Overview:**  
  Downloads the newly detected image file from Google Drive for further processing.

- **Nodes Involved:**  
  - Download Image File

- **Node Details:**  
  - **Download Image File**  
    - Type: Google Drive node  
    - Role: Downloads the file content using the file ID from the trigger node.  
    - Configuration:  
      - Operation: `download`  
      - File ID: dynamically set from trigger node’s output (`{{$json.id}}`)  
    - Credentials: Google Drive OAuth2  
    - Inputs: Trigger node output (file metadata)  
    - Outputs: Binary image data and metadata  
    - Edge Cases:  
      - File not found or deleted before download  
      - Permission errors  
      - Large file size causing timeouts  
    - Version: 3

#### 1.3 AI Content Analysis

- **Overview:**  
  Uses an AI model (OpenAI GPT-4o) to analyze the image content and generate a comma-separated list of descriptive keywords.

- **Nodes Involved:**  
  - Analyze Image Content

- **Node Details:**  
  - **Analyze Image Content**  
    - Type: LangChain OpenAI node  
    - Role: Performs AI-based image content analysis.  
    - Configuration:  
      - Resource: `image`  
      - Operation: `analyze`  
      - Input Type: `base64` (expects image data in base64 format)  
      - Model: `chatgpt-4o-latest`  
      - Prompt: `"Deliver a comma separated list describing the content of this image."`  
    - Credentials: OpenAI API  
    - Inputs: Binary image data from Download Image File node  
    - Outputs: JSON with AI-generated content string (`content` field)  
    - Edge Cases:  
      - API authentication failures  
      - Rate limits or quota exceeded  
      - Unexpected AI response format  
      - Large images causing input size limits  
    - Version: 1.8

#### 1.4 Data Preparation

- **Overview:**  
  Combines the AI-generated metadata with the original image file data to prepare for metadata writing.

- **Nodes Involved:**  
  - Merge Metadata and Image File

- **Node Details:**  
  - **Merge Metadata and Image File**  
    - Type: Merge node  
    - Role: Combines two input streams: the downloaded image file and the AI analysis result.  
    - Configuration:  
      - Mode: `combine`  
      - Combine By: `position` (merges items by their order in input arrays)  
    - Inputs:  
      - Input 1: Download Image File output (image binary)  
      - Input 2: Analyze Image Content output (AI keywords)  
    - Outputs: Combined JSON and binary data for next step  
    - Edge Cases:  
      - Mismatched input array lengths causing merge errors  
      - Missing data from either input  
    - Version: 3

#### 1.5 Metadata Writing

- **Overview:**  
  Writes the AI-generated keywords into the image metadata fields `Subject` and `Keywords` using the EXIF community node.

- **Nodes Involved:**  
  - Write Metadata into Image

- **Node Details:**  
  - **Write Metadata into Image**  
    - Type: EXIF Data (community node `n8n-nodes-exif-data`)  
    - Role: Embeds metadata into image files.  
    - Configuration:  
      - Operation: `write`  
      - Metadata fields updated:  
        - `Subject` set to AI-generated content string  
        - `Keywords` set to AI-generated content string  
      - Values are dynamically set from merged JSON (`{{$json.content}}`)  
    - Inputs: Merged image binary and AI metadata  
    - Outputs: Updated image file binary with embedded metadata  
    - Edge Cases:  
      - Unsupported image formats for EXIF writing  
      - Metadata write failures due to file corruption or format issues  
      - Missing or malformed AI content string  
    - Version: 1  
    - Requirements: Must have `n8n-nodes-exif-data` community node installed on self-hosted instance

#### 1.6 Output Update

- **Overview:**  
  Uploads the updated image file back to Google Drive, replacing the original file with the new metadata-enhanced version.

- **Nodes Involved:**  
  - Update Image File

- **Node Details:**  
  - **Update Image File**  
    - Type: Google Drive node  
    - Role: Updates existing file content in Google Drive.  
    - Configuration:  
      - Operation: `update`  
      - File ID: taken from the original downloaded file (`{{$node["Download Image File"].json.id}}`)  
      - Change File Content: enabled (upload new binary)  
      - New Updated File Name: same as original file name (`{{$node["Download Image File"].json.name}}`)  
    - Credentials: Google Drive OAuth2  
    - Inputs: Updated image binary from EXIF node  
    - Outputs: Confirmation of file update  
    - Edge Cases:  
      - File locked or permission denied errors  
      - Network or API timeouts  
      - Conflicts if file changed externally during workflow execution  
    - Version: 3

---

### 3. Summary Table

| Node Name                          | Node Type                         | Functional Role                          | Input Node(s)                      | Output Node(s)                 | Sticky Note                                                                                                                               |
|-----------------------------------|----------------------------------|----------------------------------------|----------------------------------|-------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------|
| Trigger: New file added to Google Drive Folder | Google Drive Trigger             | Detect new files in specific folder     | None                             | Download Image File            | This workflow automatically analyzes the image content with the help of AI and writes it directly back into the image file as keywords.  |
| Download Image File                | Google Drive                     | Download new image file                  | Trigger: New file added to Google Drive Folder | Analyze Image Content, Merge Metadata and Image File | This workflow automatically analyzes the image content with the help of AI and writes it directly back into the image file as keywords.  |
| Analyze Image Content             | LangChain OpenAI                 | AI analyzes image content to generate keywords | Download Image File              | Merge Metadata and Image File  | This workflow automatically analyzes the image content with the help of AI and writes it directly back into the image file as keywords.  |
| Merge Metadata and Image File     | Merge                           | Combine image binary and AI metadata    | Download Image File, Analyze Image Content | Write Metadata into Image      | This workflow automatically analyzes the image content with the help of AI and writes it directly back into the image file as keywords.  |
| Write Metadata into Image         | EXIF Data (Community Node)       | Write AI keywords into image metadata   | Merge Metadata and Image File    | Update Image File              | This workflow automatically analyzes the image content with the help of AI and writes it directly back into the image file as keywords.  |
| Update Image File                 | Google Drive                    | Update original image file with new metadata | Write Metadata into Image        | None                          | This workflow automatically analyzes the image content with the help of AI and writes it directly back into the image file as keywords.  |
| Sticky Note1                     | Sticky Note                    | Documentation and workflow overview     | None                             | None                          | # Welcome to my Automated Image Metadata Tagging Workflow! This workflow automatically analyzes the image content with the help of AI and writes it directly back into the image file as keywords. See https://www.npmjs.com/package/n8n-nodes-exif-data and https://n8n.io/workflows/2995 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Node:**  
   - Add a **Google Drive Trigger** node.  
   - Set event to `fileCreated`.  
   - Set polling interval to every minute.  
   - Configure to watch a specific folder by entering the folder ID `1WaIRWXcaeNViKmpW5IyQ3YGARWYdMg47`.  
   - Connect Google Drive OAuth2 credentials.

2. **Add Download Node:**  
   - Add a **Google Drive** node.  
   - Set operation to `download`.  
   - For `File ID`, use expression: `{{$json["id"]}}` from the trigger node.  
   - Connect Google Drive OAuth2 credentials.  
   - Connect trigger node output to this node input.

3. **Add AI Analysis Node:**  
   - Add a **LangChain OpenAI** node.  
   - Set resource to `image`.  
   - Set operation to `analyze`.  
   - Set input type to `base64`.  
   - Use model `chatgpt-4o-latest`.  
   - Set prompt text to: `"Deliver a comma separated list describing the content of this image."`  
   - Connect OpenAI API credentials.  
   - Connect the output of the Download Image File node to this node.

4. **Add Merge Node:**  
   - Add a **Merge** node.  
   - Set mode to `combine`.  
   - Set combine by to `position`.  
   - Connect outputs of both Download Image File and Analyze Image Content nodes as inputs to this node.

5. **Add EXIF Metadata Writing Node:**  
   - Add an **EXIF Data** node from the community node `n8n-nodes-exif-data`.  
   - Set operation to `write`.  
   - Configure metadata fields:  
     - `Subject` = `{{$json["content"]}}`  
     - `Keywords` = `{{$json["content"]}}`  
   - Connect the output of the Merge node to this node.

6. **Add Update File Node:**  
   - Add a **Google Drive** node.  
   - Set operation to `update`.  
   - For `File ID`, use expression: `{{$node["Download Image File"].json["id"]}}`.  
   - Enable `Change File Content`.  
   - Set `New Updated File Name` to `{{$node["Download Image File"].json["name"]}}`.  
   - Connect Google Drive OAuth2 credentials.  
   - Connect the output of the EXIF node to this node.

7. **Test Workflow:**  
   - Save and activate the workflow.  
   - Add a new image file to the specified Google Drive folder.  
   - Verify the workflow triggers, processes the image, writes metadata, and updates the file.

**Credentials Required:**  
- Google Drive OAuth2 with access to the target folder.  
- OpenAI API key with access to GPT-4o or equivalent AI model.  
- Community node `n8n-nodes-exif-data` installed on your self-hosted n8n instance.

---

### 5. General Notes & Resources

| Note Content                                                                                                                       | Context or Link                                                                                         |
|-----------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| This workflow only works with self-hosted n8n instances and requires installation of the community node `n8n-nodes-exif-data`.   | https://www.npmjs.com/package/n8n-nodes-exif-data                                                     |
| Alternative workflow for cloud users is available here:                                                                           | https://n8n.io/workflows/2995                                                                          |
| Google Drive OAuth2 credential setup documentation:                                                                                | https://docs.n8n.io/integrations/builtin/credentials/google                                           |
| AI API access can be via OpenAI, Anthropic, Google, or Ollama.                                                                    |                                                                                                       |
| Contact the workflow author for questions:                                                                                        | https://www.linkedin.com/in/friedemann-schuetz                                                        |
| Workflow overview and instructions are provided in the sticky note within the workflow for quick reference.                      | Sticky Note node content                                                                                 |

---

This document provides a detailed, structured reference for understanding, reproducing, and troubleshooting the Automated AI Image Metadata Tagging workflow using n8n.