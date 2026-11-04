from rest_framework import serializers
from .models import Car, PlayerCar

class CarSerializer(serializers.ModelSerializer):
    is_unlocked = serializers.SerializerMethodField()
    is_selected = serializers.SerializerMethodField()
    custom_color = serializers.SerializerMethodField()
    engine_level = serializers.SerializerMethodField()
    handling_level = serializers.SerializerMethodField()
    nitro_level = serializers.SerializerMethodField()

    class Meta:
        model = Car
        fields = [
            'id', 'slug', 'name', 'brand', 'year', 'category', 'engine',
            'drivetrain', 'horsepower', 'top_speed_mph', 'accel_0_60',
            'weight_kg', 'handling_score', 'braking_score', 'price',
            'is_default', 'default_color', 'badge_color', 'body_style',
            'audio_pitch', 'specs', 'is_unlocked', 'is_selected',
            'custom_color', 'engine_level', 'handling_level', 'nitro_level'
        ]

    def get_user_player_car(self, obj):
        request = self.context.get('request')
        profile = self.context.get('profile')
        if not profile:
            return None
        return obj.playercar_set.filter(player=profile).first()

    def get_is_unlocked(self, obj):
        profile = self.context.get('profile')
        if not profile:
            return obj.is_default
        return PlayerCar.objects.filter(player=profile, car=obj).exists()

    def get_is_selected(self, obj):
        profile = self.context.get('profile')
        if not profile:
            return obj.is_default
        pc = PlayerCar.objects.filter(player=profile, car=obj).first()
        return pc.is_selected if pc else False

    def get_custom_color(self, obj):
        profile = self.context.get('profile')
        if not profile:
            return obj.default_color
        pc = PlayerCar.objects.filter(player=profile, car=obj).first()
        return pc.color if pc else obj.default_color

    def get_engine_level(self, obj):
        profile = self.context.get('profile')
        pc = PlayerCar.objects.filter(player=profile, car=obj).first() if profile else None
        return pc.engine_level if pc else 1

    def get_handling_level(self, obj):
        profile = self.context.get('profile')
        pc = PlayerCar.objects.filter(player=profile, car=obj).first() if profile else None
        return pc.handling_level if pc else 1

    def get_nitro_level(self, obj):
        profile = self.context.get('profile')
        pc = PlayerCar.objects.filter(player=profile, car=obj).first() if profile else None
        return pc.nitro_level if pc else 1
