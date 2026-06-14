const STORE_KEY = 'becomingRoomEntriesV1';
const state = {
  screen: 'today',
  draft: {},
  entries: loadEntries()
};

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

function loadEntries(){
  try{return JSON.parse(localStorage.getItem(STORE_KEY) || '[]')}catch(e){return []}
}
function saveEntries(){localStorage.setItem(STORE_KEY, JSON.stringify(state.entries));}
function uid(){return 'entry_' + Date.now() + '_' + Math.random().toString(36).slice(2,7)}
function today(){return new Date().toLocaleDateString(undefined,{weekday:'long',year:'numeric',month:'long',day:'numeric'});}
function esc(s=''){return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function setTitle(text){document.getElementById('screenTitle').textContent = text;}
function main(html){document.getElementById('main').innerHTML = html;}
function buttonGrid(items, key){
  return `<div class="grid">${items.map(item=>`<button class="chip ${state.draft[key]===item?'selected':''}" data-pick="${key}" data-value="${esc(item)}">${esc(item)}</button>`).join('')}</div>`;
}
function wireCommon(){
  document.querySelectorAll('[data-pick]').forEach(btn=>btn.addEventListener('click',()=>{
    state.draft[btn.dataset.pick] = btn.dataset.value;
    render();
  }));
  document.querySelectorAll('[data-save-text]').forEach(el=>el.addEventListener('input',()=> state.draft[el.dataset.saveText] = el.value));
  document.querySelectorAll('[data-select]').forEach(el=>el.addEventListener('change',()=>{state.draft[el.dataset.select] = el.value; render();}));
  document.querySelectorAll('[data-action]').forEach(btn=>btn.addEventListener('click',()=>actions[btn.dataset.action]?.(btn)));
  document.querySelectorAll('input[type="range"][data-range]').forEach(el=>el.addEventListener('input',()=>{
    state.draft[el.dataset.range] = el.value;
    const out = document.querySelector(`[data-range-out="${el.dataset.range}"]`); if(out) out.textContent = el.value;
  }));
  const file = document.querySelector('#photoInput');
  if(file){file.addEventListener('change', handlePhoto)}
}
function setNav(screen){
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active', b.dataset.nav===screen));
}

document.querySelectorAll('.nav-btn').forEach(btn=>btn.addEventListener('click',()=>{
  state.screen = btn.dataset.nav; state.draft = {}; render();
}));

const actions = {
  startDaily(){state.draft.mode='daily'; renderDailyFlow();},
  saveDaily(){
    const e = makeEntry('Daily Clarity');
    e.feeling = state.draft.feeling || '';
    e.reveal = state.draft.reveal || '';
    e.desire = state.draft.desire || '';
    e.truth = state.draft.truth || '';
    e.alignedAction = state.draft.alignedAction || '';
    e.power = state.draft.power || '';
    addEntry(e); state.screen='entries'; state.draft={}; render();
  },
  startTrigger(){state.draft.mode='trigger'; renderTriggerFlow();},
  saveTrigger(){
    const e = makeEntry('Trigger Evidence');
    Object.assign(e, {
      event: state.draft.event || '', fact: state.draft.fact || '', meaning: state.draft.meaning || '',
      body: state.draft.body || '', urge: state.draft.urge || '', intensityBefore: state.draft.intensityBefore || '5',
      regulation: state.draft.regulation || '', test: state.draft.test || '', result: state.draft.result || '',
      intensityAfter: state.draft.intensityAfter || '5', evidence: state.draft.evidence || ''
    });
    addEntry(e); state.screen='entries'; state.draft={}; render();
  },
  saveJournal(){
    const e = makeEntry('Journal Page');
    Object.assign(e, {
      title: state.draft.pageTitle || 'Journal Page', journal: state.draft.journal || '', photo: state.draft.photo || '',
      paper: state.draft.paper || 'lined', border: state.draft.border || 'goldborder', decor: state.draft.decor || 'floral',
      truth: state.draft.highlightTruth || ''
    });
    addEntry(e); state.screen='entries'; state.draft={}; render();
  },
  deleteAll(){
    if(confirm('Delete all saved entries on this browser?')){state.entries=[];saveEntries();render();}
  },
  deleteEntry(btn){
    state.entries = state.entries.filter(e=>e.id!==btn.dataset.id); saveEntries(); render();
  },
  exportEntries(){
    const blob = new Blob([JSON.stringify(state.entries,null,2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='becoming-room-entries.json'; a.click(); URL.revokeObjectURL(url);
  }
};
function makeEntry(type){return {id:uid(), type, date:today(), createdAt:new Date().toISOString()};}
function addEntry(e){state.entries.unshift(e); saveEntries();}

function render(){
  setNav(state.screen);
  if(state.screen==='today') return renderToday();
  if(state.screen==='trigger') return renderTrigger();
  if(state.screen==='journal') return renderJournal();
  if(state.screen==='entries') return renderEntries();
  if(state.screen==='becoming') return renderBecoming();
}
function renderToday(){
  setTitle('What am I feeling, and what is this revealing?');
  main(`<section class="card">
    <h2>Daily Clarity</h2>
    <p class="lead">A short check-in that begins with what is real, then turns it into one grounded action toward the life you are becoming.</p>
    <div class="quote">No forced positivity. Feeling → truth → desire → aligned action.</div>
    <button class="primary" data-action="startDaily">Begin today’s check-in</button>
  </section>
  <section class="card"><h2>Today’s reminder</h2><p>You do not have to believe a new story today. Just observe what is true, and create one piece of evidence.</p></section>`);
  wireCommon();
}
function renderDailyFlow(){
  setTitle('Daily Clarity');
  main(`<section class="card">
    <h2>1. What am I feeling?</h2>
    ${buttonGrid(feelings,'feeling')}
    <h3>2. What might this be revealing?</h3>
    ${buttonGrid(reveals,'reveal')}
    <h3>3. What do I actually want?</h3>
    ${buttonGrid(desires,'desire')}
    <label class="label">4. What feels honestly true today?</label>
    <textarea data-save-text="truth" placeholder="Write the raw truth. It does not need to be pretty.">${esc(state.draft.truth||'')}</textarea>
    <h3>5. What power is available to me today?</h3>
    ${buttonGrid(powers,'power')}
    <label class="label">6. What is one aligned action I can take?</label>
    <textarea data-save-text="alignedAction" placeholder="One action that creates evidence. Not fantasy. Not pressure.">${esc(state.draft.alignedAction||'')}</textarea>
    <div class="row"><button class="primary" data-action="saveDaily">Save check-in</button><button class="secondary" onclick="state.screen='today';state.draft={};render()">Cancel</button></div>
  </section>`); wireCommon();
}
function renderTrigger(){
  setTitle('When I am triggered, I train a different loop.');
  main(`<section class="card">
    <h2>Trigger Mode</h2>
    <p class="lead">Use this when your old wiring is loud: reassurance seeking, overthinking, panic, silence, rejection, jealousy, or feeling unseen.</p>
    <div class="quote">Regulate → observe → interrupt → test → record evidence → repeat.</div>
    <button class="primary" data-action="startTrigger">I’m triggered</button>
  </section>`); wireCommon();
}
function renderTriggerFlow(){
  setTitle('Trigger Evidence Loop');
  const before = state.draft.intensityBefore || '5';
  const after = state.draft.intensityAfter || '5';
  main(`<section class="card">
    <h2>1. What happened?</h2>
    <textarea data-save-text="event" placeholder="Describe the real event. Example: He has not replied. I felt ignored.">${esc(state.draft.event||'')}</textarea>
    <label class="label">Intensity before</label>
    <div class="range-wrap"><input type="range" min="0" max="10" value="${before}" data-range="intensityBefore"><span class="range-value" data-range-out="intensityBefore">${before}</span></div>
    <h3>2. Fact vs Meaning</h3>
    <label class="label">Fact</label><textarea data-save-text="fact" placeholder="Only what objectively happened.">${esc(state.draft.fact||'')}</textarea>
    <label class="label">Meaning my old wiring added</label><textarea data-save-text="meaning" placeholder="Example: I am not important. I am being abandoned.">${esc(state.draft.meaning||'')}</textarea>
    <h3>3. Body signal</h3>${buttonGrid(bodySignals,'body')}
    <h3>4. What urge came up?</h3>${buttonGrid(urges,'urge')}
    <label class="label">5. Regulation used</label>
    <select class="input" data-select="regulation">
      ${['Write only facts','Feet on floor for 30 seconds','Name 5 things I see','Phone face down for 2 minutes','Unclench jaw and shoulders','Step outside','Slow exhale x 5','No regulation yet'].map(x=>`<option ${state.draft.regulation===x?'selected':''}>${x}</option>`).join('')}
    </select>
    <h3>6. Choose a test, not an affirmation</h3>${buttonGrid(tests,'test')}
    <label class="label">7. What actually happened after?</label>
    <textarea data-save-text="result" placeholder="No forced positive result. Record data.">${esc(state.draft.result||'')}</textarea>
    <label class="label">Intensity after</label>
    <div class="range-wrap"><input type="range" min="0" max="10" value="${after}" data-range="intensityAfter"><span class="range-value" data-range-out="intensityAfter">${after}</span></div>
    <label class="label">8. Evidence collected</label>
    <textarea data-save-text="evidence" placeholder="Example: I noticed the pattern. I waited. I separated fact from meaning.">${esc(state.draft.evidence||'')}</textarea>
    <div class="row"><button class="primary" data-action="saveTrigger">Save evidence</button><button class="secondary" onclick="state.screen='trigger';state.draft={};render()">Cancel</button></div>
  </section>`); wireCommon();
}
function renderJournal(){
  setTitle('Create a real journal page.');
  const paper = state.draft.paper || 'lined';
  const border = state.draft.border || 'goldborder';
  const decor = state.draft.decor || 'floral';
  const flowers = decor==='none' ? '' : decor==='minimal' ? '<span class="flower tr">✿</span>' : '<span class="flower tl">✿</span><span class="flower tr">❀</span><span class="flower bl">❦</span><span class="flower br">✿</span><span class="flower center">❀</span>';
  main(`<section class="card">
    <h2>Journal Page</h2>
    <p>Write normally. The saved page can look handwritten, with paper, borders, flowers, and an optional photo.</p>
    <label class="label">Page title</label><input class="input" data-save-text="pageTitle" value="${esc(state.draft.pageTitle||'')}" placeholder="Example: What I finally noticed">
    <label class="label">Your page</label><textarea class="tall" data-save-text="journal" placeholder="Write freely here.">${esc(state.draft.journal||'')}</textarea>
    <label class="label">Truth to highlight</label><input class="input" data-save-text="highlightTruth" value="${esc(state.draft.highlightTruth||'')}" placeholder="One sentence that feels true">
    <label class="label">Add photo</label><input id="photoInput" class="input" type="file" accept="image/*">
    <div class="grid three">
      <select class="input" data-select="paper"><option value="lined" ${paper==='lined'?'selected':''}>Lined</option><option value="rosepaper" ${paper==='rosepaper'?'selected':''}>Rose paper</option><option value="sagepaper" ${paper==='sagepaper'?'selected':''}>Sage paper</option></select>
      <select class="input" data-select="border"><option value="goldborder" ${border==='goldborder'?'selected':''}>Gold border</option><option value="roseborder" ${border==='roseborder'?'selected':''}>Rose border</option><option value="leafborder" ${border==='leafborder'?'selected':''}>Leaf border</option></select>
      <select class="input" data-select="decor"><option value="floral" ${decor==='floral'?'selected':''}>Flowers</option><option value="minimal" ${decor==='minimal'?'selected':''}>Minimal</option><option value="none" ${decor==='none'?'selected':''}>None</option></select>
    </div>
  </section>
  <section class="card flush"><div class="page-preview ${paper} ${border}">${flowers}<div class="page-title">${esc(state.draft.pageTitle||today())}</div>${state.draft.photo?`<img class="photo" src="${state.draft.photo}" alt="Journal photo">`:''}<div class="script">${esc(state.draft.journal||'Your writing will appear here in a cursive journal style.')}</div>${state.draft.highlightTruth?`<div class="quote">${esc(state.draft.highlightTruth)}</div>`:''}</div></section>
  <section class="card"><button class="primary" data-action="saveJournal">Save journal page</button></section>`); wireCommon();
}
function handlePhoto(e){
  const file = e.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = () => { state.draft.photo = reader.result; render(); };
  reader.readAsDataURL(file);
}
function renderEntries(){
  setTitle('My Becoming Timeline');
  const list = state.entries.map(entryHtml).join('') || `<div class="empty">No entries yet. Begin with Today, Triggered, or Page.</div>`;
  main(`<section class="card"><h2>Entries</h2><p>Your saved local journal timeline. This first version saves on this browser only.</p><div class="row"><button class="secondary" data-action="exportEntries">Export JSON</button><button class="danger" data-action="deleteAll">Delete all</button></div></section>${list}`); wireCommon();
}
function entryHtml(e){
  const bits = [e.feeling,e.reveal,e.desire,e.power,e.body,e.urge].filter(Boolean).map(x=>`<span class="badge">${esc(x)}</span>`).join('');
  let body = '';
  if(e.type==='Journal Page') body = `${e.photo?`<img class="photo" src="${e.photo}" alt="Journal photo">`:''}<p>${esc(e.journal||'')}</p>${e.truth?`<div class="quote">${esc(e.truth)}</div>`:''}`;
  if(e.type==='Daily Clarity') body = `<p><strong>Truth:</strong> ${esc(e.truth||'')}</p><p><strong>Aligned action:</strong> ${esc(e.alignedAction||'')}</p>`;
  if(e.type==='Trigger Evidence') body = `<p><strong>Fact:</strong> ${esc(e.fact||'')}</p><p><strong>Meaning:</strong> ${esc(e.meaning||'')}</p><p><strong>Test:</strong> ${esc(e.test||'')}</p><p><strong>Result:</strong> ${esc(e.result||'')}</p><div class="quote">Evidence: ${esc(e.evidence||'')}</div>`;
  return `<section class="card entry"><h4>${esc(e.title||e.type)}</h4><p class="small">${esc(e.date)}</p><div class="badges">${bits}</div>${body}<button class="danger" data-action="deleteEntry" data-id="${e.id}">Delete</button></section>`;
}
function renderBecoming(){
  setTitle('Proof I am becoming her.');
  const triggers = state.entries.filter(e=>e.type==='Trigger Evidence').length;
  const daily = state.entries.filter(e=>e.type==='Daily Clarity').length;
  const pages = state.entries.filter(e=>e.type==='Journal Page').length;
  const evidence = state.entries.filter(e=>e.evidence).slice(0,5);
  main(`<section class="card"><h2>Becoming</h2><p class="lead">Grounded manifestation: not pretending, but creating evidence that you are becoming the woman who can hold the life she wants.</p>
    <div class="grid three"><div class="stat"><strong>${daily}</strong><span class="small">clarity check-ins</span></div><div class="stat"><strong>${triggers}</strong><span class="small">trigger loops</span></div><div class="stat"><strong>${pages}</strong><span class="small">journal pages</span></div></div>
  </section>
  <section class="card"><h2>Future Self Evidence</h2><p>Each saved evidence line is a proof point. Belief is not forced; it is earned through lived data.</p>${evidence.length?evidence.map(e=>`<div class="entry"><p>${esc(e.evidence)}</p><p class="small">${esc(e.date)}</p></div>`).join(''):'<p>No evidence yet. Use Trigger Mode to collect proof.</p>'}</section>
  <section class="card"><h2>Manifestation, grounded</h2><div class="quote">What am I feeling, and what is this revealing about the life I am being called to create?</div><p>Use Daily Clarity when you want to turn a feeling into desire and desire into one aligned action.</p></section>`); wireCommon();
}
render();
