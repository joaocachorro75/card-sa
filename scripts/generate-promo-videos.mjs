import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const TMP_DIR = "/tmp/maisquecardapio-promo";
const OUT_DIR = path.join(ROOT, "public", "promo");
fs.mkdirSync(TMP_DIR, { recursive: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

const FONT_BOLD = "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf";
const FONT_REG = "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf";
const FONT_MONO = "/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-ExtraBold.ttf";

const IMAGES = {
  feast: path.join(ROOT, "src/assets/images/promo_hero_feast_1795694410860.jpg"),
  mobile: path.join(ROOT, "src/assets/images/promo_mobile_order_1795694413268.jpg"),
  counter: path.join(ROOT, "src/assets/images/promo_kitchen_counter_1795694417029.jpg"),
  table: path.join(ROOT, "src/assets/images/landing_table_qr_1795532826077.jpg"),
  kitchen: path.join(ROOT, "src/assets/images/landing_kitchen_pass_1795532828157.jpg"),
};

function run(cmd, args) {
  execFileSync(cmd, args, { stdio: "pipe" });
}

// ============================================================================
// 1. SYNTHESIZE UPBEAT MODERN COMMERCIAL SOUNDTRACK (28s Stereo 44.1kHz WAV)
// ============================================================================
function generateMusicWav(filePath, durationSec = 28.0) {
  const sr = 44100;
  const totalSamples = Math.floor(sr * durationSec);
  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);

  const bpm = 116;
  const beatDur = 60 / bpm; // ~0.517s
  const stepDur = beatDur / 4; // 16th note

  // Warm commercial chord progression (Fmaj7 -> Cmaj7 -> Dm7 -> Bbmaj7)
  const chords = [
    [174.61, 220.0, 261.63, 329.63], // Fmaj7
    [130.81, 196.0, 246.94, 329.63], // Cmaj7
    [146.83, 220.0, 261.63, 349.23], // Dm7
    [116.54, 174.61, 220.0, 293.66], // Bbmaj7
  ];
  const bassNotes = [87.31, 65.41, 73.42, 58.27]; // F2, C2, D2, Bb1
  const arpPattern = [0, 1, 2, 3, 2, 1, 3, 2];

  // Deterministic pseudo-random noise for hi-hats & soft transition risers
  let seed = 1337;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed / 2147483647) * 2 - 1;
  };

  // Precompute soft pad + bass + groove per sample
  const transitionTimes = [5.5, 11.0, 16.5, 22.0];

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sr;
    const beatPos = t / beatDur;
    const barIdx = Math.floor(beatPos / 4) % 4;
    const beatInBar = beatPos % 4;
    const beatFrac = beatPos % 1;
    const stepIdx = Math.floor(t / stepDur);
    const stepFrac = (t / stepDur) % 1;

    const chord = chords[barIdx];
    const bassFreq = bassNotes[barIdx];

    // Warm electric piano / synth pad with subtle stereo detune & pumping sidechain
    const sidechain = 0.62 + 0.38 * Math.min(1, beatFrac * 2.4);
    let padL = 0;
    let padR = 0;
    for (let c = 0; c < chord.length; c++) {
      const f = chord[c];
      const env = Math.exp(-((beatPos % 4) * 0.22));
      const sL = Math.sin(2 * Math.PI * (f * 0.999) * t) + 0.22 * Math.sin(2 * Math.PI * (f * 2) * t);
      const sR = Math.sin(2 * Math.PI * (f * 1.001) * t) + 0.22 * Math.sin(2 * Math.PI * (f * 2) * t);
      padL += sL * (0.55 + 0.45 * env);
      padR += sR * (0.55 + 0.45 * env);
    }
    padL *= 0.055 * sidechain;
    padR *= 0.055 * sidechain;

    // Warm sub-bass with syncopated bounce
    const bassEnv = Math.exp(-beatFrac * 3.8);
    const bass =
      (Math.sin(2 * Math.PI * bassFreq * t) + 0.25 * Math.sin(2 * Math.PI * bassFreq * 2 * t)) *
      0.16 *
      (0.35 + 0.65 * bassEnv);

    // Bright muted pluck arpeggio (active after 2s, rests slightly on final outro tail)
    let pluckL = 0;
    let pluckR = 0;
    if (t > 1.0 && t < 26.2) {
      const eighthIdx = Math.floor(t / (beatDur / 2));
      const eighthFrac = (t / (beatDur / 2)) % 1;
      const noteFreq = chord[arpPattern[eighthIdx % arpPattern.length]] * 2;
      const pluckEnv = Math.exp(-eighthFrac * 7.5);
      const tone =
        (Math.sin(2 * Math.PI * noteFreq * t) + 0.3 * Math.sin(2 * Math.PI * noteFreq * 2 * t)) *
        pluckEnv *
        0.052;
      const pan = eighthIdx % 2 === 0 ? 0.68 : 0.32;
      pluckL = tone * pan;
      pluckR = tone * (1 - pan);
    }

    // Punchy warm 4-on-the-floor kick
    let kick = 0;
    if (t < 26.8 && beatFrac < 0.26) {
      const kTime = beatFrac * beatDur;
      const kFreq = 145 * Math.exp(-kTime * 28) + 46;
      const kEnv = Math.exp(-kTime * 14);
      kick = Math.sin(2 * Math.PI * kFreq * kTime) * kEnv * 0.30;
    }

    // Crisp clap/snare on beats 2 & 4
    let clap = 0;
    const isBackbeat = (beatInBar >= 1 && beatInBar < 1.35) || (beatInBar >= 3 && beatInBar < 3.35);
    if (t > 2.0 && t < 26.5 && isBackbeat) {
      const cTime = (beatInBar >= 3 ? beatInBar - 3 : beatInBar - 1) * beatDur;
      const cEnv = Math.exp(-cTime * 24);
      clap = rand() * cEnv * 0.11;
    }

    // Light 16th-note shaker/hi-hat
    let hat = 0;
    if (t > 1.5 && t < 26.5 && stepIdx % 2 === 1 && stepFrac < 0.4) {
      const hTime = stepFrac * stepDur;
      hat = rand() * Math.exp(-hTime * 55) * 0.04;
    }

    // Subtle soft whoosh swell at scene transitions
    let riser = 0;
    for (const tr of transitionTimes) {
      const dt = tr - t;
      if (dt > 0 && dt < 0.45) {
        const w = 1 - dt / 0.45;
        riser += rand() * w * w * 0.055;
      }
    }

    // Master fade in / fade out
    let master = 1.0;
    if (t < 0.45) master = t / 0.45;
    if (t > durationSec - 1.4) master = Math.max(0, (durationSec - t) / 1.4);

    const outL = Math.tanh((padL + bass + pluckL + kick + clap + hat * 0.8 + riser) * 1.15) * master * 0.72;
    const outR = Math.tanh((padR + bass + pluckR + kick + clap + hat * 1.2 + riser) * 1.15) * master * 0.72;
    left[i] = outL;
    right[i] = outR;
  }

  // Write PCM16 Stereo WAV
  const numChannels = 2;
  const bytesPerSample = 2;
  const dataSize = totalSamples * numChannels * bytesPerSample;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(numChannels, 22);
  buf.writeUInt32LE(sr, 24);
  buf.writeUInt32LE(sr * numChannels * bytesPerSample, 28);
  buf.writeUInt16LE(numChannels * bytesPerSample, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < totalSamples; i++) {
    buf.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(left[i] * 32767))), offset);
    buf.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(right[i] * 32767))), offset + 2);
    offset += 4;
  }
  fs.writeFileSync(filePath, buf);
}

// Helper: draw rounded rect with optional border
function rr(x1, y1, x2, y2, r, fill, stroke = null, strokeWidth = 2) {
  const cmds = [];
  if (stroke) {
    cmds.push("-fill", fill, "-stroke", stroke, "-strokewidth", String(strokeWidth));
  } else {
    cmds.push("-fill", fill, "-stroke", "none");
  }
  cmds.push("-draw", `roundrectangle ${x1},${y1} ${x2},${y2} ${r},${r}`);
  return cmds;
}

// Helper: crisp text with subtle shadow
function txt(text, { x = 0, y = 0, size = 48, font = FONT_BOLD, color = "#FFFFFF", gravity = "NorthWest", shadow = true }) {
  const signX = x >= 0 ? `+${x}` : `${x}`;
  const signY = y >= 0 ? `+${y}` : `${y}`;
  const cmds = ["-gravity", gravity, "-font", font, "-pointsize", String(size), "-stroke", "none"];
  if (shadow) {
    const sX = x + 0 >= 0 ? `+${x}` : `${x}`;
    const sY = y + 3 >= 0 ? `+${y + 3}` : `${y + 3}`;
    cmds.push("-fill", "rgba(0,0,0,0.58)", "-annotate", `${sX}${sY}`, text);
  }
  cmds.push("-fill", color, "-annotate", `${signX}${signY}`, text);
  return cmds;
}

// ============================================================================
// 2. GENERATE GRADIENT SCRIMS & BRAND HEADER BARS
// ============================================================================
function createScrim(outPath, w, h, mode = "bottom") {
  if (mode === "full-dark") {
    // Rich obsidian editorial overlay for Scene 5 end-card
    run("convert", [
      "-size", `${w}x${h}`,
      "radial-gradient:rgba(28,16,9,0.78)-rgba(9,9,11,0.95)",
      `PNG32:${outPath}`,
    ]);
    return;
  }

  // Top fade (for brand badge) + lower half/left cinematic dark vignette
  if (w < h) {
    // Vertical 9:16: dark top 28%, clear appetizing photo middle, deep dark bottom 52%
    run("convert", [
      "-size", `${w}x${h}`, "xc:none",
      "(", "-size", `${w}x460`, "gradient:rgba(9,9,11,0.88)-rgba(9,9,11,0.0)", ")", "-gravity", "North", "-composite",
      "(", "-size", `${w}x1180`, "gradient:rgba(9,9,11,0.0)-rgba(9,9,11,0.96)", ")", "-gravity", "South", "-composite",
      `PNG32:${outPath}`,
    ]);
  } else {
    // Horizontal 16:9: deep dark left-side & bottom scrim leaving right focal subject bright and appetizing
    run("convert", [
      "-size", `${w}x${h}`, "xc:none",
      "(", "-size", `${h}x1320`, "gradient:rgba(9,9,11,0.94)-rgba(9,9,11,0.0)", "-rotate", "270", ")", "-gravity", "West", "-composite",
      "(", "-size", `${w}x340`, "gradient:rgba(9,9,11,0.0)-rgba(9,9,11,0.82)", ")", "-gravity", "South", "-composite",
      "(", "-size", `${w}x220`, "gradient:rgba(9,9,11,0.68)-rgba(9,9,11,0.0)", ")", "-gravity", "North", "-composite",
      `PNG32:${outPath}`,
    ]);
  }
}

function createBrandBar(outPath, isVertical) {
  if (isVertical) {
    // 1080x1920 — safe top margin y=145
    run("convert", [
      "-size", "1080x1920", "xc:none",
      ...rr(76, 138, 578, 224, 24, "rgba(15,15,19,0.82)", "rgba(255,255,255,0.12)", 2),
      ...rr(96, 156, 148, 208, 14, "#F97316"),
      ...txt("M", { x: 109, y: 157, size: 36, font: FONT_BOLD, color: "#09090B", shadow: false }),
      ...txt("MaisQueCardapio", { x: 168, y: 158, size: 32, font: FONT_BOLD, color: "#FFFFFF", shadow: false }),
      ...txt("DELIVERY • BALCÃO • SALÃO", { x: 168, y: 194, size: 15, font: FONT_MONO, color: "#FB923C", shadow: false }),
      // Subtle domain pill on top-right
      ...rr(660, 152, 1004, 210, 18, "rgba(249,115,22,0.16)", "rgba(249,115,22,0.5)", 2),
      ...txt("0% DE COMISSÃO", { x: 702, y: 168, size: 22, font: FONT_MONO, color: "#FDBA74", shadow: false }),
      `PNG32:${outPath}`,
    ]);
  } else {
    // 1920x1080
    run("convert", [
      "-size", "1920x1080", "xc:none",
      ...rr(96, 62, 574, 144, 22, "rgba(15,15,19,0.82)", "rgba(255,255,255,0.12)", 2),
      ...rr(114, 78, 164, 128, 14, "#F97316"),
      ...txt("M", { x: 126, y: 79, size: 35, font: FONT_BOLD, color: "#09090B", shadow: false }),
      ...txt("MaisQueCardapio", { x: 184, y: 80, size: 31, font: FONT_BOLD, color: "#FFFFFF", shadow: false }),
      ...txt("DELIVERY • BALCÃO • SALÃO", { x: 184, y: 115, size: 14, font: FONT_MONO, color: "#FB923C", shadow: false }),
      ...rr(1415, 74, 1824, 132, 18, "rgba(15,15,19,0.82)", "rgba(249,115,22,0.55)", 2),
      ...txt("maisquecardapio.to-ligado.com", { x: 1443, y: 92, size: 20, font: FONT_MONO, color: "#FDBA74", shadow: false }),
      `PNG32:${outPath}`,
    ]);
  }
}

// ============================================================================
// 3. GENERATE 5 BESPOKE OVERLAY LAYERS PER ASPECT RATIO
// ============================================================================
function createVerticalOverlays() {
  const dir = path.join(TMP_DIR, "ov_v");
  fs.mkdirSync(dir, { recursive: true });
  const files = [];

  // Scene 1: Hook (Pain) — bottom safe zone y=1040..1620
  const s1 = path.join(dir, "s1.png");
  run("convert", [
    "-size", "1080x1920", "xc:none",
    ...rr(76, 1020, 620, 1076, 14, "rgba(249,115,22,0.20)", "rgba(249,115,22,0.7)", 2),
    ...txt("PARA RESTAURANTES E DELIVERIES", { x: 102, y: 1034, size: 23, font: FONT_MONO, color: "#FB923C", shadow: false }),
    ...txt("Pare de pagar", { x: 76, y: 1104, size: 78, font: FONT_BOLD, color: "#FFFFFF" }),
    ...txt("até 27% de comissão", { x: 76, y: 1196, size: 78, font: FONT_BOLD, color: "#F97316" }),
    ...txt("em cada pedido.", { x: 76, y: 1288, size: 78, font: FONT_BOLD, color: "#FFFFFF" }),
    ...rr(76, 1408, 1004, 1528, 24, "rgba(17,17,22,0.88)", "rgba(255,255,255,0.12)", 2),
    ...rr(96, 1430, 104, 1506, 4, "#F97316"),
    ...txt("O lucro do seu prato precisa", { x: 126, y: 1428, size: 33, font: FONT_BOLD, color: "#F4F4F5", shadow: false }),
    ...txt("ficar 100% no seu caixa.", { x: 126, y: 1470, size: 33, font: FONT_REG, color: "#A1A1AA", shadow: false }),
    `PNG32:${s1}`,
  ]);
  files.push(s1);

  // Scene 2: Solution (0% Commission + Own Menu)
  const s2 = path.join(dir, "s2.png");
  run("convert", [
    "-size", "1080x1920", "xc:none",
    ...rr(76, 980, 490, 1054, 18, "#F97316"),
    ...txt("0% DE COMISSÃO", { x: 108, y: 997, size: 34, font: FONT_MONO, color: "#09090B", shadow: false }),
    ...txt("Seu cardápio digital", { x: 76, y: 1086, size: 74, font: FONT_BOLD, color: "#FFFFFF" }),
    ...txt("próprio no ar em", { x: 76, y: 1174, size: 74, font: FONT_BOLD, color: "#FFFFFF" }),
    ...txt("menos de 1 minuto.", { x: 76, y: 1262, size: 74, font: FONT_BOLD, color: "#F97316" }),
    // 3 Feature Cards
    ...rr(76, 1384, 368, 1524, 22, "rgba(17,17,22,0.90)", "rgba(255,255,255,0.12)", 2),
    ...txt("DELIVERY", { x: 102, y: 1412, size: 22, font: FONT_MONO, color: "#FB923C", shadow: false }),
    ...txt("Taxa por bairro", { x: 102, y: 1450, size: 28, font: FONT_BOLD, color: "#FFFFFF", shadow: false }),
    ...rr(394, 1384, 686, 1524, 22, "rgba(17,17,22,0.90)", "rgba(255,255,255,0.12)", 2),
    ...txt("BALCÃO", { x: 420, y: 1412, size: 22, font: FONT_MONO, color: "#FB923C", shadow: false }),
    ...txt("Retirada rápida", { x: 420, y: 1450, size: 28, font: FONT_BOLD, color: "#FFFFFF", shadow: false }),
    ...rr(712, 1384, 1004, 1524, 22, "rgba(17,17,22,0.90)", "rgba(255,255,255,0.12)", 2),
    ...txt("CLIENTES", { x: 738, y: 1412, size: 22, font: FONT_MONO, color: "#FB923C", shadow: false }),
    ...txt("Base só sua", { x: 738, y: 1450, size: 28, font: FONT_BOLD, color: "#FFFFFF", shadow: false }),
    `PNG32:${s2}`,
  ]);
  files.push(s2);

  // Scene 3: WhatsApp Automático + PIX & InfinitePay
  const s3 = path.join(dir, "s3.png");
  run("convert", [
    "-size", "1080x1920", "xc:none",
    ...rr(76, 940, 620, 996, 14, "rgba(16,185,129,0.22)", "rgba(16,185,129,0.75)", 2),
    ...txt("AUTOMAÇÃO VIA QR CODE", { x: 104, y: 954, size: 24, font: FONT_MONO, color: "#34D399", shadow: false }),
    ...txt("WhatsApp automático", { x: 76, y: 1024, size: 70, font: FONT_BOLD, color: "#FFFFFF" }),
    ...txt("+ PIX e InfinitePay", { x: 76, y: 1108, size: 70, font: FONT_BOLD, color: "#34D399" }),
    ...txt("direto na sua conta.", { x: 76, y: 1192, size: 70, font: FONT_BOLD, color: "#FFFFFF" }),
    // Floating WhatsApp Notification Mockup Card
    ...rr(76, 1308, 1004, 1554, 28, "rgba(12,24,20,0.94)", "rgba(52,211,153,0.65)", 3),
    ...rr(108, 1338, 164, 1394, 16, "#10B981"),
    ...txt("W", { x: 120, y: 1344, size: 34, font: FONT_BOLD, color: "#052E16", shadow: false }),
    ...txt("WhatsApp da Loja • Enviado automaticamente", { x: 184, y: 1348, size: 24, font: FONT_BOLD, color: "#6EE7B7", shadow: false }),
    ...txt("Pedido #104 confirmado! Pagamento PIX recebido.", { x: 108, y: 1418, size: 32, font: FONT_BOLD, color: "#FFFFFF", shadow: false }),
    ...txt("Já estamos preparando seu pedido (30–40 min).", { x: 108, y: 1466, size: 28, font: FONT_REG, color: "#D1FAE5", shadow: false }),
    `PNG32:${s3}`,
  ]);
  files.push(s3);

  // Scene 4: Mesas QR Code, Comandas & Cupom 80mm
  const s4 = path.join(dir, "s4.png");
  run("convert", [
    "-size", "1080x1920", "xc:none",
    ...rr(76, 990, 650, 1046, 14, "rgba(249,115,22,0.20)", "rgba(249,115,22,0.7)", 2),
    ...txt("DO DELIVERY AO SALÃO COMPLETO", { x: 104, y: 1004, size: 23, font: FONT_MONO, color: "#FB923C", shadow: false }),
    ...txt("QR Code por mesa,", { x: 76, y: 1076, size: 74, font: FONT_BOLD, color: "#FFFFFF" }),
    ...txt("comandas abertas e", { x: 76, y: 1164, size: 74, font: FONT_BOLD, color: "#F97316" }),
    ...txt("cupom térmico 80mm.", { x: 76, y: 1252, size: 74, font: FONT_BOLD, color: "#FFFFFF" }),
    ...rr(76, 1372, 1004, 1540, 26, "rgba(17,17,22,0.90)", "rgba(255,255,255,0.14)", 2),
    ...txt("O cliente escaneia o QR Code na mesa, acompanha", { x: 110, y: 1404, size: 30, font: FONT_BOLD, color: "#F4F4F5", shadow: false }),
    ...txt("a comanda em tempo real e pede a conta sem fila.", { x: 110, y: 1448, size: 30, font: FONT_REG, color: "#A1A1AA", shadow: false }),
    ...txt("✓ Pedidos   ✓ Cozinha   ✓ Caixa   ✓ Reservas", { x: 110, y: 1492, size: 24, font: FONT_MONO, color: "#FB923C", shadow: false }),
    `PNG32:${s4}`,
  ]);
  files.push(s4);

  // Scene 5: Final Irresistible CTA End-Card
  const s5 = path.join(dir, "s5.png");
  run("convert", [
    "-size", "1080x1920", "xc:none",
    // Brand lockup centered
    ...rr(486, 300, 594, 408, 28, "#F97316"),
    ...txt("M", { x: 0, y: 311, size: 68, font: FONT_BOLD, color: "#09090B", gravity: "North", shadow: false }),
    ...txt("MaisQueCardapio", { x: 0, y: 432, size: 64, font: FONT_BOLD, color: "#FFFFFF", gravity: "North" }),
    ...txt("Venda mais sem dividir seu lucro.", { x: 0, y: 516, size: 34, font: FONT_REG, color: "#D4D4D8", gravity: "North" }),
    // 2 Plan Cards
    ...rr(80, 620, 1000, 845, 28, "rgba(20,20,25,0.92)", "rgba(255,255,255,0.14)", 2),
    ...txt("PLANO GRATUITO", { x: 120, y: 654, size: 24, font: FONT_MONO, color: "#A1A1AA", shadow: false }),
    ...txt("R$ 0/mês", { x: 705, y: 648, size: 46, font: FONT_BOLD, color: "#FFFFFF", shadow: false }),
    ...txt("Delivery por bairro, retirada no balcão,", { x: 120, y: 718, size: 30, font: FONT_BOLD, color: "#F4F4F5", shadow: false }),
    ...txt("PIX, InfinitePay e WhatsApp Automático.", { x: 120, y: 760, size: 30, font: FONT_REG, color: "#A1A1AA", shadow: false }),

    ...rr(80, 880, 1000, 1125, 28, "rgba(28,18,10,0.95)", "#F97316", 4),
    ...txt("PLANO PREMIUM • COMPLETO", { x: 120, y: 916, size: 24, font: FONT_MONO, color: "#FB923C", shadow: false }),
    ...txt("R$ 49,90/mês", { x: 640, y: 908, size: 46, font: FONT_BOLD, color: "#FB923C", shadow: false }),
    ...txt("Tudo do Gratuito + até 100 produtos,", { x: 120, y: 980, size: 30, font: FONT_BOLD, color: "#FFFFFF", shadow: false }),
    ...txt("Mesas QR Code, Comandas, Cupom 80mm e Reservas.", { x: 120, y: 1024, size: 28, font: FONT_REG, color: "#FED7AA", shadow: false }),
    ...txt("0% DE COMISSÃO • SEM FIDELIDADE", { x: 120, y: 1072, size: 22, font: FONT_MONO, color: "#FDBA74", shadow: false }),

    // Big Glowing Orange CTA Pill with exact domain
    ...rr(80, 1210, 1000, 1380, 32, "#F97316"),
    ...txt("CRIE SEU CARDÁPIO GRÁTIS AGORA", { x: 0, y: 1236, size: 24, font: FONT_MONO, color: "#271003", gravity: "North", shadow: false }),
    ...txt("maisquecardapio.to-ligado.com", { x: 0, y: 1280, size: 46, font: FONT_MONO, color: "#09090B", gravity: "North", shadow: false }),

    // Footer credit
    ...txt("Desenvolvido por To-Ligado.com", { x: 0, y: 1450, size: 28, font: FONT_BOLD, color: "#A1A1AA", gravity: "North" }),
    `PNG32:${s5}`,
  ]);
  files.push(s5);

  return files;
}

function createHorizontalOverlays() {
  const dir = path.join(TMP_DIR, "ov_h");
  fs.mkdirSync(dir, { recursive: true });
  const files = [];

  // Scene 1: Hook (1920x1080) — Editorial Left Column
  const s1 = path.join(dir, "s1.png");
  run("convert", [
    "-size", "1920x1080", "xc:none",
    ...rr(96, 260, 660, 316, 14, "rgba(249,115,22,0.22)", "rgba(249,115,22,0.75)", 2),
    ...txt("PARA RESTAURANTES E DELIVERIES", { x: 124, y: 274, size: 24, font: FONT_MONO, color: "#FB923C", shadow: false }),
    ...txt("Pare de pagar", { x: 96, y: 348, size: 88, font: FONT_BOLD, color: "#FFFFFF" }),
    ...txt("até 27% de comissão", { x: 96, y: 452, size: 88, font: FONT_BOLD, color: "#F97316" }),
    ...txt("em cada pedido.", { x: 96, y: 556, size: 88, font: FONT_BOLD, color: "#FFFFFF" }),
    ...rr(96, 700, 1020, 824, 24, "rgba(17,17,22,0.88)", "rgba(255,255,255,0.14)", 2),
    ...rr(118, 722, 126, 802, 4, "#F97316"),
    ...txt("O lucro do seu prato precisa ficar 100% no seu caixa.", { x: 148, y: 744, size: 32, font: FONT_BOLD, color: "#F4F4F5", shadow: false }),
    `PNG32:${s1}`,
  ]);
  files.push(s1);

  // Scene 2: Solution (0% Commission)
  const s2 = path.join(dir, "s2.png");
  run("convert", [
    "-size", "1920x1080", "xc:none",
    ...rr(96, 236, 515, 312, 18, "#F97316"),
    ...txt("0% DE COMISSÃO", { x: 128, y: 254, size: 36, font: FONT_MONO, color: "#09090B", shadow: false }),
    ...txt("Seu cardápio digital", { x: 96, y: 346, size: 84, font: FONT_BOLD, color: "#FFFFFF" }),
    ...txt("próprio no ar em", { x: 96, y: 446, size: 84, font: FONT_BOLD, color: "#FFFFFF" }),
    ...txt("menos de 1 minuto.", { x: 96, y: 546, size: 84, font: FONT_BOLD, color: "#F97316" }),
    ...rr(96, 700, 416, 836, 22, "rgba(17,17,22,0.90)", "rgba(255,255,255,0.14)", 2),
    ...txt("DELIVERY", { x: 124, y: 728, size: 22, font: FONT_MONO, color: "#FB923C", shadow: false }),
    ...txt("Taxa por bairro", { x: 124, y: 766, size: 30, font: FONT_BOLD, color: "#FFFFFF", shadow: false }),
    ...rr(440, 700, 760, 836, 22, "rgba(17,17,22,0.90)", "rgba(255,255,255,0.14)", 2),
    ...txt("BALCÃO", { x: 468, y: 728, size: 22, font: FONT_MONO, color: "#FB923C", shadow: false }),
    ...txt("Retirada rápida", { x: 468, y: 766, size: 30, font: FONT_BOLD, color: "#FFFFFF", shadow: false }),
    ...rr(784, 700, 1104, 836, 22, "rgba(17,17,22,0.90)", "rgba(255,255,255,0.14)", 2),
    ...txt("CLIENTES", { x: 812, y: 728, size: 22, font: FONT_MONO, color: "#FB923C", shadow: false }),
    ...txt("Base só sua", { x: 812, y: 766, size: 30, font: FONT_BOLD, color: "#FFFFFF", shadow: false }),
    `PNG32:${s2}`,
  ]);
  files.push(s2);

  // Scene 3: WhatsApp + PIX / InfinitePay
  const s3 = path.join(dir, "s3.png");
  run("convert", [
    "-size", "1920x1080", "xc:none",
    ...rr(96, 220, 620, 276, 14, "rgba(16,185,129,0.22)", "rgba(16,185,129,0.75)", 2),
    ...txt("AUTOMAÇÃO VIA QR CODE", { x: 124, y: 234, size: 24, font: FONT_MONO, color: "#34D399", shadow: false }),
    ...txt("WhatsApp automático", { x: 96, y: 310, size: 80, font: FONT_BOLD, color: "#FFFFFF" }),
    ...txt("+ PIX e InfinitePay", { x: 96, y: 406, size: 80, font: FONT_BOLD, color: "#34D399" }),
    ...txt("direto na sua conta.", { x: 96, y: 502, size: 80, font: FONT_BOLD, color: "#FFFFFF" }),
    // Floating WhatsApp card
    ...rr(96, 650, 1080, 886, 28, "rgba(12,24,20,0.94)", "rgba(52,211,153,0.70)", 3),
    ...rr(128, 680, 184, 736, 16, "#10B981"),
    ...txt("W", { x: 140, y: 686, size: 34, font: FONT_BOLD, color: "#052E16", shadow: false }),
    ...txt("WhatsApp da Loja • Disparo automático ao cliente", { x: 206, y: 690, size: 25, font: FONT_BOLD, color: "#6EE7B7", shadow: false }),
    ...txt("Pedido #104 confirmado! Pagamento PIX recebido.", { x: 128, y: 758, size: 33, font: FONT_BOLD, color: "#FFFFFF", shadow: false }),
    ...txt("Já estamos preparando seu pedido — previsão 30–40 min.", { x: 128, y: 806, size: 28, font: FONT_REG, color: "#D1FAE5", shadow: false }),
    `PNG32:${s3}`,
  ]);
  files.push(s3);

  // Scene 4: Mesas QR Code & Comandas
  const s4 = path.join(dir, "s4.png");
  run("convert", [
    "-size", "1920x1080", "xc:none",
    ...rr(96, 236, 680, 292, 14, "rgba(249,115,22,0.22)", "rgba(249,115,22,0.75)", 2),
    ...txt("DO DELIVERY AO SALÃO COMPLETO", { x: 124, y: 250, size: 24, font: FONT_MONO, color: "#FB923C", shadow: false }),
    ...txt("QR Code por mesa,", { x: 96, y: 326, size: 84, font: FONT_BOLD, color: "#FFFFFF" }),
    ...txt("comandas abertas e", { x: 96, y: 426, size: 84, font: FONT_BOLD, color: "#F97316" }),
    ...txt("cupom térmico 80mm.", { x: 96, y: 526, size: 84, font: FONT_BOLD, color: "#FFFFFF" }),
    ...rr(96, 670, 1080, 856, 26, "rgba(17,17,22,0.90)", "rgba(255,255,255,0.14)", 2),
    ...txt("O cliente pede da mesa, acompanha a conta ao vivo", { x: 130, y: 704, size: 32, font: FONT_BOLD, color: "#F4F4F5", shadow: false }),
    ...txt("e chama o caixa sem fila.", { x: 130, y: 748, size: 32, font: FONT_REG, color: "#A1A1AA", shadow: false }),
    ...txt("✓ Pedidos   ✓ Cozinha   ✓ Caixa   ✓ Reservas", { x: 130, y: 798, size: 25, font: FONT_MONO, color: "#FB923C", shadow: false }),
    `PNG32:${s4}`,
  ]);
  files.push(s4);

  // Scene 5: Final CTA End-Card (1920x1080)
  const s5 = path.join(dir, "s5.png");
  run("convert", [
    "-size", "1920x1080", "xc:none",
    // Brand Header centered
    ...rr(640, 110, 720, 190, 22, "#F97316"),
    ...txt("M", { x: 657, y: 117, size: 52, font: FONT_BOLD, color: "#09090B", shadow: false }),
    ...txt("MaisQueCardapio", { x: 744, y: 116, size: 64, font: FONT_BOLD, color: "#FFFFFF" }),
    ...txt("Comece grátis hoje e pare de pagar comissão por pedido.", { x: 0, y: 214, size: 36, font: FONT_REG, color: "#D4D4D8", gravity: "North" }),

    // Two side-by-side plan cards
    ...rr(160, 320, 930, 620, 30, "rgba(20,20,25,0.92)", "rgba(255,255,255,0.14)", 2),
    ...txt("PLANO GRATUITO", { x: 204, y: 362, size: 24, font: FONT_MONO, color: "#A1A1AA", shadow: false }),
    ...txt("R$ 0/mês", { x: 204, y: 404, size: 60, font: FONT_BOLD, color: "#FFFFFF", shadow: false }),
    ...txt("Delivery por bairro, retirada no balcão,", { x: 204, y: 492, size: 28, font: FONT_BOLD, color: "#F4F4F5", shadow: false }),
    ...txt("PIX, InfinitePay e WhatsApp Automático.", { x: 204, y: 534, size: 28, font: FONT_REG, color: "#A1A1AA", shadow: false }),

    ...rr(990, 320, 1760, 620, 30, "rgba(28,18,10,0.96)", "#F97316", 4),
    ...txt("PLANO PREMIUM • COMPLETO", { x: 1034, y: 362, size: 24, font: FONT_MONO, color: "#FB923C", shadow: false }),
    ...txt("R$ 49,90/mês", { x: 1034, y: 404, size: 60, font: FONT_BOLD, color: "#FB923C", shadow: false }),
    ...txt("Até 100 produtos + Mesas QR Code,", { x: 1034, y: 492, size: 28, font: FONT_BOLD, color: "#FFFFFF", shadow: false }),
    ...txt("Comandas, Cupom 80mm e Reservas.", { x: 1034, y: 534, size: 28, font: FONT_REG, color: "#FED7AA", shadow: false }),

    // Big Orange CTA Pill
    ...rr(360, 700, 1560, 868, 32, "#F97316"),
    ...txt("CRIE SUA LOJA GRÁTIS AGORA", { x: 0, y: 724, size: 24, font: FONT_MONO, color: "#271003", gravity: "North", shadow: false }),
    ...txt("maisquecardapio.to-ligado.com", { x: 0, y: 766, size: 54, font: FONT_MONO, color: "#09090B", gravity: "North", shadow: false }),

    ...txt("0% de comissão  •  Sem fidelidade  •  Desenvolvido por To-Ligado.com", { x: 0, y: 932, size: 26, font: FONT_BOLD, color: "#A1A1AA", gravity: "North" }),
    `PNG32:${s5}`,
  ]);
  files.push(s5);

  return files;
}

// ============================================================================
// 4. RENDER ANIMATED SCENES + XFADE + AUDIO WITH FFMPEG
// ============================================================================
function renderVideo({ isVertical, overlays, musicWav, outputPath, posterPath }) {
  const w = isVertical ? 1080 : 1920;
  const h = isVertical ? 1920 : 1080;
  const fps = 30;
  const sceneDur = 6.0;
  const frames = Math.round(sceneDur * fps);
  const tag = isVertical ? "v" : "h";

  const scrimMain = path.join(TMP_DIR, `scrim_${tag}.png`);
  const scrimEnd = path.join(TMP_DIR, `scrim_end_${tag}.png`);
  const brandBar = path.join(TMP_DIR, `brand_${tag}.png`);
  createScrim(scrimMain, w, h, "bottom");
  createScrim(scrimEnd, w, h, "full-dark");
  createBrandBar(brandBar, isVertical);

  const sceneConfigs = [
    {
      img: IMAGES.feast,
      scrim: scrimMain,
      ov: overlays[0],
      showBrand: true,
      // Smooth zoom in
      zp: `z='1.0+0.12*on/${frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'`,
    },
    {
      img: IMAGES.mobile,
      scrim: scrimMain,
      ov: overlays[1],
      showBrand: true,
      // Smooth zoom in + subtle pan right
      zp: `z='1.04+0.10*on/${frames}':x='(iw-iw/zoom)*(0.35+0.25*on/${frames})':y='ih/2-(ih/zoom/2)'`,
    },
    {
      img: IMAGES.counter,
      scrim: scrimMain,
      ov: overlays[2],
      showBrand: true,
      // Smooth zoom out
      zp: `z='1.14-0.11*on/${frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'`,
    },
    {
      img: IMAGES.table,
      scrim: scrimMain,
      ov: overlays[3],
      showBrand: true,
      // Smooth zoom in + subtle pan left
      zp: `z='1.02+0.11*on/${frames}':x='(iw-iw/zoom)*(0.65-0.25*on/${frames})':y='ih/2-(ih/zoom/2)'`,
    },
    {
      img: IMAGES.kitchen,
      scrim: scrimEnd,
      ov: overlays[4],
      showBrand: false,
      // Gentle cinematic drift on dark backdrop
      zp: `z='1.04+0.07*on/${frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'`,
    },
  ];

  const sceneClips = [];
  for (let idx = 0; idx < sceneConfigs.length; idx++) {
    const sc = sceneConfigs[idx];
    const clipOut = path.join(TMP_DIR, `scene_${tag}_${idx + 1}.mp4`);
    // Pre-scale background cleanly to exact aspect ratio (1.5x headroom for ultra-smooth Ken Burns)
    const preW = Math.round(w * 1.4);
    const preH = Math.round(h * 1.4);

    const inputs = [
      "-loop", "1", "-t", String(sceneDur), "-i", sc.img,
      "-loop", "1", "-t", String(sceneDur), "-i", sc.scrim,
      "-loop", "1", "-t", String(sceneDur), "-i", sc.ov,
    ];
    if (sc.showBrand) {
      inputs.push("-loop", "1", "-t", String(sceneDur), "-i", brandBar);
    }

    // Animated overlay: fades in 0.15s..0.55s and glides upward 42px -> 0px smoothly
    const filterParts = [
      `[0:v]scale=${preW}:${preH}:force_original_aspect_ratio=increase:flags=lanczos,crop=${preW}:${preH},zoompan=${sc.zp}:d=${frames}:s=${w}x${h}:fps=${fps},setsar=1,format=rgba[bg]`,
      `[bg][1:v]overlay=0:0:shortest=1[scrimmed]`,
      `[2:v]format=rgba,fade=t=in:st=0.18:d=0.45:alpha=1[ovfade]`,
      `[scrimmed][ovfade]overlay=x=0:y='if(lt(t,0.18),44,if(lt(t,0.68),44*(1-(t-0.18)/0.50)*(1-(t-0.18)/0.50),0))':shortest=1[withov]`,
    ];

    let finalLabel = "withov";
    if (sc.showBrand) {
      filterParts.push(`[withov][3:v]overlay=0:0:shortest=1[withbrand]`);
      finalLabel = "withbrand";
    }
    filterParts.push(`[${finalLabel}]format=yuv420p[vout]`);

    console.log(`  Rendering ${tag.toUpperCase()} scene ${idx + 1}/5...`);
    run("ffmpeg", [
      "-y",
      ...inputs,
      "-filter_complex", filterParts.join(";"),
      "-map", "[vout]",
      "-t", String(sceneDur),
      "-r", String(fps),
      "-c:v", "libx264",
      "-preset", "fast",
      "-crf", "18",
      "-pix_fmt", "yuv420p",
      clipOut,
    ]);
    sceneClips.push(clipOut);

    // Save a visual inspection frame at t=2.8s for each scene
    const inspectPath = path.join(TMP_DIR, `inspect_${tag}_s${idx + 1}.jpg`);
    run("ffmpeg", ["-y", "-ss", "2.8", "-i", clipOut, "-frames:v", "1", "-q:v", "3", inspectPath]);
    if (idx === 0) {
      fs.copyFileSync(inspectPath, posterPath);
    }
  }

  // Chain all 5 scenes with smooth 0.5s xfade transitions + mux commercial audio track
  console.log(`  Assembling final ${tag.toUpperCase()} MP4 with transitions & soundtrack...`);
  const xfadeFilter = [
    `[0:v][1:v]xfade=transition=smoothleft:duration=0.5:offset=5.5[v01]`,
    `[v01][2:v]xfade=transition=smoothleft:duration=0.5:offset=11.0[v02]`,
    `[v02][3:v]xfade=transition=smoothleft:duration=0.5:offset=16.5[v03]`,
    `[v03][4:v]xfade=transition=fade:duration=0.5:offset=22.0,fade=t=out:st=27.3:d=0.7[vfinal]`,
  ].join(";");

  run("ffmpeg", [
    "-y",
    "-i", sceneClips[0],
    "-i", sceneClips[1],
    "-i", sceneClips[2],
    "-i", sceneClips[3],
    "-i", sceneClips[4],
    "-i", musicWav,
    "-filter_complex", xfadeFilter,
    "-map", "[vfinal]",
    "-map", "5:a",
    "-c:v", "libx264",
    "-profile:v", "high",
    "-level", "4.1",
    "-preset", "medium",
    "-crf", "19",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "192k",
    "-ar", "44100",
    "-movflags", "+faststart",
    "-shortest",
    outputPath,
  ]);
}

async function main() {
  console.log("1/4 Generating upbeat commercial soundtrack...");
  const musicWav = path.join(TMP_DIR, "promo_music.wav");
  generateMusicWav(musicWav, 28.0);

  console.log("2/4 Creating vector-crisp motion graphic overlays (9:16 & 16:9)...");
  const vOverlays = createVerticalOverlays();
  const hOverlays = createHorizontalOverlays();

  console.log("3/4 Rendering Vertical 9:16 Reels/TikTok/WhatsApp video (1080x1920)...");
  renderVideo({
    isVertical: true,
    overlays: vOverlays,
    musicWav,
    outputPath: path.join(OUT_DIR, "maisquecardapio-reels-9x16.mp4"),
    posterPath: path.join(OUT_DIR, "poster-9x16.jpg"),
  });

  console.log("4/4 Rendering Horizontal 16:9 YouTube/Site video (1920x1080)...");
  renderVideo({
    isVertical: false,
    overlays: hOverlays,
    musicWav,
    outputPath: path.join(OUT_DIR, "maisquecardapio-horizontal-16x9.mp4"),
    posterPath: path.join(OUT_DIR, "poster-16x9.jpg"),
  });

  console.log("DONE! Output files:");
  for (const f of fs.readdirSync(OUT_DIR)) {
    const st = fs.statSync(path.join(OUT_DIR, f));
    console.log(`  public/promo/${f} (${(st.size / (1024 * 1024)).toFixed(2)} MB)`);
  }
}

main().catch((err) => {
  console.error(err?.stderr?.toString?.() || err);
  process.exit(1);
});
