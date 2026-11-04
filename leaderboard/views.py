from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Achievement, PlayerAchievement
from .serializers import AchievementSerializer, LeaderboardPlayerSerializer
from accounts.models import PlayerProfile
from accounts.views import get_or_create_current_profile
from races.models import Track, Race

class LeaderboardAPIView(APIView):
    def get(self, request):
        category = request.GET.get('category', 'wins') # 'wins', 'level', 'track'
        track_slug = request.GET.get('track')

        if category == 'track' and track_slug:
            # Fastest race times on this track
            races = Race.objects.filter(
                track__slug=track_slug,
                accepted=True,
                best_lap_time__gt=5.0
            ).order_by('best_lap_time')[:15]

            data = []
            for idx, r in enumerate(races, start=1):
                data.append({
                    'rank': idx,
                    'player_name': r.player.nickname or r.player.user.username,
                    'car_name': f"{r.car.brand} {r.car.name}" if r.car else "Supercar",
                    'best_lap': r.best_lap_time,
                    'race_time': r.race_time,
                    'date': r.created_at.strftime('%Y-%m-%d')
                })
            return Response({'category': 'track', 'track': track_slug, 'rankings': data})

        elif category == 'level':
            profiles = PlayerProfile.objects.order_by('-level', '-xp')[:15]
        else: # 'wins'
            profiles = PlayerProfile.objects.order_by('-total_wins', '-total_races')[:15]

        serializer = LeaderboardPlayerSerializer(profiles, many=True)
        return Response({'category': category, 'rankings': serializer.data})

class RewardsAPIView(APIView):
    def get(self, request):
        profile = get_or_create_current_profile(request)
        achievements = Achievement.objects.all()
        serializer = AchievementSerializer(achievements, many=True, context={'profile': profile})
        return Response(serializer.data)
