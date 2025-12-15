// ------------------------------
// Neon Pulse City - Star Play Buttons Edition
// - Fix slow playback by forcing rate(1)
// - Add neon star buttons in the sky to choose/play tracks
// Controls:
// - Click stars: select track + play/pause
// - Click elsewhere: play/pause current track
// - Move mouse: pan + city shift
// - N: random neon palette
// - H: UI toggle
// ------------------------------

let songA, songB, song;
let amp;

let buildings = [];
const BUILDING_COUNT = 28;

let starButtons = [];
let uiHidden = false;

// 튜닝(스케일링)
const LEVEL_MAX = 0.28;
const GROUND_Y = 90;

function preload() {
  songA = loadSound("Somebodyhelpus.mp3");
  songB = loadSound("OneRe.mp3");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  rectMode(CENTER);
  angleMode(DEGREES);

  amp = new p5.Amplitude();

  song = songA;

  for (let i = 0; i < BUILDING_COUNT; i++) {
    buildings.push(new Building(i, BUILDING_COUNT));
  }

  // 하늘에 떠있는 별 버튼(트랙 선택)
  makeStarButtons();

  background(8, 9, 18);
}

function draw() {
  // 잔상 배경
  background(8, 9, 18, 45);

  const level = amp.getLevel();

  // pan (마우스 X)
  const panValue = map(mouseX, 0, width, -1, 1, true);

  if (song && song.isPlaying()) {
    // ✅ 느리게 재생되는 문제 방지: 매 프레임 rate(1) 강제
    // (혹시라도 rate가 바뀌거나 누적되는 상황 예방)
    song.rate(1);
    song.pan(panValue);
  }

  // 도시 흔들림
  const cityShift = map(panValue, -1, 1, -36, 36);

  // 하늘 요소(별 버튼은 흔들림 영향 X, 화면 고정)
  drawHorizon(level);

  // ⭐ 별 버튼 그리기 (캔버스 고정 UI처럼 보이게)
  drawStars(level);

  // 도시(빌딩)는 shift 적용
  push();
  translate(cityShift, 0);

  for (const b of buildings) {
    b.update(level);
    b.display(level);
  }

  pop();

  drawNeonGrain(level);
}

// ------------------------------
// 인터랙션
// ------------------------------

function mousePressed() {
  userStartAudio();

  // ⭐ 별 버튼 먼저 클릭 체크
  for (const sb of starButtons) {
    if (sb.hit(mouseX, mouseY)) {
      handleStarClick(sb);
      return;
    }
  }

  // 그 외 영역 클릭: 현재 트랙 재생/일시정지
  togglePlayPause();
}

function handleStarClick(starBtn) {
  // 트랙 선택 + 재생/일시정지
  const nextTrack = starBtn.track;

  // 다른 트랙이면 전환
  if (song !== nextTrack) {
    const wasPlaying = song && song.isPlaying();
    if (song && song.isPlaying()) song.stop();
    song = nextTrack;

    // 선택된 별 표시
    for (const sb of starButtons) sb.selected = (sb === starBtn);

    // 전환 후 재생
    song.rate(1);
    song.loop();
    return;
  }

  // 같은 트랙이면 토글
  togglePlayPause();
}

function togglePlayPause() {
  if (!song) return;

  if (!song.isPlaying()) {
    song.rate(1); // ✅ 느림 방지
    song.loop();
  } else {
    song.pause();
  }
}

function keyPressed() {
  if (key === "n" || key === "N") {
    for (const b of buildings) b.randomizeNeon();
  }

  if (key === "h" || key === "H") {
    uiHidden = !uiHidden;
    const header = document.querySelector(".ui");
    if (header) header.classList.toggle("hidden", uiHidden);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  for (let i = 0; i < buildings.length; i++) {
    buildings[i].reflow(i, buildings.length);
  }

  makeStarButtons(); // 별 위치도 재배치
}

// ------------------------------
// 별 버튼 UI
// ------------------------------

function makeStarButtons() {
  starButtons = [];

  // 위치: 하늘 상단 (도시 위)
  const y = 90;
  const leftX = width - 180;
  const rightX = width - 110;

  // 트랙 라벨(짧게)
  starButtons.push(new StarButton(leftX, y, 22, songA, "A"));
  starButtons.push(new StarButton(rightX, y + 20, 26, songB, "B"));

  // 기본 선택 표시
  for (const sb of starButtons) sb.selected = (sb.track === song);
}

function drawStars(level) {
  // 별들은 하늘에 떠 있고, 반짝임(트윙클) + 재생 중이면 더 강하게 펄스
  const playing = song && song.isPlaying();

  for (const sb of starButtons) {
    const isActive = (song === sb.track) && playing;
    sb.update(level, isActive);
    sb.draw();
  }

  // 아주 약한 안내 텍스트(미니멀)
  // (필요 없으면 지워도 됨)
  noStroke();
  fill(255, 255, 255, 90);
  textSize(12);
  textAlign(RIGHT, TOP);
  text("Click ★ to choose/play", width - 16, 14);
}

class StarButton {
  constructor(x, y, r, track, label) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.track = track;
    this.label = label;

    this.selected = false;
    this.tw = random(1000);
    this.pulse = 0;
  }

  update(level, isActivePlaying) {
    this.tw += 0.03 + level * 0.25;

    // 반짝임(스케일 + 알파)
    const twinkle = 0.85 + 0.22 * sin(this.tw * 2.4);

    // 재생 중이면 더 살아있는 펄스
    const activeBoost = isActivePlaying ? map(level, 0, LEVEL_MAX, 0.0, 0.35, true) : 0;

    this.scale = twinkle + activeBoost;
    this.glowA = isActivePlaying ? 220 : (this.selected ? 170 : 130);
    this.coreA = isActivePlaying ? 240 : 200;

    // 살짝 떠다니는 모션
    this.floatY = 4 * sin(this.tw * 1.2);
  }

  hit(mx, my) {
    const dx = mx - this.x;
    const dy = my - this.y;
    return dx * dx + dy * dy <= (this.r * 1.35) * (this.r * 1.35);
  }

  draw() {
    push();
    translate(this.x, this.y + this.floatY);
    scale(this.scale);

    // 네온 색: 선택/비선택 구분
    const neon = this.selected ? color(120, 220, 255) : color(255, 120, 210);

    // 글로우(바깥)
    noFill();
    stroke(red(neon), green(neon), blue(neon), this.glowA * 0.45);
    strokeWeight(10);
    drawingContext.shadowBlur = 18;
    drawingContext.shadowColor = `rgba(${red(neon)},${green(neon)},${blue(neon)},0.55)`;
    drawStarShape(0, 0, this.r * 0.65, this.r * 1.35, 5);

    // 코어(안쪽)
    drawingContext.shadowBlur = 0;
    stroke(red(neon), green(neon), blue(neon), this.glowA);
    strokeWeight(2.5);
    fill(255, 255, 255, this.coreA * 0.35);
    drawStarShape(0, 0, this.r * 0.65, this.r * 1.35, 5);

    // 라벨(A/B)
    noStroke();
    fill(255, 255, 255, 190);
    textAlign(CENTER, CENTER);
    textSize(12);
    text(this.label, 0, 0);

    pop();
  }
}

// 별 모양 그리기(도형 함수)
function drawStarShape(x, y, innerR, outerR, points) {
  const step = 360 / points;
  beginShape();
  for (let a = -90; a < 270; a += step) {
    const ox = x + cos(a) * outerR;
    const oy = y + sin(a) * outerR;
    vertex(ox, oy);

    const ix = x + cos(a + step / 2) * innerR;
    const iy = y + sin(a + step / 2) * innerR;
    vertex(ix, iy);
  }
  endShape(CLOSE);
}

// ------------------------------
// 배경/도시 유틸
// ------------------------------

function drawHorizon(level) {
  const y = height - GROUND_Y;

  const glow = map(level, 0, LEVEL_MAX, 40, 180, true);

  stroke(140, 200, 255, glow);
  strokeWeight(2);
  line(0, y, width, y);

  stroke(160, 120, 255, glow * 0.35);
  strokeWeight(1);
  for (let i = 0; i < 6; i++) {
    const yy = y - 40 - i * 16;
    line(0, yy, width, yy);
  }
}

function drawNeonGrain(level) {
  const count = floor(map(level, 0, LEVEL_MAX, 40, 140, true));
  noStroke();
  for (let i = 0; i < count; i++) {
    const x = random(width);
    const y = random(height);
    const a = random(10, 55);
    fill(255, 255, 255, a);
    ellipse(x, y, random(1, 2.2));
  }
}

// ------------------------------
// Building 클래스
// ------------------------------

class Building {
  constructor(index, total) {
    this.reflow(index, total);
    this.baseH = random(110, 260);
    this.w = random(22, 46);
    this.round = random([4, 6, 8]);
    this.randomizeNeon();

    this.windowCols = floor(random(2, 5));
    this.windowRows = floor(random(6, 14));
  }

  reflow(index, total) {
    const margin = 70;
    this.x = map(index, 0, total - 1, margin, width - margin);
  }

  randomizeNeon() {
    const palettes = [
      [[160, 90, 255], [90, 220, 255], [255, 90, 210]],
      [[80, 240, 220], [255, 120, 70], [180, 120, 255]],
      [[120, 200, 255], [255, 110, 170], [140, 255, 160]],
    ];
    const p = random(palettes);
    const c = random(p);
    this.neon = color(c[0], c[1], c[2]);
  }

  update(level) {
    const extra = map(level, 0, LEVEL_MAX, 0, 280, true);
    this.h = this.baseH + extra;
    this.sway = map(level, 0, LEVEL_MAX, -2, 2, true);
  }

  display(level) {
    const groundY = height - GROUND_Y;

    noStroke();
    fill(12, 14, 28, 160);
    rect(this.x, groundY - this.h / 2, this.w, this.h, this.round);

    const alpha = map(level, 0, LEVEL_MAX, 60, 210, true);
    stroke(red(this.neon), green(this.neon), blue(this.neon), alpha);
    strokeWeight(2);
    noFill();
    rect(this.x + this.sway, groundY - this.h / 2, this.w + 6, this.h + 6, this.round);

    this.drawWindows(level, groundY);
  }

  drawWindows(level, groundY) {
    const sparkle = map(level, 0, LEVEL_MAX, 0.15, 0.85, true);

    const padX = 6;
    const padY = 10;
    const ww = max(3, (this.w - padX * 2) / this.windowCols - 3);
    const hh = max(6, (this.h - padY * 2) / this.windowRows - 4);

    for (let r = 0; r < this.windowRows; r++) {
      for (let c = 0; c < this.windowCols; c++) {
        if (random() > sparkle) continue;

        const x = this.x - this.w / 2 + padX + c * (ww + 3) + ww / 2;
        const y = groundY - this.h + padY + r * (hh + 4) + hh / 2;

        noStroke();
        const a = random(60, 170);
        fill(255, 255, 255, a);
        rect(x, y, ww, hh, 2);
      }
    }
  }
}
