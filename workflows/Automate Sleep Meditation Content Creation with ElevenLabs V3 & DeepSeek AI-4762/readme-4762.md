Automate Sleep Meditation Content Creation with ElevenLabs V3 & DeepSeek AI

https://n8nworkflows.xyz/workflows/automate-sleep-meditation-content-creation-with-elevenlabs-v3---deepseek-ai-4762


# Automate Sleep Meditation Content Creation with ElevenLabs V3 & DeepSeek AI

---

### 1. Workflow Overview

This workflow automates the creation of sleep meditation content by leveraging AI language models, video search, and text-to-speech synthesis with ElevenLabs V3. It targets content creators or marketers who want to generate meditation video scripts, corresponding titles, and voiceovers, then automatically save the outputs to Google Drive.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception & Validation:** Receives and validates user style input through a webhook and code node.
- **1.2 Query Generation & Filtering:** Generates a search query from the input, ensures it is a single string, and filters out explicit content.
- **1.3 Video Search & Title Aggregation:** Searches videos based on the query, splits and removes duplicate titles, then aggregates unique titles.
- **1.4 Script Generation & Parsing:** Uses AI models to generate meditation scripts, auto-fixes output formatting and parses structured content.
- **1.5 Voiceover Generation:** Converts the final script to speech using ElevenLabs TTS nodes.
- **1.6 Output Storage:** Uploads the generated voiceover files to Google Drive for archival or further use.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Validation

- **Overview:** This block collects the initial style parameters through a webhook, performs input validation to ensure correct format, then prepares the input for downstream AI processing.
- **Nodes Involved:** `Style Input`, `input_validation`

- **Node Details:**

  - **Style Input**  
    - Type: Webhook  
    - Role: Entry point that accepts HTTP requests containing style parameters for meditation content.  
    - Config: Standard webhook listener with no additional parameters.  
    - Inputs: External HTTP request  
    - Outputs: Passes data to `input_validation`  
    - Edge Cases: Invalid or missing webhook payload, request timeout.
  
  - **input_validation**  
    - Type: Code  
    - Role: Validates and sanitizes the incoming style input, ensuring it fits expected schema before AI chain processing.  
    - Config: Custom JavaScript code (details not exposed)  
    - Inputs: From `Style Input` webhook  
    - Outputs: Passes validated input to `Search Query Generator`  
    - Edge Cases: Input format errors, unexpected data types causing script failure.

#### 2.2 Query Generation & Filtering

- **Overview:** This block generates a search query string via AI, ensures it is a single string, filters explicit content, and prevents inappropriate queries from proceeding.
- **Nodes Involved:** `Search Query Generator`, `Ensure Query is single string`, `Explicity Filter`

- **Node Details:**

  - **Search Query Generator**  
    - Type: Chain LLM (Language Model)  
    - Role: Transforms validated input into a comprehensive video search query using AI.  
    - Config: Uses DeepSeek Chat Model as the AI provider.  
    - Inputs: Validated input from `input_validation`  
    - Outputs: Passes query to `Video Search` and structured parsers.  
    - Edge Cases: Model response failures, empty or malformed queries.
  
  - **Ensure Query is single string**  
    - Type: Structured Output Parser  
    - Role: Validates that the generated query is a single string, correcting or rejecting multi-part outputs.  
    - Inputs: Output from `DeepSeek Chat Model` linked to the query generation  
    - Outputs: Passes single string query to `Search Query Generator`  
    - Edge Cases: Parsing errors, multiple string outputs.
  
  - **Explicity Filter**  
    - Type: Text Classifier  
    - Role: Detects and filters out explicit or inappropriate content from queries before they proceed.  
    - Inputs: Output from `Remove Exact Duplicates` (downstream in title processing) and from `DeepSeek Chat Model` AI model.  
    - Outputs: If clean, forwards to `Aggregate Titles`; if flagged, stops or branches differently.  
    - Edge Cases: False positives/negatives in content classification.

#### 2.3 Video Search & Title Aggregation

- **Overview:** Performs a video search using the clean query, processes and deduplicates titles, and aggregates them for title generation.
- **Nodes Involved:** `Video Search`, `Split Out`, `Remove Exact Duplicates`, `Aggregate Titles`

- **Node Details:**

  - **Video Search**  
    - Type: Brave Search API integration  
    - Role: Searches Brave Search for relevant videos matching the AI-generated query string.  
    - Inputs: Query string from `Search Query Generator`  
    - Outputs: Passes search results to `Split Out`  
    - Edge Cases: API rate limits, network errors, empty search results.
  
  - **Split Out**  
    - Type: Split Out  
    - Role: Splits the search result array into individual items for further processing.  
    - Inputs: Search results array from `Video Search`  
    - Outputs: Each item passed to `Remove Exact Duplicates`  
    - Edge Cases: Empty arrays, malformed input data.
  
  - **Remove Exact Duplicates**  
    - Type: Remove Duplicates  
    - Role: Removes duplicate video titles to ensure uniqueness in aggregation.  
    - Inputs: Individual video titles from `Split Out`  
    - Outputs: Unique titles to `Explicity Filter`  
    - Edge Cases: Potential edge cases with case sensitivity or whitespace differences.
  
  - **Aggregate Titles**  
    - Type: Aggregate  
    - Role: Aggregates unique titles back into a list for input into the Title Generator AI.  
    - Inputs: Clean titles from `Explicity Filter`  
    - Outputs: Passes aggregated titles to `Title Generator`  
    - Edge Cases: Large number of titles causing performance issues.

#### 2.4 Script Generation & Parsing

- **Overview:** Generates meditation scripts using an AI agent, auto-fixes output formatting, and parses structured data for further processing.
- **Nodes Involved:** `Title Generator`, `VO Gen`, `Auto-fixing Output Parser`, `Auto-fixing Output Parser1`, `Script No Comments`, `Video Object Checker`

- **Node Details:**

  - **Title Generator**  
    - Type: AI Agent (LangChain Agent)  
    - Role: Generates video titles based on aggregated titles and AI input.  
    - Inputs: Aggregated titles from `Aggregate Titles`  
    - Outputs: Passes generated titles to `VO Gen` and auto-fixing parsers  
    - Edge Cases: Model timeouts, generation of irrelevant titles.
  
  - **VO Gen**  
    - Type: AI Agent (LangChain Agent)  
    - Role: Generates the voiceover script content for the meditation video.  
    - Inputs: Titles and AI outputs from `Title Generator`  
    - Outputs: Passes scripts to `TTS Voiceover` and output parsers  
    - Edge Cases: Model output errors, script incoherence.
  
  - **Auto-fixing Output Parser**  
    - Type: Output Parser Autofixing  
    - Role: Automatically fixes formatting issues in AI-generated titles before final use.  
    - Inputs: AI outputs from `DeepSeek Chat Model` and `Video Object Checker`  
    - Outputs: Cleaned titles to `Title Generator`  
    - Edge Cases: Parsing errors if output format is severely corrupted.
  
  - **Auto-fixing Output Parser1**  
    - Type: Output Parser Autofixing  
    - Role: Fixes formatting issues in the generated voiceover scripts.  
    - Inputs: Output from `Script No Comments`  
    - Outputs: Passes cleaned script to `VO Gen`  
    - Edge Cases: Similar to above, format errors.
  
  - **Script No Comments**  
    - Type: Structured Output Parser  
    - Role: Parses the AI-generated meditation script, likely removing comments or extraneous information for clarity.  
    - Inputs: AI-generated scripts from `DeepSeek Chat Model`  
    - Outputs: Passes to `Auto-fixing Output Parser1`  
    - Edge Cases: Parsing failures on unexpected script formats.
  
  - **Video Object Checker**  
    - Type: Structured Output Parser  
    - Role: Checks the structure of the video object data ensuring it fits expected schema.  
    - Inputs: AI outputs from `DeepSeek Chat Model`  
    - Outputs: Passes to `Auto-fixing Output Parser`  
    - Edge Cases: Schema mismatches.

#### 2.5 Voiceover Generation

- **Overview:** Converts the finalized meditation script into a voiceover audio file using ElevenLabs’ TTS API.
- **Nodes Involved:** `VO Gen`, `TTS Voiceover`

- **Node Details:**

  - **VO Gen** (also part of script generation)  
    - Outputs cleaned script text for voiceover.
  
  - **TTS Voiceover**  
    - Type: ElevenLabs TTS Node  
    - Role: Synthesizes voiceover audio from the meditation script text.  
    - Config: Uses ElevenLabs API credentials; voice and style parameters presumably set dynamically.  
    - Inputs: Script text from `VO Gen`  
    - Outputs: Audio file to `Google Drive` node  
    - Edge Cases: API quota exceeded, audio synthesis failures, network timeouts.

#### 2.6 Output Storage

- **Overview:** Uploads generated audio files to Google Drive for storage and distribution.
- **Nodes Involved:** `TTS Voiceover`, `Google Drive`

- **Node Details:**

  - **Google Drive**  
    - Type: Google Drive Integration  
    - Role: Uploads generated voiceover audio files to a specified Google Drive folder.  
    - Config: Requires Google Drive OAuth2 credentials and folder ID configuration.  
    - Inputs: Audio data from `TTS Voiceover`  
    - Outputs: Final step; may return file URL or ID for downstream use.  
    - Edge Cases: Auth failures, insufficient permissions, quota limits.

---

### 3. Summary Table

| Node Name                  | Node Type                                  | Functional Role                    | Input Node(s)                | Output Node(s)                 | Sticky Note                                     |
|----------------------------|--------------------------------------------|----------------------------------|------------------------------|-------------------------------|------------------------------------------------|
| Style Input                | Webhook                                    | Entry point for style input       | External HTTP request         | input_validation              |                                                |
| input_validation           | Code                                       | Validates and sanitizes input     | Style Input                  | Search Query Generator         |                                                |
| Search Query Generator     | Chain LLM                                  | Generates search query            | input_validation             | Video Search                  |                                                |
| Ensure Query is single string | Structured Output Parser                   | Ensures query is a single string  | DeepSeek Chat Model          | Search Query Generator         |                                                |
| Video Search               | Brave Search API Integration                | Searches videos with query        | Search Query Generator       | Split Out                    |                                                |
| Split Out                  | Split Out                                  | Splits search results array       | Video Search                 | Remove Exact Duplicates        |                                                |
| Remove Exact Duplicates    | Remove Duplicates                           | Removes duplicate video titles    | Split Out                   | Explicity Filter              |                                                |
| Explicity Filter           | Text Classifier                            | Filters explicit content          | Remove Exact Duplicates      | Aggregate Titles              |                                                |
| Aggregate Titles           | Aggregate                                  | Aggregates unique titles          | Explicity Filter             | Title Generator              |                                                |
| Title Generator            | AI Agent (LangChain Agent)                  | Generates video titles            | Aggregate Titles            | VO Gen, Auto-fixing Output Parser |                                                |
| VO Gen                    | AI Agent (LangChain Agent)                  | Generates meditation scripts      | Title Generator             | TTS Voiceover, Output Parsers  |                                                |
| Auto-fixing Output Parser  | Output Parser Autofixing                    | Fixes AI-generated titles format | DeepSeek Chat Model, Video Object Checker | Title Generator           |                                                |
| Auto-fixing Output Parser1 | Output Parser Autofixing                    | Fixes AI-generated scripts format| Script No Comments           | VO Gen                       |                                                |
| Script No Comments         | Structured Output Parser                     | Parses and cleans scripts         | DeepSeek Chat Model          | Auto-fixing Output Parser1    |                                                |
| Video Object Checker       | Structured Output Parser                     | Validates video object structure  | DeepSeek Chat Model          | Auto-fixing Output Parser     |                                                |
| DeepSeek Chat Model        | AI Language Model                           | Core AI processing engine         | — (invoked internally)       | Multiple AI parsers and chains|                                                |
| TTS Voiceover              | ElevenLabs TTS                              | Synthesizes voiceover audio       | VO Gen                      | Google Drive                 |                                                |
| Google Drive               | Google Drive Integration                    | Uploads audio files               | TTS Voiceover               | —                            |                                                |
| Sticky Note (various)      | Sticky Note                                | Comments and annotations          | —                           | —                            | None of the sticky notes contain content here. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Name: `Style Input`  
   - Type: Webhook  
   - Configure with a unique webhook URL to receive style input parameters.

2. **Add Code Node for Input Validation**  
   - Name: `input_validation`  
   - Type: Code  
   - Connect input from `Style Input`.  
   - Write JavaScript to validate and sanitize webhook data. Ensure proper format for downstream AI usage.

3. **Add AI Chain LLM Node to Generate Search Query**  
   - Name: `Search Query Generator`  
   - Type: Chain LLM (LangChain)  
   - Set the language model to `DeepSeek Chat Model` (configured later).  
   - Connect input from `input_validation`.

4. **Add Structured Output Parser to Ensure Single String Query**  
   - Name: `Ensure Query is single string`  
   - Type: Structured Output Parser  
   - Connect AI output from `DeepSeek Chat Model` to this node.  
   - Connect output to `Search Query Generator` (loop for correction).

5. **Add Brave Search Node**  
   - Name: `Video Search`  
   - Type: Brave Search integration node  
   - Connect input from `Search Query Generator`.  
   - Configure API credentials for Brave Search.

6. **Add Split Out Node**  
   - Name: `Split Out`  
   - Type: Split Out  
   - Connect input from `Video Search` results.

7. **Add Remove Duplicates Node**  
   - Name: `Remove Exact Duplicates`  
   - Type: Remove Duplicates  
   - Connect input from `Split Out`.

8. **Add Text Classifier Node for Explicit Content Filtering**  
   - Name: `Explicity Filter`  
   - Type: Text Classifier  
   - Connect input from `Remove Exact Duplicates`.  
   - Configure to detect and filter explicit content.

9. **Add Aggregate Node**  
   - Name: `Aggregate Titles`  
   - Type: Aggregate  
   - Connect input from `Explicity Filter`.

10. **Add AI Agent Node for Title Generation**  
    - Name: `Title Generator`  
    - Type: LangChain Agent  
    - Connect input from `Aggregate Titles`.  
    - Configure with `DeepSeek Chat Model` as language model.

11. **Add AI Agent Node for Voiceover Script Generation**  
    - Name: `VO Gen`  
    - Type: LangChain Agent  
    - Connect input from `Title Generator`.  
    - Configure with same AI model.

12. **Add Output Parser Autofixing Nodes**  
    - Name: `Auto-fixing Output Parser` and `Auto-fixing Output Parser1`  
    - Type: Output Parser Autofixing  
    - Connect AI outputs accordingly: from `DeepSeek Chat Model` and `Script No Comments` respectively.

13. **Add Structured Output Parser Nodes**  
    - Name: `Script No Comments` and `Video Object Checker`  
    - Type: Structured Output Parser  
    - Connect inputs from `DeepSeek Chat Model` AI outputs.

14. **Add ElevenLabs TTS Node**  
    - Name: `TTS Voiceover`  
    - Type: ElevenLabs TTS  
    - Connect input from `VO Gen`.  
    - Configure ElevenLabs V3 API credentials and voice/style parameters.

15. **Add Google Drive Node**  
    - Name: `Google Drive`  
    - Type: Google Drive Integration  
    - Connect input from `TTS Voiceover`.  
    - Configure OAuth2 credentials and target folder for audio uploads.

16. **Configure DeepSeek Chat Model**  
    - Add AI Language Model node named `DeepSeek Chat Model`.  
    - Connect it as provider for all AI nodes requiring language model.  
    - Ensure appropriate API keys and model parameters are set.

17. **Connect all nodes as per the logical flow described in the Workflow Overview.**

---

### 5. General Notes & Resources

| Note Content                                                                                       | Context or Link                       |
|--------------------------------------------------------------------------------------------------|-------------------------------------|
| This workflow automates meditation content creation combining AI-generated scripts and voiceovers. | Workflow purpose                     |
| ElevenLabs V3 API is utilized for high-quality TTS voiceover generation.                          | ElevenLabs TTS integration           |
| Brave Search API is used for video content discovery based on AI-generated queries.                | Video searching mechanism            |
| Validate input strictly at webhook to prevent invalid data propagation through AI models.         | Input validation best practice       |
| Use of auto-fixing parsers improves robustness of AI output handling.                             | Output parsing and error resilience  |
| Google Drive is the final storage location for generated voiceover files, enabling easy access.   | Output storage and management        |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects current content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and publicly available.

---