import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Button, Box,
  CircularProgress, Alert, TextField, Grid
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';

const API_URL = 'http://backend:5000';

const machines = [
  { id: 1, name: 'MRI Machine 1' },
  { id: 2, name: 'MRI Machine 2' },
  { id: 3, name: 'MRI Machine 3' },
  { id: 4, name: 'MRI Machine 4' }
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
    <Container maxWidth="md" sx={{ textAlign: 'center', mt: 6 }}>
      <Typography variant="h4" gutterBottom>
        MRI Machine Maintenance Alert System
      </Typography>
      <Typography variant="body1" gutterBottom>
        Set a timer to notify the maintenance team for each MRI machine.
      </Typography>

      <Grid container spacing={4} sx={{ mt: 4 }}>
        {machines.map((machine, index) => (
          <Grid item xs={12} md={6} key={machine.id}>
            <Box sx={{ border: '1px solid #ccc', borderRadius: 2, p: 3 }}>
              <Typography variant="h6">{machine.name}</Typography>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
                <TextField
                  type="number"
                  label="Hours"
                  variant="outlined"
                  size="small"
                  value={hours[index]}
                  onChange={(e) => handleSetTime(index, e.target.value, minutes[index])}
                />
                <TextField
                  type="number"
                  label="Minutes"
                  variant="outlined"
                  size="small"
                  value={minutes[index]}
                  onChange={(e) => handleSetTime(index, hours[index], e.target.value)}
                />
              </Box>

              <Typography variant="body2" sx={{ mt: 2 }}>
                Countdown: {Math.floor(counts[index] / 3600)}h {Math.floor((counts[index] % 3600) / 60)}m {counts[index] % 60}s
              </Typography>

              <Button
                variant="contained"
                color="secondary"
                sx={{ mt: 2 }}
                startIcon={<EmailIcon />}
                onClick={() => sendEmail(index)}
                disabled={loadingIndex === index}
              >
                {loadingIndex === index ? 'Sending...' : 'Send Email Now'}
              </Button>

              {loadingIndex === index && <CircularProgress size={24} sx={{ mt: 2 }} />}

              {statuses[index] && (
                <Alert
                  severity={statuses[index].startsWith('✅') ? 'success' : 'error'}
                  sx={{ mt: 2 }}
                >
                  {statuses[index]}
                </Alert>
              )}
            </Box>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default SendEmail;
