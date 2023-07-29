from django.shortcuts import redirect
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from requests import Request, post
from .utils import (
    update_or_create_user_tokens,
    is_spotify_authenticated,
    execute_spotify_api_request,
    pause_song,
    play_song,
    skip_song,
    search_song,
    queue_song,
    get_queue,
    skip_to_previous_song,
    seek,
    play_specific_song,
)
from api.models import Room
from .models import Votes
from dotenv import load_dotenv
import os

load_dotenv()

CLIENT_SECRET = os.environ.get("CLIENT_SECRET")
CLIENT_ID = os.environ.get("CLIENT_ID")
REDIRECT_URI = os.environ.get("REDIRECT_URI")

class AddSongToQueue(APIView):
    def post(self, request, format=None):
        room_code = self.request.session.get('room_code')
        room = Room.objects.filter(code=room_code)[0]
        uri = request.data.get('uri')
        queue_song(room.host, uri)
        return Response({}, status=status.HTTP_204_NO_CONTENT)

class AuthURL(APIView):
    def get(self, request, format=None):
        scope = 'user-read-playback-state user-modify-playback-state user-read-currently-playing'

        url = Request('GET', 'https://accounts.spotify.com/authorize', params={
            'scope': scope,
            'response_type': 'code',
            'redirect_uri': REDIRECT_URI,
            'client_id': CLIENT_ID
        }).prepare().url

        return Response({'url': url}, status=status.HTTP_200_OK)

def spotify_callback(request, format=None):
    code = request.GET.get('code')

    response = post('https://accounts.spotify.com/api/token', data={
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': REDIRECT_URI,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET
    }).json()

    access_token = response.get('access_token')
    token_type = response.get('token_type')
    refresh_token = response.get('refresh_token')
    expires_in = response.get('expires_in')

    if not request.session.exists(request.session.session_key):
        request.session.create()
    
    update_or_create_user_tokens(request.session.session_key, access_token, token_type, expires_in, refresh_token)

    return redirect('frontend:')

class IsAuthenticated(APIView):
    def get(self, request, format=None): 
        is_authenticated = is_spotify_authenticated(self.request.session.session_key)
        return Response({'status': is_authenticated}, status=status.HTTP_200_OK)
    
class CurrentSong(APIView):
    def get(self, request, format=None):
        room_code = self.request.session.get('room_code')
        room = Room.objects.filter(code=room_code).first()

        if not room:
            return Response({}, status=status.HTTP_404_NOT_FOUND)

        endpoint = 'me/player/currently-playing'
        response = execute_spotify_api_request(room.host, endpoint)

        if 'error' in response or 'item' not in response:
            return Response({}, status=status.HTTP_204_NO_CONTENT)
                
        if (not response.get('is_playing')):
            users = room.users.split(',')
            for user in users:
                if user != room.host:
                    pause_song(user)

        item = response.get('item')
        album = item.get('album').get('name')
        title = item.get('name')
        duration = item.get('duration_ms')
        progress = response.get('progress_ms')
        album_cover = item.get('album').get('images')[0].get('url')
        is_playing = response.get('is_playing')
        uri = item.get('uri')
        artists = item.get('artists')
        votes_required = room.votes_to_skip

        artist_string = ', '.join(artist.get('name') for artist in artists)

        votes = Votes.objects.filter(room=room, uri=uri).count()

        song = {
            'title': title,
            'album': album,
            'artist': artist_string,
            'duration': duration,
            'time': progress,
            'image_url': album_cover,
            'is_playing': is_playing,
            'votes': votes,
            'votes_required': votes_required,
            'uri': uri
        }

        self.update_room_song(room, uri)
        room.current_time = progress
        room.save(update_fields=['current_time'])
        if room.host != self.request.session.session_key:
            self.update_user_song(uri, progress, endpoint)

        return Response(song, status=status.HTTP_200_OK)

    def update_room_song(self, room, uri):
        current_song = room.current_song

        if current_song != uri:
            room.current_song = uri
            room.save(update_fields=['current_song'])
            Votes.objects.filter(room=room).delete()

    def update_user_song(self, uri, progress, endpoint):
        response = execute_spotify_api_request(self.request.session.session_key, endpoint)
        item = response.get('item')
        current_uri = item.get('uri')
        current_progress = response.get('progress_ms')

        if uri != current_uri or abs(progress - current_progress) > 2000:
            play_specific_song(self.request.session.session_key, uri, progress+750)

class PauseSong(APIView):
    def put(self, response, format=None):
        room_code = self.request.session.get('room_code')
        room = Room.objects.filter(code=room_code)[0]
        if self.request.session.session_key == room.host or room.guest_can_pause:
            pause_song(room.host)
            return Response({}, status=status.HTTP_204_NO_CONTENT)
        
        else:
            return Response({}, status=status.HTTP_403_FORBIDDEN)
        
class PlaySong(APIView):
    def put(self, request, format=None):
        room_code = self.request.session.get('room_code')
        room = Room.objects.filter(code=room_code)[0]
        if self.request.session.session_key == room.host or room.guest_can_pause:
            play_song(room.host)
            return Response({}, status=status.HTTP_204_NO_CONTENT)
        else:
            return Response({}, status=status.HTTP_403_FORBIDDEN)

    
class PlaySpecificSong(APIView):
    def put(self, request, format=None):
        room_code = self.request.session.get('room_code')
        room = Room.objects.filter(code=room_code)[0]
        uri = request.data.get('uri')
        position_ms = request.data.get('position_ms')
        play_specific_song(self.request.session.session_key, uri, position_ms)
        return Response({}, status=status.HTTP_204_NO_CONTENT)

class Queue(APIView):
    def get(self, repsonse, format=None):
        room_code = self.request.session.get('room_code')
        room = Room.objects.filter(code=room_code)[0]
        response = get_queue(room.host)
        return Response(response, status=status.HTTP_200_OK)

class SearchSong(APIView):
    def post(self, request, format=None):
        room_code = self.request.session.get('room_code')
        room = Room.objects.filter(code=room_code)[0]
        search_query = request.data.get('search_query')
        results = search_song(room.host, search_query)

        songs  = {'items': []}
        for track in results['tracks']['items']:
            title = track.get('name')
            album = track.get('album').get('name')
            duration = track.get('duration_ms')
            album_cover = track.get('album').get('images')[0].get('url')
            artists = track.get('artists')
            uri = track.get('uri')
            artist_string = ''

            for i, artist in enumerate(artists):
                if i > 0:
                    artist_string += ', '
                name = artist.get('name')
                artist_string += name

            songs['items'].append({
                'title': title,
                'artist': artist_string,
                'album' : album,
                'duration': duration,
                'image_url': album_cover,
                'uri': uri
            })
        return Response(songs, status=status.HTTP_200_OK)

class Seek(APIView):
    def put(self, request, format=None):
        room_code = self.request.session.get('room_code')
        room = Room.objects.filter(code=room_code)[0]
        if self.request.session.session_key == room.host:
            position_ms = int(request.data.get('position_ms'))
            users = room.users.split(',')
            for user in users:
                seek(user, position_ms)
            return Response({'position_ms': position_ms}, status=status.HTTP_204_NO_CONTENT)
        else: 
            return Response({}, status=status.HTTP_401_UNAUTHORIZED)

class SkipSong(APIView):
    def post(self, request, format=None):
        room_code = self.request.session.get('room_code')
        room = Room.objects.filter(code=room_code)[0]
        votes = Votes.objects.filter(room=room, uri=room.current_song)
        votes_needed = room.votes_to_skip

        if self.request.session.session_key == room.host:
            votes.delete()
            skip_song(room.host)
        else:
            try:
                vote = Votes(user=self.request.session.session_key, room=room, uri=room.current_song)
                vote.save()
                votes = Votes.objects.filter(room=room, uri=room.current_song)
                if len(votes) >= votes_needed:
                    vote.delete()
                    skip_song(room.host)
            except:
                vote = Votes.objects.filter(user=self.request.session.session_key, room=room, uri=room.current_song)
                vote.delete()

        return Response({}, status.HTTP_204_NO_CONTENT)

class SkipToPreviousSong(APIView):
    def post(self, request, format=None):
        room_code = self.request.session.get('room_code')
        room = Room.objects.filter(code=room_code)[0]
        if self.request.session.session_key == room.host:
            skip_to_previous_song(room.host)
            return Response({}, status=status.HTTP_204_NO_CONTENT)
        else: 
            return Response({}, status=status.HTTP_401_UNAUTHORIZED)
