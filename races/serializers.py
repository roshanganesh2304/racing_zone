from rest_framework import serializers
from .models import Track, Race
from garage.serializers import CarSerializer

class TrackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Track
        fields = [
            'id', 'slug', 'name', 'country', 'difficulty', 'laps',
            'length_km', 'theme', 'surface', 'base_reward', 'base_xp',
            'record_time', 'record_holder', 'description', 'layout_data'
        ]

class RaceSerializer(serializers.ModelSerializer):
    track_name = serializers.CharField(source='track.name', read_only=True)
    car_name = serializers.CharField(source='car.name', read_only=True)
    car_brand = serializers.CharField(source='car.brand', read_only=True)
    player_nickname = serializers.CharField(source='player.nickname', read_only=True)

    class Meta:
        model = Race
        fields = [
            'id', 'track_name', 'car_name', 'car_brand', 'player_nickname',
            'mode', 'finish_position', 'race_time', 'best_lap_time',
            'prize_coins', 'xp_earned', 'created_at'
        ]
