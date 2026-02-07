Auto-Generate LinkedIn Posts from Google Drive Images using GPT-4o

https://n8nworkflows.xyz/workflows/auto-generate-linkedin-posts-from-google-drive-images-using-gpt-4o-7053


# Auto-Generate LinkedIn Posts from Google Drive Images using GPT-4o

### 1. Workflow Overview

This workflow automates the generation of LinkedIn posts from images stored in Google Drive using GPT-4o (via Azure OpenAI). It targets social media managers or content creators who want to streamline post creation by leveraging AI-generated text based on image content. The workflow is structured in logical blocks:

- **1.1 Input Reception:** Monitor Google Drive for new images.
- **1.2 Image Handling:** Download images and upload them to Cloudinary for hosting.
- **1.3 AI Text Generation:** Use Azure OpenAI GPT-4o model via LangChain to generate LinkedIn post text based on the uploaded images.
- **1.4 Output Delivery:** Send the generated post content via email for review or scheduling.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block listens for new files added or modified in Google Drive to trigger the workflow.

- **Nodes Involved:**  
  - Google Drive Trigger1

- **Node Details:**  
  - **Google Drive Trigger1**  
    - Type: Trigger node for Google Drive events  
    - Role: Watches Google Drive folder(s) for new or updated files to start the workflow  
    - Configuration: Default trigger settings (no filters explicitly set in JSON)  
    - Inputs: None (trigger node)  
    - Outputs: Passes file metadata to the next node  
    - Version: v1  
    - Edge Cases:  
      - No files detected (workflow does not trigger)  
      - Google Drive API auth errors (token expiration, permission denial)  
      - Network timeouts or quota limits

#### 2.2 Image Handling

- **Overview:**  
  Downloads the triggered files from Google Drive, then uploads them to Cloudinary for accessible hosting.

- **Nodes Involved:**  
  - Google Drive Download1  
  - upload frames to cloudinary

- **Node Details:**  
  - **Google Drive Download1**  
    - Type: Google Drive node  
    - Role: Downloads the actual file content from Google Drive based on trigger metadata  
    - Configuration: Default download action, no special parameters detailed  
    - Inputs: Receives file metadata from Google Drive Trigger1  
    - Outputs: Passes binary file data to Cloudinary upload node  
    - Version: v3 (improved file handling)  
    - Edge Cases:  
      - File not found or access revoked  
      - Large file size causing timeouts  
      - API rate limits or auth failures

  - **upload frames to cloudinary**  
    - Type: HTTP Request node  
    - Role: Uploads image binary data to Cloudinary cloud hosting service  
    - Configuration:  
      - Retries on failure up to 5 times  
      - Retry enabled to mitigate transient errors  
      - HTTP method and endpoint not shown but presumably POST to Cloudinary upload API  
    - Inputs: Receives binary image data from Google Drive Download1  
    - Outputs: Provides Cloudinary URL or upload response for AI processing  
    - Version: v4.2  
    - Edge Cases:  
      - Upload failure or timeout despite retries  
      - Invalid or expired Cloudinary credentials  
      - Network issues or API limits

#### 2.3 AI Text Generation

- **Overview:**  
  Generates LinkedIn post text by utilizing Azure OpenAI's GPT-4o model wrapped in a LangChain chain for prompt management.

- **Nodes Involved:**  
  - Azure OpenAI Chat Model  
  - Basic LLM Chain

- **Node Details:**  
  - **Azure OpenAI Chat Model**  
    - Type: LangChain language model node connected to Azure OpenAI Chat API  
    - Role: Provides the GPT-4o AI model interface, supports chat completions  
    - Configuration: Defaults, uses Azure OpenAI API credentials (must be preconfigured)  
    - Inputs: Receives prompt or data from prior steps (likely injected or from Cloudinary URL context)  
    - Outputs: Streams AI response to Basic LLM Chain  
    - Version: v1  
    - Edge Cases:  
      - API authentication failure or quota exceeded  
      - Model timeout or invalid prompt errors  
      - Malformed input data leading to generation errors

  - **Basic LLM Chain**  
    - Type: LangChain LLM Chain node  
    - Role: Manages prompt templates and chains AI model calls for generating the LinkedIn post text  
    - Configuration: Uses Azure OpenAI Chat Model as the language model node  
    - Inputs: Receives Cloudinary image URLs or metadata to form prompt context  
    - Outputs: Passes generated text to email sending node  
    - Version: v1.7  
    - Edge Cases:  
      - Expression or template evaluation failures  
      - Empty or malformed AI responses  
      - Dependency on Azure OpenAI node availability

#### 2.4 Output Delivery

- **Overview:**  
  Sends the generated LinkedIn post content via email for notification or further manual processing.

- **Nodes Involved:**  
  - Send email

- **Node Details:**  
  - **Send email**  
    - Type: Email Send node  
    - Role: Sends notification emails containing the AI-generated LinkedIn post content  
    - Configuration: No explicit parameters shown; must be configured with SMTP or service credentials  
    - Inputs: Receives text output from Basic LLM Chain  
    - Outputs: None (terminal node)  
    - Version: v2.1  
    - Edge Cases:  
      - SMTP authentication failure or misconfiguration  
      - Email delivery failure or spam filtering  
      - Missing or malformed email parameters (recipient, subject, body)

---

### 3. Summary Table

| Node Name               | Node Type                          | Functional Role                      | Input Node(s)           | Output Node(s)          | Sticky Note |
|-------------------------|----------------------------------|------------------------------------|-------------------------|-------------------------|-------------|
| Google Drive Trigger1    | Google Drive Trigger              | Detect new/updated files in Drive  | None                    | Google Drive Download1   |             |
| Google Drive Download1   | Google Drive                     | Download triggered files           | Google Drive Trigger1    | upload frames to cloudinary |             |
| upload frames to cloudinary | HTTP Request                   | Upload images to Cloudinary        | Google Drive Download1   | Basic LLM Chain         |             |
| Azure OpenAI Chat Model | LangChain Azure OpenAI Chat Model | Provide GPT-4o AI text generation  | None (connected in chain) | Basic LLM Chain (ai_languageModel input) |             |
| Basic LLM Chain          | LangChain LLM Chain              | Manage prompt and generate text    | upload frames to cloudinary, Azure OpenAI Chat Model | Send email               |             |
| Send email               | Email Send                      | Send generated post via email      | Basic LLM Chain          | None                    |             |
| Sticky Note              | Sticky Note                     | Comments/notes                     | None                    | None                    |             |
| Sticky Note1             | Sticky Note                     | Comments/notes                     | None                    | None                    |             |
| Sticky Note2             | Sticky Note                     | Comments/notes                     | None                    | None                    |             |
| Sticky Note3             | Sticky Note                     | Comments/notes                     | None                    | None                    |             |
| Sticky Note4             | Sticky Note                     | Comments/notes                     | None                    | None                    |             |
| Sticky Note5             | Sticky Note                     | Comments/notes                     | None                    | None                    |             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Drive Trigger node:**  
   - Type: Google Drive Trigger  
   - Configure with Google Drive OAuth2 credentials  
   - Set to watch for new or updated files in the target folder (optional: specify folder ID or file filters)  

2. **Create Google Drive node for download:**  
   - Type: Google Drive  
   - Configure to download the file received from the trigger node (using the file ID from the trigger)  
   - Connect output of Google Drive Trigger to this node’s input  

3. **Create HTTP Request node for Cloudinary upload:**  
   - Type: HTTP Request  
   - Configure as POST request to Cloudinary upload API endpoint  
   - Set authentication using Cloudinary API key and secret (usually in query params or headers)  
   - Map binary file data from Google Drive Download node to upload payload  
   - Enable retry on fail with max 5 attempts  
   - Connect output of Google Drive Download node to this node’s input  

4. **Create Azure OpenAI Chat Model node:**  
   - Type: LangChain Azure OpenAI Chat Model  
   - Configure with Azure OpenAI API key, endpoint, and deployment for GPT-4o  
   - No direct input connection (used internally by Basic LLM Chain)  

5. **Create Basic LLM Chain node:**  
   - Type: LangChain LLM Chain  
   - Set Azure OpenAI Chat Model node as its language model  
   - Build prompt template to generate LinkedIn post text using Cloudinary image URL from prior node output  
   - Connect output of ‘upload frames to cloudinary’ to Basic LLM Chain main input  
   - Connect Azure OpenAI Chat Model node as ai_languageModel input to Basic LLM Chain  

6. **Create Send Email node:**  
   - Type: Email Send  
   - Configure SMTP or email service credentials (e.g., Outlook OAuth2, SMTP server)  
   - Set recipient email address, subject (e.g., “Generated LinkedIn Post”), and map email body to Basic LLM Chain output text  
   - Connect Basic LLM Chain node output to Send Email node input  

7. **Connect nodes in sequence:**  
   - Google Drive Trigger → Google Drive Download → upload frames to cloudinary → Basic LLM Chain → Send Email  
   - Azure OpenAI Chat Model connected as ai_languageModel input to Basic LLM Chain  

8. **Test the workflow:**  
   - Upload an image in Google Drive monitored folder  
   - Confirm image is downloaded and uploaded to Cloudinary  
   - Confirm AI generates text post based on image URL  
   - Confirm email is sent with generated post content  

---

### 5. General Notes & Resources

| Note Content                                                                                      | Context or Link                                                                                   |
|--------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Workflow uses Azure OpenAI GPT-4o model via LangChain integration for AI text generation.        | Requires Azure OpenAI subscription and configured API credentials in n8n.                        |
| Cloudinary is used as an image hosting service to provide publicly accessible image URLs.        | Requires Cloudinary account and API credentials.                                                |
| Email sending requires properly configured SMTP or OAuth2 credentials depending on the provider. |                                                                                                 |
| This workflow can be adapted for other social platforms by modifying prompt templates.           |                                                                                                 |

---

**Disclaimer:** The provided text is exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects current content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.