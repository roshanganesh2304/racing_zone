from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Car, PlayerCar
from .serializers import CarSerializer
from accounts.views import get_or_create_current_profile

class CarListAPIView(APIView):
    def get(self, request):
        profile = get_or_create_current_profile(request)
        cars = Car.objects.all()
        serializer = CarSerializer(cars, many=True, context={'request': request, 'profile': profile})
        return Response(serializer.data)

class CarBuyAPIView(APIView):
    def post(self, request):
        profile = get_or_create_current_profile(request)
        car_slug = request.data.get('slug')
        try:
            car = Car.objects.get(slug=car_slug)
        except Car.DoesNotExist:
            return Response({'error': 'Car not found'}, status=status.HTTP_404_NOT_FOUND)

        if PlayerCar.objects.filter(player=profile, car=car).exists():
            return Response({'message': 'Car already unlocked', 'already_owned': True})

        if profile.coins < car.price:
            return Response({
                'error': f'Insufficient credits. Need {car.price - profile.coins} more coins!'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Deduct coins & unlock
        profile.coins -= car.price
        profile.save()

        # Unselect other cars
        PlayerCar.objects.filter(player=profile).update(is_selected=False)

        pc = PlayerCar.objects.create(
            player=profile,
            car=car,
            color=car.default_color,
            is_selected=True
        )

        return Response({
            'message': f'Successfully acquired {car.brand} {car.name}!',
            'coins_remaining': profile.coins,
            'car_slug': car.slug
        })

class CarSelectAPIView(APIView):
    def post(self, request):
        profile = get_or_create_current_profile(request)
        car_slug = request.data.get('slug')
        try:
            car = Car.objects.get(slug=car_slug)
            pc = PlayerCar.objects.get(player=profile, car=car)
        except (Car.DoesNotExist, PlayerCar.DoesNotExist):
            return Response({'error': 'Car is locked or does not exist'}, status=status.HTTP_400_BAD_REQUEST)

        PlayerCar.objects.filter(player=profile).update(is_selected=False)
        pc.is_selected = True
        pc.save()

        return Response({
            'message': f'Active car set to {car.brand} {car.name}',
            'selected_slug': car.slug
        })

class CarPaintAPIView(APIView):
    def post(self, request):
        profile = get_or_create_current_profile(request)
        car_slug = request.data.get('slug')
        color = request.data.get('color', '#ffffff').strip()

        try:
            car = Car.objects.get(slug=car_slug)
            pc = PlayerCar.objects.get(player=profile, car=car)
        except (Car.DoesNotExist, PlayerCar.DoesNotExist):
            return Response({'error': 'Car not found in your garage'}, status=status.HTTP_400_BAD_REQUEST)

        # Formula 1 race cars use official authentic liveries and cannot be repainted
        is_f1 = (car.category == 'Formula 1' or 
                 car.slug.startswith('f1-') or 
                 car.slug == 'mclaren-mp45' or 
                 (car.body_style and car.body_style.startswith('formula1')))
        if is_f1:
            return Response({'error': 'Formula 1 vehicles use official racing liveries and cannot be repainted.'}, status=status.HTTP_400_BAD_REQUEST)

        pc.color = color
        pc.save()

        return Response({
            'message': 'Custom paint applied!',
            'color': pc.color
        })

class CarUpgradeAPIView(APIView):
    def post(self, request):
        profile = get_or_create_current_profile(request)
        car_slug = request.data.get('slug')
        upgrade_type = request.data.get('type') # 'engine', 'handling', 'nitro'

        try:
            car = Car.objects.get(slug=car_slug)
            pc = PlayerCar.objects.get(player=profile, car=car)
        except (Car.DoesNotExist, PlayerCar.DoesNotExist):
            return Response({'error': 'Car not found in garage'}, status=status.HTTP_400_BAD_REQUEST)

        cost = 1000
        if profile.coins < cost:
            return Response({'error': f'Upgrade costs {cost} coins. Insufficient funds.'}, status=status.HTTP_400_BAD_REQUEST)

        if upgrade_type == 'engine' and pc.engine_level < 5:
            pc.engine_level += 1
        elif upgrade_type == 'handling' and pc.handling_level < 5:
            pc.handling_level += 1
        elif upgrade_type == 'nitro' and pc.nitro_level < 5:
            pc.nitro_level += 1
        else:
            return Response({'error': 'Maximum upgrade stage reached'}, status=status.HTTP_400_BAD_REQUEST)

        profile.coins -= cost
        profile.save()
        pc.save()

        return Response({
            'message': f'{upgrade_type.title()} upgraded to Stage {getattr(pc, f"{upgrade_type}_level")}!',
            'coins': profile.coins,
            'engine_level': pc.engine_level,
            'handling_level': pc.handling_level,
            'nitro_level': pc.nitro_level
        })
