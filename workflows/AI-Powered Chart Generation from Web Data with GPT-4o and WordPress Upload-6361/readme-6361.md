AI-Powered Chart Generation from Web Data with GPT-4o and WordPress Upload

https://n8nworkflows.xyz/workflows/ai-powered-chart-generation-from-web-data-with-gpt-4o-and-wordpress-upload-6361


# AI-Powered Chart Generation from Web Data with GPT-4o and WordPress Upload

---
### 1. Workflow Overview

This workflow automates the generation of chart images from real-time web data queries using GPT-4o and then uploads the resulting charts to a WordPress site. It is designed for users who want to transform natural language prompts about data trends into visual charts hosted on WordPress, leveraging AI agents for data gathering, interpretation, chart configuration, and image generation.

Logical blocks include:

- **1.1 Input Reception:** Triggering the workflow manually or via another workflow with a prompt.
- **1.2 Data Collection & Structuring:** Using GPT-4o search preview to obtain structured data tables from the web.
- **1.3 Chart Configuration Generation:** Transforming the markdown table into a valid Chart.js configuration JSON.
- **1.4 Chart Image Generation:** Sending the JSON config to QuickChart API to generate a chart image.
- **1.5 Image Upload to WordPress:** Uploading the generated chart image as media to WordPress.
- **1.6 Result Composition:** Aggregating all results into a final JSON output.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
This block receives the user's prompt to initiate data retrieval and chart generation. It supports manual triggering or invocation by another workflow.

**Nodes Involved:**  
- When clicking ‘Execute workflow’ (Manual Trigger)  
- When Executed by Another Workflow (Execute Workflow Trigger)

**Node Details:**  

- **When clicking ‘Execute workflow’**  
  - Type: Manual Trigger  
  - Configuration: No parameters, serves as a manual start.  
  - Input: User manually triggers workflow.  
  - Output: Passes control and prompt to the next node.  
  - Failure: None expected; manual start.  

- **When Executed by Another Workflow**  
  - Type: Execute Workflow Trigger  
  - Configuration: Accepts "prompt" input from calling workflow.  
  - Input: Receives prompt parameter.  
  - Output: Forwards prompt to downstream nodes.  
  - Failure: Missing or malformed prompt parameter may cause downstream issues.  

---

#### 1.2 Data Collection & Structuring

**Overview:**  
This block queries the web for up-to-date, structured data tables related to the prompt using GPT-4o search preview. It returns markdown tables and source URLs without interpretation.

**Nodes Involved:**  
- Message a model (OpenAI GPT-4o Search Preview)  
- Sticky Note (explanatory, labeled "Search the web")

**Node Details:**  

- **Message a model**  
  - Type: OpenAI Chat Model (GPT-4o Search Preview)  
  - Configuration:  
    - Model: gpt-4o-search-preview  
    - System prompt instructs the AI to collect relevant data from the web, format it as markdown tables with source URLs, and not interpret or visualize.  
    - Input messages include system instructions and the user prompt.  
  - Credentials: OpenAI API key linked to default project.  
  - Input: Prompt text from trigger nodes.  
  - Output: Markdown table string with data and sources.  
  - Failure cases: Network errors, API rate limits, malformed prompts.  

- **Sticky Note (Search the web)**  
  - Content: "## Search the web\nUsing Gpt 4o search preview and generate a table"  
  - Purpose: Documentation for users to understand the node's role.  

---

#### 1.3 Chart Configuration Generation

**Overview:**  
Transforms the markdown data table into a valid Chart.js configuration JSON object compatible with QuickChart. The AI selects appropriate chart types based on data structure.

**Nodes Involved:**  
- Generate Chart AI agent (Langchain Agent)  
- QuickChart Object Schema (Output Parser Structured)  
- Sticky Note1 (explanatory, labeled "Generate chart")

**Node Details:**  

- **Generate Chart AI agent**  
  - Type: Langchain Agent Node (Chart.js config generator)  
  - Configuration:  
    - Uses the content of the data table from the previous node as input text.  
    - System message defines agent role: transform markdown table into QuickChart JSON with chart type (line, bar, pie, doughnut, polarArea), labels, datasets, and title.  
    - Output: Strict JSON matching QuickChart schema without markdown or code blocks.  
    - Output parser enabled to validate JSON against schema.  
  - Input: Markdown table string from "Message a model" node.  
  - Output: JSON object representing Chart.js chart config.  
  - Failure cases: Parsing errors, invalid JSON output from AI, incomplete data interpretation.  

- **QuickChart Object Schema**  
  - Type: Langchain Output Parser Structured  
  - Configuration:  
    - Manual JSON schema defines expected chart object structure (slug, width, height, format, backgroundColor, version, chart type and data).  
    - Ensures AI output conforms strictly to this schema before passing downstream.  
  - Input: Output from Generate Chart AI agent node.  
  - Output: Validated JSON chart config.  
  - Failure cases: Schema validation failures if AI output does not match required format.  

- **Sticky Note1 (Generate chart)**  
  - Content: "## Generate chart\nUsing openchart / chart.js "  
  - Purpose: User documentation about chart generation process.  

---

#### 1.4 Chart Image Generation

**Overview:**  
Sends the validated Chart.js configuration JSON to QuickChart API to generate a chart image, returning the image as binary data.

**Nodes Involved:**  
- Create QuickChart (HTTP Request)  

**Node Details:**  

- **Create QuickChart**  
  - Type: HTTP Request  
  - Configuration:  
    - URL: https://quickchart.io/chart  
    - Method: POST  
    - Content-Type: JSON  
    - Body: Chart config JSON from previous step.  
    - Sends body as JSON to QuickChart API to generate image.  
  - Input: Validated chart config JSON.  
  - Output: Binary image data (PNG by default).  
  - Failure cases: Network errors, QuickChart API downtime, invalid chart config causing API errors.  

---

#### 1.5 Image Upload to WordPress

**Overview:**  
Uploads the generated chart image to a WordPress media library via REST API, setting a filename based on the chart slug.

**Nodes Involved:**  
- Upload image2 (HTTP Request)  
- Sticky Note2 (explanatory, labeled "Upload chart image to WP")

**Node Details:**  

- **Upload image2**  
  - Type: HTTP Request  
  - Configuration:  
    - URL: https://your.wordpress.com/wp-json/wp/v2/media (replace with actual site)  
    - Method: POST  
    - Body: Binary data from QuickChart image generation.  
    - Headers: `Content-Disposition` with filename using chart slug, e.g., chart-ev-sales-2024.png  
    - Authentication: WordPress OAuth2 or API credentials (wordpressApi credential node)  
  - Input: Binary image data from QuickChart node.  
  - Output: JSON response from WordPress with media info including URL.  
  - Retry: Enabled with 5 seconds wait between tries to handle transient upload failures.  
  - Failure cases: Authentication errors, API rate limits, invalid site URL, network issues.  

- **Sticky Note2**  
  - Content: "## Upload chart image to WP"  
  - Purpose: User documentation.  

---

#### 1.6 Result Composition

**Overview:**  
Aggregates key outputs—raw data, chart config, uploaded image info, and final image URL—into a consolidated JSON for downstream use or reporting.

**Nodes Involved:**  
- Code (JavaScript code node)

**Node Details:**  

- **Code**  
  - Type: Code Node (JavaScript)  
  - Configuration:  
    - Returns an object containing:  
      - `research`: raw data output from "Message a model"  
      - `graph_data`: JSON chart config from "Generate Chart AI agent"  
      - `graph_image`: upload response from "Upload image2"  
      - `result_image_url`: direct URL string extracted from upload response.  
  - Input: Outputs from prior nodes via references.  
  - Output: Structured JSON with all relevant result data.  
  - Failure cases: Missing references if prior nodes fail; runtime JavaScript errors if outputs are malformed.  

---

### 3. Summary Table

| Node Name                   | Node Type                            | Functional Role                         | Input Node(s)                      | Output Node(s)                   | Sticky Note                                               |
|-----------------------------|------------------------------------|---------------------------------------|----------------------------------|---------------------------------|-----------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger                     | Manual start and prompt input          | -                                | Message a model                  |                                                           |
| When Executed by Another Workflow | Execute Workflow Trigger           | Receives prompt from another workflow | -                                | Message a model                  |                                                           |
| Message a model              | OpenAI Chat Model (GPT-4o search) | Collects structured data table from web | When clicking ‘Execute workflow’, When Executed by Another Workflow | Generate Chart AI agent          | ## Search the web<br>Using Gpt 4o search preview and generate a table |
| Generate Chart AI agent      | Langchain Agent                    | Converts markdown table to Chart.js JSON | Message a model, QuickChart Object Schema | Create QuickChart               | ## Generate chart<br>Using openchart / chart.js            |
| QuickChart Object Schema     | Output Parser Structured           | Validates Chart.js config JSON         | Generate Chart AI agent           | Generate Chart AI agent          |                                                           |
| Create QuickChart            | HTTP Request                      | Sends Chart.js JSON to QuickChart API | Generate Chart AI agent           | Upload image2                   |                                                           |
| Upload image2                | HTTP Request                      | Uploads chart image to WordPress       | Create QuickChart                 | Code                           | ## Upload chart image to WP                                |
| Code                        | Code Node (JavaScript)             | Aggregates and formats final outputs   | Upload image2, Generate Chart AI agent, Message a model | -                               |                                                           |
| Sticky Note                 | Sticky Note                       | Documentation                         | -                                | -                               | ## Search the web<br>Using Gpt 4o search preview and generate a table |
| Sticky Note1                | Sticky Note                       | Documentation                         | -                                | -                               | ## Generate chart<br>Using openchart / chart.js            |
| Sticky Note2                | Sticky Note                       | Documentation                         | -                                | -                               | ## Upload chart image to WP                                |
| Sticky Note3                | Sticky Note                       | Documentation                         | -                                | -                               | ## Convert the table to chart.js<br>![openchart graph](https://articles.emp0.com/wp-content/uploads/2025/07/chart-apple-market-share-q1-2025.png) |
| Sticky Note4                | Sticky Note                       | Documentation                         | -                                | -                               | ## Search the web and generate a table<br>Example markdown table with sources |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Name: When clicking ‘Execute workflow’  
   - Type: Manual Trigger  
   - No parameters.  

2. **Create Execute Workflow Trigger Node**  
   - Name: When Executed by Another Workflow  
   - Type: Execute Workflow Trigger  
   - Configure inputs to accept a parameter named `prompt`.  

3. **Create OpenAI Chat Model Node**  
   - Name: Message a model  
   - Type: OpenAI Chat Model (Langchain openAi)  
   - Model: Select `gpt-4o-search-preview`  
   - Messages:  
     - System role message instructing data aggregation agent to search the web, return markdown tables with sources, no interpretation.  
     - User message uses expression: `{{$json["prompt"]}}` to pass prompt from trigger nodes.  
   - Credential: Link your OpenAI API credentials.  

4. **Add Sticky Note** (optional)  
   - Name: Sticky Note (Search the web)  
   - Content: "## Search the web\nUsing Gpt 4o search preview and generate a table"  

5. **Create Langchain Agent Node**  
   - Name: Generate Chart AI agent  
   - Type: Langchain Agent  
   - Text input: Expression `{{$json["message"]["content"]}}` from "Message a model" output.  
   - System message: Define agent role as Chart.js config generator with instructions to parse markdown tables, select chart type, and output strict JSON (no markdown/code blocks).  
   - Enable output parser.  

6. **Create Output Parser Node**  
   - Name: QuickChart Object Schema  
   - Type: Output Parser Structured (Langchain)  
   - Schema: Input manual JSON schema defining Chart.js config structure including slug, width, height, format, chart type, datasets, options, etc.  
   - Connect output from Agent node to this parser.  

7. **Add Sticky Note** (optional)  
   - Name: Sticky Note1 (Generate chart)  
   - Content: "## Generate chart\nUsing openchart / chart.js "  

8. **Create HTTP Request Node for QuickChart**  
   - Name: Create QuickChart  
   - Method: POST  
   - URL: https://quickchart.io/chart  
   - Body: Set to JSON mode with expression `{{$json["output"]}}` (validated Chart.js config JSON)  
   - Content-Type: application/json  

9. **Create HTTP Request Node for WordPress Upload**  
   - Name: Upload image2  
   - Method: POST  
   - URL: Your WordPress site's media endpoint, e.g., `https://your.wordpress.com/wp-json/wp/v2/media`  
   - Content-Type: binaryData  
   - Send body: binary data from "Create QuickChart" node  
   - Headers: Add `Content-Disposition` with value `attachment; filename="chart-{{$json["output"]["slug"]}}.png"`  
   - Authentication: Use WordPress OAuth2 or API credential node  
   - Enable retry on failure with 5 seconds wait  

10. **Add Sticky Note** (optional)  
    - Name: Sticky Note2  
    - Content: "## Upload chart image to WP"  

11. **Create Code Node to Aggregate Results**  
    - Name: Code  
    - JavaScript code:  
      ```js
      return {
        research: $('Message a model').item.json,
        graph_data: $('Generate Chart AI agent').item.json.output,
        graph_image: $('Upload image2').item.json,
        result_image_url: $('Upload image2').item.json.guid.raw,
      };
      ```  

12. **Add Sticky Notes** (optional)  
    - Sticky Note3: Shows example chart image and explanation of converting tables to charts.  
    - Sticky Note4: Example markdown table output for reference.  

13. **Connect Nodes in This Order:**  
    - When clicking ‘Execute workflow’ → Message a model  
    - When Executed by Another Workflow → Message a model  
    - Message a model → Generate Chart AI agent → QuickChart Object Schema (parser) → Generate Chart AI agent (continue) → Create QuickChart → Upload image2 → Code  

---

### 5. General Notes & Resources

| Note Content                                                                                  | Context or Link                                                                                                      |
|-----------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| Workflow uses GPT-4o search preview to extract real-time data tables from the web.            | Data extraction step; see OpenAI GPT-4o search preview model documentation.                                         |
| Chart configurations comply with QuickChart API format based on Chart.js v3.9.1 conventions.  | QuickChart: https://quickchart.io/documentation/                                                                    |
| WordPress media upload via REST API with OAuth2 authentication.                              | WordPress REST API media endpoint docs: https://developer.wordpress.org/rest-api/reference/media/                   |
| Example generated chart image: ![openchart graph](https://articles.emp0.com/wp-content/uploads/2025/07/chart-apple-market-share-q1-2025.png) | Demonstrates expected output for Apple market share data.                                                           |
| Source data example from Canalys and Counterpoint Research included in markdown output.       | Reliable data sources used in example; links provided in sticky notes and AI responses.                              |

---

**Disclaimer:**  
The text and logic described above originate exclusively from an automated n8n workflow using GPT-4o and associated nodes. All data handled are public and legal. The workflow respects content policies and does not contain illegal or offensive material.