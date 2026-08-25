import json
import unittest

from app.handler import JSON_CONTENT_TYPE, handle_request


def _payload(resp):
    return json.loads(resp.body.decode("utf-8"))


class HandleRequestTests(unittest.TestCase):
    def test_health_ok(self):
        resp = handle_request("GET", "/health", "")
        self.assertEqual(resp.status, 200)
        self.assertEqual(resp.headers["Content-Type"], JSON_CONTENT_TYPE)
        self.assertEqual(_payload(resp), {"status": "ok"})
        self.assertEqual(resp.body, b'{"status":"ok"}')

    def test_hello_default_world(self):
        resp = handle_request("GET", "/hello", "")
        self.assertEqual(resp.status, 200)
        self.assertEqual(_payload(resp), {"message": "Hello, World!"})

    def test_hello_name_alice(self):
        resp = handle_request("GET", "/hello", "name=Alice")
        self.assertEqual(resp.status, 200)
        self.assertEqual(_payload(resp), {"message": "Hello, Alice!"})

    def test_hello_empty_name(self):
        resp = handle_request("GET", "/hello", "name=")
        self.assertEqual(resp.status, 200)
        self.assertEqual(_payload(resp), {"message": "Hello, World!"})

    def test_hello_whitespace_name_percent20(self):
        resp = handle_request("GET", "/hello", "name=%20")
        self.assertEqual(resp.status, 200)
        self.assertEqual(_payload(resp), {"message": "Hello, World!"})

    def test_hello_whitespace_name_plus(self):
        resp = handle_request("GET", "/hello", "name=+++")
        self.assertEqual(resp.status, 200)
        self.assertEqual(_payload(resp), {"message": "Hello, World!"})

    def test_unknown_root(self):
        resp = handle_request("GET", "/", "")
        self.assertEqual(resp.status, 404)
        self.assertEqual(_payload(resp), {"error": "not found"})

    def test_unknown_path(self):
        resp = handle_request("GET", "/nope", "")
        self.assertEqual(resp.status, 404)
        self.assertEqual(_payload(resp), {"error": "not found"})

    def test_trailing_slash_health(self):
        resp = handle_request("GET", "/health/", "")
        self.assertEqual(resp.status, 404)
        self.assertEqual(_payload(resp), {"error": "not found"})

    def test_trailing_slash_hello(self):
        resp = handle_request("GET", "/hello/", "")
        self.assertEqual(resp.status, 404)
        self.assertEqual(_payload(resp), {"error": "not found"})

    def test_post_health_method_not_allowed(self):
        resp = handle_request("POST", "/health", "")
        self.assertEqual(resp.status, 405)
        self.assertIn("GET", resp.headers.get("Allow", ""))
        self.assertEqual(_payload(resp), {"error": "method not allowed"})

    def test_put_health_method_not_allowed(self):
        resp = handle_request("PUT", "/health", "")
        self.assertEqual(resp.status, 405)
        self.assertIn("GET", resp.headers.get("Allow", ""))
        self.assertEqual(_payload(resp), {"error": "method not allowed"})

    def test_post_hello_method_not_allowed(self):
        resp = handle_request("POST", "/hello", "")
        self.assertEqual(resp.status, 405)
        self.assertIn("GET", resp.headers.get("Allow", ""))
        self.assertEqual(_payload(resp), {"error": "method not allowed"})

    def test_delete_hello_method_not_allowed(self):
        resp = handle_request("DELETE", "/hello", "")
        self.assertEqual(resp.status, 405)
        self.assertIn("GET", resp.headers.get("Allow", ""))
        self.assertEqual(_payload(resp), {"error": "method not allowed"})

    def test_hello_unicode_name(self):
        resp = handle_request("GET", "/hello", "name=%D0%9C%D0%B8%D1%80")
        self.assertEqual(resp.status, 200)
        self.assertEqual(_payload(resp), {"message": "Hello, Мир!"})

    def test_hello_name_max_length(self):
        name = "a" * 256
        resp = handle_request("GET", "/hello", f"name={name}")
        self.assertEqual(resp.status, 200)
        self.assertEqual(_payload(resp), {"message": f"Hello, {name}!"})

    def test_hello_name_too_long(self):
        name = "a" * 257
        resp = handle_request("GET", "/hello", f"name={name}")
        self.assertEqual(resp.status, 400)
        self.assertEqual(_payload(resp), {"error": "name too long"})


if __name__ == "__main__":
    unittest.main()
