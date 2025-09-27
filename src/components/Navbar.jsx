// src/components/Navbar.jsx
import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/' },
    { label: 'Inventory', path: '/s3' },
    { label: 'Search Records', path: '/athena' },
    { label: 'Alerts', path: '/send-email' },
    { label: 'Real-Time Graphs', path: '/visualization' } // ✅ New Nav Item
  ];

  return (
    <AppBar position="sticky" color="primary" elevation={4}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center">
          <MedicalServicesIcon sx={{ mr: 1 }} fontSize="large" />
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', letterSpacing: 1 }}>
            MedTechPro
          </Typography>
        </Box>

        <Box>
          {navItems.map((item) => (
            <Button
              key={item.path}
              component={Link}
              to={item.path}
              color="inherit"
              sx={{
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                borderBottom: location.pathname === item.path ? '2px solid white' : 'none',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                },
                mx: 1
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
