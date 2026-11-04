from django.db import models
from accounts.models import PlayerProfile

class Achievement(models.Model):
    code = models.CharField(max_length=50, unique=True)
    title = models.CharField(max_length=100)
    description = models.CharField(max_length=255)
    reward_coins = models.IntegerField(default=500)
    icon = models.CharField(max_length=50, default="trophy")

    def __str__(self):
        return self.title

class PlayerAchievement(models.Model):
    player = models.ForeignKey(PlayerProfile, on_delete=models.CASCADE, related_name='achievements')
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE)
    unlocked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('player', 'achievement')

    def __str__(self):
        return f"{self.player.user.username} - {self.achievement.title}"
