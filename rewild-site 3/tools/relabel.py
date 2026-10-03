# Repaints the handwritten dosage panel on tincture photos with new text.
import cv2, numpy as np, os, random
IMG='/home/claude/rewild-site/public/img/'
LINES=['100 ML  ·  TAKE 10-20 ML','PER SERVING  ·  5-10 SERVINGS']
Q={ # white panel corners TL,TR,BR,BL in image px
 'banner-tincture-forest':[(975,609),(1171,607),(1172,653),(975,658)],
 'cordyfuel-duo-square':[(127.5,758),(304,757),(304,798),(128.5,800)],
 'cordyfuel-powder-and-tincture-lake':[(422.5,693),(586,690),(585,729),(424,731)],
 'hero-tincture-mountains':[(1435,579.5),(1632,582.5),(1630,633),(1435,627.5)],
 'tincture-moss-mushrooms':[(407.5,730),(682.5,719),(689,804),(409,795)],
 'tincture-river-wide':[(470, 657), (665, 620), (667, 673), (473, 702)],
 'tincture-river':[(466.7, 747.0), (671.0, 708.2), (673.1, 763.7), (469.9, 794.1)],
 'tincture-rock':[(237,856),(459.5,806),(445,884),(239.5,910)],
}
def render_text(seed):
    """Tight-cropped two-line text mask, both lines same size, centred."""
    rnd=random.Random(seed); font=cv2.FONT_HERSHEY_SIMPLEX; sc=4.0; th=13
    capH=cv2.getTextSize('M',font,sc,th)[0][1]; gap=int(capH*0.55)
    adv=lambda ch: cv2.getTextSize(ch,font,sc,th)[0][0]*(0.92 if ch not in ' ·' else (0.75 if ch==' ' else 0.6))
    widths=[sum(adv(c) for c in l) for l in LINES]; Wc=int(max(widths))+60; Hc=2*capH+gap+60
    c=np.zeros((Hc,Wc),np.uint8)
    for li,line in enumerate(LINES):
        x=(Wc-widths[li])/2; base=30+capH*(li+1)+gap*li
        for ch in line:
            w=adv(ch)
            if ch=='·': cv2.circle(c,(int(x+w*0.5),int(base-capH/2)),int(th*0.75),255,-1,cv2.LINE_AA)
            elif ch!=' ':
                cv2.putText(c,ch,(int(x),int(base+rnd.uniform(-0.03,0.03)*capH)),font,sc*rnd.uniform(0.97,1.03),255,th,cv2.LINE_AA)
            x+=w
    c=cv2.warpAffine(c,np.float32([[1,-0.08,Hc*0.04],[0,1,0]]),(Wc,Hc))
    ys,xs=np.nonzero(c>20); return c[ys.min():ys.max()+1,xs.min():xs.max()+1]

for n,q in Q.items():
    src=f'/tmp/orig/{n}.webp'; im=cv2.imread(src).astype(np.float32)
    q=np.float32(q); w=np.linalg.norm(q[1]-q[0]); h=np.linalg.norm(q[3]-q[0])
    W=1200; H=int(W*h/w)
    # erase: replace every non-red pixel in the panel with a smooth white field
    qe=q.copy(); up=(q[3]-q[0]); up2=(q[2]-q[1])
    qe[0]+=up*0.07; qe[1]+=up2*0.07; qe[3]+=up*0.14; qe[2]+=up2*0.14
    poly=np.zeros(im.shape[:2],np.uint8); cv2.fillPoly(poly,[qe.astype(np.int32)],255)
    hsv=cv2.cvtColor(im.astype(np.uint8),cv2.COLOR_BGR2HSV).astype(np.float32)
    S,V=hsv[...,1],hsv[...,2]
    reg=cv2.dilate(poly,np.ones((int(h*0.6)|1,int(h*0.6)|1),np.uint8))
    vref=np.percentile(V[(poly>0)],90)
    whiteM=((V>vref*0.8)&(S<60)&(reg>0)).astype(np.float32)
    sig=max(3.0,h/5)
    field=cv2.GaussianBlur(im*whiteM[...,None],(0,0),sig)/np.maximum(cv2.GaussianBlur(whiteM,(0,0),sig),1e-3)[...,None]
    hue=hsv[...,0]; redish=(S>90)&(V>115)&((hue<22)|(hue>160))
    wm=((V>vref*0.72)&(S<75)).astype(np.uint8)
    kk=max(3,int(h*0.28))|1
    cl=cv2.morphologyEx(wm,cv2.MORPH_CLOSE,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(kk,kk)))
    ff=cl.copy(); hh,ww=ff.shape; msk=np.zeros((hh+2,ww+2),np.uint8)
    nlab,lab=cv2.connectedComponents(cl)
    c=tuple(np.int32(q.mean(0))); comp=(lab==lab[c[1],c[0]]).astype(np.uint8)
    cs,_=cv2.findContours(comp,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE); panel=np.zeros_like(comp); cv2.drawContours(panel,cs,-1,1,-1)
    panel=cv2.erode(panel,np.ones((3,3),np.uint8))
    m=((poly>0)&(panel>0)&~redish).astype(np.uint8)
    m=cv2.morphologyEx(m,cv2.MORPH_OPEN,np.ones((2,2),np.uint8))
    resid=(im-field)[whiteM>0]; noise=np.random.default_rng(1).normal(0,min(6,float(np.std(resid))*0.6),im.shape).astype(np.float32)
    mf=cv2.GaussianBlur(m.astype(np.float32),(0,0),0.8)[...,None]
    clean=im*(1-mf)+(field+noise)*mf
    # new text, bent to follow the panel's curved edges with equal padding
    up=(q[3]-q[0]); up2=(q[2]-q[1])
    qx=q.copy(); qx[0]-=up*0.35; qx[1]-=up2*0.35; qx[3]+=up*0.35; qx[2]+=up2*0.35
    RW=int(w*4); RH=int(h*1.7*4)
    Mrect=cv2.getPerspectiveTransform(np.float32([[0,0],[RW,0],[RW,RH],[0,RH]]),qx)
    pr=cv2.warpPerspective(panel*255,np.linalg.inv(Mrect),(RW,RH),flags=cv2.INTER_NEAREST)>0
    cols=np.where(pr.sum(0)>RH*0.15)[0]
    L,Rr=cols.min(),cols.max()
    xs=np.arange(L,Rr+1); tops=np.array([np.argmax(pr[:,x]) for x in xs]); bots=np.array([RH-1-np.argmax(pr[::-1,x]) for x in xs])
    core=(xs>L+(Rr-L)*0.12)&(xs<Rr-(Rr-L)*0.12)
    pt=np.polyfit(xs[core],tops[core],2); pb=np.polyfit(xs[core],bots[core],2)
    ph=np.median(bots[core]-tops[core]); pad=ph*0.17
    pm=(pt+pb)/2; half=(Rr-L)/2; sag=abs(pm[0])*half*half; lim=ph*0.18
    if sag>lim: k=lim/sag; xc=(L+Rr)/2; pm=np.polyfit(xs,np.polyval(pm,xs)-pm[0]*(1-k)*(xs-xc)**2,2)
    txt=render_text(hash(n)%1000); th_,tw_=txt.shape
    availW=(Rr-L)-2*pad; availH=ph-2*pad
    s_=min(availW/tw_, availH/th_); tW=tw_*s_; tH=th_*s_
    X,Y=np.meshgrid(np.arange(RW,dtype=np.float32),np.arange(RH,dtype=np.float32))
    xl=L+((Rr-L)-tW)/2
    mid=np.polyval(pm,X)
    u=(X-xl)/tW*tw_
    v=((Y-(mid-tH/2))/tH)*th_
    ar=cv2.remap(txt,u.astype(np.float32),v.astype(np.float32),cv2.INTER_LINEAR,borderValue=0)
    a=cv2.warpPerspective(ar,Mrect,(im.shape[1],im.shape[0]),flags=cv2.INTER_AREA).astype(np.float32)/255
    a=cv2.GaussianBlur(a,(0,0),max(0.5,h/70))[...,None]*0.95
    ink=np.float32([48,34,28])/255  # BGR navy-black marker
    out=clean*(1-a*(1-ink))
    out=np.clip(out,0,255).astype(np.uint8)
    cv2.imwrite(IMG+n+'.webp',out,[cv2.IMWRITE_WEBP_QUALITY,84])
    if os.path.exists(f'/tmp/orig/{n}.jpg'): cv2.imwrite(IMG+n+'.jpg',out,[cv2.IMWRITE_JPEG_QUALITY,86])
    x0,y0=np.int32(q.min(0)-30); x1,y1=np.int32(q.max(0)+30)
    crop=out[max(0,y0):y1,max(0,x0):x1]; cv2.imwrite(f'/tmp/r_{n}.png',cv2.resize(crop,None,fx=2.5,fy=2.5,interpolation=cv2.INTER_CUBIC))
print('done')
