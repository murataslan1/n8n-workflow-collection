Automate AI News Videos with GPT-4o, Heygen Avatars, and Blotato Multi-Platform Posting

https://n8nworkflows.xyz/workflows/automate-ai-news-videos-with-gpt-4o--heygen-avatars--and-blotato-multi-platform-posting-4080


# Automate AI News Videos with GPT-4o, Heygen Avatars, and Blotato Multi-Platform Posting

---

### 1. Workflow Overview

This workflow automates the creation and multi-platform publishing of AI-generated news videos featuring Heygen avatars, leveraging GPT-4o for script and caption writing and Blotato for video hosting and distribution. It targets content creators and marketers who want to produce engaging, short AI news videos daily without manual effort.

The workflow divides logically into three primary blocks:

- **1.1 AI Research & Content Generation:**  
  Fetches trending AI/LLM news stories from Hacker News and generates a viral video script plus two caption versions (long and short) using OpenAI GPT-4o models.

- **1.2 AI Avatar Video Creation:**  
  Uses Heygen avatars configured by the user to transform the script into a talking avatar video, applying professional backgrounds and managing asynchronous video processing.

- **1.3 Multi-Platform Publishing via Blotato:**  
  Uploads the generated video to Blotato’s CDN and publishes natively to multiple social media platforms (Instagram, YouTube, TikTok, Twitter, Facebook, LinkedIn, Threads, and more), adapting captions and video formatting per platform requirements.

The workflow runs on a schedule (default daily at 10 AM) and is fully customizable in prompts, avatars, and target platforms.

---

### 2. Block-by-Block Analysis

#### 2.1 AI Research & Content Generation

- **Overview:**  
  This block automates the collection of trending news articles about AI, then uses AI language models to craft a compelling video script and captions for social platforms.

- **Nodes Involved:**  
  - Schedule Trigger  
  - Fetch HN Front Page  
  - Fetch HN Article  
  - Write Script (OpenAI Chat)  
  - AI Agent (LangChain Agent)  
  - Write Long Caption (OpenAI)  
  - Write Short Caption (OpenAI)

- **Node Details:**

  1. **Schedule Trigger**  
     - *Type:* Trigger node initiating workflow on schedule.  
     - *Configuration:* Runs daily at 10 AM by default, can be customized.  
     - *Inputs:* None  
     - *Outputs:* Triggers AI Agent node.  
     - *Edge Cases:* Scheduling misconfiguration can cause missed runs.

  2. **Fetch HN Front Page**  
     - *Type:* HackerNews Tool node fetching top news stories.  
     - *Configuration:* Retrieves current front-page stories from Hacker News.  
     - *Inputs:* Trigger from AI Agent (as tool input).  
     - *Outputs:* Provides list of trending article IDs to AI Agent.  
     - *Edge Cases:* API limits, empty front page, connectivity issues.

  3. **Fetch HN Article**  
     - *Type:* HackerNews Tool node fetching full article details.  
     - *Configuration:* Retrieves article content based on IDs from front page.  
     - *Inputs:* AI Agent’s tool input.  
     - *Outputs:* Article content for AI processing.  
     - *Edge Cases:* Missing articles, HTTP errors.

  4. **Write Script (OpenAI Chat)**  
     - *Type:* LangChain OpenAI Chat node (GPT-4o) for script generation.  
     - *Configuration:* Generates a 30-second viral video script with hook, analysis, stats, and call-to-action, based on fetched news.  
     - *Inputs:* AI Agent language model input.  
     - *Outputs:* Text script to AI Agent.  
     - *Expressions:* Uses prompt templates with placeholders for article data.  
     - *Edge Cases:* API rate limits, prompt failures.

  5. **AI Agent (LangChain Agent)**  
     - *Type:* LangChain agent orchestrating the above tools and models.  
     - *Configuration:* Manages flow between fetching news and generating script/captions.  
     - *Inputs:* Trigger from Schedule Trigger.  
     - *Outputs:* Triggers Write Long Caption node.  
     - *Edge Cases:* Agent execution errors, tool failures.

  6. **Write Long Caption (OpenAI)**  
     - *Type:* OpenAI node generating a long caption (~50 words + hashtags).  
     - *Configuration:* Takes video script as input.  
     - *Inputs:* AI Agent output.  
     - *Outputs:* Long caption to Write Short Caption node.  
     - *Edge Cases:* Text generation errors.

  7. **Write Short Caption (OpenAI)**  
     - *Type:* OpenAI node generating a short caption (2 sentences).  
     - *Configuration:* For Twitter/Threads style posts.  
     - *Inputs:* Long caption output.  
     - *Outputs:* Triggers Setup Heygen node.  
     - *Edge Cases:* Text truncation or prompt issues.

---

#### 2.2 AI Avatar Video Creation

- **Overview:**  
  This block creates a talking avatar video using Heygen API, applying user-configured avatars and backgrounds, then waits for processing completion.

- **Nodes Involved:**  
  - Setup Heygen  
  - Create Avatar Video  
  - Wait  
  - Get Avatar Video

- **Node Details:**

  1. **Setup Heygen**  
     - *Type:* Set node for initializing Heygen avatar and voice parameters.  
     - *Configuration:* User sets preferred avatar ID, voice, and background video here.  
     - *Inputs:* Output from Write Short Caption.  
     - *Outputs:* Triggers Create Avatar Video.  
     - *Edge Cases:* Misconfiguration can cause API errors.

  2. **Create Avatar Video**  
     - *Type:* HTTP Request node calling Heygen API to generate video.  
     - *Configuration:* Sends script text and avatar parameters; starts video rendering process.  
     - *Inputs:* Setup Heygen output.  
     - *Outputs:* Triggers Wait node.  
     - *Edge Cases:* API timeouts, invalid credentials.

  3. **Wait**  
     - *Type:* Wait node to allow Heygen video processing (~8 minutes, adjustable).  
     - *Configuration:* Fixed delay to wait for video availability.  
     - *Inputs:* Create Avatar Video output.  
     - *Outputs:* Triggers Get Avatar Video.  
     - *Edge Cases:* Processing failure if video not ready after wait.

  4. **Get Avatar Video**  
     - *Type:* HTTP Request node fetching the finished video URL from Heygen.  
     - *Configuration:* Polls Heygen API for video download link.  
     - *Inputs:* Wait node output.  
     - *Outputs:* Triggers Prepare for Publish node.  
     - *Edge Cases:* Video not ready, API errors.

---

#### 2.3 Multi-Platform Publishing via Blotato

- **Overview:**  
  Uploads the avatar video to Blotato CDN, then publishes posts with platform-specific captions and formatting to over 10 social platforms.

- **Nodes Involved:**  
  - Prepare for Publish  
  - Upload to Blotato  
  - [Instagram] Publish via Blotato  
  - [Youtube] Publish via Blotato  
  - [Twitter] Publish via Blotato  
  - [Tiktok] Publish via Blotato  
  - [Facebook] Publish via Blotato (disabled)  
  - [Linkedin] Publish via Blotato (disabled)  
  - [Threads] Publish via Blotato (disabled)  
  - [Pinterest] Publish via Blotato (disabled)  
  - [Bluesky] Publish via Blotato (disabled)  
  - Upload to Blotato - Image (disabled)

- **Node Details:**

  1. **Prepare for Publish**  
     - *Type:* Set node preparing request parameters such as video URLs, captions, and metadata for Blotato upload.  
     - *Inputs:* Get Avatar Video output.  
     - *Outputs:* Triggers Upload to Blotato.  
     - *Edge Cases:* Missing metadata causing upload failures.

  2. **Upload to Blotato**  
     - *Type:* HTTP Request node uploading video file to Blotato’s CDN.  
     - *Configuration:* Uses API keys and video URL from previous step.  
     - *Inputs:* Prepare for Publish output.  
     - *Outputs:* Triggers multiple platform publish nodes in parallel.  
     - *Edge Cases:* Network errors, API rate limits.

  3. **[Instagram] Publish via Blotato**  
     - *Type:* HTTP Request node to post video natively on Instagram via Blotato.  
     - *Configuration:* Uses long caption and video URL.  
     - *Inputs:* Upload to Blotato output.  
     - *Outputs:* None (end node).  
     - *Edge Cases:* Instagram API errors, caption length limits.

  4. **[Youtube] Publish via Blotato**  
     - *Type:* HTTP Request node to post video on YouTube.  
     - *Configuration:* Long caption plus hashtags.  
     - *Inputs:* Upload to Blotato output.  
     - *Outputs:* None.  
     - *Edge Cases:* YouTube API quota, video format compliance.

  5. **[Twitter] Publish via Blotato**  
     - *Type:* HTTP Request node to post video on Twitter/X.  
     - *Configuration:* Uses short caption for Twitter style.  
     - *Inputs:* Upload to Blotato output.  
     - *Outputs:* None.  
     - *Edge Cases:* Twitter API limits, video length restrictions.

  6. **[Tiktok] Publish via Blotato**  
     - *Type:* HTTP Request node publishing to TikTok.  
     - *Configuration:* Vertical video formatting applied.  
     - *Inputs:* Upload to Blotato output.  
     - *Outputs:* None.  
     - *Edge Cases:* TikTok API restrictions.

  7. **Disabled Nodes:**  
     - [Facebook], [Linkedin], [Threads], [Pinterest], [Bluesky] publish nodes and image upload node are present but disabled, indicating planned or optional platform support.

---

### 3. Summary Table

| Node Name                     | Node Type                      | Functional Role                        | Input Node(s)          | Output Node(s)                                          | Sticky Note                                           |
|-------------------------------|--------------------------------|--------------------------------------|-----------------------|--------------------------------------------------------|------------------------------------------------------|
| Schedule Trigger              | Schedule Trigger               | Trigger workflow by schedule         |                       | AI Agent                                               |                                                      |
| AI Agent                     | LangChain Agent               | Orchestrates news fetch & script     | Schedule Trigger      | Write Long Caption                                     |                                                      |
| Fetch HN Front Page          | HackerNews Tool               | Fetch trending Hacker News stories    | AI Agent (tool input) | AI Agent (tool output)                                 |                                                      |
| Fetch HN Article             | HackerNews Tool               | Fetch full article content            | AI Agent (tool input) | AI Agent (tool output)                                 |                                                      |
| Write Script                 | LangChain OpenAI Chat         | Generate video script                  | AI Agent (language model) | AI Agent                                               |                                                      |
| Write Long Caption           | OpenAI                       | Generate long caption with hashtags  | AI Agent              | Write Short Caption                                    |                                                      |
| Write Short Caption          | OpenAI                       | Generate short caption for Twitter   | Write Long Caption    | Setup Heygen                                          |                                                      |
| Setup Heygen                 | Set                          | Configure avatar, voice, background  | Write Short Caption   | Create Avatar Video                                   |                                                      |
| Create Avatar Video          | HTTP Request                 | Request Heygen avatar video creation | Setup Heygen          | Wait                                                  |                                                      |
| Wait                        | Wait                         | Delay to allow video rendering       | Create Avatar Video   | Get Avatar Video                                      |                                                      |
| Get Avatar Video             | HTTP Request                 | Retrieve finished video URL           | Wait                  | Prepare for Publish                                   |                                                      |
| Prepare for Publish          | Set                          | Prepare data for Blotato upload       | Get Avatar Video      | Upload to Blotato                                    |                                                      |
| Upload to Blotato            | HTTP Request                 | Upload video to Blotato CDN            | Prepare for Publish   | Platform publish nodes (Instagram, YouTube, TikTok, etc.) |                                                      |
| [Instagram] Publish via Blotato | HTTP Request                 | Post video on Instagram                | Upload to Blotato     |                                                        |                                                      |
| [Youtube] Publish via Blotato   | HTTP Request                 | Post video on YouTube                  | Upload to Blotato     |                                                        |                                                      |
| [Twitter] Publish via Blotato    | HTTP Request                 | Post video on Twitter/X                | Upload to Blotato     |                                                        |                                                      |
| [Tiktok] Publish via Blotato     | HTTP Request                 | Post video on TikTok                   | Upload to Blotato     |                                                        |                                                      |
| [Facebook] Publish via Blotato   | HTTP Request (disabled)      | Post video on Facebook (disabled)     | Upload to Blotato     |                                                        | Disabled node                                         |
| [Linkedin] Publish via Blotato   | HTTP Request (disabled)      | Post video on LinkedIn (disabled)     | Upload to Blotato     |                                                        | Disabled node                                         |
| [Threads] Publish via Blotato    | HTTP Request (disabled)      | Post video on Threads (disabled)      | Upload to Blotato     |                                                        | Disabled node                                         |
| [Pinterest] Publish via Blotato  | HTTP Request (disabled)      | Post image/video on Pinterest (disabled) | Upload to Blotato - Image |                                                    | Disabled node                                         |
| [Bluesky] Publish via Blotato    | HTTP Request (disabled)      | Post video on Bluesky (disabled)      | Upload to Blotato     |                                                        | Disabled node                                         |
| Upload to Blotato - Image        | HTTP Request (disabled)      | Upload image to Blotato CDN (disabled) | OpenAI                | Pinterest Publish via Blotato                         | Disabled node                                         |
| Sticky Note                   | Sticky Note                  | Notes (empty content)                  |                       |                                                        |                                                      |
| Sticky Note1                  | Sticky Note                  | Notes (empty content)                  |                       |                                                        |                                                      |
| Sticky Note2                  | Sticky Note                  | Notes (empty content)                  |                       |                                                        |                                                      |
| Sticky Note3                  | Sticky Note                  | Notes (empty content)                  |                       |                                                        |                                                      |
| Sticky Note4                  | Sticky Note                  | Notes (empty content)                  |                       |                                                        |                                                      |

---

### 4. Reproducing the Workflow from Scratch

**Step 1: Create Schedule Trigger**  
- Node Type: Schedule Trigger  
- Configure to run daily at 10 AM (or preferred schedule).  
- Output connected to AI Agent.

**Step 2: Add AI Agent Node (LangChain Agent)**  
- Node Type: LangChain Agent  
- Configure with API credentials for OpenAI GPT-4o.  
- Set up tools: HackerNews Front Page and HackerNews Article nodes as tools for the agent.  
- Input: From Schedule Trigger.  
- Output: To Write Long Caption node.

**Step 3: Add HackerNews Tool Nodes**  
- Fetch HN Front Page: Configure to fetch top Hacker News stories.  
- Fetch HN Article: Configure to fetch full article details by ID.  
- Connect both as tools to AI Agent.

**Step 4: Add Write Script Node**  
- Node Type: LangChain OpenAI Chat  
- Configure prompt to generate a 30-second viral video script with hook, stats, and CTA.  
- Input: From AI Agent language model.  
- Output: To AI Agent (integrated inside agent).

**Step 5: Add Write Long Caption Node**  
- Node Type: OpenAI  
- Prompt: Generate a long caption (~50 words + hashtags) from script text.  
- Input: AI Agent output.  
- Output: Write Short Caption node.

**Step 6: Add Write Short Caption Node**  
- Node Type: OpenAI  
- Prompt: Generate a short caption (2 sentences) optimized for Twitter/Threads.  
- Input: Write Long Caption output.  
- Output: Setup Heygen node.

**Step 7: Setup Heygen Node**  
- Node Type: Set node  
- Manually set parameters for Heygen avatar ID, voice, and background video URL.  
- Input: Write Short Caption output.  
- Output: Create Avatar Video node.

**Step 8: Create Avatar Video Node**  
- Node Type: HTTP Request  
- Configure to call Heygen API endpoint to create avatar video with script and avatar settings.  
- Input: Setup Heygen output.  
- Output: Wait node.

**Step 9: Add Wait Node**  
- Node Type: Wait  
- Configure delay ~8 minutes (adjustable based on Heygen processing time).  
- Input: Create Avatar Video output.  
- Output: Get Avatar Video node.

**Step 10: Get Avatar Video Node**  
- Node Type: HTTP Request  
- Configure to poll Heygen API for completed video URL.  
- Input: Wait output.  
- Output: Prepare for Publish node.

**Step 11: Prepare for Publish Node**  
- Node Type: Set node  
- Prepare video URLs, captions, and metadata for Blotato upload.  
- Input: Get Avatar Video output.  
- Output: Upload to Blotato node.

**Step 12: Upload to Blotato Node**  
- Node Type: HTTP Request  
- Configure with Blotato API credentials to upload video file.  
- Input: Prepare for Publish output.  
- Output: Branch to platform-specific publish nodes.

**Step 13: Create Platform Publish Nodes**  
- Instagram, YouTube, Twitter, TikTok at minimum.  
- Node Type: HTTP Request  
- Configure each with platform-specific API calls via Blotato, using appropriate captions (long for Instagram/YouTube, short for Twitter), video URL from upload.  
- Input: Upload to Blotato output.  
- Output: None (end nodes).

**Step 14: (Optional) Add Disabled Nodes for Other Platforms**  
- Facebook, LinkedIn, Threads, Pinterest, Bluesky, and image upload nodes can be added and disabled for future use.

**Credentials Needed:**  
- OpenAI API key with GPT-4o access.  
- Heygen API credentials (avatar, voice, background configurations).  
- Blotato API key for multi-platform upload and publishing.

---

### 5. General Notes & Resources

| Note Content                                                                                       | Context or Link                                                                                  |
|--------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| The workflow processes video creation asynchronously with a wait node to handle Heygen rendering delay (~8 minutes). | Critical for ensuring video is ready before upload.                                            |
| Blotato handles multi-platform posting natively, simplifying the publishing process across Instagram, YouTube, TikTok, Twitter, etc. | https://blotato.io (for API documentation and account setup)                                   |
| GPT-4o is used for script and caption generation, providing creativity and viral content optimization. | Requires OpenAI account with GPT-4o access.                                                    |
| The workflow is designed to be fully hands-off after initial configuration, running daily automatically. | Ideal for content creators seeking scalable automation.                                       |
| Disabled nodes for Facebook, LinkedIn, Threads, Pinterest, and Bluesky indicate planned expansions; enable as needed. | Facilitates future platform support with minimal changes.                                     |
| Use of LangChain agent node allows flexible AI orchestration between news fetching and language models. | Advanced AI workflow design pattern.                                                          |

---

**Disclaimer:**  
The text and workflow described originate exclusively from an automated n8n workflow. The content complies fully with relevant content policies and contains no illegal or protected material. All data handled is legal and publicly accessible.

---