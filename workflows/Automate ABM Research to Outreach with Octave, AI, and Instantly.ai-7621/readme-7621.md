Automate ABM Research to Outreach with Octave, AI, and Instantly.ai

https://n8nworkflows.xyz/workflows/automate-abm-research-to-outreach-with-octave--ai--and-instantly-ai-7621


# Automate ABM Research to Outreach with Octave, AI, and Instantly.ai

### 1. Workflow Overview

This workflow automates a complete Account-Based Marketing (ABM) outreach process by integrating Octave’s context engine, AI-driven research, and the Instantly.ai email campaign platform. It is designed primarily for revenue teams, ABM professionals, and growth operators who require a unified, context-aware go-to-market (GTM) pipeline that preserves and leverages rich market context throughout each step.

The workflow is logically structured into the following blocks:

- **1.1 Account Input:** Reception of inbound account data via webhook.
- **1.2 External Context Research:** AI-powered gathering of contextual information about the account.
- **1.3 Company Qualification:** Use of Octave agents to score and qualify companies based on product and segment fit.
- **1.4 Filtering:** Filtering out accounts that do not meet the qualification threshold.
- **1.5 Prospecting Contacts:** Using Octave to find relevant contacts within qualified companies.
- **1.6 Splitting Contacts:** Splitting contact lists for individual sequential processing.
- **1.7 Sequence Generation:** Creating personalized outreach sequences contextualized by research data.
- **1.8 Campaign Deployment:** Sending contextualized outreach messages via Instantly.ai email campaigns.

---

### 2. Block-by-Block Analysis

#### 2.1 Account Input

- **Overview:** Captures incoming account data through a webhook, serving as the entry point for the workflow.
- **Nodes Involved:**  
  - Account Data Webhook  
  - Sticky Note - Account Input
- **Node Details:**

  - **Account Data Webhook**  
    - Type: Webhook  
    - Role: Entry point, receives account payloads (e.g., companyName, companyDomain).  
    - Configuration: Custom webhook path and ID must be set by user. No authentication specified—ensure security externally if needed.  
    - Inputs: External HTTP request with account data.  
    - Outputs: Emits JSON payload with account details.  
    - Edge Cases: Missing or malformed account data; webhook not reachable or misconfigured path.

  - **Sticky Note - Account Input**  
    - Type: Sticky Note  
    - Role: Documentation to indicate this is where account info enters.  
    - No input/output connections.

#### 2.2 External Context Research

- **Overview:** Uses an AI agent (LangChain) to research open roles the target company is hiring for, providing context for personalized outreach.
- **Nodes Involved:**  
  - Research External Context  
  - LLM Model (optional, for testing)  
  - Sticky Note - Context Research  
  - Sticky Note - LLM Model (optional)
- **Node Details:**

  - **Research External Context**  
    - Type: LangChain Agent Node  
    - Role: Queries external or AI-based data sources to find or fabricate an open job role relevant to the company domain.  
    - Configuration: Prompt designed to return normalized job titles with no extraneous text.  
    - Inputs: Receives company domain from webhook node.  
    - Outputs: Single string output with job title.  
    - Edge Cases: No real open roles found; fallback to dummy role without justification text; prompt failures.

  - **LLM Model**  
    - Type: Anthropic LLM Chat Node (optional)  
    - Role: Provides language model API for AI processing; linked as a language model for the Research node.  
    - Configuration: Requires Anthropic API credentials and LLM model selection.  
    - Inputs: Connected as AI model source for Research External Context.  
    - Edge Cases: Authentication failure, API rate limits, model unavailability.

  - **Sticky Notes** provide contextual guidance and indicate the optional nature of the LLM node for testing.

#### 2.3 Company Qualification

- **Overview:** Uses Octave’s company qualification agent to score companies based on product-market fit and segmentation.
- **Nodes Involved:**  
  - Qualify Company with Octave  
  - Sticky Note - Company Qualification
- **Node Details:**

  - **Qualify Company with Octave**  
    - Type: OctaveHQ Node (qualifyCompany operation)  
    - Role: Sends company name and domain to Octave API to get qualification score.  
    - Configuration: Requires Octave agent ID for qualification agent, and Octave API credentials.  
    - Inputs: Account data JSON from Research External Context node.  
    - Outputs: JSON including a numeric score field.  
    - Edge Cases: API authentication failure, invalid agent ID, network timeout.

#### 2.4 Filtering

- **Overview:** Filters out companies with qualification scores below a threshold to focus on high-value targets.
- **Nodes Involved:**  
  - Filter Qualified Companies  
  - Sticky Note - Filter
- **Node Details:**

  - **Filter Qualified Companies**  
    - Type: Filter Node  
    - Role: Allows only companies with a score > 1 to proceed.  
    - Configuration: Numeric condition set on `$json.score > 1`.  
    - Inputs: Output from Octave qualification node.  
    - Outputs: Passes qualified companies downstream; others discarded.  
    - Edge Cases: Missing score field, unexpected data types.

#### 2.5 Prospecting Contacts

- **Overview:** Uses Octave’s prospector agent to find relevant contacts within qualified companies.
- **Nodes Involved:**  
  - Discover Relevant Contacts  
  - Sticky Note - Prospector
- **Node Details:**

  - **Discover Relevant Contacts**  
    - Type: OctaveHQ Node (runProspector operation)  
    - Role: Fetches a list of contacts for a given company domain.  
    - Configuration: Requires prospector agent ID and Octave credentials.  
    - Inputs: Company domain from filtered companies.  
    - Outputs: JSON with an array of contacts (field `contacts`).  
    - Edge Cases: Empty contact lists, API failures.

#### 2.6 Splitting Contacts

- **Overview:** Splits the contacts array into individual items for processing each contact separately downstream.
- **Nodes Involved:**  
  - Split Contacts for Processing  
  - Sticky Note - Split Contacts
- **Node Details:**

  - **Split Contacts for Processing**  
    - Type: SplitOut Node  
    - Role: Splits the `contacts` array into separate workflow executions per contact.  
    - Configuration: Splits on the field named `contacts`.  
    - Inputs: Contacts array from Prospector node.  
    - Outputs: Single contact per output item.  
    - Edge Cases: Empty contacts array, data structure changes.

#### 2.7 Sequence Generation

- **Overview:** Generates personalized outreach sequences using Octave’s sequence agent, incorporating contact and research context.
- **Nodes Involved:**  
  - Generate Contextualized Sequences  
  - Sticky Note - Sequence Generation
- **Node Details:**

  - **Generate Contextualized Sequences**  
    - Type: OctaveHQ Node (runSequence operation)  
    - Role: Creates personalized email sequences based on contact info and runtime context from research.  
    - Configuration: Uses contact fields (job title, first name, company name/domain, LinkedIn profile) and context (hiring role from Research External Context). Requires sequence agent ID and Octave credentials.  
    - Inputs: Single contact JSON from split node and research output.  
    - Outputs: Sequences with email content and subjects, structured as an array under `emails`.  
    - Edge Cases: Missing contact fields, malformed context, API issues.

#### 2.8 Campaign Deployment

- **Overview:** Sends the generated sequences as leads into Instantly.ai campaigns for automated outreach.
- **Nodes Involved:**  
  - Deploy to Email Campaign  
  - Sticky Note - Campaign Deploy
- **Node Details:**

  - **Deploy to Email Campaign**  
    - Type: HTTP Request Node  
    - Role: Posts lead data to Instantly.ai API with campaign ID, contact info, and custom variables containing sequence emails and subjects.  
    - Configuration:  
      - URL: Instantly.ai leads API endpoint  
      - Method: POST  
      - Authentication: HTTP Bearer Token with API key credential  
      - Body: JSON with campaign ID, email, name, company, and custom variables (email sequence content and subjects)  
    - Inputs: Single contact with sequence data from Sequence Generation node.  
    - Outputs: API response from Instantly.ai.  
    - Edge Cases: Authentication failure, invalid campaign ID, rate limits, missing contact email fallback uses a demo email pattern.

---

### 3. Summary Table

| Node Name                      | Node Type                     | Functional Role            | Input Node(s)                 | Output Node(s)                  | Sticky Note                                                                                 |
|-------------------------------|-------------------------------|----------------------------|------------------------------|-------------------------------|---------------------------------------------------------------------------------------------|
| Account Data Webhook           | Webhook                       | Receives account data       | (external HTTP request)       | Research External Context       | 🚀 ACCOUNT INPUT Webhook for accounts. Replace with your source.                            |
| Research External Context      | LangChain Agent               | Gathers company hiring role | Account Data Webhook          | Qualify Company with Octave     | 🔍 CONTEXT RESEARCH External data gathering. Replace with data source.                      |
| LLM Model                     | Anthropic LLM Chat            | Provides AI model for research | - (connected as AI model)     | Research External Context (AI)  | 🧠 LLM MODEL Context processing. Optional for testing.                                     |
| Qualify Company with Octave    | OctaveHQ Node                 | Scores company qualification| Research External Context     | Filter Qualified Companies      | 🏢 COMPANY QUALIFICATION Product + Segment fit. Configure agent ID.                         |
| Filter Qualified Companies     | Filter                       | Filters qualified companies | Qualify Company with Octave   | Discover Relevant Contacts       | 🔍 FILTER Removes low scores. Adjust threshold.                                            |
| Discover Relevant Contacts     | OctaveHQ Node                 | Prospects relevant contacts | Filter Qualified Companies    | Split Contacts for Processing    | 👥 PROSPECTOR Find relevant contacts. Configure personas.                                  |
| Split Contacts for Processing  | SplitOut                     | Splits contacts array       | Discover Relevant Contacts    | Generate Contextualized Sequences | 📋 SPLIT CONTACTS Individual processing. Handles multiple contacts.                         |
| Generate Contextualized Sequences | OctaveHQ Node            | Generates personalized sequences | Split Contacts for Processing | Deploy to Email Campaign         | ⚡ RUNTIME SEQUENCES Context + personalization. Configure agent ID.                         |
| Deploy to Email Campaign       | HTTP Request                 | Sends leads to Instantly.ai | Generate Contextualized Sequences | (end)                          | 📧 CAMPAIGN DEPLOY Automated outreach. Update platform & ID.                               |
| Sticky Note - Main Overview    | Sticky Note                  | Workflow overview           | -                            | -                             | 🎯 COMPLETE ACCOUNT-BASED OUTREACH PIPELINE FOR: Revenue teams, ABM professionals, growth operators. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Webhook Node (Account Data Webhook):**  
   - Type: Webhook  
   - Configure path (e.g., `/your-webhook-path-here`) and webhook ID (unique identifier).  
   - This node receives JSON with account info, at minimum `companyName` and `companyDomain`.

2. **Create a LangChain Agent Node (Research External Context):**  
   - Type: LangChain Agent  
   - Set prompt to:  
     ```
     Output the name of an open role that {{ $json.body.companyDomain }} is hiring for. If you can't find a role they are hiring for, make up a basic one that would make sense for them to hire for. Normalize the job title to something that would be used in an internal email (e.g "software engineer" instead of "Sr. Software Engineer II"). Output just the name of the role and nothing else, with no pretext or posttext.
     ```  
   - Connect input from the webhook node output.  
   - Optionally, set the LangChain Agent to use an LLM model node.

3. **Create an Anthropic LLM Chat Node (LLM Model):**  
   - Type: Anthropic LLM Chat  
   - Select your model (e.g., `claude-v1`)  
   - Configure with Anthropic API credentials.  
   - Connect it as the AI language model for the LangChain Agent node.

4. **Create an OctaveHQ Node for Company Qualification (Qualify Company with Octave):**  
   - Type: OctaveHQ  
   - Operation: `qualifyCompany`  
   - Set `companyName` and `companyDomain` to the webhook data fields.  
   - Specify your Octave company qualification agent ID.  
   - Add Octave API credentials.

5. **Create a Filter Node (Filter Qualified Companies):**  
   - Type: Filter  
   - Condition: Pass only items where `score` > 1.  
   - Connect input from the qualification node output.

6. **Create an OctaveHQ Node for Prospector (Discover Relevant Contacts):**  
   - Type: OctaveHQ  
   - Operation: `runProspector`  
   - Input: Use the company domain from filtered companies.  
   - Use your Octave prospector agent ID and credentials.

7. **Create a SplitOut Node (Split Contacts for Processing):**  
   - Type: SplitOut  
   - Field to split: `contacts` array from prospector output.

8. **Create an OctaveHQ Node for Sequence Generation (Generate Contextualized Sequences):**  
   - Type: OctaveHQ  
   - Operation: `runSequence`  
   - Map contact data fields: jobTitle, firstName, companyName, companyDomain, LinkedIn profile URL.  
   - Use runtime context from the research node output (the hiring role).  
   - Provide your Octave sequence agent ID and credentials.

9. **Create an HTTP Request Node (Deploy to Email Campaign):**  
   - Type: HTTP Request (POST)  
   - URL: `https://api.instantly.ai/api/v2/leads`  
   - Authentication: HTTP Bearer Token with your Instantly.ai API key.  
   - Body (JSON):  
     - `campaign`: your campaign ID  
     - `email`: contact email (fallback to demo email if missing)  
     - `first_name`, `last_name`, `company_name` from contact  
     - `custom_variables`: JSON object containing emails and subjects from sequence generation output  
   - Connect input from sequence generation output.

10. **Add Sticky Notes as documentation:**  
    - Place sticky notes near each block with relevant usage instructions and configuration tips.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                             | Context or Link                                                                                   |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| 🎯 COMPLETE ACCOUNT-BASED OUTREACH PIPELINE FOR: Revenue teams, ABM professionals, growth operators ready for integrated, context-aware GTM.                             | Main overview sticky note                                                                        |
| 🚀 ACCOUNT INPUT Webhook for accounts. Replace with your source.                                                                                                         | Sticky note near webhook node                                                                    |
| 🔍 CONTEXT RESEARCH External data gathering. Replace with data source.                                                                                                   | Sticky note near Research External Context node                                                 |
| 🏢 COMPANY QUALIFICATION Product + Segment fit. Configure agent ID.                                                                                                      | Sticky note near Qualify Company with Octave node                                               |
| 🔍 FILTER Removes low scores. Adjust threshold.                                                                                                                         | Sticky note near Filter node                                                                    |
| 👥 PROSPECTOR Find relevant contacts. Configure personas.                                                                                                               | Sticky note near Discover Relevant Contacts node                                               |
| 📋 SPLIT CONTACTS Individual processing. Handles multiple contacts.                                                                                                     | Sticky note near Split Contacts for Processing node                                            |
| ⚡ RUNTIME SEQUENCES Context + personalization. Configure agent ID.                                                                                                     | Sticky note near Generate Contextualized Sequences node                                        |
| 📧 CAMPAIGN DEPLOY Automated outreach. Update platform & ID.                                                                                                            | Sticky note near Deploy to Email Campaign node                                                 |

---

**Disclaimer:**  
The text provided originates exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.