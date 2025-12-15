// --------------------------------------------------
// Neon Pulse City
// p5.js Music Visualizer
// --------------------------------------------------

let songA, songB, song;
let amp;

let buildings = [];
let stars = [];

const BUILDING_COUNT = 28;
const LEVEL_MAX = 0.3;
const GROUND_Y = 90;

let panelOpen = true;

// --------------------------------------------------
function preload() {
  songA = loadSound("Somebodyhelpus.mp3");
  songB = loadSound("OneRe.mp3");
}

// --------------------------------------------------
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

// --------------------------------------------------
function draw() {
  background(6, 7, 19, 45);

  const level = amp.getLevel();

  // pan & city movement
  const panValue = map(mouseX, 0, width, -1, 1, true);
  if (song && song.isPlaying()) {
    song.rate(1); // ✅ 느린 재생 방지
    song.pan(panValue);
  }

  drawHorizon(level);
  drawStars(level);

  push();
  translate(map(panValue, -1, 1, -35, 35), 0);
  for (let b of buildings) {
    b.update(level);
    b.display(level);
  }
  pop();
}

// --------------------------------------------------
function mousePressed() {
  userStartAudio();

  // star click priority
  for (let s of stars) {
    if (s.hit(mouseX, mouseY)) {
      selectStar(s);
      return;
    }
  }

  togglePlay();
}

// --------------------------------------------------
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
  if (song !== star.track) {
    if (song.isPlaying()) song.stop();
    song = star.track;
    song.rate(1);
    song.loop();
  } else {
    togglePlay();
  }

  stars.forEach((s) => (s.selected = s === star));
}

function keyPressed() {
  if (key === "N" || key === "n") {
    buildings.forEach((b) => b.randomizeColor());
  }
}

// --------------------------------------------------
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  createStars();
}

// --------------------------------------------------
// UI Panel
function setupUIPanel() {
  const panel = document.getElementById("infoPanel");
  const btn = document.getElementById("toggleBtn");

  btn.addEventListener("click", () => {
    panelOpen = !panelOpen;
    panel.classList.toggle("closed", !panelOpen);
  });
}

// --------------------------------------------------
// Stars
function createStars() {
  stars = [];
  stars.push(new Star(width - 180, 90, 24, songA));
  stars.push(new Star(width - 120, 120, 28, songB));
  stars[0].selected = true;
}

function drawStars(level) {
  for (let s of stars) {
    s.update(level);
    s.display();
  }
}

class Star {
  constructor(x, y, r, track) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.track = track;
    this.selected = false;
    this.t = random(1000);
  }

  update(level) {
    this.t += 0.03;
    this.scale = 0.85 + sin(this.t * 2) * 0.1;
    this.alpha = this.selected && song.isPlaying() ? 160 : 80;
  }

  display() {
    push();
    translate(this.x, this.y + sin(this.t) * 3);
    scale(this.scale);

    noFill();
    stroke(180, 160, 255, this.alpha);
    strokeWeight(5);
    drawingContext.shadowBlur = 25;
    drawingContext.shadowColor = "rgba(180,160,255,0.4)";
    drawStar(0, 0, this.r * 0.7, this.r * 1.3, 5);

    pop();
  }

  hit(mx, my) {
    return dist(mx, my, this.x, this.y) < this.r * 1.4;
  }
}

function drawStar(x, y, innerR, outerR, points) {
  beginShape();
  for (let a = -90; a < 270; a += 360 / points) {
    vertex(x + cos(a) * outerR, y + sin(a) * outerR);
    vertex(
      x + cos(a + 180 / points) * innerR,
      y + sin(a + 180 / points) * innerR
    );
  }
  endShape(CLOSE);
}

// --------------------------------------------------
// City
function drawHorizon(level) {
  const y = height - GROUND_Y;
  stroke(140, 200, 255, map(level, 0, LEVEL_MAX, 40, 180));
  strokeWeight(2);
  line(0, y, width, y);
}

class Building {
  constructor(i) {
    this.x = map(i, 0, BUILDING_COUNT - 1, 70, width - 70);
    this.baseH = random(120, 260);
    this.w = random(24, 46);
    this.randomizeColor();
  }

  randomizeColor() {
    this.c = color(random(120, 255), random(120, 255), 255);
  }

  update(level) {
    this.h = this.baseH + map(level, 0, LEVEL_MAX, 0, 260);
  }

  display(level) {
    const gy = height - GROUND_Y;

    noStroke();
    fill(10, 12, 30, 170);
    rect(this.x, gy - this.h / 2, this.w, this.h, 6);

    stroke(red(this.c), green(this.c), blue(this.c), 160);
    noFill();
    rect(this.x, gy - this.h / 2, this.w + 6, this.h + 6, 6);
  }
}
