Auto-Translate YouTube Video Content with Google Gemini AI

https://n8nworkflows.xyz/workflows/auto-translate-youtube-video-content-with-google-gemini-ai-9543


# Auto-Translate YouTube Video Content with Google Gemini AI

### 1. Workflow Overview

This workflow automates the translation of YouTube video titles and descriptions into multiple languages using Google Gemini AI (PaLM). It targets content creators aiming to expand their audience reach by localizing video metadata. The workflow fetches video information, determines target languages excluding the default, translates content via AI, updates YouTube localizations, and outputs a direct URL to the video’s translations page.

The workflow is logically divided into these main blocks:

- **1.1 Initialization and Input Setup**: Defines the target video ID and desired translation languages. Triggered manually to start the process.
- **1.2 Fetching Video Data and Language Preparation**: Retrieves current video metadata from YouTube and extracts the default language and target languages.
- **1.3 AI Translation Processing**: Uses Google Gemini Chat Model with LangChain agent to translate title and description into specified languages and suggest tags.
- **1.4 Updating YouTube Localizations**: Sends translated metadata back to YouTube via API to update video localizations.
- **1.5 Output and User Feedback**: Sets an output URL directing the user to the YouTube Studio translations page for the video.

---

### 2. Block-by-Block Analysis

#### 1.1 Initialization and Input Setup

- **Overview:**  
  Starts the workflow manually and defines the video ID and language codes for translation.

- **Nodes Involved:**  
  - When clicking 'Execute workflow'  
  - Defines Video ID and Languages  
  - Sticky Note2 (label for this block)

- **Node Details:**

  - **When clicking 'Execute workflow'**  
    - Type: Manual Trigger  
    - Role: Entry point to initiate the workflow manually.  
    - Config: No parameters; simply triggers workflow execution.  
    - Inputs: None  
    - Outputs: Connects to Defines Video ID and Languages  
    - Failure cases: None typical; workflow fails if no video ID defined downstream.

  - **Defines Video ID and Languages**  
    - Type: Set node  
    - Role: Sets JSON containing the YouTube video ID and a dictionary of languages with their codes.  
    - Config: JSON raw mode with keys:  
      ```json
      {
        "video": "REPLACEME",
        "languages": {
          "english": "en",
          "spanish": "es-419",
          "japanese": "ja"
        }
      }
      ```  
      - User must replace `"REPLACEME"` with actual YouTube video ID before execution.  
    - Inputs: From manual trigger  
    - Outputs: To Fetches video information  
    - Failure cases: Missing or incorrect video ID causes downstream API errors.

  - **Sticky Note2**  
    - Type: Sticky Note  
    - Role: Visual label "Set and Retrieve Information" to indicate this block's purpose.  
    - Inputs/Outputs: None

---

#### 1.2 Fetching Video Data and Language Preparation

- **Overview:**  
  Retrieves YouTube video metadata and determines languages to translate to, excluding the video's default language.

- **Nodes Involved:**  
  - Fetches video information  
  - Check languages to translate  
  - Sticky Note (label for this block)

- **Node Details:**

  - **Fetches video information**  
    - Type: YouTube node (YouTube API)  
    - Role: Fetches video metadata using YouTube OAuth2 credentials.  
    - Config:  
      - Operation: Get video resource  
      - Video ID: Expression `={{ $json.video }}` from previous node  
    - Inputs: From Defines Video ID and Languages  
    - Outputs: To Check languages to translate  
    - Credentials: YouTube OAuth2 API (authenticated user account)  
    - Failure cases:  
      - Invalid video ID or permissions cause HTTP 404/403 errors  
      - API quota exceeded errors possible

  - **Check languages to translate**  
    - Type: Code node (JavaScript)  
    - Role: Extracts the video's default language and filters out that language from the list of requested translation languages.  
    - Config:  
      - Reads defaultLanguage from fetched video snippet (defaults to 'en' if missing)  
      - Retrieves language mapping from "Defines Video ID and Languages" node  
      - Filters out default language from translation list  
      - Outputs JSON with:  
        ```json
        {
          "defaultLang": "...",
          "languages": ["spanish","japanese"],
          "keys": {"spanish": "es-419", "japanese": "ja"}
        }
        ```  
    - Inputs: From Fetches video information  
    - Outputs: To AI Agent Translator  
    - Failure cases:  
      - Missing or malformed input JSON could cause runtime errors  
      - If default language not present in mapping, logic gracefully defaults to 'en'

  - **Sticky Note**  
    - Type: Sticky Note  
    - Role: Label "Language Translation" for this block  
    - Inputs/Outputs: None

---

#### 1.3 AI Translation Processing

- **Overview:**  
  Invokes Google Gemini AI via LangChain agent to translate video title and description into target languages and optionally suggest tags.

- **Nodes Involved:**  
  - Google Gemini Chat Model1  
  - Simple Memory  
  - Structured Output Parser  
  - AI Agent Translator  
  - Sticky Note (label for this block)

- **Node Details:**

  - **Google Gemini Chat Model1**  
    - Type: LangChain Google Gemini Chat Model node  
    - Role: Provides underlying AI language model for LangChain agent.  
    - Config: Uses default options, no special parameters.  
    - Inputs: Connected as language model source for AI Agent Translator  
    - Outputs: To AI Agent Translator  
    - Credentials: Google Palm API credentials required  
    - Failure cases:  
      - API key invalid or quota exceeded causes errors  
      - Network timeouts possible

  - **Simple Memory**  
    - Type: LangChain memory buffer window  
    - Role: Maintains conversation session memory keyed to "chat" session.  
    - Config: Uses custom session key "chat"  
    - Inputs: AI Agent Translator (ai_memory)  
    - Outputs: AI Agent Translator  
    - Failure cases: Rare; memory corruption or missing session may cause inconsistent context

  - **Structured Output Parser**  
    - Type: LangChain structured output parser  
    - Role: Parses AI output enforcing a JSON structure with fields "title", "description", and "tags" as objects.  
    - Config: Manual JSON schema definition specifying expected output format.  
    - Inputs: AI Agent Translator (ai_outputParser)  
    - Outputs: AI Agent Translator  
    - Failure cases:  
      - AI output not matching schema causes parse failure and retries

  - **AI Agent Translator**  
    - Type: LangChain agent node  
    - Role: Core translation agent that sends prompt to AI model, receives structured translation output.  
    - Config:  
      - Text prompt dynamically built with:  
        - Default language and target languages from previous code node  
        - Video title and description from fetched video info  
        - Request to suggest tags  
        - Instruction to return JSON with language keys mapping to translated title and description  
      - Prompt type: Define  
      - Output parser enabled (Structured Output Parser)  
      - Retry enabled with max 2 tries and 5 seconds delay  
    - Inputs:  
      - AI language model from Google Gemini Chat Model1  
      - AI memory from Simple Memory  
      - AI output parser from Structured Output Parser  
      - Main input from Check languages to translate  
    - Outputs: To Updates Video Localization  
    - Failure cases:  
      - AI model errors or rate limits  
      - Output parsing failures  
      - Network timeouts

  - **Sticky Note**  
    - Type: Sticky Note  
    - Role: Label "AI Processing" or related (not explicitly named, but implied)  
    - Inputs/Outputs: None

---

#### 1.4 Updating YouTube Localizations

- **Overview:**  
  Updates the YouTube video’s localization metadata with the translated titles and descriptions.

- **Nodes Involved:**  
  - Updates Video Localization  
  - Sticky Note1 (label for this block)

- **Node Details:**

  - **Updates Video Localization**  
    - Type: HTTP Request  
    - Role: Sends HTTP PUT request to YouTube Data API to update video snippet and localizations.  
    - Config:  
      - URL: `https://www.googleapis.com/youtube/v3/videos?part=snippet,localizations`  
      - Method: PUT  
      - Body (JSON):  
        ```json
        {
          "id": "<video id>",
          "snippet": {
            "defaultLanguage": "<defaultLang>",
            "title": "<original title>",
            "description": "<original description>",
            "categoryId": "<categoryId>",
            "tags": "<tags>"
          },
          "localizations": "<AI Agent Translator output JSON translations>"
        }
        ```  
        Values dynamically pulled from previous nodes.  
      - Headers: Content-Type application/json  
      - Authentication: YouTube OAuth2 API credentials (same as Fetches video information)  
    - Inputs: From AI Agent Translator  
    - Outputs: To Output URL  
    - Failure cases:  
      - API quota exceeded or permission issues cause HTTP errors  
      - Malformed JSON or missing fields cause 400 errors

  - **Sticky Note1**  
    - Type: Sticky Note  
    - Role: Label "Update Localization and Return YouTube URL"  
    - Inputs/Outputs: None

---

#### 1.5 Output and User Feedback

- **Overview:**  
  Provides a direct URL to the YouTube Studio translation management page for the updated video.

- **Nodes Involved:**  
  - Output URL

- **Node Details:**

  - **Output URL**  
    - Type: Set node  
    - Role: Constructs a string URL directing user to YouTube Studio translations page of the video.  
    - Config: String assignment:  
      ```
      https://studio.youtube.com/video/{{ video_id }}/translations
      ```  
      Where `video_id` is taken from “Fetches video information” node JSON.  
    - Inputs: From Updates Video Localization  
    - Outputs: Workflow output  
    - Failure cases: If video ID missing or invalid, URL will be incomplete or wrong.

---

### 3. Summary Table

| Node Name                   | Node Type                                  | Functional Role                          | Input Node(s)                     | Output Node(s)                | Sticky Note                                             |
|-----------------------------|--------------------------------------------|----------------------------------------|----------------------------------|------------------------------|---------------------------------------------------------|
| When clicking 'Execute workflow' | Manual Trigger                            | Manual start trigger                    | None                             | Defines Video ID and Languages |                                                         |
| Defines Video ID and Languages | Set                                        | Define video ID and target languages   | When clicking 'Execute workflow' | Fetches video information      |                                                         |
| Fetches video information    | YouTube API node                            | Retrieve video metadata                 | Defines Video ID and Languages    | Check languages to translate   |                                                         |
| Check languages to translate | Code (JavaScript)                           | Determine default and target languages | Fetches video information         | AI Agent Translator            |                                                         |
| Google Gemini Chat Model1    | LangChain Google Gemini Chat Model          | AI language model provider              | None (linked internally)          | AI Agent Translator            |                                                         |
| Simple Memory               | LangChain Memory Buffer Window              | Maintain AI chat session memory        | AI Agent Translator (ai_memory)   | AI Agent Translator            |                                                         |
| Structured Output Parser     | LangChain Structured Output Parser          | Parse AI output into structured JSON   | AI Agent Translator (ai_outputParser) | AI Agent Translator            |                                                         |
| AI Agent Translator          | LangChain Agent                             | Translate and generate localized data  | Check languages to translate, Google Gemini Chat Model1, Simple Memory, Structured Output Parser | Updates Video Localization    |                                                         |
| Updates Video Localization   | HTTP Request                                | Update YouTube video localizations     | AI Agent Translator               | Output URL                    |                                                         |
| Output URL                  | Set                                         | Create URL for YouTube translations page | Updates Video Localization        | None                         |                                                         |
| Sticky Note2                | Sticky Note                                 | Label “Set and Retrieve Information”   | None                             | None                         |                                                         |
| Sticky Note                 | Sticky Note                                 | Label “Language Translation”            | None                             | None                         |                                                         |
| Sticky Note1                | Sticky Note                                 | Label “Update Localization and Return YouTube URL” | None                     | None                         |                                                         |
| Sticky Note12               | Sticky Note                                 | Instructional overview and usage notes | None                             | None                         |                                                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger node**  
   - Name: `When clicking 'Execute workflow'`  
   - Purpose: Start the workflow manually.

2. **Add a Set node**  
   - Name: `Defines Video ID and Languages`  
   - Mode: Raw JSON input  
   - JSON Content example:  
     ```json
     {
       "video": "REPLACEME",
       "languages": {
         "english": "en",
         "spanish": "es-419",
         "japanese": "ja"
       }
     }
     ```  
   - Note: Replace `"REPLACEME"` with actual video ID before running.

3. **Connect Manual Trigger → Defines Video ID and Languages**

4. **Add a YouTube node**  
   - Name: `Fetches video information`  
   - Resource: Video  
   - Operation: Get  
   - Video ID: Expression `={{ $json.video }}`  
   - Credentials: Set up YouTube OAuth2 with valid scopes to read video data.  
   
5. **Connect Defines Video ID and Languages → Fetches video information**

6. **Add a Code node (JavaScript)**  
   - Name: `Check languages to translate`  
   - Code:  
     ```js
     const defaultLang = $input.first().json?.snippet?.defaultLanguage ?? 'en';
     const nameToCode = $('Defines Video ID and Languages').first().json.languages || {};
     const entries = Object.entries(nameToCode).filter(([, code]) => code !== defaultLang);
     const languages = entries.map(([name]) => name);
     const keys = Object.fromEntries(entries);
     return [{
       json: {
         defaultLang,
         languages,
         keys
       }
     }];
     ```  

7. **Connect Fetches video information → Check languages to translate**

8. **Add LangChain nodes for AI translation:**  
   - **Google Gemini Chat Model node**  
     - Name: `Google Gemini Chat Model1`  
     - Credentials: Configure Google Palm API credentials (Google Gemini).  
   - **Simple Memory node**  
     - Name: `Simple Memory`  
     - Session Key: `chat`  
     - Session ID Type: customKey  
   - **Structured Output Parser node**  
     - Name: `Structured Output Parser`  
     - Schema Type: Manual  
     - Input Schema:  
       ```json
       {
         "title": "object",
         "description": "object",
         "tags": "object"
       }
       ```  
   - **AI Agent node**  
     - Name: `AI Agent Translator`  
     - Text (prompt):  
       ```
       Translate the youtube video which has a default language of {{ $json.defaultLang }}, to {{ $json.languages }}.

       This is the title: {{ $('Fetches video information').item.json.snippet.title }}

       and the description: {{ $('Fetches video information').item.json.snippet.description }}

       You may suggest tags 

       Return only the translated languages in json format, with this structure:

       {
             "LANGUAGE KEY 1": { "title": "Example", "description": "Example desc" },
             "LANGUAGE KEY 2": { "title": "Ejemplo", "description": "Desc Ejemplo" },
       }
       ```  
     - Prompt Type: Define  
     - Enable output parser (Structured Output Parser)  
     - Retry on failure: Enabled with max 2 tries, 5 seconds wait  
     - Connect AI language model input from `Google Gemini Chat Model1`  
     - Connect AI memory input from `Simple Memory`  
     - Connect AI output parser from `Structured Output Parser`

9. **Connect Check languages to translate → AI Agent Translator**

10. **Connect Google Gemini Chat Model1 → AI Agent Translator (ai_languageModel)**  
    Connect Simple Memory → AI Agent Translator (ai_memory)  
    Connect Structured Output Parser → AI Agent Translator (ai_outputParser)

11. **Add HTTP Request node**  
    - Name: `Updates Video Localization`  
    - Method: PUT  
    - URL: `https://www.googleapis.com/youtube/v3/videos?part=snippet,localizations`  
    - Authentication: YouTube OAuth2 API credentials (same as Fetches video information)  
    - Headers: Content-Type: application/json  
    - Body (JSON) (use expression):  
      ```json
      {
        "id": "{{ $('Fetches video information').item.json.id }}",
        "snippet": {
          "defaultLanguage": "{{ $('Check languages to translate').item.json.defaultLang }}",
          "title": "{{ $('Fetches video information').item.json.snippet.title }}",
          "description": "{{ $('Fetches video information').item.json.snippet.description }}",
          "categoryId": "{{ $('Fetches video information').item.json.snippet.categoryId }}",
          "tags": "{{ $('Fetches video information').item.json.snippet.tags }}"
        },
        "localizations": {{ $json.output }}
      }
      ```  
    - Send body as JSON

12. **Connect AI Agent Translator → Updates Video Localization**

13. **Add Set node**  
    - Name: `Output URL`  
    - Assign a string variable `URL` with value:  
      ```
      https://studio.youtube.com/video/{{ $('Fetches video information').item.json.id }}/translations
      ```  

14. **Connect Updates Video Localization → Output URL**

15. **(Optional) Add Sticky Notes for clarity**  
    - Use Sticky Notes to label logical blocks:  
      - Initialization ("Set and Retrieve Information")  
      - Language Translation  
      - Update Localization and Return YouTube URL  
      - YouTube Video Title and Description Translator (overview and usage)

---

### 5. General Notes & Resources

| Note Content                                                                                                                          | Context or Link                                                                                                                                                                                            |
|---------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Workflow requires YouTube OAuth2 credentials with permission to read and update video metadata.                                        | Credential setup for YouTube API integration in n8n.                                                                                                                                                      |
| Google Gemini (PaLM) API credentials must be configured for AI translation.                                                           | Use Google Cloud Console to create API keys and enable PaLM API access.                                                                                                                                   |
| Replace `"REPLACEME"` in `Defines Video ID and Languages` node with the actual YouTube video ID before executing the workflow.        | Workflow will fail if video ID is not set or invalid.                                                                                                                                                     |
| The workflow handles multiple languages by excluding the default video language automatically.                                         | Ensures no redundant translation into the original language occurs.                                                                                                                                       |
| The AI translation agent expects output strictly in a JSON structure with language keys containing "title" and "description" objects. | Structured output parser enforces this format; incorrect AI responses will cause retries or failures.                                                                                                     |
| The final output URL directs users to YouTube Studio’s translation management page for the video.                                      | Convenient access for manual review or further edits: `https://studio.youtube.com/video/{videoId}/translations`                                                                                            |
| For more details on YouTube Data API video update scopes, see: https://developers.google.com/youtube/v3/docs/videos/update                  | Official YouTube Data API documentation.                                                                                                                                                                 |
| Project inspired by the power of AI to localize video content and expand audience reach globally.                                       | Workflow is a practical example of combining YouTube API and AI language models for automation.                                                                                                           |

---

**Disclaimer**: The text provided derives exclusively from an automated workflow created using n8n, an integration and automation tool. This processing strictly respects applicable content policies and contains no illegal, offensive, or protected material. All data handled are legal and publicly accessible.