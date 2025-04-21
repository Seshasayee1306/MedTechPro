import React from 'react';
import { IconButton } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

function RefreshButton({ onClick }) {
  return (
    <IconButton onClick={onClick} color="primary" sx={{ position: 'absolute', top: 16, right: 16 }}>
      <RefreshIcon />
    </IconButton>
  );
}

export default RefreshButton;
