# Ansible Host Configuration

Personal home-network configuration using Ansible. Uses `ansible-pull` so each host self-provisions from this repo on a schedule.

Supports Linux (Ubuntu), macOS, and WSL.

## Quick Start

One command to onboard any machine (new or existing):

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/nsheaps/iac/main/ansible/bin/bootstrap)
```

The script will interactively prompt for:

- **Hostname** (default: current hostname)
- **Username** (default: current user)
- **OS group** (auto-detected: `linux`, `macos`, or `wsl`)
- **Purpose group** (`laptop` or `htpc`)
- **Cron schedule** (default: every 30 minutes)

For **new machines**, the script opens a PR to add the host config to the repo, then runs ansible locally regardless of whether the PR is merged.

For **existing machines**, it pulls the latest config and runs ansible.

## Hosts

| Hostname   | OS    | Purpose    |
| ---------- | ----- | ---------- |
| n8laptop   | Linux | Laptop     |
| n8htpc-wsl | WSL   | HTPC (WSL) |
| n8work     | macOS | Laptop     |

## Architecture

```
ansible-pull → local.yml
  → roles/ansible-pull (all hosts): ansible user, cron, provision script
  → roles/update-notifier (post-task): desktop notification with version/compare link
```

Additional roles can be applied per host or group. Hosts are in both purpose groups (`laptop`, `htpc`) and OS groups (`linux`, `macos`, `wsl`).

## Structure

| Path          | Purpose                                  |
| ------------- | ---------------------------------------- |
| `local.yml`   | Main playbook (ansible-pull entry point) |
| `hosts`       | Inventory file                           |
| `host_vars/`  | Per-host variables                       |
| `group_vars/` | Shared variables                         |
| `roles/`      | Ansible roles                            |
| `playbooks/`  | Additional playbooks (bootstrap)         |
| `bin/`        | Helper scripts (bootstrap, test runner)  |
| `tests/`      | Test playbooks                           |

## License

MIT
