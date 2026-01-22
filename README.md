📘 Zeroheight MCP Shim
A Streamable MCP Server for Microsoft Copilot Studio
This project provides a Model Context Protocol (MCP) shim that exposes the Zeroheight REST API to Microsoft Copilot Studio (including copilots integrated in Microsoft Teams). It enables copilots to browse, read, and query Zeroheight content such as:

Styleguides
Navigation trees
Pages
Markdown content

Zeroheight’s native MCP only works with Anthropic Claude and GitHub Copilot for VS Code.
This shim brings those capabilities to Microsoft Copilot Studio.

🌟 Features


Full Zeroheight REST API support

list-styleguides
get-styleguide-tree
list-pages
get-page



Streamable MCP endpoint using StreamableHTTPServerTransport
(required for Copilot Studio’s streaming tool messages)


Shared-secret authentication to safely expose the endpoint inside Azure
(without embedding Zeroheight tokens in Copilot actions)


Enterprise-ready TLS support, including corporate CA bundles


Retries + backoff, constant keep-alive, and robust error handling


Designed for Docker + Azure Container Apps deployment



📁 Project Structure
mcp-zeroheight-shim/
├── src/
│   ├── server.ts
│   ├── mcp.ts
│   ├── auth.ts
│   ├── services/
│   │   └── zeroheight.ts
│   ├── tools/
│   │   ├── listStyleguides.ts
│   │   ├── getStyleguideTree.ts
│   │   ├── listPages.ts
│   │   ├── getPage.ts
├── package.json
├── tsconfig.json
├── Dockerfile
├── azure.yaml
├── .gitignore
├── .env.example
└── README.md  ← (this file)


🏗 Requirements
Local

Node ≥ 18
npm
macOS or Linux
(Optional) Corporate CA bundle

Production

Azure Container Apps (recommended)
Azure Container Registry
GitHub Actions (for CI/CD)
Zeroheight API token & client ID


🔐 Environment Variables
Create a .env file during local development:
ZEROHEIGHT_CLIENT_ID=zhci_xxxxxxxxxxxxxxxxxxxxxxxxx
ZEROHEIGHT_TOKEN=zhat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SHIM_SHARED_SECRET=super-long-random-string
ZEROHEIGHT_CA_BUNDLE=/path/to/corp-bundle.pem   # optional
INSECURE_TLS=false
PORT=3000