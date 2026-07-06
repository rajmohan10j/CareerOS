from pydantic import BaseModel


class ApplicationSessionEnsure(BaseModel):
    url: str
    page_title: str | None = None
    job_title: str | None = None
    company: str | None = None


class ApplicationSessionNextEntry(BaseModel):
    url: str
    section: str


class ApplicationSessionMarkEntry(BaseModel):
    url: str
    section: str
    index: int
    status: str = "filled"
    notes: str | None = None


class ApplicationSessionResponse(BaseModel):
    id: str
    url: str
    page_title: str | None = None
    job_title: str | None = None
    company: str | None = None
    status: str
    progress: dict
    created_at: str
    updated_at: str
