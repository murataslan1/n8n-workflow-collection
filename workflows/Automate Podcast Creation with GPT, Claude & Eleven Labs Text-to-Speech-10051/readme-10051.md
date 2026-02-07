Automate Podcast Creation with GPT, Claude & Eleven Labs Text-to-Speech

https://n8nworkflows.xyz/workflows/automate-podcast-creation-with-gpt--claude---eleven-labs-text-to-speech-10051


# Automate Podcast Creation with GPT, Claude & Eleven Labs Text-to-Speech

### 1. Workflow Overview

This workflow, titled **"Automate Podcast Creation with GPT, Claude & Eleven Labs Text-to-Speech"**, automates the process of generating a podcast episode intro script and its corresponding audio file from a single user-provided topic. It is designed for solo monologue podcasts, leveraging AI models for ideation and script writing, then synthesizing speech and emailing the final audio.

The workflow logically breaks down into the following key blocks:

- **1.1 Input Reception:** Captures a user's podcast seed topic via a chat message trigger.
- **1.2 Podcast Idea Generation:** Uses OpenAI’s GPT-4 to create a compelling podcast episode idea based on the seed topic.
- **1.3 Podcast Script Generation:** Employs Anthropic’s Claude Sonnet model to expand the idea into a natural, engaging 60-second podcast intro script.
- **1.4 Text-to-Speech Conversion:** Converts the generated script into an MP3 audio file using Eleven Labs text-to-speech API.
- **1.5 Audio Delivery:** Sends the produced podcast audio file to a specified email address using Gmail.

Each block is supported by memory buffer nodes to maintain conversational context for their respective AI agents. The design facilitates modularity, allowing easy swapping or disabling of any stage without breaking the flow.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  Initiates the workflow by receiving a chat message that contains the podcast topic seed from the user.

- **Nodes Involved:**  
  - When chat message received  
  - Sticky Note ("Chat Trigger Message")

- **Node Details:**

  - **When chat message received**  
    - **Type & Role:** Chat Trigger node (Langchain) that listens for incoming chat messages to start the workflow.  
    - **Configuration:** Default parameters; no filters or conditions applied.  
    - **Expressions/Variables:** Outputs the raw user input as `{{$json}}`.  
    - **Connections:** Triggers "Podcast Idea/Topic Agent" node.  
    - **Edge Cases:**  
      - Missing or empty input message may result in no meaningful downstream output.  
      - Authentication or message delivery issues could prevent trigger activation.  
    - **Sticky Note:** "Chat Trigger Message" — denotes the start point.

#### 2.2 Podcast Idea Generation

- **Overview:**  
  Generates a specific, compelling podcast episode idea in a conversational style inspired by Joe Rogan and Steven Bartlett, based on the user’s seed topic.

- **Nodes Involved:**  
  - Podcast Idea/Topic Agent  
  - OpenAI Chat Model  
  - Simple Memory  
  - Sticky Note1 ("Podcast Idea Generator Agent")

- **Node Details:**

  - **Podcast Idea/Topic Agent**  
    - **Type & Role:** Langchain Agent node orchestrating the idea generation using an AI language model.  
    - **Configuration:**  
      - Uses system prompt defining role as a podcast idea generator with constraints on tone, content, and output format.  
      - Outputs a JSON string with one field containing the episode idea.  
    - **Connections:**  
      - Input: Receives from "When chat message received".  
      - Output: Feeds into "Podcast Script Agent".  
    - **Edge Cases:**  
      - Improper prompt formatting or malformed JSON output from the model could cause parsing errors downstream.  
      - API rate limits or credential issues with OpenAI.  
    - **Sub-workflow:** None.  
    - **Sticky Note:** "Podcast Idea Generator Agent".

  - **OpenAI Chat Model**  
    - **Type & Role:** Language Model node using OpenAI GPT-4 (mini variant) underlying the Podcast Idea Agent.  
    - **Configuration:** Selected model "gpt-4.1-mini" for balanced performance and cost.  
    - **Credentials:** Requires OpenAI API key.  
    - **Connections:** Feeds into Podcast Idea Agent as AI language model.  
    - **Edge Cases:** API key invalid or quota exceeded.

  - **Simple Memory**  
    - **Type & Role:** MemoryBufferWindow node that stores conversation context for the Podcast Idea Agent.  
    - **Configuration:** Default buffer window size; accumulates past interactions to maintain context.  
    - **Connections:** Linked to Podcast Idea Agent as AI memory.  
    - **Edge Cases:** Memory overflow or unintended context mixing if reused improperly.

#### 2.3 Podcast Script Generation

- **Overview:**  
  Expands the podcast idea into a natural, engaging, roughly 60-second introductory monologue script using Claude Sonnet, styled for solo podcasting.

- **Nodes Involved:**  
  - Podcast Script Agent  
  - Anthropic Chat Model  
  - Simple Memory1  
  - Sticky Note2 ("Podcast Script Generator")

- **Node Details:**

  - **Podcast Script Agent**  
    - **Type & Role:** Langchain Agent node that generates the podcast intro script from the idea text.  
    - **Configuration:**  
      - System prompt defines strict style and structure rules mimicking Joe Rogan and Steven Bartlett’s tone.  
      - Ensures output is ready for text-to-speech with no extraneous markup or instructions.  
    - **Connections:**  
      - Input: Receives JSON output from Podcast Idea/Topic Agent.  
      - Output: Sent to Eleven Labs TTS request.  
    - **Edge Cases:**  
      - Script output may be too long or short if prompt constraints are not enforced.  
      - Language model failures or unexpected formatting.  
    - **Sticky Note:** "Podcast Script Generator".

  - **Anthropic Chat Model**  
    - **Type & Role:** Language Model node using Anthropic Claude Sonnet 4 for script generation.  
    - **Configuration:** Selected model "claude-sonnet-4-20250514" cached under "Claude 4 Sonnet".  
    - **Credentials:** Requires Anthropic API key.  
    - **Connections:** Feeds into Podcast Script Agent as AI language model.  
    - **Edge Cases:** API or credential issues; latency or request throttling.

  - **Simple Memory1**  
    - **Type & Role:** MemoryBufferWindow node for the Podcast Script Agent’s conversational context.  
    - **Configuration:** Default buffer to maintain agent memory window.  
    - **Connections:** Linked as AI memory for Podcast Script Agent.  
    - **Edge Cases:** Same as Simple Memory.

#### 2.4 Text-to-Speech Conversion

- **Overview:**  
  Converts the generated podcast intro script text into an MP3 audio file using Eleven Labs’ API.

- **Nodes Involved:**  
  - Eleven Labs Text-to-Speech  
  - Sticky Note3 ("Eleven Labs POST Request")

- **Node Details:**

  - **Eleven Labs Text-to-Speech**  
    - **Type & Role:** HTTP Request node that calls Eleven Labs TTS API.  
    - **Configuration:**  
      - POST request to `https://api.elevenlabs.io/v1/text-to-speech/YOUR_VOICE_ID` (voice ID must be set).  
      - Body includes the script text and model_id `eleven_multilingual_v2`.  
      - Query parameter requests output format `mp3_44100_128`.  
      - Header contains API key `xi-api-key`.  
    - **Expressions:** Uses `{{$json.output}}` from Podcast Script Agent as speech text input.  
    - **Edge Cases:**  
      - Invalid or missing API key.  
      - Incorrect voice ID or unsupported model.  
      - Network timeouts or large input size issues.  
    - **Sticky Note:** "Eleven Labs POST Request".

#### 2.5 Audio Delivery

- **Overview:**  
  Emails the generated podcast audio file as an MP3 attachment to a specified email address.

- **Nodes Involved:**  
  - Send a message (Gmail)  
  - Sticky Note4 ("Send Audio File to Email")

- **Node Details:**

  - **Send a message**  
    - **Type & Role:** Gmail node to send emails with attachments.  
    - **Configuration:**  
      - Sends to `your-email@example.com` (should be customized).  
      - Subject: "Podcast Audio File".  
      - Attaches audio binary from previous node output.  
    - **Credentials:** Requires Gmail OAuth2 credentials.  
    - **Edge Cases:**  
      - Authentication failures or expired tokens.  
      - Attachment size limits by Gmail.  
      - Invalid recipient email.  
    - **Sticky Note:** "Send Audio File to Email".

---

### 3. Summary Table

| Node Name                  | Node Type                             | Functional Role                 | Input Node(s)                 | Output Node(s)                | Sticky Note                    |
|----------------------------|-------------------------------------|--------------------------------|------------------------------|------------------------------|-------------------------------|
| When chat message received | Langchain Chat Trigger              | Trigger input from user topic  |                              | Podcast Idea/Topic Agent      | Chat Trigger Message           |
| Podcast Idea/Topic Agent    | Langchain Agent                    | Generate podcast episode idea  | When chat message received    | Podcast Script Agent          | Podcast Idea Generator Agent  |
| OpenAI Chat Model           | Langchain LM Chat OpenAI           | OpenAI GPT-4 model for idea    |                              | Podcast Idea/Topic Agent      |                               |
| Simple Memory               | Langchain Memory Buffer Window     | Memory for Podcast Idea Agent  |                              | Podcast Idea/Topic Agent      |                               |
| Podcast Script Agent        | Langchain Agent                    | Generate podcast intro script  | Podcast Idea/Topic Agent      | Eleven Labs Text-to-Speech   | Podcast Script Generator       |
| Anthropic Chat Model        | Langchain LM Chat Anthropic        | Claude Sonnet model for script |                              | Podcast Script Agent          |                               |
| Simple Memory1              | Langchain Memory Buffer Window     | Memory for Podcast Script Agent|                              | Podcast Script Agent          |                               |
| Eleven Labs Text-to-Speech  | HTTP Request                      | Convert script text to audio   | Podcast Script Agent          | Send a message               | Eleven Labs POST Request       |
| Send a message             | Gmail                             | Email audio file to user       | Eleven Labs Text-to-Speech    |                              | Send Audio File to Email       |
| Sticky Note                | Sticky Note                      | Visual annotation              |                              |                              | Chat Trigger Message           |
| Sticky Note1               | Sticky Note                      | Visual annotation              |                              |                              | Podcast Idea Generator Agent   |
| Sticky Note2               | Sticky Note                      | Visual annotation              |                              |                              | Podcast Script Generator       |
| Sticky Note3               | Sticky Note                      | Visual annotation              |                              |                              | Eleven Labs POST Request       |
| Sticky Note4               | Sticky Note                      | Visual annotation              |                              |                              | Send Audio File to Email       |
| Sticky Note5               | Sticky Note                      | YouTube video link             |                              |                              | @[youtube](Dan3_W1JoqU)        |
| Sticky Note6               | Sticky Note                      | Workflow description & tips   |                              |                              | Podcast on Autopilot overview  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Chat Trigger Node**  
   - Add **Langchain Chat Trigger** node named `When chat message received`.  
   - Use default settings to listen for incoming chat messages.

2. **Create Podcast Idea Agent**  
   - Add **Langchain Agent** node named `Podcast Idea/Topic Agent`.  
   - Set system message prompt defining role as Podcast Idea Generator with the detailed prompt given (conversational, Rogan/Bartlett style, JSON output).  
   - Connect input from `When chat message received`.  

3. **Add OpenAI Chat Model Node**  
   - Add **Langchain LM Chat OpenAI** node named `OpenAI Chat Model`.  
   - Select model `gpt-4.1-mini`.  
   - Configure OpenAI API credentials (OpenAI API key).  
   - Connect output to `Podcast Idea/Topic Agent` as AI language model.

4. **Add Simple Memory Node (Idea Agent Memory)**  
   - Add **Langchain Memory Buffer Window** node named `Simple Memory`.  
   - Connect as AI memory for `Podcast Idea/Topic Agent`.

5. **Create Podcast Script Agent**  
   - Add **Langchain Agent** node named `Podcast Script Agent`.  
   - Set system prompt for writing a natural, 60-second podcast intro script in the specified style and constraints (as provided).  
   - Connect input from `Podcast Idea/Topic Agent`.

6. **Add Anthropic Chat Model Node**  
   - Add **Langchain LM Chat Anthropic** node named `Anthropic Chat Model`.  
   - Select model `claude-sonnet-4-20250514`.  
   - Configure Anthropic API credentials.  
   - Connect output to `Podcast Script Agent` as AI language model.

7. **Add Simple Memory Node (Script Agent Memory)**  
   - Add **Langchain Memory Buffer Window** node named `Simple Memory1`.  
   - Connect as AI memory for `Podcast Script Agent`.

8. **Add Eleven Labs Text-to-Speech HTTP Request Node**  
   - Add **HTTP Request** node named `Eleven Labs Text-to-Speech`.  
   - Configure as POST to `https://api.elevenlabs.io/v1/text-to-speech/YOUR_VOICE_ID` (replace with actual voice ID).  
   - Body parameters: text from `Podcast Script Agent` output, model_id = `eleven_multilingual_v2`.  
   - Query parameter: output_format = `mp3_44100_128`.  
   - Header: `xi-api-key` with Eleven Labs API key.  
   - Connect input from `Podcast Script Agent`.

9. **Add Gmail Node to Send Email**  
   - Add **Gmail** node named `Send a message`.  
   - Set recipient email (`sendTo`) to your desired address.  
   - Subject: "Podcast Audio File".  
   - Attach the binary data from `Eleven Labs Text-to-Speech`.  
   - Configure Gmail OAuth2 credentials.  
   - Connect input from `Eleven Labs Text-to-Speech`.

10. **Connect Workflow**  
    - Connect nodes in sequence:  
      `When chat message received` → `Podcast Idea/Topic Agent` → `Podcast Script Agent` → `Eleven Labs Text-to-Speech` → `Send a message`.

11. **Optional: Add Sticky Notes**  
    - Add sticky notes to document each block’s purpose and overview for easier maintenance.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                    | Context or Link                                  |
|-------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------|
| Podcast on Autopilot — Generate Podcast Ideas, Scripts & Audio Automatically. Workflow demo and explanation video available.                    | https://www.youtube.com/watch?v=Dan3_W1JoqU     |
| Customization tips: swap TTS provider, modify prompt styles, change email destination, or scale with variables for episode metadata.             | Workflow sticky note content                      |
| Requires API keys for OpenAI, Anthropic, and ElevenLabs; manage costs and avoid sensitive data in prompts.                                       | Workflow sticky note content                      |
| Example opening lines prompt style inspired by Joe Rogan and Steven Bartlett to keep tone engaging and relatable.                               | Podcast Script Agent node prompt                  |
| Workflow is modular: Idea → Script → Voice → Email stages can be disabled or replaced independently without breaking the chain.                  | Workflow sticky note content                      |

---

**Disclaimer:**  
The text provided is extracted solely from an n8n automated workflow. It complies strictly with content policies and excludes any illegal, offensive, or protected materials. All processed data is legal and publicly available.