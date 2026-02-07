Auto Create & Publish X-Threads (Twitter) with GPT via Telegram & Approval Loop

https://n8nworkflows.xyz/workflows/auto-create---publish-x-threads--twitter--with-gpt-via-telegram---approval-loop-11121


# Auto Create & Publish X-Threads (Twitter) with GPT via Telegram & Approval Loop

---
### 1. Workflow Overview

This workflow automates the creation and publishing of X (formerly Twitter) threads using OpenAI GPT-5 via interaction on Telegram, including a voice-to-text input option and an approval loop before publishing. It targets content creators who want to generate, revise, and post multi-part threads on X seamlessly through Telegram messages.

The core logical blocks are:

- **1.1 Input Reception and Conversion:** Captures user input from Telegram, supporting both text messages and voice notes, converting voice to text as needed.
- **1.2 AI Content Creation & Iterative Refinement:** Uses OpenAI GPT-5 together with conversational memory to draft a structured 5-part X thread based on user input, and interactively refines it through follow-up questions.
- **1.3 Approval Detection & Finalization:** Monitors user approval keywords to finalize content, extracts the final 5 tweets from the AI JSON response.
- **1.4 Publishing to X via Blotato:** Posts the approved thread to X using the Blotato API.
- **1.5 Publication Status Monitoring & Confirmation:** Polls Blotato for post status, sends confirmation or error messages back to the user on Telegram.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Conversion

**Overview:**  
Receives Telegram messages, distinguishes between text and voice inputs, and transcribes voice notes to text with OpenAI Whisper.

**Nodes Involved:**  
- Start: Telegram Message  
- Prepare Input  
- Check: is it a Voice?  
- Get Voice File  
- Speech to Text  
- Sticky Note1  

**Node Details:**

- **Start: Telegram Message**  
  - Type: Telegram Trigger  
  - Role: Entry point listening for incoming Telegram messages (text or voice).  
  - Configuration: Monitors "message" update type; uses Telegram API credentials.  
  - Inputs: External Telegram messages.  
  - Outputs: Message JSON with text or voice note data.  
  - Edge cases: Missing or malformed messages; unsupported media types.

- **Prepare Input**  
  - Type: Set  
  - Role: Extracts text from the Telegram message JSON or sets empty string if none.  
  - Key expression: `={{ $json?.message?.text || "" }}`  
  - Input: Telegram message JSON.  
  - Output: Object with "text" field for downstream use.

- **Check: is it a Voice?**  
  - Type: If  
  - Role: Checks if the incoming message text is empty, implying a voice note.  
  - Condition: `$json.message.text` is empty.  
  - True branch: Voice path; False branch: Text path.  
  - Edge cases: Messages that are neither text nor voice; empty messages.

- **Get Voice File**  
  - Type: Telegram node (file resource)  
  - Role: Retrieves the voice note file from Telegram using the voice file ID.  
  - Input: Voice file ID from Telegram message.  
  - Output: Voice file binary data.  
  - Edge cases: File not found, Telegram API errors.

- **Speech to Text**  
  - Type: OpenAI Audio Transcription  
  - Role: Uses OpenAI Whisper to transcribe voice audio to text.  
  - Input: Voice audio file binary.  
  - Output: Transcribed text.  
  - Credentials: OpenAI API key.  
  - Edge cases: Audio quality issues, transcription errors, API timeouts.

- **Sticky Note1**  
  - Type: Sticky Note (documentation)  
  - Content: Describes this block as "Capture Input" with voice-to-text conversion.

---

#### 2.2 AI Content Creation & Iterative Refinement

**Overview:**  
Uses GPT-5 to analyze user input, structure the content, and draft a 5-part X thread with iterative feedback capability. Maintains conversation memory to handle revisions.

**Nodes Involved:**  
- OpenAI Chat Model  
- Window Buffer Memory  
- AI: Draft & Revise Post  
- Sticky Note2  

**Node Details:**

- **OpenAI Chat Model**  
  - Type: Langchain OpenAI Chat Model Node  
  - Role: Provides GPT-5 language model interface for generation and refinement.  
  - Configuration: Model set to "gpt-5".  
  - Credentials: OpenAI API key.  
  - Input: Text input prepared from Telegram messages or transcriptions.  
  - Output: Structured AI response with draft thread or questions for clarification.  
  - Edge cases: API errors, throttling, model unavailability.

- **Window Buffer Memory**  
  - Type: Langchain Memory Buffer Window  
  - Role: Maintains conversational context per user session for iterative refinement.  
  - Configuration: Session key based on Telegram user ID; context window length 10 messages.  
  - Input/Output: Feeds memory context into AI chat node and updates it with responses.  
  - Edge cases: Memory overflow, session ID mismatch.

- **AI: Draft & Revise Post**  
  - Type: Langchain Agent Node  
  - Role: Core logic node running the AI-driven content creation and revision loop.  
  - Configuration:  
    - System prompt instructs AI to structure user input into topic, goal, audience, tonality, key message, and examples.  
    - AI asks up to 3 clarifying questions if needed before drafting a thread.  
    - Produces a 5-part X thread draft with hooks, narrative, and call-to-action.  
    - Handles user feedback and revisions interactively before final approval.  
  - Input: Text from Telegram or transcription plus memory context.  
  - Output: JSON or text with thread draft or questions.  
  - Edge cases: Ambiguous user input, incomplete data, AI output formatting errors.

- **Sticky Note2**  
  - Type: Sticky Note (documentation)  
  - Content: Describes AI content creation and revision functionality.

---

#### 2.3 Approval Detection & Finalization

**Overview:**  
Detects user approval keywords in AI output to trigger final post extraction and prepare for publishing.

**Nodes Involved:**  
- Check if Approved  
- Approval: Extract Final Post Text  
- Post Suggestion Or Ask For Approval  
- Sticky Note3  

**Node Details:**

- **Check if Approved**  
  - Type: If  
  - Role: Checks if AI output contains approval keywords such as "videoPrompt", "socialMediaText", or starts with "{" (indicating JSON format).  
  - Condition: OR condition on output text.  
  - True branch: Proceed to extract final post text.  
  - False branch: Send AI draft back to Telegram to request approval or further input.  
  - Edge cases: False positives/negatives in keyword detection, malformed AI output.

- **Approval: Extract Final Post Text**  
  - Type: Code (JavaScript)  
  - Role: Parses AI output JSON to extract the finalized 5 tweets.  
  - Functionality:  
    - Cleans code fences and extraneous text.  
    - Parses JSON safely with error handling.  
    - Extracts tweet1 to tweet5 and returns as separate fields.  
  - Edge cases: Missing or invalid JSON, parse errors.

- **Post Suggestion Or Ask For Approval**  
  - Type: Telegram node (send message)  
  - Role: Sends the AI draft or clarifying questions back to the user on Telegram for review and approval.  
  - Input: AI output text.  
  - Output: Telegram message.  
  - Edge cases: Telegram API errors, failed delivery.

- **Sticky Note3**  
  - Type: Sticky Note (documentation)  
  - Content: Explains the approval and publishing trigger mechanism.

---

#### 2.4 Publishing to X via Blotato

**Overview:**  
Posts the approved 5-part thread to X using the Blotato API, which integrates with the user's X account.

**Nodes Involved:**  
- Create post with Blotato  
- Give Blotat 5s :) (Wait)  
- Sticky Note3 (partially overlaps)  

**Node Details:**

- **Create post with Blotato**  
  - Type: Blotato API node  
  - Role: Sends the 5 tweets as a threaded post to X.  
  - Configuration:  
    - Platform set to Twitter (X).  
    - Account ID selected from Blotato accounts.  
    - Posts content mapped from extracted tweet1 to tweet5 fields.  
  - Credentials: Blotato API credentials.  
  - Input: Finalized tweets from previous node.  
  - Output: Post submission ID for status tracking.  
  - Edge cases: API errors, invalid credentials, posting limits.

- **Give Blotat 5s :)**  
  - Type: Wait node  
  - Role: Delays workflow for 5 seconds to allow Blotato to process submission before polling status.  
  - Edge cases: Timing issues if delay insufficient.

---

#### 2.5 Publication Status Monitoring & Confirmation

**Overview:**  
Polls the Blotato API to confirm whether the post is published, in progress, or failed, then notifies the user accordingly on Telegram.

**Nodes Involved:**  
- Check post status  
- Published?  
- In Progress?  
- Give Blotat other 5s :) (Wait)  
- Send a confirmation message  
- Send an error message  
- Sticky Note4  

**Node Details:**

- **Check post status**  
  - Type: Blotato API node (get operation)  
  - Role: Retrieves the current status of the post submission by ID.  
  - Input: Post submission ID.  
  - Output: Status field (e.g., "published", "in-progress", "error").  
  - Edge cases: API errors, invalid ID.

- **Published?**  
  - Type: If  
  - Role: Checks if status equals "published".  
  - True branch: Send confirmation message.  
  - False branch: Check if "in-progress".

- **In Progress?**  
  - Type: If  
  - Role: Checks if status equals "in-progress".  
  - True branch: Wait 5 more seconds and re-check status.  
  - False branch: Send error message.

- **Give Blotat other 5s :)**  
  - Type: Wait node  
  - Role: Additional delay before re-checking post status.  
  - Edge cases: Same as above.

- **Send a confirmation message**  
  - Type: Telegram node (send message)  
  - Role: Notifies user that the post is live with a direct link.  
  - Input: Chat ID from Telegram message; public URL from Blotato response.  
  - Edge cases: Telegram API failures.

- **Send an error message**  
  - Type: Telegram node (send message)  
  - Role: Notifies user of error uploading post.  
  - Input: Chat ID.  
  - Edge cases: Telegram API failures.

- **Sticky Note4**  
  - Type: Sticky Note (documentation)  
  - Content: Describes status polling and user notification.

---

### 3. Summary Table

| Node Name                     | Node Type                       | Functional Role                              | Input Node(s)                  | Output Node(s)                       | Sticky Note                                                                                                             |
|-------------------------------|--------------------------------|----------------------------------------------|-------------------------------|------------------------------------|-------------------------------------------------------------------------------------------------------------------------|
| Start: Telegram Message        | Telegram Trigger               | Entry point for Telegram messages             | -                             | Prepare Input                      | ## 1. Capture Input<br>Receives Telegram messages and converts voice notes to text using OpenAI Whisper                 |
| Prepare Input                 | Set                            | Extracts text or sets empty string            | Start: Telegram Message        | Check: ist it a Voice?             |                                                                                                                         |
| Check: ist it a Voice?         | If                             | Determines if input is voice or text           | Prepare Input                 | Get Voice File, AI: Draft & Revise Post |                                                                                                                         |
| Get Voice File                | Telegram                       | Downloads voice audio file                      | Check: ist it a Voice? (true)  | Speech to Text                    |                                                                                                                         |
| Speech to Text                | OpenAI Audio Transcription     | Transcribes voice audio to text                 | Get Voice File                | AI: Draft & Revise Post           |                                                                                                                         |
| OpenAI Chat Model             | Langchain OpenAI Chat Model    | GPT-5 text generation and interaction          | Window Buffer Memory           | AI: Draft & Revise Post           | ## 2. AI Content Creation<br>Generates LinkedIn posts and handles revision requests through conversational memory       |
| Window Buffer Memory          | Langchain Memory Buffer        | Maintains conversation context per user        | -                             | OpenAI Chat Model                 |                                                                                                                         |
| AI: Draft & Revise Post       | Langchain Agent                | Core AI logic for drafting and refining posts  | Prepare Input, Speech to Text, OpenAI Chat Model, Window Buffer Memory | Check if Approved |                                                                                                                         |
| Check if Approved             | If                             | Detects approval keywords in AI output          | AI: Draft & Revise Post       | Approval: Extract Final Post Text, Post Suggestion Or Ask For Approval | ## 3. Approval & Publishing<br>Detects approval keywords, extracts final content, and posts to X via Blotato             |
| Approval: Extract Final Post Text | Code (JavaScript)           | Parses AI JSON output to extract final tweets  | Check if Approved             | Create post with Blotato          |                                                                                                                         |
| Post Suggestion Or Ask For Approval | Telegram                   | Sends AI draft or clarifying questions to user | Check if Approved             | -                                |                                                                                                                         |
| Create post with Blotato      | Blotato API                   | Publishes the approved thread to X              | Approval: Extract Final Post Text | Give Blotat 5s :)                |                                                                                                                         |
| Give Blotat 5s :)             | Wait                          | Waits 5 seconds for Blotato processing          | Create post with Blotato      | Check post status                 | ## 4. Status Monitoring<br>Polls Blotato API to verify publication and sends confirmation with post link to Telegram    |
| Check post status             | Blotato API                   | Checks status of post submission                 | Give Blotat 5s :)             | Published?                       |                                                                                                                         |
| Published?                   | If                             | Checks if post is published                       | Check post status             | Send a confirmation message, In Progress? |                                                                                                                         |
| In Progress?                 | If                             | Checks if post is still processing                | Published?                   | Give Blotat other 5s :), Send an error message |                                                                                                                         |
| Give Blotat other 5s :)      | Wait                          | Additional wait before re-checking post status   | In Progress?                 | Check post status                |                                                                                                                         |
| Send a confirmation message  | Telegram                       | Notifies user post is live with link             | Published?                   | -                                |                                                                                                                         |
| Send an error message        | Telegram                       | Notifies user of an error uploading post          | In Progress?                 | -                                |                                                                                                                         |
| Sticky Note                  | Sticky Note                   | Documentation and explanations                    | -                             | -                                | See individual notes above for each block.                                                                             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node**  
   - Type: Telegram Trigger  
   - Set to listen for "message" updates.  
   - Connect Telegram API credentials (your Telegram bot token).  
   - This node starts the workflow on any text or voice message.

2. **Create Set Node "Prepare Input"**  
   - Extract text from Telegram message JSON: `={{ $json?.message?.text || "" }}`  
   - Output a field named "text".  
   - Connect input from Telegram Trigger.

3. **Create If Node "Check: is it a Voice?"**  
   - Condition: Check if `{{$json.message.text}}` is empty (empty string).  
   - True branch: voice path; False branch: text path.

4. **Create Telegram Node "Get Voice File"** (on True branch)  
   - Resource: File  
   - File ID: `={{ $('Start: Telegram Message').item.json.message.voice.file_id }}`  
   - Connect from "Check: is it a Voice?" True output.

5. **Create OpenAI Node "Speech to Text"**  
   - Resource: Audio  
   - Operation: Transcribe  
   - Credentials: OpenAI API key  
   - Input: binary data from "Get Voice File".  
   - Connect from "Get Voice File".

6. **Create Langchain Memory Node "Window Buffer Memory"**  
   - Session key: `={{ $('Start: Telegram Message').first().json.message.from.id }}`  
   - Session ID type: customKey  
   - Context window length: 10 messages  
   - No input connection (standalone).

7. **Create Langchain Chat Model Node "OpenAI Chat Model"**  
   - Model: gpt-5  
   - Credentials: OpenAI API key  
   - Connect memory node output to this model's memory input.

8. **Create Langchain Agent Node "AI: Draft & Revise Post"**  
   - Text input: `={{ $json.text }}` (from "Prepare Input" for text path, or from "Speech to Text" for voice path)  
   - System prompt: as detailed in the original workflow, instructing to analyze, clarify, draft, and refine a 5-part X thread with approval loop.  
   - Connect input from:  
     - Text path: "Prepare Input" False output → "AI: Draft & Revise Post"  
     - Voice path: "Speech to Text" output → "AI: Draft & Revise Post"  
     - Also connect "OpenAI Chat Model" and "Window Buffer Memory" as AI components.  
   - Output: AI draft or clarification questions.

9. **Create If Node "Check if Approved"**  
   - Condition: AI output contains any of ["videoPrompt", "socialMediaText"] or starts with "{".  
   - True branch: final approval path.  
   - False branch: send draft back to user.

10. **Create Code Node "Approval: Extract Final Post Text"**  
    - JavaScript code parses AI output JSON to extract 5 tweets.  
    - Connect from "Check if Approved" True output.

11. **Create Telegram Node "Post Suggestion Or Ask For Approval"**  
    - Sends AI draft output text to user for review.  
    - Connect from "Check if Approved" False output.

12. **Create Blotato Node "Create post with Blotato"**  
    - Platform: Twitter (X)  
    - Account ID: select your Blotato account ID  
    - Post content: Map tweets 1–5 from code node output fields.  
    - Credentials: Blotato API key  
    - Connect from "Approval: Extract Final Post Text".

13. **Create Wait Node "Give Blotat 5s :)"**  
    - Wait 5 seconds  
    - Connect from "Create post with Blotato".

14. **Create Blotato Node "Check post status"**  
    - Operation: Get  
    - Post Submission ID: `={{ $json.postSubmissionId }}`  
    - Credentials: Blotato API key  
    - Connect from "Give Blotat 5s :)".

15. **Create If Node "Published?"**  
    - Condition: `$json.status` equals "published".  
    - True: send confirmation.  
    - False: check if in-progress.

16. **Create If Node "In Progress?"**  
    - Condition: `$json.status` equals "in-progress".  
    - True: wait 5 seconds and re-check status.  
    - False: send error message.

17. **Create Wait Node "Give Blotat other 5s :)"**  
    - Wait 5 seconds  
    - Connect from "In Progress?" True output back to "Check post status" (loop).

18. **Create Telegram Node "Send a confirmation message"**  
    - Message: "Your post is online! Click here: {{ $json.publicUrl }}"  
    - Chat ID: from initial Telegram message.  
    - Connect from "Published?" True output.

19. **Create Telegram Node "Send an error message"**  
    - Message: "There was an error uploading your post."  
    - Chat ID: from initial Telegram message.  
    - Connect from "In Progress?" False output.

20. **Add Sticky Notes**  
    - Add descriptive sticky notes for each logical block as per the original workflow for documentation clarity.

21. **Configure Credentials**  
    - Telegram API credentials (bot token).  
    - OpenAI API key (for both chat and transcription).  
    - Blotato API credentials with linked X account.

22. **Test End-to-End**  
    - Send text and voice messages to Telegram bot.  
    - Review AI drafts, approve via text commands.  
    - Confirm posts appear on X.  
    - Monitor Telegram confirmations/errors.

---

### 5. General Notes & Resources

| Content                                                                                                                                                                                                                   | Context or Link                                                                                                      |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| AI LinkedIn Content Bot with Approval Loop: Transform Telegram into a LinkedIn content assistant with voice & text input, iterative AI drafting, and direct publishing to X.                                              | Workflow description and sticky note content.                                                                       |
| Blotato platform for scheduling and publishing social media posts, integrates with LinkedIn and X accounts.                                                                                                              | https://blotato.com/?ref=feras                                                                                        |
| Setup instructions: Requires Telegram Bot creation (@BotFather), OpenAI API key for GPT and Whisper, and Blotato account linked to social platforms.                                                                     | Workflow sticky notes.                                                                                                |
| Customization tips: Modify system prompt for tone/style; swap GPT models; schedule posts instead of immediate publishing.                                                                                                  | Workflow sticky notes.                                                                                                |
| The workflow uses a conversational memory buffer to maintain context across iterative AI interactions with the user, improving refinement and approval efficiency.                                                        | Window Buffer Memory node details.                                                                                    |
| The approval loop strictly follows a JSON output format for the final thread and only publishes upon explicit user confirmation keywords such as "ok" or "approved".                                                      | AI: Draft & Revise Post node prompt and Check if Approved node logic.                                               |
| Voice note transcription uses OpenAI Whisper model via the Langchain OpenAI audio transcription node.                                                                                                                     | Speech to Text node configuration.                                                                                   |

---

**Disclaimer:** The content provided is generated from an automated n8n workflow integration. It complies fully with content policies and contains no illegal, offensive, or protected elements. All data processed is legal and publicly available.