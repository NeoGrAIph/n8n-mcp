import { assertStartupConfig, loadConfig } from './config.mjs';
import { createServer } from './server.mjs';

const config = loadConfig();
assertStartupConfig(config);

const server = createServer(config);
server.listen(config.port, config.host, () => {
  process.stderr.write(`synestra-n8n-gitops-mcp listening on ${config.host}:${config.port}\n`);
});
