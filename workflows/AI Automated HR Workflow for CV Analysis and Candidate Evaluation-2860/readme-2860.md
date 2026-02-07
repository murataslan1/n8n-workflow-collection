AI Automated HR Workflow for CV Analysis and Candidate Evaluation

https://n8nworkflows.xyz/workflows/ai-automated-hr-workflow-for-cv-analysis-and-candidate-evaluation-2860


# AI Automated HR Workflow for CV Analysis and Candidate Evaluation

### 1. Workflow Overview

This workflow automates the end-to-end process of handling job applications by extracting, analyzing, and evaluating candidate CVs using AI-powered nodes and storing the results for HR review. It is designed for HR teams or recruitment agencies aiming to streamline candidate screening by leveraging natural language processing and structured data extraction.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception and File Handling**  
  Captures candidate submissions via a form, uploads the CV to Google Drive, and extracts raw text from the CV file.

- **1.2 Information Extraction**  
  Uses AI-powered extraction nodes to parse personal data (city, birthdate, telephone) and professional qualifications (education, job history, skills) from the CV text.

- **1.3 Data Merging and Summarization**  
  Combines extracted data streams and generates a concise summary of the candidate profile.

- **1.4 Candidate Evaluation**  
  Compares the summarized candidate profile against a predefined desired profile using an AI HR expert chain, producing a score and qualitative considerations.

- **1.5 Data Storage**  
  Appends all relevant candidate data, including evaluation results, into a Google Sheets document for record-keeping and further analysis.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and File Handling

**Overview:**  
This block initiates the workflow by receiving candidate submissions through a form, uploading the CV to Google Drive, and extracting the CV’s textual content for further processing.

**Nodes Involved:**  
- On form submission  
- Upload CV  
- Extract from File

**Node Details:**

- **On form submission**  
  - *Type:* Form Trigger  
  - *Role:* Entry point capturing candidate name, email, and CV file upload.  
  - *Configuration:* Form titled "Send CV" with three required fields: Name (text), Email (email), and CV (file, PDF only).  
  - *Inputs:* External HTTP webhook trigger on form submission.  
  - *Outputs:* Passes form data including binary CV file to downstream nodes.  
  - *Edge Cases:* Missing required fields, unsupported file types, or webhook failures.

- **Upload CV**  
  - *Type:* Google Drive node  
  - *Role:* Uploads the submitted CV file to a designated Google Drive folder for storage and archival.  
  - *Configuration:*  
    - File named dynamically with current date and original filename.  
    - Target folder specified by folder ID ("CV" folder).  
    - Uses Google Drive OAuth2 credentials.  
  - *Inputs:* Receives CV file binary data from form submission node.  
  - *Outputs:* Confirms upload success; no downstream connections.  
  - *Edge Cases:* Authentication errors, quota limits, or file upload failures.

- **Extract from File**  
  - *Type:* Extract from File  
  - *Role:* Extracts raw text content from the uploaded PDF CV for AI processing.  
  - *Configuration:* Operation set to "pdf", binary property name set to "CV".  
  - *Inputs:* Receives binary CV file from form submission node.  
  - *Outputs:* Outputs extracted text for further AI extraction nodes.  
  - *Edge Cases:* Corrupted PDF files, unsupported formats, or extraction failures.

---

#### 2.2 Information Extraction

**Overview:**  
This block parses the extracted CV text to obtain structured personal data and qualifications using specialized AI extraction nodes.

**Nodes Involved:**  
- Qualifications (informationExtractor)  
- Personal Data (informationExtractor)

**Node Details:**

- **Qualifications**  
  - *Type:* LangChain Information Extractor  
  - *Role:* Extracts educational qualifications, job history, and skills from CV text.  
  - *Configuration:*  
    - Input text bound to extracted CV text (`{{$json.text}}`).  
    - System prompt instructs to extract only relevant info, omitting unknown attributes.  
    - Attributes extracted:  
      - Educational qualification (summary, max 100 words, include grades if applicable)  
      - Job History (summary, max 100 words, focus on recent experience)  
      - Skills (bulleted list of technical skills and software proficiency)  
  - *Inputs:* Receives CV text from Extract from File node.  
  - *Outputs:* Outputs structured qualifications data.  
  - *Edge Cases:* Ambiguous or incomplete CV text, extraction inaccuracies.

- **Personal Data**  
  - *Type:* LangChain Information Extractor  
  - *Role:* Extracts personal details such as telephone, city, and birthdate from CV text.  
  - *Configuration:*  
    - Input text bound to extracted CV text (`{{$json.text}}`).  
    - System prompt similar to Qualifications node.  
    - Output schema manually defined with properties: telephone, city, birthdate.  
  - *Inputs:* Receives CV text from Extract from File node.  
  - *Outputs:* Outputs structured personal data.  
  - *Edge Cases:* Missing or ambiguous personal info, format inconsistencies.

---

#### 2.3 Data Merging and Summarization

**Overview:**  
Combines personal and qualification data into one dataset and generates a concise, conversational summary of the candidate profile.

**Nodes Involved:**  
- Merge  
- Summarization Chain

**Node Details:**

- **Merge**  
  - *Type:* Merge  
  - *Role:* Combines outputs from Qualifications and Personal Data nodes into a single JSON object.  
  - *Configuration:* Mode set to "combine" with "combineAll" option to merge all incoming data.  
  - *Inputs:* Receives two inputs: Qualifications (index 1) and Personal Data (index 0).  
  - *Outputs:* Single combined JSON output with all extracted attributes.  
  - *Edge Cases:* Mismatched or missing inputs, data conflicts.

- **Summarization Chain**  
  - *Type:* LangChain Summarization Chain  
  - *Role:* Generates a concise summary (max 100 words) of the candidate’s city, birthdate, educational qualification, job history, and skills.  
  - *Configuration:*  
    - Prompt template dynamically references merged data fields.  
    - Summarization method uses a conversational tone.  
  - *Inputs:* Receives merged data from Merge node.  
  - *Outputs:* Outputs summarized text of candidate profile.  
  - *Edge Cases:* Missing fields in merged data, AI model timeouts or errors.

---

#### 2.4 Candidate Evaluation

**Overview:**  
Evaluates the summarized candidate profile against a predefined desired profile using an AI HR expert chain, producing a numeric score and qualitative considerations.

**Nodes Involved:**  
- Profile Wanted  
- HR Expert  
- Structured Output Parser

**Node Details:**

- **Profile Wanted**  
  - *Type:* Set  
  - *Role:* Defines the target candidate profile as a string for evaluation reference.  
  - *Configuration:*  
    - Sets variable `profile_wanted` describing the ideal candidate: full-stack web developer skilled in PHP, Python, JavaScript, experienced in the sector, residing in Northern Italy.  
  - *Inputs:* Receives summarized candidate profile from Summarization Chain.  
  - *Outputs:* Passes profile and candidate summary to HR Expert node.  
  - *Edge Cases:* Static profile may need updating for different roles.

- **HR Expert**  
  - *Type:* LangChain LLM Chain  
  - *Role:* Acts as an AI HR expert to score the candidate from 1 to 10 based on alignment with the desired profile and provide hiring considerations.  
  - *Configuration:*  
    - Prompt includes both the desired profile and candidate summary.  
    - Instructions specify scoring scale and require a justification in "consideration".  
    - Output parser enabled to structure response into `vote` and `consideration`.  
  - *Inputs:* Receives profile from Profile Wanted and candidate summary.  
  - *Outputs:* Structured evaluation results.  
  - *Edge Cases:* AI model bias, ambiguous scoring, or parsing errors.

- **Structured Output Parser**  
  - *Type:* LangChain Structured Output Parser  
  - *Role:* Parses AI output from HR Expert into structured JSON with fields `vote` (string) and `consideration` (string).  
  - *Configuration:* Manual JSON schema defining expected output properties.  
  - *Inputs:* Receives raw AI output from HR Expert.  
  - *Outputs:* Clean structured data for downstream use.  
  - *Edge Cases:* Output format deviations, parsing failures.

---

#### 2.5 Data Storage

**Overview:**  
Stores all relevant candidate data and evaluation results into a Google Sheets document for HR review and record-keeping.

**Nodes Involved:**  
- Google Sheets

**Node Details:**

- **Google Sheets**  
  - *Type:* Google Sheets node  
  - *Role:* Appends a new row to a specified Google Sheet with candidate details and evaluation results.  
  - *Configuration:*  
    - Document ID and sheet name specified (linked to a spreadsheet named "Ricerca WebDev").  
    - Columns mapped to fields including city, date, name, vote, email, skills, telephone, summary, education, job history, birthdate, and HR considerations.  
    - Date field auto-populated with current date.  
    - Uses Google Sheets OAuth2 credentials.  
  - *Inputs:* Receives structured evaluation and merged candidate data.  
  - *Outputs:* Confirms append operation; no further downstream nodes.  
  - *Edge Cases:* Authentication errors, quota limits, schema mismatches.

---

### 3. Summary Table

| Node Name           | Node Type                          | Functional Role                                  | Input Node(s)               | Output Node(s)             | Sticky Note                                                                                                    |
|---------------------|----------------------------------|-------------------------------------------------|-----------------------------|----------------------------|---------------------------------------------------------------------------------------------------------------|
| On form submission   | Form Trigger                     | Entry point capturing candidate data            | —                           | Extract from File, Upload CV | ## HR Expert This workflow automates the process of handling job applications by extracting relevant information from submitted CVs, analyzing the candidate's qualifications against a predefined profile, and storing the results in a Google Sheet |
| Upload CV           | Google Drive                     | Uploads CV file to Google Drive folder           | On form submission          | —                          | The CV is uploaded to Google Drive and converted so that it can be processed                                  |
| Extract from File    | Extract from File                | Extracts text from uploaded PDF CV                | On form submission          | Qualifications, Personal Data | The essential information for evaluating the candidate is collected in two different chains                   |
| Qualifications      | LangChain Information Extractor | Extracts educational qualifications, job history, skills | Extract from File           | Merge                      | The essential information for evaluating the candidate is collected in two different chains                   |
| Personal Data       | LangChain Information Extractor | Extracts telephone, city, birthdate               | Extract from File           | Merge                      | The essential information for evaluating the candidate is collected in two different chains                   |
| Merge               | Merge                           | Combines qualifications and personal data        | Qualifications, Personal Data | Summarization Chain        | Summary of relevant information useful for classifying the candidate                                          |
| Summarization Chain | LangChain Summarization Chain   | Summarizes combined candidate data                | Merge                       | Profile Wanted             | Summary of relevant information useful for classifying the candidate                                          |
| Profile Wanted      | Set                            | Defines desired candidate profile                 | Summarization Chain         | HR Expert                  | Characteristics of the profile sought by the company that intends to hire the candidate                        |
| HR Expert           | LangChain LLM Chain             | Evaluates candidate against desired profile       | Profile Wanted              | Google Sheets              | Candidate evaluation with vote and considerations of the HR agent relating the profile sought with the candidate's skills |
| Structured Output Parser | LangChain Structured Output Parser | Parses AI evaluation output into structured data | HR Expert                   | HR Expert (AI outputParser) | Candidate evaluation with vote and considerations of the HR agent relating the profile sought with the candidate's skills |
| Google Sheets       | Google Sheets                   | Stores candidate data and evaluation results      | HR Expert                   | —                          | Candidate evaluation with vote and considerations of the HR agent relating the profile sought with the candidate's skills |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Form Trigger Node**  
   - Add a **Form Trigger** node named "On form submission".  
   - Configure form title as "Send CV".  
   - Add three required fields:  
     - Name (text)  
     - Email (email)  
     - CV (file upload, accept only `.pdf`)  
   - This node will serve as the webhook entry point.

2. **Add Google Drive Upload Node**  
   - Add a **Google Drive** node named "Upload CV".  
   - Set operation to upload file.  
   - Configure file name as `CV-{{ $now.format('yyyyLLdd') }}-{{ $json.CV[0].filename }}` to include date and original filename.  
   - Select the target folder by folder ID (e.g., your "CV" folder).  
   - Use Google Drive OAuth2 credentials.  
   - Connect "On form submission" node output to this node input.

3. **Add Extract from File Node**  
   - Add an **Extract from File** node named "Extract from File".  
   - Set operation to "pdf".  
   - Set binary property name to "CV".  
   - Connect "On form submission" node output to this node input.

4. **Add Qualifications Information Extractor Node**  
   - Add a **LangChain Information Extractor** node named "Qualifications".  
   - Bind input text to `{{$json.text}}` from "Extract from File".  
   - Set system prompt to:  
     ```
     You are an expert extraction algorithm.
     Only extract relevant information from the text.
     If you do not know the value of an attribute asked to extract, you may omit the attribute's value.
     ```  
   - Define attributes to extract:  
     - Educational qualification (required, max 100 words summary including grades)  
     - Job History (required, max 100 words summary focusing on recent experience)  
     - Skills (required, bulleted list of technical skills and software/framework proficiency)  
   - Connect "Extract from File" output to this node.

5. **Add Personal Data Information Extractor Node**  
   - Add a **LangChain Information Extractor** node named "Personal Data".  
   - Bind input text to `{{$json.text}}` from "Extract from File".  
   - Use the same system prompt as Qualifications.  
   - Define manual JSON schema with properties: telephone (string), city (string), birthdate (string).  
   - Connect "Extract from File" output to this node.

6. **Add Merge Node**  
   - Add a **Merge** node named "Merge".  
   - Set mode to "combine" and combineBy to "combineAll".  
   - Connect "Personal Data" node output to input 0, and "Qualifications" node output to input 1.

7. **Add Summarization Chain Node**  
   - Add a **LangChain Summarization Chain** node named "Summarization Chain".  
   - Configure summarization prompt as:  
     ```
     Write a concise summary of the following:

     City: {{ $json.output.city }}
     Birthdate: {{ $json.output.birthdate }}
     Educational qualification: {{ $json.output["Educational qualification"] }}
     Job History: {{ $json.output["Job History"] }}
     Skills: {{ $json.output.Skills }}

     Use 100 words or less. Be concise and conversational.
     ```  
   - Connect "Merge" node output to this node.

8. **Add Set Node for Desired Profile**  
   - Add a **Set** node named "Profile Wanted".  
   - Create a string variable `profile_wanted` with value:  
     ```
     We are a web agency and we are looking for a full-stack web developer who knows how to use PHP, Python and Javascript. He has experience in the sector and lives in Northern Italy.
     ```  
   - Connect "Summarization Chain" output to this node.

9. **Add HR Expert Chain Node**  
   - Add a **LangChain LLM Chain** node named "HR Expert".  
   - Configure prompt with:  
     ```
     Profilo ricercato:
     {{ $json.profile_wanted }}

     Candidato:
     {{ $('Summarization Chain').item.json.response.text }}

     Sei un esperto HR e devi capire se il candidato è in linea con il profilo ricercato dall'azienda.

     Devi dare un voto da 1 a 10 dove 1 significa che il candidato non è in linea con quanto richiesto mentre 10 significa che è il candidato ideale perchè rispecchia in toto il profilo cercato.

     Inoltre nel campo "consideration" motiva il perchè hai dato quel voto.
     ```  
   - Enable output parser with manual JSON schema expecting fields:  
     - vote (string)  
     - consideration (string)  
   - Connect "Profile Wanted" output to this node.

10. **Add Structured Output Parser Node**  
    - Add a **LangChain Structured Output Parser** node named "Structured Output Parser".  
    - Define manual schema matching HR Expert output:  
      ```json
      {
        "type": "object",
        "properties": {
          "vote": { "type": "string" },
          "consideration": { "type": "string" }
        }
      }
      ```  
    - Connect "HR Expert" node output (ai_outputParser) to this node.

11. **Add Google Sheets Node**  
    - Add a **Google Sheets** node named "Google Sheets".  
    - Set operation to "append".  
    - Specify target spreadsheet by Document ID and sheet name (e.g., "Ricerca WebDev", gid=0).  
    - Map columns as follows:  
      - CITY: `={{ $('Merge').item.json.output.city }}`  
      - DATA (Date): `={{ $now.format('dd/LL/yyyy') }}`  
      - NAME: `={{ $('On form submission').item.json.Nome }}`  
      - VOTE: `={{ $json.output.vote }}`  
      - EMAIL: `={{ $('On form submission').item.json.Email }}`  
      - SKILLS: `={{ $('Merge').item.json.output.Skills }}`  
      - TELEFONO: `={{ $('Merge').item.json.output.telephone }}`  
      - SUMMARIZE: `={{ $('Summarization Chain').item.json.response.text }}`  
      - EDUCATIONAL: `={{ $('Merge').item.json.output["Educational qualification"] }}`  
      - JOB HISTORY: `={{ $('Merge').item.json.output["Job History"] }}`  
      - DATA NASCITA: `={{ $('Merge').item.json.output.birthdate }}`  
      - CONSIDERATION: `={{ $json.output.consideration }}`  
    - Use Google Sheets OAuth2 credentials.  
    - Connect "HR Expert" node output to this node.

12. **Connect Nodes Appropriately**  
    - "On form submission" → "Extract from File" and "Upload CV" (parallel)  
    - "Extract from File" → "Qualifications" and "Personal Data" (parallel)  
    - "Qualifications" and "Personal Data" → "Merge"  
    - "Merge" → "Summarization Chain"  
    - "Summarization Chain" → "Profile Wanted"  
    - "Profile Wanted" → "HR Expert"  
    - "HR Expert" → "Structured Output Parser" (ai_outputParser)  
    - "Structured Output Parser" → "HR Expert" (ai_outputParser output)  
    - "HR Expert" → "Google Sheets"

13. **Credential Setup**  
    - Configure Google Drive OAuth2 credentials for "Upload CV".  
    - Configure Google Sheets OAuth2 credentials for "Google Sheets".  
    - Configure OpenAI API credentials for all LangChain nodes (Qualifications, Personal Data, Summarization Chain, HR Expert, Structured Output Parser).

14. **Testing and Validation**  
    - Test the form submission with a sample PDF CV.  
    - Verify CV upload to Google Drive.  
    - Confirm text extraction and data parsing accuracy.  
    - Validate summarization and HR evaluation outputs.  
    - Check data appending in Google Sheets.

---

This detailed documentation enables both human users and AI agents to fully understand, reproduce, and maintain the AI Automated HR Workflow for CV Analysis and Candidate Evaluation in n8n.