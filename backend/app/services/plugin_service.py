import json
import re
from datetime import datetime, timezone

from app.models.plugin import Plugin
from app.repositories.plugin import PluginRepository
from app.schemas.plugin import (
    REQUIRED_MANIFEST_FIELDS,
    VALID_CATEGORIES,
    VALID_PERMISSIONS,
    VALID_PLATFORMS,
    PluginRegister,
    PluginValidationResult,
)

SEMVER_RE = re.compile(r"^\d+\.\d+\.\d+$")
SOURCE_ID_RE = re.compile(r"^[a-zA-Z0-9._-]+$")


def plugin_to_response(plugin: Plugin) -> dict:
    permissions = json.loads(plugin.permissions_json) if plugin.permissions_json else []
    supported_platforms = (
        json.loads(plugin.supported_platforms_json) if plugin.supported_platforms_json else []
    )
    config_schema = json.loads(plugin.config_schema_json) if plugin.config_schema_json else None
    return {
        "id": plugin.id,
        "source_id": plugin.source_id,
        "name": plugin.name,
        "version": plugin.version,
        "description": plugin.description,
        "author": plugin.author,
        "category": plugin.category,
        "entry_point": plugin.entry_point,
        "permissions": permissions,
        "supported_platforms": supported_platforms,
        "min_careeros_version": plugin.min_careeros_version,
        "config_schema": config_schema,
        "homepage": plugin.homepage,
        "license": plugin.license,
        "status": plugin.status,
        "created_at": plugin.created_at.replace(tzinfo=None).isoformat()
        if plugin.created_at
        else None,
        "updated_at": plugin.updated_at.replace(tzinfo=None).isoformat()
        if plugin.updated_at
        else None,
    }


def validate_manifest(manifest: dict) -> PluginValidationResult:
    errors: list[str] = []
    all_fields_present = True

    for field in REQUIRED_MANIFEST_FIELDS:
        if field not in manifest or manifest[field] is None:
            errors.append(f"Missing required field: {field}")
            all_fields_present = False

    if all_fields_present:
        for field in REQUIRED_MANIFEST_FIELDS:
            if field == "permissions":
                if not isinstance(manifest.get(field), list):
                    errors.append("Field 'permissions' must be an array of strings")
                continue
            val = manifest.get(field)
            if not isinstance(val, str) or val.strip() == "":
                errors.append(f"Field '{field}' must be a non-empty string")

    if all_fields_present:
        source_id = manifest.get("id", "")
        if not isinstance(source_id, str) or not SOURCE_ID_RE.match(source_id):
            errors.append("Field 'id' must match pattern: ^[a-zA-Z0-9._-]+$")

        version = manifest.get("version", "")
        if not isinstance(version, str) or not SEMVER_RE.match(version):
            errors.append("Field 'version' must be a valid semver string (e.g. 1.0.0)")

        min_careeros_version = manifest.get("min_careeros_version", "")
        if not isinstance(min_careeros_version, str) or not SEMVER_RE.match(min_careeros_version):
            errors.append(
                "Field 'min_careeros_version' must be a valid semver string (e.g. 0.1.0)"
            )

        category = manifest.get("category", "")
        if not isinstance(category, str) or category not in VALID_CATEGORIES:
            valid = ", ".join(sorted(VALID_CATEGORIES))
            errors.append(f"Field 'category' must be one of: {valid}")

        permissions = manifest.get("permissions", [])
        if not isinstance(permissions, list):
            errors.append("Field 'permissions' must be an array of strings")
        else:
            for perm in permissions:
                if perm not in VALID_PERMISSIONS:
                    errors.append(f"Unknown permission: '{perm}'")
            if len(permissions) != len(set(permissions)):
                errors.append("Field 'permissions' must not contain duplicates")

        supported_platforms = manifest.get("supported_platforms", [])
        if not isinstance(supported_platforms, list):
            pass
        else:
            for platform in supported_platforms:
                if platform not in VALID_PLATFORMS:
                    valid = ", ".join(sorted(VALID_PLATFORMS))
                    errors.append(f"Unknown platform: '{platform}'. Valid: {valid}")

        entry_point = manifest.get("entry_point", "")
        if not isinstance(entry_point, str) or entry_point.strip() == "":
            errors.append("Field 'entry_point' must be a non-empty string")

    if not errors:
        return PluginValidationResult(valid=True, errors=[])
    return PluginValidationResult(valid=False, errors=errors)


class PluginService:
    def __init__(self, plugin_repository: PluginRepository) -> None:
        self._repo = plugin_repository

    def list_all(self) -> list[Plugin]:
        return self._repo.list_all()

    def get_by_id(self, plugin_id: int) -> Plugin | None:
        return self._repo.get_by_id(plugin_id)

    def register(self, data: PluginRegister) -> tuple[Plugin | None, PluginValidationResult]:
        manifest = data.model_dump()
        manifest_renamed = {
            "id": manifest["source_id"],
            "name": manifest["name"],
            "version": manifest["version"],
            "description": manifest.get("description", ""),
            "author": manifest.get("author", ""),
            "category": manifest["category"],
            "entry_point": manifest["entry_point"],
            "permissions": manifest.get("permissions", []),
            "supported_platforms": manifest.get("supported_platforms", []),
            "min_careeros_version": manifest["min_careeros_version"],
            "config_schema": manifest.get("config_schema"),
            "homepage": manifest.get("homepage"),
            "license": manifest.get("license"),
        }
        validation = validate_manifest(manifest_renamed)
        if not validation.valid:
            return None, validation

        existing = self._repo.get_by_source_id(data.source_id)
        if existing is not None:
            return None, PluginValidationResult(
                valid=False,
                errors=[f"Plugin with id '{data.source_id}' is already registered"],
            )

        plugin = Plugin(
            source_id=data.source_id,
            name=data.name,
            version=data.version,
            description=data.description,
            author=data.author,
            category=data.category,
            entry_point=data.entry_point,
            permissions_json=json.dumps(data.permissions or []),
            supported_platforms_json=json.dumps(data.supported_platforms or []),
            min_careeros_version=data.min_careeros_version,
            config_schema_json=json.dumps(data.config_schema) if data.config_schema else None,
            homepage=data.homepage,
            license=data.license,
            status="registered",
        )
        return self._repo.create(plugin), validation

    def enable(self, plugin_id: int) -> Plugin | None:
        plugin = self._repo.get_by_id(plugin_id)
        if plugin is None:
            return None
        if plugin.status not in ("registered", "disabled"):
            return None
        plugin.status = "enabled"
        plugin.updated_at = datetime.now(timezone.utc)
        return self._repo.update(plugin)

    def disable(self, plugin_id: int) -> Plugin | None:
        plugin = self._repo.get_by_id(plugin_id)
        if plugin is None:
            return None
        if plugin.status != "enabled":
            return None
        plugin.status = "disabled"
        plugin.updated_at = datetime.now(timezone.utc)
        return self._repo.update(plugin)

    def delete(self, plugin_id: int) -> bool:
        return self._repo.delete(plugin_id)

    def validate_manifest_dict(self, manifest: dict) -> PluginValidationResult:
        return validate_manifest(manifest)
