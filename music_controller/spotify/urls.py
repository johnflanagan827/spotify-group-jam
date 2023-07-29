from django.urls import path
from .views import AuthURL, spotify_callback, IsAuthenticated, CurrentSong, PauseSong, PlaySong, SkipSong, SearchSong, AddSongToQueue, Queue, SkipToPreviousSong, Seek, PlaySpecificSong

urlpatterns = [
    path('get-auth-url', AuthURL.as_view()),
    path('redirect', spotify_callback),
    path('is-authenticated', IsAuthenticated.as_view()),
    path('current-song', CurrentSong.as_view()),
    path('pause', PauseSong.as_view()),
    path('play', PlaySong.as_view()),
    path('next', SkipSong.as_view()),
    path('search', SearchSong.as_view()),
    path('queue', AddSongToQueue.as_view()),
    path('get-queue', Queue.as_view()),
    path('previous', SkipToPreviousSong.as_view()),
    path('seek', Seek.as_view()),
    path('play-specific-song', PlaySpecificSong.as_view())
]
