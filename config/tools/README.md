Native and MCP tools go here.

- JSON files describe MCP servers (stdio, SSE, or streamable HTTP).
- Filenames starting with `_` are ignored by the loader.
- `{ENV:VAR}` and `{ENV:VAR:-default}` are substituted at load time.

The default DeepSeek chat agent does **not** receive these tools. They are
used only when a user calls `/mcp`, `/agent`, or prefixes a message with `mcp:`.

Example remote server (copy and drop the leading `_`):
`config/tools/mcp/_remote.example.json`.

You can also point the bot at one server with environment variables:

```
MCP_SERVER_URL=https://example.com/mcp
MCP_API_KEY=
MCP_SERVER_NAME=env-mcp
```

or a local stdio server:

```
MCP_SERVER_COMMAND=npx -y @modelcontextprotocol/server-filesystem /data
```
