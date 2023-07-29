import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Alert, Grid, Button, Typography } from "@mui/material";
import UpdateRoomPage from "./UpdateRoomPage";
import MusicPlayer from "./MusicPlayer";

const Room = () => {
  const { roomCode } = useParams();
  const [guestCanPause, setGuestCanPause] = useState(false);
  const [votesToSkip, setVotesToSkip] = useState(0);
  const [isHost, setIsHost] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [song, setSong] = useState(null);

  const authenticateSpotify = () => {
    fetch("/spotify/is-authenticated")
      .then((response) => response.json())
      .then((data) => {
        if (!data.status) {
          fetch("/spotify/get-auth-url")
            .then((response) => response.json())
            .then((data) => {
              window.location.replace(data.url);
            });
        }
      });
  };

  const getRoomDetails = async () => {
    try {
      const response = await fetch(`/api/get-room?code=${roomCode}`);
      if (!response.ok) {
        leaveButtonPressed();
      } else {
        const data = await response.json();
        setGuestCanPause(data.guest_can_pause);
        setVotesToSkip(data.votes_to_skip);
        setIsHost(data.is_host);
      }
    } catch (error) {
      console.error("Error retrieving room details:", error);
    }
  };

  const getCurrentSong = async () => {
    try {
      const response = await fetch("/spotify/current-song");
      if (response.status === 200) {
        const data = await response.json();
        setSong(data);
      } else {
        authenticateSpotify();
      }
    } catch (error) {
      console.error("Error retrieving current song:", error);
    }
  };

  useEffect(() => {
    getRoomDetails();
    const interval = setInterval(getCurrentSong, 500);
    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    getRoomDetails();
  }, [showSettings]);

  const leaveButtonPressed = async () => {
    try {
      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      };
      await fetch("/api/leave-room", requestOptions);
      window.location.href = "/";
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  };

  const renderSettingsButton = () => {
    return (
      <Grid item xs={12} align="center">
        <Button
          variant="contained"
          color="primary"
          onClick={() => setShowSettings(true)}
        >
          Settings
        </Button>
      </Grid>
    );
  };

  const renderSettings = () => {
    return (
      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <UpdateRoomPage
            votes={votesToSkip}
            canPause={guestCanPause}
            roomCode={roomCode}
          />
        </Grid>
        <Grid item xs={12} align="center">
          <Button
            color="secondary"
            variant="contained"
            onClick={() => setShowSettings(false)}
          >
            Close
          </Button>
        </Grid>
      </Grid>
    );
  };

  if (showSettings) {
    return renderSettings();
  }
  return (
    <Grid container alignItems="center" spacing={1}>
      <Grid item xs={12} align="center">
        <Typography variant="h3" sx={{ fontWeight: 1000 }}>
          Group Jam Session
        </Typography>
        <Typography color="textSecondary" variant="h5">
          Code: {roomCode}
        </Typography>
        <Typography variant="h6">
          Skip Votes: {song ? song.votes : 0}/{votesToSkip}
        </Typography>
      </Grid>
      <Grid item xs={12} align="center">
      {song ? <MusicPlayer {...song} isHost={isHost} /> : <Alert severity="error"><Typography>Must be Playing Song in Spotify!</Typography></Alert>}
      </Grid>
      <Grid item xs={12} align="center">
        {isHost ? renderSettingsButton() : null}
      </Grid>
      <Grid item xs={12} align="center">
        <Button
          color="secondary"
          variant="contained"
          onClick={() => leaveButtonPressed()}
        >
          Leave Room
        </Button>
      </Grid>
    </Grid>
  );
};

export default Room;
