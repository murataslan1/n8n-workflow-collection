AI-Powered Lead Enrichment from Typeform & Calendly to HubSpot CRM

https://n8nworkflows.xyz/workflows/ai-powered-lead-enrichment-from-typeform---calendly-to-hubspot-crm-7537


# AI-Powered Lead Enrichment from Typeform & Calendly to HubSpot CRM

---

### 1. Workflow Overview

This workflow, titled **AI-Powered Lead Enrichment from Typeform & Calendly to HubSpot CRM**, automates the process of capturing lead data from two sources—Typeform submissions and Calendly event invitees—and enriches this data using AI before syncing it into HubSpot CRM. It is designed for sales and marketing teams seeking to automate lead intake, unify data from multiple channels, enrich company information via AI, and maintain updated CRM records with minimal manual work.

**Logical Blocks:**

- **1.1 Lead Intake & Standardization:** Capture leads from Typeform and Calendly triggers, merge them, and standardize the data to a consistent schema.
- **1.2 Domain Filtering & AI Enrichment:** Filter out leads with generic email domains (e.g., gmail.com) to focus on business leads, then use an AI agent to enrich company information based on the lead’s email domain.
- **1.3 Data Combination:** Combine the standardized lead data with AI enrichment results, ensuring clean, structured output including metadata.
- **1.4 CRM Integration:** Sync the enriched lead data into HubSpot CRM, mapping all relevant fields, including custom properties.

---

### 2. Block-by-Block Analysis

#### 2.1 Lead Intake & Standardization

- **Overview:**  
  This block receives webhook triggers from Typeform form submissions and Calendly event invitee creations. It merges these inputs into a single stream and standardizes them into a uniform lead data structure with key fields such as name, email, phone, message, and email domain.

- **Nodes Involved:**  
  - 🧾 Typeform Trigger  
  - 📅 Calendly Trigger  
  - 🔀 Merge Lead Sources  
  - 🛠️ Standardize Lead Data  
  - Sticky Note (Lead Intake & Standardization)

- **Node Details:**

  1. **🧾 Typeform Trigger**  
     - Type: Trigger node (Typeform webhook)  
     - Role: Captures new form submissions from a specific Typeform form ID.  
     - Config: Requires a valid Typeform API credential and configured with the form ID.  
     - Inputs: External webhook POST from Typeform.  
     - Outputs: JSON payload containing form responses.  
     - Edge Cases: Invalid webhook registration, missing form fields, API authentication failure.  
     - Version: 1  

  2. **📅 Calendly Trigger**  
     - Type: Trigger node (Calendly webhook)  
     - Role: Listens to "invitee.created" events on Calendly to capture new calendar invitees.  
     - Config: Requires Calendly API credentials; listens to specified event types.  
     - Inputs: External webhook POST from Calendly.  
     - Outputs: JSON payload with invitee details.  
     - Edge Cases: Webhook misconfiguration, event filtering errors, API auth failures.  
     - Version: 1  

  3. **🔀 Merge Lead Sources**  
     - Type: Merge node  
     - Role: Merges incoming data streams from both Typeform and Calendly triggers into a single output stream for processing.  
     - Config: Default merge (union).  
     - Inputs: Two input branches from Typeform Trigger and Calendly Trigger.  
     - Outputs: Combined lead data items.  
     - Edge Cases: Empty inputs from one source, data conflicts.  
     - Version: 2  

  4. **🛠️ Standardize Lead Data**  
     - Type: Code node (JavaScript)  
     - Role: Normalizes incoming lead data to a consistent set of fields: name, email, phone, message, domain, and source.  
     - Config: Custom JavaScript code handling three input formats: direct object (Typeform), array of one object (Typeform), and Calendly payload.  
     - Inputs: Merged lead data from previous node.  
     - Outputs: Standardized lead JSON object.  
     - Key Expressions: Extracts email domain from email; handles fallback for missing fields; sets source as "Typeform" or "Calendly".  
     - Edge Cases: Unsupported input formats, missing or malformed email addresses, unexpected payload shapes.  
     - Version: 2  

  5. **Sticky Note (Lead Intake & Standardization)**  
     - Content explains the purpose of this block: capturing leads from multiple sources and standardizing the data for downstream processing.

---

#### 2.2 Domain Filtering & AI Enrichment

- **Overview:**  
  This block filters out leads with free/public email domains (e.g., gmail.com), focusing enrichment only on business domains. It then queries an AI agent to enrich company data based on the domain extracted from the email.

- **Nodes Involved:**  
  - ⚖️ Email Domain Filter  
  - 🤖 AI Agent  
  - 💬 LLM (OpenAI / Claude) [linked as language model for AI Agent]  
  - Sticky Note (Domain Check & AI Enrichment)

- **Node Details:**

  1. **⚖️ Email Domain Filter**  
     - Type: If node (conditional filter)  
     - Role: Checks if the lead email domain is NOT a free email service (condition excludes gmail.com).  
     - Config: Condition: domain != "gmail.com" (case-sensitive, strict validation).  
     - Inputs: Standardized lead data.  
     - Outputs: Passes leads with business domains; filters out generic domains.  
     - Edge Cases: Missing domain field, domains with different casing or other popular free email domains not covered.  
     - Version: 2.2  

  2. **🤖 AI Agent**  
     - Type: Langchain Agent node (AI integration)  
     - Role: Uses an AI assistant to research company information based on the lead email domain.  
     - Config: Prompt instructs AI to return a JSON object with company_name, industry, headquarters, employee_count, website, LinkedIn, and a short description. Only credible info, JSON-only response.  
     - Inputs: Domain from filtered lead data.  
     - Outputs: AI-generated JSON with company enrichment data.  
     - Edge Cases: AI response parsing errors, incomplete data, AI service downtime, API quota limits.  
     - Version: 2  

  3. **💬 LLM (OpenAI / Claude)**  
     - Type: Langchain LM Chat node  
     - Role: Defines the underlying language model for the AI Agent node.  
     - Config: Uses GPT-4o-mini model with OpenAI credentials.  
     - Inputs/Outputs: Interfaces internally with AI Agent node.  
     - Credentials: Requires valid OpenAI API key.  
     - Edge Cases: API authentication failure, rate limits, model unavailability.  
     - Version: 1.2  

  4. **Sticky Note (Domain Check & AI Enrichment)**  
     - Describes filtering of free email domains and AI-driven enrichment with structured company details.

---

#### 2.3 Data Combination

- **Overview:**  
  This block merges the standardized lead details with AI-generated enrichment data into a single consolidated JSON object. It handles various AI output formats and appends metadata like enrichment timestamp and workflow ID.

- **Nodes Involved:**  
  - 🧬 Combine Lead + AI Output  
  - Sticky Note (Merge Lead & Enrichment Data)

- **Node Details:**

  1. **🧬 Combine Lead + AI Output**  
     - Type: Code node (JavaScript)  
     - Role: Accesses data from the Email Domain Filter and AI Agent nodes, parses AI JSON output (including handling markdown code blocks), merges lead and enrichment data, and adds metadata.  
     - Config: Custom JavaScript with robust error handling and parsing logic.  
     - Inputs: JSON from the domain filter node (lead data) and AI Agent node (AI enrichment).  
     - Outputs: Single enriched lead object combining all data fields.  
     - Edge Cases: AI output not in expected JSON format, missing AI or lead data, JSON parse failures.  
     - Version: 2  

  2. **Sticky Note (Merge Lead & Enrichment Data)**  
     - Explains the purpose: merging AI insights with lead data, handling string/JSON AI outputs, and adding metadata for tracking.

---

#### 2.4 CRM Integration

- **Overview:**  
  This block syncs the enriched lead data into HubSpot CRM, mapping all relevant lead and company properties, including custom fields for LinkedIn profile and company description.

- **Nodes Involved:**  
  - 💼 CRM Integration  
  - Sticky Note (CRM Sync)

- **Node Details:**

  1. **💼 CRM Integration**  
     - Type: HubSpot node  
     - Role: Creates or updates contact/company records in HubSpot using enriched lead data.  
     - Config: Authenticated with HubSpot app token credentials; dynamic expressions map JSON fields to HubSpot properties such as email, firstName, phoneNumber, companyName, industry, websiteUrl, country (mapped from headquarters), message, and custom properties (LinkedIn URL and company description).  
     - Inputs: Final enriched lead JSON from Combine node.  
     - Outputs: HubSpot API response (contact creation/update status).  
     - Edge Cases: Authentication failure, API limits, missing required contact fields, data validation errors in HubSpot.  
     - Version: 2.1  

  2. **Sticky Note (CRM Sync)**  
     - Describes syncing enriched leads to CRM with mapped fields and custom property handling.

---

### 3. Summary Table

| Node Name                    | Node Type                      | Functional Role                             | Input Node(s)                     | Output Node(s)               | Sticky Note                                                                                                    |
|------------------------------|--------------------------------|--------------------------------------------|----------------------------------|-----------------------------|---------------------------------------------------------------------------------------------------------------|
| 🧾 Typeform Trigger           | Typeform Trigger               | Capture leads from Typeform form submissions | None (trigger)                   | 🔀 Merge Lead Sources         | Lead Intake & Standardization: Captures leads from multiple sources and standardizes data                      |
| 📅 Calendly Trigger           | Calendly Trigger              | Capture leads from Calendly event invitees  | None (trigger)                   | 🔀 Merge Lead Sources         | Lead Intake & Standardization: Captures leads from multiple sources and standardizes data                      |
| 🔀 Merge Lead Sources         | Merge                         | Merge lead data from Typeform and Calendly  | 🧾 Typeform Trigger, 📅 Calendly Trigger | 🛠️ Standardize Lead Data       | Lead Intake & Standardization: Captures leads from multiple sources and standardizes data                      |
| 🛠️ Standardize Lead Data      | Code                          | Normalize lead data to consistent format    | 🔀 Merge Lead Sources            | ⚖️ Email Domain Filter        | Lead Intake & Standardization: Captures leads from multiple sources and standardizes data                      |
| Sticky Note                  | Sticky Note                   | Describes Lead Intake & Standardization block | None                           | None                        | Captures leads from multiple sources (form + calendar). All incoming data is merged and standardized           |
| ⚖️ Email Domain Filter        | If                            | Filter out leads with generic/free email domains | 🛠️ Standardize Lead Data         | 🤖 AI Agent                  | Domain Check & AI Enrichment: Filters free/public email domains for AI enrichment                              |
| 🤖 AI Agent                  | Langchain Agent               | Enrich company data via AI based on domain  | ⚖️ Email Domain Filter           | 🧬 Combine Lead + AI Output   | Domain Check & AI Enrichment: Filters free/public email domains for AI enrichment                              |
| 💬 LLM (OpenAI / Claude)       | Langchain LM Chat             | Provides OpenAI GPT-4o-mini model for AI Agent | None (internal to AI Agent)     | 🤖 AI Agent (AI languageModel) | Domain Check & AI Enrichment: Filters free/public email domains for AI enrichment                              |
| Sticky Note1                 | Sticky Note                   | Describes Domain Check & AI Enrichment block | None                           | None                        | Filters out free/public email domains; AI enriches with company details in structured JSON                     |
| 🧬 Combine Lead + AI Output    | Code                          | Merge lead data with AI enrichment and add metadata | 🤖 AI Agent, ⚖️ Email Domain Filter | 💼 CRM Integration            | Merge Lead & Enrichment Data: Combines lead and AI data; adds metadata like timestamp and workflow ID          |
| Sticky Note2                 | Sticky Note                   | Describes Merge Lead & Enrichment Data block | None                           | None                        | Merges lead details with AI-generated insights and adds metadata for tracking                                 |
| 💼 CRM Integration            | HubSpot                       | Sync enriched lead data into HubSpot CRM    | 🧬 Combine Lead + AI Output       | None                        | CRM Sync: Enriched lead data synced into CRM; includes dynamic mapping for contact and company properties      |
| Sticky Note3                 | Sticky Note                   | Describes CRM Sync block                      | None                           | None                        | Enriched lead data is synced into CRM with mapped fields and custom properties                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Typeform Trigger Node**  
   - Add a **Typeform Trigger** node.  
   - Configure with your Typeform account credentials.  
   - Set the Form ID to your target Typeform form.  
   - Save the webhook URL and register it in Typeform to receive submissions.

2. **Create the Calendly Trigger Node**  
   - Add a **Calendly Trigger** node.  
   - Configure with your Calendly API credentials.  
   - Select the event `invitee.created` to trigger on new invitees.  
   - Register the webhook URL in Calendly’s integrations.

3. **Merge Lead Sources**  
   - Add a **Merge** node.  
   - Connect **Typeform Trigger** to Merge input 1.  
   - Connect **Calendly Trigger** to Merge input 2.  
   - Keep default merge settings (union).

4. **Standardize Lead Data**  
   - Add a **Code** node.  
   - Connect the output of the **Merge** node.  
   - Paste the supplied JavaScript code to normalize lead data from either Typeform or Calendly formats into a consistent JSON object with fields: `name, email, phone, message, domain, source`.  
   - This node handles multiple input formats and extracts email domain.

5. **Add If Node for Email Domain Filtering**  
   - Add an **If** node.  
   - Connect output of **Standardize Lead Data**.  
   - Configure condition:  
     - Left value: expression `{{$json.domain}}`  
     - Operator: "not equals"  
     - Right value: `gmail.com`  
   - Ensure case-sensitive and strict validation is enabled.

6. **Configure AI Agent Node**  
   - Add a **Langchain Agent** node.  
   - Connect the output **true** branch of the If node (business domain leads).  
   - Create a **Langchain LM Chat** node for the language model (OpenAI GPT-4o-mini).  
   - Link the LM Chat node to the AI Agent node as the language model.  
   - Configure the AI Agent prompt to receive the domain and instruct it to return JSON with company details: company_name, industry, headquarters, employee_count, website, linkedin, description.  
   - Provide OpenAI API credentials to the LM Chat node.

7. **Combine Lead and AI Output**  
   - Add a **Code** node.  
   - Connect AI Agent output to this node.  
   - Also connect the **If** node output (lead data) so both inputs are accessible.  
   - Paste the provided JavaScript code that:  
     - Retrieves lead data and AI output safely,  
     - Parses AI JSON output,  
     - Merges all data into one enriched lead object,  
     - Adds metadata fields like enrichment timestamp and workflow ID.

8. **Add HubSpot CRM Integration Node**  
   - Add a **HubSpot** node.  
   - Connect output of the Combine node.  
   - Authenticate using HubSpot App Token credentials.  
   - Map fields dynamically from the combined JSON:  
     - `email`, `firstName`, `phoneNumber`, `companyName`, `industry`, `websiteUrl`, `country` (from headquarters), `message`  
     - Map custom fields `company_s_linkedin` and `company_descreption` from LinkedIn and description respectively.  
   - Configure to create or update contacts/companies as needed.

9. **Add Sticky Notes for Documentation (Optional)**  
   - Add sticky notes in appropriate positions to describe blocks:  
     - Lead Intake & Standardization  
     - Domain Filtering & AI Enrichment  
     - Data Combination  
     - CRM Sync  

10. **Activate Workflow**  
    - Review all nodes for correct configuration and credentials.  
    - Activate the workflow to start processing incoming leads automatically.

---

### 5. General Notes & Resources

| Note Content                                                                                                               | Context or Link                                                                                          |
|----------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| This workflow captures and enriches leads from Typeform and Calendly, enriching business leads while filtering free emails. | Workflow description                                                                                     |
| AI enrichment uses Langchain with OpenAI GPT-4o-mini model for credible company data extraction.                            | Node configuration details                                                                              |
| Custom properties mapped in HubSpot include LinkedIn profile and company description for enhanced CRM records.              | HubSpot CRM Integration node setup                                                                      |
| Workflow requires valid API credentials for Typeform, Calendly, OpenAI, and HubSpot App Token.                              | Credential setup instructions                                                                            |
| Sticky notes included throughout provide contextual explanations for each logical block.                                     | Visual documentation embedded in workflow                                                              |

---

**Disclaimer:**  
The text provided is derived exclusively from an automated workflow designed with n8n, an integration and automation tool. This process strictly complies with applicable content policies and contains no illegal, offensive, or protected elements. All data processed is legal and public.

---