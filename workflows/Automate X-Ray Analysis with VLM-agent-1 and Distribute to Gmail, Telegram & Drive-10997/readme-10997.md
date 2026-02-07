Automate X-Ray Analysis with VLM-agent-1 and Distribute to Gmail, Telegram & Drive

https://n8nworkflows.xyz/workflows/automate-x-ray-analysis-with-vlm-agent-1-and-distribute-to-gmail--telegram---drive-10997


# Automate X-Ray Analysis with VLM-agent-1 and Distribute to Gmail, Telegram & Drive

### 1. Workflow Overview

This workflow, titled **Automate X-Ray Analysis with VLM-agent-1 and Distribute to Gmail, Telegram & Drive**, is designed to automate the analysis of medical X-ray images and efficiently distribute the diagnostic results. It targets medical staff or healthcare providers who need a streamlined process to analyze X-rays, identify abnormalities, and share results securely and promptly.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Capture X-ray image uploads via a form trigger.
- **1.2 AI Processing:** Send the uploaded X-ray image to the VLM Run medical AI model (`vlm-agent-1`) for detailed analysis and disease detection.
- **1.3 Result Extraction:** Extract the annotated image URL and diagnostic description from the AI output.
- **1.4 Result Distribution:**
  - **1.4.1 Email Dispatch:** Send the diagnostic report and annotated image to a configured medical email address via Gmail.
  - **1.4.2 Instant Messaging:** Deliver the analysis summary and annotated image to a Telegram chat.
  - **1.4.3 Secure Storage:** Upload the report and annotated image to Google Drive for centralized archival.

Each block is composed of specialized nodes configured to handle its dedicated function, with seamless data flow between them.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
This block captures X-ray image files uploaded via a web form. It acts as the entry point for the workflow.

**Nodes Involved:**  
- Upload X-Ray Image

**Node Details:**

- **Upload X-Ray Image**  
  - *Type:* Form Trigger  
  - *Role:* Receives user-submitted files through an HTTP form input.  
  - *Configuration:*  
    - Form title: "Upload your data to test RAG"  
    - Accepts files of type `.pdf` and `.csv` (Note: Despite the description, likely should accept image formats for X-rays, e.g., `.png`, `.jpg`—potential mismatch).  
    - Requires the file field named "data".  
  - *Input:* External HTTP request via form submission.  
  - *Output:* Binary file data passed downstream.  
  - *Edge Cases:*  
    - Unsupported file types may cause workflow failure downstream.  
    - Large file uploads may lead to timeouts.  
    - Missing required file field will prevent trigger activation.  

---

#### 1.2 AI Processing

**Overview:**  
This block processes the uploaded X-ray image using the VLM Run medical AI model, which analyzes the image for abnormalities and generates a diagnostic report along with an annotated image URL.

**Nodes Involved:**  
- Analyze X-Ray

**Node Details:**

- **Analyze X-Ray**  
  - *Type:* OpenAI-compatible AI node (LangChain OpenAI node)  
  - *Role:* Sends the uploaded image (in base64) to the `vlm-agent-1` model for X-ray analysis.  
  - *Configuration:*  
    - Model: `vlm-agent-1`  
    - Operation: analyze (image analysis mode)  
    - Input: base64-encoded image from previous form upload  
    - Prompt: Instructs the AI to detect and describe diseases, or mark as "Normal" if no disease is found. Also instructs to output an image URL in the response JSON.  
  - *Credentials:* OpenAI API key configured (credential ID referenced).  
  - *Input:* Binary/base64 image data.  
  - *Output:* JSON containing diagnostic description and annotated image URL.  
  - *Edge Cases:*  
    - API authentication failure.  
    - Timeout or slow response from AI model.  
    - Malformed or missing image input leading to analysis failure.  
    - Unexpected output format causing downstream extraction issues.

---

#### 1.3 Result Extraction

**Overview:**  
This block extracts the URL of the annotated X-ray image from the AI model’s output and prepares key fields for downstream use.

**Nodes Involved:**  
- Extract URL  
- Set Key  

**Node Details:**

- **Extract URL**  
  - *Type:* Code node (JavaScript)  
  - *Role:* Scans the AI model output JSON to find the annotated image URL starting with `"https://storage.googleapis.com"`.  
  - *Configuration:*  
    - Iterates over all string fields in the input JSON to find the first matching Google Cloud Storage URL using regex.  
    - Stores the found URL in a new field `storageLink`.  
  - *Input:* AI output JSON.  
  - *Output:* JSON with added `storageLink` field.  
  - *Edge Cases:*  
    - No URL found → outputs `null` in `storageLink` (downstream nodes must handle this case).  
    - Unexpected AI output structure may cause no match or false matches.  

- **Set Key**  
  - *Type:* Set node  
  - *Role:* Maps data fields to normalized keys for consistent use downstream.  
  - *Configuration:*  
    - Sets `Description` field from `$json.content` (diagnostic text).  
    - Sets `Output_Image` field from `$json.storageLink` (annotated image URL).  
  - *Input:* JSON with AI content and extracted URL.  
  - *Output:* JSON with standardized fields `Description` and `Output_Image`.  
  - *Edge Cases:*  
    - Missing or null `content` or `storageLink` fields may cause blank outputs.  

---

#### 1.4 Result Distribution

This block handles sending the diagnostic results via email, Telegram, and uploading to Google Drive. It’s subdivided below.

---

##### 1.4.1 Email Dispatch

**Overview:**  
Sends the diagnostic report and annotated image to a configured email address using Gmail.

**Nodes Involved:**  
- Convert to Report  
- Merge  
- Send Details  

**Node Details:**

- **Convert to Report**  
  - *Type:* Convert to File  
  - *Role:* Converts the diagnostic description text into a text file attachment.  
  - *Configuration:*  
    - Operation: `toText`  
    - Source property: dynamically set (from `Description`).  
  - *Input:* JSON with `Description` field.  
  - *Output:* Binary/text file for attachment.  
  - *Edge Cases:*  
    - Empty or missing description may yield empty file.  

- **Merge**  
  - *Type:* Merge node  
  - *Role:* Combines the converted report file and the downloaded annotated image binary for sending together.  
  - *Configuration:* Default merge (combines inputs from two sources).  
  - *Input:*  
    - Input 1: Converted report file.  
    - Input 2: Downloaded annotated image file.  
  - *Output:* Combined binary data for email and Telegram.  
  - *Edge Cases:*  
    - Mismatched data lengths or missing inputs cause incomplete merges.  

- **Send Details**  
  - *Type:* Gmail node  
  - *Role:* Sends an email containing the analysis report and annotated image as attachments.  
  - *Configuration:*  
    - Recipient: `mehediahamed@iut-dhaka.edu` (configured email).  
    - Subject: "Patient X Ray Analysis"  
    - Message body: Fixed text "Here is the Patient X Ray Analysis report-"  
    - Attachments: Uses the merged binary files from previous node.  
  - *Credentials:* Gmail OAuth2 credentials set up.  
  - *Input:* Merged files.  
  - *Output:* Email sent confirmation.  
  - *Edge Cases:*  
    - Authentication or quota limits on Gmail API.  
    - Invalid email addresses.  
    - Attachment size limits.

---

##### 1.4.2 Instant Messaging

**Overview:**  
Sends the annotated X-ray and summary report as a document to a Telegram chat for immediate notification.

**Nodes Involved:**  
- Send Details1  

**Node Details:**

- **Send Details1**  
  - *Type:* Telegram node  
  - *Role:* Sends a document message containing the diagnostic report and annotated image to a specified Telegram chat.  
  - *Configuration:*  
    - Chat ID: `1872183963` (target Telegram chat or channel).  
    - Operation: `sendDocument` with binary data attachment.  
  - *Credentials:* Telegram Bot API credentials configured.  
  - *Input:* Merged binary files (same as email attachments).  
  - *Output:* Telegram message sent confirmation.  
  - *Edge Cases:*  
    - Telegram API limits or rate limits.  
    - Invalid chat ID or bot permissions.  
    - Large file size causing message rejection.

---

##### 1.4.3 Secure Storage

**Overview:**  
Uploads the diagnostic report and annotated X-ray image to a designated Google Drive folder for secure storage and future reference.

**Nodes Involved:**  
- Download Analysis Image  
- Upload Report  

**Node Details:**

- **Download Analysis Image**  
  - *Type:* HTTP Request node  
  - *Role:* Downloads the annotated image from the URL extracted from the AI output.  
  - *Configuration:*  
    - URL: Dynamically set from `Output_Image` field.  
    - Method: GET (default).  
  - *Input:* JSON containing the URL.  
  - *Output:* Binary image data.  
  - *Edge Cases:*  
    - Broken or expired URL results in download failure.  
    - Network errors or timeouts.  

- **Upload Report**  
  - *Type:* Google Drive node  
  - *Role:* Uploads files to Google Drive folder named `test_data`.  
  - *Configuration:*  
    - Drive: "My Drive"  
    - Folder ID: `1S6baavqJn98MjUlbB6KtmARCWuWEekIZ` (specific folder)  
    - File name: "Patient Info" (applies to uploaded files)  
  - *Credentials:* Google Drive OAuth2 credentials configured.  
  - *Input:* Binary data (report and image) merged.  
  - *Output:* Confirmation of file upload.  
  - *Edge Cases:*  
    - Authentication failures.  
    - Insufficient permissions on the Drive folder.  
    - Large file size limits or quota exceedance.

---

### 3. Summary Table

| Node Name             | Node Type                 | Functional Role                            | Input Node(s)          | Output Node(s)          | Sticky Note                                                                                                                           |
|-----------------------|---------------------------|--------------------------------------------|------------------------|-------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| Upload X-Ray Image     | Form Trigger              | Receives uploaded X-ray file from user    | —                      | Analyze X-Ray           |                                                                                                                                       |
| Analyze X-Ray         | OpenAI-compatible AI node | Sends image to VLM-agent-1 for analysis   | Upload X-Ray Image      | Extract URL             |                                                                                                                                       |
| Extract URL           | Code                      | Extracts annotated image URL from AI output| Analyze X-Ray          | Set Key                 |                                                                                                                                       |
| Set Key               | Set                       | Maps description and image URL to keys    | Extract URL            | Convert to Report, Download Analysis Image | Sticky Note1: Describes sending to Gmail & Telegram and fields Description and Output_Image.                                        |
| Convert to Report     | Convert to File            | Converts description text to file          | Set Key                 | Merge                   | Sticky Note1: Details conversion for email and telegram sharing.                                                                       |
| Download Analysis Image| HTTP Request              | Downloads annotated image from URL         | Set Key                 | Merge                   | Sticky Note3: Notes GET request for output image download.                                                                             |
| Merge                 | Merge                     | Combines report file and image binary      | Convert to Report, Download Analysis Image | Send Details, Send Details1, Upload Report | Sticky Note1 and Sticky Note2: Merge is part of sending and uploading process.                                                         |
| Send Details          | Gmail                     | Sends email with report and image          | Merge                   | —                       | Sticky Note1: Part of sending to Gmail & Telegram.                                                                                     |
| Send Details1         | Telegram                  | Sends document message with report/image   | Merge                   | —                       | Sticky Note1: Part of sending to Gmail & Telegram.                                                                                     |
| Upload Report         | Google Drive              | Uploads report and image to Drive           | Merge                   | —                       | Sticky Note2: Details about uploading to Google Drive folder `test_data`.                                                              |
| Sticky Note           | Sticky Note               | Overview of entire workflow                  | —                      | —                       | Provides overall description of VLM Run Medical Assistant and required credentials.                                                   |
| Sticky Note1          | Sticky Note               | Explains Gmail & Telegram sending logic     | —                      | —                       | Describes Set node fields and messaging nodes.                                                                                        |
| Sticky Note2          | Sticky Note               | Explains Google Drive upload logic           | —                      | —                       | Explains Drive node functionality and storage approach.                                                                               |
| Sticky Note3          | Sticky Note               | Notes on downloading the output image        | —                      | —                       | Notes use of GET request to download image.                                                                                           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Form Trigger node** named `Upload X-Ray Image`.
   - Set form title: "Upload your data to test RAG".
   - Add a required file field labeled "data" accepting `.pdf` and `.csv` (consider updating to accept image formats like `.png`, `.jpg` if needed).
   - Save webhook URL for external access.

2. **Add an OpenAI-compatible AI node** named `Analyze X-Ray`.
   - Select resource: `image`, operation: `analyze`.
   - Set model ID to `vlm-agent-1`.
   - Configure input type as `base64`.
   - Provide prompt text instructing disease detection and output format (annotated image URL in JSON).
   - Connect credentials for OpenAI API.
   - Connect `Upload X-Ray Image` output to this node.

3. **Add a Code node** named `Extract URL`.
   - Paste JavaScript code that scans incoming JSON for a Google Storage URL matching `https://storage.googleapis.com` pattern.
   - Save extracted URL to a new field `storageLink`.
   - Connect output of `Analyze X-Ray` to this node.

4. **Add a Set node** named `Set Key`.
   - Map `Description` to `{{$json["content"]}}` (the AI diagnostic text).
   - Map `Output_Image` to `{{$json["storageLink"]}}`.
   - Connect output of `Extract URL` to this node.

5. **Add a Convert to File node** named `Convert to Report`.
   - Operation: `toText`.
   - Source property: dynamic input for `Description` field.
   - Connect output of `Set Key` to this node.

6. **Add an HTTP Request node** named `Download Analysis Image`.
   - Method: GET.
   - URL set dynamically to `{{$json["Output_Image"]}}`.
   - Connect output of `Set Key` to this node.

7. **Add a Merge node** named `Merge`.
   - Connect first input to `Convert to Report`.
   - Connect second input to `Download Analysis Image`.
   - Use default merge mode to combine binary data.

8. **Add a Gmail node** named `Send Details`.
   - Configure recipient email (e.g., `mehediahamed@iut-dhaka.edu`).
   - Subject: "Patient X Ray Analysis".
   - Message: "Here is the Patient X Ray Analysis report-".
   - Attach binary data from `Merge`.
   - Connect output of `Merge` to this Gmail node.
   - Attach Gmail OAuth2 credentials.

9. **Add a Telegram node** named `Send Details1`.
   - Operation: `sendDocument`.
   - Chat ID: `1872183963`.
   - Enable sending binary data.
   - Connect output of `Merge` to this node.
   - Attach Telegram Bot credentials.

10. **Add a Google Drive node** named `Upload Report`.
    - Set Drive to "My Drive".
    - Folder ID: `1S6baavqJn98MjUlbB6KtmARCWuWEekIZ` (adjust accordingly).
    - File name: "Patient Info".
    - Connect output of `Merge` to this node.
    - Attach Google Drive OAuth2 credentials.

11. **Connect `Send Details`, `Send Details1`, and `Upload Report` nodes** all from the output of the `Merge` node to enable parallel dispatch.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                              | Context or Link                                                                                                    |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| The workflow integrates **VLM Run medical AI** for automated X-ray analysis using an OpenAI-compatible model (`vlm-agent-1`).                            | Key component for medical image interpretation.                                                                   |
| Requires OAuth2 credentials for Gmail, Google Drive, and Telegram Bot API to function correctly.                                                         | Credential setup necessary within n8n.                                                                             |
| Sticky notes provide detailed explanations on data flow, node roles, and integration steps within the workflow.                                           | Visible inside the workflow for user guidance.                                                                     |
| Ensure uploaded files in the form trigger match expected image formats for X-ray analysis (possible mismatch with `.pdf, .csv` acceptance).               | May require workflow adjustment depending on actual input file types.                                             |
| For further information on integrating OpenAI-compatible nodes and VLM Run APIs, refer to official n8n documentation and VLM Run platform resources.     | https://n8n.io/integrations and https://vlm.run                                                                        |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This process fully complies with current content policies and contains no illegal, offensive, or protected material. All data processed is legal and public.