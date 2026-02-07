AI Prompt Generator Workflow

https://n8nworkflows.xyz/workflows/ai-prompt-generator-workflow-5045


# AI Prompt Generator Workflow

### 1. Workflow Overview

This workflow, titled **"AI Prompt Generator Workflow"**, is designed to assist users in creating highly effective and structured prompts for AI agents based on user inputs. It targets use cases where users want to build AI-powered automation or tools but need help refining their intent and clarifying key parameters to generate a final usable AI prompt. The workflow guides users through a series of form submissions and AI-powered question generation steps, progressively enriching the input to create a precise, context-rich prompt.

The workflow is logically divided into these blocks:

- **1.1 Input Reception and Initial User Intent Collection**: Captures the basic idea of what the user wants to build through form submissions.
- **1.2 AI-Driven Clarification Question Generation**: Uses an AI model to generate specific follow-up questions that clarify ambiguous or incomplete initial inputs.
- **1.3 Additional User Clarifications**: Collects further user answers to the AI-generated questions via dynamic forms.
- **1.4 User Input Aggregation and Merging**: Combines all user inputs and clarifications into a single structured data set.
- **1.5 Final Prompt Generation**: Utilizes an advanced AI language model to generate a fully structured and formatted AI prompt based on all collected inputs.
- **1.6 Output Presentation**: Displays the final AI prompt to the user in a readable, copyable form.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Initial User Intent Collection

**Overview:**  
This block captures the user's initial high-level idea about what AI tool they want to create, the tools they can access, expected inputs, and desired outputs. It serves as the foundation for subsequent clarifications.

**Nodes Involved:**  
- On form submission  
- BaseQuestions

**Node Details:**

- **On form submission**  
  - *Type:* Form Trigger  
  - *Role:* Starts the workflow upon user submitting the initial form.  
  - *Configuration:* Custom CSS styles form for a polished UI; form title "🚀 AI Prompt Generator" and description "Create powerful prompts for your AI tools".  
  - *Input/Output:* Outputs form submission data; triggers "BaseQuestions" form node.  
  - *Edge Cases:* Potential webhook or form submission failures; malformed input data.

- **BaseQuestions**  
  - *Type:* Form  
  - *Role:* Presents form to user to gather four key inputs: "What do you want to build?", "Tools I can access", "What Input can be expected?", "What output do you expect?".  
  - *Configuration:* Custom CSS for UI; fields are all textareas and required.  
  - *Input:* Triggered from "On form submission".  
  - *Output:* Collects user answers, outputs JSON object for next processing.  
  - *Edge Cases:* User may provide vague or incomplete answers, requiring follow-up.

---

#### 2.2 AI-Driven Clarification Question Generation

**Overview:**  
This block uses an AI language model to analyze the basic user inputs and generate up to three specific clarifying questions to refine the prompt requirements.

**Nodes Involved:**  
- Google Gemini Chat Model (for generating questions)  
- Structured Output Parser (to parse AI output)  
- RelatedQuestionAI (chain node that wraps model + parser)  
- SplitQuestions (splits the AI-generated JSON array into individual question objects)

**Node Details:**

- **Google Gemini Chat Model**  
  - *Type:* AI Language Model (Google Gemini via Langchain)  
  - *Role:* Generates a JSON array of clarifying questions based on user input.  
  - *Configuration:* Uses "models/gemini-2.0-flash" with Google PaLM API credentials.  
  - *Input:* Receives JSON array with user's initial answers.  
  - *Output:* JSON text with follow-up questions.  
  - *Edge Cases:* API errors, rate limits, or malformed responses.

- **Structured Output Parser**  
  - *Type:* Output Parser (Structured JSON)  
  - *Role:* Parses the AI-generated text to valid JSON array of questions.  
  - *Configuration:* Expects array of question objects with fields like fieldLabel, placeholder, requiredField, fieldType.  
  - *Input:* AI text output.  
  - *Output:* Parsed JSON array for next step.  
  - *Edge Cases:* Parsing failure if AI output is malformed.

- **RelatedQuestionAI**  
  - *Type:* Chain LLM Node  
  - *Role:* Encapsulates the above two nodes in a chain to produce clarifying questions.  
  - *Input:* User's initial form answers.  
  - *Output:* JSON array of clarifying questions.  
  - *Edge Cases:* Propagates errors from model or parser.

- **SplitQuestions**  
  - *Type:* Split Out  
  - *Role:* Splits the JSON array of questions into separate individual question items for iterative processing.  
  - *Input:* JSON array from RelatedQuestionAI.  
  - *Output:* Individual question objects, fed back into the questions loop.  
  - *Edge Cases:* Incorrect splitting if input is not a proper array.

---

#### 2.3 Additional User Clarifications

**Overview:**  
This block presents the AI-generated clarifying questions to the user as dynamic forms and collects their answers iteratively.

**Nodes Involved:**  
- LoopQuestions (split in batches)  
- RelevantQuestions (form node for follow-up answers)

**Node Details:**

- **LoopQuestions**  
  - *Type:* Split in Batches  
  - *Role:* Iterates over each clarifying question, allowing sequential user input.  
  - *Configuration:* Default batch size (likely 1) to process one question at a time.  
  - *Input:* Individual question objects from SplitQuestions or RelevantQuestions (loop).  
  - *Output:* Sends current question to RelevantQuestions form.  
  - *Edge Cases:* Loop errors, batch size misconfiguration.

- **RelevantQuestions**  
  - *Type:* Form  
  - *Role:* Displays the clarifying question to the user, collects their answer.  
  - *Configuration:* Dynamic form built from JSON question object, with custom CSS and form title "Questions to understand".  
  - *Input:* Receives question JSON to display as form fields.  
  - *Output:* User’s answers to clarifying questions, sent back to LoopQuestions to continue or finish loop.  
  - *Edge Cases:* User skips or inputs invalid data.

---

#### 2.4 User Input Aggregation and Merging

**Overview:**  
This block merges the initial user inputs with the follow-up clarifications into a single aggregated JSON object for final prompt generation.

**Nodes Involved:**  
- MergeUserIntent

**Node Details:**

- **MergeUserIntent**  
  - *Type:* Merge  
  - *Role:* Combines multiple input JSON objects (initial answers + clarifications) into one structured data set.  
  - *Configuration:* Default merge mode (likely "Merge By Index" or "Wait").  
  - *Input:* Receives outputs from BaseQuestions and LoopQuestions (clarifications).  
  - *Output:* Single JSON object combining all user inputs.  
  - *Edge Cases:* Missing or inconsistent data in inputs, merge conflicts.

---

#### 2.5 Final Prompt Generation

**Overview:**  
This block uses a powerful AI language model to transform the aggregated user inputs into a highly structured, detailed AI prompt suitable for downstream use.

**Nodes Involved:**  
- Google Gemini Chat Model1 (AI model for prompt generation)  
- Auto-fixing Output Parser (fixes and parses AI output)  
- Structured Output Parser1  
- PromptGenerator (chain node combining above)

**Node Details:**

- **Google Gemini Chat Model1**  
  - *Type:* AI Language Model (Google Gemini via Langchain)  
  - *Role:* Generates the final AI prompt text from merged user intent.  
  - *Configuration:* Uses "models/gemini-2.0-flash" with Google PaLM API credentials.  
  - *Input:* JSON object from MergeUserIntent.  
  - *Output:* Raw AI-generated prompt text.  
  - *Edge Cases:* API errors, response delays, malformed output.

- **Auto-fixing Output Parser**  
  - *Type:* Output Parser with auto-correction  
  - *Role:* Automatically fixes common JSON formatting errors in AI output.  
  - *Input:* Raw prompt text from AI model.  
  - *Output:* Cleaned JSON object with prompt string.  
  - *Edge Cases:* Cannot fix severe malformations.

- **Structured Output Parser1**  
  - *Type:* Structured JSON parser  
  - *Role:* Final validation and parsing of the cleaned JSON prompt object.  
  - *Input:* Output from Auto-fixing Output Parser.  
  - *Output:* Validated JSON with final prompt.  
  - *Edge Cases:* Parsing failure on invalid JSON.

- **PromptGenerator**  
  - *Type:* Chain LLM node  
  - *Role:* Combines the above nodes to produce the final prompt.  
  - *Input:* Merged user intent JSON.  
  - *Output:* Final prompt JSON string.  
  - *Edge Cases:* Propagates errors from model or parsers.

---

#### 2.6 Output Presentation

**Overview:**  
This block presents the final generated prompt back to the user in a styled form interface, allowing easy reading and copying.

**Nodes Involved:**  
- SendingPrompt

**Node Details:**

- **SendingPrompt**  
  - *Type:* Form  
  - *Role:* Displays the generated prompt to the user with a styled UI, including instructions to copy and use the prompt.  
  - *Configuration:* Custom CSS for monospace font, pre-wrapped text style, header text "🎉 Here's your custom prompt".  
  - *Input:* Takes the final prompt JSON output from PromptGenerator.  
  - *Output:* None (end of workflow).  
  - *Edge Cases:* Display issues on mobile or legacy browsers.

---

### 3. Summary Table

| Node Name               | Node Type                               | Functional Role                          | Input Node(s)          | Output Node(s)         | Sticky Note                                                                                      |
|-------------------------|---------------------------------------|----------------------------------------|------------------------|------------------------|-------------------------------------------------------------------------------------------------|
| On form submission      | Form Trigger                          | Start workflow, initial form submission | —                      | BaseQuestions          |                                                                                                |
| BaseQuestions           | Form                                  | Collect initial user intent             | On form submission     | RelatedQuestionAI      | # Initiate and Get the Basic Questions                                                          |
| RelatedQuestionAI       | Chain LLM                            | Generate clarifying questions           | BaseQuestions          | SplitQuestions         | # Generate Relevant Questions                                                                   |
| SplitQuestions          | Split Out                            | Split AI-generated questions            | RelatedQuestionAI      | LoopQuestions          |                                                                                                |
| LoopQuestions           | Split in Batches                     | Iterate over clarifying questions       | SplitQuestions, RelevantQuestions | RelevantQuestions, MergeUserIntent | # Ask question to the user                                                                      |
| RelevantQuestions       | Form                                  | Collect user answers to clarifications  | LoopQuestions          | LoopQuestions          |                                                                                                |
| MergeUserIntent         | Merge                                 | Aggregate all user inputs                | BaseQuestions, LoopQuestions | PromptGenerator      |                                                                                                |
| PromptGenerator         | Chain LLM                            | Generate final structured AI prompt     | MergeUserIntent        | SendingPrompt          | # Prompt Generator System                                                                       |
| Google Gemini Chat Model | AI Language Model (Google Gemini)    | Generate clarifying questions (sub-node) | —                      | RelatedQuestionAI      |                                                                                                |
| Structured Output Parser | Output Parser (Structured JSON)      | Parse clarifying questions output       | Google Gemini Chat Model | RelatedQuestionAI      |                                                                                                |
| Google Gemini Chat Model1 | AI Language Model (Google Gemini)   | Generate final AI prompt (sub-node)     | —                      | PromptGenerator        |                                                                                                |
| Auto-fixing Output Parser| Output Parser (Auto-fixing JSON)     | Clean and fix AI prompt JSON output     | Google Gemini Chat Model1 | Structured Output Parser1 |                                                                                                |
| Structured Output Parser1| Output Parser (Structured JSON)      | Final prompt JSON validation            | Auto-fixing Output Parser | PromptGenerator       |                                                                                                |
| SendingPrompt           | Form                                  | Present final prompt to user             | PromptGenerator        | —                      | # Sending the Prompt to User                                                                    |
| Sticky Note             | Sticky Note                          | Guidance on prompt structure             | —                      | —                      | # Prompting - Constraints, Role, Inputs, Tools, Instructions, Conclusions, Solutions/Error handling |
| Sticky Note1            | Sticky Note                          | Label for initial questions block       | —                      | —                      | # Initiate and Get the Basic Questions                                                          |
| Sticky Note2            | Sticky Note                          | Label for generate relevant questions   | —                      | —                      | # Generate Relevant Questions                                                                   |
| Sticky Note3            | Sticky Note                          | Label for asking questions to user      | —                      | —                      | # Ask question to the user                                                                      |
| Sticky Note4            | Sticky Note                          | Label for final prompt generation block | —                      | —                      | # Prompt Generator System                                                                       |
| Sticky Note5            | Sticky Note                          | Label for sending prompt to user        | —                      | —                      | # Sending the Prompt to User                                                                    |
| Sticky Note6            | Sticky Note                          | Workflow title label                     | —                      | —                      | # 🚀 AI Prompt generator                                                                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Form Trigger node named "On form submission":**  
   - Configure webhook to trigger on user form submission.  
   - Customize CSS to style the form with a card theme and gradient header.  
   - Set form title: "🚀 AI Prompt Generator".  
   - Set form description: "Create powerful prompts for your AI tools".  
   - Button label: "Let's Generate".

2. **Create a Form node named "BaseQuestions":**  
   - Connect from "On form submission" output.  
   - Use custom CSS for styling consistent with the first form.  
   - Title: "Enrich Prompt".  
   - Button label: "Answer".  
   - Define four required textarea fields:  
     - "What do you want to build ?" (placeholder: e.g., "A B2B proposal generator...")  
     - "Tools I can access (N/A if no tools)"  
     - "What Input can be expected ?"  
     - "What output do you expect ?".

3. **Add Google Gemini Chat Model node named "Google Gemini Chat Model":**  
   - Credential: Google PaLM API with valid API key.  
   - Model: "models/gemini-2.0-flash".  
   - Purpose: Generate clarifying questions based on base answers.

4. **Add Structured Output Parser node named "Structured Output Parser":**  
   - Set JSON schema example matching an array of question objects (fields: fieldLabel, placeholder, requiredField, fieldType).  
   - Connect output of Google Gemini Chat Model to this node for parsing.

5. **Create Chain LLM node named "RelatedQuestionAI":**  
   - Chain together "Google Gemini Chat Model" and "Structured Output Parser".  
   - Input: output from "BaseQuestions".  
   - Output: parsed JSON array of clarifying questions.

6. **Add Split Out node named "SplitQuestions":**  
   - Configure to split the JSON array of questions from "RelatedQuestionAI".  
   - Field to split out: "output".

7. **Add Split In Batches node named "LoopQuestions":**  
   - Connect from "SplitQuestions".  
   - Default batch size (1) to process one question at a time.

8. **Create Form node named "RelevantQuestions":**  
   - Connect from "LoopQuestions".  
   - Use custom CSS consistent with previous forms.  
   - Title: "Questions to understand".  
   - Button label: "Answer".  
   - Configure form fields dynamically from the JSON question object received.  
   - Output: user answers to clarifying questions.

9. **Connect "RelevantQuestions" output back to "LoopQuestions" input:**  
   - Enables iterative question-answer loop until all questions answered.

10. **Create Merge node named "MergeUserIntent":**  
    - Merge outputs from "BaseQuestions" and "LoopQuestions" (all clarifications).  
    - Use default merge mode to combine all JSON objects into one.

11. **Add Google Gemini Chat Model node named "Google Gemini Chat Model1":**  
    - Credential: Google PaLM API.  
    - Model: "models/gemini-2.0-flash".  
    - Input: merged user intent JSON.  
    - Purpose: Generate final structured AI prompt.

12. **Add Auto-fixing Output Parser node named "Auto-fixing Output Parser":**  
    - Connect from "Google Gemini Chat Model1".  
    - Enables automatic correction of JSON formatting issues.

13. **Add Structured Output Parser node named "Structured Output Parser1":**  
    - Connect from "Auto-fixing Output Parser".  
    - JSON schema expects object with a "prompt" field.

14. **Create Chain LLM node named "PromptGenerator":**  
    - Chain together "Google Gemini Chat Model1", "Auto-fixing Output Parser", and "Structured Output Parser1".  
    - Input: from "MergeUserIntent".  
    - Output: final clean prompt JSON.

15. **Create Form node named "SendingPrompt":**  
    - Connect from "PromptGenerator".  
    - Custom CSS for monospace font and pre-wrapped text for prompt display.  
    - Operation: completion.  
    - Completion title: "🎉 Here's your custom prompt".  
    - Completion message: expression to show `$('PromptGenerator').item.json.output.prompt`.  
    - No input fields—display only.

16. **Connect all nodes as per the logical flow:**  
    - On form submission → BaseQuestions → RelatedQuestionAI → SplitQuestions → LoopQuestions ↔ RelevantQuestions → MergeUserIntent → PromptGenerator → SendingPrompt.

17. **Credentials Setup:**  
    - Google PaLM API credentials configured and linked to both Google Gemini Chat Model nodes.

18. **Set workflow to active and test with real inputs.**

---

### 5. General Notes & Resources

| Note Content                                                                                             | Context or Link                                                                                     |
|--------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| The prompt generation follows a structured format with sections: Constraints, Role, Inputs, Tools, Instructions, Conclusions. | Sticky Note at position [-1220,380] covers detailed prompting guidelines.                          |
| Workflow uses Google Gemini (PaLM) API via Langchain integration for AI language model calls.          | Requires valid Google PaLM API credentials configured in n8n.                                     |
| UI forms use extensive custom CSS to ensure a consistent, professional user experience.                 | CSS embedded in form nodes for card styling, responsive design, and user-friendly inputs.         |
| The clarifying question loop ensures higher prompt quality by iteratively refining user requirements. | LoopQuestions and RelevantQuestions nodes implement this iterative questioning pattern.           |
| Output prompt is presented in a monospace, preformatted style for easy copying and readability.        | SendingPrompt node uses custom CSS for styling the final prompt display.                           |

---

This document enables full understanding, reproduction, and potential extension of the "AI Prompt Generator Workflow" with attention to integration points, error handling, and user experience.