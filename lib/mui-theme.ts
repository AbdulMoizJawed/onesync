'use client';

import { createTheme } from '@mui/material/styles';

// Premium MUI theme for executive-level music distribution platform
export const muiTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#e11d48', // FIRE crimson - bold and executive
      light: '#f43f5e',
      dark: '#be123c',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#d946ef', // Sick magenta - premium and modern  
      light: '#e879f9',
      dark: '#c026d3',
      contrastText: '#ffffff',
    },
    background: {
      default: '#0c0a0e', // Deep obsidian - ultra premium
      paper: '#1a1625', // Rich dark purple elevated surfaces
    },
    text: {
      primary: '#fafafa', // Pure white text
      secondary: '#d4d4d8', // Refined zinc secondary
    },
    success: {
      main: '#22c55e', // Clean emerald green
      light: '#4ade80',
      dark: '#16a34a',
    },
    warning: {
      main: '#f59e0b', // Premium amber
      light: '#fbbf24',
      dark: '#d97706',
    },
    error: {
      main: '#ef4444', // Bold red
      light: '#f87171',
      dark: '#dc2626',
    },
    info: {
      main: '#06b6d4', // Sick cyan
      light: '#22d3ee',
      dark: '#0891b2',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif', // Inter for body
    h1: {
      fontFamily: '"Montserrat", sans-serif', // Montserrat for headings
      fontSize: '3.5rem',
      fontWeight: 700,
      lineHeight: 1.1,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: '"Montserrat", sans-serif',
      fontSize: '2.75rem',
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontFamily: '"Montserrat", sans-serif',
      fontSize: '2.25rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontFamily: '"Montserrat", sans-serif',
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontFamily: '"Montserrat", sans-serif',
      fontSize: '1.375rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontFamily: '"Montserrat", sans-serif',
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '1rem',
      lineHeight: 1.6,
      fontWeight: 400,
    },
    body2: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '0.875rem',
      lineHeight: 1.5,
      fontWeight: 400,
    },
    subtitle1: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '1.125rem',
      fontWeight: 500,
      lineHeight: 1.6,
    },
    subtitle2: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 16, // More premium rounded corners
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 16,
          fontFamily: '"Inter", sans-serif',
          fontWeight: 600,
          padding: '14px 28px',
          fontSize: '0.95rem',
          boxShadow: 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 12px 40px rgba(99, 102, 241, 0.4)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #e11d48 0%, #d946ef 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(225, 29, 72, 0.4)',
          '&:hover': {
            background: 'linear-gradient(135deg, #be123c 0%, #c026d3 100%)',
            boxShadow: '0 16px 48px rgba(225, 29, 72, 0.6)',
            transform: 'translateY(-3px)',
          },
          '&:active': {
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          border: '2px solid rgba(225, 29, 72, 0.4)',
          background: 'rgba(225, 29, 72, 0.08)',
          backdropFilter: 'blur(20px)',
          '&:hover': {
            border: '2px solid rgba(225, 29, 72, 0.7)',
            background: 'rgba(225, 29, 72, 0.15)',
            boxShadow: '0 12px 40px rgba(225, 29, 72, 0.4)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1a1625',
          border: '1px solid rgba(225, 29, 72, 0.25)',
          borderRadius: 24,
          boxShadow: '0 24px 80px rgba(12, 10, 14, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(24px)',
          background: 'linear-gradient(135deg, rgba(26, 22, 37, 0.95) 0%, rgba(30, 25, 42, 0.95) 100%)',
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 40px 120px rgba(12, 10, 14, 0.8), 0 0 0 1px rgba(225, 29, 72, 0.4)',
            transform: 'translateY(-6px)',
            border: '1px solid rgba(225, 29, 72, 0.5)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 16,
            backgroundColor: 'rgba(26, 27, 58, 0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            '& fieldset': {
              border: 'none',
            },
            '&:hover': {
              backgroundColor: 'rgba(26, 27, 58, 0.8)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
            },
            '&.Mui-focused': {
              backgroundColor: 'rgba(26, 27, 58, 0.9)',
              border: '1px solid rgba(99, 102, 241, 0.6)',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#cbd5e1',
            fontFamily: '"Inter", sans-serif',
          },
          '& .MuiInputBase-input': {
            color: '#f8fafc',
            fontFamily: '"Inter", sans-serif',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          fontWeight: 500,
          fontFamily: '"Inter", sans-serif',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          backdropFilter: 'blur(10px)',
          '&:hover': {
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.5)',
          },
        },
      },
    },
  },
});
