Auto-Generate LinkedIn Content with Gemini AI: Posts & Images 24/7

https://n8nworkflows.xyz/workflows/auto-generate-linkedin-content-with-gemini-ai--posts---images-24-7-7448


# Auto-Generate LinkedIn Content with Gemini AI: Posts & Images 24/7

---

### 1. Workflow Overview

This workflow automates the generation and posting of LinkedIn content using Google Gemini AI models, integrating with Google Sheets, Google Drive, and LinkedIn APIs. It continuously monitors a Google Sheet for new LinkedIn post titles marked as "pending", generates engaging posts and corresponding images, uploads the images, and publishes posts on LinkedIn. The workflow also updates the Google Sheet with the status and image URLs for tracking.

**Target Use Cases:**  
- Automated social media content creation and publishing for LinkedIn.  
- Marketing teams or individuals who want to scale LinkedIn content with AI-generated posts and images.  
- Continuous, scheduled monitoring and posting based on spreadsheet inputs.

**Logical Blocks:**  
- **1.1 Input Reception:** Polls Google Sheets for new pending post titles.  
- **1.2 Content Generation:** Uses Google Gemini AI (chat and image models) to generate LinkedIn posts and images.  
- **1.3 Image Handling:** Uploads generated images to Google Drive and shares them publicly.  
- **1.4 LinkedIn Posting:** Registers image uploads on LinkedIn, uploads images, and publishes posts with images.  
- **1.5 Status Updates:** Updates Google Sheets rows with post status and image URLs for tracking.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
This block watches a specific Google Sheet tab ("Posts") for new rows where the "Status" column is set to "pending". It triggers the workflow every minute to process new posts.

**Nodes Involved:**  
- Google Sheets Trigger  
- If  
- Limit

**Node Details:**  

- **Google Sheets Trigger**  
  - Type: Trigger node for Google Sheets  
  - Configuration: Polls the "Posts" sheet every minute; listens for new/updated rows.  
  - Key Parameters: Document ID and Sheet Name targeting the sheet with LinkedIn post titles.  
  - Outputs: New rows as items.  
  - Edge Cases: Authentication failures, API rate limits, network issues.  
  - Credential: Google Sheets OAuth2.

- **If**  
  - Type: Conditional node  
  - Configuration: Checks if the "Status" field equals "pending".  
  - Inputs: Output from Google Sheets Trigger  
  - Outputs: Passes only rows with Status = "pending" for further processing.  
  - Edge Cases: Missing or malformed Status values.

- **Limit**  
  - Type: Limit node  
  - Configuration: Limits the number of rows processed per run (default 1, no explicit limit set here, but node present for control).  
  - Inputs: Passed items from If node  
  - Outputs: Limited subset of rows to avoid overload.  
  - Edge Cases: No items passed; empty input.

---

#### 1.2 Content Generation

**Overview:**  
Generates LinkedIn post content using an AI agent powered by Google Gemini Chat Model. The AI is instructed to create engaging posts with specific formatting and style rules, based on the title provided from the sheet.

**Nodes Involved:**  
- Google Gemini Chat Model  
- AI Agent (LangChain agent node)  
- Structured Output Parser  
- Code

**Node Details:**  

- **Google Gemini Chat Model**  
  - Type: Language model node (Google Gemini)  
  - Configuration: No custom prompt; serves as backend to AI Agent.  
  - Credentials: Google Palm API (Google Gemini).  
  - Edge Cases: API limits, authentication errors.

- **AI Agent**  
  - Type: LangChain AI Agent node  
  - Configuration: Prompt instructs to create a LinkedIn post from title with: hook, 3-4 paragraphs, question, hashtags, emojis, JSON output with "title" and "post".  
  - Inputs: Item with LinkedIn Post Title from Limit node.  
  - Outputs: JSON with generated post content.  
  - Edge Cases: AI output format errors, prompt failures.

- **Structured Output Parser**  
  - Type: Output parser for AI responses  
  - Configuration: Validates AI output JSON schema (requires "title" string and "post" string).  
  - Inputs: AI Agent output.  
  - Edge Cases: Parsing failures if AI output deviates from schema.

- **Code**  
  - Type: Code node (JavaScript)  
  - Configuration: Replaces newline characters in the generated post text with escaped newline sequences to ensure JSON compatibility in later steps.  
  - Inputs: AI Agent output with post text.  
  - Outputs: Modified post text with escaped newlines.  
  - Edge Cases: Missing or malformed post field.

---

#### 1.3 Image Handling

**Overview:**  
Generates a custom image representing the LinkedIn post content using Google Gemini Image Generation, uploads the image to Google Drive, and shares the file publicly.

**Nodes Involved:**  
- Generate Image with Gemini  
- Upload file (Google Drive)  
- Share file (Google Drive)

**Node Details:**  

- **Generate Image with Gemini**  
  - Type: Google Gemini Image generation node  
  - Configuration: Generates a 16:9 high-resolution image depicting a modern Flutter development workspace, based on the AI-generated post text, with strict instructions not to include text in the image.  
  - Inputs: Post text from Code node.  
  - Credentials: Google Palm API (Google Gemini).  
  - Edge Cases: API rate limiting, image generation failures.

- **Upload file**  
  - Type: Google Drive node for file upload  
  - Configuration: Saves image to a specified Google Drive folder named "linkedin images", with dynamic timestamped filename and proper extension.  
  - Inputs: Binary image data from Generate Image node.  
  - Credentials: Google Drive OAuth2.  
  - Edge Cases: Permission errors, quota exceeded.

- **Share file**  
  - Type: Google Drive node for file sharing  
  - Configuration: Sets sharing permissions to "anyone with the link can view" for the uploaded image file.  
  - Inputs: Uploaded file ID from Upload file node.  
  - Credentials: Google Drive OAuth2.  
  - Edge Cases: Sharing permission errors.

---

#### 1.4 LinkedIn Posting

**Overview:**  
Prepares and publishes the LinkedIn post with the generated image. It registers the image upload with LinkedIn, uploads the image to LinkedIn's server, then creates a public post referencing the uploaded image.

**Nodes Involved:**  
- HTTP Request (Get LinkedIn User Info)  
- Register Image Upload  
- Download file (Google Drive)  
- Upload Image to LinkedIn  
- HTTP Request2 (Post LinkedIn UGC Post)

**Node Details:**  

- **HTTP Request (Get LinkedIn User Info)**  
  - Type: HTTP Request  
  - Configuration: Calls LinkedIn API to get the authenticated user's URN (unique resource identifier).  
  - Inputs: Triggered after image URL update.  
  - Authentication: LinkedIn HTTP header auth.  
  - Edge Cases: Auth failures, API limit errors.

- **Register Image Upload**  
  - Type: HTTP Request  
  - Configuration: Registers an image upload with LinkedIn's asset API, specifying content type and ownership.  
  - Inputs: User URN from previous HTTP Request node.  
  - Outputs: Upload URL and asset identifier.  
  - Edge Cases: API errors, invalid URN.

- **Download file**  
  - Type: Google Drive node (download)  
  - Configuration: Downloads the shared image file from Google Drive via its public URL.  
  - Inputs: Image URL from Google Sheets row update.  
  - Credentials: Google Drive OAuth2.  
  - Edge Cases: File not found, permission denied.

- **Upload Image to LinkedIn**  
  - Type: HTTP Request  
  - Configuration: Uploads binary image data to LinkedIn using the upload URL obtained from Register Image Upload.  
  - Inputs: Binary image from Download file node.  
  - Edge Cases: Upload failures, network errors.

- **HTTP Request2 (Post LinkedIn UGC Post)**  
  - Type: HTTP Request  
  - Configuration: Publishes a LinkedIn UGC post with the generated post content and the registered image asset. Post visibility is public.  
  - Inputs: Post text from Code node, image asset from Register Image Upload node, user URN.  
  - Authentication: LinkedIn HTTP header auth.  
  - Edge Cases: Post creation failures, invalid payload.

---

#### 1.5 Status Updates

**Overview:**  
Updates the Google Sheet rows to mark processed posts as "posted" and adds image URLs for reference.

**Nodes Involved:**  
- Update row in sheet1 (Update imageUrl)  
- Update row in sheet (Update Status)

**Node Details:**  

- **Update row in sheet1**  
  - Type: Google Sheets node (update operation)  
  - Configuration: Updates the current row with the publicly shared Google Drive image URL under "imageUrl" column.  
  - Inputs: Output of Share file node and original row ID.  
  - Credentials: Google Sheets OAuth2.  
  - Edge Cases: Sheet write conflicts.

- **Update row in sheet**  
  - Type: Google Sheets node (update operation)  
  - Configuration: Updates the current row's "Status" column to "posted" after LinkedIn post is successfully published.  
  - Inputs: Row ID and confirmation from LinkedIn post creation node.  
  - Credentials: Google Sheets OAuth2.  
  - Edge Cases: Write conflicts, missing row.

---

### 3. Summary Table

| Node Name               | Node Type                              | Functional Role                        | Input Node(s)                          | Output Node(s)                         | Sticky Note                                                                                                   |
|-------------------------|--------------------------------------|-------------------------------------|--------------------------------------|--------------------------------------|--------------------------------------------------------------------------------------------------------------|
| Google Sheets Trigger    | Google Sheets Trigger                 | Trigger on new pending LinkedIn post titles | None                                 | If                                   |                                                                                                              |
| If                      | If                                   | Filter rows where Status="pending"  | Google Sheets Trigger                | Limit                                |                                                                                                              |
| Limit                   | Limit                                | Limit number of rows processed      | If                                  | AI Agent                            |                                                                                                              |
| Google Gemini Chat Model | LangChain Google Gemini LM           | Backend AI model for post generation| AI Agent (ai_languageModel input)    | AI Agent (ai_languageModel output)   |                                                                                                              |
| AI Agent                | LangChain AI Agent                   | Generate LinkedIn post content      | Limit                               | Code                                 |                                                                                                              |
| Structured Output Parser | LangChain Output Parser              | Validate AI JSON output             | AI Agent                           | AI Agent (ai_outputParser output)    |                                                                                                              |
| Code                    | Code                                 | Escape newlines in post text        | AI Agent                           | Generate Image with Gemini             |                                                                                                              |
| Generate Image with Gemini | LangChain Google Gemini Image       | Generate LinkedIn post image        | Code                               | Upload file                          |                                                                                                              |
| Upload file             | Google Drive                         | Upload generated image to Drive     | Generate Image with Gemini           | Share file                           |                                                                                                              |
| Share file              | Google Drive                         | Share image publicly                 | Upload file                        | Update row in sheet1                  |                                                                                                              |
| Update row in sheet1    | Google Sheets                       | Update imageUrl in Google Sheet     | Share file                         | HTTP Request                        |                                                                                                              |
| HTTP Request            | HTTP Request                        | Get LinkedIn user URN               | Update row in sheet1                 | Register Image Upload                |                                                                                                              |
| Register Image Upload   | HTTP Request                        | Register image upload on LinkedIn   | HTTP Request                       | Download file                       |                                                                                                              |
| Download file           | Google Drive                       | Download image from Drive            | Register Image Upload               | Upload Image to LinkedIn            |                                                                                                              |
| Upload Image to LinkedIn| HTTP Request                        | Upload image binary to LinkedIn     | Download file                      | HTTP Request2                      |                                                                                                              |
| HTTP Request2           | HTTP Request                        | Publish LinkedIn post with image    | Upload Image to LinkedIn            | Update row in sheet                 |                                                                                                              |
| Update row in sheet     | Google Sheets                       | Mark post as "posted" in Google Sheet | HTTP Request2                    | None                               |                                                                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Sheets Trigger node**  
   - Trigger every minute on the Google Sheet with your LinkedIn post titles.  
   - Configure document ID and sheet name ("Posts").  
   - Use Google Sheets OAuth2 credential.

2. **Create an If node**  
   - Filter rows where the "Status" column equals "pending".  
   - Connect Google Sheets Trigger → If.

3. **Add a Limit node**  
   - Limit the number of rows processed per execution to avoid overload (default or desired max).  
   - Connect If (true output) → Limit.

4. **Add Google Gemini Chat Model node**  
   - Configure with Google Palm API credentials.  
   - No special prompt; used as backend for AI Agent.

5. **Add AI Agent node (LangChain agent)**  
   - Configure prompt to generate LinkedIn posts with instructions: hook, paragraphs, question, hashtags, emojis.  
   - Input expression to pass the post title from the sheet: `{{ $json['LinkedIn Post Title'] }}`.  
   - Connect Limit → AI Agent.  
   - Connect Google Gemini Chat Model as the language model input to AI Agent.

6. **Add Structured Output Parser node**  
   - Configure schema to require "title" and "post" strings in AI output JSON.  
   - Connect AI Agent output parser → Structured Output Parser.

7. **Add Code node**  
   - JavaScript: Escape newline characters in the post text for JSON compatibility.  
   - Connect AI Agent → Code.

8. **Add Generate Image with Gemini node**  
   - Use Google Palm API credentials.  
   - Prompt: Generate a high-quality, 16:9 image representing the post content with Flutter/mobile dev theme, no text in image.  
   - Connect Code → Generate Image with Gemini.

9. **Add Google Drive Upload node**  
   - Upload image binary to a specific Drive folder ("linkedin images").  
   - Dynamic file name with timestamp and extension.  
   - Use Google Drive OAuth2 credentials.  
   - Connect Generate Image with Gemini → Upload file.

10. **Add Google Drive Share node**  
    - Share uploaded image file with "anyone with link can view" permission.  
    - Connect Upload file → Share file.

11. **Add Google Sheets Update node (Update row in sheet1)**  
    - Update current row with the publicly shared image URL (`imageUrl`).  
    - Use row ID to match correct entry.  
    - Connect Share file → Update row in sheet1.

12. **Add HTTP Request node**  
    - GET LinkedIn user info endpoint (`https://api.linkedin.com/v2/userinfo`).  
    - Use LinkedIn HTTP header authentication credentials.  
    - Connect Update row in sheet1 → HTTP Request.

13. **Add HTTP Request node (Register Image Upload)**  
    - POST to LinkedIn asset API to register image upload.  
    - Owner set to "urn:li:person:" + user URN from previous node.  
    - Use LinkedIn credentials.  
    - Connect HTTP Request → Register Image Upload.

14. **Add Google Drive Download node**  
    - Download the shared image file from Google Drive using the public URL.  
    - Use Google Drive OAuth2 credentials.  
    - Connect Register Image Upload → Download file.

15. **Add HTTP Request node (Upload Image to LinkedIn)**  
    - POST binary image data to LinkedIn upload URL obtained from Register Image Upload node.  
    - Include proper Content-Type header from binary mimeType.  
    - Connect Download file → Upload Image to LinkedIn.

16. **Add HTTP Request node (Post LinkedIn UGC Post)**  
    - POST to LinkedIn UGC posts API to publish the post with image.  
    - Include author URN, post text, image asset URN, visibility as public.  
    - Use LinkedIn credentials.  
    - Connect Upload Image to LinkedIn → HTTP Request2.

17. **Add Google Sheets Update node (Update row in sheet)**  
    - Update row status to "posted" for the processed LinkedIn post.  
    - Use row ID from Limit node.  
    - Connect HTTP Request2 → Update row in sheet.

18. **Connect all nodes in the order above to ensure data flow and error handling**  
    - Set error handling as needed (e.g., continue on error where appropriate).

19. **Set credentials for all nodes requiring API access:**  
    - Google Sheets OAuth2  
    - Google Drive OAuth2  
    - Google Palm API (Google Gemini)  
    - LinkedIn HTTP header authentication

---

### 5. General Notes & Resources

| Note Content                                                                                              | Context or Link                                                                                                          |
|----------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------|
| The workflow integrates Google Gemini AI for both text and image generation, leveraging Google PaLM API. | Requires enabled Google PaLM API access and LinkedIn API credentials with appropriate permissions.                       |
| LinkedIn API interactions require OAuth2 header authentication configured in n8n credentials.            | https://developer.linkedin.com/docs/rest-api                                                                                 |
| Google Sheets is used as a CMS-like interface for scheduling LinkedIn posts.                              | Users can manage post titles and statuses ("pending", "posted") directly in the sheet.                                    |
| Images are stored and shared via Google Drive folder "linkedin images" for easy access and reuse.        | Drive folder ID used in Upload node; ensure folder permissions allow API access and sharing.                              |
| The AI prompt forbids special characters and double quotes in the LinkedIn post content for JSON safety. | Avoid special characters to prevent JSON parsing errors downstream.                                                      |

---

**Disclaimer:**  
The provided text is exclusively derived from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects applicable content policies and contains no illegal, offensive, or protected elements. All data handled is legal and publicly accessible.

---