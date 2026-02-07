Automate Chinese to English Translation in Google Slides with Openrouter AI

https://n8nworkflows.xyz/workflows/automate-chinese-to-english-translation-in-google-slides-with-openrouter-ai-6060


# Automate Chinese to English Translation in Google Slides with Openrouter AI

### 1. Workflow Overview

This workflow automates the translation of Chinese text into English directly within Google Slides presentations using OpenRouter AI. It is designed for users who want to seamlessly convert slide content from Chinese to English without manual copy-pasting or external translation steps.

The workflow is logically divided into these key functional blocks:

- **1.1 Input Reception:** Manual trigger to start the workflow.
- **1.2 File and Slide Retrieval:** Access Google Drive to locate presentation files and extract slide content.
- **1.3 Text Extraction and Preparation:** Process slide content into manageable pieces for translation.
- **1.4 AI Translation Processing:** Use OpenRouter’s Chat Model through LangChain to translate the Chinese text into English.
- **1.5 Replacement in Slides:** Update the original Google Slides presentation with the translated English text.
- **1.6 Batch and Flow Control:** Manage translation of multiple text items with batching and wait nodes to handle API rate limits or processing delays.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

**Overview:**  
This block starts the workflow manually upon user command.

**Nodes Involved:**  
- When clicking ‘Execute workflow’

**Node Details:**  
- **Type:** Manual Trigger  
- **Role:** Initiates the workflow manually by user clicking ‘Execute workflow’ button in n8n.  
- **Configuration:** Default manual trigger without parameters.  
- **Connections:** Outputs to "Google Drive" node.  
- **Edge Cases:** None specific; workflow won’t start without manual trigger.  
- **Version:** n8n v1.x+ compatible.

---

#### 2.2 File and Slide Retrieval

**Overview:**  
Fetches the Google Slides presentation from Google Drive and loads the slide contents for processing.

**Nodes Involved:**  
- Google Drive  
- Google Slides2

**Node Details:**  

- **Google Drive**  
  - **Type:** Google Drive node  
  - **Role:** Locates and retrieves the target Google Slides presentation file from Drive.  
  - **Configuration:** Presumably configured to identify the presentation by ID or search parameters (not explicitly detailed).  
  - **Input:** Receives trigger from manual start.  
  - **Output:** Passes file metadata to "Google Slides2".  
  - **Edge Cases:** Permissions errors, file not found, API rate limits.  
  - **Credentials:** Google OAuth2 with Drive access.

- **Google Slides2**  
  - **Type:** Google Slides node (v2)  
  - **Role:** Extracts slides and their text elements from the selected presentation.  
  - **Configuration:** Default or possibly set to retrieve all slides/text elements.  
  - **Input:** Receives file info from Google Drive.  
  - **Output:** Sends slide content to "Code" node.  
  - **Edge Cases:** API errors, empty slides, unsupported slide content types.  
  - **Credentials:** Google OAuth2 with Slides API access.

---

#### 2.3 Text Extraction and Preparation

**Overview:**  
Processes the extracted slide content to isolate individual text elements and prepare them for translation.

**Nodes Involved:**  
- Code  
- Split Out  
- Loop Over Items

**Node Details:**  

- **Code**  
  - **Type:** Code node (JavaScript)  
  - **Role:** Parses slide data to extract text elements requiring translation.  
  - **Configuration:** Custom script to transform input data into an array or list of text items.  
  - **Input:** Slide content from Google Slides2 node.  
  - **Output:** Passes structured text items to "Split Out".  
  - **Edge Cases:** Parsing errors, unexpected data formats, empty text nodes.

- **Split Out**  
  - **Type:** Split Out node  
  - **Role:** Splits the array of text items into single elements for processing individually.  
  - **Input:** Receives array from Code node.  
  - **Output:** Feeds individual text items to "Loop Over Items".  
  - **Edge Cases:** Empty input arrays.

- **Loop Over Items**  
  - **Type:** Split In Batches node  
  - **Role:** Processes text items in batches to manage API load and rate limits.  
  - **Configuration:** Batch size likely set to a manageable number (default not shown).  
  - **Input:** Receives individual text items from Split Out.  
  - **Output:** Sends batches for AI processing; also controls flow back to AI Agent node.  
  - **Edge Cases:** Batch size too large causing API errors, incomplete batch processing.

---

#### 2.4 AI Translation Processing

**Overview:**  
Translates each batch of Chinese text items into English using OpenRouter's Chat Model via LangChain AI Agent.

**Nodes Involved:**  
- AI Agent  
- OpenRouter Chat Model

**Node Details:**  

- **OpenRouter Chat Model**  
  - **Type:** LangChain AI Chat Model node (OpenRouter)  
  - **Role:** Interfaces with OpenRouter API to perform translation tasks.  
  - **Configuration:** Set up with OpenRouter API key and parameters appropriate for chat-based translation.  
  - **Input:** Connected as language model to AI Agent.  
  - **Output:** Provides translation results to AI Agent.  
  - **Edge Cases:** Authentication failures, API quota exceeded, network timeouts.  
  - **Credentials:** OpenRouter API key.

- **AI Agent**  
  - **Type:** LangChain Agent node  
  - **Role:** Orchestrates prompt construction, sends text to OpenRouter Chat Model, and receives translated output.  
  - **Configuration:** Uses AI language model node (OpenRouter) as backend; parameters likely include prompt templates specifying Chinese to English translation.  
  - **Input:** Receives batches from "Loop Over Items".  
  - **Output:** Passes translated text to "Wait" node.  
  - **Edge Cases:** Prompt errors, unexpected AI responses, rate limiting.

---

#### 2.5 Replacement in Slides

**Overview:**  
Takes the translated English text and replaces the original Chinese text in the Google Slides presentation.

**Nodes Involved:**  
- Wait  
- Replace text

**Node Details:**  

- **Wait**  
  - **Type:** Wait node  
  - **Role:** Introduces delay between batches or processing steps to avoid API limits or ensure order.  
  - **Configuration:** Default or configured to a specific time (not detailed).  
  - **Input:** Receives translated text from AI Agent.  
  - **Output:** Passes control to Loop Over Items for next batch or directly to Replace text.  
  - **Edge Cases:** Unintended delays, timing misconfiguration causing workflow stall.

- **Replace text**  
  - **Type:** Google Slides Tool node (v2)  
  - **Role:** Replaces original Chinese text elements in the slides with their English translations.  
  - **Configuration:** Set to replace text content in specific slide IDs or elements, using output from AI Agent.  
  - **Input:** Receives translated text to insert into slides.  
  - **Output:** Finalizes the translation update in Google Slides.  
  - **Edge Cases:** Text replacement failures, slide element not found, API errors.

---

### 3. Summary Table

| Node Name                      | Node Type                         | Functional Role                        | Input Node(s)                  | Output Node(s)                | Sticky Note                       |
|-------------------------------|----------------------------------|-------------------------------------|-------------------------------|------------------------------|---------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger                   | Starts the workflow manually         |                               | Google Drive                 |                                 |
| Google Drive                  | Google Drive                     | Retrieves Google Slides presentation | When clicking ‘Execute workflow’ | Google Slides2               |                                 |
| Google Slides2                | Google Slides (v2)               | Extracts slide content               | Google Drive                  | Code                         |                                 |
| Code                         | Code (JavaScript)                | Parses slide data to extract text   | Google Slides2                | Split Out                    |                                 |
| Split Out                    | Split Out                       | Splits text array into single items | Code                         | Loop Over Items              |                                 |
| Loop Over Items              | Split In Batches                | Processes text in batches            | Split Out, Wait              | AI Agent, (empty batch output) |                                 |
| AI Agent                    | LangChain Agent                 | Orchestrates translation via AI     | Loop Over Items               | Wait                        |                                 |
| OpenRouter Chat Model        | LangChain Chat Model (OpenRouter) | Provides AI translation model        | None (linked inside AI Agent) | AI Agent                    |                                 |
| Wait                        | Wait                           | Controls pacing and throttling       | AI Agent                     | Loop Over Items              |                                 |
| Replace text                | Google Slides Tool (v2)         | Replaces original text with English  | AI Agent (via Wait>Loop)      |                              |                                 |
| Sticky Note                 | Sticky Note                    | Comments/annotations                  |                               |                              |                                 |
| Sticky Note1                | Sticky Note                    | Comments/annotations                  |                               |                              |                                 |
| Sticky Note2                | Sticky Note                    | Comments/annotations                  |                               |                              |                                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger Node**  
   - Name: `When clicking ‘Execute workflow’`  
   - Purpose: Manual start for the workflow.

2. **Add Google Drive Node**  
   - Name: `Google Drive`  
   - Purpose: Locate the Google Slides presentation file.  
   - Credentials: Configure with Google OAuth2 (Drive scope).  
   - Parameters: Set to search or specify file ID of the Slides presentation.

3. **Add Google Slides Node (v2)**  
   - Name: `Google Slides2`  
   - Purpose: Extract slides and text elements from the selected presentation.  
   - Credentials: Google OAuth2 (Slides API).  
   - Connect output of Google Drive node to this node.

4. **Add Code Node**  
   - Name: `Code`  
   - Purpose: Parse the slide content JSON to extract all Chinese text elements for translation.  
   - Configuration: Write JavaScript code to transform slide content to an array of text objects.  
   - Connect output of Google Slides2 node to this node.

5. **Add Split Out Node**  
   - Name: `Split Out`  
   - Purpose: Split the array of text elements into individual items for batch processing.  
   - Connect output of Code node to this node.

6. **Add Split In Batches Node**  
   - Name: `Loop Over Items`  
   - Purpose: Process text elements in batches to avoid API overload.  
   - Configuration: Set batch size (e.g., 5 or 10).  
   - Connect output of Split Out node to this node.

7. **Add LangChain OpenRouter Chat Model Node**  
   - Name: `OpenRouter Chat Model`  
   - Purpose: Translate Chinese text to English using OpenRouter AI.  
   - Credentials: Configure with OpenRouter API key.  
   - Parameters: Set model parameters for chat-based translation.  
   - This node will be linked as the language model for the AI Agent node.

8. **Add LangChain AI Agent Node**  
   - Name: `AI Agent`  
   - Purpose: Receive batches of text, send translation requests to OpenRouter Chat Model, and process responses.  
   - Configuration: Link the OpenRouter Chat Model node as the AI language model.  
   - Connect main output of Loop Over Items node to AI Agent’s main input.  
   - Connect AI Agent’s language model input to OpenRouter Chat Model node.

9. **Add Wait Node**  
   - Name: `Wait`  
   - Purpose: Introduce controlled delays between batches to prevent API rate limits.  
   - Parameters: Set appropriate wait time (e.g., 1-2 seconds).  
   - Connect output of AI Agent node to Wait node.

10. **Connect Wait node back to Loop Over Items**  
    - This controls batch processing flow, allowing next batch to start after waiting.

11. **Add Google Slides Tool Node (v2)**  
    - Name: `Replace text`  
    - Purpose: Replace original Chinese text in the slides with the translated English text.  
    - Credentials: Google OAuth2 (Slides API).  
    - Connect the AI Agent node’s output (or via Wait and Loop as per design) to this node’s ai_tool input.  
    - Configure to replace text elements by slide and element IDs with translated strings.

12. **Ensure all credentials are properly configured:**  
    - Google OAuth2 with Drive and Slides scopes.  
    - OpenRouter API credentials.

13. **Optionally add Sticky Notes** to document workflow parts for future reference.

---

### 5. General Notes & Resources

| Note Content                                                                                 | Context or Link                                                                                 |
|----------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| This workflow uses LangChain nodes to integrate OpenRouter AI for chat-based translation.    | OpenRouter API documentation: https://openrouter.ai/docs                                      |
| Google OAuth2 credentials must include Drive and Slides API scopes for file access and editing. | Google API docs: https://developers.google.com/identity/protocols/oauth2                       |
| Batching and Wait nodes are key to avoiding API rate limits during bulk text translation.    | n8n docs on Split In Batches: https://docs.n8n.io/nodes/n8n-nodes-base.splitinbatches/        |
| Custom Code node is critical for parsing slide JSON into translatable text elements.         | JavaScript knowledge required to maintain and extend this parsing logic.                       |

---

**Disclaimer:**  
The provided text is derived exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.