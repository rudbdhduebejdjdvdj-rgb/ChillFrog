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


// Burn the leaf into drifting ash, then use the ash trails to reveal the real page.
(function(){
 const root=document.documentElement, intro=document.getElementById("leaf-intro"), stage=intro?.querySelector(".leaf-stage"), canvas=document.getElementById("ash-canvas");
 if(!intro||!stage||!canvas)return;
 const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
 if(reduced){intro.remove();root.classList.remove("ash-loading");return;}
 const ctx=canvas.getContext("2d");let w=0,h=0,dpr=1,particles=[],start=0,raf=0;
 const rand=(a,b)=>a+Math.random()*(b-a);
 function resize(){dpr=Math.min(devicePixelRatio||1,2);w=innerWidth;h=innerHeight;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}
 function targets(){const nodes=[...document.querySelectorAll("header,main>section,main>.buyers-strip,footer,.disclaimer")];return nodes.map((el,i)=>{const r=el.getBoundingClientRect();return {x:rand(Math.max(0,r.left),Math.max(1,Math.min(w,r.right))),y:rand(Math.max(0,r.top),Math.max(1,Math.min(h,r.bottom))),delay:Math.min(1.7,i*.13)}})}
 function seed(){const r=stage.getBoundingClientRect(),dest=targets(),count=Math.min(1900,Math.max(700,Math.floor(w*h/430)));for(let i=0;i<count;i++){const a=rand(0,Math.PI*2),rad=Math.sqrt(Math.random()),sx=r.left+r.width*(.5+Math.cos(a)*.47*rad),sy=r.top+r.height*(.48+Math.sin(a)*.47*rad),t=dest[i%dest.length]||{x:rand(0,w),y:rand(0,h),delay:0};particles.push({sx,sy,tx:t.x+rand(-18,18),ty:t.y+rand(-12,12),delay:rand(.0,.95)+t.delay,duration:rand(1.15,2.5),size:rand(.45,2.3),spin:rand(0,9),vx:rand(-42,42),vy:rand(-90,-12),alpha:rand(.35,.95),ember:Math.random()<.14})}}
 function smoke(x,y,age){const radius=18+age*18;for(let i=0;i<4;i++){const ox=Math.sin(age*1.7+i*2)*radius*.35,oy=-age*26-i*11;const g=ctx.createRadialGradient(x+ox,y+oy,1,x+ox,y+oy,radius*(.45+i*.12));g.addColorStop(0,"rgba(25,29,24,"+(.12/(i+1))+")");g.addColorStop(1,"rgba(25,29,24,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(x+ox,y+oy,radius*(.45+i*.12),0,Math.PI*2);ctx.fill()}}
 function draw(t){if(!start)start=t;const time=(t-start)/1000;ctx.clearRect(0,0,w,h);const r=stage.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height*.55;
 if(time>1.1&&time<5.5){const intensity=Math.sin(Math.min(1,(time-1.1)/4.4)*Math.PI);for(let i=0;i<7;i++){const x=cx+Math.sin(time*3+i*1.9)*r.width*(.2+i*.025),y=cy+Math.cos(time*2+i)*r.height*.24;const flame=ctx.createRadialGradient(x,y,0,x,y,rand(22,65));flame.addColorStop(0,"rgba(255,220,125,"+(.22*intensity)+")");flame.addColorStop(.25,"rgba(255,104,24,"+(.16*intensity)+")");flame.addColorStop(1,"rgba(255,60,10,0)");ctx.fillStyle=flame;ctx.beginPath();ctx.ellipse(x,y,rand(10,28),rand(28,75),rand(-.3,.3),0,Math.PI*2);ctx.fill()}smoke(cx,cy,time-1.1)}
 for(const p of particles){const elapsed=time-2.7-p.delay;if(elapsed<0)continue;const q=Math.min(1,elapsed/p.duration),ease=q*q*(3-2*q),curl=Math.sin(elapsed*5+p.spin)*Math.sin(q*Math.PI)*18,x=p.sx+(p.tx-p.sx)*ease+curl+p.vx*(1-q)*.12,y=p.sy+(p.ty-p.sy)*ease+Math.cos(elapsed*4+p.spin)*12+p.vy*(1-q)*.08;ctx.globalAlpha=p.alpha*(1-q)*Math.min(1,elapsed*2);ctx.fillStyle=p.ember?(Math.random()>.5?"#ff9a3b":"#ffd18a"):(Math.random()>.5?"#c8c2b3":"#77796f");ctx.beginPath();ctx.ellipse(x,y,p.size*(p.ember?1.15:.8),p.size*(p.ember?1.9:1.25),p.spin+elapsed,0,Math.PI*2);ctx.fill();if(p.ember&&Math.random()>.7){ctx.strokeStyle="rgba(255,125,40,.18)";ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-p.vx*.18,y+5);ctx.stroke()}}
 ctx.globalAlpha=1;
 if(time>5.25&&!root.classList.contains("ash-built")){root.classList.add("ash-built");document.querySelectorAll("main>section,main>.buyers-strip").forEach((el,i)=>el.style.setProperty("--ash-delay",(i*.12)+"s"));setTimeout(()=>intro.remove(),1050)}
 if(time<7.1)raf=requestAnimationFrame(draw);else{ctx.clearRect(0,0,w,h);intro.remove()}
 }
 resize();seed();raf=requestAnimationFrame(draw);addEventListener("resize",resize,{passive:true});
})();
