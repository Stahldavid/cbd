// theme.js - Definições de tema e estilos globais

import { createGlobalStyle } from 'styled-components';

// --- Theme Definition ---
export const theme = {
  colors: {
    primary: '#2563eb',      // Modern Blue
    secondary: '#60a5fa',    // Light Blue
    background: '#121826',    // Dark Background (adequado para chat médico)
    text: '#f9fafb',          // Text Light para dark mode
    lightText: '#f9fafb',     // Light Text
    border: '#2d3748',        // Dark Borders
    messageBg: '#1e293b',     // Message Background (dark)
    aiMessageBg: '#1e293b',   // AI Message Background
    userMessageBg: '#1e40af', // User Message Background (blue)
    errorBg: '#7f1d1d',       // Error Background (dark red)
    errorText: '#fee2e2',     // Error Text
    // Function Call Colors
    functionCallBg: '#312e81',    // Dark Indigo background
    functionCallBorder: '#4338ca',
    functionCallText: '#e0e7ff',   // Light Indigo text
    functionCallHeading: '#c7d2fe',// Light Indigo
    functionCallCodeBg: '#1e293b',
    functionCallCodeBorder: '#3730a3',
    functionCallCodeText: '#e2e8f0', // Light text for code
    // Function Result Colors
    functionResultBg: '#064e3b', // Dark Green background
    functionResultBorder: '#059669',
    functionResultText: '#d1fae5', // Light Green text
    functionResultHeading: '#a7f3d0',// Light Green heading
    functionResultCodeBg: '#1e293b',
    functionResultCodeBorder: '#065f46',
    functionResultCodeText: '#e2e8f0', // Light text for code
    // Prescription Colors
    prescriptionBorder: '#475569', // Darker border
    prescriptionLabel: '#94a3b8',  // Gray label text
    // Modal Colors
    modalOverlay: 'rgba(0, 0, 0, 0.7)',
    modalBackground: '#1e293b',
    modalShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    // Button Colors
    success: '#059669',
    successHover: '#047857',
  },
  shadows: { main: '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px -1px rgba(0, 0, 0, 0.3)' },
  fonts: { main: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
  breakpoints: { mobile: '640px' }
};

// --- Global Styles ---
export const GlobalStyle = createGlobalStyle`
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: ${props => props.theme.fonts.main}; }
  body { background-color: ${props => props.theme.colors.background}; color: ${props => props.theme.colors.text}; display: flex; flex-direction: column; min-height: 100vh; font-size: 16px; line-height: 1.5; }
`;

export default theme;