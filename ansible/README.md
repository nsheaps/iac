# n8-ansible

Personal home-network configuration using Ansible. Uses `ansible-pull` so each host self-provisions from this repo on a schedule.

Supports Linux, macOS, and WSL.

## Quick Start

### Bootstrap a New Host

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/nsheaps/n8-ansible/main/bin/bootstrap)
```

This installs dependencies, sets up SSH/auth, clones the repo, generates host config, and optionally runs the first `ansible-pull`.

### Manual Setup

```bash
git clone https://github.com/nsheaps/n8-ansible.git
cd n8-ansible
ansible-playbook local.yml --check  # Dry run
sudo ansible-playbook local.yml     # Apply
```

### Run ansible-pull Directly

```bash
sudo ansible-pull -U https://github.com/nsheaps/n8-ansible.git -C main
```

## Hosts

| Hostname | OS | Purpose |
|---|---|---|
| n8laptop | Linux | Laptop |
| n8htpc | Linux | HTPC |
| n8htpc-wsl | WSL | WSL on n8htpc |
| n8work | macOS | Workstation |

## Architecture

```
ansible-pull → local.yml
  → roles/ansible-pull (all hosts): ansible user, cron, provision script
  → roles/update-notifier (post-task): desktop notification with version/compare link
```

Additional roles can be applied per host or group. Hosts are in both purpose groups (`laptop`, `htpc`, `workstation`) and OS groups (`linux`, `macos`, `wsl`).

## Structure

| Path | Purpose |
|---|---|
| `local.yml` | Main playbook (ansible-pull entry point) |
| `hosts` | Inventory file |
| `host_vars/` | Per-host variables |
| `group_vars/` | Shared variables |
| `roles/` | Ansible roles |
| `playbooks/` | Additional playbooks (bootstrap) |
| `bin/` | Helper scripts (bootstrap, test runner) |
| `tests/` | Test playbooks |

## License

MIT
