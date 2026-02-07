Automate Blog Post Publishing from Airtable to Hashnode with API Integration

https://n8nworkflows.xyz/workflows/automate-blog-post-publishing-from-airtable-to-hashnode-with-api-integration-7063


# Automate Blog Post Publishing from Airtable to Hashnode with API Integration

### 1. Workflow Overview

This workflow automates the process of publishing blog posts from Airtable to Hashnode by leveraging API integrations. It is designed to streamline content creators’, marketing teams’, developers’, or agencies’ efforts in managing and publishing multiple blog posts across different Hashnode publications from a centralized Airtable database.

The workflow logically divides into the following functional blocks:

- **1.1 Input Reception**  
  - Manual trigger node to start the workflow.
- **1.2 Retrieving Draft Posts from Airtable**  
  - Fetches unpublished blog posts from Airtable filtered by "Not Published" status.
- **1.3 Batch Processing**  
  - Processes posts individually in batches to handle multiple entries sequentially.
- **1.4 Publication Validation**  
  - Retrieves the Hashnode publication ID using the publication domain via a GraphQL API call.
  - Conditional check to verify the existence of the publication ID.
- **1.5 Draft Post Creation on Hashnode**  
  - Creates a draft post on Hashnode using API with post title and markdown content.
- **1.6 Post Status Update in Airtable**  
  - Updates the post status to “Published” upon successful draft creation.
- **1.7 Error Handling**  
  - If publication ID is missing or post creation fails, marks the post status as “Error” in Airtable.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  Allows manual initiation of the workflow to start the publishing process on demand.

- **Nodes Involved:**  
  - When clicking ‘Execute workflow’ (Manual Trigger)

- **Node Details:**  
  - Type: Manual Trigger  
  - Configuration: Default manual trigger; no parameters required.  
  - Inputs: None (trigger node)  
  - Outputs: Triggers the “Get Posts” node.  
  - Edge Cases: None.  
  - Version: 1

---

#### 2.2 Retrieving Draft Posts from Airtable

- **Overview:**  
  Queries the Airtable database to fetch all blog posts with a status of “Not Published” to identify posts that need to be processed.

- **Nodes Involved:**  
  - Get Posts

- **Node Details:**  
  - Type: Airtable  
  - Configuration:  
    - Base ID set to the user’s Airtable base (e.g., appWkeQWqFgNbvHuB).  
    - Table set to the specific posts table (e.g., “HashNode”).  
    - Operation: “search” with filter formula `{Status} = "Not Published"`.  
  - Key Variables: Filtering by Status field in Airtable.  
  - Input: Trigger from manual node.  
  - Output: List of posts matching the filter.  
  - Edge Cases:  
    - No posts found (workflow will proceed but no batch processing).  
    - Airtable credentials or API limits could cause errors.  
  - Version: 2.1

---

#### 2.3 Batch Processing

- **Overview:**  
  Splits the list of posts into individual items for sequential processing, ensuring each post is handled separately.

- **Nodes Involved:**  
  - Loop Over Items

- **Node Details:**  
  - Type: SplitInBatches  
  - Configuration: Default batch size (1 item per batch).  
  - Input: Posts array from “Get Posts”.  
  - Output: One post per iteration to downstream nodes.  
  - Edge Cases:  
    - Large numbers of posts could lead to long processing times.  
  - Version: 3

---

#### 2.4 Publication Validation

- **Overview:**  
  Retrieves the publication ID from Hashnode’s GraphQL API based on the publication domain specified in each post. Checks if the publication exists before attempting to create a draft.

- **Nodes Involved:**  
  - Get Publication ID  
  - If Exists Publication_ID

- **Node Details:**  
  - **Get Publication ID**  
    - Type: HTTP Request  
    - Configuration:  
      - POST to `https://gql.hashnode.com` with GraphQL query:  
        ```graphql  
        query GetPublication($host: String!) { publication(host: $host) { id title } }  
        ```  
      - Variable `$host` populated with `HashNode_Publication_Domain` from the current post JSON.  
      - Authorization header set with Bearer token from `Hashnode_Token`.  
      - Parses JSON response.  
    - Input: One post from batch.  
    - Output: Publication ID data or empty.  
    - Edge Cases:  
      - Invalid token or expired token causing 401 errors.  
      - Invalid or misspelled publication domain returning null.  
      - Network timeouts.  
    - Version: 4.2

  - **If Exists Publication_ID**  
    - Type: If Node  
    - Configuration: Checks if `data.publication.id` exists in the HTTP Request response.  
    - Input: From “Get Publication ID”.  
    - Output:  
      - True branch if publication ID exists → proceed to create draft.  
      - False branch if missing → update error status.  
    - Edge Cases: None beyond upstream errors.  
    - Version: 2.2

---

#### 2.5 Draft Post Creation on Hashnode

- **Overview:**  
  Creates a draft post on Hashnode using title and markdown content from Airtable and the validated publication ID.

- **Nodes Involved:**  
  - HashNode Post Draft

- **Node Details:**  
  - Type: HTTP Request  
  - Configuration:  
    - POST to Hashnode GraphQL endpoint.  
    - Mutation query to create draft:  
      ```graphql  
      mutation CreateDraft($input: CreateDraftInput!) {  
        createDraft(input: $input) { draft { id } }  
      }  
      ```  
    - Variables include:  
      - Title: from current post `Title`.  
      - ContentMarkdown: from current post `Content_markdown`.  
      - PublicationId: from `Get Publication ID` node’s JSON data.  
    - Authorization header: Bearer token from current post’s `Hashnode_Token`.  
  - Input: Validated publication ID and current post data.  
  - Output: Response with draft ID if successful.  
  - Edge Cases:  
    - API token permission errors.  
    - Invalid or malformed markdown content.  
    - API rate limits or timeouts.  
  - Version: 4.2

---

#### 2.6 Post Status Update in Airtable

- **Overview:**  
  Updates the original post record in Airtable marking it as “Published” if draft creation succeeds.

- **Nodes Involved:**  
  - Update Post

- **Node Details:**  
  - Type: Airtable  
  - Configuration:  
    - Base and Table same as “Get Posts”.  
    - Operation: “update” by matching post `id`.  
    - Sets `Status` field to “Published”.  
    - Uses current post’s Airtable ID (`id`).  
  - Input: Output of “HashNode Post Draft” node.  
  - Output: Confirmation of update.  
  - Edge Cases:  
    - Airtable API errors (rate limit, authentication).  
    - Mismatched IDs causing update failure.  
  - Version: 2.1

---

#### 2.7 Error Handling

- **Overview:**  
  If the publication ID does not exist or draft creation fails, update the post status in Airtable to “Error” to flag for review.

- **Nodes Involved:**  
  - Update Error

- **Node Details:**  
  - Type: Airtable  
  - Configuration:  
    - Same base and table as others.  
    - Operation: “update” by post `id`.  
    - Sets `Status` field to “Error”.  
  - Input: False branch of “If Exists Publication_ID” node.  
  - Output: Confirmation of update.  
  - Edge Cases: Same as “Update Post” node.  
  - Version: 2.1

---

### 3. Summary Table

| Node Name              | Node Type        | Functional Role                 | Input Node(s)              | Output Node(s)           | Sticky Note                                                                                                          |
|------------------------|------------------|--------------------------------|----------------------------|--------------------------|----------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger   | Start workflow                 | None                       | Get Posts                |                                                                                                                      |
| Get Posts              | Airtable         | Retrieve unpublished posts      | When clicking ‘Execute workflow’ | Loop Over Items           | ## 1. Get Blog Posts - Using [Airtable Node](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.airtable/) |
| Loop Over Items        | SplitInBatches   | Process posts individually      | Get Posts                  | Get Publication ID       | ## 2. Item process - Using [Loop over Items Node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.splitinbatches/) |
| Get Publication ID     | HTTP Request     | Retrieve publication ID from Hashnode | Loop Over Items            | If Exists Publication_ID | ## 3. Get Publication_ID - Using [HTTP Request Node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/) |
| If Exists Publication_ID | If               | Check if publication ID exists  | Get Publication ID         | HashNode Post Draft, Update Error | ## 4. Publication_ID Exists? - Using [IF Node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.if/) |
| HashNode Post Draft    | HTTP Request     | Create draft post on Hashnode  | If Exists Publication_ID (true) | Update Post               | ## 5. Post Draft - Using [HTTP Request Node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/) |
| Update Post            | Airtable         | Mark post as Published          | HashNode Post Draft        | Loop Over Items (iteration) | ## 6. Update Blog Posts - Using [Airtable Node](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.airtable/) |
| Update Error           | Airtable         | Mark post as Error on failure   | If Exists Publication_ID (false) | Loop Over Items (iteration) | ## 7. Error - No Publication_ID - Using [Airtable Node](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.airtable/) |
| Sticky Notes           | Sticky Note      | Various explanatory notes       | N/A                        | N/A                      | Multiple sticky notes explaining each block and overall workflow (see node positions)                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Name: “When clicking ‘Execute workflow’”  
   - Type: Manual Trigger  
   - No additional parameters.

2. **Create Airtable Node to Get Posts**  
   - Name: “Get Posts”  
   - Type: Airtable  
   - Operation: Search  
   - Base: Set to your Airtable Base ID.  
   - Table: Set to your Posts Table ID.  
   - Filter Formula: `{Status} = "Not Published"`  
   - Credentials: Set Airtable API credentials.  
   - Connect output of Manual Trigger node to this node.

3. **Create SplitInBatches Node**  
   - Name: “Loop Over Items”  
   - Type: SplitInBatches  
   - Default batch size is 1 (process one post at a time).  
   - Connect output of “Get Posts” to this node.

4. **Create HTTP Request Node to Get Publication ID**  
   - Name: “Get Publication ID”  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://gql.hashnode.com`  
   - Authentication: None (token passed in headers)  
   - Headers:  
     - Key: Authorization  
     - Value: `=Bearer {{ $json.Hashnode_Token }}` (token from current post item)  
   - Body: JSON (set “Specify Body” to JSON)  
     ```json
     {
       "query": "query GetPublication($host: String!) { publication(host: $host) { id title } }",
       "variables": {
         "host": "{{ $json.HashNode_Publication_Domain }}"
       }
     }
     ```  
   - Connect output of “Loop Over Items” to this node.

5. **Create IF Node to Check Publication ID Existence**  
   - Name: “If Exists Publication_ID”  
   - Type: If  
   - Condition: Check if `={{ $json.data.publication.id }}` exists (string exists).  
   - Connect output of “Get Publication ID” to this node.

6. **Create HTTP Request Node to Create Draft Post**  
   - Name: “HashNode Post Draft”  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://gql.hashnode.com`  
   - Headers:  
     - Authorization: `=Bearer {{ $json.Hashnode_Token }}`  
   - Body: JSON  
     ```json
     {
       "query": "mutation CreateDraft($input: CreateDraftInput!) { createDraft(input: $input) { draft { id } } }",
       "variables": {
         "input": {
           "title": {{ JSON.stringify($('Get Posts').item.json.Title) }},
           "contentMarkdown": {{ JSON.stringify($('Get Posts').item.json.Content_markdown) }},
           "publicationId": "{{ $('Get Publication ID').item.json.data.publication.id }}"
         }
       }
     }
     ```  
   - Connect “true” output of IF node to this node.

7. **Create Airtable Node to Update Post to Published**  
   - Name: “Update Post”  
   - Type: Airtable  
   - Operation: Update  
   - Base and Table: Same as “Get Posts” node.  
   - Matching Column: `id` field from current item.  
   - Update Field: Set `Status` to “Published”.  
   - Connect output of “HashNode Post Draft” to this node.

8. **Create Airtable Node to Update Post to Error**  
   - Name: “Update Error”  
   - Type: Airtable  
   - Operation: Update  
   - Base and Table: Same as others.  
   - Matching Column: `id` from current item.  
   - Update Field: Set `Status` to “Error”.  
   - Connect “false” output of IF node to this node.

9. **Connect Outputs Back to Loop**  
   - Connect output of “Update Post” and “Update Error” to the secondary output of “Loop Over Items” node to continue processing next batch item.

10. **Optional: Add Sticky Notes**  
    - Add sticky notes near each logical block for documentation, referencing n8n docs for node types used.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Context or Link                                                                                         |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| This workflow streamlines your content publishing process by automatically creating draft blog posts on Hashnode from content stored in Airtable. Ideal for content creators, marketing teams, developers, and agencies managing multiple Hashnode publications.                                                                                                                                                                                                                                                                                                                                                                               | Overview of workflow purpose and target users.                                                        |
| Airtable table must include columns: Title, Content_markdown, Hashnode_Token, HashNode_Publication_Domain, and Status with options “Not Published”, “Published”, or “Error”.                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Airtable setup requirements.                                                                          |
| Hashnode API token must have permissions to create drafts and the publication domain must be valid.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Hashnode API requirements.                                                                            |
| For help or community support, join [Discord](https://discord.com/invite/XPKeKXeB7d) or visit the [n8n Forum](https://community.n8n.io/).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Support and community resources.                                                                      |
| Reference documentation for nodes used: [Airtable Node](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.airtable/), [HTTP Request Node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/), [IF Node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.if/), [SplitInBatches Node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.splitinbatches/) | Official n8n documentation links.                                                                    |

---

**Disclaimer:** The provided content originates exclusively from an automated workflow developed with n8n, adhering strictly to current content policies. It contains no illegal, offensive, or protected elements. All manipulated data is legal and publicly available.