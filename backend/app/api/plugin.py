from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.core.database import get_session
from app.repositories.plugin import PluginRepository
from app.schemas.plugin import PluginRegister, PluginValidate
from app.services.plugin_service import PluginService, plugin_to_response

router = APIRouter()


def _service(session: Session) -> PluginService:
    return PluginService(PluginRepository(session))


@router.get("/plugins")
def list_plugins(session: Session = Depends(get_session)):
    service = _service(session)
    plugins = service.list_all()
    return [plugin_to_response(p) for p in plugins]


@router.post("/plugins/register", status_code=201)
def register_plugin(body: PluginRegister, session: Session = Depends(get_session)):
    service = _service(session)
    plugin, validation = service.register(body)
    if not validation.valid:
        raise HTTPException(status_code=400, detail=validation.errors)
    if plugin is None:
        raise HTTPException(status_code=400, detail="Registration failed")
    return plugin_to_response(plugin)


@router.post("/plugins/validate")
def validate_plugin(body: PluginValidate, session: Session = Depends(get_session)):
    service = _service(session)
    return service.validate_manifest_dict(body.manifest)


@router.get("/plugins/{plugin_id}")
def get_plugin(plugin_id: int, session: Session = Depends(get_session)):
    service = _service(session)
    plugin = service.get_by_id(plugin_id)
    if plugin is None:
        raise HTTPException(status_code=404, detail="Plugin not found")
    return plugin_to_response(plugin)


@router.post("/plugins/{plugin_id}/enable")
def enable_plugin(plugin_id: int, session: Session = Depends(get_session)):
    service = _service(session)
    plugin = service.enable(plugin_id)
    if plugin is None:
        raise HTTPException(status_code=404, detail="Plugin not found or cannot be enabled")
    return plugin_to_response(plugin)


@router.post("/plugins/{plugin_id}/disable")
def disable_plugin(plugin_id: int, session: Session = Depends(get_session)):
    service = _service(session)
    plugin = service.disable(plugin_id)
    if plugin is None:
        raise HTTPException(status_code=404, detail="Plugin not found or cannot be disabled")
    return plugin_to_response(plugin)


@router.delete("/plugins/{plugin_id}", status_code=204)
def delete_plugin(plugin_id: int, session: Session = Depends(get_session)):
    service = _service(session)
    if not service.delete(plugin_id):
        raise HTTPException(status_code=404, detail="Plugin not found")
