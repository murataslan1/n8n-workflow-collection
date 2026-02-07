Automate SEO Tasks with Google Search Console & AI via MCP Server

https://n8nworkflows.xyz/workflows/automate-seo-tasks-with-google-search-console---ai-via-mcp-server-6824


# Automate SEO Tasks with Google Search Console & AI via MCP Server

### 1. Workflow Overview

This workflow, titled **"Automate SEO Tasks with Google Search Console & AI via MCP Server,"** is designed to serve as a Model Context Protocol (MCP) server that connects MCP-compatible AI tools (e.g., Anthropic's Claude) directly with Google Search Console (GSC) APIs. The main purpose is to automate essential SEO tasks such as listing verified sites, retrieving site details, accessing search analytics data, submitting sitemaps, and requesting URL indexing — all orchestrated through AI-driven commands.

The workflow is logically divided into the following blocks:

- **1.1 MCP Server Input Reception**  
  Handles incoming MCP API requests and exposes webhooks for AI tool integration.

- **1.2 Google Search Console API Requests**  
  Executes HTTP requests to various GSC endpoints for listing sites, fetching site info, querying search analytics, submitting sitemaps, and requesting URL indexing.

- **1.3 Documentation & User Guidance**  
  Contains sticky notes that provide detailed descriptions, setup instructions, usage examples, and contact information for custom workflow development.

---

### 2. Block-by-Block Analysis

#### 1.1 MCP Server Input Reception

- **Overview:**  
  This block accepts incoming MCP requests from AI tools, acting as the entry point for all the workflow's SEO automation capabilities. It exposes a webhook path to receive commands and relay them to appropriate API request nodes.

- **Nodes Involved:**  
  - MCP GSC

- **Node Details:**

  - **MCP GSC**  
    - Type: `@n8n/n8n-nodes-langchain.mcpTrigger` (MCP Trigger Node)  
    - Role: Exposes a secure webhook endpoint (`/125ed1a6-7292-4085-b22e-9a1028c22449`) that listens for MCP-compatible AI tool requests. This node triggers the workflow when an AI tool sends commands for interacting with Google Search Console.  
    - Configuration: Webhook path is explicitly set to the unique ID above; no additional parameters needed.  
    - Inputs: None (trigger node)  
    - Outputs: Connected via custom `ai_tool` outputs to all API request nodes to delegate tasks.  
    - Version Requirements: Requires n8n version supporting MCP nodes and webhook triggers.  
    - Edge Cases:  
      - Webhook accessibility issues (must be publicly reachable over HTTPS).  
      - Invalid or malformed MCP requests could cause failures or no action.  
      - Authentication and authorization depend on configured OAuth2 credentials.

---

#### 1.2 Google Search Console API Requests

- **Overview:**  
  This block contains HTTP request nodes configured to interact with Google APIs for managing SEO-related data and tasks. Each node corresponds to a specific GSC API endpoint or functionality.

- **Nodes Involved:**  
  - list sites request  
  - Get Site Info Request1  
  - Search Analytics Request1  
  - Submit Sitemap Request1  
  - Request Indexing Request1

- **Node Details:**

  - **list sites request**  
    - Type: `n8n-nodes-base.httpRequestTool`  
    - Role: Calls `GET https://www.googleapis.com/webmasters/v3/sites` to retrieve a list of all verified sites in GSC for the authenticated user.  
    - Configuration: Simple GET request with no body or query parameters.  
    - Inputs: Receives trigger from MCP GSC node via `ai_tool` output.  
    - Outputs: Response forwarded back to MCP GSC for processing.  
    - Edge Cases: OAuth token expiration or invalid scopes; Google API rate limits.

  - **Get Site Info Request1**  
    - Type: `n8n-nodes-base.httpRequestTool`  
    - Role: Calls `GET https://www.googleapis.com/webmasters/v3/sites/{siteUrl}` to fetch detailed information about a specific site.  
    - Configuration: URL parameterized with `{{ encodeURIComponent($json.params.arguments.siteUrl) }}`, dynamically injected from MCP input arguments.  
    - Inputs: Triggered from MCP GSC node.  
    - Outputs: Site info JSON data returned to MCP GSC.  
    - Edge Cases: Invalid site URL, missing argument, HTTP 404 if site not found.

  - **Search Analytics Request1**  
    - Type: `n8n-nodes-base.httpRequestTool`  
    - Role: Calls `POST https://www.googleapis.com/webmasters/v3/sites/{siteUrl}/searchAnalytics/query` to query search analytics data like clicks, impressions, etc.  
    - Configuration:  
      - URL parameterized using `{{ encodeURIComponent($json.params.arguments.siteUrl) }}`  
      - HTTP method POST  
      - Body expected from MCP input (not explicitly shown, but implied)  
    - Inputs: Triggered from MCP GSC.  
    - Outputs: Analytics data returned to MCP GSC.  
    - Edge Cases: Missing or malformed query body; API quota limits; invalid site URL.

  - **Submit Sitemap Request1**  
    - Type: `n8n-nodes-base.httpRequestTool`  
    - Role: Calls `PUT https://www.googleapis.com/webmasters/v3/sites/{siteUrl}/sitemaps/{feedpath}` to submit or update a sitemap.  
    - Configuration:  
      - URL uses `siteUrl` and `feedpath` parameters from MCP input arguments.  
      - HTTP method PUT  
    - Inputs: Triggered from MCP GSC.  
    - Outputs: API confirmation response.  
    - Edge Cases: Invalid feedpath or siteUrl; permission errors.

  - **Request Indexing Request1**  
    - Type: `n8n-nodes-base.httpRequestTool`  
    - Role: Calls `POST https://indexing.googleapis.com/v3/urlNotifications:publish` to request Google to index or reindex a URL.  
    - Configuration:  
      - HTTP POST with JSON body containing `url` and `type` fields extracted from MCP input arguments (`inspectionUrl` and fixed "URL_UPDATED").  
      - Body parameters:  
        ```json
        {
          "url": "{{ $json.params.arguments.inspectionUrl }}",
          "type": "URL_UPDATED"
        }
        ```  
    - Inputs: Triggered from MCP GSC.  
    - Outputs: Indexing request response.  
    - Edge Cases: Invalid URL, quota exceeded, invalid OAuth scopes.

---

#### 1.3 Documentation & User Guidance

- **Overview:**  
  This block provides comprehensive documentation, setup instructions, usage examples, and contact information for users and developers. It is designed as reference material embedded inside the workflow via sticky notes.

- **Nodes Involved:**  
  - Sticky Note  
  - Sticky Note1  
  - Sticky Note2

- **Node Details:**

  - **Sticky Note**  
    - Type: `n8n-nodes-base.stickyNote`  
    - Role: Contains the main workflow description, setup instructions (OAuth2, prerequisites), usage examples, and recommended applications.  
    - Content Highlights:  
      - Details on enabling Google APIs and OAuth2 scopes.  
      - Instructions for importing workflow and configuring credentials.  
      - Use cases for SEO automation.  
    - Position: Top-left area of canvas, large size (608x1712).  
    - No inputs or outputs (informational only).

  - **Sticky Note1**  
    - Type: `n8n-nodes-base.stickyNote`  
    - Role: Provides contact info for custom workflow requests, links to ROI calculator and cost-saving snapshots.  
    - Includes links:  
      - [Custom Automation Form](https://taskmorphr.com/contact)  
      - [ROI / Cost Comparison](https://taskmorphr.com/cost-comparison)  
    - Positioned near the API request nodes.

  - **Sticky Note2**  
    - Type: `n8n-nodes-base.stickyNote`  
    - Role: Promotes a template pack and directs users to browse ready-made workflows.  
    - Link: [Full Template Pack — coming soon](https://n8n.io/creators/diagopl/)  
    - Positioned near bottom-right corner.

---

### 3. Summary Table

| Node Name               | Node Type                                | Functional Role                                   | Input Node(s) | Output Node(s) | Sticky Note                                                                                                   |
|-------------------------|-----------------------------------------|--------------------------------------------------|---------------|----------------|--------------------------------------------------------------------------------------------------------------|
| MCP GSC                 | @n8n/n8n-nodes-langchain.mcpTrigger    | MCP webhook entry point for AI requests          | None          | list sites request, Get Site Info Request1, Search Analytics Request1, Submit Sitemap Request1, Request Indexing Request1 (via ai_tool outputs) |                                                                                                              |
| list sites request      | n8n-nodes-base.httpRequestTool          | Retrieves list of verified Google Search Console sites | MCP GSC       | MCP GSC        |                                                                                                              |
| Get Site Info Request1  | n8n-nodes-base.httpRequestTool          | Fetches detailed info about a specific site      | MCP GSC       | MCP GSC        |                                                                                                              |
| Search Analytics Request1 | n8n-nodes-base.httpRequestTool        | Queries search analytics data for a site          | MCP GSC       | MCP GSC        |                                                                                                              |
| Submit Sitemap Request1 | n8n-nodes-base.httpRequestTool          | Submits or updates sitemap for a site             | MCP GSC       | MCP GSC        |                                                                                                              |
| Request Indexing Request1 | n8n-nodes-base.httpRequestTool        | Requests Google indexing for a URL                 | MCP GSC       | MCP GSC        |                                                                                                              |
| Sticky Note             | n8n-nodes-base.stickyNote               | Workflow overview, setup, instructions, use cases | None          | None           | # 🚀 Google Search Console MCP Server — includes OAuth2 setup and usage instructions                          |
| Sticky Note1            | n8n-nodes-base.stickyNote               | Contact info, custom workflow links, ROI calculator | None          | None           | ## Need a tailor-made workflow? Tell me about your business and get a free proposal: [link]                   |
| Sticky Note2            | n8n-nodes-base.stickyNote               | Promotion of template pack and ready-made workflows | None          | None           | ### 🛠️ Build it yourself: Browse every ready-made workflow: [Full Template Pack — coming soon]                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create MCP Trigger Node**  
   - Add node: `MCP GSC` (type: `@n8n/n8n-nodes-langchain.mcpTrigger`)  
   - Set the webhook path to: `125ed1a6-7292-4085-b22e-9a1028c22449`  
   - This node will expose the webhook endpoint for AI tools to send requests.

2. **Create HTTP Request Node: list sites request**  
   - Node type: `HTTP Request` (httpRequestTool)  
   - Method: GET  
   - URL: `https://www.googleapis.com/webmasters/v3/sites`  
   - No authentication parameters here, OAuth2 credentials will be attached globally or in n8n settings.  
   - Connect MCP GSC node's ai_tool output to this node's input.

3. **Create HTTP Request Node: Get Site Info Request1**  
   - Node type: `HTTP Request`  
   - Method: GET  
   - URL (expression):  
     ```n8n
     https://www.googleapis.com/webmasters/v3/sites/{{ encodeURIComponent($json.params.arguments.siteUrl) }}
     ```  
   - Connect MCP GSC ai_tool output to this node's input.

4. **Create HTTP Request Node: Search Analytics Request1**  
   - Node type: `HTTP Request`  
   - Method: POST  
   - URL (expression):  
     ```n8n
     https://www.googleapis.com/webmasters/v3/sites/{{ encodeURIComponent($json.params.arguments.siteUrl) }}/searchAnalytics/query
     ```  
   - Body: Should be passed dynamically based on MCP input (not explicitly shown but expected).  
   - Connect MCP GSC ai_tool output to this node's input.

5. **Create HTTP Request Node: Submit Sitemap Request1**  
   - Node type: `HTTP Request`  
   - Method: PUT  
   - URL (expression):  
     ```n8n
     https://www.googleapis.com/webmasters/v3/sites/{{ encodeURIComponent($json.params.arguments.siteUrl) }}/sitemaps/{{ encodeURIComponent($json.params.arguments.feedpath) }}
     ```  
   - Connect MCP GSC ai_tool output to this node's input.

6. **Create HTTP Request Node: Request Indexing Request1**  
   - Node type: `HTTP Request`  
   - Method: POST  
   - URL: `https://indexing.googleapis.com/v3/urlNotifications:publish`  
   - Body (JSON):  
     ```json
     {
       "url": "{{ $json.params.arguments.inspectionUrl }}",
       "type": "URL_UPDATED"
     }
     ```  
   - Set `sendBody` to true.  
   - Connect MCP GSC ai_tool output to this node's input.

7. **Configure Credentials**  
   - In n8n, add new **Google OAuth2 API** credentials with:  
     - Client ID and Client Secret from Google Cloud Project  
     - Scopes:  
       ```
       https://www.googleapis.com/auth/webmasters.readonly
       https://www.googleapis.com/auth/webmasters
       https://www.googleapis.com/auth/indexing
       ```  
   - Assign these credentials to all HTTP Request nodes interacting with Google APIs.

8. **Add Sticky Notes for Documentation (Optional but Recommended)**  
   - Add Sticky Note with main description and setup instructions (copy content from the original Sticky Note).  
   - Add Sticky Note with contact and ROI calculator links.  
   - Add Sticky Note promoting template packs.

9. **Test and Deploy**  
   - Ensure the webhook path is publicly accessible over HTTPS.  
   - Send sample MCP requests to the webhook URL to verify each API interaction works as intended.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                | Context or Link                                                                                                     |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------|
| This workflow acts as a Model Context Protocol (MCP) server enabling AI tools like Claude to interact directly with Google Search Console APIs for SEO automation. OAuth2 authentication with Google Cloud credentials is mandatory.                                                                            | See main Sticky Note content inside workflow.                                                                      |
| Custom workflow proposals and consulting available via: [Custom Automation Form](https://taskmorphr.com/contact)                                                                                                                                                                                           | Sticky Note1 contact info.                                                                                          |
| Cost savings calculator to estimate automation ROI: [ROI / Cost Comparison](https://taskmorphr.com/cost-comparison)                                                                                                                                                                                       | Sticky Note1.                                                                                                      |
| Browse ready-made workflows and templates to extend or learn from: [Full Template Pack — coming soon](https://n8n.io/creators/diagopl/)                                                                                                                                                                   | Sticky Note2.                                                                                                      |
| Google APIs used: Search Console API, Web Indexing API; OAuth2 scopes must include `webmasters.readonly`, `webmasters`, and `indexing`.                                                                                                                                                                    | Setup instructions in main Sticky Note.                                                                            |
| The workflow requires a publicly accessible HTTPS endpoint for webhook triggers, which might require proxy or reverse proxy setup if self-hosted.                                                                                                                                                         | General deployment note.                                                                                            |
| Potential failure points include expired OAuth tokens, API quota limits, invalid input parameters, and network connectivity issues. Proper error handling and retries should be implemented in production environments.                                                                                       | Best practice recommendation.                                                                                       |

---

**Disclaimer:**  
The provided text describes an automated n8n workflow strictly compliant with content policies; it processes only legal and public data with no offensive or protected content.