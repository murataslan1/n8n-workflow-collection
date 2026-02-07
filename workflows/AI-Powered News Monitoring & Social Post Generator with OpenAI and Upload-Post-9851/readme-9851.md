AI-Powered News Monitoring & Social Post Generator with OpenAI and Upload-Post

https://n8nworkflows.xyz/workflows/ai-powered-news-monitoring---social-post-generator-with-openai-and-upload-post-9851


# AI-Powered News Monitoring & Social Post Generator with OpenAI and Upload-Post

### 1. Workflow Overview

This workflow automates the monitoring of AI and automation-related news articles from an RSS feed, analyzes their quality and relevance using OpenAI-powered AI agents, then generates engaging social media content for high-quality articles and manages routing for others. It integrates content curation, scoring, enrichment, content generation, storage, and publishing on multiple social media platforms (X/Twitter, LinkedIn, Threads).

**Target Use Cases:**  
- Curating relevant AI and automation news articles automatically  
- Scoring and filtering articles based on quality and relevance  
- Generating platform-tailored social posts (Twitter threads and LinkedIn posts)  
- Managing content review and archival workflows  
- Publishing content directly to social media via Upload-Post API

**Logical Blocks:**  
- **1.1 Fetch Articles:** Triggered by an RSS feed to fetch new articles hourly.  
- **1.2 Analyze & Score:** AI agent evaluates articles for quality, relevance, and generates metadata including action recommendations.  
- **1.3 Route:** Filters articles by quality scores and routes them to publishing, review, or archive.  
- **1.4 Content Generation:** For high-quality articles, another AI generates social media content in JSON format.  
- **1.5 Parse & Enrich:** Parses AI JSON outputs to structured data.  
- **1.6 Store & Publish:** Stores generated content in Google Sheets and publishes to social platforms via Upload-Post.  
- **1.7 Review & Archive:** Articles needing manual review or archiving are stored in respective Google Sheets.

---

### 2. Block-by-Block Analysis

#### 2.1 Fetch Articles

- **Overview:** Initiates workflow by fetching articles from a configured RSS feed every hour.  
- **Nodes Involved:**  
  - RSS Feed Trigger  
  - Sticky Note "Section: Fetch Articles" (annotation)  

- **Node Details:**  
  - **RSS Feed Trigger**  
    - Type: RSS Feed Read Trigger  
    - Configuration: Polls TechCrunch RSS feed hourly (`https://morss.it/https://techcrunch.com/feed/`)  
    - Inputs: None (trigger node)  
    - Outputs: Emits new articles as JSON items  
    - Edge Cases: RSS feed downtime, malformed feed entries, network timeouts  
    - Notes: Must ensure feed URL is valid and reachable  

#### 2.2 Analyze & Score

- **Overview:** Uses OpenAI (LangChain) agent to analyze each article’s content and score it for quality and relevance, returning a JSON with metadata and an action recommendation.  
- **Nodes Involved:**  
  - OpenAI Chat Model (for scoring)  
  - Scoring AI (LangChain agent)  
  - Simple Memory (buffered AI memory)  
  - Code (parses AI JSON response)  
  - Sticky Note "Section: Analyze & Score"  

- **Node Details:**  
  - **OpenAI Chat Model**  
    - Type: LangChain OpenAI Chat Model node  
    - Model: GPT-4o selected (latest GPT-4 optimized model)  
    - Credentials: OpenAI API key ("n8n key")  
    - Role: Provides underlying language model for Scoring AI agent  
    - Edge Cases: API quota exceeded, invalid API key, rate limiting, malformed input  
  - **Scoring AI**  
    - Type: LangChain AI Agent node  
    - Prompt: Analyzes article title and full content, returns JSON with quality_score (1-10), relevance_score (1-10), key_topics (array or string), summary, content_angle, action (PUBLISH, REVIEW, ARCHIVE)  
    - System Message: Defines role as content research assistant specializing in AI/automation topics  
    - Output: JSON string in strict format  
    - Edge Cases: Malformed JSON output, AI hallucinations, output parsing failures  
  - **Simple Memory**  
    - Type: LangChain Memory Buffer Window  
    - Role: Maintains AI conversation context per execution  
    - Parameters: Session key based on execution ID  
  - **Code (Parsing)**  
    - Type: Code node (JavaScript)  
    - Role: Parses AI JSON string output, cleans escape characters, handles errors gracefully by defaulting to review action  
    - Inputs: AI raw JSON string outputs from Scoring AI  
    - Outputs: Structured JSON combining original article fields and AI metadata  
    - Edge Cases: JSON parse errors, malformed AI output  
  - Notes: Reliable JSON parsing is critical to prevent workflow breaks  

#### 2.3 Route

- **Overview:** Applies threshold filters on article scores to determine next steps: automatic content generation and publishing, manual review, or archival.  
- **Nodes Involved:**  
  - Quality Filter (If node)  
  - Quality Filter 2 (If node)  
  - New for Review (Google Sheets append)  
  - Archive (Google Sheets append)  
  - Sticky Note "Section: Route"  

- **Node Details:**  
  - **Quality Filter**  
    - Type: If node (v2)  
    - Condition: quality_score > 4 (threshold to proceed to content generation)  
    - True path: send to Content Generation block  
    - False path: send to Quality Filter 2 for further routing  
  - **Quality Filter 2**  
    - Type: If node (v2)  
    - Condition: quality_score >=5  
    - True path: send article to "New for Review" sheet  
    - False path: send article to "Archive" sheet  
  - **New for Review**  
    - Type: Google Sheets Append operation  
    - Sheet: Content Research System > For Review (Sheet ID and GID specified)  
    - Stores article metadata for manual editorial review  
  - **Archive**  
    - Type: Google Sheets Append operation  
    - Sheet: Horoscopo (Sheet ID specified)  
    - Archives low-quality articles with basic metadata  
  - Edge Cases: Google Sheets API limits, authentication errors, sheet name/ID mismatch  

#### 2.4 Content Generation

- **Overview:** For high-quality articles, generates social media posts (Twitter threads and LinkedIn posts) using another OpenAI LangChain agent, then parses the generated content JSON.  
- **Nodes Involved:**  
  - Content AI (LangChain agent)  
  - OpenAI Chat Model1 (LangChain OpenAI Chat Model)  
  - Code1 (parsing AI content JSON)  
  - Sticky Note "Section: Content Generation"  

- **Node Details:**  
  - **Content AI**  
    - Type: LangChain AI Agent node  
    - Prompt: Takes article title, summary, angle, link, and quality scores to generate multi-platform content  
    - Output: JSON with keys "twitter_thread" (array of 3-4 tweets), "linkedin_post" (string), "content_ready" (bool)  
    - System Message: Specifies tone, structure, and length constraints for Twitter and LinkedIn posts  
    - Edge Cases: JSON parse errors, incomplete content generation, API errors  
  - **OpenAI Chat Model1**  
    - Type: LangChain OpenAI Chat Model node  
    - Model: GPT-4.1 selected  
    - Role: Provides language model for Content AI agent  
    - Credentials: Same OpenAI API key as scoring  
  - **Code1**  
    - Type: JavaScript Code node  
    - Role: Parses Content AI JSON, merges with original article data from previous parsing node, includes metadata such as timestamps and platform readiness flags  
    - Edge Cases: Parsing errors handled by returning default failure messages and flags  
  - Notes: Parsing errors here could result in empty or broken social posts  

#### 2.5 Store & Publish

- **Overview:** Stores generated social media content in Google Sheets and publishes it via the Upload-Post API to X (Twitter), LinkedIn, and Threads.  
- **Nodes Involved:**  
  - Store Content (Google Sheets)  
  - Upload to Twitter,Linkedin and Threads (Upload-Post node)  
  - Sticky Note "Section: Store & Publish"  

- **Node Details:**  
  - **Store Content**  
    - Type: Google Sheets Append operation  
    - Sheet: Horoscopo sheet (Sheet ID and GID specified)  
    - Stores article metadata, quality score, and social media content snippets (concatenated Twitter tweets, LinkedIn post)  
    - Credentials: Google OAuth2 configured  
    - Edge Cases: API rate limiting, authentication, schema mismatches  
  - **Upload to Twitter,Linkedin and Threads**  
    - Type: Upload-Post integration node  
    - Operation: uploadText  
    - Platforms: X (Twitter), Threads, LinkedIn  
    - Inputs: Twitter thread concatenated as title, LinkedIn post as linkedInTitle, target LinkedIn Page ID specified  
    - Credentials: Upload-Post API token configured  
    - Edge Cases: API token expiration, platform API errors, rate limits, content length constraints  
  - Notes: Proper API credential configuration and platform setup are critical  

#### 2.6 Review & Archive

- **Overview:** Manages articles that fail automatic publishing thresholds by storing them in Google Sheets for manual review or archival purposes.  
- **Nodes Involved:**  
  - New for Review (Google Sheets append)  
  - Archive (Google Sheets append)  
  - Sticky Note "Section: Review & Archive"  

- **Node Details:**  
  - See routing block nodes above  
  - Used to keep track of articles needing editorial intervention or for historical referencing  

---

### 3. Summary Table

| Node Name                         | Node Type                           | Functional Role                     | Input Node(s)               | Output Node(s)                             | Sticky Note                                                                                                                   |
|----------------------------------|-----------------------------------|-----------------------------------|----------------------------|--------------------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| RSS Feed Trigger                 | RSS Feed Read Trigger              | Fetch new articles hourly          | None                       | Scoring AI                                | **Fetch** - RSS Feed Trigger                                                                                                  |
| OpenAI Chat Model                | LangChain OpenAI Chat Model        | Provides GPT-4o model for scoring  | None                       | Scoring AI (ai_languageModel)              | **Analyze & Score** - OpenAI Chat Model (Scoring)                                                                             |
| Simple Memory                   | LangChain Memory Buffer Window     | Maintains AI context per execution | None                       | Scoring AI (ai_memory)                      | **Analyze & Score**                                                                                                           |
| Scoring AI                     | LangChain AI Agent                 | Analyzes and scores article content| RSS Feed Trigger, OpenAI CM, Simple Memory | Code (parse AI JSON)                      | **Analyze & Score** - Scoring AI                                                                                              |
| Code                           | Code                              | Parses scoring AI JSON output      | Scoring AI                 | Quality Filter                             | **Parse & Enrich** - Parses Scoring AI JSON                                                                                   |
| Quality Filter                 | If Node (v2)                      | Filters articles by quality >4     | Code                       | Content AI (true), Quality Filter 2 (false)| **Route** - Quality Gate                                                                                                      |
| Content AI                    | LangChain AI Agent                 | Generates social media content     | Quality Filter             | Code1 (parse content AI JSON)              | **Content Generation** - Content generation AI                                                                                |
| OpenAI Chat Model1             | LangChain OpenAI Chat Model        | Provides GPT-4.1 model for content | None                       | Content AI (ai_languageModel)              | **Content Generation**                                                                                                        |
| Code1                         | Code                              | Parses content generation JSON     | Content AI                 | Upload to Twitter,Linkedin and Threads, Store Content | **Parse & Enrich** - Parses Content AI JSON                                                                                   |
| Upload to Twitter,Linkedin and Threads | Upload-Post Integration Node       | Publishes content to social media  | Code1                      | None                                       | **Store & Publish** - Publish to X, Threads, and LinkedIn                                                                     |
| Store Content                 | Google Sheets Append               | Stores generated content           | Code1                      | None                                       | **Store & Publish** - Store Content (Google Sheets)                                                                           |
| Quality Filter 2               | If Node (v2)                      | Routes medium vs low quality       | Quality Filter             | New for Review (true), Archive (false)     | **Route** - Review vs Archive Filter                                                                                          |
| New for Review                | Google Sheets Append               | Stores articles for manual review  | Quality Filter 2           | None                                       | **Review & Archive** - New for Review (Sheet)                                                                                 |
| Archive                      | Google Sheets Append               | Archives low-quality articles      | Quality Filter 2           | None                                       | **Review & Archive** - Archive (Sheet)                                                                                        |
| Sticky Note(s)                | Sticky Note                      | Documentation and grouping         | N/A                        | N/A                                        | Various notes describing blocks and setup steps (see detailed sticky notes in workflow)                                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create RSS Feed Trigger Node**  
   - Type: RSS Feed Read Trigger  
   - Parameters: Set feed URL to `https://morss.it/https://techcrunch.com/feed/`  
   - Poll interval: Every hour  
   - No credentials needed  

2. **Create OpenAI Chat Model Node for Scoring**  
   - Type: LangChain OpenAI Chat Model  
   - Model: Select GPT-4o (latest GPT-4 optimized)  
   - Credentials: Add OpenAI API key (create credential named "n8n key")  
   - No advanced options required  

3. **Create Simple Memory Node**  
   - Type: LangChain Memory Buffer Window  
   - Session Key: Set to `{{ $execution.id }}` for per-execution context  
   - Session ID Type: customKey  

4. **Create Scoring AI Agent Node**  
   - Type: LangChain AI Agent  
   - Model: Connect to OpenAI Chat Model (GPT-4o) node via ai_languageModel input  
   - Memory: Connect Simple Memory node via ai_memory input  
   - Prompt:  
     - Text: `=Analyze this article: {{ $json.title }} - {{ $json['content:encoded'] }}`  
     - System Message: Content research assistant with strict JSON output format specifying quality_score, relevance_score, key_topics, summary, content_angle, action  
   - No additional options needed  

5. **Create Code Node to Parse AI JSON Scoring Output**  
   - Type: Code (JavaScript)  
   - Paste parsing script that:  
     - Cleans and parses AI JSON string  
     - Combines with original article data from RSS Feed Trigger  
     - Handles parsing errors gracefully by defaulting to review action  
   - Input: Scoring AI node output  
   - Output: Structured JSON with scoring and metadata  

6. **Create Quality Filter (If) Node**  
   - Type: If (v2)  
   - Condition: `quality_score > 4`  
   - Input: Code node output  
   - True path: Connect to Content Generation block  
   - False path: Connect to Quality Filter 2  

7. **Create Content AI Generation Nodes**  
   - Create OpenAI Chat Model1 node:  
     - Model: GPT-4.1  
     - Credentials: Same OpenAI API key  
   - Create Content AI Agent node:  
     - Connect to OpenAI Chat Model1 via ai_languageModel  
     - Prompt: Generate Twitter thread and LinkedIn post JSON from article data (title, summary, angle, scores)  
     - System Message: Expert social media content creator instructions with strict JSON output  
   - Create Code1 node:  
     - Parse Content AI JSON output, merge with original article metadata (from scoring parse node)  
     - Handle parsing errors, set flags if content not ready  

8. **Create Store Content Node (Google Sheets Append)**  
   - Sheet ID: `1lg_9P1CJ8QT2fT2UBZChtxr8TZhpca1LzgSzm65Eldo`  
   - Sheet Name: `gid=0` (Hoja 1)  
   - Columns: Map article and social media content fields (Article Link, Date Created, Article Title, Quality Score, Twitter Content concatenated tweets, LinkedIn Content)  
   - Credentials: Configure Google Sheets OAuth2 credentials  

9. **Create Upload to Twitter,Linkedin and Threads Node**  
   - Type: Upload-Post integration node  
   - Operation: uploadText  
   - Platforms selected: x (Twitter), threads, linkedin  
   - Inputs:  
     - Title: concatenated Twitter thread tweets  
     - LinkedIn Title: LinkedIn post text  
     - Target LinkedIn Page Id (optional): e.g. `urn:li:organization:108870530`  
   - Credentials: Upload-Post API token (create credential)  

10. **Create Quality Filter 2 Node**  
    - Type: If (v2)  
    - Condition: `quality_score >= 5`  
    - True path: Connect to New for Review sheet append  
    - False path: Connect to Archive sheet append  

11. **Create New for Review Node (Google Sheets Append)**  
    - Sheet ID: `1qlgo9kKDnD6j7GZ6AhKD3EVbFyQu6MfGNEsNCz9lizg`  
    - Sheet Name GID: `1806686957` (For Review)  
    - Columns: Link, Title, Summary, Pub Date, Content Angle, Quality Score, Relevance Score, plus editorial fields (Reviewer, Status, Notes)  
    - Credentials: Google Sheets OAuth2  

12. **Create Archive Node (Google Sheets Append)**  
    - Sheet ID: Same as Store Content (Horoscopo sheet)  
    - Columns: Link, Title, Reason (summary), Pub Date, Quality Score  
    - Credentials: Google Sheets OAuth2  

13. **Connect Nodes**  
    - RSS Feed Trigger → Scoring AI (ai_languageModel and ai_memory via OpenAI and Simple Memory)  
    - Scoring AI → Code (parse AI JSON)  
    - Code → Quality Filter  
    - Quality Filter True → Content AI (with OpenAI Chat Model1)  
    - Content AI → Code1 (parse content JSON)  
    - Code1 → Upload to Twitter,Linkedin and Threads & Store Content  
    - Quality Filter False → Quality Filter 2  
    - Quality Filter 2 True → New for Review  
    - Quality Filter 2 False → Archive  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Context or Link                                                                                          |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| **Automated Content Curation & Creation** workflow uses a multi-step AI-powered process for fetching, analyzing, filtering, generating, storing, and publishing content. Critical setup includes configuring RSS feed URL, OpenAI API credentials, Google Sheets OAuth2, and Upload-Post API tokens. For Upload-Post, users must create an account at https://app.upload-post.com and connect social profiles. The LinkedIn Page ID is optional and used for posting to company pages.                                                                                     | Workflow sticky note at start of workflow                                                               |
| OpenAI API credentials must support GPT-4o and GPT-4.1 models for best results. Rate limits and quotas should be monitored to avoid workflow failures.                                                                                                                                                                                                                                                                                                                                                                                              | Credential requirements                                                                                  |
| Google Sheets nodes require careful setup of sheet IDs, GIDs, and column mappings to avoid data mismatches. Sheets must exist and have proper permissions.                                                                                                                                                                                                                                                                                                                                                                                            | Google Sheets integration notes                                                                         |
| Upload-Post integration enables cross-platform publishing but depends on correct API token and connected social profiles. Errors in API communication will result in missed or failed posts.                                                                                                                                                                                                                                                                                                                                                           | Upload-Post API integration notes                                                                       |
| Robust error handling in Code nodes mitigates JSON parsing errors from AI responses, falling back to review actions to ensure no data loss or silent failures. However, malformed AI output or API downtime can still cause issues.                                                                                                                                                                                                                                                                                                                   | Error handling recommendations                                                                           |

---

**Disclaimer:** The provided text is exclusively generated from an automated workflow created with n8n, adhering strictly to content policies, containing no illegal or offensive elements. All handled data is legal and public.