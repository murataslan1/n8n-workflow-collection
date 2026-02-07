Automate Research-Based Newsletters with Perplexity, GPT-4, and Image Generation

https://n8nworkflows.xyz/workflows/automate-research-based-newsletters-with-perplexity--gpt-4--and-image-generation-3862


# Automate Research-Based Newsletters with Perplexity, GPT-4, and Image Generation

### 1. Workflow Overview

This workflow automates the creation and distribution of research-based newsletters enriched with AI-generated content and images. It is designed for content creators and marketers who want to streamline newsletter production by leveraging AI for content generation, web research, and image creation, then sending personalized emails on a schedule.

The workflow is logically divided into the following blocks:

- **1.1 Scheduled Trigger & Topic Retrieval:** Automatically triggers the process on a set schedule and fetches the next unpublished newsletter topic from a Google Sheet.
- **1.2 Topic Status Update:** Marks the selected topic as published and records the publication date to prevent reuse.
- **1.3 AI Content & Image Prompt Generation:** Uses AI models combined with real-time web search to generate newsletter content and a detailed image prompt.
- **1.4 Image Generation & Storage:** Generates an image from the AI prompt using OpenAI's image generation API, converts it to a binary file, and uploads it to Google Cloud Storage.
- **1.5 Client List Retrieval:** Fetches client names and email addresses from a Google Sheet.
- **1.6 Newsletter Sending:** Merges client data with the generated content and image, then sends personalized newsletters via Gmail.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger & Topic Retrieval

- **Overview:** This block initiates the workflow on a predefined schedule and retrieves the first unpublished newsletter topic from the "Newsletter Topics" Google Sheet.
- **Nodes Involved:** Schedule Trigger, GetNewsletterTopic, GetFirstTopic

##### Nodes:

- **Schedule Trigger**
  - Type: Schedule Trigger
  - Role: Starts the workflow automatically based on a configured schedule (e.g., daily, weekly).
  - Configuration: User-defined schedule frequency.
  - Inputs: None (trigger node).
  - Outputs: Triggers GetNewsletterTopic node.
  - Edge Cases: Misconfiguration may cause no triggers or excessive runs.

- **GetNewsletterTopic**
  - Type: Google Sheets
  - Role: Reads the "Newsletter Topics" sheet to fetch all topics.
  - Configuration: Connects to Google Sheets with credentials; targets the specific sheet.
  - Inputs: Trigger from Schedule Trigger.
  - Outputs: Passes data to GetFirstTopic.
  - Edge Cases: Sheet access errors, empty or malformed data.

- **GetFirstTopic**
  - Type: Limit
  - Role: Limits the data to the first unpublished topic.
  - Configuration: Limits output to 1 item.
  - Inputs: Data from GetNewsletterTopic.
  - Outputs: Passes the selected topic to UpdateStatus.
  - Edge Cases: No unpublished topics available.

#### 2.2 Topic Status Update

- **Overview:** Updates the status of the selected newsletter topic to "published" and records the publication date to avoid duplication.
- **Nodes Involved:** UpdateStatus, Input

##### Nodes:

- **UpdateStatus**
  - Type: Google Sheets
  - Role: Updates the status and publication date fields in the "Newsletter Topics" sheet for the selected topic.
  - Configuration: Uses Google Sheets credentials; updates specific row based on topic ID.
  - Inputs: Topic data from GetFirstTopic.
  - Outputs: Passes control to Input node.
  - Edge Cases: Update failures due to permission issues or concurrent edits.

- **Input**
  - Type: Set
  - Role: Prepares or resets data for the next block.
  - Configuration: Empty parameters; likely used as a placeholder or to reset data.
  - Inputs: From UpdateStatus.
  - Outputs: Passes data to AI Agent.
  - Edge Cases: None significant.

#### 2.3 AI Content & Image Prompt Generation

- **Overview:** Core content creation block where AI generates newsletter text and a detailed image prompt based on the selected topic and web research.
- **Nodes Involved:** AI Agent, OpenAI Chat Model, Perplexity Search, Structured Output Parser1

##### Nodes:

- **AI Agent**
  - Type: LangChain Agent
  - Role: Orchestrates AI-driven content generation using OpenAI and Perplexity APIs.
  - Configuration: Configured with OpenAI Chat Model as language model and Perplexity Search as AI tool.
  - Inputs: Receives topic data from Input node.
  - Outputs: Passes generated content and image prompt to GPT Image Generation.
  - Key Expressions: Uses AI prompt templates combining topic and web search results.
  - Edge Cases: API key issues, rate limits, malformed prompts, or empty search results.

- **OpenAI Chat Model**
  - Type: LangChain OpenAI Chat Model
  - Role: Provides GPT-4 based language generation capabilities.
  - Configuration: Uses OpenAI API credentials.
  - Inputs: Connected as language model to AI Agent.
  - Outputs: Feeds generated text back to AI Agent.
  - Edge Cases: Authentication errors, API limits.

- **Perplexity Search**
  - Type: HTTP Request Tool
  - Role: Performs real-time web search to provide up-to-date context for AI content.
  - Configuration: Uses Perplexity API key.
  - Inputs: Connected as AI tool to AI Agent.
  - Outputs: Search results used by AI Agent.
  - Edge Cases: Network errors, API quota exceeded.

- **Structured Output Parser1**
  - Type: LangChain Structured Output Parser
  - Role: Parses AI Agent output into structured data (e.g., separating newsletter text and image prompt).
  - Configuration: Default structured parser settings.
  - Inputs: AI Agent output.
  - Outputs: Structured data for downstream nodes.
  - Edge Cases: Parsing failures if AI output format changes.

#### 2.4 Image Generation & Storage

- **Overview:** Generates an image from the AI-created prompt, converts it to a file, uploads it to Google Cloud Storage, and prepares the image URL for email inclusion.
- **Nodes Involved:** GPT Image Generation, Convert to Binary File, Google Cloud Storage 2, SetImageURL1

##### Nodes:

- **GPT Image Generation**
  - Type: HTTP Request
  - Role: Calls OpenAI image generation API with the detailed prompt.
  - Configuration: Uses OpenAI API credentials; sends prompt from AI Agent.
  - Inputs: Prompt from AI Agent.
  - Outputs: Image data (likely base64 or URL).
  - Edge Cases: API errors, invalid prompt, timeouts.

- **Convert to Binary File**
  - Type: Convert To File
  - Role: Converts image data into a binary file format suitable for upload.
  - Configuration: Default settings.
  - Inputs: Image data from GPT Image Generation.
  - Outputs: Binary file to Google Cloud Storage and GetClientList.
  - Edge Cases: Conversion failures if data malformed.

- **Google Cloud Storage 2**
  - Type: Google Cloud Storage
  - Role: Uploads the binary image file to Google Cloud Storage bucket.
  - Configuration: Uses Google Cloud credentials; target bucket specified.
  - Inputs: Binary file from Convert to Binary File.
  - Outputs: Passes file metadata to SetImageURL1.
  - Edge Cases: Permission errors, upload failures.

- **SetImageURL1**
  - Type: Set
  - Role: Sets or formats the public URL of the uploaded image for email embedding.
  - Configuration: Likely sets a variable with the image URL.
  - Inputs: Metadata from Google Cloud Storage.
  - Outputs: Passes data to Merge node.
  - Edge Cases: URL formatting errors.

#### 2.5 Client List Retrieval

- **Overview:** Retrieves the list of clients with their names and emails from the "Clients" Google Sheet.
- **Nodes Involved:** GetClientList

##### Nodes:

- **GetClientList**
  - Type: Google Sheets
  - Role: Reads client data from the "Clients" sheet.
  - Configuration: Uses Google Sheets credentials; targets specific sheet.
  - Inputs: From Convert to Binary File (parallel branch).
  - Outputs: Passes client data to Merge node.
  - Edge Cases: Empty client list, permission errors.

#### 2.6 Newsletter Sending

- **Overview:** Merges client data with generated newsletter content and image URL, then sends personalized emails via Gmail.
- **Nodes Involved:** Merge, SendNewsletter

##### Nodes:

- **Merge**
  - Type: Merge
  - Role: Combines client list and newsletter content/image data into one dataset for sending.
  - Configuration: Default merge mode (likely 'append' or 'merge by index').
  - Inputs: From SetImageURL1 (newsletter content + image URL) and GetClientList.
  - Outputs: Passes merged data to SendNewsletter.
  - Edge Cases: Mismatched data lengths, merge failures.

- **SendNewsletter**
  - Type: Gmail
  - Role: Sends personalized newsletter emails to each client.
  - Configuration: Uses Gmail OAuth2 credentials; email body is customizable HTML including AI-generated title, content, and embedded image URL.
  - Inputs: Merged client and newsletter data.
  - Outputs: None (end node).
  - Edge Cases: Authentication errors, email sending limits, invalid email addresses.

---

### 3. Summary Table

| Node Name             | Node Type                     | Functional Role                               | Input Node(s)           | Output Node(s)           | Sticky Note                          |
|-----------------------|-------------------------------|-----------------------------------------------|-------------------------|--------------------------|------------------------------------|
| Schedule Trigger      | Schedule Trigger              | Triggers workflow on schedule                  | None                    | GetNewsletterTopic       |                                    |
| GetNewsletterTopic    | Google Sheets                 | Retrieves all newsletter topics                | Schedule Trigger        | GetFirstTopic            |                                    |
| GetFirstTopic         | Limit                        | Limits to first unpublished topic              | GetNewsletterTopic      | UpdateStatus             |                                    |
| UpdateStatus          | Google Sheets                 | Updates topic status and publication date      | GetFirstTopic           | Input                    |                                    |
| Input                 | Set                          | Prepares data for AI processing                 | UpdateStatus            | AI Agent                 |                                    |
| AI Agent              | LangChain Agent              | Generates newsletter content and image prompt  | Input                   | GPT Image Generation     |                                    |
| OpenAI Chat Model     | LangChain OpenAI Chat Model  | Provides GPT-4 language model                   | Connected to AI Agent   | AI Agent                 |                                    |
| Perplexity Search     | HTTP Request Tool             | Performs web search for AI context              | Connected to AI Agent   | AI Agent                 |                                    |
| Structured Output Parser1 | LangChain Structured Output Parser | Parses AI output into structured data         | AI Agent                | AI Agent (continuation)  |                                    |
| GPT Image Generation  | HTTP Request                 | Generates image from AI prompt                   | AI Agent                | Convert to Binary File   |                                    |
| Convert to Binary File| Convert To File              | Converts image data to binary file               | GPT Image Generation    | GetClientList, Google Cloud Storage 2 |                                    |
| Google Cloud Storage 2| Google Cloud Storage         | Uploads image file to cloud storage              | Convert to Binary File  | SetImageURL1             |                                    |
| SetImageURL1          | Set                          | Sets public URL of uploaded image                | Google Cloud Storage 2  | Merge                    |                                    |
| GetClientList         | Google Sheets                 | Retrieves client names and emails                | Convert to Binary File  | Merge                    |                                    |
| Merge                 | Merge                        | Combines client data with newsletter content     | SetImageURL1, GetClientList | SendNewsletter          |                                    |
| SendNewsletter        | Gmail                        | Sends personalized newsletters via email        | Merge                   | None                     |                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n.**

2. **Add a "Schedule Trigger" node:**
   - Set the desired frequency (e.g., daily at 9 AM).
   - This node will start the workflow.

3. **Add a "Google Sheets" node named "GetNewsletterTopic":**
   - Connect it to the Schedule Trigger.
   - Configure credentials for Google Sheets.
   - Set it to read from the "Newsletter Topics" sheet.
   - Retrieve all rows to find unpublished topics.

4. **Add a "Limit" node named "GetFirstTopic":**
   - Connect it to "GetNewsletterTopic".
   - Set limit to 1 to select the first unpublished topic.

5. **Add a "Google Sheets" node named "UpdateStatus":**
   - Connect it to "GetFirstTopic".
   - Configure to update the selected topic row:
     - Set status to "published".
     - Set publication date to current date.
   - Use Google Sheets credentials.

6. **Add a "Set" node named "Input":**
   - Connect it to "UpdateStatus".
   - Leave parameters empty or use it to reset/prepare data for AI processing.

7. **Add a "LangChain Agent" node named "AI Agent":**
   - Connect it to "Input".
   - Configure with:
     - Language Model: Add a "LangChain OpenAI Chat Model" node configured with OpenAI API credentials.
     - AI Tool: Add a "HTTP Request Tool" node configured for Perplexity Search API.
   - Set prompt templates to generate newsletter content and detailed image prompt based on the topic and web search results.

8. **Add a "LangChain Structured Output Parser" node:**
   - Connect it as the output parser for "AI Agent".
   - Use default structured output parsing to separate newsletter text and image prompt.

9. **Add an "HTTP Request" node named "GPT Image Generation":**
   - Connect it to "AI Agent".
   - Configure to call OpenAI's image generation API.
   - Use the detailed image prompt from AI Agent output.
   - Use OpenAI API credentials.

10. **Add a "Convert To File" node named "Convert to Binary File":**
    - Connect it to "GPT Image Generation".
    - Convert the image data to a binary file.

11. **Add a "Google Cloud Storage" node named "Google Cloud Storage 2":**
    - Connect it to "Convert to Binary File".
    - Configure with Google Cloud credentials.
    - Set target bucket for image upload.

12. **Add a "Set" node named "SetImageURL1":**
    - Connect it to "Google Cloud Storage 2".
    - Set a variable with the public URL of the uploaded image for embedding in emails.

13. **Add a "Google Sheets" node named "GetClientList":**
    - Connect it also to "Convert to Binary File" (parallel branch).
    - Configure with Google Sheets credentials.
    - Read client names and email addresses from the "Clients" sheet.

14. **Add a "Merge" node:**
    - Connect inputs from "SetImageURL1" and "GetClientList".
    - Configure to merge client data with newsletter content and image URL.

15. **Add a "Gmail" node named "SendNewsletter":**
    - Connect it to "Merge".
    - Configure Gmail OAuth2 credentials.
    - Set up the email:
      - To: client email from merged data.
      - Subject: AI-generated newsletter title.
      - Body: Customizable HTML including newsletter content and embedded image URL.
    - Enable sending emails to all clients.

16. **Test the workflow end-to-end.**

17. **Optional:** Enable and configure the "Tavily WebSearch" node if preferred over Perplexity.

---

### 5. General Notes & Resources

| Note Content                                                                                   | Context or Link                                                                                     |
|------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| Setup tutorial document and video guidance are included for connecting n8n with Google products and Google Cloud Storage. | Refer to included tutorial doc and videos for detailed setup instructions.                         |
| Customize AI prompts in the "AI Agent" node to tailor newsletter style and tone.                | Allows personalization of newsletter content generation.                                          |
| Email body HTML in "SendNewsletter" node is fully customizable for branding and layout.         | Modify to match your newsletter design preferences.                                               |
| This workflow is ideal for marketers and content creators automating newsletter creation.        | Use case context.                                                                                  |
| Consider API rate limits and quota management for OpenAI and Perplexity APIs to avoid failures. | Important for stable operation.                                                                   |
| Google Sheets must have proper structure and access permissions for "Newsletter Topics" and "Clients" sheets. | Critical for data retrieval and updates.                                                         |

---

This detailed reference document enables understanding, reproduction, and modification of the workflow, anticipating potential issues and integration points.