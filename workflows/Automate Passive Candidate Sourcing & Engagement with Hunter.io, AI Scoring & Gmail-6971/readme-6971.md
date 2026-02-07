Automate Passive Candidate Sourcing & Engagement with Hunter.io, AI Scoring & Gmail

https://n8nworkflows.xyz/workflows/automate-passive-candidate-sourcing---engagement-with-hunter-io--ai-scoring---gmail-6971


# Automate Passive Candidate Sourcing & Engagement with Hunter.io, AI Scoring & Gmail

### 1. Workflow Overview

This workflow automates the sourcing and engagement of passive candidates using Hunter.io for candidate contact discovery, AI-driven resume analysis and scoring, and Gmail for outreach email sequences. It targets recruiters or talent acquisition teams aiming to identify high-potential candidates from external sources, score them based on resume data, and engage them through a structured email nurturing sequence logged into Google Sheets.

The workflow is logically divided into the following blocks:

- **1.1 Trigger & Candidate Discovery:** Initiates the process manually, generates a search query, and calls the Hunter.io API to find candidate contacts.
- **1.2 Candidate Filtering & Logging:** Filters candidates from Hunter.io results and logs potential candidates into Google Sheets.
- **1.3 AI Resume Analysis & Scoring:** Analyzes candidate resumes using AI logic and calculates a candidate score.
- **1.4 Outreach Decision & Initial Contact:** Checks if the score meets a threshold (>75) to start outreach, sends an initial email, and updates candidate status.
- **1.5 Multi-step Follow-up & Nurturing:** Manages a timed email follow-up sequence with status updates and conditional checks for replies, culminating in a final nurture email if no reply is received.

---

### 2. Block-by-Block Analysis

#### 2.1 Trigger & Candidate Discovery

- **Overview:**  
  Initiates the workflow manually, generates a candidate search query dynamically, and queries Hunter.io to retrieve candidate contact information.

- **Nodes Involved:**  
  - When clicking ‘Execute workflow’ (Manual Trigger)  
  - Generate Search Query (Code)  
  - Hunter.io (HTTP Request)

- **Node Details:**  

  - **When clicking ‘Execute workflow’**  
    - Type: Manual Trigger  
    - Role: Initiates the workflow on manual execution from UI.  
    - Configuration: No parameters needed.  
    - Inputs: None  
    - Outputs: Triggers "Generate Search Query" node.  
    - Edge Cases: None inherent; user-dependent.  

  - **Generate Search Query**  
    - Type: Code Node (JavaScript)  
    - Role: Constructs a dynamic search query string based on workflow logic or variables (e.g., job title, skills).  
    - Configuration: Custom JS code to build the query.  
    - Inputs: Trigger data from manual start.  
    - Outputs: Query string for Hunter.io call.  
    - Potential Failures: Expression errors, undefined variables.  

  - **Hunter.io**  
    - Type: HTTP Request  
    - Role: Calls Hunter.io API to search and retrieve candidate contact info based on query.  
    - Configuration: Uses Hunter.io API key credential, endpoint set for candidate search, query parameter from previous node.  
    - Inputs: Search query string.  
    - Outputs: Raw candidate data JSON.  
    - Edge Cases: API auth failure, rate limits, no results returned, network errors.  

---

#### 2.2 Candidate Filtering & Logging

- **Overview:**  
  Filters the raw candidate data to remove irrelevant or duplicate entries and logs potential candidates into a Google Sheet with status "Potential."

- **Nodes Involved:**  
  - Filter Candidates: (Code)  
  - Log Potential Candidates (Google Sheets)

- **Node Details:**  

  - **Filter Candidates:**  
    - Type: Code Node  
    - Role: Applies filtering criteria (e.g., valid email, relevant experience) to Hunter.io results.  
    - Configuration: JS code filtering based on candidate attributes.  
    - Inputs: Hunter.io results JSON.  
    - Outputs: Filtered candidate list.  
    - Edge Cases: Empty input, malformed data, filtering logic errors.  

  - **Log Potential Candidates:**  
    - Type: Google Sheets Node  
    - Role: Inserts candidate info into Google Sheets with fields: name, email, status="Potential".  
    - Configuration: Sheet and worksheet specified, fields mapped from candidate JSON.  
    - Inputs: Filtered candidate list.  
    - Outputs: Confirmation of row insertions.  
    - Edge Cases: Google API auth issues, rate limits, sheet permission errors.  

---

#### 2.3 AI Resume Analysis & Scoring

- **Overview:**  
  Processes candidate resumes through AI logic to analyze and quantify candidate quality, producing a score used to decide engagement.

- **Nodes Involved:**  
  - AI Resume Analysis (Code)  
  - Calculate Candidate Score (Code)

- **Node Details:**  

  - **AI Resume Analysis:**  
    - Type: Code Node  
    - Role: Runs AI-based analysis on candidate resumes or extracted data. Could include NLP and keyword extraction.  
    - Configuration: Custom JS code implementing AI logic or calling AI service.  
    - Inputs: Candidate data from Google Sheets logging.  
    - Outputs: Resume analysis results (e.g., skills match, experience level).  
    - Edge Cases: Missing resume data, AI service errors, data format issues.  

  - **Calculate Candidate Score:**  
    - Type: Code Node  
    - Role: Converts AI analysis output into a numeric score for decision-making.  
    - Configuration: Scoring algorithm implemented in JS.  
    - Inputs: AI Resume Analysis output.  
    - Outputs: Numeric candidate score.  
    - Edge Cases: Calculation errors, invalid input data.  

---

#### 2.4 Outreach Decision & Initial Contact

- **Overview:**  
  Determines if candidate score passes threshold to start outreach, sends initial outreach email, and updates candidate status in Google Sheets.

- **Nodes Involved:**  
  - Is Score > 75? (If node)  
  - Send Initial Outreach Email (Gmail)  
  - Update Status 'Contacted' (Google Sheets)

- **Node Details:**  

  - **Is Score > 75?**  
    - Type: If Node  
    - Role: Evaluates whether candidate score exceeds 75.  
    - Configuration: Condition on score field > 75.  
    - Inputs: Candidate score.  
    - Outputs: Branches to outreach or stops.  
    - Edge Cases: Missing score, type mismatch.  

  - **Send Initial Outreach Email:**  
    - Type: Gmail Node  
    - Role: Sends personalized initial contact email to candidate.  
    - Configuration: Uses Gmail OAuth2 credentials, email template with dynamic fields (name, role, etc.).  
    - Inputs: Candidate email and info.  
    - Outputs: Email send confirmation.  
    - Edge Cases: Gmail auth errors, quota exceeded, invalid email addresses.  

  - **Update Status 'Contacted':**  
    - Type: Google Sheets Node  
    - Role: Updates candidate row status to "Contacted" and records contact date/time.  
    - Configuration: Maps fields: Status="Contacted", Contacted On=current timestamp.  
    - Inputs: Candidate data after email sent.  
    - Outputs: Row update confirmation.  
    - Edge Cases: Sheet update conflicts, permission errors.  

---

#### 2.5 Multi-step Follow-up & Nurturing

- **Overview:**  
  Manages timed waits and conditional checks to send follow-up and final nurture emails if candidates do not reply, updating statuses accordingly.

- **Nodes Involved:**  
  - Wait (Wait node)  
  - No Reply? (If node)  
  - Send Follow-up Email (Gmail)  
  - Update Status 'Followed Up' (Google Sheets)  
  - 5 Days (Wait node)  
  - Still No Reply? (If node)  
  - Send Final Nurture Email (Gmail)  
  - Update Status 'Nurtured' (Google Sheets)

- **Node Details:**  

  - **Wait:**  
    - Type: Wait Node  
    - Role: Pauses workflow for configured time before next action (e.g., a few days).  
    - Configuration: Time duration set (not shown explicitly).  
    - Inputs: After initial contact update.  
    - Outputs: Triggers "No Reply?" check.  
    - Edge Cases: Workflow timeout, incorrect wait duration.  

  - **No Reply?:**  
    - Type: If Node  
    - Role: Checks if candidate has replied within wait period (logic likely based on Google Sheets or Gmail data).  
    - Configuration: Condition on reply status field.  
    - Inputs: Post-wait candidate status.  
    - Outputs: Branches to send follow-up email or end.  
    - Edge Cases: Reply detection failure, stale data.  

  - **Send Follow-up Email:**  
    - Type: Gmail Node  
    - Role: Sends follow-up email to candidate.  
    - Configuration: Gmail OAuth2, templated email body.  
    - Inputs: Candidate email and data.  
    - Outputs: Email send confirmation.  
    - Edge Cases: Same as initial email.  

  - **Update Status 'Followed Up':**  
    - Type: Google Sheets Node  
    - Role: Updates candidate status to "Followed Up".  
    - Configuration: Field Status="Followed Up".  
    - Inputs: After sending follow-up email.  
    - Outputs: Row update confirmation.  
    - Edge Cases: Same as other Google Sheets nodes.  

  - **5 Days:**  
    - Type: Wait Node  
    - Role: Waits 5 days before next action.  
    - Configuration: Wait duration set to 5 days.  
    - Inputs: After updating follow-up status.  
    - Outputs: Triggers "Still No Reply?" check.  

  - **Still No Reply?:**  
    - Type: If Node  
    - Role: Checks if still no reply after 5 days.  
    - Configuration: Reply status condition.  
    - Inputs: Post-wait candidate status.  
    - Outputs: Branch to final nurture email or end.  

  - **Send Final Nurture Email:**  
    - Type: Gmail Node  
    - Role: Sends last nurturing email to candidate.  
    - Configuration: Gmail OAuth2, templated nurture email.  
    - Inputs: Candidate email and data.  
    - Outputs: Email send confirmation.  

  - **Update Status 'Nurtured':**  
    - Type: Google Sheets Node  
    - Role: Updates status to "Nurtured".  
    - Configuration: Field Status="Nurtured".  

---

### 3. Summary Table

| Node Name                 | Node Type            | Functional Role                             | Input Node(s)                      | Output Node(s)                      | Sticky Note                                    |
|---------------------------|----------------------|---------------------------------------------|----------------------------------|-----------------------------------|------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger       | Starts workflow manually                    | None                             | Generate Search Query              |                                                |
| Generate Search Query      | Code                 | Builds candidate search query string       | When clicking ‘Execute workflow’ | Hunter.io                        |                                                |
| Hunter.io                 | HTTP Request         | Calls Hunter.io API for candidate contacts | Generate Search Query            | Filter Candidates:                 |                                                |
| Filter Candidates:         | Code                 | Filters candidate data for relevance        | Hunter.io                       | Log Potential Candidates           |                                                |
| Log Potential Candidates   | Google Sheets        | Logs candidates as potential in sheet      | Filter Candidates:               | AI Resume Analysis                 | Fields: name={{ $json.full_name }}, email={{ $json.email }}, status=Potential |
| AI Resume Analysis         | Code                 | Analyzes resumes using AI logic             | Log Potential Candidates         | Calculate Candidate Score          |                                                |
| Calculate Candidate Score  | Code                 | Computes numeric candidate score            | AI Resume Analysis               | Is Score > 75?                    |                                                |
| Is Score > 75?             | If                   | Checks if candidate score passes threshold  | Calculate Candidate Score        | Send Initial Outreach Email        |                                                |
| Send Initial Outreach Email| Gmail                | Sends initial contact email                  | Is Score > 75?                  | Update Status 'Contacted'          |                                                |
| Update Status 'Contacted'  | Google Sheets        | Updates candidate status to "Contacted"     | Send Initial Outreach Email     | Wait                             | Fields: Status=Contacted, Contacted On={{ $now }} |
| Wait                      | Wait                 | Pauses workflow before reply check          | Update Status 'Contacted'        | No Reply?                        |                                                |
| No Reply?                 | If                   | Checks if candidate replied                   | Wait                            | Send Follow-up Email               |                                                |
| Send Follow-up Email       | Gmail                | Sends follow-up email                        | No Reply?                      | Update Status 'Followed Up'        |                                                |
| Update Status 'Followed Up'| Google Sheets        | Updates status to "Followed Up"               | Send Follow-up Email            | 5 Days                          | Fields: Status=Followed Up                      |
| 5 Days                    | Wait                 | Waits 5 days before next check                | Update Status 'Followed Up'      | Still No Reply?                  |                                                |
| Still No Reply?            | If                   | Checks if still no reply after 5 days        | 5 Days                         | Send Final Nurture Email           |                                                |
| Send Final Nurture Email   | Gmail                | Sends final nurturing email                   | Still No Reply?                 | Update Status 'Nurtured'           |                                                |
| Update Status 'Nurtured'   | Google Sheets        | Updates status to "Nurtured"                   | Send Final Nurture Email        | None                            | Fields: Status=Nurtured                         |
| Sticky Note                | Sticky Note          | Visual notes in workflow                      | None                           | None                            |                                                |
| Sticky Note1               | Sticky Note          | Visual notes in workflow                      | None                           | None                            |                                                |
| Sticky Note2               | Sticky Note          | Visual notes in workflow                      | None                           | None                            |                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Name: When clicking ‘Execute workflow’  
   - Type: Manual Trigger  
   - No parameters needed.  

2. **Add Code Node to Generate Search Query**  
   - Name: Generate Search Query  
   - Type: Code  
   - Implement JavaScript logic to build a search query string for Hunter.io based on desired candidate criteria (e.g., job title, skills).  
   - Connect output of Manual Trigger to this node.  

3. **Add HTTP Request Node for Hunter.io**  
   - Name: Hunter.io  
   - Type: HTTP Request  
   - Set method to GET or POST depending on API spec.  
   - Endpoint: Hunter.io candidate search API endpoint.  
   - Authentication: Use Hunter.io API Key credential.  
   - Pass query from "Generate Search Query" node as parameter.  
   - Connect from Generate Search Query node.  

4. **Add Code Node to Filter Candidates**  
   - Name: Filter Candidates:  
   - Type: Code  
   - Implement JS code filtering candidates based on criteria (valid emails, experience, etc.).  
   - Connect from Hunter.io node.  

5. **Add Google Sheets Node to Log Potential Candidates**  
   - Name: Log Potential Candidates  
   - Type: Google Sheets  
   - Configure to append rows to a Google Sheet dedicated for candidates.  
   - Map fields: name = `{{$json["full_name"]}}`, email = `{{$json["email"]}}`, status = `"Potential"`  
   - Connect from Filter Candidates node.  

6. **Add Code Node for AI Resume Analysis**  
   - Name: AI Resume Analysis  
   - Type: Code  
   - Implement AI analysis logic on candidate data or resume text.  
   - Connect from Log Potential Candidates node.  

7. **Add Code Node to Calculate Candidate Score**  
   - Name: Calculate Candidate Score  
   - Type: Code  
   - Implement scoring algorithm to output numeric score.  
   - Connect from AI Resume Analysis node.  

8. **Add If Node to Check Score Threshold**  
   - Name: Is Score > 75?  
   - Type: If  
   - Condition: `score > 75`  
   - Connect from Calculate Candidate Score node.  

9. **Add Gmail Node to Send Initial Outreach Email**  
   - Name: Send Initial Outreach Email  
   - Type: Gmail  
   - Configure with Gmail OAuth2 credentials.  
   - Create email template with dynamic candidate fields (name, role).  
   - Connect from "true" output of If node.  

10. **Add Google Sheets Node to Update Status 'Contacted'**  
    - Name: Update Status 'Contacted'  
    - Type: Google Sheets  
    - Configure to update candidate row status to "Contacted" and add current timestamp to "Contacted On" field.  
    - Connect from Send Initial Outreach Email node.  

11. **Add Wait Node**  
    - Name: Wait  
    - Type: Wait  
    - Configure wait duration (e.g., 3 days).  
    - Connect from Update Status 'Contacted' node.  

12. **Add If Node to Check for Reply (No Reply?)**  
    - Name: No Reply?  
    - Type: If  
    - Condition based on whether candidate replied (requires custom logic or integration).  
    - Connect from Wait node.  

13. **Add Gmail Node to Send Follow-up Email**  
    - Name: Send Follow-up Email  
    - Type: Gmail  
    - Configure as per initial email with follow-up content.  
    - Connect from "true" output of No Reply? node.  

14. **Add Google Sheets Node to Update Status 'Followed Up'**  
    - Name: Update Status 'Followed Up'  
    - Type: Google Sheets  
    - Update status field to "Followed Up".  
    - Connect from Send Follow-up Email node.  

15. **Add Wait Node**  
    - Name: 5 Days  
    - Type: Wait  
    - Configure wait duration to 5 days.  
    - Connect from Update Status 'Followed Up' node.  

16. **Add If Node to Check Still No Reply**  
    - Name: Still No Reply?  
    - Type: If  
    - Condition based on reply status.  
    - Connect from 5 Days wait node.  

17. **Add Gmail Node to Send Final Nurture Email**  
    - Name: Send Final Nurture Email  
    - Type: Gmail  
    - Configure with nurturing email content.  
    - Connect from "true" output of Still No Reply? node.  

18. **Add Google Sheets Node to Update Status 'Nurtured'**  
    - Name: Update Status 'Nurtured'  
    - Type: Google Sheets  
    - Update status field to "Nurtured".  
    - Connect from Send Final Nurture Email node.  

19. **Add Sticky Notes**  
    - Add visual sticky notes as needed for documentation within n8n editor.  

---

### 5. General Notes & Resources

| Note Content                                                                                         | Context or Link                                                                                  |
|----------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Google Sheets fields mapping: name={{ $json.full_name }}, email={{ $json.email }}, status=Potential | Applies to "Log Potential Candidates" node for proper candidate logging in sheet.              |
| Google Sheets status updates include timestamps (e.g., Contacted On={{ $now }})                     | Ensures tracking of candidate engagement timeline.                                            |
| Gmail nodes require OAuth2 credentials setup with appropriate account permissions                   | Gmail API quotas and permission scope must be configured for sending emails programmatically. |
| Hunter.io API key authentication needed                                                           | Hunter.io credentials must be configured in n8n credentials section.                           |

---

**Disclaimer:**  
The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All handled data are legal and publicly accessible.