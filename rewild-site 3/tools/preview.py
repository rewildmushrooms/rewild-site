# Builds dist/ into one offline HTML file: python3 tools/preview.py <out.html>
import re, base64, os, json, sys
D=os.path.join(os.path.dirname(__file__),'..','dist')
OUT=sys.argv[1] if len(sys.argv)>1 else 'rewild-preview.html'
MT={'webp':'image/webp','png':'image/png','jpg':'image/jpeg'}
def uri(path):
    p=D+path
    return f'data:{MT[p.rsplit(".",1)[1]]};base64,'+base64.b64encode(open(p,'rb').read()).decode() if os.path.exists(p) else path
pages={}
for root,_,files in os.walk(D):
    if 'index.html' not in files or '/hq' in root: continue
    route=root[len(D):].replace(os.sep,'/')+'/'
    html=open(os.path.join(root,'index.html')).read()
    extra=html.split('<script src="/js/cart.js',1)[1]
    pages[route]={'title':re.search(r'<title>(.*?)</title>',html).group(1),
      'main':re.search(r'<main id="main">(.*?)</main>',html,re.S).group(1),
      'quiz':'quiz.js' in extra,'inline':''.join(re.findall(r'<script>(.*?)</script>',extra,re.S))}
home=open(D+'/index.html').read()
def links(h): return re.sub(r'href="/([^"#?]*)"',lambda m:f'href="#/{m.group(1)}"',h)
used=set()
for v in pages.values():
    v['main']=links(v['main']); used|=set(re.findall(r'/img/[A-Za-z0-9._-]+',v['main']))
css=open(D+'/css/site.css').read()
css=re.sub(r'url\((/img/[^)]+)\)',lambda m:f'url({uri(m.group(1))})',css)
cat=open(D+'/js/catalog.js').read(); used|=set(re.findall(r'/img/[A-Za-z0-9._-]+',cat))
cart=open(D+'/js/cart.js').read(); quiz=open(D+'/js/quiz.js').read()
before,after=home.split('<main id="main">',1)[0],home.split('</main>',1)[1]
before=re.sub(r'<link rel="stylesheet" href="/css/site.css[^"]*">',lambda m:f'<style>{css}</style>',before)
for pat in [r'<script type="application/ld\+json">.*?</script>',r'<link rel="preload"[^>]*>',r'<link rel="canonical"[^>]*>',r'<meta name="description"[^>]*>']:
    before=re.sub(pat,'',before,flags=re.S)
before=before.replace('<div class="announce">','<div class="announce" style="background:#E8C800;color:#121310">Offline preview · Checkout and email signup need the live site</div><div class="announce">',1)
after=re.sub(r'<script src="/js/catalog\.js.*</body>','</body>',after,flags=re.S)
shell=links(before+'<main id="main"></main>'+after)
shell=re.sub(r'(src|href)="(/img/[^"]+|/favicon[^"]+|/apple-touch-icon\.png)"',lambda m:f'{m.group(1)}="{uri(m.group(2))}"',shell)
imgs={k:uri(k) for k in used}
J=lambda o: json.dumps(o).replace('</','<\\/')
router=f'''<script>{cat}
var IMGS={J(imgs)};function R(h){{return h.replace(/\\/img\\/[A-Za-z0-9._-]+/g,function(m){{return IMGS[m]||m;}});}}
window.REWILD_CATALOG.products.forEach(function(p){{p.image=R(p.image)}});</script><script>{cart.replace("</script>","<\\/script>")}</script>
<script>(function(){{
var PAGES={J(pages)},QUIZ={J(quiz)},main=document.getElementById('main');
function rebind(){{
 document.querySelectorAll('[data-thumb]').forEach(function(b){{b.onclick=function(){{var m=document.getElementById('gallery-main');m.src=R(b.dataset.thumb);m.classList.toggle('contain',/label-/.test(b.dataset.thumb));document.querySelectorAll('[data-thumb]').forEach(function(x){{x.setAttribute('aria-pressed',x===b)}});}};}});
 document.querySelectorAll('form[data-subscribe]').forEach(function(f){{f.onsubmit=function(e){{e.preventDefault();e.stopImmediatePropagation();f.querySelector('[data-msg]').textContent='Preview only: signup works on the live site.';}};}});
 main.querySelectorAll('form[name=contact]').forEach(function(f){{f.onsubmit=function(e){{e.preventDefault();alert('Preview only: the contact form works on the live site.');}};}});
}}
function go(){{
 var h=location.hash; if(h&&h.indexOf('#/')!==0){{var el=document.getElementById(h.slice(1));if(el)el.scrollIntoView();return;}}
 var path=(h||'#/').slice(1).split('?')[0];if(!/\\/$/.test(path))path+='/';
 var p=PAGES[path]||PAGES['/'];main.innerHTML=R(p.main);document.title=p.title;window.scrollTo(0,0);
 document.querySelectorAll('#site-nav a').forEach(function(a){{var t=a.getAttribute('href').slice(1);if(t==='/'?path==='/':path.indexOf(t)===0)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');}});
 document.getElementById('site-nav').classList.remove('open');if(window.RewildCart)window.RewildCart.close();rebind();
 if(p.quiz)new Function(QUIZ)();if(p.inline)try{{new Function(p.inline)();}}catch(e){{}}
}}
window.addEventListener('hashchange',go);go();
document.getElementById('checkout-btn').addEventListener('click',function(e){{e.stopImmediatePropagation();document.getElementById('cart-error').textContent='Preview only: checkout opens Square on the live site.';}},true);
}})();</script>'''
open(OUT,'w').write(shell.replace('</body>',router+'</body>'))
print(OUT, round(os.path.getsize(OUT)/1e6,1),'MB')
