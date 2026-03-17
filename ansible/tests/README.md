# Ansible Tests

This directory contains test playbooks and infrastructure for validating the Ansible configuration.

## Structure

```
tests/
├── playbooks/           # Test playbooks
│   ├── test_user_inheritance.yml    # Tests user profile inheritance
│   ├── test_user_configuration.yml  # Tests user configuration logic
│   └── test_syntax.yml              # Tests playbook syntax and structure
├── inventory/           # Test inventory files
│   └── test_hosts      # Test host definitions
└── README.md           # This file
```

## Running Tests

### Quick Start

The easiest way to run tests is using the ansible-test command:

```bash
# With direnv enabled (automatically adds bin/ to PATH)
ansible-test              # Run all tests
ansible-test inheritance  # Run specific test
ansible-test --help       # Get help

# Without direnv
./bin/ansible-test        # From project root
../bin/ansible-test       # From tests directory
```

### Test User Inheritance

Tests that the user profile inheritance system works correctly:

```bash
ansible-playbook tests/playbooks/test_user_inheritance.yml

# Run specific test tags
ansible-playbook tests/playbooks/test_user_inheritance.yml --tags verify
```

### Test User Configuration

Tests user configuration logic without actually creating users:

```bash
ansible-playbook tests/playbooks/test_user_configuration.yml

# Test specific aspects
ansible-playbook tests/playbooks/test_user_configuration.yml --tags users
ansible-playbook tests/playbooks/test_user_configuration.yml --tags paths
ansible-playbook tests/playbooks/test_user_configuration.yml --tags root
```

### Test Syntax and Structure

Validates the main playbook syntax and structure:

```bash
ansible-playbook tests/playbooks/test_syntax.yml

# Check specific components
ansible-playbook tests/playbooks/test_syntax.yml --tags syntax
ansible-playbook tests/playbooks/test_syntax.yml --tags tasks
ansible-playbook tests/playbooks/test_syntax.yml --tags tags
```

### Run All Tests

```bash
# Run all test playbooks
for test in tests/playbooks/*.yml; do
    echo "Running $test..."
    ansible-playbook "$test"
done
```

## Test Coverage

- **User Inheritance**: Verifies that profile inheritance works (e.g., nheaps inherits from nsheaps)
- **User Configuration**: Tests that user configurations are properly resolved
- **Root User Handling**: Ensures root user is handled specially
- **Playbook Structure**: Validates that all roles are properly included
- **Syntax Validation**: Confirms all playbooks have valid syntax

## Adding New Tests

When adding new functionality, create corresponding test playbooks:

1. Create a new test playbook in `tests/playbooks/`
2. Name it descriptively: `test_<feature>.yml`
3. Include appropriate tags for selective testing
4. Add assertions to validate expected behavior
5. Document the test in this README

## Continuous Improvement

Tests should be:

- **Idempotent**: Running tests multiple times produces the same result
- **Isolated**: Tests don't depend on external state
- **Fast**: Use `--check` mode where possible
- **Comprehensive**: Cover both success and failure cases
- **Maintained**: Update tests when functionality changes
