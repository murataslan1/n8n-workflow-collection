Automate Support Ticket Triage and Resolution with JIRA and AI

https://n8nworkflows.xyz/workflows/automate-support-ticket-triage-and-resolution-with-jira-and-ai-3868


# Automate Support Ticket Triage and Resolution with JIRA and AI

### 1. Workflow Overview

This workflow automates the triaging and initial resolution of newly opened support tickets in JIRA using AI. It is designed for organizations handling a high volume of support requests, aiming to reduce manual workload by leveraging AI to classify, prioritize, and suggest resolutions for tickets.

The workflow is logically divided into four main blocks:

- **1.1 Ticket Retrieval and Deduplication:** Scheduled polling of JIRA for new open support tickets, filtering out those already processed.
- **1.2 AI-Powered Ticket Triaging:** Using AI to label, prioritize, and rewrite ticket summaries and descriptions for clarity.
- **1.3 Similar Issue Retrieval and Resolution Summarization:** Finding recently resolved similar issues by labels, extracting and summarizing their comments to understand resolutions.
- **1.4 AI-Based Resolution Suggestion and Commenting:** Feeding summarized resolved issues into AI to generate a suggested resolution comment added back to the original ticket.

---

### 2. Block-by-Block Analysis

#### 1.1 Ticket Retrieval and Deduplication

**Overview:**  
This block periodically fetches new open tickets from JIRA’s support project and removes duplicates to ensure each ticket is processed only once.

**Nodes Involved:**  
- Schedule Trigger  
- Get Open Tickets  
- Mark as Seen  
- Simplify Ticket  

**Node Details:**

- **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Role: Initiates workflow execution every few minutes (configured in minutes interval).  
  - Configuration: Interval set to trigger every X minutes (default unspecified).  
  - Inputs: None  
  - Outputs: Triggers "Get Open Tickets" node.  
  - Potential Failures: Misconfiguration of interval, workflow not activated.

- **Get Open Tickets**  
  - Type: JIRA node (getAll operation)  
  - Role: Retrieves up to 10 open tickets from the JIRA project "SUPPORT" with status "To Do".  
  - Configuration: JQL query `"Project = 'SUPPORT' AND status = 'To Do'"`, fetching all navigable fields.  
  - Inputs: Trigger from Schedule Trigger  
  - Outputs: List of open tickets to "Mark as Seen".  
  - Credential: JIRA Software Cloud API  
  - Potential Failures: JIRA API authentication errors, JQL syntax errors, rate limits.

- **Mark as Seen**  
  - Type: Remove Duplicates  
  - Role: Filters out tickets that have been processed in previous workflow runs based on ticket key.  
  - Configuration: Deduplication by `key` field.  
  - Inputs: Tickets from "Get Open Tickets"  
  - Outputs: Unique tickets forwarded to "Simplify Ticket".  
  - Potential Failures: Expression errors if `key` field missing.

- **Simplify Ticket**  
  - Type: Set  
  - Role: Extracts and structures key ticket fields into simplified JSON for downstream AI processing.  
  - Configuration: Maps fields such as project key, issue key, issue type, creation date, status, summary, description, reporter name and email.  
  - Inputs: Unique tickets from "Mark as Seen"  
  - Outputs: Simplified ticket JSON to "Label, Prioritize & Rewrite".  
  - Potential Failures: Missing fields in JIRA response causing expression failures.

---

#### 1.2 AI-Powered Ticket Triaging

**Overview:**  
This block uses an AI language model to analyze the simplified ticket, assign labels, determine priority, and rewrite the summary and description for clarity.

**Nodes Involved:**  
- Label, Prioritize & Rewrite (Chain LLM)  
- Structured Output Parser  
- OpenAI Chat Model  
- Update Labels, Priority and Description  

**Node Details:**

- **Label, Prioritize & Rewrite**  
  - Type: Chain LLM (LangChain)  
  - Role: Sends ticket data to AI with instructions to classify labels, assign priority (1-5), and rewrite summary and description removing emotional content.  
  - Configuration: Prompt includes system instructions with label categories and priority scale, plus rewriting guidelines.  
  - Inputs: Simplified ticket JSON from "Simplify Ticket"  
  - Outputs: AI response with structured fields (labels, priority, summary, description) parsed by "Structured Output Parser".  
  - Potential Failures: AI API errors, prompt misformatting, unexpected AI output format.

- **Structured Output Parser**  
  - Type: Output Parser (LangChain)  
  - Role: Parses AI response into structured JSON with labels (array), priority (number), summary and description (strings).  
  - Configuration: JSON schema defining expected output structure.  
  - Inputs: AI raw output from "Label, Prioritize & Rewrite"  
  - Outputs: Parsed structured data to "Update Labels, Priority and Description".  
  - Potential Failures: Parsing errors if AI output deviates from schema.

- **OpenAI Chat Model**  
  - Type: Language Model (OpenAI GPT-4o-mini)  
  - Role: Underlying AI model used by "Label, Prioritize & Rewrite".  
  - Inputs: Prompt from "Label, Prioritize & Rewrite"  
  - Outputs: AI text response to be parsed.  
  - Credentials: OpenAI API key  
  - Potential Failures: API rate limits, authentication errors, network timeouts.

- **Update Labels, Priority and Description**  
  - Type: JIRA node (update operation)  
  - Role: Updates the original JIRA ticket with AI-assigned labels, priority, and rewritten description (appended with original description).  
  - Configuration: Uses issue key from simplified ticket; sets labels, priority (converted to ID string), and description with appended original text.  
  - Inputs: Parsed AI output from "Structured Output Parser"  
  - Outputs: Triggers "Get Recent Similar Issues Resolved"  
  - Credential: JIRA Software Cloud API  
  - Potential Failures: JIRA update permission errors, invalid priority ID, network issues.

---

#### 1.3 Similar Issue Retrieval and Resolution Summarization

**Overview:**  
This block finds recently resolved issues sharing any of the AI-generated labels and summarizes their comments to extract resolution details.

**Nodes Involved:**  
- Get Recent Similar Issues Resolved  
- Loop Over Items (Split In Batches)  
- Simplify Issue  
- Get Comments  
- Simplify Comments  
- Aggregate  
- Summarise Resolution  
- OpenAI Chat Model1  
- Return Fields  
- Aggregate1  

**Node Details:**

- **Get Recent Similar Issues Resolved**  
  - Type: JIRA node (getAll operation)  
  - Role: Queries up to 5 issues excluding the current ticket, with status in Resolved/Closed/Done, resolved within last month, and labels matching any from AI triage.  
  - Configuration: JQL dynamically constructed using labels from AI output, filtering by resolution date and excluding current issue key.  
  - Inputs: Triggered after ticket update  
  - Outputs: List of similar resolved issues to "Loop Over Items"  
  - Credential: JIRA Software Cloud API  
  - Potential Failures: JQL syntax errors, no matching issues found.

- **Loop Over Items**  
  - Type: Split In Batches  
  - Role: Processes each similar issue individually for comment analysis.  
  - Configuration: Default batch size (likely 1)  
  - Inputs: Similar issues list  
  - Outputs: Each issue to "Simplify Issue" and also to "Aggregate1" for later aggregation.  
  - Potential Failures: None significant.

- **Simplify Issue**  
  - Type: Set  
  - Role: Extracts key fields from each similar issue for summarization.  
  - Configuration: Maps project key, issue key, issue type, creation date, status, summary, description, reporter name and email.  
  - Inputs: Single issue from "Loop Over Items"  
  - Outputs: Simplified issue to "Get Comments"  
  - Potential Failures: Missing fields in issue data.

- **Get Comments**  
  - Type: JIRA node (issueComment getAll)  
  - Role: Retrieves all comments for the given issue, ordered by creation date descending.  
  - Inputs: Simplified issue with issue key  
  - Outputs: Comments list to "Simplify Comments"  
  - Credential: JIRA Software Cloud API  
  - Potential Failures: Permission errors, no comments found.

- **Simplify Comments**  
  - Type: Set  
  - Role: Extracts author display name and concatenates comment text from comment body content.  
  - Configuration: Maps author and comment text by joining nested content arrays.  
  - Inputs: Comments from "Get Comments"  
  - Outputs: Simplified comments to "Aggregate"  
  - Potential Failures: Unexpected comment body structure causing expression errors.

- **Aggregate**  
  - Type: Aggregate  
  - Role: Aggregates all simplified comments for the current issue into a single array under "comments".  
  - Inputs: Multiple simplified comments  
  - Outputs: Aggregated comments to "Summarise Resolution"  
  - Potential Failures: Large comment sets causing memory issues.

- **Summarise Resolution**  
  - Type: Chain LLM (LangChain)  
  - Role: Uses AI to analyze the issue and its comments to summarize the resolution.  
  - Configuration: Prompt includes issue key, summary, description, and numbered comments.  
  - Inputs: Aggregated comments and simplified issue data  
  - Outputs: Summary text to "Return Fields"  
  - Potential Failures: AI API errors, prompt misformatting.

- **OpenAI Chat Model1**  
  - Type: Language Model (OpenAI GPT-4o-mini)  
  - Role: Underlying AI model for "Summarise Resolution".  
  - Inputs: Prompt from "Summarise Resolution"  
  - Outputs: AI text summary  
  - Credential: OpenAI API key  
  - Potential Failures: API limits, auth errors.

- **Return Fields**  
  - Type: Set  
  - Role: Prepares output fields including issue key, summary, description, and AI-generated resolution summary for aggregation.  
  - Inputs: AI summary from "Summarise Resolution" and simplified issue data  
  - Outputs: Single object to "Loop Over Items" (second output) for aggregation  
  - Potential Failures: Expression errors if fields missing.

- **Aggregate1**  
  - Type: Aggregate  
  - Role: Aggregates all summarized resolved issues into a single array "resolved_issues" for context in resolution suggestion.  
  - Inputs: Multiple summarized resolved issues from "Loop Over Items"  
  - Outputs: Aggregated resolved issues to "Attempt to Resolve Issue"  
  - Potential Failures: Large data causing performance issues.

---

#### 1.4 AI-Based Resolution Suggestion and Commenting

**Overview:**  
This final block uses AI to suggest a resolution for the current ticket based on the context of previously resolved similar issues, then posts the suggestion as a comment on the ticket.

**Nodes Involved:**  
- Attempt to Resolve Issue  
- OpenAI Chat Model2  
- Add Comment to Issue  

**Node Details:**

- **Attempt to Resolve Issue**  
  - Type: Chain LLM (LangChain)  
  - Role: Sends current issue details plus aggregated resolved issues to AI, requesting a simplified resolution suggestion addressed to the reporter.  
  - Configuration: Prompt instructs AI to simplify language and avoid technical jargon or sign-offs.  
  - Inputs: Current simplified ticket and aggregated resolved issues from "Aggregate1"  
  - Outputs: AI generated resolution text to "Add Comment to Issue"  
  - Potential Failures: AI API errors, prompt formatting issues.

- **OpenAI Chat Model2**  
  - Type: Language Model (OpenAI GPT-4o-mini)  
  - Role: Underlying AI model for "Attempt to Resolve Issue".  
  - Inputs: Prompt from "Attempt to Resolve Issue"  
  - Outputs: AI text response  
  - Credential: OpenAI API key  
  - Potential Failures: API rate limits, auth errors.

- **Add Comment to Issue**  
  - Type: JIRA node (issueComment create)  
  - Role: Adds the AI-generated resolution suggestion as a comment on the original JIRA ticket.  
  - Configuration: Uses issue key from simplified ticket; comment text from AI output.  
  - Inputs: AI resolution text  
  - Outputs: End of workflow  
  - Credential: JIRA Software Cloud API  
  - Potential Failures: Permission errors, API failures.

---

### 3. Summary Table

| Node Name                      | Node Type                          | Functional Role                                   | Input Node(s)                     | Output Node(s)                      | Sticky Note                                                                                                                             |
|--------------------------------|----------------------------------|-------------------------------------------------|----------------------------------|-----------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------|
| Schedule Trigger               | Schedule Trigger                 | Triggers workflow periodically                   | None                             | Get Open Tickets                  | ## 1. Get Open Tickets [Read more about the Scheduled Trigger node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.scheduletrigger) We can use a scheduled trigger to aggressively check for newly open tickets in our JIRA support queue. The "remove duplicates" node (ie. Mark as Seen) is used so that we don't process any issues more than once. |
| Get Open Tickets              | JIRA (getAll)                   | Retrieves open tickets from JIRA                  | Schedule Trigger                 | Mark as Seen                     |                                                                                                                                         |
| Mark as Seen                  | Remove Duplicates               | Filters out tickets already processed             | Get Open Tickets                | Simplify Ticket                  |                                                                                                                                         |
| Simplify Ticket               | Set                            | Extracts key ticket fields for AI processing      | Mark as Seen                   | Label, Prioritize & Rewrite      | ## 2. Automate Triaging of Ticket [Read more about the Basic LLM node](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.chainllm) New tickets always need to be properly labelled and prioritised but it's not always possible to get to update all incoming tickets if you're light on hands. Using an AI is a great use-case for triaging of tickets as its contextual understanding helps automates this step. |
| Label, Prioritize & Rewrite   | Chain LLM (LangChain)           | AI triages ticket: labels, priority, rewrites    | Simplify Ticket                | Structured Output Parser         |                                                                                                                                         |
| Structured Output Parser      | Output Parser (LangChain)       | Parses AI output into structured JSON             | Label, Prioritize & Rewrite    | Update Labels, Priority and Description |                                                                                                                                         |
| OpenAI Chat Model             | Language Model (OpenAI GPT-4o)  | AI model for triaging                             | Label, Prioritize & Rewrite    | Label, Prioritize & Rewrite      |                                                                                                                                         |
| Update Labels, Priority and Description | JIRA (update)                   | Updates ticket with AI triage results             | Structured Output Parser       | Get Recent Similar Issues Resolved |                                                                                                                                         |
| Get Recent Similar Issues Resolved | JIRA (getAll)                   | Finds recently resolved issues with matching labels | Update Labels, Priority and Description | Loop Over Items                 | ## 3. Attempt to Resolve Ticket Using Previously Resolved Issues [Learn more about the JIRA node](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.jira) There are a number of approaches to also automate issue resolution. Here, we can search for similar tickets in the "Done" or resolved state and using the accepted answers of those tickets, provide context for an AI agent to suggest some ideas back to the user - best case, the fix is found and worst case, the user can add more debugging information through failed attempts. |
| Loop Over Items              | Split In Batches               | Processes each similar resolved issue individually | Get Recent Similar Issues Resolved | Aggregate1, Issue Ref           |                                                                                                                                         |
| Issue Ref                    | NoOp                          | Pass-through node for issue reference             | Loop Over Items               | Simplify Issue                  |                                                                                                                                         |
| Simplify Issue               | Set                           | Extracts key fields from similar resolved issues  | Issue Ref                     | Get Comments                   |                                                                                                                                         |
| Get Comments                 | JIRA (getAll)                 | Retrieves comments for each similar resolved issue | Simplify Issue                | Simplify Comments              |                                                                                                                                         |
| Simplify Comments            | Set                           | Extracts author and comment text                   | Get Comments                  | Aggregate                      |                                                                                                                                         |
| Aggregate                   | Aggregate                     | Aggregates comments for summarization             | Simplify Comments             | Summarise Resolution           |                                                                                                                                         |
| Summarise Resolution        | Chain LLM (LangChain)          | AI summarizes resolution from comments            | Aggregate                    | Return Fields                  |                                                                                                                                         |
| OpenAI Chat Model1          | Language Model (OpenAI GPT-4o) | AI model for summarization                         | Summarise Resolution         | Summarise Resolution           |                                                                                                                                         |
| Return Fields               | Set                           | Prepares summarized resolution data                | Summarise Resolution         | Loop Over Items (second output) |                                                                                                                                         |
| Aggregate1                  | Aggregate                     | Aggregates all summarized resolved issues         | Loop Over Items (second output) | Attempt to Resolve Issue       |                                                                                                                                         |
| Attempt to Resolve Issue    | Chain LLM (LangChain)          | AI suggests resolution for current ticket          | Aggregate1                   | Add Comment to Issue           | ## 4. Suggest a Resolution via Comment [Learn more about the JIRA node](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.jira) Finally, we provide the context of past resolved tickets for the agent to suggest a few resolution ideas back to the user. Be sure to format the answer to match your company tone of voice as without, AI may sound quite technical and robotic! |
| OpenAI Chat Model2          | Language Model (OpenAI GPT-4o) | AI model for resolution suggestion                 | Attempt to Resolve Issue      | Attempt to Resolve Issue       |                                                                                                                                         |
| Add Comment to Issue        | JIRA (create issueComment)     | Adds AI-generated resolution comment to ticket    | Attempt to Resolve Issue      | None                          |                                                                                                                                         |
| Sticky Note                 | Sticky Note                   | Informational note for block 1                      | None                         | None                          | See note content in "Schedule Trigger" row                                                                                             |
| Sticky Note1                | Sticky Note                   | Informational note for block 2                      | None                         | None                          | See note content in "Simplify Ticket" row                                                                                              |
| Sticky Note2                | Sticky Note                   | Informational note for block 3                      | None                         | None                          | See note content in "Get Recent Similar Issues Resolved" row                                                                           |
| Sticky Note3                | Sticky Note                   | Informational note for block 4                      | None                         | None                          | See note content in "Attempt to Resolve Issue" row                                                                                      |
| Sticky Note4                | Sticky Note                   | General workflow overview and usage instructions    | None                         | None                          | See note content in "Schedule Trigger" row                                                                                             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node**  
   - Type: Schedule Trigger  
   - Set interval to trigger every X minutes (e.g., 5 minutes).  
   - No credentials needed.

2. **Add a JIRA node named "Get Open Tickets"**  
   - Operation: getAll  
   - Resource: Issue  
   - Limit: 10  
   - Options:  
     - JQL: `Project = 'SUPPORT' AND status = 'To Do'`  
     - Fields: `*navigable`  
   - Credentials: Connect your JIRA Software Cloud API credentials.  
   - Connect Schedule Trigger output to this node.

3. **Add a Remove Duplicates node named "Mark as Seen"**  
   - Operation: Remove items seen in previous executions  
   - Deduplication value: Expression `{{$json.key}}`  
   - Connect "Get Open Tickets" output to this node.

4. **Add a Set node named "Simplify Ticket"**  
   - Configure to assign the following fields from input JSON:  
     - projectKey: `{{$json.fields.project.key}}`  
     - issueKey: `{{$json.key}}`  
     - issueType: `{{$json.fields.issuetype.name}}`  
     - createdAt: `{{$json.fields.created}}`  
     - status: `{{$json.fields.status.name}}`  
     - summary: `{{$json.fields.summary}}`  
     - description: `{{$json.fields.description}}`  
     - reportedBy: `{{$json.fields.creator.displayName}}`  
     - reportedByEmailAddress: `{{$json.fields.creator.emailAddress}}`  
   - Connect "Mark as Seen" output to this node.

5. **Add a Chain LLM node named "Label, Prioritize & Rewrite"**  
   - Model: GPT-4o-mini (OpenAI)  
   - Text input:  
     ```
     Reported by {{ $json.reportedBy }} <{{ $json.reportedByEmailAddress }}>
     Reported at: {{ $json.createdAt }}
     Issue Key: {{ $json.issueKey }}
     Summary: {{ $json.summary }}
     Description: {{ $json.description }}
     ```  
   - Prompt: Define a system message instructing the AI to:  
     - Classify and label the issue using predefined labels wrapped in square brackets (Technical, Account, Access, Billing, Product, Training, Feedback, Complaints, Security, Privacy)  
     - Prioritize from 1 (highest) to 5 (lowest)  
     - Rewrite summary and description removing emotional content, focusing on facts and attempts made  
   - Enable output parser with JSON schema expecting:  
     - labels (array of strings)  
     - priority (number)  
     - summary (string)  
     - description (string)  
   - Connect "Simplify Ticket" output to this node.

6. **Add an Output Parser node named "Structured Output Parser"**  
   - Schema type: Manual  
   - Input schema: JSON object with properties labels (array of strings), priority (number), summary (string), description (string)  
   - Connect "Label, Prioritize & Rewrite" output to this node.

7. **Add a JIRA node named "Update Labels, Priority and Description"**  
   - Operation: Update issue  
   - Issue Key: `{{$json.output.issueKey}}` (from simplified ticket)  
   - Update fields:  
     - labels: `{{$json.output.labels}}`  
     - priority: Use priority number converted to string for priority ID  
     - description: `{{$json.output.description}}` appended with original description from "Simplify Ticket"  
   - Credentials: JIRA Software Cloud API  
   - Connect "Structured Output Parser" output to this node.

8. **Add a JIRA node named "Get Recent Similar Issues Resolved"**  
   - Operation: getAll  
   - Limit: 5  
   - JQL:  
     ```
     key != {{ $json.issueKey }} AND status in ("Resolved", "Closed", "Done") AND resolutiondate >= startOfMonth(-1) AND labels in ({{ $json.output.labels.map(label => `"${label}"`).join(',') }})
     ```  
   - Credentials: JIRA Software Cloud API  
   - Connect "Update Labels, Priority and Description" output to this node.

9. **Add a Split In Batches node named "Loop Over Items"**  
   - Default batch size (1)  
   - Connect "Get Recent Similar Issues Resolved" output to this node.

10. **Add a NoOp node named "Issue Ref"**  
    - Connect "Loop Over Items" output (second output) to this node.

11. **Add a Set node named "Simplify Issue"**  
    - Same field mappings as "Simplify Ticket" but for each resolved issue.  
    - Connect "Issue Ref" output to this node.

12. **Add a JIRA node named "Get Comments"**  
    - Operation: getAll  
    - Resource: issueComment  
    - Issue Key: `{{$json.issueKey}}` from "Simplify Issue"  
    - Options: orderBy `-created` (descending)  
    - Credentials: JIRA Software Cloud API  
    - Connect "Simplify Issue" output to this node.

13. **Add a Set node named "Simplify Comments"**  
    - Extract author displayName and flatten comment body text by joining nested content arrays.  
    - Connect "Get Comments" output to this node.

14. **Add an Aggregate node named "Aggregate"**  
    - Aggregate all simplified comments into a single array field named "comments".  
    - Connect "Simplify Comments" output to this node.

15. **Add a Chain LLM node named "Summarise Resolution"**  
    - Model: GPT-4o-mini (OpenAI)  
    - Text input includes simplified issue key, summary, description, and numbered comments.  
    - Prompt instructs AI to summarize the resolution of the issue based on comments.  
    - Connect "Aggregate" output to this node.

16. **Add an Output Parser node (optional) or Set node named "Return Fields"**  
    - Prepare output JSON with issueKey, summary, description, and AI-generated resolution summary.  
    - Connect "Summarise Resolution" output to this node.

17. **Connect "Return Fields" output back to the second output of "Loop Over Items"**  
    - This allows aggregation of all summarized resolved issues.

18. **Add an Aggregate node named "Aggregate1"**  
    - Aggregate all summarized resolved issues into a single array field "resolved_issues".  
    - Connect second output of "Loop Over Items" to this node.

19. **Add a Chain LLM node named "Attempt to Resolve Issue"**  
    - Model: GPT-4o-mini (OpenAI)  
    - Text input includes current simplified ticket details and aggregated resolved issues.  
    - Prompt instructs AI to suggest a simplified resolution addressed to the reporter without sign-offs.  
    - Connect "Aggregate1" output to this node.

20. **Add a JIRA node named "Add Comment to Issue"**  
    - Operation: create issueComment  
    - Issue Key: from current simplified ticket  
    - Comment: AI-generated resolution text from "Attempt to Resolve Issue"  
    - Credentials: JIRA Software Cloud API  
    - Connect "Attempt to Resolve Issue" output to this node.

21. **Configure all OpenAI nodes with valid OpenAI API credentials and JIRA nodes with JIRA Software Cloud API credentials.**

22. **Activate the workflow and adjust schedule interval as needed.**

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Context or Link                                                                                      |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| This workflow automates triaging of newly opened support tickets and issue resolution via JIRA using AI. It is ideal for organizations with high ticket volumes to reduce manual triage workload and provide initial resolution suggestions.                                                                                                                                                                                                                                                     | Workflow purpose                                                                                   |
| For more information on the Scheduled Trigger node, see: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.scheduletrigger                                                                                                                                                                                                                                                                                                                                                      | Schedule Trigger documentation                                                                    |
| Learn about the Basic LLM node used for AI triaging: https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.chainllm                                                                                                                                                                                                                                                                                                                                              | LangChain Chain LLM node documentation                                                           |
| JIRA node documentation for issue management and comments: https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.jira                                                                                                                                                                                                                                                                                                                                                                | JIRA node documentation                                                                           |
| Join the n8n community for help: Discord https://discord.com/invite/XPKeKXeB7d and Forum https://community.n8n.io/                                                                                                                                                                                                                                                                                                                                                                                  | Community support                                                                                  |
| Customization ideas: Replace JIRA nodes with other issue management systems like Linear; explore Retrieval-Augmented Generation (RAG) approaches using knowledge bases for resolution suggestions.                                                                                                                                                                                                                                                                                                   | Customization suggestions                                                                         |
| Be sure to format AI-generated resolution comments to match your company’s tone of voice to avoid overly technical or robotic responses.                                                                                                                                                                                                                                                                                                                                                           | Best practice for AI output                                                                        |

---

This document provides a detailed, structured reference to understand, reproduce, and modify the "Automate Support Ticket Triage and Resolution with JIRA and AI" workflow, including all nodes, their roles, configurations, and integration points.