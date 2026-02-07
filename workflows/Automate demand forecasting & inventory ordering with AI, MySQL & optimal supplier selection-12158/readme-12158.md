Automate demand forecasting & inventory ordering with AI, MySQL & optimal supplier selection

https://n8nworkflows.xyz/workflows/automate-demand-forecasting---inventory-ordering-with-ai--mysql---optimal-supplier-selection-12158


# Automate demand forecasting & inventory ordering with AI, MySQL & optimal supplier selection

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Purpose:** Automate inventory replenishment by (1) collecting sales + external signals, (2) generating AI-based 7‑day demand forecasts, (3) computing shortages and order quantities, (4) requesting supplier quotes and selecting the best option, then (5) placing orders, updating inventory, logging to MySQL, and alerting Slack on anomalies.

**Target use cases:**
- Retail/CPG replenishment automation using POS + ERP/inventory + external demand drivers (weather, social trends).
- Multi-supplier procurement optimization (cost + lead time constraints).
- Human-in-the-loop escalation for low-confidence AI predictions.

### 1.1 Scheduling / Entry Point
Runs on a schedule trigger and initiates the end-to-end flow.

### 1.2 Data Collection
Collects POS sales, historical sales (MySQL), weather forecast, social trend metrics, and current inventory.

### 1.3 Prediction & Order Logic
Builds a feature dataset, calls an AI forecast API (7-day horizon), calculates shortage vs. stock + on-order + safety stock, then computes final order quantities (lot-size rounding).

### 1.4 Supplier Quote & Optimization
Splits per product, obtains quotes from three suppliers, merges quote data, and selects the best supplier based on lowest total cost while meeting lead-time constraints.

### 1.5 Execution, Logging & Alerting
Places the order, updates inventory system (on-order), logs the run to MySQL, and posts a Slack alert when AI confidence is too low.

---

## 2. Block-by-Block Analysis

### Block 1 — Scheduling / Entry Point

**Overview:** Starts the workflow on a timed interval.  
**Nodes involved:** `Run Daily at 03:00`

#### Node: Run Daily at 03:00
- **Type / role:** Schedule Trigger — initiates executions on a recurring schedule.
- **Configuration (interpreted):**
  - The node name suggests “Daily at 03:00”, but the actual rule is **every 3 hours** (`hoursInterval: 3`).
- **Outputs:** Connected to `Fetch POS Data`.
- **Version notes:** `typeVersion: 1.2` (newer schedule trigger UI/fields; rule format must match this version).
- **Edge cases / failures:**
  - Misconfigured schedule vs. expectation (daily vs. every 3 hours) can cause over-ordering and excessive API calls.
  - Timezone: runs in n8n instance timezone; can shift relative to business timezone.

---

### Block 2 — Data Collection

**Overview:** Pulls required inputs for forecasting: POS sales, historical sales, weather, social trends, and current inventory.  
**Nodes involved:** `Fetch POS Data`, `Fetch Historical Sales`, `Fetch Weather Forecast`, `Fetch SNS Trends`, `Fetch Inventory Master`, `Merge Data 1`, `Merge Data 2`

#### Node: Fetch POS Data
- **Type / role:** HTTP Request — fetch recent sales transactions from POS API.
- **Configuration:**
  - `GET https://pos-api.example.com/sales`
  - Query params:
    - `from = {{$now.minus(3, 'days').format('yyyy-MM-dd')}}`
    - `to = {{$now.format('yyyy-MM-dd')}}`
- **Output:** To `Fetch Historical Sales`.
- **Edge cases:**
  - Auth not configured (node shows no auth method); likely needs header/token.
  - Date window mismatch: collects last 3 days, but forecasting horizon is 7 days; may be insufficient unless historical sales provides longer horizon.
  - API pagination/rate limits not handled.

#### Node: Fetch Historical Sales
- **Type / role:** MySQL — select historical sales from DB.
- **Configuration:**
  - Operation: `select` (SQL details not included in JSON; must be defined in node UI).
- **Input:** From `Fetch POS Data`.
- **Output:** To `Fetch Weather Forecast`.
- **Edge cases:**
  - Missing SQL query/filters can return huge result sets (performance).
  - Credential/connection errors; timezone/encoding issues.
  - Data shape mismatch with later merges (fields like `product_id`, `quantity_sold` expected downstream).

#### Node: Fetch Weather Forecast
- **Type / role:** HTTP Request — gets external weather forecast.
- **Configuration:**
  - `GET https://api.openweathermap.org/data/2.5/forecast`
  - Query params: `q=Tokyo`, `appid=YOUR_API_KEY`, `cnt=5`
- **Input:** From `Fetch Historical Sales`.
- **Output:** To `Fetch SNS Trends`.
- **Edge cases:**
  - `YOUR_API_KEY` must be replaced; otherwise 401.
  - Weather API returns nested structures; downstream code expects flattened `weather_temp` (not guaranteed).
  - Units (Kelvin by default) can distort “weatherScore” unless transformed.

#### Node: Fetch SNS Trends
- **Type / role:** HTTP Request — gets social trend metrics.
- **Configuration:**
  - `GET https://trend-api.example.com/social/metrics`
  - Query params: `keywords=product_category`, `period=24h`
- **Input:** From `Fetch Weather Forecast`.
- **Output:** To `Fetch Inventory Master`.
- **Edge cases:**
  - Placeholder endpoint; auth/rate limits.
  - Returns aggregated trend rather than per product; later dataset creation assumes per-item `trend_score`.

#### Node: Fetch Inventory Master
- **Type / role:** HTTP Request — fetches current stock snapshot.
- **Configuration:**
  - `GET https://inventory-api.example.com/stock/current`
- **Input:** From `Fetch SNS Trends`.
- **Output:** To `Merge Data 1`.
- **Edge cases:**
  - Needs auth; may return list per product while upstream nodes may not align by position.

#### Node: Merge Data 1
- **Type / role:** Merge — combines streams.
- **Configuration:**
  - Mode: `combine`
  - Combine by: `position`
- **Input/Output:**
  - Input is effectively whatever arrives before it (here: `Fetch Inventory Master` only, based on connections).
  - Output to `Merge Data 2`.
- **Important integration concern:** In this workflow, **no second input is connected** to `Merge Data 1`. In `combine` mode, Merge typically expects two inputs. With only one connected input, behavior may be empty output or passthrough depending on n8n version/settings—commonly it will not combine as intended.
- **Edge cases:**
  - Positional combine is fragile: if sources return arrays of different lengths/order, product data mismatches.

#### Node: Merge Data 2
- **Type / role:** Merge — intended to finalize combined dataset.
- **Configuration:**
  - Mode: `combine`
  - Combine by: `position`
- **Input:** From `Merge Data 1` only (no second input connected).
- **Output:** To `Format Prediction Dataset`.
- **Edge cases:** Same as Merge Data 1; likely produces incorrect/empty dataset unless adjusted.

**Net note for this block:** Although the sticky note describes aggregating multiple sources, the current connections are linear (POS → MySQL → Weather → SNS → Inventory) and the merge nodes are not wired to actually merge multiple branches. To truly aggregate, you would typically fan out from the trigger into parallel fetches and then merge.

---

### Block 3 — Prediction & Order Logic

**Overview:** Transforms raw inputs into model features, calls AI forecast service, computes shortages, and prepares per-product order lines.  
**Nodes involved:** `Format Prediction Dataset`, `Call AI Prediction API`, `Calculate Stock Shortage`, `Finalize Order Qty`, `Check Order Necessity`

#### Node: Format Prediction Dataset
- **Type / role:** Code — builds feature objects per item for AI.
- **Configuration highlights:**
  - Iterates over `$input.all()` and maps into `features`:
    - `productId: item.json.product_id`
    - `historicalSales: item.json.quantity_sold || 0`
    - `currentStock: item.json.current_stock || 0`
    - `weatherScore: item.json.weather_temp || 20`
    - `trendScore: item.json.trend_score || 0`
    - `dayOfWeek: new Date().getDay()`
    - `campaignFlag, safetyStock, leadTime` with defaults
- **Input:** From `Merge Data 2`.
- **Output:** Items shaped like `{ productId, historicalSales, currentStock, ... }` to `Call AI Prediction API`.
- **Edge cases:**
  - Field naming inconsistencies: uses `product_id` and `current_stock` but later nodes expect `currentStock` etc. This node outputs `currentStock` camelCase, but other upstream fields might not exist, leading to defaults.
  - `productName`, `category`, `minOrderLot`, `onOrderQuantity` are not set here but used later; may be missing unless provided by earlier merges.

#### Node: Call AI Prediction API
- **Type / role:** HTTP Request — calls AI forecasting endpoint.
- **Configuration:**
  - `POST https://ai-prediction-api.example.com/forecast`
  - Body parameters:
    - `features = {{$json}}`
    - `horizon_days = 7`
- **Input:** From `Format Prediction Dataset`.
- **Output:** To `Calculate Stock Shortage`.
- **Edge cases:**
  - Placeholder URL; needs auth and correct payload schema.
  - Response shape assumptions: downstream expects fields like `forecastQuantity` and `confidenceScore`.
  - If API returns `{forecastQuantity: ...}` nested under another key, shortage calc will treat it as 0.

#### Node: Calculate Stock Shortage
- **Type / role:** Code — computes shortage quantity.
- **Logic:**
  - `forecast = item.json.forecastQuantity || 0`
  - `currentStock = item.json.currentStock || 0`
  - `onOrder = item.json.onOrderQuantity || 0`
  - `safetyStock = item.json.safetyStock || 10`
  - `shortage = max(0, (forecast+safetyStock) - (currentStock+onOrder))`
- **Input:** From `Call AI Prediction API`.
- **Output:** To `Finalize Order Qty`.
- **Edge cases:**
  - If AI API returns only forecast without echoing the original features, `currentStock` may be missing unless you merge the API response back with request features.
  - Units/time granularity mismatch (forecast for 7 days vs. stock snapshot timing).

#### Node: Finalize Order Qty
- **Type / role:** Code — filters to only items needing order; rounds to lot size.
- **Logic:**
  - Keeps items where `shortageQuantity > 0`
  - Lot rounding:
    - `lotSize = minOrderLot || 1`
    - `orderQty = ceil(ceil(shortage)/lotSize) * lotSize`
  - Outputs fields: `productId`, `productName`, `orderQuantity`, `category`, `leadTime`
- **Input:** From `Calculate Stock Shortage`.
- **Output:** To `Check Order Necessity`.
- **Edge cases:**
  - `minOrderLot`, `productName`, `category` likely absent unless sourced earlier.
  - If `leadTime` is needed for supplier scoring, must be consistent with supplier quote lead time fields.

#### Node: Check Order Necessity
- **Type / role:** IF — stops supplier/ordering if nothing to order.
- **Condition:**
  - `{{$input.all().length}} > 0`
- **Output:** True path connected to `Split by Product` (false path unused).
- **Edge cases:**
  - With some n8n versions, `$input.all().length` in IF may behave unexpectedly if node receives a single item vs multiple; generally OK here.

---

### Block 4 — Supplier Quote & Optimization

**Overview:** For each product requiring ordering, requests quotes from three suppliers and selects best based on cost and lead-time constraint.  
**Nodes involved:** `Split by Product`, `Get Quote Supplier A`, `Get Quote Supplier B`, `Get Quote Supplier C`, `Merge Quotes`, `Select Best Supplier`

#### Node: Split by Product
- **Type / role:** Split In Batches — processes orders per product (batching/iteration).
- **Configuration:** Options default (batch size not specified; default is typically 1).
- **Input:** From `Check Order Necessity` (true).
- **Output:** To `Get Quote Supplier A`.
- **Edge cases:**
  - Without looping back (SplitInBatches “continue” pattern), only the first batch may be processed depending on configuration and downstream connections. This workflow does **not** show a loop-back connection to fetch next batch.

#### Node: Get Quote Supplier A
- **Type / role:** HTTP Request — quote lookup.
- **Configuration:**
  - `GET https://supplier-a.example.com/api/quote`
  - Query: `productId={{$json.productId}}`, `quantity={{$json.orderQuantity}}`
- **Input:** From `Split by Product`.
- **Output:** To `Get Quote Supplier B` (sequential chaining).
- **Edge cases:** Auth, response schema differences; may not return `unitPrice`, `shippingFee`, `leadTime`, `supplierName`.

#### Node: Get Quote Supplier B
- **Type / role:** HTTP Request — quote lookup with different parameter names.
- **Configuration:**
  - `GET https://supplier-b.example.com/api/pricing`
  - Query: `item_code={{$json.productId}}`, `qty={{$json.orderQuantity}}`
- **Input:** From Supplier A node output.
- **Output:** To `Get Quote Supplier C`.
- **Edge cases:** Same as above; also chaining means B receives A’s output JSON, not the original order item unless A’s response preserves it.

#### Node: Get Quote Supplier C
- **Type / role:** HTTP Request — quote request via POST.
- **Configuration:**
  - `POST https://supplier-c.example.com/quote/request`
  - Body: `product={{$json.productId}}`, `volume={{$json.orderQuantity}}`
- **Input:** From Supplier B.
- **Output:** To `Merge Quotes`.
- **Edge cases:** Same; sequential chain likely loses earlier quote data unless stored/merged.

#### Node: Merge Quotes
- **Type / role:** Merge — intended to combine multiple supplier quotes.
- **Configuration:**
  - Mode: `combineAll`
- **Input:** Only from `Get Quote Supplier C` per connections.
- **Output:** To `Select Best Supplier`.
- **Important integration concern:** As wired, this does **not** merge A/B/C quotes in parallel; it receives only the last node’s output. `combineAll` typically expects multiple inputs.
- **Edge cases:** Best supplier selection will be based on incomplete quote set.

#### Node: Select Best Supplier
- **Type / role:** Code — chooses supplier with minimum total cost subject to lead time ≤ 7 days.
- **Logic highlights:**
  - Iterates over `$input.all()` as quotes
  - Uses flexible fields:
    - `unitPrice = unitPrice || price || 0`
    - `shipping = shippingFee || freight || 0`
    - `leadTime = leadTime || deliveryDays || 999`
  - Calculates `totalCost = unitPrice * qty + shipping`
  - Keeps lowest cost with `leadTime <= 7`
  - Returns `[ { json: bestSupplier } ]`
- **Input:** From `Merge Quotes`.
- **Output:** To `Execute Auto Order`.
- **Edge cases:**
  - If no supplier meets leadTime constraint, `bestSupplier` remains `null` → output item `{json: null}` which will break downstream expressions (e.g., building URL).
  - `qty` read from `quote.json.orderQuantity`—quotes may not include this unless carried through.

---

### Block 5 — Execution, Logging & Alerting

**Overview:** Places the purchase order, updates inventory system, logs to MySQL, and notifies Slack when confidence is low.  
**Nodes involved:** `Execute Auto Order`, `Update Inventory System`, `Save Order Log`, `Check Anomalies`, `Slack Anomaly Alert`

#### Node: Execute Auto Order
- **Type / role:** HTTP Request — places order with selected supplier.
- **Configuration:**
  - `POST {{ 'https://' + $json.supplierName + '.example.com/api/order' }}`
  - Body:
    - `productId={{$json.productId}}`
    - `quantity={{$json.orderQuantity}}`
    - `unitPrice={{$json.unitPrice}}`
    - `requestedDelivery={{$now.plus(3,'days').format('yyyy-MM-dd')}}`
- **Input:** From `Select Best Supplier`.
- **Output:** To `Update Inventory System`.
- **Edge cases:**
  - `supplierName` must be DNS-safe; if it contains spaces or not a subdomain, URL becomes invalid.
  - If `bestSupplier` is null, expression evaluation fails.
  - Supplier order API may require auth and different schema; no headers configured.

#### Node: Update Inventory System
- **Type / role:** HTTP Request — patches inventory on-order quantities.
- **Configuration:**
  - `PATCH https://inventory-api.example.com/stock/update`
  - Body:
    - `productId`, `onOrderQuantity`, `orderId`, `expectedDelivery`
- **Input:** From `Execute Auto Order`.
- **Output:** To `Save Order Log`.
- **Edge cases:**
  - Assumes order API returns `orderId` and `expectedDeliveryDate`. If field names differ, patch sends nulls.

#### Node: Save Order Log
- **Type / role:** MySQL — writes an audit record to `forecast_order_log`.
- **Configuration (interpreted):**
  - Table: `forecast_order_log`
  - Columns listed: `run_date, product_id, product_name, forecast_quantity, current_stock, shortage_quantity, order_quantity, supplier, unit_price, total_cost, expected_delivery, confidence_score`
  - Operation is not explicitly shown; given “columns” field, it is likely **insert** in typical n8n configuration, but must be verified in node UI.
- **Input:** From `Update Inventory System`.
- **Output:** To `Check Anomalies`.
- **Edge cases:**
  - Column/value mapping is not visible; if not mapped, insert fails.
  - DB schema mismatch (types, null constraints).
  - Needs the table to exist (mentioned in sticky note).

#### Node: Check Anomalies
- **Type / role:** IF — triggers alerting for low-confidence forecasts.
- **Condition:**
  - OR condition: `{{$json.confidenceScore}} < 0.3`
- **Input:** From `Save Order Log`.
- **Output:** True path connected to `Slack Anomaly Alert` (false path unused).
- **Edge cases:**
  - If `confidenceScore` missing, expression may evaluate to null; strict type validation may cause condition issues.

#### Node: Slack Anomaly Alert
- **Type / role:** Slack — posts message to a channel for manual review.
- **Configuration:**
  - OAuth2 auth
  - Channel: `C1234567890`
  - Message includes: productId, confidenceScore, forecastQuantity
- **Input:** From `Check Anomalies` (true).
- **Edge cases:**
  - OAuth token scopes missing (`chat:write` etc.).
  - Channel ID invalid or bot not in channel.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Workflow Overview | Sticky Note | Documentation / overview panel | — | — | ## 📊 Workflow Overview; Automates replenishment via data collection, AI prediction, supplier selection, execution, Slack anomalies; Setup: MySQL/Slack creds, API endpoints/keys, ensure `forecast_order_log`, adjust schedule |
| Group: Data Collection | Sticky Note | Visual grouping label | — | — | ## Data Collection; Gathers data from POS, database, weather, and SNS trends |
| Group: Prediction | Sticky Note | Visual grouping label | — | — | ## Prediction & Logic; AI forecasts, compare vs stock, calculate order quantities |
| Group: Selection | Sticky Note | Visual grouping label | — | — | ## Supplier Optimization; parallel quote requests + best offer selection |
| Group: Execution | Sticky Note | Visual grouping label | — | — | ## Execution & Alerting; place PO, log DB, Slack alert if review needed |
| Run Daily at 03:00 | Schedule Trigger | Entry point scheduler | — | Fetch POS Data | ## Data Collection; Gathers data from POS, database, weather, and SNS trends |
| Fetch POS Data | HTTP Request | Pull recent POS sales | Run Daily at 03:00 | Fetch Historical Sales | ## Data Collection; Gathers data from POS, database, weather, and SNS trends |
| Fetch Historical Sales | MySQL | Query historical sales | Fetch POS Data | Fetch Weather Forecast | ## Data Collection; Gathers data from POS, database, weather, and SNS trends |
| Fetch Weather Forecast | HTTP Request | Pull weather forecast | Fetch Historical Sales | Fetch SNS Trends | ## Data Collection; Gathers data from POS, database, weather, and SNS trends |
| Fetch SNS Trends | HTTP Request | Pull social trend metrics | Fetch Weather Forecast | Fetch Inventory Master | ## Data Collection; Gathers data from POS, database, weather, and SNS trends |
| Fetch Inventory Master | HTTP Request | Fetch current stock snapshot | Fetch SNS Trends | Merge Data 1 | ## Data Collection; Gathers data from POS, database, weather, and SNS trends |
| Merge Data 1 | Merge | Combine datasets (intended) | Fetch Inventory Master | Merge Data 2 | ## Data Collection; Gathers data from POS, database, weather, and SNS trends |
| Merge Data 2 | Merge | Combine datasets (intended) | Merge Data 1 | Format Prediction Dataset | ## Data Collection; Gathers data from POS, database, weather, and SNS trends |
| Format Prediction Dataset | Code | Build model features per product | Merge Data 2 | Call AI Prediction API | ## Prediction & Logic; AI forecasts, compare vs stock, calculate order quantities |
| Call AI Prediction API | HTTP Request | Get 7‑day forecast from AI service | Format Prediction Dataset | Calculate Stock Shortage | ## Prediction & Logic; AI forecasts, compare vs stock, calculate order quantities |
| Calculate Stock Shortage | Code | Compute shortage vs supply + safety | Call AI Prediction API | Finalize Order Qty | ## Prediction & Logic; AI forecasts, compare vs stock, calculate order quantities |
| Finalize Order Qty | Code | Filter/round order quantities | Calculate Stock Shortage | Check Order Necessity | ## Prediction & Logic; AI forecasts, compare vs stock, calculate order quantities |
| Check Order Necessity | IF | Continue only if order list not empty | Finalize Order Qty | Split by Product | ## Prediction & Logic; AI forecasts, compare vs stock, calculate order quantities |
| Split by Product | Split In Batches | Iterate per product order line | Check Order Necessity | Get Quote Supplier A | ## Supplier Optimization; parallel quote requests + best offer selection |
| Get Quote Supplier A | HTTP Request | Retrieve supplier A quote | Split by Product | Get Quote Supplier B | ## Supplier Optimization; parallel quote requests + best offer selection |
| Get Quote Supplier B | HTTP Request | Retrieve supplier B quote | Get Quote Supplier A | Get Quote Supplier C | ## Supplier Optimization; parallel quote requests + best offer selection |
| Get Quote Supplier C | HTTP Request | Retrieve supplier C quote | Get Quote Supplier B | Merge Quotes | ## Supplier Optimization; parallel quote requests + best offer selection |
| Merge Quotes | Merge | Combine quotes (intended) | Get Quote Supplier C | Select Best Supplier | ## Supplier Optimization; parallel quote requests + best offer selection |
| Select Best Supplier | Code | Choose best quote by cost + lead time | Merge Quotes | Execute Auto Order | ## Supplier Optimization; parallel quote requests + best offer selection |
| Execute Auto Order | HTTP Request | Place purchase order | Select Best Supplier | Update Inventory System | ## Execution & Alerting; place PO, log DB, Slack alert if review needed |
| Update Inventory System | HTTP Request | Patch inventory on-order | Execute Auto Order | Save Order Log | ## Execution & Alerting; place PO, log DB, Slack alert if review needed |
| Save Order Log | MySQL | Persist run/order info | Update Inventory System | Check Anomalies | ## Execution & Alerting; place PO, log DB, Slack alert if review needed |
| Check Anomalies | IF | Alert if low confidence | Save Order Log | Slack Anomaly Alert | ## Execution & Alerting; place PO, log DB, Slack alert if review needed |
| Slack Anomaly Alert | Slack | Post anomaly message to channel | Check Anomalies | — | ## Execution & Alerting; place PO, log DB, Slack alert if review needed |

---

## 4. Reproducing the Workflow from Scratch

1. **Create a new workflow**
   - Name: `AI Demand Forecasting & Auto-Ordering with Optimal Supplier Selection`

2. **Add Schedule Trigger**
   - Node: **Schedule Trigger**
   - Configure either:
     - Daily at 03:00 (if that’s the intent), **or**
     - Every 3 hours (to match current JSON).
   - Connect to next step.

3. **Add POS sales fetch**
   - Node: **HTTP Request** (`Fetch POS Data`)
   - Method: GET
   - URL: `https://pos-api.example.com/sales`
   - Query params:
     - `from`: `{{$now.minus(3, 'days').format('yyyy-MM-dd')}}`
     - `to`: `{{$now.format('yyyy-MM-dd')}}`
   - Configure auth/headers as required by your POS API.
   - Connect from Schedule Trigger → this node.

4. **Add MySQL historical sales query**
   - Node: **MySQL** (`Fetch Historical Sales`)
   - Credentials: configure MySQL host/user/password/database.
   - Operation: **Select**
   - Provide an SQL query that returns at least:
     - `product_id`, `quantity_sold` (and ideally product metadata used later).
   - Connect `Fetch POS Data` → `Fetch Historical Sales`.

5. **Add weather fetch**
   - Node: **HTTP Request** (`Fetch Weather Forecast`)
   - GET `https://api.openweathermap.org/data/2.5/forecast`
   - Query: `q=Tokyo`, `appid=<YOUR_KEY>`, `cnt=5`
   - Connect `Fetch Historical Sales` → `Fetch Weather Forecast`.

6. **Add social trends fetch**
   - Node: **HTTP Request** (`Fetch SNS Trends`)
   - GET `https://trend-api.example.com/social/metrics`
   - Query: `keywords=product_category`, `period=24h`
   - Add required auth.
   - Connect `Fetch Weather Forecast` → `Fetch SNS Trends`.

7. **Add inventory snapshot fetch**
   - Node: **HTTP Request** (`Fetch Inventory Master`)
   - GET `https://inventory-api.example.com/stock/current`
   - Add required auth.
   - Connect `Fetch SNS Trends` → `Fetch Inventory Master`.

8. **(Recommended) Fix data aggregation design**
   - To truly merge multiple sources, create parallel branches from the trigger (or from a “Set/Function” that defines product list) and connect them into Merge nodes with **two inputs each** (e.g., POS+DB → merge, then +weather, then +trends, then +inventory), using a stable key (productId) rather than position.
   - If you keep the current linear chain, the two Merge nodes can be removed or rewired to have two inputs.

9. **Add Code node to format prediction features**
   - Node: **Code** (`Format Prediction Dataset`)
   - Paste the provided JS (feature mapping).
   - Ensure upstream items contain `product_id`, `quantity_sold`, `current_stock`, etc., or adapt field names.
   - Connect from the last data-prep node → this node.

10. **Add AI prediction call**
    - Node: **HTTP Request** (`Call AI Prediction API`)
    - POST `https://ai-prediction-api.example.com/forecast`
    - Body parameters:
      - `features`: `{{$json}}`
      - `horizon_days`: `7`
    - Add auth (API key/bearer) as required.
    - Connect `Format Prediction Dataset` → `Call AI Prediction API`.

11. **Add shortage calculation**
    - Node: **Code** (`Calculate Stock Shortage`)
    - Paste the provided JS.
    - Connect `Call AI Prediction API` → `Calculate Stock Shortage`.
    - Ensure the AI response contains (or is merged back with) `currentStock`, `onOrderQuantity`, `safetyStock`.

12. **Add final order quantity calculation**
    - Node: **Code** (`Finalize Order Qty`)
    - Paste the provided JS.
    - Connect `Calculate Stock Shortage` → `Finalize Order Qty`.

13. **Add IF gate for “any items to order?”**
    - Node: **IF** (`Check Order Necessity`)
    - Condition: `{{$input.all().length}} > 0`
    - Connect `Finalize Order Qty` → `Check Order Necessity` (true output continues).

14. **Add batching/iteration**
    - Node: **Split In Batches** (`Split by Product`)
    - Batch size: 1 (typical per-product quoting)
    - Connect IF true → Split In Batches.
    - (Recommended) Add loop-back from the end of the per-item chain to SplitInBatches “Next Batch” to process all items.

15. **Add supplier quote nodes**
    - Node: **HTTP Request** (`Get Quote Supplier A`) GET with query `productId`, `quantity`.
    - Node: **HTTP Request** (`Get Quote Supplier B`) GET with query `item_code`, `qty`.
    - Node: **HTTP Request** (`Get Quote Supplier C`) POST body `product`, `volume`.
    - Prefer parallel requests (three branches) to truly compare quotes. If parallel, merge all three outputs afterward.

16. **Add Merge Quotes**
    - Node: **Merge** (`Merge Quotes`)
    - Mode: `combineAll` (or use Merge by key if you normalize)
    - Wire all supplier quote outputs into this merge (requires multiple inputs).
    - Connect to selection step.

17. **Add Code node to select best supplier**
    - Node: **Code** (`Select Best Supplier`)
    - Paste the provided JS.
    - Ensure each quote item includes `unitPrice/price`, `shippingFee/freight`, `leadTime/deliveryDays`, and also has `productId` and `orderQuantity` available (often you’ll need to carry these through with a merge).

18. **Add Execute Auto Order**
    - Node: **HTTP Request** (`Execute Auto Order`)
    - POST URL expression: `{{ 'https://' + $json.supplierName + '.example.com/api/order' }}`
    - Body: productId, quantity, unitPrice, requestedDelivery (`$now.plus(3,'days')...`)
    - Add auth required by supplier ordering API.

19. **Add Update Inventory System**
    - Node: **HTTP Request** (`Update Inventory System`)
    - PATCH `https://inventory-api.example.com/stock/update`
    - Body: productId, onOrderQuantity, orderId, expectedDelivery
    - Connect from Execute Auto Order.

20. **Add Save Order Log (MySQL)**
    - Node: **MySQL** (`Save Order Log`)
    - Credentials: same MySQL
    - Operation: configure to **Insert** into `forecast_order_log`
    - Map columns:
      - `run_date` (use `$now.toISO()` or formatted date)
      - `product_id`, `product_name`, `forecast_quantity`, `current_stock`, `shortage_quantity`, `order_quantity`, `supplier`, `unit_price`, `total_cost`, `expected_delivery`, `confidence_score`
    - Connect from Update Inventory System.

21. **Add anomaly detection IF**
    - Node: **IF** (`Check Anomalies`)
    - Condition: `{{$json.confidenceScore}} < 0.3`
    - Connect from Save Order Log (true → Slack).

22. **Add Slack alert**
    - Node: **Slack** (`Slack Anomaly Alert`)
    - Auth: Slack OAuth2 credential (scopes for posting messages)
    - Channel: set Channel ID (e.g., `C1234567890`)
    - Message template as in node configuration.
    - Connect from IF true output.

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| Configure MySQL and Slack credentials; update HTTP nodes with real endpoints/keys; ensure `forecast_order_log` exists; adjust schedule (default noted as Daily at 03:00). | From sticky note “Workflow Overview” |
| The current schedule configuration runs every 3 hours even though the node name implies “Daily at 03:00”. | Implementation detail from Schedule Trigger |
| The current wiring does not actually merge multiple sources/quotes in parallel; Merge nodes have only one input connected. | Integration/design consideration |
| Supplier URL is built from `supplierName`; ensure it is a safe subdomain or replace with a mapping table. | Execution node expression constraint |