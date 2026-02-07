Automated AWS IAM Key Compromise Response with Slack & Claude AI

https://n8nworkflows.xyz/workflows/automated-aws-iam-key-compromise-response-with-slack---claude-ai-5123


# Automated AWS IAM Key Compromise Response with Slack & Claude AI

### 1. Workflow Overview

This workflow automates the detection, response, and reporting process for compromised AWS IAM access keys. It is designed to streamline security incident response by programmatically deactivating compromised keys, auditing associated user policies, applying restrictive security policies to limit risk, and generating a clear security summary report sent to a Slack channel.

**Target use cases:**  
- Automated remediation of AWS IAM key compromises  
- Security auditing of inline and attached IAM policies for affected users  
- Human-in-the-loop approval for remediation actions  
- Automated generation of security reports using Claude AI and Langchain integration  
- Slack notification to security teams with summarized incident details

The workflow can be logically divided into the following blocks:

- **1.1 Input Reception:** Manual or form-triggered input of compromised user and key details.
- **1.2 Key Information Retrieval:** Fetch and parse the user’s AWS access keys.
- **1.3 Human Approval:** Request and wait for human approval before taking remediation actions.
- **1.4 Remediation Actions:** Deactivate compromised keys and create/apply an invalidating security policy.
- **1.5 Policy Auditing:** Retrieve and analyze both inline and attached IAM policies for the user.
- **1.6 Data Aggregation:** Merge all collected data into a single dataset.
- **1.7 AI Security Analysis:** Generate a summarized security report using Claude AI.
- **1.8 Notification:** Send the security report to a designated Slack channel.

---

### 2. Block-by-Block Analysis

---

#### 1.1 Input Reception

**Overview:**  
Captures the compromised AWS username and access key ID either via a secure form or manual trigger. The data is formatted for downstream processing.

**Nodes Involved:**  
- 📝 Secure Form: Key Compromise Input  
- 🔧 Process Form Submission  
- 🔍 Manual Key Lookup Trigger  
- 🔍 AWS IAM Service  
- ✅ Approved Compromise Data

**Node Details:**

- **📝 Secure Form: Key Compromise Input**  
  - Type: Form Trigger  
  - Role: Receives manual input of `Username` and `AccessKeyID` with basic authentication.  
  - Config: Requires both fields; form titled "Automated AWS IAM Key Compromise Response Input".  
  - Output: JSON with `Username` and `AccessKeyID`.  
  - Failures: Authentication errors, missing required fields.

- **🔧 Process Form Submission**  
  - Type: Set  
  - Role: Maps form input fields to standardized variables (`UserName`, `AccessKeyId`, `Date` with current ISO date).  
  - Config: Assigns values from form JSON.  
  - Connections: Input from form, output to Slack approval request.  
  - Failures: Expression errors if input JSON malformed.

- **🔍 Manual Key Lookup Trigger**  
  - Type: Manual Trigger  
  - Role: Alternative manual start point for the workflow.  
  - Connections: Triggers AWS IAM Service node.

- **🔍 AWS IAM Service**  
  - Type: AWS IAM node  
  - Role: Retrieves all IAM user info (fallback/manual lookup).  
  - Credentials: AWS with configured credentials.  
  - Output: Raw AWS IAM data.  
  - Failures: AWS API errors, permissions, timeouts.

- **✅ Approved Compromise Data**  
  - Type: Set  
  - Role: Central node that consolidates the approved user/key and current date for further use.  
  - Config: Assigns `UserName`, `AccessKeyId`, and `Date` from form or manual input sources.  
  - Connections: Feeds remediation and audit actions.

---

#### 1.2 Key Information Retrieval

**Overview:**  
Fetches all access keys for the specified IAM user and parses the response to structure key metadata.

**Nodes Involved:**  
- 🔑 Fetch User Access Keys  
- 📊 Parse Access Key Response  
- ⚡ No Operation, do nothing

**Node Details:**

- **🔑 Fetch User Access Keys**  
  - Type: HTTP Request  
  - Role: Calls AWS IAM API `ListAccessKeys` for the specified user.  
  - Config: POST request with form-urlencoded body including `UserName` and AWS credentials.  
  - Output: Raw AWS XML/JSON response.  
  - Failures: AWS auth errors, invalid username.

- **📊 Parse Access Key Response**  
  - Type: Code  
  - Role: Parses AWS API response to extract access key metadata: ID, username, status, and creation date (converted from epoch).  
  - Key expressions: Loops over `AccessKeyMetadata`, builds JSON with keys like `AccessKeyId1`, `UserName1`, etc.  
  - Output: Structured JSON object with all keys.  
  - Failures: Parsing errors if response malformed.

- **⚡ No Operation, do nothing**  
  - Type: NoOp  
  - Role: Placeholder/no action node after parsing keys.  
  - Usage: To facilitate branching or output continuation.

---

#### 1.3 Human Approval

**Overview:**  
Sends a Slack message to request approval from a security team member before proceeding with remediation.

**Nodes Involved:**  
- 🔔 Request Human Approval  
- ✅ Approved Compromise Data (already described)

**Node Details:**

- **🔔 Request Human Approval**  
  - Type: Slack node  
  - Role: Sends a message to a specified Slack user with user/key details and waits for an interactive approval response.  
  - Config: Uses Slack OAuth2 credentials, message templated with user input data.  
  - Output: Passes data along after approval or timeout.  
  - Failures: Slack API rate limits, user non-response, webhook errors.

---

#### 1.4 Remediation Actions

**Overview:**  
Automatically disables the compromised access key and creates then attaches a restrictive policy to invalidate temporary credentials.

**Nodes Involved:**  
- 🚫 Deactivate Compromised Key  
- 🛡️ Generate Invalidation Policy  
- 🔗 Apply Security Policy  
- 🔀 Merge Response Data

**Node Details:**

- **🚫 Deactivate Compromised Key**  
  - Type: HTTP Request  
  - Role: Calls AWS `UpdateAccessKey` to set the compromised key’s status to `Inactive`.  
  - Config: Uses form-urlencoded POST with `UserName`, `AccessKeyId`, `Status: Inactive`.  
  - Error handling: Continues workflow even if errors occur (important for resilience).  
  - Failures: AWS permission denied, invalid key ID.

- **🛡️ Generate Invalidation Policy**  
  - Type: HTTP Request  
  - Role: Creates a new IAM policy that denies all actions if temporary credential token issue time is older than 3 days.  
  - Config: Dynamic policy document JSON with date condition; policy name includes current date and random suffix.  
  - Failures: AWS API errors, JSON serialization issues.

- **🔗 Apply Security Policy**  
  - Type: HTTP Request  
  - Role: Attaches the newly created invalidation policy to the user to enforce temporary credential invalidation.  
  - Config: Uses `PolicyArn` from policy creation response and the username.  
  - Failures: Attachment errors, AWS permission issues.

- **🔀 Merge Response Data**  
  - Type: Merge  
  - Role: Aggregates results from multiple remediation nodes into a single output object.  
  - Config: Handles multiple inputs, keeping a consolidated view of all remediation steps.

---

#### 1.5 Policy Auditing

**Overview:**  
Retrieves and processes all inline and attached policies of the affected user for security analysis.

**Nodes Involved:**  
- 📜 Audit Inline Policies  
- 📤 Extract Inline Policy Names  
- 🔄 Batch Process Inline Policies  
- 📜 Retrieve Inline Policy Details  
- 🔓 Parse Inline Policy JSON  
- ⚡ Inline Policy Router  
- 📜 Audit Attached Policies  
- 📤 Extract Attached Policy List  
- 🔄 Batch Process Attached Policies  
- 📋 Fetch Policy Metadata  
- 📄 Retrieve Policy Document  
- 🔓 Parse Attached Policy JSON  
- ⚡ Attached Policy Router

**Node Details:**

- **📜 Audit Inline Policies**  
  - Type: HTTP Request  
  - Role: Calls AWS `ListUserPolicies` to list all inline policy names for the user.  
  - Output: List of inline policy names.  
  - Failures: AWS API errors, permission issues.

- **📤 Extract Inline Policy Names**  
  - Type: SplitOut  
  - Role: Converts the list of inline policy names into individual items for batch processing.  
  - Failures: Empty list handling.

- **🔄 Batch Process Inline Policies**  
  - Type: SplitInBatches  
  - Role: Processes inline policies one by one to avoid API rate limits.  
  - Connections: Outputs to retrieve inline policy detail node.

- **📜 Retrieve Inline Policy Details**  
  - Type: HTTP Request  
  - Role: Retrieves the full policy document for each inline policy via `GetUserPolicy`.  
  - Input parameters: Username and policy name.  
  - Failures: AWS API errors, invalid policy name.

- **🔓 Parse Inline Policy JSON**  
  - Type: Code  
  - Role: Decodes URL-encoded policy documents and parses JSON. Handles errors by marking invalid policies.  
  - Output: JSON with decoded policy, username, and policy name.

- **⚡ Inline Policy Router**  
  - Type: NoOp  
  - Role: Used to organize inline policy processing flow.

- **📜 Audit Attached Policies**  
  - Type: HTTP Request  
  - Role: Calls AWS `ListAttachedUserPolicies` to get attached policies metadata (ARNs) for the user.  
  - Output: List of attached policies.

- **📤 Extract Attached Policy List**  
  - Type: SplitOut  
  - Role: Splits attached policies list into individual items for batch processing.

- **🔄 Batch Process Attached Policies**  
  - Type: SplitInBatches  
  - Role: Processes attached policies one by one to avoid rate limits.  
  - Outputs to fetch policy metadata.

- **📋 Fetch Policy Metadata**  
  - Type: HTTP Request  
  - Role: Gets metadata for each attached policy via `GetPolicy`.  
  - Input: Policy ARN.

- **📄 Retrieve Policy Document**  
  - Type: HTTP Request  
  - Role: Retrieves the default version of the policy document via `GetPolicyVersion`.  
  - Input: Policy ARN and version ID from metadata.

- **🔓 Parse Attached Policy JSON**  
  - Type: Code  
  - Role: Decodes and parses the attached policy document JSON with error handling.

- **⚡ Attached Policy Router**  
  - Type: NoOp  
  - Role: Organizes attached policy processing flow.

---

#### 1.6 Data Aggregation

**Overview:**  
Aggregates all output from remediation, inline policy audits, and attached policy audits into a single comprehensive dataset.

**Nodes Involved:**  
- 🔀 Merge Response Data  
- 📦 Aggregate Final Results

**Node Details:**

- **🔀 Merge Response Data**  
  - Type: Merge  
  - Role: Merges six input streams (key deactivation, policy generation, inline policies, attached policies, etc.) into one dataset.  
  - Config: Merges by combining item data.

- **📦 Aggregate Final Results**  
  - Type: Aggregate  
  - Role: Aggregates all merged data into a single JSON object for consumption by AI analysis.  
  - Failures: Data inconsistencies or empty inputs.

---

#### 1.7 AI Security Analysis

**Overview:**  
Uses Claude AI via Langchain integration to generate a simplified, human-readable summary of the incident and response status, formatted for Slack.

**Nodes Involved:**  
- 🤖 AI Security Analysis  
- 🧠 Claude AI Engine

**Node Details:**

- **🤖 AI Security Analysis**  
  - Type: Langchain Agent (AI Language Model)  
  - Role: Sends aggregated data JSON to Claude AI with a detailed prompt instructing it to produce a simple, clear security incident summary and Slack-compatible report.  
  - Prompt includes instructions on formatting, content focus, and Slack markdown syntax.  
  - Failures: AI model response errors, timeout, malformed JSON input.

- **🧠 Claude AI Engine**  
  - Type: Langchain LM Chat Anthropic (Claude 3.7 Sonnet)  
  - Role: Executes the natural language generation for the prompt.  
  - Credentials: Anthropic API keys configured.  
  - Failures: API limits, network errors.

---

#### 1.8 Notification

**Overview:**  
Posts the AI-generated security report summary to a designated Slack channel for the security team.

**Nodes Involved:**  
- 💬 Notify Security Team

**Node Details:**

- **💬 Notify Security Team**  
  - Type: Slack  
  - Role: Sends the formatted text output from AI analysis to a specific Slack channel.  
  - Config: Channel ID specified, uses Slack OAuth2 credentials.  
  - Message prepends "🚫 AWS Key Compromise Summary" and includes AI output.  
  - Failures: Slack API errors, channel access issues.

---

### 3. Summary Table

| Node Name                        | Node Type                       | Functional Role                             | Input Node(s)                                  | Output Node(s)                                | Sticky Note                                                                                       |
|---------------------------------|--------------------------------|--------------------------------------------|-----------------------------------------------|-----------------------------------------------|-------------------------------------------------------------------------------------------------|
| 📝 Secure Form: Key Compromise Input | Form Trigger                   | Receives compromised user/key input        |                                               | 🔧 Process Form Submission                     | # ✏️ Manual Entry: UserName & AccessKeyId                                                       |
| 🔧 Process Form Submission       | Set                            | Maps form fields to workflow variables      | 📝 Secure Form: Key Compromise Input           | 🔔 Request Human Approval                      | # ✏️ Human in the loop<br>Wait for approval before continuing                                    |
| 🔍 Manual Key Lookup Trigger     | Manual Trigger                 | Manual start trigger alternative            |                                               | 🔍 AWS IAM Service                             | ## 🔍 Retrieve IAM Key Info                                                                      |
| 🔍 AWS IAM Service               | AWS IAM                        | Fetches all IAM user info                    | 🔍 Manual Key Lookup Trigger                   | 🔑 Fetch User Access Keys                      | ## 🔍 Retrieve IAM Key Info                                                                      |
| 🔑 Fetch User Access Keys        | HTTP Request                   | Lists user access keys                        | 🔍 AWS IAM Service                             | 📊 Parse Access Key Response                   | ## 🔍 Retrieve IAM Key Info                                                                      |
| 📊 Parse Access Key Response     | Code                           | Parses access keys metadata                   | 🔑 Fetch User Access Keys                      | ⚡ No Operation, do nothing                     | ## 🔍 Retrieve IAM Key Info                                                                      |
| ⚡ No Operation, do nothing      | NoOp                           | Placeholder/no operation                      | 📊 Parse Access Key Response                   |                                               | ## 🔍 Retrieve IAM Key Info                                                                      |
| 🔔 Request Human Approval        | Slack                         | Sends approval request to Slack user         | 🔧 Process Form Submission                     | ✅ Approved Compromise Data                    | # ✏️ Human in the loop<br>Wait for approval before continuing                                    |
| ✅ Approved Compromise Data      | Set                            | Consolidates approved user and key info      | 🔔 Request Human Approval                      | 🛡️ Generate Invalidation Policy<br>🚫 Deactivate Compromised Key<br>📜 Audit Inline Policies<br>🔍 Audit Attached Policies<br>🔀 Merge Response Data | # ✏️ Selected UserName & AccessKeyId                                                           |
| 🛡️ Generate Invalidation Policy | HTTP Request                   | Creates a restrictive invalidation policy   | ✅ Approved Compromise Data                     | 🔗 Apply Security Policy<br>🔀 Merge Response Data | ## 🛠 Create Security Policy [Invalidating-Temporary-Security-Credentials]                      |
| 🔗 Apply Security Policy         | HTTP Request                   | Attaches the invalidation policy to user    | 🛡️ Generate Invalidation Policy                | 🔀 Merge Response Data                         | ## 🔗 Attach Security Policy [Invalidating-Temporary-Security-Credentials]]                     |
| 🚫 Deactivate Compromised Key    | HTTP Request                   | Deactivates compromised AWS access key      | ✅ Approved Compromise Data                     | 🔀 Merge Response Data                         | ## 🚫 Disable Compromised Key                                                                   |
| 📜 Audit Inline Policies         | HTTP Request                   | Lists inline policies attached to user      | ✅ Approved Compromise Data                     | 📤 Extract Inline Policy Names                 | ## 🔄 Process Each Inline Policy                                                                |
| 📤 Extract Inline Policy Names   | SplitOut                      | Splits inline policy names for processing    | 📜 Audit Inline Policies                        | 🔄 Batch Process Inline Policies               | ## 🔄 Process Each Inline Policy                                                                |
| 🔄 Batch Process Inline Policies | SplitInBatches                | Processes inline policies one at a time      | 📤 Extract Inline Policy Names                  | 🔀 Merge Response Data<br>📜 Retrieve Inline Policy Details | ## 🔄 Process Each Inline Policy                                                                |
| 📜 Retrieve Inline Policy Details | HTTP Request                   | Retrieves inline policy documents             | 🔄 Batch Process Inline Policies                | 🔓 Parse Inline Policy JSON                     | ## 🔄 Process Each Inline Policy                                                                |
| 🔓 Parse Inline Policy JSON      | Code                           | Decodes and parses inline policy JSON        | 📜 Retrieve Inline Policy Details               | ⚡ Inline Policy Router                         | ## 🔄 Process Each Inline Policy                                                                |
| ⚡ Inline Policy Router          | NoOp                           | Routes inline policy processing flow          | 🔓 Parse Inline Policy JSON                      | 🔀 Merge Response Data                         | ## 🔄 Process Each Inline Policy                                                                |
| 📜 Audit Attached Policies       | HTTP Request                   | Lists attached managed policies for user     | ✅ Approved Compromise Data                     | 📤 Extract Attached Policy List                 | ## 🔄 Process Each Attached Policy                                                              |
| 📤 Extract Attached Policy List  | SplitOut                      | Splits attached policies list into items     | 📜 Audit Attached Policies                      | 🔄 Batch Process Attached Policies             | ## 🔄 Process Each Attached Policy                                                              |
| 🔄 Batch Process Attached Policies | SplitInBatches                | Processes attached policies one at a time    | 📤 Extract Attached Policy List                  | 🔀 Merge Response Data<br>📋 Fetch Policy Metadata | ## 🔄 Process Each Attached Policy                                                              |
| 📋 Fetch Policy Metadata         | HTTP Request                   | Retrieves attached policy metadata            | 🔄 Batch Process Attached Policies               | 📄 Retrieve Policy Document                     | ## 🔄 Process Each Attached Policy                                                              |
| 📄 Retrieve Policy Document      | HTTP Request                   | Retrieves attached policy document version    | 📋 Fetch Policy Metadata                         | 🔓 Parse Attached Policy JSON                   | ## 🔄 Process Each Attached Policy                                                              |
| 🔓 Parse Attached Policy JSON    | Code                           | Decodes and parses attached policy JSON       | 📄 Retrieve Policy Document                      | ⚡ Attached Policy Router                        | ## 🔄 Process Each Attached Policy                                                              |
| ⚡ Attached Policy Router        | NoOp                           | Routes attached policy processing flow         | 🔓 Parse Attached Policy JSON                     | 🔀 Merge Response Data                         | ## 🔄 Process Each Attached Policy                                                              |
| 🔀 Merge Response Data           | Merge                         | Aggregates outputs from remediation & audits | 🛡️ Generate Invalidation Policy, 🚫 Deactivate Compromised Key, ⚡ Inline Policy Router, ⚡ Attached Policy Router | 📦 Aggregate Final Results                     | ## 🤖 Generate Security Report                                                                 |
| 📦 Aggregate Final Results       | Aggregate                     | Aggregates merged data into single JSON       | 🔀 Merge Response Data                           | 🤖 AI Security Analysis                         | ## 🤖 Generate Security Report                                                                 |
| 🤖 AI Security Analysis          | Langchain Agent (AI Model)    | Generates simplified security summary report  | 📦 Aggregate Final Results                       | 💬 Notify Security Team                         | ## 🤖 Generate Security Report                                                                 |
| 🧠 Claude AI Engine              | Langchain LM Chat             | Executes AI prompt using Claude model          | 🤖 AI Security Analysis                          |                                               | ## 🤖 Generate Security Report                                                                 |
| 💬 Notify Security Team          | Slack                         | Sends AI-generated report to Slack channel     | 🤖 AI Security Analysis                          |                                               | ## 🤖 Generate Security Report                                                                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Input Nodes:**

   - Add a **Form Trigger** node named `📝 Secure Form: Key Compromise Input`.  
     - Configure form with fields: `Username` (required), `AccessKeyID` (required).  
     - Enable basic authentication with appropriate credentials.

   - Add a **Manual Trigger** node named `🔍 Manual Key Lookup Trigger` for manual workflow start.

2. **Process Input:**

   - Add a **Set** node named `🔧 Process Form Submission`.  
     - Assign variables:  
       - `UserName` = `{{$json.Username}}`  
       - `AccessKeyId` = `{{$json.AccessKeyID}}`  
       - `Date` = current date in ISO format (e.g., `{{ new Date().toISOString().split("T")[0] }}`)  
     - Connect form trigger output to this node.

3. **Request Human Approval:**

   - Add a **Slack** node named `🔔 Request Human Approval`.  
     - Set operation to `sendAndWait`.  
     - Configure message template with user and key details for approval.  
     - Use Slack OAuth2 credentials.  
     - Connect `🔧 Process Form Submission` output to this node.

4. **Store Approved Data:**

   - Add a **Set** node named `✅ Approved Compromise Data`.  
     - Assign variables from Slack approval output or form:  
       - `UserName`, `AccessKeyId`, `Date`.  
     - Connect approval node output here.

5. **Fetch and Parse User Access Keys:**

   - Add an **HTTP Request** node named `🔑 Fetch User Access Keys`.  
     - Method: POST to `https://iam.amazonaws.com`.  
     - Body parameters (form-urlencoded):  
       - `Action` = `ListAccessKeys`  
       - `Version` = `2010-05-08`  
       - `UserName` = `={{ $json.UserName }}`  
     - Use AWS credentials with IAM permissions.

   - Add a **Code** node named `📊 Parse Access Key Response`.  
     - JavaScript to parse access key metadata from AWS response, creating structured JSON with access key details.  
     - Connect from `🔍 AWS IAM Service` or manual trigger for manual lookup.

   - Add a **NoOp** node named `⚡ No Operation, do nothing` connected after parsing.

6. **Remediation Actions:**

   - Add an **HTTP Request** node `🚫 Deactivate Compromised Key`.  
     - POST to `https://iam.amazonaws.com` with parameters:  
       - `Action` = `UpdateAccessKey`  
       - `Version` = `2010-05-08`  
       - `UserName` = `={{ $json.UserName }}`  
       - `AccessKeyId` = `={{ $json.AccessKeyId }}`  
       - `Status` = `Inactive`  
     - Use AWS credentials.  
     - Set onError to continue workflow on failure.

   - Add an **HTTP Request** node `🛡️ Generate Invalidation Policy`.  
     - POST to create a policy with document denying actions for credentials older than 3 days.  
     - Use dynamic policy name including date and random suffix.

   - Add an **HTTP Request** node `🔗 Apply Security Policy`.  
     - Attach the created policy to the user by ARN.

7. **Policy Auditing:**

   - Inline Policies:  
     - Add `📜 Audit Inline Policies` (ListUserPolicies).  
     - Add `📤 Extract Inline Policy Names` (SplitOut).  
     - Add `🔄 Batch Process Inline Policies` (SplitInBatches).  
     - Add `📜 Retrieve Inline Policy Details` (GetUserPolicy).  
     - Add `🔓 Parse Inline Policy JSON` (Code to decode/parse).  
     - Add `⚡ Inline Policy Router` (NoOp).

   - Attached Policies:  
     - Add `📜 Audit Attached Policies` (ListAttachedUserPolicies).  
     - Add `📤 Extract Attached Policy List` (SplitOut).  
     - Add `🔄 Batch Process Attached Policies` (SplitInBatches).  
     - Add `📋 Fetch Policy Metadata` (GetPolicy).  
     - Add `📄 Retrieve Policy Document` (GetPolicyVersion).  
     - Add `🔓 Parse Attached Policy JSON` (Code).  
     - Add `⚡ Attached Policy Router` (NoOp).

8. **Data Aggregation:**

   - Add a **Merge** node `🔀 Merge Response Data`.  
     - Configure to merge all outputs: key deactivation, policy creation/application, inline and attached policy parsing.

   - Add an **Aggregate** node `📦 Aggregate Final Results`.  
     - Aggregate all merged data into one JSON object.

9. **AI Security Analysis:**

   - Add a **Langchain Agent** node `🤖 AI Security Analysis`.  
     - Input: Aggregated JSON data as text.  
     - Prompt: Detailed instructions for summarizing AWS key compromise responses into Slack-compatible markdown.

   - Add a **Langchain LM Chat Anthropic** node `🧠 Claude AI Engine`.  
     - Model: `claude-3-7-sonnet-20250219`.  
     - Connect AI Security Analysis to this node for execution.

10. **Notification:**

    - Add a **Slack** node `💬 Notify Security Team`.  
      - Post message to specified Slack channel with AI-generated security report.  
      - Use Slack OAuth2 credentials.  
      - Connect output from AI Security Analysis.

---

### 5. General Notes & Resources

| Note Content                                                                                                                       | Context or Link                                                                                           |
|-----------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| Workflow includes human-in-the-loop approval via Slack interactive messages to ensure manual oversight of automated remediation. | Workflow design principle for controlled security response.                                               |
| The AI prompt instructs Claude AI to produce summaries using Slack markdown supported formatting for clear communication.          | Prompt embedded in 🤖 AI Security Analysis node.                                                          |
| AWS IAM API calls rely on credentials with permissions to list, update access keys, create policies, and attach policies.          | Ensure AWS credential used has proper IAM permissions (e.g., `iam:ListAccessKeys`, `iam:UpdateAccessKey`). |
| Slack integration requires OAuth2 credentials with permissions to send messages and interact with specific users/channels.        | Slack API scopes: `chat:write`, `im:write`, `users:read`.                                                |
| The invalidation policy denies all actions for sessions older than 3 days — a security best practice for temporary credential invalidation. | Policy JSON defined in `🛡️ Generate Invalidation Policy` node.                                           |
| The workflow uses batch processing nodes to avoid AWS API rate limits when retrieving and parsing multiple policies.              | Batch size not explicitly set; default is 1.                                                             |
| Error handling configured to continue on errors for critical remediation steps to maximize resilience.                            | Seen in `🚫 Deactivate Compromised Key`, `📜 Audit Inline Policies`, `🛡️ Generate Invalidation Policy`.     |
| For testing or development, manual triggers and form inputs facilitate flexible initiation of the workflow.                       | `🔍 Manual Key Lookup Trigger` and `📝 Secure Form: Key Compromise Input` nodes.                           |

---

**Disclaimer:** The text provided is exclusively derived from an automated workflow created with n8n, respecting all content policies and handling only legal and public data.