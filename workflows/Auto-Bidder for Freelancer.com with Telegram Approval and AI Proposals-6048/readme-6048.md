Auto-Bidder for Freelancer.com with Telegram Approval and AI Proposals

https://n8nworkflows.xyz/workflows/auto-bidder-for-freelancer-com-with-telegram-approval-and-ai-proposals-6048


# Auto-Bidder for Freelancer.com with Telegram Approval and AI Proposals

### 1. Workflow Overview

This workflow automates bidding on Freelancer.com projects by integrating Freelancer.com API, AI-generated proposals, and Telegram for manual approval. It is designed for freelancers seeking to streamline and enhance their bidding process using AI while maintaining control via Telegram notifications.

The workflow logically divides into the following blocks:

- **1.1 Input Reception and Initialization**  
  Receives skill-based search queries and user-specific inputs to initiate the bidding process.

- **1.2 Project Search and Filtering**  
  Queries Freelancer.com for active projects matching the skills, extracts and formats project data.

- **1.3 Duplicate Bid Prevention**  
  Checks if the user has already placed a bid on each project to avoid redundancy.

- **1.4 Telegram Approval Interaction**  
  Sends project summaries to Telegram with options to approve or cancel bidding.

- **1.5 AI Proposal Generation**  
  Uses an AI agent (Langchain + OpenAI GPT-4) to generate a professional bid proposal tailored to each project.

- **1.6 Bid Submission and Confirmation**  
  Submits the bid via Freelancer.com API upon Telegram approval and notifies the user of success.

- **1.7 Workflow Triggering**  
  Supports manual trigger, scheduled executions, and external workflow invocation.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception and Initialization

- **Overview:**  
  This block initializes the workflow with user input, including skill keywords to search projects, user ID, and Telegram chat ID. It supports external workflow invocation and manual or scheduled triggers.

- **Nodes Involved:**  
  - When Executed by Another Workflow  
  - SetInputs  
  - When clicking ‘Execute workflow’  
  - Schedule Trigger  
  - Edit Fields1  
  - Split Out1  
  - Execute Workflow  

- **Node Details:**

  - **When Executed by Another Workflow**  
    - Type: `ExecuteWorkflowTrigger`  
    - Role: Entry point for external workflows passing a `query` parameter (skills).  
    - Config: Expects an input named "query" (string).  
    - Connections: Outputs to `SetInputs`.  
    - Edge Cases: Missing or malformed inputs could cause empty searches.

  - **SetInputs**  
    - Type: `Set`  
    - Role: Sets initial variables — search query, user Freelancer.com ID, and Telegram Chat ID.  
    - Config:  
      - `search`: from external input `query` or manual trigger.  
      - `My_ID`: user’s Freelancer.com ID (default `1234`).  
      - `ChatID`: Telegram Chat ID (default `1073915195`).  
    - Connections: Outputs to `Search`.  
    - Edge Cases: Invalid user IDs or chat IDs would cause API or Telegram failures.

  - **When clicking ‘Execute workflow’**  
    - Type: `ManualTrigger`  
    - Role: Allows manual start of workflow.  
    - Connections: To `Edit Fields1`.  
    - Edge Cases: None specific.

  - **Schedule Trigger**  
    - Type: `ScheduleTrigger`  
    - Role: Automatically triggers workflow hourly.  
    - Connections: To `Edit Fields1`.  
    - Edge Cases: Scheduling misconfiguration could cause missed runs.

  - **Edit Fields1**  
    - Type: `Set`  
    - Role: Defines skills array (e.g., `["n8n", "python"]`) for project search.  
    - Connections: To `Split Out1`.  
    - Edge Cases: Empty skills array results in empty searches.

  - **Split Out1**  
    - Type: `SplitOut`  
    - Role: Splits skills array into individual items for processing.  
    - Connections: To `Execute Workflow`.  
    - Edge Cases: Empty input array would halt downstream processing.

  - **Execute Workflow**  
    - Type: `ExecuteWorkflow`  
    - Role: Invokes sub-workflow `freelancerAgent` for each skill.  
    - Config: Uses "each" mode with input mapping for `query`.  
    - Connections: No outputs (end of block).  
    - Edge Cases: If sub-workflow fails, no retry logic here.

---

#### 1.2 Project Search and Filtering

- **Overview:**  
  Searches Freelancer.com API for active projects matching the skill query, extracts key project data fields for further processing.

- **Nodes Involved:**  
  - Search  
  - GetProjects  
  - If  
  - ExtractDate  
  - Loop Over Items  

- **Node Details:**

  - **Search**  
    - Type: `HttpRequest`  
    - Role: Calls Freelancer.com API endpoint `/projects/active` to fetch projects with full descriptions and limits results to 10.  
    - Config: Query parameters include `query` from input skill, `full_description=1`, `limit=10`, `user_status=0`. Uses HTTP header auth with Freelancer API credentials.  
    - Connections: To `GetProjects`.  
    - Edge Cases: API rate limits, invalid credentials, malformed queries.

  - **GetProjects**  
    - Type: `SplitOut`  
    - Role: Splits `result.projects` array from API response into individual project items.  
    - Connections: To `If`.  
    - Edge Cases: Empty project list leads to no further processing.

  - **If**  
    - Type: `If`  
    - Role: Filters projects to only those with status `"active"`.  
    - Condition: `$json['result.projects'].status == "active"`  
    - Connections: True to `ExtractDate`, False ignored.  
    - Edge Cases: If status field missing, condition may fail.

  - **ExtractDate**  
    - Type: `Set`  
    - Role: Extracts and assigns relevant project data such as title, description, budget range, bid statistics, currency, project ID, and project URL for downstream nodes.  
    - Connections: To `Loop Over Items`.  
    - Edge Cases: Missing project fields lead to undefined variables.

  - **Loop Over Items**  
    - Type: `SplitInBatches`  
    - Role: Processes projects one at a time to manage API call load and sequential logic.  
    - Connections: On empty batch to nothing; on batch to `checkBidding`.  
    - Edge Cases: Large project sets may cause delays; batch size not specified (default 1).

---

#### 1.3 Duplicate Bid Prevention

- **Overview:**  
  Checks if the user has already bid on the project to avoid duplicate bids, branching accordingly.

- **Nodes Involved:**  
  - checkBidding  
  - Split Out  
  - Edit Fields  
  - Aggregate  
  - If2  
  - AlreadyBid  
  - GetApproval  

- **Node Details:**

  - **checkBidding**  
    - Type: `HttpRequest`  
    - Role: Calls Freelancer.com API to fetch bids on the current project (`/projects/{Project Id}/bids`).  
    - Config: Uses HTTP header auth.  
    - Connections: To `Split Out`.  
    - Edge Cases: API errors, missing project ID.

  - **Split Out**  
    - Type: `SplitOut`  
    - Role: Splits `result.bids` array into individual bids.  
    - Connections: To `Edit Fields`.  
    - Edge Cases: No bids means empty output, handled downstream.

  - **Edit Fields**  
    - Type: `Set`  
    - Role: Extracts `bidder_id` from each bid for aggregation.  
    - Connections: To `Aggregate`.  
    - Edge Cases: Missing bidder_id fields.

  - **Aggregate**  
    - Type: `Aggregate`  
    - Role: Aggregates bidder IDs into an array for membership check.  
    - Connections: To `If2`.  
    - Edge Cases: Empty aggregation if no bids.

  - **If2**  
    - Type: `If`  
    - Role: Checks if current user ID (`My_ID`) is in the aggregated bidder ID array.  
    - Condition: User ID contained in bids bidder_id list.  
    - Connections: True to `AlreadyBid`, False to `GetApproval`.  
    - Edge Cases: Type mismatches in ID comparison.

  - **AlreadyBid**  
    - Type: `Set`  
    - Role: Sets a message stating the user has already bid on this project.  
    - Connections: None further (implicit end).  
    - Edge Cases: None.

  - **GetApproval**  
    - Type: `Telegram` (Send and Wait)  
    - Role: Sends project summary message to Telegram chat, requesting approval with inline buttons (Bid or Cancel).  
    - Config: Message includes project title, link, description, bid range, currency, and bid count.  
    - Connections: To `If1`.  
    - Edge Cases: Telegram API failures, user timeout, or no response.

---

#### 1.4 Telegram Approval Interaction

- **Overview:**  
  Handles user response from Telegram approval prompt to either proceed with bidding or cancel.

- **Nodes Involved:**  
  - If1  
  - AI Agent  
  - Canceled  

- **Node Details:**

  - **If1**  
    - Type: `If`  
    - Role: Checks if Telegram approval response’s `data.approved` is true.  
    - Connections: True to `AI Agent`, False to `Canceled`.  
    - Edge Cases: No response or malformed data.

  - **AI Agent**  
    - Type: `Langchain Agent` (AI Text Generation)  
    - Role: Generates a professional, concise, and tailored proposal for the project using project title and description.  
    - Config: System message instructs formal, confident bid writing in markdown with a fixed sign-off ("Best Regards Mohamed").  
    - Connections: To `create a bid`.  
    - Edge Cases: AI API failures, prompt formatting issues.

  - **Canceled**  
    - Type: `Telegram`  
    - Role: Sends cancellation confirmation message to Telegram chat.  
    - Connections: Back to `Loop Over Items` to continue processing next project.  
    - Edge Cases: Telegram failures.

---

#### 1.5 AI Proposal Generation

- **Overview:**  
  Generates the bid proposal text using OpenAI GPT-4 model via Langchain integration.

- **Nodes Involved:**  
  - OpenAI Chat Model  
  - AI Agent (already covered above)

- **Node Details:**

  - **OpenAI Chat Model**  
    - Type: `Langchain LMChatOpenAi`  
    - Role: Provides language model backend for `AI Agent`.  
    - Config: Uses model `gpt-4.1-nano-2025-04-14` with OpenAI credentials.  
    - Connections: Outputs to `AI Agent`.  
    - Edge Cases: API rate limits, authentication errors.

---

#### 1.6 Bid Submission and Confirmation

- **Overview:**  
  Submits the generated bid to Freelancer.com API and notifies the user on Telegram upon success.

- **Nodes Involved:**  
  - create a bid  
  - Send Succuss  
  - Loop Over Items  

- **Node Details:**

  - **create a bid**  
    - Type: `HttpRequest`  
    - Role: Sends POST request to Freelancer.com `/bids` endpoint to place the bid with project ID, bidder ID, amount, period, description (AI output), profile ID, and milestone percentage.  
    - Config: Uses HTTP header auth with Freelancer API credentials.  
    - Connections: To `Send Succuss`.  
    - Edge Cases: API errors, invalid bid parameters.

  - **Send Succuss**  
    - Type: `Telegram`  
    - Role: Sends a success message to Telegram chat including bid status, proposal text, and job link.  
    - Connections: Back to `Loop Over Items` to process next project.  
    - Edge Cases: Telegram API failures.

  - **Loop Over Items**  
    - Continues processing next projects.

---

#### 1.7 Workflow Triggering

- **Overview:**  
  Supports invocation via manual trigger, schedule, or external workflows, enabling flexible execution.

- **Nodes Involved:**  
  - When Executed by Another Workflow  
  - When clicking ‘Execute workflow’  
  - Schedule Trigger  
  - Edit Fields1  
  - Split Out1  
  - Execute Workflow  

- **Node Details:**  
  Covered in block 1.1.

---

### 3. Summary Table

| Node Name                   | Node Type                       | Functional Role                                   | Input Node(s)                | Output Node(s)             | Sticky Note                                                                                                                                                                                                                         |
|-----------------------------|--------------------------------|-------------------------------------------------|------------------------------|----------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| When Executed by Another Workflow | ExecuteWorkflowTrigger          | Entry point for external workflow invocation      | None                         | SetInputs                   |                                                                                                                                                                                                                                    |
| SetInputs                   | Set                            | Sets query, user Freelancer ID, Telegram ChatID | When Executed by Another Workflow | Search                     |                                                                                                                                                                                                                                    |
| Search                     | HttpRequest                    | Queries Freelancer.com for active projects        | SetInputs                    | GetProjects                 |                                                                                                                                                                                                                                    |
| GetProjects                | SplitOut                      | Splits projects array into individual projects    | Search                       | If                         |                                                                                                                                                                                                                                    |
| If                         | If                             | Filters projects with status active               | GetProjects                  | ExtractDate                 |                                                                                                                                                                                                                                    |
| ExtractDate                | Set                            | Extracts relevant project data fields             | If                          | Loop Over Items             |                                                                                                                                                                                                                                    |
| Loop Over Items             | SplitInBatches                | Processes projects one by one                      | ExtractDate                  | checkBidding / None         |                                                                                                                                                                                                                                    |
| checkBidding               | HttpRequest                    | Checks existing bids on project                    | Loop Over Items              | Split Out                   |                                                                                                                                                                                                                                    |
| Split Out                  | SplitOut                      | Splits bids array into individual bids            | checkBidding                 | Edit Fields                 |                                                                                                                                                                                                                                    |
| Edit Fields                | Set                            | Extracts bidder_id from bids                        | Split Out                   | Aggregate                   |                                                                                                                                                                                                                                    |
| Aggregate                  | Aggregate                     | Aggregates bidder_ids into array                   | Edit Fields                  | If2                        |                                                                                                                                                                                                                                    |
| If2                        | If                             | Checks if user already bid                          | Aggregate                    | AlreadyBid / GetApproval    |                                                                                                                                                                                                                                    |
| AlreadyBid                 | Set                            | Sets message indicating duplicate bid             | If2 (True branch)            | None                       |                                                                                                                                                                                                                                    |
| GetApproval                | Telegram                      | Sends project summary and requests Telegram approval | If2 (False branch)           | If1                        |                                                                                                                                                                                                                                    |
| If1                        | If                             | Checks Telegram approval response                  | GetApproval                  | AI Agent / Canceled         |                                                                                                                                                                                                                                    |
| AI Agent                   | Langchain Agent               | Generates AI proposal text                          | If1 (True branch)            | create a bid                |                                                                                                                                                                                                                                    |
| OpenAI Chat Model           | Langchain LMChatOpenAi        | Language model backend for AI Agent                | None (used by AI Agent)      | AI Agent                   |                                                                                                                                                                                                                                    |
| create a bid               | HttpRequest                    | Submits bid via Freelancer.com API                 | AI Agent                    | Send Succuss                |                                                                                                                                                                                                                                    |
| Send Succuss               | Telegram                      | Sends bid success notification to Telegram        | create a bid                | Loop Over Items             |                                                                                                                                                                                                                                    |
| Canceled                   | Telegram                      | Sends cancellation message to Telegram             | If1 (False branch)           | Loop Over Items             |                                                                                                                                                                                                                                    |
| When clicking ‘Execute workflow’ | ManualTrigger                | Manual workflow start                               | None                         | Edit Fields1                |                                                                                                                                                                                                                                    |
| Schedule Trigger            | ScheduleTrigger               | Scheduled workflow start (hourly)                  | None                         | Edit Fields1                |                                                                                                                                                                                                                                    |
| Edit Fields1               | Set                            | Sets static skills array                            | When clicking ‘Execute workflow’, Schedule Trigger | Split Out1                 |                                                                                                                                                                                                                                    |
| Split Out1                 | SplitOut                      | Splits skills array into individual skill items    | Edit Fields1                 | Execute Workflow            |                                                                                                                                                                                                                                    |
| Execute Workflow            | ExecuteWorkflow               | Invokes sub-workflow `freelancerAgent` per skill  | Split Out1                  | None                       |                                                                                                                                                                                                                                    |
| Sticky Note                | StickyNote                   | Documentation and overview                          | None                         | None                       | # 🔁 Auto-Bidder for Freelancer.com with Telegram Approval and AI Proposals\n\nThis **n8n template** automates your freelance bidding workflow on [Freelancer.com](https://freelancer.com), combining API calls, Telegram interactions, and AI-generated proposals. Ideal for freelancers who want to bid smarter, faster, and hands-free.\n\n## ✨ Features\n\n- 🔍 **Skill-Based Project Search**  \n  Searches for active projects on Freelancer.com using your chosen skill keywords (e.g., `n8n`, `Python`, `Django`).\n\n- 🚫 **Duplicate Bid Prevention**  \n  Automatically checks if you’ve already bid on a project and skips it.\n\n- 🤖 **AI Proposal Generation**  \n  Generates short, persuasive, and customized proposals using an AI agent.\n\n- 📬 **Telegram Notifications**  \n  Sends project summaries to Telegram with inline buttons to **Bid** or **Cancel**.\n\n- ✅ **Auto-Bid Submission**  \n  When you approve a project via Telegram, the bid is submitted with predefined values (amount, period, milestone).\n\n- ⏱️ **Manual or Scheduled Execution**  \n  Supports both on-demand and scheduled workflows (hourly, daily, etc.).\n\n## 📌 Requirements\n\n- Freelancer.com API token (OAuth)\n- Telegram Bot API token\n- OpenAI API key (for proposal generation)\n\n## 📎 Use Cases\n\n- Freelancers automating repetitive bidding tasks\n- Agencies managing client profiles\n- Developers experimenting with AI + API + chat integration\n\n## 🔗 Included Workflows\n\n- `freelancerMain` – Kicks off execution with skill input\n- `freelancerAgent` – Performs project search, bidding logic, Telegram prompts, and AI proposal generation\n\n---\n\n> 💡 Tip: You can easily customize the skill query list, bid amount logic, or prompt format in the workflow settings. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Credential Configurations:**

   - Setup `HTTP Header Auth` credential with Freelancer.com API token (named e.g. `MyFreelancerAPi`).  
   - Setup Telegram Bot credential with token (named e.g. `@n8nAswanbot`).  
   - Setup OpenAI API credential with your OpenAI key.

2. **Create Entry Trigger Nodes:**

   - Add an `ExecuteWorkflowTrigger` node named `When Executed by Another Workflow` with an input parameter named `query` (string).  
   - Add a `ManualTrigger` node named `When clicking ‘Execute workflow’`.  
   - Add a `ScheduleTrigger` node named `Schedule Trigger` set to run hourly.

3. **Setup Input Variables:**

   - Add a `Set` node named `SetInputs` after `When Executed by Another Workflow`. Configure to set:  
     - `search` = `{{$json.query}}` (incoming query)  
     - `My_ID` = your Freelancer.com user ID (e.g. `1234`)  
     - `ChatID` = your Telegram chat ID (e.g. `1073915195`).

   - Add a `Set` node named `Edit Fields1` after both `When clicking ‘Execute workflow’` and `Schedule Trigger`. Configure to set:  
     - `skills` = `["n8n", "python"]` (array of skill keywords).

4. **Split Skills and Invoke Sub-Workflow:**

   - Add `SplitOut` node named `Split Out1` after `Edit Fields1` to split the `skills` array.  
   - Add `ExecuteWorkflow` node named `Execute Workflow` connected to `Split Out1`. Configure:  
     - Mode: `each`  
     - Workflow ID: ID of sub-workflow that performs bidding logic (e.g., `freelancerAgent`).  
     - Map input parameter `query` to the current skill item.

5. **In Sub-Workflow (freelancerAgent):**

   - Add `HttpRequest` node named `Search` that calls Freelancer.com API endpoint `/projects/active` with query parameters:  
     - `full_description=1`  
     - `limit=10`  
     - `query={{$json.search}}` (incoming skill query)  
     - `user_status=0`  
     Use Freelancer API HTTP header auth credential.

   - Add `SplitOut` node `GetProjects` to split `result.projects` array.

   - Add `If` node `If` to filter projects where `status == "active"`.

   - Add `Set` node `ExtractDate` to extract key fields like title, description, budget, bids, currency, project ID, and SEO URL.

   - Add `SplitInBatches` node `Loop Over Items` to process projects one by one.

   - Add `HttpRequest` node `checkBidding` to get bids on current project using `/projects/{Project Id}/bids`.

   - Add `SplitOut` node `Split Out` to separate bids.

   - Add `Set` node `Edit Fields` to extract `bidder_id`.

   - Add `Aggregate` node `Aggregate` to collect all `bidder_id`s.

   - Add `If` node `If2` to check if user ID (`My_ID`) is in `bidder_id` array.

   - Add `Set` node `AlreadyBid` to set message if already bid.

   - Add `Telegram` node `GetApproval` with "sendAndWait" operation to send project summary and wait for approval via inline buttons. Message includes project details and bid info.

   - Add `If` node `If1` to check Telegram response for approval.

   - Add `Langchain LMChatOpenAi` node `OpenAI Chat Model` configured with GPT-4 model and OpenAI credentials.

   - Add `Langchain Agent` node `AI Agent` configured with prompt system message to generate a concise, professional proposal using project title and description. Use the `OpenAI Chat Model` as backend.

   - Add `HttpRequest` node `create a bid` to submit the bid with fields: project_id, bidder_id, amount (average bid), period (3), description (AI output), profile_id (1), milestone_percentage (50).

   - Add `Telegram` node `Send Succuss` to notify user of successful bid submission with bid status, proposal, and job link.

   - Add `Telegram` node `Canceled` to notify user if bidding canceled.

   - Connect nodes following the logic described in section 2.

6. **Connect All Nodes as per the logical flow:**

   - External triggers → input setup → skill splitting → sub-workflow per skill.  
   - Sub-workflow: search → project extraction → loop projects → check bids → approval → AI proposal → bid submission → success notification.

7. **Set Default Values and Constraints:**

   - Bid amount uses `Bid_avg` from project data.  
   - Bid period fixed to 3 days.  
   - Milestone percentage set to 50.  
   - Profile ID fixed to 1 (adjust if multiple profiles).  
   - Telegram chat and user IDs configured per user.

8. **Save and Test Workflow:**

   - Test with manual trigger and valid Freelancer.com and Telegram credentials.  
   - Validate that Telegram prompts appear and that bids get submitted upon approval.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                              | Context or Link                                                     |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------|
| This workflow template automates bidding on Freelancer.com combining API, AI-generated proposals, and Telegram approval. It supports manual and scheduled execution with easy customization of skill queries and bid parameters.          | Sticky Note content in workflow; see https://freelancer.com       |
| Requires Freelancer.com API OAuth token, Telegram Bot token, and OpenAI API key.                                                                                                                                                          | Credentials setup                                                  |
| AI proposal generation uses GPT-4 with Langchain integration, prompting for concise professional bid texts in markdown.                                                                                                                | AI Agent and OpenAI Chat Model nodes                              |
| Telegram integration uses sendAndWait to allow approval via inline buttons, enabling hands-on control over automated bidding.                                                                                                            | Telegram nodes                                                    |
| Sub-workflow `freelancerAgent` is invoked for each skill keyword to parallelize project searching and bidding on different skillsets.                                                                                                  | Execute Workflow node                                              |
| Customize bid amount logic by modifying the `create a bid` node parameters or AI prompt for proposals.                                                                                                                                   | Node configuration                                                |
| For troubleshooting: watch for API rate limits, authentication errors, and Telegram response timeouts.                                                                                                                                  | General integration considerations                                |

---

**Disclaimer:** The provided text is exclusively derived from an automated workflow created with n8n, a workflow automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected material. All manipulated data are legal and public.