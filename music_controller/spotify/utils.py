from .models import SpotifyToken
from django.utils import timezone
from datetime import timedelta
from requests import post, put, get
from dotenv import load_dotenv
import os

BASE_URL = "https://api.spotify.com/v1/"
load_dotenv()

CLIENT_SECRET = os.environ.get("CLIENT_SECRET")
CLIENT_ID = os.environ.get("CLIENT_ID")


def get_user_tokens(session_id):
    user_tokens = SpotifyToken.objects.filter(user=session_id)
    if user_tokens:
        return user_tokens[0]
    else:
        return None

def update_or_create_user_tokens(session_id, access_token, token_type, expires_in, refresh_token):
    
    tokens = get_user_tokens(session_id)
    expires_in = timezone.now() + timedelta(seconds=expires_in)

    if tokens:
        tokens.access_token = access_token
        tokens.token_type = token_type
        tokens.expires_in = expires_in    
        tokens.refresh_token = refresh_token
        tokens.save(update_fields=['access_token', 'refresh_token', 'expires_in', 'token_type'])
    else:
        tokens = SpotifyToken(user=session_id, access_token=access_token, refresh_token=refresh_token, token_type=token_type, expires_in=expires_in)
        tokens.save()

def is_spotify_authenticated(session_id):
    tokens = get_user_tokens(session_id)
    if tokens:
        expiry = tokens.expires_in
        if expiry <= timezone.now():
            refresh_spotify_token(session_id)
        return True
    
    else:
        return False

def refresh_spotify_token(session_id):
    refresh_token = get_user_tokens(session_id).refresh_token

    response = post('https://accounts.spotify.com/api/token', data={
        'grant_type': 'refresh_token', 
        'refresh_token': refresh_token,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET
    }).json()

    access_token = response.get('access_token')
    token_type = response.get('token_type')
    expires_in = response.get('expires_in')

    update_or_create_user_tokens(session_id, access_token, token_type, expires_in, refresh_token)

def execute_spotify_api_request(session_id, endpoint, json={}, post_=False, put_=False):
    tokens = get_user_tokens(session_id)
    headers = {'Content-Type': 'application/json', 'Authorization': "Bearer " + tokens.access_token}

    if post_:
        post(BASE_URL + endpoint, json, headers=headers)
    if put_:
        put(BASE_URL + endpoint, json=json, headers=headers)
    
    response = get(BASE_URL + endpoint, json, headers=headers)
    try:
        return response.json()
    except:
        return {'Error': 'Issue with request'}
    

def play_song(session_id):
    return execute_spotify_api_request(session_id, "me/player/play", put_=True)

def pause_song(session_id):
    return execute_spotify_api_request(session_id, "me/player/pause", put_=True)

def skip_song(session_id):
    return execute_spotify_api_request(session_id, "me/player/next", post_=True)

def search_song(session_id, song_name):
    return execute_spotify_api_request(session_id, "search", {'q': song_name, 'type': 'track', 'limit': 10})

def queue_song(session_id, uri):
    return execute_spotify_api_request(session_id, f"me/player/queue?uri={uri}", post_=True)

def get_queue(session_id):
    return execute_spotify_api_request(session_id, "me/player/queue")

def skip_to_previous_song(session_id):
    return execute_spotify_api_request(session_id, "me/player/previous", post_=True)

def seek(session_id, position_ms):
    return execute_spotify_api_request(session_id, f"me/player/seek?position_ms={position_ms}", put_=True)

def play_specific_song(session_id, uri, position_ms=0):
    return execute_spotify_api_request(session_id, "me/player/play", {'uris': [uri], 'position_ms': position_ms}, put_=True)
