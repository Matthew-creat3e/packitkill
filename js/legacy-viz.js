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
window.binaryViz=binaryViz;window.blockViz=blockViz;
// ═══ v13 · BASH PLAYGROUND ENGINE ═══
// Virtual filesystem — real semantics for cd/ls/cat/grep/find/pwd/echo/wc/sort/uniq/head/tail/awk
