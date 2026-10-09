// Runs once a day (Netlify scheduled function). Sends reorder reminders, win-back emails, review requests
// and refer-a-friend rewards to past buyers.
// See _shared/lifecycle.mjs for who gets what, and when.
import { runLifecycle } from './_shared/lifecycle.mjs';
import { runReviewRequests } from './_shared/reviews.mjs';
import { runReferralRewards } from './_shared/referrals.mjs';
import { sendMail, mailConfigured } from './_shared/mailer.mjs';

export default async () => {
  if (!mailConfigured()) return console.log('customer emails: email not set up');
  const site = (process.env.SITE_URL || process.env.URL || 'https://rewildmushrooms.com').replace(/\/$/, '');
  try { console.log('customer emails', JSON.stringify(await runLifecycle(Date.now(), { send: sendMail, site }))); }
  catch (e) { console.error('customer emails failed', e.message); }
  try { console.log('review requests', JSON.stringify(await runReviewRequests(Date.now(), { send: sendMail, site }))); }
  catch (e) { console.error('review requests failed', e.message); }
  try { console.log('referral rewards', JSON.stringify(await runReferralRewards(Date.now(), { send: sendMail, site }))); }
  catch (e) { console.error('referral rewards failed', e.message); }
};

export const config = { schedule: '0 17 * * *' }; // 10 am Pacific (daylight time)
