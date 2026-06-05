# Platform Deployment

This repository owns source code only. Synestra platform deployment lives in `~/repo/synestra-platform`.

Platform responsibilities:

- image build and GitLab Registry publishing;
- Argo CD Application and Helm values;
- SOPS/Kubernetes Secret wiring;
- workflow file mount configuration;
- mcp-gateway/proxy routing and authentication.

Builds must pin this repository by commit SHA, not by a moving branch, when used for platform release images.
