// Runs every night (Netlify scheduled function): rebuilds the REWILD Metrics Google Sheet.
import { updateMetricsSheet } from './_shared/metrics.mjs';

export default async () => {
  const r = await updateMetricsSheet();
  console.log('metrics sheet', JSON.stringify(r));
};

export const config = { schedule: '15 10 * * *' }; // 3:15 am Pacific (daylight time)
