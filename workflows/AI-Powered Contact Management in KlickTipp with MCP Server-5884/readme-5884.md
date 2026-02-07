AI-Powered Contact Management in KlickTipp with MCP Server

https://n8nworkflows.xyz/workflows/ai-powered-contact-management-in-klicktipp-with-mcp-server-5884


# AI-Powered Contact Management in KlickTipp with MCP Server

---

### 1. Workflow Overview

This workflow, titled **"AI-Powered Contact Management in KlickTipp with MCP Server"**, is designed to integrate an MCP Server with the KlickTipp contact management platform, leveraging a Large Language Model (LLM) to provide intelligent querying, segmentation, and automated contact operations. It is intended for use cases such as dynamic contact lookup, tagging, segmentation, campaign triggering, and opt-in process management within KlickTipp using natural language commands processed by the LLM.

The workflow logic is divided into the following functional blocks:

- **1.1 Input Reception via MCP Server Trigger:** Listens for incoming requests related to contact management and segmentation.
- **1.2 AI Processing with LLM:** Interprets natural language queries into actionable KlickTipp API calls.
- **1.3 Contact Management Operations:** Includes adding, updating, retrieving, listing, deleting, and unsubscribing contacts.
- **1.4 Contact Tagging Operations:** Manages applying, removing, and listing tags for contacts.
- **1.5 Tag Management:** Covers creating, retrieving, updating, deleting, and listing tags.
- **1.6 Opt-in Process Handling:** Lists and retrieves details about opt-in processes.
- **1.7 Data Field Operations:** Lists and retrieves custom data fields.
- **1.8 Redirect URL Retrieval:** Fetches redirect URLs for opt-in processes.
- **1.9 Utility Tools:** Includes conversion tools for handling Unix timestamps and formatted date strings.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception via MCP Server Trigger

- **Overview:**  
  This block acts as the entry point for the workflow. It listens for incoming MCP server requests on a specific webhook path and initiates the workflow by passing data to the AI processing nodes.

- **Nodes Involved:**  
  - MCP Server Trigger

- **Node Details:**  
  - **MCP Server Trigger**  
    - Type: `@n8n/n8n-nodes-langchain.mcpTrigger`  
    - Configuration: Listens on webhook path `"klicktipp-mcp"` for incoming MCP messages.  
    - Inputs: External inbound HTTP requests via MCP server.  
    - Outputs: Routes data to all KlickTipp operation nodes as an AI tool input.  
    - Version: 1  
    - Edge Cases: Potential webhook authentication or connectivity errors, malformed incoming data.  
    - Notes: Acts as the central trigger for all subsequent operations.

#### 1.2 AI Processing with LLM

- **Overview:**  
  This functional role is embedded in the MCP Server Trigger node which passes natural language input to KlickTipp operation nodes that use `$fromAI()` expressions to extract structured parameters for API calls.

- **Nodes Involved:**  
  - No separate LLM node; AI integration is embedded via expressions in KlickTipp nodes.

- **Node Details:**  
  - Expressions like `{{$fromAI("fieldName", "Description", "type", "default")}}` are used extensively across KlickTipp nodes to request specific data from the LLM interpretation.  
  - Edge Cases: AI may return incomplete or unexpected data types; expression evaluation failures may occur if AI output is malformed.

#### 1.3 Contact Management Operations

- **Overview:**  
  This block manages all subscriber-related operations such as adding, updating, retrieving, listing, unsubscribing, and deleting contacts.

- **Nodes Involved:**  
  - Add or Update Contact  
  - Update Contact  
  - Get Contact  
  - List Contacts  
  - Delete Contact  
  - Unsubscribe Contact  
  - Get Contact ID

- **Node Details:**  

  - **Add or Update Contact**  
    - Type: KlickTipp Tool Node  
    - Operation: `subscribe` with logic to add or update based on email.  
    - Parameters: Uses AI variables for email, tags, data fields (name, address, phones, birthday, lead value, website), opt-in ID, SMS number.  
    - Credentials: KlickTipp API credentials required.  
    - Edge Cases: Duplicate contact handling, invalid email format, missing required fields.

  - **Update Contact**  
    - Type: KlickTipp Tool Node  
    - Operation: `update` subscriber by ID.  
    - Parameters: AI-driven data fields similar to Add or Update Contact.  
    - Edge Cases: Contact ID not found, partial updates, invalid data formats.

  - **Get Contact**  
    - Type: KlickTipp Tool Node  
    - Operation: `get` subscriber by ID.  
    - Edge Cases: Non-existent contact ID, network/API errors.

  - **List Contacts**  
    - Type: KlickTipp Tool Node  
    - Operation: `list` subscribers to fetch contact IDs.  
    - Edge Cases: Large data sets, API rate limiting.

  - **Delete Contact**  
    - Type: KlickTipp Tool Node  
    - Operation: `delete` subscriber by ID.  
    - Edge Cases: Attempting to delete non-existent contacts, permissions.

  - **Unsubscribe Contact**  
    - Type: KlickTipp Tool Node  
    - Operation: `unsubscribe` subscriber by email.  
    - Edge Cases: Contact not found, email format errors.

  - **Get Contact ID**  
    - Type: KlickTipp Tool Node  
    - Operation: `search` subscriber by email to return contact ID.  
    - Edge Cases: Email not found, multiple matches.

#### 1.4 Contact Tagging Operations

- **Overview:**  
  Manages tagging and untagging of contacts and listing tagged contacts.

- **Nodes Involved:**  
  - Tag Contact  
  - Untag Contact  
  - List Tagged Contacts

- **Node Details:**  

  - **Tag Contact**  
    - Operation: Adds one or multiple tags to a contact by email.  
    - Tags are parsed from AI JSON array input and mapped to numbers.  
    - Edge Cases: Invalid tag IDs, contact not found.

  - **Untag Contact**  
    - Operation: Removes a tag from a contact by email.  
    - Edge Cases: Tag or contact does not exist.

  - **List Tagged Contacts**  
    - Operation: Lists IDs and timestamps of contacts tagged with a specific tag ID.  
    - Edge Cases: Empty results, invalid tag ID.

#### 1.5 Tag Management

- **Overview:**  
  Enables the creation, retrieval, updating, deletion, and listing of tags.

- **Nodes Involved:**  
  - List Tags  
  - Create Tag  
  - Get Tag  
  - Update Tag  
  - Delete Tag

- **Node Details:**  

  - **List Tags**  
    - Returns all tag IDs and names.  
    - Edge Cases: Large number of tags, API limits.

  - **Create Tag**  
    - Creates a new manual tag with name and description from AI.  
    - Edge Cases: Duplicate tag names, invalid input.

  - **Get Tag**  
    - Retrieves tag details by tag ID.  
    - Edge Cases: Tag ID not found.

  - **Update Tag**  
    - Updates tag name and description by tag ID.  
    - Edge Cases: Tag not found, invalid update data.

  - **Delete Tag**  
    - Deletes tag by ID.  
    - Edge Cases: Tag in use, deletion restrictions.

#### 1.6 Opt-in Process Handling

- **Overview:**  
  Handles listing and retrieving detailed information about opt-in processes.

- **Nodes Involved:**  
  - List Opt-in Processes  
  - Get Opt-in Process

- **Node Details:**  

  - **List Opt-in Processes**  
    - Lists all opt-in process IDs and names.  
    - Edge Cases: Empty list, API errors.

  - **Get Opt-in Process**  
    - Returns detailed data for a given opt-in process ID.  
    - Edge Cases: Invalid opt-in ID.

#### 1.7 Data Field Operations

- **Overview:**  
  Manages retrieval of custom data fields metadata.

- **Nodes Involved:**  
  - List Data Fields  
  - Get Data Field

- **Node Details:**  

  - **List Data Fields**  
    - Lists IDs and names of all data fields.  
    - Edge Cases: API errors.

  - **Get Data Field**  
    - Retrieves detailed information of a specific data field by ID.  
    - Edge Cases: Invalid field ID.

#### 1.8 Redirect URL Retrieval

- **Overview:**  
  Retrieves redirect URLs associated with specific opt-in processes for a contact.

- **Nodes Involved:**  
  - Get Redirect URL

- **Node Details:**  

  - **Get Redirect URL**  
    - Parameters: Contact email and opt-in process ID.  
    - Returns: Redirect URL for the specified opt-in process and contact.  
    - Edge Cases: Contact or opt-in process not found.

#### 1.9 Utility Tools

- **Overview:**  
  Provides date and timestamp conversion functions to support contact data management.

- **Nodes Involved:**  
  - Timestamp to date  
  - Date to timestamp

- **Node Details:**  

  - **Timestamp to date**  
    - Converts Unix timestamp in seconds to formatted date string in Europe/Berlin timezone.  
    - JS code validates and formats the input.  
    - Edge Cases: Invalid timestamp input returns empty string.

  - **Date to timestamp**  
    - Converts various human-readable date formats into Unix timestamp seconds, considering Europe/Berlin timezone.  
    - Supports multiple date formats with fallback to ISO and SQL parsing.  
    - Returns "N/A" if parsing fails.  
    - Edge Cases: Invalid or unsupported date formats.

---

### 3. Summary Table

| Node Name             | Node Type                               | Functional Role                   | Input Node(s)         | Output Node(s)              | Sticky Note                                                                                                                 |
|-----------------------|---------------------------------------|---------------------------------|-----------------------|-----------------------------|-----------------------------------------------------------------------------------------------------------------------------|
| MCP Server Trigger     | @n8n/n8n-nodes-langchain.mcpTrigger  | Entry trigger for MCP requests  | External webhook      | All KlickTipp operation nodes |                                                                                                                             |
| Add or Update Contact  | n8n-nodes-klicktipp.klicktippTool    | Add or update subscriber        | MCP Server Trigger    | None                        | ## Contact Management                                                                                                       |
| Update Contact        | n8n-nodes-klicktipp.klicktippTool    | Update subscriber by ID         | MCP Server Trigger    | None                        | ## Contact Management                                                                                                       |
| Get Contact           | n8n-nodes-klicktipp.klicktippTool    | Get subscriber data by ID       | MCP Server Trigger    | None                        | ## Contact Management                                                                                                       |
| List Contacts         | n8n-nodes-klicktipp.klicktippTool    | List subscriber IDs             | MCP Server Trigger    | None                        | ## Contact Management                                                                                                       |
| Delete Contact        | n8n-nodes-klicktipp.klicktippTool    | Delete subscriber by ID         | MCP Server Trigger    | None                        | ## Contact Management                                                                                                       |
| Unsubscribe Contact   | n8n-nodes-klicktipp.klicktippTool    | Unsubscribe subscriber by email | MCP Server Trigger    | None                        | ## Contact Management                                                                                                       |
| Get Contact ID        | n8n-nodes-klicktipp.klicktippTool    | Search subscriber ID by email   | MCP Server Trigger    | None                        | ## Contact Management                                                                                                       |
| Tag Contact           | n8n-nodes-klicktipp.klicktippTool    | Add tags to contact             | MCP Server Trigger    | None                        | ## Contact Tagging                                                                                                          |
| Untag Contact         | n8n-nodes-klicktipp.klicktippTool    | Remove tag from contact         | MCP Server Trigger    | None                        | ## Contact Tagging                                                                                                          |
| List Tagged Contacts  | n8n-nodes-klicktipp.klicktippTool    | List contacts by tag            | MCP Server Trigger    | None                        | ## Contact Tagging                                                                                                          |
| List Tags             | n8n-nodes-klicktipp.klicktippTool    | List all tags                   | MCP Server Trigger    | None                        | ## Tag Operations                                                                                                           |
| Create Tag            | n8n-nodes-klicktipp.klicktippTool    | Create new tag                  | MCP Server Trigger    | None                        | ## Tag Operations                                                                                                           |
| Get Tag               | n8n-nodes-klicktipp.klicktippTool    | Get tag details                 | MCP Server Trigger    | None                        | ## Tag Operations                                                                                                           |
| Update Tag            | n8n-nodes-klicktipp.klicktippTool    | Update tag details              | MCP Server Trigger    | None                        | ## Tag Operations                                                                                                           |
| Delete Tag            | n8n-nodes-klicktipp.klicktippTool    | Delete tag                     | MCP Server Trigger    | None                        | ## Tag Operations                                                                                                           |
| List Opt-in Processes | n8n-nodes-klicktipp.klicktippTool    | List opt-in processes           | MCP Server Trigger    | None                        | ## Opt-in Processes                                                                                                         |
| Get Opt-in Process    | n8n-nodes-klicktipp.klicktippTool    | Get opt-in process details      | MCP Server Trigger    | None                        | ## Opt-in Processes                                                                                                         |
| List Data Fields      | n8n-nodes-klicktipp.klicktippTool    | List custom data fields         | MCP Server Trigger    | None                        | ## Data Fields                                                                                                             |
| Get Data Field        | n8n-nodes-klicktipp.klicktippTool    | Get data field details          | MCP Server Trigger    | None                        | ## Data Fields                                                                                                             |
| Get Redirect URL      | n8n-nodes-klicktipp.klicktippTool    | Retrieve redirect URL           | MCP Server Trigger    | None                        | ## Redirects                                                                                                               |
| Timestamp to date     | @n8n/n8n-nodes-langchain.toolCode    | Convert Unix timestamp to date  | MCP Server Trigger    | None                        | ## Additional Tools                                                                                                        |
| Date to timestamp     | @n8n/n8n-nodes-langchain.toolCode    | Convert date string to timestamp| MCP Server Trigger    | None                        | ## Additional Tools                                                                                                        |
| Sticky Note4          | n8n-nodes-base.stickyNote             | Documentation and workflow info | None                  | None                        | See detailed workflow description and instructions                                                                         |
| Sticky Note1          | n8n-nodes-base.stickyNote             | Label for Contact Management    | None                  | None                        | ## Contact Management                                                                                                       |
| Sticky Note9          | n8n-nodes-base.stickyNote             | Label for Opt-in Processes      | None                  | None                        | ## Opt-in Processes                                                                                                         |
| Sticky Note10         | n8n-nodes-base.stickyNote             | Label for Tag Operations        | None                  | None                        | ## Tag Operations                                                                                                           |
| Sticky Note11         | n8n-nodes-base.stickyNote             | Label for Data Fields           | None                  | None                        | ## Data Fields                                                                                                             |
| Sticky Note12         | n8n-nodes-base.stickyNote             | Label for Contact Tagging       | None                  | None                        | ## Contact Tagging                                                                                                          |
| Sticky Note13         | n8n-nodes-base.stickyNote             | Label for Redirects              | None                  | None                        | ## Redirects                                                                                                               |
| Sticky Note5          | n8n-nodes-base.stickyNote             | Label for Additional Tools      | None                  | None                        | ## Additional Tools                                                                                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create MCP Server Trigger Node**  
   - Type: `MCP Server Trigger` (from Langchain MCP nodes)  
   - Configure webhook path to `"klicktipp-mcp"`  
   - This node will receive incoming MCP server requests and trigger the workflow.

2. **Set up KlickTipp API Credentials**  
   - Create and configure credentials for KlickTipp API with valid API key/token.  
   - Use this credential in all KlickTipp tool nodes.

3. **Add KlickTipp Contact Management Nodes**  
   - **Add or Update Contact**  
     - Type: KlickTipp Tool  
     - Operation: `subscribe`  
     - Parameters: Map AI variables (`email`, `tagId`, `fields` for personal info, address, phones, birthday, lead value, website, `optInId`, `smsNumber`).  
     - Connect input from MCP Server Trigger.  

   - **Update Contact**  
     - Type: KlickTipp Tool  
     - Operation: `update`  
     - Parameters: Use AI variables including `contactId` and contact fields.  
     - Connect input from MCP Server Trigger.

   - **Get Contact**  
     - Type: KlickTipp Tool  
     - Operation: `get` by `subscriberId` from AI.  
     - Connect input from MCP Server Trigger.

   - **List Contacts**  
     - Type: KlickTipp Tool  
     - Operation: `list` subscribers.  
     - Connect input from MCP Server Trigger.

   - **Delete Contact**  
     - Type: KlickTipp Tool  
     - Operation: `delete` by `subscriberId`.  
     - Connect input from MCP Server Trigger.

   - **Unsubscribe Contact**  
     - Type: KlickTipp Tool  
     - Operation: `unsubscribe` by `email`.  
     - Connect input from MCP Server Trigger.

   - **Get Contact ID**  
     - Type: KlickTipp Tool  
     - Operation: `search` by `email`.  
     - Connect input from MCP Server Trigger.

4. **Add Contact Tagging Nodes**  
   - **Tag Contact**  
     - Type: KlickTipp Tool  
     - Operation: `tag` contact by `email` and multiple `tagIds` parsed from AI JSON array.  
     - Connect input from MCP Server Trigger.

   - **Untag Contact**  
     - Type: KlickTipp Tool  
     - Operation: `untag` contact by `email` and single `tagId`.  
     - Connect input from MCP Server Trigger.

   - **List Tagged Contacts**  
     - Type: KlickTipp Tool  
     - Operation: `tagged` contacts by `tagId`.  
     - Connect input from MCP Server Trigger.

5. **Add Tag Management Nodes**  
   - **List Tags**  
     - Type: KlickTipp Tool  
     - Operation: `list` tags.  
     - Connect input from MCP Server Trigger.

   - **Create Tag**  
     - Type: KlickTipp Tool  
     - Operation: `create` with `name` and `description` from AI.  
     - Connect input from MCP Server Trigger.

   - **Get Tag**  
     - Type: KlickTipp Tool  
     - Operation: `get` by `tagId`.  
     - Connect input from MCP Server Trigger.

   - **Update Tag**  
     - Type: KlickTipp Tool  
     - Operation: `update` `name` and `description` by `tagId`.  
     - Connect input from MCP Server Trigger.

   - **Delete Tag**  
     - Type: KlickTipp Tool  
     - Operation: `delete` by `tagId`.  
     - Connect input from MCP Server Trigger.

6. **Add Opt-in Process Nodes**  
   - **List Opt-in Processes**  
     - Type: KlickTipp Tool  
     - Operation: list opt-in processes.  
     - Connect input from MCP Server Trigger.

   - **Get Opt-in Process**  
     - Type: KlickTipp Tool  
     - Operation: get opt-in process by `optInId`.  
     - Connect input from MCP Server Trigger.

7. **Add Data Field Nodes**  
   - **List Data Fields**  
     - Type: KlickTipp Tool  
     - Operation: list data fields.  
     - Connect input from MCP Server Trigger.

   - **Get Data Field**  
     - Type: KlickTipp Tool  
     - Operation: get data field by `fieldId`.  
     - Connect input from MCP Server Trigger.

8. **Add Redirect URL Node**  
   - **Get Redirect URL**  
     - Type: KlickTipp Tool  
     - Operation: get redirect URL by `email` and `optInId`.  
     - Connect input from MCP Server Trigger.

9. **Add Utility Conversion Nodes**  
   - **Timestamp to date**  
     - Type: Langchain ToolCode node  
     - JavaScript code to convert Unix timestamp (seconds) to formatted date string in Europe/Berlin timezone.  
     - Connect input from MCP Server Trigger.

   - **Date to timestamp**  
     - Type: Langchain ToolCode node  
     - JavaScript code to parse date strings into Unix timestamp seconds, supporting multiple formats.  
     - Connect input from MCP Server Trigger.

10. **Add Sticky Notes for Documentation**  
    - Add sticky notes as per workflow to label functional blocks and provide detailed instructions.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                       | Context or Link                                                                                              |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| AI-Driven Contact Management with MCP and KlickTipp Integration enables natural language queries and segmentation with LLMs such as OpenAI or Claude.                                                                            | Detailed workflow description in Sticky Note4                                                                |
| Full KlickTipp API coverage for contact, tag, opt-in, and data field management supports diverse automation use cases.                                                                                                           | Sticky notes labeling each functional group (e.g., Contact Management, Tag Operations)                       |
| Testing prompts examples: "Tell me something about the contact with email address X", "Tag all contacts from region Y", "Send campaign Z to customers in area A"                                                                  | Instructions in Sticky Note4                                                                                  |
| Customization is possible by adjusting AI prompts, tag logic, and field mappings. Extensibility options include integration with Google Sheets and campaign feedback loops.                                                      | Sticky Note4                                                                                                  |
| Ensure KlickTipp API credentials are valid and have appropriate permissions for all operations.                                                                                                                                | Credential configuration section                                                                              |
| Use of AI expressions `$fromAI()` requires careful prompt engineering to ensure correct and complete data extraction. Handle errors gracefully when AI returns unexpected data.                                                  | General best practices                                                                                         |
| Date and timestamp conversions assume Europe/Berlin timezone, adjust if needed for other locales.                                                                                                                               | Utility nodes Timestamp to date and Date to timestamp                                                        |

---

**Disclaimer:** The content provided is exclusively derived from an automated n8n workflow created for legal, public, and non-offensive data processing purposes. It complies with all relevant content policies.

---