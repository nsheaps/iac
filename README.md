# iac

Infrastructure as Code for the nsheaps organization. Manages both container deployments (Docker Compose / Portainer) and GitHub organization resources (Pulumi).

## Infrastructure Managed

### Docker Compose / Portainer (`hosts/`)

Container stacks deployed to hosts via [Portainer](https://github.com/portainer/portainer). Each folder in `hosts/` relates to a specific host, containing one or more docker-compose files.

For validation purposes, each compose file must end in `-compose.yaml` or `-compose.yml`.

#### Setting up Portainer

If needed, run through this to install: https://docs.portainer.io/start/install-ce/server/docker/linux#deployment

> [!NOTE]
> Portainer by default runs the web UI on port 9000. That may be in use, I suggest using 10201

Set up a stack to poll using authenticated requests from this repo: https://docs.portainer.io/user/docker/stacks

Example stacks: https://github.com/portainer/templates/tree/master/stacks

### GitHub Organization (`github-org/`)

GitHub org resources (repos, teams, branch protection) managed via [Pulumi YAML](https://www.pulumi.com/docs/iac/languages-sdks/yaml/). See [github-org/README.md](github-org/README.md) for full documentation including Terraform equivalents.

## Development Quickstart

```bash
gh repo clone nsheaps/iac ~/src/nsheaps/iac || true
cd ~/src/nsheaps/iac
mise install                    # install tools (node, yarn, pulumi, etc.)
corepack enable && corepack install
yarn install
```

## Command Reference

| Command | Description |
| :--- | :--- |
| `yarn run check` | Checks linting, formatting, types (if applicable) |
| `yarn run check:fix` | Runs checks, autofixing where possible |
| `mise run pulumi:preview` | Preview Pulumi changes (like `terraform plan`) |
| `mise run pulumi:up` | Apply Pulumi changes (like `terraform apply`) |
| `mise run pulumi:refresh` | Sync Pulumi state with actual infrastructure |
