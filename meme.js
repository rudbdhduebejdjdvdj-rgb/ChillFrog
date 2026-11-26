// Local-only ChillFrog meme creator. Images never leave the browser.
(function(){
 const canvas=document.getElementById("meme-canvas");if(!canvas)return;
 const ctx=canvas.getContext("2d"),topInput=document.getElementById("meme-top"),bottomInput=document.getElementById("meme-bottom"),template=document.getElementById("meme-template"),file=document.getElementById("meme-image"),download=document.getElementById("meme-download");
 let uploaded=null;
 function wrap(text,maxWidth,font){ctx.font=font;const words=(text||"").toUpperCase().split(/\s+/),lines=[];let line="";for(const word of words){const test=line?line+" "+word:word;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word}else line=test}if(line)lines.push(line);return lines}
 function textBlock(text,y){const font="900 65px Arial Black,Arial,sans-serif",lines=wrap(text,930,font);ctx.font=font;ctx.textAlign="center";ctx.textBaseline="middle";lines.slice(0,2).forEach((line,i)=>{const yy=y+(i-(Math.min(lines.length,2)-1)/2)*75;ctx.lineWidth=13;ctx.strokeStyle="#111";ctx.lineJoin="round";ctx.strokeText(line,540,yy,930);ctx.fillStyle="#fff";ctx.fillText(line,540,yy,930)})}
 function draw(){const mode=template.value;const palettes={classic:["#173b27","#78c94b","#f2bd42"],neon:["#160d2c","#ff65c8","#d7ff45"],sunset:["#47204d","#ff8d55","#ffe36e"]},[bg,a,b]=palettes[mode]||palettes.classic;const grad=ctx.createLinearGradient(0,0,1080,1080);grad.addColorStop(0,bg);grad.addColorStop(.55,a);grad.addColorStop(1,bg);ctx.fillStyle=grad;ctx.fillRect(0,0,1080,1080);
  ctx.globalAlpha=.22;for(let i=0;i<18;i++){ctx.strokeStyle=b;ctx.lineWidth=3;ctx.beginPath();ctx.arc(540,535,100+i*27,0,Math.PI*2);ctx.stroke()}ctx.globalAlpha=1;
  if(uploaded){const iw=uploaded.width,ih=uploaded.height,scale=Math.min(700/iw,500/ih),dw=iw*scale,dh=ih*scale;ctx.save();ctx.shadowColor="#000";ctx.shadowBlur=25;ctx.drawImage(uploaded,(1080-dw)/2,(1080-dh)/2-5,dw,dh);ctx.restore()}
  else{ctx.font="330px Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("🐸",540,540)}
  ctx.fillStyle=b;ctx.fillRect(0,0,1080,12);ctx.fillRect(0,1068,1080,12);textBlock(topInput.value,100);textBlock(bottomInput.value,970);
  ctx.font="800 23px Arial,sans-serif";ctx.fillStyle="#ffffffb8";ctx.textAlign="right";ctx.fillText("CHILLFROG",1035,1035);
 }
 [topInput,bottomInput,template].forEach(el=>el.addEventListener("input",draw));
 document.getElementById("meme-generate").addEventListener("click",draw);
 file.addEventListener("change",()=>{const f=file.files?.[0];if(!f)return;if(!/^image\/(png|jpeg|webp)$/.test(f.type)||f.size>8*1024*1024){file.value="";alert("Choose a PNG, JPG or WebP image under 8 MB.");return}const url=URL.createObjectURL(f),img=new Image();img.onload=()=>{uploaded=img;draw();URL.revokeObjectURL(url)};img.onerror=()=>{URL.revokeObjectURL(url);alert("This image could not be loaded.")};img.src=url});
 download.addEventListener("click",()=>{draw();canvas.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="chillfrog-meme.png";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)},"image/png")});
 draw();
})();