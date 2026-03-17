# Users Role

This role manages user accounts and their configurations using a flexible profile-based system.

## Overview

The users role creates and configures user accounts based on configuration profiles. It supports inheritance between profiles and allows for comprehensive dotfile management.

## Configuration Profiles

### Available Profiles

- **nsheaps**: Comprehensive developer profile with full shell customizations
  - Shell: zsh (with custom prompt, plugins, aliases)
  - Editors: vim (with plugins and color schemes), inputrc
  - Tools: tmux, htop, mc, git
  - SSH: SSH key deployment
  - Groups: sudo, docker, adm, cdrom, dip, plugdev, lpadmin

- **nheaps**: Inherits from nsheaps but uses different email (nheaps@gather.town)
  - Identical configuration to nsheaps
  - Used for work-related systems

- **root**: Simplified profile for root user
  - Basic bash, zsh, vim, and tmux configurations
  - No additional groups or SSH keys

## Host Configuration

Configure users in `host_vars/<hostname>.yml`:

```yaml
user_configs:
  - system_user: nsheaps # Actual system username
    config_profile: nsheaps # Profile to apply
```

## File Organization

Configuration files are organized under `files/<profile>/`:

- `bash/`: Bash configuration (aliases, functions, bashrc, etc.)
- `zsh/`: Zsh configuration (modular setup with separate files)
- `vim/`: Vim configuration (vimrc, color schemes, plugins)
- `tmux/`: Tmux configuration (server and workstation variants)
- `git/`: Git configuration
- `ssh/`: SSH public keys
- Other tools: htop, mc, inputrc

## Features

- **Profile Inheritance**: Child profiles can inherit from parent profiles
- **Modular Configurations**: Shell configs split into logical files
- **Comprehensive Tooling**: Includes configurations for development tools
- **Cross-Platform Paths**: Uses $HOME variables for portability
- **Tmux Plugins**: Includes tmux resurrect and continuum support
- **Vim Plugins**: Comprehensive vim setup with pathogen and various plugins

## Dependencies

Note: The `ansible` user is created and managed by the `bootstrap` role, not this role. This role focuses on regular user accounts and their configurations.

## Usage Examples

```yaml
# Single user with custom profile
user_configs:
  - system_user: myuser
    config_profile: nsheaps

# Multiple users with different profiles
user_configs:
  - system_user: developer
    config_profile: nsheaps
  - system_user: admin
    config_profile: root
```
