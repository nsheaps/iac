# Ansible Host Configuration

Automated configuration management for nsheaps home network hosts (Linux workstations and servers) using `ansible-pull`. Part of the [nsheaps/iac](https://github.com/nsheaps/iac) monorepo.

> **Migrated from [nsheaps/n8-ansible](https://github.com/nsheaps/n8-ansible)** — all ansible configuration now lives in this directory.

## How It Works

Each managed host runs `ansible-pull` on a cron schedule (default: every 30 minutes). This:

1. Clones/pulls the latest version of this repo
2. Runs `ansible/local.yml` against the local machine
3. Applies roles based on host group (workstation or server)
4. Sends a desktop notification on workstations when changes are applied
5. Optionally pings healthchecks.io for monitoring

No central control server needed — each host is self-managing.

## Quick Start — Setting Up a New Host

### Option A: Bootstrap Script (Recommended)

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/nsheaps/iac/main/ansible/bin/bootstrap)
```

This interactive script will:
- Install required packages (ansible, git, 1Password CLI, etc.)
- Set up SSH and authentication
- Clone this repository
- Generate host configuration
- Optionally run the first ansible-pull

See [docs/BOOTSTRAP.md](docs/BOOTSTRAP.md) for detailed instructions.

### Option B: Manual Setup

1. **Install ansible and git:**
   ```bash
   # Ubuntu/Debian
   sudo apt update && sudo apt install -y ansible git

   # Fedora
   sudo dnf install -y ansible git

   # Arch
   sudo pacman -S ansible git
   ```

2. **Run ansible-pull:**
   ```bash
   sudo ansible-pull \
     -U https://github.com/nsheaps/iac.git \
     -C main \
     -i ansible/hosts \
     ansible/local.yml
   ```

3. **After the first run**, the `ansible-pull` role sets up a cron job so future runs happen automatically every 30 minutes.

### Setting Up n8laptop Specifically

n8laptop is already defined in the inventory and host_vars. To set it up:

```bash
# Option 1: Use the bootstrap script
bash <(curl -fsSL https://raw.githubusercontent.com/nsheaps/iac/main/ansible/bin/bootstrap)

# Option 2: Manual one-liner
sudo ansible-pull \
  -U https://github.com/nsheaps/iac.git \
  -C main \
  -i ansible/hosts \
  ansible/local.yml
```

After the first run, ansible-pull will:
- Run automatically every 30 minutes via cron
- Show a desktop notification ("Ansible Provisioning Complete") when changes are applied
- Log output to `/var/log/ansible-pull.log`

To manually trigger a run at any time:
```bash
sudo /usr/local/bin/ansible-provision
```

## Directory Structure

```
ansible/
├── ansible.cfg          # Ansible configuration
├── hosts                # Inventory (server/workstation groups)
├── local.yml            # Main playbook (entry point for ansible-pull)
├── bin/
│   ├── bootstrap        # Interactive setup script for new hosts
│   └── ansible-test     # Test runner
├── docs/
│   └── BOOTSTRAP.md     # Detailed bootstrap documentation
├── filter_plugins/
│   └── user_inheritance.py  # Custom filter for user profile inheritance
├── group_vars/
│   └── all.yml          # Variables for all hosts
├── host_vars/
│   ├── n8laptop.yml     # n8laptop configuration
│   └── ...              # Other host configurations
├── playbooks/
│   ├── bootstrap.yml    # Bootstrap playbook for new hosts
│   ├── send_completion_alert.yml
│   └── send_failure_alert.yml
├── roles/
│   ├── ansible-pull/    # Sets up automated ansible-pull with cron
│   ├── base/            # Applied to all hosts (packages, SSH, system config)
│   ├── bootstrap/       # Initial host setup
│   ├── say-hello/       # Desktop notifications via notify-send
│   ├── server/          # Server-specific (monitoring, firewall, upgrades)
│   ├── users/           # User account management with profile inheritance
│   └── workstation/     # Desktop environment, GUI apps, dev tools
└── tests/
    └── playbooks/       # Test playbooks
```

## Playbook Flow

`local.yml` runs these plays in order:

1. **Pre-tasks**: Update package cache (apt/pacman/dnf)
2. **users role**: Create and configure user accounts
3. **base role**: System packages, SSH, logging, cron
4. **ansible-pull role**: Set up the cron job for future runs
5. **workstation role** (workstations only): Desktop environment, GUI apps
6. **say-hello role** (workstations only): Desktop notification
7. **server role** (servers only): Monitoring, firewall, unattended upgrades
8. **Post-tasks**: Package cleanup, healthcheck ping

## Development

### Running locally (dry run)

```bash
cd ansible/
ansible-playbook local.yml --check --diff
```

### Running specific tags

```bash
ansible-playbook local.yml --tags "say-hello"
ansible-playbook local.yml --tags "base,packages"
```

### Testing

```bash
cd ansible/
./bin/ansible-test          # Run all tests
./bin/ansible-test syntax   # Run syntax check only
```

## Configuration

### Host Variables

Each host has a file in `host_vars/` named after its hostname:

```yaml
---
user_configs:
  - system_user: root
    config_profile: root
  - system_user: nsheaps
    config_profile: nsheaps

ansible_pull_enabled: true
ansible_pull_cron_minute: "*/30"
ansible_pull_cron_hour: "*"
```

### Inventory

Hosts are grouped in the `hosts` file:

```ini
[server]
n8-server

[workstation]
n8laptop
nsh-desktop
```

The group determines which roles are applied (workstation gets desktop apps + notifications, server gets monitoring + firewall).
