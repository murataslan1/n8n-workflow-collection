Auto-Generate Social Posts from GitHub README/CHANGELOG Updates with GPT-4o and OAuth

https://n8nworkflows.xyz/workflows/auto-generate-social-posts-from-github-readme-changelog-updates-with-gpt-4o-and-oauth-7562


# Auto-Generate Social Posts from GitHub README/CHANGELOG Updates with GPT-4o and OAuth

### 1. Workflow Overview

This workflow automates the generation and publishing of social media posts on Twitter and LinkedIn based on updates to a GitHub repository’s README.md and CHANGELOG.md files. Triggered by GitHub push events, it checks if these key documentation files have changed, fetches their latest contents, uses an advanced language model (GPT-4o) to generate tailored social posts, and then publishes them automatically.

Logical blocks:

- **1.1 Input Reception:** Receives GitHub push webhook events.
- **1.2 Change Detection:** Filters pushes to continue only if README.md or CHANGELOG.md files were added or modified.
- **1.3 Content Retrieval:** Fetches README.md and CHANGELOG.md files via GitHub API and extracts their text.
- **1.4 Data Aggregation:** Merges and aggregates the fetched content into a single data structure.
- **1.5 AI Processing:** Sends aggregated content to GPT-4o language model with a detailed prompt, parses the structured JSON response containing Twitter and LinkedIn posts.
- **1.6 Social Publishing:** Posts the generated content to Twitter and LinkedIn using OAuth2 credentials.
- **1.7 Control and No-Op:** Stops workflow gracefully if no relevant files were changed.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** Listens for GitHub push events via a webhook to trigger the workflow.
- **Nodes Involved:**  
  - Webhook
- **Node Details:**

  - **Webhook**  
    - Type: HTTP Webhook (n8n native)  
    - Role: Entry point that receives POST requests from GitHub on push events.  
    - Configuration:  
      - HTTP Method: POST  
      - Path: `70b80513-b93c-4749-9a06-e78d4f1f2d23` (custom webhook path)  
    - Inputs: External HTTP POST payload from GitHub webhook  
    - Outputs: Push event JSON payload  
    - Version: 2  
    - Edge Cases:  
      - Missing or malformed payload could cause failures downstream.  
      - Webhook secret validation is optional but recommended at GitHub setup.  
      - Network or webhook URL misconfiguration may prevent triggering.

#### 2.2 Change Detection (Filter)

- **Overview:** Determines if the push contains changes to README.md or CHANGELOG.md files, allowing workflow continuation only on relevant updates.
- **Nodes Involved:**  
  - If  
  - No Operation, do nothing
- **Node Details:**

  - **If**  
    - Type: Conditional Node  
    - Role: Filters webhook payload commits to check if any commit added, modified, or removed files containing “changelog” (case-insensitive) in their path.  
    - Configuration:  
      - Condition: Boolean expression testing if any commit’s added/modified/removed files include “changelog” substring.  
      - Expression:  
        ```javascript
        ($json.body.commits ?? []).some(c =>
          [ ...(c.added ?? []), ...(c.modified ?? []), ...(c.removed ?? []) ]
            .some(f => String(f).toLowerCase().includes('changelog'))
        )
        ```  
    - Inputs: Webhook payload  
    - Outputs:  
      - True branch: Push includes changelog-related file changes  
      - False branch: No relevant file changes  
    - Version: 2.2  
    - Edge Cases:  
      - False negatives if filenames differ in unexpected casing or naming conventions.  
      - Empty commits array or missing fields can cause expression to fail.  

  - **No Operation, do nothing**  
    - Type: No-Op node  
    - Role: Terminates workflow gracefully on negative filter branch.  
    - Inputs: False output from If node  
    - Outputs: None  
    - Edge Cases: None

#### 2.3 Content Retrieval

- **Overview:** Fetches the latest README.md and CHANGELOG.md files from the repository identified in the push event.
- **Nodes Involved:**  
  - Get CHANGELOG  
  - Get README  
  - Extract from File CHANGELOG  
  - Extract from File README
- **Node Details:**

  - **Get CHANGELOG** and **Get README**  
    - Type: GitHub API node  
    - Role: Retrieve specific files (`CHANGELOG.md` and `README.md`) from the repository referenced in the webhook payload.  
    - Configuration:  
      - Owner: Fixed string `"jorge210488"`  
      - Repository: Dynamic expression from webhook JSON: `={{ $json.body.repository.name }}`  
      - File Path: `CHANGELOG.md` or `README.md` respectively  
      - Operation: Get file content  
      - Credentials: GitHub OAuth2 or PAT with read access  
    - Inputs: True branch output from If node (push event)  
    - Outputs: Binary file data for each file  
    - Version: 1.1  
    - Edge Cases:  
      - Repository or branch mismatch causing file not found errors.  
      - Permission errors on GitHub API calls.  

  - **Extract from File CHANGELOG** and **Extract from File README**  
    - Type: Extract from File node  
    - Role: Convert binary GitHub file contents into plain text  
    - Configuration: Operation set to `text`  
    - Inputs: Binary output from respective GitHub Get File nodes  
    - Outputs: JSON with file text under `data` property  
    - Version: 1  
    - Edge Cases:  
      - Corrupted or empty file content leading to empty strings.  

#### 2.4 Data Aggregation

- **Overview:** Combines the extracted text contents of README and CHANGELOG into a single item for unified AI processing.
- **Nodes Involved:**  
  - Merge  
  - Aggregate
- **Node Details:**

  - **Merge**  
    - Type: Merge node  
    - Role: Waits for both README and CHANGELOG text items; merges them side-by-side in one single item with two outputs.  
    - Configuration: Default (wait for both inputs)  
    - Inputs: Outputs from both Extract from File README and Extract from File CHANGELOG nodes  
    - Outputs: Combined item containing both file texts as separate data entries  
    - Version: 3.2  
    - Edge Cases:  
      - One file missing or delayed can stall workflow.  

  - **Aggregate**  
    - Type: Aggregate node  
    - Role: Aggregates merged data into a single item with an array holding both documents’ text data.  
    - Configuration: Aggregate method `aggregateAllItemData`  
    - Inputs: Output from Merge node  
    - Outputs: Single JSON object with `data` array containing README and CHANGELOG texts  
    - Version: 1  
    - Edge Cases: None significant.

#### 2.5 AI Processing

- **Overview:** Uses GPT-4o with a detailed prompt to generate social media posts, then parses the structured JSON output.
- **Nodes Involved:**  
  - Basic LLM Chain  
  - OpenAI Chat Model  
  - Structured Output Parser
- **Node Details:**

  - **Basic LLM Chain**  
    - Type: LangChain LLM Chain node  
    - Role: Prepares prompt including README and CHANGELOG text, forwards to OpenAI, and expects structured JSON output of posts.  
    - Configuration:  
      - Text input template embedding README and CHANGELOG content  
      - Prompt includes detailed instructions for generating Twitter and LinkedIn posts, enforcing length, formatting, and content extraction rules.  
      - Uses Structured Output Parser to enforce JSON output format with keys: `"twitter"` and `"linkedin"`.  
    - Inputs: Aggregated data containing README and CHANGELOG text  
    - Outputs: JSON with generated posts  
    - Version: 1.7  
    - Edge Cases:  
      - API rate limits or errors from OpenAI.  
      - Prompt misinterpretation or incomplete inputs causing malformed JSON output.  

  - **OpenAI Chat Model**  
    - Type: LangChain OpenAI chat model node  
    - Role: Calls OpenAI GPT-4o-mini model with prompt from Basic LLM Chain.  
    - Configuration:  
      - Model: `gpt-4o-mini`  
      - Credentials: OpenAI API key  
    - Inputs: Prompt text from Basic LLM Chain  
    - Outputs: Raw AI chat response forwarded to parser  
    - Version: 1.2  
    - Edge Cases: API failures, network issues.

  - **Structured Output Parser**  
    - Type: LangChain output parser node  
    - Role: Parses AI output into strictly formatted JSON with `twitter` and `linkedin` keys.  
    - Configuration: JSON schema example provided for validation.  
    - Inputs: Raw AI chat output  
    - Outputs: Parsed structured JSON for subsequent posting.  
    - Version: 1.2  
    - Edge Cases: Parsing errors if AI output deviates from schema.

#### 2.6 Social Publishing

- **Overview:** Posts the generated social media content to Twitter and LinkedIn on behalf of the authenticated user.
- **Nodes Involved:**  
  - Post tweet  
  - LinkedIn
- **Node Details:**

  - **Post tweet**  
    - Type: Twitter node (OAuth2)  
    - Role: Publishes the generated tweet text to Twitter account.  
    - Configuration:  
      - Text: Expression retrieving `twitter` field from AI output JSON  
      - Credentials: OAuth2 app with read/write permissions and relevant scopes  
    - Inputs: JSON output from Basic LLM Chain  
    - Outputs: API response confirmation  
    - Version: 2  
    - Edge Cases:  
      - Twitter API rate limits, permission errors, text length exceeding limits (should be handled by prompt logic).  

  - **LinkedIn**  
    - Type: LinkedIn node (OAuth2 Person)  
    - Role: Posts the LinkedIn long-form post on user’s LinkedIn profile.  
    - Configuration:  
      - Text: Expression retrieving `linkedin` field from AI output JSON  
      - Person ID: fixed user identifier (e.g., `nUdV-_cHkk`)  
      - Credentials: OAuth2 token with `w_member_social` and `openid` scopes  
    - Inputs: JSON output from Basic LLM Chain  
    - Outputs: API response confirmation  
    - Version: 1  
    - Edge Cases:  
      - Permission scope missing or expired tokens.  
      - LinkedIn API errors or rate limits.

---

### 3. Summary Table

| Node Name                   | Node Type                           | Functional Role                      | Input Node(s)                   | Output Node(s)                 | Sticky Note                                                                                                               |
|-----------------------------|-----------------------------------|------------------------------------|--------------------------------|-------------------------------|--------------------------------------------------------------------------------------------------------------------------|
| Webhook                     | n8n-nodes-base.webhook             | Receives GitHub push webhook       | External HTTP POST             | If                            | # GitHub Push → README & CHANGELOG check (Setup instructions for GitHub webhook)                                          |
| If                          | n8n-nodes-base.if                  | Filters pushes for README/CHANGELOG changes | Webhook                       | Get CHANGELOG, Get README; No Operation, do nothing | # GitHub Push → README & CHANGELOG check (Filter logic explained)                                                        |
| No Operation, do nothing     | n8n-nodes-base.noOp                | Stops workflow if no relevant changes | If (False branch)             | None                          | # GitHub Push → README & CHANGELOG check (No operation on false filter)                                                   |
| Get README                  | n8n-nodes-base.github              | Fetches README.md file             | If (True branch)               | Extract from File README       | # GitHub → Extract → Merge/Aggregate (GitHub file fetch setup)                                                            |
| Get CHANGELOG               | n8n-nodes-base.github              | Fetches CHANGELOG.md file          | If (True branch)               | Extract from File CHANGELOG    | # GitHub → Extract → Merge/Aggregate (GitHub file fetch setup)                                                            |
| Extract from File README    | n8n-nodes-base.extractFromFile     | Extracts text from README binary   | Get README                    | Merge                         | # GitHub → Extract → Merge/Aggregate (Extract text operation)                                                             |
| Extract from File CHANGELOG | n8n-nodes-base.extractFromFile     | Extracts text from CHANGELOG binary| Get CHANGELOG                 | Merge                         | # GitHub → Extract → Merge/Aggregate (Extract text operation)                                                             |
| Merge                       | n8n-nodes-base.merge               | Combines README and CHANGELOG data | Extract from File README, Extract from File CHANGELOG | Aggregate                     | # GitHub → Extract → Merge/Aggregate (Waits for both file texts)                                                          |
| Aggregate                   | n8n-nodes-base.aggregate           | Aggregates merged data             | Merge                         | Basic LLM Chain               | # GitHub → Extract → Merge/Aggregate (Combine data into array for AI)                                                     |
| Basic LLM Chain             | @n8n/n8n-nodes-langchain.chainLlm | Prepares prompt and processes AI output | Aggregate, OpenAI Chat Model, Structured Output Parser | Post tweet, LinkedIn          | # LLM → Post to Twitter & LinkedIn (Detailed prompt for social posts generation)                                           |
| OpenAI Chat Model           | @n8n/n8n-nodes-langchain.lmChatOpenAi | Calls OpenAI GPT-4o                | Basic LLM Chain               | Structured Output Parser       | # LLM → Post to Twitter & LinkedIn (OpenAI model call)                                                                     |
| Structured Output Parser    | @n8n/n8n-nodes-langchain.outputParserStructured | Parses AI output JSON              | OpenAI Chat Model             | Basic LLM Chain               | # LLM → Post to Twitter & LinkedIn (Validates AI output format)                                                            |
| Post tweet                 | n8n-nodes-base.twitter             | Posts tweet to Twitter             | Basic LLM Chain               | None                         | # LLM → Post to Twitter & LinkedIn (OAuth2 credentials required)                                                           |
| LinkedIn                   | n8n-nodes-base.linkedIn            | Posts LinkedIn update              | Basic LLM Chain               | None                         | # LLM → Post to Twitter & LinkedIn (OAuth2 Person with `w_member_social` scope required)                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook node:**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: Use a unique string (e.g., `github/push`)  
   - Save and activate webhook for GitHub push events.

2. **Create If node:**  
   - Type: If  
   - Condition: Boolean expression (version 2)  
   - Expression:  
     ```javascript
     ($json.body.commits ?? []).some(c =>
       [ ...(c.added ?? []), ...(c.modified ?? []), ...(c.removed ?? []) ]
         .some(f => String(f).toLowerCase().includes('changelog'))
     )
     ```  
   - Connect Webhook node output to If node input.

3. **Create No Operation node:**  
   - Type: NoOp  
   - Connect If node's False output to No Operation node.

4. **Create two GitHub nodes:**  
   - Type: GitHub  
   - Operation: Get file  
   - Owner: Fixed string `"jorge210488"`  
   - Repository: Set to expression `={{ $json.body.repository.name }}`  
   - File Path: One node with `README.md`, the other with `CHANGELOG.md`  
   - Credentials: GitHub OAuth2 or PAT with repo read access  
   - Connect If node's True output to both GitHub nodes.

5. **Create two Extract from File nodes:**  
   - Type: Extract from File  
   - Operation: text  
   - Connect each GitHub node to its corresponding Extract from File node.

6. **Create Merge node:**  
   - Type: Merge  
   - Mode: Wait for both inputs  
   - Connect both Extract from File nodes' outputs to Merge node inputs.

7. **Create Aggregate node:**  
   - Type: Aggregate  
   - Aggregate method: aggregateAllItemData  
   - Connect Merge node output to Aggregate node input.

8. **Create Basic LLM Chain node:**  
   - Type: LangChain LLM Chain  
   - Prompt text: Use the provided detailed prompt embedding README and CHANGELOG as variables.  
   - Enable structured output parser expecting JSON with `twitter` and `linkedin` fields.  
   - Connect Aggregate node output to Basic LLM Chain node input.

9. **Create OpenAI Chat Model node:**  
   - Type: LangChain OpenAI Chat Model  
   - Model: `gpt-4o-mini`  
   - Credentials: OpenAI API key  
   - Connect Basic LLM Chain node’s AI language model input to this node.

10. **Create Structured Output Parser node:**  
    - Type: LangChain Output Parser Structured  
    - JSON schema: Example with `twitter` and `linkedin` keys as strings  
    - Connect OpenAI Chat Model output to this parser node, then connect parser output back to Basic LLM Chain node’s output parser input.

11. **Create Twitter node:**  
    - Type: Twitter  
    - Text: Expression `={{ $json.output.twitter }}`  
    - Credentials: OAuth2 with read/write tweet permissions and scopes `tweet.read tweet.write users.read offline.access`  
    - Connect Basic LLM Chain output to Twitter node input.

12. **Create LinkedIn node:**  
    - Type: LinkedIn  
    - Text: Expression `={{ $json.output.linkedin }}`  
    - Person: Use appropriate LinkedIn user ID (e.g., `nUdV-_cHkk`)  
    - Credentials: OAuth2 with scopes `w_member_social` and `openid`  
    - Connect Basic LLM Chain output to LinkedIn node input.

13. **Final connections:**  
    - Webhook → If  
    - If True → Get CHANGELOG & Get README  
    - Get CHANGELOG → Extract from File CHANGELOG  
    - Get README → Extract from File README  
    - Both Extract nodes → Merge  
    - Merge → Aggregate  
    - Aggregate → Basic LLM Chain  
    - Basic LLM Chain → OpenAI Chat Model (AI model input)  
    - OpenAI Chat Model → Structured Output Parser  
    - Structured Output Parser → Basic LLM Chain (output parser)  
    - Basic LLM Chain → Twitter and LinkedIn nodes

14. **GitHub webhook setup:**  
    - Repository settings → Webhooks → Add webhook  
    - Payload URL: `https://<your-n8n-domain>/webhook/github/push` (match your Webhook path)  
    - Content type: `application/json`  
    - Event: Push only  
    - Secret: Optional  
    - Branch filters: As needed

15. **Credential setup:**  
    - GitHub OAuth2 or PAT with read repo access  
    - OpenAI API key  
    - Twitter OAuth2 app with appropriate scopes  
    - LinkedIn OAuth2 with `w_member_social` and `openid` scopes

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                       | Context or Link                                                                                             |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| GitHub webhook must be configured to send Push events with JSON payload to the n8n webhook URL. The webhook secret is optional but recommended for security. Branch filters can restrict which pushes trigger the workflow.                                                                                                                                                         | GitHub Webhook setup instructions                                                                           |
| Twitter API credentials require OAuth2 with scopes for reading and writing tweets (`tweet.read tweet.write users.read offline.access`).                                                                                                                                                                                                                                          | Twitter developer portal                                                                                     |
| LinkedIn API credentials require OAuth2 with at least `w_member_social` and `openid` scopes to post as the authenticated user.                                                                                                                                                                                                                                                   | LinkedIn developer documentation                                                                             |
| The LLM prompt is carefully designed to produce structured JSON output, enforce length and style constraints, and extract repository URLs and project names reliably. Avoid modifying prompt without understanding its logic.                                                                                                                                                        | Prompt included in Basic LLM Chain node                                                                    |
| The workflow uses the latest LangChain nodes available in n8n for robust AI integration, including output parsing to ensure consistent JSON output.                                                                                                                                                                                                                              | n8n LangChain nodes                                                                                            |
| The workflow gracefully stops processing if the push event does not include README or CHANGELOG changes to avoid unnecessary API calls and post attempts.                                                                                                                                                                                                                        | Logical filter using the If node                                                                             |

---

**Disclaimer:** This documentation is based exclusively on a workflow created with n8n automation tool, fully compliant with content policies, handling only legal and public data.