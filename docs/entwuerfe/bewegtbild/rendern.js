const path=require('node:path');
const P=path.join(__dirname,'..','..','..');
const K=require(P+'/bin/katalog.js');
const R=require(__dirname+'/regler.js');
const {execFileSync}=require('node:child_process');

const k=K.lesen();
function hsl(hex){const r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255;
  const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;let h=0,s=0;const l=(mx+mn)/2;
  if(d){s=d/(1-Math.abs(2*l-1));h=mx===r?((g-b)/d+6)%6:mx===g?(b-r)/d+2:(r-g)/d+4;h*=60;}
  return {h,s,l};}
function hex2rgb(h){return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];}
function hsl2hex(h,s,l){const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;
  let a=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];
  const z=v=>Math.round((v+m)*255).toString(16).padStart(2,'0');return '#'+z(a[0])+z(a[1])+z(a[2]);}
function abstand(a,b){let d=Math.abs(hsl(a).h-hsl(b).h);return d>180?360-d:d;}

/* Suno gibt [zeit, zaehlzeit] - die Eins ist zaehlzeit 1. */
function schlaege(s, von){
  return (s.schlaege||[]).filter(b=>b[0]>=von&&b[0]<von+R.dauer)
    .map(b=>({t:+(b[0]-von).toFixed(3), z:b[1]}));
}

/* Ein Schlag: sofort da, dann exponentiell weg - so klingt er auch. */
function puls(sl, zeitVar){
  const T=zeitVar;
  return sl.map(b=>`exp(-max(0,${T}-${b.t})*${R.abklingen})*gt(${T},${(b.t-R.vorlauf).toFixed(3)})`).join('+')||'0';
}

function farben(s){
  let a1=s.farben.akzent, a2=s.farben.akzent2;
  const ab=abstand(a1,a2);
  let gedreht=false;
  if(ab<R.mindestAbstand){
    const c=hsl(a1);
    a2=hsl2hex((c.h+R.drehung)%360, Math.max(0.55,c.s), 0.5);
    gedreht=true;
  }
  return {a1,a2,ab,gedreht};
}

function bauen(titel, startS, art){
  const s=Object.values(k.songs).find(x=>x.titel===titel);
  if(!s) throw new Error('nicht gefunden: '+titel);
  const cover=`${P}/library/songs/${s.id}/cover.jpg`;
  let sl=schlaege(s,startS);
  if(R.nurEins) sl=sl.filter(b=>b.z===1);
  const f=farben(s);
  const aus=`${__dirname}/${art}-${titel.split(' ')[0].replace(/[^a-zA-Z]/g,'')}.mp4`;

  let vf;
  if(art==='f'){
    /* zoompan kennt kein T - dort ist die Zeit on/fps (Ausgabebild). */
    const p=puls(sl,`(on/${R.fps})`);
    vf=`scale=${R.kante*2}:${R.kante*2},zoompan=z='1+${R.zoomTiefe}*(${p})':d=1`
      +`:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${R.kante}x${R.kante}:fps=${R.fps}`;
  } else {
    /* geq kennt T. Mischwert m laeuft taktweise zwischen 0 und 1. */
    const eins=sl.filter(b=>b.z===1).map(b=>b.t);
    const taktS=eins.length>1 ? (eins[eins.length-1]-eins[0])/(eins.length-1) : 2;
    /* DIE SCHLEIFE MUSS SCHLIESSEN. Eine Periode, die sich nicht
       ganzzahlig in die zehn Sekunden teilt, endet in einer anderen
       Farbe als sie anfing - gemessen sprang die Naht um 13,3, mehr als
       die halbe Wanderung selbst. Also wird die gewuenschte Periode auf
       den naechsten Teiler der Laufzeit gerundet: musikalisch fast
       dasselbe, aber der Uebergang ist unsichtbar. */
    const gewuenscht=taktS*R.wechselTakte*2;   /* hin und zurueck */
    const zyklen=Math.max(1, Math.round(R.dauer/gewuenscht));
    const periode=R.dauer/zyklen;
    const m=`(0.5-0.5*cos(2*PI*T/${periode.toFixed(4)}))`;
    const [r1,g1,b1]=hex2rgb(f.a1), [r2,g2,b2]=hex2rgb(f.a2);
    /* lum() gibt es nur im YUV-Modus. Im RGB-Modus die Helligkeit
       selbst rechnen - Rec.601, dieselben Gewichte, die auch ffmpeg
       innerlich nimmt. */
    const hell='(0.299*r(X,Y)+0.587*g(X,Y)+0.114*b(X,Y))';
    const kanal=(c1,c2)=>`(1-${R.farbTiefe})*p(X,Y)+${R.farbTiefe}*(${hell}/255)*(${c1}*(1-${m})+${c2}*${m})`;
    vf=`scale=${R.kante}:${R.kante},format=rgb24,`
      +`geq=r='${kanal(r1,r2)}':g='${kanal(g1,g2)}':b='${kanal(b1,b2)}',fps=${R.fps}`;
  }

  execFileSync('ffmpeg',['-y','-loglevel','error','-loop','1','-framerate',String(R.fps),
    '-t',String(R.dauer),'-i',cover,'-vf',vf,'-c:v','libx264','-pix_fmt','yuv420p',aus]);
  return {aus, sl:sl.length, f, titel};
}
module.exports={bauen,k,farben,abstand,hsl};
