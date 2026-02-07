Analyze Any Website with OpenAI And Get On-Page SEO Audit

https://n8nworkflows.xyz/workflows/analyze-any-website-with-openai-and-get-on-page-seo-audit-3224


# Analyze Any Website with OpenAI And Get On-Page SEO Audit

### 1. Workflow Overview

This workflow, titled **"Analyze Any Website with OpenAI And Get On-Page SEO Audit"**, is designed to provide an instant, comprehensive SEO audit of any landing page URL submitted by the user. It targets SaaS founders, marketing teams, agencies, e-commerce, and content sites aiming to improve their Google rankings by identifying technical and content-related SEO issues.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Captures the landing page URL from a user-submitted form.
- **1.2 Website Scraping:** Fetches the HTML source code of the provided URL.
- **1.3 AI-Powered SEO Audits:** Two parallel AI agents analyze the scraped HTML:
  - Technical SEO Audit (HTML and on-page technical factors)
  - Content SEO Audit (content quality, keywords, readability)
- **1.4 Results Aggregation and Formatting:** Merges and aggregates AI outputs, then converts them into a clean HTML report.
- **1.5 Email Notification:** Sends the audit report via Gmail to a predefined email address.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block collects the landing page URL from the user via a web form trigger, initiating the workflow.

- **Nodes Involved:**  
  - Landing Page Url

- **Node Details:**  
  - **Landing Page Url**  
    - Type: Form Trigger  
    - Role: Entry point; captures user input via a web form.  
    - Configuration:  
      - Form titled "Conversion Rate Optimizer" with a single required field labeled "Landing Page Url" (placeholder example: https://yuzuu.co).  
      - Form description: "Your Landing Page is Leaking Sales—Fix It Now".  
    - Input/Output: Outputs JSON containing the landing page URL under the key `Landing Page Url`.  
    - Edge Cases:  
      - User submits invalid or malformed URL → downstream HTTP request may fail.  
      - No input submitted → form enforces required field, so unlikely.  
    - Version: 2.2

#### 2.2 Website Scraping

- **Overview:**  
  Fetches the raw HTML content of the landing page URL submitted by the user.

- **Nodes Involved:**  
  - Scrape Website

- **Node Details:**  
  - **Scrape Website**  
    - Type: HTTP Request  
    - Role: Retrieves the HTML source code of the landing page.  
    - Configuration:  
      - URL dynamically set to the user input: `={{ $json['Landing Page Url'] }}`.  
      - Default HTTP GET method, no additional headers or options configured.  
    - Input: Receives URL from "Landing Page Url" node.  
    - Output: Returns the full HTTP response including the HTML content under `data`.  
    - Edge Cases:  
      - URL unreachable or returns error (404, 500, timeout).  
      - Website blocks scraping or requires authentication.  
      - Large page size causing timeouts or memory issues.  
    - Version: 4.2

#### 2.3 AI-Powered SEO Audits

- **Overview:**  
  Two parallel AI agents analyze the scraped HTML content: one performs a technical SEO audit, the other a content SEO audit. Both use OpenAI GPT-4o-mini model via Langchain integration.

- **Nodes Involved:**  
  - OpenAI Chat Model  
  - OpenAI Chat Model1  
  - Technical Audit  
  - Content Audit

- **Node Details:**  

  - **OpenAI Chat Model**  
    - Type: Langchain OpenAI Chat Model  
    - Role: Provides language model interface for the Technical Audit agent.  
    - Configuration:  
      - Model: GPT-4o-mini (optimized for cost and performance).  
      - Credentials: OpenAI API key configured.  
    - Input: Receives prompts from "Technical Audit" node.  
    - Output: Returns AI-generated audit results.  
    - Edge Cases:  
      - API key invalid or quota exceeded → authentication errors.  
      - Model timeout or rate limiting.  
    - Version: 1.2

  - **OpenAI Chat Model1**  
    - Type: Langchain OpenAI Chat Model  
    - Role: Provides language model interface for the Content Audit agent.  
    - Configuration: Same as "OpenAI Chat Model".  
    - Input: Receives prompts from "Content Audit" node.  
    - Output: Returns AI-generated audit results.  
    - Edge Cases: Same as above.  
    - Version: 1.2

  - **Technical Audit**  
    - Type: Langchain Agent  
    - Role: Performs detailed technical SEO audit on the HTML content.  
    - Configuration:  
      - Prompt instructs the AI to analyze the HTML code for technical SEO issues, categorizing findings into Critical Issues, Quick Wins, and Opportunities for Improvement.  
      - Input text includes the scraped HTML content (`{{ $json.data }}`).  
      - Output is a clean, bullet-pointed audit report without introductory text.  
    - Input: Receives HTML content from "Scrape Website" node.  
    - Output: Audit text sent to "Merge" node.  
    - Edge Cases:  
      - AI may misinterpret malformed HTML.  
      - Large HTML content might exceed token limits.  
    - Version: 1.7

  - **Content Audit**  
    - Type: Langchain Agent  
    - Role: Performs detailed content SEO audit on the HTML content.  
    - Configuration:  
      - Prompt instructs AI to analyze content quality, keyword usage, and readability metrics.  
      - Input text includes the scraped HTML content (`{{ $json.data }}`).  
      - Output is a structured audit with analysis and recommendations in bullet points.  
    - Input: Receives HTML content from "Scrape Website" node.  
    - Output: Audit text sent to "Merge" node.  
    - Edge Cases:  
      - AI may misinterpret content if HTML is complex or heavily scripted.  
      - Token limits may truncate output.  
    - Version: 1.7

#### 2.4 Results Aggregation and Formatting

- **Overview:**  
  Combines the two audit reports into a single structured output and formats it as HTML for readability.

- **Nodes Involved:**  
  - Merge  
  - Aggregate  
  - Markdown

- **Node Details:**  

  - **Merge**  
    - Type: Merge  
    - Role: Combines outputs from Technical Audit and Content Audit nodes into one data stream.  
    - Configuration: Default merge mode (likely wait for all inputs).  
    - Input: Receives two inputs — Technical Audit (index 0) and Content Audit (index 1).  
    - Output: Passes combined data to Aggregate node.  
    - Edge Cases:  
      - One audit fails or delays → merge may timeout or output incomplete data.  
    - Version: 3

  - **Aggregate**  
    - Type: Aggregate  
    - Role: Aggregates the merged outputs, specifically aggregating the "output" field from both audits.  
    - Configuration: Aggregates field named "output".  
    - Input: Receives merged data from Merge node.  
    - Output: Passes aggregated data to Markdown node.  
    - Edge Cases:  
      - Empty or missing fields could cause aggregation errors.  
    - Version: 1

  - **Markdown**  
    - Type: Markdown  
    - Role: Converts combined markdown audit reports into HTML format for email readability.  
    - Configuration:  
      - Mode set to "markdownToHtml".  
      - Template includes two sections:  
        - "# On-Page Technical Audit" with first audit output  
        - "# On-Page SEO Content Audit" with second audit output  
      - Uses expressions to insert aggregated audit texts.  
    - Input: Receives aggregated audit data from Aggregate node.  
    - Output: HTML formatted audit report sent to Gmail node.  
    - Edge Cases:  
      - Malformed markdown could produce invalid HTML.  
    - Version: 1

#### 2.5 Email Notification

- **Overview:**  
  Sends the final SEO audit report via Gmail to a specified recipient.

- **Nodes Involved:**  
  - Gmail  
  - Sticky Note (for user instruction)

- **Node Details:**  

  - **Gmail**  
    - Type: Gmail  
    - Role: Sends email with the SEO audit report.  
    - Configuration:  
      - Recipient email hardcoded as "hello@youremail.com" (user must update).  
      - Subject line dynamically includes the landing page URL.  
      - Message body contains the HTML audit report from Markdown node.  
      - Uses OAuth2 credentials for Gmail authentication.  
    - Input: Receives HTML content from Markdown node.  
    - Output: Sends email, no further output.  
    - Edge Cases:  
      - Invalid or expired Gmail OAuth2 credentials → authentication failure.  
      - Email quota limits or network issues.  
    - Version: 2.1

  - **Sticky Note**  
    - Type: Sticky Note  
    - Role: Provides user instruction to connect Gmail credentials for email sending.  
    - Content: "## Send Email \nConnect your credentials & Easily send emails from a Gmail address."  
    - Position: Near Gmail node for visual guidance.

---

### 3. Summary Table

| Node Name          | Node Type                              | Functional Role                   | Input Node(s)          | Output Node(s)         | Sticky Note                                                                                  |
|--------------------|--------------------------------------|---------------------------------|-----------------------|-----------------------|----------------------------------------------------------------------------------------------|
| Landing Page Url    | Form Trigger                         | User input of landing page URL  | —                     | Scrape Website        |                                                                                              |
| Scrape Website     | HTTP Request                        | Fetches HTML source of URL      | Landing Page Url       | Content Audit, Technical Audit |                                                                                              |
| OpenAI Chat Model   | Langchain OpenAI Chat Model          | AI model for Technical Audit    | Technical Audit (ai_languageModel) | Technical Audit       | ## Open AI Setup<br>- Add your credentials<br>- Select o1 model for (way) better results.<br>- One run = one page audit = around $0.3 with o1 |
| OpenAI Chat Model1  | Langchain OpenAI Chat Model          | AI model for Content Audit      | Content Audit (ai_languageModel) | Content Audit         | ## Open AI Setup<br>- Add your credentials<br>- Select o1 model for (way) better results.<br>- One run = one page audit = around $0.3 with o1 |
| Technical Audit     | Langchain Agent                     | Performs technical SEO audit    | Scrape Website, OpenAI Chat Model | Merge                 | ## Open AI Setup<br>- Add your credentials<br>- Select o1 model for (way) better results.<br>- One run = one page audit = around $0.3 with o1 |
| Content Audit       | Langchain Agent                     | Performs content SEO audit      | Scrape Website, OpenAI Chat Model1 | Merge                 | ## Open AI Setup<br>- Add your credentials<br>- Select o1 model for (way) better results.<br>- One run = one page audit = around $0.3 with o1 |
| Merge               | Merge                              | Combines audit outputs          | Technical Audit, Content Audit | Aggregate             |                                                                                              |
| Aggregate           | Aggregate                          | Aggregates audit outputs        | Merge                  | Markdown               |                                                                                              |
| Markdown            | Markdown                           | Converts markdown to HTML       | Aggregate               | Gmail                  |                                                                                              |
| Gmail               | Gmail                             | Sends audit report via email   | Markdown                | —                      | ## Send Email<br>Connect your credentials & Easily send emails from a Gmail address.          |
| Sticky Note         | Sticky Note                       | Instruction for Gmail setup    | —                      | —                      | ## Send Email<br>Connect your credentials & Easily send emails from a Gmail address.          |
| Sticky Note1        | Sticky Note                       | Instruction for OpenAI setup   | —                      | —                      | ## Open AI Setup<br>- Add your credentials<br>- Select o1 model for (way) better results.<br>- One run = one page audit = around $0.3 with o1 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Form Trigger Node**  
   - Name: "Landing Page Url"  
   - Type: Form Trigger  
   - Configure form title: "Conversion Rate Optimizer"  
   - Add one required form field:  
     - Label: "Landing Page Url"  
     - Placeholder: "https://yuzuu.co"  
   - Add form description: "Your Landing Page is Leaking Sales—Fix It Now"  
   - This node will start the workflow when a user submits a URL.

2. **Add an HTTP Request Node**  
   - Name: "Scrape Website"  
   - Type: HTTP Request  
   - Set URL parameter to expression: `={{ $json["Landing Page Url"] }}`  
   - Method: GET (default)  
   - No authentication or headers needed unless target site requires it.  
   - Connect output of "Landing Page Url" to input of "Scrape Website".

3. **Add Two Langchain OpenAI Chat Model Nodes**  
   - Names: "OpenAI Chat Model" and "OpenAI Chat Model1"  
   - Type: Langchain OpenAI Chat Model  
   - Model: Select "gpt-4o-mini" or equivalent OpenAI model optimized for cost/performance.  
   - Credentials: Configure OpenAI API key credentials for both nodes.  
   - These nodes serve as language model interfaces for the two AI agents.

4. **Add Two Langchain Agent Nodes**  
   - Names: "Technical Audit" and "Content Audit"  
   - Type: Langchain Agent  
   - For "Technical Audit":  
     - Set prompt text to instruct AI to analyze HTML for technical SEO issues, categorizing findings into Critical Issues, Quick Wins, and Opportunities for Improvement.  
     - Use expression to pass scraped HTML content: `{{ $json.data }}`  
     - Set prompt type to "define".  
     - Connect "OpenAI Chat Model" node to "Technical Audit" node's AI language model input.  
   - For "Content Audit":  
     - Set prompt text to instruct AI to analyze content quality, keyword usage, and readability metrics.  
     - Use expression to pass scraped HTML content: `{{ $json.data }}`  
     - Set prompt type to "define".  
     - Connect "OpenAI Chat Model1" node to "Content Audit" node's AI language model input.  
   - Connect output of "Scrape Website" node to both "Technical Audit" and "Content Audit" nodes.

5. **Add a Merge Node**  
   - Name: "Merge"  
   - Type: Merge  
   - Default merge mode (wait for all inputs)  
   - Connect outputs of "Technical Audit" (index 0) and "Content Audit" (index 1) to inputs of "Merge".

6. **Add an Aggregate Node**  
   - Name: "Aggregate"  
   - Type: Aggregate  
   - Configure to aggregate the field named "output" from incoming data.  
   - Connect output of "Merge" to input of "Aggregate".

7. **Add a Markdown Node**  
   - Name: "Markdown"  
   - Type: Markdown  
   - Mode: markdownToHtml  
   - Markdown template:  
     ```
     # On-Page Technical Audit
     {{ $json.output[0] }}

     # On-Page SEO Content Audit
     {{ $json.output[1] }}
     ```  
   - Connect output of "Aggregate" to input of "Markdown".

8. **Add a Gmail Node**  
   - Name: "Gmail"  
   - Type: Gmail  
   - Configure OAuth2 credentials for Gmail account.  
   - Set recipient email (e.g., "hello@youremail.com") — replace with your actual email.  
   - Subject: Use expression to include landing page URL, e.g., `=On-Page SEO Audit - {{ $('Landing Page Url').item.json['Landing Page Url'] }}`  
   - Message: Use expression to pass HTML content from "Markdown" node, e.g., `={{ $json.data }}`  
   - Connect output of "Markdown" to input of "Gmail".

9. **Add Sticky Notes for User Guidance** (optional but recommended)  
   - Near OpenAI nodes: Add note explaining to add OpenAI credentials and use the GPT-4o-mini or o1 model for best results and cost awareness.  
   - Near Gmail node: Add note reminding to connect Gmail credentials for sending emails.

10. **Set Execution Order**  
    - Ensure the workflow executes sequentially from form trigger → HTTP request → AI audits → merge → aggregate → markdown → email.

---

### 5. General Notes & Resources

| Note Content                                                                                         | Context or Link                                                                                   |
|----------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| The workflow uses OpenAI GPT-4o-mini (o1) model for balanced cost and performance in SEO audits.   | OpenAI API documentation and pricing details.                                                   |
| One run of the workflow (one page audit) costs approximately $0.20–$0.30 with the selected model.  | Budget planning for API usage.                                                                   |
| Update the Gmail node recipient email to your actual email address before running the workflow.    | Prevents sending audit reports to placeholder addresses.                                        |
| The workflow requires valid OpenAI API credentials and Gmail OAuth2 credentials configured in n8n. | Credential setup instructions in n8n documentation.                                             |
| Example audit output screenshot is included in the original workflow description (not embedded here). | Visual reference for expected audit report format.                                              |
| SEO audits cover both technical on-page factors and content quality/readability for comprehensive analysis. | Best practice for holistic SEO improvements.                                                    |

---

This documentation provides a detailed, structured reference for understanding, reproducing, and maintaining the "Analyze Any Website with OpenAI And Get On-Page SEO Audit" workflow. It anticipates common failure points such as invalid URLs, API errors, and credential misconfigurations, enabling robust operation and easy customization.