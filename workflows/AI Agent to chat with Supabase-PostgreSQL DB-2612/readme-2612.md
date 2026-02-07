AI Agent to chat with Supabase/PostgreSQL DB

https://n8nworkflows.xyz/workflows/ai-agent-to-chat-with-supabase-postgresql-db-2612


# AI Agent to chat with Supabase/PostgreSQL DB

### 1. Workflow Overview

This workflow enables conversational interaction with a Supabase-hosted PostgreSQL database using an AI agent powered by OpenAI. It allows developers, analysts, or business users to query and analyze complex data without manual SQL coding. The workflow dynamically translates natural language chat inputs into SQL queries, executes them, and returns results conversationally.

The workflow is logically grouped into the following blocks:

- **1.1 Input Reception:** Receives user chat messages via an n8n Langchain chat trigger.
- **1.2 AI Agent Processing:** Uses OpenAI to interpret user input, generate SQL queries, and manage database interactions.
- **1.3 Database Schema Exploration Tools:** Provides the AI agent with database schema information (tables and columns) to enable accurate SQL generation.
- **1.4 SQL Query Execution:** Executes dynamically generated SQL queries on Supabase PostgreSQL and returns data for AI analysis.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block captures incoming user messages from a chat interface and forwards them to the AI agent node for processing.

- **Nodes Involved:**  
  - When chat message received

- **Node Details:**  
  - **When chat message received**  
    - *Type:* Langchain Chat Trigger  
    - *Role:* Entry point that listens for incoming chat messages via webhook.  
    - *Configuration:* Default options; webhook ID assigned.  
    - *Input/Output:* No inputs; outputs the chat message text and metadata.  
    - *Potential Failures:* Webhook connectivity issues, malformed requests.  
    - *Version:* 1.1

#### 2.2 AI Agent Processing

- **Overview:**  
  This block interprets user queries using OpenAI, dynamically generates SQL queries, and controls the overall conversational logic. It integrates with database tools and runs queries as requested.

- **Nodes Involved:**  
  - AI Agent  
  - OpenAI Chat Model  

- **Node Details:**  
  - **AI Agent**  
    - *Type:* Langchain Agent (openAiFunctionsAgent)  
    - *Role:* Core logic node that receives user input, calls AI language and tool nodes, and orchestrates query generation.  
    - *Configuration:*  
      - Text input sourced from the chat message node expression: `={{ $('When chat message received').item.json.chatInput }}`  
      - System message defines the assistant as a DB assistant, instructing it to generate and run SQL queries aligned with user requests.  
      - Uses "openAiFunctionsAgent" as agent type.  
    - *Inputs:* From "When chat message received" node (main connection).  
    - *Outputs:* Calls connected AI tools (DB Schema, Get table definition, Run SQL Query) and language model nodes.  
    - *Edge Cases:*  
      - Failures in expression evaluation if input is missing.  
      - AI model rate limits or API errors.  
      - Unexpected or malicious user queries causing invalid SQL generation.  
    - *Version:* 1.6  

  - **OpenAI Chat Model**  
    - *Type:* Langchain LM Chat OpenAI  
    - *Role:* Provides the underlying OpenAI chat completions model used by the AI Agent.  
    - *Configuration:* Uses OpenAI API credentials named "OpenAi club".  
    - *Inputs:* Invoked as language model by AI Agent (ai_languageModel connection).  
    - *Outputs:* Returns AI-generated completions for the agent.  
    - *Edge Cases:* API key invalidity, network failures, rate limits.  
    - *Version:* 1

#### 2.3 Database Schema Exploration Tools

- **Overview:**  
  This block supplies the AI agent with metadata about database tables and columns to assist in generating accurate SQL queries.

- **Nodes Involved:**  
  - DB Schema  
  - Get table definition  

- **Node Details:**  
  - **DB Schema**  
    - *Type:* Postgres Tool  
    - *Role:* Runs a SQL query to retrieve the list of all user tables within the public schema of the database.  
    - *Configuration:*  
      - SQL Query:  
        ```sql
        SELECT table_schema, table_name
        FROM information_schema.tables
        WHERE table_type = 'BASE TABLE' AND table_schema = 'public';
        ```  
      - Connected to "Postgres 5minai" credentials (Supabase PostgreSQL connection).  
    - *Inputs:* Invoked as a tool by AI Agent (ai_tool connection).  
    - *Outputs:* Returns list of tables.  
    - *Edge Cases:* Permission issues, connection errors, empty schema.  
    - *Version:* 2.5  

  - **Get table definition**  
    - *Type:* Postgres Tool  
    - *Role:* Fetches detailed column information, data types, nullability, defaults, and foreign key constraints for a specific table, enabling the AI to understand table structure.  
    - *Configuration:*  
      - SQL Query with template expression for table name:  
        ```sql
        SELECT 
            c.column_name,
            c.data_type,
            c.is_nullable,
            c.column_default,
            tc.constraint_type,
            ccu.table_name AS referenced_table,
            ccu.column_name AS referenced_column
        FROM 
            information_schema.columns c
        LEFT JOIN 
            information_schema.key_column_usage kcu 
            ON c.table_name = kcu.table_name 
            AND c.column_name = kcu.column_name
        LEFT JOIN 
            information_schema.table_constraints tc 
            ON kcu.constraint_name = tc.constraint_name
            AND tc.constraint_type = 'FOREIGN KEY'
        LEFT JOIN
            information_schema.constraint_column_usage ccu
            ON tc.constraint_name = ccu.constraint_name
        WHERE 
            c.table_name = '{{ $fromAI("table_name") }}' -- Your table name
            AND c.table_schema = 'public' -- Ensure it's in the right schema
        ORDER BY 
            c.ordinal_position;
        ```  
      - Table name is dynamically provided by AI agent via `$fromAI("table_name")`.  
      - Uses same "Postgres 5minai" credentials.  
    - *Inputs:* Invoked as a tool by AI Agent.  
    - *Outputs:* Returns column metadata for requested table.  
    - *Edge Cases:* Invalid or missing table name input, permission errors, SQL errors.  
    - *Version:* 2.5  

#### 2.4 SQL Query Execution

- **Overview:**  
  Executes the SQL queries dynamically generated by the AI agent to retrieve data from the database, including support for JSON data extraction.

- **Nodes Involved:**  
  - Run SQL Query

- **Node Details:**  
  - **Run SQL Query**  
    - *Type:* Postgres Tool  
    - *Role:* Runs custom SQL queries generated by the AI agent on the Supabase PostgreSQL database.  
    - *Configuration:*  
      - SQL Query is dynamically passed from AI agent output via expression: `{{ $fromAI("query","SQL query for PostgreSQL DB in Supabase") }}`  
      - Users can utilize PostgreSQL JSON operators like `->>` to extract JSON fields.  
      - Uses "Postgres 5minai" credentials.  
    - *Inputs:* Invoked as a tool by AI Agent.  
    - *Outputs:* Returns query results for further AI processing and user response.  
    - *Edge Cases:* Malformed or harmful SQL queries, timeouts, permission denied, empty result sets.  
    - *Version:* 2.5  

---

### 3. Summary Table

| Node Name                | Node Type                     | Functional Role                         | Input Node(s)           | Output Node(s)        | Sticky Note                                                                 |
|--------------------------|-------------------------------|----------------------------------------|------------------------|-----------------------|-----------------------------------------------------------------------------|
| When chat message received| Langchain Chat Trigger         | Receives chat messages                  | (Webhook trigger)       | AI Agent              |                                                                             |
| AI Agent                 | Langchain Agent                | Core AI processing & SQL generation    | When chat message received | DB Schema, Get table definition, Run SQL Query, OpenAI Chat Model | **Finetune the prompt of assistant**                                        |
| OpenAI Chat Model        | Langchain LM Chat OpenAI       | Provides OpenAI completion for agent   | AI Agent (ai_languageModel) | AI Agent             |                                                                             |
| DB Schema                | Postgres Tool                  | Gets list of all tables in DB           | AI Agent (ai_tool)      | AI Agent              |                                                                             |
| Get table definition     | Postgres Tool                  | Retrieves column metadata for a table  | AI Agent (ai_tool)      | AI Agent              |                                                                             |
| Run SQL Query            | Postgres Tool                  | Runs SQL queries generated by AI       | AI Agent (ai_tool)      | AI Agent              |                                                                             |
| Sticky Note3             | Sticky Note                   | Reminder to replace DB password and username |                       |                       | **Replace password and username for Supabase**                              |
| Sticky Note5             | Sticky Note                   | Setup instructions and preparation     |                        |                       | **Set up steps - accounts, connection, and workflow tools summary**         |
| Sticky Note6             | Sticky Note                   | Workflow introduction and description  |                        |                       | **Workflow purpose, author, and capabilities**                              |
| Sticky Note7             | Sticky Note                   | Video guide link                       |                        |                       | **... or watch set up video [20 min] https://www.youtube.com/watch?v=-GgKzhCNxjk** |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the "When chat message received" Node**  
   - Type: Langchain Chat Trigger  
   - Configure webhook (default settings) to receive chat input.  
   - Position appropriately (e.g., left-middle).  

2. **Create the "AI Agent" Node**  
   - Type: Langchain Agent  
   - Configure:  
     - Text input expression: `={{ $('When chat message received').item.json.chatInput }}`  
     - Agent: Select "openAiFunctionsAgent".  
     - System message:  
       ```
       You are DB assistant. You need to run queries in DB aligned with user requests.

       Run custom SQL query to aggregate data and response to user.

       Fetch all data to analyse it for response if needed.
       ```  
     - Prompt type: Define  
   - Connect "When chat message received" (main output) to "AI Agent" (main input).  

3. **Create the "OpenAI Chat Model" Node**  
   - Type: Langchain LM Chat OpenAI  
   - Credentials: Select or create OpenAI API credential (e.g., "OpenAi club").  
   - Connect "AI Agent" node language model input (ai_languageModel) to this node.  

4. **Create the "DB Schema" Node**  
   - Type: Postgres Tool  
   - Credentials: Select or create PostgreSQL credential with Supabase connection details ("Postgres 5minai").  
   - Query:  
     ```sql
     SELECT table_schema, table_name
     FROM information_schema.tables
     WHERE table_type = 'BASE TABLE' AND table_schema = 'public';
     ```  
   - Operation: Execute Query  
   - Connect this node as an AI tool from "AI Agent" (ai_tool connection).  

5. **Create the "Get table definition" Node**  
   - Type: Postgres Tool  
   - Credentials: Use same as above ("Postgres 5minai").  
   - Query:  
     ```sql
     SELECT 
         c.column_name,
         c.data_type,
         c.is_nullable,
         c.column_default,
         tc.constraint_type,
         ccu.table_name AS referenced_table,
         ccu.column_name AS referenced_column
     FROM 
         information_schema.columns c
     LEFT JOIN 
         information_schema.key_column_usage kcu 
         ON c.table_name = kcu.table_name 
         AND c.column_name = kcu.column_name
     LEFT JOIN 
         information_schema.table_constraints tc 
         ON kcu.constraint_name = tc.constraint_name
         AND tc.constraint_type = 'FOREIGN KEY'
     LEFT JOIN
         information_schema.constraint_column_usage ccu
         ON tc.constraint_name = ccu.constraint_name
     WHERE 
         c.table_name = '{{ $fromAI("table_name") }}'
         AND c.table_schema = 'public'
     ORDER BY 
         c.ordinal_position;
     ```  
   - Operation: Execute Query  
   - Connect as AI tool from "AI Agent" (ai_tool connection).  

6. **Create the "Run SQL Query" Node**  
   - Type: Postgres Tool  
   - Credentials: Use same PostgreSQL credentials.  
   - Query expression: `{{ $fromAI("query","SQL query for PostgreSQL DB in Supabase") }}`  
   - Operation: Execute Query  
   - Connect as AI tool from "AI Agent" (ai_tool connection).  

7. **Add Sticky Notes for Documentation** (optional but recommended)  
   - Add notes for setup steps, reminders about replacing DB credentials, finetuning prompts, and links to video guides.  

8. **Credential Setup**  
   - Create PostgreSQL credential with Supabase parameters: host, database, user, password (replace placeholders).  
   - Create OpenAI API credential with valid API key.  

9. **Testing and Validation**  
   - Test webhook by sending chat messages.  
   - Verify AI agent generates correct SQL queries.  
   - Confirm database responses return expected data.  
   - Monitor for errors such as invalid queries or connection failures.  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                            | Context or Link                                                                                       |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| Video guide demonstrating the build and usage of this workflow (20 minutes).                                                                                           | https://www.youtube.com/watch?v=-GgKzhCNxjk                                                        |
| Workflow created by Mark Shcherbakov from the 5minAI community.                                                                                                        | https://www.linkedin.com/in/marklowcoding/ and https://www.skool.com/5minai-2861                    |
| Replace your PostgreSQL username and password in the credentials to connect to your Supabase database securely.                                                       | Sticky Note reminder in workflow                                                                   |
| Workflow empowers non-SQL users to interact with databases conversationally using AI, saving time and reducing errors in manual SQL writing.                          | Workflow description section                                                                        |
| AI agent utilizes PostgreSQL JSON operators (like `->>`) to parse and analyze JSON fields stored in database columns dynamically.                                     | Workflow description and node "Run SQL Query" details                                              |

---

This documentation fully describes the AI Agent to chat with Supabase/PostgreSQL DB workflow, enabling development, customization, troubleshooting, and reimplementation without requiring the original JSON file.