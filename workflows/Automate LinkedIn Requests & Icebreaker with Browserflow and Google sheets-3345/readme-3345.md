Automate LinkedIn Requests & Icebreaker with Browserflow and Google sheets

https://n8nworkflows.xyz/workflows/automate-linkedin-requests---icebreaker-with-browserflow-and-google-sheets-3345


# Automate LinkedIn Requests & Icebreaker with Browserflow and Google sheets

### 1. Workflow Overview

This workflow automates LinkedIn connection requests and personalized icebreaker message sending by integrating Google Sheets, Browserflow, and AI-powered content generation. It is designed for professionals, recruiters, and marketers who want to streamline outreach efforts by extracting LinkedIn profiles from a Google Sheet, verifying connection status, sending connection requests if not connected, and following up with AI-generated personalized icebreaker messages based on LinkedIn posts and company descriptions.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception and Initialization**: Triggering the workflow manually or on schedule, setting user data and fetching LinkedIn profile URLs from Google Sheets.
- **1.2 LinkedIn Profile Lookup and Validation**: Searching LinkedIn profiles by name and company, handling missing data, and retrieving posts from profiles and companies.
- **1.3 AI-Based Icebreaker Message Generation**: Using OpenAI to generate personalized icebreaker messages based on profile and company posts and user data.
- **1.4 Connection Status Checking and Request Sending**: Checking if the user is already connected, sending connection requests if not connected, and updating Google Sheets accordingly.
- **1.5 Icebreaker Message Sending and Status Update**: Sending AI-generated messages via LinkedIn and updating message sent status in Google Sheets.
- **1.6 Data Update and Iteration**: Updating Google Sheets with connection and message statuses and iterating over multiple contacts.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Initialization

- **Overview:** This block triggers the workflow manually or on schedule, sets user-specific data, and fetches LinkedIn profile data from Google Sheets for processing.
- **Nodes Involved:**  
  - When clicking ‘Test workflow’ (Manual Trigger)  
  - Schedule Trigger  
  - Set your data here (Set)  
  - Fetch Data (Google Sheets)  
  - Next item (SplitInBatches)  

- **Node Details:**

  - **When clicking ‘Test workflow’**  
    - Type: Manual Trigger  
    - Role: Allows manual start of the workflow for testing or immediate execution.  
    - Connections: Outputs to "Set your data here".  
    - Edge cases: None significant; manual trigger.

  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Role: Automates periodic execution of the workflow.  
    - Connections: Outputs to "Set your data here".  
    - Edge cases: Scheduling misconfiguration may cause missed runs.

  - **Set your data here**  
    - Type: Set  
    - Role: Defines user-specific parameters such as Google Sheet URL, user/company info, max posts to fetch.  
    - Configuration: User inputs required here for customization.  
    - Connections: Outputs to "Fetch Data".  
    - Edge cases: Missing or incorrect user data will cause downstream failures.

  - **Fetch Data**  
    - Type: Google Sheets  
    - Role: Reads LinkedIn profile data from the specified Google Sheet.  
    - Configuration: Uses user-provided Google Sheet URL and credentials.  
    - Connections: Outputs to "Next item".  
    - Edge cases: Google API errors, incorrect sheet URL, or permission issues.

  - **Next item**  
    - Type: SplitInBatches  
    - Role: Processes LinkedIn profiles one by one or in batches.  
    - Connections: Outputs to "Search for user profile".  
    - Edge cases: Batch size misconfiguration could affect performance.

---

#### 2.2 LinkedIn Profile Lookup and Validation

- **Overview:** Searches for LinkedIn user profiles by name and company, handles missing usernames or company IDs, and retrieves posts from user profiles and companies for AI analysis.
- **Nodes Involved:**  
  - Search for user profile (HTTP Request)  
  - If username is empty (If)  
  - Get profile posts (HTTP Request)  
  - Split Out (SplitOut)  
  - Sort1 (Sort)  
  - Limit (Limit)  
  - Aggregate (Aggregate)  
  - If company ID is empty (If)  
  - Get company posts (HTTP Request)  
  - Split Out1 (SplitOut)  
  - Sort (Sort)  
  - Limit1 (Limit)  
  - Aggregate1 (Aggregate)  
  - If relation? (If)  

- **Node Details:**

  - **Search for user profile**  
    - Type: HTTP Request  
    - Role: Queries LinkedIn API or service to find user profile by name and company.  
    - Configuration: Uses parameters from Google Sheet data.  
    - Connections: Outputs to "If username is empty".  
    - Edge cases: API rate limits, missing or incorrect user data.

  - **If username is empty**  
    - Type: If  
    - Role: Checks if username was found; branches workflow accordingly.  
    - Connections: True branch to "Set response to 0 - 1", False branch to "Get profile posts".  
    - Edge cases: Empty username leads to skipping profile post retrieval.

  - **Get profile posts**  
    - Type: HTTP Request  
    - Role: Retrieves posts from the LinkedIn user profile.  
    - Configuration: Retries enabled on failure.  
    - Connections: Outputs to "Split Out".  
    - Edge cases: API failures, empty posts.

  - **Split Out**  
    - Type: SplitOut  
    - Role: Splits posts into individual items for sorting and limiting.  
    - Connections: Outputs to "Sort1".  
    - Edge cases: Empty input results in no output.

  - **Sort1**  
    - Type: Sort  
    - Role: Sorts posts, likely by date or relevance.  
    - Connections: Outputs to "Limit".  
    - Edge cases: Sorting errors if data malformed.

  - **Limit**  
    - Type: Limit  
    - Role: Limits number of posts processed (user-configured max).  
    - Connections: Outputs to "Aggregate".  
    - Edge cases: Limit too low may reduce AI input quality.

  - **Aggregate**  
    - Type: Aggregate  
    - Role: Aggregates limited posts into a single data structure for AI input.  
    - Connections: Outputs to "If company ID is empty".  
    - Edge cases: Aggregation errors if input empty.

  - **If company ID is empty**  
    - Type: If  
    - Role: Checks if company ID is available; branches accordingly.  
    - Connections: True branch to "Set response to 0 - 2", False branch to "Get company posts".  
    - Edge cases: Missing company ID leads to skipping company post retrieval.

  - **Get company posts**  
    - Type: HTTP Request  
    - Role: Retrieves posts from the LinkedIn company page.  
    - Configuration: Retries enabled on failure.  
    - Connections: Outputs to "Split Out1".  
    - Edge cases: API failures, empty posts.

  - **Split Out1**  
    - Type: SplitOut  
    - Role: Splits company posts into individual items for sorting and limiting.  
    - Connections: Outputs to "Sort".  
    - Edge cases: Empty input results in no output.

  - **Sort**  
    - Type: Sort  
    - Role: Sorts company posts.  
    - Connections: Outputs to "Limit1".  
    - Edge cases: Sorting errors if data malformed.

  - **Limit1**  
    - Type: Limit  
    - Role: Limits number of company posts processed.  
    - Connections: Outputs to "Aggregate1".  
    - Edge cases: Limit too low reduces data for AI.

  - **Aggregate1**  
    - Type: Aggregate  
    - Role: Aggregates limited company posts into a single data structure.  
    - Connections: Outputs to "Generate email" (subworkflow).  
    - Edge cases: Empty aggregation leads to reduced AI input.

  - **If relation?**  
    - Type: If  
    - Role: Checks if the current contact is already a relation/connection.  
    - Connections: True branch to "Set is_connection", False branch to "Is it a connection?" (Browserflow node).  
    - Edge cases: Incorrect relation status may cause logic errors.

---

#### 2.3 AI-Based Icebreaker Message Generation

- **Overview:** Generates personalized icebreaker messages and email subjects using OpenAI based on aggregated LinkedIn posts and user/company data.
- **Nodes Involved:**  
  - Generate email (Execute Workflow - subworkflow)  
  - OpenAI Chat Model (Langchain LLM Chat)  
  - Structured Output Parser (Langchain Output Parser)  
  - Generate Subject and cover letter based on match (Langchain Chain LLM)  
  - When Executed by Another Workflow (Execute Workflow Trigger)  

- **Node Details:**

  - **Generate email**  
    - Type: Execute Workflow  
    - Role: Calls a subworkflow responsible for generating the icebreaker message.  
    - Configuration: Runs on error continue mode to avoid halting main workflow.  
    - Connections: Outputs to "Update data".  
    - Edge cases: Subworkflow failures, AI API errors.

  - **OpenAI Chat Model**  
    - Type: Langchain LLM Chat (OpenAI)  
    - Role: Provides AI language model interface for message generation.  
    - Configuration: Uses OpenAI credentials and prompts.  
    - Connections: Feeds into "Generate Subject and cover letter based on match".  
    - Edge cases: API limits, authentication errors.

  - **Structured Output Parser**  
    - Type: Langchain Output Parser  
    - Role: Parses AI output into structured format for further processing.  
    - Connections: Feeds into "Generate Subject and cover letter based on match".  
    - Edge cases: Parsing errors if AI output format changes.

  - **Generate Subject and cover letter based on match**  
    - Type: Langchain Chain LLM  
    - Role: Combines AI chat and output parser to generate final message content.  
    - Connections: Outputs to "Generate email" or triggered by "When Executed by Another Workflow".  
    - Edge cases: AI generation failures, prompt misconfiguration.

  - **When Executed by Another Workflow**  
    - Type: Execute Workflow Trigger  
    - Role: Allows this AI generation chain to be triggered as a subworkflow independently.  
    - Connections: Outputs to "Generate Subject and cover letter based on match".  
    - Edge cases: Subworkflow invocation errors.

---

#### 2.4 Connection Status Checking and Request Sending

- **Overview:** Checks if the contact is already connected, sends connection requests if not, and updates Google Sheets with invite sent status.
- **Nodes Involved:**  
  - Set is_connection (Set)  
  - If connected (If)  
  - If not invite sent (If)  
  - Send connection request (Browserflow)  
  - Update invite sent (Google Sheets)  

- **Node Details:**

  - **Set is_connection**  
    - Type: Set  
    - Role: Sets a flag indicating if the user is connected to the contact.  
    - Connections: Outputs to "If connected".  
    - Edge cases: Incorrect flag setting leads to wrong branching.

  - **If connected**  
    - Type: If  
    - Role: Branches workflow based on connection status.  
    - Connections: True branch to "If not message sent", False branch to "If not invite sent".  
    - Edge cases: Logic errors if connection status is inaccurate.

  - **If not invite sent**  
    - Type: If  
    - Role: Checks if a connection invite has already been sent.  
    - Connections: True branch to "Send connection request".  
    - Edge cases: Duplicate invites if flag incorrect.

  - **Send connection request**  
    - Type: Browserflow (Community Node)  
    - Role: Automates sending LinkedIn connection requests via Browserflow API.  
    - Configuration: Requires Browserflow API key credential.  
    - Connections: Outputs to "Update invite sent".  
    - Edge cases: Browserflow API errors, rate limits, UI changes on LinkedIn.

  - **Update invite sent**  
    - Type: Google Sheets  
    - Role: Updates the Google Sheet to mark that an invite was sent.  
    - Connections: Outputs to "Next item" to process next contact.  
    - Edge cases: Google API errors, data write conflicts.

---

#### 2.5 Icebreaker Message Sending and Status Update

- **Overview:** Sends AI-generated icebreaker messages via LinkedIn using Browserflow and updates Google Sheets with message sent status.
- **Nodes Involved:**  
  - If not message sent (If)  
  - Send message with LinkedIn (Browserflow)  
  - Update message sent (Google Sheets)  
  - Update is relation (Google Sheets)  

- **Node Details:**

  - **If not message sent**  
    - Type: If  
    - Role: Checks if an icebreaker message has already been sent.  
    - Connections: True branch to "Send message with LinkedIn", False branch to "Update is relation".  
    - Edge cases: Duplicate messages if flag incorrect.

  - **Send message with LinkedIn**  
    - Type: Browserflow (Community Node)  
    - Role: Automates sending LinkedIn messages via Browserflow API.  
    - Configuration: Requires Browserflow API key credential.  
    - Connections: Outputs to "Update message sent".  
    - Edge cases: API errors, LinkedIn UI changes, message delivery failures.

  - **Update message sent**  
    - Type: Google Sheets  
    - Role: Updates the Google Sheet to mark that a message was sent.  
    - Connections: Outputs to "Next item" for next contact processing.  
    - Edge cases: Google API errors.

  - **Update is relation**  
    - Type: Google Sheets  
    - Role: Updates relation status in the sheet if no message was sent.  
    - Connections: No further outputs.  
    - Edge cases: Data inconsistency if update fails.

---

#### 2.6 Data Update and Iteration

- **Overview:** Updates Google Sheets with connection and message statuses and iterates over contacts to process all entries.
- **Nodes Involved:**  
  - Update data (Google Sheets)  
  - Next item (SplitInBatches)  

- **Node Details:**

  - **Update data**  
    - Type: Google Sheets  
    - Role: Updates user data such as connection status or other flags.  
    - Connections: Outputs to "If relation?".  
    - Edge cases: Google API errors, concurrency issues.

  - **Next item**  
    - Type: SplitInBatches  
    - Role: Iterates over the next contact in the batch.  
    - Connections: Outputs to "Search for user profile" or ends if no more items.  
    - Edge cases: Infinite loops if batch size or termination conditions misconfigured.

---

### 3. Summary Table

| Node Name                        | Node Type                        | Functional Role                          | Input Node(s)                      | Output Node(s)                      | Sticky Note                                                                                      |
|---------------------------------|---------------------------------|----------------------------------------|----------------------------------|-----------------------------------|------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’    | Manual Trigger                  | Manual start of workflow                |                                  | Set your data here                 |                                                                                                |
| Schedule Trigger                | Schedule Trigger                | Scheduled start of workflow             |                                  | Set your data here                 |                                                                                                |
| Set your data here              | Set                            | Defines user and sheet parameters       | When clicking ‘Test workflow’, Schedule Trigger | Fetch Data                     |                                                                                                |
| Fetch Data                     | Google Sheets                  | Reads LinkedIn profile data from sheet | Set your data here                | Next item                        |                                                                                                |
| Next item                      | SplitInBatches                 | Processes contacts one by one           | Fetch Data, Update invite sent, Update message sent | Search for user profile         |                                                                                                |
| Search for user profile        | HTTP Request                  | Searches LinkedIn profile by name/company | Next item                       | If username is empty             |                                                                                                |
| If username is empty           | If                            | Checks if username exists                | Search for user profile           | Set response to 0 - 1, Get profile posts |                                                                                                |
| Get profile posts              | HTTP Request                  | Retrieves posts from LinkedIn profile   | If username is empty (false)      | Split Out                       |                                                                                                |
| Split Out                     | SplitOut                      | Splits profile posts for processing     | Get profile posts                | Sort1                          |                                                                                                |
| Sort1                         | Sort                          | Sorts profile posts                      | Split Out                      | Limit                          |                                                                                                |
| Limit                         | Limit                         | Limits number of profile posts processed | Sort1                          | Aggregate                      |                                                                                                |
| Aggregate                     | Aggregate                     | Aggregates profile posts                 | Limit                          | If company ID is empty          |                                                                                                |
| If company ID is empty         | If                            | Checks if company ID exists              | Aggregate                      | Set response to 0 - 2, Get company posts |                                                                                                |
| Get company posts             | HTTP Request                  | Retrieves posts from LinkedIn company   | If company ID is empty (false)   | Split Out1                     |                                                                                                |
| Split Out1                   | SplitOut                      | Splits company posts for processing     | Get company posts               | Sort                          |                                                                                                |
| Sort                         | Sort                          | Sorts company posts                      | Split Out1                    | Limit1                        |                                                                                                |
| Limit1                       | Limit                         | Limits number of company posts processed | Sort                         | Aggregate1                    |                                                                                                |
| Aggregate1                   | Aggregate                     | Aggregates company posts                 | Limit1                        | Generate email                |                                                                                                |
| Generate email               | Execute Workflow              | Calls subworkflow to generate icebreaker | Aggregate1                    | Update data                   | Calling subworkflow (see under)                                                                |
| Update data                 | Google Sheets                | Updates data in Google Sheet             | Generate email                 | If relation?                  |                                                                                                |
| If relation?                | If                          | Checks if contact is already a relation  | Update data                   | Set is_connection, Is it a connection? |                                                                                                |
| Set is_connection           | Set                         | Sets connection flag                      | If relation? (true)            | If connected                 |                                                                                                |
| Is it a connection?         | Browserflow                 | Checks connection status via Browserflow | If relation? (false)           | If connected                 |                                                                                                |
| If connected               | If                          | Branches based on connection status      | Set is_connection, Is it a connection? | If not message sent, If not invite sent |                                                                                                |
| If not invite sent         | If                          | Checks if invite was sent                 | If connected (false)            | Send connection request       |                                                                                                |
| Send connection request    | Browserflow                 | Sends LinkedIn connection request        | If not invite sent             | Update invite sent            | Requires Browserflow API key credential                                                        |
| Update invite sent         | Google Sheets                | Marks invite as sent in Google Sheet     | Send connection request        | Next item                    |                                                                                                |
| If not message sent        | If                          | Checks if message was sent                | If connected (true)             | Send message with LinkedIn, Update is relation |                                                                                                |
| Send message with LinkedIn | Browserflow                 | Sends AI-generated icebreaker message    | If not message sent            | Update message sent          | Requires Browserflow API key credential                                                        |
| Update message sent        | Google Sheets                | Marks message as sent in Google Sheet    | Send message with LinkedIn     | Next item                    |                                                                                                |
| Update is relation         | Google Sheets                | Updates relation status in Google Sheet  | If not message sent (false)    |                               |                                                                                                |
| Set response to 0 - 1      | Set                         | Sets default response when username empty | If username is empty (true)    | If company ID is empty        |                                                                                                |
| Set response to 0 - 2      | Set                         | Sets default response when company ID empty | If company ID is empty (true)  | Generate email               |                                                                                                |
| Generate Subject and cover letter based on match | Langchain Chain LLM         | AI chain generating subject and cover letter | OpenAI Chat Model, Structured Output Parser, When Executed by Another Workflow | Generate email (subworkflow) |                                                                                                |
| OpenAI Chat Model          | Langchain LLM Chat           | OpenAI language model interface           |                               | Generate Subject and cover letter based on match |                                                                                                |
| Structured Output Parser   | Langchain Output Parser      | Parses AI output into structured format   |                               | Generate Subject and cover letter based on match |                                                                                                |
| When Executed by Another Workflow | Execute Workflow Trigger    | Allows subworkflow execution trigger       |                               | Generate Subject and cover letter based on match |                                                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Nodes**  
   - Add a **Manual Trigger** node named "When clicking ‘Test workflow’".  
   - Add a **Schedule Trigger** node named "Schedule Trigger" for periodic execution.

2. **Set User Data**  
   - Add a **Set** node named "Set your data here".  
   - Configure fields for:  
     - Google Sheet URL (string)  
     - Your activity (string)  
     - Your name (string)  
     - Your company (string)  
     - Your email (string)  
     - Maxitems (number)  
   - Connect outputs of both triggers to this node.

3. **Fetch LinkedIn Data from Google Sheets**  
   - Add a **Google Sheets** node named "Fetch Data".  
   - Configure credentials for Google Sheets access.  
   - Set to read rows from the user-provided Google Sheet URL.  
   - Connect "Set your data here" output to this node.

4. **Split Data for Processing**  
   - Add a **SplitInBatches** node named "Next item".  
   - Connect "Fetch Data" output to this node.  
   - Configure batch size as needed (e.g., 1).

5. **Search LinkedIn User Profile**  
   - Add an **HTTP Request** node named "Search for user profile".  
   - Configure to query LinkedIn API or a service by name and company from current batch data.  
   - Connect "Next item" output to this node.

6. **Check Username Presence**  
   - Add an **If** node named "If username is empty".  
   - Condition: Check if username field is empty.  
   - True branch connects to a **Set** node "Set response to 0 - 1".  
   - False branch connects to "Get profile posts".

7. **Get Profile Posts**  
   - Add an **HTTP Request** node named "Get profile posts".  
   - Configure to fetch posts from LinkedIn profile.  
   - Enable retry on failure.  
   - Connect "If username is empty" false branch here.

8. **Process Profile Posts**  
   - Add a **SplitOut** node "Split Out". Connect from "Get profile posts".  
   - Add a **Sort** node "Sort1". Connect from "Split Out".  
   - Add a **Limit** node "Limit". Connect from "Sort1".  
   - Add an **Aggregate** node "Aggregate". Connect from "Limit".

9. **Check Company ID Presence**  
   - Add an **If** node "If company ID is empty".  
   - Condition: Check if company ID is empty.  
   - True branch connects to **Set** node "Set response to 0 - 2".  
   - False branch connects to "Get company posts".

10. **Get Company Posts**  
    - Add an **HTTP Request** node "Get company posts".  
    - Configure to fetch posts from LinkedIn company page.  
    - Enable retry on failure.  
    - Connect "If company ID is empty" false branch here.

11. **Process Company Posts**  
    - Add a **SplitOut** node "Split Out1". Connect from "Get company posts".  
    - Add a **Sort** node "Sort". Connect from "Split Out1".  
    - Add a **Limit** node "Limit1". Connect from "Sort".  
    - Add an **Aggregate** node "Aggregate1". Connect from "Limit1".

12. **Generate Icebreaker Message (Subworkflow)**  
    - Create a subworkflow that includes:  
      - Langchain OpenAI Chat Model node  
      - Structured Output Parser node  
      - Langchain Chain LLM node to generate subject and cover letter  
    - In main workflow, add an **Execute Workflow** node "Generate email" to call this subworkflow.  
    - Connect "Aggregate1" output to "Generate email".

13. **Update Google Sheet Data**  
    - Add a **Google Sheets** node "Update data" to update connection and message status fields.  
    - Connect "Generate email" output to "Update data".

14. **Check Relation Status**  
    - Add an **If** node "If relation?".  
    - Connect "Update data" output to this node.  
    - True branch connects to **Set** node "Set is_connection".  
    - False branch connects to **Browserflow** node "Is it a connection?" to verify connection status.

15. **Set Connection Flag**  
    - Add a **Set** node "Set is_connection".  
    - Connect "If relation?" true branch here.

16. **Check Connection Status**  
    - Add an **If** node "If connected".  
    - Connect outputs of "Set is_connection" and "Is it a connection?" to this node.  
    - True branch connects to "If not message sent".  
    - False branch connects to "If not invite sent".

17. **Check Invite Sent**  
    - Add an **If** node "If not invite sent".  
    - Connect "If connected" false branch here.  
    - True branch connects to **Browserflow** node "Send connection request".

18. **Send Connection Request**  
    - Add a **Browserflow** node "Send connection request".  
    - Configure with Browserflow API credentials and LinkedIn automation steps.  
    - Connect "If not invite sent" true branch here.

19. **Update Invite Sent Status**  
    - Add a **Google Sheets** node "Update invite sent".  
    - Connect "Send connection request" output here.  
    - Connect "Update invite sent" output back to "Next item" to continue batch.

20. **Check Message Sent**  
    - Add an **If** node "If not message sent".  
    - Connect "If connected" true branch here.  
    - True branch connects to **Browserflow** node "Send message with LinkedIn".  
    - False branch connects to "Update is relation".

21. **Send Icebreaker Message**  
    - Add a **Browserflow** node "Send message with LinkedIn".  
    - Configure with Browserflow API credentials and message content from AI generation.  
    - Connect "If not message sent" true branch here.

22. **Update Message Sent Status**  
    - Add a **Google Sheets** node "Update message sent".  
    - Connect "Send message with LinkedIn" output here.  
    - Connect "Update message sent" output back to "Next item".

23. **Update Relation Status**  
    - Add a **Google Sheets** node "Update is relation".  
    - Connect "If not message sent" false branch here.

24. **Loop Control**  
    - Ensure "Next item" node connects to "Search for user profile" for next batch iteration.

25. **Credential Setup**  
    - Configure Google Sheets credentials with appropriate OAuth2 access.  
    - Configure Browserflow credentials with API key.  
    - Configure OpenAI credentials for Langchain nodes.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                     | Context or Link                                                                                                         |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------|
| This workflow requires the community node "n8n-nodes-browserflow" which is only available on self-hosted n8n installations.                                                                                                    | https://docs.n8n.io/integrations/community-nodes/browserflow/                                                          |
| Google Sheet template to use: [Copy this Google Sheet](https://docs.google.com/spreadsheets/d/1-0vwEAPDU4XWYZtlALOv4CIMXh7NPAXaY7Hde-ZAPJ4/edit?usp=sharing)                                                                  | Google Sheets template for LinkedIn profile data                                                                        |
| Browserflow account required for LinkedIn automation with a 7-day free trial, then paid plans apply.                                                                                                                            | https://www.browserflow.com/                                                                                            |
| Rapid API account is required with free credits for LinkedIn API calls (50 free credits).                                                                                                                                       | https://rapidapi.com/                                                                                                   |
| Customize AI prompts in the subworkflow to tailor icebreaker messages to your style and outreach goals.                                                                                                                        | AI prompt customization best practices                                                                                  |
| Regular execution of the workflow is recommended to check connection acceptance and send follow-up messages.                                                                                                                  | Scheduling best practices                                                                                                |
| Potential failure points include API rate limits (Google Sheets, LinkedIn, OpenAI), Browserflow UI changes on LinkedIn, and missing or malformed data in Google Sheets. Implement error handling and retries where possible.       | General integration considerations                                                                                      |
| For advanced integration, consider adding CRM update nodes or notification nodes after message sending to track outreach success.                                                                                              | Workflow extension ideas                                                                                                |

---

This documentation provides a detailed, structured reference for understanding, reproducing, and modifying the "Automate LinkedIn Requests & Icebreaker with Browserflow and Google sheets" workflow. It covers all nodes, their roles, configurations, and interconnections, enabling efficient maintenance and extension.