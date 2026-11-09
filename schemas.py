"""
RACING ZONE - Pydantic V2 Schemas
Fast Rust-backed serialization and validation for API requests & responses.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict


# Request Models
class RegisterRequest(BaseModel):
    username: str
    password: str
    nickname: Optional[str] = ""


class LoginRequest(BaseModel):
    username: str
    password: str


class CarActionRequest(BaseModel):
    slug: str


class CarPaintRequest(BaseModel):
    slug: str
    color: str = "#ffffff"


class CarUpgradeRequest(BaseModel):
    slug: str
    type: str  # 'engine', 'handling', 'nitro'


class RaceSubmitRequest(BaseModel):
    track_slug: str
    car_slug: Optional[str] = None
    finish_position: int = 4
    race_time: float = 0.0
    best_lap_time: float = 0.0
    top_speed: float = 0.0
    mode: str = "Quick Race"


# Response Models
class ProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    nickname: str
    level: int
    xp: int
    xp_needed: int
    coins: int
    total_races: int
    total_wins: int
    best_lap_overall: float
    is_guest: bool
    created_at: str


class CarOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    name: str
    brand: str
    year: int
    category: str
    engine: str
    drivetrain: str
    horsepower: int
    top_speed_mph: int
    accel_0_60: float
    weight_kg: int
    handling_score: int
    braking_score: int
    price: int
    is_default: bool
    default_color: str
    badge_color: str
    body_style: str
    audio_pitch: float
    specs: Dict[str, Any]
    is_unlocked: bool
    is_selected: bool
    custom_color: str
    engine_level: int
    handling_level: int
    nitro_level: int


class TrackOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    name: str
    country: str
    difficulty: str
    laps: int
    length_km: float
    theme: str
    surface: str
    base_reward: int
    base_xp: int
    record_time: float
    record_holder: str
    description: str
    layout_data: Dict[str, Any]


class RaceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    track_name: str
    car_name: str
    car_brand: str
    player_nickname: str
    mode: str
    finish_position: int
    race_time: float
    best_lap_time: float
    prize_coins: int
    xp_earned: int
    created_at: str


class AchievementOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    title: str
    description: str
    reward_coins: int
    icon: str
    unlocked: bool
    unlocked_at: Optional[str] = None


class LeaderboardPlayerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    player_name: str
    username: str
    level: int
    coins: int
    total_races: int
    total_wins: int
    best_lap_overall: float
