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
