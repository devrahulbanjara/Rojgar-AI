import requests
import os

USERNAME = "devrahulbanjara"
SPACE_NAME = "nepali-whisper-small"
FILE_PATH = "/content/Recording (6).mp3"

API_URL = f"https://{USERNAME.lower()}-{SPACE_NAME.lower().replace('_', '-')}.hf.space/transcribe"


def test_inference():
    if not os.path.exists(FILE_PATH):
        print(f"Error: File not found at {FILE_PATH}")
        return

    print(f"Sending '{FILE_PATH}' to API...")
    print(f"Target URL: {API_URL}")

    try:
        with open(FILE_PATH, "rb") as f:
            files = {"file": (os.path.basename(FILE_PATH), f, "audio/mpeg")}
            response = requests.post(API_URL, files=files, timeout=120)

        if response.status_code == 200:
            result = response.json()
            print("\nTranscription Received:")
            print("-" * 30)
            print(result.get("text"))
            print("-" * 30)
        elif response.status_code == 503:
            print(
                "\nAPI is sleeping. Please wait 30 seconds for it to wake up and try again."
            )
        else:
            print(f"\nAPI Error ({response.status_code}): {response.text}")

    except Exception as e:
        print(f"\nConnection Error: {e}")


test_inference()
