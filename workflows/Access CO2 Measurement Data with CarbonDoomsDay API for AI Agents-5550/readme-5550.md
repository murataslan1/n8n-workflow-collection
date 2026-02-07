Access CO2 Measurement Data with CarbonDoomsDay API for AI Agents

https://n8nworkflows.xyz/workflows/access-co2-measurement-data-with-carbondoomsday-api-for-ai-agents-5550


# Access CO2 Measurement Data with CarbonDoomsDay API for AI Agents

### 1. Workflow Overview

This workflow, titled **"Access CO2 Measurement Data with CarbonDoomsDay API for AI Agents"**, functions as an MCP (Model-Controller-Provider) server endpoint, designed to expose the CarbonDoomsDay API through a REST-like interface tailored for AI agents. It allows the agents to query real-time and historical carbon dioxide (CO2) measurement data from the Mauna Loa observatory.

The workflow is logically organized into the following blocks:

- **1.1 Setup & Documentation**: Provides setup instructions, usage notes, and workflow overview for maintainers and integrators.
- **1.2 MCP Trigger Endpoint**: Hosts the webhook endpoint that AI agents call to access the API functionalities.
- **1.3 API Interaction - CO2 Data Retrieval**: Contains two HTTP Request Tool nodes that execute calls to the CarbonDoomsDay API:
  - Listing CO2 measurements with optional filters and pagination.
  - Retrieving CO2 measurement data for a specific date.

These blocks work together to receive AI agent requests, translate them into API calls with parameters dynamically provided via AI expressions, and return the raw API responses.

---

### 2. Block-by-Block Analysis

#### 2.1 Setup & Documentation

**Overview:**  
This block provides essential setup instructions, usage guidelines, and a high-level overview of the workflow's purpose and operations. It is informational and does not affect data flow.

**Nodes Involved:**  
- Setup Instructions (Sticky Note)  
- Workflow Overview (Sticky Note)  
- Sticky Note (label "Co2")

**Node Details:**  

- **Setup Instructions**  
  - Type: Sticky Note  
  - Role: Deliver detailed setup steps for importing, authenticating, activating the workflow; usage notes; customization tips; and support contacts.  
  - Configuration: Colored note with multi-paragraph markdown content including links to Discord support and n8n documentation.  
  - Input: None  
  - Output: None  
  - Edge Cases: None applicable (informational only)

- **Workflow Overview**  
  - Type: Sticky Note  
  - Role: Explain the workflow’s purpose as a real-time REST-like API server for worldwide CO2 levels via CarbonDoomsDay. Summarizes node roles and available operations.  
  - Configuration: Markdown content with operation list and technical description.  
  - Input: None  
  - Output: None  
  - Edge Cases: None applicable

- **Sticky Note (Co2)**  
  - Type: Sticky Note  
  - Role: Visual label grouping CO2-related HTTP request nodes.  
  - Configuration: Small colored note with "## Co2" heading.  
  - Input: None  
  - Output: None  
  - Edge Cases: None

---

#### 2.2 MCP Trigger Endpoint

**Overview:**  
This block hosts the MCP trigger node that acts as the HTTP webhook endpoint. It listens for incoming requests from AI agents and routes them to the corresponding downstream nodes which handle specific API calls.

**Nodes Involved:**  
- CarbonDoomsDay MCP Server (MCP Trigger)

**Node Details:**  

- **CarbonDoomsDay MCP Server**  
  - Type: MCP Trigger (from n8n-nodes-langchain package)  
  - Role: Exposes a webhook at path `carbondoomsday-mcp` that AI agents call to invoke the workflow. Acts as the server interface for MCP-compatible AI tools.  
  - Configuration:  
    - Webhook Path: `/carbondoomsday-mcp`  
    - No authentication configured here (authentication handled downstream or via credentials)  
  - Input: External HTTP request from AI agent  
  - Output: Routes requests to one of two HTTP request nodes based on AI tool selection  
  - Version-specific: Requires n8n version supporting MCP Trigger node (version ≥1.94)  
  - Edge Cases:  
    - Webhook URL must be publicly accessible for AI agents  
    - Possible timeout or connectivity issues if the workflow or server is down  
    - Improper AI requests may cause expression failures downstream  

---

#### 2.3 API Interaction - CO2 Data Retrieval

**Overview:**  
This block contains two HTTP Request Tool nodes that interact with CarbonDoomsDay API endpoints for CO2 data. They use AI-driven expressions to populate query and path parameters dynamically based on AI agent input.

**Nodes Involved:**  
- List CO2 Measurements (HTTP Request Tool)  
- Get CO2 Measurement by Date (HTTP Request Tool)

**Node Details:**  

- **List CO2 Measurements**  
  - Type: HTTP Request Tool  
  - Role: Queries the `/api/co2/` endpoint with optional filters and pagination to list CO2 measurements.  
  - Configuration:  
    - URL: `https://api.carbondoomsday.com/api/co2/`  
    - Method: GET (default for HTTP Request Tool)  
    - Authentication: Generic HTTP Header Authentication (configured via credentials)  
    - Query Parameters:  
      - `ppm`: CO2 concentration (optional, number)  
      - `date`: Specific date filter (optional, string)  
      - `date__range`: Range of dates, comma-separated (optional, string)  
      - `ordering`: Field to order results by (optional, string)  
      - `page`: Page number for pagination (optional, number)  
      - `limit`: Results per page (optional, number)  
    - Parameters populated using `$fromAI()` expressions to allow AI to specify values dynamically  
    - Tool Description: Detailed comment on data sources, data availability since 1958, and pagination usage with associated links  
  - Input: From MCP Trigger node when "List CO2 Measurements" tool is invoked  
  - Output: Returns raw JSON response from CarbonDoomsDay API to MCP Trigger for forwarding to AI agent  
  - Edge Cases:  
    - Invalid or malformed query parameters may cause API errors  
    - Pagination parameters must be integers; non-numeric input may cause failures  
    - Authentication errors if credentials are incorrect or missing  
    - Network timeouts or API downtime  

- **Get CO2 Measurement by Date**  
  - Type: HTTP Request Tool  
  - Role: Fetches CO2 measurement data for a specific date from `/api/co2/{date}/` endpoint.  
  - Configuration:  
    - URL: Template string with date path parameter: `https://api.carbondoomsday.com/api/co2/{{ $fromAI('date', 'Date', 'string') }}/`  
    - Method: GET  
    - Authentication: Generic HTTP Header Authentication (via credentials)  
    - Path Parameter: `date` (required) dynamically filled via AI expression `$fromAI()`  
    - Tool Description: Same as above, includes data source info and usage notes  
  - Input: From MCP Trigger node when "Get CO2 Measurement by Date" tool is invoked  
  - Output: Raw JSON response from API routed back to AI agent  
  - Edge Cases:  
    - Missing or invalid date format causes API errors (likely 404 or 400)  
    - Authentication failures  
    - Network issues or timeouts  

---

### 3. Summary Table

| Node Name                 | Node Type                         | Functional Role                              | Input Node(s)                | Output Node(s)                      | Sticky Note                                                                                                              |
|---------------------------|----------------------------------|----------------------------------------------|------------------------------|-----------------------------------|--------------------------------------------------------------------------------------------------------------------------|
| Setup Instructions        | Sticky Note                      | Setup and usage instructions                  | None                         | None                              | Contains detailed setup steps, usage notes, customization tips, and support links (Discord, n8n docs)                     |
| Workflow Overview         | Sticky Note                      | High-level workflow and operation overview   | None                         | None                              | Describes the workflow purpose, MCP trigger role, AI parameter usage, and available CO2 operations                       |
| Sticky Note (Co2)         | Sticky Note                      | Visual label for CO2 nodes                     | None                         | None                              | Label grouping CO2 related HTTP request nodes                                                                             |
| CarbonDoomsDay MCP Server | MCP Trigger                     | Webhook endpoint for AI agents                | External HTTP request        | List CO2 Measurements, Get CO2 Measurement by Date | Sets up webhook at `/carbondoomsday-mcp` for AI agent requests                                                            |
| List CO2 Measurements     | HTTP Request Tool               | List CO2 data with optional filters/pagination | CarbonDoomsDay MCP Server    | CarbonDoomsDay MCP Server          | Queries CO2 API `/api/co2/` with dynamic AI-driven query parameters                                                       |
| Get CO2 Measurement by Date | HTTP Request Tool             | Get CO2 data for a specific date              | CarbonDoomsDay MCP Server    | CarbonDoomsDay MCP Server          | Queries CO2 API `/api/co2/{date}/` with AI-supplied date path parameter                                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Sticky Notes for Documentation**  
   - Add a sticky note named **"Setup Instructions"** with detailed setup, usage, customization, and help content as described above. Use color index 4 and height ~1060.  
   - Add a sticky note named **"Workflow Overview"** describing the workflow purpose, MCP server role, AI parameter usage, and list of operations. Configure width ~420 and height ~920.  
   - Add a smaller sticky note named **"Co2"** as a visual label near the CO2 API nodes.

2. **Add MCP Trigger Node**  
   - Create a node of type **MCP Trigger** (`@n8n/n8n-nodes-langchain.mcpTrigger`).  
   - Set the webhook path to `"carbondoomsday-mcp"`.  
   - No authentication is set here; ensure the webhook is public or secured externally.  
   - Position centrally for clarity.

3. **Create HTTP Request Tool Node: "List CO2 Measurements"**  
   - Node Type: HTTP Request Tool (`n8n-nodes-base.httpRequestTool`).  
   - Configure URL: `"https://api.carbondoomsday.com/api/co2/"`.  
   - Method: GET (default).  
   - Authentication: Use Generic Credential with HTTP Header Auth configured.  
     - Set up credentials separately with necessary API keys or tokens if required by CarbonDoomsDay API.  
   - Query Parameters: Add keys with values set as expressions to `$fromAI()` calls:  
     - `ppm`: `{{$fromAI('ppm', 'Ppm', 'number')}}`  
     - `date`: `{{$fromAI('date', 'Date', 'string')}}`  
     - `date__range`: `{{$fromAI('date__range', 'Multiple values may be separated by commas.', 'string')}}`  
     - `ordering`: `{{$fromAI('ordering', 'Which field to use when ordering the results.', 'string')}}`  
     - `page`: `{{$fromAI('page', 'A page number within the paginated result set.', 'number')}}`  
     - `limit`: `{{$fromAI('limit', 'Number of results to return per page.', 'number')}}`  
   - Add descriptive tool description as in original for maintainability.

4. **Create HTTP Request Tool Node: "Get CO2 Measurement by Date"**  
   - Node Type: HTTP Request Tool (`n8n-nodes-base.httpRequestTool`).  
   - Configure URL with path parameter: `"https://api.carbondoomsday.com/api/co2/{{$fromAI('date', 'Date', 'string')}}/"`  
   - Method: GET.  
   - Authentication: Use same Generic Credential type as above.  
   - Add descriptive tool description identical to the above node.

5. **Connect Nodes**  
   - Connect the **MCP Trigger** node's output to the input of both HTTP Request nodes via `ai_tool` connection type. This allows MCP to route requests to either operation.  
   - Ensure MCP Trigger is configured to invoke the correct HTTP Request node based on the AI agent’s selected operation.

6. **Credential Setup**  
   - Create Generic Credential for HTTP Header Authentication with the necessary headers (e.g., API key).  
   - Assign credentials to both HTTP Request Tool nodes.

7. **Workflow Activation**  
   - Save and activate the workflow.  
   - Copy the webhook URL from the MCP Trigger node (e.g., `https://your-n8n-instance/webhook/carbondoomsday-mcp`).  
   - Provide this URL to your AI agents for API requests.

8. **Optional Customizations**  
   - Implement error handling nodes if desired (e.g., try/catch, error workflows).  
   - Add logging or monitoring nodes for audit trails.  
   - Add data transformation nodes if you want to reshape the API responses before returning them.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                         | Context or Link                                                                                                           |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------|
| The CarbonDoomsDay API provides CO2 measurements from Mauna Loa observatory, with data dating back to 1958. Data sources include NOAA and Scripps datasets.                     | See [Mauna Loa Data Sources](https://www.esrl.noaa.gov/gmd/webdata/ccgg/trends/co2_mlo_weekly.csv) and related links.      |
| The workflow uses `$fromAI()` expressions to dynamically populate API parameters based on AI agent input, enabling seamless integration.                                           | n8n MCP node and AI integration functionality.                                                                            |
| For support or custom automation help, join the Discord community at https://discord.me/cfomodz and refer to n8n tool MCP documentation at https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.toolmcp/ | Community and documentation links for advanced usage and troubleshooting.                                                 |

---

**Disclaimer:**  
The content provided is generated exclusively from an automated n8n workflow. It complies strictly with all relevant content policies and contains no illegal, offensive, or protected elements. All data handled is legal and publicly available.