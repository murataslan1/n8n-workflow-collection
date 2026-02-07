Automate Instagram Profile Analysis with Airtop Scraping and GPT-4o Intelligence

https://n8nworkflows.xyz/workflows/automate-instagram-profile-analysis-with-airtop-scraping-and-gpt-4o-intelligence-7481


# Automate Instagram Profile Analysis with Airtop Scraping and GPT-4o Intelligence

### 1. Workflow Overview

This workflow automates the analysis of Instagram profiles by integrating web scraping with Airtop and AI-based natural language processing using OpenAI's GPT-4o-mini model. It targets digital marketing entrepreneurs’ Instagram profiles to assess their suitability for inclusion in a high-level digital entrepreneurs group. The logic is divided into the following blocks:

- **1.1 Input Reception:** Triggered by updates in a Google Sheets document listing Instagram profiles to analyze.
- **1.2 Profile Filtering:** Filters rows to process only those marked for automation and not yet analyzed.
- **1.3 Instagram Data Extraction via Airtop:** Creates a session and browser window in Airtop, navigates to the Instagram profile page, extracts structured profile data, and terminates the session.
- **1.4 AI Processing - Data Structuring:** Processes raw scraped data through an AI agent that organizes it into a structured JSON format.
- **1.5 AI Processing - Profile Analysis:** A second AI agent analyzes the structured data, applying business rules to approve or reject the profile for the target group.
- **1.6 Output Writing:** Updates the Google Sheets row with the analysis results and metadata.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** Listens for row updates in a Google Sheets document containing Instagram handles.
- **Nodes Involved:**  
  - Nova linha Atualizada (Google Sheets Trigger)
- **Node Details:**  
  - **Nova linha Atualizada**  
    - Type: Google Sheets Trigger  
    - Role: Watches for any row update in the specific Google Sheet named "[TEMPLATE] - Instagram Profiles" (gid=0).  
    - Config: Polls every minute; triggers when any row is updated.  
    - Credentials: OAuth2 Google Sheets credentials configured.  
    - Inputs: None (trigger node)  
    - Outputs: Emits the updated row data.  
    - Edge cases: If Google API quota exceeded or connection lost, trigger may fail or delay.

#### 2.2 Profile Filtering

- **Overview:** Filters rows to select only those marked for automation and not already analyzed.
- **Nodes Involved:**  
  - Filtrar Ativação - Planilha (Filter)  
  - Sticky Note (documentation node explaining filter purpose)
- **Node Details:**  
  - **Filtrar Ativação - Planilha**  
    - Type: Filter  
    - Role: Checks if column "Ativar Automação" is true (value "Aprovado") and "Analisado" is empty (profile not analyzed).  
    - Key expressions: `={{ $json['Ativar Automação'] }} === 'Aprovado'` and `={{ $json.Analisado === '' }}`  
    - Input: Row data from Google Sheets Trigger  
    - Outputs: Passes rows meeting criteria to next node; others are discarded.  
    - Edge cases: Case-sensitive match; if columns missing or empty, may cause unexpected results.

#### 2.3 Instagram Data Extraction via Airtop

- **Overview:** Uses Airtop API to programmatically open Instagram profile pages, scrape specified profile information, then close the session.
- **Nodes Involved:**  
  - Processar Itens (SplitInBatches)  
  - Criar Nova Sessão (Airtop)  
  - Criar uma nova Janela (Airtop)  
  - Pesquisar página (Airtop extraction)  
  - Terminar Sessão (Airtop)  
  - Sticky Note2, Sticky Note, Sticky Note3 (documentation)
- **Node Details:**  
  - **Processar Itens**  
    - Type: SplitInBatches  
    - Role: Processes Instagram profiles one by one to avoid rate limits.  
    - Input: Filtered rows from Filter node.  
    - Output: Single items per execution branch.  
  - **Criar Nova Sessão**  
    - Type: Airtop API node  
    - Role: Creates a new Airtop session with profile "luis-testes-n8n", saving session on termination.  
    - Credentials: Airtop API credentials.  
    - Output: Session ID used in subsequent nodes.  
  - **Criar uma nova Janela**  
    - Type: Airtop API node  
    - Role: Opens a new browser window navigating to the Instagram URL based on the profile name from the batch.  
    - Uses expression: URL is `https://www.instagram.com/{{ profileName }}/`.  
    - Session ID is linked from previous node.  
  - **Pesquisar página**  
    - Type: Airtop extraction operation  
    - Role: Extracts various profile data fields (full name, bio, publications count, followers, followed, reels link, stories info, first five posts descriptions with metadata).  
    - Uses a detailed prompt specifying fields to extract in natural language for Airtop’s extraction.  
  - **Terminar Sessão**  
    - Type: Airtop API node  
    - Role: Terminates the Airtop session to free resources.  
  - Edge cases: Airtop session limits, Instagram rate limits, private profiles (lack of post data), network timeouts, scraping changes if Instagram UI changes.

#### 2.4 AI Processing - Data Structuring

- **Overview:** Uses an AI agent to parse the raw scraped text data into a structured JSON format to standardize inputs for the next analysis step.
- **Nodes Involved:**  
  - Ajustar Saída Instagram (LangChain Agent)  
  - OpenAI Chat Model2 (OpenAI GPT-4o-mini)  
  - Auto-fixing Output Parser1 (LangChain Auto-fixing Parser)  
  - Structured Output Parser1 (LangChain Structured Parser)  
  - Sticky Note4 (documentation)
- **Node Details:**  
  - **Ajustar Saída Instagram**  
    - Type: LangChain Agent node  
    - Role: Receives raw scraped text, instructs AI to split and label profile information into fields like Profile Name, Description, Profile Info (posts, followers), Highlights (stories), and individual posts (1-5).  
    - Uses a system prompt defining output structure and format (JSON).  
    - Input: Raw text from "Pesquisar página" node’s extraction.  
  - **OpenAI Chat Model2**  
    - Type: LangChain OpenAI Chat Model node  
    - Role: Runs GPT-4o-mini model with the prompt from the agent node.  
    - Credentials: OpenAI API key configured.  
  - **Auto-fixing Output Parser1** & **Structured Output Parser1**  
    - Type: LangChain Output Parsers  
    - Role: Validate and auto-correct AI output to match expected JSON schema, retrying if necessary.  
  - Edge cases: AI misinterpretation, malformed JSON output, API rate limits, prompt failures.

#### 2.5 AI Processing - Profile Analysis

- **Overview:** Analyzes the structured Instagram profile data with AI to decide if the profile fits the criteria of the target entrepreneur group.
- **Nodes Involved:**  
  - Análise de Dados do Perfil (LangChain Agent)  
  - OpenAI Chat Model1 (OpenAI GPT-4o-mini)  
  - Auto-fixing Output Parser (LangChain Auto-fixing Parser)  
  - Structured Output Parser (LangChain Structured Parser)  
  - Sticky Note5 (documentation)
- **Node Details:**  
  - **Análise de Dados do Perfil**  
    - Type: LangChain Agent node  
    - Role: Receives structured profile data, applies business logic to approve or reject profile based on niche (marketing digital), evidence of results, and content appropriateness.  
    - System prompt defines persona, function, objectives, behavior rules, and required JSON output with fields: approval ("Aprovado" or "Reprovado"), confidence score (0-10), suggestion for direct message topic, and detailed analysis.  
  - **OpenAI Chat Model1**  
    - Type: LangChain OpenAI Chat Model node  
    - Role: Executes GPT-4o-mini model with the analysis prompt.  
  - **Auto-fixing Output Parser** & **Structured Output Parser**  
    - Type: LangChain output parsers  
    - Role: Validate and correct the AI’s JSON output for consistency and schema compliance.  
  - Edge cases: Ambiguous profile data, private accounts without posts, AI misunderstanding instructions, API limits.

#### 2.6 Output Writing

- **Overview:** Updates the original Google Sheets row with the AI analysis results and metadata.
- **Nodes Involved:**  
  - Atualizar Linha na Planilha (Google Sheets)  
  - Replace Me (NoOp placeholder)  
  - Sticky Note6 (documentation)
- **Node Details:**  
  - **Atualizar Linha na Planilha**  
    - Type: Google Sheets node  
    - Role: Updates row matching Instagram handle with: profile name, bio, profile stats, AI approval status, confidence score, detailed analysis, timestamp, and profile URL link.  
    - Config: Matches rows by "@ - Instagram" column.  
    - Credentials: Google Sheets OAuth2 credentials configured.  
    - Input: AI analysis JSON output and original profile handle.  
  - **Replace Me**  
    - Type: NoOp (no operation)  
    - Role: Placeholder or endpoint node, possibly for workflow extension or debugging.  
  - Edge cases: Google API rate limits, row matching failures, partial data updates.

---

### 3. Summary Table

| Node Name                  | Node Type                         | Functional Role                          | Input Node(s)              | Output Node(s)                 | Sticky Note                                                                                  |
|----------------------------|----------------------------------|----------------------------------------|----------------------------|-------------------------------|----------------------------------------------------------------------------------------------|
| Nova linha Atualizada       | Google Sheets Trigger            | Trigger on spreadsheet row update      | -                          | Filtrar Ativação - Planilha    |                                                                                              |
| Filtrar Ativação - Planilha | Filter                          | Filters for automation-approved rows   | Nova linha Atualizada       | Processar Itens                | Passa pelo filtro para verificar se o perfil ainda não foi analisado pela IA                 |
| Processar Itens             | SplitInBatches                  | Processes profiles one by one           | Filtrar Ativação - Planilha | Criar Nova Sessão              |                                                                                              |
| Criar Nova Sessão           | Airtop                         | Creates Airtop session                  | Processar Itens             | Criar uma nova Janela          | Criar nova Janela e Sessão no Airtop                                                        |
| Criar uma nova Janela       | Airtop                         | Opens Instagram profile page            | Criar Nova Sessão           | Pesquisar página               | Criar nova Janela e Sessão no Airtop                                                        |
| Pesquisar página            | Airtop                         | Extracts profile data                   | Criar uma nova Janela       | Terminar Sessão               | Entra no Perfil do Instagram faz toda a análise e depois finaliza a sessão iniciada.         |
| Terminar Sessão             | Airtop                         | Terminates Airtop session               | Pesquisar página            | Ajustar Saída Instagram        | Entra no Perfil do Instagram faz toda a análise e depois finaliza a sessão iniciada.         |
| Ajustar Saída Instagram     | LangChain Agent                | Structures raw scraped data             | Terminar Sessão             | Análise de Dados do Perfil     | Ajusta o Output do perfil que foi analisado para a próxima IA ser mais assertiva na análise. |
| OpenAI Chat Model2          | LangChain OpenAI Chat Model    | Runs GPT-4o-mini to parse data          | Ajustar Saída Instagram     | Auto-fixing Output Parser1     |                                                                                              |
| Auto-fixing Output Parser1  | LangChain Auto-fixing Parser    | Validates and fixes AI output            | OpenAI Chat Model2          | Structured Output Parser1      |                                                                                              |
| Structured Output Parser1   | LangChain Structured Parser     | Ensures output JSON schema compliance   | Auto-fixing Output Parser1  | Ajustar Saída Instagram        |                                                                                              |
| Análise de Dados do Perfil  | LangChain Agent                | Analyzes structured profile data        | Ajustar Saída Instagram     | Atualizar Linha na Planilha    | Pega as Informações entregues pela última IA e faz análise em cima do Prompt solicitado.    |
| OpenAI Chat Model1          | LangChain OpenAI Chat Model    | Runs GPT-4o-mini for profile analysis   | Análise de Dados do Perfil  | Auto-fixing Output Parser      |                                                                                              |
| Auto-fixing Output Parser   | LangChain Auto-fixing Parser    | Validates and fixes AI output            | OpenAI Chat Model1          | Structured Output Parser       |                                                                                              |
| Structured Output Parser    | LangChain Structured Parser     | Ensures output JSON schema compliance   | Auto-fixing Output Parser   | Análise de Dados do Perfil     |                                                                                              |
| Atualizar Linha na Planilha | Google Sheets                  | Updates spreadsheet row with results    | Análise de Dados do Perfil  | Replace Me                    | Pegue todas as informações e atualiza a linha da planilha.                                  |
| Replace Me                 | NoOp                           | Placeholder / endpoint                   | Atualizar Linha na Planilha | Processar Itens                |                                                                                              |
| Sticky Note                | Sticky Note                    | Documentation                           | -                          | -                             | Ativar Análise na Planilha: Passa pelo filtro para verificar se o perfil ainda não foi analisado pela IA |
| Sticky Note1               | Sticky Note                    | Documentation                           | -                          | -                             | Airtop: Criar nova Janela e Sessão no Airtop                                                |
| Sticky Note2               | Sticky Note                    | Documentation                           | -                          | -                             | Airtop give to you 5.000 free credit for month! Create the profile and initiate your session in Instagram inside Airtop. https://portal.airtop.ai/ |
| Sticky Note3               | Sticky Note                    | Documentation                           | -                          | -                             | Airtop: Entra no Perfil do Instagram faz toda a análise e depois finaliza a sessão iniciada.|
| Sticky Note4               | Sticky Note                    | Documentation                           | -                          | -                             | AI: Ajusta o Output do perfil que foi analisado para a próxima IA ser mais assertiva na análise das informações. |
| Sticky Note5               | Sticky Note                    | Documentation                           | -                          | -                             | 2ª AI: Pega as Informações entregues pela última IA e faz análise em cima do Prompt solicitado. |
| Sticky Note6               | Sticky Note                    | Documentation                           | -                          | -                             | Atualizar Planilha: Pegue todas as informações e atualiza a linha da planilha.              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Sheets Trigger node:**  
   - Type: Google Sheets Trigger  
   - Configure OAuth2 credentials for Google Sheets.  
   - Set document ID to the Instagram Profiles sheet.  
   - Set sheet name to the first sheet (gid=0).  
   - Trigger on row update every minute.

2. **Add Filter node (Filtrar Ativação - Planilha):**  
   - Condition:  
     - "Ativar Automação" equals "Aprovado" (boolean true).  
     - "Analisado" is empty.  
   - Connect input from Google Sheets Trigger.

3. **Add SplitInBatches node (Processar Itens):**  
   - Purpose: process one Instagram profile per execution.  
   - Connect input from Filter node.

4. **Add Airtop node to create session (Criar Nova Sessão):**  
   - Type: Airtop API node.  
   - Configure Airtop API credentials.  
   - Set profile name (e.g., "luis-testes-n8n").  
   - Enable "saveProfileOnTermination".  
   - Connect from SplitInBatches output.

5. **Add Airtop node to create new window (Criar uma nova Janela):**  
   - Type: Airtop API node.  
   - Set resource to "window".  
   - Use expression for URL: `https://www.instagram.com/{{ $json["@ - Instagram"] }}/` from the current item.  
   - Reference session ID from previous node.  
   - Connect from "Criar Nova Sessão".

6. **Add Airtop extraction node (Pesquisar página):**  
   - Type: Airtop extraction (query operation).  
   - Use a prompt to extract: full name, bio, publication count, followers, followed, reels link, stories list, first five posts details (description, date, likes, comments, hashtags).  
   - Connect from "Criar uma nova Janela".

7. **Add Airtop node to terminate session (Terminar Sessão):**  
   - Operation: terminate.  
   - Connect from "Pesquisar página".

8. **Add LangChain Agent node (Ajustar Saída Instagram):**  
   - Set system prompt to instruct AI to parse the raw text into a JSON structure separating profile name, bio, info, highlights, and posts 1-5.  
   - Input: raw extracted text from "Pesquisar página" > "Terminar Sessão".  
   - Use OpenAI GPT-4o-mini model node connected to this agent.  
   - Add Auto-fixing Output Parser and Structured Output Parser nodes to validate and correct AI output.  
   - Chain parsers accordingly.

9. **Add second LangChain Agent node (Análise de Dados do Perfil):**  
   - System prompt defines persona as Instagram profile analyst for digital entrepreneurs.  
   - Instructions to approve/reject based on niche, evidence, and content appropriateness.  
   - Output JSON with approval, confidence, chat suggestion, and detailed analysis.  
   - Connect input from previous agent's parsed output.  
   - Use OpenAI GPT-4o-mini model node with Auto-fixing and Structured Output Parsers chained similarly.

10. **Add Google Sheets node (Atualizar Linha na Planilha):**  
    - Operation: update.  
    - Map columns: Bio, Nome, Analisado (timestamp), Análise IA, @ - Instagram, Informações, Aprovação IA, Link do Perfil, Nota de Confiança.  
    - Match rows by "@ - Instagram" column.  
    - Connect input from second AI analysis agent.

11. **Add NoOp node (Replace Me) as terminal node:**  
    - Connect from Google Sheets update node.  
    - Optional placeholder for future extensions.

12. **Connect all nodes as per workflow logic:**  
    - Google Sheets Trigger → Filter → SplitInBatches → Airtop session creation → Airtop window → Airtop extraction → Airtop terminate → AI structuring agent → AI analysis agent → Google Sheets update → NoOp.

13. **Configure credentials:**  
    - Airtop API credentials with valid profile.  
    - OpenAI API credentials with access to GPT-4o-mini.  
    - Google Sheets OAuth2 credentials with edit permissions.

14. **Test workflow:**  
    - Use test Instagram handles in the Google Sheet with "Ativar Automação" set to "Aprovado" and empty "Analisado" field.  
    - Verify sequential execution, data extraction, AI analysis, and update of the sheet.

---

### 5. General Notes & Resources

| Note Content                                                                                                         | Context or Link                         |
|----------------------------------------------------------------------------------------------------------------------|---------------------------------------|
| Airtop provides 5,000 free credits per month for scraping                                                            | https://portal.airtop.ai/              |
| Workflow uses advanced AI output auto-correction parsers to ensure JSON schema compliance for AI-generated outputs    | n8n LangChain nodes documentation     |
| Profile analysis logic focuses exclusively on Marketing Digital niche and revenue signals                              | Business rules embedded in AI prompts |
| Google Sheets columns must include "@ - Instagram", "Ativar Automação", and "Analisado" for proper filtering and update | Spreadsheet template linked in workflow metadata |
| AI models used: GPT-4o-mini (OpenAI) for both data structuring and analysis                                           | Requires OpenAI API access             |

---

**Disclaimer:** The text provided originates exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly respects applicable content policies and contains no illegal, offensive, or protected elements. All data manipulated are legal and public.