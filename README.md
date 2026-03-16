# iac

Infrastructure as Code for the nsheaps organization. Manages container deployments (Docker Compose via [Arcane](https://github.com/getarcaneapp/arcane)), GitHub organization resources ([Pulumi](https://www.pulumi.com/docs/iac/languages-sdks/yaml/)), and host configuration management ([Ansible](https://docs.ansible.com/ansible/latest/index.html)).

## Infrastructure Managed

### Docker Compose / Arcane (`hosts/`)

Container stacks deployed to hosts via [Arcane](https://github.com/getarcaneapp/arcane) GitOps sync. Each folder in `hosts/` relates to a specific host, containing one or more docker-compose files.

For validation purposes, each compose file must end in `-compose.yaml` or `-compose.yml`.

#### Deployment via Arcane

Stacks are deployed automatically via the [arcane-deploy](https://github.com/nsheaps/github-actions) GitHub Action:

- **On push to `main`** (when `hosts/heapsnas/**` changes): The `arcane-deploy` workflow discovers compose files and creates/updates GitOps syncs in Arcane.
- **Sync naming**: Files like `hosts/heapsnas/nextcloud/docker-compose.yaml` become sync `heapsnas-nextcloud` in Arcane.
- **Auto-sync**: Arcane polls for changes every 5 minutes in addition to push-triggered syncs.

Secrets (Arcane API key, git token) are stored as GitHub repository secrets, synced via the [nsheaps/.github](https://github.com/nsheaps/.github) 1Password sync workflow.

#### Adding a new stack

1. Create a directory under `hosts/<hostname>/<stack-name>/`
2. Add a `docker-compose.yaml` file
3. Push to `main` — Arcane will auto-discover and deploy it

#### Legacy: Portainer

Previously, stacks were synced via [Portainer](https://github.com/portainer/portainer) GitOps polling. The `_portainer/` directory in `hosts/` contains the bootstrap compose for Portainer itself. See [Portainer stack docs](https://docs.portainer.io/user/docker/stacks) for reference.

Example stacks: https://github.com/portainer/templates/tree/master/stacks

### Ansible Host Configuration (`ansible/`)

Automated configuration management for Linux workstations and servers using `ansible-pull`. Hosts periodically pull configuration from this repo and apply changes automatically, with desktop notifications on workstations.

See [ansible/README.md](ansible/README.md) for full documentation including setup instructions.

> **Note:** This replaces the former [nsheaps/n8-ansible](https://github.com/nsheaps/n8-ansible) repository. All ansible configuration now lives here.

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

| Command                   | Description                                       |
| :------------------------ | :------------------------------------------------ |
| `yarn run check`          | Checks linting, formatting, types (if applicable) |
| `yarn run check:fix`      | Runs checks, autofixing where possible            |
| `mise run pulumi:preview` | Preview Pulumi changes (like `terraform plan`)    |
| `mise run pulumi:up`      | Apply Pulumi changes (like `terraform apply`)     |
| `mise run pulumi:refresh` | Sync Pulumi state with actual infrastructure      |
