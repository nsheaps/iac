# Ansible Filter Plugins

This directory contains custom Ansible filter plugins that extend Ansible's templating capabilities.

## Available Filters

### resolve_user_inheritance

Resolves inheritance relationships in user configuration profiles, allowing one profile to inherit and extend another profile's configuration.

**Usage:**
```yaml
{{ config_profiles | resolve_user_inheritance }}
```

**Features:**
- Deep merging of configuration profiles
- Support for multi-level inheritance chains
- Detection and prevention of circular inheritance
- Lists are extended (parent + child values)
- Dictionaries are recursively merged
- Scalar values are overridden by child profiles

**Example:**
```yaml
config_profiles:
  base_user:
    shell: /bin/bash
    groups: [users]
    configs: [bash, git]
  
  developer:
    inherits_from: base_user
    groups: [docker, sudo]  # Results in: [users, docker, sudo]
    configs: [vim, tmux]     # Results in: [bash, git, vim, tmux]
  
  admin:
    inherits_from: developer
    email: admin@example.com  # Adds new field
    groups: [wheel]           # Results in: [users, docker, sudo, wheel]
```

## Development

### Adding New Filters

1. Create a new Python file in this directory or add to an existing one
2. Define a class that inherits from `object`
3. Implement a `filters()` method that returns a dictionary mapping filter names to methods
4. Implement the filter methods with appropriate error handling

Example structure:
```python
from ansible.errors import AnsibleError

class FilterModule(object):
    def filters(self):
        return {
            'my_filter': self.my_filter_method,
        }
    
    def my_filter_method(self, value, *args, **kwargs):
        # Implementation here
        return processed_value
```

### Testing Filters

Test filter plugins using the test playbooks in `tests/playbooks/`:
```bash
ansible-playbook tests/playbooks/test_user_inheritance.yml
```

### Best Practices

1. **Error Handling**: Always validate inputs and raise `AnsibleError` with descriptive messages
2. **Documentation**: Include docstrings explaining parameters and return values
3. **Idempotency**: Filters should produce consistent output for the same input
4. **Performance**: Avoid unnecessary deep copies or recursive operations where possible
5. **Type Safety**: Check input types and handle edge cases gracefully

## File Management

- **DO NOT COMMIT**: `__pycache__/` directories or `*.pyc` files
- These are Python bytecode files that are automatically generated
- They should be in `.gitignore`

## Troubleshooting

If filters aren't being loaded:
1. Check that `filter_plugins = ./filter_plugins` is in `ansible.cfg`
2. Ensure Python files have correct permissions
3. Verify no syntax errors with: `python -m py_compile filter_plugins/*.py`
4. Check Ansible version compatibility

## References

- [Ansible Filter Plugin Documentation](https://docs.ansible.com/ansible/latest/dev_guide/developing_plugins.html#filter-plugins)
- [Jinja2 Filters](https://jinja.palletsprojects.com/en/latest/templates/#filters)