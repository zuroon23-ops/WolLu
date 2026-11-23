// WolLu BREAKER — Spark-friendly Realtime Database leaderboard
// Client score submission is NOT cheat-proof; see README_DEPLOY.md.
const $ = id => document.getElementById(id);
const PATH = 'breakerLeaderboardV07';
const nodes = {
  status: $('onlineStatus'), message: $('onlineMessage'), modal: $('onlineModal'),
  rows: $('onlineRows'), score: $('myBestScore'), wave: $('myBestWave'),
  rank: $('myBestRank'), nickname: $('onlineName')
};
let db, uid, sdk, initialization;
let latestSession = 0;
const nickname = () => (nodes.nickname.value || '').trim().slice(0, 16) || '익명 플레이어';
const fmt = n => Number(n).toLocaleString('ko-KR');
const compare = (a,b) => b.score-a.score || b.wave-a.wave || a.achievedAt-b.achievedAt || String(a.uid).localeCompare(String(b.uid));
function note(t) { nodes.message.textContent = t; }
function state(t) { nodes.status.textContent = t; }
try { nodes.nickname.value = localStorage.getItem('wolluBreakerNickname') || ''; } catch {}

async function initialize() {
  if (!window.FIREBASE_CONFIG?.databaseURL) throw new Error('Firebase 연결 설정 없음');
  const base = 'https://www.gstatic.com/firebasejs/11.10.0/';
  const [appSdk, authSdk, dbSdk] = await Promise.all([
    import(base + 'firebase-app.js'),
    import(base + 'firebase-auth.js'),
    import(base + 'firebase-database.js')
  ]);
  const app = appSdk.getApps().length ? appSdk.getApp() : appSdk.initializeApp(window.FIREBASE_CONFIG);
  const auth = authSdk.getAuth(app);
  await auth.authStateReady();
  if (!auth.currentUser) await authSdk.signInAnonymously(auth);
  uid = auth.currentUser.uid;
  db = dbSdk.getDatabase(app);
  sdk = dbSdk;
  state('온라인 랭킹 연결됨');
}
initialization = initialize().catch(err => {
  state('온라인 연결 실패 · 로컬 게임은 가능');
  console.warn('[WolLu BREAKER] Firebase initialization:', err);
  throw err;
});
initialization.catch(() => {});

function start() { latestSession++; }
async function submit({score, turn}) {
  const session = latestSession;
  if (!Number.isSafeInteger(score) || score < 0 || !Number.isSafeInteger(turn) || turn < 1) return;
  try {
    await initialization;
    const recordRef = sdk.ref(db, PATH + '/' + uid);
    const old = (await sdk.get(recordRef)).val();
    if (session !== latestSession) return;
    if (old && (old.score > score || (old.score === score && old.wave >= turn))) {
      state('온라인 최고 기록 유지');
      return;
    }
    await sdk.set(recordRef, {nickname:nickname(), score, wave:turn, achievedAt:sdk.serverTimestamp()});
    state('온라인 최고 기록 등록 완료');
  } catch (err) {
    state('온라인 기록 제출 실패 · 내 로컬 기록은 저장됨');
    console.warn('[WolLu BREAKER] submit:', err);
  }
}
function drawRow(item, i) {
  const row = document.createElement('div');
  row.className = 'rank-entry' + (item.uid === uid ? ' mine' : '');
  const place = document.createElement('span');
  place.className = 'position ' + (i===0?'gold-medal':i===1?'silver-medal':i===2?'bronze-medal':'');
  place.textContent = i + 1 + '위';
  const name = document.createElement('span');
  name.className = 'player';
  name.textContent = (item.nickname || '익명 플레이어') + (item.uid === uid ? ' (나)' : '');
  const points = document.createElement('span');
  points.className = 'points'; points.textContent = fmt(item.score);
  const waves = document.createElement('span');
  waves.className = 'waves'; waves.textContent = String(item.wave);
  row.append(place,name,points,waves);
  return row;
}
async function loadRanking() {
  nodes.rows.innerHTML = '<div class="rank-empty">랭킹을 불러오는 중…</div>';
  note('');
  nodes.score.textContent = nodes.wave.textContent = nodes.rank.textContent = '—';
  try {
    await initialization;
    const root = sdk.ref(db, PATH);
    const [topSnapshot,mySnapshot] = await Promise.all([
      sdk.get(sdk.query(root,sdk.orderByChild('score'),sdk.limitToLast(100))),
      sdk.get(sdk.ref(db,PATH+'/'+uid))
    ]);
    const top = [];
    topSnapshot.forEach(child => {
      const v = child.val();
      if (v && Number.isSafeInteger(v.score) && Number.isSafeInteger(v.wave)) top.push({...v,uid:child.key});
    });
    top.sort(compare);
    nodes.rows.textContent = '';
    if (!top.length) nodes.rows.innerHTML = '<div class="rank-empty">아직 등록된 기록이 없습니다.</div>';
    top.forEach((item,i) => nodes.rows.append(drawRow(item,i)));
    const mine = mySnapshot.val();
    if (mine && Number.isSafeInteger(mine.score) && Number.isSafeInteger(mine.wave)) {
      nodes.score.textContent = fmt(mine.score);
      nodes.wave.textContent = String(mine.wave);
      const topIndex = top.findIndex(item => item.uid === uid);
      if (topIndex >= 0) nodes.rank.textContent = (topIndex+1)+'위';
      else {
        // Exact rank outside TOP 100 needs records with score >= mine.score.
        // Database index keeps range query efficient, but reads may grow as the player base grows.
        const above = await sdk.get(sdk.query(root,sdk.orderByChild('score'),sdk.startAt(mine.score)));
        let higher = 0;
        above.forEach(child => {
          if (child.key !== uid && compare({...child.val(),uid:child.key},{...mine,uid}) < 0) higher++;
        });
        nodes.rank.textContent = (higher+1)+'위';
      }
    } else nodes.rank.textContent = '미등록';
    note('전체 상위 '+top.length+'개 기록 표시 · 내 기록은 초록색으로 강조');
  } catch(err) {
    nodes.rows.innerHTML = '<div class="rank-empty">랭킹을 불러오지 못했습니다.</div>';
    note('Firebase 익명 로그인 및 Realtime Database 보안 규칙을 확인하세요.');
    console.warn('[WolLu BREAKER] read ranking:',err);
  }
}
function show() { nodes.modal.hidden=false; loadRanking(); }
function close() { nodes.modal.hidden=true; if (typeof window.renderUI === 'function') window.renderUI(); }
$('onlineRanking').onclick = show;
$('onlineRefresh').onclick = loadRanking;
$('onlineClose').onclick = close;
$('onlineBack').onclick = close;
$('onlineSaveName').onclick = () => {
  nodes.nickname.value=nickname();
  try { localStorage.setItem('wolluBreakerNickname',nickname()); } catch {}
  note('닉네임 저장 완료 · 다음 최고 기록 갱신부터 반영됩니다.');
};
window.BreakerOnline={start,submit};
start();
