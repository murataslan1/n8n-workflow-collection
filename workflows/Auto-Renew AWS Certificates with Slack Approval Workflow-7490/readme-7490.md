Auto-Renew AWS Certificates with Slack Approval Workflow

https://n8nworkflows.xyz/workflows/auto-renew-aws-certificates-with-slack-approval-workflow-7490


# Auto-Renew AWS Certificates with Slack Approval Workflow

### 1. Workflow Overview

This workflow automates the renewal process of AWS ACM (Amazon Certificate Manager) certificates that are nearing expiration by integrating Slack for approval. It is designed primarily for SRE/DevOps teams, cloud operations, or MSPs managing multiple AWS certificates, enabling them to have hands-off renewals with an interactive approval step via Slack. The workflow runs on a scheduled basis, fetches all certificates, filters those expiring soon, requests approval through Slack, and renews certificates automatically upon approval.

Logical Blocks:

- **1.1 Schedule Trigger:** Initiates the workflow on a set schedule (daily).
- **1.2 AWS ACM Certificates Retrieval:** Fetches all ACM certificates from AWS.
- **1.3 Certificate Expiry Filtering:** Filters certificates that will expire within the next 7 days and are already valid.
- **1.4 Slack Notification and Approval:** Sends a detailed Slack message for approval and waits for the user response.
- **1.5 Certificate Renewal:** Renews the approved certificate via AWS ACM.
- **1.6 Post-Renewal Notification:** Notifies the IT admin via Slack about the successful renewal.

---

### 2. Block-by-Block Analysis

#### 1.1 Schedule Trigger

- **Overview:**  
Starts the workflow automatically on a scheduled basis without manual intervention, typically daily.

- **Nodes Involved:**  
  - Schedule Trigger

- **Node Details:**  
  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Configuration: Runs once daily (default interval configuration, can be customized)  
    - Input: None (trigger node)  
    - Output: Triggers next node ("Get many certificates")  
    - Version: 1.2  
    - Edge Cases: Ensure server time and timezone align with intended schedule; if the node fails to trigger, no renewal checks occur that day.

#### 1.2 AWS ACM Certificates Retrieval

- **Overview:**  
Fetches all ACM certificates across the configured AWS region(s) using AWS credentials.

- **Nodes Involved:**  
  - Get many certificates

- **Node Details:**  
  - **Get many certificates**  
    - Type: AWS Certificate Manager (AWS ACM) node  
    - Operation: `getMany` to retrieve multiple certificates  
    - Configuration: Uses AWS credentials with permissions `acm:ListCertificates` and region configured appropriately  
    - Input: Triggered by Schedule Trigger  
    - Output: Passes all certificate data to filter node  
    - Version: 1  
    - Edge Cases: Pagination may be required for large numbers of certificates (not explicitly handled here); AWS API throttling or permission errors possible.

#### 1.3 Certificate Expiry Filtering

- **Overview:**  
Filters certificates to select only those that are currently valid (`NotBefore` before today) and will expire within the next 7 days (`NotAfter` before `today + 7 days`).

- **Nodes Involved:**  
  - Cert expire in next 7 days?

- **Node Details:**  
  - **Cert expire in next 7 days?**  
    - Type: Filter node  
    - Conditions:  
      - `NotAfter` date/time is before today plus 7 days (certificate expires soon)  
      - `NotBefore` date/time is before today (certificate is already valid)  
    - Input: All certificates from "Get many certificates"  
    - Output: Only certificates meeting conditions are passed to Slack notification  
    - Version: 2.2  
    - Key Expressions: `{{ $json.NotAfter.toDateTime('s') }}`, `{{ $today.plus(7,'days') }}`, `{{ $json.NotBefore.toDateTime('s') }}`, `{{ $today }}`  
    - Edge Cases: Certificates with invalid or missing date fields may cause expression errors; certificates already expired are filtered out (can be extended with OR condition for expired certs if needed).

#### 1.4 Slack Notification and Approval

- **Overview:**  
Sends an interactive Slack message to a specified user with certificate details and waits for an approval or rejection button click, pausing the workflow until a response is received.

- **Nodes Involved:**  
  - Send message and wait for response

- **Node Details:**  
  - **Send message and wait for response**  
    - Type: Slack node (Send & Wait operation)  
    - Configuration:  
      - Authenticated via OAuth2 Slack credentials  
      - Sends a formatted message with certificate details: Domain Name, SANs, ARN, Key Algorithm, Status, Issued At, Expires At  
      - Message includes two buttons: Approve and Reject  
      - Waits for user interaction before continuing  
      - Target user specified (user ID U054RMBTVBM, cached as "trung.tran")  
    - Input: Filtered certificates from "Cert expire in next 7 days?"  
    - Output: Passes to renewal node if approved  
    - Version: 2.3  
    - Edge Cases: Slack API rate limits, network issues, or user not responding leading to workflow pause; OAuth2 token expiration; user ID must be valid and have permission to receive message.

#### 1.5 Certificate Renewal

- **Overview:**  
If the Slack approval is received, this node triggers the AWS ACM certificate renewal process using the certificate ARN.

- **Nodes Involved:**  
  - Renew a certificate

- **Node Details:**  
  - **Renew a certificate**  
    - Type: AWS Certificate Manager node  
    - Operation: `renew` certificate identified by ARN mapped from Slack approval output  
    - Configuration: Uses AWS credentials with permissions `acm:RenewCertificate`  
    - Input: Certificate ARN from Slack approval node  
    - Output: Passes to IT admin notification node  
    - Version: 1  
    - Edge Cases: AWS renewal API failure, invalid or expired ARN, permission issues.

#### 1.6 Post-Renewal Notification

- **Overview:**  
Sends a confirmation Slack message to the IT admin indicating successful renewal with certificate details and approval metadata.

- **Nodes Involved:**  
  - Inform IT Admin

- **Node Details:**  
  - **Inform IT Admin**  
    - Type: Slack node (simple send message)  
    - Configuration:  
      - Authenticated via OAuth2 Slack credentials  
      - Sends a formatted message with Domain, ARN, previous expiry date, renewal timestamp, and user who approved  
      - Targets the same Slack user as approval (U054RMBTVBM)  
    - Input: Output of "Renew a certificate" node  
    - Output: None (end node)  
    - Version: 2.3  
    - Edge Cases: Slack API or network failures, OAuth token expiration.

---

### 3. Summary Table

| Node Name                    | Node Type                 | Functional Role                      | Input Node(s)               | Output Node(s)               | Sticky Note                                                                                   |
|------------------------------|---------------------------|------------------------------------|-----------------------------|-----------------------------|------------------------------------------------------------------------------------------------|
| Schedule Trigger             | Schedule Trigger          | Initiates workflow on schedule     | None                        | Get many certificates        | ### 1. Schedule Trigger The workflow starts on a scheduled basis (e.g., daily at 09:00)        |
| Get many certificates        | AWS Certificate Manager   | Retrieves AWS ACM certificates     | Schedule Trigger            | Cert expire in next 7 days?  | ### 2. Get Certificates Fetches all ACM certificates in the configured AWS region(s)          |
| Cert expire in next 7 days?  | Filter                    | Filters certificates expiring soon | Get many certificates       | Send message and wait for response | ### 3. Filter Certificates Expiring Soon Checks each certificate and keeps only those expiring within 7 days |
| Send message and wait for response | Slack (Send & Wait)    | Sends Slack approval message       | Cert expire in next 7 days? | Renew a certificate          | ### 4. Notify via Slack and Wait for Approval Sends Slack message and pauses for Approve/Reject |
| Renew a certificate          | AWS Certificate Manager   | Renews certificate on approval     | Send message and wait for response | Inform IT Admin         | ### 5. Renew Certificate Renews cert if approved; ends if rejected                            |
| Inform IT Admin              | Slack (Send message)      | Notifies admin of successful renewal | Renew a certificate         | None                        | ### 6. Notify admin via Slack                                                                 |
| Sticky Note                 | Sticky Note               | Documentation and annotations      | None                        | None                        | Contains detailed workflow description and setup instructions                                 |
| Sticky Note1                | Sticky Note               | Documentation                      | None                        | None                        | ### 1. Schedule Trigger The workflow starts on a scheduled basis                              |
| Sticky Note2                | Sticky Note               | Documentation                      | None                        | None                        | ### 2. Get Certificates Fetches all ACM certificates                                          |
| Sticky Note3                | Sticky Note               | Documentation                      | None                        | None                        | ### 3. Filter Certificates Expiring Soon                                                     |
| Sticky Note4                | Sticky Note               | Documentation                      | None                        | None                        | ### 4. Notify via Slack and Wait for Approval                                                |
| Sticky Note5                | Sticky Note               | Documentation                      | None                        | None                        | ### 5. Renew Certificate                                                                    |
| Sticky Note6                | Sticky Note               | Visual reference (screenshot)      | None                        | None                        | ![](https://wisestackai.s3.ap-southeast-1.amazonaws.com/Screenshot+2025-08-17+at+12.00.30%E2%80%AFPM.png) |
| Sticky Note7                | Sticky Note               | Documentation                      | None                        | None                        | ### 6. Notify admin via Slack                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n.**

2. **Add a Schedule Trigger node:**  
   - Type: Schedule Trigger  
   - Configure to run daily at a desired time (e.g., 09:00 local time)  
   - No credentials needed  

3. **Add AWS Certificate Manager node ("Get many certificates"):**  
   - Type: AWS Certificate Manager  
   - Operation: `getMany`  
   - Credentials: Configure AWS credentials with permissions including `acm:ListCertificates`, `acm:DescribeCertificate`  
   - Region: Set to your ACM region  
   - Connect Schedule Trigger output to this node input

4. **Add a Filter node ("Cert expire in next 7 days?"):**  
   - Type: Filter  
   - Configure conditions with AND combinator:  
     - Condition 1: `{{ $json.NotAfter.toDateTime('s') }}` **is before** `{{ $today.plus(7,'days') }}`  
     - Condition 2: `{{ $json.NotBefore.toDateTime('s') }}` **is before** `{{ $today }}`  
   - Input: Connect from "Get many certificates" output  
   - Output: Passes only certificates expiring soon and currently valid

5. **Add Slack node ("Send message and wait for response"):**  
   - Type: Slack  
   - Operation: `sendAndWait` (Send message and wait for button response)  
   - Credentials: Configure Slack OAuth2 credentials with bot permissions to post messages and respond to interactivity  
   - Set target user by Slack User ID (e.g., `U054RMBTVBM`)  
   - Message text: Use template:  
     ```
     :warning: *AWS ACM Certificate Expiry Alert* :warning:

     *Domain Name:* {{ $json.DomainName }}
     *Alternate Names:* {{ $json.SubjectAlternativeNameSummaries }}
     *Certificate ARN:* {{ $json.CertificateArn }}
     *Key Algorithm:* {{ $json.KeyAlgorithm }}
     *Status:* {{ $json.Status }}
     *Issued At:* {{ $json.IssuedAt.toDateTime('s') }}
     *Expires At:* {{ $json.NotAfter.toDateTime('s') }}

     Please confirm renewal action to proceed.
     ```
   - Add two buttons: Approve and Reject  
   - Connect Filter node’s output to this Slack node’s input

6. **Add AWS Certificate Manager node ("Renew a certificate"):**  
   - Type: AWS Certificate Manager  
   - Operation: `renew` certificate  
   - Credentials: Same AWS credentials as before with permission `acm:RenewCertificate`  
   - Set parameter “CertificateArn” to expression referencing Slack node output, e.g.:  
     `={{ $('Cert expire in next 7 days?').item.json.CertificateArn }}` or direct from Slack approval output depending on data path  
   - Connect Slack node output to this node input (only proceed on Approve)

7. **Add Slack node ("Inform IT Admin"):**  
   - Type: Slack  
   - Operation: `sendMessage` (simple send)  
   - Credentials: Same Slack OAuth2 credentials  
   - Target user same as approval user or IT admin user  
   - Message text template:  
     ```
     =:white_check_mark: *ACM Certificate Renewed Successfully*

     *Domain:* {{ $('Cert expire in next 7 days?').item.json.DomainName }}
     *ARN:* {{ $('Cert expire in next 7 days?').item.json.CertificateArn }}
     *Previous Expiry:* {{ $('Cert expire in next 7 days?').item.json.NotAfter.toDateTime('s') }}
     *Renewed At:* {{ $now }}

     Approved by: {{ $('Send message and wait for response').item.json.user?.name || $('Send message and wait for response').item.json.username || 'N/A' }}
     ```
   - Connect “Renew a certificate” output to this node input

8. **Activate and test the workflow:**  
   - Ensure all credentials are valid and have necessary permissions  
   - Test with a certificate expiring soon or adjust filter to test logic  
   - Monitor Slack messages and approval flow

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                     | Context or Link                                                                                                              |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------|
| This workflow is intended for SRE/DevOps teams managing many AWS ACM certificates who want automated renewals with an approval step integrated in Slack. It supports hands-off renewals with audit trails via Slack interaction.                                   | Workflow description in Sticky Note                                                                                            |
| Slack's Send & Wait node pauses the workflow until a user clicks Approve or Reject, allowing change control and manual approval in an automated process.                                                                                                        | Workflow feature                                                                                                              |
| Required AWS IAM permissions include `acm:ListCertificates`, `acm:DescribeCertificate`, and `acm:RenewCertificate`. The AWS credentials must be scoped to the ACM region(s) you manage.                                                                              | AWS permissions                                                                                                              |
| Slack OAuth2 bot requires permission to post messages and to handle interactive components (buttons) in the target channel or direct messages.                                                                                                                   | Slack Bot setup                                                                                                              |
| Customization ideas include changing the expiry window (7 days), adding handling for already expired certs, bypassing Slack for auto-renewal on low-risk domains, supporting multiple AWS regions/accounts, and adding escalation logic for no response cases.     | Workflow extension notes                                                                                                     |
| Screenshot reference available for workflow UI layout: ![](https://wisestackai.s3.ap-southeast-1.amazonaws.com/Screenshot+2025-08-17+at+12.00.30%E2%80%AFPM.png)                                                                                             | Visual reference                                                                                                             |

---

**Disclaimer:**  
The text provided originates solely from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.