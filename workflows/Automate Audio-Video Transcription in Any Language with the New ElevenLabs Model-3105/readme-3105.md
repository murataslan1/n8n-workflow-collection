Automate Audio/Video Transcription in Any Language with the New ElevenLabs Model

https://n8nworkflows.xyz/workflows/automate-audio-video-transcription-in-any-language-with-the-new-elevenlabs-model-3105


# Automate Audio/Video Transcription in Any Language with the New ElevenLabs Model

### 1. Workflow Overview

This workflow automates the transcription of any audio or video file into structured text using the ElevenLabs Scribe model, a state-of-the-art speech-to-text AI supporting over 99 languages. It is designed for seamless integration within n8n to enable automatic file upload, transcription via ElevenLabs API, and export of the resulting text for further use cases such as subtitles, SEO content, or legal documentation.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Manual trigger to start the workflow and file reading from disk.
- **1.2 AI Processing:** Sending the audio/video file to ElevenLabs Scribe API for transcription.
- **1.3 Output Handling:** (Implicit in this workflow) The transcription result is available for downstream processing or export.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block initiates the workflow manually and reads the audio/video file from the local disk to prepare it for transcription.

- **Nodes Involved:**  
  - When clicking ‘Test workflow’  
  - Read/Write Files from Disk

- **Node Details:**

  - **When clicking ‘Test workflow’**  
    - *Type & Role:* Manual Trigger node; starts the workflow on user command.  
    - *Configuration:* No parameters; simply triggers the workflow when clicked.  
    - *Expressions/Variables:* None.  
    - *Input/Output:* No input; outputs a trigger signal to the next node.  
    - *Version Requirements:* Compatible with n8n v1+.  
    - *Potential Failures:* None expected; manual trigger.  
    - *Sub-workflow:* None.

  - **Read/Write Files from Disk**  
    - *Type & Role:* File system node; reads the specified media file from disk.  
    - *Configuration:* File path set to `/files/tmp/tst1.mp4` (relative to n8n server).  
    - *Expressions/Variables:* Static file path; no dynamic expressions.  
    - *Input/Output:* Receives trigger from manual node; outputs binary data of the file.  
    - *Version Requirements:* Requires file system access permissions.  
    - *Potential Failures:* File not found, permission denied, or incorrect path errors.  
    - *Sub-workflow:* None.

#### 1.2 AI Processing

- **Overview:**  
  This block sends the binary audio/video file to the ElevenLabs Scribe API to generate a transcription using the specified model.

- **Nodes Involved:**  
  - Create Transcript1

- **Node Details:**

  - **Create Transcript1**  
    - *Type & Role:* HTTP Request node; performs a POST request to ElevenLabs Speech-to-Text API.  
    - *Configuration:*  
      - URL: `https://api.elevenlabs.io/v1/speech-to-text`  
      - Method: POST  
      - Content-Type: multipart/form-data  
      - Body Parameters:  
        - `file`: binary data from the previous node (`data` field)  
        - `model_id`: fixed value `scribe_v1` (ElevenLabs Scribe model)  
      - Authentication: Custom HTTP header-based credential named "Eleven Labs" (likely includes API key).  
      - Headers: Explicitly sets `Content-Type` to `multipart/form-data`.  
    - *Expressions/Variables:* Uses binary data from "Read/Write Files from Disk" node as the file input.  
    - *Input/Output:* Receives binary file data; outputs transcription JSON response.  
    - *Version Requirements:* HTTP Request node version 4.2 or higher recommended for multipart handling.  
    - *Potential Failures:*  
      - Authentication errors (invalid or missing API key).  
      - Network timeouts or API unavailability.  
      - File format or size unsupported by ElevenLabs API.  
      - API rate limiting or quota exceeded.  
      - Malformed multipart request if binary data is missing or corrupted.  
    - *Sub-workflow:* None.

---

### 3. Summary Table

| Node Name                 | Node Type             | Functional Role                         | Input Node(s)               | Output Node(s)          | Sticky Note                                                                                   |
|---------------------------|-----------------------|---------------------------------------|-----------------------------|-------------------------|-----------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’ | Manual Trigger        | Starts the workflow manually           | -                           | Read/Write Files from Disk |                                                                                               |
| Read/Write Files from Disk | Read/Write File       | Reads audio/video file from disk       | When clicking ‘Test workflow’ | Create Transcript1       |                                                                                               |
| Create Transcript1        | HTTP Request          | Sends file to ElevenLabs API for transcription | Read/Write Files from Disk   | -                       | Use ElevenLabs Scribe model (`scribe_v1`) for best speech-to-text accuracy in 99+ languages. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger Node**  
   - Add a **Manual Trigger** node named `When clicking ‘Test workflow’`.  
   - No parameters needed.

2. **Add a Read/Write File Node**  
   - Add a **Read/Write Files from Disk** node named `Read/Write Files from Disk`.  
   - Set the file selector path to `/files/tmp/tst1.mp4` (adjust path according to your environment).  
   - Connect the output of `When clicking ‘Test workflow’` to this node.

3. **Add an HTTP Request Node**  
   - Add an **HTTP Request** node named `Create Transcript1`.  
   - Configure as follows:  
     - HTTP Method: POST  
     - URL: `https://api.elevenlabs.io/v1/speech-to-text`  
     - Authentication: Select or create a credential of type **HTTP Custom Auth** named "Eleven Labs" containing your ElevenLabs API key.  
     - Content Type: `multipart/form-data`  
     - Body Parameters:  
       - Add parameter named `file` of type `formBinaryData`, set input data field name to `data` (this binds to binary data from previous node).  
       - Add parameter named `model_id` with value `scribe_v1`.  
     - Headers: Add header `Content-Type` with value `multipart/form-data`.  
   - Connect the output of `Read/Write Files from Disk` to this node.

4. **Credential Setup**  
   - Create an HTTP Custom Auth credential in n8n with your ElevenLabs API key.  
   - Assign this credential to the `Create Transcript1` node.

5. **Save and Test**  
   - Save the workflow.  
   - Click "Execute Workflow" or "Test Workflow" to run the process.  
   - The transcription result will be available as JSON output from the `Create Transcript1` node.

---

### 5. General Notes & Resources

| Note Content                                                                                                   | Context or Link                                                                                   |
|---------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| ElevenLabs Scribe model supports transcription in over 99 languages with high accuracy and speed.              | [ElevenLabs Scribe](https://try.elevenlabs.io/convert-speech-to-text)                            |
| Use cases include podcast transcription, YouTube subtitles, legal compliance, e-learning, and SEO content.    | Workflow description and business cases section                                                 |
| ElevenLabs Scribe outperforms Google Gemini and OpenAI Whisper in independent benchmarks, especially for underserved languages. | Workflow description                                                                           |
| Quick setup in n8n: upload file, select `scribe_v1` model, and automate transcription via ElevenLabs API.     | Setup instructions in workflow description                                                      |
| For more information and to try the model, visit ElevenLabs official site:                                    | [Try Scribe AI today](https://try.elevenlabs.io/convert-speech-to-text)                         |

---

This documentation fully describes the workflow’s structure, node configurations, and operational logic, enabling reproduction, modification, and troubleshooting by advanced users or AI agents.