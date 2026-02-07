Automate Workflow Execution with Telegram Bot Command Center

https://n8nworkflows.xyz/workflows/automate-workflow-execution-with-telegram-bot-command-center-9951


# Automate Workflow Execution with Telegram Bot Command Center

### 1. Workflow Overview

This workflow, titled **"Telegram Command Center"**, enables users to control and initiate different automation workflows via Telegram bot commands. It serves as a centralized command interface where authorized Telegram users can send specific commands to trigger sub-workflows or receive direct responses. The workflow includes access control, command parsing, command routing, and output messaging blocks.

**Logical blocks:**

- **1.1 Input Reception and Access Control:** Receives Telegram messages, verifies user permissions to ensure only authorized users can issue commands.
- **1.2 Command Parsing:** Extracts the command and its parameter(s) from the incoming Telegram message.
- **1.3 Command Validation and Routing:** Checks commands against a predefined list, routes valid commands to sub-workflows or outputs error messages for invalid commands.
- **1.4 Sub-Workflow Execution & Output Handling:** Executes related sub-workflows for commands, formats and sends responses back to the user.
- **1.5 Messaging & User Feedback:** Sends access denied, command confirmation, and processing completion messages to users.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Access Control

- **Overview:**  
  This block triggers on new Telegram messages, checks if the sender is authorized to use the bot, and either proceeds with processing or sends an access denied message.

- **Nodes Involved:**  
  - Telegram Trigger  
  - Access Control (If node)  
  - Access Denied (Telegram node)  
  - Valid Commands (Set node) - feeds next block if access granted  
  - Sticky Notes (descriptive)

- **Node Details:**

  - **Telegram Trigger**  
    - *Type:* Telegram Trigger  
    - *Role:* Entry point; listens to Telegram messages of type "message".  
    - *Configuration:* Uses Telegram API credentials ("Telegram account - AmirStockBot").  
    - *Inputs:* Incoming Telegram messages.  
    - *Outputs:* Passes message to Access Control.  
    - *Edge cases:* Telegram API connection issues; messages without text.  
    - *Sticky Note:* "1. Telegram message Trigger\n2. If permission granted workflow proceed unless send permission denied message to the user with his ID."

  - **Access Control**  
    - *Type:* If node  
    - *Role:* Checks if user ID is in authorized list (currently empty string in config).  
    - *Configuration:* Condition compares `$json.message.from.id` to an empty string (to be customized).  
    - *Inputs:* From Telegram Trigger.  
    - *Outputs:*  
      - True path: proceeds to Valid Commands.  
      - False path: routes to Access Denied message.  
    - *Edge cases:* Empty or malformed user ID; requires manual updating of allowed IDs.  
    - *Sticky Note:* "1.Add Account ID here enable access for the user."

  - **Access Denied**  
    - *Type:* Telegram node  
    - *Role:* Sends a denial message to unauthorized users including their Telegram ID.  
    - *Configuration:* Text message informing no permission; uses Telegram API credentials.  
    - *Inputs:* From Access Control false path.  
    - *Outputs:* None (end of flow for unauthorized users).  
    - *Edge cases:* Telegram message send failure.

  - **Valid Commands**  
    - *Type:* Set node  
    - *Role:* Defines a string listing all valid commands for user guidance and routing.  
    - *Configuration:* Sets `validCommands` field with multi-line command list text.  
    - *Inputs:* From Access Control true path.  
    - *Outputs:* Passes data to next block (command parsing).  
    - *Sticky Note:* "2.Update you available command here."

#### 2.2 Command Parsing

- **Overview:**  
  Parses the Telegram message text to separate the command (e.g., "/instagram") and the parameters following it.

- **Nodes Involved:**  
  - Seperate command and Parameter (Code node)  
  - Sticky Note (instructional)

- **Node Details:**

  - **Seperate command and Parameter**  
    - *Type:* Code node (JavaScript)  
    - *Role:* Extracts command and parameter from message text.  
    - *Configuration:*  
      - If text starts with '/', splits on first space.  
      - Command is the first word (including slash), rest is parameters.  
      - If no space, entire text is command, parameters empty. Otherwise command empty and all text is parameters.  
    - *Inputs:* Telegram message text from Valid Commands.  
    - *Outputs:* JSON with fields `command` and `rest`.  
    - *Edge cases:* Empty message text; messages without commands; malformed input.  
    - *Sticky Note:* "3.Update list of commands here."

#### 2.3 Command Validation and Routing

- **Overview:**  
  Validates the parsed command against a list of known commands and routes the workflow to the appropriate sub-workflow or node for execution.

- **Nodes Involved:**  
  - Switch to the Command (Switch node)  
  - Command not found (Telegram node)  
  - Several disabled Execute Workflow nodes (sub-workflow triggers)  
  - Sticky Note (guidance)

- **Node Details:**

  - **Switch to the Command**  
    - *Type:* Switch node  
    - *Role:* Routes based on exact command match (`/sentiment`, `/instagram`, `/list`, `/social`).  
    - *Configuration:*  
      - For each command outputKey: routes to sub-workflow or output.  
      - Fallback routes to "extra" output for unknown commands.  
    - *Inputs:* From Seperate command and Parameter.  
    - *Outputs:* Specific outputs for each command; fallback to Command not found.  
    - *Edge cases:* Unknown commands; case-sensitivity; command prefix must match exactly.  
    - *Sticky Note:*  
      ```
      Define behaviour for each command.
      1. Switch will route command to the right flow,
      2. you can call the sub workflow for relevant action, by useing sub-workflow node (just update the node)
      3. you have access to 
         command by: $node["Seperate command and Parameter"].json["command"]
         and parameter by: $node["Seperate command and Parameter"].json["rest"]
      4. based on your result you will reply back to Telegram by relevant message
      ```

  - **Command not found**  
    - *Type:* Telegram node  
    - *Role:* Sends error message listing valid commands when an unknown command is received.  
    - *Configuration:* Message includes `validCommands` from Valid Commands node and echoes back the attempted command and parameter.  
    - *Inputs:* From Switch fallback output.  
    - *Outputs:* None (end of flow for invalid commands).  
    - *Edge cases:* Telegram API failures.

  - **Instagram post (Execute Workflow)**  
    - *Type:* Execute Workflow node  
    - *Role:* Triggers a sub-workflow to generate Instagram posts.  
    - *Configuration:* Disabled; workflow ID empty (to be set).  
    - *Inputs:* Routed from Switch `/instagram`.  
    - *Outputs:* Connects to Generic Output node.  
    - *Edge cases:* Sub-workflow missing or misconfigured.

  - **sentimental_analysis (Execute Workflow)**  
    - *Type:* Execute Workflow node  
    - *Role:* Triggers sentiment analysis sub-workflow for stocks.  
    - *Configuration:* Disabled; workflow ID empty (to be set).  
    - *Inputs:* Routed from Switch `/sentiment`.  
    - *Outputs:* Connects to Processing has finished node.  
    - *Edge cases:* Same as above.

  - **Social Analysis (Execute Workflow)**  
    - *Type:* Execute Workflow node  
    - *Role:* Triggers social media analysis sub-workflow.  
    - *Configuration:* Disabled; workflow ID empty (to be set). Parameters include ticker from command parameter.  
    - *Inputs:* Routed from Switch `/social`.  
    - *Outputs:* Connects to format_output_as_json node.  
    - *Edge cases:* Same as above.

  - **Generic Output1 (Telegram node)**  
    - *Type:* Telegram node  
    - *Role:* Responds with the list of valid commands (for `/list` command).  
    - *Inputs:* Routed from Switch `/list`.  
    - *Outputs:* None.  

#### 2.4 Sub-Workflow Execution & Output Handling

- **Overview:**  
  This block processes outputs from sub-workflows and sends formatted responses back to the user.

- **Nodes Involved:**  
  - format_output_as_json (Code node)  
  - Social Analysis Output (Telegram node)  
  - Generic Output (Telegram node)  
  - Processing has finished (Telegram node)  
  - Sticky Notes (guidance)

- **Node Details:**

  - **format_output_as_json**  
    - *Type:* Code node  
    - *Role:* Extracts JSON content from markdown-formatted string output by sub-workflows (especially Social Analysis).  
    - *Configuration:* Parses code block formatted strings to clean JSON, returns structured JSON for further use.  
    - *Inputs:* From Social Analysis sub-workflow.  
    - *Outputs:* Cleaned JSON to Social Analysis Output node.  
    - *Edge cases:* Malformed JSON; parsing errors.  
    - *Disabled:* Yes (currently disabled).  

  - **Social Analysis Output**  
    - *Type:* Telegram node  
    - *Role:* Sends sentiment and rationale analysis results back to user.  
    - *Configuration:* Formats message including symbol, sentiment score, rationale, and echoes command and parameter.  
    - *Inputs:* From format_output_as_json.  
    - *Outputs:* None.  
    - *Edge cases:* Telegram API failures.

  - **Generic Output**  
    - *Type:* Telegram node  
    - *Role:* Sends generic text output, used here for Instagram post results or other outputs.  
    - *Configuration:* Sends output fields and echoes command/parameter.  
    - *Inputs:* From Instagram post sub-workflow.  
    - *Outputs:* None.

  - **Processing has finished**  
    - *Type:* Telegram node  
    - *Role:* Notifies user that processing of a command has completed.  
    - *Inputs:* From sentimental_analysis sub-workflow.  
    - *Outputs:* None.

---

### 3. Summary Table

| Node Name                  | Node Type             | Functional Role                                       | Input Node(s)                | Output Node(s)                        | Sticky Note                                                                                                                                                |
|----------------------------|-----------------------|------------------------------------------------------|-----------------------------|-------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Telegram Trigger            | Telegram Trigger      | Entry point - receives Telegram messages             | -                           | Access Control                      | 1. Telegram message Trigger<br>2. If permission granted workflow proceed unless send permission denid message to the user with his ID.                     |
| Access Control             | If                    | Checks if user is authorized                          | Telegram Trigger             | Valid Commands (true), Access Denied (false) | 1.Add Account ID here enable access for the user                                                                                                          |
| Access Denied              | Telegram              | Sends access denial message                           | Access Control (false)       | -                                   |                                                                                                                                                            |
| Valid Commands             | Set                   | Defines list of valid commands                        | Access Control (true)        | Seperate command and Parameter      | 2.Update you available command here                                                                                                                       |
| Seperate command and Parameter | Code               | Parses command and parameters from message           | Valid Commands               | Switch to the Command               | 3.Update list of commands here                                                                                                                            |
| Switch to the Command      | Switch                | Routes workflow based on command                      | Seperate command and Parameter | sentimental_analysis, Instagram post, Generic Output1, Social Analysis, Command not found | Define behaviour for each command.<br>1. Switch will route command to the right flow,<br>2. you can call the sub workflow for relevant action, by useing sub-workflow node (just update the node)<br>3. you have access to command by: $node["Seperate command and Parameter"].json["command"] and parameter by: $node["Seperate command and Parameter"].json["rest"]<br>4. based on your result you will reply back to Telegram by relevant message |
| Command not found          | Telegram              | Sends error message for invalid commands             | Switch to the Command (fallback) | -                                  |                                                                                                                                                            |
| Instagram post             | Execute Workflow      | Triggers Instagram post sub-workflow (disabled)      | Switch to the Command (/instagram) | Generic Output                     | 4.Connect to relevant Sub-Wokflow and use message to reply back                                                                                           |
| sentimental_analysis       | Execute Workflow      | Triggers sentiment analysis sub-workflow (disabled)  | Switch to the Command (/sentiment) | Processing has finished            | 4.Connect to relevant Sub-Wokflow and use message to reply back                                                                                           |
| Social Analysis            | Execute Workflow      | Triggers social media analysis sub-workflow (disabled) | Switch to the Command (/social) | format_output_as_json              | 4.Connect to relevant Sub-Wokflow and use message to reply back                                                                                           |
| format_output_as_json      | Code                  | Extracts and parses JSON from markdown output         | Social Analysis              | Social Analysis Output             |                                                                                                                                                            |
| Social Analysis Output     | Telegram              | Sends social analysis results to user                 | format_output_as_json        | -                                 |                                                                                                                                                            |
| Generic Output             | Telegram              | Sends generic messages (e.g., Instagram post results) | Instagram post               | -                                 |                                                                                                                                                            |
| Processing has finished    | Telegram              | Notifies user processing is complete                   | sentimental_analysis         | -                                 |                                                                                                                                                            |
| Generic Output1            | Telegram              | Sends list of valid commands                           | Switch to the Command (/list) | -                                 |                                                                                                                                                            |
| Sticky Note                | Sticky Note           | Instructional notes                                  | -                           | -                                 | 1. Telegram message Trigger 2. If permission granted workflow proceed unless send permission denid message to the user with his ID.                        |
| Sticky Note1               | Sticky Note           | Instructional notes                                  | -                           | -                                 | 1. Seperate Command and Paremeter 1. Set list command reply 1. Route the flow based on command                                                            |
| Sticky Note2               | Sticky Note           | Instructional notes                                  | -                           | -                                 | See Switch to the Command sticky note content                                                                                                             |
| Sticky Note3               | Sticky Note           | Instructional notes                                  | -                           | -                                 | 1.Add Account ID here enable access for the user                                                                                                          |
| Sticky Note4               | Sticky Note           | Workflow overview and documentation                   | -                           | -                                 | # Telegram Command Center ... (full content describing purpose, setup, etc.)                                                                               |
| Sticky Note5               | Sticky Note           | Instructional notes                                  | -                           | -                                 | 2.Update you available command here                                                                                                                       |
| Sticky Note6               | Sticky Note           | Instructional notes                                  | -                           | -                                 | 3.Update list of commands here                                                                                                                            |
| Sticky Note7               | Sticky Note           | Instructional notes                                  | -                           | -                                 | 4.Connect to relevant Sub-Wokflow and use message to reply back                                                                                           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger node**  
   - Type: Telegram Trigger  
   - Trigger on updates: "message"  
   - Credentials: Connect to your Telegram Bot API credentials (e.g., "Telegram account - AmirStockBot").  
   - Position: (e.g., x: -224, y: -768)

2. **Create Access Control node (If node)**  
   - Type: If node  
   - Condition: Check if `{{$json.message.from.id.toString()}}` equals one or more authorized Telegram user IDs (insert your actual allowed IDs).  
   - Connect Telegram Trigger output to this node.  
   - Position: near Telegram Trigger.

3. **Create Access Denied node (Telegram node)**  
   - Type: Telegram  
   - Text: "You don't have permission to use this bot!\nContact the administrator to obtain permission access.\n\nAccount ID:{{$json.message.from.id}}"  
   - Chat ID: `{{$node["Telegram Trigger"].json.message.from.id}}`  
   - Credentials: Use your Telegram Bot credentials.  
   - Connect Access Control `false` output here.

4. **Create Valid Commands node (Set node)**  
   - Type: Set node  
   - Define field `validCommands` with string listing all commands, for example:  
     ```
     Valid Commands:
       /list (list all available commands)
       /instagram (generate instagram post - parameter: quote (optional))
       /social (check social media for the stock ticker - parameter: stock ticker)
       /sentiment (do sentiment analysis for the stock ticker - parameter: stock ticker)
     ```  
   - Connect Access Control `true` output here.

5. **Create Seperate command and Parameter node (Code node)**  
   - Type: Code (JavaScript)  
   - Code:  
     ```js
     const input = $('Telegram Trigger').first().json.message.text;
     let command, rest;

     if (input.startsWith('/')) {
       const splitIndex = input.indexOf(' ');
       if (splitIndex === -1) {
         command = input;
         rest = "";
       } else {
         command = input.substring(0, splitIndex);
         rest = input.substring(splitIndex + 1);
       }
     } else {
       command = "";
       rest = input;
     }

     return [{ json: { command, rest } }];
     ```  
   - Connect Valid Commands output here.

6. **Create Switch to the Command node (Switch node)**  
   - Type: Switch node  
   - Add rules with exact match conditions on `{{$json.command}}` for each command:  
     - `/sentiment` → output "sentiment"  
     - `/instagram` → output "instagram"  
     - `/list` → output "list"  
     - `/social` → output "social"  
   - Add fallback output for unknown commands.  
   - Connect Seperate command and Parameter output here.

7. **Create Command not found node (Telegram node)**  
   - Type: Telegram  
   - Text:  
     ```
     Error: Command is not valid!

     {{$('Valid Commands').first().json.validCommands}}

     ----
     Command:{{$node["Seperate command and Parameter"].json.command}}
     Parameter: {{$node["Seperate command and Parameter"].json.rest}}
     ```  
   - Chat ID: `{{$node["Telegram Trigger"].json.message.from.id}}`  
   - Connect Switch fallback output here.

8. **Create Generic Output1 node (Telegram node)**  
   - Type: Telegram  
   - Text: `{{$('Valid Commands').first().json.validCommands}}` with echoed command and parameter.  
   - Chat ID: `{{$node["Telegram Trigger"].json.message.from.id}}`  
   - Connect Switch `/list` output here.

9. **Create Execute Workflow nodes for each command requiring sub-workflows:**  
   - Instagram post  
   - sentimental_analysis  
   - Social Analysis  
   - For each:  
     - Type: Execute Workflow  
     - Set the correct workflow ID for your respective sub-workflow.  
     - For Social Analysis, map input parameter "ticker" to `{{$json.rest}}`.  
     - Connect corresponding Switch outputs to these nodes.

10. **Create output nodes for sub-workflows:**  
    - For Instagram post: Generic Output node (Telegram) to send results back.  
    - For sentimental_analysis: Processing has finished node (Telegram) to notify completion.  
    - For Social Analysis:  
      - Optionally, create format_output_as_json code node to parse JSON from markdown output.  
      - Social Analysis Output node (Telegram) to send parsed results.  
    - Connect outputs accordingly.

11. **Credentials:**  
    - Ensure Telegram credentials are configured and connected in all Telegram nodes.  
    - Ensure sub-workflows have necessary credentials set up.

12. **Optional:**  
    - Add Sticky Note nodes for guidance and documentation as per your preference.  
    - Update Access Control with actual authorized user IDs.  
    - Enable or disable nodes as needed.  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                          | Context or Link                                |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------|
| This workflow uses Telegram as a command center allowing users to execute sub-workflows and receive immediate feedback via Telegram messages.                                                                                        | Sticky Note4 content at position [-928,-1136] |
| To enable user access, update the Access Control node with authorized Telegram user IDs. Unauthorized users receive an access denied message with their Telegram ID for admin reference.                                              | Sticky Note3 at position [-64,-864]              |
| The Switch node routes commands to respective sub-workflows. Developers should connect and configure sub-workflows to handle each command’s logic and output.                                                                       | Sticky Note2 at position [896,-1296]             |
| Valid commands are maintained in the Set node “Valid Commands” and should be updated to reflect all available commands to users.                                                                                                    | Sticky Note5 at position [224,-624]               |
| Discord community and official n8n documentation can provide additional support for Telegram node configuration and sub-workflow design.                                                                                           | https://docs.n8n.io/integrations/builtin/nodes/n8n-nodes-base.telegram/ |

---

This documentation fully describes the **Telegram Command Center** workflow, enabling a developer or AI agent to understand, reproduce, and maintain the workflow effectively.