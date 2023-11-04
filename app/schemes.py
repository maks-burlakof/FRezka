from pydantic import BaseModel, field_validator


class User(BaseModel):
    username: str
    password: str
    is_admin: bool


class Movie(BaseModel):
    title: str
    cover_url: str
    kinopoisk_url: str
    rezka_url: str
