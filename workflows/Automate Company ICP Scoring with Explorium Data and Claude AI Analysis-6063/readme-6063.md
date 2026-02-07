Automate Company ICP Scoring with Explorium Data and Claude AI Analysis

https://n8nworkflows.xyz/workflows/automate-company-icp-scoring-with-explorium-data-and-claude-ai-analysis-6063


# Automate Company ICP Scoring with Explorium Data and Claude AI Analysis

### 1. Workflow Overview

This workflow automates the scoring of a company's Ideal Customer Profile (ICP) by integrating Explorium data enrichment and Claude AI analysis. It is designed for GTM teams or analysts who want to automatically evaluate companies based on firmographic, technological, and engagement criteria, generating a structured, human-readable ICP report.

Logical blocks:

- **1.1 Input Reception:** Captures company name input via a form submission.
- **1.2 Data Enrichment:** Queries Explorium MCP (Managed Customer Platform) to retrieve firmographic and technology-related data for the company.
- **1.3 AI Analysis:** Uses Anthropic Claude AI to analyze the enriched data and score the company on a 3-pillar ICP framework.
- **1.4 Report Generation:** Converts the AI’s Markdown output into a structured Google Doc for sharing and archiving.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

**Overview:**  
This block handles the initial trigger of the workflow by receiving company details from a user-submitted form.

**Nodes Involved:**  
- On form submission  
- Sticky Note4 (input instructions)

**Node Details:**

- **On form submission**  
  - **Type:** Form Trigger  
  - **Role:** Entry point; triggers workflow upon form submission  
  - **Configuration:**  
    - Form Title: "Company ICP scoring"  
    - Form Field: "Company Name" (required) with placeholder "Apple"  
    - Description clarifies the input expectation and output  
  - **Input:** External form submission webhook  
  - **Output:** JSON containing the submitted company name  
  - **Edge cases:** Missing company name (form enforces required field), malformed input, webhook failure  
  - **Version:** 2.2

- **Sticky Note4**  
  - **Type:** Sticky Note  
  - **Role:** Instructional note explaining the input parameters and the form trigger usage  
  - **Content:** "Run this workflow using a form"  
  - **Positioned near input node for clarity**

---

#### 2.2 Data Enrichment

**Overview:**  
This block enriches the submitted company data by querying Explorium’s MCP server to retrieve detailed firmographic and technology stack information required for scoring.

**Nodes Involved:**  
- MCP Client  
- Sticky Note7 (workflow summary and scoring system)

**Node Details:**

- **MCP Client**  
  - **Type:** Langchain MCP Client Tool  
  - **Role:** Sends request to Explorium MCP SSE endpoint to get enriched company data  
  - **Configuration:**  
    - SSE Endpoint: `mcp.explorium.ai/sse`  
    - Authentication method: Header authentication using stored credentials  
  - **Credentials:** Uses HTTP Header Auth credential named "Explorium" containing API key or token  
  - **Input:** Company name from form submission passed via upstream connection  
  - **Output:** Enriched JSON data about the company’s firmographics and tech readiness  
  - **Edge cases:** Authentication failure, network timeout, invalid or missing company data, SSE stream interruptions  
  - **Version:** 1

- **Sticky Note7**  
  - **Type:** Sticky Note  
  - **Role:** Detailed documentation of the ICP scoring system, pillars, criteria, and verdicts  
  - **Content:**  
    - Explains scoring pillars: Strategic Fit (40 pts), AI/Tech Readiness (40 pts), Engagement & Reachability (20 pts)  
    - Criteria examples and final verdict thresholds  
    - Use case description for GTM prioritization  
  - Serves as a conceptual guide for users and maintainers

---

#### 2.3 AI Analysis

**Overview:**  
This block executes the core scoring logic by leveraging Claude AI to analyze enriched data and produce a detailed ICP scoring report in Markdown format.

**Nodes Involved:**  
- AI Agent  
- Anthropic Chat Model  
- Sticky Note (Calculate ICP)

**Node Details:**

- **AI Agent**  
  - **Type:** Langchain Agent Node  
  - **Role:** Orchestrates the prompt sent to the AI language model, processes input, and receives output  
  - **Configuration:**  
    - Prompt text dynamically references the submitted company name  
    - Instructions to generate a clean Markdown report with specified sections: Strategic Fit, AI/Tech Readiness, Engagement & Reachability, Final Summary, Total Score, Verdict  
    - Specifies formatting rules, scoring max points, and disallows any extra explanation or JSON output  
  - **Options:** Uses a system message to define the AI’s role precisely  
  - **Input:** Company name (from form), enriched data (from MCP Client via ai_tool connection), and Anthropic model output  
  - **Output:** Clean Markdown text report  
  - **Edge cases:** Prompt interpretation errors, AI timeouts, incomplete or ambiguous data, unexpected AI output format  
  - **Version:** 1.9

- **Anthropic Chat Model**  
  - **Type:** Langchain Anthropic Chat LLM  
  - **Role:** Provides Claude AI language model capability to the AI Agent  
  - **Configuration:**  
    - Model: "claude-3-7-sonnet-20250219" (latest Claude 3.7 Sonnet version)  
    - No additional options specified  
  - **Credentials:** Anthropic API key provided  
  - **Input:** Receives prompt from AI Agent  
  - **Output:** AI-generated text response sent back to AI Agent  
  - **Edge cases:** API rate limits, authentication failure, model unavailability  
  - **Version:** 1.3

- **Sticky Note**  
  - **Type:** Sticky Note  
  - **Role:** Label for the ICP calculation section  
  - **Content:** "## Calculate ICP" — summarizes the purpose of this block

---

#### 2.4 Report Generation

**Overview:**  
This block converts the Markdown report generated by the AI into a Google Doc file for easy access, sharing, and archiving.

**Nodes Involved:**  
- HTTP Request

**Node Details:**

- **HTTP Request**  
  - **Type:** HTTP Request Node  
  - **Role:** Sends the Markdown output to an external service that transforms Markdown into a Google Doc  
  - **Configuration:**  
    - URL: `https://md2doc.n8n.aemalsayer.com` (a dedicated Markdown-to-Google-Docs conversion API)  
    - Method: POST  
    - Body Parameters:  
      - `output`: AI Agent's Markdown output  
      - `fileName`: Company Name + "ICP Report" (dynamic from form data)  
    - Authentication: Google Docs OAuth2 credential for authorized document creation  
  - **Credentials:** Google Docs OAuth2 account with permissions to create documents  
  - **Input:** Markdown report text from AI Agent  
  - **Output:** Response from the document creation API (likely metadata or link to the created doc)  
  - **Edge cases:** API failure, authentication expiration, malformed Markdown, network errors  
  - **Version:** 4.2

---

### 3. Summary Table

| Node Name           | Node Type                         | Functional Role                      | Input Node(s)         | Output Node(s)      | Sticky Note                                                                                 |
|---------------------|----------------------------------|------------------------------------|-----------------------|---------------------|---------------------------------------------------------------------------------------------|
| On form submission   | Form Trigger                     | Entry point, receive company input | None                  | AI Agent            | Run this workflow using a form                                                              |
| Sticky Note4        | Sticky Note                      | Input parameter instructions       | None                  | None                | Run this workflow using a form                                                              |
| MCP Client          | Langchain MCP Client Tool        | Enrich company data from Explorium | AI Agent              | AI Agent            | # 🧠 ICP Scoring Agent (n8n + Explorium + LLM) ... (full scoring system and criteria note)  |
| Sticky Note7        | Sticky Note                      | ICP scoring system explanation     | None                  | None                | # 🧠 ICP Scoring Agent (n8n + Explorium + LLM) ... (full scoring system and criteria note)  |
| AI Agent            | Langchain Agent                  | Analyze data, generate ICP report  | On form submission, MCP Client, Anthropic Chat Model | HTTP Request       | ## Calculate ICP                                                                            |
| Anthropic Chat Model| Langchain Anthropic Chat LLM     | Provide Claude AI language model   | AI Agent (ai_languageModel) | AI Agent (ai_tool) |                                                                                             |
| Sticky Note         | Sticky Note                      | ICP calculation label               | None                  | None                | ## Calculate ICP                                                                            |
| HTTP Request        | HTTP Request                    | Convert Markdown to Google Doc     | AI Agent              | None                |                                                                                             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Form Trigger Node**  
   - Add a **Form Trigger** node named "On form submission".  
   - Configure form title as "Company ICP scoring".  
   - Add one required form field: "Company Name" with placeholder "Apple".  
   - Add form description explaining it takes LinkedIn and Airtop profiles and returns ICP score.

2. **Add Sticky Note for Input Instructions**  
   - Create a **Sticky Note** near the form trigger with content: "Run this workflow using a form".

3. **Add MCP Client Node**  
   - Add a **Langchain MCP Client Tool** node named "MCP Client".  
   - Set SSE endpoint to `mcp.explorium.ai/sse`.  
   - Configure authentication to use header authentication.  
   - Set credentials to an HTTP Header Auth credential for Explorium API key/token.  
   - Connect the output of "On form submission" to this node.

4. **Add Sticky Note for ICP Scoring Explanation**  
   - Add a **Sticky Note** named "Sticky Note7".  
   - Paste the full scoring system, pillars, criteria, verdicts, and use case explanation.

5. **Add Anthropic Chat Model Node**  
   - Add **Langchain Anthropic Chat Model** node named "Anthropic Chat Model".  
   - Select model "claude-3-7-sonnet-20250219".  
   - Configure with Anthropic API credentials.  
   - No extra options needed.

6. **Add AI Agent Node**  
   - Add **Langchain Agent** node named "AI Agent".  
   - Configure prompt text to generate a Markdown ICP report for the company name from form input. Use the provided template to request scores and summaries for the three pillars and final verdict.  
   - Set system message with detailed instructions for scoring and formatting (as per original).  
   - Connect "On form submission" main output, "MCP Client" ai_tool output, and "Anthropic Chat Model" ai_languageModel output to the AI Agent inputs accordingly.

7. **Add Sticky Note for ICP Calculation Label**  
   - Add a **Sticky Note** near AI Agent node with the content: "## Calculate ICP".

8. **Add HTTP Request Node for Report Generation**  
   - Add an **HTTP Request** node named "HTTP Request".  
   - Set method to POST and URL to `https://md2doc.n8n.aemalsayer.com`.  
   - Configure body parameters:  
     - `output` set to AI Agent’s Markdown output.  
     - `fileName` dynamically set to the company name + " ICP Report".  
   - Set authentication to Google Docs OAuth2 credential with permission to create docs.  
   - Connect AI Agent main output to this node.

9. **Arrange Connections and Execution Order**  
   - "On form submission" → "AI Agent"  
   - "MCP Client" → "AI Agent" (ai_tool)  
   - "Anthropic Chat Model" → "AI Agent" (ai_languageModel)  
   - "AI Agent" → "HTTP Request"

10. **Verify Credentials**  
    - Ensure Explorium API key is set up in HTTP Header Auth credentials.  
    - Ensure Anthropic API key is configured correctly.  
    - Ensure Google Docs OAuth2 is authorized with proper scopes.

11. **Test the Workflow**  
    - Submit a test company name via the form.  
    - Validate the AI-generated Markdown report is converted and saved as a Google Doc.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                              | Context or Link                                                              |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------|
| This workflow integrates Explorium MCP data enrichment with Claude AI for automated ICP scoring. The scoring system is based on a 3-pillar framework totaling 100 points.                                                                                                                  | See Sticky Note7 for detailed scoring explanation                           |
| The AI Agent uses a strict prompt format to generate clean Markdown reports suitable for direct conversion into Google Docs.                                                                                                                                                              | AI Agent node system message details                                        |
| Markdown to Google Docs conversion is done via an external API at https://md2doc.n8n.aemalsayer.com.                                                                                                                                                                                      | HTTP Request node configuration                                            |
| The workflow uses OAuth2 for Google Docs API, Anthropic API for Claude LLM, and header-based auth for Explorium MCP.                                                                                                                                | Credentials configuration                                                   |
| Ideal for GTM teams to automate lead scoring and prioritization with structured outputs for CRMs or document repositories.                                                                                                                                                                  | Use case described in Sticky Note7                                         |

---

**Disclaimer:** The text provided is exclusively derived from an automated workflow created with n8n, a tool for integration and automation. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All processed data is legal and public.