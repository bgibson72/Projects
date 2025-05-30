/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                'bradley-light-red': '#E42F4B',
                'bradley-red': '#CE1432',
                'bradley-med-red': '#A50000',
                'bradley-dark-red': '#870F0F',
                'bradley-light-gray': '#E2E8F0',
                'bradley-medium-gray': '#939598',
                'bradley-dark-gray': '#374151',
                'bradley-sky-blue': '#A2BDE0',
                'bradley-blue': '#2563EB',
                'bradley-accent': '#3B82F6',
                'black': '#000000',
                'bradley-green': '#33CC33',
                'bradley-dark-green': '#339933',
                'bradley-dark-bg': '#101014', // main dark background (almost black)
                'bradley-dark-surface': '#23262F', // card/surface (dark gray)
                'bradley-dark-card': '#181A20', // card background (modern dark gray)
                'bradley-dark-card-text': '#F3F4F6', // card text (soft white)
                'bradley-dark-border': '#23262F', // card border (subtle dark)
                'bradley-dark-input': '#23262F', // input background in dark mode
            },
            boxShadow: {
                'bradley': '0 4px 2px 0 #939598',
                'bradley-active': '0 1px 1px 0 #870F0F',
            },
        },
    },
    plugins: [],
};