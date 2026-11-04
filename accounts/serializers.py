from rest_framework import serializers
from django.contrib.auth.models import User
from .models import PlayerProfile

class PlayerProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    xp_needed = serializers.SerializerMethodField()

    class Meta:
        model = PlayerProfile
        fields = [
            'id', 'username', 'nickname', 'level', 'xp', 'xp_needed',
            'coins', 'total_races', 'total_wins', 'best_lap_overall',
            'is_guest', 'created_at'
        ]

    def get_xp_needed(self, obj):
        return obj.xp_needed_for_next_level()
