import { useState } from 'react';
import { Box, LinearProgress, Button } from '@mui/material';
//import { Delete } from '@mui/icons-material';
//import axiosService from '../services/axiosService';

const AnalyzeComponent = () => {
  const [toggleProgessBar, setToggleProgressBar] = useState(false);

  const handleAnalyze = async () => {
    setToggleProgressBar(true);
    await new Promise((f) => setTimeout(f, 3000)); // Fake 3s call
    // TODO Implement axios call to analyze data.
    setToggleProgressBar(false);
  };

  return (
    <Box display='flex' flexDirection='column' gap={2}>
      {toggleProgessBar && <LinearProgress color='warning' />}
      <Button variant='contained' color='warning' onClick={handleAnalyze}>
        Analyze
      </Button>
    </Box>
  );
};

export default AnalyzeComponent;
