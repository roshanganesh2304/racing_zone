"""
RACING ZONE - SQLAlchemy Declarative Models
Maps directly to existing SQLite tables in db.sqlite3.
"""

from datetime import datetime
import json
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime,
    ForeignKey, Text, JSON, BigInteger
)
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "auth_user"

    id = Column(Integer, primary_key=True, index=True)
    password = Column(String(128), nullable=False)
    last_login = Column(DateTime, nullable=True)
    is_superuser = Column(Boolean, default=False, nullable=False)
    username = Column(String(150), unique=True, index=True, nullable=False)
    first_name = Column(String(150), default="", nullable=False)
    last_name = Column(String(150), default="", nullable=False)
    email = Column(String(254), default="", nullable=False)
    is_staff = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    date_joined = Column(DateTime, default=datetime.utcnow, nullable=False)

    profile = relationship("PlayerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")


class PlayerProfile(Base):
    __tablename__ = "accounts_playerprofile"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("auth_user.id"), unique=True, nullable=False)
    nickname = Column(String(50), default="", nullable=False)
    level = Column(Integer, default=1, nullable=False)
    xp = Column(Integer, default=0, nullable=False)
    coins = Column(Integer, default=2500, nullable=False)
    total_races = Column(Integer, default=0, nullable=False)
    total_wins = Column(Integer, default=0, nullable=False)
    best_lap_overall = Column(Float, default=0.0, nullable=False)
    is_guest = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="profile")
    garage_cars = relationship("PlayerCar", back_populates="player", cascade="all, delete-orphan")
    races = relationship("Race", back_populates="player", cascade="all, delete-orphan")
    achievements = relationship("PlayerAchievement", back_populates="player", cascade="all, delete-orphan")

    def xp_needed_for_next_level(self) -> int:
        return self.level * 500

    def add_rewards(self, coins_reward: int, xp_reward: int, won: bool = False) -> bool:
        self.coins += max(0, coins_reward)
        self.xp += max(0, xp_reward)
        self.total_races += 1
        if won:
            self.total_wins += 1

        leveled_up = False
        needed = self.xp_needed_for_next_level()
        while self.xp >= needed:
            self.xp -= needed
            self.level += 1
            self.coins += self.level * 250  # Level up bonus
            leveled_up = True
            needed = self.xp_needed_for_next_level()

        return leveled_up


class Car(Base):
    __tablename__ = "garage_car"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    brand = Column(String(50), nullable=False)
    year = Column(Integer, default=2023, nullable=False)
    category = Column(String(50), default="Supercar", nullable=False)
    engine = Column(String(100), default="V8", nullable=False)
    drivetrain = Column(String(20), default="AWD", nullable=False)
    horsepower = Column(Integer, default=600, nullable=False)
    top_speed_mph = Column(Integer, default=200, nullable=False)
    accel_0_60 = Column(Float, default=3.0, nullable=False)
    weight_kg = Column(Integer, default=1450, nullable=False)
    handling_score = Column(Integer, default=85, nullable=False)
    braking_score = Column(Integer, default=85, nullable=False)
    price = Column(Integer, default=0, nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)
    default_color = Column(String(20), default="#e63946", nullable=False)
    badge_color = Column(String(20), default="#ffffff", nullable=False)
    body_style = Column(String(50), default="coupe", nullable=False)
    audio_pitch = Column(Float, default=1.0, nullable=False)
    specs = Column(JSON, default=dict, nullable=False)

    player_cars = relationship("PlayerCar", back_populates="car", cascade="all, delete-orphan")
    races = relationship("Race", back_populates="car")


class PlayerCar(Base):
    __tablename__ = "garage_playercar"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(BigInteger, ForeignKey("accounts_playerprofile.id"), nullable=False)
    car_id = Column(BigInteger, ForeignKey("garage_car.id"), nullable=False)
    color = Column(String(20), default="#e63946", nullable=False)
    wheel_color = Column(String(20), default="#1a1a1a", nullable=False)
    neon_glow = Column(String(20), default="#00e5ff", nullable=False)
    engine_level = Column(Integer, default=1, nullable=False)
    handling_level = Column(Integer, default=1, nullable=False)
    nitro_level = Column(Integer, default=1, nullable=False)
    is_selected = Column(Boolean, default=False, nullable=False)
    unlocked_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    player = relationship("PlayerProfile", back_populates="garage_cars")
    car = relationship("Car", back_populates="player_cars")


class Track(Base):
    __tablename__ = "races_track"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    country = Column(String(60), nullable=False)
    difficulty = Column(String(20), default="Medium", nullable=False)
    laps = Column(Integer, default=3, nullable=False)
    length_km = Column(Float, default=3.5, nullable=False)
    theme = Column(String(50), default="neon_city", nullable=False)
    surface = Column(String(50), default="Asphalt", nullable=False)
    base_reward = Column(Integer, default=600, nullable=False)
    base_xp = Column(Integer, default=300, nullable=False)
    record_time = Column(Float, default=0.0, nullable=False)
    record_holder = Column(String(60), default="Ghost Rider", nullable=False)
    description = Column(Text, default="", nullable=False)
    layout_data = Column(JSON, default=dict, nullable=False)

    races = relationship("Race", back_populates="track")


class Race(Base):
    __tablename__ = "races_race"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(BigInteger, ForeignKey("accounts_playerprofile.id"), nullable=False)
    car_id = Column(BigInteger, ForeignKey("garage_car.id"), nullable=True)
    track_id = Column(BigInteger, ForeignKey("races_track.id"), nullable=False)
    mode = Column(String(30), default="Quick Race", nullable=False)
    finish_position = Column(Integer, default=1, nullable=False)
    race_time = Column(Float, default=0.0, nullable=False)
    best_lap_time = Column(Float, default=0.0, nullable=False)
    prize_coins = Column(Integer, default=0, nullable=False)
    xp_earned = Column(Integer, default=0, nullable=False)
    accepted = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    player = relationship("PlayerProfile", back_populates="races")
    car = relationship("Car", back_populates="races")
    track = relationship("Track", back_populates="races")


class Achievement(Base):
    __tablename__ = "leaderboard_achievement"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(100), nullable=False)
    description = Column(String(255), nullable=False)
    reward_coins = Column(Integer, default=500, nullable=False)
    icon = Column(String(50), default="trophy", nullable=False)

    player_achievements = relationship("PlayerAchievement", back_populates="achievement")


class PlayerAchievement(Base):
    __tablename__ = "leaderboard_playerachievement"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(BigInteger, ForeignKey("accounts_playerprofile.id"), nullable=False)
    achievement_id = Column(BigInteger, ForeignKey("leaderboard_achievement.id"), nullable=False)
    unlocked_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    player = relationship("PlayerProfile", back_populates="achievements")
    achievement = relationship("Achievement", back_populates="player_achievements")
