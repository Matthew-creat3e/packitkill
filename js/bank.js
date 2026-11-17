/* Question bank builder, domain-weighted exam sim, and readiness meter */
const DOMAIN_W = {1:16, 2:24, 3:19, 4:27, 5:14};      // SY0-801 official weights
const BANK_GOAL = 450;                               // total Sec+ questions to aim for
const BANK_KEY = "packetkill-v2-bank";
let BANK = {};          // objective code -> [{id,o,q,c,e,t}]
let BANKV = 0;          // bumps on every change so allQuestions() rebuilds
try{ const r=JSON.parse(localStorage.getItem(BANK_KEY)||"{}"); if (r && typeof r==="object") BANK=r; }catch(e){}

function bankAll(){ return Object.values(BANK).flat(); }
function bankSaveLocal(){ try{ localStorage.setItem(BANK_KEY, JSON.stringify(BANK)); }catch(e){} }
function subtopics(code){ return (SUBTOPICS[code]||[]).map(s=>s.trim()).filter(Boolean); }

/* per-objective targets, split by domain weight */
function bankTarget(code){
  const d=+code[0]; const n=OBJECTIVES.filter(o=>o.domain===d).length || 1;
  return Math.ceil(BANK_GOAL*DOMAIN_W[d]/100/n);
}
function secCount(code){ return allQuestions().filter(q=>q.src==="sec"&&q.tag===code).length; }

/* ---------- sync: one private doc per objective ---------- */
const BANKSYNC = { db:null, uid:null, chain:{} };
function bankDoc(code){ return BANKSYNC.db.doc("data/users/"+BANKSYNC.uid+"/pkq_"+code.replace(".","_")); }
function bankPush(code){
  if (!BANKSYNC.db) return;
  const run = ()=>bankDoc(code).set({o:code, qs:BANK[code]||[]}).catch(()=>{});
  BANKSYNC.chain[code] = (BANKSYNC.chain[code]||Promise.resolve()).then(run, run);
}
async function bankStartSync(){
  try{
    const [db,user]=await Promise.all([getCap("db"),getCap("user")]); if(!db||!user) return;
    const uid=await user.id(); if(!uid) return;
    BANKSYNC.db=db; BANKSYNC.uid=uid;
    for (const o of OBJECTIVES){
      try{
        const snap=await bankDoc(o.code).get();
        const remote = snap.exists && Array.isArray((snap.data()||{}).qs) ? snap.data().qs : [];
        const local = BANK[o.code]||[]; const ids=new Set(local.map(q=>q.id));
        const merged = local.concat(remote.filter(q=>q&&q.id&&!ids.has(q.id)));
        const removed = new Set(((S.settings||{}).flagged)||[]);
        BANK[o.code] = merged.filter(q=>!removed.has(q.id));
        if (BANK[o.code].length !== remote.length) bankPush(o.code);
      }catch(e){}
    }
    BANKV++; bankSaveLocal(); if (typeof UI!=="undefined") UI.softRefresh();
  }catch(e){}
}

/* ---------- writing questions with CYPHER ---------- */
function weakTopics(code, existing){
  const text = existing.map(q=>(q.q+" "+q.opts.join(" ")+" "+(q.e||"")).toLowerCase()).join(" ");
  const tally = t=>{ const words=t.toLowerCase().replace(/\(.*?\)/g," ").split(/[^a-z0-9]+/).filter(w=>w.length>3); if(!words.length) return 9; return words.filter(w=>text.includes(w)).length/words.length; };
  return subtopics(code).map(t=>({t, s:tally(t)+Math.random()*0.15})).sort((a,b)=>a.s-b.s).slice(0,6).map(x=>x.t);
}
function cleanQ(x, code){
  if (!x || typeof x.q!=="string" || typeof x.correct!=="string" || !Array.isArray(x.wrong)) return null;
  const wrong = x.wrong.map(w=>String(w).trim()).filter(Boolean).slice(0,3);
  const correct = x.correct.trim();
  if (wrong.length<3 || !correct || x.q.trim().length<20) return null;
  const all=[correct,...wrong].map(s=>s.toLowerCase());
  if (new Set(all).size<4) return null;                          // duplicate options
  if (/all of the above|none of the above/i.test(all.join("|"))) return null;
  return {id:"b"+Date.now().toString(36)+Math.random().toString(36).slice(2,6), o:code, q:x.q.trim().slice(0,700), c:[correct.slice(0,220),...wrong.map(w=>w.slice(0,220))], e:String(x.e||"").trim().slice(0,600), t:String(x.topic||"").slice(0,80)};
}
async function bankWrite(code, n){
  const o=objByCode(code);
  const existing=allQuestions().filter(q=>q.src==="sec"&&q.tag===code);
  const focus=weakTopics(code, existing);
  const stems=existing.slice(-40).map(q=>"- "+q.q.slice(0,140)).join("\n");
  const v = await cyJSON(`You write practice questions for the CompTIA Security+ SY0-801 exam.
Objective ${code}: "${o.t}".
Official subtopics for this objective: ${subtopics(code).join("; ")}.
Write ${n} NEW multiple-choice questions. Cover these subtopics first, one question each: ${focus.join("; ")}.
Rules: realistic workplace scenario in 1-3 sentences, the way CompTIA asks ("best", "most likely", "first"). Exactly one defensible correct answer. Three wrong answers that are real Security+ terms a student could confuse with the right one. No "all/none of the above". Explanation: 1-2 sentences saying why the answer is right and why the closest wrong answer is wrong. Use CompTIA's own terminology.
Do not repeat or reword these existing questions:
${stems||"(none yet)"}
Return {"questions":[{"topic":"subtopic covered","q":"...","correct":"...","wrong":["...","...","..."],"e":"..."}]}`);
  const arr = Array.isArray(v)?v:(v&&v.questions)||[];
  const have = new Set(existing.map(q=>q.q.toLowerCase().slice(0,60)));
  const good = arr.map(x=>cleanQ(x,code)).filter(q=>q && !have.has(q.q.toLowerCase().slice(0,60))).slice(0,n);
  if (!good.length) throw new Error("bad");
  BANK[code]=(BANK[code]||[]).concat(good); BANKV++; QCACHE=null; bankSaveLocal(); bankPush(code);
  return good.length;
}

/* builder loop: fills the objective with the biggest gap, 5 at a time */
const BUILD = { on:false, made:0, msg:"", fails:0 };
function bankGaps(){ return OBJECTIVES.map(o=>({code:o.code, have:secCount(o.code), goal:bankTarget(o.code)})).map(x=>({...x, gap:x.goal-x.have})).filter(x=>x.gap>0).sort((a,b)=>b.gap/b.goal-a.gap/a.goal); }
function buildStatus(text){ BUILD.msg=text; const el=document.getElementById("bankMsg"); if (el) el.textContent=text; const c=document.getElementById("bankCount"); if (c) c.textContent=allQuestions().filter(q=>q.src==="sec").length; }
async function bankBuild(){
  if (BUILD.on) return; BUILD.on=true; BUILD.fails=0;
  if (typeof UI!=="undefined") UI.render();
  while (BUILD.on){
    const g=bankGaps()[0];
    if (!g){ buildStatus("Bank is full: every objective has hit its target."); break; }
    buildStatus(`Writing questions for ${g.code} (${g.have}/${g.goal})…`);
    try{ const k=await bankWrite(g.code, Math.min(5, g.gap)); BUILD.made+=k; BUILD.fails=0; buildStatus(`Added ${k} for ${g.code}. ${BUILD.made} written this session.`); }
    catch(e){
      if (e && e.code==="rate_limited"){ buildStatus("Hit the rate limit. Waiting 60 seconds, then continuing…"); await new Promise(r=>setTimeout(r,60000)); continue; }
      if (e && (e.code==="none"||e.code==="not_granted")){ buildStatus("CYPHER can't reach Ollama. Turn on Mindful, then check CYPHER's ⚙ settings."); break; }
      if (++BUILD.fails>=3){ buildStatus("Stopped after 3 failed tries in a row. Tap BUILD to try again."); break; }
    }
  }
  BUILD.on=false; if (typeof UI!=="undefined") UI.render();
}

/* flag a bad generated question: remove it everywhere */
function flagQuestion(id){
  for (const k of Object.keys(BANK)){ const before=BANK[k].length; BANK[k]=BANK[k].filter(q=>q.id!==id); if (BANK[k].length!==before) bankPush(k); }
  S.extraQ=S.extraQ.filter(q=>q.id!==id);
  S.settings.flagged=((S.settings.flagged)||[]).concat(id).slice(-500);
  delete S.miss[id]; BANKV++; QCACHE=null; bankSaveLocal(); save();
}

/* ---------- domain-weighted exam draw ---------- */
function weightedSecDraw(n){
  const sec=allQuestions().filter(q=>q.src==="sec");
  const by={1:[],2:[],3:[],4:[],5:[]}; for (const q of shuffle(sec)) (by[+q.tag[0]]||[]).push(q);
  const out=[]; const used=new Set();
  for (const d of [1,2,3,4,5]){ const k=Math.round(n*DOMAIN_W[d]/100); for (const q of by[d].slice(0,k)){ out.push(q); used.add(q.id); } }
  for (const q of shuffle(sec)){ if (out.length>=n) break; if (!used.has(q.id)){ out.push(q); used.add(q.id); } }
  return shuffle(out.slice(0,n)).map(q=>q.id);
}

/* ---------- readiness ---------- */
function readiness(){
  const sec=allQuestions().filter(q=>q.src==="sec");
  const sims=S.exams.filter(x=>x.n>=60 && x.by && Object.keys(x.by).some(k=>k[0]==="D")).slice(-3);
  const avg=sims.length? Math.round(sims.reduce((a,x)=>a+x.s,0)/sims.length) : null;
  const last=sims[sims.length-1];
  const weakDom = last ? [1,2,3,4,5].filter(d=>{ const v=last.by["D"+d]; return !v || v[0]/v[1] < .75; }) : [1,2,3,4,5];
  const objOk = OBJECTIVES.filter(o=>{ const s=S.stats[o.code]; return s && s.t>=8 && s.r/s.t>=.8; }).length;
  const pbqOk = SP.PBQS.filter(p=>(S.pbq[p.id]||0)>=80).length;
  const checks = [
    {ok: sec.length>=400, t:`Question bank: ${sec.length} of 400+ Security+ questions`, how:"Build the bank with CYPHER so you're tested on questions you haven't memorized."},
    {ok: objOk>=27, t:`Objectives at 80%+ (8+ answers each): ${objOk} of 27`, how:"Work the weakest objectives on the list below."},
    {ok: sims.length>=3 && avg>=85, t: sims.length? `Last ${sims.length} full exam sims (60+ questions) average ${avg}%. Target 85%+ over 3 sims` : "No full exam sims (60+ questions) taken yet", how:"Take a 90-question sim at least once a week."},
    {ok: !!last && weakDom.length===0, t: last? (weakDom.length? `Domains under 75% on your last sim: ${weakDom.map(d=>d+".0").join(", ")}` : "Every domain at 75%+ on your last sim") : "No domain scores yet", how:"A weak domain can sink you even with a good overall score."},
    {ok: pbqOk>=SP.PBQS.length, t:`Hands-on questions at 80%+: ${pbqOk} of ${SP.PBQS.length}`, how:"Do the PBQ drills until they're automatic."}
  ];
  const score = checks.filter(c=>c.ok).length;
  return {checks, score, ready: score===checks.length, avg};
}
function readinessPanel(){
  const R=readiness();
  return `<div class="panel edge-${R.ready?"green":"gold"}" style="margin-bottom:14px"><div class="ptitle"><span>Exam readiness</span><b style="color:${R.ready?"var(--green)":"var(--gold)"}">${R.ready?"READY TO BOOK":`NOT YET · ${R.score}/5`}</b></div>
    <div class="stack" style="gap:8px">${R.checks.map(c=>`<div class="row" style="align-items:flex-start;gap:10px;flex-wrap:nowrap"><span class="mono" style="color:${c.ok?"var(--green)":"var(--gold)"};min-width:16px">${c.ok?"✓":"○"}</span><div><div>${esc(c.t)}</div>${c.ok?"":`<div class="small muted">${esc(c.how)}</div>`}</div></div>`).join("")}</div>
    <p class="small muted" style="margin:10px 0 0">Book the real exam when all five are green. 85% on questions you haven't seen before is a safe margin over the 750/900 passing score.</p></div>`;
}
function bankPanel(){
  const sec=allQuestions().filter(q=>q.src==="sec").length;
  const doms=[1,2,3,4,5].map(d=>{ const objs=OBJECTIVES.filter(o=>o.domain===d); const have=objs.reduce((a,o)=>a+Math.min(secCount(o.code),bankTarget(o.code)),0), goal=objs.reduce((a,o)=>a+bankTarget(o.code),0); return {d,have,goal}; });
  return `<div class="panel" style="margin-bottom:14px"><div class="ptitle"><span>Question bank builder</span><b><span id="bankCount">${sec}</span> Sec+ questions</b></div>
    <p class="small muted" style="margin-top:0">CYPHER writes new questions aimed at the official subtopics you haven't been tested on yet, split by the real exam weights. They save to your account. If one looks wrong, tap THIS QUESTION IS WRONG after answering it and it's deleted.</p>
    ${doms.map(x=>`<div class="dbar"><span>${x.d}.0 ${esc(SP.DOMAINS[x.d])} · ${DOMAIN_W[x.d]}%</span>${meter(x.have/x.goal*100, x.have>=x.goal?"":"gold")}<span>${x.have}/${x.goal}</span></div>`).join("")}
    <div class="row ai-only" style="margin-top:10px">${BUILD.on?`<button class="btn" data-bank="stop">STOP</button>`:`<button class="btn green" data-bank="go">BUILD THE BANK</button>`}<span class="small muted" id="bankMsg">${esc(BUILD.msg||"Takes a while. Leave this tab open; you can keep studying in it.")}</span></div></div>`;
}
document.addEventListener("click", e=>{
  const b=e.target.closest("[data-bank]"); if (b){ if (b.dataset.bank==="go") bankBuild(); else { BUILD.on=false; buildStatus("Stopping after this batch…"); } }
});
