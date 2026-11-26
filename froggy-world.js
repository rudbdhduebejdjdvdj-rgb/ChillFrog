(function(){
 const $=id=>document.getElementById(id);
 const storeKey="chillfrog-world-progress-v1";
 const defaults={best:0,streak:0,lastDay:"",badges:[]};
 let state={...defaults};
 try{state={...defaults,...JSON.parse(localStorage.getItem(storeKey)||"{}")}}catch{}
 const save=()=>{try{localStorage.setItem(storeKey,JSON.stringify(state))}catch{}};
 const badgeIds=["first","ten","twentyfive","secret"];
 function renderProgress(){
  $("fw-best").textContent=state.best||0;
  $("fw-streak").textContent=(state.streak||0)+" 🔥";
  $("fw-badges").textContent=state.badges.length+"/4";
  document.querySelectorAll("[data-badge]").forEach(card=>{
   const unlocked=state.badges.includes(card.dataset.badge);
   card.classList.toggle("is-unlocked",unlocked);
   card.querySelector(".fw-badge-state").textContent=unlocked?"UNLOCKED":"LOCKED";
  });
 }
 function unlock(id){
  if(!badgeIds.includes(id)||state.badges.includes(id))return;
  state.badges.push(id);save();renderProgress();
  const names={first:"FIRST HOP",ten:"10 HOPS",twentyfive:"25 HOPS",secret:"SECRET VIBE"};
  $("fw-game-message").textContent="Badge unlocked: "+names[id]+" 🐸";
 }
 function recordPlay(score){
  const today=new Date().toLocaleDateString("en-CA");
  if(state.lastDay!==today){
   const yesterday=new Date(Date.now()-86400000).toLocaleDateString("en-CA");
   state.streak=state.lastDay===yesterday?(state.streak||0)+1:1;
   state.lastDay=today;
  }
  state.best=Math.max(state.best||0,score);
  unlock("first");if(score>=10)unlock("ten");if(score>=25)unlock("twentyfive");
  save();renderProgress();
 }
 renderProgress();

 // Secret easter egg: seven taps on Froggy.
 let taps=0,resetTap;
 $("secret-frog").addEventListener("click",()=>{
  taps++;clearTimeout(resetTap);resetTap=setTimeout(()=>taps=0,2200);
  if(taps>=7){taps=0;unlock("secret");$("secret-frog").querySelector("span").textContent="you found the secret!";$("fw-game-message").textContent="🐸 Secret vibe discovered. One Love!";}
  else $("secret-frog").querySelector("span").textContent=(7-taps)+" taps to a secret";
 });

 // Lily Hop: browser-only skill game, deliberately not connected to token or points rewards.
 const canvas=$("fw-game"),ctx=canvas.getContext("2d"),play=$("fw-play"),jumpBtn=$("fw-jump");
 let running=false,raf=0,last=0,elapsed=0,score=0,spawn=0,obstacles=[],player={x:120,y:270,vy:0,ground:270};
 const ground=300,gravity=1450,jumpVelocity=-540;
 function draw(){
  const w=canvas.width,h=canvas.height;
  const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,"#b8df9b");sky.addColorStop(1,"#6fb77b");ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
  ctx.fillStyle="#d9edaa";for(let i=0;i<7;i++){ctx.beginPath();ctx.arc(i*170+45,55+(i%3)*24,24+(i%2)*12,0,Math.PI*2);ctx.fill()}
  ctx.fillStyle="#4b9561";ctx.fillRect(0,ground,w,h-ground);
  ctx.fillStyle="#2c6b4d";for(let x=0;x<w;x+=95){ctx.beginPath();ctx.ellipse(x+20,ground+22,38,11,0,0,Math.PI*2);ctx.fill()}
  ctx.fillStyle="#b6df79";ctx.fillRect(0,ground,w,5);
  // Frog
  ctx.fillStyle="#2c873f";ctx.beginPath();ctx.ellipse(player.x,player.y,31,24,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#50b94e";ctx.beginPath();ctx.arc(player.x-15,player.y-19,11,0,Math.PI*2);ctx.arc(player.x+15,player.y-19,11,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(player.x-15,player.y-19,5,0,Math.PI*2);ctx.arc(player.x+15,player.y-19,5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#102719";ctx.beginPath();ctx.arc(player.x-15,player.y-19,2.5,0,Math.PI*2);ctx.arc(player.x+15,player.y-19,2.5,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="#143d25";ctx.lineWidth=3;ctx.beginPath();ctx.arc(player.x,player.y+2,12,.15,Math.PI-.15);ctx.stroke();
  obstacles.forEach(o=>{ctx.fillStyle="#744a2c";ctx.beginPath();ctx.roundRect(o.x,o.y,o.w,o.h,12);ctx.fill();ctx.fillStyle="#b9824e";ctx.beginPath();ctx.arc(o.x+9,o.y+8,4,0,Math.PI*2);ctx.fill()});
  if(!running){ctx.fillStyle="#143d25cc";ctx.fillRect(0,0,w,h);ctx.fillStyle="#fff";ctx.textAlign="center";ctx.font="800 30px Syne,Arial";ctx.fillText(score?"ROUND OVER":"READY, FROGGY?",w/2,145);ctx.font="600 16px Space Grotesk,Arial";ctx.fillText(score?"Press PLAY to hop again":"Jump over the logs!",w/2,180)}
 }
 function endGame(){running=false;cancelAnimationFrame(raf);play.textContent="PLAY AGAIN ↗";$("fw-game-message").textContent="Round over! You scored "+score+". Your best is "+Math.max(state.best,score)+".";recordPlay(score);draw()}
 function frame(now){
  if(!running)return;
  const dt=Math.min((now-last)/1000,.035);last=now;elapsed+=dt;spawn+=dt;
  player.vy+=gravity*dt;player.y+=player.vy*dt;
  if(player.y>player.ground){player.y=player.ground;player.vy=0}
  const speed=330+Math.min(score*5,170);
  if(spawn>Math.max(.72,1.35-score*.012)){spawn=0;const height=28+Math.random()*24;obstacles.push({x:canvas.width+20,y:ground-height,w:28+Math.random()*16,h:height})}
  obstacles.forEach(o=>o.x-=speed*dt);obstacles=obstacles.filter(o=>o.x+o.w>0);
  score=Math.floor(elapsed*2.4);$("fw-score").textContent=score;
  const frogBox={x:player.x-23,y:player.y-19,w:46,h:38};
  for(const o of obstacles){if(frogBox.x<o.x+o.w-5&&frogBox.x+frogBox.w>o.x+5&&frogBox.y<o.y+o.h&&frogBox.y+frogBox.h>o.y+5){endGame();return}}
  draw();raf=requestAnimationFrame(frame);
 }
 function jump(){if(!running)return;if(player.y>=player.ground-1)player.vy=jumpVelocity}
 function start(){cancelAnimationFrame(raf);running=true;elapsed=0;score=0;spawn=0;obstacles=[];player.y=player.ground;player.vy=0;$("fw-score").textContent="0";$("fw-game-message").textContent="Nice! Keep hopping.";play.textContent="RESTART ↗";last=performance.now();raf=requestAnimationFrame(frame)}
 play.addEventListener("click",start);jumpBtn.addEventListener("click",jump);
 canvas.addEventListener("pointerdown",e=>{e.preventDefault();if(!running)start();else jump()});
 window.addEventListener("keydown",e=>{if(e.code==="Space"&&document.activeElement!==play){e.preventDefault();if(!running)start();else jump()}});
 draw();

 // Read-only public data from the existing ChillFrog Supabase project.
 async function loadWorldData(){
  const cfg=window.CHILLFROG_SUPABASE;
  if(!cfg?.url||!cfg?.publishableKey||!window.supabase){$("fw-missions").innerHTML='<p class="fw-muted">Community data is temporarily unavailable. Visit The Swamp for updates.</p>';$("fw-events").innerHTML='<p class="fw-muted">Community calendar is temporarily unavailable.</p>';return}
  const db=window.supabase.createClient(cfg.url,cfg.publishableKey);
  const [missions,events]=await Promise.all([
   db.from("community_missions").select("id,title,description,points,ends_at").eq("status","active").order("starts_at").limit(4),
   db.from("community_events").select("id,title,description,event_type,starts_at,url").eq("status","published").gte("starts_at",new Date().toISOString()).order("starts_at").limit(4)
  ]);
  const safe=(s)=>String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const mbox=$("fw-missions");mbox.replaceChildren();
  if(missions.error||!missions.data?.length)mbox.innerHTML='<p class="fw-muted">No active missions yet. The team will publish new quests here.</p>';
  else missions.data.forEach(m=>{const item=document.createElement("article");item.className="fw-feed-item";item.innerHTML='<strong>'+safe(m.title)+'</strong><p>'+safe(m.description)+'</p><small>'+Number(m.points)+' INTERNAL COMMUNITY POINTS</small>';mbox.append(item)});
  const ebox=$("fw-events");ebox.replaceChildren();
  if(events.error||!events.data?.length)ebox.innerHTML='<p class="fw-muted">No upcoming events published yet. Check back soon.</p>';
  else events.data.forEach(e=>{const item=document.createElement("article");item.className="fw-feed-item";item.innerHTML='<strong>'+safe(e.title)+'</strong><p>'+safe(e.description)+'</p><small>'+new Date(e.starts_at).toLocaleString()+" · "+safe(e.event_type).toUpperCase()+'</small>';if(e.url&&/^https:\/\//i.test(e.url)){const a=document.createElement("a");a.href=e.url;a.target="_blank";a.rel="noopener noreferrer";a.textContent="OPEN EVENT ↗";a.className="fw-inline-link";item.append(a)}ebox.append(item)});
 }
 loadWorldData().catch(()=>{$("fw-missions").innerHTML='<p class="fw-muted">Missions are temporarily unavailable.</p>';$("fw-events").innerHTML='<p class="fw-muted">Events are temporarily unavailable.</p>'});
 const year=$("year");if(year)year.textContent=new Date().getFullYear();
})();