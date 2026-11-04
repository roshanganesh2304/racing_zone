from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static

from config.views import home_view
from accounts.views import ProfileAPIView, RegisterAPIView, LoginAPIView, LogoutAPIView
from garage.views import (
    CarListAPIView, CarBuyAPIView, CarSelectAPIView,
    CarPaintAPIView, CarUpgradeAPIView
)
from races.views import TrackListAPIView, RaceSubmitAPIView, RaceHistoryAPIView
from leaderboard.views import LeaderboardAPIView, RewardsAPIView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', home_view, name='home'),

    # Auth & Profile
    path('api/auth/register/', RegisterAPIView.as_view(), name='api-register'),
    path('api/auth/login/', LoginAPIView.as_view(), name='api-login'),
    path('api/auth/logout/', LogoutAPIView.as_view(), name='api-logout'),
    path('api/profile/', ProfileAPIView.as_view(), name='api-profile'),

    # Garage & Cars
    path('api/cars/', CarListAPIView.as_view(), name='api-cars'),
    path('api/garage/buy/', CarBuyAPIView.as_view(), name='api-garage-buy'),
    path('api/garage/select/', CarSelectAPIView.as_view(), name='api-garage-select'),
    path('api/garage/paint/', CarPaintAPIView.as_view(), name='api-garage-paint'),
    path('api/garage/upgrade/', CarUpgradeAPIView.as_view(), name='api-garage-upgrade'),

    # Races & Tracks
    path('api/tracks/', TrackListAPIView.as_view(), name='api-tracks'),
    path('api/races/', RaceSubmitAPIView.as_view(), name='api-races-submit'),
    path('api/races/history/', RaceHistoryAPIView.as_view(), name='api-races-history'),

    # Leaderboard & Rewards
    path('api/leaderboard/', LeaderboardAPIView.as_view(), name='api-leaderboard'),
    path('api/rewards/', RewardsAPIView.as_view(), name='api-rewards'),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
