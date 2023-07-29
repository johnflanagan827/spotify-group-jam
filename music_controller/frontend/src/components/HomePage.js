import React from "react";
import { Link } from "react-router-dom";
import { Grid, Button, ButtonGroup, Typography } from "@mui/material";

const HomePage = () => {
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

  authenticateSpotify();

  return (
    <Grid container spacing={10}>
      <Grid item xs={12} align="center">
        <Typography variant="h3" sx={{ fontWeight: 1000 }}>
          Group Jam Session
        </Typography>
        <Typography color="textSecondary" variant="h5">
          Listen to Spotify together
        </Typography>
      </Grid>
      <Grid item xs={12} align="center">
        <img src="../static/images/assets/group-jam.png" className="hero" />
      </Grid>
      <Grid item xs={12} align="center">
        <ButtonGroup
          size="large"
          disableElevation
          variant="contained"
          color="primary"
        >
          <Button color="primary" to="/join" component={Link}>
            Join a Room
          </Button> 
          <Button color="secondary" to="/create" component={Link}>
            Create a Room
          </Button>
        </ButtonGroup>
      </Grid>
    </Grid>
  );
};

export default HomePage;
