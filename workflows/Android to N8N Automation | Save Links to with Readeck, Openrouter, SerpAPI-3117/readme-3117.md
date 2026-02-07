Android to N8N Automation | Save Links to with Readeck, Openrouter, SerpAPI

https://n8nworkflows.xyz/workflows/android-to-n8n-automation---save-links-to-with-readeck--openrouter--serpapi-3117


# Android to N8N Automation | Save Links to with Readeck, Openrouter, SerpAPI

### 1. Workflow Overview

This workflow automates the process of saving and organizing bookmarks sent from an Android device to a self-hosted Read Deck platform. It integrates AI-powered content analysis and tagging, URL and title extraction, and seamless API communication to create structured bookmarks with relevant metadata.

**Target Use Cases:**  
- Researchers, content creators, or users who want to save links quickly from Android devices.  
- Automatic tagging and organization of bookmarks using AI.  
- Centralized, searchable, and secure personal knowledge base management.

**Logical Blocks:**

- **1.1 Input Reception:** Receives incoming HTTP POST requests from Android devices containing URLs and titles.  
- **1.2 Content Extraction:** Extracts clean URL and title from raw input data.  
- **1.3 Validation:** Checks if extracted URL and title are present to proceed.  
- **1.4 AI-Powered Tagging:** Uses AI agents and SerpAPI to analyze the URL content and generate relevant tags.  
- **1.5 Bookmark Creation:** Sends the processed data to the Read Deck API to create a bookmark.  
- **1.6 Response Handling:** Sends success or failure responses back to the Android device.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  Listens for incoming HTTP POST requests from Android devices via a secured webhook endpoint. It authenticates requests using Basic Auth.

- **Nodes Involved:**  
  - Get Webhook Content

- **Node Details:**  
  - **Get Webhook Content**  
    - Type: Webhook (HTTP POST listener)  
    - Configuration:  
      - HTTP Method: POST  
      - Path: `/android`  
      - Authentication: Basic Auth (credentials configured)  
      - Response Mode: Response Node (delays response until workflow completes)  
    - Inputs: External HTTP POST request  
    - Outputs: JSON payload containing raw data from Android device  
    - Edge Cases:  
      - Authentication failure (invalid credentials)  
      - Missing or malformed POST data  
    - Notes: Entry point for the workflow

#### 1.2 Content Extraction

- **Overview:**  
  Extracts and cleans the URL and title from the raw data sent by the Android device, handling messy inputs from various apps.

- **Nodes Involved:**  
  - Extractor URL & Title

- **Node Details:**  
  - **Extractor URL & Title**  
    - Type: Information Extractor (AI-powered)  
    - Configuration:  
      - Input Text: Extracted from webhook JSON body at `body.data`  
      - Output Schema: JSON with `title` and `url` fields  
    - Inputs: Raw text from webhook node  
    - Outputs: Structured JSON with clean `title` and `url`  
    - Edge Cases:  
      - Input text missing or empty  
      - Extraction failure due to ambiguous or malformed input

#### 1.3 Validation

- **Overview:**  
  Checks if both title and URL were successfully extracted before proceeding.

- **Nodes Involved:**  
  - If Title and URL provided

- **Node Details:**  
  - **If Title and URL provided**  
    - Type: If (Conditional)  
    - Configuration:  
      - Condition: URL field is not empty  
    - Inputs: Output from Extractor URL & Title  
    - Outputs:  
      - True branch: Proceed to AI tagging  
      - False branch: Respond with failure message  
    - Edge Cases:  
      - Missing URL or title leads to early termination with error response

#### 1.4 AI-Powered Tagging

- **Overview:**  
  Uses AI agents and SerpAPI to analyze the URL content and generate relevant, human-readable tags for the bookmark.

- **Nodes Involved:**  
  - Content Tagging Agent  
  - SerpAPI  
  - Buffer Memory  
  - OpenRouter GPT 40 Mini  
  - Auto-fixing Output Parser  
  - Structured Output Parser

- **Node Details:**  
  - **Content Tagging Agent**  
    - Type: LangChain Agent (AI agent)  
    - Role: Orchestrates AI analysis and tag generation  
    - Configuration:  
      - Input: URL extracted earlier  
      - System Message: SEO analyst instructions to use SerpAPI for metadata retrieval and generate 2-3 natural language tags in Title Case  
      - Output Parser: Enabled for structured output  
      - On Error: Continue with regular output  
    - Inputs: URL from validation node  
    - Outputs: Tags array for bookmark creation  
    - Edge Cases:  
      - API rate limits or failures from SerpAPI or OpenRouter  
      - AI output parsing errors  
  - **SerpAPI**  
    - Type: LangChain Tool (Search API)  
    - Role: Fetches metadata, keywords, and search data for the URL  
    - Credentials: SerpAPI API key configured  
    - Inputs: URL from Content Tagging Agent  
    - Outputs: Search metadata for AI analysis  
    - Edge Cases: API quota exceeded, network errors  
  - **Buffer Memory**  
    - Type: LangChain Memory Buffer  
    - Role: Maintains context window for AI session keyed by Cloudflare Ray ID header  
    - Inputs: Session key from webhook headers  
    - Outputs: Context for AI agent  
  - **OpenRouter GPT 40 Mini**  
    - Type: LangChain Language Model (ChatGPT-4 via OpenRouter)  
    - Role: Processes AI prompts and responses  
    - Credentials: OpenRouter API key configured  
    - Inputs: Text from previous nodes  
    - Outputs: AI-generated content for tagging  
    - Edge Cases: API limits, timeouts  
  - **Auto-fixing Output Parser**  
    - Type: LangChain Output Parser  
    - Role: Attempts to auto-correct AI output to match expected schema  
    - Inputs: AI raw output  
    - Outputs: Corrected structured output  
  - **Structured Output Parser**  
    - Type: LangChain Output Parser  
    - Role: Validates output against JSON schema example for tags array  
    - Inputs: AI output  
    - Outputs: Final structured tags array  

#### 1.5 Bookmark Creation

- **Overview:**  
  Sends the extracted and AI-tagged bookmark data to the Read Deck API to create a new bookmark entry.

- **Nodes Involved:**  
  - Create Bookmark  
  - If Bookmark Created

- **Node Details:**  
  - **Create Bookmark**  
    - Type: HTTP Request  
    - Role: POST bookmark data to Read Deck API  
    - Configuration:  
      - URL: `https://readeck.agentsops.pro/api/bookmarks`  
      - Method: POST  
      - Authentication: HTTP Header Auth with API token  
      - Headers: Accept and Content-Type set to application/json  
      - Body Parameters: JSON with `title`, `url`, and `labels` (tags)  
    - Inputs: Tags from AI agent, title and URL from earlier nodes  
    - Outputs: API response with status and message  
    - Edge Cases:  
      - API authentication failure  
      - Network errors  
      - Invalid data causing API rejection  
  - **If Bookmark Created**  
    - Type: If (Conditional)  
    - Role: Checks if API response status is 202 and message confirms link submission  
    - Inputs: Response from Create Bookmark  
    - Outputs:  
      - True branch: Success response node  
      - False branch: Failure response node  

#### 1.6 Response Handling

- **Overview:**  
  Sends appropriate success or failure messages back to the Android device based on bookmark creation outcome or earlier validation.

- **Nodes Involved:**  
  - Bookmark Created  
  - Bookmark Not Created  
  - Title & URL Not Found

- **Node Details:**  
  - **Bookmark Created**  
    - Type: Respond to Webhook  
    - Role: Sends success text response  
    - Configuration:  
      - Response Body: Confirmation message of successful bookmark creation  
    - Inputs: True branch from If Bookmark Created  
  - **Bookmark Not Created**  
    - Type: Respond to Webhook  
    - Role: Sends failure text response for bookmark creation failure  
    - Inputs: False branch from If Bookmark Created  
  - **Title & URL Not Found**  
    - Type: Respond to Webhook  
    - Role: Sends failure text response when title or URL extraction fails  
    - Inputs: False branch from If Title and URL provided

---

### 3. Summary Table

| Node Name               | Node Type                              | Functional Role                      | Input Node(s)              | Output Node(s)               | Sticky Note                                                                                             |
|-------------------------|--------------------------------------|------------------------------------|----------------------------|-----------------------------|-------------------------------------------------------------------------------------------------------|
| Get Webhook Content      | Webhook                              | Receive Android POST requests      | External HTTP POST         | Extractor URL & Title        |                                                                                                       |
| Extractor URL & Title    | Information Extractor (LangChain)    | Extract clean URL and title        | Get Webhook Content         | If Title and URL provided    |                                                                                                       |
| If Title and URL provided| If (Conditional)                     | Validate presence of URL and title | Extractor URL & Title       | Content Tagging Agent, Title & URL Not Found |                                                                                                       |
| Content Tagging Agent    | LangChain Agent                     | AI tagging and content analysis    | If Title and URL provided   | Create Bookmark             |                                                                                                       |
| SerpAPI                 | LangChain Tool                      | Fetch URL metadata for AI          | Content Tagging Agent (tool)| Content Tagging Agent        |                                                                                                       |
| Buffer Memory           | LangChain Memory Buffer             | Maintain AI session context        | Content Tagging Agent (memory)| Content Tagging Agent      |                                                                                                       |
| OpenRouter GPT 40 Mini  | LangChain Language Model            | AI language model for tagging      | Content Tagging Agent       | Extractor URL & Title, Content Tagging Agent, Auto-fixing Output Parser |                                                                                                       |
| Auto-fixing Output Parser| LangChain Output Parser             | Auto-correct AI output             | OpenRouter GPT 40 Mini      | Content Tagging Agent        |                                                                                                       |
| Structured Output Parser | LangChain Output Parser             | Validate AI output schema          | Auto-fixing Output Parser   | Auto-fixing Output Parser    |                                                                                                       |
| Create Bookmark         | HTTP Request                       | Send bookmark data to Read Deck API| Content Tagging Agent       | If Bookmark Created          | Create bookmark on ReadDeck                                                                            |
| If Bookmark Created     | If (Conditional)                   | Check bookmark creation success   | Create Bookmark             | Bookmark Created, Bookmark Not Created |                                                                                                       |
| Bookmark Created        | Respond to Webhook                 | Success response to Android       | If Bookmark Created (true)  |                             |                                                                                                       |
| Bookmark Not Created    | Respond to Webhook                 | Failure response to Android       | If Bookmark Created (false) |                             |                                                                                                       |
| Title & URL Not Found   | Respond to Webhook                 | Failure response for missing data | If Title and URL provided (false) |                             |                                                                                                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Type: Webhook  
   - Name: Get Webhook Content  
   - HTTP Method: POST  
   - Path: `android`  
   - Authentication: Basic Auth (configure credentials with username/password)  
   - Response Mode: Response Node

2. **Create Information Extractor Node**  
   - Type: LangChain Information Extractor  
   - Name: Extractor URL & Title  
   - Input Text: `={{ $json.body.data }}` (extract from webhook JSON body)  
   - Schema: JSON with fields `title` (string) and `url` (string)

3. **Create If Node for Validation**  
   - Type: If  
   - Name: If Title and URL provided  
   - Condition: Check if `{{$json.output.url}}` is not empty (string not empty)

4. **Create LangChain Agent Node**  
   - Type: LangChain Agent  
   - Name: Content Tagging Agent  
   - Input Text: `={{ $json.output.url }}`  
   - System Message: SEO analyst instructions to use SerpAPI for metadata retrieval and generate 2-3 natural language tags in Title Case  
   - Enable Output Parser with JSON schema for tags array  
   - On Error: Continue regular output

5. **Create SerpAPI Tool Node**  
   - Type: LangChain Tool SerpAPI  
   - Name: SerpAPI  
   - Credentials: Configure SerpAPI API key  
   - Connect as AI tool to Content Tagging Agent

6. **Create Buffer Memory Node**  
   - Type: LangChain Memory Buffer  
   - Name: Buffer Memory  
   - Session Key: `={{ $('Get Webhook Content').item.json.headers['cf-ray'] }}`  
   - Context Window Length: 20  
   - Connect as AI memory to Content Tagging Agent

7. **Create OpenRouter GPT 40 Mini Node**  
   - Type: LangChain Language Model (OpenRouter GPT 4)  
   - Name: OpenRouter GPT 40 Mini  
   - Credentials: Configure OpenRouter API key  
   - Connect as AI language model to Extractor URL & Title, Content Tagging Agent, and Auto-fixing Output Parser

8. **Create Auto-fixing Output Parser Node**  
   - Type: LangChain Output Parser Autofixing  
   - Name: Auto-fixing Output Parser  
   - Connect as AI output parser to Content Tagging Agent

9. **Create Structured Output Parser Node**  
   - Type: LangChain Output Parser Structured  
   - Name: Structured Output Parser  
   - JSON Schema Example: `{ "tags": ["AI Apps", "Articles", "Github"] }`  
   - Connect as AI output parser to Auto-fixing Output Parser

10. **Create HTTP Request Node for Bookmark Creation**  
    - Type: HTTP Request  
    - Name: Create Bookmark  
    - Method: POST  
    - URL: `https://readeck.agentsops.pro/api/bookmarks`  
    - Authentication: HTTP Header Auth with API token (configure credentials)  
    - Headers: `accept: application/json`, `content-type: application/json`  
    - Body (JSON):  
      ```json
      {
        "labels": "={{ $json.output.tags }}",
        "title": "={{ $('If Title and URL provided').item.json.output.title }}",
        "url": "={{ $('Extractor URL & Title').item.json.output.url }}"
      }
      ```
    - Connect input from Content Tagging Agent

11. **Create If Node to Check Bookmark Creation**  
    - Type: If  
    - Name: If Bookmark Created  
    - Condition:  
      - Status equals 202 (number)  
      - Message equals "Link submited" (string)  
    - Connect input from Create Bookmark

12. **Create Respond to Webhook Node for Success**  
    - Type: Respond to Webhook  
    - Name: Bookmark Created  
    - Response Body: "Your bookmark has been successfully created! You can now easily access this content anytime from your bookmarks section."  
    - Connect input from If Bookmark Created (true branch)

13. **Create Respond to Webhook Node for Failure**  
    - Type: Respond to Webhook  
    - Name: Bookmark Not Created  
    - Response Body: "Bookmarking this content is not possible at the moment. Please try again later or check if bookmarking is supported for this type of content."  
    - Connect input from If Bookmark Created (false branch)

14. **Create Respond to Webhook Node for Missing Data**  
    - Type: Respond to Webhook  
    - Name: Title & URL Not Found  
    - Response Body: "Bookmarking this content is not possible at the moment. Please try again later or check if bookmarking is supported for this type of content."  
    - Connect input from If Title and URL provided (false branch)

15. **Connect Workflow**  
    - Get Webhook Content → Extractor URL & Title → If Title and URL provided  
    - If Title and URL provided (true) → Content Tagging Agent → Create Bookmark → If Bookmark Created → Bookmark Created / Bookmark Not Created  
    - If Title and URL provided (false) → Title & URL Not Found  
    - Configure AI tool, memory, language model, and output parser connections as per above

---

### 5. General Notes & Resources

| Note Content                                                                                                  | Context or Link                                                                                   |
|---------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Video tutorial demonstrating workflow usage and Android shortcut setup                                        | https://youtu.be/xveKt6dcWqc?si=7KN9eZoKqS7bKrqL                                                 |
| Read Deck platform for self-hosted bookmark management                                                        | https://readeck.org/en/                                                                           |
| HTTP Shortcuts Android app recommended for sending data to webhook                                            | https://play.google.com/store/apps/details?id=com.coffeebeanventures.httpshortcuts               |
| Ensure your self-hosted Read Deck instance is publicly accessible or use VPN for secure access                 | Security best practice                                                                            |
| AI tagging uses SEO analyst prompt to generate natural language tags, prioritizing readability and relevance  | Custom system prompt in Content Tagging Agent                                                    |
| Basic Auth protects webhook endpoint from unauthorized access                                                 | Credentials must be securely stored and managed                                                  |
| API tokens for SerpAPI and OpenRouter GPT 4 must be configured in n8n credentials                              | Avoid exposing keys publicly                                                                     |
| Error handling is minimal; consider adding notifications or retries for production use                         | Suggested enhancement                                                                             |

---

This document provides a complete, structured reference to understand, reproduce, and modify the "Android to N8N Automation | Save Links to with Readeck, Openrouter, SerpAPI" workflow. It covers all nodes, their roles, configurations, and integration points, enabling advanced users and AI agents to work effectively with this automation.