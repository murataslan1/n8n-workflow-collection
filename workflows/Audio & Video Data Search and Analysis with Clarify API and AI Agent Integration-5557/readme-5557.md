Audio & Video Data Search and Analysis with Clarify API and AI Agent Integration

https://n8nworkflows.xyz/workflows/audio---video-data-search-and-analysis-with-clarify-api-and-ai-agent-integration-5557


# Audio & Video Data Search and Analysis with Clarify API and AI Agent Integration

### 1. Workflow Overview

This workflow, titled **"Audio & Video Data Search and Analysis with Clarify API and AI Agent Integration"**, serves as a fully automated API server interface for the Clarify API (https://api.clarify.io/), which specializes in searching and analyzing audio and video data. It exposes 21 distinct Clarify API operations in a single n8n workflow, designed to be consumed by AI agents via an MCP (Multi-Channel Platform) trigger node.

The primary use case is to provide AI agents seamless, programmatic access to media bundle management, reporting, and search functionalities of the Clarify API, with parameters dynamically injected through AI-driven expressions.

**Logical Blocks:**

- **1.1 MCP Server Setup & Interface**  
  Manages the external interface via the MCP Trigger node and provides setup and overview instructions via sticky notes.

- **1.2 Bundles Operations**  
  Implements 18 HTTP request nodes covering the full lifecycle and management of media bundles, tracks, metadata, and insights.

- **1.3 Reports Operations**  
  Contains two HTTP request nodes to generate group and trends reports on media data.

- **1.4 Search Operation**  
  Contains a single HTTP request node to perform bundle searches using the Clarify API’s search endpoint.

---

### 2. Block-by-Block Analysis

#### 1.1 MCP Server Setup & Interface

**Overview:**  
This block sets up the interface endpoint for AI agents to call into the workflow (via MCP Trigger) and provides users with clear setup instructions and a workflow overview annotated by sticky notes.

**Nodes Involved:**  
- Setup Instructions (Sticky Note)  
- Workflow Overview (Sticky Note)  
- api.clarify.io MCP Server (MCP Trigger)

**Node Details:**

- **Setup Instructions**  
  - Type: Sticky Note  
  - Role: Provides detailed setup steps, usage notes, customization tips, and help resources.  
  - Configuration: Static text content with instructions on importing, activating workflow, obtaining webhook URL, and connecting AI agents.  
  - Input: None  
  - Output: None  
  - Edge Cases: None (informational only)

- **Workflow Overview**  
  - Type: Sticky Note  
  - Role: Describes the workflow purpose, how it works, and lists all available operations.  
  - Configuration: Static markdown content summarizing API functionality and integration details.  
  - Input: None  
  - Output: None  
  - Edge Cases: None (informational only)

- **api.clarify.io MCP Server**  
  - Type: MCP Trigger (from LangChain n8n nodes)  
  - Role: Entry point that exposes a webhook endpoint for AI agents to invoke Clarify API operations via this workflow.  
  - Configuration: Path set to "api.clarify.io-mcp" (defines webhook URL path).  
  - Input: HTTP requests from AI agents containing API call parameters.  
  - Output: Routes data to all HTTP Request nodes (all API operations) via MCP tool connections.  
  - Edge Cases:  
    - Failure to receive valid AI parameters (invalid or missing expressions) could cause downstream nodes to fail.  
    - Network or webhook availability issues could prevent AI agent calls.  
  - Version-Specific: Requires n8n version supporting @n8n/n8n-nodes-langchain.mcpTrigger node.

---

#### 1.2 Bundles Operations

**Overview:**  
This is the core functional block that provides full CRUD and management operations for media bundles, tracks, metadata, and insights via 18 HTTP request nodes. Each node corresponds to a specific Clarify API endpoint related to bundles.

**Nodes Involved:**  
- Sticky Note (Label: "Bundles")  
- List Bundles  
- Create Bundle 3  
- Delete Bundle 4  
- Retrieve Bundle  
- Update Bundle 4  
- Retrieve Bundle Insights  
- Request Insight Run  
- Retrieve Bundle Insight  
- Delete Bundle Metadata  
- Retrieve Bundle Metadata  
- Update Bundle Metadata  
- Delete Bundle Tracks  
- Retrieve Bundle Tracks  
- Add Bundle Track  
- Update Bundle Tracks  
- Delete Bundle Track  
- Retrieve Bundle Track  
- Add Media to Track

**Node Details:**

Each node is an HTTP Request Tool node configured to call a specific Clarify API endpoint with parameters dynamically populated via `$fromAI()` expressions. These expressions allow the AI agent to provide input values at runtime.

- **List Bundles**  
  - Type: HTTP Request Tool  
  - Role: Retrieves a list of media bundles with optional parameters for limiting results, embedding related data, and pagination.  
  - Config: GET request to `/v1/bundles`; uses query parameters: limit, embed, iterator.  
  - Key Expressions: `$fromAI('limit', ...)`, `$fromAI('embed', ...)`, `$fromAI('iterator', ...)`  
  - Input: MCP Trigger node  
  - Output: JSON list of bundles  
  - Edge Cases: Invalid limit or embed values; API rate limits; network timeouts

- **Create Bundle 3**  
  - Type: HTTP Request Tool  
  - Role: Creates a new media bundle.  
  - Config: POST request to `/v1/bundles` with body parameters expected from AI input (not explicitly detailed here).  
  - Input/Output: As above  
  - Edge Cases: Missing required body fields; API validation errors

- **Delete Bundle 4**  
  - Type: HTTP Request Tool  
  - Role: Deletes a bundle by ID.  
  - Config: DELETE request to `/v1/bundles/{{bundle_id}}`  
  - Key Expressions: `$fromAI('bundle_id', ...)`  
  - Edge Cases: Nonexistent bundle_id; unauthorized deletion attempts

- **Retrieve Bundle**  
  - Type: HTTP Request Tool  
  - Role: Retrieves detailed information about a specific bundle.  
  - Config: GET request to `/v1/bundles/{{bundle_id}}` with optional embed parameter.  
  - Expressions: `$fromAI('bundle_id', ...)`, `$fromAI('embed', ...)`

- **Update Bundle 4**  
  - Type: HTTP Request Tool  
  - Role: Updates bundle details by ID.  
  - Config: PUT request to `/v1/bundles/{{bundle_id}}` with update data from AI.  
  - Expressions: `$fromAI('bundle_id', ...)`

- **Retrieve Bundle Insights**  
  - Type: HTTP Request Tool  
  - Role: Gets insights associated with a bundle.  
  - Config: GET `/v1/bundles/{{bundle_id}}/insights`  
  - Expressions: `$fromAI('bundle_id', ...)`

- **Request Insight Run**  
  - Type: HTTP Request Tool  
  - Role: Requests an insight analysis run on a bundle.  
  - Config: POST `/v1/bundles/{{bundle_id}}/insights`  
  - Expressions: `$fromAI('bundle_id', ...)`

- **Retrieve Bundle Insight**  
  - Type: HTTP Request Tool  
  - Role: Retrieves a specific insight by insight_id for a bundle.  
  - Config: GET `/v1/bundles/{{bundle_id}}/insights/{{insight_id}}`  
  - Expressions: `$fromAI('bundle_id', ...)`, `$fromAI('insight_id', ...)`

- **Delete Bundle Metadata**  
  - Type: HTTP Request Tool  
  - Role: Deletes metadata of a bundle.  
  - Config: DELETE `/v1/bundles/{{bundle_id}}/metadata`  
  - Expressions: `$fromAI('bundle_id', ...)`

- **Retrieve Bundle Metadata**  
  - Type: HTTP Request Tool  
  - Role: Gets metadata for a bundle.  
  - Config: GET `/v1/bundles/{{bundle_id}}/metadata`  
  - Expressions: `$fromAI('bundle_id', ...)`

- **Update Bundle Metadata**  
  - Type: HTTP Request Tool  
  - Role: Updates metadata for a bundle.  
  - Config: PUT `/v1/bundles/{{bundle_id}}/metadata`  
  - Expressions: `$fromAI('bundle_id', ...)`

- **Delete Bundle Tracks**  
  - Type: HTTP Request Tool  
  - Role: Deletes all tracks associated with a bundle.  
  - Config: DELETE `/v1/bundles/{{bundle_id}}/tracks`  
  - Expressions: `$fromAI('bundle_id', ...)`

- **Retrieve Bundle Tracks**  
  - Type: HTTP Request Tool  
  - Role: Retrieves track information for a bundle.  
  - Config: GET `/v1/bundles/{{bundle_id}}/tracks`  
  - Expressions: `$fromAI('bundle_id', ...)`

- **Add Bundle Track**  
  - Type: HTTP Request Tool  
  - Role: Adds a new track to a bundle.  
  - Config: POST `/v1/bundles/{{bundle_id}}/tracks`  
  - Expressions: `$fromAI('bundle_id', ...)`

- **Update Bundle Tracks**  
  - Type: HTTP Request Tool  
  - Role: Updates tracks for a bundle.  
  - Config: PUT `/v1/bundles/{{bundle_id}}/tracks`  
  - Expressions: `$fromAI('bundle_id', ...)`

- **Delete Bundle Track**  
  - Type: HTTP Request Tool  
  - Role: Deletes a specific track from a bundle.  
  - Config: DELETE `/v1/bundles/{{bundle_id}}/tracks/{{track_id}}`  
  - Expressions: `$fromAI('bundle_id', ...)`, `$fromAI('track_id', ...)`

- **Retrieve Bundle Track**  
  - Type: HTTP Request Tool  
  - Role: Retrieves a specific track from a bundle.  
  - Config: GET `/v1/bundles/{{bundle_id}}/tracks/{{track_id}}`  
  - Expressions: `$fromAI('bundle_id', ...)`, `$fromAI('track_id', ...)`

- **Add Media to Track**  
  - Type: HTTP Request Tool  
  - Role: Adds media to an existing track on a bundle.  
  - Config: PUT `/v1/bundles/{{bundle_id}}/tracks/{{track_id}}`  
  - Expressions: `$fromAI('bundle_id', ...)`, `$fromAI('track_id', ...)`

**Edge Cases for Block:**  
- Missing or invalid bundle_id or track_id parameters leading to 404 errors  
- Malformed or missing request bodies for POST/PUT operations causing validation errors  
- API rate limiting or network errors  
- Invalid embed or pagination parameters causing unexpected results

---

#### 1.3 Reports Operations

**Overview:**  
This block provides report generation endpoints to produce group and trends reports based on Clarify audio/video data.

**Nodes Involved:**  
- Sticky Note2 (Label: "Reports")  
- Generate Group Report  
- Generate Trends Report

**Node Details:**

- **Generate Group Report**  
  - Type: HTTP Request Tool  
  - Role: Generates a group scoring report over specified intervals.  
  - Config: GET `/v1/reports/scores` with query parameters interval, score_field, group_field, filter, language.  
  - Expressions: `$fromAI('interval', ...)`, `$fromAI('score_field', ...)`, `$fromAI('group_field', ...)`, `$fromAI('filter', ...)`, `$fromAI('language', ...)`

- **Generate Trends Report**  
  - Type: HTTP Request Tool  
  - Role: Generates trends report with customizable content and filters.  
  - Config: GET `/v1/reports/trends` with parameters interval, content, filter, language.  
  - Expressions: `$fromAI('interval', ...)`, `$fromAI('content', ...)`, `$fromAI('filter', ...)`, `$fromAI('language', ...)`

**Edge Cases:**  
- Invalid or missing required parameters (interval, score_field, group_field)  
- Overly large or complex filters exceeding API limits  
- Language codes not conforming to RFC5646 causing errors

---

#### 1.4 Search Operation

**Overview:**  
Implements the Clarify API search endpoint allowing AI agents to perform complex search queries across bundles.

**Nodes Involved:**  
- Sticky Note3 (Label: "Search")  
- Search Bundles

**Node Details:**

- **Search Bundles**  
  - Type: HTTP Request Tool  
  - Role: Performs search queries across bundles using various filters and fields.  
  - Config: GET `/v1/search` with parameters query, query_fields, filter, language, limit, embed, iterator.  
  - Expressions: All parameters are dynamically taken from AI input via `$fromAI()` for maximum flexibility.

**Edge Cases:**  
- Search terms exceeding 120 characters will be rejected by API  
- Query_fields exceeding 1024 characters or invalid field names  
- Improper filter expressions causing API errors  
- Pagination iterator handling required for continued results

---

### 3. Summary Table

| Node Name               | Node Type                  | Functional Role                                  | Input Node(s)             | Output Node(s)          | Sticky Note                                                                                                     |
|-------------------------|----------------------------|-------------------------------------------------|---------------------------|-------------------------|----------------------------------------------------------------------------------------------------------------|
| Setup Instructions      | Sticky Note                | Provides detailed setup and usage instructions  | None                      | None                    | ⚙️ Setup Instructions: Import workflow, activate, get MCP URL, connect AI agent, customization tips, help links |
| Workflow Overview       | Sticky Note                | Explains workflow purpose and lists operations  | None                      | None                    | 🛠️ api.clarify.io MCP Server with 21 operations overview                                                      |
| api.clarify.io MCP Server | MCP Trigger                | Entry point for AI agent calls via webhook      | External HTTP calls        | All HTTP Request nodes   | See setup instructions                                                                                         |
| Sticky Note (Bundles)   | Sticky Note                | Labels bundle-related nodes                       | None                      | None                    | "## Bundles"                                                                                                   |
| List Bundles            | HTTP Request Tool          | Lists bundles with optional pagination/embedding| MCP Trigger                | None                    |                                                                                                                |
| Create Bundle 3         | HTTP Request Tool          | Creates a new bundle                              | MCP Trigger                | None                    |                                                                                                                |
| Delete Bundle 4         | HTTP Request Tool          | Deletes a bundle by ID                            | MCP Trigger                | None                    |                                                                                                                |
| Retrieve Bundle         | HTTP Request Tool          | Retrieves bundle details                          | MCP Trigger                | None                    |                                                                                                                |
| Update Bundle 4         | HTTP Request Tool          | Updates bundle details                            | MCP Trigger                | None                    |                                                                                                                |
| Retrieve Bundle Insights| HTTP Request Tool          | Gets insights for a bundle                        | MCP Trigger                | None                    |                                                                                                                |
| Request Insight Run     | HTTP Request Tool          | Requests insight analysis run                     | MCP Trigger                | None                    |                                                                                                                |
| Retrieve Bundle Insight | HTTP Request Tool          | Retrieves specific insight                        | MCP Trigger                | None                    |                                                                                                                |
| Delete Bundle Metadata  | HTTP Request Tool          | Deletes bundle metadata                           | MCP Trigger                | None                    |                                                                                                                |
| Retrieve Bundle Metadata| HTTP Request Tool          | Gets bundle metadata                              | MCP Trigger                | None                    |                                                                                                                |
| Update Bundle Metadata  | HTTP Request Tool          | Updates bundle metadata                           | MCP Trigger                | None                    |                                                                                                                |
| Delete Bundle Tracks    | HTTP Request Tool          | Deletes all tracks of a bundle                    | MCP Trigger                | None                    |                                                                                                                |
| Retrieve Bundle Tracks  | HTTP Request Tool          | Retrieves tracks of a bundle                      | MCP Trigger                | None                    |                                                                                                                |
| Add Bundle Track        | HTTP Request Tool          | Adds a track to a bundle                          | MCP Trigger                | None                    |                                                                                                                |
| Update Bundle Tracks    | HTTP Request Tool          | Updates bundle tracks                             | MCP Trigger                | None                    |                                                                                                                |
| Delete Bundle Track     | HTTP Request Tool          | Deletes a specific track                          | MCP Trigger                | None                    |                                                                                                                |
| Retrieve Bundle Track   | HTTP Request Tool          | Retrieves a specific track                        | MCP Trigger                | None                    |                                                                                                                |
| Add Media to Track      | HTTP Request Tool          | Adds media to a track                             | MCP Trigger                | None                    |                                                                                                                |
| Sticky Note2 (Reports)  | Sticky Note                | Labels report-related nodes                       | None                      | None                    | "## Reports"                                                                                                   |
| Generate Group Report   | HTTP Request Tool          | Generates group scoring report                    | MCP Trigger                | None                    |                                                                                                                |
| Generate Trends Report  | HTTP Request Tool          | Generates trends report                           | MCP Trigger                | None                    |                                                                                                                |
| Sticky Note3 (Search)   | Sticky Note                | Labels search node                                | None                      | None                    | "## Search"                                                                                                    |
| Search Bundles          | HTTP Request Tool          | Searches bundles with complex queries            | MCP Trigger                | None                    |                                                                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Sticky Notes for Setup & Overview**  
   - Add two sticky note nodes named "Setup Instructions" and "Workflow Overview".  
   - Paste the provided texts for setup steps and workflow overview respectively.  
   - Position them to the left for documentation clarity.

2. **Add MCP Trigger Node**  
   - Add a node of type `@n8n/n8n-nodes-langchain.mcpTrigger`.  
   - Set the webhook path parameter to `api.clarify.io-mcp`.  
   - This will be the entrypoint for AI agents.

3. **Add Sticky Note for Bundles Label**  
   - Add a sticky note titled "## Bundles" near the bundle operation nodes.

4. **Add Bundle HTTP Request Nodes (18 total)**  
   For each Clarify API endpoint related to bundles, create an HTTP Request Tool node with these common setup points:

   - **Authentication:** No authentication required according to instructions, but verify API key or auth if Clarify API requires it outside this workflow.  
   - **URL:** Use the base URL `https://api.clarify.io/v1/` appended with the appropriate endpoint path.  
   - **Method:** Set per operation (GET, POST, PUT, DELETE).  
   - **Parameters:**  
     - Use query parameters or path parameters as indicated.  
     - Use expressions such as `{{$fromAI('param_name', 'description', 'type')}}` to allow AI agents to populate inputs dynamically.  
   - **Descriptions:** Use the toolDescription field to add helpful hints for future maintainers.  
   - **Connect Inputs:** Connect the MCP Trigger node as the input for all these HTTP Request nodes.  
   - **Operations to add:**  
     - List Bundles (GET /bundles)  
     - Create Bundle (POST /bundles)  
     - Delete Bundle (DELETE /bundles/{bundle_id})  
     - Retrieve Bundle (GET /bundles/{bundle_id})  
     - Update Bundle (PUT /bundles/{bundle_id})  
     - Retrieve Bundle Insights (GET /bundles/{bundle_id}/insights)  
     - Request Insight Run (POST /bundles/{bundle_id}/insights)  
     - Retrieve Bundle Insight (GET /bundles/{bundle_id}/insights/{insight_id})  
     - Delete Bundle Metadata (DELETE /bundles/{bundle_id}/metadata)  
     - Retrieve Bundle Metadata (GET /bundles/{bundle_id}/metadata)  
     - Update Bundle Metadata (PUT /bundles/{bundle_id}/metadata)  
     - Delete Bundle Tracks (DELETE /bundles/{bundle_id}/tracks)  
     - Retrieve Bundle Tracks (GET /bundles/{bundle_id}/tracks)  
     - Add Bundle Track (POST /bundles/{bundle_id}/tracks)  
     - Update Bundle Tracks (PUT /bundles/{bundle_id}/tracks)  
     - Delete Bundle Track (DELETE /bundles/{bundle_id}/tracks/{track_id})  
     - Retrieve Bundle Track (GET /bundles/{bundle_id}/tracks/{track_id})  
     - Add Media to Track (PUT /bundles/{bundle_id}/tracks/{track_id})

5. **Add Sticky Note for Reports Label**  
   - Add a sticky note with content "## Reports" near the report nodes.

6. **Add Reports HTTP Request Nodes (2 total)**  
   - **Generate Group Report:** GET `/v1/reports/scores` with query parameters: interval, score_field, group_field, filter, language.  
   - **Generate Trends Report:** GET `/v1/reports/trends` with query parameters: interval, content, filter, language.  
   - Use `$fromAI()` expressions for all parameters.  
   - Connect MCP Trigger as input.

7. **Add Sticky Note for Search Label**  
   - Add a sticky note with content "## Search" near the search node.

8. **Add Search HTTP Request Node**  
   - Add HTTP Request Tool node named "Search Bundles".  
   - Configure GET `/v1/search` with query parameters: query, query_fields, filter, language, limit, embed, iterator.  
   - Use `$fromAI()` expressions for each parameter.  
   - Connect MCP Trigger as input.

9. **Finalize Connections**  
   - Ensure the MCP Trigger node is connected as input to all HTTP Request nodes via the ai_tool connection type.  
   - No further inter-node connections are required as each represents independent Clarify API endpoints invoked on demand.

10. **Workflow Settings**  
    - Set workflow timezone to America/New_York (or as required).  
    - Activate the workflow to expose the webhook endpoint.

11. **Testing & Validation**  
    - Test each operation by invoking the webhook URL with appropriate JSON payloads matching the `$fromAI()` parameters.  
    - Handle error cases by adding error workflow or additional error handling nodes as needed.

---

### 5. General Notes & Resources

| Note Content                                                                                                            | Context or Link                                                                                       |
|-------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| For integration guidance and custom automation help, contact via Discord at [discord.me/cfomodz](https://discord.me/cfomodz) | Support channel for Clarify API & n8n integration issues                                             |
| n8n documentation on MCP and LangChain integration: [n8n Docs - MCP Node](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.toolmcp/) | Official docs explaining MCP trigger node and usage                                                 |
| Parameters in all HTTP request nodes use `$fromAI()` expressions to auto-populate values from AI agent inputs.           | Ensures dynamic and flexible AI-driven API calls                                                    |
| No authentication is required for this workflow but verify Clarify API’s current auth policies if deploying externally.  | Clarify API may require API keys or tokens depending on environment                                 |
| Consider adding logging and error handling nodes for production readiness.                                               | Enhances maintainability and fault tolerance                                                        |

---

**Disclaimer:** The text provided originates exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly complies with current content policies and contains no illegal, offensive, or protected material. All data handled are legal and public.