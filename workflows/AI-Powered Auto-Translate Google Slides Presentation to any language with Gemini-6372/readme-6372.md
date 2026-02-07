AI-Powered Auto-Translate Google Slides Presentation to any language with Gemini

https://n8nworkflows.xyz/workflows/ai-powered-auto-translate-google-slides-presentation-to-any-language-with-gemini-6372


# AI-Powered Auto-Translate Google Slides Presentation to any language with Gemini

### 1. Workflow Overview

This workflow automates the process of translating a Google Slides presentation from any source language into a target language, leveraging Google APIs and AI-powered translation with Google Gemini (PaLM). Its primary use case is to preserve the original slide formatting and structure while translating all the slide text content accurately and contextually.

The workflow’s logic is divided into the following functional blocks:

- **1.1 Input Reception & Initialization:** Triggering the workflow manually or via a sub-workflow call, setting the target language, and duplicating the source presentation to work on a copy.
- **1.2 Slide Extraction & Text Handling:** Retrieving slides from the duplicated presentation, extracting all textual elements from each slide, and splitting them for batch processing.
- **1.3 AI-Powered Translation:** Using Google Gemini AI combined with Google Translate API to translate extracted texts according to specific guidelines.
- **1.4 Slide Text Replacement:** Applying the translated text back into the duplicated Google Slides presentation, preserving formatting.
- **1.5 Orchestration & Timing Controls:** Managing execution flow, including batching, waiting periods, and recursive workflow calls to ensure API limits and contextual accuracy.

---

### 2. Block-by-Block Analysis

---

#### 2.1 Input Reception & Initialization

- **Overview:**  
  This block handles the workflow trigger, sets the target language for translation, and creates a duplicate of the original Google Slides presentation to avoid modifying the source directly.

- **Nodes Involved:**  
  - When clicking ‘Execute workflow’ (Manual Trigger)  
  - Set Language  
  - Duplicate presentation  

- **Node Details:**

  - **When clicking ‘Execute workflow’**  
    - Type: Manual Trigger  
    - Role: Entry point to start the workflow manually  
    - Configuration: No parameters  
    - Connections: Output → Set Language  
    - Edge cases: None specific, manual execution requires user action  

  - **Set Language**  
    - Type: Set (Data assignment)  
    - Role: Defines the target language for translation  
    - Configuration: Assigns variable `lang` with ISO-639 code string (default `"zh-CN"`)  
    - Key expressions: `lang = "zh-CN"` (modifiable)  
    - Connections: Input ← When clicking ‘Execute workflow’, Output → Duplicate presentation  
    - Edge cases: Incorrect ISO-639 codes may cause translation errors; user must set correctly per instructions on sticky note  

  - **Duplicate presentation**  
    - Type: Google Drive (Copy file operation)  
    - Role: Creates a copy of the source presentation to translate  
    - Configuration:  
      - Operation: Copy  
      - `name`: Dynamic, e.g. `"Presentation_{{ $json.lang }}_{{$now.format('yyyyLLddHHii')}}"`  
      - `fileId`: Hardcoded to the source presentation to translate (must be configured by user)  
    - Credentials: Google Drive OAuth2  
    - Connections: Input ← Set Language, Output → Get slides from a presentation  
    - Edge cases:  
      - Invalid or inaccessible fileId causes failure  
      - Permission errors if OAuth credentials lack drive access  
    - Notes: User must update `fileId` to their source presentation ID  

---

#### 2.2 Slide Extraction & Text Handling

- **Overview:**  
  Extracts all slides from the duplicated presentation, then processes each slide to extract all textual content elements for translation.

- **Nodes Involved:**  
  - Get slides from a presentation  
  - Loop Over Items (splitInBatches)  
  - Extract Text (Code)  
  - Split Out  

- **Node Details:**

  - **Get slides from a presentation**  
    - Type: Google Slides API (Get slides)  
    - Role: Retrieves metadata and content of all slides in the duplicated presentation  
    - Configuration:  
      - Operation: `getSlides`  
      - Presentation ID: Dynamic, from duplicated presentation (`={{ $json.id }}`)  
    - Credentials: Google Slides OAuth2  
    - Input: From Duplicate presentation  
    - Output: To Loop Over Items  
    - Edge cases:  
      - Invalid or expired OAuth tokens  
      - Incorrect presentationId  
      - API rate limits  

  - **Loop Over Items**  
    - Type: SplitInBatches  
    - Role: Processes slides in batches to avoid API overload and manage memory  
    - Configuration: Default batch size (not explicitly set, uses default)  
    - Input: From Get slides from a presentation  
    - Output 1: To Extract Text  
    - Edge cases: Large presentations may require tuning batch size  

  - **Extract Text**  
    - Type: Code (JavaScript)  
    - Role: For each slide, extracts all textual content elements and returns them alongside the slide’s objectId  
    - Configuration: Custom JS code parses slide JSON, extracts textRuns from textElements within pageElements  
    - Input: From Loop Over Items (slide objects)  
    - Output: Array of objects each with `{ objectId, extractTexts }`  
    - Edge cases:  
      - Slides with no text elements result in empty arrays  
      - Non-text shapes ignored  
      - Unexpected JSON structure changes from Google API could break extraction  

  - **Split Out**  
    - Type: SplitOut  
    - Role: Splits the extracted texts array into individual items for downstream processing  
    - Configuration: Field to split out: `extractTexts`  
    - Input: From Extract Text  
    - Output: To Execute Workflow (recursive translation calls)  

---

#### 2.3 AI-Powered Translation

- **Overview:**  
  This block orchestrates AI translation of the slide texts using Google Gemini Chat Model and Google Translate API, guided by expert system prompts to ensure contextual and accurate translations.

- **Nodes Involved:**  
  - When Executed by Another Workflow (Execute Workflow Trigger)  
  - Translation expert (LangChain Agent)  
  - Google Gemini Chat Model  
  - Translate language (Google Translate tool)  
  - Wait 3 sec  

- **Node Details:**

  - **When Executed by Another Workflow**  
    - Type: ExecuteWorkflowTrigger  
    - Role: Entry point to process translation requests when invoked recursively  
    - Configuration: JSON example input with keys: `objectId`, `lang`, `presentationId`, `extractTexts`  
    - Output: To Translation expert  
    - Edge cases: Missing or malformed input parameters cause failures  

  - **Translation expert**  
    - Type: LangChain Agent (AI Agent)  
    - Role: Acts as a translation controller, applying system prompt rules, and directing usage of translation tools  
    - Configuration:  
      - Text input template: `Text to translate:\n{{ $json.extractTexts }}`  
      - System message: Detailed instructions on what to translate, what to exclude (emails, URLs, names, etc.), process steps, and quality standards  
      - Prompt type: Defined (not free text)  
    - Input: From When Executed by Another Workflow  
    - Output: To Wait 3 sec  
    - AI language model linked: Google Gemini Chat Model  
    - Tools linked for translation: Translate language, Translate Google Slides  
    - Edge cases:  
      - AI service unavailability or quota limits  
      - Incorrect input text format  
      - Timeout on AI response  

  - **Google Gemini Chat Model**  
    - Type: AI Language Model (Google PaLM Gemini)  
    - Role: Provides the underlying AI chat completion for the LangChain Agent  
    - Credentials: Google Palm API OAuth2  
    - Input: From Translation expert (as configured)  
    - Output: Back to Translation expert  
    - Edge cases: API limits, network errors, invalid API keys  

  - **Translate language**  
    - Type: Google Translate API Tool  
    - Role: Translates extracted texts into the target language specified in `lang`  
    - Credentials: Google Translate OAuth2  
    - Input: From Translation expert (via AI tool interface)  
    - Output: Feeds back translated text for further processing  
    - Edge cases: Incorrect language codes, API quota exhaustion  

  - **Wait 3 sec**  
    - Type: Wait  
    - Role: Allows a short delay to ensure ordered processing and API rate limit compliance  
    - Configuration: 3 seconds delay  
    - Input: From Translation expert  
    - Output: No next node explicitly connected (used for timing control)  

---

#### 2.4 Slide Text Replacement

- **Overview:**  
  Applies the translated text back into the duplicated Google Slides presentation, replacing original text elements while preserving formatting and slide layout.

- **Nodes Involved:**  
  - Translate Google Slides  

- **Node Details:**

  - **Translate Google Slides**  
    - Type: Google Slides Tool (Replace Text operation)  
    - Role: Replaces specified text on a slide page with the translated text  
    - Configuration:  
      - Operation: `replaceText`  
      - `textValues`: An array of objects defining text replacement, matched case, and pageObjectIds  
      - Uses dynamic expressions fetching values from the "When Executed by Another Workflow" node's JSON input to get `objectId` and `presentationId`  
    - Credentials: Google Slides OAuth2  
    - Input: Connected as AI tool from Translation expert (triggered internally)  
    - Edge cases:  
      - Incorrect objectId or presentationId causes failures  
      - API limits on text replacement calls  
      - Text matching failures if source text differs from expected  

---

#### 2.5 Orchestration & Timing Controls

- **Overview:**  
  Manages the workflow execution flow, including recursive calls for each text batch and timing delays to respect API constraints.

- **Nodes Involved:**  
  - Execute Workflow  
  - Wait 10 sec  

- **Node Details:**

  - **Execute Workflow**  
    - Type: Execute Workflow (Recursive self-call)  
    - Role: Calls the same workflow for batch translation of slide text chunks with parameters: language, objectId, presentationId, extracted texts  
    - Configuration:  
      - Workflow ID: Self (`RsBtAMu8K66veIXY`)  
      - Inputs mapped from previous nodes (`Set Language`, `Extract Text`, `Duplicate presentation`)  
    - Input: From Split Out (individual text items)  
    - Output: To Wait 10 sec  
    - Edge cases:  
      - Recursive depth limits or infinite loops if not handled  
      - Parameter mapping errors  

  - **Wait 10 sec**  
    - Type: Wait  
    - Role: Delays next batch processing to avoid API rate limiting and ensure order  
    - Configuration: 10 seconds  
    - Input: From Execute Workflow  
    - Output: Loops back to Loop Over Items to process next batch  

---

### 3. Summary Table

| Node Name                  | Node Type                          | Functional Role                              | Input Node(s)                 | Output Node(s)               | Sticky Note                                                                                                               |
|----------------------------|----------------------------------|----------------------------------------------|------------------------------|-----------------------------|---------------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger                   | Entry point to start workflow manually       |                              | Set Language                |                                                                                                                           |
| Set Language               | Set                              | Defines target translation language           | When clicking ‘Execute workflow’ | Duplicate presentation      | ## STEP 1 Important: Set the "Set Language" node with the language code [ISO-639](https://cloud.google.com/translate/docs/languages) |
| Duplicate presentation     | Google Drive (copy operation)    | Copies the source presentation for translation | Set Language                  | Get slides from a presentation | ## STEP 2 In the node "Duplicate presentation" set up the source presentation to translate                                   |
| Get slides from a presentation | Google Slides (getSlides)       | Retrieves all slides from duplicated presentation | Duplicate presentation         | Loop Over Items             |                                                                                                                           |
| Loop Over Items            | SplitInBatches                   | Batches slides for processing                  | Get slides from a presentation | Extract Text (batch 1), Extract Text (batch 2) |                                                                                                                           |
| Extract Text               | Code (JavaScript)                | Extracts all text elements from each slide     | Loop Over Items               | Split Out                   |                                                                                                                           |
| Split Out                  | SplitOut                        | Splits extracted texts for individual processing | Extract Text                  | Execute Workflow            |                                                                                                                           |
| Execute Workflow           | Execute Workflow (recursive call) | Recursively calls this workflow for translation of text batches | Split Out                    | Wait 10 sec                 |                                                                                                                           |
| Wait 10 sec                | Wait                            | Delays batch processing to respect API limits | Execute Workflow              | Loop Over Items             |                                                                                                                           |
| When Executed by Another Workflow | ExecuteWorkflowTrigger          | Receives parameters for recursive translation call |                              | Translation expert          |                                                                                                                           |
| Translation expert         | LangChain Agent (AI Agent)       | Orchestrates translation using Google Gemini and Google Translate | When Executed by Another Workflow | Wait 3 sec                  |                                                                                                                           |
| Google Gemini Chat Model   | AI Language Model (Google PaLM)  | Provides AI language model backend              | Translation expert            | Translation expert          |                                                                                                                           |
| Translate language         | Google Translate Tool            | Translates texts into target language            | Translation expert (ai_tool)  | Translation expert          |                                                                                                                           |
| Translate Google Slides    | Google Slides Tool               | Replaces original slide texts with translated text | Translation expert (ai_tool)  |                             |                                                                                                                           |
| Wait 3 sec                 | Wait                            | Short delay to pace translation requests        | Translation expert            |                             |                                                                                                                           |
| Sticky Note                | Sticky Note                     | Informational / instructional note               |                              |                             | ## AI-Powered Auto-Translate Google Slides Presentation to any language ... DISCLAIMER about text splitting by API         |
| Sticky Note1               | Sticky Note                     | Instruction to set language in Set Language node |                              |                             | ## STEP 1 - Set the language in ISO-639 format                                                                           |
| Sticky Note2               | Sticky Note                     | Instruction to configure source presentation in Duplicate presentation node |                              |                             | ## STEP 2 - Set the source presentation ID                                                                                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger Node**  
   - Name: `When clicking ‘Execute workflow’`  
   - Purpose: To manually start the workflow.

2. **Create a Set Node**  
   - Name: `Set Language`  
   - Purpose: Define the target language ISO-639 code for translation (default `"zh-CN"`).  
   - Configuration: Assign variable `lang` with desired language code. Connect input from Manual Trigger node.

3. **Create a Google Drive Node**  
   - Name: `Duplicate presentation`  
   - Purpose: Copy the source Google Slides presentation to work on a duplicate.  
   - Configuration:  
     - Operation: `copy`  
     - Name: Use expression `"Presentation_{{ $json.lang }}_{{$now.format('yyyyLLddHHii')}}"`  
     - File ID: Set to the source presentation ID you want to translate (must be configured manually)  
   - Credentials: Google Drive OAuth2 with access to the source file  
   - Connect input from `Set Language` node.

4. **Create a Google Slides Node**  
   - Name: `Get slides from a presentation`  
   - Purpose: Retrieve all slides from the duplicated presentation.  
   - Configuration:  
     - Operation: `getSlides`  
     - Presentation ID: Expression `={{ $json.id }}`  
   - Credentials: Google Slides OAuth2  
   - Connect input from `Duplicate presentation`.

5. **Create a SplitInBatches Node**  
   - Name: `Loop Over Items`  
   - Purpose: Batch process slides to avoid API limits.  
   - Configuration: Use default batch size or adjust as needed.  
   - Connect input from `Get slides from a presentation`.

6. **Create a Code Node**  
   - Name: `Extract Text`  
   - Purpose: Extract all text elements from each slide, returns `objectId` and `extractTexts`.  
   - Code: Use provided JavaScript to parse slide JSON and extract textRuns from pageElements.  
   - Connect input from `Loop Over Items`.

7. **Create a SplitOut Node**  
   - Name: `Split Out`  
   - Purpose: Split extracted text arrays into individual items for translation.  
   - Configuration: Field to split out: `extractTexts`  
   - Connect input from `Extract Text`.

8. **Create an Execute Workflow Node**  
   - Name: `Execute Workflow`  
   - Purpose: Recursively call this workflow for each text batch to translate.  
   - Configuration:  
     - Workflow ID: Set to this workflow’s ID  
     - Pass parameters:  
       - `lang` from `Set Language` node  
       - `objectId` from `Extract Text` node  
       - `extractTexts` from current JSON item  
       - `presentationId` from `Duplicate presentation` node  
   - Connect input from `Split Out`.

9. **Create a Wait Node**  
   - Name: `Wait 10 sec`  
   - Purpose: Delay between recursive calls to respect rate limits.  
   - Configuration: 10 seconds  
   - Connect input from `Execute Workflow`. Output loops back to `Loop Over Items` to continue batch processing.

10. **Create an ExecuteWorkflowTrigger Node**  
    - Name: `When Executed by Another Workflow`  
    - Purpose: Entry point for recursive translation calls.  
    - Configuration: JSON example input with keys: `objectId`, `lang`, `presentationId`, `extractTexts`.

11. **Create a LangChain Agent Node**  
    - Name: `Translation expert`  
    - Purpose: Manage AI translation using Google Gemini and Google Translate tools with defined system prompt.  
    - Configuration:  
      - Text: `"Text to translate:\n{{ $json.extractTexts }}"`  
      - System message includes detailed translation guidelines and process  
      - Prompt type: Define  
      - Link AI language model to next node `Google Gemini Chat Model`  
      - Link AI tools: `Translate language`, `Translate Google Slides`.

12. **Create the Google Gemini Chat Model Node**  
    - Name: `Google Gemini Chat Model`  
    - Purpose: Provide AI completion backend for LangChain Agent.  
    - Credentials: Google PaLM (Gemini) API OAuth2  
    - Connect input from `Translation expert`.

13. **Create the Google Translate Tool Node**  
    - Name: `Translate language`  
    - Purpose: Translate extracted texts into target language.  
    - Credentials: Google Translate OAuth2  
    - Input text: `={{ $json.extractTexts }}`  
    - Translate to language: `={{ $json.lang }}`  
    - Connect as AI tool input to `Translation expert`.

14. **Create the Google Slides Tool Node**  
    - Name: `Translate Google Slides`  
    - Purpose: Replace slide texts with translated texts.  
    - Credentials: Google Slides OAuth2  
    - Configuration:  
      - Operation: `replaceText`  
      - Text values: Array with keys: `text` (translated text), `matchCase` (boolean), `replaceText` (translated text), `pageObjectIds` (slide objectId)  
      - Use expressions to fetch `objectId` and `presentationId` from `When Executed by Another Workflow` JSON  
    - Connect as AI tool input to `Translation expert`.

15. **Create a Wait Node**  
    - Name: `Wait 3 sec`  
    - Purpose: Short delay after translation expert AI processing.  
    - Configuration: 3 seconds  
    - Connect input from `Translation expert`.

16. **Add Sticky Notes for Documentation**  
    - Add three sticky notes to explain workflow purpose, instructions to set language and source presentation.

---

### 5. General Notes & Resources

| Note Content                                                                                                         | Context or Link                                                                                                            |
|----------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------|
| AI-Powered Auto-Translate Google Slides Presentation to any language, preserving formatting and slide structure.     | Workflow purpose summary.                                                                                                  |
| Texts are split by Google Slides APIs into small blocks, so translation may lack full context.                       | Important limitation and disclaimer.                                                                                       |
| Set the target language using [ISO-639 codes](https://cloud.google.com/translate/docs/languages).                    | Instruction for `Set Language` node configuration.                                                                         |
| Duplicate the source presentation ID in the `Duplicate presentation` node before running.                            | Instruction for `Duplicate presentation` node setup.                                                                        |

---

**Disclaimer:**  
The provided workflow is automated using n8n and complies with all current content policies. It contains no illegal, offensive, or protected elements. All processed data is legal and public.