from django.db import models
from django.contrib.auth.models import User
import math

class PlayerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    nickname = models.CharField(max_length=50, blank=True)
    level = models.IntegerField(default=1)
    xp = models.IntegerField(default=0)
    coins = models.IntegerField(default=2500)
    total_races = models.IntegerField(default=0)
    total_wins = models.IntegerField(default=0)
    best_lap_overall = models.FloatField(default=0.0)
    is_guest = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nickname or self.user.username} (Lvl {self.level})"

    def xp_needed_for_next_level(self):
        return self.level * 500

    def add_rewards(self, coins_reward, xp_reward, won=False):
        self.coins += max(0, coins_reward)
        self.xp += max(0, xp_reward)
        self.total_races += 1
        if won:
            self.total_wins += 1

        # Level up check
        leveled_up = False
        needed = self.xp_needed_for_next_level()
        while self.xp >= needed:
            self.xp -= needed
            self.level += 1
            self.coins += self.level * 250  # Level up bonus cash!
            leveled_up = True
            needed = self.xp_needed_for_next_level()

        self.save()
        return leveled_up
