AI-Powered Research with Jina AI Deep Search

https://n8nworkflows.xyz/workflows/ai-powered-research-with-jina-ai-deep-search-3068


# AI-Powered Research with Jina AI Deep Search

### 1. Workflow Overview

This workflow, **AI-Powered Research with Jina AI Deep Search**, automates the process of conducting deep, AI-driven research without requiring any API keys. It is designed to receive a user’s research query, send it to Jina AI’s Deep Search API, and then process the AI-generated response into a clean, well-structured markdown research report. The workflow is modular and customizable, targeting researchers, writers, students, and content creators who want to accelerate and automate their research tasks.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Captures the user’s research query via a chat trigger node.
- **1.2 AI Research Query Execution:** Sends the query to Jina AI’s Deep Search API and receives a streamed response.
- **1.3 Response Processing & Formatting:** Extracts, cleans, and formats the AI response into readable markdown.
- **1.4 Informational & Branding Notes:** Sticky notes providing context, usage instructions, and author credits.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block captures the user’s research query through a chat interface, serving as the entry point for the workflow.

- **Nodes Involved:**  
  - User Research Query Input

- **Node Details:**

  - **User Research Query Input**  
    - *Type & Role:* `@n8n/n8n-nodes-langchain.chatTrigger` — Listens for incoming chat messages to trigger the workflow.  
    - *Configuration:* Uses default options; configured with a webhook ID to receive chat input.  
    - *Expressions/Variables:* The user’s input is accessed as `{{ $json.chatInput }}` in downstream nodes.  
    - *Input/Output:* No input connections; outputs the chat input JSON to the next node.  
    - *Version Requirements:* Version 1.1 of the LangChain chat trigger node.  
    - *Potential Failures:* Webhook connectivity issues, malformed input, or missing chat input field.  
    - *Sub-workflow:* None.

#### 1.2 AI Research Query Execution

- **Overview:**  
  This block sends the user’s query to Jina AI’s Deep Search API and streams the AI-generated response.

- **Nodes Involved:**  
  - Jina AI DeepSearch Request

- **Node Details:**

  - **Jina AI DeepSearch Request**  
    - *Type & Role:* `httpRequest` — Sends a POST request to Jina AI’s Deep Search API endpoint.  
    - *Configuration:*  
      - URL: `https://deepsearch.jina.ai/v1/chat/completions`  
      - Method: POST  
      - Body (JSON): Includes a system prompt defining the AI’s role as an advanced researcher, an assistant greeting, and the user’s query interpolated as `"Provide a deep and insightful analysis on: \"{{ $json.chatInput }}\"..."`.  
      - Streaming enabled (`"stream": true`) to receive partial responses.  
      - Reasoning effort set to `"low"` for faster responses.  
    - *Expressions/Variables:* Uses `{{ $json.chatInput }}` to dynamically insert the user query.  
    - *Input/Output:* Input from the chat trigger node; output is the streamed API response passed to the next node.  
    - *Version Requirements:* Version 4.2 of the HTTP Request node to support streaming.  
    - *Potential Failures:* Network errors, API downtime, malformed JSON, or unexpected API response format.  
    - *Sub-workflow:* None.

#### 1.3 Response Processing & Formatting

- **Overview:**  
  This block extracts the streamed AI response, parses the JSON chunks, and formats the final content into clean markdown for easy reading.

- **Nodes Involved:**  
  - Format & Clean AI Response

- **Node Details:**

  - **Format & Clean AI Response**  
    - *Type & Role:* `code` — Custom JavaScript code node to parse and format the streamed response.  
    - *Configuration:*  
      - The code splits the raw streamed data by the delimiter `"data: "`, parses each JSON chunk, and extracts the last available `"content"` field from the `choices` array.  
      - It then cleans markdown footnotes and formats URLs to be enclosed in angle brackets for proper markdown rendering.  
      - Returns an array with a single object containing the cleaned markdown text.  
    - *Expressions/Variables:* Uses `$input` to access the HTTP response data.  
    - *Input/Output:* Input from the HTTP Request node; outputs formatted markdown text for downstream use or display.  
    - *Version Requirements:* Version 2 of the Code node.  
    - *Potential Failures:* JSON parsing errors if the streamed data is malformed, missing expected fields, or unexpected data format.  
    - *Sub-workflow:* None.

#### 1.4 Informational & Branding Notes

- **Overview:**  
  This block contains sticky notes that provide workflow context, usage instructions, author credits, and branding information.

- **Nodes Involved:**  
  - Sticky Note  
  - Sticky Note1  
  - Sticky Note2

- **Node Details:**

  - **Sticky Note**  
    - *Type & Role:* `stickyNote` — Displays author credits and workflow purpose.  
    - *Content Highlights:* Developed by Leonard van Hemert; encourages connecting on LinkedIn; emphasizes free and democratized AI research.  
    - *Position:* Left side of the canvas for visibility.  
    - *Potential Failures:* None (informational only).

  - **Sticky Note1**  
    - *Type & Role:* `stickyNote` — Summarizes the workflow’s key feature: free, automated AI research with no API key required.  
    - *Position:* Near the input block for context.  
    - *Potential Failures:* None.

  - **Sticky Note2**  
    - *Type & Role:* `stickyNote` — Explains the workflow’s step-by-step operation and output format.  
    - *Position:* Below Sticky Note1, providing detailed process explanation.  
    - *Potential Failures:* None.

---

### 3. Summary Table

| Node Name                 | Node Type                              | Functional Role                       | Input Node(s)               | Output Node(s)             | Sticky Note                                                                                     |
|---------------------------|--------------------------------------|------------------------------------|-----------------------------|----------------------------|------------------------------------------------------------------------------------------------|
| User Research Query Input  | @n8n/n8n-nodes-langchain.chatTrigger| Captures user research query       | —                           | Jina AI DeepSearch Request  | Sticky Note1 and Sticky Note2 provide context on input and workflow operation                  |
| Jina AI DeepSearch Request | httpRequest                          | Sends query to Jina AI Deep Search | User Research Query Input    | Format & Clean AI Response  | Sticky Note1 and Sticky Note2 provide context on AI query and response                         |
| Format & Clean AI Response | code                                | Parses and formats AI response     | Jina AI DeepSearch Request   | —                          | Sticky Note2 explains markdown formatting and cleanup                                         |
| Sticky Note               | stickyNote                          | Author credits and workflow info   | —                           | —                          | Contains author info and LinkedIn link                                                        |
| Sticky Note1              | stickyNote                          | Workflow summary and key features  | —                           | —                          | Highlights free, no API key required feature                                                  |
| Sticky Note2              | stickyNote                          | Workflow operation explanation     | —                           | —                          | Details step-by-step workflow operation and output format                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Chat Trigger Node:**  
   - Add a node of type `@n8n/n8n-nodes-langchain.chatTrigger`.  
   - Configure it with default options.  
   - Note the webhook URL generated for receiving chat input.  
   - This node will receive the user’s research query as `chatInput`.

2. **Add HTTP Request Node for Jina AI Deep Search:**  
   - Add an `httpRequest` node named `Jina AI DeepSearch Request`.  
   - Set the HTTP method to `POST`.  
   - Set the URL to `https://deepsearch.jina.ai/v1/chat/completions`.  
   - In the body, select JSON and enter the following structure with expressions:  
     ```json
     {
       "model": "jina-deepsearch-v1",
       "messages": [
         {
           "role": "user",
           "content": "You are an advanced AI researcher that provides precise, well-structured, and insightful reports based on deep analysis. Your responses are factual, concise, and highly relevant."
         },
         {
           "role": "assistant",
           "content": "Hi, how can I help you?"
         },
         {
           "role": "user",
           "content": "Provide a deep and insightful analysis on: \"{{$json.chatInput}}\". Ensure the response is well-structured, fact-based, and directly relevant to the topic, with no unnecessary information."
         }
       ],
       "stream": true,
       "reasoning_effort": "low"
     }
     ```  
   - Enable streaming in the node options to receive partial responses.  
   - Connect the output of the Chat Trigger node to this HTTP Request node.

3. **Add Code Node to Format and Clean AI Response:**  
   - Add a `code` node named `Format & Clean AI Response`.  
   - Use the following JavaScript code to parse and format the streamed response:  
     ```javascript
     function extractAndFormatMarkdown(input) {
         let extractedContent = [];

         // Extract raw data string from n8n input
         let rawData = input.first().json.data;

         // Split into individual JSON strings
         let jsonStrings = rawData.split("\n\ndata: ").map(s => s.replace(/^data: /, ''));

         let lastContent = "";
         
         // Reverse loop to find the last "content" field
         for (let i = jsonStrings.length - 1; i >= 0; i--) {
             try {
                 let parsedChunk = JSON.parse(jsonStrings[i]);

                 if (parsedChunk.choices && parsedChunk.choices.length > 0) {
                     for (let j = parsedChunk.choices.length - 1; j >= 0; j--) {
                         let choice = parsedChunk.choices[j];

                         if (choice.delta && choice.delta.content) {
                             lastContent = choice.delta.content.trim();
                             break;
                         }
                     }
                 }

                 if (lastContent) break; // Stop once the last content is found
             } catch (error) {
                 console.error("Failed to parse JSON string:", jsonStrings[i], error);
             }
         }

         // Clean and format Markdown
         lastContent = lastContent.replace(/\[\^(\d+)\]: (.*?)\n/g, "[$1]: $2\n");  // Format footnotes
         lastContent = lastContent.replace(/\[\^(\d+)\]/g, "[^$1]");  // Inline footnotes
         lastContent = lastContent.replace(/(https?:\/\/[^\s]+)(?=[^]]*\])/g, "<$1>");  // Format links

         // Return formatted content as an array of objects (n8n expects this format)
         return [{ text: lastContent.trim() }];
     }

     // Execute function and return formatted output
     return extractAndFormatMarkdown($input);
     ```  
   - Connect the output of the HTTP Request node to this Code node.

4. **Add Sticky Notes for Documentation (Optional):**  
   - Add three `stickyNote` nodes with the following content:  
     - Author credits and LinkedIn link.  
     - Workflow summary emphasizing free, no API key needed.  
     - Detailed explanation of workflow steps and output formatting.  
   - Position these notes for clarity on the canvas.

5. **Activate and Test the Workflow:**  
   - Activate the workflow.  
   - Use the webhook URL from the Chat Trigger node to send a research query.  
   - Verify that the workflow returns a clean, well-structured markdown research report.

6. **Customization:**  
   - Modify the prompt in the HTTP Request node to tailor the AI’s research focus.  
   - Adjust the JavaScript code in the Code node to change formatting or output style.  
   - Integrate additional nodes or sub-workflows as needed for extended functionality.

---

### 5. General Notes & Resources

| Note Content                                                                                                                      | Context or Link                                                                                  |
|----------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Developed by Leonard van Hemert. Connect on LinkedIn for updates on AI & automation projects.                                    | [Leonard van Hemert LinkedIn](https://www.linkedin.com/in/leonard-van-hemert/)                  |
| Workflow is a free, no API key required AI-powered research tool leveraging Jina AI Deep Search.                                 | Workflow description and usage instructions embedded in sticky notes within the workflow.      |
| Inspired by and improves upon Open Deep Research 1.0 workflow available on n8n.io.                                               | [Open Deep Research 1.0](https://n8n.io/workflows/2883-open-deep-research-ai-powered-autonomous-research-workflow/) |
| Jina AI Deep Search API endpoint: https://deepsearch.jina.ai/v1/chat/completions                                                  | Official API endpoint used for AI research queries.                                            |
| Streaming response handling requires HTTP Request node version 4.2 or higher and proper parsing in the Code node.               | Important for developers modifying or extending the workflow.                                  |

---

This documentation provides a complete, structured understanding of the **AI-Powered Research with Jina AI Deep Search** workflow, enabling users and developers to reproduce, customize, and troubleshoot the workflow effectively.