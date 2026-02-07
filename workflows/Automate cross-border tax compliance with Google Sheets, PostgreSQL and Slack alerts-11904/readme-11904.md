Automate cross-border tax compliance with Google Sheets, PostgreSQL and Slack alerts

https://n8nworkflows.xyz/workflows/automate-cross-border-tax-compliance-with-google-sheets--postgresql-and-slack-alerts-11904


# Automate cross-border tax compliance with Google Sheets, PostgreSQL and Slack alerts

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Workflow name:** Cross-Border Revenue Tax Mapping and Compliance Automation  
**Provided title:** Automate cross-border tax compliance with Google Sheets, PostgreSQL and Slack alerts

**Purpose:**  
This workflow runs daily to ingest revenue transactions, validate/normalize them (including currency normalization), determine tax obligations per jurisdiction, compute taxes, detect anomalies/fraud-like patterns, store transactions in PostgreSQL, and generate regional HTML tax reports that are emailed and archived. It also posts Slack alerts for high-risk transactions and produces (intended) compliance metrics and a predictive forecast.

### 1.1 Scheduling & Central Configuration
- Runs at a fixed daily time and centralizes endpoints, thresholds, and destination settings in one config object.

### 1.2 Transaction Ingestion & Itemization
- Pulls transaction data from a Revenue API, then splits bundled arrays into individual items.

### 1.3 Validation & Normalization
- Filters out invalid items, fetches FX rates, converts amounts to USD, and attempts EU VAT validation via VIES.

### 1.4 Tax Obligation Decisioning & Tax Calculation
- Determines whether a transaction triggers a tax obligation based on thresholds and geography; applies jurisdiction tax rates to compute tax/net revenue and assigns region.

### 1.5 Anomaly Detection & High-Risk Routing
- Computes anomaly scores and flags. High-risk items trigger Slack alerts, while lower-risk flow proceeds to storage.

### 1.6 Persistence, Aggregation & Reporting
- Inserts transactions into PostgreSQL; aggregates/grouping is used to generate regional HTML reports; emails and Google Drive archiving are performed.

### 1.7 Historical Trends & Forecasting (Intended)
- Pulls 12 months of historical data from PostgreSQL, merges with current metrics, and generates a forecast. (As implemented, this block has data-shape issues and does not correctly integrate with the reporting path.)

---

## 2. Block-by-Block Analysis

### Block 1 — Scheduling & Configuration

**Overview:** Triggers daily processing and defines reusable configuration variables (API URLs, thresholds, destinations, table names).  
**Nodes involved:** Daily Tax Processing Schedule, Workflow Configuration

#### Node: Daily Tax Processing Schedule
- **Type / role:** `Schedule Trigger` — workflow entry point.
- **Config:** Runs daily at **02:00** (server time).
- **Outputs:** To **Workflow Configuration**.
- **Edge cases/failures:** Timezone assumptions (n8n instance timezone); missed runs if instance is down.

#### Node: Workflow Configuration
- **Type / role:** `Set` — creates a config “document” available by expression reference (`$('Workflow Configuration').first().json`).
- **Key config fields:**
  - `revenueApiUrl` (placeholder)
  - `taxConsultantEmail` (placeholder)
  - `auditFolderId` (placeholder)
  - `vatThreshold` = 10000
  - `salesTaxThreshold` = 5000
  - `exchangeRateApiUrl` = `https://api.exchangerate-api.com/v4/latest/USD`
  - `viesApiUrl` template (not actually used by VIES node)
  - `slackChannel` (placeholder)
  - `highRiskThreshold` = 50000
  - `anomalyDetectionWindow` = 30 (not used later)
  - `postgresTable` = `tax_transactions`
- **Outputs:**
  - To **Fetch Revenue Transactions**
  - To **Retrieve Historical Tax Data**
- **Important mismatch (edge case):**
  - Later code expects `euVatThreshold`, `usSalesTaxThreshold`, `gstThreshold`, but config defines `vatThreshold` and `salesTaxThreshold` only. This will cause defaults to be used in code (and thresholds may not match intent).

---

### Block 2 — Transaction Ingestion & Split

**Overview:** Pulls transaction payloads from an API and splits a transaction array into individual items for downstream per-transaction processing.  
**Nodes involved:** Fetch Revenue Transactions, Split Transactions for Processing, Extract Transaction Data

#### Node: Fetch Revenue Transactions
- **Type / role:** `HTTP Request` — retrieves transactions from the configured Revenue API.
- **Config:**
  - URL: `{{ $('Workflow Configuration').first().json.revenueApiUrl }}`
  - Sends header `Content-Type: application/json`
- **Outputs:**
  - Directly to **Extract Transaction Data**
  - Also to **Split Transactions for Processing**
- **Edge cases/failures:**
  - Placeholder URL → runtime failure until configured.
  - Auth not implemented (no auth headers/tokens configured).
  - Response shape uncertainty: workflow assumes either items already represent transactions *or* a `transactions` array exists.

#### Node: Split Transactions for Processing
- **Type / role:** `Split Out` — splits an array field into multiple items.
- **Config:** `fieldToSplitOut: transactions`
- **Input:** From **Fetch Revenue Transactions**
- **Output:** To **Extract Transaction Data**
- **Edge cases/failures:**
  - If the API response doesn’t include `transactions` as an array, this node outputs no items or errors.
  - If Fetch Revenue Transactions already returns one item per transaction, this node is redundant and may be incorrect.

#### Node: Extract Transaction Data
- **Type / role:** `Set` — maps raw fields into a normalized schema used by later nodes.
- **Config mappings:**
  - `transactionId = $json.id`
  - `country = $json.country`
  - `revenue = $json.amount`
  - `currency = $json.currency`
  - `transactionDate = $json.date`
  - `customerType = $json.customer_type`
  - `includeOtherFields: true`
- **Outputs:**
  - To **Filter Valid Transactions**
  - To **Identify Tax Obligations by Country**
- **Edge cases/failures:**
  - Missing `id/country/amount/currency/date` will break later assumptions.
  - Branching here means tax logic can run *before* validation/normalization, but later the VIES node loops back into tax logic again (see Block 3).

---

### Block 3 — Validation & Normalization

**Overview:** Removes invalid items, fetches exchange rates, converts to USD, and attempts VAT validation via VIES before re-entering tax obligation logic.  
**Nodes involved:** Filter Valid Transactions, Fetch Exchange Rates, Normalize Currency to USD, Validate VAT Numbers via VIES

#### Node: Filter Valid Transactions
- **Type / role:** `Filter` — basic data integrity gate.
- **Conditions (AND):**
  - `country` is not empty
  - `revenue` > 0
  - `transactionId` is not empty
- **Output:** To **Fetch Exchange Rates**
- **Edge cases/failures:**
  - Transactions with refunds/negative revenue are excluded (may be undesirable).
  - If `revenue` is a string, loose validation may pass/fail unexpectedly.

#### Node: Fetch Exchange Rates
- **Type / role:** `HTTP Request` — gets USD base FX rates.
- **Config:**
  - URL from config: `exchangeRateApiUrl`
  - Response format: JSON
- **Output:** To **Normalize Currency to USD**
- **Edge cases/failures:**
  - Rate API outages, quotas, or format changes (`rates` missing).
  - Currency codes in transactions not present in returned rates.

#### Node: Normalize Currency to USD
- **Type / role:** `Code` (run once per item) — converts `revenue` to `revenueUSD`.
- **Key logic:**
  - Reads rates from `$('Fetch Exchange Rates').first().json.rates`
  - If currency != USD, computes `revenueUSD = revenue / rates[currency]`
- **Output:** To **Validate VAT Numbers via VIES**
- **Edge cases/failures:**
  - The conversion formula assumes the API returns “1 USD = X currency”. If the API’s rates semantics differ, conversion will be wrong.
  - If rate missing, it logs a warning and keeps original value.
  - `console.log` visible only in execution logs.

#### Node: Validate VAT Numbers via VIES
- **Type / role:** `HTTP Request` — attempts VAT number validation against EU VIES.
- **Config:**
  - URL hardcoded with expressions:
    - `https://ec.europa.eu/taxation_customs/vies/rest-api/ms/{{ $json.country }}/vat/{{ $json.vatNumber }}`
  - `neverError: true` (won’t throw on HTTP errors)
  - Response format: JSON
- **Output:** To **Identify Tax Obligations by Country**
- **Major edge cases/design issues:**
  - `vatNumber` is never set anywhere upstream, so the URL will usually contain `undefined` → invalid calls.
  - VIES should only be called for EU countries and for B2B VAT validation; currently it runs for all items.
  - Output of this node is VIES response JSON, not the original transaction (unless VIES returns/echoes it). This can overwrite the transaction shape and break downstream nodes.

---

### Block 4 — Tax Obligation Decisioning & Tax Calculation

**Overview:** Determines whether each transaction triggers a tax obligation (VAT/SalesTax/GST) and applies jurisdiction tax rates to compute tax/net revenue and region.  
**Nodes involved:** Identify Tax Obligations by Country, Apply Tax Rules by Jurisdiction

#### Node: Identify Tax Obligations by Country
- **Type / role:** `Code` (run once per item) — sets `taxObligation`, `taxType`, `jurisdiction`.
- **Key inputs:**
  - `country`, `revenue`
  - Reads config from `$('Workflow Configuration').first().json`
- **Threshold variables used in code:**
  - `euVatThreshold` default 10000
  - `usSalesTaxThreshold` default 100000
  - `gstThreshold` default 75000
- **Output:** To **Apply Tax Rules by Jurisdiction**
- **Edge cases/failures:**
  - Config mismatch: workflow config defines `vatThreshold` and `salesTaxThreshold` but code uses different names → defaults used silently.
  - US “states” list includes `US`, but `jurisdiction` is set to `country` and later tax rates expect some `US-CA` style keys; these won’t match unless `country` already arrives in that format.

#### Node: Apply Tax Rules by Jurisdiction
- **Type / role:** `Code` (run once per item) — computes `taxRate`, `taxAmount`, `netRevenue`, `region`.
- **Key logic:**
  - Looks up tax rates by `jurisdiction = item.jurisdiction || item.country || item.countryCode`
  - If not found → rate 0, region `Other`
  - `taxAmount = revenue * taxRate`, `netRevenue = revenue - taxAmount`
- **Outputs:**
  - To **Group Transactions by Region**
  - To **Detect Anomalies and Fraud Patterns**
- **Edge cases/failures:**
  - Tax is computed on `revenue` (original currency amount), not `revenueUSD`. If multi-currency reporting is intended, this is inconsistent.
  - `taxObligation` is not used to decide whether to compute tax; taxes are computed even when obligation is false.
  - Jurisdiction mapping gaps: many countries not present → 0 tax rate.

---

### Block 5 — Anomaly Detection & High-Risk Routing

**Overview:** Scores each transaction for anomalies and routes high-risk transactions to Slack alerting before storage.  
**Nodes involved:** Detect Anomalies and Fraud Patterns, Check High-Risk Transactions, Alert Finance Team on High-Risk

#### Node: Detect Anomalies and Fraud Patterns
- **Type / role:** `Code` (run once per item) — assigns `anomalyScore`, `anomalyFlags`, `riskLevel`.
- **Key logic highlights:**
  - Uses `$input.all()` to compute average/stddev and detect outliers/duplicates/country rarity/time-of-day/weekend/round numbers.
  - Caps anomaly score at 100 and maps to risk levels (Low/Medium/High).
- **Output:** To **Check High-Risk Transactions**
- **Edge cases/failures:**
  - In “runOnceForEachItem”, `$input.all()` is the full incoming set **to that node**, but because items arrive one-by-one in typical flows, the “all items” set may be smaller than expected depending on execution and node behavior.
  - If stddev is 0, z-score becomes `Infinity` (division by zero) → will flag as spike.
  - Uses placeholder high-risk country codes `['XX','YY','ZZ']`.

#### Node: Check High-Risk Transactions
- **Type / role:** `IF` — routes high-risk items.
- **Conditions (OR):**
  - `riskLevel == "High"`
  - `anomalyScore > 70`
  - `revenueUSD > highRiskThreshold` from config
- **Outputs:**
  - **true** → Alert Finance Team on High-Risk
  - **false** → Store Transactions in Database
- **Edge cases/failures:**
  - `revenueUSD` may be missing if normalization path didn’t run (because of alternate branching earlier).
  - Numeric comparisons use strings in some rightValues (`"70"`)—n8n usually coerces, but can be brittle.

#### Node: Alert Finance Team on High-Risk
- **Type / role:** `Slack` — sends alert message to a channel.
- **Config:**
  - OAuth2 Slack auth
  - Channel ID from config `slackChannel`
  - Message includes transaction fields and anomaly flags
- **Output:** To **Store Transactions in Database** (high-risk still stored)
- **Edge cases/failures:**
  - Slack OAuth scopes missing (`chat:write`).
  - Message template uses `Revenue (USD): ${{ $json.revenue }}` but should likely use `revenueUSD`.
  - `anomalyFlags` is an array; rendering in Slack may appear as comma-separated or `[object Object]` depending on how Slack node formats.

---

### Block 6 — Persistence, Aggregation, Metrics & Reporting

**Overview:** Stores transactions in PostgreSQL, aggregates them, generates HTML reports per region, emails them to consultants, and archives them to Google Drive. Also attempts compliance metrics summarization.  
**Nodes involved:** Store Transactions in Database, Group Transactions by Region, Calculate Compliance Metrics, Generate Regional Tax Reports, Send Reports to Tax Consultants, Archive Evidence to Google Drive

#### Node: Store Transactions in Database
- **Type / role:** `Postgres` — inserts transaction record.
- **Config:**
  - Table name from config: `postgresTable`
  - Schema: `public`
  - Mapping mode: define columns below (explicit column mapping)
  - Writes fields including: `region,country,revenue,taxRate,taxType,currency,createdAt,riskLevel,taxAmount,netRevenue,revenueUSD,anomalyScore,customerType,jurisdiction,taxObligation,transactionId,transactionDate`
- **Output:** To **Group Transactions by Region**
- **Edge cases/failures:**
  - Table schema must exist and column names must match exactly (snake_case vs camelCase mismatch risk). The historical query uses `transaction_date` and `tax_amount` while inserts use `transactionDate` and `taxAmount`.
  - `createdAt` uses `$now` (ISO string); DB column type must accept it (timestamp).
  - Upsert/dedup not implemented; duplicates possible.

#### Node: Group Transactions by Region
- **Type / role:** `Aggregate` — configured to “aggregate all item data” into a `transactions` field.
- **Config:** `aggregateAllItemData` → destination `transactions`
- **Outputs:**
  - To **Generate Regional Tax Reports**
  - To **Calculate Compliance Metrics**
- **Edge cases/failures:**
  - This produces a single item containing `transactions: [ ... ]`. Downstream **Generate Regional Tax Reports** expects individual items with `region` fields and iterates `$input.all()`, which will likely be just one aggregated item rather than per-transaction items. Report logic and aggregate node are not aligned.

#### Node: Calculate Compliance Metrics
- **Type / role:** `Summarize` — summarizes by region.
- **Config:**
  - Split by: `region`
  - Summaries:
    - `totalRevenue` sum
    - `totalTax` sum
    - `transactions` (no aggregation specified in JSON for this entry)
    - `taxRate` average
- **Output:** To **Merge Historical Trends**
- **Edge cases/failures:**
  - Upstream data likely has `revenue` and `taxAmount`, not `totalRevenue`/`totalTax`, so sums may be 0/undefined.
  - If fed aggregated structure instead of raw items, summarize results won’t reflect transactions.

#### Node: Generate Regional Tax Reports
- **Type / role:** `Code` — builds per-region HTML reports with a jurisdiction breakdown.
- **Key logic:**
  - Iterates `$input.all()` and expects each item is a transaction with `region/jurisdiction/revenue/taxAmount`.
  - Builds `reports[]`, each with `json: { region, reportHtml, reportDate, summary }`
- **Outputs:**
  - To **Send Reports to Tax Consultants**
  - To **Archive Evidence to Google Drive**
- **Edge cases/failures:**
  - If input is the aggregated item (with `transactions` array), it won’t process individual transactions unless adapted.
  - Uses `$` currency formatting regardless of original currency and regardless of USD conversion.

#### Node: Send Reports to Tax Consultants
- **Type / role:** `Gmail` — sends email with HTML report body.
- **Config:**
  - To: `taxConsultantEmail` from config
  - Subject: `Cross-Border Tax Report - {{region}} - {{reportDate}}`
  - Message: `{{ $json.reportHtml }}`
- **Credentials:** Gmail OAuth2 required.
- **Edge cases/failures:**
  - Email body may need explicit “HTML mode” depending on node settings; otherwise HTML may be sent as text.
  - Consultant email placeholder must be replaced.

#### Node: Archive Evidence to Google Drive
- **Type / role:** `Google Drive` — uploads the report HTML as a file.
- **Config:**
  - Filename: `Tax_Report_{region}_{reportDate}.html`
  - Folder ID from config `auditFolderId`
- **Credentials:** Google Drive OAuth2 required.
- **Edge cases/failures:**
  - Node as shown does not explicitly set file content/binary; depending on operation defaults, it may create a file without content unless configured to upload data.
  - Folder ID placeholder must be replaced; permission issues common.

---

### Block 7 — Historical Data, Merging & Forecasting (Intended)

**Overview:** Pulls 12 months historical tax data, merges it with current metrics, and attempts a predictive forecast. As implemented, the data mapping between nodes is inconsistent.  
**Nodes involved:** Retrieve Historical Tax Data, Merge Historical Trends, Generate Predictive Tax Forecast

#### Node: Retrieve Historical Tax Data
- **Type / role:** `Postgres` (executeQuery) — returns monthly grouped stats for last 12 months.
- **Query outputs columns:** `region, jurisdiction, month, transaction_count, total_revenue, total_tax_collected`
- **Output:** To **Merge Historical Trends**
- **Edge cases/failures:**
  - Table/column names in query are `transaction_date`, `tax_amount`, but insert node writes `transactionDate`, `taxAmount` (likely mismatch unless DB uses triggers/views or you manually aligned schema).
  - Requires PostgreSQL date types; if stored as text, `DATE_TRUNC` may fail.

#### Node: Merge Historical Trends
- **Type / role:** `Set` — attempts to combine historical and current metrics into one item.
- **Config:**
  - `historicalData = $('Retrieve Historical Tax Data').item.json`
  - `currentMetrics = $('Calculate Compliance Metrics').item.json`
  - `comparisonPeriod = "12 months"`
- **Output:** To **Generate Predictive Tax Forecast**
- **Edge cases/failures:**
  - Uses `.item.json` which is not standard in n8n expressions (normally `.first()`, `.all()`, or item linking). This may fail at runtime.
  - Merges are not keyed by region; only single items referenced.

#### Node: Generate Predictive Tax Forecast
- **Type / role:** `Code` — generates region-level forecast and threshold warnings.
- **Output:** To **Generate Regional Tax Reports**
- **Major logic/data-shape issues:**
  - Code tries: `items.find(item => item.json.historicalTrends)` and `items.find(item => item.json.summary)` but **Merge Historical Trends** produces `historicalData/currentMetrics`, not `historicalTrends/summary`.
  - Then it iterates `for (const item of items) { const region = item.json.region; const summary = item.json.summary || {}; }` but items may not contain `region` nor `summary`.
  - It sends output to **Generate Regional Tax Reports**, which expects transaction-like items; forecast output is region-level summary objects. This mixes concerns and will break report formatting unless adapted.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Daily Tax Processing Schedule | Schedule Trigger | Daily workflow entry point | — | Workflow Configuration | ## How It Works … (end-to-end daily processing description) |
| Workflow Configuration | Set | Central config variables & thresholds | Daily Tax Processing Schedule | Fetch Revenue Transactions; Retrieve Historical Tax Data | ## How It Works … (end-to-end daily processing description) |
| Fetch Revenue Transactions | HTTP Request | Pull transactions from revenue API | Workflow Configuration | Extract Transaction Data; Split Transactions for Processing | ## Fetch & Prepare Transactions … centralized daily revenue data |
| Split Transactions for Processing | Split Out | Split `transactions[]` into items | Fetch Revenue Transactions | Extract Transaction Data | ## Fetch & Prepare Transactions … centralized daily revenue data |
| Extract Transaction Data | Set | Normalize transaction fields | Fetch Revenue Transactions; Split Transactions for Processing | Identify Tax Obligations by Country; Filter Valid Transactions | ## Fetch & Prepare Transactions … centralized daily revenue data |
| Filter Valid Transactions | Filter | Data integrity gate | Extract Transaction Data | Fetch Exchange Rates | ## Validate & Normalize Data … integrity & consistency |
| Fetch Exchange Rates | HTTP Request | Retrieve FX rates for conversion | Filter Valid Transactions | Normalize Currency to USD | ## Validate & Normalize Data … integrity & consistency |
| Normalize Currency to USD | Code | Add `revenueUSD` based on FX rates | Fetch Exchange Rates | Validate VAT Numbers via VIES | ## Validate & Normalize Data … integrity & consistency |
| Validate VAT Numbers via VIES | HTTP Request | Validate EU VAT numbers | Normalize Currency to USD | Identify Tax Obligations by Country | ## Apply Tax Rules & Detect Anomalies … compute taxes & flag irregularities |
| Identify Tax Obligations by Country | Code | Set tax obligation/type/jurisdiction | Extract Transaction Data; Validate VAT Numbers via VIES | Apply Tax Rules by Jurisdiction | ## Apply Tax Rules & Detect Anomalies … compute taxes & flag irregularities |
| Apply Tax Rules by Jurisdiction | Code | Compute tax rate/amount/net & region | Identify Tax Obligations by Country | Group Transactions by Region; Detect Anomalies and Fraud Patterns | ## Apply Tax Rules & Detect Anomalies … compute taxes & flag irregularities |
| Detect Anomalies and Fraud Patterns | Code | Compute anomaly score/flags/risk | Apply Tax Rules by Jurisdiction | Check High-Risk Transactions | ## Apply Tax Rules & Detect Anomalies … compute taxes & flag irregularities |
| Check High-Risk Transactions | IF | Route high-risk vs normal | Detect Anomalies and Fraud Patterns | (true) Alert Finance Team on High-Risk; (false) Store Transactions in Database | ## Apply Tax Rules & Detect Anomalies … compute taxes & flag irregularities |
| Alert Finance Team on High-Risk | Slack | Notify finance team in Slack | Check High-Risk Transactions (true) | Store Transactions in Database | ## Apply Tax Rules & Detect Anomalies … compute taxes & flag irregularities |
| Store Transactions in Database | Postgres | Persist transactions | Check High-Risk Transactions (false); Alert Finance Team on High-Risk | Group Transactions by Region | ## Generate & Send Reports … create compliance files & email |
| Group Transactions by Region | Aggregate | Aggregate items into `transactions` | Store Transactions in Database; Apply Tax Rules by Jurisdiction | Generate Regional Tax Reports; Calculate Compliance Metrics | ## Generate & Send Reports … create compliance files & email |
| Generate Regional Tax Reports | Code | Build HTML reports per region | Group Transactions by Region; Generate Predictive Tax Forecast | Send Reports to Tax Consultants; Archive Evidence to Google Drive | ## Generate & Send Reports … create compliance files & email |
| Send Reports to Tax Consultants | Gmail | Email reports | Generate Regional Tax Reports | — | ## Generate & Send Reports … create compliance files & email |
| Archive Evidence to Google Drive | Google Drive | Archive report files | Generate Regional Tax Reports | — | ## Generate & Send Reports … create compliance files & email |
| Retrieve Historical Tax Data | Postgres (executeQuery) | Pull 12-month trends | Workflow Configuration | Merge Historical Trends | ## Setup Steps … connect sources, configure rules, set Gmail/Drive, activate schedule |
| Calculate Compliance Metrics | Summarize | Summarize metrics by region | Group Transactions by Region | Merge Historical Trends | ## Setup Steps … connect sources, configure rules, set Gmail/Drive, activate schedule |
| Merge Historical Trends | Set | Combine historical + current metrics | Retrieve Historical Tax Data; Calculate Compliance Metrics | Generate Predictive Tax Forecast | ## Setup Steps … connect sources, configure rules, set Gmail/Drive, activate schedule |
| Generate Predictive Tax Forecast | Code | Forecast obligations/threshold warnings | Merge Historical Trends | Generate Regional Tax Reports | ## Setup Steps … connect sources, configure rules, set Gmail/Drive, activate schedule |
| Sticky Note1 | Sticky Note | Notes: prerequisites/use cases/customization/benefits | — | — | ## Prerequisites … (full note content) |
| Sticky Note2 | Sticky Note | Notes: setup steps | — | — | ## Setup Steps … (full note content) |
| Sticky Note3 | Sticky Note | Notes: how it works | — | — | ## How It Works … (full note content) |
| Sticky Note4 | Sticky Note | Notes: reporting block | — | — | ## Generate & Send Reports … (full note content) |
| Sticky Note5 | Sticky Note | Notes: tax rules & anomalies block | — | — | ## Apply Tax Rules & Detect Anomalies … (full note content) |
| Sticky Note6 | Sticky Note | Notes: validation/normalization block | — | — | ## Validate & Normalize Data … (full note content) |
| Sticky Note7 | Sticky Note | Notes: fetching block | — | — | ## Fetch & Prepare Transactions … (full note content) |

---

## 4. Reproducing the Workflow from Scratch

1. **Create a new workflow**
   - Name: *Cross-Border Revenue Tax Mapping and Compliance Automation*
   - Set workflow to inactive until credentials and placeholders are configured.

2. **Add trigger**
   - Node: **Schedule Trigger**
   - Set to run daily at **02:00**.

3. **Add configuration node**
   - Node: **Set** → name it **Workflow Configuration**
   - Add fields (as values you will replace):
     - `revenueApiUrl` (string)
     - `taxConsultantEmail` (string)
     - `auditFolderId` (string)
     - `vatThreshold` (number, e.g. 10000)
     - `salesTaxThreshold` (number, e.g. 5000)
     - `exchangeRateApiUrl` (string, default provided)
     - `viesApiUrl` (string template optional)
     - `slackChannel` (string)
     - `highRiskThreshold` (number, e.g. 50000)
     - `anomalyDetectionWindow` (number, optional)
     - `postgresTable` (string, e.g. `tax_transactions`)
   - Connect: **Schedule Trigger → Workflow Configuration**

4. **Add revenue ingestion**
   - Node: **HTTP Request** → name **Fetch Revenue Transactions**
   - URL: `{{ $('Workflow Configuration').first().json.revenueApiUrl }}`
   - Add header `Content-Type: application/json`
   - Connect: **Workflow Configuration → Fetch Revenue Transactions**

5. **(If API returns `{ transactions: [...] }`) add split**
   - Node: **Split Out** → name **Split Transactions for Processing**
   - Field to split: `transactions`
   - Connect: **Fetch Revenue Transactions → Split Transactions for Processing**
   - If your API already returns one item per transaction, skip this node and connect Fetch directly to Extract.

6. **Add transaction normalization**
   - Node: **Set** → name **Extract Transaction Data**
   - Map fields:
     - `transactionId = {{$json.id}}`
     - `country = {{$json.country}}`
     - `revenue = {{$json.amount}}`
     - `currency = {{$json.currency}}`
     - `transactionDate = {{$json.date}}`
     - `customerType = {{$json.customer_type}}`
   - Enable “include other fields”.
   - Connect:
     - **Split Transactions for Processing → Extract Transaction Data**
     - (Optionally) **Fetch Revenue Transactions → Extract Transaction Data** if you keep both paths.

7. **Add validation gate**
   - Node: **Filter** → name **Filter Valid Transactions**
   - Conditions (AND):
     - `country` not empty
     - `revenue` > 0
     - `transactionId` not empty
   - Connect: **Extract Transaction Data → Filter Valid Transactions**

8. **Add FX lookup**
   - Node: **HTTP Request** → name **Fetch Exchange Rates**
   - URL: `{{ $('Workflow Configuration').first().json.exchangeRateApiUrl }}`
   - Response format: JSON
   - Connect: **Filter Valid Transactions → Fetch Exchange Rates**

9. **Add USD normalization**
   - Node: **Code** → name **Normalize Currency to USD**
   - Implement logic to read `rates` from **Fetch Exchange Rates** and add `revenueUSD`.
   - Connect: **Fetch Exchange Rates → Normalize Currency to USD**

10. **Add VIES validation (only if you truly have VAT numbers)**
    - Node: **HTTP Request** → name **Validate VAT Numbers via VIES**
    - URL: `https://ec.europa.eu/taxation_customs/vies/rest-api/ms/{{ $json.country }}/vat/{{ $json.vatNumber }}`
    - Set: response format JSON, enable “Never error”.
    - Connect: **Normalize Currency to USD → Validate VAT Numbers via VIES**
    - Important: ensure upstream sets `vatNumber`, and preserve original transaction data (e.g., merge VIES response rather than replacing it).

11. **Add tax obligation logic**
    - Node: **Code** → name **Identify Tax Obligations by Country**
    - Use configuration thresholds and set:
      - `taxObligation`, `taxType`, `jurisdiction`
    - Connect:
      - **Extract Transaction Data → Identify Tax Obligations by Country** (as in JSON)
      - **Validate VAT Numbers via VIES → Identify Tax Obligations by Country**

12. **Add tax calculation**
    - Node: **Code** → name **Apply Tax Rules by Jurisdiction**
    - Maintain a jurisdiction → {rate, region} mapping and compute:
      - `taxRate`, `taxAmount`, `netRevenue`, `region`
    - Connect: **Identify Tax Obligations by Country → Apply Tax Rules by Jurisdiction**

13. **Add anomaly detection**
    - Node: **Code** → name **Detect Anomalies and Fraud Patterns**
    - Compute `anomalyScore`, `anomalyFlags`, `riskLevel`.
    - Connect: **Apply Tax Rules by Jurisdiction → Detect Anomalies and Fraud Patterns**

14. **Add high-risk router**
    - Node: **IF** → name **Check High-Risk Transactions**
    - Conditions (OR):
      - `riskLevel == High`
      - `anomalyScore > 70`
      - `revenueUSD > {{ $('Workflow Configuration').first().json.highRiskThreshold }}`
    - Connect: **Detect Anomalies and Fraud Patterns → Check High-Risk Transactions**

15. **Add Slack alert**
    - Node: **Slack** → name **Alert Finance Team on High-Risk**
    - Auth: Slack OAuth2 credentials (scope `chat:write`)
    - Channel ID: `{{ $('Workflow Configuration').first().json.slackChannel }}`
    - Message: include transaction details and anomaly flags.
    - Connect: **Check High-Risk Transactions (true) → Alert Finance Team on High-Risk**

16. **Add PostgreSQL insert**
    - Node: **Postgres** → name **Store Transactions in Database**
    - Credentials: PostgreSQL connection
    - Operation: insert (or “Insert” via table mapping)
    - Table: `{{ $('Workflow Configuration').first().json.postgresTable }}`
    - Map columns to your DB schema (ensure names/types match).
    - Connect:
      - **Check High-Risk Transactions (false) → Store Transactions in Database**
      - **Alert Finance Team on High-Risk → Store Transactions in Database**

17. **Add aggregation & reporting**
    - Node: **Aggregate** → name **Group Transactions by Region**
    - If you keep it as in JSON: aggregate all item data into `transactions`.
    - Connect: **Store Transactions in Database → Group Transactions by Region**
    - Node: **Code** → name **Generate Regional Tax Reports**
    - Build HTML reports and output one item per region with `reportHtml`.
    - Connect: **Group Transactions by Region → Generate Regional Tax Reports**

18. **Add email delivery**
    - Node: **Gmail** → name **Send Reports to Tax Consultants**
    - Credentials: Gmail OAuth2
    - To: `{{ $('Workflow Configuration').first().json.taxConsultantEmail }}`
    - Subject and message from report fields.
    - Connect: **Generate Regional Tax Reports → Send Reports to Tax Consultants**

19. **Add Drive archiving**
    - Node: **Google Drive** → name **Archive Evidence to Google Drive**
    - Credentials: Google Drive OAuth2
    - Folder ID: `{{ $('Workflow Configuration').first().json.auditFolderId }}`
    - File name: `Tax_Report_{{ $json.region }}_{{ $json.reportDate }}.html`
    - Ensure you configure the node to upload the HTML content (not just name).
    - Connect: **Generate Regional Tax Reports → Archive Evidence to Google Drive**

20. **Add historical trends & forecast (optional, requires fixes)**
    - Node: **Postgres** executeQuery → **Retrieve Historical Tax Data**
    - Connect: **Workflow Configuration → Retrieve Historical Tax Data**
    - Node: **Summarize** → **Calculate Compliance Metrics** (must summarize correct fields such as `revenue` and `taxAmount`)
    - Node: **Set** → **Merge Historical Trends** (merge arrays properly using `.all()` or merge node)
    - Node: **Code** → **Generate Predictive Tax Forecast**
    - Only connect forecast outputs to reporting if the report generator supports forecast objects; otherwise send forecast to a separate email/Drive file.

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| **Prerequisites**: Accounts and API credentials for Google Sheets, Gmail, Drive; access to transaction database; tax rule configuration. | Sticky note “Prerequisites” |
| **Use Cases**: Daily financial reconciliation, automated tax calculation, anomaly detection in revenue streams. | Sticky note “Prerequisites” |
| **Customization**: Adjust connectors, validation rules, and tax logic to match local regulations or additional data sources. | Sticky note “Prerequisites” |
| **Benefits**: Reduces manual effort, improves accuracy, ensures timely compliance, and enables proactive anomaly detection. | Sticky note “Prerequisites” |
| **Setup Steps**: 1) Connect Google Sheets/SQL for transactions 2) Configure tax rules 3) Set Gmail/Drive 4) Activate schedule | Sticky note “Setup Steps” |
| **How It Works**: End-to-end daily processing description for accountants/analysts, including validation, “AI-driven” assessment, and report generation. | Sticky note “How It Works” |
| **Generate & Send Reports**: Create compliance files and email to authorities; reduces manual intervention. | Sticky note “Generate & Send Reports” |
| **Apply Tax Rules & Detect Anomalies**: Compute taxes and flag irregularities; ensures compliance and prevents errors. | Sticky note “Apply Tax Rules & Detect Anomalies” |
| **Validate & Normalize Data**: Filter invalid transactions and standardize formats; maintains integrity and consistency. | Sticky note “Validate & Normalize Data” |
| **Fetch & Prepare Transactions**: Collect daily revenue data from multiple sources; centralizes transactions. | Sticky note “Fetch & Prepare Transactions” |