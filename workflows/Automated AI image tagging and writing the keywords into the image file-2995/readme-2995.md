Automated AI image tagging and writing the keywords into the image file

https://n8nworkflows.xyz/workflows/automated-ai-image-tagging-and-writing-the-keywords-into-the-image-file-2995


# Automated AI image tagging and writing the keywords into the image file

### 1. Workflow Overview

This workflow automates the process of tagging images with AI-generated keywords and embedding those keywords directly into the image file’s metadata. It is designed for users who want to automatically enrich images stored in a Google Drive folder with descriptive metadata, improving searchability and organization without manual tagging.

The workflow consists of the following logical blocks:

- **1.1 Input Reception:** Detects new image files added to a specific Google Drive folder.
- **1.2 Image Download and Preparation:** Downloads the new image file and extracts its binary content.
- **1.3 AI Content Analysis:** Sends the image content to an AI model to generate descriptive keywords.
- **1.4 Metadata Merging and Writing:** Combines AI-generated keywords with the image’s Base64 data and writes these keywords into the image’s XMP metadata (dc:subject).
- **1.5 File Conversion and Update:** Converts the modified data back into a file and updates the original image file in Google Drive with the enriched metadata.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block triggers the workflow when a new file is added to a specific Google Drive folder.

- **Nodes Involved:**  
  - Trigger: New file added to Google Drive Folder

- **Node Details:**

  - **Trigger: New file added to Google Drive Folder**  
    - Type: Google Drive Trigger  
    - Role: Watches a specific Google Drive folder for new files created.  
    - Configuration:  
      - Event: `fileCreated`  
      - Poll interval: every minute  
      - Folder to watch: Folder ID `1WaIRWXcaeNViKmpW5IyQ3YGARWYdMg47` (named "EXIF")  
    - Credentials: Google Drive OAuth2  
    - Inputs: None (trigger node)  
    - Outputs: Emits metadata of the newly added file, including file ID and name.  
    - Edge Cases:  
      - Folder permission errors or revoked OAuth tokens may cause trigger failure.  
      - High frequency of file additions might cause rate limiting.  
    - Version: 1

---

#### 1.2 Image Download and Preparation

- **Overview:**  
  Downloads the triggered image file from Google Drive and extracts its binary content into a usable format.

- **Nodes Involved:**  
  - Download Image File  
  - Extract from File

- **Node Details:**

  - **Download Image File**  
    - Type: Google Drive  
    - Role: Downloads the image file using the file ID from the trigger node.  
    - Configuration:  
      - Operation: `download`  
      - File ID: dynamically set from trigger output (`={{ $json.id }}`)  
    - Credentials: Google Drive OAuth2  
    - Inputs: File metadata from trigger  
    - Outputs: Binary data of the downloaded image file  
    - Edge Cases:  
      - File not found or deleted before download.  
      - Permission issues or expired credentials.  
      - Large file size may cause timeout or memory issues.  
    - Version: 3

  - **Extract from File**  
    - Type: Extract From File  
    - Role: Converts the binary image data into a Base64 string property for further processing.  
    - Configuration:  
      - Operation: `binaryToProperty` (extract binary data to JSON property)  
      - Default property used: `data`  
    - Inputs: Binary data from Download Image File  
    - Outputs: JSON with Base64-encoded image data in `data` property  
    - Edge Cases:  
      - Binary data missing or corrupted may cause extraction failure.  
    - Version: 1

---

#### 1.3 AI Content Analysis

- **Overview:**  
  Sends the Base64-encoded image to an AI model (OpenAI GPT-4o) to generate a comma-separated list of keywords describing the image content.

- **Nodes Involved:**  
  - Analyze Image Content

- **Node Details:**

  - **Analyze Image Content**  
    - Type: LangChain OpenAI Node  
    - Role: Uses OpenAI’s GPT-4o model to analyze image content and generate descriptive keywords.  
    - Configuration:  
      - Resource: `image`  
      - Operation: `analyze`  
      - Input type: `base64` (receives Base64 image data)  
      - Prompt: `"Deliver a comma separated list describing the content of this image."`  
      - Model: `chatgpt-4o-latest`  
    - Credentials: OpenAI API key  
    - Inputs: Base64 image data from Extract from File  
    - Outputs: JSON with AI-generated keywords in `content` property (comma-separated string)  
    - Edge Cases:  
      - API authentication errors or quota exceeded.  
      - Timeout or rate limiting from OpenAI.  
      - Unexpected or empty AI response.  
    - Version: 1.8

---

#### 1.4 Metadata Merging and Writing

- **Overview:**  
  Combines the AI-generated keywords with the Base64 image data and writes the keywords into the image’s XMP metadata under the Dublin Core subject field (`dc:subject`).

- **Nodes Involved:**  
  - Merge Metadata and Base64 Code  
  - Write Metadata to Base64 Code

- **Node Details:**

  - **Merge Metadata and Base64 Code**  
    - Type: Merge  
    - Role: Combines two input streams by position: AI keywords and Base64 image data.  
    - Configuration:  
      - Mode: `combine`  
      - Combine by: `position` (pairs items by their index)  
    - Inputs:  
      - AI keywords from Analyze Image Content (main input 0)  
      - Base64 image data from Extract from File (main input 1)  
    - Outputs: Merged JSON containing both keywords and image data for next processing  
    - Edge Cases:  
      - Mismatched item counts between inputs could cause missing data.  
    - Version: 3

  - **Write Metadata to Base64 Code**  
    - Type: Code (JavaScript)  
    - Role: Embeds the AI-generated keywords into the image’s XMP metadata as `dc:subject` tags.  
    - Configuration:  
      - Custom JavaScript code that:  
        - Parses the comma-separated keywords into an array  
        - Constructs an XMP metadata XML packet embedding the keywords as RDF list items under `dc:subject`  
        - Creates an XMP header buffer and concatenates it with the original image buffer, inserting the metadata after the JPEG SOI marker  
        - Converts the modified image buffer back to Base64 and updates the JSON property `data`  
    - Inputs: Merged data containing keywords and Base64 image data  
    - Outputs: JSON with updated Base64 image data including embedded metadata  
    - Edge Cases:  
      - Malformed keywords string causing XML errors.  
      - Buffer manipulation errors if image format is unexpected or corrupted.  
      - Large images may cause memory issues.  
    - Version: 2

---

#### 1.5 File Conversion and Update

- **Overview:**  
  Converts the Base64-encoded modified image data back into binary file format and updates the original image file in Google Drive with the enriched metadata.

- **Nodes Involved:**  
  - Convert to File  
  - Update Image File

- **Node Details:**

  - **Convert to File**  
    - Type: Convert To File  
    - Role: Converts the Base64 string in `data` property back into binary file data for upload.  
    - Configuration:  
      - Operation: `toBinary`  
      - Source property: `data` (Base64 image with embedded metadata)  
    - Inputs: JSON with Base64 image data from Write Metadata to Base64 Code  
    - Outputs: Binary file data ready for upload  
    - Edge Cases:  
      - Invalid Base64 data causing conversion failure.  
    - Version: 1.1

  - **Update Image File**  
    - Type: Google Drive  
    - Role: Updates the original image file in Google Drive with the new binary content containing embedded metadata.  
    - Configuration:  
      - Operation: `update`  
      - File ID: dynamically set from Download Image File node (`={{ $('Download Image File').item.json.id }}`)  
      - Change file content: true  
      - New file name: same as original (`={{ $('Download Image File').item.json.name }}`)  
    - Credentials: Google Drive OAuth2  
    - Inputs: Binary file data from Convert to File  
    - Outputs: Confirmation of file update  
    - Edge Cases:  
      - File locked or deleted before update.  
      - Permission or quota issues.  
      - Large file size causing timeout.  
    - Version: 3

---

### 3. Summary Table

| Node Name                              | Node Type                      | Functional Role                                  | Input Node(s)                     | Output Node(s)                  | Sticky Note                                                                                                                                    |
|--------------------------------------|--------------------------------|-------------------------------------------------|----------------------------------|--------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------|
| Trigger: New file added to Google Drive Folder | Google Drive Trigger           | Detects new files added to specific Google Drive folder | None                             | Download Image File             | # Welcome to my Automated Image Metadata Tagging Workflow! This workflow automatically analyzes the image content with the help of AI and writes it directly back into the image file as keywords. See full description in sticky note. |
| Download Image File                   | Google Drive                   | Downloads the triggered image file from Google Drive | Trigger: New file added to Google Drive Folder | Analyze Image Content, Extract from File |                                                                                                                                                |
| Analyze Image Content                 | LangChain OpenAI Node          | Sends image Base64 to AI for keyword generation | Download Image File              | Merge Metadata and Base64 Code  |                                                                                                                                                |
| Extract from File                    | Extract From File              | Converts binary image data to Base64 string     | Download Image File              | Merge Metadata and Base64 Code  |                                                                                                                                                |
| Merge Metadata and Base64 Code       | Merge                         | Combines AI keywords and Base64 image data      | Analyze Image Content, Extract from File | Write Metadata to Base64 Code   |                                                                                                                                                |
| Write Metadata to Base64 Code         | Code                          | Embeds AI keywords into image XMP metadata      | Merge Metadata and Base64 Code   | Convert to File                 |                                                                                                                                                |
| Convert to File                      | Convert To File                | Converts Base64 string back to binary file      | Write Metadata to Base64 Code    | Update Image File               |                                                                                                                                                |
| Update Image File                    | Google Drive                  | Updates original image file in Google Drive     | Convert to File                 | None                           |                                                                                                                                                |
| Sticky Note1                        | Sticky Note                   | Workflow description and instructions            | None                             | None                           | # Welcome to my Automated Image Metadata Tagging Workflow! This workflow automatically analyzes the image content with the help of AI and writes it directly back into the image file as keywords. See full description and links. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Node: "Trigger: New file added to Google Drive Folder"**  
   - Type: Google Drive Trigger  
   - Set event to `fileCreated`  
   - Set polling interval to every minute  
   - Configure folder to watch by entering folder ID `1WaIRWXcaeNViKmpW5IyQ3YGARWYdMg47`  
   - Connect Google Drive OAuth2 credentials  
   - Position: leftmost in the canvas

2. **Create Node: "Download Image File"**  
   - Type: Google Drive  
   - Operation: `download`  
   - File ID: expression `={{ $json.id }}` from trigger node output  
   - Connect Google Drive OAuth2 credentials  
   - Connect input from trigger node

3. **Create Node: "Analyze Image Content"**  
   - Type: LangChain OpenAI Node  
   - Resource: `image`  
   - Operation: `analyze`  
   - Input type: `base64`  
   - Model: `chatgpt-4o-latest`  
   - Text prompt: `"Deliver a comma separated list describing the content of this image."`  
   - Connect OpenAI API credentials  
   - Connect input from "Download Image File" node (binary data)

4. **Create Node: "Extract from File"**  
   - Type: Extract From File  
   - Operation: `binaryToProperty`  
   - Default property: `data`  
   - Connect input from "Download Image File" node (binary data)

5. **Create Node: "Merge Metadata and Base64 Code"**  
   - Type: Merge  
   - Mode: `combine`  
   - Combine by: `position`  
   - Connect first input from "Analyze Image Content" (AI keywords)  
   - Connect second input from "Extract from File" (Base64 image data)

6. **Create Node: "Write Metadata to Base64 Code"**  
   - Type: Code (JavaScript)  
   - Paste the following JavaScript code:

```javascript
const tags = items[0].json.content.split(', ');

const xmpData = `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="XMP Core 5.1.2">
    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
        <rdf:Description rdf:about=""
            xmlns:dc="http://purl.org/dc/elements/1.1/"
            xmlns:xmp="http://ns.adobe.com/xap/1.0/"
            xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/">
            <dc:creator></dc:creator>
            <dc:subject>
                <rdf:Bag>
                    ${tags.map(tag => `<rdf:li>${tag}</rdf:li>`).join('\n                    ')}
                </rdf:Bag>
            </dc:subject>
            <xmp:CreateDate>${new Date().toISOString()}</xmp:CreateDate>
        </rdf:Description>
    </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;

const xmpHeader = Buffer.from([
    0xFF, 0xE1,
    0x00, 0x00,
    0x68, 0x74, 0x74, 0x70, 0x3A, 0x2F, 0x2F, 0x6E, 0x73, 0x2E,
    0x61, 0x64, 0x6F, 0x62, 0x65, 0x2E, 0x63, 0x6F, 0x6D, 0x2F,
    0x78, 0x61, 0x70, 0x2F, 0x31, 0x2E, 0x30, 0x2F, 0x00
]);

const xmpBuffer = Buffer.from(xmpData, 'utf8');
const imageBuffer = Buffer.from(items[0].json.data, 'base64');
const length = xmpHeader.length + xmpBuffer.length - 2;
xmpHeader[2] = (length >> 8) & 0xFF;
xmpHeader[3] = length & 0xFF;

const newImageData = Buffer.concat([
    imageBuffer.slice(0, 2),
    xmpHeader,
    xmpBuffer,
    imageBuffer.slice(2)
]);

items[0].json.data = newImageData.toString('base64');

return items;
```

   - Connect input from "Merge Metadata and Base64 Code"

7. **Create Node: "Convert to File"**  
   - Type: Convert To File  
   - Operation: `toBinary`  
   - Source property: `data`  
   - Connect input from "Write Metadata to Base64 Code"

8. **Create Node: "Update Image File"**  
   - Type: Google Drive  
   - Operation: `update`  
   - File ID: expression `={{ $('Download Image File').item.json.id }}`  
   - Change file content: enabled  
   - New updated file name: expression `={{ $('Download Image File').item.json.name }}`  
   - Connect Google Drive OAuth2 credentials  
   - Connect input from "Convert to File"

9. **Add Sticky Note** (optional)  
   - Content: Paste the workflow description and access requirements as in the original sticky note for documentation.

10. **Connect all nodes in the order described:**  
    Trigger → Download Image File → (Analyze Image Content & Extract from File) → Merge Metadata and Base64 Code → Write Metadata to Base64 Code → Convert to File → Update Image File

11. **Set workflow active and test with new image files added to the specified Google Drive folder.**

---

### 5. General Notes & Resources

| Note Content                                                                                                  | Context or Link                                                                                           |
|---------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| This workflow requires Google Drive OAuth2 credentials and an AI API key (OpenAI or compatible).               | Google Drive credentials setup: https://docs.n8n.io/integrations/builtin/credentials/google                |
| AI API access can be via OpenAI, Anthropic, Google, or Ollama, depending on your preference and availability. |                                                                                                          |
| Contact the workflow author for questions or support: https://www.linkedin.com/in/friedemann-schuetz          |                                                                                                          |
| The workflow embeds keywords into the XMP metadata field `dc:subject` following Adobe XMP standards.          | Useful for image cataloging and search in compatible software.                                            |
| The workflow is designed for JPEG images; other formats may require adjustments in metadata embedding logic.  |                                                                                                          |

---

This documentation provides a detailed, stepwise understanding of the workflow, enabling reproduction, modification, and troubleshooting by advanced users and automation agents alike.