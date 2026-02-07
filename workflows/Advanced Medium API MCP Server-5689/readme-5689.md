Advanced Medium API MCP Server

https://n8nworkflows.xyz/workflows/advanced-medium-api-mcp-server-5689


# Advanced Medium API MCP Server

---
### 1. Workflow Overview

**Purpose:**  
The "Advanced Medium API MCP Server" workflow serves as a comprehensive API interface for interacting with Medium's platform data through the Medium Content Platform (MCP). It acts as a backend server that listens for API requests via an MCP trigger and routes these requests to various HTTP request nodes that call specific Medium API endpoints. This enables retrieval of detailed information about articles, users, lists, publications, tags, and more from Medium's ecosystem.

**Target Use Cases:**  
- Providing an API backend for Medium-related data queries.  
- Aggregating various Medium data points such as article contents, user profiles, publication details, and search results.  
- Supporting applications or services that require granular Medium data via a single consolidated API endpoint.

**Logical Blocks:**

- **1.1 Input Reception:** Receives and triggers the workflow upon API calls via the MCP trigger node.
- **1.2 Article Data Retrieval:** Fetches various details related to Medium articles such as content, fans, markdown, related articles, and responses.
- **1.3 Post and Tag Data Retrieval:** Retrieves latest posts, related tags, top writers, and top feeds.
- **1.4 List Data Retrieval:** Manages fetching details, articles, and responses related to Medium lists.
- **1.5 Publication Data Retrieval:** Obtains publication ID, details, articles, and newsletter information.
- **1.6 Search Functionality:** Executes search queries for articles, lists, publications, tags, and users.
- **1.7 User Data Retrieval:** Gathers extensive user information including ID, details, articles, followers, following, interests, lists, publications, and top articles.
- **1.8 Documentation and Instructional Notes:** Sticky notes scattered around provide setup instructions, workflow overview, and warnings.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block is the entry point of the workflow, triggering execution when the Medium MCP API receives a request.

- **Nodes Involved:**  
  - Medium MCP Server

- **Node Details:**

  - **Medium MCP Server**  
    - *Type:* MCP Trigger (specialized node from LangChain MCP integration)  
    - *Role:* Listens for incoming MCP API requests and routes them into the workflow.  
    - *Configuration:* No explicit parameters configured; uses a webhook identified by its unique ID.  
    - *Inputs:* External API requests via webhook.  
    - *Outputs:* Routes requests to all subsequent HTTP request nodes.  
    - *Version Requirements:* Requires LangChain MCP integration compatibility.  
    - *Potential Failures:* Webhook downtime, malformed requests, authorization failures if any security is enforced externally.  
    - *Sub-workflow:* None.

#### 1.2 Article Data Retrieval

- **Overview:**  
  Retrieves detailed information about Medium articles including metadata, content, fans, markdown formatting, related articles, and responses.

- **Nodes Involved:**  
  - Get Welcome Message  
  - Get Article Details  
  - Get Article Content  
  - Get Article Fans  
  - Get Article Markdown  
  - Get Related Articles  
  - Get Article Responses

- **Node Details:**

  - Each node is an **HTTP Request Tool** node configured to call specific Medium API endpoints related to articles.  
  - *Type:* HTTP Request (Tool mode)  
  - *Role:* Makes API calls to fetch specific article-related data.  
  - *Configuration:* Endpoints and HTTP methods are pre-configured (not visible in JSON). Likely use dynamic parameters from the incoming MCP request.  
  - *Inputs:* Output from Medium MCP Server node (filtered internally by MCP logic).  
  - *Outputs:* Data forwarded back to MCP Server for returning API response.  
  - *Expressions:* May use expressions to insert article IDs or other parameters dynamically.  
  - *Potential Failures:* HTTP errors (404 - article not found, 401 - unauthorized), rate limits, malformed parameters.  
  - *Sub-workflow:* None.

#### 1.3 Post and Tag Data Retrieval

- **Overview:**  
  Fetches latest posts, related tags, top writers, and top feeds from Medium to provide aggregated content lists and metadata.

- **Nodes Involved:**  
  - Get Latest Posts  
  - Get Related Tags  
  - Get Top Writers  
  - Get Top Feeds

- **Node Details:**

  - All are HTTP Request Tool nodes configured for Medium API endpoints serving post and tag data.  
  - *Role:* Retrieve lists and summaries relevant to content discovery and community insights.  
  - *Inputs:* MCP trigger node output.  
  - *Potential Failures:* Network issues, API rate limiting, incorrect query parameters.

#### 1.4 List Data Retrieval

- **Overview:**  
  Retrieves information related to Medium lists, including details of lists, articles within lists, and responses to those lists.

- **Nodes Involved:**  
  - Get List Details  
  - Get List Articles  
  - Get List Responses

- **Node Details:**

  - HTTP Request Tool nodes calling Medium endpoints related to lists.  
  - *Role:* Provide granular data on user-curated lists and their content.  
  - *Inputs:* MCP trigger outputs with relevant list identifiers.  
  - *Potential Failures:* Invalid list IDs, authorization errors, API downtime.

#### 1.5 Publication Data Retrieval

- **Overview:**  
  Obtains data on Medium publications including IDs, details, articles, and newsletters.

- **Nodes Involved:**  
  - Get Publication ID  
  - Get Publication Details  
  - Get Publication Articles  
  - Get Publication Newsletter

- **Node Details:**

  - HTTP Request Tool nodes targeting publication-related API endpoints.  
  - *Role:* Support querying publication metadata and content aggregation.  
  - *Inputs:* MCP trigger output with publication identifiers.  
  - *Potential Failures:* Nonexistent publication IDs, HTTP errors, API throttling.

#### 1.6 Search Functionality

- **Overview:**  
  Executes search queries across Medium’s ecosystem for articles, lists, publications, tags, and users.

- **Nodes Involved:**  
  - Search Articles  
  - Search Lists  
  - Search Publications  
  - Search Tags  
  - Search Users

- **Node Details:**

  - HTTP Request Tool nodes configured to call search endpoints.  
  - *Role:* Provide filtered and relevant search results for various Medium entities.  
  - *Inputs:* Search parameters from MCP API requests.  
  - *Potential Failures:* Malformed queries, excessive rate limits, timeout errors.

#### 1.7 User Data Retrieval

- **Overview:**  
  Retrieves comprehensive user-related data including IDs, profile details, articles, followers, following, interests, lists, publications, and top articles.

- **Nodes Involved:**  
  - Get User ID  
  - Get User Details  
  - Get User Articles  
  - Get User Followers  
  - Get User Following  
  - Get User Interests  
  - Get User Lists  
  - Get User Publications  
  - Get User Top Articles

- **Node Details:**

  - Each node is an HTTP Request Tool querying specific user endpoints.  
  - *Role:* Provide detailed user profile data to clients consuming the MCP API.  
  - *Inputs:* MCP API request parameters with user identifiers.  
  - *Potential Failures:* Invalid user IDs, permission errors, API limits.

#### 1.8 Documentation and Instructional Notes

- **Overview:**  
  Sticky notes are placed around the workflow providing setup instructions, general overview, and warnings.

- **Nodes Involved:**  
  - Advanced Warning  
  - Setup Instructions  
  - Workflow Overview  
  - Sticky Note (multiple unnamed with incremental numbers)

- **Node Details:**

  - *Type:* Sticky Note  
  - *Role:* Documentation and workflow annotation only; no data processing.  
  - *Content:* Mostly empty in exported JSON except for labels.  
  - *Potential Failures:* None (informational only).

---

### 3. Summary Table

| Node Name             | Node Type                  | Functional Role                  | Input Node(s)         | Output Node(s)        | Sticky Note                                   |
|-----------------------|----------------------------|--------------------------------|-----------------------|-----------------------|-----------------------------------------------|
| Advanced Warning      | Sticky Note                | Workflow warnings and cautions | None                  | None                  |                                               |
| Setup Instructions    | Sticky Note                | Instructions for setup          | None                  | None                  |                                               |
| Workflow Overview     | Sticky Note                | High-level workflow info        | None                  | None                  |                                               |
| Medium MCP Server     | MCP Trigger                | API request reception           | None                  | All HTTP Request nodes |                                               |
| Sticky Note           | Sticky Note                | Documentation                   | None                  | None                  |                                               |
| Get Welcome Message   | HTTP Request Tool          | Fetch welcome message           | Medium MCP Server     | Medium MCP Server      |                                               |
| Sticky Note2          | Sticky Note                | Documentation                   | None                  | None                  |                                               |
| Get Article Details   | HTTP Request Tool          | Fetch article metadata          | Medium MCP Server     | Medium MCP Server      |                                               |
| Get Article Content   | HTTP Request Tool          | Fetch full article content      | Medium MCP Server     | Medium MCP Server      |                                               |
| Get Article Fans      | HTTP Request Tool          | Fetch article fans count        | Medium MCP Server     | Medium MCP Server      |                                               |
| Get Article Markdown  | HTTP Request Tool          | Fetch article markdown format   | Medium MCP Server     | Medium MCP Server      |                                               |
| Get Related Articles  | HTTP Request Tool          | Fetch related articles          | Medium MCP Server     | Medium MCP Server      |                                               |
| Get Article Responses | HTTP Request Tool          | Fetch article responses         | Medium MCP Server     | Medium MCP Server      |                                               |
| Sticky Note3          | Sticky Note                | Documentation                   | None                  | None                  |                                               |
| Get Latest Posts      | HTTP Request Tool          | Fetch latest posts              | Medium MCP Server     | Medium MCP Server      |                                               |
| Get Related Tags      | HTTP Request Tool          | Fetch related tags              | Medium MCP Server     | Medium MCP Server      |                                               |
| Get Top Writers       | HTTP Request Tool          | Fetch top writers               | Medium MCP Server     | Medium MCP Server      |                                               |
| Get Top Feeds         | HTTP Request Tool          | Fetch top feeds                 | Medium MCP Server     | Medium MCP Server      |                                               |
| Sticky Note4          | Sticky Note                | Documentation                   | None                  | None                  |                                               |
| Get List Details      | HTTP Request Tool          | Fetch list details              | Medium MCP Server     | Medium MCP Server      |                                               |
| Get List Articles     | HTTP Request Tool          | Fetch articles in list          | Medium MCP Server     | Medium MCP Server      |                                               |
| Get List Responses    | HTTP Request Tool          | Fetch responses to list         | Medium MCP Server     | Medium MCP Server      |                                               |
| Sticky Note5          | Sticky Note                | Documentation                   | None                  | None                  |                                               |
| Get Publication ID    | HTTP Request Tool          | Fetch publication ID            | Medium MCP Server     | Medium MCP Server      |                                               |
| Get Publication Details| HTTP Request Tool         | Fetch publication details       | Medium MCP Server     | Medium MCP Server      |                                               |
| Get Publication Articles| HTTP Request Tool        | Fetch publication articles      | Medium MCP Server     | Medium MCP Server      |                                               |
| Get Publication Newsletter| HTTP Request Tool      | Fetch publication newsletter    | Medium MCP Server     | Medium MCP Server      |                                               |
| Sticky Note6          | Sticky Note                | Documentation                   | None                  | None                  |                                               |
| Search Articles       | HTTP Request Tool          | Search articles                 | Medium MCP Server     | Medium MCP Server      |                                               |
| Search Lists          | HTTP Request Tool          | Search lists                   | Medium MCP Server     | Medium MCP Server      |                                               |
| Search Publications   | HTTP Request Tool          | Search publications             | Medium MCP Server     | Medium MCP Server      |                                               |
| Search Tags           | HTTP Request Tool          | Search tags                    | Medium MCP Server     | Medium MCP Server      |                                               |
| Search Users          | HTTP Request Tool          | Search users                   | Medium MCP Server     | Medium MCP Server      |                                               |
| Sticky Note7          | Sticky Note                | Documentation                   | None                  | None                  |                                               |
| Get User ID           | HTTP Request Tool          | Fetch user ID                   | Medium MCP Server     | Medium MCP Server      |                                               |
| Get User Details      | HTTP Request Tool          | Fetch user profile details      | Medium MCP Server     | Medium MCP Server      |                                               |
| Get User Articles     | HTTP Request Tool          | Fetch user articles             | Medium MCP Server     | Medium MCP Server      |                                               |
| Get User Followers    | HTTP Request Tool          | Fetch user followers            | Medium MCP Server     | Medium MCP Server      |                                               |
| Get User Following    | HTTP Request Tool          | Fetch users followed by user    | Medium MCP Server     | Medium MCP Server      |                                               |
| Get User Interests    | HTTP Request Tool          | Fetch user interests            | Medium MCP Server     | Medium MCP Server      |                                               |
| Get User Lists        | HTTP Request Tool          | Fetch lists created by user     | Medium MCP Server     | Medium MCP Server      |                                               |
| Get User Publications | HTTP Request Tool          | Fetch user's publications      | Medium MCP Server     | Medium MCP Server      |                                               |
| Get User Top Articles | HTTP Request Tool          | Fetch user's top articles       | Medium MCP Server     | Medium MCP Server      |                                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the MCP Trigger Node:**
   - Add an MCP Trigger node (from LangChain MCP integration).
   - Configure it with a webhook ID (auto-generated).
   - This node will serve as the entry point to receive external API requests.

2. **Add HTTP Request Tool Nodes for Article Data:**
   - Create HTTP Request Tool nodes for:
     - Get Welcome Message
     - Get Article Details
     - Get Article Content
     - Get Article Fans
     - Get Article Markdown
     - Get Related Articles
     - Get Article Responses
   - For each, set the HTTP method and URL to the corresponding Medium API endpoints for articles.
   - Use expressions to insert dynamic parameters from the MCP Trigger input, such as article IDs.
   - Connect all these nodes as outputs from the MCP Trigger node.

3. **Add HTTP Request Tool Nodes for Post and Tag Data:**
   - Create nodes for:
     - Get Latest Posts
     - Get Related Tags
     - Get Top Writers
     - Get Top Feeds
   - Configure each with the correct Medium API endpoint.
   - Connect them as outputs from the MCP Trigger node.

4. **Add HTTP Request Tool Nodes for List Data:**
   - Create nodes for:
     - Get List Details
     - Get List Articles
     - Get List Responses
   - Configure each accordingly.
   - Connect them as outputs from the MCP Trigger node.

5. **Add HTTP Request Tool Nodes for Publication Data:**
   - Create nodes for:
     - Get Publication ID
     - Get Publication Details
     - Get Publication Articles
     - Get Publication Newsletter
   - Configure each with the proper API endpoints.
   - Connect to MCP Trigger node.

6. **Add HTTP Request Tool Nodes for Search Functionality:**
   - Create nodes for:
     - Search Articles
     - Search Lists
     - Search Publications
     - Search Tags
     - Search Users
   - Configure with search API endpoints and set dynamic query parameters based on MCP Trigger input.
   - Connect to MCP Trigger node.

7. **Add HTTP Request Tool Nodes for User Data Retrieval:**
   - Create nodes for:
     - Get User ID
     - Get User Details
     - Get User Articles
     - Get User Followers
     - Get User Following
     - Get User Interests
     - Get User Lists
     - Get User Publications
     - Get User Top Articles
   - Configure each node with appropriate Medium API endpoints.
   - Connect to MCP Trigger node.

8. **Add Sticky Notes for Documentation:**
   - Place sticky notes with:
     - Advanced Warning
     - Setup Instructions
     - Workflow Overview
     - Other miscellaneous notes matching original layout.
   - These have no technical configuration but help users understand workflow purpose.

9. **Parameter Setup:**
   - For each HTTP Request Tool, ensure:
     - HTTP method matches API (GET, POST, etc.)
     - URL includes dynamic parameters via expressions referencing MCP inputs.
     - Authentication is set up if Medium API requires (usually via credentials or headers).
   - For MCP Trigger, verify webhook URL and access rights.

10. **Credential Configuration:**
    - Set up any necessary credentials for Medium API access in n8n:
      - API keys or OAuth tokens as required.
    - Assign these credentials to HTTP Request Tool nodes.

11. **Test the Workflow:**
    - Trigger the MCP webhook with sample payloads.
    - Verify that corresponding HTTP Request nodes execute and return expected data.
    - Handle errors or missing parameters gracefully.

---

### 5. General Notes & Resources

| Note Content                                                                                           | Context or Link                                             |
|------------------------------------------------------------------------------------------------------|-------------------------------------------------------------|
| This workflow is designed as a backend API server for Medium’s MCP platform, handling multiple data points. | Serves as a comprehensive Medium API MCP backend.           |
| Requires LangChain MCP trigger node support in n8n environment.                                      | Refer to LangChain MCP integration documentation.           |
| Medium API endpoints require valid authentication; configure credentials accordingly in n8n.          | Medium API official docs: https://github.com/Medium/api-docs |
| Sticky notes throughout the workflow provide hints and setup instructions for maintainers.          | Visible within n8n editor for user guidance.                 |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled are legal and public.