Analyze & Tag User Feedback in Notion with GPT-4 Sentiment Analysis

https://n8nworkflows.xyz/workflows/analyze---tag-user-feedback-in-notion-with-gpt-4-sentiment-analysis-3689


# Analyze & Tag User Feedback in Notion with GPT-4 Sentiment Analysis

### 1. Workflow Overview

This n8n workflow automates the processing of user feedback collected in a Notion database by leveraging GPT-4 for sentiment analysis and insight tagging. It is designed to help product teams and founders structure qualitative feedback, identify actionable insights, and maintain an organized feedback-insight relationship within Notion.

The workflow is logically divided into the following blocks:

- **1.1 Trigger & Input Reception:** Detects updates in the Notion Feedback database with new or updated feedback entries.
- **1.2 Sentiment Analysis:** Uses OpenAI GPT-4 to analyze the sentiment of the feedback (Positive, Neutral, Negative) and updates the Notion Feedback item accordingly.
- **1.3 Product Context Setup & Database Preparation:** Retrieves Notion database structures and sets product-specific context to guide AI analysis.
- **1.4 AI Insight Analysis Agent:** Runs an AI agent that compares feedback against existing insights, decides if a new insight is needed, and prepares structured output.
- **1.5 Output Parsing & Auto-fixing:** Parses the AI agent’s structured output and applies auto-fixing to handle formatting errors.
- **1.6 Notion Update & Insight Creation:** Updates the Feedback item with sentiment and links it to existing or newly created Insights in Notion, marking feedback as processed.

---

### 2. Block-by-Block Analysis

#### 1.1 Trigger & Input Reception

- **Overview:** Listens for updates on feedback items in the Notion Feedback database, filtering to process only feedback with status `Received`.
- **Nodes Involved:**  
  - `on database item update`
  - `Sentiment Analysis1`
  - `Set the Product information`
  - `Merge`
- **Node Details:**

  - **on database item update**  
    - Type: Notion Trigger  
    - Role: Starts workflow on any update in the Notion Feedback database.  
    - Configuration: Connected to the Feedback database; triggers on item updates.  
    - Inputs: Event from Notion API on item update.  
    - Outputs: Passes updated feedback data downstream.  
    - Edge Cases: Missed triggers if Notion integration permissions are insufficient; triggers on all updates, so downstream filtering is required.

  - **Sentiment Analysis1**  
    - Type: LangChain Sentiment Analysis (OpenAI GPT-4)  
    - Role: Performs sentiment classification on the feedback text.  
    - Configuration: Uses OpenAI credentials; analyzes feedback content field.  
    - Inputs: Feedback text from trigger node.  
    - Outputs: Sentiment label (Positive, Neutral, Negative).  
    - Edge Cases: API timeouts, rate limits, or malformed input text.

  - **Set the Product information**  
    - Type: Set Node  
    - Role: Defines product overview and core features as context variables for AI.  
    - Configuration: Static or user-defined product context data.  
    - Inputs: Trigger data.  
    - Outputs: Enriches data with product context for AI agent.  
    - Edge Cases: Missing or incomplete product context may reduce AI accuracy.

  - **Merge**  
    - Type: Merge Node  
    - Role: Combines outputs from sentiment analysis and product context setup for unified input to next steps.  
    - Inputs: Sentiment analysis output and product context data.  
    - Outputs: Merged data object.  
    - Edge Cases: Data mismatch or missing inputs can cause merge failures.

---

#### 1.2 Sentiment Analysis

- **Overview:** Uses OpenAI GPT-4 to classify the sentiment of user feedback and updates the Notion Feedback item with this sentiment.
- **Nodes Involved:**  
  - `OpenAI - Sentiment Analysis`  
  - `Sentiment Analysis1`  
  - `update feedback sentiment analysis`
- **Node Details:**

  - **OpenAI - Sentiment Analysis**  
    - Type: LangChain OpenAI Chat Model  
    - Role: Calls GPT-4 to classify sentiment.  
    - Configuration: Uses OpenAI API key; prompt tailored for sentiment classification.  
    - Inputs: Feedback content.  
    - Outputs: Sentiment label.  
    - Edge Cases: API errors, malformed prompts.

  - **Sentiment Analysis1**  
    - (See above in 1.1) Acts as a wrapper or processor node for sentiment classification.

  - **update feedback sentiment analysis**  
    - Type: Notion Node (Update)  
    - Role: Updates the sentiment select field in the Feedback database item.  
    - Configuration: Maps sentiment result to Notion property.  
    - Inputs: Sentiment label and feedback item ID.  
    - Outputs: Confirmation of update.  
    - Edge Cases: Notion API errors, permission issues, rate limits.

---

#### 1.3 Product Context Setup & Database Preparation

- **Overview:** Retrieves Notion database schema and cleans properties to prepare for AI processing, ensuring the AI agent has accurate context about the product and database structure.
- **Nodes Involved:**  
  - `Set the Product information`  
  - `Get database structure`  
  - `Clean the database propertied`  
  - `Set Prompt`
- **Node Details:**

  - **Get database structure**  
    - Type: Notion Node (Get Database)  
    - Role: Fetches schema and properties of the Notion databases (Feedback and Insights).  
    - Inputs: Triggered after setting product info.  
    - Outputs: Database metadata.  
    - Edge Cases: API permission errors, schema changes causing unexpected data.

  - **Clean the database propertied**  
    - Type: Code Node  
    - Role: Processes and cleans database properties for AI consumption, removing irrelevant or malformed data.  
    - Inputs: Database schema data.  
    - Outputs: Cleaned properties.  
    - Edge Cases: Code errors or unexpected schema formats.

  - **Set Prompt**  
    - Type: Set Node  
    - Role: Constructs the AI prompt combining product context, cleaned database properties, and feedback data.  
    - Inputs: Cleaned database properties and product info.  
    - Outputs: Final prompt text for AI agent.  
    - Edge Cases: Incorrect prompt formatting can reduce AI effectiveness.

---

#### 1.4 AI Insight Analysis Agent

- **Overview:** The core AI agent analyzes feedback against existing insights, decides if a new insight should be created, and generates structured output including insight name, solution, and user persona.
- **Nodes Involved:**  
  - `Get all feedback`  
  - `Get all insights`  
  - `Window Buffer Memory1`  
  - `OpenAI - AI Agent`  
  - `AI Agent`
- **Node Details:**

  - **Get all feedback**  
    - Type: Notion Tool Node (Get All Items)  
    - Role: Retrieves all feedback items to provide AI agent with context.  
    - Inputs: Triggered before AI agent runs.  
    - Outputs: List of feedback entries.  
    - Edge Cases: Large datasets may cause timeouts or rate limits.

  - **Get all insights**  
    - Type: Notion Tool Node (Get All Items)  
    - Role: Retrieves all existing insights for comparison.  
    - Inputs: Triggered before AI agent runs.  
    - Outputs: List of insights.  
    - Edge Cases: Same as above.

  - **Window Buffer Memory1**  
    - Type: LangChain Memory Buffer Window  
    - Role: Maintains conversational or contextual memory for AI agent to improve continuity.  
    - Inputs: Feedback and insights data.  
    - Outputs: Contextual memory for AI agent.  
    - Edge Cases: Memory overflow or mismanagement can affect AI responses.

  - **OpenAI - AI Agent**  
    - Type: LangChain OpenAI Chat Model  
    - Role: Runs GPT-4 with the constructed prompt and memory to analyze feedback and generate insight tagging.  
    - Inputs: Prompt, memory, feedback, and insights data.  
    - Outputs: Raw AI output with insight suggestions.  
    - Edge Cases: API errors, prompt misconfiguration.

  - **AI Agent**  
    - Type: LangChain Agent Node  
    - Role: Orchestrates AI language model, memory, and tools (like Notion nodes) to perform multi-step reasoning and actions.  
    - Inputs: AI language model, memory, tools (Get all feedback, Get all insights, Create New Insight).  
    - Outputs: Structured AI response for further processing.  
    - Edge Cases: Complex logic failures, tool integration errors.

---

#### 1.5 Output Parsing & Auto-fixing

- **Overview:** Parses the AI agent’s structured output to extract relevant fields and applies auto-fixing to correct any formatting or syntax errors before final processing.
- **Nodes Involved:**  
  - `Structured Output Parser`  
  - `Auto-fixing Output Parser`  
  - `OpenAI - Parser fixing`
- **Node Details:**

  - **Structured Output Parser**  
    - Type: LangChain Structured Output Parser  
    - Role: Parses AI output into structured JSON or object format.  
    - Inputs: Raw AI agent output.  
    - Outputs: Parsed structured data.  
    - Edge Cases: Parsing failures if AI output deviates from expected format.

  - **Auto-fixing Output Parser**  
    - Type: LangChain Auto-fixing Output Parser  
    - Role: Attempts to fix parsing errors by reprocessing output with OpenAI.  
    - Inputs: Parsed output or error messages.  
    - Outputs: Corrected structured data.  
    - Edge Cases: Infinite loops if output remains malformed.

  - **OpenAI - Parser fixing**  
    - Type: LangChain OpenAI Chat Model  
    - Role: Provides GPT-4 assistance to fix parsing issues in AI output.  
    - Inputs: Output from structured parser or error details.  
    - Outputs: Cleaned and corrected AI output.  
    - Edge Cases: API errors or insufficient prompt context.

---

#### 1.6 Notion Update & Insight Creation

- **Overview:** Updates the original feedback item in Notion with sentiment and links it to the appropriate insight. If no matching insight exists, creates a new insight entry.
- **Nodes Involved:**  
  - `Update Feedback`  
  - `Create New Insight`  
  - `update feedback sentiment analysis`
- **Node Details:**

  - **Update Feedback**  
    - Type: Notion Node (Update)  
    - Role: Updates feedback item properties such as status to "Processed" and links to insights.  
    - Configuration: Uses relation property to link to insights.  
    - Inputs: Structured AI output with insight references.  
    - Outputs: Confirmation of update.  
    - Edge Cases: Notion API errors, relation property misconfiguration.

  - **Create New Insight**  
    - Type: Notion Tool Node (Create Item)  
    - Role: Creates a new insight in the Insights database when no existing match is found.  
    - Inputs: AI-generated insight name, solution, and user persona.  
    - Outputs: New insight item ID for linking.  
    - Edge Cases: API errors, missing required fields.

  - **update feedback sentiment analysis**  
    - (See above in 1.2) Also involved here to ensure sentiment is updated before linking.

---

### 3. Summary Table

| Node Name                      | Node Type                                   | Functional Role                          | Input Node(s)                        | Output Node(s)                    | Sticky Note                                                                                     |
|--------------------------------|---------------------------------------------|----------------------------------------|------------------------------------|----------------------------------|------------------------------------------------------------------------------------------------|
| on database item update         | Notion Trigger                              | Trigger workflow on feedback update    | -                                  | Sentiment Analysis1, Set the Product information, Merge |                                                                                                |
| Sentiment Analysis1             | LangChain Sentiment Analysis (OpenAI GPT) | Analyze sentiment of feedback          | on database item update             | update feedback sentiment analysis |                                                                                                |
| update feedback sentiment analysis | Notion Update                              | Update sentiment field in Notion       | Sentiment Analysis1                 | -                                |                                                                                                |
| Set the Product information     | Set Node                                   | Define product context for AI          | on database item update             | Get database structure           |                                                                                                |
| Get database structure          | Notion Get Database                        | Retrieve Notion database schema        | Set the Product information         | Clean the database propertied    |                                                                                                |
| Clean the database propertied   | Code Node                                  | Clean and prepare database properties  | Get database structure              | Set Prompt                      |                                                                                                |
| Set Prompt                     | Set Node                                   | Build AI prompt with context           | Clean the database propertied       | Merge                          |                                                                                                |
| Merge                         | Merge Node                                 | Combine sentiment and prompt data      | Sentiment Analysis1, Set Prompt     | AI Agent                       |                                                                                                |
| Get all feedback               | Notion Tool (Get All Items)                 | Retrieve all feedback entries          | -                                  | AI Agent (ai_tool input)        |                                                                                                |
| Get all insights               | Notion Tool (Get All Items)                 | Retrieve all insights                   | -                                  | AI Agent (ai_tool input)        |                                                                                                |
| Window Buffer Memory1          | LangChain Memory Buffer Window              | Provide memory context to AI agent     | -                                  | AI Agent (ai_memory input)      |                                                                                                |
| OpenAI - AI Agent              | LangChain OpenAI Chat Model                  | Run GPT-4 AI agent for insight analysis| -                                  | AI Agent (ai_languageModel input) |                                                                                                |
| AI Agent                      | LangChain Agent Node                         | Orchestrate AI reasoning and tools     | Merge, Get all feedback, Get all insights, Create New Insight, Window Buffer Memory1, OpenAI - AI Agent | Update Feedback                |                                                                                                |
| Update Feedback               | Notion Update                                | Update feedback item with insight link | AI Agent                          | -                              |                                                                                                |
| Create New Insight            | Notion Tool (Create Item)                     | Create new insight in Notion            | AI Agent (ai_tool output)           | AI Agent (ai_tool output)       |                                                                                                |
| Structured Output Parser      | LangChain Structured Output Parser            | Parse AI agent output                   | AI Agent                          | Auto-fixing Output Parser       |                                                                                                |
| Auto-fixing Output Parser     | LangChain Auto-fixing Output Parser           | Fix parsing errors in AI output         | Structured Output Parser           | AI Agent                       |                                                                                                |
| OpenAI - Parser fixing        | LangChain OpenAI Chat Model                    | Assist in fixing AI output parsing      | Auto-fixing Output Parser          | Auto-fixing Output Parser       |                                                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Notion Trigger Node**  
   - Name: `on database item update`  
   - Type: Notion Trigger  
   - Configure to listen for updates on the Feedback database.  
   - Set to trigger on item update events.

2. **Add LangChain Sentiment Analysis Node**  
   - Name: `Sentiment Analysis1`  
   - Type: LangChain Sentiment Analysis  
   - Connect input from `on database item update`.  
   - Configure with OpenAI credentials and prompt for sentiment classification (Positive, Neutral, Negative).

3. **Add Notion Update Node for Sentiment**  
   - Name: `update feedback sentiment analysis`  
   - Type: Notion Update  
   - Connect input from `Sentiment Analysis1`.  
   - Configure to update the sentiment select field in the Feedback item with the sentiment result.

4. **Add Set Node for Product Context**  
   - Name: `Set the Product information`  
   - Type: Set  
   - Connect input from `on database item update`.  
   - Define variables for `Product Overview` and `Core Features` relevant to your product.

5. **Add Notion Get Database Node**  
   - Name: `Get database structure`  
   - Type: Notion Get Database  
   - Connect input from `Set the Product information`.  
   - Configure to retrieve schema of Feedback and Insights databases.

6. **Add Code Node to Clean Database Properties**  
   - Name: `Clean the database propertied`  
   - Type: Code  
   - Connect input from `Get database structure`.  
   - Implement code to filter and clean database properties for AI prompt use.

7. **Add Set Node to Build AI Prompt**  
   - Name: `Set Prompt`  
   - Type: Set  
   - Connect input from `Clean the database propertied`.  
   - Construct the AI prompt combining product context, cleaned database schema, and feedback content.

8. **Add Merge Node**  
   - Name: `Merge`  
   - Type: Merge  
   - Connect inputs from `Sentiment Analysis1` and `Set Prompt`.  
   - Configure to combine data into one object for AI agent input.

9. **Add Notion Tool Nodes to Get All Feedback and Insights**  
   - Names: `Get all feedback`, `Get all insights`  
   - Type: Notion Tool (Get All Items)  
   - No direct input connections; will be used as AI agent tools.

10. **Add LangChain Memory Buffer Node**  
    - Name: `Window Buffer Memory1`  
    - Type: LangChain Memory Buffer Window  
    - No direct input connection; used as AI agent memory.

11. **Add LangChain OpenAI Chat Model Node for AI Agent**  
    - Name: `OpenAI - AI Agent`  
    - Type: LangChain OpenAI Chat Model  
    - No direct input; used as AI language model for AI Agent.

12. **Add LangChain Agent Node**  
    - Name: `AI Agent`  
    - Type: LangChain Agent  
    - Connect main input from `Merge`.  
    - Configure to use `OpenAI - AI Agent` as language model, `Window Buffer Memory1` as memory, and `Get all feedback`, `Get all insights`, and `Create New Insight` as tools.  
    - Configure output to feed into `Update Feedback`.

13. **Add Notion Update Node for Feedback Update**  
    - Name: `Update Feedback`  
    - Type: Notion Update  
    - Connect input from `AI Agent`.  
    - Configure to update feedback status to "Processed" and link to insights.

14. **Add Notion Tool Node for Creating New Insight**  
    - Name: `Create New Insight`  
    - Type: Notion Tool (Create Item)  
    - No direct input; used as AI agent tool to create insights when needed.

15. **Add LangChain Structured Output Parser Node**  
    - Name: `Structured Output Parser`  
    - Type: LangChain Structured Output Parser  
    - Connect input from `AI Agent`.  
    - Parses AI output into structured data.

16. **Add LangChain Auto-fixing Output Parser Node**  
    - Name: `Auto-fixing Output Parser`  
    - Type: LangChain Auto-fixing Output Parser  
    - Connect input from `Structured Output Parser`.  
    - Attempts to fix parsing errors.

17. **Add LangChain OpenAI Chat Model Node for Parser Fixing**  
    - Name: `OpenAI - Parser fixing`  
    - Type: LangChain OpenAI Chat Model  
    - Connect input from `Auto-fixing Output Parser`.  
    - Provides GPT-4 assistance to fix parsing issues.

18. **Connect Output Parser Chain**  
    - Connect `Structured Output Parser` → `Auto-fixing Output Parser` → `OpenAI - Parser fixing` → back to `Auto-fixing Output Parser` → finally to `AI Agent`.

19. **Credential Setup**  
    - Configure OpenAI API credentials in all LangChain nodes requiring them.  
    - Configure Notion API credentials in all Notion nodes and ensure integration is connected to the correct Notion workspace and pages.

20. **Final Testing**  
    - Add or update a feedback item in Notion with status `Received`.  
    - Observe the workflow triggering, sentiment analysis, AI insight tagging, and updates in Notion.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                   | Context or Link                                                                                                                   |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| This workflow requires a Notion template with Feedback and Insights databases pre-configured with specific properties (feedback content, status, relations). | [User Feedback Analysis – Notion Template](https://agentstudio-templates.notion.site/User-Feedback-Analysis-1df6b2b6117f81ec8273e6fcb29d0dab) |
| Ensure your Notion API integration token has access to the relevant pages and databases in Notion.                                                            | [Notion API Integration Setup](https://docs.n8n.io/integrations/builtin/credentials/notion/#using-api-integration-token)          |
| OpenAI API key is required and must have access to GPT-4 models for sentiment and insight analysis.                                                           | [OpenAI API Keys](https://platform.openai.com/api-keys)                                                                           |
| The workflow only processes feedback with status `Received` to avoid reprocessing.                                                                             | Workflow logic note                                                                                                               |
| A fallback parser is included to automatically fix AI output formatting issues, improving robustness.                                                        | Workflow robustness note                                                                                                         |
| You can replace the default n8n memory backend with Supabase for more robust memory management.                                                               | Workflow scalability note                                                                                                        |
| Please share feedback about this workflow to help improve it.                                                                                                 | [Feedback Link](https://tally.so/r/w82eNO)                                                                                       |

---

This document provides a detailed, structured reference for understanding, reproducing, and maintaining the "Analyze & Tag User Feedback in Notion with GPT-4 Sentiment Analysis" workflow. It covers all nodes, their roles, configurations, and integration points, enabling advanced users and AI agents to work effectively with the workflow.