AI Prompt Maker

https://n8nworkflows.xyz/workflows/ai-prompt-maker-5289


# AI Prompt Maker

---

## 1. Workflow Overview

This workflow, titled **AI Prompt Maker**, is designed to provide users a streamlined web interface for generating structured AI prompts tailored for Large Language Models (LLMs), specifically Google Gemini. Users input their desired prompt description and select which sections to include (such as System Instructions, Examples, and Inputs). The workflow then leverages AI to build a well-structured prompt, which is finally displayed on a dedicated webpage with an easy copy-to-clipboard feature.

The workflow is logically divided into the following functional blocks:

- **1.1 Input Reception:** Captures user input via a web form.
- **1.2 AI Prompt Generation:** Constructs a meta-prompt and uses Google Gemini to generate the structured prompt text.
- **1.3 User Redirection:** Redirects the user to a webpage displaying the generated prompt.
- **1.4 Prompt Display:** Renders the generated prompt on a styled webpage with copy functionality.

---

## 2. Block-by-Block Analysis

### 2.1 Input Reception

**Overview:**  
This block handles the public-facing web form where users specify what kind of prompt they want to create and select optional sections to include. It collects all user inputs and forwards them for prompt generation.

**Nodes Involved:**  
- Prompt Request

**Node Details:**

- **Prompt Request**  
  - **Type:** Form Trigger  
  - **Technical Role:** Entry point for the workflow, exposing a web form endpoint (`/prompt-maker`).  
  - **Configuration:**  
    - Form titled "AI Prompt Maker" with description "Let AI create your perfect prompt..".  
    - Two fields:  
      - A required textarea labeled "What prompt do you want ?" for describing the prompt goal, context, inputs, and examples.  
      - A multi-select dropdown labeled "Select Sections" with options: "System Instructions", "Examples", and "Inputs".  
    - Custom CSS included to style the form with dark theme, modern typography, and user-friendly controls.  
    - Webhook path set to `prompt-maker`.  
    - Submit button labeled "Create Prompt".  
  - **Key Expressions:** None directly; user inputs are captured and passed as JSON fields.  
  - **Input/Output Connections:** No input; outputs data to "Generate Prompt" node.  
  - **Version:** 2.2  
  - **Potential Failures:**  
    - Form not accessible if webhook inactive or misconfigured.  
    - CSS loading issues if content delivery or fonts unavailable.  
  - **Sub-workflows:** None.

---

### 2.2 AI Prompt Generation

**Overview:**  
This block constructs a meta-prompt based on the user's input and selected sections, then uses Google Gemini (via LangChain integration) to generate a structured prompt output.

**Nodes Involved:**  
- Generate Prompt  
- Gemini 2.5 Flash

**Node Details:**

- **Generate Prompt**  
  - **Type:** LangChain LLM Chain (chainLlm)  
  - **Technical Role:** Orchestrates prompt construction and invokes the LLM.  
  - **Configuration:**  
    - Uses user input from "What prompt do you want ?" as base text.  
    - Constructs a system instruction message that dynamically includes XML-like tags for `<role>`, `<examples>`, and `<inputs>` depending on checkbox selections in "Select Sections".  
    - Core structure always includes `<goal>`, `<context>`, and `<output_format>`.  
  - **Key Expressions:**  
    - Conditional inclusion of sections using expressions like:  
      `{{ $json['Select Sections'].includes('System Instructions') ? ... : "" }}`  
    - Embeds user inputs directly into the message template.  
  - **Input:** Receives JSON data from "Prompt Request".  
  - **Output:** Sends meta-prompt text to "Gemini 2.5 Flash" node.  
  - **Version:** 1.7  
  - **Potential Failures:**  
    - Expression errors if user input is missing or malformed.  
    - Logic errors if section selection array not properly handled.  
  - **Sub-workflows:** None.

- **Gemini 2.5 Flash**  
  - **Type:** Google Gemini Chat (via Google Palm API credential)  
  - **Technical Role:** Executes the LLM call to generate the final prompt text.  
  - **Configuration:**  
    - Model: `models/gemini-2.5-flash` (fast, cost-effective, suitable for structured output).  
    - Temperature set to 0 for deterministic output.  
    - Uses Google Palm API credential named "IA2S".  
  - **Input:** Receives the meta-prompt constructed by "Generate Prompt".  
  - **Output:** Returns structured prompt text back to the "Generate Prompt" node’s ai_languageModel input port.  
  - **Version:** 1  
  - **Potential Failures:**  
    - Authentication failure if credential invalid or expired.  
    - API rate limits or network timeout.  
    - Unexpected LLM output format.  
  - **Sub-workflows:** None.

---

### 2.3 User Redirection

**Overview:**  
Once the structured prompt is generated, this block redirects the user's browser to a dedicated webpage that will display the prompt.

**Nodes Involved:**  
- Go to Site

**Node Details:**

- **Go to Site**  
  - **Type:** Form node  
  - **Technical Role:** Redirects user after prompt generation.  
  - **Configuration:**  
    - Operation: `completion` (finishing user interaction).  
    - Responds to user with an HTTP redirect.  
    - Redirect URL dynamically built from environment variables (`WEBHOOK_URL`, `N8N_ENDPOINT_WEBHOOK`) and URL-encoded generated prompt text (`$json.text.urlEncode()`).  
    - Redirect points to `/prompt/result` webhook.  
  - **Input:** Receives generated prompt JSON from "Generate Prompt".  
  - **Output:** None (end of form flow).  
  - **Version:** 1  
  - **Potential Failures:**  
    - Environment variables not set correctly, causing broken redirect URL.  
    - URL encoding errors if prompt contains unusual characters.  
  - **Sub-workflows:** None.

---

### 2.4 Prompt Display

**Overview:**  
This block listens for incoming HTTP requests redirected from the previous block and responds with a fully styled HTML page displaying the generated prompt. It includes embedded JavaScript for safe prompt rendering and a copy-to-clipboard button.

**Nodes Involved:**  
- Get Prompt Webpage  
- Display Webpage

**Node Details:**

- **Get Prompt Webpage**  
  - **Type:** Webhook  
  - **Technical Role:** Receives HTTP requests at `/prompt/result`.  
  - **Configuration:**  
    - Path: `prompt/result`  
    - Response Mode: `responseNode` (delegates response to next node).  
  - **Input:** Receives HTTP GET request with query parameter `prompt`.  
  - **Output:** Passes request and query data to "Display Webpage".  
  - **Version:** 2  
  - **Potential Failures:**  
    - Missing or malformed `prompt` query parameter.  
    - Webhook inactive or path misconfigured.  
  - **Sub-workflows:** None.

- **Display Webpage**  
  - **Type:** Respond to Webhook  
  - **Technical Role:** Sends back an HTML page containing the prompt and UI controls.  
  - **Configuration:**  
    - Responds with `text/html; charset=UTF-8`.  
    - Response body is a complete HTML document using dark theme styling.  
    - Includes Google Fonts for professional typography (Inter, Fira Code).  
    - The prompt text is embedded in a JavaScript variable using `JSON.stringify()` to escape special characters.  
    - JavaScript dynamically inserts the prompt into a `<pre><code>` block using `textContent` to ensure literal display of tags and special characters.  
    - Copy button toggles states and copies prompt text to clipboard, with success and error feedback.  
  - **Input:** Receives prompt from query string via previous node.  
  - **Output:** HTTP response to client's browser.  
  - **Version:** 1.1  
  - **Potential Failures:**  
    - JavaScript disabled or blocked in browser leads to poor UX.  
    - Very unusual prompt characters might cause rendering quirks despite JSON escaping.  
  - **Sub-workflows:** None.

---

## 3. Summary Table

| Node Name           | Node Type                             | Functional Role                       | Input Node(s)          | Output Node(s)           | Sticky Note                                                                                                                         |
|---------------------|-------------------------------------|------------------------------------|------------------------|--------------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| Prompt Request      | Form Trigger                        | Capture user prompt input           | None                   | Generate Prompt          | ### 1. Prompt Request (Form Trigger) * Serves as public entry point with a customizable web form collecting prompt details and options. |
| Generate Prompt     | LangChain LLM Chain (chainLlm)     | Build meta-prompt and call LLM     | Prompt Request         | Go to Site               | ### 2. Generate Prompt (LLM Chain) * Constructs meta-prompt dynamically with user inputs and selected sections.                        |
| Gemini 2.5 Flash    | Google Gemini Chat (LangChain LLM) | Execute AI model to generate prompt| Generate Prompt (ai_languageModel) | Generate Prompt (ai_languageModel) | ### 3. Gemini 2.5 Flash (Google Gemini Chat) * Runs the LLM with temperature 0 for deterministic prompt generation.                  |
| Go to Site          | Form                              | Redirect user to prompt display URL| Generate Prompt        | None                     | ### 4. Go to Site (Form) * Redirects browser to a webpage showing the generated prompt, building URL with environment variables.       |
| Get Prompt Webpage  | Webhook                          | Receive redirect requests with prompt | None                   | Display Webpage          | ### 5. Get Prompt Webpage (Webhook) * Listens at /prompt/result and extracts prompt from query parameters.                             |
| Display Webpage     | Respond to Webhook                | Render prompt display webpage       | Get Prompt Webpage     | None                     | ### 6. Display Webpage (Respond to Webhook) * Sends styled HTML page with prompt and copy-to-clipboard functionality.                  |
| Sticky Note         | Sticky Note                      | Documentation                      | None                   | None                     | ## Workflow Overview * High-level workflow purpose and logical blocks.                                                                 |
| Sticky Note1        | Sticky Note                      | Documentation                      | None                   | None                     | Details about Prompt Request node and its configuration.                                                                               |
| Sticky Note2        | Sticky Note                      | Documentation                      | None                   | None                     | Details about Generate Prompt node and meta-prompt construction logic.                                                                 |
| Sticky Note3        | Sticky Note                      | Documentation                      | None                   | None                     | Details about Gemini 2.5 Flash node configuration and usage.                                                                            |
| Sticky Note4        | Sticky Note                      | Documentation                      | None                   | None                     | Details about Go to Site node and redirect logic.                                                                                      |
| Sticky Note5        | Sticky Note                      | Documentation                      | None                   | None                     | Details about Get Prompt Webpage webhook node.                                                                                        |
| Sticky Note6        | Sticky Note                      | Documentation                      | None                   | None                     | Details about Display Webpage node and HTML/JS rendering logic.                                                                        |
| Sticky Note7        | Sticky Note                      | Documentation                      | None                   | None                     | Required credentials and setup instructions.                                                                                           |
| Sticky Note8        | Sticky Note                      | Documentation                      | None                   | None                     | Usage instructions for end-users.                                                                                                      |
| Sticky Note9        | Sticky Note                      | Documentation                      | None                   | None                     | Troubleshooting guidance for common errors.                                                                                            |

---

## 4. Reproducing the Workflow from Scratch

1. **Create the "Prompt Request" node:**  
   - Type: Form Trigger  
   - Set webhook path: `/prompt-maker`  
   - Configure form title: "AI Prompt Maker"  
   - Add description: "Let AI create your perfect prompt.."  
   - Add fields:  
     - Textarea field labeled "What prompt do you want ?", required. Placeholder can be "Talk about the goal of the prompt, any related context and any input format (e.g. input variables). You can also provide output examples."  
     - Multi-select dropdown labeled "Select Sections" with options: "System Instructions", "Examples", "Inputs".  
   - Add extensive custom CSS for dark theme styling as specified (or reuse provided CSS).  
   - Connect output to next node.

2. **Create the "Generate Prompt" node:**  
   - Type: LangChain Chain LLM (`chainLlm`)  
   - Text input: Bind to `{{$json["What prompt do you want ?"]}}`  
   - Messages: Add a system message with this content (use expression to include selected sections dynamically):  
     ```
     You are an expert prompt generator for AI language models. This is what you output :  
     {{ $json['Select Sections'].includes('System Instructions') ? "\n<role>\nThe role that the AI should take (for the system prompt)\n</role>\n" : "" }}  
     <instructions>  
     <goal>  
     The goal or task at hand  
     </goal>  
     
     <context>  
     All the context for the task or goal  
     </context>  
     {{ $json['Select Sections'].includes('Examples') ? "\n<examples>\n<example_1>\n<inputs>\n<...>\n...\n</...>\n</inputs>\n<output>\n...\n</output>\n</example_1>\n...\n</examples>\n" : "" }}  
     
     <output_format>  
     ...  
     </output_format>  
     </instructions>{{ $json['Select Sections'].includes('Inputs') ? "\n\n<inputs>\n<[input_tag]>\n[USE FILLER TEXT TO EXPLAIN WHAT TO PUT HERE]\n</[input_tag]>\n...\n</inputs>" : "" }}  
     ```  
   - Prompt type: `define`  
   - Connect output to "Go to Site" node.

3. **Create the "Gemini 2.5 Flash" node:**  
   - Type: Google Gemini Chat (LangChain LLM)  
   - Model: `models/gemini-2.5-flash`  
   - Temperature: 0  
   - Credentials: Use Google Palm API key credential configured in n8n (e.g., named "IA2S")  
   - Connect as ai_languageModel input to the "Generate Prompt" node’s LLM interface.

4. **Connect "Prompt Request" output to "Generate Prompt" input.**

5. **Create the "Go to Site" node:**  
   - Type: Form (completion operation)  
   - Respond With: `redirect`  
   - Redirect URL: Construct using environment variables and URL-encoded prompt:  
     ```
     ={{$env.WEBHOOK_URL + ($env.N8N_ENDPOINT_WEBHOOK ?? "webhook")}}/prompt/result?prompt={{$json.text.urlEncode()}}
     ```  
   - Connect input from "Generate Prompt".

6. **Create the "Get Prompt Webpage" node:**  
   - Type: Webhook  
   - Path: `/prompt/result`  
   - Response Mode: `responseNode`  
   - Connect output to "Display Webpage".

7. **Create the "Display Webpage" node:**  
   - Type: Respond to Webhook  
   - Respond With: `text`  
   - Response Headers: Set `Content-Type` to `text/html; charset=UTF-8`  
   - Response Body: Paste the full HTML document as provided in the workflow, which:  
     - Styles the page with dark theme and Google Fonts.  
     - Embeds the prompt text safely via `JSON.stringify($json.query.prompt)`.  
     - Uses JavaScript to insert prompt text into a `<pre><code>` block safely with `textContent`.  
     - Implements a "Copy" button with visual feedback.  
   - Connect input from "Get Prompt Webpage".

8. **Activate the workflow:**  
   - Ensure the Google Palm API credential is valid and properly configured.  
   - Optionally set environment variables `WEBHOOK_URL` and `N8N_ENDPOINT_WEBHOOK` in n8n if behind reverse proxy or custom webhook path.  
   - Toggle workflow to active.  

9. **Testing:**  
   - Access the public URL of the "Prompt Request" form (e.g., `https://YOUR_N8N_DOMAIN/form/prompt-maker`).  
   - Fill in prompt details and select sections.  
   - Submit and verify redirection to prompt display page with copy functionality.

---

## 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                | Context or Link                                              |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------|
| The workflow requires a Google Palm API credential to access Google Gemini models. Obtain API keys from Google AI Studio and configure them in n8n credentials.                                                                                                                                                              | Credential Setup                                              |
| Environment variables `WEBHOOK_URL` and `N8N_ENDPOINT_WEBHOOK` are crucial for proper redirect URL construction, especially if n8n is behind a reverse proxy or uses a custom webhook path.                                                                                                                                   | Environment Configuration                                     |
| The prompt display page uses a dark theme with fonts Inter and Fira Code for readability and professional look.                                                                                                                                                                                                              | Frontend Styling                                              |
| Copy-to-clipboard functionality uses the modern Clipboard API with visual success/error feedback.                                                                                                                                                                                                                           | Frontend UX                                                   |
| Troubleshooting tips include checking workflow activation, webhook paths, credential validity, rate limits, and browser JavaScript availability.                                                                                                                                                                          | Troubleshooting Guide                                         |
| Workflow demonstration and credits mention n8n as the platform and link to https://n8n.partnerlinks.io/g3yh568uv03t for more information.                                                                                                                                                                                  | Project Credits and Link                                      |
| The form includes extensive custom CSS to ensure a coherent and modern UI consistent with the dark theme used across the workflow.                                                                                                                                                                                         | UI Consistency                                                |

---

# Disclaimer

The text above is generated exclusively from an automated n8n workflow. It fully complies with all current content policies and contains no illegal, offensive, or protected content. All manipulated data is legal and publicly available.

---