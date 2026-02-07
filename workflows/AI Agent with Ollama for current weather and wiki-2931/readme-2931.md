AI Agent with Ollama for current weather and wiki

https://n8nworkflows.xyz/workflows/ai-agent-with-ollama-for-current-weather-and-wiki-2931


# AI Agent with Ollama for current weather and wiki

### 1. Workflow Overview

This workflow implements an AI-powered conversational agent that provides users with current weather information and Wikipedia summaries by leveraging local Large Language Models (LLMs) through Ollama. It is designed to operate entirely within n8n, avoiding external API dependencies for AI processing, thus enhancing privacy and control over data.

The workflow is logically divided into the following blocks:

- **1.1 User Input Reception:** Captures user queries via a manual chat trigger node.
- **1.2 AI Agent Processing:** Uses an AI Agent node configured with Ollama’s LLM to interpret user input, maintain conversation context, and decide which tool to invoke.
- **1.3 Tool Integration:** Connects the AI Agent to two external data retrieval tools:
  - Weather data retrieval via an HTTP Request node querying Open-Meteo API.
  - Wikipedia content retrieval and summarization via a Wikipedia tool node.
- **1.4 Memory Management:** Maintains a sliding window buffer of the last 20 conversation messages to provide context for the AI Agent.

---

### 2. Block-by-Block Analysis

#### 2.1 User Input Reception

- **Overview:**  
  This block initiates the workflow by capturing manual chat messages from users. It serves as the entry point for user queries.

- **Nodes Involved:**  
  - On new manual Chat Message

- **Node Details:**  
  - **On new manual Chat Message**  
    - Type: Manual Chat Trigger (LangChain)  
    - Role: Listens for new chat messages manually input by users to start the workflow.  
    - Configuration: Default, no parameters set.  
    - Inputs: None (trigger node).  
    - Outputs: Sends the user input text to the AI Agent node.  
    - Edge Cases: No specific failure modes; however, if no input is provided, the workflow will not proceed.  
    - Sub-workflow: None.

---

#### 2.2 AI Agent Processing

- **Overview:**  
  This block processes the user input using a conversational AI agent powered by Ollama’s local LLM. It interprets the query, decides which tool to use (weather or Wikipedia), and manages conversation context.

- **Nodes Involved:**  
  - AI Agent  
  - Ollama Chat Model  
  - Window Buffer Memory  
  - Sticky Note (System Message Instructions)  
  - Sticky Note (Conversation Buffer Explanation)  
  - Sticky Note (Agent Tools Explanation)

- **Node Details:**  
  - **AI Agent**  
    - Type: LangChain Agent Node  
    - Role: Core conversational AI node that receives user input, uses the LLM to interpret it, and calls appropriate tools.  
    - Configuration:  
      - Input text expression: `={{ $json.input }}` (takes user input from trigger).  
      - System message: "You are a helpful assistant, with weather tool and wiki tool. find out the latitude and longitude information of a location then use the weather tool for current weather and weather forecast. For general info, use the wiki tool."  
      - Prompt type: Define (custom system prompt).  
    - Inputs: Receives user input from "On new manual Chat Message".  
    - Outputs: Sends tool invocation requests to Wikipedia and Weather HTTP Request nodes; sends language model calls to Ollama Chat Model; uses Window Buffer Memory for context.  
    - Edge Cases:  
      - Expression failures if input is missing or malformed.  
      - Potential timeout or errors from Ollama API.  
      - Misinterpretation if system message is unclear.  
    - Sub-workflow: None.

  - **Ollama Chat Model**  
    - Type: Language Model (Ollama)  
    - Role: Provides the AI Agent with local LLM capabilities using Ollama’s llama3.2:latest model.  
    - Configuration:  
      - Model: `llama3.2:latest`  
      - Credentials: Local Ollama service configured with OAuth or API key.  
    - Inputs: Receives prompts from AI Agent.  
    - Outputs: Returns generated text to AI Agent.  
    - Edge Cases:  
      - Connection failures to Ollama service.  
      - Model loading or inference errors.  
    - Sub-workflow: None.

  - **Window Buffer Memory**  
    - Type: Memory Buffer (LangChain)  
    - Role: Stores the last 20 messages of conversation history to provide context for the AI Agent.  
    - Configuration:  
      - Context window length: 20 messages.  
    - Inputs: Connected to AI Agent’s memory input.  
    - Outputs: Supplies conversation history to AI Agent.  
    - Edge Cases:  
      - Buffer overflow beyond 20 messages is handled by sliding window logic.  
      - Potential data loss if node fails.  
    - Sub-workflow: None.

  - **Sticky Notes**  
    - Provide documentation within the workflow:  
      - System message instructions for AI Agent.  
      - Explanation of conversation history buffer.  
      - Description of tools available to the agent.

---

#### 2.3 Tool Integration

- **Overview:**  
  This block contains the tools the AI Agent can invoke to fulfill user requests: fetching weather data and retrieving Wikipedia summaries.

- **Nodes Involved:**  
  - Weather HTTP Request  
  - Wikipedia

- **Node Details:**  
  - **Weather HTTP Request**  
    - Type: HTTP Request Tool (LangChain)  
    - Role: Fetches current temperature data from Open-Meteo API based on latitude and longitude provided by the AI Agent.  
    - Configuration:  
      - URL: `https://api.open-meteo.com/v1/forecast`  
      - Query parameters:  
        - `latitude` (dynamic, from AI Agent)  
        - `longitude` (dynamic, from AI Agent)  
        - `forecast_days`: fixed value `"1"`  
        - `hourly`: fixed value `"temperature_2m"`  
      - Tool description: "Fetch current temperature for given coordinates."  
    - Inputs: Receives tool invocation from AI Agent with coordinates.  
    - Outputs: Returns weather data to AI Agent.  
    - Edge Cases:  
      - API downtime or network errors.  
      - Invalid or missing coordinates causing empty or error responses.  
      - Rate limiting by Open-Meteo.  
    - Sub-workflow: None.

  - **Wikipedia**  
    - Type: Wikipedia Tool (LangChain)  
    - Role: Retrieves Wikipedia content and generates summaries for general information queries.  
    - Configuration: Default Wikipedia tool settings.  
    - Inputs: Receives tool invocation from AI Agent with query terms.  
    - Outputs: Returns summarized Wikipedia content to AI Agent.  
    - Edge Cases:  
      - No matching Wikipedia article found.  
      - Network or API errors.  
    - Sub-workflow: None.

---

### 3. Summary Table

| Node Name                 | Node Type                          | Functional Role                          | Input Node(s)              | Output Node(s)             | Sticky Note                                                                                  |
|---------------------------|----------------------------------|----------------------------------------|----------------------------|----------------------------|----------------------------------------------------------------------------------------------|
| On new manual Chat Message | Manual Chat Trigger (LangChain)  | Captures user chat input                | -                          | AI Agent                   |                                                                                              |
| AI Agent                  | LangChain Agent Node              | Processes input, manages tools & memory| On new manual Chat Message  | Wikipedia, Weather HTTP Request |                                                                                              |
| Ollama Chat Model         | Language Model (Ollama)           | Provides local LLM for AI Agent         | AI Agent                   | AI Agent                   |                                                                                              |
| Window Buffer Memory      | Memory Buffer (LangChain)         | Maintains last 20 messages conversation | AI Agent                   | AI Agent                   | The conversation history(last 20 messages) is stored in a buffer memory                      |
| Weather HTTP Request      | HTTP Request Tool (LangChain)     | Fetches current weather data             | AI Agent                   | AI Agent                   |                                                                                              |
| Wikipedia                 | Wikipedia Tool (LangChain)        | Retrieves and summarizes Wikipedia info | AI Agent                   | AI Agent                   |                                                                                              |
| Sticky Note               | Sticky Note                      | System message instructions for AI Agent| -                          | -                          | In System Message, add the following: "You are a helpful assistant, with weather tool and wiki tool. find out the latitude and longitude information of a location then use the weather tool for current weather and weather forecast. For general info, use the wiki tool." |
| Sticky Note3              | Sticky Note                      | Explains tools available to AI Agent    | -                          | -                          | Tools which agent can use to accomplish the task                                            |
| Sticky Note4              | Sticky Note                      | Explains conversation buffer memory     | -                          | -                          | The conversation history(last 20 messages) is stored in a buffer memory                      |
| Sticky Note6              | Sticky Note                      | Notes on conversational agent usage     | -                          | -                          | Conversational agent will utilise available tools to answer the prompt.                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Manual Chat Trigger Node**  
   - Add node: `On new manual Chat Message` (LangChain Manual Chat Trigger)  
   - No special configuration needed.

2. **Create the Ollama Chat Model Node**  
   - Add node: `Ollama Chat Model` (LangChain LM Chat Ollama)  
   - Set model to `llama3.2:latest`.  
   - Configure credentials with your local Ollama API service (OAuth2 or API key).  
   - Leave options empty.

3. **Create the Window Buffer Memory Node**  
   - Add node: `Window Buffer Memory` (LangChain Memory Buffer Window)  
   - Set `contextWindowLength` to 20.

4. **Create the AI Agent Node**  
   - Add node: `AI Agent` (LangChain Agent)  
   - Set input text expression to `={{ $json.input }}` to receive user input.  
   - Under options, set the system message to:  
     `"You are a helpful assistant, with weather tool and wiki tool. find out the latitude and longitude information of a location then use the weather tool for current weather and weather forecast. For general info, use the wiki tool."`  
   - Set prompt type to `define`.  
   - Connect the AI Agent node’s language model input to the `Ollama Chat Model` node.  
   - Connect the AI Agent node’s memory input to the `Window Buffer Memory` node.

5. **Create the Weather HTTP Request Node**  
   - Add node: `Weather HTTP Request` (LangChain Tool HTTP Request)  
   - Set URL to `https://api.open-meteo.com/v1/forecast`.  
   - Enable sending query parameters.  
   - Add query parameters:  
     - `latitude` (dynamic, from AI Agent)  
     - `longitude` (dynamic, from AI Agent)  
     - `forecast_days` = `"1"` (fixed)  
     - `hourly` = `"temperature_2m"` (fixed)  
   - Add tool description: "Fetch current temperature for given coordinates."

6. **Create the Wikipedia Node**  
   - Add node: `Wikipedia` (LangChain Tool Wikipedia)  
   - Use default configuration.

7. **Connect Nodes**  
   - Connect `On new manual Chat Message` output to `AI Agent` main input.  
   - Connect `AI Agent` ai_languageModel input to `Ollama Chat Model` output.  
   - Connect `AI Agent` ai_memory input to `Window Buffer Memory` output.  
   - Connect `AI Agent` ai_tool outputs to both `Weather HTTP Request` and `Wikipedia` nodes.

8. **Add Sticky Notes for Documentation (Optional but Recommended)**  
   - Add sticky notes with the following content:  
     - System message instructions for AI Agent.  
     - Explanation that the conversation history (last 20 messages) is stored in a buffer memory.  
     - Description of tools available to the AI Agent.  
     - Note that the conversational agent uses available tools to answer prompts.

9. **Credential Setup**  
   - Ensure Ollama API credentials are configured in n8n.  
   - No credentials needed for Open-Meteo or Wikipedia nodes (public APIs).

10. **Test the Workflow**  
    - Trigger the workflow manually by sending chat messages.  
    - Verify that weather queries return current temperature data.  
    - Verify that general knowledge queries return Wikipedia summaries.

---

### 5. General Notes & Resources

| Note Content                                                                                              | Context or Link                                                                                  |
|-----------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| This workflow demonstrates privacy-conscious AI integration by using Ollama’s local LLMs instead of cloud APIs. | Workflow description and purpose.                                                              |
| Ollama installation and setup are prerequisites: https://ollama.com/docs/installation                      | Official Ollama documentation for local LLM deployment.                                        |
| Open-Meteo API used for weather data: https://open-meteo.com/en/docs                                    | Public weather API with no authentication required.                                            |
| Wikipedia tool leverages LangChain’s Wikipedia integration for content retrieval and summarization.       | LangChain Wikipedia tool documentation: https://js.langchain.com/docs/modules/tools/tools/wikipedia |
| The system message guides the AI Agent to use latitude and longitude extraction for weather queries.      | Critical for correct tool invocation and accurate weather data retrieval.                       |

---

This structured documentation enables developers and AI agents to fully understand, reproduce, and customize the AI Agent workflow integrating Ollama for weather and Wikipedia queries within n8n.