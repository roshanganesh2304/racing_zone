from django.db import models
from accounts.models import PlayerProfile
from garage.models import Car

class Track(models.Model):
    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=100)
    country = models.CharField(max_length=60)
    difficulty = models.CharField(max_length=20, default="Medium")
    laps = models.IntegerField(default=3)
    length_km = models.FloatField(default=3.5)
    theme = models.CharField(max_length=50, default="neon_city")
    surface = models.CharField(max_length=50, default="Asphalt")
    base_reward = models.IntegerField(default=600)
    base_xp = models.IntegerField(default=300)
    record_time = models.FloatField(default=0.0)
    record_holder = models.CharField(max_length=60, default="Ghost Rider")
    description = models.TextField(blank=True)
    layout_data = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"{self.name} ({self.country})"

class Race(models.Model):
    player = models.ForeignKey(PlayerProfile, on_delete=models.CASCADE, related_name='races')
    car = models.ForeignKey(Car, on_delete=models.SET_NULL, null=True)
    track = models.ForeignKey(Track, on_delete=models.CASCADE, related_name='races')
    mode = models.CharField(max_length=30, default="Quick Race")
    finish_position = models.IntegerField(default=1)
    race_time = models.FloatField(default=0.0)
    best_lap_time = models.FloatField(default=0.0)
    prize_coins = models.IntegerField(default=0)
    xp_earned = models.IntegerField(default=0)
    accepted = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Race #{self.id} - {self.player.user.username} P{self.finish_position} ({self.track.name})"
