Automate Bank Statement and Invoice Reconciliation with GPT-4.1-mini and Google Sheets

https://n8nworkflows.xyz/workflows/automate-bank-statement-and-invoice-reconciliation-with-gpt-4-1-mini-and-google-sheets-10581


# Automate Bank Statement and Invoice Reconciliation with GPT-4.1-mini and Google Sheets

### 1. Workflow Overview

This workflow automates the reconciliation of bank statements and invoice data using GPT-4.1-mini AI and Google Sheets. It targets finance teams or accountants who want to efficiently match invoices against bank transactions, identify matched, unmatched, and possibly matching entries, and document the reconciliation results for audit and reporting purposes.

Logical blocks in the workflow:

- **1.1 Manual Trigger**  
  Initiates the process manually on demand.

- **1.2 Data Retrieval**  
  Fetches invoice and bank statement data from designated Google Sheets tabs.

- **1.3 Data Merging and Payload Preparation**  
  Merges the invoice and bank transaction data into a single structured JSON payload, formatted for AI processing.

- **1.4 AI Reconciliation Processing**  
  Sends the prepared data to the GPT-4.1-mini AI agent, which applies detailed matching rules and scoring to identify reconciliations.

- **1.5 AI Output Parsing and Labeling**  
  Parses the AI JSON output, labels data streams (matched, unmatched, possible matches, summary), and splits them for downstream processing.

- **1.6 Conditional Routing & Writing Results**  
  Routes each data stream to the appropriate Google Sheets tab to append reconciliation results, including matched entries, unmatched invoices, unmatched bank transactions, possible matches, and summary data.

---

### 2. Block-by-Block Analysis

#### 1.1 Manual Trigger

- **Overview:**  
  Starts the workflow execution manually when triggered by the user.

- **Nodes Involved:**  
  - When clicking ‘Execute workflow’ (Manual Trigger)

- **Node Details:**  
  - Type: Manual Trigger (n8n-nodes-base.manualTrigger)  
  - Configuration: Default manual trigger, no parameters.  
  - Inputs: None  
  - Outputs: Connects to data retrieval nodes.  
  - Edge Cases: N/A (manual start only).

---

#### 1.2 Data Retrieval

- **Overview:**  
  Retrieves invoice and bank statement data from designated Google Sheets tabs using OAuth2 credentials.

- **Nodes Involved:**  
  - Invoice Data (Google Sheets)  
  - Bank Statements (Google Sheets)

- **Node Details:**  
  - Type: Google Sheets (n8n-nodes-base.googleSheets)  
  - Configuration:  
    - DocumentId: Spreadsheet named "Reconciliation POC"  
    - Sheet Names: "Invoices" and "Bank Statement" respectively  
    - Operation: Read rows (default)  
    - Credentials: Google Sheets OAuth2 account  
  - Inputs: Manual Trigger  
  - Outputs: Both connected to the Merge node  
  - Edge Cases:  
    - Authentication errors if credentials invalid  
    - Empty or missing sheet data  
    - API rate limits or timeouts  

---

#### 1.3 Data Merging and Payload Preparation

- **Overview:**  
  Merges invoice and bank statement datasets into a single payload object, preparing it for AI analysis.

- **Nodes Involved:**  
  - Merge (Merge node)  
  - Combine and Label Merged Data (Code node)

- **Node Details:**  
  - Merge  
    - Type: Merge (n8n-nodes-base.merge)  
    - Configuration: Default (merges the two incoming branches into one)  
    - Inputs: Invoice Data (index 0), Bank Statements (index 1)  
    - Outputs: Connects to Combine and Label Merged Data node  
    - Edge Cases: Mismatch in data length or empty inputs  
  - Combine and Label Merged Data  
    - Type: Code (JavaScript)  
    - Configuration: Merges the two arrays from previous nodes into a structured JSON payload with keys: source, currency, invoices, and bank_transactions.  
    - Inputs: Merged data from Merge node  
    - Outputs: Payload JSON  
    - Edge Cases: Empty input arrays, malformed input data  

---

#### 1.4 AI Reconciliation Processing

- **Overview:**  
  Sends the prepared JSON payload to the GPT-4.1-mini AI model that performs advanced reconciliation logic based on predefined rules and confidence scoring.

- **Nodes Involved:**  
  - OpenAI Chat Model (OpenAI Language Model node)  
  - Process the Invoice Vs Bank Statement Data1 (Langchain AI Agent node)

- **Node Details:**  
  - OpenAI Chat Model  
    - Type: Langchain LM Chat OpenAI node (@n8n/n8n-nodes-langchain.lmChatOpenAi)  
    - Configuration: Model set to "gpt-4.1-mini", temperature 0 (deterministic)  
    - Credentials: OpenAI API key  
    - Outputs: Connects to AI Agent node  
    - Edge Cases: API quota exhaustion, network timeouts, invalid API key  
  - Process the Invoice Vs Bank Statement Data1  
    - Type: Langchain Agent (@n8n/n8n-nodes-langchain.agent)  
    - Configuration:  
      - Custom prompt containing detailed reconciliation logic, matching rules (reference, amount, date proximity, heuristics), exclusion rules, confidence scoring, and strict JSON output format instructions.  
      - Input variable: JSON stringified payload from previous node  
      - Output parser enabled to parse JSON only  
    - Inputs: AI chat model output  
    - Outputs: Connects to parsing and formatting node  
    - Edge Cases: AI returning invalid JSON, prompt failures, large payloads causing timeout  

---

#### 1.5 AI Output Parsing and Labeling

- **Overview:**  
  Parses the AI JSON output safely, extracting different labeled data streams for matched results, possible matches, unmatched invoices, unmatched bank transactions, and summary statistics.

- **Nodes Involved:**  
  - Clean and Format Data (Code node)  
  - Add Stream Label Filter (Code node)  
  - Switch (Switch node)

- **Node Details:**  
  - Clean and Format Data  
    - Type: Code (JavaScript)  
    - Configuration: Strips markdown fences (```), extracts JSON block, and parses it. Returns error details if parsing fails.  
    - Inputs: AI Agent JSON output  
    - Outputs: Parsed JSON  
    - Edge Cases: Malformed AI output, missing fences, JSON parse errors  
  - Add Stream Label Filter  
    - Type: Code (JavaScript)  
    - Configuration: Labels entries with "stream" keys such as matched, unmatched (subtypes invoice or bank_transaction), possible_matches, and summary based on data structure variants (legacy or relational).  
    - Inputs: Cleaned JSON output  
    - Outputs: Array of labeled JSON objects for routing  
  - Switch  
    - Type: Switch (n8n-nodes-base.switch)  
    - Configuration: Routes data based on the "stream" property with possible values: "matched", "unmatched", "summary", "possible_matches"  
    - Inputs: Output from Add Stream Label Filter  
    - Outputs: Four branches corresponding to each data stream  
    - Edge Cases: Unexpected stream values, missing stream property  

---

#### 1.6 Conditional Routing & Writing Results

- **Overview:**  
  Writes the labeled reconciliation results into specific Google Sheets tabs based on the data stream, handling unmatched invoices and bank transactions separately.

- **Nodes Involved:**  
  - Matched (Google Sheets)  
  - Possible Matches (Google Sheets)  
  - Summary (Google Sheets)  
  - If (If node)  
  - Unmatched_Invoice (Google Sheets)  
  - Unmatched-Bank Transaction (Google Sheets)

- **Node Details:**  
  - Matched  
    - Type: Google Sheets  
    - Configuration: Appends matched reconciliation data to the "Reconciled Data(Matched)" tab, mapping all relevant fields with defined schema.  
  - Possible Matches  
    - Type: Google Sheets  
    - Configuration: Appends possible matches data to the "Reconciled Data(Possible Matches)" tab with candidate details.  
  - Summary  
    - Type: Google Sheets  
    - Configuration: Appends summary statistics to the "Reconciled Data(Summary)" tab.  
  - If  
    - Type: If (n8n-nodes-base.if)  
    - Configuration: Checks if unmatched entries are invoices (subtype == "invoice") or bank transactions for routing.  
  - Unmatched_Invoice  
    - Type: Google Sheets  
    - Configuration: Appends unmatched invoices to "Reconciled Data(Unmatched)" tab with invoice-specific fields.  
  - Unmatched-Bank Transaction  
    - Type: Google Sheets  
    - Configuration: Appends unmatched bank transactions to "Reconciled Data(Unmatched)" tab with bank transaction-specific fields.  
  - Inputs: Switch node output branches  
  - Outputs: None (end nodes)  
  - Edge Cases: Google Sheets API limits, data schema mismatches, empty data streams  

---

### 3. Summary Table

| Node Name                             | Node Type                             | Functional Role                                  | Input Node(s)                           | Output Node(s)                                   | Sticky Note                                                                                                       |
|-------------------------------------|-------------------------------------|-------------------------------------------------|---------------------------------------|-------------------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’    | Manual Trigger                      | Start workflow manually                          | None                                  | Invoice Data, Bank Statements                    | ## Manual Trigger \n**Workflow starts manually to initiate the reconciliation process on demand."               |
| Invoice Data                        | Google Sheets                      | Fetch invoice data                               | When clicking ‘Execute workflow’      | Merge                                           | ## Fetch Invoices & Bank Statements \n**Retrieves invoice data and bank statement data from Google Sheets for comparison." |
| Bank Statements                    | Google Sheets                      | Fetch bank statement data                        | When clicking ‘Execute workflow’      | Merge                                           | ## Fetch Invoices & Bank Statements \n**Retrieves invoice data and bank statement data from Google Sheets for comparison." |
| Merge                             | Merge                             | Combine invoice and bank data                    | Invoice Data, Bank Statements          | Combine and Label Merged Data                    | ## Merge Data\nCombines both datasets into a single structured dataset for processing.                           |
| Combine and Label Merged Data      | Code                              | Format payload JSON for AI input                 | Merge                                | Process the Invoice Vs Bank Statement Data1     | ## Format Payload for AI\nFunction node prepares and structures the merged data into a clean JSON payload for AI analysis. |
| OpenAI Chat Model                  | Langchain LM Chat OpenAI           | Call GPT-4.1-mini AI model                       | Combine and Label Merged Data          | Process the Invoice Vs Bank Statement Data1     | ## AI Reconciliation\nAI Agent analyzes the invoice and bank statement data to identify matches, discrepancies, and reconciled entries. |
| Process the Invoice Vs Bank Statement Data1 | Langchain Agent               | AI reconciliation logic and scoring             | OpenAI Chat Model                     | Clean and Format Data                            | ## AI Reconciliation\nAI Agent analyzes the invoice and bank statement data to identify matches, discrepancies, and reconciled entries. |
| Clean and Format Data             | Code                              | Parse AI JSON response safely                    | Process the Invoice Vs Bank Statement Data1 | Add Stream Label Filter                         | ## Parse AI Output\n**Parses the AI response into a structured format suitable for adding back to Google Sheets." |
| Add Stream Label Filter           | Code                              | Label JSON data streams for routing              | Clean and Format Data                 | Switch                                          | ## Parse AI Output\n**Parses the AI response into a structured format suitable for adding back to Google Sheets." |
| Switch                           | Switch                            | Route data streams for writing to sheets         | Add Stream Label Filter               | Matched, If, Summary, Possible Matches          | ## Update Sheets\nAdds the reconciled data and reconciliation results into the target Google Sheet for recordkeeping. |
| Matched                         | Google Sheets                    | Append matched data to reconciliation sheet       | Switch (matched)                     | None                                            | ## Update Sheets\nAdds the reconciled data and reconciliation results into the target Google Sheet for recordkeeping. |
| Possible Matches                | Google Sheets                    | Append possible matches data                       | Switch (possible_matches)             | None                                            | ## Update Sheets\nAdds the reconciled data and reconciliation results into the target Google Sheet for recordkeeping. |
| Summary                        | Google Sheets                    | Append summary reconciliation statistics          | Switch (summary)                      | None                                            | ## Update Sheets\nAdds the reconciled data and reconciliation results into the target Google Sheet for recordkeeping. |
| If                             | If                               | Check subtype of unmatched data for routing       | Switch (unmatched)                    | Unmatched_Invoice (true), Unmatched-Bank Transaction (false) | ## Update Sheets\nAdds the reconciled data and reconciliation results into the target Google Sheet for recordkeeping. |
| Unmatched_Invoice              | Google Sheets                    | Append unmatched invoices                          | If (true branch)                     | None                                            | ## Update Sheets\nAdds the reconciled data and reconciliation results into the target Google Sheet for recordkeeping. |
| Unmatched-Bank Transaction     | Google Sheets                    | Append unmatched bank transactions                 | If (false branch)                    | None                                            | ## Update Sheets\nAdds the reconciled data and reconciliation results into the target Google Sheet for recordkeeping. |
| Sticky Notes (various)          | Sticky Note                      | Documentation and explanations                     | None                                | None                                            | See individual notes above for context.                                                                           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - No configuration needed.

2. **Add Google Sheets Node: Invoice Data**  
   - Type: Google Sheets  
   - Operation: Read rows  
   - Document ID: Select your Google Spreadsheet containing invoices.  
   - Sheet Name: Select "Invoices" tab.  
   - Credentials: Configure Google Sheets OAuth2 credentials.

3. **Add Google Sheets Node: Bank Statements**  
   - Type: Google Sheets  
   - Operation: Read rows  
   - Document ID: Same spreadsheet as invoices.  
   - Sheet Name: Select "Bank Statement" tab.  
   - Credentials: Same Google Sheets OAuth2 credentials.

4. **Connect Manual Trigger to both Google Sheets nodes (Invoice Data and Bank Statements).**

5. **Add Merge Node**  
   - Type: Merge  
   - Mode: Default (combine data from both inputs)  
   - Connect Invoice Data to input 1  
   - Connect Bank Statements to input 2

6. **Add Code Node: Combine and Label Merged Data**  
   - Paste JavaScript code to combine invoice and bank transaction arrays into structured JSON payload with keys: source, currency="USD", invoices, bank_transactions.  
   - Connect Merge node output to this node.

7. **Add Langchain LM Chat OpenAI Node: OpenAI Chat Model**  
   - Model: gpt-4.1-mini  
   - Temperature: 0  
   - Credentials: Add OpenAI API key credentials.  
   - Connect Combine and Label Merged Data output to this node.

8. **Add Langchain Agent Node: Process the Invoice Vs Bank Statement Data1**  
   - Paste the detailed reconciliation prompt with matching rules, exclusions, confidence scoring, and output format.  
   - Enable output parser to parse JSON only.  
   - Connect OpenAI Chat Model output to this node.

9. **Add Code Node: Clean and Format Data**  
   - Paste JavaScript code to parse AI output JSON safely, stripping markdown fences and extracting valid JSON or error details.  
   - Connect AI Agent output to this node.

10. **Add Code Node: Add Stream Label Filter**  
    - Paste JavaScript code to label parsed JSON objects with stream types: matched, unmatched (with subtype), possible_matches, summary.  
    - Connect Clean and Format Data output to this node.

11. **Add Switch Node**  
    - Add four rules to route based on `$json.stream` values: "matched", "unmatched", "summary", "possible_matches".  
    - Connect Add Stream Label Filter output to this node.

12. **Add Google Sheets Node: Matched**  
    - Operation: Append rows  
    - Document ID: Same spreadsheet  
    - Sheet Name: "Reconciled Data(Matched)"  
    - Map columns to matched data fields such as invoice_no, amount, confidence, etc.  
    - Connect "matched" output branch of Switch to this node.

13. **Add Google Sheets Node: Possible Matches**  
    - Operation: Append rows  
    - Sheet Name: "Reconciled Data(Possible Matches)"  
    - Map columns to candidate match fields with invoice_no, reason, candidate amounts, etc.  
    - Connect "possible_matches" output branch of Switch to this node.

14. **Add Google Sheets Node: Summary**  
    - Operation: Append rows  
    - Sheet Name: "Reconciled Data(Summary)"  
    - Map summary statistics fields accordingly.  
    - Connect "summary" output branch of Switch to this node.

15. **Add If Node**  
    - Condition: `$json.subtype == "invoice"`  
    - Connect "unmatched" output branch of Switch to this node.

16. **Add Google Sheets Node: Unmatched_Invoice**  
    - Operation: Append rows  
    - Sheet Name: "Reconciled Data(Unmatched)"  
    - Map columns for invoices.  
    - Connect If node True output to this node.

17. **Add Google Sheets Node: Unmatched-Bank Transaction**  
    - Operation: Append rows  
    - Sheet Name: "Reconciled Data(Unmatched)"  
    - Map columns for bank transactions.  
    - Connect If node False output to this node.

18. **Verify all Google Sheets credentials are configured and tested.**

19. **Test the workflow with sample data in the spreadsheets and trigger manually.**

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                         | Context or Link                                                                                                                                                              |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 🧾 Prerequisites: OpenAI API Credentials required for AI reconciliation node. Google Sheets credentials needed for reading and writing data. Spreadsheet must have tabs: Invoices, Bank Statement, Reconciled Data (with sub-tabs for Matched, Possible Matches, Unmatched, Summary). Tab columns must match expected schema. Test each node individually before full run. | See Sticky Note at workflow position [-256, -960] for detailed setup instructions.                                                                                            |
| The AI reconciliation prompt encodes complex matching rules: exact reference match, amount match, date proximity (±7 days), and heuristic name matching with confidence scoring. The AI returns strictly JSON-formatted results for safe parsing.                                                                                                       | Embedded in Langchain Agent node's prompt.                                                                                                                                   |
| Google Sheets append operations rely on consistent schema matching column names and data types (strings/numbers). Adjust spreadsheet columns accordingly if changing workflow mappings.                                                                                                                                                             | Multiple Google Sheets nodes configured for append with defined schemas.                                                                                                    |
| Use n8n credentials manager to securely store and manage OAuth2 credentials for Google Sheets and OpenAI API keys.                                                                                                                                                                                                                                  | n8n Credential Setup                                                                                                                                                          |
| Workflow is designed for manual execution but can be automated with scheduled triggers or webhook triggers if desired.                                                                                                                                                                                                                              | Starting node is Manual Trigger, can be replaced or supplemented.                                                                                                           |
| AI output parsing includes robust error handling to catch JSON parse errors from the AI response, returning error messages in the JSON output for debugging.                                                                                                                                                                                        | Clean and Format Data node JavaScript code.                                                                                                                                  |
| Documentation sticky notes are included inline in the workflow for step explanations and can be used as in-editor references.                                                                                                                                                                                                                      | Multiple sticky notes positioned near logical blocks.                                                                                                                       |

---

**Disclaimer:** The provided text is exclusively from an n8n automated workflow. All data handled is legal and public. No illegal or offensive content is included. The workflow respects applicable content policies.