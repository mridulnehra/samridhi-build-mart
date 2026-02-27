// Theme configuration for Smridhi BuildMart
// Earth & Construction color palette

export const theme = {
    colors: {
        primary: {
            main: '#CD5C5C',      // Brick Red/Terracotta
            light: '#E07C7C',
            dark: '#A0522D',
        },
        secondary: {
            main: '#D4B896',      // Sand Beige
            light: '#E5D4BE',
            dark: '#B89B6A',
        },
        accent: {
            main: '#2E5933',      // Dark Green
            light: '#3D7544',
            dark: '#1E3B22',
        },
        background: {
            main: '#FAF6F1',      // Warm Off-White
            surface: '#FFFFFF',
            hover: '#F5EFE8',
        },
        text: {
            primary: '#2D2D2D',
            secondary: '#666666',
            muted: '#999999',
        },
        status: {
            success: '#4CAF50',
            warning: '#FFA726',
            error: '#EF5350',
            info: '#2196F3',
        }
    },
    borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
    },
    shadows: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px rgba(0, 0, 0, 0.07)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    },
    spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
    }
};

export type Theme = typeof theme;
