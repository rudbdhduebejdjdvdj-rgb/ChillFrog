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


// Remove the intro overlay after its cinematic burn sequence.
(function(){
  const intro=document.getElementById("leaf-intro");
  if(!intro) return;
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){intro.remove();return;}
  document.body.classList.add("ash-revealing");
  window.setTimeout(()=>{intro.remove();document.body.classList.remove("ash-revealing");},8200);
})();

// Fine ash particles scatter from the burning leaf and sweep across the page.
(function(){
 const canvas=document.getElementById("ash-canvas"), intro=document.getElementById("leaf-intro");
 if(!canvas||!intro||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
 const ctx=canvas.getContext("2d");let w=0,h=0,particles=[],raf=0,start=0;
 function resize(){const d=Math.min(devicePixelRatio||1,2);w=innerWidth;h=innerHeight;canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0)}
 function seed(){const count=Math.min(1500,Math.floor(w*h/650)),cx=w/2,cy=h*.47;for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,r=18+Math.random()*115;particles.push({sx:cx+Math.cos(a)*r,sy:cy+Math.sin(a)*r*.82,tx:Math.random()*w,ty:Math.random()*h,size:.45+Math.random()*1.7,delay:Math.random()*.7,spin:Math.random()*8,alpha:.35+Math.random()*.65})}}
 function frame(t){if(!start)start=t;const elapsed=(t-start)/1000;ctx.clearRect(0,0,w,h);if(elapsed>2.4){for(const p of particles){const q=Math.max(0,Math.min(1,(elapsed-2.4-p.delay)/2.2)),e=1-Math.pow(1-q,3),x=p.sx+(p.tx-p.sx)*e+Math.sin(elapsed*2+p.spin)*5,y=p.sy+(p.ty-p.sy)*e+Math.cos(elapsed*1.7+p.spin)*4;ctx.globalAlpha=p.alpha*(1-q*.82);ctx.fillStyle=elapsed<4.9?"#d7c7a0":"#f2bd42";ctx.beginPath();ctx.arc(x,y,p.size*(1-q*.35),0,Math.PI*2);ctx.fill()}}ctx.globalAlpha=1;if(elapsed<5.3)raf=requestAnimationFrame(frame);else ctx.clearRect(0,0,w,h)}
 resize();seed();setTimeout(()=>{cancelAnimationFrame(raf);start=0;raf=requestAnimationFrame(frame)},2750);addEventListener("resize",resize,{passive:true});
})();
