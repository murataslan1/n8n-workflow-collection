Auto-Curate & Post LinkedIn Company Page using RSS + Gemini AI + Templated.io

https://n8nworkflows.xyz/workflows/auto-curate---post-linkedin-company-page-using-rss---gemini-ai---templated-io-9769


# Auto-Curate & Post LinkedIn Company Page using RSS + Gemini AI + Templated.io

### 1. Workflow Overview

This workflow automates the curation and posting of LinkedIn updates for a company page by leveraging an RSS feed and AI-powered content processing. It is designed for marketing teams or social media managers who want to maintain a steady stream of relevant, high-quality LinkedIn posts without manual content creation.

The workflow logically splits into four main blocks:

- **1.1 Curator:** Fetches and aggregates articles from an RSS feed, preparing data for AI evaluation.
- **1.2 Creator & Optimizer:** Uses AI (Google Gemini) to select the best article, generate a concise LinkedIn post, and optimize the post for engagement and quality criteria.
- **1.3 Designer & Poster:** Creates a graphic for the post using Templated.io and posts the final content to the LinkedIn Company Page.
- **1.4 Control & Scheduling:** Triggers the workflow twice weekly and controls conditional posting based on AI confidence score.

---

### 2. Block-by-Block Analysis

#### 2.1 Curator Block

**Overview:**  
This block fetches fresh articles from a specified RSS feed twice a week, aggregates the data, and formats it into a structured list for AI processing.

**Nodes Involved:**  
- Schedule Trigger  
- RSS Read  
- Aggregate  
- group the news into 1 item (Code)  
- Best Article finder  

**Node Details:**

- **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Triggers workflow at 11:00 AM every Tuesday and Thursday (cron expressions).  
  - No input nodes; outputs trigger start.  
  - Edge cases: Cron misconfiguration, timezone issues could cause unexpected trigger times.

- **RSS Read**  
  - Type: RSS Feed Read  
  - Configured with URL: `https://blog.hubspot.com/marketing/rss.xml` (replaceable).  
  - Reads latest articles from RSS feed.  
  - Retries on failure enabled to handle transient network errors.  
  - Input: Trigger from Schedule Trigger. Output: Array of items with title, content, link.  
  - Edge cases: RSS feed unreachable, malformed XML, empty feed.

- **Aggregate**  
  - Type: Aggregate  
  - Aggregates arrays of fields: title[], content[], link[] into a single item with arrays.  
  - Input: RSS Read output. Output: aggregated JSON with arrays.  
  - Edge cases: Empty inputs produce empty arrays; preserves data structure.

- **group the news into 1 item**  
  - Type: Code (JavaScript)  
  - Converts aggregated arrays into a structured list of article objects with id, title, content, and link.  
  - Also creates a human-readable preview string for AI selection.  
  - Input: Aggregate output. Output: JSON with `articles` array and `forAI` text string.  
  - Edge cases: Handles missing fields by substituting empty strings; stable article IDs assigned incrementally.

- **Best Article finder**  
  - Type: LangChain Agent Node  
  - Uses a custom prompt instructing the model to select the best article for the company audience based on practical applicability and save-worthiness.  
  - Input: Structured articles and preview from previous node.  
  - Output: Selected article link only (as per prompt).  
  - Relies on Google Gemini model invoked separately (see below).  
  - Edge cases: Model response ambiguity, API rate limits or failures.

---

#### 2.2 Creator & Optimizer Block

**Overview:**  
This block takes the selected article link, generates a concise LinkedIn post under 200 words, and optimizes the post for quality and engagement using AI.

**Nodes Involved:**  
- Content Creator  
- Post optimizer  
- Structured Output Parser  

**Node Details:**

- **Content Creator**  
  - Type: LangChain Agent Node  
  - Prompt instructs to rewrite the blog content into a quick, bullet-structured post tailored to the company audience, focusing on clarity and practical insights.  
  - Input: Output from Best Article finder (article content).  
  - Output: Generated draft post.  
  - Edge cases: Model output variability, failed API calls, incomplete content.

- **Post optimizer**  
  - Type: LangChain Agent Node  
  - Takes the draft post and analyzes it for practical applicability, fluff removal, human-like style, and formatting rules (no emoji, specific bullet characters). It also generates a catchy headline for the post's image.  
  - Output is structured JSON with final post text, image headline, confidence score (1-10), and a boolean flag whether to post now (score ≥ 7).  
  - Edge cases: Parser errors, low confidence outputs, AI hallucinations.

- **Structured Output Parser**  
  - Type: LangChain Structured Output Parser  
  - Parses the JSON output from Post optimizer to extract fields as strongly typed data for conditional logic downstream.  
  - Input: Post optimizer output.  
  - Output: Parsed JSON fields.  
  - Edge cases: JSON formatting errors, missing fields.

---

#### 2.3 Designer & Poster Block

**Overview:**  
This block creates a custom graphic based on the AI-generated headline and posts the final content and image to LinkedIn.

**Nodes Involved:**  
- If (conditional)  
- Templated (graphic generation)  
- HTTP Request (image retrieval)  
- Create a post (LinkedIn)  

**Node Details:**

- **If**  
  - Type: If (conditional)  
  - Checks if `post_now` is true (confidence score ≥ 7) to proceed with posting.  
  - Input: Structured Output Parser.  
  - Directs flow either to Templated node (true) or loops back to Best Article finder (false).  
  - Edge cases: Missing or malformed flag value.

- **Templated**  
  - Type: Templated.io node  
  - Uses image headline text to create a custom graphic.  
  - Retries on failure enabled.  
  - Input: If node (true path).  
  - Output: A URL (`render_url`) for generated image.  
  - Edge cases: API downtime, invalid parameters.

- **HTTP Request**  
  - Type: HTTP Request  
  - Downloads the image file from the URL provided by Templated.  
  - Input: Templated output.  
  - Output: Binary file data of image.  
  - Edge cases: URL invalid, network errors.

- **Create a post**  
  - Type: LinkedIn node  
  - Posts the final optimized text and image to LinkedIn company page as an organization post.  
  - Requires OAuth2 LinkedIn credentials and organization ID setup.  
  - Input: HTTP Request (image) and Post optimizer (final post text).  
  - Edge cases: Auth failures, API limits, invalid organization ID.

---

#### 2.4 Control & Scheduling

**Overview:**  
This block manages the scheduled recurring trigger and overall flow control.

**Nodes Involved:**  
- Schedule Trigger  

**Node Details:**

- Covered above in Curator block.

---

### 3. Summary Table

| Node Name               | Node Type                          | Functional Role                  | Input Node(s)          | Output Node(s)           | Sticky Note                                         |
|-------------------------|----------------------------------|--------------------------------|-----------------------|--------------------------|----------------------------------------------------|
| Schedule Trigger        | Schedule Trigger                  | Initiates workflow twice weekly| None                  | RSS Read                 |                                                    |
| RSS Read               | RSS Feed Read                    | Fetches articles from RSS      | Schedule Trigger      | Aggregate                | ## Curator - RSS Read curates articles and sends to Article Finder |
| Aggregate              | Aggregate                       | Aggregates article fields      | RSS Read              | group the news into 1 item| ## Curator - RSS Read curates articles and sends to Article Finder |
| group the news into 1 item | Code                           | Structures aggregated articles | Aggregate             | Best Article finder      | ## Curator - RSS Read curates articles and sends to Article Finder |
| Best Article finder    | LangChain Agent                 | Selects best article for audience| group the news into 1 item | Content Creator          |                                                    |
| Google Gemini Chat Model | LangChain Google Gemini LM      | AI model for Best Article finder| -                     | Best Article finder      |                                                    |
| Content Creator        | LangChain Agent                 | Creates LinkedIn post draft     | Best Article finder    | Post optimizer           | ## Creator & Optimizer - Creates Content & Optimizes |
| Google Gemini Chat Model1 | LangChain Google Gemini LM      | AI model for Content Creator    | -                     | Content Creator          | ## Creator & Optimizer - Creates Content & Optimizes |
| Post optimizer         | LangChain Agent                 | Optimizes post, scores quality | Content Creator       | If                       | ## Creator & Optimizer - Creates Content & Optimizes |
| Google Gemini Chat Model2 | LangChain Google Gemini LM      | AI model for Post optimizer     | -                     | Post optimizer           | ## Creator & Optimizer - Creates Content & Optimizes |
| Structured Output Parser| LangChain Structured Output Parser | Parses AI output JSON          | Post optimizer        | If                       | ## Creator & Optimizer - Creates Content & Optimizes |
| If                     | If Condition                   | Checks if post should be published | Structured Output Parser | Templated / Best Article finder | ## Designer & Poster - Creates Design & Posts on LinkedIn |
| Templated              | Templated.io                   | Creates post image graphic      | If                    | HTTP Request             | ## Designer & Poster - Creates Design & Posts on LinkedIn |
| HTTP Request           | HTTP Request                   | Downloads image from URL        | Templated              | Create a post            | ## Designer & Poster - Creates Design & Posts on LinkedIn |
| Create a post          | LinkedIn                       | Publishes post to LinkedIn      | HTTP Request, Post optimizer | None                   | ## Designer & Poster - Creates Design & Posts on LinkedIn |
| Sticky Note            | Sticky Note                    | Documentation note              | None                  | None                     | ## 🧠 Workflow Overview  \nDetailed workflow overview and requirements |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Schedule Trigger node**  
   - Node type: Schedule Trigger  
   - Configure to run at 11:00 AM every Tuesday and Thursday (cron expression: `0 11 * * TUE`, `0 11 * * THU`).  
   - No credentials needed.

2. **Add RSS Read node**  
   - Node type: RSS Feed Read  
   - Set RSS feed URL (default: `https://blog.hubspot.com/marketing/rss.xml`).  
   - Enable retry on fail.  
   - Connect Schedule Trigger → RSS Read.

3. **Add Aggregate node**  
   - Node type: Aggregate  
   - Configure to aggregate fields: `title`, `content`, `link` into arrays.  
   - Connect RSS Read → Aggregate.

4. **Add Code node ("group the news into 1 item")**  
   - Node type: Code (JavaScript)  
   - Paste the provided JavaScript code that converts aggregated arrays into structured article objects and a preview string.  
   - Connect Aggregate → Code node.

5. **Add LangChain Agent node ("Best Article finder")**  
   - Node type: LangChain Agent  
   - Configure prompt to select the best article based on practical application and audience relevance.  
   - Use Google Gemini LM (see step 6) as language model.  
   - Connect Code node → Best Article finder.

6. **Add LangChain Google Gemini Model node**  
   - Node type: LangChain LM Chat Google Gemini  
   - Set modelName to `models/gemini-1.5-flash`.  
   - Connect LM output → Best Article finder (ai_languageModel input).

7. **Add LangChain Agent node ("Content Creator")**  
   - Node type: LangChain Agent  
   - Configure prompt to rewrite selected article into a short (under 200 words), bullet-structured LinkedIn post tailored to audience.  
   - Use Google Gemini LM (see step 8).  
   - Connect Best Article finder → Content Creator.

8. **Add LangChain Google Gemini Model node**  
   - Node type: LangChain LM Chat Google Gemini  
   - Default model (no specific modelName set).  
   - Connect LM output → Content Creator.

9. **Add LangChain Agent node ("Post optimizer")**  
   - Node type: LangChain Agent  
   - Configure prompt to analyze and optimize post for clarity, practical use, human style, and to generate image headline.  
   - Include JSON output format with fields: final_post, image_text, confidence_score (1-10), post_now (boolean).  
   - Use Google Gemini LM (see step 10).  
   - Connect Content Creator → Post optimizer.  
   - Enable retry on fail.

10. **Add LangChain Google Gemini Model node**  
    - Node type: LangChain LM Chat Google Gemini  
    - Set modelName to `models/gemini-1.5-pro`.  
    - Connect LM output → Post optimizer.

11. **Add LangChain Structured Output Parser node**  
    - Node type: LangChain Structured Output Parser  
    - Provide example JSON schema matching Post optimizer output.  
    - Connect Post optimizer → Structured Output Parser.

12. **Add If node**  
    - Node type: If  
    - Condition: Check if `post_now` field from Structured Output Parser is true.  
    - Connect Structured Output Parser → If.

13. **Add Templated.io node**  
    - Node type: Templated  
    - Configure to create a graphic using `image_text` from Post optimizer output as text layer.  
    - Enable retry on fail.  
    - Connect If (true branch) → Templated.

14. **Add HTTP Request node**  
    - Node type: HTTP Request  
    - Configure to download image file from URL field `render_url` output by Templated node.  
    - Connect Templated → HTTP Request.

15. **Add LinkedIn node ("Create a post")**  
    - Node type: LinkedIn  
    - Configure to post as organization (company page), set organization ID.  
    - Set post text from Post optimizer's final_post field.  
    - Attach image binary data from HTTP Request output.  
    - Requires LinkedIn OAuth2 credentials.  
    - Connect HTTP Request → Create a post.

16. **Connect If (false branch)**  
    - Connect back to Best Article finder to skip posting if confidence is low.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                 | Context or Link                                                                                              |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| Workflow uses Gemini AI models from Google via LangChain nodes for content selection, creation, and optimization.                                                                                                                                  | https://cloud.google.com/vertex-ai/docs/generative-ai/overview                                              |
| Templated.io is used for graphic creation based on AI-generated headlines to enhance LinkedIn post engagement.                                                                                                                              | https://templated.io                                                                                         |
| LinkedIn OAuth2 credentials and organization ID must be configured properly for the LinkedIn node to post on behalf of the company page.                                                                                                           | https://docs.microsoft.com/en-us/linkedin/shared/authentication/authentication                               |
| The workflow is scheduled to run at 11:00 AM on Tuesdays and Thursdays; adjust cron expressions as needed for different posting frequency or timezone adaptations.                                                                                 | Cron expression documentation: https://crontab.guru                                                        |
| The AI prompts are crafted to enforce practical, actionable content and exclude purely theoretical articles, improving post relevance and audience engagement.                                                                                      |                                                                                                             |
| Sticky Notes within the workflow provide detailed overview and block explanations for user reference.                                                                                                                                        | Embedded inside the workflow JSON nodes                                                                     |

---

**Disclaimer:** The provided workflow is an automated n8n workflow. It complies fully with content policies and handles only legal and public data sources.