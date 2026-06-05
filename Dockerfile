# syntax=docker/dockerfile:1.7

FROM node:22-alpine@sha256:968df39aedcea65eeb078fb336ed7191baf48f972b4479711397108be0966920

WORKDIR /app

RUN apk add --no-cache git

COPY --chown=node:node package.json README.md ./
COPY --chown=node:node src ./src

USER node

ENV HOST=0.0.0.0
ENV PORT=3000
ENV N8N_WORKFLOWS_ROOT=/workflows
ENV SYNESTRA_MCP_ENV=dev
ENV SYNESTRA_MCP_WRITE_POLICY=off
ENV SYNESTRA_MCP_AUTH_TOKEN_FILE=/run/secrets/synestra-mcp-token

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "require('node:http').get('http://127.0.0.1:' + (process.env.PORT || 3000) + '/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "src/index.mjs"]
