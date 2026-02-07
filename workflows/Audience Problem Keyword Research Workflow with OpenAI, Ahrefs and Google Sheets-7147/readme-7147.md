Audience Problem Keyword Research Workflow with OpenAI, Ahrefs and Google Sheets

https://n8nworkflows.xyz/workflows/audience-problem-keyword-research-workflow-with-openai--ahrefs-and-google-sheets-7147


# Audience Problem Keyword Research Workflow with OpenAI, Ahrefs and Google Sheets

### 1. Workflow Overview

This workflow automates audience problem keyword research by leveraging a detailed customer profile combined with AI-generated keyword and question suggestions, enriched with SEO performance data from Ahrefs via the SEO MCP tool, and stores the results in Google Sheets. It is designed for marketing strategists, SEO specialists, and digital marketers to efficiently generate actionable keyword and question insights for targeted content and advertising campaigns.

The workflow is logically divided into the following blocks:

- **1.1 Input Initialization:** Define the customer profile and SEO parameters.
- **1.2 AI-Driven Keyword and Question Generation:** Use OpenAI language models to generate seed keywords and audience questions based on the customer profile.
- **1.3 Data Parsing and Looping:** Parse AI JSON outputs and iterate through each keyword and question for processing.
- **1.4 Keyword Enrichment with SEO MCP:** For each seed keyword, generate related keywords with SEO metrics from Ahrefs data via the SEO MCP service.
- **1.5 Data Storage:** Append or update keywords and questions with intent and SEO metrics into Google Sheets.
- **1.6 Conditional Routing:** Separate question ideas from other keywords for proper storage and handling.

### 2. Block-by-Block Analysis

---

#### 2.1 Input Initialization

**Overview:**  
This block initializes the workflow by defining the target customer profile and the desired SEO parameters (country and search engine). It triggers the workflow manually.

**Nodes Involved:**  
- When clicking ‘Execute workflow’  
- Data

**Node Details:**

- **When clicking ‘Execute workflow’**  
  - Type: Manual Trigger  
  - Role: Entry point to start the workflow by manual execution.  
  - Configuration: No parameters needed; triggers workflow on user command.  
  - Inputs: None  
  - Outputs: Data node  
  - Edge cases: None specific, manual trigger requires user action.

- **Data**  
  - Type: Set  
  - Role: Defines static input variables including the detailed customer profile text, Ahrefs country code, and search engine name.  
  - Configuration:  
    - `customer_profile`: A rich text description of the target persona focusing on practical used car buyers.  
    - `ahref_seo_country`: "us" (United States)  
    - `ahref_search_engine`: "Google"  
  - Inputs: Manual Trigger node  
  - Outputs: Two parallel calls to AI nodes (SEO Seed Keywords and AEO Questions)  
  - Edge cases: Invalid or empty customer profile will degrade AI output quality.

---

#### 2.2 AI-Driven Keyword and Question Generation

**Overview:**  
Generates seed keywords and audience questions with search intent classification using OpenAI language models tailored by a custom prompt reflecting marketing expertise.

**Nodes Involved:**  
- SEO Seed Keywords  
- AEO Questions

**Node Details:**

- **SEO Seed Keywords**  
  - Type: OpenAI (LangChain)  
  - Role: Generates a JSON array of 50 keywords with search intent (informational, commercial, transactional) based on the customer profile.  
  - Configuration:  
    - Model: "o4-mini" (a smaller OpenAI model variant)  
    - Prompt: Emphasizes short keywords (not elaborate queries), excludes navigational keywords, tailored to customer profile.  
    - System instructions: Marketing strategist persona specialized in fintech marketing and investor psychology.  
  - Inputs: Data node  
  - Outputs: JSON array of keywords passed to Parse Keyword JSON node  
  - Edge cases: Model may generate malformed JSON or unexpected intent labels; output validation required.

- **AEO Questions**  
  - Type: OpenAI (LangChain)  
  - Role: Produces 50 natural language questions with intent classification reflecting conversational AI query style for investment research.  
  - Configuration:  
    - Model: "o4-mini"  
    - Prompt: Focuses on natural conversation, multi-turn queries, and AI usage context for investment advice.  
    - System instructions: AEO specialist persona with deep search behavior knowledge.  
  - Inputs: Data node  
  - Outputs: JSON array of questions passed to Parse Question JSON node  
  - Edge cases: Similar to keywords, JSON parsing errors or intent mismatches possible.

---

#### 2.3 Data Parsing and Looping

**Overview:**  
Parses the JSON output from AI nodes and iterates over each keyword and question for subsequent enrichment and storage.

**Nodes Involved:**  
- Parse Keyword JSON  
- Parse Question JSON  
- Loop Over AI Keywords  
- Loop Over AI Questions

**Node Details:**

- **Parse Keyword JSON**  
  - Type: Code (JavaScript)  
  - Role: Extracts the "keywords" array from the AI response JSON for further processing.  
  - Configuration: Returns the keywords array from nested JSON structure (`$input.first().json.message.content.keywords`).  
  - Inputs: SEO Seed Keywords node  
  - Outputs: Loop Over AI Keywords node  
  - Edge cases: Failure if JSON is malformed or key structure changes.

- **Parse Question JSON**  
  - Type: Code (JavaScript)  
  - Role: Extracts the "questions" array from the AI response JSON.  
  - Configuration: Returns questions array from (`$input.first().json.message.content.questions`).  
  - Inputs: AEO Questions node  
  - Outputs: Loop Over AI Questions node  
  - Edge cases: Similar JSON parsing risks.

- **Loop Over AI Keywords**  
  - Type: SplitInBatches  
  - Role: Iterates over each keyword item for enrichment workflow.  
  - Configuration: Default batching without size limit; splits keyword array.  
  - Inputs: Parse Keyword JSON node  
  - Outputs: Can branch to “Add keyword” node or end loop.  
  - Edge cases: Large keyword sets may slow processing; empty arrays halt loop.

- **Loop Over AI Questions**  
  - Type: SplitInBatches  
  - Role: Iterates over each question item for storage.  
  - Configuration: Default batching.  
  - Inputs: Parse Question JSON node  
  - Outputs: “Add AI question” node or end loop.  
  - Edge cases: Large question sets may cause performance delays.

---

#### 2.4 Keyword Enrichment with SEO MCP

**Overview:**  
Enriches each AI-generated seed keyword with related keywords and SEO metrics from Ahrefs using the SEO MCP service, then parses and loops over returned data.

**Nodes Involved:**  
- Add keyword  
- Related Keyword Generator  
- Parse MCP Keywords JSON  
- Loop Over SEO Return Values  
- If

**Node Details:**

- **Add keyword**  
  - Type: Google Sheets (Append or Update)  
  - Role: Inserts or updates each AI-generated keyword with its intent into the main “Keywords” Google Sheet tab.  
  - Configuration:  
    - Columns: Keyword, Intent  
    - Matching on Keyword to avoid duplicates.  
    - Auth: Google Service Account with edit access.  
  - Inputs: Loop Over AI Keywords (secondary output)  
  - Outputs: Related Keyword Generator node  
  - Edge cases: Google API quota limits, permission errors, duplicate handling.

- **Related Keyword Generator**  
  - Type: MCP Client (SEO MCP)  
  - Role: Calls SEO MCP “keyword_generator” tool to fetch Ahrefs data for each keyword with country and search engine parameters.  
  - Configuration:  
    - Tool parameters dynamically injected from keyword JSON and Data node variables.  
    - Credentials: SEO MCP client API with CapSolver API key etc.  
  - Inputs: Add keyword node  
  - Outputs: Parse MCP Keywords JSON node  
  - Edge cases: API rate limiting, invalid credentials, tool execution failures.

- **Parse MCP Keywords JSON**  
  - Type: Code (JavaScript)  
  - Role: Parses the JSON result from MCP call into individual keyword objects for further processing.  
  - Configuration: Parses stringified JSON in `result.content[0].text` into array and maps to JSON objects.  
  - Inputs: Related Keyword Generator node  
  - Outputs: Loop Over SEO Return Values node  
  - Edge cases: JSON parse errors, empty or malformed MCP responses.

- **Loop Over SEO Return Values**  
  - Type: SplitInBatches  
  - Role: Iterates over each enriched SEO keyword returned from MCP for storage or filtering.  
  - Configuration: No batch size specified, processes all returned keywords.  
  - Inputs: Parse MCP Keywords JSON node  
  - Outputs: “Loop Over AI Keywords” node (feedback loop) and “If” node for conditional routing.  
  - Edge cases: Large result sets may slow down execution.

- **If**  
  - Type: If (Conditional)  
  - Role: Checks if the current keyword item label equals "question ideas" to route data accordingly.  
  - Configuration:  
    - Condition: Label is non-empty and equals the string "question ideas" (with quotes).  
  - Inputs: Loop Over SEO Return Values node  
  - Outputs:  
    - True branch: Add SEO research question node  
    - False branch: Add keywords node  
  - Edge cases: Label formatting must exactly match; otherwise, routing fails.

---

#### 2.5 Data Storage

**Overview:**  
Stores enriched keyword and question data into specified Google Sheets tabs for keywords and questions respectively.

**Nodes Involved:**  
- Add keywords  
- Add AI question  
- Add SEO research question

**Node Details:**

- **Add keywords**  
  - Type: Google Sheets (Append or Update)  
  - Role: Stores enriched keywords with associated SEO metrics (Difficulty, Volume) into the “Keywords” tab of the Google Sheet.  
  - Configuration:  
    - Columns mapped: Keyword, Difficulty, Volume  
    - Matching: Keyword column ensures update not duplication  
    - Authentication: Google Service Account  
  - Inputs: False branch of If node  
  - Outputs: Loop Over SEO Return Values node (loops back for next item)  
  - Edge cases: API limits, permission errors.

- **Add AI question**  
  - Type: Google Sheets (Append or Update)  
  - Role: Stores AI-generated questions with their intent into the “Questions” tab of the Google Sheet.  
  - Configuration:  
    - Columns: Question, Intent  
    - Matching on Question to avoid duplicates  
    - Authentication: Google Service Account  
  - Inputs: Loop Over AI Questions node  
  - Outputs: Loop Over AI Questions node (loop continuation)  
  - Edge cases: Large data sets performance, API quota.

- **Add SEO research question**  
  - Type: Google Sheets (Append or Update)  
  - Role: Stores SEO MCP generated research questions into the “Questions” tab.  
  - Configuration:  
    - Columns: Keyword, Difficulty, Volume (used here for questions)  
    - Matching: Keyword column  
    - Authentication: Google Service Account  
  - Inputs: True branch of If node  
  - Outputs: Loop Over SEO Return Values node (loops back)  
  - Edge cases: Mapping question data into keyword columns may cause confusion if misaligned.

---

#### 2.6 Sticky Note

**Overview:**  
Provides comprehensive documentation and usage instructions embedded within the workflow for user guidance.

**Nodes Involved:**  
- Sticky Note7

**Node Details:**

- **Sticky Note7**  
  - Type: Sticky Note  
  - Role: Explains the workflow purpose, usage steps, requirements, and references to external resources like Google Sheets and SEO MCP.  
  - Content highlights:  
    - Defines customer profile use  
    - Explains AI and SEO MCP integration  
    - Notes required credentials and API keys  
    - Provides links to Google Sheets template and CapSolver registration  
  - Position: Off to the side for user clarity  
  - Edge cases: None, purely informational.

---

### 3. Summary Table

| Node Name                   | Node Type                    | Functional Role                                  | Input Node(s)                | Output Node(s)                            | Sticky Note                                                  |
|-----------------------------|------------------------------|-------------------------------------------------|------------------------------|------------------------------------------|--------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger               | Entry point to start the workflow manually      | None                         | Data                                     |                                                              |
| Data                        | Set                          | Defines customer profile and SEO parameters     | When clicking ‘Execute workflow’ | SEO Seed Keywords, AEO Questions        |                                                              |
| SEO Seed Keywords           | OpenAI (LangChain)            | Generates seed keywords with intent              | Data                         | Parse Keyword JSON                       |                                                              |
| AEO Questions               | OpenAI (LangChain)            | Generates audience questions with intent         | Data                         | Parse Question JSON                      |                                                              |
| Parse Keyword JSON          | Code                         | Parses AI keyword JSON output                      | SEO Seed Keywords            | Loop Over AI Keywords                    |                                                              |
| Parse Question JSON         | Code                         | Parses AI question JSON output                     | AEO Questions                | Loop Over AI Questions                   |                                                              |
| Loop Over AI Keywords       | SplitInBatches               | Iterates over AI-generated keywords               | Parse Keyword JSON           | Add keyword (conditional)                |                                                              |
| Loop Over AI Questions      | SplitInBatches               | Iterates over AI-generated questions              | Parse Question JSON          | Add AI question                          |                                                              |
| Add keyword                 | Google Sheets                | Stores AI keywords with intent into sheet         | Loop Over AI Keywords        | Related Keyword Generator                |                                                              |
| Related Keyword Generator   | MCP Client (SEO MCP)          | Enriches keywords with Ahrefs SEO data            | Add keyword                 | Parse MCP Keywords JSON                   |                                                              |
| Parse MCP Keywords JSON     | Code                         | Parses MCP JSON response into keyword list        | Related Keyword Generator    | Loop Over SEO Return Values              |                                                              |
| Loop Over SEO Return Values | SplitInBatches               | Iterates over enriched SEO keywords                | Parse MCP Keywords JSON      | If, Loop Over AI Keywords (feedback)    |                                                              |
| If                         | If                           | Routes keywords vs question ideas                  | Loop Over SEO Return Values  | Add SEO research question, Add keywords |                                                              |
| Add keywords                | Google Sheets                | Stores enriched keywords with SEO metrics          | If (False branch)            | Loop Over SEO Return Values              |                                                              |
| Add AI question             | Google Sheets                | Stores AI-generated questions with intent          | Loop Over AI Questions       | Loop Over AI Questions                   |                                                              |
| Add SEO research question   | Google Sheets                | Stores SEO MCP generated question ideas            | If (True branch)             | Loop Over SEO Return Values              |                                                              |
| Sticky Note7               | Sticky Note                  | Workflow documentation and usage instructions      | None                        | None                                    | See section 5 for full note content and links                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Name: "When clicking ‘Execute workflow’"  
   - Type: Manual Trigger  
   - No parameters.

2. **Create Set Node**  
   - Name: "Data"  
   - Type: Set  
   - Define fields:  
     - `customer_profile` (string): Detailed target persona profile text.  
     - `ahref_seo_country` (string): "us"  
     - `ahref_search_engine` (string): "Google"  
   - Connect output from Manual Trigger node.

3. **Create OpenAI Node for Seed Keywords**  
   - Name: "SEO Seed Keywords"  
   - Type: OpenAI (LangChain) node  
   - Credentials: Add OpenAI API credentials (API key).  
   - Model: "o4-mini"  
   - Parameters: Custom prompt requesting 50 keywords with intent, using customer profile from Data node (`{{ $json.customer_profile }}`).  
   - Connect output from Data node.

4. **Create OpenAI Node for Audience Questions**  
   - Name: "AEO Questions"  
   - Type: OpenAI (LangChain) node  
   - Same credentials and model as above.  
   - Parameters: Custom prompt requesting 50 questions with intent, referencing the same customer profile.  
   - Connect output from Data node.

5. **Create Code Node to Parse Keywords JSON**  
   - Name: "Parse Keyword JSON"  
   - Type: Code (JavaScript)  
   - Code: Return the keywords array from AI response.  
   - Connect output from SEO Seed Keywords node.

6. **Create Code Node to Parse Questions JSON**  
   - Name: "Parse Question JSON"  
   - Type: Code (JavaScript)  
   - Code: Return the questions array from AI response.  
   - Connect output from AEO Questions node.

7. **Create SplitInBatches Node to Loop Over Keywords**  
   - Name: "Loop Over AI Keywords"  
   - Type: SplitInBatches  
   - Default batch size.  
   - Connect output from Parse Keyword JSON node.

8. **Create SplitInBatches Node to Loop Over Questions**  
   - Name: "Loop Over AI Questions"  
   - Type: SplitInBatches  
   - Default batch size.  
   - Connect output from Parse Question JSON node.

9. **Create Google Sheets Node for Adding Keywords**  
   - Name: "Add keyword"  
   - Type: Google Sheets (Append or Update)  
   - Authentication: Use Google Service Account with edit rights.  
   - Parameters: Map columns Intent and Keyword from JSON.  
   - Document ID: Link to your Google Sheet.  
   - Sheet Name: "gid=0" (Keywords tab)  
   - Connect output from "Loop Over AI Keywords" secondary output.

10. **Create MCP Client Node for Related Keywords**  
    - Name: "Related Keyword Generator"  
    - Type: MCP Client node  
    - Credentials: SEO MCP client API with CapSolver key.  
    - Parameters: Pass keyword, country, and search engine dynamically from current item and Data node.  
    - Connect output from Add keyword node.

11. **Create Code Node to Parse MCP JSON**  
    - Name: "Parse MCP Keywords JSON"  
    - Type: Code (JavaScript)  
    - Parse stringified JSON response from MCP into array of keyword objects.  
    - Connect output from Related Keyword Generator node.

12. **Create SplitInBatches Node to Loop Over SEO Return Values**  
    - Name: "Loop Over SEO Return Values"  
    - Type: SplitInBatches  
    - Default batch size.  
    - Connect output from Parse MCP Keywords JSON node.

13. **Create If Node for Conditional Routing**  
    - Name: "If"  
    - Type: If  
    - Conditions: Check if `label` field is non-empty and equals `"question ideas"` (including quotes).  
    - Connect output from Loop Over SEO Return Values node.

14. **Create Google Sheets Node to Add Enriched Keywords**  
    - Name: "Add keywords"  
    - Type: Google Sheets (Append or Update)  
    - Map columns: Keyword, Difficulty, Volumne (note typo in Volume field name).  
    - Connect input from If node False branch.  
    - Loop output back to Loop Over SEO Return Values node.

15. **Create Google Sheets Node to Add AI Questions**  
    - Name: "Add AI question"  
    - Type: Google Sheets (Append or Update)  
    - Map columns: Question, Intent.  
    - Connect input from Loop Over AI Questions node.  
    - Loop output back to Loop Over AI Questions node.

16. **Create Google Sheets Node to Add SEO Research Questions**  
    - Name: "Add SEO research question"  
    - Type: Google Sheets (Append or Update)  
    - Map columns same as Add keywords node (Keyword, Difficulty, Volumne).  
    - Connect input from If node True branch.  
    - Loop output back to Loop Over SEO Return Values node.

17. **Connect Loops and Nodes According to workflow connections**  
    - Loop Over SEO Return Values true branch → If node → Add SEO research question (true) or Add keywords (false).  
    - Add SEO research question and Add keywords nodes both loop back to Loop Over SEO Return Values.  
    - Loop Over AI Keywords secondary output → Add keyword node → Related Keyword Generator → Parse MCP Keywords JSON → Loop Over SEO Return Values.  
    - Loop Over AI Questions secondary output → Add AI question node.

18. **Add Sticky Note**  
    - Name: "Sticky Note7"  
    - Content: Insert detailed workflow description and usage instructions as provided in the original workflow.

---

### 5. General Notes & Resources

| Note Content | Context or Link |
|--------------|-----------------|
| Workflow generates keywords and questions from customer profile using OpenAI and enriches data from Ahrefs via SEO MCP, storing results in Google Sheets. | Embedded in Sticky Note7 node |
| Google Sheets template must be copied and linked manually in Google Sheets nodes. | https://docs.google.com/spreadsheets/d/10SEHuy5bYMrq_j1Tr2HBcM9I4O6ShYVV_k2tKEfxteI/edit?usp=sharing |
| Google Service Account recommended for Google Sheets API authentication with read/write permissions. | https://docs.n8n.io/integrations/builtin/credentials/google/service-account/ |
| OpenAI API key needed for LangChain nodes. | https://docs.n8n.io/integrations/builtin/credentials/openai/#using-api-key |
| SEO MCP requires CapSolver API key and environment setup. | https://github.com/cnych/seo-mcp, CapSolver registration: https://dashboard.capsolver.com/passport/register?inviteCode=p-4Y_DjQymvt |
| The workflow assumes consistent JSON structures from AI and MCP outputs; malformed JSON or API failures may require error handling or manual intervention. | General best practice note |

---

**Disclaimer:**  
The provided text is exclusively derived from an automated workflow created with n8n integration and automation tool. The processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data processed is legal and public.