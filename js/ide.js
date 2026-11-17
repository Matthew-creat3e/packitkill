/* ============ PACKETKILL · PYSHELL (IDLE-style editor + live shell) ============
   Left: script editor with line numbers and files. F5 / Ctrl+Enter runs the file,
   restarts the shell and leaves every variable in it, the same way IDLE's "Run Module" does.
   Right: interactive >>> shell with history, continuation lines (...), and echo of expressions.
=============================================================================== */
const IDE_STARTER = `# PyShell: press F5 (or RUN) to run this file.
# Afterwards, everything it made stays loaded in the shell on the right.
import numpy as np
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier

X, y = load_iris(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)
print("accuracy:", model.score(X_test, y_test))

# Then try these in the shell:
#   model.predict(X_test[:5])
#   y_test[:5]
#   model.feature_importances_
`;
const IDE = { busy:false, buf:[], hist:[], hi:-1, cur:null };

function ideFiles(){
  if (!S.widgets["ide:files"]) S.widgets["ide:files"]={"model.py":IDE_STARTER};
  if (!S.widgets["ide:cur"] || !S.widgets["ide:files"][S.widgets["ide:cur"]]) S.widgets["ide:cur"]=Object.keys(S.widgets["ide:files"])[0];
  return S.widgets["ide:files"];
}

function ideMarkup(){
  const files=ideFiles(), cur=S.widgets["ide:cur"];
  return `${crumbs("code","Code")}${head("// PYSHELL · IDLE MODE", "PyShell", "Write a script, run it with F5, then explore the results in the shell. Same workflow as Python's IDLE. Imports like numpy, pandas, scikit-learn and matplotlib load on their own.")}
  <div class="ide">
    <div class="ide-pane">
      <div class="ide-bar">
        <select id="ideFile" aria-label="Open file">${Object.keys(files).map(f=>`<option ${f===cur?"selected":""}>${esc(f)}</option>`).join("")}</select>
        <input id="ideName" value="${esc(cur)}" aria-label="File name" spellcheck="false">
        <span class="ide-sp"></span>
        <button class="btn sm ghost" id="ideNew" title="New file">NEW</button>
        <button class="btn sm ghost" id="ideOpen" title="Open a .py file from your device">OPEN</button>
        <button class="btn sm ghost" id="ideSave" title="Download this file">SAVE .py</button>
        <button class="btn sm ghost" id="ideDel" title="Delete this file">DEL</button>
        <input type="file" id="ideFileIn" accept=".py,.txt,text/x-python,text/plain" hidden>
      </div>
      <div class="ide-code"><pre class="ide-gut" id="ideGut" aria-hidden="true">1</pre><textarea class="editor ide-text" id="ideEd" spellcheck="false" wrap="off" aria-label="Python script editor"></textarea></div>
      <div class="row ide-run">
        <button class="btn green" id="ideRun" title="F5 or Ctrl+Enter">▶ RUN <span class="k">F5</span></button>
        <button class="btn" id="ideStop" disabled>■ STOP</button>
        <span class="small muted" id="ideState">Loading Python…</span>
      </div>
      <details class="ide-stdin"><summary>Program input for input() calls (one answer per line)</summary><textarea id="ideStdin" rows="3" spellcheck="false" placeholder="Matthew&#10;5"></textarea></details>
    </div>
    <div class="ide-pane">
      <div class="ide-bar"><b class="ide-title">SHELL</b><span class="ide-sp"></span>
        <button class="btn sm ghost" id="ideRestart" title="Restart the shell (clears all variables)">RESTART</button>
        <button class="btn sm ghost" id="ideClear" title="Clear the screen">CLEAR</button>
      </div>
      <div class="ide-shell" id="ideShell">
        <div id="ideLog"></div>
        <div class="ide-inrow"><span class="ide-pr" id="idePr">&gt;&gt;&gt;</span><textarea id="ideIn" rows="1" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="Python shell input"></textarea></div>
      </div>
      <div class="small faint" style="margin-top:6px">Enter runs · Shift+Enter adds a line · ↑/↓ history · Esc stops / cancels</div>
    </div>
  </div>`;
}

function ideAfter(){
  const ed=$("#ideEd"), gut=$("#ideGut"), log=$("#ideLog"), shell=$("#ideShell"), inp=$("#ideIn"), pr=$("#idePr");
  const state=$("#ideState"), runB=$("#ideRun"), stopB=$("#ideStop"), stdinEl=$("#ideStdin");
  const files=ideFiles();
  IDE.buf=[]; IDE.hist=S.widgets["ide:hist"]||[]; IDE.hi=-1;
  stdinEl.value=S.widgets["ide:stdin"]||"";
  const setState=t=>state.textContent=t;

  /* ---------- editor ---------- */
  const paintGut=()=>{ const n=ed.value.split("\n").length; let s=""; for(let i=1;i<=n;i++) s+=i+"\n"; gut.textContent=s; gut.scrollTop=ed.scrollTop; };
  const load=name=>{ S.widgets["ide:cur"]=name; ed.value=files[name]||""; $("#ideName").value=name; paintGut(); };
  const refreshSel=()=>{ $("#ideFile").innerHTML=Object.keys(files).map(f=>`<option ${f===S.widgets["ide:cur"]?"selected":""}>${esc(f)}</option>`).join(""); };
  load(S.widgets["ide:cur"]);
  ed.addEventListener("input",()=>{ files[S.widgets["ide:cur"]]=ed.value; saveLocal(); paintGut(); });
  ed.addEventListener("scroll",()=>{ gut.scrollTop=ed.scrollTop; });
  $("#ideFile").onchange=e=>load(e.target.value);
  $("#ideName").onchange=e=>{ let n=e.target.value.trim()||"untitled.py"; if(!/\.\w+$/.test(n)) n+=".py"; const old=S.widgets["ide:cur"]; if(n===old) return; if(files[n]!==undefined){ toast("A file with that name already exists","err"); e.target.value=old; return; } files[n]=files[old]; delete files[old]; S.widgets["ide:cur"]=n; e.target.value=n; refreshSel(); saveLocal(); };
  $("#ideNew").onclick=()=>{ let i=1, n; do{ n=`untitled${i>1?i:""}.py`; i++; }while(files[n]!==undefined); files[n]=""; load(n); refreshSel(); saveLocal(); ed.focus(); };
  $("#ideDel").onclick=()=>{ const n=S.widgets["ide:cur"]; if(Object.keys(files).length<=1){ files[n]=""; load(n); saveLocal(); return; } delete files[n]; load(Object.keys(files)[0]); refreshSel(); saveLocal(); toast("Deleted "+n); };
  $("#ideOpen").onclick=()=>$("#ideFileIn").click();
  $("#ideFileIn").onchange=e=>{ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ let n=f.name; if(files[n]!==undefined && files[n]!==r.result) n=n.replace(/(\.\w+)?$/,"-1$1"); files[n]=String(r.result); load(n); refreshSel(); saveLocal(); toast("Opened "+n); }; r.readAsText(f); e.target.value=""; };
  $("#ideSave").onclick=()=>{
    const n=S.widgets["ide:cur"];
    try{ const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([ed.value],{type:"text/x-python"})); a.download=n; document.body.appendChild(a); a.click(); a.remove(); toast("Saved "+n); }
    catch(e){ navigator.clipboard&&navigator.clipboard.writeText(ed.value).then(()=>toast("Download blocked here, so the code was copied to your clipboard")); }
  };
  stdinEl.addEventListener("input",()=>{ S.widgets["ide:stdin"]=stdinEl.value; saveLocal(); });
  const stdinLines=()=>stdinEl.value.split("\n").filter((l,i,a)=>!(i===a.length-1&&l===""));

  /* ---------- shell output ---------- */
  const scroll=()=>{ shell.scrollTop=shell.scrollHeight; };
  const line=(cls, text)=>{ const d=document.createElement("div"); d.className=cls; d.textContent=text; log.appendChild(d); scroll(); return d; };
  const outBlock=()=>{ const d=document.createElement("div"); d.className="ide-o"; log.appendChild(d); return d; };
  const writer=blk=>(chunk, stream)=>{ const s=document.createElement("span"); if(stream==="err") s.className="e"; s.textContent=chunk; blk.appendChild(s); scroll(); };
  const finish=(blk, r, live)=>{
    if (r.err){ const s=document.createElement("span"); s.className="e"; s.textContent=(live&&blk.textContent&&!blk.textContent.endsWith("\n")?"\n":"")+pyTidyErr(r.err)+"\n"; blk.appendChild(s); }
    for (const b of (r.images||[])){ const im=new Image(); im.src="data:image/png;base64,"+b; im.alt="matplotlib figure"; im.onload=scroll; blk.appendChild(im); }
    if (!blk.childNodes.length) blk.remove();
    scroll();
  };
  const banner=t=>line("ide-rs", t);
  const busy=on=>{ IDE.busy=on; runB.disabled=on; stopB.disabled=!on; inp.disabled=on; if(!on){ setState("Ready"); setTimeout(()=>inp.focus({preventScroll:true}),0); } };
  const afterKill=()=>{ if (PY.killed){ PY.killed=false; IDE.buf=[]; pr.textContent=">>>"; banner("=============== RESTART: Shell ==============="); } };

  /* ---------- run the file (F5) ---------- */
  const runFile=async()=>{
    if (IDE.busy) return;
    const n=S.widgets["ide:cur"]; IDE.buf=[]; pr.textContent=">>>";
    banner(`=============== RESTART: ${n} ===============`);
    const blk=outBlock(); busy(true); setState("Starting…");
    let r; try{ r=await pyRun(ed.value, [], stdinLines(), {mode:"script", limit:120000, onOut:writer(blk), onStatus:setState}); }
    catch(e){ r={err:"Python couldn't load: "+e.message}; }
    finish(blk, r, true); busy(false); afterKill();
  };
  runB.onclick=runFile;
  stopB.onclick=()=>{ pyStop(); };
  ed.addEventListener("keydown",e=>{ if (e.key==="Enter"&&(e.ctrlKey||e.metaKey)){ e.preventDefault(); e.stopPropagation(); runFile(); } }, true);
  const onKey=e=>{ if (!document.body.contains(ed)){ document.removeEventListener("keydown",onKey); return; } if (e.key==="F5"){ e.preventDefault(); runFile(); } };
  document.addEventListener("keydown",onKey);

  /* ---------- interactive shell ---------- */
  const grow=()=>{ inp.style.height="auto"; inp.style.height=inp.scrollHeight+"px"; };
  inp.addEventListener("input",grow);
  const submit=async()=>{
    const text=inp.value; inp.value=""; grow();
    const lines=text.split("\n");
    lines.forEach((l,i)=>line("ide-i", ((IDE.buf.length||i)?"... ":">>> ")+l));
    if (text.trim()){ IDE.hist.push(text); if(IDE.hist.length>200) IDE.hist.shift(); S.widgets["ide:hist"]=IDE.hist; saveLocal(); }
    IDE.hi=-1;
    if (!IDE.buf.length && !text.trim()) return;           // empty line at >>> does nothing
    IDE.buf.push(...lines);
    let src=IDE.buf.join("\n"); if (lines.length>1) src+="\n"; // pasted block: close it
    const blk=outBlock(); busy(true);
    let r; try{ r=await pyRun(src, [], stdinLines(), {mode:"repl", limit:60000, onOut:writer(blk), onStatus:t=>setState(t)}); }
    catch(e){ r={err:"Python couldn't load: "+e.message}; }
    if (r.state==="more"){
      blk.remove(); pr.textContent="...";
      const last=IDE.buf[IDE.buf.length-1]; let ind=(last.match(/^\s*/)||[""])[0]; if(/:\s*$/.test(last)) ind+="    ";
      busy(false); inp.value=ind; grow();
    } else {
      IDE.buf=[]; pr.textContent=">>>"; finish(blk, r, true); busy(false);
    }
    afterKill();
  };
  inp.addEventListener("keydown",e=>{
    if (e.key==="Enter" && !e.shiftKey){ e.preventDefault(); if(!IDE.busy) submit(); return; }
    if (e.key==="Tab"){ e.preventDefault(); inp.setRangeText("    ", inp.selectionStart, inp.selectionEnd, "end"); return; }
    if (e.key==="Escape"){ e.preventDefault(); if (IDE.busy){ pyStop(); return; } if (IDE.buf.length||inp.value){ line("ide-o e","KeyboardInterrupt"); IDE.buf=[]; pr.textContent=">>>"; inp.value=""; grow(); } return; }
    const firstLine=!inp.value.slice(0,inp.selectionStart).includes("\n"), lastLine=!inp.value.slice(inp.selectionEnd).includes("\n");
    if (e.key==="ArrowUp" && firstLine && IDE.hist.length){ e.preventDefault(); IDE.hi = IDE.hi<0 ? IDE.hist.length-1 : Math.max(0,IDE.hi-1); inp.value=IDE.hist[IDE.hi]; grow(); }
    else if (e.key==="ArrowDown" && lastLine && IDE.hi>=0){ e.preventDefault(); IDE.hi++; if (IDE.hi>=IDE.hist.length){ IDE.hi=-1; inp.value=""; } else inp.value=IDE.hist[IDE.hi]; grow(); }
  });
  shell.addEventListener("click",e=>{ if (!window.getSelection().toString() && e.target.tagName!=="IMG") inp.focus({preventScroll:true}); });
  $("#ideClear").onclick=()=>{ log.innerHTML=""; inp.focus(); };
  $("#ideRestart").onclick=async()=>{ if (IDE.busy) pyStop(); IDE.buf=[]; pr.textContent=">>>"; banner("=============== RESTART: Shell ==============="); try{ await pyRun("",[],[],{mode:"reset"}); }catch(e){} PY.killed=false; inp.focus(); };

  /* ---------- boot ---------- */
  if (!log.childNodes.length) line("ide-o faint","Python 3.12 (Pyodide 0.26) running in your browser.\nType Python here, or run the file on the left with F5.\nPyTorch/TensorFlow can't run in a browser. Use scikit-learn or numpy for models.");
  busy(true); stopB.disabled=true; setState(PY.status==="ready"?"Ready":"Loading Python (about 10 MB the first time)…");
  pyBoot().then(()=>busy(false)).catch(()=>{ IDE.busy=false; runB.disabled=false; inp.disabled=false; setState("Python couldn't load. Check your connection and press RUN to retry."); });
  CY.ctx=()=>`the PyShell (IDLE-style editor + shell). File ${S.widgets["ide:cur"]}:\n${ed.value.slice(0,1500)}\n\nRecent shell output:\n${log.textContent.slice(-800)}`;
}
