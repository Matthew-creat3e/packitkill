/* ============ PACKETKILL v2 · TERMINALS ============ */

/* ---------- generic terminal UI ---------- */
function termKeysHTML(extra){
  const keys = ["TAB","↑","↓","?","^C","|","-","$","'","\"","{","}","@"].concat(extra||[]);
  return `<div class="keys" role="toolbar" aria-label="Terminal keys">${keys.map(k=>`<button type="button" data-tkey="${esc(k)}">${esc(k)}</button>`).join("")}</div>`;
}
function makeTerm(host, opts){
  host.innerHTML = `<div class="term" role="region" aria-label="${esc(opts.label||"Terminal")}">
    <div class="term-head"><span class="dots"><i></i><i></i><i></i></span><span>${esc(opts.title||"")}</span><span>${esc(opts.badge||"")}</span></div>
    <div class="term-out" aria-live="polite"></div>
    <form class="term-in" autocomplete="off"><span class="pr"></span><input type="text" spellcheck="false" autocapitalize="off" autocorrect="off" aria-label="Command input"></form>
    ${termKeysHTML()}
  </div>`;
  const out=host.querySelector(".term-out"), form=host.querySelector("form"), inp=host.querySelector("input"), pr=host.querySelector(".pr");
  const hist=[]; let hi=-1;
  const T = {
    print(text, cls){ const d=document.createElement("div"); d.className=cls||"out"; d.textContent=text; out.appendChild(d); out.scrollTop=out.scrollHeight; },
    lines(arr){ for(const l of arr) T.print(l.text, l.cls); },
    html(h){ const d=document.createElement("div"); d.innerHTML=h; out.appendChild(d); out.scrollTop=out.scrollHeight; },
    clear(){ out.innerHTML=""; },
    prompt(){ pr.textContent = opts.prompt(); },
    focus(){ if (matchMedia("(pointer:fine)").matches) inp.focus(); },
    run(line){ T.print(opts.prompt()+" "+line, "cmd"); hist.push(line); hi=-1; opts.onSubmit(line, T); T.prompt(); },
    input: inp
  };
  form.addEventListener("submit", e=>{ e.preventDefault(); const v=inp.value; inp.value=""; if(!v.trim()){ T.print(opts.prompt(),"cmd"); return; } T.run(v); });
  inp.addEventListener("keydown", e=>{
    if (e.key==="ArrowUp"){ e.preventDefault(); if(!hist.length) return; hi = hi<0 ? hist.length-1 : Math.max(0,hi-1); inp.value=hist[hi]; }
    else if (e.key==="ArrowDown"){ e.preventDefault(); if(hi<0) return; hi++; if(hi>=hist.length){ hi=-1; inp.value=""; } else inp.value=hist[hi]; }
    else if (e.key==="Tab"){ e.preventDefault(); if(opts.complete){ const c=opts.complete(inp.value); if(c) inp.value=c; } }
    else if (e.ctrlKey && (e.key==="c"||e.key==="C")){ e.preventDefault(); T.print(opts.prompt()+" "+inp.value+"^C","dim"); inp.value=""; }
    else if (e.ctrlKey && (e.key==="l"||e.key==="L")){ e.preventDefault(); T.clear(); }
  });
  host.querySelector(".keys").addEventListener("click", e=>{
    const b=e.target.closest("[data-tkey]"); if(!b) return; const k=b.dataset.tkey;
    if (k==="TAB"){ inp.dispatchEvent(new KeyboardEvent("keydown",{key:"Tab",bubbles:true})); }
    else if (k==="↑") inp.dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowUp",bubbles:true}));
    else if (k==="↓") inp.dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowDown",bubbles:true}));
    else if (k==="^C") inp.dispatchEvent(new KeyboardEvent("keydown",{key:"c",ctrlKey:true,bubbles:true}));
    else if (k==="?"){ inp.value="?"; form.requestSubmit(); }
    else { const s=inp.selectionStart??inp.value.length; inp.value=inp.value.slice(0,s)+k+inp.value.slice(inp.selectionEnd??s); inp.setSelectionRange(s+k.length,s+k.length); }
    inp.focus();
  });
  out.addEventListener("click", ()=>{ if (!getSelection().toString()) inp.focus(); });
  T.prompt();
  return T;
}

/* ---------- Bash: extend the v30 engine with more commands ---------- */
const BASHX = { host:"mindful", user:"matt" };
const _bashRunCmdV30 = bashRunCmd;
bashRunCmd = function(cmd, stdin){
  const t = tokenize_bash(cmd); if(!t.length) return stdin;
  const c=t[0], a=t.slice(1);
  const input = stdin || "";
  if (c==="sudo") return bashRunCmd(cmd.replace(/^\s*sudo\s+/,""), stdin);
  if (c==="hostname") return BASHX.host+"\n";
  if (c==="whoami") return BASHX.user+"\n";
  if (c==="id") return `uid=1000(${BASHX.user}) gid=1000(${BASHX.user}) groups=1000(${BASHX.user}),27(sudo)\n`;
  if (c==="uptime") return " 06:41:12 up 12 days,  3:02,  1 user,  load average: 0.21, 0.18, 0.12\n";
  if (c==="df") return "Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        40G   31G  7.2G  82% /\ntmpfs           2.0G     0  2.0G   0% /dev/shm\n";
  if (c==="free") return "               total        used        free      shared  buff/cache   available\nMem:           3.8Gi       1.9Gi       412Mi        12Mi       1.5Gi       1.6Gi\nSwap:          2.0Gi        64Mi       1.9Gi\n";
  if (c==="ps") return "  PID TTY          TIME CMD\n 1021 ?        00:00:03 sshd\n 1188 ?        00:00:12 nginx\n 2210 pts/0    00:00:00 bash\n 2251 pts/0    00:00:00 ps\n";
  if (c==="systemctl"){ if (a.includes("--failed")||a.join(" ").includes("--state=failed")) return "  UNIT          LOAD   ACTIVE SUB    DESCRIPTION\n● backup.service loaded failed failed Nightly backup job\n\n1 loaded units listed.\n"; if (a[0]==="status") return `● ${a[1]||"ssh"}.service\n     Loaded: loaded\n     Active: active (running) since Sun 2026-11-15 04:10:02 UTC\n`; return "Usage: systemctl --failed | systemctl status <unit>\n"; }
  if (c==="journalctl") return "Nov 15 02:31:02 web01 sshd[2391]: Accepted password for svc_backup from 203.0.113.45 port 51877 ssh2\nNov 15 04:00:00 web01 backup.sh[3001]: authentication failure for svc_backup\n";
  if (c==="chmod"){ return a.length>=2 ? "" : "chmod: missing operand\n"; }
  if (c==="ip"||c==="ifconfig") return "2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500\n    inet 10.0.2.20/24 brd 10.0.2.255 scope global eth0\n";
  if (c==="cut"){
    let d="\t", f=null; for(let i=0;i<a.length;i++){ if(a[i].startsWith("-d")) d=a[i].length>2?a[i].slice(2):(a[++i]||"\t"); else if(a[i].startsWith("-f")) f=a[i].length>2?a[i].slice(2):a[++i]; }
    if (!f) return "cut: you must specify a list of fields\n";
    const idx=f.split(",").map(n=>+n-1);
    const src = a.find(x=>!x.startsWith("-") && x!==d && x!==f && !/^\d/.test(x));
    const text = src ? bashRunCmd("cat "+src,"") : input;
    return text.split("\n").filter(l=>l!=="").map(l=>{ const p=l.split(d); return idx.map(i=>p[i]??"").join(d); }).join("\n")+"\n";
  }
  if (c==="tr"){
    const strip = s=>s.replace(/^['"]|['"]$/g,"");
    if (a[0]==="-d") { const set=strip(a[1]||""); return input.split("").filter(ch=>!set.includes(ch)).join(""); }
    const from=strip(a[0]||""), to=strip(a[1]||"");
    if (from==="a-z"&&to==="A-Z") return input.toUpperCase();
    if (from==="A-Z"&&to==="a-z") return input.toLowerCase();
    return input.split("").map(ch=>{ const i=from.indexOf(ch); return i>=0 ? (to[i]??to[to.length-1]) : ch; }).join("");
  }
  if (["awk","sort","uniq"].includes(c) && stdin) return _bashRunCmdV30(cmd, stdin.split("\n").filter(l=>l.trim()!=="").join("\n")+"\n");
  if (c==="base64"){ try{ if (a.includes("-d")||a.includes("--decode")) return atob(input.trim())+"\n"; return btoa(input)+"\n"; }catch(e){ return "base64: invalid input\n"; } }
  return _bashRunCmdV30(cmd, stdin);
};
function bashPromptText(){ const cwd="/"+BASH_CWD.join("/"); const home="/home/"+BASHX.user; return `${BASHX.user}@${BASHX.host}:${cwd.startsWith(home)?"~"+cwd.slice(home.length):cwd}$`; }
function bashComplete(v){
  const parts=v.split(" "), last=parts.pop(); if(!last) return null;
  const dirPath = last.includes("/") ? last.slice(0,last.lastIndexOf("/")+1) : "";
  const stem = last.slice(dirPath.length);
  let node; try{ node = bashGetNode(bashResolve(dirPath||".")); }catch(e){ return null; }
  if (!node||!node.children) return null;
  const hits = Object.keys(node.children).filter(n=>n.startsWith(stem));
  if (hits.length!==1) return null;
  const n=hits[0], isDir=node.children[n].type==="dir";
  return [...parts, dirPath+n+(isDir?"/":"")].join(" ");
}
function bashReset(fsFactory, user, host){
  BASH_FS = fsFactory ? fsFactory() : JSON.parse(JSON.stringify(BASH_FS_INITIAL));
  BASHX.user = user||"matt"; BASHX.host = host||"mindful";
  BASH_CWD = BASH_FS.children.home && BASH_FS.children.home.children[BASHX.user] ? ["home", BASHX.user] : (BASH_FS.children.home && BASH_FS.children.home.children.matt ? ["home","matt"] : []);
}
function bashExec(line, T){
  if (/^\s*clear\s*$/.test(line)){ T.clear(); return ""; }
  let out="";
  try{ out = bashRunPipeline(line); }catch(e){ out = "bash: "+e.message+"\n"; }
  if (out) T.print(out.replace(/\n$/,""), /^bash:|No such file|command not found/.test(out) ? "err" : "out");
  return out;
}

/* ---------- PowerShell + Active Directory simulator ---------- */
const PS_CMDS = ["Get-ADUser","Search-ADAccount","Unlock-ADAccount","Disable-ADAccount","Enable-ADAccount","Set-ADAccountPassword","Set-ADUser","New-ADUser","Remove-ADUser","Get-ADGroupMember","Add-ADGroupMember","Remove-ADGroupMember","Get-ADPrincipalGroupMembership","Get-Service","Start-Service","Stop-Service","Restart-Service","Set-Service","Get-Process","Stop-Process","Get-WinEvent","Test-NetConnection","Get-ChildItem","Get-Content","Get-Command","Get-Date","Get-LocalUser","Clear-Host","Where-Object","Select-Object","Sort-Object","Measure-Object","Format-List","Format-Table","Group-Object","ConvertTo-SecureString","whoami","hostname","ipconfig"];
const PS_ALIAS = {"?":"where-object","where":"where-object","select":"select-object","sort":"sort-object","measure":"measure-object","fl":"format-list","ft":"format-table","group":"group-object","gps":"get-process","ps":"get-process","gsv":"get-service","ls":"get-childitem","dir":"get-childitem","gci":"get-childitem","cat":"get-content","type":"get-content","gc":"get-content","cls":"clear-host","clear":"clear-host","tnc":"test-netconnection","kill":"stop-process","gcm":"get-command"};
const PS_SWITCHES = new Set(["lockedout","accountdisabled","passwordexpired","reset","force","asplaintext","descending","unique","whatif","properties*"]);

function psSplit(s, sep){ // split at top level (outside quotes/brackets)
  const out=[]; let cur="", q=null, depth=0;
  for (let i=0;i<s.length;i++){
    const ch=s[i];
    if (q){ cur+=ch; if(ch===q) q=null; continue; }
    if (ch==='"'||ch==="'"){ q=ch; cur+=ch; continue; }
    if ("({".includes(ch)) depth++;
    if (")}".includes(ch)) depth--;
    if (depth===0 && (sep===" " ? /\s/.test(ch) : ch===sep)){ if(cur.trim()||sep!==" ") out.push(cur); cur=""; continue; }
    cur+=ch;
  }
  if (cur.trim()) out.push(cur);
  return out.map(x=>x.trim()).filter(x=>x!=="");
}
function psValue(tok){
  if (tok==null) return null;
  if (/^\$true$/i.test(tok)) return true;
  if (/^\$false$/i.test(tok)) return false;
  if (/^\$null$/i.test(tok)) return null;
  if (/^-?\d+(\.\d+)?$/.test(tok)) return +tok;
  if (/^(["']).*\1$/s.test(tok)) return tok.slice(1,-1);
  if (/^@\{/.test(tok)){ const body=tok.slice(2,-1); const o={}; for (const part of psSplit(body,";")){ const m=part.match(/^\s*(\w+)\s*=\s*(.+?)\s*$/s); if(m){ const v=m[2]; o[m[1].toLowerCase()] = /,/.test(v) && !/^["']/.test(v) ? v.split(",").map(x=>psValue(x.trim())) : psValue(v); } } return {__hash:o}; }
  if (/^\{/.test(tok)) return {__block: tok.slice(1,-1).trim()};
  if (/^\(/.test(tok)){ const inner=tok.slice(1,-1).trim(); if (/^convertto-securestring/i.test(inner)){ const m=inner.match(/["']([^"']*)["']/); return {__secure: m?m[1]:""}; } return inner; }
  if (tok.includes(",") && !/^["']/.test(tok)) return tok.split(",").map(x=>psValue(x.trim()));
  return tok;
}
function psArgs(tokens){
  const pos=[], named={};
  for (let i=0;i<tokens.length;i++){
    const t=tokens[i];
    if (/^-[A-Za-z]/.test(t) && !/^-\d/.test(t)){
      const m=t.match(/^-([A-Za-z]+)(?::(.+))?$/); if(!m){ pos.push(psValue(t)); continue; }
      const key=m[1].toLowerCase();
      if (m[2]!==undefined){ named[key]=psValue(m[2]); continue; }
      const nx=tokens[i+1];
      if (PS_SWITCHES.has(key) || nx===undefined || (/^-[A-Za-z]/.test(nx))) { named[key]=true; }
      else { named[key]=psValue(nx); i++; }
    } else pos.push(psValue(t));
  }
  return {pos, named};
}
// tiny expression evaluator for Where-Object script blocks
function psEval(expr, obj){
  const toks = expr.match(/\$_\.\w+|\$\w+|'[^']*'|"[^"]*"|-?\d+(?:\.\d+)?|-[a-z]+|\(|\)|[\w\\.:]+/gi) || [];
  let i=0;
  const peek=()=>toks[i], next=()=>toks[i++];
  function operand(){
    const t=next(); if (t===undefined) throw new Error("incomplete expression");
    if (/^\$_\./.test(t)){ const p=t.slice(3); const k=Object.keys(obj).find(k=>k.toLowerCase()===p.toLowerCase()); return k?obj[k]:null; }
    return psValue(t);
  }
  function cmp(){
    if (peek()==="("){ next(); const v=orx(); next(); return v; }
    if (/^-not$/i.test(peek()||"")){ next(); return !cmp(); }
    const l=operand();
    const op=(peek()||"").toLowerCase();
    if (!/^-(eq|ne|gt|ge|lt|le|like|notlike|match|notmatch)$/.test(op)) return !!l;
    next(); const r=operand();
    const ls=String(l??"").toLowerCase(), rs=String(r??"").toLowerCase();
    const num = typeof l==="number" || typeof r==="number";
    switch(op){
      case "-eq": return typeof l==="boolean"||typeof r==="boolean" ? l===r : num ? +l===+r : ls===rs;
      case "-ne": return typeof l==="boolean"||typeof r==="boolean" ? l!==r : num ? +l!==+r : ls!==rs;
      case "-gt": return num ? +l>+r : ls>rs; case "-ge": return num ? +l>=+r : ls>=rs;
      case "-lt": return num ? +l<+r : ls<rs; case "-le": return num ? +l<=+r : ls<=rs;
      case "-like": return new RegExp("^"+rs.replace(/[.+^${}()|[\]\\]/g,"\\$&").replace(/\*/g,".*").replace(/\?/g,".")+"$").test(ls);
      case "-notlike": return !new RegExp("^"+rs.replace(/[.+^${}()|[\]\\]/g,"\\$&").replace(/\*/g,".*").replace(/\?/g,".")+"$").test(ls);
      case "-match": return new RegExp(String(r),"i").test(String(l??""));
      case "-notmatch": return !new RegExp(String(r),"i").test(String(l??""));
    }
  }
  function andx(){ let v=cmp(); while(/^-and$/i.test(peek()||"")){ next(); const r=cmp(); v=v&&r; } return v; }
  function orx(){ let v=andx(); while(/^-or$/i.test(peek()||"")){ next(); const r=andx(); v=v||r; } return v; }
  return orx();
}
class PSError extends Error{}
function psFindUser(w, id, cmd){
  const s=String(id||"").toLowerCase();
  const u=w.users.find(u=>u.SamAccountName.toLowerCase()===s || u.Name.toLowerCase()===s);
  if (!u) throw new PSError(`${cmd} : Cannot find an object with identity: '${id}' under: 'DC=lab,DC=local'.`);
  return u;
}
function psGroup(w, g, cmd){ const k=Object.keys(w.groups).find(k=>k.toLowerCase()===String(g||"").toLowerCase()); if(!k) throw new PSError(`${cmd} : Cannot find an object with identity: '${g}' under: 'DC=lab,DC=local'.`); return k; }
function psUserView(w,u,full){
  const o={__t:"aduser", DistinguishedName:u.DistinguishedName, Enabled:u.Enabled, GivenName:u.GivenName, Name:u.Name, ObjectClass:"user", SamAccountName:u.SamAccountName, Surname:u.Surname, UserPrincipalName:u.UserPrincipalName};
  if (full){ Object.assign(o,{Department:u.Department, Title:u.Title, LockedOut:u.LockedOut, BadLogonCount:u.BadLogonCount, LastLogonDate:u.LastLogonDate, PasswordLastSet:u.PasswordLastSet, PasswordNeverExpires:u.SamAccountName.startsWith("svc_"), MemberOf:"{"+Object.keys(w.groups).filter(g=>w.groups[g].includes(u.SamAccountName)).map(g=>"CN="+g).join(", ")+"}"}); }
  return o;
}
function psRunStage(w, stage, input){
  const toks = psSplit(stage," ");
  let name = (toks[0]||"").toLowerCase(); name = PS_ALIAS[name]||name;
  const {pos, named} = psArgs(toks.slice(1));
  const id = named.identity ?? pos[0];
  const out=[]; const say=(t,c)=>out.push({__line:t, cls:c||"out"});
  switch(name){
    case "whoami": say(w.user); return out;
    case "hostname": say(w.host); return out;
    case "get-date": say(new Date().toLocaleString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric",hour:"numeric",minute:"2-digit",second:"2-digit"})); return out;
    case "ipconfig": ["","Windows IP Configuration","","Ethernet adapter Ethernet:","","   Connection-specific DNS Suffix  . : lab.local","   IPv4 Address. . . . . . . . . . . : 10.0.2.21","   Subnet Mask . . . . . . . . . . . : 255.255.255.0","   Default Gateway . . . . . . . . . : 10.0.2.1"].forEach(l=>say(l)); return out;
    case "get-command": return PS_CMDS.map(n=>({__t:"cmd", CommandType: /^[A-Z]/.test(n)?"Cmdlet":"Application", Name:n, Source: /AD/.test(n)?"ActiveDirectory":"Microsoft.PowerShell"}));
    case "clear-host": return [{__clear:true}];
    case "get-aduser": {
      const full = named.properties!==undefined;
      if (named.filter!==undefined){
        const f=String(named.filter===true?"*":named.filter);
        let list=w.users;
        if (f!=="*"){ const m=f.match(/(\w+)\s+(-\w+)\s+['"]?([^'"]+)['"]?/); if(m) list=list.filter(u=>psEval(`$_.${m[1]} ${m[2]} '${m[3]}'`, u)); }
        return list.map(u=>psUserView(w,u,full));
      }
      if (id===undefined) throw new PSError("Get-ADUser : Missing an argument. Supply -Identity <name> or -Filter *.");
      return [psUserView(w, psFindUser(w,id,"Get-ADUser"), full)];
    }
    case "search-adaccount": {
      let list=w.users;
      if (named.lockedout) list=list.filter(u=>u.LockedOut);
      else if (named.accountdisabled) list=list.filter(u=>!u.Enabled);
      else if (named.passwordexpired) list=[];
      else throw new PSError("Search-ADAccount : Specify -LockedOut, -AccountDisabled or -PasswordExpired.");
      return list.map(u=>({__t:"aduser", Enabled:u.Enabled, LockedOut:u.LockedOut, Name:u.Name, SamAccountName:u.SamAccountName, DistinguishedName:u.DistinguishedName}));
    }
    case "unlock-adaccount": { const u=psFindUser(w,id,"Unlock-ADAccount"); u.LockedOut=false; u.BadLogonCount=0; return []; }
    case "disable-adaccount": { const u=psFindUser(w,id,"Disable-ADAccount"); u.Enabled=false; return []; }
    case "enable-adaccount": { const u=psFindUser(w,id,"Enable-ADAccount"); u.Enabled=true; return []; }
    case "set-adaccountpassword": {
      const u=psFindUser(w,id,"Set-ADAccountPassword");
      if (!named.newpassword) throw new PSError("Set-ADAccountPassword : Supply -NewPassword (ConvertTo-SecureString \"...\" -AsPlainText -Force).");
      if (!named.newpassword.__secure && typeof named.newpassword==="string") throw new PSError("Set-ADAccountPassword : Cannot convert 'System.String' to 'System.Security.SecureString'. Wrap it in (ConvertTo-SecureString \"...\" -AsPlainText -Force).");
      w.secret[u.SamAccountName]=true; u.PasswordLastSet=new Date().toLocaleString("en-US"); u.LockedOut=false; return [];
    }
    case "set-aduser": {
      const u=psFindUser(w,id,"Set-ADUser");
      if (named.changepasswordatlogon!==undefined) u.ChangePasswordAtLogon = named.changepasswordatlogon===true;
      ["title","department"].forEach(k=>{ if(named[k]!==undefined) u[k[0].toUpperCase()+k.slice(1)]=named[k]; });
      return [];
    }
    case "new-aduser": {
      const nm=named.name ?? pos[0]; const sam=named.samaccountname || String(nm||"").toLowerCase().replace(/\s+/g,"");
      if (!nm) throw new PSError("New-ADUser : Supply -Name.");
      if (w.users.some(u=>u.SamAccountName.toLowerCase()===String(sam).toLowerCase())) throw new PSError("New-ADUser : The specified account already exists.");
      w.users.push({SamAccountName:sam, Name:nm, GivenName:String(nm).split(" ")[0], Surname:String(nm).split(" ").slice(1).join(" "), Enabled:named.enabled===true, LockedOut:false, Department:named.department||"", Title:named.title||"", DistinguishedName:`CN=${nm},${named.path||"CN=Users,DC=lab,DC=local"}`, LastLogonDate:"", PasswordLastSet:"", BadLogonCount:0, ChangePasswordAtLogon:false, UserPrincipalName:sam+"@lab.local"});
      return [];
    }
    case "remove-aduser": { const u=psFindUser(w,id,"Remove-ADUser"); if(named.confirm!==false){ say(`Confirm: Are you sure you want to delete ${u.Name}? Re-run with -Confirm:$false to proceed.`,"hi"); return out; } w.users=w.users.filter(x=>x!==u); Object.values(w.groups).forEach(g=>{ const i=g.indexOf(u.SamAccountName); if(i>=0) g.splice(i,1); }); return []; }
    case "get-adgroupmember": { const g=psGroup(w,id,"Get-ADGroupMember"); return w.groups[g].map(s=>{ const u=w.users.find(x=>x.SamAccountName===s); return {__t:"member", distinguishedName:u?u.DistinguishedName:s, name:u?u.Name:s, objectClass:"user", SamAccountName:s}; }); }
    case "get-adprincipalgroupmembership": { const u=psFindUser(w,id,"Get-ADPrincipalGroupMembership"); return ["Domain Users",...Object.keys(w.groups).filter(g=>w.groups[g].includes(u.SamAccountName))].map(g=>({__t:"group", distinguishedName:`CN=${g},CN=Users,DC=lab,DC=local`, GroupCategory:"Security", GroupScope:"Global", name:g})); }
    case "add-adgroupmember": case "remove-adgroupmember": {
      const g=psGroup(w,id,name==="add-adgroupmember"?"Add-ADGroupMember":"Remove-ADGroupMember");
      let mem = named.members ?? pos[1]; if (mem===undefined) throw new PSError("Supply -Members <user>.");
      mem = Array.isArray(mem)?mem:[mem];
      if (name==="remove-adgroupmember" && named.confirm!==false){ say(`Confirm: Remove ${mem.join(", ")} from '${g}'? Re-run with -Confirm:$false to proceed.`,"hi"); return out; }
      for (const m of mem){ const u=psFindUser(w,m,"ADGroupMember"); const arr=w.groups[g]; const i=arr.indexOf(u.SamAccountName); if(name==="add-adgroupmember"){ if(i<0) arr.push(u.SamAccountName); } else if(i>=0) arr.splice(i,1); }
      return [];
    }
    case "get-service": { let list=w.services; if (id!==undefined) { const n=String(id).toLowerCase(); list=list.filter(s=>s.Name.toLowerCase()===n||s.DisplayName.toLowerCase()===n); if(!list.length) throw new PSError(`Get-Service : Cannot find any service with service name '${id}'.`); } return list.map(s=>({__t:"service",...s})); }
    case "start-service": case "stop-service": case "restart-service": case "set-service": {
      const n=String(id||"").toLowerCase(); const s=w.services.find(x=>x.Name.toLowerCase()===n||x.DisplayName.toLowerCase()===n);
      if (!s) throw new PSError(`Cannot find any service with service name '${id}'.`);
      if (name==="set-service"){ if(named.startuptype) s.StartType = String(named.startuptype)[0].toUpperCase()+String(named.startuptype).slice(1).toLowerCase(); if(named.status) s.Status=named.status; return []; }
      if (name==="start-service"){ if (s.StartType==="Disabled") throw new PSError(`Start-Service : Service '${s.DisplayName} (${s.Name})' cannot be started because it is disabled.`); s.Status="Running"; }
      if (name==="stop-service") s.Status="Stopped";
      if (name==="restart-service") s.Status="Running";
      return [];
    }
    case "get-process": { let list=w.processes; if (id!==undefined && !named.id){ const n=String(id).toLowerCase().replace(/\.exe$/,""); list=list.filter(p=>p.Name.toLowerCase()===n); if(!list.length) throw new PSError(`Get-Process : Cannot find a process with the name "${id}".`); } if (named.id) list=list.filter(p=>p.Id===+named.id); return list.map(p=>({__t:"process",...p})); }
    case "stop-process": {
      const n = named.name ?? (named.id===undefined ? id : undefined);
      const before=w.processes.length;
      if (named.id!==undefined) w.processes=w.processes.filter(p=>p.Id!==+named.id);
      else w.processes=w.processes.filter(p=>p.Name.toLowerCase()!==String(n).toLowerCase().replace(/\.exe$/,""));
      if (w.processes.length===before) throw new PSError(`Stop-Process : Cannot find a process with the name "${n??named.id}".`);
      return [];
    }
    case "get-winevent": {
      const fh = named.filterhashtable && named.filterhashtable.__hash;
      let list = w.events;
      const logName = fh ? fh.logname : named.logname ?? pos[0];
      if (logName) list = list.filter(e=>e.LogName.toLowerCase()===String(logName).toLowerCase());
      if (fh && fh.id!==undefined){ const ids=(Array.isArray(fh.id)?fh.id:[fh.id]).map(Number); list=list.filter(e=>ids.includes(e.Id)); }
      if (named.maxevents) list=list.slice(0, +named.maxevents);
      if (!list.length) throw new PSError("Get-WinEvent : No events were found that match the specified selection criteria.");
      return list.map(e=>({__t:"event",...e}));
    }
    case "test-netconnection": {
      const target = named.computername ?? pos[0] ?? "internetbeacon.msedge.net";
      const open = w.ports[target];
      if (named.port!==undefined){ const ok=!!(open && open.includes(+named.port)); if(!ok) say(`WARNING: TCP connect to (${target} : ${named.port}) failed`,"hi"); return [{__t:"tnc", ComputerName:target, RemoteAddress:target, RemotePort:+named.port, InterfaceAlias:"Ethernet", SourceAddress:"10.0.2.21", TcpTestSucceeded:ok}, ...out]; }
      return [{__t:"tnc", ComputerName:target, RemoteAddress:target, InterfaceAlias:"Ethernet", SourceAddress:"10.0.2.21", PingSucceeded:!!open, "PingReplyDetails (RTT)": open?"1 ms":"0 ms"}];
    }
    case "get-childitem": {
      const p=String(id||"C:\\Users\\matthew").replace(/\\+$/,"");
      const files=Object.keys(w.files);
      const inDir=files.filter(f=>f.toLowerCase().startsWith(p.toLowerCase()+"\\") || f.toLowerCase().startsWith("c:\\users\\matthew\\"+p.toLowerCase()+"\\"));
      if (!inDir.length && !/^c:\\users\\matthew$/i.test(p)) throw new PSError(`Get-ChildItem : Cannot find path '${p}' because it does not exist.`);
      const base = /^c:\\users\\matthew$/i.test(p) ? null : p;
      if (!base){ say(""); say("    Directory: C:\\Users\\matthew"); say(""); say("Mode                 LastWriteTime         Length Name"); say("----                 -------------         ------ ----"); ["Desktop","Documents","Downloads"].forEach(d=>say(`d-----        11/14/2026   4:50 PM                ${d}`)); return out; }
      say(""); say("    Directory: "+(p.includes(":")?p:"C:\\Users\\matthew\\"+p)); say(""); say("Mode                 LastWriteTime         Length Name"); say("----                 -------------         ------ ----");
      inDir.forEach(f=>say(`-a----        11/15/2026   6:30 AM    ${String(w.files[f].length).padStart(10)} ${f.split("\\").pop()}`)); return out;
    }
    case "get-content": {
      const p=String(id||""); const k=Object.keys(w.files).find(f=>f.toLowerCase()===p.toLowerCase() || f.toLowerCase().endsWith("\\"+p.toLowerCase().replace(/^.*?desktop\\/,"desktop\\")) || f.toLowerCase().endsWith("\\"+p.toLowerCase()));
      if (!k) throw new PSError(`Get-Content : Cannot find path '${p}' because it does not exist.`);
      w.files[k].split("\n").forEach(l=>say(l)); return out;
    }
    case "get-localuser": return [{__t:"generic",Name:"Administrator",Enabled:false,Description:"Built-in account for administering the computer/domain"},{__t:"generic",Name:"Guest",Enabled:false,Description:"Built-in account for guest access"},{__t:"generic",Name:"localadmin",Enabled:true,Description:"LAPS-managed local admin"}];
    case "convertto-securestring": return [{__t:"generic", Value:"System.Security.SecureString"}];
    // ---- pipeline cmdlets ----
    case "where-object": {
      const arr=input||[];
      if (pos[0] && pos[0].__block!==undefined) return arr.filter(o=>psEval(pos[0].__block, o));
      // simplified syntax: Where-Object Status -eq Running
      const rest=toks.slice(1); if (rest.length>=3) return arr.filter(o=>psEval(`$_.${rest[0]} ${rest[1]} '${String(psValue(rest[2]))}'`, o));
      throw new PSError("Where-Object : Supply a script block like {$_.Status -eq 'Running'}.");
    }
    case "select-object": {
      let arr=input||[];
      if (named.first) arr=arr.slice(0,+named.first);
      if (named.last) arr=arr.slice(-named.last);
      if (named.expandproperty){ const p=String(named.expandproperty).toLowerCase(); return arr.map(o=>{ const k=Object.keys(o).find(k=>k.toLowerCase()===p); return {__line:String(k?o[k]:""), cls:"out"}; }); }
      let props = named.property ?? pos[0];
      if (props===undefined || props==="*") return arr;
      props = (Array.isArray(props)?props:[props]).map(String);
      return arr.map(o=>{ const n={__t:"generic"}; props.forEach(p=>{ const k=Object.keys(o).find(k=>k.toLowerCase()===p.toLowerCase()); n[k||p]=k?o[k]:""; }); return n; });
    }
    case "sort-object": { const p=String(named.property??pos[0]??"").toLowerCase(); const arr=(input||[]).slice(); arr.sort((a,b)=>{ const ka=Object.keys(a).find(k=>k.toLowerCase()===p), kb=Object.keys(b).find(k=>k.toLowerCase()===p); const x=a[ka], y=b[kb]; return (typeof x==="number"&&typeof y==="number") ? x-y : String(x).localeCompare(String(y)); }); if (named.descending) arr.reverse(); return arr; }
    case "measure-object": return [{__t:"list", Count:(input||[]).filter(o=>!o.__line).length}];
    case "group-object": { const p=String(pos[0]||named.property||"").toLowerCase(); const m={}; (input||[]).forEach(o=>{ const k=Object.keys(o).find(k=>k.toLowerCase()===p); const v=String(k?o[k]:""); m[v]=(m[v]||0)+1; }); return Object.entries(m).sort((a,b)=>b[1]-a[1]).map(([Name,Count])=>({__t:"generic",Count,Name})); }
    case "format-list": return (input||[]).map(o=>({...o, __fmt:"list"}));
    case "format-table": return (input||[]).map(o=>({...o, __fmt:"table"}));
    case "": return input||[];
    default:
      throw new PSError(`${toks[0]} : The term '${toks[0]}' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or type Get-Command to see what this lab supports.`);
  }
}
const PS_TABLE_COLS = { service:["Status","Name","DisplayName"], process:["Id","Name","CPU"], event:["TimeCreated","Id","LevelDisplayName","Message"], cmd:["CommandType","Name","Source"] };
function psFormat(objs){
  const lines=[]; const push=(t,c)=>lines.push({text:t, cls:c||"out"});
  const data=[];
  for (const o of objs){ if (o.__line!==undefined) { flushData(); push(o.__line, o.cls); } else if (o.__clear) lines.push({clear:true}); else data.push(o); }
  flushData();
  function flushData(){
    if (!data.length) return;
    const t=data[0].__t||"generic";
    const keys=o=>Object.keys(o).filter(k=>!k.startsWith("__"));
    const asList = data[0].__fmt==="list" || (!data[0].__fmt && (["aduser","member","group","tnc","list"].includes(t) || (t==="generic" && keys(data[0]).length>4)));
    if (asList){
      for (const o of data){ const ks=keys(o); const w=Math.max(...ks.map(k=>k.length)); push(""); ks.forEach(k=>push(k.padEnd(w)+" : "+fmtVal(o[k]))); }
      push("");
    } else {
      const cols = (data[0].__fmt==="table"||t==="generic") ? keys(data[0]) : (PS_TABLE_COLS[t]||keys(data[0]));
      const widths = cols.map((c,ci)=>Math.min(ci===cols.length-1?400:48, Math.max(c.length, ...data.map(o=>fmtVal(o[c]).length))));
      push("");
      push(cols.map((c,i)=>c.padEnd(widths[i])).join(" "));
      push(cols.map((c,i)=>"-".repeat(c.length).padEnd(widths[i])).join(" "));
      for (const o of data) push(cols.map((c,i)=>{ const v=fmtVal(o[c]); return (v.length>widths[i]? v.slice(0,widths[i]-3)+"..." : v).padEnd(widths[i]); }).join(" ").trimEnd());
      push("");
    }
    data.length=0;
  }
  function fmtVal(v){ if (v===true) return "True"; if (v===false) return "False"; if (v==null) return ""; return String(v); }
  return lines;
}
function psExec(w, line){
  const norm=line.trim().replace(/\s+/g," ").toLowerCase();
  w.log.push(norm);
  if (norm==="?"||norm==="help"||norm==="get-help") return [{text:"Try: Get-Command to list what this lab supports. Every cmdlet takes -Identity or a name as the first argument. Pipe with |, filter with Where-Object {$_.Prop -eq 'value'}.", cls:"sys"}];
  let data=null;
  try{
    for (const stage of psSplit(line,"|")) data = psRunStage(w, stage, data);
    return psFormat(data||[]);
  }catch(e){
    if (e instanceof PSError) return [{text:e.message, cls:"err"}];
    return [{text:"Error: "+e.message, cls:"err"}];
  }
}
function psComplete(v){
  const parts=v.split(" "); const last=parts.pop(); if(!last) return null;
  const hits=PS_CMDS.filter(c=>c.toLowerCase().startsWith(last.toLowerCase()));
  if (hits.length===1) return [...parts,hits[0]].join(" ")+" ";
  return null;
}
function psPrompt(w){ return `PS C:\\Users\\matthew>`; }
