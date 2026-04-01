import urllib.request
import urllib.error
import ssl

url = "https://staging-api-podigger.perna.app/health/"
req = urllib.request.Request(
    url,
    headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "*/*"
    }
)
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

try:
    response = urllib.request.urlopen(req, context=ctx, timeout=10)
    print(f"Status Code: {response.status}")
    print(f"Server: {response.getheader('Server')}")
    print(f"Body: {response.read()[:200]}")
except urllib.error.HTTPError as e:
    print(f"Status Code: {e.code}")
    print(f"Server: {e.headers.get('Server')}")
    print(f"Body: {e.read()[:200]}")
except Exception as e:
    print(f"Error: {e}")
