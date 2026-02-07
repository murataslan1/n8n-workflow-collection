Auto-Post X Videos with OpenRouter AI Captions & Google Sheets Deduplication

https://n8nworkflows.xyz/workflows/auto-post-x-videos-with-openrouter-ai-captions---google-sheets-deduplication-9748


# Auto-Post X Videos with OpenRouter AI Captions & Google Sheets Deduplication

### 1. Workflow Overview

This workflow automates the process of fetching recent videos posted by a specific user on X (formerly Twitter), generating fresh, engaging captions for these videos using AI (via OpenRouter), and then auto-posting these videos with the generated captions back to the connected X account. It maintains a Google Sheets log to deduplicate posts and track posting status, ensuring no repeated posts are made.

The workflow is logically divided into the following blocks:

- **1.1 Scheduled Trigger & User Identification:** Periodically triggers the workflow and retrieves the target user's X user ID.
- **1.2 Fetch and Filter Tweets with Video Media:** Retrieves recent tweets from the user, filtering only those containing video media.
- **1.3 Google Sheets Logging & Deduplication:** Appends video tweet data to Google Sheets, creates a shareable video URL, and upserts this data to maintain a registry and avoid duplicates.
- **1.4 Conditional Processing of New Videos:** Checks which videos are not yet posted (marked as "完了") and proceeds only with those.
- **1.5 AI-Driven Caption Generation:** Uses OpenRouter LLM to generate engaging Japanese captions tailored for social media.
- **1.6 Posting to X and Final Update:** Posts the generated caption plus video URL to X and marks the post as completed in Google Sheets.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger & User Identification

- **Overview:**  
Automatically triggers the workflow based on a defined time interval and retrieves the target user's X user ID via API to enable subsequent tweet fetching.

- **Nodes Involved:**  
  - Schedule Trigger  
  - Get User ID

- **Node Details:**

  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Role: Initiates the workflow at regular time intervals (every hour as configured).  
    - Configuration: Interval-based trigger with hourly polling.  
    - Inputs: None  
    - Outputs: Triggers "Get User ID" node  
    - Edge Cases: Consider API rate limits and schedule frequency to prevent throttling.  

  - **Get User ID**  
    - Type: HTTP Request  
    - Role: Fetches user ID from X API by username (handle).  
    - Configuration:  
      - URL template: `https://api.twitter.com/2/users/by/username/XXXXXXXXX` (replace `XXXXXXXXX` with target username).  
      - Uses Twitter OAuth2 credentials securely stored in n8n.  
      - Sends custom headers including User-Agent.  
    - Inputs: Trigger from Schedule Trigger  
    - Outputs: User ID (`data.id`) to "Get Tweets with Videos" node  
    - Edge Cases:  
      - Username must be valid; invalid username or auth failure returns error.  
      - Credentials must be set up correctly to avoid auth errors.  
    - Notes: Replace hardcoded username with desired target or environment variable for flexibility.

#### 1.2 Fetch and Filter Tweets with Video Media

- **Overview:**  
Retrieves the latest tweets from the user including media, then filters only those tweets containing video media for further processing.

- **Nodes Involved:**  
  - Get Tweets with Videos  
  - Filter Video Tweets

- **Node Details:**

  - **Get Tweets with Videos**  
    - Type: HTTP Request  
    - Role: Calls X API to fetch recent tweets with media expansions.  
    - Configuration:  
      - URL dynamically constructed using user ID from previous node.  
      - Retrieves up to 10 recent tweets with attachments, expanding media keys and fields (`type`, `url`, `variants`).  
      - No hardcoded tokens; uses Twitter OAuth2 credentials.  
    - Inputs: From "Get User ID"  
    - Outputs: Raw tweet and media data to "Filter Video Tweets"  
    - Edge Cases:  
      - API rate limits; consider adding `since_id` or `start_time` params for incremental fetches.  
      - Tweets without media or no videos will result in empty downstream data.

  - **Filter Video Tweets**  
    - Type: Code (JavaScript)  
    - Role: Filters tweets to only those containing video media.  
    - Configuration:  
      - Parses tweets and included media; checks for media type `'video'`.  
      - Outputs array of objects with `tweet_id`, `text`, and tweet URL.  
    - Inputs: From "Get Tweets with Videos"  
    - Outputs: Filtered video tweets to "Check Existing URLs"  
    - Edge Cases:  
      - If no videos found, outputs empty array, workflow downstream will skip further processing.  
      - Can be customized to include GIFs or exclude retweets/replies.

#### 1.3 Google Sheets Logging & Deduplication

- **Overview:**  
Logs each video tweet to a Google Sheet for deduplication and auditing, constructs a shareable video URL, and upserts this enriched data back to the sheet.

- **Nodes Involved:**  
  - Check Existing URLs  
  - Edit Fields  
  - Append or update row in sheet

- **Node Details:**

  - **Check Existing URLs**  
    - Type: Google Sheets  
    - Role: Appends raw tweet info (`ツイートID`, `文章`, `URL`) to a Google Sheet to maintain a registry.  
    - Configuration:  
      - Appends to specified sheet and document ID (replace with your own).  
      - Uses OAuth2 credentials for Google Sheets.  
      - Columns mapped explicitly for later matching in sheet.  
    - Inputs: From "Filter Video Tweets"  
    - Outputs: To "Edit Fields"  
    - Edge Cases:  
      - Sheet must exist and credentials valid, else operation fails.  
      - No deduplication here, only logging.

  - **Edit Fields**  
    - Type: Set  
    - Role: Constructs `setURL` by appending `/video/1` to the original URL to create a native video playback link.  
    - Configuration:  
      - Adds new field `setURL` with value `{{ $json.URL }}/video/1`.  
    - Inputs: From "Check Existing URLs"  
    - Outputs: To "Append or update row in sheet"  
    - Edge Cases:  
      - Assumes videos are native X videos; external video URLs may require custom formatting.

  - **Append or update row in sheet**  
    - Type: Google Sheets  
    - Role: Upserts enriched row data keyed by `ツイートID` to maintain shareable URLs and avoid duplicates.  
    - Configuration:  
      - Operation: Append or Update (Upsert) based on `ツイートID`.  
      - Uses the same sheet as before.  
      - Stores `setURL` and `ツイートID`.  
    - Inputs: From "Edit Fields"  
    - Outputs: To "Check New Videos"  
    - Edge Cases:  
      - Sheet access and write permissions must be valid.  
      - Upsert depends on existing keys; missing keys may cause duplicates.

#### 1.4 Conditional Processing of New Videos

- **Overview:**  
Filters video tweets to only those not yet marked as posted (`達成状況` ≠ "完了") to prevent reposting.

- **Nodes Involved:**  
  - Check New Videos (IF)

- **Node Details:**

  - **Check New Videos**  
    - Type: If (Conditional)  
    - Role: Evaluates if the row's posting status is incomplete (`達成状況` not equal "完了").  
    - Configuration:  
      - Condition on field `達成状況` from previous sheet upsert node output.  
    - Inputs: From "Append or update row in sheet"  
    - Outputs:  
      - True branch: To "Generate Tweet Text" for new videos.  
      - False branch: Ends workflow for duplicates.  
    - Edge Cases:  
      - Empty or missing `達成状況` field treated as not "完了" → proceeds.  
      - Customize with additional filters (e.g., tweet age, language) if required.

#### 1.5 AI-Driven Caption Generation

- **Overview:**  
Generates attractive, engaging Japanese captions for the video tweets using OpenRouter's large language model.

- **Nodes Involved:**  
  - OpenRouter Chat Model (Credential node)  
  - Generate Tweet Text (LangChain Agent)

- **Node Details:**

  - **OpenRouter Chat Model**  
    - Type: LangChain LLM Chat Node (OpenRouter integration)  
    - Role: Provides AI model credentials and configuration for text generation.  
    - Configuration:  
      - Uses OpenRouter credentials stored in n8n.  
      - Model selection is configurable (e.g., `gpt-4o-mini`).  
    - Inputs: None (credential node)  
    - Outputs: Connected internally to "Generate Tweet Text" as language model provider.  
    - Edge Cases:  
      - Invalid credentials or API limits cause failures.  
      - Retry policies recommended for robustness.

  - **Generate Tweet Text**  
    - Type: LangChain Agent (AI prompt node)  
    - Role: Sends prompt to LLM to generate a Japanese caption based on tweet text.  
    - Configuration:  
      - Input text: Original tweet text.  
      - Prompt instructs to produce 100-150 character engaging posts with 3-5 hashtags and a call to action.  
      - System message sets AI as social media content expert.  
    - Inputs: From "Check New Videos" (filtered tweets) and linked to "OpenRouter Chat Model" for AI model.  
    - Outputs: Generated caption text to "Post to X"  
    - Edge Cases:  
      - Prompt failures or AI API errors.  
      - Generated content may require manual review for compliance or appropriateness.

#### 1.6 Posting to X and Final Update

- **Overview:**  
Posts the AI-generated caption plus video URL to X and updates Google Sheets to mark the tweet as posted.

- **Nodes Involved:**  
  - Post to X (Twitter node)  
  - Update Spreadsheet (Google Sheets)

- **Node Details:**

  - **Post to X**  
    - Type: Twitter Node (v2 API)  
    - Role: Posts the combined caption and video URL to the connected X account.  
    - Configuration:  
      - Text constructed by concatenating AI-generated caption (`output`) and `setURL` from sheet data.  
      - Uses Twitter OAuth2 credentials.  
    - Inputs: From "Generate Tweet Text" and "Append or update row in sheet" (for URL)  
    - Outputs: To "Update Spreadsheet"  
    - Edge Cases:  
      - Posting errors, API rate limits, or auth failures.  
      - Consider dry-run mode for testing.  

  - **Update Spreadsheet**  
    - Type: Google Sheets  
    - Role: Marks the tweet as posted by setting `達成状況` to "完了" for the corresponding `ツイートID`.  
    - Configuration:  
      - Upsert operation keyed on `ツイートID`.  
      - Same Google Sheet as before.  
    - Inputs: From "Post to X"  
    - Outputs: None (workflow end)  
    - Edge Cases:  
      - Sheet access or write errors.  
      - For audit completeness, consider adding timestamps or posted text logs.

---

### 3. Summary Table

| Node Name                  | Node Type                  | Functional Role                                   | Input Node(s)                | Output Node(s)                  | Sticky Note                                                                                                                            |
|----------------------------|----------------------------|--------------------------------------------------|------------------------------|--------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| Schedule Trigger           | Schedule Trigger           | Triggers the workflow at regular intervals       | None                         | Get User ID                    | 設定した時間間隔でワークフローを自動的に開始するトリガーです。<br>## Schedule Trigger — How to use: Polling cadence every 1–3 hours. |
| Get User ID               | HTTP Request              | Retrieves user ID from X API by username          | Schedule Trigger             | Get Tweets with Videos         | 指定ユーザー名から API で利用する user.id を取得します。<br>Use Twitter OAuth2 creds, replace username placeholder.                  |
| Get Tweets with Videos     | HTTP Request              | Fetches recent tweets with media expansions       | Get User ID                 | Filter Video Tweets            | ユーザーの最新ツイート（メディア含む）を取得します。<br>Adjust `max_results`, add `since_id` for stricter deduping.                  |
| Filter Video Tweets        | Code                      | Filters tweets to only those containing videos    | Get Tweets with Videos       | Check Existing URLs            | 動画メディアのみ抽出します。<br>Customize to include GIFs or exclude replies/retweets.                                                |
| Check Existing URLs        | Google Sheets             | Appends tweet data to sheet for deduplication     | Filter Video Tweets          | Edit Fields                   | 履歴管理のためシートに追記します。<br>Replace documentId/sheetName with your own for audit trail.                                      |
| Edit Fields               | Set                       | Creates shareable video URL by appending `/video/1` | Check Existing URLs          | Append or update row in sheet | URL を引用動画形式へ変換します。<br>Optimized for native X videos; add UTM params if needed.                                           |
| Append or update row in sheet | Google Sheets             | Upserts shareable URL keyed by tweet ID           | Edit Fields                 | Check New Videos              | setURL を upsert します。<br>Ensure shareable URL stored for posting and logging.                                                     |
| Check New Videos           | If                        | Filters only videos not yet posted (`達成状況` != 完了) | Append or update row in sheet | Generate Tweet Text           | 未完了のみ次へ流します。<br>Prevents reposting; customize with age or language filters.                                               |
| OpenRouter Chat Model      | LangChain LLM Chat Model  | Provides AI model credentials and configuration   | None (credential node)       | Generate Tweet Text (ai_languageModel) | LLM の資格情報を参照します。<br>Configure OpenRouter creds and select model.                                                        |
| Generate Tweet Text        | LangChain Agent           | Generates AI captions based on tweet text         | Check New Videos             | Post to X                    | AI が投稿文を生成します。<br>100-150 chars, 3-5 hashtags, CTA in Japanese.                                                           |
| Post to X                 | Twitter                   | Posts caption + video URL to X account             | Generate Tweet Text          | Update Spreadsheet            | 自動で X に投稿します。<br>Test with sandbox account; consider dry-run boolean.                                                     |
| Update Spreadsheet         | Google Sheets             | Marks tweet as posted (`達成状況 = 完了`)            | Post to X                   | None                         | 投稿完了をマークします。<br>Add timestamps or posted text for audit completeness.                                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Set interval to trigger every 1 hour (or desired frequency).  
   - Connect output to the next node.

2. **Create HTTP Request Node "Get User ID"**  
   - Type: HTTP Request  
   - URL: `https://api.twitter.com/2/users/by/username/XXXXXXXXX` (replace `XXXXXXXXX` with your target username or feed dynamically).  
   - Authentication: Use Twitter OAuth2 credential configured in n8n.  
   - Headers: Add `User-Agent: n8n-workflow`.  
   - Connect input from Schedule Trigger.

3. **Create HTTP Request Node "Get Tweets with Videos"**  
   - Type: HTTP Request  
   - URL: Expression:  
     ```  
     =`https://api.twitter.com/2/users/${$json.data.id}/tweets?max_results=10&tweet.fields=attachments&expansions=attachments.media_keys&media.fields=type,url,variants`  
     ```  
   - Auth: Twitter OAuth2.  
   - Connect input from "Get User ID".

4. **Create Code Node "Filter Video Tweets"**  
   - Type: Code  
   - JavaScript code:  
     ```js
     const tweets = $input.first().json.data || [];
     const includes = $input.first().json.includes || {};
     const media = includes.media || [];
     const out = [];
     for (const t of tweets) {
       const keys = (t.attachments && t.attachments.media_keys) || [];
       const hasVideo = keys.some(k => (media.find(m => m.media_key===k) || {}).type === 'video');
       if (hasVideo) {
         out.push({ tweet_id: t.id, text: t.text, url: `https://twitter.com/i/status/${t.id}` });
       }
     }
     return out;
     ```  
   - Connect input from "Get Tweets with Videos".

5. **Create Google Sheets Node "Check Existing URLs"**  
   - Type: Google Sheets  
   - Operation: Append  
   - Document ID and Sheet Name: Use your Google Sheet document and sheet for logging.  
   - Columns mapping:  
     - `ツイートID` = `{{$json.tweet_id}}`  
     - `文章` = `{{$json.text}}`  
     - `URL` = `{{$json.url}}`  
   - Connect input from "Filter Video Tweets".  
   - Configure Google Sheets OAuth2 credentials.

6. **Create Set Node "Edit Fields"**  
   - Type: Set  
   - Add new field `setURL` with value: `{{$json.URL}}/video/1`  
   - Connect input from "Check Existing URLs".

7. **Create Google Sheets Node "Append or update row in sheet"**  
   - Type: Google Sheets  
   - Operation: Append or Update (Upsert)  
   - Key column: `ツイートID`  
   - Columns:  
     - `ツイートID` = `{{$json['ツイートID']}}` (from previous node)  
     - `setURL` = `{{$json.setURL}}`  
   - Connect input from "Edit Fields".  
   - Use same document and sheet as above.

8. **Create If Node "Check New Videos"**  
   - Type: If  
   - Condition: Check if field `達成状況` (from "Append or update row in sheet") is not equal to `"完了"`.  
   - True output connects to the next node; false output ends workflow for those items.  
   - Connect input from "Append or update row in sheet".

9. **Create LangChain OpenRouter Chat Model Node**  
   - Type: LangChain LLM Chat Model  
   - Configure with your OpenRouter credentials in n8n credentials.  
   - Select your preferred model (e.g., `gpt-4o-mini`).  
   - No inputs; connects internally to LangChain agent node.

10. **Create LangChain Agent Node "Generate Tweet Text"**  
    - Type: LangChain Agent  
    - Text input expression:  
      ```
      {{$json.text}}

      この内容に基づいて、魅力的な投稿文を日本語で生成してください。
      以下の要素を含めてください：
      - 簡潔で興味を引く説明
      - 適切なハッシュタグ（3-5個）
      - エンゲージメントを促す要素

      文字数は100-150文字程度で、最後に動画URLを配置できるようにしてください。
      ```
    - System Message:  
      ```
      あなたはソーシャルメディアのコンテンツ作成の専門家です。提供された内容から魅力的で共有されやすい投稿文を作成してください。
      ```
    - Connect input from "Check New Videos" (True branch).  
    - Connect the AI model from "OpenRouter Chat Model".

11. **Create Twitter Node "Post to X"**  
    - Type: Twitter (v2 API)  
    - Text:  
      ```
      {{$json.output}}

      {{$node["Append or update row in sheet"].item.json.setURL}}
      ```
    - Auth: Twitter OAuth2 credentials.  
    - Connect input from "Generate Tweet Text".

12. **Create Google Sheets Node "Update Spreadsheet"**  
    - Type: Google Sheets  
    - Operation: Append or Update (Upsert)  
    - Key: `ツイートID`  
    - Columns:  
      - `達成状況` = `"完了"`  
      - `ツイートID` = `{{$node["Append or update row in sheet"].item.json['ツイートID']}}`  
    - Connect input from "Post to X".  
    - Use same Google Sheet as before.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                               | Context or Link                                                                                                  |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| Purpose: Fetch recent X videos from a target user, generate fresh AI captions, and auto-post to X. Logs to Google Sheets for deduplication and auditing.                                                                                  | Workflow Overview sticky note                                                                                   |
| Replace all hardcoded usernames, Sheet IDs, and tokens with your own. Credentials must be securely configured in n8n.                                                                                                                     | Security note in sticky notes                                                                                   |
| Consider API rate limits when setting Schedule Trigger frequency; use `since_id` or `start_time` in tweet fetches for more precise deduplication.                                                                                         | Twitter API usage best practices                                                                                 |
| Customize code filter node to include GIFs or exclude retweets/replies depending on use case.                                                                                                                                              | Filter Video Tweets sticky note                                                                                  |
| For AI caption generation, consider brand voice, compliance rules, and content moderation to avoid problematic posts.                                                                                                                     | Generate Tweet Text sticky note                                                                                  |
| Test posting with a sandbox account and consider adding a dry-run toggle to avoid accidental posts during development.                                                                                                                    | Post to X sticky note                                                                                            |
| Add additional columns like timestamps (`posted_at`), posted text, and account info in Google Sheets for enhanced auditability and analytics.                                                                                            | Update Spreadsheet sticky note                                                                                   |
| OpenRouter model examples include `gpt-4o-mini`; configure retries in workflow settings for stability.                                                                                                                                   | OpenRouter Chat Model sticky note                                                                                |
| For advanced users: extend workflow with additional filters (e.g., language, tweet age), or add dynamic username input via environment variables or n8n credentials.                                                                      | General scalability and customization note                                                                      |

---

This structured document enables understanding, reproduction, and modification of the workflow to suit different users and scenarios, while highlighting potential edge cases and integration points.