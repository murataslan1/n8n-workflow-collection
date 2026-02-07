Automate Social Media Headlines with Bright Data & n8n

https://n8nworkflows.xyz/workflows/automate-social-media-headlines-with-bright-data---n8n-5215


# Automate Social Media Headlines with Bright Data & n8n

### 1. Workflow Overview

This workflow automates the process of generating and publishing social media posts based on trending headlines from Vogue’s fashion section. It leverages Bright Data's web scraping capabilities to reliably extract headlines from Vogue’s website, uses OpenAI-powered AI models to craft engaging posts tailored for LinkedIn and X (formerly Twitter), and then automatically publishes the generated content to these platforms.

The workflow is logically divided into four main blocks:

- **1.1 Set Target Source**: Defines the news source (Vogue URL) and triggers the workflow.
- **1.2 Scrape & Extract Headlines**: Uses Bright Data’s API to scrape the Vogue webpage and extracts headline text via HTML parsing.
- **1.3 AI Content Generation**: Sends the extracted headlines to OpenAI Chat Models to generate platform-specific social media posts.
- **1.4 Auto-Publish to Social Media**: Publishes the AI-generated posts to LinkedIn and X (Twitter) automatically.

---

### 2. Block-by-Block Analysis

#### 2.1 Block: Set Target Source

**Overview:**  
This block initializes the workflow by manually triggering the run and setting the target URL (Vogue’s fashion page) dynamically, allowing flexibility to target different sources if needed.

**Nodes Involved:**  
- Run workflow  
- Set Target News URL

**Node Details:**

- **Run workflow**  
  - *Type & Role:* Manual Trigger — entry point to start the automation manually or via scheduling.  
  - *Configuration:* No parameters; triggers workflow execution.  
  - *Inputs:* None  
  - *Outputs:* Connects to `Set Target News URL`  
  - *Edge Cases:* If scheduling is added, misconfiguration might cause missed runs.  
  - *Notes:* Acts as the "GPS" for the workflow.

- **Set Target News URL**  
  - *Type & Role:* Set Node — assigns the source website name and URL for scraping.  
  - *Configuration:* Assigns two string variables:  
    - `SIte`: "Vogue"  
    - `URL`: "https://www.vogue.com/fashion"  
  - *Inputs:* From `Run workflow`  
  - *Outputs:* To `Scrape Vogue via Bright data`  
  - *Edge Cases:* URL must be valid and reachable; changing URL format may require updating downstream extraction selectors.

---

#### 2.2 Block: Scrape & Extract Headlines

**Overview:**  
This block fetches the webpage content from Vogue using Bright Data’s proxy API to bypass bot protections and then extracts the headline text using a CSS selector.

**Nodes Involved:**  
- Scrape Vogue via Bright data  
- Extract Title

**Node Details:**

- **Scrape Vogue via Bright data**  
  - *Type & Role:* HTTP Request — performs a POST request to Bright Data’s API to get raw HTML of the target URL.  
  - *Configuration:*  
    - URL: `https://api.brightdata.com/request`  
    - Method: POST  
    - Body Parameters:  
      - `zone`: "n8n_unblocker" (Bright Data zone)  
      - `url`: dynamic from `Set Target News URL` (`{{$json.URL}}`)  
      - `country`: "us"  
      - `format`: "raw" (raw HTML)  
    - Header: Authorization Bearer token (`API_KEY`) — requires valid Bright Data credentials.  
  - *Inputs:* From `Set Target News URL`  
  - *Outputs:* Raw HTML content to `Extract Title`  
  - *Edge Cases:*  
    - Invalid API key or expired token → authentication failure.  
    - Network timeouts or rate limits from Bright Data.  
    - Website layout changes affecting scraping accuracy.  
    - Bright Data zone misconfiguration.  

- **Extract Title**  
  - *Type & Role:* HTML Extract — parses the raw HTML to extract headlines using CSS selector.  
  - *Configuration:*  
    - Operation: Extract HTML content  
    - Extraction value:  
      - Key: `Title`  
      - CSS Selector: A very specific selector targeting the headline element under the Vogue page structure (`#5f10df145161a26b33fec09b > div > div > ... > a > h3`)  
  - *Inputs:* Raw HTML from Bright Data request  
  - *Outputs:* JSON with extracted `Title` to `LinkedIn post writer`  
  - *Edge Cases:*  
    - Selector is brittle; changes to Vogue’s page structure will cause extraction failure or empty results.  
    - If multiple headlines exist, only the first matching will be extracted unless configured otherwise.  
    - HTML malformed or incomplete results.

---

#### 2.3 Block: AI Content Generation

**Overview:**  
This block uses OpenAI language models to convert the extracted headline into engaging social media posts tailored for LinkedIn and X (Twitter).

**Nodes Involved:**  
- OpenAI Chat Model  
- LinkedIn post writer  
- X (Twitter) post writer

**Node Details:**

- **OpenAI Chat Model**  
  - *Type & Role:* Language Model node (Langchain OpenAI) — provides the base GPT-4o-mini model for text generation.  
  - *Configuration:*  
    - Model: `gpt-4o-mini`  
    - No additional options set  
    - Credentials: OpenAI API key configured under `OpenAi account`  
  - *Inputs:* None directly; used as a dependency by agent nodes.  
  - *Outputs:* Provides AI completion results to agents.  
  - *Edge Cases:*  
    - API rate limits or quota exceeded.  
    - Network errors or OpenAI service downtime.  
    - Incorrect model name or credential issues.  

- **LinkedIn post writer**  
  - *Type & Role:* Langchain Agent — uses the OpenAI Chat Model to create LinkedIn-specific posts from the headline.  
  - *Configuration:*  
    - Input text: `{{$json.Title}}` (headline from extractor)  
    - System message: "Extract the headline and write a post for LinkedIn based on the headline"  
    - Prompt type: Define (custom prompt)  
  - *Inputs:* From `Extract Title` node  
  - *Outputs:* Generated LinkedIn post text to `Publish to LinkedIn`  
  - *Edge Cases:*  
    - If input title is empty or null, output will be invalid.  
    - AI outputs may include inappropriate or irrelevant content if prompt misaligned.  
    - Rate limit or API errors inherited from OpenAI Chat Model.  

- **X (Twitter) post writer**  
  - *Type & Role:* Langchain Agent — generates Twitter/X-specific posts from the headline.  
  - *Configuration:*  
    - Input text: `={{ $('Extract Title').item.json.Title }}` (expression referencing extracted title)  
    - System message: "Extract the headline and write a post for Twitter based on the headline"  
    - Prompt type: Define  
  - *Inputs:* Receives AI model output from OpenAI Chat Model node  
  - *Outputs:* Generated Twitter post text to `Publish to X (Twitter)`  
  - *Edge Cases:* Similar to LinkedIn post writer with additional dependency on correct expression referencing.

---

#### 2.4 Block: Auto-Publish to Social Media

**Overview:**  
This block takes the AI-generated posts and publishes them automatically to LinkedIn and X (Twitter) accounts.

**Nodes Involved:**  
- Publish to LinkedIn  
- Publish to X (Twitter)

**Node Details:**

- **Publish to LinkedIn**  
  - *Type & Role:* LinkedIn node — posts content to LinkedIn profile or page.  
  - *Configuration:*  
    - Text: `={{ $json.output }}` (AI-generated LinkedIn post)  
    - Additional fields: none specified  
    - Credentials: Must be configured with valid LinkedIn OAuth2 access token with posting permissions.  
  - *Inputs:* From `LinkedIn post writer`  
  - *Outputs:* To `X (Twitter) post writer`, continuing the workflow  
  - *Edge Cases:*  
    - Authentication failure if OAuth token expired or invalid.  
    - Permission errors if the token lacks posting rights.  
    - API rate limits or LinkedIn API downtime.  
    - Content rejection due to platform policies.  

- **Publish to X (Twitter)**  
  - *Type & Role:* Twitter node — tweets generated content on the connected Twitter developer account.  
  - *Configuration:*  
    - Text: `={{ $json.output }}` (AI-generated Twitter post)  
    - Additional fields: none specified  
    - Credentials: Twitter OAuth2 credentials required with tweet publishing access.  
  - *Inputs:* From `X (Twitter) post writer`  
  - *Outputs:* None (end of workflow)  
  - *Edge Cases:*  
    - Authentication or permission errors similar to LinkedIn node.  
    - Rate limits, content policies, or tweet length exceeding limits.  
    - Twitter API changes or outages.

---

### 3. Summary Table

| Node Name               | Node Type                           | Functional Role                        | Input Node(s)           | Output Node(s)              | Sticky Note                                                                                                                              |
|-------------------------|-----------------------------------|--------------------------------------|-------------------------|-----------------------------|------------------------------------------------------------------------------------------------------------------------------------------|
| Run workflow            | Manual Trigger                    | Workflow entry trigger                | —                       | Set Target News URL          | See Workflow Assistance contact info and tips: Yaron@nofluff.online, YouTube, LinkedIn links                                              |
| Set Target News URL     | Set Node                         | Define target source URL and site    | Run workflow            | Scrape Vogue via Bright data | Section 1: Set the Target Source — explains this block as the GPS for scraping source                                                      |
| Scrape Vogue via Bright data | HTTP Request                     | Scrape Vogue HTML via Bright Data API| Set Target News URL      | Extract Title                | Section 2: Scrape & Extract Headlines — Bright Data bypasses bot protection, extracts raw HTML                                            |
| Extract Title            | HTML Extract                     | Extract headline text from HTML      | Scrape Vogue via Bright data | LinkedIn post writer         | Section 2: Scrape & Extract Headlines — CSS selector targets Vogue headlines                                                             |
| OpenAI Chat Model        | Langchain OpenAI Language Model  | AI text generation model              | — (used by agents)       | LinkedIn post writer, X (Twitter) post writer | Section 3: Use AI to Write Engaging Posts — GPT-4o-mini model                                                                           |
| LinkedIn post writer     | Langchain Agent                  | Generate LinkedIn post from headline | Extract Title            | Publish to LinkedIn          | Section 3: Use AI to Write Engaging Posts — tailored LinkedIn post generation                                                            |
| Publish to LinkedIn      | LinkedIn Node                   | Post generated content to LinkedIn  | LinkedIn post writer     | X (Twitter) post writer      | Section 4: Auto-Publish to Social Media — posts to LinkedIn, requires auth                                                               |
| X (Twitter) post writer  | Langchain Agent                  | Generate Twitter post from headline  | OpenAI Chat Model        | Publish to X (Twitter)       | Section 3: Use AI to Write Engaging Posts — tailored Twitter post generation                                                             |
| Publish to X (Twitter)   | Twitter Node                    | Tweet generated content              | X (Twitter) post writer  | —                           | Section 4: Auto-Publish to Social Media — posts to Twitter, requires auth                                                                 |
| Sticky Note9             | Sticky Note                      | Workflow Assistance and contact info | —                       | —                           | Contains workflow assistance contact and resource links                                                                                   |
| Sticky Note4             | Sticky Note                      | Full workflow description and purpose| —                       | —                           | Contains detailed purpose, sections, and tips                                                                                            |
| Sticky Note              | Sticky Note                      | Section 1 explanation                 | —                       | —                           | Section 1: Set the Target Source details                                                                                                |
| Sticky Note1             | Sticky Note                      | Section 2 explanation                 | —                       | —                           | Section 2: Scrape & Extract Headlines details                                                                                            |
| Sticky Note2             | Sticky Note                      | Section 3 explanation                 | —                       | —                           | Section 3: Use AI to Write Engaging Posts details                                                                                        |
| Sticky Note3             | Sticky Note                      | Section 4 explanation                 | —                       | —                           | Section 4: Auto-Publish to Social Media details                                                                                         |
| Sticky Note5             | Sticky Note                      | Affiliate link for Bright Data        | —                       | —                           | Affiliate referral link for Bright Data                                                                                                 |

---

### 4. Reproducing the Workflow from Scratch

Follow these steps to recreate the workflow in n8n:

1. **Create a Manual Trigger Node**  
   - Node Type: Manual Trigger  
   - Purpose: Entry point to initiate the workflow manually or via scheduler.  
   - No parameters needed.

2. **Add a Set Node**  
   - Node Type: Set  
   - Purpose: Define the target source URL and site name.  
   - Parameters:  
     - Add two string fields:  
       - `SIte` = "Vogue"  
       - `URL` = "https://www.vogue.com/fashion"  
   - Connect Manual Trigger output to this Set node input.

3. **Add an HTTP Request Node for Bright Data Scraping**  
   - Node Type: HTTP Request  
   - Purpose: Use Bright Data API to fetch Vogue page HTML.  
   - Parameters:  
     - URL: `https://api.brightdata.com/request`  
     - Method: POST  
     - Send Body: Yes  
     - Body Parameters (JSON):  
       - `zone`: "n8n_unblocker"  
       - `url`: Expression referencing `{{$json.URL}}` from Set node  
       - `country`: "us"  
       - `format`: "raw"  
     - Headers:  
       - `Authorization`: `Bearer API_KEY` (replace `API_KEY` with your Bright Data token)  
   - Connect Set node output to HTTP Request node input.

4. **Add an HTML Extract Node**  
   - Node Type: HTML Extract  
   - Purpose: Extract headline text from the raw HTML response.  
   - Parameters:  
     - Operation: Extract HTML content  
     - Extraction Values:  
       - Key: `Title`  
       - CSS Selector: Use the specific Vogue headline selector:  
         `#5f10df145161a26b33fec09b > div > div > div > div.SummaryItemWrapper-iwvBff.juTBkb.summary-item.summary-item--no-icon.summary-item--text-align-center.summary-item--layout-placement-text-below.summary-item--layout-position-image-left.summary-item--layout-proportions-50-50.summary-item--side-by-side-align-center.summary-item--side-by-side-image-right-mobile-false.summary-item--standard.SummaryCollageFiveItem-kWJUcr.fqnbhT.search_result_item-68507588d2b17faf259ac70e.undefined_summary_item-68507588d2b17faf259ac70e > div.SummaryItemContent-eiDYMl.fSburJ.summary-item__content > a > h3`  
   - Connect HTTP Request node output to this HTML Extract node input.

5. **Add an OpenAI Chat Model Node (Langchain)**  
   - Node Type: Langchain OpenAI (lmChatOpenAi)  
   - Purpose: Provide AI language model for text generation.  
   - Parameters:  
     - Model: `gpt-4o-mini`  
   - Configure OpenAI API credentials (create and link OpenAI API key).  
   - No direct input connection; this node is referenced as AI model in Agent nodes.

6. **Add LinkedIn Post Writer Node (Langchain Agent)**  
   - Node Type: Langchain Agent  
   - Purpose: Generate LinkedIn post from headline using AI.  
   - Parameters:  
     - Text: `={{ $json.Title }}` (extract headline from previous node)  
     - System Message: "Extract the headline and write a post for LinkedIn based on the headline"  
     - Prompt Type: Define  
   - Set AI Language Model reference to the OpenAI Chat Model node.  
   - Connect HTML Extract node output to this node input.

7. **Add Publish to LinkedIn Node**  
   - Node Type: LinkedIn  
   - Purpose: Post created LinkedIn content.  
   - Parameters:  
     - Text: `={{ $json.output }}` (AI-generated LinkedIn post)  
   - Configure LinkedIn OAuth2 credentials with posting permissions.  
   - Connect LinkedIn Post Writer output to this node.

8. **Add X (Twitter) Post Writer Node (Langchain Agent)**  
   - Node Type: Langchain Agent  
   - Purpose: Generate Twitter/X post from headline using AI.  
   - Parameters:  
     - Text: `={{ $('Extract Title').item.json.Title }}` (expression referencing extracted headline)  
     - System Message: "Extract the headline and write a post for Twitter based on the headline"  
     - Prompt Type: Define  
   - Set AI Language Model reference to the OpenAI Chat Model node.  
   - Connect OpenAI Chat Model node output to this node (via AI Language Model input).

9. **Add Publish to X (Twitter) Node**  
   - Node Type: Twitter  
   - Purpose: Tweet the generated content on X.  
   - Parameters:  
     - Text: `={{ $json.output }}` (AI-generated Twitter post)  
   - Configure Twitter OAuth2 credentials with tweet posting permissions.  
   - Connect X (Twitter) Post Writer node output here.

10. **Establish Node Connections**  
    - Manual Trigger → Set Target News URL  
    - Set Target News URL → Scrape Vogue via Bright Data (HTTP Request)  
    - Scrape Vogue via Bright Data → Extract Title (HTML Extract)  
    - Extract Title → LinkedIn Post Writer  
    - LinkedIn Post Writer → Publish to LinkedIn  
    - Publish to LinkedIn → X (Twitter) Post Writer  
    - OpenAI Chat Model (as AI Language Model) → LinkedIn Post Writer and X (Twitter) Post Writer  
    - X (Twitter) Post Writer → Publish to X (Twitter)

11. **Additional Setup & Recommendations**  
    - Replace all placeholder API keys with valid credentials.  
    - Consider adding a scheduler node for automatic periodic runs.  
    - Monitor API usage limits for OpenAI, Bright Data, LinkedIn, and Twitter.  
    - Test CSS selector periodically for Vogue site changes.  
    - Optionally add error handling nodes for retry or logging failures.  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                           | Context or Link                                                                                         |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| Workflow Assistance: For questions, contact Yaron at Yaron@nofluff.online                                                                                             | Contact info sticky note                                                                                |
| Explore more tips and tutorials by Yaron Been on YouTube and LinkedIn                                                                                                | YouTube: https://www.youtube.com/@YaronBeen/videos, LinkedIn: https://www.linkedin.com/in/yaronbeen/   |
| Bright Data affiliate link: https://get.brightdata.com/1tndi4600b25 (generates a small commission to support free content)                                          | Sticky note with affiliate referral link                                                               |
| Suggestion: Add scheduler node for daily automated runs                                                                                                              | Bonus suggestion in workflow notes                                                                     |
| Suggestion: Add logging (Google Sheets or Notion) to track posted headlines                                                                                          | Bonus suggestion in workflow notes                                                                     |
| Suggestion: Add filter to skip duplicate headlines to avoid reposting same content                                                                                   | Bonus suggestion in workflow notes                                                                     |

---

**Disclaimer:**  
The text provided originates exclusively from an n8n automated workflow. The processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and publicly accessible.