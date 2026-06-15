const {useState,useEffect,useMemo,useRef} = React;

/* ---------- shared formatting + client-side model (mirrors lib/*) ---------- */
const fmt = (n,d=0)=> (n==null||isNaN(n))?'—':Number(n).toLocaleString(undefined,{maximumFractionDigits:d,minimumFractionDigits:d>0?0:0});
const api = async (url,opts)=>{const r=await fetch(url,opts);if(!r.ok)throw new Error((await r.json().catch(()=>({}))).error||r.status);return r.json();};
const CFG = {
  ICE_CO2_PER_KM:0.192, GRID_CO2_PER_KWH:0.233, ICE_FUEL_PER_KM:0.071, CO2_PER_TREE_YEAR:21, PETROL_CO2_PER_L:2.31,
  EFF_TARGET:15, EFF_CEIL:28, POINTS_PER_KM:1, ECO_BONUS:60, POINTS_PER_KG:2, CHARGE_BONUS:25,
};
const POWERTRAINS={
  BEV:{label:'Battery Electric',electricShare:1.0,plugIn:true,hybridFuelFactor:0},
  PHEV:{label:'Plug-in Hybrid',electricShare:0.62,plugIn:true,hybridFuelFactor:0.78},
  HEV:{label:'Hybrid',electricShare:0.30,plugIn:false,hybridFuelFactor:0.62},
};
// Live trip computation for the Simulator Lab — mirrors lib/simulator + lib/co2.
function computeTrip(p, pt='BEV'){
  const P=POWERTRAINS[pt]||POWERTRAINS.BEV;
  const {distanceKm,aggression,regen,avgSpeedKph,batteryFriendlyCharge}=p;
  const speedPenalty=Math.max(0,avgSpeedKph-90)*0.05;
  const aggrPenalty=aggression*7;
  const regenSaving=aggrPenalty*regen*0.6;
  const consumption=Math.max(11,16+speedPenalty+aggrPenalty-regenSaving); // full kWh/100km basis
  const energyUsedKwh=consumption/100*distanceKm*P.electricShare;
  const baseline=distanceKm*CFG.ICE_CO2_PER_KM;
  const evCo2=energyUsedKwh*CFG.GRID_CO2_PER_KWH;
  const fuelLitres=distanceKm*(1-P.electricShare)*CFG.ICE_FUEL_PER_KM*P.hybridFuelFactor;
  const co2SavedKg=Math.max(0,baseline-evCo2-fuelLitres*CFG.PETROL_CO2_PER_L);
  const fuelSaved=distanceKm*CFG.ICE_FUEL_PER_KM*1.7-(energyUsedKwh*0.28+fuelLitres*1.7);
  const effRatio=Math.min(1,Math.max(0,(CFG.EFF_CEIL-consumption)/(CFG.EFF_CEIL-CFG.EFF_TARGET)));
  const harshB=Math.max(0,Math.round(distanceKm/14*aggression*(1-regen*0.7)));
  const harshA=Math.max(0,Math.round(distanceKm/12*aggression));
  let smooth=30-harshB*4-harshA*4; smooth=Math.min(30,Math.max(0,smooth));
  const ecoScore=Math.round(Math.min(100,effRatio*70+smooth));
  const chargeBonus=(P.plugIn&&batteryFriendlyCharge)?CFG.CHARGE_BONUS:0;
  const pts=Math.round(distanceKm*CFG.POINTS_PER_KM + ecoScore/100*CFG.ECO_BONUS + co2SavedKg*CFG.POINTS_PER_KG + chargeBonus);
  return {consumption,energyUsedKwh,co2SavedKg,fuelSaved,ecoScore,pointsEarned:pts,harshB,harshA,chargeBonus,plugIn:P.plugIn};
}
function gradeOf(s){return s>=90?'A+':s>=80?'A':s>=70?'B':s>=60?'C':s>=50?'D':'E';}
function gradeColor(s){return s>=80?'#0aa472':s>=60?'#108fb0':s>=50?'#c47a08':'#dc4a5c';}

/* ---------- icon system (line icons, no emoji) ---------- */
function Icon({name,size=20,className,stroke=1.8}){
  const inner={
    grid:<><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    sliders:<><line x1="4" y1="8" x2="20" y2="8"/><line x1="4" y1="16" x2="20" y2="16"/><circle cx="9" cy="8" r="2.6" fill="var(--panel)"/><circle cx="15" cy="16" r="2.6" fill="var(--panel)"/></>,
    battery:<><rect x="2.5" y="7" width="16" height="10" rx="2.2"/><line x1="21.5" y1="10.5" x2="21.5" y2="13.5"/><rect x="5" y="9.5" width="6.5" height="5" rx="1" fill="currentColor" stroke="none"/></>,
    leaf:<><path d="M4 20c0-8 6-14 16-14 0 10-6 16-16 14z"/><path d="M9 15c3-3 5-4 8-5"/></>,
    gift:<><rect x="3.5" y="9" width="17" height="11" rx="1.5"/><line x1="12" y1="9" x2="12" y2="20"/><line x1="3.5" y1="13" x2="20.5" y2="13"/><path d="M12 9C9.5 9 7.5 7.8 7.5 6.3S9 4.5 10 5.3 12 9 12 9zM12 9c2.5 0 4.5-1.2 4.5-2.7S15 4.5 14 5.3 12 9 12 9z"/></>,
    target:<><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.6"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/></>,
    trophy:<><path d="M7 4h10v4a5 5 0 01-10 0z"/><path d="M7 5.5H4.6V7A3.4 3.4 0 008 10.4M17 5.5h2.4V7A3.4 3.4 0 0116 10.4"/><line x1="12" y1="13" x2="12" y2="16"/><line x1="8.5" y1="20" x2="15.5" y2="20"/><line x1="9.5" y1="20" x2="9.5" y2="16.5"/><line x1="14.5" y1="20" x2="14.5" y2="16.5"/></>,
    flame:<><path d="M12 3c1.6 3 4.2 4.6 4.2 8.2A4.2 4.2 0 017.8 11C7.8 9.7 8.2 9 8.8 8.2 9 10 11 8.5 12 3z"/></>,
    star:<><path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8L3.6 9.7l5.8-.8z"/></>,
    bolt:<><path d="M13 2.5L5 13.5h5l-1 8 9-12h-5z"/></>,
    shield:<><path d="M12 3l7 3v5c0 5-3.4 8-7 9-3.6-1-7-4-7-9V6z"/><path d="M9 12l2 2 4-4"/></>,
    tree:<><path d="M12 3l5 7.5h-3l4 6H6l4-6H7z"/><line x1="12" y1="16.5" x2="12" y2="21"/></>,
    wrench:<><circle cx="12" cy="12" r="3.2"/><path d="M12 3.2v3M12 17.8v3M3.2 12h3M17.8 12h3M5.8 5.8l2.1 2.1M16.1 16.1l2.1 2.1M5.8 18.2l2.1-2.1M16.1 7.9l2.1-2.1"/></>,
    coffee:<><path d="M4.5 8.5h11.5v5a4 4 0 01-4 4H8.5a4 4 0 01-4-4z"/><path d="M16 9.5h2.3a2.3 2.3 0 010 4.6H16"/><path d="M7.5 3v2M10.5 3v2M13.5 3v2"/></>,
    droplet:<><path d="M12 3.5c3.5 4.5 5.5 7.5 5.5 10.5a5.5 5.5 0 01-11 0c0-3 2-6 5.5-10.5z"/></>,
    plug:<><path d="M9 3v4M15 3v4"/><path d="M6.5 7h11v2.5a5.5 5.5 0 01-11 0z"/><line x1="12" y1="15" x2="12" y2="21"/></>,
    globe:<><circle cx="12" cy="12" r="8.5"/><line x1="3.5" y1="12" x2="20.5" y2="12"/><path d="M12 3.5c2.6 2.6 2.6 14.4 0 17M12 3.5c-2.6 2.6-2.6 14.4 0 17"/></>,
    road:<><path d="M8.5 4L5 20M15.5 4L19 20M12 5.5v2M12 11v2M12 16.5v2"/></>,
    car:<><path d="M3 13l1.8-4.6A2.2 2.2 0 016.9 7h10.2a2.2 2.2 0 012.1 1.4L21 13"/><path d="M3 13h18v4.2H3z"/><circle cx="7.2" cy="17.4" r="1.5"/><circle cx="16.8" cy="17.4" r="1.5"/></>,
    check:<><path d="M5 12.5l4.5 4.5L19 7.5"/></>,
    alert:<><path d="M12 4.5l8.5 15h-17z"/><line x1="12" y1="10" x2="12" y2="14"/><circle cx="12" cy="16.7" r="0.7" fill="currentColor" stroke="none"/></>,
    bulb:<><path d="M9.5 17.5h5M10.5 20.5h3"/><path d="M12 3.5a6 6 0 00-3.8 10.6c.7.6 1 1.2 1 2.4h5.6c0-1.2.3-1.8 1-2.4A6 6 0 0012 3.5z"/></>,
    flag:<><path d="M6 21V4M6 4.5h11l-2 3.4 2 3.4H6"/></>,
    wallet:<><rect x="3.5" y="6.5" width="17" height="12" rx="2.2"/><path d="M16.5 12.5h1.6"/><path d="M3.5 10h12.5a1.5 1.5 0 011.5 1.5"/></>,
    gauge:<><path d="M4.5 17a7.5 7.5 0 0115 0"/><line x1="12" y1="17" x2="15.5" y2="11.5"/><circle cx="12" cy="17" r="1.3" fill="currentColor" stroke="none"/></>,
    trend:<><path d="M4 7l6 6 3.5-3.5L20 16"/><path d="M20 11v5h-5"/></>,
    play:<><path d="M7.5 5.5l11 6.5-11 6.5z"/></>,
    refresh:<><path d="M4.5 12a7.5 7.5 0 0112.7-5.4L20 9M20 4.5V9h-4.5"/><path d="M19.5 12a7.5 7.5 0 01-12.7 5.4L4 15M4 19.5V15h4.5"/></>,
    arrow:<><line x1="4" y1="12" x2="18.5" y2="12"/><path d="M13.5 7l5 5-5 5"/></>,
  }[name]||null;
  return <svg width={size} height={size} viewBox="0 0 24 24" className={'ic '+(className||'')}
    fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{inner}</svg>;
}
function Pt({code,small}){
  return <span className={'ptbadge'+(small?' sm':'')} title={(POWERTRAINS[code]||{}).label||code}>
    <Icon name={code==='HEV'?'car':'bolt'} size={small?12:13} stroke={2}/>{code}</span>;
}

/* ---------- tiny SVG chart primitives ---------- */
function Gauge({value,max=100,size=140,label,color}){
  const r=size/2-12, c=2*Math.PI*r, pct=Math.min(1,value/max);
  color=color||'#0aa472';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs><linearGradient id="gg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#0aa472"/><stop offset="100%" stopColor="#108fb0"/></linearGradient></defs>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e6ecf3" strokeWidth="11"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color==='grad'?'url(#gg)':color} strokeWidth="11"
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c*(1-pct)}
        transform={`rotate(-90 ${size/2} ${size/2})`} style={{transition:'stroke-dashoffset .6s'}}/>
      <text x="50%" y="47%" textAnchor="middle" fontSize="26" fontWeight="800" fill="#0f1d2e">{fmt(value,value<10?1:0)}</text>
      <text x="50%" y="63%" textAnchor="middle" fontSize="11" fill="#5b6b7d">{label}</text>
    </svg>
  );
}
function AreaChart({data,height=120,color='#0aa472'}){
  const w=560; const max=Math.max(...data,1); const min=0;
  if(!data.length) return <div className="muted small">No data</div>;
  const step=w/(data.length-1||1);
  const pts=data.map((v,i)=>[i*step, height-((v-min)/(max-min||1))*(height-10)-5]);
  const path=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  const area=path+` L ${w} ${height} L 0 ${height} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} preserveAspectRatio="none">
      <defs><linearGradient id="ar" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.32"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      <path d={area} fill="url(#ar)"/>
      <path d={path} fill="none" stroke={color} strokeWidth="2.5"/>
    </svg>
  );
}
function Bars({data,height=120,color='#108fb0'}){
  const max=Math.max(...data.map(d=>d.v),1); const bw=100/data.length;
  return (
    <svg viewBox="0 0 100 100" width="100%" height={height} preserveAspectRatio="none">
      {data.map((d,i)=>{const h=(d.v/max)*92;return(
        <rect key={i} x={i*bw+bw*0.18} y={100-h} width={bw*0.64} height={h} rx="1.2"
          fill={color} opacity={0.5+0.5*(d.v/max)}/>);})}
    </svg>
  );
}

/* ---------- shells ---------- */
function Stat({label,value,unit,icon,delta}){
  return <div className="card stat">
    <div className="row between"><div className="lab">{label}</div><span className="cardicon"><Icon name={icon} size={19}/></span></div>
    <div className="val">{value}<span className="unit">{unit}</span></div>
    {delta&&<div className="delta">{delta}</div>}
  </div>;
}
function Progress({pct}){return <div className="bar"><i style={{width:Math.min(100,Math.max(0,pct))+'%'}}/></div>;}
function recIcon(impact){return impact==='low'?'check':impact==='high'?'alert':'bulb';}

/* ===================== VIEWS ===================== */
function Dashboard({me,go}){
  const trips=me.recentTrips||[];
  const series=useMemo(()=>{
    const ordered=[...trips].reverse(); let acc=0; return ordered.map(t=>acc+= (t.co2SavedKg||0));
  },[me]);
  const b=me.battery; const pv=me.primaryVehicle||{};
  return <div className="grid" style={{gap:16}}>
    <div className="grid g4">
      <Stat label="CO₂ Avoided" value={fmt(me.impact.totalCo2SavedKg)} unit="kg" icon="leaf" delta={`≈ ${fmt(me.impact.treesEquivalent,1)} trees/yr`}/>
      <Stat label="Eco-Credits" value={fmt(me.loyalty.balance)} unit="pts" icon="star" delta={`${me.loyalty.tier.name} · ${me.loyalty.tier.multiplier}× earning`}/>
      <Stat label="Driving Grade" value={me.avgEcoGrade} unit="" icon="flag" delta={`${me.avgEcoScore}/100 avg eco score`}/>
      <Stat label="Battery Health" value={fmt(b?b.soh:0,1)} unit="%" icon="battery" delta={`${b?b.projection.estimatedYearsRemaining:0} yrs to floor`}/>
    </div>
    <div className="grid g3">
      <div className="card" style={{gridColumn:'span 2'}}>
        <div className="row between"><h3>Cumulative CO₂ Saved</h3><span className="pill good">{fmt(me.impact.fuelLitresAvoided)} L fuel avoided</span></div>
        <AreaChart data={series.length?series:[0,0]}/>
        <div className="row between small muted" style={{marginTop:10}}>
          <span>{me.tripCount} trips logged</span><span>${fmt(me.impact.costSaved)} saved vs petrol</span>
        </div>
      </div>
      <div className="card" style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
        <h3 style={{alignSelf:'flex-start'}}>Loyalty Tier</h3>
        <div className="tierbadge" style={{background:me.loyalty.tier.color,marginBottom:14}}>{me.loyalty.tier.name}</div>
        {me.loyalty.tier.next? <>
          <div className="small muted" style={{marginBottom:8}}>{fmt(me.loyalty.tier.pointsToNext)} pts to {me.loyalty.tier.next}</div>
          <div style={{width:'100%'}}><Progress pct={me.loyalty.tier.progressPct}/></div>
        </> : <div className="small muted">Top tier reached</div>}
        <div className="row" style={{marginTop:16,gap:22}}>
          <div style={{textAlign:'center'}}><div className="b row" style={{fontSize:22,gap:6,justifyContent:'center'}}><Icon name="flame" size={20} className="accent"/>{me.loyalty.streak}</div><div className="small muted">day streak</div></div>
          <div style={{textAlign:'center'}}><div className="b" style={{fontSize:22}}>{me.loyalty.badges.filter(x=>x.earned).length}</div><div className="small muted">badges</div></div>
        </div>
      </div>
    </div>
    <div className="grid g2">
      <div className="card"><div className="row between"><h3>Recent Trips</h3><button className="btn ghost small" onClick={()=>go('lab')}>Drive in Lab</button></div>
        {trips.slice(0,6).map(t=><div className="trip" key={t.id}>
          <div className="grade" style={{background:gradeColor(t.ecoScore)+'1f',color:gradeColor(t.ecoScore)}}>{gradeOf(t.ecoScore)}</div>
          <div style={{flex:1,minWidth:0}}><div className="b">{t.profile}</div>
            <div className="small muted">{fmt(t.distanceKm,1)} km · {fmt(t.energyUsedKwh,1)} kWh · {new Date(t.endedAt).toLocaleDateString()}</div></div>
          <div style={{textAlign:'right'}}><div className="b" style={{color:'var(--accent)'}}>+{fmt(t.pointsEarned)}</div><div className="small muted">{fmt(t.co2SavedKg,1)} kg CO₂</div></div>
        </div>)}
        {!trips.length&&<div className="muted small">No trips yet — open the Simulator Lab.</div>}
      </div>
      <div className="card"><div className="row between"><h3>Battery Care</h3><Pt code={pv.powertrain||'BEV'} small/></div>
        {b&&b.recommendations.map(r=><div key={r.id} className={r.impact==='low'?'okbox':'warnbox'} style={{marginBottom:10}}>
          <Icon name={recIcon(r.impact)} size={18}/><div>{r.text}</div></div>)}
        <button className="btn ghost row" style={{marginTop:6,gap:6}} onClick={()=>go('battery')}>Full battery report <Icon name="arrow" size={16}/></button>
      </div>
    </div>
  </div>;
}

function Lab({me,userId,onLogged,toast}){
  const v=me.primaryVehicle||{};
  const pt=v.powertrain||'BEV';
  const plugIn=(POWERTRAINS[pt]||POWERTRAINS.BEV).plugIn;
  const [p,setP]=useState({distanceKm:25,aggression:0.35,regen:0.6,avgSpeedKph:60,parkTemp:28,batteryFriendlyCharge:true});
  const [busy,setBusy]=useState(false);
  const r=useMemo(()=>computeTrip(p,pt),[p,pt]);
  const set=(k)=>(e)=>setP(s=>({...s,[k]:parseFloat(e.target.value)}));
  const tempHot=p.parkTemp>=35;
  const log=async()=>{
    setBusy(true);
    try{
      const res=await api('/api/trips/simulate',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({userId,params:{distanceKm:p.distanceKm,aggression:p.aggression,regen:p.regen,avgSpeedKph:p.avgSpeedKph,batteryFriendlyCharge:p.batteryFriendlyCharge}})});
      toast(`Drive logged · +${fmt(res.trip.pointsEarned)} Eco-Credits · Grade ${res.trip.feedback.grade}`);
      onLogged(res.profile);
    }catch(e){toast('Error: '+e.message);}finally{setBusy(false);}
  };
  return <div className="grid g2" style={{alignItems:'start'}}>
    <div className="card">
      <div className="row between"><h3>Drive Configuration — {v.make} {v.model}</h3><Pt code={pt} small/></div>
      <div className="slider"><div className="lab"><span>Trip Distance</span><b>{fmt(p.distanceKm)} km</b></div>
        <input type="range" min="3" max="300" step="1" value={p.distanceKm} onChange={set('distanceKm')}/></div>
      <div className="slider"><div className="lab"><span>Average Speed</span><b>{fmt(p.avgSpeedKph)} km/h</b></div>
        <input type="range" min="20" max="130" step="1" value={p.avgSpeedKph} onChange={set('avgSpeedKph')}/></div>
      <div className="slider"><div className="lab"><span>Driving Aggression</span><b>{Math.round(p.aggression*100)}%</b></div>
        <input type="range" min="0" max="1" step="0.01" value={p.aggression} onChange={set('aggression')}/></div>
      <div className="slider"><div className="lab"><span>Regenerative Braking</span><b style={{color:'var(--accent2)'}}>{Math.round(p.regen*100)}%</b></div>
        <input type="range" min="0" max="1" step="0.01" value={p.regen} onChange={set('regen')}/></div>
      <div className="slider"><div className="lab"><span>Ambient Parking Temp</span><b style={{color:tempHot?'var(--bad)':'inherit'}}>{fmt(p.parkTemp)}°C</b></div>
        <input type="range" min="-5" max="48" step="1" value={p.parkTemp} onChange={set('parkTemp')}/></div>
      {plugIn
        ? <label className="row small" style={{gap:8,marginTop:6,cursor:'pointer'}}>
            <input type="checkbox" checked={p.batteryFriendlyCharge} onChange={e=>setP(s=>({...s,batteryFriendlyCharge:e.target.checked}))}/>
            Charged gently to 80% on AC (battery-friendly bonus +{CFG.CHARGE_BONUS} pts)</label>
        : <div className="small muted" style={{marginTop:8}}>Self-charging hybrid — no plug-in charging.</div>}
      {tempHot
        ? <div className="warnbox" style={{marginTop:16}}><Icon name="alert" size={18}/>
            <div><b>Heat warning.</b> Parking at {fmt(p.parkTemp)}°C accelerates battery degradation. Seek shade or pre-condition the cabin to protect your pack’s State of Health.</div></div>
        : <div className="okbox" style={{marginTop:16}}><Icon name="shield" size={18}/>
            <div><b>Battery-safe conditions.</b> Parking temperature is within the healthy range for long pack life.</div></div>}
      <button className="btn row" style={{marginTop:18,width:'100%',justifyContent:'center',gap:8}} disabled={busy} onClick={log}>
        {busy?<span className="spin"/>:<><Icon name="play" size={16}/>{`Log this drive  ·  +${fmt(r.pointsEarned)} credits`}</>}</button>
    </div>
    <div className="grid" style={{gap:16}}>
      <div className="grid g2">
        <div className="card stat"><div className="row between"><div className="lab">Net Consumption</div><span className="cardicon"><Icon name="gauge" size={19}/></span></div>
          <div className="val">{fmt(r.consumption,1)}<span className="unit">kWh/100km</span></div>
          <div className="delta" style={{color:p.regen>0.5?'var(--accent)':'var(--muted)'}}>Regen recovering {Math.round(p.regen*100)}% of losses</div></div>
        <div className="card stat"><div className="row between"><div className="lab">Eco Score</div><span className="cardicon"><Icon name="flag" size={19}/></span></div>
          <div className="val" style={{color:gradeColor(r.ecoScore)}}>{r.ecoScore}<span className="unit">/100 · {gradeOf(r.ecoScore)}</span></div>
          <div className="delta">{r.harshA+r.harshB} harsh events predicted</div></div>
      </div>
      <div className="card"><h3>Real-Time Impact of This Drive</h3>
        <div className="grid g3" style={{gap:12}}>
          <div><div className="lab small muted">CO₂ Saved</div><div className="b" style={{fontSize:22}}>{fmt(r.co2SavedKg,1)} <span className="unit">kg</span></div></div>
          <div><div className="lab small muted">Money Saved</div><div className="b" style={{fontSize:22,color:'var(--accent)'}}>${fmt(r.fuelSaved,2)}</div></div>
          <div><div className="lab small muted">Energy Used</div><div className="b" style={{fontSize:22}}>{fmt(r.energyUsedKwh,1)} <span className="unit">kWh</span></div></div>
        </div>
        <div className="small muted" style={{marginTop:14,lineHeight:1.6}}>
          The <b>Regen Incentive Loop</b>: raising regenerative braking offsets the efficiency penalty of aggressive driving — recovering range <i>and</i> multiplying your Eco-Credits. That’s the daily reason to keep optimising.
        </div>
      </div>
      <div className="card"><h3>Eco-Credits Breakdown</h3>
        {[['Distance',Math.round(p.distanceKm*CFG.POINTS_PER_KM)],
          ['Eco-driving bonus',Math.round(r.ecoScore/100*CFG.ECO_BONUS)],
          ['CO₂ avoided',Math.round(r.co2SavedKg*CFG.POINTS_PER_KG)],
          ['Battery-friendly charge',r.chargeBonus]].map(([k,val])=>
          <div className="row between" key={k} style={{padding:'7px 0',borderBottom:'1px solid var(--line2)'}}>
            <span className="small muted">{k}</span><span className="b">+{fmt(val)}</span></div>)}
        <div className="row between" style={{paddingTop:10}}><span className="b">Total this drive</span>
          <span className="b" style={{color:'var(--accent)',fontSize:18}}>+{fmt(r.pointsEarned)}</span></div>
      </div>
    </div>
  </div>;
}

function BatteryView({me}){
  const [data,setData]=useState(null);
  const v=me.primaryVehicle;
  useEffect(()=>{if(v)api('/api/battery/'+v.id).then(setData);},[me]);
  if(!data) return <div className="card muted">Loading battery diagnostics…</div>;
  const {report:b,vehicle}=data;
  const pt=vehicle.powertrain||'BEV'; const plugIn=(POWERTRAINS[pt]||POWERTRAINS.BEV).plugIn;
  const habit=(label,val,unit,good)=> <div style={{marginBottom:14}}>
    <div className="row between small"><span className="muted">{label}</span><span className="b">{val}{unit}</span></div>
    <Progress pct={good}/></div>;
  return <div className="grid g3" style={{alignItems:'start'}}>
    <div className="card" style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
      <div className="row between" style={{width:'100%'}}><h3>State of Health</h3><Pt code={pt} small/></div>
      <Gauge value={b.soh} color="grad" label="SoH"/>
      <div className="small muted" style={{marginTop:6,textAlign:'center'}}>{plugIn?'Rated electric range now':'Hybrid pack capacity'}<br/><b style={{color:'var(--txt)',fontSize:18}}>{fmt(b.projection.rangeNowKm)} km</b> <span className="muted">of {fmt(b.projection.rangeNewKm)} km</span></div>
    </div>
    <div className="card" style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
      <h3 style={{alignSelf:'flex-start'}}>Battery Care Score</h3>
      <Gauge value={b.careScore} color={b.careScore>=80?'#0aa472':b.careScore>=60?'#c47a08':'#dc4a5c'} label="care"/>
      <div className="pill good" style={{marginTop:6}}>{b.careScore>=80?'Excellent habits':b.careScore>=60?'Room to improve':'At-risk habits'}</div>
    </div>
    <div className="card"><h3>Warranty &amp; Projection</h3>
      <div className="row between" style={{marginBottom:10}}><span className="muted small">Warranty status</span>
        <span className={'pill '+(b.warranty.active?'good':'bad')}>{b.warranty.active?'Active':'Expired'}</span></div>
      <div style={{marginBottom:12}}><div className="row between small"><span className="muted">Years used</span><span>{b.warranty.yearsUsed}/{b.warranty.yearsTotal}</span></div>
        <Progress pct={b.warranty.yearsUsed/b.warranty.yearsTotal*100}/></div>
      <div style={{marginBottom:12}}><div className="row between small"><span className="muted">Distance</span><span>{fmt(b.warranty.kmUsed)}/{fmt(b.warranty.kmTotal)} km</span></div>
        <Progress pct={b.warranty.kmUsed/b.warranty.kmTotal*100}/></div>
      <div className="okbox small" style={{marginTop:10}}><Icon name="trend" size={17}/><div>Fading ~<b>{b.projection.fadePerYearPct}%/yr</b>. Est. <b>{b.projection.estimatedYearsRemaining} years</b> until the {b.warranty.sohFloor}% warranty floor.</div></div>
    </div>
    <div className="card" style={{gridColumn:'span 2'}}><h3>Your Charging &amp; Usage Habits</h3>
      {plugIn
        ? habit('DC fast-charging share',b.habits.fastChargePct,'%',100-b.habits.fastChargePct)
        : <div className="okbox small" style={{marginBottom:14}}><Icon name="car" size={17}/><div>Self-charging hybrid — the pack is managed automatically with no plug-in charging.</div></div>}
      {plugIn&&habit('Typical charge ceiling',b.habits.avgChargeCeiling,'%',100-Math.max(0,b.habits.avgChargeCeiling-80)*5)}
      {habit('Avg pack temperature',b.habits.avgTempC,'°C',100-Math.max(0,b.habits.avgTempC-25)*4)}
      {habit('Deep-discharge share',b.habits.deepDischargePct,'%',100-b.habits.deepDischargePct*3)}
      <div className="small muted">Lifetime equivalent cycles: <b>{fmt(b.habits.cycleCount,0)}</b></div>
    </div>
    <div className="card"><h3>Personalised Actions</h3>
      {b.recommendations.map(r=><div key={r.id} className={r.impact==='low'?'okbox':'warnbox'} style={{marginBottom:10}}>
        <Icon name={recIcon(r.impact)} size={18}/>
        <div>{r.text} {r.impact!=='low'&&<span className="pill warn" style={{marginLeft:4}}>{r.impact} impact</span>}</div></div>)}
    </div>
  </div>;
}

function Impact({me}){
  const i=me.impact; const pv=me.primaryVehicle||{};
  return <div className="grid" style={{gap:16}}>
    <div className="grid g4">
      <Stat label="Total CO₂ Avoided" value={fmt(i.totalCo2SavedKg)} unit="kg" icon="leaf"/>
      <Stat label="Trees / Year Equiv." value={fmt(i.treesEquivalent,1)} unit="" icon="tree"/>
      <Stat label="Petrol Avoided" value={fmt(i.fuelLitresAvoided)} unit="L" icon="droplet"/>
      <Stat label="Money Saved" value={'$'+fmt(i.costSaved)} unit="" icon="wallet"/>
    </div>
    <div className="grid g2">
      <div className="card"><div className="row between"><h3>What this means</h3><Pt code={pv.powertrain||'BEV'} small/></div>
        <div className="okbox" style={{marginBottom:12}}><Icon name="globe" size={19}/><div>You’ve kept <b>{fmt(i.totalCo2SavedKg)} kg</b> of CO₂ out of the atmosphere vs an equivalent petrol car — the yearly work of <b>{fmt(i.treesEquivalent,1)} mature trees</b>.</div></div>
        <div className="okbox" style={{marginBottom:12}}><Icon name="droplet" size={19}/><div>That’s <b>{fmt(i.fuelLitresAvoided)} litres</b> of petrol avoided across <b>{fmt(i.totalDistanceKm)} km</b> of electrified driving.</div></div>
        <div className="okbox"><Icon name="bulb" size={19}/><div>Energy used: <b>{fmt(i.totalEnergyKwh)} kWh</b> on a grid rated at <b>{i.gridIntensity} kg CO₂/kWh</b>. Cleaner grids push these savings even higher.</div></div>
      </div>
      <div className="card"><h3>Distance vs Emissions Avoided</h3>
        <div className="row between small muted" style={{marginBottom:8}}><span>{fmt(i.totalDistanceKm)} km driven</span><span>{fmt(i.totalCo2SavedKg)} kg saved</span></div>
        <Bars data={[{v:i.totalDistanceKm},{v:i.fuelLitresAvoided*5},{v:i.totalCo2SavedKg*3},{v:i.costSaved*4},{v:i.treesEquivalent*30}]} />
        <div className="row between small muted" style={{marginTop:8}}>
          <span>km</span><span>fuel</span><span>CO₂</span><span>$</span><span>trees</span></div>
      </div>
    </div>
  </div>;
}

function Rewards({me,userId,reload,toast}){
  const [data,setData]=useState(null);
  const [busy,setBusy]=useState(null);
  const load=()=>api('/api/rewards?userId='+userId).then(setData);
  useEffect(()=>{load();},[me,userId]);
  if(!data) return <div className="card muted">Loading rewards…</div>;
  const redeem=async(item)=>{
    if(data.balance<item.cost){toast('Not enough Eco-Credits yet — keep driving!');return;}
    setBusy(item.id);
    try{const res=await api('/api/rewards/redeem',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({itemId:item.id,userId})});
      toast(`Redeemed ${item.name} · code ${res.redemption.code}`);await load();reload();
    }catch(e){toast('Error: '+e.message);}finally{setBusy(null);}
  };
  return <div className="grid" style={{gap:16}}>
    <div className="grid g3">
      <Stat label="Redeemable Balance" value={fmt(data.balance)} unit="pts" icon="star"/>
      <Stat label="Tier" value={data.tier.name} unit="" icon="shield" delta={`${data.tier.multiplier}× earning multiplier`}/>
      <Stat label="Rewards Redeemed" value={fmt(data.redemptions.length)} unit="" icon="gift"/>
    </div>
    <div className="card"><h3>Rewards Catalogue</h3>
      <div className="grid g4">
        {data.catalog.map(item=>{const can=data.balance>=item.cost;return(
          <div className="card reward" key={item.id} style={{background:'var(--panel2)'}}>
            <span className="rewardic"><Icon name={item.icon} size={22}/></span>
            <div className="b">{item.name}</div>
            <div className="small muted" style={{minHeight:34,lineHeight:1.4}}>{item.desc}</div>
            <div className="row between"><span className="pill good">{item.category}</span><span className="b">{fmt(item.cost)} pts</span></div>
            <button className="btn" style={{opacity:can?1:.5}} disabled={!can||busy===item.id} onClick={()=>redeem(item)}>
              {busy===item.id?<span className="spin"/>:can?'Redeem':'Need '+fmt(item.cost-data.balance)+' more'}</button>
          </div>);})}
      </div>
    </div>
    {data.redemptions.length>0&&<div className="card"><h3>Redemption History</h3>
      <div className="tablewrap"><table><thead><tr><th>Reward</th><th>Code</th><th>Cost</th><th>Date</th></tr></thead><tbody>
        {data.redemptions.map(r=><tr key={r.id}><td className="b">{r.name}</td><td><code>{r.code}</code></td><td>{fmt(r.cost)} pts</td><td className="muted">{new Date(r.redeemedAt).toLocaleDateString()}</td></tr>)}
      </tbody></table></div></div>}
  </div>;
}

function Challenges({me,userId}){
  const [data,setData]=useState(null);
  useEffect(()=>{api('/api/challenges?userId='+userId).then(setData);},[me,userId]);
  if(!data) return <div className="card muted">Loading challenges…</div>;
  return <div className="grid" style={{gap:16}}>
    <div className="grid g2">
      {data.challenges.map(c=><div className="card" key={c.id}>
        <div className="row between"><div><div className="b" style={{fontSize:16}}>{c.title}</div><div className="small muted">{c.desc}</div></div>
          <span className="pill good">+{c.reward} pts</span></div>
        <div style={{margin:'14px 0 8px'}}><Progress pct={c.progress}/></div>
        <div className="row between small"><span className="muted">{c.metric}</span>
          <span className={'b '+(c.progress>=100?'':'muted')} style={c.progress>=100?{color:'var(--accent)'}:{}}>{c.progress>=100?'Complete':c.progress+'%'}</span></div>
      </div>)}
    </div>
    <div className="card"><h3>Badge Collection</h3>
      <div className="grid g4">
        {data.badges.map(b=><div key={b.id} className={'badge'+(b.earned?' earned':'')}>
          <span className="bic"><Icon name={b.icon} size={26}/></span><div className="bn">{b.name}</div><div className="bd">{b.desc}</div>
          {b.earned&&<span className="pill good small">Earned</span>}</div>)}
      </div>
    </div>
  </div>;
}

function Leaderboard({me,userId}){
  const [metric,setMetric]=useState('points');
  const [data,setData]=useState(null);
  useEffect(()=>{api('/api/leaderboard?metric='+metric).then(setData);},[metric,me]);
  const cols={points:'Eco-Credits',co2SavedKg:'CO₂ Saved (kg)',avgEco:'Avg Eco',distanceKm:'Distance (km)'};
  return <div className="grid" style={{gap:16}}>
    <div className="card">
      <div className="row between" style={{marginBottom:12,flexWrap:'wrap',gap:10}}><h3 style={{margin:0}}>Community Leaderboard</h3>
        <div className="seg">{Object.keys(cols).map(k=><button key={k} className={metric===k?'on':''} onClick={()=>setMetric(k)}>{cols[k].split(' ')[0]}</button>)}</div></div>
      {!data?<div className="muted">Loading…</div>:
      <div className="tablewrap"><table><thead><tr><th>#</th><th>Driver</th><th>Tier</th><th>{cols[metric]}</th><th>Eco-Credits</th><th>CO₂</th></tr></thead><tbody>
        {data.entries.map(e=><tr key={e.userId} className={e.userId===userId?'me':''}>
          <td><div className="ranknum" style={e.rank<=3?{background:['#cf9f2b','#9aa5b1','#b08d57'][e.rank-1],color:'#fff'}:{}}>{e.rank}</div></td>
          <td className="b">{e.name}{e.userId===userId&&<span className="pill good" style={{marginLeft:8}}>Viewing</span>}</td>
          <td><span className="pill good">{e.tier}</span></td>
          <td className="b">{metric==='co2SavedKg'?fmt(e.co2SavedKg):metric==='distanceKm'?fmt(e.distanceKm):metric==='avgEco'?e.avgEco:fmt(e.points)}</td>
          <td>{fmt(e.points)}</td><td className="muted">{fmt(e.co2SavedKg)} kg</td>
        </tr>)}
      </tbody></table></div>}
      <div className="small muted" style={{marginTop:12}}>Friendly competition and weekly resets are what turn a tracking app into a daily habit.</div>
    </div>
  </div>;
}

/* ===================== APP SHELL ===================== */
const NAV=[
  ['dash','Dashboard','grid'],['lab','Simulator Lab','sliders'],['battery','Battery Health','battery'],
  ['impact','Climate Impact','leaf'],['rewards','Rewards','gift'],['challenges','Challenges','target'],['board','Leaderboard','trophy'],
];
const TITLES={dash:['Dashboard','Your live telematics, impact and loyalty snapshot'],
  lab:['Simulator Lab','Tune your drive and watch wallet, battery and credits respond in real time'],
  battery:['Battery Health','State of Health, warranty and personalised pack-care diagnostics'],
  impact:['Climate Impact','Every electrified kilometre, translated into real-world savings'],
  rewards:['Rewards','Turn your Eco-Credits into charging, service and impact perks'],
  challenges:['Challenges & Badges','Weekly goals and milestones that keep driving rewarding'],
  board:['Leaderboard','See how you stack up against the DrivEv community']};

const TOUR=[
  ['dash','Your impact at a glance','CO₂ avoided, Eco-Credits, driving grade and battery health — all live and personalised to the driver.'],
  ['lab','The Simulator Lab','Drag the sliders and watch energy, money, battery stress and credits respond instantly. This real-time loop is the daily hook.'],
  ['battery','Protect the battery','State of Health, warranty tracking and tailored charging advice turn passive data into active asset protection.'],
  ['impact','Real-world savings','Every electrified kilometre becomes CO₂, fuel and money saved — the tangible payoff that keeps the app open.'],
  ['rewards','Spend Eco-Credits','Redeem real partner perks: charging sessions, car washes, coffee, service credit and more.'],
  ['challenges','Build the habit','Weekly challenges, streaks and badges turn one-off tracking into a daily routine.'],
  ['board','Community leaderboard','Friendly competition and weekly resets drive engagement across the whole fleet.'],
];

function Brand({small}){
  return <div className="brand">
    <div className="logo"><Icon name="bolt" size={small?18:21} stroke={2.2}/></div>
    <div><b>FLUX <span className="ver">2.0</span></b><small>by DrivEv</small></div>
  </div>;
}

function Onboarding({onDone,onTour,vehicleName}){
  const [step,setStep]=useState(0);
  useEffect(()=>{ if(step===1){const t=setTimeout(()=>setStep(2),1600); return ()=>clearTimeout(t);} },[step]);
  return <div className="overlay"><div className="modal">
    {step===0&&<>
      <div className="logo-xl"><Icon name="bolt" size={38} stroke={2.2}/></div>
      <h2>Welcome to FLUX 2.0</h2>
      <p>DrivEv’s connected-EV platform — turning every electrified kilometre into real benefit, and keeping drivers coming back.</p>
      <div className="feat"><span className="featic"><Icon name="sliders" size={18}/></span><div><b>Live telematics &amp; eco-coaching</b> — see exactly how you drive.</div></div>
      <div className="feat"><span className="featic"><Icon name="battery" size={18}/></span><div><b>Battery-life protection</b> — guard your range and resale value.</div></div>
      <div className="feat"><span className="featic"><Icon name="star" size={18}/></span><div><b>Eco-Credits &amp; real rewards</b> — charging, car washes, coffee and more.</div></div>
      <button className="btn" onClick={()=>setStep(1)}>Connect my vehicle</button>
      <button className="btn ghost" onClick={onDone}>Skip intro</button>
    </>}
    {step===1&&<>
      <div className="spin-xl"/>
      <h2>Connecting to your vehicle…</h2>
      <p>Securely pairing telematics, battery and charging data.</p>
    </>}
    {step===2&&<>
      <div className="connected"><Icon name="check" size={34} stroke={2.4}/></div>
      <h2>Connected: {vehicleName||'your DrivEv'}</h2>
      <p>Trip history synced. Your impact, battery health and Eco-Credits are ready to explore.</p>
      <button className="btn" onClick={onTour}>Take the 60-second tour</button>
      <button className="btn ghost" onClick={onDone}>Explore on my own</button>
    </>}
  </div></div>;
}

function Tour({step,setView,next,prev,done}){
  const [v,title,body]=TOUR[step];
  useEffect(()=>{setView(v);},[step]);
  const last=step===TOUR.length-1;
  return <div className="tourcard">
    <div className="small b" style={{color:'var(--accent)',letterSpacing:'.5px'}}>GUIDED TOUR · {step+1} of {TOUR.length}</div>
    <h3>{title}</h3>
    <p>{body}</p>
    <div className="row between">
      <button className="btn ghost small" onClick={done}>Skip tour</button>
      <div className="row" style={{gap:8}}>
        {step>0&&<button className="btn ghost small" onClick={prev}>Back</button>}
        <button className="btn small" onClick={last?done:next}>{last?'Finish':'Next'}</button>
      </div>
    </div>
  </div>;
}

function App(){
  const [view,setView]=useState('dash');
  const [me,setMe]=useState(null);
  const [userId,setUserId]=useState('u_you');
  const [personas,setPersonas]=useState([]);
  const [toastMsg,setToastMsg]=useState(null);
  const [onboard,setOnboard]=useState(()=>{try{return !localStorage.getItem('flux2_onboarded');}catch(e){return true;}});
  const [tourStep,setTourStep]=useState(-1);
  const tRef=useRef();
  const load=(uid)=>api('/api/me?userId='+(uid||userId)).then(setMe).catch(e=>setToastMsg('Load error: '+e.message));
  useEffect(()=>{load(userId);},[userId]);
  useEffect(()=>{api('/api/personas').then(setPersonas).catch(()=>{});},[]);
  const toast=(m)=>{setToastMsg(m);clearTimeout(tRef.current);tRef.current=setTimeout(()=>setToastMsg(null),4200);};
  const finishOnboard=()=>{try{localStorage.setItem('flux2_onboarded','1');}catch(e){} setOnboard(false);};
  if(!me) return <div className="loading"><div className="spin"/>Loading FLUX 2.0…</div>;
  const [title,sub]=TITLES[view];
  const pv=me.primaryVehicle||{};
  return <div className="app">
    <aside className="side">
      <Brand/>
      <nav className="nav">{NAV.map(([k,label,ic])=>
        <button key={k} className={view===k?'on':''} onClick={()=>setView(k)}><Icon name={ic} size={19}/>{label}</button>)}</nav>
      <div className="side-foot">
        <div className="row" style={{gap:8,marginBottom:4}}><span className="b" style={{color:'var(--txt)'}}>{pv.make+' '+pv.model}</span><Pt code={pv.powertrain||'BEV'} small/></div>
        <div>{fmt(pv.odometerKm)} km · {pv.batteryCapacityKwh} kWh</div>
        <button className="btn ghost small row" style={{marginTop:12,width:'100%',justifyContent:'center',gap:6}} onClick={()=>{setView('dash');setTourStep(0);}}><Icon name="refresh" size={15}/>Replay tour</button>
      </div>
    </aside>
    <main className="main">
      <div className="topbar">
        <div className="mobilebrand"><Brand small/></div>
        <div className="pagetitle"><h1>{title}</h1><p>{sub}</p></div>
        <div className="chips">
          <select className="select" value={userId} onChange={e=>setUserId(e.target.value)} title="Switch demo persona">
            {personas.map(p=><option key={p.id} value={p.id}>{p.name} · {p.powertrain} — {p.persona}</option>)}
          </select>
          <div className="chip"><Icon name="flame" size={17} className="accent"/><div><b>{me.loyalty.streak}</b> <span className="sub">streak</span></div></div>
          <div className="chip"><Icon name="star" size={17} className="accent"/><div><b>{fmt(me.loyalty.balance)}</b> <span className="sub">credits</span></div></div>
          <div className="tierbadge" style={{background:me.loyalty.tier.color}}>{me.loyalty.tier.name}</div>
        </div>
      </div>
      {view==='dash'&&<Dashboard me={me} go={setView}/>}
      {view==='lab'&&<Lab me={me} userId={userId} onLogged={setMe} toast={toast}/>}
      {view==='battery'&&<BatteryView me={me}/>}
      {view==='impact'&&<Impact me={me}/>}
      {view==='rewards'&&<Rewards me={me} userId={userId} reload={()=>load(userId)} toast={toast}/>}
      {view==='challenges'&&<Challenges me={me} userId={userId}/>}
      {view==='board'&&<Leaderboard me={me} userId={userId}/>}
    </main>
    <nav className="mobilenav">{NAV.map(([k,label,ic])=>
      <button key={k} className={view===k?'on':''} onClick={()=>setView(k)}><Icon name={ic} size={20}/><span>{label.split(' ')[0]}</span></button>)}</nav>
    {onboard&&<Onboarding onDone={finishOnboard} vehicleName={pv.make+' '+pv.model} onTour={()=>{finishOnboard();setView('dash');setTourStep(0);}}/>}
    {tourStep>=0&&<Tour step={tourStep} setView={setView} next={()=>setTourStep(s=>s+1)} prev={()=>setTourStep(s=>s-1)} done={()=>setTourStep(-1)}/>}
    {toastMsg&&<div className="toast"><div className="b" style={{marginBottom:2}}>FLUX 2.0</div><div className="small">{toastMsg}</div></div>}
  </div>;
}
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
