export const SITE = {
  url: (process.env.SITE_URL || process.env.URL || 'https://rewildmushrooms.com').replace(/\/$/, ''),
  name: 'REWILD Mushrooms',
  email: 'rewildmushrooms@protonmail.com',
  instagram: 'https://instagram.com/rewildmushrooms',
  region: 'Slocan Valley, British Columbia, Canada',
  build: Date.now().toString(36),
};
