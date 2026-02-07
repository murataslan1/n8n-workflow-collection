Analyze Images & PDFs from Google Drive with Gemini 3 AI

https://n8nworkflows.xyz/workflows/analyze-images---pdfs-from-google-drive-with-gemini-3-ai-11038


# Analyze Images & PDFs from Google Drive with Gemini 3 AI

### 1. Workflow Overview

This workflow automates the analysis and summarization of newly uploaded images and PDF financial reports in a specified Google Drive folder using Google Gemini 3 AI models. It is designed for finance professionals, analysts, or anyone needing quick AI-driven insights from visual financial data and documents.

**Logical Blocks:**

- **1.1 Input Reception:**  
  Watches a specific Google Drive folder for new file uploads (images or PDFs).

- **1.2 File Type Filtering:**  
  Filters incoming files by MIME type to separate image files from PDFs.

- **1.3 Downloading Files:**  
  Downloads the actual content of the detected files via HTTP requests.

- **1.4 Image Analysis Branch:**  
  Sends downloaded images to Google Gemini 3 Vision model for analysis, then processes the output through an AI agent for summarization and key insights extraction.

- **1.5 PDF Extraction and Analysis Branch:**  
  Extracts text content from PDFs, sends extracted text to Gemini 3 via OpenRouter Chat model, and then passes it through an AI agent for summarization and key insights.

- **1.6 User Guidance and Documentation:**  
  Sticky Notes provide instructional content, visualization of workflow sections, and links to external resources.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  Detects new files created in a specific Google Drive folder, triggering the workflow.

- **Nodes Involved:**  
  - Google Drive Trigger

- **Node Details:**

  - **Google Drive Trigger**  
    - Type: Trigger node, listens for Google Drive events  
    - Configuration: Watches a specified folder for `fileCreated` event, polling every minute  
    - Key expressions: Folder ID needs to be replaced with target folder ID  
    - Input: None (event-driven)  
    - Output: JSON metadata of the new file(s)  
    - Failure modes: OAuth credential issues, folder permissions, API rate limits  
    - Notes: Folder ID must be customized to user’s folder; credential must have read access.

#### 2.2 File Type Filtering

- **Overview:**  
  Separates files based on MIME type to route images and PDFs to appropriate processing branches.

- **Nodes Involved:**  
  - Filter by Type

- **Node Details:**

  - **Filter by Type (If node)**  
    - Type: Conditional logic node  
    - Configuration: Checks if MIME type equals `image/png` or `image/webp` to identify images  
    - Input: File metadata from Google Drive Trigger  
    - Output: Two outputs —  
      - Output 1: If image MIME type matches  
      - Output 2: Else, assumed PDF (no explicit condition, but falls through)  
    - Failure modes: Missing or unexpected MIME types; files of unsupported formats are ignored

#### 2.3 Downloading Files

- **Overview:**  
  Downloads the actual files from Google Drive using their web content links for further processing.

- **Nodes Involved:**  
  - Download Image  
  - Download PDF

- **Node Details:**

  - **Download Image**  
    - Type: HTTP Request node  
    - Configuration: Downloads image file from URL extracted from file metadata (`webContentLink`)  
    - Input: From Filter by Type (image path)  
    - Output: Binary image data  
    - Failure modes: URL invalid, permissions denied, network failures

  - **Download PDF**  
    - Type: HTTP Request node  
    - Configuration: Downloads PDF file using `webContentLink` URL  
    - Input: From Filter by Type (PDF path)  
    - Output: Binary PDF data  
    - Failure modes: Same as Download Image

#### 2.4 Image Analysis Branch

- **Overview:**  
  Processes downloaded images through Google Gemini 3 Vision AI to analyze and summarize visual content (charts, diagrams).

- **Nodes Involved:**  
  - Analyze an image  
  - Analyzer Agent

- **Node Details:**

  - **Analyze an image**  
    - Type: LangChain Google Gemini node (Vision model)  
    - Configuration:  
      - Model: `models/gemini-3-pro-preview`  
      - Operation: Analyze image input (binary)  
      - Text prompt: "Summarize this report/image."  
    - Input: Binary image from Download Image  
    - Output: JSON analysis results including textual and visual content interpretation  
    - Failure modes: API credential issues, model availability, unsupported image formats

  - **Analyzer Agent**  
    - Type: LangChain Agent node  
    - Configuration:  
      - Input text extracted from Analyze an image output (`$json.content.parts[0].text`)  
      - System message instructs to act as a financial analyst assistant, summarizing and highlighting top 3 key findings  
    - Input: JSON text from Analyze an image node  
    - Output: Summarized findings  
    - Failure modes: Parsing errors, AI model latency or failures

#### 2.5 PDF Extraction and Analysis Branch

- **Overview:**  
  Extracts text from PDF files, processes it through Gemini 3 language model via OpenRouter, and summarizes content with an AI agent.

- **Nodes Involved:**  
  - Extract from File  
  - OpenRouter Chat Model1  
  - Analyzer Agent (PDF)

- **Node Details:**

  - **Extract from File**  
    - Type: ExtractFromFile node  
    - Configuration: Extracts text content from PDF binary  
    - Input: Binary PDF from Download PDF  
    - Output: Extracted text content (JSON)  
    - Failure modes: PDFs without selectable text (scanned images only), extraction failures

  - **OpenRouter Chat Model1**  
    - Type: LangChain OpenRouter Chat Model node  
    - Configuration:  
      - Model: `google/gemini-3-pro-preview`  
      - Uses extracted text as input  
    - Input: Extracted text from Extract from File  
    - Output: Processed text ready for AI agent  
    - Failure modes: API limits, connectivity, credential issues

  - **Analyzer Agent (PDF)**  
    - Type: LangChain Agent node  
    - Configuration:  
      - Input text from OpenRouter Chat Model1 output (`$json.content.parts[0].text`)  
      - System message: same financial analyst assistant prompt as image branch  
    - Input: Text processed by OpenRouter Chat Model1  
    - Output: Summarized report with key insights  
    - Failure modes: Text parsing issues, AI model errors

#### 2.6 User Guidance and Documentation

- **Overview:**  
  Sticky Notes provide context, section labeling, and external resource links for users.

- **Nodes Involved:**  
  - Sticky Note (Image Analyzer)  
  - Sticky Note1 (PDF Extractor & Analyzer)  
  - Sticky Note2 (Drive Trigger + Filter by type)  
  - Sticky Note3 (Full workflow description and setup instructions)  
  - Sticky Note4 (YouTube tutorial link)

- **Node Details:**

  - **Sticky Notes**  
    - Type: Visual annotation nodes  
    - Configuration: Provide descriptions, instructions, workflow segmentation, and external video tutorial links  
    - Input/Output: None  
    - Purpose: Aid user understanding and onboarding

---

### 3. Summary Table

| Node Name           | Node Type                        | Functional Role                      | Input Node(s)          | Output Node(s)               | Sticky Note                                                                                                                           |
|---------------------|---------------------------------|------------------------------------|------------------------|-----------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| Google Drive Trigger | Google Drive Trigger             | Detect new files in Drive folder   | —                      | Filter by Type               | Drive Trigger + Filter by type                                                                                                        |
| Filter by Type      | If                              | Route files by MIME type            | Google Drive Trigger    | Download Image, Download PDF | Drive Trigger + Filter by type                                                                                                        |
| Download Image      | HTTP Request                    | Download image file from URL        | Filter by Type (image)  | Analyze an image             | Image Analyzer                                                                                                                        |
| Analyze an image    | LangChain Google Gemini (Vision)| Analyze image content with Gemini 3| Download Image          | Analyzer Agent               | Image Analyzer                                                                                                                        |
| Analyzer Agent      | LangChain Agent                 | Summarize image analysis output    | Analyze an image        | —                           | Image Analyzer                                                                                                                        |
| Download PDF        | HTTP Request                    | Download PDF file from URL          | Filter by Type (PDF)    | Extract from File            | PDF Extractor & Analyzer                                                                                                              |
| Extract from File   | ExtractFromFile                 | Extract text from downloaded PDF   | Download PDF            | Analyzer Agent (PDF)         | PDF Extractor & Analyzer                                                                                                              |
| OpenRouter Chat Model1 | LangChain OpenRouter Chat Model| Process extracted PDF text with Gemini 3 | Extract from File | Analyzer Agent (PDF)         | PDF Extractor & Analyzer                                                                                                              |
| Analyzer Agent (PDF)| LangChain Agent                 | Summarize PDF text analysis output | OpenRouter Chat Model1  | —                           | PDF Extractor & Analyzer                                                                                                              |
| Sticky Note         | Sticky Note                    | Visual annotation for Image branch | —                      | —                           | Image Analyzer                                                                                                                        |
| Sticky Note1        | Sticky Note                    | Visual annotation for PDF branch   | —                      | —                           | PDF Extractor & Analyzer                                                                                                              |
| Sticky Note2        | Sticky Note                    | Visual annotation for Trigger/filter| —                      | —                           | Drive Trigger + Filter by type                                                                                                        |
| Sticky Note3        | Sticky Note                    | Full workflow description and guide| —                      | —                           | Gemini 3 Image & PDF Extractor overview and setup guide with troubleshooting and video tutorial link                                  |
| Sticky Note4        | Sticky Note                    | YouTube tutorial link              | —                      | —                           | Link to video tutorial: https://www.youtube.com/watch?v=UuWYT_uXiw0                                                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Drive Trigger node:**  
   - Type: Google Drive Trigger  
   - Event: `fileCreated`  
   - Folder to watch: Replace with your Google Drive folder ID  
   - Polling: Every minute  
   - Credential: Select your Google Drive OAuth credential with read access to the folder

2. **Add an If node (Filter by Type):**  
   - Conditions:  
     - Check if MIME type equals `image/png` OR `image/webp` (case-sensitive, strict)  
   - Input: Connect from Google Drive Trigger  
   - Outputs:  
     - True (image path)  
     - False (assumed PDF path)

3. **Add HTTP Request node (Download Image):**  
   - Input: Connect from `True` output of Filter by Type  
   - Method: GET (default)  
   - URL: Expression `{{$json.webContentLink}}`  
   - Output: Binary data of image

4. **Add LangChain Google Gemini node (Analyze an image):**  
   - Input: Connect from Download Image  
   - Model ID: `models/gemini-3-pro-preview`  
   - Resource: Image  
   - Operation: Analyze  
   - Input Type: Binary  
   - Text prompt: "Summarize this report/image."

5. **Add LangChain Agent node (Analyzer Agent):**  
   - Input: Connect from Analyze an image node  
   - Text input: Expression `{{$json.content.parts[0].text}}`  
   - System message:  
     _"You are a helpful financial analyst assistant. You will receive an input of a description of some financial charts extracted from a report. Summarize the chart/information contained in the chart, highlight the top 3 key findings."_  
   - Prompt type: Define

6. **Add HTTP Request node (Download PDF):**  
   - Input: Connect from `False` output of Filter by Type  
   - Method: GET  
   - URL: Expression `{{$json.webContentLink}}`  
   - Output: Binary PDF data

7. **Add Extract From File node:**  
   - Input: Connect from Download PDF  
   - Operation: PDF text extraction

8. **Add LangChain OpenRouter Chat Model node:**  
   - Input: Connect from Extract From File  
   - Model: `google/gemini-3-pro-preview`  
   - Use default options

9. **Add LangChain Agent node (Analyzer Agent (PDF)):**  
   - Input: Connect from OpenRouter Chat Model node  
   - Text input: Expression `{{$json.content.parts[0].text}}`  
   - System message: Same as Analyzer Agent node for image branch  
   - Prompt type: Define

10. **Add Sticky Note nodes for user guidance:**  
    - Position and content as desired, replicating the notes:  
      - Drive Trigger + Filter by type  
      - Image Analyzer  
      - PDF Extractor & Analyzer  
      - Full workflow description and troubleshooting guide  
      - YouTube tutorial link

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Context or Link                                                                                  |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Gemini 3 Image & PDF Extractor (Google Drive → Gemini 3 → Summary) Automatically summarize newly uploaded images or PDF reports using Google Gemini 3, triggered directly from a Google Drive folder. Perfect for fast AI-powered analysis of financial reports, charts, screenshots, or scanned documents. Includes setup instructions, troubleshooting tips, and a video tutorial link.                                                                                                                   | Full workflow description in Sticky Note3 node.                                                |
| Video walkthrough of workflow setup and execution: https://www.youtube.com/watch?v=UuWYT_uXiw0                                                                                                                                                                                                                                                                                                                                                                                                                      | Sticky Note4 contains the link and reference to the video tutorial.                            |
| Troubleshooting tips: Ensure Google Drive OAuth credential has read access; verify model IDs for Gemini 3; PDFs must contain selectable text for extraction to succeed; API limits and connectivity issues may affect AI nodes.                                                                                                                                                                                                                                                                                       | Mentioned in Sticky Note3.                                                                     |
| Supported image MIME types: `image/png`, `image/webp`. PDFs are detected by exclusion and processed separately.                                                                                                                                                                                                                                                                                                                                                                                                   | From Filter by Type node and workflow logic.                                                   |

---

**Disclaimer:**  
The provided content is extracted from an automated n8n workflow using publicly available, legal data and complies with all relevant content policies. No illegal, offensive, or protected data is processed.