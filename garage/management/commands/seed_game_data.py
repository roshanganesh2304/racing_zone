from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from accounts.models import PlayerProfile
from garage.models import Car, PlayerCar
from races.models import Track, Race
from leaderboard.models import Achievement

class Command(BaseCommand):
    help = 'Seeds initial real-life cars, tracks, achievements and default player data'

    def handle(self, *args, **kwargs):
        self.stdout.write("Seeding real-life cars...")
        cars_data = [
            {
                'slug': 'nissan-gtr-nismo',
                'name': 'GT-R Nismo (R35)',
                'brand': 'Nissan',
                'year': 2024,
                'category': 'Track Spec JDM',
                'engine': '3.8L Twin-Turbo VR38DETT V6',
                'drivetrain': 'ATTESA E-TS AWD',
                'horsepower': 600,
                'top_speed_mph': 205,
                'accel_0_60': 2.9,
                'weight_kg': 1720,
                'handling_score': 88,
                'braking_score': 87,
                'price': 0, # Starter car!
                'is_default': True,
                'default_color': '#f2f2f2', # Pearl white
                'badge_color': '#e60012',
                'body_style': 'coupe',
                'audio_pitch': 0.95,
                'specs': {
                    'torque_nm': 652,
                    'rpm_redline': 7200,
                    'boost_psi': 21.0,
                    'livery': 'nismo_stripes',
                    'accent_color': '#d90429'
                }
            },
            {
                'slug': 'bmw-m3-competition',
                'name': 'M3 Competition (G80)',
                'brand': 'BMW',
                'year': 2024,
                'category': 'Sport Sedan',
                'engine': '3.0L Twin-Turbo S58 Inline-6',
                'drivetrain': 'M xDrive AWD',
                'horsepower': 503,
                'top_speed_mph': 180,
                'accel_0_60': 3.4,
                'weight_kg': 1730,
                'handling_score': 91,
                'braking_score': 90,
                'price': 2200,
                'is_default': False,
                'default_color': '#1f4068', # Isle of Man Green or Tanzanite Blue
                'badge_color': '#0099ff',
                'body_style': 'sport_sedan',
                'audio_pitch': 0.98,
                'specs': {
                    'torque_nm': 650,
                    'rpm_redline': 7200,
                    'boost_psi': 24.7,
                    'livery': 'm_tricolor_stripes',
                    'accent_color': '#ff0033'
                }
            },
            {
                'slug': 'porsche-911-gt3-rs',
                'name': '911 GT3 RS (992)',
                'brand': 'Porsche',
                'year': 2023,
                'category': 'Track Weapon',
                'engine': '4.0L Naturally Aspirated Flat-6',
                'drivetrain': 'Rear-Wheel Drive (RWD)',
                'horsepower': 518,
                'top_speed_mph': 184,
                'accel_0_60': 3.0,
                'weight_kg': 1450,
                'handling_score': 98,
                'braking_score': 97,
                'price': 3500,
                'is_default': False,
                'default_color': '#00bcd4', # Shark Blue
                'badge_color': '#ffd600',
                'body_style': 'gt_wing',
                'audio_pitch': 1.15,
                'specs': {
                    'torque_nm': 465,
                    'rpm_redline': 9000,
                    'boost_psi': 0.0,
                    'livery': 'gt3_side_script',
                    'accent_color': '#111111'
                }
            },
            {
                'slug': 'ferrari-sf90-stradale',
                'name': 'SF90 Stradale',
                'brand': 'Ferrari',
                'year': 2023,
                'category': 'Hybrid Hypercar',
                'engine': '4.0L Twin-Turbo V8 + 3 Electric Motors',
                'drivetrain': 'e-4WD',
                'horsepower': 986,
                'top_speed_mph': 211,
                'accel_0_60': 2.0,
                'weight_kg': 1570,
                'handling_score': 94,
                'braking_score': 95,
                'price': 8500,
                'is_default': False,
                'default_color': '#e60026', # Corsa Rosso
                'badge_color': '#ffdf00',
                'body_style': 'hypercar',
                'audio_pitch': 1.05,
                'specs': {
                    'torque_nm': 800,
                    'rpm_redline': 8000,
                    'boost_psi': 24.5,
                    'livery': 'assetto_fiorano',
                    'accent_color': '#ffffff'
                }
            },
            {
                'slug': 'lamborghini-huracan-sto',
                'name': 'Huracán STO',
                'brand': 'Lamborghini',
                'year': 2023,
                'category': 'Super Trofeo',
                'engine': '5.2L Naturally Aspirated V10',
                'drivetrain': 'Rear-Wheel Drive (RWD)',
                'horsepower': 631,
                'top_speed_mph': 193,
                'accel_0_60': 2.8,
                'weight_kg': 1339,
                'handling_score': 95,
                'braking_score': 94,
                'price': 6500,
                'is_default': False,
                'default_color': '#06d6a0', # Verde Scandal
                'badge_color': '#f77f00',
                'body_style': 'snorkel_gt',
                'audio_pitch': 1.10,
                'specs': {
                    'torque_nm': 565,
                    'rpm_redline': 8500,
                    'boost_psi': 0.0,
                    'livery': 'sto_shark_fin',
                    'accent_color': '#ff5400'
                }
            },
            {
                'slug': 'mclaren-765lt',
                'name': '765LT Spider',
                'brand': 'McLaren',
                'year': 2023,
                'category': 'Supercar Longtail',
                'engine': '4.0L Twin-Turbo M840T V8',
                'drivetrain': 'Rear-Wheel Drive (RWD)',
                'horsepower': 755,
                'top_speed_mph': 205,
                'accel_0_60': 2.4,
                'weight_kg': 1388,
                'handling_score': 96,
                'braking_score': 96,
                'price': 12000,
                'is_default': False,
                'default_color': '#ff6f00', # Papaya Spark Orange
                'badge_color': '#ffffff',
                'body_style': 'longtail',
                'audio_pitch': 1.02,
                'specs': {
                    'torque_nm': 800,
                    'rpm_redline': 8500,
                    'boost_psi': 26.0,
                    'livery': 'carbon_louvers',
                    'accent_color': '#1a1a1a'
                }
            },
            {
                'slug': 'bugatti-chiron-ss',
                'name': 'Chiron Super Sport',
                'brand': 'Bugatti',
                'year': 2024,
                'category': 'Apex Hypercar',
                'engine': '8.0L Quad-Turbo W16',
                'drivetrain': 'Permanent AWD',
                'horsepower': 1577,
                'top_speed_mph': 273,
                'accel_0_60': 2.2,
                'weight_kg': 1995,
                'handling_score': 89,
                'braking_score': 93,
                'price': 22000,
                'is_default': False,
                'default_color': '#0d1b2a', # Nocturne Blue & Carbon
                'badge_color': '#e63946',
                'body_style': 'longtail_hyper',
                'audio_pitch': 0.88,
                'specs': {
                    'torque_nm': 1600,
                    'rpm_redline': 7100,
                    'boost_psi': 34.0,
                    'livery': 'horseshoe_duotone',
                    'accent_color': '#00b4d8'
                }
            },
            {
                'slug': 'bmw-m5-e39',
                'name': 'M5 (E39)',
                'brand': 'BMW',
                'year': 2002,
                'category': 'High-Rev Executive V8',
                'engine': '4.9L Naturally Aspirated S62 V8',
                'drivetrain': '6-Speed Manual RWD',
                'horsepower': 400,
                'top_speed_mph': 186,
                'accel_0_60': 4.8,
                'weight_kg': 1795,
                'handling_score': 89,
                'braking_score': 88,
                'price': 1500,
                'is_default': False,
                'default_color': '#1d3557', # Le Mans Blue
                'badge_color': '#0099ff',
                'body_style': 'sport_sedan',
                'audio_pitch': 0.94,
                'specs': {
                    'torque_nm': 500,
                    'rpm_redline': 7000,
                    'boost_psi': 0.0,
                    'livery': 'm_parallel_5spoke',
                    'accent_color': '#ffffff'
                }
            },
            {
                'slug': 'nissan-skyline-r34',
                'name': 'Skyline GT-R V-Spec II (R34)',
                'brand': 'Nissan',
                'year': 2002,
                'category': 'JDM Legend',
                'engine': '2.6L Twin-Turbo RB26DETT Inline-6',
                'drivetrain': 'ATTESA E-TS Pro AWD',
                'horsepower': 327,
                'top_speed_mph': 182,
                'accel_0_60': 4.6,
                'weight_kg': 1560,
                'handling_score': 93,
                'braking_score': 91,
                'price': 2800,
                'is_default': False,
                'default_color': '#0077b6', # Iconic Bayside Blue
                'badge_color': '#e60012',
                'body_style': 'gt_wing',
                'audio_pitch': 1.05,
                'specs': {
                    'torque_nm': 392,
                    'rpm_redline': 8000,
                    'boost_psi': 14.5,
                    'livery': 'bayside_blue_jdm',
                    'accent_color': '#ffd600'
                }
            },
            {
                'slug': 'mercedes-190e-evo2',
                'name': '190E 2.5-16 Evolution II',
                'brand': 'Mercedes-Benz',
                'year': 1990,
                'category': 'DTM Homologation Icon',
                'engine': '2.5L 16V Cosworth High-Rev Inline-4',
                'drivetrain': '5-Speed Dogleg Manual RWD',
                'horsepower': 235,
                'top_speed_mph': 155,
                'accel_0_60': 6.8,
                'weight_kg': 1340,
                'handling_score': 94,
                'braking_score': 90,
                'price': 3200,
                'is_default': False,
                'default_color': '#111317', # Blauschwarz Metallic
                'badge_color': '#cccccc',
                'body_style': 'dtm_wing',
                'audio_pitch': 1.08,
                'specs': {
                    'torque_nm': 245,
                    'rpm_redline': 7800,
                    'boost_psi': 0.0,
                    'livery': 'dtm_touring_spec',
                    'accent_color': '#e0e1dd'
                }
            }
        ]

        car_objs = {}
        for cdata in cars_data:
            car, _ = Car.objects.update_or_create(slug=cdata['slug'], defaults=cdata)
            car_objs[car.slug] = car

        self.stdout.write("Seeding tracks...")
        tracks_data = [
            {
                'slug': 'los-santos',
                'name': 'Los Santos: Vinewood & Downtown',
                'country': 'San Andreas, USA (Los Angeles)',
                'difficulty': 'Medium',
                'laps': 3,
                'length_km': 4.20,
                'theme': 'los_santos',
                'surface': 'California Boulevard Asphalt',
                'base_reward': 900,
                'base_xp': 550,
                'record_time': 59.10,
                'record_holder': 'Franklin_C',
                'description': 'Iconic California metropolis featuring the hillside VINEWOOD 3D sign, soaring Maze Bank Tower, Del Perro Beach pier, and sunset palm boulevards.',
                'layout_data': {
                    'circuit_type': 'city_street',
                    'biome': 'los_santos',
                    'default_time': 'sunset',
                    'available_times': ['sunset', 'day', 'night'],
                    'curvature': 0.8,
                    'turns': 11
                }
            },
            {
                'slug': 'vice-city',
                'name': 'Vice City: Ocean Beach & Downtown',
                'country': 'Florida, USA (Miami)',
                'difficulty': 'Medium',
                'laps': 3,
                'length_km': 3.80,
                'theme': 'vice_city',
                'surface': 'Ocean Beachfront Highway',
                'base_reward': 950,
                'base_xp': 600,
                'record_time': 56.40,
                'record_holder': 'Tommy_V',
                'description': 'Retro 80s synthwave paradise with Ocean Drive pastel Art Deco neon hotels, Starfish Island mansions, palm-lined oceanfronts, and luxury yachts.',
                'layout_data': {
                    'circuit_type': 'coastal_waterfront',
                    'biome': 'vice_city',
                    'default_time': 'night',
                    'available_times': ['night', 'sunset', 'day'],
                    'curvature': 0.8,
                    'turns': 11
                }
            },
            {
                'slug': 'liberty-city',
                'name': 'Liberty City: Algonquin & Star Junction',
                'country': 'Liberty State, USA (New York)',
                'difficulty': 'Hard',
                'laps': 3,
                'length_km': 4.50,
                'theme': 'liberty_city',
                'surface': 'Manhattan Avenue Tarmac',
                'base_reward': 1300,
                'base_xp': 800,
                'record_time': 72.80,
                'record_holder': 'Niko_B',
                'description': 'Gritty East Coast metropolis packed with the dazzling neon billboards of Star Junction (Times Square), Rotterdam Tower spire, and historic suspension bridges.',
                'layout_data': {
                    'circuit_type': 'expressway',
                    'biome': 'liberty_city',
                    'default_time': 'night',
                    'available_times': ['night', 'day', 'sunset'],
                    'curvature': 0.7,
                    'turns': 11
                }
            },
            {
                'slug': 'las-venturas',
                'name': 'Las Venturas: The Strip & Casino Corridor',
                'country': 'San Andreas, USA (Las Vegas)',
                'difficulty': 'Hard',
                'laps': 2,
                'length_km': 4.60,
                'theme': 'las_venturas',
                'surface': 'Neon Casino Boulevard',
                'base_reward': 1400,
                'base_xp': 850,
                'record_time': 74.20,
                'record_holder': 'CJ_Johnson',
                'description': 'Blazing desert casino playground centered around The Camelot obsidian pyramid with sky beam, neon marquee arches, and shimmering golden resort towers.',
                'layout_data': {
                    'circuit_type': 'strip_highway',
                    'biome': 'las_venturas',
                    'default_time': 'night',
                    'available_times': ['night', 'sunset', 'day'],
                    'curvature': 0.7,
                    'turns': 11
                }
            },
            {
                'slug': 'blaine-county',
                'name': 'Blaine County: Route 68 & Mount Chiliad',
                'country': 'San Andreas, USA (Countryside)',
                'difficulty': 'Extreme',
                'laps': 2,
                'length_km': 5.20,
                'theme': 'blaine_county',
                'surface': 'Desert Canyon Highway',
                'base_reward': 1600,
                'base_xp': 1000,
                'record_time': 88.50,
                'record_holder': 'Trevor_P',
                'description': 'Vast rural open-world highway crossing Route 68, Mount Chiliad peak, spinning wind turbine farms, roadside gas stops, and red rock buttes.',
                'layout_data': {
                    'circuit_type': 'canyon_highway',
                    'biome': 'blaine_county',
                    'default_time': 'day',
                    'available_times': ['day', 'sunset', 'night'],
                    'curvature': 0.8,
                    'turns': 11
                }
            }
        ]

        for tdata in tracks_data:
            Track.objects.update_or_create(slug=tdata['slug'], defaults=tdata)

        self.stdout.write("Seeding achievements...")
        achievements_data = [
            {'code': 'first_blood', 'title': 'First Podium', 'description': 'Finish your first race in the top 3', 'reward_coins': 300, 'icon': '🏆'},
            {'code': 'speed_demon', 'title': 'Speed Demon', 'description': 'Surpass 200 mph in a single race', 'reward_coins': 500, 'icon': '⚡'},
            {'code': 'champion', 'title': 'Undisputed Champion', 'description': 'Win 5 races in 1st place', 'reward_coins': 1000, 'icon': '👑'},
            {'code': 'collector', 'title': 'Garage Collector', 'description': 'Own 3 or more real-life supercars', 'reward_coins': 1500, 'icon': '🏎️'},
            {'code': 'drift_master', 'title': 'Tokyo Drift Master', 'description': 'Execute a power drift around Alpine or Monaco hairpins', 'reward_coins': 800, 'icon': '🔥'}
        ]

        for adata in achievements_data:
            Achievement.objects.update_or_create(code=adata['code'], defaults=adata)

        # Create or update default guest/starter player profile
        guest_user, created = User.objects.get_or_create(
            username='racer_guest',
            defaults={'email': 'racer@racingzone.io', 'first_name': 'Racer'}
        )
        if created:
            guest_user.set_unusable_password()
            guest_user.save()

        profile, _ = PlayerProfile.objects.get_or_create(
            user=guest_user,
            defaults={
                'nickname': 'ApexRacer',
                'level': 1,
                'xp': 120,
                'coins': 3000,
                'is_guest': True
            }
        )

        # Ensure default car unlocked
        gtr = car_objs.get('nissan-gtr-nismo')
        if gtr:
            PlayerCar.objects.get_or_create(
                player=profile,
                car=gtr,
                defaults={'is_selected': True, 'color': gtr.default_color}
            )

        self.stdout.write(self.style.SUCCESS("Successfully seeded real-life cars, tracks, and achievements!"))
