from flask import Flask, request, jsonify
from pydub import AudioSegment
from vosk import Model, KaldiRecognizer, SpkModel
from flask_cors import CORS
import tempfile
import os
import wave
import json
import numpy as np
from sklearn.cluster import AgglomerativeClustering

app = Flask(__name__)
CORS(app)

AudioSegment.converter = "C:\\ffmpeg\\ffmpeg\\bin\\ffmpeg.exe"
AudioSegment.ffmpeg = "C:\\ffmpeg\\ffmpeg\\bin\\ffmpeg.exe"
AudioSegment.ffprobe = "C:\\ffmpeg\\ffmpeg\\bin\\ffprobe.exe"

print("Loading VOSK model...")
vosk_model_path = "models/vosk-model-en-us-0.22"
model = Model(vosk_model_path)
print("Model loaded successfully.")

print("Loading speaker identification model...")
spk_model_path = "models/vosk-model-spk-0.4"
spk_model = None

try:
    if os.path.exists(spk_model_path):
        spk_model = SpkModel(spk_model_path)
        print("Speaker identification model loaded successfully.")
    else:
        print("Speaker identification model directory not found. Speaker identification will be disabled.")
except Exception as e:
    print(f"Failed to load speaker identification model: {str(e)}")
    print("Speaker identification will be disabled.")

def perform_speaker_diarization(audio_path, min_speakers=1, max_speakers=10):
    if spk_model is None:
        print("Speaker identification model not available. Returning default speaker count.")
        return 1
    
    try:
        wf = wave.open(audio_path, "rb")
        
        if wf.getnchannels() != 1 or wf.getsampwidth() != 2 or wf.getcomptype() != "NONE":
            print("Audio format not supported for speaker identification")
            return 1
        
        rec = KaldiRecognizer(model, wf.getframerate())
        rec.SetSpkModel(spk_model)
        rec.SetWords(True)
        
        speaker_embeddings = []
        timestamps = []
        
        while True:
            data = wf.readframes(4000)
            if len(data) == 0:
                break
            
            if rec.AcceptWaveform(data):
                result = json.loads(rec.Result())
                if 'spk' in result and 'result' in result and len(result['result']) > 0:
                    speaker_embeddings.append(result['spk'])
                    timestamps.append(result['result'][0]['start'])
        
        final_result = json.loads(rec.FinalResult())
        if 'spk' in final_result and 'result' in final_result and len(final_result['result']) > 0:
            speaker_embeddings.append(final_result['spk'])
            timestamps.append(final_result['result'][0]['start'])
        
        wf.close()
        
        if len(speaker_embeddings) < 2:
            print(f"Not enough speaker embeddings: {len(speaker_embeddings)}")
            return 1
        
        embeddings_array = np.array(speaker_embeddings)
        
        best_num_speakers = 1
        best_score = -float('inf')
        
        for num_speakers in range(min_speakers, min(max_speakers + 1, len(speaker_embeddings))):
            clustering = AgglomerativeClustering(n_clusters=num_speakers)
            labels = clustering.fit_predict(embeddings_array)
            
            if num_speakers > 1:
                from sklearn.metrics import silhouette_score
                try:
                    score = silhouette_score(embeddings_array, labels)
                    print(f"Silhouette score for {num_speakers} speakers: {score}")
                    
                    if score > best_score:
                        best_score = score
                        best_num_speakers = num_speakers
                except:
                    continue
        
        print(f"Estimated number of speakers: {best_num_speakers}")
        return best_num_speakers
        
    except Exception as e:
        print(f"Error in speaker identification: {str(e)}")
        return 1

@app.route("/analyze", methods=["POST"])
def upload_file():
    print("Request received.")
    
    if 'file' not in request.files:
        print("No file part in request.")
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']

    if file.filename == '':
        print("No selected file.")
        return jsonify({"error": "No selected file"}), 400

    try:
        print(f"Received file: {file.filename}")

        audio = AudioSegment.from_file(file.stream)
        print(f"Original audio duration (milliseconds): {len(audio)}")
        
        audio = audio.set_channels(1).set_frame_rate(16000)
        print("Audio converted to mono and 16kHz.")

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            audio.export(tmp.name, format="wav")
            tmp_path = tmp.name
            print(f"Exported temporary WAV to: {tmp_path}")

        print(f"Temporary file exists? {os.path.exists(tmp_path)}")
        print(f"Temporary file size: {os.path.getsize(tmp_path)} bytes")

        wf = wave.open(tmp_path, "rb")
        print("WAV file opened.")

        rec = KaldiRecognizer(model, wf.getframerate())
        rec.SetWords(True)
        print("KaldiRecognizer initialized.")

        results = []
        while True:
            data = wf.readframes(4000)
            if len(data) == 0:
                print("End of audio stream.")
                break
            if rec.AcceptWaveform(data):
                res = json.loads(rec.Result())
                print(f"Partial result: {res}")
                results.append(res.get("text", ""))

        final_res = json.loads(rec.FinalResult())
        print(f"Final result: {final_res}")
        results.append(final_res.get("text", ""))

        wf.close()
        
        num_speakers = perform_speaker_diarization(tmp_path)
        
        os.remove(tmp_path)
        print("Temporary file removed.")

        full_transcript = " ".join(results).strip()
        print(f"Full transcription: {full_transcript}")
        
        duration_seconds = len(audio) / 1000

        return jsonify({
            "status": "success",
            "transcription": full_transcript,
            "transcript": full_transcript,
            "num_speakers": num_speakers,
            "duration": duration_seconds
        })

    except Exception as e:
        print(f"Exception: {str(e)}")
        return jsonify({
            "error": f"An error occurred while processing the audio file: {str(e)}"
        }), 500

if __name__ == "__main__":
    print("Starting Flask app...")
    app.run(debug=True)
