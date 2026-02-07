AI-Generated Account Briefs with MadKudu, OpenAI & Salesforce for Outreach

https://n8nworkflows.xyz/workflows/ai-generated-account-briefs-with-madkudu--openai---salesforce-for-outreach-6815


# AI-Generated Account Briefs with MadKudu, OpenAI & Salesforce for Outreach

### 1. Workflow Overview

This n8n workflow automates the generation and delivery of AI-crafted account briefs for selected Salesforce accounts, leveraging MadKudu MCP, OpenAI, and Outreach. Its primary purpose is to provide sales teams with concise, AI-generated summaries enriched by MadKudu’s data signals and external research, automatically synced into Outreach CRM custom fields. This enhances sales outreach relevance by reducing manual data gathering.

The workflow logically divides into three core blocks:

- **1.1 Input Reception:** Trigger the workflow manually and retrieve Salesforce accounts filtered by MadKudu scoring criteria.
- **1.2 AI Processing:** Use MadKudu MCP and OpenAI to generate a tailored account brief summarizing key account insights.
- **1.3 Output Integration:** Locate matching Outreach accounts by domain and update a custom field with the generated brief for sales use.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
This block initiates the workflow manually and queries Salesforce to select accounts based on MadKudu scoring filters. It ensures that only high-fit and high-likelihood-to-buy accounts are processed, allowing initial testing with a single account limit.

**Nodes Involved:**  
- When clicking ‘Execute workflow’  
- Get accounts  
- Sticky Note2  
- Sticky Note9  

**Node Details:**

- **When clicking ‘Execute workflow’**  
  - *Type & Role:* Manual Trigger node to start the workflow on user command.  
  - *Configuration:* No parameters; triggers workflow execution manually.  
  - *Connections:* Outputs to Get accounts node.  
  - *Edge cases:* No automatic triggering; requires manual action. For production, recommend replacing with a schedule trigger.  
  - *Sticky Notes:* Explains manual start and suggests schedule trigger for automation.

- **Get accounts**  
  - *Type & Role:* Salesforce node to fetch accounts matching criteria.  
  - *Configuration:* Retrieves fields `id, name, website, ownerid, numberofemployees` with filter conditions: `mk_customer_fit_score__c >= 90` and `mk_likelihood_to_buy_score__c >= 90`. Limit set to 1 for testing.  
  - *Connections:* Output feeds into AI Agent node.  
  - *Credentials:* Uses Salesforce OAuth2.  
  - *Edge cases:* Salesforce API errors, auth failures, or empty results if no accounts match filters. Limit must be adjusted when scaling.  
  - *Sticky Notes:* Notes on editing Salesforce filters and removing limit for production.

- **Sticky Note2**  
  - *Purpose:* Describes the selection criteria for Salesforce accounts and testing limit advice.

- **Sticky Note9**  
  - *Purpose:* Provides instructions to start the workflow manually and recommendation to use schedule trigger for regular runs.

---

#### 1.2 AI Processing

**Overview:**  
This block uses MadKudu’s MCP tool combined with an OpenAI GPT-4 model to generate an intelligent, plain-English account brief. It incorporates MadKudu data, company news, CRM info, and other signals to create a sales-focused summary structured by MadKudu’s briefing instructions.

**Nodes Involved:**  
- MadKudu MCP  
- OpenAI Model  
- AI Agent - Research Accounts  
- Sticky Note (labeled 0821e180)  
- Sticky Note7  

**Node Details:**

- **MadKudu MCP**  
  - *Type & Role:* MadKudu MCP Client Tool to access MadKudu's streaming SSE endpoint, feeding account data and instructions to the AI agent.  
  - *Configuration:* SSE endpoint URL dynamically built using stored variable `madkudu_api_key`.  
  - *Connections:* Inputs to AI Agent as an AI tool.  
  - *Edge cases:* API key misconfiguration, network issues, or service downtime.  
  - *Sticky Notes:* Explains how to store MadKudu API key as a variable for secure usage.

- **OpenAI Model**  
  - *Type & Role:* Language Model node using GPT-4.1-mini for generating natural language output.  
  - *Configuration:* Model explicitly set to “gpt-4.1-mini”. No additional options set.  
  - *Connections:* Provides language model capability to AI Agent.  
  - *Credentials:* Uses OpenAI API credentials with free credits.  
  - *Edge cases:* API rate limits, auth failures, or model unavailability.

- **AI Agent - Research Accounts**  
  - *Type & Role:* LangChain Agent node orchestrating AI tools to generate account brief.  
  - *Configuration:* Prompt instructs to generate a MadKudu-style account brief for each account using its website domain, leveraging MadKudu MCP tool with predefined instructions.  
  - *Connections:* Receives input from Get accounts; outputs to Get Outreach Account ID.  
  - *Edge cases:* Expression failures in dynamic prompt, data missing for account, or tool communication errors.

- **Sticky Note (0821e180)**  
  - *Purpose:* Provides detailed explanation of how MadKudu MCP and OpenAI combine to create the account brief, including the briefing structure (“Intro, Why, Why now, Why us, Risks”).

- **Sticky Note7**  
  - *Purpose:* Instructions on setting up MadKudu API key as an n8n variable for the MCP tool.

---

#### 1.3 Output Integration

**Overview:**  
This block locates the corresponding Outreach account by the website domain and writes the generated account brief into a designated custom field. It ensures sales reps have immediate access to updated account insights within Outreach CRM.

**Nodes Involved:**  
- Get Outreach Account ID  
- Send Brief to Outreach Account custom field  
- Sticky Note1  
- Sticky Note4  
- Sticky Note6  

**Node Details:**

- **Get Outreach Account ID**  
  - *Type & Role:* HTTP Request node to query Outreach API for account matching the Salesforce account's website domain.  
  - *Configuration:* Sends GET request to Outreach endpoint filtering by domain extracted dynamically from Salesforce data.  
  - *Connections:* Outputs to node that sends the brief.  
  - *Credentials:* OAuth2 credentials for Outreach.  
  - *Edge cases:* OAuth token expiry, domain mismatches, or API rate limits.

- **Send Brief to Outreach Account custom field**  
  - *Type & Role:* HTTP Request node performing PATCH to update Outreach account’s custom field with the AI-generated brief.  
  - *Configuration:*  
    - URL dynamically constructed using Outreach account ID from previous node.  
    - JSON body updates `custom49` field with AI Agent output (stringified JSON).  
    - Method: PATCH, content type: JSON.  
  - *Credentials:* OAuth2 for Outreach.  
  - *Edge cases:* API failure, invalid custom field ID, or JSON parsing errors.  
  - *Sticky Notes:* Emphasizes editing the custom field ID (`custom49`) in the JSON body to avoid overwriting wrong fields.

- **Sticky Note1**  
  - *Purpose:* Explains the process of matching Outreach account and updating custom field, with emphasis on custom field ID editing.

- **Sticky Note4**  
  - *Purpose:* Highlights the need to edit the custom field ID in the last node’s JSON body.

- **Sticky Note6**  
  - *Purpose:* Provides detailed instructions for setting up Outreach OAuth2 credentials, including steps on Outreach developer portal and required scopes (`accounts.read`, `accounts.write`).

---

### 3. Summary Table

| Node Name                           | Node Type                         | Functional Role                                 | Input Node(s)                  | Output Node(s)                          | Sticky Note                                                                                          |
|-----------------------------------|----------------------------------|------------------------------------------------|--------------------------------|---------------------------------------|----------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’  | Manual Trigger                   | Initiates workflow manually                     | -                              | Get accounts                          | Start the Workflow Manually: explains manual trigger and suggests schedule trigger for production  |
| Get accounts                      | Salesforce                      | Queries Salesforce for filtered accounts        | When clicking ‘Execute workflow’ | AI Agent - Research Accounts          | Edit Salesforce filter rules and limit (limit=1 for testing)                                        |
| MadKudu MCP                      | MadKudu MCP Client Tool          | Provides MadKudu data and context to AI agent  | -                              | AI Agent - Research Accounts (ai_tool) | How to connect MadKudu MCP: use n8n variable for API key                                           |
| OpenAI Model                     | Language Model (OpenAI GPT-4)    | Supplies GPT-4.1-mini model for AI generation   | -                              | AI Agent - Research Accounts (ai_languageModel) | -                                                                                                  |
| AI Agent - Research Accounts      | LangChain Agent                  | Generates AI account brief using MadKudu + GPT | Get accounts, MadKudu MCP, OpenAI Model | Get Outreach Account ID              | Generates account brief: “Intro, Why, Why now, Why us, Risks” structure                             |
| Get Outreach Account ID           | HTTP Request                    | Retrieves Outreach account ID by domain         | AI Agent - Research Accounts    | Send Brief to Outreach Account custom field | How to connect Outreach: OAuth2 setup instructions                                                |
| Send Brief to Outreach Account custom field | HTTP Request               | Updates Outreach account custom field with brief | Get Outreach Account ID          | -                                     | Edit custom field ID (custom49) in JSON body to avoid overwriting                                  |
| Sticky Note (0821e180)            | Sticky Note                    | Explains AI brief generation step                | -                              | -                                     | Details MadKudu MCP + OpenAI brief generation                                                     |
| Sticky Note1                     | Sticky Note                    | Explains Outreach update step                    | -                              | -                                     | Explains matching Outreach account and writing brief                                             |
| Sticky Note2                     | Sticky Note                    | Explains Salesforce account selection step      | -                              | -                                     | Salesforce filters and testing limit                                                             |
| Sticky Note3                     | Sticky Note                    | Comprehensive workflow description                | -                              | -                                     | Overview and usage instructions with links to docs                                               |
| Sticky Note4                     | Sticky Note                    | Reminder to edit custom field ID                  | -                              | -                                     | Emphasizes editing custom field ID                                                               |
| Sticky Note5                     | Sticky Note                    | Explains manual start trigger                     | -                              | -                                     | Manual execution details and schedule trigger recommendation                                     |
| Sticky Note6                     | Sticky Note                    | Outreach OAuth2 credential setup instructions    | -                              | -                                     | Detailed OAuth2 setup steps and required scopes                                                  |
| Sticky Note7                     | Sticky Note                    | MadKudu API key setup instructions                | -                              | -                                     | Storing MadKudu API key as n8n variable                                                          |
| Sticky Note8                     | Sticky Note                    | Reminder to edit Salesforce filter and limit     | -                              | -                                     | Edit Salesforce filter rules and limit                                                           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - Purpose: To start the workflow manually.  
   - Leave default parameters. Connect its output to the next node.

2. **Add Salesforce Node to Get Accounts**  
   - Type: Salesforce  
   - Operation: Get All accounts  
   - Fields: `id, name, website, ownerid, numberofemployees`  
   - Conditions:  
     - `mk_customer_fit_score__c >= 90`  
     - `mk_likelihood_to_buy_score__c >= 90`  
   - Limit: 1 (for testing)  
   - Credentials: Configure Salesforce OAuth2 credentials.  
   - Connect Manual Trigger → Salesforce node.

3. **Add MadKudu MCP Client Tool Node**  
   - Type: MadKudu MCP Client Tool  
   - Parameters: SSE Endpoint URL set as `https://mcp.madkudu.com/{{$vars.madkudu_api_key}}/sse`  
   - Store your MadKudu API key as an n8n variable named `madkudu_api_key`.  
   - No connections directly from input; connects as AI tool to AI Agent node.

4. **Add OpenAI Model Node**  
   - Type: Language Model (OpenAI GPT)  
   - Model: `gpt-4.1-mini`  
   - Credentials: Use OpenAI API credentials.  
   - Connect as AI language model tool input to AI Agent node.

5. **Add LangChain Agent Node (AI Agent - Research Accounts)**  
   - Type: LangChain Agent  
   - Parameters:  
     - Prompt:  
       ```
       For each account, with their {{ $json.Website }}, use MadKudu MCP to generate an account brief (madkudu-account-brief-instructions tool)
       ```  
   - Connect inputs:  
     - Main input from Salesforce Get accounts node.  
     - AI tool input from MadKudu MCP node.  
     - AI language model input from OpenAI Model node.  
   - Output connects to next block.

6. **Add HTTP Request Node to Get Outreach Account ID**  
   - Type: HTTP Request  
   - Method: GET  
   - URL: `https://api.outreach.io/api/v2/accounts?filter[domain]={{ $('Get accounts').item.json.Website }}`  
   - Authentication: OAuth2 with Outreach credentials.  
   - Connect input from AI Agent node output.

7. **Add HTTP Request Node to Send Brief to Outreach**  
   - Type: HTTP Request  
   - Method: PATCH  
   - URL: `https://api.outreach.io/api/v2/accounts/{{ JSON.parse($('Get Outreach Account ID').item.json.data).data[0].id }}`  
   - Body (raw JSON):  
     ```json
     {
       "data": {
         "type": "account",
         "id": "{{ JSON.parse($('Get Outreach Account ID').item.json.data).data[0].id }}",
         "attributes": {
           "custom49": {{ JSON.stringify($('AI Agent - Research Accounts').item.json.output) }}
         }
       }
     }
     ```  
   - Content-Type: JSON  
   - Authentication: OAuth2 with Outreach credentials.  
   - Connect input from Get Outreach Account ID node.

8. **Credential Setup:**  
   - Salesforce OAuth2: Configure with proper client ID/secret and user access.  
   - OpenAI API: Use your API key with model access.  
   - Outreach OAuth2:  
     - Register app in Outreach Developer Portal.  
     - Enable `accounts.read` and `accounts.write` scopes.  
     - Set redirect URI to n8n callback URL.  
     - Enter Outreach Application ID and Secret in n8n OAuth2 credentials.  
     - Authenticate and save.

9. **Variables Setup:**  
   - Create variable `madkudu_api_key` in n8n to securely store the MadKudu API key.

10. **Testing and Scaling:**  
    - Initially, keep Salesforce account limit to 1 for testing.  
    - Verify outputs at each step.  
    - When stable, increase limit or adjust filters for production use.  
    - Edit the target custom field ID (`custom49`) in the PATCH node if your Outreach instance uses a different custom field.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                 | Context or Link                                                                                                      |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| This workflow automates AI-generated account briefs to provide sales teams with concise, relevant context inside Outreach CRM, leveraging MadKudu’s data enrichment and OpenAI’s language generation.                                                                                                                                                                         | Workflow purpose statement                                                                                           |
| To connect Outreach OAuth2, follow these steps: create app in [Outreach developer portal](https://developers.outreach.io/apps/), set redirect URI to n8n callback, enable `accounts.read` and `accounts.write` scopes, and enter credentials in n8n.                                                                                                                            | Sticky Note6 instructions                                                                                            |
| Store the MadKudu API key as an n8n variable named `madkudu_api_key` for secure injection into the MCP SSE endpoint URL.                                                                                                                                                                                                                                                    | Sticky Note7 instructions                                                                                            |
| Use your own Salesforce filters to select accounts; recommended filters include MadKudu Customer Fit and Likelihood to Buy scores above 90. Limit initial runs to 1 account for testing.                                                                                                                                                                                      | Sticky Note2 and Sticky Note8 recommendations                                                                        |
| The AI-generated account brief follows a MadKudu structure: “Intro, Why, Why now, Why us, Risks” for sales relevance.                                                                                                                                                                                                                                                        | Sticky Note (0821e180)                                                                                                |
| For help and documentation, refer to [n8n docs](https://docs.n8n.io/), [MadKudu MCP docs](https://developers.madkudu.com/madkudu-mcp/what-is-madkudu-mcp) or contact MadKudu product support at product@madkudu.com.                                                                                                                                                           | Sticky Note3 content                                                                                                 |

---

**Disclaimer:**  
The provided content is derived solely from an n8n automation workflow using legal and public data, fully compliant with content policies. No illegal, offensive, or protected data is included.