/* ============ PACKETKILL v2 · LABS, CODE, MISSIONS ============ */
const LAB_TABS=[["ios","Cisco IOS"],["bash","Linux Bash"],["ps","PowerShell + AD"],["sql","SQL"]];
VIEWS.labs = function(){
  const st=UI.sub.labs||{}; const tab=st.tab||"ios";
  if (st.open) return labOpen(tab, st.open);
  CY.ctx=()=>"the terminal labs list";
  const counts={ios:[Object.keys(S.completedLabs).length,CLI_LABS.length], bash:[Object.keys(S.bashDone).length,BASH_MISSIONS.length], ps:[Object.keys(S.psDone).length,PS_LABS.length], sql:[Object.keys(S.sqlCourseDone).length+Object.keys(S.sqlDone).length, SQL_COURSE.length+SQL_CHALLENGES.length]};
  let body="";
  const row=(done,n,t,s,sub,chip)=>`<button class="li ${done?"done":""}" data-go="labs" data-sub='${JSON.stringify(sub)}'><span class="n">${done?"✓":n}</span><span>${esc(t)}<small>${esc(s||"")}</small></span><span>${chip||""}</span></button>`;
  if (tab==="ios"){
    body=`<div class="row" style="margin-bottom:10px"><button class="btn sm" data-go="labs" data-sub='{"tab":"ios","open":"sandbox-router"}'>ROUTER SANDBOX</button><button class="btn sm" data-go="labs" data-sub='{"tab":"ios","open":"sandbox-switch"}'>SWITCH SANDBOX</button><span class="small muted">Full v30 IOS engine: ? help, Tab completion, abbreviations like conf t and int g0/0.</span></div>
    <div class="two"><div class="list">${CLI_LABS.map(l=>row(S.completedLabs[l.id],l.num,l.t,`${l.dev} · ${l.diff} · ${l.desc}`,{tab:"ios",open:l.id},`<span class="chip y">+${l.xp}</span>`)).join("")}</div>
    <div class="panel"><div class="ptitle"><span>Guided builds</span><b>${PROJECTS.filter(p=>p.kind==="cli"&&S.completedProjects[p.id]).length}/${PROJECTS.filter(p=>p.kind==="cli").length}</b></div><p class="small muted" style="margin-top:0">CYPHER walks you step by step through a real build. Type each command; the engine checks the device state.</p><div class="list">${PROJECTS.filter(p=>p.kind==="cli").map(p=>row(S.completedProjects[p.id],"◆",p.title,p.blurb,{tab:"ios",open:"proj:"+p.id},`<span class="chip">${p.steps.length} steps</span>`)).join("")}</div></div></div>`;
  } else if (tab==="bash"){
    body=`<div class="row" style="margin-bottom:10px"><button class="btn sm" data-go="labs" data-sub='{"tab":"bash","open":"sandbox"}'>BASH SANDBOX</button><span class="small muted">grep, awk, sort, uniq, cut, tr, head, tail, wc, find and pipes.</span></div><div class="list">${BASH_MISSIONS.map((m,k)=>row(S.bashDone[m.id],String(k+1).padStart(2,"0"),m.t,m.d,{tab:"bash",open:m.id},`<span class="chip y">+${m.xp}</span>`)).join("")}</div>`;
  } else if (tab==="ps"){
    body=`<div class="row" style="margin-bottom:10px"><button class="btn sm" data-go="labs" data-sub='{"tab":"ps","open":"sandbox"}'>POWERSHELL SANDBOX</button><span class="small muted">A simulated lab.local domain: users, groups, services, processes, event logs. Help desk work, start to finish.</span></div><div class="list">${PS_LABS.map(l=>row(S.psDone[l.id],l.n,l.t,l.intro.split(". ")[0]+".",{tab:"ps",open:l.id},`<span class="chip">Sec+ ${l.obj}</span> <span class="chip y">+${l.xp}</span>`)).join("")}</div>`;
  } else {
    body=`<div class="two"><div class="panel"><div class="ptitle"><span>SQL course</span><b>${Object.keys(S.sqlCourseDone).length}/${SQL_COURSE.length}</b></div><div class="list">${SQL_COURSE.map((c,k)=>row(S.sqlCourseDone[c.id],String(k+1).padStart(2,"0"),c.t,"",{tab:"sql",open:"c:"+c.id})).join("")}</div></div>
    <div class="panel"><div class="ptitle"><span>SOC analyst challenges</span><b>${Object.keys(S.sqlDone).length}/${SQL_CHALLENGES.length}</b></div><div class="list">${SQL_CHALLENGES.map((c,k)=>row(S.sqlDone[c.id],String(k+1).padStart(2,"0"),c.t,c.d,{tab:"sql",open:"x:"+c.id},`<span class="chip y">+${c.xp}</span>`)).join("")}</div></div></div>`;
  }
  return `${head("// TERMINAL LABS", "Labs", "Type real commands into real simulators. On a phone, the key bar under each terminal has Tab, arrows and the symbols you need.")}
  <div class="seg" style="margin-bottom:14px">${LAB_TABS.map(([k,l])=>`<button data-go="labs" data-sub='{"tab":"${k}"}' aria-pressed="${tab===k}">${l} <span class="mono tiny" style="color:var(--gold)">${counts[k][0]}/${counts[k][1]}</span></button>`).join("")}</div>${body}
  <div class="grid tight" style="margin-top:16px">${tile("code","{ }","Python","Real Python with hidden tests","violet",`${Object.keys(S.pyDone).length}/${PY_EX.length}`)}${tile("ops","☰","Missions","Incident response stories","red",`${MISSIONS_V2.filter(m=>S.missions[m.id]&&S.missions[m.id].done).length}/${MISSIONS_V2.length}`)}</div>`;
};
function labOpen(tab, id){
  if (tab==="ios") return iosMarkup(id);
  if (tab==="bash") return bashMarkup(id);
  if (tab==="ps") return psMarkup(id);
  if (tab==="sql") return sqlMarkup(id);
}
VIEWS.labsAfter = function(){
  const st=UI.sub.labs||{}; if (!st.open) return;
  ({ios:iosStart, bash:bashStart, ps:psStart, sql:sqlStart})[st.tab||"ios"](st.open);
};

/* ---------- Cisco IOS (v30 engine, unchanged) ---------- */
function iosMarkup(id){
  const isProj=id.startsWith("proj:"), proj=isProj?PROJECTS.find(p=>p.id===id.slice(5)):null, lab=CLI_LABS.find(l=>l.id===id);
  const title = proj ? proj.title : lab ? `LAB ${lab.num} · ${lab.t}` : "SANDBOX · "+id.split("-")[1].toUpperCase();
  return `${crumbs("labs","Labs")}${head("// CISCO IOS", esc(title), proj?esc(proj.blurb):lab?esc(lab.desc):"Free play. No tasks, no XP. Break things.")}
  <div class="termwrap"><div class="term" role="region" aria-label="Cisco IOS terminal">
    <div class="term-head"><span class="dots"><i></i><i></i><i></i></span><span id="cli-lab-title"></span><span id="cli-lab-dev"></span></div>
    <div class="term-out" id="term" aria-live="polite"></div>
    <div class="term-in"><span class="pr" id="term-prompt"></span><input id="term-input" type="text" spellcheck="false" autocapitalize="off" autocorrect="off" aria-label="Command input"></div>
    ${termKeysHTML()}
  </div>
  <aside class="side"><div class="panel ${proj?"edge-gold":""}">${proj?`<div id="projPanel"></div>`:`<div id="task-strip"></div>`}
    <div class="row" style="margin-top:12px"><button class="btn sm" id="iosHint">HINT</button><button class="btn sm ai-only" id="iosCy">ASK CYPHER</button><button class="btn sm ghost" id="iosReset">RESTART</button></div>
    <p class="tiny faint" style="margin:8px 0 0">Watch for ◆ WHY boxes: the engine teaches as you type.</p></div><div id="screen-cli"></div></aside></div>`;
}
function iosStart(id){
  const isProj=id.startsWith("proj:");
  if (isProj) iosProjStart(PROJECTS.find(p=>p.id===id.slice(5)));
  else if (id.startsWith("sandbox")) openSandbox(id.split("-")[1]);
  else openLab(id);
  bindCliInput();
  const inp=$("#term-input");
  $(".keys").addEventListener("click", e=>{
    const b=e.target.closest("[data-tkey]"); if(!b) return; const k=b.dataset.tkey;
    const fire=(key,o)=>inp.dispatchEvent(new KeyboardEvent("keydown",Object.assign({key,bubbles:true,cancelable:true},o||{})));
    if (k==="TAB") fire("Tab"); else if (k==="↑") fire("ArrowUp"); else if (k==="↓") fire("ArrowDown"); else if (k==="^C") fire("c",{ctrlKey:true});
    else if (k==="?"){ inp.value=(inp.value.trim()?inp.value.trimEnd()+" ":"")+"?"; fire("Enter"); }
    else inp.value+=k;
    inp.focus();
  });
  $("#term").addEventListener("click",()=>{ if(!getSelection().toString()) inp.focus(); });
  $("#iosHint").onclick=()=>{ if (isProj){ const s=PROJ.p.steps[PROJ.i]; if(s){ cliPrint("hi","▸ TYPE: "+s.cmd); } } else cliHint(); };
  $("#iosCy").onclick=()=>{ const hist=(cli.history||[]).slice(-6).join(" ; "); cyOpen(`I'm stuck. Give me a hint for my current task without giving me the exact command. My last commands were: ${hist||"none yet"}. The prompt shows ${getPromptStr()}.`, true); };
  $("#iosReset").onclick=()=>UI.render();
  CY.ctx=()=>{ const lab=cli.currentLab; const next=lab&&lab.tasks.find(t=>!cli.completedTasks.includes(t.id)); return isProj ? `a guided Cisco IOS build "${PROJ.p.title}", step ${PROJ.i+1}: ${(PROJ.p.steps[PROJ.i]||{}).intent||"done"}. Device prompt: ${getPromptStr()}` : lab ? `Cisco IOS lab ${lab.num} "${lab.t}". Current task: ${next?next.desc:"all done"}. Device prompt: ${getPromptStr()}` : `a Cisco IOS sandbox. Prompt: ${getPromptStr()}`; };
}
// v30 labComplete, now with rank-ups and confetti
function labComplete(){
  const lab=cli.currentLab; const was=!!S.completedLabs[lab.id];
  if (!was){ S.completedLabs[lab.id]=todayStr(); addXP(lab.xp, "Lab "+lab.num); burst(false); }
  cliPrint("out",""); cliPrint("hi","╔════════════════════════════╗"); cliPrint("ok", was?"   LAB ALREADY COMPLETE":"   LAB COMPLETE  +"+lab.xp+" XP"); cliPrint("hi","╚════════════════════════════╝");
  showLabActionBar();
}
function nextLab(){ const k=CLI_LABS.findIndex(l=>l.id===cli.currentLab.id); const n=CLI_LABS[k+1]; UI.go("labs",{tab:"ios", open:n?n.id:undefined}); }
const PROJ={p:null,i:0};
function iosProjStart(p){
  PROJ.p=p; PROJ.i=0;
  cli=newCliState("router"); if (p.setup) try{ p.setup(cli); }catch(e){}
  cli.currentLab=null; cli.labId=null;
  $("#cli-lab-title").textContent=p.title; $("#cli-lab-dev").textContent="GUIDED BUILD";
  cliPrint("sys","◆ CYPHER · PROJECT TERMINAL READY"); cliPrint("hi", p.title); cliPrint("out",""); cliPrint("dim","Type the command from the step card, or your own that does the same job.");
  updatePrompt(); projRender();
  $("#term-input").addEventListener("keydown", e=>{ if (e.key==="Enter") setTimeout(projCheck, 0); });
}
function projRender(){
  const p=PROJ.p, s=p.steps[PROJ.i], el=$("#projPanel"); if(!el) return;
  if (!s){ el.innerHTML=`<div class="ptitle"><span>Build complete</span><b>${p.steps.length}/${p.steps.length}</b></div><p style="margin:0">You shipped <b>${esc(p.title)}</b>.</p><div class="row" style="margin-top:10px"><button class="btn green" data-go="labs" data-sub='{"tab":"ios"}'>BACK TO LABS</button></div>`; return; }
  el.innerHTML=`<div class="ptitle"><span>Step ${PROJ.i+1} / ${p.steps.length}</span></div>${meter(PROJ.i/p.steps.length*100,"gold")}
  <p style="margin:10px 0 6px;font-weight:600">${esc(s.intent)}</p><div class="small muted prose" style="margin-bottom:8px">${s.why||""}</div>
  <div class="tstr-hint" style="cursor:pointer" title="Tap to copy into the terminal" id="projCmd">${esc(s.cmd||"")}</div><div id="projAfter" class="small" style="margin-top:8px;color:var(--green)"></div>`;
  $("#projCmd").onclick=()=>{ const i=$("#term-input"); i.value=(s.cmd||"").split("\n")[0]; i.focus(); };
}
function projCheck(){
  const p=PROJ.p, s=p.steps[PROJ.i]; if(!s) return;
  let ok=false; try{ ok=!!s.validate(cli); }catch(e){}
  if (!ok) return;
  if (s.after) { const a=$("#projAfter"); if(a) a.innerHTML="✓ "+s.after; }
  S.xp+=20; touchStreak(); save(); UI.paintChrome();
  setTimeout(()=>{ PROJ.i++; if (PROJ.i>=p.steps.length){ const was=S.completedProjects[p.id]; if(!was){ S.completedProjects[p.id]=todayStr(); addXP(p.xp,"Build complete"); burst(true); } else addXP(Math.round(p.xp*.25),"Replay"); } projRender(); }, 900);
}

/* ---------- Bash ---------- */
function bashMarkup(id){
  const m=BASH_MISSIONS.find(x=>x.id===id);
  return `${crumbs("labs","Labs")}${head("// LINUX BASH", m?esc(m.t):"Bash sandbox", m?esc(m.d):"The v30 filesystem with logs to dig through. Try ls -la, cat, grep, pipes.")}
  <div class="termwrap"><div id="bashTerm"></div><aside class="side">${m?`<div class="panel edge-gold"><div class="ptitle"><span>Objective</span><span class="chip y">+${m.xp} XP</span></div><p style="margin:0">${esc(m.d)}</p><div id="bashStatus" class="small" style="margin-top:10px"></div>
    <div class="row" style="margin-top:10px"><button class="btn sm" id="bashSol">SHOW A SOLUTION</button><button class="btn sm ai-only" data-ask="${esc(`Give me a hint for this Bash task without the full command: ${m.d}`)}">HINT FROM CYPHER</button></div></div>`:""}
    <div class="panel small muted">Pipes (|), redirects (&gt;), &amp;&amp; all work. Tab completes file names.</div></aside></div>`;
}
function bashStart(id){
  const m=BASH_MISSIONS.find(x=>x.id===id);
  bashReset(null,"matt","mindful");
  const T=makeTerm($("#bashTerm"), {title:"matt@mindful", badge:m?"MISSION":"SANDBOX", label:"Bash terminal", prompt:bashPromptText, complete:bashComplete, onSubmit:(line,T)=>{
    const out=bashExec(line,T);
    if (m && !S.bashDone[m.id]){ let ok=false; try{ ok=m.check(out||"", line); }catch(e){} if (ok){ S.bashDone[m.id]=todayStr(); addXP(m.xp,"Bash mission"); burst(false); T.print("✓ MISSION COMPLETE","ok"); $("#bashStatus").innerHTML=`<span style="color:var(--green)">✓ Complete.</span> <button class="btn sm green" data-go="labs" data-sub='{"tab":"bash"}'>NEXT</button>`; } }
  }});
  T.print("matt@mindful · Bash playground. Type help for commands.","sys");
  if (m && S.bashDone[m.id]) $("#bashStatus").innerHTML=`<span style="color:var(--green)">✓ Already complete.</span> Run it again for practice.`;
  const sol=$("#bashSol"); if (sol) sol.onclick=()=>{ T.input.value=m.solution; T.input.focus(); };
  T.focus();
  CY.ctx=()=>m?`Bash mission "${m.t}": ${m.d}. Current directory ${"/"+BASH_CWD.join("/")}.`:"the Bash sandbox";
}

/* ---------- PowerShell ---------- */
const PSS={w:null, lab:null};
function psMarkup(id){
  const lab=PS_LABS.find(l=>l.id===id);
  return `${crumbs("labs","Labs")}${head("// POWERSHELL · ACTIVE DIRECTORY", lab?`LAB ${lab.n} · ${esc(lab.t)}`:"PowerShell sandbox", lab?esc(lab.intro):"A simulated lab.local domain. Try Get-Command, Get-ADUser -Filter *, Get-Service, Get-WinEvent.")}
  <div class="termwrap"><div id="psTerm"></div><aside class="side"><div class="panel">${lab?`<div class="tasks" id="psTasks"></div>`:""}
  <div class="row" style="margin-top:${lab?12:0}px">${lab?`<button class="btn sm" id="psHint">HINT</button>`:""}<button class="btn sm ai-only" id="psCy">ASK CYPHER</button><button class="btn sm ghost" id="psReset">RESTART</button></div><p class="tiny faint" style="margin:8px 0 0">Tab completes cmdlet names. Pipe to Where-Object, Select-Object, Sort-Object, Format-List.</p></div></aside></div>`;
}
function psStart(id){
  const lab=PS_LABS.find(l=>l.id===id);
  PSS.w=psBaseWorld(); PSS.lab=lab; PSS.done=new Set(); PSS.hints=0; PSS.finished=false; PSS.qperm=null;
  if (lab && lab.setup) lab.setup(PSS.w);
  const T=makeTerm($("#psTerm"), {title:"Windows PowerShell · "+PSS.w.host, badge:"lab.local", label:"PowerShell terminal", prompt:()=>psPrompt(PSS.w), complete:psComplete, onSubmit:(line,T)=>{
    const out=psExec(PSS.w,line);
    for (const l of out){ if (l.clear) T.clear(); else T.print(l.text,l.cls); }
    if (lab) psCheck(T);
  }});
  T.print("Windows PowerShell","sys"); T.print("Copyright (C) Microsoft Corporation. All rights reserved. (simulated lab.local)","dim"); T.print("");
  if (lab){ T.print("▸ "+lab.intro,"hi"); psRenderTasks(); }
  T.focus();
  const hint=$("#psHint"); if (hint) hint.onclick=()=>{ const t=lab.tasks.find(t=>!PSS.done.has(t.id)); if(t&&t.hint) T.print("▸ HINT: "+t.hint,"hi"); else if (t&&t.quiz) T.print("▸ Answer the question in the task panel.","hi"); };
  $("#psCy").onclick=()=>{ const t=lab&&lab.tasks.find(t=>!PSS.done.has(t.id)); cyOpen(`Hint please, without the exact command. ${t?"My task: "+t.desc+".":""} My last commands: ${PSS.w.log.slice(-5).join(" ; ")||"none"}`, true); };
  $("#psReset").onclick=()=>UI.render();
  CY.ctx=()=>{ const t=lab&&lab.tasks.find(t=>!PSS.done.has(t.id)); return lab?`PowerShell lab ${lab.n} "${lab.t}" in a simulated AD domain lab.local. Current task: ${t?t.desc:"all done"}.`:"the PowerShell + AD sandbox"; };
}
function psRenderTasks(){
  const lab=PSS.lab, el=$("#psTasks"); if(!el) return;
  const cur=lab.tasks.find(t=>!PSS.done.has(t.id));
  el.innerHTML=`<div class="tstr-lbl">TASKS <span>${PSS.done.size}/${lab.tasks.length}</span></div>`+lab.tasks.map(t=>`<div class="task ${PSS.done.has(t.id)?"done":t===cur?"current":""}">${esc(t.desc)}</div>`).join("")
    + (cur&&cur.quiz?`<div class="tstr-hint" style="font-family:var(--body)"><b>${esc(cur.quiz.q)}</b><div class="opts" style="margin-top:8px">${(PSS.qperm=PSS.qperm&&PSS.qperm.id===cur.id?PSS.qperm:{id:cur.id,p:shuffle(cur.quiz.opts.map((_,k)=>k))}).p.map((k,j)=>`<button class="opt" data-psq="${k}"><b>${"ABCD"[j]}</b><span>${esc(cur.quiz.opts[k])}</span></button>`).join("")}</div></div>`:"")
    + (!cur?`<div class="fb"><p><b>Lab complete.</b></p><button class="btn sm green" data-go="labs" data-sub='{"tab":"ps"}'>NEXT LAB</button></div>`:"");
}
function psCheck(T){
  const lab=PSS.lab; let progressed=false;
  for (const t of lab.tasks){ if (PSS.done.has(t.id)) continue; if (t.quiz) break; let ok=false; try{ ok=t.check(PSS.w); }catch(e){} if (ok){ PSS.done.add(t.id); progressed=true; T.print("✓ "+t.desc,"ok"); } else break; }
  if (progressed) psRenderTasks();
  psFinish(T);
}
function psFinish(T){
  const lab=PSS.lab;
  if (PSS.done.size===lab.tasks.length && !PSS.finished){ PSS.finished=true; if(!S.psDone[lab.id]){ S.psDone[lab.id]=todayStr(); addXP(lab.xp,"PowerShell lab"); burst(false); } if(T) T.print("━━━ LAB COMPLETE ━━━","ok"); psRenderTasks(); }
}
document.addEventListener("click", e=>{
  const b=e.target.closest("[data-psq]"); if(!b||!PSS.lab) return;
  const cur=PSS.lab.tasks.find(t=>!PSS.done.has(t.id)); if(!cur||!cur.quiz) return;
  const ok=+b.dataset.psq===cur.quiz.ans;
  b.classList.add(ok?"right":"wrong");
  record(PSS.lab.obj, ok);
  if (ok){ setTimeout(()=>{ PSS.done.add(cur.id); psRenderTasks(); const term={print:(t,c)=>{ const o=$("#psTerm .term-out"); if(o){ const d=document.createElement("div"); d.className=c; d.textContent=t; o.appendChild(d); o.scrollTop=1e9; } }}; term.print("✓ "+cur.desc,"ok"); psCheck(term); }, 500); }
  else toast("Not that one. Look at the output again.","err");
});

/* ---------- SQL (v30 engine) ---------- */
function sqlMarkup(id){
  const isCourse=id.startsWith("c:"), item=isCourse?SQL_COURSE.find(c=>c.id===id.slice(2)):SQL_CHALLENGES.find(c=>c.id===id.slice(2));
  return `${crumbs("labs","Labs")}${head("// SQL · "+(isCourse?"COURSE":"SOC CHALLENGE"), esc(item.t), "")}
  <div class="two"><div class="stack"><div class="panel edge-cyan prose">${isCourse?item.teach+`<p><b>Task:</b> ${item.task}</p>`:`<p>${esc(item.d)}</p>`}</div>
    <textarea class="editor" id="sqlIn" spellcheck="false" aria-label="SQL query">${esc(isCourse?(item.starter||""):"")}</textarea>
    <div class="row"><button class="btn green" id="sqlRun">RUN</button><button class="btn sm" id="sqlHint">${isCourse?"HINT":"SHOW SOLUTION"}</button>${isCourse?`<button class="btn sm ghost" id="sqlReveal">REVEAL</button>`:""}<button class="btn sm ghost" id="sqlReset">RESET DATA</button><button class="btn sm ai-only" data-ask="${esc("Help me with this SQL task without giving me the full query: "+(isCourse?String(item.task).replace(/<[^>]+>/g,""):item.d))}">ASK CYPHER</button></div>
    <div id="sqlOut"></div></div>
  <div class="panel"><div class="ptitle"><span>Database</span></div><div id="sqlSchema" class="small"></div></div></div>`;
}
function sqlStart(id){
  const isCourse=id.startsWith("c:"), item=isCourse?SQL_COURSE.find(c=>c.id===id.slice(2)):SQL_CHALLENGES.find(c=>c.id===id.slice(2));
  const schema=()=>{ $("#sqlSchema").innerHTML=Object.entries(SQL_DB).map(([t,v])=>`<div style="margin-bottom:8px"><b class="mono" style="color:var(--cyan)">${esc(t)}</b> <span class="faint">(${v.rows.length} rows)</span><div class="mono tiny muted">${v.cols.map(esc).join(", ")}</div></div>`).join(""); };
  schema();
  const run=()=>{
    const sql=$("#sqlIn").value; let r; try{ r=runSqlQuery(sql); }catch(e){ r={error:e.message}; }
    const out=$("#sqlOut");
    if (r.error){ out.innerHTML=`<div class="fb bad"><p><b>Error:</b> ${esc(r.error)}</p></div>`; return; }
    let html = r.cols ? `<div class="sqlres"><table><tr>${r.cols.map(c=>`<th>${esc(c)}</th>`).join("")}</tr>${r.rows.slice(0,50).map(row=>`<tr>${row.map(v=>`<td>${esc(v==null?"NULL":v)}</td>`).join("")}</tr>`).join("")}</table></div><div class="tiny faint">${r.rows.length} row${r.rows.length===1?"":"s"}</div>` : `<div class="fb"><p>${esc(r.message||"Done.")}</p></div>`;
    let ok=false; try{ ok=!!item.check(r); }catch(e){}
    const store=isCourse?S.sqlCourseDone:S.sqlDone;
    if (ok){ html+=`<div class="fb"><p><b>✓ Correct.</b></p></div>`; if(!store[item.id]){ store[item.id]=todayStr(); addXP(isCourse?25:(item.xp||40), "SQL"); } }
    out.innerHTML=html; schema();
  };
  $("#sqlRun").onclick=run;
  $("#sqlIn").addEventListener("keydown",e=>{ if((e.ctrlKey||e.metaKey)&&e.key==="Enter"){ e.preventDefault(); run(); } });
  $("#sqlHint").onclick=()=>{ if (isCourse){ $("#sqlOut").innerHTML=`<div class="fb"><p>${item.hint}</p></div>`; } else { $("#sqlIn").value=item.solution; } };
  const rv=$("#sqlReveal"); if (rv) rv.onclick=()=>{ $("#sqlIn").value=item.reveal; };
  $("#sqlReset").onclick=()=>{ SQL_DB=JSON.parse(JSON.stringify(SQL_INITIAL_DB)); schema(); toast("Database reset"); };
  CY.ctx=()=>`a SQL ${isCourse?"lesson":"challenge"} "${item.t}". Task: ${isCourse?String(item.task).replace(/<[^>]+>/g,""):item.d}. Tables: ${Object.keys(SQL_DB).join(", ")}.`;
}

/* =========================== CODE (Python) =========================== */
VIEWS.code = function(){
  const st=UI.sub.code||{};
  if (st.open) return pyMarkup(st.open);
  CY.ctx=()=>"the Python section";
  const pyP=PROJECTS.filter(p=>p.kind==="python");
  return `${head("// PYTHON · REAL INTERPRETER", "Code", "Real Python 3 runs in your browser, on phone or PC. Hidden tests grade your functions, the same way PACKETKILL's code lab did. The first run downloads about 10 MB, then it's quick.")}
  <button class="panel ide-launch" data-go="code" data-sub='{"open":"ide"}'><span class="ide-glyph">&gt;&gt;&gt;_</span><span><b>PyShell</b><small>IDLE-style editor and live Python shell. Run a script with F5, then poke at its variables. numpy, pandas, scikit-learn and matplotlib load on their own.</small></span><span class="chip">OPEN</span></button>
  <div class="two"><div class="panel"><div class="ptitle"><span>Exercises</span><b>${Object.keys(S.pyDone).length}/${PY_EX.length}</b></div><div class="list">${PY_EX.map((x,k)=>`<button class="li ${S.pyDone[x.id]?"done":""}" data-go="code" data-sub='{"open":"${x.id}"}'><span class="n">${S.pyDone[x.id]?"✓":String(k+1).padStart(2,"0")}</span><span>${esc(x.t)}<small>${esc(x.brief.split(". ")[0])}</small></span><span class="chip y">+${x.xp}</span></button>`).join("")}</div></div>
  <div class="panel"><div class="ptitle"><span>Guided builds from v30</span><b>${pyP.filter(p=>S.completedProjects[p.id]).length}/${pyP.length}</b></div><p class="small muted" style="margin-top:0">Build a script one step at a time. Each step is checked, and you can run the whole file for real.</p><div class="list">${pyP.map(p=>`<button class="li ${S.completedProjects[p.id]?"done":""}" data-go="code" data-sub='{"open":"proj:${p.id}"}'><span class="n">${S.completedProjects[p.id]?"✓":"◆"}</span><span>${esc(p.title)}<small>${esc(p.blurb)}</small></span><span class="chip">${p.steps.length} steps</span></button>`).join("")}</div></div></div>`;
};
const PYS={ex:null, proj:null, i:0, fails:0};
function pyMarkup(id){
  if (id==="ide") return ideMarkup();
  if (id.startsWith("proj:")){
    const p=PROJECTS.find(x=>x.id===id.slice(5));
    return `${crumbs("code","Code")}${head("// GUIDED BUILD", esc(p.title), esc(p.blurb))}
    <div class="two"><div class="stack"><div class="term-head" style="border:1px solid #173225;border-bottom:0;border-radius:6px 6px 0 0"><span class="dots"><i></i><i></i><i></i></span><span>${esc(p.filename||"script.py")}</span><span></span></div>
      <textarea class="editor" id="pyEd" spellcheck="false" aria-label="Python editor" style="border-radius:0 0 6px 6px;margin-top:-14px;min-height:320px"></textarea>
      <div class="row"><button class="btn green" id="pyCheck">CHECK STEP</button><button class="btn" id="pyRun">▶ RUN FILE</button><button class="btn sm ghost" id="pyStop" disabled>■ STOP</button><span class="small muted" id="pyState"></span></div><div class="pyout" id="pyOut" aria-live="polite"></div></div>
    <div class="panel edge-gold" id="pyStep"></div></div>`;
  }
  const x=PY_EX.find(e=>e.id===id);
  return `${crumbs("code","Code")}${head("// EXERCISE", esc(x.t), esc(x.brief))}
  <div class="two"><div class="stack"><textarea class="editor" id="pyEd" spellcheck="false" aria-label="Python editor">${esc(S.widgets["py:"+id]||x.starter)}</textarea>
    <div class="row"><button class="btn green" id="pyTest">▶ RUN TESTS</button><button class="btn" id="pyRun">RUN</button><button class="btn sm ghost" id="pyStop" disabled>■ STOP</button><button class="btn sm ghost" id="pyHint">HINT</button><button class="btn sm ghost" id="pySol" style="display:none">SHOW SOLUTION</button><span class="small muted" id="pyState"></span></div>
    <div class="pyout" id="pyOut" aria-live="polite">Output shows here.</div></div>
  <div class="stack"><div class="panel"><div class="ptitle"><span>Tests</span><span class="chip y">+${x.xp} XP</span></div><div id="pyTests">${x.out?`<div class="testrow"><span>○</span><span>prints exactly: ${esc(x.out)}</span></div>`:""}${x.tests.map(t=>`<div class="testrow"><span>○</span><span>${esc(t[0])}</span></div>`).join("")}</div></div>
    <div class="panel ai-only"><div class="ptitle"><span>CYPHER</span></div><button class="op-item" id="pyAsk"><span class="oi">?</span><span>Explain my error, don't fix it for me</span><span></span></button></div></div></div>`;
}
VIEWS.codeAfter = function(){
  const st=UI.sub.code||{}; if(!st.open) return;
  if (st.open==="ide"){ ideAfter(); return; }
  const out=$("#pyOut"), state=$("#pyState");
  const setState=t=>state.textContent=t;
  pyBoot().then(()=>setState("Python ready")).catch(()=>setState("Python couldn't load. Check your internet connection and reload."));
  if (PY.status!=="ready") setState("Loading Python…");
  const show=(r)=>{ out.innerHTML = esc(r.out||"") + (r.err?`<span class="err">${esc(pyTidyErr(r.err))}</span>`:"") + (r.images||[]).map(b=>`<img alt="matplotlib figure" src="data:image/png;base64,${b}">`).join(""); if(!r.out&&!r.err&&!(r.images||[]).length) out.textContent="(no output)"; };
  const stopB=$("#pyStop"); if (stopB) stopB.onclick=()=>pyStop();
  // run with live output, status updates and a working STOP button
  const runLive=async(code, tests, stdin, label)=>{
    out.textContent=label||"Running…"; let live="", started=false;
    if (stopB) stopB.disabled=false;
    try{
      return await pyRun(code, tests, stdin, {limit:60000, onStatus:setState, onOut:c=>{ if(!started){ started=true; out.textContent=""; } live+=c; out.textContent=live; out.scrollTop=out.scrollHeight; }});
    } finally { if (stopB) stopB.disabled=true; setState(PY.status==="ready"?"Python ready":"Python restarting…"); }
  };
  if (st.open.startsWith("proj:")){
    const p=PROJECTS.find(x=>x.id===st.open.slice(5)); PYS.proj=p; PYS.i=0;
    const ed=$("#pyEd"); ed.value=S.widgets["pyp:"+p.id]||"";
    const step=()=>{ const s=p.steps[PYS.i], el=$("#pyStep");
      if (!s){ el.innerHTML=`<div class="ptitle"><span>Build complete</span></div><p style="margin:0">You built <b>${esc(p.title)}</b>. Run it to see it work.</p>`; return; }
      el.innerHTML=`<div class="ptitle"><span>Step ${PYS.i+1} / ${p.steps.length}</span></div>${meter(PYS.i/p.steps.length*100,"gold")}<p style="margin:10px 0 6px;font-weight:600">${esc(s.intent)}</p><div class="small muted prose">${s.why||""}</div><div class="ptitle" style="margin-top:10px"><span>Add this to the file</span></div><pre class="hash" style="white-space:pre-wrap">${esc(s.code||"")}</pre><div id="pyAfter" class="small" style="color:var(--green)"></div>`; };
    // resume at the first unmet step
    while (PYS.i<p.steps.length){ let ok=false; try{ ok=p.steps[PYS.i].validate(ed.value); }catch(e){} if(!ok) break; PYS.i++; }
    step();
    ed.addEventListener("input",()=>{ S.widgets["pyp:"+p.id]=ed.value; saveLocal(); });
    $("#pyCheck").onclick=()=>{ const s=p.steps[PYS.i]; if(!s) return; let ok=false; try{ ok=s.validate(ed.value); }catch(e){} if (ok){ if(s.after) $("#pyAfter").innerHTML="✓ "+s.after; S.xp+=20; touchStreak(); save(); UI.paintChrome(); setTimeout(()=>{ PYS.i++; if(PYS.i>=p.steps.length && !S.completedProjects[p.id]){ S.completedProjects[p.id]=todayStr(); addXP(p.xp,"Build complete"); burst(true); } step(); },700); } else toast("Not yet. Compare your file to the step card.","err"); };
    $("#pyRun").onclick=async()=>{ try{ show(await runLive(ed.value, [], ["Matthew","5","yes","test@example.com"])); }catch(e){ out.textContent="Python couldn't load: "+e.message; } };
    CY.ctx=()=>`a guided Python build "${p.title}", step ${PYS.i+1}: ${(p.steps[PYS.i]||{}).intent||"done"}. Current file:\n${ed.value.slice(0,1500)}`;
    return;
  }
  const x=PY_EX.find(e=>e.id===st.open); PYS.ex=x; PYS.fails=0;
  const ed=$("#pyEd");
  ed.addEventListener("input",()=>{ S.widgets["py:"+x.id]=ed.value; saveLocal(); });
  $("#pyRun").onclick=async()=>{ try{ show(await runLive(ed.value)); }catch(e){ out.textContent="Python couldn't load: "+e.message; } };
  $("#pyHint").onclick=()=>{ out.innerHTML=`<span style="color:var(--gold)">Hint: ${esc(x.hint)}</span>`; };
  $("#pySol").onclick=()=>{ ed.value=x.solution; S.widgets["py:"+x.id]=ed.value; };
  $("#pyAsk").onclick=()=>cyOpen(`Here's my Python for "${x.t}". Explain what's wrong without writing the fixed code for me.\n\n${ed.value}\n\nOutput/error:\n${out.textContent.slice(0,800)}`, true);
  $("#pyTest").onclick=async()=>{
    let r; try{ r=await runLive(ed.value, x.tests, undefined, "Running tests…"); }catch(e){ out.textContent="Python couldn't load: "+e.message; return; }
    show(r);
    const rows=[]; let pass=0, total=0;
    if (x.out!==undefined){ total++; const ok=(r.out||"").trim()===x.out; if(ok) pass++; rows.push([ok, "prints exactly: "+x.out, ok?"":"got: "+((r.out||"").trim()||"(nothing)")]); }
    for (const [d,ok,msg] of (r.results||x.tests.map(t=>[t[0],false,r.err?"code didn't run":""]))){ total++; if(ok) pass++; rows.push([ok,d,msg]); }
    $("#pyTests").innerHTML=rows.map(([ok,d,m])=>`<div class="testrow"><span class="${ok?"p":"f"}">${ok?"✓":"✗"}</span><span>${esc(d)}${m?`<br><span class="faint">${esc(m)}</span>`:""}</span></div>`).join("");
    if (pass===total && !r.err){ if(!S.pyDone[x.id]){ S.pyDone[x.id]=todayStr(); addXP(x.xp,"Python"); burst(false); } else toast("All tests pass"); }
    else { PYS.fails++; if (PYS.fails>=2) $("#pySol").style.display=""; }
  };
  CY.ctx=()=>`a Python exercise "${x.t}": ${x.brief}\nTheir current code:\n${ed.value.slice(0,1500)}`;
};

/* =========================== OPS (story missions) =========================== */
VIEWS.ops = function(){
  const st=UI.sub.ops||{};
  if (st.open) return missionMarkup(st.open);
  CY.ctx=()=>"the missions list";
  return `${head("// FIELD OPERATIONS", "Missions", "Story missions chain every skill together: Bash log hunting, PowerShell on the domain controller, and the incident response calls you'd make on the job.")}
  <div class="grid">${MISSIONS_V2.map(m=>{ const p=S.missions[m.id]||{}; const done=p.done; const at=p.stage||0; return `<button class="tile red ${done?"done":""}" data-go="ops" data-sub='{"open":"${m.id}"}'><span class="t-ic">☰</span><div class="eyebrow">${m.code}</div><h3>${esc(m.title)}</h3><p>${esc(m.premise)}</p><div class="t-foot"><span class="chip">${esc(m.tag)}</span><span class="chip ${done?"g":"y"}">${done?"COMPLETE":at?`STAGE ${at+1}/${m.stages.length}`:"+"+m.xp+" XP"}</span></div></button>`; }).join("")}</div>`;
};
const OPS={m:null, stage:0, w:null, ans:{}};
function missionMarkup(id){
  const m=MISSIONS_V2.find(x=>x.id===id); const p=S.missions[id]||{stage:0};
  const si=Math.min(UI.sub.ops.stage ?? p.stage ?? 0, m.stages.length-1); const s=m.stages[si];
  OPS.m=m; OPS.stage=si; OPS.ans={};
  const mapH=`<div class="mission-map">${m.stages.map((x,k)=>{ const reached=k<= (p.done?m.stages.length:(p.stage||0)); return `<div class="mstep ${k<(p.done?m.stages.length:(p.stage||0))?"done":k===si?"cur":""}"><button class="li" style="width:100%;${k===si?"border-color:var(--gold2)":""}" ${reached?`data-go="ops" data-sub='${JSON.stringify({open:id,stage:k})}'`:"disabled"}><span class="n">${String(k+1).padStart(2,"0")}</span><span>${esc(x.title)}<small>${x.env==="bash"?"Bash · "+x.host:x.env==="ps"?"PowerShell · "+x.host:"Debrief"}</small></span><span>${reached?"":"🔒"}</span></button></div>`; }).join("")}</div>`;
  return `${crumbs("ops","Missions")}${head("// "+m.code+" · STAGE "+(si+1)+" OF "+m.stages.length, esc(m.title), "")}
  <div class="termwrap keep"><div class="stack">
    ${si===0?`<div class="dossier"><span class="stamp">CLASSIFIED // TRAINING</span><p style="margin:10px 0 0">${esc(m.premise)}</p></div>`:""}
    <div class="panel edge-red"><div class="ptitle"><span>${esc(s.title)}</span></div><p style="margin:0">${esc(s.brief)}</p></div>
    ${s.env!=="none"?`<div id="opsTerm"></div>`:""}
    <div class="panel stack" id="opsTasks"></div>
  </div><aside class="side"><div class="panel">${mapH}</div><div class="panel ai-only"><button class="op-item" id="opsCy"><span class="oi">?</span><span>Ask CYPHER for a nudge<small>No spoilers</small></span><span></span></button></div></aside></div>`;
}
VIEWS.opsAfter = function(){
  const st=UI.sub.ops||{}; if(!st.open) return;
  const m=OPS.m, s=m.stages[OPS.stage];
  if (s.env==="bash"){ bashReset(s.fs, "matt", s.host); const T=makeTerm($("#opsTerm"),{title:"matt@"+s.host, badge:"INCIDENT", label:"Bash terminal", prompt:bashPromptText, complete:bashComplete, onSubmit:(line,T)=>{ bashExec(line,T); }}); T.print(`Connected to ${s.host}. Type help for commands.`,"sys"); T.focus(); OPS.T=T; }
  if (s.env==="ps"){ OPS.w=psBaseWorld(); if (s.world) s.world(OPS.w); OPS.w.host=s.host||OPS.w.host; const T=makeTerm($("#opsTerm"),{title:"PowerShell · "+OPS.w.host, badge:"lab.local", label:"PowerShell terminal", prompt:()=>psPrompt(OPS.w), complete:psComplete, onSubmit:(line,T)=>{ for(const l of psExec(OPS.w,line)){ if(l.clear) T.clear(); else T.print(l.text,l.cls); } opsRenderTasks(); }}); T.print(`Connected to ${OPS.w.host} as LAB\\matthew.`,"sys"); T.focus(); OPS.T=T; }
  opsRenderTasks();
  $("#opsCy").onclick=()=>{ const t=s.tasks.find((t,k)=>!opsTaskDone(t,k)); cyOpen(`I'm on mission ${m.title}, stage "${s.title}". ${t?`I'm trying to answer: ${t.q||t.desc}.`:""} Give me a nudge without the answer.`, true); };
  CY.ctx=()=>`story mission ${m.title}, stage "${s.title}": ${s.brief}`;
};
function opsTaskDone(t,k){ if (t.type==="state") { try{ return OPS.w && t.check(OPS.w); }catch(e){ return false; } } return !!OPS.ans[k]; }
function opsRenderTasks(){
  const m=OPS.m, s=m.stages[OPS.stage], el=$("#opsTasks"); if(!el) return;
  const prevAnswers=OPS.ans;
  el.innerHTML = `<div class="ptitle"><span>Objectives</span><b>${s.tasks.filter((t,k)=>opsTaskDone(t,k)).length}/${s.tasks.length}</b></div>` + s.tasks.map((t,k)=>{
    const done=opsTaskDone(t,k);
    if (t.type==="answer") return `<div class="task ${done?"done":"current"}" style="padding-left:28px"><div>${esc(t.q)}</div>${done?`<div class="mono small" style="color:var(--green);margin-top:4px">${esc(prevAnswers[k])}</div>`:`<form class="answer-in" data-ans="${k}" style="margin-top:6px"><input type="text" aria-label="Answer" placeholder="Your answer" autocomplete="off"><button class="btn sm gold">SUBMIT</button><button type="button" class="btn sm ghost" data-ophint="${k}">HINT</button></form>`}</div>`;
    if (t.type==="state") return `<div class="task ${done?"done":""}">${esc(t.desc)}${done?"":` <button type="button" class="btn sm ghost" style="margin-left:6px;padding:2px 8px" data-ophint="${k}">HINT</button>`}</div>`;
    if (t.type==="choice"){ OPS.perm=OPS.perm||{}; const pm=OPS.perm[OPS.stage+":"+k]=OPS.perm[OPS.stage+":"+k]||shuffle(t.opts.map((_,j)=>j)); return `<div class="task ${done?"done":"current"}"><div style="margin-bottom:6px">${esc(t.q)}</div>${done?`<div class="small" style="color:var(--green)">${esc(t.opts[t.ans])}</div>`:`<div class="opts">${pm.map((j,i)=>`<button class="opt" data-opch="${k}:${j}"><b>${"ABCD"[i]}</b><span>${esc(t.opts[j])}</span></button>`).join("")}</div>`}</div>`; }
  }).join("");
  const all=s.tasks.every((t,k)=>opsTaskDone(t,k));
  if (all){
    const last = OPS.stage===m.stages.length-1;
    el.innerHTML += s.report && last ? `<div class="fb"><p><b>Mission complete.</b> Optional: write a three-sentence incident summary and let CYPHER review it like your lead would.</p><textarea id="opsReport" rows="4" style="width:100%;margin:8px 0" placeholder="What happened, what you did, what should change."></textarea><div class="row"><button class="btn sm ai-only" id="opsReview">CYPHER REVIEW</button><button class="btn green" data-go="ops" data-sub="{}">ALL MISSIONS</button></div><div class="msg cy" id="opsRevOut" style="display:none;max-width:100%"></div></div>`
      : `<div class="fb"><p><b>Stage clear.</b></p><button class="btn green" id="opsNext">${last?"FINISH MISSION":"NEXT STAGE ▶"}</button></div>`;
    opsStageClear();
    const nx=$("#opsNext"); if (nx) nx.onclick=()=>{ if (last) UI.go("ops",{}); else UI.go("ops",{open:m.id, stage:OPS.stage+1}); };
    const rv=$("#opsReview"); if (rv) rv.onclick=async()=>{ const t=$("#opsReport").value.trim(); const o=$("#opsRevOut"); o.style.display="block"; if(t.length<30){ o.textContent="Write a few sentences first."; return; } rv.disabled=true; o.textContent="Reviewing…"; try{ await cyOnce(`${CY_PERSONA}\n\nReview Matthew's incident summary for this training scenario like a supportive senior admin would. Facts of the scenario: brute force on web01 from 203.0.113.45 (47 failed SSH logins total), success as service account svc_backup with an old 2019 password, downloaded and ran /tmp/k.sh as root via sudo, which read plaintext domain creds from /etc/backup/creds.conf and used LDAP to DC01 (10.0.2.10); svc_backup was added to Domain Admins and a backdoor account helpdesk2 was created; containment disabled both accounts and removed them from Domain Admins. Give a score out of 10, what's strong, what's missing, and one sentence rewritten the way a pro would say it. Under 180 words.\n\nHis summary:\n"""${t.slice(0,3000)}"""`, txt=>o.textContent=txt).then(txt=>o.textContent=txt); }catch(e){ o.textContent="Couldn't review right now."; } finally{ rv.disabled=false; } };
  }
}
function opsStageClear(){
  const m=OPS.m; const p=S.missions[m.id]||{stage:0};
  const nextStage=OPS.stage+1;
  if (OPS.stage===m.stages.length-1){ if(!p.done){ p.done=todayStr(); p.stage=m.stages.length-1; S.missions[m.id]=p; addXP(m.xp, m.title+" complete"); burst(true); } }
  else if ((p.stage||0)<nextStage){ p.stage=nextStage; S.missions[m.id]=p; addXP(30,"Stage clear"); }
  save();
}
document.addEventListener("submit", e=>{
  const f=e.target.closest("[data-ans]"); if(!f) return; e.preventDefault();
  const k=+f.dataset.ans, t=OPS.m.stages[OPS.stage].tasks[k], v=f.querySelector("input").value.trim();
  const norm=x=>x.toLowerCase().replace(/\s+/g," ").replace(/^["']|["']$/g,"").trim();
  if (t.accept.some(a=>norm(a)===norm(v))){ OPS.ans[k]=v; toast("Confirmed"); opsRenderTasks(); }
  else { f.querySelector("input").setAttribute("aria-invalid","true"); toast("Doesn't match the evidence. Dig more.","err"); }
});
document.addEventListener("click", e=>{
  const h=e.target.closest("[data-ophint]"); if (h && OPS.m){ const t=OPS.m.stages[OPS.stage].tasks[+h.dataset.ophint]; if (OPS.T) OPS.T.print("▸ HINT: "+t.hint,"hi"); else toast(t.hint); return; }
  const c=e.target.closest("[data-opch]"); if (c && OPS.m){ const [k,j]=c.dataset.opch.split(":").map(Number); const t=OPS.m.stages[OPS.stage].tasks[k]; if (j===t.ans){ OPS.ans[k]=true; opsRenderTasks(); } else { c.classList.add("wrong"); toast("Not the best answer. Think like the lead.","err"); } }
});

/* =========================== BOOT =========================== */
(function boot(){
  loadLocal();
  if (!location.hash) history.replaceState(null,"","#hq");
  UI.render();
  startSync();
  cyEnsure();
})();
