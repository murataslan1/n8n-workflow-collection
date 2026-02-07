Analyze brand visibility in AI SERPs with SE Ranking and OpenAI GPT-4.1 mini

https://n8nworkflows.xyz/workflows/analyze-brand-visibility-in-ai-serps-with-se-ranking-and-openai-gpt-4-1-mini-12442


# Analyze brand visibility in AI SERPs with SE Ranking and OpenAI GPT-4.1 mini

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Purpose:**  
This workflow retrieves *real AI search prompts and answers* related to a given **brand** from **SE Ranking’s AI Search “prompts-by-brand” endpoint**, extracts three structured views of the response (links-only, prompts+answers, and raw prompts-with-links), merges them into one unified dataset, and exports the result as a JSON file on disk.

**Primary use cases:**
- Brand visibility research in AI-driven SERPs (e.g., Perplexity)
- Capturing brand-related AI prompts, model answers, and citation links for analysis
- Creating datasets for reporting, content strategy, or downstream automation

**Logical blocks (node-to-node dependencies):**
1.1 **Input & Parameterization** → Manual trigger + set brand/engine/region/sort/limits  
1.2 **SE Ranking Retrieval** → HTTP call to SE Ranking API using header auth  
1.3 **Custom Data Extraction** → Parse response into three normalized outputs (links, prompt+answer pairs, raw prompt objects)  
1.4 **Unification & Export** → Merge outputs, convert to binary, write JSON to disk

---

## 2. Block-by-Block Analysis

### 2.1 Input & Parameterization

**Overview:**  
Defines the runtime parameters (brand, engine, source, sorting, pagination, and keyword include/exclude filters) and starts the workflow manually.

**Nodes Involved:**
- When clicking ‘Execute workflow’
- Set the Input Fields

#### Node: When clicking ‘Execute workflow’
- **Type / Role:** Manual Trigger (`n8n-nodes-base.manualTrigger`) — entry point for manual runs.
- **Configuration (interpreted):** No parameters; execution begins when user clicks **Execute workflow** in the editor.
- **Inputs / Outputs:**  
  - **Input:** None  
  - **Output:** One item to **Set the Input Fields**
- **Edge cases / failures:** None (manual start only).
- **Version notes:** TypeVersion 1; standard.

#### Node: Set the Input Fields
- **Type / Role:** Set (`n8n-nodes-base.set`) — creates/overrides fields used as HTTP query parameters.
- **Key configuration choices:**
  - Sets:
    - `brand`: `"LinkedIn"`
    - `engine`: `"perplexity"`
    - `source`: `"us"`
    - `sort`: `"volume"`
    - `sort_order`: `"desc"`
    - `offset`: `"0"`
    - `limit`: `"10"`
    - `multi_keyword_included`: JSON-like string representing inclusion rules
    - `multi_keyword_excluded`: JSON-like string representing exclusion rules
  - Note: the two `multi_keyword_*` fields are **not used downstream** in this workflow’s HTTP request (they are prepared but never passed to SE Ranking in the current node configuration).
- **Expressions / variables:** Literal values only in this node.
- **Inputs / Outputs:**  
  - **Input:** Manual trigger output  
  - **Output:** To **SE Ranking AI Request by Brand**
- **Edge cases / failures:**
  - `offset` and `limit` are stored as **strings**; if SE Ranking expects integers, it may still coerce correctly, but strict APIs can reject. Consider setting as number types.
  - Unused fields (`multi_keyword_included/excluded`) may confuse maintainers; either wire them into the request if supported or remove.
- **Version notes:** TypeVersion 3.4.

**Sticky note context (applies to this block):**
- **How It Works / Setup / Customize** (large note) describes credentials setup, updating input fields, and verifying export path.

---

### 2.2 SE Ranking Retrieval

**Overview:**  
Calls SE Ranking’s AI Search endpoint to fetch prompts, AI answers, and supporting links for a brand, according to configured parameters.

**Nodes Involved:**
- SE Ranking AI Request by Brand

#### Node: SE Ranking AI Request by Brand
- **Type / Role:** HTTP Request (`n8n-nodes-base.httpRequest`) — queries SE Ranking API.
- **Endpoint:** `GET https://api.seranking.com/v1/ai-search/prompts-by-brand`
- **Authentication:**
  - Uses **Generic Credential Type** with **HTTP Header Auth** (`genericAuthType: httpHeaderAuth`).
  - Credential selected: **“SE Ranking”** (HTTP Header Auth).
  - Also lists an **httpBearerAuth** credential (“Thordata Webscraper API”), but it is not the active auth type for this request; it’s likely leftover or available but unused.
- **Query parameters (expressions):**
  - `brand` = `{{ $json.brand }}`
  - `source` = `{{ $json.source }}`
  - `engine` = `{{ $json.engine }}`
  - `sort` = `{{ $json.sort }}`
  - `sort_order` = `{{ $json.sort_order }}`
  - `offset` = `{{ $json.offset }}`
  - `limit` = `{{ $json.limit }}`
- **Behavior options:**
  - Redirect handling: configured to **not follow redirects** (`followRedirects: false`)
  - `retryOnFail: true` enabled
- **Inputs / Outputs:**
  - **Input:** From **Set the Input Fields**
  - **Outputs:** Fan-out to three extraction nodes:
    - **Extract All Links**
    - **Extract Prompts with Answers**
    - **Extract JSON**
- **Edge cases / failures:**
  - **401/403** if header auth is missing/expired/wrong header key/value.
  - **429 rate limiting**; retry may help but can still fail if limits persist.
  - **Unexpected response shape** (e.g., missing `prompts` array) will break downstream code nodes that assume `data.prompts` exists.
  - **Redirects** won’t be followed; if SE Ranking changes behavior to redirect, the call would fail.
- **Version notes:** TypeVersion 4.3.

**Sticky note context (applies to this block):**
- “AI Search with SE Ranking by Brand” explains that it retrieves real prompts/answers/links for brand-level AI SERP intelligence.

---

### 2.3 Custom Data Extraction

**Overview:**  
Transforms the SE Ranking response into three datasets: (1) a clean list of URLs, (2) prompt+answer text pairs (excluding links), and (3) the raw prompts objects including links. These are later merged.

**Nodes Involved:**
- Extract All Links
- Extract Prompts with Answers
- Extract JSON

#### Node: Extract All Links
- **Type / Role:** Code (`n8n-nodes-base.code`) — flattens all citation/reference links from prompt answers.
- **Key logic (interpreted):**
  - Reads `prompts` from `$input.first().json.prompts` (defaults to `[]` if missing).
  - Collects all `p.answer.links` into a single list.
  - Normalizes by trimming, removing falsy values, and keeping only strings starting with `http`.
  - Outputs a single item: `{ links: [ ... ] }`
- **Inputs / Outputs:**
  - **Input:** SE Ranking API response
  - **Output:** To **Merge Responses** input index 0
- **Edge cases / failures:**
  - If `prompts` is not an array but some other type, `.flatMap` will throw.
  - If links are non-string values, `u.trim()` will throw; current code assumes strings.
- **Version notes:** TypeVersion 2.

#### Node: Extract Prompts with Answers
- **Type / Role:** Code (`n8n-nodes-base.code`) — extracts textual prompt and answer pairs, intentionally excluding link data.
- **Key logic (interpreted):**
  - Iterates `for (const p of data.prompts)`.
  - For each prompt with `p.prompt` and `p.answer.text`, emits an n8n item:  
    `{"prompt": "...", "answer": "..."}`
  - Returns `{ prompts: output }` (note: this is an object containing an array of items, not a standard `return output;` pattern).
- **Inputs / Outputs:**
  - **Input:** SE Ranking API response
  - **Output:** To **Merge Responses** input index 1
- **Important implementation note:**  
  In n8n Code nodes, the typical return is an **array of items**. Returning an object like `{ prompts: output }` can work depending on node runtime expectations/version, but often results in a single item with a `prompts` field rather than multiple items. Here it appears intentional because the downstream merge is by position and expects one item per branch.
- **Edge cases / failures:**
  - If `data.prompts` is undefined, the loop will throw. (Unlike the links extractor, there is no default `[]`.)
  - If `p.answer.text` is not a string, `.trim()` may throw.
- **Version notes:** TypeVersion 2.

#### Node: Extract JSON
- **Type / Role:** Code (`n8n-nodes-base.code`) — passes through the raw prompts array under a new key.
- **Key logic (interpreted):**
  - Reads `$input.first().json.prompts`
  - Returns `{ prompts_with_links: data }`
- **Inputs / Outputs:**
  - **Input:** SE Ranking API response
  - **Output:** To **Merge Responses** input index 2
- **Edge cases / failures:**
  - If `prompts` is missing, output becomes `{prompts_with_links: undefined}`, which may be acceptable but could break consumers expecting an array.
- **Version notes:** TypeVersion 2.

**Sticky note context (applies to this block):**
- “Custom Data Extraction” explains normalization into structured usable data and combination into a unified dataset.

---

### 2.4 Unification & Export

**Overview:**  
Combines the three extracted datasets into one merged JSON object, converts it into binary file content, then writes it to disk.

**Nodes Involved:**
- Merge Responses
- Create a Binary Data
- Write File to Disk

#### Node: Merge Responses
- **Type / Role:** Merge (`n8n-nodes-base.merge`) — combines three separate branches into one item.
- **Configuration choices:**
  - Mode: **Combine**
  - Combine by: **Position** (`combineByPosition`)
  - Number of inputs: **3**
- **Inputs / Outputs:**
  - **Input 0:** from **Extract All Links**
  - **Input 1:** from **Extract Prompts with Answers**
  - **Input 2:** from **Extract JSON**
  - **Output:** to **Create a Binary Data**
- **Edge cases / failures:**
  - If any branch returns **0 items**, combine-by-position can produce empty output or partial merges depending on n8n merge semantics/version.
  - If branches return **different item counts**, only items aligned by index will merge; extras may be dropped.
- **Version notes:** TypeVersion 3.2.

#### Node: Create a Binary Data
- **Type / Role:** Function (`n8n-nodes-base.function`) — converts the merged JSON into a base64 binary payload so it can be written as a file.
- **Key logic (interpreted):**
  - Takes `items[0].json` and creates `items[0].binary.data.data` containing base64-encoded pretty JSON.
  - Uses `new Buffer(...)` (deprecated in modern Node; `Buffer.from(...)` is preferred).
- **Inputs / Outputs:**
  - **Input:** merged item from **Merge Responses**
  - **Output:** to **Write File to Disk**
- **Edge cases / failures:**
  - If there is no item (`items[0]` undefined), it throws.
  - Large payloads may hit memory or execution limits when stringifying.
- **Version notes:** TypeVersion 1; consider updating buffer usage for future compatibility.

#### Node: Write File to Disk
- **Type / Role:** Read/Write File (`n8n-nodes-base.readWriteFile`) — writes the binary JSON to a local path.
- **Configuration choices:**
  - Operation: **write**
  - File name: `C:\\SERanking_ByBrand.json`
  - Data property name: `data` (expects binary property `binary.data`)
- **Inputs / Outputs:**
  - **Input:** item containing binary data from **Create a Binary Data**
  - **Output:** final output (written file result)
- **Edge cases / failures:**
  - Running n8n in Docker or hosted/cloud: `C:\...` may not exist; write will fail.
  - Permissions issues on the target directory.
  - If binary property naming doesn’t match expected (`binary.data`), file node won’t find content.
- **Version notes:** TypeVersion 1.

**Sticky note context (applies to this block):**
- “Export Data Handling” describes exporting the final dataset to JSON for storage and downstream use.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| When clicking ‘Execute workflow’ | Manual Trigger | Manual entry point | — | Set the Input Fields | ## **How It Works**  \nThis workflow analyzes real AI search prompts associated with a specific brand using SE Ranking... (setup/customize instructions) |
| Set the Input Fields | Set | Defines brand/engine/source/sort/pagination parameters | When clicking ‘Execute workflow’ | SE Ranking AI Request by Brand | ## **How It Works**  \nThis workflow analyzes real AI search prompts associated with a specific brand using SE Ranking... (setup/customize instructions) |
| SE Ranking AI Request by Brand | HTTP Request | Fetches prompts/answers/links from SE Ranking AI Search API | Set the Input Fields | Extract All Links; Extract Prompts with Answers; Extract JSON | ## AI Search with SE Ranking by Brand  \nRetrieves real AI search prompts and answers related to a specific brand... |
| Extract All Links | Code | Extracts/normalizes all cited URLs from answers | SE Ranking AI Request by Brand | Merge Responses | ## Custom Data Extraction  \nExtracts brand prompts, answers, and supporting reference links... |
| Extract Prompts with Answers | Code | Extracts prompt and answer text pairs (no links) | SE Ranking AI Request by Brand | Merge Responses | ## Custom Data Extraction  \nExtracts brand prompts, answers, and supporting reference links... |
| Extract JSON | Code | Pass-through of raw prompts objects including links | SE Ranking AI Request by Brand | Merge Responses | ## Custom Data Extraction  \nExtracts brand prompts, answers, and supporting reference links... |
| Merge Responses | Merge | Combines three extraction outputs into one dataset | Extract All Links; Extract Prompts with Answers; Extract JSON | Create a Binary Data | ## Custom Data Extraction  \nExtracts brand prompts, answers, and supporting reference links... |
| Create a Binary Data | Function | Converts merged JSON into base64 binary for file writing | Merge Responses | Write File to Disk | ## Export Data Handling  \nConverts the final dataset into structured JSON output... |
| Write File to Disk | Read/Write File | Writes JSON output to local disk | Create a Binary Data | — | ## Export Data Handling  \nConverts the final dataset into structured JSON output... |
| Sticky Note | Sticky Note | Comment block: Custom Data Extraction | — | — | ## Custom Data Extraction  \nExtracts brand prompts, answers, and supporting reference links... |
| Sticky Note1 | Sticky Note | Comment block: Export Data Handling | — | — | ## Export Data Handling  \nConverts the final dataset into structured JSON output... |
| Sticky Note2 | Sticky Note | Comment block: SE Ranking AI Search by Brand | — | — | ## AI Search with SE Ranking by Brand  \nRetrieves real AI search prompts and answers related to a specific brand... |
| Sticky Note3 | Sticky Note | Comment block: How it works + setup + customization | — | — | ## **How It Works** … (setup/customize instructions) |
| Sticky Note4 | Sticky Note | Branding note + model mention | — | — | ![Logo](https://media.licdn.com/dms/image/v2/D4D0BAQHBbVpuDD3toA/company-logo_200_200/company-logo_200_200/0/1725976307233/se_ranking_logo?e=1768435200&v=beta&t=_HSGZks62sL6rTXwuo0U21QCKBCNzVT_8OkeIPUr4N8)  \nOpenAI GPT-4o-mini for the Structured Data Extraction and Data Mining Purposes |

---

## 4. Reproducing the Workflow from Scratch

1) **Create a new workflow**
- Name it: *Brand Search Intelligence from AI SERPs (SE Ranking + OpenAI GPT 4.1-mini)* (or similar).

2) **Add trigger**
- Add node: **Manual Trigger**
- Name: *When clicking ‘Execute workflow’*

3) **Add parameter node**
- Add node: **Set**
- Name: *Set the Input Fields*
- Add fields (String unless you choose Number for offset/limit):
  - `brand` = `LinkedIn`
  - `engine` = `perplexity`
  - `source` = `us`
  - `sort` = `volume`
  - `sort_order` = `desc`
  - `offset` = `0`
  - `limit` = `10`
  - (Optional/unwired) `multi_keyword_included` = your rule string
  - (Optional/unwired) `multi_keyword_excluded` = your rule string
- Connect: **Manual Trigger → Set**

4) **Configure SE Ranking API credentials**
- Create credential: **HTTP Header Auth**
- Name it: *SE Ranking*
- Put SE Ranking’s required header key/value (commonly something like `Authorization: Bearer <token>` or vendor-specific header). Use the exact requirement from SE Ranking documentation/account.
  - If it is a bearer token, you can still use header auth by setting `Authorization` to `Bearer <token>`.

5) **Add SE Ranking request**
- Add node: **HTTP Request**
- Name: *SE Ranking AI Request by Brand*
- Method: `GET`
- URL: `https://api.seranking.com/v1/ai-search/prompts-by-brand`
- Authentication: **Generic Credential Type → HTTP Header Auth**
- Select credential: **SE Ranking**
- Enable “Send Query Parameters” and add:
  - `brand` = `{{$json.brand}}`
  - `source` = `{{$json.source}}`
  - `engine` = `{{$json.engine}}`
  - `sort` = `{{$json.sort}}`
  - `sort_order` = `{{$json.sort_order}}`
  - `offset` = `{{$json.offset}}`
  - `limit` = `{{$json.limit}}`
- Options:
  - Turn on **Retry on Fail**
  - Redirects: set to **do not follow** (to match the original behavior)
- Connect: **Set the Input Fields → SE Ranking AI Request by Brand**

6) **Add extraction node: links**
- Add node: **Code**
- Name: *Extract All Links*
- Paste JS:
  ```js
  const prompts = $input.first().json.prompts || [];
  const urls = prompts.flatMap(p => p.answer?.links || []);
  const data = urls
    .filter(Boolean)
    .map(u => u.trim())
    .filter(u => u.startsWith("http"));
  return [{ links: data }];
  ```
- Connect: **SE Ranking AI Request by Brand → Extract All Links**

7) **Add extraction node: prompts + answers**
- Add node: **Code**
- Name: *Extract Prompts with Answers*
- Paste JS (keeping the “single merged object” intent):
  ```js
  const output = [];
  const data = $input.first().json;
  for (const p of data.prompts) {
    if (p.prompt && p.answer?.text) {
      output.push({
        json: { prompt: p.prompt.trim(), answer: p.answer.text.trim() }
      });
    }
  }
  return { prompts: output };
  ```
- Connect: **SE Ranking AI Request by Brand → Extract Prompts with Answers**

8) **Add extraction node: raw prompts**
- Add node: **Code**
- Name: *Extract JSON*
- Paste JS:
  ```js
  const data = $input.first().json.prompts;
  return { prompts_with_links: data };
  ```
- Connect: **SE Ranking AI Request by Brand → Extract JSON**

9) **Merge the three branches**
- Add node: **Merge**
- Name: *Merge Responses*
- Mode: **Combine**
- Combine by: **Position**
- Number of Inputs: **3**
- Connect:
  - **Extract All Links → Merge Responses (Input 1 / index 0)**
  - **Extract Prompts with Answers → Merge Responses (Input 2 / index 1)**
  - **Extract JSON → Merge Responses (Input 3 / index 2)**

10) **Convert merged JSON to binary**
- Add node: **Function**
- Name: *Create a Binary Data*
- Function code:
  ```js
  items[0].binary = {
    data: {
      data: new Buffer(JSON.stringify(items[0].json, null, 2)).toString('base64')
    }
  };
  return items;
  ```
  (Optional improvement: replace `new Buffer` with `Buffer.from`.)
- Connect: **Merge Responses → Create a Binary Data**

11) **Write JSON file to disk**
- Add node: **Read/Write File**
- Name: *Write File to Disk*
- Operation: **Write**
- File Name: `C:\SERanking_ByBrand.json` (change to match your runtime)
- Data Property Name: `data`
- Connect: **Create a Binary Data → Write File to Disk**

12) **(Optional) Add sticky notes**
- Add Sticky Notes with the provided texts (branding, block explanations, and setup instructions) for maintainability.

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| SE Ranking logo | https://media.licdn.com/dms/image/v2/D4D0BAQHBbVpuDD3toA/company-logo_200_200/company-logo_200_200/0/1725976307233/se_ranking_logo?e=1768435200&v=beta&t=_HSGZks62sL6rTXwuo0U21QCKBCNzVT_8OkeIPUr4N8 |
| “OpenAI GPT-4o-mini for the Structured Data Extraction and Data Mining Purposes” | Included as a branding/intent note in the workflow; however, **no OpenAI node is present** in this workflow version. If you want summarization/classification, add an OpenAI node after “Merge Responses”. |
| Setup reminders from the workflow note | Ensure SE Ranking header auth is configured; update brand/engine/source/limits; verify file path matches your environment. |