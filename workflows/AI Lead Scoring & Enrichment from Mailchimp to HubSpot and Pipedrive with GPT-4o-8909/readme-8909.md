AI Lead Scoring & Enrichment from Mailchimp to HubSpot and Pipedrive with GPT-4o

https://n8nworkflows.xyz/workflows/ai-lead-scoring---enrichment-from-mailchimp-to-hubspot-and-pipedrive-with-gpt-4o-8909


# AI Lead Scoring & Enrichment from Mailchimp to HubSpot and Pipedrive with GPT-4o

### 1. Workflow Overview

This workflow automates the lead capture, enrichment, qualification, and CRM synchronization process for new subscribers from a Mailchimp list. It targets marketing and sales teams aiming to improve lead management by leveraging AI for lead scoring and enrichment, then syncing qualified leads to HubSpot and Pipedrive CRM systems. The workflow consists of four main logical blocks:

- **1.1 Lead Capture & Subscriber Data Extraction:** Listens for new Mailchimp subscribers and extracts structured subscriber information.  
- **1.2 AI-Powered Lead Enrichment:** Uses GPT-4o via Langchain to enrich subscriber data with professional details and lead scoring.  
- **1.3 Lead Qualification & Scoring:** Applies a threshold filter to identify high-value leads based on AI-generated lead scores.  
- **1.4 CRM Sync & Deal Creation:** Synchronizes enriched lead data to HubSpot and Pipedrive, and creates deals for high-value leads in Pipedrive.

---

### 2. Block-by-Block Analysis

#### 2.1 Lead Capture & Subscriber Data Extraction

**Overview:**  
This block captures new subscriber events from Mailchimp and processes the raw data to extract key contact details necessary for further enrichment and CRM synchronization.

**Nodes Involved:**  
- 📩 Mailchimp Subscriber Trigger  
- 📊 Extract Subscriber Data

**Node Details:**

- **📩 Mailchimp Subscriber Trigger**  
  - *Type:* Mailchimp Trigger  
  - *Role:* Listens to Mailchimp webhook events for new subscribers on a specified list.  
  - *Configuration:*  
    - List ID parameterized (`YOUR_MAILCHIMP_LIST_ID`)  
    - Event type: "subscribe"  
    - Source filter: "admin" (to capture admin-added subscriptions)  
  - *Input/Output:* No input; outputs raw subscriber event JSON.  
  - *Failure Cases:* Webhook misconfiguration, invalid list ID, authentication failure with Mailchimp API.  
  - *Credentials:* Mailchimp API credentials required.  
  - *Version:* 1  

- **📊 Extract Subscriber Data**  
  - *Type:* Code (JavaScript)  
  - *Role:* Parses raw Mailchimp subscriber data to extract email, first name, last name, full name, subscription timestamp, and list ID.  
  - *Configuration:* Custom JavaScript code reads nested JSON fields, with fallback defaults to empty strings.  
  - *Key Expressions:*  
    - Extracts `data[email]`, `data[merges][FNAME]`, `data[merges][LNAME]`, `data[list_id]`, and `fired_at` date conversion.  
    - Constructs `fullName` by concatenating first and last names.  
  - *Input:* Raw JSON from Mailchimp Trigger.  
  - *Output:* Structured JSON with clean subscriber fields for downstream AI enrichment.  
  - *Failure Cases:* Unexpected data structure changes, missing fields, date parsing errors.  
  - *Version:* 2  

---

#### 2.2 AI-Powered Lead Enrichment

**Overview:**  
Enhances subscriber data by using GPT-4o to predict professional attributes and assign a lead score, then parses and merges AI output with subscriber info.

**Nodes Involved:**  
- 🤖 Lead Enrichment AI  
- 🧠 OpenAI Model  
- 🔎 Parse & Merge Enrichment

**Node Details:**

- **🤖 Lead Enrichment AI**  
  - *Type:* Langchain Agent Node  
  - *Role:* Sends subscriber email and name to GPT-4o prompt to enrich lead data and score.  
  - *Configuration:*  
    - Prompt instructs AI to output JSON with keys: company, jobTitle, industry, linkedinUrl, intent, leadScore (1-100), confidence (1-100).  
    - Uses expressions to inject email and fullName dynamically from input JSON.  
  - *Input:* Structured subscriber data from Extract Subscriber Data node.  
  - *Output:* AI response JSON with enrichment details.  
  - *Failure Cases:* API rate limits, malformed AI responses, network errors.  
  - *Version:* 2.2  

- **🧠 OpenAI Model**  
  - *Type:* Langchain OpenAI Chat Model  
  - *Role:* Backend language model provider for Langchain Agent, specifically GPT-4o-mini.  
  - *Configuration:*  
    - Model set to "gpt-4o-mini".  
  - *Credentials:* OpenAI API key required.  
  - *Input/Output:* Receives prompt from Langchain Agent, outputs chat completions.  
  - *Failure Cases:* API key issues, quota exhaustion, network timeout.  
  - *Version:* 1.2  

- **🔎 Parse & Merge Enrichment**  
  - *Type:* Code (JavaScript)  
  - *Role:* Parses AI JSON output, handles parsing errors gracefully, merges enrichment with original subscriber data.  
  - *Configuration:*  
    - Defaults set for enrichment fields if AI output is missing or malformed.  
    - Attempts to parse JSON response even if wrapped in markdown code blocks.  
    - Merges enriched data with subscriber data and timestamps enrichment.  
  - *Input:* AI response JSON from Lead Enrichment AI.  
  - *Output:* Combined enriched lead data JSON.  
  - *Failure Cases:* JSON parse errors, missing AI output fields, fallback to defaults.  
  - *Version:* 2  

---

#### 2.3 Lead Qualification & Scoring

**Overview:**  
Filters leads based on leadScore to identify high-value prospects for prioritized handling.

**Nodes Involved:**  
- 💎 High-Value Lead Check

**Node Details:**

- **💎 High-Value Lead Check**  
  - *Type:* If Node  
  - *Role:* Evaluates whether leadScore ≥ 70 to qualify as high-value lead.  
  - *Configuration:*  
    - Condition on leadScore numeric field from merged enrichment data.  
    - Passes leads with score 70 or above to deal creation node.  
  - *Input:* Enriched lead data JSON.  
  - *Output:* Conditional routing; true branch triggers deal creation.  
  - *Failure Cases:* Missing or non-numeric leadScore, logic misfires.  
  - *Version:* 2  

---

#### 2.4 CRM Sync & Deal Creation

**Overview:**  
Synchronizes enriched leads with HubSpot and Pipedrive, and creates high-value deals in Pipedrive for qualified leads.

**Nodes Involved:**  
- 📊 HubSpot Contact Sync  
- 👤 Pipedrive Person Create  
- 💼 Create High-Value Deal

**Node Details:**

- **📊 HubSpot Contact Sync**  
  - *Type:* HubSpot Node (Contact Create/Update)  
  - *Role:* Syncs enriched lead details to HubSpot contacts using email as key.  
  - *Configuration:*  
    - Uses firstName, lastName, companyName, jobTitle, industry from merged data.  
    - Authentication via HubSpot App Token.  
  - *Input:* Enriched lead JSON.  
  - *Output:* HubSpot contact creation or update response.  
  - *Failure Cases:* API rate limits, authorization errors, invalid data formats.  
  - *Version:* 2  
  - *Continue on Fail:* Enabled to prevent blocking workflow on errors.  

- **👤 Pipedrive Person Create**  
  - *Type:* Pipedrive Node (Person Create)  
  - *Role:* Creates or updates a person record in Pipedrive CRM with enriched lead data.  
  - *Configuration:*  
    - Person name set to fullName from subscriber data.  
    - Email added as additional field.  
    - OAuth2 or API token authentication.  
  - *Input:* Enriched lead JSON.  
  - *Output:* Pipedrive person record response.  
  - *Failure Cases:* Auth or API errors, duplicate records.  
  - *Version:* 1  

- **💼 Create High-Value Deal**  
  - *Type:* Pipedrive Node (Deal Create)  
  - *Role:* Creates a deal in Pipedrive associated with the high-value lead (person).  
  - *Configuration:*  
    - Deal title includes lead fullName.  
    - Deal value calculated as leadScore * 10 USD.  
    - Status set to "open".  
    - Currency set to USD.  
    - Person association expected but person_id initially null (likely to be linked post person creation or requires manual linking depending on workflow triggers).  
  - *Input:* Leads passing High-Value Lead Check.  
  - *Output:* Deal creation response.  
  - *Failure Cases:* Missing person association, API errors, invalid value calculations.  
  - *Version:* 1  

---

### 3. Summary Table

| Node Name                   | Node Type                  | Functional Role                                  | Input Node(s)               | Output Node(s)                   | Sticky Note                                                                                                        |
|-----------------------------|----------------------------|-------------------------------------------------|-----------------------------|---------------------------------|--------------------------------------------------------------------------------------------------------------------|
| 📩 Mailchimp Subscriber Trigger | Mailchimp Trigger          | Captures new Mailchimp subscriber events        | None                        | 📊 Extract Subscriber Data       | 1. Lead Capture & Subscriber Data Extraction - captures leads and extracts structured data                        |
| 📊 Extract Subscriber Data    | Code (JavaScript)          | Extracts structured subscriber info              | 📩 Mailchimp Subscriber Trigger | 🤖 Lead Enrichment AI            | 1. Lead Capture & Subscriber Data Extraction - prepares data for enrichment                                        |
| 🤖 Lead Enrichment AI         | Langchain Agent Node       | Sends data to GPT-4o for lead enrichment         | 📊 Extract Subscriber Data   | 🔎 Parse & Merge Enrichment      | 2. AI-Powered Lead Enrichment - enriches leads with professional info and scoring                                  |
| 🧠 OpenAI Model               | Langchain LM Chat OpenAI   | Provides GPT-4o language model backend            | 🤖 Lead Enrichment AI        | 🤖 Lead Enrichment AI (internal) | 2. AI-Powered Lead Enrichment - GPT-4o model powering AI agent                                                    |
| 🔎 Parse & Merge Enrichment   | Code (JavaScript)          | Parses AI output and merges with subscriber data | 🤖 Lead Enrichment AI        | 💎 High-Value Lead Check, 📊 HubSpot Contact Sync, 👤 Pipedrive Person Create | 2. AI-Powered Lead Enrichment - merges enrichment data, sets defaults if parsing fails                             |
| 💎 High-Value Lead Check      | If Node                   | Filters leads with leadScore ≥ 70                 | 🔎 Parse & Merge Enrichment  | 💼 Create High-Value Deal        | 3. Lead Qualification & Scoring - filters high-value leads                                                        |
| 📊 HubSpot Contact Sync       | HubSpot Node               | Syncs enriched lead data to HubSpot contacts      | 🔎 Parse & Merge Enrichment  | None                            | 4. CRM Sync & Deal Creation - syncs leads to HubSpot CRM                                                         |
| 👤 Pipedrive Person Create    | Pipedrive Node             | Creates/updates person record in Pipedrive CRM    | 🔎 Parse & Merge Enrichment  | None                            | 4. CRM Sync & Deal Creation - syncs leads to Pipedrive CRM                                                       |
| 💼 Create High-Value Deal     | Pipedrive Node             | Creates deal for high-value leads in Pipedrive    | 💎 High-Value Lead Check     | None                            | 4. CRM Sync & Deal Creation - creates deals for prioritized leads                                                |
| Sticky Note                  | Sticky Note                | Documentation note                                | None                        | None                            | 1. Lead Capture & Subscriber Data Extraction (covers nodes 📩 and 📊 Extract Subscriber Data)                      |
| Sticky Note1                 | Sticky Note                | Documentation note                                | None                        | None                            | 2. AI-Powered Lead Enrichment (covers 🤖, 🧠, 🔎 Parse & Merge Enrichment nodes)                                   |
| Sticky Note2                 | Sticky Note                | Documentation note                                | None                        | None                            | 3. Lead Qualification & Scoring (covers 💎 High-Value Lead Check node)                                            |
| Sticky Note3                 | Sticky Note                | Documentation note                                | None                        | None                            | 4. CRM Sync & Deal Creation (covers 📊 HubSpot Contact Sync, 👤 Pipedrive Person Create, 💼 Create High-Value Deal) |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Mailchimp Subscriber Trigger Node**  
   - Type: Mailchimp Trigger  
   - Set "List" to your Mailchimp list ID (`YOUR_MAILCHIMP_LIST_ID`).  
   - Select "subscribe" event and "admin" source.  
   - Add Mailchimp API credentials (OAuth or API key).  
   - Position: e.g., (-416, 272).  

2. **Create Code Node for Subscriber Data Extraction**  
   - Type: Code (JavaScript)  
   - Paste the provided JS to extract email, firstName, lastName, fullName, tags (empty array), listId, and subscribedAt timestamp from the raw Mailchimp payload.  
   - Connect input from Mailchimp Subscriber Trigger.  
   - Use n8n version 2 or higher for Code node.  
   - Position: (-192, 272).  

3. **Create Langchain Agent Node for Lead Enrichment AI**  
   - Type: Langchain Agent Node  
   - Set prompt with template: Provide email and fullName dynamically (`={{ $json.email }}`, `={{ $json.fullName }}`).  
   - Prompt instructs AI to output JSON with company, jobTitle, industry, linkedinUrl, intent, leadScore, confidence.  
   - Connect input from Extract Subscriber Data node.  
   - Position: (32, 272).  

4. **Create Langchain OpenAI Model Node**  
   - Type: Langchain LM Chat OpenAI  
   - Select model: gpt-4o-mini  
   - Add OpenAI API credentials (API key).  
   - Connect output to Langchain Agent Node’s AI language model input.  
   - Position: (96, 496).  

5. **Create Code Node to Parse & Merge Enrichment**  
   - Type: Code (JavaScript)  
   - Implement parsing logic to safely parse AI JSON output, fallback to defaults if parse fails.  
   - Merge enrichment with subscriber base data, add timestamp.  
   - Connect input from Lead Enrichment AI node.  
   - Position: (384, 272).  

6. **Create If Node for High-Value Lead Check**  
   - Type: If Node  
   - Condition: leadScore ≥ 70 (numeric, strict validation).  
   - Connect input from Parse & Merge Enrichment node.  
   - Position: (608, 80).  

7. **Create HubSpot Contact Sync Node**  
   - Type: HubSpot (Contact)  
   - Configure to upsert contact by email.  
   - Map fields: firstName, lastName, companyName, jobTitle, industry from Parse & Merge Enrichment output.  
   - Use HubSpot App Token credentials.  
   - Connect input from Parse & Merge Enrichment node (main branch, independent of lead score).  
   - Set "Continue On Fail" to true.  
   - Position: (608, 416).  

8. **Create Pipedrive Person Create Node**  
   - Type: Pipedrive (Person)  
   - Create person with fullName and email fields.  
   - Use Pipedrive API credentials (API key or OAuth2).  
   - Connect input from Parse & Merge Enrichment node (parallel to HubSpot).  
   - Position: (608, 608).  

9. **Create Pipedrive Deal Create Node for High-Value Leads**  
   - Type: Pipedrive (Deal)  
   - Title: "High Value Lead - {{fullName}}" dynamically.  
   - Value: `leadScore * 10` USD, rounded.  
   - Status: "open"  
   - Currency: USD  
   - Associate with person (person_id to be set post person creation if possible).  
   - Connect input from High-Value Lead Check node’s true branch only.  
   - Position: (832, 80).  

10. **Connect Nodes as per workflow:**  
    - Mailchimp Subscriber Trigger → Extract Subscriber Data → Lead Enrichment AI → Parse & Merge Enrichment →  
      - HubSpot Contact Sync  
      - Pipedrive Person Create  
      - High-Value Lead Check → (true) → Create High-Value Deal  

11. **Add Sticky Notes (Optional):**  
    - Add descriptive sticky notes above each logical block for documentation and clarity.  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                         | Context or Link                                                                                                          |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------|
| This workflow uses GPT-4o-mini model via Langchain in n8n to enrich leads with professional data and scoring.                                                     | AI enrichment block                                                                                                      |
| Mailchimp subscriber events are filtered to "subscribe" and "admin" source only to avoid duplicates or irrelevant triggers.                                       | Mailchimp trigger configuration                                                                                          |
| Lead score threshold is set at 70 to qualify leads as high-value; this can be adjusted based on business needs.                                                    | Lead Qualification Logic                                                                                                 |
| HubSpot contact sync uses App Token authentication for streamlined integration; Pipedrive uses API key or OAuth2 depending on setup.                             | CRM credentials setup                                                                                                    |
| The Pipedrive deal creation currently does not auto-link the deal to the person record due to missing person_id; manual linking or workflow enhancement needed.  | Pipedrive deal association note                                                                                          |
| Sticky notes within the workflow provide user guidance and functional grouping, recommended to keep for team collaboration.                                       | Workflow documentation                                                                                                   |
| For more info on n8n Mailchimp integration: https://docs.n8n.io/integrations/trigger-nodes/mailchimp/                                                             | Official n8n documentation                                                                                               |
| For n8n Langchain and OpenAI integration: https://docs.n8n.io/integrations/ai-nodes/langchain/ and https://docs.n8n.io/integrations/ai-nodes/openai/              | Official n8n AI nodes documentation                                                                                      |
| This workflow assumes valid API credentials are created and configured in n8n Credentials Manager before execution.                                                | Credential prerequisites                                                                                                |

---

**Disclaimer:** The provided text exclusively derives from an automated workflow created with n8n, respecting all applicable content policies. It contains no illegal, offensive, or protected elements. All manipulated data is legal and publicly accessible.