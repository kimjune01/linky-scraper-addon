#!/usr/bin/env python3
import sys
import struct
import json
import os


def write_content_to_file(filename, content):
    """Helper to ensure directory exists and write content to file."""
    if not os.path.isabs(filename):
        filename = os.path.expanduser(os.path.join("~/Desktop/temp", filename))
    else:
        filename = os.path.expanduser(filename)
    dir_path = os.path.dirname(filename)
    if dir_path:
        os.makedirs(dir_path, exist_ok=True)
    with open(filename, "w", encoding="utf-8") as f:
        f.write(content)
    return filename


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
        validate_native_message(unwrapped)
    except Exception as e:
        return {"message": f"Validation error: {e}"}

    content = unwrapped.get("content")
    url = unwrapped.get("url")
    filename = make_filename(url)
    return {"message": {"saved": False, "url": url, "filename": filename}}

    if not filename:
        return {"message": "Missing filename"}
    try:
        filename = write_content_to_file(filename, content)
        return {"message": {"saved": True, "filename": filename}}
    except Exception as e:
        return {"message": f"Error writing file: {e}"}


def make_filename(url: str) -> str:
    # Remove protocol
    if url.startswith("http://"):
        url = url[len("http://") :]
    elif url.startswith("https://"):
        url = url[len("https://") :]
    # Split into domain and path
    parts = url.split("/", 1)
    domain = parts[0].replace("www.", "")
    path = parts[1] if len(parts) > 1 else ""
    if not path:
        return f"{domain}/{domain}.md"
    # Remove trailing slash if present
    if path.endswith("/"):
        path = path[:-1]
    # Replace all slashes in the path with underscores
    path = path.replace("/", "_")
    filename = f"{domain}/{path}.md"
    return filename


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


def validate_native_message(data: dict) -> bool:
    # Check required fields
    required_fields = {"action", "url", "type", "content"}
    if not required_fields.issubset(data):
        raise Exception("Missing required fields")

    # Check action is exactly 'sendNativeMarkdown'
    if data["action"] != "sendNativeMarkdown":
        raise Exception("Invalid action")

    # Check url and content are strings
    if not isinstance(data["url"], str) or not isinstance(data["content"], str):
        raise Exception("Invalid url or content")

    # Check type is one of the allowed values
    if data["type"] not in {"profile", "search", "content"}:
        raise Exception("Invalid type")

    return True


def test_make_filename():
    test_cases = [
        ("https://linkedin.com/in/kimjune01/", "linkedin.com/in_kimjune01.md"),
        ("https://linkedin.com/in/kimjune01", "linkedin.com/in_kimjune01.md"),
        ("https://linkedin.com/", "linkedin.com/linkedin.com.md"),
        ("http://www.example.com/foo/bar/baz/", "example.com/foo_bar_baz.md"),
        ("http://www.example.com/foo/bar/baz", "example.com/foo_bar_baz.md"),
        (
            "https://sub.domain.com/path/to/resource/",
            "sub.domain.com/path_to_resource.md",
        ),
        (
            "https://sub.domain.com/path/to/resource",
            "sub.domain.com/path_to_resource.md",
        ),
        ("https://domain.com/", "domain.com/domain.com.md"),
        ("https://domain.com", "domain.com/domain.com.md"),
    ]
    for url, expected in test_cases:
        result = make_filename(url)
        print(
            f"URL: {url}\nExpected: {expected}\nResult:   {result}\n{'PASS' if result == expected else 'FAIL'}\n"
        )


if __name__ == "__main__":
    main()
