#!/usr/bin/env python3
import sys
import struct
import json
import os


def read_message():
    # Read the message length (first 4 bytes, little-endian)
    raw_length = sys.stdin.buffer.read(4)
    if len(raw_length) == 0:
        sys.exit(0)
    message_length = struct.unpack("<I", raw_length)[0]
    # Read the message data
    message = sys.stdin.buffer.read(message_length).decode("utf-8")
    unwrapped = json.loads(message)

    try:
        validate_outgoing_message(unwrapped)
    except Exception as e:
        return {"message": f"Validation error: {e}"}
    type = unwrapped.get("type")
    if type == "profile":
        content = unwrapped.get("content")
        profile = unwrapped.get("profile")
        if profile and content:
            filename = os.path.expanduser(f"~/Desktop/temp/{profile}.md")
            try:
                with open(filename, "w", encoding="utf-8") as f:
                    f.write(content)
                return {"message": {"saved": True, "filename": filename}}
            except Exception as e:
                return {"message": f"Error writing file: {e}"}
        else:
            return {"message": "Missing profile or content"}
    elif type == "search":
        content = unwrapped.get("content")
        if not content:
            return {"message": "Missing content"}
        # if content is a list, format it as a string with newlines
        if isinstance(content, list):
            content = "\n".join(content)
        filename = unwrapped.get("filename")
        # Ensure filename is in ~/Desktop/temp
        if filename:
            if not os.path.isabs(filename):
                filename = os.path.expanduser(os.path.join("~/Desktop/temp", filename))
            else:
                filename = os.path.expanduser(filename)
        try:
            # Ensure the directory exists
            dir_path = os.path.dirname(filename)
            if dir_path:  # Only create if there is a directory part
                os.makedirs(dir_path, exist_ok=True)
            # Now you can safely open the file for writing
            with open(filename, "w", encoding="utf-8") as f:
                f.write(content)
            return {"message": {"saved": True, "filename": filename}}
        except Exception as e:
            return {"message": f"Error writing file: {e}"}
    elif type == "content":
        content = unwrapped.get("content")
        filename = unwrapped.get("filename")
        if not filename:
            return {"message": "Missing filename"}
        if not os.path.isabs(filename):
            filename = os.path.expanduser(os.path.join("~/Desktop/temp", filename))
        # Ensure the directory exists
        dir_path = os.path.dirname(filename)
        if dir_path:  # Only create if there is a directory part
            os.makedirs(dir_path, exist_ok=True)
        with open(filename, "w", encoding="utf-8") as f:
            f.write(content)
        return {"message": {"saved": True, "filename": filename}}
    else:
        return {"message": "Invalid type"}


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


def validate_outgoing_message(data: dict) -> bool:
    # Check required fields
    required_fields = {"action", "filename", "type", "content"}
    if not required_fields.issubset(data):
        raise Exception("Missing required fields")

    # Check action is exactly 'sendNativeMarkdown'
    if data["action"] != "sendNativeMarkdown":
        raise Exception("Invalid action")

    # Check filename and content are strings
    if not isinstance(data["filename"], str) or not isinstance(data["content"], str):
        raise Exception("Invalid filename or content")

    # Check type is one of the allowed values
    if data["type"] not in {"profile", "search", "content"}:
        raise Exception("Invalid type")

    return True


# Example usage:
# try:
#     msg = OutgoingMessage(**unwrapped)
# except ValidationError as e:
#     # handle validation error


if __name__ == "__main__":
    main()
