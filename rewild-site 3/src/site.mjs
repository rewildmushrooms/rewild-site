export const SITE = {
  url: (process.env.SITE_URL || process.env.URL || 'https://rewildmushrooms.com').replace(/\/$/, ''),
  name: 'REWILD Mushrooms',
  email: 'rewildmushrooms@protonmail.com',
  instagram: 'https://instagram.com/rewildmushrooms',
  region: 'Slocan Valley, British Columbia, Canada',
  build: Date.now().toString(36),
  // Google Analytics 4 Measurement ID (G-...). Set GA_MEASUREMENT_ID in Netlify; empty = no tracking.
  ga: /^G-[A-Z0-9]{4,15}$/.test(process.env.GA_MEASUREMENT_ID || '') ? process.env.GA_MEASUREMENT_ID : '',
};
