# github-org — GitHub Organization Infrastructure

Manages GitHub organization resources (repositories, teams, branch protection, app installations) for the `nsheaps` org using [Pulumi YAML](https://www.pulumi.com/docs/iac/languages-sdks/yaml/).

## What's Managed

| Resource Type     | Example                                            |
| :---------------- | :------------------------------------------------- |
| Repositories      | Settings, visibility, merge strategy               |
| Branch Protection | Required reviews, status checks, admin enforcement |
| Teams             | Team membership and repo access                    |
| App Installations | Which repos a GitHub App can access                |

> **Note:** GitHub Apps _themselves_ (name, permissions, webhooks) cannot be managed via Pulumi. Only the association between an app installation and repositories is manageable. See [Pulumi GitHub Provider](https://www.pulumi.com/registry/packages/github/).

## Prerequisites

- [mise](https://mise.run) — installs Pulumi CLI automatically
- [1Password CLI](https://developer.1password.com/docs/cli/) — `op` command for secrets injection
- A 1Password account with access to the vault containing GitHub tokens

```bash
mise install        # installs pulumi + other tools
op signin           # authenticate with 1Password
```

## Quick Start

```bash
# Preview changes (like terraform plan)
mise run pulumi:preview --stack prod

# Apply changes (like terraform apply)
mise run pulumi:up --stack prod

# Sync state with actual infrastructure (like terraform refresh)
mise run pulumi:refresh --stack prod

# Initialize a new stack
mise run pulumi:stack-init dev
```

## Terraform ↔ Pulumi Comparison

If you're coming from Terraform, this table maps concepts:

| Concept            | Terraform                                    | Pulumi YAML                             |
| :----------------- | :------------------------------------------- | :-------------------------------------- |
| Project definition | `main.tf` + `provider.tf` + `versions.tf`    | `Pulumi.yaml` (single file)             |
| State backend      | `backend "s3" {}` in `terraform {}` block    | `PULUMI_BACKEND_URL` env var            |
| Provider config    | `provider "github" { token = var.x }`        | `GITHUB_TOKEN` env var (auto-detected)  |
| Repository         | `resource "github_repository" "x" {}`        | `type: github:Repository`               |
| Branch protection  | `resource "github_branch_protection" "x" {}` | `type: github:BranchProtection`         |
| Team               | `resource "github_team" "x" {}`              | `type: github:Team`                     |
| Team ↔ repo        | `resource "github_team_repository" "x" {}`   | `type: github:TeamRepository`           |
| Variables          | `variable "x" {}` + `terraform.tfvars`       | `config:` block + `Pulumi.<stack>.yaml` |
| Outputs            | `output "x" { value = ... }`                 | `outputs:` with `${resource.prop}`      |
| Plan/Preview       | `terraform plan`                             | `pulumi preview`                        |
| Apply              | `terraform apply`                            | `pulumi up`                             |
| Destroy            | `terraform destroy`                          | `pulumi destroy`                        |
| Import existing    | `terraform import <type>.<name> <id>`        | `pulumi import <type> <name> <id>`      |
| Workspaces         | `terraform workspace select dev`             | `pulumi stack select dev`               |
| Remote state ref   | `data "terraform_remote_state" "x" {}`       | `type: pulumi:pulumi:StackReference`    |
| Format check       | `terraform fmt -check`                       | N/A (use prettier)                      |

### Key Differences

1. **Single file**: Pulumi YAML keeps everything in `Pulumi.yaml`. No splitting across `main.tf`, `variables.tf`, `outputs.tf`.
2. **No HCL**: Pure YAML syntax. String interpolation uses `${resource.property}`.
3. **No `for_each`/`count`**: Pulumi YAML has no loops or conditionals. If you need them, convert to TypeScript/Go with `pulumi convert --language typescript`.
4. **Env-var config**: Provider auth uses environment variables, not provider blocks.
5. **Node ID gotcha**: `BranchProtection` requires the repo's GraphQL `nodeId`, not its name. Use `${repo.nodeId}`.

## Adding New Resources

1. Open `Pulumi.yaml`
2. Add a new entry under `resources:`:
   ```yaml
   resources:
     my-new-repo:
       type: github:Repository
       properties:
         name: 'my-new-repo'
         visibility: 'private'
         description: 'Managed by Pulumi'
   ```
3. Run `mise run pulumi:preview --stack prod` to see the diff
4. Open a PR — CI will run `pulumi preview` automatically
5. After merge, CI runs `pulumi up` to apply

## Importing Existing Resources

To bring an existing GitHub resource under Pulumi management without recreating it:

```bash
# Import a repository
pulumi import github:index/repository:Repository my-repo "repo-name"

# Import branch protection (format: repository:pattern)
pulumi import github:index/branchProtection:BranchProtection my-protection "repo-name:main"

# Import a team (use numeric team ID from GitHub API)
pulumi import github:index/team:Team my-team "1234567"
```

After importing, review the generated resource definition and update `Pulumi.yaml` to match.

## State Backend

The wrapper script (`bin/pulumi-wrapper.sh`) auto-detects the backend:

1. **If `PULUMI_BACKEND_URL` is set** — uses it as-is
2. **If R2 credentials are available** — uses the Cloudflare R2 bucket
3. **Otherwise** — falls back to `file://` local state in `.pulumi-state/`

Local state is fine for getting started. The R2 backend will activate automatically once credentials and endpoint are configured.

### Bootstrapping the Prod Stack

When setting up from scratch (new clone, no existing state):

```bash
# 1. Install tools
mise install

# 2. Authenticate with 1Password
op signin

# 3. Initialize the prod stack (creates Pulumi.prod.yaml if missing)
mise run pulumi:stack-init prod

# 4. Preview to verify everything resolves
mise run pulumi:preview --stack prod

# 5. If managing existing resources, import them first (see "Importing Existing Resources")
#    Then run apply:
mise run pulumi:up --stack prod
```

> **Note:** The first `pulumi up` on a fresh stack will attempt to **create** all declared resources. If the resources already exist in GitHub, you must **import** them first to avoid conflicts. See [Importing Existing Resources](#importing-existing-resources).

## Secrets

Secrets are injected via 1Password:

- **Local**: `op run` reads `.env.op` and injects secrets as env vars
- **CI**: `1password/load-secrets-action` does the same in GitHub Actions

The `.env.op` file contains only `op://` references, never actual values. It is safe to commit.

## When to Convert from YAML to SDK

Pulumi YAML is great for static, declarative infrastructure. Consider converting to TypeScript or Go when:

- You need loops (e.g., managing 10+ repos with identical settings)
- You need conditionals (e.g., different branch protection rules per environment)
- You want to author reusable components
- You want unit tests

The conversion is straightforward:

```bash
pulumi convert --language typescript --out ./ts-version
```

## References

- [Pulumi YAML Language Reference](https://www.pulumi.com/docs/iac/languages-sdks/yaml/yaml-language-reference/)
- [Pulumi GitHub Provider](https://www.pulumi.com/registry/packages/github/)
- [github:Repository](https://www.pulumi.com/registry/packages/github/api-docs/repository/)
- [github:BranchProtection](https://www.pulumi.com/registry/packages/github/api-docs/branchprotection/)
- [Pulumi State and Backends](https://www.pulumi.com/docs/iac/concepts/state-and-backends/)
- [1Password `op run`](https://developer.1password.com/docs/cli/reference/commands/run/)
- [Managing GitHub with Pulumi (blog)](https://www.pulumi.com/blog/managing-github-with-pulumi/)
