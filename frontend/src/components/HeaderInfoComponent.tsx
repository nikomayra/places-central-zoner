import React from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from '@mui/material';
import { ArrowDropDown } from '@mui/icons-material';

const HeaderInfoComponent: React.FC = () => {
  return (
    <>
      <div>
        <h2 style={{ margin: '5px' }}>Places Central-Zoner</h2>
        <p style={{ fontStyle: 'italic', margin: '10px' }}>
          By <a href='https://nikomayra.github.io/'>@nikomayra</a>
        </p>
      </div>
      <Accordion>
        <AccordionSummary
          expandIcon={<ArrowDropDown />}
          aria-controls='panel1-content'
          id='panel1-header'
        >
          <Typography>More Info</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            This app helps find geographical areas which are minimally near at
            least 1 of each searched place. When I was living out of my car the
            original need was to find ideal areas to situate myself such that I
            had access to a multitude of places. An example was where to locate
            myself such that I was close to an LA Fitness, Chipotle & Starbucks.
            <br />
            <br />
            The basics: I used a React.ts frontend with a Flask.py backend as
            well as Google's Maps Javascript & Places (NEW) APIs. In the backend
            I use a mixture of 3 different techniques (Brute force combinations,
            DBScan & KMeans with iterative refinement) for clustering and return
            the best results evaluated by a combination of metrics partially
            influenced by the user.
            <br />
            <br />
            1. Enter search center and adjust radius (miles).
            <br />
            2. Enter between 2 and 5 different locations.
            <br />
            3. Press "Search" to mark them in the search area.
            <br />
            4. Adjust quality as needed & press "Analyze" to find central-zoned
            locations.
          </Typography>
        </AccordionDetails>
      </Accordion>
    </>
  );
};

export default HeaderInfoComponent;
