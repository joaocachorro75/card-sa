import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const TMP_DIR = "/tmp/maisquecardapio-presenter";
const OUT_DIR = path.join(ROOT, "public", "promo");
fs.mkdirSync(TMP_DIR, { recursive: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

const FONT_BOLD = "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf";
const FONT_REG = "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf";
const FONT_MONO = "/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-ExtraBold.ttf";

const IMAGES = {
  vHook: path.join(ROOT, "src/assets/images/presenter_hook_1795696249456.jpg"),
  vMenu: path.join(ROOT, "src/assets/images/presenter_menu_1795696283101.jpg"),
  vBroll: path.join(ROOT, "src/assets/images/promo_kitchen_counter_1795694417029.jpg"),
  vTable: path.join(ROOT, "src/assets/images/presenter_table_qr_1795696283057.jpg"),
  vCta: path.join(ROOT, "src/assets/images/presenter_cta_1795696287628.jpg"),
  hHook: path.join(ROOT, "src/assets/images/presenter_wide_hook_1795696286935.jpg"),
  hBroll: path.join(ROOT, "src/assets/images/promo_kitchen_counter_1795694417029.jpg"),
  hSalon: path.join(ROOT, "src/assets/images/presenter_wide_salon_1795696298224.jpg"),
  hCta: path.join(ROOT, "src/assets/images/presenter_wide_cta_1795696352865.jpg"),
};

function run(cmd, args) {
  execFileSync(cmd, args, { stdio: "pipe" });
}

// ============================================================================
// 1. ENERGETIC POP-COMMERCIAL SOUNDTRACK (122 BPM G Major, 28s Stereo WAV)
// ============================================================================
function generateUpbeatMusicWav(filePath, durationSec = 28.0) {
  const sr = 44100;
  const totalSamples = Math.floor(sr * durationSec);
  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);

  const bpm = 122;
  const beatDur = 60 / bpm;
  const stepDur = beatDur / 4;

  // Bright, uplifting progression: Gmaj7 -> Dmaj -> Em7 -> Cadd9
  const chords = [
    [196.0, 246.94, 293.66, 369.99],
    [146.83, 220.0, 293.66, 369.99],
    [164.81, 246.94, 293.66, 392.0],
    [130.81, 196.0, 293.66, 329.63],
  ];
  const bassNotes = [98.0, 73.42, 82.41, 65.41];
  const melodyPattern = [2, 3, 2, 1, 3, 2, 1, 0];

  let seed = 4242;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed / 2147483647) * 2 - 1;
  };

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

    // Warm upbeat synth chords with rhythmic sidechain
    const duck = 0.56 + 0.44 * Math.min(1, beatFrac * 2.8);
    let padL = 0;
    let padR = 0;
    for (let c = 0; c < chord.length; c++) {
      const f = chord[c];
      const sL = Math.sin(2 * Math.PI * (f * 0.9992) * t) + 0.25 * Math.sin(2 * Math.PI * (f * 2) * t);
      const sR = Math.sin(2 * Math.PI * (f * 1.0008) * t) + 0.25 * Math.sin(2 * Math.PI * (f * 2) * t);
      padL += sL;
      padR += sR;
    }
    padL *= 0.048 * duck;
    padR *= 0.048 * duck;

    // Bouncy bassline on 8th-note groove
    const eighthFrac = (t / (beatDur / 2)) % 1;
    const bassEnv = Math.exp(-eighthFrac * 4.5);
    const bass =
      (Math.sin(2 * Math.PI * bassFreq * t) + 0.28 * Math.sin(2 * Math.PI * bassFreq * 2 * t)) *
      0.165 *
      (0.3 + 0.7 * bassEnv);

    // Sparkling marimba/bell hook
    let bellL = 0;
    let bellR = 0;
    if (t > 0.5 && t < 26.5) {
      const eighthIdx = Math.floor(t / (beatDur / 2));
      const f = chord[melodyPattern[eighthIdx % melodyPattern.length]] * 2;
      const bEnv = Math.exp(-eighthFrac * 8.5);
      const tone =
        (Math.sin(2 * Math.PI * f * t) + 0.35 * Math.sin(2 * Math.PI * f * 3 * t) * Math.exp(-eighthFrac * 18)) *
        bEnv *
        0.055;
      const pan = eighthIdx % 2 === 0 ? 0.65 : 0.35;
      bellL = tone * pan;
      bellR = tone * (1 - pan);
    }

    // Punchy pop kick
    let kick = 0;
    if (t < 26.8 && beatFrac < 0.25) {
      const kTime = beatFrac * beatDur;
      const kFreq = 155 * Math.exp(-kTime * 30) + 48;
      kick = Math.sin(2 * Math.PI * kFreq * kTime) * Math.exp(-kTime * 15) * 0.32;
    }

    // Finger-snap / crisp pop clap on 2 & 4
    let clap = 0;
    const isBackbeat = (beatInBar >= 1 && beatInBar < 1.3) || (beatInBar >= 3 && beatInBar < 3.3);
    if (t > 1.2 && t < 26.6 && isBackbeat) {
      const cTime = (beatInBar >= 3 ? beatInBar - 3 : beatInBar - 1) * beatDur;
      clap = (rand() * 0.75 + Math.sin(2 * Math.PI * 1900 * cTime) * 0.25) * Math.exp(-cTime * 28) * 0.12;
    }

    // Light crisp hi-hat offbeat
    let hat = 0;
    if (t > 0.8 && t < 26.6 && stepIdx % 2 === 1 && stepFrac < 0.38) {
      hat = rand() * Math.exp(-(stepFrac * stepDur) * 60) * 0.042;
    }

    // Soft transition riser
    let riser = 0;
    for (const tr of transitionTimes) {
      const dt = tr - t;
      if (dt > 0 && dt < 0.42) {
        const w = 1 - dt / 0.42;
        riser += rand() * w * w * 0.05;
      }
    }

    let master = 1.0;
    if (t < 0.35) master = t / 0.35;
    if (t > durationSec - 1.3) master = Math.max(0, (durationSec - t) / 1.3);

    left[i] = Math.tanh((padL + bass + bellL + kick + clap + hat * 0.85 + riser) * 1.15) * master * 0.72;
    right[i] = Math.tanh((padR + bass + bellR + kick + clap + hat * 1.15 + riser) * 1.15) * master * 0.72;
  }

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

function txt(text, { x = 0, y = 0, size = 48, font = FONT_BOLD, color = "#FFFFFF", gravity = "NorthWest", shadow = true }) {
  const signX = x >= 0 ? `+${x}` : `${x}`;
  const signY = y >= 0 ? `+${y}` : `${y}`;
  const cmds = ["-gravity", gravity, "-font", font, "-pointsize", String(size), "-stroke", "none"];
  if (shadow) {
    const sX = x >= 0 ? `+${x}` : `${x}`;
    const sY = y + 3 >= 0 ? `+${y + 3}` : `${y + 3}`;
    cmds.push("-fill", "rgba(0,0,0,0.62)", "-annotate", `${sX}${sY}`, text);
  }
  cmds.push("-fill", color, "-annotate", `${signX}${signY}`, text);
  return cmds;
}

function createScrim(outPath, w, h) {
  if (w < h) {
    // Keep presenter's face & upper body completely clear and radiant; rich dark gradient only on bottom half & very top
    run("convert", [
      "-size", `${w}x${h}`, "xc:none",
      "(", "-size", `${w}x360`, "gradient:rgba(9,9,11,0.82)-rgba(9,9,11,0.0)", ")", "-gravity", "North", "-composite",
      "(", "-size", `${w}x980`, "gradient:rgba(9,9,11,0.0)-rgba(9,9,11,0.97)", ")", "-gravity", "South", "-composite",
      `PNG32:${outPath}`,
    ]);
  } else {
    // Keep presenter on the right third bright & radiant; smooth dark scrim over left 62%
    run("convert", [
      "-size", `${w}x${h}`, "xc:none",
      "(", "-size", `${h}x1260`, "gradient:rgba(9,9,11,0.95)-rgba(9,9,11,0.0)", "-rotate", "270", ")", "-gravity", "West", "-composite",
      "(", "-size", `${w}x260`, "gradient:rgba(9,9,11,0.0)-rgba(9,9,11,0.72)", ")", "-gravity", "South", "-composite",
      "(", "-size", `${w}x180`, "gradient:rgba(9,9,11,0.55)-rgba(9,9,11,0.0)", ")", "-gravity", "North", "-composite",
      `PNG32:${outPath}`,
    ]);
  }
}

function createBrandBar(outPath, isVertical) {
  if (isVertical) {
    run("convert", [
      "-size", "1080x1920", "xc:none",
      ...rr(72, 132, 560, 214, 22, "rgba(15,15,19,0.82)", "rgba(255,255,255,0.14)", 2),
      ...rr(90, 148, 140, 198, 14, "#F97316"),
      ...txt("M", { x: 102, y: 149, size: 35, font: FONT_BOLD, color: "#09090B", shadow: false }),
      ...txt("MaisQueCardapio", { x: 160, y: 150, size: 31, font: FONT_BOLD, color: "#FFFFFF", shadow: false }),
      ...txt("CARDÁPIO DIGITAL SEM COMISSÃO", { x: 160, y: 185, size: 13, font: FONT_MONO, color: "#FB923C", shadow: false }),
      ...rr(668, 144, 1008, 202, 18, "rgba(249,115,22,0.18)", "rgba(249,115,22,0.60)", 2),
      ...txt("0% DE COMISSÃO", { x: 708, y: 160, size: 22, font: FONT_MONO, color: "#FED7AA", shadow: false }),
      `PNG32:${outPath}`,
    ]);
  } else {
    run("convert", [
      "-size", "1920x1080", "xc:none",
      ...rr(88, 56, 560, 138, 22, "rgba(15,15,19,0.84)", "rgba(255,255,255,0.14)", 2),
      ...rr(106, 72, 156, 122, 14, "#F97316"),
      ...txt("M", { x: 118, y: 73, size: 35, font: FONT_BOLD, color: "#09090B", shadow: false }),
      ...txt("MaisQueCardapio", { x: 176, y: 74, size: 31, font: FONT_BOLD, color: "#FFFFFF", shadow: false }),
      ...txt("CARDÁPIO DIGITAL SEM COMISSÃO", { x: 176, y: 109, size: 13, font: FONT_MONO, color: "#FB923C", shadow: false }),
      ...rr(1425, 68, 1832, 126, 18, "rgba(15,15,19,0.82)", "rgba(249,115,22,0.58)", 2),
      ...txt("maisquecardapio.to-ligado.com", { x: 1452, y: 86, size: 20, font: FONT_MONO, color: "#FDBA74", shadow: false }),
      `PNG32:${outPath}`,
    ]);
  }
}

// ============================================================================
// 2. VERTICAL 9:16 PRESENTER OVERLAYS (face clear y=300..960, copy y=1060..1620)
// ============================================================================
function createVerticalOverlays() {
  const dir = path.join(TMP_DIR, "ov_v");
  fs.mkdirSync(dir, { recursive: true });
  const files = [];

  // Scene 1: Direct Hook
  const s1 = path.join(dir, "s1.png");
  run("convert", [
    "-size", "1080x1920", "xc:none",
    ...rr(72, 1086, 650, 1142, 16, "rgba(15,15,20,0.88)", "#F97316", 2),
    ...txt("TEM DELIVERY OU RESTAURANTE?", { x: 100, y: 1100, size: 24, font: FONT_MONO, color: "#FB923C", shadow: false }),
    ...txt("Você ainda deixa", { x: 72, y: 1168, size: 74, font: FONT_BOLD, color: "#FFFFFF" }),
    ...txt("até 27% do lucro", { x: 72, y: 1256, size: 74, font: FONT_BOLD, color: "#F97316" }),
    ...txt("em apps de entrega?", { x: 72, y: 1344, size: 74, font: FONT_BOLD, color: "#FFFFFF" }),
    ...rr(72, 1456, 1008, 1592, 24, "rgba(17,17,22,0.92)", "rgba(255,255,255,0.14)", 2),
    ...rr(94, 1480, 102, 1568, 4, "#F97316"),
    ...txt("Quem fatura R$ 20 mil/mês perde até", { x: 124, y: 1478, size: 31, font: FONT_REG, color: "#D4D4D8", shadow: false }),
    ...txt("R$ 5.400 todo mês só em comissão!", { x: 124, y: 1522, size: 33, font: FONT_BOLD, color: "#FDBA74", shadow: false }),
    `PNG32:${s1}`,
  ]);
  files.push(s1);

  // Scene 2: Presenter Showing Menu on Phone
  const s2 = path.join(dir, "s2.png");
  run("convert", [
    "-size", "1080x1920", "xc:none",
    ...rr(72, 1086, 540, 1152, 18, "#F97316"),
    ...txt("CONHEÇA O MAISQUECARDAPIO", { x: 100, y: 1106, size: 24, font: FONT_MONO, color: "#09090B", shadow: false }),
    ...txt("Seu cardápio próprio", { x: 72, y: 1180, size: 70, font: FONT_BOLD, color: "#FFFFFF" }),
    ...txt("com 0% de comissão", { x: 72, y: 1264, size: 70, font: FONT_BOLD, color: "#F97316" }),
    ...txt("no ar em 1 minuto!", { x: 72, y: 1348, size: 70, font: FONT_BOLD, color: "#FFFFFF" }),
    ...rr(72, 1458, 1008, 1590, 24, "rgba(17,17,22,0.92)", "rgba(255,255,255,0.14)", 2),
    ...txt("✓ Taxa por bairro   ✓ Delivery e Balcão", { x: 108, y: 1486, size: 29, font: FONT_BOLD, color: "#FFFFFF", shadow: false }),
    ...txt("✓ Link exclusivo    ✓ Base de clientes 100% sua", { x: 108, y: 1532, size: 28, font: FONT_REG, color: "#FDBA74", shadow: false }),
    `PNG32:${s2}`,
  ]);
  files.push(s2);

  // Scene 3: B-Roll Restaurant Automation (WhatsApp + PIX/InfinitePay)
  const s3 = path.join(dir, "s3.png");
  run("convert", [
    "-size", "1080x1920", "xc:none",
    ...rr(72, 980, 610, 1036, 16, "rgba(12,26,21,0.90)", "#10B981", 2),
    ...txt("CHEGA DE ANOTAR PEDIDO NA MÃO", { x: 98, y: 994, size: 23, font: FONT_MONO, color: "#34D399", shadow: false }),
    ...txt("O cliente pede, paga", { x: 72, y: 1062, size: 70, font: FONT_BOLD, color: "#FFFFFF" }),
    ...txt("no PIX ou InfinitePay", { x: 72, y: 1146, size: 70, font: FONT_BOLD, color: "#34D399" }),
    ...txt("e recebe no WhatsApp.", { x: 72, y: 1230, size: 70, font: FONT_BOLD, color: "#FFFFFF" }),
    ...rr(72, 1344, 1008, 1584, 28, "rgba(10,24,19,0.95)", "#10B981", 3),
    ...rr(104, 1374, 160, 1430, 16, "#10B981"),
    ...txt("W", { x: 116, y: 1380, size: 34, font: FONT_BOLD, color: "#052E16", shadow: false }),
    ...txt("WhatsApp Automático via QR Code", { x: 180, y: 1384, size: 26, font: FONT_BOLD, color: "#6EE7B7", shadow: false }),
    ...txt("Pedido #104 confirmado! Pagamento PIX ok.", { x: 104, y: 1452, size: 32, font: FONT_BOLD, color: "#FFFFFF", shadow: false }),
    ...txt("Seu pedido já entrou na cozinha (30–40 min).", { x: 104, y: 1500, size: 28, font: FONT_REG, color: "#D1FAE5", shadow: false }),
    `PNG32:${s3}`,
  ]);
  files.push(s3);

  // Scene 4: Presenter at Table QR Code
  const s4 = path.join(dir, "s4.png");
  run("convert", [
    "-size", "1080x1920", "xc:none",
    ...rr(72, 1110, 620, 1166, 16, "rgba(15,15,20,0.88)", "#F97316", 2),
    ...txt("ATENDIMENTO MODERNO NO SALÃO", { x: 100, y: 1124, size: 23, font: FONT_MONO, color: "#FB923C", shadow: false }),
    ...txt("QR Code na mesa,", { x: 72, y: 1194, size: 72, font: FONT_BOLD, color: "#FFFFFF" }),
    ...txt("comanda aberta e", { x: 72, y: 1280, size: 72, font: FONT_BOLD, color: "#F97316" }),
    ...txt("cupom 80mm na hora.", { x: 72, y: 1366, size: 72, font: FONT_BOLD, color: "#FFFFFF" }),
    ...rr(72, 1474, 1008, 1602, 24, "rgba(17,17,22,0.92)", "rgba(255,255,255,0.14)", 2),
    ...txt("O cliente pede sozinho direto da mesa e chama", { x: 106, y: 1500, size: 30, font: FONT_BOLD, color: "#FFFFFF", shadow: false }),
    ...txt("a conta sem fila — mais giro e mais vendas!", { x: 106, y: 1544, size: 30, font: FONT_REG, color: "#FDBA74", shadow: false }),
    `PNG32:${s4}`,
  ]);
  files.push(s4);

  // Scene 5: Presenter Open-Hand CTA (Face stays bright above y=940, Offer + CTA y=1020..1620)
  const s5 = path.join(dir, "s5.png");
  run("convert", [
    "-size", "1080x1920", "xc:none",
    ...rr(72, 1020, 1008, 1612, 34, "rgba(12,12,16,0.93)", "rgba(249,115,22,0.65)", 3),
    ...txt("COMECE SEM PAGAR NADA HOJE", { x: 0, y: 1054, size: 24, font: FONT_MONO, color: "#FB923C", gravity: "North", shadow: false }),
    ...txt("Crie seu cardápio grátis!", { x: 0, y: 1094, size: 64, font: FONT_BOLD, color: "#FFFFFF", gravity: "North" }),
    // Two compact side-by-side plan boxes inside the card
    ...rr(108, 1190, 526, 1344, 22, "rgba(26,26,32,0.95)", "rgba(255,255,255,0.14)", 2),
    ...txt("GRATUITO", { x: 136, y: 1214, size: 21, font: FONT_MONO, color: "#A1A1AA", shadow: false }),
    ...txt("R$ 0/mês", { x: 136, y: 1246, size: 42, font: FONT_BOLD, color: "#FFFFFF", shadow: false }),
    ...txt("Delivery + WhatsApp", { x: 136, y: 1300, size: 22, font: FONT_REG, color: "#D4D4D8", shadow: false }),

    ...rr(554, 1190, 972, 1344, 22, "rgba(38,22,10,0.96)", "#F97316", 3),
    ...txt("PREMIUM COMPLETO", { x: 582, y: 1214, size: 21, font: FONT_MONO, color: "#FB923C", shadow: false }),
    ...txt("R$ 49,90", { x: 582, y: 1246, size: 42, font: FONT_BOLD, color: "#FB923C", shadow: false }),
    ...txt("Mesas QR + Comandas", { x: 582, y: 1300, size: 22, font: FONT_REG, color: "#FED7AA", shadow: false }),

    // Giant Orange CTA Button with domain
    ...rr(108, 1378, 972, 1528, 26, "#F97316"),
    ...txt("ACESSE AGORA E TESTE AO VIVO", { x: 0, y: 1400, size: 22, font: FONT_MONO, color: "#271003", gravity: "North", shadow: false }),
    ...txt("maisquecardapio.to-ligado.com", { x: 0, y: 1438, size: 43, font: FONT_MONO, color: "#09090B", gravity: "North", shadow: false }),

    ...txt("0% comissão • Sem fidelidade • To-Ligado.com", { x: 0, y: 1554, size: 24, font: FONT_BOLD, color: "#A1A1AA", gravity: "North", shadow: false }),
    `PNG32:${s5}`,
  ]);
  files.push(s5);

  return files;
}

// ============================================================================
// 3. HORIZONTAL 16:9 PRESENTER OVERLAYS (copy left x=88..1120, presenter right!)
// ============================================================================
function createHorizontalOverlays() {
  const dir = path.join(TMP_DIR, "ov_h");
  fs.mkdirSync(dir, { recursive: true });
  const files = [];

  // Scene 1
  const s1 = path.join(dir, "s1.png");
  run("convert", [
    "-size", "1920x1080", "xc:none",
    ...rr(88, 240, 680, 298, 16, "rgba(15,15,20,0.88)", "#F97316", 2),
    ...txt("TEM DELIVERY OU RESTAURANTE?", { x: 118, y: 254, size: 25, font: FONT_MONO, color: "#FB923C", shadow: false }),
    ...txt("Você ainda deixa", { x: 88, y: 332, size: 84, font: FONT_BOLD, color: "#FFFFFF" }),
    ...txt("até 27% do lucro", { x: 88, y: 432, size: 84, font: FONT_BOLD, color: "#F97316" }),
    ...txt("em apps de entrega?", { x: 88, y: 532, size: 84, font: FONT_BOLD, color: "#FFFFFF" }),
    ...rr(88, 676, 1020, 822, 24, "rgba(17,17,22,0.92)", "rgba(255,255,255,0.14)", 2),
    ...rr(112, 702, 120, 796, 4, "#F97316"),
    ...txt("Quem fatura R$ 20 mil/mês perde até", { x: 144, y: 702, size: 32, font: FONT_REG, color: "#D4D4D8", shadow: false }),
    ...txt("R$ 5.400 todo mês só em comissão!", { x: 144, y: 748, size: 35, font: FONT_BOLD, color: "#FDBA74", shadow: false }),
    `PNG32:${s1}`,
  ]);
  files.push(s1);

  // Scene 2
  const s2 = path.join(dir, "s2.png");
  run("convert", [
    "-size", "1920x1080", "xc:none",
    ...rr(88, 232, 590, 300, 18, "#F97316"),
    ...txt("CONHEÇA O MAISQUECARDAPIO", { x: 118, y: 252, size: 26, font: FONT_MONO, color: "#09090B", shadow: false }),
    ...txt("Seu cardápio próprio", { x: 88, y: 332, size: 80, font: FONT_BOLD, color: "#FFFFFF" }),
    ...txt("com 0% de comissão", { x: 88, y: 428, size: 80, font: FONT_BOLD, color: "#F97316" }),
    ...txt("no ar em 1 minuto!", { x: 88, y: 524, size: 80, font: FONT_BOLD, color: "#FFFFFF" }),
    ...rr(88, 668, 1030, 816, 24, "rgba(17,17,22,0.92)", "rgba(255,255,255,0.14)", 2),
    ...txt("✓ Taxa por bairro   ✓ Delivery e Balcão", { x: 124, y: 700, size: 32, font: FONT_BOLD, color: "#FFFFFF", shadow: false }),
    ...txt("✓ Link exclusivo    ✓ Clientes 100% seus", { x: 124, y: 750, size: 30, font: FONT_REG, color: "#FDBA74", shadow: false }),
    `PNG32:${s2}`,
  ]);
  files.push(s2);

  // Scene 3: B-roll automation
  const s3 = path.join(dir, "s3.png");
  run("convert", [
    "-size", "1920x1080", "xc:none",
    ...rr(88, 214, 650, 272, 16, "rgba(12,26,21,0.92)", "#10B981", 2),
    ...txt("CHEGA DE ANOTAR PEDIDO NA MÃO", { x: 116, y: 228, size: 24, font: FONT_MONO, color: "#34D399", shadow: false }),
    ...txt("O cliente pede, paga", { x: 88, y: 304, size: 78, font: FONT_BOLD, color: "#FFFFFF" }),
    ...txt("no PIX ou InfinitePay", { x: 88, y: 398, size: 78, font: FONT_BOLD, color: "#34D399" }),
    ...txt("e recebe no WhatsApp.", { x: 88, y: 492, size: 78, font: FONT_BOLD, color: "#FFFFFF" }),
    ...rr(88, 636, 1060, 872, 28, "rgba(10,24,19,0.95)", "#10B981", 3),
    ...rr(120, 666, 176, 722, 16, "#10B981"),
    ...txt("W", { x: 132, y: 672, size: 34, font: FONT_BOLD, color: "#052E16", shadow: false }),
    ...txt("WhatsApp Automático via QR Code", { x: 198, y: 676, size: 26, font: FONT_BOLD, color: "#6EE7B7", shadow: false }),
    ...txt("Pedido #104 confirmado! Pagamento PIX recebido.", { x: 120, y: 744, size: 33, font: FONT_BOLD, color: "#FFFFFF", shadow: false }),
    ...txt("Seu pedido já entrou na cozinha — previsão 30–40 min.", { x: 120, y: 792, size: 28, font: FONT_REG, color: "#D1FAE5", shadow: false }),
    `PNG32:${s3}`,
  ]);
  files.push(s3);

  // Scene 4: Presenter at Counter with QR Code & POS
  const s4 = path.join(dir, "s4.png");
  run("convert", [
    "-size", "1920x1080", "xc:none",
    ...rr(88, 224, 650, 282, 16, "rgba(15,15,20,0.88)", "#F97316", 2),
    ...txt("ATENDIMENTO MODERNO NO SALÃO", { x: 116, y: 238, size: 24, font: FONT_MONO, color: "#FB923C", shadow: false }),
    ...txt("QR Code na mesa,", { x: 88, y: 316, size: 82, font: FONT_BOLD, color: "#FFFFFF" }),
    ...txt("comanda aberta e", { x: 88, y: 414, size: 82, font: FONT_BOLD, color: "#F97316" }),
    ...txt("cupom 80mm na hora.", { x: 88, y: 512, size: 82, font: FONT_BOLD, color: "#FFFFFF" }),
    ...rr(88, 656, 1020, 816, 24, "rgba(17,17,22,0.92)", "rgba(255,255,255,0.14)", 2),
    ...txt("Seus clientes pedem direto da mesa e acompanham", { x: 124, y: 690, size: 31, font: FONT_BOLD, color: "#FFFFFF", shadow: false }),
    ...txt("a conta ao vivo — mais giro, zero fila!", { x: 124, y: 736, size: 31, font: FONT_REG, color: "#FDBA74", shadow: false }),
    `PNG32:${s4}`,
  ]);
  files.push(s4);

  // Scene 5: Presenter on Right Gesturing Open-Hand Directly Toward Left CTA Card!
  const s5 = path.join(dir, "s5.png");
  run("convert", [
    "-size", "1920x1080", "xc:none",
    ...rr(88, 178, 1060, 910, 34, "rgba(12,12,16,0.92)", "rgba(249,115,22,0.68)", 3),
    ...txt("COMECE SEM PAGAR NADA HOJE", { x: 136, y: 222, size: 24, font: FONT_MONO, color: "#FB923C", shadow: false }),
    ...txt("Crie seu cardápio", { x: 136, y: 266, size: 76, font: FONT_BOLD, color: "#FFFFFF" }),
    ...txt("grátis em 1 minuto!", { x: 136, y: 354, size: 76, font: FONT_BOLD, color: "#F97316" }),

    // Two plan boxes inside left CTA card
    ...rr(136, 474, 560, 650, 22, "rgba(26,26,32,0.96)", "rgba(255,255,255,0.14)", 2),
    ...txt("PLANO GRATUITO", { x: 164, y: 500, size: 21, font: FONT_MONO, color: "#A1A1AA", shadow: false }),
    ...txt("R$ 0/mês", { x: 164, y: 534, size: 46, font: FONT_BOLD, color: "#FFFFFF", shadow: false }),
    ...txt("Delivery + WhatsApp", { x: 164, y: 598, size: 24, font: FONT_REG, color: "#D4D4D8", shadow: false }),

    ...rr(584, 474, 1012, 650, 22, "rgba(38,22,10,0.96)", "#F97316", 3),
    ...txt("PREMIUM COMPLETO", { x: 612, y: 500, size: 21, font: FONT_MONO, color: "#FB923C", shadow: false }),
    ...txt("R$ 49,90/mês", { x: 612, y: 534, size: 44, font: FONT_BOLD, color: "#FB923C", shadow: false }),
    ...txt("Mesas QR + Comandas", { x: 612, y: 598, size: 24, font: FONT_REG, color: "#FED7AA", shadow: false }),

    // Bright Orange CTA Pill with exact domain
    ...rr(136, 686, 1012, 836, 26, "#F97316"),
    ...txt("ACESSE AGORA E TESTE A LOJA DEMO", { x: 176, y: 708, size: 22, font: FONT_MONO, color: "#271003", shadow: false }),
    ...txt("maisquecardapio.to-ligado.com", { x: 176, y: 748, size: 44, font: FONT_MONO, color: "#09090B", shadow: false }),

    ...txt("0% comissão  •  Sem fidelidade  •  Desenvolvido por To-Ligado.com", { x: 136, y: 858, size: 23, font: FONT_BOLD, color: "#A1A1AA", shadow: false }),
    `PNG32:${s5}`,
  ]);
  files.push(s5);

  return files;
}

// ============================================================================
// 4. RENDER ANIMATED SCENES WITH SMOOTH KEN BURNS + XFADE + MUSIC
// ============================================================================
function renderVideo({ isVertical, overlays, musicWav, outputPath, posterPath }) {
  const w = isVertical ? 1080 : 1920;
  const h = isVertical ? 1920 : 1080;
  const fps = 30;
  const sceneDur = 6.0;
  const frames = Math.round(sceneDur * fps);
  const tag = isVertical ? "pv" : "ph";

  const scrim = path.join(TMP_DIR, `scrim_${tag}.png`);
  const brandBar = path.join(TMP_DIR, `brand_${tag}.png`);
  createScrim(scrim, w, h);
  createBrandBar(brandBar, isVertical);

  const sceneConfigs = isVertical
    ? [
        { img: IMAGES.vHook, ov: overlays[0], zp: `z='1.0+0.09*on/${frames}':x='iw/2-(iw/zoom/2)':y='ih*0.42-(ih/zoom*0.42)'` },
        { img: IMAGES.vMenu, ov: overlays[1], zp: `z='1.08-0.07*on/${frames}':x='iw/2-(iw/zoom/2)':y='ih*0.42-(ih/zoom*0.42)'` },
        { img: IMAGES.vBroll, ov: overlays[2], zp: `z='1.03+0.10*on/${frames}':x='(iw-iw/zoom)*(0.35+0.25*on/${frames})':y='ih/2-(ih/zoom/2)'` },
        { img: IMAGES.vTable, ov: overlays[3], zp: `z='1.0+0.08*on/${frames}':x='iw/2-(iw/zoom/2)':y='ih*0.44-(ih/zoom*0.44)'` },
        { img: IMAGES.vCta, ov: overlays[4], zp: `z='1.02+0.07*on/${frames}':x='iw/2-(iw/zoom/2)':y='ih*0.36-(ih/zoom*0.36)'` },
      ]
    : [
        { img: IMAGES.hHook, ov: overlays[0], zp: `z='1.0+0.08*on/${frames}':x='iw*0.65-(iw/zoom*0.65)':y='ih*0.42-(ih/zoom*0.42)'` },
        { img: IMAGES.hHook, ov: overlays[1], zp: `z='1.12-0.08*on/${frames}':x='iw*0.72-(iw/zoom*0.72)':y='ih*0.48-(ih/zoom*0.48)'` },
        { img: IMAGES.hBroll, ov: overlays[2], zp: `z='1.03+0.10*on/${frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'` },
        { img: IMAGES.hSalon, ov: overlays[3], zp: `z='1.0+0.08*on/${frames}':x='iw*0.68-(iw/zoom*0.68)':y='ih*0.46-(ih/zoom*0.46)'` },
        { img: IMAGES.hCta, ov: overlays[4], zp: `z='1.02+0.06*on/${frames}':x='iw*0.72-(iw/zoom*0.72)':y='ih*0.42-(ih/zoom*0.42)'` },
      ];

  const sceneClips = [];
  for (let idx = 0; idx < sceneConfigs.length; idx++) {
    const sc = sceneConfigs[idx];
    const clipOut = path.join(TMP_DIR, `scene_${tag}_${idx + 1}.mp4`);
    const preW = Math.round(w * 1.35);
    const preH = Math.round(h * 1.35);

    const filterParts = [
      `[0:v]scale=${preW}:${preH}:force_original_aspect_ratio=increase:flags=lanczos,crop=${preW}:${preH},zoompan=${sc.zp}:d=${frames}:s=${w}x${h}:fps=${fps},setsar=1,format=rgba[bg]`,
      `[bg][1:v]overlay=0:0:shortest=1[scrimmed]`,
      `[2:v]format=rgba,fade=t=in:st=0.18:d=0.42:alpha=1[ovfade]`,
      `[scrimmed][ovfade]overlay=x=0:y='if(lt(t,0.18),40,if(lt(t,0.65),40*(1-(t-0.18)/0.47)*(1-(t-0.18)/0.47),0))':shortest=1[withov]`,
      `[withov][3:v]overlay=0:0:shortest=1,format=yuv420p[vout]`,
    ];

    console.log(`  Rendering ${tag.toUpperCase()} scene ${idx + 1}/5...`);
    run("ffmpeg", [
      "-y",
      "-loop", "1", "-t", String(sceneDur), "-i", sc.img,
      "-loop", "1", "-t", String(sceneDur), "-i", scrim,
      "-loop", "1", "-t", String(sceneDur), "-i", sc.ov,
      "-loop", "1", "-t", String(sceneDur), "-i", brandBar,
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

    const inspectPath = path.join(TMP_DIR, `inspect_${tag}_s${idx + 1}.jpg`);
    run("ffmpeg", ["-y", "-ss", "2.6", "-i", clipOut, "-frames:v", "1", "-q:v", "3", inspectPath]);
    if (idx === 0) {
      fs.copyFileSync(inspectPath, posterPath);
    }
  }

  console.log(`  Assembling final ${tag.toUpperCase()} MP4...`);
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
  console.log("1/4 Generating energetic pop soundtrack (122 BPM)...");
  const musicWav = path.join(TMP_DIR, "presenter_music.wav");
  generateUpbeatMusicWav(musicWav, 28.0);

  console.log("2/4 Creating presenter-framed motion graphics (9:16 & 16:9)...");
  const vOverlays = createVerticalOverlays();
  const hOverlays = createHorizontalOverlays();

  console.log("3/4 Rendering Presenter Vertical 9:16 (1080x1920)...");
  renderVideo({
    isVertical: true,
    overlays: vOverlays,
    musicWav,
    outputPath: path.join(OUT_DIR, "maisquecardapio-apresentadora-9x16.mp4"),
    posterPath: path.join(OUT_DIR, "poster-apresentadora-9x16.jpg"),
  });

  console.log("4/4 Rendering Presenter Horizontal 16:9 (1920x1080)...");
  renderVideo({
    isVertical: false,
    overlays: hOverlays,
    musicWav,
    outputPath: path.join(OUT_DIR, "maisquecardapio-apresentadora-16x9.mp4"),
    posterPath: path.join(OUT_DIR, "poster-apresentadora-16x9.jpg"),
  });

  console.log("DONE Presenter Videos!");
  for (const f of fs.readdirSync(OUT_DIR).filter((n) => n.includes("apresentadora"))) {
    const st = fs.statSync(path.join(OUT_DIR, f));
    console.log(`  public/promo/${f} (${(st.size / (1024 * 1024)).toFixed(2)} MB)`);
  }
}

main().catch((err) => {
  console.error(err?.stderr?.toString?.() || err);
  process.exit(1);
});
