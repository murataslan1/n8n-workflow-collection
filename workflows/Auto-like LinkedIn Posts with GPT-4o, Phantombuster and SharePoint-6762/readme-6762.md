Auto-like LinkedIn Posts with GPT-4o, Phantombuster and SharePoint

https://n8nworkflows.xyz/workflows/auto-like-linkedin-posts-with-gpt-4o--phantombuster-and-sharepoint-6762


# Auto-like LinkedIn Posts with GPT-4o, Phantombuster and SharePoint

### 1. Workflow Overview

This workflow automates the process of liking LinkedIn posts by integrating GPT-4o (OpenAI), Phantombuster bots, and SharePoint for data storage. It is designed for users who want to automate engagement on LinkedIn by intelligently selecting posts to like based on generated search terms and organized session management.

The workflow consists of the following logical blocks:

- **1.1 Scheduling and Initialization:** Triggers the workflow periodically and retrieves available session cookies from SharePoint.
- **1.2 Cookie Selection and Search Term Generation:** Uses OpenAI language models to select a session cookie and generate a random search term for LinkedIn post discovery.
- **1.3 Launching LinkedIn Search Agent:** Starts a Phantombuster agent to find LinkedIn posts matching the search term.
- **1.4 Downloading and Filtering Posts:** Downloads the search results, extracts data, and selects a random post that hasn't been interacted with yet.
- **1.5 Preparing and Uploading Data:** Updates the CSV file with the latest interactions and uploads it back to SharePoint.
- **1.6 Launching Auto-Liking Agent:** Runs a Phantombuster agent that uses the selected post and session to perform the auto-like action.
- **1.7 Waiting and Orchestration:** Includes several wait nodes to manage operation timing and pacing.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduling and Initialization

- **Overview:** This block triggers the workflow execution on a schedule and fetches the available LinkedIn session cookies stored in SharePoint for use in automation.
- **Nodes Involved:**  
  - Schedule Trigger  
  - Get Available Session Cookies (Microsoft SharePoint)  
  - Extract Cookies (Extract from File)

- **Node Details:**  
  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Role: Periodically starts the workflow  
    - Config: Default cron or interval scheduling (not specified in JSON)  
    - Inputs: None  
    - Outputs: Triggers "Get Available Session Cookies"  
    - Failures: Misconfigured schedule or disabled node stops workflow triggering.

  - **Get Available Session Cookies**  
    - Type: Microsoft SharePoint  
    - Role: Retrieves session cookie files from SharePoint storage  
    - Config: Points to the SharePoint site and folder containing session cookies  
    - Inputs: Trigger from Schedule Trigger  
    - Outputs: Passes files to "Extract Cookies"  
    - Failures: Authentication errors, file not found, or access denied.

  - **Extract Cookies**  
    - Type: Extract from File  
    - Role: Parses cookie files to extract usable session data  
    - Config: Set to extract relevant cookie fields  
    - Inputs: Files from SharePoint node  
    - Outputs: Passes cookie data to "Select Cookie"  
    - Edge Cases: Malformed files, empty data, or unsupported formats.

---

#### 1.2 Cookie Selection and Search Term Generation

- **Overview:** Selects one session cookie for use and generates a random search term via OpenAI to discover LinkedIn posts dynamically.
- **Nodes Involved:**  
  - Select Cookie (Langchain Agent)  
  - OpenAI Chat Model1 (OpenAI LM)  
  - Generate Random Search Term (Langchain Agent)  
  - OpenAI Chat Model (OpenAI LM)

- **Node Details:**  
  - **Select Cookie**  
    - Type: Langchain Agent  
    - Role: Chooses the best or random cookie from extracted data for session usage  
    - Config: Uses AI reasoning to select cookie based on criteria  
    - Inputs: Cookie data from "Extract Cookies"  
    - Outputs: Selected cookie to "Generate Random Search Term"  
    - Failures: AI model unavailability or input data errors.

  - **OpenAI Chat Model1**  
    - Type: OpenAI LM Chat Model  
    - Role: Supports "Select Cookie" with AI capabilities  
    - Config: GPT-4o or equivalent model, configured with credentials  
    - Inputs: Prompt from "Select Cookie"  
    - Outputs: Response passed back to "Select Cookie"

  - **Generate Random Search Term**  
    - Type: Langchain Agent  
    - Role: Generates a new search term to find LinkedIn posts  
    - Config: Uses AI with prompts to generate relevant, random keywords or phrases  
    - Inputs: Selected cookie and context from "Select Cookie"  
    - Outputs: Search term to "Set ENV Variables"  
    - Failures: AI latency, inappropriate output, or empty generation.

  - **OpenAI Chat Model**  
    - Type: OpenAI LM Chat Model  
    - Role: Supports "Generate Random Search Term" generation  
    - Config: GPT-4o or equivalent, with proper API credentials  
    - Inputs: Prompt from "Generate Random Search Term"  
    - Outputs: Generated phrase for the search agent.

---

#### 1.3 Launching LinkedIn Search Agent

- **Overview:** Sets environment variables and launches the Phantombuster agent to search LinkedIn posts using the generated search term and selected session.
- **Nodes Involved:**  
  - Set ENV Variables (Set Node)  
  - Get Search Agent (Phantombuster)  
  - Launch Agent (Phantombuster)

- **Node Details:**  
  - **Set ENV Variables**  
    - Type: Set  
    - Role: Defines environment variables such as session cookies and search terms for downstream agents  
    - Config: Assigns variables required by Phantombuster agents  
    - Inputs: Search term from "Generate Random Search Term"  
    - Outputs: To "Get Search Agent"  
    - Failures: Missing variables or incorrect formatting.

  - **Get Search Agent**  
    - Type: Phantombuster  
    - Role: Retrieves or initializes the LinkedIn Search agent configuration  
    - Config: Uses Phantombuster credentials and agent IDs  
    - Inputs: Environment variables from "Set ENV Variables"  
    - Outputs: Ready agent data to "Launch Agent"  
    - Failures: API errors, invalid agent ID, or auth issues.

  - **Launch Agent**  
    - Type: Phantombuster  
    - Role: Executes the LinkedIn Search agent to collect posts  
    - Config: Uses Phantombuster API with parameters and session info  
    - Inputs: Agent data from "Get Search Agent"  
    - Outputs: Triggers "Wait" node for pacing  
    - Failures: Network timeouts, API limits, or invalid session.

---

#### 1.4 Downloading and Filtering Posts

- **Overview:** Downloads the posts found by the search agent, parses the data, and picks a random post that is not already in the interaction list.
- **Nodes Involved:**  
  - Wait (Wait)  
  - Get Posts (Phantombuster)  
  - Wait2 (Wait)  
  - Get Random Post (Code)  
  - Download file (Microsoft SharePoint)  
  - Extract from File (Extract from File)  
  - Check if in List (Code)  
  - If (If)  

- **Node Details:**  
  - **Wait**  
    - Type: Wait  
    - Role: Adds delay after launching agent to allow data generation  
    - Inputs: From "Launch Agent"  
    - Outputs: To "Get Posts"

  - **Get Posts**  
    - Type: Phantombuster  
    - Role: Retrieves the search results from Phantombuster  
    - Inputs: After wait  
    - Outputs: To "Wait2"

  - **Wait2**  
    - Type: Wait  
    - Role: Adds buffer time before processing posts  
    - Inputs: From "Get Posts"  
    - Outputs: To "Get Random Post"

  - **Get Random Post**  
    - Type: Code  
    - Role: Selects a random post from the dataset  
    - Inputs: Post data after "Wait2"  
    - Outputs: To "Download file"  
    - Edge Cases: Empty dataset or malformed data.

  - **Download file**  
    - Type: Microsoft SharePoint  
    - Role: Downloads CSV or JSON file containing past interactions or posts  
    - Inputs: From "Get Random Post"  
    - Outputs: To "Extract from File"

  - **Extract from File**  
    - Type: Extract from File  
    - Role: Parses downloaded file for existing post IDs or interaction records  
    - Inputs: From "Download file"  
    - Outputs: To "Check if in List"

  - **Check if in List**  
    - Type: Code  
    - Role: Checks if the randomly selected post is already in the interaction list  
    - Inputs: Extracted list and selected post  
    - Outputs: Conditional branch to "If" node

  - **If**  
    - Type: If  
    - Role: Branches workflow based on whether the post was already liked  
    - True path: Wait2 (retry or select another post)  
    - False path: Prepare Updated Data  
    - Edge Cases: Logical errors or empty conditions.

---

#### 1.5 Preparing and Uploading Data

- **Overview:** Updates the list of interacted posts by adding the new post and uploads the updated CSV back to SharePoint.
- **Nodes Involved:**  
  - Prepare Updated Data (Code)  
  - Convert to File (Convert to File)  
  - Update file (Microsoft SharePoint)  
  - Create CSV Binary (Code)  
  - Upload CSV (Microsoft SharePoint)

- **Node Details:**  
  - **Prepare Updated Data**  
    - Type: Code  
    - Role: Adds the new post's data to the existing list for tracking  
    - Inputs: From "If" node (False branch)  
    - Outputs: To "Convert to File"

  - **Convert to File**  
    - Type: Convert to File  
    - Role: Converts updated data into a CSV or compatible file format  
    - Inputs: Data from "Prepare Updated Data"  
    - Outputs: To "Update file"

  - **Update file**  
    - Type: Microsoft SharePoint  
    - Role: Updates the existing file in SharePoint with new content  
    - Inputs: Converted file from "Convert to File"  
    - Outputs: To "Create CSV Binary"

  - **Create CSV Binary**  
    - Type: Code  
    - Role: Generates a binary CSV file for upload  
    - Inputs: From "Update file"  
    - Outputs: To "Upload CSV"

  - **Upload CSV**  
    - Type: Microsoft SharePoint  
    - Role: Uploads the CSV file back to SharePoint to persist the updated list  
    - Inputs: Binary CSV from "Create CSV Binary"  
    - Outputs: To "Get Autoliking Agent"  
    - Failures: Permissions, network errors, or file conflicts.

---

#### 1.6 Launching Auto-Liking Agent

- **Overview:** Initiates the Phantombuster agent responsible for liking the selected LinkedIn post using the chosen session cookie.
- **Nodes Involved:**  
  - Get Autoliking Agent (Phantombuster)  
  - Launch AL Agent (Phantombuster)  
  - Wait1 (Wait)  
  - Get Response (Phantombuster)

- **Node Details:**  
  - **Get Autoliking Agent**  
    - Type: Phantombuster  
    - Role: Retrieves the auto-like agent configuration  
    - Inputs: From "Upload CSV"  
    - Outputs: To "Launch AL Agent"

  - **Launch AL Agent**  
    - Type: Phantombuster  
    - Role: Runs the auto-like agent with the selected post and session  
    - Inputs: Agent data from "Get Autoliking Agent"  
    - Outputs: To "Wait1"

  - **Wait1**  
    - Type: Wait  
    - Role: Waits for the agent to complete liking action  
    - Inputs: From "Launch AL Agent"  
    - Outputs: To "Get Response"

  - **Get Response**  
    - Type: Phantombuster  
    - Role: Retrieves the result or status of the auto-like action  
    - Inputs: After "Wait1"  
    - Outputs: End or subsequent workflow steps  
    - Failures: API errors, session expiration, or action failure.

---

#### 1.7 Waiting and Orchestration

- **Overview:** Uses multiple wait nodes to space out actions, ensuring API rate limits and data availability.
- **Nodes Involved:**  
  - Wait  
  - Wait1  
  - Wait2

- **Node Details:**  
  - **Wait, Wait1, Wait2**  
    - Type: Wait  
    - Role: Introduce time delays between API calls and agent launches to prevent race conditions and API limit breaches  
    - Config: Duration not specified; should be configured to a few seconds or minutes as per API limits  
    - Inputs and Outputs: Used to sequence nodes as described.

---

### 3. Summary Table

| Node Name                 | Node Type                       | Functional Role                          | Input Node(s)                       | Output Node(s)                       | Sticky Note |
|---------------------------|--------------------------------|----------------------------------------|-----------------------------------|------------------------------------|-------------|
| Schedule Trigger          | Schedule Trigger                | Initiates workflow on schedule         | None                              | Get Available Session Cookies       |             |
| Get Available Session Cookies | Microsoft SharePoint           | Retrieves LinkedIn session cookies     | Schedule Trigger                  | Extract Cookies                     |             |
| Extract Cookies           | Extract from File               | Parses session cookie files            | Get Available Session Cookies     | Select Cookie                      |             |
| Select Cookie             | Langchain Agent                | Selects session cookie for use         | Extract Cookies                  | Generate Random Search Term         |             |
| OpenAI Chat Model1        | OpenAI LM Chat Model           | Supports cookie selection via AI       | Select Cookie                    | Select Cookie (internal)            |             |
| Generate Random Search Term | Langchain Agent                | Creates search term for LinkedIn posts | Select Cookie                   | Set ENV Variables                   |             |
| OpenAI Chat Model         | OpenAI LM Chat Model           | Supports search term generation         | Generate Random Search Term       | Generate Random Search Term (internal) |             |
| Set ENV Variables         | Set                            | Sets environment variables for agents  | Generate Random Search Term       | Get Search Agent                   |             |
| Get Search Agent          | Phantombuster                  | Gets LinkedIn Search agent config      | Set ENV Variables                | Launch Agent                      |             |
| Launch Agent              | Phantombuster                  | Launches LinkedIn Search agent          | Get Search Agent                 | Wait                             |             |
| Wait                     | Wait                           | Waits for search results to be ready   | Launch Agent                    | Get Posts                        |             |
| Get Posts                 | Phantombuster                  | Retrieves LinkedIn posts from search   | Wait                           | Wait2                            |             |
| Wait2                    | Wait                           | Delays before selecting a post         | Get Posts                      | Get Random Post                  |             |
| Get Random Post           | Code                           | Selects a random LinkedIn post          | Wait2                           | Download file                   |             |
| Download file            | Microsoft SharePoint           | Downloads CSV of interactions           | Get Random Post                 | Extract from File               |             |
| Extract from File         | Extract from File               | Extracts list of interacted posts       | Download file                  | Check if in List                |             |
| Check if in List          | Code                           | Checks if post was already liked        | Extract from File              | If                            |             |
| If                       | If                             | Branches based on post existence          | Check if in List               | Wait2 (true), Prepare Updated Data (false) |             |
| Prepare Updated Data      | Code                           | Adds new liked post to list              | If (false path)                | Convert to File                |             |
| Convert to File           | Convert to File                | Converts data to CSV                     | Prepare Updated Data           | Update file                   |             |
| Update file               | Microsoft SharePoint           | Updates SharePoint file                   | Convert to File               | Create CSV Binary             |             |
| Create CSV Binary         | Code                           | Creates binary CSV for upload             | Update file                   | Upload CSV                   |             |
| Upload CSV                | Microsoft SharePoint           | Uploads updated CSV to SharePoint          | Create CSV Binary             | Get Autoliking Agent          |             |
| Get Autoliking Agent      | Phantombuster                  | Retrieves auto-like agent configuration   | Upload CSV                   | Launch AL Agent              |             |
| Launch AL Agent           | Phantombuster                  | Launches auto-like agent                   | Get Autoliking Agent          | Wait1                      |             |
| Wait1                    | Wait                           | Waits for auto-like completion           | Launch AL Agent              | Get Response               |             |
| Get Response              | Phantombuster                  | Gets status/result of auto-like action    | Wait1                        | End                       |             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node**  
   - Set it to run at desired intervals (e.g., every hour).

2. **Add a Microsoft SharePoint node: Get Available Session Cookies**  
   - Configure credentials for SharePoint access.  
   - Set to list or download session cookie files stored for LinkedIn sessions.

3. **Add an Extract from File node: Extract Cookies**  
   - Connect from Get Available Session Cookies.  
   - Configure to extract cookie data needed for LinkedIn session authentication.

4. **Add a Langchain Agent node: Select Cookie**  
   - Connect from Extract Cookies.  
   - Configure prompt or logic to select an appropriate session cookie for use.

5. **Add an OpenAI Chat Model node (OpenAI Chat Model1)**  
   - Connect as AI language model for the Select Cookie node.  
   - Configure with OpenAI credentials using GPT-4o or similar.

6. **Add a Langchain Agent node: Generate Random Search Term**  
   - Connect from Select Cookie.  
   - Configure prompts to generate random LinkedIn search keywords.

7. **Add an OpenAI Chat Model node (OpenAI Chat Model)**  
   - Connect as AI language model for Generate Random Search Term.  
   - Configure with OpenAI credentials.

8. **Add a Set node: Set ENV Variables**  
   - Connect from Generate Random Search Term.  
   - Define environment variables with the selected cookie and search term for agents.

9. **Add a Phantombuster node: Get Search Agent**  
   - Connect from Set ENV Variables.  
   - Configure to retrieve LinkedIn Search agent info using Phantombuster credentials.

10. **Add a Phantombuster node: Launch Agent**  
    - Connect from Get Search Agent.  
    - Configure to launch the LinkedIn Search agent.

11. **Add a Wait node: Wait**  
    - Connect from Launch Agent.  
    - Set delay to allow agent completion (e.g., several minutes).

12. **Add a Phantombuster node: Get Posts**  
    - Connect from Wait.  
    - Configure to fetch posts found by the search agent.

13. **Add a Wait node: Wait2**  
    - Connect from Get Posts.  
    - Set a brief delay for data readiness.

14. **Add a Code node: Get Random Post**  
    - Connect from Wait2.  
    - Script to randomly select a post from the dataset.

15. **Add a Microsoft SharePoint node: Download file**  
    - Connect from Get Random Post.  
    - Download CSV or JSON file containing previously liked posts.

16. **Add an Extract from File node: Extract from File**  
    - Connect from Download file.  
    - Extract list of previously liked posts.

17. **Add a Code node: Check if in List**  
    - Connect from Extract from File.  
    - Check if the randomly selected post is already in the list.

18. **Add an If node: If**  
    - Connect from Check if in List.  
    - Configure condition to branch if post is new or already liked.  
    - True branch: Connect back to Wait2 to retry selection.  
    - False branch: Proceed to Prepare Updated Data.

19. **Add a Code node: Prepare Updated Data**  
    - Connect from If (false branch).  
    - Append new post to the interaction list.

20. **Add a Convert to File node: Convert to File**  
    - Connect from Prepare Updated Data.  
    - Convert updated list to CSV.

21. **Add a Microsoft SharePoint node: Update file**  
    - Connect from Convert to File.  
    - Update the stored CSV file on SharePoint.

22. **Add a Code node: Create CSV Binary**  
    - Connect from Update file.  
    - Create a binary CSV file for upload.

23. **Add a Microsoft SharePoint node: Upload CSV**  
    - Connect from Create CSV Binary.  
    - Upload the updated CSV to SharePoint.

24. **Add a Phantombuster node: Get Autoliking Agent**  
    - Connect from Upload CSV.  
    - Retrieve configuration for auto-liking agent.

25. **Add a Phantombuster node: Launch AL Agent**  
    - Connect from Get Autoliking Agent.  
    - Launch auto-like agent with selected post and session.

26. **Add a Wait node: Wait1**  
    - Connect from Launch AL Agent.  
    - Wait for completion of the liking process.

27. **Add a Phantombuster node: Get Response**  
    - Connect from Wait1.  
    - Retrieve the result/status of the liking action.

28. **Ensure all nodes use appropriate credentials:**  
    - SharePoint OAuth2 credentials for SharePoint nodes.  
    - Phantombuster API credentials for Phantombuster nodes.  
    - OpenAI API key for Chat Model nodes.

29. **Configure error handling and timeout thresholds** on critical nodes, especially API calls and wait nodes, to handle edge cases like expired sessions or API rate limits.

---

### 5. General Notes & Resources

| Note Content                                                                                               | Context or Link                                            |
|------------------------------------------------------------------------------------------------------------|------------------------------------------------------------|
| Workflow integrates OpenAI GPT-4o via Langchain nodes for dynamic session and search term selection.       | OpenAI API documentation: https://platform.openai.com/docs |
| Uses Phantombuster agents to automate LinkedIn interactions.                                               | Phantombuster API: https://phantombuster.com/api           |
| Session cookies are securely managed via SharePoint storage to maintain persistent authentication context. | SharePoint API docs: https://docs.microsoft.com/en-us/sharepoint/dev/sp-add-ins/overview-of-sharepoint-add-in-development |
| Wait nodes are crucial to respect API rate limits and ensure data availability before proceeding.          | Best practice for API automation scheduling                 |
| This workflow is designed for LinkedIn automation within compliance with LinkedIn's terms of service.      | Users should ensure ethical use and respect platform rules. |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects current content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and public.