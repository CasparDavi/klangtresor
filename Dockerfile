# KlangTresor — Website + Archiv im Heimnetz.
# Node 20 (glibc, nicht Alpine): onnxruntime-node liefert nur glibc-Binaries.
FROM node:20-bookworm-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg libgomp1 ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY bin ./bin
COPY browser ./browser
COPY server ./server
COPY web ./web
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

# chmod 755, nicht chmod +x: "+x" ADDIERT nur das Ausfuehrungsbit zu dem,
# was die Datei mitbringt. Kommt sie mit 600 aus dem Kontext (auf exFAT-
# Platten der Regelfall), wird daraus 700 - und die Datei gehoert root,
# waehrend der Container als "node" laeuft. Ergebnis: "Permission denied"
# und ein Container, der sich endlos neu startet (gefunden 23.08.2026).
RUN chmod 755 /usr/local/bin/docker-entrypoint.sh bin/server-start.sh \
 && chown -R node:node /app \
 && mkdir -p /app/library /app/geheim \
 && chown node:node /app/library /app/geheim

USER node

EXPOSE 8788

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["sh", "bin/server-start.sh"]
