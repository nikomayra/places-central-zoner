from app.extensions import db
from sqlalchemy import ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column

class User(db.Model):
    id: Mapped[str] = mapped_column(primary_key=True, unique=True, nullable=False)
    searched_places: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    clusters: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    search_center: Mapped[dict] = mapped_column(JSON, nullable=False, default={
    'lat': 47.608013,
    'lng': -122.335167,
  })
    search_radius: Mapped[int] = mapped_column(nullable=False, default=5)

class Session(db.Model):
    id: Mapped[str] = mapped_column(primary_key=True, unique=True, nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey('user.id'), nullable=False, index=True)
    expiration: Mapped[int] = mapped_column(nullable=False)