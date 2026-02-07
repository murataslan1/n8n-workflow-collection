Automate WhatsApp tests and rank results with PostgreSQL (Module "Quiz")

https://n8nworkflows.xyz/workflows/automate-whatsapp-tests-and-rank-results-with-postgresql--module--quiz---3649


# Automate WhatsApp tests and rank results with PostgreSQL (Module "Quiz")

### 1. Workflow Overview

This workflow automates the delivery, management, and evaluation of quizzes or tests via WhatsApp, integrating tightly with a PostgreSQL database for persistent storage and ranking. It targets educators, HR teams, and similar users who want to streamline quiz distribution and result collection without manual intervention.

The workflow is logically divided into these main blocks:

- **1.1 Input Reception & Initialization**: Receives WhatsApp messages, initializes session data, and retrieves the bot’s current status from the database.
- **1.2 Command Routing & Flow Control**: Determines user intent via switches and routes the flow to appropriate sub-processes such as listing tests, starting a test, or answering questions.
- **1.3 Test Data Management**: Queries PostgreSQL to fetch tests, questions, and answers; updates user answers; and manages bot status updates.
- **1.4 User Interaction via WhatsApp**: Sends messages to users, including menus, questions, answer requests, and final results.
- **1.5 Answer Processing & Ranking**: Randomizes questions, checks for unanswered questions, calculates scores, updates answers in the database, and finally sends ranking results to users.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Initialization

**Overview:**  
This block handles incoming WhatsApp messages, initializes variables, and fetches the current bot status from PostgreSQL to determine the next steps.

**Nodes Involved:**  
- WhatsApp Trigger  
- Initialization  
- Get Bot Status  
- Define Flow

**Node Details:**

- **WhatsApp Trigger**  
  - *Type:* WhatsApp Trigger node  
  - *Role:* Entry point for incoming WhatsApp messages via webhook  
  - *Config:* Uses configured WhatsApp webhook ID to listen for messages  
  - *Connections:* Outputs to Initialization  
  - *Failure Modes:* Webhook misconfiguration, message format errors, connectivity issues

- **Initialization**  
  - *Type:* Set node  
  - *Role:* Initializes workflow variables and context for the session  
  - *Config:* Likely sets default values or clears previous session data  
  - *Connections:* Outputs to Get Bot Status  
  - *Failure Modes:* Expression errors if variables are misconfigured

- **Get Bot Status**  
  - *Type:* PostgreSQL node  
  - *Role:* Queries the database to retrieve current bot status for the user/session  
  - *Config:* Executes SQL SELECT to fetch status flags or progress indicators  
  - *Connections:* Outputs to Define Flow  
  - *Failure Modes:* DB connection errors, query syntax errors, empty results

- **Define Flow**  
  - *Type:* Switch node  
  - *Role:* Routes the workflow based on bot status and message content to different logical paths  
  - *Config:* Conditions based on status variables and message commands  
  - *Connections:* Outputs to Starts, Commands, or Get Answer nodes  
  - *Failure Modes:* Incorrect condition logic, missing branches

---

#### 2.2 Command Routing & Flow Control

**Overview:**  
This block interprets user commands and controls the main menu navigation, test listing, and test initiation.

**Nodes Involved:**  
- Starts  
- Upsert Bot Status on START  
- Commands  
- Main Menu  
- List?  
- Get Tests  
- Get Tests (duplicate node)  
- Union Number with Question  
- Union list  
- List Tests  
- Get Test  
- Test

**Node Details:**

- **Starts**  
  - *Type:* WhatsApp node  
  - *Role:* Sends initial welcome or start messages to users  
  - *Config:* Uses WhatsApp webhook to send messages  
  - *Connections:* Outputs to Upsert Bot Status on START  
  - *Failure Modes:* Message delivery failures, webhook issues

- **Upsert Bot Status on START**  
  - *Type:* PostgreSQL node  
  - *Role:* Inserts or updates the bot status in the database when a test session starts  
  - *Config:* Uses UPSERT SQL command to maintain status  
  - *Connections:* None (end node for this branch)  
  - *Failure Modes:* DB write errors, constraint violations

- **Commands**  
  - *Type:* Switch node  
  - *Role:* Routes based on user commands received from WhatsApp messages  
  - *Config:* Conditions to differentiate commands like “List Tests”, “Start Test”, etc.  
  - *Connections:* Outputs to Main Menu or List? nodes  
  - *Failure Modes:* Misrouted commands, missing cases

- **Main Menu**  
  - *Type:* WhatsApp node  
  - *Role:* Sends main menu options to the user  
  - *Config:* Predefined menu message via WhatsApp webhook  
  - *Connections:* Outputs to Update Bot Status on START (PostgreSQL node)  
  - *Failure Modes:* Message delivery issues

- **List?**  
  - *Type:* If node  
  - *Role:* Checks if the user requested a test list or another action  
  - *Config:* Condition based on user input text or command  
  - *Connections:* Outputs to Get Tests or Get Tests (duplicate) nodes  
  - *Failure Modes:* Incorrect condition evaluation

- **Get Tests** (two nodes with similar names)  
  - *Type:* PostgreSQL nodes  
  - *Role:* Fetches available tests from the database  
  - *Config:* SQL SELECT queries to retrieve test metadata  
  - *Connections:* Outputs to Union Number with Question or Get Test nodes  
  - *Failure Modes:* DB errors, empty test sets

- **Union Number with Question**  
  - *Type:* Set node  
  - *Role:* Combines question numbers with question text for display or processing  
  - *Config:* Uses expressions to concatenate or format question data  
  - *Connections:* Outputs to Union list node  
  - *Failure Modes:* Expression errors

- **Union list**  
  - *Type:* Summarize node  
  - *Role:* Aggregates list items into a single message or data structure  
  - *Config:* Summarizes test list for sending to user  
  - *Connections:* Outputs to List Tests node  
  - *Failure Modes:* Data aggregation errors

- **List Tests**  
  - *Type:* WhatsApp node  
  - *Role:* Sends the list of available tests to the user  
  - *Config:* Uses WhatsApp webhook to send message  
  - *Connections:* None (end node for this branch)  
  - *Failure Modes:* Message delivery failures

- **Get Test**  
  - *Type:* PostgreSQL node  
  - *Role:* Retrieves detailed test data for a selected test  
  - *Config:* SQL SELECT query filtered by test ID or name  
  - *Connections:* Outputs to Test node  
  - *Failure Modes:* DB errors, missing test data

- **Test**  
  - *Type:* WhatsApp node  
  - *Role:* Sends test questions or instructions to the user  
  - *Config:* Uses WhatsApp webhook to send message  
  - *Connections:* None (end node for this branch)  
  - *Failure Modes:* Message delivery failures

---

#### 2.3 Test Data Management

**Overview:**  
Manages fetching questions and answers, updating user responses, and maintaining bot status during the test lifecycle.

**Nodes Involved:**  
- Get Questions AND Answers  
- Randomize questions  
- Upsert pred Answer  
- Request Answer  
- Update Bot Status on TEST  
- Get Answer  
- Get Question variants  
- Update Answer  
- Get Non-Answered Questions  
- Any questions?  
- Calculate answers  
- Update Bot Status on START (second instance)  
- Update Bot Status on TEST (second instance)

**Node Details:**

- **Get Questions AND Answers**  
  - *Type:* PostgreSQL node  
  - *Role:* Fetches all questions and their possible answers for the current test  
  - *Config:* SQL query joining questions and answers tables  
  - *Connections:* Outputs to Randomize questions  
  - *Failure Modes:* DB errors, incomplete data

- **Randomize questions**  
  - *Type:* Sort node  
  - *Role:* Randomizes the order of questions to prevent predictability  
  - *Config:* Sorts questions randomly each execution  
  - *Connections:* Outputs to Upsert pred Answer  
  - *Failure Modes:* Sorting errors, empty input

- **Upsert pred Answer**  
  - *Type:* PostgreSQL node  
  - *Role:* Inserts or updates a preliminary answer record for the user in the database  
  - *Config:* UPSERT SQL command to track user progress  
  - *Connections:* Outputs to Request Answer  
  - *Failure Modes:* DB write errors

- **Request Answer**  
  - *Type:* WhatsApp node  
  - *Role:* Sends the current question and answer options to the user, requesting input  
  - *Config:* Uses WhatsApp webhook to send message  
  - *Connections:* Outputs to Update Bot Status on TEST  
  - *Failure Modes:* Message delivery failures

- **Update Bot Status on TEST**  
  - *Type:* PostgreSQL node  
  - *Role:* Updates the bot status to reflect progress during the test (e.g., current question number)  
  - *Config:* SQL UPDATE query  
  - *Connections:* None or loops back depending on flow  
  - *Failure Modes:* DB update failures

- **Get Answer**  
  - *Type:* PostgreSQL node  
  - *Role:* Retrieves the user’s answer for the current question  
  - *Config:* SQL SELECT query filtered by user and question  
  - *Connections:* Outputs to Get Question variants  
  - *Failure Modes:* DB errors, missing answers

- **Get Question variants**  
  - *Type:* PostgreSQL node  
  - *Role:* Fetches answer options or variants for the current question  
  - *Config:* SQL SELECT query  
  - *Connections:* Outputs to Update Answer  
  - *Failure Modes:* DB errors

- **Update Answer**  
  - *Type:* PostgreSQL node  
  - *Role:* Updates the user’s answer in the database based on input  
  - *Config:* SQL UPDATE or UPSERT query  
  - *Connections:* Outputs to Get Non-Answered Questions  
  - *Failure Modes:* DB write errors

- **Get Non-Answered Questions**  
  - *Type:* PostgreSQL node  
  - *Role:* Retrieves questions that the user has not yet answered  
  - *Config:* SQL SELECT query filtering unanswered questions  
  - *Connections:* Outputs to Any questions? node  
  - *Failure Modes:* DB errors

- **Any questions?**  
  - *Type:* If node  
  - *Role:* Checks if there are still unanswered questions  
  - *Config:* Condition based on query results count  
  - *Connections:* Outputs to Randomize questions (if yes) or Calculate answers (if no)  
  - *Failure Modes:* Condition logic errors

- **Calculate answers**  
  - *Type:* PostgreSQL node  
  - *Role:* Calculates the user’s score or ranking based on their answers  
  - *Config:* SQL query with scoring logic  
  - *Connections:* Outputs to Result node  
  - *Failure Modes:* DB errors, calculation errors

- **Update Bot Status on START** (second instance)  
  - *Type:* PostgreSQL node  
  - *Role:* Updates bot status after test completion or restart  
  - *Config:* SQL UPDATE query  
  - *Connections:* None  
  - *Failure Modes:* DB update failures

- **Update Bot Status on TEST** (second instance)  
  - *Type:* PostgreSQL node  
  - *Role:* Another update to bot status during test flow  
  - *Config:* SQL UPDATE query  
  - *Connections:* None  
  - *Failure Modes:* DB update failures

---

#### 2.4 User Interaction via WhatsApp

**Overview:**  
Handles all outgoing WhatsApp messages to users, including menus, test questions, answer requests, and final results.

**Nodes Involved:**  
- Starts  
- Main Menu  
- List Tests  
- Test  
- Request Answer  
- Result

**Node Details:**

- **Starts**  
  - See 2.2 for details.

- **Main Menu**  
  - See 2.2 for details.

- **List Tests**  
  - See 2.2 for details.

- **Test**  
  - See 2.2 for details.

- **Request Answer**  
  - See 2.3 for details.

- **Result**  
  - *Type:* WhatsApp node  
  - *Role:* Sends the final test results and ranking to the user  
  - *Config:* Uses WhatsApp webhook to deliver a summary message  
  - *Connections:* Outputs to Update Bot Status on START (second instance)  
  - *Failure Modes:* Message delivery failures

---

### 3. Summary Table

| Node Name                   | Node Type           | Functional Role                          | Input Node(s)                 | Output Node(s)                    | Sticky Note |
|-----------------------------|---------------------|----------------------------------------|------------------------------|----------------------------------|-------------|
| WhatsApp Trigger            | WhatsApp Trigger    | Entry point for incoming WhatsApp msgs | None                         | Initialization                   |             |
| Initialization             | Set                 | Initialize variables/session context   | WhatsApp Trigger             | Get Bot Status                   |             |
| Get Bot Status             | PostgreSQL          | Retrieve current bot status             | Initialization              | Define Flow                     |             |
| Define Flow                | Switch              | Route flow based on status/commands    | Get Bot Status              | Starts, Commands, Get Answer     |             |
| Starts                     | WhatsApp            | Send start/welcome message              | Define Flow                 | Upsert Bot Status on START       |             |
| Upsert Bot Status on START | PostgreSQL          | Insert/update bot status at start       | Starts                      | None                           |             |
| Commands                   | Switch              | Route based on user commands             | Define Flow                 | Main Menu, List?                 |             |
| Main Menu                  | WhatsApp            | Send main menu options                   | Commands                    | Update Bot Status on START       |             |
| List?                      | If                  | Check if user requested test list       | Commands                    | Get Tests, Get Tests (duplicate) |             |
| Get Tests                  | PostgreSQL          | Fetch available tests                    | List?                       | Union Number with Question       |             |
| Get Tests (duplicate)      | PostgreSQL          | Fetch available tests (alternate path) | List?                       | Get Test                        |             |
| Union Number with Question | Set                 | Combine question numbers with text      | Get Tests                   | Union list                      |             |
| Union list                 | Summarize           | Aggregate list for messaging             | Union Number with Question  | List Tests                     |             |
| List Tests                 | WhatsApp            | Send list of tests to user               | Union list                  | None                           |             |
| Get Test                   | PostgreSQL          | Retrieve detailed test data              | Get Tests (duplicate)        | Test                           |             |
| Test                       | WhatsApp            | Send test questions/instructions         | Get Test                    | None                           |             |
| Get Questions AND Answers  | PostgreSQL          | Fetch questions and answers for test     | Test                        | Randomize questions             |             |
| Randomize questions        | Sort                | Randomize question order                  | Get Questions AND Answers   | Upsert pred Answer              |             |
| Upsert pred Answer         | PostgreSQL          | Insert/update preliminary answer record  | Randomize questions         | Request Answer                 |             |
| Request Answer             | WhatsApp            | Send question and request answer         | Upsert pred Answer          | Update Bot Status on TEST        |             |
| Update Bot Status on TEST  | PostgreSQL          | Update bot status during test             | Request Answer              | None                           |             |
| Get Answer                 | PostgreSQL          | Retrieve user’s answer for question       | Define Flow                 | Get Question variants           |             |
| Get Question variants      | PostgreSQL          | Fetch answer options for question          | Get Answer                  | Update Answer                  |             |
| Update Answer              | PostgreSQL          | Update user’s answer in DB                 | Get Question variants       | Get Non-Answered Questions      |             |
| Get Non-Answered Questions | PostgreSQL          | Retrieve unanswered questions               | Update Answer               | Any questions?                 |             |
| Any questions?             | If                  | Check if unanswered questions remain        | Get Non-Answered Questions  | Randomize questions, Calculate answers |             |
| Calculate answers          | PostgreSQL          | Calculate user score/ranking                 | Any questions?              | Result                        |             |
| Result                     | WhatsApp            | Send final results and ranking              | Calculate answers           | Update Bot Status on START       |             |
| Update Bot Status on START | PostgreSQL          | Update bot status after test completion     | Result                      | None                           |             |
| Update Bot Status on TEST  | PostgreSQL          | Update bot status during test (second instance) | Request Answer          | None                           |             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create PostgreSQL Tables**  
   - Use the provided SQL script to create tables for tests, questions, answers, user responses, and bot status.  
   - Replace schema name `n8n` with your actual schema.

2. **Add Credentials in n8n**  
   - Configure WhatsApp OAuth2 credentials with your WhatsApp Business API account.  
   - Configure PostgreSQL credentials with your database connection details.

3. **Create WhatsApp Trigger Node**  
   - Type: WhatsApp Trigger  
   - Configure webhook ID and credentials to receive incoming WhatsApp messages.

4. **Create Initialization Node**  
   - Type: Set  
   - Initialize session variables or context data as needed.

5. **Create Get Bot Status Node**  
   - Type: PostgreSQL  
   - SQL: SELECT current bot status for the user/session.

6. **Create Define Flow Node**  
   - Type: Switch  
   - Conditions based on bot status and incoming message content to route flow to:  
     - Starts node (new session)  
     - Commands node (existing session commands)  
     - Get Answer node (answer processing)

7. **Create Starts Node**  
   - Type: WhatsApp  
   - Send welcome/start message to user.

8. **Create Upsert Bot Status on START Node**  
   - Type: PostgreSQL  
   - UPSERT bot status record indicating session started.

9. **Create Commands Node**  
   - Type: Switch  
   - Branch based on commands like “List Tests” or “Start Test”.

10. **Create Main Menu Node**  
    - Type: WhatsApp  
    - Send main menu options.

11. **Create List? Node**  
    - Type: If  
    - Condition: Check if user requested test list.

12. **Create Get Tests Nodes (two instances)**  
    - Type: PostgreSQL  
    - SQL: SELECT tests metadata.

13. **Create Union Number with Question Node**  
    - Type: Set  
    - Combine question numbers with question text.

14. **Create Union list Node**  
    - Type: Summarize  
    - Aggregate test list for messaging.

15. **Create List Tests Node**  
    - Type: WhatsApp  
    - Send list of tests.

16. **Create Get Test Node**  
    - Type: PostgreSQL  
    - SQL: SELECT detailed test data.

17. **Create Test Node**  
    - Type: WhatsApp  
    - Send test questions or instructions.

18. **Create Get Questions AND Answers Node**  
    - Type: PostgreSQL  
    - SQL: SELECT questions and answers.

19. **Create Randomize questions Node**  
    - Type: Sort  
    - Randomize question order.

20. **Create Upsert pred Answer Node**  
    - Type: PostgreSQL  
    - UPSERT preliminary answer record.

21. **Create Request Answer Node**  
    - Type: WhatsApp  
    - Send question and request answer.

22. **Create Update Bot Status on TEST Node**  
    - Type: PostgreSQL  
    - Update bot status during test.

23. **Create Get Answer Node**  
    - Type: PostgreSQL  
    - Retrieve user answer.

24. **Create Get Question variants Node**  
    - Type: PostgreSQL  
    - Fetch answer options.

25. **Create Update Answer Node**  
    - Type: PostgreSQL  
    - Update user answer.

26. **Create Get Non-Answered Questions Node**  
    - Type: PostgreSQL  
    - Retrieve unanswered questions.

27. **Create Any questions? Node**  
    - Type: If  
    - Check if unanswered questions remain.

28. **Create Calculate answers Node**  
    - Type: PostgreSQL  
    - Calculate score/ranking.

29. **Create Result Node**  
    - Type: WhatsApp  
    - Send final results and ranking.

30. **Create Update Bot Status on START (second instance) Node**  
    - Type: PostgreSQL  
    - Update bot status after test completion.

31. **Create Update Bot Status on TEST (second instance) Node**  
    - Type: PostgreSQL  
    - Update bot status during test (alternate usage).

32. **Connect Nodes According to Workflow Logic**  
    - Follow connections as described in the Summary Table and Block-by-Block Analysis.

33. **Test Workflow**  
    - Verify WhatsApp messages are received and sent correctly.  
    - Confirm database updates and queries operate as expected.

---

### 5. General Notes & Resources

| Note Content                                                                                           | Context or Link                                                                                   |
|------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Setup requires creating PostgreSQL tables with provided SQL script; replace schema `n8n` accordingly | Setup instructions in workflow description                                                      |
| WhatsApp credentials must be configured with OAuth2 for WhatsApp Business API                         | Credential setup section                                                                        |
| Workflow designed for educators and HR teams to automate quiz distribution and ranking                | Workflow purpose and target audience                                                            |
| Customize test questions and bot flow by modifying PostgreSQL data and WhatsApp message content       | Customization instructions                                                                      |
| Workflow includes multiple switch nodes to handle complex routing based on user input and bot status | Logical flow control details                                                                    |

---

This document provides a comprehensive, node-level understanding of the WhatsApp quiz automation workflow integrated with PostgreSQL, enabling reproduction, modification, and troubleshooting.