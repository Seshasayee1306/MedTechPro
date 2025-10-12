import React, { useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Grid,
  Paper,
  Divider
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import SensorsIcon from '@mui/icons-material/Sensors';

const Home = () => {
  const [streaming, setStreaming] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const BACKEND_URL = "http://localhost:3001";

  const toggleStream = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/toggle-stream`, {
        method: 'POST'
      });
      const data = await res.json();
      setStreaming(data.streaming);
      setStatusMsg(data.message);
    } catch (err) {
      console.error(err);
      setStatusMsg("❌ Failed to toggle stream.");
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 6 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center', backgroundColor: '#f7f9fc' }}>
        <Typography variant="h3" gutterBottom>
          Medical Device Maintenance Dashboard
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Real-time data streaming, device alerts, and proactive maintenance insights.
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Button
            variant={streaming ? 'contained' : 'outlined'}
            color={streaming ? 'error' : 'primary'}
            onClick={toggleStream}
            startIcon={streaming ? <StopIcon /> : <PlayArrowIcon />}
            size="large"
          >
            {streaming ? 'Stop Data Stream' : 'Start Data Stream'}
          </Button>

          {statusMsg && (
            <Typography sx={{ mt: 2 }} color={streaming ? 'error.main' : 'success.main'}>
              {statusMsg}
            </Typography>
          )}
        </Box>
      </Paper>

      <Divider sx={{ my: 6 }} />

      <Typography variant="h4" align="center" gutterBottom>
        Key Capabilities
      </Typography>

      <Grid container spacing={4} justifyContent="center">
        <Grid item xs={12} sm={4}>
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
            <SensorsIcon fontSize="large" color="primary" />
            <Typography variant="h6" sx={{ mt: 1 }}>
              Fluent ID Data Access
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Stream real-time data from MRI and diagnostic devices.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
            <MedicalServicesIcon fontSize="large" color="success" />
            <Typography variant="h6" sx={{ mt: 1 }}>
              Predictive Maintenance
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Forecast failures using machine learning from S3-stored logs.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
            <HealthAndSafetyIcon fontSize="large" color="error" />
            <Typography variant="h6" sx={{ mt: 1 }}>
              Instant Alerts
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Send email alerts to hospital maintenance team via AWS SES.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Home;
