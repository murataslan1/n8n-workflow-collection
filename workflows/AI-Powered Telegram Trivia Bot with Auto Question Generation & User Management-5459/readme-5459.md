AI-Powered Telegram Trivia Bot with Auto Question Generation & User Management

https://n8nworkflows.xyz/workflows/ai-powered-telegram-trivia-bot-with-auto-question-generation---user-management-5459


# AI-Powered Telegram Trivia Bot with Auto Question Generation & User Management

### 1. Workflow Overview

This workflow implements an **AI-powered Telegram Trivia Bot** that automatically generates trivia questions daily, manages user states and scores, processes user answers, and provides interactive command responses. It targets trivia game enthusiasts and Telegram bot developers seeking a scalable trivia experience with user management and dynamic question generation.

The workflow comprises the following logical blocks:

- **1.1 Telegram Message Reception & User Management:** Receives messages, parses user data, checks and creates user records, and merges data for downstream processing.
- **1.2 Command Processing & Routing:** Detects if incoming messages are commands, routes them to handlers for known commands or proceeds to answer validation.
- **1.3 Trivia Question Delivery:** Retrieves and formats trivia questions for users, ensuring no repeats of correctly answered questions.
- **1.4 Answer Validation & Scoring:** Validates user answers, compares with correct answers, updates user scores, and records answer history.
- **1.5 Leaderboard & Statistics:** Aggregates user scores for leaderboard display and provides user-specific statistics.
- **1.6 AI Question Generation:** Scheduled daily job to generate fresh trivia questions per category using OpenAI GPT-4O-Mini.
- **1.7 Response Delivery:** Sends formatted responses back to users via Telegram with markdown and emojis.
- **1.8 Data Integrity & State Management:** Maintains user game states and prevents invalid interactions.

---

### 2. Block-by-Block Analysis

#### 1.1 Telegram Message Reception & User Management

**Overview:**  
Handles all incoming Telegram messages via webhook, extracts user and message data, verifies or creates user profiles in the database, and prepares merged user data for subsequent processing.

**Nodes Involved:**  
- Telegram Trigger  
- Parse Telegram Data  
- Check Existing User  
- User Exists? (If node)  
- Create New User  
- Merge User Data  

**Node Details:**

- **Telegram Trigger**  
  - Type: Telegram Trigger  
  - Role: Receives Telegram messages (updates of type "message") via webhook.  
  - Credentials: Telegram API credentials for TriviaBot.  
  - Output: Raw Telegram message JSON.  
  - Failure: Possible webhook or connectivity issues.  

- **Parse Telegram Data**  
  - Type: Code Node  
  - Role: Parses Telegram message to extract user info, chat ID, message text, and detects commands.  
  - Key variables: `message_type`, `command`, `text`, `user` object.  
  - Input: Telegram message JSON.  
  - Output: Structured JSON with user and message details, command flags.  
  - Edge Cases: Messages without text, malformed input.  

- **Check Existing User**  
  - Type: NocoDB Node (getAll)  
  - Role: Queries Users table to check if user exists by telegram_id.  
  - Parameters: Filter on telegram_id matching parsed user telegram_id.  
  - Credentials: NocoDB API token.  
  - Output: User record if found.  
  - Failures: Database connection issues, query errors.  

- **User Exists?**  
  - Type: If Node  
  - Role: Checks if existing user record found (based on presence of Id field).  
  - Output: True branch if user exists, False branch if not.  

- **Create New User**  
  - Type: NocoDB Node (create)  
  - Role: Creates new user record with initial stats (score=0, games_played=0, correct_answers=0, game_state='idle').  
  - Input: User data from parsed Telegram message.  
  - Credentials: NocoDB API token.  
  - Notes: Creates user only if not found before.  
  - Edge Cases: Duplicate entries, database failures.  

- **Merge User Data**  
  - Type: Code Node  
  - Role: Combines user data from existing user or newly created user with parsed Telegram data for downstream use.  
  - Logic: Prioritizes existing user data, else new user data, else initializes default minimal user data.  
  - Output: Unified JSON with user_data and message info.  

---

#### 1.2 Command Processing & Routing

**Overview:**  
Determines if the incoming message is a command, routes to specific command handlers or proceeds to answer validation.

**Nodes Involved:**  
- Is Command? (If node)  
- Command Router (Switch node)  
- Handle Basic Commands  

**Node Details:**

- **Is Command?**  
  - Type: If Node  
  - Role: Checks if message is a Telegram command (boolean flag from parsing node).  
  - Output: True branch routes to Command Router; False branch routes to answer validation.  

- **Command Router**  
  - Type: Switch Node  
  - Role: Routes commands to corresponding handlers based on command string (`/start`, `/help`, `/score`, `/stats`, `/question`, `/leaderboard`).  
  - Output branches direct to either command handlers or question/leaderboard flows.  
  - Edge Cases: Unknown commands handled in default case.  

- **Handle Basic Commands**  
  - Type: Code Node  
  - Role: Generates textual responses for commands with markdown and emojis, including welcome, help, score, stats, and unknown command messages.  
  - Inputs: command string, user data.  
  - Outputs: chat_id and response_text for Telegram node.  
  - Edge Cases: Missing user stats, unknown commands.  

---

#### 1.3 Trivia Question Delivery

**Overview:**  
Delivers trivia questions to users, ensuring questions are fresh and not repeated if previously answered correctly.

**Nodes Involved:**  
- Get User History  
- Aggregate1  
- Get Random Question  
- Format Question  
- Update User Game State  

**Node Details:**

- **Get User History**  
  - Type: NocoDB Node (getAll)  
  - Role: Retrieves all questions the user has answered (user question history).  
  - Filter: Matches user_telegram_id to current user.  
  - Output: List of question IDs answered by user.  
  - Failures: DB connectivity.  

- **Aggregate1**  
  - Type: Aggregate Node  
  - Role: Extracts all question_id fields from user history for exclusion.  
  - Output: Aggregated list of answered question IDs.  

- **Get Random Question**  
  - Type: NocoDB Node (getAll with limit 1)  
  - Role: Queries Questions table for a random question excluding previously answered questions by the user.  
  - Filter: Uses `nanyof` operator with excluded question IDs.  
  - Output: Single question record.  
  - Edge Cases: No questions left (empty result).  

- **Format Question**  
  - Type: Code Node  
  - Role: Formats the fetched question into a user-friendly markdown trivia question with options A-D, difficulty info, and reply instructions.  
  - Output: Chat ID, response text, question data, and user data.  
  - Edge Cases: No question returned (fallback message).  

- **Update User Game State**  
  - Type: NocoDB Node (update)  
  - Role: Updates the user's game_state to "waiting_answer" and sets current_question_id in Users table.  
  - Input: user telegram_id and question Id.  
  - Failures: DB update errors.  

---

#### 1.4 Answer Validation & Scoring

**Overview:**  
Validates user answers, checks correctness, calculates points, updates user stats and question history, and provides feedback.

**Nodes Involved:**  
- Valid Answer? (If node)  
- Get Current Question  
- Process Answer  
- Update User Stats  
- Mark Question As Answered  

**Node Details:**

- **Valid Answer?**  
  - Type: If Node  
  - Role: Checks if user response is a single character A/B/C/D and if user is in "waiting_answer" state.  
  - Output: True branch processes answer; False branch triggers unknown text handler.  
  - Edge Cases: Invalid answers, responses when no question active.  

- **Get Current Question**  
  - Type: NocoDB Node (get by Id)  
  - Role: Retrieves the current question data using user's current_question_id.  
  - Output: Question record.  

- **Process Answer**  
  - Type: Code Node  
  - Role: Compares user answer to correct answer, determines correctness, calculates points based on difficulty, and constructs feedback message with explanation.  
  - Output: Chat ID, response text, is_correct flag, points earned, user data, question data.  
  - Edge Cases: No current question present.  

- **Update User Stats**  
  - Type: NocoDB Node (update)  
  - Role: Updates Users table with new score, increments games_played and correct_answers as appropriate, resets game_state to "idle".  
  - Input: User Id and computed fields.  

- **Mark Question As Answered**  
  - Type: NocoDB Node (create)  
  - Role: Logs the user's answer in User Question History table with correctness, timestamp, and points earned.  
  - Ensures history tracking for preventing repeats.  

---

#### 1.5 Leaderboard & Statistics

**Overview:**  
Aggregates user scores to display a leaderboard, highlights current user's position, and formats user stats responses.

**Nodes Involved:**  
- Get Leaderboard  
- Aggregate  
- Format Leaderboard  

**Node Details:**

- **Get Leaderboard**  
  - Type: NocoDB Node (getAll with limit 10)  
  - Role: Retrieves top 10 users sorted by score descending.  

- **Aggregate**  
  - Type: Aggregate Node  
  - Role: Combines retrieved leaderboard data into a single array field `leaderboard` for formatting.  

- **Format Leaderboard**  
  - Type: Code Node  
  - Role: Formats leaderboard text with medals for top 3, marks current user with "← YOU", and shows rank if outside top 10 or no ranking.  
  - Output: Chat ID, response text for Telegram.  

---

#### 1.6 AI Question Generation

**Overview:**  
Scheduled daily trigger invokes an OpenAI node generating 5 trivia questions per category, storing them into the Questions database table.

**Nodes Involved:**  
- Daily Question Generator (Schedule Trigger)  
- Get Possible Categories (Code)  
- OpenAI (GPT-4O-Mini)  
- NocoDB (create)  
- Send New Questions Available Notification  

**Node Details:**

- **Daily Question Generator**  
  - Type: Schedule Trigger  
  - Role: Runs once daily to start question generation.  

- **Get Possible Categories**  
  - Type: Code Node  
  - Role: Defines fixed list of trivia categories and prepares generation requests per category.  

- **OpenAI**  
  - Type: OpenAI Node (Langchain integration)  
  - Role: Generates 5 trivia questions per category based on prompt with JSON output format, including question, options, correct answer, difficulty (1-5), explanation.  
  - Model: GPT-4O-Mini (cost-effective).  
  - Edge Cases: API rate limits, response formatting errors.  

- **NocoDB**  
  - Type: NocoDB Tool Node (create)  
  - Role: Saves generated questions into Questions table in database.  
  - Fields mapped from OpenAI JSON response.  

- **Send New Questions Available Notification**  
  - Type: Telegram Node  
  - Role: Optionally notifies users that new questions are available (sent to current user's chat_id, can be customized).  

---

#### 1.7 Response Delivery

**Overview:**  
Sends all bot responses to users on Telegram with markdown formatting and emoji support.

**Nodes Involved:**  
- Telegram Node (multiple instances connected from various response generators)  

**Node Details:**

- **Telegram**  
  - Type: Telegram Node  
  - Role: Sends messages to user chat_id with markdown parse mode.  
  - Inputs: `chatId`, `text` (response_text), optional markdown parse mode.  
  - Failures: Telegram API errors, invalid chat IDs.  

---

#### 1.8 Data Integrity & State Management

**Overview:**  
Maintains accurate user states and prevents invalid input sequences, ensuring smooth gameplay and data consistency.

**Nodes Involved:**  
- Update User Game State  
- Game State Management (sticky note documentation)  

**Node Details:**

- **Update User Game State**  
  - Sets user's `game_state` to "waiting_answer" when question is sent, and resets to "idle" after answer processed.  
  - Tracks current question ID for user.  

- **Game State Management** (Documentation)  
  - Defines states: `idle`, `waiting_answer`.  
  - Tracks question progress and prevents invalid transitions or answer submissions when no question active.  

---

### 3. Summary Table

| Node Name                          | Node Type               | Functional Role                         | Input Node(s)                 | Output Node(s)                       | Sticky Note                                                                                  |
|-----------------------------------|-------------------------|---------------------------------------|------------------------------|------------------------------------|----------------------------------------------------------------------------------------------|
| Telegram Trigger                  | Telegram Trigger        | Receives Telegram messages             | —                            | Parse Telegram Data                 | Message Processing: Telegram webhook receives message; user parsing, state management        |
| Parse Telegram Data               | Code                    | Parses user and message data           | Telegram Trigger             | Check Existing User                 | Message Processing                                                                          |
| Check Existing User               | NocoDB                  | Checks if user exists in DB             | Parse Telegram Data          | User Exists?                       | Message Processing                                                                          |
| User Exists?                     | If                      | Branches based on user existence        | Check Existing User          | Create New User, Merge User Data    | Message Processing                                                                          |
| Create New User                  | NocoDB                  | Creates new user record                  | User Exists?                 | Merge User Data                    | Message Processing                                                                          |
| Merge User Data                 | Code                    | Merges existing or new user data        | User Exists?, Create New User| Is Command?                       | Message Processing                                                                          |
| Is Command?                     | If                      | Detects if message is a command         | Merge User Data              | Command Router, Valid Answer?      | Message Processing                                                                          |
| Command Router                 | Switch                  | Routes commands to appropriate handlers | Is Command?                  | Handle Basic Commands, Get User History, Get Leaderboard, etc. | Message Processing                                                                          |
| Handle Basic Commands           | Code                    | Generates responses for commands         | Command Router               | Telegram                          | Response System                                                                            |
| Get User History                | NocoDB                  | Retrieves user's answered questions      | Command Router (/question)   | Aggregate1                       | Smart Question System                                                                      |
| Aggregate1                     | Aggregate               | Aggregates answered question IDs         | Get User History             | Get Random Question               | Smart Question System                                                                      |
| Get Random Question             | NocoDB                  | Selects a random unused question         | Aggregate1                  | Format Question, Update User Game State | Smart Question System                                                                      |
| Format Question                | Code                    | Formats question text for user             | Get Random Question          | Merge                           | Smart Question System                                                                      |
| Update User Game State         | NocoDB                  | Updates user state to waiting_answer       | Get Random Question          | Merge                           | Game State Management                                                                     |
| Merge                         | Merge                   | Combines data for Telegram node            | Format Question, Update User Game State | Telegram                      | Response System                                                                            |
| Valid Answer?                 | If                      | Validates answer format and state          | Is Command?                  | Get Current Question, Handle Unknown Text | Answer Processing                                                                         |
| Get Current Question           | NocoDB                  | Fetches current question by ID              | Valid Answer?                | Process Answer                   | Answer Processing                                                                         |
| Process Answer                | Code                    | Checks answer correctness and feedback      | Get Current Question         | Merge1, Update User Stats, Mark Question As Answered | Answer Processing                                                                         |
| Merge1                       | Merge                   | Combines outputs for Telegram node          | Process Answer, Update User Stats | Telegram                      | Response System                                                                            |
| Update User Stats             | NocoDB                  | Updates user score and stats                  | Process Answer              | Merge1                         | Answer Processing                                                                         |
| Mark Question As Answered    | NocoDB                  | Logs user's answer in history                 | Process Answer              | Merge1                         | History Tracking System                                                                   |
| Handle Unknown Text          | Code                    | Responds to invalid inputs or commands       | Valid Answer?                | Telegram                      | Response System                                                                            |
| Telegram                    | Telegram Node           | Sends messages to users                      | Handle Basic Commands, Merge, Format Leaderboard, Merge1, Handle Unknown Text | —                              | Response System                                                                            |
| Get Leaderboard              | NocoDB                  | Retrieves top 10 users by score              | Command Router (/leaderboard) | Aggregate                    | Leaderboard System                                                                        |
| Aggregate                   | Aggregate               | Aggregates leaderboard data                   | Get Leaderboard              | Format Leaderboard             | Leaderboard System                                                                        |
| Format Leaderboard          | Code                    | Formats leaderboard text for display           | Aggregate                   | Telegram                      | Leaderboard System                                                                        |
| Daily Question Generator     | Schedule Trigger        | Triggers daily AI question generation          | —                          | Get Possible Categories         | AI Generation System                                                                     |
| Get Possible Categories      | Code                    | Prepares categories for AI generation           | Daily Question Generator     | OpenAI                        | AI Generation System                                                                     |
| OpenAI                      | OpenAI Node             | Generates trivia questions via GPT-4O-Mini      | Get Possible Categories      | NocoDB (create)                | AI Generation System                                                                     |
| NocoDB (Questions create)    | NocoDB Tool             | Saves AI-generated questions to DB             | OpenAI                      | —                            | AI Generation System                                                                     |
| Send New Questions Available Notification | Telegram Node | Notifies users about new questions            | OpenAI                      | —                            | AI Generation System                                                                     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node**  
   - Set up Telegram API credentials for your bot.  
   - Configure to listen for "message" update type.  
   - Connect webhook.

2. **Add Code Node "Parse Telegram Data"**  
   - Extract user info, message text, chat ID, and detect if message is a command starting with '/'.  
   - Output structured JSON with `message_type`, `command`, `text`, `user`, and `is_command`.  
   - Connect from Telegram Trigger.

3. **Add NocoDB Node "Check Existing User"**  
   - Use NocoDB credentials.  
   - Query Users table filtering by telegram_id from parsed data.  
   - Limit 1.  
   - Connect from Parse Telegram Data.

4. **Add If Node "User Exists?"**  
   - Condition: Check if result contains user Id (exists).  
   - True branch to Merge User Data, False branch to Create New User.

5. **Add NocoDB Node "Create New User"**  
   - Create record in Users table with telegram_id, username, first_name, last_name, score=0, games_played=0, correct_answers=0, game_state='idle'.  
   - Credentials: NocoDB token.  
   - Connect from False branch of User Exists?.

6. **Add Code Node "Merge User Data"**  
   - Merge user data from existing user or newly created user with parsed Telegram data.  
   - Output combined data for downstream logic.  
   - Connect from User Exists? True and Create New User.

7. **Add If Node "Is Command?"**  
   - Condition: Check `is_command` boolean in merged data.  
   - True branch to Command Router, False branch to Valid Answer?.

8. **Add Switch Node "Command Router"**  
   - Add routes for `/start`, `/help`, `/score`, `/stats`, `/question`, `/leaderboard`.  
   - Unknown commands go to default.  
   - Connect True branch from Is Command?.

9. **Add Code Node "Handle Basic Commands"**  
   - For each command, generate markdown response text with user-friendly messages and stats.  
   - Output chat_id and response_text.  
   - Connect all command routes here.

10. **Add NocoDB Node "Get User History"**  
    - Retrieve all question history for user telegram_id.  
    - Used for `/question` command.  
    - Connect from `/question` route in Command Router.

11. **Add Aggregate Node "Aggregate1"**  
    - Extract `question_id` from history results to exclude answered questions.  
    - Connect from Get User History.

12. **Add NocoDB Node "Get Random Question"**  
    - Select one question excluding answered ones (using `nanyof` operator with aggregated question IDs).  
    - Connect from Aggregate1.

13. **Add Code Node "Format Question"**  
    - Format question text with options A-D and difficulty.  
    - Output chat_id, response_text, question_data, user_data.  
    - Connect from Get Random Question.

14. **Add NocoDB Node "Update User Game State"**  
    - Update Users table: set game_state='waiting_answer', current_question_id=question Id.  
    - Connect from Get Random Question.

15. **Add Merge Node "Merge"**  
    - Combine outputs from Format Question and Update User Game State.  
    - Connect Format Question and Update User Game State to Merge.

16. **Add Telegram Node**  
    - Send message with `chatId` and `text` from merged node.  
    - Use Markdown parse mode.  
    - Connect from Merge and from Handle Basic Commands.

17. **Add If Node "Valid Answer?"**  
    - Validate if text is one of A/B/C/D and user in "waiting_answer" state.  
    - True branch to Get Current Question, False branch to Handle Unknown Text.  
    - Connect from Is Command? False branch.

18. **Add NocoDB Node "Get Current Question"**  
    - Retrieve question by user_data.current_question_id.  
    - Connect from Valid Answer? True branch.

19. **Add Code Node "Process Answer"**  
    - Compare user answer to correct answer, calculate points by difficulty, create feedback message.  
    - Output chat_id, response_text, is_correct, points_earned, user_data.  
    - Connect from Get Current Question.

20. **Add NocoDB Node "Update User Stats"**  
    - Update Users: increment score, games_played, correct_answers; reset game_state='idle'.  
    - Connect from Process Answer.

21. **Add NocoDB Node "Mark Question As Answered"**  
    - Create entry in User Question History with answer details and points.  
    - Connect from Process Answer.

22. **Add Merge Node "Merge1"**  
    - Combine Process Answer, Update User Stats, Mark Question As Answered outputs.  
    - Connect all three to Merge1.

23. **Add Telegram Node**  
    - Send feedback message with chat_id and response_text.  
    - Connect from Merge1.

24. **Add Code Node "Handle Unknown Text"**  
    - Handles invalid inputs or answers outside expected format.  
    - Suggests available commands or reminds user to answer active question.  
    - Connect from Valid Answer? False branch.

25. **Add Telegram Node**  
    - Send unknown input response.  
    - Connect from Handle Unknown Text.

26. **Add NocoDB Node "Get Leaderboard"**  
    - Retrieve top 10 users sorted by score descending.  
    - Connect from `/leaderboard` route in Command Router.

27. **Add Aggregate Node "Aggregate"**  
    - Aggregate leaderboard user data into array.  
    - Connect from Get Leaderboard.

28. **Add Code Node "Format Leaderboard"**  
    - Formats leaderboard text with medals and current user marker.  
    - Connect from Aggregate.

29. **Add Telegram Node**  
    - Send formatted leaderboard to user.  
    - Connect from Format Leaderboard.

30. **Add Schedule Trigger Node "Daily Question Generator"**  
    - Set to run once per day.

31. **Add Code Node "Get Possible Categories"**  
    - Defines 8 trivia categories; generates requests for each.  
    - Connect from Schedule Trigger.

32. **Add OpenAI Node**  
    - Use GPT-4O-Mini to generate 5 trivia questions per category with options, correct answer, explanation, difficulty.  
    - Prompt includes JSON formatting.  
    - Connect from Get Possible Categories.

33. **Add NocoDB Node (Questions Create)**  
    - Insert generated questions into Questions table.  
    - Connect from OpenAI main output.

34. **Add Telegram Node "Send New Questions Available Notification" (optional)**  
    - Notify users questions updated.  
    - Connect from OpenAI or as needed.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Context or Link                                                                                                  |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| This workflow requires a NocoDB setup with three tables: Users, Questions, and User Question History, with specified fields and types. The workflow nodes assume these table structures for proper operation.                                                                                                                                                                                                                                                                                                                                                                                             | See "Database Setup Instructions" sticky note in workflow.                                                    |
| AI question generation uses GPT-4O-Mini model for cost-effective question generation with explanations and difficulty ratings. Questions are generated daily for 8 fixed categories.                                                                                                                                                                                                                                                                                                                                                                                                                                                                | AI Generation System sticky note.                                                                                |
| User state management prevents invalid answer submissions and tracks current question per user. Game states used are `idle` and `waiting_answer`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Game State Management sticky note.                                                                                |
| The Answer Processing engine validates answers, calculates points from question difficulty (1-5 stars = 1-5 points), updates stats, and logs answers to history to avoid repeats.                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Answer Processing sticky note.                                                                                    |
| The leaderboard shows top 10 users with emoji medals for top 3 and marks current user with "← YOU". If user is not in top 10, their rank is displayed if known.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Leaderboard System sticky note.                                                                                   |
| All responses are sent via a single Telegram node with Markdown parse mode enabled for rich formatting and emojis.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Response System sticky note.                                                                                      |
| The workflow is designed to handle concurrent users efficiently with fast database queries and robust error management, including unknown commands, invalid inputs, and missing data.                                                                                                                                                                                                                                                                                                                                                                                                                            | Data Flow Overview sticky note.                                                                                   |
| For development and testing, ensure Telegram bot credentials, NocoDB API tokens, and OpenAI API keys are correctly configured and permissions are set for database operations.                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Credentials configuration required for Telegram, NocoDB, and OpenAI nodes.                                        |

---

**Disclaimer:**  
The provided workflow is an automated n8n integration designed under strict compliance with content policies. It contains no illegal, offensive, or protected content. All handled data is legal and public.