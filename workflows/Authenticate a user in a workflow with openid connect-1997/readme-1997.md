Authenticate a user in a workflow with openid connect

https://n8nworkflows.xyz/workflows/authenticate-a-user-in-a-workflow-with-openid-connect-1997


# Authenticate a user in a workflow with openid connect

### 1. Workflow Overview

This workflow implements a user authentication flow using OpenID Connect (OIDC) within an n8n automation. It ensures that before a user can interact with the webhook, they must authenticate via an OIDC provider, such as Keycloak, using the Authorization Code flow with PKCE (Proof Key for Code Exchange). The workflow handles redirecting unauthenticated users to login, exchanging authorization codes for tokens, storing tokens in cookies, and retrieving user profile information from the identity provider.

**Target Use Cases:**  
- Securing n8n webhooks with OIDC authentication  
- Integrating user login flows within n8n workflows using standard OIDC protocols  
- Retrieving user profile information after authentication for use in downstream workflow logic  
- Supporting both PKCE-enabled and non-PKCE OIDC clients  

**Logical Blocks:**  
- **1.1 Input Reception:** Receives incoming webhook calls that require authentication.  
- **1.2 Configuration Setup:** Loads OIDC endpoints, client credentials, and scope.  
- **1.3 Token Extraction:** Parses cookies to extract access tokens if present.  
- **1.4 Authorization Code Handling (Non-PKCE):** Handles exchanging authorization codes for tokens when PKCE is not used.  
- **1.5 Token Presence Check:** Determines if a valid access token is present.  
- **1.6 User Info Retrieval:** Calls the userinfo endpoint to fetch user profile data using the access token.  
- **1.7 User Info Validation:** Checks if the user profile data is valid.  
- **1.8 Response Rendering:** Sends back either the login page, welcome page, or error page based on authentication status.  

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** This block receives the initial HTTP request via a webhook and triggers the authentication workflow.  
- **Nodes Involved:**  
  - Webhook  

- **Node Details:**  
  - **Webhook**  
    - Type: Webhook (n8n trigger node)  
    - Configured with a unique webhook path.  
    - Response Mode: `responseNode` — the node responsible for responding to the HTTP request is defined downstream.  
    - Inputs: External HTTP request  
    - Outputs: Passes request data (including cookies and query parameters) downstream  
    - Edge Cases: Missing or malformed requests, repeated calls without tokens  

#### 2.2 Configuration Setup

- **Overview:** Sets all necessary OIDC configuration parameters and client credentials as workflow variables for subsequent nodes.  
- **Nodes Involved:**  
  - Set variables : auth, token, userinfo, client id, scope  
  - Sticky Note (explaining required variables)  

- **Node Details:**  
  - **Set variables : auth, token, userinfo, client id, scope**  
    - Type: Set node  
    - Sets multiple string variables:  
      - `auth_endpoint`: Authorization endpoint URL of the OIDC provider  
      - `token_endpoint`: Token endpoint URL  
      - `userinfo_endpoint`: Userinfo endpoint URL  
      - `client_id`: OIDC client identifier  
      - `scope`: OIDC scopes (default "openid")  
      - `redirect_uri`: URI to redirect to after login (usually the webhook URL)  
      - `client_secret`: Client secret (if not using PKCE)  
    - Boolean variable: `PKCE` (true/false) indicating whether to use PKCE flow  
    - Inputs: JSON from webhook node  
    - Outputs: Variables for downstream nodes  
    - Edge Cases: Missing or incorrect endpoint URLs or credentials will cause authentication failures.  
  - **Sticky Note**  
    - Content: Describes which variables must be set and notes that if PKCE is not used, client_secret and redirect_uri must be configured.  

#### 2.3 Token Extraction

- **Overview:** Extracts access token from request cookies if present, enabling token reuse without re-authentication.  
- **Nodes Involved:**  
  - Code  

- **Node Details:**  
  - **Code**  
    - Type: Code (JavaScript) node  
    - Parses the `cookie` header from the incoming HTTP request, splits it, and extracts key-value pairs into an object.  
    - Returns all cookies as JSON, including the access token cookie named `n8n-custom-auth`.  
    - Inputs: HTTP headers from webhook node  
    - Outputs: JSON object mapping cookie names to values  
    - Edge Cases: Missing or malformed cookie header, no token cookie present  
    - Continue On Fail: Enabled to allow workflow continuation despite parsing errors  

#### 2.4 Authorization Code Handling (Non-PKCE)

- **Overview:** If PKCE mode is disabled and the query parameter `code` is present, exchanges the authorization code for an access token at the token endpoint.  
- **Nodes Involved:**  
  - IF we have code in URI and not in PKCE mode  
  - get access_token from /token endpoint with code  

- **Node Details:**  
  - **IF we have code in URI and not in PKCE mode**  
    - Type: If node  
    - Checks two conditions:  
      - Query parameter `code` is not empty  
      - PKCE is false  
    - Routes true to the token request node, false skips this block  
    - Inputs: Output from Code node (cookie extraction), webhook query parameters, Set variables node (for PKCE flag)  
    - Outputs: True branch to token exchange, false branch to token presence check  
  - **get access_token from /token endpoint with code**  
    - Type: HTTP Request (POST)  
    - Posts form-urlencoded data to token_endpoint:  
      - grant_type: authorization_code  
      - client_id, client_secret, code, redirect_uri from variables and query params  
    - Receives access token in response  
    - Inputs: IF node true branch  
    - Outputs: Access token JSON to user info retrieval node  
    - Edge Cases: Invalid codes, expired codes, network errors, invalid client credentials  

#### 2.5 Token Presence Check

- **Overview:** Determines if an access token is available either from cookies or from the token exchange.  
- **Nodes Involved:**  
  - IF token is present  

- **Node Details:**  
  - **IF token is present**  
    - Type: If node  
    - Checks if `access_token` is not empty in the incoming JSON (from cookie or token exchange).  
    - True branch proceeds to user info retrieval, false branch triggers login form response.  
    - Inputs: Output from token exchange or cookie extraction  
    - Outputs: User info HTTP request or login form node  
    - Edge Cases: Token expired or invalid, empty tokens  

#### 2.6 User Info Retrieval

- **Overview:** Uses the access token to call the OIDC userinfo endpoint and retrieve the authenticated user’s profile information.  
- **Nodes Involved:**  
  - user info  

- **Node Details:**  
  - **user info**  
    - Type: HTTP Request  
    - GETs the `userinfo_endpoint` with Authorization header `Bearer <access_token>`.  
    - Returns user profile JSON data (e.g., email, username, user id).  
    - Inputs: Output from IF token is present or token exchange node  
    - Outputs: JSON user info to validation node  
    - Edge Cases: Invalid/expired tokens, HTTP errors, network timeouts  

#### 2.7 User Info Validation

- **Overview:** Validates the user info response to ensure the email field is present, indicating successful authentication.  
- **Nodes Involved:**  
  - IF user info ok  

- **Node Details:**  
  - **IF user info ok**  
    - Type: If node  
    - Checks if `email` field in user info JSON is non-empty  
    - True branch sends welcome page, false branch sends login form again  
    - Inputs: user info node output  
    - Outputs: Welcome page node or login form node  
    - Edge Cases: Missing email or incomplete user info fields  

#### 2.8 Response Rendering

- **Overview:** Returns the appropriate HTTP response to the user based on authentication status: login page for unauthenticated, welcome page for authenticated.  
- **Nodes Involved:**  
  - login form  
  - send back login page  
  - Welcome page  
  - send back welcome page  
  - send back login page (respondToWebhook)  

- **Node Details:**  
  - **login form**  
    - Type: HTML node containing JavaScript to initiate the OIDC authorization code flow with PKCE.  
    - Dynamically inserts OIDC endpoints and client info from variables.  
    - Handles code exchange in-browser and sets access token cookie.  
    - Inputs: IF user info ok false branch or IF token is present false branch  
    - Outputs: send back login page node  
  - **send back login page**  
    - Type: RespondToWebhook node (text response)  
    - Sends HTML content from login form to client browser  
    - Inputs: login form node output  
  - **Welcome page**  
    - Type: HTML node producing a welcome message personalized with user’s email from userinfo node  
    - Inputs: IF user info ok true branch  
    - Outputs: send back welcome page node  
  - **send back welcome page**  
    - Type: RespondToWebhook node (text response)  
    - Sends HTML welcome page to client browser  
    - Inputs: Welcome page node output  

---

### 3. Summary Table

| Node Name                          | Node Type              | Functional Role                                        | Input Node(s)                          | Output Node(s)                         | Sticky Note                                                                                                        |
|-----------------------------------|------------------------|-------------------------------------------------------|--------------------------------------|--------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| Webhook                           | Webhook                | Entry point receiving HTTP requests                    | -                                    | Set variables : auth, token, userinfo, client id, scope |                                                                                                                   |
| Set variables : auth, token, userinfo, client id, scope | Set                    | Stores OIDC endpoints, client id, scope, and flags     | Webhook                              | Code                                 | In this set, you have to retrieve from your identity provider : auth url, token url, userinfo url, client id, scope; if no PKCE, fill client_secret and redirect_uri |
| Code                              | Code                   | Parses cookies to extract access token                  | Set variables                        | IF we have code in URI and not in PKCE mode           |                                                                                                                   |
| IF we have code in URI and not in PKCE mode | If                     | Checks presence of authorization code and PKCE flag    | Code                                | get access_token from /token endpoint with code, IF token is present |                                                                                                                   |
| get access_token from /token endpoint with code | HTTP Request           | Exchanges authorization code for access token          | IF we have code in URI and not in PKCE mode | user info                          |                                                                                                                   |
| IF token is present               | If                     | Checks if access token is present                        | get access_token from /token endpoint with code, Code | user info, login form              |                                                                                                                   |
| user info                        | HTTP Request           | Retrieves user profile information from userinfo endpoint | IF token is present, get access_token from /token endpoint with code | IF user info ok                   |                                                                                                                   |
| IF user info ok                  | If                     | Validates user info response                             | user info                           | Welcome page, login form             | At this point the user is authenticated, you have access to his profile from the user info result and you continue doing things |
| Welcome page                    | HTML                   | Creates a personalized welcome HTML page                | IF user info ok                     | send back welcome page               |                                                                                                                   |
| send back welcome page          | RespondToWebhook       | Sends welcome HTML page response                         | Welcome page                       | -                                    |                                                                                                                   |
| login form                      | HTML                   | Displays login page with OIDC PKCE authorization script | IF token is present (false branch), IF user info ok (false branch) | send back login page               |                                                                                                                   |
| send back login page            | RespondToWebhook       | Sends login HTML page response                           | login form                        | -                                    |                                                                                                                   |
| Sticky Note                    | Sticky Note            | Explains required variables                              | -                                  | -                                  | In this set, you have to retrieve from your identity provider : auth url, token url, userinfo url, the client id you created for this flow, scopes to use, at least "openid" scope; if no PKCE, you have to fill client_secret and redirect_uri (which is the webhook uri) |
| Sticky Note1                   | Sticky Note            | Notes user authenticated and profile access             | -                                  | -                                  | At this point the user is authenticated, you have access to his profile from the user info result and you continue doing things |
| Sticky Note2                   | Sticky Note            | Setup instructions for Keycloak                          | -                                  | -                                  | ## Quick setup with Keycloak 1. Open your Keycloak 2. Go to `Realm settings` and open `OpenID Endpoint Configuration` 3. Copy endpoints to Set variables node 4. Create client, disable client authentication, enable standard flow 5. Set webhook URL as valid redirect URI 6. Enter clientID in Set variables node 7. Activate workflow and test |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Type: Webhook  
   - Set HTTP Method: GET or POST (default)  
   - Set Webhook Path: unique identifier (e.g., `891ad1cd-6a50-4a88-8789-95680c78f14c`)  
   - Response Mode: `responseNode` (so downstream node handles responses)  

2. **Create Set Node to Store OIDC Variables**  
   - Name: `Set variables : auth, token, userinfo, client id, scope`  
   - Add String Parameters:  
     - `auth_endpoint`: [Your OIDC authorization endpoint URL]  
     - `token_endpoint`: [Your OIDC token endpoint URL]  
     - `userinfo_endpoint`: [Your OIDC userinfo endpoint URL]  
     - `client_id`: [Your OIDC client ID]  
     - `scope`: `openid` (or additional scopes as needed)  
     - `redirect_uri`: [Webhook URL]  
     - `client_secret`: [Client secret if not using PKCE]  
   - Add Boolean Parameter:  
     - `PKCE`: true or false (choose according to your client config)  
   - Connect Webhook node output to this node  

3. **Create Code Node to Extract Cookies**  
   - Name: `Code`  
   - Use JavaScript code to parse the `cookie` header from the webhook request and return an object mapping cookie names to values (as in the workflow)  
   - Enable Continue On Fail for robustness  
   - Connect `Set variables` node output to this node  

4. **Create If Node to Check for Authorization Code in URI and PKCE Disabled**  
   - Name: `IF we have code in URI and not in PKCE mode`  
   - Condition 1: Check if `{{$node["Webhook"].json["query"]["code"]}}` is not empty  
   - Condition 2: Check if `{{$node["Set variables : auth, token, userinfo, client id, scope"].json["PKCE"]}}` is false  
   - Connect `Code` node output to this node  

5. **Create HTTP Request Node to Exchange Code for Token**  
   - Name: `get access_token from /token endpoint with code`  
   - Method: POST  
   - URL: `{{$node["Set variables : auth, token, userinfo, client id, scope"].json["token_endpoint"]}}`  
   - Content Type: `application/x-www-form-urlencoded`  
   - Body Parameters:  
     - grant_type: `authorization_code`  
     - client_id: from Set variables  
     - client_secret: from Set variables (if PKCE disabled)  
     - code: from webhook query parameter  
     - redirect_uri: from Set variables  
   - Connect true output of previous If node to this node  

6. **Create If Node to Check Presence of Access Token**  
   - Name: `IF token is present`  
   - Condition: Check if `{{$json["access_token"]}}` is not empty  
   - Connect false output of `IF we have code in URI and not in PKCE mode` and output of token exchange node to this node  

7. **Create HTTP Request Node to Fetch User Info**  
   - Name: `user info`  
   - Method: GET (default)  
   - URL: `{{$node["Set variables : auth, token, userinfo, client id, scope"].json["userinfo_endpoint"]}}`  
   - Add Header: `Authorization: Bearer {{$json["access_token"]}}`  
   - Connect true output of `IF token is present` to this node  

8. **Create If Node to Validate User Info**  
   - Name: `IF user info ok`  
   - Condition: Check if `{{$json["email"]}}` is not empty  
   - Connect output of `user info` node to this node  

9. **Create HTML Node for Welcome Page**  
   - Name: `Welcome page`  
   - HTML Content: Basic HTML welcoming the user by email, e.g., `<h1>Welcome {{$json.email}}</h1>`  
   - Style as needed  
   - Connect true output of `IF user info ok` to this node  

10. **Create RespondToWebhook Node to Send Welcome Page**  
    - Name: `send back welcome page`  
    - Respond with Text  
    - Response Body: `{{$json.html}}` from Welcome page node  
    - Connect Welcome page node to this node  

11. **Create HTML Node for Login Form with PKCE**  
    - Name: `login form`  
    - HTML Content: Include JavaScript implementing PKCE authorization code flow; dynamically insert endpoints and client info from Set variables node via expressions  
    - Connect false output of `IF user info ok` and false output of `IF token is present` to this node  

12. **Create RespondToWebhook Node to Send Login Page**  
    - Name: `send back login page`  
    - Respond with Text  
    - Response Body: `{{$json.html}}` from login form node  
    - Connect login form node output to this node  

13. **Connect all branches properly:**  
    - Webhook → Set variables → Code → IF we have code in URI and not in PKCE mode  
    - True → get access_token from /token endpoint with code → user info → IF user info ok  
    - False → IF token is present → user info or login form  
    - IF user info ok true → Welcome page → send back welcome page  
    - IF user info ok false → login form → send back login page  
    - IF token is present false → login form → send back login page  

14. **Credentials Setup:**  
    - No special credentials needed for HTTP Request nodes unless your OIDC provider requires client authentication that needs to be configured.  
    - Ensure correct client ID and client secret are set in Set variables node.  
    - The webhook URL used as redirect_uri must be registered with the OIDC provider.  

15. **Optional:** Add Sticky Notes explaining setup steps and usage tips for maintainers.  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                              | Context or Link                                                                                       |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| This workflow implements Authorization Code flow with PKCE for secure OIDC login in n8n. It supports both PKCE and non-PKCE modes by toggling a boolean variable.                                                                         |                                                                                                     |
| Detailed setup instructions for Keycloak are included as sticky notes and in the description, including client creation and configuration steps.                                                                                         | https://www.keycloak.org                                                                             |
| The login form node uses embedded JavaScript to handle the PKCE flow, including generating the code verifier, code challenge, and exchanging the authorization code for tokens within the browser.                                         | https://datatracker.ietf.org/doc/html/rfc7636                                                       |
| The access token is stored in a cookie named `n8n-custom-auth`. This token is then used to call the userinfo endpoint and can also be used to call other APIs that accept the token (e.g., Google APIs).                                    |                                                                                                     |
| For detailed conceptual understanding and background about this workflow and OIDC in n8n, refer to the blog post: [https://blog.please-open.it/n8n-openid-client/](https://blog.please-open.it/n8n-openid-client/)                         | https://blog.please-open.it/n8n-openid-client/                                                      |
| JavaScript crypto API (Web Crypto) is required for PKCE flow to work properly and must be served over HTTPS or localhost for secure context.                                                                                             | https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts                                |
| When not using PKCE, client_secret and redirect_uri must be correctly configured, and client authentication must be enabled in the OIDC provider.                                                                                        |                                                                                                     |

---

This documentation provides a thorough, structured reference enabling users or AI agents to understand, reproduce, and modify the OIDC client authentication workflow in n8n.