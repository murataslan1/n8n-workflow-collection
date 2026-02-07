AI Image Nudity Detection Tool with Image Moderation API

https://n8nworkflows.xyz/workflows/ai-image-nudity-detection-tool-with-image-moderation-api-5661


# AI Image Nudity Detection Tool with Image Moderation API

### 1. Workflow Overview

This workflow, titled **AI Image Nudity Detection Tool with Image Moderation API**, is designed to provide a simple and effective interface for detecting nudity in images using the ModerateContent.com API. It acts as an MCP (Model-Callable Protocol) server endpoint that AI agents can query to detect inappropriate content, specifically nudity, in images by sending image URLs.

The workflow is logically divided into the following blocks:

- **1.1 Setup & Documentation**: Provides setup instructions, usage notes, and workflow overview for users and developers.
- **1.2 MCP Server Trigger**: Exposes a webhook endpoint to receive image moderation requests from AI agents.
- **1.3 Image Moderation API Call**: Makes an HTTP request to the ModerateContent.com API to analyze the image URL and return nudity detection results.

---

### 2. Block-by-Block Analysis

#### 1.1 Setup & Documentation

- **Overview:**  
  This block contains sticky notes that document the workflow’s purpose, setup instructions, usage notes, and operation overview. It serves an informational role, aiding users in deploying and understanding the workflow without requiring external documentation.

- **Nodes Involved:**  
  - Setup Instructions (Sticky Note)  
  - Workflow Overview (Sticky Note)  
  - Sticky Note (label: "Inappropriate Content")

- **Node Details:**

  - **Setup Instructions (Sticky Note)**  
    - Type: Sticky Note (documentation only)  
    - Content: Detailed step-by-step setup instructions including import, activation, authentication (none required), MCP URL usage, and customization tips.  
    - Input/Output: None (documentation only)  
    - Notes: Contains important usage tips and a Discord link for support: https://discord.me/cfomodz  
    - Edge cases: None (informational only)

  - **Workflow Overview (Sticky Note)**  
    - Type: Sticky Note  
    - Content: Describes the workflow’s functionality, API endpoint details, and how AI expressions populate parameters automatically.  
    - Input/Output: None  
    - Edge cases: None

  - **Sticky Note (Inappropriate Content label)**  
    - Type: Sticky Note  
    - Content: A simple label for the API operation block below it.  
    - Input/Output: None  
    - Edge cases: None

#### 1.2 MCP Server Trigger

- **Overview:**  
  This block sets up the webhook endpoint (MCP Trigger) that listens for incoming requests from AI agents. It acts as the entry point to the workflow, receiving image URLs for moderation.

- **Nodes Involved:**  
  - Image Moderation MCP Server (MCP Trigger)

- **Node Details:**

  - **Image Moderation MCP Server**  
    - Type: MCP Trigger (n8n-nodes-langchain.mcpTrigger)  
    - Role: Serves as the server endpoint for AI agents, exposing a webhook at path `/image-moderation-mcp`.  
    - Configuration:  
      - Webhook path: `image-moderation-mcp`  
      - No authentication required (open endpoint)  
    - Inputs: Receives AI agent requests with parameters (e.g., image URL) automatically parsed.  
    - Outputs: Sends data to the next node (HTTP Request Tool).  
    - Edge cases:  
      - Webhook downtime or connectivity issues may cause request failures.  
      - Improperly formatted AI agent requests could cause errors downstream.  
    - Version: Requires n8n version supporting MCP Trigger node (>= 1.95.3 recommended).  
    - Notes: Generates the URL to be used by AI agents for image moderation.

#### 1.3 Image Moderation API Call

- **Overview:**  
  This block performs the actual nudity detection by calling the external ModerateContent.com API using an HTTP Request Tool node. It sends the image URL as a query parameter and returns the API response directly to the AI agent.

- **Nodes Involved:**  
  - Detect Nudity in Images (HTTP Request Tool)

- **Node Details:**

  - **Detect Nudity in Images**  
    - Type: HTTP Request Tool (n8n-nodes-base.httpRequestTool)  
    - Role: Calls the external API endpoint to moderate the image for nudity.  
    - Configuration:  
      - URL: `https://api.moderatecontent.com/moderate/` (with trailing slash)  
      - Method: GET  
      - Query Parameters:  
        - `url` parameter is dynamically populated via expression: `{{$fromAI('url', 'Url', 'string')}}` which extracts the `url` field sent by the AI agent.  
      - Tool Description: "Blocks images with nudity" with explanation of parameters.  
      - No authentication configured (API is free or publicly accessible).  
    - Inputs: Receives parameters from MCP Trigger node.  
    - Outputs: Returns the API JSON response to MCP Trigger, which then returns to the AI agent.  
    - Edge cases:  
      - Invalid or missing `url` parameter leads to API errors.  
      - Network or API downtime causing request failures or timeouts.  
      - Unexpected API response format could cause expression failures downstream.  
    - Version: Compatible with n8n version supporting HTTP Request Tool (>= 0.200.0).  
    - Notes: This node directly connects back to the MCP Trigger node as an AI tool response, enabling smooth operation.

---

### 3. Summary Table

| Node Name                  | Node Type                       | Functional Role                      | Input Node(s)               | Output Node(s)              | Sticky Note                                                                                      |
|----------------------------|--------------------------------|------------------------------------|-----------------------------|-----------------------------|------------------------------------------------------------------------------------------------|
| Setup Instructions         | Sticky Note                    | Setup and usage documentation      | None                        | None                        | Setup instructions and usage notes, includes Discord support link and n8n documentation link. |
| Workflow Overview          | Sticky Note                    | Workflow overview and description  | None                        | None                        | Describes workflow purpose, API endpoint, and AI parameter auto-population.                    |
| Sticky Note (Inappropriate Content) | Sticky Note                    | Label for API operation block      | None                        | None                        | Label indicating the inappropriate content detection section.                                  |
| Image Moderation MCP Server | MCP Trigger                   | Webhook endpoint for AI agents     | None                        | Detect Nudity in Images      | Exposes webhook URL for AI agent requests; no authentication required.                         |
| Detect Nudity in Images     | HTTP Request Tool              | Calls external image moderation API| Image Moderation MCP Server | Image Moderation MCP Server  | Performs nudity detection via ModerateContent.com API; URL parameter auto-filled from AI input.|

---

### 4. Reproducing the Workflow from Scratch

1. **Create Sticky Note: Setup Instructions**  
   - Type: Sticky Note  
   - Content: Include detailed setup steps, usage notes, customization tips, and support links (Discord and n8n docs).  
   - Position: Place on the left side for easy reference.

2. **Create Sticky Note: Workflow Overview**  
   - Type: Sticky Note  
   - Content: Provide a summary of the workflow purpose, how it works, and available API operations.  
   - Position: Near Setup Instructions for user guidance.

3. **Create Sticky Note: Inappropriate Content Label**  
   - Type: Sticky Note  
   - Content: "## Inappropriate Content" as a section header.  
   - Position: Above the API operation nodes to label the block.

4. **Add MCP Trigger Node**  
   - Type: MCP Trigger (n8n-nodes-langchain.mcpTrigger)  
   - Parameters:  
     - Path: `image-moderation-mcp`  
     - Authentication: None (open endpoint)  
   - Position: Center-left  
   - Purpose: Exposes a webhook endpoint for AI agents to send moderation requests.

5. **Add HTTP Request Tool Node**  
   - Type: HTTP Request Tool (n8n-nodes-base.httpRequestTool)  
   - Parameters:  
     - URL: `https://api.moderatecontent.com/moderate/`  
     - HTTP Method: GET (default)  
     - Query Parameters: Add parameter named `url` with expression: `{{$fromAI('url', 'Url', 'string')}}`  
     - Tool Description: "Blocks images with nudity" plus parameter details  
   - Position: Right of MCP Trigger node  
   - Purpose: Calls external API with the image URL to detect nudity.

6. **Connect Nodes**  
   - Connect MCP Trigger node’s AI tool output to the HTTP Request Tool node input.  
   - Connect HTTP Request Tool node’s AI tool output back to the MCP Trigger node to return response to the AI agent.

7. **Activate Workflow**  
   - Save and activate the workflow in your n8n instance.  
   - Copy the generated webhook URL from the MCP Trigger node for use in AI agents.

8. **No Credentials Required**  
   - The API endpoint used does not require authentication or API keys for basic usage as per current configuration.

---

### 5. General Notes & Resources

| Note Content                                                                                               | Context or Link                                                                                               |
|------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| Use `$fromAI()` expressions to automatically populate parameters from AI agent requests.                    | See node parameter expressions in HTTP Request Tool for dynamic input.                                       |
| Discord support channel for integration help: https://discord.me/cfomodz                                   | Useful for personalized assistance and custom automation requests.                                           |
| Official n8n MCP Trigger documentation: https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.toolmcp/ | Reference for MCP Trigger node usage and configuration.                                                      |
| The workflow is open endpoint; consider adding custom authentication or rate limiting for production use.  | To prevent abuse or unauthorized usage in public deployments.                                                |
| The ModerateContent.com API used is free with basic support, may have rate limits or usage policies.       | Check https://moderatecontent.com for terms and API documentation.                                           |

---

**Disclaimer:**  
This document describes a workflow created entirely with n8n automation software. It strictly complies with current content policies and contains no illegal, offensive, or protected content. All processed data are legal and publicly accessible.