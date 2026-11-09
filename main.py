"""
RACING ZONE - Pure FastAPI High-Performance Application Server
100% Native FastAPI + Uvicorn + SQLAlchemy + Pydantic V2.
Zero Django dependencies. Direct connection to SQLite (db.sqlite3).
"""

import sys
import os
import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any

# Auto-inject virtual environment site-packages if running with system Python in terminal
_project_root = Path(__file__).resolve().parent
for _vd in [_project_root / "venv", _project_root.parent / "venv"]:
    if _vd.exists():
        for _sp in _vd.glob("lib/python*/site-packages"):
            if str(_sp) not in sys.path:
                sys.path.insert(0, str(_sp))
        _venv_bin = str(_vd / "bin")
        if _venv_bin not in os.environ.get("PATH", ""):
            os.environ["PATH"] = f"{_venv_bin}:{os.environ.get('PATH', '')}"
        break

from fastapi import FastAPI, Request, Response, Depends, HTTPException, status, Query
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from sqlalchemy.orm import Session

import models
import schemas
import auth
from database import engine, get_db

BASE_DIR = Path(__file__).resolve().parent

app = FastAPI(
    title="Racing Zone GT API",
    description="High-Octane 3D Racing Web Application - 100% Pure FastAPI Architecture",
    version="2.0.0"
)

# 1. Middlewares
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    SessionMiddleware,
    secret_key="racing-zone-ultra-secure-fastapi-key-2026",
    session_cookie="rz_session",
    max_age=14 * 24 * 3600,  # 14 days
    same_site="lax",
    https_only=False,
)

# 2. Mount Static Files
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")


# 3. Session & Profile Resolver
def get_current_profile(request: Request, db: Session = Depends(get_db)) -> models.PlayerProfile:
    session = request.session

    # Check for authenticated user ID in session
    user_id = session.get("user_id")
    if user_id:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if user:
            profile = db.query(models.PlayerProfile).filter(models.PlayerProfile.user_id == user.id).first()
            if not profile:
                profile = models.PlayerProfile(
                    user_id=user.id,
                    nickname=user.first_name or user.username
                )
                db.add(profile)
                db.commit()
                db.refresh(profile)
            ensure_starter_cars(profile, db)
            return profile

    # Check for guest user ID in session
    guest_user_id = session.get("guest_user_id")
    if guest_user_id:
        guest_user = db.query(models.User).filter(models.User.id == guest_user_id).first()
        if guest_user:
            profile = db.query(models.PlayerProfile).filter(models.PlayerProfile.user_id == guest_user.id).first()
            if not profile:
                profile = models.PlayerProfile(
                    user_id=guest_user.id,
                    nickname=guest_user.first_name or guest_user.username,
                    coins=2500,
                    is_guest=True
                )
                db.add(profile)
                db.commit()
                db.refresh(profile)
            ensure_starter_cars(profile, db)
            return profile

    # Create new guest user & assign default starter cars
    unique_id = uuid.uuid4().hex[:6]
    username = f"racer_{unique_id}"
    nickname = f"Racer #{unique_id.upper()}"

    guest_user = models.User(
        username=username,
        first_name=nickname,
        password=auth.make_unusable_password(),
        is_active=True
    )
    db.add(guest_user)
    db.commit()
    db.refresh(guest_user)

    session["guest_user_id"] = guest_user.id

    profile = models.PlayerProfile(
        user_id=guest_user.id,
        nickname=nickname,
        coins=2500,
        is_guest=True
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)

    ensure_starter_cars(profile, db)
    return profile


def ensure_starter_cars(profile: models.PlayerProfile, db: Session):
    """Guarantees that player has both a starter street supercar and F1 vehicle unlocked."""
    owned_car_ids = {pc.car_id for pc in profile.garage_cars}
    street_car = db.query(models.Car).filter(models.Car.slug == "nissan-gtr-nismo").first()
    if not street_car:
        street_car = db.query(models.Car).filter(models.Car.category != "Formula 1").first()

    has_selected = any(pc.is_selected for pc in profile.garage_cars)

    if street_car and street_car.id not in owned_car_ids:
        pc_street = models.PlayerCar(
            player_id=profile.id,
            car_id=street_car.id,
            color=street_car.default_color,
            is_selected=not has_selected
        )
        db.add(pc_street)
        has_selected = True

    f1_car = db.query(models.Car).filter(models.Car.slug == "f1-2022-ferrari").first()
    if not f1_car:
        f1_car = db.query(models.Car).filter(models.Car.is_default == True).first()

    if f1_car and f1_car.id not in owned_car_ids:
        pc_f1 = models.PlayerCar(
            player_id=profile.id,
            car_id=f1_car.id,
            color=f1_car.default_color,
            is_selected=not has_selected
        )
        db.add(pc_f1)

    db.commit()
    db.refresh(profile)


def serialize_profile(profile: models.PlayerProfile) -> schemas.ProfileOut:
    return schemas.ProfileOut(
        id=profile.id,
        username=profile.user.username if profile.user else "",
        nickname=profile.nickname,
        level=profile.level,
        xp=profile.xp,
        xp_needed=profile.xp_needed_for_next_level(),
        coins=profile.coins,
        total_races=profile.total_races,
        total_wins=profile.total_wins,
        best_lap_overall=profile.best_lap_overall,
        is_guest=profile.is_guest,
        created_at=profile.created_at.isoformat() if hasattr(profile.created_at, "isoformat") else str(profile.created_at)
    )


# ==========================================
# 4. Web Application Routes
# ==========================================

@app.get("/", response_class=HTMLResponse)
async def serve_home(request: Request, db: Session = Depends(get_db)):
    get_current_profile(request, db)
    template_path = BASE_DIR / "templates" / "index.html"
    content = template_path.read_text(encoding="utf-8")
    response = HTMLResponse(content=content)
    if not request.cookies.get("csrftoken"):
        response.set_cookie(key="csrftoken", value="fastapi-pure-token", httponly=False)
    return response


# ==========================================
# 5. Authentication & Profile API
# ==========================================

@app.get("/api/profile/", response_model=schemas.ProfileOut)
async def api_get_profile(profile: models.PlayerProfile = Depends(get_current_profile)):
    return serialize_profile(profile)


@app.post("/api/auth/register/")
async def api_register(
    req: schemas.RegisterRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    username = req.username.strip()
    password = req.password.strip()
    nickname = req.nickname.strip() or username

    if not username or not password:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Username and password are required"}
        )

    if db.query(models.User).filter(models.User.username == username).first():
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Username is already taken"}
        )

    # Check for active guest session progress migration
    guest_user_id = request.session.get("guest_user_id")
    guest_profile = None
    if guest_user_id:
        guest_profile = db.query(models.PlayerProfile).filter(models.PlayerProfile.user_id == guest_user_id).first()

    # Create new registered user with PBKDF2 hashed password
    hashed_password = auth.make_password(password)
    new_user = models.User(
        username=username,
        password=hashed_password,
        first_name=nickname,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    request.session["user_id"] = new_user.id

    if guest_profile:
        # Transfer all progress and vehicles
        profile = models.PlayerProfile(
            user_id=new_user.id,
            nickname=nickname,
            level=guest_profile.level,
            xp=guest_profile.xp,
            coins=guest_profile.coins,
            total_races=guest_profile.total_races,
            total_wins=guest_profile.total_wins,
            best_lap_overall=guest_profile.best_lap_overall,
            is_guest=False
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

        for pc in guest_profile.garage_cars:
            existing = db.query(models.PlayerCar).filter(
                models.PlayerCar.player_id == profile.id,
                models.PlayerCar.car_id == pc.car_id
            ).first()
            if not existing:
                new_pc = models.PlayerCar(
                    player_id=profile.id,
                    car_id=pc.car_id,
                    color=pc.color,
                    wheel_color=pc.wheel_color,
                    neon_glow=pc.neon_glow,
                    engine_level=pc.engine_level,
                    handling_level=pc.handling_level,
                    nitro_level=pc.nitro_level,
                    is_selected=pc.is_selected
                )
                db.add(new_pc)
        db.commit()
    else:
        profile = models.PlayerProfile(
            user_id=new_user.id,
            nickname=nickname,
            coins=3000,
            is_guest=False
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

        default_car = db.query(models.Car).filter(models.Car.is_default == True).first() or db.query(models.Car).first()
        if default_car:
            pc = models.PlayerCar(
                player_id=profile.id,
                car_id=default_car.id,
                color=default_car.default_color,
                is_selected=True
            )
            db.add(pc)
            db.commit()

    if "guest_user_id" in request.session:
        del request.session["guest_user_id"]

    return {"message": "Registration successful", "profile": serialize_profile(profile).model_dump()}


@app.post("/api/auth/login/")
async def api_login(
    req: schemas.LoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    username = req.username.strip()
    password = req.password.strip()

    user = db.query(models.User).filter(models.User.username == username).first()
    if not user or not auth.check_password(password, user.password):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Invalid username or password"}
        )

    request.session["user_id"] = user.id
    if "guest_user_id" in request.session:
        del request.session["guest_user_id"]

    profile = db.query(models.PlayerProfile).filter(models.PlayerProfile.user_id == user.id).first()
    if not profile:
        profile = models.PlayerProfile(user_id=user.id, nickname=user.first_name or user.username)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return {"message": "Logged in successfully", "profile": serialize_profile(profile).model_dump()}


@app.post("/api/auth/logout/")
async def api_logout(request: Request):
    request.session.clear()
    return {"message": "Logged out successfully"}


# ==========================================
# 6. Garage & Cars API
# ==========================================

@app.get("/api/cars/", response_model=List[schemas.CarOut])
async def api_get_cars(
    profile: models.PlayerProfile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    cars = db.query(models.Car).all()
    player_cars = {pc.car_id: pc for pc in profile.garage_cars}

    result = []
    for c in cars:
        pc = player_cars.get(c.id)
        specs_data = c.specs if isinstance(c.specs, dict) else (json.loads(c.specs) if c.specs else {})
        result.append(schemas.CarOut(
            id=c.id,
            slug=c.slug,
            name=c.name,
            brand=c.brand,
            year=c.year,
            category=c.category,
            engine=c.engine,
            drivetrain=c.drivetrain,
            horsepower=c.horsepower,
            top_speed_mph=c.top_speed_mph,
            accel_0_60=c.accel_0_60,
            weight_kg=c.weight_kg,
            handling_score=c.handling_score,
            braking_score=c.braking_score,
            price=c.price,
            is_default=c.is_default,
            default_color=c.default_color,
            badge_color=c.badge_color,
            body_style=c.body_style,
            audio_pitch=c.audio_pitch,
            specs=specs_data,
            is_unlocked=(pc is not None) or c.is_default,
            is_selected=pc.is_selected if pc else False,
            custom_color=pc.color if pc else c.default_color,
            engine_level=pc.engine_level if pc else 1,
            handling_level=pc.handling_level if pc else 1,
            nitro_level=pc.nitro_level if pc else 1
        ))
    return result


@app.post("/api/garage/buy/")
async def api_buy_car(
    req: schemas.CarActionRequest,
    profile: models.PlayerProfile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    car = db.query(models.Car).filter(models.Car.slug == req.slug).first()
    if not car:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"error": "Car not found"}
        )

    owned = db.query(models.PlayerCar).filter(
        models.PlayerCar.player_id == profile.id,
        models.PlayerCar.car_id == car.id
    ).first()
    if owned:
        return {"message": "Car already unlocked", "already_owned": True}

    if profile.coins < car.price:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": f"Insufficient credits. Need {car.price - profile.coins} more coins!"}
        )

    # Deduct coins & unlock
    profile.coins -= car.price

    # Unselect others
    for pc in profile.garage_cars:
        pc.is_selected = False

    new_car = models.PlayerCar(
        player_id=profile.id,
        car_id=car.id,
        color=car.default_color,
        is_selected=True
    )
    db.add(new_car)
    db.commit()

    return {
        "message": f"Successfully acquired {car.brand} {car.name}!",
        "coins_remaining": profile.coins,
        "car_slug": car.slug
    }


@app.post("/api/garage/select/")
async def api_select_car(
    req: schemas.CarActionRequest,
    profile: models.PlayerProfile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    car = db.query(models.Car).filter(models.Car.slug == req.slug).first()
    if not car:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Car is locked or does not exist"}
        )

    pc = db.query(models.PlayerCar).filter(
        models.PlayerCar.player_id == profile.id,
        models.PlayerCar.car_id == car.id
    ).first()
    if not pc:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Car is locked or does not exist"}
        )

    for other in profile.garage_cars:
        other.is_selected = False

    pc.is_selected = True
    db.commit()

    return {
        "message": f"Active car set to {car.brand} {car.name}",
        "selected_slug": car.slug
    }


@app.post("/api/garage/paint/")
async def api_paint_car(
    req: schemas.CarPaintRequest,
    profile: models.PlayerProfile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    car = db.query(models.Car).filter(models.Car.slug == req.slug).first()
    if not car:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Car not found in your garage"}
        )

    pc = db.query(models.PlayerCar).filter(
        models.PlayerCar.player_id == profile.id,
        models.PlayerCar.car_id == car.id
    ).first()
    if not pc:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Car not found in your garage"}
        )

    # Formula 1 livery protection
    is_f1 = (
        car.category == "Formula 1"
        or car.slug.startswith("f1-")
        or car.slug == "mclaren-mp45"
        or (car.body_style and car.body_style.startswith("formula1"))
    )
    if is_f1:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Formula 1 vehicles use official racing liveries and cannot be repainted."}
        )

    pc.color = req.color.strip()
    db.commit()

    return {
        "message": "Custom paint applied!",
        "color": pc.color
    }


@app.post("/api/garage/upgrade/")
async def api_upgrade_car(
    req: schemas.CarUpgradeRequest,
    profile: models.PlayerProfile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    car = db.query(models.Car).filter(models.Car.slug == req.slug).first()
    if not car:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Car not found in garage"}
        )

    pc = db.query(models.PlayerCar).filter(
        models.PlayerCar.player_id == profile.id,
        models.PlayerCar.car_id == car.id
    ).first()
    if not pc:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Car not found in garage"}
        )

    cost = 1000
    if profile.coins < cost:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": f"Upgrade costs {cost} coins. Insufficient funds."}
        )

    upgrade_type = req.type.lower()
    if upgrade_type == "engine" and pc.engine_level < 5:
        pc.engine_level += 1
    elif upgrade_type == "handling" and pc.handling_level < 5:
        pc.handling_level += 1
    elif upgrade_type == "nitro" and pc.nitro_level < 5:
        pc.nitro_level += 1
    else:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Maximum upgrade stage reached"}
        )

    profile.coins -= cost
    db.commit()

    return {
        "message": f"{upgrade_type.title()} upgraded to Stage {getattr(pc, f'{upgrade_type}_level')}!",
        "coins": profile.coins,
        "engine_level": pc.engine_level,
        "handling_level": pc.handling_level,
        "nitro_level": pc.nitro_level
    }


# ==========================================
# 7. Tracks & Races API
# ==========================================

@app.get("/api/tracks/", response_model=List[schemas.TrackOut])
async def api_get_tracks(db: Session = Depends(get_db)):
    tracks = db.query(models.Track).order_by(models.Track.id.asc()).all()
    result = []
    for t in tracks:
        layout = t.layout_data if isinstance(t.layout_data, dict) else (json.loads(t.layout_data) if t.layout_data else {})
        result.append(schemas.TrackOut(
            id=t.id,
            slug=t.slug,
            name=t.name,
            country=t.country,
            difficulty=t.difficulty,
            laps=t.laps,
            length_km=t.length_km,
            theme=t.theme,
            surface=t.surface,
            base_reward=t.base_reward,
            base_xp=t.base_xp,
            record_time=t.record_time,
            record_holder=t.record_holder,
            description=t.description,
            layout_data=layout
        ))
    return result


@app.post("/api/races/")
async def api_submit_race(
    req: schemas.RaceSubmitRequest,
    profile: models.PlayerProfile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    track = db.query(models.Track).filter(models.Track.slug == req.track_slug).first()
    if not track:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"error": "Track not found"}
        )

    car = db.query(models.Car).filter(models.Car.slug == req.car_slug).first() if req.car_slug else None

    # Multiplier based on position
    multipliers = {1: 1.0, 2: 0.65, 3: 0.45, 4: 0.25}
    mult = multipliers.get(req.finish_position, 0.2)

    prize_coins = int(track.base_reward * mult)
    xp_earned = int(track.base_xp * mult)

    # Check for track record
    new_record = False
    if req.best_lap_time > 10.0:
        if track.record_time == 0.0 or req.best_lap_time < track.record_time:
            track.record_time = round(req.best_lap_time, 2)
            track.record_holder = profile.nickname or (profile.user.username if profile.user else "Racer")
            new_record = True
            prize_coins += 500  # Bonus coins

    # Create race log
    race = models.Race(
        player_id=profile.id,
        car_id=car.id if car else None,
        track_id=track.id,
        mode=req.mode,
        finish_position=req.finish_position,
        race_time=round(req.race_time, 2),
        best_lap_time=round(req.best_lap_time, 2),
        prize_coins=prize_coins,
        xp_earned=xp_earned,
        accepted=True
    )
    db.add(race)

    # Update profile rewards
    leveled_up = profile.add_rewards(prize_coins, xp_earned, won=(req.finish_position == 1))
    if req.best_lap_time > 0 and (profile.best_lap_overall == 0 or req.best_lap_time < profile.best_lap_overall):
        profile.best_lap_overall = round(req.best_lap_time, 2)

    db.commit()
    db.refresh(race)

    # Check Achievements
    new_achievements = []

    # 1. First Blood
    if req.finish_position <= 3:
        ach = db.query(models.Achievement).filter(models.Achievement.code == "first_blood").first()
        if ach:
            pa = db.query(models.PlayerAchievement).filter(
                models.PlayerAchievement.player_id == profile.id,
                models.PlayerAchievement.achievement_id == ach.id
            ).first()
            if not pa:
                db.add(models.PlayerAchievement(player_id=profile.id, achievement_id=ach.id))
                profile.coins += ach.reward_coins
                new_achievements.append(ach.title)

    # 2. Speed Demon (> 200 mph)
    if req.top_speed >= 200:
        ach = db.query(models.Achievement).filter(models.Achievement.code == "speed_demon").first()
        if ach:
            pa = db.query(models.PlayerAchievement).filter(
                models.PlayerAchievement.player_id == profile.id,
                models.PlayerAchievement.achievement_id == ach.id
            ).first()
            if not pa:
                db.add(models.PlayerAchievement(player_id=profile.id, achievement_id=ach.id))
                profile.coins += ach.reward_coins
                new_achievements.append(ach.title)

    # 3. Champion (5 wins)
    if profile.total_wins >= 5:
        ach = db.query(models.Achievement).filter(models.Achievement.code == "champion").first()
        if ach:
            pa = db.query(models.PlayerAchievement).filter(
                models.PlayerAchievement.player_id == profile.id,
                models.PlayerAchievement.achievement_id == ach.id
            ).first()
            if not pa:
                db.add(models.PlayerAchievement(player_id=profile.id, achievement_id=ach.id))
                profile.coins += ach.reward_coins
                new_achievements.append(ach.title)

    # 4. Collector (3+ cars)
    if len(profile.garage_cars) >= 3:
        ach = db.query(models.Achievement).filter(models.Achievement.code == "collector").first()
        if ach:
            pa = db.query(models.PlayerAchievement).filter(
                models.PlayerAchievement.player_id == profile.id,
                models.PlayerAchievement.achievement_id == ach.id
            ).first()
            if not pa:
                db.add(models.PlayerAchievement(player_id=profile.id, achievement_id=ach.id))
                profile.coins += ach.reward_coins
                new_achievements.append(ach.title)

    db.commit()

    return {
        "message": "Race results validated and recorded!",
        "race_id": race.id,
        "finish_position": req.finish_position,
        "prize_coins": prize_coins,
        "xp_earned": xp_earned,
        "new_record": new_record,
        "leveled_up": leveled_up,
        "new_level": profile.level,
        "current_coins": profile.coins,
        "current_xp": profile.xp,
        "xp_needed": profile.xp_needed_for_next_level(),
        "new_achievements": new_achievements
    }


@app.get("/api/races/history/", response_model=List[schemas.RaceOut])
async def api_race_history(
    profile: models.PlayerProfile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    races = db.query(models.Race).filter(models.Race.player_id == profile.id).order_by(models.Race.id.desc()).limit(20).all()
    result = []
    for r in races:
        result.append(schemas.RaceOut(
            id=r.id,
            track_name=r.track.name if r.track else "Grand Prix",
            car_name=r.car.name if r.car else "Supercar",
            car_brand=r.car.brand if r.car else "Racing",
            player_nickname=profile.nickname,
            mode=r.mode,
            finish_position=r.finish_position,
            race_time=r.race_time,
            best_lap_time=r.best_lap_time,
            prize_coins=r.prize_coins,
            xp_earned=r.xp_earned,
            created_at=r.created_at.strftime("%Y-%m-%d %H:%M") if hasattr(r.created_at, "strftime") else str(r.created_at)
        ))
    return result


# ==========================================
# 8. Leaderboard & Rewards API
# ==========================================

@app.get("/api/leaderboard/")
async def api_leaderboard(
    category: str = Query("wins"),
    track: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    if category == "track" and track:
        track_obj = db.query(models.Track).filter(models.Track.slug == track).first()
        if not track_obj:
            return {"category": "track", "track": track, "rankings": []}

        races = db.query(models.Race).filter(
            models.Race.track_id == track_obj.id,
            models.Race.accepted == True,
            models.Race.best_lap_time > 5.0
        ).order_by(models.Race.best_lap_time.asc()).limit(15).all()

        rankings = []
        for idx, r in enumerate(races, start=1):
            p_name = r.player.nickname if r.player else "Racer"
            c_name = f"{r.car.brand} {r.car.name}" if r.car else "Supercar"
            date_str = r.created_at.strftime("%Y-%m-%d") if hasattr(r.created_at, "strftime") else str(r.created_at)[:10]
            rankings.append({
                "rank": idx,
                "player_name": p_name,
                "car_name": c_name,
                "best_lap": r.best_lap_time,
                "race_time": r.race_time,
                "date": date_str
            })
        return {"category": "track", "track": track, "rankings": rankings}

    elif category == "level":
        profiles = db.query(models.PlayerProfile).order_by(
            models.PlayerProfile.level.desc(),
            models.PlayerProfile.xp.desc()
        ).limit(15).all()
    else:  # 'wins'
        profiles = db.query(models.PlayerProfile).order_by(
            models.PlayerProfile.total_wins.desc(),
            models.PlayerProfile.total_races.desc()
        ).limit(15).all()

    rankings = []
    for p in profiles:
        rankings.append({
            "id": p.id,
            "player_name": p.nickname,
            "username": p.user.username if p.user else "",
            "level": p.level,
            "coins": p.coins,
            "total_races": p.total_races,
            "total_wins": p.total_wins,
            "best_lap_overall": p.best_lap_overall
        })

    return {"category": category, "rankings": rankings}


@app.get("/api/rewards/", response_model=List[schemas.AchievementOut])
async def api_rewards(
    profile: models.PlayerProfile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    achievements = db.query(models.Achievement).all()
    player_ach_map = {pa.achievement_id: pa for pa in profile.achievements}

    result = []
    for ach in achievements:
        pa = player_ach_map.get(ach.id)
        result.append(schemas.AchievementOut(
            id=ach.id,
            code=ach.code,
            title=ach.title,
            description=ach.description,
            reward_coins=ach.reward_coins,
            icon=ach.icon,
            unlocked=(pa is not None),
            unlocked_at=pa.unlocked_at.isoformat() if pa and hasattr(pa.unlocked_at, "isoformat") else None
        ))
    return result


# ==========================================
# 9. Health & Info
# ==========================================

@app.get("/health/")
async def health_check():
    return {
        "status": "ok",
        "framework": "FastAPI (Pure Native)",
        "orm": "SQLAlchemy 2.0",
        "validation": "Pydantic V2",
        "database": "SQLite (db.sqlite3)",
        "version": "2.0.0"
    }


if __name__ == "__main__":
    import subprocess
    import socket
    import uvicorn

    # Check and optionally start Multiplayer WebSocket Server
    mp_script = BASE_DIR / "races" / "multiplayer_server.py"
    mp_proc = None
    if mp_script.exists():
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(0.5)
                is_running = (s.connect_ex(("127.0.0.1", 8081)) == 0)
            if not is_running:
                mp_proc = subprocess.Popen([sys.executable, str(mp_script), "0.0.0.0", "8081"])
                print(f"⚡ Racing Zone Multiplayer Server started on ws://0.0.0.0:8081 (PID: {mp_proc.pid})")
        except Exception as e:
            print("⚠️ Note: Could not auto-spawn multiplayer server:", e)

    print("==========================================================")
    print("🏎️  Racing Zone Web Application (FastAPI)")
    print("🌐 Localhost:   http://127.0.0.1:8080/")
    print("⚡ Multiplayer: ws://127.0.0.1:8081/")
    print("==========================================================")

    try:
        uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)
    finally:
        if mp_proc:
            print("\n🛑 Shutting down Multiplayer Server...")
            mp_proc.terminate()
            try:
                mp_proc.wait(timeout=2)
            except Exception:
                mp_proc.kill()

