from sqlalchemy import Column, Integer, SmallInteger, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql.sqltypes import TIMESTAMP
from sqlalchemy.sql.expression import text

from .database import Base


class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, unique=True, nullable=False)
    username = Column(String, nullable=False, unique=True)
    username_last_changed = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text('now()'))
    password = Column(String, nullable=False)
    date_joined = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text('now()'))
    is_active = Column(Boolean, nullable=False, server_default='TRUE')
    is_admin = Column(Boolean, nullable=False, server_default='FALSE')
    kinopoisk_username = Column(String, nullable=True, unique=False)


class Movie(Base):
    __tablename__ = 'movies'

    id = Column(Integer, primary_key=True, unique=True, nullable=False)
    title = Column(String, nullable=False)
    cover_url = Column(String, nullable=False)
    rezka_url = Column(String, nullable=False)
    date_created = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text('now()'))


class Timecode(Base):
    __tablename__ = 'timecodes'

    id = Column(Integer, primary_key=True, unique=True, nullable=False)
    movie_id = Column(Integer, ForeignKey('movies.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    last_watched = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text('now()'))
    is_watched = Column(Boolean, nullable=False, server_default='FALSE')
    timecode = Column(SmallInteger, nullable=False)
    duration = Column(SmallInteger, nullable=False)
    translator = Column(SmallInteger, nullable=True)
    season = Column(SmallInteger, nullable=True)
    episode = Column(SmallInteger, nullable=True)

    user = relationship('User')
    movie = relationship('Movie')
