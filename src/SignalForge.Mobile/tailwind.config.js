module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: '#06060B',
        surface: '#0C0F1A',
        'surface-light': '#151929',
        border: '#1A1F35',
        accent: '#00FF94',
        danger: '#FF3B5C',
        warning: '#FFB020',
        info: '#38BDF8',
        purple: '#A78BFA',
        'text-primary': '#F0F4F8',
        'text-muted': '#5B6378',
      },
    },
  },
  plugins: [],
};
