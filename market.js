// Compact live CFROG dashboard powered by Jupiter Tokens API v2.
(function(){
 const mint="5dfEAdnAXweREFoozFfVpENeoFcHFJcAuxZw6oYVpump";
 const ids=["market-price","market-change","market-mcap","market-liquidity","market-holders","market-volume","market-updated","market-source"];
 const el=Object.fromEntries(ids.map(id=>[id,document.getElementById(id)]));
 if(!el["market-price"])return;
 const money=v=>{if(!Number.isFinite(Number(v)))return "—";const n=Number(v);if(n===0)return "$0";if(n<.000001)return "$"+n.toExponential(2);if(n<.01)return "$"+n.toFixed(8);if(n<1)return "$"+n.toFixed(5);return "$"+n.toLocaleString("en-US",{maximumFractionDigits:4})};
 const compact=v=>{if(v===null||v===undefined||!Number.isFinite(Number(v)))return "—";return new Intl.NumberFormat("en-US",{notation:"compact",maximumFractionDigits:2}).format(Number(v))};
 const find=(obj,keys)=>{for(const k of keys){const v=k.split(".").reduce((o,p)=>o?.[p],obj);if(v!==undefined&&v!==null&&Number.isFinite(Number(v)))return Number(v)}return null};
 async function load(){try{
  const response=await fetch("https://api.jup.ag/tokens/v2/search?query="+encodeURIComponent(mint),{headers:{accept:"application/json"},cache:"no-store"});
  if(!response.ok)throw new Error("Jupiter returned "+response.status);
  const payload=await response.json(),token=Array.isArray(payload)?payload.find(x=>x.id===mint||x.address===mint):payload?.tokens?.find(x=>x.id===mint)||payload;
  if(!token||!(token.usdPrice||token.price))throw new Error("Token data not indexed by Jupiter");
  const price=find(token,["usdPrice","price"]),mcap=find(token,["mcap","marketCap"]),liq=find(token,["liquidity","liquidityUsd"]),holders=find(token,["holderCount","holders"]),stats=token.stats24h||token.stats?.["24h"]||token.stats?.h24||{};
  const vol=find(token,["volume24h","volume24H","stats24h.volume","stats.h24.volume"]);
  const buy=find(stats,["buyVolume","buy_volume","volumeBuy"]),sell=find(stats,["sellVolume","sell_volume","volumeSell"]),volume=vol??(buy!==null&&sell!==null?buy+sell:null);
  const change=find(token,["priceChange24h","stats24h.priceChange","stats.h24.priceChange"]);
  el["market-price"].textContent=money(price);el["market-mcap"].textContent=mcap===null?"—":"$"+compact(mcap);el["market-liquidity"].textContent=liq===null?"—":"$"+compact(liq);el["market-holders"].textContent=holders===null?"—":compact(holders);el["market-volume"].textContent=volume===null?"—":"$"+compact(volume);
  if(change===null){el["market-change"].textContent="24h change unavailable";el["market-change"].className="market-change"}else{el["market-change"].textContent=(change>0?"+":"")+change.toFixed(2)+"% · 24H";el["market-change"].className="market-change "+(change>0?"positive":change<0?"negative":"")}
  el["market-updated"].textContent="UPDATED "+new Date().toLocaleTimeString();el["market-source"].textContent="Source: Jupiter Tokens API v2 · Auto-refresh every 60 seconds. Missing metrics are not estimated.";
 }catch(error){el["market-updated"].textContent="DATA UNAVAILABLE";el["market-source"].textContent="Jupiter market data is temporarily unavailable. Check the official token page for current information.";}}
 load();setInterval(load,60000);
})();