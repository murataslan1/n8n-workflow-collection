AI-Powered Technical Analyst with Perplexity R1 Research

https://n8nworkflows.xyz/workflows/ai-powered-technical-analyst-with-perplexity-r1-research-3160


# AI-Powered Technical Analyst with Perplexity R1 Research

### 1. Workflow Overview

This workflow, titled **AI-Powered Technical Analyst with Perplexity R1 Research**, is designed to automate comprehensive financial market analysis by combining advanced AI vision and reasoning technologies. It targets users who want to leverage AI for technical chart analysis, fundamental research, and automated report delivery, particularly traders and financial analysts.

The workflow orchestrates multiple AI components and external services to:

- Analyze trading charts visually to identify technical indicators (e.g., RSI, volume patterns, support/resistance).
- Perform fundamental research using deep reasoning AI tools with up-to-date internet data.
- Synthesize technical and fundamental insights into a detailed report.
- Automatically deliver the report via email.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Receives chat messages or external workflow triggers to initiate analysis.
- **1.2 Memory Management:** Maintains conversational context using window buffer memory.
- **1.3 Technical Analysis Coordination:** The central agent orchestrates AI tools and workflows.
- **1.4 Chart Acquisition and Visual Analysis:** Downloads and processes TradingView charts using HTTP requests and AI vision.
- **1.5 Fundamental Research via Perplexity:** Uses Perplexity AI tools for deep fundamental analysis and reasoning.
- **1.6 Data Synthesis and Output Parsing:** Parses and structures AI outputs for coherent reporting.
- **1.7 Report Delivery:** Sends the final analysis report via Gmail.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:** This block triggers the workflow either by receiving a chat message or being executed by another workflow, serving as entry points.
- **Nodes Involved:**  
  - When chat message received  
  - When Executed by Another Workflow

- **Node Details:**

  - **When chat message received**  
    - Type: LangChain Chat Trigger  
    - Role: Listens for incoming chat messages to start the workflow.  
    - Configuration: Uses webhook with ID `119930c5-7935-4e78-bd47-1b2caba3af58`.  
    - Inputs: External chat messages.  
    - Outputs: Connects to Technical Analyst Leader node.  
    - Edge cases: Webhook failures, malformed messages.

  - **When Executed by Another Workflow**  
    - Type: Execute Workflow Trigger  
    - Role: Allows this workflow to be triggered by other workflows.  
    - Configuration: Default, no parameters.  
    - Inputs: Calls from other workflows.  
    - Outputs: Connects to Switch node for routing.  
    - Edge cases: Missing or invalid input data.

---

#### 1.2 Memory Management

- **Overview:** Maintains conversational context using a sliding window memory buffer to provide continuity in AI interactions.
- **Nodes Involved:**  
  - Window Buffer Memory

- **Node Details:**

  - **Window Buffer Memory**  
    - Type: LangChain Memory Buffer Window  
    - Role: Stores recent conversation history to maintain context.  
    - Configuration: Default window size (not explicitly set).  
    - Inputs: Receives data from Technical Analyst Leader.  
    - Outputs: Feeds back into Technical Analyst Leader as memory.  
    - Edge cases: Memory overflow, context loss if window size too small.

---

#### 1.3 Technical Analysis Coordination

- **Overview:** The central agent node coordinates AI tools, memory, and workflows to manage the overall analysis process.
- **Nodes Involved:**  
  - Technical Analyst Leader

- **Node Details:**

  - **Technical Analyst Leader**  
    - Type: LangChain Agent  
    - Role: Orchestrates AI tools, memory, and workflows to execute the analysis logic.  
    - Configuration: Connected to multiple AI tools and memory nodes.  
    - Inputs: Receives triggers from chat or workflow execution, memory data, and AI tool outputs.  
    - Outputs: Sends commands to AI tools and workflows (Technical Analysis Tool, Perplexity Tool, Gmail).  
    - Edge cases: Coordination failures, AI tool timeouts, memory inconsistencies.

---

#### 1.4 Chart Acquisition and Visual Analysis

- **Overview:** Downloads TradingView charts and performs AI vision-based technical analysis to extract key indicators.
- **Nodes Involved:**  
  - Switch  
  - Lookup Exchange  
  - Tradingview Chart  
  - Download Chart  
  - Extract analyst question and management response  
  - Sonnet 3_7  
  - Technical Analysis Tool

- **Node Details:**

  - **Switch**  
    - Type: Switch  
    - Role: Routes workflow based on input conditions (e.g., type of analysis requested).  
    - Inputs: From When Executed by Another Workflow.  
    - Outputs: To Lookup Exchange or Perplexity HTTP request node.  
    - Edge cases: Incorrect routing if conditions misconfigured.

  - **Lookup Exchange**  
    - Type: LangChain Chain LLM  
    - Role: Determines the correct exchange for the financial instrument.  
    - Inputs: From Switch and Perplexity Sonar.  
    - Outputs: To Tradingview Chart and Structured Output Parser.  
    - Edge cases: Incorrect exchange identification, LLM failures.

  - **Tradingview Chart**  
    - Type: HTTP Request  
    - Role: Requests chart image from TradingView via external API.  
    - Inputs: From Lookup Exchange.  
    - Outputs: To Download Chart.  
    - Configuration: Uses chart-img.com API (requires API key).  
    - Edge cases: API rate limits, invalid chart parameters.

  - **Download Chart**  
    - Type: HTTP Request  
    - Role: Downloads the actual chart image for analysis.  
    - Inputs: From Tradingview Chart.  
    - Outputs: To Extract analyst question and management response.  
    - Edge cases: Download failures, network timeouts.

  - **Extract analyst question and management response**  
    - Type: LangChain Chain LLM  
    - Role: Processes the chart image and extracts technical analysis questions and management responses.  
    - Inputs: From Download Chart and Sonnet 3_7.  
    - Outputs: To Set 'response' value.  
    - Edge cases: OCR or vision model errors, misinterpretation of chart data.

  - **Sonnet 3_7**  
    - Type: LangChain LM Chat OpenRouter  
    - Role: Provides AI vision capabilities using Claude Sonnet 3.7 model for chart analysis.  
    - Inputs: Feeds into Extract analyst question and management response.  
    - Outputs: To Extract analyst question and management response.  
    - Configuration: Requires OpenRouter.ai API key.  
    - Edge cases: API authentication errors, model response delays.

  - **Technical Analysis Tool**  
    - Type: LangChain Tool Workflow  
    - Role: Executes specialized technical analysis workflows as AI tools invoked by the Technical Analyst Leader.  
    - Inputs: From Technical Analyst Leader.  
    - Outputs: Back to Technical Analyst Leader.  
    - Edge cases: Sub-workflow failures, parameter mismatches.

---

#### 1.5 Fundamental Research via Perplexity

- **Overview:** Performs fundamental research using Perplexity AI tools with DeepSeek R1 reasoning and up-to-date internet data.
- **Nodes Involved:**  
  - Perplexity Tool  
  - Perplexity Sonar  
  - Perplexity  
  - Structured Output Parser

- **Node Details:**

  - **Perplexity Tool**  
    - Type: LangChain Tool Workflow  
    - Role: Runs fundamental research workflows as AI tools invoked by the Technical Analyst Leader.  
    - Inputs: From Technical Analyst Leader.  
    - Outputs: Back to Technical Analyst Leader.  
    - Edge cases: Sub-workflow failures, API errors.

  - **Perplexity Sonar**  
    - Type: LangChain LM Chat OpenRouter  
    - Role: Provides AI chat model access for Perplexity reasoning.  
    - Inputs: Feeds into Lookup Exchange.  
    - Outputs: To Lookup Exchange.  
    - Configuration: Requires OpenRouter.ai API key.  
    - Edge cases: Authentication, model timeouts.

  - **Perplexity**  
    - Type: HTTP Request  
    - Role: Calls Perplexity API for fundamental data retrieval.  
    - Inputs: From Switch node (routing).  
    - Outputs: To Response node.  
    - Edge cases: API rate limits, network errors.

  - **Structured Output Parser**  
    - Type: LangChain Output Parser Structured  
    - Role: Parses Perplexity API responses into structured data for further processing.  
    - Inputs: From Lookup Exchange.  
    - Outputs: To Lookup Exchange (feedback loop).  
    - Edge cases: Parsing errors, unexpected response formats.

---

#### 1.6 Data Synthesis and Output Parsing

- **Overview:** Synthesizes AI outputs into a coherent response and prepares the final report content.
- **Nodes Involved:**  
  - Set 'response' value  
  - Response

- **Node Details:**

  - **Set 'response' value**  
    - Type: Set  
    - Role: Stores the final synthesized response from AI analysis.  
    - Inputs: From Extract analyst question and management response.  
    - Outputs: None (end of chain for this branch).  
    - Edge cases: Data overwrite or missing values.

  - **Response**  
    - Type: Set  
    - Role: Prepares the final response data from Perplexity HTTP request.  
    - Inputs: From Perplexity node.  
    - Outputs: None (terminal node for fundamental research branch).  
    - Edge cases: Empty or malformed API responses.

---

#### 1.7 Report Delivery

- **Overview:** Sends the completed analysis report via Gmail to the user.
- **Nodes Involved:**  
  - Gmail

- **Node Details:**

  - **Gmail**  
    - Type: Gmail Tool  
    - Role: Sends email containing the analysis report.  
    - Inputs: From Technical Analyst Leader (ai_tool output).  
    - Outputs: None (final output).  
    - Configuration: Requires Gmail OAuth2 credentials connected.  
    - Edge cases: Authentication errors, email delivery failures.

---

### 3. Summary Table

| Node Name                               | Node Type                          | Functional Role                          | Input Node(s)                         | Output Node(s)                        | Sticky Note                         |
|----------------------------------------|----------------------------------|----------------------------------------|-------------------------------------|-------------------------------------|-----------------------------------|
| When chat message received              | LangChain Chat Trigger            | Entry point via chat message            | External webhook                    | Technical Analyst Leader             |                                   |
| When Executed by Another Workflow       | Execute Workflow Trigger          | Entry point via external workflow call | External call                      | Switch                             |                                   |
| Window Buffer Memory                    | LangChain Memory Buffer Window    | Maintains conversation context          | Technical Analyst Leader            | Technical Analyst Leader             |                                   |
| Technical Analyst Leader                | LangChain Agent                   | Central coordinator of AI tools          | When chat message received, Gmail, Window Buffer Memory, Technical Analysis Tool, Perplexity Tool | Technical Analysis Tool, Perplexity Tool, Gmail |                                   |
| Switch                                | Switch                           | Routes workflow based on input           | When Executed by Another Workflow   | Lookup Exchange, Perplexity          |                                   |
| Lookup Exchange                       | LangChain Chain LLM               | Determines correct exchange               | Switch, Perplexity Sonar            | Tradingview Chart, Structured Output Parser |                                   |
| Tradingview Chart                     | HTTP Request                     | Requests TradingView chart image          | Lookup Exchange                    | Download Chart                      |                                   |
| Download Chart                       | HTTP Request                     | Downloads chart image                      | Tradingview Chart                  | Extract analyst question and management response |                                   |
| Extract analyst question and management response | LangChain Chain LLM               | Extracts technical analysis questions from chart | Download Chart, Sonnet 3_7          | Set 'response' value                |                                   |
| Sonnet 3_7                           | LangChain LM Chat OpenRouter      | AI vision model for chart analysis        | -                                 | Extract analyst question and management response |                                   |
| Technical Analysis Tool               | LangChain Tool Workflow           | Executes technical analysis sub-workflow | Technical Analyst Leader           | Technical Analyst Leader             |                                   |
| Perplexity Tool                      | LangChain Tool Workflow           | Executes fundamental research sub-workflow | Technical Analyst Leader           | Technical Analyst Leader             |                                   |
| Perplexity Sonar                    | LangChain LM Chat OpenRouter      | AI chat model for Perplexity reasoning    | -                                 | Lookup Exchange                    |                                   |
| Perplexity                         | HTTP Request                     | Calls Perplexity API for fundamental data | Switch                           | Response                           |                                   |
| Structured Output Parser             | LangChain Output Parser Structured | Parses Perplexity API responses            | Lookup Exchange                   | Lookup Exchange                   |                                   |
| Set 'response' value                | Set                              | Stores final synthesized response          | Extract analyst question and management response | -                                 |                                   |
| Response                          | Set                              | Prepares final response data                | Perplexity                       | -                                 |                                   |
| Gmail                            | Gmail Tool                      | Sends analysis report via email             | Technical Analyst Leader           | -                                 | Requires Gmail OAuth2 credentials |
| Sticky Note1                      | Sticky Note                     | -                                          | -                                 | -                                 |                                   |
| Sticky Note2                      | Sticky Note                     | -                                          | -                                 | -                                 |                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Nodes:**
   - Add **When chat message received** (LangChain Chat Trigger) node.
     - Configure webhook to receive chat messages.
   - Add **When Executed by Another Workflow** (Execute Workflow Trigger) node.
     - Default configuration.

2. **Add Memory Node:**
   - Add **Window Buffer Memory** (LangChain Memory Buffer Window).
     - Connect input from **Technical Analyst Leader** (to be created).
     - Connect output back to **Technical Analyst Leader**.

3. **Add Central Agent Node:**
   - Add **Technical Analyst Leader** (LangChain Agent).
     - Connect inputs from **When chat message received**, **Window Buffer Memory**, **Gmail**, **Technical Analysis Tool**, and **Perplexity Tool**.
     - Connect outputs to **Technical Analysis Tool**, **Perplexity Tool**, and **Gmail**.

4. **Add Routing Node:**
   - Add **Switch** node.
     - Connect input from **When Executed by Another Workflow**.
     - Configure routing rules to direct to either **Lookup Exchange** or **Perplexity** HTTP request node.

5. **Add Exchange Lookup and Chart Nodes:**
   - Add **Lookup Exchange** (LangChain Chain LLM).
     - Connect input from **Switch** and **Perplexity Sonar**.
     - Connect outputs to **Tradingview Chart** and **Structured Output Parser**.
   - Add **Tradingview Chart** (HTTP Request).
     - Configure to call chart-img.com API with required API key.
     - Connect input from **Lookup Exchange**.
     - Connect output to **Download Chart**.
   - Add **Download Chart** (HTTP Request).
     - Configure to download chart image.
     - Connect input from **Tradingview Chart**.
     - Connect output to **Extract analyst question and management response**.

6. **Add Chart Analysis Nodes:**
   - Add **Extract analyst question and management response** (LangChain Chain LLM).
     - Connect input from **Download Chart** and **Sonnet 3_7**.
     - Connect output to **Set 'response' value**.
   - Add **Sonnet 3_7** (LangChain LM Chat OpenRouter).
     - Configure with OpenRouter.ai API key for Claude Sonnet 3.7 model.
     - Connect output to **Extract analyst question and management response**.

7. **Add Technical Analysis Tool:**
   - Add **Technical Analysis Tool** (LangChain Tool Workflow).
     - Connect input/output to/from **Technical Analyst Leader**.
     - Configure sub-workflow for technical analysis logic.

8. **Add Perplexity Research Nodes:**
   - Add **Perplexity Tool** (LangChain Tool Workflow).
     - Connect input/output to/from **Technical Analyst Leader**.
     - Configure sub-workflow for fundamental research.
   - Add **Perplexity Sonar** (LangChain LM Chat OpenRouter).
     - Configure with OpenRouter.ai API key.
     - Connect output to **Lookup Exchange**.
   - Add **Perplexity** (HTTP Request).
     - Configure to call Perplexity API.
     - Connect input from **Switch**.
     - Connect output to **Response**.
   - Add **Structured Output Parser** (LangChain Output Parser Structured).
     - Connect input from **Lookup Exchange**.
     - Connect output back to **Lookup Exchange**.

9. **Add Response Preparation Nodes:**
   - Add **Set 'response' value** (Set).
     - Connect input from **Extract analyst question and management response**.
   - Add **Response** (Set).
     - Connect input from **Perplexity** HTTP request.

10. **Add Email Delivery Node:**
    - Add **Gmail** (Gmail Tool).
      - Configure with Gmail OAuth2 credentials.
      - Connect input from **Technical Analyst Leader** (ai_tool output).

11. **Connect All Nodes According to the Workflow Logic:**
    - Ensure all connections match the described input/output relationships.
    - Validate API keys and credentials for OpenRouter.ai, chart-img.com, and Gmail.

12. **Test Workflow:**
    - Trigger via chat message or external workflow.
    - Verify chart download, AI vision analysis, fundamental research, and email delivery.

---

### 5. General Notes & Resources

| Note Content                                                                                         | Context or Link                                                                                      |
|----------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Quick start video included in the template for setup guidance.                                     | [YouTube Video](https://youtu.be/D11S0s3PDNc)                                                      |
| Workflow uses Claude Sonnet 3.7 vision capabilities via OpenRouter.ai API key.                      | Requires API key from OpenRouter.ai                                                                |
| TradingView chart images are fetched using chart-img.com API.                                      | Requires API key from chart-img.com                                                                |
| Automated email delivery requires Gmail OAuth2 credentials to be configured in the Gmail node.     | Gmail node configuration                                                                            |
| **Disclaimer:** This tool is for informational purposes only and not investment advice.             | Important to communicate to end-users                                                              |

---

This documentation provides a complete, structured reference for understanding, reproducing, and maintaining the AI-Powered Technical Analyst workflow with Perplexity R1 Research integration.