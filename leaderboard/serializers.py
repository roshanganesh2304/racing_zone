from rest_framework import serializers
from .models import Achievement, PlayerAchievement
from accounts.models import PlayerProfile
from races.models import Race

class AchievementSerializer(serializers.ModelSerializer):
    unlocked = serializers.SerializerMethodField()
    unlocked_at = serializers.SerializerMethodField()

    class Meta:
        model = Achievement
        fields = ['id', 'code', 'title', 'description', 'reward_coins', 'icon', 'unlocked', 'unlocked_at']

    def get_unlocked(self, obj):
        profile = self.context.get('profile')
        if not profile:
            return False
        return PlayerAchievement.objects.filter(player=profile, achievement=obj).exists()

    def get_unlocked_at(self, obj):
        profile = self.context.get('profile')
        if not profile:
            return None
        pa = PlayerAchievement.objects.filter(player=profile, achievement=obj).first()
        return pa.unlocked_at if pa else None

class LeaderboardPlayerSerializer(serializers.ModelSerializer):
    player_name = serializers.CharField(source='nickname')
    username = serializers.CharField(source='user.username')

    class Meta:
        model = PlayerProfile
        fields = [
            'id', 'player_name', 'username', 'level', 'coins',
            'total_races', 'total_wins', 'best_lap_overall'
        ]
