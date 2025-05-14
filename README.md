## 🎧 Speaker Diarization and Transcription System (Flask + React)

This project consists of:
- **Flask server (Python)** that receives audio files, converts and transcribes them using VOSK, and estimates the number of speakers.
- **React client** that lets users upload audio files and view transcription and speaker count.

---
### 🗂️ Folder Structure
```markdown
project-root/
├── server/
│   ├── app.py
│   ├── requirements.txt
│   └── models/
│       ├── vosk-model-en-us-0.22/
│       └── vosk-model-spk-0.4/
├── client/
│   ├── package.json
│   ├── public/
│   └── src/
└── README.md
```

## 🔧 Setup & Run Instructions

### 1. Flask Server Setup

#### Requirements:
- Python 3.8+
- FFmpeg installed (Download: https://ffmpeg.org/download.html)  
  Make sure `ffmpeg.exe` and `ffprobe.exe` are located at:  
  `C:\ffmpeg\ffmpeg\bin\`

#### Install dependencies:

```bash
cd audio-server
pip install -r requirements.txt
```
#### Run the server:

Download VOSK Models:
- Download from: https://alphacephei.com/vosk/models
- Place models inside server/models/:
   #### vosk-model-en-us-0.22
   #### vosk-model-spk-0.4 

Run server:
```bash
python app.py
```
Default server address: http://localhost:5000

### 2. React Client Setup

Requirements:
Node.js 14+

Install and run:

```bash
cd audio-client
npm install
npm start
```

Client will run on http://localhost:3000.

Make sure the React app sends API requests to http://localhost:5000/analyze, or use a proxy in package.json.


### 📤 API - Upload Audio File

- Endpoint: POST /analyze
- Content-Type: multipart/form-data
- Required field: file (MP3 or WAV file)

Response:

```json
{
  "status": "success",
  "transcription": "hello this is a test",
  "num_speakers": 2,
  "duration": 9.23
}
```

### 📋 Notes
- Audio is automatically converted to mono and 16kHz.
- If speaker model is not found, the response will default to 1 speaker.
- Temporary WAV files are deleted after processing.

---






