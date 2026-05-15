import * as React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { captureUtmsFromUrl } from './lib/utm'
import { initAnalytics } from './lib/analytics'

captureUtmsFromUrl();
initAnalytics();

const container = document.getElementById("root");
if (!container) throw new Error('Root element not found');

const root = createRoot(container);
root.render(<App />);
