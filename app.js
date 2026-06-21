(function(){
  'use strict';

  const VERSION = 'V1.2';
  const LOCAL_KEY = 'becomingRoom.entries.v12';
  const DRAFT_KEY = 'becomingRoom.draft.v12';
  const app = document.getElementById('app');

  const feelings = [
    ['Restless','Something in me wants movement.'],['Unseen','I want to be witnessed.'],['Tender','I feel open and easily touched.'],
    ['Heavy','I am carrying more than usual.'],['Longing','Something in me is reaching.'],['Afraid','My body wants certainty.'],
    ['Angry','Something in me may need protection.'],['Doubtful','I am looking for steadiness.'],['Clear','A truth is close to the surface.'],
    ['Hopeful','Something still believes in possibility.'],['Powerful','I can feel my own strength.'],['Quiet','I need a gentler pace.']
  ];
  const stories = [
    'Maybe I am not important.','Maybe I am being left behind.','Maybe I need to fix this now.',
    'Maybe I did something wrong.','Maybe I am too much.','Maybe I should stay quiet.',
    'Maybe I already know the truth.','Maybe I am ready for more.','Maybe I want something I have not admitted.'
  ];
  const longings = ['to feel chosen','to feel peaceful','to be seen','to feel free','to create','to be loved steadily','to feel powerful','to trust myself','to begin again','to belong to my own life'];
  const returns = [
    ['Write before reaching outward','Let the first witness be me.'],['Wait ten minutes','Let the urgency soften before I obey it.'],
    ['Choose one thing from my own life','Return attention to the life that belongs to me.'],['Take a short walk','Let my body move before my mind decides.'],
    ['Say the simpler truth','No overexplaining, no performance.'],['Rest without proving','I do not have to earn gentleness.'],
    ['Create for twenty minutes','Let my power move into form.'],['Make one decision alone','Practice hearing my own yes or no.']
  ];

  const state = {
    tab:'home',
    step:0,
    mode:'checkin',
    user:null,
    firebaseReady:false,
    db:null,
    entries:[],
    draft: freshDraft(),
    modal:null,
    syncing:false
  };

  function freshDraft(){
    return {
      id:null,type:'checkin',createdAt:null,
      feeling:'',intensity:5,stirred:'',story:'',truth:'',longing:'',returnChoice:'',returnNote:'',proof:'',reflection:'',
      pageTitle:'',paper:'light',border:'floral',flowers:'✦ ❀ ✦',photoData:'',becomingArea:'',becomingVision:'',becomingAction:''
    };
  }

  function init(){
    loadLocal();
    tryFirebase();
    render();
  }

  function loadLocal(){
    try{ state.entries = JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]'); }catch(e){ state.entries=[]; }
    try{ const d = JSON.parse(localStorage.getItem(DRAFT_KEY)||'null'); if(d) state.draft = Object.assign(freshDraft(), d); }catch(e){}
  }
  function saveLocal(){ localStorage.setItem(LOCAL_KEY, JSON.stringify(state.entries)); }
  function saveDraft(){ localStorage.setItem(DRAFT_KEY, JSON.stringify(state.draft)); }
  function clearDraft(){ localStorage.removeItem(DRAFT_KEY); state.draft = freshDraft(); state.step=0; }

  function tryFirebase(){
    if(!window.firebase || !window.BECOMING_ROOM_FIREBASE_CONFIG) return;
    try{
      if(!firebase.apps.length) firebase.initializeApp(window.BECOMING_ROOM_FIREBASE_CONFIG);
      state.db = firebase.firestore();
      state.firebaseReady = true;
      firebase.auth().onAuthStateChanged(async user=>{
        state.user = user || null;
        if(user) await loadCloudEntries();
        render();
      });
    }catch(e){ console.warn('Firebase disabled:', e); }
  }

  async function loadCloudEntries(){
    if(!state.user || !state.db) return;
    try{
      const snap = await state.db.collection('users').doc(state.user.uid).collection('entries').orderBy('createdAt','desc').get();
      const cloud = snap.docs.map(d=>Object.assign({id:d.id}, d.data()));
      const map = new Map();
      [...cloud, ...state.entries].forEach(x=>{ if(x && x.id) map.set(x.id, x); });
      state.entries = Array.from(map.values()).sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
      saveLocal();
    }catch(e){ alert('Firestore load error: '+e.message); }
  }
  async function saveCloud(entry){
    if(!state.user || !state.db) return;
    const clean = Object.assign({}, entry);
    // Photos stay local-only to avoid Firebase Storage billing. Do not push base64 photos to Firestore.
    clean.photoData = '';
    await state.db.collection('users').doc(state.user.uid).collection('entries').doc(entry.id).set(clean, {merge:true});
  }
  async function deleteCloud(id){
    if(!state.user || !state.db) return;
    await state.db.collection('users').doc(state.user.uid).collection('entries').doc(id).delete();
  }

  function shell(content){
    const auth = state.user ? `<span class="pill ok">Signed in: ${escapeHtml(state.user.email)}</span>` : `<span class="pill">Local mode${state.firebaseReady?' · Firebase ready':''}</span>`;
    app.innerHTML = `
      <header class="topbar">
        <div class="brand"><div class="mark">BR</div><div><h1>The Becoming Room</h1><div class="version">${VERSION} · guided path rebuild</div></div></div>
        <div class="status">${auth}<button class="ghost" data-tab="settings" type="button">Settings</button></div>
      </header>
      <section class="hero">
        <p class="eyebrow">A private room for self-return</p>
        <h2>Not to force belief. To hear yourself, clearly and gently, before the world gets louder.</h2>
        <p>This journal helps you notice what is moving in you, understand the story it brought, find the longing underneath, and choose one honest way back to yourself.</p>
        <div class="hero-actions"><button class="primary" data-start="checkin" type="button">Begin today’s check-in</button><button class="secondary" data-start="pulled" type="button">I feel pulled</button><button class="ghost" data-tab="journal" type="button">Read my journal</button></div>
      </section>
      <nav class="nav">
        <button class="${state.tab==='home'?'active':''}" data-tab="home" type="button">Guided path</button>
        <button class="${state.tab==='journal'?'active':''}" data-tab="journal" type="button">Journal</button>
        <button class="${state.tab==='becoming'?'active':''}" data-tab="becoming" type="button">Becoming</button>
        <button class="${state.tab==='settings'?'active':''}" data-tab="settings" type="button">Settings</button>
      </nav>
      <main>${content}</main>
      <p class="footer-note">V1.2 keeps the science underneath, but speaks in language that feels human. Photos are local-only for now.</p>
      ${state.modal ? modalHtml(state.modal) : ''}
    `;
  }

  function render(){
    if(state.tab==='journal') return shell(journalHtml());
    if(state.tab==='becoming') return shell(becomingHtml());
    if(state.tab==='settings') return shell(settingsHtml());
    return shell(guidedHtml());
  }

  function guidedHtml(){
    const s = state.step;
    const pct = Math.round(((s+1)/7)*100);
    const titles = ['What is moving in me?','What stirred this?','The story that came with it','What remains true?','The longing underneath','A way back to myself','Save this page'];
    return `<section class="card">
      <div class="step-line"><span>Step ${s+1} of 7</span><div class="bar"><span style="width:${pct}%"></span></div><span>${pct}%</span></div>
      <h3>${titles[s]}</h3>
      ${stepHtml(s)}
    </section>`;
  }

  function stepHtml(s){
    const d = state.draft;
    if(s===0) return `
      <p class="helper">Choose the feeling closest to the surface. It does not have to be perfect. We are only giving the moment a name.</p>
      <div class="grid">${feelings.map(([f,sub])=>`<button type="button" class="choice ${d.feeling===f?'selected':''}" data-set="feeling" data-value="${f}">${f}<small>${sub}</small></button>`).join('')}</div>
      <div class="field"><label>How strong is it right now? <span class="hint">0 is quiet, 10 is overwhelming.</span></label><input type="range" min="0" max="10" value="${d.intensity}" data-input="intensity"><p class="tiny">Intensity: <b>${d.intensity}</b>/10</p></div>
      ${navButtons(false, !!d.feeling)}`;
    if(s===1) return `
      <p class="question">What happened, or what brushed against you?</p>
      <p class="helper">A message. A silence. A thought. A memory. A place. A longing. A small ache. Write it plainly.</p>
      <textarea data-input="stirred" placeholder="What stirred this in me was…">${escapeHtml(d.stirred)}</textarea>
      ${navButtons(true, !!d.stirred.trim())}`;
    if(s===2) return `
      <p class="question">When this feeling arrived, what did my mind begin to say?</p>
      <p class="helper">This replaces “old wiring.” You are not diagnosing yourself. You are simply naming the story that came with the feeling.</p>
      <div class="grid">${stories.map(x=>`<button type="button" class="choice ${d.story===x?'selected':''}" data-set="story" data-value="${escapeAttr(x)}">${x}</button>`).join('')}</div>
      <div class="field"><label>Or write it in your own words</label><textarea data-input="story" placeholder="The story my mind created was…">${escapeHtml(d.story)}</textarea></div>
      ${navButtons(true, !!d.story.trim())}`;
    if(s===3) return `
      <p class="question">Without fighting the story, what do I know for sure?</p>
      <p class="helper">No forced positivity. No “I am okay” if you are not. Just what is honestly true enough to stand on.</p>
      <textarea data-input="truth" placeholder="What I know for sure right now is…">${escapeHtml(d.truth)}</textarea>
      ${navButtons(true, !!d.truth.trim())}`;
    if(s===4) return `
      <p class="question">What longing is underneath this feeling?</p>
      <p class="helper">This is where desire and manifestation become grounded. The feeling may be pointing toward a life your heart is asking for.</p>
      <div class="grid">${longings.map(x=>`<button type="button" class="choice ${d.longing===x?'selected':''}" data-set="longing" data-value="${escapeAttr(x)}">${capitalize(x)}</button>`).join('')}</div>
      <div class="field"><label>Or name the longing yourself</label><input data-input="longing" value="${escapeHtml(d.longing)}" placeholder="I am longing for…"></div>
      ${navButtons(true, !!d.longing.trim())}`;
    if(s===5) return `
      <p class="question">What is one honest thing I can do that does not abandon me?</p>
      <p class="helper">Not a grand promise. A real return. One small choice that belongs to you.</p>
      <div class="grid">${returns.map(([r,sub])=>`<button type="button" class="choice ${d.returnChoice===r?'selected':''}" data-set="returnChoice" data-value="${escapeAttr(r)}">${r}<small>${sub}</small></button>`).join('')}</div>
      <div class="field"><label>Add your own note</label><textarea data-input="returnNote" placeholder="The way I will return to myself is…">${escapeHtml(d.returnNote)}</textarea></div>
      ${navButtons(true, !!(d.returnChoice||d.returnNote.trim()))}`;
    return `
      <p class="question">Let this become a page you can return to.</p>
      <p class="helper">You can keep it simple. The beauty is not decoration alone — it is the fact that you witnessed yourself.</p>
      <div class="field"><label>Page title</label><input data-input="pageTitle" value="${escapeHtml(d.pageTitle)}" placeholder="A title for this moment"></div>
      <div class="field"><label>Reflection</label><textarea data-input="reflection" placeholder="What I want to remember from this check-in is…">${escapeHtml(d.reflection)}</textarea></div>
      <div class="field"><label>Proof I stayed with myself</label><textarea data-input="proof" placeholder="Today’s proof is…">${escapeHtml(d.proof)}</textarea></div>
      <div class="review-grid">
        <div class="field"><label>Paper</label><select data-input="paper"><option value="light" ${d.paper==='light'?'selected':''}>Soft silver page</option><option value="midnight" ${d.paper==='midnight'?'selected':''}>Midnight page</option><option value="mist" ${d.paper==='mist'?'selected':''}>Cool mist page</option></select></div>
        <div class="field"><label>Border</label><select data-input="border"><option value="floral" ${d.border==='floral'?'selected':''}>Violet floral</option><option value="silver" ${d.border==='silver'?'selected':''}>Silver line</option><option value="teal" ${d.border==='teal'?'selected':''}>Cool teal</option></select></div>
      </div>
      <div class="field"><label>Photo <span class="hint">local-only for now</span></label><input type="file" accept="image/*" data-photo></div>
      ${pagePreview(d)}
      <div class="actions"><button type="button" class="ghost" data-prev>Back</button><div class="right"><button type="button" class="secondary" data-tab="journal">Go to journal</button><button type="button" class="primary" data-save-entry>Save page</button></div></div>`;
  }

  function navButtons(back, canNext){ return `<div class="actions">${back?'<button type="button" class="ghost" data-prev>Back</button>':'<span></span>'}<div class="right"><button type="button" class="ghost" data-clear-draft>Start over</button><button type="button" class="primary" data-next ${canNext?'':'disabled'}>Continue</button></div></div>`; }

  function pagePreview(d){
    const title = d.pageTitle || d.feeling || 'A page from today';
    const body = d.reflection || d.truth || d.stirred || 'Your words will appear here.';
    const photo = d.photoData ? `<img class="photo-preview" src="${d.photoData}" alt="journal photo">` : '';
    return `<div class="preview-page ${d.paper} page-border-${d.border}"><div class="flower-row">${escapeHtml(d.flowers||'✦ ❀ ✦')}</div><h4>${escapeHtml(title)}</h4><p><b>${escapeHtml(d.feeling||'')}</b>${d.longing?' · longing '+escapeHtml(d.longing):''}</p>${photo}<div class="hand">${escapeHtml(body).replace(/\n/g,'<br>')}</div></div>`;
  }

  function journalHtml(){
    if(!state.entries.length) return `<section class="card"><h3>Your journal is waiting</h3><p>No saved pages yet. Begin with a check-in, then your entries will appear here as pages you can open and reread.</p><button class="primary" data-start="checkin" type="button">Begin today’s check-in</button></section>`;
    return `<section class="card"><h3>My journal</h3><p>Open any page to reread the full reflection, the story it carried, the longing underneath, and the proof you kept.</p><div class="entries">${state.entries.map(entryCard).join('')}</div></section>`;
  }
  function entryCard(e){
    return `<button type="button" class="entry-card" data-open="${e.id}"><h4>${escapeHtml(e.pageTitle || e.feeling || e.becomingArea || 'Untitled page')}</h4><p>${escapeHtml(shortDate(e.createdAt))}</p><p>${escapeHtml(summary(e))}</p><div class="entry-meta"><span class="pill">${escapeHtml(e.type==='becoming'?'Becoming':'Check-in')}</span>${e.feeling?`<span class="pill">${escapeHtml(e.feeling)}</span>`:''}${e.longing?`<span class="pill">${escapeHtml(e.longing)}</span>`:''}</div></button>`;
  }
  function summary(e){ return e.truth || e.proof || e.reflection || e.becomingVision || e.stirred || 'Open this page to review.'; }

  function becomingHtml(){
    const d = state.draft;
    const checkins = state.entries.filter(e=>e.longing || e.returnChoice || e.proof);
    return `<section class="card"><h3>Becoming</h3><p>This is manifestation made honest: not pretending, but noticing what your feelings keep revealing, then creating proof that you are moving toward the life that feels like yours.</p>
      <div class="review-grid">
        <div class="review-box"><b>Desires appearing in your pages</b><p>${topList(checkins.map(e=>e.longing).filter(Boolean)) || 'No patterns yet.'}</p></div>
        <div class="review-box"><b>Proof you are collecting</b><p>${checkins.slice(0,3).map(e=>escapeHtml(e.proof)).filter(Boolean).join('<br>') || 'Your proof will appear here after saved pages.'}</p></div>
      </div>
    </section>
    <section class="card"><h3>Create a Becoming page</h3><p>Use this when you want to name the woman you are becoming, without forcing belief.</p>
      <div class="field"><label>Life area</label><select data-input="becomingArea"><option value="">Choose one</option>${['Self','Love','Work','Money','Creativity','Health','Home / Travel / Freedom','Purpose'].map(x=>`<option ${d.becomingArea===x?'selected':''}>${x}</option>`).join('')}</select></div>
      <div class="field"><label>What life is calling me?</label><textarea data-input="becomingVision" placeholder="The life calling me feels like…">${escapeHtml(d.becomingVision)}</textarea></div>
      <div class="field"><label>What action belongs to her today?</label><textarea data-input="becomingAction" placeholder="One action that belongs to the woman I am becoming is…">${escapeHtml(d.becomingAction)}</textarea></div>
      <div class="actions"><span></span><button type="button" class="primary" data-save-becoming>Save Becoming page</button></div>
    </section>`;
  }

  function settingsHtml(){
    return `<section class="card"><h3>Settings</h3><p>Firebase is optional. If you sign in, written entries sync to Firestore. Photos remain local-only in V1.2 to avoid Firebase Storage billing.</p>
      <div class="auth"><input data-auth-email placeholder="Email"><input data-auth-pass placeholder="Password" type="password"></div>
      <div class="actions"><div>${state.user?`<button type="button" class="ghost" data-logout>Log out</button>`:''}</div><div class="right"><button type="button" class="secondary" data-login>Log in</button><button type="button" class="ghost" data-export>Export all entries</button></div></div>
      <p class="tiny">Firebase status: ${state.firebaseReady?'ready':'not connected'} · entries saved locally: ${state.entries.length}</p>
    </section>`;
  }

  function modalHtml(e){
    return `<div class="modal" data-close-bg><div class="modal-card"><div class="modal-head"><div><h3>${escapeHtml(e.pageTitle || e.feeling || e.becomingArea || 'Journal page')}</h3><p class="tiny">${escapeHtml(shortDate(e.createdAt))} · ${escapeHtml(e.type==='becoming'?'Becoming page':'Guided check-in')}</p></div><button class="ghost" type="button" data-close>Close</button></div>
      ${e.photoData?`<img class="photo-preview" src="${e.photoData}" alt="journal photo">`:''}
      <div class="review-grid">
        ${box('What was moving in me', e.feeling)}
        ${box('What stirred this', e.stirred)}
        ${box('The story that came with it', e.story)}
        ${box('What I knew for sure', e.truth)}
        ${box('The longing underneath', e.longing)}
        ${box('A way back to myself', e.returnChoice || e.returnNote)}
        ${box('Reflection', e.reflection || e.becomingVision)}
        ${box('Proof I kept', e.proof || e.becomingAction)}
      </div>
      <div class="actions"><button class="danger" type="button" data-delete="${e.id}">Delete page</button><button class="secondary" type="button" data-export-one="${e.id}">Export this page</button></div>
    </div></div>`;
  }
  function box(label, value){ return `<div class="review-box"><b>${label}</b><p>${escapeHtml(value || '—').replace(/\n/g,'<br>')}</p></div>`; }

  app.addEventListener('click', async ev=>{
    const t = ev.target.closest('button'); if(!t) return;
    if(t.dataset.tab){ state.tab=t.dataset.tab; state.modal=null; render(); return; }
    if(t.dataset.start){ clearDraft(); state.tab='home'; state.mode=t.dataset.start; state.draft.type='checkin'; state.step = t.dataset.start==='pulled'?1:0; render(); return; }
    if(t.dataset.set){ state.draft[t.dataset.set]=t.dataset.value; saveDraft(); render(); return; }
    if(t.hasAttribute('data-next')){ if(!t.disabled){ state.step=Math.min(6,state.step+1); saveDraft(); render(); } return; }
    if(t.hasAttribute('data-prev')){ state.step=Math.max(0,state.step-1); saveDraft(); render(); return; }
    if(t.hasAttribute('data-clear-draft')){ if(confirm('Start over with a blank check-in?')){ clearDraft(); render(); } return; }
    if(t.hasAttribute('data-save-entry')){ await saveEntry(); return; }
    if(t.hasAttribute('data-save-becoming')){ await saveBecoming(); return; }
    if(t.dataset.open){ state.modal = state.entries.find(e=>e.id===t.dataset.open); render(); return; }
    if(t.hasAttribute('data-close')){ state.modal=null; render(); return; }
    if(t.dataset.delete){ await deleteEntry(t.dataset.delete); return; }
    if(t.dataset.exportOne){ exportEntries([state.entries.find(e=>e.id===t.dataset.exportOne)]); return; }
    if(t.hasAttribute('data-export')){ exportEntries(state.entries); return; }
    if(t.hasAttribute('data-login')){ await login(); return; }
    if(t.hasAttribute('data-logout')){ await firebase.auth().signOut(); return; }
  });

  app.addEventListener('input', ev=>{
    const el = ev.target;
    if(el.dataset.input){
      state.draft[el.dataset.input] = el.type==='range' ? Number(el.value) : el.value;
      saveDraft();
      if(el.type==='range' || el.tagName==='SELECT') render();
    }
  });
  app.addEventListener('change', ev=>{
    const el = ev.target;
    if(el.hasAttribute('data-photo') && el.files && el.files[0]) readPhoto(el.files[0]);
  });

  async function readPhoto(file){
    if(!file.type.startsWith('image/')) return alert('Please choose an image file.');
    const reader = new FileReader();
    reader.onload = ()=>{ state.draft.photoData = reader.result; saveDraft(); render(); };
    reader.readAsDataURL(file);
  }

  async function saveEntry(){
    const e = Object.assign({}, state.draft);
    e.id = e.id || 'entry_'+Date.now();
    e.createdAt = e.createdAt || new Date().toISOString();
    e.type = 'checkin';
    e.pageTitle = e.pageTitle || `${e.feeling || 'A'} page`;
    upsert(e);
    try{ await saveCloud(e); }catch(err){ alert('Saved locally, but cloud sync failed: '+err.message); }
    clearDraft(); state.tab='journal'; render();
  }
  async function saveBecoming(){
    const d = state.draft;
    if(!d.becomingArea || !d.becomingVision.trim()) return alert('Choose a life area and write what is calling you.');
    const e = Object.assign(freshDraft(), {
      id:'entry_'+Date.now(), type:'becoming', createdAt:new Date().toISOString(),
      pageTitle:`Becoming · ${d.becomingArea}`, becomingArea:d.becomingArea, becomingVision:d.becomingVision, becomingAction:d.becomingAction,
      proof:d.becomingAction, reflection:d.becomingVision
    });
    upsert(e);
    try{ await saveCloud(e); }catch(err){ alert('Saved locally, but cloud sync failed: '+err.message); }
    state.draft.becomingArea=''; state.draft.becomingVision=''; state.draft.becomingAction=''; saveDraft(); state.tab='journal'; render();
  }
  function upsert(e){ const i=state.entries.findIndex(x=>x.id===e.id); if(i>=0) state.entries[i]=e; else state.entries.unshift(e); saveLocal(); }
  async function deleteEntry(id){
    if(!confirm('Delete this page?')) return;
    state.entries = state.entries.filter(e=>e.id!==id); saveLocal(); state.modal=null;
    try{ await deleteCloud(id); }catch(e){}
    render();
  }
  async function login(){
    if(!state.firebaseReady) return alert('Firebase is not connected. Check firebase-config.js and internet connection.');
    const email = app.querySelector('[data-auth-email]')?.value.trim();
    const pass = app.querySelector('[data-auth-pass]')?.value;
    if(!email || !pass) return alert('Enter email and password.');
    try{ await firebase.auth().signInWithEmailAndPassword(email, pass); }
    catch(e){ alert('Login error: '+e.message); }
  }

  function exportEntries(entries){
    const data = JSON.stringify(entries.filter(Boolean), null, 2);
    const blob = new Blob([data], {type:'application/json'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='becoming-room-entries.json'; a.click(); URL.revokeObjectURL(a.href);
  }
  function topList(items){
    const counts={}; items.forEach(x=>counts[x]=(counts[x]||0)+1);
    return Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v])=>`${escapeHtml(k)} (${v})`).join('<br>');
  }
  function shortDate(iso){ if(!iso) return ''; return new Date(iso).toLocaleString([], {dateStyle:'medium', timeStyle:'short'}); }
  function capitalize(s){ return s ? s[0].toUpperCase()+s.slice(1) : ''; }
  function escapeHtml(v){ return String(v||'').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
  function escapeAttr(v){ return escapeHtml(v).replace(/'/g,'&#39;'); }

  init();
})();
