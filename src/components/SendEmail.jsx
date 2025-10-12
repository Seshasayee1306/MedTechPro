import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Button, Box,
  CircularProgress, Alert, TextField, Grid, Card, CardContent,
  Chip, Divider
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import TimerIcon from '@mui/icons-material/Timer';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';

const API_URL = 'http://localhost:3001';

const machines = [
  { id: 1, name: 'MRI Machine 1', color: '#6366f1' },
  { id: 2, name: 'MRI Machine 2', color: '#8b5cf6' },
  { id: 3, name: 'MRI Machine 3', color: '#ec4899' },
  { id: 4, name: 'MRI Machine 4', color: '#06b6d4' }
];

function SendEmail() {
  const [hours, setHours] = useState(Array(4).fill(0));
  const [minutes, setMinutes] = useState(Array(4).fill(0));
  const [counts, setCounts] = useState(Array(4).fill(0));
  const [loadingIndex, setLoadingIndex] = useState(null);
  const [statuses, setStatuses] = useState(Array(4).fill(''));

  useEffect(() => {
    const interval = setInterval(() => {
      setCounts(prevCounts =>
        prevCounts.map((count) => (count > 0 ? count - 1 : 0))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    counts.forEach((count, index) => {
      if (count === 0 && (hours[index] > 0 || minutes[index] > 0)) {
        sendEmail(index);

        const updatedHours = [...hours];
        const updatedMinutes = [...minutes];
        updatedHours[index] = 0;
        updatedMinutes[index] = 0;
        setHours(updatedHours);
        setMinutes(updatedMinutes);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counts]);

  const handleSetTime = (index, h, m) => {
    const hrs = parseInt(h, 10) || 0;
    const mins = parseInt(m, 10) || 0;

    const updatedHours = [...hours];
    const updatedMinutes = [...minutes];
    updatedHours[index] = hrs;
    updatedMinutes[index] = mins;

    setHours(updatedHours);
    setMinutes(updatedMinutes);

    const totalSeconds = hrs * 3600 + mins * 60;
    const updatedCounts = [...counts];
    updatedCounts[index] = totalSeconds;
    setCounts(updatedCounts);
  };

  const sendEmail = async (index) => {
    setLoadingIndex(index);
    try {
      const response = await fetch(`${API_URL}/api/send-maintenance-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: 'sb7762@srmist.edu.in',
          machine: machines[index].name
        })
      });
      const result = await response.json();
      const newStatuses = [...statuses];
      newStatuses[index] = result.success
        ? `✅ Email sent for ${machines[index].name}!`
        : `❌ Failed to send for ${machines[index].name}`;
      setStatuses(newStatuses);
    } catch (err) {
      console.error(err);
      const newStatuses = [...statuses];
      newStatuses[index] = `❌ Error occurred for ${machines[index].name}`;
      setStatuses(newStatuses);
    } finally {
      setLoadingIndex(null);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      py: 6
    }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 2 }}>
            <MedicalServicesIcon sx={{ fontSize: 48, color: 'white' }} />
          </Box>
          <Typography variant="h3" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
            MRI Maintenance Alert System
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)' }}>
            Set automated timers to notify the maintenance team
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {machines.map((machine, index) => (
            <Grid item xs={12} md={6} key={machine.id}>
              <Card 
                sx={{ 
                  borderRadius: 3,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 48px rgba(0,0,0,0.15)'
                  }
                }}
              >
                <Box 
                  sx={{ 
                    background: `linear-gradient(135deg, ${machine.color} 0%, ${machine.color}dd 100%)`,
                    p: 2.5
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
                      {machine.name}
                    </Typography>
                    <Chip 
                      icon={<TimerIcon sx={{ color: 'white !important' }} />}
                      label={counts[index] > 0 ? 'Active' : 'Idle'}
                      sx={{ 
                        backgroundColor: counts[index] > 0 ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)',
                        color: 'white',
                        fontWeight: 600
                      }}
                    />
                  </Box>
                </Box>

                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary', fontWeight: 600 }}>
                    SET TIMER
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <TextField
                      type="number"
                      label="Hours"
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={hours[index]}
                      onChange={(e) => handleSetTime(index, e.target.value, minutes[index])}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                    />
                    <TextField
                      type="number"
                      label="Minutes"
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={minutes[index]}
                      onChange={(e) => handleSetTime(index, hours[index], e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ 
                    backgroundColor: counts[index] > 0 ? 'rgba(99, 102, 241, 0.08)' : 'rgba(0,0,0,0.03)',
                    borderRadius: 2,
                    p: 2,
                    textAlign: 'center',
                    mb: 2
                  }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>
                      COUNTDOWN
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: counts[index] > 0 ? machine.color : 'text.secondary', fontFamily: 'monospace' }}>
                      {String(Math.floor(counts[index] / 3600)).padStart(2, '0')}:
                      {String(Math.floor((counts[index] % 3600) / 60)).padStart(2, '0')}:
                      {String(counts[index] % 60).padStart(2, '0')}
                    </Typography>
                  </Box>

                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    startIcon={loadingIndex === index ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <EmailIcon />}
                    onClick={() => sendEmail(index)}
                    disabled={loadingIndex === index}
                    sx={{ 
                      borderRadius: 2,
                      py: 1.5,
                      backgroundColor: machine.color,
                      fontWeight: 600,
                      textTransform: 'none',
                      fontSize: '1rem',
                      boxShadow: `0 4px 14px ${machine.color}40`,
                      '&:hover': {
                        backgroundColor: machine.color,
                        filter: 'brightness(1.1)',
                        boxShadow: `0 6px 20px ${machine.color}60`
                      },
                      '&:disabled': {
                        backgroundColor: machine.color,
                        opacity: 0.7,
                        color: 'white'
                      }
                    }}
                  >
                    {loadingIndex === index ? 'Sending Email...' : 'Send Email Now'}
                  </Button>

                  {statuses[index] && (
                    <Alert
                      severity={statuses[index].startsWith('✅') ? 'success' : 'error'}
                      sx={{ 
                        mt: 2,
                        borderRadius: 2,
                        fontWeight: 500
                      }}
                    >
                      {statuses[index]}
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

export default SendEmail;