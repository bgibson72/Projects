/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                'bradley-red': '#E11837', // RGB 225/24/55
                'bradley-dark-red': '#A50000', // RGB 165/0/0
                'bradley-sky-blue': '#A2BDE0', // RGB 162/189/224
                'bradley-light-gray': '#D2D3D4', // RGB 210/211/212
                'bradley-medium-gray': '#939598', // RGB 147/149/152
                'bradley-dark-gray': '#5A5A5C', // RGB 90/90/92
            },
        },
    },
    plugins: [],
};