from django.shortcuts import render
from accounts.views import get_or_create_current_profile
from garage.models import Car
from races.models import Track

def home_view(request):
    profile = get_or_create_current_profile(request)
    cars = Car.objects.all()
    tracks = Track.objects.all()
    return render(request, 'index.html', {
        'profile': profile,
        'cars': cars,
        'tracks': tracks,
    })
