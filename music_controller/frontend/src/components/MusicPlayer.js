import React, { useState, useEffect } from "react";
import {
  Grid,
  Typography,
  Slider,
  IconButton,
  Button,
  Collapse,
} from "@mui/material";
import { Alert } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import QueueMusicIcon from "@mui/icons-material/QueueMusic";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import QueueSearchModal from "./QueueSearchModal";

function MusicPlayer(props) {
  const {
    image_url,
    title,
    album,
    artist,
    is_playing,
    time,
    duration,
    isHost,
    id,
    uri
  } = props;

  const [songProgress, setSongProgress] = useState((time / duration) * 100);
  const [windowSize, setWindowSize] = useState(window.innerWidth);
  const [queue, setQueue] = useState("");
  const [seeking, setSeeking] = useState(false);
  const [skipPrevious, setSkipPrevious] = useState(false);
  const [currentTime, setCurrentTime] = useState(time);
  const [showModal, setShowModal] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const getTimeFormated = (time) => {
    const totalSeconds = Math.floor(time / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(1, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const pauseSong = () => {
    const requestOptions = {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    };
    fetch("/spotify/pause", requestOptions);
  };

  const playCurrentSong = () => {
    const requestOptions = {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    };
    fetch("/spotify/play", requestOptions);
  };

  const skipSong = () => {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    };
    fetch("/spotify/next", requestOptions);
  };

  const skipToPreviousSong = () => {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    };
    fetch("/spotify/previous", requestOptions);
  };

  const getQueue = () => {
    fetch("/spotify/get-queue")
      .then((response) => response.json())
      .then((data) => setQueue(data));
  };

  const handleClearSearch = () => {
    setShowModal(false);
  };

  const setSeek = (e, v) => {
    setSeeking(true);
    setSongProgress(v);
    setCurrentTime((duration * v) / 100);
  };

  const seek = () => {
    const position_ms = (songProgress * duration) / 100;
    const requestOptions = {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        position_ms: position_ms,
      }),
    };
    fetch("/spotify/seek", requestOptions);
    setTimeout(() => {
      setSeeking(false);
    }, 2000);
  };

  useEffect(() => {
    const handleWindowResize = () => {
      setWindowSize(window.innerWidth);
    };
    window.addEventListener("resize", handleWindowResize);
    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, []);

  useEffect(() => {
    if (!seeking) {
      setSongProgress((time / duration) * 100);
      setCurrentTime(time);
    }
  }, [time]);

  useEffect(() => {
    if (skipPrevious) {
      seek();
      setSkipPrevious(false);
    }
  }, [skipPrevious]);

  useEffect(() => {
    getQueue();
  }, [id]);

  if (showModal) {
    return (
      <QueueSearchModal
        image_url={image_url}
        title={title}
        album={album}
        artist={artist}
        is_playing={is_playing}
        time={time}
        duration={duration}
        isHost={isHost}
        queue={queue}
        windowSize={windowSize}
        handleClearSearch={handleClearSearch}
        handleQueue={getQueue}
      />
    );
  } else {
    return (
      <Grid
        container
        alignItems={"center"}
        align="center"
        sx={{ mt: windowSize > 780 ? 12 : 0, mb: windowSize > 780 ? 6 : 0 }}
      >
        <Grid item xs={windowSize > 780 ? 4 : 12} align="center">
          <img src={image_url} className="disp-img" />
        </Grid>
        <Grid item xs={1} />
        <Grid item xs={windowSize > 780 ? 7 : 10} align="center">
          <Grid item xs={1} />
          <Grid container direction="column" align="center" alignItems="center">
            <Grid item sx={{my: 2}}>
              <Typography component="h5" variant="h5">
                {title}
              </Typography>
              <Typography color="textSecondary" variant="subtitle1">
                {artist}
              </Typography>
            </Grid>
            <Grid item xs={12} align="center">
          <Collapse in={ errMsg != ""}>
              <Alert severity="error">{errMsg}</Alert>
          </Collapse>
        </Grid>
            <Grid item align="center" sx={{mb: -1}}>
              <div>
                <IconButton
                  onClick={() => {
                    if (isHost) {
                      if (songProgress <= 1) {
                        skipToPreviousSong();
                      } else {
                        setSeeking(true);
                        setSongProgress(0);
                        setSkipPrevious(true);
                      }
                    } else {
                      setErrMsg("Must Be Host to Use This Feature!");
                      setTimeout(() => setErrMsg(""), 2000);
                    }
                  }}
                >
                  <SkipPreviousIcon fontSize="large" />
                </IconButton>
                <IconButton
                  onClick={() => {
                    is_playing ? pauseSong() : playCurrentSong();
                  }}
                >
                  {is_playing ? (
                    <PauseIcon fontSize="large" />
                  ) : (
                    <PlayArrowIcon fontSize="large" />
                  )}
                </IconButton>
                <IconButton onClick={() => skipSong()}>
                  <SkipNextIcon fontSize="large" />
                </IconButton>
              </div>
            </Grid>
            <Grid item className="progress">
              <Slider
                disabled={!isHost}
                sx={{"&.Mui-disabled": {
                  color: "#1976d2"
                }
            
                }}
                value={songProgress}
                onChange={setSeek}
                onChangeCommitted={seek}
              />
              <div className="time">
                <Typography variant="body2">
                  {getTimeFormated(currentTime)}
                </Typography>
                <Typography variant="body2">
                  {getTimeFormated(duration)}
                </Typography>
              </div>
            </Grid>
            <Grid item xs={12} align="center" sx={{my: 2}}>
              <Button
                color="primary"
                variant="outlined"
                size="large"
                endIcon={isHost ? <MusicNoteIcon /> : <QueueMusicIcon />}
                onClick={() => {
                  getQueue();
                  {queue ? setShowModal(true) : null}
                }}
              >
                {isHost ? "Select Song" : "View Queue"}
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    );
  }
}

export default MusicPlayer;
