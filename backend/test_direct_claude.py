import anthropic

client = anthropic.Anthropic(
    # DO NOT COMMIT YOUR REAL API KEY
    api_key="YOUR_API_KEY_HERE"
)

def call_claude(prompt, model="claude-3-haiku-20240307"):
    message = client.messages.create(
        model=model,
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}]
    )
    return message.content[0].text

# Test it
print(call_claude("Hello!"))