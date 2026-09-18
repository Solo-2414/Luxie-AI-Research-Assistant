from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)

    saved_research: Mapped[list["SavedResearch"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    search_history: Mapped[list["SearchHistory"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )


class SavedResearch(Base):
    __tablename__ = "saved_research"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    query: Mapped[str] = mapped_column(String(500), nullable=False)
    review_text: Mapped[str] = mapped_column(Text, nullable=False)
    papers_json: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    user: Mapped[User] = relationship(back_populates="saved_research")


class SearchHistory(Base):
    __tablename__ = "search_history"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    query: Mapped[str] = mapped_column(String(500), nullable=False)
    results_count: Mapped[int] = mapped_column(default=0, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    user: Mapped[User] = relationship(back_populates="search_history")
