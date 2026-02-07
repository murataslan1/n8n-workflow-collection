Automate Rank Math SEO Field Updates for Posts and Products

https://n8nworkflows.xyz/workflows/automate-rank-math-seo-field-updates-for-posts-and-products-2836


# Automate Rank Math SEO Field Updates for Posts and Products

### 1. Workflow Overview

This workflow automates updating Rank Math SEO metadata fields—specifically SEO Title, SEO Description, and Canonical URL—for WordPress posts and WooCommerce products. It leverages a custom WordPress plugin that extends the WordPress REST API to expose an endpoint for updating these SEO fields programmatically.

**Target Use Cases:**  
- Automating SEO metadata updates for large volumes of posts or products.  
- Integrating SEO management into broader automation pipelines.  
- Simplifying SEO optimization workflows for WordPress sites using Rank Math and WooCommerce.

**Logical Blocks:**  
- **1.1 Input Reception:** Manual trigger to start the workflow.  
- **1.2 Configuration Setup:** Setting base URL and parameters for the WordPress site.  
- **1.3 API Request Execution:** Sending a POST request to the custom Rank Math REST API endpoint to update SEO metadata.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block initiates the workflow manually, allowing users to trigger the SEO metadata update process on demand.

- **Nodes Involved:**  
  - When clicking ‘Test workflow’

- **Node Details:**  
  - **Node Name:** When clicking ‘Test workflow’  
  - **Type:** Manual Trigger  
  - **Technical Role:** Starts the workflow manually without any input data.  
  - **Configuration Choices:** Default manual trigger with no parameters.  
  - **Expressions/Variables:** None.  
  - **Input Connections:** None (entry point).  
  - **Output Connections:** Connects to the “Settings” node.  
  - **Version Requirements:** n8n version supporting manual trigger node (standard).  
  - **Potential Failures:** None expected; manual trigger is stable.  
  - **Sub-workflow:** None.

#### 2.2 Configuration Setup

- **Overview:**  
  This block sets up essential configuration data, specifically the base URL of the WooCommerce/WordPress site, which is used in the API request.

- **Nodes Involved:**  
  - Settings

- **Node Details:**  
  - **Node Name:** Settings  
  - **Type:** Set  
  - **Technical Role:** Defines static variables used downstream, here the WooCommerce URL.  
  - **Configuration Choices:**  
    - Assigns a string variable named `woocommerce url` with the value `https://mydom.com/`.  
  - **Expressions/Variables:** None inside this node; it outputs the assigned variable for use in other nodes.  
  - **Input Connections:** Receives input from the manual trigger node.  
  - **Output Connections:** Connects to the HTTP Request node.  
  - **Version Requirements:** Standard Set node features.  
  - **Potential Failures:** None expected unless the URL is misconfigured or empty.  
  - **Sub-workflow:** None.

#### 2.3 API Request Execution

- **Overview:**  
  This block performs the core function: it sends a POST request to the custom Rank Math REST API endpoint to update SEO metadata fields for a specified post or product.

- **Nodes Involved:**  
  - HTTP Request - Update Rank Math Meta

- **Node Details:**  
  - **Node Name:** HTTP Request - Update Rank Math Meta  
  - **Type:** HTTP Request  
  - **Technical Role:** Sends a POST request to the WordPress REST API endpoint exposed by the Rank Math API Manager Extended plugin to update SEO metadata.  
  - **Configuration Choices:**  
    - URL dynamically constructed by concatenating the `woocommerce url` variable with the endpoint path `wp-json/rank-math-api/v1/update-meta`.  
    - HTTP Method: POST.  
    - Body Parameters:  
      - `post_id`: 246 (the ID of the post/product to update).  
      - `rank_math_title`: "Demo SEO Title".  
      - `rank_math_description`: "Demo SEO Description".  
      - `rank_math_canonical_url`: "https://example.com/demo-product".  
    - Authentication: Uses predefined WordPress API credentials (OAuth2 or API key depending on setup).  
    - Retry on failure enabled to handle transient errors.  
  - **Expressions/Variables:**  
    - URL uses expression: `={{ $('Settings').item.json["woocommerce url"] }}wp-json/rank-math-api/v1/update-meta`  
  - **Input Connections:** Receives input from the “Settings” node.  
  - **Output Connections:** None (end node).  
  - **Version Requirements:** HTTP Request node version 4.2 or higher recommended for retry feature.  
  - **Potential Failures:**  
    - Authentication errors if credentials are invalid or expired.  
    - Network timeouts or connectivity issues.  
    - API errors if the post ID does not exist or user lacks permissions.  
    - Validation errors if parameters are malformed.  
  - **Sub-workflow:** None.

---

### 3. Summary Table

| Node Name                      | Node Type       | Functional Role                          | Input Node(s)              | Output Node(s)                  | Sticky Note                                                                                   |
|-------------------------------|-----------------|----------------------------------------|----------------------------|--------------------------------|----------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’  | Manual Trigger  | Starts the workflow manually           | None                       | Settings                       |                                                                                              |
| Settings                      | Set             | Defines base WooCommerce/WordPress URL | When clicking ‘Test workflow’ | HTTP Request - Update Rank Math Meta |                                                                                              |
| HTTP Request - Update Rank Math Meta | HTTP Request   | Sends POST request to update Rank Math SEO metadata | Settings                   | None                           | Use WordPress credentials with appropriate permissions; retry enabled for robustness.       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Add a **Manual Trigger** node named `When clicking ‘Test workflow’`.  
   - No configuration needed. This node will start the workflow on demand.

2. **Create Set Node for Configuration**  
   - Add a **Set** node named `Settings`.  
   - Configure it to assign a string variable:  
     - Name: `woocommerce url`  
     - Value: `https://mydom.com/` (replace with your actual WordPress/WooCommerce site URL, including trailing slash if needed).  
   - Connect the output of `When clicking ‘Test workflow’` to the input of `Settings`.

3. **Create HTTP Request Node**  
   - Add an **HTTP Request** node named `HTTP Request - Update Rank Math Meta`.  
   - Configure as follows:  
     - **HTTP Method:** POST  
     - **URL:** Use an expression to concatenate the base URL from `Settings` with the API endpoint path:  
       `={{ $('Settings').item.json["woocommerce url"] }}wp-json/rank-math-api/v1/update-meta`  
     - **Authentication:** Select predefined WordPress API credentials (OAuth2 or API key) with permission to edit posts.  
     - **Body Parameters:** Set to send as form parameters or JSON (depending on API expectations):  
       - `post_id`: The numeric ID of the post or product to update (e.g., 246).  
       - `rank_math_title`: The new SEO title string.  
       - `rank_math_description`: The new SEO description string.  
       - `rank_math_canonical_url`: The canonical URL string.  
     - **Options:** Enable retry on failure to handle transient errors.  
   - Connect the output of `Settings` to the input of this HTTP Request node.

4. **Credentials Setup**  
   - Ensure you have WordPress API credentials configured in n8n with sufficient permissions (`edit_posts`) to update metadata via the REST API.  
   - If WooCommerce products are targeted, ensure the user has appropriate permissions for product editing.

5. **Testing**  
   - Trigger the workflow manually via the `When clicking ‘Test workflow’` node.  
   - Confirm that the SEO metadata updates correctly on the specified post or product in WordPress.

---

### 5. General Notes & Resources

| Note Content                                                                                                  | Context or Link                                                                                     |
|---------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| The workflow requires the custom WordPress plugin "Rank Math API Manager Extended" installed and activated.   | Plugin source and details included in the workflow description.                                    |
| Plugin GitHub or official page not provided; plugin authored by Phil at https://inforeole.fr                  | For support or updates, visit https://inforeole.fr                                                |
| The plugin extends the WordPress REST API to allow updating Rank Math SEO fields programmatically.            | This enables automation workflows like this one to manage SEO metadata efficiently.               |
| Ensure WordPress user credentials used have `edit_posts` capability to avoid permission errors.                | See plugin method `check_update_permission` for permission logic.                                 |
| Retry on failure is enabled in the HTTP Request node to improve robustness against transient network issues. |                                                                                                   |

---

This documentation fully describes the workflow’s structure, logic, and setup, enabling advanced users and automation agents to understand, reproduce, and extend the SEO metadata update automation.