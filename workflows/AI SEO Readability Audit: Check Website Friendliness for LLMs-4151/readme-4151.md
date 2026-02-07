AI SEO Readability Audit: Check Website Friendliness for LLMs

https://n8nworkflows.xyz/workflows/ai-seo-readability-audit--check-website-friendliness-for-llms-4151


# AI SEO Readability Audit: Check Website Friendliness for LLMs

### 1. Workflow Overview

This workflow, titled **"AI SEO Readability Audit: Check Website Friendliness for LLMs"**, is designed to analyze a website’s HTML content to assess how accessible and readable it is for Large Language Models (LLMs) such as ChatGPT, Perplexity, and Google AI Overviews. It is particularly focused on simulating how AI tools perceive websites when JavaScript execution is disabled, which is a common limitation of many AI crawlers.

**Target Use Cases:**  
- Website owners and SEO specialists wanting to verify AI-readability of their web pages.  
- Developers or marketers aiming to improve AI accessibility and SEO performance for AI-driven search engines.  
- Automation enthusiasts who want to integrate AI SEO analysis into their workflow.

**Logical Blocks:**

- **1.1 Input Reception:** Receives user input via an AI chat interface.  
- **1.2 URL Sanitization:** Cleans and formats the input URL to a valid HTTP(S) format.  
- **1.3 HTML Retrieval:** Fetches the raw HTML content of the website using an HTTP request with Googlebot-like headers.  
- **1.4 HTML Feature Extraction:** Parses the fetched HTML to extract SEO-relevant features and detect JavaScript-blocking messages.  
- **1.5 AI SEO Analysis:** Uses an LLM (OpenAI GPT-4o) to analyze extracted features, generate an AI Readability score, summary, and recommendations.  
- **1.6 Output Presentation:** Returns the analysis results back through the chat interface.  
- **1.7 Documentation & Notes:** Includes sticky notes for user guidance, credits, and setup instructions.

---

### 2. Block-by-Block Analysis

#### Block 1.1: Input Reception

- **Overview:**  
  Captures user input (a website URL) through a chat interface tailored for AI SEO readability checks.

- **Nodes Involved:**  
  - `When chat message received`

- **Node Details:**  

  | Node Name              | Details                                                                                                  |
  |------------------------|----------------------------------------------------------------------------------------------------------|
  | When chat message received | *Type:* Chat Trigger (Langchain)  <br> *Role:* Entry point that listens for chat messages.  <br> *Config:* Public webhook with a conversational UI titled "🚀 AI SEO Readability Checker". Initial prompt welcomes user and requests website URL input.  <br> *Input:* User’s chat text.  <br> *Output:* Passes chat input to next node for URL sanitization.  <br> *Edge Cases:* Empty input, malformed URLs, non-HTTP input.  <br> *Notes:* Uses webhookId; no authentication required for public use. |

---

#### Block 1.2: URL Sanitization

- **Overview:**  
  Ensures the input text is converted into a valid, lowercase, fully qualified URL starting with `https://` if missing.

- **Nodes Involved:**  
  - `Sanitize Website URL`

- **Node Details:**  

  | Node Name          | Details                                                                                                    |
  |--------------------|------------------------------------------------------------------------------------------------------------|
  | Sanitize Website URL | *Type:* Code Node (JavaScript) <br> *Role:* Cleans and normalizes URL input from chat message. <br> *Config:* Checks if input starts with "http"; if not, prepends "https://". Converts to lowercase and trims spaces. <br> *Key Expression:* Uses `$json.chatInput` to access raw chat text. <br> *Input:* Chat message JSON from previous node. <br> *Output:* JSON object with sanitized "url" field. <br> *Edge Cases:* Input without protocol, extra spaces, uppercase letters. <br> *Failure:* If input is empty, output may be an invalid URL; no explicit validation beyond prefixing. |

---

#### Block 1.3: HTML Retrieval

- **Overview:**  
  Fetches the raw HTML content of the sanitized URL simulating Googlebot’s crawl, with a 10-second timeout and retry on failure.

- **Nodes Involved:**  
  - `Get HTML from Website`

- **Node Details:**  

  | Node Name           | Details                                                                                                     |
  |---------------------|-------------------------------------------------------------------------------------------------------------|
  | Get HTML from Website | *Type:* HTTP Request Node <br> *Role:* Retrieves the raw HTML of the website URL. <br> *Config:* Uses sanitized URL from previous node. Sets custom headers to mimic Googlebot user-agent and Dutch/English language preferences. Timeout set to 10,000 ms. Retries enabled on failure. <br> *Input:* Sanitized URL JSON. <br> *Output:* Raw HTML content in `data` property of response JSON. <br> *Edge Cases:* Network errors, non-200 HTTP status, slow response causing timeout, sites blocking Googlebot or automated requests, invalid URLs. <br> *Failure Handling:* Retries on failure help mitigate transient errors. |

---

#### Block 1.4: HTML Feature Extraction

- **Overview:**  
  Processes the fetched HTML to extract SEO-related features like text length, presence of meta tags, headings, structured data, and detect JavaScript-blocking notices.

- **Nodes Involved:**  
  - `Extract HTML Features`

- **Node Details:**  

  | Node Name            | Details                                                                                                    |
  |----------------------|------------------------------------------------------------------------------------------------------------|
  | Extract HTML Features | *Type:* Code Node (JavaScript) <br> *Role:* Parses HTML to extract key features for SEO and AI-readability. <br> *Config:* Removes scripts/styles, strips HTML tags to get visible text, checks for headings `<h1>`, `<h2>`, `<h3>`, meta description, Open Graph tags, JSON-LD structured data, `<noscript>` tags, and JavaScript-blocking warnings in multiple languages. <br> *Key Expressions:* Uses regex tests on raw HTML and text searches for JS-block indicators. <br> *Input:* Raw HTML from HTTP request node. <br> *Output:* JSON with extracted boolean flags and text preview, plus a computed URL for `robots.txt`. <br> *Edge Cases:* Sites heavily reliant on JavaScript may have very little visible text; sites with unusual markup might evade regex detection; false positives for JS-block warnings possible. <br> *Failure:* Empty or malformed HTML input results in minimal or zero-length text. |

---

#### Block 1.5: AI SEO Analysis

- **Overview:**  
  Sends extracted features to an LLM prompt that evaluates the site’s AI-readability and generates a score, summary, and recommendations.

- **Nodes Involved:**  
  - `AI SEO Analysis`  
  - `OpenAI Chat Model`

- **Node Details:**  

  | Node Name         | Details                                                                                                  |
  |-------------------|----------------------------------------------------------------------------------------------------------|
  | AI SEO Analysis   | *Type:* Langchain LLM Chain Node <br> *Role:* Defines a detailed prompt for the LLM to analyze SEO features and output result text. <br> *Config:* The prompt includes a technical scan summary (text length, preview, detected tags) and instructs the model to produce: a 0–10 AI Readability Score, summary, up to 5 recommendations, and a reminder to check `robots.txt` with a clickable link. <br> *Key Expressions:* Inserts all extracted JSON fields via templating `{{ $json.<field> }}`. <br> *Input:* JSON from HTML feature extraction. <br> *Output:* Text containing analysis results. <br> *Edge Cases:* Low text length (<300) or detected JS blocking triggers special warnings; prompt relies on up-to-date LLM capabilities. <br> *Failure:* API errors, rate limits, or malformed input can cause prompt or model failure. |
  | OpenAI Chat Model | *Type:* Langchain OpenAI Chat Node <br> *Role:* Executes the prompt on OpenAI’s GPT-4o model with temperature 0.3 for balanced output. <br> *Config:* Uses stored OpenAI API credentials. <br> *Input:* Prompt text from `AI SEO Analysis`. <br> *Output:* Model response forwarded back to the workflow. <br> *Edge Cases:* API key misconfiguration, quota exceeded, or network issues can cause failures. <br> *Version:* Requires OpenAI API credentials configured in n8n. |

---

#### Block 1.6: Output Presentation

- **Overview:**  
  The final LLM output is returned to the user through the chat interface, completing the interaction.

- **Nodes Involved:**  
  - Implicitly handled by "When chat message received" node with `responseMode: lastNode`.

- **Node Details:**  
  The `When chat message received` node is configured to send the last node’s output (i.e., the LLM’s analysis text) as the chat reply automatically.

---

#### Block 1.7: Documentation & Notes

- **Overview:**  
  Contains sticky notes that provide users with workflow purpose, setup instructions, and credits.

- **Nodes Involved:**  
  - `Sticky Note`  
  - `Sticky Note1`

- **Node Details:**  

  | Node Name    | Details                                                                                                |
  |--------------|--------------------------------------------------------------------------------------------------------|
  | Sticky Note  | *Type:* Sticky Note <br> *Role:* Displays an extensive explanation of the workflow’s purpose, usage instructions, and setup requirements including OpenAI API key. <br> *Content Highlights:* Workflow purpose, how it works, setup checklist, customization tips, and link to n8n template description. <br> *Position:* Top-left of canvas for prominence. |
  | Sticky Note1 | *Type:* Sticky Note <br> *Role:* Credits and community thanks by Leonard van Hemert. Includes LinkedIn link for user connection. <br> *Content Highlights:* Developer info, gratitude, encouragement to connect and improve workflow, community appreciation. <br> *Position:* Bottom-right area near AI nodes. |

---

### 3. Summary Table

| Node Name               | Node Type                          | Functional Role                      | Input Node(s)                | Output Node(s)              | Sticky Note                                                                                          |
|-------------------------|----------------------------------|------------------------------------|-----------------------------|-----------------------------|----------------------------------------------------------------------------------------------------|
| When chat message received | @n8n/n8n-nodes-langchain.chatTrigger | Entry point: Receives chat input   | None                        | Sanitize Website URL         | Covers initial input reception and chat instructions (via Sticky Note)                             |
| Sanitize Website URL      | n8n-nodes-base.code               | Normalize user input URL            | When chat message received  | Get HTML from Website        |                                                                                                    |
| Get HTML from Website     | n8n-nodes-base.httpRequest        | Fetch raw HTML simulating Googlebot| Sanitize Website URL        | Extract HTML Features        |                                                                                                    |
| Extract HTML Features     | n8n-nodes-base.code               | Parse HTML, extract SEO features   | Get HTML from Website       | AI SEO Analysis              |                                                                                                    |
| AI SEO Analysis           | @n8n/n8n-nodes-langchain.chainLlm | Prepare prompt with SEO data       | Extract HTML Features       | OpenAI Chat Model            |                                                                                                    |
| OpenAI Chat Model         | @n8n/n8n-nodes-langchain.lmChatOpenAi | Execute prompt on OpenAI GPT-4o    | AI SEO Analysis             | AI SEO Analysis             |                                                                                                    |
| Sticky Note              | n8n-nodes-base.stickyNote         | Workflow instructions & overview   | None                       | None                       | Explains workflow purpose and setup instructions                                                  |
| Sticky Note1             | n8n-nodes-base.stickyNote         | Developer credits and community    | None                       | None                       | Developer info and LinkedIn connection link                                                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Node:**  
   - Add a **Langchain Chat Trigger** node named `When chat message received`.  
   - Configure as a public webhook.  
   - Set title: "🚀 AI SEO Readability Checker" and subtitle with author credit and purpose.  
   - Set response mode to `lastNode`.  
   - Set input placeholder to "https://example.com".  
   - Set initial greeting message to prompt users to send a website link.

2. **Add URL Sanitization Node:**  
   - Add a **Code** node named `Sanitize Website URL`.  
   - Use JavaScript to trim, lowercase, and prepend "https://" if missing to the chat input:  
     ```js
     return [
       {
         json: {
           url: (() => {
             let input = $json.chatInput.trim().toLowerCase();
             if (!input.startsWith('http')) input = 'https://' + input;
             return input;
           })()
         }
       }
     ];
     ```  
   - Connect `When chat message received` node output to this node.

3. **Add HTTP Request Node:**  
   - Add an **HTTP Request** node named `Get HTML from Website`.  
   - Set method to GET; URL to `={{ $json.url }}` (output from previous node).  
   - Configure request options: timeout 10000 ms, retry enabled.  
   - Set headers to mimic Googlebot:  
     ```json
     {
       "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
       "Accept-Language": "nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7"
     }
     ```  
   - Enable sending these headers as JSON.  
   - Connect `Sanitize Website URL` output to this node.

4. **Add HTML Feature Extraction Node:**  
   - Add a **Code** node named `Extract HTML Features`.  
   - Paste the JavaScript code that:  
     - Removes scripts/styles.  
     - Strips HTML tags.  
     - Extracts visible text length and preview.  
     - Detects presence of `<h1>`, `<h2>`, `<h3>`, meta description, Open Graph tags, structured data JSON-LD, `<noscript>`.  
     - Detects JavaScript-blocking warnings in English, Dutch, and German.  
     - Constructs robots.txt URL from sanitized URL.  
   - Connect `Get HTML from Website` output to this node.

5. **Add AI SEO Analysis Node:**  
   - Add a **Langchain Chain LLM** node named `AI SEO Analysis`.  
   - Use a prompt template that includes:  
     - Technical scan summary with inserted variables (`visibleTextLength`, `previewText`, etc.).  
     - Instructions to score 0-10, summarize AI-readability, provide up to 5 recommendations, and remind user to check robots.txt with a clickable link.  
     - Special conditions for low text length or JS blocking warnings.  
   - Connect `Extract HTML Features` output to this node.

6. **Add OpenAI Chat Model Node:**  
   - Add **Langchain OpenAI Chat** node named `OpenAI Chat Model`.  
   - Set model to `gpt-4o`.  
   - Set temperature to 0.3 for balanced output.  
   - Configure OpenAI API credentials (requires prior setup in n8n credentials).  
   - Connect `AI SEO Analysis` node output to this node via `ai_languageModel` input.

7. **Connect Output Back to Chat Trigger:**  
   - The `When chat message received` node is configured to send the last node’s output, so no further node needed for output.

8. **Add Sticky Notes (Optional but Recommended):**  
   - Add sticky notes with detailed workflow purpose, setup instructions, and developer credits as per original content. Position them clearly on the canvas.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                     | Context or Link                                                                                   |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Workflow analyzes website HTML without JavaScript execution to simulate AI crawler behavior and provide an AI Readability Score and recommendations.                                                                                                                                 | Workflow purpose and technical approach                                                         |
| Requires an OpenAI account and API key configured in the “OpenAI Chat Model” node to function.                                                                                                                                                                                    | Setup requirement                                                                                |
| Chat interface endpoint is public for easy user access; security considerations might apply if deployed broadly.                                                                                                                                                                 | Deployment note                                                                                  |
| Designed and developed by Leonard van Hemert — connect on LinkedIn: [https://www.linkedin.com/in/leonard-van-hemert/](https://www.linkedin.com/in/leonard-van-hemert/)                                                                                                          | Developer credits and community engagement                                                     |
| Users must manually verify their `robots.txt` files to ensure AI crawlers like `GPTBot`, `ChatGPT-User`, and `Google-Extended` are not blocked.                                                                                                                                  | Important SEO compliance reminder                                                               |
| For more detailed setup and customization, refer to the n8n template description on [n8n.io](https://n8n.io/workflows) or the original workflow source.                                                                                                                           | Additional resource                                                                             |

---

**Disclaimer:** The provided text derives exclusively from an n8n automated workflow. It complies strictly with content policies and contains no illegal, offensive, or protected elements. All handled data are legal and public.