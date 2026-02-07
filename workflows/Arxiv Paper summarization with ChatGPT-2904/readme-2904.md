Arxiv Paper summarization with ChatGPT

https://n8nworkflows.xyz/workflows/arxiv-paper-summarization-with-chatgpt-2904


# Arxiv Paper summarization with ChatGPT

### 1. Workflow Overview

This workflow automates the summarization of academic papers hosted on arXiv by extracting key content and generating a structured summary. It is designed for researchers, students, and professionals who want to quickly grasp the essential insights of lengthy research papers without reading them in full.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Receives an arXiv paper ID via a webhook.
- **1.2 Paper Retrieval:** Fetches the HTML content of the paper from arXiv.
- **1.3 Content Extraction:** Extracts the abstract and main sections from the HTML.
- **1.4 Content Preparation:** Splits sections into individual paragraphs and cleans text by removing unnecessary links.
- **1.5 Summarization:** Summarizes each paragraph using a language model and aggregates the results.
- **1.6 Structured Summary Generation:** Reorganizes the aggregated summary into defined sections (Abstract Overview, Introduction, Results, Conclusion) using OpenAI.
- **1.7 Information Extraction & Response:** Extracts key structured information and responds to the webhook with the final summary.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block receives incoming requests containing the arXiv paper ID to be summarized.

- **Nodes Involved:**  
  - Webhook  
  - Respond to Webhook

- **Node Details:**

  - **Webhook**  
    - Type: HTTP Webhook Trigger  
    - Role: Entry point for the workflow, listens for HTTP requests at path `/paper-summarization`.  
    - Configuration: Uses default options, response mode set to "responseNode" to defer response until workflow completion.  
    - Inputs: External HTTP request with JSON payload containing `query.id` (arXiv paper ID).  
    - Outputs: Passes data to "Request to Paper Page" node.  
    - Edge Cases: Invalid or missing paper ID in request; malformed requests.

  - **Respond to Webhook**  
    - Type: HTTP Response Node  
    - Role: Sends back the final structured summary as JSON to the requester.  
    - Configuration: Responds with JSON body from `$json.output` (final extracted summary).  
    - Inputs: Receives structured summary from "Content Extractor".  
    - Outputs: HTTP response to client.  
    - Edge Cases: Failure to generate summary or missing output data.

---

#### 2.2 Paper Retrieval

- **Overview:**  
  Fetches the HTML content of the specified arXiv paper page using the paper ID.

- **Nodes Involved:**  
  - Request to Paper Page

- **Node Details:**

  - **Request to Paper Page**  
    - Type: HTTP Request  
    - Role: Retrieves the full HTML page of the paper from `https://arxiv.org/html/{{ $json.query.id }}`.  
    - Configuration: URL dynamically constructed using the incoming paper ID from webhook query parameter. No special headers or authentication.  
    - Inputs: Receives paper ID from Webhook node.  
    - Outputs: Passes raw HTML content to "Extract Contents".  
    - Edge Cases: Network errors, invalid paper ID leading to 404 or empty response, rate limiting by arXiv.

---

#### 2.3 Content Extraction

- **Overview:**  
  Parses the HTML to extract the abstract and all main textual sections of the paper.

- **Nodes Involved:**  
  - Extract Contents

- **Node Details:**

  - **Extract Contents**  
    - Type: HTML Extractor  
    - Role: Extracts specific HTML elements using CSS selectors.  
    - Configuration:  
      - Extracts `div.ltx_abstract` as `abstract` (single string).  
      - Extracts all `div.ltx_para` elements as `sections` (array of strings).  
    - Inputs: Receives HTML content from "Request to Paper Page".  
    - Outputs: JSON with keys `abstract` and `sections` (array).  
    - Edge Cases: Changes in arXiv HTML structure may break selectors; empty or missing sections.

---

#### 2.4 Content Preparation

- **Overview:**  
  Splits the extracted sections into individual paragraphs and cleans the text by removing bracketed links or references.

- **Nodes Involved:**  
  - Split out All Sections  
  - Remove useless links

- **Node Details:**

  - **Split out All Sections**  
    - Type: Split Out  
    - Role: Splits the `sections` array into individual items for separate processing.  
    - Configuration: Splits on field `sections`.  
    - Inputs: Receives JSON with `sections` array from "Extract Contents".  
    - Outputs: Emits one item per section paragraph downstream.  
    - Edge Cases: Empty sections array leads to no output items.

  - **Remove useless links**  
    - Type: Set  
    - Role: Cleans each section paragraph by removing bracketed references or links (e.g., `[1]`, `[ref]`).  
    - Configuration: Uses JavaScript expression to replace all occurrences of `\[.*?\]` regex with empty string on the `sections` field.  
    - Inputs: Receives individual section paragraphs from "Split out All Sections".  
    - Outputs: Cleaned text passed to "Summarization Chain".  
    - Edge Cases: Unexpected text formats may cause incomplete cleaning.

---

#### 2.5 Summarization

- **Overview:**  
  Summarizes each cleaned paragraph individually using a language model, then aggregates all summaries.

- **Nodes Involved:**  
  - OpenAI Chat Model  
  - Summarization Chain  
  - Aggregate summarzied content

- **Node Details:**

  - **OpenAI Chat Model**  
    - Type: LangChain OpenAI Chat Model  
    - Role: Provides the language model backend for summarization.  
    - Configuration: Uses `gpt-3.5-turbo` model with default options.  
    - Credentials: OpenAI API key configured under `OpenAi account(n8n_)`.  
    - Inputs: Connected as AI language model for "Summarization Chain".  
    - Outputs: Summarization Chain uses this model for text summarization.  
    - Edge Cases: API rate limits, authentication errors, model unavailability.

  - **Summarization Chain**  
    - Type: LangChain Summarization Chain  
    - Role: Summarizes each paragraph text using the OpenAI Chat Model.  
    - Configuration: Default summarization options (no custom prompt).  
    - Inputs: Receives cleaned section paragraphs from "Remove useless links".  
    - Outputs: Summarized text for each paragraph.  
    - Edge Cases: Summarization failures, empty input text.

  - **Aggregate summarzied content**  
    - Type: Aggregate  
    - Role: Aggregates all summarized paragraph texts into a single array.  
    - Configuration: Aggregates on field `response.text`.  
    - Inputs: Receives multiple summarized paragraph outputs from "Summarization Chain".  
    - Outputs: Single item with aggregated array of summaries.  
    - Edge Cases: No summaries to aggregate if previous steps fail.

---

#### 2.6 Structured Summary Generation

- **Overview:**  
  Reorganizes the aggregated summary into a structured format with four key sections using OpenAI.

- **Nodes Involved:**  
  - Reorganize Paper Summary  
  - Content Extractor  
  - OpenAI Chat Model1

- **Node Details:**

  - **Reorganize Paper Summary**  
    - Type: LangChain OpenAI Node  
    - Role: Generates a structured summary divided into Abstract Overview, Introduction, Results, and Conclusion.  
    - Configuration:  
      - Model: `gpt-3.5-turbo`  
      - System prompt instructs the model to produce a detailed summary with specified content requirements for each section.  
      - Input: Joins aggregated summaries with `|` delimiter and passes as user message content.  
    - Credentials: Uses same OpenAI API key.  
    - Inputs: Receives aggregated summary array from "Aggregate summarzied content".  
    - Outputs: Full structured summary text.  
    - Edge Cases: Model hallucination, incomplete or inconsistent summaries.

  - **Content Extractor**  
    - Type: LangChain Information Extractor  
    - Role: Extracts and classifies the structured summary text into four named attributes: Abstract Overview, Introduction, Results, Conclusion.  
    - Configuration:  
      - Input text is the content of the first choice message from "Reorganize Paper Summary".  
      - Attributes are required and have descriptions to guide extraction.  
    - Inputs: Receives structured summary text from "Reorganize Paper Summary".  
    - Outputs: JSON object with four keys containing extracted sections.  
    - Edge Cases: Extraction errors if summary format deviates; missing sections.

  - **OpenAI Chat Model1**  
    - Type: LangChain OpenAI Chat Model  
    - Role: Provides language model support for "Content Extractor".  
    - Configuration: Same as previous OpenAI Chat Model node.  
    - Inputs: Connected as AI language model for "Content Extractor".  
    - Outputs: Supports extraction process.  
    - Edge Cases: Same as other OpenAI nodes.

---

#### 2.7 Information Extraction & Response

- **Overview:**  
  Sends the final structured summary back to the requester via the webhook response.

- **Nodes Involved:**  
  - Respond to Webhook (already covered in 2.1)

- **Node Details:**  
  - Receives extracted structured summary from "Content Extractor".  
  - Responds with JSON containing keys: Abstract Overview, Introduction, Results, Conclusion.

---

### 3. Summary Table

| Node Name               | Node Type                                | Functional Role                          | Input Node(s)             | Output Node(s)               | Sticky Note                                                                                      |
|-------------------------|----------------------------------------|----------------------------------------|---------------------------|-----------------------------|------------------------------------------------------------------------------------------------|
| Webhook                 | HTTP Webhook Trigger                   | Receives arXiv paper ID request        | -                         | Request to Paper Page        |                                                                                                |
| Request to Paper Page    | HTTP Request                          | Fetches HTML content of paper          | Webhook                   | Extract Contents            |                                                                                                |
| Extract Contents        | HTML Extractor                        | Extracts abstract and sections          | Request to Paper Page      | Split out All Sections       |                                                                                                |
| Split out All Sections  | Split Out                            | Splits sections array into paragraphs  | Extract Contents           | Remove useless links         |                                                                                                |
| Remove useless links    | Set                                  | Cleans text by removing bracketed links| Split out All Sections     | Summarization Chain          |                                                                                                |
| OpenAI Chat Model       | LangChain OpenAI Chat Model           | Provides language model for summarization | Summarization Chain (AI LM) | Summarization Chain (AI LM) |                                                                                                |
| Summarization Chain     | LangChain Summarization Chain         | Summarizes each paragraph               | Remove useless links       | Aggregate summarzied content |                                                                                                |
| Aggregate summarzied content | Aggregate                        | Aggregates all paragraph summaries      | Summarization Chain        | Reorganize Paper Summary     |                                                                                                |
| Reorganize Paper Summary| LangChain OpenAI Node                 | Generates structured summary sections   | Aggregate summarzied content | Content Extractor           |                                                                                                |
| OpenAI Chat Model1      | LangChain OpenAI Chat Model           | Provides language model for extraction  | Content Extractor (AI LM)  | Content Extractor (AI LM)    |                                                                                                |
| Content Extractor       | LangChain Information Extractor       | Extracts key sections from summary      | Reorganize Paper Summary   | Respond to Webhook           |                                                                                                |
| Respond to Webhook      | HTTP Response Node                    | Sends final structured summary response | Content Extractor          | -                           |                                                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Type: Webhook  
   - Path: `paper-summarization`  
   - Response Mode: `responseNode` (to send response after workflow completes)  
   - No authentication required.

2. **Create HTTP Request Node ("Request to Paper Page")**  
   - Type: HTTP Request  
   - URL: `https://arxiv.org/html/{{ $json.query.id }}` (dynamic using incoming webhook query parameter `id`)  
   - Method: GET (default)  
   - No authentication or headers needed.  
   - Connect Webhook node output to this node input.

3. **Create HTML Extractor Node ("Extract Contents")**  
   - Type: HTML Extract  
   - Operation: Extract HTML Content  
   - Extraction Values:  
     - Key: `abstract` — CSS Selector: `div.ltx_abstract` (single string)  
     - Key: `sections` — CSS Selector: `div.ltx_para` (return array)  
   - Connect "Request to Paper Page" output to this node.

4. **Create Split Out Node ("Split out All Sections")**  
   - Type: Split Out  
   - Field to Split Out: `sections` (array from previous node)  
   - Connect "Extract Contents" output to this node.

5. **Create Set Node ("Remove useless links")**  
   - Type: Set  
   - Add assignment:  
     - Field: `sections` (string)  
     - Value: `={{ $json.sections.replaceAll(/\[.*?\]/g, '') }}` (removes bracketed references)  
   - Connect "Split out All Sections" output to this node.

6. **Create LangChain OpenAI Chat Model Node ("OpenAI Chat Model")**  
   - Type: LangChain OpenAI Chat Model  
   - Model: `gpt-3.5-turbo`  
   - Credentials: Configure OpenAI API credentials (e.g., `OpenAi account(n8n_)`)  
   - No special options needed.

7. **Create LangChain Summarization Chain Node ("Summarization Chain")**  
   - Type: LangChain Summarization Chain  
   - Options: Default (no custom prompt)  
   - Connect "Remove useless links" output to this node input.  
   - Connect "OpenAI Chat Model" as AI language model for this node.

8. **Create Aggregate Node ("Aggregate summarzied content")**  
   - Type: Aggregate  
   - Field to Aggregate: `response.text` (the summarized paragraph text)  
   - Connect "Summarization Chain" output to this node.

9. **Create LangChain OpenAI Node ("Reorganize Paper Summary")**  
   - Type: LangChain OpenAI  
   - Model: `gpt-3.5-turbo`  
   - Credentials: Use same OpenAI API credentials  
   - Messages:  
     - System role message with detailed instructions to generate summary divided into Abstract Overview, Introduction, Results, Conclusion with specific content requirements.  
     - User role message with content: `={{ $json.text.join('|') }}` (joins aggregated summaries with pipe delimiter)  
   - Connect "Aggregate summarzied content" output to this node.

10. **Create LangChain OpenAI Chat Model Node ("OpenAI Chat Model1")**  
    - Type: LangChain OpenAI Chat Model  
    - Model: `gpt-3.5-turbo`  
    - Credentials: Same OpenAI API credentials  
    - Connect as AI language model for "Content Extractor".

11. **Create LangChain Information Extractor Node ("Content Extractor")**  
    - Type: LangChain Information Extractor  
    - Text: `={{ $json.choices[0].message.content }}` (content from "Reorganize Paper Summary")  
    - Attributes to extract (all required):  
      - Abstract Overview (short summary of research topic, objectives, methodology, results, conclusions)  
      - Introduction (background, motivation, literature gaps, study objectives)  
      - Results (key experimental results, data analysis, interpretation)  
      - Conclusion (implications, limitations, future research, final conclusions)  
    - Connect "Reorganize Paper Summary" output to this node.  
    - Connect "OpenAI Chat Model1" as AI language model.

12. **Connect "Content Extractor" output to "Respond to Webhook" Node**  
    - Create Respond to Webhook node  
    - Respond with JSON body: `={{ $json.output }}` (the extracted structured summary)  
    - Connect "Content Extractor" output to this node.

13. **Set Execution Order**  
    - Ensure nodes are connected in the following order:  
      Webhook → Request to Paper Page → Extract Contents → Split out All Sections → Remove useless links → Summarization Chain (with OpenAI Chat Model) → Aggregate summarzied content → Reorganize Paper Summary → Content Extractor (with OpenAI Chat Model1) → Respond to Webhook

14. **Test the Workflow**  
    - Trigger webhook with a valid arXiv paper ID as query parameter `id`.  
    - Verify the JSON response contains the four structured summary sections.

---

### 5. General Notes & Resources

| Note Content                                                                                                   | Context or Link                                                                                      |
|---------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| This workflow is designed specifically for arXiv papers but can be adapted to other academic sources.         | Workflow description and customization notes.                                                      |
| To customize, adjust HTTP Request node URL or summarization prompts to fit other paper repositories.           | Workflow customization section.                                                                    |
| OpenAI API credentials must be configured in n8n for all LangChain OpenAI nodes.                               | Credential setup instructions.                                                                     |
| For notifications, consider adding email or Slack nodes after summary generation.                              | Suggested workflow enhancement.                                                                    |
| The system prompt in "Reorganize Paper Summary" node contains detailed instructions for summary structure.    | Critical for ensuring output format consistency.                                                   |
| ArXiv HTML structure may change, requiring updates to CSS selectors in "Extract Contents" node.                | Maintenance note for long-term workflow reliability.                                              |
| Official arXiv site: https://arxiv.org/                                                                         | Reference for paper source.                                                                         |

---

This completes the comprehensive documentation of the "Webhook | Paper Summarization" workflow, enabling users and AI agents to understand, reproduce, and modify the workflow effectively.