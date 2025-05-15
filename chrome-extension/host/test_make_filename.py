import sys
import os
import importlib.util

# Dynamically import make_filename from native-host.py
module_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "native-host.py")
spec = importlib.util.spec_from_file_location("native_host", module_path)
if spec is None or spec.loader is None:
    raise ImportError(f"Could not load spec for {module_path}")
native_host = importlib.util.module_from_spec(spec)
sys.modules["native_host"] = native_host
spec.loader.exec_module(native_host)
make_filename = native_host.make_filename


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
    test_make_filename()
