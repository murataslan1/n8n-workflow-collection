Auto-publish NASA APOD to LinkedIn with AI translation and hashtags

https://n8nworkflows.xyz/workflows/auto-publish-nasa-apod-to-linkedin-with-ai-translation-and-hashtags-7153


# Auto-publish NASA APOD to LinkedIn with AI translation and hashtags

### 1. Workflow Overview

This workflow automates the daily publishing of NASA's Astronomy Picture of the Day (APOD) to LinkedIn, enhanced with AI-powered translation and hashtag generation for maximum engagement. Designed for astronomy enthusiasts, science communicators, and social media managers, it streamlines content localization and social media outreach.

The workflow is logically divided into the following blocks:

- **1.1 Scheduled Trigger & Configuration:** Initiates the workflow daily and sets user-defined parameters such as target translation language and notification settings.
- **1.2 NASA APOD Retrieval:** Fetches the current day’s APOD data, including image/video and description.
- **1.3 AI Processing:** Uses Google Gemini AI to translate the APOD description and generate strategic hashtags tailored for LinkedIn science posts.
- **1.4 Post Composition:** Combines translated text and hashtags into a formatted LinkedIn post text.
- **1.5 Conditional Publishing:** Checks if the APOD is an image; publishes as image post if true, else as text-only post.
- **1.6 Notification:** Sends a Telegram message confirming successful posting with relevant details.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger & Configuration

- **Overview:** This block triggers the workflow daily at a specified time and centralizes all configurable parameters.
- **Nodes Involved:**  
  - Cron  
  - Settings  
  - Sticky Note (Configuration Hub)  

- **Node Details:**  

  - **Cron**  
    - Type: Schedule Trigger  
    - Role: Executes workflow daily at 12:11 PM.  
    - Configuration: Fixed time trigger at 12:11.  
    - Inputs: None (start node)  
    - Outputs: To Settings node  
    - Failures: None expected; misconfiguration may cause no trigger.  

  - **Settings**  
    - Type: Set  
    - Role: Stores workflow-wide variables including LinkedIn base URL, Telegram Chat ID, and target translation language ("Brazilian Portuguese" by default).  
    - Key Parameters:  
      - linkedin_post_base_url: URL prefix for LinkedIn post links  
      - telegram_chat_id: Telegram chat for notifications (placeholder value)  
      - translate_to_language: Target language for translation  
    - Inputs: From Cron  
    - Outputs: To Get APOD node  
    - Edge Cases: Missing Telegram ID disables notifications; wrong language code may affect translation quality.  

  - **Sticky Note (Configuration Hub)**  
    - Purpose: Visual note explaining centralized configuration.  

#### 2.2 NASA APOD Retrieval

- **Overview:** Fetches the Astronomy Picture of the Day including description and media (image/video).
- **Nodes Involved:**  
  - Get APOD  
  - Sticky Note (NASA APOD API)  

- **Node Details:**  

  - **Get APOD**  
    - Type: NASA API node  
    - Role: Retrieves APOD JSON data and binary media for the current date.  
    - Credentials: NASA API demo key ("DEMO_KEY") with rate limits.  
    - Config: Uses `$today` for date parameter; binary media assigned to `apod_image`.  
    - Inputs: From Settings  
    - Outputs: To Generate Post Text and Preserve Binary (for media forwarding).  
    - Edge Cases: API rate limits, missing media, or API downtime.  

  - **Sticky Note (NASA APOD API)**  
    - Explains API usage and credential notes.  

#### 2.3 AI Processing

- **Overview:** Translates the APOD explanation to the target language and generates strategic bilingual hashtags optimized for LinkedIn reach.
- **Nodes Involved:**  
  - Generate Post Text (LangChain LLM)  
  - Generate Hashtags (LangChain LLM)  
  - Google Gemini 2.5 Flash (AI Language Model Credential)  
  - Sticky Note (AI Model Configuration)  

- **Node Details:**  

  - **Google Gemini 2.5 Flash**  
    - Type: LangChain Google Gemini LLM node (credential node)  
    - Role: Provides AI model access to connected LangChain nodes.  
    - Credentials: Google AI Studio API key.  
    - Inputs: None (used as credential provider)  
    - Outputs: To Generate Post Text, Generate Hashtags (as ai_languageModel).  
    - Edge Cases: API limits, authentication errors.  

  - **Generate Post Text**  
    - Type: LangChain Chain LLM node  
    - Role: Translates APOD explanation to the specified language using AI.  
    - Prompt: Instruction to act as translation specialist, returning only translated text without notes.  
    - Key Expression: Uses `$('Settings').item.json.translate_to_language` for language and APOD explanation from `$('Get APOD').item.json.explanation`.  
    - Inputs: From Get APOD  
    - Outputs: To Generate Hashtags  
    - Edge Cases: Translation errors, unsupported languages, empty explanations.  

  - **Generate Hashtags**  
    - Type: LangChain Chain LLM node  
    - Role: Generates 10-15 strategic hashtags combining fixed, content-specific, and reach hashtags in bilingual format.  
    - Prompt: Instructions to produce only hashtags without additional text.  
    - Key Expression: Uses translated text from `Generate Post Text`.  
    - Inputs: From Generate Post Text  
    - Outputs: To Create Final Post Text  
    - Edge Cases: Hashtag generation failure, irrelevant hashtags, empty input.  

  - **Sticky Note (AI Model Configuration)**  
    - Provides model information and setup instructions.

#### 2.4 Post Composition

- **Overview:** Creates the final LinkedIn post text by combining date, translated description, media availability notes, and hashtags.
- **Nodes Involved:**  
  - Create Final Post Text  
  - Preserve Binary  
  - Sticky Note (NASA APOD to LinkedIn Automation overview)  

- **Node Details:**  

  - **Create Final Post Text**  
    - Type: Set node  
    - Role: Builds the final post string including:  
      - Title with current date  
      - Conditional note if media is not an image  
      - Translated APOD explanation  
      - Generated hashtags  
    - Key Expression: Constructs a multiline string with conditional logic on media type; uses date formatting.  
    - Inputs: From Generate Hashtags  
    - Outputs: To Preserve Binary (path 1)  
    - Edge Cases: Missing translation or hashtags; media type mismatch.  

  - **Preserve Binary**  
    - Type: Merge node (combine mode)  
    - Role: Combines binary media with JSON data to preserve the image for LinkedIn publishing.  
    - Inputs: From Get APOD (binary) and Create Final Post Text (JSON)  
    - Outputs: To Is Image? node  
    - Edge Cases: Binary data missing or corrupted.  

  - **Sticky Note (Workflow Overview)**  
    - Describes full workflow purpose and key features.  

#### 2.5 Conditional Publishing

- **Overview:** Determines if the APOD media is an image; publishes as image post if yes, otherwise as text-only post.
- **Nodes Involved:**  
  - Is Image? (If node)  
  - Publish Image On LinkedIn  
  - Publish On LinkedIn  
  - Sticky Note (LinkedIn Publisher)  

- **Node Details:**  

  - **Is Image?**  
    - Type: If node  
    - Role: Checks if `media_type` equals `"image"`  
    - Inputs: From Preserve Binary  
    - Outputs:  
      - True branch: Publish Image On LinkedIn  
      - False branch: Publish On LinkedIn  
    - Edge Cases: Unexpected media types; missing media_type field.  

  - **Publish Image On LinkedIn**  
    - Type: LinkedIn node  
    - Role: Posts an image-type LinkedIn update with `apod_image` binary and final text.  
    - Parameters:  
      - Text from `final_text`  
      - Person ID hardcoded (`l-ubY6OyMM`) for LinkedIn profile  
      - Binary property: `apod_image`  
      - Share media category: "IMAGE"  
    - Credentials: OAuth2 LinkedIn app  
    - Inputs: From Is Image? (true branch)  
    - Outputs: To Notify On Telegram  
    - Edge Cases: OAuth token expiration, LinkedIn API limits, media upload failures.  

  - **Publish On LinkedIn**  
    - Type: LinkedIn node  
    - Role: Posts a text-only LinkedIn update with final text (used if no image).  
    - Parameters: Same as above but no binary media.  
    - Inputs: From Is Image? (false branch)  
    - Outputs: To Notify On Telegram  
    - Edge Cases: Same as above.  

  - **Sticky Note (LinkedIn Publisher)**  
    - Notes on LinkedIn posting requirements and setup.  

#### 2.6 Notification

- **Overview:** Sends a Telegram message confirming successful publication, including post date, title, and LinkedIn post link.
- **Nodes Involved:**  
  - Notify On Telegram  
  - Sticky Note (Success Notification)  

- **Node Details:**  

  - **Notify On Telegram**  
    - Type: Telegram node  
    - Role: Sends a formatted message to configured Telegram chat on successful LinkedIn post.  
    - Parameters:  
      - Message includes emoji, date, APOD title, LinkedIn post URL (using LinkedIn post URN), and execution time.  
      - Chat ID from Settings node.  
    - Credentials: Telegram Bot API token.  
    - Inputs: From both Publish Image On LinkedIn and Publish On LinkedIn.  
    - Edge Cases: Invalid chat ID, bot permissions, network issues.  

  - **Sticky Note (Success Notification)**  
    - Explains message contents and setup instructions.  

---

### 3. Summary Table

| Node Name               | Node Type                          | Functional Role                        | Input Node(s)                | Output Node(s)                           | Sticky Note                                                                                                             |
|-------------------------|----------------------------------|-------------------------------------|-----------------------------|-----------------------------------------|-------------------------------------------------------------------------------------------------------------------------|
| Cron                    | Schedule Trigger                 | Starts workflow on daily schedule   | None                        | Settings                                |                                                                                                                         |
| Settings                | Set                             | Stores configuration parameters     | Cron                        | Get APOD                               | ⚙️ Configuration Hub: Centralized settings for easy customization.                                                      |
| Get APOD                | NASA API                        | Fetches NASA APOD data and media    | Settings                    | Generate Post Text, Preserve Binary    | 🛰️ NASA APOD API: Fetches today's Astronomy Picture of the Day. Use "DEMO_KEY" for free API access.                      |
| Generate Post Text      | LangChain Chain LLM              | Translates APOD explanation          | Get APOD                    | Generate Hashtags                      | 🧠 AI Model Configuration: Uses Google Gemini 2.5 Flash for translation and hashtag generation.                          |
| Generate Hashtags       | LangChain Chain LLM              | Generates strategic hashtags         | Generate Post Text          | Create Final Post Text                 | 🧠 AI Model Configuration (same as above).                                                                              |
| Create Final Post Text  | Set                             | Composes final LinkedIn post text    | Generate Hashtags           | Preserve Binary (secondary output)    | 🚀 NASA APOD to LinkedIn Automation: Full workflow overview and features.                                               |
| Preserve Binary        | Merge                           | Combines media binary and JSON data | Get APOD, Create Final Post Text | Is Image?                           |                                                                                                                         |
| Is Image?               | If                              | Checks if media is image type        | Preserve Binary             | Publish Image On LinkedIn (true), Publish On LinkedIn (false) |                                                                                                                         |
| Publish Image On LinkedIn| LinkedIn Node                  | Publishes image post to LinkedIn    | Is Image? (true branch)     | Notify On Telegram                    | 📲 LinkedIn Publisher: Posts image with text; requires OAuth2 setup and permissions.                                     |
| Publish On LinkedIn     | LinkedIn Node                   | Publishes text-only post to LinkedIn| Is Image? (false branch)    | Notify On Telegram                    | 📲 LinkedIn Publisher (text-only mode).                                                                                  |
| Notify On Telegram      | Telegram Node                   | Sends success notification message  | Publish On LinkedIn, Publish Image On LinkedIn | None                                  | 💬 Success Notification: Confirms publication with date, title, link, and execution time via Telegram bot.              |
| Google Gemini 2.5 Flash | LangChain LM Chat Google Gemini | Provides AI model credential        | None                       | Generate Post Text, Generate Hashtags (ai_languageModel) | 🧠 AI Model Configuration (credential node).                                                                             |
| Sticky Note             | Sticky Note                     | Workflow overview and explanation   | None                       | None                                  | 🚀 NASA APOD to LinkedIn Automation overview and instructions.                                                          |
| Sticky Note1            | Sticky Note                     | Configuration explanation            | None                       | None                                  | ⚙️ Configuration Hub                                                                                                     |
| Sticky Note3            | Sticky Note                     | AI model setup info                  | None                       | None                                  | 🧠 AI Model Configuration                                                                                                |
| Sticky Note4            | Sticky Note                     | LinkedIn publisher info              | None                       | None                                  | 📲 LinkedIn Publisher                                                                                                    |
| Sticky Note5            | Sticky Note                     | Success notification info            | None                       | None                                  | 💬 Success Notification                                                                                                  |
| Sticky Note6            | Sticky Note                     | NASA APOD API info                   | None                       | None                                  | 🛰️ NASA APOD API                                                                                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Cron Node**  
   - Type: Schedule Trigger  
   - Set trigger time to daily at 12:11 PM.

2. **Create Settings Node**  
   - Type: Set  
   - Assign variables:  
     - `linkedin_post_base_url` = `https://linkedin.com/feed/update/`  
     - `telegram_chat_id` = `your_telegram_chat_id` (replace with actual)  
     - `translate_to_language` = `Brazilian Portuguese` (or desired language)  
   - Connect Cron → Settings.

3. **Create Get APOD Node**  
   - Type: NASA API  
   - Set `date` parameter to current date (`{{$today}}`).  
   - Set binary property name to `apod_image`.  
   - Use NASA API credentials with demo key or your own key.  
   - Connect Settings → Get APOD.

4. **Create Google Gemini 2.5 Flash Credential Node**  
   - Type: LangChain LM Chat Google Gemini  
   - Configure with Google AI Studio API key.  

5. **Create Generate Post Text Node**  
   - Type: LangChain Chain LLM  
   - Use Google Gemini credential.  
   - Prompt:  
     ```
     You are a translation specialist.
     Translate the text you receive from English to specified language.
     Return only the translation without explanations.
     ```
   - Text Expression:  
     ```
     =Translate this text to {{ $('Settings').item.json.translate_to_language }} language:

     "{{ $('Get APOD').item.json.explanation }}"
     ```
   - Connect Get APOD → Generate Post Text.  
   - Link Google Gemini credential as AI model.

6. **Create Generate Hashtags Node**  
   - Type: LangChain Chain LLM  
   - Use Google Gemini credential.  
   - Prompt:  
     ```
     You are a digital marketing expert on LinkedIn.
     Generate only 10-15 relevant hashtags mixing fixed and content-specific tags.
     ```
   - Text Expression:  
     ```
     =Generate hashtags for this text in {{ $('Settings').item.json.translate_to_language }}:

     "{{ $json.text }}"
     ```
   - Connect Generate Post Text → Generate Hashtags.  
   - Link Google Gemini credential as AI model.

7. **Create Create Final Post Text Node**  
   - Type: Set  
   - Assign field `final_text` with expression:  
     ```
     =NASA APOD (Astronomy Picture The Of Day) 📅{{ $today.format('dd/MM/yyyy') }}
     {{ $('Get APOD').item.json.media_type == 'image' ? '' : '\nNo image available today! Check out the full NASA APOD post here:\nhttps://apod.nasa.gov/apod/ap' + $today.format('yyMMdd') + '.html\n' }}
     {{ $('Generate Post Text').item.json.text }}

     {{ $('Generate Hashtags').item.json.text }}
     ```
   - Connect Generate Hashtags → Create Final Post Text.

8. **Create Preserve Binary Node**  
   - Type: Merge (combine mode)  
   - Connect Get APOD (binary) and Create Final Post Text (JSON) as inputs.  
   - Output to Is Image? node.

9. **Create Is Image? Node**  
   - Type: If  
   - Condition: `media_type` equals `"image"`.  
   - Connect Preserve Binary → Is Image?.

10. **Create Publish Image On LinkedIn Node**  
    - Type: LinkedIn  
    - Text: `={{ $json.final_text }}`  
    - Person ID: Use your LinkedIn profile ID (e.g., `l-ubY6OyMM`).  
    - Binary property: `apod_image`  
    - Share media category: `IMAGE`  
    - Use LinkedIn OAuth2 credentials.  
    - Connect Is Image? True → Publish Image On LinkedIn.

11. **Create Publish On LinkedIn Node**  
    - Type: LinkedIn  
    - Text: `={{ $json.final_text }}`  
    - Person ID: Same as above.  
    - No binary property (text-only post).  
    - Use LinkedIn OAuth2 credentials.  
    - Connect Is Image? False → Publish On LinkedIn.

12. **Create Notify On Telegram Node**  
    - Type: Telegram  
    - Text expression:  
      ```
      =🚀 APOD publicado com sucesso!

      📅 Data: {{ $today.format('dd/MM/yyyy') }}
      📝 Título: {{ $('Get APOD').item.json.title }}
      🔗 Link da Publicação: {{ $('Settings').item.json.linkedin_post_base_url }}{{ $('Publish On LinkedIn').item.json.urn }}

      ✅ Workflow executado às {{ $now.format('HH:mm') }}
      ```
    - Chat ID: `={{ $('Settings').item.json.telegram_chat_id }}`  
    - Use Telegram Bot credentials.  
    - Connect Publish Image On LinkedIn → Notify On Telegram and Publish On LinkedIn → Notify On Telegram.

13. **Add Sticky Notes** for documentation and explanations at relevant points to describe configuration, AI model, LinkedIn publishing, and notifications.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                             | Context or Link                                                                                   |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Workflow automates NASA APOD daily posting with AI translation & strategic hashtags on LinkedIn, plus Telegram notifications. Free API keys and AI model used. Setup requires LinkedIn OAuth2 and Telegram bot.                                                                               | Full workflow description in Sticky Note.                                                       |
| Use Google AI Studio account and API key for Google Gemini 2.5 Flash model. Generous free tier available.                                                                                                                                                                                | AI Model Configuration Sticky Note.                                                             |
| LinkedIn OAuth2 app must be created with required permissions to post images and text on user profile. Person ID is the LinkedIn profile unique ID.                                                                                                                                      | LinkedIn Publisher Sticky Note.                                                                  |
| Telegram bot must be created; obtain chat ID via @userinfobot to receive success notifications.                                                                                                                                                                                          | Success Notification Sticky Note.                                                               |
| NASA APOD API allows free access with DEMO_KEY but is subject to rate limits. For heavy use, get a personal API key.                                                                                                                                                                      | NASA APOD API Sticky Note.                                                                       |
| Workflow handles both image and non-image (e.g., video) APOD media types, posting accordingly.                                                                                                                                                                                           | Workflow overview and conditional logic explanation.                                            |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected material. All data handled is legal and publicly available.