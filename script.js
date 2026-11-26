document.getElementById("year").textContent=new Date().getFullYear();const button=document.querySelector(".menu");const nav=document.querySelector(".header nav");button.addEventListener("click",()=>{const open=nav.classList.toggle("open");button.setAttribute("aria-expanded",String(open));button.textContent=open?"×":"☰"});nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{nav.classList.remove("open");button.setAttribute("aria-expanded","false");button.textContent="☰"}));

// Animate the supplied CFROG snapshot from zero when the stats panel enters view.
(function(){
  const counters = document.querySelectorAll(".count-up");
  if (!counters.length) return;

  const render = (el, value) => {
    const decimals = Number(el.dataset.decimals || 0);
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    el.textContent = prefix + value.toFixed(decimals) + suffix;
  };

  const animate = (el) => {
    if (el.dataset.animated === "true") return;
    el.dataset.animated = "true";
    const target = Number(el.dataset.value || 0);
    const duration = 1700;
    const start = performance.now();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      render(el, target);
      return;
    }
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      render(el, target * eased);
      if (progress < 1) requestAnimationFrame(tick);
      else render(el, target);
    };
    requestAnimationFrame(tick);
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          counters.forEach(animate);
          observer.disconnect();
        }
      });
    }, { threshold: 0.25 });
    const panel = document.querySelector(".stats-panel");
    if (panel) observer.observe(panel);
    else counters.forEach(animate);
  } else {
    counters.forEach(animate);
  }
})();


// Jupiter Plugin: fixed CFROG output so visitors cannot accidentally select a lookalike token.
(function initChillFrogSwap(){
  const status = document.getElementById("jupiter-status");
  const target = document.getElementById("jupiter-plugin");
  if (!status || !target) return;

  if (!window.Jupiter || typeof window.Jupiter.init !== "function") {
    status.textContent = "Jupiter could not be loaded. Please refresh the page and try again.";
    status.classList.add("is-warning");
    return;
  }

  try {
    window.Jupiter.init({
      displayMode: "integrated",
      integratedTargetId: "jupiter-plugin",
      defaultExplorer: "Solana Explorer",
      formProps: {
        initialInputMint: "So11111111111111111111111111111111111111112",
        initialOutputMint: "5dfEAdnAXweREFoozFfVpENeoFcHFJcAuxZw6oYVpump",
        fixedMint: "5dfEAdnAXweREFoozFfVpENeoFcHFJcAuxZw6oYVpump"
      },
      onSuccess: ({ txid }) => {
        status.textContent = "Swap submitted. Verify its confirmation in Solana Explorer.";
        status.classList.remove("is-warning");
      },
      onSwapError: () => {
        status.textContent = "Jupiter could not complete this swap. Check route availability, liquidity and your wallet balance, then try again.";
        status.classList.add("is-warning");
      }
    });
    status.textContent = "Jupiter swap is ready. Check every transaction detail in your wallet before signing.";
  } catch (error) {
    status.textContent = "The swap interface could not start. Please refresh the page and try again.";
    status.classList.add("is-warning");
  }
})();


// Froggy reacts to clicks, pointer movement and the main order/swap CTA.
(function initInteractiveFroggy(){
  const frog = document.querySelector("[data-froggy]");
  if (!frog) return;
  const visual = frog.closest(".visual");
  let animationTimer;

  const play = (kind = "is-tapped") => {
    frog.classList.remove("is-tapped", "is-excited");
    void frog.offsetWidth;
    frog.classList.add(kind);
    clearTimeout(animationTimer);
    animationTimer = setTimeout(() => frog.classList.remove(kind), 950);
  };

  frog.addEventListener("click", () => play("is-tapped"));
  frog.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      play("is-tapped");
    }
  });

  if (visual && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    visual.addEventListener("pointermove", (event) => {
      const rect = frog.getBoundingClientRect();
      const dx = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const dy = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      frog.style.setProperty("--eye-x", Math.max(-7, Math.min(7, dx * 7)) + "px");
      frog.style.setProperty("--eye-y", Math.max(-5, Math.min(5, dy * 5)) + "px");
    });
    visual.addEventListener("pointerleave", () => {
      frog.style.setProperty("--eye-x", "0px");
      frog.style.setProperty("--eye-y", "0px");
    });
  }

  const orderLinks = document.querySelectorAll('a,button');
  orderLinks.forEach((link) => {
    const label = (link.textContent || "").trim();
    if (!/(ordenar|order|swap|buy|comprar|jupiter)/i.test(label)) return;
    link.addEventListener("pointerenter", () => play("is-excited"));
    link.addEventListener("focus", () => play("is-excited"));
    link.addEventListener("click", () => play("is-excited"));
  });
})();


// Falling ash draws the real text glyphs of every section, then reveals the live DOM.
(function(){
 const root=document.documentElement,intro=document.getElementById("leaf-intro"),stage=intro?.querySelector(".leaf-stage"),canvas=document.getElementById("ash-canvas");
 if(!intro||!stage||!canvas)return;
 if(matchMedia("(prefers-reduced-motion: reduce)").matches){intro.remove();root.classList.remove("ash-loading");return;}
 const ctx=canvas.getContext("2d"),sample=document.createElement("canvas"),sctx=sample.getContext("2d",{willReadFrequently:true});
 let w=0,h=0,dpr=1,start=0,raf=0,smoke=[],embers=[],particles=[];
 const rand=(a,b)=>a+Math.random()*(b-a),sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 function resize(){dpr=Math.min(devicePixelRatio||1,2);w=innerWidth;h=innerHeight;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}
 function targetsFor(el){
  const selector="h1,h2,h3,h4,p,a,button,.pill,.micro,.orbit-label,li,label";
  return [...el.querySelectorAll(selector)].filter(node=>node.children.length===0&&node.textContent.trim()&&node.getBoundingClientRect().width>0);
 }
 function glyphPoints(node){
  const rect=node.getBoundingClientRect();if(rect.bottom<0||rect.top>h||rect.width<4||rect.height<4)return [];
  const style=getComputedStyle(node),font=style.font||[style.fontStyle,style.fontVariant,style.fontWeight,style.fontSize,style.fontFamily].join(" ");
  const text=node.innerText||node.textContent||"",fontSize=parseFloat(style.fontSize)||16,lineHeight=parseFloat(style.lineHeight)||fontSize*1.25;
  const maxW=Math.max(8,Math.min(rect.width,1200)),pad=3,lines=[];
  sample.width=Math.ceil(maxW+pad*2);sample.height=Math.ceil(Math.max(rect.height+pad*2,lineHeight+pad*2));
  sctx.clearRect(0,0,sample.width,sample.height);sctx.font=font;sctx.textBaseline="top";sctx.fillStyle="#fff";
  const words=text.replace(/\s+/g," ").trim().split(" ");let line="",y=pad;
  for(const word of words){const test=line?line+" "+word:word;if(sctx.measureText(test).width>maxW&&line){sctx.fillText(line,pad,y);lines.push({text:line,y});line=word;y+=lineHeight}else line=test}
  if(line){sctx.fillText(line,pad,y);lines.push({text:line,y})}
  const image=sctx.getImageData(0,0,sample.width,sample.height).data,step=fontSize>25?3:2,pts=[];
  for(let yy=0;yy<sample.height;yy+=step)for(let xx=0;xx<sample.width;xx+=step){if(image[(yy*sample.width+xx)*4+3]>100)pts.push({x:rect.left+xx-pad,y:rect.top+yy-pad})}
  const cap=fontSize>30?260:fontSize>18?150:75,stride=Math.max(1,Math.ceil(pts.length/cap));
  return pts.filter((_,i)=>i%stride===0).map(pt=>({x:pt.x,y:pt.y,size:rand(.55,1.35),rot:rand(-.4,.4)}));
 }
 function makeGlyphParticles(elements){
  const pts=[];for(const node of elements)pts.push(...glyphPoints(node));
  return pts;
 }
 function startAshStream(points){
  particles=points.map((p,i)=>({x:rand(0,w),y:rand(-h*.75,-10),tx:p.x,ty:p.y,vx:rand(-22,22),vy:rand(35,115),size:p.size,rot:p.rot,alpha:rand(.5,.95),delay:rand(0,.42),age:0,life:rand(.85,1.45),settled:false}));
  return new Promise(resolve=>{let done=false;const finish=()=>{if(!done){done=true;resolve()}};const began=performance.now();function frame(now){const elapsed=(now-began)/1000;ctx.clearRect(0,0,w,h);let moving=0;
    for(const p of particles){const t=elapsed-p.delay;if(t<0){moving++;continue}const q=Math.min(1,t/p.life),ease=q*q*(3-2*q);if(q<1)moving++;const drift=Math.sin(t*3+p.tx*.01)*Math.sin(q*Math.PI)*14;
      const x=p.x+(p.tx-p.x)*ease+drift,y=p.y+(p.ty-p.y)*ease+Math.sin(t*5+p.ty)*2;
      ctx.save();ctx.globalAlpha=p.alpha*(q>.94?Math.max(0,(1-q)/.06):1);ctx.translate(x,y);ctx.rotate(p.rot+t*1.8);ctx.fillStyle=Math.random()>.16?"#c9c4b8":"#f1a24d";ctx.beginPath();ctx.ellipse(0,0,p.size,p.size*rand(1.1,2.1),0,0,Math.PI*2);ctx.fill();ctx.restore()}
    if(elapsed<1.95&&moving>0)raf=requestAnimationFrame(frame);else{ctx.clearRect(0,0,w,h);finish()}
   }raf=requestAnimationFrame(frame);setTimeout(finish,2300)});
 }
 function emberSmoke(x,y){for(let i=0;i<20;i++)smoke.push({x:x+rand(-30,30),y:y+rand(-20,20),vx:rand(-15,15),vy:rand(-32,-8),life:rand(1.2,2.4),age:0,size:rand(9,24),alpha:rand(.025,.08)})}
 function burnFrame(t){if(!start)start=t;const time=(t-start)/1000;ctx.clearRect(0,0,w,h);const r=stage.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
  if(time<5.9){for(let i=0;i<24;i++){const a=i/24*Math.PI*2+time*.12,x=cx+Math.cos(a)*r.width*.39,y=cy+Math.sin(a)*r.height*.37;ctx.save();ctx.globalCompositeOperation="screen";const g=ctx.createRadialGradient(x,y,0,x,y,rand(18,48));g.addColorStop(0,"rgba(255,211,117,.25)");g.addColorStop(.3,"rgba(255,95,21,.23)");g.addColorStop(1,"rgba(255,65,8,0)");ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(x,y,rand(5,12),rand(18,45),rand(-.3,.3),0,Math.PI*2);ctx.fill();ctx.restore()}if(Math.random()<.5)emberSmoke(cx+rand(-r.width*.3,r.width*.3),cy)}
  for(let i=smoke.length-1;i>=0;i--){const p=smoke[i];p.age+=1/60;p.x+=p.vx/60;p.y+=p.vy/60;if(p.age>p.life){smoke.splice(i,1);continue}ctx.globalAlpha=p.alpha*(1-p.age/p.life);const g=ctx.createRadialGradient(p.x,p.y,1,p.x,p.y,p.size);g.addColorStop(0,"rgba(36,39,32,.25)");g.addColorStop(1,"rgba(36,39,32,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;
  if(time<6.2)raf=requestAnimationFrame(burnFrame);else{ctx.clearRect(0,0,w,h);cancelAnimationFrame(raf)}
 }
 async function buildPage(){
  const header=document.querySelector("header"),sections=[...document.querySelectorAll("main>section,main>.buyers-strip")],footer=document.querySelector("footer"),sequence=[header,...sections,footer].filter(Boolean);
  root.classList.remove("ash-loading");root.classList.add("ash-building");
  for(const block of sequence){
   window.scrollTo({top:Math.max(0,block.getBoundingClientRect().top+scrollY-18),behavior:"instant"});
   block.classList.add("ash-section-active");
   const nodes=targetsFor(block);nodes.forEach(n=>n.classList.add("ash-copy-hidden"));
   await sleep(240);
   const glyphs=makeGlyphParticles(nodes);
   if(glyphs.length)await startAshStream(glyphs);
   nodes.forEach(n=>{n.classList.remove("ash-copy-hidden");n.classList.add("ash-copy-visible")});
   await sleep(130);
  }
  // Final downward ash fall across the last viewport, then hand control back to the visitor.
  const endY=Math.max(0,document.documentElement.scrollHeight-innerHeight);window.scrollTo({top:endY,behavior:"smooth"});
  const end=performance.now()+1100;while(performance.now()<end)await sleep(40);
  ctx.clearRect(0,0,w,h);intro.remove();root.classList.remove("ash-building");root.classList.add("ash-built");window.scrollTo({top:0,behavior:"smooth"});
 }
 resize();raf=requestAnimationFrame(burnFrame);
 setTimeout(()=>{cancelAnimationFrame(raf);ctx.clearRect(0,0,w,h);buildPage().catch(()=>{root.classList.remove("ash-loading","ash-building");intro.remove()})},5600);
 addEventListener("resize",resize,{passive:true});
})();
