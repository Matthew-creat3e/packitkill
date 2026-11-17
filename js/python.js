/* ============ PACKETKILL v3 · REAL PYTHON (Pyodide in a worker) ============
   - auto-loads numpy / pandas / scikit-learn / matplotlib / scipy etc. from your imports
   - tries micropip for pure-Python PyPI packages that Pyodide doesn't ship
   - run timer starts AFTER packages load (downloads no longer count against it)
   - live output streaming, STOP button support, matplotlib plots returned as images
   - __name__ == "__main__" works
   - clear message for libraries that can't run in a browser (PyTorch, TensorFlow…)
============================================================================ */
const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";
const PY_LIMITS = { load: 180000, run: 30000 };   // ms; callers can pass a longer run limit
const PY_HARNESS = `
import json as __json
__res=[]
for __d,__e in __tests:
    try:
        __ok=bool(eval(__e))
        __res.append([__d,__ok,""])
    except Exception as __ex:
        __res.append([__d,False,type(__ex).__name__+": "+str(__ex)])
__json.dumps(__res)
`;
const PY_CAPTURE = `
import sys as __sys, json as __json
__imgs=[]
if "matplotlib.pyplot" in __sys.modules:
    import io as __io, base64 as __b64
    __plt=__sys.modules["matplotlib.pyplot"]
    for __n in __plt.get_fignums():
        __buf=__io.BytesIO()
        __plt.figure(__n).savefig(__buf, format="png", dpi=96, bbox_inches="tight")
        __imgs.append(__b64.b64encode(__buf.getvalue()).decode())
    __plt.close("all")
__json.dumps(__imgs)
`;
const PY_FIND_MISSING = `
import json as __json, importlib.util as __iu
try:
    from pyodide.code import find_imports as __fi
    __miss=[m for m in __fi(__src) if __iu.find_spec(m) is None]
except Exception:
    __miss=[]
__json.dumps(__miss)
`;
// libraries that need native code / GPUs and cannot run in a browser
// IDLE-style shell: compile one interactive entry; "more" = needs continuation lines
const PY_REPL = `
def __pk_push(src, g):
    import codeop, sys, traceback
    try:
        c = codeop.compile_command(src, "<pyshell>", "single")
    except (SyntaxError, OverflowError, ValueError) as e:
        try:
            c = compile(src, "<pyshell>", "exec")   # pasted block with several statements
        except (SyntaxError, OverflowError, ValueError) as e2:
            sys.stderr.write("".join(traceback.format_exception_only(type(e2), e2)))
            return "done"
    if c is None:
        return "more"
    try:
        exec(c, g)
    except SystemExit:
        pass
    except BaseException:
        t, v, tb = sys.exc_info()
        sys.stderr.write("".join(traceback.format_exception(t, v, tb.tb_next)))
    return "done"
`;
const PY_BLOCKED = {
  torch:"PyTorch", torchvision:"PyTorch", torchaudio:"PyTorch", tensorflow:"TensorFlow", keras:"Keras",
  jax:"JAX", jaxlib:"JAX", transformers:"Hugging Face Transformers", onnxruntime:"ONNX Runtime", cupy:"CuPy"
};
const PY = { worker:null, ready:null, status:"idle", seq:0, pending:{} };

/* ---------- this function runs INSIDE the worker (stringified below) ---------- */
function pyWorkerMain(URL_, HARNESS, CAPTURE, FIND_MISSING, BLOCKED, REPL){
  let session=null;   // persistent IDLE-style shell namespace
  try{ importScripts(URL_+"pyodide.js"); }catch(e){ postMessage({fatal:"Couldn't download Python. Check your connection."}); throw e; }
  let py=null;
  const ready=loadPyodide({indexURL:URL_}).then(async p=>{
    py=p;
    await py.runPythonAsync('import os, warnings\nos.environ["MPLBACKEND"]="AGG"\nwarnings.filterwarnings("ignore", message=".*non-interactive.*")\nwarnings.filterwarnings("ignore", message=".*FigureCanvasAgg.*")');
    await py.runPythonAsync(REPL);
    postMessage({ready:true});
  }).catch(e=>postMessage({fatal:String(e&&e.message||e)}));

  const MAX_OUT=200000;
  onmessage=async(e)=>{
    await ready; if(!py) return;
    const {id,code,tests,stdin,mode}=e.data;
    if (mode==="reset"){ try{ session&&session.destroy(); }catch(_){} session=null; postMessage({id,out:"",err:null,results:null,images:[]}); return; }
    let out="", err=null, results=null, images=[], clipped=false;
    const emit=(s,stream)=>{ if(out.length>MAX_OUT){ if(!clipped){ clipped=true; postMessage({id,chunk:"\n…output truncated…\n"}); } return; } out+=s+"\n"; postMessage({id,chunk:s+"\n",stream}); };
    py.setStdout({batched:s=>emit(s,"out")}); py.setStderr({batched:s=>emit(s,"err")});
    const newNs=()=>{ const d=py.globals.get("dict")(); d.set("__name__","__main__"); return d; };
    const lines=(stdin||[]).slice(); py.setStdin({stdin:()=>lines.length?lines.shift():null});

    // 1) packages: blocked libs, Pyodide packages, then micropip for anything still missing
    const imp=[...code.matchAll(/^\s*(?:from|import)\s+([A-Za-z_][\w]*)/gm)].map(m=>m[1]);
    const bad=[...new Set(imp.filter(m=>BLOCKED[m]))];
    if (bad.length){
      const names=[...new Set(bad.map(m=>BLOCKED[m]))].join(", ");
      postMessage({id,out:"",err:`ModuleNotFoundError: ${names} can't run inside a browser (it needs native code or a GPU).\nUse scikit-learn (sklearn) or plain numpy for models here. Run PyTorch/TensorFlow on the Mindful workstation instead.`,results:null,images:[]});
      return;
    }
    try{
      await py.loadPackagesFromImports(code,{messageCallback:m=>{ if(/^Loading /.test(m)) postMessage({id,status:m.replace(/, /g,", ")}); }, errorCallback:()=>{}});
    }catch(_){ /* syntax errors etc. surface when the code runs */ }
    try{
      const scan=py.globals.get("dict")(); scan.set("__src",code);
      const missing=JSON.parse(await py.runPythonAsync(FIND_MISSING,{globals:scan})); scan.destroy();
      if (missing.length){
        postMessage({id,status:"Installing "+missing.join(", ")+" from PyPI…"});
        await py.loadPackage("micropip");
        const mp=py.pyimport("micropip");
        for (const m of missing){ try{ await mp.install(m); }catch(_){ } }
        mp.destroy&&mp.destroy();
      }
    }catch(_){ }

    postMessage({id,phase:"running"});
    // 2a) shell line: run inside the persistent session, echo expressions like IDLE
    if (mode==="repl"){
      if (!session) session=newNs();
      let state="done";
      try{ const push=py.globals.get("__pk_push"); state=push(code, session); push.destroy(); }catch(ex){ err=String(ex.message||ex); }
      try{ const cap=py.globals.get("dict")(); images=JSON.parse(await py.runPythonAsync(CAPTURE,{globals:cap})); cap.destroy(); }catch(_){ images=[]; }
      postMessage({id,out,err,results:null,images,state}); return;
    }
    // 2b) script: "script" mode restarts the shell and keeps the namespace afterwards (IDLE's F5)
    const keep = mode==="script";
    if (keep){ try{ session&&session.destroy(); }catch(_){} session=newNs(); }
    const ns = keep ? session : newNs();
    try{ await py.runPythonAsync(code,{globals:ns}); }catch(ex){ err=String(ex.message||ex); }
    if(!err && tests && tests.length){
      try{ ns.set("__tests", py.toPy(tests)); results=JSON.parse(await py.runPythonAsync(HARNESS,{globals:ns})); }catch(ex){ err=String(ex.message||ex); }
    }
    // 3) collect any matplotlib figures
    try{ const cap=py.globals.get("dict")(); images=JSON.parse(await py.runPythonAsync(CAPTURE,{globals:cap})); cap.destroy(); }catch(_){ images=[]; }
    if (!keep){ try{ ns.destroy(); }catch(_){} }
    postMessage({id,out,err,results,images});
  };
}
function pyWorkerSrc(){
  return `(${pyWorkerMain.toString()})(${[PYODIDE_URL,PY_HARNESS,PY_CAPTURE,PY_FIND_MISSING,PY_BLOCKED,PY_REPL].map(v=>JSON.stringify(v)).join(",")});`;
}

function pyKill(){
  try{ PY.worker&&PY.worker.terminate(); }catch(e){}
  PY.worker=null; PY.ready=null; PY.status="idle";
}
function pyBoot(){
  if (PY.ready) return PY.ready;
  PY.status="loading";
  PY.ready = new Promise((resolve, reject)=>{
    try{
      const url = URL.createObjectURL(new Blob([pyWorkerSrc()],{type:"text/javascript"}));
      const w = new Worker(url); PY.worker=w;
      const giveUp=setTimeout(()=>{ PY.status="failed"; reject(new Error("timeout")); }, 90000);
      w.onmessage = e=>{
        const m=e.data;
        if (m.ready){ clearTimeout(giveUp); PY.status="ready"; resolve(); return; }
        if (m.fatal){ clearTimeout(giveUp); PY.status="failed"; reject(new Error(m.fatal)); return; }
        const p=PY.pending[m.id]; if(!p) return;
        if (m.chunk!==undefined){ p.onOut&&p.onOut(m.chunk, m.stream); return; }
        if (m.status){ p.onStatus&&p.onStatus(m.status); return; }
        if (m.phase==="running"){ p.arm(p.runLimit); p.onStatus&&p.onStatus("Running…"); return; }
        delete PY.pending[m.id]; clearTimeout(p.t); p.resolve(m);
      };
      w.onerror = e=>{ e.preventDefault&&e.preventDefault(); clearTimeout(giveUp); PY.status="failed"; reject(new Error(e.message||"worker error")); };
    }catch(e){ PY.status="failed"; reject(e); }
  });
  PY.ready = PY.ready.catch(err=>{ PY.ready=null; throw err; }); // allow a retry on the next run
  PY.ready.catch(()=>{});
  return PY.ready;
}
/* pyRun(code, tests, stdin, opts)
   opts.limit    – max run time in ms after packages load (default 30 s)
   opts.onOut    – called with each chunk of output as it's printed
   opts.onStatus – called with status text ("Loading numpy…", "Running…")
   opts.mode     – undefined (fresh namespace), "script" (restart shell + keep vars), "repl" (one shell entry), "reset" */
async function pyRun(code, tests, stdin, opts){
  opts=opts||{};
  await pyBoot();
  const id=++PY.seq, runLimit=opts.limit||PY_LIMITS.run;
  return new Promise(resolve=>{
    const p={resolve, runLimit, onOut:opts.onOut, onStatus:opts.onStatus, t:null};
    p.arm=(ms)=>{ clearTimeout(p.t); p.t=setTimeout(()=>{
      delete PY.pending[id]; pyKill(); PY.killed=true;
      resolve({out:"", err:`Stopped after ${Math.round(ms/1000)} seconds. Check for a loop that never ends, or make the model/dataset smaller (fewer rows, fewer epochs, smaller n_estimators).`, results:null, images:[]});
    }, ms); };
    p.arm(PY_LIMITS.load);           // generous window while packages download
    PY.pending[id]=p;
    PY.worker.postMessage({id, code, tests, stdin, mode:opts.mode});
  });
}
// STOP button: kill whatever is running and resolve it
function pyStop(){
  PY.killed=true;
  const ids=Object.keys(PY.pending);
  for (const id of ids){ const p=PY.pending[id]; clearTimeout(p.t); p.resolve({out:"", err:"Stopped.", results:null, images:[], stopped:true}); delete PY.pending[id]; }
  pyKill();
}
function pyTidyErr(err){
  if (!err) return "";
  const lines=err.split("\n"); const k=lines.findIndex(l=>/File "<exec>"/.test(l));
  return (k>=0 ? lines.slice(k) : lines.slice(-4)).join("\n").trim();
}
// editor nicety: Tab inserts 4 spaces, Enter keeps indentation
document.addEventListener("keydown", e=>{
  const ta=e.target; if (!ta.classList || !ta.classList.contains("editor")) return;
  if (e.key==="Tab" && !e.shiftKey){ e.preventDefault(); const s=ta.selectionStart; ta.setRangeText("    ", s, ta.selectionEnd, "end"); ta.dispatchEvent(new Event("input",{bubbles:true})); }
  if (e.key==="Enter"){ const s=ta.selectionStart; const lineStart=ta.value.lastIndexOf("\n", s-1)+1; const line=ta.value.slice(lineStart, s); let ind=(line.match(/^\s*/)||[""])[0]; if (/:\s*$/.test(line)) ind+="    "; e.preventDefault(); ta.setRangeText("\n"+ind, s, ta.selectionEnd, "end"); ta.dispatchEvent(new Event("input",{bubbles:true})); }
});
