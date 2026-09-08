/* KlangTresor · Handbuch — der Bildempfänger
   ==========================================
   Nimmt Bilder aus dem Browser entgegen und legt sie in docs/handbuch/bilder/
   ab. Läuft NUR, solange Abbildungen aufgenommen werden — kein Teil des
   Archivs, kein Morgenschritt, nichts hängt daran.

       node docs/handbuch/bildempfang.js      (danach wieder beenden)

   WARUM DAS SEIN MUSS. Die Abbildungen des Handbuchs werden nicht vom
   Bildschirm abfotografiert, sondern aus den Zeichenflächen der App
   ausgelesen. Der Grund ist nicht Schönheit, sondern Not: der eingebaute
   Vorschaubereich kann Bildausschnitte weder zuschneiden noch speichern,
   und Chrome lädt die App mit 323 Titeln nicht in vertretbarer Zeit durch.
   Der Umweg über einen eigenen Empfänger ist der einzige Weg, der bleibt —
   und er hat einen Vorteil: die Bilder kommen in doppelter Auflösung und
   ohne Browserrahmen.

   SO WIRD EIN BILD GEMACHT (Stand 08.09.2026, am Klangraum erprobt):

   1. Diesen Empfänger starten.
   2. Die App im Browser öffnen, OHNE Deep-Link — sonst startet die
      Wiedergabe von selbst.
   3. Den Zustand herstellen, den das Bild zeigen soll. Für den Klangraum:
      hineinzoomen, den Titel „Morgen" über spielenNachId() abspielen (dann
      kreist das Sound-Schiff um seinen Stern), und für die Nachbarschafts-
      fäden den Zeiger auf den Stern führen.
   4. Im Browser dieses Skript ausführen — cs sind die sichtbaren
      Zeichenflächen, sie liegen übereinander und müssen in ihrer
      Reihenfolge zusammengesetzt werden:

        const cs=[...document.querySelectorAll('canvas')]
                 .filter(c=>c.offsetParent!==null);
        const mx=703, my=716, R=470;            // Mitte und Halbbreite in Bildpunkten
        const sx=Math.max(0,mx-R), sy=Math.max(0,my-R);
        const z=document.createElement('canvas'); z.width=R*2; z.height=R*2;
        const g=z.getContext('2d'); g.fillStyle='#000'; g.fillRect(0,0,z.width,z.height);
        for(const c of cs) g.drawImage(c, sx, sy, R*2, R*2, 0, 0, R*2, R*2);
        const b=await new Promise(r=>z.toBlob(r,'image/png'));
        await fetch('http://localhost:8799/name.png',{method:'POST',body:b});

   5. Danach: Wiedergabe anhalten, den Empfänger beenden.

   DREI FALLEN, alle am 08.09.2026 hineingetappt:

   · Der Zeiger-Zustand überlebt keinen Skriptaufruf. Wer die
     Nachbarschaftsfäden im Bild haben will, muss hover und Auslesen in
     EINEM Zug ausführen — ein synthetisches mousemove reicht der App nicht.
   · Die Bildformate der Vorlage waren geraten (16:9, 16:10, 3:4), bevor je
     ein Bild existierte. Die Karte ist quadratisch. Erst das Bild, dann das
     Format.
   · localStorage hängt am Ursprung, nicht am Fenster: was zum Fotografieren
     umgeschaltet wird, findet der Autor beim nächsten Laden in seinem
     eigenen Fenster wieder. Vorher den Stand sichern, hinterher vergleichen.
     (Am 08.09. blieb er unberührt — Registerwechsel, Zoom und Wiedergabe
     schreiben nichts.)
*/
const http = require('http'), fs = require('fs'), path = require('path');
const ZIEL = '/Volumes/Extreme_SSD/Entwicklung/SunoArchive/docs/handbuch/bilder';
http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const name = (req.url || '/bild').replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 60) || 'bild';
  const stuecke = [];
  req.on('data', (d) => stuecke.push(d));
  req.on('end', () => {
    const roh = Buffer.concat(stuecke);
    const datei = path.join(ZIEL, name.endsWith('.png') ? name : name + '.png');
    fs.writeFileSync(datei, roh);
    console.log(`${datei}  ${(roh.length / 1024).toFixed(0)} kB`);
    res.writeHead(200); res.end('ok');
  });
}).listen(8799, () => console.log('Empfang auf 8799, Ziel: ' + ZIEL));
