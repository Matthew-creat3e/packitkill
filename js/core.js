/* ============ PACKETKILL v2 · CORE ============ */
const PK = { version: 2 };
const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];
const esc = s => String(s==null?"":s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function hashStr(s){ let h=2166136261; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return (h>>>0).toString(36); }
function dayStr(d=new Date()){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function addDays(n){ const d=new Date(); d.setDate(d.getDate()+n); return dayStr(d); }

/* ---------- state ---------- */
const DEFAULT_STATE = () => ({
  v:2, xp:0, streak:{last:"", count:0}, activity:{},
  completedLabs:{}, learned:{}, bashDone:{}, sqlDone:{}, sqlCourseDone:{}, completedProjects:{},
  psDone:{}, pyDone:{}, lessonsRead:{}, objDone:{}, missions:{}, campaign:{},
  stats:{}, miss:{}, srs:{}, exams:[], extraQ:[], feyn:{}, pbq:{}, widgets:{},
  settings:{ examDate:"" }
});
let S = DEFAULT_STATE();
window.profile = S;           // legacy engines read/write profile.*
function normalizeState(x){
  const d = DEFAULT_STATE();
  if (!x || typeof x!=="object") return d;
  for (const k of Object.keys(d)){
    if (x[k]===undefined) continue;
    if (Array.isArray(d[k])) d[k] = Array.isArray(x[k]) ? x[k] : d[k];
    else if (typeof d[k]==="object") d[k] = (x[k] && typeof x[k]==="object") ? {...d[k], ...x[k]} : d[k];
    else d[k] = x[k];
  }
  d.exams = d.exams.slice(-20); d.extraQ = d.extraQ.slice(-150);
  return d;
}
function setState(x){ S = normalizeState(x); window.profile = S; }

/* ---------- persistence: this device (plus claude.ai account sync only when opened there) ---------- */
const LS_KEY = "packetkill-v2";
let dbRef=null, saving=false, dirty=false, saveTimer=null, lastRemote="";
function loadLocal(){ try{ const r=localStorage.getItem(LS_KEY); if(r){ setState(JSON.parse(r)); return true; } }catch(e){} return false; }
function saveLocal(){ try{ localStorage.setItem(LS_KEY, JSON.stringify(S)); }catch(e){} }
function setSync(mode, text){ const el=$("#sync"); if(!el) return; el.className="sync "+mode; el.querySelector("span").textContent=text; }
function save(){
  saveLocal(); dirty=true;
  if (!dbRef){ return; }
  setSync("busy","Saving…");
  clearTimeout(saveTimer); saveTimer=setTimeout(flush, 800);
}
window.save = save;
async function flush(){
  if (!dbRef || saving || !dirty) return;
  saving=true; dirty=false;
  const body = JSON.parse(JSON.stringify(S));
  try{ await dbRef.set(body); lastRemote=JSON.stringify(body); setSync("ok","Synced to your account"); }
  catch(e){
    if (e && e.code==="unavailable"){ dirty=true; saving=false; setTimeout(flush, 1500+Math.random()*1500); return; }
    if (e && e.code==="quota_exceeded"){ setSync("local","Account storage is full. Saved on this device"); }
    else setSync("local","Couldn't sync. Saved on this device");
    if (e && ["invalid_argument","revoked","not_granted"].includes(e.code)) dbRef=null;
  }
  saving=false; if (dirty) flush();
}
function getCap(name){
  try{ return (window.claude && typeof window.claude.use==="function") ? window.claude.use(name) : Promise.resolve(null); }
  catch(e){ return Promise.resolve(null); }
}
async function startSync(){
  const [db, user] = await Promise.all([getCap("db"), getCap("user")]);
  if (!db || !user){ setSync("local","Saved on this device"); return; }
  let uid=null; try{ uid = await user.id(); }catch(e){}
  if (!uid){ setSync("local","Sign in to sync. Saved on this device"); return; }
  let ref; try{ ref = db.doc("data/users/"+uid+"/packetkill"); }catch(e){ return; }
  if (typeof bankStartSync==="function") bankStartSync();
  setSync("busy","Connecting…");
  const timer = setTimeout(()=>setSync("local","Can't reach sync yet. Saved on this device"), 10000);
  let first=true;
  ref.onSnapshot(snap=>{
    if (!snap.metadata.fromCache) clearTimeout(timer);
    dbRef = ref;
    if (snap.exists){
      const js = JSON.stringify(snap.data());
      if (snap.metadata.hasPendingWrites || js===lastRemote || dirty || saving){ if(!snap.metadata.fromCache) setSync("ok","Synced to your account"); first=false; return; }
      lastRemote = js;
      const remote = snap.data();
      // keep whichever copy has more progress the first time this device connects
      if (first && (remote.xp||0) < (S.xp||0)) { dirty=true; flush(); }
      else { setState(remote); saveLocal(); UI.softRefresh(); }
      if (!snap.metadata.fromCache) setSync("ok","Synced to your account");
    } else if (first && !snap.metadata.fromCache){
      setSync("ok","Synced to your account");
      if (S.xp>0 || Object.keys(S.activity).length){ dirty=true; flush(); }
    }
    first=false;
  }, ()=>{ clearTimeout(timer); dbRef=null; setSync("local","Sync stopped. Saved on this device"); });
}

/* ---------- XP, ranks, streak ---------- */
// RANKS ported from v30
function rankFor(xp){ let r=RANKS[0], next=null; for(let i=0;i<RANKS.length;i++){ if(xp>=RANKS[i].min){ r=RANKS[i]; next=RANKS[i+1]||null; } } return {r, next}; }
function touchStreak(){
  const t=todayStr(); if (S.streak.last===t) return;
  const y=dayStr(new Date(Date.now()-86400000));
  S.streak.count = S.streak.last===y ? S.streak.count+1 : 1; S.streak.last=t;
}
function addXP(n, why){
  if (!n) return;
  const before = rankFor(S.xp).r.name;
  S.xp += n; touchStreak();
  const t=todayStr(); S.activity[t]=(S.activity[t]||0)+n;
  const keys=Object.keys(S.activity).sort(); if (keys.length>120) for(const k of keys.slice(0,keys.length-120)) delete S.activity[k];
  save(); UI.paintChrome();
  toast(`+${n} XP${why?" · "+why:""}`, "xp");
  const after = rankFor(S.xp).r.name;
  if (after!==before) rankUp(after);
}
function rankUp(name){
  const d=document.createElement("div"); d.className="rankup"; d.setAttribute("role","dialog"); d.setAttribute("aria-label","Rank up");
  d.innerHTML=`<div class="box"><div class="eyebrow">PROMOTION</div><div class="rk">${esc(name)}</div><div class="muted">New rank earned. Keep building.</div><button class="btn gold" style="justify-self:center">CONTINUE</button></div>`;
  document.body.appendChild(d);
  const close=()=>{ d.remove(); document.removeEventListener("keydown",esc1); };
  const esc1=e=>{ if(e.key==="Escape"||e.key==="Enter") close(); };
  d.querySelector("button").onclick=close; d.addEventListener("click",e=>{ if(e.target===d) close(); }); document.addEventListener("keydown",esc1);
  setTimeout(()=>d.querySelector("button").focus(),50);
  burst(true);
}
function burst(big){
  try{ if (window.confetti && !matchMedia("(prefers-reduced-motion: reduce)").matches) confetti({particleCount: big?160:60, spread: big?100:60, origin:{y:.7}, colors:["#3ddc84","#e8b84b","#7dd3fc"]}); }catch(e){}
}
let toastTimer=null;
function toast(msg, type){
  const t=$("#toast"); if(!t) return;
  t.className=(type||"")+" show"; t.textContent=msg;
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.className=(type||""), 1700);
}
window.toast = toast;

/* ---------- question bank (normalized) ---------- */
// {id, src, tag, q, opts, ans, e}
let QCACHE=null;
function allQuestions(){
  const bv=(typeof BANKV!=="undefined"?BANKV:0);
  if (QCACHE && QCACHE.extraN===S.extraQ.length && QCACHE.bv===bv) return QCACHE.list;
  const list=[];
  for (const q of SP.QB){ if (q.o==="code") list.push({id:q.id, src:"code", tag:"code", q:q.q, opts:q.c, ans:0, e:q.e}); else list.push({id:q.id, src:"sec", tag:q.o, q:q.q, opts:q.c, ans:0, e:q.e}); }
  for (const q of S.extraQ) list.push({id:q.id, src:"sec", tag:q.o, q:q.q, opts:q.c, ans:0, e:q.e, gen:true});
  if (typeof bankAll==="function") for (const q of bankAll()) list.push({id:q.id, src:"sec", tag:q.o, q:q.q, opts:q.c, ans:0, e:q.e, gen:true});
  for (const q of QUESTIONS_CCNA) list.push({id:"cc"+hashStr(q.q), src:"ccna", tag:q.d, m:q.m, q:q.q, opts:q.opts, ans:q.ans, e:q.expl});
  for (const q of QUESTIONS_CYBER) list.push({id:"cy"+hashStr(q.q), src:"cyber", tag:q.d, q:q.q, opts:q.opts, ans:q.ans, e:q.expl});
  QCACHE={extraN:S.extraQ.length, bv, list};
  return list;
}
function qById(id){ return allQuestions().find(q=>q.id===id); }
function record(tag, right){ const s=S.stats[tag]||{r:0,t:0}; s.t++; if(right) s.r++; S.stats[tag]=s; }
function recMiss(id, right){ if (right){ if (S.miss[id]){ S.miss[id]--; if(S.miss[id]<=0) delete S.miss[id]; } } else S.miss[id]=(S.miss[id]||0)+1; }
function mastery(tag){ const s=S.stats[tag]; return s&&s.t ? s.r/s.t : null; }

/* ---------- objectives helpers ---------- */
const OBJECTIVES = SP.OBJ.filter(g=>/^\d/.test(g.name)).flatMap(g=>g.items.map(it=>({...it, domain:+g.name[0], dname:g.name.replace(/^\d\.0\s*/,"")})));
function objByCode(c){ return OBJECTIVES.find(o=>o.code===c); }
function objLevel(o){ const m=mastery(o.code), s=S.stats[o.code]; if (S.objDone[o.code] && (m===null||m>=.85)) return 3; if (m===null) return 0; if (s.t<3) return m>=.7?2:1; return m>=.85?3:m>=.7?2:1; }

/* ---------- spaced repetition (v30 ladder) ---------- */
const INTERVALS=[0,1,3,7,16,35,90];
function srsGrade(id, good){
  const s=S.srs[id]||{b:0,d:todayStr()};
  if (good){ s.b=Math.min(s.b+1, INTERVALS.length-1); s.d=addDays(INTERVALS[s.b]); } else { s.b=0; s.d=todayStr(); }
  S.srs[id]=s;
}

/* ---------- CYPHER (local AI tutor via Ollama: no Claude account needed) ---------- */
const CY = { log:[], busy:false, sample:null, ctx:()=>"" };
const CY_PERSONA = `You are CYPHER, the built-in mentor in PACKETKILL, a study app. Your operator is Matthew: a concrete finisher and journeyman laborer moving into IT near Ellsworth AFB, studying for CompTIA Security+ SY0-801 first and CCNA next, working toward a cleared sysadmin or cybersecurity role. He learns by doing, likes job-site comparisons, and wants straight talk. Keep replies short (under 180 words unless asked for more), plain text, short paragraphs or simple dashes, no markdown headings, no emoji. Never invent exam facts; if unsure, say so. When asked for a hint, give a nudge that points the way without giving the full answer or exact command.`;
const AI_KEY = "packetkill-ai";
const AI = Object.assign({ url:"http://localhost:11434", model:"" }, (()=>{ try{ return JSON.parse(localStorage.getItem(AI_KEY))||{}; }catch(e){ return {}; } })());
function aiSave(){ try{ localStorage.setItem(AI_KEY, JSON.stringify({url:AI.url, model:AI.model})); }catch(e){} }
const aiBase = ()=>String(AI.url||"").trim().replace(/\/+$/,"");
const aiClean = t=>String(t||"").replace(/<think>[\s\S]*?(<\/think>|$)/g,"").replace(/\*\*/g,"").replace(/^\s+/,"");
async function aiModels(url){
  const ctl=new AbortController(); const tm=setTimeout(()=>ctl.abort(), 5000);
  try{ const r=await fetch((url||aiBase())+"/api/tags",{signal:ctl.signal}); if(!r.ok) throw new Error("HTTP "+r.status); const j=await r.json(); return (j.models||[]).map(m=>m.name); }
  finally{ clearTimeout(tm); }
}
// same shape the old Claude sampler had: sample(messages|string, {onText}) -> {text}; sample.json(prompt)
function makeOllamaSample(){
  const fn = async (msgs, opts={})=>{
    const messages = typeof msgs==="string" ? [{role:"user", content:msgs}] : msgs;
    let res;
    try{ res = await fetch(aiBase()+"/api/chat",{method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({model:AI.model, messages, stream:true, ...(opts.format?{format:opts.format}:{}), options:{temperature: opts.format?0.4:0.7}})}); }
    catch(e){ CY.sample=null; throw {code:"offline"}; }
    if (!res.ok){ throw {code: res.status===404?"no_model":"http", status:res.status}; }
    const rd=res.body.getReader(), dec=new TextDecoder(); let buf="", text="";
    for(;;){
      const {value, done}=await rd.read(); if (done) break;
      buf+=dec.decode(value,{stream:true}); let i;
      while((i=buf.indexOf("\n"))>=0){ const line=buf.slice(0,i).trim(); buf=buf.slice(i+1); if(!line) continue;
        try{ const j=JSON.parse(line); if (j.error) throw {code:"http", message:j.error}; if (j.message&&j.message.content){ text+=j.message.content; opts.onText&&opts.onText({text:aiClean(text)}); } }catch(e){ if(e&&e.code) throw e; } }
    }
    return {text:aiClean(text)};
  };
  fn.json = async (prompt)=>{ const r=await fn(prompt+"\n\nReply with JSON only, no other text.", {format:"json"}); return JSON.parse(r.text); };
  return fn;
}
async function cyEnsure(){
  if (CY.sample===false && Date.now()-(CY.checked||0)>15000) CY.sample=null;   // Mindful may have come online since
  if (CY.sample===null){
    CY.checked=Date.now();
    let ok=false;
    if (AI.model && aiBase()){ try{ const ms=await aiModels(); ok = ms.includes(AI.model) || ms.some(m=>m.split(":")[0]===AI.model); }catch(e){ ok=false; } }
    CY.sample = ok ? makeOllamaSample() : false;
    document.body.classList.toggle("no-ai", !ok);
    cyPaintStatus();
  }
  return CY.sample;
}
function cyPaintStatus(){
  const el=$("#cyCtxState"); if(!el) return;
  el.textContent = CY.sample ? `● ${AI.model}` : "○ offline";
  el.className = "cy-st "+(CY.sample?"on":"off");
}
const CY_OFFLINE = ()=>`I can't reach Ollama at ${aiBase()||"(no address set)"}. Make sure Mindful is on and Ollama is running, then tap ⚙ to check the settings.`;
/* settings + backup panel inside the CYPHER drawer */
function cySettings(open){
  const p=$("#cySet"); if(!p) return;
  if (open===undefined) open = p.hidden;
  p.hidden=!open; if (!open) return;
  p.innerHTML=`<div class="ptitle"><span>CYPHER · Ollama</span></div>
    <label class="small muted">Ollama address</label>
    <input id="aiUrl" value="${esc(AI.url)}" spellcheck="false" autocapitalize="off" placeholder="http://localhost:11434">
    <div class="small faint">On Mindful: http://localhost:11434 · On your phone: your Tailscale https address</div>
    <div class="row" style="margin-top:8px"><button class="btn sm green" id="aiTest" type="button">CONNECT</button><select id="aiModel" aria-label="Model"><option value="">${AI.model?esc(AI.model):"(connect first)"}</option></select></div>
    <div class="small" id="aiMsg"></div>
    <div class="ptitle" style="margin-top:14px"><span>Progress backup</span></div>
    <div class="small muted">Progress saves in this browser. Export it to move between your phone and PC, or before clearing your browser.</div>
    <div class="row" style="margin-top:8px"><button class="btn sm" id="pkExport" type="button">EXPORT</button><button class="btn sm" id="pkImport" type="button">IMPORT</button><input type="file" id="pkImportIn" accept=".json,application/json" hidden></div>`;
  const msg=t=>{ $("#aiMsg").textContent=t; };
  const fill=(models)=>{ $("#aiModel").innerHTML = models.map(m=>`<option ${m===AI.model?"selected":""}>${esc(m)}</option>`).join(""); };
  const connect=async()=>{
    const url=$("#aiUrl").value.trim().replace(/\/+$/,""); if(!url){ msg("Enter an address."); return; }
    msg("Connecting…");
    try{
      const ms=await aiModels(url);
      if (!ms.length){ msg("Connected, but no models are installed. On Mindful run: ollama pull llama3.1:8b"); return; }
      AI.url=url; if (!ms.includes(AI.model)) AI.model=ms[0]; aiSave(); fill(ms);
      CY.sample=null; await cyEnsure(); msg(`Connected. Using ${AI.model}.`);
    }catch(e){
      msg(location.protocol==="https:" && url.startsWith("http:") && !/\/\/(localhost|127\.0\.0\.1)/.test(url)
        ? "Blocked: this page is https, so a plain http address only works for localhost. Use your Tailscale https address (tailscale serve)."
        : "Can't reach it. Check Ollama is running and OLLAMA_ORIGINS allows this site (see SETUP.md).");
      CY.sample=null; await cyEnsure();
    }
  };
  $("#aiTest").onclick=connect;
  $("#aiModel").onchange=async e=>{ if(!e.target.value) return; AI.model=e.target.value; aiSave(); CY.sample=null; await cyEnsure(); msg("Using "+AI.model+"."); };
  if (AI.model) aiModels().then(fill).catch(()=>{});
  $("#pkExport").onclick=()=>{
    const blob=new Blob([JSON.stringify({app:"packetkill", v:2, at:new Date().toISOString(), state:S},null,1)],{type:"application/json"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`packetkill-backup-${todayStr()}.json`; document.body.appendChild(a); a.click(); a.remove(); toast("Backup downloaded");
  };
  $("#pkImport").onclick=()=>$("#pkImportIn").click();
  $("#pkImportIn").onchange=e=>{ const f=e.target.files[0]; if(!f) return; const r=new FileReader();
    r.onload=()=>{ try{ const j=JSON.parse(r.result); const st=j&&j.state?j.state:j; if(!st||typeof st!=="object"||st.xp===undefined) throw 0;
      if (!confirmImport(st)) return; setState(st); save(); UI.softRefresh?UI.softRefresh():UI.render(); toast("Progress restored"); }catch(_){ toast("That isn't a PACKETKILL backup","err"); } };
    r.readAsText(f); e.target.value=""; };
}
function confirmImport(st){ try{ return window.confirm(`Replace this device's progress (${S.xp||0} XP) with the backup (${st.xp||0} XP)?`); }catch(e){ return true; } }
function cyOpen(prefill, autoSend){
  const p=$("#cypher"); p.classList.add("open"); p.setAttribute("aria-hidden","false");
  $("#cyCtx").textContent = (CY.ctx()||"Direct line open").slice(0,80);
  cyRenderQuick();
  cyEnsure().then(ok=>{ if(!ok && !prefill) cySettings(true); });
  if (!CY.log.length) cyAppend("cy", "CYPHER online. Ask me anything about what you're working on. I can explain, give hints without spoiling the answer, or quiz you.");
  if (prefill){ $("#cyIn").value=prefill; if (autoSend) cySend(); }
  setTimeout(()=>$("#cyIn").focus(), 200);
}
function cyClose(){ const p=$("#cypher"); p.classList.remove("open"); p.setAttribute("aria-hidden","true"); }
function cyAppend(who, text){
  const el=document.createElement("div"); el.className="msg "+(who==="me"?"me":"cy"); el.textContent=text;
  $("#cyLog").appendChild(el); $("#cyLog").scrollTop=1e9; return el;
}
function cyRenderQuick(){
  const c = CY.ctx();
  const q = c ? ["Explain this simply","Give me a hint","Quiz me on this","Why does this matter on the job?"] : ["What should I study today?","Quiz me on Security+","Explain subnetting"];
  $("#cyQuick").innerHTML = q.map(x=>`<button type="button" data-cyq="${esc(x)}">${esc(x)}</button>`).join("");
}
async function cySend(textOverride){
  const inp=$("#cyIn"); const text=(textOverride||inp.value).trim(); if(!text||CY.busy) return;
  inp.value=""; cyAppend("me", text);
  const sample = await cyEnsure();
  if (!sample){ cyAppend("cy", CY_OFFLINE()); cySettings(true); return; }
  CY.busy=true; const out=cyAppend("cy","…");
  const ctx = CY.ctx();
  CY.log.push({role:"user", content: text});
  const msgs = CY.log.slice(-10).map((m,i,arr)=> i===0 ? {role:m.role, content: `${CY_PERSONA}\n\nWhat Matthew is looking at right now: ${ctx||"the PACKETKILL home screen"}\n\n${m.content}`} : m);
  if (msgs[0].role!=="user") msgs.shift();
  try{
    const res = await sample(msgs, { onText:({text})=>{ out.textContent=text; $("#cyLog").scrollTop=1e9; } });
    const t=(res && res.text ? res.text : out.textContent).replace(/\*\*/g,"");
    out.textContent=t; CY.log.push({role:"assistant", content:t});
  }catch(e){
    out.textContent = e && e.code==="offline" ? CY_OFFLINE() : e && e.code==="no_model" ? `Ollama doesn't have the model "${AI.model}". Tap ⚙ and pick another.` : "Connection dropped. Try again.";
    CY.log.pop();
  }finally{ CY.busy=false; }
}
// one-shot JSON ask (question generation, grading)
async function cyJSON(prompt){
  const sample = await cyEnsure(); if(!sample) throw {code:"none"};
  if (typeof sample.json==="function"){ try{ const v=await sample.json(prompt); if(v&&typeof v==="object") return v; }catch(e){ if(e&&(e.code==="offline"||e.code==="no_model")) throw {code:"none"}; } }
  const r = await sample(prompt+"\n\nReply with JSON only, no other text.");
  const m=(r.text||"").match(/\{[\s\S]*\}|\[[\s\S]*\]/); if(!m) throw new Error("no json"); return JSON.parse(m[0]);
}
async function cyOnce(prompt, onText){
  const sample = await cyEnsure(); if(!sample) throw {code:"none"};
  const r = await sample(prompt, {onText: onText?({text})=>onText(text):undefined});
  return r.text||"";
}
document.addEventListener("click", e=>{
  const b=e.target.closest("[data-cypher]"); if (b){ const a=b.dataset.cypher; if (a==="open") cyOpen(); else if (a==="settings"){ if(!$("#cypher").classList.contains("open")) cyOpen(); cySettings(); } else cyClose(); }
  const q=e.target.closest("[data-cyq]"); if (q) cySend(q.dataset.cyq);
  const a=e.target.closest("[data-ask]"); if (a){ e.preventDefault(); cyOpen(a.dataset.ask, true); }
});
document.addEventListener("submit", e=>{ if (e.target.id==="cyForm"){ e.preventDefault(); cySend(); } });
document.addEventListener("keydown", e=>{
  if (e.target.id==="cyIn" && e.key==="Enter" && !e.shiftKey){ e.preventDefault(); cySend(); }
  if (e.key==="Escape" && $("#cypher").classList.contains("open")) cyClose();
});
