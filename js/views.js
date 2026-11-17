/* ============ PACKETKILL v2 · VIEWS ============ */
const NAV = [
  {id:"hq", l:"HQ", ic:"◆"},
  {id:"secplus", l:"SEC+", ic:"⛨"},
  {id:"ccna", l:"CCNA", ic:"⇄"},
  {id:"labs", l:"LABS", ic:">_"},
  {id:"code", l:"CODE", ic:"{}"},
  {id:"ops", l:"OPS", ic:"☰"},
  {id:"armory", l:"ARMORY", ic:"▣"}
];
const TABBAR = ["hq","secplus","ccna","labs","armory"];
const UI = {
  view:"hq", sub:{}, quiz:null, from:"hq",
  go(v, sub){ if (sub) UI.sub[v]=sub; if (location.hash.slice(1)===v){ UI.render(); } else location.hash=v; },
  current(){ const h=location.hash.slice(1); return NAV.some(n=>n.id===h)||h==="quiz" ? h : "hq"; },
  render(){
    UI.view = UI.current();
    if (UI.view==="quiz" && !UI.quiz){ location.replace("#hq"); return; }
    const v=$("#view");
    clearInterval(UI.timer);
    CY.ctx = ()=>"";
    const fn = VIEWS[UI.view] || VIEWS.hq;
    v.innerHTML = fn();
    if (VIEWS[UI.view+"After"]) VIEWS[UI.view+"After"]();
    UI.paintChrome();
    v.scrollTop=0;
  },
  softRefresh(){ UI.paintChrome(); const busy = UI.view==="quiz" || UI.view==="labs" && UI.sub.labs && UI.sub.labs.open || UI.view==="ops" && UI.sub.ops && UI.sub.ops.open || UI.view==="code" && UI.sub.code && UI.sub.code.open; if (!busy && !document.activeElement.matches("input,textarea,select")) UI.render(); },
  paintChrome(){
    const {r,next}=rankFor(S.xp); const pct = next ? (S.xp-r.min)/(next.min-r.min)*100 : 100;
    const cur=UI.current()==="quiz"?UI.from:UI.current();
    $("#railNav").innerHTML = NAV.map(n=>`<button class="nav-btn" data-go="${n.id}" ${n.id===cur?'aria-current="page"':""}><span class="ic">${n.ic}</span><span>${n.l}</span><span class="badge">${navBadge(n.id)}</span></button>`).join("");
    $("#tabbar").innerHTML = TABBAR.map(id=>{ const n=NAV.find(x=>x.id===id); return `<button class="tab-btn" data-go="${id}" ${id===cur||(id==="labs"&&(cur==="code"||cur==="ops"))?'aria-current="page"':""}><span class="ic">${n.ic}</span>${n.l}</button>`; }).join("");
    $("#opMini").innerHTML = `<div class="r1"><span class="rank">${esc(r.name)}</span><span class="xp">${S.xp.toLocaleString()} XP</span></div><div class="xpbar"><b style="width:${pct}%"></b></div><div class="row"><span class="streak">${S.streak.count?"▲ "+S.streak.count+" day streak":"start a streak today"}</span><span class="spacer"></span><span class="xp">${next?"next "+esc(next.name):"max rank"}</span></div>`;
    $("#tbRank").innerHTML = `${esc(r.name)}<small>${S.xp.toLocaleString()} XP${S.streak.count?" · ▲"+S.streak.count:""}</small>`;
    $("#tbXp").style.width = pct+"%";
  }
};
function navBadge(id){
  if (id==="armory"){ const d=dueCards("all").length; return d? d+" due":""; }
  if (id==="secplus"){ const m=OBJECTIVES.filter(o=>objLevel(o)===3).length; return m+"/27"; }
  if (id==="ccna"){ return Object.keys(S.campaign).filter(k=>S.campaign[k].score>=80).length+"/8"; }
  return "";
}
document.addEventListener("click", e=>{
  const g=e.target.closest("[data-go]"); if (g){ e.preventDefault(); const sub=g.dataset.sub?JSON.parse(g.dataset.sub):null; if (sub) UI.sub[g.dataset.go]=sub; else if(g.closest("#railNav,#tabbar")) UI.sub[g.dataset.go]={}; UI.go(g.dataset.go); }
});
window.addEventListener("hashchange", ()=>{ UI.render(); window.scrollTo(0,0); });
const VIEWS = {};

/* ---------- shared bits ---------- */
function head(eyebrow, title, sub, right){ return `<div class="vhead"><div><div class="eyebrow">${eyebrow}</div><h1 class="vtitle">${title}</h1>${sub?`<p class="vsub">${sub}</p>`:""}</div>${right||""}</div>`; }
function crumbs(view, label){ return `<div class="crumbs"><button data-go="${view}" data-sub="{}">◀ ${esc(label)}</button></div>`; }
function meter(p, cls){ return `<div class="meter ${cls||""}"><b style="width:${Math.max(0,Math.min(100,p))}%"></b></div>`; }
function pct(n){ return n==null?"–":Math.round(n*100)+"%"; }

/* =========================== HQ =========================== */
VIEWS.hq = function(){
  const {r,next}=rankFor(S.xp); const p = next ? (S.xp-r.min)/(next.min-r.min) : 1;
  const C=2*Math.PI*52;
  const labsDone = Object.keys(S.completedLabs).length + Object.keys(S.psDone).length + Object.keys(S.bashDone).length + Object.keys(S.sqlDone).length + Object.keys(S.pyDone).length;
  const tot = Object.values(S.stats).reduce((a,s)=>({r:a.r+s.r,t:a.t+s.t}),{r:0,t:0});
  const missionsDone = MISSIONS_V2.filter(m=>S.missions[m.id]&&S.missions[m.id].done).length;
  const due = dueCards("all").length;
  const weakObj = OBJECTIVES.slice().sort((a,b)=>(mastery(a.code)??-1)-(mastery(b.code)??-1)).find(o=>objLevel(o)<3);
  const lastLab = Object.keys(S.completedLabs).length;
  const nextIos = CLI_LABS.find(l=>!S.completedLabs[l.id]);
  const nextPs = PS_LABS.find(l=>!S.psDone[l.id]);
  const nextMission = MISSIONS_V2.find(m=>!(S.missions[m.id]&&S.missions[m.id].done));
  const ops = [
    {ic:"10", t:"Daily 10-question drill", s:"Mixed Security+, CCNA and cyber. Locks today's streak.", act:"daily"},
    due ? {ic:"▣", t:`${due} flashcard${due>1?"s":""} due`, s:"Spaced repetition: review before you forget", go:"armory", sub:{tab:"cards"}} : {ic:"▣", t:"Start a flashcard deck", s:"Security+ acronyms, ports, event IDs", go:"armory", sub:{tab:"cards"}},
    weakObj ? {ic:"⛨", t:`Sec+ ${weakObj.code} · ${weakObj.t}`, s: mastery(weakObj.code)==null?"Not tested yet":"Your weakest objective at "+pct(mastery(weakObj.code)), go:"secplus", sub:{obj:weakObj.code}} : null,
    nextPs ? {ic:"PS", t:`PowerShell lab ${nextPs.n}: ${nextPs.t}`, s:"Active Directory help desk work", go:"labs", sub:{tab:"ps", open:nextPs.id}} : null,
    nextMission ? {ic:"☰", t:nextMission.title, s:nextMission.tag, go:"ops", sub:{open:nextMission.id}} : null
  ].filter(Boolean);
  const days=[...Array(14)].map((_,k)=>{ const d=dayStr(new Date(Date.now()-(13-k)*86400000)); return {d, v:S.activity[d]||0}; });
  const maxV=Math.max(50,...days.map(x=>x.v));
  CY.ctx = ()=>`HQ dashboard. Rank ${r.name}, ${S.xp} XP, ${S.streak.count}-day streak, weakest Sec+ objective ${weakObj?weakObj.code+" "+weakObj.t:"none"}.`;
  return `${head("// OPERATOR HERRMAN.M · SECURE · ONLINE", "Command HQ", "Security+ SY0-801 first, CCNA next. Every lab, drill and mission feeds your rank.")}
  <div class="stack">
    <div class="two">
      <div class="panel edge-gold"><div class="hq-hero">
        <div class="ring"><svg width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" stroke="#1a2424" stroke-width="9" fill="none"/><circle cx="60" cy="60" r="52" stroke="#e8b84b" stroke-width="9" fill="none" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-p)}"/></svg><div class="rc"><div><b>${esc(r.name)}</b><span>${S.xp.toLocaleString()} XP</span></div></div></div>
        <div class="stack" style="gap:10px;width:100%">
          <div class="small muted">${next?`<b style="color:var(--gold)">${(next.min-S.xp).toLocaleString()} XP</b> to ${esc(next.name)}`:"Top rank. CIPHER."}</div>
          <div class="stats4"><div class="stat"><b style="color:var(--orange)">${S.streak.count}</b><span>day streak</span></div><div class="stat"><b>${labsDone}</b><span>labs done</span></div><div class="stat"><b style="color:var(--cyan)">${tot.t?Math.round(100*tot.r/tot.t)+"%":"–"}</b><span>accuracy</span></div><div class="stat"><b style="color:var(--green)">${missionsDone}/${MISSIONS_V2.length}</b><span>missions</span></div></div>
          <svg viewBox="0 0 280 40" style="width:100%;height:40px" role="img" aria-label="XP earned over the last 14 days">${days.map((x,k)=>`<rect x="${k*20+2}" y="${38-34*x.v/maxV}" width="14" height="${Math.max(2,34*x.v/maxV)}" rx="2" fill="${x.d===todayStr()?"#e8b84b":"#1d6b43"}"><title>${x.d}: ${x.v} XP</title></rect>`).join("")}</svg>
        </div></div></div>
      <div class="panel edge-green"><div class="brief"><div class="cy-avatar">C</div><div><div class="eyebrow">CYPHER · DIRECT LINE</div><div>${S.xp? "Welcome back, operator. Here's today's work." : "Welcome to the new PACKETKILL, operator. Start with the daily drill, then pick a lab."}</div></div></div>
        <div class="ops-list">${ops.map(o=>`<button class="op-item" ${o.act?`data-act="${o.act}"`:`data-go="${o.go}" data-sub='${JSON.stringify(o.sub)}'`}><span class="oi">${o.ic}</span><span>${esc(o.t)}<small>${esc(o.s)}</small></span><span class="faint">▶</span></button>`).join("")}</div></div>
    </div>
    ${(()=>{ const R=readiness(); return `<button class="panel edge-${R.ready?"green":"gold"}" data-go="secplus" style="display:block;width:100%;text-align:left;cursor:pointer"><div class="ptitle"><span>Security+ exam readiness</span><b style="color:${R.ready?"var(--green)":"var(--gold)"}">${R.ready?"READY TO BOOK":R.score+" / 5 checks"}</b></div>${meter(R.score/5*100, R.ready?"":"gold")}<div class="small muted" style="margin-top:6px">${esc((R.checks.find(c=>!c.ok)||{t:"All checks green. Book it."}).t)}</div></button>`; })()}
    <div class="panel"><div class="ptitle"><span>Security+ SY0-801 · objective map</span><b>${OBJECTIVES.filter(o=>objLevel(o)===3).length} / 27 mastered</b></div>
      <div class="heat">${OBJECTIVES.map(o=>`<button class="h${objLevel(o)}" data-go="secplus" data-sub='{"obj":"${o.code}"}' title="${esc(o.code+" "+o.t)}" aria-label="${esc(o.code+" "+o.t)}">${o.code}</button>`).join("")}</div>
      <div class="legend" style="margin-top:8px"><span><i style="background:#0c1213;border:1px solid #1f2b2b"></i>not tested</span><span><i style="background:#2a1512"></i>under 70%</span><span><i style="background:#2a2310"></i>70 to 84%</span><span><i style="background:#0f3a24"></i>mastered (85%+)</span></div></div>
    <div class="grid">
      ${tile("secplus","⛨","Security+","27 objectives, visual explainers, hands-on questions, exam sim","",`${OBJECTIVES.filter(o=>objLevel(o)===3).length}/27 mastered`)}
      ${tile("ccna","⇄","CCNA","8-mission campaign, subnet lab, packet walk, 46 lessons","cyan",`${Object.keys(S.campaign).filter(k=>S.campaign[k].score>=80).length}/8 missions`)}
      ${tile("labs","&gt;_","Terminal labs","Cisco IOS, Bash, PowerShell + AD, SQL. Type real commands.","gold",`${labsDone} done`)}
      ${tile("code","{ }","Python","Real Python in the browser with hidden tests, plus guided builds","violet",`${Object.keys(S.pyDone).length}/${PY_EX.length} exercises`)}
      ${tile("ops","☰","Missions","Story-driven incident response at Fort Granite","red",`${missionsDone}/${MISSIONS_V2.length} complete`)}
      ${tile("armory","▣","Armory","Flashcards, drills, exam sim, command match, the Vault","",`${due} cards due`)}
    </div>
  </div>`;
};
function tile(go, ic, t, p, cls, foot, sub){ return `<button class="tile ${cls}" data-go="${go}" ${sub?`data-sub='${JSON.stringify(sub)}'`:""}><span class="t-ic">${ic}</span><h3>${t}</h3><p>${p}</p><div class="t-foot"><span class="chip">${foot||""}</span><span class="faint">▶</span></div></button>`; }
document.addEventListener("click", e=>{ const b=e.target.closest('[data-act="daily"]'); if(b){ startQuiz({title:"Daily drill", pool: dailyPool(), mode:"study", from:"hq", daily:true}); } });
function dailyPool(){
  const all=allQuestions().filter(q=>q.src!=="code");
  const weak=all.filter(q=>S.miss[q.id]); const sec=all.filter(q=>q.src==="sec"), net=all.filter(q=>q.src!=="sec");
  const pick=[...shuffle(weak).slice(0,3), ...shuffle(sec).slice(0,5), ...shuffle(net).slice(0,5), ...shuffle(all).slice(0,10)].filter((q,i,a)=>a.findIndex(x=>x.id===q.id)===i);
  return shuffle(pick.slice(0,10)).map(q=>q.id);
}

/* =========================== QUIZ ENGINE =========================== */
function startQuiz(o){
  if (!o.pool.length){ toast("No questions match that yet","err"); return; }
  UI.from = o.from || UI.current();
  UI.quiz = {title:o.title, ids:o.pool, i:0, mode:o.mode||"study", perm:{}, ans:{}, flag:{}, right:0, done:false, daily:o.daily, end: o.mode==="exam" ? Date.now()+o.pool.length*60000 : null, onDone:o.onDone, xpEach: o.xpEach ?? 5, passMark:o.passMark};
  o.pool.forEach(id=>{ const q=qById(id); if(q) UI.quiz.perm[id]=shuffle(q.opts.map((_,k)=>k)); });
  location.hash="quiz";
}
VIEWS.quiz = function(){
  const Q=UI.quiz;
  if (Q.done) return quizResults();
  const q=qById(Q.ids[Q.i]); const perm=Q.perm[q.id];
  const picked=Q.ans[q.id]; const reveal = Q.mode==="study" && picked!==undefined;
  CY.ctx = ()=>`a practice question (${q.src==="sec"?"Security+ "+q.tag:q.tag}): "${q.q}" Options: ${q.opts.join(" | ")}.${reveal?` Matthew picked "${q.opts[picked]}". Correct: "${q.opts[q.ans]}".`:" He hasn't answered yet, so don't reveal the answer."}`;
  const bar = Q.ids.map((id,k)=>{ const a=Q.ans[id]; const qq=qById(id); return `<i class="${k===Q.i?"cur":a===undefined?"":Q.mode==="exam"?"cur":a===qq.ans?"ok":"no"}"></i>`; }).join("");
  return `${crumbs(UI.from, "Leave "+(Q.mode==="exam"?"exam":"drill"))}
  <div class="panel q-card">
    <div class="q-meta"><span>${esc(Q.title.toUpperCase())} · ${Q.i+1}/${Q.ids.length}</span>${Q.mode==="exam"?`<span class="timer" id="qtimer"></span>`:`<span>${Q.right} right</span>`}<span>${q.src==="sec"?"SEC+ "+esc(q.tag):q.src==="code"?"CODE":esc(String(q.tag).toUpperCase())}${q.gen?" · CYPHER-WRITTEN":""}</span></div>
    <div class="qbar">${bar}</div>
    <p class="q-text">${esc(q.q)}</p>
    <div class="opts">${perm.map((oi,k)=>{ let c="opt"; if (reveal){ if(oi===q.ans) c+=" right"; else if(oi===picked) c+=" wrong"; } else if (picked===oi) c+=" sel"; return `<button class="${c}" data-opt="${oi}" ${reveal?"disabled":""}><b>${"ABCD"[k]||k+1}</b><span>${esc(q.opts[oi])}</span></button>`; }).join("")}</div>
    ${reveal?`<div class="fb ${picked===q.ans?"":"bad"}"><p><b>${picked===q.ans?"Correct.":"Not quite. Answer: "+esc(q.opts[q.ans])}</b></p><p>${esc(q.e||"")}</p></div><div class="row ai-only"><button class="btn sm ghost" data-ask="${esc(`Explain this question more simply, and why the wrong options are wrong: "${q.q}" Correct answer: "${q.opts[q.ans]}".`)}">ASK CYPHER WHY</button>${q.gen?`<button class="btn sm ghost" data-qbad="${esc(q.id)}">THIS QUESTION IS WRONG</button>`:""}</div>`:""}
    <div class="row">
      ${Q.mode==="exam"?`<button class="btn sm" data-qn="-1" ${Q.i===0?"disabled":""}>◀ BACK</button><button class="btn sm" data-qflag="1">${Q.flag[q.id]?"UNFLAG":"FLAG"}</button>${Q.i<Q.ids.length-1?`<button class="btn sm green" data-qn="1">NEXT ▶</button>`:""}<span class="spacer"></span><button class="btn sm gold" data-qsubmit="1">SUBMIT</button>`
        : reveal?`<span class="spacer"></span><button class="btn green" data-qn="1">${Q.i<Q.ids.length-1?"NEXT ▶":"FINISH"}</button>`:`<span class="faint tiny">Keys: A–D or 1–4 · Enter for next</span>`}
    </div>
    ${Q.mode==="exam"?`<div class="navgrid">${Q.ids.map((id,k)=>`<button data-qjump="${k}" class="${Q.ans[id]!==undefined?"ans":""} ${Q.flag[id]?"flag":""} ${k===Q.i?"cur":""}" aria-label="Question ${k+1}">${k+1}</button>`).join("")}</div>`:""}
  </div>`;
};
VIEWS.quizAfter = function(){
  const Q=UI.quiz; if (!Q || Q.mode!=="exam" || Q.done) return;
  const tick=()=>{ const el=$("#qtimer"); const left=Q.end-Date.now(); if(el){ const m=Math.floor(Math.max(0,left)/60000), s=Math.floor(Math.max(0,left)%60000/1000); el.textContent=`${m}:${String(s).padStart(2,"0")}`; el.classList.toggle("low",left<120000); } if(left<=0){ clearInterval(UI.timer); finishQuiz(); } };
  tick(); UI.timer=setInterval(tick,1000);
};
function answerQ(oi){
  const Q=UI.quiz; const q=qById(Q.ids[Q.i]);
  if (Q.mode==="study"){ if (Q.ans[q.id]!==undefined) return; Q.ans[q.id]=oi; const ok=oi===q.ans; if(ok){ Q.right++; } record(q.tag, ok); recMiss(q.id, ok); if (ok) { S.xp+=Q.xpEach; touchStreak(); const t=todayStr(); S.activity[t]=(S.activity[t]||0)+Q.xpEach; } save(); UI.paintChrome(); }
  else Q.ans[q.id]=oi;
  UI.render();
}
function finishQuiz(){
  const Q=UI.quiz; clearInterval(UI.timer);
  if (Q.mode==="exam"){ Q.right=0; for(const id of Q.ids){ const q=qById(id); const ok=Q.ans[id]===q.ans; if(ok) Q.right++; record(q.tag, ok); recMiss(id, ok); } }
  Q.done=true; Q.score=Math.round(100*Q.right/Q.ids.length);
  const by={}; for(const id of Q.ids){ const q=qById(id); const k=q.src==="sec"?"D"+q.tag[0]:q.src.toUpperCase(); by[k]=by[k]||[0,0]; by[k][1]++; if(Q.ans[id]===q.ans) by[k][0]++; }
  Q.by=by;
  if (Q.mode==="exam"){ S.exams.push({d:todayStr(), n:Q.ids.length, s:Q.score, by}); S.exams=S.exams.slice(-20); addXP(Q.right*6, "Exam sim"); }
  else if (Q.daily) addXP(25, "Daily drill done");
  else if (Q.right) toast(`${Q.right} right · +${Q.right*Q.xpEach} XP`, "xp");
  if (Q.score>=80) burst(false);
  if (Q.onDone) Q.onDone(Q);
  save(); UI.render();
}
function quizResults(){
  const Q=UI.quiz; const missed=Q.ids.map(qById).filter(q=>Q.ans[q.id]!==q.ans);
  const label=k=>k[0]==="D"? "Domain "+k[1]+" · "+(SP.DOMAINS[k[1]]||"") : k;
  return `${crumbs(UI.from,"Back")}
  <div class="panel edge-${Q.score>=85?"green":"gold"} stack">
    <div class="row"><div><div class="eyebrow">${esc(Q.title)} · RESULTS</div><div style="font-family:var(--display);font-size:56px;font-weight:700;line-height:1;color:${Q.score>=85?"var(--green)":"var(--gold)"}">${Q.score}%</div><div class="muted">${Q.right} of ${Q.ids.length} correct${Q.passMark?` · ${Q.score>=Q.passMark?"PASSED":"need "+Q.passMark+"% to unlock the next mission"}`:Q.mode==="exam"?` · ${Q.score>=85?"ready range":"aim for 85% before booking"}`:""}</div></div></div>
    ${Object.keys(Q.by).sort().map(k=>{ const [a,b]=Q.by[k]; const p=a/b*100; return `<div class="dbar"><span>${esc(label(k))}</span>${meter(p, p>=85?"":"gold")}<span>${a}/${b}</span></div>`; }).join("")}
    <div class="row"><button class="btn green" data-qagain="1">GO AGAIN</button>${missed.length?`<button class="btn" data-qmissed="1">PRACTICE THE ${missed.length} I MISSED</button>`:""}<button class="btn ghost" data-go="${UI.from}">DONE</button></div>
  </div>
  ${missed.length?`<div class="stack" style="margin-top:14px"><div class="ptitle"><span>Review</span></div>${missed.map(q=>`<div class="panel"><div class="q-meta"><span>${q.src==="sec"?"SEC+ "+esc(q.tag):esc(q.tag)}</span><span>${Q.ans[q.id]===undefined?"not answered":"you chose: "+esc(q.opts[Q.ans[q.id]])}</span></div><p style="margin:6px 0"><b>${esc(q.q)}</b></p><p class="small" style="margin:0">Answer: <b style="color:var(--green)">${esc(q.opts[q.ans])}</b>. ${esc(q.e||"")}</p></div>`).join("")}</div>`:""}`;
}
document.addEventListener("click", e=>{
  if (UI.view!=="quiz") return;
  const Q=UI.quiz; if(!Q) return;
  const o=e.target.closest("[data-opt]"); if (o && !o.disabled){ answerQ(+o.dataset.opt); return; }
  const n=e.target.closest("[data-qn]"); if (n){ const d=+n.dataset.qn; if (Q.mode==="study" && d>0 && Q.i===Q.ids.length-1){ finishQuiz(); return; } Q.i=Math.max(0,Math.min(Q.ids.length-1,Q.i+d)); UI.render(); return; }
  if (e.target.closest("[data-qflag]")){ const id=Q.ids[Q.i]; Q.flag[id]=!Q.flag[id]; UI.render(); return; }
  const j=e.target.closest("[data-qjump]"); if (j){ Q.i=+j.dataset.qjump; UI.render(); return; }
  const s=e.target.closest("[data-qsubmit]"); if (s){ const un=Q.ids.filter(id=>Q.ans[id]===undefined).length; if (un && !s.dataset.sure){ s.dataset.sure="1"; s.textContent=un+" UNANSWERED · SUBMIT?"; return; } finishQuiz(); return; }
  if (e.target.closest("[data-qagain]")){ startQuiz({title:Q.title, pool:shuffle(Q.ids), mode:Q.mode, from:UI.from, daily:Q.daily, onDone:Q.onDone, passMark:Q.passMark}); return; }
  if (e.target.closest("[data-qmissed]")){ startQuiz({title:"Missed questions", pool:Q.ids.filter(id=>Q.ans[id]!==qById(id).ans), mode:"study", from:UI.from}); return; }
});
document.addEventListener("keydown", e=>{
  if (UI.view!=="quiz" || !UI.quiz || UI.quiz.done) return;
  if (e.target.matches("input,textarea,select")||e.metaKey||e.ctrlKey||e.altKey) return;
  const k=e.key.toLowerCase();
  if (/^[1-4a-d]$/.test(k)){ const idx=/[a-d]/.test(k)?k.charCodeAt(0)-97:+k-1; const b=$$(".opt")[idx]; if(b&&!b.disabled){ e.preventDefault(); b.click(); } }
  else if (k==="enter" && !e.target.matches("button")){ const b=$('[data-qn="1"]'); if(b){ e.preventDefault(); b.click(); } }
});

/* =========================== SECURITY+ =========================== */
VIEWS.secplus = function(){
  const st=UI.sub.secplus||{};
  if (st.obj) return secObjective(objByCode(st.obj));
  if (st.pbq) return secPbq(st.pbq);
  const mastered=OBJECTIVES.filter(o=>objLevel(o)===3).length;
  const lastExam=S.exams[S.exams.length-1];
  CY.ctx=()=>"the Security+ SY0-801 objective list";
  let h = head("// COMPTIA SECURITY+ · SY0-801 (V8)", "Security+", `Launches November 17, 2026. Each objective has a plain-language brief, a job-site comparison, a quick check, and a visual lab where one helps.`,
    `<div class="row"><button class="btn green" data-sp="practice">PRACTICE</button><button class="btn gold" data-sp="exam">EXAM SIM</button></div>`);
  h += `<div class="grid tight" style="margin-bottom:14px">
    <div class="panel"><div class="ptitle"><span>Mastered</span></div><div style="font-family:var(--display);font-size:34px;font-weight:700">${mastered}<span class="muted" style="font-size:16px"> / 27</span></div>${meter(mastered/27*100)}</div>
    <div class="panel"><div class="ptitle"><span>Last exam sim</span></div><div style="font-family:var(--display);font-size:34px;font-weight:700;color:${lastExam&&lastExam.s>=85?"var(--green)":"var(--gold)"}">${lastExam?lastExam.s+"%":"–"}</div><div class="small muted">${lastExam?lastExam.n+" questions · "+lastExam.d:"Not taken yet"}</div></div>
    <div class="panel"><div class="ptitle"><span>Hands-on questions</span></div><div style="font-family:var(--display);font-size:34px;font-weight:700">${Object.keys(S.pbq).length}<span class="muted" style="font-size:16px"> / ${SP.PBQS.length}</span></div><div class="small muted">Drag, match and order, like the real exam</div></div>
    <div class="panel"><div class="ptitle"><span>Exam date</span></div><input type="date" id="spDate" value="${esc(S.settings.examDate)}" aria-label="Target exam date"><div class="small muted" style="margin-top:6px">${examCountdown()}</div></div>
  </div>`;
  h += readinessPanel() + bankPanel();
  for (const d of [1,2,3,4,5]){
    const objs=OBJECTIVES.filter(o=>o.domain===d); const m=objs.filter(o=>objLevel(o)===3).length;
    h += `<section class="domain" style="margin-bottom:16px"><h3><span>${d}.0 ${esc(SP.DOMAINS[d])}</span><span class="chip">${m}/${objs.length}</span></h3>
      ${objs.map(o=>{ const ms=mastery(o.code), s=S.stats[o.code]; return `<button class="obj-row" data-go="secplus" data-sub='{"obj":"${o.code}"}'><span class="code">${o.code}</span><span>${esc(o.t)}${OBJ_WIDGETS[o.code]?` <span class="viz">◆ VISUAL LAB</span>`:""}</span><span class="obj-mast">${s?`<span class="tiny mono muted">${s.t}q</span>`:""}${meter(ms==null?0:ms*100, ms!=null&&ms<.7?"gold":"")}<span class="tiny mono" style="min-width:34px;text-align:right;color:${objLevel(o)===3?"var(--green)":"var(--muted)"}">${pct(ms)}</span></span></button>`; }).join("")}
    </section>`;
  }
  h += `<section class="domain"><h3><span>Hands-on questions (PBQ practice)</span></h3><div class="grid tight">${SP.PBQS.map(p=>`<button class="tile ${S.pbq[p.id]?"done":""}" data-go="secplus" data-sub='{"pbq":"${p.id}"}'><span class="t-ic">⇅</span><h3 style="font-size:15px">${esc(p.title)}</h3><div class="t-foot"><span class="chip">${esc(p.o)}</span>${S.pbq[p.id]?`<span class="chip g">best ${S.pbq[p.id]}%</span>`:""}</div></button>`).join("")}</div></section>`;
  return h;
};
function examCountdown(){ const ex=S.settings.examDate; if(!ex) return "Set it once practice exams hit 85%"; const d=Math.ceil((new Date(ex+"T09:00:00")-new Date())/86400000); return d>=0? `${d} days out` : "Date passed"; }
document.addEventListener("change", e=>{ if (e.target.id==="spDate"){ S.settings.examDate=e.target.value; save(); UI.render(); } });
document.addEventListener("click", e=>{
  const b=e.target.closest("[data-sp]"); if(!b) return;
  const pool = allQuestions().filter(q=>q.src==="sec");
  if (b.dataset.sp==="practice") startQuiz({title:"Security+ practice", pool:shuffle(pool).slice(0,20).map(q=>q.id), mode:"study", from:"secplus"});
  if (b.dataset.sp==="exam") startQuiz({title:"Security+ exam sim", pool:weightedSecDraw(Math.min(90,pool.length)), mode:"exam", from:"secplus"});
  if (b.dataset.sp==="obj"){ const code=b.dataset.code; startQuiz({title:"Sec+ "+code+" check", pool:shuffle(pool.filter(q=>q.tag===code)).map(q=>q.id), mode:"study", from:"secplus", onDone:Q=>{ if (Q.score>=85){ S.objDone[code]=todayStr(); addXP(30,"Objective "+code+" checked"); } }}); }
});
function secObjective(o){
  const ms=mastery(o.code), s=S.stats[o.code], qs=allQuestions().filter(q=>q.tag===o.code);
  const terms = o.d.split(/(?<=\.)\s+(?=[A-Z])/).flatMap(sent=>{ const m=sent.match(/^([^:]+):\s*(.+)$/); return m? m[2].replace(/\.$/,"").split(/,\s*|;\s*|\s+and\s+/) : sent.replace(/\.$/,"").split(/,\s*|;\s*/); }).map(x=>x.replace(/^(and|or)\s+/,"").replace(/\(.*?\)/g,"").trim()).filter(x=>x.length>1 && x.length<48);
  const read = !!S.lessonsRead["obj"+o.code];
  if (!read){ S.lessonsRead["obj"+o.code]=todayStr(); addXP(10,"Brief read"); }
  CY.ctx=()=>`Security+ SY0-801 objective ${o.code} "${o.t}". Covers: ${o.d}`;
  const widgets = OBJ_WIDGETS[o.code]||[];
  const idx=OBJECTIVES.indexOf(o), prev=OBJECTIVES[idx-1], next=OBJECTIVES[idx+1];
  return `${crumbs("secplus","All objectives")}
  ${head(`// DOMAIN ${o.domain}.0 · ${esc(o.dname.toUpperCase())}`, `<span style="color:var(--gold)">${o.code}</span> ${esc(o.t)}`, "", `<div class="row">${S.objDone[o.code]?`<span class="chip g">CHECKED ${esc(S.objDone[o.code])}</span>`:""}<span class="chip">${s?pct(ms)+" · "+s.t+" answered":"not tested"}</span></div>`)}
  <div class="two"><div class="stack">
    <div class="panel edge-cyan"><div class="ptitle"><span>The brief</span></div><p style="margin:0 0 10px">${esc(o.d)}</p>
      <div class="ptitle" style="margin-top:12px"><span>Terms to own</span><span class="tiny faint">tap one to ask CYPHER</span></div>
      <div class="terms">${terms.map(t=>`<span role="button" tabindex="0" data-ask="${esc(`In one short paragraph, what is "${t}" for Security+ SY0-801 objective ${o.code}, with one real-world example?`)}" style="cursor:pointer">${esc(t)}</span>`).join("")}</div></div>
    ${o.hook?`<div class="hook"><b>THINK OF IT LIKE THIS</b>${esc(o.hook)}</div>`:""}
    ${o.lab?`<div class="panel edge-gold"><div class="ptitle"><span>Practice it in your home lab</span></div><p style="margin:0">${esc(o.lab)}</p></div>`:""}
    ${widgets.map((w,k)=>`<div id="objw${k}" data-widget="${w}"></div>`).join("")}
  </div><div class="stack">
    <div class="panel"><div class="ptitle"><span>Quick check</span><b>${qs.length} questions</b></div><p class="small muted" style="margin-top:0">Score 85% or better to mark this objective checked.</p>
      <div class="row"><button class="btn green" data-sp="obj" data-code="${o.code}">START CHECK</button></div></div>
    <div class="panel ai-only"><div class="ptitle"><span>CYPHER</span></div><div class="stack" style="gap:6px">
      <button class="op-item" data-ask="${esc(`Teach me Security+ objective ${o.code} (${o.t}) like I'm on a job site. Keep it under 200 words and end with the two things most likely to show up on the exam.`)}"><span class="oi">◆</span><span>Explain it like I'm on the job site</span><span></span></button>
      <button class="op-item" data-ask="${esc(`Give me 3 scenario-based multiple-choice questions on Security+ ${o.code} (${o.t}). Ask them one at a time and wait for my answer before revealing.`)}"><span class="oi">?</span><span>Quiz me one question at a time</span><span></span></button>
      <button class="op-item" data-ask="${esc(`What do people most often confuse in Security+ ${o.code} (${o.t})? Give me the confusing pairs and how to tell them apart.`)}"><span class="oi">≠</span><span>What do people mix up here?</span><span></span></button>
    </div></div>
    <div class="panel"><div class="ptitle"><span>Explain it back</span>${S.feyn[o.code]!=null?`<b>last ${S.feyn[o.code]}/10</b>`:""}</div><p class="small muted" style="margin-top:0">Teach it in your own words. CYPHER grades it out of 10.</p>
      <textarea id="feynIn" rows="5" style="width:100%" placeholder="Explain ${esc(o.t.toLowerCase())} to a new hire…"></textarea>
      <div class="row ai-only" style="margin-top:8px"><button class="btn sm gold" data-feyn="${o.code}">GRADE ME</button></div><div class="msg cy" id="feynOut" style="display:none;max-width:100%"></div></div>
    <div class="row">${prev?`<button class="btn sm ghost" data-go="secplus" data-sub='{"obj":"${prev.code}"}'>◀ ${prev.code}</button>`:""}<span class="spacer"></span>${next?`<button class="btn sm ghost" data-go="secplus" data-sub='{"obj":"${next.code}"}'>${next.code} ▶</button>`:""}</div>
  </div></div>`;
}
VIEWS.secplusAfter = function(){ $$("[data-widget]").forEach(el=>mountWidget(el.dataset.widget, el)); };
document.addEventListener("keydown", e=>{ if ((e.key==="Enter"||e.key===" ") && e.target.matches(".terms span[data-ask]")){ e.preventDefault(); e.target.click(); } });
document.addEventListener("click", async e=>{
  const b=e.target.closest("[data-feyn]"); if(!b) return;
  const code=b.dataset.feyn, o=objByCode(code), text=$("#feynIn").value.trim(), out=$("#feynOut");
  out.style.display="block";
  if (text.length<40){ out.textContent="Write at least a few sentences first."; return; }
  b.disabled=true; out.textContent="Grading…";
  try{
    const v=await cyJSON(`Grade a learner's explanation of CompTIA Security+ SY0-801 objective ${code} "${o.t}". The objective covers: ${o.d}\nJudge accuracy and completeness, not spelling.\nExplanation:\n"""${text.slice(0,4000)}"""\nReturn {"score": integer 0-10, "got": [..], "missed": [..], "wrong": [..], "tip": "one sentence"}`);
    const sc=Math.max(0,Math.min(10,parseInt(v.score,10)||0)); S.feyn[code]=sc; if(sc>=8) addXP(20,"Explained "+code); save();
    const L=(h,a)=>Array.isArray(a)&&a.length?`${h}\n${a.map(x=>"- "+x).join("\n")}\n\n`:"";
    out.textContent=`Score: ${sc}/10\n\n`+L("Got right:",v.got)+L("Missed:",v.missed)+L("Fix:",v.wrong)+(v.tip?"Next: "+v.tip:"");
  }catch(err){ out.textContent = err&&err.code==="rate_limited"?"Too many requests. Wait a minute.":"Couldn't grade right now. Try again."; }
  finally{ b.disabled=false; }
});
function secPbq(id){
  const p=SP.PBQS.find(x=>x.id===id);
  if (!UI.pbq || UI.pbq.id!==id){ UI.pbq={id, checked:false, picks:{}, order:p.type==="order"?shuffle(p.items.map((_,i)=>i)):null, rows:p.type==="match"?shuffle(p.rows.map((_,i)=>i)):null}; if (UI.pbq.order && UI.pbq.order.every((v,i)=>v===i)) UI.pbq.order.reverse(); }
  const P=UI.pbq;
  CY.ctx=()=>`a Security+ hands-on practice question: ${p.title}. ${p.prompt}`;
  let inner;
  if (p.type==="match") inner = P.rows.map(ri=>{ const [txt,ans]=p.rows[ri], pick=P.picks[ri]||"", ok=pick===ans; return `<div class="mrow"><span>${esc(txt)}</span><select data-pbqpick="${ri}" ${P.checked?"disabled":""} aria-label="${esc(txt)}"><option value="">Choose…</option>${p.opts.map(o=>`<option ${pick===o?"selected":""}>${esc(o)}</option>`).join("")}</select><span class="mk ${P.checked?(ok?"ok":"no"):""}">${P.checked?(ok?"✓":"✗"):""}</span></div>${P.checked&&!ok?`<div class="small" style="color:var(--green);margin:-4px 0 6px">Answer: ${esc(ans)}</div>`:""}`; }).join("");
  else inner = `<ol class="olist">${P.order.map((ii,pos)=>{ const ok=ii===pos; return `<li><span><b class="mono" style="color:var(--gold)">${pos+1}.</b> ${esc(p.items[ii])}</span><button data-pbqmv="${pos}:-1" ${P.checked||pos===0?"disabled":""} aria-label="Move up">↑</button><button data-pbqmv="${pos}:1" ${P.checked||pos===P.order.length-1?"disabled":""} aria-label="Move down">↓</button><span class="mk ${P.checked?(ok?"ok":"no"):""}">${P.checked?(ok?"✓":"✗"):""}</span></li>`; }).join("")}</ol>${P.checked&&!P.order.every((v,i)=>v===i)?`<p class="small">Correct order: ${p.items.map(esc).join(" → ")}</p>`:""}`;
  return `${crumbs("secplus","Security+")}${head("// HANDS-ON · OBJECTIVE "+p.o, esc(p.title), esc(p.prompt))}
  <div class="panel stack">${inner}<div class="row">${P.checked?`<span class="chip ${P.score===100?"g":"y"}">${P.score}%</span><button class="btn green" data-pbqretry="1">TRY AGAIN</button>`:`<button class="btn green" data-pbqcheck="1">CHECK ANSWERS</button>`}<button class="btn ghost" data-go="secplus" data-sub="{}">ALL OBJECTIVES</button></div></div>`;
}
document.addEventListener("change", e=>{ const s=e.target.closest("[data-pbqpick]"); if(s&&UI.pbq) UI.pbq.picks[+s.dataset.pbqpick]=s.value; });
document.addEventListener("click", e=>{
  if (!UI.pbq) return;
  const mv=e.target.closest("[data-pbqmv]"); if (mv){ const [pos,d]=mv.dataset.pbqmv.split(":").map(Number); const o=UI.pbq.order; [o[pos],o[pos+d]]=[o[pos+d],o[pos]]; UI.render(); return; }
  if (e.target.closest("[data-pbqretry]")){ UI.pbq=null; UI.render(); return; }
  if (e.target.closest("[data-pbqcheck]")){
    const P=UI.pbq, p=SP.PBQS.find(x=>x.id===P.id); let r=0,t=0;
    if (p.type==="match") p.rows.forEach(([_,a],ri)=>{ t++; if(P.picks[ri]===a) r++; }); else P.order.forEach((ii,pos)=>{ t++; if(ii===pos) r++; });
    P.checked=true; P.score=Math.round(100*r/t); record(p.o, r===t);
    const prev=S.pbq[p.id]||0; if (P.score>prev){ S.pbq[p.id]=P.score; if (P.score===100 && prev<100) addXP(40,"Hands-on perfect"); }
    if (P.score===100) burst(false);
    save(); UI.render();
  }
});

/* =========================== CCNA =========================== */
const CCNA_LESSONS = LESSONS.filter(l=>l.cat!=="ai");
VIEWS.ccna = function(){
  const st=UI.sub.ccna||{};
  if (st.mission) return ccnaMission(st.mission);
  if (st.lesson) return lessonView(st.lesson, "ccna");
  if (st.tool) return toolView(st.tool);
  CY.ctx=()=>"the CCNA 200-301 section: campaign missions, networking tools, lessons";
  const done=m=>S.campaign[m.id]&&S.campaign[m.id].score>=80;
  return `${head("// CISCO CCNA · 200-301", "CCNA", "The v30 campaign, rebuilt. Score 80% on a mission to unlock the next one. The visual tools and IOS labs back up every topic.")}
  <div class="two"><div class="panel edge-cyan"><div class="ptitle"><span>Campaign</span><b>${MISSIONS.filter(done).length}/8</b></div>
    <div class="mission-map">${MISSIONS.map((m,i)=>{ const unlocked=i===0||done(MISSIONS[i-1]); const isDone=done(m); const cur=unlocked&&!isDone; return `<div class="mstep ${isDone?"done":cur?"cur":""}"><button class="li ${isDone?"done":""}" style="width:100%" ${unlocked?`data-go="ccna" data-sub='{"mission":"${m.id}"}'`:"disabled"}><span class="n">${m.num}</span><span><b style="font-family:var(--display);letter-spacing:.08em">${esc(m.title)}</b><small>${esc(m.subtitle)}</small></span><span>${isDone?`<span class="chip g">${S.campaign[m.id].score}%</span>`:unlocked?"▶":"🔒"}</span></button></div>`; }).join("")}</div></div>
  <div class="stack"><div class="panel"><div class="ptitle"><span>Visual tools</span></div><div class="stack" style="gap:6px">
      <button class="op-item" data-go="ccna" data-sub='{"tool":"packet"}'><span class="oi">⇢</span><span>Packet walk<small>Encapsulation, hop by hop</small></span><span>${S.widgets.packet?"✓":"▶"}</span></button>
      <button class="op-item" data-go="ccna" data-sub='{"tool":"subnet"}'><span class="oi">/26</span><span>Subnet lab<small>See the bits, then drill under pressure</small></span><span>${S.widgets.subnet?"✓":"▶"}</span></button>
      <button class="op-item" data-go="ccna" data-sub='{"tool":"acl"}'><span class="oi">≡</span><span>ACL / firewall rule lab<small>First match wins</small></span><span>${S.widgets.acl?"✓":"▶"}</span></button>
      <button class="op-item" data-go="labs" data-sub='{"tab":"ios"}'><span class="oi">&gt;_</span><span>Cisco IOS labs<small>${Object.keys(S.completedLabs).length}/${CLI_LABS.length} complete, plus guided builds</small></span><span>▶</span></button>
      <button class="op-item" data-go="armory" data-sub='{"tab":"match"}'><span class="oi">⚡</span><span>Command match<small>Goal to command, against the clock</small></span><span>▶</span></button>
    </div></div>
    <div class="panel"><div class="ptitle"><span>Drill</span></div><div class="row"><button class="btn green" data-ccq="ccna">CCNA · 20 Q</button><button class="btn" data-ccq="cyber">CYBER OPS · 15 Q</button></div></div></div></div>
  <div class="panel" style="margin-top:14px"><div class="ptitle"><span>Lessons</span><b>${CCNA_LESSONS.filter(l=>S.lessonsRead[l.id]).length}/${CCNA_LESSONS.length} read</b></div>
    <div class="grid tight">${CCNA_LESSONS.map(l=>`<button class="li ${S.lessonsRead[l.id]?"done":""}" data-go="ccna" data-sub='{"lesson":"${l.id}"}'><span class="n">${S.lessonsRead[l.id]?"✓":"◇"}</span><span>${esc(l.t)}<small>${esc(l.d||"")}</small></span><span></span></button>`).join("")}</div></div>`;
};
VIEWS.ccnaAfter = function(){ const el=$("#toolMount"); if (el) mountWidget(el.dataset.tool, el); };
document.addEventListener("click", e=>{ const b=e.target.closest("[data-ccq]"); if(!b) return; const src=b.dataset.ccq; const pool=allQuestions().filter(q=>q.src===src); startQuiz({title:src==="ccna"?"CCNA drill":"Cyber Ops drill", pool:shuffle(pool).slice(0,src==="ccna"?20:15).map(q=>q.id), mode:"study", from:"ccna"}); });
function ccnaMission(id){
  const m=MISSIONS.find(x=>x.id===id); const qs=allQuestions().filter(q=>q.src==="ccna"&&q.m===id); const res=S.campaign[id];
  const lsn=LESSONS.find(l=>l.id===m.lsn);
  CY.ctx=()=>`CCNA campaign mission ${m.num} "${m.title}" (${m.subtitle}). Intel: ${m.intel.join(", ")}.`;
  return `${crumbs("ccna","Campaign")}${head("// MISSION "+m.num, esc(m.title), esc(m.subtitle))}
  <div class="two"><div class="dossier stack"><span class="stamp">BRIEFING</span><p style="margin:0;font-size:16px">${esc(m.briefing)}</p>
    <div class="ptitle" style="margin:6px 0 0"><span>Intel</span></div><div class="terms">${m.intel.map(t=>`<span role="button" tabindex="0" style="cursor:pointer" data-ask="${esc(`Explain "${t}" for the CCNA 200-301 in under 120 words with one example.`)}">${esc(t)}</span>`).join("")}</div>
    ${lsn?`<button class="op-item" data-go="ccna" data-sub='{"lesson":"${lsn.id}"}'><span class="oi">◇</span><span>Read first: ${esc(lsn.t)}<small>${esc(lsn.d||"")}</small></span><span>▶</span></button>`:""}</div>
  <div class="panel stack"><div class="ptitle"><span>Mission exam</span><b>${qs.length} questions · 80% to pass</b></div>
    ${res?`<div class="row"><span class="chip ${res.score>=80?"g":"y"}">BEST ${res.score}%</span></div>`:""}
    <button class="btn green" data-ccm="${id}">${res?"RUN IT AGAIN":"LAUNCH MISSION"}</button>
    <p class="small muted" style="margin:0">Study mode: you see the answer after each question. Clear 80% and the next mission unlocks.</p></div></div>`;
}
document.addEventListener("click", e=>{ const b=e.target.closest("[data-ccm]"); if(!b) return; const id=b.dataset.ccm; const m=MISSIONS.find(x=>x.id===id); const pool=allQuestions().filter(q=>q.src==="ccna"&&q.m===id).map(q=>q.id);
  startQuiz({title:"Mission "+m.num+" · "+m.title, pool:shuffle(pool), mode:"study", from:"ccna", passMark:80, xpEach:8, onDone:Q=>{ const prev=S.campaign[id]; if(!prev||Q.score>prev.score){ S.campaign[id]={score:Q.score, d:todayStr()}; if (Q.score>=80 && !(prev&&prev.score>=80)) addXP(100,"Mission "+m.num+" cleared"); } }}); });
function lessonView(id, back){
  const l = LESSONS.find(x=>x.id===id) || CONCEPTS.find(x=>x.t===id) || null;
  if (!l) return `${crumbs(back,"Back")}<div class="empty">Lesson not found.</div>`;
  if (!S.lessonsRead[id]){ S.lessonsRead[id]=todayStr(); setTimeout(()=>addXP(10,"Lesson read"),50); }
  const list=CCNA_LESSONS, k=list.findIndex(x=>x.id===id), nx=list[k+1];
  CY.ctx=()=>`the lesson "${l.t}". Summary: ${(l.d||"")} Content: ${String(l.b).replace(/<[^>]+>/g," ").replace(/\s+/g," ").slice(0,900)}`;
  return `${crumbs(back,"Back")}${head("// LESSON", esc(l.t), esc(l.d||""))}
  <div class="two"><div class="panel prose">${l.b}</div>
  <div class="stack"><div class="panel ai-only"><div class="ptitle"><span>CYPHER</span></div><div class="stack" style="gap:6px">
    <button class="op-item" data-ask="Summarize this lesson in 5 bullet points I can memorize."><span class="oi">≡</span><span>Five-bullet summary</span><span></span></button>
    <button class="op-item" data-ask="Quiz me on this lesson with 3 questions, one at a time. Wait for my answer each time."><span class="oi">?</span><span>Quiz me on it</span><span></span></button>
    <button class="op-item" data-ask="Give me a hands-on way to practice this in Packet Tracer or my home lab."><span class="oi">&gt;_</span><span>How do I practice this?</span><span></span></button></div></div>
    ${nx&&back==="ccna"?`<button class="op-item" data-go="ccna" data-sub='{"lesson":"${nx.id}"}'><span class="oi">▶</span><span>Next lesson<small>${esc(nx.t)}</small></span><span></span></button>`:""}</div></div>`;
}
function toolView(tool){
  CY.ctx=()=>`the ${WIDGETS[tool].t} visual tool`;
  return `${crumbs("ccna","CCNA")}${head("// VISUAL TOOL", WIDGETS[tool].t, WIDGETS[tool].sub)}<div id="toolMount" data-tool="${tool}"></div>`;
}

/* =========================== ARMORY =========================== */
function buildDecks(){
  if (buildDecks.d) return buildDecks.d;
  const strip=h=>String(h||"").replace(/<[^>]+>/g,"").replace(/&nbsp;/g," ").trim();
  const ports={}; SP.PORTS.forEach(([p,s])=>ports[p]=s); PORTS.forEach(x=>{ if(!ports[x.p]) ports[x.p]=x.s; });
  const d = {
    acr:{n:"Security+ acronyms", cards: SP.ACR.split("\n").map(l=>{ const [f,b]=l.split("|"); return {id:"a:"+f, f, b}; })},
    ports:{n:"Ports", cards: Object.entries(ports).map(([p,s])=>({id:"p:"+p, f:"Port "+p, b:s}))},
    events:{n:"Windows event IDs", cards: SP.EVENTS.map(([f,b])=>({id:"e:"+f, f:f.startsWith("Sysmon")?f:"Event "+f, b}))},
    ios:{n:"Cisco commands", cards: CISCO_COMMANDS.map(c=>({id:"c:"+c.cmd, f:c.desc, b:c.cmd+"   ("+c.mode+" mode)", small:true}))},
    mnem:{n:"Mnemonics", cards: MNEMONICS.map(m=>({id:"m:"+m.h, f:m.cat, b:m.h+" · "+strip(m.b), small:true}))}
  };
  return buildDecks.d=d;
}
function dueCards(deck){ const D=buildDecks(); const t=todayStr(); const keys=deck==="all"?Object.keys(D):[deck]; return keys.flatMap(k=>D[k].cards.filter(c=>S.srs[c.id]&&S.srs[c.id].d<=t)); }
function newCards(deck){ const D=buildDecks(); const keys=deck==="all"?Object.keys(D):[deck]; return keys.flatMap(k=>D[k].cards.filter(c=>!S.srs[c.id])); }
VIEWS.armory = function(){
  const st=UI.sub.armory||{}; const tab=st.tab||"drills";
  if (tab==="cards" && UI.cards && UI.cards.active) return cardSession();
  if (tab==="vault" && st.item) return vaultItem(st.item);
  CY.ctx=()=>"the Armory: drills, flashcards, exam sim, command match, reference vault";
  const tabs=[["drills","Drills"],["cards","Flashcards"],["match","Command match"],["vault","Vault"]];
  let body="";
  if (tab==="drills"){
    const all=allQuestions();
    const bank=(src,n,t,s)=>`<div class="tile"><span class="t-ic">${n}</span><h3>${t}</h3><p>${s}</p><div class="t-foot"><button class="btn sm green" data-arm="${src}">START</button><span class="chip">${all.filter(q=>src==="miss"?S.miss[q.id]:src==="all"?q.src!=="code":q.src===src).length} q</span></div></div>`;
    body=`<div class="grid">${bank("sec","⛨","Security+","SY0-801 practice, all domains")}${bank("ccna","⇄","CCNA","The v30 bank of 95")}${bank("cyber","◎","Cyber Ops","Monitoring, intrusion, Linux, SQL")}${bank("code","{ }","Read the code","Predict what PowerShell, Bash and Python print")}${bank("miss","✗","Missed questions","Everything you've gotten wrong and not fixed")}${bank("all","∑","Everything mixed","20 random from every bank")}</div>
    <div class="panel" style="margin-top:14px"><div class="ptitle"><span>Exam simulation</span></div><p class="small muted" style="margin-top:0">Timed at 1 minute per question. No feedback until you submit. Flag and jump between questions.</p>
      <div class="row"><select id="armN" aria-label="Number of questions"><option>15</option><option selected>30</option><option>60</option><option value="90">90 (full length)</option></select><select id="armSrc" aria-label="Question bank"><option value="sec">Security+</option><option value="ccna">CCNA</option><option value="all">Everything</option></select><button class="btn gold" data-armexam="1">START EXAM</button></div></div>
    <div class="panel ai-only" style="margin-top:14px"><div class="ptitle"><span>Grow the Security+ bank</span><b>${S.extraQ.length} written by CYPHER</b></div><p class="small muted" style="margin-top:0">CYPHER writes 5 new SY0-801-style questions for any objective. They're saved with your progress.</p>
      <div class="row"><select id="genObj" aria-label="Objective">${OBJECTIVES.map(o=>`<option value="${o.code}">${o.code} ${esc(o.t)}</option>`).join("")}</select><button class="btn" data-gen="1">WRITE 5 QUESTIONS</button><span class="small muted" id="genMsg"></span></div></div>`;
  } else if (tab==="cards"){
    const D=buildDecks();
    body=`<p class="muted small">Spaced repetition on the v30 ladder: 1, 3, 7, 16, 35 and 90 days. Say the answer out loud, flip, and be honest. Keys: Space to flip, 1 for Again, 2 for Got it.</p><div class="grid">${["all",...Object.keys(D)].map(k=>{ const due=dueCards(k).length, nw=newCards(k).length, tot=k==="all"?Object.values(D).reduce((a,x)=>a+x.cards.length,0):D[k].cards.length; return `<div class="tile ${due?"gold":""}"><span class="t-ic">▣</span><h3>${k==="all"?"All decks":esc(D[k].n)}</h3><p><b style="color:var(--gold)">${due}</b> due · ${nw} new · ${tot} total</p><div class="t-foot"><button class="btn sm ${due?"gold":"green"}" data-deck="${k}" ${due+nw?"":"disabled"}>STUDY</button></div></div>`; }).join("")}</div>`;
  } else if (tab==="match"){
    body = matchView();
  } else if (tab==="vault"){
    body = vaultList(st.q||"");
  }
  return `${head("// ARMORY", "Armory", "Drills, flashcards, exam sim and your reference vault.")}
  <div class="seg" style="margin-bottom:14px">${tabs.map(([k,l])=>`<button data-go="armory" data-sub='{"tab":"${k}"}' aria-pressed="${tab===k}">${l}</button>`).join("")}</div>${body}`;
};
document.addEventListener("click", e=>{
  const a=e.target.closest("[data-arm]"); if (a){ const src=a.dataset.arm; const all=allQuestions(); const pool=src==="miss"?all.filter(q=>S.miss[q.id]):src==="all"?all.filter(q=>q.src!=="code"):all.filter(q=>q.src===src); startQuiz({title:{sec:"Security+",ccna:"CCNA",cyber:"Cyber Ops",code:"Read the code",miss:"Missed questions",all:"Mixed"}[src]+" drill", pool:shuffle(pool).slice(0,20).map(q=>q.id), mode:"study", from:"armory"}); }
  if (e.target.closest("[data-armexam]")){ const n=+$("#armN").value, src=$("#armSrc").value; const all=allQuestions().filter(q=>q.src!=="code"); const pool=src==="all"?all:all.filter(q=>q.src===src); startQuiz({title:(src==="sec"?"Security+":src==="ccna"?"CCNA":"Mixed")+" exam sim", pool:src==="sec"?weightedSecDraw(Math.min(n,pool.length)):shuffle(pool).slice(0,n).map(q=>q.id), mode:"exam", from:"armory"}); }
  const d=e.target.closest("[data-deck]"); if (d){ const k=d.dataset.deck; UI.cards={active:true, deck:k, q:[...shuffle(dueCards(k)), ...shuffle(newCards(k)).slice(0,20)].map(c=>c.id), flipped:false, done:0, again:{}}; UI.sub.armory={tab:"cards"}; UI.render(); }
});
document.addEventListener("click", async e=>{
  const g=e.target.closest("[data-gen]"); if(!g) return;
  const code=$("#genObj").value, o=objByCode(code), msg=$("#genMsg"); g.disabled=true; msg.textContent="CYPHER is writing…";
  try{
    const existing=allQuestions().filter(q=>q.tag===code).map(q=>"- "+q.q).join("\n");
    const v=await cyJSON(`Write 5 new multiple-choice questions for CompTIA Security+ SY0-801 objective ${code} "${o.t}". Topics: ${o.d}\nScenario-based, real exam difficulty, exactly one correct answer and three plausible wrong answers. Don't repeat:\n${existing}\nReturn {"questions":[{"q":"...","correct":"...","wrong":["...","...","..."],"e":"why the correct answer is right"}]}`);
    const arr=Array.isArray(v)?v:(v.questions||[]);
    const good=arr.filter(x=>x&&typeof x.q==="string"&&typeof x.correct==="string"&&Array.isArray(x.wrong)&&x.wrong.length>=3).slice(0,5).map((x,i)=>({id:"g"+Date.now().toString(36)+i, o:code, q:String(x.q).slice(0,600), c:[String(x.correct).slice(0,200),...x.wrong.slice(0,3).map(w=>String(w).slice(0,200))], e:String(x.e||"").slice(0,500)}));
    if (!good.length) throw new Error("bad");
    S.extraQ=S.extraQ.concat(good).slice(-150); QCACHE=null; save();
    msg.textContent=`Added ${good.length} questions for ${code}.`;
  }catch(err){ msg.textContent = err&&err.code==="rate_limited"?"Too many requests. Wait a minute.":"Couldn't write questions right now."; }
  finally{ g.disabled=false; }
});
function cardSession(){
  const C=UI.cards, D=buildDecks();
  const all=Object.values(D).flatMap(x=>x.cards);
  CY.ctx=()=>C.q.length?`a flashcard: "${all.find(c=>c.id===C.q[0]).f}"`:"flashcards";
  if (!C.q.length) return `${crumbs("armory","Armory")}<div class="panel stack" style="text-align:center"><div style="font-family:var(--display);font-size:44px;font-weight:700;color:var(--green)">DECK CLEAR</div><div class="muted">${C.done} cards reviewed. They'll come back on schedule.</div><div><button class="btn green" data-endcards="1">BACK TO DECKS</button></div></div>`;
  const c=all.find(x=>x.id===C.q[0]), s=S.srs[c.id];
  return `${crumbs("armory","Armory")}<div class="panel stack"><div class="q-meta"><span>${C.deck==="all"?"ALL DECKS":esc(D[C.deck].n.toUpperCase())}</span><span>${C.q.length} left · ${s?"box "+s.b:"new"}</span></div>
  <div class="flash ${C.flipped?"flipped":""}" data-flip="1" role="button" tabindex="0" aria-label="Flashcard. Activate to flip."><div class="card3d"><div class="face"><div class="front-t" style="${c.small?"font-size:22px":""}">${esc(c.f)}</div></div><div class="face back"><div class="back-t">${esc(c.b)}</div></div></div></div>
  <div class="row" style="justify-content:center">${C.flipped?`<button class="btn" data-card="0">AGAIN</button><button class="btn green" data-card="1">GOT IT</button>`:`<button class="btn gold" data-flip="1">SHOW ANSWER</button>`}<button class="btn ghost" data-endcards="1">STOP</button></div></div>`;
}
document.addEventListener("click", e=>{
  if (!UI.cards || !UI.cards.active) return;
  if (e.target.closest("[data-flip]")){ UI.cards.flipped=!UI.cards.flipped; const f=$(".flash"); if(f) f.classList.toggle("flipped",UI.cards.flipped); const r=f&&f.parentElement.querySelector(".row"); if(r) r.innerHTML = UI.cards.flipped?`<button class="btn" data-card="0">AGAIN</button><button class="btn green" data-card="1">GOT IT</button><button class="btn ghost" data-endcards="1">STOP</button>`:`<button class="btn gold" data-flip="1">SHOW ANSWER</button><button class="btn ghost" data-endcards="1">STOP</button>`; return; }
  const g=e.target.closest("[data-card]"); if (g){ const good=g.dataset.card==="1"; const C=UI.cards; const id=C.q.shift(); srsGrade(id, good); if (good){ C.done++; S.xp+=2; touchStreak(); } else if(!C.again[id]){ C.again[id]=1; C.q.push(id); } C.flipped=false; save(); UI.render(); if(!C.q.length) addXP(15,"Deck clear"); return; }
  if (e.target.closest("[data-endcards]")){ UI.cards=null; UI.render(); }
});
document.addEventListener("keydown", e=>{
  if (!UI.cards || !UI.cards.active || UI.view!=="armory" || e.target.matches("input,textarea,select")) return;
  if (e.key===" "){ e.preventDefault(); const b=$("[data-flip]"); if(b) b.click(); }
  else if (e.key==="1"){ const b=$('[data-card="0"]'); if(b) b.click(); }
  else if (e.key==="2"){ const b=$('[data-card="1"]'); if(b) b.click(); }
});
/* command match (v30 CMD_MATCH_PAIRS) */
let MATCH=null;
function matchView(){
  if (!MATCH || MATCH.over) return `<div class="panel stack"><p style="margin:0">See the goal, pick the Cisco command. 60 seconds. Correct answers add 2 seconds.</p>${MATCH&&MATCH.over?`<div style="font-family:var(--display);font-size:40px;font-weight:700;color:var(--gold)">${MATCH.score} <span style="font-size:16px;color:var(--muted)">correct · best ${S.widgets.matchBest||0}</span></div>`:""}<div><button class="btn green" data-match="start">${MATCH?"PLAY AGAIN":"START"}</button></div></div>`;
  const p=MATCH.cur;
  return `<div class="panel stack"><div class="q-meta"><span>SCORE ${MATCH.score}</span><span class="timer" id="mtimer">${Math.ceil((MATCH.end-Date.now())/1000)}s</span></div><p class="q-text">${esc(p.goal)}</p><div class="opts">${MATCH.opts.map((o,k)=>`<button class="opt mono" data-mopt="${esc(o)}"><b>${k+1}</b><span>${esc(o)}</span></button>`).join("")}</div></div>`;
}
function matchNext(){ const p=CMD_MATCH_PAIRS[Math.floor(Math.random()*CMD_MATCH_PAIRS.length)]; MATCH.cur=p; MATCH.opts=shuffle([p.cmd,...p.wrong.slice(0,3)]); }
document.addEventListener("click", e=>{
  const s=e.target.closest('[data-match="start"]'); if (s){ MATCH={score:0, end:Date.now()+60000}; matchNext(); UI.render(); clearInterval(MATCH.t); MATCH.t=setInterval(()=>{ const el=$("#mtimer"); const left=MATCH.end-Date.now(); if(el) el.textContent=Math.max(0,Math.ceil(left/1000))+"s"; if(left<=0){ clearInterval(MATCH.t); MATCH.over=true; if(MATCH.score>(S.widgets.matchBest||0)){ S.widgets.matchBest=MATCH.score; } addXP(MATCH.score*2,"Command match"); UI.render(); } },250); return; }
  const o=e.target.closest("[data-mopt]"); if (o && MATCH && !MATCH.over){ const ok=o.dataset.mopt===MATCH.cur.cmd; o.classList.add(ok?"right":"wrong"); if(ok){ MATCH.score++; MATCH.end+=2000; } else { const r=$$("[data-mopt]").find(b=>b.dataset.mopt===MATCH.cur.cmd); if(r) r.classList.add("right"); } setTimeout(()=>{ if(MATCH.over) return; matchNext(); UI.render(); }, ok?250:900); }
});
/* vault */
function vaultEntries(){
  if (vaultEntries.e) return vaultEntries.e;
  const e=[];
  CCNA_LESSONS.forEach(l=>e.push({id:"l:"+l.id, k:"Lesson", t:l.t, s:l.d||"", h:l.b}));
  CONCEPTS.forEach(c=>e.push({id:"k:"+c.t, k:"Concept", t:c.t, s:c.s||"", h:c.b}));
  MNEMONICS.forEach(m=>e.push({id:"m:"+m.h, k:"Mnemonic", t:m.cat+": "+m.h, s:m.w, h:`<p><b>${esc(m.h)}</b></p><p>${esc(m.w)}</p><p>${m.b}</p>`}));
  OSI_LAYERS.forEach(o=>e.push({id:"o:"+o.n, k:"OSI", t:"Layer "+o.n+" · "+o.h, s:o.s, h:o.b}));
  SHOW_OUTPUTS.forEach(s=>e.push({id:"s:"+s.cmd, k:"Show output", t:s.cmd, s:s.summary, h:`<pre>${esc(s.output)}</pre>${s.ann.map(a=>`<p><b>${esc(a.k)}</b>: ${esc(a.v)}</p>`).join("")}`}));
  WALKTHROUGHS.filter(w=>/sub|ospf/.test(w.id)).forEach(w=>e.push({id:"w:"+w.id, k:"Walkthrough", t:w.t, s:w.desc||"", h:w.steps.map(s=>`<h4>${esc(s.t||"")}</h4>${s.b||""}${s.code?`<pre>${esc(s.code)}</pre>`:""}`).join("")}));
  e.push({id:"x:cmds", k:"Reference", t:"Cisco IOS command reference", s:CISCO_COMMANDS.length+" commands", h:`<table><tr><th>Command</th><th>Mode</th><th>What it does</th></tr>${CISCO_COMMANDS.map(c=>`<tr><td><code>${esc(c.cmd)}</code></td><td>${esc(c.mode)}</td><td>${esc(c.desc)}</td></tr>`).join("")}</table>`});
  e.push({id:"x:acr", k:"Reference", t:"Security+ SY0-801 acronyms", s:"From the official objectives", h:`<table>${SP.ACR.split("\n").map(l=>{ const [a,b]=l.split("|"); return `<tr><td><b>${esc(a)}</b></td><td>${esc(b)}</td></tr>`; }).join("")}</table>`});
  return vaultEntries.e=e;
}
function vaultList(q){
  const qq=q.toLowerCase(); const list=vaultEntries().filter(x=>!qq || (x.t+" "+x.s+" "+String(x.h).replace(/<[^>]+>/g," ")).toLowerCase().includes(qq));
  return `<div class="row" style="margin-bottom:10px"><input type="search" id="vaultQ" value="${esc(q)}" placeholder="Search lessons, mnemonics, show output, acronyms…" style="flex:1" aria-label="Search the vault"></div>
  <div class="grid tight" id="vaultList">${list.slice(0,120).map(x=>`<button class="li" data-go="armory" data-sub='${JSON.stringify({tab:"vault",item:x.id,q})}'><span class="n">${esc(x.k.slice(0,3).toUpperCase())}</span><span>${esc(x.t)}<small>${esc(x.s)}</small></span><span></span></button>`).join("")||`<div class="empty">Nothing matches.</div>`}</div>`;
}
let vaultT=null;
document.addEventListener("input", e=>{ if (e.target.id==="vaultQ"){ clearTimeout(vaultT); const v=e.target.value; vaultT=setTimeout(()=>{ UI.sub.armory={tab:"vault", q:v}; UI.render(); const i=$("#vaultQ"); i.focus(); i.setSelectionRange(v.length,v.length); },250); } });
function vaultItem(id){
  const x=vaultEntries().find(v=>v.id===id); const st=UI.sub.armory;
  CY.ctx=()=>`the reference "${x.t}"`;
  return `<div class="crumbs"><button data-go="armory" data-sub='${JSON.stringify({tab:"vault",q:st.q||""})}'>◀ Vault</button></div>${head("// VAULT · "+esc(x.k.toUpperCase()), esc(x.t), esc(x.s))}<div class="panel prose">${x.h}</div>`;
}

document.addEventListener("click", e=>{
  const b=e.target.closest("[data-qbad]"); if(!b) return;
  const id=b.dataset.qbad, Q=UI.quiz; if(!Q) return;
  const k=Q.ids.indexOf(id); flagQuestion(id);
  if (k>=0){ Q.ids.splice(k,1); if (Q.ans[id]===0) Q.right=Math.max(0,Q.right-1); delete Q.ans[id]; }
  toast("Deleted. It won't come back.");
  if (!Q.ids.length){ UI.quiz=null; UI.go(UI.from||"secplus"); return; }
  if (Q.i>=Q.ids.length){ finishQuiz(); return; }
  UI.render();
});
