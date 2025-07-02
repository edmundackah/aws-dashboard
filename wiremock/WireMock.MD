# Standalone WireMock mock server

## Prerequisites
- Java installed (Java 8+)
- WireMock standalone JAR

## 🗂️ Project Structure

```plaintext
wiremock/
├── __files/
│   └── dashboard_data.json
├── mappings/
│   └── get-api-stub.json
```

## 🚀 Start WireMock on Port 8085

Run this from the directory containing the __files/ and mappings/ folders:

```bash
java -jar wiremock-standalone-3.5.5.jar --port 8085 --verbose
```

## ✅ Test Your Mock

```bash
curl http://localhost:8085/dashboard_data.json

Example Response:

{ "message": "Hello from WireMock!" }
```
