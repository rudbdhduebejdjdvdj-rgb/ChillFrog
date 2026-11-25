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
