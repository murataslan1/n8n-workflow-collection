Auto-follow Instagram profiles via Phantombuster and SharePoint

https://n8nworkflows.xyz/workflows/auto-follow-instagram-profiles-via-phantombuster-and-sharepoint-6766


# Auto-follow Instagram profiles via Phantombuster and SharePoint

### 1. Workflow Overview

This workflow automates Instagram profile following by integrating Phantombuster automation agents with Microsoft SharePoint for data storage and session cookie management. It targets social media marketers or growth hackers who want to auto-follow Instagram profiles efficiently while managing session cookies and rate limits.

The logical workflow is split into four main blocks:

- **1.1 Cookie Rotation and Session Management:**  
  Downloads session cookies from SharePoint, selects one based on the current time slice using custom logic, and sets environment variables for subsequent nodes.

- **1.2 Seed Profile Handling and Follower Collection:**  
  Retrieves a CSV list of Instagram accounts ("seed profiles") from SharePoint, launches a Phantombuster agent to collect followers of those seed profiles.

- **1.3 Auto-follow Execution:**  
  Launches a Phantombuster auto-follow agent that uses the gathered follower data to follow Instagram accounts automatically, respecting configured limits.

- **1.4 Rate Limiting and Scheduling:**  
  Controls execution timing and pacing via an hourly schedule trigger and wait nodes to avoid exceeding Instagram or Phantombuster limits.

---

### 2. Block-by-Block Analysis

#### 2.1 Cookie Rotation and Session Management

- **Overview:**  
  This block downloads a list of Instagram session cookies from SharePoint, parses and extracts them, then selects one cookie based on the current Berlin hour divided into equal time slices. The selected cookie is stored as an environment variable for use in API calls.

- **Nodes Involved:**  
  - Schedule Trigger  
  - Get Available Session Cookies (SharePoint)  
  - Extract Cookies  
  - OpenAI Chat Model (used as a LangChain agent for cookie selection logic)  
  - Select Cookie (LangChain agent node with custom prompt)  
  - Set ENV Variables  

- **Node Details:**

  - **Schedule Trigger:**  
    Type: Schedule trigger  
    Role: Starts workflow hourly at 35 minutes past the hour to regularly refresh cookies.  
    Configuration: Hourly trigger at minute 35.  
    Inputs: None  
    Outputs: Get Available Session Cookies  
    Edge cases: Missed triggers if n8n is offline; change interval to adjust frequency.

  - **Get Available Session Cookies:**  
    Type: Microsoft SharePoint  
    Role: Retrieves a text file containing session cookies from a specified SharePoint site and folder.  
    Configuration: Reads file "instagram_session_cookies.txt" from a known SharePoint folder.  
    Inputs: Schedule Trigger  
    Outputs: Extract Cookies  
    Edge cases: SharePoint auth failure, missing file, or network issues.

  - **Extract Cookies:**  
    Type: Extract From File  
    Role: Extracts raw text content of the downloaded file.  
    Configuration: Operation: text extraction.  
    Inputs: Get Available Session Cookies  
    Outputs: Select Cookie  
    Edge cases: Empty file content or malformed data.

  - **OpenAI Chat Model:**  
    Type: LangChain OpenAI chat model  
    Role: Supports natural language processing (used here for the agent node).  
    Configuration: Uses "chatgpt-4o-latest" model; credentials required.  
    Inputs: None directly, but connected as AI model resource for Select Cookie node.  
    Outputs: None direct; integrates with Select Cookie.  
    Edge cases: API key limits, timeout, or rate limits.

  - **Select Cookie:**  
    Type: LangChain Agent  
    Role: Selects one session cookie from the list based on current Berlin time using a custom prompt logic dividing the day into slices.  
    Configuration: Prompt describing selection logic, outputs JSON with single field "session_cookie".  
    Inputs: Extract Cookies, AI model resource (OpenAI Chat Model)  
    Outputs: Set ENV Variables  
    Key expressions: Uses `$now.setZone('Europe/Berlin').format()` for current time, iterates list length and selects slice accordingly.  
    Edge cases: Incorrect prompt logic, empty cookie list, time-zone issues.

  - **Set ENV Variables:**  
    Type: Set  
    Role: Stores session cookie and other environment variables controlling follow limits as workflow variables.  
    Configuration:  
      - ENV_SESSION_COOKIE: from Select Cookie output  
      - ENV_PROFILES_TO_PROCESS: "1" (default, can be increased)  
      - ENV_AMOUNT_FOLLOWERS_PER_PROFILE: "1" (default)  
    Inputs: Select Cookie  
    Outputs: Get Follower Collector  
    Edge cases: Missing input data, type mismatches.

#### 2.2 Seed Profile Handling and Follower Collection

- **Overview:**  
  Retrieves a CSV file listing Instagram seed profiles from SharePoint and launches a Phantombuster agent that collects followers of these profiles for subsequent processing.

- **Nodes Involved:**  
  - Get Follower Collector (Phantombuster agent get)  
  - Get List of Accounts (Microsoft SharePoint)  
  - Get Follower Collector (Phantombuster agent get)  
  - Set ENV Variables (from previous block)  

- **Node Details:**

  - **Get List of Accounts:**  
    Type: Microsoft SharePoint  
    Role: Retrieves the "accounts_to_follow.csv" file from SharePoint folder.  
    Configuration: Reads CSV file from specified SharePoint site and folder.  
    Inputs: Get Follower Collector  
    Outputs: Launch Agent  
    Edge cases: SharePoint auth failure or file not found.

  - **Get Follower Collector:**  
    Type: Phantombuster Agent (get)  
    Role: Retrieves metadata about the follower collector agent with ID "1481471730276201".  
    Configuration: Calls Phantombuster API to get agent info.  
    Inputs: Set ENV Variables  
    Outputs: Get List of Accounts  
    Edge cases: Phantombuster API limits, auth failures.

#### 2.3 Auto-follow Execution

- **Overview:**  
  Launches the Phantombuster auto-follow agent that uses the collected follower data and session cookie to follow new Instagram profiles. This block also waits for completion and fetches results.

- **Nodes Involved:**  
  - Launch Agent (Phantombuster launch)  
  - Wait (wait node)  
  - Get Followers (Phantombuster getOutput)  
  - Get Autofollow Agent (Phantombuster get)  
  - Launch AC Agent (Phantombuster launch)  
  - Wait for result (wait node)  
  - Get Response (Phantombuster getOutput)  

- **Node Details:**

  - **Launch Agent:**  
    Type: Phantombuster Agent (launch)  
    Role: Launches the follower collector agent with parameters from environment variables and spreadsheet URL.  
    Configuration:  
      - agentId: dynamic from Get Follower Collector  
      - Arguments JSON includes numberOfProfilesPerLaunch, sessionCookie, spreadsheetUrl, and numberMaxOfFollowers from ENV variables or file outputs.  
    Inputs: Get List of Accounts  
    Outputs: Wait  

  - **Wait:**  
    Type: Wait node  
    Role: Delays workflow 30 seconds to allow agent to run.  
    Inputs: Launch Agent  
    Outputs: Get Followers  
    Edge cases: Timeout too short or too long may affect data freshness.

  - **Get Followers:**  
    Type: Phantombuster getOutput  
    Role: Retrieves output of the follower collector agent (followers list).  
    Inputs: Wait  
    Outputs: Get Autofollow Agent  

  - **Get Autofollow Agent:**  
    Type: Phantombuster get  
    Role: Retrieves metadata about auto-follow agent with fixed agent ID "798529539709482".  
    Inputs: Get Followers  
    Outputs: Launch AC Agent  
    Edge cases: API failure, invalid agent ID.

  - **Launch AC Agent:**  
    Type: Phantombuster Agent (launch)  
    Role: Launches auto-follow agent with parameters specifying number of profiles to process, session cookie, and spreadsheet URL (followers list).  
    Inputs: Get Autofollow Agent  
    Outputs: Wait for result  

  - **Wait for result:**  
    Type: Wait node  
    Role: Waits 30 seconds for the auto-follow agent to complete.  
    Inputs: Launch AC Agent  
    Outputs: Get Response  

  - **Get Response:**  
    Type: Phantombuster getOutput  
    Role: Fetches the results of the auto-follow agent execution.  
    Inputs: Wait for result  
    Outputs: None (end of execution)  

#### 2.4 Rate Limiting and Scheduling

- **Overview:**  
  Controls workflow start timing and pacing of requests to avoid hitting Instagram or Phantombuster limits.

- **Nodes Involved:**  
  - Schedule Trigger (also part of Cookie Rotation block)  
  - Wait nodes (two instances, both 30 seconds delays)  

- **Node Details:**

  - Schedule Trigger: described above.  
  - Wait nodes:  
    Both wait nodes delay 30 seconds each to space out API calls and agent launches, effectively controlling the rate of requests (~1-40 per hour configurable).  

---

### 3. Summary Table

| Node Name              | Node Type                     | Functional Role                               | Input Node(s)               | Output Node(s)             | Sticky Note                                                                                                                       |
|------------------------|-------------------------------|-----------------------------------------------|-----------------------------|-----------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| Schedule Trigger        | Schedule Trigger              | Starts workflow hourly                         |                             | Get Available Session Cookies | ### 1) Cookie Rotation: Downloads cookies and selects one based on time slice.                                                  |
| Get Available Session Cookies | Microsoft SharePoint          | Retrieves session cookie file                  | Schedule Trigger             | Extract Cookies             | See Schedule Trigger note                                                                                                        |
| Extract Cookies         | Extract From File             | Extracts raw cookie text                        | Get Available Session Cookies | Select Cookie               | See Schedule Trigger note                                                                                                        |
| OpenAI Chat Model       | LangChain OpenAI Chat Model  | Provides AI model for cookie selection         |                             | (Connected to Select Cookie) | See Schedule Trigger note                                                                                                        |
| Select Cookie           | LangChain Agent              | Selects session cookie based on current time   | Extract Cookies, OpenAI Chat Model | Set ENV Variables         | See Schedule Trigger note                                                                                                        |
| Set ENV Variables       | Set                          | Stores session cookie and follow limits        | Select Cookie               | Get Follower Collector      | See Sticky Note5, Sticky Note6                                                                                                  |
| Get Follower Collector  | Phantombuster (get)           | Retrieves follower collector agent metadata    | Set ENV Variables           | Get List of Accounts         | ### 2) Seed Profile Handling: Gets seed profiles CSV and launches follower collector agent.                                     |
| Get List of Accounts    | Microsoft SharePoint          | Downloads seed profiles CSV                      | Get Follower Collector      | Launch Agent                | See Sticky Note5                                                                                                                 |
| Launch Agent            | Phantombuster (launch)        | Launches follower collector agent               | Get List of Accounts        | Wait                       | ### 3) Auto-follow Execution: Launches auto-follow agent with gathered data.                                                    |
| Wait                   | Wait                         | Waits 30 seconds to allow agent execution       | Launch Agent                | Get Followers               | ### 4) Rate Limiting & Scheduling: Wait nodes space out operations to control rate.                                             |
| Get Followers           | Phantombuster (getOutput)     | Retrieves follower collector results            | Wait                       | Get Autofollow Agent        | See Sticky Note6                                                                                                                 |
| Get Autofollow Agent    | Phantombuster (get)           | Retrieves auto-follow agent metadata             | Get Followers               | Launch AC Agent             | See Sticky Note6                                                                                                                 |
| Launch AC Agent         | Phantombuster (launch)        | Launches auto-follow agent                        | Get Autofollow Agent        | Wait for result             | See Sticky Note6                                                                                                                 |
| Wait for result         | Wait                         | Waits 30 seconds for auto-follow agent completion | Launch AC Agent             | Get Response                | See Sticky Note7                                                                                                                 |
| Get Response            | Phantombuster (getOutput)     | Retrieves auto-follow agent output                | Wait for result             |                             | See Sticky Note7                                                                                                                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger node:**  
   - Type: Schedule Trigger  
   - Set to trigger hourly at minute 35.

2. **Create Microsoft SharePoint node "Get Available Session Cookies":**  
   - Operation: Read file  
   - File: "instagram_session_cookies.txt" from your SharePoint site and folder.  
   - Connect Schedule Trigger → Get Available Session Cookies.

3. **Create Extract From File node "Extract Cookies":**  
   - Operation: Extract text content.  
   - Connect Get Available Session Cookies → Extract Cookies.

4. **Create OpenAI Chat Model node "OpenAI Chat Model":**  
   - Model: "chatgpt-4o-latest"  
   - Credentials: Provide valid OpenAI API credentials.

5. **Create LangChain Agent node "Select Cookie":**  
   - Set prompt to implement cookie selection logic based on current Berlin hour dividing cookie list evenly into slices.  
   - Use the extracted cookie list as input.  
   - Connect Extract Cookies → Select Cookie.  
   - Connect OpenAI Chat Model as AI model resource.

6. **Create Set node "Set ENV Variables":**  
   - Assign:  
     - ENV_SESSION_COOKIE: from Select Cookie output field "session_cookie"  
     - ENV_PROFILES_TO_PROCESS: default "1" (string)  
     - ENV_AMOUNT_FOLLOWERS_PER_PROFILE: default "1" (string)  
   - Connect Select Cookie → Set ENV Variables.

7. **Create Phantombuster node "Get Follower Collector":**  
   - Operation: Get agent metadata  
   - Agent ID: 1481471730276201 (Follower Collector)  
   - Credentials: Phantombuster API credentials.  
   - Connect Set ENV Variables → Get Follower Collector.

8. **Create Microsoft SharePoint node "Get List of Accounts":**  
   - Operation: Read file  
   - File: "accounts_to_follow.csv" from SharePoint folder.  
   - Credentials: SharePoint OAuth2.  
   - Connect Get Follower Collector → Get List of Accounts.

9. **Create Phantombuster node "Launch Agent":**  
   - Operation: Launch agent  
   - Agent ID: dynamic from "Get Follower Collector" node output ("id" field)  
   - Parameters JSON:  
     ```json
     {
       "numberofProfilesperLaunch": {{ ENV_PROFILES_TO_PROCESS }},
       "sessionCookie": "{{ ENV_SESSION_COOKIE }}",
       "spreadsheetUrl": "{{ $json['@content.downloadUrl'] }}",
       "numberMaxOfFollowers": {{ ENV_AMOUNT_FOLLOWERS_PER_PROFILE }}
     }
     ```  
   - Credentials: Phantombuster API.  
   - Connect Get List of Accounts → Launch Agent.

10. **Create Wait node "Wait":**  
    - Wait for 30 seconds.  
    - Connect Launch Agent → Wait.

11. **Create Phantombuster node "Get Followers":**  
    - Operation: Get output  
    - Agent ID: 1481471730276201  
    - Credentials: Phantombuster API.  
    - Connect Wait → Get Followers.

12. **Create Phantombuster node "Get Autofollow Agent":**  
    - Operation: Get agent metadata  
    - Agent ID: 798529539709482 (Auto-follow Agent)  
    - Credentials: Phantombuster API.  
    - Connect Get Followers → Get Autofollow Agent.

13. **Create Phantombuster node "Launch AC Agent":**  
    - Operation: Launch agent  
    - Agent ID: 798529539709482  
    - Parameters JSON:  
      ```json
      {
        "numberOfProfilesPerLaunch": {{ ENV_PROFILES_TO_PROCESS }},
        "sessionCookie": "{{ ENV_SESSION_COOKIE }}",
        "spreadsheetUrl": "{{ $json.profileUrl }}"
      }
      ```  
    - Credentials: Phantombuster API.  
    - Connect Get Autofollow Agent → Launch AC Agent.

14. **Create Wait node "Wait for result":**  
    - Wait for 30 seconds.  
    - Connect Launch AC Agent → Wait for result.

15. **Create Phantombuster node "Get Response":**  
    - Operation: Get output  
    - Agent ID: 798529539709482  
    - Credentials: Phantombuster API.  
    - Connect Wait for result → Get Response.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                   | Context or Link                                                                        |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------|
| Cookie rotation logic divides the day into equal time slices depending on number of cookies (2-4) and selects cookie accordingly. Adjust the prompt in the "Select Cookie" node to add/remove cookies or change logic.                          | Sticky Note4                                                                           |
| Seed profiles to follow are managed via the CSV file "accounts_to_follow.csv" in SharePoint. Add or remove profiles here to adjust targets.                                                                                                   | Sticky Note5                                                                           |
| Auto-follow execution parameters such as number of profiles to process and followers per profile are environment variables set in the workflow and can be tuned for speed or limits.                                                          | Sticky Note6                                                                           |
| Rate limiting is controlled by the hourly schedule and 30-second waits after agent launches. Adjust timings to respect API limits or speed up execution.                                                                                      | Sticky Note7                                                                           |
| Credentials used: Phantombuster API key, Microsoft SharePoint OAuth2, OpenAI API key (optional but recommended for cookie selection).                                                                                                         | Entire workflow                                                                        |
| Phantombuster agent IDs are hard-coded for follower collector and auto-follow agents; replace with your own if needed.                                                                                                                        | Nodes "Get Follower Collector", "Launch Agent", "Get Autofollow Agent", "Launch AC Agent" |
| For detailed Phantombuster API usage and agent setup, consult Phantombuster official docs: https://phantombuster.com/api                                                                                                                     | External resource link                                                                |

---

**Disclaimer:** The provided text is extracted exclusively from an n8n automated workflow. It complies strictly with content policies and contains no illegal, offensive, or protected elements. All manipulated data are legal and public.