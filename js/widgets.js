/* ============ PACKETKILL v2 · INTERACTIVE VISUALS ============ */
const WIDGETS = {
  packet:{t:"PACKET WALK", sub:"Watch one HTTPS request cross the network, layer by layer"},
  subnet:{t:"SUBNET LAB", sub:"See the bits, then drill"},
  acl:{t:"FIREWALL RULE LAB", sub:"First match wins. Fix the rule order"},
  tls:{t:"TLS HANDSHAKE", sub:"Certificates, key exchange, and symmetric keys"},
  hash:{t:"HASH + SALT LAB", sub:"Live SHA-256 in your browser"},
  risk:{t:"RISK CALCULATOR", sub:"SLE × ARO = ALE"},
  phish:{t:"PHISH HUNT", sub:"Find all six red flags"},
  recovery:{t:"RPO / RTO TIMELINE", sub:"Backups set your data loss; restores set your downtime"}
};
function widgetDone(name){ if (!S.widgets[name]){ S.widgets[name]=todayStr(); addXP(15, WIDGETS[name].t); } }
function mountWidget(name, el){
  el.classList.add("widget");
  el.innerHTML = `<div class="wt"><span>◆ ${esc(WIDGETS[name].t)}</span><span class="faint tiny">${esc(WIDGETS[name].sub)}</span></div><div class="wbody"></div>`;
  const body = el.querySelector(".wbody");
  ({packet:wPacket, subnet:wSubnet, acl:wAcl, tls:wTls, hash:wHash, risk:wRisk, phish:wPhish, recovery:wRecovery})[name](body);
}

/* ---- 1. packet walk ---- */
function wPacket(el){
  const nodes=[{x:60,l:"PC1",s:"10.0.2.21"},{x:230,l:"SWITCH",s:"Layer 2"},{x:400,l:"ROUTER",s:"Layer 3 · gateway"},{x:570,l:"SERVER",s:"10.0.5.10 :443"}];
  const steps=[
    {at:0, stack:["DATA"], l:"7 · Application", t:"You open <b>https://intranet.lab</b>. The browser builds an HTTPS request. Right now it's just application <b>data</b>."},
    {at:0, stack:["TCP","DATA"], l:"4 · Transport", t:"TCP wraps it in a <b>segment</b>: source port <b>51515</b> (random) to destination port <b>443</b> (HTTPS). Ports pick the application."},
    {at:0, stack:["IP","TCP","DATA"], l:"3 · Network", t:"IP adds a header and now it's a <b>packet</b>: source <b>10.0.2.21</b>, destination <b>10.0.5.10</b>. Different subnet, so it has to go through the default gateway."},
    {at:0, stack:["ETH","IP","TCP","DATA","FCS"], l:"2 · Data link", t:"Ethernet makes a <b>frame</b>. Destination MAC = the <b>router's</b> MAC, found with ARP, not the server's. MACs only matter hop to hop."},
    {at:1, stack:["ETH","IP","TCP","DATA","FCS"], l:"1 · Physical", t:"Bits go down the Cat 6 run to the switch. This is the part you've literally pulled through ceilings."},
    {at:1, stack:["ETH","IP","TCP","DATA","FCS"], l:"Switch · Layer 2", t:"The switch reads only the <b>destination MAC</b>, checks its MAC address table, and forwards the frame out the port toward the router. It never looks at the IP."},
    {at:2, stack:["IP","TCP","DATA"], l:"Router · Layer 3", t:"The router strips the frame and reads the <b>destination IP</b>. Longest prefix match in the routing table picks the exit, and it decrements <b>TTL</b>. An ACL here could permit or deny this packet."},
    {at:2, stack:["ETH","IP","TCP","DATA","FCS"], l:"Router · re-frame", t:"New frame for the next hop: <b>new MACs</b> (router to server), <b>same IPs</b>. IP addresses are end to end; MAC addresses change every hop."},
    {at:3, stack:["IP","TCP","DATA"], l:"Server · decapsulate", t:"The server's NIC sees its own MAC and strips the frame. The IP layer confirms the address is its own and strips the IP header."},
    {at:3, stack:["DATA"], l:"Server · port 443", t:"TCP port <b>443</b> hands the data to the web server process. The reply comes back the same way in reverse. <b>Encapsulation</b> going down, <b>decapsulation</b> coming up."}
  ];
  const colors={DATA:"#e8b84b",TCP:"#7dd3fc",IP:"#3ddc84",ETH:"#b69cff",FCS:"#b69cff"};
  let i=0, timer=null;
  el.innerHTML=`<svg viewBox="0 0 630 150" role="img" aria-label="Network path from PC1 through a switch and router to a server">
    <line x1="60" y1="70" x2="570" y2="70" stroke="#1f3b4b" stroke-width="3"/>
    ${nodes.map(n=>`<g><rect x="${n.x-38}" y="48" width="76" height="44" rx="6" fill="#0b1820" stroke="#2b5268"/><text x="${n.x}" y="69" text-anchor="middle" fill="#e7efe9" font-family="Chakra Petch" font-size="13" font-weight="700">${n.l}</text><text x="${n.x}" y="84" text-anchor="middle" fill="#8b9b94" font-family="JetBrains Mono" font-size="9">${n.s}</text></g>`).join("")}
    <g id="pw-token"><circle r="11" fill="#e8b84b"/><text text-anchor="middle" y="4" font-family="JetBrains Mono" font-size="10" fill="#1a1205">PKT</text></g>
    <text id="pw-layer" x="315" y="130" text-anchor="middle" fill="#7dd3fc" font-family="Chakra Petch" font-size="14" font-weight="700"></text>
  </svg>
  <div class="stackv" style="display:flex;gap:2px;flex-wrap:wrap;font-family:var(--mono);font-size:12px"></div>
  <div class="wtext"></div>
  <div class="row"><button class="btn sm" data-pw="prev">◀ BACK</button><button class="btn sm green" data-pw="next">NEXT ▶</button><button class="btn sm ghost" data-pw="play">AUTO</button><span class="spacer"></span><span class="tiny faint" id="pw-n"></span></div>`;
  const token=el.querySelector("#pw-token");
  function draw(){
    const s=steps[i], n=nodes[s.at];
    token.setAttribute("transform",`translate(${n.x},${i===4?70:28})`);
    token.style.transition="transform .5s";
    el.querySelector("#pw-layer").textContent=s.l;
    el.querySelector(".stackv").innerHTML=s.stack.map(b=>`<span style="padding:6px 10px;border-radius:3px;background:${colors[b]}22;border:1px solid ${colors[b]};color:${colors[b]}">${b}</span>`).join("");
    el.querySelector(".wtext").innerHTML=s.t;
    el.querySelector("#pw-n").textContent=`STEP ${i+1} / ${steps.length}`;
    if (i===steps.length-1) widgetDone("packet");
  }
  el.addEventListener("click",e=>{
    const b=e.target.closest("[data-pw]"); if(!b) return;
    if (b.dataset.pw==="next") i=Math.min(steps.length-1,i+1);
    if (b.dataset.pw==="prev") i=Math.max(0,i-1);
    if (b.dataset.pw==="play"){ clearInterval(timer); if (b.textContent==="AUTO"){ b.textContent="STOP"; timer=setInterval(()=>{ if(i>=steps.length-1||!document.body.contains(el)){ clearInterval(timer); b.textContent="AUTO"; return;} i++; draw(); },2600); } else b.textContent="AUTO"; }
    draw();
  });
  draw();
}

/* ---- 2. subnet lab ---- */
const ip2n = ip=>ip.split(".").reduce((a,o)=>(a*256)+(+o),0);
const n2ip = n=>[24,16,8,0].map(s=>Math.floor(n/2**s)%256).join(".");
function subnetCalc(ip, p){
  const n=ip2n(ip), size=2**(32-p), net=Math.floor(n/size)*size, bc=net+size-1;
  const mask=n2ip(2**32-size);
  return {mask, wildcard:n2ip(size-1), net:n2ip(net), bc:n2ip(bc), first:n2ip(p>=31?net:net+1), last:n2ip(p>=31?bc:bc-1), usable: p>=31? (p===31?2:1) : size-2, block: p>=24? size : p>=16 ? size/256 : p>=8 ? size/65536 : size/16777216};
}
function wSubnet(el){
  let mode="see", ip="192.168.10.100", p=26, quiz=null, streak=0;
  function render(){
    const valid=/^(\d{1,3}\.){3}\d{1,3}$/.test(ip) && ip.split(".").every(o=>+o<=255);
    const r = valid ? subnetCalc(ip,p) : null;
    const bits = valid ? ip.split(".").map(o=>(+o).toString(2).padStart(8,"0")).join("") : "0".repeat(32);
    el.innerHTML=`<div class="seg"><button data-sm="see" aria-pressed="${mode==="see"}">EXPLORE</button><button data-sm="drill" aria-pressed="${mode==="drill"}">DRILL</button></div>
    ${mode==="see"?`
      <div class="row"><div class="field" style="flex:1;min-width:160px"><label for="snIp">IP address</label><input type="text" id="snIp" value="${esc(ip)}" inputmode="decimal"></div>
      <div class="field" style="flex:2;min-width:200px"><label for="snP">Prefix: <b class="mono" style="color:var(--gold)">/${p}</b></label><input type="range" id="snP" min="8" max="30" value="${p}"></div></div>
      <div class="bits" aria-label="32 address bits, network bits in green and host bits in gold">${[...bits].map((b,k)=>`<span class="${k<p?"n":"h"} ${k%8===7&&k<31?"gap":""}">${b}</span>`).join("")}</div>
      <div class="legend"><span><i style="background:#0f3a24"></i>network bits (${p})</span><span><i style="background:#2a2310"></i>host bits (${32-p})</span></div>
      ${r?`<div class="kv"><div><span>Mask</span><b>${r.mask}</b></div><div><span>Network</span><b>${r.net}</b></div><div><span>Broadcast</span><b>${r.bc}</b></div><div><span>First host</span><b>${r.first}</b></div><div><span>Last host</span><b>${r.last}</b></div><div><span>Usable hosts</span><b>${r.usable.toLocaleString()}</b></div><div><span>Block size</span><b>${r.block}</b></div><div><span>Wildcard</span><b>${r.wildcard}</b></div></div>
      <div class="small muted">Block-size trick from v30: the block size is ${r.block} in the interesting octet, so networks start at multiples of ${r.block}. ${ip} falls in the block starting at <b>${r.net}</b>.</div>`:`<div class="small" style="color:var(--red)">Enter a valid IPv4 address.</div>`}`
    :`<div class="row"><span class="chip y">STREAK ${streak}</span><span class="small muted">Find the network, broadcast, and usable host count.</span></div>
      <div class="q-text mono" style="font-size:22px">${quiz.ip} /${quiz.p}</div>
      <div class="grid tight"><div class="field"><label for="dq1">Network address</label><input type="text" id="dq1" inputmode="decimal"></div><div class="field"><label for="dq2">Broadcast address</label><input type="text" id="dq2" inputmode="decimal"></div><div class="field"><label for="dq3">Usable hosts</label><input type="number" id="dq3" inputmode="numeric"></div></div>
      <div class="row"><button class="btn green sm" data-sd="check">CHECK</button><button class="btn sm ghost" data-sd="skip">NEW PROBLEM</button></div><div id="dqfb"></div>`}`;
  }
  function newQuiz(){ const p=[20,21,22,23,24,25,26,27,28,29][Math.floor(Math.random()*10)]; const ip=[10,172,192][Math.floor(Math.random()*3)]; const o=ip===10?[10,Math.floor(Math.random()*256),Math.floor(Math.random()*256),Math.floor(Math.random()*256)]:ip===172?[172,16+Math.floor(Math.random()*16),Math.floor(Math.random()*256),Math.floor(Math.random()*256)]:[192,168,Math.floor(Math.random()*256),Math.floor(Math.random()*256)]; quiz={ip:o.join("."), p}; }
  el.addEventListener("input",e=>{ if(e.target.id==="snIp"){ ip=e.target.value.trim(); const pos=e.target.selectionStart; render(); const n=el.querySelector("#snIp"); n.focus(); n.setSelectionRange(pos,pos);} if(e.target.id==="snP"){ p=+e.target.value; render(); el.querySelector("#snP").focus(); widgetDone("subnet"); } });
  el.addEventListener("click",e=>{
    const m=e.target.closest("[data-sm]"); if(m){ mode=m.dataset.sm; if(mode==="drill"&&!quiz) newQuiz(); render(); return; }
    const d=e.target.closest("[data-sd]"); if(!d) return;
    if (d.dataset.sd==="skip"){ newQuiz(); render(); return; }
    const r=subnetCalc(quiz.ip,quiz.p); const a1=el.querySelector("#dq1").value.trim(), a2=el.querySelector("#dq2").value.trim(), a3=+el.querySelector("#dq3").value;
    const ok=[a1===r.net, a2===r.bc, a3===r.usable];
    const fb=el.querySelector("#dqfb");
    if (ok.every(Boolean)){ streak++; record("Subnetting", true); fb.innerHTML=`<div class="fb"><p><b>Correct.</b> Block size ${r.block}. Network ${r.net}, broadcast ${r.bc}, ${r.usable} usable.</p></div>`; addXP(10,"Subnet"); widgetDone("subnet"); setTimeout(()=>{ newQuiz(); render(); },1600); }
    else { streak=0; record("Subnetting", false); fb.innerHTML=`<div class="fb bad"><p><b>Not quite.</b> Mask ${r.mask}, block size ${r.block}. Network <b>${r.net}</b>, broadcast <b>${r.bc}</b>, usable <b>${r.usable}</b>.</p><p class="small">${ok[0]?"✓":"✗"} network · ${ok[1]?"✓":"✗"} broadcast · ${ok[2]?"✓":"✗"} hosts</p></div>`; }
    save();
  });
  render();
}

/* ---- 3. ACL / firewall ---- */
function wAcl(el){
  const SRC=["any","10.0.10.0/24 (Users)","10.0.99.0/24 (Guest Wi-Fi)"], DST=["any","10.0.20.10 (Web)","10.0.20.0/24 (Servers)"], PORT=["any","22 SSH","23 Telnet","443 HTTPS","3389 RDP"];
  let rules=[{a:"permit",s:0,d:0,p:0},{a:"deny",s:0,d:0,p:2},{a:"permit",s:1,d:1,p:3},{a:"deny",s:2,d:2,p:0}];
  const pkts=[
    {d:"User PC → Web server, HTTPS", s:1,dd:1,p:3, want:"permit"},
    {d:"User PC → Web server, Telnet", s:1,dd:1,p:2, want:"deny"},
    {d:"Guest phone → Web server, HTTPS", s:2,dd:1,p:3, want:"deny"},
    {d:"Guest phone → file server, RDP", s:2,dd:2,p:4, want:"deny"},
    {d:"User PC → file server, RDP", s:1,dd:2,p:4, want:"deny"},
    {d:"User PC → Web server, SSH", s:1,dd:1,p:1, want:"deny"}
  ];
  let results=null;
  const covers=(rule,which,val)=>{ const r=rule[which]; if(r===0) return true; if(which==="d" && r===2 && val===1) return true; if (which==="s"||which==="p"||which==="d") return r===val; };
  function evalPkt(pk){ for(let k=0;k<rules.length;k++){ const r=rules[k]; if(covers(r,"s",pk.s)&&covers(r,"d",pk.dd)&&covers(r,"p",pk.p)) return {k, a:r.a}; } return {k:-1, a:"deny"}; }
  function render(){
    el.innerHTML=`<div class="small">Goal: users may reach the web server <b>only</b> over HTTPS. Guests get nothing. Everything else is blocked. The starter rules have a classic mistake. Run the traffic, then fix the order.</div>
    <div style="overflow-x:auto"><table class="acl-table"><thead><tr><th>#</th><th>Action</th><th>Source</th><th>Destination</th><th>Port</th><th></th></tr></thead><tbody>
    ${rules.map((r,k)=>`<tr data-r="${k}" class="${results&&results.hits.has(k)?(r.a==="permit"?"hit":"hitd"):""}"><td class="mono">${(k+1)*10}</td>
      <td><select data-f="a" aria-label="Action, rule ${k+1}"><option ${r.a==="permit"?"selected":""}>permit</option><option ${r.a==="deny"?"selected":""}>deny</option></select></td>
      <td><select data-f="s" aria-label="Source, rule ${k+1}">${SRC.map((x,j)=>`<option value="${j}" ${r.s===j?"selected":""}>${x}</option>`).join("")}</select></td>
      <td><select data-f="d" aria-label="Destination, rule ${k+1}">${DST.map((x,j)=>`<option value="${j}" ${r.d===j?"selected":""}>${x}</option>`).join("")}</select></td>
      <td><select data-f="p" aria-label="Port, rule ${k+1}">${PORT.map((x,j)=>`<option value="${j}" ${r.p===j?"selected":""}>${x}</option>`).join("")}</select></td>
      <td style="white-space:nowrap"><button class="btn sm ghost" data-mv="${k}:-1" aria-label="Move rule up" ${k===0?"disabled":""}>↑</button><button class="btn sm ghost" data-mv="${k}:1" aria-label="Move rule down" ${k===rules.length-1?"disabled":""}>↓</button><button class="btn sm ghost" data-del="${k}" aria-label="Delete rule">✕</button></td></tr>`).join("")}
    <tr><td class="mono faint">∞</td><td colspan="5" class="faint">implicit deny any any (always last, never shown in the config)</td></tr></tbody></table></div>
    <div class="row"><button class="btn sm" data-add="1">+ ADD RULE</button><button class="btn sm green" data-run="1">RUN TRAFFIC</button></div>
    ${results?`<div>${pkts.map((pk,j)=>{ const r=results.r[j]; const ok=r.a===pk.want; return `<div class="pkt ${ok?"ok":"no"}"><span>${ok?"✓":"✗"} ${esc(pk.d)}</span><span class="${r.a==="permit"?"chip g":"chip r"}">${r.a.toUpperCase()} · ${r.k<0?"implicit":"rule "+(r.k+1)*10}</span></div>`; }).join("")}</div>
      <div class="fb ${results.all?"":"bad"}"><p><b>${results.all?"Locked down. Every packet did what policy says.":`${results.bad} packet${results.bad>1?"s":""} broke policy.`}</b> ${results.all?"First match wins, and the implicit deny catches everything you didn't permit.":"Look at which rule each packet hit. A broad permit at the top swallows everything below it."}</p></div>`:""}`;
  }
  el.addEventListener("change",e=>{ const tr=e.target.closest("tr[data-r]"); if(!tr) return; const k=+tr.dataset.r, f=e.target.dataset.f; rules[k][f]= f==="a"? e.target.value : +e.target.value; results=null; render(); });
  el.addEventListener("click",e=>{
    const mv=e.target.closest("[data-mv]"), del=e.target.closest("[data-del]");
    if (mv){ const [k,d]=mv.dataset.mv.split(":").map(Number); [rules[k],rules[k+d]]=[rules[k+d],rules[k]]; results=null; render(); }
    else if (del){ rules.splice(+del.dataset.del,1); results=null; render(); }
    else if (e.target.closest("[data-add]")){ rules.push({a:"deny",s:0,d:0,p:0}); results=null; render(); }
    else if (e.target.closest("[data-run]")){ const r=pkts.map(evalPkt); const bad=r.filter((x,j)=>x.a!==pkts[j].want).length; results={r, hits:new Set(r.map(x=>x.k)), all:bad===0, bad}; render(); if(!bad) widgetDone("acl"); }
  });
  render();
}

/* ---- 4. TLS handshake ---- */
function wTls(el){
  const msgs=[
    {dir:1, l:"ClientHello", t:"The browser says hi: the TLS versions it speaks, the <b>cipher suites</b> it supports, and a random number. Nothing secret yet.", tags:["Protocols"]},
    {dir:-1, l:"ServerHello", t:"The server picks TLS 1.3 and one cipher suite, such as AES-256-GCM with an ECDHE key exchange.", tags:["Algorithms"]},
    {dir:-1, l:"Certificate", t:"The server sends its <b>certificate</b>: its public key, signed by a <b>certificate authority</b>. This is PKI.", tags:["Certificates","Public key"]},
    {dir:0, l:"Browser checks the cert", t:"The browser follows the signature chain up to a <b>root CA</b> it already trusts (root of trust), confirms the hostname matches, the dates are valid, and the cert isn't revoked (<b>OCSP</b> or a <b>CRL</b>).", tags:["Root of trust","OCSP","CRL"]},
    {dir:1, l:"Key share", t:"Both sides do an ECDHE <b>key exchange</b>. Each mixes its private value with the other's public value and lands on the <b>same session key</b>, and that key never crosses the wire. Asymmetric math is used only for this.", tags:["Key exchange","Asymmetric"]},
    {dir:-1, l:"Finished", t:"Each side sends a Finished message encrypted with the new key. If both decrypt, nobody tampered with the handshake.", tags:["Integrity"]},
    {dir:2, l:"Encrypted data", t:"From here on everything uses fast <b>symmetric</b> encryption (AES) with the session key. Asymmetric sets up trust; symmetric does the heavy lifting.", tags:["Symmetric","Data in transit"]}
  ];
  let i=0;
  function draw(){
    const h=80+(i+1)*44;
    el.innerHTML=`<svg viewBox="0 0 600 ${h}" role="img" aria-label="TLS handshake between browser and server">
      <text x="110" y="24" text-anchor="middle" fill="#7dd3fc" font-family="Chakra Petch" font-weight="700">BROWSER</text>
      <text x="490" y="24" text-anchor="middle" fill="#3ddc84" font-family="Chakra Petch" font-weight="700">SERVER</text>
      <line x1="110" y1="34" x2="110" y2="${h-8}" stroke="#2b3a3a" stroke-dasharray="4 4"/><line x1="490" y1="34" x2="490" y2="${h-8}" stroke="#2b3a3a" stroke-dasharray="4 4"/>
      <defs><marker id="ah" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#e8b84b"/></marker><marker id="ah2" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#3ddc84"/></marker></defs>
      ${msgs.slice(0,i+1).map((m,k)=>{ const y=60+k*44; const cur=k===i; const col=m.dir===2?"#3ddc84":"#e8b84b";
        if (m.dir===0) return `<g opacity="${cur?1:.55}"><rect x="40" y="${y-14}" width="140" height="24" rx="4" fill="#0b2230" stroke="#7dd3fc"/><text x="110" y="${y+2}" text-anchor="middle" fill="#7dd3fc" font-family="JetBrains Mono" font-size="11">${m.l}</text></g>`;
        const x1=m.dir===1?118:482, x2=m.dir===1?482:118;
        return `<g opacity="${cur?1:.55}"><line x1="${m.dir===2?118:x1}" y1="${y}" x2="${m.dir===2?482:x2}" y2="${y}" stroke="${col}" stroke-width="${cur?2.5:1.5}" marker-end="url(#${m.dir===2?"ah2":"ah"})" ${m.dir===2?'marker-start="url(#ah2)"':""}/><text x="300" y="${y-7}" text-anchor="middle" fill="${col}" font-family="JetBrains Mono" font-size="12">${m.dir===2?"🔒 ":""}${m.l}</text></g>`; }).join("")}
    </svg>
    <div class="wtext">${msgs[i].t}</div>
    <div class="terms">${msgs[i].tags.map(t=>`<span>${esc(t)}</span>`).join("")}</div>
    <div class="row"><button class="btn sm" data-tl="-1" ${i===0?"disabled":""}>◀ BACK</button><button class="btn sm green" data-tl="1" ${i===msgs.length-1?"disabled":""}>NEXT ▶</button><span class="spacer"></span><span class="tiny faint">STEP ${i+1} / ${msgs.length}</span></div>`;
    if (i===msgs.length-1) widgetDone("tls");
  }
  el.addEventListener("click",e=>{ const b=e.target.closest("[data-tl]"); if(!b) return; i=Math.max(0,Math.min(msgs.length-1,i+ +b.dataset.tl)); draw(); });
  draw();
}

/* ---- 5. hash + salt ---- */
async function sha256(s){ const buf=await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)); return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,"0")).join(""); }
function wHash(el){
  let pw="Winter2026!", pw2="Winter2026?", salted=false; const saltA="9f2c", saltB="41be";
  el.innerHTML=`<div class="grid tight"><div class="field"><label for="hp1">Password</label><input type="text" id="hp1" value="${esc(pw)}"></div><div class="field"><label for="hp2">Change one character</label><input type="text" id="hp2" value="${esc(pw2)}"></div></div>
  <div class="small muted">Avalanche effect: one character changes about half the hash. Red marks the characters that differ.</div>
  <div class="hash" id="h1"></div><div class="hash" id="h2"></div>
  <div class="ptitle" style="margin-top:6px"><span>Two users pick the same password</span><label class="row small" style="color:var(--ink)"><input type="checkbox" id="hsalt"> add a unique salt per user</label></div>
  <div class="small"><b>alice</b> <span class="faint" id="sa"></span></div><div class="hash" id="h3"></div>
  <div class="small"><b>bob</b> <span class="faint" id="sb"></span></div><div class="hash" id="h4"></div>
  <div class="wtext" id="hexp"></div>`;
  async function upd(){
    const [a,b]=await Promise.all([sha256(pw),sha256(pw2)]);
    el.querySelector("#h1").textContent=a;
    el.querySelector("#h2").innerHTML=[...b].map((c,k)=>c===a[k]?esc(c):`<span class="diff">${esc(c)}</span>`).join("");
    const ha=await sha256((salted?saltA:"")+pw), hb=await sha256((salted?saltB:"")+pw);
    el.querySelector("#sa").textContent = salted?`salt ${saltA}`:"no salt";
    el.querySelector("#sb").textContent = salted?`salt ${saltB}`:"no salt";
    el.querySelector("#h3").textContent=ha; el.querySelector("#h4").textContent=hb;
    el.querySelector("#hexp").innerHTML = salted ? "<b>Different hashes</b> for the same password. An attacker can't spot shared passwords, and precomputed rainbow tables are useless. That's why you salt (Sec+ 1.3)." : "<b>Identical hashes.</b> Anyone who steals the database instantly sees alice and bob share a password, and one cracked hash cracks both. Tick the salt box.";
  }
  el.addEventListener("input",e=>{ if(e.target.id==="hp1") pw=e.target.value; if(e.target.id==="hp2") pw2=e.target.value; upd(); });
  el.addEventListener("change",e=>{ if(e.target.id==="hsalt"){ salted=e.target.checked; upd(); if(salted) widgetDone("hash"); } });
  upd();
}

/* ---- 6. risk ---- */
function wRisk(el){
  let av=50000, ef=40, aro=2, cost=15000, red=75;
  const money=n=>"$"+Math.round(n).toLocaleString();
  el.innerHTML=`<div class="small">Scenario: a ransomware hit on the file server. Move the sliders.</div>
  <div class="grid tight">
    <div class="field"><label for="rk1">Asset value: <b id="rv1"></b></label><input type="range" id="rk1" min="5000" max="500000" step="5000" value="${av}"></div>
    <div class="field"><label for="rk2">Exposure factor: <b id="rv2"></b></label><input type="range" id="rk2" min="5" max="100" step="5" value="${ef}"></div>
    <div class="field"><label for="rk3">Incidents per year (ARO): <b id="rv3"></b></label><input type="range" id="rk3" min="0.1" max="6" step="0.1" value="${aro}"></div>
    <div class="field"><label for="rk4">Control cost per year: <b id="rv4"></b></label><input type="range" id="rk4" min="0" max="100000" step="1000" value="${cost}"></div>
    <div class="field"><label for="rk5">Control cuts incidents by: <b id="rv5"></b></label><input type="range" id="rk5" min="0" max="100" step="5" value="${red}"></div>
  </div>
  <div class="kv"><div><span>SLE = AV × EF</span><b id="o1"></b></div><div><span>ALE = SLE × ARO</span><b id="o2"></b></div><div><span>ALE with control</span><b id="o3"></b></div><div><span>Net per year</span><b id="o4"></b></div></div>
  <svg viewBox="0 0 600 90" id="rbars" role="img" aria-label="Yearly cost without and with the control"></svg>
  <div class="wtext" id="rexp"></div>`;
  function upd(){
    const sle=av*ef/100, ale=sle*aro, ale2=sle*aro*(1-red/100), net=ale-(ale2+cost);
    el.querySelector("#rv1").textContent=money(av); el.querySelector("#rv2").textContent=ef+"%"; el.querySelector("#rv3").textContent=aro; el.querySelector("#rv4").textContent=money(cost); el.querySelector("#rv5").textContent=red+"%";
    el.querySelector("#o1").textContent=money(sle); el.querySelector("#o2").textContent=money(ale); el.querySelector("#o3").textContent=money(ale2); el.querySelector("#o4").textContent=(net>=0?"saves ":"costs ")+money(Math.abs(net));
    const max=Math.max(ale, ale2+cost, 1), W=440;
    el.querySelector("#rbars").innerHTML=`<text x="0" y="24" fill="#8b9b94" font-family="JetBrains Mono" font-size="11">no control</text><rect x="120" y="12" height="18" width="${W*ale/max}" fill="#ff5f56" rx="2"/><text x="${124+W*ale/max}" y="26" fill="#e7efe9" font-family="JetBrains Mono" font-size="11">${money(ale)}</text>
      <text x="0" y="64" fill="#8b9b94" font-family="JetBrains Mono" font-size="11">with control</text><rect x="120" y="52" height="18" width="${W*ale2/max}" fill="#e8b84b" rx="2"/><rect x="${120+W*ale2/max}" y="52" height="18" width="${W*cost/max}" fill="#7dd3fc" rx="2"/><text x="${124+W*(ale2+cost)/max}" y="66" fill="#e7efe9" font-family="JetBrains Mono" font-size="11">${money(ale2+cost)}</text>`;
    el.querySelector("#rexp").innerHTML = net>=0 ? `<b>Mitigate.</b> The control costs ${money(cost)} a year and cuts expected losses by ${money(ale-ale2)}. Leftover expected loss (${money(ale2)}) is your <b>residual risk</b>.` : `<b>The control costs more than it saves.</b> Management might <b>accept</b> the risk, <b>transfer</b> it with cyber insurance, or look for a cheaper control.`;
  }
  el.addEventListener("input",e=>{ const v=+e.target.value; ({rk1:()=>av=v,rk2:()=>ef=v,rk3:()=>aro=v,rk4:()=>cost=v,rk5:()=>red=v})[e.target.id]?.(); upd(); widgetDone("risk"); });
  upd();
}

/* ---- 7. phish hunt ---- */
function wPhish(el){
  const flags={from:"Look-alike sender domain: fortgranite-helpdesk.com isn't fortgranite.mil.",greet:"Generic greeting. Real IT knows your name.",urgent:"Manufactured urgency and a threat (account deleted in 2 hours).",typo:"Sloppy spelling (\"acount\", \"verfy\").",link:"The button's real destination is secure-login.co, not your organization.",attach:"An .html attachment named like a form. These often host fake login pages."};
  const found=new Set();
  const F=(k,txt)=>`<button class="flag ${found.has(k)?"found":""}" data-fl="${k}">${txt}</button>`;
  function render(){
    el.innerHTML=`<div class="small">Tap everything suspicious in this email. <b>${found.size} / 6</b> found.</div>
    <div class="mail"><div class="mh"><div><b>From:</b> Fort Granite IT Service Desk &lt;${F("from","it-support@fortgranite-helpdesk.com")}&gt;</div><div><b>Subject:</b> ACTION REQUIRED: Password expires today</div><div><b>Attachment:</b> ${F("attach","Password_Reset_Form.html")}</div></div>
    <div class="mb">${F("greet","Dear user,")}<br><br>Our records show your network ${F("typo","acount")} password expires today. ${F("urgent","If you do not verfy within 2 hours your account and email will be permanently deleted.")}<br><br>${F("link",'<span class="btnlike">Verify My Account</span>')}<br><span style="font-size:12px;color:#666">Hover shows: http://fortgranite.secure-login.co/reset</span><br><br>Thank you,<br>IT Service Desk</div></div>
    ${found.size?`<div class="list">${[...found].map(k=>`<div class="small">✓ ${esc(flags[k])}</div>`).join("")}</div>`:""}
    ${found.size===6?`<div class="fb"><p><b>All six.</b> Next step on the job: don't click. Report it with the phish button and let the SOC pull it from every inbox.</p></div>`:""}`;
  }
  el.addEventListener("click",e=>{ const b=e.target.closest("[data-fl]"); if(!b) return; found.add(b.dataset.fl); render(); if(found.size===6) widgetDone("phish"); });
  render();
}

/* ---- 8. RPO / RTO ---- */
function wRecovery(el){
  let every=12, restore=6; const incident=17.5, rpoT=4, rtoT=8;
  el.innerHTML=`<div class="small">Targets set by leadership: <b>RPO 4 hours</b> (max data loss) and <b>RTO 8 hours</b> (max downtime). The server dies at <b>5:30 PM</b>.</div>
  <div class="grid tight"><div class="field"><label for="rc1">Back up every: <b id="rcv1"></b></label><input type="range" id="rc1" min="1" max="24" step="1" value="${every}"></div>
  <div class="field"><label for="rc2">Restore takes: <b id="rcv2"></b></label><input type="range" id="rc2" min="1" max="24" step="1" value="${restore}"></div></div>
  <svg viewBox="0 0 640 120" id="rcsvg" role="img" aria-label="Timeline of backups, the failure, and the restore"></svg>
  <div class="kv"><div><span>Data lost (actual RPO)</span><b id="rco1"></b></div><div><span>Downtime (actual RTO)</span><b id="rco2"></b></div></div><div class="wtext" id="rcexp"></div>`;
  function upd(){
    const last=Math.floor(incident/every)*every, lost=incident-last, X=h=>20+h*(600/36);
    el.querySelector("#rcv1").textContent=every+"h"; el.querySelector("#rcv2").textContent=restore+"h";
    let marks=""; for(let h=0;h<=incident;h+=every) marks+=`<line x1="${X(h)}" y1="40" x2="${X(h)}" y2="70" stroke="#3ddc84" stroke-width="2"/><text x="${X(h)}" y="34" text-anchor="middle" fill="#3ddc84" font-family="JetBrains Mono" font-size="9">BK</text>`;
    const okR=lost<=rpoT, okT=restore<=rtoT;
    el.querySelector("#rcsvg").innerHTML=`<line x1="20" y1="55" x2="620" y2="55" stroke="#2b3a3a" stroke-width="2"/>
      ${[0,6,12,18,24,30,36].map(h=>`<text x="${X(h)}" y="100" text-anchor="middle" fill="#5d6d67" font-family="JetBrains Mono" font-size="9">${h%24===0?"12 AM":(h%24)<12?(h%24)+" AM":(h%24===12?"12 PM":(h%24-12)+" PM")}</text>`).join("")}
      ${marks}
      <rect x="${X(last)}" y="48" width="${X(incident)-X(last)}" height="14" fill="${okR?"#e8b84b":"#ff5f56"}" opacity=".55"/>
      <rect x="${X(incident)}" y="48" width="${X(incident+restore)-X(incident)}" height="14" fill="${okT?"#7dd3fc":"#ff5f56"}" opacity=".45"/>
      <line x1="${X(incident)}" y1="30" x2="${X(incident)}" y2="80" stroke="#ff5f56" stroke-width="2"/><text x="${X(incident)}" y="22" text-anchor="middle" fill="#ff5f56" font-family="Chakra Petch" font-size="12" font-weight="700">FAILURE</text>
      <text x="${(X(last)+X(incident))/2}" y="78" text-anchor="middle" fill="#e8b84b" font-family="JetBrains Mono" font-size="9">lost</text><text x="${(X(incident)+X(incident+restore))/2}" y="78" text-anchor="middle" fill="#7dd3fc" font-family="JetBrains Mono" font-size="9">down</text>`;
    el.querySelector("#rco1").textContent=lost.toFixed(1)+"h "+(okR?"✓":"✗");
    el.querySelector("#rco2").textContent=restore+"h "+(okT?"✓":"✗");
    el.querySelector("#rcexp").innerHTML = okR&&okT ? "<b>Both targets met.</b> Backup frequency controls RPO. Restore speed (and testing restores!) controls RTO." : `${okR?"":"<b>RPO missed:</b> back up more often. "}${okT?"":"<b>RTO missed:</b> you need a faster restore path, like a warm site, snapshots, or a practiced runbook."}`;
    if (okR&&okT) widgetDone("recovery");
  }
  el.addEventListener("input",e=>{ if(e.target.id==="rc1") every=+e.target.value; if(e.target.id==="rc2") restore=+e.target.value; upd(); });
  upd();
}
