# Ansible-Pull Role

This role configures a system for automated provisioning using ansible-pull.

## Overview

The ansible-pull role sets up:
- A dedicated ansible user for running ansible-pull
- Cron jobs for periodic provisioning
- Logging and log rotation
- A provision script for manual runs
- Optional healthcheck monitoring

## Features

- **Automated provisioning**: Runs ansible-pull on a schedule (default: every 30 minutes)
- **Dedicated user**: Creates an ansible user with appropriate sudo privileges
- **Flexible configuration**: Supports multiple Linux distributions
- **Monitoring**: Optional integration with healthchecks.io
- **Logging**: Comprehensive logging with automatic rotation
- **Manual runs**: Provision script for on-demand provisioning

## Variables

### Required Variables

None - all variables have sensible defaults.

### Optional Variables

```yaml
# User configuration
ansible_pull_user: ansible  # User that runs ansible-pull

# Repository settings
ansible_pull_repo: "https://github.com/nsheaps/iac.git"
ansible_pull_branch: main
ansible_pull_directory: ansible  # Subdirectory within the repo containing ansible files

# Scheduling (cron format)
ansible_pull_cron_minute: "*/30"  # Every 30 minutes
ansible_pull_cron_hour: "*"

# Enable/disable ansible-pull
ansible_pull_enabled: true

# Monitoring (optional)
ansible_pull_healthcheck_url: ""  # healthchecks.io URL

# Vault (optional)
ansible_pull_vault_password_file: ""  # Path to vault password

# Logging
ansible_pull_logfile: /var/log/ansible-pull.log

# System integration
ansible_pull_use_inhibit: true  # Prevent sleep during runs

# Additional options
ansible_pull_extra_opts: "-o"  # Only run on changes
```

## Usage

### In a Playbook

```yaml
- hosts: all
  roles:
    - ansible-pull
```

### With Custom Configuration

```yaml
- hosts: servers
  roles:
    - role: ansible-pull
      vars:
        ansible_pull_repo: "https://github.com/myorg/ansible.git"
        ansible_pull_cron_minute: "0"
        ansible_pull_cron_hour: "*/4"
        ansible_pull_healthcheck_url: "https://hc-ping.com/YOUR-UUID"
```

### Manual Provisioning

After the role is applied, you can manually trigger provisioning:

```bash
# Run full provisioning
sudo /usr/local/bin/ansible-provision

# Run with specific tags
sudo /usr/local/bin/ansible-provision base,packages
```

## Files Created

- `/usr/local/bin/ansible-provision` - Main provision script
- `/usr/local/bin/provision` - Symlink for backward compatibility
- `/var/log/ansible-pull.log` - Log file
- `/etc/logrotate.d/ansible-pull` - Log rotation configuration
- `/etc/sudoers.d/ansible` - Sudo configuration for ansible user

## Cron Jobs

The role creates the following cron jobs:

1. **Provisioning**: Runs ansible-pull on schedule
2. **Cleanup**: Clears ansible cache on reboot
3. **Healthcheck** (optional): Pings monitoring service after successful runs

## Platform Support

- Ubuntu (20.04, 22.04)
- Debian (10, 11, 12)
- Arch Linux
- Fedora
- RHEL/CentOS/Rocky Linux

## Dependencies

None - this is a standalone role.

## License

MIT