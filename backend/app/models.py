from app.extensions import db
from sqlalchemy import ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column

class User(db.Model):
    id: Mapped[str] = mapped_column(primary_key=True, unique=True, nullable=False)
    searched_places: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    clusters: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

class Session(db.Model):
    id: Mapped[str] = mapped_column(primary_key=True, unique=True, nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey('user.id'), nullable=False, index=True)
    expiration: Mapped[int] = mapped_column(nullable=False)