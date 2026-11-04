from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Track, Race
from .serializers import TrackSerializer, RaceSerializer
from garage.models import Car, PlayerCar
from accounts.views import get_or_create_current_profile
from leaderboard.models import Achievement, PlayerAchievement

class TrackListAPIView(APIView):
    def get(self, request):
        tracks = Track.objects.all().order_by('id')
        serializer = TrackSerializer(tracks, many=True)
        return Response(serializer.data)

class RaceSubmitAPIView(APIView):
    def post(self, request):
        profile = get_or_create_current_profile(request)
        track_slug = request.data.get('track_slug')
        car_slug = request.data.get('car_slug')
        finish_position = int(request.data.get('finish_position', 4))
        race_time = float(request.data.get('race_time', 0.0))
        best_lap_time = float(request.data.get('best_lap_time', 0.0))
        top_speed_achieved = float(request.data.get('top_speed', 0.0))

        try:
            track = Track.objects.get(slug=track_slug)
        except Track.DoesNotExist:
            return Response({'error': 'Track not found'}, status=status.HTTP_404_NOT_FOUND)

        car = Car.objects.filter(slug=car_slug).first()

        # Reward multiplier based on position
        multipliers = {1: 1.0, 2: 0.65, 3: 0.45, 4: 0.25}
        mult = multipliers.get(finish_position, 0.2)

        prize_coins = int(track.base_reward * mult)
        xp_earned = int(track.base_xp * mult)

        # Check for new track record
        new_record = False
        if best_lap_time > 10.0: # Sanity filter
            if track.record_time == 0.0 or best_lap_time < track.record_time:
                track.record_time = round(best_lap_time, 2)
                track.record_holder = profile.nickname or profile.user.username
                track.save()
                new_record = True
                prize_coins += 500 # Record bonus!

        # Save race record
        race = Race.objects.create(
            player=profile,
            car=car,
            track=track,
            mode=request.data.get('mode', 'Quick Race'),
            finish_position=finish_position,
            race_time=round(race_time, 2),
            best_lap_time=round(best_lap_time, 2),
            prize_coins=prize_coins,
            xp_earned=xp_earned,
            accepted=True
        )

        # Update profile stats & rewards
        leveled_up = profile.add_rewards(prize_coins, xp_earned, won=(finish_position == 1))
        if best_lap_time > 0 and (profile.best_lap_overall == 0 or best_lap_time < profile.best_lap_overall):
            profile.best_lap_overall = round(best_lap_time, 2)
            profile.save()

        # Check achievements
        new_achievements = []

        # 1. First Podium
        if finish_position <= 3:
            ach = Achievement.objects.filter(code='first_blood').first()
            if ach:
                pa, created = PlayerAchievement.objects.get_or_create(player=profile, achievement=ach)
                if created:
                    profile.coins += ach.reward_coins
                    profile.save()
                    new_achievements.append(ach.title)

        # 2. Speed Demon (> 200 mph)
        if top_speed_achieved >= 200:
            ach = Achievement.objects.filter(code='speed_demon').first()
            if ach:
                pa, created = PlayerAchievement.objects.get_or_create(player=profile, achievement=ach)
                if created:
                    profile.coins += ach.reward_coins
                    profile.save()
                    new_achievements.append(ach.title)

        # 3. Champion (5 wins)
        if profile.total_wins >= 5:
            ach = Achievement.objects.filter(code='champion').first()
            if ach:
                pa, created = PlayerAchievement.objects.get_or_create(player=profile, achievement=ach)
                if created:
                    profile.coins += ach.reward_coins
                    profile.save()
                    new_achievements.append(ach.title)

        # 4. Collector (3+ cars)
        if profile.garage_cars.count() >= 3:
            ach = Achievement.objects.filter(code='collector').first()
            if ach:
                pa, created = PlayerAchievement.objects.get_or_create(player=profile, achievement=ach)
                if created:
                    profile.coins += ach.reward_coins
                    profile.save()
                    new_achievements.append(ach.title)

        return Response({
            'message': 'Race results validated and recorded!',
            'race_id': race.id,
            'finish_position': finish_position,
            'prize_coins': prize_coins,
            'xp_earned': xp_earned,
            'new_record': new_record,
            'leveled_up': leveled_up,
            'new_level': profile.level,
            'current_coins': profile.coins,
            'current_xp': profile.xp,
            'xp_needed': profile.xp_needed_for_next_level(),
            'new_achievements': new_achievements
        })

class RaceHistoryAPIView(APIView):
    def get(self, request):
        profile = get_or_create_current_profile(request)
        races = Race.objects.filter(player=profile)[:20]
        serializer = RaceSerializer(races, many=True)
        return Response(serializer.data)
