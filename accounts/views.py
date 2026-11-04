from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from .models import PlayerProfile
from .serializers import PlayerProfileSerializer
from garage.models import Car, PlayerCar
import uuid

def get_or_create_current_profile(request):
    if request.user.is_authenticated:
        profile, _ = PlayerProfile.objects.get_or_create(
            user=request.user,
            defaults={'nickname': request.user.first_name or request.user.username}
        )
        return profile
    
    # Check session for guest user ID
    guest_user_id = request.session.get('guest_user_id')
    if guest_user_id:
        try:
            user = User.objects.get(id=guest_user_id)
            profile, _ = PlayerProfile.objects.get_or_create(user=user)
            return profile
        except User.DoesNotExist:
            pass

    # Create new guest user
    unique_id = uuid.uuid4().hex[:6]
    username = f"racer_{unique_id}"
    guest_user = User.objects.create(
        username=username,
        first_name=f"Racer #{unique_id.upper()}"
    )
    guest_user.set_unusable_password()
    guest_user.save()
    request.session['guest_user_id'] = guest_user.id
    profile = PlayerProfile.objects.create(
        user=guest_user,
        nickname=guest_user.first_name,
        coins=2500,
        is_guest=True
    )
    # Unlock default car
    default_car = Car.objects.filter(is_default=True).first() or Car.objects.first()
    if default_car:
        PlayerCar.objects.create(
            player=profile,
            car=default_car,
            color=default_car.default_color,
            is_selected=True
        )
    return profile

class ProfileAPIView(APIView):
    def get(self, request):
        profile = get_or_create_current_profile(request)
        serializer = PlayerProfileSerializer(profile)
        return Response(serializer.data)

class RegisterAPIView(APIView):
    def post(self, request):
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '').strip()
        nickname = request.data.get('nickname', '').strip() or username

        if not username or not password:
            return Response({'error': 'Username and password are required'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username is already taken'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if user had a guest session with coins/cars to migrate!
        guest_user_id = request.session.get('guest_user_id')
        guest_profile = None
        if guest_user_id:
            try:
                guser = User.objects.get(id=guest_user_id)
                guest_profile = PlayerProfile.objects.filter(user=guser).first()
            except User.DoesNotExist:
                pass

        user = User.objects.create_user(username=username, password=password, first_name=nickname)
        login(request, user)

        if guest_profile:
            # Transfer progress
            profile = PlayerProfile.objects.create(
                user=user,
                nickname=nickname,
                level=guest_profile.level,
                xp=guest_profile.xp,
                coins=guest_profile.coins,
                total_races=guest_profile.total_races,
                total_wins=guest_profile.total_wins,
                best_lap_overall=guest_profile.best_lap_overall,
                is_guest=False
            )
            # Transfer garage cars
            for pc in guest_profile.garage_cars.all():
                PlayerCar.objects.get_or_create(
                    player=profile,
                    car=pc.car,
                    defaults={
                        'color': pc.color,
                        'is_selected': pc.is_selected,
                        'engine_level': pc.engine_level,
                        'handling_level': pc.handling_level,
                        'nitro_level': pc.nitro_level
                    }
                )
        else:
            profile = PlayerProfile.objects.create(
                user=user,
                nickname=nickname,
                coins=3000,
                is_guest=False
            )
            default_car = Car.objects.filter(is_default=True).first() or Car.objects.first()
            if default_car:
                PlayerCar.objects.create(
                    player=profile,
                    car=default_car,
                    color=default_car.default_color,
                    is_selected=True
                )

        if 'guest_user_id' in request.session:
            del request.session['guest_user_id']

        serializer = PlayerProfileSerializer(profile)
        return Response({'message': 'Registration successful', 'profile': serializer.data})

class LoginAPIView(APIView):
    def post(self, request):
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '').strip()

        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response({'error': 'Invalid username or password'}, status=status.HTTP_400_BAD_REQUEST)

        login(request, user)
        profile, _ = PlayerProfile.objects.get_or_create(user=user)
        serializer = PlayerProfileSerializer(profile)
        return Response({'message': 'Logged in successfully', 'profile': serializer.data})

class LogoutAPIView(APIView):
    def post(self, request):
        logout(request)
        return Response({'message': 'Logged out successfully'})
