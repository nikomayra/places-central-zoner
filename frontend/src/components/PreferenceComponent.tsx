import React from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

interface PreferenceToggleProps {
  preference: number;
  setPreference: React.Dispatch<React.SetStateAction<number>>;
}

const PreferenceComponent: React.FC<PreferenceToggleProps> = ({
  preference,
  setPreference,
}) => {
  const handlePreference = (
    _event: React.MouseEvent<HTMLElement>,
    newPreference: number | null
  ) => {
    if (newPreference !== null) {
      setPreference(newPreference);
    }
  };

  return (
    <>
      <h4 style={{ margin: '0', textAlign: 'center' }}>Quality Preference</h4>
      <p
        style={{
          margin: '0',
          textAlign: 'center',
          fontStyle: 'italic',
          fontSize: 'small',
        }}
      >
        More quality = less quantity and visa-versa
      </p>
      <ToggleButtonGroup
        value={preference}
        exclusive
        onChange={handlePreference}
        aria-label='user preference'
        color='warning'
        size='small'
        sx={{ justifyContent: 'center' }}
        fullWidth={true}
      >
        <ToggleButton value={-2} aria-label='-2'>
          <h3 style={{ margin: '0' }}>--</h3>
        </ToggleButton>
        <ToggleButton value={-1} aria-label='-1'>
          <h3 style={{ margin: '0' }}>-</h3>
        </ToggleButton>
        <ToggleButton value={0} aria-label='0'>
          <h3 style={{ margin: '0' }}>o</h3>
        </ToggleButton>
        <ToggleButton value={1} aria-label='1'>
          <h3 style={{ margin: '0' }}>+</h3>
        </ToggleButton>
        <ToggleButton value={2} aria-label='2'>
          <h3 style={{ margin: '0' }}>++</h3>
        </ToggleButton>
      </ToggleButtonGroup>
    </>
  );
};

export default PreferenceComponent;
