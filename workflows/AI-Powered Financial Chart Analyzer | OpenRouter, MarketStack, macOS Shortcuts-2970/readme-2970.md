AI-Powered Financial Chart Analyzer | OpenRouter, MarketStack, macOS Shortcuts

https://n8nworkflows.xyz/workflows/ai-powered-financial-chart-analyzer---openrouter--marketstack--macos-shortcuts-2970


# AI-Powered Financial Chart Analyzer | OpenRouter, MarketStack, macOS Shortcuts

### 1. Workflow Overview

The **AI-Powered Financial Chart Analyzer** workflow automates the processing and analysis of candlestick chart images for stocks and cryptocurrencies. It is designed to receive image data from a macOS Shortcut, convert it into a usable file format, and leverage AI and market data tools to generate insightful financial analysis and market research. The workflow integrates OpenRouter’s ChatGPT-4o-mini model for AI-driven interpretation, MarketStack for real-time stock data, and SerpAPI for market news and insights. The final output is formatted in HTML and returned via webhook.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception and Conversion:** Receives Base64 image data via webhook and converts it into a binary image file.
- **1.2 AI Processing and Market Data Integration:** Uses an AI agent powered by OpenRouter ChatGPT, with memory and auxiliary tools (Calculator, MarketStack, SerpAPI) to analyze the image and fetch relevant market data.
- **1.3 Output Formatting and Response:** Converts AI-generated Markdown content into HTML and sends it back through the webhook response.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception and Conversion

**Overview:**  
This block handles the initial reception of the candlestick chart image data from an external macOS Shortcut via a webhook. It then converts the incoming Base64-encoded image into a binary file format suitable for AI processing.

**Nodes Involved:**  
- Webhook  
- Fields_Data (Set node)  
- Base64_To_Binary_Image (Convert to File)

**Node Details:**

- **Webhook**  
  - *Type:* Webhook  
  - *Role:* Entry point for receiving HTTP POST requests containing Base64 image data from macOS Shortcut.  
  - *Configuration:* Default webhook with optional API key authentication (recommended for security).  
  - *Inputs:* External HTTP request.  
  - *Outputs:* Passes data to Fields_Data node.  
  - *Edge Cases:* Missing or malformed Base64 data; authentication failure if enabled; network timeouts.

- **Fields_Data**  
  - *Type:* Set  
  - *Role:* Prepares or extracts necessary fields from the webhook payload for downstream processing.  
  - *Configuration:* No explicit parameters shown; likely used to structure or rename incoming data fields.  
  - *Inputs:* Data from Webhook.  
  - *Outputs:* Passes structured data to Base64_To_Binary_Image.  
  - *Edge Cases:* Missing expected fields; expression evaluation errors.

- **Base64_To_Binary_Image**  
  - *Type:* Convert to File  
  - *Role:* Converts Base64 string into a binary image file for AI consumption.  
  - *Configuration:* Converts incoming Base64 data to binary file with appropriate mime type (e.g., image/png or image/jpeg).  
  - *Inputs:* Base64 data from Fields_Data.  
  - *Outputs:* Binary file passed to AI Agent node.  
  - *Edge Cases:* Invalid Base64 encoding; unsupported image formats; file size limits.

---

#### 1.2 AI Processing and Market Data Integration

**Overview:**  
This core block uses an AI agent to analyze the binary image of the candlestick chart. It integrates multiple tools and memory to enhance analysis: OpenRouter ChatGPT model for AI reasoning, Window Buffer Memory for context retention, Calculator for computations, MarketStack for stock data, and SerpAPI for market news.

**Nodes Involved:**  
- AI Agent  
- OpenRouter Chat Model  
- Window Buffer Memory  
- Calculator  
- Marketstack  
- SerpAPI

**Node Details:**

- **AI Agent**  
  - *Type:* LangChain Agent  
  - *Role:* Central orchestrator that processes the binary image input, invokes language model and tools, and generates analysis output.  
  - *Configuration:* Uses OpenRouter Chat Model as language model; integrates Window Buffer Memory and tools (Calculator, MarketStack, SerpAPI).  
  - *Inputs:* Binary image file from Base64_To_Binary_Image; AI tools and memory inputs.  
  - *Outputs:* Markdown text with financial analysis.  
  - *Version:* 1.7  
  - *Edge Cases:* Model errors if image processing not supported; API rate limits; tool invocation failures; memory overflow.

- **OpenRouter Chat Model**  
  - *Type:* LangChain Language Model (OpenRouter)  
  - *Role:* Provides AI natural language understanding and generation, including image processing capabilities.  
  - *Configuration:* Uses OpenRouter API key; model selected must support image input (e.g., ChatGPT-4o-mini).  
  - *Inputs:* Connected as language model input to AI Agent.  
  - *Outputs:* AI-generated text responses.  
  - *Edge Cases:* API key invalid or expired; model does not support images; network issues.

- **Window Buffer Memory**  
  - *Type:* LangChain Memory Buffer  
  - *Role:* Maintains conversational or session context for the AI agent to provide coherent analysis over multiple interactions.  
  - *Configuration:* Sliding window memory with configurable size.  
  - *Inputs:* Connected as memory input to AI Agent.  
  - *Outputs:* Contextual memory data for AI Agent.  
  - *Edge Cases:* Memory overflow; context loss on restart.

- **Calculator**  
  - *Type:* LangChain Tool  
  - *Role:* Provides computational capabilities for the AI agent to perform calculations on financial data.  
  - *Configuration:* Standard calculator tool integrated into AI Agent.  
  - *Inputs:* Invoked by AI Agent as needed.  
  - *Outputs:* Calculation results back to AI Agent.  
  - *Edge Cases:* Invalid expressions; division by zero.

- **Marketstack**  
  - *Type:* MarketStack Tool  
  - *Role:* Fetches real-time stock market data to enrich AI analysis.  
  - *Configuration:* Requires MarketStack API key; used sparingly in this workflow.  
  - *Inputs:* Invoked by AI Agent.  
  - *Outputs:* Market data for AI Agent.  
  - *Edge Cases:* API limits; invalid symbols; network errors.

- **SerpAPI**  
  - *Type:* LangChain Tool (SerpAPI)  
  - *Role:* Provides market research data such as news and insights about stocks.  
  - *Configuration:* Requires SerpAPI key; used for external market intelligence.  
  - *Inputs:* Invoked by AI Agent.  
  - *Outputs:* Search results for AI Agent.  
  - *Edge Cases:* API quota exceeded; query failures.

---

#### 1.3 Output Formatting and Response

**Overview:**  
This block converts the AI agent’s Markdown output into HTML format and sends the formatted response back to the original webhook caller.

**Nodes Involved:**  
- Markdown  
- Respond to Webhook

**Node Details:**

- **Markdown**  
  - *Type:* Markdown  
  - *Role:* Converts Markdown-formatted text from AI Agent into HTML for better presentation.  
  - *Configuration:* Default Markdown to HTML conversion.  
  - *Inputs:* Markdown text from AI Agent.  
  - *Outputs:* HTML content to Respond to Webhook.  
  - *Edge Cases:* Malformed Markdown; large content size.

- **Respond to Webhook**  
  - *Type:* Respond to Webhook  
  - *Role:* Sends the final HTML response back to the macOS Shortcut or other webhook caller.  
  - *Configuration:* Default response node; can be configured with HTTP status codes and headers.  
  - *Inputs:* HTML content from Markdown node.  
  - *Outputs:* HTTP response to external caller.  
  - *Edge Cases:* Network timeouts; client disconnects.

---

### 3. Summary Table

| Node Name               | Node Type                          | Functional Role                         | Input Node(s)            | Output Node(s)          | Sticky Note                                                                                           |
|-------------------------|----------------------------------|---------------------------------------|--------------------------|-------------------------|-----------------------------------------------------------------------------------------------------|
| Webhook                 | Webhook                          | Receives Base64 image data             | External HTTP request    | Fields_Data             |                                                                                                     |
| Fields_Data             | Set                              | Prepares/structures incoming data     | Webhook                  | Base64_To_Binary_Image  |                                                                                                     |
| Base64_To_Binary_Image  | Convert to File                  | Converts Base64 string to binary image| Fields_Data              | AI Agent                |                                                                                                     |
| AI Agent                | LangChain Agent                  | Processes image and integrates tools  | Base64_To_Binary_Image, OpenRouter Chat Model, Window Buffer Memory, Calculator, Marketstack, SerpAPI | Markdown                | Use a model capable of processing images; otherwise, workflow will error.                           |
| OpenRouter Chat Model   | LangChain Language Model (OpenRouter) | Provides AI language and image processing | Connected to AI Agent    | AI Agent                | Ensure OpenRouter API key and model support image input.                                            |
| Window Buffer Memory    | LangChain Memory Buffer          | Maintains AI context                   | Connected to AI Agent    | AI Agent                |                                                                                                     |
| Calculator              | LangChain Tool                  | Performs calculations                  | Connected to AI Agent    | AI Agent                |                                                                                                     |
| Marketstack             | MarketStack Tool                 | Fetches stock market data              | Connected to AI Agent    | AI Agent                | Rarely used; requires MarketStack API key.                                                         |
| SerpAPI                 | LangChain Tool (SerpAPI)         | Provides market news and insights      | Connected to AI Agent    | AI Agent                | Requires SerpAPI key; used for market research.                                                    |
| Markdown                | Markdown                        | Converts Markdown to HTML              | AI Agent                 | Respond to Webhook      |                                                                                                     |
| Respond to Webhook      | Respond to Webhook               | Sends final HTML response              | Markdown                 | External HTTP response  |                                                                                                     |
| Sticky Note             | Sticky Note                     | (No content)                          |                          |                         |                                                                                                     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Type: Webhook  
   - Purpose: Receive POST requests with Base64 image data from macOS Shortcut.  
   - Configure authentication with an API key if desired.  
   - Save webhook URL for macOS Shortcut configuration.

2. **Create Set Node (Fields_Data)**  
   - Type: Set  
   - Purpose: Extract and prepare necessary fields from webhook payload, e.g., Base64 image string.  
   - Configure to map incoming data fields appropriately.

3. **Create Convert to File Node (Base64_To_Binary_Image)**  
   - Type: Convert to File  
   - Purpose: Convert Base64 string from Fields_Data into a binary image file.  
   - Set input field to the Base64 string.  
   - Specify file type (e.g., image/png or image/jpeg).

4. **Create AI Agent Node**  
   - Type: LangChain Agent  
   - Purpose: Process the binary image and orchestrate AI and tool usage.  
   - Connect input from Base64_To_Binary_Image node.  
   - Configure AI Agent to use:  
     - OpenRouter Chat Model (as language model)  
     - Window Buffer Memory (as memory)  
     - Calculator, MarketStack, SerpAPI (as tools)  
   - Ensure AI Agent is configured to handle image inputs.

5. **Create OpenRouter Chat Model Node**  
   - Type: LangChain Language Model (OpenRouter)  
   - Purpose: Provide AI language and image processing capabilities.  
   - Configure with OpenRouter API key.  
   - Select model supporting image input (e.g., ChatGPT-4o-mini).  
   - Connect output to AI Agent’s language model input.

6. **Create Window Buffer Memory Node**  
   - Type: LangChain Memory Buffer  
   - Purpose: Maintain session context for AI Agent.  
   - Configure buffer size as needed.  
   - Connect output to AI Agent’s memory input.

7. **Create Calculator Node**  
   - Type: LangChain Tool (Calculator)  
   - Purpose: Enable AI Agent to perform calculations.  
   - Connect output to AI Agent’s tool input.

8. **Create MarketStack Node**  
   - Type: MarketStack Tool  
   - Purpose: Fetch real-time stock data.  
   - Configure with MarketStack API key.  
   - Connect output to AI Agent’s tool input.

9. **Create SerpAPI Node**  
   - Type: LangChain Tool (SerpAPI)  
   - Purpose: Provide market news and insights.  
   - Configure with SerpAPI key.  
   - Connect output to AI Agent’s tool input.

10. **Create Markdown Node**  
    - Type: Markdown  
    - Purpose: Convert AI Agent’s Markdown output to HTML.  
    - Connect input from AI Agent’s main output.

11. **Create Respond to Webhook Node**  
    - Type: Respond to Webhook  
    - Purpose: Send the final HTML response back to the webhook caller.  
    - Connect input from Markdown node.

12. **Connect Workflow**  
    - Webhook → Fields_Data → Base64_To_Binary_Image → AI Agent → Markdown → Respond to Webhook  
    - OpenRouter Chat Model → AI Agent (language model input)  
    - Window Buffer Memory → AI Agent (memory input)  
    - Calculator → AI Agent (tool input)  
    - MarketStack → AI Agent (tool input)  
    - SerpAPI → AI Agent (tool input)

13. **Credential Setup**  
    - Add API keys for OpenRouter, MarketStack, and SerpAPI in n8n credentials manager.  
    - Configure Webhook authentication if used.

14. **Test Workflow**  
    - Use the macOS Shortcut to send a Base64-encoded candlestick chart image to the webhook URL.  
    - Verify the response contains HTML-formatted AI financial analysis.

---

### 5. General Notes & Resources

| Note Content                                                                                                     | Context or Link                                                                                      |
|-----------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| The workflow requires an OpenRouter model capable of image processing, such as ChatGPT-4o-mini.                  | Setup Instructions, OpenRouter API Setup                                                           |
| Free API keys for OpenRouter, MarketStack, and SerpAPI have usage limits; consider upgrading for heavy use.      | Setup Instructions                                                                                   |
| MacOS Shortcut is required to capture and send Base64 image data to the webhook.                                 | Setup Instructions                                                                                   |
| Video demonstration available: [YouTube Video](https://youtu.be/CeEysWsV8RQ?si=EXxjmzF3ofXJa7Q9)                 | Video thumbnail: https://img.youtube.com/vi/CeEysWsV8RQ/maxresdefault.jpg                            |
| Disclaimer: AI-generated insights are for educational purposes only and not financial advice.                    | Disclaimer section                                                                                   |
| For best results, ensure network connectivity and valid API keys to avoid runtime errors.                        | General operational note                                                                            |

---

This documentation provides a detailed, structured reference for understanding, reproducing, and maintaining the AI-Powered Financial Chart Analyzer workflow in n8n.