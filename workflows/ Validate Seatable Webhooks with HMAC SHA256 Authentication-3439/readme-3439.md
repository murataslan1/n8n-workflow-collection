 Validate Seatable Webhooks with HMAC SHA256 Authentication

https://n8nworkflows.xyz/workflows/-validate-seatable-webhooks-with-hmac-sha256-authentication-3439


#  Validate Seatable Webhooks with HMAC SHA256 Authentication

### 1. Workflow Overview

This workflow is designed to **securely validate incoming Seatable webhook requests** by verifying their authenticity using HMAC SHA256 signature validation. It ensures that only legitimate requests from Seatable proceed further, thereby adding a security layer before any custom processing logic.

**Target Use Cases:**  
- Integration scenarios where Seatable sends webhook notifications to n8n.  
- Environments requiring verification of webhook payload integrity and origin.  
- Use cases needing a secure gateway to filter incoming webhook requests before triggering downstream automation.

**Logical Blocks:**  
- **1.1 Input Reception:** Receives raw webhook HTTP POST requests from Seatable with signature headers.  
- **1.2 HMAC SHA256 Calculation:** Computes HMAC SHA256 hash of the raw request body with a shared secret key.  
- **1.3 Signature Validation:** Compares the computed HMAC with the signature sent in the webhook header.  
- **1.4 Conditional Response & Forwarding:** Responds with HTTP 200 OK and forwards valid requests; responds with HTTP 403 Forbidden otherwise.  
- **1.5 Processing Placeholder:** A no-operation node reserved for users to add their custom logic for further processing post-validation.  
- **1.6 Documentation:** A sticky note node provides detailed usage instructions and important notes.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block listens for incoming webhook POST requests from Seatable, capturing the raw request body and headers necessary for signature verification.

- **Nodes Involved:**  
  - `Seatable Webhook`

- **Node Details:**  
  - **Node:** Seatable Webhook  
    - Type: Webhook  
    - Role: Entry point for incoming HTTP POST requests.  
    - Configuration:  
      - HTTP Method: POST  
      - Path: `s0m3-d4nd0m-1d` (customizable webhook path)  
      - Raw Body: Enabled to access the unparsed raw payload for accurate HMAC calculation.  
      - Response Mode: `responseNode` to delay HTTP response until validation completes.  
    - Input: External HTTP POST request.  
    - Output: Passes raw body and headers to the next node (`Calculate sha256`).  
    - Edge Cases:  
      - Invalid HTTP methods or paths will not trigger this webhook.  
      - Missing or malformed headers may cause downstream validation failure.  
    - Version: Compatible with n8n version supporting rawBody option in webhook nodes.

#### 1.2 HMAC SHA256 Calculation

- **Overview:**  
  Computes the HMAC SHA256 hash of the raw request body using a secret key shared with Seatable.

- **Nodes Involved:**  
  - `Calculate sha256`

- **Node Details:**  
  - **Node:** Calculate sha256  
    - Type: Crypto  
    - Role: Performs HMAC SHA256 hash computation on binary data.  
    - Configuration:  
      - Algorithm: SHA256  
      - Action: HMAC  
      - Input Data Type: Binary data (raw HTTP body)  
      - Data Property Name: `seatable-signature` (the property name holding the raw request body in binary form)  
      - Secret Key: User must replace placeholder with their shared secret key for HMAC.  
    - Input: Raw request body from webhook node.  
    - Output: Produces a hex-encoded HMAC hash accessible in JSON property `seatable-signature`.  
    - Edge Cases:  
      - Missing or incorrect secret key leads to invalid hash.  
      - Binary data must be correctly passed from webhook node; otherwise, hash differs.  
    - Version: Requires n8n version supporting crypto node with HMAC on binary data.

#### 1.3 Signature Validation

- **Overview:**  
  Compares the computed HMAC hash with the signature from the webhook’s `x-seatable-signature` HTTP header (after stripping the `sha256=` prefix) to verify authenticity.

- **Nodes Involved:**  
  - `hash matches`

- **Node Details:**  
  - **Node:** hash matches  
    - Type: If  
    - Role: Conditional logic node checking string equality.  
    - Configuration:  
      - Condition: String equality between:  
        - Left: Computed HMAC hash (`$json['seatable-signature']`)  
        - Right: Incoming header `x-seatable-signature` with `sha256=` prefix removed (`$json.headers['x-seatable-signature'].replace("sha256=", "")`)  
    - Input: Output from `Calculate sha256` node.  
    - Output:  
      - True branch if hashes match (valid signature).  
      - False branch if hashes do not match (invalid signature).  
    - Edge Cases:  
      - Header missing or malformed leads to false condition.  
      - Expression failures if properties are undefined or improperly formatted.  
    - Version: Supports standard expression syntax available in recent n8n versions.

#### 1.4 Conditional Response & Forwarding

- **Overview:**  
  Depending on the validation result, the workflow responds to the webhook request with HTTP 200 OK (valid) or 403 Forbidden (invalid). If valid, it forwards the data to subsequent processing nodes.

- **Nodes Involved:**  
  - `200`  
  - `403`  
  - `Add nodes for processing`

- **Node Details:**  
  - **Node:** 200  
    - Type: Respond to Webhook  
    - Role: Responds HTTP 200 OK without body content for valid requests.  
    - Configuration: Response code set to 200, no response data sent.  
    - Input: True output of `hash matches`.  
    - Output: Forwards valid webhook data to next node `Add nodes for processing`.  
    - Edge Cases: Network or execution delays may cause timeout in responding to webhook.  

  - **Node:** 403  
    - Type: Respond to Webhook  
    - Role: Responds HTTP 403 Forbidden without body content for invalid requests.  
    - Configuration: Response code set to 403, no response data sent.  
    - Input: False output of `hash matches`.  
    - Output: Workflow terminates here for invalid requests.  
    - Edge Cases: Same as above; also ensures no further processing on invalid requests.  

  - **Node:** Add nodes for processing  
    - Type: NoOp (No Operation)  
    - Role: Placeholder node for users to add their own logic after successful validation.  
    - Configuration: No parameters; acts as a pass-through node.  
    - Input: From `200` response node after successful validation.  
    - Output: User-defined downstream nodes in customized workflows.  
    - Edge Cases: None; purely structural and user-extensible.

#### 1.5 Documentation and Instructions

- **Overview:**  
  Provides detailed instructions and important notes about usage, configuration, and customization.

- **Nodes Involved:**  
  - `Sticky Note`

- **Node Details:**  
  - **Node:** Sticky Note  
    - Type: Sticky Note (documentation)  
    - Role: Contains workflow purpose, steps, and configuration advice.  
    - Content Highlights:  
      - Explains the workflow’s goal to validate Seatable webhooks securely.  
      - Lists critical configuration steps (secret key, webhook path, adding custom nodes).  
      - Warns that this is a template and not standalone.  
    - Positioning: Separate, non-executable node for user reference.  
    - Edge Cases: None.

---

### 3. Summary Table

| Node Name               | Node Type               | Functional Role                                         | Input Node(s)          | Output Node(s)                     | Sticky Note                                                                                      |
|-------------------------|-------------------------|---------------------------------------------------------|-----------------------|----------------------------------|------------------------------------------------------------------------------------------------|
| Seatable Webhook        | Webhook                 | Receives raw POST webhook requests from Seatable        | External HTTP request | Calculate sha256                 |                                                                                                |
| Calculate sha256        | Crypto                  | Computes HMAC SHA256 hash of raw request body            | Seatable Webhook      | hash matches                    |                                                                                                |
| hash matches            | If                      | Compares computed hash with header signature             | Calculate sha256      | 200 (true), 403 (false)          |                                                                                                |
| 200                     | Respond to Webhook      | Responds HTTP 200 OK and forwards valid requests          | hash matches (true)   | Add nodes for processing         |                                                                                                |
| 403                     | Respond to Webhook      | Responds HTTP 403 Forbidden on invalid signature          | hash matches (false)  | None                           |                                                                                                |
| Add nodes for processing | NoOp                    | Placeholder for user to add custom processing logic       | 200                   | User-defined downstream nodes    |                                                                                                |
| Sticky Note             | Sticky Note             | Documentation and usage instructions                       | None                  | None                           | ## 📌 Validate Seatable Webhooks with HMAC SHA256 Authentication<br>This mini workflow is designed to **securely validate incoming Seatable webhooks** using HMAC SHA256 signature verification.<br><br>### 🔐 What it does:<br>- Listens for incoming Seatable webhook requests.<br>- Calculates a SHA256 HMAC hash of the raw request body using your shared secret.<br>- Compares the computed hash with the `x-seatable-signature` header (after removing the `sha256=` prefix).<br>- If the hashes match: responds with **200 OK** and forwards the request to subsequent nodes.<br>- If the hashes don’t match: responds with **403 Forbidden**.<br><br>### ⚠️ Important Notes:<br>This workflow is provided as a **template** and is not intended to work standalone. **Please duplicate it** and integrate it with your custom logic at the "Add nodes for processing" node.<br><br>Configuration steps:<br>- Set your **secret key** in the “Calculate sha256” crypto node (replace the placeholder).<br>- Adjust the webhook path to suit your environment (or set it to "manual" for testing).<br>- Connect your actual logic after the verification step. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Webhook Node**  
   - Node Type: Webhook  
   - Name: `Seatable Webhook`  
   - HTTP Method: `POST`  
   - Webhook Path: Set to your desired path (e.g., `s0m3-d4nd0m-1d`)  
   - Enable `Raw Body` option to access unparsed request body  
   - Set `Response Mode` to `responseNode`  
   - No credentials required here.

2. **Create the Crypto Node for HMAC SHA256**  
   - Node Type: Crypto  
   - Name: `Calculate sha256`  
   - Type: SHA256  
   - Action: HMAC  
   - Input Data: Binary Data (raw HTTP body)  
   - Data Property Name: `seatable-signature` (this corresponds to the raw body property name)  
   - Enter your shared secret key (replace placeholder) in the secret key field  
   - Connect `Seatable Webhook` output to this node input.

3. **Create the Conditional If Node for Signature Comparison**  
   - Node Type: If  
   - Name: `hash matches`  
   - Condition: String Equals  
     - Value 1: Expression: `{{ String($json['seatable-signature']) }}` (the computed hash)  
     - Value 2: Expression: `{{ String($json.headers['x-seatable-signature'].replace("sha256=", "")) }}` (signature header without prefix)  
   - Connect `Calculate sha256` output to this node input.

4. **Create Respond to Webhook Node for Valid Signature**  
   - Node Type: Respond to Webhook  
   - Name: `200`  
   - Response Code: 200  
   - Respond With: No Data (empty response)  
   - Connect `hash matches` True output to this node input.

5. **Create Respond to Webhook Node for Invalid Signature**  
   - Node Type: Respond to Webhook  
   - Name: `403`  
   - Response Code: 403  
   - Respond With: No Data (empty response)  
   - Connect `hash matches` False output to this node input.

6. **Create a NoOp Node for Processing Placeholder**  
   - Node Type: NoOp  
   - Name: `Add nodes for processing`  
   - Connect `200` output to this node input.  
   - This node is a placeholder where you will add your actual processing nodes after validation.

7. **Optional: Add a Sticky Note Node for Documentation**  
   - Node Type: Sticky Note  
   - Name: `Sticky Note`  
   - Content: Add the descriptive text explaining workflow purpose, usage instructions, and configuration notes as provided.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                              | Context or Link                                            |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------|
| This workflow is a **template** and requires user customization: set the secret key in the crypto node, adjust the webhook path, and add your processing logic after validation. It is recommended to duplicate this workflow before integration to avoid conflicts.                                                                                                                                                                        | Workflow usage instruction                                 |
| The webhook node’s `rawBody` option must be enabled to ensure accurate HMAC calculation on the unparsed payload, which is critical for signature verification.                                                                                                                                                                                                                                                                           | Important webhook configuration detail                      |
| The HMAC SHA256 secret key used for hashing must be the same shared secret configured in Seatable’s webhook settings to ensure signatures match.                                                                                                                                                                                                                                                                                         | Cryptography key management                                 |
| For testing purposes, consider setting the webhook path to "manual" mode or use tools like `curl` or Postman to simulate webhook POST requests with appropriate headers and payloads.                                                                                                                                                                                                                                                     | Testing & debugging tip                                     |
| Expressions rely on the presence of the `x-seatable-signature` header and the raw body property; missing or malformed data will cause the validation to fail and respond with 403.                                                                                                                                                                                                                                                        | Edge case note for error handling                           |

---

This detailed documentation supports both manual re-creation and automated parsing for workflow modification or integration, ensuring secure and reliable validation of Seatable webhook inputs.