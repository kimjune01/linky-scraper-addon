#!/usr/bin/env python3
import sys
import struct
import json


def read_message():
    # Read the message length (first 4 bytes, little-endian)
    raw_length = sys.stdin.buffer.read(4)
    if len(raw_length) == 0:
        sys.exit(0)
    message_length = struct.unpack("<I", raw_length)[0]
    # Read the message data
    message = sys.stdin.buffer.read(message_length).decode("utf-8")
    unwrapped = json.loads(message)
    type = unwrapped.get("type")
    if type == "markdown":
        content = unwrapped.get("content")
        profile = unwrapped.get("profile")
        if profile and content:
            filename = f"{profile}.md"
            with open(filename, "w", encoding="utf-8") as f:
                f.write(content)
            return {"message": {"saved": True, "filename": filename}}
        else:
            return {"error": "Missing profile or content"}
    else:
        return {"error": "Invalid type"}


def send_message(message_content):
    # Encode the message as JSON and get bytes
    encoded_content = json.dumps(message_content).encode("utf-8")
    # Write message length (4 bytes, little-endian)
    sys.stdout.buffer.write(struct.pack("<I", len(encoded_content)))
    # Write the message itself
    sys.stdout.buffer.write(encoded_content)
    sys.stdout.buffer.flush()


def main():
    while True:
        try:
            message = read_message()
            # Process the message (echo back the 'message' field, like your JS)
            response = message.get("message")
            send_message(response)
        except Exception as e:
            # Print errors to stderr for debugging
            print(f"Error processing message: {e}", file=sys.stderr)
            sys.stderr.flush()
            # Optionally, send an error response or just continue


if __name__ == "__main__":
    main()
