Automate Lead Generation & Personalized Outreach with Apollo, AI, and Instantly.ai

https://n8nworkflows.xyz/workflows/automate-lead-generation---personalized-outreach-with-apollo--ai--and-instantly-ai-6983


# Automate Lead Generation & Personalized Outreach with Apollo, AI, and Instantly.ai

### Disclaimer
The text herein originates exclusively from an automated workflow created with n8n, fully compliant with current policies, and containing no illegal, offensive, or protected content. All processed data is legal and publicly accessible.

---

# Documentation for Workflow: Automate Lead Generation & Personalized Outreach with Apollo, AI, and Instantly.ai

---

## 1. Workflow Overview

This workflow automates the process of lead generation, enrichment, qualification, and personalized outreach for agencies using Apollo.io, AI-powered enrichment tools, and the Instantly.ai platform. The core goal is to generate targeted lead lists, verify lead emails, enrich lead data with AI-driven insights, qualify leads against custom criteria, and create personalized cold email campaigns for outreach.

The workflow is organized into the following logical blocks, reflecting its main functional areas:

**1.1 Agency and Campaign Setup & Enrichment**

- Input reception via webhook.
- Agency data retrieval and enrichment (website scraping via AI).
- Campaign data retrieval and setup.

**1.2 Ideal Customer Profile (ICP) Definition & Apollo Search URL Generation**

- Retrieve ICP records.
- Generate Apollo search URLs based on ICP criteria using AI.
- Store the generated URLs and lead list names.

**1.3 Lead Scraping & Email Verification**

- Launch Apollo data scraper for leads.
- Loop over scraped leads to verify email deliverability via Emailable.
- Update lead status based on verification results.

**1.4 Lead Enrichment & Qualification**

- Enrich leads with website, LinkedIn post, LinkedIn profile, and news data using AI and scraping tools.
- AI-powered qualification based on enrichment data and custom criteria.
- Update lead and list qualification statuses accordingly.

**1.5 Personalized Email Sequence Generation**

- Generate personalized cold email sequences using AI based on enriched data and agency info.
- Generate follow-up email sequences.
- Handle campaign feedback for email rewrites/remakes.

**1.6 Instantly.ai Campaign & Lead List Management**

- Create lead lists on Instantly.ai.
- Add qualified and enriched leads to Instantly lists.
- Create and manage campaigns in Instantly.ai.
- Move lead lists into campaigns.
- Retrieve and update campaign analytics.

**1.7 Status Updates & Error Handling**

- Update Airtable records with statuses for campaign, lead lists, leads, verification, enrichment, qualification, personalization, and analytics.
- Handle API errors gracefully and update statuses accordingly.

---

## 2. Block-by-Block Analysis

### 2.1 Agency and Campaign Setup & Enrichment

**Overview:**  
Handles initial data retrieval for agencies and campaigns, enriches agency data by scraping the agency's website using AI, and updates agency records in Airtable.

**Nodes Involved:**  
- Webhook  
- Get Agency Record  
- Get Agency Record ID  
- Get Jina Record (API credentials retrieval)  
- Agency Website Data (Jina AI scraper)  
- Business Summary Writer (OpenAI)  
- Get Agency Business Information (set variables)  
- Update Agency Overview (Airtable update)

**Node Details:**

- **Webhook**: Receives external HTTP requests with query parameters indicating actions and record IDs.
  - Input: HTTP requests with query parameters.
  - Output: Triggers downstream nodes.
  - Edge cases: Malformed requests, missing parameters.

- **Get Agency Record / Get Agency Record ID**: Fetch specific agency data from Airtable based on provided record ID.
  - Input: Record ID from webhook.
  - Output: Agency data JSON.
  - Credentials: Airtable API token.
  - Edge cases: Missing or invalid record IDs.

- **Get Jina Record**: Retrieves Jina AI API credentials from Airtable.
  - Output: API key array for Jina AI.

- **Agency Website Data**: Uses Jina AI to scrape the agency's website content.
  - Input: Agency website URL.
  - Output: Raw website text.
  - Edge cases: Website unavailability, scraping errors.

- **Business Summary Writer**: Uses OpenAI GPT model to analyze website data and produce a structured JSON with business overview, value proposition, ICP, and case studies.
  - Input: Website text from previous node.
  - Output: JSON with structured summary.
  - Edge cases: API limits, malformed inputs.

- **Get Agency Business Information**: Sets variables from AI output for use in downstream nodes.

- **Update Agency Overview**: Updates Airtable agency record with the enriched business summary, offer, and ICP.
  - Input: Enrichment data and record ID.
  - Output: Updated Airtable record.
  - Edge cases: Airtable API errors.

---

### 2.2 Ideal Customer Profile (ICP) Definition & Apollo Search URL Generation

**Overview:**  
Retrieves ICP data from Airtable, generates Apollo.io search URLs and descriptive lead list names using AI, and stores this data.

**Nodes Involved:**  
- Get IDC Record  
- Get IDC Records (set variables)  
- Apollo Search URL Generator (OpenAI)  
- Get Apollo Search URL (set variables)  
- Update IDC-SearchURL (Airtable update)

**Node Details:**

- **Get IDC Record**: Fetches an ICP record by ID.
- **Get IDC Records**: Extracts relevant ICP fields for search criteria.
- **Apollo Search URL Generator**: AI-powered node that formats ICP criteria into Apollo search URLs and creates lead list names.
  - Uses a detailed system prompt to ensure URL parameters conform to Apollo's API specs.
- **Get Apollo Search URL**: Sets string variables for URL and list name.
- **Update IDC-SearchURL**: Updates ICP Airtable record with generated URL, lead list name, and status.

---

### 2.3 Lead Scraping & Email Verification

**Overview:**  
Scrapes leads from Apollo.io based on generated URLs, verifies lead emails for deliverability, and updates lead records with verification status.

**Nodes Involved:**  
- Get Apollo Scraper Record  
- Get Scraper Parameter (set params for scraping)  
- Apollo Lead Scraper (HTTP request to scraper API)  
- Verify Dataset Availability (code check)  
- If (valid data check)  
- Loop over leads (batch processing)  
- Get Lead Data  
- Emailable (email verification API)  
- Wait (for API rate limits)  
- If deliverable / update lead status nodes  
- Fill Email List (Airtable update)

**Node Details:**

- **Apollo Lead Scraper**: Calls an external scraper API to fetch leads matching the Apollo URL and limits.
- **Emailable**: Verifies email deliverability with Emailable API.
- **Conditional nodes and loops**: Process leads in batches, filter verified leads, update statuses.
- **Fill Email List**: Stores verified leads in Airtable.

Edge cases include API timeouts, rate limits, and invalid emails.

---

### 2.4 Lead Enrichment & Qualification

**Overview:**  
Enriches each lead by scraping their company website, LinkedIn posts and profiles, and news data; then applies AI-based qualification logic to determine lead fit.

**Nodes Involved:**  
- Get Lead Records (for enrichment)  
- Multiple scrapers (Jina AI for website, Apify for LinkedIn posts and profiles, Perplexity for news)  
- Aggregate & summarize data (LinkedIn post summarizer)  
- Merge data  
- Update lead enrichment fields in Airtable  
- Qualification nodes:  
  - Get Lead for Qualification  
  - Search Business Information (Perplexity)  
  - AI Qualification (OpenAI)  
  - Handle qualified/unqualified outcomes  
  - Update qualification status in Airtable

**Node Details:**

- Scrapers use APIs to gather unstructured data.
- AI nodes summarize and analyze data.
- Qualification uses structured prompts to compare enrichment data against qualification rules.
- Updates lead and list statuses accordingly.

Potential failures: API quota exceeded, missing data, or AI model failures.

---

### 2.5 Personalized Email Sequence Generation

**Overview:**  
Generates personalized cold email sequences for qualified leads, including initial and follow-up emails, leveraging AI models and lead enrichment data.

**Nodes Involved:**  
- Get Lead Records (for personalization)  
- Get Personalization Record (fetch templates and rules)  
- Information LLM (prepare data for AI)  
- Cold Email Writer (OpenAI)  
- Email Sequence Writer (OpenAI)  
- Update cold email content in Airtable  
- Cold Email Writer [Remake] (AI revision based on user feedback)  
- Update email records

**Node Details:**

- AI nodes use detailed prompts including agency offer, lead info, personalization type, and scraped templates.
- Follow-up emails are generated with strategic timing and tone.
- Remake node allows campaign owners to request email rewrites with AI assistance.
- Airtable updates ensure records reflect latest email content and status.

Edge cases: API failures, incomplete lead data, or malformed requests.

---

### 2.6 Instantly.ai Campaign & Lead List Management

**Overview:**  
Manages lead lists and campaigns on Instantly.ai platform: creates lead lists, adds leads, creates campaigns, moves lists into campaigns, and fetches campaign analytics.

**Nodes Involved:**  
- Get Instantly Account & Campaign Records  
- Create Lead Lists (Instanti.ai API)  
- Add Leads to Instantly Lists  
- Create Campaigns on Instantly  
- Move Lead Lists to Campaigns  
- Get Campaign Analytics (Instanti.ai API)  
- Update Airtable campaign and list statuses

**Node Details:**

- API calls use Instantly.ai REST endpoints with OAuth or API keys.
- Nodes handle JSON payloads with campaign scheduling, email templates, and personalization variables.
- Statuses and analytics are synchronized back to Airtable for reporting.

API error handling includes retry and conditional status updates.

---

### 2.7 Status Updates & Error Handling

**Overview:**  
Updates various Airtable records throughout the workflow to reflect current processing status, handles API errors gracefully, and manages workflow branching based on outcomes.

**Nodes Involved:**  
- Multiple Airtable update nodes for leads, lead lists, agencies, campaigns, and analytics.  
- Conditional nodes for error detection (e.g., API 400 status, empty datasets).  
- Limit nodes to ensure batch size control.  
- Wait nodes for rate limiting.

**Node Details:**

- Consistent status fields updated to drive downstream workflow logic and provide visibility.
- Errors trigger fallback updates to indicate failure states.
- Batch and limit nodes prevent overload and control concurrency.

---

## 3. Summary Table

| Node Name                          | Node Type                           | Functional Role                                  | Input Node(s)                               | Output Node(s)                             | Sticky Note                                                                                   |
|-----------------------------------|-----------------------------------|-------------------------------------------------|---------------------------------------------|--------------------------------------------|-----------------------------------------------------------------------------------------------|
| Webhook                           | Webhook                           | Entry point for external requests                | -                                           | Switch                                    |                                                                                               |
| Switch                           | Switch                            | Routes based on query action                      | Webhook                                     | Multiple branches                          |                                                                                               |
| Get Agency Record                 | Airtable                         | Fetch agency data by ID                           | Switch                                      | Get Jina Record, Get Agency Record ID      |                                                                                               |
| Get Agency Record ID              | Airtable                         | Fetch agency ID for enrichment                    | Switch                                      | Get Agency Record                          |                                                                                               |
| Get Jina Record                  | Airtable                         | Retrieve Jina AI API credentials                   | Get Agency Record                           | Agency Website Data                        |                                                                                               |
| Agency Website Data              | Jina AI                         | Scrape agency website for content                  | Get Jina Record                            | Business Summary Writer                    |                                                                                               |
| Business Summary Writer          | OpenAI                         | Generate business summary and ICP from website    | Agency Website Data                        | Get Agency Business Information            |                                                                                               |
| Get Agency Business Information  | Set                              | Extract and assign AI output fields                | Business Summary Writer                    | Update Agency Overview                     |                                                                                               |
| Update Agency Overview           | Airtable                         | Update agency record with enrichment results       | Get Agency Business Information            | -                                          |                                                                                               |
| Get IDC Record                  | Airtable                         | Fetch ICP record by ID                             | Switch                                      | Get IDC Records                            |                                                                                               |
| Get IDC Records                 | Set                              | Prepare ICP fields                                 | Get IDC Record                            | Apollo Search URL Generator                 |                                                                                               |
| Apollo Search URL Generator     | OpenAI                         | Generate Apollo search URL and list name           | Get IDC Records                          | Get Apollo Search URL                      |                                                                                               |
| Get Apollo Search URL           | Set                              | Extract URL and lead list name                     | Apollo Search URL Generator                 | Update IDC-SearchURL                       |                                                                                               |
| Update IDC-SearchURL            | Airtable                         | Update ICP record with search URL and status       | Get Apollo Search URL                      | -                                          |                                                                                               |
| Get Apollo Scraper Record       | Airtable                         | Retrieve Apollo scraper config                      | Switch                                      | Get Scraper Parameter                       |                                                                                               |
| Get Scraper Parameter           | Set                              | Set parameters for Apollo lead scraping            | Get Apollo Scraper Record                  | Apollo Lead Scraper                        |                                                                                               |
| Apollo Lead Scraper             | HTTP Request                    | Scrape leads from Apollo.io                          | Get Scraper Parameter                      | Verify Dataset Availability                 |                                                                                               |
| Verify Dataset Availability     | Code                             | Check if scraping returned data                      | Apollo Lead Scraper                        | If (valid data)                            |                                                                                               |
| If                            | If                               | Branch on presence of scraped lead data             | Verify Dataset Availability                 | Loop over leads / Error handling           |                                                                                               |
| Loop over leads                | SplitInBatches                 | Batch processing over scraped leads                 | If                                        | Get Lead Data                             |                                                                                               |
| Get Lead Data                 | Airtable                         | Retrieve lead record details                         | Loop over leads                            | Emailable                                 |                                                                                               |
| Emailable                    | HTTP Request                    | Verify email deliverability                           | Get Lead Data                             | Wait                                       |                                                                                               |
| Wait                        | Wait                             | Wait for API rate limit                               | Emailable                                 | If deliverable                             |                                                                                               |
| If deliverable              | If                               | Branch to update lead status based on deliverability | Wait                                       | Update Lead Status nodes                   |                                                                                               |
| Update Lead Status Nodes    | Airtable                         | Update lead email deliverability status              | If deliverable                            | -                                          |                                                                                               |
| Fill Email List             | Airtable                         | Add verified emails to email list                     | Loop over leads                            | -                                          |                                                                                               |
| Get Lead Records (Enrichment) | Airtable                         | Get leads for enrichment                              | Switch                                      | Loop for enrichment                        |                                                                                               |
| Loop for enrichment         | SplitInBatches                 | Batch processing for lead enrichment                  | Get Lead Records (Enrichment)              | Multiple enrichment scrapers               |                                                                                               |
| Enrichment scrapers         | HTTP Request / AI               | Scrape website, LinkedIn posts, profiles, news       | Loop for enrichment                       | Merge data                                |                                                                                               |
| Merge data                  | Merge                            | Combine enrichment data                               | Enrichment scrapers                       | Update enrichment fields                   |                                                                                               |
| Update lead enrichment      | Airtable                         | Store enrichment results                              | Merge data                               | -                                          |                                                                                               |
| Get Lead Records (Qualification) | Airtable                         | Fetch leads for qualification                          | Switch                                      | Loop for qualification                     |                                                                                               |
| Loop for qualification     | SplitInBatches                 | Batch processing for qualification                     | Get Lead Records (Qualification)          | Get Lead for Qualification                 |                                                                                               |
| Get Lead for Qualification | Airtable                         | Get detailed lead record                               | Loop for qualification                   | Search Business Info (Perplexity)          |                                                                                               |
| Search Business Info        | Perplexity                      | AI-powered business research                           | Get Lead for Qualification                | Qualifier Assistant                        |                                                                                               |
| Qualifier Assistant         | OpenAI                          | AI qualification decision                               | Search Business Info                      | Qualified Results                          |                                                                                               |
| Qualified Results           | Set                              | Extract qualification decision and reason              | Qualifier Assistant                      | Qualification Switch                       |                                                                                               |
| Qualification Switch       | Switch                          | Branch based on qualification result                   | Qualified Results                        | Update qualified / unqualified Airtable nodes |                                                                                               |
| Update qualified Lead      | Airtable                         | Update lead as qualified                                | Qualification Switch (qualified)          | -                                          |                                                                                               |
| Update unqualified Lead    | Airtable                         | Update lead as not qualified                            | Qualification Switch (not qualified)      | -                                          |                                                                                               |
| Get Lead Records (Personalization) | Airtable                         | Fetch lead records for personalization                   | Switch                                      | Loop for personalization                   |                                                                                               |
| Loop for personalization  | SplitInBatches                 | Batch processing for personalization                    | Get Lead Records (Personalization)        | Get Lead Record for Personalization         |                                                                                               |
| Get Lead Record for Personalization | Airtable                         | Get detailed lead record                                 | Loop for personalization                 | Prepare data for AI                        |                                                                                               |
| Prepare data for AI        | Set                              | Prepare variables with lead and agency data             | Get Lead Record for Personalization       | Cold Email Writer                          |                                                                                               |
| Cold Email Writer         | OpenAI                         | Generate personalized cold email                         | Prepare data for AI                      | Email Sequence Writer                      |                                                                                               |
| Email Sequence Writer      | OpenAI                         | Generate follow-up email sequences                       | Cold Email Writer                        | Update cold email                          |                                                                                               |
| Update cold email          | Airtable                         | Store generated emails in lead records                   | Email Sequence Writer                    | -                                          |                                                                                               |
| Cold Email Writer [Remake] | OpenAI                         | Revise cold email sequence based on user feedback       | Get Lead Record for Personalization       | Update email records                       |                                                                                               |
| Update email records       | Airtable                         | Apply revised email sequences                             | Cold Email Writer [Remake]                | -                                          |                                                                                               |
| Get Instantly Account       | HTTP Request                    | Retrieve Instantly.ai account emails                      | Get Agency Record                        | Split Emails                             |                                                                                               |
| Split Emails              | SplitOut                        | Split email array                                        | Get Instantly Account                    | Loop over emails                          |                                                                                               |
| Loop Over Emails          | SplitInBatches                 | Batch process emails                                     | Split Emails                            | Fill Email List                          |                                                                                               |
| Fill Email List           | Airtable                       | Store Instantly email accounts                            | Loop Over Emails                        | -                                          |                                                                                               |
| Create Lead Lists         | HTTP Request                    | Create lead lists on Instantly.ai                         | Set lead list data                      | Split lead list                          |                                                                                               |
| Split lead list           | SplitOut                      | Split lead list for processing                            | Create Lead Lists                      | Loop over lead IDs                       |                                                                                               |
| Loop over lead IDs        | SplitInBatches               | Batch process lead IDs                                    | Split lead list                        | Get Lead Record (Instantly)               |                                                                                               |
| Get Lead Record (Instantly) | Airtable                       | Retrieve lead record details                               | Loop over lead IDs                    | Add Lead to Instantly List                |                                                                                               |
| Add Lead to Instantly List | HTTP Request                  | Add lead to Instantly platform                             | Get Lead Record (Instantly)           | Update lead Instantly ID                  |                                                                                               |
| Update lead Instantly ID  | Airtable                       | Store Instantly lead ID in Airtable                        | Add Lead to Instantly List            | -                                          |                                                                                               |
| Update Instantly List Status | Airtable                       | Update Instantly lead list creation status                 | Create Lead Lists                    | -                                          |                                                                                               |
| Get Campaign Record       | Airtable                       | Retrieve campaign data                                     | Switch                                  | Get Campaign Details                     |                                                                                               |
| Get Campaign Details      | Set                            | Extract campaign details                                   | Get Campaign Record                  | Create Instantly Campaign                |                                                                                               |
| Create Instantly Campaign | HTTP Request                  | Create campaign on Instantly platform                       | Get Campaign Details               | If (response check)                      |                                                                                               |
| If (response check)       | If                             | Branch on API response success/failure                     | Create Instantly Campaign          | Update campaign status nodes             |                                                                                               |
| Update campaign status    | Airtable                       | Update campaign record with success or failure             | If (response check)                | -                                          |                                                                                               |
| Move Lead Lists to Campaign | HTTP Request                  | Move Instantly lead list into campaign                      | Get Campaign Record                | If (success check)                       |                                                                                               |
| If (success check)        | If                             | Branch on response success                                  | Move Lead Lists to Campaign       | Update campaign status nodes             |                                                                                               |
| Update campaign status    | Airtable                       | Update campaign status after moving lead list              | If (success check)                | -                                          |                                                                                               |
| Get Instantly Campaign Analytics ID | Airtable                       | Fetch campaign analytics record                            | Switch                                  | Get Instantly Campaign Analytics         |                                                                                               |
| Get Instantly Campaign Analytics | HTTP Request                  | Fetch campaign performance data                             | Get Instantly Campaign Analytics ID | If result available                       |                                                                                               |
| If result available       | If                             | Branch on presence of analytics data                        | Get Instantly Campaign Analytics  | Data processing or Failure status update |                                                                                               |
| Arrange Data              | Code                           | Aggregate analytics metrics                                 | If result available               | Update Airtable Analytics                |                                                                                               |
| Update Airtable Analytics | Airtable                       | Store aggregated campaign analytics                         | Arrange Data                     | -                                          |                                                                                               |

*Sticky Notes are distributed across the workflow to explain blocks and tasks as per their numbering.*

---

## 4. Step-by-Step Reconstruction Guide

**Prerequisites:**

- Airtable bases and tables:
  - Agency Setup
  - Ideal Customer Profiles (ICP)
  - Campaigns
  - Leads
  - Lead Lists
  - Email Accounts (Instanti.ai)
  - Analytics
  - Personalization & Templates
- Credentials:
  - Airtable API token
  - OpenAI API key
  - Jina AI API key
  - Apollo.io API key (used via scraper)
  - Emailable API key
  - Instantly.ai API key (OAuth2 or token)
  - Apify API key
  - Perplexity AI API key

---

### Step 1: Set up Webhook (Entry Point)

- Create **Webhook** node.
- Configure path (e.g., "ai-powered-gtm-bdr-enginer-os").
- Enable webhook for receiving external requests.
- Connect to **Switch** node.

---

### Step 2: Add Switch Node for Action Routing

- Create **Switch** node.
- Add rules based on `{{$json["query"]["action"]}}`.
- Define actions including:
  - searchAgency
  - searchURL
  - getEmailList
  - createInstantlyCampaign
  - launchApolloScraper
  - verifyEmailDeliverability
  - launchLeadEnrichment
  - launchLeadPersonalization
  - getcampaignAnalytics
  - etc.
- Connect each output to respective logic blocks.

---

### Step 3: Agency Enrichment Block

- **Get Agency Record** node: Fetch agency data by record ID.
- **Get Jina Record** node: Retrieve Jina AI API credentials.
- **Agency Website Data**: Use Jina AI scraper to scrape agency website.
- **Business Summary Writer**: Use OpenAI to generate structured summary JSON.
- **Get Agency Business Information**: Extract summary fields.
- **Update Agency Overview**: Update Airtable agency record with enriched data.

---

### Step 4: Ideal Customer Profile & Apollo Search URL Generation

- **Get IDC Record**: Fetch ICP record.
- **Get IDC Records**: Prepare search criteria variables.
- **Apollo Search URL Generator**: Use OpenAI to generate Apollo search URL and list name.
- **Get Apollo Search URL**: Extract URL and list name.
- **Update IDC-SearchURL**: Store URL and status back in Airtable.

---

### Step 5: Apollo Lead Scraping and Email Verification

- **Get Apollo Scraper Record**: Retrieve scraper config.
- **Get Scraper Parameter**: Set scraping parameters.
- **Apollo Lead Scraper**: Call scraper API.
- **Verify Dataset Availability**: Check if data received.
- **Loop over leads**: Batch process lead items.
- **Get Lead Data**: Fetch lead details from Airtable.
- **Emailable**: Verify email deliverability.
- **Wait**: Add delay to avoid rate limits.
- **If deliverable / update lead status nodes**: Update lead email status.
- **Fill Email List**: Store verified leads.

---

### Step 6: Lead Enrichment and Qualification

- **Get Lead Records for enrichment**.
- **Loop for enrichment**: Batch process.
- Scrapers:
  - Website scraper (Jina AI)
  - LinkedIn posts scraper (Apify)
  - LinkedIn profile scraper (Apify)
  - News scraper (Perplexity)
- **Aggregate data** and **Update lead enrichment fields**.
- **Get Lead Records for qualification**.
- **Loop for qualification**.
- **Get Lead for qualification**.
- **Search Business Information** via Perplexity AI.
- **Qualification AI assistant**.
- **Qualification decision switch**.
- **Update Airtable lead qualification status**.

---

### Step 7: Personalized Cold Email Generation

- **Get Lead Records for personalization**.
- **Loop for personalization**.
- **Get Lead Record for personalization**.
- **Prepare data** for AI writing.
- **Cold Email Writer**: Generate initial email.
- **Email Sequence Writer**: Generate follow-up emails.
- **Update cold email content**.
- **Cold Email Writer [Remake]**: Revise emails on feedback.
- **Update email records**.

---

### Step 8: Instantly.ai Lead List & Campaign Management

- **Get Instantly Account**: Fetch available email accounts.
- **Split Emails** & **Loop Over Emails**.
- **Fill Email List** Airtable node.
- **Create Lead Lists** (Instanti.ai API).
- **Split lead list** and **Loop over lead IDs**.
- **Get Lead Record (Instantly)**.
- **Add Lead to Instantly List**.
- **Update Lead Instantly ID**.
- **Update Instantly List Status**.
- **Get Campaign Record** and **Details**.
- **Create Instantly Campaign** API call.
- **Move Lead Lists to Campaign** API call.
- **Update campaign status nodes accordingly**.
- **Get Campaign Analytics** and update Airtable.

---

### Step 9: Status Updates and Error Handling

- Use **If** nodes to branch on API responses and data presence.
- Use **Limit** nodes to constrain batch sizes.
- Use **Wait** nodes for rate limiting.
- Update Airtable records to reflect:
  - Campaign status
  - Lead list status
  - Lead email verification status
  - Lead enrichment status
  - Lead qualification status
  - Email personalization status
  - Campaign analytics status
- Handle failures gracefully with fallback updates.

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|--------------|----------------|
| Airtable base with pre-defined schema is required: Agency Setup, ICP, Leads, Campaigns, Lead Lists, Email Accounts, Analytics, Personalization Templates. | Airtable base links provided in sticky notes; ensure structure before running. |
| The workflow uses AI models (OpenAI GPT-4 variants) for generating summaries, email content, and qualification decisions. | OpenAI API credentials must be set and valid. |
| Jina AI and Apify are used for scraping website and LinkedIn data respectively; API keys required. | Jina AI API and Apify API credentials management necessary. |
| Emailable API is used for email address verification with a 5-second timeout. | Emailable API key required and rate limits considered. |
| Instantly.ai API is used for email campaign management; OAuth2 or API key credentials needed. | Follow Instantly.ai API docs for token setup. |
| Apollo.io search URLs are generated strictly via AI with strict parameter rules to generate compliant URLs. | Follow the prompt rules carefully to avoid invalid URLs. |
| The workflow includes extensive error handling and fallback logic to update statuses in Airtable and avoid silent failures. | Review error handling nodes for customization. |
| Video tutorials and community support links are provided in sticky notes for setup guidance. | https://skool.com and Airtable scripting tutorials. |

---

# End of Documentation