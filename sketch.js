// --------------------------------------------------
// Neon Pulse City (FINAL)
// - Buildings with neon outline + window patterns (sparkle)
// - Shy blurry star buttons to select/play tracks
// - Floating UI panel toggle button
// - Pan controls city shift
// - Fix slow playback by forcing rate(1)
// --------------------------------------------------

let songA, songB, song;
let amp;

let buildings = [];
let stars = [];

const BUILDING_COUNT = 28;
const LEVEL_MAX = 0.3;
const GROUND_Y = 90;

let panelOpen = true;

function preload() {
  songA = loadSound("Somebodyhelpus.mp3");
  songB = loadSound("OneRe.mp3");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  rectMode(CENTER);
  angleMode(DEGREES);
  pixelDensity(1);

  amp = new p5.Amplitude();
  song = songA;

  for (let i = 0; i < BUILDING_COUNT; i++) {
    buildings.push(new Building(i));
  }

  createStars();
  setupUIPanel();

  background(6, 7, 19);
}

function draw() {
  // 잔상 배경
  background(6, 7, 19, 45);

  const level = amp.getLevel();

  // pan + 도시 흔들림
  const panValue = map(mouseX, 0, width, -1, 1, true);
  const cityShift = map(panValue, -1, 1, -35, 35);

  // 느린 재생 방지 + pan 적용
  if (song && song.isPlaying()) {
    song.rate(1);
    song.pan(panValue);
  }

  drawHorizon(level);
  drawStars(level);

  // 도시(빌딩)만 shift
  push();
  translate(cityShift, 0);
  for (let b of buildings) {
    b.update(level);
    b.display(level);
  }
  pop();

  drawNeonGrain(level);
}

// ------------------ Input ------------------

function mousePressed() {
  userStartAudio();

  // 별 버튼 우선 클릭 체크
  for (let s of stars) {
    if (s.hit(mouseX, mouseY)) {
      selectStar(s);
      return;
    }
  }

  togglePlay();
}

function togglePlay() {
  if (!song) return;

  if (!song.isPlaying()) {
    song.rate(1);
    song.loop();
  } else {
    song.pause();
  }
}

function selectStar(star) {
  if (!star || !star.track) return;

  // 다른 트랙 선택 시 전환 + 재생
  if (song !== star.track) {
    if (song && song.isPlaying()) song.stop();
    song = star.track;

    song.rate(1);
    song.loop();
  } else {
    // 같은 트랙이면 토글
    togglePlay();
  }

  stars.forEach((s) => (s.selected = s === star));
}

function keyPressed() {
  // 팔레트 변경
  if (key === "N" || key === "n") {
    buildings.forEach((b) => b.randomizeColor());
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  // 빌딩 재배치
  for (let i = 0; i < buildings.length; i++) {
    buildings[i].reflow(i);
  }

  // 별 위치도 재배치
  createStars();
}

// ------------------ UI Panel ------------------

function setupUIPanel() {
  const panel = document.getElementById("infoPanel");
  const btn = document.getElementById("toggleBtn");
  if (!panel || !btn) return;

  btn.addEventListener("click", () => {
    panelOpen = !panelOpen;
    panel.classList.toggle("closed", !panelOpen);
  });
}

// ------------------ Stars ------------------

function createStars() {
  stars = [];
  stars.push(new Star(width - 180, 90, 24, songA, "A"));
  stars.push(new Star(width - 120, 120, 28, songB, "B"));
  stars[0].selected = true;
}

function drawStars(level) {
  for (let s of stars) {
    const active = s.selected && song && song.isPlaying();
    s.update(level, active);
    s.display();
  }

  // 작은 안내 텍스트 (원치 않으면 삭제 가능)
  noStroke();
  fill(255, 255, 255, 70);
  textSize(12);
  textAlign(RIGHT, TOP);
  text("Click ★ to choose/play", width - 16, 14);
}

class Star {
  constructor(x, y, r, track, label) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.track = track;
    this.label = label;

    this.selected = false;
    this.t = random(1000);
    this.floatY = 0;

    // 샤이한(흐릿한) 스타를 위한 기본값
    this.glowA = 70;
    this.coreA = 95;
    this.scale = 1.0;
  }

  update(level, isActivePlaying) {
    this.t += 0.03 + level * 0.18;

    // 은은한 반짝임 + 떠다님
    const twinkle = 0.88 + 0.10 * sin(this.t * 2.2);
    const activeBoost = isActivePlaying ? map(level, 0, LEVEL_MAX, 0.0, 0.22, true) : 0;

    this.scale = twinkle + activeBoost;
    this.floatY = 3.5 * sin(this.t * 1.1);

    // 샤이함 유지: 기본은 흐릿, 재생 중인 선택 별만 조금 또렷
    if (isActivePlaying) {
      this.glowA = 120;
      this.coreA = 160;
    } else if (this.selected) {
      this.glowA = 85;
      this.coreA = 115;
    } else {
      this.glowA = 60;
      this.coreA = 90;
    }
  }

  hit(mx, my) {
    return dist(mx, my, this.x, this.y) < this.r * 1.4;
  }

  display() {
    push();
    translate(this.x, this.y + this.floatY);
    scale(this.scale);

    // 차분한 보랏빛 네온(샤이)
    const neon = this.selected ? color(140, 200, 255) : color(200, 165, 255);

    // 부드러운 흐릿 글로우
    noFill();
    stroke(red(neon), green(neon), blue(neon), this.glowA);
    strokeWeight(6);
    drawingContext.shadowBlur = 26;
    drawingContext.shadowColor = `rgba(${red(neon)},${green(neon)},${blue(neon)},0.35)`;
    drawStar(0, 0, this.r * 0.72, this.r * 1.28, 5);

    // 코어(얇고 깔끔)
    drawingContext.shadowBlur = 0;
    stroke(red(neon), green(neon), blue(neon), this.coreA);
    strokeWeight(1.6);
    fill(255, 255, 255, 55);
    drawStar(0, 0, this.r * 0.72, this.r * 1.28, 5);

    // 라벨(A/B) 아주 은은하게
    noStroke();
    fill(255, 255, 255, 130);
    textAlign(CENTER, CENTER);
    textSize(12);
    text(this.label, 0, 0);

    pop();
  }
}

function drawStar(x, y, innerR, outerR, points) {
  beginShape();
  const step = 360 / points;
  for (let a = -90; a < 270; a += step) {
    vertex(x + cos(a) * outerR, y + sin(a) * outerR);
    vertex(
      x + cos(a + step / 2) * innerR,
      y + sin(a + step / 2) * innerR
    );
  }
  endShape(CLOSE);
}

// ------------------ Background ------------------

function drawHorizon(level) {
  const y = height - GROUND_Y;
  stroke(140, 200, 255, map(level, 0, LEVEL_MAX, 40, 180, true));
  strokeWeight(2);
  line(0, y, width, y);

  // 멀리 있는 얇은 네온 라인들
  stroke(170, 130, 255, map(level, 0, LEVEL_MAX, 15, 80, true));
  strokeWeight(1);
  for (let i = 0; i < 6; i++) {
    const yy = y - 40 - i * 16;
    line(0, yy, width, yy);
  }
}

function drawNeonGrain(level) {
  const count = floor(map(level, 0, LEVEL_MAX, 25, 120, true));
  noStroke();
  for (let i = 0; i < count; i++) {
    const x = random(width);
    const y = random(height);
    fill(255, 255, 255, random(8, 45));
    ellipse(x, y, random(1, 2.2));
  }
}

// ------------------ Buildings ------------------

class Building {
  constructor(i) {
    this.i = i;
    this.reflow(i);

    this.baseH = random(120, 280);
    this.w = random(24, 52);
    this.round = random([4, 6, 8]);

    // 창문 패턴 파라미터
    this.windowCols = floor(random(2, 5));
    this.windowRows = floor(random(7, 16));

    this.randomizeColor();
  }

  reflow(i) {
    const margin = 70;
    this.x = map(i, 0, BUILDING_COUNT - 1, margin, width - margin);
  }

  randomizeColor() {
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
    this.h = this.baseH + map(level, 0, LEVEL_MAX, 0, 290, true);
    this.sway = map(level, 0, LEVEL_MAX, -2, 2, true);
  }

  display(level) {
    const gy = height - GROUND_Y;

    // 빌딩 몸통
    noStroke();
    fill(10, 12, 30, 175);
    rect(this.x, gy - this.h / 2, this.w, this.h, this.round);

    // 네온 외곽선
    const a = map(level, 0, LEVEL_MAX, 70, 210, true);
    stroke(red(this.neon), green(this.neon), blue(this.neon), a);
    strokeWeight(2);
    noFill();
    rect(this.x + this.sway, gy - this.h / 2, this.w + 6, this.h + 6, this.round);

    // ✅ 문양(창문) 그리기
    this.drawWindows(level, gy);
  }

  drawWindows(level, gy) {
    // 소리 커질수록 창문이 더 많이/더 밝게 켜짐
    const sparkle = map(level, 0, LEVEL_MAX, 0.12, 0.85, true);

    const padX = 6;
    const padY = 10;

    const ww = max(3, (this.w - padX * 2) / this.windowCols - 3);
    const hh = max(6, (this.h - padY * 2) / this.windowRows - 4);

    for (let r = 0; r < this.windowRows; r++) {
      for (let c = 0; c < this.windowCols; c++) {
        if (random() > sparkle) continue;

        const x = this.x - this.w / 2 + padX + c * (ww + 3) + ww / 2;
        const y = gy - this.h + padY + r * (hh + 4) + hh / 2;

        // 창문 색은 네온과 조화되게(화이트/연보라)
        noStroke();
        const alpha = random(50, 160);
        fill(255, 255, 255, alpha);

        rect(x, y, ww, hh, 2);
      }
    }

    // 추가 문양: 가끔은 네온 라인(수직 장식) 하나
    if (random() < 0.04 + sparkle * 0.05) {
      stroke(red(this.neon), green(this.neon), blue(this.neon), 90);
      strokeWeight(1);
      const top = gy - this.h + 10;
      const bottom = gy - 10;
      line(this.x, top, this.x, bottom);
    }
  }
}
