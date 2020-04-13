import React, { useEffect, useState } from 'react';
import { withRouter } from 'react-router-dom';
import axios from 'axios';

import Hr from '../UI/HorizontalLine/HorizontalLine';
import Synopsis from '../UI/Synopsis/Synopsis';
import Stats from '../UI/StatsDisplay/Stats';
import CharactersDisplay from '../UI/CharactersDisplay/Characters';
import EpisodesListing from '../EpisodesListing/EpisodesListing';
import Loading from '../UI/Loading/FullscreenLoad';
import classes from './ShowInfo.module.css';

const ShowInfo = (props) => {
  /* 
    image_url,
    mal_id,
    episodes: amount of episodes,
    score,
    scores: {1: {percentage: int, votes: int}, ...},
    synopsis, 
    title,
    trailer_url,
    airing: bool,
    aired: {string: str with air date info},
    genres: [{name}, ...],
    characters: [{image_url, name, voice_actors: [{ name }]}, ...]
  */
  const [showInfo, setShowInfo] = useState(null);
  const [error, setError] = useState(false);
  const [showEpisodes, setShowEpisodes] = useState(false);

  const title = props.match.params.title;

  useEffect(() => {
    // getEpisodesInfo(title, setApiShowInfo);
    axios
      .get(`http://127.0.0.1:5000/horriblesubs/get-show/${title}`)
      .then((res) => {
        setShowInfo(res.data);
        console.log(res.data);
      })
      .catch((err) => {
        console.log(`Error fetching ${title}'s details: ${err}`);
        setError(true);
      });
  }, [title]);

  return (
    <div>
      <div className={classes.container}>
        {showInfo ? (
          <div>
            <Synopsis
              viewEpisodesAction={setShowEpisodes}
              showInfo={showInfo}
            />
            {!showEpisodes ? (
              <>
                <Hr />
                <Stats showInfo={showInfo} />

                <Hr />
                <CharactersDisplay showInfo={showInfo} />
              </>
            ) : (
              <EpisodesListing showInfo={showInfo} />
            )}
          </div>
        ) : error ? (
          'There was an error, try again'
        ) : (
          <Loading message="Fetching info, please wait" />
        )}
      </div>
    </div>
  );
};

export default withRouter(ShowInfo);