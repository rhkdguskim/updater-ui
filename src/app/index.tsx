/**
 * App Entry Point
 * 
 * Main application component that combines providers and router.
 */

import React from 'react';
import { AppProviders } from './providers';
import AppRouter from './router';
import '@/i18n'; // Initialize i18n

const App: React.FC = () => {
    return (
        <AppProviders>
            <AppRouter />
        </AppProviders>
    );
};

export default App;
