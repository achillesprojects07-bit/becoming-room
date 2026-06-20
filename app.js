import { firebaseConfig } from './firebase-config.js';

const VERSION = 'V1.1';
const STORE_KEY = 'becomingRoomEntriesV11';
const FIREBASE_READY = firebaseConfig?.apiKey && !firebaseConfig.apiKey.includes('PASTE_');

let fb = { app:null, auth:null, db:null, storage:null, user:null, ready:false };
const state = { screen:'today', draft:{}, entries:loadLocal(), loading:false };

const feelings = ['Unseen','Restless','Lonely','Inspired','Angry','Doubtful','Powerful','Tender','Jealous','Afraid','Clear','Ready','Heavy','Overthinking','Done','Hopeful'];
const reveals = ['A fear','A need','A boundary','A desire','An old pattern','A truth I have been avoiding'];
const desires = ['Deeper connection','Peace in my body','Self-trust','A life that feels like mine','Financial power','Creative expression','Healthy love','Visibility','Freedom','Clarity','Respect','A beautiful next chapter'];
const urges = ['Text again','Check again','Overexplain','Withdraw','Ask someone else','Spiral','Blame myself','Pretend I am fine','Chase reassurance','Make a dramatic decision','Shrink','Keep peace'];
const bodySignals = ['Chest tight','Stomach drop','Throat tight','Heavy body','Hot face','Numb','Racing thoughts','Restless hands','Tired','Want to cry','Want to text','Want to disappear'];
const tests = [
  'Wait 10 minutes before acting on the urge.',
  'Write the message here, but do not send it yet.',
  'Do one task from my own life before checking again.',
  'Separate facts from meanings, then reread only the facts.',
  'Walk for 5 minutes and record what changes in my body.',
  'Take one photo of this moment and write the truth of it.',
  'Put the phone face down for 2 minutes.',
  'Name five things I can see and three sounds I can hear.'
];
const powers = ['My voice','My boundaries','My creativity','My courage','My discipline','My intuition','My intelligence','My leadership','My softness','My visibility','My ability to begin again','My truth'];

async function initFirebase(){
  if(!FIREBASE_READY){ setBadge('Local mode','offline'); return; }
  try{
    const appMod = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js');
    const authMod = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js');
    const fsMod = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
    const stMod = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js');
    fb = { ...fb, ...authMod, ...fsMod, ...stMod };
    fb.app = appMod.initializeApp(firebaseConfig);
    fb.auth = authMod.getAuth(fb.app);
    fb.db = fsMod.getFirestore(fb.app);
    fb.storage = stMod.getStorage(fb.app);
    fb.ready = true;
    authMod.onAuthStateChanged(fb.auth, async user => {
      fb.user = user || null;
      setBadge(user ? 'Cloud sync on' : 'Firebase ready', user ? 'cloud' : 'offline');
      if(user) await loadCloudEntries();
      render();
    });
  }catch(err){
    console.error(err);
    setBadge('Local fallback','offline');
  }
}

function loadLocal(){ try{return JSON.parse(localStorage.getItem(STORE_KEY)||'[]')}catch{return []} }
function saveLocal(){ localStorage.setItem(STORE_KEY, JSON.stringify(state.entries)); }
function uid(){ return 'entry_' + Date.now() + '_' + Math.random().toString(36).slice(2,7); }
function isoDay(){ return new Date().toISOString().slice(0,10); }
function prettyDate(d=new Date()){ return d.toLocaleDateString(undefined,{weekday:'long',year:'numeric',month:'long',day:'numeric'}); }
function esc(s=''){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
function title(t){ document.getElementById('screenTitle').textContent=t; }
function main(html){ document.getElementById('main').innerHTML=html; wire(); }
function setBadge(text, mode=''){ const b=document.getElementById('syncBadge'); b.textContent=text; b.className='sync-badge ' + mode; }
function setNav(){ document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active', b.dataset.nav===state.screen)); }
function chips(list,key){ return `<div class="grid">${list.map(x=>`<button class="chip ${state.draft[key]===x?'selected':''}" data-pick="${key}" data-value="${esc(x)}">${esc(x)}</button>`).join('')}</div>`; }
function field(key, placeholder='', tall=false){ return `<textarea class="${tall?'tall':''}" data-save-text="${key}" placeholder="${esc(placeholder)}">${esc(state.draft[key]||'')}</textarea>`; }
function input(key, placeholder=''){ return `<input class="input" data-save-text="${key}" value="${esc(state.draft[key]||'')}" placeholder="${esc(placeholder)}">`; }
function range(key, val='5'){ const v=state.draft[key]||val; return `<div class="range-wrap"><input type="range" min="0" max="10" value="${esc(v)}" data-range="${key}"><span class="range-value" data-range-out="${key}">${esc(v)}</span></div>`; }

function wire(){
  setNav();
  document.querySelectorAll('[data-pick]').forEach(btn=>btn.onclick=()=>{ state.draft[btn.dataset.pick]=btn.dataset.value; render(); });
  document.querySelectorAll('[data-save-text]').forEach(el=>el.oninput=()=>{ state.draft[el.dataset.saveText]=el.value; });
  document.querySelectorAll('[data-select]').forEach(el=>el.onchange=()=>{ state.draft[el.dataset.select]=el.value; render(); });
  document.querySelectorAll('[data-action]').forEach(btn=>btn.onclick=()=>actions[btn.dataset.action]?.(btn));
  document.querySelectorAll('[data-nav]').forEach(btn=>btn.onclick=()=>{ state.screen=btn.dataset.nav; state.draft={}; render(); });
  document.querySelectorAll('[data-range]').forEach(el=>el.oninput=()=>{ state.draft[el.dataset.range]=el.value; const out=document.querySelector(`[data-range-out="${el.dataset.range}"]`); if(out) out.textContent=el.value; });
  const file=document.getElementById('photoInput'); if(file) file.onchange=handlePhoto;
}

async function loadCloudEntries(){
  if(!fb.ready || !fb.user) return;
  try{
    const q = fb.query(fb.collection(fb.db,'users',fb.user.uid,'entries'), fb.orderBy('createdAt','desc'), fb.limit(100));
    const snap = await fb.getDocs(q);
    state.entries = snap.docs.map(d=>({id:d.id, ...d.data()}));
    saveLocal();
  }catch(err){ console.error(err); }
}
async function saveEntry(entry){
  state.entries.unshift(entry); saveLocal();
  if(fb.ready && fb.user){
    const clean = {...entry};
    if(clean.localPhoto) delete clean.localPhoto;
    await fb.setDoc(fb.doc(fb.db,'users',fb.user.uid,'entries',entry.id), clean, {merge:true});
  }
}
async function deleteEntry(id){
  state.entries = state.entries.filter(e=>e.id!==id); saveLocal();
  if(fb.ready && fb.user){ try{ await fb.deleteDoc(fb.doc(fb.db,'users',fb.user.uid,'entries',id)); }catch(e){console.error(e)} }
}
async function uploadPhotoIfNeeded(entry){
  if(!state.draft.photoBlob) return entry;
  if(fb.ready && fb.user){
    const day = isoDay();
    const path = `users/${fb.user.uid}/journalPhotos/${day}.jpg`;
    const ref = fb.ref(fb.storage, path);
    await fb.uploadBytes(ref, state.draft.photoBlob, {contentType:'image/jpeg', customMetadata:{onePhotoPerDay:'true'}});
    entry.photoUrl = await fb.getDownloadURL(ref);
    entry.photoPath = path;
    entry.photoDay = day;
    entry.photoRule = 'One cloud photo per day. Uploading another photo today replaces today\'s stored image.';
  }else{
    entry.localPhoto = state.draft.photoPreview || '';
  }
  return entry;
}

const actions = {
  startDaily(){ state.draft={mode:'daily'}; renderDailyFlow(); },
  async saveDaily(){
    const entry = base('Daily Clarity');
    Object.assign(entry,{ feeling:state.draft.feeling||'', reveal:state.draft.reveal||'', desire:state.draft.desire||'', truth:state.draft.truth||'', power:state.draft.power||'', alignedAction:state.draft.alignedAction||'' });
    await saveEntry(entry); state.screen='entries'; state.draft={}; render();
  },
  startTrigger(){ state.draft={mode:'trigger'}; renderTriggerFlow(); },
  async saveTrigger(){
    const entry = base('Trigger Evidence');
    Object.assign(entry,{ event:state.draft.event||'', fact:state.draft.fact||'', meaning:state.draft.meaning||'', body:state.draft.body||'', urge:state.draft.urge||'', intensityBefore:state.draft.intensityBefore||'5', regulation:state.draft.regulation||'', test:state.draft.test||'', result:state.draft.result||'', intensityAfter:state.draft.intensityAfter||'5', evidence:state.draft.evidence||'' });
    await saveEntry(entry); state.screen='entries'; state.draft={}; render();
  },
  async savePage(){
    let entry = base('Journal Page');
    Object.assign(entry,{ title:state.draft.pageTitle||'Journal Page', journal:state.draft.journal||'', truth:state.draft.highlightTruth||'', paper:state.draft.paper||'paper-mist', border:state.draft.border||'border-violet', decor:state.draft.decor||'floral' });
    try{ entry = await uploadPhotoIfNeeded(entry); await saveEntry(entry); state.screen='entries'; state.draft={}; render(); }
    catch(e){ alert('Photo upload failed. Check Firebase Storage setup or continue in local mode.'); console.error(e); }
  },
  async saveBecoming(){
    const entry = base('Becoming Evidence');
    Object.assign(entry,{ area:state.draft.area||'', desiredLife:state.draft.desiredLife||'', quality:state.draft.quality||'', blocker:state.draft.blocker||'', evidence:state.draft.becomingEvidence||'', nextAction:state.draft.nextAction||'' });
    await saveEntry(entry); state.screen='entries'; state.draft={}; render();
  },
  async signUp(){ await authAction('signup'); },
  async signIn(){ await authAction('signin'); },
  async signOut(){ if(fb.ready) await fb.signOut(fb.auth); },
  async deleteEntry(btn){ if(confirm('Delete this entry?')){ await deleteEntry(btn.dataset.id); render(); } },
  deleteLocal(){ if(confirm('Delete all local entries on this browser? Cloud entries are not deleted.')){ state.entries=[]; saveLocal(); render(); } },
  exportEntries(){ const blob=new Blob([JSON.stringify(state.entries,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='becoming-room-entries-v1-1.json'; a.click(); URL.revokeObjectURL(url); }
};
function base(type){ return { id:uid(), type, date:prettyDate(), createdAt:new Date().toISOString(), version:VERSION }; }
async function authAction(type){
  if(!fb.ready){ alert('Firebase config is not connected yet. Paste your config into firebase-config.js first.'); return; }
  const email=document.getElementById('email')?.value?.trim(); const pass=document.getElementById('password')?.value;
  if(!email || !pass){ alert('Enter email and password.'); return; }
  try{
    if(type==='signup') await fb.createUserWithEmailAndPassword(fb.auth,email,pass);
    else await fb.signInWithEmailAndPassword(fb.auth,email,pass);
  }catch(e){ alert(e.message); }
}

function render(){
  setNav();
  if(state.screen==='today') return renderToday();
  if(state.screen==='trigger') return renderTrigger();
  if(state.screen==='page') return renderPage();
  if(state.screen==='entries') return renderEntries();
  if(state.screen==='becoming') return renderBecoming();
  if(state.screen==='settings') return renderSettings();
}
function renderToday(){
  title('What am I feeling, and what is this revealing?');
  main(`<section class="card hero"><h2>Daily Clarity</h2><p class="lead">Start from the real feeling, then turn it into truth, desire, and one aligned action. No forced belief. Evidence first.</p><button class="primary" data-action="startDaily">Begin today’s check-in</button></section><section class="card subtle"><div class="quote">Your feeling is not the enemy. It may be data about a fear, need, boundary, desire, old pattern, or truth asking to be seen.</div></section>`);
}
function renderDailyFlow(){
  title('Daily Clarity');
  main(`<section class="card"><h2>Today’s check-in</h2><h3>1. What am I feeling?</h3>${chips(feelings,'feeling')}<h3>2. What might this reveal?</h3>${chips(reveals,'reveal')}<h3>3. What do I actually want?</h3>${chips(desires,'desire')}<label class="label">4. What feels honestly true today?</label>${field('truth','Write what is real. It does not need to be pretty.')}<h3>5. What power is available to me today?</h3>${chips(powers,'power')}<label class="label">6. What is one aligned action I can take?</label>${field('alignedAction','One action that creates evidence.')}<div class="row"><button class="primary" data-action="saveDaily">Save check-in</button><button class="secondary" data-nav="today">Cancel</button></div></section>`);
}
function renderTrigger(){
  title('When I am triggered, I train a different loop.');
  main(`<section class="card hero"><h2>Trigger Mode</h2><p class="lead">For reassurance-seeking, spiraling, silence, jealousy, rejection, or feeling unseen.</p><div class="quote">Regulate → observe → interrupt → test → record evidence → repeat.</div><button class="primary" data-action="startTrigger">I’m triggered</button></section>`);
}
function renderTriggerFlow(){
  title('Trigger Evidence Loop');
  main(`<section class="card"><h2>Evidence loop</h2><label class="label">1. What happened?</label>${field('event','Describe the real event.')}<label class="label">Intensity before</label>${range('intensityBefore','5')}<h3>2. Fact vs Meaning</h3><label class="label">Fact</label>${field('fact','Only what objectively happened.')}<label class="label">Meaning my old wiring added</label>${field('meaning','Example: I am not important. I am being abandoned.')}<h3>3. Body signal</h3>${chips(bodySignals,'body')}<h3>4. What urge came up?</h3>${chips(urges,'urge')}<label class="label">5. Regulation used</label><select class="input" data-select="regulation">${['Write only facts','Feet on floor for 30 seconds','Name 5 things I see','Phone face down for 2 minutes','Unclench jaw and shoulders','Step outside','Slow exhale x 5','No regulation yet'].map(x=>`<option ${state.draft.regulation===x?'selected':''}>${x}</option>`).join('')}</select><h3>6. Choose a test, not an affirmation</h3>${chips(tests,'test')}<label class="label">7. What actually happened after?</label>${field('result','No forced positive result. Record data.')}<label class="label">Intensity after</label>${range('intensityAfter','5')}<label class="label">8. Evidence collected</label>${field('evidence','Example: I noticed the pattern. I waited. I separated fact from meaning.')}<div class="row"><button class="primary" data-action="saveTrigger">Save evidence</button><button class="secondary" data-nav="trigger">Cancel</button></div></section>`);
}
function renderPage(){
  title('Create a polished journal page.');
  const paper=state.draft.paper||'paper-mist', border=state.draft.border||'border-violet', decor=state.draft.decor||'floral';
  const flowers = decor==='none'?'': decor==='minimal'?'<span class="flower tr">✦</span>':'<span class="flower tl">✿</span><span class="flower tr">✧</span><span class="flower bl">❦</span><span class="flower br">✿</span><span class="flower center">✦</span>';
  main(`<section class="split"><div class="card"><h2>Journal Page</h2><p class="small">One cloud photo per day. If you upload another photo today, it will replace today’s cloud photo. Local mode stores the preview only in this browser.</p><label class="label">Page title</label>${input('pageTitle','Example: What I finally noticed')}<label class="label">Your page</label>${field('journal','Write freely here.',true)}<label class="label">Truth to highlight</label>${input('highlightTruth','One sentence that feels true')}<label class="label">Add today’s photo</label><input id="photoInput" class="input" type="file" accept="image/*"><div class="preview-note">Photos are compressed before upload to reduce Firebase cost.</div><div class="grid three"><select class="input" data-select="paper"><option value="paper-mist" ${paper==='paper-mist'?'selected':''}>Mist paper</option><option value="paper-lilac" ${paper==='paper-lilac'?'selected':''}>Lilac paper</option><option value="paper-slate" ${paper==='paper-slate'?'selected':''}>Slate paper</option></select><select class="input" data-select="border"><option value="border-violet" ${border==='border-violet'?'selected':''}>Violet border</option><option value="border-silver" ${border==='border-silver'?'selected':''}>Silver border</option><option value="border-leaf" ${border==='border-leaf'?'selected':''}>Cool leaf border</option></select><select class="input" data-select="decor"><option value="floral" ${decor==='floral'?'selected':''}>Flowers</option><option value="minimal" ${decor==='minimal'?'selected':''}>Minimal</option><option value="none" ${decor==='none'?'selected':''}>None</option></select></div><div class="row"><button class="primary" data-action="savePage">Save page</button></div></div><div class="card flush"><div class="page-preview lines ${paper} ${border}">${flowers}<div class="page-title">${esc(state.draft.pageTitle||prettyDate())}</div>${state.draft.photoPreview?`<img class="photo" src="${state.draft.photoPreview}" alt="Journal photo">`:''}<div class="script">${esc(state.draft.journal||'Your writing will appear here in a cursive journal style.')}</div>${state.draft.highlightTruth?`<div class="quote">${esc(state.draft.highlightTruth)}</div>`:''}</div></div></section>`);
}
function renderEntries(){
  title('My evidence, pages, and becoming timeline.');
  const items = state.entries.length ? state.entries.map(e=>entryCard(e)).join('') : `<div class="empty">No entries yet. Begin with Today, Triggered, Page, or Becoming.</div>`;
  main(`<section class="card"><div class="entry-head"><div><h2>Entries</h2><p class="small">Cloud entries load here after Firebase sign-in. Local entries are saved on this browser.</p></div><div class="row"><button class="secondary" data-action="exportEntries">Export</button><button class="danger" data-action="deleteLocal">Clear local</button></div></div></section>${items}`);
}
function entryCard(e){
  const photo = e.photoUrl || e.localPhoto || '';
  return `<section class="card entry"><div class="entry-head"><div><span class="tag">${esc(e.type||'Entry')}</span><h2>${esc(e.title||e.feeling||e.area||e.type||'Entry')}</h2><p class="small">${esc(e.date||'')}</p></div><button class="danger" data-action="deleteEntry" data-id="${esc(e.id)}">Delete</button></div>${photo?`<img class="photo" src="${esc(photo)}" alt="Entry photo">`:''}${kv('Feeling',e.feeling)}${kv('Reveal',e.reveal)}${kv('Desire',e.desire)}${kv('Truth',e.truth)}${kv('Action',e.alignedAction||e.nextAction)}${kv('Event',e.event)}${kv('Fact',e.fact)}${kv('Meaning',e.meaning)}${kv('Urge',e.urge)}${kv('Test',e.test)}${kv('Result',e.result)}${kv('Evidence',e.evidence||e.becomingEvidence)}${kv('Journal',e.journal)}</section>`;
}
function kv(k,v){ return v ? `<p><strong>${k}:</strong> ${esc(v)}</p>` : ''; }
function renderBecoming(){
  title('Manifestation through evidence, not pretending.');
  const areas=['Love','Work','Money','Health','Creativity','Home','Travel','Purpose','Self-trust','Visibility','Peace'];
  main(`<section class="card hero"><h2>Becoming</h2><p class="lead">This is the grounded manifestation space: what you want, what quality it represents, what pattern blocks it, and what evidence you can create today.</p></section><section class="card"><h3>1. Area</h3>${chips(areas,'area')}<label class="label">2. What life am I being called to create?</label>${field('desiredLife','Describe the desired life, relationship, work, body, home, or version of yourself.')}<label class="label">3. What quality does it represent?</label>${input('quality','Freedom, steadiness, beauty, power, peace, devotion...')}<label class="label">4. What old pattern blocks this?</label>${field('blocker','No shame. Just observe the pattern.')}<label class="label">5. What evidence can I create today?</label>${field('becomingEvidence','One concrete proof point from today.')}<label class="label">6. Next aligned action</label>${input('nextAction','One action that resembles the woman I am becoming.')}<button class="primary" data-action="saveBecoming">Save becoming evidence</button></section>`);
}
function renderSettings(){
  title('Settings and Firebase connection.');
  const connected = fb.ready && fb.user;
  main(`<section class="card"><h2>Firebase</h2><p class="lead">V1.1 is Firebase-ready. It works locally now, then switches to cloud sync when you paste your Firebase config and sign in.</p><div class="pill-list"><span class="pill">Email/password login</span><span class="pill">Firestore entries</span><span class="pill">Storage photos</span><span class="pill">1 cloud photo/day</span><span class="pill">Local fallback</span></div>${FIREBASE_READY?authPanel(connected):`<div class="auth-panel"><strong>Firebase config not connected yet.</strong><p class="small">Open <b>firebase-config.js</b> and paste your Firebase web app config. Until then, the app saves locally.</p></div>`}</section><section class="card"><h2>Design note</h2><p class="small">This version removes the beige/orange feel and uses a more professional dark plum, violet, cool teal, silver, lilac, and slate palette.</p></section>`);
}
function authPanel(connected){
  if(connected) return `<div class="auth-panel"><strong>Signed in:</strong><p class="small">${esc(fb.user.email||'Firebase user')}</p><button class="secondary" data-action="signOut">Sign out</button></div>`;
  return `<div class="auth-panel"><label class="label">Email</label><input id="email" class="input" type="email" autocomplete="email"><label class="label">Password</label><input id="password" class="input" type="password" autocomplete="current-password"><div class="row"><button class="primary" data-action="signIn">Sign in</button><button class="secondary" data-action="signUp">Create account</button></div></div>`;
}
async function handlePhoto(evt){
  const file = evt.target.files?.[0]; if(!file) return;
  const {blob, dataUrl} = await compressImage(file, 1280, .78);
  state.draft.photoBlob = blob; state.draft.photoPreview = dataUrl; render();
}
function compressImage(file, max=1280, quality=.78){
  return new Promise((resolve,reject)=>{
    const img=new Image(); const reader=new FileReader();
    reader.onload=e=>{ img.onload=()=>{ const scale=Math.min(1,max/Math.max(img.width,img.height)); const w=Math.round(img.width*scale), h=Math.round(img.height*scale); const canvas=document.createElement('canvas'); canvas.width=w; canvas.height=h; const ctx=canvas.getContext('2d'); ctx.drawImage(img,0,0,w,h); const dataUrl=canvas.toDataURL('image/jpeg',quality); canvas.toBlob(blob=>resolve({blob,dataUrl}),'image/jpeg',quality); }; img.onerror=reject; img.src=e.target.result; };
    reader.onerror=reject; reader.readAsDataURL(file);
  });
}

initFirebase();
render();
