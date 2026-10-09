// Refer a friend (/refer/) and leave a review (/review/). Rules live in netlify/functions/_shared/referrals.mjs and reviews.mjs.
import { SITE } from './site.mjs';

const RULES = [
  ['Share your code', 'Every REWILD customer gets a personal friend code. Send your link, or just tell them the code.'],
  ['Your friend saves $20', 'They get $20 off their first order of $75 or more.'],
  ['You get $20', 'Once their order is in and past our 14-day guarantee, we email you $20 off your next order of $75 or more.'],
];
const FINE = 'Friend codes are for first orders only, one per new customer, and can’t be used on your own order. They don’t combine with other codes or with bundle prices (the Energy Duo and the All Four Set are already discounted). Rewards are $20 off an order of $75 or more, work once and are good for 6 months. A reward is sent for each friend whose first order is not refunded. We may hold a reward if it looks like a code was used on the customer’s own order.';

export const referPage = {
  path: '/refer/',
  title: 'Refer a Friend: Give $20, Get $20 | REWILD',
  description: 'Share REWILD with a friend. They get $20 off their first order of $75 or more, and you get $20 off your next one.',
  body: `
<section class="page-hero dark hero-photo hero-larches"><div class="wrap stack-sm" style="gap:16px">
  <p class="eyebrow">Refer a friend</p>
  <h1 class="h1" style="font-size:clamp(44px,6vw,76px);color:#fff">Give $20. Get $20.</h1>
  <p class="lead" style="color:var(--on-dark);max-width:600px">Know someone who'd love REWILD? Share your friend code. They save $20 on their first order, and you get $20 off your next one.</p>
</div></section>
<section class="section"><div class="wrap split" style="align-items:flex-start">
  <div class="stack" id="refer-box">
    <div id="refer-mine" hidden class="refer-card">
      <p class="eyebrow">Your friend code</p>
      <p class="refer-code" id="rf-code"></p>
      <div class="copy-row"><input type="text" id="rf-link" readonly aria-label="Your share link"><button type="button" class="btn btn-dark" id="rf-copy">Copy link</button></div>
      <div class="row" style="gap:10px;margin-top:4px">
        <a class="btn btn-outline" id="rf-sms" href="#">Text it</a>
        <a class="btn btn-outline" id="rf-mail" href="#">Email it</a>
        <a class="btn btn-outline" id="rf-wa" href="#" target="_blank" rel="noopener">WhatsApp</a>
        <button type="button" class="btn btn-outline" id="rf-share" hidden>Share</button>
      </div>
      <p class="small muted" id="rf-msg" role="status"></p>
    </div>
    <div id="refer-ask" class="stack-sm">
      <h2 class="h3">Get your friend code</h2>
      <p>Already ordered from us? Enter the email you used and we'll send your code and share link.</p>
      <form id="rf-form" class="signup" novalidate>
        <label for="rf-email" class="sr-only">Email address</label>
        <input id="rf-email" type="email" placeholder="The email you ordered with" autocomplete="email" required>
        <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
        <button type="submit" class="btn btn-yellow">Email me my code</button>
      </form>
      <p class="small" id="rf-form-msg" role="status"></p>
      <p class="small muted">Haven't ordered yet? Your code comes with your first order. <a class="link" href="/shop/">Shop the mushrooms</a>.</p>
    </div>
  </div>
  <ol class="refer-steps">${RULES.map(([h, p], i) => `<li><span class="why-n">0${i + 1}</span><div><b>${h}</b><span>${p}</span></div></li>`).join('')}</ol>
</div></section>
<section class="section tight stone"><div class="narrow">
  <h2 class="h3" style="margin-bottom:12px">The fine print</h2>
  <p class="muted" style="font-size:16px">${FINE}</p>
  <p class="small">Questions? Email <a class="link" href="mailto:${SITE.email}">${SITE.email}</a>.</p>
</div></section>`,
  scripts: `<script>
(function(){
  var qs=new URLSearchParams(location.search), code=(qs.get('c')||'').toUpperCase();
  function show(c){
    var link=location.origin+'/shop/?code='+encodeURIComponent(c);
    var msg='I love these mushroom powders from REWILD (grown in BC). Here\\u2019s $20 off your first order of $75+: '+link;
    document.getElementById('rf-code').textContent=c;
    document.getElementById('rf-link').value=link;
    document.getElementById('rf-sms').href='sms:?&body='+encodeURIComponent(msg);
    document.getElementById('rf-mail').href='mailto:?subject='+encodeURIComponent('$20 off REWILD mushrooms')+'&body='+encodeURIComponent(msg);
    document.getElementById('rf-wa').href='https://wa.me/?text='+encodeURIComponent(msg);
    var sh=document.getElementById('rf-share');
    if(navigator.share){sh.hidden=false;sh.onclick=function(){navigator.share({title:'$20 off REWILD',text:msg}).catch(function(){});};}
    document.getElementById('rf-copy').onclick=function(){var i=document.getElementById('rf-link');i.select();(navigator.clipboard?navigator.clipboard.writeText(link):Promise.reject()).then(function(){document.getElementById('rf-msg').textContent='Copied.';},function(){document.execCommand('copy');document.getElementById('rf-msg').textContent='Copied.';});};
    document.getElementById('refer-mine').hidden=false;
    document.getElementById('refer-ask').hidden=true;
  }
  if(/^[A-Z]{2,10}-[A-Z2-9]{4}$/.test(code)){fetch('/api/refer?code='+encodeURIComponent(code)).then(function(r){return r.ok?r.json():null}).then(function(d){if(d)show(d.code);}).catch(function(){});}
  var f=document.getElementById('rf-form');
  f.addEventListener('submit',function(e){e.preventDefault();var m=document.getElementById('rf-form-msg'),b=f.querySelector('button');b.disabled=true;m.textContent='Sending\\u2026';
    fetch('/api/refer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:document.getElementById('rf-email').value,website:f.website.value})})
      .then(function(r){return r.json().then(function(d){if(!r.ok)throw new Error(d.error||'Something went wrong.');})})
      .then(function(){m.textContent='If that email has an order with us, your code is on its way. Check your inbox (and spam) in a minute.';})
      .catch(function(err){m.textContent=err.message;}).then(function(){b.disabled=false;});
  });
})();
</script>`,
};

export const reviewPage = {
  path: '/review/',
  title: 'Leave a Review | REWILD',
  description: 'Tell us how your REWILD mushrooms are going.',
  noindex: true,
  body: `
<section class="section"><div class="narrow" style="max-width:680px">
  <div id="rv-app" aria-live="polite"><p class="muted">Loading…</p></div>
</div></section>`,
  scripts: `<script>
(function(){
  var app=document.getElementById('rv-app'), qs=new URLSearchParams(location.search), o=qs.get('o'), t=qs.get('t');
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function fail(msg){app.innerHTML='<h1 class="h2" style="font-size:clamp(28px,4vw,40px)">Hmm.</h1><p class="lead">'+esc(msg)+'</p><p><a class="link" href="mailto:hello@rewildmushrooms.com">hello@rewildmushrooms.com</a></p>';}
  if(!o||!t){fail('Please use the review button in your email.');return;}
  fetch('/api/review?o='+encodeURIComponent(o)+'&t='+encodeURIComponent(t)).then(function(r){return r.json().then(function(d){if(!r.ok)throw new Error(d.error);return d;});}).then(function(d){
    if(d.done){app.innerHTML='<p class="eyebrow">Thank you</p><h1 class="h2" style="font-size:clamp(28px,4vw,40px)">We already have your review.</h1><p class="lead">Your thank-you code was emailed to you. <a class="link" href="/shop/">Back to the shop</a>.</p>';return;}
    var many=d.products.length>1;
    app.innerHTML='<p class="eyebrow">Leave a review</p><h1 class="h2" style="font-size:clamp(30px,4.4vw,46px)">'+(d.firstName?'How\\u2019s it going, '+esc(d.firstName)+'?':'How\\u2019s it going?')+'</h1>'+
      '<p class="lead">Honest is all we ask. Everyone who leaves a review gets 15% off their next order, whatever they say.</p>'+
      '<form id="rv-form" class="stack" style="gap:18px;margin-top:20px" novalidate>'+
      '<fieldset class="rv-stars"><legend>Your rating</legend>'+[5,4,3,2,1].map(function(n){return '<input type="radio" name="rating" id="st'+n+'" value="'+n+'"><label for="st'+n+'" title="'+n+' star'+(n>1?'s':'')+'">\\u2605</label>';}).join('')+'</fieldset>'+
      (many?'<fieldset class="rv-products"><legend>Which product is this about?</legend>'+d.products.map(function(p){return '<label><input type="checkbox" name="products" value="'+esc(p.id)+'" checked> '+esc(p.name)+'</label>';}).join('')+'</fieldset>':'<input type="hidden" name="products" value="'+esc(d.products[0]&&d.products[0].id)+'">')+
      '<div class="field"><label for="rv-title">Headline <span class="muted" style="font-weight:400">(optional)</span></label><input type="text" id="rv-title" name="title" maxlength="80" placeholder="e.g. Part of my morning now"></div>'+
      '<div class="field"><label for="rv-text">Your review</label><textarea id="rv-text" name="text" maxlength="1500" required placeholder="How do you use it? What do you like? Anything you would change?"></textarea></div>'+
      '<div class="field"><label for="rv-name">Name to show</label><input type="text" id="rv-name" name="name" maxlength="40" value="'+esc(d.displayName)+'"></div>'+
      '<div class="field"><label for="rv-loc">Where you\\u2019re from <span class="muted" style="font-weight:400">(optional)</span></label><input type="text" id="rv-loc" name="location" maxlength="40" placeholder="e.g. Nelson, BC"></div>'+
      '<label class="rv-consent"><input type="checkbox" name="consent" checked> REWILD can share my review on its website and social media.</label>'+
      '<input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">'+
      '<button type="submit" class="btn btn-yellow" style="align-self:flex-start">Send my review</button><p class="small" id="rv-msg" role="status"></p>'+
      '<p class="small muted">Reviews are read by a real person before they go on the site. Please don\\u2019t include medical details.</p></form>';
    var f=document.getElementById('rv-form');
    f.addEventListener('submit',function(e){e.preventDefault();var m=document.getElementById('rv-msg'),b=f.querySelector('button[type=submit]');
      var r=f.querySelector('input[name=rating]:checked');if(!r){m.textContent='Please choose a star rating.';return;}
      var prods=[].slice.call(f.querySelectorAll('input[name=products]')).filter(function(x){return x.type==='hidden'||x.checked;}).map(function(x){return x.value;});
      b.disabled=true;m.textContent='Sending\\u2026';
      fetch('/api/review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({o:o,t:t,rating:r.value,title:f.title.value,text:f.text.value,name:f.name.value,location:f.location.value,products:prods,consent:f.consent.checked,website:f.website.value})})
        .then(function(res){return res.json().then(function(x){if(!res.ok)throw new Error(x.error||'Something went wrong.');return x;});})
        .then(function(x){
          if(window.gtag)window.gtag('event','review_submitted',{rating:Number(r.value)});
          var exp=new Date(x.expiresAt*1000).toLocaleDateString('en-CA',{month:'long',day:'numeric',year:'numeric'});
          app.innerHTML='<p class="eyebrow">Thank you</p><h1 class="h2" style="font-size:clamp(30px,4.4vw,46px)">Thanks for the review.</h1><p class="lead">Here\\u2019s 15% off your next order. It works once and is good until '+esc(exp)+'. We emailed it to you too.</p>'+
            '<p class="refer-code">'+esc(x.code)+'</p><div class="row"><a class="btn btn-yellow" href="/shop/?code='+encodeURIComponent(x.code)+'">Shop with 15% off</a></div>'+
            (x.referral?'<div class="refer-card" style="margin-top:32px"><p class="eyebrow">Give $20. Get $20.</p><p>Know someone who\\u2019d like REWILD? Your friend code <b>'+esc(x.referral.code)+'</b> gives them $20 off their first order of $75 or more, and you get $20 when they order.</p><a class="btn btn-outline" href="/refer/?c='+encodeURIComponent(x.referral.code)+'">Share my code</a></div>':'');
          window.scrollTo({top:0,behavior:'smooth'});
        }).catch(function(err){m.textContent=err.message;b.disabled=false;});
    });
  }).catch(function(err){fail(err.message||'That review link is not right.');});
})();
</script>`,
};
