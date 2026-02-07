Analyze Landing Page with OpenAI and Get Optimization Tips

https://n8nworkflows.xyz/workflows/analyze-landing-page-with-openai-and-get-optimization-tips-3100


# Analyze Landing Page with OpenAI and Get Optimization Tips

### 1. Workflow Overview

This workflow, titled **"Analyze Landing Page with OpenAI and Get Optimization Tips"**, is designed to help SaaS founders, marketers, and e-commerce businesses instantly analyze their landing pages for conversion rate optimization (CRO). By inputting a landing page URL, the workflow scrapes the page’s HTML content, sends it to an AI agent powered by OpenAI, and receives a detailed "roast" and 10 personalized CRO recommendations. The goal is to identify what’s broken or missing on the landing page and provide actionable, creative, and up-to-date advice to increase conversions.

The workflow is logically divided into three main blocks:

- **1.1 Input Reception:** Captures the landing page URL from a user-submitted form.
- **1.2 Web Scraping:** Fetches the raw HTML content of the landing page.
- **1.3 AI Processing:** Sends the scraped HTML to an AI agent that performs a detailed analysis and generates optimization tips.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block collects the landing page URL from the user via a web form trigger, initiating the workflow.

- **Nodes Involved:**  
  - Landing Page Url

- **Node Details:**  

  - **Landing Page Url**  
    - **Type:** Form Trigger  
    - **Role:** Entry point; receives user input via a web form.  
    - **Configuration:**  
      - Form titled "Conversion Rate Optimizer"  
      - Single required field labeled "Landing Page Url" with placeholder "https://yuzuu.co"  
      - Form description: "Your Landing Page is Leaking Sales—Fix It Now"  
    - **Expressions/Variables:** Captures the URL input as `$json['Landing Page Url']`  
    - **Input:** External HTTP request (form submission)  
    - **Output:** Passes URL to next node "Scrape Website"  
    - **Version:** 2.2  
    - **Edge Cases / Failures:**  
      - Missing or invalid URL input (form validation prevents empty input)  
      - Malformed URLs could cause downstream HTTP request failures  
    - **Sub-workflow:** None

#### 1.2 Web Scraping

- **Overview:**  
  This block fetches the HTML source code of the landing page URL provided by the user.

- **Nodes Involved:**  
  - Scrape Website

- **Node Details:**  

  - **Scrape Website**  
    - **Type:** HTTP Request  
    - **Role:** Retrieves the raw HTML content of the landing page URL.  
    - **Configuration:**  
      - URL set dynamically via expression: `={{ $json['Landing Page Url'] }}`  
      - Default HTTP GET method with no additional headers or authentication  
    - **Expressions/Variables:** Uses the URL from the previous node’s JSON data  
    - **Input:** Receives URL from "Landing Page Url" node  
    - **Output:** Passes the HTTP response body (HTML content) as `data` field to "AI Agent"  
    - **Version:** 4.2  
    - **Edge Cases / Failures:**  
      - HTTP errors (404, 500, timeouts) if the URL is unreachable or invalid  
      - Pages requiring authentication or JavaScript rendering will not be fully captured  
      - Large pages could cause timeout or memory issues  
    - **Sub-workflow:** None

#### 1.3 AI Processing

- **Overview:**  
  This block sends the scraped HTML content to an AI agent that performs a detailed landing page analysis and generates a conversion optimization report.

- **Nodes Involved:**  
  - AI Agent  
  - OpenAI Chat Model

- **Node Details:**  

  - **AI Agent**  
    - **Type:** Langchain Agent Node  
    - **Role:** Acts as the orchestrator for AI analysis, sending prompts and receiving responses.  
    - **Configuration:**  
      - Prompt instructs the AI to act as a professional CRO expert who roasts the landing page and provides 10 personalized, unconventional, and actionable CRO tips.  
      - The prompt includes detailed instructions on tone (friendly, casual, fun), structure (Roast + Recommendations), and criteria (specific, personalized, impactful, 2024-relevant).  
      - The landing page HTML content is passed as `{{ $json.data }}` to the prompt.  
      - Uses "define" prompt type to customize AI behavior.  
    - **Expressions/Variables:** Uses `{{ $json.data }}` to inject scraped HTML content.  
    - **Input:** Receives HTML content from "Scrape Website" node.  
    - **Output:** Sends prompt to "OpenAI Chat Model" node for processing.  
    - **Version:** 1.7  
    - **Edge Cases / Failures:**  
      - If HTML content is empty or malformed, AI output may be irrelevant or fail.  
      - Prompt complexity may cause longer processing times or token limits.  
      - Requires valid OpenAI credentials and API availability.  
    - **Sub-workflow:** None

  - **OpenAI Chat Model**  
    - **Type:** Langchain OpenAI Chat Model Node  
    - **Role:** Executes the actual OpenAI API call using the "o1" model to generate the AI response.  
    - **Configuration:**  
      - Model set to "o1" (OpenAI’s advanced chat model)  
      - Reasoning effort set to "high" for better quality output  
      - Credentials: OpenAI API key configured via "OpenAi account" credential  
    - **Input:** Receives prompt from "AI Agent" node.  
    - **Output:** Returns AI-generated roast and recommendations to "AI Agent" node.  
    - **Version:** 1.2  
    - **Edge Cases / Failures:**  
      - API key invalid or quota exceeded leads to authentication errors  
      - Network or API timeouts  
      - Model-specific token limits may truncate output  
    - **Sub-workflow:** None

---

### 3. Summary Table

| Node Name         | Node Type                      | Functional Role                     | Input Node(s)       | Output Node(s)    | Sticky Note                                                                                  |
|-------------------|--------------------------------|-----------------------------------|---------------------|-------------------|----------------------------------------------------------------------------------------------|
| Landing Page Url   | Form Trigger                   | Receives landing page URL input   | -                   | Scrape Website    |                                                                                              |
| Scrape Website    | HTTP Request                   | Fetches landing page HTML content | Landing Page Url    | AI Agent          |                                                                                              |
| AI Agent          | Langchain Agent Node           | Prepares AI prompt and processes  | Scrape Website      | OpenAI Chat Model |                                                                                              |
| OpenAI Chat Model | Langchain OpenAI Chat Model    | Calls OpenAI API for AI response  | AI Agent            | AI Agent          | Requires OpenAI credentials with API key; uses "o1" model for best results; costs $0.20-$0.30 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Form Trigger Node**  
   - Name: "Landing Page Url"  
   - Type: Form Trigger (version 2.2)  
   - Configure form title as "Conversion Rate Optimizer"  
   - Add one required form field:  
     - Label: "Landing Page Url"  
     - Placeholder: "https://yuzuu.co"  
   - Add form description: "Your Landing Page is Leaking Sales—Fix It Now"  
   - This node will serve as the workflow entry point.

2. **Create an HTTP Request Node**  
   - Name: "Scrape Website"  
   - Type: HTTP Request (version 4.2)  
   - Set the URL parameter to an expression referencing the form input: `={{ $json['Landing Page Url'] }}`  
   - Use default GET method, no authentication or headers needed.  
   - Connect the output of "Landing Page Url" node to this node’s input.

3. **Create a Langchain Agent Node**  
   - Name: "AI Agent"  
   - Type: Langchain Agent Node (version 1.7)  
   - Configure the prompt with the detailed instructions for roasting and recommending CRO tips. Use the expression `{{ $json.data }}` to pass the scraped HTML content.  
   - Set prompt type to "define" to customize AI behavior.  
   - Connect the output of "Scrape Website" node to this node’s input.

4. **Create a Langchain OpenAI Chat Model Node**  
   - Name: "OpenAI Chat Model"  
   - Type: Langchain OpenAI Chat Model Node (version 1.2)  
   - Set model to "o1" (OpenAI’s advanced chat model)  
   - Set reasoning effort to "high" for better quality responses  
   - Configure credentials: select or create OpenAI API credentials with a valid API key.  
   - Connect this node as the AI language model for the "AI Agent" node (ai_languageModel input).  
   - Connect the output of "AI Agent" node to this node’s input.

5. **Connect Nodes in Sequence:**  
   - "Landing Page Url" → "Scrape Website" → "AI Agent" → "OpenAI Chat Model" (as language model) → back to "AI Agent" for final output.

6. **Set Workflow Settings:**  
   - Execution order: "v1" (default)  
   - Activate the workflow to enable the form trigger.

7. **Test the Workflow:**  
   - Submit a landing page URL via the form.  
   - Verify that the HTML is scraped correctly.  
   - Confirm that the AI agent returns a roast and 10 personalized CRO recommendations.

---

### 5. General Notes & Resources

| Note Content                                                                                                         | Context or Link                                                                                     |
|----------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| The workflow costs approximately $0.20 to $0.30 per run using the OpenAI "o1" model.                                | Cost estimate based on OpenAI API usage.                                                          |
| You can customize the AI prompt inside the "AI Agent" node to tailor the analysis and recommendations.              | Adjust prompt text in the node parameters.                                                        |
| After execution, use the workflow logs to view a readable version of the AI-generated report.                        | Logs accessible in n8n UI under workflow executions.                                              |
| Target users include SaaS founders, marketers, growth experts, and e-commerce businesses aiming to improve conversions. | Use case description from workflow documentation.                                                 |
| Example screenshots of the workflow UI and output are available in the original project files (not included here).  | Refer to project assets for visual references.                                                    |

---

This documentation provides a complete, structured reference for understanding, reproducing, and maintaining the "Analyze Landing Page with OpenAI and Get Optimization Tips" workflow.