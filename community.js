import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

(() => {
  const config = window.CHILLFROG_SUPABASE || {};
  const $ = (id) => document.getElementById(id);
  const status = $("community-status");
  const authStatus = $("community-auth-status");
  const postStatus = $("community-post-status");
  const setStatus = (text) => { if (status) status.querySelector("span").textContent = text; };
  const setMessage = (el, text, error = false) => { if (el) { el.textContent = text; el.style.color = error ? "#ff9b9b" : ""; } };
  if (!config.url || !config.publishableKey) {
    setStatus("SUPABASE PROJECT NOT CONNECTED");
    setMessage(authStatus, "Community accounts are waiting for the dedicated ChillFrog Supabase project.");
    setMessage(postStatus, "Posting, voting and the leaderboard activate after the secure database is connected.");
    
    $("community-profile-form")?.querySelector("button") && ($("community-profile-form").querySelector("button").disabled = true);
    $("community-post-form")?.querySelectorAll("input,select,textarea,button").forEach(n => n.disabled = true);
    $("meme-submit") && ($("meme-submit").disabled = true);
    return;
  }

  
  let captchaToken = null, captchaWidgetId = null;
  const loginButton = $("community-profile-form")?.querySelector("button");
  const emailInput = $("community-email");
  const captchaBox = $("community-captcha");
  const authReady = config.emailAuthReady === true && Boolean(config.turnstileSiteKey);
  if (emailInput) emailInput.disabled = !authReady;
  if (loginButton) loginButton.disabled = !authReady;
  if (!config.emailAuthReady) setMessage(authStatus, "Email registration is temporarily closed while production email delivery is configured.");
  else if (!config.turnstileSiteKey) setMessage(authStatus, "Secure sign-in is waiting for anti-bot protection to be configured.");
  async function setupCaptcha() {
    if (!config.turnstileSiteKey || !captchaBox) return;
    if (!window.turnstile) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true; script.defer = true;
        script.onload = resolve; script.onerror = () => reject(new Error("Could not load anti-bot protection."));
        document.head.append(script);
      });
    }
    captchaWidgetId = window.turnstile.render(captchaBox, {
      sitekey: config.turnstileSiteKey,
      callback: token => { captchaToken = token; },
      "expired-callback": () => { captchaToken = null; },
      "error-callback": () => { captchaToken = null; setMessage(authStatus, "Anti-bot check failed. Please try again.", true); }
    });
  }
  setupCaptcha().catch(error => setMessage(authStatus, error.message, true));
  const db = createClient(config.url, config.publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  let user = null, profile = null, profilePromise = null;

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function safeLink(raw) {
    try { const u = new URL(raw); return ["https:","http:"].includes(u.protocol) ? u.href : ""; }
    catch { return ""; }
  }
  async function ensureProfile(activeUser) {
    user = activeUser;
    if (!user || user.is_anonymous) return;
    if (profile?.id === user.id) return profile;
    if (profilePromise) return profilePromise;
    profilePromise = (async () => {
      const { data: existing, error: lookupError } = await db.from("community_profiles").select("id,handle").eq("id", user.id).maybeSingle();
      if (lookupError) throw lookupError;
      if (existing) profile = existing;
      else {
        const handle = "Frog" + crypto.randomUUID().replace(/-/g,"").slice(0,8);
        const { data, error } = await db.from("community_profiles").insert({ id: user.id, handle }).select("id,handle").single();
        if (error) throw error;
        profile = data;
      }
      setMessage(authStatus, "Signed in securely. Your email stays private; public posts use an automatic Froggy ID.");
      $("community-post-form")?.querySelectorAll("input,select,textarea,button").forEach((n) => n.disabled = false);
      $("meme-submit") && ($("meme-submit").disabled = false);
      setStatus("CONNECTED · EMAIL VERIFIED");
      await refreshAll();
      return profile;
    })();
    try { return await profilePromise; }
    finally { profilePromise = null; }
  }
  async function sendLoginLink(email) {
    const cleanEmail = email.trim().toLowerCase();
    if (!captchaToken) throw new Error("Complete the anti-bot check first.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) throw new Error("Enter a valid email address.");
    const { data: current } = await db.auth.getSession();
    if (current.session?.user?.is_anonymous) await db.auth.signOut();
    const { error } = await db.auth.signInWithOtp({
      email: cleanEmail,
      options: { emailRedirectTo: window.location.origin + window.location.pathname, captchaToken }
    });
    if (error) throw error;
    if (window.turnstile && captchaWidgetId !== null) { window.turnstile.reset(captchaWidgetId); captchaToken = null; }
    setMessage(authStatus, "Check your inbox. We sent you a secure sign-in link. Your email will never appear publicly.");
  }
  async function uploadImage(file) {
    if (!file) return null;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 8 * 1024 * 1024) throw new Error("Use PNG, JPG or WebP under 8 MB.");
    const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
    const path = user.id + "/" + crypto.randomUUID() + "." + ext;
    const { error } = await db.storage.from("community-media").upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw error;
    return path;
  }
  async function submitPost({ kind, title, body, file }) {
    if (!user || !profile) throw new Error("Join the community first.");
    let image_path = null;
    if (file) image_path = await uploadImage(file);
    const { error } = await db.from("community_posts").insert({
      author_id: user.id, kind, title: title.trim(), body: body.trim(), image_path, status: "pending"
    });
    if (error) {
      if (image_path) await db.storage.from("community-media").remove([image_path]);
      throw error;
    }
    return true;
  }
  function renderLeaderboard(rows) {
    const box = $("community-leaderboard"); if (!box) return;
    box.replaceChildren();
    if (!rows?.length) { box.append(el("div","hub-empty","No approved community contributions yet. Be the first to join.")); return; }
    rows.forEach((row, i) => {
      const item = el("div","leaderboard-row");
      item.append(el("span","rank",String(i+1).padStart(2,"0")));
      const person = el("div"); person.append(el("strong","", "@"+row.handle), el("small","", (row.approved_posts||0)+" posts · "+(row.approved_missions||0)+" missions"));
      item.append(person, el("b","", (row.points||0)+" PTS")); box.append(item);
    });
  }
  async function renderFeed(rows) {
    const box = $("community-feed"); if (!box) return;
    box.replaceChildren();
    if (!rows?.length) { box.append(el("div","hub-empty","No approved posts yet. Share an idea or create a meme.")); return; }
    for (const row of rows) {
      const card = el("article","community-post");
      const handle = row.community_profiles?.handle || "Swamp member";
      const top = el("div","community-post-head");
      top.append(el("span","",row.kind.toUpperCase()),el("time","",new Date(row.created_at).toLocaleDateString()));
      card.append(top,el("h4","",row.title),el("p","",row.body),el("small","", "@"+handle));
      if (row.image_path) {
        const { data } = await db.storage.from("community-media").createSignedUrl(row.image_path,3600);
        if (data?.signedUrl) { const img=el("img");img.src=data.signedUrl;img.alt="Community creation";img.loading="lazy";card.append(img); }
      }
      const actions=el("div","community-post-actions");
      const like=el("button","","♥ "+((row.community_post_likes?.[0]?.count)||0)+" LIKE");
      like.type="button";like.addEventListener("click",async()=>{if(!user){setMessage(authStatus,"Join first to like posts.");return}like.disabled=true;const {error}=await db.from("community_post_likes").insert({post_id:row.id,user_id:user.id});if(error&&error.code!=="23505")setMessage(postStatus,error.message,true);else like.textContent="♥ LIKED";});
      const report=el("button","report-post","REPORT");report.type="button";report.addEventListener("click",async()=>{if(!user){setMessage(authStatus,"Join first to report content.");return}const details=window.prompt("Tell moderators why this post should be reviewed (optional, max 500 characters):");if(details===null)return;const {error}=await db.from("community_reports").insert({reporter_id:user.id,post_id:row.id,reason:"other",details:details.slice(0,500)});setMessage(postStatus,error?error.message:"Report sent to moderators.",!!error)});
      actions.append(like,report);card.append(actions);box.append(card);
    }
  }
  async function loadBuyerLeaderboard() {
    const box=$("buyer-leaderboard");if(!box)return;
    const {data,error}=await db.from("token_buyer_leaderboard").select("wallet_address,buy_volume_usd,buy_count").eq("period","24h").order("buy_volume_usd",{ascending:false}).limit(5);
    box.replaceChildren();
    if(error||!data?.length){box.append(el("span","buyer-empty","Live buyer ranking activates after the Birdeye server sync is configured."));return}
    data.forEach((row,i)=>{const item=el("div","buyer-chip");const wallet=row.wallet_address;const short=wallet.slice(0,4)+"…"+wallet.slice(-4);item.append(el("b","",String(i+1).padStart(2,"0")),el("span","",short),el("strong","", "$"+Number(row.buy_volume_usd).toLocaleString("en-US",{maximumFractionDigits:2})));const copy=el("button","","COPY");copy.type="button";copy.addEventListener("click",()=>navigator.clipboard?.writeText(wallet));item.append(copy);box.append(item)});
  }
  async function loadEvents() {
    const box=$("community-events");if(!box)return;
    const {data,error}=await db.from("community_events").select("id,title,description,event_type,starts_at,url").eq("status","published").gte("starts_at",new Date().toISOString()).order("starts_at").limit(5);
    box.replaceChildren();
    if(error||!data?.length){box.append(el("div","hub-empty","No upcoming events have been published."));return}
    data.forEach(event=>{const item=el("div","event-item");item.append(el("strong","",event.title),el("p","",event.description),el("small","",new Date(event.starts_at).toLocaleString()+" · "+event.event_type.toUpperCase()));const href=safeLink(event.url||"");if(href){const a=el("a","","JOIN EVENT ↗");a.href=href;a.target="_blank";a.rel="noopener noreferrer";item.append(a)}box.append(item)});
  }
  async function loadPolls() {
    const box=$("community-polls");if(!box)return;
    const {data,error}=await db.from("community_polls").select("id,title,description,ends_at,community_poll_options(id,label)").eq("status","open").gt("ends_at",new Date().toISOString()).order("ends_at").limit(4);
    box.replaceChildren();
    if(error||!data?.length){box.append(el("div","hub-empty","No open polls right now."));return}
    data.forEach(poll=>{const card=el("div","poll-card");card.append(el("strong","",poll.title),el("p","",poll.description||"Vote and help shape the project."));const options=el("div","poll-options");(poll.community_poll_options||[]).forEach(option=>{const b=el("button","poll-option",option.label+"  →");b.type="button";b.addEventListener("click",async()=>{if(!user){setMessage(authStatus,"Join the community to vote.");return}b.disabled=true;const {error}=await db.from("community_poll_votes").insert({poll_id:poll.id,option_id:option.id,user_id:user.id});setMessage(postStatus,error?(error.code==="23505"?"You have already voted in this poll.":error.message):"Your vote has been recorded.",!!error)});options.append(b)});card.append(options);box.append(card)});
  }
  async function loadMissions() {
    const box=$("community-missions");if(!box)return;
    const {data,error}=await db.from("community_missions").select("id,title,description,points,ends_at").eq("status","active").order("starts_at").limit(5);
    box.replaceChildren();
    if(error||!data?.length){box.append(el("div","hub-empty","No active missions. Check back soon."));return}
    data.forEach(m=>{const item=el("div","mission-item");item.append(el("strong","",m.title),el("p","",m.description),el("small","",m.points+" COMMUNITY POINTS"));const b=el("button","mission-action","SUBMIT COMPLETION");b.type="button";b.addEventListener("click",async()=>{if(!user){setMessage(authStatus,"Join first to take part.");return}const note=window.prompt("Briefly describe what you completed (no personal details):");if(note===null)return;const {error}=await db.from("community_mission_completions").insert({mission_id:m.id,user_id:user.id,note:note.slice(0,400),status:"pending"});setMessage(postStatus,error?(error.code==="23505"?"You already submitted this mission.":error.message):"Mission sent for review.",!!error)});item.append(b);box.append(item)});
  }
  async function loadModeration() {
    if(!user)return;
    const {data:mod}=await db.from("community_moderators").select("user_id").eq("user_id",user.id).maybeSingle();
    if(!mod)return;
    $("community-moderation").hidden=false;
    const box=$("community-pending");const {data,error}=await db.from("community_posts").select("id,kind,title,body,created_at,community_profiles(handle)").eq("status","pending").order("created_at").limit(30);
    box.replaceChildren();if(error){box.append(el("p","",error.message));return}
    if(!data?.length){box.append(el("div","hub-empty","The moderation queue is clear."));return}
    data.forEach(post=>{const item=el("div","moderation-item"),copy=el("div");copy.append(el("strong","",post.title+" · @"+(post.community_profiles?.handle||"member")),el("p","",post.body));const actions=el("div","moderation-actions");for(const [label,value] of [["APPROVE","approved"],["REJECT","rejected"]]){const b=el("button",value==="approved"?"approve":"",label);b.type="button";b.addEventListener("click",async()=>{b.disabled=true;const {error}=await db.from("community_posts").update({status:value}).eq("id",post.id);if(error){setMessage(postStatus,error.message,true);b.disabled=false}else{item.remove();refreshAll()}});actions.append(b)}item.append(copy,actions);box.append(item)});
  }
  async function refreshAll() {
    const [leader,feed]=await Promise.all([
      db.from("community_leaderboard").select("handle,points,approved_posts,approved_missions").order("points",{ascending:false}).limit(5),
      db.from("community_posts").select("id,kind,title,body,image_path,created_at,community_profiles(handle),community_post_likes(count)").eq("status","approved").order("created_at",{ascending:false}).limit(12)
    ]);
    if(!leader.error)renderLeaderboard(leader.data);else setMessage(postStatus,"Leaderboard: "+leader.error.message,true);
    if(!feed.error)await renderFeed(feed.data);else setMessage(postStatus,"Community feed: "+feed.error.message,true);
    await Promise.all([loadEvents(),loadPolls(),loadMissions(),loadModeration(),loadBuyerLeaderboard()]);
  }
  $("community-profile-form")?.addEventListener("submit",async event=>{event.preventDefault();const btn=event.currentTarget.querySelector("button");btn.disabled=true;try{await sendLoginLink($("community-email").value)}catch(error){setMessage(authStatus,error.message||"Could not send the sign-in email.",true);setStatus("EMAIL SIGN-IN ERROR")}finally{btn.disabled=false}});
  $("community-post-form")?.addEventListener("submit",async event=>{event.preventDefault();const form=event.currentTarget,btn=form.querySelector("button[type=submit]");btn.disabled=true;try{await submitPost({kind:$("community-post-kind").value,title:$("community-post-title").value,body:$("community-post-body").value,file:$("community-post-image").files?.[0]});form.reset();setMessage(postStatus,"Submitted for moderation. It will appear publicly after approval.")}catch(error){setMessage(postStatus,error.message,true)}finally{btn.disabled=false}});
  $("meme-submit")?.addEventListener("click",async()=>{const btn=$("meme-submit");btn.disabled=true;try{const canvas=$("meme-canvas");const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/png"));if(!blob)throw new Error("Could not export meme.");await submitPost({kind:"meme",title:$("meme-top").value.trim()||"ChillFrog meme",body:$("meme-bottom").value.trim()||"Community meme",file:new File([blob],"chillfrog-meme.png",{type:"image/png"})});setMessage(postStatus,"Meme sent for moderation. Join the community if you have not already.");$("community-hub")?.scrollIntoView({behavior:"smooth"})}catch(error){setMessage(postStatus,error.message,true);$("community-hub")?.scrollIntoView({behavior:"smooth"})}finally{btn.disabled=false}});
  setStatus("READY · JOIN TO PARTICIPATE");
  db.auth.onAuthStateChange((_event,session)=>{
    user=session?.user||null;
    if (user && !user.is_anonymous) window.setTimeout(()=>ensureProfile(user).catch(error=>setMessage(authStatus,error.message,true)),0);
    else if (!user) { profile=null; $("community-post-form")?.querySelectorAll("input,select,textarea,button").forEach((n)=>n.disabled=true); $("meme-submit") && ($("meme-submit").disabled=true); }
  });
  db.auth.getSession().then(({data,error})=>{if(error)throw error;if(data.session?.user&&!data.session.user.is_anonymous)ensureProfile(data.session.user)}).catch(error=>setMessage(authStatus,error.message,true));
  refreshAll().catch(error=>setMessage(postStatus,error.message,true));
})();
