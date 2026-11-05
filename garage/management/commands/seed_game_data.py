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
                'slug': 'f1-2022-ferrari',
                'name': 'F1-75 Scuderia (2022)',
                'brand': 'Ferrari',
                'year': 2022,
                'category': 'Formula 1',
                'engine': '1.6L Turbo Hybrid V6 (15,000 RPM)',
                'drivetrain': 'RWD (8-Speed Seamless)',
                'horsepower': 1020,
                'top_speed_mph': 225,
                'accel_0_60': 1.8,
                'weight_kg': 798,
                'handling_score': 99,
                'braking_score': 100,
                'price': 0, # Default Starter Car!
                'is_default': True,
                'default_color': '#c00000', # Scuderia Rosso Corsa
                'badge_color': '#ffdf00',
                'body_style': 'formula1',
                'audio_pitch': 1.35,
                'specs': {
                    'torque_nm': 850,
                    'rpm_redline': 15000,
                    'boost_psi': 38.0,
                    'livery': 'ferrari_f1_75',
                    'accent_color': '#111111'
                }
            },
            {
                'slug': 'f1-2022-redbull',
                'name': 'RB18 Oracle (2022)',
                'brand': 'Red Bull Racing',
                'year': 2022,
                'category': 'Formula 1',
                'engine': '1.6L Red Bull Powertrains V6 Turbo',
                'drivetrain': 'RWD',
                'horsepower': 1025,
                'top_speed_mph': 226,
                'accel_0_60': 1.8,
                'weight_kg': 798,
                'handling_score': 100,
                'braking_score': 99,
                'price': 15000,
                'is_default': False,
                'default_color': '#0c1635', # Matte Navy Blue
                'badge_color': '#ffd600',
                'body_style': 'formula1',
                'audio_pitch': 1.38,
                'specs': {
                    'torque_nm': 860,
                    'rpm_redline': 15000,
                    'boost_psi': 38.5,
                    'livery': 'redbull_rb18',
                    'accent_color': '#e60012'
                }
            },
            {
                'slug': 'f1-2022-mercedes',
                'name': 'W13 E Performance (2022)',
                'brand': 'Mercedes-AMG F1',
                'year': 2022,
                'category': 'Formula 1',
                'engine': '1.6L Mercedes-AMG M13 E V6 Turbo',
                'drivetrain': 'RWD',
                'horsepower': 1015,
                'top_speed_mph': 224,
                'accel_0_60': 1.9,
                'weight_kg': 798,
                'handling_score': 98,
                'braking_score': 99,
                'price': 14000,
                'is_default': False,
                'default_color': '#c4c9cc', # Silver Arrows
                'badge_color': '#00a19c', # Petronas Teal
                'body_style': 'formula1',
                'audio_pitch': 1.34,
                'specs': {
                    'torque_nm': 840,
                    'rpm_redline': 15000,
                    'boost_psi': 37.5,
                    'livery': 'mercedes_w13',
                    'accent_color': '#00a19c'
                }
            },
            {
                'slug': 'mclaren-mp45',
                'name': 'MP4/5 Honda V10 (1989)',
                'brand': 'McLaren',
                'year': 1989,
                'category': 'Formula 1',
                'engine': '3.5L Honda RA109E Naturally Aspirated V10',
                'drivetrain': '6-Speed Manual RWD',
                'horsepower': 685,
                'top_speed_mph': 215,
                'accel_0_60': 2.3,
                'weight_kg': 540,
                'handling_score': 97,
                'braking_score': 95,
                'price': 18000,
                'is_default': False,
                'default_color': '#ffffff',
                'badge_color': '#ff0033',
                'body_style': 'formula1_classic',
                'audio_pitch': 1.45,
                'specs': {
                    'torque_nm': 490,
                    'rpm_redline': 14000,
                    'boost_psi': 0.0,
                    'livery': 'senna_mp45',
                    'accent_color': '#ff1100'
                }
            },
            {
                'slug': 'f1-2025-concept',
                'name': 'Active Aero Concept (2025)',
                'brand': 'Formula 1',
                'year': 2025,
                'category': 'Formula 1',
                'engine': '1.6L Biofuel Hybrid + 350kW MGU-K',
                'drivetrain': 'RWD Direct Drive Hybrid',
                'horsepower': 1050,
                'top_speed_mph': 230,
                'accel_0_60': 1.7,
                'weight_kg': 768,
                'handling_score': 100,
                'braking_score': 100,
                'price': 25000,
                'is_default': False,
                'default_color': '#11141c',
                'badge_color': '#ff0055',
                'body_style': 'formula1_future',
                'audio_pitch': 1.40,
                'specs': {
                    'torque_nm': 920,
                    'rpm_redline': 15000,
                    'boost_psi': 40.0,
                    'livery': 'f1_2025_active_aero',
                    'accent_color': '#00f0ff'
                }
            },
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
                'price': 1200,
                'is_default': False,
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
                'default_color': '#00334e', # Tanzanite Blue Metallic (Authentic FBX)
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
                'default_color': '#ffffff', # Carrera RS 2.7 Tribute Pure White & Python Green
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
                'default_color': '#d40000', # Rosso Corsa
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
                'default_color': '#1c7ed6', # Blu Laufey & Arancio Xanto
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
                'default_color': '#ff7300', # Papaya Spark Orange
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
                'default_color': '#0a0c10', # Nocturne Carbon Black & World Record Orange
                'badge_color': '#e63946',
                'body_style': 'longtail_hyper',
                'audio_pitch': 0.88,
                'specs': {
                    'torque_nm': 1600,
                    'rpm_redline': 7100,
                    'boost_psi': 34.0,
                    'livery': 'horseshoe_duotone',
                    'accent_color': '#ff6200'
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
                'default_color': '#253562', # Le Mans Blue Metallic (Authentic MTL)
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
                'default_color': '#1b3f8b', # Iconic Bayside Blue (Authentic GLB)
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
                'default_color': '#1a1c20', # Blauschwarz Metallic (Authentic GLB)
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
            # Update starter/unpainted user cars to their authentic factory color
            PlayerCar.objects.filter(car=car, color__in=[
                '#1f4068', '#00bcd4', '#e60026', '#06d6a0', '#ff6f00', '#0d1b2a',
                '#1d3557', '#0077b6', '#111317', '#c00000', '#0c1635'
            ]).update(color=car.default_color)

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
                    'vehicle_restriction': 'supercars_only',
                    'default_time': 'day',
                    'available_times': ['day', 'sunset', 'night'],
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
                    'vehicle_restriction': 'supercars_only',
                    'default_time': 'sunset',
                    'available_times': ['sunset', 'night', 'day'],
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
                    'vehicle_restriction': 'supercars_only',
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
                    'vehicle_restriction': 'supercars_only',
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
                    'vehicle_restriction': 'supercars_only',
                    'default_time': 'day',
                    'available_times': ['day', 'sunset', 'night'],
                    'curvature': 0.8,
                    'turns': 11
                }
            },
            {
                'slug': 'monza-f1',
                'name': 'Monza: Temple of Speed',
                'country': 'Lombardy, Italy (Autodromo Nazionale Monza)',
                'difficulty': 'Extreme',
                'laps': 3,
                'length_km': 5.79,
                'theme': 'monza_f1',
                'surface': 'FIA Grade 1 Super-Smooth Tarmac',
                'base_reward': 2500,
                'base_xp': 1200,
                'record_time': 78.90,
                'record_holder': 'Charles_L',
                'description': 'The legendary Temple of Speed featuring the flat-out Rettifilo straight, Variante del Rettifilo chicane, Curva Grande, Roggia, Lesmo 1 & 2, Serraglio straight, Variante Ascari, and the high-speed Curva Parabolica.',
                'layout_data': {
                    'circuit_type': 'f1_grand_prix',
                    'biome': 'monza_f1',
                    'default_time': 'day',
                    'available_times': ['day', 'sunset', 'night'],
                    'curvature': 0.9,
                    'turns': 11,
                    'drs_zones': 2,
                    'is_f1_track': True,
                    'vehicle_restriction': 'f1_only'
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
            {'code': 'drift_master', 'title': 'Tokyo Drift Master', 'description': 'Execute a power drift around Alpine or Monaco hairpins', 'reward_coins': 800, 'icon': '🔥'},
            {'code': 'f1_legend', 'title': 'Grand Prix Winner', 'description': 'Take victory at Monza in an authentic Formula 1 car', 'reward_coins': 2000, 'icon': '🏁'}
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

        # Ensure default Ferrari F1-75 is unlocked and selected for starter player
        ferrari_f1 = car_objs.get('f1-2022-ferrari')
        if ferrari_f1:
            # Deselect any other cars
            PlayerCar.objects.filter(player=profile).update(is_selected=False)
            p_car, _ = PlayerCar.objects.get_or_create(
                player=profile,
                car=ferrari_f1,
                defaults={'is_selected': True, 'color': ferrari_f1.default_color}
            )
            p_car.is_selected = True
            p_car.save()

        self.stdout.write(self.style.SUCCESS("Successfully seeded real-life cars, tracks, and achievements!"))
