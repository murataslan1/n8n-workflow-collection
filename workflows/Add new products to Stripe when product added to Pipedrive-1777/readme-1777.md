Add new products to Stripe when product added to Pipedrive

https://n8nworkflows.xyz/workflows/add-new-products-to-stripe-when-product-added-to-pipedrive-1777


# Add new products to Stripe when product added to Pipedrive

### 1. Workflow Overview

This workflow automates the synchronization of new products created in Pipedrive with Stripe by creating corresponding product and price records in Stripe. It is designed for users who manage product catalogs in Pipedrive and want to ensure their Stripe account reflects the latest product data without manual duplication.

The workflow logic is divided into the following blocks:

- **1.1 Input Reception**: Detects when a new product is added in Pipedrive.
- **1.2 Data Preparation**: Extracts and prepares product data from the Pipedrive trigger for Stripe API consumption.
- **1.3 Stripe Product Creation**: Calls Stripe API to create the product based on Pipedrive data.
- **1.4 Data Merging**: Combines original Pipedrive data with the newly created Stripe product ID.
- **1.5 Price Splitting**: Splits the product’s price list into individual price items.
- **1.6 Stripe Price Creation**: Creates individual price records in Stripe for each price item.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** This block listens for new product additions in Pipedrive and triggers the workflow.
- **Nodes Involved:** `On product created`
- **Node Details:**

  - **On product created**
    - Type: Pipedrive Trigger — listens for events in Pipedrive.
    - Configuration: Triggers on the action `"added"` and object `"product"`.
    - Credentials: Uses saved Pipedrive credentials.
    - Inputs: None (trigger node).
    - Outputs: Emits new product data as JSON when a product is added.
    - Edge Cases: 
      - Failure if webhook registration in Pipedrive fails.
      - Possible delays if Pipedrive is slow or rate limits occur.
    - Notes: Entry point for the workflow.

#### 2.2 Data Preparation

- **Overview:** Extracts the current product data from the Pipedrive trigger payload for further use.
- **Nodes Involved:** `Set item to only current product data`
- **Node Details:**

  - **Set item to only current product data**
    - Type: Function Item — processes one item at a time.
    - Configuration: Sets the item to `item.current` from the trigger payload, effectively flattening the data structure.
    - Key Expression: `item = item.current;`
    - Inputs: Receives product data array from the trigger.
    - Outputs: Single product object with relevant fields (`name`, `description`, `prices`, etc.).
    - Edge Cases:
      - If the `current` field is missing, node will fail or output incomplete data.
      - Logging is used (`console.log('Done!')`) but only visible during manual runs.
    - Notes: Prepares data for Stripe product creation.

#### 2.3 Stripe Product Creation

- **Overview:** Creates a new product in Stripe using the product name and description from Pipedrive.
- **Nodes Involved:** `Create product in Stripe`
- **Node Details:**

  - **Create product in Stripe**
    - Type: HTTP Request — performs a POST request to Stripe API.
    - Configuration:
      - URL: `https://api.stripe.com/v1/products`
      - Method: POST
      - Authentication: Uses Stripe credentials stored in n8n.
      - Query Parameters:
        - `name`: Mapped from `{{$json["name"]}}` (Pipedrive product name).
        - `description`: Mapped from `{{$json["description"] || ' '}}` (uses space if description missing).
    - Inputs: Single product item with name and description.
    - Outputs: Stripe product creation response containing product ID and metadata.
    - Edge Cases:
      - Authentication errors if Stripe credentials are invalid.
      - API rate limits or connectivity issues.
      - Missing or invalid product data may cause API failures.
    - Version Notes: Uses HTTP Request node version 2 for better authentication handling.

#### 2.4 Data Merging

- **Overview:** Combines original Pipedrive product data with the Stripe product ID returned from the API call.
- **Nodes Involved:**
  - `Keep only productId of created product`
  - `Add created product Id to data`
- **Node Details:**

  - **Keep only productId of created product**
    - Type: Set — extracts and retains only the Stripe product ID.
    - Configuration:
      - Sets a single string field: `StripeCreatedProductId` = `{{$json["id"]}}` from Stripe response.
      - Uses `keepOnlySet: true` to discard other data.
    - Inputs: Stripe product creation response.
    - Outputs: Object containing only the Stripe product ID.
    - Edge Cases:
      - Missing `id` field in Stripe response would cause failure.
  
  - **Add created product Id to data**
    - Type: Merge — merges two data streams by index.
    - Configuration:
      - Mode: `mergeByIndex` merges Pipedrive product data and Stripe product ID by item index.
    - Inputs:
      - Main input: Pipedrive product data (from `Set item to only current product data`).
      - Additional input: Stripe product ID (from `Keep only productId of created product`).
    - Outputs: Combined data including original product info and Stripe product ID.
    - Edge Cases:
      - Mismatch in item indexes between streams could cause incorrect merges.
      - Missing input from either stream will cause partial or failed merges.

#### 2.5 Price Splitting

- **Overview:** Splits the array of prices inside each product into separate items for individual Stripe price creation.
- **Nodes Involved:** `Split prices to seperate items`
- **Node Details:**

  - **Split prices to seperate items**
    - Type: Item Lists — splits array fields into multiple items.
    - Configuration:
      - Field to split out: `prices` (an array of price objects inside the product data).
      - Includes additional field: `StripeCreatedProductId` to keep reference for prices.
      - Other options set to defaults.
    - Inputs: Merged data containing product info, prices array, and Stripe product ID.
    - Outputs: Multiple items, each representing one price object with linked product ID.
    - Edge Cases:
      - Empty or missing `prices` array results in no output items.
      - Incorrect field name or structure causes failure or empty output.

#### 2.6 Stripe Price Creation

- **Overview:** Creates individual price records in Stripe for each price item related to the product.
- **Nodes Involved:** `Create price records in Stripe`
- **Node Details:**

  - **Create price records in Stripe**
    - Type: HTTP Request — POST request to Stripe to create prices.
    - Configuration:
      - URL: `https://api.stripe.com/v1/prices`
      - Method: POST
      - Authentication: Uses Stripe credentials.
      - Query parameters:
        - `currency`: Mapped from `{{$json["prices"].currency}}` (currency code).
        - `unit_amount`: Mapped from `{{$json["prices"].price * 100}}` (price in smallest currency unit).
        - `product`: Mapped from `{{$json["StripeCreatedProductId"]}}` (Stripe product ID).
    - Inputs: Individual price item with currency, price, and product ID.
    - Outputs: Stripe API response per price created.
    - Edge Cases:
      - Authentication errors with Stripe.
      - Price or currency data missing or invalid.
      - API rate limits or network issues.
    - Notes: Requires price multiplied by 100 because Stripe expects amounts in cents or similar units.

---

### 3. Summary Table

| Node Name                      | Node Type              | Functional Role                        | Input Node(s)                  | Output Node(s)                 | Sticky Note                                                                                                   |
|-------------------------------|------------------------|-------------------------------------|-------------------------------|-------------------------------|---------------------------------------------------------------------------------------------------------------|
| On product created             | Pipedrive Trigger      | Trigger on new product in Pipedrive | None                          | Set item to only current product data |                                                                                                               |
| Set item to only current product data | Function Item          | Extract current product data          | On product created             | Create product in Stripe, Add created product Id to data   |                                                                                                               |
| Create product in Stripe       | HTTP Request           | Create product in Stripe              | Set item to only current product data | Keep only productId of created product |                                                                                                               |
| Keep only productId of created product | Set                    | Extract Stripe product ID             | Create product in Stripe       | Add created product Id to data   |                                                                                                               |
| Add created product Id to data | Merge                  | Merge Pipedrive data with Stripe ID  | Set item to only current product data, Keep only productId of created product | Split prices to seperate items |                                                                                                               |
| Split prices to seperate items | Item Lists             | Split prices array into individual items | Add created product Id to data | Create price records in Stripe  |                                                                                                               |
| Create price records in Stripe | HTTP Request           | Create price records in Stripe        | Split prices to seperate items | None                          |                                                                                                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Pipedrive Trigger node**
   - Name: `On product created`
   - Parameters:
     - Action: `added`
     - Object: `product`
   - Credentials: Select or create Pipedrive API credentials.
   - Position: Start of the workflow.

2. **Add a Function Item node**
   - Name: `Set item to only current product data`
   - Connect from: `On product created`
   - Parameters:
     - Function code:
       ```javascript
       item = item.current;
       return item;
       ```
   - Purpose: Flatten the trigger payload to just the current product data.

3. **Add an HTTP Request node to create product in Stripe**
   - Name: `Create product in Stripe`
   - Connect from: `Set item to only current product data`
   - Parameters:
     - HTTP Method: `POST`
     - URL: `https://api.stripe.com/v1/products`
     - Authentication: Use predefined Stripe credentials.
     - Query Parameters:
       - `name`: Expression: `{{$json["name"]}}`
       - `description`: Expression: `{{$json["description"] || ' '}}`
   - Credentials: Select or create Stripe credentials.

4. **Add a Set node to keep only Stripe product ID**
   - Name: `Keep only productId of created product`
   - Connect from: `Create product in Stripe`
   - Parameters:
     - Set field:
       - Name: `StripeCreatedProductId`
       - Value: Expression: `{{$json["id"]}}`
     - Enable "Keep Only Set" to discard other data.

5. **Add a Merge node to combine Pipedrive and Stripe data**
   - Name: `Add created product Id to data`
   - Connect two inputs:
     - Main input: from `Set item to only current product data`
     - Second input: from `Keep only productId of created product`
   - Parameters:
     - Mode: `mergeByIndex`

6. **Add an Item Lists node to split prices**
   - Name: `Split prices to seperate items`
   - Connect from: `Add created product Id to data`
   - Parameters:
     - Field to split out: `prices`
     - Include fields: `StripeCreatedProductId`

7. **Add an HTTP Request node to create price records in Stripe**
   - Name: `Create price records in Stripe`
   - Connect from: `Split prices to seperate items`
   - Parameters:
     - HTTP Method: `POST`
     - URL: `https://api.stripe.com/v1/prices`
     - Authentication: Use Stripe credentials.
     - Query Parameters:
       - `currency`: Expression: `{{$json["prices"].currency}}`
       - `unit_amount`: Expression: `{{$json["prices"].price * 100}}`
       - `product`: Expression: `{{$json["StripeCreatedProductId"]}}`

---

### 5. General Notes & Resources

| Note Content                                                                                                      | Context or Link                                                                                          |
|------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| Stripe API expects amounts in the smallest currency unit (e.g., cents for USD), so prices are multiplied by 100. | Stripe API Pricing Documentation: https://stripe.com/docs/api/prices/create                             |
| Pipedrive webhook must be properly configured to trigger on product additions for this workflow to start.       | Pipedrive Webhooks: https://pipedrive.readme.io/docs/webhooks                                          |
| Stripe and Pipedrive credentials must be configured in n8n before using this workflow.                           | n8n Credential Setup: https://docs.n8n.io/integrations/builtin/credentials/                             |
| The merge node uses "mergeByIndex" which requires input streams to be in the same order and length.             | n8n Merge Node Docs: https://docs.n8n.io/nodes/n8n-nodes-base.merge/                                   |

---

This document provides a detailed and structured explanation of the workflow, enabling advanced users or AI agents to understand, reproduce, and troubleshoot the integration process between Pipedrive and Stripe.