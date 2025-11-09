export const theme = {
  colors: {
    firefly: '#FABA29',
    fireflyLight: '#FFD666',
    fireflyDark: '#E5A820',
    ocean: '#46B19D',
    oceanLight: '#6FDBCF',
    oceanDark: '#3A9B8A',
    forest: '#1D3234',
    forestLight: '#2A4A4D',
    white: '#FFFFFF',
    lightBg: '#F5F5F5',
  },

  gradients: {
    firefly: 'linear-gradient(135deg, #FABA29 0%, #FFD666 100%)',
    ocean: 'linear-gradient(135deg, #46B19D 0%, #6FDBCF 100%)',
    night: 'linear-gradient(180deg, #1D3234 0%, #2A4A4D 100%)',
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },

  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    full: '9999px',
  },

  shadows: {
    firefly: '0 0 20px rgba(250, 186, 41, 0.6)',
    ocean: '0 4px 20px rgba(70, 177, 157, 0.3)',
    card: '0 8px 30px rgba(29, 50, 52, 0.1)',
    glow: '0 0 30px rgba(250, 186, 41, 1)',
  },

  fontSize: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '18px',
    xl: '24px',
    xxl: '32px',
    huge: '48px',
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

export type Theme = typeof theme;
