from django.db import models
from accounts.models import PlayerProfile

class Car(models.Model):
    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=100)
    brand = models.CharField(max_length=50)
    year = models.IntegerField(default=2023)
    category = models.CharField(max_length=50, default="Supercar")
    engine = models.CharField(max_length=100, default="V8")
    drivetrain = models.CharField(max_length=20, default="AWD")
    horsepower = models.IntegerField(default=600)
    top_speed_mph = models.IntegerField(default=200)
    accel_0_60 = models.FloatField(default=3.0)
    weight_kg = models.IntegerField(default=1450)
    handling_score = models.IntegerField(default=85) # 0-100
    braking_score = models.IntegerField(default=85)  # 0-100
    price = models.IntegerField(default=0)           # 0 if starter car
    is_default = models.BooleanField(default=False)
    default_color = models.CharField(max_length=20, default="#e63946")
    badge_color = models.CharField(max_length=20, default="#ffffff")
    body_style = models.CharField(max_length=50, default="coupe")
    audio_pitch = models.FloatField(default=1.0)
    specs = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['price', 'top_speed_mph']

    def __str__(self):
        return f"{self.brand} {self.name}"

class PlayerCar(models.Model):
    player = models.ForeignKey(PlayerProfile, on_delete=models.CASCADE, related_name='garage_cars')
    car = models.ForeignKey(Car, on_delete=models.CASCADE)
    color = models.CharField(max_length=20, default="#e63946")
    wheel_color = models.CharField(max_length=20, default="#1a1a1a")
    neon_glow = models.CharField(max_length=20, default="#00e5ff", blank=True)
    engine_level = models.IntegerField(default=1)   # upgrade stage 1-5
    handling_level = models.IntegerField(default=1) # upgrade stage 1-5
    nitro_level = models.IntegerField(default=1)    # upgrade stage 1-5
    is_selected = models.BooleanField(default=False)
    unlocked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('player', 'car')

    def __str__(self):
        return f"{self.player.user.username}'s {self.car.name}"
