AI-Powered Content Factory: RSS to Blog, Instagram & TikTok with Slack Approval

https://n8nworkflows.xyz/workflows/ai-powered-content-factory--rss-to-blog--instagram---tiktok-with-slack-approval-11298


# AI-Powered Content Factory: RSS to Blog, Instagram & TikTok with Slack Approval

---

## 1. Workflow Overview

**Purpose:**  
This workflow automates the generation of multi-platform content based on trending topics from Google Trends. It fetches trending news, uses AI to select the most relevant viral topic for specific niches, and then generates three content types: SEO-optimized blog posts, Instagram carousel post outlines, and TikTok video scripts. The generated drafts are sent to a Slack channel for team approval. Upon approval, the content is saved to Google Sheets for record-keeping or further use.

**Target Use Cases:**  
- Marketing teams seeking automated trend-driven content ideation and generation.  
- Social media managers needing multi-format content (blog, Instagram, TikTok) efficiently produced from one source.  
- Workflows requiring human-in-the-loop approvals via Slack before publishing or saving content.

**Logical Blocks:**  
- **1.1 Trend Scout:** Fetches and analyzes daily Google Trends RSS feeds to pick one highly relevant viral topic.  
- **1.2 AI Content Factory:** Runs parallel AI agents to generate SEO blog drafts, Instagram carousel outlines, and TikTok video scripts from the selected topic.  
- **1.3 Approval Loop:** Sends generated content to Slack with interactive approval buttons, waits for user response, then saves approved content to Google Sheets.  

---

## 2. Block-by-Block Analysis

### 1.1 Trend Scout

**Overview:**  
This block triggers the workflow every 8 hours, fetches the latest trending news RSS feed, and uses an AI agent to filter and select the most viral and relevant topic aligned with niches like gadgets, AI technology, and lifehacks.

**Nodes Involved:**  
- Every 8 Hours (Schedule Trigger)  
- Workflow Configuration (Set)  
- Fetch Google Trends RSS (HTTP Request)  
- AI Agent: Trend Filter (LangChain Agent)  
- OpenAI Chat Model - Filter (OpenAI Chat)  
- Structured Output Parser - Filter (LangChain Output Parser Structured)

**Node Details:**

- **Every 8 Hours**  
  - Type: Schedule Trigger  
  - Configuration: Triggers workflow every 8 hours.  
  - Input: None (time-based trigger)  
  - Output: Triggers next node (Workflow Configuration)  
  - Failure Modes: Scheduler downtime or execution failures (rare).

- **Workflow Configuration**  
  - Type: Set  
  - Configuration: Defines two variables:  
    - `trendsRssUrl`: URL of Google Trends daily RSS feed (Japan region).  
    - `slackChannel`: Slack channel name ("general").  
  - Input: From trigger  
  - Output: Passes variables to next node.  
  - Notes: Customizable for different geographies or Slack channels.

- **Fetch Google Trends RSS**  
  - Type: HTTP Request  
  - Configuration: Fetches RSS feed from Google News Japan RSS URL (`https://news.google.com/rss?hl=ja&gl=JP&ceid=JP:ja`) instead of the configured `trendsRssUrl`.  
  - Input: Receives workflow config  
  - Output: Provides raw RSS XML data as JSON.  
  - Failure Modes: HTTP errors, feed downtime, network issues.

- **AI Agent: Trend Filter**  
  - Type: LangChain Agent  
  - Configuration: Receives fetched RSS feed data and uses a system prompt instructing it to select one trending topic related to "gadgets", "AI technology", or "life hacks" based on criteria like search volume spike, viral potential, and audience relevance. Outputs a JSON with keys: `selected_topic`, `reason`, and `target_audience`.  
  - Input: RSS feed JSON data.  
  - Output: JSON with selected topic data.  
  - Failure Modes: AI model errors, malformed input data, or no relevant topics found.

- **OpenAI Chat Model - Filter**  
  - Type: OpenAI Chat Model (GPT-4o-mini)  
  - Configuration: Used internally by the AI Agent node for language model inference.  
  - Credentials: OpenAI API key required.  
  - Input/Output: Linked as AI language model for Trend Filter agent.  
  - Failure Modes: API quota exceeded, authentication errors, timeouts.

- **Structured Output Parser - Filter**  
  - Type: LangChain Output Parser (Structured JSON)  
  - Configuration: Defines a strict JSON schema for AI output to ensure consistent fields (`selected_topic`, `reason`, `target_audience`).  
  - Input: Raw AI output string.  
  - Output: Parsed JSON object for downstream nodes.  
  - Failure Modes: Parsing errors if AI output deviates from schema.

---

### 1.2 AI Content Factory

**Overview:**  
Using the selected topic, this block runs three AI agents in parallel to create content drafts for three platforms: SEO blog post, Instagram carousel post, and TikTok video script.

**Nodes Involved:**  
- AI Agent: SEO Blog Writer (LangChain Agent)  
- OpenAI Chat Model - Blog (OpenAI Chat)  
- AI Agent: Instagram Designer (LangChain Agent)  
- OpenAI Chat Model - Instagram (OpenAI Chat)  
- AI Agent: Script Writer (LangChain Agent)  
- OpenAI Chat Model - Script (OpenAI Chat)  
- Merge All Content (Merge)  

**Node Details:**

- **AI Agent: SEO Blog Writer**  
  - Type: LangChain Agent  
  - Configuration: System prompt instructs it as an SEO expert to create a ~3000 character blog post outline with headings (H1, H2, H3), starting with the conclusion, satisfying search intent and delivering practical info.  
  - Input: `selected_topic` string from Trend Filter output.  
  - Output: Blog outline JSON/text.  
  - Failure Modes: AI errors, too short or irrelevant content.

- **OpenAI Chat Model - Blog**  
  - Type: OpenAI Chat Model (GPT-4o-mini)  
  - Configuration: Called internally by SEO Blog Writer agent for content generation.  
  - Credentials: OpenAI API key.  
  - Failure Modes: API limits, auth failures.

- **AI Agent: Instagram Designer**  
  - Type: LangChain Agent  
  - Configuration: Instructions to create a 5-slide Instagram carousel post outline with catchy titles, bullet points, visual suggestions, and a CTA on the last slide. Input topic passed dynamically.  
  - Input: Topic string from Trend Filter.  
  - Output: Instagram carousel content.  
  - Failure Modes: AI model failures, incomplete content.

- **OpenAI Chat Model - Instagram**  
  - Type: OpenAI Chat Model (GPT-4o-mini)  
  - Credentials: OpenAI API key  
  - Used internally by Instagram Designer agent.  
  - Failure Modes: Same as above.

- **AI Agent: Script Writer**  
  - Type: LangChain Agent  
  - Configuration: Creates a viral TikTok/Reels video script (<60 seconds) with a hook, problem, solution, demo, and CTA, including visual and subtitle instructions.  
  - Input: Topic string from Trend Filter.  
  - Output: Video script text.  
  - Failure Modes: AI model failures, incoherent scripts.

- **OpenAI Chat Model - Script**  
  - Type: OpenAI Chat Model (GPT-4o-mini)  
  - Credentials: OpenAI API key  
  - Used internally by Script Writer agent.  
  - Failure Modes: API issues.

- **Merge All Content**  
  - Type: Merge (Multiple Inputs)  
  - Configuration: Merges outputs from the three AI agents into a single JSON object for downstream use.  
  - Inputs: Blog Writer (index 0), Instagram Designer (index 1), Script Writer (index 2).  
  - Output: Combined content object with keys `blog_content`, `insta_content`, `script_content`.  
  - Failure Modes: Input mismatch, missing data from any AI agent.

---

### 1.3 Approval Loop

**Overview:**  
This block sends the combined content drafts to Slack with interactive buttons for approval or rejection, waits for user response, and conditionally saves the approved content to Google Sheets.

**Nodes Involved:**  
- Code in JavaScript  
- Send to Slack for Approval (Slack)  
- Wait (Wait for webhook resume)  
- If (Conditional check on user action)  
- Append row in sheet (Google Sheets)  

**Node Details:**

- **Code in JavaScript**  
  - Type: Code (JavaScript)  
  - Configuration: Cleans and consolidates the three content strings from the merged object to ensure Slack message compatibility (escapes characters).  
  - Input: Merged content from Merge All Content node.  
  - Output: Object with cleaned `blog_content`, `insta_content`, and `script_content`.  
  - Failure Modes: Code errors, missing input data.

- **Send to Slack for Approval**  
  - Type: Slack node with OAuth2 authentication  
  - Configuration: Sends a rich Slack message with blocks: header, blog excerpt, Instagram excerpt, script excerpt, and two buttons: “Approve and Save” and “Reject”. Buttons link to the workflow resume URL with query parameters (`action=approve` or `action=reject`).  
  - Input: Cleaned content from JavaScript node.  
  - Output: Triggers Wait node.  
  - Failure Modes: Slack API errors, auth failures, malformed message blocks.

- **Wait**  
  - Type: Wait (Webhook)  
  - Configuration: Pauses workflow execution until a webhook call resumes it with user action from Slack buttons.  
  - Input: From Slack node.  
  - Output: To If node.  
  - Failure Modes: Timeout if no response, webhook misconfiguration.

- **If**  
  - Type: If (Conditional)  
  - Configuration: Checks if the `action` query parameter equals `"approve"`.  
  - Input: Resumed webhook data.  
  - Output: On true, passes to Append row in sheet; on false, ends workflow.  
  - Failure Modes: Missing or malformed query data.

- **Append row in sheet**  
  - Type: Google Sheets node  
  - Configuration: Appends a new row to a configured Google Sheet with three columns containing the approved blog content, Instagram content, and script content. Uses OAuth2 credentials.  
  - Input: From If node on approval.  
  - Output: Workflow end.  
  - Failure Modes: Google Sheets API errors, auth issues, quota limits.

---

## 3. Summary Table

| Node Name                   | Node Type                      | Functional Role                                  | Input Node(s)                  | Output Node(s)                 | Sticky Note                                                                                         |
|-----------------------------|--------------------------------|-------------------------------------------------|-------------------------------|-------------------------------|---------------------------------------------------------------------------------------------------|
| Every 8 Hours               | Schedule Trigger               | Starts workflow every 8 hours                    | None                          | Workflow Configuration         | Part of Trend Scout: Fetches daily trends and triggers workflow every 8 hours                     |
| Workflow Configuration      | Set                           | Defines config variables (RSS URL, Slack channel) | Every 8 Hours                 | Fetch Google Trends RSS        | Part of Trend Scout                                                                                |
| Fetch Google Trends RSS     | HTTP Request                  | Fetches Google News RSS feed                      | Workflow Configuration        | AI Agent: Trend Filter         | Part of Trend Scout                                                                                |
| AI Agent: Trend Filter      | LangChain AI Agent            | Selects one viral trending topic                  | Fetch Google Trends RSS       | AI Agent: SEO Blog Writer, AI Agent: Instagram Designer, AI Agent: Script Writer | Part of Trend Scout                                                                                |
| OpenAI Chat Model - Filter  | OpenAI Chat Model             | Language model for Trend Filter agent             | AI Agent: Trend Filter (internal) | AI Agent: Trend Filter (internal) |                                                                                                |
| Structured Output Parser - Filter | LangChain Output Parser Structured | Parses Trend Filter AI output to JSON schema     | AI Agent: Trend Filter (raw)  | AI Agent: Trend Filter (parsed) |                                                                                                |
| AI Agent: SEO Blog Writer   | LangChain AI Agent            | Generates SEO blog outline for selected topic    | AI Agent: Trend Filter        | Merge All Content              | Part of AI Content Factory                                                                         |
| OpenAI Chat Model - Blog    | OpenAI Chat Model             | Language model for SEO Blog Writer                 | AI Agent: SEO Blog Writer (internal) | AI Agent: SEO Blog Writer (internal) |                                                                                                |
| AI Agent: Instagram Designer| LangChain AI Agent            | Creates Instagram carousel post outline           | AI Agent: Trend Filter        | Merge All Content              | Part of AI Content Factory                                                                         |
| OpenAI Chat Model - Instagram | OpenAI Chat Model           | Language model for Instagram Designer              | AI Agent: Instagram Designer (internal) | AI Agent: Instagram Designer (internal) |                                                                                                |
| AI Agent: Script Writer     | LangChain AI Agent            | Writes TikTok/Reels video script                   | AI Agent: Trend Filter        | Merge All Content              | Part of AI Content Factory                                                                         |
| OpenAI Chat Model - Script  | OpenAI Chat Model             | Language model for Script Writer                    | AI Agent: Script Writer (internal) | AI Agent: Script Writer (internal) |                                                                                                |
| Merge All Content           | Merge                         | Combines blog, Instagram, and script outputs      | AI Agent: SEO Blog Writer, AI Agent: Instagram Designer, AI Agent: Script Writer | Code in JavaScript             |                                                                                                |
| Code in JavaScript          | Code                          | Cleans and merges outputs for Slack message       | Merge All Content             | Send to Slack for Approval     |                                                                                                   |
| Send to Slack for Approval  | Slack                         | Sends content drafts to Slack with approval buttons | Code in JavaScript            | Wait                          | Sends interactive approval request to Slack                                                      |
| Wait                       | Wait                          | Pauses workflow awaiting Slack user action        | Send to Slack for Approval    | If                           |                                                                                                   |
| If                         | If                            | Checks if Slack action was "approve"               | Wait                         | Append row in sheet (if true) |                                                                                                   |
| Append row in sheet         | Google Sheets                 | Stores approved content in Google Sheets            | If (approve path)             | None                         | Saves final approved content                                                                     |
| Sticky Note (Trend Scout)  | Sticky Note                   | Documentation block for Trend Scout block           | None                         | None                         | "Fetches daily trends from Google. An AI agent analyzes the feed to pick the single most engaging topic for content creation." |
| Sticky Note1 (AI Content Factory) | Sticky Note             | Documentation block for AI Content Factory          | None                         | None                         | "Parallel AI agents generate three distinct formats: an SEO blog post, Instagram carousel slides, and a TikTok video script." |
| Sticky Note2 (Approval Loop) | Sticky Note                 | Documentation block for Approval Loop               | None                         | None                         | "Sends the drafts to Slack with interactive buttons. The workflow waits for your approval before saving the final content to Google Sheets." |
| Sticky Note3 (Overview)    | Sticky Note                   | General overview and setup instructions             | None                         | None                         | "# 🚀 Automated Trend-Based Content Generator\n\nThis workflow turns daily Google Trends into ready-to-post content for Blog, Instagram, and TikTok using AI Agents.\n\n## ⚡️ How it works\n1. **Scout:** Fetches Google Trends and selects the best viral topic.\n2. **Create:** Generates an SEO Blog, Carousel slides, and a Script simultaneously.\n3. **Approve:** Sends drafts to Slack. Click \"Approve\" to save to Google Sheets.\n\n## 🛠 Setup Requirements\n- **OpenAI API Key** (GPT-4o recommended)\n- **Slack Account** (for notifications)\n- **Google Sheets** (for storage)" |

---

## 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node:**  
   - Name: "Every 8 Hours"  
   - Type: Schedule Trigger  
   - Configure to run every 8 hours.

2. **Create a Set node:**  
   - Name: "Workflow Configuration"  
   - Type: Set  
   - Define two string variables:  
     - `trendsRssUrl`: `https://trends.google.com/trends/trendingsearches/daily/rss?geo=JP` (adjust as needed)  
     - `slackChannel`: `general` (or your Slack channel)

3. **Create an HTTP Request node:**  
   - Name: "Fetch Google Trends RSS"  
   - Type: HTTP Request  
   - Set URL to: `https://news.google.com/rss?hl=ja&gl=JP&ceid=JP:ja` (or use `trendsRssUrl` variable if preferred)  
   - No authentication needed.

4. **Create a LangChain AI Agent node:**  
   - Name: "AI Agent: Trend Filter"  
   - Type: LangChain Agent  
   - Input Text: Use the RSS feed JSON data from previous node.  
   - System Prompt: Request it to select one trending topic from "gadgets", "AI technology", and "life hacks" niches based on viral potential criteria.  
   - Enable output parser.

5. **Create an OpenAI Chat Model node for filter:**  
   - Name: "OpenAI Chat Model - Filter"  
   - Type: OpenAI Chat Model  
   - Model: GPT-4o-mini (or similar)  
   - Link this node as the language model inside the Trend Filter agent.  
   - Configure OpenAI API credentials.

6. **Create a Structured Output Parser node:**  
   - Name: "Structured Output Parser - Filter"  
   - Type: LangChain Output Parser Structured  
   - Define JSON schema with properties: `selected_topic` (string), `reason` (string), `target_audience` (string).  
   - Connect output parser to the Trend Filter agent.

7. **Create three parallel LangChain AI Agent nodes:**  
   - **AI Agent: SEO Blog Writer**  
     - Input Text: `{{ $json.output.selected_topic }}`  
     - System Prompt: SEO professional blog writer instructions to create a 3000-character blog outline with headings and practical info.  
     - Uses OpenAI Chat Model - Blog node internally.  
   - **AI Agent: Instagram Designer**  
     - Input Text: `"トピック:{{ $json.output.selected_topic }}\nインスタのカルーセル投稿（5枚分）の構成案を作って。"`  
     - System Prompt: Instagram viral content designer instructions for 5-slide carousel post.  
     - Uses OpenAI Chat Model - Instagram internally.  
   - **AI Agent: Script Writer**  
     - Input Text: `"トピック:{{ $json.output.selected_topic }}\nTikTok用の動画台本を作って。"`  
     - System Prompt: TikTok/Reels script writer instructions for a <60s viral video script with hook, problem, solution, and CTA.  
     - Uses OpenAI Chat Model - Script internally.

8. **Create three OpenAI Chat Model nodes:**  
   - Names: "OpenAI Chat Model - Blog", "OpenAI Chat Model - Instagram", "OpenAI Chat Model - Script"  
   - Model: GPT-4o-mini or equivalent.  
   - Configure OpenAI API credentials.

9. **Create a Merge node:**  
   - Name: "Merge All Content"  
   - Type: Merge  
   - Configure to merge three inputs (Blog Writer, Instagram Designer, Script Writer).  
   - This node consolidates the three AI outputs.

10. **Create a Code node (JavaScript):**  
    - Name: "Code in JavaScript"  
    - Purpose: Cleans strings from merged output to make them Slack-safe by escaping special characters.  
    - Use the following logic (summarized):  
      - Retrieve all three inputs.  
      - Define a `clean(text)` function that JSON stringifies and strips quotes to escape characters.  
      - Return an object with cleaned `blog_content`, `insta_content`, and `script_content`.

11. **Create a Slack node:**  
    - Name: "Send to Slack for Approval"  
    - Type: Slack (OAuth2)  
    - Configure to send a rich block message to the Slack channel (use variable from Workflow Configuration or hardcode).  
    - Message includes:  
      - Header announcing new content.  
      - Excerpts of blog, Instagram, and script content (first 300-500 characters).  
      - Two buttons: "✅ Approve and Save" and "🗑 Reject", each linking to the workflow resume URL with query params `?action=approve` or `?action=reject`.  
    - Configure OAuth2 Slack credentials.

12. **Create a Wait node:**  
    - Name: "Wait"  
    - Type: Wait for webhook resume  
    - Waits for an external webhook call triggered by Slack button clicks.

13. **Create an If node:**  
    - Name: "If"  
    - Type: If condition  
    - Condition: Check if `{{ $json.query.action }}` equals `"approve"`.

14. **Create a Google Sheets node:**  
    - Name: "Append row in sheet"  
    - Type: Google Sheets Append Row  
    - Configure with Google Sheets OAuth2 credentials.  
    - Target a specific spreadsheet and sheet (e.g., Sheet1).  
    - Map columns to:  
      - Blog content (from cleaned output)  
      - Instagram content  
      - Script content

15. **Connect nodes in order:**  
    - Every 8 Hours → Workflow Configuration → Fetch Google Trends RSS → AI Agent: Trend Filter  
    - AI Agent: Trend Filter → (in parallel) AI Agent: SEO Blog Writer, AI Agent: Instagram Designer, AI Agent: Script Writer  
    - Each AI Agent → Merge All Content  
    - Merge All Content → Code in JavaScript → Send to Slack for Approval → Wait → If  
    - If (approve) → Append row in sheet  
    - If (reject) → End workflow

---

## 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                       | Context or Link                                                                                                                    |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| This workflow turns daily Google Trends into ready-to-post content for Blog, Instagram, and TikTok using AI Agents. Setup requires OpenAI API key (GPT-4o recommended), Slack account for notifications, and Google Sheets for storage. | Sticky Note3 in workflow overview                                                                                               |
| Slack message uses Block Kit with interactive buttons linking to the workflow's resume URL, enabling human-in-the-loop approval.                                                                                                | Slack node "Send to Slack for Approval"                                                                                          |
| AI prompts are written in Japanese, targeting Japanese trending topics and audiences, but can be adapted for other languages or regions by changing RSS feed URLs and prompts.                                                    | Workflow Configuration & AI Agent nodes                                                                                          |
| Google Trends RSS URL used is for Japan region but can be changed via variable in Workflow Configuration node.                                                                                                                  | Workflow Configuration node                                                                                                      |
| OpenAI model used is `gpt-4o-mini` for all AI agents, balancing power and cost.                                                                                                                                                   | All OpenAI Chat Model nodes                                                                                                      |
| The workflow gracefully handles approval and rejection; no data is saved on rejection.                                                                                                                                           | If node and subsequent Google Sheets node                                                                                         |
| The JavaScript node cleans text for Slack to avoid formatting issues, especially with quotes and newlines.                                                                                                                       | Code in JavaScript node                                                                                                          |

---

**Disclaimer:**  
The provided text is exclusively sourced from an automated workflow created with n8n, a tool for integration and automation. This processing strictly respects applicable content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and public.

---