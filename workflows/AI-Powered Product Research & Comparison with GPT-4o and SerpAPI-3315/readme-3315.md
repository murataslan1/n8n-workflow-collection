AI-Powered Product Research & Comparison with GPT-4o and SerpAPI

https://n8nworkflows.xyz/workflows/ai-powered-product-research---comparison-with-gpt-4o-and-serpapi-3315


# AI-Powered Product Research & Comparison with GPT-4o and SerpAPI

### 1. Workflow Overview

This workflow automates comprehensive product research and comparison using GPT-4o and SerpAPI. It is designed to help users quickly identify and evaluate top-tier products for purchase by leveraging AI-driven search and review aggregation, condensing hours of manual research into minutes.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Captures the user’s product query via chat.
- **1.2 Item Finder Agent:** Uses GPT-4o and SerpAPI to generate search queries and identify 5 top products matching the user’s input.
- **1.3 Reviewer Agents (5 parallel agents):** Each agent performs an in-depth review of one product using GPT-4o and SerpAPI, gathering detailed descriptions, pricing, retailer options, review summaries, and star ratings.
- **1.4 Data Aggregation and Compilation:** Merges all product reviews and uses a GPT-4o-mini powered Compiler Agent to organize and present the information concisely.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block initiates the workflow by receiving a chat message containing the product name or description the user wants to research.

- **Nodes Involved:**  
  - When chat message received

- **Node Details:**  
  - **When chat message received**  
    - Type: Chat Trigger (LangChain)  
    - Role: Listens for incoming chat messages to start the workflow.  
    - Configuration: Default webhook-based trigger, no parameters set.  
    - Inputs: External chat message input.  
    - Outputs: Triggers the Item Finder Agent node.  
    - Edge Cases: Failure to receive message due to webhook misconfiguration or network issues.  
    - Version: 1.1  

#### 2.2 Item Finder Agent

- **Overview:**  
  This block uses GPT-4o to generate search queries based on the user’s input, then uses SerpAPI to find 5 high-quality products matching the query. The results are parsed into a structured format and dispatched to the Reviewer Agents.

- **Nodes Involved:**  
  - Item Finder (Agent)  
  - OpenAI Chat Model1  
  - Window Buffer Memory1  
  - SerpAPI1  
  - Structured Output Parser

- **Node Details:**  
  - **Item Finder**  
    - Type: LangChain Agent  
    - Role: Coordinates AI-driven search and product identification.  
    - Configuration: Uses OpenAI Chat Model1 for GPT-4o, SerpAPI1 for web search, Window Buffer Memory1 for context retention, and Structured Output Parser to format results.  
    - Inputs: Triggered by chat message node.  
    - Outputs: Sends 5 product names to Reviewer Agents.  
    - Edge Cases: API rate limits, malformed search queries, parsing errors.  
    - Version: 1.7  

  - **OpenAI Chat Model1**  
    - Type: GPT-4o Chat Model  
    - Role: Generates search queries and interprets search results.  
    - Configuration: Connected to Item Finder agent, requires OpenAI API key.  
    - Inputs: Prompts from Item Finder.  
    - Outputs: Text responses to Item Finder.  
    - Edge Cases: API key invalid, rate limits, model timeout.  
    - Version: 1.2  

  - **Window Buffer Memory1**  
    - Type: Memory Buffer (LangChain)  
    - Role: Maintains conversational context for the Item Finder agent.  
    - Configuration: Default window size, connected to Item Finder.  
    - Inputs/Outputs: Context data to/from Item Finder.  
    - Edge Cases: Memory overflow or context loss.  
    - Version: 1.3  

  - **SerpAPI1**  
    - Type: SerpAPI Tool  
    - Role: Performs web searches to find product data.  
    - Configuration: Connected to Item Finder, requires SerpAPI key.  
    - Inputs: Search queries from Item Finder.  
    - Outputs: Search results to Item Finder.  
    - Edge Cases: API quota exceeded, invalid API key, network errors.  
    - Version: 1  

  - **Structured Output Parser**  
    - Type: Output Parser (LangChain)  
    - Role: Parses raw AI output into structured data (product list).  
    - Configuration: Connected to Item Finder.  
    - Inputs: Raw text from GPT-4o.  
    - Outputs: Structured product list to Item Finder.  
    - Edge Cases: Parsing failures due to unexpected output format.  
    - Version: 1.2  

#### 2.3 Reviewer Agents (Five Parallel Agents)

- **Overview:**  
  Each Reviewer Agent receives one product name and performs a detailed review using GPT-4o and SerpAPI. They gather detailed product features, lowest prices, retailer options, review summaries, and star ratings.

- **Nodes Involved:**  
  - Reviewer 1, Reviewer 2, Reviewer 3, Reviewer 4, Reviewer 5 (Agents)  
  - OpenAI Chat Model2, OpenAI Chat Model3, OpenAI Chat Model4, OpenAI Chat Model5, OpenAI Chat Model6  
  - SerpAPI, SerpAPI2, SerpAPI3, SerpAPI4, SerpAPI5

- **Node Details (common pattern for each Reviewer):**  
  - **Reviewer X**  
    - Type: LangChain Agent  
    - Role: Conducts in-depth product review.  
    - Configuration: Uses corresponding OpenAI Chat Model and SerpAPI nodes.  
    - Inputs: Product name from Item Finder.  
    - Outputs: Detailed review data to Merge1 node.  
    - Edge Cases: API failures, incomplete data, timeout, rate limits.  
    - Version: 1.7  

  - **OpenAI Chat ModelX**  
    - Type: GPT-4o Chat Model  
    - Role: Generates detailed product descriptions and review summaries.  
    - Configuration: Connected to respective Reviewer Agent, requires OpenAI API key.  
    - Inputs: Prompts from Reviewer Agent.  
    - Outputs: Text responses to Reviewer Agent.  
    - Edge Cases: API key issues, rate limits, model timeouts.  
    - Version: 1.2  

  - **SerpAPIX**  
    - Type: SerpAPI Tool  
    - Role: Searches for pricing, retailers, and reviews online.  
    - Configuration: Connected to respective Reviewer Agent, requires SerpAPI key.  
    - Inputs: Search queries from Reviewer Agent.  
    - Outputs: Search results to Reviewer Agent.  
    - Edge Cases: API quota exceeded, invalid key, network errors.  
    - Version: 1  

#### 2.4 Data Aggregation and Compilation

- **Overview:**  
  This block merges all five detailed reviews, aggregates the data, and then uses a Compiler Agent powered by GPT-4o-mini to organize and present the information in a concise, readable format.

- **Nodes Involved:**  
  - Merge1  
  - Aggregate1  
  - Compiler (Agent)  
  - OpenAI Chat Model  
 
- **Node Details:**  
  - **Merge1**  
    - Type: Merge (n8n core)  
    - Role: Combines outputs from all five Reviewer Agents into one stream.  
    - Configuration: Default merge mode (likely “Wait for all inputs”).  
    - Inputs: Main outputs from Reviewer 1 to Reviewer 5.  
    - Outputs: Combined data to Aggregate1.  
    - Edge Cases: Missing input if any Reviewer fails.  
    - Version: 3  

  - **Aggregate1**  
    - Type: Aggregate (n8n core)  
    - Role: Aggregates merged data into a single item for final processing.  
    - Configuration: Default aggregation mode (likely “Merge into single item”).  
    - Inputs: Output from Merge1.  
    - Outputs: Aggregated data to Compiler.  
    - Edge Cases: Empty input if Merge1 fails.  
    - Version: 1  

  - **Compiler**  
    - Type: LangChain Agent  
    - Role: Uses GPT-4o-mini to format and summarize all product reviews into a concise, organized report.  
    - Configuration: Connected to OpenAI Chat Model for GPT-4o-mini.  
    - Inputs: Aggregated review data from Aggregate1.  
    - Outputs: Final compiled product comparison report.  
    - Edge Cases: API failures, formatting errors.  
    - Version: 1.7  

  - **OpenAI Chat Model**  
    - Type: GPT-4o-mini Chat Model  
    - Role: Provides language model capabilities for the Compiler Agent.  
    - Configuration: Requires OpenAI API key.  
    - Inputs: Prompts from Compiler Agent.  
    - Outputs: Text response to Compiler Agent.  
    - Edge Cases: API key invalid, rate limits, timeouts.  
    - Version: 1.2  

---

### 3. Summary Table

| Node Name                 | Node Type                         | Functional Role                          | Input Node(s)                       | Output Node(s)                      | Sticky Note                                                                                      |
|---------------------------|----------------------------------|----------------------------------------|-----------------------------------|-----------------------------------|------------------------------------------------------------------------------------------------|
| When chat message received| Chat Trigger (LangChain)          | Receives user product query via chat   | External chat input                | Item Finder                       |                                                                                                |
| Item Finder               | LangChain Agent                  | Generates search queries, finds 5 products | When chat message received         | Reviewer 1, Reviewer 2, Reviewer 3, Reviewer 4, Reviewer 5 |                                                                                                |
| OpenAI Chat Model1        | GPT-4o Chat Model               | GPT-4o model for Item Finder agent     | Item Finder                       | Item Finder                      |                                                                                                |
| Window Buffer Memory1     | Memory Buffer (LangChain)       | Maintains context for Item Finder      | Item Finder                       | Item Finder                      |                                                                                                |
| SerpAPI1                  | SerpAPI Tool                   | Performs web search for Item Finder    | Item Finder                       | Item Finder                      |                                                                                                |
| Structured Output Parser  | Output Parser (LangChain)       | Parses Item Finder output into structured list | Item Finder                       | Item Finder                      |                                                                                                |
| Reviewer 1                | LangChain Agent                  | Reviews product 1 in detail             | Item Finder                      | Merge1                          |                                                                                                |
| OpenAI Chat Model2        | GPT-4o Chat Model               | GPT-4o model for Reviewer 1             | Reviewer 1                      | Reviewer 1                     |                                                                                                |
| SerpAPI                   | SerpAPI Tool                   | Web search for Reviewer 1               | Reviewer 1                      | Reviewer 1                     |                                                                                                |
| Reviewer 2                | LangChain Agent                  | Reviews product 2 in detail             | Item Finder                      | Merge1                          |                                                                                                |
| OpenAI Chat Model3        | GPT-4o Chat Model               | GPT-4o model for Reviewer 2             | Reviewer 2                      | Reviewer 2                     |                                                                                                |
| SerpAPI2                  | SerpAPI Tool                   | Web search for Reviewer 2               | Reviewer 2                      | Reviewer 2                     |                                                                                                |
| Reviewer 3                | LangChain Agent                  | Reviews product 3 in detail             | Item Finder                      | Merge1                          |                                                                                                |
| OpenAI Chat Model4        | GPT-4o Chat Model               | GPT-4o model for Reviewer 3             | Reviewer 3                      | Reviewer 3                     |                                                                                                |
| SerpAPI3                  | SerpAPI Tool                   | Web search for Reviewer 3               | Reviewer 3                      | Reviewer 3                     |                                                                                                |
| Reviewer 4                | LangChain Agent                  | Reviews product 4 in detail             | Item Finder                      | Merge1                          |                                                                                                |
| OpenAI Chat Model5        | GPT-4o Chat Model               | GPT-4o model for Reviewer 4             | Reviewer 4                      | Reviewer 4                     |                                                                                                |
| SerpAPI4                  | SerpAPI Tool                   | Web search for Reviewer 4               | Reviewer 4                      | Reviewer 4                     |                                                                                                |
| Reviewer 5                | LangChain Agent                  | Reviews product 5 in detail             | Item Finder                      | Merge1                          |                                                                                                |
| OpenAI Chat Model6        | GPT-4o Chat Model               | GPT-4o model for Reviewer 5             | Reviewer 5                      | Reviewer 5                     |                                                                                                |
| SerpAPI5                  | SerpAPI Tool                   | Web search for Reviewer 5               | Reviewer 5                      | Reviewer 5                     |                                                                                                |
| Merge1                    | Merge (n8n core)                | Combines all 5 reviewer outputs        | Reviewer 1, Reviewer 2, Reviewer 3, Reviewer 4, Reviewer 5 | Aggregate1                     |                                                                                                |
| Aggregate1                | Aggregate (n8n core)            | Aggregates merged data into single item | Merge1                          | Compiler                       |                                                                                                |
| Compiler                  | LangChain Agent                  | Compiles and formats final report      | Aggregate1                      | (final output)                 |                                                                                                |
| OpenAI Chat Model         | GPT-4o-mini Chat Model          | GPT-4o-mini model for Compiler agent   | Compiler                       | Compiler                      |                                                                                                |
| Sticky Note               | Sticky Note                    | (Empty content)                         | None                           | None                          |                                                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Node:**  
   - Add a **Chat Trigger (LangChain)** node named "When chat message received".  
   - No special parameters needed; this node listens for incoming chat messages.

2. **Create Item Finder Agent Block:**  
   - Add an **Agent (LangChain)** node named "Item Finder".  
   - Connect "When chat message received" → "Item Finder".  
   - Add an **OpenAI Chat Model** node named "OpenAI Chat Model1".  
     - Configure with your OpenAI API key, model set to GPT-4o.  
   - Add a **Window Buffer Memory** node named "Window Buffer Memory1".  
     - Default settings to maintain context.  
   - Add a **SerpAPI Tool** node named "SerpAPI1".  
     - Configure with your SerpAPI key.  
   - Add a **Structured Output Parser** node named "Structured Output Parser".  
     - Default settings to parse AI output into structured data.  
   - Connect "OpenAI Chat Model1", "Window Buffer Memory1", "SerpAPI1", and "Structured Output Parser" as AI tools/memory/output parser to "Item Finder" agent accordingly.

3. **Create Reviewer Agents (Five Parallel Blocks):**  
   For each Reviewer (1 to 5):  
   - Add an **Agent (LangChain)** node named "Reviewer X".  
   - Connect "Item Finder" main output (index 0) → "Reviewer X" main input (index 0).  
   - Add an **OpenAI Chat Model** node named "OpenAI Chat ModelX+1" (e.g., OpenAI Chat Model2 for Reviewer 1).  
     - Configure with OpenAI API key, GPT-4o model.  
   - Add a **SerpAPI Tool** node named "SerpAPIX" (e.g., SerpAPI for Reviewer 1).  
     - Configure with SerpAPI key.  
   - Connect "OpenAI Chat ModelX+1" and "SerpAPIX" as AI tools to "Reviewer X" agent.

4. **Create Data Aggregation Block:**  
   - Add a **Merge** node named "Merge1".  
     - Connect outputs of all five Reviewer agents to "Merge1" inputs (each to a separate input).  
     - Use default merge mode (wait for all inputs).  
   - Add an **Aggregate** node named "Aggregate1".  
     - Connect "Merge1" output → "Aggregate1" input.  
     - Use default aggregation to combine into a single item.

5. **Create Compiler Agent Block:**  
   - Add an **Agent (LangChain)** node named "Compiler".  
   - Connect "Aggregate1" output → "Compiler" input.  
   - Add an **OpenAI Chat Model** node named "OpenAI Chat Model".  
     - Configure with OpenAI API key, GPT-4o-mini model (smaller, cost-effective).  
   - Connect "OpenAI Chat Model" as AI language model to "Compiler" agent.

6. **Final Connections:**  
   - Ensure "Compiler" node output is the final output of the workflow.

7. **Credentials Setup:**  
   - Configure OpenAI API credentials for all OpenAI Chat Model nodes.  
   - Configure SerpAPI credentials for all SerpAPI nodes.

8. **Default Values and Constraints:**  
   - Use default parameters for memory and output parser nodes unless specific tuning is needed.  
   - Ensure API keys have sufficient quota and billing enabled.  
   - Monitor API usage to avoid hitting rate limits.

---

### 5. General Notes & Resources

| Note Content                                                                                                                        | Context or Link                                                                                   |
|------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| GPT-4o usage costs approximately $0.06 per workflow run; ensure your OpenAI account is funded accordingly.                        | OpenAI Pricing: https://platform.openai.com/pricing                                            |
| SerpAPI allows 100 free searches per month; consider multiple accounts and API keys for higher usage.                             | SerpAPI Sign-up: https://serpapi.com/users/sign_up                                             |
| This workflow is ideal for users seeking quick, comprehensive product research without manual browsing and review reading.        | Workflow Description (above)                                                                    |
| Use the OpenAI GPT-4o-mini model in the Compiler agent to reduce costs while maintaining quality summary output.                 |                                                                                                 |

---

This documentation provides a complete, structured understanding of the workflow, enabling reproduction, modification, and troubleshooting by advanced users or AI agents.