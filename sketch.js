const ALARM_SOUND_URL = "OneRe.mp3";  

let alarmSound;   
let osc;          
let alarms = [];  
let ui = {};

function preload() {
  soundFormats('mp3', 'wav', 'ogg');
  alarmSound = loadSound(ALARM_SOUND_URL, () => {
  }, (e) => {
    console.warn("사운드 파일 로드 실패, 비프 대체 예정:", e);
    alarmSound = null;
  });
}

function setup() {
  noCanvas();

  osc = new p5.Oscillator('sine');
  osc.amp(0);

  ui.hour   = document.getElementById('hour');
  ui.minute = document.getElementById('minute');
  ui.second = document.getElementById('second');
  ui.addBtn = document.getElementById('addBtn');
  ui.list   = document.getElementById('list');

  ui.addBtn.addEventListener('click', onAddAlarm);

  setInterval(tick, 200);
}

async function onAddAlarm() {
  await userStartAudio();
  if (!osc.started) osc.start();

  const h = clamp(parseInt(ui.hour.value), 0, 23);
  const m = clamp(parseInt(ui.minute.value), 0, 59);
  const s = clamp(parseInt(ui.second.value), 0, 59);

  const target = nextDateFor(h, m, s);
  const label  = `${pad(h)}:${pad(m)}:${pad(s)}`;
  const id     = crypto.randomUUID();

  alarms.push({ id, target, label, played:false });
  alarms.sort((a,b)=>a.target-b.target);
  renderList();
}

function tick() {
  if (alarms.length === 0) return;
  const now = new Date();
  for (const a of alarms) {
    if (!a.played && now >= a.target) {
      ring(a);
      a.played = true;   
      renderList();
    }
  }
}

function ring(a) {
  if (alarmSound) {
    try {
      alarmSound.stop();
      alarmSound.play();
      return;
    } catch (e) {
      console.warn("사운드 파일 재생 실패, 비프 대체:", e);
    }
  }
  beep(1200, 880);
}

function beep(durationMs = 1200, freq = 880) {
  osc.freq(freq);
  osc.amp(0.6, 0.02);                 // attack
  setTimeout(() => osc.amp(0, 0.15), durationMs); // release
}

function renderList() {
  if (alarms.length === 0) {
    ui.list.className = "empty";
    ui.list.textContent = "등록된 알람이 없습니다.";
    return;
  }
  ui.list.className = "";
  ui.list.innerHTML = alarms.map(a => {
    const left = a.played ? "완료" : remainText(a.target);
    return `
      <div class="item">
        <div>
          <span class="t">${a.label}</span>
          <span class="sub">${dateText(a.target)}</span>
        </div>
        <div>
          <span class="sub" style="margin-right:8px">${left}</span>
          <button class="del" onclick="removeAlarm('${a.id}')">삭제</button>
        </div>
      </div>
    `;
  }).join("");
}

function removeAlarm(id) {
  alarms = alarms.filter(a => a.id !== id);
  renderList();
}

function pad(n){ return String(n).padStart(2,'0'); }
function clamp(n, min, max){ if(isNaN(n)) return min; return Math.max(min, Math.min(max, n)); }
function nextDateFor(h,m,s){
  const now = new Date();
  const d = new Date(now);
  d.setHours(h, m, s, 0);
  if (d <= now) d.setDate(d.getDate()+1);
  return d;
}
function remainText(target){
  const diff = Math.max(0, target - new Date());
  const hh = Math.floor(diff / 3600000);
  const mm = Math.floor((diff % 3600000) / 60000);
  const ss = Math.floor((diff % 60000) / 1000);
  return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
}
function dateText(d){
  const y=d.getFullYear(), mon=pad(d.getMonth()+1), day=pad(d.getDate());
  const h=pad(d.getHours()), m=pad(d.getMinutes()), s=pad(d.getSeconds());
  return `${y}-${mon}-${day} ${h}:${m}:${s}`;
}
