// /rewild/ : landing page for the 30-second rewilding videos (Nov 2026). ONE job: get the email.
// Direct-response layout: offer + form above the fold, bullets, bonuses, reason why, second form, P.S.
// Minimal header (logo + Explore Mushrooms), no popup, no sale banner. Signups join the ONE welcome
// series (source "rewild", first-touch UTMs saved on the subscriber). After signup the 5 habits show
// right on the page, so people get what they asked for instantly.
import { CONSENT_LINE } from './layout.mjs';

const HABITS = [
  ['Light', 'Take your first drink of the day outside. Ten minutes, face the sky, phone in your pocket. Our inner clocks still run on the sun, and indoor light is nowhere near as bright as an overcast morning.'],
  ['Movement', 'Take one phone call a day walking. Tonight, sit on the floor instead of the couch. You were built to walk, carry, squat and get up off the ground, all day long.'],
  ['Earth', 'Five minutes barefoot on grass, sand or moss this week. Your feet have 26 bones and more than 100 muscles, tendons and ligaments. Let them feel something other than a cushioned sole.'],
  ['Nourishment', 'Buy one thing this week from the person who grew it. Food that still looks like where it came from.'],
  ['Fungi', 'On your next walk, look for mushrooms: on fallen logs, on birch, at the base of trees. The forest runs on fungi, and people have foraged, cooked and brewed with them for thousands of years.'],
];

const form = (id, label) => `<form class="rw-form" data-rw-form novalidate>
  <label for="rw-email-${id}" class="sr-only">Email address</label>
  <input id="rw-email-${id}" name="email" type="email" placeholder="Your best email" autocomplete="email" inputmode="email" required>
  <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
  <button type="submit" class="btn btn-yellow">${label}</button>
  <p class="rw-msg" role="status"></p>
  <p class="rw-free">Free. Takes ten seconds.</p>
  <p class="rw-consent">${CONSENT_LINE}</p>
</form>`;

const CSS = `<style>
.rw-head{position:sticky;top:0;z-index:40;background:rgba(255,255,255,.95);backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
.rw-head .wrap{display:flex;align-items:center;justify-content:space-between;min-height:64px}
.rw-head img{height:36px;width:auto}
.rw-head a.rw-explore{font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;color:var(--ink-2)}
.rw-hero{position:relative;color:#fff;background:#1d2119;overflow:hidden}
.rw-hero picture,.rw-hero picture img{position:absolute;inset:0;width:100%;height:100%}
.rw-hero picture img{object-fit:cover;object-position:62% 40%}
.rw-hero:after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(14,16,12,.88) 0%,rgba(14,16,12,.7) 45%,rgba(14,16,12,.2) 80%)}
.rw-hero .wrap{position:relative;z-index:1;padding-top:72px;padding-bottom:80px}
.rw-hero-in{max-width:620px}
.rw-kicker{display:inline-block;background:var(--accent);color:var(--ink);font-size:12px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;padding:6px 10px}
.rw-hero h1{font-size:clamp(34px,4.8vw,60px);line-height:1.02;color:#fff;margin-top:18px}
.rw-hero h1 .nw{white-space:nowrap}
.rw-hero h1 em{font-style:normal;color:var(--accent)}
.rw-hero .rw-sub{font-size:clamp(18px,1.6vw,21px);line-height:1.55;color:#ECECE6;margin-top:18px}
.rw-form{display:flex;flex-wrap:wrap;gap:10px;margin-top:26px;max-width:560px}
.rw-form input[type=email]{flex:1 1 240px;min-height:56px;border:0;padding:0 16px;font-size:17px}
.rw-form .btn{min-height:56px;flex:0 0 auto}
.rw-msg{flex-basis:100%;font-size:15px;font-weight:600;margin:0}
.rw-msg:empty{display:none}
.rw-consent{flex-basis:100%;font-size:12.5px;line-height:1.5;opacity:.75;margin:2px 0 0}
.rw-consent a{color:inherit}
.rw-body .rw-free,.rw-free{flex-basis:100%;font-size:14px;font-weight:600;margin:0;color:inherit}
.rw-body .rw-consent,.rw-body .rw-msg{font-size:12.5px;line-height:1.5;margin:2px 0 0}
.rw-body .rw-msg{font-size:15px}
.rw-body{max-width:720px;margin:0 auto;padding:0 24px}
.rw-body h2{font-size:clamp(28px,3.4vw,40px);line-height:1.08}
.rw-body p{font-size:19px;line-height:1.7;color:var(--text)}
.rw-body p+p{margin-top:16px}
.rw-bul{list-style:none;padding:0;margin:26px 0 0;display:flex;flex-direction:column;gap:16px}
.rw-bul li{position:relative;padding-left:34px;font-size:19px;line-height:1.55;color:var(--ink-2)}
.rw-bul li:before{content:'';position:absolute;left:0;top:7px;width:18px;height:18px;border-radius:50%;background:var(--accent);box-shadow:inset 0 0 0 5px #fff,0 0 0 1.5px var(--ink)}
.rw-bul b{color:var(--ink)}
.rw-bonus{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:30px}
.rw-bonus div{border:1.5px dashed var(--ink);padding:18px 20px;background:#fff}
.rw-bonus span{display:block;font-size:12px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--ember)}
.rw-bonus b{display:block;font-family:var(--display);text-transform:uppercase;font-size:19px;margin-top:6px;line-height:1.15}
.rw-bonus p{font-size:15px!important;line-height:1.5!important;margin-top:6px!important}
.rw-who{display:grid;grid-template-columns:200px 1fr;gap:28px;align-items:start}
.rw-who img{width:200px;height:250px;object-fit:cover}
.rw-cap{font-size:13px!important;color:var(--soft)!important;margin-top:8px!important}
.rw-cta{background:#23261F;color:#fff;text-align:left}
.rw-cta h2{color:#fff}
.rw-cta p{color:var(--on-dark)}
.rw-ps{font-size:17px!important;font-style:italic}
.rw-thanks{background:var(--stone);scroll-margin-top:70px}
.rw-thanks ol{counter-reset:h;list-style:none;padding:0;margin:26px 0 0;display:flex;flex-direction:column;gap:18px}
.rw-thanks li{counter-increment:h;background:#fff;padding:18px 20px 18px 64px;position:relative;font-size:17px;line-height:1.6;color:var(--text)}
.rw-thanks li:before{content:counter(h);position:absolute;left:20px;top:16px;font-family:var(--display);font-weight:800;font-size:26px;color:var(--ember)}
.rw-thanks li b{display:block;font-family:var(--display);text-transform:uppercase;color:var(--ink);font-size:18px}
.rw-foot{background:var(--ink);color:var(--on-dark);padding:40px 0 34px;font-size:15px}
.rw-foot nav{display:flex;flex-wrap:wrap;gap:10px 26px;margin-bottom:20px}
.rw-foot a{color:#fff;text-decoration:none}.rw-foot a:hover{text-decoration:underline;color:#fff}
.rw-foot p{font-size:13px;color:var(--on-dark-2);line-height:1.6;max-width:820px}
.rw-foot p+p{margin-top:10px}
@media (max-width:700px){
  .rw-hero .wrap{padding-top:44px;padding-bottom:52px}
  .rw-hero:after{background:linear-gradient(180deg,rgba(14,16,12,.55) 0%,rgba(14,16,12,.82) 55%,rgba(14,16,12,.92) 100%)}
  .rw-form .btn{width:100%}
  .rw-hero h1{font-size:clamp(28px,8.4vw,34px)}
  .rw-hero h1 .nw{white-space:normal}
  .rw-bonus{grid-template-columns:1fr}
  .rw-who{grid-template-columns:1fr}
  .rw-who img{width:100%;height:auto;aspect-ratio:4/3}
}
</style>`;

// Own handler (not the shared footer one) so success reveals the 5 habits right here.
const SCRIPT = `<script>
(function(){
  var ev=function(n,p){ if(window.gtag) window.gtag('event',n,Object.assign({page:'rewild'},p||{})); };
  var utm=function(){ try{ var c=JSON.parse(localStorage.getItem('rewild_utm')); if(c && Date.now()-c.at<30*864e5) return c; }catch(e){} return undefined; };
  var done=false;
  document.querySelectorAll('form[data-rw-form]').forEach(function(f,i){
    f.addEventListener('submit',function(e){
      e.preventDefault();
      var msg=f.querySelector('.rw-msg'), btn=f.querySelector('button'), email=f.email.value.trim();
      if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(email)){ msg.textContent='Please enter a valid email address.'; f.email.focus(); return; }
      btn.disabled=true; msg.textContent='';
      fetch('/api/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email,website:f.website.value,source:'rewild',utm:utm(),page:location.pathname})})
        .then(function(r){ return r.json().then(function(d){ if(!r.ok) throw new Error(d.error); }); })
        .then(function(){
          if(!done){ done=true; ev('sign_up',{method:'rewild',form:i===0?'top':'bottom'}); }
          document.querySelectorAll('form[data-rw-form]').forEach(function(x){ x.hidden=true; });
          
          var t=document.getElementById('thanks'); t.hidden=false; t.scrollIntoView({behavior:'smooth'}); t.querySelector('h2').focus({preventScroll:true});
        })
        .catch(function(err){ msg.textContent=(err&&err.message)||'Something went wrong. Please try again.'; btn.disabled=false; });
    });
  });
  document.addEventListener('click',function(e){
    var a=e.target.closest('[data-track]'); if(!a) return;
    var t=a.dataset.track;
    if(t==='manifesto') ev('manifesto_click',{from:a.dataset.topic||''});
    else if(t==='shop') ev('shop_click',{from:a.dataset.topic||''});
  });
})();
</script>`;

export const rewildPage = {
  path: '/rewild/',
  title: '5 Forgotten Habits, Free | The REWILD Community',
  ogTitle: '5 forgotten habits your great-grandparents never had to think about',
  description: 'Free: 5 simple rewilding habits for light, movement, earth, food and fungi, plus the Rewild Field Guide and 20% off. From REWILD in British Columbia.',
  image: '/img/og-rewild.jpg',
  minimal: true,
  head: CSS,
  scripts: SCRIPT,
  body: `
<section class="rw-hero">
  <picture><source media="(max-width: 700px)" srcset="/img/rewild-hero-mobile.webp"><img src="/img/hero-trail-larches-lake.webp" alt="" width="1600" height="900" fetchpriority="high"></picture>
  <div class="wrap"><div class="rw-hero-in">
    <span class="rw-kicker">Free for the REWILD community</span>
    <h1>5 forgotten habits your <span class="nw">great-grandparents</span> <em>never had to think about.</em></h1>
    <p class="rw-sub">And how to get each one back in about ten minutes a day. No quitting your job, no selling your phone, no moving to a cabin.</p>
    ${form('top', 'Send me the 5 habits')}
  </div></div>
</section>

<section class="section"><div class="rw-body">
  <h2>We made life easier. Somewhere along the way, we left a few things behind.</h2>
  <p style="margin-top:20px">Brighter rooms. Softer shoes. Faster food. More screens. Most of it is great. But some of what made us feel human got quietly traded away, and most of us never noticed it go.</p>
  <p>Rewilding is taking a few of those things back. Not all at once. Not perfectly. One small habit at a time. Here's what you get:</p>
  <ul class="rw-bul">
    <li><b>The ten-minute morning habit</b> that costs nothing, needs no app, and most people skip every single day.</li>
    <li><b>Why your most comfortable shoes</b> might be the least natural thing you wear all day.</li>
    <li><b>The phone-call trick</b> that adds a walk to your day without finding time for a workout.</li>
    <li><b>A one-question test for food</b> that cuts through every diet argument you've ever heard.</li>
    <li><b>The forgotten kingdom under your feet</b>, and why people have foraged, cooked and brewed with it for thousands of years.</li>
  </ul>
  <div class="rw-bonus">
    <div><span>Bonus 1</span><b>The Rewild Field Guide</b><p>Our two-minute guide to Cordyceps, Lion's Mane, Chaga and Reishi.</p></div>
    <div><span>Bonus 2</span><b>20% off your first order</b><p>If you ever want to try our mushrooms. No pressure, no expiry games.</p></div>
  </div>
</div></section>

<section class="section stone tight"><div class="rw-body">
  <div class="rw-who">
    <div><img src="/img/jade-stevens-founder-mountains.webp" alt="Jade Stevens, REWILD founder, hiking in the snowy BC mountains" width="800" height="1000" loading="lazy"><p class="rw-cap">Jade, out where the emails get written.</p></div>
    <div>
      <h2 style="font-size:clamp(24px,2.6vw,32px)">Who's sending these?</h2>
      <p style="margin-top:14px">We're Jade, Pete and Sean. Three Rewilders in the mountains of British Columbia. Not gurus, not a wellness empire. Just people who'd rather be outside.</p>
      <p><b>Why is it free?</b> Honest answer: we sell organic mushrooms grown here in BC. Some people who read our emails end up trying them. Most just enjoy the emails. Either is fine with us.</p>
      <p style="font-size:16px"><a class="link" href="/manifesto/" data-track="manifesto" data-topic="who">Read the Rewild Manifesto</a></p>
    </div>
  </div>
</div></section>

<section class="section rw-cta tight"><div class="rw-body">
  <h2>Get the 5 habits now.</h2>
  <p style="margin-top:14px">They show up on this page the second you join. Your welcome email, Field Guide and 20% code follow right after.</p>
  ${form('bottom', 'Send me the 5 habits')}
  <p class="rw-ps" style="margin-top:28px">P.S. Pick just one habit and do it three days in a row. Then hit reply and tell us how it went. We read every one.</p>
</div></section>

<section class="section rw-thanks" id="thanks" hidden><div class="rw-body">
  <p class="eyebrow">You're in</p>
  <h2 tabindex="-1" style="margin-top:12px">Welcome, Rewilder. Here are your 5 habits.</h2>
  <p style="margin-top:14px">Pick one. Just one. Your welcome email with the Field Guide and your 20% code is on its way (check promotions if you don't see it).</p>
  <ol>${HABITS.map(([h, t]) => `<li><b>${h}</b>${t}</li>`).join('')}</ol>
  <p style="margin-top:28px;font-size:16px"><a class="link" href="/manifesto/" data-track="manifesto" data-topic="thanks">Read the Rewild Manifesto</a> &nbsp;·&nbsp; <a class="link" href="/shop/" data-track="shop" data-topic="thanks">Explore the mushrooms</a></p>
</div></section>`,
};
