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
    status.textContent = "Jupiter could not be loaded. You can use the official Pump.fun link below.";
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
        status.textContent = "Jupiter could not complete this swap. Check liquidity, route availability and wallet balance, or use the official Pump.fun page.";
        status.classList.add("is-warning");
      }
    });
    status.textContent = "Jupiter swap is ready. Check every transaction detail in your wallet before signing.";
  } catch (error) {
    status.textContent = "The swap interface could not start. Use the official Pump.fun link below.";
    status.classList.add("is-warning");
  }
})();
