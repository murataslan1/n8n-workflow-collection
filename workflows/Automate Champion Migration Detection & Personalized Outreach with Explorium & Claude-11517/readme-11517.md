Automate Champion Migration Detection & Personalized Outreach with Explorium & Claude

https://n8nworkflows.xyz/workflows/automate-champion-migration-detection---personalized-outreach-with-explorium---claude-11517


# Automate Champion Migration Detection & Personalized Outreach with Explorium & Claude

### 1. Workflow Overview

This workflow automates the detection of champion job migrations and delivers personalized outreach emails using Explorium enrichment and Claude AI generation. It is designed for sales or customer success teams to identify when key contacts ("champions") move to new companies, enrich data about these changes, score the opportunity based on multiple factors, and generate tailored outreach messages to maintain or build relationships.

**Target Use Cases:**
- Detect champions moving to new companies or roles.
- Enrich champion and company data to assess opportunity fit.
- Score and prioritize outreach based on ICP fit, relationship strength, and timing.
- Automate personalized outreach emails for customers, prospects, and cold leads.
- Notify teams via Slack with detailed migration alerts and generated email drafts.

**Logical Blocks:**

- **1.1 Input Reception & Data Retrieval:** Manual trigger and Google Sheets nodes to fetch champion and company records.
- **1.2 Explorium Prospect Identification:** Check for existing Explorium prospect IDs and fetch or write back as needed.
- **1.3 Explorium Enrichment & Job Change Detection:** Enrich champions with job change history, detect job changes, and augment data accordingly.
- **1.4 Company Matching & CRM Relationship Check:** Match new companies with CRM records, determine customer/prospect status.
- **1.5 Opportunity Scoring:** Score companies and champions based on firmographics, relationship, and timing.
- **1.6 Outreach Email Generation:** Generate personalized emails via Claude AI based on lead priority.
- **1.7 Slack Notification:** Compile results and send formatted messages to Slack for team awareness.
- **1.8 Controls & Routing:** Conditional nodes to decide workflow paths based on data presence and scoring.

---

### 2. Block-by-Block Analysis

#### Block 1.1: Input Reception & Data Retrieval

**Overview:**  
Starts the workflow manually and retrieves champion data from Google Sheets filtered by champions flagged as "isChampion". Also fetches company records for CRM matching.

**Nodes Involved:**  
- When clicking ‘Execute workflow’ (Manual Trigger)  
- Get row(s) in sheet (Google Sheets)  
- Pull Company Records to Check if New Company in CRM (Google Sheets)

**Node Details:**

- **When clicking ‘Execute workflow’**  
  - Type: Manual Trigger  
  - Triggers workflow execution manually for testing or scheduled runs.  
  - No inputs, output feeds into champion and company data retrieval.  
  - Failure unlikely, no auth needed.

- **Get row(s) in sheet**  
  - Type: Google Sheets  
  - Retrieves rows where "isChampion" column is true from a sheet named "Champions_CRM" in a specific Google Sheet document.  
  - Uses OAuth2 credentials for Google Sheets.  
  - Input: Manual Trigger  
  - Output: Champion data JSON objects.  
  - Potential failures: Auth issues, API quota, sheet structure changes.

- **Pull Company Records to Check if New Company in CRM**  
  - Type: Google Sheets  
  - Retrieves all company records from the "Companies" sheet in the same Google Sheet document for CRM matching.  
  - Uses OAuth2 credentials.  
  - Input: Manual Trigger  
  - Output: Company data JSON objects.  
  - Potential failures: Same as above.

---

#### Block 1.2: Explorium Prospect Identification

**Overview:**  
Checks if each champion has an Explorium prospect ID. If missing, uses Explorium API to match prospects and writes back the ID to CRM (Google Sheets).

**Nodes Involved:**  
- Check if Champion Has Explorium Prospect ID (If)  
- Explorium API (Prospect Match)  
- Write Back Explorium Prospect ID to CRM (Google Sheets)  
- Code1 (JavaScript)

**Node Details:**

- **Check if Champion Has Explorium Prospect ID**  
  - Type: If  
  - Checks if the "explorium_prospect_id" field is not empty.  
  - Input: Champion data from "Get row(s) in sheet"  
  - Routes champions either to existing ID handling or new Explorium match.  
  - Potential failure: Expression evaluation errors if data missing.

- **Explorium API**  
  - Type: Explorium AI Node (Prospect Match)  
  - Matches champion details (email, LinkedIn, name, company) to Explorium prospect database.  
  - Credentials: Explorium API key required.  
  - Input: Champions missing prospect ID.  
  - Output: Matched prospect data including prospect_id.  
  - Failures: API limits, invalid credentials, network issues.

- **Write Back Explorium Prospect ID to CRM**  
  - Type: Google Sheets Update  
  - Updates the Google Sheet row for each champion to add the matched "explorium_prospect_id".  
  - Uses "champion_id" as matching column.  
  - Input: Explorium API results.  
  - Output: Updated champion data with ID.  
  - Failures: Sheet write permission, concurrency issues.

- **Code1**  
  - Type: JavaScript Code  
  - Combines original champion data with newly matched prospect IDs, ensuring every champion has an "explorium_prospect_id" if available.  
  - Inputs: Original champion data and match results.  
  - Outputs: Complete champion list with prospect IDs included.  
  - Potential failure: Script errors if unexpected data structure.

---

#### Block 1.3: Explorium Enrichment & Job Change Detection

**Overview:**  
Enriches champions with job change history from Explorium, detects if their job/company changed, and constructs a detailed data object for scoring and outreach.

**Nodes Involved:**  
- Enrich Champions With Job Change History (Explorium API - Enrich)  
- Code (JavaScript)  
- Did Job Change? (If)

**Node Details:**

- **Enrich Champions With Job Change History**  
  - Type: Explorium API Node (Enrich)  
  - Enriches each champion with contacts and profile data, including current employment and experience.  
  - Inputs: Champion list with prospect IDs.  
  - Credentials: Explorium API key.  
  - Output: Enriched data array per champion.  
  - Failure modes: API errors, missing prospect IDs.

- **Code**  
  - Type: JavaScript Code  
  - Processes enrichment results to detect if the champion’s company has changed by comparing CRM company vs Explorium company.  
  - Extracts current job details, contact info, location, and flags if a job change occurred.  
  - Outputs comprehensive champion records with new job info and a "job_changed" boolean.  
  - Errors could arise from missing fields or unexpected response formats.

- **Did Job Change?**  
  - Type: If  
  - Checks "job_changed" boolean to route champions into further processing only if a job change occurred.  
  - Input: Output of Code node.  
  - Output: True branch for changed jobs; false branch ignored in this workflow scope.

---

#### Block 1.4: Company Matching & CRM Relationship Check

**Overview:**  
For champions with job changes, matches their new company against CRM company records, determines if the new company exists in CRM, and identifies relationship type.

**Nodes Involved:**  
- Pull Company Records to Check if New Company in CRM (Google Sheets) (from Block 1.1)  
- Check if Exist in CRM (Code)  
- Match to explorium for Business ID (Explorium API - Match)  
- Enrich with Explorium Business Data (Explorium API - Enrich)  
- Check if Customer or Prospect (Switch)

**Node Details:**

- **Check if Exist in CRM**  
  - Type: JavaScript Code  
  - Compares each champion’s new company name (lowercased) against CRM company names using substring matching (includes or contained by).  
  - Flags whether matched to CRM, relationship type, CRM company ID, opportunity details, and account owner info.  
  - Inputs: Job-changed champions and CRM company records.  
  - Output: Champions augmented with CRM relationship info.  
  - Potential failures: Matching logic errors, inconsistent naming.

- **Match to explorium for Business ID**  
  - Type: Explorium API Node (Match Businesses)  
  - Matches new company names to Explorium business database to get business_id for deeper enrichment.  
  - Inputs: Champions with new company names.  
  - Credentials: Explorium API key.  
  - Output: Business match results with business_id.  
  - Failures: API access, data mismatches.

- **Enrich with Explorium Business Data**  
  - Type: Explorium API Node (Enrich Businesses)  
  - Enriches matched businesses with firmographics, technographics, financial metrics, and funding info.  
  - Inputs: business_id from previous node.  
  - Credentials: Explorium API key.  
  - Output: Detailed company enrichment data.  
  - Failure: API rate limits, incomplete data.

- **Check if Customer or Prospect**  
  - Type: Switch  
  - Routes champions based on "relationship_type" field: Customer or Prospect.  
  - Input: Enriched company and champion data.  
  - Output: Customer branch leads to congratulation email generation; Prospect branch leads to scoring.

---

#### Block 1.5: Opportunity Scoring

**Overview:**  
Scores each champion opportunity using enriched company data, relationship strength, timing, and CRM status to prioritize outreach.

**Nodes Involved:**  
- Score Prospect (Code)  
- Check if Lead is Hot/Warm/Cold (If)

**Node Details:**

- **Score Prospect**  
  - Type: JavaScript Code  
  - Calculates three main scores: ICP score (based on company size, funding, revenue, tech stack), Relationship score (relationship strength, deals influenced, CRM status boost), and Timing score (days at company, funding, acquisition).  
  - Combines into a weighted opportunity score (0-100) and assigns priority labels: HOT, WARM, COLD.  
  - Determines outreach strategy suggestions based on status.  
  - Inputs: Prospect champions with enrichment and CRM data.  
  - Output: Scored champions with detailed scoring breakdown.  
  - Potential failure: Incorrect data assumptions, missing data fields.

- **Check if Lead is Hot/Warm/Cold**  
  - Type: If  
  - Routes leads by priority to different outreach email generation nodes.  
  - Input: Scored champion data.  
  - Output: HOT/WARM branch and COLD branch.

---

#### Block 1.6: Outreach Email Generation

**Overview:**  
Generates personalized email bodies using Claude AI based on lead priority and relationship type.

**Nodes Involved:**  
- Write Email for Customer to Congratulate Champion on New Role (HTTP Request to Claude)  
- Warm/Hot Lead (HTTP Request to Claude)  
- Cold Lead Email (HTTP Request to Claude)

**Node Details:**

- **Write Email for Customer to Congratulate Champion on New Role**  
  - Type: HTTP Request  
  - Sends prompt to Anthropic Claude model to write a warm, professional congratulation email for customers, referencing deals influenced and past relationship.  
  - Inputs: Customer champions with enrichment data.  
  - Outputs: Email body only (no subject).  
  - Auth: Anthropic API key in header.  
  - Failures: API key invalid, rate limits.

- **Warm/Hot Lead**  
  - Type: HTTP Request  
  - Generates strategic outreach emails for warm/hot leads, referencing past success and suggesting calls.  
  - Auth: Anthropic API key.  
  - Inputs: HOT/WARM scored prospects.  
  - Output: Email body only.

- **Cold Lead Email**  
  - Type: HTTP Request  
  - Creates brief congratulations emails for cold leads with minimal personalization.  
  - Auth: Anthropic API key.  
  - Inputs: COLD leads.  
  - Output: Email body only.

---

#### Block 1.7: Slack Notification

**Overview:**  
Compiles generated messages and metadata into formatted Slack messages and posts them to a Slack channel for team visibility.

**Nodes Involved:**  
- Merge to Send to Slack (Merge)  
- Send a message (Slack)

**Node Details:**

- **Merge to Send to Slack**  
  - Type: Merge  
  - Merges outputs from different email generation nodes into a single stream for Slack posting.  
  - Inputs: Warm/Hot Lead emails and Cold Lead emails, plus customer emails.  
  - Output: Combined champion records with email content and scoring info.

- **Send a message**  
  - Type: Slack node  
  - Sends detailed Slack messages containing champion migration alerts, relationship data, priority, opportunity score, and the generated email content.  
  - Uses Slack OAuth2 credentials.  
  - Messages formatted as blocks with clear sections and emoji-coded priority.  
  - Failure: OAuth2 token expiry, Slack API rate limits.

---

#### Block 1.8: Controls & Routing

**Overview:**  
Various If and Switch nodes control the flow based on data presence and scoring.

**Nodes Involved:**  
- Check if Champion Has Explorium Prospect ID (If)  
- Did Job Change? (If)  
- Check if Customer or Prospect (Switch)  
- Check if Lead is Hot/Warm/Cold (If)

**Node Details:**

- These nodes ensure only relevant champions are processed further, routing based on missing IDs, job change detection, relationship type, and lead priority.

---

### 3. Summary Table

| Node Name                                      | Node Type                      | Functional Role                              | Input Node(s)                           | Output Node(s)                         | Sticky Note                                                                                                                            |
|-----------------------------------------------|--------------------------------|----------------------------------------------|----------------------------------------|--------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’               | Manual Trigger                 | Start workflow manually                      | None                                   | Get row(s) in sheet, Pull Company Records to Check if New Company in CRM | # Try It Out! This n8n workflow automatically tracks when your champion contacts change companies... (see full sticky note content)   |
| Get row(s) in sheet                            | Google Sheets                  | Retrieve champions marked as isChampion     | When clicking ‘Execute workflow’       | Check if Champion Has Explorium Prospect ID | ## Modification Recommendation Connect your CRM here & in all places where Google Sheets is leveraged.                               |
| Check if Champion Has Explorium Prospect ID   | If                            | Check if Explorium prospect ID exists       | Get row(s) in sheet                    | Code1 (true branch), Explorium API (false branch) |                                                                                                                                        |
| Explorium API                                 | Explorium AI Node             | Match champion to Explorium prospect         | Check if Champion Has Explorium Prospect ID | Write Back Explorium Prospect ID to CRM | ## Modification Recommendation Consider a branch here to only match when it doesn't exist in CRM to save API credits.                 |
| Write Back Explorium Prospect ID to CRM       | Google Sheets                 | Update CRM with Explorium prospect ID       | Explorium API                         | Code1                                |                                                                                                                                        |
| Code1                                         | Code                          | Merge new Explorium prospect IDs into data  | Check if Champion Has Explorium Prospect ID, Write Back Explorium Prospect ID to CRM | Enrich Champions With Job Change History |                                                                                                                                        |
| Enrich Champions With Job Change History      | Explorium AI Node             | Enrich champions with job history data      | Code1                                 | Code                                 | ## Modification Recommendation Consider a branch here to only match when it doesn't exist in CRM to save API credits.                 |
| Code                                          | Code                          | Detect job changes and construct detailed data | Enrich Champions With Job Change History | Did Job Change?                      |                                                                                                                                        |
| Did Job Change?                               | If                            | Check if champion changed jobs               | Code                                  | Check if Exist in CRM (true branch)  |                                                                                                                                        |
| Pull Company Records to Check if New Company in CRM | Google Sheets                  | Retrieve CRM company records                  | When clicking ‘Execute workflow’       | Check if Exist in CRM                 |                                                                                                                                        |
| Check if Exist in CRM                         | Code                          | Match new company names with CRM companies  | Did Job Change?, Pull Company Records to Check if New Company in CRM | Match to explorium for Business ID   |                                                                                                                                        |
| Match to explorium for Business ID            | Explorium AI Node             | Match new company name to Explorium business | Check if Exist in CRM                  | Enrich with Explorium Business Data  | ## Modification Recommendation Consider a branch here to only match when it doesn't exist in CRM to save API credits.                 |
| Enrich with Explorium Business Data           | Explorium AI Node             | Enrich matched companies with firmographic data | Match to explorium for Business ID     | Check if Customer or Prospect         |                                                                                                                                        |
| Check if Customer or Prospect                  | Switch                       | Route by CRM relationship type               | Enrich with Explorium Business Data   | Write Email for Customer..., Score Prospect |                                                                                                                                        |
| Write Email for Customer to Congratulate Champion on New Role | HTTP Request (Claude AI)       | Generate congratulation email for customers | Check if Customer or Prospect          | Merge to Send to Slack               | ## Modification Recommendation Modify the email template prompts to match your brand voice.                                            |
| Score Prospect                                | Code                          | Score prospect opportunity                    | Check if Customer or Prospect          | Check if Lead is Hot/Warm/Cold       | ## Modification Recommendation Write a scoring system that matches your business OR use a dynamic scoring system in Claude or similar tools |
| Check if Lead is Hot/Warm/Cold                 | If                            | Route leads by priority                        | Score Prospect                        | Warm/Hot Lead, Cold Lead Email       |                                                                                                                                        |
| Warm/Hot Lead                                 | HTTP Request (Claude AI)       | Generate warm/hot lead outreach emails       | Check if Lead is Hot/Warm/Cold (true) | Merge to Send to Slack               | ## Modification Recommendation Modify the email template prompts to match your brand voice.                                            |
| Cold Lead Email                               | HTTP Request (Claude AI)       | Generate cold lead emails                      | Check if Lead is Hot/Warm/Cold (false) | Merge to Send to Slack               | ## Modification Recommendation Consider turning this node into an agent that sends the cold emails automatically!                      |
| Merge to Send to Slack                        | Merge                        | Combine email outputs for Slack notification | Write Email for Customer..., Warm/Hot Lead, Cold Lead Email | Send a message                     |                                                                                                                                        |
| Send a message                                | Slack                        | Post formatted champion migration alerts     | Merge to Send to Slack                | None                                 | ## Modification Recommendation Consider writing the draft for them directly in their inbox and notify them or another tool...         |
| Sticky Note                                   | Sticky Note                  | Provides detailed workflow overview and usage guidance | None                                | None                                 | # Try It Out! This n8n workflow automatically tracks when your champion contacts change companies and responds with intelligent...  |
| Sticky Note1                                  | Sticky Note                  | Recommends CRM connection instead of Google Sheets | None                                | None                                 | ## Modification Recommendation Connect your CRM here & in all places where Google Sheets is leveraged.                               |
| Sticky Note2                                  | Sticky Note                  | Suggests automating cold email sending       | None                                | None                                 | ## Modification Recommendation Consider turning this node into an agent that sends the cold emails automatically!                      |
| Sticky Note3                                  | Sticky Note                  | Suggests customizing scoring system           | None                                | None                                 | ## Modification Recommendation Write a scoring system that matches your business OR use a dynamic scoring system in Claude or similar tools |
| Sticky Note4                                  | Sticky Note                  | Suggests editing email prompt tone and style  | None                                | None                                 | ## Modification Recommendation Modify the email template prompts to match your brand voice.                                            |
| Sticky Note5                                  | Sticky Note                  | Suggests integrating direct inbox draft sending and tracking | None                                | None                                 | ## Modification Recommendation Consider writing the draft for them directly in their inbox and notify them or another tool...         |
| Sticky Note6                                  | Sticky Note                  | Suggests API credit savings by limiting Explorium matches | None                                | None                                 | ## Modification Recommendation Consider a branch here to only match when it doesn't exist in CRM to save API credits.                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Add "Manual Trigger" node named "When clicking ‘Execute workflow’".

2. **Add Google Sheets Node to Retrieve Champions**  
   - Type: Google Sheets  
   - Operation: Get rows  
   - Sheet Name: Specify "Champions_CRM" (gid=0)  
   - Filter: Only rows where "isChampion" equals true  
   - Credentials: Setup OAuth2 for Google Sheets  
   - Connect output of Manual Trigger to this node.

3. **Add Google Sheets Node to Retrieve Company Records**  
   - Type: Google Sheets  
   - Operation: Get rows  
   - Sheet Name: "Companies" (gid=84963940)  
   - Credentials: Same Google Sheets OAuth2  
   - Connect output of Manual Trigger to this node (parallel to champions).

4. **Add If Node to Check for Explorium Prospect ID**  
   - Condition: Check if `explorium_prospect_id` is not empty.  
   - Input: Champion rows from Google Sheets.

5. **Add Explorium API Node for Prospect Match**  
   - Type: Explorium AI Node (Prospects - Match)  
   - Input: Champions without `explorium_prospect_id`  
   - Parameters: Match on email, LinkedIn URL, full name, company name  
   - Credentials: Explorium API key.

6. **Add Google Sheets Node to Write Back Prospect ID**  
   - Type: Google Sheets (Update)  
   - Sheet: "Champions_CRM" (gid=0)  
   - Matching Column: "champion_id"  
   - Update field: `explorium_prospect_id` with matched prospect ID  
   - Credentials: Google Sheets OAuth2  
   - Connect output of Explorium API here.

7. **Add JavaScript Code Node (Code1)**  
   - Purpose: Merge new prospect IDs back into champion data  
   - Input: From both branches of If node and write back node  
   - Logic: Assign newly matched prospect IDs where missing.

8. **Add Explorium API Node for Enrichment of Champions**  
   - Type: Explorium AI Node (Prospects - Enrich)  
   - Input: Champion prospect IDs from Code1  
   - Enrichment: contacts, profiles  
   - Credentials: Explorium API key.

9. **Add JavaScript Code Node**  
   - Purpose: Detect job changes by comparing CRM and Explorium company names  
   - Extract current job details and create job_changed boolean.  
   - Input: Enrich Champions With Job Change History.

10. **Add If Node "Did Job Change?"**  
    - Condition: Check if `job_changed` is true.  
    - Input: Output of the above Code node.

11. **Add Google Sheets Node to Retrieve Company Records**  
    - Input: From Manual Trigger (already added).  
    - Used for matching new companies.

12. **Add JavaScript Code Node "Check if Exist in CRM"**  
    - Inputs: Output of Did Job Change? (true branch) and company records.  
    - Logic: Match new company names to CRM company names by substring comparison.  
    - Adds CRM relationship info fields.

13. **Add Explorium API Node "Match to explorium for Business ID"**  
    - Input: New company names from previous node.  
    - Credentials: Explorium API key.

14. **Add Explorium API Node "Enrich with Explorium Business Data"**  
    - Input: Matched business IDs.  
    - Enrich firmographics, technographics, financials, funding.

15. **Add Switch Node "Check if Customer or Prospect"**  
    - Routes based on relationship_type field: Customer or Prospect.

16. **Add HTTP Request Node "Write Email for Customer to Congratulate Champion on New Role"**  
    - Input: Customer branch output.  
    - Uses Anthropic Claude API to generate congrats email.  
    - Setup headers with Anthropic API key.

17. **Add JavaScript Code Node "Score Prospect"**  
    - Input: Prospect branch output.  
    - Logic: Calculate ICP, relationship, timing, and opportunity scores.  
    - Assign outreach priority and strategy.

18. **Add If Node "Check if Lead is Hot/Warm/Cold"**  
    - Condition: Priority equals HOT or WARM.  
    - Input: Score Prospect output.

19. **Add HTTP Request Node "Warm/Hot Lead"**  
    - Input: HOT/WARM branch.  
    - Generate strategic outreach email using Claude AI.

20. **Add HTTP Request Node "Cold Lead Email"**  
    - Input: COLD branch (false branch of above If).  
    - Generate brief congratulations email.

21. **Add Merge Node "Merge to Send to Slack"**  
    - Merge all email outputs (Customer, Warm/Hot, Cold) into one stream.

22. **Add Slack Node "Send a message"**  
    - Input: Merge node output.  
    - Send formatted Slack messages with champion migration alert, scores, priority, and generated email content.  
    - Setup OAuth2 for Slack.

23. **Connect all nodes according to described logical flow.**

24. **Test the workflow with sample data and validate outputs at each step.**

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                        | Context or Link                                                                                                                        |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| This n8n workflow automatically tracks champion job changes and triggers personalized AI outreach to prevent revenue leakage and prioritize high-value opportunities. Replace Google Sheets with your CRM for production use.                                                                    | Sticky Note (Node "Sticky Note")                                                                                                     |
| Connect your CRM system in place of Google Sheets wherever applicable to scale and automate with live CRM data.                                                                                                                                                                                  | Sticky Note1                                                                                                                          |
| Customize the scoring system in the "Score Prospect" node to better match your Ideal Customer Profile (ICP) and business priorities. Consider dynamic scoring via AI if needed.                                                                                                                      | Sticky Note3                                                                                                                          |
| Modify Claude AI prompt templates to match your brand voice, tone, and outreach strategy for better personalization and alignment.                                                                                                                                                              | Sticky Note4                                                                                                                          |
| Consider automating cold email sending by extending the "Cold Lead Email" node into an agent that sends emails directly, increasing outreach efficiency.                                                                                                                                         | Sticky Note2                                                                                                                          |
| Instead of Slack notification only, consider writing email drafts directly in user inboxes with tracking and notifications to improve engagement workflow.                                                                                                                                       | Sticky Note5                                                                                                                          |
| To save API credits, add logic to only call Explorium matching nodes for champions or companies not already matched in your CRM.                                                                                                                                                                  | Sticky Note6                                                                                                                          |
| Explorium and Anthropic APIs may have geographic or usage restrictions. Ensure you have valid API keys and credits before scaling.                                                                                                                                                                | Sticky Note (Node "Sticky Note")                                                                                                     |
| Anthropic Claude API documentation: https://www.anthropic.com/index/claude-api                                                                                                                                                                                                                     | External Resource                                                                                                                     |
| Explorium API documentation: https://docs.explorium.ai/                                                                                                                                                                                                                                             | External Resource                                                                                                                     |
| Slack API OAuth2 setup guide: https://api.slack.com/authentication/oauth-v2                                                                                                                                                                                                                        | External Resource                                                                                                                     |

---

**Disclaimer:** The provided text is exclusively derived from an automated n8n workflow created with n8n integration and automation software. This process strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and publicly available.