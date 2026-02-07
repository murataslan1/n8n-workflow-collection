Access Complete Vehicle Data with Marketcheck APIs for AI Agents

https://n8nworkflows.xyz/workflows/access-complete-vehicle-data-with-marketcheck-apis-for-ai-agents-5527


# Access Complete Vehicle Data with Marketcheck APIs for AI Agents

### 1. Workflow Overview

This workflow, titled **"Access Complete Vehicle Data with Marketcheck APIs for AI Agents"**, serves as an advanced MCP (Modular Connector Platform) server interface that exposes **71 distinct Marketcheck API endpoints** for retrieving comprehensive vehicle-related data. It is designed primarily for AI agents that require detailed and structured access to vehicle market data across various vehicle types and verticals.

The workflow is logically divided into the following blocks:

- **1.1 MCP Server Setup and Instructions:** Contains the main MCP trigger node, setup instructions, and warnings for advanced users.
- **1.2 Car Search Operations:** Endpoints related to car listings, including active inventory, auction listings, and detailed listing attributes.
- **1.3 Recall Search:** Endpoint for vehicle recall information by VIN.
- **1.4 Client Filters:** Endpoints to get and set client-side filters for country-based data segmentation.
- **1.5 CRM Cleanse API:** Endpoint for CRM validation or cleansing based on VIN.
- **1.6 Dealer API:** Endpoints to retrieve dealer information and find dealers by various categories.
- **1.7 VIN Decoder API:** Endpoints for decoding VINs using different services and related taxonomy lookups.
- **1.8 Cars History API:** Endpoints to fetch historical listing data for vehicles.
- **1.9 Car Cached Image:** Endpoint to fetch cached images of vehicle listings.
- **1.10 Heavy Equipment Search:** Endpoints related to heavy equipment listings and details.
- **1.11 Motorcycle Search:** Endpoints for motorcycle listings and details.
- **1.12 RV (Recreational Vehicle) Search:** Endpoints for RV listings and details.
- **1.13 Cars Market API:** Market data for cars including popular models, price prediction, sales count, and stats.
- **1.14 Rank Car Listings:** Endpoints to compute relative rankings of car listings.
- **1.15 OEM Incentive Search:** Endpoint for searching OEM incentives and offers.

Each block groups closely related API endpoints that serve specific vehicle data retrieval or management functions.

---

### 2. Block-by-Block Analysis

#### 1.1 MCP Server Setup and Instructions

- **Overview:**  
  Provides the entry point for AI clients via the MCP trigger, along with user guidance, warnings, and workflow overview notes.
  
- **Nodes Involved:**  
  - Marketcheck APIs MCP Server (MCP Trigger)  
  - Advanced Warning (Sticky Note)  
  - Setup Instructions (Sticky Note)  
  - Workflow Overview (Sticky Note)  
  
- **Node Details:**  
  - **Marketcheck APIs MCP Server**  
    - *Type:* MCP Trigger  
    - *Role:* Receives AI agent requests and routes them to the appropriate HTTP request nodes.  
    - *Configuration:* Path set to `marketcheck-apis-mcp`.  
    - *Connections:* All HTTP Request nodes connect to it as an AI tool provider.  
    - *Failures:* Network issues or incorrect webhook URL can cause failures.
  
  - **Advanced Warning**  
    - *Type:* Sticky Note  
    - *Role:* Warns users that this workflow is for advanced users due to its size (71 tools). Recommends selective enabling of tools to optimize performance.  
    - *Content Highlights:*  
      - Maximum recommended 40 tools enabled for performance.  
      - Suggestion to disable/delete unused nodes before adding to clients.  
      - Link to Discord for professional assistance: https://discord.me/cfomodz.
  
  - **Setup Instructions**  
    - *Type:* Sticky Note  
    - *Role:* Provides stepwise instructions to import, configure, activate, and connect AI clients to the MCP server.  
    - *Key Points:*  
      - Use `$fromAI()` expressions for parameter population.  
      - Responses retain original API structure.  
      - Suggest adding transformation, error handling, and logging nodes as needed.  
      - Credential setup required for basic authentication.  
      - Link to n8n docs for MCP node: https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.toolmcp/
  
  - **Workflow Overview**  
    - *Type:* Sticky Note  
    - *Role:* Summarizes the workflow purpose, main components, and lists all 71 API operations grouped by vehicle data verticals.

---

#### 1.2 Car Search Operations

- **Overview:**  
  Provides multiple HTTP request nodes to fetch car listings by various criteria including active inventory, auctions, private party sales, UK listings, and detailed listing attributes including media and long text descriptions.
  
- **Nodes Involved:**  
  - Get dealers active inventory  
  - Listing by id (various types: auction, fsbo, uk, generic)  
  - Long text Listings attributes (auction, fsbo, uk, generic)  
  - Listing media by id (auction, fsbo, uk, generic)  
  - Gets active car listings (general, auction, private party, UK)  
  - Recent car listings (general, UK)  
  - API for auto-completion of inputs (car search)
  
- **Node Details (example):**  
  - **Get dealers active inventory**  
    - *Type:* HTTP Request Tool  
    - *Role:* Retrieves currently active dealer car inventory.  
    - *URL:* `https://marketcheck-prod.apigee.net/v2/car/dealer/inventory/active`  
    - *Authentication:* HTTP Header Auth with generic credentials.  
    - *Parameters:* Populated dynamically using `$fromAI()` expressions.  
    - *Failure Modes:* Auth failure, invalid query params, API rate limiting.  
  
  - **Listing by id** (Auction, FSBO, UK, Generic)  
    - *Type:* HTTP Request Tool  
    - *Role:* Fetches specific car listing details by ID from different listing types.  
    - *URL Pattern:* Varies by listing type, e.g., `/listing/car/auction/{id}`.  
    - *Parameters:* `id` path variable filled by AI input.  
    - *Failure Modes:* Invalid ID, no results, timeout.  
  
  - **Gets active car listings for the given search criteria**  
    - *Type:* HTTP Request Tool  
    - *Role:* Returns active car listings matching AI-supplied search criteria.  
    - *URL:* `/search/car/active`  
    - *Failures:* Incorrect filters, empty results.  
  
  - **API for auto-completion of inputs**  
    - *Role:* Supports AI agents with autocomplete suggestions for input fields.  
    - *Parameters:* `field`, `input`, and optional flags for case sensitivity, term counts, sorting, and seller type.  
  
- **Connections:**  
  All these HTTP Request nodes are connected to the MCP trigger as AI tools, enabling AI clients to invoke these endpoints dynamically.

---

#### 1.3 Recall Search

- **Overview:**  
  Provides recall information for a vehicle identified by its VIN.
  
- **Nodes Involved:**  
  - Recall info by vin  
  - Recall Search (Sticky Note)
  
- **Node Details:**  
  - **Recall info by vin**  
    - *Type:* HTTP Request Tool  
    - *Role:* Fetches recall information for a vehicle VIN.  
    - *URL:* `/car/recall/{vin}`  
    - *Parameters:* Optional page number for paginated recall results.  
    - *Failures:* Invalid VIN, no recall data found.  
  
---

#### 1.4 Client Filters

- **Overview:**  
  Enables fetching and setting client configuration filters, primarily country-based.
  
- **Nodes Involved:**  
  - get client filters  
  - set client filters  
  - Client Filters (Sticky Note)
  
- **Node Details:**  
  - **get client filters**  
    - *Type:* HTTP Request Tool  
    - *Role:* Returns current client filters for a specified country.  
    - *URL:* `/client/configure/get`  
    - *Parameters:* Country (required).  
  
  - **set client filters**  
    - *Type:* HTTP Request Tool (POST)  
    - *Role:* Sets client filters for country-based filtering.  
    - *URL:* `/client/configure/set`  
    - *Parameters:* Country (required).  
  
- **Failure Modes:**  
  Invalid country code, auth failures.

---

#### 1.5 CRM Cleanse API

- **Overview:**  
  Performs CRM validation of a vehicle based on its VIN and sale date.
  
- **Nodes Involved:**  
  - CRM check of a particular vin  
  - Crm Cleanse Api (Sticky Note)
  
- **Node Details:**  
  - **CRM check of a particular vin**  
    - *Type:* HTTP Request Tool  
    - *Role:* Checks CRM status for a VIN after a specified sale date.  
    - *URL:* `/crm_check/car/{vin}`  
    - *Parameters:* Sale date required, format YYYYMMDD.  
    - *Failure Modes:* Incorrect date format, invalid VIN.

---

#### 1.6 Dealer API

- **Overview:**  
  Provides detailed dealer information and the ability to find dealers by categories and location.
  
- **Nodes Involved:**  
  - Dealer by id (multiple types: car UK, car generic, heavy equipment, motorcycle, RV)  
  - Find car dealers around (multiple categories)  
  - Dealer Api (Sticky Note)
  
- **Node Details:**  
  - **Dealer by id** (various)  
    - *Role:* Fetches detailed dealer info by dealer ID, optionally including provider name.  
    - *URL:* Varies by category, e.g., `/dealer/car/uk/{id}`.  
    - *Parameters:* `id` (required), `provider` (optional boolean).  
  
  - **Find car dealers around** (various)  
    - *Role:* Finds dealers around a location or category, with optional filters like county, postal code, and provider inclusion.  
    - *URL:* Varies by category, e.g., `/dealers/car/uk`.  
  
- **Failures:**  
  Invalid dealer ID, missing location parameters, unauthorized access.

---

#### 1.7 VIN Decoder API

- **Overview:**  
  Provides decoding of VIN numbers using multiple services plus taxonomy-based auto-completion and term fetching.
  
- **Nodes Involved:**  
  - EPI VIN Decoder  
  - NeoVIN Decoder  
  - VIN Decoder (generic)  
  - API for auto-completion of inputs based on taxonomy  
  - API for getting terms from taxonomy  
  - Vin Decoder Api (Sticky Note)
  
- **Node Details:**  
  - **EPI VIN Decoder**  
    - *URL:* `/decode/car/epi/{vin}/specs`  
  - **NeoVIN Decoder**  
    - *URL:* `/decode/car/neovin/{vin}/specs`  
    - *Parameters:* `include_generic`, `force_decode` optional booleans.  
  - **VIN Decoder**  
    - *URL:* `/decode/car/{vin}/specs`  
    - *Parameters:* VIN must be valid 17 characters.  
  - **Auto-completion and Terms API**  
    - For assisting AI input with taxonomy-based suggestions and term lists.
  
- **Failures:**  
  Invalid or malformed VIN, API rate limits.

---

#### 1.8 Cars History API

- **Overview:**  
  Retrieves historical listing data for cars based on VRM (vehicle registration mark) or VIN.
  
- **Nodes Involved:**  
  - Get a cars online listing history (by UK VRM)  
  - Get a cars online listing history 1 (by VIN)  
  - Cars History Api (Sticky Note)
  
- **Node Details:**  
  - Parameters include page number and flags to include duplicate records.  
  - Failure modes include invalid VRM/VIN or empty history.

---

#### 1.9 Car Cached Image

- **Overview:**  
  Fetches cached images associated with a specific listing and image ID.
  
- **Nodes Involved:**  
  - Fetch cached image  
  - Car Cached Image (Sticky Note)
  
- **Node Details:**  
  - URL includes `listingID` and `imageID`.  
  - Failures include missing or invalid IDs.

---

#### 1.10 Heavy Equipment Search

- **Overview:**  
  Provides multiple endpoints for heavy equipment listings, details, media, active search, and auto-completion.
  
- **Nodes Involved:**  
  - Heavy equipment listing by id  
  - Long text Heavy equipment listings attributes  
  - Listing media by id (heavy equipment)  
  - Gets active heavy equipment listings  
  - API for auto-completion of inputs (heavy equipment)  
  - Heavy Equipment Search (Sticky Note)
  
- **Failures:**  
  Invalid IDs, empty search results.

---

#### 1.11 Motorcycle Search

- **Overview:**  
  Multiple endpoints for motorcycle listing retrieval, details, media, active listings, and auto-completion.
  
- **Nodes Involved:**  
  - Motorcycle listing by id  
  - Long text Motorcycle listings attributes  
  - Motorcycle listing media by id  
  - Gets active motorcycle listings  
  - API for auto-completion of inputs (motorcycle)  
  - Motorcycle Search (Sticky Note)
  
- **Failures:**  
  Invalid parameters or IDs.

---

#### 1.12 RV Search

- **Overview:**  
  Endpoints to retrieve RV listings by ID, long text attributes, media, active listings, and auto-completion.
  
- **Nodes Involved:**  
  - RV listing by id (UK and generic)  
  - Long text RV listings attributes (UK and generic)  
  - Listing media by id (UK and generic)  
  - Gets active RV listings (general and UK)  
  - API for auto-completion of inputs (RV)  
  - Rv Search (Sticky Note)
  
- **Failures:**  
  Invalid IDs, empty responses.

---

#### 1.13 Cars Market API

- **Overview:**  
  Provides market data endpoints including market days supply, popular cars, price prediction (US and UK), sales count, and stats.
  
- **Nodes Involved:**  
  - Market Days Supply  
  - Get make model wise top 50 popular cars  
  - Predict car price (US and UK)  
  - Predict fare value of car for UK  
  - Get sales count by make, model, year, trim, or taxonomy VIN  
  - Price, Miles and Days on Market stats  
  - Cars Market Api (Sticky Note)
  
- **Failures:**  
  Incorrect or missing required parameters, invalid VINs, API limits.

---

#### 1.14 Rank Car Listings

- **Overview:**  
  Endpoints to compute relative ranking of car listings.
  
- **Nodes Involved:**  
  - Compute relative rank for car listings  
  - Compute relative rank for car listings 1  
  - Rank Car Listings (Sticky Note)
  
- **Failures:**  
  Invalid page numbers, empty or no results.

---

#### 1.15 OEM Incentive Search

- **Overview:**  
  Retrieves OEM incentive listings filtered by various financial and offer parameters.
  
- **Nodes Involved:**  
  - Gets oem incentive listings  
  - Oem Incentive Search (Sticky Note)
  
- **Failures:**  
  Invalid filter parameters, empty results.

---

### 3. Summary Table

| Node Name                                 | Node Type               | Functional Role                          | Input Node(s)              | Output Node(s)             | Sticky Note                                                                                       |
|-------------------------------------------|-------------------------|----------------------------------------|----------------------------|----------------------------|-------------------------------------------------------------------------------------------------|
| Advanced Warning                          | Sticky Note             | Workflow usage warning and recommendations |                            |                            | ⚠️ ADVANCED USE ONLY. This workflow has 71 operations; recommended to selectively enable tools. |
| Setup Instructions                        | Sticky Note             | Setup guidance for users                |                            |                            | Setup instructions with credential and connection details. Link: https://discord.me/cfomodz     |
| Workflow Overview                         | Sticky Note             | Describes workflow purpose and API groups |                            |                            | Overview of 71 Marketcheck APIs grouped by vehicle data verticals.                              |
| Marketcheck APIs MCP Server               | MCP Trigger             | Main MCP server receiving AI requests  |                            | All HTTP Request nodes     |                                                                                                 |
| Sticky Note (Car Search)                  | Sticky Note             | Label for car search related nodes      |                            |                            | ## Car Search                                                                                   |
| Get dealers active inventory              | HTTP Request Tool       | Retrieve active dealer car inventory    | MCP Trigger                |                            |                                                                                                 |
| Listing by id                             | HTTP Request Tool       | Retrieve auction car listing by ID      | MCP Trigger                |                            |                                                                                                 |
| Long text Listings attributes for Listing| HTTP Request Tool       | Retrieve extended car listing details   | MCP Trigger                |                            |                                                                                                 |
| Listing media by id                       | HTTP Request Tool       | Retrieve car listing media               | MCP Trigger                |                            |                                                                                                 |
| Listing by id 1                           | HTTP Request Tool       | Retrieve FSBO car listing by ID          | MCP Trigger                |                            |                                                                                                 |
| Long text Listings attributes for Listing 1| HTTP Request Tool     | Retrieve extended FSBO car listing details| MCP Trigger              |                            |                                                                                                 |
| Listing media by id 1                     | HTTP Request Tool       | Retrieve FSBO car listing media          | MCP Trigger                |                            |                                                                                                 |
| Listing by id 2                           | HTTP Request Tool       | Retrieve UK car listing by ID            | MCP Trigger                |                            |                                                                                                 |
| Long text Listings attributes for Listing 2| HTTP Request Tool     | Retrieve extended UK car listing details | MCP Trigger                |                            |                                                                                                 |
| Listing media by id 2                     | HTTP Request Tool       | Retrieve UK car listing media            | MCP Trigger                |                            |                                                                                                 |
| Listing by id 3                           | HTTP Request Tool       | Retrieve generic car listing by ID       | MCP Trigger                |                            |                                                                                                 |
| Long text Listings attributes for Listing 3| HTTP Request Tool     | Retrieve extended generic car listing details| MCP Trigger              |                            |                                                                                                 |
| Listing media by id 3                     | HTTP Request Tool       | Retrieve generic car listing media       | MCP Trigger                |                            |                                                                                                 |
| Gets active car listings for the given search crit| HTTP Request Tool | Search active car listings by criteria   | MCP Trigger                |                            |                                                                                                 |
| Gets active auction car listings for the given search crit| HTTP Request Tool| Search active auction car listings       | MCP Trigger                |                            |                                                                                                 |
| API for auto-completion of inputs        | HTTP Request Tool       | Provides autocomplete for car search inputs | MCP Trigger            |                            |                                                                                                 |
| Gets active private party car listings for the given search crit| HTTP Request Tool| Search active private party car listings | MCP Trigger                |                            |                                                                                                 |
| Gets Recent car listings for the given search crit| HTTP Request Tool | Fetch recent car listings                 | MCP Trigger                |                            |                                                                                                 |
| Gets active car listings in UK for the given search crit| HTTP Request Tool | UK specific active car listings           | MCP Trigger                |                            |                                                                                                 |
| Gets Recent UK car listings for the given search crit| HTTP Request Tool | UK recent car listings                     | MCP Trigger                |                            |                                                                                                 |
| Sticky Note2                             | Sticky Note             | Label for recall search nodes             |                            |                            | ## Recall Search                                                                               |
| Recall info by vin                       | HTTP Request Tool       | Fetch recall info by VIN                   | MCP Trigger                |                            |                                                                                                 |
| Sticky Note3                             | Sticky Note             | Label for client filter nodes              |                            |                            | ## Client Filters                                                                             |
| get client filters                      | HTTP Request Tool       | Get client filter configuration            | MCP Trigger                |                            |                                                                                                 |
| set client filters                      | HTTP Request Tool       | Set client filter configuration            | MCP Trigger                |                            |                                                                                                 |
| Sticky Note4                             | Sticky Note             | Label for CRM cleanse API                   |                            |                            | ## Crm Cleanse Api                                                                           |
| CRM check of a particular vin           | HTTP Request Tool       | CRM cleanse check by VIN                    | MCP Trigger                |                            |                                                                                                 |
| Sticky Note5                             | Sticky Note             | Label for dealer API nodes                   |                            |                            | ## Dealer Api                                                                               |
| Dealer by id (multiple variants)        | HTTP Request Tool       | Retrieve dealer info by ID for various categories | MCP Trigger            |                            |                                                                                                 |
| Find car dealers around (multiple variants)| HTTP Request Tool    | Find dealers in different vehicle categories | MCP Trigger            |                            |                                                                                                 |
| Sticky Note6                             | Sticky Note             | Label for VIN decoder API nodes              |                            |                            | ## Vin Decoder Api                                                                         |
| EPI VIN Decoder                         | HTTP Request Tool       | Decode VIN using EPI service                  | MCP Trigger                |                            |                                                                                                 |
| NeoVIN Decoder                         | HTTP Request Tool       | Decode VIN using NeoVIN service               | MCP Trigger                |                            |                                                                                                 |
| VIN Decoder                            | HTTP Request Tool       | Generic VIN decode endpoint                    | MCP Trigger                |                            |                                                                                                 |
| API for auto-completion of inputs based on taxonomy | HTTP Request Tool | Autocomplete for VIN taxonomy fields          | MCP Trigger                |                            |                                                                                                 |
| API for getting terms from taxonomy     | HTTP Request Tool       | Fetch taxonomy terms list                      | MCP Trigger                |                            |                                                                                                 |
| Sticky Note7                             | Sticky Note             | Label for cars history API nodes              |                            |                            | ## Cars History Api                                                                       |
| Get a cars online listing history       | HTTP Request Tool       | Get vehicle history by UK VRM                   | MCP Trigger                |                            |                                                                                                 |
| Get a cars online listing history 1     | HTTP Request Tool       | Get vehicle history by VIN                        | MCP Trigger                |                            |                                                                                                 |
| Sticky Note8                             | Sticky Note             | Label for car cached image node                 |                            |                            | ## Car Cached Image                                                                       |
| Fetch cached image                      | HTTP Request Tool       | Fetch cached image by listing and image ID         | MCP Trigger                |                            |                                                                                                 |
| Sticky Note9                             | Sticky Note             | Label for heavy equipment search nodes           |                            |                            | ## Heavy Equipment Search                                                                |
| Heavy equipment listing by id           | HTTP Request Tool       | Get heavy equipment listing by ID                  | MCP Trigger                |                            |                                                                                                 |
| Long text Heavy equipment Listings attributes for | HTTP Request Tool | Get extended heavy equipment listing attributes     | MCP Trigger                |                            |                                                                                                 |
| Listing media by id 4                   | HTTP Request Tool       | Get heavy equipment listing media                    | MCP Trigger                |                            |                                                                                                 |
| Gets active heavy equipment listings for the given | HTTP Request Tool  | Search active heavy equipment listings               | MCP Trigger                |                            |                                                                                                 |
| API for auto-completion of inputs 1    | HTTP Request Tool       | Autocomplete for heavy equipment inputs             | MCP Trigger                |                            |                                                                                                 |
| Sticky Note10                            | Sticky Note             | Label for motorcycle search nodes                   |                            |                            | ## Motorcycle Search                                                                   |
| Motorcycle listing by id                | HTTP Request Tool       | Get motorcycle listing by ID                           | MCP Trigger                |                            |                                                                                                 |
| Long text Motorcycle Listings attributes for Listi| HTTP Request Tool | Get extended motorcycle listing attributes             | MCP Trigger                |                            |                                                                                                 |
| Motorcycle listing media by id          | HTTP Request Tool       | Get motorcycle listing media                            | MCP Trigger                |                            |                                                                                                 |
| Gets active motorcycle listings for the given sear| HTTP Request Tool | Search active motorcycle listings                        | MCP Trigger                |                            |                                                                                                 |
| API for auto-completion of inputs 2    | HTTP Request Tool       | Autocomplete for motorcycle inputs                      | MCP Trigger                |                            |                                                                                                 |
| Sticky Note11                            | Sticky Note             | Label for RV search nodes                                |                            |                            | ## Rv Search                                                                        |
| RV listing by id                       | HTTP Request Tool       | Get RV listing by ID (UK and generic)                     | MCP Trigger                |                            |                                                                                                 |
| Long text RV Listings attributes for Listing with | HTTP Request Tool | Get extended RV listing attributes (UK and generic)       | MCP Trigger                |                            |                                                                                                 |
| Listing media by id 5 and 6            | HTTP Request Tool       | Get RV listing media (UK and generic)                      | MCP Trigger                |                            |                                                                                                 |
| Gets active RV listings for the given search crite| HTTP Request Tool | Search active RV listings (general and UK)                 | MCP Trigger                |                            |                                                                                                 |
| API for auto-completion of inputs 3    | HTTP Request Tool       | Autocomplete for RV inputs                                   | MCP Trigger                |                            |                                                                                                 |
| Gets active RV listings for the given search crite 1| HTTP Request Tool| Search active UK RV listings                                  | MCP Trigger                |                            |                                                                                                 |
| Long text Listings attributes for Listing with the 1, 2, 3, and Long text RV Listings attributes for Listing with 1 | HTTP Request Tool | Extended listings attributes for various listing types      | MCP Trigger                |                            |                                                                                                 |
| Sticky Note12                           | Sticky Note             | Label for cars market API nodes                              |                            |                            | ## Cars Market Api                                                                   |
| Market Days Supply                     | HTTP Request Tool       | Get market days supply data for cars                          | MCP Trigger                |                            |                                                                                                 |
| Get make model wise top 50 popular cars on nationa| HTTP Request Tool | Get popular car counts nationally and regionally               | MCP Trigger                |                            |                                                                                                 |
| Predict car price based on it's specifications| HTTP Request Tool | Predict car price (US market)                                   | MCP Trigger                |                            |                                                                                                 |
| Predict fare value of car for UK based on YMMT & m| HTTP Request Tool | Predict UK car fair market value                               | MCP Trigger                |                            |                                                                                                 |
| Predict car price for UK based on it's specificati| HTTP Request Tool | Predict UK car price based on detailed specs                    | MCP Trigger                |                            |                                                                                                 |
| Get sales count by make, model, year, trim or taxo| HTTP Request Tool | Get sales count for cars by various filters                      | MCP Trigger                |                            |                                                                                                 |
| Price, Miles and Days on Market stats  | HTTP Request Tool       | Get price, mileage, and days on market statistics               | MCP Trigger                |                            |                                                                                                 |
| Sticky Note13                          | Sticky Note             | Label for rank car listings nodes                              |                            |                            | ## Rank Car Listings                                                               |
| Compute relative rank for car listings.| HTTP Request Tool       | Compute relative ranking for car listings                       | MCP Trigger                |                            |                                                                                                 |
| Compute relative rank for car listings. 1| HTTP Request Tool     | Alternative endpoint for computing relative ranking             | MCP Trigger                |                            |                                                                                                 |
| Sticky Note14                         | Sticky Note             | Label for OEM incentive search nodes                           |                            |                            | ## Oem Incentive Search                                                           |
| Gets oem incentive listings for the given search c| HTTP Request Tool | Retrieve OEM incentive listings by various financial filters      | MCP Trigger                |                            |                                                                                                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create MCP Trigger Node**:  
   - Node Type: `@n8n/n8n-nodes-langchain.mcpTrigger`  
   - Set the path parameter to `marketcheck-apis-mcp`.  
   - This node will serve as the entry point for AI agent requests.

2. **Add Sticky Notes for Documentation**:  
   - Add sticky notes for "Advanced Warning", "Setup Instructions", "Workflow Overview", and each major API category (Car Search, Recall Search, etc.) to document the workflow clearly.

3. **Configure HTTP Request Nodes for Each API Endpoint**:  
   For each Marketcheck API endpoint:  
   - Node Type: `HTTP Request Tool`  
   - Set the URL to the corresponding Marketcheck API endpoint (e.g., `https://marketcheck-prod.apigee.net/v2/car/dealer/inventory/active`).  
   - Set HTTP Method (default GET, POST where specified).  
   - For endpoints requiring path parameters, use expressions like `={{ $fromAI('paramName') }}` to dynamically insert parameter values.  
   - For query parameters, use the `queryParameters` object with the same `$fromAI()` expressions.  
   - Set authentication using a generic HTTP Header Auth credential with Marketcheck API key.  
   - Add tool description matching the API endpoint’s purpose.

4. **Connect All HTTP Request Nodes to the MCP Trigger Node**:  
   - Set each HTTP Request Tool node’s "ai_tool" input connection from the MCP trigger node. This exposes each API call as a selectable tool for AI agents.

5. **Parameter Setup**:  
   - Ensure all parameters use `$fromAI()` expressions for dynamic input by AI.  
   - Define required and optional parameters per endpoint based on the Marketcheck API documentation.

6. **Credential Configuration**:  
   - Create a generic HTTP Header Auth credential in n8n for Marketcheck API with the required API key header.  
   - Assign this credential to all HTTP Request Tool nodes.

7. **Performance Optimization (Optional)**:  
   - Disable or delete unused nodes based on your intended use case to keep the enabled tools under 40.  
   - Group related endpoints for easier management.

8. **Activate Workflow**:  
   - Activate the workflow to expose the MCP server for AI agents.

9. **Test the MCP Endpoint**:  
   - Copy the webhook URL from the MCP trigger node.  
   - Configure your AI agent to use this URL with the appropriate request format.

---

### 5. General Notes & Resources

| Note Content                                                                                                                  | Context or Link                                                                                             |
|-------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| This workflow contains 71 Marketcheck API operations, which is more than the recommended maximum of 40 for AI clients.          | Advanced usage warning, selective enabling recommended. Discord: https://discord.me/cfomodz               |
| Setup instructions emphasize basic credential setup, activating the workflow, and connecting AI agents with the MCP endpoint. | Setup guide with links to n8n MCP documentation: https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.toolmcp/ |
| Responses maintain original API structure; users may customize by adding transformation, error handling, or logging nodes.    | Customization recommendations.                                                                              |
| For questions or professional integration assistance, ping the author on Discord.                                              | https://discord.me/cfomodz                                                                                  |

---

This document provides a complete, structured reference to the **Marketcheck APIs MCP Server** workflow, enabling advanced users or AI agents to understand, reproduce, and customize it effectively.