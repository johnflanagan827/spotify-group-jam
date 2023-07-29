import React, { useState, useEffect } from "react";
import {
  Grid,
  Typography,
  IconButton,
  Card,
  TextField,
  Collapse,
} from "@mui/material";
import { Alert } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import CloseIcon from "@mui/icons-material/Close";
import QueueIcon from "@mui/icons-material/Queue";

function QueueSearchModal(props) {
  const {
    image_url,
    title,
    album,
    artist,
    is_playing,
    duration,
    isHost,
    queue,
    windowSize,
    handleQueue,
    handleClearSearch,
  } = props;

  const [searchQuery, setSearchQuery] = useState("");
  const [search, setSearch] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const getTimeFormated = (time) => {
    const totalSeconds = Math.floor(time / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(1, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const playSpecificSong = (e) => {
    const requestOptions = {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uri: e,
      }),
    };
    fetch("/spotify/play-specific-song", requestOptions);
  };

  const queueSpecificSong = (e) => {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uri: e,
      }),
    };
    fetch("/spotify/queue", requestOptions).then(() => {
      handleQueue();
    });
  };

  const handleSearch = () => {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        search_query: searchQuery,
      }),
    };
    fetch("/spotify/search", requestOptions)
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        setSearch(data);
      });
  };

  const renderSearchResults = () => {
    return search.items.map((e, index) => (
      <Grid container alignItems="center" key={index}>
        <Grid item xs={2} align="start">
          <img src={e.image_url} className="image-search" />
        </Grid>
        <Grid item xs={windowSize > 1000 ? 3 : 5} align="start">
          <Typography variant="body2" className="search-results">
            {e.title}
          </Typography>
          <Typography
            color="textSecondary"
            variant="subtitle1"
            className="search-results"
          >
            {e.artist}
          </Typography>
        </Grid>
        <Grid item xs={1} />
        <Grid item xs={windowSize > 1000 ? 2 : 0} align="start">
          {windowSize > 1000 ? (
            <Typography
              color="textSecondary"
              variant="subtitle1"
              className="search-results"
            >
              {e.album}
            </Typography>
          ) : null}
        </Grid>
        <Grid item xs={1} />
        <Grid item xs={1} align="start">
          <Typography
            color="textSecondary"
            variant="subtitle1"
            className="search-results"
          >
            {getTimeFormated(e.duration)}
          </Typography>
        </Grid>
        <Grid item xs={1}>
          <div style={{ display: "flex" }}>
            <IconButton
              onClick={() => {
                queueSpecificSong(e.uri);
                setSuccessMsg("Successfully Added to Queue!");
                setTimeout(() => setSuccessMsg(""), 2000);
              }}
            >
              <QueueIcon />
            </IconButton>
            <IconButton onClick={() => playSpecificSong(e.uri)}>
              <PlayArrowIcon fontSize="large" />
            </IconButton>
          </div>
        </Grid>
      </Grid>
    ));
  };

  const renderNowPlaying = () => {
    return (
      <Grid container alignItems="center">
        <Grid item xs={1} align="center">
          {is_playing ? (
            <div id="bars">
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
            </div>
          ) : (
            1
          )}
        </Grid>
        <Grid item xs={2} align="start">
          <img src={image_url} className="image-search" />
        </Grid>
        <Grid item xs={3} align="start">
          <Typography variant="body2" className="search-results">
            {title}
          </Typography>
          <Typography
            color="textSecondary"
            variant="subtitle1"
            className="search-results"
          >
            {artist}
          </Typography>
        </Grid>
        <Grid item xs={1} />
        <Grid item xs={3} align="start">
          <Typography
            color="textSecondary"
            variant="subtitle1"
            className="search-results"
          >
            {album}
          </Typography>
        </Grid>
        <Grid item xs={2} align="center">
          <Typography
            color="textSecondary"
            variant="subtitle1"
            className="search-results"
          >
            {getTimeFormated(duration)}
          </Typography>
        </Grid>
      </Grid>
    );
  };

  const renderQueue = () => {
    return queue.queue.map((e, index) => (
      <Grid container alignItems="center" key={index + 100}>
        <Grid item xs={1}>
          <Typography color="textSecondary" variant="subtitle1" align="center">
            {index + 2}
          </Typography>
        </Grid>
        <Grid item xs={2} align="start">
          <img src={e.album.images[0].url} className="image-search" />
        </Grid>
        <Grid item xs={3} align="start">
          <Typography variant="body2" className="search-results">
            {e.name}
          </Typography>
          <Typography
            color="textSecondary"
            variant="subtitle1"
            className="search-results"
          >
            {e.artists[0].name}
          </Typography>
        </Grid>
        <Grid item xs={1} />
        <Grid item xs={3} align="start">
          <Typography
            color="textSecondary"
            variant="subtitle1"
            className="search-results"
          >
            {e.album.name}
          </Typography>
        </Grid>
        <Grid item xs={2} align="center">
          <Typography
            color="textSecondary"
            variant="subtitle1"
            className="search-results"
          >
            {getTimeFormated(e.duration_ms)}
          </Typography>
        </Grid>
      </Grid>
    ));
  };

  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  useEffect(() => {
    if (searchQuery) {
      handleSearch();
    } else {
      setSearch(false);
    }
  }, [searchQuery]);

  return (
    <Grid container alignItems="center">
      <Card
        className="modal"
        sx={{ overflow: "auto", backgroundColor: "#FEFBEA" }}
      >
        <Grid container alignItems="center">
          <Grid item xs={12} align="center">
            <Collapse in={successMsg != ""}>
              <Alert severity="success">{successMsg}</Alert>
            </Collapse>
          </Grid>
          <Grid item xs={11} />
          <Grid item xs={1} align="end">
            <IconButton onClick={handleClearSearch}>
              <CloseIcon />
            </IconButton>
          </Grid>
          <Grid item xs={12} aligin="center"></Grid>
          {isHost ? (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Search"
                id="fullWidth"
                onChange={handleSearchInputChange}
                sx={{ my: 2 }}
              />
            </Grid>
          ) : null}
          {isHost && search && searchQuery !== "" ? null : (
            <Typography variant="h6">Now playing</Typography>
          )}
          {isHost && search && searchQuery !== "" ? (
            <Typography variant="h6">Search results:</Typography>
          ) : (
            renderNowPlaying()
          )}
          {isHost && search && searchQuery !== "" ? null : (
            <Typography variant="h6" sx={{ mt: 2 }}>
              Next up
            </Typography>
          )}
          {isHost && search && searchQuery !== ""
            ? renderSearchResults()
            : renderQueue()}
        </Grid>
      </Card>
    </Grid>
  );
}

export default QueueSearchModal;
