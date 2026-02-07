Audit & Generate JSON-LD Schema Markup for SEO with GPT-4.1-mini + Gmail

https://n8nworkflows.xyz/workflows/audit---generate-json-ld-schema-markup-for-seo-with-gpt-4-1-mini---gmail-3980


# Audit & Generate JSON-LD Schema Markup for SEO with GPT-4.1-mini + Gmail

### 1. Workflow Overview

This workflow automates the auditing and generation of JSON-LD schema markup for SEO purposes, leveraging GPT-4.1-mini via OpenRouter and sending the results by Gmail. It is designed for website owners or SEO specialists who want to improve structured data on their sites, identify missing schema elements, and receive actionable, step-by-step implementation instructions via email.

The workflow consists of the following logical blocks:

- **1.1 Input Reception:** Receives website URL and email address via a form submission.
- **1.2 Schema Extraction & AI Processing:** Extracts existing schema data, identifies gaps, and generates optimized JSON-LD markup using GPT-4.1-mini.
- **1.3 Output Parsing and Refinement:** Parses and auto-fixes the AI-generated output for consistent structured data.
- **1.4 Email Notification:** Sends the optimized schema markup and implementation guide to the provided email address.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
Captures user input (website URL and recipient email) via a web form, triggering the workflow.

**Nodes Involved:**  
- On form submission

**Node Details:**

- **On form submission**  
  - Type: Form Trigger  
  - Role: Entry point capturing `websiteUrl` and `emailAddress` fields submitted by the user.  
  - Configuration: Uses a webhook with ID `4dfb8bdd-3e37-44c2-96ed-b56fbfc5ab6e`. Form fields must be configured externally to include `websiteUrl` and `emailAddress`.  
  - Input: Incoming HTTP POST request with form data.  
  - Output: Triggers the "Schema Markup Agent" node.  
  - Edge cases: Missing or invalid URL or email format may cause failures downstream; no explicit validation here.  
  - Version: 2.2

---

#### 1.2 Schema Extraction & AI Processing

**Overview:**  
This block extracts existing JSON-LD from the target website, identifies schema gaps, and generates an optimized schema markup proposal using GPT-4.1-mini via OpenRouter.

**Nodes Involved:**  
- Schema Markup Agent  
- HTTP Request  
- OpenRouter  
- Code

**Node Details:**

- **Schema Markup Agent**  
  - Type: LangChain Agent  
  - Role: Central AI orchestration node that coordinates schema extraction, analysis, and generation using various tools and language models.  
  - Configuration: Connected to OpenRouter as the language model and to HTTP Request and Code nodes as tools. Uses AI output parsers for handling responses.  
  - Input: Triggered by form submission data (`websiteUrl`, `emailAddress`).  
  - Output: Passes processed data to the "Send to your email" node.  
  - Edge cases: API rate limits or timeouts on OpenRouter; malformed website URLs; HTTP request failures; AI model response parsing errors.  
  - Version: 1.9

- **HTTP Request**  
  - Type: HTTP Request Tool (LangChain Tool)  
  - Role: Fetches the website content to extract existing JSON-LD schema markup.  
  - Configuration: Dynamically called by the agent to scrape webpage data.  
  - Input: Receives URL from agent or form data.  
  - Output: Website HTML content for analysis.  
  - Edge cases: HTTP errors (404, 403), timeouts, sites blocking scraping, invalid URLs.  
  - Version: 4.2

- **OpenRouter**  
  - Type: LangChain Chat Model (OpenRouter)  
  - Role: Language model interface for GPT-4.1-mini.  
  - Configuration: API key credential linked; used as primary LLM for schema markup generation.  
  - Input: Prompt messages constructed by the agent.  
  - Output: AI-generated schema markup and suggestions.  
  - Edge cases: API rate limits, authentication errors, incomplete or ambiguous AI responses.  
  - Version: 1

- **Code**  
  - Type: LangChain Tool (Code Interpreter)  
  - Role: Executes any programmatic transformations or validations on schema data as requested by the agent.  
  - Configuration: Available for agent to invoke code-based data processing.  
  - Input: Structured data or instructions from the agent.  
  - Output: Processed or transformed schema data.  
  - Edge cases: Syntax errors, runtime exceptions in code execution.  
  - Version: 1.2

---

#### 1.3 Output Parsing and Refinement

**Overview:**  
Ensures the AI-generated output is correctly structured, auto-fixes format issues, and prepares the data for email presentation.

**Nodes Involved:**  
- OpenRouter1  
- Structured Output  
- Auto-fixing Output Parser

**Node Details:**

- **OpenRouter1**  
  - Type: LangChain Chat Model (OpenRouter)  
  - Role: Secondary LLM instance to assist in refining and validating the AI output.  
  - Configuration: Same API key as primary OpenRouter node; used for output validation and auto-fixing.  
  - Input: Receives raw AI-generated schema markup.  
  - Output: Improved, validated structured output.  
  - Edge cases: Same as primary OpenRouter node.  
  - Version: 1

- **Structured Output**  
  - Type: LangChain Output Parser (Structured)  
  - Role: Parses AI responses into a strictly defined structured format (e.g., JSON-LD).  
  - Configuration: Enforces schema conformity.  
  - Input: AI-generated text from OpenRouter1.  
  - Output: Parsed structured data for downstream use.  
  - Edge cases: Parsing failures due to unexpected output formats or syntax errors.  
  - Version: 1.2

- **Auto-fixing Output Parser**  
  - Type: LangChain Output Parser (Auto-fixing)  
  - Role: Automatically detects and corrects common output format errors before final parsing.  
  - Configuration: Enables iterative correction by invoking OpenRouter1 if needed.  
  - Input: Initial AI output.  
  - Output: Clean, fixed structured schema markup.  
  - Edge cases: Recursive failures if output cannot be fixed; API rate limits due to repeated calls.  
  - Version: 1

---

#### 1.4 Email Notification

**Overview:**  
Sends the final optimized schema markup and implementation guide to the user’s email via Gmail.

**Nodes Involved:**  
- Send to your email

**Node Details:**

- **Send to your email**  
  - Type: Gmail Node  
  - Role: Delivers an email containing the AI-generated schema audit and implementation instructions.  
  - Configuration: Uses Gmail OAuth2 credentials configured in n8n. Email content is dynamically generated using data from the AI output parsers.  
  - Input: Receives parsed schema markup and user email from "Schema Markup Agent".  
  - Output: Sends email; workflow ends here.  
  - Edge cases: Gmail send quota exceeded, OAuth token expiry, invalid recipient email address, email formatting errors.  
  - Version: 2.1

---

### 3. Summary Table

| Node Name               | Node Type                               | Functional Role                               | Input Node(s)          | Output Node(s)          | Sticky Note                                                                                  |
|-------------------------|---------------------------------------|----------------------------------------------|------------------------|-------------------------|----------------------------------------------------------------------------------------------|
| On form submission      | Form Trigger                          | Entry point to receive website URL & email  | -                      | Schema Markup Agent      | Configure fields `websiteUrl` & `emailAddress` in your Webhook/Form node                     |
| Schema Markup Agent     | LangChain Agent                      | AI orchestration for schema extraction & generation | On form submission     | Send to your email       | Link OpenRouter API key and connect HTTP Request & Code tools                               |
| HTTP Request            | HTTP Request Tool                    | Fetch website HTML to extract JSON-LD        | Schema Markup Agent (tool) | Schema Markup Agent (tool) | Ensure target site allows scraping                                                         |
| OpenRouter              | LangChain Chat Model (OpenRouter)   | GPT-4.1-mini model interface                   | Schema Markup Agent (lm) | Schema Markup Agent (lm) | Store OpenRouter API key and link to Schema Markup Agent                                   |
| Code                    | LangChain Tool (Code Interpreter)   | Execute code for data transformation          | Schema Markup Agent (tool) | Schema Markup Agent (tool) | Used for schema data transformations                                                      |
| Auto-fixing Output Parser | LangChain Output Parser (Auto-fixing) | Auto-correct AI output errors                  | Structured Output       | Schema Markup Agent (ai_outputParser) | Handles iterative fixing if output format issues detected                                  |
| Structured Output       | LangChain Output Parser (Structured) | Parse AI output into strict structured format | OpenRouter1             | Auto-fixing Output Parser | Enforces JSON-LD schema format                                                             |
| OpenRouter1             | LangChain Chat Model (OpenRouter)   | Secondary GPT-4.1-mini for output refinement | Auto-fixing Output Parser | Structured Output        | Same API key as primary OpenRouter node                                                    |
| Send to your email      | Gmail Node                         | Send email with schema audit & guide          | Schema Markup Agent     | -                       | Requires Gmail OAuth2 credentials; configure before use                                   |
| Sticky Note             | Sticky Note                         | Informational / documentation notes            | -                      | -                       | Multiple sticky notes present, some empty, some with setup instructions                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the entry point:**
   - Add a **Form Trigger** node named "On form submission".
   - Configure webhook URL and ensure your form has fields `websiteUrl` and `emailAddress`.
   - Save and activate the webhook.

2. **Add the AI orchestration node:**
   - Add a **LangChain Agent** node named "Schema Markup Agent".
   - Connect "On form submission" main output to "Schema Markup Agent" input.
   - Configure the agent to use:
     - **OpenRouter** node as its language model.
     - **HTTP Request** and **Code** nodes as LangChain tools it can call.
   - Set AI prompt to audit existing JSON-LD, identify gaps, and generate optimized schema markup.
   - Link OpenRouter API key credential here.

3. **Add HTTP Request tool:**
   - Add an **HTTP Request Tool** node named "HTTP Request".
   - Set it to fetch the URL provided by the form.
   - Connect it to the agent as a tool node.

4. **Add Code Interpreter tool:**
   - Add a **Code** node named "Code".
   - Configure it for any transformations needed on JSON-LD data.
   - Connect it to the agent as a tool node.

5. **Add primary OpenRouter LLM node:**
   - Add an **OpenRouter** node named "OpenRouter".
   - Link your OpenRouter API key credential.
   - Connect it to the agent as the language model node.

6. **Add output parsing and auto-fixing:**
   - Add an **OpenRouter** node named "OpenRouter1", same API key.
   - Add a **Structured Output Parser** node named "Structured Output".
   - Add an **Auto-fixing Output Parser** node named "Auto-fixing Output Parser".
   - Connect them as: OpenRouter1 → Structured Output → Auto-fixing Output Parser.
   - Connect "Auto-fixing Output Parser" output back to "Schema Markup Agent" as the AI output parser.

7. **Add email sending node:**
   - Add a **Gmail** node named "Send to your email".
   - Configure OAuth2 credentials for Gmail.
   - Set recipient email dynamically from the form submission data.
   - Compose the email content with the AI-generated schema audit and implementation guide.
   - Connect "Schema Markup Agent" main output to this node.

8. **Set node connections:**
   - "On form submission" → "Schema Markup Agent"
   - "Schema Markup Agent" ai_languageModel → "OpenRouter"
   - "Schema Markup Agent" ai_tool → "HTTP Request" and "Code"
   - "Schema Markup Agent" ai_outputParser → "Auto-fixing Output Parser"
   - "Auto-fixing Output Parser" ai_languageModel → "OpenRouter1"
   - "OpenRouter1" → "Structured Output"
   - "Structured Output" → "Auto-fixing Output Parser"
   - "Schema Markup Agent" main → "Send to your email"

9. **Test the workflow:**
   - Submit the form with a valid website URL and email.
   - Verify the generated JSON-LD audit and optimized schema markup is sent via email.
   - Monitor for errors or API rate limits.

---

### 5. General Notes & Resources

| Note Content                                                                                     | Context or Link                                             |
|-------------------------------------------------------------------------------------------------|-------------------------------------------------------------|
| Ensure your Gmail OAuth2 credentials are set up with Send Email scope to avoid authentication issues. | Gmail OAuth2 setup in n8n node configuration                 |
| OpenRouter GPT-4.1-mini API keys have usage limits; monitor quotas to avoid workflow interruptions. | OpenRouter API documentation                                 |
| Target websites must allow scraping for schema extraction; otherwise, HTTP Request will fail.    | Website robots.txt and scraping policies                     |
| Customize AI system prompt in the "Schema Markup Agent" node for specific schema types or output style. | Node parameters in LangChain Agent                           |
| Modify email template in "Send to your email" Gmail node to add branding or adjust instructions. | Gmail node HTML content field                                |

---

This documentation fully describes the workflow’s structure, logic, potential issues, and reproduction steps for both experienced users and automation tools.