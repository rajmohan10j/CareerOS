from sqlmodel import Session, select

from app.models.plugin import Plugin


class PluginRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_all(self) -> list[Plugin]:
        statement = select(Plugin).order_by(Plugin.updated_at.desc())
        return list(self.session.exec(statement).all())

    def get_by_id(self, plugin_id: int) -> Plugin | None:
        return self.session.get(Plugin, plugin_id)

    def get_by_source_id(self, source_id: str) -> Plugin | None:
        statement = select(Plugin).where(Plugin.source_id == source_id)
        return self.session.exec(statement).first()

    def create(self, plugin: Plugin) -> Plugin:
        self.session.add(plugin)
        self.session.commit()
        self.session.refresh(plugin)
        return plugin

    def update(self, plugin: Plugin) -> Plugin:
        self.session.add(plugin)
        self.session.commit()
        self.session.refresh(plugin)
        return plugin

    def delete(self, plugin_id: int) -> bool:
        plugin = self.session.get(Plugin, plugin_id)
        if plugin is None:
            return False
        self.session.delete(plugin)
        self.session.commit()
        return True
