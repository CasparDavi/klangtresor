# webgl-noise (Simplex-Rauschen für GLSL)

Quelle: https://github.com/ashima/webgl-noise (Ashima Arts, Ian McEwan; gepflegt von Stefan Gustavson)
Lizenz: MIT — siehe LICENSE in diesem Ordner. Unverändert übernommen (noise2D.glsl, noise3D.glsl), 10.09.2026;
noise4D.glsl am 10.09.2026 nachgeholt, ebenfalls unverändert.
Verwendung: Effektclip-Studio, WebGL-Stufe (Wellen, Kaustik, Dunst, Flammen). Wird zur Laufzeit als Shader-Vorspann geladen.

**Warum auch die vierdimensionale Fassung:** für den Videoexport soll ein Clip nahtlos loopen. Rauschen entlang
einer geraden Zeitachse hat keine Periode, ein Loop ist damit unmöglich. Mit vier Dimensionen läuft die Zeit auf
einem Kreis in den beiden zusätzlichen Achsen: nach einer Umdrehung ist das Feld exakt wieder dasselbe, während
Ziehen und Wabern im Bild unverändert aussehen. Der Umweg über eine Überblendung entfällt damit.
