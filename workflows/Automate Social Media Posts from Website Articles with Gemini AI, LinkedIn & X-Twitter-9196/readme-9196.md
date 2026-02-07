Automate Social Media Posts from Website Articles with Gemini AI, LinkedIn & X/Twitter

https://n8nworkflows.xyz/workflows/automate-social-media-posts-from-website-articles-with-gemini-ai--linkedin---x-twitter-9196


# Automate Social Media Posts from Website Articles with Gemini AI, LinkedIn & X/Twitter

### 1. Workflow Overview

This workflow automates the syndication of website articles as social media posts optimized for LinkedIn and Twitter (X). It fetches articles from a specified sitemap, filters and normalizes the data, checks which articles have already been processed via a Google Sheets log, and randomly selects unprocessed articles for content extraction. The article content is then processed by an AI agent powered by Google’s Gemini language model to generate platform-specific social media posts. Finally, the workflow posts the generated content to LinkedIn and Twitter, logging the published posts to Google Sheets to avoid duplicates.

The workflow consists of the following logical blocks:

- **1.1 Input Reception and Scheduling:** Triggers the workflow manually or on schedule, with parameters defining the sitemap URL, language, and enabled social platforms.
- **1.2 Article Discovery and Filtering:** Downloads the sitemap XML, parses it, extracts article URLs, normalizes image data, and filters out undesired pages.
- **1.3 Processed Articles Tracking:** Reads from Google Sheets the list of already processed articles to avoid reposting.
- **1.4 Article Selection:** Randomly picks an unprocessed article for processing.
- **1.5 Article Content Extraction:** Fetches the article webpage, extracts HTML content of the main body.
- **1.6 Preparing Input for AI:** Adds metadata (URL, images, content) for AI processing.
- **1.7 AI Content Generation:** Uses Google Gemini AI to generate LinkedIn and Twitter posts, applying platform-specific style and length constraints.
- **1.8 Posting and Logging:** Posts to LinkedIn and Twitter conditionally and logs the post information back to Google Sheets.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception and Scheduling

**Overview:**  
This block initiates the workflow either manually or on a scheduled time (default noon daily), and sets parameters for the run.

**Nodes Involved:**  
- When clicking ‘Execute workflow’ (Manual Trigger)  
- Schedule Trigger  
- parameters (Set node)

**Node Details:**

- **When clicking ‘Execute workflow’**  
  - Type: Manual Trigger  
  - Role: Start node for manual execution  
  - Configuration: No parameters; triggers on user command  
  - Connections: Outputs to `parameters` node  
  - Edge Cases: None significant

- **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Role: Starts the workflow automatically daily at 12:00 PM  
  - Configuration: Interval set to daily at hour 12  
  - Connections: Outputs to `parameters` node  
  - Edge Cases: Missed triggers possible if system down

- **parameters**  
  - Type: Set  
  - Role: Sets key parameters for the workflow execution  
  - Configuration:  
    - `sitemapURL`: URL of sitemap XML  
    - `language`: Target language for posts (e.g., English)  
    - `linkedinPostEnabled`: boolean flag to enable LinkedIn posting  
    - `twitterPostEnabled`: boolean flag to enable Twitter posting  
  - Connections: Outputs to `fetch sitemap` and `get processed articles`  
  - Edge Cases: Invalid URL or missing parameters can cause downstream errors

---

#### 1.2 Article Discovery and Filtering

**Overview:**  
Downloads the sitemap XML, parses it, extracts article URLs, normalizes image fields, and filters out non-article or table-of-content pages.

**Nodes Involved:**  
- fetch sitemap (HTTP Request)  
- parse sitemap (XML)  
- get list of articles (Split Out)  
- normalize list of images (Code)  
- filter out ToC (Filter)  
- rename fields (Set)  
- Sticky Note (contextual annotation)

**Node Details:**

- **fetch sitemap**  
  - Type: HTTP Request  
  - Role: Downloads sitemap XML from the URL defined in parameters  
  - Configuration: URL expression `={{ $json.sitemapURL }}`  
  - Connections: Outputs to `parse sitemap`  
  - Edge Cases: HTTP errors, invalid sitemap URL

- **parse sitemap**  
  - Type: XML  
  - Role: Parses XML content ignoring attributes, no array wrapping  
  - Configuration: `ignoreAttrs=true`, `explicitArray=false`  
  - Connections: Outputs to `get list of articles`  
  - Edge Cases: Malformed XML, parsing failures

- **get list of articles**  
  - Type: Split Out  
  - Role: Splits sitemap entries into individual article items using path `urlset.url`  
  - Configuration: Field to split out: `urlset.url`  
  - Connections: Outputs to `normalize list of images`  
  - Edge Cases: Empty or missing URL entries

- **normalize list of images**  
  - Type: Code  
  - Role: Ensures the `image` field is always an array (wraps single objects or sets empty array if missing)  
  - Configuration: JavaScript code normalizes the `image` field  
  - Connections: Outputs to `filter out ToC`  
  - Edge Cases: Unexpected data types, missing fields

- **filter out ToC**  
  - Type: Filter  
  - Role: Filters out articles without images (likely ToC or index pages)  
  - Configuration: Checks existence and non-empty `image` field  
  - Connections: Outputs to `rename fields`  
  - Edge Cases: Articles without images excluded, may exclude valid articles lacking images

- **rename fields**  
  - Type: Set  
  - Role: Renames fields to standardized keys:  
    - `url` ← `loc`  
    - `lastModified` ← `lastmod`  
    - `images` ← `image` array  
  - Configuration: Assignments with expressions  
  - Connections: Outputs to aggregation node `availableArticles[]`  
  - Edge Cases: Missing expected fields cause empty values

- **Sticky Notes**  
  - Contextual annotations for groups of nodes, e.g., “Get articles from the sitemap”

---

#### 1.3 Processed Articles Tracking

**Overview:**  
Reads the Google Sheets document tracking articles already processed to prevent reposting.

**Nodes Involved:**  
- get processed articles (Google Sheets)  
- processedArticles (Aggregate)  
- Sticky Note

**Node Details:**

- **get processed articles**  
  - Type: Google Sheets  
  - Role: Reads the sheet containing processed articles  
  - Configuration:  
    - Document ID and Sheet Name set dynamically (empty in config, to be set at runtime)  
    - Authentication: Google Service Account  
  - Connections: Outputs to `processedArticles`  
  - Credentials: Google Sheets service account  
  - Edge Cases: Credential issues, missing sheet or document, empty data

- **processedArticles**  
  - Type: Aggregate  
  - Role: Aggregates all data items, extracting only `url` field  
  - Configuration: Includes only `url` field for matching  
  - Connections: Outputs to `Merge` node  
  - Edge Cases: Empty input means no articles processed yet

- **Sticky Note**  
  - Provides instructions on configuring Google Sheets credentials and document

---

#### 1.4 Article Selection

**Overview:**  
Randomly selects one article from available articles that have not yet been processed.

**Nodes Involved:**  
- availableArticles[] (Aggregate)  
- Merge (Merge)  
- pick random not processed (Code)  
- Sticky Note

**Node Details:**

- **availableArticles[]**  
  - Type: Aggregate  
  - Role: Aggregates all available articles into a single array under `availableArticles` key  
  - Configuration: Aggregate all input data  
  - Connections: Outputs to `Merge` node

- **Merge**  
  - Type: Merge  
  - Role: Combines `availableArticles` and `processedArticles` inputs into one data stream for comparison  
  - Configuration: Default merge mode  
  - Connections: Outputs to `pick random not processed`

- **pick random not processed**  
  - Type: Code  
  - Role: Filters out articles already processed and randomly picks one article for processing  
  - Configuration: JavaScript code uses inputs from merge outputs, compares URLs, excludes already processed  
  - Connections: Outputs to `fetch article`  
  - Edge Cases: No unprocessed articles → returns empty, halting workflow

- **Sticky Note**  
  - Highlights “Pick an article to process”

---

#### 1.5 Article Content Extraction

**Overview:**  
Fetches the selected article’s webpage and extracts main content HTML for AI processing.

**Nodes Involved:**  
- fetch article (HTTP Request)  
- extract HTML content (HTML Extract)  
- Sticky Note

**Node Details:**

- **fetch article**  
  - Type: HTTP Request  
  - Role: Downloads the article webpage from `url` field  
  - Configuration: URL expression `={{ $json.url }}`  
  - Connections: Outputs to `extract HTML content`  
  - Edge Cases: Network errors, 404s, redirects

- **extract HTML content**  
  - Type: HTML Extract  
  - Role: Extracts the main article content HTML using CSS selector `.single-post-content`  
  - Configuration: Operation: Extract HTML content; Selector: `div.single-post-content`  
  - Connections: Outputs to `add metadata`  
  - Edge Cases: Selector not matching, empty content

- **Sticky Note**  
  - Indicates “Get article content”

---

#### 1.6 Preparing Input for AI

**Overview:**  
Adds metadata and aggregates content with article details for AI prompt.

**Nodes Involved:**  
- add metadata (Set)  
- Sticky Note

**Node Details:**

- **add metadata**  
  - Type: Set  
  - Role: Aggregates article metadata and content for downstream AI processing  
  - Configuration:  
    - Sets fields:  
      - `url` from `pick random not processed` node  
      - `lastModified` from same  
      - `images` from same  
      - `content` from extracted article content  
  - Connections: Outputs to `AI Agent`  
  - Edge Cases: Missing fields if prior step fails

- **Sticky Note**  
  - No special notes here

---

#### 1.7 AI Content Generation

**Overview:**  
Uses Google Gemini AI and Langchain agent to generate social media posts from the article content, adhering to platform-specific guidelines.

**Nodes Involved:**  
- AI Agent (Langchain Agent)  
- Google Gemini Chat Model (AI Model)  
- Structured Output Parser (AI Output Parser)  
- Sticky Note

**Node Details:**

- **Google Gemini Chat Model**  
  - Type: Langchain Google Gemini Model node  
  - Role: Executes the AI model to generate text  
  - Configuration: No special options; uses linked API credential  
  - Credentials: Google Gemini (PaLM) API  
  - Connections: Linked as AI Model for `AI Agent`

- **Structured Output Parser**  
  - Type: Langchain Output Parser  
  - Role: Parses AI output into structured JSON with keys: `LinkedInPost`, `TwitterPost`, `TwitterThread`  
  - Configuration: Uses manual JSON schema for expected fields  
  - Connections: Linked as output parser for `AI Agent`

- **AI Agent**  
  - Type: Langchain Agent  
  - Role: Orchestrates prompt with article content and parameters, calls AI model for generation  
  - Configuration:  
    - Prompt instructs: generate platform-optimized posts (LinkedIn, Twitter, Twitter thread) based on article content and URL  
    - Includes language and enabled post type flags from parameters  
    - Detailed guidelines for style, length, hashtags, tone, and structure per platform  
    - System message defines agent as expert social media strategist  
  - Connections: Outputs structured AI result to `add processed article`  
  - Edge Cases: API rate limits, malformed response, parsing errors

- **Sticky Note**  
  - Notes “Generate social posts” and mentions API key setup

---

#### 1.8 Posting and Logging

**Overview:**  
Posts generated content to LinkedIn and Twitter conditionally, then logs each post to Google Sheets for tracking.

**Nodes Involved:**  
- add processed article (Google Sheets Append)  
- If Twitter post created (IF)  
- If LinkedIn post created (IF)  
- Create Tweet (Twitter Post)  
- Create a post (LinkedIn Post)  
- Sticky Notes

**Node Details:**

- **add processed article**  
  - Type: Google Sheets  
  - Role: Appends the newly generated posts and article URL to tracking spreadsheet  
  - Configuration:  
    - Fields: `url`, `status` (set to "ready"), `timestamp` (current datetime), `Twitter post`, `LinkedIn post`  
    - Uses dynamic document and sheet IDs from `get processed articles` node  
    - Authentication: Google Service Account  
  - Connections: Branches to two IF nodes checking post existence  
  - Edge Cases: Credential errors, append failures

- **If Twitter post created**  
  - Type: IF  
  - Role: Checks if Twitter post string exists and is non-empty  
  - Configuration: Condition on `Twitter post` field existence and non-empty  
  - Connections: If true, outputs to `Create Tweet`

- **Create Tweet**  
  - Type: Twitter  
  - Role: Posts Twitter message with text from AI output  
  - Configuration: Text set via expression referencing AI output field  
  - Credentials: Twitter OAuth  
  - Edge Cases: Rate limits, auth errors, posting failures

- **If LinkedIn post created**  
  - Type: IF  
  - Role: Checks if LinkedIn post string exists and is non-empty  
  - Configuration: Condition on `LinkedIn post` field existence and non-empty  
  - Connections: If true, outputs to `Create a post`

- **Create a post**  
  - Type: LinkedIn  
  - Role: Posts LinkedIn post with text and article link (shared as article)  
  - Configuration: Text set via expression referencing AI output  
  - Credentials: LinkedIn OAuth  
  - Edge Cases: Auth issues, posting errors

- **Sticky Notes**  
  - Provide guidance on credential setup for posting and saving

---

### 3. Summary Table

| Node Name                   | Node Type                     | Functional Role                                  | Input Node(s)                  | Output Node(s)                      | Sticky Note                                   |
|-----------------------------|-------------------------------|-------------------------------------------------|-------------------------------|------------------------------------|-----------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger                | Manual workflow start                            | None                          | parameters                         |                                               |
| Schedule Trigger            | Schedule Trigger              | Scheduled workflow start                         | None                          | parameters                         |                                               |
| parameters                 | Set                          | Defines parameters (sitemap URL, language, etc.)| When clicking, Schedule Trigger | fetch sitemap, get processed articles | Configure sitemap URL, language, enable posts |
| fetch sitemap              | HTTP Request                 | Downloads sitemap XML                            | parameters                    | parse sitemap                     |                                               |
| parse sitemap              | XML                          | Parses sitemap XML                              | fetch sitemap                 | get list of articles             |                                               |
| get list of articles       | Split Out                    | Splits sitemap into articles                    | parse sitemap                 | normalize list of images          |                                               |
| normalize list of images   | Code                         | Ensures image field is an array                  | get list of articles          | filter out ToC                   |                                               |
| filter out ToC             | Filter                       | Filters out pages without images (ToC, index)  | normalize list of images      | rename fields                   |                                               |
| rename fields              | Set                          | Renames fields: url, lastModified, images      | filter out ToC               | availableArticles[]              |                                               |
| availableArticles[]        | Aggregate                    | Collects all available articles                  | rename fields                | Merge                          |                                               |
| get processed articles     | Google Sheets                | Reads processed articles from tracking sheet   | parameters                   | processedArticles               | Configure Google Sheets credentials and sheet |
| processedArticles          | Aggregate                    | Aggregates processed article URLs               | get processed articles       | Merge                          |                                               |
| Merge                     | Merge                        | Combines available and processed articles       | availableArticles[], processedArticles | pick random not processed         |                                               |
| pick random not processed  | Code                         | Picks random article not yet processed          | Merge                        | fetch article                  |                                               |
| fetch article             | HTTP Request                 | Downloads article webpage                        | pick random not processed    | extract HTML content             |                                               |
| extract HTML content       | HTML Extract                 | Extracts main article content HTML               | fetch article                | add metadata                   |                                               |
| add metadata              | Set                          | Adds metadata and content for AI processing     | extract HTML content         | AI Agent                      |                                               |
| AI Agent                  | Langchain Agent              | Generates social media posts via AI              | add metadata, Google Gemini Model, Structured Output Parser | add processed article             | API key required for AI generation             |
| Google Gemini Chat Model  | Langchain Model              | Provides AI language model                        | AI Agent (model input)       | AI Agent (model output)        |                                               |
| Structured Output Parser  | Langchain Output Parser      | Parses AI output into structured JSON            | AI Agent (output)            | add processed article          |                                               |
| add processed article     | Google Sheets Append         | Logs processed article and posts                 | AI Agent                    | If Twitter post created, If LinkedIn post created | Configure Google Sheets credentials            |
| If Twitter post created   | IF                           | Checks if Twitter post exists                     | add processed article        | Create Tweet                  |                                               |
| Create Tweet             | Twitter                      | Posts tweet to Twitter/X                          | If Twitter post created      | None                         |                                               |
| If LinkedIn post created  | IF                           | Checks if LinkedIn post exists                    | add processed article        | Create a post                 |                                               |
| Create a post            | LinkedIn                     | Posts to LinkedIn                                 | If LinkedIn post created     | None                         |                                               |
| Sticky Notes             | Sticky Note                  | Contextual information and setup instructions    | Various                     | Various                      | Multiple sticky notes provide setup guidance  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger node:**  
   - Name: `When clicking ‘Execute workflow’`  
   - No parameters needed.

2. **Create a Schedule Trigger node:**  
   - Name: `Schedule Trigger`  
   - Set to run daily at 12:00 (noon).

3. **Create a Set node for parameters:**  
   - Name: `parameters`  
   - Add fields:  
     - `sitemapURL` (string): e.g., `https://example.com/sitemap.xml`  
     - `language` (string): e.g., `English`  
     - `linkedinPostEnabled` (boolean): true/false  
     - `twitterPostEnabled` (boolean): true/false  
   - Connect both Manual and Schedule triggers to this node.

4. **Create HTTP Request node to fetch sitemap:**  
   - Name: `fetch sitemap`  
   - URL: `={{ $json.sitemapURL }}`  
   - Connect output from `parameters`.

5. **Create XML node to parse sitemap:**  
   - Name: `parse sitemap`  
   - Set options: `Ignore Attributes = true`, `Explicit Array = false`  
   - Connect output from `fetch sitemap`.

6. **Create Split Out node to extract articles:**  
   - Name: `get list of articles`  
   - Field to split out: `urlset.url`  
   - Connect output from `parse sitemap`.

7. **Create Code node to normalize images:**  
   - Name: `normalize list of images`  
   - JS code:  
     ```javascript
     for (const item of items) {
       if (!item.json["image"]) item.json["image"] = [];
       else if (!Array.isArray(item.json["image"])) item.json["image"] = [item.json["image"]];
     }
     return items;
     ```  
   - Connect output from `get list of articles`.

8. **Create Filter node to exclude ToC pages:**  
   - Name: `filter out ToC`  
   - Condition: `image` field exists and is not empty  
   - Connect output from `normalize list of images`.

9. **Create Set node to rename fields:**  
   - Name: `rename fields`  
   - Assignments:  
     - `url` ← `loc`  
     - `lastModified` ← `lastmod`  
     - `images` ← `image`  
   - Connect output from `filter out ToC`.

10. **Create Aggregate node to collect available articles:**  
    - Name: `availableArticles[]`  
    - Aggregate all items into single array field `availableArticles`  
    - Connect output from `rename fields`.

11. **Create Google Sheets node to read processed articles:**  
    - Name: `get processed articles`  
    - Authentication: Google Service Account (configure credentials)  
    - Spreadsheet and sheet to be configured (document and sheet ID)  
    - Connect output from `parameters`.

12. **Create Aggregate node to extract processed article URLs:**  
    - Name: `processedArticles`  
    - Include only `url` field  
    - Connect output from `get processed articles`.

13. **Create Merge node to combine available and processed articles:**  
    - Name: `Merge`  
    - Connect `availableArticles[]` (main input 0) and `processedArticles` (main input 1).

14. **Create Code node to pick random unprocessed article:**  
    - Name: `pick random not processed`  
    - JS code:  
      ```javascript
      const available = $input.all()[0].json.availableArticles;
      const processedUrls = $input.all()[1].json.map(a => a.url);
      const remaining = available.filter(a => !processedUrls.includes(a.url));
      if (remaining.length === 0) return [];
      const chosen = remaining[Math.floor(Math.random() * remaining.length)];
      return [{json: chosen}];
      ```  
    - Connect output from `Merge`.

15. **Create HTTP Request node to fetch article content:**  
    - Name: `fetch article`  
    - URL: `={{ $json.url }}`  
    - Connect output from `pick random not processed`.

16. **Create HTML Extract node to extract main content:**  
    - Name: `extract HTML content`  
    - Operation: Extract HTML content  
    - Selector: `div.single-post-content`  
    - Connect output from `fetch article`.

17. **Create Set node to add metadata for AI:**  
    - Name: `add metadata`  
    - Assign fields:  
      - `url` from `pick random not processed` node  
      - `lastModified` from same  
      - `images` from same  
      - `content` from `extract HTML content`  
    - Connect output from `extract HTML content`.

18. **Create Langchain Google Gemini Chat Model node:**  
    - Name: `Google Gemini Chat Model`  
    - Configure with Google Gemini API credential.

19. **Create Langchain Structured Output Parser node:**  
    - Name: `Structured Output Parser`  
    - JSON schema expects: `LinkedInPost` (string), `TwitterPost` (string), `TwitterThread` (array of strings).

20. **Create Langchain Agent node:**  
    - Name: `AI Agent`  
    - Configure prompt with:  
      - Article content and URL  
      - Language and enabled channels from `parameters` node  
      - Detailed instructions for LinkedIn and Twitter post formats  
    - Link AI Model to `Google Gemini Chat Model`  
    - Link output parser to `Structured Output Parser`  
    - Connect input from `add metadata`.

21. **Create Google Sheets Append node to log processed article:**  
    - Name: `add processed article`  
    - Configure same sheet as `get processed articles`  
    - Append fields: `url`, `status` = "ready", current timestamp, `Twitter post`, `LinkedIn post` from AI output  
    - Connect output from `AI Agent`.

22. **Create IF node to check Twitter post existence:**  
    - Name: `If Twitter post created`  
    - Condition: Field `Twitter post` exists and is not empty  
    - Connect input from `add processed article`.

23. **Create Twitter node to post tweet:**  
    - Name: `Create Tweet`  
    - Text: `={{ $json["Twitter post"] }}`  
    - Configure Twitter OAuth credentials  
    - Connect input from `If Twitter post created` true branch.

24. **Create IF node to check LinkedIn post existence:**  
    - Name: `If LinkedIn post created`  
    - Condition: Field `LinkedIn post` exists and is not empty  
    - Connect input from `add processed article`.

25. **Create LinkedIn node to post a LinkedIn post:**  
    - Name: `Create a post`  
    - Text: `={{ $json["LinkedIn post"] }}`  
    - Post type: Article share  
    - Configure LinkedIn OAuth credentials  
    - Connect input from `If LinkedIn post created` true branch.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                 | Context or Link                                                                                   |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| The workflow requires a valid sitemap in XML format according to the [Sitemaps protocol](https://www.sitemaps.org/protocol.html).                                                                                                                                                                                                          | Sitemap XML specification                                                                         |
| Google Gemini API key is required for AI text generation. Configure credentials under Google Gemini node.                                                                                                                                                                                                                                    | https://developers.generativeai.google/                                                         |
| Google Sheets credentials must be configured with a service account that has read/write access to the tracking spreadsheet.                                                                                                                                                                                                                | Google Sheets API and service accounts documentation                                            |
| LinkedIn and Twitter credentials require OAuth authorization and API keys for posting.                                                                                                                                                                                                                                                       | Platforms’ developer portals                                                                     |
| The AI prompt is carefully designed to produce platform-optimized posts with specific style, length, hashtags, and tone instructions for LinkedIn and Twitter.                                                                                                                                                                            | The prompt is embedded in AI Agent node                                                         |
| Articles without images are excluded to avoid table-of-content or non-content pages. This filter could be adjusted depending on site structure.                                                                                                                                                                                             | Filter node “filter out ToC”                                                                     |
| If no unprocessed articles remain, the workflow ends gracefully without error.                                                                                                                                                                                                                                                              | Code node “pick random not processed” returns empty array                                        |
| Posting nodes execute conditionally: posts are only published if corresponding AI output is generated.                                                                                                                                                                                                                                     | IF nodes before posting                                                                         |
| The workflow logs posts with status “ready” and timestamps to the Google Sheets for audit and to prevent duplication.                                                                                                                                                                                                                       | Google Sheets append node “add processed article”                                               |
| To modify target social platforms, adjust flags in `parameters` node (e.g., disable LinkedIn or Twitter posting).                                                                                                                                                                                                                           | `linkedinPostEnabled` and `twitterPostEnabled` boolean flags                                    |
| The workflow includes detailed sticky notes explaining setup steps, credentials, and operational instructions for user clarity.                                                                                                                                                                                                           | Sticky Notes nodes scattered throughout the workflow                                            |

---

*Disclaimer: This document is generated from a fully detailed n8n workflow export. All operations and integrations comply with platform policies and legal requirements.*