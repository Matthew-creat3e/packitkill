/* IOS, SQL and Bash engines ported verbatim from PACKETKILL v30 */
let cli={};
function newCliState(device){
 const ifaces={};
 if(device==='router'){['GigabitEthernet0/0','GigabitEthernet0/1','GigabitEthernet0/2'].forEach(i=>{ifaces[i]={ip:null,mask:null,shutdown:true,switchportMode:null,accessVlan:null,allowedVlans:null,portSec:false,portSecMax:null,portSecSticky:false,portSecViol:null,natRole:null,accessGroupIn:null,accessGroupOut:null}})}else{['FastEthernet0/1','FastEthernet0/2','FastEthernet0/3','FastEthernet0/4','FastEthernet0/5','GigabitEthernet0/1','GigabitEthernet0/2'].forEach(i=>{ifaces[i]={ip:null,mask:null,shutdown:false,switchportMode:null,accessVlan:null,allowedVlans:null,portSec:false,portSecMax:null,portSecSticky:false,portSecViol:null,portfast:false,bpduGuard:false}})}
 return{mode:'user',hostname:device==='router'?'Router':'Switch',device,currentInterface:null,currentVlan:null,currentLine:null,currentLineRange:null,currentDhcpPool:null,currentExtAcl:null,interfaces:ifaces,vlans:{1:{name:'default'}},enableSecret:null,enablePassword:null,domainName:null,cryptoKey:false,users:{},lines:{console:{pw:null,login:false},vty:{pw:null,login:false,transport:null,loginLocal:false}},vtyRanges:{},banners:{login:null,exec:null,motd:null},routes:[],ospfProcess:null,ospfNetworks:[],saved:false,configEntered:false,ranShowIntBrief:false,ranShowRoute:false,ranShowVlan:false,labId:null,completedTasks:[],currentLab:null,dhcpPools:{},dhcpExcluded:[],accessLists:{},extAcls:{},natInsideList:null,natOverloadIface:null,stpPriority:{},isSandbox:false,cdpRun:true,cdpInterfaces:{},cdpNeighbors:[],cdpQueriesAfterDisableIface:0,cdpQueriesAfterDisableGlobal:0,cdpTimer:60,cdpHoldtime:180,labQuizAnswers:{}}
}
function openLab(id){const lab=CLI_LABS.find(x=>x.id===id);if(!lab)return;cli=newCliState(lab.dev);cli.labId=id;cli.currentLab=lab;if(typeof lab.setup==='function'){try{lab.setup(cli)}catch(e){console.error('lab setup failed:',e)}}document.getElementById('cli-lab-title').textContent='LAB '+lab.num+' · '+lab.t;document.getElementById('cli-lab-dev').textContent=lab.dev.toUpperCase()+' · '+(lab.dev==='router'?'ISR 4321':'Catalyst 2960');const term=document.getElementById('term');term.innerHTML='';cliPrint('sys','━━━ PACKETKILL CLI · LAB '+lab.num+' ━━━');cliPrint('hi',lab.t.toUpperCase()+' · '+lab.diff+' · +'+lab.xp+' XP');cliPrint('out','');cliPrint('out',lab.intro);cliPrint('out','');cliPrint('dim','───────────────────────────────────────');cliPrint('hi','▸ FIRST TASK: '+lab.tasks[0].desc);cliPrint('hi','▸ TYPE: '+lab.tasks[0].hint);cliPrint('dim','───────────────────────────────────────');cliPrint('dim','Commands teach as you go — watch for ◆ WHY boxes.');cliPrint('dim','Help: ? · Hint: hint · Leave: quit');cliPrint('out','');updatePrompt();renderTaskStrip();hideLabActionBar();showScreen('cli');setTimeout(()=>document.getElementById('term-input').focus(),100)}

function nextLab(){if(!cli||!cli.currentLab){showScreen('labs');return}const idx=CLI_LABS.findIndex(l=>l.id===cli.currentLab.id);if(idx>=0&&idx<CLI_LABS.length-1){openLab(CLI_LABS[idx+1].id)}else{showScreen('labs')}}
function showLabActionBar(){let bar=document.getElementById('lab-done-bar');if(!bar){bar=document.createElement('div');bar.id='lab-done-bar';bar.className='lab-done-bar';document.getElementById('screen-cli').appendChild(bar)}const idx=CLI_LABS.findIndex(l=>l.id===cli.currentLab.id);const hasNext=idx>=0&&idx<CLI_LABS.length-1;const nextT=hasNext?CLI_LABS[idx+1].t:null;bar.innerHTML=`<div class="ldbm">✓ LAB COMPLETE · +${cli.currentLab.xp} XP BANKED</div><div class="ldba"><button class="btn" onclick="showScreen('labs')">← LABS LIST</button>${hasNext?`<button class="btn bp" onclick="nextLab()">NEXT: ${nextT} →</button>`:`<button class="btn bp" onclick="showScreen('labs')">ALL LABS COMPLETE</button>`}</div>`;setTimeout(()=>bar.classList.add('sh'),50)}
function hideLabActionBar(){const bar=document.getElementById('lab-done-bar');if(bar)bar.classList.remove('sh')}
function labComplete(){const lab=cli.currentLab;const wasComplete=!!profile.completedLabs[lab.id];if(!wasComplete){profile.completedLabs[lab.id]=todayStr();profile.xp+=lab.xp;saveProfile();checkAchievements();toast('LAB COMPLETE +'+lab.xp+' XP','xp')}cliPrint('out','');cliPrint('hi','╔════════════════════════════╗');cliPrint('ok',wasComplete?'   LAB ALREADY COMPLETE':'   LAB COMPLETE! +'+lab.xp+' XP');cliPrint('hi','╚════════════════════════════╝');cliPrint('out','');cliPrint('dim','Use the buttons below to continue.');showLabActionBar()}
function cliPrint(cls,text){const term=document.getElementById('term');const div=document.createElement('div');div.className=cls;div.textContent=text;term.appendChild(div);term.scrollTop=term.scrollHeight}
function teach(key,html){
 // Show each lesson ONCE per lab (persists across sessions). Sandbox always shows.
 if(!cli.isSandbox){
  if(!profile.learned)profile.learned={};
  if(profile.learned[key])return;
  profile.learned[key]=true;saveProfile();
 }
 const term=document.getElementById('term');const div=document.createElement('div');div.className='teach';div.innerHTML='◆ WHY · '+html;term.appendChild(div);term.scrollTop=term.scrollHeight;
}
function teachReset(){if(profile.learned){delete profile.learned;saveProfile();toast('Learn notes reset','xp')}}
const SQL_INITIAL_DB={
 employees:{
  cols:['id','name','department','salary','manager_id','hire_date'],
  rows:[
   [1,'Alice Chen','Engineering',95000,null,'2018-03-15'],
   [2,'Bob Martinez','Engineering',82000,1,'2019-07-22'],
   [3,'Carol Smith','Sales',71000,null,'2017-01-10'],
   [4,'Dan Park','Sales',65000,3,'2020-09-01'],
   [5,'Eve Johnson','Engineering',88000,1,'2019-02-14'],
   [6,'Frank Wu','Marketing',69000,null,'2018-11-30'],
   [7,'Grace Lee','Engineering',75000,1,'2021-05-19'],
   [8,'Henry Diaz','Sales',58000,3,'2022-03-08'],
   [9,'Iris Kim','Marketing',62000,6,'2021-10-12'],
   [10,'Jack Brown','Engineering',105000,null,'2016-06-25']
  ]
 },
 departments:{
  cols:['id','name','budget','location'],
  rows:[
   [1,'Engineering',500000,'Building A'],
   [2,'Sales',300000,'Building B'],
   [3,'Marketing',200000,'Building B'],
   [4,'HR',150000,'Building A']
  ]
 },
 logins:{
  cols:['id','user_id','timestamp','source_ip','result'],
  rows:[
   [1,1,'2025-04-20 08:15:00','10.1.1.45','SUCCESS'],
   [2,2,'2025-04-20 08:22:00','10.1.1.46','SUCCESS'],
   [3,99,'2025-04-20 08:31:00','203.0.113.55','FAIL'],
   [4,99,'2025-04-20 08:31:05','203.0.113.55','FAIL'],
   [5,99,'2025-04-20 08:31:10','203.0.113.55','FAIL'],
   [6,99,'2025-04-20 08:31:15','203.0.113.55','FAIL'],
   [7,99,'2025-04-20 08:31:20','203.0.113.55','FAIL'],
   [8,1,'2025-04-20 09:00:00','10.1.1.45','SUCCESS'],
   [9,3,'2025-04-20 09:15:00','10.1.1.50','SUCCESS'],
   [10,99,'2025-04-20 09:18:00','198.51.100.7','FAIL'],
   [11,99,'2025-04-20 09:18:05','198.51.100.7','FAIL'],
   [12,99,'2025-04-20 09:18:10','198.51.100.7','FAIL'],
   [13,4,'2025-04-20 10:30:00','10.1.1.51','SUCCESS'],
   [14,5,'2025-04-20 11:00:00','10.1.1.47','SUCCESS']
  ]
 }
};
let SQL_DB=JSON.parse(JSON.stringify(SQL_INITIAL_DB));

function runSqlQuery(sql){
 sql=sql.trim().replace(/;\s*$/,'').replace(/\s+/g,' ');
 if(!sql)return{error:'Empty query'};
 const lower=sql.toLowerCase();
 try{
  if(lower.startsWith('select '))return execSelect(sql);
  if(lower.startsWith('insert '))return execInsert(sql);
  if(lower.startsWith('update '))return execUpdate(sql);
  if(lower.startsWith('delete '))return execDelete(sql);
  if(lower.startsWith('drop table ')){const tbl=sql.split(/\s+/)[2].replace(/;/,'');delete SQL_DB[tbl];return{message:'Table '+tbl+' dropped'}}
  if(lower.startsWith('create table ')){const m=sql.match(/^create\s+table\s+(\w+)\s*\((.+)\)\s*$/i);if(!m)throw new Error('CREATE TABLE format: CREATE TABLE name (col1 TYPE, col2 TYPE, ...)');const [,tbl,colsRaw]=m;const colDefs=colsRaw.split(',').map(c=>c.trim());const cols=colDefs.map(c=>c.split(/\s+/)[0]);if(SQL_DB[tbl])throw new Error('Table '+tbl+' already exists');SQL_DB[tbl]={cols,rows:[]};return{message:'Table '+tbl+' created with columns: '+cols.join(', ')}}
  if(lower.startsWith('alter table ')){const m=sql.match(/^alter\s+table\s+(\w+)\s+add\s+(?:column\s+)?(\w+)/i);if(!m)throw new Error('ALTER TABLE format: ALTER TABLE name ADD column TYPE');const [,tbl,col]=m;if(!SQL_DB[tbl])throw new Error('Table '+tbl+' does not exist');if(SQL_DB[tbl].cols.includes(col))throw new Error('Column '+col+' already exists');SQL_DB[tbl].cols.push(col);SQL_DB[tbl].rows.forEach(r=>r.push(null));return{message:'Column '+col+' added to '+tbl}}
  if(lower==='show tables'||lower==='.tables')return{cols:['table'],rows:Object.keys(SQL_DB).map(t=>[t])};
  return{error:'Unsupported statement. Try SELECT, INSERT, UPDATE, DELETE.'}
 }catch(e){return{error:e.message}}
}
function tokenize(s){return s.match(/'[^']*'|"[^"]*"|[^\s,()]+|[(),]/g)||[]}
function parseValue(tok){if(!tok)return null;if(tok==='NULL'||tok.toUpperCase()==='NULL')return null;if(/^-?\d+(\.\d+)?$/.test(tok))return parseFloat(tok);if((tok.startsWith("'")&&tok.endsWith("'"))||(tok.startsWith('"')&&tok.endsWith('"')))return tok.slice(1,-1);return tok}
function execSelect(sql){
 // SELECT cols FROM table [JOIN ... ON ...] [WHERE ...] [GROUP BY ...] [HAVING ...] [ORDER BY ...] [LIMIT N]
 const re=/^select\s+(.+?)\s+from\s+(\w+)(?:\s+(?:as\s+)?(\w+))?(?:\s+(inner|left|right)?\s*join\s+(\w+)(?:\s+(?:as\s+)?(\w+))?\s+on\s+(.+?))?(?:\s+where\s+(.+?))?(?:\s+group\s+by\s+(.+?))?(?:\s+having\s+(.+?))?(?:\s+order\s+by\s+(.+?))?(?:\s+limit\s+(\d+))?$/i;
 const m=sql.match(re);if(!m)throw new Error('SELECT syntax error. Format: SELECT cols FROM table [JOIN x ON y] [WHERE ...] [GROUP BY ...] [ORDER BY ...] [LIMIT n]');
 const [,colsRaw,t1,a1,jType,t2,a2,onClause,whereClause,groupBy,having,orderBy,limit]=m;
 if(!SQL_DB[t1])throw new Error('Table '+t1+' does not exist');
 const a1key=a1||t1;const t1schema=SQL_DB[t1];
 // Build initial rowset
 let working=t1schema.rows.map(r=>{const o={};t1schema.cols.forEach((c,i)=>{o[a1key+'.'+c]=r[i];o[c]=r[i]});return o});
 // JOIN
 if(t2){
  if(!SQL_DB[t2])throw new Error('Table '+t2+' does not exist');
  const a2key=a2||t2;const t2schema=SQL_DB[t2];
  const t2rows=t2schema.rows.map(r=>{const o={};t2schema.cols.forEach((c,i)=>{o[a2key+'.'+c]=r[i];o[c]=r[i]});return o});
  const joined=[];
  working.forEach(l=>{
   const matches=t2rows.filter(r=>evalCondition(onClause,Object.assign({},l,r)));
   if(matches.length){matches.forEach(r=>joined.push(Object.assign({},l,r)))}
   else if(jType&&jType.toLowerCase()==='left'){joined.push(Object.assign({},l))}
  });
  working=joined;
 }
 // WHERE
 if(whereClause)working=working.filter(r=>evalCondition(whereClause,r));
 // GROUP BY
 const cols=colsRaw.split(',').map(c=>c.trim());
 const aggRe=/^(count|sum|avg|min|max)\s*\(\s*(\*|[\w.]+)\s*\)(?:\s+as\s+(\w+))?$/i;
 const aggCols=cols.map(c=>{const m=c.match(aggRe);if(m)return{fn:m[1].toLowerCase(),arg:m[2],alias:m[3]||c};return null});
 const isAgg=aggCols.some(a=>a)||groupBy;
 let resultRows=[];let resultCols=[];
 if(isAgg){
  // Group rows
  const groupKeys=groupBy?groupBy.split(',').map(k=>k.trim()):[];
  const groups={};
  if(groupKeys.length===0){groups['_all']=working}
  else{working.forEach(r=>{const key=groupKeys.map(k=>r[k]).join('|');(groups[key]=groups[key]||[]).push(r)})}
  resultCols=cols.map(c=>{const m=c.match(/\s+as\s+(\w+)$/i);return m?m[1]:c});
  Object.entries(groups).forEach(([key,rows])=>{
   const out=cols.map((c,i)=>{
    const ag=aggCols[i];
    if(ag){
     const vals=rows.map(r=>r[ag.arg]).filter(v=>v!==null&&v!==undefined);
     if(ag.fn==='count')return ag.arg==='*'?rows.length:vals.length;
     if(ag.fn==='sum')return vals.reduce((a,b)=>a+(+b||0),0);
     if(ag.fn==='avg')return vals.length?vals.reduce((a,b)=>a+(+b||0),0)/vals.length:0;
     if(ag.fn==='min')return Math.min(...vals);
     if(ag.fn==='max')return Math.max(...vals);
    }
    const cleanCol=c.replace(/\s+as\s+\w+$/i,'').trim();
    return rows[0]?rows[0][cleanCol]:null;
   });
   resultRows.push(out);
  });
  // HAVING
  if(having){resultRows=resultRows.filter(r=>{const obj={};resultCols.forEach((c,i)=>obj[c]=r[i]);return evalCondition(having,obj)})}
 }else{
  // Plain SELECT with no aggregation
  if(cols.length===1&&cols[0]==='*'){
   const allCols=Object.keys(working[0]||{}).filter(k=>!k.includes('.'));
   resultCols=allCols;
   resultRows=working.map(r=>allCols.map(c=>r[c]));
  }else{
   resultCols=cols.map(c=>{const m=c.match(/\s+as\s+(\w+)$/i);return m?m[1]:c});
   const cleanCols=cols.map(c=>c.replace(/\s+as\s+\w+$/i,'').trim());
   resultRows=working.map(r=>cleanCols.map(c=>r[c]));
  }
 }
 // ORDER BY
 if(orderBy){
  const ords=orderBy.split(',').map(o=>{const p=o.trim().split(/\s+/);return{col:p[0],dir:(p[1]||'asc').toLowerCase()}});
  resultRows.sort((a,b)=>{for(const o of ords){const i=resultCols.indexOf(o.col);if(i<0)continue;const av=a[i],bv=b[i];if(av<bv)return o.dir==='desc'?1:-1;if(av>bv)return o.dir==='desc'?-1:1}return 0});
 }
 // LIMIT
 if(limit)resultRows=resultRows.slice(0,parseInt(limit));
 return{cols:resultCols,rows:resultRows,count:resultRows.length}
}
function evalCondition(cond,row){
 if(!cond)return true;
 // Handle parentheses recursively (simple)
 // Split on AND/OR (left-to-right, simple)
 const orParts=cond.split(/\s+OR\s+/i);
 if(orParts.length>1)return orParts.some(p=>evalCondition(p,row));
 const andParts=cond.split(/\s+AND\s+/i);
 if(andParts.length>1)return andParts.every(p=>evalCondition(p,row));
 // Single comparison
 const c=cond.trim();
 // LIKE
 const likeM=c.match(/^(\S+)\s+(?:NOT\s+)?LIKE\s+'(.*)'$/i);
 if(likeM){const not=/NOT/i.test(c);const v=String(row[likeM[1]]||'');const pat=new RegExp('^'+likeM[2].replace(/[.+^${}()|[\]\\]/g,'\\$&').replace(/%/g,'.*').replace(/_/g,'.')+'$','i');return not?!pat.test(v):pat.test(v)}
 // IN
 const inM=c.match(/^(\S+)\s+(?:NOT\s+)?IN\s*\((.+)\)$/i);
 if(inM){const not=/NOT/i.test(c);const vals=tokenize(inM[2]).filter(t=>t!==',').map(parseValue);const has=vals.includes(row[inM[1]]);return not?!has:has}
 // IS NULL / IS NOT NULL
 const nullM=c.match(/^(\S+)\s+IS\s+(NOT\s+)?NULL$/i);
 if(nullM){const isNull=row[nullM[1]]===null||row[nullM[1]]===undefined;return nullM[2]?!isNull:isNull}
 // Comparison
 const opM=c.match(/^(\S+)\s*(=|!=|<>|<=|>=|<|>)\s*(.+)$/);
 if(opM){
  const lhs=row[opM[1]];
  let rhsRaw=opM[3].trim();
  // Check if RHS is a column reference (in row), otherwise parse as literal
  let rhs;
  if(row[rhsRaw]!==undefined)rhs=row[rhsRaw];
  else rhs=parseValue(rhsRaw);
  switch(opM[2]){case'=':return lhs==rhs;case'!=':case'<>':return lhs!=rhs;case'<':return lhs<rhs;case'>':return lhs>rhs;case'<=':return lhs<=rhs;case'>=':return lhs>=rhs}
 }
 throw new Error('Bad condition: '+c);
}
function execInsert(sql){
 const m=sql.match(/^insert\s+into\s+(\w+)\s*(?:\(([^)]+)\))?\s*values\s*\((.+)\)$/i);
 if(!m)throw new Error('INSERT format: INSERT INTO table (col1, col2) VALUES (val1, val2)');
 const [,tbl,colsRaw,valsRaw]=m;
 if(!SQL_DB[tbl])throw new Error('Table '+tbl+' does not exist');
 const schema=SQL_DB[tbl];
 const cols=colsRaw?colsRaw.split(',').map(c=>c.trim()):schema.cols;
 const vals=tokenize(valsRaw).filter(t=>t!==','&&t!=='('&&t!==')').map(parseValue);
 const row=schema.cols.map(c=>{const i=cols.indexOf(c);return i>=0?vals[i]:null});
 schema.rows.push(row);
 return{message:'1 row inserted into '+tbl}
}
function execUpdate(sql){
 const m=sql.match(/^update\s+(\w+)\s+set\s+(.+?)(?:\s+where\s+(.+))?$/i);
 if(!m)throw new Error('UPDATE format: UPDATE table SET col=val WHERE cond');
 const [,tbl,setsRaw,whereClause]=m;
 if(!SQL_DB[tbl])throw new Error('Table '+tbl+' does not exist');
 const schema=SQL_DB[tbl];
 const sets=setsRaw.split(',').map(s=>{const [k,v]=s.split('=').map(x=>x.trim());return{col:k,val:parseValue(v)}});
 let count=0;
 schema.rows.forEach((r,i)=>{
  const obj={};schema.cols.forEach((c,j)=>obj[c]=r[j]);
  if(!whereClause||evalCondition(whereClause,obj)){
   sets.forEach(s=>{const ci=schema.cols.indexOf(s.col);if(ci>=0)r[ci]=s.val});
   count++;
  }
 });
 return{message:count+' row(s) updated in '+tbl}
}
function execDelete(sql){
 const m=sql.match(/^delete\s+from\s+(\w+)(?:\s+where\s+(.+))?$/i);
 if(!m)throw new Error('DELETE format: DELETE FROM table WHERE cond');
 const [,tbl,whereClause]=m;
 if(!SQL_DB[tbl])throw new Error('Table '+tbl+' does not exist');
 const schema=SQL_DB[tbl];
 const before=schema.rows.length;
 schema.rows=schema.rows.filter(r=>{
  if(!whereClause)return false;
  const obj={};schema.cols.forEach((c,i)=>obj[c]=r[i]);
  return !evalCondition(whereClause,obj);
 });
 return{message:(before-schema.rows.length)+' row(s) deleted from '+tbl}
}
const SQL_CHALLENGES=[
{id:'sq1',t:'SELECT ALL',d:'Return every column and every row from the employees table.',xp:30,solution:'SELECT * FROM employees',check:r=>r.cols&&r.cols.length>=6&&r.rows.length===10},
{id:'sq2',t:'SELECT SPECIFIC COLUMNS',d:'Return just the name and salary of every employee.',xp:30,solution:'SELECT name, salary FROM employees',check:r=>r.cols&&r.cols.length===2&&r.cols.includes('name')&&r.cols.includes('salary')&&r.rows.length===10},
{id:'sq3',t:'WHERE FILTER',d:'Find all employees in the Engineering department.',xp:40,solution:"SELECT * FROM employees WHERE department='Engineering'",check:r=>r.rows.length===5&&r.rows.every(row=>row[r.cols.indexOf('department')]==='Engineering')},
{id:'sq4',t:'COMPARISON OPERATORS',d:'Find employees with salary greater than 80000. Return name and salary.',xp:40,solution:'SELECT name, salary FROM employees WHERE salary > 80000',check:r=>r.rows.length===4&&r.rows.every(row=>row[r.cols.indexOf('salary')]>80000)},
{id:'sq5',t:'AND / OR',d:'Find Engineering employees making more than 90000.',xp:50,solution:"SELECT * FROM employees WHERE department='Engineering' AND salary>90000",check:r=>r.rows.length===2&&r.rows.every(row=>row[r.cols.indexOf('department')]==='Engineering'&&row[r.cols.indexOf('salary')]>90000)},
{id:'sq6',t:'ORDER BY',d:'List all employees by salary, highest first.',xp:50,solution:'SELECT name, salary FROM employees ORDER BY salary DESC',check:r=>r.rows.length===10&&r.rows[0][r.cols.indexOf('salary')]>=r.rows[r.rows.length-1][r.cols.indexOf('salary')]},
{id:'sq7',t:'LIMIT',d:'Top 3 highest-paid employees, name and salary only.',xp:50,solution:'SELECT name, salary FROM employees ORDER BY salary DESC LIMIT 3',check:r=>r.rows.length===3&&r.rows[0][r.cols.indexOf('salary')]===105000},
{id:'sq8',t:'COUNT',d:'How many employees are in the database? (single number result)',xp:50,solution:'SELECT COUNT(*) FROM employees',check:r=>r.rows.length===1&&+r.rows[0][0]===10},
{id:'sq9',t:'GROUP BY + COUNT',d:'Count employees per department.',xp:75,solution:'SELECT department, COUNT(*) FROM employees GROUP BY department',check:r=>r.rows.length===3&&r.rows.some(row=>row[0]==='Engineering'&&+row[1]===5)},
{id:'sq10',t:'AVG aggregate',d:'Average salary per department.',xp:75,solution:'SELECT department, AVG(salary) FROM employees GROUP BY department',check:r=>r.rows.length===3&&r.rows.some(row=>row[0]==='Engineering')},
{id:'sq11',t:'INNER JOIN',d:'Show each employee with their department budget. Return employee name, department name, and budget.',xp:100,solution:'SELECT e.name, d.name, d.budget FROM employees e INNER JOIN departments d ON e.department=d.name',check:r=>r.rows.length>=8&&r.cols.length===3},
{id:'sq12',t:'SOC ANALYST · TOP FAILED IPs',d:'You are investigating brute-force attacks. Find the source IPs with the most FAIL logins. Return source_ip and the count, ordered by most fails. (Hint: WHERE result, GROUP BY source_ip, ORDER BY count DESC)',xp:150,solution:"SELECT source_ip, COUNT(*) FROM logins WHERE result='FAIL' GROUP BY source_ip ORDER BY COUNT(*) DESC",check:r=>r.rows.length>=2&&r.rows[0][0]==='203.0.113.55'&&+r.rows[0][1]===5}
];
let currentSqlChal=0;







const _origShow_v11=showScreen;
showScreen=function(id){if(id==='sql'){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));document.getElementById('screen-sql').classList.add('active');window.scrollTo(0,0);initSql();return}return _origShow_v11(id)};
function cliPrintCmd(text){const term=document.getElementById('term');const div=document.createElement('div');const pr=document.createElement('span');pr.className='prompt';pr.textContent=getPromptStr()+' ';const cmd=document.createElement('span');cmd.className='cmd';cmd.textContent=text;div.appendChild(pr);div.appendChild(cmd);term.appendChild(div);term.scrollTop=term.scrollHeight}
function getPromptStr(){const hn=cli.hostname;if(cli.mode==='user')return hn+'>';if(cli.mode==='priv')return hn+'#';if(cli.mode==='global')return hn+'(config)#';if(cli.mode==='if')return hn+'(config-if)#';if(cli.mode==='vlan')return hn+'(config-vlan)#';if(cli.mode==='line')return hn+'(config-line)#';if(cli.mode==='dhcp')return hn+'(dhcp-config)#';if(cli.mode==='ext-acl')return hn+'(config-ext-nacl)#';return hn+'>'}
function updatePrompt(){document.getElementById('term-prompt').textContent=getPromptStr()}
function renderTaskStrip(){
 const lab=cli.currentLab;
 if(!lab){document.getElementById('task-strip').innerHTML='';return}
 const total=lab.tasks.length;
 const done=cli.completedTasks.length;
 const nextTask=lab.tasks.find(t=>!cli.completedTasks.includes(t.id));
 let html='<div class="tstr-lbl">TASKS · PROGRESS <span>'+done+'/'+total+'</span></div>';
 lab.tasks.forEach(t=>{
  const isDone=cli.completedTasks.includes(t.id);
  const isCurrent=!isDone&&t===nextTask;
  html+='<div class="tsitem '+(isDone?'done':(isCurrent?'current':''))+'">'+t.desc+'</div>';
 });
 if(nextTask){
  if(nextTask.quiz){
   // Render the quiz inline with tappable options
   const q=nextTask.quiz;
   const prereqOK=!nextTask.prereq||nextTask.prereq(cli);
   if(!prereqOK){
    html+='<div class="tstr-hint" style="border-left-color:#FB923C"><b>▸ FIRST RUN:</b> '+nextTask.hint+'</div>';
   }else{
    html+='<div class="tstr-hint" style="border-left-color:#7DD3FC;background:#0a1a2a"><b style="color:#7DD3FC">QUESTION '+q.num+':</b><br>'+q.q+'<div style="display:flex;flex-direction:column;gap:5px;margin-top:8px">';
    q.opts.forEach((opt,i)=>{
     const letter=String.fromCharCode(65+i);
     html+='<button onclick="cliQuizAnswer('+q.num+',\''+letter+'\')" style="text-align:left;padding:9px 11px;background:#0F0F0F;border:1px solid #2a2a2a;border-left:3px solid #7DD3FC;border-radius:4px;color:#F5F5F5;font-family:JetBrains Mono;font-size:11.5px;cursor:pointer;line-height:1.4"><b style="color:#7DD3FC">'+letter+'.</b> '+opt+'</button>';
    });
    html+='</div><div style="margin-top:7px;font-size:10px;color:#888">Or type <b>Q'+q.num+'A</b> / <b>Q'+q.num+'B</b> / etc. in the terminal</div></div>';
   }
  }else{
   html+='<div class="tstr-hint"><b>▸ NEXT · TYPE:</b> '+nextTask.hint+'</div>';
  }
 }
 document.getElementById('task-strip').innerHTML=html;
}
function cliQuizAnswer(num,letter){
 // Programmatically run as if user typed Q{num}{letter}
 const cmd='Q'+num+letter;
 const inp=document.getElementById('term-input');
 if(inp){inp.value=cmd;}
 cliPrint('cmd',getPromptStr()+' '+cmd);
 parseCommand(cmd);
 checkTasks();
 if(inp){inp.value='';inp.focus()}
}
function checkTasks(){
 if(!cli.currentLab||cli.isSandbox)return;
 let progressed=false;
 cli.currentLab.tasks.forEach(t=>{
  if(cli.completedTasks.includes(t.id))return;
  // Quiz tasks: only advance when the user has answered correctly
  if(t.quiz){
   const ans=cli.labQuizAnswers&&cli.labQuizAnswers['q'+t.quiz.num];
   if(ans&&ans===String.fromCharCode(65+t.quiz.ans)){
    cli.completedTasks.push(t.id);
    cliPrint('ok','✓ Task complete: '+t.desc);
    progressed=true;
   }
   return;
  }
  if(t.check&&t.check(cli)){
   cli.completedTasks.push(t.id);
   cliPrint('ok','✓ Task complete: '+t.desc);
   progressed=true;
  }
 });
 if(progressed){
  renderTaskStrip();
  if(cli.completedTasks.length===cli.currentLab.tasks.length){labComplete()}
  else{
   const next=cli.currentLab.tasks.find(t=>!cli.completedTasks.includes(t.id));
   if(next){
    cliPrint('hi','▸ NEXT: '+next.desc);
    if(next.quiz){
     const prereqOK=!next.prereq||next.prereq(cli);
     if(!prereqOK)cliPrint('dim','  First run: '+next.hint);
     else cliPrint('dim','  Tap an answer above, or type Q'+next.quiz.num+'A / Q'+next.quiz.num+'B / Q'+next.quiz.num+'C / Q'+next.quiz.num+'D');
    }else{
     cliPrint('dim','  Type: '+next.hint);
    }
   }
  }
 }
}
function cliHint(){if(cli.isSandbox){cliPrint('hi','▸ Sandbox mode · try: enable, conf t, int g0/0, ip address 10.1.1.1 255.255.255.0, no shut');return}if(!cli.currentLab)return;const next=cli.currentLab.tasks.find(t=>!cli.completedTasks.includes(t.id));if(next){cliPrint('hi','▸ HINT: '+next.hint)}else{cliPrint('ok','All tasks done. Use the buttons below to continue.')}}
const CMD_REGISTRY={
 user:{
  'enable':'Turn on privileged commands',
  'disable':'Exit privileged mode',
  'ping':'Send echo messages',
  'traceroute':'Trace route to destination',
  'show':'Show running system information',
  'exit':'Exit current mode',
  'quit':'Leave the lab',
  '?':'List available commands',
  'help':'Description of the interactive help system'
 },
 priv:{
  'configure':'Enter configuration mode',
  'copy':'Copy from one file to another',
  'disable':'Exit privileged mode',
  'enable':'Turn on privileged commands',
  'erase':'Erase startup configuration',
  'exit':'Exit privileged mode',
  'ping':'Send echo messages',
  'reload':'Halt and perform a cold restart',
  'show':'Show running system information',
  'ssh':'Open SSH connection',
  'telnet':'Open Telnet connection',
  'traceroute':'Trace route to destination',
  'write':'Write running config to NVRAM',
  'clear':'Reset functions',
  'debug':'Enable debugging',
  'no':'Negate a command',
  'quit':'Leave the lab'
 },
 global:{
  'hostname':'Set system hostname',
  'enable':'Modify enable password/secret',
  'interface':'Select an interface to configure',
  'ip':'Global IP configuration',
  'no':'Negate a command',
  'vlan':'Create VLAN, enter VLAN config',
  'line':'Configure terminal line',
  'router':'Enable a routing process',
  'username':'Establish local user account',
  'access-list':'Add numbered access list',
  'banner':'Define a login banner',
  'crypto':'Encryption module',
  'service':'Modify system service',
  'spanning-tree':'Spanning-Tree commands',
  'clock':'Configure time-of-day clock',
  'ntp':'Configure NTP',
  'logging':'Modify syslog config',
  'snmp-server':'SNMP server commands',
  'exit':'Exit to privileged mode',
  'end':'Exit to privileged mode',
  'do':'Run EXEC command from config mode'
 },
 if:{
  'ip':'Interface IP config',
  'no':'Negate a command',
  'shutdown':'Disable the interface',
  'description':'Interface description',
  'switchport':'Switching characteristics',
  'spanning-tree':'STP per-interface settings',
  'channel-group':'Assign to EtherChannel group',
  'duplex':'Set duplex (auto/full/half)',
  'speed':'Set speed',
  'mdix':'Set auto-MDIX state',
  'encapsulation':'Set encapsulation type (subinterfaces)',
  'mtu':'Set MTU',
  'bandwidth':'Set bandwidth hint',
  'exit':'Exit interface config',
  'end':'Exit to privileged mode'
 },
 vlan:{
  'name':'ASCII name for the VLAN',
  'state':'Operational state (active|suspend)',
  'no':'Negate',
  'exit':'Exit VLAN config',
  'end':'Exit to privileged mode'
 },
 line:{
  'password':'Set line password',
  'login':'Enable password checking',
  'transport':'Transport protocols (input|output)',
  'exec-timeout':'Set session timeout',
  'logging':'Modify line logging',
  'privilege':'Change privilege level',
  'no':'Negate',
  'exit':'Exit line config',
  'end':'Exit to privileged mode'
 },
 dhcp:{
  'network':'Network number and mask',
  'default-router':'Default routers for client',
  'dns-server':'DNS servers for client',
  'domain-name':'Domain name for client',
  'lease':'Set address lease duration',
  'no':'Negate',
  'exit':'Exit DHCP pool',
  'end':'Exit to privileged mode'
 },
 'ext-acl':{
  'permit':'Permit packets',
  'deny':'Deny packets',
  'remark':'Access list entry comment',
  'no':'Negate',
  'exit':'Exit ACL config',
  'end':'Exit to privileged mode'
 },
 router:{
  'network':'Enable OSPF on matching interfaces',
  'router-id':'Set Router ID',
  'passive-interface':'Suppress routing updates',
  'default-information':'Control distribution of default route',
  'auto-cost':'Reference bandwidth for cost',
  'no':'Negate',
  'exit':'Exit router config',
  'end':'Exit to privileged mode'
 }
};
const SHOW_REGISTRY={
 'running-config':'Current operating configuration',
 'startup-config':'Saved configuration',
 'ip':'IP-related info',
 'interfaces':'Interface status and config',
 'interface':'Interface status and config',
 'vlan':'VLAN info',
 'vlans':'VLAN info',
 'mac':'MAC address table',
 'cdp':'CDP info',
 'version':'System version',
 'spanning-tree':'STP info',
 'port-security':'Port security status',
 'arp':'ARP table',
 'clock':'Current system time',
 'users':'Active lines',
 'sessions':'Open outbound sessions',
 'access-lists':'Access lists',
 'history':'Command history',
 'processes':'Process info',
 'flash':'Flash file system',
 'logging':'Logging buffer'
};
const SHOW_IP_REGISTRY={
 'interface':'IP interface status',
 'route':'Routing table',
 'protocols':'Routing protocols',
 'ospf':'OSPF info',
 'arp':'ARP table',
 'dhcp':'DHCP server stats/bindings',
 'nat':'NAT translations',
 'access-lists':'IP access lists'
};
if(!window._cliHistory)window._cliHistory=[];
if(!window._cliHistIdx)window._cliHistIdx=-1;
function resolvePrefix(input,keywords){
 if(!input)return{type:'empty',matches:keywords};
 const lower=input.toLowerCase();
 const exact=keywords.find(k=>k.toLowerCase()===lower);
 if(exact)return{type:'exact',match:exact};
 const prefix=keywords.filter(k=>k.toLowerCase().startsWith(lower));
 if(prefix.length===0)return{type:'none'};
 if(prefix.length===1)return{type:'exact',match:prefix[0]};
 return{type:'ambiguous',matches:prefix};
}
function expandLine(raw){
 const tokens=raw.trim().split(/\s+/);
 if(tokens.length===0||!tokens[0])return raw;
 const out=[...tokens];
 // First token: mode registry
 const modeKeys=Object.keys(CMD_REGISTRY[cli.mode]||{});
 const r0=resolvePrefix(tokens[0],modeKeys);
 if(r0.type==='exact')out[0]=r0.match;
 // Second token expansion depends on first
 if(out[0]==='show'&&tokens[1]){
  // Special: 'int' is ambiguous between 'interface' and 'interfaces'; prefer 'interfaces' in show context
  if(tokens[1].toLowerCase()==='int')out[1]='interfaces';
  else{
    const r1=resolvePrefix(tokens[1],Object.keys(SHOW_REGISTRY));
    if(r1.type==='exact')out[1]=r1.match;
  }
  // Third token if show ip ...
  if(out[1]==='ip'&&tokens[2]){
   const r2=resolvePrefix(tokens[2],Object.keys(SHOW_IP_REGISTRY));
   if(r2.type==='exact')out[2]=r2.match
  }
  // Fourth token: "show ip interface brief"
  if(out[1]==='ip'&&out[2]==='interface'&&tokens[3]){
   const r3=resolvePrefix(tokens[3],['brief']);
   if(r3.type==='exact')out[3]=r3.match
  }
  // "show interface trunk" / "show vlan brief"
  if(out[1]==='vlan'&&tokens[2]){const r=resolvePrefix(tokens[2],['brief','id']);if(r.type==='exact')out[2]=r.match}
  if(out[1]==='interfaces'&&tokens[2]){const r=resolvePrefix(tokens[2],['trunk','status','counters']);if(r.type==='exact')out[2]=r.match}
 }
 // Common prefix expansions
 if(out[0]==='configure'&&tokens[1]){
  const r=resolvePrefix(tokens[1],['terminal']);if(r.type==='exact')out[1]=r.match;
 }
 if(out[0]==='interface'||out[0]==='int'){out[0]='interface'}
 if(out[0]==='no'&&tokens[1]){
  // Expand the 2nd token based on common negation targets
  if(tokens[1].toLowerCase()==='shut')out[1]='shutdown';
  else{
    const negationTargets=['shutdown','description','switchport','ip','spanning-tree','access-list','no'].concat(modeKeys);
    const r=resolvePrefix(tokens[1],negationTargets);if(r.type==='exact')out[1]=r.match;
  }
 }
 if(out[0]==='copy'&&tokens[1]){const r=resolvePrefix(tokens[1],['running-config','startup-config','flash:','tftp:']);if(r.type==='exact')out[1]=r.match}
 if(out[0]==='copy'&&tokens[2]){const r=resolvePrefix(tokens[2],['running-config','startup-config','flash:','tftp:']);if(r.type==='exact')out[2]=r.match}
 if(out[0]==='switchport'&&tokens[1]){const r=resolvePrefix(tokens[1],['mode','access','trunk','port-security','nonegotiate','voice']);if(r.type==='exact')out[1]=r.match}
 if(out[0]==='spanning-tree'&&tokens[1]){const r=resolvePrefix(tokens[1],['mode','vlan','portfast','bpduguard','bpdufilter','guard']);if(r.type==='exact')out[1]=r.match}
 if(out[0]==='ip'&&tokens[1]){const r=resolvePrefix(tokens[1],['address','route','nat','dhcp','domain-name','access-list','access-group','helper-address','default-gateway','ospf','http']);if(r.type==='exact')out[1]=r.match}
 if(out[0]==='line'&&tokens[1]){const r=resolvePrefix(tokens[1],['console','vty','aux']);if(r.type==='exact')out[1]=r.match}
 return out.join(' ');
}
function showContextHelp(raw){
 const trimmed=raw.replace(/\?\s*$/,'').trim();
 const tokens=trimmed?trimmed.split(/\s+/):[];
 cliPrint('out','');
 if(tokens.length===0){
  // Top-level mode commands
  const keys=Object.keys(CMD_REGISTRY[cli.mode]||{});
  keys.sort().forEach(k=>cliPrint('dim','  '+k.padEnd(18)+(CMD_REGISTRY[cli.mode][k]||'')));
 }else if(tokens.length===1&&tokens[0]==='show'){
  Object.keys(SHOW_REGISTRY).sort().forEach(k=>cliPrint('dim','  '+k.padEnd(20)+SHOW_REGISTRY[k]));
 }else if(tokens.length===2&&tokens[0]==='show'&&tokens[1]==='ip'){
  Object.keys(SHOW_IP_REGISTRY).sort().forEach(k=>cliPrint('dim','  '+k.padEnd(20)+SHOW_IP_REGISTRY[k]));
 }else{
  // Context-specific hints
  const last=tokens[tokens.length-1].toLowerCase();
  const first=tokens[0].toLowerCase();
  if(first==='ip'&&tokens.length===2&&last==='address'){cliPrint('dim','  A.B.C.D             IP address')
   cliPrint('dim','  dhcp                Use DHCP to acquire')
  }else if(first==='ip'&&tokens.length===2&&last==='route'){
   cliPrint('dim','  A.B.C.D             Destination network')
   cliPrint('dim','  0.0.0.0             Default route')
  }else if(first==='switchport'&&tokens[1]==='mode'){
   cliPrint('dim','  access              Access port (single VLAN)')
   cliPrint('dim','  trunk               Trunk port (multi-VLAN)')
   cliPrint('dim','  dynamic             DTP-negotiated (not recommended)')
  }else if(first==='switchport'&&tokens[1]==='port-security'){
   cliPrint('dim','  maximum             Max number of secure MACs')
   cliPrint('dim','  mac-address         Static/sticky MAC')
   cliPrint('dim','  violation           Action on violation')
   cliPrint('dim','  <cr>                Enable port-security')
  }else if(first==='interface'||first==='int'){
   cliPrint('dim','  GigabitEthernet     Gigabit Ethernet (g0/0, g0/1, g0/2)')
   cliPrint('dim','  FastEthernet        Fast Ethernet (fa0/1 … fa0/7)')
   cliPrint('dim','  Loopback            Loopback interface')
   cliPrint('dim','  Vlan                Switch VLAN interface')
  }else if(first==='show'&&tokens[1]==='ip'&&tokens[2]==='interface'){
   cliPrint('dim','  brief               Brief summary')
   cliPrint('dim','  <iface>             Specific interface')
  }else{
   cliPrint('dim','  <cr>                Execute command')
  }
 }
 cliPrint('out','');
}
function tabComplete(){
 const inp=document.getElementById('term-input');const val=inp.value;
 if(!val.trim())return;
 const tokens=val.split(/\s+/);
 const last=tokens[tokens.length-1];
 const before=tokens.slice(0,-1);
 let candidates=[];
 if(before.length===0){candidates=Object.keys(CMD_REGISTRY[cli.mode]||{})}
 else if(before[0]==='show'&&before.length===1){candidates=Object.keys(SHOW_REGISTRY)}
 else if(before[0]==='show'&&before[1]==='ip'&&before.length===2){candidates=Object.keys(SHOW_IP_REGISTRY)}
 else if(before[0]==='switchport'&&before.length===1){candidates=['mode','access','trunk','port-security','nonegotiate','voice']}
 else if(before[0]==='switchport'&&before[1]==='mode'){candidates=['access','trunk','dynamic']}
 else if(before[0]==='switchport'&&before[1]==='port-security'){candidates=['maximum','mac-address','violation','aging']}
 else if(before[0]==='ip'&&before.length===1){candidates=['address','route','nat','dhcp','domain-name','access-list','access-group','helper-address','default-gateway','ospf']}
 else if(before[0]==='interface'||before[0]==='int'){candidates=['GigabitEthernet0/0','GigabitEthernet0/1','GigabitEthernet0/2','FastEthernet0/1','FastEthernet0/2','FastEthernet0/5','Loopback0','Vlan1']}
 else if(before[0]==='line'){candidates=['console','vty','aux']}
 else if(before[0]==='spanning-tree'){candidates=['mode','vlan','portfast','bpduguard','bpdufilter','guard']}
 if(candidates.length===0)return;
 const matches=last?candidates.filter(c=>c.toLowerCase().startsWith(last.toLowerCase())):candidates;
 if(matches.length===1){
  inp.value=[...before,matches[0]].join(' ')+' ';
 }else if(matches.length>1){
  // Show options, find common prefix
  let common=matches[0];
  for(let i=1;i<matches.length;i++){
   let j=0;while(j<common.length&&j<matches[i].length&&common[j].toLowerCase()===matches[i][j].toLowerCase())j++;
   common=common.substring(0,j);
  }
  if(common.length>last.length){inp.value=[...before,common].join(' ')}
  cliPrint('dim','  '+matches.join('   '));
 }
}
function historyNav(dir){
 const inp=document.getElementById('term-input');
 if(window._cliHistory.length===0)return;
 if(dir==='up'){
  if(window._cliHistIdx<window._cliHistory.length-1)window._cliHistIdx++;
  inp.value=window._cliHistory[window._cliHistory.length-1-window._cliHistIdx]||'';
 }else{
  if(window._cliHistIdx>0){window._cliHistIdx--;inp.value=window._cliHistory[window._cliHistory.length-1-window._cliHistIdx]||''}
  else{window._cliHistIdx=-1;inp.value=''}
 }
}
const _origCliSubmit=cliSubmit;
cliSubmit=function(){
 const inp=document.getElementById('term-input');
 const raw=inp.value;
 const line=raw.trim();
 if(!line){cliPrintCmd('');cliPrint('out','');return}
 // Handle ? at end of line for context help
 if(line.endsWith('?')){
  cliPrintCmd(line);
  showContextHelp(line);
  inp.value=line.slice(0,-1);
  return;
 }
 // Push to history
 if(window._cliHistory[window._cliHistory.length-1]!==line)window._cliHistory.push(line);
 window._cliHistIdx=-1;
 if(window._cliHistory.length>50)window._cliHistory.shift();
 // Expand shortened tokens
 const expanded=expandLine(line);
 cliPrintCmd(line);
 inp.value='';
 parseCommand(expanded);
 checkTasks();
 updatePrompt();
};
showCliHelp=function(){
 cliPrint('out','');
 cliPrint('hi','◆ COMMANDS AVAILABLE IN '+cli.mode.toUpperCase()+' MODE:');
 cliPrint('out','');
 const keys=Object.keys(CMD_REGISTRY[cli.mode]||{}).sort();
 keys.forEach(k=>cliPrint('dim','  '+k.padEnd(18)+(CMD_REGISTRY[cli.mode][k]||'')));
 cliPrint('out','');
 cliPrint('dim','Tips:');
 cliPrint('dim','  • Use TAB to complete commands');
 cliPrint('dim','  • Use ? after a partial command for context help');
 cliPrint('dim','  • Up/Down arrows for command history');
 cliPrint('dim','  • Most commands shortable: "sh ip int br" = "show ip interface brief"');
 cliPrint('out','');
};
const _origParseCommand=parseCommand;
parseCommand=function(raw){
 const lc=raw.toLowerCase().trim();
 const parts=raw.trim().split(/\s+/);
 const pc=parts.map(p=>p.toLowerCase());
 // v9 · additional show commands
 if(lc==='show startup-config'){if(cli.saved){cliPrint('out','Using 1024 out of 253568 bytes');cliPrint('out','!');cliPrint('out','hostname '+cli.hostname);cliPrint('out','!');cliPrint('out','(configuration saved at last copy run start)')}else{cliPrint('out','startup-config is not present');cliPrint('dim','(run: copy running-config startup-config)')}return}
 if(lc==='show clock'){const d=new Date();cliPrint('out','*'+d.toTimeString().split(' ')[0]+'.000 UTC '+d.toDateString());return}
 if(lc==='show users'||lc==='show sessions'){cliPrint('out','    Line       User       Host(s)              Idle       Location');cliPrint('out','*  0 con 0                idle                 00:00:00');return}
 if(lc==='show history'){window._cliHistory.slice(-10).forEach(h=>cliPrint('out','  '+h));return}
 if(lc==='show version'||lc==='sh ver'){cliPrint('out','Cisco IOS XE Software, Version 17.9.1');cliPrint('out',cli.device==='router'?'Cisco ISR 4321/K9 (revision 1.0) with 4096K/1024K bytes of memory':'Cisco Catalyst 2960-24TT (revision 2.0) with 128K bytes of memory');cliPrint('out','');cliPrint('out','System uptime: 1 day, 3 hours, 42 minutes');cliPrint('out','System image: "flash:'+(cli.device==='router'?'isr4300-universalk9.17.09.01.SPA.bin':'c2960-lanbase-mz.152-2.E.bin')+'"');cliPrint('out','Configuration register is 0x2102');cliPrint('out','');if(cli.hostname&&cli.hostname!=='Router'&&cli.hostname!=='Switch')cliPrint('out','System name: '+cli.hostname);return}
 if(lc==='show access-lists'||lc==='show access-list'||lc==='sh access-lists'){const al=cli.accessLists||{};const ea=cli.extAcls||{};if(Object.keys(al).length===0&&Object.keys(ea).length===0){cliPrint('dim','No access lists configured');return}Object.entries(al).forEach(([n,rules])=>{cliPrint('out','Standard IP access list '+n);rules.forEach(r=>cliPrint('out','    '+r.action+' '+r.src+' '+r.wild))});Object.entries(ea).forEach(([n,rules])=>{cliPrint('out','Extended IP access list '+n);rules.forEach((r,i)=>cliPrint('out','    '+(i+1)*10+' '+r.action+' '+r.proto+' '+(r.src||'any')+' '+(r.dst||'any')+(r.portOp?' '+r.portOp+' '+r.port:'')))});return}
 if(lc==='show ip nat translations'||lc==='sh ip nat tr'){cliPrint('out','Pro Inside global         Inside local          Outside local         Outside global');if(cli.natOverload){cliPrint('out','tcp 203.0.113.5:1024      10.1.1.10:50000       8.8.8.8:443           8.8.8.8:443');cliPrint('out','tcp 203.0.113.5:1025      10.1.1.11:50123       93.184.216.34:80      93.184.216.34:80')}else{cliPrint('dim','(no active translations)')}return}
 if(lc==='show ip dhcp pool'||lc==='show ip dhcp binding'){const pools=Object.entries(cli.dhcpPools||{});if(pools.length===0){cliPrint('dim','No DHCP pools configured');return}pools.forEach(([name,p])=>{cliPrint('out','Pool '+name+' :');cliPrint('out','  Utilization mark (high/low) : 100 / 0');cliPrint('out','  Subnet size (first/next)    : 0 / 0');cliPrint('out','  Total addresses             : 254');cliPrint('out','  Leased addresses            : 0');cliPrint('out','  Network                     : '+(p.network||'<none>')+'/'+(p.mask||'?'));cliPrint('out','  Default router              : '+(p.defaultRouter||'<none>'));cliPrint('out','  DNS server                  : '+(p.dnsServer||'<none>'))});return}
 if(lc==='show spanning-tree'||lc==='show spanning-tree vlan 1'||lc==='sh spanning-tree'){cliPrint('out','VLAN0001');cliPrint('out','  Spanning tree enabled protocol '+(cli.stpMode||'ieee'));cliPrint('out','  Root ID    Priority    '+(cli.stpPriority&&cli.stpPriority[1]?(cli.stpPriority[1]+1):32769));cliPrint('out','             Address     0050.5600.0001');cliPrint('out','             This bridge is the root');cliPrint('out','             Hello Time   2 sec  Max Age 20 sec  Forward Delay 15 sec');cliPrint('out','');cliPrint('out','  Interface           Role Sts Cost      Prio.Nbr Type');cliPrint('out','  ------------------- ---- --- --------- -------- --------------------------------');Object.entries(cli.interfaces).forEach(([n,i])=>{if(!i.shutdown){const role=i.portfast?'Desg':'Desg';const sts='FWD';cliPrint('out','  '+n.padEnd(20)+role.padEnd(5)+sts.padEnd(4)+' 19        128.1    P2p'+(i.portfast?' Edge':''))}});return}
 if(lc==='show mac address-table'||lc==='show mac-address-table'||lc==='sh mac'){cliPrint('out','          Mac Address Table');cliPrint('out','-------------------------------------------');cliPrint('out','Vlan    Mac Address       Type        Ports');cliPrint('out','----    -----------       --------    -----');Object.entries(cli.interfaces).forEach(([n,i])=>{if(i.accessVlan){cliPrint('out',String(i.accessVlan).padEnd(8)+'00aa.bb'+n.slice(-3).replace('/','').padStart(2,'0')+'.0'+n.slice(-3).replace('/','').padStart(3,'0')+'    DYNAMIC     '+n.replace('FastEthernet','Fa').replace('GigabitEthernet','Gi'))}});cliPrint('out','Total Mac Addresses for this criterion: '+Object.values(cli.interfaces).filter(i=>i.accessVlan).length);return}
 if(lc==='show arp'||lc==='show ip arp'||lc==='sh arp'){cliPrint('out','Protocol  Address          Age (min)  Hardware Addr   Type   Interface');Object.entries(cli.interfaces).forEach(([n,i])=>{if(i.ip&&!i.shutdown){cliPrint('out','Internet  '+i.ip.padEnd(17)+'-          00aa.bbcc.dd'+n.slice(-1).padStart(2,'0')+'  ARPA   '+n)}});return}
 if(lc==='show ip protocols'||lc==='sh ip proto'){if(cli.ospfProcess){cliPrint('out','Routing Protocol is "ospf '+cli.ospfProcess+'"');cliPrint('out','  Router ID '+(cli.routerId||'auto'));cliPrint('out','  Number of areas: 1');cliPrint('out','  Routing for Networks:');cli.ospfNetworks.forEach(n=>cliPrint('out','    '+n.net+' '+n.wild+' area '+n.area))}else{cliPrint('dim','No routing protocols running')}return}
 if(lc==='erase startup-config'||lc==='write erase'){cliPrint('out','Erasing the nvram filesystem will remove all configuration files!');cliPrint('ok','[OK]');cli.saved=false;return}
 if(lc==='reload'){cliPrint('out','System configuration has '+(cli.saved?'been saved':'NOT been saved'));cliPrint('out','Proceed with reload? [confirm]');cliPrint('sys','(Not simulated — use QUIT to exit lab)');return}
 if(lc==='debug ip packet'||lc.startsWith('debug')){cliPrint('sys','*Mar  1 00:00:01.234: %DEBUG enabled');cliPrint('dim','(debug output suppressed in simulator)');return}
 if(lc.startsWith('clear ')){cliPrint('sys','Clearing '+raw.substring(6));return}
 if(lc.startsWith('no ')){
  // Handle "no" negations
  if(lc==='no shutdown'||lc==='no shut'){if(cli.currentInterface&&cli.interfaces[cli.currentInterface]){cli.interfaces[cli.currentInterface].shutdown=false;cliPrint('sys','%LINEPROTO-5-UPDOWN: Line protocol on Interface '+cli.currentInterface+', changed state to up')}return}
  if(pc[1]==='description'&&cli.mode==='if'&&cli.currentInterface){cli.interfaces[cli.currentInterface].description=null;return}
  if(pc[1]==='ip'&&pc[2]==='address'&&cli.mode==='if'&&cli.currentInterface){cli.interfaces[cli.currentInterface].ip=null;cli.interfaces[cli.currentInterface].mask=null;return}
  if(pc[1]==='switchport'&&pc[2]==='port-security'&&cli.mode==='if'){cli.interfaces[cli.currentInterface].portSec=false;return}
  // fall through to default if nothing matched
 }
 // "do" command in config mode (run EXEC command)
 if(pc[0]==='do'&&parts.length>1&&cli.mode!=='user'&&cli.mode!=='priv'){const savedMode=cli.mode;cli.mode='priv';parseCommand(parts.slice(1).join(' '));cli.mode=savedMode;return}
 return _origParseCommand(raw);
};
function bindCliInput(){
 const ti=document.getElementById('term-input');
 if(!ti||ti._enhanced)return;
 ti._enhanced=true;
 ti.addEventListener('keydown',e=>{
  if(e.key==='Enter'){e.preventDefault();cliSubmit()}
  else if(e.key==='Tab'){e.preventDefault();tabComplete()}
  else if(e.key==='ArrowUp'){e.preventDefault();historyNav('up')}
  else if(e.key==='ArrowDown'){e.preventDefault();historyNav('down')}
  else if(e.ctrlKey&&(e.key==='c'||e.key==='C')){e.preventDefault();ti.value='';cliPrint('dim','^C')}
 });
}
setTimeout(bindCliInput,100);
const _origOpenLab=openLab;
openLab=function(id){_origOpenLab(id);setTimeout(bindCliInput,150)};
const _origOpenSandbox=openSandbox;
openSandbox=function(dev){_origOpenSandbox(dev);setTimeout(bindCliInput,150)};
function cliSubmit(){const inp=document.getElementById('term-input');const line=inp.value.trim();if(!line)return;cliPrintCmd(line);inp.value='';parseCommand(line);checkTasks();updatePrompt()}
function resolveIface(s){const map={'g':'GigabitEthernet','gi':'GigabitEthernet','gig':'GigabitEthernet','gigabitethernet':'GigabitEthernet','f':'FastEthernet','fa':'FastEthernet','fast':'FastEthernet','fastethernet':'FastEthernet','e':'Ethernet','eth':'Ethernet','ethernet':'Ethernet','l':'Loopback','lo':'Loopback','loop':'Loopback','loopback':'Loopback','v':'Vlan','vl':'Vlan','vlan':'Vlan','s':'Serial','se':'Serial','ser':'Serial','serial':'Serial'};const raw=s.trim();const m=raw.match(/^([a-z]+)\s*([\d./]*)$/i);if(!m)return null;const type=map[m[1].toLowerCase()];if(!type)return null;const suffix=m[2];const full=type+suffix;// Auto-create virtual interfaces on first reference
if(!cli.interfaces[full]){if(type==='Loopback'||type==='Vlan'||full.includes('.')){cli.interfaces[full]={ip:null,mask:null,shutdown:false,switchportMode:null,accessVlan:null,allowedVlans:null,portSec:false,portSecMax:null,portSecSticky:false,portSecViol:null,natRole:null,accessGroupIn:null,accessGroupOut:null,encapsulation:null};return full}}return cli.interfaces[full]?full:null}
function parseCommand(raw){
 const line=raw.trim();const lc=line.toLowerCase();const parts=line.split(/\s+/);const pc=parts.map(p=>p.toLowerCase());
 // Help
 if(lc==='?'||lc==='help'){showCliHelp();return}
 if(lc==='hint'){cliHint();return}
 // QUIZ ANSWER · format: Q1A, Q3D, q1a, etc.
 const quizMatch=lc.match(/^q?(\d+)([a-d])$/);
 if(quizMatch&&cli.currentLab){
  const qNum=parseInt(quizMatch[1],10);
  const choice=quizMatch[2].toUpperCase();
  // Find the matching quiz task
  const quizTasks=cli.currentLab.tasks.filter(t=>t.quiz);
  const target=quizTasks.find(t=>t.quiz.num===qNum);
  if(!target){cliPrint('err','% No question Q'+qNum+' in this lab');return}
  // Has the prereq been met (i.e., did the user run the right command first)?
  if(target.prereq&&!target.prereq(cli)){
   cliPrint('err','% Q'+qNum+' is not unlocked yet — complete the prereq command first');
   return;
  }
  // Already answered correctly?
  if(cli.completedTasks.includes(target.id)){cliPrint('dim','Q'+qNum+' already answered correctly. Move on to the next task.');return}
  // Record + check
  cli.labQuizAnswers=cli.labQuizAnswers||{};
  cli.labQuizAnswers['q'+qNum]=choice;
  const correctChoice=String.fromCharCode(65+target.quiz.ans);
  if(choice===correctChoice){
   cliPrint('ok','✓ Q'+qNum+' correct: '+target.quiz.opts[target.quiz.ans]);
  }else{
   cliPrint('err','✗ Q'+qNum+' wrong. You picked '+choice+' ('+target.quiz.opts[choice.charCodeAt(0)-65]+'). Correct: '+correctChoice+' ('+target.quiz.opts[target.quiz.ans]+')');
   cliPrint('dim','  Try again — type Q'+qNum+' followed by A, B, C, or D');
  }
  return;
 }
 if(lc==='relearn'||lc==='learn reset'){teachReset();cliPrint('hi','◆ Learning notes reset. They will show again next time you do those commands.');return}
 if(lc==='quit'||lc==='leave'){showScreen('labs');return}
 if(lc==='next'&&cli.currentLab&&profile.completedLabs[cli.currentLab.id]){nextLab();return}
 if(lc==='exit'&&cli.mode==='user'&&parts.length===1){showScreen('labs');return}
 // Mode transitions
 if((lc==='enable'||lc==='en')&&cli.mode==='user'){cli.mode='priv';teach('enable','<b>MODE JUMP: USER → PRIVILEGED</b><br>Prompt went from <em>'+cli.hostname+'&gt;</em> to <em>'+cli.hostname+'#</em>. That <em>#</em> means you now have admin rights. You can view anything, change anything, reboot the box. In real life this is password-protected.');return}
 if(lc==='disable'&&cli.mode==='priv'){cli.mode='user';return}
 if((lc==='configure terminal'||lc==='conf t'||lc==='config t'||lc==='config terminal')&&cli.mode==='priv'){cli.mode='global';cli.configEntered=true;cliPrint('out','Enter configuration commands, one per line.  End with CNTL/Z.');teach('config','<b>MODE JUMP: PRIV → GLOBAL CONFIG</b><br>Prompt is now <em>'+cli.hostname+'(config)#</em>. You are editing the router running configuration. Anything you type here changes the box immediately, but it only lives in RAM until you save.');return}
 if(lc==='exit'){if(cli.mode==='if'||cli.mode==='vlan'||cli.mode==='line'||cli.mode==='dhcp'||cli.mode==='ext-acl'){cli.mode='global';cli.currentInterface=null;cli.currentVlan=null;cli.currentLine=null;cli.currentLineRange=null;cli.currentDhcpPool=null;cli.currentExtAcl=null;teach('exit','<b>BACKED OUT ONE LEVEL</b> — you are now at <em>(config)#</em>. <em>exit</em> walks up one mode. Use <em>end</em> to jump straight to <em>#</em>.');return}if(cli.mode==='global'){cli.mode='priv';teach('exit','<b>LEFT GLOBAL CONFIG</b> — back at <em>'+cli.hostname+'#</em>. Your changes are still live in RAM. Save with <em>copy run start</em> to keep them.');return}if(cli.mode==='priv'){cli.mode='user';return}}
 if(lc==='end'||lc==='^z'){if(cli.mode!=='user'){cli.mode='priv';cli.currentInterface=null;cli.currentVlan=null;cli.currentLine=null;cli.currentLineRange=null;teach('end','<b>JUMPED STRAIGHT TO PRIV MODE</b> — <em>end</em> exits all config modes at once. Faster than hitting <em>exit</em> three times.')}return}
 // Global config commands
 if(cli.mode==='global'){
  if(pc[0]==='hostname'&&parts[1]){cli.hostname=parts[1];teach('hostname','<b>DEVICE NAMED.</b> Every prompt now shows <em>'+parts[1]+'</em>. In a datacenter with 50 routers, names save lives. Hostname persists even after reboot if you save config.');return}
  if((pc[0]==='enable'&&pc[1]==='secret')&&parts[2]){cli.enableSecret=parts.slice(2).join(' ');teach('enablesecret','<b>PRIVILEGED MODE LOCKED.</b> Next time anyone types <em>enable</em>, they need this password. <em>enable secret</em> stores it encrypted (MD5). Never use <em>enable password</em> — that stores plaintext.');return}
  if((pc[0]==='enable'&&pc[1]==='password')&&parts[2]){cli.enablePassword=parts.slice(2).join(' ');return}
  if((pc[0]==='interface'||pc[0]==='int')&&parts[1]){const joined=parts.slice(1).join('');const f=resolveIface(joined);if(f){cli.currentInterface=f;cli.mode='if';teach('interface','<b>ENTERED INTERFACE CONFIG.</b> Prompt is <em>(config-if)#</em>. Everything you type now only affects <em>'+f+'</em>. Common commands: <em>ip address</em>, <em>no shutdown</em>, <em>switchport</em>, <em>description</em>. Type <em>exit</em> to leave.');return}cliPrint('err','% Invalid interface '+parts.slice(1).join(' '));return}
  if(pc[0]==='vlan'&&parts[1]){const vid=+parts[1];if(vid>=1&&vid<=4094){if(!cli.vlans[vid])cli.vlans[vid]={name:'VLAN'+String(vid).padStart(4,'0')};cli.currentVlan=vid;cli.mode='vlan';teach('vlan','<b>VLAN CREATED.</b> Now at <em>(config-vlan)#</em>. VLAN '+vid+' is a logical broadcast domain. Assign switch ports to it later with <em>switchport access vlan '+vid+'</em>. One switch, multiple isolated networks.');return}cliPrint('err','% Invalid VLAN ID');return}
  if(pc[0]==='line'&&(pc[1]==='console'||pc[1]==='con')){cli.currentLine='console';cli.currentLineRange='console 0';cli.mode='line';teach('line-console','<b>CONSOLE LINE CONFIG.</b> This is the physical RJ45 console port on the back of the router. Whatever you set here affects direct serial cable access.');return}
  if(pc[0]==='line'&&pc[1]==='vty'){
   // Support: line vty 0  |  line vty 0 4  |  line vty 1 4  |  line vty 5 15
   const start=parts[2]!==undefined?+parts[2]:0;
   const end=parts[3]!==undefined?+parts[3]:start;
   if(isNaN(start)||isNaN(end)||start<0||end>15||start>end){cliPrint('err','% Invalid VTY range');return}
   const rangeKey='vty'+start+(end!==start?'_'+end:'');
   if(!cli.vtyRanges[rangeKey])cli.vtyRanges[rangeKey]={start,end,pw:null,login:false,transport:null,loginLocal:false};
   cli.currentLine='vty';cli.currentLineRange=rangeKey;cli.mode='line';
   // Mirror to legacy cli.lines.vty for backward compat with older labs
   teach('line-vty','<b>VTY LINES CONFIG.</b> VTY = Virtual TeleType. Configuring lines '+start+(end!==start?' through '+end:'')+'. Lock them down with <em>password X</em>, <em>login</em>, or <em>transport input ssh</em>.');
   return;
  }
  // BANNER · banner login *text*  |  banner exec *text*  |  banner motd *text*  |  no banner X
  if(pc[0]==='banner'&&['login','exec','motd'].includes(pc[1])){
   const which=pc[1];
   // Get raw text from original line (after "banner login ")
   const re=new RegExp('^banner\\s+'+which+'\\s+(.+)$','i');
   const m=line.match(re);
   if(!m){cliPrint('err','% Banner format: banner '+which+' *text*');return}
   let text=m[1].trim();
   // Strip delimiters: banners use any matching char as start/end (typically * or # or ^)
   if(text.length>=2){
    const first=text[0];const last=text[text.length-1];
    if(first===last&&!/[a-zA-Z0-9 ]/.test(first))text=text.slice(1,-1);
   }
   cli.banners[which]=text;
   teach('banner-'+which,'<b>'+which.toUpperCase()+' BANNER SET.</b> '+(which==='login'?'Shows BEFORE password prompt — typically a legal/security warning.':which==='exec'?'Shows AFTER successful login — daily message of the day.':'Multipurpose banner — shown on most line types.')+' Delimiter (typically <em>*</em> or <em>#</em>) marks start and end of the message text.');
   return;
  }
  if(pc[0]==='no'&&pc[1]==='banner'&&['login','exec','motd'].includes(pc[2])){
   const which=pc[2];cli.banners[which]=null;
   teach('no-banner','<b>'+which.toUpperCase()+' BANNER REMOVED.</b> The <em>no</em> prefix removes a previous configuration. The line is now blank.');
   return;
  }
  // CDP global toggle — cdp run / no cdp run
  if(pc[0]==='cdp'&&pc[1]==='run'){
   cli.cdpRun=true;
   teach('cdp-run','<b>CDP ENABLED ON THE ROUTER.</b> Cisco Discovery Protocol shares device info (hostname, IOS version, IP, capabilities) with neighbors every 60 seconds. Useful for mapping a network. Disabled in security-conscious environments — CDP info is gold for attackers.');
   return;
  }
  if(pc[0]==='no'&&pc[1]==='cdp'&&pc[2]==='run'){
   cli.cdpRun=false;
   teach('no-cdp-run','<b>CDP DISABLED GLOBALLY.</b> The <em>no cdp run</em> command appears in the GLOBAL config section of the running-config (not under any interface). Now <em>show cdp neighbor</em> will report no info — and your router stops broadcasting its identity. Hardening best practice for WAN-facing devices.');
   return;
  }
  // CDP timer — how often advertisements are sent (default 60 sec)
  if(pc[0]==='cdp'&&pc[1]==='timer'&&parts[2]){
   const t=+parts[2];
   if(isNaN(t)||t<5||t>254){cliPrint('err','% Timer must be 5-254 seconds');return}
   cli.cdpTimer=t;
   teach('cdp-timer','<b>CDP ADVERTISEMENT INTERVAL SET TO '+t+' SEC.</b> Default is 60 sec. Lower = neighbors discovered faster after a topology change, but more bandwidth/CPU. Higher = quieter network but stale info. Common tuning value is 90 sec on stable WANs. Pairs with <em>cdp holdtime</em> — holdtime should be 3x timer.');
   return;
  }
  // CDP holdtime — how long to keep an advertisement after receiving it (default 180 sec)
  if(pc[0]==='cdp'&&pc[1]==='holdtime'&&parts[2]){
   const h=+parts[2];
   if(isNaN(h)||h<10||h>255){cliPrint('err','% Holdtime must be 10-255 seconds');return}
   cli.cdpHoldtime=h;
   teach('cdp-holdtime','<b>CDP HOLDTIME SET TO '+h+' SEC.</b> Default is 180 sec (3x the timer). This is how long a neighbor stays in the CDP table after their last advertisement. If holdtime expires before next advertisement, neighbor drops from <em>show cdp neighbor</em>. Best practice: holdtime = 3x timer (so a missed advertisement does not drop a healthy neighbor).');
   return;
  }
  if(pc[0]==='ip'&&pc[1]==='domain-name'&&parts[2]){cli.domainName=parts[2];return}
  if(pc[0]==='crypto'&&pc[1]==='key'&&pc[2]==='generate'&&pc[3]==='rsa'){cli.cryptoKey=true;cliPrint('out','The name for the keys will be: '+cli.hostname+'.'+(cli.domainName||'default'));cliPrint('out','% The key modulus size is 1024 bits');cliPrint('ok','% Generating 1024 bit RSA keys ...[OK]');teach('rsa','<b>SSH KEYS GENERATED.</b> SSH encrypts remote logins (unlike Telnet, which sends passwords in cleartext). These keys prove the router identity to clients. You need <em>hostname</em> + <em>ip domain-name</em> set BEFORE this works.');return}
  if(pc[0]==='username'&&parts[1]){
   // Supports: username X password Y · username X secret Y · username X privilege N password Y · username X privilege N secret Y
   const user=parts[1];const tokens=parts.slice(2);
   let pwIdx=tokens.findIndex(t=>t==='password'||t==='secret');
   if(pwIdx>=0&&tokens[pwIdx+1]){
    cli.users[user]=tokens.slice(pwIdx+1).join(' ');
    teach('username','<b>LOCAL USER ADDED.</b> User "'+user+'" stored in the local user database. Combined with <em>login local</em> on a VTY/console line, this enables per-user authentication. <em>secret</em> stores hashed; <em>password</em> stores plaintext (or Type 7 if service password-encryption is on).');
    return;
   }
   cliPrint('err','% Use: username NAME [privilege N] {password|secret} VALUE');return;
  }
  if(pc[0]==='ip'&&pc[1]==='route'&&parts.length>=5){const ad=parts[5]?+parts[5]:1;cli.routes.push({dest:parts[2],mask:parts[3],nh:parts[4],ad});teach('iproute',parts[2]==='0.0.0.0'?'<b>DEFAULT ROUTE SET.</b> Any packet the router does not have a specific route for now goes to <em>'+parts[4]+'</em>. This is how branch offices send all Internet traffic to the WAN edge.':'<b>STATIC ROUTE ADDED.</b> Manually-configured path: to reach <em>'+parts[2]+'</em>, send to <em>'+parts[4]+'</em>. Static routes have AD=1 (very trusted). Use when dynamic routing is not running.');return}
  if(pc[0]==='router'&&pc[1]==='ospf'&&parts[2]){cli.ospfProcess=+parts[2];cli.mode='if';cli.currentInterface='router-ospf';teach('ospf','<b>OSPF PROCESS STARTED.</b> Now at <em>(config-router)#</em>. Process ID '+parts[2]+' is LOCALLY significant — routers do not need matching process IDs to form neighbors. Advertise networks with <em>network X.X.X.X WILDCARD area 0</em>.');return}
  // v8 · DHCP pool
  if(pc[0]==='ip'&&pc[1]==='dhcp'&&pc[2]==='pool'&&parts[3]){cli.currentDhcpPool=parts[3];if(!cli.dhcpPools[parts[3]])cli.dhcpPools[parts[3]]={};cli.mode='dhcp';return}
  if(pc[0]==='ip'&&pc[1]==='dhcp'&&pc[2]==='excluded-address'&&parts[3]){cli.dhcpExcluded.push({from:parts[3],to:parts[4]||parts[3]});return}
  // DHCP relay · restrict forwarded UDP ports
  if(pc[0]==='no'&&pc[1]==='ip'&&pc[2]==='forward-protocol'&&pc[3]==='udp'&&parts[4]){
   if(!cli.forwardProtocolBlocked)cli.forwardProtocolBlocked=[];
   cli.forwardProtocolBlocked.push(+parts[4]);
   teach('no-forward','<b>UDP PORT '+parts[4]+' NO LONGER RELAYED.</b> By default, <em>ip helper-address</em> forwards 8 UDP services (67 DHCP, 53 DNS, 69 TFTP, 137 NetBIOS NS, 138 NetBIOS DS, 49 TACACS, 42 TIME, 123 NTP). <em>no ip forward-protocol udp '+parts[4]+'</em> stops one of them from being forwarded — usually to silence NetBIOS noise.');
   return;
  }
  // v8 · Simple numbered ACL
  if(pc[0]==='access-list'&&parts[1]&&(pc[2]==='permit'||pc[2]==='deny')){const n=+parts[1];if(!cli.accessLists[n])cli.accessLists[n]=[];cli.accessLists[n].push({action:pc[2],src:parts[3],wild:parts[4]||'0.0.0.0'});return}
  // v8 · NAT config
  if(pc[0]==='ip'&&pc[1]==='nat'&&pc[2]==='inside'&&pc[3]==='source'&&pc[4]==='list'&&parts[5]){cli.natInsideList=+parts[5];if(pc[6]==='interface'&&parts[7]){cli.natOverloadIface=parts[7];cli.natOverload=pc[8]==='overload'}return}
  // v8 · Extended ACL (named)
  if(pc[0]==='ip'&&pc[1]==='access-list'&&pc[2]==='extended'&&parts[3]){cli.currentExtAcl=parts[3];if(!cli.extAcls[parts[3]])cli.extAcls[parts[3]]=[];cli.mode='ext-acl';return}
  // v8 · STP priority + mode
  if(pc[0]==='spanning-tree'&&pc[1]==='vlan'&&parts[2]&&pc[3]==='priority'&&parts[4]){const vid=+parts[2];cli.stpPriority[vid]=+parts[4];return}
  if(pc[0]==='spanning-tree'&&pc[1]==='mode'&&parts[2]){cli.stpMode=parts[2];return}
  return cliPrint('err','% Invalid input detected. Type ? for help.')
 }
 // OSPF router config (reuse if mode with special flag)
 if(cli.mode==='if'&&cli.currentInterface==='router-ospf'){
  if(pc[0]==='network'&&parts.length>=5){cli.ospfNetworks.push({net:parts[1],wild:parts[2],area:+parts[4]});return}
  if(lc==='exit'){cli.mode='global';cli.currentInterface=null;return}
  return cliPrint('err','% Invalid input detected.')
 }
 // Interface config
 if(cli.mode==='if'){
  // Auto-exit if user types another interface or a top-level global command
  if(pc[0]==='interface'||pc[0]==='int'){cli.mode='global';cli.currentInterface=null;return parseCommand(line)}
  if(pc[0]==='vlan'&&parts[1]&&!isNaN(+parts[1])){cli.mode='global';cli.currentInterface=null;return parseCommand(line)}
  if(pc[0]==='hostname'||pc[0]==='line'||pc[0]==='router'||pc[0]==='username'||pc[0]==='banner'){cli.mode='global';cli.currentInterface=null;return parseCommand(line)}
  const i=cli.interfaces[cli.currentInterface];
  // CDP per-interface toggle — cdp enable / no cdp enable
  if(pc[0]==='cdp'&&pc[1]==='enable'){
   if(!cli.cdpInterfaces)cli.cdpInterfaces={};
   cli.cdpInterfaces[cli.currentInterface]=true;
   teach('cdp-enable-if','<b>CDP RE-ENABLED ON THIS INTERFACE.</b> Re-allows CDP packets on '+cli.currentInterface+'. CDP advertisements go out every 60 sec listing this device hostname, IOS, IP, capabilities — useful for the next-hop router/switch.');
   return;
  }
  if(pc[0]==='no'&&pc[1]==='cdp'&&pc[2]==='enable'){
   if(!cli.cdpInterfaces)cli.cdpInterfaces={};
   cli.cdpInterfaces[cli.currentInterface]=false;
   teach('no-cdp-enable-if','<b>CDP DISABLED ON THIS INTERFACE.</b> The <em>no cdp enable</em> command appears under the INTERFACE section of running-config (versus <em>no cdp run</em> which appears in global config). After this, you stop hearing CDP from anyone connected to '+cli.currentInterface+' — and they stop hearing you.');
   return;
  }
  if(pc[0]==='no'&&(pc[1]==='shutdown'||pc[1]==='shut')){i.shutdown=false;cliPrint('sys','%LINEPROTO-5-UPDOWN: Line protocol on Interface '+cli.currentInterface+', changed state to up');teach('noshut','<b>INTERFACE IS UP.</b> That <em>%LINEPROTO-5-UPDOWN</em> message is the router telling you the port is now passing traffic. All Cisco router interfaces ship <em>administratively down</em> — you always have to turn them on with <em>no shutdown</em>. Switches are the opposite — ports are on by default.');return}
  if(pc[0]==='shutdown'||pc[0]==='shut'){i.shutdown=true;cliPrint('sys','%LINK-5-CHANGED: Interface '+cli.currentInterface+', changed state to administratively down');return}
  if(pc[0]==='ip'&&pc[1]==='address'&&parts[2]&&parts[3]){i.ip=parts[2];i.mask=parts[3];teach('ipaddr','<b>LAYER 3 ADDRESS ASSIGNED.</b> Interface '+cli.currentInterface+' now speaks IP on <em>'+parts[2]+'/'+maskToBits(parts[3])+'</em>. The mask tells the router which bits are network vs host. Still need <em>no shutdown</em> to bring it online.');return}
  if(pc[0]==='switchport'&&pc[1]==='mode'&&(pc[2]==='access'||pc[2]==='trunk')){i.switchportMode=pc[2];teach('sw-mode-'+pc[2],'<b>PORT MODE: '+pc[2].toUpperCase()+'.</b> '+(pc[2]==='access'?'Access ports carry ONE VLAN untagged. Use on user-facing ports — PCs, phones, printers. One port, one VLAN.':'Trunk ports carry MULTIPLE VLANs, each tagged with 802.1Q. Use between switches or to a router doing inter-VLAN routing.'));return}
  if(pc[0]==='switchport'&&pc[1]==='access'&&pc[2]==='vlan'&&parts[3]){i.accessVlan=+parts[3];teach('access-vlan','<b>PORT ASSIGNED TO VLAN '+parts[3]+'.</b> Any device plugging into this port lands in VLAN '+parts[3]+'. They can only talk to other devices in the same VLAN unless a router/L3 switch routes between VLANs.');return}
  if(pc[0]==='switchport'&&pc[1]==='trunk'&&pc[2]==='allowed'&&pc[3]==='vlan'&&parts[4]){i.allowedVlans=parts[4];teach('trunk-allowed','<b>TRUNK ALLOWED VLANS SET.</b> This trunk will ONLY carry these VLAN tags — others get dropped. Default is all VLANs allowed (1-4094). Restricting is a security + performance win.');return}
  if(pc[0]==='switchport'&&pc[1]==='port-security'&&parts.length===2){i.portSec=true;teach('portsec','<b>PORT SECURITY ENABLED.</b> This switch port will now remember which MAC address first plugs in and reject others. Default: max 1 MAC, violation = shutdown. Great for access-layer switches where someone should not be adding their own switch.');return}
  if(pc[0]==='switchport'&&pc[1]==='port-security'&&pc[2]==='maximum'&&parts[3]){i.portSecMax=+parts[3];return}
  if(pc[0]==='switchport'&&pc[1]==='port-security'&&pc[2]==='mac-address'&&pc[3]==='sticky'){i.portSecSticky=true;return}
  if(pc[0]==='switchport'&&pc[1]==='port-security'&&pc[2]==='violation'&&parts[3]){i.portSecViol=parts[3];return}
  if(pc[0]==='description'){i.description=parts.slice(1).join(' ');return}
  if(pc[0]==='encapsulation'&&pc[1]==='dot1q'&&parts[2]){i.encapsulation='dot1Q '+parts[2];return}
  if(pc[0]==='duplex'){i.duplex=pc[1];return}
  if(pc[0]==='speed'){i.speed=pc[1];return}
  if(pc[0]==='mtu'){i.mtu=+parts[1];return}
  if(pc[0]==='bandwidth'){i.bandwidth=+parts[1];return}
  if(pc[0]==='channel-group'){i.channelGroup=parts[1]+' '+(parts[2]||'');return}
  // v8 · NAT inside/outside on interface
  if(pc[0]==='ip'&&pc[1]==='nat'&&(pc[2]==='inside'||pc[2]==='outside')){i.natRole=pc[2];return}
  // v8 · access-group (apply ACL to iface)
  if(pc[0]==='ip'&&pc[1]==='access-group'&&parts[2]&&(pc[3]==='in'||pc[3]==='out')){if(pc[3]==='in')i.accessGroupIn=parts[2];else i.accessGroupOut=parts[2];return}
  // DHCP relay agent — ip helper-address
  if(pc[0]==='ip'&&pc[1]==='helper-address'&&parts[2]){
   if(!i.helperAddresses)i.helperAddresses=[];
   i.helperAddresses.push(parts[2]);
   teach('helper','<b>DHCP RELAY ENABLED.</b> When clients on '+cli.currentInterface+' broadcast a DHCPDISCOVER, this router catches it and forwards it as a unicast to <em>'+parts[2]+'</em>. Without this, DHCP broadcasts die at the router and clients on other subnets never get IPs. <em>ip helper-address</em> also forwards 7 other UDP ports by default (TFTP, DNS, NTP, NetBIOS NS/DS, TIME, TACACS) — restrict the unwanted ones with <em>no ip forward-protocol udp [port]</em>.');
   return;
  }
  // v8 · STP interface commands
  if(pc[0]==='spanning-tree'&&pc[1]==='portfast'){i.portfast=true;return}
  if(pc[0]==='spanning-tree'&&pc[1]==='bpduguard'&&pc[2]==='enable'){i.bpduGuard=true;return}
  return cliPrint('err','% Invalid input. Type ? for help.')
 }
 // v8 · DHCP pool mode
 if(cli.mode==='dhcp'){
  const p=cli.dhcpPools[cli.currentDhcpPool];
  if(pc[0]==='network'&&parts[1]&&parts[2]){p.network=parts[1];p.mask=parts[2];return}
  if(pc[0]==='default-router'&&parts[1]){p.defaultRouter=parts[1];return}
  if(pc[0]==='dns-server'&&parts[1]){p.dnsServer=parts[1];return}
  if(pc[0]==='domain-name'&&parts[1]){p.domainName=parts[1];return}
  if(pc[0]==='lease'&&parts[1]){p.lease=parts.slice(1).join(' ');return}
  // Static reservation pattern (used with client-identifier)
  if(pc[0]==='host'&&parts[1]){p.host=parts[1];p.hostMask=parts[2]||null;return}
  if(pc[0]==='client-identifier'&&parts[1]){p.clientId=parts[1];return}
  if(pc[0]==='hardware-address'&&parts[1]){p.hardwareAddress=parts[1];return}
  return cliPrint('err','% Invalid input in DHCP pool mode.')
 }
 // v8 · Extended ACL mode (named)
 if(cli.mode==='ext-acl'){
  const ra=cli.extAcls[cli.currentExtAcl];
  if(pc[0]==='permit'||pc[0]==='deny'){ra.push({action:pc[0],proto:pc[1]||'ip',src:parts[2]||'any',dst:parts[3]||'any',portOp:pc[4]||null,port:parts[5]||null,raw:parts.join(' ')});return}
  return cliPrint('err','% Invalid input in ACL mode.')
 }
 // VLAN config
 if(cli.mode==='vlan'){
  // Auto-exit if a global config command is typed (real IOS behavior)
  if(pc[0]==='vlan'&&parts[1]&&!isNaN(+parts[1])){cli.mode='global';cli.currentVlan=null;return parseCommand(line)}
  if(pc[0]==='interface'||pc[0]==='int'){cli.mode='global';cli.currentVlan=null;return parseCommand(line)}
  if(pc[0]==='hostname'||pc[0]==='ip'||pc[0]==='line'||pc[0]==='router'||pc[0]==='username'||pc[0]==='banner'||pc[0]==='cdp'){cli.mode='global';cli.currentVlan=null;return parseCommand(line)}
  if(pc[0]==='name'&&parts[1]){cli.vlans[cli.currentVlan].name=parts[1];return}
  return cliPrint('err','% Invalid input.')
 }
 // Line config
 if(cli.mode==='line'){
  // Allow direct switch to another config context (real IOS auto-exits line mode)
  if(pc[0]==='line'&&(pc[1]==='console'||pc[1]==='con'||pc[1]==='vty')){cli.mode='global';return parseCommand(line)}
  if(pc[0]==='interface'||pc[0]==='int'){cli.mode='global';cli.currentLine=null;cli.currentLineRange=null;return parseCommand(line)}
  if(pc[0]==='vlan'&&parts[1]&&!isNaN(+parts[1])){cli.mode='global';cli.currentLine=null;cli.currentLineRange=null;return parseCommand(line)}
  if(pc[0]==='hostname'||pc[0]==='ip'||pc[0]==='router'||pc[0]==='username'||pc[0]==='banner'||pc[0]==='enable'){cli.mode='global';cli.currentLine=null;cli.currentLineRange=null;return parseCommand(line)}
  // Write target: legacy lines{} for console + generic vty, AND vtyRanges{} for specific vty ranges
  const legacyL=cli.lines[cli.currentLine];
  const rangeL=cli.currentLineRange&&cli.vtyRanges[cli.currentLineRange]?cli.vtyRanges[cli.currentLineRange]:null;
  const writeAll=(field,val)=>{
   if(legacyL)legacyL[field]=val;
   if(rangeL)rangeL[field]=val;
  };
  if(pc[0]==='password'&&parts[1]){const pw=parts.slice(1).join(' ');writeAll('pw',pw);teach('line-password','<b>LINE PASSWORD SET.</b> The <em>password</em> command stores the password in the line config. To actually require it on login, you also need <em>login</em>. Without <em>login</em>, the password is configured but not enforced.');return}
  if(pc[0]==='login'&&parts.length===1){writeAll('login',true);teach('line-login','<b>LOGIN ENFORCEMENT ON.</b> Now the device will prompt for the password you set. Without this command, login is allowed without prompting.');return}
  if(pc[0]==='login'&&pc[1]==='local'){writeAll('loginLocal',true);teach('login-local','<b>LOGIN AGAINST LOCAL USER DB.</b> <em>login local</em> uses the <em>username X password Y</em> entries you configured. Modern best practice — every admin gets their own account.');return}
  if(pc[0]==='no'&&pc[1]==='login'){writeAll('login',false);writeAll('loginLocal',false);teach('no-login','<b>LOGIN DISABLED.</b> Used to lock out a line entirely (e.g. <em>vty 5 15</em> to refuse extra remote logins). With <em>login</em> set but no password, IOS silently rejects all logins on that line.');return}
  if(pc[0]==='transport'&&pc[1]==='input'&&parts[2]){writeAll('transport',parts[2]);teach('transport','<b>VTY LOCKED TO '+parts[2].toUpperCase()+'.</b> '+(parts[2]==='ssh'?'Only SSH logins accepted. Telnet is now refused — this is what you want. Telnet sends everything in plaintext.':parts[2]==='telnet'?'Only Telnet — INSECURE. Do not use in production.':'Multiple protocols allowed.'));return}
  return cliPrint('err','% Invalid input.')
 }
 // Priv/user show commands
 if((lc==='show running-config'||lc==='show run'||lc==='sh run')&&cli.mode==='priv'){showRunning();return}
 // CDP show commands
 if(lc==='show cdp neighbor'||lc==='show cdp neighbors'||lc==='sh cdp nei'||lc==='sh cdp neighbor'||lc==='sh cdp neighbors'){showCdpNeighbor(false);return}
 if(lc==='show cdp neighbors detail'||lc==='show cdp neighbor detail'||lc==='sh cdp nei detail'||lc==='sh cdp neighbors detail'){showCdpNeighbor(true);return}
 if((lc==='show ip interface brief'||lc==='show ip int brief'||lc==='sh ip int br'||lc==='show ip int br')){cli.ranShowIntBrief=true;showIntBrief();return}
 if(lc==='show vlan brief'||lc==='sh vlan brief'||lc==='sh vlan'){cli.ranShowVlan=true;showVlanBrief();return}
 if(lc==='show ip route'||lc==='sh ip route'||lc==='sh ip ro'){cli.ranShowRoute=true;showIpRoute();return}
 if(lc==='show version'||lc==='sh ver'){showVersion();return}
 if(lc.startsWith('show interfaces')||lc.startsWith('sh int')){showInterfaces(parts.slice(lc.startsWith('sh')?2:2).join(' '));return}
 if(lc.startsWith('ping ')){cliPrint('out','Sending 5, 100-byte ICMP Echos to '+parts[1]+', timeout is 2 seconds:');cliPrint('out','!!!!!');cliPrint('out','Success rate is 100 percent (5/5), round-trip min/avg/max = 1/2/4 ms');return}
 if((lc==='copy running-config startup-config'||lc==='write mem'||lc==='wr'||lc==='copy run start')&&cli.mode==='priv'){cli.saved=true;cliPrint('out','Destination filename [startup-config]?');cliPrint('ok','Building configuration...');cliPrint('ok','[OK]');teach('save','<b>CONFIG SAVED TO FLASH.</b> Huge moment. Cisco routers have TWO configs:<br>• <em>running-config</em> — lives in RAM, lost on reboot<br>• <em>startup-config</em> — in flash, loads on boot<br>You just copied one to the other. Without this, your hostname, passwords, everything resets on power loss. Always save after changes.');return}
 // Smart "wrong mode" detection — guide users to the right place
 const ifaceCmds=['interface','int','ip','no','description','encapsulation','switchport','duplex','speed','spanning-tree','channel-group'];
 const globalCmds=['hostname','enable','vlan','line','router','username','access-list','crypto','spanning-tree','interface','int','ip','service','banner'];
 const privCmds=['configure','copy','show','reload','erase','clear','debug','wr','write','ssh','telnet'];
 if(cli.mode==='user'&&(globalCmds.includes(pc[0])||ifaceCmds.includes(pc[0])||privCmds.includes(pc[0])||pc[0]==='conf'||pc[0]==='conft')){
  cliPrint('err','% Command not available in user mode.');
  cliPrint('hi','▸ You need privileged mode first. Type: enable');
  return;
 }
 if(cli.mode==='priv'&&(globalCmds.includes(pc[0])||ifaceCmds.includes(pc[0]))&&pc[0]!=='show'&&pc[0]!=='copy'&&pc[0]!=='ip'){
  // ip on its own in priv could be 'show ip ...' shorthand attempt — let it fall through normally
  if(pc[0]==='int'||pc[0]==='interface'||pc[0]==='hostname'||pc[0]==='vlan'||pc[0]==='line'||pc[0]==='router'||pc[0]==='username'||pc[0]==='no'){
   cliPrint('err','% Command needs global config mode.');
   cliPrint('hi','▸ Type: configure terminal  (or: conf t)');
   return;
  }
 }
 if(cli.mode==='global'&&(pc[0]==='ip'&&pc[1]==='address'||pc[0]==='no'&&pc[1]==='shutdown'||pc[0]==='switchport'||pc[0]==='shutdown')){
  cliPrint('err','% Command needs interface mode.');
  cliPrint('hi','▸ Enter an interface first. Type: interface g0/0  (or: int g0/0)');
  return;
 }
 if((cli.mode==='vlan'||cli.mode==='line'||cli.mode==='dhcp'||cli.mode==='ext-acl'||cli.mode==='router')&&(pc[0]==='interface'||pc[0]==='int'||pc[0]==='hostname'||pc[0]==='router'||pc[0]==='vlan'||pc[0]==='line'||pc[0]==='username'||pc[0]==='ip'&&pc[1]==='route')){
  cliPrint('err','% Command not available in '+cli.mode+' config mode.');
  cliPrint('hi','▸ Back out one level first. Type: exit');
  cliPrint('dim','  (then you will be at (config)# and can type your command)');
  return;
 }
 cliPrint('err','% Invalid input detected. Type ? for help.')
}
function showCliHelp(){const helps={user:'enable  - Enter priv mode\nping    - Test reachability\nshow    - Display info\nquit    - Leave lab',priv:'configure terminal  - Enter global config\nshow running-config - View config\nshow ip int brief   - Interface status\nshow vlan brief     - VLAN table\nshow ip route       - Routing table\ncopy run start      - Save config\ndisable             - To user mode\nquit                - Leave lab',global:'hostname NAME\ninterface IFACE\nvlan ID\nline console 0 | line vty 0 4\nenable secret PASS\nip domain-name NAME\ncrypto key generate rsa\nusername X password Y\nip route DEST MASK NEXTHOP\nrouter ospf ID\nip dhcp pool NAME\nip dhcp excluded-address A B\naccess-list N permit|deny SRC WILDCARD\nip access-list extended NAME\nip nat inside source list N interface X overload\nspanning-tree vlan N priority N\nexit',if:'ip address IP MASK\nno shutdown / shutdown\nswitchport mode access|trunk\nswitchport access vlan N\nswitchport trunk allowed vlan LIST\nswitchport port-security [maximum N|mac-address sticky|violation MODE]\nip nat inside | ip nat outside\nip access-group NAME in|out\nspanning-tree portfast\nspanning-tree bpduguard enable\ndescription TEXT\nexit',vlan:'name NAME\nexit',line:'password PASS\nlogin | login local\ntransport input ssh|telnet|all\nexit',dhcp:'network NET MASK\ndefault-router IP\ndns-server IP\ndomain-name NAME\nlease DAYS HOURS MINUTES\nexit','ext-acl':'permit|deny PROTO SRC DST [eq PORT]\nexample: deny tcp any any eq 23\nexample: permit ip any any\nexit'};cliPrint('hi','◆ Available commands (type part of command + Tab in real IOS):');cliPrint('out',helps[cli.mode]||'exit')}
function showRunning(){
 cliPrint('out','Building configuration...');cliPrint('out','');cliPrint('out','!');
 cliPrint('out','hostname '+cli.hostname);
 if(cli.enableSecret)cliPrint('out','enable secret '+cli.enableSecret);
 if(cli.domainName)cliPrint('out','ip domain-name '+cli.domainName);
 // Global CDP toggle in global section
 if(cli.cdpRun===false)cliPrint('out','no cdp run');
 if(cli.cdpTimer&&cli.cdpTimer!==60)cliPrint('out','cdp timer '+cli.cdpTimer);
 if(cli.cdpHoldtime&&cli.cdpHoldtime!==180)cliPrint('out','cdp holdtime '+cli.cdpHoldtime);
 // Banners in global section
 if(cli.banners){
  if(cli.banners.login){cliPrint('out','banner login ^C'+cli.banners.login+'^C')}
  if(cli.banners.exec){cliPrint('out','banner exec ^C'+cli.banners.exec+'^C')}
  if(cli.banners.motd){cliPrint('out','banner motd ^C'+cli.banners.motd+'^C')}
 }
 Object.entries(cli.users).forEach(([u,p])=>cliPrint('out','username '+u+' password '+p));
 Object.entries(cli.vlans).forEach(([id,v])=>{if(+id!==1){cliPrint('out','!');cliPrint('out','vlan '+id);cliPrint('out',' name '+v.name)}});
 Object.entries(cli.interfaces).forEach(([n,i])=>{
  const cdpOff=cli.cdpInterfaces&&cli.cdpInterfaces[n]===false;
  if(i.ip||i.switchportMode||i.portSec||cdpOff){
   cliPrint('out','!');
   cliPrint('out','interface '+n);
   if(i.ip)cliPrint('out',' ip address '+i.ip+' '+i.mask);
   if(i.switchportMode)cliPrint('out',' switchport mode '+i.switchportMode);
   if(i.accessVlan)cliPrint('out',' switchport access vlan '+i.accessVlan);
   if(i.allowedVlans)cliPrint('out',' switchport trunk allowed vlan '+i.allowedVlans);
   if(i.portSec)cliPrint('out',' switchport port-security');
   if(i.portSecMax)cliPrint('out',' switchport port-security maximum '+i.portSecMax);
   if(i.portSecSticky)cliPrint('out',' switchport port-security mac-address sticky');
   if(i.portSecViol)cliPrint('out',' switchport port-security violation '+i.portSecViol);
   if(cdpOff)cliPrint('out',' no cdp enable');
   cliPrint('out',i.shutdown?' shutdown':' no shutdown');
  }
 });
 cli.routes.forEach(r=>cliPrint('out','ip route '+r.dest+' '+r.mask+' '+r.nh));
 if(cli.ospfProcess){cliPrint('out','!');cliPrint('out','router ospf '+cli.ospfProcess);cli.ospfNetworks.forEach(n=>cliPrint('out',' network '+n.net+' '+n.wild+' area '+n.area))}
 // Line config block
 if(cli.lines.console.pw||cli.lines.console.login){cliPrint('out','!');cliPrint('out','line con 0');if(cli.lines.console.pw)cliPrint('out',' password '+cli.lines.console.pw);if(cli.lines.console.login)cliPrint('out',' login')}
 if(cli.vtyRanges&&Object.keys(cli.vtyRanges).length>0){
  Object.values(cli.vtyRanges).forEach(r=>{
   cliPrint('out','!');
   cliPrint('out','line vty '+r.start+(r.end!==r.start?' '+r.end:''));
   if(r.pw)cliPrint('out',' password '+r.pw);
   if(r.login)cliPrint('out',' login');
   if(r.transport)cliPrint('out',' transport input '+r.transport);
  });
 }
 cliPrint('out','!');cliPrint('out','end');
}
function showCdpNeighbor(detail){
 // Mark that user has run a CDP show command at least once
 cli._cdpShownOnce=true;
 // Honor global toggle: if cdp run is off entirely, no info shown
 if(cli.cdpRun===false){
  cliPrint('out','% CDP is not enabled');
  if(cli.currentLab&&cli.currentLab.id==='lab_cdp_sfo')cli.cdpQueriesAfterDisableGlobal=(cli.cdpQueriesAfterDisableGlobal||0)+1;
  return;
 }
 // Filter neighbors: skip those whose local interface has CDP disabled
 const visible=(cli.cdpNeighbors||[]).filter(n=>{
  if(cli.cdpInterfaces&&cli.cdpInterfaces[n.localIntf]===false)return false;
  return true;
 });
 if(cli.currentLab&&cli.currentLab.id==='lab_cdp_sfo'){
  if(cli.cdpInterfaces&&cli.cdpInterfaces['Serial0/1/0']===false)cli.cdpQueriesAfterDisableIface=(cli.cdpQueriesAfterDisableIface||0)+1;
 }
 if(!detail){
  cliPrint('out','Capability Codes: R - Router, T - Trans Bridge, B - Source Route Bridge');
  cliPrint('out','                  S - Switch, H - Host, I - IGMP, r - Repeater');
  cliPrint('out','');
  cliPrint('out','Device ID    Local Intrfce   Holdtme    Capability  Platform   Port ID');
  visible.forEach(n=>{
   cliPrint('out',n.deviceId.padEnd(13)+n.localIntfShort.padEnd(16)+String(n.holdtime).padEnd(11)+n.capability.padEnd(12)+n.platform.padEnd(11)+n.portIdShort);
  });
  if(visible.length===0)cliPrint('out','(no neighbors found)');
 }else{
  visible.forEach((n,i)=>{
   if(i>0)cliPrint('out','');
   cliPrint('out','-------------------------');
   cliPrint('out','Device ID: '+n.deviceId);
   cliPrint('out','Entry address(es):');
   cliPrint('out','  IP address: '+n.ipAddress);
   cliPrint('out','Platform: '+n.platform+',  Capabilities: '+n.capability);
   cliPrint('out','Interface: '+n.localIntf+',  Port ID (outgoing port): '+n.portId);
   cliPrint('out','Holdtime : '+n.holdtime+' sec');
   cliPrint('out','');
   cliPrint('out','Version :');
   cliPrint('out','  '+n.version);
   cliPrint('out','');
   cliPrint('out','advertisement version: 2');
  });
  if(visible.length===0)cliPrint('out','(no neighbors found)');
 }
}
function showIntBrief(){cliPrint('out','Interface                  IP-Address      OK? Method Status                Protocol');Object.entries(cli.interfaces).forEach(([n,i])=>{const ip=(i.ip||'unassigned').padEnd(16);const name=n.padEnd(26);const status=i.shutdown?'administratively down':'up';const proto=i.shutdown?'down':(i.ip||cli.device==='switch'?'up':'down');cliPrint('out',name+ip+'YES manual '+status.padEnd(22)+proto)})}
function showVlanBrief(){cliPrint('out','VLAN Name                             Status    Ports');cliPrint('out','---- -------------------------------- --------- -------------------------------');Object.entries(cli.vlans).forEach(([id,v])=>{const ports=Object.entries(cli.interfaces).filter(([n,i])=>i.accessVlan===+id).map(([n])=>n.replace('FastEthernet','Fa').replace('GigabitEthernet','Gi')).join(', ')||(id==='1'?'Fa0/2, Fa0/3, Fa0/4':'');cliPrint('out',id.padEnd(5)+v.name.padEnd(33)+'active    '+ports)})}
function showIpRoute(){cliPrint('out','Codes: L - local, C - connected, S - static, R - RIP, O - OSPF');cliPrint('out','       * - candidate default');cliPrint('out','');if(cli.routes.length===0&&Object.values(cli.interfaces).every(i=>!i.ip||i.shutdown)){cliPrint('out','Gateway of last resort is not set');return}Object.entries(cli.interfaces).forEach(([n,i])=>{if(i.ip&&!i.shutdown){const net=parseCIDR(i.ip+'/24');if(net)cliPrint('out','C    '+net.network+'/24 is directly connected, '+n)}});cli.routes.forEach(r=>{if(r.dest==='0.0.0.0'){cliPrint('out','S*   0.0.0.0/0 [1/0] via '+r.nh)}else{cliPrint('out','S    '+r.dest+'/24 [1/0] via '+r.nh)}})}
function showVersion(){cliPrint('out','Cisco IOS XE Software, Version 17.9.1');cliPrint('out',cli.device==='router'?'Cisco ISR 4321 (revision 1.0)':'Cisco Catalyst 2960-24TT');cliPrint('out','Uptime: 1 day, 3 hours, 42 minutes');cliPrint('out','System image file: "flash:isr4300-universalk9.17.09.01.SPA.bin"');cliPrint('out','Configuration register is 0x2102')}
function showInterfaces(f){const ifName=f?resolveIface(f.trim()):null;const targets=ifName?[ifName]:Object.keys(cli.interfaces);targets.forEach(n=>{const i=cli.interfaces[n];cliPrint('out',n+' is '+(i.shutdown?'administratively down':'up')+', line protocol is '+(i.shutdown?'down':'up'));cliPrint('out','  Hardware is '+(n.startsWith('Gig')?'iGbE':'iFE')+', address is 00aa.bbcc.dd'+(n.slice(-1)));if(i.ip)cliPrint('out','  Internet address is '+i.ip+'/'+maskToBits(i.mask));cliPrint('out','  MTU 1500 bytes, BW '+(n.startsWith('Gig')?'1000000':'100000')+' Kbit/sec');cliPrint('out','')})}
function maskToBits(m){if(!m)return '?';return m.split('.').map(o=>(+o).toString(2).replace(/0/g,'').length).reduce((a,b)=>a+b,0)}

function openSandbox(dev){cli=newCliState(dev);cli.isSandbox=true;cli.currentLab=null;document.getElementById('cli-lab-title').textContent='SANDBOX · '+dev.toUpperCase();document.getElementById('cli-lab-dev').textContent=dev==='router'?'ISR 4321 · NO TASKS':'Catalyst 2960 · NO TASKS';const term=document.getElementById('term');term.innerHTML='';cliPrint('sys','━━━ PACKETKILL SANDBOX · '+dev.toUpperCase()+' ━━━');cliPrint('hi','FREE-PLAY MODE · NO TASKS · NO XP');cliPrint('out','');cliPrint('out','Full Cisco IOS emulation. Play with every command.');cliPrint('out','Type ? for help. Type quit to leave.');cliPrint('out','');cliPrint('dim','Hint: try enable, conf t, int g0/0, ip address, no shut');cliPrint('out','');document.getElementById('task-strip').innerHTML='<div class="tstr-lbl">SANDBOX · FREE PLAY · NO TASKS</div>';updatePrompt();hideLabActionBar();showScreen('cli');setTimeout(()=>document.getElementById('term-input').focus(),100)}
let currentPC=0;
function toBin8(n){return n.toString(2).padStart(8,'0')}
function ipToBin(ip){return ip.split('.').map(o=>toBin8(+o)).join('.')}
function maskFromCidr(cidr){const bits='1'.repeat(cidr)+'0'.repeat(32-cidr);return [bits.substr(0,8),bits.substr(8,8),bits.substr(16,8),bits.substr(24,8)].map(b=>parseInt(b,2)).join('.')}
function binaryViz(ip,cidr,opts){
 opts=opts||{};
 const mask=maskFromCidr(cidr);
 const ipB=ipToBin(ip).split('.');
 const mB=ipToBin(mask).split('.');
 // Network = AND
 const netParts=ip.split('.').map((o,i)=>(+o)&parseInt(mB[i],2));
 const netB=netParts.map(toBin8);
 // Highlight network bits (where mask bit = 1) in gold, host bits in dim
 function colorBits(bits,prefix){
  let html='';let count=0;
  for(let i=0;i<bits.length;i++){
   for(let j=0;j<bits[i].length;j++){
    const isNet=count<prefix;
    html+='<span style="color:'+(isNet?'#E8B84B':'#666')+';font-weight:'+(isNet?'700':'400')+'">'+bits[i][j]+'</span>';
    count++;
   }
   if(i<3)html+='<span style="color:#444">.</span>';
  }
  return html;
 }
 let h='<div style="background:#000;border:1px solid #2a2a2a;border-radius:6px;padding:13px;margin:11px 0;font-family:JetBrains Mono;font-size:11px;line-height:1.7;overflow-x:auto"><div style="font-size:9.5px;color:#999;letter-spacing:0.2em;margin-bottom:9px">◆ BINARY BREAKDOWN · '+ip+'/'+cidr+'</div>';
 h+='<div style="display:grid;grid-template-columns:auto 1fr;gap:7px 14px"><div style="color:#888">IP</div><div>'+colorBits(ipB,32)+' <span style="color:#666;font-size:10px">('+ip+')</span></div>';
 h+='<div style="color:#888">MASK</div><div>'+colorBits(mB,cidr)+' <span style="color:#666;font-size:10px">('+mask+' = /'+cidr+')</span></div>';
 h+='<div style="color:#888">NET</div><div>'+colorBits(netB,cidr)+' <span style="color:#E8B84B;font-size:10px">('+netParts.join('.')+')</span></div></div>';
 h+='<div style="margin-top:11px;padding-top:9px;border-top:1px dashed #333;font-size:10.5px;color:#999;line-height:1.5"><span style="color:#E8B84B;font-weight:700">█ network bits</span> · <span style="color:#666">█ host bits</span> · prefix <b style="color:#fff">/'+cidr+'</b></div></div>';
 return h;
}
function blockViz(cidr,fourthOctet){
 const mask=maskFromCidr(cidr);
 const lastM=+mask.split('.')[3];
 if(cidr<=24){return '<div style="background:#000;border:1px solid #2a2a2a;border-radius:6px;padding:13px;margin:11px 0;font-family:JetBrains Mono;font-size:11px;color:#888">/' + cidr + ' boundary not in 4th octet</div>'}
 const block=256-lastM;
 const networks=[];for(let i=0;i<256;i+=block)networks.push(i);
 let h='<div style="background:#000;border:1px solid #2a2a2a;border-radius:6px;padding:13px;margin:11px 0;font-family:JetBrains Mono;font-size:11.5px;line-height:1.65"><div style="font-size:9.5px;color:#999;letter-spacing:0.2em;margin-bottom:9px">◆ BLOCK SIZE · /'+cidr+' = '+block+' addresses per network</div>';
 h+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:9px">';
 networks.forEach(n=>{const isMatch=fourthOctet!==undefined&&fourthOctet>=n&&fourthOctet<n+block;h+='<div style="padding:4px 10px;border-radius:4px;background:'+(isMatch?'#2a2a0a':'#1a1a1a')+';border:1px solid '+(isMatch?'#E8B84B':'#2a2a2a')+';color:'+(isMatch?'#E8B84B':'#888')+';font-weight:'+(isMatch?'700':'400')+';font-size:11px">.'+n+(isMatch?' ◀':'')+'</div>'});
 h+='</div>';
 if(fourthOctet!==undefined){const matched=networks.find(n=>fourthOctet>=n&&fourthOctet<n+block);h+='<div style="font-size:11px;color:#999;line-height:1.5"><span style="color:#fff">.'+fourthOctet+'</span> falls between <span style="color:#E8B84B">.'+matched+'</span> and <span style="color:#666">.'+(matched+block)+'</span> → network is <b style="color:#E8B84B">.'+matched+'</b></div>'}
 h+='</div>';
 return h;
}
window.binaryViz=binaryViz;
window.blockViz=blockViz;
const BASH_FS_INITIAL={
 type:'dir',name:'/',children:{
  'home':{type:'dir',children:{
   'matt':{type:'dir',children:{
    'README.md':{type:'file',content:`# Welcome to BASH PLAYGROUND
You're at /home/matt. This is a real virtual filesystem.
Try these commands:
  ls              # list files
  ls -la          # list with details
  cd projects     # change directory
  cat README.md   # read this file
  pwd             # where am I
  help            # see all commands
Complete missions on the right to earn XP.`},
    'projects':{type:'dir',children:{
     'hoo':{type:'dir',children:{
      'site.html':{type:'file',content:'<!DOCTYPE html><html><body><h1>HOO</h1></body></html>'},
      'pipeline.js':{type:'file',content:'// Lead hunting pipeline\nconst leads = await huntLeads();\nawait sendOutreach(leads);\nconsole.log("Pipeline done");'},
      'TODO.md':{type:'file',content:'# HOO TODOs\n- Fix yelp scraper\n- Polish pricing section\n- Send to Hammer Hands'}
     }},
     'noreturn':{type:'dir',children:{
      'collections.csv':{type:'file',content:'name,type,products\nGodQuest,faith,12\nFatherhood,family,8\nLiveOrDie,grindset,15'},
      'header.liquid':{type:'file',content:'<header class="custom">\n  <nav>NoReturn Apparel</nav>\n</header>'}
     }},
     'tcb':{type:'dir',children:{
      'shopify.txt':{type:'file',content:'TCB Collections — cannabis dispensary build\nSections done: Hero, Collections Grid'}
     }}
    }},
    'logs':{type:'dir',children:{
     'auth.log':{type:'file',content:`Apr 24 10:15:01 mindful sshd[2341]: Accepted password for matt from 10.1.1.45 port 51234 ssh2
Apr 24 10:22:14 mindful sshd[2387]: Failed password for invalid user admin from 203.0.113.55 port 4022 ssh2
Apr 24 10:22:18 mindful sshd[2387]: Failed password for invalid user admin from 203.0.113.55 port 4022 ssh2
Apr 24 10:22:22 mindful sshd[2387]: Failed password for invalid user admin from 203.0.113.55 port 4022 ssh2
Apr 24 10:22:26 mindful sshd[2387]: Failed password for invalid user admin from 203.0.113.55 port 4022 ssh2
Apr 24 10:22:30 mindful sshd[2387]: Failed password for invalid user root from 203.0.113.55 port 4022 ssh2
Apr 24 10:23:01 mindful sshd[2400]: Failed password for invalid user admin from 198.51.100.7 port 8123 ssh2
Apr 24 10:23:05 mindful sshd[2400]: Failed password for invalid user admin from 198.51.100.7 port 8123 ssh2
Apr 24 10:23:09 mindful sshd[2400]: Failed password for invalid user admin from 198.51.100.7 port 8123 ssh2
Apr 24 11:00:05 mindful sshd[2501]: Accepted password for matt from 10.1.1.45 port 51999 ssh2
Apr 24 11:30:00 mindful sudo: matt : TTY=pts/0 ; PWD=/home/matt ; USER=root ; COMMAND=/usr/bin/apt update
Apr 24 12:05:33 mindful sshd[2700]: Failed password for invalid user oracle from 192.0.2.88 port 9001 ssh2`},
     'access.log':{type:'file',content:`10.1.1.45 - - [24/Apr/2026:10:15:00] "GET /index.html HTTP/1.1" 200 1234
10.1.1.45 - - [24/Apr/2026:10:15:02] "GET /style.css HTTP/1.1" 200 567
10.1.1.50 - - [24/Apr/2026:10:16:00] "GET /api/users HTTP/1.1" 200 8901
203.0.113.55 - - [24/Apr/2026:10:22:14] "POST /admin/login HTTP/1.1" 401 234
203.0.113.55 - - [24/Apr/2026:10:22:18] "POST /admin/login HTTP/1.1" 401 234
203.0.113.55 - - [24/Apr/2026:10:22:22] "POST /admin/login HTTP/1.1" 401 234
198.51.100.7 - - [24/Apr/2026:10:23:01] "GET /wp-admin HTTP/1.1" 404 156
198.51.100.7 - - [24/Apr/2026:10:23:03] "GET /.env HTTP/1.1" 404 156
198.51.100.7 - - [24/Apr/2026:10:23:05] "GET /admin.php HTTP/1.1" 404 156
10.1.1.45 - - [24/Apr/2026:11:00:00] "GET /index.html HTTP/1.1" 200 1234
10.1.1.51 - - [24/Apr/2026:11:30:00] "GET /api/data HTTP/1.1" 500 89
10.1.1.51 - - [24/Apr/2026:11:30:05] "GET /api/data HTTP/1.1" 500 89
10.1.1.51 - - [24/Apr/2026:11:31:00] "GET /api/data HTTP/1.1" 200 4567`},
     'syslog':{type:'file',content:`Apr 24 10:00:01 mindful systemd[1]: Started cron.service
Apr 24 10:15:01 mindful CRON[2340]: matt : pwd=/home/matt cmd=/usr/bin/backup.sh
Apr 24 10:30:00 mindful kernel: [12345.678] eth0: Link is Up - 1Gbps
Apr 24 11:00:00 mindful sshd[2501]: New connection from 10.1.1.45
Apr 24 12:00:00 mindful nginx[2890]: Reloaded configuration`}
    }},
    'docs':{type:'dir',children:{
     'subnets.txt':{type:'file',content:`10.0.0.0/8 - private Class A
172.16.0.0/12 - private Class B
192.168.0.0/16 - private Class C
127.0.0.1 - loopback
0.0.0.0/0 - default route
255.255.255.255 - broadcast`},
     'ports.txt':{type:'file',content:`22 SSH
23 Telnet
25 SMTP
53 DNS
67 DHCP server
68 DHCP client
69 TFTP
80 HTTP
123 NTP
161 SNMP
443 HTTPS
514 Syslog
3389 RDP`},
     'commands.txt':{type:'file',content:`# Common Linux commands
ls - list files
cd - change dir
pwd - current dir
cat - read file
grep - search text
find - find files
wc - count lines/words
sort - sort lines
uniq - remove duplicates
head/tail - first/last lines
awk - field processor
sed - stream editor`}
    }},
    '.bash_history':{type:'file',content:`ls
cd projects
ls -la
cat hoo/TODO.md
cd ..
cat .bash_history`},
    'notes.md':{type:'file',content:`# Quick notes
- CCNA exam prep ongoing
- Cyber 200-201 next
- Move to Rapid City Sept 2026
- HOO clients: Hammer Hands, Our Backyard`}
   }}
  }},
  'etc':{type:'dir',children:{
   'passwd':{type:'file',content:`root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
matt:x:1000:1000:Matt Herrman:/home/matt:/bin/bash
shelby:x:1001:1001:Shelby:/home/shelby:/bin/bash`},
   'hostname':{type:'file',content:'mindful'},
   'hosts':{type:'file',content:`127.0.0.1 localhost
10.1.1.10 mindful
10.1.1.20 codeforge`}
  }},
  'var':{type:'dir',children:{
   'log':{type:'dir',children:{
    'httpd.log':{type:'file',content:'200 OK\n200 OK\n404 Not Found\n500 Server Error\n200 OK'}
   }}
  }},
  'tmp':{type:'dir',children:{}}
 }
};
let BASH_FS=JSON.parse(JSON.stringify(BASH_FS_INITIAL));
let BASH_CWD=['home','matt'];
let BASH_HISTORY=[];
let BASH_HIST_IDX=-1;
function bashResolve(path){let parts;if(path.startsWith('/')){parts=path.split('/').filter(p=>p)}else{parts=[...BASH_CWD,...path.split('/').filter(p=>p)]}const out=[];for(const p of parts){if(p==='.')continue;if(p==='..'){out.pop();continue}out.push(p)}return out}
function bashGetNode(parts){let n=BASH_FS;for(const p of parts){if(!n.children||!n.children[p])return null;n=n.children[p]}return n}
function bashCwdStr(){return '/'+BASH_CWD.join('/')}

const BASH_HELP=`Available commands:
  pwd                show current directory
  ls [-la] [path]    list files
  cd <path>          change directory
  cat <file>         display file contents
  echo <text>        print text
  grep <pat> <file>  search lines matching pattern
  find <path> [-name pattern] [-type f|d]
  wc [-l] [file]     count lines/words/bytes
  head [-n N] <file>
  tail [-n N] <file>
  sort [file]        sort lines
  uniq [-c]          unique lines (with counts)
  awk '{print $N}'   print Nth field per line
  history            show command history
  clear              clear screen
  help               this message

Pipes work: cmd1 | cmd2 | cmd3
Redirection: cmd > file (write), cmd >> file (append)
Use ↑/↓ arrows for history, Tab for completion.`;
function bashRunPipeline(line){
 const trimmed=line.trim();if(!trimmed)return'';
 // Handle && chaining (run sequentially, abort on error)
 if(trimmed.includes('&&')&&!trimmed.match(/["'][^"']*&&[^"']*["']/)){
  const parts=trimmed.split(/\s*&&\s*/);
  let combined='';
  for(const part of parts){
   const out=bashRunPipeline(part);
   if(out.startsWith('bash:')||out.includes(': No such file'))return combined+out;
   combined+=out;
  }
  return combined;
 }
 // Handle redirection
 let redirect=null;let pipeline=trimmed;
 const redirM=trimmed.match(/^(.+?)\s*(>>?)\s*(\S+)$/);
 if(redirM){pipeline=redirM[1].trim();redirect={mode:redirM[2],path:redirM[3]}}
 // Split on pipes (respecting quotes)
 const stages=[];let cur='';let inQ=null;
 for(let i=0;i<pipeline.length;i++){const c=pipeline[i];if((c==='"'||c==="'")&&!inQ){inQ=c;cur+=c;continue}if(c===inQ){inQ=null;cur+=c;continue}if(c==='|'&&!inQ){stages.push(cur.trim());cur='';continue}cur+=c}
 if(cur.trim())stages.push(cur.trim());
 let stdin='';
 for(const stage of stages){stdin=bashRunCmd(stage,stdin)}
 if(redirect){const target=bashResolve(redirect.path);const fname=target.pop();const dirNode=bashGetNode(target);if(!dirNode){return 'bash: '+redirect.path+': No such directory\n'}const existing=dirNode.children[fname];const finalContent=redirect.mode==='>>'&&existing&&existing.type==='file'?existing.content+stdin:stdin;dirNode.children[fname]={type:'file',content:finalContent};return ''}
 return stdin;
}
function tokenize_bash(s){const out=[];let cur='';let q=null;for(let i=0;i<s.length;i++){const c=s[i];if(!q&&(c==='"'||c==="'")){q=c;continue}if(q===c){q=null;continue}if(!q&&c===' '){if(cur){out.push(cur);cur=''}continue}cur+=c}if(cur)out.push(cur);return out}
function bashRunCmd(cmd,stdin){
 const t=tokenize_bash(cmd);if(t.length===0)return stdin;
 const c=t[0];const args=t.slice(1);
 try{
  if(c==='pwd')return bashCwdStr()+'\n';
  if(c==='echo')return args.join(' ')+'\n';
  if(c==='clear'){document.getElementById('bash-term').innerHTML='';return ''}
  if(c==='help')return BASH_HELP+'\n';
  if(c==='history')return BASH_HISTORY.map((h,i)=>'  '+(i+1).toString().padStart(3)+'  '+h).join('\n')+'\n';
  if(c==='cd'){const path=args[0]||'/home/matt';const parts=bashResolve(path);const n=bashGetNode(parts);if(!n)return 'bash: cd: '+path+': No such file or directory\n';if(n.type!=='dir')return 'bash: cd: '+path+': Not a directory\n';BASH_CWD=parts;return ''}
  if(c==='ls'){const flags=args.filter(a=>a.startsWith('-')).join('');const path=args.find(a=>!a.startsWith('-'))||'.';const parts=bashResolve(path);const n=bashGetNode(parts);if(!n)return 'ls: cannot access \''+path+'\': No such file or directory\n';if(n.type==='file')return path+'\n';const showHidden=flags.includes('a');const longFmt=flags.includes('l');const items=Object.keys(n.children).filter(name=>showHidden||!name.startsWith('.')).sort();if(longFmt){return items.map(name=>{const node=n.children[name];const isDir=node.type==='dir';const sz=isDir?4096:(node.content?node.content.length:0);return (isDir?'drwxr-xr-x':'-rw-r--r--')+' 1 matt matt '+sz.toString().padStart(6)+' Apr 24 10:00 '+name+(isDir?'/':'')}).join('\n')+'\n'}return items.map(name=>n.children[name].type==='dir'?name+'/':name).join('  ')+'\n'}
  if(c==='cat'){if(args.length===0)return stdin;return args.map(p=>{const parts=bashResolve(p);const n=bashGetNode(parts);if(!n)return 'cat: '+p+': No such file or directory';if(n.type!=='file')return 'cat: '+p+': Is a directory';return n.content}).join('\n')+'\n'}
  if(c==='grep'){let invert=false;let count=false;let recursive=false;let ignoreCase=false;let lineNum=false;let extended=false;const flags=args.filter(a=>a.startsWith('-')&&!a.match(/^-\d/));flags.forEach(f=>{if(f.includes('v'))invert=true;if(f.includes('c'))count=true;if(f.includes('r')||f.includes('R'))recursive=true;if(f.includes('i'))ignoreCase=true;if(f.includes('n'))lineNum=true;if(f.includes('E'))extended=true});const pos=args.filter(a=>!a.startsWith('-')||a.match(/^-\d/));const pattern=pos[0];if(!pattern)return 'grep: missing pattern\n';const files=pos.slice(1);let regexSrc=pattern;if(!extended){regexSrc=pattern.replace(/[.+^${}()|[\]\\]/g,'\\$&')}const re=new RegExp(regexSrc,ignoreCase?'i':'');let text='';if(files.length===0){text=stdin}else{text=files.map(f=>{const parts=bashResolve(f);const n=bashGetNode(parts);return n&&n.type==='file'?n.content:''}).join('\n')}const lines=text.split('\n').map((l,i)=>({l,i:i+1}));const matched=lines.filter(({l})=>{const m=re.test(l);return invert?!m:m});if(count)return matched.length+'\n';return matched.map(({l,i})=>(lineNum?i+':':'')+l).join('\n')+(matched.length?'\n':'')}
  if(c==='find'){const startPath=args[0]&&!args[0].startsWith('-')?args[0]:'.';let nameFilter=null;let typeFilter=null;for(let i=0;i<args.length;i++){if(args[i]==='-name'&&args[i+1])nameFilter=args[i+1];if(args[i]==='-type'&&args[i+1])typeFilter=args[i+1]}const startParts=bashResolve(startPath);const startNode=bashGetNode(startParts);if(!startNode)return 'find: \''+startPath+'\': No such file or directory\n';const out=[];function walk(node,path){const matchType=!typeFilter||(typeFilter==='f'&&node.type==='file')||(typeFilter==='d'&&node.type==='dir');const matchName=!nameFilter||new RegExp('^'+nameFilter.replace(/\*/g,'.*').replace(/\?/g,'.')+'$').test(path.split('/').pop());if(matchType&&matchName)out.push(path);if(node.type==='dir')Object.entries(node.children).forEach(([n,c])=>walk(c,path+'/'+n))}walk(startNode,startPath==='.'?'.':startPath);return out.join('\n')+(out.length?'\n':'')}
  if(c==='wc'){const lFlag=args.includes('-l');const wFlag=args.includes('-w');const cFlag=args.includes('-c');const files=args.filter(a=>!a.startsWith('-'));let text=files.length?files.map(f=>{const n=bashGetNode(bashResolve(f));return n&&n.type==='file'?n.content:''}).join('\n'):stdin;const lines=text.split('\n').filter((l,i,a)=>i<a.length-1||l).length;const words=text.split(/\s+/).filter(w=>w).length;const bytes=text.length;if(lFlag)return lines+'\n';if(wFlag)return words+'\n';if(cFlag)return bytes+'\n';return '  '+lines+'  '+words+'  '+bytes+(files.length?' '+files[0]:'')+'\n'}
  if(c==='head'){let n=10;const nIdx=args.indexOf('-n');if(nIdx>=0)n=parseInt(args[nIdx+1]);const files=args.filter(a=>!a.startsWith('-')&&!/^\d+$/.test(a));let text=files.length?files.map(f=>{const node=bashGetNode(bashResolve(f));return node&&node.type==='file'?node.content:''}).join('\n'):stdin;return text.split('\n').slice(0,n).join('\n')+'\n'}
  if(c==='tail'){let n=10;const nIdx=args.indexOf('-n');if(nIdx>=0)n=parseInt(args[nIdx+1]);const files=args.filter(a=>!a.startsWith('-')&&!/^\d+$/.test(a));let text=files.length?files.map(f=>{const node=bashGetNode(bashResolve(f));return node&&node.type==='file'?node.content:''}).join('\n'):stdin;const lines=text.split('\n');return lines.slice(Math.max(0,lines.length-n-1)).join('\n')+'\n'}
  if(c==='sort'){const flagStr=args.filter(a=>a.startsWith('-')).join('');const r=flagStr.includes('r');const numFlag=flagStr.includes('n');const files=args.filter(a=>!a.startsWith('-'));let text=files.length?files.map(f=>{const node=bashGetNode(bashResolve(f));return node&&node.type==='file'?node.content:''}).join('\n'):stdin;const lines=text.split('\n').filter(l=>l!==undefined);lines.sort((a,b)=>{if(numFlag){const an=parseFloat(a)||0;const bn=parseFloat(b)||0;return an-bn}return a<b?-1:a>b?1:0});if(r)lines.reverse();return lines.join('\n')+'\n'}
  if(c==='uniq'){const cFlag=args.includes('-c');const lines=stdin.split('\n');const out=[];let prev=null;let count=0;for(const l of lines){if(l===prev)count++;else{if(prev!==null)out.push(cFlag?'  '+count+' '+prev:prev);prev=l;count=1}}if(prev!==null)out.push(cFlag?'  '+count+' '+prev:prev);return out.join('\n')+'\n'}
  if(c==='awk'){const prog=args[0]||'';const m=prog.match(/\{print\s+\$(\d+|NF)\}/);if(!m)return 'awk: unsupported program (try {print $N})\n';const fieldRaw=m[1];// Allow file argument after the program
const fileArgs=args.slice(1).filter(a=>!a.startsWith('-'));let inputText=stdin;if(fileArgs.length>0){inputText=fileArgs.map(f=>{const node=bashGetNode(bashResolve(f));return node&&node.type==='file'?node.content:''}).join('\n')}const lines=inputText.split('\n').filter(l=>l);const out=lines.map(l=>{const fields=l.split(/\s+/).filter(f=>f);if(fieldRaw==='NF')return fields[fields.length-1]||'';if(fieldRaw==='0')return l;return fields[parseInt(fieldRaw)-1]||''});return out.join('\n')+(out.length?'\n':'')}
  if(c==='whoami')return 'matt\n';
  if(c==='hostname')return 'mindful\n';
  if(c==='date')return new Date().toString()+'\n';
  if(c==='which'){const cmd=args[0];const known=['ls','cd','pwd','cat','grep','find','wc','head','tail','sort','uniq','awk','echo','clear','help','history','whoami','hostname','date'];return known.includes(cmd)?'/usr/bin/'+cmd+'\n':cmd+' not found\n'}
  return 'bash: '+c+': command not found\n';
 }catch(e){return 'bash: error: '+e.message+'\n'}
}
const BASH_MISSIONS=[
{id:'b1',t:'PRINT YOUR LOCATION',d:'Print your current working directory.',xp:25,solution:'pwd',check:o=>o.trim()==='/home/matt'},
{id:'b2',t:'LIST FILES',d:'List the files in the current directory.',xp:25,solution:'ls',check:o=>o.includes('README.md')&&o.includes('projects')},
{id:'b3',t:'READ A FILE',d:'Read the README.md file.',xp:30,solution:'cat README.md',check:o=>o.includes('Welcome to BASH PLAYGROUND')},
{id:'b4',t:'NAVIGATE',d:'Change directory to projects/hoo and list its contents.',xp:40,solution:'cd projects/hoo && ls',check:o=>o.includes('site.html')&&o.includes('pipeline.js')},
{id:'b5',t:'HIDDEN FILES',d:'Show ALL files in /home/matt including hidden ones (those starting with a dot).',xp:50,solution:'ls -la /home/matt',check:o=>o.includes('.bash_history')&&o.includes('README.md')},
{id:'b6',t:'COUNT LINES',d:'Count how many lines are in /home/matt/logs/auth.log.',xp:50,solution:'wc -l /home/matt/logs/auth.log',check:o=>/12|13/.test(o)},
{id:'b7',t:'GREP FAILED LOGINS',d:'Show all lines in auth.log that contain "Failed password".',xp:60,solution:'grep "Failed password" /home/matt/logs/auth.log',check:o=>{const lines=o.trim().split('\n').filter(l=>l);return lines.length>=7&&lines.every(l=>l.includes('Failed password'))}},
{id:'b8',t:'SOC INVESTIGATION · TOP ATTACKERS',d:'You are investigating a brute-force attack. Print the source IPs that have the most failed logins, sorted by count (highest first). Pipe through grep, awk to extract IP, sort, uniq -c, sort -rn. (Hint: in the auth.log line, the IP is field $13 — count the fields after "from".)',xp:120,solution:'grep "Failed password" /home/matt/logs/auth.log | awk \'{print $13}\' | sort | uniq -c | sort -rn',check:o=>o.includes('203.0.113.55')&&o.indexOf('203.0.113.55')<o.indexOf('198.51.100.7')},
{id:'b9',t:'FIND BY NAME',d:'Find all files (not directories) named exactly "TODO.md" anywhere under /home/matt.',xp:80,solution:'find /home/matt -name TODO.md -type f',check:o=>o.includes('TODO.md')&&o.includes('hoo')},
{id:'b10',t:'COUNT 200 RESPONSES',d:'In access.log, count how many lines contain " 200 " (HTTP success). Print just the count.',xp:80,solution:'grep " 200 " /home/matt/logs/access.log | wc -l',check:o=>/^\s*[5-9]\s*$/.test(o.trim())||o.trim()==='6'||o.trim()==='5'},
{id:'b11',t:'SCANNER DETECTION',d:'Find URLs in access.log that look like vulnerability scanner probes (containing wp-admin, .env, or admin.php). Use grep with multiple patterns.',xp:100,solution:'grep -E "wp-admin|\\.env|admin\\.php" /home/matt/logs/access.log',check:o=>o.includes('wp-admin')&&o.includes('.env')&&o.includes('admin.php')},
{id:'b12',t:'EXTRACT FIELD',d:'Print only the first field (IP address) of each line in access.log.',xp:80,solution:"awk '{print $1}' /home/matt/logs/access.log",check:o=>o.includes('10.1.1.45')&&o.includes('203.0.113.55')&&!o.includes('GET')},
{id:'b13',t:'TOP 3 IPs BY HITS',d:'Top 3 source IPs in access.log by hit count, highest first.',xp:120,solution:"awk '{print $1}' /home/matt/logs/access.log | sort | uniq -c | sort -rn | head -n 3",check:o=>{const lines=o.trim().split('\n').filter(l=>l);return lines.length===3&&lines.every(l=>/^\s*\d+\s+\d+\.\d+\.\d+\.\d+/.test(l))}},
{id:'b14',t:'WRITE TO FILE',d:'Write the text "scan-complete" to a new file called /tmp/status.txt using echo and redirection.',xp:80,solution:'echo scan-complete > /tmp/status.txt',check:o=>{const n=bashGetNode(['tmp','status.txt']);return n&&n.type==='file'&&n.content.includes('scan-complete')}},
{id:'b15',t:'CAPSTONE · INCIDENT REPORT',d:'Build a one-line pipeline that finds all "Failed password" entries in auth.log, extracts the source IP (field $13), counts unique IPs sorted by count desc, and saves to /tmp/attackers.txt. Verify with cat afterward.',xp:200,solution:'grep "Failed password" /home/matt/logs/auth.log | awk \'{print $13}\' | sort | uniq -c | sort -rn > /tmp/attackers.txt',check:o=>{const n=bashGetNode(['tmp','attackers.txt']);return n&&n.type==='file'&&n.content.includes('203.0.113.55')&&n.content.includes('198.51.100.7')}}
];
let currentBashMission=0;








function escapeHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}

/* helpers from v30 */
function parseCIDR(s){
 const m=s.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)\/(\d+)$/);if(!m)return null;
 const oct=[+m[1],+m[2],+m[3],+m[4]],p=+m[5];
 if(oct.some(o=>o<0||o>255)||p<0||p>32)return null;
 const ip=(oct[0]<<24|oct[1]<<16|oct[2]<<8|oct[3])>>>0;
 const mask=p===0?0:(0xFFFFFFFF<<(32-p))>>>0;
 const net=(ip&mask)>>>0,bc=(net|(~mask>>>0))>>>0;
 const first=p>=31?net:net+1,last=p>=31?bc:bc-1;
 const hosts=p>=31?(p===32?1:2):Math.pow(2,32-p)-2;
 return{ip:intToIp(ip),network:intToIp(net),broadcast:intToIp(bc),firstHost:intToIp(first),lastHost:intToIp(last),mask:intToIp(mask),cidr:p,hosts,total:Math.pow(2,32-p),ipBin:intToBin(ip),netBin:intToBin(net),maskBin:intToBin(mask)}
}
function intToIp(n){return[(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255].join('.')}
function flashScreen(color,duration){let f=document.getElementById('flash-overlay');if(!f){f=document.createElement('div');f.id='flash-overlay';f.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:9999;opacity:0;transition:opacity 0.12s';document.body.appendChild(f)}f.style.background=color;f.style.opacity='0.4';setTimeout(()=>{f.style.opacity='0'},duration)}
function intToBin(n){return[(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255].map(o=>o.toString(2).padStart(8,'0')).join('.')}
