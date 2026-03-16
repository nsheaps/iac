#!/usr/bin/env python3
"""
Ansible filter plugin for resolving user profile inheritance.

This plugin provides filters for resolving inheritance relationships
in user configuration profiles, supporting deep merging of nested
dictionaries and lists while handling edge cases like circular
inheritance and missing parent profiles.
"""

from copy import deepcopy
from ansible.errors import AnsibleError
from ansible.module_utils.six import string_types


class FilterModule(object):
    """Custom filter plugin for user profile inheritance."""

    def filters(self):
        """Return the filters provided by this plugin."""
        return {
            'resolve_user_inheritance': self.resolve_user_inheritance,
        }

    def resolve_user_inheritance(self, config_profiles):
        """
        Resolve inheritance relationships in user configuration profiles.

        This filter takes a dictionary of configuration profiles and resolves
        any inheritance relationships defined by the 'inherits_from' field.

        Args:
            config_profiles (dict): Dictionary of user configuration profiles

        Returns:
            dict: Dictionary with inheritance resolved

        Raises:
            AnsibleError: If circular inheritance or missing parents are detected
        """
        if not isinstance(config_profiles, dict):
            raise AnsibleError("config_profiles must be a dictionary")

        # Create a deep copy to avoid modifying the original
        resolved_profiles = deepcopy(config_profiles)

        # Track resolution status for each profile
        resolution_status = {}  # 'pending', 'resolving', 'resolved'

        # Initialize all profiles as pending
        for profile_name in resolved_profiles:
            resolution_status[profile_name] = 'pending'

        # Resolve each profile
        for profile_name in resolved_profiles:
            self._resolve_profile(profile_name, resolved_profiles, resolution_status)

        return resolved_profiles

    def _resolve_profile(self, profile_name, profiles, status):
        """
        Recursively resolve a single profile's inheritance.

        Args:
            profile_name (str): Name of the profile to resolve
            profiles (dict): All configuration profiles
            status (dict): Resolution status tracking
        """
        # Skip if already resolved
        if status[profile_name] == 'resolved':
            return

        # Check for circular dependency
        if status[profile_name] == 'resolving':
            raise AnsibleError(f"Circular inheritance detected involving profile '{profile_name}'")

        # Mark as currently resolving
        status[profile_name] = 'resolving'

        profile = profiles[profile_name]

        # Check if this profile inherits from another
        if 'inherits_from' in profile:
            parent_name = profile['inherits_from']

            # Validate parent exists
            if parent_name not in profiles:
                raise AnsibleError(f"Profile '{profile_name}' inherits from non-existent profile '{parent_name}'")

            # Resolve parent first (recursive call)
            self._resolve_profile(parent_name, profiles, status)

            # Merge parent into this profile
            parent_profile = profiles[parent_name]
            merged_profile = self._deep_merge(parent_profile, profile)

            # Remove the inherits_from field after merging
            if 'inherits_from' in merged_profile:
                del merged_profile['inherits_from']

            # Update the profile with merged data
            profiles[profile_name] = merged_profile

        # Mark as resolved
        status[profile_name] = 'resolved'

    def _deep_merge(self, parent, child):
        """
        Perform deep merge of two dictionaries.

        Child values override parent values. For lists, child lists
        extend parent lists (no deduplication to preserve order).
        For nested dictionaries, merge recursively.

        Args:
            parent (dict): Parent configuration
            child (dict): Child configuration that overrides parent

        Returns:
            dict: Merged configuration
        """
        if not isinstance(parent, dict) or not isinstance(child, dict):
            return child

        result = deepcopy(parent)

        for key, child_value in child.items():
            if key in result:
                parent_value = result[key]

                # If both are dictionaries, merge recursively
                if isinstance(parent_value, dict) and isinstance(child_value, dict):
                    result[key] = self._deep_merge(parent_value, child_value)
                # If both are lists, extend parent with child
                elif isinstance(parent_value, list) and isinstance(child_value, list):
                    result[key] = parent_value + child_value
                # Otherwise, child overrides parent
                else:
                    result[key] = child_value
            else:
                # Key doesn't exist in parent, just add it
                result[key] = child_value

        return result

