import React, { useState } from 'react';
import {
  Box,
  Button,
  LinearProgress,
  ListItem,
  ListItemText,
} from '@mui/material';
import axiosService from '../services/axiosService';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { PlaceLocation, Cluster } from '../interfaces/interfaces';

interface AnalyzeComponentProps {
  placeLocations: PlaceLocation[];
  preference: number;
  clusters: Cluster[];
  setClusters: React.Dispatch<React.SetStateAction<Cluster[]>>;
  showAlert: (
    severity: 'success' | 'info' | 'warning' | 'error',
    message: string
  ) => void;
}

const AnalyzeComponent: React.FC<AnalyzeComponentProps> = ({
  placeLocations,
  preference,
  clusters,
  setClusters,
  showAlert,
}) => {
  const [toggleAnalyzeProgressBar, setToggleAnalyzeProgressBar] =
    useState(false);

  const handleAnalyze = async () => {
    try {
      setToggleAnalyzeProgressBar(true);
      const clusterResults = await axiosService.analyzePlaces(
        placeLocations,
        preference
      );
      //console.log('Clusters: ', clusterResults);
      setClusters(clusterResults);
      setToggleAnalyzeProgressBar(false);
    } catch (error) {
      showAlert('error', 'Analyze failed.');
      setToggleAnalyzeProgressBar(false);
    }
  };

  const clusterList = (props: ListChildComponentProps) => {
    const { index, style } = props;

    return (
      <ListItem style={style} key={index} component='div' disablePadding>
        <ListItemText
          key={`Clusters - ${index}`}
          primary={`Central Zone ${index + 1}`}
          secondary={`Radius (mi.): ${(
            clusters[index].radius / 1609.34
          ).toPrecision(3)}, WCSS Score: ${clusters[index].wcss.toPrecision(
            3
          )}`}
        />
      </ListItem>
    );
  };

  return (
    <Box display='flex' flexDirection='column' gap={1}>
      {Object.entries(clusters).length > 0 && (
          <span style={{ fontWeight: 'bold' }}>Analysis Results:</span>
        ) && (
          <FixedSizeList
            height={150}
            width={'100%'}
            itemSize={46}
            itemCount={clusters.length}
            overscanCount={5}
            style={{ border: '1px solid grey', borderRadius: '5px' }}
          >
            {clusterList}
          </FixedSizeList>
        )}
      {toggleAnalyzeProgressBar && <LinearProgress color='warning' />}
      <Button variant='contained' color='warning' onClick={handleAnalyze}>
        Analyze
      </Button>
    </Box>
  );
};

export default AnalyzeComponent;
