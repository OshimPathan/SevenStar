/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#0a2240',
                    light: '#163a6a',
                    dark: '#06152d',
                    50: '#e8edf4',
                    100: '#c5d0e3',
                    200: '#9eb2d0',
                    300: '#7793bc',
                    400: '#587dae',
                    500: '#3966a0',
                    600: '#2d5282',
                    700: '#1f3d64',
                    800: '#0a2240',
                    900: '#06152d',
                },
                accent: {
                    DEFAULT: '#c5a44e',
                    light: '#d4b96e',
                    dark: '#a88a38',
                    50: '#faf6eb',
                    100: '#f2e9cc',
                    200: '#e5d5a0',
                    300: '#d4b96e',
                    400: '#c5a44e',
                    500: '#b08f33',
                    600: '#a88a38',
                    700: '#8a7028',
                    800: '#6c5720',
                    900: '#4e3f18',
                },
                sidebar: {
                    DEFAULT: '#071428',
                    dark: '#040d1a',
                    light: '#0e2040',
                },
                background: '#fafbfc',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                serif: ['"Playfair Display"', '"Palatino Linotype"', 'Palatino', 'Georgia', 'serif'],
                display: ['"Playfair Display"', 'Georgia', 'serif'],
            },
            boxShadow: {
                'card': '0 1px 3px 0 rgba(10, 34, 64, 0.06), 0 1px 2px -1px rgba(10, 34, 64, 0.06)',
                'card-hover': '0 10px 25px -5px rgba(10, 34, 64, 0.08), 0 8px 10px -6px rgba(10, 34, 64, 0.04)',
                'elevated': '0 20px 40px -8px rgba(10, 34, 64, 0.10), 0 8px 16px -4px rgba(10, 34, 64, 0.06)',
            },
            spacing: {
                '18': '4.5rem',
                '22': '5.5rem',
            },
        },
    },
    plugins: [],
}
