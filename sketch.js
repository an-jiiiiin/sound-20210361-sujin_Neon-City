// ------------------------------
// Neon Pulse City - p5.js Visualizer
// Folder structure friendly:
// - p5.js
// - p5.sound.min.js
// - sketch.js
// - style.css
// - audio files: Somebodyhelpus.mp3, OneRe.mp3 (둘 중 있는 것 사용)
// ------------------------------

let songA, songB, song;
let amp;

let buildings = [];
const BUILDING_COUNT = 28;

let uiHidden = false;

// 튜닝(과제에서 "스케일링 적절성" 체크용)
const LEVEL_MAX = 0.28; // amp.getLevel()이 보통 0~0.3 근처를 많이 씀
const GROUND_Y = 90;

function preload() {
  // 폴더에 있는 파일명 그대로 사용
  // (둘 다 있을 수도 있어서 try 느낌으로 둘 다 로드)
  songA = loadSound("Somebodyhelpus.mp3");
  songB = loadSound("OneRe.mp3");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  rectMode(CENTER);
  angleMode(DEGREES);

  // p5.sound 분석 객체 생성
  amp = new p5.Amplitude();

  // 기본 트랙 선택
  song = songA;

  // 빌딩 생성
  for (let i = 0; i < BUILDING_COUNT; i++) {
    buildings.push(new Building(i, BUILDING_COUNT));
  }

  // 시작 화면
  background(8, 9, 18);
}

function draw() {
  // 잔상(네온 느낌) - 배경을 완전히 지우지 않고 투명도로 덮기
  background(8, 9, 18, 45);

  // 현재 음량
  const level = amp.getLevel();

  // pan 값: 마우스 X로 조절 (좌우 밸런스)
  const panValue = map(mouseX, 0, width, -1, 1, true);

  // 재생 중일 때만 실제 pan 적용 (정지 상태에서도 화면은 움직이게 할 수도 있지만 과제 취지상 재생 중 반응이 더 명확)
  if (song && song.isPlaying()) song.pan(panValue);

  // 도시 전체 흔들림: panValue → 좌우 쉬프트
  const cityShift = map(panValue, -1, 1, -36, 36);

  // 바닥선/하늘빛(라인)으로 rect 외 도형 사용 조건 충족
  drawHorizon(level);

  push();
  translate(cityShift, 0);

  // 빌딩 업데이트/표시
  for (const b of buildings) {
    b.update(level);
    b.display(level);
  }

  pop();

  // 약한 네온 그레인 느낌(점) - 소리 따라 약간 증가
  drawNeonGrain(level);
}

// ------------------------------
// 인터랙션
// ------------------------------

function mousePressed() {
  // 브라우저 오디오 정책 대응
  userStartAudio();

  if (!song) return;

  if (!song.isPlaying()) {
    song.loop();
  } else {
    song.pause();
  }
}

function keyPressed() {
  if (key === "n" || key === "N") {
    // 네온 팔레트 재랜덤
    for (const b of buildings) b.randomizeNeon();
  }

  if (key === "1") {
    switchTrack(songA);
  }

  if (key === "2") {
    switchTrack(songB);
  }

  if (key === "h" || key === "H") {
    uiHidden = !uiHidden;
    const header = document.querySelector(".ui");
    if (header) header.classList.toggle("hidden", uiHidden);
  }
}

function switchTrack(next) {
  if (!next) return;

  userStartAudio();

  const wasPlaying = song && song.isPlaying();
  if (song && song.isPlaying()) song.stop();

  song = next;

  if (wasPlaying) song.loop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  // 화면 크기 바뀌면 빌딩 재배치
  for (let i = 0; i < buildings.length; i++) {
    buildings[i].reflow(i, buildings.length);
  }
}

// ------------------------------
// 그리기 유틸
// ------------------------------

function drawHorizon(level) {
  // 지평선 위치
  const y = height - GROUND_Y;

  // 소리 크기에 따라 살짝 밝아지는 네온 라인
  const glow = map(level, 0, LEVEL_MAX, 40, 180, true);

  stroke(140, 200, 255, glow);
  strokeWeight(2);
  line(0, y, width, y);

  // 멀리 도시 빛 같은 얇은 라인들
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

    // 창문 패턴용
    this.windowCols = floor(random(2, 5));
    this.windowRows = floor(random(6, 14));
  }

  reflow(index, total) {
    const margin = 70;
    this.x = map(index, 0, total - 1, margin, width - margin);
  }

  randomizeNeon() {
    // 네온 팔레트: 보라/시안/핑크 계열이 도시 느낌 잘 남
    const palettes = [
      [ [160, 90, 255], [90, 220, 255], [255, 90, 210] ],
      [ [80, 240, 220], [255, 120, 70], [180, 120, 255] ],
      [ [120, 200, 255], [255, 110, 170], [140, 255, 160] ],
    ];
    const p = random(palettes);
    const c = random(p);
    this.neon = color(c[0], c[1], c[2]);
  }

  update(level) {
    // amp → 빌딩 높이 (스케일링 조절)
    const extra = map(level, 0, LEVEL_MAX, 0, 280, true);
    this.h = this.baseH + extra;

    // 소리 커질수록 약간 흔들리는 느낌(너무 과하면 감점이라 아주 미세)
    this.sway = map(level, 0, LEVEL_MAX, -2, 2, true);
  }

  display(level) {
    const groundY = height - GROUND_Y;

    // 빌딩 몸통
    noStroke();
    fill(12, 14, 28, 160);
    rect(this.x, groundY - this.h / 2, this.w, this.h, this.round);

    // 네온 테두리 (색상 속성 반응)
    const alpha = map(level, 0, LEVEL_MAX, 60, 210, true);
    stroke(red(this.neon), green(this.neon), blue(this.neon), alpha);
    strokeWeight(2);
    noFill();
    rect(this.x + this.sway, groundY - this.h / 2, this.w + 6, this.h + 6, this.round);

    // 창문(네온 반짝임)
    this.drawWindows(level, groundY);
  }

  drawWindows(level, groundY) {
    // 소리 커질수록 창문이 더 켜지는 느낌
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

        // 창문 색: 네온과 조화되는 밝은 톤
        noStroke();
        const a = random(60, 170);
        fill(255, 255, 255, a);
        rect(x, y, ww, hh, 2);
      }
    }
  }
}
