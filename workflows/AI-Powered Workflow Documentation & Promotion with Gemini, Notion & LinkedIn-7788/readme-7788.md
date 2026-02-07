AI-Powered Workflow Documentation & Promotion with Gemini, Notion & LinkedIn

https://n8nworkflows.xyz/workflows/ai-powered-workflow-documentation---promotion-with-gemini--notion---linkedin-7788


# AI-Powered Workflow Documentation & Promotion with Gemini, Notion & LinkedIn

### 1. Workflow Overview

This workflow automates the documentation and promotion of n8n workflows by leveraging AI (Google Gemini) and integrations with Notion and LinkedIn. It targets creators and developers who want to generate rich descriptions and social media content for their n8n workflows automatically, then publish these documents for easy sharing and promotion.

The workflow is logically divided into three main blocks:

- **1.1 Input Reception & Preparation:** Watches a specific Google Drive folder for new n8n workflow JSON files, downloads, and prepares the data for AI processing.
- **1.2 AI-Powered Content Generation:** Uses Google Gemini AI to create a detailed description of the workflow and a LinkedIn post based on that description.
- **1.3 Output Publishing:** Creates a new page in Notion with the generated description and publishes the LinkedIn post to the user’s LinkedIn account.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Preparation

**Overview:**  
This block waits for a new n8n workflow JSON file upload in a designated Google Drive folder, downloads the file, and extracts JSON data to prepare it for AI-driven processing.

**Nodes Involved:**  
- wait for the json file upload  
- Download the json  
- prepare json to make it readable by AI  
- Sticky Note (explanatory)

**Node Details:**  

- **wait for the json file upload**  
  - Type: Google Drive Trigger  
  - Role: Watches a specific Google Drive folder for new files created every minute.  
  - Configuration: Folder ID set to "1u7gib8dTKdQo-ILpYCSm3o_xKr3ulagV" (the target folder containing n8n JSON files). Polling every minute.  
  - Input: Event-based trigger on file creation in the folder.  
  - Output: Metadata of the created file, including its ID.  
  - Credentials: Google Drive OAuth2 account.  
  - Potential Failures: Authentication issues, API rate limits, folder access permissions.  

- **Download the json**  
  - Type: Google Drive  
  - Role: Downloads the newly uploaded JSON file using the file ID from the trigger.  
  - Configuration: Uses the ID from the trigger node to download the file content.  
  - Input: File ID from the previous node.  
  - Output: Raw file content of the JSON workflow.  
  - Credentials: Same Google Drive OAuth2 account.  
  - Potential Failures: File not found, download errors, quota limits.  

- **prepare json to make it readable by AI**  
  - Type: Extract From File (JSON)  
  - Role: Parses the downloaded file content into a JSON object under the key "output" for further processing.  
  - Configuration: Operation set to parse JSON from file content.  
  - Input: Raw JSON string from the downloaded file.  
  - Output: Parsed JSON workflow data under `$json.output`.  
  - Potential Failures: Malformed JSON, empty files, parsing errors.  

- **Sticky Note**  
  - Role: Documentation for the block, explaining it waits for the JSON upload and prepares prompt data for AI.

---

#### 2.2 AI-Powered Content Generation

**Overview:**  
Generates a comprehensive natural language description of the n8n workflow and a professional LinkedIn post based on that description using Google Gemini AI.

**Nodes Involved:**  
- Generate the description (LangChain Agent)  
- Description generator (Google Gemini LM Chat)  
- Generate the linkedin post (LangChain Agent)  
- Linkedin post generator (Google Gemini LM Chat)  
- Sticky Notes (explanatory)

**Node Details:**  

- **Generate the description**  
  - Type: LangChain Agent (AI language model node)  
  - Role: Creates a detailed, structured description of the n8n workflow based on the parsed JSON.  
  - Configuration:  
    - Input Text: Prompt that includes the entire JSON workflow as stringified JSON from `$json.output`.  
    - System Message: A detailed template instructing to generate a full workflow description including use cases, features, setup steps, and limitations with exactly 10 "##" headings.  
  - Input: Parsed JSON workflow data.  
  - Output: AI-generated textual description of the workflow.  
  - Potential Failures: API quota limits, prompt formatting errors, large input size causing truncation.  

- **Description generator**  
  - Type: Google Gemini LM Chat node  
  - Role: Executes the AI model call underlying "Generate the description" node using Google Gemini (PaLM) API.  
  - Configuration: Uses configured Google Gemini API credentials.  
  - Input: Prompt from previous LangChain agent node.  
  - Output: AI response with the workflow description.  
  - Potential Failures: Authentication errors, network timeouts, API response errors.  

- **Generate the linkedin post**  
  - Type: LangChain Agent (AI language model node)  
  - Role: Transforms the generated workflow description into a concise, engaging, human-like LinkedIn post without mentions of AI.  
  - Configuration:  
    - Input Text: The previously generated workflow description.  
    - System Message: Template instructing to create a strong, engaging hook, maintain realism, and keep the post concise.  
  - Input: Workflow description text.  
  - Output: LinkedIn post content text.  
  - Potential Failures: API quota limits, prompt failures, content generation issues.  

- **Linkedin post generator**  
  - Type: Google Gemini LM Chat node  
  - Role: Executes the Google Gemini API call to generate the LinkedIn post text.  
  - Configuration: Uses the same Google Gemini API credentials.  
  - Input: Prompt from "Generate the linkedin post" node.  
  - Output: AI-generated LinkedIn post text.  
  - Potential Failures: Similar to the description generation node.  

- **Sticky Notes**  
  - "Generate the n8n description by gemini and create a notion database page." (context for this block)  
  - "Generate the linkedin post by gemini and post it to linkedin." (context for LinkedIn post generation)

---

#### 2.3 Output Publishing

**Overview:**  
Publishes the AI-generated description as a new page in a Notion database and posts the LinkedIn content to the user's LinkedIn account.

**Nodes Involved:**  
- Create the notion page  
- Create the linkedIn post  
- Sticky Note (Notion properties explanation)

**Node Details:**  

- **Create the notion page**  
  - Type: Notion (Database Page Creation)  
  - Role: Creates a new page in a specified Notion database with structured properties populated from the AI-generated description and file download link.  
  - Configuration:  
    - Database ID: "1cad2d11-ae09-80f9-a98e-dd820cd16e21" (target Notion database for templates)  
    - Title: Extracted from the first heading of the AI description (splitting by "## " and taking first line)  
    - Properties filled:  
      - "Automation Tools" set to "N8N" (select)  
      - "Description" filled with multiple lines extracted from the AI output sections (split by "## ")  
      - "Status" set to "Free" (select)  
      - "Template-Download-Link": URL from the Google Drive file webViewLink (uploaded JSON file)  
  - Input: AI-generated description text and Google Drive file link from the trigger node.  
  - Output: Confirmation of page creation with page details.  
  - Credentials: Notion API account.  
  - Potential Failures: Permissions error, database schema mismatch, missing required properties, API limits.  
  - Important Consideration: Notion database must have explicitly at least "Description" and "Template-Download-Link" properties configured before running.  

- **Create the linkedIn post**  
  - Type: LinkedIn node  
  - Role: Publishes the AI-generated LinkedIn post text on the user's LinkedIn account.  
  - Configuration:  
    - Text: The generated LinkedIn post content from the AI node.  
    - Person: Fixed user identifier "cVq9lEhq9r" (likely the authenticated user or page).  
  - Input: AI-generated LinkedIn post text.  
  - Output: Post creation confirmation or error.  
  - Credentials: LinkedIn OAuth2 account.  
  - Potential Failures: Authentication failure, LinkedIn API rate limits, content posting errors.  

- **Sticky Note3**  
  - Explains the required properties of the Notion database page for the node to work properly:  
    - Title, Status, Automation Tool, Template-Download-Link (mandatory), Video-Demo, Description (mandatory), Integrated with, Tags.  
  - Advises to add "Description" and "Template-Download-Link" properties before use.

---

### 3. Summary Table

| Node Name                     | Node Type                     | Functional Role                             | Input Node(s)                     | Output Node(s)                  | Sticky Note                                                                                                              |
|-------------------------------|-------------------------------|---------------------------------------------|----------------------------------|--------------------------------|--------------------------------------------------------------------------------------------------------------------------|
| wait for the json file upload  | Google Drive Trigger           | Watches folder for new JSON file uploads    | —                                | Download the json               | Wait for the upload of n8n's json blueprint on Google drive and prepare it to send as a prompt to the gemini              |
| Download the json              | Google Drive                  | Downloads the uploaded JSON file             | wait for the json file upload    | prepare json to make it readable by AI |                                                                                                                          |
| prepare json to make it readable by AI | Extract From File (JSON)        | Parses JSON content for AI consumption       | Download the json                | Generate the description         |                                                                                                                          |
| Generate the description       | LangChain Agent (AI)           | Generates detailed workflow description      | prepare json to make it readable by AI | Create the notion page, Generate the linkedin post | Generate the n8n description by gemini and create a notion database page.                                                |
| Description generator          | Google Gemini LM Chat          | Executes AI model call for description       | Generate the description         | —                              |                                                                                                                          |
| Create the notion page         | Notion Database Page           | Creates Notion page with description & metadata | Generate the description         | —                              | Notion page's properties: Title, Status, Automation Tool, Template-Download-Link (Must), Video-Demo, Description (Must), Integrated with, Tags. Must add Description and Template-Download-Link properties.  |
| Generate the linkedin post     | LangChain Agent (AI)           | Creates LinkedIn post text from description  | Generate the description         | Linkedin post generator          | Generate the linkedin post by gemini and post it to linkedin.                                                             |
| Linkedin post generator        | Google Gemini LM Chat          | Executes AI model call for LinkedIn post     | Generate the linkedin post       | Create the linkedIn post         |                                                                                                                          |
| Create the linkedIn post       | LinkedIn                      | Publishes LinkedIn post                       | Linkedin post generator          | —                              |                                                                                                                          |
| Sticky Note                   | Sticky Note                   | Documentation for input reception block      | —                                | —                              | Wait for the upload of n8n's json blueprint on Google drive and prepare it to send as a prompt to the gemini              |
| Sticky Note1                  | Sticky Note                   | Documentation for description generation block | —                                | —                              | Generate the n8n description by gemini and create a notion database page.                                                |
| Sticky Note2                  | Sticky Note                   | Documentation for LinkedIn post generation block | —                                | —                              | Generate the linkedin post by gemini and post it to linkedin.                                                             |
| Sticky Note3                  | Sticky Note                   | Documentation for Notion page properties      | —                                | —                              | Notion page's properties: Title, Status, Automation Tool, Template-Download-Link (Must), Video-Demo, Description (Must), Integrated with, Tags. Must add Description and Template-Download-Link properties. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n.**

2. **Add a Google Drive Trigger node:**
   - Name: `wait for the json file upload`
   - Event: `fileCreated`
   - Trigger on: `specificFolder`
   - Folder to watch: Set to the Google Drive folder ID where JSON files will be uploaded (`1u7gib8dTKdQo-ILpYCSm3o_xKr3ulagV`)
   - Polling interval: every minute
   - Credentials: Configure Google Drive OAuth2 credentials with read access to the folder.

3. **Add a Google Drive node:**
   - Name: `Download the json`
   - Operation: `download`
   - File ID: Use expression `={{ $json.id }}` from the trigger node
   - Credentials: Same Google Drive OAuth2 credentials
  
4. **Add an Extract From File node:**
   - Name: `prepare json to make it readable by AI`
   - Operation: `fromJson`
   - Destination Key: `output`
   - Input: Use the downloaded file content from the previous node

5. **Add a LangChain Agent node (or AI language model node):**
   - Name: `Generate the description`
   - Text prompt:  
     ```  
     Create a description for this n8n workflow:  
     {{ JSON.stringify($json.output) }}
     ```
   - System Message: Copy the detailed description template instructing to create a structured, 10-heading description of the workflow (as found in the original workflow, ensure to keep the "##" heading count to exactly 10).
   - Configure it to send the prompt to a Google Gemini LM Chat node.

6. **Add a Google Gemini LM Chat node:**
   - Name: `Description generator`
   - Credentials: Configure with Google Gemini (PaLM) API credentials
   - Connect input from `Generate the description` node

7. **Add a Notion node:**
   - Name: `Create the notion page`
   - Resource: `databasePage`
   - Database ID: Set to your Notion database ID for workflow templates (`1cad2d11-ae09-80f9-a98e-dd820cd16e21`)
   - Properties:  
     - Title: Extract the first heading from AI output using expression:  
       `={{ $json.output.split("\n\n")[0].replaceAll("## ", "") }}`
     - Automation Tools: Select "N8N"  
     - Description: Fill with the sections from AI output split by "##" headings (indices 1 to 10) as rich text  
     - Status: Select "Free"  
     - Template-Download-Link: Use the webViewLink URL from the Google Drive trigger node  
   - Credentials: Configure Notion API credentials with write access to the database

8. **Add a LangChain Agent node:**
   - Name: `Generate the linkedin post`
   - Text prompt:  
     ```
     transform this n8n description: "{{ $json.output }}" into an awesome LinkedIn post. Make the post hyper realistic, remove all sign of AI, so that audience can't even imagine that it is made by ai. Start the post with strong hook. Make the post engageable. Don't make the post so big, keep it concise.
     ```
   - System Message: Use the LinkedIn post template instructing engaging, natural tone without AI mentions.
   - Connect input from the output of `Generate the description`

9. **Add a Google Gemini LM Chat node:**
   - Name: `Linkedin post generator`
   - Credentials: Use the same Google Gemini (PaLM) API credentials
   - Connect input from `Generate the linkedin post`

10. **Add a LinkedIn node:**
    - Name: `Create the linkedIn post`
    - Text: Use expression `={{ $json.output }}` from the previous AI node  
    - Person: Use your LinkedIn person ID (e.g., `"cVq9lEhq9r"`)
    - Credentials: Configure LinkedIn OAuth2 credentials with permissions to post on your behalf

11. **Connect the nodes in order:**
    - `wait for the json file upload` → `Download the json` → `prepare json to make it readable by AI` → `Generate the description` → `Description generator` → `Create the notion page`
    - `Generate the description` → `Generate the linkedin post` → `Linkedin post generator` → `Create the linkedIn post`

12. **Add sticky notes as documentation at appropriate workflow sections for clarity.**

13. **Activate the workflow and test by uploading a valid n8n workflow JSON file to the watched Google Drive folder.**

---

### 5. General Notes & Resources

| Note Content                                                                                                          | Context or Link                                                                                      |
|-----------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| The workflow requires n8n version 1.95.2 or higher and the LangChain nodes package installed for AI integration.      | n8n version and package prerequisites                                                               |
| Google Gemini (PaLM) API key and credentials must be created and configured in n8n for AI nodes to function.           | https://aistudio.google.com                                                                        |
| Notion database must have at least the "Description" and "Template-Download-Link" properties configured prior.        | Notion setup instructions provided in Sticky Note3                                                 |
| LinkedIn OAuth2 credentials with posting permissions are required to publish posts automatically.                      | LinkedIn developer platform                                                                         |
| The AI-generated description uses a strict template with exactly 10 "##" level headings to ensure consistent parsing.| Important for splitting description content into Notion page properties                             |
| Video demo link referenced in the description template: https://youtu.be/qHQ62KoRGHc                                   | Useful for end users to understand workflow use                                                    |
| The workflow respects content policies and only processes legal, publicly available data.                             | Disclaimer                                                                                         |

---

**Disclaimer:** The text provided is exclusively generated by an automated workflow using n8n, a tool for integration and automation. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.