// archivo: tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Tailwind buscará clases en todos estos archivos
  ],
  darkMode: 'class', // Habilita el modo oscuro
  theme: {
    extend: {
      colors: {
        'light-bg': '#f9fafb',
        'light-container': '#ffffff',
        'dark-bg': '#1e1e2e',
        'dark-container': '#2a2a3e',
        'primary': {
          DEFAULT: '#7c3aed', // Tu morado principal
          light: '#a78bfa',   // Tu acento vibrante para modo oscuro
        },
      },
      fontFamily: {
        'sans': ['Inter', 'sans-serif'], // Tipografía para el cuerpo
        'display': ['Space Grotesk', 'sans-serif'], // Tipografía para encabezados
      },
    },
  },
  plugins: [],
}