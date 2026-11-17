/* Shims the v30 engines expect to exist at load time. Real versions are defined in core.js. */
var profile = profile || {xp:0, completedLabs:{}, learned:{}, bashDone:{}, sqlDone:{}, completedProjects:{}};
function showScreen(name){ if (typeof UI!=="undefined") { if (name==="labs") UI.go("labs"); else if (name==="dash") UI.go("hq"); } }
function saveProfile(){ if (window.save) save(); }
function todayStr(){ const d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function checkAchievements(){}
function unlockAchievement(){}
