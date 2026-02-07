Automate Cross-Project Dependency Tracking between Jira and Monday

https://n8nworkflows.xyz/workflows/automate-cross-project-dependency-tracking-between-jira-and-monday-9684


# Automate Cross-Project Dependency Tracking between Jira and Monday

### 1. Workflow Overview

This workflow automates cross-project dependency tracking between Jira and Monday.com, aiming to help project managers monitor and manage blocking issues that could delay project deliveries. It runs on a nightly schedule to scan all open Jira issues, identify dependencies, calculate risk scores related to due dates, and proactively coordinate resolution steps.

Logical blocks grouped by function and dependencies:

- **1.1 Input Reception and Scheduling**  
  Starts with a nightly cron trigger that initiates the workflow.

- **1.2 Jira Data Fetching and Filtering**  
  Queries Jira for all open issues in a specified project and filters out issues without any dependencies.

- **1.3 Dependency Extraction and Impact Calculation**  
  Parses issue links to extract detailed dependency info, then computes risk scores based on due dates and dependency types.

- **1.4 Task Creation and Notifications**  
  Creates coordination tasks in Jira for high-impact blockers, syncs items to Monday.com, and sends formatted email reports and Slack alerts.

- **1.5 Reporting**  
  Formats the collected data into an HTML email report summarizing blocking and blocked issues with risk indicators.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Scheduling

- **Overview:**  
  Triggers the workflow once daily at midnight to generate a fresh dependency report.

- **Nodes Involved:**  
  - Trigger (Nightly Run)  
  - Note - Trigger (sticky note)

- **Node Details:**  
  - **Trigger (Nightly Run)**  
    - Type: Cron Trigger  
    - Configuration: Runs once daily at 00:00 (midnight) by default  
    - Inputs: None (start node)  
    - Outputs: Initiates Fetch Open Jira Issues node  
    - Edge cases: Misconfigured timezone may cause unexpected run times; no input validation needed.  
  - **Note - Trigger**  
    - Type: Sticky Note  
    - Purpose: Documents trigger schedule and configuration tips.

#### 2.2 Jira Data Fetching and Filtering

- **Overview:**  
  Fetches all open issues from a specified Jira project and filters to only those with linked dependencies.

- **Nodes Involved:**  
  - Fetch Open Jira Issues  
  - Filter Dependencies  
  - Note - Fetch (sticky note)  
  - Note - Filter (sticky note)

- **Node Details:**  
  - **Fetch Open Jira Issues**  
    - Type: Jira node (operation: getAll)  
    - Configuration: JQL set to `project = YOUR_PROJECT_KEY AND statusCategory != Done` (user must replace `YOUR_PROJECT