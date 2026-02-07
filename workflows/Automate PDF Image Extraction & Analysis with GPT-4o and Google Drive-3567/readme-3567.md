Automate PDF Image Extraction & Analysis with GPT-4o and Google Drive

https://n8nworkflows.xyz/workflows/automate-pdf-image-extraction---analysis-with-gpt-4o-and-google-drive-3567


# Automate PDF Image Extraction & Analysis with GPT-4o and Google Drive

### 1. Workflow Overview

This workflow automates the extraction of images embedded within a PDF file stored on Google Drive, analyzes each extracted image using the GPT-4o model from OpenAI, and compiles the analysis results along with image URLs into a plain text file. It is designed to replace manual, error-prone processes of screenshotting and manual AI input by fully automating image extraction, AI analysis, and result compilation.

**Target Use Cases:**  
- Users needing fast, automated extraction and AI analysis of images from PDFs (e.g., research, document review, content summarization).  
- Teams wanting to integrate AI-driven image insights into their document workflows without manual intervention.  
- Automations triggered by manual or event-based triggers (e.g., Google Drive upload).

**Logical Blocks:**

- **1.1 Input Reception & PDF Download**  
  Triggering the workflow and downloading the target PDF file from Google Drive.

- **1.2 PDF Image Extraction**  
  Sending the PDF to ConvertAPI to extract all embedded images as JPG files.

- **1.3 Image Data Processing**  
  Splitting the extracted images array and preparing image URLs for analysis.

- **1.4 Image Analysis with GPT-4o**  
  Sending each image URL to OpenAI’s GPT-4o model for detailed analysis.

- **1.5 Content Integration & Output**  
  Combining all image URLs and their corresponding AI analyses into a single text content and saving it as a .txt file.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & PDF Download

- **Overview:**  
  This block starts the workflow manually and downloads the specified PDF file from Google Drive for processing.

- **Nodes Involved:**  
  - When clicking ‘Test workflow’ (Manual Trigger)  
  - Get pdf file (Google Drive)

- **Node Details:**

  - **When clicking ‘Test workflow’**  
    - Type: Manual Trigger  
    - Role: Initiates the workflow manually for testing or manual execution.  
    - Configuration: No parameters; triggers on user action.  
    - Inputs: None  
    - Outputs: Connects to "Get pdf file" node.  
    - Edge Cases: None specific; user must trigger manually.

  - **Get pdf file**  
    - Type: Google Drive (Download operation)  
    - Role: Downloads the PDF file from Google Drive using a file ID.  
    - Configuration:  
      - Operation: Download  
      - File ID: Set to a specific PDF file ("Building Effective AI Agents _ Anthropic.pdf")  
      - Credentials: Google Drive OAuth2  
    - Inputs: Trigger from manual node  
    - Outputs: Binary PDF data to "Extract pdf image" node  
    - Edge Cases:  
      - Invalid or inaccessible file ID  
      - Authentication errors with Google Drive  
      - Network timeouts or API limits

#### 2.2 PDF Image Extraction

- **Overview:**  
  Sends the downloaded PDF binary data to ConvertAPI to extract all embedded images as JPG files, storing them for further processing.

- **Nodes Involved:**  
  - Extract pdf image (HTTP Request)

- **Node Details:**

  - **Extract pdf image**  
    - Type: HTTP Request  
    - Role: Calls ConvertAPI’s PDF-to-image extraction endpoint.  
    - Configuration:  
      - Method: POST  
      - URL: https://v2.convertapi.com/convert/pdf/to/extract-images  
      - Body: Multipart form-data including the PDF file binary, parameters to store the file and output images as JPG.  
      - Authentication: HTTP Header Auth with ConvertAPI credentials  
      - Retry on Fail: Enabled with 5 seconds wait (to handle 503 errors from ConvertAPI)  
    - Inputs: PDF binary from "Get pdf file"  
    - Outputs: JSON response containing extracted image files array to "Get image data"  
    - Edge Cases:  
      - 503 Service Unavailable errors (handled by retry)  
      - API quota limits or authentication failures  
      - Large PDFs causing timeouts

#### 2.3 Image Data Processing

- **Overview:**  
  Splits the array of extracted images into individual items and prepares their URLs for analysis.

- **Nodes Involved:**  
  - Get image data (SplitOut)  
  - Get all img_url (Set)

- **Node Details:**

  - **Get image data**  
    - Type: SplitOut  
    - Role: Splits the "Files" array from ConvertAPI response into separate items for individual processing.  
    - Configuration: Field to split out: "Files"  
    - Inputs: JSON with array of extracted images from "Extract pdf image"  
    - Outputs: Individual image objects to "Get all img_url"  
    - Edge Cases: Empty or missing "Files" array

  - **Get all img_url**  
    - Type: Set  
    - Role: Extracts and assigns the image URL from each split image object for downstream analysis.  
    - Configuration: Sets a new field "url" equal to the extracted image URL from JSON path `$json.Url`  
    - Inputs: Individual image objects from "Get image data"  
    - Outputs: Items with "url" field to "Analyze image"  
    - Edge Cases: Missing or malformed URL fields

#### 2.4 Image Analysis with GPT-4o

- **Overview:**  
  Sends each image URL to OpenAI’s GPT-4o model for detailed image analysis and receives descriptive insights.

- **Nodes Involved:**  
  - Analyze image (OpenAI via LangChain)  
  - Get image analyze content (Set)

- **Node Details:**

  - **Analyze image**  
    - Type: OpenAI (LangChain node)  
    - Role: Performs AI analysis on the image URL using GPT-4o model.  
    - Configuration:  
      - Resource: Image  
      - Operation: Analyze  
      - Model: GPT-4o  
      - Text prompt: "Please analyze the video in detail and provide a thorough explanation" (Note: prompt mentions video, but used for image analysis)  
      - Image URLs: Uses expression `{{$json.url}}` to pass current image URL  
      - Credentials: OpenAI API key  
    - Inputs: Items with image URLs from "Get all img_url"  
    - Outputs: AI analysis results to "Get image analyze content"  
    - Edge Cases:  
      - API rate limits or authentication errors  
      - Model errors or timeouts  
      - Incorrect prompt for image content (prompt references video)  

  - **Get image analyze content**  
    - Type: Set  
    - Role: Combines the image URL and the AI-generated content into a single string field "content".  
    - Configuration:  
      - Sets "content" to a multiline string combining the image URL and the first choice message content from GPT response:  
        ```
        {{$('Get all img_url').item.json.url}}
        {{$json.choices[0].message.content}}
        ```  
    - Inputs: AI analysis output from "Analyze image" and original image URL from "Get all img_url"  
    - Outputs: Items with combined content to "Integrate all content to a a content"  
    - Edge Cases: Missing or malformed AI response content

#### 2.5 Content Integration & Output

- **Overview:**  
  Aggregates all individual image analysis contents into a single text block and converts it to a .txt file for output.

- **Nodes Involved:**  
  - Integrate all content to a a content (Code)  
  - Output content to a .txt file (ConvertToFile)

- **Node Details:**

  - **Integrate all content to a a content**  
    - Type: Code (JavaScript)  
    - Role: Merges all "content" fields from incoming items into one string separated by new lines.  
    - Configuration:  
      - JavaScript code:  
        ```js
        const mergedContent = items.map(item => item.json.content).join('\n');
        return [{ json: { content: mergedContent } }];
        ```  
    - Inputs: Multiple items each with "content" field from "Get image analyze content"  
    - Outputs: Single item with merged "content" field to "Output content to a .txt file"  
    - Edge Cases: Empty input array results in empty content

  - **Output content to a .txt file**  
    - Type: ConvertToFile  
    - Role: Converts the merged text content into a downloadable .txt file.  
    - Configuration:  
      - Operation: toText  
      - Source Property: "content"  
    - Inputs: Single item with merged content  
    - Outputs: Binary file data (text file)  
    - Edge Cases: Empty content results in empty file

---

### 3. Summary Table

| Node Name                     | Node Type                     | Functional Role                                | Input Node(s)               | Output Node(s)                  | Sticky Note                                                                                                                     |
|-------------------------------|-------------------------------|-----------------------------------------------|-----------------------------|--------------------------------|--------------------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’  | Manual Trigger                | Starts workflow manually                       | None                        | Get pdf file                   |                                                                                                                                |
| Get pdf file                  | Google Drive                  | Downloads PDF file from Google Drive           | When clicking ‘Test workflow’ | Extract pdf image              |                                                                                                                                |
| Extract pdf image             | HTTP Request                  | Extracts images from PDF via ConvertAPI        | Get pdf file                | Get image data                 | 1.Set up your credentials when you first open the workflow. You’ll need accounts for OpenAI, Convert API, and Google Drive. 2.Convert API does not rate-limit your API, sometimes you may receive 503 service unavailable error. Nevertheless, it doesn’t mean that you cannot convert your file. It simply means that you should retry the conversion in a few seconds. 3.Upload a PDF with images to Google Drive. 4.Remove unnecessary parts and retrieve image-related information. 5.Integrate image and image analysis information together. 6.Analyze each image using the OPENAI GPT-4o model. 7.Retrieve all image analysis content and image URL 8.Integrate multiple image URLs and analysis content 9.Output content to a .txt file. Template was created in n8n v1.83.2 |
| Get image data               | SplitOut                      | Splits extracted images array into individual items | Extract pdf image           | Get all img_url                |                                                                                                                                |
| Get all img_url              | Set                           | Extracts image URLs for analysis               | Get image data              | Analyze image                 |                                                                                                                                |
| Analyze image                | OpenAI (LangChain)            | Analyzes each image URL using GPT-4o           | Get all img_url             | Get image analyze content      |                                                                                                                                |
| Get image analyze content    | Set                           | Combines image URL and AI analysis content     | Analyze image               | Integrate all content to a a content |                                                                                                                                |
| Integrate all content to a a content | Code (JavaScript)           | Merges all image analysis contents into one text | Get image analyze content   | Output content to a .txt file  |                                                                                                                                |
| Output content to a .txt file | ConvertToFile                 | Converts merged text content to a .txt file    | Integrate all content to a a content | None                         |                                                                                                                                |
| Sticky Note                  | Sticky Note                   | Setup instructions and workflow overview       | None                        | None                          | 1.Set up your credentials when you first open the workflow. You’ll need accounts for OpenAI, Convert API, and Google Drive. 2.Convert API does not rate-limit your API, sometimes you may receive 503 service unavailable error. Nevertheless, it doesn’t mean that you cannot convert your file. It simply means that you should retry the conversion in a few seconds. 3.Upload a PDF with images to Google Drive. 4.Remove unnecessary parts and retrieve image-related information. 5.Integrate image and image analysis information together. 6.Analyze each image using the OPENAI GPT-4o model. 7.Retrieve all image analysis content and image URL 8.Integrate multiple image URLs and analysis content 9.Output content to a .txt file. Template was created in n8n v1.83.2 |
| Sticky Note1                 | Sticky Note                   | Suggests replacing manual trigger with other triggers | None                        | None                          | ### You can exchange this with any trigger you like (*e.g. google drive trigger*)                                              |
| Sticky Note3                 | Sticky Note                   | Workflow purpose and summary                   | None                        | None                          | ### PDF Image Extraction and Analysis  with GPT-4o This n8n workflow automates the process of extracting images from PDF files and analyzing them with AI, then compiling the results into a document. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - Purpose: To start the workflow manually for testing.

2. **Add Google Drive Node to Download PDF**  
   - Type: Google Drive  
   - Operation: Download  
   - Parameters:  
     - File ID: Set to your PDF file’s Google Drive ID  
   - Credentials: Configure Google Drive OAuth2 credentials.

3. **Add HTTP Request Node to Extract Images from PDF**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: https://v2.convertapi.com/convert/pdf/to/extract-images  
   - Authentication: HTTP Header Auth with ConvertAPI credentials  
   - Body Parameters (multipart-form-data):  
     - StoreFile: true  
     - ImageOutputFormat: jpg  
     - File: Use binary data from previous node (PDF file)  
   - Retry on Fail: Enable with 5000 ms wait to handle transient 503 errors.

4. **Add SplitOut Node to Split Extracted Images Array**  
   - Type: SplitOut  
   - Field to split out: "Files" (from ConvertAPI response)

5. **Add Set Node to Extract Image URLs**  
   - Type: Set  
   - Assign a new field "url" with value: `{{$json.Url}}` (image URL from split item)

6. **Add OpenAI Node (LangChain) to Analyze Each Image**  
   - Type: OpenAI (LangChain)  
   - Resource: Image  
   - Operation: Analyze  
   - Model: GPT-4o  
   - Text prompt: "Please analyze the video in detail and provide a thorough explanation" (can be customized)  
   - Image URLs: Use expression `{{$json.url}}`  
   - Credentials: Configure OpenAI API key

7. **Add Set Node to Combine Image URL and Analysis Content**  
   - Type: Set  
   - Assign "content" field with multiline string:  
     ```
     {{$('Get all img_url').item.json.url}}
     {{$json.choices[0].message.content}}
     ```

8. **Add Code Node to Merge All Contents**  
   - Type: Code (JavaScript)  
   - Code:  
     ```js
     const mergedContent = items.map(item => item.json.content).join('\n');
     return [{ json: { content: mergedContent } }];
     ```

9. **Add ConvertToFile Node to Output Text File**  
   - Type: ConvertToFile  
   - Operation: toText  
   - Source Property: "content"

10. **Connect Nodes in Order:**  
    Manual Trigger → Get pdf file → Extract pdf image → Get image data → Get all img_url → Analyze image → Get image analyze content → Integrate all content to a a content → Output content to a .txt file

11. **Credential Setup:**  
    - Google Drive OAuth2 for downloading PDF  
    - ConvertAPI HTTP Header Auth for image extraction  
    - OpenAI API key for GPT-4o analysis

12. **Optional Customizations:**  
    - Replace Manual Trigger with Google Drive Trigger or other event triggers  
    - Modify prompt or model in OpenAI node for different analysis  
    - Add nodes to send output file to Slack, Telegram, or other platforms instead of saving locally

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                              | Context or Link                                                                                     |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| Setup instructions: Set up credentials for OpenAI, ConvertAPI, and Google Drive before running the workflow. ConvertAPI may return 503 errors temporarily; retry after a short wait. Upload PDFs with images to Google Drive for processing.                                                                                                                               | Sticky Note in workflow                                                                              |
| The workflow template was created in n8n version 1.83.2.                                                                                                                                                                                                                                                                                                                  | Workflow metadata                                                                                   |
| You can replace the manual trigger with any other trigger, such as a Google Drive trigger, to automate the workflow on file upload.                                                                                                                                                                                                                                     | Sticky Note1                                                                                       |
| This workflow automates PDF image extraction and analysis using GPT-4o, compiling results into a document for easy sharing or further processing.                                                                                                                                                                                                                       | Sticky Note3                                                                                       |
| ConvertAPI documentation: https://www.convertapi.com/doc/pdf-to-images                                                                                                                                                                                                                                                                                                   | External resource (not in workflow but relevant)                                                  |
| OpenAI GPT-4o model documentation: https://platform.openai.com/docs/models/gpt-4o                                                                                                                                                                                                                                                                                         | External resource                                                                                   |

---

This documentation provides a complete and detailed reference for understanding, reproducing, and customizing the "Automate PDF Image Extraction & Analysis with GPT-4o and Google Drive" workflow in n8n.