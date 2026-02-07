Automate n8n Workflow Documentation with Google Gemini AI and Telegram

https://n8nworkflows.xyz/workflows/automate-n8n-workflow-documentation-with-google-gemini-ai-and-telegram-11467


# Automate n8n Workflow Documentation with Google Gemini AI and Telegram

### 1. Workflow Overview

This workflow automates the generation of professional documentation and template-ready sticky notes for any n8n workflow JSON file sent via Telegram. It is designed to streamline the process of analyzing, scrubbing sensitive data, and documenting workflows through AI assistance (Google Gemini AI), and then returning the enhanced workflow files and guides back to the user via Telegram.

The workflow is logically divided into three main blocks:

- **1.1 Input & Validation**  
  Handles receiving the workflow file from Telegram, validating its type, extracting the JSON content, and scrubbing sensitive data.

- **1.2 AI Documentation Generation**  
  Processes the cleaned workflow JSON with Google Gemini AI to generate structured documentation, including main and section sticky notes, titles, tags, and security validation.

- **1.3 Template Assembly & Delivery**  
  Integrates AI output into the workflow file, intelligently positions documentation stickies, and sends the finalized template, checklist, and setup guide back to the user on Telegram.

---

### 2. Block-by-Block Analysis

#### 2.1 Input & Validation

**Overview:**  
This block receives the workflow JSON file from a Telegram message, verifies it is a file (not text), downloads it, extracts the JSON content, and scrubs sensitive information from the workflow data. It also analyzes the workflow structure to prepare for documentation generation.

**Nodes Involved:**  
- Telegram Trigger1  
- Check Input Type1 (If)  
- Send a text message1  
- Get a file1  
- Extract from File1  
- Scrub & Analyze Workflow  
- Input & Validation1 (Sticky Note)  
- Main Sticky1 (Sticky Note)

**Node Details:**

- **Telegram Trigger1**  
  - Type: Telegram Trigger  
  - Role: Entry point triggered by any Telegram message update.  
  - Config: Listens for "message" updates; always outputs data.  
  - Inputs: External Telegram webhook.  
  - Outputs: Passes message JSON to next node.  
  - Potential issues: Telegram webhook connectivity, invalid or unsupported message types.

- **Check Input Type1**  
  - Type: If  
  - Role: Checks if the incoming message contains a document (file).  
  - Config: Condition checks if `message.document` is not empty.  
  - Inputs: Output of Telegram Trigger1.  
  - Outputs:  
    - True: Proceed to download file.  
    - False: Send warning text message.  
  - Edge cases: Text messages instead of files trigger fallback message.

- **Send a text message1**  
  - Type: Telegram  
  - Role: Sends a warning message if input is not a file.  
  - Config: Text explains that workflows are too large for text and requests JSON file upload.  
  - Inputs: False branch of Check Input Type1.  
  - Outputs: None.  
  - Failure: Telegram API errors, chat ID extraction failure.

- **Get a file1**  
  - Type: Telegram  
  - Role: Downloads the attached workflow JSON file from Telegram servers.  
  - Config: Uses file ID from message.document.file_id, passes MIME type.  
  - Inputs: True branch of Check Input Type1.  
  - Outputs: Binary file data for extraction.  
  - Failure: File not found, Telegram API errors, file size issues.

- **Extract from File1**  
  - Type: Extract From File  
  - Role: Extracts JSON content from the downloaded file binary.  
  - Config: Operation set to "fromJson".  
  - Inputs: Output of Get a file1.  
  - Outputs: Parsed JSON workflow data.  
  - Failure: Invalid JSON, corrupted files.

- **Scrub & Analyze Workflow**  
  - Type: Code  
  - Role: Cleans sensitive data from the workflow JSON and performs structural analysis (node counts, positions, types).  
  - Config: Includes comprehensive JavaScript code to recursively scrub credentials, tokens, URLs, emails, phone numbers, and extract metadata like chat ID and original filename.  
  - Inputs: Extracted JSON from Extract from File1.  
  - Outputs: Scrubbed workflow JSON, workflow stringified JSON, chat ID, file name, analysis data (nodes count, triggers, actions, bounds).  
  - Failure: Unexpected input structure, JSON parsing errors, code runtime errors.  
  - Notes: Defensive programming to handle variable workflow formats and prevent infinite recursion.

- **Input & Validation1**  
  - Type: Sticky Note  
  - Role: Visual documentation block for this phase, titled "1. Input & Validation".  
  - Config: White sticky note with fixed size and content heading.  
  - Inputs: None (visual only).

- **Main Sticky1**  
  - Type: Sticky Note  
  - Role: Contains detailed description and setup instructions for the entire workflow.  
  - Config: Yellow sticky note with extensive markdown content explaining workflow purpose, setup, and customization.  
  - Inputs: None (visual only).

---

#### 2.2 AI Documentation Generation

**Overview:**  
This block sends the scrubbed workflow JSON to Google Gemini AI to generate structured professional documentation, including main and section sticky notes, title suggestions, tags, and validation results.

**Nodes Involved:**  
- Scrub & Analyze Workflow (output)  
- Google Gemini Chat Model  
- Structured Output Parser  
- AI Template Generator1  
- AI Documentation Generation1 (Sticky Note)

**Node Details:**

- **Google Gemini Chat Model**  
  - Type: Google Gemini AI Chat Model (LangChain)  
  - Role: Sends prompt and workflow data to Google Gemini AI for chat-based text generation.  
  - Config: Default options, no prompt override here (prompt embedded in AI Template Generator).  
  - Inputs: Output from Scrub & Analyze Workflow.  
  - Outputs: AI-generated raw response.  
  - Requirements: Valid Google PaLM API credentials, internet access.  
  - Failures: API quota exceeded, network errors, malformed prompts.

- **Structured Output Parser**  
  - Type: LangChain Structured Output Parser  
  - Role: Parses AI output to ensure it matches the expected JSON schema for documentation.  
  - Config: JSON schema example specifying main sticky, section stickies, title suggestions, tags, and validation results.  
  - Inputs: AI raw output from Google Gemini Chat Model.  
  - Outputs: Parsed structured JSON object.  
  - Failure: Parsing errors if AI output deviates from schema.

- **AI Template Generator1**  
  - Type: LangChain Chain LLM Node  
  - Role: Core AI prompt node that sends the cleaned workflow JSON to the AI with detailed instructions to generate the documentation JSON structure.  
  - Config:  
    - Prompt specifies:  
      - No markdown code blocks or HTML tags in output  
      - Clear professional English  
      - Tasks: generate main sticky note, section stickies (if 5+ nodes), metadata and validation  
      - Output schema strictly enforced  
  - Inputs: Scrub & Analyze Workflow output (with cleaned JSON and workflow string)  
  - Outputs: Structured AI-generated documentation JSON (via Structured Output Parser)  
  - Failures: AI model errors, prompt interpretation errors.

- **AI Documentation Generation1**  
  - Type: Sticky Note  
  - Role: Visual block naming this phase "2. AI Documentation Generation".  
  - Config: White sticky note with heading content only.  
  - Inputs: None.

---

#### 2.3 Template Assembly & Delivery

**Overview:**  
Integrates the AI-generated documentation into the original workflow by adding sticky notes with intelligent positioning. It then generates and sends back the finalized workflow file, a checklist summary, and a guide to the user via Telegram.

**Nodes Involved:**  
- AI Template Generator1 (output)  
- Assemble Final Template1 (Code)  
- Send Template File  
- Send Checklist1  
- Send Guide1  
- Template Assembly & Delivery1 (Sticky Note)

**Node Details:**

- **Assemble Final Template1**  
  - Type: Code  
  - Role:  
    - Deep clones the cleaned workflow JSON  
    - Removes existing documentation sticky notes (color 2 and 7)  
    - Adds main documentation sticky note from AI output positioned to the left of workflow nodes  
    - Groups and positions section sticky notes intelligently above node clusters based on their X coordinates  
    - Generates JSON file content as pretty-printed string with updated nodes including documentation  
    - Prepares checklist and guide texts summarizing validation and metadata  
  - Inputs:  
    - Cleaned workflow and analysis from Scrub & Analyze Workflow  
    - AI documentation JSON from AI Template Generator1  
    - Telegram trigger data for chat IDs  
  - Outputs: JSON with chat IDs, file name, checklist text, guide text, success flag, and binary data for JSON file to send  
  - Failures: Data invalidity, JSON parsing errors, positioning logic edge cases.

- **Send Template File**  
  - Type: Telegram  
  - Role: Sends the generated workflow template JSON file back to the user via Telegram.  
  - Config: Sends document with caption "🎉 Here is your standardized template:" using chat ID from Assemble Final Template1 output.  
  - Inputs: Binary data of JSON file from Assemble Final Template1.  
  - Failures: Telegram API upload errors, file size limits.

- **Send Checklist1**  
  - Type: Telegram  
  - Role: Sends a checklist message summarizing the template processing results.  
  - Config: Text from Assemble Final Template1 checklist output, chat ID from result JSON.  
  - Inputs: Output of Send Template File.  
  - Failures: Telegram message send errors.

- **Send Guide1**  
  - Type: Telegram  
  - Role: Sends a usage and setup guide message with title suggestions, description, and tags.  
  - Config: Text from Assemble Final Template1 guide output, chat ID from result JSON.  
  - Inputs: Output of Send Checklist1.  
  - Failures: Telegram message send errors.

- **Template Assembly & Delivery1**  
  - Type: Sticky Note  
  - Role: Visual block naming this phase "3. Template Assembly & Delivery".  
  - Config: White sticky note with heading content only.  
  - Inputs: None.

---

### 3. Summary Table

| Node Name                  | Node Type                              | Functional Role                               | Input Node(s)            | Output Node(s)                   | Sticky Note                                                                                              |
|----------------------------|--------------------------------------|-----------------------------------------------|--------------------------|---------------------------------|---------------------------------------------------------------------------------------------------------|
| Telegram Trigger1           | Telegram Trigger                     | Entry point; listens for Telegram messages    | External webhook         | Check Input Type1                |                                                                                                         |
| Check Input Type1           | If                                  | Validates if input is a workflow JSON file    | Telegram Trigger1        | Get a file1 (true), Send a text message1 (false) |                                                                                                         |
| Send a text message1        | Telegram                            | Sends warning if input is not a file           | Check Input Type1        | None                            |                                                                                                         |
| Get a file1                 | Telegram                            | Downloads the attached JSON file                | Check Input Type1        | Extract from File1               |                                                                                                         |
| Extract from File1          | Extract From File                   | Extracts JSON content from downloaded file     | Get a file1              | Scrub & Analyze Workflow        |                                                                                                         |
| Scrub & Analyze Workflow    | Code                               | Scrubs sensitive data, analyzes workflow       | Extract from File1       | Google Gemini Chat Model, AI Template Generator1 | Input & Validation block                                                                                  |
| Google Gemini Chat Model    | AI Language Model (Google Gemini)  | Sends data to Google Gemini AI for documentation | Scrub & Analyze Workflow | AI Template Generator1          | AI Documentation Generation block                                                                        |
| Structured Output Parser    | LangChain Output Parser             | Parses AI output to structured JSON             | Google Gemini Chat Model | AI Template Generator1          |                                                                                                         |
| AI Template Generator1      | LangChain Chain LLM                 | Generates documentation JSON from AI response  | Scrub & Analyze Workflow, Google Gemini Chat Model, Structured Output Parser | Assemble Final Template1         | AI Documentation Generation block                                                                        |
| Assemble Final Template1    | Code                               | Integrates AI docs into workflow, prepares files | AI Template Generator1, Scrub & Analyze Workflow, Telegram Trigger1 | Send Template File               | Template Assembly & Delivery block                                                                        |
| Send Template File          | Telegram                           | Sends the generated template JSON file to user | Assemble Final Template1 | Send Checklist1                 | Template Assembly & Delivery block                                                                        |
| Send Checklist1             | Telegram                           | Sends checklist summary message                  | Send Template File       | Send Guide1                    | Template Assembly & Delivery block                                                                        |
| Send Guide1                 | Telegram                           | Sends usage and setup guide message              | Send Checklist1          | None                           | Template Assembly & Delivery block                                                                        |
| Main Sticky1                | Sticky Note                       | Overall workflow description and setup notes    | None                     | None                           | Covers entire workflow with detailed description and setup instructions                                  |
| Input & Validation1         | Sticky Note                       | Visual block heading for input & validation     | None                     | None                           | Covers Input & Validation block                                                                           |
| AI Documentation Generation1| Sticky Note                       | Visual block heading for AI documentation phase | None                     | None                           | Covers AI Documentation Generation block                                                                  |
| Template Assembly & Delivery1| Sticky Note                      | Visual block heading for template assembly phase | None                     | None                           | Covers Template Assembly & Delivery block                                                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node**  
   - Type: Telegram Trigger  
   - Configure to listen for "message" updates (default).  
   - Set webhook ID or let n8n generate.  
   - Enable "Always Output Data".

2. **Add an If Node (Check Input Type1)**  
   - Check if `{{$json.message.document}}` is not empty (string condition).  
   - True branch: proceed with file processing.  
   - False branch: send warning message.

3. **Add Telegram Node (Send a text message1)**  
   - Operation: Send Message  
   - Chat ID: `{{$json.message.from.id}}`  
   - Text: Explain that text messages are not accepted; request JSON file upload.  
   - Connect from the false branch of the If node.

4. **Add Telegram Node (Get a file1)**  
   - Operation: Get File  
   - File ID: `{{$json.message.document.file_id}}`  
   - Set MIME type to `{{$json.message.document.mime_type}}`  
   - Connect from true branch of If node.

5. **Add Extract From File Node (Extract from File1)**  
   - Operation: From JSON  
   - Connect from Get a file1 output.

6. **Add Code Node (Scrub & Analyze Workflow)**  
   - Insert provided comprehensive JavaScript code that:  
     - Validates input format  
     - Recursively scrubs sensitive info (credentials, URLs, emails, tokens)  
     - Analyzes nodes for triggers, actions, spatial positioning  
     - Extracts metadata (chat ID, filename)  
   - Connect from Extract from File1 output.

7. **Add Google Gemini Chat Model Node**  
   - Type: Google Gemini Chat Model (LangChain)  
   - Configure Google PaLM API credentials.  
   - Connect input from Scrub & Analyze Workflow output.

8. **Add Structured Output Parser Node**  
   - Input a JSON schema example enforcing the documentation structure.  
   - Connect input from Google Gemini Chat Model output.

9. **Add LangChain Chain LLM Node (AI Template Generator1)**  
   - Paste the detailed AI prompt specifying tasks and output schema (no markdown blocks, no HTML, English only).  
   - Enable output parser (connect Structured Output Parser).  
   - Connect from Scrub & Analyze Workflow and Structured Output Parser.

10. **Add Code Node (Assemble Final Template1)**  
    - Paste the provided assembly JavaScript code that:  
      - Deep clones cleaned workflow  
      - Removes old documentation stickies  
      - Adds new main and section sticky notes in intelligent positions  
      - Generates JSON file and texts for checklist and guide  
    - Connect from AI Template Generator1 output.

11. **Add Telegram Node (Send Template File)**  
    - Operation: Send Document  
    - Chat ID: `{{$json.triggerChatId}}` from Assemble Final Template1 output  
    - Use binary data for the file (JSON)  
    - Caption: "🎉 Here is your standardized template:"  
    - Connect from Assemble Final Template1 output.

12. **Add Telegram Node (Send Checklist1)**  
    - Operation: Send Message  
    - Chat ID: `{{$json.result.chat.id}}` from Send Template File output  
    - Text: `{{$json.checklist}}` from Assemble Final Template1 output  
    - Connect from Send Template File output.

13. **Add Telegram Node (Send Guide1)**  
    - Operation: Send Message  
    - Chat ID: `{{$json.result.chat.id}}` from Send Checklist1 output  
    - Text: `{{$json.guide}}` from Assemble Final Template1 output  
    - Connect from Send Checklist1 output.

14. **Add Sticky Notes for Documentation**  
    - Create sticky notes named:  
      - Main Sticky1 (yellow, width 500, height 632) with detailed workflow description and setup instructions.  
      - Input & Validation1 (white, width 656, height 440) with heading "## 1. Input & Validation".  
      - AI Documentation Generation1 (white, width 832, height 440) with heading "## 2. AI Documentation Generation".  
      - Template Assembly & Delivery1 (white, width 864, height 440) with heading "## 3. Template Assembly & Delivery".  
    - Position stickies visually near related nodes.

15. **Set Credentials**  
    - Configure Telegram Trigger credentials (bot token).  
    - Configure Telegram API credentials for sending messages.  
    - Configure Google PaLM API credentials for Google Gemini Chat Model.

16. **Test Workflow**  
    - Upload an n8n workflow JSON file via Telegram as a document.  
    - Verify the workflow processes, scrubs data, generates documentation, and sends back the annotated template and messages.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                              | Context or Link                                                                                              |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| This workflow uses Google Gemini AI via the Google PaLM API for advanced natural language processing and structured output generation.                                                    | Google PaLM API documentation and access credentials                                                        |
| Workflow scrubs sensitive data including credentials, tokens, URLs, emails, and phone numbers to ensure no secrets are exposed in the documentation or returned files.                    | Important for security compliance                                                                            |
| The workflow includes detailed comments and error handling in code nodes to ensure robustness against malformed inputs and unexpected workflow structures.                              | See "Scrub & Analyze Workflow" and "Assemble Final Template1" node codes                                     |
| Telegram message size limits require workflows to be uploaded as files, not pasted as text; this is enforced and communicated by the workflow via Telegram messages.                      | Telegram message size limit: 4096 characters                                                                 |
| Sticky notes are used extensively to document phases visually within the n8n editor for easier understanding and maintenance.                                                              | Sticky notes: Main Sticky1, Input & Validation1, AI Documentation Generation1, Template Assembly & Delivery1  |
| For best results, customize the AI prompt in the "AI Template Generator1" node to match your documentation style or detail level preferences.                                            | AI prompt is in the node parameter "text"                                                                    |

---

**Disclaimer:** The text provided is derived exclusively from an automated n8n workflow using n8n integration and automation tools. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected material. All manipulated data is legal and public.