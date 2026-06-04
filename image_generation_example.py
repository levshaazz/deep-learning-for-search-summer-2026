# документация https://imgeditor.co/api

import requests

API_KEY = "nb_sk_your_api_key_here"
BASE_URL = "https://imgeditor.co/api/v1"

# Generate image
response = requests.post(
    f"{BASE_URL}/images/generate",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={
        "prompt": "A sunset over mountains, oil painting style",
        "mode": "text",
        "model": "gpt-image-2",
        "aspect_ratio": "16:9",
    },
)
result = response.json()
task_id = result["data"]["task_id"]

# Poll for status
import time
while True:
    status = requests.get(
        f"{BASE_URL}/images/status",
        headers={"Authorization": f"Bearer {API_KEY}"},
        params={"task_id": task_id},
    ).json()

    if status["data"]["status"] == "completed":
        print("Image URL:", status["data"]["image_url"])
        break
    elif status["data"]["status"] == "failed":
        print("Error:", status["data"]["error"])
        break

    time.sleep(3)