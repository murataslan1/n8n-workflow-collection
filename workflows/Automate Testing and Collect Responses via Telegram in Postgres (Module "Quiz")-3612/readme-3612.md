Automate Testing and Collect Responses via Telegram in Postgres (Module "Quiz")

https://n8nworkflows.xyz/workflows/automate-testing-and-collect-responses-via-telegram-in-postgres--module--quiz---3612


# Automate Testing and Collect Responses via Telegram in Postgres (Module "Quiz")

### 1. Workflow Overview

This workflow automates the distribution, collection, and scoring of tests (quizzes) via a Telegram bot, storing all data in a Postgres database. It is designed for educators, HR professionals, and others who want to streamline test management and participant response handling.

**Target Use Cases:**  
- Automated quiz/test delivery through Telegram  
- Collection and storage of participant answers in Postgres  
- Dynamic question randomization and scoring  
- Display of participant rankings after test completion  

**Logical Blocks:**

- **1.1 Telegram Interaction & Triggering:** Handles incoming Telegram messages and commands, initializes variables, and routes user inputs.  
- **1.2 Test and Question Retrieval:** Queries Postgres to fetch tests, questions, and answers, including randomization and filtering unanswered questions.  
- **1.3 Test Delivery & Response Collection:** Sends questions to participants via Telegram, waits for answers, updates responses in Postgres, and manages message lifecycle.  
- **1.4 Scoring & Result Presentation:** Calculates scores based on collected answers, updates the database, and sends ranking/results to participants.  
- **1.5 Bot Status & Error Handling:** Updates bot status on start and manages error messages for unsupported commands or failures.  

---

### 2. Block-by-Block Analysis

#### 2.1 Telegram Interaction & Triggering

**Overview:**  
This block receives Telegram messages, initializes workflow variables, and routes input based on user commands or button presses.

**Nodes Involved:**  
- Telegram Trigger  
- Variables TG (Set)  
- Initialization (Set)  
- Is Start? (If)  
- Switch  
- Commands (Switch)  
- Buttons (Switch)  
- Welcome Message (Telegram)  
- Main Menu (Telegram)  
- Error (Telegram)  

**Node Details:**

- **Telegram Trigger**  
  - Type: Telegram Trigger  
  - Role: Entry point for all Telegram user interactions  
  - Configuration: Listens for all messages sent to the bot  
  - Inputs: Telegram webhook events  
  - Outputs: Passes message data downstream  
  - Edge cases: Telegram webhook downtime, malformed messages  

- **Variables TG**  
  - Type: Set  
  - Role: Initializes Telegram-specific variables for processing  
  - Configuration: Sets variables like chat ID, user ID, message text, etc.  
  - Inputs: Telegram Trigger output  
  - Outputs: Enriched data for routing logic  

- **Initialization**  
  - Type: Set  
  - Role: Sets initial flags or variables for workflow control  
  - Configuration: Prepares flags such as "isStart" to detect new sessions  
  - Inputs: Variables TG output  
  - Outputs: Data for conditional routing  

- **Is Start?**  
  - Type: If  
  - Role: Determines if the incoming message is a start command or new session  
  - Configuration: Checks if message text equals "/start" or equivalent  
  - Inputs: Initialization output  
  - Outputs: Routes to Welcome Message or Switch node  

- **Welcome Message**  
  - Type: Telegram  
  - Role: Sends greeting and instructions to new users  
  - Configuration: Predefined welcome text, executed once per session  
  - Inputs: Is Start? true branch  
  - Outputs: None (end of branch)  

- **Switch**  
  - Type: Switch  
  - Role: Routes messages to either command handling or button handling  
  - Configuration: Checks message type or content to decide path  
  - Inputs: Is Start? false branch  
  - Outputs: Commands or Buttons nodes  

- **Commands**  
  - Type: Switch  
  - Role: Handles recognized text commands (e.g., list tests)  
  - Configuration: Matches commands like "/list", "/help", etc.  
  - Inputs: Switch output  
  - Outputs: Get Tests node or Error node for unknown commands  

- **Buttons**  
  - Type: Switch  
  - Role: Handles button presses from Telegram inline keyboards  
  - Configuration: Matches callback data from buttons  
  - Inputs: Switch output  
  - Outputs: Main Menu or For Tests nodes  

- **Main Menu**  
  - Type: Telegram  
  - Role: Sends main menu options to users  
  - Configuration: Predefined menu buttons and text  
  - Inputs: Buttons node output  
  - Outputs: Update Bot Status on start node  

- **Error**  
  - Type: Telegram  
  - Role: Sends error messages for unrecognized commands or failures  
  - Configuration: Static error text  
  - Inputs: Commands node fallback branches  
  - Outputs: None  

**Edge Cases:**  
- Unrecognized commands or buttons trigger error messages  
- Telegram API rate limits or downtime  
- Missing or malformed callback data  

---

#### 2.2 Test and Question Retrieval

**Overview:**  
This block queries the Postgres database to retrieve available tests, specific test details, questions, and answers. It also prepares data for question randomization and filtering unanswered questions.

**Nodes Involved:**  
- Get Tests (Postgres)  
- Union Number with Question (Set)  
- Union list (Summarize)  
- Get Test (Postgres)  
- Get Questions AND Answers (Postgres)  
- Get Non-Answered Questions (Postgres)  

**Node Details:**

- **Get Tests**  
  - Type: Postgres  
  - Role: Fetches list of available tests from the database  
  - Configuration: SQL query selecting test metadata from the tests table  
  - Inputs: Commands or For Tests nodes  
  - Outputs: List of tests for user selection  

- **Union Number with Question**  
  - Type: Set  
  - Role: Combines question numbering with question text for display  
  - Configuration: Adds sequence numbers or formatting to questions  
  - Inputs: Get Tests output  
  - Outputs: Data formatted for summarization  

- **Union list**  
  - Type: Summarize  
  - Role: Aggregates question data into a single list or string  
  - Configuration: Concatenates question entries for message display  
  - Inputs: Union Number with Question output  
  - Outputs: Prepared message content for Telegram  

- **Get Test**  
  - Type: Postgres  
  - Role: Retrieves detailed test data including test ID and metadata  
  - Configuration: SQL query filtered by selected test ID  
  - Inputs: For Tests node  
  - Outputs: Test details for question retrieval  

- **Get Questions AND Answers**  
  - Type: Postgres  
  - Role: Fetches all questions and corresponding answers for a test  
  - Configuration: SQL join query on questions and answers tables filtered by test ID  
  - Inputs: Test node output  
  - Outputs: Full question and answer dataset  

- **Get Non-Answered Questions**  
  - Type: Postgres  
  - Role: Retrieves questions not yet answered by the participant  
  - Configuration: SQL query filtering out answered questions for the user  
  - Inputs: Update Answer node output  
  - Outputs: List of remaining questions to ask  

**Edge Cases:**  
- Empty test or question sets (no tests or questions in DB)  
- Database connection or query errors  
- Participant with no unanswered questions (test completion)  

---

#### 2.3 Test Delivery & Response Collection

**Overview:**  
This block manages sending questions to participants via Telegram, waiting for their responses, updating answers in the database, and cleaning up messages.

**Nodes Involved:**  
- Test (Telegram)  
- Randomize questions (Sort)  
- Code (Code)  
- Variables (Set)  
- Merge (Merge)  
- Upsert pred Answer (Postgres)  
- Question (Telegram)  
- Wait (Wait)  
- Delete message (Telegram)  
- Update Answer (Postgres)  

**Node Details:**

- **Test**  
  - Type: Telegram  
  - Role: Sends the initial test message or instructions to the participant  
  - Configuration: Uses webhook to send message once per test start  
  - Inputs: Get Test output  
  - Outputs: Triggers question retrieval  

- **Randomize questions**  
  - Type: Sort  
  - Role: Randomizes question order to vary test delivery  
  - Configuration: Sorts questions randomly  
  - Inputs: Get Questions AND Answers output  
  - Outputs: Randomized question list  

- **Code**  
  - Type: Code  
  - Role: Custom JavaScript to format questions or prepare variables  
  - Configuration: Executes once to process randomized questions  
  - Inputs: Randomize questions output  
  - Outputs: Processed question data  

- **Variables**  
  - Type: Set  
  - Role: Sets variables related to question numbering, user state, or session data  
  - Configuration: Executes once with static or derived values  
  - Inputs: Randomize questions output  
  - Outputs: Data for merging  

- **Merge**  
  - Type: Merge  
  - Role: Combines processed question data and variables for answer upsert  
  - Configuration: Merges multiple inputs into one dataset  
  - Inputs: Code and Variables outputs  
  - Outputs: Data for database update  

- **Upsert pred Answer**  
  - Type: Postgres  
  - Role: Inserts or updates participant's predicted answer in the database  
  - Configuration: SQL UPSERT (insert or update) query on answers table  
  - Inputs: Merge output  
  - Outputs: Confirmation of database update  

- **Question**  
  - Type: Telegram  
  - Role: Sends individual questions to the participant via Telegram  
  - Configuration: Executes once per question, uses webhook  
  - Inputs: Upsert pred Answer output  
  - Outputs: Wait node trigger  

- **Wait**  
  - Type: Wait  
  - Role: Pauses workflow to allow participant to answer before proceeding  
  - Configuration: Waits for Telegram webhook callback or timeout  
  - Inputs: Question output  
  - Outputs: Delete message node trigger  

- **Delete message**  
  - Type: Telegram  
  - Role: Deletes the question message after answer is received or timeout  
  - Configuration: Uses Telegram API to delete message by message ID  
  - Inputs: Wait output  
  - Outputs: None  

- **Update Answer**  
  - Type: Postgres  
  - Role: Updates the participant's answer record in the database after response  
  - Configuration: SQL UPDATE query on answers table  
  - Inputs: For Tests node output  
  - Outputs: Get Non-Answered Questions node trigger  

**Edge Cases:**  
- Participant does not answer within wait time (timeout)  
- Telegram message deletion fails (message already deleted or permissions)  
- Database update conflicts or failures  
- Code node errors due to unexpected data format  

---

#### 2.4 Scoring & Result Presentation

**Overview:**  
Calculates participant scores based on collected answers, updates the database, and sends the final test results and ranking via Telegram.

**Nodes Involved:**  
- Any questions? (If)  
- Calculate answers (Postgres)  
- Result Test (Telegram)  

**Node Details:**

- **Any questions?**  
  - Type: If  
  - Role: Checks if there are any remaining questions unanswered  
  - Configuration: Conditional on Get Non-Answered Questions output  
  - Inputs: Get Non-Answered Questions output  
  - Outputs: Randomize questions (continue test) or Calculate answers (finish test)  

- **Calculate answers**  
  - Type: Postgres  
  - Role: Runs SQL queries to calculate participant's score and ranking  
  - Configuration: Aggregation queries on answers and tests tables  
  - Inputs: Any questions? false branch  
  - Outputs: Result Test node trigger  

- **Result Test**  
  - Type: Telegram  
  - Role: Sends final score and ranking message to participant  
  - Configuration: Uses Telegram webhook to send message once  
  - Inputs: Calculate answers output  
  - Outputs: None (end of test)  

**Edge Cases:**  
- Calculation errors due to missing or inconsistent data  
- Telegram message sending failure  
- Participant finishes test with no answers (empty test)  

---

#### 2.5 Bot Status & Error Handling

**Overview:**  
Updates the bot's status on start and handles error messages for unsupported commands or unexpected failures.

**Nodes Involved:**  
- Update Bot Status on start (Postgres)  
- Error (Telegram)  

**Node Details:**

- **Update Bot Status on start**  
  - Type: Postgres  
  - Role: Updates a status record in the database indicating bot is active  
  - Configuration: SQL UPDATE or INSERT query executed on main menu display  
  - Inputs: Main Menu node output  
  - Outputs: None  

- **Error**  
  - Type: Telegram  
  - Role: Sends error messages to users for invalid commands or failures  
  - Configuration: Static error text, executed once per error event  
  - Inputs: Commands node fallback branches  
  - Outputs: None  

**Edge Cases:**  
- Database connectivity issues preventing status update  
- Telegram API errors sending error messages  

---

### 3. Summary Table

| Node Name                  | Node Type           | Functional Role                          | Input Node(s)                 | Output Node(s)                  | Sticky Note                          |
|----------------------------|---------------------|----------------------------------------|------------------------------|--------------------------------|------------------------------------|
| Telegram Trigger            | Telegram Trigger    | Entry point for Telegram messages      |                              | Variables TG                   |                                    |
| Variables TG               | Set                 | Initializes Telegram variables          | Telegram Trigger             | Initialization                 |                                    |
| Initialization             | Set                 | Sets initial flags                      | Variables TG                 | Is Start?                     |                                    |
| Is Start?                  | If                  | Checks if message is start command      | Initialization               | Welcome Message, Switch        |                                    |
| Welcome Message            | Telegram            | Sends welcome message                   | Is Start?                    |                              |                                    |
| Switch                    | Switch              | Routes to commands or buttons           | Is Start?                    | Commands, Buttons              |                                    |
| Commands                  | Switch              | Handles text commands                    | Switch                      | Get Tests, Error               |                                    |
| Buttons                   | Switch              | Handles button presses                   | Switch                      | Main Menu, For Tests           |                                    |
| Main Menu                 | Telegram            | Sends main menu                         | Buttons                     | Update Bot Status on start     |                                    |
| Update Bot Status on start | Postgres            | Updates bot status in DB                 | Main Menu                   |                              |                                    |
| Error                     | Telegram            | Sends error messages                    | Commands                    |                              |                                    |
| Get Tests                 | Postgres            | Retrieves list of tests                  | Commands, For Tests          | Union Number with Question     |                                    |
| Union Number with Question | Set                 | Adds numbering to questions              | Get Tests                   | Union list                    |                                    |
| Union list                | Summarize           | Aggregates question list                 | Union Number with Question   | List tests                   |                                    |
| List tests                | Telegram            | Sends list of tests                      | Union list                  |                              |                                    |
| For Tests                 | Switch              | Routes test flow                         | Buttons                     | Get Tests, Get Test, Update Answer |                                    |
| Get Test                  | Postgres            | Retrieves test details                   | For Tests                   | Test                         |                                    |
| Test                      | Telegram            | Sends test start message                 | Get Test                    | Get Questions AND Answers      |                                    |
| Get Questions AND Answers | Postgres            | Retrieves questions and answers          | Test                        | Randomize questions           |                                    |
| Randomize questions       | Sort                | Randomizes question order                 | Get Questions AND Answers   | Code, Variables               |                                    |
| Code                      | Code                | Formats questions                         | Randomize questions         | Merge                        |                                    |
| Variables                 | Set                 | Sets question numbering and session vars | Randomize questions         | Merge                        |                                    |
| Merge                     | Merge               | Combines question data and variables     | Code, Variables             | Upsert pred Answer            |                                    |
| Upsert pred Answer        | Postgres            | Inserts/updates participant answers      | Merge                       | Question                     |                                    |
| Question                  | Telegram            | Sends individual question                 | Upsert pred Answer          | Wait                        |                                    |
| Wait                      | Wait                | Waits for participant response           | Question                    | Delete message               |                                    |
| Delete message            | Telegram            | Deletes question message                  | Wait                       |                              |                                    |
| Update Answer             | Postgres            | Updates answer record after response      | For Tests                   | Get Non-Answered Questions    |                                    |
| Get Non-Answered Questions| Postgres            | Retrieves unanswered questions            | Update Answer               | Any questions?                |                                    |
| Any questions?            | If                  | Checks if unanswered questions remain     | Get Non-Answered Questions  | Randomize questions, Calculate answers |                                    |
| Calculate answers         | Postgres            | Calculates participant score and ranking | Any questions?              | Result Test                  |                                    |
| Result Test               | Telegram            | Sends final test results and ranking      | Calculate answers           |                              |                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger node**  
   - Type: Telegram Trigger  
   - Configure webhook to receive all messages from your Telegram bot  

2. **Create Variables TG (Set) node**  
   - Connect from Telegram Trigger  
   - Set variables: chat ID, user ID, message text, callback data, etc.  

3. **Create Initialization (Set) node**  
   - Connect from Variables TG  
   - Set initial flags such as `isStart` based on message text (`/start`)  

4. **Create Is Start? (If) node**  
   - Connect from Initialization  
   - Condition: message text equals `/start` or equivalent start command  

5. **Create Welcome Message (Telegram) node**  
   - Connect from Is Start? true branch  
   - Configure message text welcoming the user and instructions  

6. **Create Switch node**  
   - Connect from Is Start? false branch  
   - Configure to route messages to either Commands or Buttons based on message type or content  

7. **Create Commands (Switch) node**  
   - Connect from Switch node  
   - Add cases for recognized commands (e.g., `/list`)  
   - Default case routes to Error node  

8. **Create Buttons (Switch) node**  
   - Connect from Switch node  
   - Add cases for button callback data (e.g., main menu, start test)  

9. **Create Main Menu (Telegram) node**  
   - Connect from Buttons node (main menu case)  
   - Configure message with inline keyboard for menu options  

10. **Create Update Bot Status on start (Postgres) node**  
    - Connect from Main Menu  
    - Configure SQL to update bot status in your Postgres database  

11. **Create Error (Telegram) node**  
    - Connect from Commands node default case  
    - Configure static error message for unrecognized commands  

12. **Create Get Tests (Postgres) node**  
    - Connect from Commands node (e.g., `/list` command) and For Tests node  
    - Configure SQL to select available tests  

13. **Create Union Number with Question (Set) node**  
    - Connect from Get Tests  
    - Add numbering or formatting to test list entries  

14. **Create Union list (Summarize) node**  
    - Connect from Union Number with Question  
    - Aggregate list entries into a single string for display  

15. **Create List tests (Telegram) node**  
    - Connect from Union list  
    - Send the list of tests to the user  

16. **Create For Tests (Switch) node**  
    - Connect from Buttons node (start test case)  
    - Configure to route to Get Tests, Get Test, or Update Answer nodes  

17. **Create Get Test (Postgres) node**  
    - Connect from For Tests  
    - Configure SQL to fetch selected test details  

18. **Create Test (Telegram) node**  
    - Connect from Get Test  
    - Send test start message to participant  

19. **Create Get Questions AND Answers (Postgres) node**  
    - Connect from Test  
    - Configure SQL to fetch all questions and answers for the test  

20. **Create Randomize questions (Sort) node**  
    - Connect from Get Questions AND Answers  
    - Configure to randomize question order  

21. **Create Code (Code) node**  
    - Connect from Randomize questions  
    - Write JavaScript to format questions or prepare variables  

22. **Create Variables (Set) node**  
    - Connect from Randomize questions  
    - Set question numbering and session variables  

23. **Create Merge node**  
    - Connect from Code and Variables nodes  
    - Merge data streams for answer upsert  

24. **Create Upsert pred Answer (Postgres) node**  
    - Connect from Merge  
    - Configure SQL UPSERT to insert or update participant answer  

25. **Create Question (Telegram) node**  
    - Connect from Upsert pred Answer  
    - Send individual question to participant  

26. **Create Wait (Wait) node**  
    - Connect from Question  
    - Configure to wait for participant response or timeout  

27. **Create Delete message (Telegram) node**  
    - Connect from Wait  
    - Configure to delete question message after response or timeout  

28. **Create Update Answer (Postgres) node**  
    - Connect from For Tests  
    - Configure SQL UPDATE to record participant's answer  

29. **Create Get Non-Answered Questions (Postgres) node**  
    - Connect from Update Answer  
    - Configure SQL to fetch questions not yet answered by participant  

30. **Create Any questions? (If) node**  
    - Connect from Get Non-Answered Questions  
    - Condition: check if unanswered questions exist  

31. **Connect Any questions? true branch to Randomize questions**  
    - Continue test with next question  

32. **Create Calculate answers (Postgres) node**  
    - Connect from Any questions? false branch  
    - Configure SQL to calculate final score and ranking  

33. **Create Result Test (Telegram) node**  
    - Connect from Calculate answers  
    - Send final score and ranking to participant  

---

### 5. General Notes & Resources

| Note Content                                                                                                                      | Context or Link                                                                                     |
|-----------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| Replace `"n8n"` in the provided SQL script with your actual Postgres schema name before running the setup scripts.               | Setup instructions                                                                                |
| Ensure Telegram and Postgres credentials are properly configured in n8n credentials section before activating the workflow.       | Credential setup                                                                                   |
| Customize Telegram bot messages and inline keyboards to match your branding and tone.                                             | Workflow customization                                                                             |
| The workflow uses PostgreSQL UPSERT queries; ensure your Postgres version supports this feature (Postgres 9.5+).                 | Database compatibility                                                                             |
| For detailed Telegram bot setup and webhook configuration, refer to Telegram Bot API documentation: https://core.telegram.org/bots/api | External resource                                                                                  |
| The workflow includes retry and error handling for Telegram nodes to manage API rate limits and message failures gracefully.    | Reliability considerations                                                                        |

---

This document provides a comprehensive reference to understand, reproduce, and modify the "Automate Testing and Collect Responses via Telegram in Postgres (Module 'Quiz')" workflow in n8n. It covers all nodes, their roles, configurations, and integration points, enabling advanced users and automation agents to work confidently with this workflow.