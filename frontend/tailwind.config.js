/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Custom neon green if needed, but standard green-400 is good
            },
            fontFamily: {
                mono: ['Fira Code', 'monospace'],
            }
        },
    },
    plugins: [],
}
