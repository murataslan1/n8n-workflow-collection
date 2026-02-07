Automate Daily GLPI Pending Ticket Notifications to Microsoft Teams

https://n8nworkflows.xyz/workflows/automate-daily-glpi-pending-ticket-notifications-to-microsoft-teams-7018


# Automate Daily GLPI Pending Ticket Notifications to Microsoft Teams

---

### 1. Workflow Overview

This workflow automates the daily notification of pending GLPI (Gestionnaire Libre de Parc Informatique) tickets to Microsoft Teams chats. It is designed for IT support teams who need to track and act on open tickets assigned to specific technicians or entities. The workflow runs on a fixed schedule, retrieves pending tickets from GLPI via its REST API, checks if there are any ongoing cases, and if so, sends individual chat messages to Microsoft Teams users associated with those tickets.

**Logical Blocks:**

- **1.1 Schedule Trigger:** Defines when the workflow runs (daily at 8 AM).
- **1.2 GLPI Session Management:** Obtains and terminates a session token for authenticated API access.
- **1.3 Retrieve Pending Tickets:** Makes an authenticated API request to fetch tickets pending for the specified technician/entity.
- **1.4 Pending Tickets Evaluation:** Checks whether there are any pending tickets to process.
- **1.5 Ticket Processing Loop:** Iterates over each pending ticket to prepare and send notifications.
- **1.6 Microsoft Teams Notification:** Sends a chat message to the relevant Teams user with ticket details.
- **1.7 Data Aggregation and Cleanup:** Aggregates processed data and gracefully ends the GLPI session.

---

### 2. Block-by-Block Analysis

#### 1.1 Schedule Trigger

- **Overview:**  
  Triggers the workflow automatically at 8 AM every day.

- **Nodes Involved:**  
  - Schedule Trigger

- **Node Details:**  
  - **Schedule Trigger:**  
    - Type: Schedule Trigger  
    - Configuration: Set to trigger daily at hour 8 (8 AM).  
    - Inputs: None (start node)  
    - Outputs: Connects to "Get session token" node.  
    - Edge Cases: Workflow won't run if the n8n instance is down at scheduled time.  
    - Version: 1.2

#### 1.2 GLPI Session Management

- **Overview:**  
  Manages authentication with GLPI by obtaining a session token before API requests and terminating the session afterward.

- **Nodes Involved:**  
  - Get session token  
  - End session

- **Node Details:**  
  - **Get session token:**  
    - Type: HTTP Request  
    - Technical Role: Initiates a session with GLPI using Basic Auth and App-Token for API access.  
    - Configuration:  
      - Method: GET  
      - URL: `https://"your_glpi_server"/apirest.php/initSession/`  
      - Authentication: HTTP Basic Auth using stored GLPI credentials ("GLPI" credential)  
      - Headers: `Content-Type: application/json`, `App-Token: "Your App Token is here"`  
    - Inputs: From Schedule Trigger  
    - Outputs: Session token JSON passed to "Get pending cases"  
    - Failure Types: Authentication failure, server unavailability, invalid credentials  
    - Version: 4.2  

  - **End session:**  
    - Type: HTTP Request  
    - Technical Role: Terminates the GLPI session to free server resources.  
    - Configuration:  
      - Method: GET  
      - URL: `https://"your_glpi_server"/apirest.php/killSession/`  
      - Headers:  
        - `Session-Token`: Extracted from "Get session token" node output  
        - `App-Token`: Same as above  
    - Inputs: From "Aggregate" node after processing tickets  
    - Outputs: Connects to "No Operation, do nothing1" (end of workflow)  
    - Failure Types: Session token expired or invalid, network issues  
    - Version: 4.2  

#### 1.3 Retrieve Pending Tickets

- **Overview:**  
  Queries GLPI's Ticket API for tickets matching specific criteria: assigned to a technician, with a certain status, created after a date, and belonging to a specific entity.

- **Nodes Involved:**  
  - Get pending cases

- **Node Details:**  
  - **Get pending cases:**  
    - Type: HTTP Request  
    - Technical Role: Retrieves a filtered list of tickets from GLPI.  
    - Configuration:  
      - Method: GET  
      - URL: `https://"your_glpi_server"/apirest.php/search/Ticket/`  
      - Query Parameters: Complex criteria including:  
        - Field 5 equals 8 (technician ID, to be customized)  
        - Field 12 equals 2 (status)  
        - Field 15 more than "2024-08-01" (creation date threshold)  
        - Field 80 contains "entity_name" (entity filter)  
        - Order descending  
      - Headers:  
        - `Content-Type: application/json`  
        - `Session-Token`: Passed dynamically from session token node (`{{ $json.session_token }}`)  
        - `App-Token`: Static app token string  
    - Inputs: From "Get session token"  
    - Outputs: JSON listing tickets to "Are there any ongoing cases?"  
    - Failure Types: Token expiration, invalid query parameters, GLPI server errors  
    - Version: 4.2  

#### 1.4 Pending Tickets Evaluation

- **Overview:**  
  Decides whether any tickets were returned by the query, controlling subsequent flow.

- **Nodes Involved:**  
  - Are there any ongoing cases? (IF node)

- **Node Details:**  
  - **Are there any ongoing cases?:**  
    - Type: IF  
    - Technical Role: Checks if the total count of tickets is greater than zero.  
    - Configuration:  
      - Condition: `{{ $json.totalcount }} > 0`  
    - Inputs: From "Get pending cases"  
    - Outputs:  
      - True branch: Connects to "Split Out" node to process tickets  
      - False branch: Connects to "No Operation, do nothing" node to skip further processing  
    - Edge Cases: `totalcount` missing or malformed JSON may cause expression errors  
    - Version: 2.2  

#### 1.5 Ticket Processing Loop

- **Overview:**  
  Splits multiple tickets into individual items for processing and later aggregates results.

- **Nodes Involved:**  
  - Split Out  
  - Loop Over Items (Split in Batches)  
  - Aggregate

- **Node Details:**  
  - **Split Out:**  
    - Type: Split Out  
    - Role: Extracts the 'data' array containing ticket details to separate items  
    - Configuration: Field to split out: `data`  
    - Inputs: From IF node (true branch)  
    - Outputs: To "Loop Over Items"  
    - Version: 1  

  - **Loop Over Items:**  
    - Type: Split In Batches  
    - Role: Processes tickets one by one, enabling batch handling or rate limiting  
    - Configuration: Default batch options (process all items one by one)  
    - Inputs: From "Split Out"  
    - Outputs: Two outputs:  
      - Main 0: to "Aggregate" (collect results)  
      - Main 1: to "Create chat message" (send message per ticket)  
    - Edge Cases: Large number of tickets may cause performance issues or API rate limits  
    - Version: 3  

  - **Aggregate:**  
    - Type: Aggregate  
    - Role: Reassembles processed items after loop completion  
    - Configuration: Aggregate all item data into one array  
    - Inputs: From "Loop Over Items" (main 0)  
    - Outputs: To "End session" node  
    - Version: 1  

#### 1.6 Microsoft Teams Notification

- **Overview:**  
  Sends a formatted chat message to a Microsoft Teams chat, notifying about each pending ticket.

- **Nodes Involved:**  
  - Create chat message

- **Node Details:**  
  - **Create chat message:**  
    - Type: Microsoft Teams node  
    - Role: Posts a chat message to notify about a ticket.  
    - Configuration:  
      - Resource: Chat Message  
      - Operation: Create  
      - Chat ID: Selected from a list (empty in JSON, intended to be dynamically set or manually configured)  
      - Message Template:  
        ```
        ## Action Required: Pending Cases

        **Title:** {{ $json['1'] }}

        **ID:** {{ $json['2'] }}

        **Due Date:** {{ $json['18'] }}
        ```  
      - Options: Do not include link to workflow  
    - Inputs: From "Loop Over Items" (main 1)  
    - Outputs: Loop back to "Loop Over Items" for continued processing  
    - Credentials: Microsoft Teams OAuth2 account configured with required permissions (basic or standard license)  
    - Failure Types: Authentication failure, invalid chat ID, network errors  
    - Version: 2

#### 1.7 Workflow Termination

- **Overview:**  
  After processing all tickets and sending notifications, the workflow ensures proper cleanup.

- **Nodes Involved:**  
  - No Operation, do nothing  
  - No Operation, do nothing1

- **Node Details:**  
  - Both are NoOp nodes acting as workflow endpoints or placeholders to indicate no further action.  
  - Inputs:  
    - No Operation, do nothing: From IF node false branch (no tickets)  
    - No Operation, do nothing1: From "End session" node (workflow end)  
  - Outputs: None  
  - Version: 1  

---

### 3. Summary Table

| Node Name              | Node Type               | Functional Role                                     | Input Node(s)                | Output Node(s)             | Sticky Note                                                                                                                               |
|------------------------|-------------------------|----------------------------------------------------|------------------------------|----------------------------|-------------------------------------------------------------------------------------------------------------------------------------------|
| Schedule Trigger        | Schedule Trigger        | Initiates workflow daily at 8 AM                    | None                         | Get session token          | Define the workflow execution schedule that best suits you.                                                                               |
| Get session token      | HTTP Request            | Obtains GLPI API session token                      | Schedule Trigger             | Get pending cases          | Method: GET; URL: /initSession/; Basic Auth with GLPI credentials; sends headers Content-Type and App-Token.                              |
| Get pending cases      | HTTP Request            | Retrieves pending tickets with filters from GLPI   | Get session token            | Are there any ongoing cases? | Method: GET; URL: /search/Ticket/; sends complex query parameters and headers with Session-Token and App-Token.                            |
| Are there any ongoing cases? | IF                    | Checks if any tickets exist                          | Get pending cases            | Split Out (true), No Operation, do nothing (false) | Condition: totalcount > 0                                                                                                                |
| Split Out              | Split Out               | Extracts ticket array for iteration                  | Are there any ongoing cases? | Loop Over Items            | Separates multiple cases for iteration.                                                                                                   |
| Loop Over Items        | Split In Batches        | Iterates over each ticket                             | Split Out                   | Aggregate (main 0), Create chat message (main 1) |                                                                                                                                            |
| Aggregate              | Aggregate               | Aggregates processed ticket data                     | Loop Over Items (main 0)      | End session                | Reassembles data after iteration.                                                                                                         |
| End session            | HTTP Request            | Terminates GLPI session                              | Aggregate                   | No Operation, do nothing1  | Method: GET; URL: /killSession/; sends headers with Session-Token and App-Token.                                                          |
| No Operation, do nothing | No Operation           | Placeholder for no tickets case                      | Are there any ongoing cases? (false) | None                      |                                                                                                                                            |
| No Operation, do nothing1 | No Operation           | Placeholder for workflow end                         | End session                 | None                      |                                                                                                                                            |
| Create chat message    | Microsoft Teams         | Sends notification message per ticket               | Loop Over Items (main 1)      | Loop Over Items            | Credential: Microsoft Teams OAuth2; Resource: Chat Message; Operation: Create; Message includes ticket Title, ID, Due Date.               |
| Sticky Note            | Sticky Note             | Explanation for Schedule Trigger                     | None                         | None                      | Define the workflow execution schedule that best suits you.                                                                               |
| Sticky Note1           | Sticky Note             | Explanation for Get session token node               | None                         | None                      | Details on HTTP Request configuration for session token.                                                                                  |
| Sticky Note2           | Sticky Note             | Explanation for Get pending cases node                | None                         | None                      | Details on HTTP Request configuration for retrieving pending cases.                                                                       |
| Sticky Note3           | Sticky Note             | Explanation for IF node checking ongoing cases       | None                         | None                      | Condition details for ongoing cases check.                                                                                               |
| Sticky Note4           | Sticky Note             | Explanation for Split Out node                         | None                         | None                      | Explains splitting multiple cases for iteration.                                                                                         |
| Sticky Note5           | Sticky Note             | Explanation for Aggregate node                         | None                         | None                      | Explains data aggregation after iteration.                                                                                               |
| Sticky Note6           | Sticky Note             | Explanation for End session node                       | None                         | None                      | Details on terminating GLPI session HTTP request.                                                                                        |
| Sticky Note7           | Sticky Note             | Explanation for Microsoft Teams message creation      | None                         | None                      | Credential requirements and Microsoft Teams admin steps for setting up notification sending.                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger**  
   - Node Type: Schedule Trigger  
   - Set to trigger daily at 8 AM (triggerAtHour: 8)  
   - Connect its output to "Get session token" node.

2. **Create Get session token HTTP Request**  
   - Node Type: HTTP Request  
   - Method: GET  
   - URL: `https://"your_glpi_server"/apirest.php/initSession/`  
   - Authentication: HTTP Basic Auth using 'GLPI' credentials (username/password)  
   - Headers:  
     - Content-Type: application/json  
     - App-Token: `"Your App Token is here"` (replace with actual token)  
   - Connect input from Schedule Trigger  
   - Connect output to "Get pending cases" node.

3. **Create Get pending cases HTTP Request**  
   - Node Type: HTTP Request  
   - Method: GET  
   - URL: `https://"your_glpi_server"/apirest.php/search/Ticket/`  
   - Query Parameters:  
     - criteria[0][field]: 5 (technician ID field)  
     - criteria[0][searchtype]: equals  
     - criteria[0][value]: 8 (replace with actual technician ID)  
     - criteria[1][link]: AND  
     - criteria[1][field]: 12 (status field)  
     - criteria[1][searchtype]: equals  
     - criteria[1][value]: 2 (status code for pending)  
     - criteria[2][link]: AND  
     - criteria[2][field]: 15 (date field)  
     - criteria[2][searchtype]: morethan  
     - criteria[2][value]: 2024-08-01 (adjust date threshold as needed)  
     - criteria[3][link]: AND  
     - criteria[3][field]: 80 (entity field)  
     - criteria[3][searchtype]: contains  
     - criteria[3][value]: "entity_name" (replace with actual entity name)  
     - order: DESC  
   - Headers:  
     - Content-Type: application/json  
     - Session-Token: Expression `{{ $json.session_token }}` from "Get session token"  
     - App-Token: `"Your App Token is here"`  
   - Connect input from "Get session token"  
   - Connect output to "Are there any ongoing cases?" node.

4. **Create 'Are there any ongoing cases?' IF node**  
   - Node Type: IF  
   - Condition: Numeric, check if `{{ $json.totalcount }}` is greater than 0  
   - Connect input from "Get pending cases"  
   - True output to "Split Out" node  
   - False output to "No Operation, do nothing" node.

5. **Create Split Out node**  
   - Node Type: Split Out  
   - Field to split out: `data` (array of tickets)  
   - Connect input from IF node true branch  
   - Connect output to "Loop Over Items" node.

6. **Create Loop Over Items node**  
   - Node Type: Split In Batches  
   - Default options (process all items)  
   - Connect input from "Split Out"  
   - Output 0 to "Aggregate" node (for data aggregation)  
   - Output 1 to "Create chat message" node (to send notification).

7. **Create Aggregate node**  
   - Node Type: Aggregate  
   - Aggregate all item data into a single array  
   - Connect input from "Loop Over Items" output 0  
   - Connect output to "End session" node.

8. **Create End session HTTP Request**  
   - Node Type: HTTP Request  
   - Method: GET  
   - URL: `https://"your_glpi_server"/apirest.php/killSession/`  
   - Headers:  
     - Session-Token: Expression from "Get session token" node (`{{ $('Get session token').item.json.session_token }}`)  
     - App-Token: `"Your App Token is here"`  
   - Connect input from "Aggregate"  
   - Connect output to "No Operation, do nothing1" node.

9. **Create No Operation, do nothing node**  
   - Node Type: No Operation  
   - Connect input from IF node false branch (no tickets case)  
   - No output (workflow ends here if no tickets).

10. **Create No Operation, do nothing1 node**  
    - Node Type: No Operation  
    - Connect input from "End session" node  
    - No output (workflow ends).

11. **Create Create chat message Microsoft Teams node**  
    - Node Type: Microsoft Teams  
    - Credentials: Configure OAuth2 credentials with Microsoft Teams account having basic or standard license.  
    - Resource: Chat Message  
    - Operation: Create  
    - Chat ID: Select from list or dynamically configure the recipient (ensure the technician's chat is accessible)  
    - Message: Use template:  
      ```
      ## Action Required: Pending Cases

      **Title:** {{ $json['1'] }}

      **ID:** {{ $json['2'] }}

      **Due Date:** {{ $json['18'] }}
      ```  
    - Connect input from "Loop Over Items" output 1  
    - Connect output back to "Loop Over Items" for continued processing.

**Note on Credentials:**  
- GLPI credentials must be set up as HTTP Basic Auth credential type in n8n named "GLPI".  
- Microsoft Teams account OAuth2 credentials with permissions to create chat messages must be configured.  
- Replace all placeholders `"your_glpi_server"`, `"Your App Token is here"`, technician IDs, entity names, and dates with actual values before deployment.

---

### 5. General Notes & Resources

| Note Content                                                                                                     | Context or Link                                                                                                                     |
|------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| Microsoft Teams account used must have a basic or standard license to send chat messages.                        | Sticky Note7: Credential instructions and Microsoft Admin Center steps to add n8n app under Enterprise apps > User and groups.    |
| GLPI API uses session tokens obtained via Basic Auth and App-Token headers for authentication.                   | Sticky Note1 and Sticky Note6 provide detailed header and authentication setup for session management.                            |
| Tickets query filters must be customized to your GLPI setup: technician ID, entity names, status codes, and dates.| Sticky Note2 explains the query parameters in detail for fetching pending tickets.                                                 |
| The workflow handles cases where no tickets are found by skipping message sending and ending gracefully.         | Sticky Note3 documents the IF node logic for ongoing cases check.                                                                 |
| Links to official n8n Microsoft Teams node documentation can aid in customizing message templates and chat IDs. | https://docs.n8n.io/integrations/builtin/nodes/n8n-nodes-base.microsoftTeams/                                                       |

---

**Disclaimer:** The provided text is exclusively derived from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled are legal and public.

---