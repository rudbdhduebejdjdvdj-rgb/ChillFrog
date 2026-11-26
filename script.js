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


// Leaf combustion: glowing edge, rising smoke and gravity-driven ash that reveals the page from top to bottom.
(function(){
 const root=document.documentElement,intro=document.getElementById("leaf-intro"),stage=intro?.querySelector(".leaf-stage"),canvas=document.getElementById("ash-canvas");
 if(!intro||!stage||!canvas)return;
 if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){intro.remove();root.classList.remove("ash-loading");return;}
 const ctx=canvas.getContext("2d");let w=0,h=0,dpr=1,particles=[],embers=[],smoke=[],start=0,raf=0,built=false;
 const rand=(a,b)=>a+Math.random()*(b-a);
 function resize(){dpr=Math.min(devicePixelRatio||1,2);w=innerWidth;h=innerHeight;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}
 function makeParticles(){const r=stage.getBoundingClientRect(),cx=r.left+r.width*.5,cy=r.top+r.height*.48,n=Math.min(2200,Math.max(900,Math.floor(w*h/330)));for(let i=0;i<n;i++){const a=rand(0,Math.PI*2),rad=Math.sqrt(Math.random()),x=cx+Math.cos(a)*r.width*.47*rad,y=cy+Math.sin(a)*r.height*.46*rad;particles.push({x,y,ox:x,oy:y,vx:rand(-34,34),vy:rand(12,75),g:rand(34,105),size:rand(.45,2.4),rot:rand(0,6.28),spin:rand(-4,4),alpha:rand(.25,.88),delay:rand(0,1.7),settled:false,ember:Math.random()<.12})}}
 function pageBuild(){if(built)return;built=true;root.classList.remove("ash-loading");root.classList.add("ash-built");const sections=[...document.querySelectorAll("header,main>section,main>.buyers-strip,footer,.disclaimer")];sections.forEach((el,i)=>el.style.setProperty("--ash-delay",(i*.24)+"s"))}
 function puff(x,y,amount){for(let i=0;i<amount;i++)smoke.push({x:x+rand(-12,12),y:y+rand(-8,8),vx:rand(-13,13),vy:rand(-34,-9),life:rand(1.3,2.8),age:0,size:rand(10,28),alpha:rand(.025,.09)})}
 function flame(x,y,scale,age){const flicker=.75+Math.random()*.55;ctx.save();ctx.globalCompositeOperation="screen";for(let k=0;k<3;k++){const fw=(5+k*5)*scale*flicker,fh=(18+k*17)*scale*flicker,ox=rand(-10,10)*scale,oy=rand(-8,8)*scale;const g=ctx.createLinearGradient(x+ox,y+fh,x+ox,y-fh);g.addColorStop(0,"rgba(255,48,8,0)");g.addColorStop(.35,"rgba(255,73,14,.48)");g.addColorStop(.72,"rgba(255,166,42,.56)");g.addColorStop(1,"rgba(255,229,154,0)");ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x+ox-fw,y);ctx.quadraticCurveTo(x+ox-fw*.75,y-fh*.5,x+ox,y-fh);ctx.quadraticCurveTo(x+ox+fw*.9,y-fh*.45,x+ox+fw,y);ctx.closePath();ctx.fill()}ctx.restore()}
 function draw(t){if(!start)start=t;const time=(t-start)/1000;ctx.clearRect(0,0,w,h);const r=stage.getBoundingClientRect(),cx=r.left+r.width*.5,cy=r.top+r.height*.52;
 // Flickering fire tongues crawl around the leaf and smoke rolls upward.
 if(time>1&&time<6.15){for(let i=0;i<30;i++){const a=(i/30)*Math.PI*2+Math.sin(time*1.4)*.025,x=cx+Math.cos(a)*r.width*(.37+rand(-.025,.025)),y=cy+Math.sin(a)*r.height*(.38+rand(-.025,.025));flame(x,y,rand(.48,1.05),time)}if(Math.random()<.7)puff(cx+rand(-r.width*.28,r.width*.28),cy-r.height*.24,2)}
 // Fine ash falls with gravity, swirls in the air and settles along the bottom edge.
 for(const p of particles){if(time<p.delay+2.25)continue;if(!p.settled){const dt=1/60;p.vy+=p.g*dt;p.vx+=Math.sin(time*1.6+p.rot)*.28;p.x+=p.vx*dt;p.y+=p.vy*dt;p.rot+=p.spin*dt;if(p.y>h-rand(0,8)){p.y=h-rand(0,5);p.settled=true;p.vx=0;p.vy=0}}ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.globalAlpha=p.alpha*(p.settled ? .82 : 1);ctx.fillStyle=p.ember?(Math.random()>.5?"#ff8c35":"#ffc06a"):(Math.random()>.5?"#d3cec2":"#77796d");ctx.beginPath();ctx.ellipse(0,0,p.size*(p.ember?1.25:.8),p.size*(p.ember?2.1:1.2),0,0,Math.PI*2);ctx.fill();if(p.ember){ctx.shadowBlur=9;ctx.shadowColor="#ff7a27";ctx.fillStyle="#ffb15a";ctx.fillRect(-.6,-p.size*2,1.2,p.size*3)}ctx.restore()}
 // Smoke has soft volume and dissipates as it rises.
 for(let i=smoke.length-1;i>=0;i--){const s=smoke[i];s.age+=1/60;s.x+=s.vx/60+Math.sin(time*1.1+i)*.12;s.y+=s.vy/60;const q=s.age/s.life;if(q>=1){smoke.splice(i,1);continue}ctx.globalAlpha=s.alpha*(1-q);const g=ctx.createRadialGradient(s.x,s.y,1,s.x,s.y,s.size*(.5+q));g.addColorStop(0,"rgba(36,39,32,.3)");g.addColorStop(1,"rgba(36,39,32,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(s.x,s.y,s.size*(.5+q),0,Math.PI*2);ctx.fill()}
 ctx.globalAlpha=1;
 // Once the ash has fallen, the real page is revealed in stacked top-to-bottom passes.
 if(time>5.1&&!built)pageBuild();
 if(time<8.8)raf=requestAnimationFrame(draw);else{pageBuild();ctx.clearRect(0,0,w,h);intro.remove()}
 }
 resize();makeParticles();raf=requestAnimationFrame(draw);addEventListener("resize",resize,{passive:true});
})();
