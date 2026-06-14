const {useState,useEffect,useMemo,useRef} = React;

/* ---------- shared formatting + client-side model (mirrors lib/*) ---------- */
const fmt = (n,d=0)=> (n==null||isNaN(n))?'—':Number(n).toLocaleString(undefined,{maximumFractionDigits:d,minimumFractionDigits:d>0?0:0});
const api = async (url,opts)=>{const r=await fetch(url,opts);if(!r.ok)throw new Error((await r.json().catch(()=>({}))).error||r.status);return r.json();};
const CFG = {
  ICE_CO2_PER_KM:0.192, GRID_CO2_PER_KWH:0.233, ICE_FUEL_PER_KM:0.071, CO2_PER_TREE_YEAR:21,
  EFF_TARGET:15, EFF_CEIL:28, POINTS_PER_KM:1, ECO_BONUS:60, POINTS_PER_KG:2, CHARGE_BONUS:25,
};
// Live trip computation for the Simulator Lab — mirrors lib/simulator.tripFromParams.
function computeTrip(p){
  const {distanceKm,aggression,regen,avgSpeedKph,batteryFriendlyCharge}=p;
  const speedPenalty=Math.max(0,avgSpeedKph-90)*0.05;
  const aggrPenalty=aggression*7;
  const regenSaving=aggrPenalty*regen*0.6;
  const consumption=Math.max(11,16+speedPenalty+aggrPenalty-regenSaving);
  const energyUsedKwh=consumption/100*distanceKm;
  const iceCo2=distanceKm*CFG.ICE_CO2_PER_KM, evCo2=energyUsedKwh*CFG.GRID_CO2_PER_KWH;
  const co2SavedKg=Math.max(0,iceCo2-evCo2);
  const fuelSaved=distanceKm*CFG.ICE_FUEL_PER_KM*1.7 - energyUsedKwh*0.28;
  // eco score (mirrors lib/scoring)
  const effRatio=Math.min(1,Math.max(0,(CFG.EFF_CEIL-consumption)/(CFG.EFF_CEIL-CFG.EFF_TARGET)));
  const harshB=Math.max(0,Math.round(distanceKm/14*aggression*(1-regen*0.7)));
  const harshA=Math.max(0,Math.round(distanceKm/12*aggression));
  let smooth=30-harshB*4-harshA*4; smooth=Math.min(30,Math.max(0,smooth));
  const ecoScore=Math.round(Math.min(100,effRatio*70+smooth));
  const pts=Math.round(distanceKm*CFG.POINTS_PER_KM + ecoScore/100*CFG.ECO_BONUS + co2SavedKg*CFG.POINTS_PER_KG + (batteryFriendlyCharge?CFG.CHARGE_BONUS:0));
  return {consumption,energyUsedKwh,co2SavedKg,fuelSaved,ecoScore,pointsEarned:pts,harshB,harshA};
}
function gradeOf(s){return s>=90?'A+':s>=80?'A':s>=70?'B':s>=60?'C':s>=50?'D':'E';}
function gradeColor(s){return s>=80?'#0aa472':s>=60?'#108fb0':s>=50?'#c47a08':'#dc4a5c';}

/* ---------- tiny SVG chart primitives ---------- */
function Gauge({value,max=100,size=140,label,unit,color}){
  const r=size/2-12, c=2*Math.PI*r, pct=Math.min(1,value/max);
  color=color||'#19e3a5';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs><linearGradient id="gg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#19e3a5"/><stop offset="100%" stopColor="#2dd4ef"/></linearGradient></defs>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e6ecf3" strokeWidth="11"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color==='grad'?'url(#gg)':color} strokeWidth="11"
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c*(1-pct)}
        transform={`rotate(-90 ${size/2} ${size/2})`} style={{transition:'stroke-dashoffset .6s'}}/>
      <text x="50%" y="47%" textAnchor="middle" fontSize="26" fontWeight="800" fill="#0f1d2e">{fmt(value,value<10?1:0)}</text>
      <text x="50%" y="63%" textAnchor="middle" fontSize="11" fill="#5b6b7d">{label}</text>
    </svg>
  );
}
function AreaChart({data,height=120,color='#19e3a5'}){
  const w=560; const max=Math.max(...data,1); const min=0;
  if(!data.length) return <div className="muted small">No data</div>;
  const step=w/(data.length-1||1);
  const pts=data.map((v,i)=>[i*step, height-((v-min)/(max-min||1))*(height-10)-5]);
  const path=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  const area=path+` L ${w} ${height} L 0 ${height} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} preserveAspectRatio="none">
      <defs><linearGradient id="ar" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.35"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      <path d={area} fill="url(#ar)"/>
      <path d={path} fill="none" stroke={color} strokeWidth="2.5"/>
    </svg>
  );
}
function Bars({data,height=120,color='#2dd4ef'}){
  const max=Math.max(...data.map(d=>d.v),1); const bw=100/data.length;
  return (
    <svg viewBox="0 0 100 100" width="100%" height={height} preserveAspectRatio="none">
      {data.map((d,i)=>{const h=(d.v/max)*92;return(
        <rect key={i} x={i*bw+bw*0.18} y={100-h} width={bw*0.64} height={h} rx="1.2"
          fill={color} opacity={0.55+0.45*(d.v/max)}/>);})}
    </svg>
  );
}

/* ---------- shells ---------- */
function Stat({label,value,unit,icon,delta}){
  return <div className="card stat"><div className="glow"/>
    <div className="row between"><div className="lab">{label}</div><div className="emoji-ic">{icon}</div></div>
    <div className="val">{value}<span className="unit">{unit}</span></div>
    {delta&&<div className="delta">{delta}</div>}
  </div>;
}
function Progress({pct}){return <div className="bar"><i style={{width:Math.min(100,Math.max(0,pct))+'%'}}/></div>;}

/* ===================== VIEWS ===================== */
function Dashboard({me,go}){
  const trips=me.recentTrips||[];
  const series=useMemo(()=>{
    // cumulative CO2 over recent trips (oldest->newest)
    const ordered=[...trips].reverse(); let acc=0; return ordered.map(t=>acc+= (t.co2SavedKg||0));
  },[me]);
  const b=me.battery;
  return <div className="grid" style={{gap:16}}>
    <div className="grid g4">
      <Stat label="CO₂ Avoided" value={fmt(me.impact.totalCo2SavedKg)} unit="kg" icon="🌍" delta={`≈ ${fmt(me.impact.treesEquivalent,1)} trees/yr`}/>
      <Stat label="Eco-Credits" value={fmt(me.loyalty.balance)} unit="pts" icon="⭐" delta={`${me.loyalty.tier.name} • ${me.loyalty.tier.multiplier}×`}/>
      <Stat label="Driving Grade" value={me.avgEcoGrade} unit="" icon="🏁" delta={`${me.avgEcoScore}/100 avg eco score`}/>
      <Stat label="Battery Health" value={fmt(b?b.soh:0,1)} unit="%" icon="🔋" delta={`${b?b.projection.estimatedYearsRemaining:0} yrs to floor`}/>
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
        </> : <div className="small muted">Top tier reached 🎉</div>}
        <div className="row" style={{marginTop:16,gap:18}}>
          <div style={{textAlign:'center'}}><div className="b" style={{fontSize:22}}>🔥 {me.loyalty.streak}</div><div className="small muted">day streak</div></div>
          <div style={{textAlign:'center'}}><div className="b" style={{fontSize:22}}>{me.loyalty.badges.filter(x=>x.earned).length}</div><div className="small muted">badges</div></div>
        </div>
      </div>
    </div>
    <div className="grid g2">
      <div className="card"><div className="row between"><h3>Recent Trips</h3><button className="btn ghost small" onClick={()=>go('lab')}>+ Drive in Lab</button></div>
        {trips.slice(0,6).map(t=><div className="trip" key={t.id}>
          <div className="grade" style={{background:gradeColor(t.ecoScore)+'22',color:gradeColor(t.ecoScore)}}>{gradeOf(t.ecoScore)}</div>
          <div style={{flex:1}}><div className="b">{t.profile}</div>
            <div className="small muted">{fmt(t.distanceKm,1)} km • {fmt(t.energyUsedKwh,1)} kWh • {new Date(t.endedAt).toLocaleDateString()}</div></div>
          <div style={{textAlign:'right'}}><div className="b" style={{color:'var(--accent)'}}>+{fmt(t.pointsEarned)}</div><div className="small muted">{fmt(t.co2SavedKg,1)} kg CO₂</div></div>
        </div>)}
        {!trips.length&&<div className="muted small">No trips yet — open the Simulator Lab.</div>}
      </div>
      <div className="card"><h3>Battery Care Tips</h3>
        {b&&b.recommendations.map(r=><div key={r.id} className={r.impact==='low'?'okbox':'warnbox'} style={{marginBottom:10}}>
          <span style={{fontSize:18}}>{r.impact==='low'?'✅':r.impact==='high'?'⚠️':'💡'}</span><div>{r.text}</div></div>)}
        <button className="btn ghost" style={{marginTop:6}} onClick={()=>go('battery')}>Full battery report →</button>
      </div>
    </div>
  </div>;
}

function Lab({me,onLogged,toast}){
  const v=me.primaryVehicle||{};
  const [p,setP]=useState({distanceKm:25,aggression:0.35,regen:0.6,avgSpeedKph:60,parkTemp:28,batteryFriendlyCharge:true});
  const [busy,setBusy]=useState(false);
  const r=useMemo(()=>computeTrip(p),[p]);
  const set=(k)=>(e)=>setP(s=>({...s,[k]:parseFloat(e.target.value)}));
  const tempHot=p.parkTemp>=35;
  const log=async()=>{
    setBusy(true);
    try{
      const res=await api('/api/trips/simulate',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({params:{distanceKm:p.distanceKm,aggression:p.aggression,regen:p.regen,avgSpeedKph:p.avgSpeedKph,batteryFriendlyCharge:p.batteryFriendlyCharge}})});
      toast(`Drive logged • +${fmt(res.trip.pointsEarned)} Eco-Credits • Grade ${res.trip.feedback.grade}`);
      onLogged(res.profile);
    }catch(e){toast('Error: '+e.message);}finally{setBusy(false);}
  };
  return <div className="grid g2" style={{alignItems:'start'}}>
    <div className="card">
      <h3>Drive Configuration — {v.make} {v.model}</h3>
      <div className="slider"><div className="lab"><span>Trip Distance</span><b>{fmt(p.distanceKm)} km</b></div>
        <input type="range" min="3" max="300" step="1" value={p.distanceKm} onChange={set('distanceKm')}/></div>
      <div className="slider"><div className="lab"><span>Average Speed</span><b>{fmt(p.avgSpeedKph)} km/h</b></div>
        <input type="range" min="20" max="130" step="1" value={p.avgSpeedKph} onChange={set('avgSpeedKph')}/></div>
      <div className="slider"><div className="lab"><span>Driving Aggression</span><b>{Math.round(p.aggression*100)}%</b></div>
        <input type="range" min="0" max="1" step="0.01" value={p.aggression} onChange={set('aggression')}/></div>
      <div className="slider"><div className="lab"><span>Regenerative Braking</span><b style={{color:'#2dd4ef'}}>{Math.round(p.regen*100)}%</b></div>
        <input type="range" min="0" max="1" step="0.01" value={p.regen} onChange={set('regen')}/></div>
      <div className="slider"><div className="lab"><span>Ambient Parking Temp</span><b style={{color:tempHot?'var(--bad)':'inherit'}}>{fmt(p.parkTemp)}°C</b></div>
        <input type="range" min="-5" max="48" step="1" value={p.parkTemp} onChange={set('parkTemp')}/></div>
      <label className="row small" style={{gap:8,marginTop:6,cursor:'pointer'}}>
        <input type="checkbox" checked={p.batteryFriendlyCharge} onChange={e=>setP(s=>({...s,batteryFriendlyCharge:e.target.checked}))}/>
        Charged gently to 80% on AC (battery-friendly bonus +{CFG.CHARGE_BONUS} pts)</label>
      {tempHot
        ? <div className="warnbox" style={{marginTop:16}}><span style={{fontSize:18}}>⚠️</span>
            <div><b>Heat warning.</b> Parking at {fmt(p.parkTemp)}°C accelerates battery degradation. Seek shade or pre-condition the cabin to protect your pack’s State of Health.</div></div>
        : <div className="okbox" style={{marginTop:16}}><span style={{fontSize:18}}>🛡️</span>
            <div><b>Battery-safe conditions.</b> Parking temperature is within the healthy range for long pack life.</div></div>}
      <button className="btn" style={{marginTop:18,width:'100%'}} disabled={busy} onClick={log}>
        {busy?<span className="spin"/>:`Log this drive  •  +${fmt(r.pointsEarned)} credits`}</button>
    </div>
    <div className="grid" style={{gap:16}}>
      <div className="grid g2">
        <div className="card stat"><div className="glow"/><div className="lab">Net Consumption</div>
          <div className="val">{fmt(r.consumption,1)}<span className="unit">kWh/100km</span></div>
          <div className="delta" style={{color:p.regen>0.5?'var(--accent)':'var(--muted)'}}>Regen recovering {Math.round(p.regen*100)}% of losses</div></div>
        <div className="card stat"><div className="glow"/><div className="lab">Eco Score</div>
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
          ['Battery-friendly charge',p.batteryFriendlyCharge?CFG.CHARGE_BONUS:0]].map(([k,val])=>
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
  const habit=(label,val,unit,good)=> <div style={{marginBottom:14}}>
    <div className="row between small"><span className="muted">{label}</span><span className="b">{val}{unit}</span></div>
    <Progress pct={good}/></div>;
  return <div className="grid g3" style={{alignItems:'start'}}>
    <div className="card" style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
      <h3 style={{alignSelf:'flex-start'}}>State of Health</h3>
      <Gauge value={b.soh} color="grad" label="SoH"/>
      <div className="small muted" style={{marginTop:6,textAlign:'center'}}>Rated range now<br/><b style={{color:'var(--txt)',fontSize:18}}>{fmt(b.projection.rangeNowKm)} km</b> <span className="muted">of {fmt(b.projection.rangeNewKm)} km</span></div>
    </div>
    <div className="card" style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
      <h3 style={{alignSelf:'flex-start'}}>Battery Care Score</h3>
      <Gauge value={b.careScore} color={b.careScore>=80?'#19e3a5':b.careScore>=60?'#ffb020':'#ff5d6c'} label="care"/>
      <div className="pill good" style={{marginTop:6}}>{b.careScore>=80?'Excellent habits':b.careScore>=60?'Room to improve':'At-risk habits'}</div>
    </div>
    <div className="card"><h3>Warranty & Projection</h3>
      <div className="row between" style={{marginBottom:10}}><span className="muted small">Warranty status</span>
        <span className={'pill '+(b.warranty.active?'good':'bad')}>{b.warranty.active?'Active':'Expired'}</span></div>
      <div style={{marginBottom:12}}><div className="row between small"><span className="muted">Years used</span><span>{b.warranty.yearsUsed}/{b.warranty.yearsTotal}</span></div>
        <Progress pct={b.warranty.yearsUsed/b.warranty.yearsTotal*100}/></div>
      <div style={{marginBottom:12}}><div className="row between small"><span className="muted">Distance</span><span>{fmt(b.warranty.kmUsed)}/{fmt(b.warranty.kmTotal)} km</span></div>
        <Progress pct={b.warranty.kmUsed/b.warranty.kmTotal*100}/></div>
      <div className="okbox small" style={{marginTop:10}}><span>📉</span><div>Fading ~<b>{b.projection.fadePerYearPct}%/yr</b>. Est. <b>{b.projection.estimatedYearsRemaining} years</b> until the {b.warranty.sohFloor}% warranty floor.</div></div>
    </div>
    <div className="card" style={{gridColumn:'span 2'}}><h3>Your Charging & Usage Habits</h3>
      {habit('DC fast-charging share',b.habits.fastChargePct,'%',100-b.habits.fastChargePct)}
      {habit('Typical charge ceiling',b.habits.avgChargeCeiling,'%',100-Math.max(0,b.habits.avgChargeCeiling-80)*5)}
      {habit('Avg pack temperature',b.habits.avgTempC,'°C',100-Math.max(0,b.habits.avgTempC-25)*4)}
      {habit('Deep-discharge share',b.habits.deepDischargePct,'%',100-b.habits.deepDischargePct*3)}
      <div className="small muted">Lifetime equivalent cycles: <b>{fmt(b.habits.cycleCount,0)}</b></div>
    </div>
    <div className="card"><h3>Personalised Actions</h3>
      {b.recommendations.map(r=><div key={r.id} className={r.impact==='low'?'okbox':'warnbox'} style={{marginBottom:10}}>
        <span style={{fontSize:18}}>{r.impact==='low'?'✅':r.impact==='high'?'⚠️':'💡'}</span>
        <div>{r.text} {r.impact!=='low'&&<span className="pill warn" style={{marginLeft:4}}>{r.impact} impact</span>}</div></div>)}
    </div>
  </div>;
}

function Impact({me}){
  const i=me.impact;
  return <div className="grid" style={{gap:16}}>
    <div className="grid g4">
      <Stat label="Total CO₂ Avoided" value={fmt(i.totalCo2SavedKg)} unit="kg" icon="🌍"/>
      <Stat label="Trees / Year Equiv." value={fmt(i.treesEquivalent,1)} unit="🌳" icon="🌳"/>
      <Stat label="Petrol Avoided" value={fmt(i.fuelLitresAvoided)} unit="L" icon="⛽"/>
      <Stat label="Money Saved" value={'$'+fmt(i.costSaved)} unit="" icon="💰"/>
    </div>
    <div className="grid g2">
      <div className="card"><h3>What this means</h3>
        <div className="okbox" style={{marginBottom:12}}><span style={{fontSize:20}}>🌍</span><div>You’ve kept <b>{fmt(i.totalCo2SavedKg)} kg</b> of CO₂ out of the atmosphere vs an equivalent petrol car — the yearly work of <b>{fmt(i.treesEquivalent,1)} mature trees</b>.</div></div>
        <div className="okbox" style={{marginBottom:12}}><span style={{fontSize:20}}>⛽</span><div>That’s <b>{fmt(i.fuelLitresAvoided)} litres</b> of petrol never burned across <b>{fmt(i.totalDistanceKm)} km</b> of electric driving.</div></div>
        <div className="okbox"><span style={{fontSize:20}}>💡</span><div>Energy used: <b>{fmt(i.totalEnergyKwh)} kWh</b> on a grid rated at <b>{i.gridIntensity} kg CO₂/kWh</b>. Cleaner grids push these savings even higher.</div></div>
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

function Rewards({me,reload,toast}){
  const [data,setData]=useState(null);
  const [busy,setBusy]=useState(null);
  const load=()=>api('/api/rewards').then(setData);
  useEffect(()=>{load();},[me]);
  if(!data) return <div className="card muted">Loading rewards…</div>;
  const redeem=async(item)=>{
    if(data.balance<item.cost){toast('Not enough Eco-Credits yet — keep driving!');return;}
    setBusy(item.id);
    try{const res=await api('/api/rewards/redeem',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({itemId:item.id})});
      toast(`Redeemed ${item.name}! Code ${res.redemption.code}`);await load();reload();
    }catch(e){toast('Error: '+e.message);}finally{setBusy(null);}
  };
  return <div className="grid" style={{gap:16}}>
    <div className="grid g3">
      <Stat label="Redeemable Balance" value={fmt(data.balance)} unit="pts" icon="⭐"/>
      <Stat label="Tier" value={data.tier.name} unit="" icon="🏅" delta={`${data.tier.multiplier}× earning multiplier`}/>
      <Stat label="Rewards Redeemed" value={fmt(data.redemptions.length)} unit="" icon="🎁"/>
    </div>
    <div className="card"><h3>Rewards Catalogue</h3>
      <div className="grid g4">
        {data.catalog.map(item=>{const can=data.balance>=item.cost;return(
          <div className="card reward" key={item.id} style={{background:'var(--panel2)'}}>
            <div className="ic">{item.icon}</div>
            <div className="b">{item.name}</div>
            <div className="small muted" style={{minHeight:34,lineHeight:1.4}}>{item.desc}</div>
            <div className="row between"><span className="pill good">{item.category}</span><span className="b">{fmt(item.cost)} pts</span></div>
            <button className="btn" style={{opacity:can?1:.5}} disabled={!can||busy===item.id} onClick={()=>redeem(item)}>
              {busy===item.id?<span className="spin"/>:can?'Redeem':'Need '+fmt(item.cost-data.balance)+' more'}</button>
          </div>);})}
      </div>
    </div>
    {data.redemptions.length>0&&<div className="card"><h3>Redemption History</h3>
      <table><thead><tr><th>Reward</th><th>Code</th><th>Cost</th><th>Date</th></tr></thead><tbody>
        {data.redemptions.map(r=><tr key={r.id}><td className="b">{r.name}</td><td><code>{r.code}</code></td><td>{fmt(r.cost)} pts</td><td className="muted">{new Date(r.redeemedAt).toLocaleDateString()}</td></tr>)}
      </tbody></table></div>}
  </div>;
}

function Challenges({me}){
  const [data,setData]=useState(null);
  useEffect(()=>{api('/api/challenges').then(setData);},[me]);
  if(!data) return <div className="card muted">Loading challenges…</div>;
  return <div className="grid" style={{gap:16}}>
    <div className="grid g2">
      {data.challenges.map(c=><div className="card" key={c.id}>
        <div className="row between"><div><div className="b" style={{fontSize:16}}>{c.title}</div><div className="small muted">{c.desc}</div></div>
          <span className="pill good">+{c.reward} pts</span></div>
        <div style={{margin:'14px 0 8px'}}><Progress pct={c.progress}/></div>
        <div className="row between small"><span className="muted">{c.metric}</span>
          <span className={'b '+(c.progress>=100?'':'muted')} style={c.progress>=100?{color:'var(--accent)'}:{}}>{c.progress>=100?'Complete ✓':c.progress+'%'}</span></div>
      </div>)}
    </div>
    <div className="card"><h3>Badge Collection</h3>
      <div className="grid g4">
        {data.badges.map(b=><div key={b.id} className={'badge'+(b.earned?' earned':'')}>
          <div className="bic">{b.icon}</div><div className="bn">{b.name}</div><div className="bd">{b.desc}</div>
          {b.earned&&<span className="pill good small">Earned</span>}</div>)}
      </div>
    </div>
  </div>;
}

function Leaderboard({me}){
  const [metric,setMetric]=useState('points');
  const [data,setData]=useState(null);
  useEffect(()=>{api('/api/leaderboard?metric='+metric).then(setData);},[metric]);
  const cols={points:'Eco-Credits',co2SavedKg:'CO₂ Saved (kg)',avgEco:'Avg Eco',distanceKm:'Distance (km)'};
  return <div className="grid" style={{gap:16}}>
    <div className="card">
      <div className="row between" style={{marginBottom:12}}><h3 style={{margin:0}}>Community Leaderboard</h3>
        <div className="seg">{Object.keys(cols).map(k=><button key={k} className={metric===k?'on':''} onClick={()=>setMetric(k)}>{cols[k].split(' ')[0]}</button>)}</div></div>
      {!data?<div className="muted">Loading…</div>:
      <table><thead><tr><th>#</th><th>Driver</th><th>Tier</th><th>{cols[metric]}</th><th>Eco-Credits</th><th>CO₂</th></tr></thead><tbody>
        {data.entries.map(e=><tr key={e.userId} className={e.isPrimary?'me':''}>
          <td><div className="ranknum" style={e.rank<=3?{background:['#e0b341','#9aa5b1','#b08d57'][e.rank-1],color:'#04121c'}:{}}>{e.rank}</div></td>
          <td className="b">{e.name}{e.isPrimary&&<span className="pill good" style={{marginLeft:8}}>You</span>}</td>
          <td><span className="pill good">{e.tier}</span></td>
          <td className="b">{metric==='co2SavedKg'?fmt(e.co2SavedKg):metric==='distanceKm'?fmt(e.distanceKm):metric==='avgEco'?e.avgEco:fmt(e.points)}</td>
          <td>{fmt(e.points)}</td><td className="muted">{fmt(e.co2SavedKg)} kg</td>
        </tr>)}
      </tbody></table>}
      <div className="small muted" style={{marginTop:12}}>Friendly competition + weekly resets are what turn a tracking app into a daily habit.</div>
    </div>
  </div>;
}

/* ===================== APP SHELL ===================== */
const NAV=[
  ['dash','Dashboard','▦'],['lab','Simulator Lab','🎛️'],['battery','Battery Health','🔋'],
  ['impact','Climate Impact','🌍'],['rewards','Rewards','⭐'],['challenges','Challenges','🎯'],['board','Leaderboard','🏆'],
];
const TITLES={dash:['Dashboard','Your live telematics, impact and loyalty snapshot'],
  lab:['Simulator Lab','Tune your drive and watch wallet, battery and credits respond in real time'],
  battery:['Battery Health','State of Health, warranty and personalised pack-care diagnostics'],
  impact:['Climate Impact','Every electric kilometre, translated into real-world savings'],
  rewards:['Rewards','Turn your Eco-Credits into charging, service and impact perks'],
  challenges:['Challenges & Badges','Weekly goals and milestones that keep driving rewarding'],
  board:['Leaderboard','See how you stack up against the DrivEv community']};

function App(){
  const [view,setView]=useState('dash');
  const [me,setMe]=useState(null);
  const [toastMsg,setToastMsg]=useState(null);
  const tRef=useRef();
  const load=()=>api('/api/me').then(setMe).catch(e=>setToastMsg('Load error: '+e.message));
  useEffect(()=>{load();},[]);
  const toast=(m)=>{setToastMsg(m);clearTimeout(tRef.current);tRef.current=setTimeout(()=>setToastMsg(null),4200);};
  if(!me) return <div className="loading"><div className="spin"/>Loading DrivEv Nexus…</div>;
  const [title,sub]=TITLES[view];
  return <div className="app">
    <aside className="side">
      <div className="brand"><div className="logo">D</div><div><b>DrivEv</b><small>Nexus</small></div></div>
      <nav className="nav">{NAV.map(([k,label,ic])=>
        <button key={k} className={view===k?'on':''} onClick={()=>setView(k)}><span className="ic">{ic}</span>{label}</button>)}</nav>
      <div className="side-foot">
        <div className="b" style={{color:'var(--txt)'}}>{me.primaryVehicle?me.primaryVehicle.make+' '+me.primaryVehicle.model:''}</div>
        <div>{me.primaryVehicle?fmt(me.primaryVehicle.odometerKm)+' km · '+me.primaryVehicle.batteryCapacityKwh+' kWh':''}</div>
        <div style={{marginTop:8}}>Telematics + battery + rewards in one loop.</div>
      </div>
    </aside>
    <main className="main">
      <div className="topbar">
        <div className="pagetitle"><h1>{title}</h1><p>{sub}</p></div>
        <div className="chips">
          <div className="chip"><span className="emoji-ic">🔥</span><div><b>{me.loyalty.streak}</b> <span className="sub">day streak</span></div></div>
          <div className="chip"><span className="emoji-ic">⭐</span><div><b>{fmt(me.loyalty.balance)}</b> <span className="sub">credits</span></div></div>
          <div className="tierbadge" style={{background:me.loyalty.tier.color}}>{me.loyalty.tier.name}</div>
        </div>
      </div>
      {view==='dash'&&<Dashboard me={me} go={setView}/>}
      {view==='lab'&&<Lab me={me} onLogged={setMe} toast={toast}/>}
      {view==='battery'&&<BatteryView me={me}/>}
      {view==='impact'&&<Impact me={me}/>}
      {view==='rewards'&&<Rewards me={me} reload={load} toast={toast}/>}
      {view==='challenges'&&<Challenges me={me}/>}
      {view==='board'&&<Leaderboard me={me}/>}
    </main>
    {toastMsg&&<div className="toast"><div className="b" style={{marginBottom:2}}>DrivEv Nexus</div><div className="small">{toastMsg}</div></div>}
  </div>;
}
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
