AI-Powered Credit Card Recommendation System with OpenAI GPT, Telegram & Google Sheets

https://n8nworkflows.xyz/workflows/ai-powered-credit-card-recommendation-system-with-openai-gpt--telegram---google-sheets-7714


# AI-Powered Credit Card Recommendation System with OpenAI GPT, Telegram & Google Sheets

### 1. Workflow Overview

This workflow implements an **AI-powered credit card recommendation system** that interacts with users via **Telegram**, processes user inputs, stores and retrieves user states from **Google Sheets**, and leverages **OpenAI GPT** to generate personalized credit card recommendations. The logical flow guides users through a series of questions (quiz), collects their answers, and finally provides tailored credit card suggestions.

The workflow is divided into the following logical blocks:

- **1.1 Input Reception & User State Retrieval**: Captures incoming Telegram messages and retrieves or initializes user state from Google Sheets.
- **1.2 User Response Processing & State Update**: Processes user answers, formats them, and updates the user state in Google Sheets.
- **1.3 Question Flow Control & Quiz Management**: Determines the next quiz question to ask or decides when to conclude the quiz.
- **1.4 Credit Card Data Fetch & User Profile Merging**: Retrieves credit card dataset and merges it with the user profile for AI input.
- **1.5 AI Prompt Construction & GPT Call**: Builds the prompt incorporating user data and card info, then calls OpenAI GPT for recommendations.
- **1.6 GPT Output Formatting & Response Delivery**: Cleans GPT results, formats recommendations, and sends them back via Telegram.
- **1.7 Telegram Message Sending**: Handles outbound Telegram messages for both questions and recommendations.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & User State Retrieval

- **Overview:**  
Captures Telegram messages from users and retrieves existing user state from Google Sheets. If the user is new, prepares for onboarding.

- **Nodes Involved:**  
`Trigger: Incoming Telegram Message`, `Extract Telegram Message Text`, `Lookup User State (Google Sheet)`, `Merge Incoming Message with State`

- **Node Details:**  
1. **Trigger: Incoming Telegram Message**  
   - Type: Telegram Trigger  
   - Role: Entry point that listens for new Telegram messages from users.  
   - Config: Uses Telegram API credentials, webhook enabled.  
   - Inputs: Telegram chat updates  
   - Outputs: Raw message JSON  
   - Edge Cases: Telegram API downtime, webhook misconfiguration.

2. **Extract Telegram Message Text**  
   - Type: Code  
   - Role: Extracts the textual content from Telegram message payload.  
   - Key Expressions: Parses JSON to pull `message.text`.  
   - Inputs: Raw Telegram message data  
   - Outputs: Structured data with extracted text  
   - Edge Cases: Non-text messages (stickers, media) may cause failures.

3. **Lookup User State (Google Sheet)**  
   - Type: Google Sheets (Read)  
   - Role: Searches the Google Sheet database for the user’s existing state based on Telegram user ID.  
   - Config: Uses Google Sheets credentials, specific sheet and lookup column (user ID).  
   - Inputs: Extracted user ID  
   - Outputs: User state data or empty if not found  
   - Edge Cases: Sheet access issues, user not found returns empty data handled downstream.

4. **Merge Incoming Message with State**  
   - Type: Merge  
   - Role: Combines incoming message data with existing user state for unified processing.  
   - Inputs: Telegram message text and user state  
   - Outputs: Merged data object  
   - Edge Cases: Missing user state requires careful conditional handling downstream.

---

#### 2.2 User Response Processing & State Update

- **Overview:**  
Processes and maps user answers to expected formats, extracts metadata, and updates or inserts the user state in Google Sheets.

- **Nodes Involved:**  
`Check if User Exists in DB`, `Map & Format Answer for Google Sheet`, `Extract Metadata from Answer`, `Append Full User State for Processing`, `Merge Updated State for Next Step`, `Carry Forward Previous Answers`, `Update Answer in Google Sheet`, `Insert New User into Google Sheet`

- **Node Details:**  
1. **Check if User Exists in DB**  
   - Type: If  
   - Role: Determines if user record exists based on lookup result.  
   - Inputs: Merged user state data  
   - Outputs: Branches to update existing or insert new user  
   - Edge Cases: False negatives if lookup fails.

2. **Map & Format Answer for Google Sheet**  
   - Type: Code  
   - Role: Transforms user input into a standardized format suitable for Google Sheets storage.  
   - Inputs: User’s raw answer text  
   - Outputs: Formatted answer object  
   - Edge Cases: Unexpected input formats or invalid answers.

3. **Extract Metadata from Answer**  
   - Type: Set  
   - Role: Extracts or computes additional metadata from the answer for state enrichment.  
   - Inputs: Formatted answer data  
   - Outputs: Metadata fields added to data  
   - Edge Cases: Missing fields or malformed data.

4. **Append Full User State for Processing**  
   - Type: Code  
   - Role: Combines the new answer and metadata with existing user state to form a complete data object.  
   - Inputs: Current user state and new answer data  
   - Outputs: Updated user state object  
   - Edge Cases: Data merge conflicts or missing fields.

5. **Merge Updated State for Next Step**  
   - Type: Merge  
   - Role: Combines updated user state with other data streams preparing for next workflow steps.  
   - Inputs: Updated user state objects  
   - Outputs: Consolidated data for further processing  
   - Edge Cases: Merge conflicts.

6. **Carry Forward Previous Answers**  
   - Type: Set  
   - Role: Maintains continuity of previous answers for correct state progression.  
   - Inputs: Updated user state  
   - Outputs: Data preserving historic answers  
   - Edge Cases: Loss of data if improperly configured.

7. **Update Answer in Google Sheet**  
   - Type: Google Sheets (Update)  
   - Role: Writes updated user answers back to Google Sheets for existing users.  
   - Inputs: Updated user state data  
   - Outputs: Confirmation of update  
   - Edge Cases: Sheet access permission issues, update conflicts.

8. **Insert New User into Google Sheet**  
   - Type: Google Sheets (Append)  
   - Role: Inserts new user data row when user is not found in DB.  
   - Inputs: New user formatted data  
   - Outputs: Confirmation of insertion  
   - Edge Cases: Append failures, quota limits.

---

#### 2.3 Question Flow Control & Quiz Management

- **Overview:**  
Determines quiz progression by checking if all questions are answered and selects the next question or terminates the quiz.

- **Nodes Involved:**  
`Determine Next Quiz Question`, `Check if More Questions Remaining`, `Is Q7 Answered?`, `Get Question Text`, `Send Question`

- **Node Details:**  
1. **Determine Next Quiz Question**  
   - Type: Code  
   - Role: Logic to compute which quiz question should be asked next based on user state.  
   - Inputs: User answers and metadata  
   - Outputs: Next question identifier or completion flag  
   - Edge Cases: Logic errors causing infinite loops or skipping questions.

2. **Check if More Questions Remaining**  
   - Type: Switch  
   - Role: Branches workflow depending on whether there are remaining questions.  
   - Inputs: Next question flag  
   - Outputs: Branch to continue quiz or to final processing  
   - Edge Cases: Misrouted branches leading to dead ends.

3. **Is Q7 Answered?**  
   - Type: If  
   - Role: Specifically checks if the final question (Q7) has been answered.  
   - Inputs: User answers  
   - Outputs: Branch to fetch cards or ask next question  
   - Edge Cases: Incorrect detection may stall flow.

4. **Get Question Text**  
   - Type: Code  
   - Role: Retrieves the text of the next quiz question to send to the user.  
   - Inputs: Question identifier  
   - Outputs: Question text string  
   - Edge Cases: Missing question data.

5. **Send Question**  
   - Type: Telegram (Send Message)  
   - Role: Sends the next quiz question to the user on Telegram.  
   - Inputs: Question text, user chat ID  
   - Outputs: Confirmation of message sent  
   - Edge Cases: Telegram API errors, chat ID mismatches.

---

#### 2.4 Credit Card Data Fetch & User Profile Merging

- **Overview:**  
Fetches credit card data from Google Sheets and merges it with the user profile to prepare input for GPT processing.

- **Nodes Involved:**  
`Fetch Cards`, `Clean Q1–Q7 Inputs`, `Merge User Profile & Card Dataset`

- **Node Details:**  
1. **Fetch Cards**  
   - Type: Google Sheets (Read)  
   - Role: Reads the dataset of credit cards available for recommendation.  
   - Inputs: None or configured sheet range  
   - Outputs: Cards list data  
   - Edge Cases: Sheet read permissions, empty or malformed data.

2. **Clean Q1–Q7 Inputs**  
   - Type: Set  
   - Role: Sanitizes and formats user answers from questions Q1 to Q7 for consistency.  
   - Inputs: Raw user answers  
   - Outputs: Cleaned input values  
   - Edge Cases: Unexpected answer formats.

3. **Merge User Profile & Card Dataset**  
   - Type: Merge  
   - Role: Combines cleaned user profile inputs with card dataset into one unified data stream.  
   - Inputs: Cleaned inputs and card data  
   - Outputs: Combined data object for GPT prompt  
   - Edge Cases: Data misalignment or missing fields.

---

#### 2.5 AI Prompt Construction & GPT Call

- **Overview:**  
Constructs a detailed prompt combining user profile and card data, then queries OpenAI GPT via LangChain node for personalized credit card recommendations.

- **Nodes Involved:**  
`Build GPT Prompt with User Profile & Card Data`, `Send Prompt to GPT for Card Matching`

- **Node Details:**  
1. **Build GPT Prompt with User Profile & Card Data**  
   - Type: Code  
   - Role: Formats a comprehensive prompt embedding user answers and card info for GPT.  
   - Inputs: Merged profile and card data  
   - Outputs: Prompt string  
   - Edge Cases: Prompt too long, missing data fields.

2. **Send Prompt to GPT for Card Matching**  
   - Type: OpenAI (LangChain)  
   - Role: Sends prompt to OpenAI GPT API and receives recommendations.  
   - Config: Uses OpenAI API credentials, model settings may be customized (e.g., temperature).  
   - Inputs: Prompt text  
   - Outputs: GPT-generated text response  
   - Edge Cases: API rate limits, network errors, malformed prompt.

---

#### 2.6 GPT Output Formatting & Response Delivery

- **Overview:**  
Processes GPT output by cleaning and splitting into manageable sections, then formats it for Telegram display.

- **Nodes Involved:**  
`Clean GPT Output & Split into Sections`, `Format GPT Card Recommendations for Telegram`, `Send Card Recommendations to Telegram`

- **Node Details:**  
1. **Clean GPT Output & Split into Sections**  
   - Type: Code  
   - Role: Parses GPT output, removes unwanted text, and splits recommendations into sections.  
   - Inputs: Raw GPT output text  
   - Outputs: Structured, cleaned recommendation data  
   - Edge Cases: Unexpected output format, empty response.

2. **Format GPT Card Recommendations for Telegram**  
   - Type: Code  
   - Role: Converts structured recommendations into Telegram-friendly message format (e.g., markdown).  
   - Inputs: Cleaned recommendations  
   - Outputs: Formatted message string  
   - Edge Cases: Telegram markdown escaping issues.

3. **Send Card Recommendations to Telegram**  
   - Type: Telegram (Send Message)  
   - Role: Sends the formatted credit card recommendations to the user’s Telegram chat.  
   - Inputs: Formatted recommendations, chat id  
   - Outputs: Delivery confirmation  
   - Edge Cases: Telegram send failures, user blocking bot.

---

#### 2.7 Telegram Message Sending

- **Overview:**  
Handles all Telegram message sending tasks for both quiz questions and final recommendations.

- **Nodes Involved:**  
`Send Question`, `Send Card Recommendations to Telegram`, `Telegram` (fallback message node on no questions remaining)

- **Node Details:**  
1. **Send Question**  
   - See above in 2.3.

2. **Send Card Recommendations to Telegram**  
   - See above in 2.6.

3. **Telegram**  
   - Type: Telegram (Send Message)  
   - Role: Sends fallback or error messages when no more questions remain or quiz ends unexpectedly.  
   - Inputs: Predefined message text  
   - Outputs: Message sent confirmation  
   - Edge Cases: Telegram API errors.

---

### 3. Summary Table

| Node Name                          | Node Type                   | Functional Role                                  | Input Node(s)                         | Output Node(s)                         | Sticky Note                                                                                      |
|-----------------------------------|-----------------------------|-------------------------------------------------|-------------------------------------|---------------------------------------|------------------------------------------------------------------------------------------------|
| Trigger: Incoming Telegram Message| Telegram Trigger            | Entry point for incoming Telegram messages      | -                                   | Extract Telegram Message Text          |                                                                                                |
| Extract Telegram Message Text      | Code                       | Extracts text from Telegram message              | Trigger: Incoming Telegram Message  | Lookup User State (Google Sheet), Merge Incoming Message with State |                                                                                                |
| Lookup User State (Google Sheet)  | Google Sheets (Read)        | Retrieves user state from Google Sheets          | Extract Telegram Message Text        | Merge Incoming Message with State, Merge Updated State for Next Step |                                                                                                |
| Merge Incoming Message with State | Merge                      | Combines message text with user state            | Extract Telegram Message Text, Lookup User State | Check if User Exists in DB              |                                                                                                |
| Check if User Exists in DB         | If                         | Determines if user exists in DB                   | Merge Incoming Message with State    | Map & Format Answer for Google Sheet, Insert New User into Google Sheet |                                                                                                |
| Map & Format Answer for Google Sheet | Code                    | Formats user answer for Google Sheets             | Check if User Exists in DB            | Extract Metadata from Answer           |                                                                                                |
| Extract Metadata from Answer       | Set                        | Extracts metadata from user answer                | Map & Format Answer for Google Sheet | Append Full User State for Processing  |                                                                                                |
| Append Full User State for Processing | Code                    | Combines updated answer and user state            | Extract Metadata from Answer          | Merge Updated State for Next Step      |                                                                                                |
| Merge Updated State for Next Step  | Merge                      | Prepares updated user state for next steps        | Append Full User State for Processing, Lookup User State | Carry Forward Previous Answers, Merge Incoming Message with State |                                                                                                |
| Carry Forward Previous Answers     | Set                        | Maintains previous answers for continuity         | Merge Updated State for Next Step     | Update Answer in Google Sheet          |                                                                                                |
| Update Answer in Google Sheet      | Google Sheets (Update)      | Updates user answers in Google Sheets             | Carry Forward Previous Answers        | Determine Next Quiz Question           |                                                                                                |
| Insert New User into Google Sheet  | Google Sheets (Append)      | Inserts new user record in Google Sheets          | Check if User Exists in DB            | Determine Next Quiz Question           |                                                                                                |
| Determine Next Quiz Question       | Code                       | Decides next quiz question or quiz completion     | Update Answer in Google Sheet, Insert New User into Google Sheet | Check if More Questions Remaining       |                                                                                                |
| Check if More Questions Remaining  | Switch                     | Branches based on quiz completion                  | Determine Next Quiz Question          | Is Q7 Answered?, Telegram              |                                                                                                |
| Is Q7 Answered?                   | If                         | Checks if final quiz question is answered          | Check if More Questions Remaining     | Fetch Cards, Get Question Text          |                                                                                                |
| Get Question Text                 | Code                       | Retrieves next question text to ask                | Is Q7 Answered?                      | Send Question                         |                                                                                                |
| Send Question                    | Telegram                   | Sends quiz question to user                         | Get Question Text                    | -                                     |                                                                                                |
| Fetch Cards                     | Google Sheets (Read)        | Retrieves credit card dataset                       | Is Q7 Answered?                      | Merge User Profile & Card Dataset       |                                                                                                |
| Clean Q1–Q7 Inputs              | Set                        | Sanitizes user answers Q1 to Q7                     | Fetch Cards                         | Merge User Profile & Card Dataset       |                                                                                                |
| Merge User Profile & Card Dataset | Merge                      | Combines user profile and card data for GPT input | Fetch Cards, Clean Q1–Q7 Inputs      | Build GPT Prompt with User Profile & Card Data |                                                                                                |
| Build GPT Prompt with User Profile & Card Data | Code             | Builds GPT input prompt                             | Merge User Profile & Card Dataset     | Send Prompt to GPT for Card Matching   |                                                                                                |
| Send Prompt to GPT for Card Matching | OpenAI (LangChain)       | Sends prompt to GPT and receives recommendations   | Build GPT Prompt with User Profile & Card Data | Clean GPT Output & Split into Sections |                                                                                                |
| Clean GPT Output & Split into Sections | Code                  | Parses and cleans GPT output                        | Send Prompt to GPT for Card Matching | Format GPT Card Recommendations for Telegram |                                                                                                |
| Format GPT Card Recommendations for Telegram | Code             | Formats GPT output for Telegram display             | Clean GPT Output & Split into Sections | Send Card Recommendations to Telegram  |                                                                                                |
| Send Card Recommendations to Telegram | Telegram                | Sends card recommendation message to user          | Format GPT Card Recommendations for Telegram | -                                     |                                                                                                |
| Telegram                        | Telegram                   | Sends fallback or termination messages             | Check if More Questions Remaining     | -                                     |                                                                                                |
| Get Question Text               | Code                       | Retrieves question text                              | Is Q7 Answered?                      | Send Question                         |                                                                                                |
| Clean Q1–Q7 Inputs             | Set                        | Cleans user inputs Q1 to Q7                          | Fetch Cards                         | Merge User Profile & Card Dataset       |                                                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node**  
   - Type: Telegram Trigger  
   - Setup: Configure webhook with Telegram API credentials  
   - Purpose: Listen to incoming user messages.

2. **Add Code Node to Extract Telegram Message Text**  
   - Extract `message.text` from incoming Telegram JSON payload.

3. **Add Google Sheets Node to Lookup User State**  
   - Configure Google Sheets credentials.  
   - Setup read operation to search user by Telegram user ID.

4. **Add Merge Node to Combine Incoming Message and User State**  
   - Merge incoming Telegram text and existing user state for processing.

5. **Add If Node to Check User Existence**  
   - Condition: If lookup result is empty or not.

6. **Create Code Node to Map & Format User Answer**  
   - Transform user text answer into structured format for storage.

7. **Add Set Node to Extract Metadata from Answer**  
   - Derive additional fields from the answer as needed.

8. **Add Code Node to Append Full User State**  
   - Combine new answer and metadata with prior user state.

9. **Add Merge Node to Prepare Updated State**  
   - Merge updated state with other relevant data flows.

10. **Add Set Node to Carry Forward Previous Answers**  
    - Preserve continuity of answers for quiz flow.

11. **Add Google Sheets Update Node for Existing Users**  
    - Update user answers in Google Sheet.

12. **Add Google Sheets Append Node for New Users**  
    - Insert a new user record if user does not exist.

13. **Add Code Node to Determine Next Quiz Question**  
    - Logic to decide next question or quiz completion.

14. **Add Switch Node to Check If More Questions Remain**  
    - Branch workflow based on quiz progress.

15. **Add If Node to Check if Final Question (Q7) is Answered**  
    - Decide whether to continue quiz or fetch cards.

16. **Add Google Sheets Node to Fetch Credit Card Dataset**  
    - Configure to read credit card data.

17. **Add Set Node to Clean Q1–Q7 Inputs**  
    - Sanitize and format user answers.

18. **Add Merge Node to Combine User Profile and Card Data**  
    - Prepare combined dataset for GPT prompt.

19. **Add Code Node to Build GPT Prompt**  
    - Construct prompt embedding user profile and card info.

20. **Add OpenAI LangChain Node to Send Prompt**  
    - Configure with OpenAI API credentials.  
    - Set model and parameters as needed.

21. **Add Code Node to Clean & Split GPT Output**  
    - Parse GPT response and split into sections.

22. **Add Code Node to Format GPT Output for Telegram**  
    - Format recommendations into Telegram markdown message.

23. **Add Telegram Node to Send Recommendations**  
    - Send formatted recommendations to user via Telegram.

24. **Add Telegram Node as Fallback to Send Messages When No More Questions Remain**  
    - Optional: Send closing or error messages.

**Credentials needed:**  
- Telegram API (OAuth2 or bot token)  
- Google Sheets API (OAuth2 or service account)  
- OpenAI API (API key)

---

### 5. General Notes & Resources

| Note Content                                                                                  | Context or Link                                                                                     |
|-----------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| The workflow uses Telegram as primary user interaction channel, requiring proper webhook setup.| Telegram Bot API documentation: https://core.telegram.org/bots/api                                |
| Google Sheets serves as persistent user state and data storage.                               | Google Sheets API reference: https://developers.google.com/sheets/api                             |
| OpenAI GPT is accessed via LangChain node for advanced prompt management and AI interaction. | OpenAI API docs: https://platform.openai.com/docs                                                |
| Quiz logic specifically checks up to question 7 (Q7), adjust if adding/removing questions.     |                                                                                                   |
| Ensure API rate limits and quotas are monitored for Google Sheets and OpenAI to avoid failures.|                                                                                                   |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, a workflow automation tool. It strictly adheres to content policies and contains no illegal, offensive, or protected elements. All data processed is legal and publicly accessible.