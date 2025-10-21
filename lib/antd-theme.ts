// @ts-nocheck
import type { ThemeConfig } from 'antd';

// Premium Ant Design theme for executive-level music distribution platform
export const antdTheme: ThemeConfig = {
  token: {
    // Primary colors - FIRE crimson and magenta
    colorPrimary: '#e11d48',
    colorSuccess: '#22c55e',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#06b6d4',
    
    // Background colors - Deep obsidian premium
    colorBgBase: '#0c0a0e',
    colorBgContainer: '#1a1625',
    colorBgElevated: '#1e1a2a',
    colorBgLayout: '#0c0a0e',
    
    // Text colors - Pure and refined
    colorText: '#fafafa',
    colorTextSecondary: '#d4d4d8',
    colorTextTertiary: '#a1a1aa',
    colorTextQuaternary: '#71717a',
    
    // Border colors - Sick crimson borders
    colorBorder: 'rgba(225, 29, 72, 0.25)',
    colorBorderSecondary: 'rgba(225, 29, 72, 0.15)',
    
    // Typography - Premium fonts
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    fontSize: 15,
    fontSizeHeading1: 56,
    fontSizeHeading2: 44,
    fontSizeHeading3: 36,
    fontSizeHeading4: 28,
    fontSizeHeading5: 22,
    
    // Layout - Premium spacing
    borderRadius: 16,
    borderRadiusLG: 20,
    borderRadiusSM: 12,
    borderRadiusXS: 8,
    
    // Spacing - Executive level
    margin: 20,
    marginLG: 32,
    marginSM: 16,
    marginXS: 12,
    
    // SICK shadows and effects
    boxShadow: '0 24px 80px rgba(12, 10, 14, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08)',
    boxShadowSecondary: '0 16px 48px rgba(12, 10, 14, 0.4)',
    boxShadowTertiary: '0 8px 32px rgba(12, 10, 14, 0.3)',
  },
  algorithm: [], // We'll use custom dark colors instead of algorithm
  components: {
    Button: {
      token: {
        borderRadius: 16,
        fontWeight: 600,
        paddingInline: 28,
        paddingBlock: 14,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontFamily: '"Inter", sans-serif',
          boxShadow: 'none',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            boxShadow: '0 12px 40px rgba(99, 102, 241, 0.5)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    Card: {
      token: {
        borderRadius: 20,
      },
      styleOverrides: {
        root: {
          backgroundColor: '#1a1b3a',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          boxShadow: '0 20px 60px rgba(15, 15, 35, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          background: 'linear-gradient(135deg, rgba(26, 27, 58, 0.9) 0%, rgba(30, 31, 62, 0.9) 100%)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 32px 80px rgba(15, 15, 35, 0.6), 0 0 0 1px rgba(99, 102, 241, 0.3)',
            transform: 'translateY(-4px)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
          },
        },
      },
    },
    Input: {
      token: {
        borderRadius: 12,
      },
      styleOverrides: {
        root: {
          backgroundColor: '#2a2a2a',
          borderColor: '#444',
          '&:hover': {
            borderColor: '#1db954',
          },
          '&:focus': {
            borderColor: '#1db954',
            boxShadow: '0 0 0 2px rgba(29, 185, 84, 0.2)',
          },
        },
      },
    },
    Menu: {
      token: {
        itemBg: 'transparent',
        itemSelectedBg: 'rgba(29, 185, 84, 0.1)',
        itemHoverBg: 'rgba(29, 185, 84, 0.05)',
        itemSelectedColor: '#1db954',
      },
    },
    Table: {
      token: {
        headerBg: '#2a2a2a',
        rowHoverBg: 'rgba(29, 185, 84, 0.05)',
      },
    },
    Slider: {
      token: {
        trackBg: '#1db954',
        handleColor: '#1db954',
      },
    },
    Switch: {
      token: {
        colorPrimary: '#1db954',
      },
    },
    Progress: {
      token: {
        colorSuccess: '#1db954',
      },
    },
  },
};
